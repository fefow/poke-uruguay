// Battle presentation: canvas animation + DOM HUD/menus driving BattleEngine.
import { BattleEngine, STATUS_SHORT } from './battle-engine.ts';
import { SPECIES } from '../data/species.ts';
import { MOVES } from '../data/moves.ts';
import { TYPES } from '../data/types.ts';
import { ITEMS } from '../data/items.ts';
import { creatureSprite, SPRITE } from '../gfx/creatures.ts';
import { charSprite } from '../gfx/characters.ts';
import { uiIconCanvas } from '../gfx/ui-icons.ts';
import { setRenderer, getRenderer, W, H, dayTint } from '../gfx/screen.ts';
import { vignette, rain, weatherAt } from '../gfx/fx.ts';
import { MAPS } from '../data/maps.ts';
import { pickStyle, drawEffect, FX_MS } from './battle-fx.ts';
import { h, wait as baseWait, clamp } from '../core/util.ts';
import { sfx, playMusic, currentTrack, lowHpAlarm, cry, setAmbience, jingle } from '../core/audio.ts';
import { input, rumble } from '../core/input.ts';
import { say, choose, ask, closeDialog, uiRoot, textInput, fmt } from './ui.ts';
import { state, settings, earn, markSeen, markCaught, removeItem, PARTY_MAX } from './state.ts';
import { createCreature, displayName, maxHp, expForLevel, gainExp, learnMove, canEvolve, evolve, calcStats, STAT_KEYS, STAT_NAMES } from './creature.ts';
import { openParty, openBag } from './menus.ts';
import { sanitizeName } from '../core/util.ts';
import { info as logInfo } from '../core/debuglog.ts';
import { isTouch } from '../core/touchpad.ts';

const BG = {
  field: ['#9ad4f2', '#d8f0ff', '#78c850', '#5aa83c'],
  beach: ['#7ac8f0', '#d8f0ff', '#f0dca0', '#d8c080'],
  city: ['#b8c8e0', '#e8eef8', '#a8a49c', '#8a867e'],
  canyon: ['#e8b888', '#f8e0c0', '#a8845a', '#8a6a4a'],
  indoor: ['#e6d8b8', '#f2e8d0', '#d8d0c0', '#c8c0b0'],
  forest: ['#2a5a3a', '#7ab88a', '#437f30', '#2f5f22'],
  cave: ['#14121a', '#3a3646', '#5e5966', '#3e3a46'],
  wetland: ['#a8d4e8', '#eaf4e4', '#7e9e4c', '#5e7e38'],
  sierra: ['#8aa4c8', '#dce4f2', '#7e8a5a', '#5e6c44'],
};
const NO_TINT = new Set(['indoor', 'cave']);
const bump = (g, x, y, w, h) => { g.beginPath(); g.ellipse(x, y, w, h, 0, Math.PI, 0); g.fill(); };
/** Scenery on the horizon, drawn over the sky and under the ground. */
function decorSky(g, t) {
  const bg = A.bg;
  const cloud = (x, y, w) => { g.fillStyle = 'rgba(255,255,255,0.75)'; bump(g, x, y, w, w / 3); bump(g, x + w * 0.6, y, w * 0.7, w / 4); g.fillRect(x - w, y, w * 2.4, 2); };
  if (bg === 'field' || bg === 'beach' || bg === 'wetland' || bg === 'sierra') {
    const o = (t / 400) % 380;
    cloud((60 + o) % 380 - 60, 22, 16); cloud((200 + o * 0.6) % 380 - 60, 40, 12);
  }
  if (bg === 'field') {
    g.fillStyle = '#8cc88a'; bump(g, -10, 120, 90, 20); bump(g, 70, 120, 120, 26); bump(g, 250, 120, 110, 18);
    g.fillStyle = '#74b672'; bump(g, 160, 120, 90, 14);
    // an ombú on the left skyline and fence posts along the horizon
    g.fillStyle = '#4a3a24'; g.fillRect(22, 104, 3, 16);
    g.fillStyle = '#3a7a3a'; bump(g, 24, 106, 18, 12); g.fillStyle = '#4a9a48'; bump(g, 18, 104, 9, 7);
    g.fillStyle = '#6a5030'; for (let x = 100; x < W; x += 14) g.fillRect(x, 114, 1, 6);
    g.fillRect(100, 116, W - 100, 1);
  }
  if (bg === 'beach') {
    g.fillStyle = '#e8c878'; bump(g, 40, 120, 70, 10); bump(g, 280, 120, 80, 8);
    g.fillStyle = '#5a4026'; g.fillRect(270, 84, 3, 36); g.fillRect(272, 86, 2, 30);
    g.fillStyle = '#3a8a3a'; for (const [dx, dy] of [[-14, 4], [-8, -2], [6, -2], [14, 4]]) { g.fillRect(272 + Math.min(0, dx), 84 + dy, Math.abs(dx), 2); g.fillRect(272 + Math.max(0, dx) - (dx > 0 ? Math.abs(dx) : 0), 84 + dy, Math.abs(dx), 2); }
    g.fillStyle = '#fff'; const gx = (t / 60) % (W + 40); g.fillRect(gx - 20, 30 + Math.sin(t / 300) * 2, 4, 1); g.fillRect(gx - 16, 29 + Math.sin(t / 300) * 2, 3, 1);
  }
  if (bg === 'sierra') {
    g.fillStyle = '#6a7aa0'; g.beginPath(); g.moveTo(-80, 120); g.lineTo(-80, 78); g.lineTo(0, 70); g.lineTo(50, 50); g.lineTo(96, 84); g.lineTo(150, 40); g.lineTo(210, 86); g.lineTo(262, 56); g.lineTo(W, 90); g.lineTo(W, 120); g.fill();
    g.fillStyle = '#8a9aba'; g.beginPath(); g.moveTo(-80, 120); g.lineTo(-80, 100); g.lineTo(40, 94); g.lineTo(90, 112); g.lineTo(140, 88); g.lineTo(200, 114); g.lineTo(250, 92); g.lineTo(W, 116); g.lineTo(W, 120); g.fill();
    g.fillStyle = '#f2f6ff'; for (const [x, y] of [[50, 50], [150, 40], [262, 56]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 12); g.lineTo(x + 8, y + 12); g.fill(); }
  }
  if (bg === 'wetland') {
    g.fillStyle = '#5a9ac0'; g.fillRect(-80, 108, W + 80, 12);
    g.fillStyle = '#9ad0e8'; for (let x = -80 + (t / 60) % 20; x < W; x += 20) g.fillRect(x, 112, 8, 1);
    g.fillStyle = '#4a6a2c'; for (let x = -74; x < W; x += 17) { g.fillRect(x, 96 + (x % 5), 1, 14); g.fillRect(x + 2, 99 + (x % 7), 1, 11); }
    g.fillStyle = '#f2f2ee'; for (const [x, y] of [[40, 70], [64, 62], [260, 74]]) { g.fillRect(x, y, 5, 1); g.fillRect(x + 1, y - 1, 2, 1); g.fillRect(x + 5, y + 1, 3, 1); }
  }
  if (bg === 'forest') {
    for (let x = -84; x < W; x += 26) {
      g.fillStyle = '#1b3a24'; g.fillRect(x, 0, 9, 124);
      g.fillStyle = '#2a5a36'; g.fillRect(x + 1, 0, 2, 124);
    }
    g.fillStyle = '#16301e'; for (let x = -80; x < W; x += 10) { bump(g, x, 18 + (x % 7) * 3, 14, 20); }
    g.fillStyle = 'rgba(255,248,190,0.14)'; for (const x of [70, 150, 240]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 48, 124); g.lineTo(x + 20, 124); g.fill(); }
  }
  if (bg === 'cave') {
    g.fillStyle = '#26232e';
    for (let x = -84; x < W; x += 14) { const hh = 12 + ((x * 37) % 26); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 7, hh); g.fill(); }
    g.fillStyle = '#3a3646'; for (let x = -78; x < W; x += 31) g.fillRect(x, 0, 6, 6 + (x % 9));
    for (const [x, y, c] of [[40, 80, '#5ab8d8'], [96, 96, '#7ad8f0'], [270, 70, '#5ab8d8'], [300, 98, '#7ad8f0']] as const) {
      const tw = 0.6 + 0.4 * Math.sin(t / 500 + x);
      g.globalAlpha = tw; g.fillStyle = c; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 14); g.lineTo(x - 4, y + 14); g.fill(); g.globalAlpha = 1;
    }
  }
  if (bg === 'city') {
    g.fillStyle = 'rgba(255,230,150,0.5)'; for (const [x, w2, hh] of [[34, 22, 70], [238, 40, 55], [282, 38, 66]]) for (let wy = 120 - hh + 6; wy < 114; wy += 9) for (let wx = x + 4; wx < x + w2 - 3; wx += 8) g.fillRect(wx, wy, 3, 4);
  }
}
/** Details on the ground in front, drawn under the platforms. */
function decorGround(g, t) {
  const bg = A.bg;
  const tuft = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 3); g.fillRect(x + 2, y + 1, 1, 2); g.fillRect(x - 2, y + 1, 1, 2); };
  if (bg === 'field') for (const [x, y] of [[20, 140], [150, 150], [290, 134], [120, 196], [270, 180]]) tuft(x, y, '#3a8a2c');
  if (bg === 'beach') { g.fillStyle = '#c8aa68'; for (const [x, y] of [[30, 150], [190, 140], [140, 190], [290, 170]]) g.fillRect(x, y, 5, 1); g.fillStyle = '#f2a8a0'; g.fillRect(224, 170, 3, 2); }
  if (bg === 'wetland') { g.fillStyle = '#4a6a2c'; for (const [x, y] of [[24, 150], [300, 140], [180, 196], [260, 176]]) { g.fillRect(x, y, 1, 8); g.fillRect(x + 2, y + 2, 1, 6); } g.fillStyle = 'rgba(120,170,200,0.5)'; g.fillRect(150, 150, 22, 4); g.fillRect(96, 140, 16, 3); }
  if (bg === 'sierra') { g.fillStyle = '#7a7a82'; for (const [x, y, w2] of [[30, 150, 10], [200, 140, 12], [150, 192, 8], [286, 174, 10]]) { g.fillRect(x, y, w2, 5); g.fillStyle = '#9a9aa2'; g.fillRect(x, y, w2, 1); g.fillStyle = '#7a7a82'; } }
  if (bg === 'forest') { g.fillStyle = '#2c5a22'; for (const [x, y] of [[20, 146], [190, 138], [140, 194], [290, 170]]) { g.fillRect(x, y, 6, 2); g.fillRect(x + 1, y - 1, 3, 1); } g.fillStyle = '#7a3a2a'; g.fillRect(250, 150, 2, 1); g.fillRect(70, 190, 2, 1); }
  if (bg === 'cave') { g.fillStyle = 'rgba(70,110,150,0.55)'; g.fillRect(150, 150, 30, 5); g.fillRect(100, 192, 22, 4); g.fillStyle = 'rgba(160,200,230,0.5)'; g.fillRect(154, 151, 8, 1); g.fillStyle = '#2e2a36'; for (const [x, y] of [[30, 146], [280, 140], [200, 190]]) { g.fillRect(x, y, 8, 5); g.fillStyle = '#4a4656'; g.fillRect(x, y, 8, 1); g.fillStyle = '#2e2a36'; } }
}

