// Overworld: map loading/linking, movement, NPCs, trainers, encounters,
// rendering and the script API used by story scripts.
import { MAPS, OUTDOOR, INTERIOR, refGymOrder } from '../data/maps.ts';
import { SCRIPTS } from '../data/story.ts';
import { SPECIES } from '../data/species.ts';
import { encounterList, waterTable } from '../data/encounters.ts';
import { badgeOf, STOPS } from '../data/route.ts';
import { TYPES } from '../data/types.ts';
import { ITEMS } from '../data/items.ts';
import { T, TILE_INFO, tileCanvas, groundUnder, tileVariant, drawBigObjects } from '../gfx/tiles.ts';
import { charSprite } from '../gfx/characters.ts';
import { creatureSprite, creatureIcon } from '../gfx/creatures.ts';
import { W, H, setRenderer, getRenderer, text as ctext } from '../gfx/screen.ts';
import { CONTEST_CITY, contestScore } from '../data/events.ts';
import { vignette, shadow, backdrop, mapGlow, motes, grade, weatherAt, rain, lightning } from '../gfx/fx.ts';
import { setFx, nightLevel, pixiActive } from '../gfx/pixi-layer.ts';
import { input } from '../core/input.ts';
import { sfx, playMusic, jingle, setAmbience } from '../core/audio.ts';
import { worldRng } from '../core/rng.ts';
import { h, wait, clamp } from '../core/util.ts';
import { info as logInfo } from '../core/debuglog.ts';
import { say, ask, choose, fmt, fadeOut, fadeIn, uiRoot, closeDialog, toast } from './ui.ts';
import { state, flag, setFlag, addItem, hasItem, removeItem, markCaught, markSeen, loseMoney, spend, PARTY_MAX, badgeCount, settings } from './state.ts';
import { createCreature, heal as healCreature, displayName, maxHp, gainExp, canEvolve } from './creature.ts';
import { runBattle } from './battle-scene.ts';
import { openPauseMenu, openShop, openPC, openParty } from './menus.ts';
import { drawGroundBall, drawPickBall } from '../gfx/items.ts';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const WALK_MS = 210;
const RUN_MS = 115;
const SPACE_MS = Math.round(WALK_MS / 2); // Space: 2x speed
const BIKE_MS = Math.round(WALK_MS / 4); // bicycle: 4x walking, overworld only

// ---------------------------------------------------------------- linking
let linked = false;
function linkWorld() {
  if (linked) return;
  linked = true;
  for (const [id, m] of Object.entries(MAPS)) {
    m.id = id;
    m.w = Math.max(...m.tiles.map((r) => r.length));
    m.h = m.tiles.length;
    // Normalise ragged rows so a typo never crashes the game.
    m.tiles = m.tiles.map((r) => r.padEnd(m.w, m.indoor ? 'O' : '#'));
  }
  for (const [id, m] of Object.entries(OUTDOOR)) {
    const doors = [];
    m.tiles.forEach((row, y) => [...row].forEach((ch, x) => ch === 'D' && doors.push({ x, y })));
    m.doorWarps = {};
    doors.forEach((d, i) => {
      const def = m.doors?.[i];
      if (!def) return;
      const target = typeof def === 'string' ? { to: def } : def;
      m.doorWarps[`${d.x},${d.y}`] = target;
      const inner = INTERIOR[target.to];
      if (inner && !inner.exitTo) inner.exitTo = { map: id, x: d.x, y: d.y + 1 };
    });
    const signs = [];
    m.tiles.forEach((row, y) => [...row].forEach((ch, x) => ch === 'S' && signs.push(`${x},${y}`)));
    m.signText = Object.fromEntries(signs.map((k, i) => [k, m.signs?.[i] ?? '…']));
  }
  for (const m of Object.values(INTERIOR)) {
    const mats = [];
    m.tiles.forEach((row, y) => [...row].forEach((ch, x) => ch === 'm' && mats.push({ x, y })));
    m.mats = mats;
  }
}

// ---------------------------------------------------------------- state
const W_: any = {
  map: null,
  tiles: null,
  npcs: [],
  items: [],
  legend: null,
  player: { x: 0, y: 0, dir: 'down', moving: false, from: null, t: 0, dur: WALK_MS, step: 0 },
  scriptRunning: false,
  emote: null,
  anim: 0,
  lastDirPress: 0,
  bannerTimer: null,
  showCreature: null,
  flash: 0,
};

const flagsObj = () => state().flags;
const cond = (fn) => !fn || fn(flagsObj());
const req = (r) => !r || (typeof r === 'string' ? flag(r) : r(flagsObj()));

function tileAt(x, y) {
  const m = W_.map;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
  return (W_.tiles ?? m.tiles)[y][x];
}

function solidAt(x, y, { ignorePlayer = false, self = null, player = false } = {}) {
  const ch = tileAt(x, y);
  if (ch == null) return true;
  // With the canoe, the player can sail on water.
  if (TILE_INFO[ch]?.solid && !(player && ch === '~' && hasItem('canoa') && flag(badgeOf('rivera')))) return true;
  if (W_.npcs.some((n) => n !== self && n.visible && n.x === x && n.y === y)) return true;
  if (W_.items.some((it) => it.x === x && it.y === y)) return true;
  if (W_.legend && W_.legend.x === x && W_.legend.y === y) return true;
  if (!ignorePlayer && W_.player.x === x && W_.player.y === y) return true;
  return false;
}

function refreshEntities() {
  const m = W_.map;
  W_.npcs = (m.npcs ?? []).map((def, i) => {
    const prev = W_.npcs.find((n) => n.def === def);
    return prev ?? { def, i, x: def.x, y: def.y, ox: def.x, oy: def.y, dir: def.dir ?? 'down', visible: true, moving: false, t: 0, from: null, wanderAt: performance.now() + 1000 + worldRng.next() * 3000 };
  });
  for (const n of W_.npcs) n.visible = cond(n.def.cond) && !n.gone && !(n.def.gate && n.def.trainer && flag(`tr_${n.def.trainer.id}`));
  W_.items = (m.items ?? []).filter((it) => !flag(`it_${it.id}`));
  W_.legend = m.legend && cond(m.legend.cond) && !flag(m.legend.flag) ? m.legend : null;
}

// Safari: the ticket is a deadline (S.safari.until). Nobody stays inside, or loads a save inside, without paid time.
export const SAFARI_GATE = { map: 'rivera', x: 11, y: 15 };
/** Where a timed park sends you out: the Safari's gate, or the contest organizer's spot. */
const gateFor = (id: string) => {
  const m: any = MAPS[id];
  if (m?.contest) { const t: any = MAPS[CONTEST_CITY]; const g = t?.contestGate; if (g) return { map: CONTEST_CITY, x: g.x, y: g.y }; }
  if (m?.safari) {
    // the Safari gate is the tile in front of the Mi Zoo ticket office, wherever Rivera's plan put it
    const dw: Record<string, any> = (MAPS[SAFARI_GATE.map] as any)?.doorWarps ?? {};
    const k = Object.keys(dw).find((key) => dw[key].to === 'safari_gate');
    if (k) { const [dx, dy] = k.split(',').map(Number); return { map: SAFARI_GATE.map, x: dx, y: dy + 1 }; }
  }
  return SAFARI_GATE;
};
const fishLeft = () => ((state().contest as any)?.fish ? ((state().contest as any).until ?? 0) - Date.now() : 0);
const safariLeft = () => (state().safari?.until ?? 0) - Date.now();
// Park equipment goes back to the park when you leave.
const safariStrip = () => { const S = state(); S.bag.safari_ball && delete S.bag.safari_ball; S.bag.cebo && delete S.bag.cebo; };

/** Background track of a map: the zone it belongs to, unless the map names its own non-generic track. */
function musicFor(id, m) {
  const own = m.music;
  if (own && own !== 'town' && own !== 'route') return own;
  if (m.indoor) {
    if (id.startsWith('gym_')) return 'gym';
    if (id.startsWith('casino_')) return 'casino';
    if (id.startsWith('ferry_')) return 'ferry';
    if (/^(anglo|represa|torre|pp|fabrica|radio|aduana|parrilla|muelle|obs)_/.test(id)) return 'pp';
    return own ?? 'town';
  }
  if (own === 'town') return m.theme === 'arena' ? 'beach' : 'town';
  if (m.theme === 'cueva') return 'cave';
  if (m.theme === 'arena' || m.bg === 'beach') return 'beach';
  if (m.theme === 'sierra' || m.bg === 'canyon') return 'sierra';
  if (/Bosque|Monte|Eucalipt|Pinar/.test(m.name ?? '')) return 'forest';
  return 'route';
}

export function loadMap(id, x, y, dir = 'down') {
  linkWorld();
  const S = state();
  if (MAPS[id]?.safari && safariLeft() <= 0) {
    S.safari = null;
    safariStrip();
    ({ map: id, x, y } = gateFor(id));
    dir = 'down';
  }
  const m = MAPS[id];
  if (W_.map?.safari && !m.safari) safariStrip();
  const changed = W_.map?.id !== id;
  if (changed) logInfo(`Entró a ${id}`);
  if (!m.indoor) S.flags[`v_${id}`] = true;
  W_.map = m;
  // Thickets already cut with the machete stay cut (flag cl_<map>_<x>_<y>).
  W_.tiles = m.tiles.slice();
  m.tiles.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '%' && S.flags[`cl_${id}_${x}_${y}`]) W_.tiles[y] = W_.tiles[y].slice(0, x) + '.' + W_.tiles[y].slice(x + 1);
    }
  });
  // Scenery that changes with the story (e.g. the Buquebus leaves for good): m.flagTiles = [{ flag, x, y, ch }]
  for (const e of (m as any).flagTiles ?? []) if (S.flags[e.flag]) W_.tiles[e.y] = W_.tiles[e.y].slice(0, e.x) + e.ch + W_.tiles[e.y].slice(e.x + 1);
  if (changed) { W_.npcs = []; W_.lit = false; }
  // The bicycle is never used indoors, and bike-only zones put you on it.
  if (m.indoor) W_.bike = false;
  else if (m.bikeOnly && hasItem('bici')) W_.bike = true;
  W_.player = { ...W_.player, x, y, dir, moving: false, from: null };
  S.pos = { map: id, x, y, dir };
  refreshEntities();
  playMusic(musicFor(id, m));
  setRenderer(drawWorld);
  if (changed && !m.indoor) showBanner(fmt(m.name));
}

function showBanner(name) {
  const old = uiRoot().querySelector('.map-banner');
  old?.remove();
  const b = h('div', { class: 'map-banner', text: fmt(name) });
  uiRoot().append(b);
  clearTimeout(W_.bannerTimer);
  W_.bannerTimer = setTimeout(() => b.remove(), 2600);
}

