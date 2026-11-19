// Title screen, new-game intro, hall of fame and credits.
import { W, H, W as CW, H as CH, setRenderer, text } from '../gfx/screen.ts';
import { creatureSprite, SPRITE } from '../gfx/creatures.ts';
import { pamperoAt, PAMPERO_W, PAMPERO_H } from '../gfx/pampero.ts';
import { charSprite } from '../gfx/characters.ts';
import { DEX_ORDER, SPECIES, STARTERS } from '../data/species.ts';
import { preloadIntroVfx, drawVfx } from '../gfx/intro-vfx.ts';
import { playMusic, sfx } from '../core/audio.ts';
import { input, keyName } from '../core/input.ts';
import { h, wait, sanitizeName, formatTime } from '../core/util.ts';
import { say, choose, textInput, fadeOut, fadeIn, uiRoot, closeDialog } from './ui.ts';
import { state } from './state.ts';
import { displayName } from './creature.ts';

// ---------------------------------------------------------------- TITLE
function drawSky(g, t) {
  // drawn on the original 320x240 canvas and stretched to the 16:9 one (vector shapes only, so no pixel art gets resampled)
  const W = 320, H = 240;
  g.save();
  g.scale(CW / 320, CH / 240);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#1d2a5c');
  grd.addColorStop(0.45, '#e86a4a');
  grd.addColorStop(0.62, '#f8c070');
  grd.addColorStop(0.63, '#7a5a6a');
  grd.addColorStop(1, '#2a1a3a');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  // Sol de Mayo setting over the river
  const sx = 160, sy = 140;
  g.save(); // the sun stays round: undo the vertical squash of the stretched canvas around its centre
  g.translate(sx, sy); g.scale(1, (CW / 320) / (CH / 240)); g.translate(-sx, -sy);
  g.save();
  g.translate(sx, sy);
  g.rotate(t / 9000);
  g.fillStyle = '#f8d040';
  for (let i = 0; i < 16; i++) {
    g.rotate(Math.PI / 8);
    g.beginPath();
    g.moveTo(-3, -22);
    g.lineTo(0, i % 2 ? -36 : -32);
    g.lineTo(3, -22);
    g.fill();
  }
  g.restore();
  g.fillStyle = '#ffe070';
  g.beginPath(); g.arc(sx, sy, 22, 0, 7); g.fill();
  g.restore();
  // river glints
  g.fillStyle = 'rgba(255,220,150,0.5)';
  for (let i = 0; i < 14; i++) {
    const y = 156 + i * 6;
    const w = 50 - i * 2 + Math.sin(t / 400 + i) * 6;
    g.fillRect(sx - w / 2, y, w, 1);
  }
  // Montevideo skyline (Palacio Salvo, cerro)
  g.fillStyle = '#2a1830';
  g.beginPath();
  g.moveTo(0, 152);
  g.lineTo(0, 130); g.lineTo(20, 126); g.lineTo(40, 112); g.lineTo(58, 126); g.lineTo(70, 130);
  [[74, 118, 10], [86, 110, 8], [96, 122, 12], [110, 100, 10], [122, 116, 8]].forEach(([x, y, w]) => { g.lineTo(x, 152); g.lineTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, 152); });
  g.lineTo(230, 152); g.lineTo(230, 108); g.lineTo(236, 108); g.lineTo(238, 84); g.lineTo(242, 70); g.lineTo(246, 84); g.lineTo(248, 108); g.lineTo(254, 108); g.lineTo(254, 152);
  [[262, 120, 14], [282, 112, 10], [298, 124, 22]].forEach(([x, y, w]) => { g.lineTo(x, 152); g.lineTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, 152); });
  g.lineTo(W, 152);
  g.lineTo(W, 156);
  g.lineTo(0, 156);
  g.fill();
  // stars
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 30; i++) {
    const x = (i * 97) % W;
    const y = (i * 53) % 70;
    if ((Math.floor(t / 500) + i) % 7) g.fillRect(x, y, 1, 1);
  }
  g.restore();
}

/**
 * A trail of glitter left behind a moving point: `at(time)` gives where the tail was at that time (or null).
 * Older sparkles are smaller, fainter and drift down a little, and each one twinkles on its own beat.
 */
