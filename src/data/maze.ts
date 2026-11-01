// Organic caves and forests: one winding way through, widening into chambers, with side chambers hanging off it by
// short passages. Everything is at least three tiles wide, so a person, an item or a rock never closes the way.
// The generator keeps the map size and the exit mouths of the route it rebuilds, and relocates its people and items.
import { rng } from './map-gen.ts';
import { TILE_INFO, wallChar, floorChar } from '../gfx/tiles.ts';

type Dir = 'up' | 'down' | 'left' | 'right';
const solid = (c) => c === undefined || !!TILE_INFO[c]?.solid;

export interface MazeOpts {
  kind: 'forest' | 'cave';
  /** ids for extra items placed in the side chambers that have no item yet */
  extraItems?: string[];
}

const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Rebuilds `m.tiles` as an organic cave or forest and relocates its trainers, people and items.
 * m: a route map with `exits` on two opposite sides. Returns false (and leaves the map alone) if it cannot.
 */
export function mazeMap(m, seed, opts: MazeOpts): boolean {
  const rowsIn = m.tiles as string[];
  const W = rowsIn[0].length, H = rowsIn.length;
  if (W < 14 || H < 14) return false;
  // the exits: runs of walkable tiles along the border, each with the direction that points into the map
  type Mouth = { cells: [number, number][]; dx: number; dy: number };
  const mouths: Mouth[] = [];
  const edges: [string, [number, number][], number, number][] = [
    ['w', rowsIn.map((_, y) => [0, y] as [number, number]), 1, 0], ['e', rowsIn.map((_, y) => [W - 1, y] as [number, number]), -1, 0],
    ['n', [...rowsIn[0]].map((_, x) => [x, 0] as [number, number]), 0, 1], ['s', [...rowsIn[H - 1]].map((_, x) => [x, H - 1] as [number, number]), 0, -1],
  ];
  for (const [, cells, dx, dy] of edges) {
    let run: [number, number][] = [];
    const flush = () => { if (run.length) { const k = Math.max(0, Math.floor((run.length - 5) / 2)); mouths.push({ cells: run.slice(k, k + 5), dx, dy }); } run = []; };
    for (const [x, y] of cells) { if (!solid(rowsIn[y][x])) run.push([x, y]); else flush(); }
    flush();
  }
  if (mouths.length < 2) return false;
  const forest = opts.kind === 'forest';
  const mid = (mo: Mouth) => mo.cells[Math.floor(mo.cells.length / 2)];
  // the point just inside the map in front of a mouth
  const inner = (mo: Mouth): [number, number] => { const [x, y] = mid(mo); return [Math.min(W - 4, Math.max(3, x + mo.dx * 3)), Math.min(H - 4, Math.max(3, y + mo.dy * 3))]; };
  const entryM = mouths[0], exitM = mouths[1];

  for (let attempt = 0; attempt < 40; attempt++) {
    const rand = rng(`organic${seed}${attempt}`);
    const pick = <T>(a: T[]): T => a[Math.floor(rand() * a.length)];
    const open: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false));
    const inside = (x, y) => x >= 1 && x < W - 1 && y >= 1 && y < H - 1;
    const disc = (cx, cy, r) => {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if (inside(x, y) && (x - cx) ** 2 + (y - cy) ** 2 <= r * r) open[y][x] = true;
    };
    const ellipse = (cx, cy, rx, ry) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
        if (inside(x, y) && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) open[y][x] = true;
    };
    const clampX = (x) => Math.min(W - 4, Math.max(3, x)), clampY = (y) => Math.min(H - 4, Math.max(3, y));

    // --- the main way: waypoints swinging to both sides of the straight line between the two mouths, joined by a smooth curve
    const A = inner(entryM), B = inner(exitM);
    const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const legs = Math.max(3, Math.round(len / 8));
    const nx = -(B[1] - A[1]) / len, ny = (B[0] - A[0]) / len; // unit normal of the line
    const wp: [number, number][] = [A];
    let sign = rand() < 0.5 ? 1 : -1;
    for (let k = 1; k < legs; k++) {
      const t = k / legs, amp = (3 + rand() * 4) * sign;
      wp.push([clampX(A[0] + (B[0] - A[0]) * t + nx * amp), clampY(A[1] + (B[1] - A[1]) * t + ny * amp)]); sign = -sign;
    }
    wp.push(B);
    const path: [number, number][] = [];
    for (let k = 0; k + 1 < wp.length; k++) {
      const [x1, y1] = wp[k], [x2, y2] = wp[k + 1];
      const steps = Math.max(6, Math.round(Math.hypot(x2 - x1, y2 - y1) * 2));
      const wob = rand() * 6.28;
      const sx = -(y2 - y1), sy = x2 - x1, sl = Math.hypot(sx, sy) || 1;
      for (let s = 0; s < steps; s++) {
        const t = s / steps, e = t * t * (3 - 2 * t);
        const bend = Math.sin(t * 3.14) * Math.sin(wob) * 1.3;
        const x = clampX(x1 + (x2 - x1) * e + (sx / sl) * bend), y = clampY(y1 + (y2 - y1) * e + (sy / sl) * bend);
        disc(x, y, 1.6 + (Math.sin((x + y) * 0.5 + wob) + 1) * 0.5);
        const last = path[path.length - 1];
        if (!last || last[0] !== Math.round(x) || last[1] !== Math.round(y)) path.push([Math.round(x), Math.round(y)]);
      }
    }
    // a wide hall on the way
    const hall = wp[Math.floor(wp.length / 2)];
    ellipse(hall[0], hall[1], Math.min(5, (W - 4) / 2.2), Math.min(4, (H - 4) / 2.2));
    // the mouths: a straight strip inwards, then a passage to the way (extra mouths join the nearest point of it)
    for (const mo of mouths) {
      for (const [x, y] of mo.cells) for (let d = 0; d <= 3; d++) { const px = x + mo.dx * d, py = y + mo.dy * d; if (px >= 0 && px < W && py >= 0 && py < H) open[py][px] = true; }
      const [sx0, sy0] = inner(mo);
      if (mo === entryM || mo === exitM) continue;
      const nearest = path.reduce((b, p) => (Math.hypot(p[0] - sx0, p[1] - sy0) < Math.hypot(b[0] - sx0, b[1] - sy0) ? p : b), path[0]);
      const n = Math.max(2, Math.round(Math.hypot(nearest[0] - sx0, nearest[1] - sy0) * 2));
      for (let q = 0; q <= n; q++) disc(sx0 + (nearest[0] - sx0) * (q / n), sy0 + (nearest[1] - sy0) * (q / n), 1.5);
    }
    // join each end of the way to its mouth strip (the strip may be off-centre relative to the waypoint)
    for (const mo of [entryM, exitM]) for (const [x, y] of mo.cells) for (let d = 0; d <= 3; d++) open[y + mo.dy * d][x + mo.dx * d] = true;

    // --- side chambers hanging off the way through short passages (dead ends: items wait there)
    const chambers: { x: number; y: number }[] = [];
    const want = 3 + Math.floor(rand() * 3);
    for (let tries = 0; tries < 80 && chambers.length < want; tries++) {
      const x = 4 + Math.floor(rand() * (W - 8)), y = 4 + Math.floor(rand() * (H - 8));
      const nearest = path.reduce((b, p) => (Math.hypot(p[0] - x, p[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? p : b), path[0]);
      const d = Math.hypot(nearest[0] - x, nearest[1] - y);
      if (d < 4.5 || d > 9 || chambers.some((c) => Math.hypot(c.x - x, c.y - y) < 8)) continue;
      ellipse(x, y, 2.6 + rand() * 1.6, 2.4 + rand() * 1.4);
      const wob = rand() * 6.28, n = Math.round(d * 2);
      for (let s = 0; s <= n; s++) {
        const t = s / n;
        disc(x + (nearest[0] - x) * t + Math.sin(t * 5 + wob) * 0.8, y + (nearest[1] - y) * t, 1.5);
      }
      chambers.push({ x, y });
    }

    // --- smooth the outline: fill in notches, shave single-tile spikes
    for (let pass = 0; pass < 2; pass++) {
      const snap = open.map((r) => [...r]);
      for (let y = 1; y < H - 1; y++) for (let x = 3; x < W - 3; x++) {
        const n = N8.filter(([dx, dy]) => snap[y + dy]?.[x + dx]).length;
        if (!snap[y][x] && n >= 6) open[y][x] = true;
        else if (snap[y][x] && n <= 2) open[y][x] = false;
      }
    }
    // keep what is reachable from the west mouth only
    const reach = Array.from({ length: H }, () => Array(W).fill(false));
    const e0 = mid(entryM);
    const queue: [number, number][] = [[e0[0], e0[1]]]; reach[e0[1]][e0[0]] = true;
    const isOpen = (x, y) => open[y]?.[x] === true;
    for (let i = 0; i < queue.length; i++) for (const [dx, dy] of N4) {
      const nx = queue[i][0] + dx, ny = queue[i][1] + dy;
      if (isOpen(nx, ny) && !reach[ny][nx]) { reach[ny][nx] = true; queue.push([nx, ny]); }
    }
    if (!mouths.every((mo) => mo.cells.every(([x, y]) => reach[y][x]))) continue;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) open[y][x] = reach[y][x];
    const room = (x, y) => N8.every(([dx, dy]) => open[y + dy]?.[x + dx]); // all 8 neighbours open

    // --- terrain features
    const g: string[][] = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (open[y][x] ? '.' : '#')));
    const spots: [number, number][] = [];
    for (let y = 2; y < H - 2; y++) for (let x = 3; x < W - 3; x++) if (room(x, y)) spots.push([x, y]);
    if (!spots.length) continue;
    const patch = (cx, cy, r, ch) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (g[y]?.[x] === '.' && (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1 && x > 2 && x < W - 3) g[y][x] = ch; };
    const featureCount = Math.floor((W * H) / 60);
    for (let k = 0; k < featureCount; k++) {
      const [x, y] = pick(spots);
      if (forest) patch(x, y, 1 + Math.floor(rand() * 2), ',');
      else if (rand() < 0.3) patch(x, y, 1, ',');
    }
    // single obstacles, spaced out so each one stands alone inside open ground
    const obst: [number, number][] = [];
    for (let k = 0; k < featureCount * 2; k++) {
      const [x, y] = pick(spots);
      if (g[y][x] !== '.' || obst.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 4) || x < 6 || x > W - 7) continue;
      g[y][x] = forest ? pick(['q', 'R', 'f', 'f']) : pick(['R', 'R', 'f', 'f']);
      obst.push([x, y]);
    }

    // --- objects
    const people = (m.npcs ?? []).filter((n) => !n.blocker);
    const trainers = people.filter((n) => n.trainer);
    const others = people.filter((n) => !n.trainer);
    const used: [number, number][] = [];
    const clear = (x, y) => g[y]?.[x] === '.' && room(x, y) && !used.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 3);
    const near = (x, y, ok): [number, number] | null => {
      for (let r = 0; r < 7; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(x + dx, y + dy)) return [x + dx, y + dy];
      return null;
    };
    const faceBack = (idx): Dir => {
      const [x, y] = path[idx], [px, py] = path[Math.max(0, idx - 6)];
      return Math.abs(px - x) >= Math.abs(py - y) ? (px < x ? 'left' : 'right') : (py < y ? 'up' : 'down');
    };
    let bad = false;
    const onPath = (list, frac) => list.forEach((n, i) => {
      const idx = Math.min(path.length - 1, Math.floor(path.length * frac(i)));
      const spot = near(path[idx][0], path[idx][1], clear);
      if (!spot) { bad = true; return; }
      n.x = spot[0]; n.y = spot[1]; n.dir = faceBack(idx); used.push(spot);
    });
    onPath(trainers, (i) => 0.18 + (0.62 * (i + 0.5)) / Math.max(1, trainers.length));
    const story = others.filter((n) => /rival|marta/.test(n.script ?? ''));
    onPath(story, (i) => 0.85 - i * 0.1);
    const rest = others.filter((n) => !story.includes(n));
    rest.forEach((n, i) => {
      const c = chambers[i % Math.max(1, chambers.length)];
      const spot = c ? near(Math.round(c.x), Math.round(c.y), clear) : null;
      if (spot) { n.x = spot[0]; n.y = spot[1]; n.dir = 'down'; used.push(spot); return; }
      onPath([n], () => 0.3 + 0.1 * i);
    });
    // items in the side chambers: those already in the map keep their count, new ones fill the rest
    const itemList = m.items ?? (m.items = []);
    const extra = [...(opts.extraItems ?? [])];
    const slots = chambers.map((c) => near(Math.round(c.x), Math.round(c.y), clear)).filter(Boolean) as [number, number][];
    itemList.forEach((it, i) => { const s = slots[i]; if (!s) { bad = true; return; } it.x = s[0]; it.y = s[1]; used.push(s); });
    for (let i = itemList.length; i < slots.length && extra.length; i++) { itemList.push({ x: slots[i][0], y: slots[i][1], item: extra.shift(), id: `${seed}_mz${i}` }); used.push(slots[i]); }
    if (bad) continue;
    // the sign stands beside the entrance
    const nSign = m.signs?.length ?? 0;
    let placed = 0;
    for (let x = 3; x < 10 && placed < nSign; x++) for (let y = 2; y < H - 2 && placed < nSign; y++) {
      if (g[y][x] === '.' && room(x, y) && !entryM.cells.some(([mx, my]) => Math.abs(mx - x) + Math.abs(my - y) <= 3) && !used.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 3)) { g[y][x] = 'S'; used.push([x, y]); placed++; }
    }
    if (placed < nSign) continue;

    // --- the way through must still exist with every object counted as a wall, and every object must be reachable
    const block = new Set<string>(used.map(([x, y]) => `${x},${y}`));
    const walk = (x, y) => open[y]?.[x] && !block.has(`${x},${y}`) && !['R', 'q', 'f', 'S'].includes(g[y][x]);
    const seen = new Set<string>([`${e0[0]},${e0[1]}`]); const q2: [number, number][] = [[e0[0], e0[1]]];
    for (let i = 0; i < q2.length; i++) for (const [dx, dy] of N4) { const nx = q2[i][0] + dx, ny = q2[i][1] + dy; if (walk(nx, ny) && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); q2.push([nx, ny]); } }
    if (!mouths.every((mo) => mo.cells.every(([x, y]) => seen.has(`${x},${y}`)))) continue;
    if (![...(m.items ?? []), ...people].every((o) => N4.some(([dx, dy]) => seen.has(`${o.x + dx},${o.y + dy}`)))) continue;

    // --- autotile the rock/trees: each wall tile knows which sides face open ground; floors vary and get a shade
    const wallOf = (x, y) => g[y]?.[x] === '#' || g[y]?.[x] === undefined;
    const hash = (x, y) => ((x * 73856093) ^ (y * 19349663) ^ (attempt * 83492791)) >>> 0;
    const kind = forest ? 'forest' : 'cave';
    const out = g.map((r) => [...r]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] === '#') {
        const mask = (wallOf(x, y - 1) ? 0 : 1) | (wallOf(x + 1, y) ? 0 : 2) | (wallOf(x, y + 1) ? 0 : 4) | (wallOf(x - 1, y) ? 0 : 8);
        out[y][x] = wallChar(kind, mask, hash(x, y) % 3);
      } else if (g[y][x] === '.') {
        const h = hash(x, y) % 100;
        if (g[y - 1]?.[x] === '#') out[y][x] = floorChar(kind, 2);
        else if (h < 10) out[y][x] = floorChar(kind, 0);
        else if (h < 17) out[y][x] = floorChar(kind, 1);
      }
    }
    // the mouths keep a plain trail tile on the very edge (cave mouths are built from it)
    for (const mo of mouths) for (const [x, y] of mo.cells) out[y][x] = '=';

    const final = out.map((r) => r.join(''));
    m.tiles = final;
    m.maze = true;
    if (forest) m.theme = 'bosque';
    return true;
  }
  return false;
}