// Animation state read by the renderer.
const A: any = {
  bg: 'field', t: 0,
  foe: null, ply: null, // species keys
  foeX: 0, plyX: 0, foeY: 0, plyY: 0,
  foeSX: 1, foeSY: 1, foeRot: 0, foeGlow: 0, plySX: 1, plySY: 1, plyRot: 0, plyGlow: 0, proj: null,
  foeVis: true, plyVis: true, foeAlpha: 1, plyAlpha: 1, foeFlash: 0, plyFlash: 0,
  foeTrainer: null, trainerX: 0,
  playerTrainerX: 0, showPlayerTrainer: false,
  ball: null, // {x,y,shake}
  fx: null, // {type,color,x,y,t}
  eff: null, // typed attack effect (battle-fx.ts)
  shakeScreen: 0,
  tint: null,
};

function drawBattle(g, t) {
  A.t = t;
  const [s1, s2, g1, g2] = BG[A.bg] ?? BG.field;
  let grd = g.createLinearGradient(0, 0, 0, 120);
  grd.addColorStop(0, s1); grd.addColorStop(1, s2);
  g.fillStyle = grd; g.fillRect(0, 0, W, 120);
  if (A.bg === 'beach') { g.fillStyle = '#3a8fd8'; g.fillRect(0, 96, W, 30); g.fillStyle = '#7ab8f0'; for (let x = (t / 40) % 24; x < W; x += 24) g.fillRect(x, 104, 10, 1); }
  if (A.bg === 'city') { g.fillStyle = '#8a96aa'; for (const [x, w, hh] of [[0, 30, 50], [34, 22, 70], [60, 40, 40], [210, 24, 80], [238, 40, 55], [282, 38, 66]]) g.fillRect(x, 120 - hh, w, hh); }
  if (A.bg === 'canyon') { g.fillStyle = '#8a6a4a'; g.beginPath(); g.moveTo(0, 120); g.lineTo(0, 40); g.lineTo(60, 70); g.lineTo(110, 30); g.lineTo(170, 80); g.lineTo(240, 20); g.lineTo(320, 60); g.lineTo(320, 120); g.fill(); }
  g.save(); g.translate((W - 320) / 2, 0); decorSky(g, t); g.restore();
  grd = g.createLinearGradient(0, 120, 0, H);
  grd.addColorStop(0, g1); grd.addColorStop(1, g2);
  g.fillStyle = grd; g.fillRect(0, 120, W, H - 120);
  g.save(); g.translate((W - 320) / 2, 0); decorGround(g, t); g.restore();
  const sx = A.shakeScreen ? Math.round(Math.sin(t / 20) * A.shakeScreen) : 0;
  g.save();
  g.translate(sx, 0);
  // platforms
  for (const [px, py, rx, ry] of [[236, 104, 52, 12], [84, 178, 64, 13]]) {
    g.save();
    g.translate(px, py);
    g.scale(1, ry / rx);
    const sh = g.createRadialGradient(0, 0, rx * 0.25, 0, 0, rx);
    sh.addColorStop(0, 'rgba(0,0,0,0.38)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh;
    g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.16)';
    g.beginPath(); g.ellipse(px, py - 2, rx * 0.86, ry * 0.7, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.22)';
    g.lineWidth = 1;
    g.beginPath(); g.ellipse(px, py - 2, rx * 0.86, ry * 0.7, 0, 0, 7); g.stroke();
  }
  // foe trainer
  if (A.foeTrainer) {
    const spr = charSprite(A.foeTrainer, 'down', 0);
    g.drawImage(spr, 0, 0, 16, 17, Math.round(236 - 24 + A.trainerX), 104 - 51, 48, 51); // 3x: whole-number scale keeps the pixels square
  }
  if (A.showPlayerTrainer) {
    const spr = charSprite(state().player.look, 'up', 0);
    g.drawImage(spr, 0, 0, 16, 17, Math.round(60 + A.playerTrainerX), 180 - 51, 48, 51);
  }
  // creatures: breathing idle + per-side transform (offset, squash and stretch, rotation, glow)
  if (A.foe && A.foeVis) drawCreature(g, creatureSprite(A.foe), 236, 106, SPRITE, 'foe', t, 0);
  if (A.ply && A.plyVis) drawCreature(g, creatureSprite(A.ply, { back: true }), 84, 184, SPRITE, 'ply', t, 1);
  if (A.proj) drawProjectile(g, A.proj);
  if (A.eff) drawEffect(g, A.eff);
  if (A.ball) drawBall(g, A.ball.x, A.ball.y, A.ball.shake, A.ball.item);
  if (A.fx) drawFx(g, A.fx, t);
  drawBursts(g);
  g.restore();
  const tint = dayTint();
  if (tint && !NO_TINT.has(A.bg)) { g.fillStyle = tint; g.fillRect(0, 0, W, H); }
  if (A.weather === 'rain' || A.weather === 'storm') { rain(g, t); if (A.weather === 'storm') rain(g, t * 1.7); }
  vignette(g, 0.9);
  if (A.tint) { g.fillStyle = A.tint; g.fillRect(0, 0, W, H); }
}