function glitter(g, t, at, count = 36, gap = 36) {
  const COLS = ['#fff8c0', '#ffe45c', '#bfe8ff', '#ffffff'];
  for (let i = 1; i <= count; i++) {
    const pt = at(t - i * gap);
    if (!pt) continue;
    const fade = 1 - i / (count + 1);
    const n1 = Math.sin(i * 12.9898) * 43758.5453, n2 = Math.sin(i * 78.233) * 12345.6789;
    const jx = (n1 - Math.floor(n1) - 0.5) * 10, jy = (n2 - Math.floor(n2) - 0.5) * 12 + i * 0.35;
    const tw = 0.55 + 0.45 * Math.sin(t / 90 + i * 1.7);
    g.globalAlpha = Math.max(0, Math.min(1, fade * 1.2 * tw));
    g.fillStyle = COLS[i % COLS.length];
    const x = Math.round(pt.x + jx), y = Math.round(pt.y + jy);
    if (i % 2 === 0 && fade > 0.25) { g.fillRect(x - 2, y, 5, 1); g.fillRect(x, y - 2, 1, 5); g.fillRect(x - 1, y - 1, 3, 3); } // little star
    else g.fillRect(x, y, fade > 0.5 ? 3 : 2, fade > 0.5 ? 3 : 2);
  }
  g.globalAlpha = 1;
}

/** Draws a sprite with its wings beating: columns away from the body swing up and down with the flap phase. */
export function titleRenderer(g, t) {
  drawSky(g, t);
  text(g, 'Poke Uruguay', W / 2, 52, { size: 20, align: 'center', color: '#fff', shadow: '#1d2a5c' });
  text(g, 'La tierra de los charrúas', W / 2, 92, { size: 10, align: 'center', color: '#f8d040', shadow: '#2a1830' });
  // The Pampero crosses in front of the title from left to right, facing where it is going, leaving glitter behind.
  const pos = (tt) => ({ x: ((tt / 14) % (W + 260)) - 130, y: 24 + Math.sin(tt / 500) * 8 });
  const here = pos(t);
  const tw = PAMPERO_W, th = PAMPERO_H; // native size: no resampling
  glitter(g, t, (tt) => { const q = pos(tt); return q.x <= here.x ? { x: q.x + 8, y: q.y + th * 0.52 } : null; });
  g.globalAlpha = 0.9;
  g.save();
  g.translate(here.x + tw, here.y);
  g.scale(-1, 1); // the sprite faces left; flip it to face right
  g.drawImage(pamperoAt(t, 620), 0, 0, tw, th);
  g.restore();
  g.globalAlpha = 1;
  // starters parade on the shore
  const keys = ['ceibito', 'tejuchispa', 'carpinchito'];
  keys.forEach((k, i) => {
    const bob = Math.round(Math.sin(t / 260 + i) * 2);
    g.drawImage(creatureSprite(k), Math.round(W / 2 - 40 + (i - 1) * 96), 162 + bob, 80, 80); // native 80x80, centred
  });
}

export function startTitle() {
  setRenderer(titleRenderer);
  playMusic('title');
}


