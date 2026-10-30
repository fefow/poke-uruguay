// Battle presentation: canvas animation + DOM HUD/menus driving BattleEngine.
import { BattleEngine, STATUS_SHORT } from './battle-engine.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { TYPES } from '../data/types.js';
import { ITEMS } from '../data/items.js';
import { creatureSprite, SPRITE } from '../gfx/creatures.js';
import { charSprite } from '../gfx/characters.js';
import { setRenderer, getRenderer, W, H, dayTint } from '../gfx/screen.js';
import { vignette } from '../gfx/fx.js';
import { h, wait as baseWait, clamp } from '../core/util.js';
import { sfx, playMusic, currentTrack } from '../core/audio.js';
import { input } from '../core/input.js';
import { say, choose, ask, closeDialog, uiRoot, textInput, fmt } from './ui.js';
import { state, settings, earn, markSeen, markCaught, removeItem, PARTY_MAX } from './state.js';
import { createCreature, displayName, maxHp, expForLevel, gainExp, learnMove, canEvolve, evolve, calcStats, STAT_KEYS, STAT_NAMES } from './creature.js';
import { openParty, openBag } from './menus.js';
import { sanitizeName } from '../core/util.js';
import { info as logInfo } from '../core/debuglog.js';

const BG = {
  field: ['#9ad4f2', '#d8f0ff', '#78c850', '#5aa83c'],
  beach: ['#7ac8f0', '#d8f0ff', '#f0dca0', '#d8c080'],
  city: ['#b8c8e0', '#e8eef8', '#a8a49c', '#8a867e'],
  canyon: ['#e8b888', '#f8e0c0', '#a8845a', '#8a6a4a'],
  indoor: ['#e6d8b8', '#f2e8d0', '#d8d0c0', '#c8c0b0'],
};

// Animation state read by the renderer.
const A = {
  bg: 'field', t: 0,
  foe: null, ply: null, // species keys
  foeX: 0, plyX: 0, foeY: 0, plyY: 0,
  foeSX: 1, foeSY: 1, foeRot: 0, foeGlow: 0, plySX: 1, plySY: 1, plyRot: 0, plyGlow: 0, proj: null,
  foeVis: true, plyVis: true, foeAlpha: 1, plyAlpha: 1, foeFlash: 0, plyFlash: 0,
  foeTrainer: null, trainerX: 0,
  playerTrainerX: 0, showPlayerTrainer: false,
  ball: null, // {x,y,shake}
  fx: null, // {type,color,x,y,t}
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
  grd = g.createLinearGradient(0, 120, 0, H);
  grd.addColorStop(0, g1); grd.addColorStop(1, g2);
  g.fillStyle = grd; g.fillRect(0, 120, W, H - 120);
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
    g.drawImage(spr, 0, 0, 16, 17, 236 - 24 + A.trainerX, 104 - 66, 48, 51 * 1.3);
  }
  if (A.showPlayerTrainer) {
    const spr = charSprite(state().player.look, 'up', 0);
    g.drawImage(spr, 0, 0, 16, 17, 60 + A.playerTrainerX, 180 - 70, 48, 68);
  }
  // creatures: breathing idle + per-side transform (offset, squash and stretch, rotation, glow)
  if (A.foe && A.foeVis) drawCreature(g, creatureSprite(A.foe), 236, 106, SPRITE, 'foe', t, 0);
  if (A.ply && A.plyVis) drawCreature(g, creatureSprite(A.ply, { back: true }), 84, 184, SPRITE * 1.25, 'ply', t, 1);
  if (A.proj) drawProjectile(g, A.proj);
  if (A.ball) drawBall(g, A.ball.x, A.ball.y, A.ball.shake);
  if (A.fx) drawFx(g, A.fx, t);
  g.restore();
  const tint = dayTint();
  if (tint && A.bg !== 'indoor') { g.fillStyle = tint; g.fillRect(0, 0, W, H); }
  vignette(g, 0.9);
  if (A.tint) { g.fillStyle = A.tint; g.fillRect(0, 0, W, H); }
}

