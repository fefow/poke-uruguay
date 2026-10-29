// Title screen, new-game intro, hall of fame and credits.
import { W, H, setRenderer, text } from '../gfx/screen.js';
import { creatureSprite, SPRITE } from '../gfx/creatures.js';
import { charSprite } from '../gfx/characters.js';
import { DEX_ORDER, SPECIES } from '../data/species.js';
import { playMusic, sfx } from '../core/audio.js';
import { input, keyName } from '../core/input.js';
import { h, wait, sanitizeName, formatTime } from '../core/util.js';
import { say, choose, textInput, fadeOut, fadeIn, uiRoot, closeDialog } from './ui.js';
import { state } from './state.js';
import { displayName } from './creature.js';

// ---------------------------------------------------------------- TITLE
function drawSky(g, t) {
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
}

/** Draws a sprite with its wings beating: columns away from the body swing up and down with the flap phase. */
function drawFlapping(g, img, x, y, w, h, t, { speed = 160, amp = 0.22 } = {}) {
  const sw = img.width, sh = img.height, cols = 48;
  const half = cols / 2, cw = w / cols;
  const flap = Math.sin(t / speed);
  for (let i = 0; i < cols; i++) {
    const d = (i + 0.5 - half) / half;
    const lift = -(Math.abs(d) ** 1.6) * flap * amp * h;
    const body = Math.sin(t / speed * 0.5) * 0.02 * h;
    g.drawImage(img, (i * sw) / cols, 0, sw / cols, sh, x + i * cw, y + lift + body, cw + 0.6, h * (1 + Math.abs(d) * flap * 0.05));
  }
}

export function titleRenderer(g, t) {
  drawSky(g, t);
  // flying Pamperón silhouette
  const px = ((t / 18) % (W + 200)) - 100;
  g.globalAlpha = 0.85;
  drawFlapping(g, creatureSprite('pamperon'), px, 30 + Math.sin(t / 500) * 6, 48, 48, t);
  g.globalAlpha = 1;
  text(g, 'Poke Uruguay', W / 2, 38, { size: 20, align: 'center', color: '#fff', shadow: '#1d2a5c' });
  text(g, 'Aventuras en tierras charruas', W / 2, 72, { size: 8, align: 'center', color: '#f8d040', shadow: '#2a1830' });
  // starters parade on the shore
  const keys = ['ceibito', 'tejuchispa', 'carpinchito'];
  keys.forEach((k, i) => {
    const bob = Math.round(Math.sin(t / 260 + i) * 2);
    g.drawImage(creatureSprite(k), 8 + i * 58, 168 + bob, 60, 60);
  });
}

export function startTitle() {
  setRenderer(titleRenderer);
  playMusic('title');
}


// ---------------------------------------------------------------- INTRO CINEMATIC
const sky = (g, stops) => {
  const grd = g.createLinearGradient(0, 0, 0, H);
  stops.forEach(([o, c]) => grd.addColorStop(o, c));
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
};
const stars = (g, t, n = 50, maxY = 120) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = (Math.floor(t / 400) + i) % 5 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)';
    g.fillRect((i * 97) % W, (i * 53) % maxY, i % 7 ? 1 : 2, i % 7 ? 1 : 2);
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

