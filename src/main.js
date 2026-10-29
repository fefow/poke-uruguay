// Boot: loader -> title -> game loop.
import { mountScreen, render } from './gfx/screen.js';
import { buildTileset } from './gfx/tiles.js';
import { buildAllSprites } from './gfx/creatures.js';
import { charSprite, LOOKS } from './gfx/characters.js';
import { mountTouchControls, pollGamepads, input } from './core/input.js';
import { initAudio, setVolumes, sfx } from './core/audio.js';
import { h, nextFrame, viewTransition, wait } from './core/util.js';
import { mountUI, say, choose, closeDialog, fadeIn, fadeOut, uiRoot } from './game/ui.js';
import { state, setState, newState, settings, badgeCount } from './game/state.js';
import { loadMap, updateWorld, worldState, runScript } from './game/world.js';
import { startTitle, newGameIntro, credits, slotCard } from './game/scenes.js';
import { openOptions } from './game/menus.js';
import { mountHud, updateHud } from './game/hud.js';
import { initSaves, listSaves, loadGame, saveGame, getBuildHash } from './save/index.js';
import { installErrorCapture, setContext, mountDebugPanel } from './core/debuglog.js';
import { SAVE_CONFIG } from './save/config.js';

const $ = (s) => document.querySelector(s);
let mode = 'loading';
/* global __QA__ */
if (typeof __QA__ !== 'undefined' && __QA__) window.__qa = { loadMap, worldState, state, runScript, say, setFlag: (k) => (state().flags[k] = true) };

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
  mountTouchControls($('#touch'));
  mountHud({ screen: $('#screen'), game: () => mode === 'game', openSettings: () => runScript(() => openOptions()) });
  mountDebugPanel({ blockInput: () => input.push(() => {}), getBuild: getBuildHash });
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
    await fn((p) => setP((i + p) / steps.length));
    await nextFrame();
  }
  setP(1, '¡Listo!');
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
async function titleScreen() {
  mode = 'title';
  startTitle();
  const press = h('div', { class: 'title-press', text: 'Presioná A o tocá para empezar' });
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
    else if (pick === 'new') { await startNewGame(); return; }
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
  await fadeOut(300);
  newState({ name: 'Gurí', look: 'player_m' });
  await newGameIntro();
  loadMap('casa_jugador', 6, 5, 'down');
  mode = 'game';
  await fadeIn(500);
  worldState.scriptRunning = true;
  await say(['¡Hoy es el día! Vas a recibir tu primera criatura.', 'Hablá con tu madre antes de salir. (Z para hablar · Enter para abrir el menú)']);
  worldState.scriptRunning = false;
}

async function enterGame() {
  await fadeOut(250);
  const S = state();
  loadMap(S.pos.map, S.pos.x, S.pos.y, S.pos.dir);
  mode = 'game';
  await fadeIn(300);
}

// Quiet autosave when the tab is hidden (only into the slot already in use).
document.addEventListener('visibilitychange', () => {
  const S = state();
  if (document.visibilityState === 'hidden' && mode === 'game' && S?.slot && !worldState.scriptRunning) {
    saveGame(S.slot, S).catch(() => {});
  }
});

// Offline support when hosted on its own (https, top-level window).
if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window && document.querySelector('link[rel=manifest]')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

boot().catch((err) => {
  console.error(err);
  const label = $('#loader-label');
  if (label) label.textContent = `Error al cargar: ${err.message}`;
});

export { SAVE_CONFIG, closeDialog };