// ---------------------------------------------------------------- update
function safariClock() {
  const S = state();
  const left = safariLeft();
  if (left <= 0) {
    if (W_.scriptRunning || W_.safariEnding) return;
    W_.safariEnding = true;
    runScript(async () => {
      S.safari = null;
      for (let i = 0; i < 3; i++) { sfx('levelup'); await wait(450); }
      const g = gateFor(W_.map.id);
      if ((W_.map as any).contest) await say(['¡Ding, dong! Se terminó el tiempo del concurso.', 'Los guardaparques te acompañan de vuelta con los jueces.']);
      else await say(['¡Ding, dong! Se terminó el tiempo contratado.', 'Los guardias del Safari te acompañan hasta la salida.']);
      safariStrip();
      await doWarp(g.map, g.x, g.y, 'down');
    }).finally(() => { W_.safariEnding = false; });
  } else if (left <= 60000 && W_.safariWarned !== S.safari.until) {
    W_.safariWarned = S.safari.until;
    sfx('levelup');
    toast((W_.map as any).contest ? 'Aviso del concurso: queda 1 minuto.' : 'Aviso del Safari: queda 1 minuto de visita.', 5000);
  }
}

/** Fishing contest countdown, shown while it runs. */
function fishTimer() {
  const C: any = state().contest;
  let el = W_.fishTimerEl;
  if (!C?.fish) { if (el) { el.remove(); W_.fishTimerEl = null; } return; }
  const left = Math.max(0, C.until - Date.now());
  if (!el || !el.isConnected) {
    el = W_.fishTimerEl = h('div', { class: 'fish-timer' });
    Object.assign(el.style, { position: 'fixed', top: '12px', right: '16px', padding: '8px 14px', background: 'rgba(10,30,50,.82)', color: '#fff', font: 'bold 22px monospace', borderRadius: '8px', zIndex: 20, pointerEvents: 'none' });
    uiRoot().append(el);
  }
  const sec = Math.ceil(left / 1000);
  const txt = left > 0 ? `🎣 ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '🎣 ¡Tiempo! Volvé con el juez';
  if (el.textContent !== txt) el.textContent = txt;
  if (left > 0 && left <= 60000 && W_.fishWarned !== C.until) { W_.fishWarned = C.until; sfx('levelup'); toast('Concurso de pesca: queda 1 minuto.', 4000); }
  if (left <= 0 && W_.fishOver !== C.until) { W_.fishOver = C.until; sfx('levelup'); toast('¡Tiempo! Volvé con el juez de pesca.', 6000); }
}

/** What the player should hear around them, from the map's weather, biome and the in-game clock. */
function updateAmbience() {
  const m = W_.map;
  if (!m) return;
  if (m.indoor) return setAmbience({});
  if (m.theme === 'cueva') return setAmbience({ drips: 1, wind: 0.2 });
  const wx = m.dark ? 'clear' : weatherAt(m.id, m.weather);
  const night = nightLevel();
  const next: any = { wind: 0.25 };
  if (wx === 'rain') next.rain = 0.7;
  if (wx === 'storm') { next.rain = 1; next.thunder = 1; next.wind = 0.8; }
  if (wx === 'fog') next.wind = 0.4;
  if (m.theme === 'arena' || m.bg === 'beach') next.surf = 0.8;
  if (wx !== 'rain' && wx !== 'storm') {
    if (night > 0.5) next.crickets = 1;
    else next.birds = m.theme === 'arena' ? 0.3 : 1;
  }
  setAmbience(next);
}

export function updateWorld(dt, now) {
  W_.anim += dt;
  if (now - (W_.ambAt ?? -1e9) > 1000) { W_.ambAt = now; updateAmbience(); }
  if (W_.map.safari) safariClock();
  fishTimer();
  const p = W_.player;
  // NPCs keep animating during scripts: trainers walking up to you or leaving the scene depend on it.
  for (const n of W_.npcs) updateNpc(n, now, dt);
  if (W_.scriptRunning) return;

  if (!p.moving && spin()) return;
  if (p.moving) {
    p.t += dt;
    if (p.t >= p.dur) {
      p.moving = false;
      p.t = 0;
      onStep();
    }
    return;
  }
  if (input.busy) return;
  let tapped = null;
  for (const a of input.take()) {
    if (a === 'start') return void runScript(() => openPauseMenu());
    if (a === 'a') return void interact();
    if (DIRS[a]) tapped = a;
  }
  // Quick taps shorter than a frame still count as one turn/step.
  if (tapped && !input.held(tapped)) {
    if (p.dir !== tapped) p.dir = tapped;
    else tryMove(tapped);
    return;
  }
  const d = input.heldDir();
  if (!d) {
    W_.lastDirPress = 0;
    return;
  }
  if (p.dir !== d) {
    p.dir = d;
    W_.lastDirPress = now;
    return; // turn in place first, like the classics
  }
  if (W_.lastDirPress && now - W_.lastDirPress < 70) return;
  tryMove(d);
}

const SPIN_DIR = { 'Ϣ': 'up', 'Ϥ': 'down', 'Ϧ': 'left', 'Ϩ': 'right' };
/** Launch arrows: standing on one throws the player along it, tile after tile, until a plain tile (or a wall) stops them. */
function spin() {
  const p = W_.player;
  const d = SPIN_DIR[tileAt(p.x, p.y)];
  if (!d) return false;
  const [dx, dy] = DIRS[d];
  const nx = p.x + dx, ny = p.y + dy;
  p.dir = d;
  if (solidAt(nx, ny, { player: true })) return false;
  p.from = { x: p.x, y: p.y };
  p.x = nx; p.y = ny;
  p.moving = true; p.t = 0; p.dur = 80; p.step++;
  return true;
}

function tryMove(d) {
  const p = W_.player;
  const [dx, dy] = DIRS[d];
  const nx = p.x + dx;
  const ny = p.y + dy;
  const m = W_.map;
  // Leaving through the map edge
  if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) {
    if (m.indoor) {
      if (tileAt(p.x, p.y) === 'm') return void runScript(() => exitInterior());
      return bump();
    }
    const side = nx < 0 ? 'w' : nx >= m.w ? 'e' : ny < 0 ? 'n' : 's';
    const ex = m.exits?.[side];
    if (!ex) return bump();
    if (!req(ex.req)) return void runScript(async () => { await say(ex.deny ?? 'No podés pasar.'); });
    return void runScript(() => crossEdge(side, ex.to));
  }
  // Warps on solid tiles (e.g. lighthouse door)
  const warp = m.warps?.find((w) => w.x === nx && w.y === ny);
  if (warp) {
    if (warp.needs && !hasItem(warp.needs)) return void runScript(async () => { await say(warp.deny ?? 'Está cerrado con llave.'); });
    return void runScript(() => doWarp(warp.to, warp.tx, warp.ty, 'up'));
  }
  const door = m.doorWarps?.[`${nx},${ny}`];
  if (door) {
    if (!req(door.req)) return void runScript(async () => { await say(door.deny ?? 'Está cerrado.'); });
    return void runScript(() => enterInterior(door.to));
  }
  if (tileAt(nx, ny) === 'λ') {
    // desnivel: only crossed downwards, hopping to the tile below
    if (d !== 'down' || tileAt(nx, ny + 1) === 'λ' || solidAt(nx, ny + 1, { player: true })) return bump();
    p.from = { x: p.x, y: p.y };
    p.x = nx;
    p.y = ny + 1;
    p.moving = true;
    p.t = 0;
    p.dur = WALK_MS * 1.7;
    p.step++;
    sfx('ledge');
    return;
  }
  if (tileAt(nx, ny) === '\\') return void pushBoulder(dx, dy, nx, ny);
  if (tileAt(nx, ny) === 'Ϡ') return void climbFalls(dx, dy, nx, ny);
  const blocker = W_.npcs.find((n) => n.visible && n.x === nx && n.y === ny && n.def.blocker);
  if (blocker) return void runScript(async () => { await say(blocker.def.text, { name: blocker.def.name }); });
  if (solidAt(nx, ny, { player: true })) {
    if (tileAt(nx, ny) === '~' && hasItem('canoa') && !flag(badgeOf('rivera'))) hint('La Canoa no aguanta esta corriente todavía: hace falta la Medalla Rivera.');
    return bump();
  }
  p.from = { x: p.x, y: p.y };
  p.x = nx;
  p.y = ny;
  p.moving = true;
  p.t = 0;
  p.dur = W_.bike ? BIKE_MS : input.held('b') ? RUN_MS : input.held('run') ? SPACE_MS : WALK_MS;
  p.step++;
}

let hintAt = 0;
function hint(msg) {
  const now = performance.now();
  if (now - hintAt < 2500 || W_.scriptRunning) return;
  hintAt = now;
  void runScript(() => say(msg));
}

let pushAt = 0;
/** Fuerza: walking against a boulder pushes it one tile, if the one behind it is free. */
function pushBoulder(dx, dy, bx, by) {
  const now = performance.now();
  if (now - pushAt < 350) return;
  pushAt = now;
  if (!hasItem('guantes')) return hint('Una roca enorme. Hace falta fuerza para moverla.');
  if (!flag(badgeOf('tacuarembo'))) return hint('La roca no se mueve. Con los Guantes de Domador hace falta la Medalla Tacuarembó.');
  const tx = bx + dx, ty = by + dy;
  const ch = tileAt(tx, ty);
  if (ch == null || TILE_INFO[ch]?.solid || ch === '~' || solidAt(tx, ty)) return bump();
  sfx('boulder');
  const put = (x, y, c) => { W_.tiles[y] = W_.tiles[y].slice(0, x) + c + W_.tiles[y].slice(x + 1); };
  put(bx, by, '.');
  put(tx, ty, '\\');
}

let fallAt = 0;
/** Trepar: walking up into a waterfall climbs it with the soga (asks first); walking down from the ledge drops back. */
function climbFalls(dx, dy, fx, fy) {
  const now = performance.now();
  if (now - fallAt < 400) return;
  fallAt = now;
  if (dy === 0) return bump();
  let ey = fy;
  while (tileAt(fx, ey) === 'Ϡ') ey += dy;
  if (tileAt(fx, ey) == null || TILE_INFO[tileAt(fx, ey)]?.solid || solidAt(fx, ey)) return bump();
  const go = () => { sfx('confirm'); W_.player = { ...W_.player, x: fx, y: ey, dir: dy < 0 ? 'up' : 'down', moving: false, from: null }; };
  if (dy > 0) return go();
  if (!hasItem('soga')) return hint('Una cascada cae por la pared. Con una soga se podría trepar.');
  void runScript(async () => {
    if (!(await ask('Una cascada cae sobre una cornisa. ¿Trepar con la soga?'))) return;
    go();
  });
}

/** Destello: lights up a dark map until the player leaves it. Returns what to tell the player. */
export function useFlash() {
  if (!hasItem('farol')) return 'No tenés con qué iluminar.';
  if (!flag(badgeOf('punta'))) return 'El farol no alcanza todavía: hace falta la Medalla Maldonado.';
  if (!W_.map?.dark) return 'Acá no hace falta.';
  if (W_.lit) return 'Ya está iluminado.';
  W_.lit = true;
  sfx('levelup');
  return '¡El farol ilumina todo el lugar!';
}

let bumpAt = 0;
function bump() {
  const now = performance.now();
  if (now - bumpAt > 300) { sfx('bump'); bumpAt = now; }
}

async function crossEdge(side, to) {
  const m2 = MAPS[to];
  linkWorld();
  const p = W_.player;
  let x, y;
  if (side === 'e') { x = 0; y = p.y; }
  else if (side === 'w') { x = m2.w - 1; y = p.y; }
  else if (side === 'n') { y = m2.h - 1; x = p.x; }
  else { y = 0; x = p.x; }
  x = Math.min(x, m2.w - 1);
  y = Math.min(y, m2.h - 1);
  // find nearest walkable tile along the arrival edge
  const walk = (cx, cy) => !TILE_INFO[m2.tiles[cy]?.[cx]]?.solid && m2.tiles[cy]?.[cx] != null;
  if (!walk(x, y)) {
    for (let d = 1; d < 200; d++) {
      const cand = side === 'e' || side === 'w' ? [[x, y - d], [x, y + d]] : [[x - d, y], [x + d, y]];
      const ok = cand.find(([cx, cy]) => walk(cx, cy));
      if (ok) { [x, y] = ok; break; }
    }
  }
  await fadeOut(180);
  loadMap(to, x, y, { e: 'right', w: 'left', n: 'up', s: 'down' }[side]);
  await fadeIn(180);
}

async function enterInterior(id) {
  sfx('door');
  const inner = MAPS[id];
  linkWorld();
  const mat = inner.mats[0];
  await doWarp(id, mat.x, mat.y, 'up');
}

async function exitInterior() {
  const ex = W_.map.exitTo;
  sfx('door');
  await doWarp(ex.map, ex.x, ex.y, 'down');
}

async function doWarp(map, x, y, dir) {
  await fadeOut(200);
  loadMap(map, x, y, dir);
  await fadeIn(200);
}

/**
 * Poison keeps hurting outside battle: every 4 steps each poisoned creature loses a little HP until it is
 * cured (Ruda) or healed (home, Policlínica). A creature that drops to 0 faints and the poison ends.
 * Returns true when a script (faint messages) took over.
 */
export function poisonTick() {
  const S = state();
  const sick = S.party.filter((c) => c.hp > 0 && c.status === 'psn');
  if (!sick.length) { W_.psnSteps = 0; return false; }
  W_.psnSteps = (W_.psnSteps ?? 0) + 1;
  if (W_.psnSteps % 4) return false;
  sfx('hit');
  W_.flash = 1;
  setTimeout(() => { W_.flash = 0; }, 90);
  const fallen = [];
  for (const c of sick) {
    c.hp = Math.max(0, c.hp - Math.max(1, Math.floor(maxHp(c) / 40)));
    if (c.hp === 0) { c.status = null; fallen.push(c); }
  }
  if (!fallen.length) return false;
  runScript(async () => {
    for (const c of fallen) await say(`¡${displayName(c)} cayó por el veneno!`);
    if (!S.party.some((c) => c.hp > 0)) await blackout();
  });
  return true;
}

function onStep() {
  const S = state();
  const p = W_.player;
  S.stats.steps++;
  S.pos = { map: W_.map.id, x: p.x, y: p.y, dir: p.dir };
  const ch = tileAt(p.x, p.y);
  if (W_.map.indoor && ch === 'm' && p.dir === 'down' && p.from && tileAt(p.from.x, p.from.y) !== 'm') {
    return void runScript(() => exitInterior());
  }
  if (S.repel > 0) {
    S.repel--;
    if (S.repel === 0) runScript(() => say('El efecto del Repelente se terminó.'));
  }
  // Getting into or out of the canoe splashes.
  if (p.from && (ch === '~') !== (tileAt(p.from.x, p.from.y) === '~')) sfx('splash');
  // Footsteps change with the ground: planks, sand and cobblestones each sound different (indoors: wood floors).
  if (ch === 'b') sfx('step_wood');
  else if (ch === 's') sfx('step_sand');
  else if (ch === 'c') sfx('step_stone');
  if (TILE_INFO[ch]?.enc) { sfx('grass'); W_.rustle = { x: p.x, y: p.y, t0: null }; }
  if (poisonTick()) return;
  // Route marker: walking right beside one saves the respawn point (it does not heal)
  if (!W_.map.indoor && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => tileAt(p.x + dx, p.y + dy) === 'Щ')) {
    const cp = S.checkpoint;
    if (!cp || cp.map !== W_.map.id || cp.x !== p.x || cp.y !== p.y) {
      S.checkpoint = { map: W_.map.id, x: p.x, y: p.y };
      sfx('confirm');
      toast('Punto de control guardado. Si tus criaturas caen, volverás acá.', 3500);
    }
  }
  // Scripted triggers
  for (const tr of W_.map.triggers ?? []) {
    if (p.x >= tr.x && p.x < tr.x + tr.w && p.y >= tr.y && p.y < tr.y + tr.h && cond(tr.cond)) {
      const npc = W_.npcs.find((n) => n.def.script === tr.script);
      return void runScript(() => SCRIPTS[tr.script](api, npc?.def ?? tr));
    }
  }
  // Trainers that can see you
  for (const n of W_.npcs) {
    const t = n.def.trainer;
    if (!t || !n.visible || flag(`tr_${t.id}`) || !n.def.sight) continue;
    if (sees(n)) return void runScript(() => trainerSpotted(n));
  }
  // Wild encounters. Grass never holds water creatures; they live in the water (canoe or rod). Caves have their own
  // biome: ground, rock, poison and bug creatures come out on any floor tile, with plain grass patches staying rare.
  if ((W_.map.enc || W_.map.fish) && S.party.some((c) => c.hp > 0)) {
    const base = W_.map.enc?.rate ?? 0.1;
    const cave = W_.map.theme === 'cueva';
    const surfing = ch === '~';
    const grass = !!TILE_INFO[ch]?.enc;
    const floor = cave && !surfing && !TILE_INFO[ch]?.solid;
    if (surfing || grass || floor) {
      const pick = encounterList(W_.map, surfing ? 'water' : cave ? 'cave' : 'grass', W_.map.indoor ? 0 : nightLevel());
      const rate = surfing ? Math.max(0.1, base * 0.7) : floor && !grass ? Math.min(0.1, base) : base;
      if (pick.length && worldRng.chance(rate)) {
        const e = worldRng.weighted(pick.map(([sp, lo, hi, w]) => ({ sp, lo, hi, w })));
        const lvl = worldRng.int(e.lo, e.hi);
        const lead = S.party.find((c) => c.hp > 0);
        if (S.repel > 0 && lvl < lead.level) return;
        return void runScript(() => wildBattle(e.sp, lvl));
      }
    }
  }
}

function sees(n) {
  const p = W_.player;
  if (n.def.look === 'swimmer' && tileAt(p.x, p.y) !== '~') return false; // swimmers only challenge people who are on the water
  if (n.def.adjacent) { // only wakes up when the player stands right next to it, from any side
    const ax = p.x - n.x, ay = p.y - n.y;
    if (Math.abs(ax) + Math.abs(ay) !== 1) return false;
    n.dir = ax === 1 ? 'right' : ax === -1 ? 'left' : ay === 1 ? 'down' : 'up';
    return true;
  }
  const [dx, dy] = DIRS[n.face ?? n.dir]; // patrolling trainers watch the trail even while stepping sideways
  for (let i = 1; i <= n.def.sight; i++) {
    const x = n.x + dx * i;
    const y = n.y + dy * i;
    if (x === p.x && y === p.y) return true;
    if (tileAt(x, y) !== '~' && solidAt(x, y, { ignorePlayer: true })) return false; // trainers see across open water
  }
  return false;
}

async function trainerSpotted(n) {
  sfx('encounter');
  playMusic('spotted', { resume: musicFor(W_.map.id, W_.map) });
  W_.emote = { npc: n, until: performance.now() + 700 };
  await wait(700);
  W_.emote = null;
  // walk up to the player
  if (n.face) n.dir = n.face;
  const [dx, dy] = DIRS[n.dir];
  const p = W_.player;
  while (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) > 1) {
    await npcStep(n, dx, dy);
  }
  p.dir = opposite(n.dir);
  await trainerTalk(n);
  playMusic(musicFor(W_.map.id, W_.map));
}

const tollPaidAt: Record<string, number> = {};
const tollTries: Record<string, number> = {};
const opposite = (d) => ({ up: 'down', down: 'up', left: 'right', right: 'left' })[d];

function npcStep(n, dx, dy) {
  return new Promise((res) => {
    n.from = { x: n.x, y: n.y };
    n.x += dx;
    n.y += dy;
    n.moving = true;
    n.t = 0;
    n.dur = WALK_MS;
    n.onDone = res;
  });
}

function updateNpc(n, now, dt) {
  if (n.moving) {
    n.t += dt;
    if (n.t >= n.dur) {
      n.moving = false;
      n.onDone?.();
      n.onDone = null;
    }
    return;
  }
  // Route trainers that pace along the trail: they keep facing it while they walk back and forth
  if (n.def.patrol && n.visible && !W_.scriptRunning && !input.busy) {
    if (now < n.wanderAt) return;
    n.wanderAt = now + 1100 + worldRng.next() * 1900;
    const [px, py, len] = n.def.patrol;
    const sgn = n.pdir ?? 1;
    const nx = n.x + px * sgn, ny = n.y + py * sgn;
    const off = (nx - n.ox) * px + (ny - n.oy) * py;
    if (Math.abs(off) > len || solidAt(nx, ny, { self: n }) || W_.map.doorWarps?.[`${nx},${ny}`] || tileAt(nx, ny) === 'm') { n.pdir = -sgn; return; }
    // The sprite shows the way it walks (not the way it watches), and goes back to watching the trail when it stops.
    n.face ??= n.dir;
    n.dir = px * sgn > 0 ? 'right' : px * sgn < 0 ? 'left' : py * sgn > 0 ? 'down' : 'up';
    void npcStep(n, px * sgn, py * sgn).then(() => { n.dir = n.face; });
    return;
  }
  // Townsfolk that stand still glance around now and then, and turn toward the player when they pass close by.
  if (!n.def.wander && n.visible && !W_.scriptRunning && !input.busy && n.def.look && n.def.look !== 'ball' && n.def.look !== 'machine'
      && !n.def.script && !n.def.trainer && !n.def.sight && !n.def.patrol && !n.def.gate && !n.def.blocker && !n.def.critter && !String(n.def.look).startsWith('animal:')) {
    n.glanceAt ??= now + 1500 + worldRng.next() * 5000;
    if (now >= n.glanceAt) {
      n.glanceAt = now + 2500 + worldRng.next() * 6000;
      const p = W_.player;
      const near = Math.abs(p.x - n.x) + Math.abs(p.y - n.y) <= 3;
      if (near && worldRng.chance(0.6)) n.dir = Math.abs(p.x - n.x) > Math.abs(p.y - n.y) ? (p.x > n.x ? 'right' : 'left') : (p.y > n.y ? 'down' : 'up');
      else if (worldRng.chance(0.3)) n.dir = worldRng.pick(Object.keys(DIRS));
    }
    return;
  }
  if (!n.def.wander || !n.visible || W_.scriptRunning || input.busy) return;
  if (now < n.wanderAt) return;
  n.wanderAt = now + 1500 + worldRng.next() * 3000;
  const d = worldRng.pick(Object.keys(DIRS));
  n.dir = d;
  const [dx, dy] = DIRS[d];
  const nx = n.x + dx;
  const ny = n.y + dy;
  if (Math.abs(nx - n.ox) > 2 || Math.abs(ny - n.oy) > 2) return;
  if (solidAt(nx, ny, { self: n })) return;
  if (W_.map.doorWarps?.[`${nx},${ny}`] || tileAt(nx, ny) === 'm') return;
  npcStep(n, dx, dy);
}

// ---------------------------------------------------------------- interaction
function interact() {
  const p = W_.player;
  const [dx, dy] = DIRS[p.dir];
  let tx = p.x + dx;
  let ty = p.y + dy;
  // talk across counters
  if (tileAt(tx, ty) === 'n') { tx += dx; ty += dy; }
  const n = W_.npcs.find((o) => o.visible && o.x === tx && o.y === ty);
  if (n) return void runScript(() => talkTo(n));
  const it = W_.items.find((o) => o.x === tx && o.y === ty);
  if (it) return void runScript(() => pickItem(it));
  if (W_.legend && W_.legend.x === tx && W_.legend.y === ty) return void runScript(() => legendEncounter(W_.legend));
  const key = `${p.x + dx},${p.y + dy}`;
  if (tileAt(p.x + dx, p.y + dy) === 'S' && W_.map.signText?.[key]) {
    return void runScript(() => say(W_.map.signText[key].split('\n').join(' — ')));
  }
  if (tileAt(p.x + dx, p.y + dy) === 'B') return void runScript(() => say(worldRng.pick(BOOKS)));
  if (tileAt(p.x + dx, p.y + dy) === 'Щ') return void runScript(() => say(['Un mojón de la ruta, con el kilómetro pintado en rojo.', 'Quien pasa a su lado queda anotado en el punto de control: si las criaturas caen, se despierta acá con la salud completa.', 'No se puede curar a nadie en este lugar. Para eso hace falta una Policlínica.']));
  if (tileAt(p.x + dx, p.y + dy) === 'P' && !n) return void runScript(() => openPC());
  if (tileAt(p.x + dx, p.y + dy) === '%') return void runScript(() => cutBush(p.x + dx, p.y + dy));
  if (tileAt(p.x + dx, p.y + dy) === '~') return void runScript(() => fish());
}

const BOOKS = [
  'Un libro: "Guía de aves del Uruguay". Hay un dibujo de un hornero en su nido.',
  'Un libro: "Recetas de la abuela". La página del arroz con leche está manchada.',
  'Un libro: "Historia del candombe". Tiene fotos de llamadas en Barrio Sur.',
  'Un libro: "Tipos de criaturas". Fuego vence a Planta, Planta vence a Agua, Agua vence a Fuego.',
  'Un libro: "Leyendas orientales". Habla de un ave enorme que trae el viento pampero.',
];

async function talkTo(n) {
  const p = W_.player;
  if (n.def.look && n.def.look !== 'ball') n.dir = opposite(p.dir);
  const d = n.def;
  if (d.trainer) return trainerTalk(n);
  if (d.script) return SCRIPTS[d.script](api, d);
  if (d.text) {
    if (foggyHere() && !d.critter) return say(fogTalk(n));
    const g = localGossip(d);
    return say(g ? [...(Array.isArray(d.text) ? d.text : [d.text]), g] : d.text);
  }
}

/** Townsfolk of a city whose gym the player has beaten, or everyone once the league is won, sometimes add a remark about it. */
function localGossip(d) {
  const m = W_.map;
  if (m.indoor || d.critter || d.gate || d.trainer || d.script) return null;
  if (((d.x * 5 + d.y * 11) % 3) !== 0) return null;
  if (flag('champion')) {
    const L = ['Dicen que alguien venció a la Liga entera. Con razón se vive más tranquilo.', 'Ahora el cielo está despejado. Ojalá dure.', 'Se habla del campeón en todos los almacenes del país.'];
    return L[(d.x + d.y) % L.length];
  }
  const stop = (STOPS as any[]).find((st) => st.id === m.id && st.gym);
  if (stop && flag(badgeOf(stop.id))) {
    const L = ['Te vi ganar en el gimnasio. ¡Qué combate!', 'Andá y contale al resto: en este pueblo ya hay un domador de verdad.', 'Dicen que venciste a nuestro líder. Bien hecho, che.'];
    return L[(d.x + d.y) % L.length];
  }
  return null;
}

const FOG_TALK = [
  ['No se ve nada con esta niebla. Ni siquiera sé si es de día.', 'Alguien tiene que hacer algo contra la banda del PP.'],
  ['Hace días que no veo el sol. Esa niebla no es natural.', 'Ya es hora de que alguien frene al Proyecto Pampero.'],
  ['Salí a caminar y casi me caigo al río. No se ve a dos pasos.', 'Dicen que las máquinas del PP la hacen. Que alguien las apague.'],
  ['Con esta niebla no me animo ni a cruzar la calle.', 'Alguien debería meterse con el PP, antes de que empeore.'],
  ['Todo gris, todo húmedo. Así no se puede trabajar.', 'Quiero que alguien le haga frente a esa banda del PP.'],
];
const fogTalk = (n) => FOG_TALK[(n.def.x * 7 + n.def.y * 3) % FOG_TALK.length];
/** The zone is under PP fog: a running machine here, or the Cabo Polonio / Quebrada fog that has not been cleared. */
function foggyHere() {
  const m = W_.map;
  if (m.indoor || m.dark) return false;
  return activeMachines().length > 0 || (m.id === 'cabo' && !flag('cabo_clear')) || (m.id === 'quebrada' && !flag('quebrada_clear'));
}

// Tiles that give light to the WebGL layer: [dy = height of the glow inside the tile, radius in logical px, colour, strength].
const LIGHT_TILES = {
  '|': { dy: 3, r: 30, color: 0xffd890, s: 0.7 },
  'Σ': { dy: 4, r: 30, color: 0xffd890, s: 0.7 },
  'П': { dy: 8, r: 26, color: 0xff9a40, s: 0.85, always: true },
  w: { dy: 8, r: 16, color: 0xffe0a0, s: 0.45 },
};

// Rematches: a common trainer belongs to the first gym ahead of their map (everything before Trinidad
// belongs to Trinidad's medal) and only offers a rematch once you hold the medal two gyms later.
// Each extra medal (and the Liga) raises the tier: stronger, already evolved teams.
// Rivals, leaders and bosses use scripts, not this path.
const RM_BONUS = [0, 4, 7, 10, 13, 16, 19, 22, 25, 28];
export function rematchTier(mapId, team = []) {
  const ref = refGymOrder(mapId, Math.max(0, ...team.map((m) => m[1])));
  const progress = badgeCount() + (flag('champion') ? 1 : 0);
  return Math.max(0, Math.min(RM_BONUS.length - 1, progress - ref - 1));
}

function rematchTeam(team, tier) {
  return team.map(([sp, lv]) => {
    const level = Math.min(90, lv + RM_BONUS[tier]);
    let key = sp;
    for (let evo = SPECIES[key].evo; evo && !evo.stone && level >= evo.lvl; evo = SPECIES[key].evo) key = evo.to;
    return [key, level];
  });
}

async function trainerTalk(n) {
  const t = n.def.trainer;
  if (flag(`tr_${t.id}`)) {
    const tier = rematchTier(W_.map.id, t.team);
    if (tier < 1 || flag(`rm${tier}_${t.id}`)) return say(t.after, { name: t.name });
    await say([t.after, 'Estuve entrenando desde la última vez.'].flat().filter(Boolean), { name: t.name });
    if (!(await ask('¿Aceptás una revancha?'))) return;
    const res = await api.battle({ ...t, intro: ['Ahora no me vas a ganar tan fácil.'], team: rematchTeam(t.team, tier), prize: Math.round(t.prize * (1 + tier * 0.8)) });
    if (res === 'win') setFlag(`rm${tier}_${t.id}`);
    return;
  }
  const res = await api.battle(t);
  if (res === 'win') {
    setFlag(`tr_${t.id}`);
    if (t.after) await say(t.after, { name: t.name });
    if (n.def.gate) refreshEntities();
  }
}

async function pickItem(it) {
  setFlag(`it_${it.id}`);
  addItem(it.item, 1);
  refreshEntities();
  const j = jingle(ITEMS[it.item].pocket === 'key' ? 'key' : 'item');
  await say(`¡Obtuviste ${ITEMS[it.item].name}!`);
  await j;
}

async function legendEncounter(L) {
  await say(L.text);
  sfx('encounter');
  const c = createCreature(L.species, L.level);
  const res = await runBattle({ foes: [c], wild: true, bg: W_.map.bg, music: 'battle' });
  if (res === 'caught') setFlag(L.flag);
  else if (res === 'win') await say(`${SPECIES[L.species].name} desapareció… Quizás vuelva más tarde.`);
  if (res === 'lose') await blackout();
  refreshEntities();
}

async function cutBush(x, y) {
  if (!hasItem('machete')) return say('Un zarzal espeso y espinoso. Con algo filoso se podría abrir paso.');
  if (W_.map.id === 'fraybentos' && !flag(badgeOf('fraybentos'))) return say('Un zarzal espeso. Para usar el Machete hace falta la Medalla de Fray Bentos.');
  if (W_.map.id !== 'fraybentos' && !flag(badgeOf('salto'))) return say('Un zarzal espeso. El Machete no alcanza todavía: hace falta la Medalla Salto.');
  await say('Un zarzal espeso. Con el Machete se puede abrir paso.');
  if (!(await ask('¿Cortar el zarzal?'))) return;
  sfx('cut');
  W_.rustle = { x, y, t0: null };
  setFlag(`cl_${W_.map.id}_${x}_${y}`);
  W_.tiles[y] = W_.tiles[y].slice(0, x) + '.' + W_.tiles[y].slice(x + 1);
  await say('¡Despejaste el camino!');
}

/** Cities the Silbato del Hornero can reach: visited maps with a Policlínica facade. */
/** Gets on or off the bicycle (menu item). Returns the message to show. */
export function toggleBike() {
  const m = W_.map;
  if (m.indoor) return 'No se puede usar la bicicleta bajo techo.';
  if (W_.bike) {
    if (m.bikeOnly) return 'En la Ciclovía hay que ir en bicicleta.';
    W_.bike = false;
    return 'Te bajaste de la bicicleta.';
  }
  W_.bike = true;
  sfx('bell');
  return 'Te subiste a la bicicleta.';
}

export function flyPoints() {
  linkWorld();
  const out = [];
  for (const [id, m] of Object.entries(OUTDOOR)) {
    if (!flag(`v_${id}`)) continue;
    for (let y = 0; y < m.tiles.length; y++) {
      const x = m.tiles[y].indexOf('IIDII');
      if (x >= 0) { out.push({ id, name: m.name, x: x + 2, y: y + 1 }); break; }
    }
  }
  return out;
}

export async function flyTo(pt) {
  sfx('door');
  await doWarp(pt.id, pt.x, pt.y, 'down');
}

/**
 * What a rod can pull out of a map's fishing table: the Caña Vieja only gets the most common creature
 * at the low end of its level range, the Caña Buena the two most common up to the middle, and the
 * Súper Caña everything over the full range.
 */
export function fishFor(table, rod) {
  const byWeight = [...table].sort((a, b) => b[3] - a[3]);
  if (rod >= 3) return byWeight;
  const n = rod === 1 ? 1 : Math.min(2, byWeight.length);
  return byWeight.slice(0, n).map(([sp, lo, hi, w]) => [sp, lo, rod === 1 ? Math.min(hi, lo + 1) : Math.max(lo, Math.round((lo + hi) / 2)), w]);
}

/** Fishing: needs a rod and a `fish` table on the map. */
async function fish() {
  const rod = hasItem('cana_super') ? 3 : hasItem('cana_buena') ? 2 : hasItem('cana_pescar') ? 1 : 0;
  if (!rod) return say('El agua está turbia. Sin una caña, mejor no meterse.');
  const list = waterTable(W_.map, rod);
  if (!state().party.some((c) => c.hp > 0)) return say('Tus criaturas están debilitadas. Mejor no arriesgarse.');
  const contest = !!(state().contest as any)?.fish;
  if (contest && fishLeft() <= 0) return say('Se terminó el tiempo del concurso. Llevale tu mejor pez al juez.');
  const pl = W_.player;
  const [dx, dy] = DIRS[pl.dir];
  const fs = (W_.fishing = { phase: 'cast', tx: pl.x + dx, ty: pl.y + dy, dx, dy, t0: null });
  const to = (phase) => { fs.phase = phase; fs.t0 = null; };
  try {
    sfx('cast');
    await say('Lanzaste la caña al agua…', { auto: 700 });
    to('wait');
    await wait(1100 + worldRng.int(0, 1500));
    if (!worldRng.chance(contest ? 0.85 : 0.75)) {
      to('nothing');
      await wait(1100);
      W_.fishing = null;
      return say('No picó nada. Probá de nuevo.');
    }
    to('bite');
    sfx('bite');
    await wait(650);
    await say('¡Algo picó!', { auto: 600 });
  } finally {
    W_.fishing = null;
  }
  const e = worldRng.weighted(list.map(([sp, lo, hi, w]) => ({ sp, lo, hi, w })));
  if (contest) {
    // Fishing contest: the catch goes straight to the box and is judged afterwards.
    const S = state();
    if (fishLeft() <= 0) return say('Llegó tarde: se acabó el tiempo y la línea quedó floja.');
    const c = createCreature(e.sp, worldRng.int(e.lo, e.hi));
    c.ot = S.player.id;
    markCaught(c.species);
    S.stats.caught++;
    S.contest.uids.push(c.uid);
    S.box.push(c);
    sfx('catch');
    await say(`¡Sacaste un ${SPECIES[c.species].name} de nivel ${c.level}! Vale ${contestScore(c)} puntos.`);
    const left = Math.max(0, Math.ceil(fishLeft() / 1000));
    toast(`Tiempo restante: ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 2500);
    return;
  }
  await wildBattle(e.sp, worldRng.int(e.lo, e.hi));
}

