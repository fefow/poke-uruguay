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

function stage(title: string, hint: string) {
  const cv = h('canvas', { class: 'minigame-canvas', width: CW, height: CH }) as HTMLCanvasElement;
  const msg = h('div', { class: 'minigame-hint', text: hint });
  const box = h('div', { class: 'minigame' }, h('div', { class: 'menu-title', text: title }), cv, msg);
  uiRoot().append(box);
  // pixel art only at whole zoom levels: the widest multiple of the canvas that fits the box
  const avail = cv.clientWidth;
  if (avail >= CW) { cv.style.width = `${Math.floor(avail / CW) * CW}px`; cv.style.alignSelf = 'center'; }
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
