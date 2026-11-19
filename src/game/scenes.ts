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
// A short cinematic (about 14 s) that opens the game. The creatures are the game's own sprites,
// animated frame by frame with PixelLab (anim_* sheets); splash, lightning, light beam and the title
// burst are PixelLab VFX. Camera pans, cuts, shake and light are code. Pixel art stays at native size.
const sky = (g, stops) => {
  const grd = g.createLinearGradient(0, 0, 0, H);
  stops.forEach(([o, c]) => grd.addColorStop(o, c));
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
};
/** Rolling hills drawn as a sine silhouette; `scroll` moves it sideways for parallax. */
const hills = (g, scroll, y, amp, col, wl = 90) => {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) g.lineTo(x, y + Math.sin((x + scroll) / wl * Math.PI * 2) * amp + Math.sin((x + scroll) / (wl * 0.37)) * amp * 0.3);
  g.lineTo(W, H);
  g.fill();
};
const ceibo = (g, x, y, s = 1) => {
  g.fillStyle = '#1a2a1a'; g.fillRect(x - 1 * s, y - 14 * s, 2 * s, 14 * s);
  g.beginPath(); g.arc(x, y - 16 * s, 8 * s, 0, 7); g.fill();
  g.fillStyle = '#e0263a'; for (const [dx, dy] of [[-4, -18], [3, -20], [0, -14], [5, -15]]) g.fillRect(x + dx * s, y + dy * s, 2 * s, 2 * s);
};
const lerpCol = (a, b, k) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { const k = clamp01(v); return k * k * (3 - 2 * k); };
/** The Cardenal Azul's flight frames, flying to the right with glitter behind (title shot). */
function cardenalFlight(g, t, path) {
  const here = path(t);
  if (!here) return;
  glitter(g, t, (tt) => { const q = path(tt); return q && q.x <= here.x ? { x: q.x + 8, y: q.y + PAMPERO_H * 0.52 } : null; }, 30, 45);
  g.save();
  g.translate(Math.round(here.x) + PAMPERO_W, Math.round(here.y));
  g.scale(-1, 1); // the sprite faces left; flip it to face right
  g.drawImage(pamperoAt(t, 620), 0, 0, PAMPERO_W, PAMPERO_H);
  g.restore();
}

type Cue = [number, () => void];
interface Shot { dur: number; cues?: Cue[]; draw: (g: CanvasRenderingContext2D, t: number, e: number) => void }
const STARTER_X = [150, 240, 330];
const STARTER_CUE = [250, 850, 1450];

