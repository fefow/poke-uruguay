// Small real-time games for the Fiesta de la Patria Gaucha (data/fiesta.ts). Each one opens a framed box over the
// world with a pixel-art canvas, takes the usual buttons (A, left/right; the on-screen pad sends the same) and
// resolves with the result. Nothing waits after the game ends: the box closes right away and the script goes on.
import { h } from '../core/util.ts';
import { input } from '../core/input.ts';
import { sfx } from '../core/audio.ts';
import { uiRoot } from './ui.ts';
import { charSprite } from '../gfx/characters.ts';
import { creatureSprite } from '../gfx/creatures.ts';
import { state } from './state.ts';

const CW = 160, CH = 72;

function stage(title: string, hint: string, w = CW, hgt = CH) {
  const cv = h('canvas', { class: 'minigame-canvas', width: w, height: hgt }) as HTMLCanvasElement;
  cv.style.aspectRatio = `${w} / ${hgt}`;
  const msg = h('div', { class: 'minigame-hint', text: hint });
  const parts: HTMLElement[] = [];
  if (title) parts.push(h('div', { class: 'menu-title', text: title }));
  parts.push(cv);
  if (hint) parts.push(msg);
  const box = h('div', { class: 'minigame' }, ...parts);
  uiRoot().append(box);
  // pixel art only at whole zoom levels: the widest multiple of the canvas that fits the box
  const avail = cv.clientWidth;
  if (avail >= w) { cv.style.width = `${Math.floor(avail / w) * w}px`; cv.style.alignSelf = 'center'; }
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { box, cv, g, msg };
}

const sky = (g: CanvasRenderingContext2D) => {
  g.fillStyle = '#9ad4f4'; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#c8e8f8'; g.fillRect(0, 30, CW, 8);
  g.fillStyle = '#5aa04a'; g.fillRect(0, 50, CW, CH - 50);
  g.fillStyle = '#78c850'; g.fillRect(0, 50, CW, 3);
  g.fillStyle = '#4a8a3a'; for (let x = 3; x < CW; x += 11) g.fillRect(x, 57 + (x % 3) * 4, 2, 1);
};
const playerLook = () => state()?.player.look ?? 'player_m';

/** A rider on a horse, facing right, at (x, y) = top-left of the horse. `tilt` leans the rider (radians). */
function rider(g: CanvasRenderingContext2D, x: number, y: number, frame: number, tilt = 0, hop = 0) {
  g.drawImage(creatureSprite('criollo'), Math.round(x), Math.round(y - hop), 32, 32);
  g.save();
  g.translate(Math.round(x + 16), Math.round(y + 12 - hop));
  g.rotate(tilt);
  g.drawImage(charSprite(playerLook(), 'right', frame), -8, -15, 16, 17);
  g.restore();
}

/**
 * La sortija: the rider gallops under the arch and the player presses A when the tip of the stick is under the ring.
 * Three passes, each one faster with a smaller margin. Resolves with the number of rings taken (0..3).
 */