function drawCreature(g, spr, cx, base, size, side, t, phase) {
  const breath = Math.sin(t / 650 + phase);
  const flash = A[`${side}Flash`] && Math.floor(t / 60) % 2;
  g.save();
  g.globalAlpha = A[`${side}Alpha`];
  // Idle breathing is a whole-pixel bob (a fractional scale or offset would make some art pixels wider than others).
  g.translate(Math.round(cx + A[`${side}X`]), Math.round(base + A[`${side}Y`] + (breath > 0.35 ? -1 : 0)));
  g.rotate(A[`${side}Rot`]);
  g.scale(A[`${side}SX`], A[`${side}SY`]);
  g.drawImage(spr, -size / 2, -size, size, size);
  const glow = A[`${side}Glow`];
  if (flash || glow) {
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = A[`${side}Alpha`] * (flash ? 1 : glow * 0.7);
    g.drawImage(spr, -size / 2, -size, size, size);
  }
  g.restore();
}

function drawProjectile(g, pr) {
  g.save();
  for (let i = 5; i >= 0; i--) {
    const q = Math.max(0, pr.p - i * 0.05);
    const x = pr.x1 + (pr.x2 - pr.x1) * q;
    const y = pr.y1 + (pr.y2 - pr.y1) * q - Math.sin(q * Math.PI) * 14;
    g.globalAlpha = 0.9 - i * 0.14;
    g.fillStyle = i ? pr.color : '#fff';
    g.beginPath(); g.arc(x, y, 6 - i * 0.7, 0, 7); g.fill();
  }
  g.restore();
}

/** The thrown ball: the editor's drawing ('ui:captura_<ball>', by default the bag icon), tilted while it shakes. */
function drawBall(g, x, y, shake = 0, item = 'esfera') {
  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(Math.round(x), Math.round(y));
  g.rotate(shake);
  g.drawImage(uiIconCanvas(`captura_${item}`), -8, -8);
  g.restore();
}

function drawFx(g, fx, t) {
  const age = t - fx.start;
  const p = clamp(age / fx.dur, 0, 1);
  g.save();
  g.globalAlpha = 1 - p * 0.8;
  g.fillStyle = fx.color;
  if (fx.kind === 'status') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + p * 3;
      g.fillRect(fx.x + Math.cos(a) * 20 * p - 2, fx.y + Math.sin(a) * 14 - p * 20, 4, 4);
    }
  } else {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = 6 + p * 34;
      g.fillRect(fx.x + Math.cos(a) * r - 3, fx.y + Math.sin(a) * r * 0.7 - 3, 6, 6);
    }
    g.globalAlpha = (1 - p) * 0.8;
    g.beginPath(); g.arc(fx.x, fx.y, 8 + p * 12, 0, 7); g.fill();
  }
  g.restore();
}

const easeOut = (p) => 1 - (1 - p) ** 3;
const easeIn = (p) => p * p;
const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const easeOutBack = (p) => 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2;

// Holding Space doubles the pace of battle animations and waits.
const pace = () => (input.held('run') ? 2 : 1);
const wait = (ms) => baseWait(ms / pace());

async function tween(rawMs, fn, ease = (p) => p) {
  const ms = rawMs / pace();
  const t0 = performance.now();
  return new Promise<void>((res) => {
    const step = () => {
      const p = clamp((performance.now() - t0) / ms, 0, 1);
      fn(ease(p));
      if (p < 1) requestAnimationFrame(step);
      else res();
    };
    requestAnimationFrame(step);
  });
}

// ---------------------------------------------------------------- HUD
let hud;
function buildHud() {
  const box = (side) => {
    const el = h('div', { class: `bhud bhud-${side}` },
      h('div', { class: 'bhud-row' }, h('span', { class: 'bhud-name' }), h('span', { class: 'bhud-status' }), h('span', { class: 'bhud-lv' })),
      h('div', { class: 'bhud-types' }),
      h('div', { class: 'hpbar' }, h('span', { class: 'hpbar-label', text: 'PS' }), h('div', { class: 'hpbar-track' }, h('div', { class: 'hpbar-fill' }))),
      side === 'ply' ? h('div', { class: 'bhud-hp' }) : null,
      side === 'ply' ? h('div', { class: 'expbar' }, h('div', { class: 'expbar-fill' })) : null,
      side === 'foe' ? h('span', { class: 'bhud-caught', hidden: true, title: 'Ya atrapado' }) : null,
    );
    return el;
  };
  const foe = box('foe');
  const ply = box('ply');
  const balls = h('div', { class: 'bhud-balls' });
  const layer = h('div', { class: 'battle-layer' }, foe, ply, balls);
  uiRoot().append(layer);
  hud = { layer, foe, ply, balls };
}

function setHud(which, c, { instant = false, hp = c?.hp } = {}) {
  const el = hud[which];
  el.hidden = !c;
  if (!c) return;
  el.querySelector('.bhud-name').textContent = displayName(c);
  el.querySelector('.bhud-lv').textContent = `Nv${c.level}`;
  el.querySelector('.bhud-types').replaceChildren(...SPECIES[c.species].types.map((t) => h('span', { class: 'type-chip', style: { '--type': TYPES[t].color }, text: TYPES[t].name })));
  const st = el.querySelector('.bhud-status');
  st.textContent = c.status ? STATUS_SHORT[c.status] : '';
  st.dataset.status = c.status ?? '';
  const ratio = hp / maxHp(c);
  const fill = el.querySelector('.hpbar-fill');
  fill.classList.toggle('no-anim', instant);
  fill.style.setProperty('--hp', ratio);
  fill.dataset.level = ratio > 0.5 ? 'good' : ratio > 0.2 ? 'mid' : 'low';
  const hpTxt = el.querySelector('.bhud-hp');
  if (hpTxt) hpTxt.textContent = `${Math.max(0, hp)}/${maxHp(c)}`;
  const exp = el.querySelector('.expbar-fill');
  if (exp) {
    const lo = expForLevel(c.level), hi = expForLevel(c.level + 1);
    exp.classList.toggle('no-anim', instant);
    exp.style.setProperty('--exp', c.level >= 100 ? 1 : clamp((c.exp - lo) / (hi - lo), 0, 1));
  }
  // The low-HP alarm loops while the player's active creature is in the red.
  if (which === 'ply') lowHpAlarm(hp > 0 && ratio <= 0.2);
  const caught = el.querySelector('.bhud-caught');
  if (caught) caught.hidden = !(engine?.wild && state().dex.caught.includes(c.species));
}

function setBalls(party, show) {
  hud.balls.replaceChildren(...(show ? party.map((c) => h('i', { class: c.hp > 0 ? (c.status ? 'is-status' : '') : 'is-fainted' })) : []));
}

// ---------------------------------------------------------------- RUN
/** Gym leaders, the Alto Mando, the champion and the PP's top brass get the big entrance and the epic theme. */
function isBoss(trainer) {
  return !!trainer.badge || /Alto Mando|Campe|Admin\. PP|Comandante PP|Jefe PP|Fundador PP|Espíritu/.test(trainer.cls ?? '');
}

let engine = null;

/**
 * opts: { foes:[creature], wild:bool, trainer, bg, canLose }
 * returns 'win' | 'lose' | 'run' | 'caught'
 */
