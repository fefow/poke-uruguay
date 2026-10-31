// Turns a town plan (town-plan.js) into a playable map: swaps the tiles of an existing map entry for the
// planned ones, rebuilds its door list in the new row-major order, and puts people, items and the legendary
// back on free ground that the player can reach. People that stood next to a door keep their place next to it.
import { planTown } from './town-plan.js';
import { rng } from './map-gen.js';
import { SPECIES } from './species.js';
import { TILE_INFO } from '../gfx/tiles.js';

const ROAD = new Set(['c', '=', 'b']);
const solid = (c) => c === undefined || !!TILE_INFO[c]?.solid;
const DECOR_HOUSES = ['house', 'houseB', 'houseG', 'houseO'];
const BG = { arena: 'beach', sierra: 'canyon', colorada: 'field', seca: 'field' };

const doorTarget = (d) => (typeof d === 'string' ? d : d.to);
export const doorPositions = (tiles) => {
  const out = [];
  tiles.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'D') out.push({ x, y }); }));
  return out;
};

const CRITTER_LINES = [
  (n) => [`${n} a lo lejos. Mira para este lado y sigue con lo suyo.`, 'No parece querer pelear.'],
  (n) => [`Un ${n} descansando.`, 'Se aleja un paso cuando te acercás.'],
  (n) => [`${n} pasea sin apuro.`, 'Mejor dejarlo tranquilo.'],
];

/**
 * Re-lay map `m` (an OUTDOOR entry) from a plan.
 * cfg: { spec, bld: [[kind, doorTarget?, hint?, spur?]], fill, fillKinds, theme, edges, newDoors, thicket }
 */