export function sortija(): Promise<number> {
  return new Promise((resolve) => {
    const { box, g, msg } = stage('La sortija', 'Apretá A cuando la vara pase justo por la argolla.');
    const RING = { x: 80, y: 22 };
    const SPEED = [70, 92, 116], TOL = [6, 5, 4];
    let pass = 0, x = -40, tried = false, hits = 0, flash = 0, flashText = '', got = false, raf = 0, last = performance.now(), over = false;
    const tip = () => x + 34; // the stick points forward and up from the rider's hand
    const finish = () => {
      if (over) return;
      over = true;
      cancelAnimationFrame(raf);
      pop();
      box.remove();
      resolve(hits);
    };
    const press = () => {
      if (tried || over) return;
      tried = true;
      if (Math.abs(tip() - RING.x) <= TOL[pass]) { hits++; got = true; flashText = '¡Sortija!'; sfx('confirm'); }
      else { flashText = tip() < RING.x ? 'Muy pronto' : 'Muy tarde'; sfx('bump'); }
      flash = 0.9;
    };
    const pop = input.push((a) => { if (a === 'a') press(); else if (a === 'b' && pass === 0 && !tried && x < 0) finish(); });
    box.addEventListener('pointerdown', press);
    const draw = () => {
      sky(g);
      // the arch
      g.fillStyle = '#2a1a10'; g.fillRect(58, 6, 5, 46); g.fillRect(97, 6, 5, 46); g.fillRect(56, 5, 48, 4);
      g.fillStyle = '#9a6c40'; g.fillRect(59, 6, 3, 46); g.fillRect(98, 6, 3, 46); g.fillRect(56, 6, 48, 2);
      g.fillStyle = '#e0263a'; g.fillRect(RING.x, 9, 1, RING.y - 12);
      if (!got) { g.strokeStyle = '#2a1a10'; g.lineWidth = 2; g.beginPath(); g.arc(RING.x + 0.5, RING.y, 3, 0, 7); g.stroke(); g.strokeStyle = '#f2c02a'; g.lineWidth = 1; g.beginPath(); g.arc(RING.x + 0.5, RING.y, 3, 0, 7); g.stroke(); }
      // horse, rider and the stick
      const step = Math.floor(performance.now() / 90) % 2;
      rider(g, x, 22, step + 1, 0, step);
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 22, 34 - step); g.lineTo(tip(), RING.y + 1); g.stroke();
      if (got) { g.strokeStyle = '#f2c02a'; g.beginPath(); g.arc(tip() - 2, RING.y + 2, 3, 0, 7); g.stroke(); }
      // score
      g.fillStyle = '#14141e'; g.font = '8px "Press Start 2P", monospace'; g.textBaseline = 'top';
      g.fillText(`${Math.min(pass + 1, 3)}/3`, 4, 61);
      for (let i = 0; i < 3; i++) { g.fillStyle = '#2a1a10'; g.fillRect(CW - 31 + i * 9, 61, 8, 8); g.fillStyle = i < hits ? '#f2c02a' : '#e8e0c8'; g.fillRect(CW - 30 + i * 9, 62, 6, 6); }
      if (flash > 0) { g.fillStyle = got ? '#1a6a2a' : '#a8182a'; g.textAlign = 'center'; g.fillText(flashText, CW / 2, 61); g.textAlign = 'left'; }
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      x += SPEED[pass] * dt;
      flash -= dt;
      box.dataset.near = !tried && Math.abs(tip() - RING.x) <= TOL[pass] ? '1' : '0'; // read by the QA scripts
      if (x > CW + 8) {
        if (!tried) { flashText = 'Se te pasó'; flash = 0.9; }
        pass++;
        if (pass >= 3) { draw(); return finish(); }
        x = -40; tried = false; got = false;
        msg.textContent = `Pasada ${pass + 1}: más rápido.`;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    draw();
    raf = requestAnimationFrame(tick);
  });
}

/**
 * La jineteada: the colt bucks and the rider leans; left and right push the rider back to the middle.
 * Holding on for the whole time wins. Resolves with true (held on) or false (thrown off).
 */
export function jineteada(seconds = 8): Promise<boolean> {
  return new Promise((resolve) => {
    const { box, g } = stage('La jineteada', 'Mantené el equilibrio con izquierda y derecha. Aguantá hasta la campana.');
    let lean = 0, vel = 0, t = 0, nextBuck = 0.6, buck = 0, raf = 0, last = performance.now(), over = false, result: boolean | null = null;
    const finish = (ok: boolean) => {
      if (over) return;
      over = true;
      result = ok;
      cancelAnimationFrame(raf);
      sfx(ok ? 'catch' : 'faint');
      draw();
      pop();
      box.remove();
      resolve(ok);
    };
    const push = (d: number) => { if (!over) { vel += d * 1.05; sfx('select'); } };
    const pop = input.push((a) => { if (a === 'left') push(-1); else if (a === 'right') push(1); });
    // pointer: tapping the left or right half of the box leans that way
    box.addEventListener('pointerdown', (e: PointerEvent) => { const r = box.getBoundingClientRect(); push(e.clientX < r.left + r.width / 2 ? -1 : 1); });
    const draw = () => {
      sky(g);
      // the corral fence
      g.fillStyle = '#8a5a2e'; for (let x = 2; x < CW; x += 20) g.fillRect(x, 38, 3, 14); g.fillRect(0, 41, CW, 2); g.fillRect(0, 47, CW, 2);
      const hop = Math.max(0, Math.sin(t * 9)) * (3 + buck * 4);
      rider(g, 64, 22, Math.floor(t * 8) % 2 + 1, lean * 1.1, hop);
      // balance bar
      g.fillStyle = '#14141e'; g.fillRect(20, 62, 120, 7);
      g.fillStyle = '#e0263a'; g.fillRect(21, 63, 118, 5);
      g.fillStyle = '#f2c02a'; g.fillRect(45, 63, 70, 5);
      g.fillStyle = '#4ab860'; g.fillRect(65, 63, 30, 5);
      g.fillStyle = '#f4f4f4'; g.fillRect(Math.round(80 + lean * 58) - 1, 60, 3, 11);
      g.fillStyle = '#14141e'; g.font = '8px "Press Start 2P", monospace'; g.textBaseline = 'top';
      g.fillText(`${Math.max(0, seconds - t).toFixed(1).replace('.', ',')}`, 4, 4);
      if (result != null) { g.textAlign = 'center'; g.fillStyle = result ? '#1a6a2a' : '#a8182a'; g.fillText(result ? '¡Aguantó!' : 'Al suelo', CW / 2, 14); g.textAlign = 'left'; }
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const k = 0.7 + (t / seconds) * 0.7; // the colt gets wilder towards the end
      if (t >= nextBuck) {
        buck = 1;
        vel += (Math.random() < 0.5 ? -1 : 1) * (0.55 + Math.random() * 0.6) * k;
        nextBuck = t + 0.45 + Math.random() * 0.55;
      }
      buck = Math.max(0, buck - dt * 3);
      vel += lean * 1.6 * dt;     // leaning further makes it easier to fall
      vel *= Math.pow(0.18, dt);  // the rider's body soaks up part of the push
      lean += vel * dt;
      box.dataset.lean = lean.toFixed(2); // read by the QA scripts
      if (Math.abs(lean) >= 1) { lean = Math.sign(lean); return finish(false); }
      if (t >= seconds) return finish(true);
      draw();
      raf = requestAnimationFrame(tick);
    };
    draw();
    raf = requestAnimationFrame(tick);
  });
}


// ---------------------------------------------------------------- Casino slot machine (no words: it is all drawn)
const SW = 160, SH = 120;
const SYMS = ['mate', 'ceibo', 'sol', 'siete'] as const;
type Sym = (typeof SYMS)[number];
/** What each reel shows as it turns. The prize odds do not depend on this strip: the result is drawn first. */
const STRIP: Sym[] = ['mate', 'ceibo', 'mate', 'sol', 'mate', 'ceibo', 'siete', 'mate', 'ceibo', 'sol'];
const ODDS: Sym[] = ['mate', 'mate', 'mate', 'mate', 'mate', 'ceibo', 'ceibo', 'ceibo', 'ceibo', 'sol', 'sol', 'siete'];
const PAY: Record<Sym, number> = { mate: 4, ceibo: 8, sol: 40, siete: 150 };
const GLYPH: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
};
const rect = (g: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, hh: number) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, hh); };
function digits(g: CanvasRenderingContext2D, n: number, x: number, y: number, col: string, sh = '#0a0610') {
  const str = String(Math.max(0, Math.floor(n)));
  [...str].forEach((ch, i) => GLYPH[ch].forEach((row, r) => [...row].forEach((v, c) => {
    if (v === '1') { rect(g, sh, x + i * 4 + c + 1, y + r + 1, 1, 1); rect(g, col, x + i * 4 + c, y + r, 1, 1); }
  })));
}
function coin(g: CanvasRenderingContext2D, x: number, y: number, lit = true) {
  rect(g, '#2a1a08', x + 1, y, 5, 7); rect(g, '#2a1a08', x, y + 1, 7, 5);
  rect(g, lit ? '#f2c02a' : '#6a5a3a', x + 1, y + 1, 5, 5);
  if (lit) { rect(g, '#fff0a0', x + 1, y + 1, 2, 1); rect(g, '#fff0a0', x + 1, y + 2, 1, 1); rect(g, '#c8921a', x + 3, y + 3, 2, 2); }
}
/** One 20x20 reel symbol centred on (cx, cy). */
function symbol(g: CanvasRenderingContext2D, k: Sym, cx: number, cy: number) {
  const x = Math.round(cx) - 10, y = Math.round(cy) - 10;
  if (k === 'mate') {
    rect(g, '#c8ccd8', x + 14, y + 1, 1, 9); rect(g, '#8a90a0', x + 13, y + 1, 3, 1); // bombilla
    for (let yy = 4; yy <= 19; yy++) for (let xx = 0; xx <= 19; xx++) { // round gourd
      const dx = (xx - 9) / 8.6, dy = (yy - 12.5) / 7.6, d = dx * dx + dy * dy;
      if (d <= 1) rect(g, d > 0.72 ? '#1a1008' : xx < 6 && yy < 14 ? '#d8a060' : xx > 12 ? '#7a4a22' : '#b07a40', x + xx, y + yy, 1, 1);
    }
    rect(g, '#1a1008', x + 3, y + 5, 13, 3); rect(g, '#4a9a2a', x + 4, y + 5, 11, 2); rect(g, '#8ad04a', x + 5, y + 5, 4, 1); // yerba
    rect(g, '#8a5a2a', x + 9, y + 12, 3, 1); rect(g, '#8a5a2a', x + 8, y + 15, 4, 1); // stitched band
  } else if (k === 'ceibo') {
    for (const [dx, dy] of [[0, -6], [6, -2], [4, 5], [-4, 5], [-6, -2]]) { rect(g, '#5a0a14', x + 8 + dx, y + 7 + dy, 7, 7); rect(g, '#e0263a', x + 9 + dx, y + 8 + dy, 5, 5); rect(g, '#ff8a9a', x + 9 + dx, y + 8 + dy, 2, 1); }
    rect(g, '#5a3a08', x + 8, y + 7, 5, 5); rect(g, '#ffd84a', x + 9, y + 8, 3, 3);
  } else if (k === 'sol') {
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const L = i % 2 ? 7 : 10; rect(g, '#7a4a08', x + 10 + Math.cos(a) * L - 1, y + 10 + Math.sin(a) * L - 1, 3, 3); rect(g, '#ffd84a', x + 10 + Math.cos(a) * L, y + 10 + Math.sin(a) * L, 1, 1); }
    for (let yy = -6; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) { const d = xx * xx + yy * yy; if (d <= 42) rect(g, d > 30 ? '#7a4a08' : d < 14 ? '#fff0a0' : '#ffc82a', x + 10 + xx, y + 10 + yy, 1, 1); }
    rect(g, '#7a4a08', x + 7, y + 8, 2, 2); rect(g, '#7a4a08', x + 11, y + 8, 2, 2); rect(g, '#7a4a08', x + 8, y + 12, 4, 1);
  } else {
    const bar = (c: string, o: number) => { // a bold 7: top bar and a slanted stem
      rect(g, c, x + 2 - o, y + 2 - o, 16 + 2 * o, 4 + 2 * o);
      for (let i = 0; i < 13; i++) rect(g, c, x + 12 - Math.floor(i * 0.55) - o, y + 5 + i - o, 5 + 2 * o, 1 + 2 * o);
    };
    bar('#2a0408', 1); bar('#e0263a', 0);
    rect(g, '#ff9a9a', x + 3, y + 3, 13, 1); rect(g, '#ff9a9a', x + 11, y + 6, 1, 6); rect(g, '#a8102a', x + 3, y + 5, 12, 1);
  }
}