function drawCreature(g, spr, cx, base, size, side, t, phase) {
  const breath = Math.sin(t / 650 + phase);
  const flash = A[`${side}Flash`] && Math.floor(t / 60) % 2;
  g.save();
  g.globalAlpha = A[`${side}Alpha`];
  g.translate(cx + A[`${side}X`], base + A[`${side}Y`] + Math.sin(t / 500 + phase) * 1.2);
  g.rotate(A[`${side}Rot`]);
  g.scale(A[`${side}SX`] * (1 - breath * 0.012), A[`${side}SY`] * (1 + breath * 0.025));
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

function drawBall(g, x, y, shake = 0) {
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.rotate(shake);
  g.fillStyle = '#1a1a24'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
  g.fillStyle = '#7ac8f0'; g.beginPath(); g.arc(0, 0, 5, Math.PI, 0); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 5, 0, Math.PI); g.fill();
  g.fillStyle = '#1a1a24'; g.fillRect(-5, -1, 10, 2);
  g.fillStyle = '#f2c02a'; g.beginPath(); g.arc(0, 0, 2, 0, 7); g.fill();
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
  return new Promise((res) => {
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
  const caught = el.querySelector('.bhud-caught');
  if (caught) caught.hidden = !(engine?.wild && state().dex.caught.includes(c.species));
}

function setBalls(party, show) {
  hud.balls.replaceChildren(...(show ? party.map((c) => h('i', { class: c.hp > 0 ? (c.status ? 'is-status' : '') : 'is-fainted' })) : []));
}

// ---------------------------------------------------------------- RUN
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
  logInfo(`Batalla ${wild ? 'salvaje' : `vs ${trainer?.name ?? 'entrenador'}`}: ${foes.map((f) => `${f.species} nv${f.level}`).join(', ')}`);
  Object.assign(A, { bg, foe: null, ply: null, foeX: 0, plyX: 0, foeY: 0, plyY: 0, foeSX: 1, foeSY: 1, foeRot: 0, foeGlow: 0, plySX: 1, plySY: 1, plyRot: 0, plyGlow: 0, proj: null, foeVis: true, plyVis: true, foeAlpha: 1, plyAlpha: 1, foeFlash: 0, plyFlash: 0, foeTrainer: null, trainerX: 0, ball: null, fx: null, shakeScreen: 0, tint: null, showPlayerTrainer: true, playerTrainerX: 0 });
  playMusic(music);
  sfx('encounter');
  await introFlash();
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
    // Evolutions after battle
    if (result !== 'lose') {
      for (const c of S.party) if (leveled.has(c.uid) && canEvolve(c)) await evolutionScene(c);
    }
    closeDialog();
    return result;
  } finally {
    hud.layer.remove();
    hud = null;
    engine = null;
    setRenderer(prevRenderer);
    if (prevMusic) playMusic(prevMusic);
  }
}

async function introFlash() {
  const prev = getRenderer();
  setRenderer((g, t) => {
    prev?.(g, t);
    if (Math.floor(t / 80) % 2) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(0, 0, W, H); }
  });
  await wait(settings.anims ? 600 : 150);
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

async function sendOutFoe(c) {
  A.foe = c.species;
  A.foeVis = false;
  A.ball = { x: 236, y: 60, shake: 0 };
  sfx('throw');
  await tween(250, (p) => (A.ball.y = 60 + p * 30));
  A.ball = null;
  A.foeVis = true;
  await popIn('foe');
  markSeen(c.species);
  setHud('foe', c, { instant: true });
}

async function sendOutPlayer(c) {
  A.ply = c.species;
  A.plyVis = false;
  A.ball = { x: 30, y: 110, shake: 0 };
  sfx('throw');
  await tween(300, (p) => { A.ball.x = 30 + p * 54; A.ball.y = 110 + Math.sin(p * Math.PI) * -30 + p * 50; });
  A.ball = null;
  A.plyVis = true;
  await popIn('ply');
  setHud('ply', c, { instant: true });
}

function recordBattle(trainer) {
  // Kept for future server-side replay validation (Supabase phase).
  const S = state();
  S.battleLog ??= [];
  S.battleLog.push({ id: trainer.id, at: Date.now(), ...engine.log });
  if (S.battleLog.length > 20) S.battleLog.shift();
}

