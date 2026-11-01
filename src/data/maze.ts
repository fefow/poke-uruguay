// Guided layouts for forests and caves: not an open field but ONE way through, a chain of rooms joined by short
// corridors between thick walls, with dead-end side rooms where the items wait and trainers standing in the rooms
// of the main path. The generator keeps the map size and the exit mouths of the route it rebuilds.
import { rng } from './map-gen.ts';
import { TILE_INFO } from '../gfx/tiles.ts';

type Dir = 'up' | 'down' | 'left' | 'right';
const solid = (c) => c === undefined || !!TILE_INFO[c]?.solid;

export interface MazeOpts {
  kind: 'forest' | 'cave';
  /** ids for extra items placed in the dead ends that have no item yet */
  extraItems?: string[];
}

/** Mirrors a map across its diagonal (x <-> y), so a north/south route can reuse the west/east generator. */
function transpose(rows: string[]): string[] {
  const h = rows.length, w = rows[0].length;
  return Array.from({ length: w }, (_, x) => Array.from({ length: h }, (_, y) => rows[y][x]).join(''));
}
const TDIR: Record<Dir, Dir> = { up: 'left', down: 'right', left: 'up', right: 'down' };

/**
 * Rebuilds `m.tiles` as a guided maze and relocates its trainers, people and items along it.
 * m: a route map with `exits` on two opposite sides. Returns false (and leaves the map alone) if it cannot.
 */
