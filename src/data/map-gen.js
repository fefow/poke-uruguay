import { SPECIES } from './species.js';

// Seeded generators for the later maps: routes (wandering paths with grass, trees and ponds)
// and cities (two streets with the standard gym, Policlínica, shop and house blocks).
// Everything is deterministic, so a map is the same on every run and in every save.

export function rng(seed) {
  let a = [...String(seed)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7) || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grid = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
const rows = (g) => g.map((r) => r.join(''));

/** Gym block, 7 wide x 3 tall: roof, roof with emblem, facade with the door. */
export const GYM_CHARS = {
  fuego: ['1', '2', '3'], planta: ['4', '5', '6'], lucha: ['7', '8', '9'], psiquico: ['!', '@', '$'], siniestro: ['&', '*', '+'],
  tierra: ['À', 'Á', 'Â'], normal: ['Ã', 'Ä', 'Å'], bicho: ['È', 'É', 'Ê'], volador: ['Ì', 'Í', 'Î'],
};
const gymBlock = (fam) => { const [r, f, e] = GYM_CHARS[fam]; return [`${r}${r}${r}${r}${r}${r}${r}`, `${r}${r}${r}${e}${r}${r}${r}`, `${f}${f}${f}D${f}${f}${f}`]; };
const BLOCKS = {
  poli: ['CCCCC', 'CCQCC', 'IIDII'],
  shop: ['UUUUU', 'ttDtt'],
  house: ['rrrrr', 'rrrrr', 'HwDwH'],
  houseB: ['uuuuu', 'uuuuu', 'HwDwH'],
  houseG: ['ggggg', 'ggggg', 'HwDwH'],
  houseO: ['ooooo', 'ooooo', 'HwDwH'],
  houseV: ['vvvvv', 'vvvvv', 'HwDwH'],
  torre: ['zzz', 'zzz', 'zDz'],
  fabrica: ['WWWWWWW', 'WWWWWWW', 'WWWDWWW'],
};
const block = (kind) => (GYM_CHARS[kind] ? gymBlock(kind) : BLOCKS[kind]);

function put(g, x, y, pattern) {
  pattern.forEach((line, dy) => [...line].forEach((c, dx) => { if (g[y + dy]?.[x + dx] !== undefined) g[y + dy][x + dx] = c; }));
}

const SOLID_DECO = new Set('#qpRFSHwrugovWCQIUtDlLMzZ'.split(''));

/**
 * City: border of trees, street A (row `sa`) with a row of buildings above it, optional street B
 * (row `sb`) with more buildings above that one, and a vertical road between them.
 * a / b: [[kind, x, doorTarget?], ...] with x the left column of the block.
 */
export function city({ seed, w = 28, h = 20, base = '.', border = '#', road = 'c', sa = 6, sb = 15, sc = 0, a = [], b = [], c = [], vroads = [], nroads = [], sroads = [], decor = {}, water = [], plazas = [], groves = [], bridges = [], signs = [], exits = {} }) {
  const r = rng(seed);
  const g = grid(w, h, base);
  for (let x = 0; x < w; x++) { g[0][x] = border; g[h - 1][x] = border; }
  for (let y = 0; y < h; y++) { g[y][0] = border; g[y][w - 1] = border; }
  const doors = [];
  const signAt = [];
  const place = (list, ys) => list.forEach(([kind, x, target]) => {
    let pat = block(kind);
    const y = ys - pat.length;
    if (target === undefined) pat = pat.map((l) => l.replace('D', 'w')); // decorative building, no entrance
    put(g, x, y, pat);
    if (target === undefined) return;
    const di = pat.findIndex((l) => l.includes('D'));
    doors.push({ x: x + pat[di].indexOf('D'), y: y + di, to: target });
  });
  // streets
  for (let x = 1; x < w - 1; x++) g[sa][x] = road;
  if (b.length) for (let x = 1; x < w - 1; x++) g[sb][x] = road;
  if (c.length) for (let x = 1; x < w - 1; x++) g[sc][x] = road;
  const lastStreet = c.length ? sc : b.length ? sb : h - 2;
  for (const vx of vroads) for (let y = sa; y <= lastStreet; y++) g[y][vx] = road;
  for (const nx of nroads) for (let y = 0; y <= sa; y++) g[y][nx] = road;
  for (const sx of sroads) for (let y = c.length ? sc : b.length ? sb : sa; y < h; y++) g[y][sx] = road;
  place(a, sa);
  place(b, sb);
  place(c, sc);
  // plazas: a paved square with a two-tile fountain in the middle
  for (const [px, py, pw, ph] of plazas) {
    for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) if (g[y]?.[x] !== undefined) g[y][x] = road;
    const fx = px + ((pw - 2) >> 1), fy = py + ((ph - 2) >> 1);
    for (let y = fy; y < fy + 2; y++) for (let x = fx; x < fx + 2; x++) g[y][x] = '~';
  }
  // groves: a rectangle of trees with a clear lane through the middle
  for (const [gx, gy, gw, gh, ch = '#'] of groves) {
    for (let y = gy; y < gy + gh; y++) for (let x = gx; x < gx + gw; x++) if (g[y]?.[x] === base && (x - gx) % 4 !== 2 && (y - gy) % 4 !== 2) g[y][x] = ch;
  }
  for (const rect of water) for (let y = rect[1]; y < rect[1] + rect[3]; y++) for (let x = rect[0]; x < rect[0] + rect[2]; x++) if (g[y]?.[x] !== undefined && g[y][x] === base) g[y][x] = rect[4] ?? '~';
  for (const [bx0, bx1, by] of bridges) for (let x = bx0; x <= bx1; x++) g[by][x] = 'b';
  // scattered decoration on free base tiles (never on roads)
  for (const [ch, n] of Object.entries(decor)) {
    for (let i = 0, tries = 0; i < n && tries < 400; tries++) {
      const x = 2 + Math.floor(r() * (w - 4)); const y = 2 + Math.floor(r() * (h - 4));
      if (g[y][x] === base && g[y - 1]?.[x] !== undefined && !SOLID_DECO.has(g[y + 1]?.[x]) && y !== sa - 0) { g[y][x] = ch; i++; }
    }
  }
  for (const [side, y] of Object.entries(exits)) {
    if (side === 'w') { g[y][0] = road; if (g[y][1] === base || g[y][1] === border) g[y][1] = road; }
    if (side === 'e') { g[y][w - 1] = road; }
    if (side === 'n') { g[0][y] = road; }
    if (side === 's') { g[h - 1][y] = road; }
  }
  for (const [x, y] of signs) { g[y][x] = 'S'; signAt.push([x, y]); }
  doors.sort((p, q) => p.y - q.y || p.x - q.x);
  return { tiles: rows(g), doors: doors.map((d) => d.to), doorPos: doors };
}

