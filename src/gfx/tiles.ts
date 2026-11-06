// Procedural 16x16 pixel tileset (no external images).
import { CUSTOM } from '../data/custom-content.js';
import { Rng } from '../core/rng.ts';
import { override, overrideEntry, overrideHasHoles, generated } from './overrides.ts';
import { decodeSprite } from './sprite-codec.ts';

export const T = 16;

// Tile legend. solid = blocks movement; enc = wild encounters; anim = animated.
/** Rounded ends of a rock wall: [start, end] for the wall of each side. */
export const WALL_CAPS = { w: ['а', 'б'], e: ['в', 'г'], n: ['д', 'е'], s: ['ж', 'з'] };

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
  ϙ: { name: 'boca de cueva' },
  ϛ: { name: 'boca de cueva' },
  ϝ: { name: 'boca de cueva' },
  ϰ: { name: 'pared de roca', solid: true },
  ϱ: { name: 'pared de roca', solid: true },
  ϳ: { name: 'pared de roca', solid: true },
  ϴ: { name: 'roca', solid: true },
  ϵ: { name: 'suelo de cueva' },
  ϊ: { name: 'casilleros de correo', solid: true },
  ϋ: { name: 'encomiendas', solid: true },
  ΐ: { name: 'cinta transportadora' },
  Ͽ: { name: 'ascensor', solid: true },
  Ϡ: { name: 'cascada', solid: true, anim: true },
  ϸ: { name: 'piscina de la sala', solid: true },
  Ϲ: { name: 'pasarela' },
  ϻ: { name: 'instalación', solid: true },
  ϼ: { name: 'equipo de la sala', solid: true },
  Ϯ: { name: 'vitrina del museo', solid: true },
  ϯ: { name: 'busto del museo', solid: true },
  Ϫ: { name: 'puerta de camarote', solid: true },
  Ϭ: { name: 'bote salvavidas', solid: true },
  ϭ: { name: 'salvavidas', solid: true },
  Ϣ: { name: 'flecha lanzadora' },
  Ϥ: { name: 'flecha lanzadora' },
  Ϧ: { name: 'flecha lanzadora' },
  Ϩ: { name: 'flecha lanzadora' },
  ϲ: { name: 'pared de roca', solid: true },
  ...Object.fromEntries(Object.values(WALL_CAPS).flat().map((c) => [c, { name: 'extremo de pared de roca', solid: true }])),
  λ: { name: 'desnivel', solid: true, ledge: true },
  k: { name: 'pared de roca', solid: true },
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
  '¤': { name: 'agua con valla', solid: true, anim: true },
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
  'Д': { name: 'tronco caído', solid: true, over: true },
  'Ф': { name: 'hongos', over: true },
  'Ц': { name: 'piedritas', over: true },
  'Ш': { name: 'barril', solid: true, over: true },
  'Щ': { name: 'mojón de ruta', solid: true, over: true },
  'Ѣ': { name: 'cabina de peaje', solid: true, over: true },
  'Ѳ': { name: 'carril de peaje' },
  'Э': { name: 'cajón', solid: true, over: true },
  'Ю': { name: 'totoras', over: true },
  'Я': { name: 'girasoles', over: true },
  'И': { name: 'tuna', solid: true, over: true },
  'Л': { name: 'mojón', solid: true, over: true },
  'П': { name: 'fogón', solid: true, over: true },
  'Ч': { name: 'paja brava', over: true },
  'Б': { name: 'ancla', solid: true, over: true },
  'Г': { name: 'redes de pesca', solid: true, over: true },
  'Ж': { name: 'sombrilla', solid: true, over: true },
  'З': { name: 'mesa con sillas', solid: true, over: true },
  'Й': { name: 'bicicleta apoyada', solid: true, over: true },
  'Н': { name: 'tanque australiano', solid: true, over: true },
  'Р': { name: 'poste con nido de hornero', solid: true, over: true },
  'С': { name: 'cesto de basura', solid: true, over: true },
  'Ь': { name: 'maceta grande', solid: true, over: true },
  'Ъ': { name: 'bebedero de campo', solid: true, over: true },
  'א': { name: 'fardo de pasto', solid: true, over: true },
  'ב': { name: 'carreta', solid: true, over: true },
  'ג': { name: 'espantapájaros', solid: true, over: true },
  'ד': { name: 'banco de plaza', solid: true, over: true },
  'ה': { name: 'colmenas', solid: true, over: true },
  'ו': { name: 'piedra con musgo', solid: true, over: true },
  'ז': { name: 'charco', over: true },
  'ח': { name: 'cartel de chacra', solid: true, over: true },
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

/**
 * A wall of rock one tile wide that runs along the edge of the map, with the lit side towards the player:
 * a lumpy outline, darker veins, a mossy strip on the ground next to it and, when `mouth`, a black cave opening.
 * It is drawn with the rock on the left and then turned to face `side` ('w' keeps it, 'e' mirrors, 'n' and 's' turn it).
 */