export function mazeMap(m, seed, opts: MazeOpts): boolean {
  const sides = Object.keys(m.exits ?? {});
  const vertical = sides.includes('n') || sides.includes('s');
  const rowsIn = vertical ? transpose(m.tiles) : m.tiles;
  // in the horizontal frame the exits are 'w' (x = 0) and 'e' (x = W - 1)
  const W = rowsIn[0].length, H = rowsIn.length;
  const mouth = (x) => { const ys = []; for (let y = 0; y < H; y++) if (!solid(rowsIn[y][x])) ys.push(y); return ys; };
  const mouthW = mouth(0), mouthE = mouth(W - 1);
  if (!mouthW.length || !mouthE.length) return false;

  const rand = rng(`maze${seed}`);
  const pick = <T>(a: T[]): T => a[Math.floor(rand() * a.length)];
  const S = H >= 17 ? 5 : 4;            // lattice stride: 3 tiles of room + (S - 3) tiles of wall
  const NC = Math.floor((W - 1) / S), NR = Math.floor((H - 1) / S);
  if (NC < 3 || NR < 2) return false;
  const ox = Math.floor((W - (S * NC - (S - 3))) / 2), oy = Math.floor((H - (S * NR - (S - 3))) / 2);
  const cx0 = (i) => ox + S * i, cy0 = (j) => oy + S * j; // top-left tile of cell (i, j)
  const ccx = (i) => cx0(i) + 1, ccy = (j) => cy0(j) + 1; // centre tile

  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('#'));
  const carve = (x, y, c = '.') => { if (x > 0 && x < W - 1 && y > 0 && y < H - 1) g[y][x] = c; };

  // --- the maze: a random depth-first spanning tree over the lattice, entry on the west, exit on the east
  const nearestRow = (ys: number[]) => {
    const mid = (ys[0] + ys[ys.length - 1]) / 2;
    let best = 0;
    for (let j = 0; j < NR; j++) if (Math.abs(ccy(j) - mid) < Math.abs(ccy(best) - mid)) best = j;
    return best;
  };
  const entry: [number, number] = [0, nearestRow(mouthW)];
  const exit: [number, number] = [NC - 1, nearestRow(mouthE)];
  const key = (i, j) => j * NC + i;
  const parent = new Map<number, number>();
  const seen = new Set([key(...entry)]);
  const order = [entry];
  const stack = [entry];
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    // prefer moving east a little more, so the way through winds forward instead of stalling in a corner
    const next = ([[1, 0], [1, 0], [0, 1], [0, -1], [-1, 0]] as [number, number][])
      .map(([dx, dy]) => [i + dx, j + dy] as [number, number])
      .filter(([a, b]) => a >= 0 && a < NC && b >= 0 && b < NR && !seen.has(key(a, b)));
    if (!next.length) { stack.pop(); continue; }
    const n = pick(next);
    seen.add(key(...n)); parent.set(key(...n), key(i, j)); order.push(n); stack.push(n);
  }
  // main path = tree path from the exit back to the entry
  const mainKeys: number[] = [];
  for (let k: number | undefined = key(...exit); k !== undefined; k = parent.get(k)) mainKeys.unshift(k);
  const onMain = new Set(mainKeys);
  const cellOf = (k) => [k % NC, Math.floor(k / NC)] as [number, number];
  const kids = new Map<number, number[]>();
  for (const [c, p] of parent) kids.set(p, [...(kids.get(p) ?? []), c]);
  const degree = (k) => (kids.get(k)?.length ?? 0) + (parent.has(k) ? 1 : 0);

  // --- rooms: every cell is a 3x3 room; some become a 5x5 hall (never two neighbouring ones, walls stay solid)
  const hall = new Set<number>();
  for (const [i, j] of order) if (i % 2 === 0 && j % 2 === 0 && rand() < 0.6 && S === 5) hall.add(key(i, j));
  for (const [i, j] of order) {
    const k = key(i, j), r = hall.has(k) ? 1 : 0;
    for (let y = cy0(j) - r; y <= cy0(j) + 2 + r; y++) for (let x = cx0(i) - r; x <= cx0(i) + 2 + r; x++) carve(x, y);
  }
  // --- corridors between cells that are joined in the tree (3 wide at the opening, 1 long per wall tile)
  const link = (a: number, b: number) => {
    const [ai, aj] = cellOf(a), [bi, bj] = cellOf(b);
    if (ai !== bi) { // horizontal
      const x1 = Math.min(cx0(ai), cx0(bi)) + 2, x2 = Math.max(cx0(ai), cx0(bi));
      for (let x = x1; x <= x2; x++) carve(x, ccy(aj));
    } else {
      const y1 = Math.min(cy0(aj), cy0(bj)) + 2, y2 = Math.max(cy0(aj), cy0(bj));
      for (let y = y1; y <= y2; y++) carve(ccx(ai), y);
    }
  };
  for (const [c, p] of parent) link(c, p);

  // --- the mouths: strips from the map edge to the first / last room, same rows as the original opening
  const strip = (ys: number[], fromX: number, toX: number, joinX: number, room: [number, number]) => {
    const [lo, hi] = [Math.min(fromX, toX), Math.max(fromX, toX)];
    for (const y of ys) for (let x = lo; x <= hi; x++) { g[y][x] = '.'; }
    // join the strip to the room vertically if they are on different rows
    const cy = ccy(room[1]);
    const near = joinX;
    const a = Math.min(cy, ys[0]), b = Math.max(cy, ys[ys.length - 1]);
    for (let y = a; y <= b; y++) g[y][near] = '.';
  };
  const west = mouthW.slice(0, 5), east = mouthE.slice(0, 5);
  strip(west, 0, cx0(entry[0]), cx0(entry[0]), entry);
  strip(east, cx0(exit[0]) + 2, W - 1, cx0(exit[0]) + 2, exit);

  // --- floor: dirt path along the main route, grass clearings, a few boulders and crystals
  const forest = opts.kind === 'forest';
  const path = (x, y) => { if (g[y][x] === '.') g[y][x] = '='; };
  for (const y of west) for (let x = 0; x <= ccx(entry[0]); x++) path(x, y);
  for (const y of east) for (let x = ccx(exit[0]); x < W; x++) path(x, y);
  for (let n = 0; n < mainKeys.length; n++) {
    const [i, j] = cellOf(mainKeys[n]);
    path(ccx(i), ccy(j));
    if (n > 0) { // draw the centre-to-centre line
      const [pi, pj] = cellOf(mainKeys[n - 1]);
      for (let x = Math.min(ccx(i), ccx(pi)); x <= Math.max(ccx(i), ccx(pi)); x++) path(x, ccy(j));
      for (let y = Math.min(ccy(j), ccy(pj)); y <= Math.max(ccy(j), ccy(pj)); y++) path(ccx(i), y);
    }
  }
  const grassOf = (i, j) => { for (let y = cy0(j); y <= cy0(j) + 2; y++) for (let x = cx0(i); x <= cx0(i) + 2; x++) if (g[y][x] === '.') g[y][x] = ','; };
  const deco = (x, y, c) => { if (g[y][x] === '.') g[y][x] = c; };
  const leaves = order.filter(([i, j]) => !kids.has(key(i, j)) && key(i, j) !== key(...entry) && key(i, j) !== key(...exit));
  for (const [i, j] of order) {
    const k = key(i, j);
    if (k === key(...entry) || k === key(...exit)) continue;
    const grassy = forest ? (onMain.has(k) ? rand() < 0.45 : rand() < 0.6) : rand() < 0.2;
    if (grassy) grassOf(i, j);
    // corners of rooms get boulders / ceibos so no room looks like a bare square
    const corners: [number, number][] = [[cx0(i), cy0(j)], [cx0(i) + 2, cy0(j)], [cx0(i), cy0(j) + 2], [cx0(i) + 2, cy0(j) + 2]];
    if (rand() < 0.7) { const [x, y] = pick(corners); deco(x, y, forest ? (rand() < 0.5 ? 'q' : 'R') : 'R'); }
    if (hall.has(k)) { deco(ccx(i), ccy(j) - 1, 'R'); if (!forest) deco(ccx(i) + 1, ccy(j) + 1, 'f'); }
    if (!forest && rand() < 0.35) { const [x, y] = pick(corners); deco(x, y, 'f'); }
  }
  // make sure the first rooms next to the entrance are plain, so the player is not attacked at the door
  for (const [i, j] of [entry, exit]) for (let y = cy0(j); y <= cy0(j) + 2; y++) for (let x = cx0(i); x <= cx0(i) + 2; x++) if (g[y][x] === ',') g[y][x] = '.';

  // --- objects: trainers/people in the rooms of the main path, items in the dead ends
  const room = (k) => { const [i, j] = cellOf(k); return { x: ccx(i), y: ccy(j) }; };
  const dirTo = (k0: number, k1: number): Dir => { // direction from room k0 towards room k1
    const [a, b] = cellOf(k0), [c, d] = cellOf(k1);
    return c > a ? 'right' : c < a ? 'left' : d > b ? 'down' : 'up';
  };
  const people = (m.npcs ?? []).filter((n) => !n.blocker);
  const trainers = people.filter((n) => n.trainer);
  const others = people.filter((n) => !n.trainer);
  const interior = mainKeys.slice(1, -1);
  const used = new Set<number>();
  // trainers: rooms of the main path, spaced out; people: the remaining main path rooms
  const spread = (count: number) => Array.from({ length: count }, (_, t) => interior[Math.min(interior.length - 1, Math.floor(((t + 0.5) / count) * interior.length))]);
  const tSpots = interior.length ? spread(trainers.length) : [mainKeys[0]];
  trainers.forEach((n, t) => { const k = tSpots[t]; const r = room(k); n.x = r.x; n.y = r.y; const at = mainKeys.indexOf(k); n.dir = at > 0 ? dirTo(k, mainKeys[at - 1]) : 'right'; used.add(k); });
  const freeMain = interior.filter((k) => !used.has(k));
  const side = order.map(([i, j]) => key(i, j)).filter((k) => !onMain.has(k));
  others.forEach((n, t) => {
    const k = freeMain.length ? freeMain[Math.min(freeMain.length - 1, Math.floor(((t + 0.5) / others.length) * freeMain.length))] : side[t % Math.max(1, side.length)] ?? mainKeys[0];
    const r = room(k);
    n.x = r.x + (g[r.y][r.x + 1] === undefined || solid(g[r.y][r.x + 1]) ? 0 : 1); n.y = r.y;
    const at = mainKeys.indexOf(k);
    n.dir = at > 0 ? dirTo(k, mainKeys[at - 1]) : 'down';
    used.add(k);
  });
  // a person in the middle of a corridor-line room would stand on the path: keep the tile walkable
  // items: dead-end rooms first (deepest from the main path), then any side room
  const deadEnds = leaves.map(([i, j]) => key(i, j)).filter((k) => !used.has(k));
  const itemList = m.items ?? (m.items = []);
  const spots = [...deadEnds, ...side.filter((k) => !deadEnds.includes(k) && !used.has(k))];
  itemList.forEach((it, idx) => { const k = spots[idx % Math.max(1, spots.length)] ?? mainKeys[1]; const r = room(k); it.x = r.x; it.y = r.y; used.add(k); });
  const extra = [...(opts.extraItems ?? [])];
  for (const k of spots) {
    if (used.has(k) || !extra.length || !deadEnds.includes(k)) continue;
    const r = room(k);
    itemList.push({ x: r.x, y: r.y, item: extra.shift(), id: `${seed}_mz${itemList.length}` });
    used.add(k);
  }

  // --- the sign stands by the entrance, in the corner of the first room
  const nSign = m.signs?.length ?? 0;
  if (nSign) {
    const corner: [number, number][] = [[cx0(entry[0]), cy0(entry[1])], [cx0(entry[0]), cy0(entry[1]) + 2], [cx0(entry[0]) + 2, cy0(entry[1])]];
    let placed = 0;
    for (const [x, y] of corner) if (placed < nSign && g[y][x] === '.') { g[y][x] = 'S'; placed++; }
    for (let k = 0; placed < nSign && k < 40; k++) { const x = 1 + Math.floor(rand() * (W - 2)), y = 1 + Math.floor(rand() * (H - 2)); if (g[y][x] === '.') { g[y][x] = 'S'; placed++; } }
  }

  // --- write back (transposing again for north/south routes)
  let out = g.map((r) => r.join(''));
  if (vertical) {
    out = transpose(out);
    for (const o of [...(m.npcs ?? []), ...(m.items ?? [])]) { const x = o.x; o.x = o.y; o.y = x; if (o.dir) o.dir = TDIR[o.dir as Dir]; }
  }
  m.tiles = out;
  m.maze = true;
  return true;
}
