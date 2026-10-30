// Procedural creature sprites: each species has a recipe (body plan + colors +
// features). Shapes are drawn with canvas paths, then hard-thresholded and
// outlined so they read as pixel art. Facing left (toward the player).
import { SPECIES } from '../data/species.js';
import { TYPES } from '../data/types.js';
import { override, overrideMirrored } from './overrides.js';

export const SPRITE = 80;
const cache = new Map();

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function P(g, st = { i: 0, n: 1 }) {
  const baby = st.n > 1 && st.i === 0;
  const fierce = st.n > 1 && st.i === st.n - 1;
  return {
    ell(x, y, rx, ry, col, rot = 0) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); },
    rect(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); },
    poly(pts, col) { g.fillStyle = col; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); },
    line(pts, col, w = 2) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); },
    eye(x, y, r = 2.6) {
      if (baby) r *= 1.3;
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = '#141420';
      if (baby) {
        g.fillRect(Math.round(x - 2), Math.round(y - 1.5), 3, 4);
        g.fillStyle = '#ffffff'; g.fillRect(Math.round(x - 2), Math.round(y - 1.5), 1, 2); g.fillRect(Math.round(x), Math.round(y + 1), 1, 1);
      } else {
        g.fillRect(Math.round(x - 1.5), Math.round(y - 1), 2, 3);
        g.fillStyle = '#ffffff'; g.fillRect(Math.round(x - 1.5), Math.round(y - 1), 1, 1);
      }
      if (fierce) { // heavy brow slanting toward the snout
        g.strokeStyle = '#16141e'; g.lineWidth = 1.7; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x + r + 0.5, y - r - 1.2); g.lineTo(x - r - 0.5, y - r + 0.9); g.stroke();
      }
    },
  };
}

