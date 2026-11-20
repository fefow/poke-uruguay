// Large battle portraits of trainers (GBA style, drawn with PixelLab from each look's map sprite so both match).
// One portrait per look: every trainer drawn with a look in the world uses that look's portrait in battle.
// Looks without a portrait fall back to the map sprite at 3x.
import { TRAINER_PORTRAITS } from './trainer-portraits-data.ts';

export const PORTRAIT_SIZE = 96;
const images = new Map<string, HTMLImageElement>();

function image(key: string) {
  const src = TRAINER_PORTRAITS[key];
  if (!src) return null;
  let img = images.get(key);
  if (!img) {
    img = new Image();
    img.src = src;
    images.set(key, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

/** True when the look has a battle portrait (it may still be loading). */
export const hasPortrait = (look: string, back = false) => !!TRAINER_PORTRAITS[back ? `back:${look}` : look];

/** Starts decoding a portrait ahead of the battle intro. */
export function preloadPortrait(look: string, back = false) { image(back ? `back:${look}` : look); }

/**
 * Draws the portrait of `look` with its feet centred on (cx, base), at native size so the pixel art stays crisp.
 * Returns false when there is no portrait (or it is still loading), so the caller can draw the map sprite instead.
 */
export function drawPortrait(g: CanvasRenderingContext2D, look: string, cx: number, base: number, back = false) {
  const img = image(back ? `back:${look}` : look);
  if (!img) return false;
  g.imageSmoothingEnabled = false;
  g.drawImage(img, Math.round(cx - img.naturalWidth / 2), Math.round(base - img.naturalHeight));
  return true;
}
