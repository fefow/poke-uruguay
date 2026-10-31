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
const FLIP = { left: 'right', right: 'left', up: 'up', down: 'down' };

/** Re-lay a gym interior with plan `i` (0-11): plans 6-11 are the mirror images of 0-5. */
export function layoutGym(m, i) {
  const plan = PLANS[i % PLANS.length];
  const mirror = i >= PLANS.length;
  const fx = (x) => (mirror ? 11 - x : x);
  m.tiles = plan.tiles.map((r) => (mirror ? [...r].reverse().join('') : r));
  const trainers = (m.npcs ?? []).filter((n) => n.trainer);
  const leader = (m.npcs ?? []).find((n) => n.script === 'leader');
  const guide = (m.npcs ?? []).find((n) => !n.trainer && n.script !== 'leader');
  if (leader) { leader.x = 5; leader.y = 2; }
  trainers.forEach((n, k) => { const s = plan.trainers[k % plan.trainers.length]; n.x = fx(s.x); n.y = s.y; n.dir = mirror ? FLIP[s.dir] : s.dir; });
  if (guide) { guide.x = fx(plan.guide.x); guide.y = plan.guide.y; }
}
