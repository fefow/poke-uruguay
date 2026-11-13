// Cámara de frío del Frigorífico Anglo: a floor of ice. Stepping on ice throws the player in that direction until something
// solid (a frozen crate, a wall, a person) or a plain floor tile stops them, so the way across is a puzzle of stops.
// The generator searches fixed seeds until the room is solvable (start platform -> exit platform), needs at least
// MIN_SLIDES slides, and has no soft lock: from the exit platform the player can always slide back to the start.
export const ICE = 'ӵ', CRATE = 'ӷ';
export const ICE_W = 20, ICE_H = 16;
export const ICE_START = { x: 9, y: 14 };        // where the player arrives from the depósito (platform row)
export const ICE_STAIRS = { x: 9, y: 0 };         // stairs up, in the top wall
export const MIN_SLIDES = 7;

const FLOOR = new Set(['Y', 'm', 'A', 'Ϲ']);
/** Where the player ends after pressing `d` at (x,y): one step on plain ground, then on until a non-ice tile or an obstacle. */
export function iceStep(tiles: string[], blocked: Set<string>, x: number, y: number, d: [number, number]) {
  let cx = x, cy = y, moved = false;
  for (;;) {
    const nx = cx + d[0], ny = cy + d[1];
    const t = tiles[ny]?.[nx];
    if (t === undefined || blocked.has(`${nx},${ny}`) || !(t === ICE || FLOOR.has(t))) break;
    cx = nx; cy = ny; moved = true;
    if (t !== ICE) break;
  }
  return moved ? { x: cx, y: cy } : null;
}
const DIRS4: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
export function iceReach(tiles: string[], blocked: Set<string>, from: { x: number; y: number }) {
  const dist = new Map<string, number>([[`${from.x},${from.y}`, 0]]);
  const q = [from];
  for (let k = 0; k < q.length; k++) {
    const c = q[k], dc = dist.get(`${c.x},${c.y}`)!;
    for (const d of DIRS4) {
      const n = iceStep(tiles, blocked, c.x, c.y, d);
      if (n && !dist.has(`${n.x},${n.y}`)) { dist.set(`${n.x},${n.y}`, dc + 1); q.push(n); }
    }
  }
  return dist;
}
/** Tiles of the exit platform (rows 1-2) the player can land on. */
export const onExitPlatform = (x: number, y: number) => y <= 2 && x >= 7 && x <= 12;
export const onStartPlatform = (x: number, y: number) => y >= 13 && x >= 7 && x <= 12;

export function iceRoom(seed0 = 1) {
  for (let seed = seed0; seed < seed0 + 5000; seed++) {
    let s = seed * 2654435761 >>> 0;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const g: string[][] = Array.from({ length: ICE_H }, () => Array(ICE_W).fill('x'));
    for (let y = 3; y <= 12; y++) for (let x = 1; x <= 18; x++) g[y][x] = ICE;
    for (let y = 1; y <= 2; y++) for (let x = 7; x <= 12; x++) g[y][x] = 'Y';
    for (let y = 13; y <= 14; y++) for (let x = 7; x <= 12; x++) g[y][x] = 'Y';
    g[0][9] = 'Ӻ'; // stairs up
    g[15][9] = 'm'; g[15][10] = 'm';
    // frozen crates scattered over the ice (never on the rows where the field meets the platforms, so the lanes stay open)
    for (let y = 3; y <= 12; y++) for (let x = 1; x <= 18; x++) if (rnd() < 0.13) g[y][x] = CRATE;
    // a few crates stand on the platforms' sides too, so the platforms are not just open ground
    const tiles = g.map((r) => r.join(''));
    // people stand on the platforms (they count as obstacles)
    const people = new Set(['12,14', '7,1', '12,1']);
    const dist = iceReach(tiles, people, ICE_START);
    let best = Infinity; let goal: string | null = null;
    for (const [k, v] of dist) { const [x, y] = k.split(',').map(Number); if (onExitPlatform(x, y) && v < best) { best = v; goal = k; } }
    if (!goal || best < MIN_SLIDES) continue;
    // no soft lock: from the goal the start platform must be reachable again, and every reachable ice stop reaches the goal
    const [gx, gy] = goal.split(',').map(Number);
    const back = iceReach(tiles, people, { x: gx, y: gy });
    if (![...back.keys()].some((k) => { const [x, y] = k.split(',').map(Number); return onStartPlatform(x, y); })) continue;
    let locked = false;
    for (const k of dist.keys()) {
      const [x, y] = k.split(',').map(Number);
      const r = iceReach(tiles, people, { x, y });
      if (![...r.keys()].some((kk) => { const [a, b] = kk.split(',').map(Number); return onExitPlatform(a, b); }) || ![...r.keys()].some((kk) => { const [a, b] = kk.split(',').map(Number); return onStartPlatform(a, b); })) { locked = true; break; }
    }
    if (locked || dist.size < 60) continue;
    return { tiles, seed, slides: best };
  }
  throw new Error('iceRoom: no seed found');
}
