// Text format for hand-edited sprites (src/data/sprite-overrides.js), readable in git diffs:
//   { w, h, c, p, d }  w/h size · c chars per pixel (1 or 2) · p palette ('#rrggbb' or '#rrggbbaa')
//   d rows of palette codes, '.' (or '..') is a transparent pixel.
// Pure functions on RGBA byte arrays, so they run in node tests and in the browser alike.
const ABC = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const hex2 = (n) => n.toString(16).padStart(2, '0');

function code(i, c) {
  return c === 1 ? ABC[i] : ABC[Math.floor(i / ABC.length)] + ABC[i % ABC.length];
}

/** rgba: Uint8ClampedArray/Array of w*h*4 bytes. Fully transparent pixels become '.'. */
export function encodeSprite(rgba, w, h) {
  const index = new Map();
  const pal = [];
  const px = [];
  for (let i = 0; i < w * h; i++) {
    const a = rgba[i * 4 + 3];
    if (a === 0) { px.push(-1); continue; }
    const col = `#${hex2(rgba[i * 4])}${hex2(rgba[i * 4 + 1])}${hex2(rgba[i * 4 + 2])}${a === 255 ? '' : hex2(a)}`;
    if (!index.has(col)) { index.set(col, pal.length); pal.push(col); }
    px.push(index.get(col));
  }
  if (pal.length > ABC.length * ABC.length) throw new Error('demasiados colores');
  const c = pal.length <= ABC.length ? 1 : 2;
  const empty = '.'.repeat(c);
  const d = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const i = px[y * w + x];
      row += i < 0 ? empty : code(i, c);
    }
    d.push(row);
  }
  return { w, h, c, p: pal, d };
}

function parseColor(s) {
  const n = s.slice(1);
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), n.length >= 8 ? parseInt(n.slice(6, 8), 16) : 255];
}

/** Returns a Uint8ClampedArray of w*h*4 bytes, or null when the data is malformed. */
export function decodeSprite(o) {
  if (!o || !Number.isInteger(o.w) || !Number.isInteger(o.h) || !Array.isArray(o.p) || !Array.isArray(o.d)) return null;
  const c = o.c === 2 ? 2 : 1;
  if (o.d.length !== o.h || o.d.some((r) => typeof r !== 'string' || r.length !== o.w * c)) return null;
  const pal = o.p.map(parseColor);
  const out = new Uint8ClampedArray(o.w * o.h * 4);
  for (let y = 0; y < o.h; y++) {
    const row = o.d[y];
    for (let x = 0; x < o.w; x++) {
      const s = row.slice(x * c, x * c + c);
      if (s[0] === '.') continue;
      const i = c === 1 ? ABC.indexOf(s) : ABC.indexOf(s[0]) * ABC.length + ABC.indexOf(s[1]);
      const col = pal[i];
      if (!col) return null;
      out.set(col, (y * o.w + x) * 4);
    }
  }
  return out;
}

/** The overrides file as JS source: one sprite per line, so git diffs stay readable. */
export function overridesSource(map) {
  const keys = Object.keys(map).sort();
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])}`);
  return `// Sprites drawn or retouched in the visual editor (editor.html). Each entry replaces the
// sprite the game generates with code. Written by the editor: edit there, not by hand.
export const SPRITE_OVERRIDES = {
${lines.join(',\n')}${lines.length ? '\n' : ''}};
`;
}

/** Inverse of overridesSource (used to merge with the copy on GitHub before saving). */
export function parseOverridesSource(src) {
  const start = src.indexOf('{', src.indexOf('SPRITE_OVERRIDES'));
  const end = src.lastIndexOf('}');
  if (start < 0 || end < start) return {};
  return JSON.parse(src.slice(start, end + 1));
}
