// Performance overlay (F3): FPS, frame time, worst frame and ping to the host serving the game.
import { h } from './util.js';
import { settings, saveSettings } from '../game/state.js';

const PING_EVERY_MS = 5000;
let box, rows, frames = 0, worst = 0, since = 0, ping = null, pingBusy = false, lastPing = 0, jitterPrev = null, jitter = 0;

function level(fps) { return fps >= 55 ? 'good' : fps >= 30 ? 'mid' : 'low'; }

async function measurePing() {
  if (pingBusy) return;
  pingBusy = true;
  try {
    const t0 = performance.now();
    await fetch(`${location.pathname}?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    const ms = performance.now() - t0;
    if (jitterPrev != null) jitter = jitter * 0.7 + Math.abs(ms - jitterPrev) * 0.3;
    jitterPrev = ms;
    ping = ms;
  } catch {
    ping = -1;
  } finally {
    pingBusy = false;
  }
}

export function togglePerf(on = !settings.perf) {
  settings.perf = on;
  saveSettings();
  if (box) box.hidden = !on;
}

export function mountPerf() {
  rows = {
    fps: h('b'), ms: h('span'), worst: h('span'), ping: h('span'), jitter: h('span'), mem: h('span'),
  };
  box = h('div', { class: 'perf', hidden: !settings.perf, 'aria-hidden': 'true' },
    h('div', {}, 'FPS ', rows.fps), h('div', {}, 'Frame ', rows.ms), h('div', {}, 'Peor ', rows.worst),
    h('div', {}, 'Ping ', rows.ping), h('div', {}, 'Jitter ', rows.jitter), h('div', {}, 'Mem ', rows.mem));
  document.body.append(box);
  addEventListener('keydown', (e) => {
    if (e.code !== 'F3') return;
    e.preventDefault();
    togglePerf();
  });
}

/** Called once per animation frame with the rAF timestamp and the clamped delta. */
export function perfTick(now, rawDt) {
  frames++;
  if (rawDt > worst) worst = rawDt;
  if (!since) since = now;
  if (now - since < 500) return;
  if (box && !box.hidden) {
    const fps = (frames * 1000) / (now - since);
    rows.fps.textContent = Math.round(fps);
    rows.fps.dataset.level = level(fps);
    rows.ms.textContent = `${((now - since) / frames).toFixed(1)} ms`;
    rows.worst.textContent = `${worst.toFixed(0)} ms`;
    rows.ping.textContent = ping == null ? '…' : ping < 0 ? 'sin red' : `${Math.round(ping)} ms`;
    rows.jitter.textContent = ping == null || ping < 0 ? '-' : `${jitter.toFixed(0)} ms`;
    const m = performance.memory;
    rows.mem.textContent = m ? `${Math.round(m.usedJSHeapSize / 1048576)} MB` : 'n/d';
    if (now - lastPing > PING_EVERY_MS) { lastPing = now; measurePing(); }
  }
  frames = 0;
  worst = 0;
  since = now;
}