export async function runBattle({ foes, wild, trainer = null, bg = 'field', canLose = false, music = 'battle' }) {
  const S = state();
  const prevRenderer = getRenderer();
  const prevMusic = currentTrack();
  engine = new BattleEngine({ party: S.party, foes, wild, trainer });
  engine.noFlee = !!S.safari?.contest;
  logInfo(`Batalla ${wild ? 'salvaje' : `vs ${trainer?.name ?? 'entrenador'}`}: ${foes.map((f) => `${f.species} nv${f.level}`).join(', ')}`);
  Object.assign(A, { bg, foe: null, ply: null, foeX: 0, plyX: 0, foeY: 0, plyY: 0, foeSX: 1, foeSY: 1, foeRot: 0, foeGlow: 0, plySX: 1, plySY: 1, plyRot: 0, plyGlow: 0, proj: null, foeVis: true, plyVis: true, foeAlpha: 1, plyAlpha: 1, foeFlash: 0, plyFlash: 0, foeTrainer: null, trainerX: 0, ball: null, fx: null, shakeScreen: 0, tint: null, showPlayerTrainer: true, playerTrainerX: 0 });
  // Each kind of opponent has its own theme: wild creatures, trainers, the rival, and leaders or bosses.
  if (music === 'battle' && trainer) {
    const id = String(trainer.id ?? '');
    music = isBoss(trainer) ? 'leader' : /^rival/.test(id) ? 'rival' : 'trainer';
  }
  // Outdoor weather carries into the fight: rain keeps falling over the battlefield.
  {
    const m = MAPS[S.pos?.map];
    A.weather = m && !m.indoor && !m.dark && m.theme !== 'cueva' ? weatherAt(m.id, m.weather) : 'clear';
  }
  playMusic(music);
  setAmbience(A.weather === 'rain' || A.weather === 'storm' ? { rain: A.weather === 'storm' ? 1 : 0.7, thunder: A.weather === 'storm' ? 1 : 0 } : {});
  sfx('encounter');
  await introFlash(!trainer ? 'wild' : isBoss(trainer) || /^rival/.test(String(trainer.id ?? '')) ? 'boss' : 'trainer');
  setRenderer(drawBattle);
  buildHud();
  hud.foe.hidden = hud.ply.hidden = true;
  const leveled = new Set();

  try {
    // ---- intro
    if (wild) {
      A.foe = foes[0].species;
      A.foeX = 160;
      await tween(650, (p) => (A.foeX = 160 * (1 - p)), easeOut);
      creatureCry(foes[0]);
      markSeen(foes[0].species);
      setHud('foe', foes[0], { instant: true });
      await say(`¡Apareció un ${displayName(foes[0])} salvaje!`, { battle: true, auto: 1400 });
    } else {
      A.foeTrainer = trainer.look ?? 'boy';
      A.trainerX = 160;
      setBalls(foes, true);
      await tween(450, (p) => (A.trainerX = 160 * (1 - p)));
      if (trainer.intro) await say(Array.isArray(trainer.intro) ? trainer.intro : [trainer.intro], { battle: true, name: trainer.name });
      await say(`¡${trainer.cls} ${fmt(trainer.name)} te desafía!`, { battle: true, auto: 1200 });
      await tween(350, (p) => (A.trainerX = 160 * p));
      A.foeTrainer = null;
      setBalls(foes, false);
      await sendOutFoe(foes[0]);
      await say(`¡${fmt(trainer.name)} envió a ${displayName(foes[0])}!`, { battle: true, auto: 1100 });
    }
    await tween(300, (p) => (A.playerTrainerX = -120 * p));
    A.showPlayerTrainer = false;
    await sendOutPlayer(engine.p.c);
    await say(`¡Adelante, ${displayName(engine.p.c)}!`, { battle: true, auto: 900 });
    Object.assign(tuto, { on: !!trainer && !S.flags?.rival1 && String(trainer.id ?? '') === 'rival_0', menu: false, moves: false, after: false });
    if (tuto.on) await tutoIntro();

    // ---- main loop
    while (!engine.over) {
      const action = await chooseAction();
      if (!action) continue;
      if (action.type === 'ball' && wild) removeItem(action.item, 1);
      if (action.type === 'item') removeItem(action.item, 1);
      const ev = engine.turn(action);
      // Compact trace of the turn, so a report from the bug panel shows what the engine decided.
      logInfo(`Turno ${engine.turnNo}: ${action.type}${action.index != null ? ` #${action.index}` : ''} | ${ev.map((x) => (x.t === 'text' ? `"${x.msg}"` : x.t === 'damage' ? `dmg${x.side}:${x.amount}` : x.t)).join(' ')}`);
      await play(ev, leveled);
      if (tuto.on && !tuto.after && !engine.over && action.type === 'move') { tuto.after = true; await tutoAfterTurn(); }
    }

    // ---- outcome
    const result = engine.over;
    logInfo(`Fin de batalla: ${result}`);
    if (result === 'win' && trainer) {
      A.foeTrainer = trainer.look ?? 'boy';
      A.trainerX = 160;
      playMusic('victory');
      await tween(400, (p) => (A.trainerX = 160 * (1 - p)));
      if (trainer.lose) await say(trainer.lose, { battle: true, name: trainer.name });
      const prize = trainer.prize ?? 0;
      if (prize) {
        earn(prize);
        sfx('money');
        await say(`¡Ganaste $${prize}!`, { battle: true });
      }
      S.stats.battlesWon++;
      recordBattle(trainer);
    } else if (result === 'win') {
      S.stats.battlesWon++;
    } else if (result === 'caught') {
      await handleCatch(foes[0]);
    } else if (result === 'lose') {
      if (!canLose) {
        await say(['¡No te quedan criaturas en condiciones de pelear!', '…', 'Todo se pone gris…'], { battle: true });
      }
    }
    if (result === 'run') sfx('run');
    // Evolutions after battle
    if (result !== 'lose') {
      for (const c of S.party) if (leveled.has(c.uid) && canEvolve(c)) await evolutionScene(c);
    }
    closeDialog();
    return result;
  } finally {
    tuto.on = false;
    lowHpAlarm(false);
    hud.layer.remove();
    hud = null;
    engine = null;
    setRenderer(prevRenderer);
    if (prevMusic) playMusic(prevMusic);
  }
}

/**
 * Battle transition like the handheld games: the screen blinks three times, then a wipe closes in to black.
 * Wild creatures get horizontal blinds, trainers a spiral of blocks, leaders and bosses an iris that shrinks.
 */
async function introFlash(kind = 'wild') {
  const prev = getRenderer();
  if (!settings.anims) {
    setRenderer((g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); });
    await wait(150);
    return;
  }
  const t0 = performance.now();
  setRenderer((g, t) => {
    prev?.(g, t);
    const k = Math.floor((t - t0) / 75);
    if (k < 6 && k % 2 === 0) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, W, H); }
    else if (k < 6) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, H); }
  });
  await wait(450);
  // The wipe draws over a frozen copy of the world, so nothing moves underneath it.
  const snap = document.createElement('canvas');
  snap.width = W; snap.height = H;
  prev?.(snap.getContext('2d'), performance.now());
  const cell = 30, cols = W / cell, rows = Math.ceil(H / cell);
  const spiral = [];
  {
    let x0 = 0, y0 = 0, x1 = cols - 1, y1 = rows - 1;
    while (x0 <= x1 && y0 <= y1) {
      for (let x = x0; x <= x1; x++) spiral.push([x, y0]);
      for (let y = y0 + 1; y <= y1; y++) spiral.push([x1, y]);
      if (y0 < y1) for (let x = x1 - 1; x >= x0; x--) spiral.push([x, y1]);
      if (x0 < x1) for (let y = y1 - 1; y > y0; y--) spiral.push([x0, y]);
      x0++; y0++; x1--; y1--;
    }
  }
  const w0 = performance.now(), dur = 620;
  setRenderer((g) => {
    const p = Math.min(1, (performance.now() - w0) / dur);
    g.drawImage(snap, 0, 0);
    g.fillStyle = '#000';
    if (kind === 'boss') {
      const R = Math.hypot(W, H) / 2 * (1 - p);
      g.beginPath();
      g.rect(0, 0, W, H);
      g.arc(W / 2, H / 2, Math.max(0, R), 0, Math.PI * 2, true);
      g.fill('evenodd');
    } else if (kind === 'trainer') {
      const n = Math.floor(p * spiral.length);
      for (let i = 0; i < n; i++) g.fillRect(spiral[i][0] * cell, spiral[i][1] * cell, cell, cell);
    } else {
      const bands = 10, bh = Math.ceil(H / bands);
      for (let i = 0; i < bands; i++) {
        const w = Math.round(W * p);
        g.fillRect(i % 2 ? W - w : 0, i * bh, w, bh);
      }
    }
  });
  await wait(dur + 40);
  setRenderer((g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); });
  await wait(120);
}

