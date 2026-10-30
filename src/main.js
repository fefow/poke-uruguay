// Boot: loader -> title -> game loop.
import { mountScreen, render } from './gfx/screen.js';
import { buildTileset } from './gfx/tiles.js';
import { buildAllSprites } from './gfx/creatures.js';
import { charSprite, LOOKS } from './gfx/characters.js';
import { pollGamepads, input, keyName } from './core/input.js';
import { initAudio, setVolumes, sfx } from './core/audio.js';
import { h, nextFrame, viewTransition, wait } from './core/util.js';
import { mountUI, say, choose, closeDialog, fadeIn, fadeOut, uiRoot } from './game/ui.js';
import { state, setState, newState, settings, badgeCount } from './game/state.js';
import { loadMap, updateWorld, worldState, runScript, poisonTick, api as scriptApi } from './game/world.js';
import { SCRIPTS } from './data/story.js';
import { startTitle, newGameIntro, credits, slotCard } from './game/scenes.js';
import * as menus from './game/menus.js';
import * as battle from './game/battle-scene.js';
import { openOptions, openMap } from './game/menus.js';
import { createCreature } from './game/creature.js';
import { mountHud, updateHud, flashSaved } from './game/hud.js';
import { initSaves, listSaves, loadGame, saveGame, getBuildHash } from './save/index.js';
import { installErrorCapture, setContext, mountDebugPanel } from './core/debuglog.js';
import { SAVE_CONFIG } from './save/config.js';
import { mountFullscreen } from './core/fullscreen.js';

const $ = (s) => document.querySelector(s);
let mode = 'loading';
/* global __QA__ */
if (typeof __QA__ !== 'undefined' && __QA__) window.__qa = { poisonTick, charSprite, newState, input, SCRIPTS, scriptApi, menus, battle, loadMap, worldState, state, runScript, say, setFlag: (k) => (state().flags[k] = true), addMon: (sp, lv) => state().party.push(createCreature(sp, lv)) };

// ---------------------------------------------------------------- bug log
installErrorCapture();
setContext(() => {
  const S = state();
  const m = worldState.map?.id;
  const p = worldState.player;
  return {
    mode,
    where: m ? `${m} (${p?.x},${p?.y})` : mode,
    party: S?.party.map((c) => `${c.species} nv${c.level} ${c.hp}PS`) ?? [],
    badges: S ? badgeCount() : 0,
    playtime: S ? Math.round(S.stats.playtime) : 0,
  };
});

// ---------------------------------------------------------------- loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;
  pollGamepads();
  if (mode === 'game') {
    updateWorld(dt, now);
    const S = state();
    if (S) S.stats.playtime += dt / 1000;
  }
  updateHud(now);
  render(now);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- loader
async function boot() {
  mountScreen($('#view'));
  mountUI($('#ui'));
  mountHud({ screen: $('#screen'), game: () => mode === 'game', openSettings: () => runScript(() => openOptions()), openMap: () => runScript(() => openMap()) });
  mountDebugPanel({ blockInput: () => input.push(() => {}), getBuild: getBuildHash });
  mountFullscreen();
  setVolumes(settings);
  requestAnimationFrame(frame);

  const bar = $('#loader-bar');
  const label = $('#loader-label');
  const setP = (p, msg) => {
    bar.style.setProperty('--p', p.toFixed(3));
    $('#loader-pct').textContent = `${Math.round(p * 100)}%`;
    if (msg) label.textContent = msg;
  };
  const steps = [
    ['Cebando el mate…', async () => {
      await Promise.race([
        Promise.all([document.fonts?.load('16px "Press Start 2P"'), document.fonts?.load('16px "Pixelify Sans"')]),
        wait(2500),
      ]).catch(() => {});
    }],
    ['Empedrando Colonia…', async (sub) => buildTileset(sub)],
    ['Preparando a los personajes…', async (sub) => {
      const looks = Object.keys(LOOKS);
      looks.forEach((l, i) => { for (const d of ['down', 'up', 'left', 'right']) for (const f of [0, 1, 2]) charSprite(l, d, f); sub((i + 1) / looks.length); });
    }],
    ['Despertando a las criaturas…', async (sub) => {
      // chunked so the bar keeps moving
      let done = 0;
      await new Promise((res) => {
        buildAllSprites((p) => { done = p; sub(p); });
        res();
      });
      return done;
    }],
    ['Preparando las partidas…', async () => { await initSaves(); }],
  ];
  for (let i = 0; i < steps.length; i++) {
    const [msg, fn] = steps[i];
    setP(i / steps.length, msg);
    await nextFrame();
    const t0 = performance.now();
    await fn((p) => setP((i + p) / steps.length));
    // Fake loading: every step lasts at least LOADER_STEP_MS and the bar fills smoothly.
    let el;
    while ((el = performance.now() - t0) < LOADER_STEP_MS) {
      setP((i + Math.min(1, el / LOADER_STEP_MS)) / steps.length);
      await nextFrame();
    }
    setP((i + 1) / steps.length);
    await nextFrame();
  }
  setP(1, '¡Listo!');
  await wait(500);
  const start = $('#loader-start');
  start.hidden = false;
  start.focus();
  await new Promise((res) => {
    const go = () => {
      removeEventListener('keydown', go);
      start.removeEventListener('click', go);
      res();
    };
    start.addEventListener('click', go);
    addEventListener('keydown', go);
  });
  initAudio();
  sfx('confirm');
  await viewTransition(() => { $('#loader').hidden = true; });
  input.clear();
  await titleScreen();
}

