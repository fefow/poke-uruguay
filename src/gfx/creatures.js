// Procedural creature sprites: each species has a recipe (body plan + colors +
// features). Shapes are drawn with canvas paths, then hard-thresholded and
// outlined so they read as pixel art. Facing left (toward the player).
import { SPECIES } from '../data/species.js';

export const SPRITE = 80;
const cache = new Map();

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function P(g) {
  return {
    ell(x, y, rx, ry, col, rot = 0) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); },
    rect(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); },
    poly(pts, col) { g.fillStyle = col; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); },
    line(pts, col, w = 2) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); },
    eye(x, y, r = 2.6) {
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = '#141420'; g.fillRect(Math.round(x - 1.5), Math.round(y - 1), 2, 3);
      g.fillStyle = '#ffffff'; g.fillRect(Math.round(x - 1.5), Math.round(y - 1), 1, 1);
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
    p.ell(38, 46, 18, 11, a.c1);
    p.ell(36, 50, 13, 6, a.c2);
    p.poly([[52, 50], [62, 44], [62, 56]], shade(a.c1, -0.1));
    p.ell(24, 54, 6, 3, shade(a.c1, -0.12), 0.4);
    p.line([[30, 40], [22, 30]], a.c1, 12);
    if (f.has('mane')) p.ell(24, 34, 11, 9, shade(a.c1, -0.15));
    p.ell(18, 24, 9, 8, a.c1);
    p.ell(12, 27, 5, 3.5, a.c2);
    p.ell(9, 26, 1.8, 1.4, a.c3);
    for (const y of [26, 28]) p.line([[11, y], [5, y + 1]], '#e8e0d0', 1);
    p.eye(17, 21, 2.6);
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
};

function pixelate(c, outline = '#16141e') {
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const W = c.width, H = c.height;
  for (let i = 0; i < d.length; i += 4) d[i + 3] = d[i + 3] >= 110 ? 255 : 0;
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] === 255;
  const out = parseInt(outline.slice(1), 16);
  const marks = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (solid(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) marks.push((y * W + x) * 4);
  }
  for (const i of marks) { d[i] = out >> 16; d[i + 1] = (out >> 8) & 255; d[i + 2] = out & 255; d[i + 3] = 255; }
  g.putImageData(img, 0, 0);
}

/** Front sprite (faces left). back=true returns a mirrored, darker-rim version for the player side. */
export function creatureSprite(key, { back = false } = {}) {
  const ck = `${key}|${back}`;
  if (cache.has(ck)) return cache.get(ck);
  const sp = SPECIES[key];
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE;
  const g = c.getContext('2d');
  const a = sp.art;
  const size = (a.size ?? 1) * 0.92;
  g.save();
  g.translate(SPRITE / 2, SPRITE - 4);
  g.scale(size, size);
  g.translate(-34, -60);
  PLANS[a.plan](P(g), a, new Set(a.feats));
  g.restore();
  // Belly-light / back-shadow pass, clipped to the silhouette.
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(255,255,255,0.10)';
  g.fillRect(0, 0, SPRITE, SPRITE * 0.45);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(0, SPRITE * 0.78, SPRITE, SPRITE);
  g.globalCompositeOperation = 'source-over';
  pixelate(c);
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