function rockWall(g, r, side, mouth, cap = 0) {
  grass(g, r);
  g.save();
  if (side === 'e') g.transform(-1, 0, 0, 1, T, 0);
  else if (side === 'n') g.transform(0, 1, 1, 0, 0, 0);
  else if (side === 's') g.transform(0, -1, 1, 0, 0, T);
  const edge = [];
  for (let y = 0; y < T; y++) edge.push(13 + Math.round(Math.sin(y * 0.55 + 1) * 1.2));
  if (cap) for (let y = 0; y < T; y++) { // the end of the wall rounds off
    const e = cap < 0 ? y : T - 1 - y;
    if (e < 6) edge[y] = Math.max(3, edge[y] - Math.round(((6 - e) * (6 - e)) / 5));
  }
  for (let y = 0; y < T; y++) px(g, edge[y] + 1, y, 'rgba(200,176,72,0.4)', 2, 1); // mossy strip beside the rock
  for (let y = 0; y < T; y++) {
    px(g, 0, y, '#85756a', edge[y], 1);
    px(g, edge[y] - 1, y, '#6a5a50', 2, 1); // shaded lip
    px(g, edge[y] + 1, y, '#4a3e38', 1, 1); // outline
  }
  if (cap) { const ey = cap < 0 ? 0 : T - 1; px(g, 0, ey, '#4a3e38', edge[ey] + 2, 1); px(g, 0, cap < 0 ? 1 : T - 2, '#a89a8c', edge[ey] + 1, 1); }
  for (let i = 0; i < 9; i++) px(g, r.int(0, 10), r.int(0, 15), r.pick(['#948476', '#6a5a50', '#756558']), r.int(2, 5), 1);
  for (let i = 0; i < 3; i++) { const x = r.int(0, 8), y = r.int(1, 13); px(g, x, y, '#4e423a', 3, 1); px(g, x + 3, y + 1, '#4e423a', 2, 1); }
  px(g, r.int(0, 8), r.int(0, 15), '#b0785a'); // a mineral fleck
  if (mouth) {
    g.fillStyle = '#4a3e38'; g.beginPath(); g.ellipse(15.5, 8, 8, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#b0a294'; g.beginPath(); g.ellipse(15.5, 8, 7.2, 7.3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#050408'; g.beginPath(); g.ellipse(16, 8, 6, 6.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#16111c'; g.beginPath(); g.ellipse(16.5, 8, 3.2, 4.4, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
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
  // Decorative water inside a town: a stone basin with a low fence. It is not '~', so no canoe and no fishing.
  '¤': (g, r, frame) => {
    DRAW['~'](g, r, frame);
    px(g, 0, 0, '#cfcabc', T, 2); px(g, 0, T - 2, '#cfcabc', T, 2); px(g, 0, 0, '#cfcabc', 2, T); px(g, T - 2, 0, '#cfcabc', 2, T);
    px(g, 2, 2, '#8d887a', T - 4, 1); px(g, 2, 2, '#8d887a', 1, T - 4);
    px(g, 0, T - 1, '#5e5a4e', T, 1); px(g, T - 1, 0, '#5e5a4e', 1, T);
    for (const [x, y] of [[0, 0], [T - 3, 0], [0, T - 3], [T - 3, T - 3]]) { px(g, x, y, '#6f6a5c', 3, 3); px(g, x + 1, y, '#a8a395', 1, 1); }
    for (const x of [5, 8, 11]) { px(g, x, 0, '#7a7566', 1, 2); px(g, x, T - 2, '#7a7566', 1, 2); }
    for (const y of [5, 8, 11]) { px(g, 0, y, '#7a7566', 2, 1); px(g, T - 2, y, '#7a7566', 2, 1); }
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
  ϗ: (g, r) => rockWall(g, r, 'w', true),
  ϙ: (g, r) => rockWall(g, r, 'e', true),
  ϛ: (g, r) => rockWall(g, r, 'n', true),
  ϝ: (g, r) => rockWall(g, r, 's', true),
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
  k: (g, r) => rockWall(g, r, 'w', false),
  ϰ: (g, r) => rockWall(g, r, 'e', false),
  ϱ: (g, r) => rockWall(g, r, 'n', false),
  ϲ: (g, r) => rockWall(g, r, 's', false),
  ...Object.fromEntries(Object.entries(WALL_CAPS).flatMap(([side, [a, b]]) => [[a, (g, r) => rockWall(g, r, side, false, -1)], [b, (g, r) => rockWall(g, r, side, false, 1)]])),
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

const GYM_FLOOR_LINES = (g, base, line, accent?) => { px(g, 0, 0, base, T, T); px(g, 0, 15, line, T, 1); px(g, 15, 0, line, 1, T); if (accent) px(g, 7, 7, accent, 2, 2); };

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
  'Д': (g) => {
    shade(g, 8, 13, 7, 1.5);
    px(g, 1, 7, '#6a4426', 14, 6); px(g, 2, 6, '#7e5430', 12, 1); px(g, 2, 13, '#4a2e18', 12, 1);
    px(g, 1, 8, '#5a3a20', 14, 1); px(g, 4, 9, '#5a3a20', 8, 1); px(g, 3, 11, '#5a3a20', 9, 1);
    px(g, 0, 7, '#c89a62', 2, 6); px(g, 1, 9, '#a87a44', 1, 2); px(g, 14, 7, '#c89a62', 2, 6); px(g, 14, 9, '#a87a44', 1, 2);
    px(g, 6, 5, '#4a9a3a', 3, 1); px(g, 7, 4, '#6ac04a', 1, 1);
  },
  'Ф': (g) => {
    shade(g, 8, 13, 5, 1);
    for (const [x, y, c] of [[4, 9, '#d84a3a'], [9, 7, '#d84a3a'], [11, 10, '#e8a048']] as [number, number, string][]) {
      px(g, x, y + 2, '#f0e6cc', 2, 3); px(g, x - 1, y, c, 4, 2); px(g, x, y - 1, c, 2, 1);
      px(g, x, y, '#fff', 1, 1);
    }
  },
  'Ц': (g) => {
    for (const [x, y, w, h] of [[3, 9, 4, 3], [8, 7, 5, 4], [10, 12, 3, 2], [2, 13, 3, 2]]) {
      px(g, x, y + h, 'rgba(0,0,0,0.18)', w, 1); px(g, x, y, '#8a8a92', w, h); px(g, x, y, '#b4b4bc', w - 1, 1); px(g, x + w - 1, y + 1, '#6a6a72', 1, h - 1);
    }
  },
  // Route marker: a white concrete post with a red band; passing next to it saves a respawn point (no healing).
  'Щ': (g) => {
    shade(g, 8, 14, 6, 1.4);
    px(g, 5, 3, '#e8e6de', 6, 11); px(g, 5, 3, '#c2beb0', 1, 11); px(g, 10, 3, '#a8a496', 1, 11);
    px(g, 4, 2, '#f4f2ea', 8, 2); px(g, 4, 4, '#a8a496', 8, 1);
    px(g, 5, 6, '#c8302a', 6, 3); px(g, 5, 6, '#e0463a', 6, 1);
    px(g, 7, 10, '#3a4a6a', 2, 1); px(g, 6, 11, '#3a4a6a', 4, 1);
    px(g, 4, 14, '#7a766a', 8, 1);
  },
  // Toll booth: a small cabin with a striped roof and a window facing the lane
  'Ѣ': (g) => {
    px(g, 0, 0, '#5a5a62', 16, 16);
    px(g, 0, 15, '#3a3a42', 16, 1);
    px(g, 1, 3, '#e8e6de', 14, 11); px(g, 1, 3, '#c2beb0', 14, 1); px(g, 1, 13, '#a8a496', 14, 1);
    px(g, 3, 6, '#7ab8d8', 10, 4); px(g, 3, 6, '#b8e0f0', 10, 1); px(g, 3, 9, '#5a98b8', 10, 1);
    px(g, 0, 0, '#c8302a', 16, 3);
    for (let x = 1; x < 16; x += 4) px(g, x, 0, '#f4f2ea', 2, 3);
    px(g, 0, 3, '#7a1a16', 16, 1);
  },
  // Toll lane: asphalt with the barrier arm raised beside it
  'Ѳ': (g) => {
    px(g, 0, 0, '#6a6a72', 16, 16);
    px(g, 0, 0, '#7a7a82', 16, 1); px(g, 0, 15, '#5a5a62', 16, 1);
    px(g, 1, 4, '#f2c02a', 2, 8); px(g, 1, 4, '#3a3a42', 2, 1);
    for (let k = 0; k < 4; k++) px(g, 3 + k * 3, 6, k % 2 ? '#f4f2ea' : '#c8302a', 3, 2);
    for (let x = 2; x < 16; x += 4) px(g, x, 14, '#d8d4c0', 2, 1);
  },
  'Ш': (g) => {
    shade(g, 8, 14, 6, 1.4);
    px(g, 3, 4, '#7a4a22', 10, 10); px(g, 2, 6, '#7a4a22', 12, 6); px(g, 4, 3, '#94602e', 8, 1);
    px(g, 3, 5, '#4a4a54', 10, 1); px(g, 2, 11, '#4a4a54', 12, 1); px(g, 3, 13, '#4a4a54', 10, 1);
    px(g, 5, 7, '#94602e', 1, 4); px(g, 8, 7, '#94602e', 1, 4); px(g, 11, 7, '#5a3418', 1, 4);
    px(g, 4, 4, '#2a2018', 8, 1);
  },
  'Э': (g) => {
    shade(g, 8, 14, 7, 1.4);
    px(g, 2, 4, '#b88a4e', 12, 10); px(g, 2, 4, '#d8a864', 12, 1); px(g, 2, 13, '#7a5a30', 12, 1);
    px(g, 2, 4, '#7a5a30', 1, 10); px(g, 13, 4, '#7a5a30', 1, 10);
    for (let i = 0; i < 10; i++) { px(g, 3 + i, 5 + i * 0.8 | 0, '#8a6a38', 1, 1); }
    px(g, 3, 8, '#9a7240', 10, 1); px(g, 7, 4, '#7a5a30', 2, 10);
  },
  'Ю': (g, r) => {
    for (const [x, h] of [[3, 9], [6, 12], [9, 10], [12, 11]]) {
      px(g, x, 15 - h, '#5a8a3a', 1, h); px(g, x, 13 - h + 3, '#4a7a2e', 1, 2);
      px(g, x - 1, 15 - h - 3, '#6a3a1e', 3, 4); px(g, x, 15 - h - 3, '#8a5a30', 1, 2);
    }
    px(g, 1, 14, '#4a7a2e', 14, 1);
  },
  'Я': (g) => {
    shade(g, 8, 14, 6, 1);
    for (const [x, y] of [[4, 5], [9, 3], [12, 7]]) {
      px(g, x, y + 3, '#3a8a30', 1, 11 - y); px(g, x - 1, y + 8, '#4aa040', 1, 1);
      px(g, x - 2, y, '#f4c020', 5, 3); px(g, x - 1, y - 1, '#f4c020', 3, 5); px(g, x - 1, y, '#6a4018', 3, 3);
    }
  },
  'И': (g) => {
    shade(g, 8, 14, 6, 1.4);
    for (const [x, y, w, h] of [[5, 8, 6, 6], [2, 5, 5, 5], [9, 2, 5, 6]]) {
      g.fillStyle = '#4a9a4a'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); g.fill();
      px(g, x + 1, y + 1, '#6ac06a', 2, 1);
      px(g, x + 1, y + 3, '#f0f0c0', 1, 1); px(g, x + 3, y + 2, '#f0f0c0', 1, 1);
    }
    px(g, 11, 2, '#e8486a', 2, 2);
  },
  'Л': (g) => {
    shade(g, 8, 15, 5, 1.2);
    px(g, 4, 7, '#c8c8d0', 8, 8); px(g, 5, 5, '#c8c8d0', 6, 2); px(g, 6, 4, '#c8c8d0', 4, 1);
    px(g, 4, 7, '#e8e8ee', 1, 8); px(g, 11, 7, '#9a9aa6', 1, 8); px(g, 5, 14, '#9a9aa6', 6, 1);
    px(g, 6, 8, '#3a3a44', 4, 1); px(g, 6, 10, '#3a3a44', 4, 1); px(g, 7, 12, '#3a3a44', 2, 1);
  },
  'П': (g, r, f) => {
    shade(g, 8, 14, 6, 1.3);
    px(g, 3, 12, '#6a4426', 10, 2); px(g, 4, 11, '#8a5a30', 8, 1);
    g.fillStyle = '#f08020'; g.beginPath(); g.moveTo(8, 2); g.lineTo(12, 11); g.lineTo(4, 11); g.fill();
    g.fillStyle = '#ffd040'; g.beginPath(); g.moveTo(8, 5); g.lineTo(10.5, 11); g.lineTo(5.5, 11); g.fill();
    px(g, 7, 8, '#fff6b0', 2, 3);
  },
  'Ч': (g) => {
    for (const [x, h, c] of [[3, 11, '#9ab04a'], [6, 13, '#b8c860'], [9, 12, '#9ab04a'], [12, 10, '#b8c860']] as [number, number, string][]) {
      for (let i = 0; i < h; i++) px(g, x + (i > h - 4 ? (x < 8 ? -1 : 1) * ((i - (h - 4)) >> 1) : 0), 15 - i, i % 3 ? c : '#7a9a3a', 1, 1);
      px(g, x - 1, 15 - h, '#e8e0a8', 3, 2); px(g, x, 14 - h, '#e8e0a8', 1, 1);
    }
  },
  'Б': (g) => {
    shade(g, 8, 14, 5, 1.2);
    px(g, 7, 2, '#3a3a46', 2, 11); px(g, 5, 4, '#3a3a46', 6, 1); px(g, 6, 1, '#3a3a46', 4, 2); px(g, 7, 0, '#5a5a68', 2, 1);
    px(g, 3, 10, '#3a3a46', 2, 2); px(g, 11, 10, '#3a3a46', 2, 2); px(g, 4, 12, '#3a3a46', 8, 2); px(g, 3, 9, '#3a3a46', 1, 1); px(g, 12, 9, '#3a3a46', 1, 1);
    px(g, 7, 3, '#6a6a78', 1, 8); px(g, 6, 12, '#6a6a78', 3, 1);
  },
  'Г': (g) => {
    px(g, 1, 3, '#6a4426', 1, 12); px(g, 14, 3, '#6a4426', 1, 12); px(g, 1, 3, '#6a4426', 14, 1);
    for (let y = 4; y < 14; y += 2) for (let x = 2; x < 14; x += 2) { px(g, x, y, '#c8a860', 2, 1); px(g, x + 1, y + 1, '#a88840', 1, 1); }
    px(g, 3, 12, '#4a8ab0', 2, 2); px(g, 9, 11, '#4a8ab0', 2, 3);
  },
  'Ж': (g) => {
    shade(g, 8, 15, 5, 1);
    px(g, 7, 6, '#8a6a3a', 2, 9);
    g.fillStyle = '#e8486a'; g.beginPath(); g.moveTo(1, 7); g.quadraticCurveTo(8, -3, 15, 7); g.lineTo(1, 7); g.fill();
    px(g, 4, 5, '#f4f4f4', 2, 2); px(g, 8, 3, '#f4f4f4', 3, 3); px(g, 12, 5, '#f4f4f4', 2, 2);
    px(g, 1, 7, '#b8284a', 14, 1);
  },
  'З': (g) => {
    shade(g, 8, 14, 7, 1.4);
    px(g, 4, 6, '#d8c8a0', 8, 2); px(g, 5, 8, '#a8885a', 1, 5); px(g, 10, 8, '#a8885a', 1, 5); px(g, 4, 6, '#f0e0b8', 8, 1);
    px(g, 0, 8, '#6a4a2a', 3, 1); px(g, 0, 9, '#6a4a2a', 1, 5); px(g, 2, 9, '#6a4a2a', 1, 5); px(g, 13, 8, '#6a4a2a', 3, 1); px(g, 13, 9, '#6a4a2a', 1, 5); px(g, 15, 9, '#6a4a2a', 1, 5);
    px(g, 7, 4, '#e8e8e8', 2, 2); px(g, 7, 3, '#c83a3a', 2, 1);
  },
  'Й': (g) => {
    shade(g, 8, 14, 6, 1);
    for (const cx of [4, 12]) { g.strokeStyle = '#2a2a34'; g.lineWidth = 1; g.beginPath(); g.arc(cx, 11, 3, 0, 7); g.stroke(); px(g, cx, 11, '#8a8a98', 1, 1); }
    g.fillStyle = '#e0263a'; g.fillRect(4, 8, 5, 1); g.fillRect(8, 6, 1, 3); g.fillRect(8, 8, 4, 1); g.fillRect(4, 8, 1, 3); g.fillRect(11, 8, 1, 3);
    px(g, 7, 5, '#2a2a34', 3, 1); px(g, 11, 6, '#2a2a34', 3, 1); px(g, 12, 7, '#2a2a34', 1, 1);
  },
  'Н': (g) => {
    shade(g, 8, 14, 6, 1.4);
    px(g, 2, 4, '#8a9aa8', 12, 10); px(g, 3, 3, '#a8b8c4', 10, 1); px(g, 2, 4, '#c0ccd6', 2, 10); px(g, 12, 4, '#6a7a88', 2, 10);
    for (const y of [6, 9, 12]) px(g, 2, y, '#5a6a78', 12, 1);
    px(g, 6, 10, '#3a4a58', 4, 4); px(g, 7, 11, '#8a9aa8', 2, 1);
  },
  'Р': (g) => {
    shade(g, 8, 15, 3, 1);
    px(g, 7, 6, '#7a5230', 2, 9); px(g, 7, 6, '#9a6a3a', 1, 9);
    g.fillStyle = '#b88a58'; g.beginPath(); g.ellipse(8, 4, 5, 3.5, 0, 0, 7); g.fill();
    g.fillStyle = '#d8aa78'; g.beginPath(); g.ellipse(7, 3, 3, 1.6, 0, 0, 7); g.fill();
    px(g, 11, 4, '#1a1008', 2, 2); px(g, 4, 6, '#8a6238', 8, 1);
  },
  'С': (g) => {
    shade(g, 8, 14, 4, 1.1);
    px(g, 4, 4, '#4a8a5a', 8, 10); px(g, 3, 3, '#5aa06a', 10, 2); px(g, 4, 4, '#6ab87a', 1, 10);
    for (const x of [6, 8, 10]) px(g, x, 6, '#2a5a3a', 1, 6);
    px(g, 5, 13, '#2a5a3a', 6, 1);
  },
  'Ь': (g) => {
    shade(g, 8, 14, 6, 1.2);
    g.fillStyle = '#2f9a4a'; g.beginPath(); g.arc(8, 5, 5, 0, 7); g.fill(); g.fillStyle = '#4ab860'; g.beginPath(); g.arc(7, 4, 3, 0, 7); g.fill();
    px(g, 4, 3, '#e84a6a', 2, 2); px(g, 10, 5, '#f4c030', 2, 2); px(g, 7, 7, '#f4f4f4', 2, 1);
    px(g, 4, 9, '#c8643a', 8, 5); px(g, 3, 9, '#d8744a', 10, 2); px(g, 4, 9, '#e89060', 8, 1); px(g, 5, 13, '#a8482a', 6, 1);
  },
  'א': (g) => {
    shade(g, 8, 14, 7, 1.3);
    px(g, 2, 6, '#c9a53a', 12, 8); px(g, 3, 4, '#d8b848', 10, 3); px(g, 2, 6, '#e6c95a', 12, 1);
    for (const x of [4, 7, 10]) px(g, x, 5, '#a8842a', 1, 9);
    px(g, 2, 9, '#8a6a22', 12, 1); px(g, 2, 12, '#8a6a22', 12, 1);
  },
  'ב': (g) => {
    shade(g, 8, 14, 7, 1.3);
    px(g, 1, 7, '#7a5230', 14, 4); px(g, 1, 7, '#9a6c40', 14, 1); px(g, 2, 5, '#7a5230', 1, 2); px(g, 13, 5, '#7a5230', 1, 2);
    g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(5, 12, 3, 0, 7); g.fill(); g.beginPath(); g.arc(11, 12, 3, 0, 7); g.fill();
    g.fillStyle = '#a88858'; g.beginPath(); g.arc(5, 12, 1, 0, 7); g.fill(); g.beginPath(); g.arc(11, 12, 1, 0, 7); g.fill();
    px(g, 3, 3, '#d8b848', 10, 3);
  },
  'ג': (g) => {
    shade(g, 8, 14, 4, 1);
    px(g, 7, 6, '#6a4a2a', 2, 9); px(g, 2, 7, '#6a4a2a', 12, 1);
    px(g, 5, 2, '#d8b070', 6, 5); px(g, 4, 1, '#6a4a2a', 8, 2); px(g, 6, 3, '#1a1a1a', 1, 1); px(g, 9, 3, '#1a1a1a', 1, 1);
    px(g, 4, 8, '#a83a3a', 3, 4); px(g, 9, 8, '#a83a3a', 3, 4); px(g, 7, 7, '#3a5aa8', 2, 5);
  },
  'ד': (g) => {
    shade(g, 8, 14, 7, 1.2);
    px(g, 2, 8, '#8a5a2e', 12, 2); px(g, 2, 5, '#9a6a38', 12, 2); px(g, 2, 5, '#b88650', 12, 1);
    px(g, 3, 10, '#4a3018', 2, 4); px(g, 11, 10, '#4a3018', 2, 4); px(g, 3, 7, '#4a3018', 1, 3); px(g, 12, 7, '#4a3018', 1, 3);
  },
  'ה': (g) => {
    shade(g, 8, 14, 7, 1.3);
    for (const [x, y] of [[2, 8], [9, 8], [5, 3]]) { px(g, x, y, '#e8d05a', 5, 5); px(g, x, y, '#f4e27a', 5, 1); px(g, x, y + 2, '#8a6a22', 5, 1); px(g, x + 1, y + 3, '#2a1a0a', 3, 1); }
    px(g, 2, 13, '#6a4a2a', 3, 1); px(g, 9, 13, '#6a4a2a', 3, 1);
  },
  'ו': (g) => {
    shade(g, 8, 14, 6, 1.3);
    g.fillStyle = '#8a8a90'; g.beginPath(); g.ellipse(8, 9, 6, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#a8a8b0'; g.beginPath(); g.ellipse(7, 7, 4, 3, 0, 0, 7); g.fill();
    px(g, 4, 5, '#4ab860', 4, 2); px(g, 9, 7, '#3a9a50', 3, 2); px(g, 5, 11, '#4ab860', 3, 1);
  },
  'ז': (g) => {
    g.fillStyle = 'rgba(70,120,170,0.75)'; g.beginPath(); g.ellipse(8, 9, 6, 3.2, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(170,210,240,0.7)'; g.beginPath(); g.ellipse(7, 8, 3, 1.2, 0, 0, 7); g.fill();
  },
  'ח': (g) => {
    shade(g, 8, 14, 5, 1);
    px(g, 7, 8, '#6a4a2a', 2, 7); px(g, 2, 3, '#8a5a2e', 12, 6); px(g, 2, 3, '#b88650', 12, 1);
    px(g, 4, 5, '#f4f0e0', 8, 1); px(g, 4, 7, '#f4f0e0', 6, 1);
  },
  'Ъ': (g) => {
    shade(g, 8, 14, 7, 1.3);
    px(g, 1, 8, '#8a8a94', 14, 5); px(g, 1, 7, '#b8b8c2', 14, 1); px(g, 1, 13, '#5a5a64', 14, 1);
    px(g, 2, 8, '#4a8ab0', 12, 3); px(g, 3, 8, '#7ab8e0', 4, 1);
    px(g, 1, 8, '#5a5a64', 1, 5); px(g, 14, 8, '#5a5a64', 1, 5);
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

// Correo Uruguayo gym: pigeonhole shelves, parcel stacks and belts (all drawn on the plain gym floor).
{
  const floorN = (g) => { px(g, 0, 0, '#d8d0bc', T, T); px(g, 0, 15, '#b8ae98', T, 1); px(g, 15, 0, '#b8ae98', 1, T); px(g, 3, 3, '#b8ae98', 2, 2); px(g, 10, 9, '#b8ae98', 3, 1); };
  const t = (THEMES as any).gym_normal;
  t['ϊ'] = (g) => {
    px(g, 0, 0, '#4a4238', T, T);
    for (let y = 1; y < 15; y += 4) for (let x = 1; x < 15; x += 5) { px(g, x, y, '#2a2620', 4, 3); px(g, x, y + 3, '#8a7a60', 4, 1); if ((x + y) % 3 === 0) px(g, x + 1, y + 1, '#f4ecd8', 2, 2); }
    px(g, 0, 0, '#6a6254', T, 1);
  };
  t['ϋ'] = (g) => {
    floorN(g);
    px(g, 1, 7, '#8a5a30', 14, 8); px(g, 1, 7, '#c89058', 14, 2); px(g, 7, 7, '#e8d8a8', 2, 8);
    px(g, 3, 1, '#a8703a', 10, 6); px(g, 3, 1, '#d8a868', 10, 1); px(g, 7, 1, '#e8d8a8', 2, 6); px(g, 10, 4, '#f4ecd8', 2, 2);
    px(g, 1, 15, '#4a2a14', 14, 1);
  };
  t['ΐ'] = (g) => {
    px(g, 0, 0, '#d8d0bc', T, T);
    px(g, 0, 3, '#3a3a44', T, 10); px(g, 0, 3, '#5a5a66', T, 1); px(g, 0, 12, '#26262e', T, 1);
    for (let x = 0; x < T; x += 4) px(g, x, 5, '#6a6a78', 1, 6);
    for (let x = 1; x < T; x += 8) { px(g, x, 7, '#e8c040', 2, 1); px(g, x + 1, 8, '#e8c040', 2, 1); px(g, x, 9, '#e8c040', 2, 1); }
  };
}


// OSE gym (agua): treatment-plant tank with a catwalk across it, pipe walls and valves.
{
  const t = (THEMES as any).gym_agua;
  const floor = t.Y;
  t['ϸ'] = (g, r) => {
    px(g, 0, 0, '#2a6aa8', T, T);
    for (let i = 0; i < 5; i++) px(g, r.int(0, 12), r.int(1, 14), '#4a8ac8', r.int(3, 6), 1);
    for (let i = 0; i < 3; i++) px(g, r.int(0, 13), r.int(1, 14), '#8ac0f0', 2, 1);
    px(g, 0, 0, '#1d4f8a', T, 1); px(g, 0, 0, '#1d4f8a', 1, T);
  };
  t['Ϲ'] = (g) => {
    px(g, 0, 0, '#2a6aa8', T, T); px(g, 0, 0, '#1d4f8a', T, 1);
    px(g, 0, 1, '#8a98a8', T, 14);
    for (let x = 0; x < T; x += 4) px(g, x, 1, '#4a5868', 1, 14);
    for (let y = 3; y < 15; y += 4) px(g, 0, y, '#4a5868', T, 1);
    px(g, 0, 1, '#c8d4e0', T, 1); px(g, 0, 14, '#5a6878', T, 1);
  };
  t['ϻ'] = (g) => {
    px(g, 0, 0, '#2a6ab0', T, T); px(g, 0, 11, '#1d4f8a', T, 5);
    px(g, 0, 3, '#7a8aa0', T, 4); px(g, 0, 3, '#c8d8e8', T, 1); px(g, 0, 6, '#4a5a70', T, 1);
    px(g, 5, 2, '#4a5a70', 2, 6); px(g, 12, 2, '#4a5a70', 2, 6);
    px(g, 0, 11, '#7a8aa0', T, 2); px(g, 0, 11, '#c8d8e8', T, 1);
  };
  t['ϼ'] = (g) => {
    floor(g);
    px(g, 6, 8, '#7a8aa0', 4, 7); px(g, 6, 8, '#c8d8e8', 1, 7);
    px(g, 3, 4, '#d83a3a', 10, 2); px(g, 7, 2, '#d83a3a', 2, 8); px(g, 4, 4, '#ff8a7a', 3, 1);
    px(g, 5, 14, '#4a5a70', 6, 1);
  };
}


// Generic gym kit: every gym theme gets the same four extra chars drawn in its own colours.
//   ϸ hazard (solid): liquid, hedge or planting bed   Ϲ walkway (walkable)   ϻ decorated wall (solid)   ϼ object (solid)
{
  type Kit = { haz: [string, string, string, string]; walk: [string, string, string, string]; wall: [string, string, string, string]; obj: [string, string, string, string] };
  const rim = (g, c) => { px(g, 0, 0, c, T, 1); px(g, 0, 0, c, 1, T); };
  const KITS: Record<string, Kit> = {
    gym_siniestro: { haz: ['liquid', '#1a1a26', '#2e2e42', '#c8506a'], walk: ['stone', '#3e3e4c', '#2a2a34', ''], wall: ['hooks', '#585870', '#8a8aa0', '#c8506a'], obj: ['crate', '#5a5a74', '#3a3a4e', '#c8506a'] },
    gym_psiquico: { haz: ['liquid', '#2a1a4a', '#4a3a7a', '#e8d8ff'], walk: ['stone', '#5a4a8a', '#3a2a6a', ''], wall: ['shelf', '#3a2a6a', '#c8506a', '#e8d8ff'], obj: ['barrel', '#6a3a9a', '#a878e0', '#e8d8ff'] },
    gym_lucha: { haz: ['liquid', '#7a2a2a', '#a84a3a', '#f8e0c0'], walk: ['stone', '#c8b070', '#a89050', ''], wall: ['pipe', '#7a2a2a', '#c8402a', '#f8e0c0'], obj: ['sandbag', '#c8b070', '#8a6a3a', '#f8e0c0'] },
    gym_planta: { haz: ['bed', '#6a4a2a', '#4aa03c', '#b8f090'], walk: ['stone', '#b8a878', '#8a7a58', ''], wall: ['shelf', '#2a5a2a', '#4aa03c', '#b8f090'], obj: ['barrel', '#8a5a30', '#c89058', '#f0d8a0'] },
    gym_roca: { haz: ['liquid', '#3f86c8', '#5aa0e0', '#bfe4ff'], walk: ['stone', '#9a9488', '#6a645a', ''], wall: ['pipe', '#4a4640', '#8a8478', '#bdb5a6'], obj: ['sandbag', '#8a8478', '#5a554c', '#bdb5a6'] },
    gym_volador: { haz: ['liquid', '#6aa0d8', '#8ac8f0', '#ffffff'], walk: ['stone', '#8a96a8', '#5a6678', '#f4faff'], wall: ['pipe', '#2a5a9a', '#8ac8f0', '#f4faff'], obj: ['engine', '#8aa0b8', '#4a6888', '#f4faff'] },
    gym_fuego: { haz: ['liquid', '#a83a1a', '#e8702a', '#ffd070'], walk: ['grate', '#4a3a3a', '#2a1a1a', '#8a6a5a'], wall: ['pipe', '#6a2a1a', '#a8502a', '#ffb040'], obj: ['barrel', '#a83a1a', '#e8702a', '#ffb040'] },
    gym_bicho: { haz: ['hedge', '#2f6a1a', '#4a8a2a', '#8ac83a'], walk: ['stone', '#b8a878', '#8a7a58', ''], wall: ['shelf', '#3a5a1a', '#6a9a2a', '#e8f090'], obj: ['barrel', '#7a5a2a', '#b88a4a', '#e8f090'] },
    gym_elec: { haz: ['liquid', '#23232e', '#3a4a6a', '#5ae0ff'], walk: ['grate', '#f2c02a', '#23232e', '#fff6a8'], wall: ['pipe', '#2c2d3a', '#5a5c70', '#5ae0ff'], obj: ['engine', '#454656', '#23232e', '#5ae0ff'] },
  };
  for (const [theme, k] of Object.entries(KITS)) {
    const t = (THEMES as any)[theme];
    if (!t) continue;
    const floor = t.Y;
    const [hk, ha, hb, hc] = k.haz, [wk, wa, wb, wc] = k.walk, [dk, da, db, dc] = k.wall, [ok, oa, ob, oc] = k.obj;
    t['ϸ'] = (g, r) => {
      px(g, 0, 0, ha, T, T);
      if (hk === 'liquid') { for (let i = 0; i < 5; i++) px(g, r.int(0, 12), r.int(1, 14), hb, r.int(3, 6), 1); for (let i = 0; i < 3; i++) px(g, r.int(0, 13), r.int(1, 14), hc, 2, 1); rim(g, '#00000040'); }
      else if (hk === 'hedge') { for (let i = 0; i < 9; i++) { const x = r.int(0, 12), y = r.int(0, 12); px(g, x, y, hb, 4, 3); px(g, x, y, hc, 2, 1); } px(g, 0, 14, '#00000050', T, 2); }
      else { px(g, 0, 0, '#3a2a18', T, T); px(g, 0, 0, ha, T, 14); for (let x = 1; x < 15; x += 4) { px(g, x, 4, hb, 3, 6); px(g, x + 1, 2, hc, 1, 3); } px(g, 0, 14, '#00000050', T, 2); }
    };
    t['Ϲ'] = (g, r) => {
      px(g, 0, 0, wa, T, T);
      if (wk === 'grate') { for (let x = 0; x < T; x += 4) px(g, x, 0, wb, 1, T); for (let y = 3; y < T; y += 4) px(g, 0, y, wb, T, 1); px(g, 0, 0, wc, T, 1); }
      else { for (let i = 0; i < 6; i++) px(g, r.int(0, 13), r.int(0, 13), wb, 3, 2); px(g, 0, 15, wb, T, 1); px(g, 15, 0, wb, 1, T); if (wc) { px(g, 2, 7, wc, 4, 1); px(g, 10, 7, wc, 4, 1); } }
    };
    t['ϻ'] = (g, r) => {
      if (t.x) t.x(g, r);
      if (dk === 'pipe') { px(g, 0, 3, da, T, 4); px(g, 0, 3, db, T, 1); px(g, 5, 2, dc, 2, 6); px(g, 12, 2, dc, 2, 6); px(g, 0, 11, da, T, 2); px(g, 0, 11, db, T, 1); }
      else if (dk === 'shelf') { px(g, 1, 1, da, 14, 9); for (let y = 1; y < 9; y += 4) { px(g, 1, y + 3, '#00000060', 14, 1); for (let x = 2; x < 14; x += 2) px(g, x, y + (x % 3), (x % 4 ? db : dc), 1, 3 - (x % 3)); } }
      else { px(g, 0, 2, db, T, 1); for (const x of [3, 8, 13]) { px(g, x, 3, db, 1, 4); px(g, x, 7, dc, 2, 1); px(g, x, 6, dc, 1, 3); } px(g, 0, 11, da, T, 2); }
    };
    t['ϼ'] = (g, r) => {
      floor(g, r);
      if (ok === 'crate') { px(g, 1, 3, ob, 14, 11); px(g, 2, 4, oa, 12, 9); px(g, 2, 8, ob, 12, 1); px(g, 7, 4, ob, 2, 9); px(g, 2, 4, oc, 3, 1); }
      else if (ok === 'barrel') { px(g, 3, 2, ob, 10, 13); px(g, 4, 3, oa, 8, 11); px(g, 3, 5, oc, 10, 1); px(g, 3, 11, oc, 10, 1); px(g, 5, 3, ob, 1, 11); }
      else if (ok === 'sandbag') { px(g, 1, 8, ob, 14, 6); px(g, 2, 9, oa, 12, 4); px(g, 3, 3, ob, 10, 6); px(g, 4, 4, oa, 8, 4); px(g, 7, 3, oc, 2, 1); }
      else { px(g, 2, 4, ob, 12, 9); px(g, 3, 5, oa, 10, 7); px(g, 1, 8, ob, 14, 2); px(g, 6, 2, oc, 4, 3); px(g, 7, 13, ob, 2, 2); }
      px(g, 2, 14, '#00000050', 12, 1);
    };
  }
}


// Museo del Anglo (gym): display cases with old tins and a bust on a pedestal, on the dark gym floor.
{
  const t = (THEMES as any).gym_siniestro;
  t['Ϯ'] = (g, r) => {
    t.Y(g, r);
    px(g, 2, 6, '#3a3a4e', 12, 9); px(g, 3, 4, '#8ac8f0', 10, 8); px(g, 3, 4, '#d8f0ff', 10, 1); px(g, 3, 4, '#d8f0ff', 1, 8);
    px(g, 6, 7, '#c8506a', 4, 4); px(g, 6, 6, '#e8e0f0', 4, 1); px(g, 7, 8, '#f2c02a', 2, 1); px(g, 2, 14, '#00000050', 12, 1);
  };
  t['ϯ'] = (g, r) => {
    t.Y(g, r);
    px(g, 3, 11, '#5a5a74', 10, 4); px(g, 3, 11, '#8a8aa0', 10, 1); px(g, 5, 10, '#3a3a4e', 6, 1);
    px(g, 6, 2, '#c8c8d8', 4, 6); px(g, 5, 8, '#c8c8d8', 6, 3); px(g, 6, 2, '#e8e8f4', 1, 6); px(g, 7, 4, '#3a3a4e', 1, 1); px(g, 9, 4, '#3a3a4e', 1, 1);
    px(g, 3, 14, '#00000050', 10, 1);
  };
}

// Frigorífico Anglo: a cold-storage plant (pale tiled floor, riveted steel walls, meat hooks) crossed by conveyor belts.
{
  const floor = (g) => { px(g, 0, 0, '#d4e0ea', T, T); px(g, 0, 15, '#aebfce', T, 1); px(g, 15, 0, '#aebfce', 1, T); px(g, 7, 0, '#c2d0dc', 1, T); px(g, 0, 7, '#c2d0dc', T, 1); px(g, 3, 3, '#e8f0f6', 2, 1); px(g, 10, 11, '#e8f0f6', 3, 1); };
  const wall = (g) => { px(g, 0, 0, '#6f8aa2', T, T); px(g, 0, 0, '#9cb6cc', T, 2); px(g, 0, 12, '#3e5468', T, 4); px(g, 0, 11, '#8aa6bc', T, 1); for (const x of [2, 7, 12]) { px(g, x, 4, '#4e667c', 2, 2); px(g, x, 8, '#4e667c', 2, 2); } px(g, 4, 2, '#e8f4fc', 3, 1); px(g, 10, 6, '#e8f4fc', 4, 1); };
  const A = ['...##...', '..####..', '.######.', '...##...', '...##...', '...##...', '...##...', '........'];
  const rot = { up: (x, y) => [x, y], right: (x, y) => [7 - y, x], down: (x, y) => [7 - x, 7 - y], left: (x, y) => [y, 7 - x] };
  const T_: any = (THEMES as any).frigorifico = {
    Y: floor,
    x: wall,
    X: (g) => { wall(g); px(g, 1, 2, '#2a6ab0', 15, 8); px(g, 1, 2, '#8ac8f0', 15, 1); px(g, 3, 5, '#f4faff', 2, 2); px(g, 6, 4, '#f4faff', 6, 1); px(g, 6, 7, '#f4faff', 6, 1); },
    Z: (g) => { wall(g); px(g, 0, 2, '#2a6ab0', 15, 8); px(g, 0, 2, '#8ac8f0', 15, 1); px(g, 3, 4, '#f4faff', 6, 1); px(g, 3, 7, '#f4faff', 6, 1); px(g, 11, 5, '#f4faff', 2, 2); },
    N: (g) => { floor(g); px(g, 2, 2, '#3e5468', 12, 13); px(g, 3, 3, '#8aa6bc', 10, 11); for (let y = 5; y < 13; y += 2) px(g, 4, y, '#3e5468', 8, 1); px(g, 11, 4, '#6ae0a0', 1, 1); },
    A: (g) => { px(g, 0, 0, '#8a3a3a', T, T); px(g, 1, 0, '#b85a5a', 1, T); px(g, 14, 0, '#b85a5a', 1, T); px(g, 5, 6, '#b85a5a', 6, 1); px(g, 5, 11, '#b85a5a', 6, 1); },
    m: (g) => { floor(g); px(g, 1, 3, '#2a2a32', 14, 10); px(g, 2, 4, '#3e3e48', 12, 8); for (let x = 3; x < 13; x += 2) px(g, x, 6, '#2a2a32', 1, 4); },
    'Ϲ': (g) => { px(g, 0, 0, '#8a96a4', T, T); px(g, 0, 0, '#f2c02a', T, 1); px(g, 0, 15, '#f2c02a', T, 1); px(g, 0, 0, '#f2c02a', 1, T); px(g, 15, 0, '#f2c02a', 1, T); for (let i = 3; i < 13; i += 4) { px(g, i, 4, '#aab4c0', 2, 2); px(g, i + 2, 9, '#aab4c0', 2, 2); } },
    'ϻ': (g) => { wall(g); px(g, 0, 1, '#1e2a36', T, 2); for (const x of [2, 9]) { px(g, x + 1, 3, '#aab4c0', 1, 2); px(g, x, 5, '#c85a5a', 4, 8); px(g, x + 1, 5, '#e8908a', 1, 6); px(g, x + 2, 9, '#a03a3a', 2, 4); } },
  };
  for (const [dir, ch] of [['up', 'Ϣ'], ['down', 'Ϥ'], ['left', 'Ϧ'], ['right', 'Ϩ']]) {
    T_[ch] = (g) => {
      px(g, 0, 0, '#454a54', T, T); px(g, 0, 0, '#6a707c', T, 1); px(g, 0, 15, '#2a2e36', T, 1);
      const horiz = dir === 'left' || dir === 'right';
      for (let i = 2; i < T; i += 4) horiz ? px(g, i, 1, '#5a606c', 1, 14) : px(g, 1, i, '#5a606c', 14, 1); // rollers
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (A[y][x] === '#') { const [rx, ry] = (rot as any)[dir](x, y); px(g, rx * 2, ry * 2, '#f2c02a', 2, 2); px(g, rx * 2, ry * 2 + 1, '#b88a10', 2, 1); }
    };
  }
}

// Interior cabin / ship door: a wooden door set in the panelled wall.
DRAW['Ϫ'] = (g) => {
  px(g, 0, 0, '#7a5a3a', T, T); px(g, 0, 0, '#9a7a56', T, 1);
  px(g, 2, 1, '#3e2a18', 12, 15); px(g, 3, 2, '#8a5a30', 10, 14); px(g, 3, 2, '#a8723c', 10, 1);
  px(g, 5, 4, '#bfe4ff', 6, 4); px(g, 5, 4, '#e8f6ff', 6, 1); px(g, 8, 4, '#3e2a18', 1, 4);
  px(g, 10, 10, '#f2c02a', 2, 2); px(g, 0, 15, '#4a3220', T, 1);
};

// Ship interiors and decks ("barco" theme): teak planking, white painted steel with portholes. Furniture keeps its default
// drawing but stands on teak (the default floor is swapped while it is drawn).
{
  const teak = (g, r) => { px(g, 0, 0, '#c4925a', T, T); for (let y = 0; y < T; y += 5) px(g, 0, y, '#8a6238', T, 1); px(g, 0, 1, '#d8a870', T, 1); px(g, r ? r.int(2, 13) : 6, 2, '#8a6238', 1, 3); };
  const steel = (g) => { px(g, 0, 0, '#eef3f7', T, T); px(g, 0, 11, '#2a5a9a', T, 2); px(g, 0, 13, '#c8d4de', T, 3); px(g, 0, 10, '#9aa8b8', T, 1); for (const x of [2, 7, 12]) px(g, x, 4, '#c0ccd8', 2, 1); };
  const on = (ch) => (g, r, f) => { const i0 = DRAW.i, x0 = DRAW.x; DRAW.i = teak; DRAW.x = steel; try { DRAW[ch](g, r, f); } finally { DRAW.i = i0; DRAW.x = x0; } };
  const B_: any = (THEMES as any).barco = { i: teak, x: steel };
  for (const ch of ['T', 'n', 'm', 'E', 'N', 'B', 'P', 'X']) B_[ch] = on(ch);
  B_.X = (g) => { steel(g); px(g, 3, 1, '#8a96a4', 10, 10); px(g, 4, 2, '#2a3a5a', 8, 8); px(g, 5, 3, '#8ac8f0', 6, 6); px(g, 5, 3, '#d8f0ff', 6, 1); px(g, 3, 1, '#c8d4de', 10, 1); };
  B_.F = (g, r, f) => { DRAW['~'](g, r, f); px(g, 0, 7, '#f4f8fc', T, 2); px(g, 0, 9, '#9aa8b8', T, 1); for (const x of [1, 7, 13]) { px(g, x, 3, '#f4f8fc', 2, 10); px(g, x, 3, '#ffffff', 1, 10); } };
}
DRAW['Ϭ'] = (g, r) => {
  const t = (THEMES as any).barco.i; t(g, r);
  px(g, 1, 5, '#2a3a5a', 14, 8); px(g, 2, 4, '#f08a2a', 12, 8); px(g, 2, 4, '#ffb060', 12, 2); px(g, 2, 9, '#c86a1a', 12, 3);
  px(g, 3, 6, '#f4f8fc', 3, 2); px(g, 10, 6, '#f4f8fc', 3, 2); px(g, 1, 12, '#00000040', 14, 2);
};
DRAW['ϭ'] = (g, r) => {
  (THEMES as any).barco.i(g, r);
  px(g, 3, 3, '#2a3a5a', 10, 10); px(g, 4, 2, '#d83a3a', 8, 12); px(g, 3, 4, '#d83a3a', 10, 8);
  px(g, 6, 5, '#eef3f7', 4, 6); px(g, 5, 6, '#eef3f7', 6, 4); px(g, 7, 7, '#2a3a5a', 2, 2);
  px(g, 4, 6, '#f4f8fc', 2, 2); px(g, 10, 8, '#f4f8fc', 2, 2);
};

// The Buquebus "China Zorrilla": a 12x3-tile ship (bow to the left) drawn once and sliced into tiles over animated water.
export const SHIP_W = 12, SHIP_H = 3, SHIP_BASE = 0xe400;
export const shipChar = (ix: number, iy: number) => String.fromCharCode(SHIP_BASE + iy * SHIP_W + ix);
let shipArt: HTMLCanvasElement | null = null;
function drawShip() {
  const c = document.createElement('canvas');
  c.width = SHIP_W * T; c.height = SHIP_H * T;
  const g = c.getContext('2d')!;
  const top = (x) => (x < 30 ? 28 - Math.floor((30 - x) * 0.25) : 28);
  const bot = (x) => (x < 30 ? 42 - Math.floor((30 - x) * 0.5) : x > 182 ? 42 - (x - 182) : 42);
  for (let x = 4; x < 190; x++) {
    px(g, x, top(x), '#e8eef4', 1, bot(x) - top(x));
    px(g, x, bot(x) - 5, '#2a3a5a', 1, 5);                // dark lower hull
    px(g, x, bot(x) - 6, '#c83a3a', 1, 1);                // waterline stripe
    px(g, x, top(x), '#c8a060', 1, 3);                    // wooden rail along the deck
    if (x % 9 === 0) px(g, x, top(x) + 5, '#2a3550', 3, 2); // portholes
  }
  px(g, 4, top(4) + 1, '#1a1a2a', 2, 8);
  const tier = (x1, x2, y1, y2, glass) => { px(g, x1, y1, '#f4f8fc', x2 - x1, y2 - y1); px(g, x1, y1, '#9aa8bc', x2 - x1, 1); px(g, x1, y2 - 1, '#b8c4d4', x2 - x1, 1); for (let x = x1 + 3; x < x2 - 4; x += 7) px(g, x, y1 + 3, glass, 4, 3); };
  tier(40, 172, 18, 28, '#2a3550');
  tier(58, 150, 10, 18, '#2a3550');
  tier(82, 128, 4, 10, '#5a9ad8');
  for (const x of [128, 140]) { px(g, x, 0, '#1a1a24', 10, 3); px(g, x, 3, '#e89a20', 10, 7); px(g, x + 1, 3, '#f8c050', 2, 7); px(g, x, 9, '#b06a10', 10, 1); }  // funnels sit on the middle superstructure
  px(g, 62, 7, '#d8dce8', 10, 3); px(g, 64, 8, '#5a9ad8', 6, 1);  // lifeboat / radar plate on the bridge deck
  px(g, 92, 0, '#9aa8bc', 1, 4); px(g, 90, 1, '#d8dce8', 5, 1);   // mast
  return c;
}
for (let iy = 0; iy < SHIP_H; iy++) for (let ix = 0; ix < SHIP_W; ix++) {
  const ch = shipChar(ix, iy);
  TILE_INFO[ch] = { name: 'Buquebus China Zorrilla', solid: true, anim: true };
  DRAW[ch] = (g, r, f) => {
    DRAW['~'](g, r, f);
    shipArt ??= drawShip();
    g.drawImage(shipArt, ix * T, iy * T, T, T, 0, 0, T, T);
  };
}

// Shopping mall lift: steel double doors with a floor indicator, set in the wall.
Object.assign(DRAW, {
  'Ͽ': (g) => {
    px(g, 0, 0, '#6a6662', T, T); px(g, 0, 0, '#8a8680', T, 1);
    px(g, 1, 3, '#3a3a44', 14, 13); px(g, 2, 4, '#9aa6b4', 6, 12); px(g, 8, 4, '#8a96a4', 6, 12); px(g, 8, 4, '#3a3a44', 1, 12);
    px(g, 3, 5, '#c8d4e0', 1, 9); px(g, 9, 5, '#b8c4d0', 1, 9);
    px(g, 5, 1, '#1a1a24', 6, 2); px(g, 7, 1, '#ff8a3a', 2, 1);
  },
});

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
(THEMES as any).ciudad = {
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
(THEMES as any).cueva = {
  '.': caveFloor,
  ',': (g, r) => { caveFloor(g, r); for (let i = 0; i < 7; i++) { const x = r.int(1, 12), y = r.int(1, 12); px(g, x, y, '#3e3a46', 3, 2); px(g, x, y, '#6e6a78', 2, 1); } },
  '=': (g, r) => speckle(g, r, '#8a8294', ['#7e768a', '#968ea0', '#74707e'], 12),
  '#': caveWall,
  q: caveWall,
  F: caveWall,
  f: (g, r) => { caveFloor(g, r); g.fillStyle = '#7ad8f0'; g.beginPath(); g.moveTo(8, 3); g.lineTo(11, 12); g.lineTo(5, 12); g.fill(); g.fillStyle = '#c8f4ff'; g.beginPath(); g.moveTo(8, 3); g.lineTo(9, 8); g.lineTo(7, 8); g.fill(); px(g, 3, 12, '#2a8aa8', 10, 1); },
  S: (g) => { caveFloor(g, new Rng(5)); px(g, 7, 7, '#5a3a1a', 2, 8); px(g, 2, 2, '#5a3a1a', 12, 7); px(g, 3, 3, '#c8905a', 10, 5); px(g, 4, 4, '#7a4a2a', 8, 1); px(g, 4, 6, '#7a4a2a', 6, 1); },
};



// Dense forest: a dark leafy floor and a canopy that fills the whole tile, so the trees read as a wall, not as scattered plants.
const forestFloor = (g, r) => speckle(g, r, '#4f8a3a', ['#477f34', '#5a9644', '#3f742e', '#6a7a3a'], 18);
const canopy = (g, r) => {
  px(g, 0, 0, '#1b4026', T, T);
  for (let i = 0; i < 4; i++) {
    const x = r.int(-1, 9), y = r.int(-1, 9), w = r.int(6, 9);
    px(g, x + 1, y, '#256336', w - 2, w); px(g, x, y + 1, '#256336', w, w - 2);
    px(g, x + 1, y + 1, '#37823f', w - 3, 2); px(g, x + 1, y + 1, '#37823f', 2, w - 3);
    px(g, x + 2, y + 2, '#58a850', 2, 1);
    px(g, x + 2, y + w - 1, '#16341f', w - 3, 1);
  }
  for (let i = 0; i < 6; i++) px(g, r.int(0, 15), r.int(0, 15), '#14301c', 2, 1);
};
(THEMES as any).bosque = {
  '.': forestFloor,
  ',': (g, r) => { forestFloor(g, r); for (let i = 0; i < 6; i++) { const x = r.int(0, 13), y = r.int(2, 13); px(g, x, y, '#2f7a34', 1, 3); px(g, x + 1, y - 1, '#3f9a42', 1, 3); px(g, x + 2, y + 1, '#2a6a30', 1, 2); } },
  '=': (g, r) => speckle(g, r, '#9a7a4a', ['#8a6c40', '#aa8a58', '#7e6238'], 12),
  '#': canopy,
  q: canopy,
};

// Cave rock is drawn from above and from the front: 'ϴ' is the dark mass of rock, 'ϳ' the lit face of a wall with
// floor in front of it (strata, cracks and a jagged foot), 'ϵ' the floor in the shade right below that face.
const rockMass = (g, r) => {
  px(g, 0, 0, '#2a2632', T, T);
  for (let i = 0; i < 5; i++) { const x = r.int(0, 11), y = r.int(0, 11), w = r.int(3, 6), h = r.int(2, 4); px(g, x, y, '#36323f', w, h); px(g, x + 1, y, '#403b4a', w - 2, 1); }
  for (let i = 0; i < 4; i++) px(g, r.int(0, 15), r.int(0, 15), '#221f29', 2, 1);
};
const rockFace = (g, r) => {
  rockMass(g, r);
  px(g, 0, 0, '#46414f', T, 3); px(g, 0, 0, '#6a6478', T, 1); // lit upper lip
  px(g, 0, 3, '#5d586a', T, 10);
  for (let x = 0; x < T; x += r.int(3, 5)) px(g, x, 3, '#4b4658', 1, r.int(7, 10)); // vertical cracks
  for (let i = 0; i < 4; i++) px(g, r.int(0, 12), r.int(4, 11), '#736d82', r.int(2, 4), 1); // strata highlights
  px(g, 0, 13, '#3a3646', T, 2);
  for (let x = 0; x < T; x += 2) px(g, x, 13 + r.int(0, 1), '#2a2632', 2, 2); // jagged foot
  px(g, 0, 15, '#17151c', T, 1);
};
(THEMES as any).cueva['ϴ'] = rockMass;
(THEMES as any).cueva['ϳ'] = rockFace;
(THEMES as any).cueva['ϵ'] = (g, r) => { caveFloor(g, r); px(g, 0, 0, '#46424e', T, 3); px(g, 0, 3, '#504b58', T, 2); px(g, 0, 5, '#565160', T, 1); };


// ---- autotiled cave rock and forest walls: each wall tile is drawn for the sides that face open ground ----
// Wall chars live in the Unicode private-use area: 0xE000 + kind * 64 + variant * 16 + mask, where mask bits are the
// open sides (1 north, 2 east, 4 south, 8 west). Floors: 0xE080 + kind * 8 + (0, 1 = variants, 2 = shaded under a wall).
export const wallChar = (kind: 'cave' | 'forest', mask: number, variant: number) => String.fromCharCode(0xE000 + (kind === 'cave' ? 0 : 64) + variant * 16 + mask);
export const floorChar = (kind: 'cave' | 'forest', which: number) => String.fromCharCode(0xE080 + (kind === 'cave' ? 0 : 8) + which);

const hidden = (ch: string, name: string, solid: boolean) => Object.defineProperty(TILE_INFO, ch, { value: { name, solid }, enumerable: false, configurable: true });
const rockTile = (mask: number, v: number) => (g, r) => {
  caveFloor(g, r);
  const N = mask & 1, E = mask & 2, S = mask & 4, Wd = mask & 8;
  const x0 = Wd ? 2 : 0, x1 = E ? 14 : 16, y0 = N ? 2 : 0, y1 = S ? 14 : 16;
  px(g, x0, y0, '#2a2632', x1 - x0, y1 - y0);
  for (let i = 0; i < 5; i++) { const w = r.int(3, 6), h = r.int(2, 4), x = r.int(x0, Math.max(x0, x1 - w)), y = r.int(y0, Math.max(y0, y1 - h)); px(g, x, y, '#36323f', Math.min(w, x1 - x), Math.min(h, y1 - y)); px(g, x + 1, y, '#403b4a', Math.max(0, Math.min(w, x1 - x) - 2), 1); }
  for (let i = 0; i < 3 + v; i++) px(g, r.int(x0, x1 - 2), r.int(y0, y1 - 1), '#221f29', 2, 1);
  if (N) { px(g, x0, 1, '#6a6478', x1 - x0, 1); px(g, x0, 2, '#4a4558', x1 - x0, 1); }
  if (Wd) { px(g, 1, y0, '#5a5568', 1, y1 - y0); px(g, 2, y0, '#3f3b4a', 1, y1 - y0); }
  if (E) { px(g, 14, y0, '#1e1b24', 1, y1 - y0); px(g, 13, y0, '#33303c', 1, y1 - y0); }
  if (S) {
    px(g, x0, y1 - 9, '#5d586a', x1 - x0, 7); px(g, x0, y1 - 9, '#6a6478', x1 - x0, 1);
    for (let x = x0 + 1; x < x1; x += r.int(3, 5)) px(g, x, y1 - 8, '#4b4658', 1, r.int(4, 6));
    for (let i = 0; i < 3; i++) px(g, r.int(x0, Math.max(x0, x1 - 4)), y1 - r.int(3, 8), '#736d82', r.int(2, 4), 1);
    px(g, x0, y1 - 2, '#3a3646', x1 - x0, 2);
    for (let x = x0; x < x1; x += 2) px(g, x, y1 - 2 + r.int(0, 1), '#2a2632', 2, 1);
    px(g, x0, y1, '#17151c', x1 - x0, 2);
  }
  // rounded corners where two open sides meet
  const floorC = '#5a5560';
  if (N && Wd) { px(g, 0, 0, floorC, 2, 2); px(g, 2, 2, '#4a4558'); }
  if (N && E) { px(g, 14, 0, floorC, 2, 2); }
  if (S && Wd) { px(g, 0, 14, floorC, 2, 2); }
  if (S && E) { px(g, 14, 14, floorC, 2, 2); }
};
const leafTile = (mask: number, v: number) => (g, r) => {
  forestFloor(g, r);
  const N = mask & 1, E = mask & 2, S = mask & 4, Wd = mask & 8;
  const x0 = Wd ? 1 : 0, x1 = E ? 15 : 16, y0 = N ? 1 : 0, y1 = S ? 11 : 16;
  px(g, x0, y0, '#1b4026', x1 - x0, y1 - y0);
  for (let i = 0; i < 4; i++) {
    const w = r.int(6, 9), x = r.int(x0 - 2, x1 - w + 2), y = r.int(y0 - 2, Math.max(y0, y1 - w) + 1);
    const cx = Math.max(x0, x), cy = Math.max(y0, y), cw = Math.min(x + w, x1) - cx, ch = Math.min(y + w, y1) - cy;
    if (cw <= 2 || ch <= 2) continue;
    px(g, cx, cy, '#256336', cw, ch); px(g, cx, cy, '#37823f', Math.max(1, cw - 2), 2); px(g, cx, cy, '#37823f', 2, Math.max(1, ch - 2)); px(g, cx + 2, cy + 2, '#58a850', 2, 1); px(g, cx + 1, cy + ch - 1, '#16341f', Math.max(1, cw - 2), 1);
  }
  for (let i = 0; i < 4 + v; i++) px(g, r.int(x0, x1 - 2), r.int(y0, y1 - 1), '#14301c', 2, 1);
  // scalloped silhouette on the sides that face open ground
  const bump = (cx, cy, rad) => { px(g, cx - rad, cy - 1, '#256336', rad * 2, 3); px(g, cx - 1, cy - rad, '#256336', 3, rad * 2); px(g, cx - rad + 1, cy - rad + 1, '#37823f', 2, 1); };
  if (N) for (const cx of [3, 8, 13]) bump(cx + r.int(-1, 1), 1, 3);
  if (S) for (const cx of [3, 8, 13]) bump(cx + r.int(-1, 1), 11, 3);
  if (Wd) for (const cy of [3, 8, 13]) bump(1, cy + r.int(-1, 1), 3);
  if (E) for (const cy of [3, 8, 13]) bump(15, cy + r.int(-1, 1), 3);
  if (S) { // trunks under the canopy
    px(g, 0, 11, '#16341f', 16, 1);
    for (const tx of [3, 10]) { px(g, tx + r.int(0, 2), 12, '#5a3a1a', 2, 4); px(g, tx + 1, 12, '#7a5028', 1, 4); }
  }
};
for (let v = 0; v < 3; v++) for (let mask = 0; mask < 16; mask++) {
  const cc = wallChar('cave', mask, v), fc = wallChar('forest', mask, v);
  (THEMES as any).cueva[cc] = rockTile(mask, v); hidden(cc, 'pared de roca', true);
  (THEMES as any).bosque[fc] = leafTile(mask, v); hidden(fc, 'monte espeso', true);
}
for (const [kind, set, base] of [['cave', (THEMES as any).cueva, caveFloor], ['forest', (THEMES as any).bosque, forestFloor]] as const) {
  const c0 = floorChar(kind, 0), c1 = floorChar(kind, 1), c2 = floorChar(kind, 2);
  set[c0] = (g, r) => { base(g, r); for (let i = 0; i < 3; i++) { const x = r.int(2, 11), y = r.int(2, 11); px(g, x, y, kind === 'cave' ? '#3e3a46' : '#3a6a2a', 3, 2); px(g, x, y, kind === 'cave' ? '#6e6a78' : '#6aa84a', 2, 1); } };
  set[c1] = (g, r) => { base(g, r); for (let i = 0; i < 4; i++) { const x = r.int(1, 13), y = r.int(1, 13); if (kind === 'cave') { px(g, x, y, '#4a4650', 2, 1); } else { px(g, x, y, '#8a6a3a', 2, 1); px(g, x + 1, y + 1, '#a8864a', 1, 1); } } };
  set[c2] = (g, r) => { base(g, r); px(g, 0, 0, kind === 'cave' ? '#46424e' : '#2f5a2a', T, 3); px(g, 0, 3, kind === 'cave' ? '#504b58' : '#3a6e32', T, 2); px(g, 0, 5, kind === 'cave' ? '#565160' : '#437a3a', T, 1); };
  for (const c of [c0, c1, c2]) hidden(c, kind === 'cave' ? 'suelo de cueva' : 'suelo de monte', false);
}
// cave dressing: a puddle and moss/bones on the floor (walkable), and a stalagmite and a crystal cluster (solid)
{
  const cv = (THEMES as any).cueva;
  const [puddle, litter, stalag, crystal] = [3, 4, 5, 6].map((k) => floorChar('cave', k));
  cv[puddle] = (g, r) => { caveFloor(g, r); const x = r.int(2, 5), y = r.int(4, 8); px(g, x, y, '#2a3a52', 8, 4); px(g, x + 1, y - 1, '#2a3a52', 6, 1); px(g, x + 1, y + 4, '#2a3a52', 6, 1); px(g, x + 1, y + 1, '#4a6a8e', 4, 1); px(g, x + 5, y + 2, '#6a8eb0', 2, 1); };
  cv[litter] = (g, r) => { caveFloor(g, r); for (let i = 0; i < 3; i++) { const x = r.int(1, 12), y = r.int(2, 12); px(g, x, y, '#3a6a4a', 3, 2); px(g, x + 1, y, '#5a9a62', 1, 1); } const bx = r.int(2, 9), by = r.int(9, 12); px(g, bx, by, '#d8d0b8', 4, 1); px(g, bx + 3, by - 1, '#d8d0b8', 1, 3); px(g, bx, by + 1, '#b0a890', 2, 1); };
  cv[stalag] = (g, r) => { caveFloor(g, r); px(g, 3, 12, '#1c1a22', 10, 2); px(g, 4, 9, '#5a5566', 8, 4); px(g, 5, 6, '#6a6576', 6, 4); px(g, 6, 3, '#7a7586', 4, 4); px(g, 7, 1, '#8a8596', 2, 3); px(g, 4, 9, '#3e3a48', 2, 4); px(g, 6, 3, '#4e4a58', 1, 5); };
  cv[crystal] = (g, r) => { caveFloor(g, r); px(g, 3, 13, '#1c1a22', 11, 2); for (const [x, h, c] of [[4, 6, '#5ab8d8'], [7, 10, '#7ad8f0'], [10, 7, '#5ab8d8']] as const) { px(g, x, 13 - h, c, 3, h); px(g, x + 1, 12 - h, c, 1, 1); px(g, x, 13 - h, '#c8f4ff', 1, h - 1); px(g, x + 2, 14 - h, '#2e7a9a', 1, h - 1); } };
  hidden(puddle, 'charco', false); hidden(litter, 'suelo de cueva', false);
  hidden(stalag, 'estalagmita', true); hidden(crystal, 'cristales', true);
}

// a waterfall pouring down a rock face; climbed with the soga (see world.ts)
(THEMES as any).cueva['Ϡ'] = (g, r, f = 0) => {
  px(g, 0, 0, '#2e2a36', T, T); px(g, 0, 0, '#44404e', 2, T); px(g, 14, 0, '#44404e', 2, T);
  px(g, 2, 0, '#3f7fb8', 12, T);
  for (const [x, o] of [[3, 0], [6, 5], [9, 2], [12, 8]] as const) for (let y = (o + f * 4) % 16 - 16; y < T; y += 11) { px(g, x, y, '#bfe8fa', 1, 5); px(g, x + 1, y + 2, '#7ab8e0', 1, 4); }
  px(g, 2, 0, '#2a5f94', 1, T); px(g, 13, 0, '#2a5f94', 1, T);
};
DRAW['Ϡ'] = (THEMES as any).cueva['Ϡ'];

/** Objects standing in the water (boats, rocks, willows...) are drawn over water, not over grass. */
const LAND_BASE = new Set(['~', '.', ',', 'f', '=', 'c', 's', 'b', '}']);
export function sitsInWater(tiles, x, y) {
  const ch = tiles[y][x];
  if (LAND_BASE.has(ch)) return false;
  let n = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (tiles[y + dy]?.[x + dx] === '~') n++;
  return n >= 3 || (n >= 2 && (TILE_INFO[ch]?.over || ch === 'R'));
}

/** Ground tiles an object may stand on, besides grass, and what they are called when counting neighbours. */
const BASES = { s: 's', '=': '=', c: 'c', '_': '_', '?': '?', '0': '0', '-': '0', ':': '0', '/': '0', '`': '`', b: 'b' };
/**
 * What an object tile stands on: '~' (water), a ground char ('s' sand, '=' path, 'c' cobbles, '_' pavement,
 * '0' asphalt, '`' ash) or false for the usual grass. Objects are drawn transparent over that ground, so the same
 * sprite works on grass, sand, a path, the shore of a lake...
 */
export function groundUnder(tiles, x, y): string | boolean {
  const ch0 = tiles[y][x];
  if (TILE_INFO[ch0]?.over) { // an object on a boardwalk stands on planks, even at the edge of the pier
    let planks = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && tiles[y + dy]?.[x + dx] === 'b') planks++;
    if (planks >= 3) return 'b';
  }
  if (sitsInWater(tiles, x, y)) return '~';
  const ch = tiles[y][x];
  if (!TILE_INFO[ch]?.over) return false;
  const count: Record<string, number> = {};
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const n = tiles[y + dy]?.[x + dx];
    const b = n === undefined ? null : BASES[n];
    if (b) count[b] = (count[b] ?? 0) + 1;
  }
  let best: string | false = false, top = 3; // at least 3 of the 8 neighbours, otherwise grass
  for (const [b, c] of Object.entries(count)) if (c >= top) { best = b; top = c; }
  return best;
}

/**
 * Like groundUnder, but a map can choose its own base ground (`ground` in the map editor: sand, path...).
 * It only changes objects (trees, bushes, rocks...) and drawings with see-through parts; plain ground tiles stay as they are.
 */
export function groundFor(tiles, x: number, y: number, ground?: string | null, theme?: string | null): string | boolean {
  const u = groundUnder(tiles, x, y);
  if (u || theme || !ground || ground === 'auto' || !TILE_INFO[ground]) return u;
  const ch = tiles[y][x];
  if (TILE_INFO[ch]?.over || overrideHasHoles(`tile:${ch}0`)) return ground === '.' ? false : ground;
  return u;
}

/** under: false (grass / theme floor), true or '~' (water) or a ground char from BASES (see groundUnder). */
// Map pieces made in the sprite editor start as grass; the drawing comes from the overrides.
for (const t of CUSTOM.tiles) {
  (TILE_INFO as any)[t.ch] = { name: t.name, solid: !!t.solid };
  (DRAW as any)[t.ch] = (g, r) => grass(g, r);
}

/** Registers a piece made in the sprite editor that is not in the deployed game yet (map editor preview). */
export function registerCustomTile(ch: string, name: string, solid = false) {
  if ((TILE_INFO as any)[ch]) return;
  (TILE_INFO as any)[ch] = { name, solid };
  (DRAW as any)[ch] = (g, r) => grass(g, r);
}

export function tileCanvas(ch, frame = 0, theme: string | null = null, under: string | boolean = false) {
  const info = TILE_INFO[ch];
  const f = info?.anim ? frame % 4 : 0;
  const set = theme ? THEMES[theme] : null;
  const f0 = info?.anim ? frame % 4 : 0;
  const onWater = under === true || under === '~';
  const base = !set && typeof under === 'string' && under !== '~' && DRAW[under] ? under : null;
  const ground = onWater ? (g, r) => DRAW['~'](g, r, f0) : base ? (g, r) => DRAW[base](g, r, 0) : (set?.['.'] ?? null);
  const draw = set?.[ch] || null;
  const themed = draw || (ground && (DRAW[ch] || OVER[ch])) || onWater;
  const key = (themed ? `${theme}|` : '') + (onWater ? 'w|' : base ? `${base}|` : '') + ch + f;
  let dk = override(`tile:${key}`, T, T) ? `tile:${key}` : null;
  // A drawing with see-through parts made for the plain tile also works on sand, a path, the water or a
  // themed floor (unless the theme draws its own version of this tile).
  if (!dk && !draw && key !== ch + f && overrideHasHoles(`tile:${ch}${f}`) && override(`tile:${ch}${f}`, T, T)) dk = `tile:${ch}${f}`;
  if (dk) {
    if (!overrideHasHoles(dk)) return override(dk, T, T);
    const floor = typeof under === 'string' && under !== '~' && TILE_INFO[under] ? under : null;
    return onBaseTile(dk, ch, frame, theme, onWater ? '~' : floor);
  }
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

// ---- hand-drawn tiles with see-through parts (trees, bushes, objects drawn without their ground) ----
/**
 * Ground choices for a drawing with transparency (the editor's "Fondo"): 'auto' is the map's ground (grass,
 * or sand / path / water when the tile stands on them), any other value is the tile drawn underneath.
 */
export const TILE_BACKGROUNDS: [string, string][] = [
  ['auto', 'Automático (el suelo del mapa)'], ['.', 'Pasto'], [',', 'Pastizal'], ['f', 'Flores'], ['=', 'Camino'], ['s', 'Arena'],
  ['c', 'Adoquines'], ['_', 'Vereda'], ['0', 'Asfalto'], ['`', 'Ceniza'], ['b', 'Puente'], ['~', 'Agua'],
];
const composedTiles = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();
let composing = 0;
/** The ground tile a drawing with transparency is drawn over: its chosen `bg`, else the map's ground. */
export function backgroundOf(bg: string | undefined, floor: string | null = null) {
  return bg && bg !== 'auto' && TILE_INFO[bg] ? bg : floor ?? '.';
}
function onBaseTile(dk: string, ch: string, frame: number, theme: string | null, floor: string | null) {
  const drawn = override(dk, T, T);
  const bgCh = backgroundOf(overrideEntry(dk)?.bg, floor);
  const bf = TILE_INFO[bgCh]?.anim ? frame % 4 : 0;
  let byKey = composedTiles.get(drawn);
  if (!byKey) { byKey = new Map(); composedTiles.set(drawn, byKey); }
  const k = `${theme ?? ''}|${bgCh}|${bf}`;
  let c = byKey.get(k);
  if (c) return c;
  c = mk();
  const g = c.getContext('2d');
  // The ground itself may be a drawing; a tile drawn over itself (or a ground with holes) uses the generated art.
  const ground = () => tileCanvas(bgCh, bf, theme);
  composing++;
  try { g.drawImage(bgCh === ch || composing > 1 ? generated(ground) : ground(), 0, 0); } finally { composing--; }
  g.drawImage(drawn, 0, 0);
  byKey.set(k, c);
  return c;
}

/**
 * The generated art of a tile without its ground (grass or the theme's floor stay empty), for the editor's
 * "Quitar fondo". Tiles that paint their own ground (sand, paths...) come out whole.
 */
export function tileWithoutGround(ch: string, frame = 0, theme: string | null = null) {
  const set = theme ? THEMES[theme] : null;
  const draw = set?.[ch] || null;
  const f = TILE_INFO[ch]?.anim ? frame % 4 : 0;
  const c = mk();
  const g = c.getContext('2d');
  const scratch = mk().getContext('2d');
  // the ground is still drawn (off-screen) so the random numbers, and so the shapes, match the original
  const floor = set?.['.'] ?? ((gg, r) => speckle(gg, r, '#78c850', ['#68b040', '#88d860', '#60a83c'], 14));
  GROUND = (_g, r) => floor(scratch, r);
  try {
    const rng = new Rng(ch.charCodeAt(0) * 97 + 13);
    if (!draw && !DRAW[ch] && OVER[ch]) OVER[ch](g, rng, f);
    else (draw ?? DRAW[ch] ?? DRAW.O)(g, rng, f);
  } finally { GROUND = null; }
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
