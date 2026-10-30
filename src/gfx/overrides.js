// Hand-drawn sprites from the visual editor take precedence over the generated ones.
// Each generator asks override(key, w, h) first; keys are 'creature:<species>', 'char:<look>|<dir>|<frame>',
// 'item:<key>', 'badge:<n>' and 'tile:<theme|><char><frame>'.
import { SPRITE_OVERRIDES } from '../data/sprite-overrides.js';
import { decodeSprite } from './sprite-codec.js';

let table = SPRITE_OVERRIDES;
let bypass = 0;
const decoded = new Map();

function toCanvas(o) {
  const px = decodeSprite(o);
  if (!px) return null;
  const c = document.createElement('canvas');
  c.width = o.w;
  c.height = o.h;
  c.getContext('2d').putImageData(new ImageData(px, o.w, o.h), 0, 0);
  return c;
}

/** Canvas for an edited sprite, or null (none, wrong size, or generated art requested). */
export function override(key, w, h) {
  if (bypass) return null;
  const o = table[key];
  if (!o || o.w !== w || o.h !== h) return null;
  if (!decoded.has(key)) decoded.set(key, toCanvas(o));
  return decoded.get(key);
}

/** Mirrored copy (creature back sprites). */
export function overrideMirrored(key, w, h) {
  const src = override(key, w, h);
  if (!src) return null;
  const k = `${key}|mirror`;
  if (!decoded.has(k)) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.translate(w, 0);
    g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    decoded.set(k, c);
  }
  return decoded.get(k);
}

/** Run fn with the generated art only (the editor's "original" view). */
export function generated(fn) {
  bypass++;
  try { return fn(); } finally { bypass--; }
}

/** Editor live preview: swap the whole table. */
export function setOverrides(map) {
  table = map;
  decoded.clear();
}
export const hasOverride = (key) => !!table[key];
