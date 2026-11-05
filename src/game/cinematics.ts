// Short story cinematics: a full-screen scene drawn on the game canvas, played when a story beat ends.
// Use from an event script with `await api.cinematic('ship_leaves')`. A / B skips.
import { W, H, setRenderer, getRenderer, text } from '../gfx/screen.ts';
import { charSprite } from '../gfx/characters.ts';
import { input } from '../core/input.ts';
import { wait } from '../core/util.ts';
import { sfx } from '../core/audio.ts';
import { fadeOut, fadeIn, fmt } from './ui.ts';
import { state } from './state.ts';
import { creatureSprite } from '../gfx/creatures.ts';

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

// ---- Shared pieces for the PP, rival and league cinematics ----------------------------------------------
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const hash = (n: number) => { let h = Math.imul(n ^ 0x9e3779b9, 2654435761); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

function caption(g, p: number, lines: [number, string][]) {
  // [start, text]: each line shows until the next starts; the last stays
  let cur = '';
  for (const [at, txt] of lines) if (p >= at) cur = txt;
  if (!cur) return;
  g.fillStyle = 'rgba(8,8,24,0.62)';
  g.fillRect(0, H - 34, W, 34);
  text(g, fmt(cur), W / 2, H - 22, { align: 'center', size: 8 });
}

function hills(g, y: number, col: string, seed: number, amp = 18) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, y - amp * hash(seed + x / 20) - amp * 0.4 * Math.sin(x / 70 + seed));
  g.lineTo(W, H);
  g.fill();
}

/** A PP installation switches off and the fog that covered the land lifts, the sun coming out. */
function fogLifts(opts: { ms: number; lines: [number, string][]; tower?: boolean; bird?: boolean; city?: boolean }) {
  return {
    ms: opts.ms,
    draw(g, t: number, p: number) {
      const k = clamp((p - 0.12) / 0.7, 0, 1);
      const top = mix([92, 100, 118], [88, 156, 224], k), bot = mix([150, 154, 166], [250, 214, 150], k);
      const grd = g.createLinearGradient(0, 0, 0, 170);
      grd.addColorStop(0, rgb(top)); grd.addColorStop(1, rgb(bot));
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      // sun
      const sy = 150 - k * 70;
      g.fillStyle = `rgba(255,236,160,${0.15 + k * 0.85})`;
      g.beginPath(); g.arc(360, sy, 22 + k * 4, 0, 7); g.fill();
      g.fillStyle = `rgba(255,236,160,${0.12 * k})`;
      for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(360, sy); g.lineTo(360 + Math.cos(i * 0.7 + t / 4000) * 300, sy + Math.sin(i * 0.7 + t / 4000) * 300); g.lineTo(360 + Math.cos(i * 0.7 + 0.2 + t / 4000) * 300, sy + Math.sin(i * 0.7 + 0.2 + t / 4000) * 300); g.fill(); }
      hills(g, 190, rgb(mix([70, 78, 92], [92, 150, 96], k)), 3, 22);
      if (opts.tower) {
        // the transmitter: its red beacon blinks, then dies
        const x = 130;
        g.fillStyle = '#3a3e4c';
        g.fillRect(x - 2, 70, 4, 130);
        g.fillRect(x - 10, 200, 20, 4);
        for (let y = 80; y < 200; y += 12) { g.fillRect(x - 6 + (y % 24 ? 1 : 0), y, 12 - (y % 24 ? 2 : 0), 1); }
        const on = p < 0.28 && Math.floor(t / 250) % 2 === 0;
        g.fillStyle = on ? '#ff3a3a' : '#5a2a2a';
        g.fillRect(x - 3, 64, 6, 6);
        if (on) { g.fillStyle = 'rgba(255,60,60,0.25)'; g.beginPath(); g.arc(x, 67, 14, 0, 7); g.fill(); }
      }
      hills(g, 226, rgb(mix([46, 56, 60], [58, 128, 70], k)), 9, 14);
      // fog banks drift up and away
      for (let i = 0; i < 6; i++) {
        const a = clamp(1 - k * 1.15, 0, 1) * 0.55;
        const y = 90 + i * 26 - k * (60 + i * 14);
        g.fillStyle = `rgba(214,218,226,${a})`;
        for (let x = -60; x < W + 60; x += 70) {
          const wob = Math.sin(t / 1400 + x * 0.02 + i) * 14;
          g.beginPath(); g.ellipse(x + wob + (i % 2) * 30, y, 60, 16, 0, 0, 7); g.fill();
        }
      }
      if (opts.bird && p > 0.3 && p < 0.92) {
        const q = (p - 0.3) / 0.62;
        const bx = -30 + q * 540, by = 70 + Math.sin(q * 5) * 16 - q * 20;
        const flap = Math.sin(t / 110) * 9;
        g.fillStyle = '#2f64c8';
        g.beginPath(); g.moveTo(bx - 20, by - flap); g.lineTo(bx, by + 4); g.lineTo(bx + 20, by - flap); g.lineTo(bx, by - 2); g.fill();
        g.fillStyle = '#7ab0f0'; g.fillRect(bx - 3, by - 2, 7, 3);
      }
      // the player seen from behind, watching it all
      const look = state()?.player?.look ?? 'player_m';
      g.drawImage(charSprite(look, 'up', 0), 0, 0, 16, 17, 70, 196, 48, 51);
      caption(g, p, opts.lines);
    },
  };
}

