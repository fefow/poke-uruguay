// Procedural 16x16 pixel tileset (no external images).
import { Rng } from '../core/rng.js';
import { override } from './overrides.js';

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
  ι: { name: 'pilar', solid: true },
  ϗ: { name: 'boca de cueva' },
  λ: { name: 'desnivel', solid: true, ledge: true },
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
  // gym facades, one family per city: water, electric, rock
  C: { name: 'techo policlínica', solid: true },
  Q: { name: 'cruz policlínica', solid: true },
  I: { name: 'fachada policlínica', solid: true },
  U: { name: 'toldo tienda', solid: true },
  t: { name: 'fachada tienda', solid: true },
  G: { name: 'techo gimnasio agua', solid: true },
  h: { name: 'fachada gimnasio agua', solid: true },
  a: { name: 'emblema agua', solid: true },
  J: { name: 'techo gimnasio eléctrico', solid: true },
  j: { name: 'fachada gimnasio eléctrico', solid: true },
  d: { name: 'emblema eléctrico', solid: true },
  V: { name: 'techo gimnasio roca', solid: true },
  y: { name: 'fachada gimnasio roca', solid: true },
  e: { name: 'emblema roca', solid: true },
  z: { name: 'torre', solid: true },
  '%': { name: 'zarzal', solid: true },
  '\\': { name: 'roca de fuerza', solid: true },
  '`': { name: 'ceniza' },
  ';': { name: 'brasas', enc: true },
  '^': { name: 'magma', solid: true, anim: true },
  // big city (Montevideo): asphalt, sidewalks, promenade, high-rises and the Buquebus terminal
  '0': { name: 'asfalto' },
  '-': { name: 'asfalto con línea' },
  ':': { name: 'asfalto con línea vertical' },
  '/': { name: 'cebra' },
  '_': { name: 'vereda' },
  '?': { name: 'rambla' },
  '[': { name: 'baranda', solid: true },
  ']': { name: 'edificio alto', solid: true },
  '{': { name: 'azotea', solid: true },
  '}': { name: 'muelle' },
  '(': { name: 'vidrio terminal', solid: true },
  ')': { name: 'techo terminal', solid: true },
  '<': { name: 'cartel Buquebus (1)', solid: true },
  '>': { name: 'cartel Buquebus (2)', solid: true },
  '|': { name: 'farola', solid: true },
  '"': { name: 'árbol de vereda', solid: true },
  // overworld scenery that sits on the map's ground (grass, sand, dry grass...), see OVER below
  'Ñ': { name: 'pino', solid: true, over: true },
  'Ö': { name: 'eucalipto', solid: true, over: true },
  'ñ': { name: 'sauce', solid: true, over: true },
  'ö': { name: 'ombú', solid: true, over: true },
  'ξ': { name: 'arbusto', solid: true, over: true },
  'Σ': { name: 'farola de plaza', solid: true, over: true },
  'Δ': { name: 'banco', solid: true, over: true },
  'Ω': { name: 'macizo de flores', solid: true, over: true },
  'Γ': { name: 'monumento', solid: true, over: true },
  'Θ': { name: 'pozo', solid: true, over: true },
  'Λ': { name: 'molino de viento', solid: true, over: true },
  'Ξ': { name: 'rollo de pasto', solid: true, over: true },
  'Π': { name: 'buzón', solid: true, over: true },
  'μ': { name: 'cerro', solid: true, over: true },
  'ρ': { name: 'tapia de piedra', solid: true, over: true },
  'τ': { name: 'leña', solid: true, over: true },
  'β': { name: 'bote', solid: true, over: true },
  'γ': { name: 'contenedor', solid: true, over: true },
  'ψ': { name: 'tendedero', solid: true, over: true },
  'ζ': { name: 'pasto seco' },
  'η': { name: 'tierra colorada' },
  'ß': { name: 'duna' },
  'ν': { name: 'piedras sueltas' },
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