async function wildBattle(sp, lvl) {
  const c = createCreature(sp, lvl);
  const res = await runBattle({ foes: [c], wild: true, bg: W_.map.bg });
  if (res === 'lose') await blackout();
}

async function blackout() {
  const S = state();
  // Small penalty, comparable to a trainer prize: 10% of the money, capped by progress.
  const lost = loseMoney(Math.min(Math.floor(S.player.money / 10), 100 + 50 * badgeCount()));
  await say([`Perdiste $${lost} en la confusión…`, '…', S.checkpoint ? 'Despertaste junto al último mojón de la ruta, con tus criaturas recuperadas.' : '¡Corriste a un lugar seguro para curar a tus criaturas!']);
  for (const c of S.party) healCreature(c);
  const lh = S.checkpoint ?? S.lastHeal;
  await fadeOut(300);
  loadMap(lh.map, lh.x, lh.y, 'up');
  await fadeIn(300);
}

/** Run a script exclusively (pauses world updates). */
export async function runScript(fn) {
  if (W_.scriptRunning) return;
  W_.scriptRunning = true;
  input.clear();
  try {
    await fn();
    // Lost a friendly (rival) match: after the scene, the party rests at the last place it healed (the mother's house by default).
    if (W_.sendHome) {
      W_.sendHome = false;
      const lh = state().lastHeal;
      await say('Volviste a descansar para recuperarte.');
      await fadeOut(300);
      loadMap(lh.map, lh.x, lh.y, 'up');
      await fadeIn(300);
    }
  } catch (err) {
    console.error(err);
    await say(`Ups, algo salió mal: ${err.message}`);
  } finally {
    closeDialog();
    W_.scriptRunning = false;
    input.clear();
    refreshEntities();
  }
}