/** Dam gates open and the city lights come on one by one. */
function damLights(lines: [number, string][], ms: number) {
  return {
    ms,
    draw(g, t: number, p: number) {
      const k = clamp((p - 0.1) / 0.7, 0, 1);
      const grd = g.createLinearGradient(0, 0, 0, 180);
      grd.addColorStop(0, rgb(mix([14, 16, 40], [38, 40, 90], k))); grd.addColorStop(1, rgb(mix([40, 42, 64], [200, 110, 90], k)));
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = '#f2f2e0';
      for (let i = 0; i < 40; i++) g.fillRect(Math.round(hash(i) * W), Math.round(hash(i + 50) * 120), 1, 1);
      // city skyline on the right, windows lighting up
      for (let b = 0; b < 12; b++) {
        const bx = 250 + b * 19, bh = 40 + Math.round(hash(b + 7) * 50);
        g.fillStyle = '#1a1c30'; g.fillRect(bx, 190 - bh, 17, bh);
        for (let wy = 190 - bh + 5; wy < 186; wy += 8) for (let wx = bx + 3; wx < bx + 14; wx += 6) {
          const on = hash(wx * 31 + wy) < k * 1.15;
          g.fillStyle = on ? '#ffe08a' : '#2a2c44';
          g.fillRect(wx, wy, 3, 4);
        }
      }
      // dam wall with falling water
      g.fillStyle = '#6a6e80'; g.fillRect(0, 120, 220, 110);
      g.fillStyle = '#8a8ea0'; g.fillRect(0, 120, 220, 6);
      for (let i = 0; i < 5; i++) {
        const gx = 14 + i * 40;
        g.fillStyle = '#2a2c3c'; g.fillRect(gx, 134, 26, 60);
        const open = clamp(k * 3 - i * 0.4, 0, 1);
        g.fillStyle = '#7ab8f0'; g.fillRect(gx + 2, 134 + (1 - open) * 56, 22, open * 56);
        g.fillStyle = '#ffffff';
        for (let y = 0; y < open * 56; y += 7) g.fillRect(gx + 4 + ((y * 5) % 15), 136 + ((y + t / 40) % 50), 2, 4);
      }
      g.fillStyle = '#3a6aa8'; g.fillRect(0, 196, W, 74);
      g.fillStyle = 'rgba(255,255,255,0.15)';
      for (let y = 204; y < H; y += 9) for (let x = ((y * 13) % 41); x < W; x += 41) g.fillRect(x + Math.round(Math.sin(t / 600 + y) * 3), y, 14, 1);
      const look = state()?.player?.look ?? 'player_m';
      g.drawImage(charSprite(look, 'right', 0), 0, 0, 16, 17, 236, 168, 48, 51);
      caption(g, p, lines);
    },
  };
}

