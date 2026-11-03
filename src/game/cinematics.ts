// Short story cinematics: a full-screen scene drawn on the game canvas, played when a story beat ends.
// Use from an event script with `await api.cinematic('ship_leaves')`. A / B skips.
import { W, H, setRenderer, getRenderer, text } from '../gfx/screen.ts';
import { charSprite } from '../gfx/characters.ts';
import { input } from '../core/input.ts';
import { wait } from '../core/util.ts';
import { sfx } from '../core/audio.ts';
import { fadeOut, fadeIn } from './ui.ts';
import { state } from './state.ts';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const HORIZON = 112;

function sky(g, t: number) {
  const grd = g.createLinearGradient(0, 0, 0, HORIZON);
  grd.addColorStop(0, '#2a3a7a');
  grd.addColorStop(0.7, '#e8806a');
  grd.addColorStop(1, '#f8c070');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, HORIZON);
  g.fillStyle = '#f8e090';
  g.fillRect(392, 82, 24, 24); // low sun
  g.fillStyle = '#f8c070';
  g.fillRect(388, 88, 4, 12); g.fillRect(416, 88, 4, 12);
  const sea = g.createLinearGradient(0, HORIZON, 0, H);
  sea.addColorStop(0, '#5a7ab0');
  sea.addColorStop(1, '#1f3f70');
  g.fillStyle = sea;
  g.fillRect(0, HORIZON, W, H - HORIZON);
  for (let y = HORIZON + 6; y < H; y += 9) { // little waves
    for (let x = ((y * 7) % 31) - 20; x < W; x += 31) {
      const o = Math.round(Math.sin(t / 700 + x * 0.05 + y) * 2);
      g.fillStyle = 'rgba(255,255,255,0.16)';
      g.fillRect(x + o, y, 12 + (y % 5), 1);
    }
  }
}

/** The ferry seen from behind-left, u = size of one pixel; (x, y) = bow-side waterline. */
function ferry(g, x: number, y: number, u: number, alpha: number) {
  g.save();
  g.globalAlpha = alpha;
  const r = (cx, cy, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x + cx * u), Math.round(y + cy * u), Math.max(1, w * u), Math.max(1, h * u)); };
  r(0, -5, 28, 5, '#1f2a5a'); // hull
  r(0, -1, 28, 1, '#c8302a'); // red line
  r(26, -6, 3, 1, '#1f2a5a'); // bow
  r(3, -9, 21, 4, '#f2f2f2'); // deck
  for (let i = 0; i < 8; i++) r(4 + i * 2.5, -8, 1.2, 1.2, '#3a7ad8'); // windows
  r(7, -12, 14, 3, '#e6e6ee'); // upper deck
  r(9, -14, 10, 2, '#d0d4e0'); // bridge
  r(11, -18, 3, 4, '#c8302a'); // funnel
  r(11, -18, 3, 1, '#1a1a24');
  r(0, -4, 28, 0.6, '#101830');
  g.restore();
}

const SCENES: Record<string, { ms: number; draw: (g, t: number, p: number) => void }> = {
  // The China Zorrilla sails away from Fray Bentos' pier and disappears over the horizon.
  ship_leaves: {
    ms: 9000,
    draw(g, t, p) {
      sky(g, t);
      const k = clamp(p / 0.9, 0, 1);
      const u = k < 0.3 ? 4 : k < 0.55 ? 3 : k < 0.8 ? 2 : 1;
      const x = 150 + k * 250, y = 188 - k * 70;
      const a = 1 - clamp((p - 0.82) / 0.16, 0, 1);
      for (let i = 1; i < 7; i++) { // smoke puffs
        g.fillStyle = `rgba(210,210,220,${0.35 * a / i})`;
        g.fillRect(Math.round(x + 12 * u - i * 9 * u * 0.6), Math.round(y - 18 * u - i * 3 * u * 0.4), Math.max(2, 5 * u - i), Math.max(2, 3 * u));
      }
      for (let i = 1; i < 9; i++) { // wake
        g.fillStyle = `rgba(255,255,255,${0.5 * a * (1 - i / 9)})`;
        g.fillRect(Math.round(x - i * 7 * u * 0.55), Math.round(y + (i % 2)), Math.max(2, 6 * u - i), 1);
      }
      ferry(g, x, y, u, a);
      // the pier, seen from where the player stands
      g.fillStyle = '#6a4a2a'; g.fillRect(0, 214, 220, 56);
      g.fillStyle = '#8a6a3a'; for (let x2 = 0; x2 < 220; x2 += 22) g.fillRect(x2, 214, 20, 56);
      g.fillStyle = '#4a3018'; g.fillRect(0, 212, 220, 3); g.fillRect(214, 190, 6, 80);
      g.fillStyle = '#4a3018'; for (const px of [30, 110, 190]) g.fillRect(px, 196, 5, 18);
      g.fillStyle = '#c8ccd8'; g.fillRect(28, 194, 9, 3); // lamp-less rail
      const look = state()?.player?.look ?? 'player_m';
      g.drawImage(charSprite(look, 'up', 0), 0, 0, 16, 17, 96, 168, 48, 51);
      const label = p > 0.12 && p < 0.9 ? 'El China Zorrilla se aleja del puerto…' : p >= 0.9 ? 'No va a volver.' : '';
      if (label) text(g, label, W / 2, 252, { align: 'center', size: 8 });
    },
  },
};

export async function playStoryScene(name: string) {
  const sc = SCENES[name];
  if (!sc) return;
  const prev = getRenderer();
  let skip = false;
  const pop = input.push((a) => { if (a === 'a' || a === 'b') skip = true; });
  await fadeOut(350);
  const t0 = performance.now();
  setRenderer((g) => {
    const t = performance.now() - t0;
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    sc.draw(g, t, clamp(t / sc.ms, 0, 1));
  });
  await fadeIn(450);
  sfx('select');
  while (!skip && performance.now() - t0 < sc.ms) await wait(60);
  await fadeOut(450);
  setRenderer(prev);
  pop();
  await fadeIn(350);
}