// ---------------------------------------------------------------- script API
export const api = {
  get state() { return state(); },
  say: (t, o) => say(t, o),
  ask: (q, o) => ask(q, o),
  choose: (o, opts) => choose(o, opts),
  flag,
  setFlag,
  hasItem,
  countItem: (k) => state().bag[k] ?? 0,
  badges: () => badgeCount(),
  takeItem: (k, q = 1) => removeItem(k, q),
  sfx,
  jingle,
  wait,
  starterKey: () => ['ceibito', 'tejuchispa', 'carpinchito'].find((k) => flag(`starter_${k}`)) ?? 'ceibito',
  typeNames: (k) => SPECIES[k].types.map((t) => TYPES[t].name).join('/'),
  async give(item, qty = 1) {
    addItem(item, qty);
    const j = jingle(ITEMS[item].pocket === 'key' ? 'key' : 'item');
    await say(`¡{player} recibió ${ITEMS[item].name}${qty > 1 ? ` ×${qty}` : ''}!`);
    await j;
  },
  giveCreature(sp, lvl) {
    const S = state();
    const c = createCreature(sp, lvl, { ot: S.player.id });
    markCaught(sp);
    if (S.party.length < PARTY_MAX) S.party.push(c);
    else S.box.push(c);
    return c;
  },
  /** Trade: the player hands over a creature of species `want`; gets `offer` at the same level (OT: the player). Returns true if traded. */
  async tradeCreature(want, offer) {
    const S = state();
    const i = await openParty({ mode: 'select', title: `Entregar un ${SPECIES[want].name}` });
    if (i < 0) return false;
    const old = S.party[i];
    if (old.species !== want) { await say(`Eso no es un ${SPECIES[want].name}.`); return false; }
    if (S.party.filter((c, k) => k !== i && c.hp > 0).length < 1) { await say('Necesitás otra criatura en condiciones para seguir viaje.'); return false; }
    const nw = createCreature(offer, old.level, { ot: S.player.id });
    markCaught(offer);
    S.party[i] = nw;
    sfx('confirm');
    return true;
  },
  /** Guardería: a creature left here gains experience for every step the player takes (stored in the box, S.daycare marks it). */
  async daycare() {
    const S = state();
    const dc = S.daycare;
    const kept = dc && S.box.find((c) => c.uid === dc.uid);
    if (dc && !kept) S.daycare = null;
    if (!S.daycare) {
      await say(['Bienvenido a la guardería. Cuido a tus criaturas mientras caminás: ganan experiencia con cada paso que das.', 'Dejala y volvé cuando quieras. Retirarla cuesta un poco más cuanto más haya crecido.']);
      if (!(await ask('¿Querés dejar una criatura?'))) return;
      if (S.party.filter((c) => c.hp > 0).length < 2) return say('Necesitás otra criatura en condiciones para seguir viaje.');
      const i = await openParty({ mode: 'select', title: '¿A quién dejás?' });
      if (i < 0) return;
      const c = S.party[i];
      if (S.party.filter((x, k) => k !== i && x.hp > 0).length < 1) return say('Necesitás otra criatura en condiciones para seguir viaje.');
      S.party.splice(i, 1);
      S.box.push(c);
      S.daycare = { uid: c.uid, steps: S.stats.steps };
      sfx('confirm');
      return say(`${displayName(c)} queda en buenas manos. Volvé cuando quieras.`);
    }
    const gained = Math.max(0, (S.stats.steps - dc.steps) * 2);
    const sim = { ...kept, moves: kept.moves.map((m) => ({ ...m })) };
    const before = sim.level;
    gainExp(sim, gained);
    const levels = sim.level - before;
    const price = 100 + levels * 80;
    await say(`${displayName(kept)} está bien. Subió ${levels} ${levels === 1 ? 'nivel' : 'niveles'} desde que lo dejaste.`);
    if (S.party.length >= PARTY_MAX) return say('Tu equipo está completo. Dejá lugar y volvé a buscarla.');
    if (!(await ask(`¿Retirar a ${displayName(kept)} por $${price}?`))) return;
    if (S.player.money < price) return say('No te alcanza el dinero.');
    loseMoney(price);
    S.box.splice(S.box.indexOf(kept), 1);
    S.daycare = null;
    S.party.push(kept);
    const { learnFlow } = await import('./battle-scene.ts');
    sfx('levelup');
    for (const ev of gainExp(kept, gained)) {
      if (ev.type === 'learn') await learnFlow(kept, ev.move);
    }
    await say(`¡${displayName(kept)} está en el nivel ${kept.level}!`);
  },
  /**
   * Criadero (Tacuarembó): up to three creatures stay here and gain experience with every step the player takes
   * (stored in the box, S.criadero marks them). Picking one up costs more the more it grew, and it can evolve on the spot.
   */
  async criadero() {
    const S = state();
    S.criadero = (S.criadero ?? []).filter((e) => S.box.some((c) => c.uid === e.uid));
    const MAX = 3;
    const growth = (e) => {
      const kept = S.box.find((c) => c.uid === e.uid);
      const gained = Math.max(0, (S.stats.steps - e.steps) * 3);
      const sim = { ...kept, moves: kept.moves.map((m) => ({ ...m })) };
      const before = sim.level;
      gainExp(sim, gained);
      return { kept, gained, levels: sim.level - before, price: 150 + (sim.level - before) * 120 };
    };
    await say(['Bienvenido al Criadero Los Teros. Acá las criaturas crecen con aire libre y buen pasto.', `Podés dejar hasta ${MAX}. Ganan experiencia con cada paso que das, y al retirarlas cobramos según lo que crecieron.`]);
    for (;;) {
      const opts = ['Dejar una criatura', ...(S.criadero.length ? ['Retirar una criatura'] : []), 'Nada, gracias'];
      const r = await choose(opts, { cancel: true });
      const pick = r < 0 ? 'Nada, gracias' : opts[r];
      if (pick === 'Nada, gracias') return say('Cuando quieras. Acá las cuidamos bien.');
      if (pick === 'Dejar una criatura') {
        if (S.criadero.length >= MAX) { await say('Los corrales están llenos. Retirá a alguna primero.'); continue; }
        if (S.party.filter((c) => c.hp > 0).length < 2) { await say('Necesitás otra criatura en condiciones para seguir viaje.'); continue; }
        const i = await openParty({ mode: 'select', title: '¿A quién dejás?' });
        if (i < 0) continue;
        const c = S.party[i];
        if (S.party.filter((x, k) => k !== i && x.hp > 0).length < 1) { await say('Necesitás otra criatura en condiciones para seguir viaje.'); continue; }
        S.party.splice(i, 1);
        S.box.push(c);
        S.criadero.push({ uid: c.uid, steps: S.stats.steps });
        sfx('confirm');
        await say(`${displayName(c)} se va al corral. Caminá tranquilo, que acá crece.`);
        continue;
      }
      const list = S.criadero.map((e) => ({ e, ...growth(e) }));
      const names = [...list.map((x) => `${displayName(x.kept)} Nv${x.kept.level} (+${x.levels})`), 'Volver'];
      const k = await choose(names, { cancel: true });
      if (k < 0 || k >= list.length) continue;
      const { e, kept, gained, levels, price } = list[k];
      await say(`${displayName(kept)} está bien. Subió ${levels} ${levels === 1 ? 'nivel' : 'niveles'} desde que lo dejaste.`);
      if (S.party.length >= PARTY_MAX) { await say('Tu equipo está completo. Dejá lugar y volvé a buscarla.'); continue; }
      if (!(await ask(`¿Retirar a ${displayName(kept)} por $${price}?`))) continue;
      if (S.player.money < price) { await say('No te alcanza el dinero.'); continue; }
      loseMoney(price);
      S.box.splice(S.box.indexOf(kept), 1);
      S.criadero.splice(S.criadero.indexOf(e), 1);
      S.party.push(kept);
      const { learnFlow, evolutionScene } = await import('./battle-scene.ts');
      sfx('levelup');
      for (const ev of gainExp(kept, gained)) {
        if (ev.type === 'learn') await learnFlow(kept, ev.move);
      }
      await say(`¡${displayName(kept)} está en el nivel ${kept.level}!`);
      if (canEvolve(kept)) await evolutionScene(kept);
    }
  },
  /** Gym rematches unlock every two gyms (badges, Liga, PP base) after the one being challenged. */
  gymRematchTier(order) {
    const progress = badgeCount() + (flag('champion') ? 1 : 0) + (flag('pp_clear') ? 1 : 0);
    return clamp(Math.floor((progress - order) / 2), 0, 4);
  },
  rematchTeam,
  async healParty({ silent = false } = {}) {
    const party = state().party;
    for (const c of party) healCreature(c);
    if (!silent) {
      // The classic healing machine: the screen dims, one ball per creature sits in a row and each lights up in turn.
      const prev = getRenderer();
      const t0 = performance.now();
      const n = party.length;
      setRenderer((g, t) => {
        prev?.(g, t);
        const age = performance.now() - t0;
        g.fillStyle = `rgba(6,8,24,${Math.min(0.7, age / 300)})`;
        g.fillRect(0, 0, W, H);
        const x0 = W / 2 - (n - 1) * 13;
        for (let i = 0; i < n; i++) {
          const x = x0 + i * 26, y = H / 2;
          drawBallIcon(g, x, y);
          const lit = age - 500 - i * 260;
          if (lit > 0) {
            const a = Math.min(1, lit / 120) * (0.6 + 0.4 * Math.sin(age / 60));
            g.fillStyle = `rgba(255,240,160,${a * 0.9})`;
            g.beginPath(); g.arc(x, y, 7 + Math.sin(age / 90), 0, 7); g.fill();
            drawBallIcon(g, x, y);
          }
        }
      });
      await wait(500);
      const j = jingle('heal');
      await wait(Math.max(900, n * 260 + 700));
      setRenderer(prev);
      await j;
    }
  },
  setLastHeal() {
    const p = W_.player;
    state().lastHeal = { map: W_.map.id, x: p.x, y: p.y };
    state().checkpoint = null;
  },
  async battle(trainer, { canLose = false, music }: { canLose?: boolean; music?: string } = {}) {
    const foes = trainer.team.map(([sp, lvl]) => createCreature(sp, lvl));
    const res = await runBattle({ foes, wild: false, trainer, bg: W_.map.bg, canLose, music });
    if (res === 'lose') {
      if (canLose) { for (const c of state().party) healCreature(c); W_.sendHome = true; }
      else { await blackout(); }
    }
    return res;
  },
  async showCreature(key) {
    const img = h('img', { class: 'creature-pop', src: creatureIcon(key), alt: SPECIES[key].name, width: 80, height: 80 });
    uiRoot().append(img);
    W_.showCreature = img;
    sfx('confirm');
  },
  hideCreature() {
    W_.showCreature?.remove();
    W_.showCreature = null;
  },
  async npcLeave(id) {
    const n = W_.npcs.find((o) => o.def.id === id);
    if (!n) return;
    await fadeOut(150);
    n.gone = true;
    n.visible = false;
    await fadeIn(150);
  },
  /** After an event: the owner walks in from behind the player and stops beside them (never spawns on top of them). */
  async ownerArrives(ev) {
    const n = W_.npcs.find((o) => o.def.script === 'event_owner' && o.def.event === ev);
    if (!n) return;
    const p = W_.player;
    n.gone = false;
    n.visible = false;
    const [bx, by] = DIRS[p.dir];
    const near = [[-bx, -by], [-by, bx], [by, -bx], [bx, by]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter((c) => !solidAt(c.x, c.y, { self: n }));
    const dest = near[0];
    if (!dest) { n.x = n.ox = n.def.x; n.y = n.oy = n.def.y; n.visible = true; return; }
    // breadth-first from the destination: the farthest free tile within 6 steps is where he comes from
    const prev = new Map([[`${dest.x},${dest.y}`, null]]);
    const dist = new Map([[`${dest.x},${dest.y}`, 0]]);
    const q = [dest];
    let far = dest;
    while (q.length) {
      const c = q.shift();
      const d = dist.get(`${c.x},${c.y}`);
      if (d > dist.get(`${far.x},${far.y}`)) far = c;
      if (d >= 6) continue;
      for (const [dx, dy] of Object.values(DIRS) as number[][]) {
        const nx = c.x + dx, ny = c.y + dy, k = `${nx},${ny}`;
        if (dist.has(k) || (nx === p.x && ny === p.y) || solidAt(nx, ny, { self: n }) || W_.map.doorWarps?.[k]) continue;
        dist.set(k, d + 1);
        prev.set(k, c);
        q.push({ x: nx, y: ny });
      }
    }
    n.x = far.x; n.y = far.y; n.moving = false;
    n.visible = true;
    await wait(250);
    let c = far;
    while (prev.get(`${c.x},${c.y}`)) {
      const nx = prev.get(`${c.x},${c.y}`);
      const dx = nx.x - c.x, dy = nx.y - c.y;
      n.dir = dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';
      await npcStep(n, dx, dy);
      c = nx;
    }
    const ax = p.x - n.x, ay = p.y - n.y;
    n.dir = Math.abs(ax) >= Math.abs(ay) ? (ax < 0 ? 'left' : 'right') : (ay < 0 ? 'up' : 'down');
    p.dir = opposite(n.dir);
    n.ox = n.x; n.oy = n.y;
  },
  /** Toll booths: paying lets the player through (and back) for a while; failed tries are counted for this session. */
  tollRecent: (id) => (state().stats.steps - (tollPaidAt[id] ?? -9999)) < 150,
  tollPaid(id) { tollPaidAt[id] = state().stats.steps; tollTries[id] = 0; },
  tollTry(id) { tollTries[id] = (tollTries[id] ?? 0) + 1; return tollTries[id]; },
  /** Sends the player back to the tile they just came from (fade, same map). */
  async stepBack() {
    const p = W_.player;
    const to = p.from ?? { x: p.x, y: p.y };
    await doWarp(W_.map.id, to.x, to.y, opposite(p.dir));
  },
  /** Moves the player to another map with a fade (used when the ferry sails). */
  warp: (map, x, y, dir = 'down') => doWarp(map, x, y, dir),
  /** The tile in front of the door of `map` that leads to `to` (where someone stepping out of that building stands). */
  doorFront(map, to) {
    const m = MAPS[map];
    const k = m.doors.findIndex((d) => (typeof d === 'string' ? d : d.to) === to);
    let n = 0;
    for (let y = 0; y < m.tiles.length; y++) for (let x = 0; x < m.tiles[y].length; x++) if (m.tiles[y][x] === 'D' && n++ === k) return { x, y: y + 1 };
    return { x: 2, y: 2 };
  },
  pay: (n) => spend(n),
  /** Buy safari time: the clock only runs inside the Safari map. */
  safariStart(minutes) {
    state().safari = { until: Date.now() + minutes * 60000 };
    addItem('safari_ball', 30);
    addItem('cebo', 15);
  },
  safariLeft: () => Math.max(0, safariLeft()),
  safariLeave() { state().safari = null; safariStrip(); },
  get safariGate() { return gateFor('safari'); },
  /** Capture contest: the timed park with 20 balls; creatures caught go to the box and are judged afterwards. */
  contestStart(minutes, balls) {
    const S = state();
    S.safari = { until: Date.now() + minutes * 60000, contest: true };
    S.contest = { uids: [] };
    addItem('safari_ball', balls);
  },
  contestActive: () => !!state().contest,
  contestGate: () => gateFor('parque_concurso'),
  contestLeave() { state().safari = null; safariStrip(); },
  contestCreatures() { const S = state(); const ids = new Set(S.contest?.uids ?? []); return S.box.filter((c) => ids.has(c.uid)); },
  /** Keep one creature (it stays in the box); the others are released. */
  contestFinish(keepUid) {
    const S = state();
    const ids = new Set(S.contest?.uids ?? []);
    S.box = S.box.filter((c) => !ids.has(c.uid) || c.uid === keepUid);
    S.contest = null;
    S.safari = null;
    safariStrip();
  },
  /** Fishing contest: a countdown on the pier; catches go to the box and are judged afterwards. */
  fishContestStart(minutes) { state().contest = { uids: [], fish: true, until: Date.now() + minutes * 60000 } as any; },
  fishContestRunning: () => !!(state().contest as any)?.fish,
  fishContestLeft: () => Math.max(0, fishLeft()),
  fishContestEnd() { state().contest = null; },
  fishContestFinish(keepUid) {
    const S = state();
    const ids = new Set(S.contest?.uids ?? []);
    const pick = S.box.find((c) => c.uid === keepUid);
    S.box = S.box.filter((c) => !ids.has(c.uid));
    if (pick) { if (S.party.length < PARTY_MAX) S.party.push(pick); else S.box.push(pick); }
    S.contest = null;
  },
  markSeen: (sp) => markSeen(sp),
  openShop: (stock) => openShop(stock),
  openPC: () => openPC(),
  async flash() {
    for (let i = 0; i < 3; i++) {
      W_.flash = 1;
      await wait(120);
      W_.flash = 0;
      await wait(120);
    }
  },
  hallOfFame: () => import('./scenes.ts').then((m) => m.hallOfFame()),
  /** Story cinematic by name (see game/cinematics.ts). */
  cinematic: (name) => import('./cinematics.ts').then((m) => m.playStoryScene(name)),
  credits: async () => {
    const m = await import('./scenes.ts');
    await m.credits();
    // Back home after the credits; the adventure continues.
    const S = state();
    S.lastHeal = { map: 'casa_jugador', x: 6, y: 5 };
    for (const c of S.party) healCreature(c);
    loadMap('casa_jugador', 6, 5, 'down');
    await fadeIn(400);
  },
};

// ---------------------------------------------------------------- render
function drawWorld(g, t) {
  const m = W_.map;
  if (!m) return;
  const p = W_.player;
  const ppos = entityPos(p);
  const mw = m.w * T;
  const mh = m.h * T;
  // Interiors are zoomed so the room always covers the whole canvas (the camera scrolls the rest).
  // whole-number zoom only: a fractional one makes some art pixels 2 px wide and others 3 (eyes shrink, lines break)
  const Z = m.indoor ? Math.min(3, Math.max(1, Math.round(Math.max(W / mw, H / mh)))) : 1;
  const VW = W / Z;
  const VH = H / Z;
  // camera
  let cx = ppos.x + T / 2 - VW / 2;
  let cy = ppos.y + T / 2 - VH / 2;
  cx = mw <= VW ? (mw - VW) / 2 : Math.max(0, Math.min(mw - VW, cx));
  cy = mh <= VH ? (mh - VH) / 2 : Math.max(0, Math.min(mh - VH, cy));
  cx = Math.round(cx);
  cy = Math.round(cy);
  backdrop(g);
  g.save();
  g.scale(Z, Z);
  if (mw < VW || mh < VH) mapGlow(g, Math.max(0, -cx), Math.max(0, -cy), Math.min(mw, VW), Math.min(mh, VH));
  const frame = Math.floor(t / 400);
  const night0 = nightLevel();
  const x0 = Math.max(0, Math.floor(cx / T));
  const y0 = Math.max(0, Math.floor(cy / T));
  const x1 = Math.min(m.w - 1, Math.ceil((cx + VW) / T));
  const y1 = Math.min(m.h - 1, Math.ceil((cy + VH) / T));
  for (let y = y0; y <= y1; y++) {
    const row = W_.tiles[y];
    for (let x = x0; x <= x1; x++) g.drawImage(tileCanvas(row[x], frame, m.theme, groundUnder(W_.tiles, x, y), tileVariant(W_.tiles, x, y)), x * T - cx, y * T - cy);
  }
  if (!m.theme) drawBigObjects(g, W_.tiles, x0, y0, x1, y1, cx, cy);
  if (!m.indoor) { drawShoreFoam(g, frame, t, x0, y0, x1, y1, cx, cy); drawCastShadows(g, x0, y0, x1, y1, cx, cy); }
  // light sources for the WebGL layer: street lamps, fires and (at night) lit windows
  {
    const lights = [];
    if (pixiActive()) {
      for (let y = y0; y <= y1; y++) {
        const row = W_.tiles[y];
        for (let x = x0; x <= x1; x++) {
          const ch = row[x];
          const L = LIGHT_TILES[ch];
          if (L && (L.always || night0 > 0.2)) lights.push({ x: ((x * T - cx) + 8) * Z, y: ((y * T - cy) + L.dy) * Z, r: L.r * Z, color: L.color, strength: L.s });
        }
      }
    }
    setFx(!m.indoor && !m.dark, night0, lights.slice(0, 48));
  }
  // ground items
  for (const it of W_.items) {
    shadow(g, it.x * T - cx + 8, it.y * T - cy + 13, 5, 2);
    drawGroundBall(g, it.x * T - cx, it.y * T - cy - 1);
  }
  // legend
  if (W_.legend) {
    const spr = creatureSprite(W_.legend.species);
    const bob = Math.sin(t / 300) * 2;
    g.drawImage(spr, W_.legend.x * T - cx - 8, W_.legend.y * T - cy - 18 + bob, 32, 32);
  }
  // entities sorted by y
  const ents: any[] = W_.npcs.filter((n) => n.visible).map((n) => ({ n, pos: entityPos(n) }));
  ents.push({ n: p, pos: ppos, player: true });
  ents.sort((a, b) => a.pos.y - b.pos.y);
  for (const { n, pos, player } of ents) {
    const sx = Math.round(pos.x - cx);
    const sy = Math.round(pos.y - cy);
    if (!player && n.def.look === null) continue;
    if (!player && n.def.look === 'ball') { drawBallIcon(g, sx + 8, sy + 6); continue; }
    if (!player && n.def.look === 'machine') { drawFogMachine(g, sx, sy, t); continue; }
    const look = player ? state().player.look : n.def.look;
    const frameIdx = n.moving ? ((n.step ?? Math.floor(n.t / 100)) % 2) + 1 : 0;
    // Four poses per direction: contact (1 or 2) in the first half of a tile, then a passing pose (0 or 3, alternating).
    const f = player && p.moving ? (p.t < p.dur / 2 ? (p.step % 2) + 1 : (p.step % 2 ? 3 : 0)) : n.moving ? frameIdx : 0;
    if (!player && typeof look === 'string' && look.startsWith('animal:')) {
      // creatures seen in the distance: they wander but cannot be fought or caught
      shadow(g, sx + 8, sy + 13, 6, 2.4);
      const hop = n.moving ? Math.abs(Math.sin(t / 90)) * 2 : 0;
      g.save();
      if (n.dir === 'left') { g.translate(sx + 20, 0); g.scale(-1, 1); g.drawImage(creatureSprite(look.slice(7)), 0, sy - 7 - hop, 24, 24); }
      else g.drawImage(creatureSprite(look.slice(7)), sx - 4, sy - 7 - hop, 24, 24);
      g.restore();
      continue;
    }
    shadow(g, sx + 8, sy + 13, 5.5, 2.2);
    // Jumping down a ledge: the sprite arcs up while its shadow stays on the ground.
    const hopK = player && p.moving && p.from && p.y - p.from.y === 2 ? Math.min(1, p.t / p.dur) : -1;
    const lift = hopK >= 0 ? Math.round(Math.sin(hopK * Math.PI) * 7) : 0;
    if (player && tileAt(p.x, p.y) === '~') {
      // wake behind the canoe while paddling
      if (p.moving) {
        const [wx, wy] = DIRS[p.dir];
        const k = (t / 260) % 1;
        g.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`;
        g.lineWidth = 1;
        g.beginPath(); g.ellipse(sx + 8 - wx * (8 + k * 6), sy + 12 - wy * (6 + k * 5), 4 + k * 5, 2 + k * 2, 0, 0, 7); g.stroke();
      }
      g.fillStyle = '#5a3a1a'; g.beginPath(); g.ellipse(sx + 8, sy + 12, 9.5, 4, 0, 0, 7); g.fill();
      g.fillStyle = '#a87a4a'; g.beginPath(); g.ellipse(sx + 8, sy + 11, 8, 3, 0, 0, 7); g.fill();
    }
    if (player && W_.bike) drawBike(g, sx, sy, n.dir);
    g.drawImage(charSprite(look, n.dir, f), sx, sy - 4 - (player && W_.bike ? 2 : 0) - lift);
    // Tall grass covers your feet, also while walking through it: the tile you are mostly on decides.
    const half = n.moving && n.from && n.t / n.dur < 0.5;
    const tx = half ? n.from.x : n.x;
    const ty = half ? n.from.y : n.y;
    if (TILE_INFO[tileAt(tx, ty)]?.enc && lift === 0) {
      const sway = n.moving ? 1 : 0;
      g.drawImage(tileCanvas(','), 0, 10, 16, 6, sx, sy + 10 + sway, 16, 6 - sway);
    }
  }
  // Leaves kicked up when stepping into tall grass.
  if (W_.rustle) {
    const age = t - (W_.rustle.t0 ??= t);
    if (age > 360) W_.rustle = null;
    else {
      const q = age / 360;
      const bx = W_.rustle.x * T - cx + 8, by = W_.rustle.y * T - cy + 10;
      for (const [vx, vy, c] of [[-6, -7, '#3f9a3a'], [5, -8, '#6cc04a'], [-3, -10, '#2f7a2e'], [7, -5, '#8ad860']] as [number, number, string][]) {
        g.fillStyle = c;
        g.fillRect(Math.round(bx + vx * q), Math.round(by + vy * q + 10 * q * q), 2, 1);
      }
    }
  }
  if (W_.fishing) drawFishing(g, cx, cy, t);
  if (W_.emote) {
    const pos = entityPos(W_.emote.npc);
    const ex = Math.round(pos.x - cx) + 4;
    const ey = Math.round(pos.y - cy) - 16;
    g.fillStyle = '#fff'; g.fillRect(ex, ey, 9, 11);
    g.fillStyle = '#1a1a24'; g.fillRect(ex + 3, ey + 2, 3, 5); g.fillRect(ex + 3, ey + 8, 3, 2);
  }
  g.restore();
  if (!m.indoor) {
    const night = grade(g);
    if (!pixiActive()) motes(g, t, { night });
    if (!m.dark && m.theme !== 'cueva') {
      const wx = weatherAt(m.id, m.weather);
      if (wx === 'rain' || wx === 'storm') rain(g, t);
      if (wx === 'storm') { rain(g, t * 1.7); lightning(g, t); }
      if (wx === 'fog') { drawFog(g, t); g.fillStyle = 'rgba(205,212,222,0.22)'; g.fillRect(0, 0, W, H); }
    }
    if ((m.id === 'cabo' && !flag('cabo_clear')) || (m.id === 'quebrada' && !flag('quebrada_clear'))) drawFog(g, t);
    // A PP fog machine that is still running fills its zone with thick fog: almost nothing shows except its lit panel.
    const machines = activeMachines();
    if (machines.length && !m.dark) {
      const px0 = ppos.x - cx + T / 2, py0 = ppos.y - cy + T / 2;
      const gr = g.createRadialGradient(px0, py0, T * 1.2, px0, py0, T * 4);
      gr.addColorStop(0, 'rgba(196,204,216,0.35)');
      gr.addColorStop(1, 'rgba(196,204,216,0.93)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      drawFog(g, t);
      drawMachineGlows(g, t, cx, cy, machines);
    }
  }
  if (m.dark && !W_.lit) {
    const px0 = ppos.x - cx + T / 2, py0 = ppos.y - cy + T / 2;
    const gr = g.createRadialGradient(px0, py0, T * 1.3, px0, py0, T * 3.8);
    gr.addColorStop(0, 'rgba(6,6,16,0)');
    gr.addColorStop(1, 'rgba(6,6,16,0.97)');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  if (m.dark && !m.indoor) drawMachineGlows(g, t, cx, cy, activeMachines());
  vignette(g, m.indoor ? 0.7 : 1);
  if (W_.flash) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }
}

const SHADOW_CASTERS = { '#': 7.5, q: 7.5, p: 6, R: 5 };
/** Trees and rocks drop a soft shadow on the open ground right below them, which grounds them in the scene. */
function drawCastShadows(g, x0, y0, x1, y1, cx, cy) {
  const tiles = W_.tiles;
  g.fillStyle = 'rgba(12,30,18,0.2)';
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const rx = SHADOW_CASTERS[tiles[y][x]];
      if (!rx) continue;
      const below = tiles[y + 1]?.[x];
      if (below === undefined || TILE_INFO[below]?.solid || TILE_INFO[below]?.over) continue;
      g.beginPath();
      g.ellipse(x * T - cx + 9, (y + 1) * T - cy + 2, rx, 3, 0, 0, 7);
      g.fill();
    }
  }
}

/** Soft white foam that laps along every shore (water next to land): drawn over the ground pass, under objects. */
function drawShoreFoam(g, frame, t, x0, y0, x1, y1, cx, cy) {
  const tiles = W_.tiles;
  const isWater = (x, y) => tiles[y]?.[x] === '~' || groundUnder(tiles, x, y) === '~'; // boats and reeds in the water count as water
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (tiles[y][x] !== '~') continue;
      const px = x * T - cx, py = y * T - cy;
      const lap = 0.5 + 0.5 * Math.sin(t / 520 + x * 0.9 + y * 0.6);
      const a = 0.28 + 0.34 * lap;
      g.fillStyle = `rgba(255,255,255,${a})`;
      const off = Math.round(lap); // the wave creeps 1px toward the water and back
      // [dx, dy, edge rectangle] for each side that touches land
      if (tiles[y - 1]?.[x] !== undefined && !isWater(x, y - 1)) for (let i = 1; i < T - 1; i += 3) g.fillRect(px + i, py + off, 2, 1);
      if (tiles[y + 1]?.[x] !== undefined && !isWater(x, y + 1)) for (let i = 2; i < T - 1; i += 3) g.fillRect(px + i, py + T - 1 - off, 2, 1);
      if (tiles[y]?.[x - 1] !== undefined && !isWater(x - 1, y)) for (let i = 1; i < T - 1; i += 3) g.fillRect(px + off, py + i, 1, 2);
      if (tiles[y]?.[x + 1] !== undefined && !isWater(x + 1, y)) for (let i = 2; i < T - 1; i += 3) g.fillRect(px + T - 1 - off, py + i, 1, 2);
    }
  }
}

/** Wheels and frame under the rider. */
function drawBike(g, sx, sy, dir) {
  const side = dir === 'left' || dir === 'right';
  g.fillStyle = '#1a1a24';
  if (side) {
    for (const cx of [sx + 2, sx + 14]) { g.beginPath(); g.arc(cx, sy + 12, 3.6, 0, 7); g.fill(); g.fillStyle = '#9aa0b8'; g.beginPath(); g.arc(cx, sy + 12, 1.6, 0, 7); g.fill(); g.fillStyle = '#1a1a24'; }
    g.fillStyle = '#d83a3a'; g.fillRect(sx + 3, sy + 7, 10, 2);
  } else {
    g.fillRect(sx + 6, sy + 8, 4, 9);
    g.fillStyle = '#9aa0b8'; g.fillRect(sx + 7, sy + 10, 2, 5);
    g.fillStyle = '#d83a3a'; g.fillRect(sx + 3, sy + 6, 10, 1);
  }
}

/** Rod, line and bobber while fishing: cast arc, idle bobbing with ripples, a bite splash, or reeling in empty. */
function drawFishing(g, cx, cy, t) {
  const f = W_.fishing;
  f.t0 ??= t;
  const age = t - f.t0;
  const ppos = entityPos(W_.player);
  const hx = Math.round(ppos.x - cx) + 8 + f.dx * 4;
  const hy = Math.round(ppos.y - cy) + 6 + f.dy * 2;
  const tipx = hx + f.dx * 8 + (f.dx ? 0 : 3);
  const tipy = hy + f.dy * 8 - 6;
  // rod
  g.fillStyle = '#6a4a2a';
  for (let i = 0; i <= 8; i++) g.fillRect(Math.round(hx + (tipx - hx) * (i / 8)), Math.round(hy + (tipy - hy) * (i / 8)), 1, 1);
  const wx = f.tx * T - cx + 8;
  const wy = f.ty * T - cy + 9;
  let bx = wx, by = wy, dip = 0, slack = 0;
  if (f.phase === 'cast') {
    const q = Math.min(1, age / 450);
    bx = tipx + (wx - tipx) * q;
    by = tipy + (wy - tipy) * q - Math.sin(q * Math.PI) * 14;
  } else if (f.phase === 'wait') {
    by += Math.sin(age / 380) * 0.8;
  } else if (f.phase === 'bite') {
    dip = Math.abs(Math.sin(age / 70)) * 3 + 1;
    by += dip;
  } else if (f.phase === 'nothing') {
    const q = Math.max(0, (age - 500) / 550);
    bx = wx + (tipx - wx) * Math.min(1, q);
    by = wy + (tipy - wy) * Math.min(1, q) - Math.sin(Math.min(1, q) * Math.PI) * 6;
    slack = 3;
  }
  // line
  g.fillStyle = 'rgba(255,255,255,0.8)';
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const q = i / steps;
    g.fillRect(Math.round(tipx + (bx - tipx) * q), Math.round(tipy + (by - tipy) * q + Math.sin(q * Math.PI) * slack), 1, 1);
  }
  const landed = f.phase !== 'cast' || age > 450;
  const afloat = f.phase === 'wait' || f.phase === 'bite' || (f.phase === 'nothing' && age < 500);
  if (landed && afloat) {
    // ripples
    const r = ((age / 700) % 1);
    g.strokeStyle = `rgba(255,255,255,${0.55 * (1 - r)})`;
    g.lineWidth = 1;
    g.beginPath(); g.ellipse(wx, wy + 1, 2 + r * 7, 1 + r * 3, 0, 0, 7); g.stroke();
    if (f.phase === 'bite') {
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      const r2 = (age / 260) % 1;
      g.beginPath(); g.ellipse(wx, wy + 1, 3 + r2 * 9, 1.5 + r2 * 4, 0, 0, 7); g.stroke();
      g.fillStyle = '#d8f0ff';
      for (const [ox, oy] of [[-4, -3], [4, -4], [0, -6], [-6, -1], [6, -1]]) g.fillRect(Math.round(wx + ox * (0.5 + (age / 260) % 1 * 0.6)), Math.round(wy + oy * (0.5 + (age / 260) % 1 * 0.7)), 1, 1);
    }
  }
  // bobber
  g.fillStyle = '#f8f8f8'; g.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 3, 3);
  g.fillStyle = '#e0263a'; g.fillRect(Math.round(bx) - 1, Math.round(by) - 2, 3, 2);
  g.fillStyle = '#1a1a24'; g.fillRect(Math.round(bx) - 2, Math.round(by) - 1, 1, 1); g.fillRect(Math.round(bx) + 2, Math.round(by) - 1, 1, 1);
  if (f.phase === 'bite') {
    const ex = Math.round(ppos.x - cx) + 4, ey = Math.round(ppos.y - cy) - 18;
    g.fillStyle = '#fff'; g.fillRect(ex, ey, 9, 11);
    g.fillStyle = '#1a1a24'; g.fillRect(ex + 3, ey + 2, 3, 5); g.fillRect(ex + 3, ey + 8, 3, 2);
  }
}

/** PP fog machines in this map that are still running. */
function activeMachines() {
  return W_.npcs.filter((n) => n.def.script === 'route_fog' && n.def.doneFlag && !flag(n.def.doneFlag));
}

/** The lit panel of each running machine, drawn over the fog (or the darkness of a cave). */
function drawMachineGlows(g, t, cx, cy, machines) {
  for (const n of machines) {
    const pos = entityPos(n), sx = Math.round(pos.x - cx), sy = Math.round(pos.y - cy);
    const pulse = 0.55 + 0.25 * Math.sin(t / 260);
    const glow = g.createRadialGradient(sx + 12, sy + 10, 1, sx + 12, sy + 10, 26);
    glow.addColorStop(0, `rgba(255,70,60,${pulse})`); glow.addColorStop(1, 'rgba(255,70,60,0)');
    g.fillStyle = glow; g.fillRect(sx - 20, sy - 18, 64, 64);
    drawFogMachine(g, sx, sy, t);
  }
}

function drawFog(g, t) {
  g.save();
  for (let i = 0; i < 6; i++) {
    const x = ((t / 40 + i * 80) % (W + 160)) - 120;
    const y = 30 + i * 36 + Math.sin(t / 900 + i) * 8;
    g.fillStyle = 'rgba(220,226,235,0.22)';
    g.beginPath(); g.ellipse(x, y, 90, 20, 0, 0, 7); g.fill();
  }
  g.restore();
}

function entityPos(e) {
  if (e.moving && e.from) {
    const k = Math.min(1, e.t / e.dur);
    return { x: (e.from.x + (e.x - e.from.x) * k) * T, y: (e.from.y + (e.y - e.from.y) * k) * T };
  }
  return { x: e.x * T, y: e.y * T };
}

/** PP fog machine: a grey box with a vent that puffs smoke. */
function drawFogMachine(g, sx, sy, t) {
  shadow(g, sx + 8, sy + 14, 7, 2.4);
  g.fillStyle = '#4a4a5a'; g.fillRect(sx + 1, sy + 4, 14, 10);
  g.fillStyle = '#7a7a8a'; g.fillRect(sx + 1, sy + 4, 14, 3);
  g.fillStyle = '#2a2a3a'; g.fillRect(sx + 3, sy + 9, 6, 4);
  g.fillStyle = Math.floor(t / 400) % 2 ? '#ff5a4a' : '#c83a3a'; g.fillRect(sx + 11, sy + 9, 2, 2);
  g.fillStyle = Math.floor(t / 400) % 2 ? '#5aff7a' : '#2a8a44'; g.fillRect(sx + 11, sy + 6, 2, 2); g.fillStyle = '#ffd24a'; g.fillRect(sx + 4, sy + 5, 2, 1);
  const k = (t / 400) % 1;
  g.fillStyle = `rgba(210,215,225,${0.7 - k * 0.6})`;
  g.beginPath(); g.arc(sx + 8 + Math.sin(t / 300) * 2, sy + 2 - k * 7, 2.5 + k * 2.5, 0, 7); g.fill();
}

function drawBallIcon(g, x, y) { drawPickBall(g, x, y); }

export const worldState = W_;
export { ctext };