let GROUND = null; // the map theme's ground while a themed tile is drawn, so trees, rocks and signs sit on it
function grass(g, rng) {
  if (GROUND) GROUND(g, rng);
  else speckle(g, rng, '#78c850', ['#68b040', '#88d860', '#60a83c'], 14);
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
  '`': (g, r) => speckle(g, r, '#4a4650', ['#5a5660', '#3a363e', '#403c46', '#e8672c55'], 18),
  ';': (g, r) => {
    speckle(g, r, '#4a4650', ['#5a5660', '#3a363e'], 10);
    for (let i = 0; i < 7; i++) {
      const x = r.int(1, 14), y = r.int(4, 14);
      px(g, x, y, '#a82a1a', 1, 3); px(g, x + 1, y + 1, '#e8672c', 1, 2); px(g, x - 1, y + 1, '#f2c02a', 1, 1);
    }
  },
  '^': (g, r, frame) => {
    px(g, 0, 0, '#9a2a14', T, T);
    for (let i = 0; i < 6; i++) {
      const x = (r.int(0, 12) + frame * 3 + i * 5) % 14, y = (r.int(0, 12) + frame * 2) % 14;
      px(g, x, y, '#e8672c', 4, 3); px(g, x + 1, y, '#ffb43a', 2, 1);
    }
    px(g, 0, 0, '#3a1a14', T, 1); px(g, 0, 15, '#3a1a14', T, 1);
  },
  '%': (g, r) => {
    grass(g, r);
    g.fillStyle = '#3a5a22'; g.beginPath(); g.arc(8, 9, 7, 0, 7); g.fill();
    g.fillStyle = '#4e7a2e'; g.beginPath(); g.arc(6, 7, 4.5, 0, 7); g.fill(); g.beginPath(); g.arc(11, 9, 4, 0, 7); g.fill();
    for (let i = 0; i < 9; i++) px(g, r.int(2, 13), r.int(3, 13), '#2a3a14', 1, 3);
    px(g, 4, 5, '#8a5a3a', 1, 1); px(g, 10, 11, '#8a5a3a', 1, 1); px(g, 12, 6, '#8a5a3a', 1, 1);
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
  // Palm on grass (the sand background looked wrong on inland routes).
  p: (g, r) => {
    grass(g, r);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(8, 14, 5, 1.6, 0, 0, 7); g.fill();
    // slightly curved trunk with rings
    const trunk = [[7, 15], [7, 13], [7, 11], [8, 9], [8, 7], [8, 5]];
    for (const [tx, ty] of trunk) px(g, tx, ty, '#8a6a3a', 2, 2);
    for (const [tx, ty] of trunk) px(g, tx + 1, ty, '#6a4a2a', 1, 2);
    for (let y = 6; y < 15; y += 2) px(g, y > 10 ? 7 : 8, y, '#5a3e22', 2, 1);
    // fronds
    const leaf = (x, y, w, h, c) => px(g, x, y, c, w, h);
    leaf(3, 3, 5, 2, '#2f7a34'); leaf(9, 3, 5, 2, '#2f7a34');
    leaf(1, 4, 4, 2, '#3a8a34'); leaf(11, 4, 4, 2, '#3a8a34');
    leaf(2, 6, 3, 1, '#2f7a34'); leaf(11, 6, 3, 1, '#2f7a34');
    leaf(6, 1, 4, 3, '#4aa03c'); leaf(5, 2, 6, 2, '#4aa03c');
    leaf(4, 2, 2, 1, '#6cc04c'); leaf(10, 2, 2, 1, '#6cc04c');
    // coconuts
    px(g, 7, 5, '#5a3a1a', 2, 2); px(g, 9, 5, '#6a4a2a', 1, 1);
  },
  R: (g, r) => {
    grass(g, r);
    g.fillStyle = '#6a6a72'; g.beginPath(); g.ellipse(8, 10, 7, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#9a9aa2'; g.beginPath(); g.ellipse(7, 9, 5, 3, 0, 0, 7); g.fill();
    px(g, 5, 7, '#c0c0c8', 3, 1);
  },
  '\\': (g, r) => {
    grass(g, r);
    g.fillStyle = '#16141e'; g.beginPath(); g.ellipse(8, 9.5, 8, 6.5, 0, 0, 7); g.fill();
    g.fillStyle = '#7a6a62'; g.beginPath(); g.ellipse(8, 9, 7, 5.5, 0, 0, 7); g.fill();
    g.fillStyle = '#a89a90'; g.beginPath(); g.ellipse(6.5, 7.5, 4.5, 3, 0, 0, 7); g.fill();
    px(g, 4, 6, '#d0c4ba', 3, 1); px(g, 9, 10, '#4e423c', 4, 1); px(g, 7, 12, '#4e423c', 2, 1); px(g, 11, 8, '#4e423c', 1, 3);
  },
  ϗ: (g, r) => {
    px(g, 0, 0, '#5a4a3e', T, T);
    px(g, 0, 0, '#7a6a5c', T, 3);
    px(g, 1, 3, '#16121a', 14, 13);
    px(g, 2, 3, '#241c28', 12, 2);
    for (let i = 0; i < 6; i++) px(g, r.int(0, 14), r.int(5, 14), '#33283a', 2, 1);
    px(g, 0, 0, '#a89686', 3, 2); px(g, 13, 0, '#a89686', 3, 2);
  },
  ι: (g) => {
    px(g, 0, 0, '#8a8a92', T, T);
    px(g, 3, 0, '#d8d8e0', 10, T);
    px(g, 4, 0, '#f2f2f6', 3, T);
    px(g, 11, 0, '#a8a8b2', 2, T);
    px(g, 2, 0, '#c8c8d2', 12, 2);
    px(g, 2, 14, '#c8c8d2', 12, 2);
    px(g, 3, 6, '#b8b8c4', 10, 1);
  },
  λ: (g, r) => {
    grass(g, r);
    px(g, 0, 8, '#3f7a52', T, 3);
    px(g, 0, 7, '#c08a64', T, 2);
    for (let x = 0; x < T; x += 4) px(g, x, 6, '#c08a64', 3, 1);
    px(g, 0, 9, '#8a5a3e', T, 1);
    px(g, 0, 11, '#2f5e40', T, 1);
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
  // ---- policlínicas y tiendas (iguales en todas las ciudades) ----
  C: (g) => {
    px(g, 0, 0, '#3aa89a', T, T); px(g, 0, 0, '#d9f2ee', T, 2); px(g, 0, 15, '#1f6e64', T, 1);
    for (let y = 4; y < 15; y += 4) px(g, 0, y, '#2a8a7e', T, 1);
  },
  Q: (g) => {
    DRAW.C(g);
    g.fillStyle = '#16615a'; g.beginPath(); g.arc(8, 8, 7.5, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(8, 8, 6.4, 0, 7); g.fill();
    px(g, 6, 3, '#e0263a', 4, 10); px(g, 3, 6, '#e0263a', 10, 4);
  },
  I: (g) => {
    px(g, 0, 0, '#f4f8f7', T, T); px(g, 0, 0, '#3aa89a', T, 2); px(g, 0, 13, '#cfe4e0', T, 3); px(g, 0, 12, '#3aa89a', T, 1);
    px(g, 3, 4, '#2a8a7e', 10, 7); px(g, 4, 5, '#9ad8f0', 8, 5); px(g, 4, 5, '#d8f4ff', 8, 1); px(g, 7, 5, '#2a8a7e', 2, 5);
  },
  U: (g) => {
    for (let x = 0; x < T; x += 4) { px(g, x, 0, '#d83a3a', 2, T); px(g, x + 2, 0, '#fbf2e2', 2, T); }
    px(g, 0, 0, '#8a1a1a', T, 1); px(g, 0, 13, '#a82a2a', T, 3);
    for (let x = 0; x < T; x += 4) { px(g, x + 1, 15, '#fbf2e2', 2, 1); }
  },
  t: (g) => {
    px(g, 0, 0, '#f2e2bc', T, T); px(g, 0, 12, '#a87a4a', T, 4); px(g, 0, 11, '#8a5a2a', T, 1);
    px(g, 2, 2, '#5a3a1a', 12, 9); px(g, 3, 3, '#a8dcf0', 10, 7); px(g, 3, 3, '#e0f6ff', 10, 1);
    px(g, 3, 7, '#8a5a2a', 10, 1);
    for (const [x, col] of [[4, '#e0263a'], [6, '#f2c02a'], [8, '#4a9a3c'], [10, '#3f86e0']]) px(g, x, 5, col, 2, 2);
    px(g, 4, 8, '#e8c070', 3, 2); px(g, 9, 8, '#c8a060', 3, 2);
  },
  // ---- gym facades (outdoor) ----
  G: (g) => {
    px(g, 0, 0, '#2a6ab0', T, T); px(g, 0, 0, '#7ac0f8', T, 1); px(g, 0, 15, '#143a68', T, 1);
    for (let y = 3; y < 15; y += 4) for (let x = ((y - 3) / 4) % 2 ? 4 : 0; x < T; x += 8) { px(g, x, y, '#5a9ad8', 5, 1); px(g, x + 1, y + 1, '#1d4f8a', 3, 1); }
  },
  h: (g) => {
    px(g, 0, 0, '#e8f2fa', T, T); px(g, 0, 0, '#1d4f8a', T, 1);
    px(g, 0, 1, '#bcd8ee', 3, 15); px(g, 0, 1, '#ffffff', 1, 15); px(g, 13, 1, '#bcd8ee', 3, 15); px(g, 15, 1, '#8fb4d4', 1, 15);
    px(g, 4, 3, '#1d4f8a', 8, 10); px(g, 5, 2, '#1d4f8a', 6, 1); px(g, 5, 3, '#3f9ae0', 6, 9); px(g, 5, 3, '#a8dcff', 6, 1); px(g, 5, 7, '#7ac0f8', 6, 1);
    px(g, 0, 14, '#8fb4d4', T, 2);
  },
  a: (g) => {
    DRAW.G(g);
    g.fillStyle = '#143a68'; g.beginPath(); g.arc(8, 8, 7.5, 0, 7); g.fill();
    g.fillStyle = '#e8f6ff'; g.beginPath(); g.arc(8, 8, 6.2, 0, 7); g.fill();
    g.fillStyle = '#2a6ab0'; g.beginPath(); g.arc(8, 8, 5, 0, 7); g.fill();
    g.fillStyle = '#e8f6ff'; g.beginPath(); g.moveTo(8, 3); g.bezierCurveTo(11.5, 7, 12, 8, 12, 9.2); g.arc(8, 9.2, 4, 0, Math.PI); g.bezierCurveTo(4, 8, 4.5, 7, 8, 3); g.fill();
    g.fillStyle = '#7ac0f8'; g.fillRect(6, 9, 2, 2);
  },
  J: (g) => {
    px(g, 0, 0, '#2c2d3a', T, T); px(g, 0, 0, '#5a5c70', T, 1); px(g, 0, 15, '#1a1a24', T, 1);
    hazard(g, 11); px(g, 2, 3, '#5a5c70', 2, 2); px(g, 11, 3, '#5a5c70', 2, 2); px(g, 6, 6, '#3a3b4c', 4, 2);
  },
  j: (g) => {
    px(g, 0, 0, '#454656', T, T); px(g, 0, 0, '#f2c02a', T, 1);
    px(g, 0, 1, '#2c2d3a', 3, 15); px(g, 13, 1, '#2c2d3a', 3, 15); px(g, 1, 3, '#f2c02a', 1, 9); px(g, 14, 3, '#f2c02a', 1, 9);
    px(g, 4, 3, '#1a1a24', 8, 9); px(g, 5, 4, '#5ae0ff', 6, 7); px(g, 5, 4, '#c8f8ff', 6, 1); px(g, 7, 4, '#23232e', 2, 7);
    hazard(g, 12);
  },
  d: (g) => {
    DRAW.J(g);
    g.fillStyle = '#1a1a24'; g.beginPath(); g.arc(8, 8, 7.5, 0, 7); g.fill();
    g.fillStyle = '#f2c02a'; g.beginPath(); g.arc(8, 8, 6.2, 0, 7); g.fill();
    g.fillStyle = '#23232e'; g.beginPath(); g.arc(8, 8, 5, 0, 7); g.fill();
    g.fillStyle = '#ffe44a'; g.beginPath(); g.moveTo(9.5, 3); g.lineTo(5, 8.6); g.lineTo(7.8, 8.6); g.lineTo(6.5, 13); g.lineTo(11.5, 7); g.lineTo(8.8, 7); g.closePath(); g.fill();
  },
  V: (g) => {
    px(g, 0, 0, '#7a5a38', T, T); px(g, 0, 0, '#c49a4c', T, 1); px(g, 0, 15, '#4a3018', T, 1);
    for (let y = 4; y < 15; y += 5) { px(g, 0, y, '#5a3e22', T, 1); for (let x = ((y - 4) / 5) % 2 ? 0 : 6; x < T; x += 12) px(g, x, y - 4, '#5a3e22', 1, 4); }
    px(g, 2, 2, '#9a7848', 3, 1); px(g, 9, 7, '#9a7848', 4, 1);
  },
  y: (g) => {
    px(g, 0, 0, '#cdb48a', T, T); px(g, 0, 0, '#7a5a38', T, 2);
    px(g, 0, 7, '#a98f66', T, 1); px(g, 0, 14, '#a98f66', T, 2); px(g, 4, 2, '#a98f66', 1, 5); px(g, 11, 8, '#a98f66', 1, 6);
    px(g, 0, 2, '#a98f66', 3, 12); px(g, 13, 2, '#a98f66', 3, 12); px(g, 0, 2, '#e6d4ac', 1, 12);
    px(g, 5, 8, '#3a2814', 6, 5); px(g, 5, 8, '#1a1008', 6, 1);
  },
  e: (g) => {
    DRAW.V(g);
    g.fillStyle = '#3a2814'; g.beginPath(); g.arc(8, 8, 7.5, 0, 7); g.fill();
    g.fillStyle = '#c49a4c'; g.beginPath(); g.arc(8, 8, 6.2, 0, 7); g.fill();
    g.fillStyle = '#6a4a2a'; g.beginPath(); g.arc(8, 8, 5, 0, 7); g.fill();
    g.fillStyle = '#a8a8a0'; g.beginPath(); g.moveTo(3.5, 12); g.lineTo(6.5, 6); g.lineTo(8.3, 8.4); g.lineTo(10, 4); g.lineTo(12.6, 12); g.closePath(); g.fill();
    g.fillStyle = '#d0d0c8'; g.fillRect(9, 4, 2, 2);
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


// ---- overworld scenery drawn on top of the map's ground (the ground comes from the theme's '.' tile) ----
const shade = (g, cx, cy, rx, ry) => { g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill(); };
const OVER = {
  'Ñ': (g) => {
    shade(g, 8, 14, 5, 1.6);
    px(g, 7, 11, '#5a3a1e', 2, 4);
    g.fillStyle = '#1f6a3a'; g.beginPath(); g.moveTo(8, 0); g.lineTo(14, 6); g.lineTo(2, 6); g.fill();
    g.fillStyle = '#25803f'; g.beginPath(); g.moveTo(8, 3); g.lineTo(15, 10); g.lineTo(1, 10); g.fill();
    g.fillStyle = '#2f9a4a'; g.beginPath(); g.moveTo(8, 6); g.lineTo(15, 13); g.lineTo(1, 13); g.fill();
    px(g, 6, 3, '#5ab86a', 2, 1); px(g, 5, 7, '#5ab86a', 2, 1); px(g, 9, 10, '#5ab86a', 2, 1);
  },
  'Ö': (g) => {
    shade(g, 8, 14, 4, 1.4);
    px(g, 7, 5, '#d8d0bc', 2, 10); px(g, 8, 5, '#b8a888', 1, 10); px(g, 7, 9, '#8a7a5a', 1, 1); px(g, 8, 12, '#8a7a5a', 1, 1);
    g.fillStyle = '#6a9a82';
    for (const [x, y, r] of [[8, 3, 3.2], [4, 5, 2.4], [12, 5, 2.4], [6, 1.5, 2], [10, 1.5, 2]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#9ac2a6'; g.fillRect(5, 2, 2, 1); g.fillRect(9, 4, 2, 1);
  },
  'ñ': (g) => {
    shade(g, 8, 14, 5, 1.5);
    px(g, 7, 6, '#6a4a2a', 2, 9);
    g.fillStyle = '#7ab04a'; g.beginPath(); g.arc(8, 5, 6, 0, 7); g.fill();
    g.fillStyle = '#5a9a3a';
    for (let x = 2; x < 14; x += 2) px(g, x, 7, '#5a9a3a', 1, 7 - Math.abs(8 - x) / 2);
    px(g, 5, 2, '#a4d060', 3, 1);
  },
  'ö': (g) => {
    shade(g, 8, 14, 7, 1.8);
    g.fillStyle = '#6a4a2a'; g.beginPath(); g.moveTo(4, 15); g.lineTo(6, 8); g.lineTo(10, 8); g.lineTo(12, 15); g.fill();
    px(g, 7, 9, '#8a6a3a', 1, 5);
    g.fillStyle = '#2a7a30'; g.beginPath(); g.ellipse(8, 5, 8, 5.5, 0, 0, 7); g.fill();
    g.fillStyle = '#3a9a40'; g.beginPath(); g.ellipse(6.5, 4, 5, 3, 0, 0, 7); g.fill();
    px(g, 4, 2, '#5ac060', 3, 1);
  },
  'ξ': (g) => {
    shade(g, 8, 13, 5, 1.3);
    g.fillStyle = '#2f7a34'; g.beginPath(); g.arc(8, 10, 5, 0, 7); g.fill();
    g.fillStyle = '#4aa044'; g.beginPath(); g.arc(7, 9, 3, 0, 7); g.fill();
    px(g, 10, 8, '#f2e05c', 1, 1); px(g, 5, 11, '#f2e05c', 1, 1);
  },
  'Σ': (g) => {
    shade(g, 8, 15, 3, 1);
    px(g, 7, 4, '#33333c', 2, 11); px(g, 6, 14, '#33333c', 4, 1);
    px(g, 5, 1, '#33333c', 6, 1); px(g, 5, 2, '#fff2a0', 6, 3); px(g, 6, 2, '#ffe060', 4, 2); px(g, 5, 5, '#33333c', 6, 1);
    px(g, 7, 0, '#33333c', 2, 1);
  },
  'Δ': (g) => {
    shade(g, 8, 14, 7, 1.4);
    px(g, 1, 7, '#8a5a2a', 14, 2); px(g, 1, 9, '#6a4020', 14, 1); px(g, 1, 4, '#a87038', 14, 2);
    px(g, 2, 10, '#33333c', 2, 4); px(g, 12, 10, '#33333c', 2, 4);
  },
  'Ω': (g) => {
    px(g, 1, 4, '#9a9a9a', 14, 11); px(g, 2, 5, '#4a3020', 12, 9);
    const cols = ['#f04a4a', '#f2e05c', '#ffffff', '#c86ae0', '#ff8ac0'];
    for (let i = 0; i < 12; i++) { const x = 3 + (i % 4) * 3; const y = 6 + Math.floor(i / 4) * 3; px(g, x, y, cols[(i * 2) % 5], 2, 2); px(g, x, y + 2, '#3a8a30', 1, 1); }
  },
  'Γ': (g) => {
    shade(g, 8, 15, 6, 1.4);
    px(g, 3, 11, '#a8a4a0', 10, 4); px(g, 4, 9, '#c4c0bc', 8, 2); px(g, 3, 14, '#7e7a76', 10, 1);
    g.fillStyle = '#7a8a7a'; g.fillRect(7, 2, 2, 2); g.fillRect(6, 4, 4, 5); g.fillRect(5, 5, 1, 3); g.fillRect(10, 5, 1, 3);
    px(g, 7, 2, '#a4b4a4', 1, 1);
  },
  'Θ': (g) => {
    shade(g, 8, 14, 6, 1.4);
    px(g, 3, 8, '#8a8a92', 10, 6); px(g, 4, 9, '#2a5a8a', 8, 3); px(g, 4, 9, '#5a9ad0', 8, 1);
    px(g, 3, 3, '#6a4020', 1, 5); px(g, 12, 3, '#6a4020', 1, 5); px(g, 3, 3, '#6a4020', 10, 1); px(g, 5, 2, '#a85a30', 6, 2);
  },
  'Λ': (g) => {
    shade(g, 8, 15, 5, 1.4);
    g.fillStyle = '#7a7a82'; g.beginPath(); g.moveTo(5, 15); g.lineTo(7, 5); g.lineTo(9, 5); g.lineTo(11, 15); g.fill();
    px(g, 6, 10, '#5a5a62', 4, 1); px(g, 7, 7, '#5a5a62', 2, 1);
    g.fillStyle = '#d8d8e0';
    g.beginPath(); g.moveTo(8, 4); g.lineTo(2, 1); g.lineTo(3, 4); g.fill();
    g.beginPath(); g.moveTo(8, 4); g.lineTo(14, 1); g.lineTo(13, 4); g.fill();
    g.beginPath(); g.moveTo(8, 4); g.lineTo(6, 0); g.lineTo(9, 0); g.fill();
    g.beginPath(); g.moveTo(8, 4); g.lineTo(5, 7); g.lineTo(11, 7); g.fill();
    px(g, 7, 3, '#c84a2a', 2, 2);
  },
  'Ξ': (g) => {
    shade(g, 8, 14, 6, 1.5);
    g.fillStyle = '#c8a038'; g.beginPath(); g.arc(8, 9, 6, 0, 7); g.fill();
    g.fillStyle = '#e0bc50'; g.beginPath(); g.arc(8, 9, 4, 0, 7); g.fill();
    g.fillStyle = '#a88028'; g.beginPath(); g.arc(8, 9, 2, 0, 7); g.fill();
    px(g, 5, 5, '#f0d878', 2, 1);
  },
  'Π': (g) => {
    shade(g, 8, 15, 3, 1);
    px(g, 7, 8, '#6a4020', 2, 7); px(g, 4, 3, '#c83a3a', 8, 5); px(g, 5, 4, '#e86a6a', 6, 1); px(g, 10, 5, '#f2e05c', 1, 3);
  },
  'μ': (g) => {
    px(g, 0, 11, '#7a7a82', T, 5);
    g.fillStyle = '#8c8c96'; g.beginPath(); g.moveTo(0, 14); g.lineTo(5, 3); g.lineTo(9, 9); g.lineTo(12, 5); g.lineTo(16, 14); g.fill();
    g.fillStyle = '#b4b4be'; g.beginPath(); g.moveTo(5, 3); g.lineTo(9, 9); g.lineTo(6, 9); g.fill();
    px(g, 4, 4, '#f2f2f8', 2, 1); px(g, 11, 6, '#f2f2f8', 2, 1);
    px(g, 0, 14, '#5e5e66', T, 2);
  },
  'ρ': (g) => {
    px(g, 0, 6, '#9a9488', T, 8); px(g, 0, 6, '#b4aea2', T, 2); px(g, 0, 13, '#6e695f', T, 1);
    for (let x = 0; x < T; x += 5) px(g, x, 8, '#7e786c', 1, 5);
    px(g, 3, 10, '#7e786c', 4, 1); px(g, 9, 11, '#7e786c', 5, 1);
  },
  'τ': (g) => {
    shade(g, 8, 14, 6, 1.4);
    for (const [x, y] of [[2, 9], [7, 9], [4, 4], [9, 4]]) { px(g, x, y, '#8a5a30', 5, 5); px(g, x + 1, y + 1, '#c89a5a', 3, 3); px(g, x + 2, y + 2, '#8a5a30', 1, 1); }
  },
  'β': (g) => {
    shade(g, 8, 13, 7, 1.5);
    g.fillStyle = '#c84a3a'; g.beginPath(); g.moveTo(1, 7); g.lineTo(15, 7); g.lineTo(12, 13); g.lineTo(4, 13); g.fill();
    px(g, 1, 6, '#f2f2f2', 14, 1); px(g, 4, 9, '#2a6ab0', 8, 1); px(g, 7, 1, '#6a4020', 1, 6); px(g, 8, 2, '#f2e6c8', 4, 4);
  },
  'γ': (g) => {
    px(g, 1, 3, '#2a5a9a', 14, 11); px(g, 1, 3, '#4a7aba', 14, 1);
    for (let x = 3; x < 15; x += 3) px(g, x, 4, '#1e4a82', 1, 9);
    px(g, 1, 13, '#1a3a6a', 14, 1);
  },
  'ψ': (g) => {
    px(g, 1, 2, '#6a4020', 1, 13); px(g, 14, 2, '#6a4020', 1, 13); px(g, 1, 3, '#cfcfd6', 14, 1);
    px(g, 3, 4, '#f2f2f8', 4, 5); px(g, 9, 4, '#e86a6a', 4, 6); px(g, 4, 5, '#d8d8e8', 1, 3);
  },
};
// Ground variants: what '.' looks like on each kind of map (and the plain tiles that belong to it).
const dryGrass = (g, r) => speckle(g, r, '#c8b868', ['#b8a858', '#d8c878', '#a89a4c'], 16);
const sandGround = (g, r) => speckle(g, r, '#f0dca0', ['#e4cc8a', '#f8e8b4', '#d8bc78'], 12);
const redGround = (g, r) => speckle(g, r, '#b8684a', ['#a85a3e', '#c87858', '#985034'], 16);
const stoneGround = (g, r) => speckle(g, r, '#9a9a8c', ['#8a8a7c', '#aaaa9c', '#7a7a6e'], 16);
const GROUND_DRAW = {
  'ζ': dryGrass,
  'ß': (g, r) => { sandGround(g, r); for (let i = 0; i < 3; i++) { const x = r.int(2, 12), y = r.int(4, 12); px(g, x, y, '#6a9a3a', 1, 3); px(g, x + 1, y + 1, '#7aaa4a', 1, 2); px(g, x - 1, y + 1, '#7aaa4a', 1, 2); } },
  'η': redGround,
  'ν': (g, r) => { stoneGround(g, r); for (let i = 0; i < 4; i++) { const x = r.int(1, 12), y = r.int(1, 12); px(g, x, y, '#6a6a60', 3, 2); px(g, x, y, '#b8b8aa', 2, 1); } },
};

export const THEMES = {
  poli: POLI_T, gym_agua: GYM_AGUA, gym_elec: GYM_ELEC, gym_roca: GYM_ROCA,
  // ground themes: the map's '.' changes and everything drawn on grass follows it
  arena: { '.': sandGround }, seca: { '.': dryGrass }, colorada: { '.': redGround }, sierra: { '.': stoneGround },
};
Object.assign(DRAW, GROUND_DRAW);


// ---- gym families for the later cities: roof, facade and emblem tiles plus an interior theme ----
const disc = (g, cx, cy, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); };
const EMBLEMS = {
  fuego: (g) => { g.fillStyle = '#ff9a2a'; g.beginPath(); g.moveTo(8, 2.5); g.bezierCurveTo(12, 6, 12.5, 9, 11, 11.5); g.bezierCurveTo(10, 13, 6, 13, 5, 11.5); g.bezierCurveTo(3.5, 9, 5, 7, 6, 6); g.bezierCurveTo(6.5, 7.5, 7, 7.5, 8, 2.5); g.fill(); g.fillStyle = '#ffe44a'; g.beginPath(); g.arc(8, 10.5, 2, 0, 7); g.fill(); },
  planta: (g) => { g.fillStyle = '#7ed858'; g.beginPath(); g.moveTo(3.5, 12.5); g.bezierCurveTo(3, 6, 8, 3, 12.5, 3.5); g.bezierCurveTo(13, 9, 9, 12.5, 3.5, 12.5); g.fill(); px(g, 3, 12, '#2f7a34', 6, 1); g.strokeStyle = '#2f7a34'; g.lineWidth = 1; g.beginPath(); g.moveTo(4, 12); g.lineTo(10, 6); g.stroke(); },
  lucha: (g) => { px(g, 4, 5, '#f2e0c0', 8, 6); px(g, 4, 5, '#d8b890', 8, 1); for (let i = 0; i < 4; i++) px(g, 4 + i * 2, 3, '#f2e0c0', 2, 2); px(g, 4, 11, '#d8b890', 8, 1); px(g, 5, 12, '#e0263a', 6, 1); },
  psiquico: (g) => { disc(g, 8, 8, 4.2, '#f4f0ff'); disc(g, 8, 8, 2.4, '#8a4ad8'); disc(g, 8, 8, 1, '#1a1a2a'); px(g, 3, 8, '#f4f0ff', 1, 1); px(g, 12, 8, '#f4f0ff', 1, 1); },
  siniestro: (g) => { disc(g, 8, 8, 4.8, '#e8e0f0'); disc(g, 10, 7, 4.3, '#2a2a3a'); },
  tierra: (g) => { g.fillStyle = '#e8d098'; g.beginPath(); g.moveTo(2.5, 12); g.lineTo(8, 3.5); g.lineTo(13.5, 12); g.fill(); g.fillStyle = '#8a5a30'; g.beginPath(); g.moveTo(5.5, 12); g.lineTo(8, 8); g.lineTo(10.5, 12); g.fill(); px(g, 3, 12, '#7ac04a', 10, 1); },
  normal: (g) => { g.fillStyle = '#ffffff'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 2.2 : 5; g.lineTo(8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r); } g.closePath(); g.fill(); },
  bicho: (g) => { disc(g, 8, 9, 4.2, '#d83a2a'); disc(g, 8, 4.8, 2.1, '#1a2a0a'); px(g, 7.5, 5, '#1a2a0a', 1, 8); disc(g, 6, 8, 0.9, '#1a2a0a'); disc(g, 10, 10, 0.9, '#1a2a0a'); disc(g, 6, 11, 0.8, '#1a2a0a'); },
  volador: (g) => { g.fillStyle = '#f4faff'; g.beginPath(); g.moveTo(3, 11.5); g.bezierCurveTo(4, 6, 9, 3.5, 13.5, 4); g.bezierCurveTo(12, 6, 11.5, 7, 12.5, 8); g.bezierCurveTo(10, 8.5, 9, 9.5, 9.5, 11); g.bezierCurveTo(7.5, 10.5, 5.5, 11.5, 3, 11.5); g.fill(); px(g, 5, 10, '#8ac8f0', 5, 1); },
};
function gymFamily(ids, k) {
  const [R, F, E] = ids;
  DRAW[R] = (g) => {
    px(g, 0, 0, k.roof, T, T); px(g, 0, 0, k.roofLight, T, 1); px(g, 0, 15, k.roofDark, T, 1);
    for (let y = 3; y < 15; y += 4) for (let x = ((y - 3) / 4) % 2 ? 4 : 0; x < T; x += 8) { px(g, x, y, k.roofLight, 5, 1); px(g, x + 1, y + 1, k.roofDark, 3, 1); }
  };
  DRAW[F] = (g) => {
    px(g, 0, 0, k.wall, T, T); px(g, 0, 0, k.roofDark, T, 1);
    px(g, 0, 1, k.wallDark, 3, 15); px(g, 13, 1, k.wallDark, 3, 15); px(g, 0, 1, k.wallLight, 1, 15);
    px(g, 4, 3, k.trim, 8, 10); px(g, 5, 2, k.trim, 6, 1); px(g, 5, 3, k.door, 6, 9); px(g, 5, 3, k.doorLight, 6, 1); px(g, 5, 7, k.doorLight, 6, 1);
    px(g, 0, 14, k.wallDark, T, 2);
  };
  DRAW[E] = (g) => {
    DRAW[R](g);
    disc(g, 8, 8, 7.5, k.roofDark); disc(g, 8, 8, 6.2, k.rim); disc(g, 8, 8, 5, k.roof);
    EMBLEMS[k.type](g);
  };
  TILE_INFO[R] = { name: `techo gimnasio ${k.type}`, solid: true };
  TILE_INFO[F] = { name: `fachada gimnasio ${k.type}`, solid: true };
  TILE_INFO[E] = { name: `emblema ${k.type}`, solid: true };
  const [BL, BR] = banner(`gym_${k.type}`, (g) => {
    px(g, 0, 0, k.wallIn, 32, 16); px(g, 0, 0, k.rim, 32, 1); px(g, 0, 15, k.roofDark, 32, 1);
    disc(g, 16, 8, 6.4, k.roofDark); disc(g, 16, 8, 5.4, k.roof);
    g.save(); g.translate(8, 0); EMBLEMS[k.type](g); g.restore();
  });
  const floor = (g) => { px(g, 0, 0, k.floorA, T, T); px(g, 0, 15, k.floorB, T, 1); px(g, 15, 0, k.floorB, 1, T); px(g, 3, 3, k.floorB, 2, 2); px(g, 10, 9, k.floorB, 3, 1); };
  THEMES[`gym_${k.type}`] = {
    Y: floor,
    x: (g) => { px(g, 0, 0, k.wallIn, T, T); px(g, 0, 11, k.roofDark, T, 5); px(g, 0, 10, k.rim, T, 1); px(g, 2, 4, k.wallInLight, 5, 1); px(g, 9, 6, k.wallInLight, 5, 1); },
    X: BL,
    Z: BR,
    N: (g) => { floor(g); px(g, 4, 11, k.roofDark, 8, 4); disc(g, 8, 7, 4.5, k.accent); disc(g, 8, 7, 2.5, k.roofLight); },
    A: (g) => { px(g, 0, 0, k.roof, T, T); px(g, 1, 0, k.rim, 1, T); px(g, 14, 0, k.rim, 1, T); px(g, 5, 6, k.roofLight, 6, 1); px(g, 5, 11, k.roofLight, 6, 1); },
    m: (g) => { floor(g); px(g, 1, 3, k.roofDark, 14, 10); px(g, 2, 4, k.roof, 12, 8); px(g, 3, 5, k.rim, 10, 1); },
    T: (g) => { floor(g); px(g, 1, 3, k.roofDark, 14, 9); px(g, 1, 3, k.rim, 14, 3); },
  };
}
gymFamily(['1', '2', '3'], { type: 'fuego', roof: '#a83a1a', roofLight: '#e8702a', roofDark: '#5a1a0a', rim: '#ffb040', wall: '#d8b898', wallDark: '#a87a58', wallLight: '#f2dcc0', trim: '#5a1a0a', door: '#e8602a', doorLight: '#ffb040', wallIn: '#6a2a1a', wallInLight: '#a8502a', floorA: '#3a2a2a', floorB: '#e8602a', accent: '#e8702a' });
gymFamily(['4', '5', '6'], { type: 'planta', roof: '#2f7a34', roofLight: '#6cc04c', roofDark: '#1a4a1e', rim: '#b8f090', wall: '#e8e0b8', wallDark: '#b8a878', wallLight: '#fff8d8', trim: '#1a4a1e', door: '#4aa03c', doorLight: '#b8f090', wallIn: '#2a5a2a', wallInLight: '#4a8a3a', floorA: '#9ac870', floorB: '#78a858', accent: '#4aa03c' });
gymFamily(['7', '8', '9'], { type: 'lucha', roof: '#a82a2a', roofLight: '#e86a5a', roofDark: '#5a1414', rim: '#f8e0c0', wall: '#f4ecdc', wallDark: '#c8b898', wallLight: '#ffffff', trim: '#5a1414', door: '#c8402a', doorLight: '#f8e0c0', wallIn: '#7a2a2a', wallInLight: '#b04a3a', floorA: '#d8c898', floorB: '#b8a468', accent: '#c8402a' });
gymFamily(['!', '@', '$'], { type: 'psiquico', roof: '#6a3a9a', roofLight: '#a878e0', roofDark: '#2e1a4e', rim: '#e8d8ff', wall: '#d8ccee', wallDark: '#a898c8', wallLight: '#f4eeff', trim: '#2e1a4e', door: '#8a5ad0', doorLight: '#e8d8ff', wallIn: '#3a2a6a', wallInLight: '#6a4aa8', floorA: '#2a2a4a', floorB: '#5a4a8a', accent: '#8a5ad0' });
gymFamily(['À', 'Á', 'Â'], { type: 'tierra', roof: '#8a5a30', roofLight: '#c89058', roofDark: '#4a2a14', rim: '#f0d8a0', wall: '#d8c098', wallDark: '#a8885a', wallLight: '#f0e0c0', trim: '#4a2a14', door: '#a8703a', doorLight: '#f0d8a0', wallIn: '#6a4a2a', wallInLight: '#a8784a', floorA: '#b89860', floorB: '#8a6a3a', accent: '#c89058' });
gymFamily(['Ã', 'Ä', 'Å'], { type: 'normal', roof: '#9a8a78', roofLight: '#c8bcaa', roofDark: '#4a4238', rim: '#f4ecd8', wall: '#e8e0cc', wallDark: '#b8ae98', wallLight: '#fffaec', trim: '#4a4238', door: '#8a7a68', doorLight: '#f4ecd8', wallIn: '#6a6254', wallInLight: '#a89c88', floorA: '#d8d0bc', floorB: '#b8ae98', accent: '#c8bcaa' });
gymFamily(['È', 'É', 'Ê'], { type: 'bicho', roof: '#5a8a1a', roofLight: '#9ac83a', roofDark: '#2a4a0a', rim: '#e8f090', wall: '#d8e0a8', wallDark: '#a8b878', wallLight: '#f2f8d0', trim: '#2a4a0a', door: '#6a9a2a', doorLight: '#e8f090', wallIn: '#3a5a1a', wallInLight: '#6a9a2a', floorA: '#a8c868', floorB: '#7aa03a', accent: '#9ac83a' });
gymFamily(['Ì', 'Í', 'Î'], { type: 'volador', roof: '#4a88c8', roofLight: '#8ac8f0', roofDark: '#1a3a6a', rim: '#f4faff', wall: '#e0eef8', wallDark: '#a8c0d8', wallLight: '#ffffff', trim: '#1a3a6a', door: '#5a98d8', doorLight: '#f4faff', wallIn: '#2a5a9a', wallInLight: '#5a98d8', floorA: '#b8d8f0', floorB: '#88b0d8', accent: '#8ac8f0' });
gymFamily(['&', '*', '+'], { type: 'siniestro', roof: '#2e2e42', roofLight: '#5a5a78', roofDark: '#12121c', rim: '#c8506a', wall: '#585870', wallDark: '#3a3a4e', wallLight: '#7a7a94', trim: '#12121c', door: '#2a2a3a', doorLight: '#c8506a', wallIn: '#1e1e2c', wallInLight: '#3a3a52', floorA: '#2a2a34', floorB: '#3e3e4c', accent: '#c8506a' });

const cache = new Map();

// ---- big city tiles ----
const sidewalk = (g) => {
  px(g, 0, 0, '#c9c5be', T, T);
  px(g, 0, 7, '#aeaaa3', T, 1); px(g, 7, 0, '#aeaaa3', 1, T);
  px(g, 0, 15, '#aeaaa3', T, 1); px(g, 15, 0, '#aeaaa3', 1, T);
  px(g, 1, 1, '#dad7d0', 5, 1); px(g, 9, 9, '#dad7d0', 5, 1);
};
const asphalt = (g, r) => speckle(g, r, '#4c4c56', ['#44444e', '#54545e', '#3e3e48'], 16);
const GLYPH = {
  B: ['110', '101', '110', '101', '110'], U: ['101', '101', '101', '101', '111'], Q: ['111', '101', '101', '111', '001'],
  E: ['111', '100', '110', '100', '111'], S: ['011', '100', '010', '001', '110'],
};
const signBand = (g, text) => {
  px(g, 0, 0, '#2a3a7a', T, T);
  px(g, 0, 0, '#e8eef8', T, 1); px(g, 0, 15, '#e8eef8', T, 1);
  [...text].forEach((ch, i) => GLYPH[ch].forEach((row, y) => [...row].forEach((b, x) => b === '1' && px(g, i * 4 + x, 5 + y, '#f2f6ff'))));
};
Object.assign(DRAW, {
  '0': (g, r) => asphalt(g, r),
  '-': (g, r) => { asphalt(g, r); px(g, 1, 7, '#f2d23c', 5, 2); px(g, 10, 7, '#f2d23c', 5, 2); },
  ':': (g, r) => { asphalt(g, r); px(g, 7, 1, '#f2d23c', 2, 5); px(g, 7, 10, '#f2d23c', 2, 5); },
  '/': (g, r) => { asphalt(g, r); for (let x = 1; x < T; x += 4) px(g, x, 1, '#eeeeee', 2, 14); },
  '_': (g) => sidewalk(g),
  '?': (g) => {
    px(g, 0, 0, '#d9cfba', T, T);
    for (let y = 0; y < T; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < T; x += 4) px(g, x, y, '#c4b89e', 2, 2);
    px(g, 0, 15, '#b8ac92', T, 1);
  },
  '[': (g) => {
    px(g, 0, 0, '#d9cfba', T, T);
    px(g, 0, 5, '#3a3e4a', T, 2); px(g, 0, 9, '#3a3e4a', T, 1);
    for (let x = 1; x < T; x += 5) px(g, x, 4, '#3a3e4a', 2, 8);
    px(g, 0, 5, '#7a8090', T, 1);
  },
  ']': (g) => {
    px(g, 0, 0, '#bfae94', T, T);
    px(g, 0, 15, '#8a7a64', T, 1); px(g, 0, 0, '#d4c6ae', T, 1);
    for (const [x, y] of [[2, 2], [9, 2], [2, 9], [9, 9]]) {
      px(g, x, y, '#2e4468', 5, 4); px(g, x + 1, y + 1, '#7ab0e0', 3, 2); px(g, x + 1, y + 1, '#c8e4f8', 1, 1);
      px(g, x - 1, y + 4, '#9a8a74', 7, 1);
    }
  },
  '{': (g, r) => {
    px(g, 0, 0, '#6c6c78', T, T);
    px(g, 0, 0, '#8e8e9a', T, 2); px(g, 0, 14, '#4a4a56', T, 2);
    px(g, 2, 5, '#b8bcc8', 5, 4); px(g, 2, 5, '#d8dce8', 5, 1); px(g, 10, 6, '#8a6a4a', 4, 6); px(g, 10, 6, '#aa8a6a', 4, 1);
    for (let i = 0; i < 4; i++) px(g, r.int(0, 15), r.int(2, 13), '#5c5c68');
  },
  '}': (g) => {
    px(g, 0, 0, '#a87a4a', T, T);
    for (let y = 0; y < T; y += 4) px(g, 0, y + 3, '#6a4a2a', T, 1);
    for (let y = 0; y < T; y += 8) px(g, 5, y, '#6a4a2a', 1, 3);
    px(g, 0, 0, '#c8966a', T, 1);
  },
  '(': (g) => {
    px(g, 0, 0, '#4a9ac8', T, T);
    px(g, 0, 0, '#d8e8f0', T, 1); px(g, 0, 15, '#d8e8f0', T, 1);
    px(g, 7, 0, '#d8e8f0', 2, T);
    px(g, 2, 3, '#8ad0f0', 3, 1); px(g, 3, 4, '#8ad0f0', 2, 1); px(g, 10, 7, '#8ad0f0', 3, 1); px(g, 11, 8, '#8ad0f0', 2, 1);
  },
  ')': (g) => {
    px(g, 0, 0, '#e4ecf0', T, T);
    px(g, 0, 0, '#2a5ab8', T, 3); px(g, 0, 3, '#8ab0d8', T, 1);
    px(g, 0, 14, '#9aa8b4', T, 2);
  },
  '<': (g) => signBand(g, 'BUQU'),
  '>': (g) => signBand(g, 'EBUS'),
  '|': (g) => {
    sidewalk(g);
    px(g, 7, 4, '#2e3240', 2, 11); px(g, 5, 14, '#2e3240', 6, 2);
    px(g, 4, 2, '#2e3240', 8, 2); px(g, 5, 4, '#fff2a0', 6, 2); px(g, 6, 5, '#ffe060', 4, 1);
  },
  '"': (g, r) => {
    sidewalk(g);
    px(g, 7, 9, '#6a4a2a', 2, 5); px(g, 4, 13, '#8a8a92', 8, 3);
    for (let i = 0; i < 26; i++) { const x = 2 + r.int(0, 11), y = 1 + r.int(0, 9); if ((x - 8) ** 2 + (y - 5) ** 2 < 30) px(g, x, y, r.pick(['#3a8a34', '#4a9a3c', '#2e7a2c']), 2, 2); }
  },
});

// Montevideo redraws the street sign on a sidewalk instead of grass.
THEMES.ciudad = {
  S: (g) => {
    sidewalk(g);
    px(g, 7, 7, '#5a3a1a', 2, 8); px(g, 2, 2, '#5a3a1a', 12, 7); px(g, 3, 3, '#c8905a', 10, 5);
    px(g, 4, 4, '#7a4a2a', 8, 1); px(g, 4, 6, '#7a4a2a', 6, 1);
  },
};

// The cave between Piriápolis and Minas: stone floor, rubble where creatures hide, rock walls and crystals.
const caveFloor = (g, r) => speckle(g, r, '#5a5560', ['#524d58', '#625d68', '#4a4650'], 14);
const caveWall = (g, r) => {
  px(g, 0, 0, '#2e2a36', T, T);
  for (let i = 0; i < 6; i++) { const x = r.int(0, 11), y = r.int(0, 11); px(g, x, y, '#44404e', r.int(3, 5), r.int(3, 4)); px(g, x, y, '#5a5566', 2, 1); }
  px(g, 0, 15, '#1c1a22', T, 1);
};
THEMES.cueva = {
  '.': caveFloor,
  ',': (g, r) => { caveFloor(g, r); for (let i = 0; i < 7; i++) { const x = r.int(1, 12), y = r.int(1, 12); px(g, x, y, '#3e3a46', 3, 2); px(g, x, y, '#6e6a78', 2, 1); } },
  '=': (g, r) => speckle(g, r, '#8a8294', ['#7e768a', '#968ea0', '#74707e'], 12),
  '#': caveWall,
  q: caveWall,
  F: caveWall,
  f: (g, r) => { caveFloor(g, r); g.fillStyle = '#7ad8f0'; g.beginPath(); g.moveTo(8, 3); g.lineTo(11, 12); g.lineTo(5, 12); g.fill(); g.fillStyle = '#c8f4ff'; g.beginPath(); g.moveTo(8, 3); g.lineTo(9, 8); g.lineTo(7, 8); g.fill(); px(g, 3, 12, '#2a8aa8', 10, 1); },
  S: (g) => { caveFloor(g, new Rng(5)); px(g, 7, 7, '#5a3a1a', 2, 8); px(g, 2, 2, '#5a3a1a', 12, 7); px(g, 3, 3, '#c8905a', 10, 5); px(g, 4, 4, '#7a4a2a', 8, 1); px(g, 4, 6, '#7a4a2a', 6, 1); },
};

export function tileCanvas(ch, frame = 0, theme = null) {
  const info = TILE_INFO[ch];
  const f = info?.anim ? frame % 4 : 0;
  const set = theme ? THEMES[theme] : null;
  const ground = set?.['.'] ?? null;
  const draw = set?.[ch] || null;
  const themed = draw || (ground && (DRAW[ch] || OVER[ch]));
  const key = (themed ? `${theme}|` : '') + ch + f;
  const drawn = override(`tile:${key}`, T, T);
  if (drawn) return drawn;
  let c = cache.get(key);
  if (!c) {
    c = mk();
    const g = c.getContext('2d');
    const rng = new Rng(ch.charCodeAt(0) * 97 + 13);
    GROUND = ground;
    try {
      if (!draw && !DRAW[ch] && OVER[ch]) { grass(g, new Rng(7)); OVER[ch](g, rng, f); }
      else (draw ?? DRAW[ch] ?? DRAW.O)(g, rng, f);
    } finally { GROUND = null; }
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
