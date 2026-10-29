// The single game canvas (320x240 logical pixels), scaled with CSS.
export const W = 320;
export const H = 240;

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

export function render(t) {
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  if (renderer) renderer(ctx, t);
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

/** Time-of-day tint from the player's real clock. */
export function dayTint(date = new Date()) {
  const hr = date.getHours() + date.getMinutes() / 60;
  if (hr >= 20 || hr < 5.5) return 'rgba(20,30,90,0.32)';
  if (hr >= 18) return 'rgba(255,120,40,0.14)';
  if (hr < 7.5) return 'rgba(255,170,120,0.12)';
  return null;
}