const SHOTS: Shot[] = [
  { // 1. Dawn on the cuchillas: the ñandú runs past while the camera pans
    dur: 2900,
    draw(g, t, e) {
      const cam = e * 0.05;
      sky(g, [[0, '#2a3a7a'], [0.45, '#e8806a'], [0.7, '#f8d090'], [1, '#f8e8c0']]);
      g.fillStyle = '#fff0b0'; g.beginPath(); g.arc(380 - cam * 0.1, 128, 20, 0, 7); g.fill();
      hills(g, cam * 0.3, 124, 12, '#9ac080', 220);
      hills(g, cam * 0.6, 152, 10, '#6aa452', 160);
      ceibo(g, Math.round(330 - cam * 0.6), 160, 1.4);
      hills(g, cam * 1.2, 186, 7, '#4a8a3c', 110);
      const x = W + 50 - e * 0.21;
      for (let i = 1; i <= 5; i++) { // dust kicked up behind it
        const a = 0.45 - i * 0.08; if (a <= 0) continue;
        g.fillStyle = `rgba(222,200,150,${a})`; g.beginPath(); g.arc(x + 14 + i * 11, 210 - (i % 2) * 3 - i, 3 + i, 0, 7); g.fill();
      }
      drawVfx(g, 'anim_nandulin', x, 214, e);
      g.fillStyle = '#2e6a2a'; // foreground grass passing fast
      for (let i = 0; i < 18; i++) { const gx = Math.round(((i * 53 - cam * 3) % (W + 40) + W + 40) % (W + 40)) - 20; g.fillRect(gx, 222, 2, 8); g.fillRect(gx + 3, 225, 2, 5); g.fillRect(gx - 3, 226, 2, 4); }
      g.fillRect(0, 230, W, H - 230);
    },
  },
  { // 2. The coast at sunset: the Ballenaplata swims and surfaces
    dur: 3000,
    cues: [[1500, () => sfx('splash')]],
    draw(g, t, e) {
      const wl = 160;
      sky(g, [[0, '#2a3a7a'], [0.42, '#e86a4a'], [0.58, '#f8c070'], [0.593, '#2a6ab0'], [1, '#123a68']]);
      g.fillStyle = '#ffe070'; g.beginPath(); g.arc(380, wl - 2, 24, Math.PI, 0); g.fill();
      for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(255,224,150,${0.5 - i * 0.025})`; const w = 44 - i * 1.6 + Math.sin(t / 300 + i) * 5; g.fillRect(380 - w / 2, wl + 2 + i * 5, w, 1); }
      g.fillStyle = 'rgba(255,255,255,0.16)';
      for (let i = 0; i < 18; i++) g.fillRect((i * 61 + t / 30) % W, wl + 8 + (i * 17) % 70, 18, 1);
      g.fillStyle = '#1a2440'; g.beginPath(); g.moveTo(0, wl); g.lineTo(0, wl - 12); g.lineTo(36, wl - 18); g.lineTo(70, wl - 8); g.lineTo(94, wl); g.fill();
      const x = 150 + e * 0.035;
      const rise = ease((e - 1100) / 600);
      const feet = Math.round(wl + 62 - rise * 50 + Math.sin(t / 420) * 2);
      g.save(); g.beginPath(); g.rect(0, 0, W, wl + 4); g.clip(); // what is under the surface stays hidden
      drawVfx(g, 'anim_ballenaplata', x, feet, e);
      g.restore();
      if (rise < 1) { g.fillStyle = 'rgba(200,230,255,0.5)'; g.fillRect(Math.round(x - 30), wl + 1, 60, 1); }
      drawVfx(g, 'splash', x, wl + 3, e - 1450);
    },
  },
  { // 3. Storm: the Cardenal Azul comes down through the lightning and the sky clears
    dur: 3300,
    cues: [[900, () => sfx('crit')], [1750, () => sfx('crit')]],
    draw(g, t, e) {
      const clear = ease((e - 2200) / 900);
      const shake = (Math.max(0, 1 - Math.abs(e - 1150) / 220) + Math.max(0, 1 - Math.abs(e - 2000) / 220)) * 3;
      g.save();
      if (shake > 0.2) g.translate(Math.round(Math.sin(t / 17) * shake), Math.round(Math.cos(t / 13) * shake));
      sky(g, [[0, lerpCol('#141a30', '#3a84d8', clear)], [0.55, lerpCol('#3a4466', '#9ad0f0', clear)], [1, lerpCol('#5a5a6a', '#d8f0e0', clear)]]);
      g.fillStyle = `rgba(30,34,56,${0.92 * (1 - clear)})`;
      for (let i = 0; i < 12; i++) { const cx = (i * 47 + t / 25) % (W + 80) - 40; g.beginPath(); g.arc(cx, 28 + (i % 3) * 16 - clear * 50, 28, 0, 7); g.arc(cx + 26, 34 + (i % 3) * 16 - clear * 50, 22, 0, 7); g.fill(); }
      if (clear < 1) { g.fillStyle = `rgba(170,190,230,${0.45 * (1 - clear)})`; for (let i = 0; i < 70; i++) g.fillRect((i * 37 + t / 3) % W, (i * 71 + t / 1.5) % H, 1, 6); }
      hills(g, t * 0.01, 182, 8, lerpCol('#1a2030', '#5aa046', clear), 160);
      hills(g, t * 0.02, 206, 6, lerpCol('#121828', '#3a8038', clear), 110);
      drawVfx(g, 'rayo', 120, 206, (e - 650) / 2.5); // played slower than authored so each strike reads
      drawVfx(g, 'rayo', 372, 204, (e - 1500) / 2.5);
      const feet = Math.round(-10 + ease(e / 1500) * 168 + Math.sin(t / 260) * 4);
      drawVfx(g, 'anim_pamperon', W / 2, feet, e);
      g.restore();
      const fa = Math.max(0, 1 - Math.abs(e - 1150) / 200) + Math.max(0, 1 - Math.abs(e - 2000) / 200);
      if (fa > 0) { g.fillStyle = `rgba(230,240,255,${Math.min(0.7, fa * 0.6)})`; g.fillRect(0, 0, W, H); }
    },
  },
  { // 4. The three starters appear in light, one after the other
    dur: 2700,
    cues: STARTER_CUE.map((ms): Cue => [ms, () => sfx('confirm')]),
    draw(g, t, e) {
      sky(g, [[0, '#120e2a'], [0.6, '#2a1f4a'], [1, '#4a2f3a']]);
      g.save(); g.translate(W / 2, 160); g.rotate(t / 12000); g.fillStyle = 'rgba(248,208,64,0.08)';
      for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.beginPath(); g.moveTo(-10, -30); g.lineTo(0, -280); g.lineTo(10, -30); g.fill(); }
      g.restore();
      const glow = g.createRadialGradient(W / 2, 170, 6, W / 2, 170, 170);
      glow.addColorStop(0, 'rgba(255,200,110,0.35)'); glow.addColorStop(1, 'rgba(255,160,80,0)');
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
      STARTERS.forEach((k, i) => {
        const x = STARTER_X[i], feet = 206;
        g.fillStyle = '#3a2a40'; g.beginPath(); g.ellipse(x, feet + 2, 30, 7, 0, 0, 7); g.fill();
        g.fillStyle = '#5a4060'; g.beginPath(); g.ellipse(x, feet, 26, 5, 0, 0, 7); g.fill();
        const since = e - STARTER_CUE[i];
        if (since > 220) {
          g.globalAlpha = clamp01((since - 220) / 250);
          drawVfx(g, `anim_${k}`, x, feet + 2, since);
          g.globalAlpha = 1;
        }
        drawVfx(g, 'solbeam', x, feet + 4, since);
      });
    },
  },
  { // 5. Title
    dur: 2600,
    cues: [[150, () => sfx('levelup')]],
    draw(g, t, e) {
      sky(g, [[0, '#1d2a5c'], [0.5, '#e86a4a'], [1, '#f8d070']]);
      const sy = 196 - Math.round(ease(e / 1800) * 16); // the Sol de Mayo rises behind the hills
      g.save(); g.translate(W / 2, sy); g.rotate(t / 9000); g.fillStyle = 'rgba(248,208,64,0.6)';
      for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.beginPath(); g.moveTo(-6, -40); g.lineTo(0, i % 2 ? -170 : -140); g.lineTo(6, -40); g.fill(); }
      g.restore();
      g.fillStyle = '#ffe070'; g.beginPath(); g.arc(W / 2, sy, 38, 0, 7); g.fill();
      hills(g, 0, 214, 5, '#2a1830', 140);
      drawVfx(g, 'estallido', W / 2, 70, e - 100);
      drawVfx(g, 'estallido', 110, 56, e - 500);
      drawVfx(g, 'estallido', 370, 62, e - 850);
      g.globalAlpha = clamp01((e - 150) / 500);
      text(g, 'Poke Uruguay', W / 2, 62, { size: 20, align: 'center', color: '#fff', shadow: '#1d2a5c' });
      text(g, 'La tierra de los charrúas', W / 2, 98, { size: 10, align: 'center', color: '#fff6c0', shadow: '#2a1830' });
      g.globalAlpha = 1;
      cardenalFlight(g, t, (tt) => { const q = e - (t - tt); if (q < 0) return null; return { x: -120 + q / 4.5, y: 120 + Math.sin(tt / 400) * 6 }; });
    },
  },
];

let cinematicSeen = false;
/** The intro cinematic. Plays when the game opens; a new game shows it only if it has not played yet in this session. Any key or "Saltar intro" ends it. */
export async function playCinematic() {
  cinematicSeen = true;
  preloadIntroVfx();
  let idx = 0;
  let start = performance.now();
  let skip = false;
  setRenderer((g, t) => {
    const sc = SHOTS[Math.min(idx, SHOTS.length - 1)];
    const e = Math.min(sc.dur, performance.now() - start);
    g.imageSmoothingEnabled = false;
    sc.draw(g, t, e);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, 16); g.fillRect(0, H - 16, W, 16); // letterbox
    const fade = Math.max(1 - e / 260, (e - (sc.dur - 200)) / 200, 0); // quick dip to black between shots
    if (fade > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; g.fillRect(0, 0, W, H); }
  });
  const btn = h('button', { class: 'intro-skip', type: 'button', text: 'Saltar intro' });
  btn.addEventListener('click', () => { skip = true; });
  uiRoot().append(btn);
  const off = input.push(() => { skip = true; });
  for (idx = 0; idx < SHOTS.length && !skip; idx++) {
    start = performance.now();
    const cues = [...(SHOTS[idx].cues ?? [])];
    while (!skip && performance.now() - start < SHOTS[idx].dur) {
      const e = performance.now() - start;
      while (cues.length && e >= cues[0][0]) { const [ms, fn] = cues.shift(); if (e - ms < 400) fn(); }
      await wait(30);
    }
  }
  off();
  btn.remove();
  idx = SHOTS.length - 1;
  await fadeOut(skip ? 200 : 450);
}

// ---------------------------------------------------------------- INTRO
export async function newGameIntro() {
  if (!cinematicSeen) await playCinematic();
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
