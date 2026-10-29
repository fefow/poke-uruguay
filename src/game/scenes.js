// Title screen, new-game intro, hall of fame and credits.
import { W, H, setRenderer, text } from '../gfx/screen.js';
import { creatureSprite, SPRITE } from '../gfx/creatures.js';
import { charSprite } from '../gfx/characters.js';
import { DEX_ORDER, SPECIES } from '../data/species.js';
import { playMusic, sfx } from '../core/audio.js';
import { input } from '../core/input.js';
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

export function titleRenderer(g, t) {
  drawSky(g, t);
  // flying Pamperón silhouette
  const px = ((t / 18) % (W + 200)) - 100;
  g.globalAlpha = 0.85;
  g.drawImage(creatureSprite('pamperon'), px, 30 + Math.sin(t / 500) * 6, 48, 48);
  g.globalAlpha = 1;
  text(g, 'UruMon', W / 2, 36, { size: 28, align: 'center', color: '#fff', shadow: '#1d2a5c' });
  text(g, 'La Leyenda del Pampero', W / 2, 72, { size: 8, align: 'center', color: '#f8d040', shadow: '#2a1830' });
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

// ---------------------------------------------------------------- INTRO
export async function newGameIntro() {
  let showProf = true;
  let mon = null;
  setRenderer((g, t) => {
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#2a3a6a');
    grd.addColorStop(1, '#5aa8e8');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 9; i++) g.fillRect(0, i * 28 + 10, W, 10);
    if (showProf) g.drawImage(charSprite('prof', 'down', 0), 0, 0, 16, 17, 112, 40, 96, 102);
    if (mon) g.drawImage(creatureSprite(mon), 210, 80 + Math.sin(t / 300) * 2, 80, 80);
  });
  playMusic('town');
  await fadeIn(400);
  await say(['¡Hola! ¡Bienvenido al mundo de UruMon!', 'Me llamo Arazá, pero todos me dicen la Profesora.'], { name: 'Prof. Arazá' });
  mon = 'carpinchito';
  sfx('confirm');
  await say(['En este país viven criaturas maravillosas.', 'Algunas nadan en el Río de la Plata, otras corren por las praderas o vuelan sobre las sierras.',
    'La gente vive con ellas, entrena con ellas… y a veces, combate con ellas.'], { name: 'Prof. Arazá' });
  mon = null;
  await say('Pero contame de vos. ¿Cómo sos?', { name: 'Prof. Arazá', keep: true });
  const look = await choose(['Chico', 'Chica'], { cancel: false });
  closeDialog();
  const S = state();
  S.player.look = look === 0 ? 'player_m' : 'player_f';
  const raw = await textInput('¿Cómo te llamás? (máx. 10 letras)', look === 0 ? 'Bruno' : 'Martina');
  S.player.name = sanitizeName(raw, look === 0 ? 'Bruno' : 'Martina');
  await say(`¡Así que te llamás {player}! Qué lindo nombre.`, { name: 'Prof. Arazá' });
  await say('Y este es mi nieto. Se la pasa compitiendo con vos desde que eran chiquitos. ¿Cómo se llamaba?', { name: 'Prof. Arazá', keep: true });
  const rawR = await textInput('Nombre de tu rival', 'Facu');
  S.rivalName = sanitizeName(rawR, 'Facu');
  await say(['¡Claro! {rival}. ¿Cómo me pude olvidar?', '{player}, tu propia leyenda está por empezar.', '¡Un mundo de sueños y aventuras te espera en el Uruguay! ¡Vamos!'], { name: 'Prof. Arazá' });
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
  ['UruMon', 'La Leyenda del Pampero'],
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
    h('span', { text: `Medallas ${s.summary.badges} · UruDex ${s.summary.dex} · ${formatTime(s.summary.playtime)}` }),
    s.summary.champion ? h('span', { class: 'champ', text: '★ Campeón' }) : null);
}

export { uiRoot, SPRITE };
