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
  // decided on the map as it was before the swap, so a wall turned into grass never makes the next one a
  // "first layer" too (that used to leave fence and ceibo in a checkerboard)
  const swapWalls = (fn) => {
    const front = rows.map((r, y) => r.map((c, x) => WALL.has(c) && x > 0 && y > 0 && x < w - 1 && y < h - 1 && frontier(x, y)));
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (!WALL.has(rows[y][x])) continue;
      const c = fn(x, y, front[y][x]);
      if (c) rows[y][x] = c;
    }
  };
  // one choice per 3x3 block, so swapped walls come in stands (palms, rocks) instead of one tile here and one there
  const salt = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 9973; // not from rand(): the rest of the route stays as it was
  const block = (x, y) => { const v = Math.sin(Math.floor(x / 3) * 127.1 + Math.floor(y / 3) * 311.7 + salt) * 43758.5453; return v - Math.floor(v); };
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
    swapWalls((x, y, f) => (rand(), block(x, y) < 0.75 ? 'p' : null)); // rand() still drawn: the rest of the route keeps its layout
    drifts(7, 's', 2, 4);
    blobs(2, 2, 3, '~');
  } else if (kind === 'wetland') {
    swapWalls((x, y, f) => (f && (rand(), block(x, y) < 0.35) ? 'q' : null));
    blobs(5, 2, 3, '~');
    drifts(4, 'f', 1, 2);
    dress([','], ',', 0);
  } else if (kind === 'farm') {
    let n = 0;
    // a hedge of trees along the way and open pasture behind it, with a stand of ceibos here and there
    swapWalls((x, y, f) => {
      if (!f) return (rand(), block(x, y) < 0.9) ? '.' : 'q';
      n++;
      return n % 9 === 0 ? 'q' : null;
    });
    drifts(3, 'f', 1, 2);
    // corrals out in the pasture: straight fences round a square with one gap, hay bales here and there (only on
    // pasture the trail cannot reach, so nothing on the way changes)
    const onWay = reach();
    const pasture = (x, y) => !edge(x, y) && rows[y][x] === '.' && !onWay.has(`${x},${y}`);
    for (let k = 0, made = 0; k < 60 && made < 3; k++) {
      const cw = 5 + Math.floor(rand() * 4), chh = 4 + Math.floor(rand() * 2);
      const x0 = 2 + Math.floor(rand() * (w - cw - 4)), y0 = 2 + Math.floor(rand() * (h - chh - 4));
      let ok = true;
      for (let y = y0 - 1; y <= y0 + chh && ok; y++) for (let x = x0 - 1; x <= x0 + cw && ok; x++) if (!pasture(x, y)) ok = false;
      if (!ok) continue;
      const gap = x0 + 1 + Math.floor(rand() * (cw - 2));
      for (let x = x0; x < x0 + cw; x++) { rows[y0][x] = 'F'; if (x !== gap) rows[y0 + chh - 1][x] = 'F'; }
      for (let y = y0; y < y0 + chh; y++) { rows[y][x0] = 'F'; rows[y][x0 + cw - 1] = 'F'; }
      rows[y0 + 1][x0 + 1] = 'Ξ';
      made++;
    }
  } else if (kind === 'sierra') {
    swapWalls((x, y, f) => (rand(), block(x, y) < 0.7 ? 'R' : null));
    blobs(6, 1, 2, 'R');
  } else if (kind === 'suburb') {
    swapWalls((x, y, f) => (f ? (rand() < 0.15 ? 'q' : 'F') : (rand(), block(x, y) < 0.5) ? '.' : null));
    drifts(6, 'f', 1, 2);
  }
  // anyone left behind a new fence or stand gets a gate: the shortest way through the swapped walls opens up
  const seen = reach();
  for (const o of objs) {
    if (seen.has(`${o.x},${o.y}`) || solid(rows[o.y]?.[o.x])) continue;
    const prev = new Map([[`${o.x},${o.y}`, null]]);
    const q = [[o.x, o.y]];
    let end = null;
    for (let i = 0; i < q.length && !end; i++) {
      const [x, y] = q[i];
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (prev.has(k) || edge(nx, ny) || !(rows[ny][nx] === 'F' || WALL.has(rows[ny][nx]) || !solid(rows[ny][nx]))) continue;
        prev.set(k, `${x},${y}`);
        if (seen.has(k)) { end = k; break; }
        q.push([nx, ny]);
      }
    }
    for (let k = end; k; k = prev.get(k)) { const [x, y] = k.split(',').map(Number); if (solid(rows[y][x])) rows[y][x] = '.'; }
    if (end) for (const k of reach()) seen.add(k);
  }
  m.tiles = rows.map((r) => r.join(''));
}