/** The rival and the player on a hill at dusk, after a duel that settled something between them. */
function rivalDusk(lines: [number, string][], ms: number) {
  return {
    ms,
    draw(g, t: number, p: number) {
      const grd = g.createLinearGradient(0, 0, 0, 180);
      grd.addColorStop(0, '#3a2a6a'); grd.addColorStop(0.6, '#e0708a'); grd.addColorStop(1, '#f8c878');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff0b0'; g.beginPath(); g.arc(240, 150 + p * 24, 26, 0, 7); g.fill();
      for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,200,200,${0.3})`; g.fillRect(((t / 40 + i * 120) % (W + 80)) - 60, 40 + i * 14, 50, 4); }
      hills(g, 200, '#3a3a58', 5, 16);
      hills(g, 238, '#262a40', 12, 10);
      // grass blades in the wind
      g.fillStyle = '#1c2034';
      for (let x = 0; x < W; x += 6) g.fillRect(x, 226 - (hash(x) * 6) | 0, 1, 12 + Math.round(Math.sin(t / 300 + x) * 1.5));
      const look = state()?.player?.look ?? 'player_m';
      const gap = 70 - clamp(p * 2, 0, 1) * 22;
      g.drawImage(charSprite('rival', 'right', 0), 0, 0, 16, 17, 240 - gap - 24, 186, 48, 51);
      g.drawImage(charSprite(look, 'left', 0), 0, 0, 16, 17, 240 + gap - 24, 186, 48, 51);
      caption(g, p, lines);
    },
  };
}

/** The Liga is won: spotlights, confetti, the cup and the team in a row. */
function leagueWon(lines: [number, string][], ms: number) {
  return {
    ms,
    draw(g, t: number, p: number) {
      g.fillStyle = '#0c0c24'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) {
        const a = Math.sin(t / 900 + i * 1.7) * 0.5, x = 80 + i * 107;
        g.fillStyle = `rgba(255,${230 - i * 20},${170 + i * 20},0.13)`;
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 36 + a * 160, H); g.lineTo(x - 36 + a * 160, H); g.fill();
      }
      g.fillStyle = '#2a2644'; g.fillRect(0, 214, W, 56);
      g.fillStyle = '#3a3660'; g.fillRect(0, 214, W, 3);
      // the cup
      const k = clamp((p - 0.18) / 0.2, 0, 1);
      const cy = 150 - (1 - k) * 40;
      g.globalAlpha = k;
      g.fillStyle = '#f2c63a'; g.fillRect(222, cy, 36, 26); g.fillRect(230, cy + 26, 20, 14); g.fillRect(218, cy + 40, 44, 8);
      g.fillStyle = '#fff0a0'; g.fillRect(226, cy + 4, 6, 18);
      g.fillStyle = '#b8901a'; g.fillRect(216, cy + 4, 6, 12); g.fillRect(258, cy + 4, 6, 12);
      g.globalAlpha = 1;
      // the party, in a row below
      const party = state()?.party ?? [];
      party.slice(0, 6).forEach((c, i) => {
        const x = 240 - party.slice(0, 6).length * 25 + i * 50, bob = Math.abs(Math.sin(t / 260 + i)) * 4 * clamp((p - 0.4) * 4, 0, 1);
        g.drawImage(creatureSprite(c.species), x, 164 - bob, 48, 48);
      });
      // confetti
      if (p > 0.2) for (let i = 0; i < 70; i++) {
        const x = (hash(i) * W + Math.sin(t / 500 + i) * 12 + W) % W;
        const y = ((hash(i + 99) * 400 + t / 6 * (0.5 + hash(i + 3))) % (H + 20)) - 10;
        g.fillStyle = ['#ff5a6a', '#ffe05a', '#5ac8ff', '#7aff8a', '#ff9af0'][i % 5];
        g.fillRect(Math.round(x), Math.round(y), 3, 2 + (i % 2));
      }
      caption(g, p, lines);
    },
  };
}
const SCENES: Record<string, { ms: number; draw: (g, t: number, p: number) => void }> = {
  // PP installations switched off
  cabo_free: fogLifts({ ms: 7000, bird: false, lines: [[0, 'La niebla del cabo empieza a abrirse.'], [0.55, 'Después de tanto tiempo, el mar vuelve a verse.']] }),
  quebrada_free: fogLifts({ ms: 8000, bird: true, lines: [[0, 'Un viento helado baja de las sierras.'], [0.35, 'El Cardenal Azul se aleja hacia el sur.'], [0.8, 'La niebla de la Quebrada se disipa.']] }),
  torre_off: fogLifts({ ms: 7500, tower: true, lines: [[0, 'La baliza del transmisor parpadea… y se apaga.'], [0.5, 'La niebla de Rivera sube y desaparece.']] }),
  fabrica_off: fogLifts({ ms: 7000, tower: true, lines: [[0, 'Las máquinas de la fábrica de Minas se detienen.'], [0.5, 'El humo gris se va con el viento.']] }),
  obs_free: fogLifts({ ms: 7000, lines: [[0, 'El registro de Tabárez queda en tus manos.'], [0.55, 'Desde el observatorio el cielo se ve limpio.']] }),
  anglo_free: fogLifts({ ms: 9500, tower: true, bird: true, lines: [[0, 'Las últimas máquinas de niebla se apagan.'], [0.35, 'El Cardenal Azul vuelve a volar sobre el Río.'], [0.75, 'El cielo del Uruguay vuelve a ser de todos.']] }),
  represa_on: damLights([[0, 'Las compuertas de la represa se abren.'], [0.5, 'En la ciudad, las luces se prenden una por una.']], 8000),
  // Rival duels
  rival_dusk_1: rivalDusk([[0, 'Facu se queda mirando el horizonte.'], [0.55, 'Los dos siguen camino hacia el Centenario.']], 7000),
  rival_dusk_2: rivalDusk([[0, '“Ya no trabajo para nadie del PP.”'], [0.5, 'Facu asiente y camina a tu lado.']], 7500),
  rival_dusk_final: rivalDusk([[0, 'Facu baja la mirada y sonríe.'], [0.45, '“Ganale al Campeón. Yo sigo entrenando.”'], [0.8, 'Arriba, la Liga espera.']], 8000),
  // The Liga
  champion_won: leagueWon([[0, 'Tu nombre queda grabado en el Salón de la Fama.'], [0.45, '{player}, Campeón de la Liga Oriental.'], [0.85, 'El cielo todavía necesita quien lo cuide.']], 11000),
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
