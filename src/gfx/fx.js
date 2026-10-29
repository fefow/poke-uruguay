// Lighting and ambience layered over the pixel art: soft shadows, vignette,
// drifting motes, a lit backdrop for small interiors and multiply-style
// time-of-day grading. Everything is pre-rendered or a handful of draw calls.
import { W, H } from './screen.js';

let vignetteCanvas;
function vignetteImg() {
  if (vignetteCanvas) return vignetteCanvas;
  vignetteCanvas = document.createElement('canvas');
  vignetteCanvas.width = W;
  vignetteCanvas.height = H;
  const g = vignetteCanvas.getContext('2d');
  const grd = g.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 0.95);
  grd.addColorStop(0, 'rgba(8,6,24,0)');
  grd.addColorStop(1, 'rgba(8,6,24,0.55)');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  return vignetteCanvas;
}

export function vignette(g, strength = 1) {
  g.save();
  g.globalAlpha = strength;
  g.drawImage(vignetteImg(), 0, 0);
  g.restore();
}

/** Soft contact shadow under a character or object. */
export function shadow(g, cx, cy, rx = 6, ry = 2.5, a = 0.28) {
  g.fillStyle = `rgba(10,8,30,${a})`;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, 7);
  g.fill();
}

/** Dark gradient backdrop (used when the map is smaller than the screen). */
let bgCanvas;
export function backdrop(g) {
  if (!bgCanvas) {
    bgCanvas = document.createElement('canvas');
    bgCanvas.width = W;
    bgCanvas.height = H;
    const b = bgCanvas.getContext('2d');
    const grd = b.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#1b1a3a');
    grd.addColorStop(1, '#0d0c1e');
    b.fillStyle = grd;
    b.fillRect(0, 0, W, H);
    b.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 8 : 0; x < W; x += 16) b.fillRect(x, y, 8, 8);
  }
  g.drawImage(bgCanvas, 0, 0);
}

/** Drop shadow around the visible map rectangle when it floats on the backdrop. */
export function mapGlow(g, x, y, w, h) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.65)';
  g.shadowBlur = 14;
  g.fillStyle = '#000';
  g.fillRect(x, y, w, h);
  g.restore();
}

/** Slow drifting light motes (pollen, dust, fireflies at night). */
const MOTES = Array.from({ length: 22 }, (_, i) => ({ x: (i * 97) % W, y: (i * 53) % H, s: 0.4 + ((i * 7) % 5) / 6, p: i * 1.7 }));
export function motes(g, t, { night = false } = {}) {
  g.save();
  for (const m of MOTES) {
    const x = (m.x + t * 0.006 * m.s * 6 + Math.sin(t / 1400 + m.p) * 6) % W;
    const y = (m.y - t * 0.003 * m.s * 6 + Math.cos(t / 1700 + m.p) * 4 + H * 4) % H;
    const tw = 0.35 + 0.35 * Math.sin(t / 500 + m.p);
    g.fillStyle = night ? `rgba(200,255,140,${tw})` : `rgba(255,248,200,${tw * 0.55})`;
    g.fillRect(Math.round(x), Math.round(y), 1, 1);
    if (night) { g.fillStyle = `rgba(200,255,140,${tw * 0.25})`; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
  }
  g.restore();
}

/** Time-of-day grading with multiply (richer than a flat alpha wash) plus a warm/cool lift. */
export function grade(g, date = new Date()) {
  const hr = date.getHours() + date.getMinutes() / 60;
  let mult = null;
  let lift = null;
  if (hr >= 20 || hr < 5.5) { mult = '#7b86c8'; lift = 'rgba(30,40,120,0.12)'; }
  else if (hr >= 18) { mult = '#f0b890'; lift = 'rgba(255,110,40,0.10)'; }
  else if (hr < 7.5) { mult = '#f4d4c0'; lift = 'rgba(255,170,120,0.08)'; }
  if (!mult) return false;
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = mult;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = lift;
  g.fillRect(0, 0, W, H);
  g.restore();
  return hr >= 20 || hr < 5.5;
}