const CINEMATIC = [
  {
    dur: 6500,
    lines: ['Entre el río y el océano existe una tierra', 'de cuchillas, arroyos y cielo abierto.'],
    draw(g, t, p) {
      sky(g, [[0, '#070a22'], [0.6, '#1d2a5c'], [1, '#3a3a7a']]);
      stars(g, t);
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1;
      if (p > 0.15 && p < 0.55) { const q = (p - 0.15) / 0.4; g.beginPath(); g.moveTo(60 + q * 200, 20 + q * 50); g.lineTo(60 + q * 200 - 18, 20 + q * 50 - 7); g.stroke(); }
      hills(g, t, 190, 6, '#0d1230', 0.004, 140);
      hills(g, t, 205, 5, '#070a1c', 0.008, 100);
      ceibo(g, 250 - p * 20, 200, 1.4);
    },
  },
  {
    dur: 6500,
    lines: ['Sus costas son recorridas por criaturas', 'que nadan, cantan y esperan la marea.'],
    draw(g, t, p) {
      sky(g, [[0, '#2a3a7a'], [0.45, '#e86a4a'], [0.62, '#f8c070'], [0.621, '#2a6ab0'], [1, '#143a68']]);
      g.fillStyle = '#ffe070'; g.beginPath(); g.arc(230, 132 - p * 14, 18, 0, 7); g.fill();
      for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(255,224,150,${0.5 - i * 0.025})`; const w = 30 - i * 1.3 + Math.sin(t / 300 + i) * 5; g.fillRect(230 - w / 2, 150 + i * 5, w, 1); }
      g.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 12; i++) g.fillRect((i * 61 + t / 30) % W, 160 + (i * 17) % 70, 18, 1);
      const bob = Math.sin(t / 500) * 3;
      g.drawImage(creatureSprite('ballenaplata'), 40 + p * 40, 105 + bob, 100, 100);
      if (Math.floor(t / 900) % 2) { g.fillStyle = 'rgba(220,240,255,0.8)'; g.fillRect(70 + p * 40, 104 + bob, 2, 8); g.fillRect(68 + p * 40, 100 + bob, 6, 3); }
    },
  },
  {
    dur: 6500,
    lines: ['En sus campos y sierras viven criaturas', 'que acompañan a la gente desde siempre.'],
    draw(g, t, p) {
      sky(g, [[0, '#4a90d8'], [0.7, '#bfe4f8'], [1, '#e8f4d0']]);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      for (const [x, y, r] of [[40, 40, 14], [150, 28, 10], [250, 54, 16]]) { const cx = (x + t / 60) % (W + 60) - 30; g.beginPath(); g.arc(cx, y, r, 0, 7); g.arc(cx + r, y + 3, r * 0.8, 0, 7); g.arc(cx - r, y + 3, r * 0.7, 0, 7); g.fill(); }
      hills(g, t, 130, 14, '#7ab860', 0.01, 160);
      hills(g, t, 160, 10, '#5aa046', 0.02, 120);
      hills(g, t, 190, 8, '#3a8038', 0.04, 90);
      const cycle = (t / 18) % (W + 120);
      g.drawImage(creatureSprite('nandulin'), W - cycle, 148 + Math.abs(Math.sin(t / 120)) * -3, 56, 56);
      g.drawImage(creatureSprite('teruterito'), ((t / 26) % (W + 100)) - 60, 70 + Math.sin(t / 400) * 8, 40, 40);
      ceibo(g, 60 - p * 30, 188, 1.6);
    },
  },
  {
    dur: 7000,
    lines: ['Dicen que cuando el Pampero cruza el cielo,', 'el país entero se detiene a mirarlo.'],
    draw(g, t, p) {
      sky(g, [[0, '#14182c'], [0.5, '#3a4466'], [1, '#6a6a7a']]);
      g.fillStyle = 'rgba(30,34,56,0.9)';
      for (let i = 0; i < 9; i++) { const x = (i * 47 + t / 25) % (W + 80) - 40; g.beginPath(); g.arc(x, 24 + (i % 3) * 16, 26, 0, 7); g.arc(x + 24, 30 + (i % 3) * 16, 20, 0, 7); g.fill(); }
      const flash = (Math.floor(t / 700) % 4 === 2) && (t % 700 < 140);
      if (flash) {
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#fff8c0'; g.lineWidth = 2; g.beginPath();
        let x = 60 + (Math.floor(t / 700) * 53) % 200, y = 30; g.moveTo(x, y);
        while (y < 170) { x += (Math.sin(y * 3.1 + x) * 9) | 0; y += 14; g.lineTo(x, y); }
        g.stroke();
      }
      hills(g, t, 190, 6, '#1a2030', 0.01, 140);
      const k = Math.min(1, p * 1.5);
      g.globalAlpha = 0.35 + 0.65 * k;
      drawFlapping(g, creatureSprite('pamperon'), 120 + (1 - k) * 160, 50 - k * 10 + Math.sin(t / 300) * 4, 130 * (0.5 + k * 0.5), 130 * (0.5 + k * 0.5), t, { speed: 210, amp: 0.2 });
      g.globalAlpha = 1;
    },
  },
  {
    dur: 4200,
    lines: [],
    draw(g, t, p) {
      sky(g, [[0, '#1d2a5c'], [0.5, '#e86a4a'], [1, '#f8d070']]);
      g.save(); g.translate(160, 120); g.rotate(t / 9000); g.fillStyle = 'rgba(248,208,64,0.6)';
      for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.beginPath(); g.moveTo(-6, -40); g.lineTo(0, i % 2 ? -110 : -90); g.lineTo(6, -40); g.fill(); }
      g.restore();
      g.fillStyle = '#ffe070'; g.beginPath(); g.arc(160, 120, 38, 0, 7); g.fill();
      const a = Math.min(1, p * 3);
      g.globalAlpha = a;
      text(g, 'Poke Uruguay', W / 2, 96, { size: 20, align: 'center', color: '#fff', shadow: '#1d2a5c' });
      text(g, 'Aventuras en tierras charruas', W / 2, 132, { size: 8, align: 'center', color: '#fff6c0', shadow: '#2a1830' });
      g.globalAlpha = 1;
    },
  },
];

async function playCinematic() {
  let idx = 0;
  let start = performance.now();
  let skipAll = false;
  setRenderer((g, t) => {
    const sc = CINEMATIC[Math.min(idx, CINEMATIC.length - 1)];
    const el = performance.now() - start;
    const p = Math.min(1, el / sc.dur);
    g.imageSmoothingEnabled = false;
    sc.draw(g, t, p);
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
    while (!skipAll && performance.now() - start < CINEMATIC[idx].dur) await wait(60);
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
      g.drawImage(creatureSprite(c.species), x, y, 72, 72);
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
  ['Poke Uruguay', 'Aventuras en tierras charruas'],
  ['Una aventura por el Uruguay', ''],
  ['Diseño y programación', 'Hecho con Claude para Dusius'],
  ['Lugares', 'Colonia · Montevideo · Punta del Este'],
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
    g.drawImage(creatureSprite(k), W - 70, H - 72, 64, 64);
  });
  await new Promise((res) => {
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      scroll += ((now - last) / 40) * speed;
      last = now;
      if (scroll > total) return res();
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