export function retown(m, id, cfg) {
  const allDoors = m.doors ?? [];
  const allPos = m.tiles ? doorPositions(m.tiles) : [];
  const keepIdx = allDoors.map((d, k) => k).filter((k) => !cfg.drop?.test(doorTarget(allDoors[k])));
  const oldDoors = keepIdx.map((k) => allDoors[k]);
  const oldPos = allPos.length ? keepIdx.map((k) => allPos[k]) : [];
  const wanted = new Set(cfg.bld.map((b) => b[1]).filter(Boolean));
  for (const d of oldDoors) if (!wanted.has(doorTarget(d))) throw new Error(`${id}: la puerta ${doorTarget(d)} no está en el plano`);
  const buildings = cfg.bld.map(([kind, to, hint, spur]) => ({ kind, to: to ?? undefined, hint, spur }));
  const kinds = cfg.fillKinds ?? DECOR_HOUSES;
  for (let i = 0; i < (cfg.fill ?? 0); i++) buildings.push({ kind: kinds[i % kinds.length], soft: true });

  const plan = planTown(cfg.spec, buildings, { seed: id, signs: m.signs?.length ?? 1, edges: cfg.edges ?? [] });
  const entryOf = (to) => oldDoors.find((d) => doorTarget(d) === to) ?? cfg.newDoors?.[to] ?? to;
  const oldPosOf = (to) => { const k = oldDoors.findIndex((d) => doorTarget(d) === to); return k >= 0 ? oldPos[k] : null; };
  const tiles = plan.tiles.map((r) => [...r]);

  if (cfg.thicket) {
    const d = plan.doorPos.find((p) => p.to === cfg.thicket);
    if (d) tiles[d.y + 1][d.x] = '%';
  }
  m.tiles = tiles.map((r) => r.join(''));
  m.doors = plan.doorPos.map((d) => entryOf(d.to));
  if (cfg.theme !== undefined) m.theme = cfg.theme ?? undefined;
  if (cfg.theme && BG[cfg.theme]) m.bg = BG[cfg.theme];

  // ---- where things can go
  const { w, h } = plan;
  const at = (x, y) => m.tiles[y]?.[x];
  const rnd = rng(`${id}people`);
  const roads = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (ROAD.has(at(x, y))) roads.push([x, y]);
  const start = roads[0];
  const reach = new Set([`${start[0]},${start[1]}`]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!solid(at(nx, ny)) && !reach.has(`${nx},${ny}`)) { reach.add(`${nx},${ny}`); q.push([nx, ny]); } }
  }
  // distance to the nearest road, through anything
  const rd = Array.from({ length: h }, () => Array(w).fill(99));
  const bq = roads.map(([x, y]) => { rd[y][x] = 0; return [x, y]; });
  for (let i = 0; i < bq.length; i++) {
    const [x, y] = bq[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (rd[ny]?.[nx] > rd[y][x] + 1) { rd[ny][nx] = rd[y][x] + 1; bq.push([nx, ny]); } }
  }
  const reserved = new Set(plan.doorPos.flatMap((d) => [`${d.x},${d.y + 1}`, `${d.x},${d.y + 2}`, `${d.x - 1},${d.y + 1}`, `${d.x + 1},${d.y + 1}`]));
  const cand = [];
  for (const key of reach) {
    const [x, y] = key.split(',').map(Number);
    const c = at(x, y);
    if (ROAD.has(c) || reserved.has(key) || x < 3 || y < 3 || x > w - 4 || y > h - 4 || c === 'm' || c === 'D') continue;
    cand.push({ x, y, rd: rd[y][x] });
  }
  for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
  const taken = plan.critters.map((c) => [c.x, c.y]);
  const free = (c, gap) => !taken.some(([x, y]) => Math.abs(x - c.x) + Math.abs(y - c.y) < gap);
  const claim = (o, c) => { o.x = c.x; o.y = c.y; taken.push([c.x, c.y]); };
  const pickNear = (tx, ty, radius, gap) => cand.filter((c) => Math.abs(c.x - tx) + Math.abs(c.y - ty) <= radius && free(c, gap)).sort((a, b) => Math.abs(a.x - tx) + Math.abs(a.y - ty) - (Math.abs(b.x - tx) + Math.abs(b.y - ty)))[0];
  const pickAny = (ok, gaps) => { for (const gap of gaps) { const c = cand.find((k) => free(k, gap) && ok(k)); if (c) return c; } return null; };

  // people who stood by a door keep that spot relative to the same door
  const newPos = Object.fromEntries(plan.doorPos.map((d) => [d.to, d]));
  const nearDoor = (o) => {
    let best = null;
    oldDoors.forEach((d, k) => { const p = oldPos[k]; if (!p || !newPos[doorTarget(d)]) return; const dist = Math.abs(p.x - o.x) + Math.abs(p.y - o.y); if (dist <= 4 && (!best || dist < best.dist)) best = { dist, p, to: doorTarget(d) }; });
    return best;
  };
  const faceRoad = (o) => {
    if (o.dir && !o.trainer) return;
    let best = null;
    for (const [d, dx, dy] of [['down', 0, 1], ['up', 0, -1], ['left', -1, 0], ['right', 1, 0]]) for (let s = 1; s <= 4; s++) { if (solid(at(o.x + dx * s, o.y + dy * s))) break; if (ROAD.has(at(o.x + dx * s, o.y + dy * s))) { if (!best || s < best.s) best = { d, s }; break; } }
    if (best && o.trainer) o.dir = best.d;
  };
  const people = (m.npcs ?? []).filter((n) => !n.critter);
  // the guard who opens the road forward waits near the exit
  const gateSpot = () => {
    const side = cfg.gate;
    const cells = roads.filter(([x, y]) => (side === 'w' ? x === 0 : side === 'e' ? x === w - 1 : side === 'n' ? y === 0 : y === h - 1));
    if (!cells.length) return null;
    const [ex, ey] = cells[cells.length >> 1];
    return side === 'w' ? [ex + 5, ey] : side === 'e' ? [ex - 5, ey] : side === 'n' ? [ex, ey + 5] : [ex, ey - 5];
  };
  for (const n of people) {
    const nd = nearDoor(n);
    let c = null;
    if (n.script === 'town_gate' && cfg.gate) { const g = gateSpot(); if (g) c = pickNear(g[0], g[1], 9, 2); }
    if (nd) { const np = newPos[nd.to]; c = pickNear(np.x + (n.x - nd.p.x), np.y + (n.y - nd.p.y), 5, 2); }
    if (!c) c = pickAny((k) => k.rd <= (n.trainer ? 3 : 4) && k.rd >= 1, [5, 4, 3, 2]);
    if (!c) c = pickAny(() => true, [2, 1]);
    if (c) { claim(n, c); faceRoad(n); }
  }
  for (const it of m.items ?? []) {
    const c = pickAny((k) => k.rd >= 2 && k.rd <= 7, [4, 3, 2]) ?? pickAny(() => true, [1]);
    if (c) claim(it, c);
  }
  if (m.legend) {
    const far = [...cand].filter((k) => free(k, 3)).sort((a, b) => b.rd - a.rd)[0];
    if (far) claim(m.legend, far);
  }
  // creatures in the distance
  m.npcs = [...people, ...plan.critters.map((c, k) => {
    const name = SPECIES[c.sp].name;
    return { x: c.x, y: c.y, look: `animal:${c.sp}`, wander: true, critter: true, dir: 'down', text: CRITTER_LINES[(k + c.x) % CRITTER_LINES.length](name) };
  })];
  return plan;
}