/** Creature appears out of the ball: grows with a little overshoot while fading in. */
async function popIn(side) {
  A[`${side}Alpha`] = 0;
  await tween(380, (p) => {
    A[`${side}SX`] = A[`${side}SY`] = 0.35 + 0.65 * p;
    A[`${side}Alpha`] = Math.min(1, p * 3);
    A[`${side}Glow`] = 1 - Math.min(1, p * 1.4);
  }, easeOutBack);
  A[`${side}SX`] = A[`${side}SY`] = 1;
  A[`${side}Alpha`] = 1;
  A[`${side}Glow`] = 0;
}

/** Plays a creature's own cry; bigger creatures (higher base stats) sound lower. */
function creatureCry(c, faint = false) {
  const base = SPECIES[c.species]?.base ?? [];
  const total = base.reduce((a, b) => a + b, 0) || 300;
  cry(c.species, total / 250, { faint });
}

async function sendOutFoe(c) {
  A.foe = c.species;
  A.foeVis = false;
  A.ball = { x: 236, y: 60, shake: 0 };
  sfx('throw');
  await tween(250, (p) => (A.ball.y = 60 + p * 30));
  A.ball = null;
  A.foeVis = true;
  creatureCry(c);
  await popIn('foe');
  markSeen(c.species);
  setHud('foe', c, { instant: true });
}

async function sendOutPlayer(c, at = null) {
  A.ply = c.species;
  A.plyVis = false;
  A.ball = { x: 30, y: 110, shake: 0 };
  sfx('throw');
  await tween(300, (p) => { A.ball.x = 30 + p * 54; A.ball.y = 110 + Math.sin(p * Math.PI) * -30 + p * 50; });
  A.ball = null;
  A.plyVis = true;
  creatureCry(c);
  await popIn('ply');
  // `at` is the HP and status when the creature came out: attacks later in the same turn show up on their own.
  setHud('ply', at ? { ...c, status: at.status } : c, { instant: true, hp: at ? at.hp : c.hp });
}

function recordBattle(trainer) {
  // Kept for future server-side replay validation (Supabase phase).
  const S = state();
  S.battleLog ??= [];
  S.battleLog.push({ id: trainer.id, at: Date.now(), ...engine.log });
  if (S.battleLog.length > 20) S.battleLog.shift();
}

// ---------------------------------------------------------------- TUTORIAL
// The first fight (against the rival, right after choosing the starter) teaches the controls: the professor's notes
// sit at the top of the screen and say keys on a computer and taps on a phone or tablet.
const tuto = { on: false, menu: false, moves: false, after: false };
const PROF = 'Maestro Tabárez';

function tutoTip(text) {
  const tip = h('div', { class: 'tuto-tip', role: 'note' }, h('b', { class: 'tuto-who', text: PROF }), h('p', { text }));
  uiRoot().append(tip);
  return () => tip.remove();
}

async function tutoIntro() {
  const t = isTouch();
  await say([
    'Es tu primer combate. Te voy a ir explicando cómo se pelea.',
    t ? 'Para pasar los mensajes, tocá el cuadro de texto o el botón Z.' : 'Para pasar los mensajes, apretá Z o Enter.',
    t ? 'Las opciones se eligen tocándolas directamente. Probá.' : 'Las opciones se eligen con las flechas: Z confirma y X vuelve atrás.',
  ], { battle: true, name: PROF });
}

async function tutoAfterTurn() {
  const t = isTouch();
  await say([
    'Así se ataca. Cuando los PS de la criatura rival llegan a cero, queda fuera de combate.',
    'En «Mochila» se usan los Mates para curar y las Pokeballs para atrapar criaturas salvajes. «Equipo» cambia de criatura y «Huir» escapa de las salvajes.',
    t ? 'El botón ×2 de arriba a la derecha acelera los combates y las caminatas. Ahora seguí vos.' : 'Mantené Espacio para que todo vaya el doble de rápido. Ahora seguí vos.',
  ], { battle: true, name: PROF });
}

// ---------------------------------------------------------------- MENUS
let lastAction = 0;
async function chooseAction() {
  const c = engine.p.c;
  await say(`¿Qué va a hacer ${displayName(c)}?`, { battle: true, keep: true });
  let untip = null;
  if (tuto.on && !tuto.menu) {
    tuto.menu = true;
    untip = tutoTip(isTouch() ? 'Tocá «Luchar» para atacar.' : 'Elegí «Luchar» con las flechas y apretá Z para atacar.');
  }
  const first = untip ? [{ label: 'Luchar', cls: 'tuto-glow' }, 'Mochila', 'Equipo', 'Huir'] : ['Luchar', 'Mochila', 'Equipo', 'Huir'];
  const pick = await choose(first, { cancel: false, cls: 'menu-battle', cols: 2, start: 0 });
  untip?.();
  lastAction = pick;
  if (pick === 0) {
    const mv = await chooseMove(c);
    if (mv < 0) return null;
    return { type: 'move', index: mv };
  }
  if (pick === 1) {
    closeDialog();
    const r = await openBag({ mode: 'battle', wild: engine.wild });
    if (!r) return null;
    if (ITEMS[r.item].ball) return { type: 'ball', item: r.item };
    return { type: 'item', item: r.item, target: r.target };
  }
  if (pick === 2) {
    closeDialog();
    const idx = await openParty({ mode: 'battle', active: engine.pIndex });
    if (idx == null || idx < 0) return null;
    return { type: 'switch', index: idx };
  }
  return { type: 'run' };
}

async function chooseMove(c, { forgetting = false, incoming = null }: { forgetting?: boolean; incoming?: string | null } = {}) {
  closeDialog();
  let neu = null;
  if (incoming) {
    const d = MOVES[incoming];
    const cat = { fis: 'Físico', esp: 'Especial', est: 'Estado' }[d.cat];
    neu = h('div', { class: 'move-new' },
      h('div', { class: 'mn-title', text: 'Movimiento nuevo' }),
      h('div', { class: 'mi-head' }, h('b', { class: 'mn-name', text: d.name }), h('span', { class: 'type-chip', style: { '--type': TYPES[d.type].color }, text: TYPES[d.type].name }), h('span', { class: 'mi-cat', text: cat })),
      h('div', { class: 'mn-stats', text: `Poder ${d.cat === 'est' || !d.power ? '—' : d.power} · Precisión ${d.fx?.never ? '—' : d.acc} · PP ${d.pp}` }),
      h('p', { class: 'mn-desc', text: d.desc }));
    uiRoot().append(neu);
  }
  const info = h('div', { class: 'move-info' });
  uiRoot().append(info);
  const CAT = { fis: 'Físico', esp: 'Especial', est: 'Estado' };
  const opts = c.moves.map((m) => {
    const d = MOVES[m.id];
    const content = h('div', { class: 'mv' },
      h('span', { class: 'mv-name', text: d.name }),
      h('span', { class: 'mv-sub' },
        h('i', { class: 'mv-dot', style: { '--type': TYPES[d.type].color } }),
        h('span', { text: `PP ${m.pp}/${d.pp}` })));
    return { label: d.name, content, disabled: !forgetting && m.pp <= 0 && c.moves.some((x) => x.pp > 0) };
  });
  const show = (i) => {
    const d = MOVES[c.moves[i].id];
    info.replaceChildren(
      h('div', { class: 'mi-head' },
        h('span', { class: 'type-chip', style: { '--type': TYPES[d.type].color }, text: TYPES[d.type].name }),
        h('span', { class: 'mi-cat', text: CAT[d.cat] })),
      h('dl', { class: 'mi-stats' },
        h('dt', { text: 'Poder' }), h('dd', { text: d.cat === 'est' || !d.power ? '—' : String(d.power) }),
        h('dt', { text: 'Precisión' }), h('dd', { text: d.fx?.never ? '—' : String(d.acc) })),
      h('p', { class: 'mi-desc', text: d.desc }),
    );
  };
  let untip = null;
  if (tuto.on && !tuto.moves && !forgetting) {
    tuto.moves = true;
    untip = tutoTip(isTouch()
      ? 'Tocá un movimiento para ver su tipo y su poder, y tocalo otra vez para usarlo.'
      : 'Con las flechas ves el tipo y el poder de cada movimiento. Z lo usa y X vuelve atrás.');
  }
  const r = await choose(opts, { cls: 'menu-moves', onMove: show, cols: 2, hint: isTouch() && !forgetting ? 'Tocá para ver · tocá otra vez para usar' : '' });
  untip?.();
  info.remove();
  neu?.remove();
  return r;
}

