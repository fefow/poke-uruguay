// Overworld: map loading/linking, movement, NPCs, trainers, encounters,
// rendering and the script API used by story scripts.
import { MAPS, OUTDOOR, INTERIOR } from '../data/maps.js';
import { SCRIPTS } from '../data/story.js';
import { SPECIES } from '../data/species.js';
import { TYPES } from '../data/types.js';
import { ITEMS } from '../data/items.js';
import { T, TILE_INFO, tileCanvas } from '../gfx/tiles.js';
import { charSprite } from '../gfx/characters.js';
import { creatureSprite, creatureIcon } from '../gfx/creatures.js';
import { W, H, setRenderer, dayTint, text as ctext } from '../gfx/screen.js';
import { input } from '../core/input.js';
import { sfx, playMusic } from '../core/audio.js';
import { worldRng } from '../core/rng.js';
import { h, wait } from '../core/util.js';
import { say, ask, choose, fmt, fadeOut, fadeIn, uiRoot, closeDialog, toast } from './ui.js';
import { state, flag, setFlag, addItem, hasItem, removeItem, markCaught, markSeen, loseMoney, PARTY_MAX } from './state.js';
import { createCreature, heal as healCreature, displayName } from './creature.js';
import { runBattle } from './battle-scene.js';
import { openPauseMenu, openShop, openPC } from './menus.js';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const WALK_MS = 210;
const RUN_MS = 115;

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
const W_ = {
  map: null,
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
  return m.tiles[y][x];
}

function solidAt(x, y, { ignorePlayer = false, self = null } = {}) {
  const ch = tileAt(x, y);
  if (ch == null) return true;
  if (TILE_INFO[ch]?.solid) return true;
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
  for (const n of W_.npcs) n.visible = cond(n.def.cond) && !n.gone;
  W_.items = (m.items ?? []).filter((it) => !flag(`it_${it.id}`));
  W_.legend = m.legend && cond(m.legend.cond) && !flag(m.legend.flag) ? m.legend : null;
}

export function loadMap(id, x, y, dir = 'down') {
  linkWorld();
  const m = MAPS[id];
  const S = state();
  const changed = W_.map?.id !== id;
  W_.map = m;
  if (changed) W_.npcs = [];
  W_.player = { ...W_.player, x, y, dir, moving: false, from: null };
  S.pos = { map: id, x, y, dir };
  refreshEntities();
  playMusic(m.music ?? 'route');
  setRenderer(drawWorld);
  if (changed && !m.indoor) showBanner(m.name);
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
export function updateWorld(dt, now) {
  W_.anim += dt;
  const p = W_.player;
  if (W_.scriptRunning) return;
  // NPC movement
  for (const n of W_.npcs) updateNpc(n, now, dt);

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
  if (warp) return void runScript(() => doWarp(warp.to, warp.tx, warp.ty, 'up'));
  const door = m.doorWarps?.[`${nx},${ny}`];
  if (door) {
    if (!req(door.req)) return void runScript(async () => { await say(door.deny ?? 'Está cerrado.'); });
    return void runScript(() => enterInterior(door.to));
  }
  if (solidAt(nx, ny)) return bump();
  p.from = { x: p.x, y: p.y };
  p.x = nx;
  p.y = ny;
  p.moving = true;
  p.t = 0;
  p.dur = input.held('b') ? RUN_MS : WALK_MS;
  p.step++;
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
    for (let d = 1; d < 30; d++) {
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
  // Scripted triggers
  for (const tr of W_.map.triggers ?? []) {
    if (p.x >= tr.x && p.x < tr.x + tr.w && p.y >= tr.y && p.y < tr.y + tr.h && cond(tr.cond)) {
      const npc = W_.npcs.find((n) => n.def.script === tr.script);
      return void runScript(() => SCRIPTS[tr.script](api, npc?.def ?? {}));
    }
  }
  // Trainers that can see you
  for (const n of W_.npcs) {
    const t = n.def.trainer;
    if (!t || !n.visible || flag(`tr_${t.id}`) || !n.def.sight) continue;
    if (sees(n)) return void runScript(() => trainerSpotted(n));
  }
  // Wild encounters
  if (TILE_INFO[ch]?.enc && W_.map.enc && S.party.some((c) => c.hp > 0)) {
    if (worldRng.chance(W_.map.enc.rate)) {
      const e = worldRng.weighted(W_.map.enc.list.map(([sp, lo, hi, w]) => ({ sp, lo, hi, w })));
      const lvl = worldRng.int(e.lo, e.hi);
      const lead = S.party.find((c) => c.hp > 0);
      if (S.repel > 0 && lvl < lead.level) return;
      return void runScript(() => wildBattle(e.sp, lvl));
    }
  }
}

function sees(n) {
  const [dx, dy] = DIRS[n.dir];
  const p = W_.player;
  for (let i = 1; i <= n.def.sight; i++) {
    const x = n.x + dx * i;
    const y = n.y + dy * i;
    if (x === p.x && y === p.y) return true;
    if (solidAt(x, y, { ignorePlayer: true })) return false;
  }
  return false;
}

async function trainerSpotted(n) {
  sfx('encounter');
  W_.emote = { npc: n, until: performance.now() + 700 };
  await wait(700);
  W_.emote = null;
  // walk up to the player
  const [dx, dy] = DIRS[n.dir];
  const p = W_.player;
  while (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) > 1) {
    await npcStep(n, dx, dy);
  }
  p.dir = opposite(n.dir);
  await trainerTalk(n);
}

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
  if (tileAt(p.x + dx, p.y + dy) === 'P' && !n) return void runScript(() => openPC());
  if (tileAt(p.x + dx, p.y + dy) === '~') return void runScript(() => say('El agua está turbia. Mejor no meterse.'));
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
  if (d.text) return say(d.text);
}

