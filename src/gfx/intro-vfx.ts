// Plays the PixelLab VFX sheets of the new-game intro (src/gfx/intro-vfx-data.ts) on the 2D canvas.
// Always at native size and whole-pixel positions, so the pixel art stays crisp.
import { INTRO_VFX, INTRO_BG } from './intro-vfx-data.ts';

const images = new Map<string, HTMLImageElement>();

/** Starts loading every sheet; drawing simply skips a sheet until it has loaded. */
export function preloadIntroVfx() {
  for (const [k, v] of Object.entries(INTRO_VFX)) {
    if (images.has(k)) continue;
    const img = new Image();
    img.src = v.src;
    images.set(k, img);
  }
  for (const [k, src] of Object.entries(INTRO_BG)) {
    if (images.has(`bg:${k}`)) continue;
    const img = new Image();
    img.src = src;
    images.set(`bg:${k}`, img);
  }
}

/** Draws background `name` at exactly 2x with its top-left at (x, y); `alpha` blends it over what is already drawn. */
export function drawIntroBg(g: CanvasRenderingContext2D, name: string, x = 0, y = 0, alpha = 1) {
  const img = images.get(`bg:${name}`);
  if (!img || !img.complete || !img.naturalWidth || alpha <= 0) return;
  const prev = g.globalAlpha;
  g.globalAlpha = prev * alpha;
  g.imageSmoothingEnabled = false;
  g.drawImage(img, Math.round(x), Math.round(y), img.naturalWidth * 2, img.naturalHeight * 2);
  g.globalAlpha = prev;
}

/** Length of a one-shot effect in ms. */
export function vfxDuration(name: string) {
  const v = INTRO_VFX[name];
  return v ? v.frames.length * v.ms : 0;
}

/**
 * Draws effect `name` with its anchor at (x, y), `elapsed` ms after it started.
 * Loops wrap; a one-shot draws nothing before it starts or after its last frame.
 * `flip` mirrors it around the anchor.
 */
export function drawVfx(g: CanvasRenderingContext2D, name: string, x: number, y: number, elapsed: number, { flip = false, alpha = 1 } = {}) {
  const v = INTRO_VFX[name];
  const img = images.get(name);
  if (!v || !img || !img.complete || !img.naturalWidth || elapsed < 0) return;
  let i = Math.floor(elapsed / v.ms);
  if (v.loop) i %= v.frames.length;
  else if (i >= v.frames.length) return;
  const [sx, sy] = v.frames[i];
  const prevA = g.globalAlpha;
  g.globalAlpha = prevA * alpha;
  if (flip) {
    g.save();
    g.translate(Math.round(x), 0);
    g.scale(-1, 1);
    g.drawImage(img, sx, sy, v.w, v.h, -v.ax, Math.round(y) - v.ay, v.w, v.h);
    g.restore();
  } else {
    g.drawImage(img, sx, sy, v.w, v.h, Math.round(x) - v.ax, Math.round(y) - v.ay, v.w, v.h);
  }
  g.globalAlpha = prevA;
}