// ---------------------------------------------------------------- EVENTS
async function play(events, leveled) {
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    switch (e.t) {
      case 'text':
        await say(e.msg, { battle: true, auto: 1100 });
        break;
      case 'anim':
        A.lastType = e.move;
        await attackAnim(e.side, e.move, e.kind, e.name);
        break;
      case 'damage': {
        const side = e.side === 0 ? 'ply' : 'foe';
        sfx(e.crit ? 'crit' : e.eff > 1 ? 'super' : e.eff < 1 ? 'weak' : 'hit');
        A[e.side === 0 ? 'plyFlash' : 'foeFlash'] = 1;
        if (settings.anims && e.amount > 0) burst(e.side, e.eff, e.crit, e.amount);
        rumble(e.eff > 1 ? 260 : 140, e.eff > 1 ? 0.9 : 0.4, e.side === 0 ? 0.6 : 0.2);
        hitReaction(side, e.side === 0 ? -1 : 1, e.eff);
        setHud(side, e.side === 0 ? engine.p.c : engine.f.c, { hp: e.hp });
        await wait(520);
        A.plyFlash = A.foeFlash = 0;
        break;
      }
      case 'heal':
        sfx('heal');
        setHud(e.side === 0 ? 'ply' : 'foe', e.side === 0 ? engine.p.c : engine.f.c, { hp: e.hp });
        await wait(400);
        break;
      case 'hud':
        setHud('ply', engine.p.c, { hp: e.php });
        setHud('foe', engine.f.c, { hp: e.fhp });
        break;
      case 'stat':
        sfx(e.up ? 'stat_up' : 'stat_down');
        A.fx = { kind: 'status', color: e.up ? '#ff8a5a' : '#5a8aff', x: e.side === 0 ? 84 : 236, y: e.side === 0 ? 140 : 70, start: performance.now(), dur: 500 };
        await wait(450);
        A.fx = null;
        break;
      case 'statusAnim': {
        const col = { brn: '#ff6a2a', psn: '#b05ad0', par: '#f2e05c', slp: '#c8d0ff' }[e.status];
        sfx(`st_${e.status}`);
        A.fx = { kind: 'status', color: col, x: e.side === 0 ? 84 : 236, y: e.side === 0 ? 140 : 70, start: performance.now(), dur: 500 };
        await wait(450);
        A.fx = null;
        break;
      }
      case 'faint': {
        { const fc = e.side === 0 ? engine.p.c : engine.f.c; if (fc) creatureCry(fc, true); }
        await wait(250);
        sfx('faint');
        rumble(420, 0.7, 0.9);
        const sd = e.side === 0 ? 'ply' : 'foe';
        await tween(520, (p) => {
          A[`${sd}Y`] = 26 * p;
          A[`${sd}SY`] = 1 - 0.75 * p;
          A[`${sd}SX`] = 1 + 0.12 * p;
          A[`${sd}Alpha`] = 1 - p;
        }, easeIn);
        A[`${sd}Vis`] = false;
        A[`${sd}Y`] = 0; A[`${sd}SX`] = A[`${sd}SY`] = 1; A[`${sd}Alpha`] = 1;
        if (e.side === 0) hud.ply.hidden = true;
        else hud.foe.hidden = true;
        break;
      }
      case 'exp':
        await awardExp(e.foe, leveled);
        break;
      case 'foeNext': {
        // Like the original games: offer a free switch before the next creature comes out.
        if (engine.party.filter((c) => c.hp > 0).length > 1 && engine.p.c.hp > 0) {
          const next = displayName(engine.foes[e.index]);
          if (await ask(`${fmt(engine.trainer.name)} va a enviar a ${next}. ¿Querés cambiar de criatura?`, { battle: true })) {
            const idx = await openParty({ mode: 'battle', active: engine.pIndex });
            if (idx != null && idx >= 0 && idx !== engine.pIndex) await play(engine.freeSwitch(idx), leveled);
          }
        }
        await say(`¡${fmt(engine.trainer.name)} va a enviar a ${displayName(engine.foes[e.index])}!`, { battle: true, auto: 900 });
        const sub = engine.sendFoe(e.index);
        await sendOutFoe(engine.f.c);
        await play(sub.slice(1), leveled);
        break;
      }
      case 'needSwitch': {
        const alive = engine.party.map((c, i) => (c.hp > 0 ? i : -1)).filter((i) => i >= 0);
        const idx = alive.length === 1 ? alive[0] : await openParty({ mode: 'forced', active: engine.pIndex });
        const sub = engine.forceSwitch(idx);
        await play(sub, leveled);
        break;
      }
      case 'recall':
        sfx('cancel');
        await tween(200, (p) => (A.plyAlpha = 1 - p));
        A.plyVis = false;
        break;
      case 'send':
        await sendOutPlayer(engine.party[e.index], e);
        break;
      case 'throw':
        await throwAnim(e.item);
        break;
      case 'block':
        A.ball = null;
        A.foeVis = true;
        break;
      case 'shakes':
        await shakeAnim(e.n, e.caught);
        break;
      case 'end':
        return;
      default:
        break;
    }
  }
}

/** Defender recoils away from the attacker, squashes, then settles; the screen shakes on strong hits. */
/** Hit sparks in the colour of the move and a floating damage number; a critical hit adds a ring of stars. */
function burst(side, eff, crit, amount) {
  const [x, y] = side === 0 ? [84, 140] : [236, 72];
  const color = TYPES[A.lastType]?.color ?? '#fff';
  const n = eff > 1 ? 16 : eff < 1 ? 6 : 10;
  const now = performance.now();
  A.parts ??= [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, v = 40 + Math.random() * 60;
    A.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, c: i % 3 ? color : '#fff', t0: now, life: 420 + Math.random() * 200, s: crit ? 2 : 1 });
  }
  if (crit) for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    A.parts.push({ x, y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, c: '#ffe05a', t0: now, life: 380, s: 3 });
  }
  A.pops = (A.pops ?? []).concat({ x, y: y - 14, text: `-${amount}`, c: crit ? '#ffe05a' : eff > 1 ? '#ff8a6a' : '#fff', t0: now });
}
/** Golden sparkles rising around a creature: level up, or a capture. `side` 0 = player, 1 = foe. */
function sparkle(side, colors = ['#ffe05a', '#fff', '#7ac8f0']) {
  const [x, y] = side === 0 ? [84, 150] : [236, 80];
  const now = performance.now();
  A.parts ??= [];
  for (let i = 0; i < 28; i++) {
    A.parts.push({ x: x + (Math.random() - 0.5) * 50, y: y + Math.random() * 20, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 50, c: colors[i % colors.length], t0: now + i * 18, life: 700 + Math.random() * 300, s: i % 4 ? 1 : 2 });
  }
}
function drawBursts(g) {
  const now = performance.now();
  if (A.parts?.length) {
    A.parts = A.parts.filter((p) => now - p.t0 < p.life);
    for (const p of A.parts) {
      if (now < p.t0) continue; // delayed sparkles have not started yet
      const k = (now - p.t0) / 1000;
      g.globalAlpha = 1 - (now - p.t0) / p.life;
      g.fillStyle = p.c;
      g.fillRect(Math.round(p.x + p.vx * k), Math.round(p.y + p.vy * k + 60 * k * k), p.s, p.s);
    }
    g.globalAlpha = 1;
  }
  if (A.pops?.length) {
    A.pops = A.pops.filter((p) => now - p.t0 < 800);
    g.font = 'bold 10px monospace'; g.textAlign = 'center';
    for (const p of A.pops) {
      const k = (now - p.t0) / 800;
      g.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      g.fillStyle = '#16141e'; g.fillText(p.text, Math.round(p.x) + 1, Math.round(p.y - 18 * k) + 1);
      g.fillStyle = p.c; g.fillText(p.text, Math.round(p.x), Math.round(p.y - 18 * k));
    }
    g.globalAlpha = 1; g.textAlign = 'left';
  }
}

