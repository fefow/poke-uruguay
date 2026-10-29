// Procedural 16x16 pixel tileset (no external images).
import { Rng } from '../core/rng.js';

export const T = 16;

// Tile legend. solid = blocks movement; enc = wild encounters; anim = animated.
export const TILE_INFO = {
  '.': { name: 'pasto' },
  ',': { name: 'pastizal', enc: true },
  f: { name: 'flores' },
  '=': { name: 'camino' },
  c: { name: 'adoquines' },
  s: { name: 'arena' },
  b: { name: 'puente' },
  '~': { name: 'agua', solid: true, anim: true },
  '#': { name: 'árbol', solid: true },
  q: { name: 'ceibo', solid: true },
  p: { name: 'palmera', solid: true },
  R: { name: 'roca', solid: true },
  K: { name: 'acantilado', solid: true },
  k: { name: 'risco', solid: true },
  F: { name: 'cerco', solid: true },
  S: { name: 'cartel', solid: true },
  H: { name: 'pared', solid: true },
  w: { name: 'ventana', solid: true },
  D: { name: 'puerta' },
  r: { name: 'techo rojo', solid: true },
  u: { name: 'techo azul', solid: true },
  g: { name: 'techo verde', solid: true },
  o: { name: 'techo naranja', solid: true },
  v: { name: 'techo violeta', solid: true },
  W: { name: 'edificio', solid: true },
  L: { name: 'faro', solid: true },
  l: { name: 'base faro', solid: true },
  M: { name: 'La Mano', solid: true },
  Z: { name: 'tribuna', solid: true },
  z: { name: 'torre', solid: true },
  // interiors
  i: { name: 'piso' },
  Y: { name: 'piso gimnasio' },
  m: { name: 'felpudo' },
  x: { name: 'muro', solid: true },
  X: { name: 'muro ventana', solid: true },
  n: { name: 'mostrador', solid: true },
  B: { name: 'biblioteca', solid: true },
  T: { name: 'mesa', solid: true },
  P: { name: 'máquina', solid: true },
  E: { name: 'cama', solid: true },
  N: { name: 'maceta', solid: true },
  O: { name: 'vacío', solid: true },
  A: { name: 'alfombra' },
};

function mk() {
  const c = document.createElement('canvas');
  c.width = c.height = T;
  return c;
}

const px = (g, x, y, col, w = 1, h = 1) => {
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
};

function speckle(g, rng, base, dots, n) {
  px(g, 0, 0, base, T, T);
  for (let i = 0; i < n; i++) px(g, rng.int(0, 15), rng.int(0, 15), rng.pick(dots));
}

function grass(g, rng) {
  speckle(g, rng, '#78c850', ['#68b040', '#88d860', '#60a83c'], 14);
}

function roof(g, base, dark, light) {
  px(g, 0, 0, base, T, T);
  for (let y = 0; y < T; y += 4) {
    px(g, 0, y + 3, dark, T, 1);
    for (let x = (y / 4) % 2 ? 0 : 4; x < T; x += 8) px(g, x, y, dark, 1, 3);
  }
  px(g, 0, 0, light, T, 1);
}