// ---------------------------------------------------------------- MENUS
let lastAction = 0;
async function chooseAction() {
  const c = engine.p.c;
  await say(`¿Qué va a hacer ${displayName(c)}?`, { battle: true, keep: true });
  const pick = await choose(['Luchar', 'Mochila', 'Equipo', 'Huir'], { cancel: false, cls: 'menu-battle', cols: 2, start: lastAction });
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

async function chooseMove(c, { forgetting = false } = {}) {
  closeDialog();
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
  const r = await choose(opts, { cls: 'menu-moves', onMove: show, cols: 2 });
  info.remove();
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
        await attackAnim(e.side, e.move, e.kind);
        break;
      case 'damage': {
        const side = e.side === 0 ? 'ply' : 'foe';
        sfx(e.eff > 1 ? 'super' : e.eff < 1 ? 'weak' : 'hit');
        A[e.side === 0 ? 'plyFlash' : 'foeFlash'] = 1;
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
        A.fx = { kind: 'status', color: col, x: e.side === 0 ? 84 : 236, y: e.side === 0 ? 140 : 70, start: performance.now(), dur: 500 };
        await wait(450);
        A.fx = null;
        break;
      }
      case 'faint': {
        sfx('faint');
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
        await sendOutPlayer(engine.party[e.index]);
        break;
      case 'throw':
        await throwAnim();
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
function hitReaction(sd, dir, eff) {
  if (!settings.anims) return;
  const push = eff > 1 ? 15 : eff < 1 ? 5 : 9;
  (async () => {
    await tween(90, (p) => { A[`${sd}X`] = dir * push * p; A[`${sd}SX`] = 1 - 0.07 * p; A[`${sd}SY`] = 1 + 0.05 * p; }, easeOut);
    await tween(260, (p) => { A[`${sd}X`] = dir * push * (1 - p); A[`${sd}SX`] = 0.93 + 0.07 * p; A[`${sd}SY`] = 1.05 - 0.05 * p; }, easeOut);
  })();
  if (eff > 1) tween(420, (p) => (A.shakeScreen = 4 * (1 - p)));
}

async function attackAnim(side, type, kind) {
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
  if (kind === 'fis') {
    // wind-up, dash into the target, hold on impact, recover
    await tween(170, (p) => { A[`${me}X`] = -dir * 9 * p; A[`${me}SX`] = 1 + 0.06 * p; A[`${me}SY`] = 1 - 0.09 * p; }, easeOut);
    await tween(110, (p) => { A[`${me}X`] = dir * (-9 + 45 * p); A[`${me}SX`] = 1.06 - 0.12 * p; A[`${me}SY`] = 0.91 + 0.12 * p; }, easeIn);
    burst();
    await wait(90);
    // recover while the damage reaction plays
    tween(300, (p) => { A[`${me}X`] = dir * 36 * (1 - p); A[`${me}SX`] = 0.94 + 0.06 * p; A[`${me}SY`] = 1.03 - 0.03 * p; }, easeInOut).then(() => { A[`${me}X`] = 0; A[`${me}SX`] = A[`${me}SY`] = 1; });
  } else if (kind === 'status') {
    // sway and glow on the user
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
    await tween(300, (p) => { A[`${me}Glow`] = p; A[`${me}SX`] = A[`${me}SY`] = 1 + 0.1 * p; A[`${me}X`] = -dir * 4 * p; }, easeOut);
    const [x1, y1] = at(side);
    const [x2, y2] = at(1 - side);
    await tween(300, (p) => { A.proj = { x1, y1: y1 - 10, x2, y2: y2 - 10, p, color }; A[`${me}X`] = -dir * 4 * (1 - p); A[`${me}SX`] = A[`${me}SY`] = 1.1 - 0.1 * p; A[`${me}Glow`] = 1 - p; }, easeIn);
    A.proj = null;
    A[`${me}X`] = 0; A[`${me}SX`] = A[`${me}SY`] = 1; A[`${me}Glow`] = 0;
    burst();
    await wait(120);
  }
}

async function throwAnim() {
  sfx('throw');
  A.ball = { x: 40, y: 170, shake: 0 };
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
    sfx('catch');
    A.tint = 'rgba(255,255,255,0.25)';
    await wait(300);
    A.tint = null;
  } else {
    A.ball = null;
    A.foeVis = true;
    sfx('cancel');
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
}

async function awardExp(foe, leveled) {
  for (const [c, amt] of engine.expShares(foe)) {
    if (c.level >= 100) continue;
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
      const idx = await chooseMove(c, { forgetting: true });
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
export async function evolutionScene(c, forcedTo = null) {
  const from = c.species;
  const to = forcedTo ?? canEvolve(c);
  if (!to) return;
  const prev = getRenderer();
  const prevMusic = currentTrack();
  let showing = from;
  let flashP = 0;
  setRenderer((g, t) => {
    g.fillStyle = '#101020';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const a = i * 0.7 + t / 900;
      g.fillStyle = i % 2 ? '#f2e05c' : '#7ac8f0';
      g.fillRect(160 + Math.cos(a) * (60 + (i * 7) % 90), 110 + Math.sin(a) * (40 + (i * 5) % 60), 2, 2);
    }
    const spr = creatureSprite(showing);
    g.drawImage(spr, 160 - SPRITE, 110 - SPRITE, SPRITE * 2, SPRITE * 2);
    if (flashP) { g.fillStyle = `rgba(255,255,255,${flashP})`; g.fillRect(0, 0, W, H); }
  });
  await say(`¿Qué? ¡${displayName(c)} está evolucionando!`);
  sfx('evolve');
  let cancelled = false;
  const pop = input.push((a) => { if (a === 'b') cancelled = true; });
  for (let i = 0; i < 10 && !cancelled; i++) {
    showing = i % 2 ? to : from;
    await wait(Math.max(80, 320 - i * 25));
  }
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