/** The five lines of the machine: for each reel, the row (0 top, 1 middle, 2 bottom) that counts. */
const LINES: number[][] = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
const LINE_STEPS = [1, 3, 5]; // 1 = the middle line, 3 = the three rows, 5 = the three rows and both diagonals

/**
 * The tragamonedas, played inside the machine: A turns the reels and then stops them one by one, up and down choose how
 * many lines play (1, 3 or 5: the rows and both diagonals, a ficha per line), B steps away. The whole 3x3 window is
 * drawn when the reels start, each line paying like a single line always did, so the odds stay fair; the stops are only
 * for show. Nothing is written: lamps, reels and falling coins do the talking.
 */
export function slots(wallet: { count(): number; take(n: number): void; give(n: number): void }): Promise<void> {
  return new Promise((resolve) => {
    const { box, g } = stage('', '', SW, SH);
    type Reel = { pos: number; mode: 'idle' | 'spin' | 'stop'; target: number; speed: number; rows: Sym[]; pins: Map<number, Sym> };
    const reels: Reel[] = [0, 1, 2].map((i) => ({ pos: i * 3, mode: 'idle', target: 0, speed: 0, rows: ['mate', 'mate', 'mate'], pins: new Map() }));
    let phase: 'ready' | 'spin' | 'result' = 'ready';
    let nLines = 1, t = 0, spinT = 0, resultT = 0, win = 0, shown = wallet.count(), noChips = 0, over = false, raf = 0, last = performance.now();
    let hit: 'none' | 'two' | 'three' = 'none', winning: number[] = [], jackpot = false;
    const coins: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const RH = 22, CX = [44, 80, 116], CY = 59;
    const rowY = (r: number) => CY + (r - 1) * RH;
    const wrap = (n: number) => ((n % STRIP.length) + STRIP.length) % STRIP.length;
    const finish = () => { if (over) return; over = true; cancelAnimationFrame(raf); pop(); box.remove(); resolve(); };
    // the three symbols that stay on screen when a reel lands are pinned to their strip rows, so the next spin starts from what you saw
    const stopReel = (i: number) => {
      const r = reels[i];
      if (r.mode !== 'spin') return;
      r.target = Math.ceil(r.pos) + 4;
      r.pins.set(r.target + 1, r.rows[0]); r.pins.set(r.target, r.rows[1]); r.pins.set(r.target - 1, r.rows[2]);
      r.mode = 'stop';
    };
    const settle = () => {
      win = 0; hit = 'none'; winning = []; jackpot = false;
      LINES.slice(0, nLines).forEach((rowsOf, li) => {
        const sy = rowsOf.map((row, c) => reels[c].rows[row]);
        let w = 0;
        if (sy[0] === sy[1] && sy[1] === sy[2]) { w = PAY[sy[0]]; hit = 'three'; if (sy[0] === 'siete') jackpot = true; } else if (sy[0] === 'mate' && sy[1] === 'mate') { w = 1; if (hit === 'none') hit = 'two'; }
        if (w) { win += w; winning.push(li); }
      });
      phase = 'result'; resultT = 0;
      if (win) {
        wallet.give(win);
        for (let i = 0; i < Math.min(34, win * 2); i++) coins.push({ x: 80 + Math.random() * 20 - 10, y: 100, vx: (Math.random() - 0.5) * 70, vy: -60 - Math.random() * 70, life: 1.6 + Math.random() * 0.4 });
        sfx(jackpot ? 'bell' : 'money');
      }
    };
    const press = () => {
      if (over) return;
      if (phase === 'ready') {
        const have = wallet.count();
        if (have < 1) { noChips = 0.8; sfx('bump'); return; }
        while (nLines > have) nLines = LINE_STEPS[Math.max(0, LINE_STEPS.indexOf(nLines) - 1)];
        wallet.take(nLines);
        sfx('confirm');
        reels.forEach((r) => { r.rows = [0, 1, 2].map(() => ODDS[Math.floor(Math.random() * ODDS.length)]); r.mode = 'spin'; r.speed = 16; });
        phase = 'spin'; spinT = 0; winning = []; hit = 'none'; win = 0;
      } else if (phase === 'spin') {
        const i = reels.findIndex((r) => r.mode === 'spin');
        if (i >= 0) { stopReel(i); sfx('select'); }
      } else if (phase === 'result') { resultT = 99; }
    };
    const pop = input.push((a) => {
      if (a === 'a') press();
      else if (a === 'b' && phase === 'ready') finish();
      else if ((a === 'up' || a === 'right') && phase === 'ready' && nLines < 5) { nLines = LINE_STEPS[LINE_STEPS.indexOf(nLines) + 1]; sfx('select'); }
      else if ((a === 'down' || a === 'left') && phase === 'ready' && nLines > 1) { nLines = LINE_STEPS[LINE_STEPS.indexOf(nLines) - 1]; sfx('select'); }
    });
    box.addEventListener('pointerdown', press);

    const draw = () => {
      // room behind: red velvet with gold dots
      g.fillStyle = '#4a0f1e'; g.fillRect(0, 0, SW, SH);
      for (let y = 0; y < SH; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < SW; x += 8) rect(g, '#5e1828', x, y, 2, 2);
      // cabinet
      rect(g, '#14081a', 12, 2, 136, 118); rect(g, '#7a1a30', 14, 4, 132, 114); rect(g, '#b02848', 14, 4, 132, 2); rect(g, '#b02848', 14, 4, 2, 114); rect(g, '#4a0a1c', 144, 4, 2, 114);
      rect(g, '#f2c02a', 18, 8, 124, 1); rect(g, '#c8921a', 18, 9, 124, 1);
      // marquee: bulbs chase along the top (faster on a win)
      const speed = jackpot ? 16 : hit === 'three' ? 12 : phase === 'spin' ? 9 : 4;
      for (let i = 0; i < 15; i++) {
        const on = (Math.floor(t * speed) + i) % 3 === 0 || (phase === 'result' && win > 0 && Math.floor(t * 8) % 2 === 0);
        rect(g, '#2a1a08', 20 + i * 8, 12, 5, 5); rect(g, on ? '#fff0a0' : '#8a6a20', 21 + i * 8, 13, 3, 3);
      }
      // reel window: three full rows
      rect(g, '#f2c02a', 29, 24, 102, 72); rect(g, '#14081a', 31, 26, 98, 68);
      for (let i = 0; i < 3; i++) {
        const cx = CX[i], r = reels[i];
        rect(g, '#f4efe0', cx - 15, 26, 30, 66);
        g.save(); g.beginPath(); g.rect(cx - 15, 26, 30, 66); g.clip();
        const base = Math.floor(r.pos);
        for (let j = base - 2; j <= base + 3; j++) {
          const yy = CY + (r.pos - j) * RH;
          g.globalAlpha = r.mode === 'spin' ? 0.8 : 1;
          symbol(g, r.pins.get(j) ?? STRIP[wrap(j)], cx, yy);
        }
        g.globalAlpha = 1;
        g.fillStyle = 'rgba(40,20,50,0.18)'; g.fillRect(cx - 15, 47, 30, 1); g.fillRect(cx - 15, 69, 30, 1); // row separators
        g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(cx - 13, 26, 2, 66);
        if (r.mode === 'spin') { g.fillStyle = 'rgba(255,255,255,0.18)'; for (let k = 0; k < 6; k++) g.fillRect(cx - 12 + ((k * 7) % 22), 26 + ((t * 300 + k * 23) % 66), 1, 6); }
        g.restore();
        rect(g, '#14081a', cx + 15, 26, 2, 66);
      }
      // line markers on both sides: the ones in play are lit (rows on the left, diagonals' far ends on the right)
      const n = nLines;
      const flashOn = Math.floor(t * 6) % 2 === 0;
      [0, 1, 2].forEach((li) => {
        const row = LINES[li][0], on = li < (n >= 3 ? 3 : 1), won = winning.includes(li);
        const c = won && flashOn ? '#fff0a0' : on ? '#e0263a' : '#5a2a38';
        rect(g, c, 20, rowY(row) - 1, 8, 3); rect(g, c, 28, rowY(row) - 2, 1, 5);
      });
      [3, 4].forEach((li) => {
        const on = n >= 5, won = winning.includes(li);
        const c = won && flashOn ? '#fff0a0' : on ? '#e0263a' : '#5a2a38';
        const row = LINES[li][2];
        rect(g, c, 132, rowY(row) - 1, 8, 3); rect(g, c, 131, rowY(row) - 2, 1, 5);
      });
      // winning lines drawn through the cells that paid, blinking
      if (phase === 'result' && flashOn) {
        g.strokeStyle = '#fff0a0'; g.lineWidth = 2;
        for (const li of winning) {
          g.beginPath();
          LINES[li].forEach((row, c) => { if (c === 0) g.moveTo(30, rowY(row)); g.lineTo(CX[c], rowY(row)); });
          g.lineTo(130, rowY(LINES[li][2]));
          g.stroke();
          LINES[li].forEach((row, c) => { g.strokeStyle = '#e0263a'; g.lineWidth = 1; g.strokeRect(CX[c] - 13.5, rowY(row) - 9.5, 27, 19); g.strokeStyle = '#fff0a0'; g.lineWidth = 2; });
        }
      }
      // control panel
      rect(g, '#2a0a14', 20, 98, 120, 18); rect(g, '#4a1428', 20, 98, 120, 1);
      // lines in play: five coins, lit up to the count, with arrows
      for (let i = 0; i < 5; i++) coin(g, 24 + i * 8, 103, i < n);
      if (phase === 'ready') {
        g.fillStyle = '#f2c02a';
        g.fillRect(67, 101, 1, 1); g.fillRect(66, 102, 3, 1); g.fillRect(65, 103, 5, 1);
        g.fillRect(65, 108, 5, 1); g.fillRect(66, 109, 3, 1); g.fillRect(67, 110, 1, 1);
      }
      // chips in hand
      const bad = noChips > 0 && Math.floor(t * 12) % 2 === 0;
      coin(g, 76, 103, !bad);
      digits(g, shown, 86, 104, bad ? '#ff4a4a' : '#fff0a0');
      // spin button
      const ready = phase === 'ready' || phase === 'spin';
      const glow = ready && Math.floor(t * 3) % 2 === 0;
      rect(g, '#14081a', 116, 100, 20, 14); rect(g, glow ? '#ff6a6a' : '#e0263a', 118, 102, 16, 10); rect(g, '#ffb0b0', 119, 103, 14, 2); rect(g, '#8a0a1a', 118, 110, 16, 2);
      for (const c of coins) coin(g, c.x - 3, c.y - 3);
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;
      noChips = Math.max(0, noChips - dt);
      const have = wallet.count();
      if (shown !== have) shown += Math.sign(have - shown) * Math.max(1, Math.floor(Math.abs(have - shown) / 8));
      if (phase === 'spin') {
        spinT += dt;
        reels.forEach((r, i) => { if (r.mode === 'spin' && spinT > 1.3 + i * 0.7) stopReel(i); });
      }
      for (const r of reels) {
        if (r.mode === 'spin') r.pos += r.speed * dt;
        else if (r.mode === 'stop') {
          const left = r.target - r.pos;
          r.pos += Math.min(left, Math.max(2.5, left * 5) * dt);
          if (r.target - r.pos < 0.001) { r.pos = r.target; r.mode = 'idle'; sfx('bump'); }
        }
        for (const k of r.pins.keys()) if (k < r.pos - 4) r.pins.delete(k);
      }
      if (phase === 'spin' && reels.every((r) => r.mode === 'idle')) settle();
      if (phase === 'result') {
        resultT += dt;
        if (resultT > (win ? 2.4 : 0.45)) { phase = 'ready'; win = 0; hit = 'none'; winning = []; jackpot = false; }
      }
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.vy += 220 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.y > 102) { c.y = 102; c.vy *= -0.45; c.vx *= 0.8; }
        c.life -= dt;
        if (c.life <= 0) coins.splice(i, 1);
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    draw();
    raf = requestAnimationFrame(tick);
  });
}