/**
 * Route: a path from one edge to the other with the edge rows given in `from` / `to`
 * (axis 'h' = west to east, 'v' = north to south). Returns tiles plus candidate spots
 * for trainers (grass tiles next to the path, spaced out) and items.
 */
export function route({ seed, w = 30, h = 20, axis = 'h', from, to, base = '.', border = '#', path = '=', grass = [], ponds = [], trees = 0, treeChar = 'q', rocks = 6, flowers = 8, signs = 1, bridge = null, gates = [], fence = 'F' }) {
  const r = rng(seed);
  const g = grid(w, h, base);
  for (let x = 0; x < w; x++) { g[0][x] = border; g[h - 1][x] = border; }
  for (let y = 0; y < h; y++) { g[y][0] = border; g[y][w - 1] = border; }
  const pts = [];
  const along = axis === 'h' ? w : h;
  const across = axis === 'h' ? h : w;
  const phase = r() * 6;
  const amp = 2 + Math.floor(r() * 3);
  for (let t = 0; t < along; t++) {
    const env = Math.min(1, t / 5, (along - 1 - t) / 5);
    let c = Math.round(from + ((to - from) * t) / (along - 1) + Math.sin(t * 0.38 + phase) * amp * env);
    c = Math.max(3, Math.min(across - 4, c));
    if (t === 0) c = from;
    if (t === along - 1) c = to;
    pts.push(c);
  }
  if (bridge) for (let t = bridge[0]; t <= bridge[1]; t++) pts[t] = pts[bridge[0]];
  // gates sit on straight stretches so a single guard fills the whole gap
  const gateAt = gates.map((want) => {
    for (let d = 0; d < along; d++) for (const t of [want + d, want - d]) {
      if (t > 7 && t < along - 8 && (bridge ? true : (t - 6) % 4 !== 0) && pts[t - 1] === pts[t] && pts[t] === pts[t + 1]) return t;
    }
    return want;
  });
  const set = (t, k, ch) => { const x = axis === 'h' ? t : k; const y = axis === 'h' ? k : t; if (g[y]?.[x] !== undefined) g[y][x] = ch; };
  for (let t = 0; t < along; t++) {
    set(t, pts[t], path);
    if (t > 0 && pts[t] !== pts[t - 1]) for (let k = Math.min(pts[t], pts[t - 1]); k <= Math.max(pts[t], pts[t - 1]); k++) set(t, k, path);
  }
  const pathAt = (x, y) => g[y]?.[x] === path;
  const free = (x, y) => x > 1 && y > 1 && x < w - 2 && y < h - 2 && g[y][x] === base;
  const nearPath = (x, y, d) => { for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (pathAt(x + dx, y + dy)) return true; return false; };
  // tall grass patches: [count, minSize, maxSize] blobs away from the very edges
  const blob = (ch, cx, cy, bw, bh) => { for (let y = cy; y < cy + bh; y++) for (let x = cx; x < cx + bw; x++) if (free(x, y) && (x + y + cx) % 7 !== 0) g[y][x] = ch; };
  for (const [n, lo, hi, ch = ','] of grass) {
    for (let i = 0, tries = 0; i < n && tries < 200; tries++) {
      const bw = lo + Math.floor(r() * (hi - lo + 1)); const bh = lo + Math.floor(r() * (hi - lo + 1));
      const cx = 3 + Math.floor(r() * (w - 6 - bw)); const cy = 3 + Math.floor(r() * (h - 6 - bh));
      if (!nearPath(cx + (bw >> 1), cy + (bh >> 1), 1) && !nearPath(cx, cy, 0)) { blob(ch, cx, cy, bw, bh); i++; }
    }
  }
  for (const [n, bw, bh] of ponds) {
    for (let i = 0, tries = 0; i < n && tries < 200; tries++) {
      const cx = 3 + Math.floor(r() * (w - 6 - bw)); const cy = 3 + Math.floor(r() * (h - 6 - bh));
      let ok = true;
      for (let y = cy - 1; y <= cy + bh && ok; y++) for (let x = cx - 1; x <= cx + bw && ok; x++) if (g[y]?.[x] !== base) ok = false;
      if (ok) { for (let y = cy; y < cy + bh; y++) for (let x = cx; x < cx + bw; x++) g[y][x] = '~'; i++; }
    }
  }
  const sprinkle = (ch, n, d = 1) => { for (let i = 0, tries = 0; i < n && tries < 300; tries++) { const x = 2 + Math.floor(r() * (w - 4)); const y = 2 + Math.floor(r() * (h - 4)); if (free(x, y) && !nearPath(x, y, d)) { g[y][x] = ch; i++; } } };
  sprinkle(treeChar, trees, 1);
  sprinkle('R', rocks, 1);
  sprinkle('f', flowers, 0);
  // inner trees: clusters at the borders so the route feels enclosed
  for (let x = 1; x < w - 1; x++) for (const y of [1, h - 2]) if (g[y][x] === base && r() < 0.55 && !nearPath(x, y, 1)) g[y][x] = border;
  for (let y = 1; y < h - 1; y++) for (const x of [1, w - 2]) if (g[y][x] === base && r() < 0.55 && !nearPath(x, y, 1)) g[y][x] = border;
  // river crossing: water on both sides of a straight bridge
  if (bridge) {
    for (let t = bridge[0]; t <= bridge[1]; t++) for (let k = 1; k < across - 1; k++) set(t, k, k === pts[t] ? 'b' : '~');
  }
  // gate: a fence line across the route with a single opening where a guard stands (skipped over water)
  const gateSpots = [];
  for (const t of gateAt) {
    const over = bridge && t >= bridge[0] && t <= bridge[1];
    if (!over) for (let k = 1; k < across - 1; k++) if (k !== pts[t]) set(t, k, fence);
    gateSpots.push(axis === 'h' ? { x: t, y: pts[t], dir: 'left' } : { x: pts[t], y: t, dir: 'up' });
  }
  // exits
  if (axis === 'h') { g[from][0] = path; g[to][w - 1] = path; } else { g[0][from] = path; g[h - 1][to] = path; }
  // sign next to the entrance
  const signSpots = [];
  if (signs) {
    const t = 3; const k = pts[t];
    for (const off of [-1, 1]) { const x = axis === 'h' ? t : k + off; const y = axis === 'h' ? k + off : t; if (free(x, y)) { signSpots.push([x, y]); break; } }
    for (const [x, y] of signSpots) g[y][x] = 'S';
  }
  // trainer / item spots: free tiles beside the path, spaced along it
  const spots = [];
  for (let t = 6; t < along - 4; t += 4) {
    for (const off of [-2, 2, -3, 3]) {
      const k = pts[t] + off; const x = axis === 'h' ? t : k; const y = axis === 'h' ? k : t;
      if (g[y]?.[x] === base || g[y]?.[x] === ',') {
        // face the path
        const dir = axis === 'h' ? (off > 0 ? 'up' : 'down') : (off > 0 ? 'left' : 'right');
        spots.push({ x, y, dir });
        break;
      }
    }
  }
  const itemSpots = [];
  for (let i = 0, tries = 0; itemSpots.length < 6 && tries < 300; tries++) {
    const x = 2 + Math.floor(r() * (w - 4)); const y = 2 + Math.floor(r() * (h - 4));
    if (g[y][x] === base && nearPath(x, y, 3) && !spots.some((s) => s.x === x && s.y === y)) itemSpots.push({ x, y });
    i++;
  }
  const walk = pts.map((k, t) => (axis === 'h' ? { x: t, y: k } : { x: k, y: t }));
  return { tiles: rows(g), spots, itemSpots, signs: signSpots, walk, gateSpots };
}

