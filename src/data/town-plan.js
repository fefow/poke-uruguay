// Town planner: lays out a whole town from a spec (road polylines, water, plazas, groves, ground patches,
// props) and then finds a place for every building along the roads, with a dirt path from its door to the
// street. Every town gets its own spec, so no two look alike. Deterministic: same spec, same map.
import { rng, block } from './map-gen.js';
import { TILE_INFO } from '../gfx/tiles.js';

const SOLID = { has: (c) => !!TILE_INFO[c]?.solid };

/** Draws a 1-tile-wide orthogonal polyline. */
function drawPath(g, pts, ch) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
    let x = x0, y = y0;
    for (;;) {
      if (g[y]?.[x] !== undefined) g[y][x] = ch;
      if (x === x1 && y === y1) break;
      if (x !== x1) x += dx; else y += dy;
    }
  }
}

function rect(g, [x, y, w, h], ch, only = null) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (g[yy]?.[xx] !== undefined && (!only || g[yy][xx] === only)) g[yy][xx] = ch;
}

export function planTown(spec, buildings, { seed = 'town', signs = 1, edges = [], animals = true } = {}) {
  const { w, h } = spec;
  const r = rng(`${seed}plan`);
  const border = spec.border ?? '#';
  const road = spec.road ?? 'c';
  const tree = spec.tree ?? border;
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  for (let x = 0; x < w; x++) { g[0][x] = border; g[h - 1][x] = border; }
  for (let y = 0; y < h; y++) { g[y][0] = border; g[y][w - 1] = border; }

  // 1. ground patches and hills first, so roads and buildings sit on top of them
  for (const f of spec.fills ?? []) rect(g, f.rect, f.ch, f.only ?? '.');
  for (const hl of spec.hills ?? []) {
    const [x, y, ww, hh] = hl.rect;
    for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) if (g[yy]?.[xx] === '.' && r() < (hl.density ?? 0.75)) g[yy][xx] = hl.ch ?? 'μ';
  }
  // 2. water, then roads (a road over water becomes a bridge)
  const water = new Set();
  const lay = (x, y) => { if (g[y]?.[x] === '.' || g[y]?.[x] === 's' || g[y]?.[x] === 'ß') { g[y][x] = '~'; water.add(`${x},${y}`); } };
  for (const wt of spec.water ?? []) {
    if (wt.rect) for (let y = wt.rect[1]; y < wt.rect[1] + wt.rect[3]; y++) for (let x = wt.rect[0]; x < wt.rect[0] + wt.rect[2]; x++) lay(x, y);
    if (wt.blob) { const [cx, cy, rx, ry] = wt.blob; for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + (r() - 0.5) * 0.25) lay(x, y); }
    if (wt.pts) {
      const wd = wt.w ?? 3;
      for (let i = 0; i + 1 < wt.pts.length; i++) {
        const [x0, y0] = wt.pts[i], [x1, y1] = wt.pts[i + 1];
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / (n || 1)), y = Math.round(y0 + ((y1 - y0) * k) / (n || 1));
          for (let a = 0; a < wd; a++) for (let b = 0; b < wd; b++) lay(x - (wd >> 1) + a, y - (wd >> 1) + b);
        }
      }
    }
  }
  for (const pl of spec.plazas ?? []) {
    rect(g, [pl.x, pl.y, pl.w, pl.h], road);
    const cx = pl.x + ((pl.w - 1) >> 1), cy = pl.y + ((pl.h - 1) >> 1);
    if (pl.piece === 'fuente') { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { g[cy + dy][cx + dx] = '~'; water.add(`${cx + dx},${cy + dy}`); } }
    else if (pl.piece) g[cy][cx] = pl.piece;
    if (pl.ring) for (const [dx, dy] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { const x = cx + dx, y = cy + dy; if (g[y]?.[x] === road) g[y][x] = pl.ring; }
    if (pl.benches) for (const [dx, dy] of [[-2, 0], [3, 0]]) { const x = cx + dx, y = cy + dy; if (g[y]?.[x] === road) g[y][x] = 'Δ'; }
  }
  for (const pa of spec.paths) {
    const before = pa.map(() => 0);
    drawPath(g, pa, road);
    void before;
  }
  // every side the story needs open gets a road to it, even if the spec's streets stop short
  const nearestRoad = (ex, ey) => { let best = null; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y][x] === road) { const d = Math.abs(x - ex) + Math.abs(y - ey); if (!best || d < best.d) best = { x, y, d }; } return best; };
  const sideCells = { n: (i) => [i, 1], s: (i) => [i, h - 2], w: (i) => [1, i], e: (i) => [w - 2, i] };
  for (const side of edges) {
    const len = side === 'n' || side === 's' ? w : h;
    if ([...Array(len).keys()].some((i) => { const [x, y] = sideCells[side](i); return g[y][x] === road; })) continue;
    const mid = len >> 1;
    const [ex, ey] = sideCells[side](Math.max(3, Math.min(len - 4, mid + Math.floor((r() - 0.5) * 6))));
    const t = nearestRoad(ex, ey);
    if (!t) continue;
    const via = side === 'n' || side === 's' ? [[ex, ey], [ex, t.y], [t.x, t.y]] : [[ex, ey], [t.x, ey], [t.x, t.y]];
    drawPath(g, via, road);
  }
  // bridges: a road tile laid over water becomes a bridge
  for (const key of water) { const [x, y] = key.split(',').map(Number); if (g[y][x] === road) g[y][x] = 'b'; }
  // open the map edges where roads leave
  const open = { n: () => { for (let x = 1; x < w - 1; x++) if (g[1][x] === road || g[1][x] === 'b') g[0][x] = road; }, s: () => { for (let x = 1; x < w - 1; x++) if (g[h - 2][x] === road || g[h - 2][x] === 'b') g[h - 1][x] = road; }, w: () => { for (let y = 1; y < h - 1; y++) if (g[y][1] === road || g[y][1] === 'b') g[y][0] = road; }, e: () => { for (let y = 1; y < h - 1; y++) if (g[y][w - 2] === road || g[y][w - 2] === 'b') g[y][w - 1] = road; } };
  for (const side of edges) open[side]?.();

  for (const [ch, x, y] of spec.props ?? []) if (g[y]?.[x] !== undefined && g[y][x] !== road) g[y][x] = ch;

  // 4. buildings
  const keep = new Set(); // door fronts and the paths that reach them stay free
  const placed = [];
  const doors = [];
  const isRoad = (x, y) => g[y]?.[x] === road || g[y]?.[x] === 'b';
  const solidAt = (x, y) => SOLID.has(g[y]?.[x]);
  for (const b of buildings) {
    const pat = block(b.kind);
    const ph = pat.length, pw = pat[0].length;
    const di = pat.findIndex((l) => l.includes('D'));
    const dcol = di >= 0 ? pat[di].indexOf('D') : (pw >> 1);
    const hasDoor = b.to !== undefined;
    let best = null;
    for (let by = ph + 1; by < h - 2; by++) for (let x = 2; x + pw < w - 1; x++) {
      const top = by - ph + 1;
      let ok = true;
      for (let yy = top - 1; yy <= by + 1 && ok; yy++) for (let xx = x - 1; xx <= x + pw && ok; xx++) {
        const inside = yy >= top && yy <= by && xx >= x && xx < x + pw;
        const c = g[yy]?.[xx];
        if (c === undefined) { ok = false; break; }
        if (inside ? !'.sζηßν`'.includes(c) : (solidAt(xx, yy) && c !== border) ) ok = false;
        if (inside && keep.has(`${xx},${yy}`)) ok = false;
        if (c === border && inside) ok = false;
      }
      if (!ok) continue;
      let spur = 0;
      if (hasDoor) {
        const fx = x + dcol;
        let yy = by + 1;
        while (yy < h - 1 && !isRoad(fx, yy) && g[yy][fx] !== undefined && !solidAt(fx, yy) && spur < 6) { yy++; spur++; }
        if (!isRoad(fx, yy) || spur >= 6) continue;
      }
      const hint = b.hint ? Math.abs(b.hint[0] - x) + Math.abs(b.hint[1] - by) : 0;
      let score = spur * 3 + hint * 1.2 + r() * 6;
      if (!hasDoor) for (let xx = x; xx < x + pw; xx++) if (isRoad(xx, by + 1) || isRoad(xx, by + 2)) { score -= 8; break; }
      if (b.spur && spur < b.spur) continue;
      if (!best || score < best.score) best = { x, by, spur, score };
    }
    if (!best) { if (b.soft) continue; throw new Error(`${seed}: no hay lugar para ${b.kind} (${b.to ?? 'decorativo'})`); }
    const { x, by, spur } = best;
    const top = by - ph + 1;
    let p2 = pat;
    if (!hasDoor) p2 = pat.map((l) => l.replace('D', 'w'));
    p2.forEach((line, dy) => [...line].forEach((c, dx) => { g[top + dy][x + dx] = c; }));
    if (hasDoor) {
      const fx = x + dcol;
      for (let k = 1; k <= spur; k++) { g[by + k][fx] = '='; }
      for (let k = 1; k <= spur + 1; k++) keep.add(`${fx},${by + k}`);
      doors.push({ x: fx, y: top + di, to: b.to });
    }
    placed.push({ x, top, pw, ph, kind: b.kind });
  }

  // 4b. groves and orchards fill what the buildings left
  for (const gr of spec.groves ?? []) {
    const [x, y, ww, hh] = gr.rect;
    for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) {
      if (g[yy]?.[xx] !== '.' ) continue;
      if (gr.lanes && ((xx - x) % gr.lanes === gr.lanes - 1 || (yy - y) % gr.lanes === gr.lanes - 1)) continue;
      if (gr.rows && (yy - y) % 2 === 1) continue;
      if (r() < (gr.density ?? 0.85)) g[yy][xx] = gr.tree ?? tree;
    }
  }
  // 5. street furniture and scatter, never on a door path
  const free = (x, y) => '.sζηßν`'.includes(g[y]?.[x] ?? '#') && !keep.has(`${x},${y}`) && x > 1 && y > 1 && x < w - 2 && y < h - 2;
  const nearRoad = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isRoad(x + dx, y + dy));
  if (spec.lamps) {
    let n = 0;
    for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) if (free(x, y) && nearRoad(x, y) && (x * 5 + y * 3) % (spec.lamps === true ? 9 : spec.lamps) === 0 && g[y + 1]?.[x] !== 'D') { g[y][x] = 'Σ'; n++; }
    void n;
  }
  for (const [ch, count, mode] of spec.scatter ?? []) {
    for (let i = 0, t = 0; i < count && t < 600; t++) {
      const x = 2 + Math.floor(r() * (w - 4)), y = 2 + Math.floor(r() * (h - 4));
      if (!free(x, y)) continue;
      if (mode === 'road' && !nearRoad(x, y)) continue;
      if (mode === 'away' && (nearRoad(x, y) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => SOLID.has(g[y + dy]?.[x + dx])))) continue;
      g[y][x] = ch; i++;
    }
  }
  for (const gr of spec.grass ?? []) {
    const [x, y, ww, hh] = gr;
    for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) if (free(xx, yy) && r() < 0.9) g[yy][xx] = ',';
  }

  // 6. signs near the roads
  const signSpots = [];
  for (let n = 0, t = 0; n < signs && t < 800; t++) {
    const x = 2 + Math.floor(r() * (w - 4)), y = 2 + Math.floor(r() * (h - 4));
    if (!free(x, y) || !nearRoad(x, y) || g[y + 1]?.[x] === 'D' || signSpots.some(([sx, sy]) => Math.abs(sx - x) + Math.abs(sy - y) < 8)) continue;
    g[y][x] = 'S'; signSpots.push([x, y]); n++;
  }

  // 7. pockets of walkable ground that the player cannot reach turn into trees
  const walk = (x, y) => { const c = g[y]?.[x]; return c !== undefined && !SOLID.has(c); };
  let start = null;
  for (let y = 0; y < h && !start; y++) for (let x = 0; x < w; x++) if (isRoad(x, y)) { start = [x, y]; break; }
  const seen = new Set([`${start[0]},${start[1]}`]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (walk(nx, ny) && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); q.push([nx, ny]); } }
  }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (walk(x, y) && !seen.has(`${x},${y}`) && g[y][x] !== 'D') g[y][x] = tree;

  // 8. creatures in the distance: they wander but cannot be fought
  const critters = [];
  if (animals) {
    for (const an of spec.animals ?? []) {
      const [x, y, ww, hh] = an.rect;
      for (let i = 0, t = 0; i < an.n && t < 200; t++) {
        const ax = x + Math.floor(r() * ww), ay = y + Math.floor(r() * hh);
        if ('.sζηßν`'.includes(g[ay]?.[ax] ?? '#') && seen.has(`${ax},${ay}`) && !critters.some((c) => c.x === ax && c.y === ay)) { critters.push({ x: ax, y: ay, sp: an.sp }); i++; }
      }
    }
  }

  doors.sort((a, b) => a.y - b.y || a.x - b.x);
  return { tiles: g.map((row) => row.join('')), doors: doors.map((d) => d.to), doorPos: doors, critters, placed, w, h };
}