const PLANS = {
  quad(p, a, f) {
    const legH = f.has('legs_long') ? 14 : 9;
    const by = f.has('legs_long') ? 36 : 40;
    // tail
    if (f.has('tail_bushy')) p.ell(52, by - 6, 8, 5, a.c2, -0.6);
    else if (f.has('tail_short')) p.ell(50, by - 4, 3, 3, a.c2);
    // legs
    for (const x of [24, 30, 40, 46]) p.rect(x - 2, by + 4, 5, legH, x % 2 ? a.c2 : shade(a.c1, -0.12));
    // body
    p.ell(36, by, 16, 10, a.c1);
    p.ell(36, by + 4, 12, 5, shade(a.c1, 0.12));
    if (f.has('spots')) for (const [x, y] of [[32, by - 4], [40, by - 2], [44, by - 6], [28, by - 1]]) p.ell(x, y, 2, 1.6, a.c2);
    if (f.has('mane')) p.ell(24, by - 8, 8, 9, a.c2);
    if (f.has('bird_on_back')) { p.ell(38, by - 12, 4, 3, '#f2e05c'); p.poly([[34, by - 12], [31, by - 11], [34, by - 10]], '#e8862a'); }
    if (f.has('mud')) p.ell(36, by + 8, 14, 3, '#6a4a2a');
    // head
    const hx = 18, hy = by - 12;
    if (f.has('ears_round')) { p.ell(hx + 4, hy - 9, 3, 3, a.c2); p.ell(hx - 5, hy - 8, 3, 3, a.c2); }
    if (f.has('ears_pointy')) { p.poly([[hx + 1, hy - 6], [hx + 6, hy - 16], [hx + 8, hy - 5]], a.c2); p.poly([[hx - 7, hy - 5], [hx - 6, hy - 15], [hx - 1, hy - 7]], a.c2); }
    if (f.has('ears_long')) { p.ell(hx + 6, hy - 10, 3, 7, a.c2, 0.4); p.ell(hx - 4, hy - 10, 3, 7, a.c2, -0.3); }
    if (f.has('antlers')) { p.line([[hx + 3, hy - 8], [hx + 7, hy - 20], [hx + 12, hy - 24]], '#e8d8b0', 2); p.line([[hx + 7, hy - 18], [hx + 2, hy - 23]], '#e8d8b0', 2); p.line([[hx - 3, hy - 8], [hx - 6, hy - 20]], '#e8d8b0', 2); }
    if (f.has('horns')) { p.line([[hx + 3, hy - 7], [hx + 10, hy - 14], [hx + 8, hy - 20]], '#efe4c4', 3); p.line([[hx - 4, hy - 7], [hx - 9, hy - 14], [hx - 7, hy - 20]], '#efe4c4', 3); }
    if (f.has('wool')) for (const [x, y, r] of [[26, by - 6, 8], [36, by - 9, 9], [46, by - 5, 8], [30, by + 2, 7], [42, by + 3, 7]]) p.ell(x, y, r, r * 0.85, a.c2);
    p.ell(hx, hy, 10, 9, a.c1);
    const sn = f.has('snout_long') ? 9 : f.has('snout') ? 7 : 5;
    p.ell(hx - sn + 2, hy + 3, sn, 4.5, shade(a.c1, 0.1));
    p.ell(hx - sn * 2 + 4, hy + 2, 2, 1.6, '#2a1a1a');
    if (f.has('mask')) p.ell(hx - 1, hy - 2, 6, 2.5, a.c2);
    p.eye(hx - 2, hy - 2);
    if (f.has('flower')) { for (let i = 0; i < 5; i++) p.ell(hx + 3 + Math.cos(i * 1.26) * 3, hy - 11 + Math.sin(i * 1.26) * 3, 2.5, 2.5, a.c3); p.ell(hx + 3, hy - 11, 1.5, 1.5, '#f2e05c'); }
    if (f.has('flower2')) for (const [x, y] of [[34, by - 11], [44, by - 9]]) { p.ell(x, y, 3, 3, a.c3); p.ell(x, y, 1, 1, '#f2e05c'); }
    if (f.has('tree')) { p.rect(38, by - 24, 4, 14, a.c2); p.ell(40, by - 26, 12, 8, '#2f7a3a'); for (const [x, y] of [[34, by - 28], [44, by - 25], [40, by - 31]]) p.ell(x, y, 2.5, 2, a.c3); }
  },
  cat(p, a, f) {
    p.line([[50, 40], [58, 30], [56, 22]], a.c1, 4);
    for (const x of [26, 31, 42, 47]) p.rect(x - 2, 42, 4, 12, shade(a.c1, -0.1));
    p.ell(37, 40, 14, 8, a.c1);
    p.ell(37, 44, 10, 3, a.c3);
    for (const [x, y] of [[33, 37], [41, 36], [45, 41], [29, 40], [37, 42]]) p.ell(x, y, 1.8, 1.4, a.c2);
    p.poly([[16, 22], [18, 12], [23, 21]], a.c1); p.poly([[24, 21], [28, 12], [30, 23]], a.c1);
    p.ell(22, 28, 9, 8, a.c1);
    p.ell(17, 31, 5, 3.5, a.c3);
    p.ell(13, 30, 1.6, 1.3, '#d86a7a');
    p.eye(19, 26); p.eye(26, 26, 2.2);
    p.rect(20, 22, 1, 2, a.c2); p.rect(23, 21, 1, 2, a.c2);
  },
  bird(p, a, f) {
    const small = f.has('small');
    const s = small ? 0.75 : 1;
    const bx = 34, by = small ? 40 : 38;
    // legs
    p.line([[bx - 2, by + 8], [bx - 3, 58]], '#d8a040', 2); p.line([[bx + 4, by + 8], [bx + 5, 58]], '#d8a040', 2);
    // tail
    p.poly([[bx + 10 * s, by - 2], [bx + 24 * s, by - 8 * s], [bx + 22 * s, by + 4]], a.c2);
    if (f.has('big_wings')) p.poly([[bx, by - 6], [bx + 28, by - 26], [bx + 22, by - 6]], shade(a.c2, -0.05));
    p.ell(bx, by, 13 * s, 11 * s, a.c1);
    p.ell(bx - 2, by + 4 * s, 9 * s, 6 * s, f.has('mask') && a.c1 !== '#f2d02a' ? '#f2f2f2' : shade(a.c1, 0.15));
    p.ell(bx + 4, by - 1, 9 * s, 6 * s, a.c2, -0.3);
    if (f.has('spurs')) p.poly([[bx - 4, by - 2], [bx - 8, by - 6], [bx - 4, by - 6]], a.c3);
    if (f.has('oven')) { p.ell(bx + 2, by - 13, 10, 7, '#a8582a'); p.ell(bx - 2, by - 12, 3, 3, '#3a2010'); }
    if (f.has('lightning')) { p.poly([[bx + 6, by - 30], [bx + 1, by - 18], [bx + 6, by - 18], [bx + 2, by - 6], [bx + 12, by - 22], [bx + 7, by - 22], [bx + 11, by - 30]], a.c3); }
    // neck/head
    const long = f.has('long_neck');
    const hx = bx - 12 * s, hy = long ? by - 20 : by - 13 * s;
    if (long) p.line([[bx - 6, by - 4], [hx + 2, hy + 4]], a.c1, 6);
    if (f.has('crest')) p.poly([[hx + 2, hy - 6], [hx + 12, hy - 14], [hx + 6, hy - 4]], a.c2);
    p.ell(hx, hy, 8 * s, 7.5 * s, f.has('red_head') ? a.c3 : a.c1);
    const beakLen = f.has('long_beak') ? 16 : f.has('parrot') ? 6 : 8;
    if (f.has('parrot')) { p.ell(hx - 7, hy + 2, 4, 4, '#f2e8c8'); p.poly([[hx - 10, hy + 1], [hx - 6, hy + 6], [hx - 6, hy]], '#3a3a3a'); }
    else p.poly([[hx - 5 * s, hy - 1], [hx - 5 * s - beakLen * s, hy + 1], [hx - 5 * s, hy + 3]], f.has('red_head') ? '#f2e8c8' : f.has('long_beak') ? '#2a2a2a' : '#e8a030');
    if (f.has('mask')) { p.rect(hx - 6, hy - 3, 12 * s, 3, a.c2 === '#3a3a44' || a.c2 === '#2a2a34' ? a.c2 : '#2a2a2a'); p.rect(hx - 6, hy - 6, 12 * s, 2, a.c3 === '#ffffff' ? '#ffffff' : a.c1); }
    p.eye(hx - 1, hy - 1, small ? 2 : 2.6);
    if (a.c3 && f.has('mask') && a.c3 === '#e0263a') p.ell(hx - 1, hy - 1, 3.2, 3.2, 'rgba(224,38,58,0.0)');
  },
  runner(p, a) {
    p.line([[38, 38], [34, 58]], '#c8b070', 3); p.line([[44, 38], [48, 58]], '#c8b070', 3);
    p.ell(40, 32, 15, 10, a.c1);
    p.ell(44, 28, 10, 7, a.c2);
    p.poly([[52, 26], [62, 22], [58, 34]], a.c2);
    p.line([[30, 30], [24, 18], [20, 10]], a.c1, 6);
    p.ell(18, 8, 6, 5, a.c1);
    p.poly([[13, 7], [5, 9], [13, 10]], a.c3);
    p.eye(17, 7, 2);
  },
  snake(p, a, f) {
    p.ell(34, 54, 20, 6, a.c1);
    p.ell(36, 46, 15, 6, shade(a.c1, -0.05));
    p.ell(34, 39, 10, 5, a.c1);
    p.line([[30, 38], [22, 30], [22, 24]], a.c1, 7);
    p.ell(18, 21, 9, 6, a.c1, -0.1);
    if (f.has('pattern')) for (const [x, y] of [[22, 54], [34, 52], [46, 55], [28, 46], [42, 45], [34, 39], [24, 30]]) p.poly([[x - 3, y], [x, y - 2.5], [x + 3, y], [x, y + 2.5]], a.c2);
    p.ell(16, 23, 6, 2, a.c3);
    p.line([[9, 22], [4, 22], [2, 20]], '#e0263a', 1);
    if (f.has('fangs')) { p.rect(11, 24, 1, 3, '#ffffff'); p.rect(14, 24, 1, 3, '#ffffff'); }
    p.eye(17, 18, 2.2);
  },
  seal(p, a, f) {
    const dark = shade(a.c1, -0.14);
    // hind flippers, fanned out behind
    p.poly([[54, 52], [67, 45], [71, 48], [66, 52], [71, 56], [66, 58], [54, 58]], dark);
    // torso: heavy chest, tapering to the rear
    p.ell(40, 47, 21, 11, a.c1, -0.12);
    p.ell(38, 53, 15, 5.5, a.c2);
    // fore flipper planted on the ground
    p.poly([[28, 48], [34, 49], [38, 58], [30, 61], [22, 60], [26, 54]], dark);
    // neck and chest raised
    p.line([[31, 43], [26, 32]], a.c1, 14);
    if (f.has('mane')) {
      p.ell(28, 36, 12, 11, dark);
      for (const [x, y] of [[19, 41], [22, 46], [36, 30]]) p.poly([[x, y], [x + 4, y - 4], [x + 6, y + 1]], dark);
    }
    // head with the sea-lion's blunt, dog-like snout
    p.ell(22, 27, 9, 8, a.c1);
    p.ell(13, 30, 7, 4.5, a.c1);
    p.ell(12, 32.5, 5, 2.6, a.c2);
    p.ell(7, 30, 1.9, 1.5, a.c3);
    p.poly([[25, 22], [30, 18], [29, 25]], dark);
    if (f.has('crest')) p.ell(21, 19.5, f.has('mane') ? 7 : 4.5, f.has('mane') ? 5 : 3.5, shade(a.c1, 0.05));
    for (const y of [29, 31.5]) { p.line([[10, y], [2, y - 1]], '#f0eadc', 1); p.line([[10, y + 0.5], [3, y + 3]], '#f0eadc', 1); }
    p.eye(17, 25, 2.5);
    if (f.has('scars')) { p.line([[20, 21], [26, 28]], '#d8c0a8', 1); p.line([[34, 38], [40, 44]], '#d8c0a8', 1); }
  },

  turtle(p, a) {
    for (const x of [22, 46]) p.ell(x, 52, 6, 3, a.c3);
    p.ell(14, 44, 7, 6, a.c3);
    p.eye(12, 42, 2);
    p.ell(34, 44, 19, 12, a.c2);
    for (const [x, y] of [[28, 40], [38, 38], [34, 46], [44, 44], [24, 46]]) p.ell(x, y, 4.5, 3.5, a.c1);
    p.rect(16, 48, 36, 3, shade(a.c2, -0.12));
  },
  plant(p, a, f) {
    if (f.has('rocks')) { p.ell(24, 54, 8, 5, '#8a8a92'); p.ell(44, 55, 7, 4, '#7a7a82'); }
    p.rect(30, 26, 9, 32, a.c2);
    for (let y = 30; y < 56; y += 5) p.rect(30, y, 9, 2, shade(a.c2, -0.12));
    if (f.has('palm')) {
      const fr = [[-1, -0.2], [-0.6, -0.9], [0, -1], [0.6, -0.9], [1, -0.2], [-0.95, 0.35], [0.95, 0.35]];
      for (const [dx, dy] of fr) p.poly([[34, 24], [34 + dx * 26, 24 + dy * 18 - 2], [34 + dx * 22, 24 + dy * 18 + 4]], dx > 0 ? shade(a.c1, -0.08) : a.c1);
      p.ell(34, 24, 8, 6, a.c1);
    }
    if (f.has('fruits')) for (const [x, y] of [[29, 30], [33, 32], [38, 30], [36, 34]]) p.ell(x, y, 2.4, 2.4, a.c3);
    p.eye(32, 40, 2.2); p.eye(37, 40, 2.2);
    p.rect(32, 45, 5, 1, '#3a2010');
  },
  bug(p, a, f) {
    if (f.has('wings4')) { p.ell(42, 22, 12, 6, 'rgba(200,240,255,0.85)', -0.5); p.ell(46, 30, 10, 5, 'rgba(200,240,255,0.85)', -0.2); }
    else p.ell(42, 26, 11, 6, 'rgba(200,240,255,0.85)', -0.5);
    p.ell(44, 42, 12, 8, a.c2);
    if (f.has('glow')) p.ell(50, 44, 7, 6, a.c3);
    p.ell(30, 38, 8, 7, a.c1);
    p.ell(20, 34, 7, 6, a.c1);
    if (f.has('antennae')) { p.line([[18, 29], [12, 18], [8, 16]], a.c1, 1.5); p.line([[22, 29], [22, 18], [26, 14]], a.c1, 1.5); }
    for (const x of [26, 32, 38]) p.line([[x, 44], [x - 3, 54]], a.c1, 2);
    p.eye(17, 33, 2.4);
  },
  lizard(p, a, f) {
    p.line([[48, 46], [56, 42], [62, 34]], a.c1, 6);
    if (f.has('flame_tail')) { p.ell(62, 28, 4, 7, a.c3); p.ell(62, 30, 2, 4, '#ffe05c'); }
    for (const x of [26, 44]) { p.ell(x, 52, 4, 6, a.c1); p.ell(x - 2, 57, 4, 2, a.c1); }
    p.ell(36, 46, 16, 8, a.c1);
    p.ell(34, 49, 12, 4, a.c2);
    if (f.has('spots')) for (let x = 26; x <= 46; x += 5) p.rect(x, 40 + (x % 2) * 2, 3, 2, a.c2);
    if (f.has('crest')) for (let x = 20; x <= 42; x += 6) p.poly([[x, 38], [x + 3, 32], [x + 6, 38]], a.c3);
    if (f.has('mane')) p.ell(22, 34, 9, 8, a.c3);
    p.ell(16, 38, 11, 7, a.c1);
    p.ell(10, 41, 6, 3, a.c2);
    p.rect(5, 41, 7, 1, '#1a1a24');
    p.eye(16, 35, 2.4);
  },
  armadillo(p, a, f) {
    for (const x of [22, 30, 40, 48]) p.rect(x - 2, 48, 5, 8, a.c3);
    p.poly([[50, 48], [62, 54], [52, 52]], a.c1);
    p.ell(36, 44, 18, 13, a.c1);
    for (let x = 26; x <= 46; x += 5) p.rect(x, 33, 2, 22, a.c2);
    if (f.has('spikes')) for (let x = 24; x <= 48; x += 6) p.poly([[x - 3, 33], [x, 25], [x + 3, 33]], a.c2);
    p.rect(18, 50, 36, 4, shade(a.c1, -0.1));
    p.ell(16, 44, 8, 6, a.c3);
    p.poly([[10, 42], [2, 46], [10, 48]], a.c3);
    p.ell(19, 36, 3, 4, a.c3);
    p.eye(14, 42, 2);
  },
  croc(p, a, f) {
    p.poly([[52, 46], [64, 50], [52, 52]], a.c1);
    for (const x of [24, 46]) p.rect(x - 3, 50, 6, 7, shade(a.c1, -0.1));
    p.ell(38, 46, 18, 7, a.c1);
    p.ell(38, 50, 14, 3, a.c3);
    for (let x = 26; x <= 52; x += 5) p.poly([[x - 2, 40], [x, f.has('spikes') ? 33 : 36], [x + 2, 40]], a.c2);
    p.ell(18, 44, 8, 6, a.c1);
    p.rect(0, 42, 16, 7, a.c1);
    p.rect(0, 46, 14, 1, '#1a1a24');
    for (let x = 2; x < 14; x += 3) p.rect(x, 47, 1, 2, '#ffffff');
    p.ell(18, 39, 4, 3, a.c1);
    p.eye(18, 39, 2.2);
  },
  whale(p, a) {
    p.poly([[56, 34], [64, 18], [70, 22], [62, 36], [72, 44], [64, 46], [56, 40]], a.c1);
    p.ell(32, 38, 30, 15, a.c1);
    p.ell(30, 46, 24, 6, a.c2);
    for (let x = 14; x < 44; x += 6) p.rect(x, 44, 2, 6, shade(a.c2, -0.15));
    for (const [x, y] of [[8, 30], [12, 26], [18, 24]]) p.ell(x, y, 2.5, 2, '#e8e8e0');
    p.ell(30, 50, 8, 3, shade(a.c1, -0.1), 0.3);
    p.rect(4, 40, 18, 1, '#1a1a24');
    p.eye(18, 34, 2.4);
    for (const [x, y, r] of [[20, 10, 2], [16, 16, 2.5], [22, 18, 1.5]]) p.ell(x, y, r, r, a.c3);
  },
  sun(p, a) {
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const r1 = 18, r2 = i % 2 ? 30 : 26;
      if (i % 2) p.poly([[32 + Math.cos(ang - 0.12) * r1, 34 + Math.sin(ang - 0.12) * r1], [32 + Math.cos(ang) * r2, 34 + Math.sin(ang) * r2], [32 + Math.cos(ang + 0.12) * r1, 34 + Math.sin(ang + 0.12) * r1]], a.c2);
      else {
        const pts = [];
        for (let t = -0.14; t <= 0.14; t += 0.07) pts.push([32 + Math.cos(ang + t + Math.sin(t * 30) * 0.03) * (r1 + (t + 0.14) * 40), 34 + Math.sin(ang + t) * (r1 + (t + 0.14) * 40)]);
        p.poly([[32 + Math.cos(ang - 0.15) * r1, 34 + Math.sin(ang - 0.15) * r1], ...pts.slice(-2), [32 + Math.cos(ang + 0.15) * r1, 34 + Math.sin(ang + 0.15) * r1]], a.c2);
      }
    }
    p.ell(32, 34, 18, 18, a.c1);
    p.ell(28, 30, 10, 8, a.c3);
    p.ell(26, 31, 3, 2, '#ffffff'); p.ell(38, 31, 3, 2, '#ffffff');
    p.rect(25, 30, 2, 2, '#3a2010'); p.rect(37, 30, 2, 2, '#3a2010');
    p.rect(23, 27, 6, 1, a.c2); p.rect(35, 27, 6, 1, a.c2);
    p.poly([[32, 31], [30, 38], [33, 38]], a.c2);
    p.rect(28, 42, 9, 2, '#a85a1a');
  },
  fish(p, a, f) {
    p.poly([[52, 36], [68, 22], [65, 36], [68, 50]], a.c2);
    p.ell(36, 38, 22, 13, a.c1);
    p.ell(34, 45, 17, 6, a.c3);
    p.poly([[26, 27], [37, 14], [47, 27]], a.c2);
    p.poly([[33, 46], [28, 57], [42, 50]], a.c2);
    if (f.has('stripe')) { p.rect(15, 36, 40, 2, a.c3); p.rect(18, 32, 34, 1, a.c3); }
    if (f.has('spikes')) for (const x of [24, 30, 36, 42]) p.poly([[x - 2, 27], [x, 20], [x + 2, 27]], a.c3);
    if (f.has('whiskers')) { p.line([[16, 42], [8, 48]], a.c2, 1.5); p.line([[17, 44], [10, 54]], a.c2, 1.5); }
    p.line([[27, 31], [25, 45]], shade(a.c1, -0.22), 2);
    p.rect(14, 41, 7, 1, '#1a1a24');
    p.eye(20, 34, 2.6);
  },
  frog(p, a, f) {
    p.ell(50, 50, 10, 7, a.c1, -0.4);
    p.ell(54, 57, 9, 3, a.c2);
    p.ell(34, 44, 19, 12, a.c1);
    p.ell(29, 51, 12, 6, a.c3);
    if (f.has('spots')) for (const [x, y] of [[36, 36], [44, 40], [30, 38], [48, 46]]) p.ell(x, y, 2.4, 2, a.c2);
    p.ell(20, 41, 13, 9, a.c1);
    p.ell(14, 31, 5, 5, a.c1); p.ell(26, 30, 5, 5, a.c1);
    p.eye(14, 30, 2.8); p.eye(26, 29, 2.8);
    if (f.has('horns')) { p.poly([[10, 26], [8, 18], [14, 25]], a.c3); p.poly([[28, 25], [32, 17], [31, 26]], a.c3); }
    if (f.has('sac')) p.ell(17, 50, 6, 5, a.c3);
    p.rect(7, 44, 18, 1, '#1a1a24');
    p.ell(22, 57, 6, 3, a.c2);
  },
  golem(p, a, f) {
    for (const x of [24, 41]) p.rect(x, 46, 10, 12, a.c2);
    p.rect(22, 56, 14, 3, shade(a.c2, -0.15)); p.rect(39, 56, 14, 3, shade(a.c2, -0.15));
    p.rect(14, 34, 8, 18, a.c2); p.rect(51, 34, 8, 18, a.c2);
    p.ell(18, 52, 6, 5, a.c1); p.ell(55, 52, 6, 5, a.c1);
    p.ell(36, 38, 18, 14, a.c1);
    p.ell(20, 33, 8, 7, a.c2); p.ell(52, 33, 8, 7, a.c2);
    p.poly([[22, 30], [36, 24], [50, 30], [46, 48], [26, 48]], shade(a.c1, 0.1));
    p.line([[32, 36], [37, 42], [34, 48]], shade(a.c1, -0.3), 1);
    if (f.has('crystals')) for (const [x, y, h] of [[27, 22, 18], [36, 18, 22], [45, 22, 17], [18, 28, 12], [54, 28, 12]]) p.poly([[x - 3, y], [x, y - h], [x + 3, y]], a.c3);
    if (f.has('moss')) { p.ell(30, 28, 6, 3, '#4a9a3c'); p.ell(48, 34, 4, 2, '#4a9a3c'); }
    if (f.has('columns')) for (let x = 20; x <= 50; x += 6) p.rect(x, 28, 3, 20, shade(a.c1, x % 12 ? -0.1 : 0.1));
    if (f.has('rod')) { p.rect(35, 4, 3, 16, '#8a8a96'); p.ell(36, 4, 4, 4, a.c3); }
    p.ell(36, 22, 10, 9, a.c1);
    p.rect(30, 20, 4, 3, a.c3); p.rect(39, 20, 4, 3, a.c3);
    p.rect(33, 27, 7, 1, '#1a1a24');
  },
  biped(p, a, f) {
    for (const x of [26, 40]) p.rect(x, 46, 8, 11, a.c2);
    p.rect(23, 56, 12, 3, '#2a2a2a'); p.rect(39, 56, 12, 3, '#2a2a2a');
    p.ell(36, 38, 14, 12, a.c1);
    p.rect(23, 36, 26, 3, a.c3);
    p.ell(21, 39, 5, 9, a.c1, 0.2); p.ell(51, 39, 5, 9, a.c1, -0.2);
    p.ell(18, 48, 5, 5, f.has('gloves') ? a.c3 : a.c2); p.ell(54, 48, 5, 5, f.has('gloves') ? a.c3 : a.c2);
    p.ell(36, 22, 10, 10, a.c2);
    if (f.has('hat')) { p.ell(36, 15, 17, 3, '#2a2a2a'); p.ell(36, 10, 9, 6, '#2a2a2a'); p.rect(27, 13, 18, 2, a.c3); }
    else if (f.has('horns')) { p.poly([[28, 16], [24, 6], [32, 14]], '#efe4c4'); p.poly([[44, 16], [48, 6], [40, 14]], '#efe4c4'); }
    else p.rect(26, 17, 20, 3, a.c3);
    if (f.has('beard')) p.ell(36, 29, 6, 4, shade(a.c2, -0.3));
    p.eye(32, 23, 2.2); p.eye(41, 23, 2.2);
    p.rect(33, 28, 6, 1, '#3a1a1a');
    if (f.has('drum')) { p.ell(36, 46, 9, 6, '#7a4a2a'); p.rect(27, 44, 18, 2, a.c3); }
  },
  spider(p, a, f) {
    for (let i = 0; i < 4; i++) {
      p.line([[30, 40], [18 - i * 2, 30 + i * 7], [10 - i * 2, 44 + i * 4]], shade(a.c1, -0.15), 2);
      p.line([[42, 40], [54 + i * 2, 30 + i * 7], [62 + i * 2, 44 + i * 4]], shade(a.c1, -0.15), 2);
    }
    if (f.has('tail_sting')) { p.line([[54, 44], [64, 34], [62, 20], [52, 14]], a.c1, 5); p.poly([[53, 12], [47, 17], [56, 18]], a.c3); }
    p.ell(46, 42, 14, 11, a.c1);
    if (f.has('hourglass')) { p.poly([[40, 36], [52, 36], [46, 42]], a.c3); p.poly([[40, 49], [52, 49], [46, 42]], a.c3); }
    p.ell(27, 40, 10, 8, a.c2);
    if (f.has('claws')) { p.ell(14, 38, 6, 4, a.c2); p.ell(15, 46, 6, 4, a.c2); }
    p.eye(22, 37, 2); p.eye(28, 35, 2); p.eye(22, 43, 1.6); p.eye(28, 42, 1.6);
  },
  moth(p, a, f) {
    if (f.has('bat')) {
      p.poly([[33, 32], [4, 20], [10, 34], [5, 46], [18, 42], [28, 54]], a.c1);
      p.poly([[39, 32], [68, 20], [62, 34], [67, 46], [54, 42], [44, 54]], a.c1);
      p.ell(36, 38, 7, 12, a.c2);
      p.ell(36, 26, 8, 7, a.c2);
      p.poly([[30, 22], [28, 12], [34, 20]], a.c2); p.poly([[42, 22], [44, 12], [38, 20]], a.c2);
      p.rect(33, 31, 1, 3, '#fff'); p.rect(38, 31, 1, 3, '#fff');
      p.eye(32, 25, 2); p.eye(40, 25, 2);
      return;
    }
    p.ell(20, 30, 17, 13, a.c1, -0.4); p.ell(52, 30, 17, 13, a.c1, 0.4);
    p.ell(24, 46, 12, 9, a.c2, 0.3); p.ell(48, 46, 12, 9, a.c2, -0.3);
    p.ell(18, 29, 5, 4, a.c3); p.ell(54, 29, 5, 4, a.c3); p.ell(25, 47, 3, 3, a.c3); p.ell(47, 47, 3, 3, a.c3);
    p.ell(36, 38, 5, 14, '#3a2a1a');
    p.ell(36, 22, 6, 6, '#3a2a1a');
    p.line([[34, 18], [28, 8], [24, 6]], '#3a2a1a', 1.5); p.line([[38, 18], [44, 8], [48, 6]], '#3a2a1a', 1.5);
    p.eye(34, 22, 2); p.eye(39, 22, 2);
  },
  wisp(p, a, f) {
    if (f.has('cloud')) {
      for (const [x, y, rx, ry] of [[24, 30, 12, 9], [38, 24, 14, 11], [52, 31, 12, 9], [36, 34, 20, 8]]) p.ell(x, y, rx, ry, a.c1);
      p.ell(36, 38, 18, 5, a.c2);
      p.poly([[34, 40], [28, 52], [36, 50], [32, 62], [46, 46], [38, 47], [42, 40]], a.c3);
      p.eye(30, 31, 2.4); p.eye(42, 31, 2.4);
      return;
    }
    p.poly([[36, 6], [24, 30], [48, 30]], a.c1);
    p.ell(36, 36, 15, 16, a.c1);
    p.poly([[22, 44], [14, 58], [30, 52], [36, 60], [44, 52], [58, 58], [50, 44]], a.c2);
    p.ell(36, 38, 9, 11, a.c3);
    if (f.has('lantern')) { p.rect(28, 50, 16, 9, '#3a2a1a'); p.rect(30, 52, 12, 5, a.c3); }
    if (f.has('halo')) { p.line([[22, 10], [36, 4], [50, 10]], a.c3, 2); }
    p.eye(31, 34, 2.4); p.eye(41, 34, 2.4);
    p.rect(34, 42, 4, 1, '#1a1a24');
  },
  rodent(p, a, f) {
    p.line([[52, 50], [62, 44], [64, 34]], a.c2, 3);
    p.ell(38, 44, 15, 12, a.c1);
    p.ell(34, 48, 10, 7, a.c3);
    p.ell(30, 57, 5, 2.5, a.c2); p.ell(44, 57, 5, 2.5, a.c2);
    p.ell(26, 48, 3, 5, a.c2);
    if (f.has('claws')) for (const x of [22, 25, 28]) p.line([[x, 52], [x - 2, 57]], '#efe4c4', 1.5);
    p.ell(24, 32, 11, 10, a.c1);
    p.ell(23, 22, 3.5, 3.5, a.c2); p.ell(33, 22, 3.5, 3.5, a.c2);
    p.ell(16, 36, 5, 3.5, a.c3);
    p.ell(12, 35, 1.6, 1.4, '#2a1a1a');
    p.rect(15, 39, 2, 3, '#ffffff'); p.rect(18, 39, 2, 3, '#ffffff');
    if (f.has('whiskers')) { p.line([[10, 36], [2, 33]], a.c2, 1); p.line([[10, 38], [2, 40]], a.c2, 1); }
    p.eye(22, 30, 2.4);
  },
  owl(p, a, f) {
    p.ell(36, 40, 15, 16, a.c1);
    p.ell(34, 45, 9, 10, a.c3);
    p.ell(52, 40, 6, 13, a.c2, -0.2);
    p.rect(28, 56, 4, 3, '#d8a040'); p.rect(38, 56, 4, 3, '#d8a040');
    p.ell(34, 22, 14, 12, a.c1);
    p.poly([[22, 14], [24, 3], [30, 13]], a.c2); p.poly([[39, 13], [45, 3], [47, 14]], a.c2);
    p.ell(34, 23, 11, 9, a.c3);
    p.eye(29, 22, 3.6); p.eye(39, 22, 3.6);
    p.poly([[32, 26], [34, 32], [36, 26]], '#e8a030');
  },
  bloom(p, a, f) {
    p.rect(32, 34, 8, 24, a.c2);
    p.ell(30, 58, 6, 3, a.c2); p.ell(42, 58, 6, 3, a.c2);
    p.ell(22, 44, 10, 4, a.c1, -0.6); p.ell(50, 44, 10, 4, a.c1, 0.6);
    if (f.has('thorns')) for (const [x, y] of [[31, 40], [41, 44], [31, 50], [41, 54]]) p.poly([[x, y - 2], [x + (x < 36 ? -5 : 5), y], [x, y + 2]], a.c3);
    if (f.has('tree')) {
      p.ell(36, 22, 21, 14, a.c1); p.ell(25, 17, 10, 8, shade(a.c1, 0.1)); p.ell(48, 18, 9, 7, shade(a.c1, -0.1));
      for (const [x, y] of [[26, 20], [44, 14], [38, 26], [50, 24]]) p.ell(x, y, 2.6, 2.6, a.c3);
      p.eye(32, 36, 2.2); p.eye(40, 36, 2.2);
      return;
    }
    for (let i = 0; i < 8; i++) p.ell(36 + Math.cos(i * Math.PI / 4) * 12, 20 + Math.sin(i * Math.PI / 4) * 12, 6, 4, a.c3, i * Math.PI / 4);
    p.ell(36, 20, 9, 9, a.c2);
    p.eye(32, 19, 2.2); p.eye(40, 19, 2.2);
    p.rect(34, 24, 4, 1, '#3a1a1a');
  },
  crab(p, a, f) {
    for (const [x, dx] of [[24, -12], [30, -10], [42, 10], [48, 12]]) p.line([[x, 46], [x + dx, 52], [x + dx * 1.1, 58]], shade(a.c1, -0.15), 2);
    p.ell(36, 42, 19, 10, a.c1);
    for (const [x, y] of [[28, 40], [36, 38], [44, 41]]) p.ell(x, y, 2.4, 2, a.c3);
    p.line([[20, 40], [12, 34]], a.c1, 4); p.line([[52, 40], [60, 34]], a.c1, 4);
    p.ell(11, 31, 8, 6, a.c2); p.poly([[5, 27], [2, 22], [10, 26]], a.c2);
    p.ell(61, 31, 8, 6, a.c2); p.poly([[67, 27], [70, 22], [62, 26]], a.c2);
    p.line([[30, 34], [29, 25]], a.c1, 2); p.line([[42, 34], [43, 25]], a.c1, 2);
    p.eye(29, 24, 2.4); p.eye(43, 24, 2.4);
  },
  jelly(p, a, f) {
    for (let x = 22; x <= 50; x += 7) p.line([[x, 34], [x + Math.sin(x) * 4, 46], [x - 2, 58]], a.c3, 2);
    p.poly([[14, 34], [18, 16], [36, 8], [54, 16], [58, 34]], a.c1);
    p.ell(36, 34, 22, 5, a.c2);
    p.ell(36, 22, 11, 6, shade(a.c1, 0.2));
    if (f.has('float')) { p.ell(36, 6, 14, 6, a.c3); p.poly([[24, 8], [36, 16], [48, 8]], a.c3); }
    p.eye(29, 27, 2.2); p.eye(43, 27, 2.2);
  },
};