const DRAW = {
  '.': (g, r) => grass(g, r),
  ',': (g, r) => {
    px(g, 0, 0, '#4a9a34', T, T);
    for (let i = 0; i < 9; i++) {
      const x = (i % 3) * 5 + r.int(0, 2);
      const y = Math.floor(i / 3) * 5 + 4;
      px(g, x, y, '#2e7a2a', 1, 3); px(g, x + 1, y - 2, '#3a8a30', 1, 5); px(g, x + 2, y, '#2e7a2a', 1, 3);
      px(g, x + 1, y - 2, '#8ad860');
    }
  },
  f: (g, r) => {
    grass(g, r);
    const cols = ['#f04a4a', '#f2e05c', '#ffffff', '#c86ae0'];
    for (let i = 0; i < 4; i++) {
      const x = r.int(1, 13), y = r.int(1, 13);
      const c = r.pick(cols);
      px(g, x, y - 1, c); px(g, x - 1, y, c); px(g, x + 1, y, c); px(g, x, y + 1, c); px(g, x, y, '#f2c02a');
    }
  },
  '=': (g, r) => speckle(g, r, '#d8bc84', ['#c8a870', '#e6cc98', '#bca06a'], 20),
  c: (g, r) => {
    px(g, 0, 0, '#9a948a', T, T);
    for (let y = 0; y < T; y += 4) for (let x = (y / 4) % 2 ? -2 : 0; x < T; x += 4) {
      px(g, x, y, r.pick(['#b4aea2', '#a8a296', '#bcb6aa']), 3, 3);
    }
  },
  s: (g, r) => speckle(g, r, '#f0dca0', ['#e4cc8a', '#f8ecc0', '#dcc080'], 18),
  b: (g) => {
    px(g, 0, 0, '#3a8fd8', T, T);
    for (let x = 0; x < T; x += 4) { px(g, x, 0, '#a87a4a', 3, T); px(g, x + 3, 0, '#6a4a2a', 1, T); }
    px(g, 0, 1, '#5a3a1a', T, 1); px(g, 0, 14, '#5a3a1a', T, 1);
  },
  '~': (g, r, frame) => {
    px(g, 0, 0, '#3a8fd8', T, T);
    for (let y = 2; y < T; y += 5) {
      const off = (frame * 2 + y) % 8;
      px(g, (off + 1) % T, y, '#7ab8f0', 4, 1);
      px(g, (off + 9) % T, y + 2, '#5aa4e8', 3, 1);
    }
  },
  '#': (g, r) => {
    grass(g, r);
    px(g, 6, 11, '#6a4a2a', 4, 5);
    g.fillStyle = '#2a6a2a'; g.beginPath(); g.arc(8, 7, 7, 0, 7); g.fill();
    g.fillStyle = '#3a8a34'; g.beginPath(); g.arc(7, 6, 5, 0, 7); g.fill();
    px(g, 4, 3, '#5aac44', 3, 2); px(g, 9, 5, '#5aac44', 2, 2);
  },
  q: (g, r) => {
    grass(g, r);
    px(g, 7, 9, '#6a4a2a', 3, 7);
    g.fillStyle = '#2f7a3a'; g.beginPath(); g.arc(8, 7, 7, 0, 7); g.fill();
    for (let i = 0; i < 9; i++) px(g, r.int(2, 13), r.int(1, 11), '#e0263a', 2, 1);
  },
  p: (g, r) => {
    speckle(g, r, '#f0dca0', ['#e4cc8a'], 6);
    px(g, 7, 6, '#8a6a3a', 2, 10);
    for (let i = 0; i < 6; i++) px(g, 7, 8 + i * 1.3, '#6a4a2a', 2, 1);
    const fronds = [[0, 3], [1, 2], [2, 2], [3, 1], [4, 2], [5, 3]];
    for (const [dx, dy] of fronds) { px(g, 2 + dx, 2 + dy, '#3a8a34', 2, 1); px(g, 9 + (5 - dx), 2 + dy, '#3a8a34', 2, 1); }
    px(g, 6, 1, '#4aa03c', 4, 4); px(g, 7, 5, '#ff9a2a', 2, 1);
  },
  R: (g, r) => {
    grass(g, r);
    g.fillStyle = '#6a6a72'; g.beginPath(); g.ellipse(8, 10, 7, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#9a9aa2'; g.beginPath(); g.ellipse(7, 9, 5, 3, 0, 0, 7); g.fill();
    px(g, 5, 7, '#c0c0c8', 3, 1);
  },
  K: (g, r) => {
    px(g, 0, 0, '#8a6a4a', T, T);
    for (let y = 0; y < T; y += 5) px(g, 0, y, '#6a4a30', T, 1);
    for (let i = 0; i < 8; i++) px(g, r.int(0, 14), r.int(0, 14), r.pick(['#a8845a', '#5c3e26']), 2, 1);
  },
  k: (g, r) => {
    px(g, 0, 0, '#a8845a', T, T);
    px(g, 0, 12, '#6a4a30', T, 4);
    for (let i = 0; i < 6; i++) px(g, r.int(0, 14), r.int(0, 11), '#8a6a4a', 3, 1);
  },
  F: (g, r) => {
    grass(g, r);
    px(g, 0, 6, '#8a5a2a', T, 2); px(g, 0, 11, '#8a5a2a', T, 2);
    px(g, 2, 3, '#6a4020', 2, 12); px(g, 11, 3, '#6a4020', 2, 12);
  },
  S: (g, r) => {
    grass(g, r);
    px(g, 7, 9, '#6a4020', 2, 6);
    px(g, 2, 3, '#8a5a2a', 12, 7); px(g, 3, 4, '#c8945a', 10, 5);
    px(g, 4, 5, '#6a4020', 8, 1); px(g, 4, 7, '#6a4020', 6, 1);
  },
  H: (g) => {
    px(g, 0, 0, '#f2e6c8', T, T);
    for (let y = 3; y < T; y += 4) px(g, 0, y, '#dccca8', T, 1);
    px(g, 0, 15, '#a89878', T, 1);
  },
  w: (g) => {
    DRAW.H(g);
    px(g, 3, 4, '#5a4a3a', 10, 8); px(g, 4, 5, '#8ac8f0', 8, 6); px(g, 8, 5, '#5a4a3a', 1, 6); px(g, 4, 8, '#5a4a3a', 8, 1);
    px(g, 4, 5, '#c8e8ff', 2, 1);
  },
  D: (g) => {
    DRAW.H(g);
    px(g, 3, 2, '#5a3a1a', 10, 14); px(g, 4, 3, '#8a5a2a', 8, 13); px(g, 10, 9, '#f2c02a', 1, 2);
  },
  r: (g) => roof(g, '#c8483a', '#8a2a20', '#e8685a'),
  u: (g) => roof(g, '#3a7ad8', '#2a4a9a', '#6a9ae8'),
  g: (g) => roof(g, '#4a9a4a', '#2a6a2a', '#6aba5a'),
  o: (g) => roof(g, '#e8862a', '#a85a1a', '#f8a85a'),
  v: (g) => roof(g, '#8a5ac8', '#5a3a8a', '#aa7ae8'),
  W: (g) => {
    px(g, 0, 0, '#c8c4bc', T, T);
    px(g, 2, 2, '#4a6a8a', 5, 5); px(g, 9, 2, '#4a6a8a', 5, 5); px(g, 2, 9, '#4a6a8a', 5, 5); px(g, 9, 9, '#4a6a8a', 5, 5);
    px(g, 2, 2, '#8ab0d0', 2, 1); px(g, 9, 9, '#8ab0d0', 2, 1);
  },
  L: (g, r) => {
    speckle(g, r, '#f0dca0', ['#e4cc8a'], 4);
    px(g, 4, 0, '#f2f2f2', 8, T); px(g, 4, 4, '#d83a3a', 8, 4); px(g, 4, 12, '#d83a3a', 8, 4);
    px(g, 3, 0, '#3a3a3a', 10, 2); px(g, 6, 1, '#fff27a', 4, 2);
  },
  l: (g, r) => {
    speckle(g, r, '#f0dca0', ['#e4cc8a'], 4);
    px(g, 3, 0, '#f2f2f2', 10, 14); px(g, 3, 4, '#d83a3a', 10, 4); px(g, 6, 9, '#5a3a1a', 4, 5); px(g, 2, 13, '#a89878', 12, 3);
  },
  M: (g, r) => {
    speckle(g, r, '#f0dca0', ['#e4cc8a'], 8);
    for (const [x, hgt] of [[1, 9], [4, 13], [7, 14], [10, 12], [13, 7]]) {
      px(g, x, 16 - hgt, '#e8e2d2', 2, hgt); px(g, x, 16 - hgt, '#ffffff', 1, 2);
    }
  },
  Z: (g) => {
    px(g, 0, 0, '#e8e4dc', T, T);
    for (let y = 2; y < T; y += 4) px(g, 0, y, '#a8a49c', T, 1);
    px(g, 0, 0, '#3a7ad8', T, 2);
  },
  z: (g) => {
    px(g, 0, 0, '#e8e4dc', T, T);
    px(g, 5, 0, '#c8c4bc', 6, T); px(g, 6, 2, '#5a5a6a', 4, 3);
  },
  i: (g, r) => {
    px(g, 0, 0, '#c8945a', T, T);
    for (let y = 0; y < T; y += 4) px(g, 0, y, '#a87a4a', T, 1);
    px(g, r.int(0, 15), 1, '#a87a4a', 1, 3);
  },
  Y: (g) => {
    px(g, 0, 0, '#d8d0c0', T, T);
    px(g, 0, 0, '#c8c0b0', 8, 8); px(g, 8, 8, '#c8c0b0', 8, 8);
  },
  A: (g) => {
    px(g, 0, 0, '#c83a3a', T, T);
    px(g, 1, 0, '#f2c02a', 1, T); px(g, 14, 0, '#f2c02a', 1, T);
  },
  m: (g) => {
    DRAW.i(g, new Rng(1));
    px(g, 1, 3, '#3a6a3a', 14, 10); px(g, 2, 4, '#4a8a4a', 12, 8);
  },
  x: (g) => {
    px(g, 0, 0, '#e6d8b8', T, T);
    px(g, 0, 12, '#a87a4a', T, 4);
    px(g, 0, 11, '#8a5a2a', T, 1);
  },
  X: (g) => {
    DRAW.x(g);
    px(g, 3, 2, '#5a4a3a', 10, 8); px(g, 4, 3, '#8ac8f0', 8, 6);
  },
  n: (g) => {
    DRAW.i(g, new Rng(2));
    px(g, 0, 2, '#8a5a2a', T, 12); px(g, 0, 2, '#c8945a', T, 3);
  },
  B: (g) => {
    px(g, 0, 0, '#6a4020', T, T);
    for (let y = 1; y < T; y += 5) {
      px(g, 1, y, '#3a2010', 14, 4);
      for (let x = 1; x < 15; x += 2) px(g, x, y, ['#c83a3a', '#3a7ad8', '#4a9a4a', '#f2c02a'][(x + y) % 4], 2, 4);
    }
  },
  T: (g) => {
    DRAW.i(g, new Rng(3));
    px(g, 1, 3, '#8a5a2a', 14, 9); px(g, 1, 3, '#b07a44', 14, 3); px(g, 2, 12, '#5a3a1a', 2, 3); px(g, 12, 12, '#5a3a1a', 2, 3);
  },
  P: (g) => {
    px(g, 0, 0, '#e6d8b8', T, T);
    px(g, 2, 2, '#7a8aa0', 12, 13); px(g, 4, 4, '#2a3a4a', 8, 5); px(g, 5, 5, '#5ae0a0', 3, 1);
    px(g, 4, 11, '#e0263a', 2, 2); px(g, 8, 11, '#f2c02a', 2, 2);
  },
  E: (g) => {
    DRAW.i(g, new Rng(4));
    px(g, 1, 1, '#6a4020', 14, 15); px(g, 2, 2, '#f2f2f2', 12, 4); px(g, 2, 6, '#3a7ad8', 12, 9);
  },
  N: (g) => {
    DRAW.i(g, new Rng(5));
    px(g, 5, 10, '#a8582a', 6, 5);
    g.fillStyle = '#3a8a34'; g.beginPath(); g.arc(8, 7, 5, 0, 7); g.fill();
  },
  O: (g) => px(g, 0, 0, '#141018', T, T),
};


// ---------------------------------------------------------------- themed interiors
// A map with `theme: 'x'` redraws the interior tile characters (floor, wall, counter…)
// with its own look, so clinics and each city's gym are recognisable at a glance.
const bannerCache = new Map();
/** Two 16x16 halves of a 32x16 banner whose emblem is painted by `paint(g)`. */
function banner(name, paint) {
  const whole = () => {
    if (!bannerCache.has(name)) {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 16;
      paint(c.getContext('2d'));
      bannerCache.set(name, c);
    }
    return bannerCache.get(name);
  };
  return [(g) => g.drawImage(whole(), 0, 0, 16, 16, 0, 0, 16, 16), (g) => g.drawImage(whole(), 16, 0, 16, 16, 0, 0, 16, 16)];
}

const clinicFloor = (g) => {
  px(g, 0, 0, '#e9f5f1', T, T);
  px(g, 0, 0, '#d4e8e2', 8, 8); px(g, 8, 8, '#d4e8e2', 8, 8);
  px(g, 0, 15, '#bcd8d0', T, 1); px(g, 15, 0, '#bcd8d0', 1, T);
};
const clinicWall = (g) => {
  px(g, 0, 0, '#d9efe9', T, T);
  px(g, 0, 11, '#ffffff', T, 5); px(g, 0, 10, '#3aa89a', T, 1); px(g, 0, 15, '#2a8a7e', T, 1);
};

const POLI_T = {
  i: clinicFloor,
  x: clinicWall,
  X: (g) => {
    clinicWall(g);
    px(g, 2, 1, '#ffffff', 12, 9); px(g, 2, 1, '#2a8a7e', 12, 1); px(g, 2, 9, '#2a8a7e', 12, 1); px(g, 2, 1, '#2a8a7e', 1, 9); px(g, 13, 1, '#2a8a7e', 1, 9);
    px(g, 6, 2, '#e0263a', 4, 7); px(g, 4, 4, '#e0263a', 8, 3);
  },
  n: (g) => {
    clinicFloor(g);
    px(g, 0, 3, '#3aa89a', T, 11); px(g, 0, 2, '#ffffff', T, 4); px(g, 0, 6, '#2a8a7e', T, 1); px(g, 0, 13, '#2a8a7e', T, 1);
  },
  A: (g) => { px(g, 0, 0, '#7ec8c0', T, T); px(g, 0, 0, '#5ab0a6', T, 1); px(g, 0, 15, '#5ab0a6', T, 1); },
  P: (g) => {
    clinicFloor(g);
    px(g, 2, 2, '#f4f4f4', 12, 13); px(g, 2, 2, '#bfc8cc', 12, 1); px(g, 4, 4, '#2a3a4a', 8, 5); px(g, 5, 5, '#5ae0a0', 3, 1);
    px(g, 4, 11, '#e0263a', 2, 2); px(g, 8, 11, '#3aa89a', 2, 2);
  },
  N: (g) => {
    clinicFloor(g);
    px(g, 5, 10, '#e8e8e8', 6, 5); px(g, 5, 10, '#bfc8cc', 6, 1);
    g.fillStyle = '#3a9a44'; g.beginPath(); g.arc(8, 7, 5, 0, 7); g.fill();
  },
  m: (g) => { clinicFloor(g); px(g, 1, 3, '#2a8a7e', 14, 10); px(g, 2, 4, '#3aa89a', 12, 8); px(g, 7, 5, '#ffffff', 2, 6); px(g, 5, 7, '#ffffff', 6, 2); },
  E: (g) => {
    clinicFloor(g);
    px(g, 1, 2, '#9aa8ac', 14, 13); px(g, 2, 3, '#ffffff', 12, 4); px(g, 2, 7, '#3aa89a', 12, 7); px(g, 2, 7, '#2a8a7e', 12, 1);
  },
};

const GYM_FLOOR_LINES = (g, base, line, accent) => { px(g, 0, 0, base, T, T); px(g, 0, 15, line, T, 1); px(g, 15, 0, line, 1, T); if (accent) px(g, 7, 7, accent, 2, 2); };

const [DROP_L, DROP_R] = banner('drop', (g) => {
  px(g, 0, 0, '#1d4f8a', 32, 16); px(g, 0, 0, '#3f86e0', 32, 1); px(g, 0, 15, '#143a68', 32, 1);
  g.fillStyle = '#e8f6ff'; g.beginPath(); g.moveTo(16, 1.5); g.bezierCurveTo(21, 7, 22, 9, 22, 10.5); g.arc(16, 10.5, 6, 0, Math.PI); g.bezierCurveTo(10, 9, 11, 7, 16, 1.5); g.fill();
  g.fillStyle = '#7ac0f8'; g.beginPath(); g.arc(14, 11, 2, 0, 7); g.fill();
});
const GYM_AGUA = {
  Y: (g) => { GYM_FLOOR_LINES(g, '#cfe6f6', '#a9cfe8'); px(g, 2, 4, '#8fc0e4', 5, 1); px(g, 9, 11, '#8fc0e4', 5, 1); },
  x: (g) => { px(g, 0, 0, '#2a6ab0', T, T); px(g, 0, 11, '#1d4f8a', T, 5); px(g, 0, 10, '#7ac0f8', T, 1); px(g, 2, 4, '#5a9ad8', 5, 1); px(g, 9, 6, '#5a9ad8', 5, 1); },
  X: DROP_L,
  Z: DROP_R,
  N: (g) => { GYM_FLOOR_LINES(g, '#cfe6f6', '#a9cfe8'); px(g, 1, 3, '#2a4a6a', 14, 12); px(g, 2, 4, '#3f9ae0', 12, 9); px(g, 4, 6, '#f2c02a', 3, 1); px(g, 5, 7, '#f2c02a', 1, 1); px(g, 9, 9, '#e8672c', 3, 1); px(g, 11, 8, '#e8672c', 1, 1); px(g, 2, 4, '#a8dcff', 12, 1); },
  A: (g) => { px(g, 0, 0, '#2a6ab0', T, T); px(g, 1, 0, '#e8f6ff', 1, T); px(g, 14, 0, '#e8f6ff', 1, T); px(g, 4, 6, '#5a9ad8', 8, 1); px(g, 4, 11, '#5a9ad8', 8, 1); },
  m: (g) => { GYM_FLOOR_LINES(g, '#cfe6f6', '#a9cfe8'); px(g, 1, 3, '#1d4f8a', 14, 10); px(g, 2, 4, '#3f86e0', 12, 8); },
  T: (g) => { GYM_FLOOR_LINES(g, '#cfe6f6', '#a9cfe8'); px(g, 1, 3, '#2a6ab0', 14, 9); px(g, 1, 3, '#5a9ad8', 14, 3); },
};

const [BOLT_L, BOLT_R] = banner('bolt', (g) => {
  px(g, 0, 0, '#23232e', 32, 16); px(g, 0, 0, '#f2c02a', 32, 1); px(g, 0, 15, '#f2c02a', 32, 1);
  g.fillStyle = '#ffe44a'; g.beginPath(); g.moveTo(18, 1); g.lineTo(11, 9); g.lineTo(15.5, 9); g.lineTo(13, 15); g.lineTo(21, 6.5); g.lineTo(16.5, 6.5); g.closePath(); g.fill();
  g.fillStyle = '#fff6a8'; g.fillRect(16, 3, 1, 3);
});
const hazard = (g, y) => { for (let x = -16; x < 32; x += 8) { g.fillStyle = '#f2c02a'; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 4, y); g.lineTo(x + 8, y); g.lineTo(x + 4, y + 4); g.fill(); } };
const GYM_ELEC = {
  Y: (g) => { px(g, 0, 0, '#454656', T, T); px(g, 0, 15, '#2c2d3a', T, 1); px(g, 15, 0, '#2c2d3a', 1, T); px(g, 3, 3, '#5a5c70', 10, 1); px(g, 3, 3, '#5a5c70', 1, 6); px(g, 3, 8, '#f2c02a', 2, 1); },
  x: (g) => { px(g, 0, 0, '#2c2d3a', T, T); px(g, 0, 11, '#1a1a24', T, 5); hazard(g, 10); px(g, 3, 3, '#f2c02a', 1, 4); px(g, 8, 2, '#5ae0ff', 3, 1); px(g, 10, 3, '#5ae0ff', 1, 3); },
  X: BOLT_L,
  Z: BOLT_R,
  N: (g) => { px(g, 0, 0, '#454656', T, T); px(g, 0, 15, '#2c2d3a', T, 1); px(g, 4, 11, '#23232e', 8, 4); px(g, 7, 6, '#7a7c90', 2, 6); g.fillStyle = '#8af0ff'; g.beginPath(); g.arc(8, 5, 4, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(8, 5, 1.8, 0, 7); g.fill(); },
  A: (g) => { px(g, 0, 0, '#23232e', T, T); hazard(g, 0); hazard(g, 12); px(g, 6, 7, '#f2c02a', 4, 2); },
  m: (g) => { px(g, 0, 0, '#454656', T, T); px(g, 1, 3, '#23232e', 14, 10); px(g, 2, 4, '#f2c02a', 12, 8); px(g, 3, 5, '#23232e', 10, 6); },
  T: (g) => { px(g, 0, 0, '#454656', T, T); px(g, 1, 3, '#23232e', 14, 9); px(g, 1, 3, '#7a7c90', 14, 3); },
};

const [ROCK_L, ROCK_R] = banner('rock', (g) => {
  px(g, 0, 0, '#6a4a2a', 32, 16); px(g, 0, 0, '#c49a4c', 32, 1); px(g, 0, 15, '#4a3018', 32, 1);
  g.fillStyle = '#a8a8a0'; g.beginPath(); g.moveTo(7, 14); g.lineTo(13, 5); g.lineTo(17, 9); g.lineTo(21, 3); g.lineTo(26, 14); g.closePath(); g.fill();
  g.fillStyle = '#d0d0c8'; g.beginPath(); g.moveTo(21, 3); g.lineTo(18.5, 7.5); g.lineTo(21, 7); g.lineTo(23, 7.5); g.closePath(); g.fill();
  g.fillStyle = '#5a5a54'; g.fillRect(14, 10, 1, 4); g.fillRect(21, 9, 1, 5);
});
const stoneFloor = (g) => { px(g, 0, 0, '#cdb48a', T, T); px(g, 0, 7, '#a98f66', T, 1); px(g, 0, 15, '#a98f66', T, 1); px(g, 4, 0, '#a98f66', 1, 7); px(g, 11, 8, '#a98f66', 1, 7); px(g, 8, 3, '#b89e74', 2, 1); };
const GYM_ROCA = {
  Y: stoneFloor,
  x: (g) => { px(g, 0, 0, '#7a5a38', T, T); px(g, 0, 5, '#5a3e22', T, 1); px(g, 0, 10, '#5a3e22', T, 1); px(g, 4, 0, '#5a3e22', 1, 5); px(g, 11, 5, '#5a3e22', 1, 5); px(g, 6, 10, '#5a3e22', 1, 6); px(g, 0, 15, '#4a3018', T, 1); },
  X: ROCK_L,
  Z: ROCK_R,
  N: (g) => { stoneFloor(g); g.fillStyle = '#8c8c84'; g.beginPath(); g.moveTo(2, 14); g.lineTo(4, 5); g.lineTo(9, 2); g.lineTo(13, 6); g.lineTo(14, 14); g.closePath(); g.fill(); g.fillStyle = '#b4b4ac'; g.fillRect(5, 5, 4, 2); g.fillStyle = '#5a5a54'; g.fillRect(9, 8, 1, 5); },
  A: (g) => { px(g, 0, 0, '#a8552a', T, T); px(g, 1, 0, '#e8c070', 1, T); px(g, 14, 0, '#e8c070', 1, T); px(g, 5, 4, '#7a3a1a', 6, 2); px(g, 5, 10, '#7a3a1a', 6, 2); },
  m: (g) => { stoneFloor(g); px(g, 1, 3, '#5a3e22', 14, 10); px(g, 2, 4, '#a8552a', 12, 8); },
  T: (g) => { stoneFloor(g); px(g, 1, 3, '#7a5a38', 14, 9); px(g, 1, 3, '#a98f66', 14, 3); },
};

const THEMES = { poli: POLI_T, gym_agua: GYM_AGUA, gym_elec: GYM_ELEC, gym_roca: GYM_ROCA };

const cache = new Map();

export function tileCanvas(ch, frame = 0, theme = null) {
  const info = TILE_INFO[ch];
  const f = info?.anim ? frame % 4 : 0;
  const draw = (theme && THEMES[theme]?.[ch]) || null;
  const key = (draw ? `${theme}|` : '') + ch + f;
  let c = cache.get(key);
  if (!c) {
    c = mk();
    const g = c.getContext('2d');
    (draw ?? DRAW[ch] ?? DRAW.O)(g, new Rng(ch.charCodeAt(0) * 97 + 13), f);
    cache.set(key, c);
  }
  return c;
}

export function buildTileset(onProgress) {
  const keys = Object.keys(TILE_INFO);
  keys.forEach((k, i) => {
    for (let f = 0; f < (TILE_INFO[k].anim ? 4 : 1); f++) tileCanvas(k, f);
    onProgress?.((i + 1) / keys.length);
  });
  for (const [theme, set] of Object.entries(THEMES)) for (const ch of Object.keys(set)) tileCanvas(ch, 0, theme);
}
