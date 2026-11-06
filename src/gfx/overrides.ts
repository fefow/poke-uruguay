// Hand-drawn sprites from the visual editor take precedence over the generated ones.
// Each generator asks override(key, w, h) first; keys are 'creature:<species>', 'char:<look>|<dir>|<frame>',
// 'item:<key>', 'badge:<n>', 'ui:<icon>' and 'tile:<theme|><char><frame>'.
import { SPRITE_OVERRIDES } from '../data/sprite-overrides.js';
import { SPRITE_ORIGINALS } from '../data/sprite-originals.js';

/** The original art (new creature sprites) with the editor's later edits on top. */
export const BASE_SPRITES = { ...SPRITE_ORIGINALS, ...SPRITE_OVERRIDES };
import { decodeSprite, spriteHasHoles } from './sprite-codec.ts';

let table = BASE_SPRITES;
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

/** The stored entry of an edited sprite (with extras such as a tile's `bg`), or null. */
export function overrideEntry(key) {
  if (bypass) return null;
  return table[key] ?? null;
}

/** True when the edited sprite has see-through pixels (a tile drawn without its ground). */
export function overrideHasHoles(key) {
  if (bypass) return false;
  const k = `${key}|holes`;
  if (!decoded.has(k)) decoded.set(k, spriteHasHoles(table[key]));
  return decoded.get(k);
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