// ---------------------------------------------------------------------------
// Finishing pipeline: stage-aware decoration (crests, fins, flames that grow with
// each evolution) and a flat outline, applied identically to every species.

/** Evolution stage of each species: { i: position in its line, n: line length }. */
let stages = null;
function stageOf(key) {
  if (!stages) {
    stages = {};
    const pre = {};
    for (const s of Object.values(SPECIES)) if (s.evo) pre[s.evo.to] = s.key;
    for (const k of Object.keys(SPECIES)) {
      let i = 0;
      for (let c = k; pre[c]; c = pre[c]) i++;
      let n = i + 1;
      for (let c = k; SPECIES[c].evo; c = SPECIES[c].evo.to) n++;
      stages[k] = { i, n };
    }
  }
  return stages[key];
}

function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 1000;
}
const seedOf = (key) => [...key].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) | 0, 7);


function bounds(d, W, H) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (d[(y * W + x) * 4 + 3] < 110) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const top = [];
  for (let x = x0; x <= x1; x++) for (let y = 0; y < H; y++) if (d[(y * W + x) * 4 + 3] >= 110) { top[x] = y; break; }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, top };
}

/** Crests, fins, shards and flames that grow with the stage, drawn behind/over the silhouette's top. */
function decorate(g, sp, st, bb, seed) {
  if (st.n < 2 || st.i < 1 || bb.x1 < 0) return;
  const p = P(g, st);
  const big = st.i === st.n - 1 ? 1 : 0;           // final form
  const type = sp.types[0];
  const col = TYPES[type].color;
  const a = sp.art;
  const cnt = big ? 4 : 2;
  const span = bb.w * 0.42;
  const sx = bb.x0 + bb.w * 0.42;
  const k = (big ? 1.25 : 0.85);
  for (let n = 0; n < cnt; n++) {
    const x = Math.round(sx + (span * n) / Math.max(1, cnt - 1));
    if (bb.top[x] === undefined) continue;
    const hgt = (6 + (hash(n, 1, seed) % 5)) * k;
    const w = 3.2 * k;
    const y = bb.top[x] + 1 + (n === 0 || n === cnt - 1 ? 1 : 0);
    switch (type) {
      case 'fuego':
        p.poly([[x - w, y + 2], [x - 1, y - hgt * 0.5], [x + 1, y - hgt], [x + w * 0.6, y - hgt * 0.4], [x + w, y + 2]], '#ff7a1c');
        p.poly([[x - w * 0.5, y + 2], [x + 0.5, y - hgt * 0.6], [x + w * 0.5, y + 2]], '#ffd23c');
        break;
      case 'agua':
        p.poly([[x - w, y + 3], [x - 1, y - hgt * 0.9], [x + w, y + 3]], shade(col, 0.05));
        p.poly([[x - 1, y + 3], [x, y - hgt * 0.6], [x + w * 0.7, y + 3]], '#a8d8ff');
        break;
      case 'planta':
        p.ell(x, y - hgt * 0.4, 2.2 * k, hgt * 0.6, n % 2 ? '#4ca83c' : '#78c850', (n - 1.5) * 0.35);
        break;
      case 'electrico':
        p.poly([[x - 2, y + 2], [x + 1, y - hgt * 0.4], [x - 1, y - hgt * 0.4], [x + 2, y - hgt]], '#ffe83c');
        p.line([[x - 2, y + 2], [x + 1, y - hgt * 0.4], [x - 1, y - hgt * 0.4], [x + 2, y - hgt]], '#fff6a0', 1);
        break;
      case 'roca': case 'tierra':
        p.poly([[x - w, y + 3], [x - 1, y - hgt * 0.8], [x + 1, y - hgt], [x + w, y + 3]], shade(type === 'roca' ? '#8a8270' : '#a8804a', -0.04));
        p.poly([[x - 1, y + 3], [x + 0.5, y - hgt * 0.9], [x + w, y + 3]], shade(type === 'roca' ? '#8a8270' : '#a8804a', -0.18));
        break;
      case 'volador':
        p.ell(x + 2, y - hgt * 0.3, 2 * k, hgt * 0.7, '#f4f0ea', 0.5 + n * 0.1);
        p.ell(x + 2.5, y - hgt * 0.2, 1 * k, hgt * 0.5, col, 0.5 + n * 0.1);
        break;
      case 'veneno':
        p.poly([[x - w * 0.8, y + 2], [x, y - hgt], [x + w * 0.8, y + 2]], '#8a2a8a');
        p.ell(x + 3, y - hgt * 0.9, 1.4, 1.4, '#d880e0');
        break;
      case 'siniestro':
        p.poly([[x - w * 0.8, y + 2], [x - 1, y - hgt], [x + w * 0.8, y + 2]], '#2a2030');
        p.poly([[x - 0.5, y - hgt * 0.5], [x - 1, y - hgt], [x + 1, y - hgt * 0.6]], '#d8384a');
        break;
      case 'psiquico':
        p.poly([[x - 2, y - hgt * 0.4], [x, y - hgt], [x + 2, y - hgt * 0.4], [x, y + 1]], '#ff78b0');
        p.poly([[x - 0.5, y - hgt * 0.5], [x, y - hgt * 0.9], [x + 0.8, y - hgt * 0.5]], '#ffd8ec');
        break;
      case 'lucha':
        if (n === 0 || n === cnt - 1) {
          p.poly([[x - 3 * k, y + 3], [x - 2 * k, y - hgt * 0.5], [x + 3 * k, y - hgt * 0.3], [x + 3 * k, y + 3]], '#8c8c9c');
          p.line([[x - 2 * k, y - hgt * 0.5], [x + 3 * k, y - hgt * 0.3]], '#d8d8e4', 1);
        }
        break;
      case 'bicho':
        p.line([[x, y + 2], [x + 1, y - hgt * 0.5], [x + 3, y - hgt]], shade(a.c2, -0.1), 1.4);
        p.ell(x + 3, y - hgt, 1.4, 1.4, a.c3);
        break;
      default:
        if (big) p.ell(x, y - 1, 3.2, 2.2, shade(a.c2, 0.1), (n - 1.5) * 0.4);
    }
  }
}

