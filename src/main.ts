// Boot: loader -> title -> game loop.
import { mountScreen, render, setAfterRender } from './gfx/screen.ts';
import { mountPixi, renderPixi } from './gfx/pixi-layer.ts';
import { mount3D, drew3DThisFrame } from './gfx/world-3d.ts';
import { buildTileset, tileCanvas } from './gfx/tiles.ts';
import { validateSave } from './save/validate.ts';
import { buildAllSprites, creatureSprite } from './gfx/creatures.ts';
import { DEX_ORDER } from './data/species.ts';
import { pamperoFrame } from './gfx/pampero.ts';
import { charSprite, LOOKS } from './gfx/characters.ts';
import { pollGamepads, input, keyName } from './core/input.ts';
import { initAudio, setVolumes, sfx } from './core/audio.ts';
import { h, nextFrame, viewTransition, wait } from './core/util.ts';
import { mountUI, say, closeDialog, fadeIn, fadeOut, uiRoot, toast } from './game/ui.ts';
import { state, setState, newState, settings, badgeCount } from './game/state.ts';
import { loadMap, updateWorld, worldState, runScript, poisonTick, api as scriptApi } from './game/world.ts';
import { SCRIPTS } from './data/story.ts';
import { startTitle, playCinematic, newGameIntro, credits, titleRenderer } from './game/scenes.ts';
import * as menus from './game/menus.ts';
import * as battle from './game/battle-scene.ts';
import { openOptions, openMap, openBag, openParty, openDex, openFogMeter } from './game/menus.ts';
import { createCreature } from './game/creature.ts';
import { mountHud, updateHud, flashSaved } from './game/hud.ts';
import { mountSidebar, updateSidebar } from './game/sidebar.ts';
import { VERSION } from './version.ts';
import { MAPS } from './data/maps.ts';
import { initSaves, listSaves, loadGame, saveGame, getBuildHash, setSaveBackend, isCloud, localSavesToMigrate, migrateLocalToCloud, deleteSave } from './save/index.ts';
import { authScreen, savesHub, confirmModal } from './game/account-screens.ts';
import { currentUser, signIn, signUp, signOut, clearSession, AuthError } from './save/auth.ts';
import { installErrorCapture, setContext, mountDebugPanel } from './core/debuglog.ts';
import { SAVE_CONFIG } from './save/config.ts';
import { mountTouchPad } from './core/touchpad.ts';
import { mountFullscreen } from './core/fullscreen.ts';
import { mountPerf, perfTick } from './core/perf.ts';
import { advanceClock } from './game/calendar.ts';

const $ = (s) => document.querySelector(s);
let mode = 'loading';
/* global __QA__ */
if (typeof __QA__ !== 'undefined' && __QA__) window.__qa = { MAPS, validateSave, tileCanvas, titleRenderer, keys: DEX_ORDER, pamperoFrame, creatureSprite, updateWorld, poisonTick, charSprite, newState, setState, input, SCRIPTS, scriptApi, menus, battle, loadMap, worldState, state, runScript, say, setFlag: (k) => (state().flags[k] = true), createCreature, saveGame, addMon: (sp, lv) => state().party.push(createCreature(sp, lv)), enterGame: () => enterGame() };

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
  requestAnimationFrame(frame); // schedule first so one error never freezes the game
  const raw = now - last;
  const dt = Math.min(50, raw);
  last = now;
  perfTick(now, raw);
  pollGamepads();
  if (mode === 'game') {
    updateWorld(dt, now);
    const S = state();
    if (S) S.stats.playtime += dt / 1000;
    advanceClock(dt);
  }
  // phones: the on-screen pad only shows while walking the world (hidden on intro, title, login, save slots and in battles)
  document.body.classList.toggle('gb-off', mode !== 'game' || battle.inBattle());
  updateHud(now);
  updateSidebar(now, mode === 'game');
  render(now);
}

