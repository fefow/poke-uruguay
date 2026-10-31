// Small scenery scattered over open grass on the routes and in the localities, so no two stretches look alike.
// Decorations are transparent objects (see OVER in gfx/tiles.js) drawn over whatever ground they end on.
// Only tiles whose eight neighbours are all plain walkable ground are used, so nothing can ever block a path.
import { Rng } from '../core/rng.js';

const PLAIN = new Set(['.', ',', '=', 's', 'f']);
// [char, weight, where]: 'any' on open grass, 'water' next to water, 'path' next to a dirt road, 'sand' next to sand.
const KINDS = [
  ['Ф', 3, 'any'], ['Ц', 3, 'any'], ['Я', 2, 'any'], ['Ч', 3, 'any'], ['Д', 1.2, 'any'],
  ['Ю', 5, 'water'], ['Ш', 1.5, 'path'], ['Э', 1.5, 'path'], ['И', 2, 'sand'],
];

const hash = (s) => [...s].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);

export function scatterDecor(maps, isTarget) {
  for (const [id, m] of Object.entries(maps)) {
    if (m.indoor || !isTarget(id) || !Array.isArray(m.tiles)) continue;
    const rows = m.tiles.map((r) => r.split(''));
    const H = rows.length, W = rows[0].length;
    const taken = new Set([...(m.npcs ?? []), ...(m.items ?? [])].map((o) => `${o.x},${o.y}`));
    const rng = new Rng(hash(id));
    let placed = 0;
    for (let y = 2; y < H - 2 && placed < 20; y++) {
      for (let x = 2; x < W - 2; x++) {
        if (rows[y][x] !== '.' || !rng.chance(0.1)) continue;
        let open = true, water = false, nearWater = false, path = false, sand = false;
        for (let dy = -2; dy <= 2 && open; dy++) for (let dx = -2; dx <= 2; dx++) {
          const c = rows[y + dy]?.[x + dx];
          const near = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
          if (taken.has(`${x + dx},${y + dy}`)) { open = false; break; }
          if (c === '~') { water = true; if (near) nearWater = true; }
          if (c === '=') path = true;
          if (c === 's') sand = true;
          if (near && !PLAIN.has(c) && c !== '~') { open = false; break; }
        }
        if (!open) continue;
        // next to the shore only reeds (they never block); further inland anything that fits the surroundings
        const ok = KINDS.filter(([, , where]) => (nearWater ? where === 'water' : where === 'any' || (where === 'water' && water) || (where === 'path' && path) || (where === 'sand' && sand)));
        if (!ok.length) continue;
        const pickK = rng.weighted(ok.map(([ch, w]) => ({ ch, w })));
        rows[y][x] = pickK.ch;
        placed++;
      }
    }
    if (placed) m.tiles = rows.map((r) => r.join(''));
  }
}