function hitReaction(sd, dir, eff) {
  if (!settings.anims) return;
  const push = eff > 1 ? 15 : eff < 1 ? 5 : 9;
  (async () => {
    await tween(90, (p) => { A[`${sd}X`] = dir * push * p; A[`${sd}SX`] = 1 - 0.07 * p; A[`${sd}SY`] = 1 + 0.05 * p; }, easeOut);
    await tween(260, (p) => { A[`${sd}X`] = dir * push * (1 - p); A[`${sd}SX`] = 0.93 + 0.07 * p; A[`${sd}SY`] = 1.05 - 0.05 * p; }, easeOut);
  })();
  if (eff > 1) tween(420, (p) => (A.shakeScreen = 4 * (1 - p)));
}

async function attackAnim(side, type, kind, name = '') {
  if (!settings.anims) return;
  const me = side === 0 ? 'ply' : 'foe';
  const dir = side === 0 ? 1 : -1;
  const color = TYPES[type]?.color ?? '#fff';
  const target = kind === 'status' ? side : 1 - side;
  const at = (sd) => (sd === 0 ? [84, 140] : [236, 72]);
  const burst = () => {
    const fx = { kind: kind === 'status' ? 'status' : 'hit', color, x: at(target)[0], y: at(target)[1], start: performance.now(), dur: 420 };
    A.fx = fx;
    setTimeout(() => { if (A.fx === fx) A.fx = null; }, 450);
  };
  const style = pickStyle(type, kind, name);
  if (style) {
    // typed effect: a short charge by the user, then the effect plays out on the target
    const [x1, y1] = at(side);
    const [x2, y2] = at(1 - side);
    const tgt = side === 0 ? 'foe' : 'ply';
    sfx('charge');
    await tween(180, (p) => { A[`${me}Glow`] = p * 0.8; A[`${me}X`] = -dir * 5 * p; A[`${me}SX`] = 1 + 0.05 * p; }, easeOut);
    A[`${me}X`] = 0; A[`${me}SX`] = 1;
    sfx(`fx_${style}`);
    await tween(FX_MS[style], (p) => {
      A.eff = { style, p, x1, y1: y1 - 10, x2, y2: y2 - 6, color };
      A[`${me}Glow`] = 0.8 * (1 - p);
      if (style === 'quake') {
        // the ground shakes under the target and everything on screen trembles
        A.shakeScreen = 4 * Math.sin(Math.min(1, p * 1.2) * Math.PI);
        A[`${tgt}Y`] = Math.sin(p * 46) * 3 * (1 - p);
        A[`${tgt}X`] = Math.sin(p * 31) * 2 * (1 - p);
      } else if (style === 'wind') {
        A[`${tgt}Rot`] = Math.sin(p * 22) * 0.16 * Math.sin(p * Math.PI);
        A[`${tgt}X`] = Math.sin(p * 17) * 5 * Math.sin(p * Math.PI);
      } else if (style === 'wave') {
        const hit = p > 0.6 ? (p - 0.6) / 0.4 : 0;
        A[`${tgt}X`] = (side === 0 ? 1 : -1) * 9 * Math.sin(hit * Math.PI);
      } else if (style === 'bolt') {
        A[`${tgt}Flash`] = p > 0.2 && p < 0.8 ? 1 : 0;
        A[`${tgt}X`] = Math.sin(p * 60) * 2 * (1 - p);
      } else if (style === 'rocks') {
        A[`${tgt}SY`] = 1 - 0.06 * Math.max(0, Math.sin(Math.max(0, p - 0.3) * Math.PI * 1.4));
      }
    });
    A.eff = null; A.shakeScreen = 0;
    for (const k of ['X', 'Y', 'Rot', 'Flash']) A[`${tgt}${k}`] = 0;
    A[`${tgt}SY`] = 1; A[`${me}Glow`] = 0;
    burst();
    await wait(80);
    return;
  }
  if (kind === 'fis') {
    // wind-up, dash into the target, hold on impact, recover
    await tween(170, (p) => { A[`${me}X`] = -dir * 9 * p; A[`${me}SX`] = 1 + 0.06 * p; A[`${me}SY`] = 1 - 0.09 * p; }, easeOut);
    sfx('dash');
    await tween(110, (p) => { A[`${me}X`] = dir * (-9 + 45 * p); A[`${me}SX`] = 1.06 - 0.12 * p; A[`${me}SY`] = 0.91 + 0.12 * p; }, easeIn);
    burst();
    await wait(90);
    // recover while the damage reaction plays
    tween(300, (p) => { A[`${me}X`] = dir * 36 * (1 - p); A[`${me}SX`] = 0.94 + 0.06 * p; A[`${me}SY`] = 1.03 - 0.03 * p; }, easeInOut).then(() => { A[`${me}X`] = 0; A[`${me}SX`] = A[`${me}SY`] = 1; });
  } else if (kind === 'status') {
    // sway and glow on the user
    sfx('aura');
    await tween(420, (p) => {
      A[`${me}X`] = Math.sin(p * Math.PI * 4) * 4 * (1 - p);
      A[`${me}Glow`] = Math.sin(p * Math.PI);
      A[`${me}SY`] = 1 + 0.05 * Math.sin(p * Math.PI);
    });
    A[`${me}X`] = 0; A[`${me}Glow`] = 0; A[`${me}SY`] = 1;
    burst();
    await wait(300);
  } else {
    // special: charge (grow and glow), launch an orb that travels, then burst on the target
    sfx('charge');
    await tween(300, (p) => { A[`${me}Glow`] = p; A[`${me}SX`] = A[`${me}SY`] = 1 + 0.1 * p; A[`${me}X`] = -dir * 4 * p; }, easeOut);
    sfx('orb');
    const [x1, y1] = at(side);
    const [x2, y2] = at(1 - side);
    await tween(300, (p) => { A.proj = { x1, y1: y1 - 10, x2, y2: y2 - 10, p, color }; A[`${me}X`] = -dir * 4 * (1 - p); A[`${me}SX`] = A[`${me}SY`] = 1.1 - 0.1 * p; A[`${me}Glow`] = 1 - p; }, easeIn);
    A.proj = null;
    A[`${me}X`] = 0; A[`${me}SX`] = A[`${me}SY`] = 1; A[`${me}Glow`] = 0;
    burst();
    await wait(120);
  }
}

async function throwAnim(item = 'esfera') {
  sfx('throw');
  A.ball = { x: 40, y: 170, shake: 0, item: ITEMS[item]?.ball ? item : 'esfera' };
  await tween(500, (p) => { A.ball.x = 40 + p * 196; A.ball.y = 170 - Math.sin(p * Math.PI) * 100 - p * 100; A.ball.shake = p * 12; });
  A.ball.shake = 0;
  // creature gets sucked in
  await tween(300, (p) => { A.foeAlpha = 1 - p; A.foeSX = A.foeSY = 1 - 0.7 * p; A.foeGlow = p; }, easeIn);
  A.foeVis = false;
  A.foeAlpha = 1; A.foeSX = A.foeSY = 1; A.foeGlow = 0;
  await tween(250, (p) => (A.ball.y = 70 + p * 26));
}

async function shakeAnim(n, caught) {
  for (let i = 0; i < n; i++) {
    await wait(350);
    sfx('shake');
    await tween(300, (p) => (A.ball.shake = Math.sin(p * Math.PI * 2) * 0.5));
  }
  await wait(400);
  if (caught) {
    const j = jingle('creature');
    sparkle(1, ['#fff', '#ffe05a', '#ff9af0']);
    A.tint = 'rgba(255,255,255,0.25)';
    await wait(300);
    A.tint = null;
    await j;
  } else {
    A.ball = null;
    A.foeVis = true;
    sfx('poof');
  }
}

/** Move the visible EXP bar to `exp` within `lvl` (the HUD shows creature `c` at that level). */
function expBar(c, lvl, exp, instant = false) {
  const el = hud.ply;
  el.querySelector('.bhud-lv').textContent = `Nv${lvl}`;
  const fill = el.querySelector('.expbar-fill');
  fill.classList.toggle('no-anim', instant);
  const lo = expForLevel(lvl), hi = expForLevel(lvl + 1);
  fill.style.setProperty('--exp', lvl >= 100 ? 1 : clamp((exp - lo) / (hi - lo), 0, 1));
  // The bar fills with a fast ticking, like the handheld counting up the points.
  if (!instant) for (let i = 0; i < 14; i++) setTimeout(() => sfx('expTick'), i * 50);
}