// ---------------------------------------------------------------- loader
async function boot() {
  mountScreen($('#view'));
  const pixiOk = await mountPixi($('#view'), $('#screen'));
  const has3D = mount3D($('#screen'));
  // Prueba visual 3D: cuando el mundo se dibujó en 3D, se ve su canvas con el 2D transparente encima; si no (batallas, menús), sigue Pixi.
  setAfterRender(() => {
    const on = has3D && drew3DThisFrame(performance.now());
    $('#screen').classList.toggle('three-on', on);
    if (!on && pixiOk) renderPixi();
  });
  mountUI($('#ui'));
  mountSidebar($('#stage'), { menu: null, bag: () => runScript(() => openBag({ mode: 'field' })), party: () => runScript(() => openParty({ mode: 'field' })), dex: () => runScript(() => openDex()), map: () => runScript(() => openMap()), options: () => runScript(() => openOptions()), fog: () => runScript(() => openFogMeter()) });
  mountHud({ screen: $('#screen'), game: () => mode === 'game', openSettings: () => runScript(() => openOptions()), openMap: () => runScript(() => openMap()) });
  mountDebugPanel({ blockInput: () => input.push(() => {}), getBuild: getBuildHash });
  mountFullscreen();
  // Phones and tablets get an on-screen pad built like a handheld console (landscape); a hint asks to rotate in portrait.
  mountTouchPad();
  mountPerf();
  setVolumes(settings);
  requestAnimationFrame(frame);

  const bar = $('#loader-bar');
  const label = $('#loader-label');
  const setP = (p, msg?) => {
    bar.style.setProperty('--p', p.toFixed(3));
    $('#loader-pct').textContent = `${Math.round(p * 100)}%`;
    if (msg) label.textContent = msg;
  };
  const steps: [string, (sub?: (p: number) => void) => Promise<any>][] = [
    ['Calentando el agua…', async () => {
      await Promise.race([
        Promise.all([document.fonts?.load('16px "Press Start 2P"'), document.fonts?.load('16px "Pixelify Sans"')]),
        wait(2500),
      ]).catch(() => {});
    }],
    ['Armando la montañita…', async (sub) => buildTileset(sub)],
    ['Dejando hinchar la yerba…', async (sub) => {
      const looks = Object.keys(LOOKS);
      looks.forEach((l, i) => { for (const d of ['down', 'up', 'left', 'right']) for (const f of [0, 1, 2, 3]) charSprite(l, d, f); sub((i + 1) / looks.length); });
    }],
    ['Cebando el primer mate…', async (sub) => {
      // chunked so the bar keeps moving
      let done = 0;
      await new Promise<void>((res) => {
        buildAllSprites((p) => { done = p; sub(p); });
        res();
      });
      return done;
    }],
    ['Pasando el termo…', async () => { await initSaves(); }],
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
  setP(1, '¡Listo para tomar!');
  await wait(500);
  const start = $('#loader-start');
  start.hidden = false;
  start.focus();
  await new Promise<void>((res) => {
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
  mode = 'title';
  await playCinematic(); // the intro opens the game (B skips it)
  input.clear();
  startTitle();
  await fadeIn(300);
  await titleScreen();
}

// ---------------------------------------------------------------- title
const LOADER_STEP_MS = 900;

async function titleScreen() {
  mode = 'title';
  startTitle();
  const press = h('div', { class: 'title-press', text: 'Presioná Enter para empezar' });
  const ver = h('div', { class: 'title-version', text: `Versión ${VERSION}` });
  uiRoot().append(press, ver);
  press.addEventListener('click', () => input.press('a'));
  await input.waitFor(['a', 'start']);
  press.remove();
  ver.remove();
  sfx('confirm');
  let notice = '';
  if (SAVE_CONFIG.backend === 'supabase' && !currentUser()) notice = await accountMenu();
  while (true) {
    const act = await savesHub({
      slots: SAVE_CONFIG.slots,
      account: currentUser(),
      cloud: isCloud(),
      canLogin: SAVE_CONFIG.backend === 'supabase',
      load: () => listSaves(),
      remove: (slot) => deleteSave(slot),
      notice,
      version: VERSION,
    });
    notice = '';
    if (act.type === 'expired') {
      // The server no longer accepts this session: sign in again instead of
      // showing an empty list that looks like lost progress.
      clearSession();
      setSaveBackend('local');
      notice = await accountMenu('Tu sesión venció. Volvé a iniciar sesión.');
    } else if (act.type === 'logout') { await signOut(); setSaveBackend('local'); notice = await accountMenu(); }
    else if (act.type === 'login') notice = await accountMenu();
    else if (act.type === 'options') await openOptions();
    else if (act.type === 'credits') { await credits(); await fadeIn(300); startTitle(); }
    else if (act.type === 'load') { if (await continueGame(act.save)) return; }
    else if (act.type === 'new') { if (await startNewGame(act.slot)) return; }
  }
}

// ---------------------------------------------------------------- account
// Username + password. Cloud saves follow the player across devices; "sin cuenta"
// keeps the old behaviour (saves stay in this browser). Returns a line for the
// save screen's banner.
async function accountMenu(notice = '') {
  const res = await authScreen({ notice, signIn, signUp });
  if (res.kind === 'local') {
    setSaveBackend('local');
    return 'Jugás sin cuenta: las partidas quedan solo en este dispositivo. Podés iniciar sesión cuando quieras.';
  }
  setSaveBackend('cloud');
  const hello = res.created ? `¡Cuenta creada, ${res.username}! Tu progreso se guarda online.` : `¡Hola de nuevo, ${res.username}!`;
  const moved = await offerMigration();
  return moved ? `${hello} ${moved}` : hello;
}

async function offerMigration() {
  const pending = await localSavesToMigrate().catch(() => []);
  if (!pending.length) return '';
  const n = pending.length;
  const host = h('div', { class: 'acct acct-hub is-in' });
  document.querySelector('#screen').append(host);
  const pop = input.push(() => {});
  const ok = await confirmModal(host, {
    title: 'Partidas en este dispositivo',
    text: `Hay ${n} partida${n > 1 ? 's' : ''} guardada${n > 1 ? 's' : ''} solo en este navegador. ¿La${n > 1 ? 's' : ''} subo a tu cuenta? Se usan las mismas ranuras si están libres.`,
    ok: 'Subir a mi cuenta', cancel: 'Ahora no',
  });
  let out = '';
  if (ok) {
    const res = await migrateLocalToCloud();
    out = `Se subieron ${res.moved} partida${res.moved === 1 ? '' : 's'}.${res.failed.length ? ` ${res.failed.slice(0, 2).join(' ')}` : ''}`;
  }
  pop();
  host.remove();
  return out;
}

async function continueGame(save) {
  const res = await loadGame(save.slot);
  if (!res.ok) {
    sfx('bump');
    await say([res.reason, ...(res.errors ?? []).slice(0, 3).map((e) => `• ${e}`)]);
    return false;
  }
  setState(res.state);
  state().slot = save.slot;
  if (res.outdated) await say('Esta partida es de una versión anterior del juego. ¡Se adaptó sin problemas!');
  // Saves that went past the Anglo before the Medidor de Niebla existed get it by mail from Tabárez.
  const S = state();
  if (S.flags.anglo_pp && !S.flags.got_medidor) {
    S.flags.got_medidor = true;
    S.bag.medidor_niebla = 1;
    await say(['Llegó un paquete del Maestro Tabárez: un Medidor de Niebla.', 'Mide cuánta niebla del Equipo PP queda en Uruguay. Se ve en tu ficha, arriba a la izquierda.']);
  }
  await enterGame();
  return true;
}

/** New game in an empty slot picked on the save screen (autosave writes there). */
async function startNewGame(slot) {
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
let saveFailedAt = 0;
function autosave(force = false) {
  const S = state();
  if (mode !== 'game' || !S?.slot || worldState.scriptRunning || document.querySelector('.bhud')) return;
  const sig = `${S.pos.map}|${S.pos.x}|${S.pos.y}|${S.stats.steps}|${S.stats.battlesWon}|${S.party.length}|${Object.keys(S.flags).length}|${Math.floor(S.stats.playtime / 60)}`;
  if (!force && sig === lastSaved) return;
  lastSaved = sig;
  saveGame(S.slot, S).then(() => { flashSaved(); saveFailedAt = 0; }).catch((err) => {
    console.warn('Autoguardado falló:', err.message);
    // Tell the player, at most once a minute, instead of losing progress silently.
    if (Date.now() - saveFailedAt > 60_000) { saveFailedAt = Date.now(); toast(isCloud() ? 'No se pudo guardar online. Se reintenta solo.' : 'No se pudo guardar la partida.', 3500); }
  });
}
setInterval(autosave, 6000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autosave(true); });
addEventListener('pagehide', () => autosave(true));

// Offline support when hosted on its own (https, top-level window).
if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window && document.querySelector('link[rel=manifest]')) {
  // When a new deploy takes over, reload once so players never keep playing an old build.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !worldState.scriptRunning) location.reload(); });
  navigator.serviceWorker.register('./sw.ts').catch(() => {});
}

boot().catch((err) => {
  console.error(err);
  const label = $('#loader-label');
  if (label) label.textContent = `Error al cargar: ${err.message}`;
});

export { SAVE_CONFIG, closeDialog };
