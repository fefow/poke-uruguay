// Turns an open generated route into a guided one, the way Pokémon routes are laid out: a winding trail with
// thick tree walls on both sides, tall-grass clusters next to the trail, a few side pockets for trainers and
// items, and one-way ledges (tile 'λ') that can only be hopped downwards.
import { rng } from './map-gen.js';
import { TILE_INFO } from '../gfx/tiles.js';

const GROUND = new Set(['.', ',', 'f']);
const solid = (c) => c === undefined || !!TILE_INFO[c]?.solid;
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * m: an outdoor route map ({tiles, npcs, items, ...}); opts.width: base half-width of the trail (smaller = denser).
 * Everything the player can reach before stays reachable, with the ledges counted as walls.
 */
export function guideMap(m, seed, opts = {}) {
  const base = opts.width ?? 3;
  const rand = rng(`guide${seed}`);
  const rows = m.tiles.map((r) => [...r]);
  const h = rows.length, w = rows[0].length;
  const at = (x, y) => rows[y]?.[x];
  const objs = [...(m.npcs ?? []), ...(m.items ?? []), ...(m.legend ? [m.legend] : [])];

  // distance from the trail ('=' tiles, and the edge cells where the map exits)
  const dist = Array.from({ length: h }, () => Array(w).fill(99));
  const q = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === '=' || rows[y][x] === 'b') { dist[y][x] = 0; q.push([x, y]); }
  if (!q.length) return;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (dist[ny]?.[nx] > dist[y][x] + 1) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); } }
  }

  // trail half-width wanders between base-1 and base+1 along the trail
  const phase = rand() * 9;
  const along = (x, y) => (w > h ? x : y);
  const widthAt = (x, y) => Math.max(1, Math.round(base + Math.sin(along(x, y) * 0.31 + phase) * 1.1));

  // pockets: clearings around every person, item and sign that sits away from the trail, joined to it by a short spur
  const open = new Set();
  const mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) open.add(`${x + dx},${y + dy}`); };
  const spurs = [];
  for (const o of objs) {
    mark(o.x, o.y, 2);
    if (dist[o.y]?.[o.x] > widthAt(o.x, o.y)) spurs.push([o.x, o.y]);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === 'S') mark(x, y, 1);
  // two or three extra empty clearings with grass, so the sides are not a solid wall
  for (let k = 0; k < 3; k++) {
    const x = 4 + Math.floor(rand() * (w - 8)), y = 4 + Math.floor(rand() * (h - 8));
    if (dist[y][x] >= 4 && dist[y][x] < 8) { mark(x, y, 2); spurs.push([x, y]); }
  }
  const carve = (x, y) => {
    let cx = x, cy = y;
    for (let i = 0; i < 40 && dist[cy][cx] > 0; i++) {
      open.add(`${cx},${cy}`);
      const best = D4.map(([dx, dy]) => [cx + dx, cy + dy]).filter(([nx, ny]) => dist[ny]?.[nx] !== undefined).sort((a, b) => dist[a[1]][a[0]] - dist[b[1]][b[0]])[0];
      if (!best || dist[best[1]][best[0]] >= dist[cy][cx]) break;
      [cx, cy] = best;
    }
  };
  for (const [x, y] of spurs) carve(x, y);

  // tree walls: everything outside the trail corridor and the pockets
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (!GROUND.has(rows[y][x]) || dist[y][x] <= widthAt(x, y) || open.has(`${x},${y}`)) continue;
    rows[y][x] = rand() < 0.22 ? 'q' : '#';
  }

  // tall grass beside the trail, in clusters of 3-4 wide
  const patches = 4 + Math.floor(rand() * 3);
  for (let k = 0; k < patches; k++) {
    const x = 3 + Math.floor(rand() * (w - 7)), y = 3 + Math.floor(rand() * (h - 7));
    for (let dy = 0; dy < 2 + Math.floor(rand() * 2); dy++) for (let dx = 0; dx < 3 + Math.floor(rand() * 2); dx++) {
      const gx = x + dx, gy = y + dy;
      if ((rows[gy]?.[gx] === '.' || rows[gy]?.[gx] === 'f') && dist[gy][gx] >= 1 && dist[gy][gx] <= 4) rows[gy][gx] = ',';
    }
  }

  // ledges: short one-way lines across grass, never cutting off anything that was reachable
  const reach = () => {
    const starts = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dist[y][x] === 0) starts.push([x, y]);
    const seen = new Set(starts.map(([x, y]) => `${x},${y}`));
    const st = [...starts];
    while (st.length) {
      const [x, y] = st.pop();
      for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy, k = `${nx},${ny}`; if (!seen.has(k) && !solid(at(nx, ny)) ) { seen.add(k); st.push([nx, ny]); } }
    }
    return seen.size;
  };
  let before = reach();
  const guard = new Set(objs.flatMap((o) => [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => `${o.x + dx},${o.y + dy}`))));
  let ledges = 0;
  for (let tries = 0; tries < 500 && ledges < 5; tries++) {
    const len = 3 + Math.floor(rand() * 4);
    const x0 = 3 + Math.floor(rand() * (w - 6 - len)), y0 = 3 + Math.floor(rand() * (h - 6));
    const cells = [];
    for (let i = 0; i < len; i++) cells.push([x0 + i, y0]);
    const ok = cells.every(([x, y]) => (at(x, y) === '.' || at(x, y) === ',') && dist[y][x] >= 1 && !guard.has(`${x},${y}`) && !solid(at(x, y - 1)) && !solid(at(x, y + 1)) && at(x, y + 1) !== 'λ' && at(x, y - 1) !== 'λ');
    if (!ok) continue;
    const saved = cells.map(([x, y]) => at(x, y));
    cells.forEach(([x, y]) => { rows[y][x] = 'λ'; });
    if (reach() < before - cells.length) cells.forEach(([x, y], i) => { rows[y][x] = saved[i]; });
    else { cells.forEach(([x, y]) => guard.add(`${x},${y}`)); ledges++; before = reach(); }
  }
  m.tiles = rows.map((r) => r.join(''));
}
