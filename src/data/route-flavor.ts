// Route variety: after guideMap lays the trail, each route gets its own character from the land it crosses
// (coast, wetland, farmland, sierra, outskirts). Walls only swap for other solid tiles and extra obstacles are
// checked against the trail, so every route stays as passable as the guided version.
import { rng } from './map-gen.ts';
import { TILE_INFO } from '../gfx/tiles.ts';

export const ROUTE_FLAVOR = {
  r_colonia_rosario: 'coast', r_rocha_paloma: 'coast',
  r_lascano_rocha: 'wetland', r_villasoriano_fraybentos: 'wetland',
  r_palmitas_mercedes: 'farm', r_belen_artigas: 'farm', r_sarandi_durazno: 'farm', r_casupa_florida: 'farm',
  r_baltasar_rivera: 'sierra', r_tupambae_melo: 'sierra', r_cerrochato_quebrada: 'sierra', r_piriapolis_minas: 'sierra',
  r_sanramon_canelones: 'suburb', r_laspiedras_montevideo: 'suburb',
};

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const solid = (c) => c === undefined || !!TILE_INFO[c]?.solid;
const WALL = new Set(['#', 'q']);

export function flavorRoute(m, id) {
  const kind = ROUTE_FLAVOR[id];
  if (!kind || m.maze || m.theme === 'cueva') return;
  const rand = rng(`flavor${id}`);
  const rows = m.tiles.map((r) => [...r]);
  const h = rows.length, w = rows[0].length;
  const objs = [...(m.npcs ?? []), ...(m.items ?? []), ...(m.legend ? [m.legend] : [])];
  const near = (x, y, r = 2) => objs.some((o) => Math.abs(o.x - x) <= r && Math.abs(o.y - y) <= r);
  const edge = (x, y) => x < 1 || y < 1 || x >= w - 1 || y >= h - 1;
  // a wall tile touching walkable ground is the "first layer"; the rest is deep forest nobody can reach
  const frontier = (x, y) => D4.some(([dx, dy]) => !solid(rows[y + dy]?.[x + dx]));
  const reach = () => {
    const seen = new Set(); const st = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === '=') { seen.add(`${x},${y}`); st.push([x, y]); }
    while (st.length) {
      const [x, y] = st.pop();
      for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy, k = `${nx},${ny}`; if (!seen.has(k) && !solid(rows[ny]?.[nx])) { seen.add(k); st.push([nx, ny]); } }
    }
    return seen;
  };
  const swapWalls = (fn) => {
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (!WALL.has(rows[y][x])) continue;
      const c = fn(x, y, frontier(x, y));
      if (c) rows[y][x] = c;
    }
  };
  // blobs of an obstacle/ground tile on open grass, undone when they would cut anything off
  const blobs = (count, rMin, rMax, tile, minDist = 2) => {
    for (let k = 0, done = 0; k < 80 && done < count; k++) {
      const x = 4 + Math.floor(rand() * (w - 8)), y = 4 + Math.floor(rand() * (h - 8));
      const r = rMin + Math.floor(rand() * (rMax - rMin + 1));
      if (near(x, y, r + 1) || rows[y][x] === '=') continue;
      const cells = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const cx = x + dx, cy = y + dy;
        if (dx * dx + dy * dy > r * r + rand() * 1.5 || edge(cx, cy)) continue;
        if (['.', ',', 'f'].includes(rows[cy][cx]) && !near(cx, cy, 1)) cells.push([cx, cy]);
      }
      if (cells.length < 3) continue;
      const before = reach();
      const saved = cells.map(([cx, cy]) => rows[cy][cx]);
      cells.forEach(([cx, cy]) => { rows[cy][cx] = tile; });
      if (TILE_INFO[tile]?.solid) {
        const after = reach();
        const lost = [...before].some((k) => after.has(k) === false && !cells.some(([cx, cy]) => k === `${cx},${cy}`));
        if (lost) { cells.forEach(([cx, cy], i) => { rows[cy][cx] = saved[i]; }); continue; }
      }
      done++;
    }
  };
  const dress = (from, tile, chance) => {
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (from.includes(rows[y][x]) && !near(x, y, 1) && rand() < chance) rows[y][x] = tile;
  };
  // open ground that stays walkable: sand or flowers in drifts
  const drifts = (count, tile, rMin, rMax) => blobs(count, rMin, rMax, tile);

  if (kind === 'coast') {
    swapWalls((x, y, f) => (rand() < 0.75 ? 'p' : null));
    drifts(7, 's', 2, 4);
    blobs(2, 2, 3, '~');
  } else if (kind === 'wetland') {
    swapWalls((x, y, f) => (f && rand() < 0.35 ? 'q' : null));
    blobs(5, 2, 3, '~');
    drifts(4, 'f', 1, 2);
    dress([','], ',', 0);
  } else if (kind === 'farm') {
    let n = 0;
    swapWalls((x, y, f) => {
      if (!f) return rand() < 0.88 ? '.' : 'q';
      n++;
      return n % 9 === 0 ? 'q' : 'F';
    });
    drifts(3, 'f', 1, 2);
  } else if (kind === 'sierra') {
    swapWalls((x, y, f) => (rand() < 0.7 ? 'R' : null));
    blobs(6, 1, 2, 'R');
  } else if (kind === 'suburb') {
    swapWalls((x, y, f) => (f ? (rand() < 0.15 ? 'q' : 'F') : (rand() < 0.5 ? '.' : null)));
    drifts(6, 'f', 1, 2);
  }
  m.tiles = rows.map((r) => r.join(''));
}