// ---------------------------------------------------------------- species helpers
const LEGENDARY = new Set(['pamperon', 'ballenaplata', 'soldemayo', 'yaguarete', 'ombu']);
const STARTER_LINES = new Set(['ceibito', 'ceibal', 'ceibarbol', 'tejuchispa', 'tejubrasa', 'tejufogon', 'carpinchito', 'carpincho', 'carpinchon']);
const PRE = {};
for (const s of Object.values(SPECIES)) if (s.evo) PRE[s.evo.to] = s;
/** Lowest level a species naturally shows up at (its pre-evolutions' evolution levels). */
const minLevel = (k) => { let n = 1; let s = SPECIES[k]; while (PRE[s.key]) { const p = PRE[s.key]; n = Math.max(n, p.evo.stone ? 28 : p.evo.lvl); s = p; } return n; };
const bst = (k) => SPECIES[k].base.reduce((a, b) => a + b, 0);

function pool(types, hi, lo = 1) {
  return Object.keys(SPECIES).filter((k) => !LEGENDARY.has(k) && !STARTER_LINES.has(k) && SPECIES[k].types.some((t) => types.includes(t)) && minLevel(k) <= hi && minLevel(k) >= lo);
}

/** Wild encounter table: species of the given types that exist naturally at these levels. */
export function wildList(types, lo, hi, n = 8, seed = 1, must = []) {
  const r = rng(`${seed}${types.join('')}${lo}`);
  let all0 = pool(types, hi, Math.max(1, lo - 16));
  if (all0.length < n) all0 = pool(types, hi, 1);
  const all = all0.map((k) => [k, r() * 14 + Math.abs(minLevel(k) - (hi - 3))]);
  all.sort((x, y) => x[1] - y[1]);
  const out = all.slice(0, n).map(([k], i) => [k, lo + (i % 2), hi - (i % 3 === 0 ? 1 : 0), Math.max(5, 30 - i * 3)]);
  for (const k of must) if (!out.some(([o]) => o === k)) out.push([k, lo, hi - 1, 8]);
  return out;
}