async function trainerTalk(n) {
  const t = n.def.trainer;
  if (flag(`tr_${t.id}`)) return say(t.after, { name: t.name });
  const res = await api.battle(t);
  if (res === 'win') {
    setFlag(`tr_${t.id}`);
    if (t.after) await say(t.after, { name: t.name });
  }
}

async function pickItem(it) {
  setFlag(`it_${it.id}`);
  addItem(it.item, 1);
  sfx('confirm');
  refreshEntities();
  await say(`¡{player} encontró ${ITEMS[it.item].name}!`);
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

async function wildBattle(sp, lvl) {
  const c = createCreature(sp, lvl);
  const res = await runBattle({ foes: [c], wild: true, bg: W_.map.bg });
  if (res === 'lose') await blackout();
}

async function blackout() {
  const S = state();
  const lost = loseMoney(Math.floor(S.player.money / 2));
  await say([`Perdiste $${lost} en la confusión…`, '…', '¡Corriste a un lugar seguro para curar a tus criaturas!']);
  for (const c of S.party) healCreature(c);
  const lh = S.lastHeal;
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
  takeItem: (k, q = 1) => removeItem(k, q),
  sfx,
  wait,
  starterKey: () => ['ceibito', 'tejuchispa', 'carpinchito'].find((k) => flag(`starter_${k}`)) ?? 'ceibito',
  typeNames: (k) => SPECIES[k].types.map((t) => TYPES[t].name).join('/'),
  async give(item, qty = 1) {
    addItem(item, qty);
    sfx('confirm');
    await say(`¡{player} recibió ${ITEMS[item].name}${qty > 1 ? ` ×${qty}` : ''}!`);
  },
  giveCreature(sp, lvl) {
    const S = state();
    const c = createCreature(sp, lvl, { ot: S.player.id });
    markCaught(sp);
    if (S.party.length < PARTY_MAX) S.party.push(c);
    else S.box.push(c);
    return c;
  },
  async healParty({ silent = false } = {}) {
    for (const c of state().party) healCreature(c);
    if (!silent) {
      sfx('heal');
      await fadeOut(250);
      await wait(700);
      await fadeIn(250);
    }
  },
  setLastHeal() {
    const p = W_.player;
    state().lastHeal = { map: W_.map.id, x: p.x, y: p.y };
  },
  async battle(trainer, { canLose = false, music } = {}) {
    const foes = trainer.team.map(([sp, lvl]) => createCreature(sp, lvl));
    const res = await runBattle({ foes, wild: false, trainer, bg: W_.map.bg, canLose, music });
    if (res === 'lose') {
      if (canLose) { for (const c of state().party) healCreature(c); }
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
  hallOfFame: () => import('./scenes.js').then((m) => m.hallOfFame()),
  credits: async () => {
    const m = await import('./scenes.js');
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
  // camera
  let cx = ppos.x + T / 2 - W / 2;
  let cy = ppos.y + T / 2 - H / 2;
  const mw = m.w * T;
  const mh = m.h * T;
  cx = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, cx));
  cy = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(mh - H, cy));
  cx = Math.round(cx);
  cy = Math.round(cy);
  g.fillStyle = '#141018';
  g.fillRect(0, 0, W, H);
  const frame = Math.floor(t / 400);
  const x0 = Math.max(0, Math.floor(cx / T));
  const y0 = Math.max(0, Math.floor(cy / T));
  const x1 = Math.min(m.w - 1, Math.ceil((cx + W) / T));
  const y1 = Math.min(m.h - 1, Math.ceil((cy + H) / T));
  for (let y = y0; y <= y1; y++) {
    const row = m.tiles[y];
    for (let x = x0; x <= x1; x++) g.drawImage(tileCanvas(row[x], frame), x * T - cx, y * T - cy);
  }
  // ground items
  for (const it of W_.items) drawBallIcon(g, it.x * T - cx + 8, it.y * T - cy + 9);
  // legend
  if (W_.legend) {
    const spr = creatureSprite(W_.legend.species);
    const bob = Math.sin(t / 300) * 2;
    g.drawImage(spr, W_.legend.x * T - cx - 8, W_.legend.y * T - cy - 18 + bob, 32, 32);
  }
  // entities sorted by y
  const ents = W_.npcs.filter((n) => n.visible).map((n) => ({ n, pos: entityPos(n) }));
  ents.push({ n: p, pos: ppos, player: true });
  ents.sort((a, b) => a.pos.y - b.pos.y);
  for (const { n, pos, player } of ents) {
    const sx = Math.round(pos.x - cx);
    const sy = Math.round(pos.y - cy);
    if (!player && n.def.look === null) continue;
    if (!player && n.def.look === 'ball') { drawBallIcon(g, sx + 8, sy + 6); continue; }
    const look = player ? state().player.look : n.def.look;
    const frameIdx = n.moving ? ((n.step ?? Math.floor(n.t / 100)) % 2) + 1 : 0;
    const f = player && p.moving ? (p.t < p.dur / 2 ? (p.step % 2) + 1 : 0) : n.moving ? frameIdx : 0;
    g.drawImage(charSprite(look, n.dir, f), sx, sy - 4);
    // tall grass covers your feet
    const tx = player ? p.x : n.x;
    const ty = player ? p.y : n.y;
    if (TILE_INFO[tileAt(tx, ty)]?.enc && !n.moving) g.drawImage(tileCanvas(','), 0, 10, 16, 6, sx, sy + 10, 16, 6);
  }
  if (W_.emote) {
    const pos = entityPos(W_.emote.npc);
    const ex = Math.round(pos.x - cx) + 4;
    const ey = Math.round(pos.y - cy) - 16;
    g.fillStyle = '#fff'; g.fillRect(ex, ey, 9, 11);
    g.fillStyle = '#1a1a24'; g.fillRect(ex + 3, ey + 2, 3, 5); g.fillRect(ex + 3, ey + 8, 3, 2);
  }
  if (!m.indoor) {
    const tint = dayTint();
    if (tint) { g.fillStyle = tint; g.fillRect(0, 0, W, H); }
    if ((m.id === 'cabo' && !flag('cabo_clear')) || (m.id === 'quebrada' && !flag('quebrada_clear'))) drawFog(g, t);
  }
  if (W_.flash) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }
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

function drawBallIcon(g, x, y) {
  g.fillStyle = '#1a1a24'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
  g.fillStyle = '#7ac8f0'; g.beginPath(); g.arc(x, y, 4, Math.PI, 0); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 4, 0, Math.PI); g.fill();
  g.fillStyle = '#1a1a24'; g.fillRect(x - 4, y - 0.5, 8, 1);
}

export const worldState = W_;
export { ctext };