/** Threshold alpha and add a uniform 1px dark outline: flat colours, no shading or relief. */
export function flatOutline(c) {
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) d[i + 3] = d[i + 3] >= 110 ? 255 : 0;
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] === 255;
  const marks = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (solid(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) marks.push((y * W + x) * 4);
  }
  for (const i of marks) { d[i] = 22; d[i + 1] = 20; d[i + 2] = 30; d[i + 3] = 255; }
  g.putImageData(img, 0, 0);
}

/** Front sprite (faces left). back=true returns a mirrored version for the player side. */
export function creatureSprite(key, { back = false } = {}) {
  const drawn = back ? overrideMirrored(`creature:${key}`, SPRITE, SPRITE) : override(`creature:${key}`, SPRITE, SPRITE);
  if (drawn) return drawn;
  const ck = `${key}|${back}`;
  if (cache.has(ck)) return cache.get(ck);
  const sp = SPECIES[key];
  const st = stageOf(key);
  const seed = seedOf(key);
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE;
  const g = c.getContext('2d');
  const a = sp.art;
  const baby = st.n > 1 && st.i === 0;
  const size = (a.size ?? 1) * 0.92 * (baby ? 0.86 : 1);
  g.save();
  g.translate(SPRITE / 2, SPRITE - 4);
  g.scale(size, size);
  g.translate(-34, -60);
  PLANS[a.plan](P(g, st), a, new Set(a.feats));
  g.restore();
  const bb = bounds(g.getImageData(0, 0, SPRITE, SPRITE).data, SPRITE, SPRITE);
  g.save();
  g.globalCompositeOperation = 'destination-over'; // crests sit behind the body
  decorate(g, sp, st, bb, seed);
  g.restore();
  flatOutline(c);
  let out = c;
  if (back) {
    out = document.createElement('canvas');
    out.width = out.height = SPRITE;
    const g2 = out.getContext('2d');
    g2.translate(SPRITE, 0);
    g2.scale(-1, 1);
    g2.drawImage(c, 0, 0);
  }
  cache.set(ck, out);
  return out;
}

const urlCache = new Map();
/** Data URL for DOM <img> usage (menus, dex). */
export function creatureIcon(key) {
  if (!urlCache.has(key)) urlCache.set(key, creatureSprite(key).toDataURL());
  return urlCache.get(key);
}

/** Black silhouette for unseen dex entries. */
export function silhouette(key) {
  const k = `sil|${key}`;
  if (!urlCache.has(k)) {
    const src = creatureSprite(key);
    const c = document.createElement('canvas');
    c.width = c.height = SPRITE;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#2a2838';
    g.fillRect(0, 0, SPRITE, SPRITE);
    urlCache.set(k, c.toDataURL());
  }
  return urlCache.get(k);
}

export function buildAllSprites(onProgress) {
  const keys = Object.keys(SPECIES);
  keys.forEach((k, i) => {
    creatureSprite(k);
    creatureSprite(k, { back: true });
    onProgress?.((i + 1) / keys.length);
  });
}
