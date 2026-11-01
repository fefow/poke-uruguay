// Six gym floor plans (12x12), each also mirrored: twelve gyms, twelve different insides. The leader always waits at
// the far end; trainers stand where the player has to pass; the old guide stands near the entrance.
const TOP = 'xxxxxXZxxxxx';
const MAT = 'YYYYYmmYYYYY';
const L = 'YYYYYAAYYYYY';
const OPEN = 'YYYYYYYYYYYY';
const NN = 'NYYYYYYYYYYN';

const PLANS = [
  { // zig-zag: walls with alternating gaps
    tiles: [TOP, NN, L, 'xxxxxxxxxxYY', OPEN, 'YYxxxxxxxxxx', OPEN, 'xxxxxxxxxxYY', OPEN, 'YYxxxxxxxxxx', L, MAT],
    trainers: [{ x: 7, y: 8, dir: 'left' }, { x: 4, y: 4, dir: 'right' }], guide: { x: 8, y: 10 },
  },
  { // two side blocks with a central corridor
    tiles: [TOP, NN, L, OPEN, 'YxxxxYYxxxxY', 'YxNNxYYxNNxY', 'YxNNxYYxNNxY', 'YxxxxYYxxxxY', OPEN, 'YxxYYYYYYxxY', L, MAT],
    trainers: [{ x: 5, y: 5, dir: 'down' }, { x: 2, y: 8, dir: 'right' }], guide: { x: 9, y: 10 },
  },
  { // ring around a solid centre
    tiles: [TOP, NN, L, OPEN, 'YYxxxxxxxxYY', 'YYxxxxxxxxYY', 'YYxxxxxxxxYY', 'YYxxxxxxxxYY', 'YYxxxxxxxxYY', OPEN, L, MAT],
    trainers: [{ x: 1, y: 5, dir: 'down' }, { x: 10, y: 7, dir: 'up' }], guide: { x: 3, y: 9 },
  },
  { // side rooms off a central hall
    tiles: [TOP, NN, L, OPEN, 'xxxxYYYYxxxx', 'YYYxYYYYxYYY', 'YYYxYYYYxYYY', 'YYYxYYYYxYYY', OPEN, OPEN, L, MAT],
    trainers: [{ x: 1, y: 6, dir: 'down' }, { x: 10, y: 6, dir: 'down' }], guide: { x: 6, y: 9 },
  },
  { // forest of pillars
    tiles: [TOP, NN, L, 'YNYYNYYNYYNY', OPEN, 'YYNYYNYYNYYY', OPEN, 'YNYYNYYNYYNY', OPEN, 'YYNYYNYYNYYY', L, MAT],
    trainers: [{ x: 3, y: 4, dir: 'right' }, { x: 8, y: 6, dir: 'left' }], guide: { x: 10, y: 8 },
  },
  { // cross-shaped hall
    tiles: [TOP, NN, L, OPEN, 'xxxYYYYYYxxx', 'xxxYYYYYYxxx', OPEN, OPEN, 'xxxYYYYYYxxx', 'xxxYYYYYYxxx', L, MAT],
    trainers: [{ x: 1, y: 6, dir: 'right' }, { x: 10, y: 7, dir: 'left' }], guide: { x: 6, y: 4 },
  },
];
/**
 * Correo Uruguayo (Mercedes): a mail sorting centre, 26x20. The player walks the belt lanes of the sorting floor in
 * a zig-zag between rows of pigeonhole shelves ('ϊ'), past parcels ('ϋ') and two postal workers, to the director's office.
 */
function correoPlan() {
  const W = 26, H = 20;
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('x'));
  const rect = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = c; };
  rect(8, 1, 17, 4, 'Y'); rect(12, 1, 13, 4, 'A'); g[1][8] = 'N'; g[1][17] = 'N'; g[4][8] = 'N'; g[4][17] = 'N'; // director's office
  g[0][12] = 'X'; g[0][13] = 'Z';
  rect(11, 5, 14, 5, 'Y');                                      // office door
  rect(1, 6, 24, 14, 'Y');                                      // sorting floor
  for (const y of [7, 10, 13]) rect(1, y, 24, y, 'ΐ');           // belts (the lanes)
  rect(1, 8, 24, 9, 'ϊ'); rect(3, 8, 4, 9, 'ΐ');                 // shelves with a gap on the left
  rect(1, 11, 24, 12, 'ϊ'); rect(21, 11, 22, 12, 'ΐ');           // shelves with a gap on the right
  for (const [x, y] of [[1, 7], [24, 7], [1, 10], [24, 10], [1, 13], [24, 13], [7, 6], [18, 6], [6, 14], [19, 14]]) g[y][x] = 'ϋ';
  rect(8, 15, 17, 18, 'Y'); rect(12, 15, 13, 18, 'A');          // reception hall
  for (const [x, y] of [[8, 15], [17, 15], [8, 18], [17, 18], [10, 16], [15, 16]]) g[y][x] = 'ϋ';
  g[19][12] = 'm'; g[19][13] = 'm';
  return {
    tiles: g.map((r) => r.join('')),
    leader: { x: 12, y: 2 },
    trainers: [{ x: 15, y: 10, dir: 'right' }, { x: 17, y: 7, dir: 'left' }],
    guide: { x: 10, y: 17 },
  };
}

const FLIP = { left: 'right', right: 'left', up: 'up', down: 'down' };

/** Re-lay a gym interior with plan `i` (0-11): plans 6-11 are the mirror images of 0-5. */
export function layoutGym(m, i) {
  const bespoke = (m.npcs ?? []).some((n) => n.leader === 'correo');
  const plan = bespoke ? correoPlan() : PLANS[i % PLANS.length];
  const mirror = !bespoke && i >= PLANS.length;
  const fx = (x) => (mirror ? 11 - x : x);
  const lead = (plan as any).leader ?? { x: 5, y: 2 };
  m.tiles = plan.tiles.map((r) => (mirror ? [...r].reverse().join('') : r));
  const trainers = (m.npcs ?? []).filter((n) => n.trainer);
  const leader = (m.npcs ?? []).find((n) => n.script === 'leader');
  const guide = (m.npcs ?? []).find((n) => !n.trainer && n.script !== 'leader');
  if (leader) { leader.x = lead.x; leader.y = lead.y; }
  trainers.forEach((n, k) => { const s = plan.trainers[k % plan.trainers.length]; n.x = fx(s.x); n.y = s.y; n.dir = mirror ? FLIP[s.dir] : s.dir; });
  if (guide) { guide.x = fx(plan.guide.x); guide.y = plan.guide.y; }
}