// ---------------------------------------------------------------- INTRO CINEMATIC
// Seven short scenes told like a tale by the fire. Pixel art stays at native size; the effects
// (fire, splash, lightning, wind, light beams, petals, embers, bubbles, title burst) are PixelLab VFX sheets.
const sky = (g, stops) => {
  const grd = g.createLinearGradient(0, 0, 0, H);
  stops.forEach(([o, c]) => grd.addColorStop(o, c));
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
};
const stars = (g, t, n = 70, maxY = 130) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = (Math.floor(t / 400) + i) % 5 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)';
    const n1 = Math.sin(i * 12.9898) * 43758.5453, n2 = Math.sin(i * 78.233) * 12345.6789; // scattered, not in rows
    g.fillRect(Math.floor((n1 - Math.floor(n1)) * W), 14 + Math.floor((n2 - Math.floor(n2)) * (maxY - 14)), i % 7 ? 1 : 2, i % 7 ? 1 : 2);
  }
};
/** Rolling hills drawn as a sine silhouette; `speed` scrolls it for parallax. */
const hills = (g, t, y, amp, col, speed, wl = 90) => {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) g.lineTo(x, y + Math.sin((x + t * speed) / wl * Math.PI * 2) * amp + Math.sin((x + t * speed) / (wl * 0.37)) * amp * 0.3);
  g.lineTo(W, H);
  g.fill();
};
const ceibo = (g, x, y, s = 1) => {
  g.fillStyle = '#1a2a1a'; g.fillRect(x - 1 * s, y - 14 * s, 2 * s, 14 * s);
  g.beginPath(); g.arc(x, y - 16 * s, 8 * s, 0, 7); g.fill();
  g.fillStyle = '#e0263a'; for (const [dx, dy] of [[-4, -18], [3, -20], [0, -14], [5, -15]]) g.fillRect(x + dx * s, y + dy * s, 2 * s, 2 * s);
};
/** A big ombú seen against the sky: thick twisted trunk and a wide round crown. */
const ombu = (g, x, y, col) => {
  g.fillStyle = col;
  g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x - 10, y - 40); g.lineTo(x - 16, y - 58); g.lineTo(x + 14, y - 58); g.lineTo(x + 8, y - 40); g.lineTo(x + 24, y); g.fill();
  for (const [dx, dy, r] of [[-38, -70, 24], [-8, -84, 30], [28, -72, 26], [52, -60, 16], [-58, -58, 14], [6, -60, 22]]) { g.beginPath(); g.arc(x + dx, y + dy, r, 0, 7); g.fill(); }
};
/** Drifting fog: soft bands that slide sideways; `a` is how thick it is (0..1). */
const fogBands = (g, t, a, top = 120, col = '200,205,220') => {
  if (a <= 0) return;
  for (let i = 0; i < 7; i++) {
    const y = top + i * 18;
    const x = ((t / (30 + i * 9)) * (i % 2 ? 1 : -1)) % 160;
    g.fillStyle = `rgba(${col},${(0.16 + i * 0.03) * a})`;
    for (let k = -1; k < 5; k++) { g.beginPath(); g.ellipse(x + k * 160, y, 110, 14 + (i % 3) * 3, 0, 0, 7); g.fill(); }
  }
};
const fireflies = (g, t, n = 14) => {
  for (let i = 0; i < n; i++) {
    const on = Math.sin(t / 380 + i * 2.3) > 0.2;
    if (!on) continue;
    const x = Math.round((i * 131 + Math.sin(t / 1300 + i) * 18) % W), y = Math.round(120 + ((i * 47) % 80) + Math.cos(t / 900 + i) * 6);
    g.fillStyle = '#f2ff8a'; g.fillRect(x, y, 2, 2);
    g.fillStyle = 'rgba(242,255,138,0.25)'; g.fillRect(x - 1, y - 1, 4, 4);
  }
};
/** A creature sprite with a colour laid over its pixels (firelight, dusk, fog silhouettes). Cached. */
const tintCache = new Map();
function tinted(key, col, a) {
  const ck = `${key}|${col}|${a}`;
  if (tintCache.has(ck)) return tintCache.get(ck);
  const c = document.createElement('canvas');
  c.width = SPRITE; c.height = SPRITE;
  const x = c.getContext('2d');
  x.drawImage(creatureSprite(key), 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = a;
  x.fillStyle = col;
  x.fillRect(0, 0, SPRITE, SPRITE);
  tintCache.set(ck, c);
  return c;
}
/** Draws an 80x80 creature with its feet at (cx, feet); `flip` turns it to face right. */
const mon = (g, img, cx, feet, flip = false) => {
  const x = Math.round(cx - SPRITE / 2), y = Math.round(feet - SPRITE + 4);
  if (!flip) { g.drawImage(img, x, y); return; }
  g.save(); g.translate(x + SPRITE, y); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore();
};
const lerpCol = (a, b, k) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
/** The Cardenal Azul flying to the right at native size, leaving glitter behind. */
function cardenal(g, t, path) {
  const here = path(t);
  if (!here) return;
  glitter(g, t, (tt) => { const q = path(tt); return q && q.x <= here.x ? { x: q.x + 8, y: q.y + PAMPERO_H * 0.52 } : null; }, 30, 45);
  g.save();
  g.translate(Math.round(here.x) + PAMPERO_W, Math.round(here.y));
  g.scale(-1, 1); // the sprite faces left; flip it to face right
  g.drawImage(pamperoAt(t, 620), 0, 0, PAMPERO_W, PAMPERO_H);
  g.restore();
}
const flash = (g, a) => { if (a > 0) { g.fillStyle = `rgba(230,240,255,${Math.min(0.75, a)})`; g.fillRect(0, 0, W, H); } };

const STARTER_FX = { ceibito: 'petalos', tejuchispa: 'brasas', carpinchito: 'burbujas' };
const STARTER_CUE = [600, 2100, 3600];
type Cue = [number, () => void];

const CINEMATIC = [
  { // 1. The tale by the fire
    dur: 7000,
    lines: ['Junto al fogón, los viejos todavía cuentan', 'la historia de la tierra de los charrúas.'],
    draw(g, t, p, el) {
      sky(g, [[0, '#05071a'], [0.65, '#141c48'], [1, '#2a2350']]);
      stars(g, t);
      hills(g, 0, 176, 6, '#0b1030', 0, 160);
      ombu(g, 392, 200, '#070a1e');
      hills(g, 0, 198, 3, '#060818', 0, 120);
      const fx = 240, fy = 202;
      const fl = 0.85 + Math.sin(t / 90) * 0.06 + Math.sin(t / 37) * 0.04;
      const glow = g.createRadialGradient(fx, fy - 10, 4, fx, fy - 10, 120 * fl);
      glow.addColorStop(0, 'rgba(255,170,70,0.55)'); glow.addColorStop(0.5, 'rgba(255,110,40,0.18)'); glow.addColorStop(1, 'rgba(255,90,30,0)');
      g.fillStyle = glow; g.fillRect(0, 60, W, H - 60);
      mon(g, tinted('hornerito', '#ff9a40', 0.28), 150, fy, true);
      mon(g, tinted('mulitin', '#ff9a40', 0.28), 330, fy);
      mon(g, tinted('teruterito', '#2a1a40', 0.45), 92, fy - 6, true);
      g.fillStyle = '#2a1408'; g.fillRect(fx - 16, fy - 2, 32, 4); g.fillStyle = '#4a2810'; g.fillRect(fx - 12, fy - 4, 10, 3); g.fillRect(fx + 3, fy - 4, 10, 3);
      drawVfx(g, 'fogon', fx, fy, el);
      fireflies(g, t, 10);
    },
  },
  { // 2. Cuchillas, streams and open sky
    dur: 7000,
    lines: ['Una tierra de cuchillas, arroyos y cielo abierto,', 'donde las criaturas viven junto a la gente.'],
    draw(g, t, p, el) {
      sky(g, [[0, '#3a84d8'], [0.7, '#bfe4f8'], [1, '#e8f4d0']]);
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (const [x, y, r] of [[40, 40, 14], [190, 26, 11], [330, 50, 16], [440, 30, 10]]) { const cx = (x + t / 60) % (W + 60) - 30; g.beginPath(); g.arc(cx, y, r, 0, 7); g.arc(cx + r, y + 3, r * 0.8, 0, 7); g.arc(cx - r, y + 3, r * 0.7, 0, 7); g.fill(); }
      hills(g, t, 128, 14, '#86c46a', 0.01, 200);
      hills(g, t, 158, 10, '#5aa046', 0.02, 150);
      g.fillStyle = '#5ab0e8'; g.fillRect(0, 186, W, 5); g.fillStyle = '#a8e0ff'; for (let i = 0; i < 10; i++) g.fillRect(((i * 53 + t / 20) % W), 187, 8, 1);
      hills(g, t, 200, 6, '#3a8038', 0.04, 110);
      ceibo(g, 70, 196, 2);
      drawVfx(g, 'petalos', 70, 150, el, { alpha: 0.9 });
      ceibo(g, 420 - p * 10, 172, 1.2);
      const run = W + 80 - ((el / 9) % (W + 160));
      for (let i = 1; i <= 4; i++) { g.fillStyle = `rgba(216,196,150,${0.5 - i * 0.1})`; g.beginPath(); g.arc(run + 18 + i * 12, 205 - (i % 2) * 2, 4 + i, 0, 7); g.fill(); }
      mon(g, creatureSprite('nandulin'), run, 210 - Math.round(Math.abs(Math.sin(el / 110)) * 4));
      mon(g, creatureSprite('teruterito'), ((el / 14) % (W + 120)) - 60, 110 + Math.round(Math.sin(t / 400) * 8), true);
      mon(g, creatureSprite('carpincho'), 300, 214);
    },
  },
  { // 3. The coast and the Ballenaplata
    dur: 7000,
    lines: ['En sus costas canta la Ballenaplata,', 'y su canto aplaca las tormentas del Plata.'],
    cues: [[1150, () => sfx('splash')], [4300, () => sfx('splash')]],
    draw(g, t, p, el) {
      const wl = 150;
      sky(g, [[0, '#2a3a7a'], [0.42, '#e86a4a'], [0.55, '#f8c070'], [0.556, '#2a6ab0'], [1, '#123a68']]);
      g.fillStyle = '#ffe070'; g.beginPath(); g.arc(360, wl - 4 - p * 10, 22, Math.PI, 0); g.fill();
      for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(255,224,150,${0.5 - i * 0.025})`; const w = 40 - i * 1.6 + Math.sin(t / 300 + i) * 5; g.fillRect(360 - w / 2, wl + 2 + i * 5, w, 1); }
      g.fillStyle = 'rgba(255,255,255,0.14)';
      for (let i = 0; i < 16; i++) g.fillRect((i * 61 + t / 30) % W, wl + 8 + (i * 17) % 60, 18, 1);
      g.fillStyle = '#1a2440'; g.beginPath(); g.moveTo(0, wl); g.lineTo(0, wl - 10); g.lineTo(30, wl - 16); g.lineTo(60, wl - 8); g.lineTo(80, wl); g.fill(); // point on the coast
      // the whale rises out of the water: the part under the surface is hidden
      const wx = 170;
      const rise = Math.min(1, Math.max(0, (el - 900) / 900)) - Math.max(0, (el - 3800) / 600);
      const wy = Math.round(wl + 30 - rise * 66 + Math.sin(t / 500) * 2);
      g.save(); g.beginPath(); g.rect(0, 0, W, wl + 6); g.clip();
      g.drawImage(creatureSprite('ballenaplata'), wx - 40, wy - 40);
      g.restore();
      if (rise > 0.9 && Math.floor(t / 900) % 2) { g.fillStyle = 'rgba(220,240,255,0.85)'; g.fillRect(wx - 20, wy - 46, 2, 8); g.fillRect(wx - 22, wy - 50, 6, 3); }
      drawVfx(g, 'splash', wx, wl + 4, el - 1150);
      drawVfx(g, 'splash', wx, wl + 4, el - 4300);
      mon(g, creatureSprite('mbigua'), 460 - Math.round(el / 22), 92 + Math.round(Math.sin(t / 350) * 5), true);
    },
  },
  { // 4. The Cardenal Azul brings the pampero
    dur: 8000,
    lines: ['Cuando el Cardenal Azul cruza el cielo, sopla el pampero', 'y la niebla se retira de los campos.'],
    cues: [[2700, () => sfx('crit')], [4400, () => sfx('crit')], [5200, () => sfx('levelup')]],
    draw(g, t, p, el) {
      const clear = Math.max(0, Math.min(1, (el - 5000) / 1800));
      sky(g, [[0, lerpCol('#141a30', '#3a84d8', clear)], [0.55, lerpCol('#3a4466', '#9ad0f0', clear)], [1, lerpCol('#5a5a6a', '#d8f0e0', clear)]]);
      g.fillStyle = `rgba(30,34,56,${0.92 * (1 - clear)})`;
      for (let i = 0; i < 12; i++) { const x = (i * 47 + t / 25) % (W + 80) - 40 - clear * 60 * (i % 2 ? 1 : -1); g.beginPath(); g.arc(x, 24 + (i % 3) * 16 - clear * 40, 28, 0, 7); g.arc(x + 26, 30 + (i % 3) * 16 - clear * 40, 22, 0, 7); g.fill(); }
      if (clear < 1) { g.fillStyle = `rgba(170,190,230,${0.45 * (1 - clear)})`; for (let i = 0; i < 60; i++) g.fillRect((i * 37 + t / 3) % W, (i * 71 + t / 1.5) % H, 1, 6); }
      hills(g, t, 172, 8, lerpCol('#1a2030', '#5aa046', clear), 0.01, 160);
      hills(g, t, 196, 6, lerpCol('#121828', '#3a8038', clear), 0.02, 110);
      fogBands(g, t, 1 - Math.min(1, el / 5600), 150);
      drawVfx(g, 'rayo', 120, 196, (el - 2200) / 2.5); // played slower than authored so the strike reads in a cinematic
      drawVfx(g, 'rayo', 370, 192, (el - 3900) / 2.5);
      const fa = Math.max(0, 1 - Math.abs(el - 2750) / 260) + Math.max(0, 1 - Math.abs(el - 4450) / 260);
      flash(g, fa * 0.6);
      cardenal(g, t, (tt) => { const e = el - (t - tt); if (e < 0) return null; const k = Math.min(1, e / 5200); return { x: -120 + k * 300 + Math.max(0, e - 5200) / 12, y: 70 - k * 20 + Math.sin(tt / 300) * 5 }; });
      drawVfx(g, 'viento', 240, 120, el, { alpha: 0.4 + clear * 0.5 });
    },
  },
  { // 5. But it has not flown for a long time
    dur: 7000,
    lines: ['Pero hace tiempo que nadie lo ve volar,', 'y una niebla espesa se queda sobre el país.'],
    draw(g, t, p, el) {
      sky(g, [[0, '#2a2a46'], [0.6, '#6a5a78'], [1, '#8a8090']]);
      g.fillStyle = 'rgba(255,220,180,0.35)'; g.beginPath(); g.arc(120, 120, 16, 0, 7); g.fill();
      hills(g, 0, 150, 10, '#4a4a60', 0, 190);
      hills(g, 0, 178, 7, '#3a3a50', 0, 140);
      const thick = Math.min(1, 0.3 + p * 0.9);
      mon(g, tinted('venadito', '#3a3a50', 0.4 + thick * 0.4), 150, 196);
      mon(g, tinted('zorrigris', '#3a3a50', 0.4 + thick * 0.4), 330, 204, true);
      hills(g, 0, 202, 4, '#2a2a3a', 0, 100);
      fogBands(g, t, thick, 96, '190,186,200');
      g.fillStyle = `rgba(170,166,184,${0.35 * thick})`; g.fillRect(0, 0, W, H);
    },
  },
  { // 6. Three creatures wait in Carmelo
    dur: 8500,
    lines: ['En Carmelo, el Maestro Tabárez cuida a tres criaturas', 'que esperan a quien se anime a recorrer el Uruguay.'],
    cues: STARTER_CUE.map((ms): Cue => [ms, () => sfx('confirm')]),
    draw(g, t, p, el) {
      sky(g, [[0, '#120e2a'], [0.6, '#2a1f4a'], [1, '#4a2f3a']]);
      g.save(); g.translate(W / 2, 150); g.rotate(t / 12000); g.fillStyle = 'rgba(248,208,64,0.07)';
      for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.beginPath(); g.moveTo(-10, -30); g.lineTo(0, -260); g.lineTo(10, -30); g.fill(); }
      g.restore();
      STARTERS.forEach((k, i) => {
        const x = 140 + i * 100, feet = 196;
        g.fillStyle = '#3a2a40'; g.beginPath(); g.ellipse(x, feet + 2, 30, 7, 0, 0, 7); g.fill();
        g.fillStyle = '#5a4060'; g.beginPath(); g.ellipse(x, feet, 26, 5, 0, 0, 7); g.fill();
        const since = el - STARTER_CUE[i];
        if (since > 250) {
          drawVfx(g, STARTER_FX[k], x, k === 'ceibito' ? feet - 40 : feet, since);
          const bob = Math.round(Math.sin(t / 260 + i) * 2);
          const a = Math.min(1, (since - 250) / 300);
          g.globalAlpha = a;
          mon(g, creatureSprite(k), x, feet + bob);
          g.globalAlpha = 1;
        }
        drawVfx(g, 'solbeam', x, feet + 4, since);
      });
    },
  },
  { // 7. Title
    dur: 5200,
    lines: [],
    cues: [[250, () => sfx('levelup')]],
    draw(g, t, p, el) {
      sky(g, [[0, '#1d2a5c'], [0.5, '#e86a4a'], [1, '#f8d070']]);
      const sy = 196 - Math.round(Math.min(1, el / 2500) * 16); // the Sol de Mayo rises behind the hills
      g.save(); g.translate(W / 2, sy); g.rotate(t / 9000); g.fillStyle = 'rgba(248,208,64,0.6)';
      for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.beginPath(); g.moveTo(-6, -40); g.lineTo(0, i % 2 ? -170 : -140); g.lineTo(6, -40); g.fill(); }
      g.restore();
      g.fillStyle = '#ffe070'; g.beginPath(); g.arc(W / 2, sy, 38, 0, 7); g.fill();
      hills(g, 0, 214, 5, '#2a1830', 0, 140);
      drawVfx(g, 'estallido', W / 2, 70, el - 200);
      drawVfx(g, 'estallido', 110, 56, el - 800);
      drawVfx(g, 'estallido', 370, 62, el - 1300);
      const a = Math.min(1, Math.max(0, (el - 250) / 600));
      g.globalAlpha = a;
      text(g, 'Poke Uruguay', W / 2, 62, { size: 20, align: 'center', color: '#fff', shadow: '#1d2a5c' });
      text(g, 'La tierra de los charrúas', W / 2, 98, { size: 10, align: 'center', color: '#fff6c0', shadow: '#2a1830' });
      g.globalAlpha = 1;
      cardenal(g, t, (tt) => { const e = el - (t - tt); if (e < 0) return null; return { x: -120 + e / 8, y: 118 + Math.sin(tt / 400) * 6 }; });
    },
  },
];

async function playCinematic() {
  preloadIntroVfx();
  let idx = 0;
  let start = performance.now();
  let skipAll = false;
  setRenderer((g, t) => {
    const sc = CINEMATIC[Math.min(idx, CINEMATIC.length - 1)];
    const el = Math.min(sc.dur, performance.now() - start);
    const p = Math.min(1, el / sc.dur);
    g.imageSmoothingEnabled = false;
    sc.draw(g, t, p, el);
    if (sc.lines.length) {
      const a = Math.min(1, el / 700) * Math.min(1, (sc.dur - el) / 500 + 0.4);
      g.fillStyle = `rgba(8,8,24,${0.62 * a})`; g.fillRect(0, H - 52, W, 52);
      g.globalAlpha = a;
      sc.lines.forEach((ln, i) => text(g, ln, W / 2, H - 42 + i * 16, { size: 7, align: 'center', color: '#fff' }));
      g.globalAlpha = 1;
    }
    // letterbox + fades
    g.fillStyle = '#000'; g.fillRect(0, 0, W, 14);
    const fade = Math.max(1 - el / 500, (el - (sc.dur - 500)) / 500, 0);
    if (fade > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; g.fillRect(0, 0, W, H); }
    text(g, `${keyName('a')}: pasar   ${keyName('b')}: saltar`, W - 6, 3, { size: 6, align: 'right', color: '#9aa0c0', shadow: null });
  });
  await fadeIn(350);
  const off = input.push((a) => {
    if (a === 'b' || a === 'start') skipAll = true;
    else if (a === 'a') { start = performance.now() - CINEMATIC[idx].dur; }
  });
  for (idx = 0; idx < CINEMATIC.length && !skipAll; idx++) {
    start = performance.now();
    const cues: Cue[] = [...((CINEMATIC[idx] as any).cues ?? [])];
    while (!skipAll && performance.now() - start < CINEMATIC[idx].dur) {
      const el = performance.now() - start;
      while (cues.length && el >= cues[0][0]) { const [ms, fn] = cues.shift(); if (el - ms < 400) fn(); } // a skipped scene stays silent
      await wait(30);
    }
  }
  off();
  idx = CINEMATIC.length - 1;
  await fadeOut(350);
}

// ---------------------------------------------------------------- INTRO
export async function newGameIntro() {
  await playCinematic();
  let showProf = true;
  let mon = null;
  setRenderer((g, t) => {
    // Laboratory: wall with shelves, wooden floor
    g.fillStyle = '#e6d8b8'; g.fillRect(0, 0, W, 150);
    g.fillStyle = '#a87a4a'; g.fillRect(0, 150, W, H - 150);
    g.fillStyle = '#8a5a2a'; for (let y = 156; y < H; y += 14) g.fillRect(0, y, W, 2);
    g.fillStyle = '#6a4020'; g.fillRect(0, 144, W, 6);
    for (const x of [14, 226]) {
      g.fillStyle = '#6a4020'; g.fillRect(x, 24, 80, 76);
      for (const y of [30, 58, 86]) { g.fillStyle = '#3a2010'; g.fillRect(x + 4, y + 18, 72, 3); for (let b = 0; b < 8; b++) { g.fillStyle = ['#c83a3a', '#3a7ad8', '#4a9a4a', '#f2c02a'][(b + y) % 4]; g.fillRect(x + 6 + b * 9, y, 7, 18); } }
    }
    g.fillStyle = '#8ac8f0'; g.fillRect(124, 20, 72, 52); g.fillStyle = '#5a4a3a'; g.fillRect(122, 18, 76, 3); g.fillRect(122, 71, 76, 3); g.fillRect(122, 18, 3, 56); g.fillRect(195, 18, 3, 56); g.fillRect(158, 18, 4, 56);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(128, 24, 12, 4);
    if (showProf) g.drawImage(charSprite('prof', 'down', 0), 0, 0, 16, 17, 112, 52, 96, 102);
    if (mon) g.drawImage(creatureSprite(mon), 210, 80 + Math.sin(t / 300) * 2, 80, 80);
  });
  playMusic('town');
  await fadeIn(400);
  await say(['Bienvenido al mundo de Poke Uruguay.', 'Soy el Maestro Tabárez. Dirigí a la selección durante años y hoy me dedico a estudiar a las criaturas de este país.'], { name: 'Maestro Tabárez' });
  mon = 'carpincho';
  sfx('confirm');
  await say(['En este país conviven personas y criaturas.', 'Algunas nadan en el Río de la Plata, otras recorren las praderas o vuelan sobre las sierras.',
    'La gente trabaja con ellas, las entrena y, a veces, combate con ellas.'], { name: 'Maestro Tabárez' });
  mon = null;
  await say('Ahora hablemos de vos. ¿Cómo te presentás?', { name: 'Maestro Tabárez', keep: true });
  const look = await choose(['Hombre', 'Mujer'], { cancel: false });
  closeDialog();
  const S = state();
  S.player.look = look === 0 ? 'player_m' : 'player_f';
  const raw = await textInput('¿Cómo te llamás? (máx. 10 letras)', '', 'Tu nombre');
  S.player.name = sanitizeName(raw, look === 0 ? 'Bruno' : 'Martina');
  await say(`Así que te llamás {player}. Un gusto.`, { name: 'Maestro Tabárez' });
  await say('Este es mi nieto. Compite con vos desde que eran niños. ¿Cómo se llamaba?', { name: 'Maestro Tabárez', keep: true });
  const rawR = await textInput('Nombre de tu rival', '', 'Nombre del rival');
  S.rivalName = sanitizeName(rawR, 'Facu');
  await say(['Claro, {rival}. Cómo me pude olvidar.', '{player}, tu propia historia está por empezar.', 'Un camino largo te espera por todo el Uruguay. Vamos.'], { name: 'Maestro Tabárez' });
  await fadeOut(500);
}

// ---------------------------------------------------------------- HALL OF FAME
export async function hallOfFame() {
  const S = state();
  playMusic('victory');
  let shown = 0;
  setRenderer((g, t) => {
    g.fillStyle = '#1d2a5c';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = ['#f8d040', '#7ac8f0', '#ffffff'][i % 3];
      g.fillRect((i * 53 + t / 20) % W, (i * 31 + t / 12) % H, 2, 2);
    }
    text(g, 'SALÓN DE LA FAMA', W / 2, 14, { size: 12, align: 'center', color: '#f8d040' });
    S.party.slice(0, shown).forEach((c, i) => {
      const x = 20 + (i % 3) * 100;
      const y = 40 + Math.floor(i / 3) * 96;
      g.drawImage(creatureSprite(c.species), x, y, 80, 80);
      text(g, displayName(c), x + 36, y + 74, { size: 6, align: 'center' });
      text(g, `Nv${c.level}`, x + 36, y + 84, { size: 6, align: 'center', color: '#f8d040' });
    });
    text(g, `${S.player.name} · ${formatTime(S.stats.playtime)}`, W / 2, 226, { size: 7, align: 'center' });
  });
  for (shown = 1; shown <= S.party.length; shown++) {
    sfx('confirm');
    await wait(700);
  }
  await wait(1500);
  await input.waitFor(['a', 'b', 'start']);
}

// ---------------------------------------------------------------- CREDITS
const CREDITS = [
  ['Poke Uruguay', 'La tierra de los charrúas'],
  ['Una aventura por el Uruguay', ''],
  ['Diseño y programación', 'Hecho con Claude para Dusius'],
  ['Lugares', 'Carmelo · Colonia · Montevideo · Maldonado'],
  ['', 'Cabo Polonio · Ruta 8 · Quebrada de los Cuervos'],
  ['Criaturas', '42 especies originales'],
  ['', 'inspiradas en la fauna oriental'],
  ['Música', 'Chiptune generado con Web Audio'],
  ['', 'con ritmo de candombe'],
  ['Arte', 'Pixel art procedural en Canvas'],
  ['Gracias', 'a los teros, horneros y carpinchos'],
  ['', 'por la inspiración'],
  ['Y a vos', 'por jugar'],
  ['¡Tu aventura continúa!', 'Hay criaturas legendarias esperándote…'],
];

export async function credits() {
  playMusic('credits');
  const lineH = 54;
  const total = CREDITS.length * lineH + H + 40;
  let scroll = 0;
  let speed = 1;
  const pop = input.push((a) => { if (a === 'a') speed = speed === 1 ? 4 : 1; });
  const parade = DEX_ORDER.filter((k) => !SPECIES[k].legendary);
  setRenderer((g, t) => {
    drawSky(g, t);
    g.fillStyle = 'rgba(10,10,30,0.55)';
    g.fillRect(0, 0, W, H);
    const y0 = H - scroll;
    CREDITS.forEach(([a, b], i) => {
      const y = y0 + i * lineH;
      if (y < -40 || y > H + 20) return;
      text(g, a, W / 2, y, { size: 10, align: 'center', color: '#f8d040' });
      if (b) text(g, b, W / 2, y + 16, { size: 7, align: 'center' });
    });
    const k = parade[Math.floor(t / 1200) % parade.length];
    g.drawImage(creatureSprite(k), W - 90, H - 86, 80, 80);
  });
  await new Promise((res) => {
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      scroll += ((now - last) / 40) * speed;
      last = now;
      if (scroll > total) return res(undefined);
      requestAnimationFrame(tick);
    };
    tick();
  });
  pop();
  setRenderer((g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    text(g, 'FIN', W / 2, H / 2 - 20, { size: 20, align: 'center' });
    text(g, '…¿o no?', W / 2, H / 2 + 12, { size: 8, align: 'center', color: '#f8d040' });
  });
  await wait(1200);
  await input.waitFor(['a', 'b', 'start']);
  await fadeOut(400);
}

export function creditsFromTitle() {
  return credits();
}

export function slotCard(s) {
  return h('div', { class: 'slot-card' },
    h('b', { text: s.summary.name }),
    h('span', { text: `${s.summary.location}` }),
    h('span', { text: `Medallas ${s.summary.badges} · PokeDex ${s.summary.dex} · ${formatTime(s.summary.playtime)}` }),
    s.summary.champion ? h('span', { class: 'champ', text: '★ Campeón' }) : null);
}

export { uiRoot, SPRITE };