/** Fishing table: water creatures, rarer ones weighted down. */
export function fishList(lo, hi, seed = 1) {
  return wildList(['agua'], lo, hi, 4, `fish${seed}`).map(([k, a, b], i) => [k, a, b, [45, 30, 15, 10][i]]);
}

/** A trainer team: one creature per level, drawn from the given types (strongest last). */
export function teamOf(types, levels, seed = 1) {
  const r = rng(`${seed}${types.join('')}${levels.join('')}`);
  const used = new Set();
  return levels.map((lv, i) => {
    const cands = pool(types, lv, Math.max(1, lv - 24)).filter((k) => !used.has(k));
    cands.sort((x, y) => (bst(y) + r() * 40 - bst(x) - r() * 40) * (i === levels.length - 1 ? 1 : -0.4));
    const pick = cands[0] ?? pool(['normal', ...types], lv)[0];
    used.add(pick);
    return [pick, lv];
  });
}

const WALKABLE = new Set(['.', ',', '`', ';', 'f', 'c', '=', 's', 'b', 'i', 'Y', 'A']);
/**
 * Moves NPCs and items that were placed by eye onto the nearest free walkable tile
 * (prefers grass over roads), so generated layouts never need hand-tuned coordinates.
 */
export function fitToMap(tiles, list, taken = new Set()) {
  const ok = (x, y, roadsToo) => { const t = tiles[y]?.[x]; return t !== undefined && WALKABLE.has(t) && (roadsToo || (t !== 'c' && t !== '=')); };
  for (const o of list) {
    let best = null;
    for (const roadsToo of [false, true]) {
      for (let d = 0; d < 8 && !best; d++) {
        for (let dy = -d; dy <= d && !best; dy++) for (let dx = -d; dx <= d && !best; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
          const x = o.x + dx; const y = o.y + dy;
          if (ok(x, y, roadsToo) && !taken.has(`${x},${y}`)) best = [x, y];
        }
      }
      if (best) break;
    }
    if (best) { o.x = best[0]; o.y = best[1]; }
    taken.add(`${o.x},${o.y}`);
  }
}