async function awardExp(foe, leveled) {
  for (const [c, share] of engine.expShares(foe)) {
    if (c.level >= 100) continue;
    // catch-up: beating something above your level pays more, so following the story keeps you near the trainers' levels
    const amt = Math.floor(share * Math.min(1.6, Math.max(1, foe.level / c.level)));
    const shown = c === engine.p.c;
    let lvl = c.level;
    if (shown) expBar(c, lvl, c.exp, true);
    await say(`¡${displayName(c)} ganó ${amt} puntos de EXP!`, { battle: true, auto: 1000 });
    const before = calcStats(c);
    const events = gainExp(c, amt);
    for (const ev of events) {
      if (ev.type === 'level') {
        leveled.add(c.uid);
        if (shown) {
          expBar(c, lvl, expForLevel(lvl + 1));
          await wait(950);
        }
        sfx('levelup');
        if (shown) sparkle(0);
        lvl = ev.level;
        if (shown) {
          setHud('ply', c, { instant: true });
          expBar(c, lvl, expForLevel(lvl), true);
        }
        await say(`¡${displayName(c)} subió al nivel ${ev.level}!`, { battle: true });
        await showStatGains(c, before);
        Object.assign(before, calcStats(c));
      } else if (ev.type === 'learn') {
        await learnFlow(c, ev.move, { battle: true });
      }
    }
    if (shown) {
      expBar(c, lvl, c.exp);
      await wait(950);
      setHud('ply', c, { instant: true });
    }
  }
}

async function showStatGains(c, before) {
  const now = calcStats(c);
  const box = h('div', { class: 'stat-gain' }, STAT_KEYS.map((k) => h('div', { class: 'row' }, h('span', { text: STAT_NAMES[k] }), h('b', { text: `+${now[k] - before[k]}` }))));
  uiRoot().append(box);
  await input.waitFor(['a', 'b']);
  box.replaceChildren(...STAT_KEYS.map((k) => h('div', { class: 'row' }, h('span', { text: STAT_NAMES[k] }), h('b', { text: String(now[k]) }))));
  await input.waitFor(['a', 'b']);
  box.remove();
}

/** Shared move-learning dialog (battle + level-up items). */
export async function learnFlow(c, moveId, opts = {}) {
  const mv = MOVES[moveId];
  const n = displayName(c);
  if (c.moves.length < 4) {
    learnMove(c, moveId);
    sfx('levelup');
    await say(`¡${n} aprendió ${mv.name}!`, opts);
    return;
  }
  await say([`${n} quiere aprender ${mv.name}.`, `Pero ${n} ya conoce cuatro movimientos.`], opts);
  while (true) {
    const yes = await ask(`¿Querés que olvide un movimiento para aprender ${mv.name}?`, opts);
    if (yes) {
      await say('¿Cuál movimiento debería olvidar?', opts);
      const idx = await chooseMove(c, { forgetting: true, incoming: moveId });
      if (idx >= 0) {
        const old = MOVES[c.moves[idx].id].name;
        learnMove(c, moveId, idx);
        await say([`${n} olvidó ${old}…`, `…y aprendió ${mv.name}.`], opts);
        return;
      }
    }
    if (await ask(`¿Dejar de aprender ${mv.name}?`, opts)) {
      await say(`${n} no aprendió ${mv.name}.`, opts);
      return;
    }
  }
}

async function handleCatch(foe) {
  const S = state();
  foe.ot = S.player.id;
  foe.status = foe.status ?? null;
  markCaught(foe.species);
  S.stats.caught++;
  await say(`¡Los datos de ${SPECIES[foe.species].name} se agregaron a la PokeDex!`, { battle: true });
  if (S.contest && S.safari?.contest) {
    // Capture contest: it waits in the box until the judges choose; no nickname.
    S.contest.uids.push(foe.uid);
    S.box.push(foe);
    await say(`${displayName(foe)} quedó registrado en el concurso.`, { battle: true });
    return;
  }
  if (await ask(`¿Querés ponerle un apodo a ${SPECIES[foe.species].name}?`, { battle: true })) {
    const raw = await textInput('Apodo (máx. 10 letras)', '');
    const nick = sanitizeName(raw, '');
    if (nick) foe.nickname = nick;
  }
  if (S.party.length < PARTY_MAX) S.party.push(foe);
  else {
    S.box.push(foe);
    await say(`${displayName(foe)} fue enviado a la Caja de la Policlínica.`, { battle: true });
  }
}

/** Standalone evolution animation (also used by Garrapiñada). */
const whites = new Map();
/** White copy of a sprite (same shape, flat white), for evolution and flash effects. */
function whiteOf(spr) {
  let c = whites.get(spr);
  if (!c) {
    c = document.createElement('canvas');
    c.width = spr.width; c.height = spr.height;
    const g = c.getContext('2d');
    g.drawImage(spr, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    whites.set(spr, c);
  }
  return c;
}

export async function evolutionScene(c, forcedTo = null) {
  const from = c.species;
  const to = forcedTo ?? canEvolve(c);
  if (!to) return;
  const prev = getRenderer();
  const prevMusic = currentTrack();
  let showing = from;
  let flashP = 0;
  let glow = 0;
  setRenderer((g, t) => {
    g.fillStyle = '#101020';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const a = i * 0.7 + t / 900;
      g.fillStyle = i % 2 ? '#f2e05c' : '#7ac8f0';
      g.fillRect(160 + Math.cos(a) * (60 + (i * 7) % 90), 110 + Math.sin(a) * (40 + (i * 5) % 60), 2, 2);
    }
    // light rays behind the creature
    g.save();
    g.translate(160, 110);
    g.rotate(t / 1500);
    g.fillStyle = 'rgba(255,240,170,0.10)';
    for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(150, -9); g.lineTo(150, 9); g.fill(); }
    g.restore();
    const spr = creatureSprite(showing);
    const lit = glow > 0 ? whiteOf(spr) : null;
    // while evolving the creature turns into a pulsing white silhouette that swells and shrinks
    const sz = SPRITE * 2 * (1 + glow * 0.08 * Math.sin(t / 70));
    g.drawImage(spr, 160 - sz / 2, 110 - sz / 2 - 0, sz, sz);
    if (lit) { g.globalAlpha = Math.min(1, glow * (0.55 + 0.45 * Math.sin(t / 90))); g.drawImage(lit, 160 - sz / 2, 110 - sz / 2, sz, sz); g.globalAlpha = 1; }
    if (flashP) { g.fillStyle = `rgba(255,255,255,${flashP})`; g.fillRect(0, 0, W, H); }
  });
  await say(`¿Qué? ¡${displayName(c)} está evolucionando!`);
  sfx('evolve');
  let cancelled = false;
  const pop = input.push((a) => { if (a === 'b') cancelled = true; });
  glow = 1;
  for (let i = 0; i < 10 && !cancelled; i++) {
    showing = i % 2 ? to : from;
    sfx('select');
    await wait(Math.max(80, 320 - i * 25));
  }
  glow = 0;
  pop();
  if (cancelled) {
    showing = from;
    await say(`¿Eh? ${displayName(c)} dejó de evolucionar.`);
  } else {
    await tween(300, (p) => (flashP = p));
    showing = to;
    const oldName = displayName(c);
    evolve(c, to);
    await tween(400, (p) => (flashP = 1 - p));
    flashP = 0;
    sfx('levelup');
    markCaught(to);
    await say(`¡Felicitaciones! ¡${oldName} evolucionó a ${SPECIES[to].name}!`);
    for (const [l, m] of SPECIES[to].learn) if (l === c.level && !c.moves.some((x) => x.id === m)) await learnFlow(c, m);
  }
  setRenderer(prev);
  if (prevMusic) playMusic(prevMusic);
}

/** Build a wild creature. */
export function wildCreature(species, level) {
  return createCreature(species, level);
}

/** QA hook: plays one attack animation in the open battle. */
export const previewAttack = (side, type, kind, name) => attackAnim(side, type, kind, name);
