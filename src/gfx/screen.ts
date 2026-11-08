// The single game canvas (480x270 logical pixels), scaled with CSS.
export const W = 480;
export const H = 270;

let canvas, ctx;
let renderer = null;

export function mountScreen(el) {
  canvas = el;
  canvas.width = W;
  canvas.height = H;
  ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

export const getCtx = () => ctx;
export const setRenderer = (fn) => (renderer = fn);
export const getRenderer = () => renderer;

let after = null;
export const setAfterRender = (fn) => (after = fn);

export function render(t) {
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  if (renderer) renderer(ctx, t);
  if (after) after();
}

/** Pixel-snapped text helper for canvas overlays (title screen, credits). */
export function text(g, str, x, y, { color = '#fff', size = 8, align = 'left', shadow = '#000', font = '"Press Start 2P", ui-monospace, monospace' } = {}) {
  g.font = `${size}px ${font}`;
  g.textAlign = align;
  g.textBaseline = 'top';
  if (shadow) {
    g.fillStyle = shadow;
    g.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
  }
  g.fillStyle = color;
  g.fillText(str, Math.round(x), Math.round(y));
}

const START_HOUR = 8 + Math.random() * 8;
const BOOT = typeof performance !== 'undefined' ? performance.now() : 0;
const MS_PER_HOUR = 45000; // title screen only: a full day lasts 18 real minutes
/** In-game hour 0..24. */
let clockSource: (() => number | null) | null = null;
/** The calendar (src/game/calendar.ts) supplies the hour once a game is loaded. */
export const setClockSource = (fn) => (clockSource = fn);
export function skyHour(now = typeof performance !== 'undefined' ? performance.now() : 0) {
  const h = clockSource?.();
  if (h != null) return h;
  return (START_HOUR + (now - BOOT) / MS_PER_HOUR) % 24;
}

/** Time-of-day tint from the in-game clock. */
export function dayTint(hr = skyHour()) {
  if (hr >= 20 || hr < 5.5) return 'rgba(20,30,90,0.32)';
  if (hr >= 18) return 'rgba(255,120,40,0.14)';
  if (hr < 7.5) return 'rgba(255,170,120,0.12)';
  return null;
}