// ---------------------------------------------------------------- title
const LOADER_STEP_MS = 900;

async function titleScreen() {
  mode = 'title';
  startTitle();
  const press = h('div', { class: 'title-press', text: 'Presioná Enter para empezar' });
  uiRoot().append(press);
  press.addEventListener('click', () => input.press('a'));
  await input.waitFor(['a', 'start']);
  press.remove();
  sfx('confirm');
  while (true) {
    const saves = await listSaves().catch(() => []);
    const opts = [];
    if (saves.length) opts.push(['Continuar', 'continue']);
    opts.push(['Nueva partida', 'new'], ['Opciones', 'options'], ['Créditos', 'credits']);
    const i = await choose(opts.map((o) => o[0]), { cls: 'menu-title-screen', cancel: false });
    const pick = opts[i][1];
    if (pick === 'options') await openOptions();
    else if (pick === 'credits') { await credits(); await fadeIn(300); startTitle(); }
    else if (pick === 'continue') { if (await continueGame(saves)) return; }
    else if (pick === 'new') { if (await startNewGame()) return; }
  }
}

async function continueGame(saves) {
  const opts = saves.map((s) => ({ label: `Ranura ${s.slot}`, hint: `${s.summary.name} · ${s.summary.badges} med.` }));
  const preview = h('div', { class: 'slot-preview' });
  uiRoot().append(preview);
  const i = await choose(opts, { cls: 'menu-slots', onMove: (j) => preview.replaceChildren(slotCard(saves[j])) });
  preview.remove();
  if (i < 0) return false;
  const res = await loadGame(saves[i].slot);
  if (!res.ok) {
    sfx('bump');
    await say([res.reason, ...(res.errors ?? []).slice(0, 3).map((e) => `• ${e}`)]);
    return false;
  }
  setState(res.state);
  state().slot = saves[i].slot;
  if (res.outdated) await say('Esta partida es de una versión anterior del juego. ¡Se adaptó sin problemas!');
  await enterGame();
  return true;
}

async function startNewGame() {
  // Autosave needs a slot: use the first free one, or ask which one to replace.
  const saves = await listSaves().catch(() => []);
  const used = new Set(saves.map((s) => s.slot));
  let slot = Array.from({ length: SAVE_CONFIG.slots }, (_, i) => i + 1).find((n) => !used.has(n));
  if (!slot) {
    await say('Todas las ranuras están ocupadas. ¿Cuál querés reemplazar con la nueva partida?', { keep: true });
    const i = await choose([...saves.map((s) => `Ranura ${s.slot} · ${s.summary.name}`), 'Cancelar'], { cls: 'menu-slots' });
    closeDialog();
    if (i < 0 || i >= saves.length) return false;
    slot = saves[i].slot;
  }
  await fadeOut(300);
  newState({ name: 'Jugador', look: 'player_m' });
  state().slot = slot;
  await newGameIntro();
  loadMap('casa_jugador', 6, 5, 'down');
  mode = 'game';
  await fadeIn(500);
  worldState.scriptRunning = true;
  await say(['¡Hoy es el día! Vas a recibir tu primera criatura.', `Hablá con tu madre antes de salir. (${keyName('a')} para hablar · Enter para abrir el menú)`]);
  worldState.scriptRunning = false;
  return true;
}

async function enterGame() {
  await fadeOut(250);
  const S = state();
  loadMap(S.pos.map, S.pos.x, S.pos.y, S.pos.dir);
  mode = 'game';
  await fadeIn(300);
}

// Autosave into the slot in use: every few seconds when something changed,
// and when the tab is hidden or closed.
let lastSaved = '';
function autosave(force = false) {
  const S = state();
  if (mode !== 'game' || !S?.slot || worldState.scriptRunning || document.querySelector('.bhud')) return;
  const sig = `${S.pos.map}|${S.pos.x}|${S.pos.y}|${S.stats.steps}|${S.stats.battlesWon}|${S.party.length}|${Object.keys(S.flags).length}|${Math.floor(S.stats.playtime / 60)}`;
  if (!force && sig === lastSaved) return;
  lastSaved = sig;
  saveGame(S.slot, S).then(() => flashSaved()).catch((err) => console.warn('Autoguardado falló:', err.message));
}
setInterval(autosave, 6000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autosave(true); });
addEventListener('pagehide', () => autosave(true));

// Offline support when hosted on its own (https, top-level window).
if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window && document.querySelector('link[rel=manifest]')) {
  // When a new deploy takes over, reload once so players never keep playing an old build.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !worldState.scriptRunning) location.reload(); });
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

boot().catch((err) => {
  console.error(err);
  const label = $('#loader-label');
  if (label) label.textContent = `Error al cargar: ${err.message}`;
});

export { SAVE_CONFIG, closeDialog };
