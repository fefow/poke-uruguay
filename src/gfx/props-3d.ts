// Objetos low-poly del mundo 3D: lo que antes quedaba como cartel pixel art (faroles, macetas, cerros, árboles
// sueltos, molinos, botes, el Buquebus...) se arma acá con piezas simples, con los colores de su dibujo 2D.
// Mismo estilo que los árboles y las palmeras de world-3d.ts: geometrías de pocas caras, pintadas por vértice con
// un leve temblor de color (paint), apoyadas en el suelo del casillero (at suma la altura del terreno).
// Cada generador devuelve false si en ese lugar no le toca (entonces world-3d.ts deja el cartel pixel art).
import * as THREE from 'three';
import { paint, at, box, rnd } from './world-3d.ts';
import { TILE_INFO, SHIP_W, SHIP_H, SHIP_BASE } from './tiles.ts';

export interface PropCtx {
  parts: THREE.BufferGeometry[];
  /** piezas que brillan solas (llamas, lámparas, magma) */
  glow: THREE.BufferGeometry[];
  /** láminas de agua que ondulan (bajo el Buquebus) */
  water: THREE.BufferGeometry[];
  x: number; y: number;
  ch: (x: number, y: number) => string | null;
  /** filas de edificio justo debajo (más adelante en el mapa) del casillero */
  bldBelow: (x: number, y: number) => number;
  /** alto de una fila de fachada */
  facadeH: number;
  /** una luz cálida (farol, fogón) */
  lamp: (x: number, y: number, z: number, color: number, always: boolean) => void;
}
type Gen = (c: PropCtx) => boolean | void;

const C = (h: number) => new THREE.Color(h);
/** Pieza pintada de un color, puesta en (x, y, z) del mundo. */
const put = (list: THREE.BufferGeometry[], g: THREE.BufferGeometry, x: number, y: number, z: number, col: number, jitter = 0.06, seed = 0, ry = 0) =>
  list.push(paint(at(g, x, y, z, ry), C(col), jitter, seed));
const cyl = (rt: number, rb: number, h: number, seg = 6) => new THREE.CylinderGeometry(rt, rb, h, seg);
const cone = (r: number, h: number, seg = 6) => new THREE.ConeGeometry(r, h, seg);
const ico = (r: number) => new THREE.IcosahedronGeometry(r, 0);
const oct = (r: number) => new THREE.OctahedronGeometry(r, 0);
const dod = (r: number) => new THREE.DodecahedronGeometry(r, 0);
const sph = (r: number, w = 7, h = 5) => new THREE.SphereGeometry(r, w, h);
/** Triángulo de dos caras (velas, banderines). */
function tri2(a: number[], b: number[], c: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...b], 3));
  return g;
}
/** Planta (en x, z) levantada en y de 0 a h: cascos de barco. */
function prism(pts: number[][], h: number) {
  const sh = new THREE.Shape();
  pts.forEach(([px, pz], i) => (i ? sh.lineTo(px, -pz) : sh.moveTo(px, -pz)));
  sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }).rotateX(-Math.PI / 2);
}

export const PROPS_3D: Record<string, Gen> = {};
const def = (chars: string, g: Gen) => { for (const c of chars) PROPS_3D[c] = g; };

// ---------------------------------------------------------------- naturaleza
// Cerro: un cono de piedra con la punta nevada; muchos juntos arman la sierra.
function hill(p: THREE.BufferGeometry[], x: number, y: number, h: number) {
  const r = 0.72 + rnd(x, y, 2) * 0.12, ry = rnd(x, y, 5) * 6;
  const ox = x + 0.5 + (rnd(x, y, 3) - 0.5) * 0.2, oz = y + 0.5 + (rnd(x, y, 4) - 0.5) * 0.2;
  put(p, cone(r, h), ox, h / 2, oz, 0x8c8c96, 0.14, x + y, ry);
  const k = 0.28;
  put(p, cone(r * k * 1.05, h * k), ox, h - (h * k) / 2 + 0.005, oz, 0xf2f2f8, 0.04, x, ry);
}
def('μ', ({ parts, x, y }) => hill(parts, x, y, 1.1 + rnd(x, y, 1) * 0.7));

// Sauce: copa redonda con ramas que cuelgan.
def('ñ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5, s = 0.9 + rnd(x, y, 1) * 0.2;
  put(parts, cyl(0.08, 0.12, 0.75 * s, 5), cx, 0.37 * s, cz, 0x6a4a2a, 0.05, x);
  put(parts, ico(0.5 * s).scale(1, 0.75, 1), cx, 1.05 * s, cz, 0x7ab04a, 0.14, y, rnd(x, y, 6) * 6);
  put(parts, ico(0.28 * s), cx - 0.12, 1.3 * s, cz - 0.05, 0xa4d060, 0.12, x + y);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rnd(x, y, 7), h = (0.55 + rnd(x, y, i + 10) * 0.25) * s;
    put(parts, cone(0.1, h, 3).rotateX(Math.PI), cx + Math.cos(a) * 0.42 * s, 0.95 * s - h / 2 + 0.1, cz + Math.sin(a) * 0.42 * s, 0x5a9a3a, 0.12, i);
  }
});
// Ombú: tronco grueso y copa ancha y chata.
def('ö', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.2, 0.34, 0.65, 6), cx, 0.32, cz, 0x6a4a2a, 0.06, x);
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + rnd(x, y, 3); put(parts, box(0.14, 0.1, 0.3), cx + Math.cos(a) * 0.3, 0.05, cz + Math.sin(a) * 0.3, 0x5a3a1e, 0.05, i, -a); }
  put(parts, ico(0.62).scale(1.35, 0.6, 1.35), cx, 1.0, cz, 0x2a7a30, 0.14, y, rnd(x, y, 6) * 6);
  put(parts, ico(0.42).scale(1.2, 0.6, 1.2), cx - 0.12, 1.24, cz - 0.08, 0x3a9a40, 0.14, x + y);
});
// Zarzal: matorral oscuro y espinoso.
def('%', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const [dx, dz, r, col] of [[0, 0.05, 0.36, 0x3a5a22], [-0.2, -0.1, 0.26, 0x4e7a2e], [0.22, -0.05, 0.24, 0x4e7a2e]] as const)
    put(parts, ico(r), cx + dx, r * 0.8, cz + dz, col, 0.16, x + dx * 9, rnd(x, y, dx) * 6);
  for (let i = 0; i < 6; i++) put(parts, cone(0.03, 0.14, 3), cx + (rnd(x, y, i) - 0.5) * 0.7, 0.3 + rnd(x, y, i + 5) * 0.3, cz + (rnd(x, y, i + 9) - 0.5) * 0.5, 0x2a3a14, 0.05, i);
  for (let i = 0; i < 3; i++) put(parts, oct(0.04), cx + (rnd(x, y, i + 20) - 0.5) * 0.6, 0.45, cz + 0.25, 0x8a5a3a, 0, i);
});
// Tuna: paletas ovaladas con frutas.
def('И', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const [dx, dy, r, rz] of [[0, 0.24, 0.22, 0], [-0.18, 0.52, 0.18, 0.5], [0.15, 0.62, 0.2, -0.4]] as const)
    put(parts, sph(r, 6, 4).scale(1, 1.15, 0.35).rotateZ(rz), cx + dx, dy, cz, 0x4a9a4a, 0.1, dx * 10);
  put(parts, oct(0.05), cx + 0.2, 0.84, cz, 0xe8486a, 0);
  put(parts, oct(0.04), cx - 0.25, 0.7, cz, 0xe8486a, 0);
});
// Tronco caído, con las puntas cortadas y musgo.
def('Д', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.55;
  put(parts, cyl(0.2, 0.2, 0.92, 7).rotateZ(Math.PI / 2), cx, 0.2, cz, 0x6a4426, 0.08, x);
  for (const s of [-1, 1]) put(parts, cyl(0.17, 0.17, 0.02, 7).rotateZ(Math.PI / 2), cx + s * 0.465, 0.2, cz, 0xc89a62, 0.04, s);
  put(parts, oct(0.07), cx - 0.05, 0.4, cz, 0x4a9a3a, 0.05);
  put(parts, oct(0.05), cx + 0.08, 0.41, cz - 0.04, 0x6ac04a, 0.05);
});
// Leña apilada.
def('τ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const [dx, dy] of [[-0.24, 0.11], [0, 0.11], [0.24, 0.11], [-0.12, 0.3], [0.12, 0.3]]) {
    put(parts, cyl(0.11, 0.11, 0.7, 6).rotateX(Math.PI / 2), cx + dx, dy, cz, 0x8a5a30, 0.08, dx * 10);
    put(parts, cyl(0.08, 0.08, 0.02, 6).rotateX(Math.PI / 2), cx + dx, dy, cz + 0.355, 0xc89a62, 0.04, dx * 10);
  }
});
// Roca de fuerza: un peñasco grande.
def('\\', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, dod(0.48).scale(1, 0.8, 1), cx, 0.36, cz, 0x7a6a62, 0.14, x + y, rnd(x, y) * 6);
  put(parts, dod(0.2).scale(1, 0.6, 1), cx - 0.12, 0.66, cz - 0.05, 0xa89a90, 0.1, x);
});
// Magma: una lámina que brilla, con costras oscuras.
def('^', ({ parts, glow, x, y, lamp }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(glow, box(1, 0.05, 1), cx, 0.02, cz, 0xd84a1c, 0);
  for (let i = 0; i < 2; i++) put(glow, box(0.28, 0.052, 0.18), cx + (rnd(x, y, i) - 0.5) * 0.5, 0.025, cz + (rnd(x, y, i + 3) - 0.5) * 0.5, 0xffb43a, 0);
  for (let i = 0; i < 3; i++) put(parts, dod(0.09 + rnd(x, y, i + 6) * 0.05).scale(1, 0.5, 1), cx + (rnd(x, y, i + 9) - 0.5) * 0.7, 0.05, cz + (rnd(x, y, i + 12) - 0.5) * 0.7, 0x3a1a14, 0.1, i);
  if ((x + y) % 2 === 0) lamp(cx, 0.5, cz, 0xff6a2a, true);
});
// Estalagmita y cristales de las cuevas (casilleros ocultos del tema cueva).
function cave(name: string, g: Gen) {
  for (let cp = 0xe080; cp < 0xe100; cp++) { const c = String.fromCharCode(cp); if (TILE_INFO[c]?.name === name) PROPS_3D[c] = g; }
}
cave('estalagmita', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cone(0.24, 0.95, 6), cx, 0.47, cz, 0x6a6576, 0.12, x, rnd(x, y) * 6);
  put(parts, cone(0.13, 0.5, 5), cx + 0.22, 0.25, cz + 0.1, 0x5a5566, 0.12, y);
});
cave('cristales', ({ glow, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const [dx, h, rz, col] of [[-0.2, 0.45, 0.35, 0x5ab8d8], [0, 0.75, 0, 0x7ad8f0], [0.2, 0.5, -0.35, 0x5ab8d8]] as const)
    put(glow, oct(0.1).scale(1, h / 0.2, 1).rotateZ(rz), cx + dx, h / 2, cz, col, 0.1, dx * 10);
});

// ---------------------------------------------------------------- campo y pueblo
// Molino de viento: torre de fierro con la rueda de aspas.
def('Λ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.06, 0.28, 1.6, 4), cx, 0.8, cz, 0x7a7a82, 0.06, x, Math.PI / 4);
  put(parts, box(0.36, 0.04, 0.36), cx, 0.65, cz, 0x5a5a62, 0.04, y, Math.PI / 4);
  const hy = 1.62, hz = cz + 0.12;
  put(parts, box(0.1, 0.1, 0.1), cx, hy, hz, 0xc84a2a, 0.04);
  for (let i = 0; i < 6; i++) put(parts, box(0.07, 0.48, 0.02).translate(0, 0.28, 0).rotateZ((i / 6) * Math.PI * 2 + rnd(x, y)), cx, hy, hz + 0.02, 0xd8d8e0, 0.05, i);
  put(parts, box(0.02, 0.16, 0.42), cx, hy, cz - 0.15, 0xd8d8e0, 0.05);
});
// Espantapájaros.
def('ג', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.035, 0.035, 1.2, 5), cx, 0.6, cz, 0x6a4a2a, 0.05);
  put(parts, box(0.82, 0.05, 0.05), cx, 0.95, cz, 0x6a4a2a, 0.05);
  put(parts, box(0.34, 0.36, 0.16), cx, 0.82, cz, 0xa83a3a, 0.08, x);
  put(parts, box(0.1, 0.36, 0.12), cx, 0.82, cz + 0.02, 0x3a5aa8, 0.05);
  put(parts, box(0.22, 0.22, 0.2), cx, 1.18, cz, 0xd8b070, 0.06, y);
  put(parts, cyl(0.27, 0.27, 0.03, 8), cx, 1.3, cz, 0x6a4a2a, 0.05);
  put(parts, cone(0.17, 0.2, 7), cx, 1.41, cz, 0x6a4a2a, 0.05);
});
// Poste con nido de hornero.
def('Р', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.05, 0.06, 1.0, 6), cx, 0.5, cz, 0x7a5230, 0.06);
  put(parts, sph(0.22).scale(1.2, 0.8, 0.9), cx, 1.1, cz, 0xb88a58, 0.1, x);
  put(parts, cyl(0.06, 0.06, 0.03, 6).rotateX(Math.PI / 2), cx + 0.1, 1.11, cz + 0.19, 0x1a1008, 0);
});
// Colmenas: cajones amarillos con tapa.
def('ה', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const [dx, dz] of [[-0.22, 0.14], [0.22, 0.14], [0, -0.2]]) {
    put(parts, box(0.32, 0.3, 0.3), cx + dx, 0.15, cz + dz, 0xe8d05a, 0.06, dx * 10);
    put(parts, box(0.36, 0.04, 0.34), cx + dx, 0.32, cz + dz, 0xf4e27a, 0.04, dz * 10);
    put(parts, box(0.16, 0.03, 0.01), cx + dx, 0.08, cz + dz + 0.155, 0x2a1a0a, 0);
  }
});
// Colmena de paja (tipo campana), sobre su banquito.
def('ҳ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const s of [-1, 1]) put(parts, box(0.06, 0.16, 0.06), cx + s * 0.22, 0.08, cz, 0x6a4524, 0.05);
  for (let k = 0; k < 4; k++) put(parts, cyl(0.32 - k * 0.07, 0.34 - k * 0.07, 0.15, 8), cx, 0.23 + k * 0.15, cz, k % 2 ? 0xa87a18 : 0xe8b830, 0.06, k);
  put(parts, box(0.12, 0.08, 0.02), cx, 0.22, cz + 0.33, 0x2a1a08, 0);
});
// Tendedero con ropa colgada.
def('ψ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const s of [-1, 1]) put(parts, cyl(0.03, 0.03, 1.1, 5), cx + s * 0.42, 0.55, cz, 0x6a4020, 0.05);
  put(parts, box(0.86, 0.015, 0.015), cx, 1.05, cz, 0xcfcfd6, 0);
  put(parts, box(0.24, 0.3, 0.02), cx - 0.18, 0.89, cz, 0xf2f2f8, 0.04);
  put(parts, box(0.24, 0.36, 0.02), cx + 0.18, 0.86, cz, 0xe86a6a, 0.04);
});
// Redes de pesca colgadas entre dos postes.
def('Г', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const s of [-1, 1]) put(parts, cyl(0.035, 0.035, 1.0, 5), cx + s * 0.43, 0.5, cz, 0x6a4426, 0.05);
  put(parts, box(0.92, 0.05, 0.05), cx, 0.98, cz, 0x6a4426, 0.05);
  put(parts, box(0.8, 0.72, 0.02), cx, 0.58, cz, 0xc8a860, 0.12, x);
  put(parts, sph(0.06, 5, 4), cx - 0.2, 0.25, cz + 0.03, 0x4a8ab0, 0.04);
  put(parts, sph(0.06, 5, 4), cx + 0.15, 0.3, cz + 0.03, 0x4a8ab0, 0.04);
});
// Pozo de agua con su techito.
def('Θ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.38, 0.4, 0.4, 8), cx, 0.2, cz, 0x8a8a92, 0.1, x);
  put(parts, cyl(0.3, 0.3, 0.02, 8), cx, 0.405, cz, 0x2a5a8a, 0.04);
  for (const s of [-1, 1]) put(parts, box(0.06, 0.62, 0.06), cx + s * 0.33, 0.7, cz, 0x6a4020, 0.05);
  put(parts, box(0.72, 0.05, 0.05), cx, 0.98, cz, 0x6a4020, 0.05);
  put(parts, cone(0.52, 0.3, 4), cx, 1.15, cz, 0xa85a30, 0.08, y, Math.PI / 4);
});
// Carreta con fardo de pasto.
def('ב', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(0.86, 0.12, 0.5), cx, 0.36, cz, 0x7a5230, 0.06);
  put(parts, box(0.74, 0.2, 0.42), cx, 0.52, cz, 0xd8b848, 0.1, x);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(parts, cyl(0.2, 0.2, 0.05, 10).rotateX(Math.PI / 2), cx + sx * 0.22, 0.2, cz + sz * 0.28, 0x3a2a1a, 0.05);
  put(parts, box(0.5, 0.04, 0.04), cx - 0.66, 0.3, cz, 0x7a5230, 0.05);
});
// Fogón: leña cruzada, piedras alrededor y la llama.
def('П', ({ parts, glow, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; put(parts, dod(0.07), cx + Math.cos(a) * 0.3, 0.05, cz + Math.sin(a) * 0.3, 0x8a8a92, 0.1, i); }
  for (const r of [0.6, -0.6]) put(parts, cyl(0.05, 0.05, 0.5, 5).rotateZ(Math.PI / 2).rotateY(r), cx, 0.07, cz, 0x6a4426, 0.06);
  put(glow, cone(0.2, 0.5, 6), cx, 0.32, cz, 0xf08020, 0);
  put(glow, cone(0.11, 0.34, 6), cx, 0.26, cz + 0.12, 0xffd040, 0);
});
// Bicicleta apoyada.
def('Й', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.55;
  for (const s of [-1, 1]) put(parts, new THREE.TorusGeometry(0.17, 0.025, 4, 10), cx + s * 0.25, 0.19, cz, 0x2a2a34, 0.04);
  put(parts, box(0.4, 0.03, 0.03), cx, 0.4, cz, 0xe0263a, 0.04);
  put(parts, box(0.03, 0.34, 0.03).rotateZ(0.45), cx - 0.1, 0.3, cz, 0xe0263a, 0.04);
  put(parts, box(0.03, 0.24, 0.03), cx + 0.2, 0.34, cz, 0xe0263a, 0.04);
  put(parts, box(0.03, 0.03, 0.26), cx + 0.22, 0.48, cz, 0x2a2a34, 0.04);
  put(parts, box(0.14, 0.03, 0.06), cx - 0.16, 0.46, cz, 0x2a2a34, 0.04);
});
// Sombrilla de playa.
def('Ж', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.025, 0.025, 1.12, 5), cx, 0.56, cz, 0x8a6a3a, 0.04);
  put(parts, cone(0.56, 0.26, 8), cx, 1.15, cz, 0xe8486a, 0.08, x, rnd(x, y) * 3);
  put(parts, cone(0.2, 0.093, 8), cx, 1.235, cz, 0xf4f4f4, 0.04, y, rnd(x, y) * 3);
});
// Bote: casco, borda blanca, mástil y vela.
def('β', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.55;
  put(parts, prism([[-0.46, 0], [-0.3, -0.2], [0.42, -0.2], [0.42, 0.2], [-0.3, 0.2]], 0.24), cx, -0.12, cz, 0xc84a3a, 0.06, x);
  put(parts, box(0.7, 0.03, 0.4), cx + 0.06, 0.13, cz, 0xf2f2f2, 0.03);
  put(parts, box(0.6, 0.04, 0.005), cx + 0.06, 0.02, cz + 0.2, 0x2a6ab0, 0);
  put(parts, cyl(0.02, 0.02, 0.75, 5), cx, 0.5, cz, 0x6a4020, 0.04);
  put(parts, tri2([0, 0.85, 0], [0, 0.2, 0], [0.36, 0.2, 0]), cx + 0.02, 0, cz, 0xf2e6c8, 0.03);
});
// Ancla.
def('Б', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5, col = 0x3a3a46;
  put(parts, box(0.08, 0.78, 0.08), cx, 0.47, cz, col, 0.05);
  put(parts, box(0.42, 0.06, 0.07), cx, 0.78, cz, col, 0.05);
  put(parts, new THREE.TorusGeometry(0.07, 0.02, 4, 8), cx, 0.93, cz, 0x5a5a68, 0.04);
  put(parts, new THREE.TorusGeometry(0.27, 0.045, 4, 9, Math.PI).rotateZ(Math.PI), cx, 0.35, cz, col, 0.05);
  for (const s of [-1, 1]) put(parts, cone(0.07, 0.16, 4).rotateZ(-s * 0.4), cx + s * 0.27, 0.4, cz, col, 0.05);
});
// Salvavidas: aro rojo y blanco colgado.
def('ϭ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.55;
  put(parts, box(0.08, 0.6, 0.06), cx, 0.3, cz - 0.08, 0x2a3a5a, 0.04);
  put(parts, new THREE.TorusGeometry(0.24, 0.08, 6, 12), cx, 0.42, cz, 0xd83a3a, 0.05);
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; put(parts, box(0.1, 0.1, 0.18).rotateZ(a), cx + Math.cos(a) * 0.24, 0.42 + Math.sin(a) * 0.24, cz, 0xeef3f7, 0.03); }
});
// Tamboril de candombe, parado.
def('Ԑ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.2, 0.16, 0.6, 8), cx, 0.3, cz, 0xb06a34, 0.06);
  for (const [h, col] of [[0.2, 0x2a6ad8], [0.33, 0xd83a2a], [0.46, 0xf2c02a]] as const) put(parts, cyl(0.2, 0.19, 0.04, 8), cx, h, cz, col, 0.03);
  put(parts, cyl(0.205, 0.205, 0.03, 8), cx, 0.615, cz, 0xf4ead0, 0.03);
});
// Macetas: maceta de barro y la planta.
def('N', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.55;
  put(parts, cyl(0.19, 0.14, 0.3, 7), cx, 0.15, cz, 0xc8643a, 0.05);
  put(parts, cyl(0.22, 0.22, 0.06, 7), cx, 0.31, cz, 0xd8744a, 0.04);
  put(parts, ico(0.24), cx, 0.53, cz, 0x3a9a44, 0.14, x + y);
  put(parts, ico(0.13), cx - 0.08, 0.68, cz + 0.05, 0x5ac85a, 0.1, x);
});
def('Ь', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.32, 0.25, 0.42, 8), cx, 0.21, cz, 0xc8643a, 0.05);
  put(parts, cyl(0.35, 0.35, 0.07, 8), cx, 0.43, cz, 0xd8744a, 0.04);
  put(parts, ico(0.36), cx, 0.74, cz, 0x2f9a4a, 0.14, x + y);
  put(parts, ico(0.2), cx - 0.1, 0.95, cz + 0.05, 0x4ab860, 0.1, x);
  for (const [dx, dy, dz, col] of [[-0.25, 0.8, 0.2, 0xe84a6a], [0.22, 0.72, 0.22, 0xf4c030], [0.02, 1.05, 0.15, 0xf4f4f4], [0.26, 0.92, -0.05, 0xe84a6a]] as const)
    put(parts, oct(0.06), cx + dx, dy, cz + dz, col, 0);
});

// ---------------------------------------------------------------- faroles y luces
// Farola de plaza: columna negra y farol de vidrio.
def('Σ', ({ parts, glow, x, y }) => {
  const cx = x + 0.5, cz = y + 0.6;
  put(parts, cyl(0.12, 0.14, 0.1, 6), cx, 0.05, cz, 0x33333c, 0.04);
  put(parts, cyl(0.04, 0.06, 1.25, 6), cx, 0.67, cz, 0x33333c, 0.04);
  put(parts, box(0.28, 0.04, 0.28), cx, 1.27, cz, 0x33333c, 0.03);
  put(glow, box(0.22, 0.22, 0.22), cx, 1.4, cz, 0xfff2a0, 0);
  put(parts, cone(0.22, 0.14, 4), cx, 1.58, cz, 0x33333c, 0.03, 0, Math.PI / 4);
});
// Farola de calle: poste alto con el brazo hacia la vereda.
def('|', ({ parts, glow, x, y }) => {
  const cx = x + 0.5, cz = y + 0.6;
  put(parts, cyl(0.1, 0.12, 0.08, 6), cx, 0.04, cz, 0x2e3240, 0.04);
  put(parts, cyl(0.035, 0.055, 1.55, 6), cx, 0.78, cz, 0x2e3240, 0.04);
  put(parts, box(0.05, 0.05, 0.36), cx, 1.55, cz + 0.16, 0x2e3240, 0.03);
  put(parts, box(0.2, 0.06, 0.26), cx, 1.52, cz + 0.36, 0x2e3240, 0.03);
  put(glow, box(0.16, 0.03, 0.2), cx, 1.48, cz + 0.36, 0xfff2a0, 0);
});
// Lámpara de pie (interiores).
def('Ղ', ({ parts, glow, x, y }) => {
  const cx = x + 0.5, cz = y + 0.55;
  put(parts, cyl(0.14, 0.16, 0.04, 8), cx, 0.02, cz, 0x2a2a34, 0.04);
  put(parts, cyl(0.025, 0.025, 0.95, 5), cx, 0.5, cz, 0xc8a040, 0.04);
  put(glow, cyl(0.12, 0.24, 0.24, 8), cx, 1.06, cz, 0xf6e2a0, 0);
});
// Estufa a leña con el fuego encendido.
def('Է', ({ parts, glow, x, y, lamp }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(0.6, 0.5, 0.46), cx, 0.31, cz, 0x2e2e38, 0.05);
  for (const s of [-1, 1]) put(parts, box(0.06, 0.06, 0.06), cx + s * 0.24, 0.03, cz + 0.16, 0x1a1a22, 0);
  put(parts, box(0.64, 0.04, 0.5), cx, 0.58, cz, 0x5a5a66, 0.04);
  put(glow, box(0.32, 0.18, 0.02), cx, 0.3, cz + 0.235, 0xff8a2a, 0);
  put(parts, cyl(0.06, 0.06, 0.7, 6), cx, 0.95, cz - 0.08, 0x4a4a56, 0.04);
  lamp(cx, 0.5, cz + 0.5, 0xff9a40, true);
});

// ---------------------------------------------------------------- mecanismos de los gimnasios
const plate = (p: THREE.BufferGeometry[], cx: number, cz: number, col: number) => put(p, box(0.86, 0.08, 0.86), cx, 0.04, cz, col, 0.04);
const valve = (on: boolean): Gen => ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5, col = on ? 0x5ae08a : 0xe84a3a;
  plate(parts, cx, cz, 0x4e5868);
  put(parts, box(0.5, 0.28, 0.5), cx, 0.22, cz, 0x2a303a, 0.05);
  put(parts, cyl(0.04, 0.04, 0.2, 5), cx, 0.45, cz, 0x6a7280, 0.03);
  put(parts, box(0.52, 0.05, 0.08), cx, 0.56, cz, col, 0.04, 0, on ? Math.PI / 4 : 0);
  put(parts, box(0.08, 0.05, 0.52), cx, 0.56, cz, col, 0.04, 0, on ? Math.PI / 4 : 0);
  put(parts, box(0.1, 0.07, 0.1), cx, 0.57, cz, 0xf4f4f0, 0);
};
def('ԑ', valve(false));
def('Ԓ', valve(true));
const light = (on: boolean): Gen => ({ parts, glow, x, y, lamp }) => {
  const cx = x + 0.5, cz = y + 0.5;
  plate(parts, cx, cz, 0x3e4856);
  put(parts, cyl(0.05, 0.07, 0.7, 6), cx, 0.38, cz, 0x7a8090, 0.04);
  put(on ? glow : parts, sph(0.2, 8, 6), cx, 0.9, cz, on ? 0xfff6b0 : 0x2a303a, on ? 0 : 0.05);
  if (on) lamp(cx, 1.1, cz + 0.3, 0xffe88a, true);
};
def('ԓ', light(false));
def('Ԕ', light(true));
// Chorro de fuego: boquilla y llamarada.
def('ӿ', ({ parts, glow, x, y, lamp }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(0.6, 0.2, 0.6), cx, 0.1, cz, 0x5a606c, 0.05);
  put(parts, cyl(0.12, 0.15, 0.16, 6), cx, 0.28, cz, 0x7a8090, 0.04);
  put(glow, cone(0.28, 0.85, 6), cx, 0.78, cz, 0xe8672c, 0);
  put(glow, cone(0.15, 0.55, 6), cx, 0.64, cz + 0.16, 0xf2c02a, 0);
  lamp(cx, 0.9, cz + 0.3, 0xff7a30, true);
});
// Enjambre: abejas sueltas en el aire.
def('ԕ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (let i = 0; i < 14; i++) {
    const a = rnd(x, y, i) * Math.PI * 2, r = 0.1 + rnd(x, y, i + 20) * 0.32;
    put(parts, oct(0.045).scale(1.4, 1, 1), cx + Math.cos(a) * r, 0.35 + rnd(x, y, i + 40) * 0.7, cz + Math.sin(a) * r, i % 3 ? 0xf2c02a : 0x2a2a32, 0, i);
  }
});
// Hélice: ventilador grande acostado.
def('Ԗ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  plate(parts, cx, cz, 0x4a5160);
  put(parts, cyl(0.05, 0.06, 0.32, 6), cx, 0.24, cz, 0x7a8090, 0.04);
  for (let i = 0; i < 4; i++) put(parts, box(0.4, 0.03, 0.12).translate(0.22, 0, 0).rotateX(0.25).rotateY((i * Math.PI) / 2 + 0.3), cx, 0.42, cz, 0xc8d0da, 0.05, i);
  put(parts, cyl(0.08, 0.08, 0.08, 8), cx, 0.44, cz, 0xe84a3a, 0.03);
});
// Enredadera seca: enrejado de ramas con hojas secas.
def('ԗ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  for (const s of [-1, 1]) put(parts, cyl(0.04, 0.05, 0.95, 5), cx + s * 0.3, 0.47, cz, 0x6a4a22, 0.06);
  for (const h of [0.2, 0.5, 0.8]) put(parts, cyl(0.03, 0.03, 0.96, 4).rotateZ(Math.PI / 2 + (rnd(x, y, h * 9) - 0.5) * 0.3), cx, h, cz, 0x6a4a22, 0.06);
  for (let i = 0; i < 6; i++) put(parts, oct(0.05), cx + (rnd(x, y, i) - 0.5) * 0.8, 0.12 + rnd(x, y, i + 7) * 0.8, cz + 0.04, i % 3 ? 0xc8d0a0 : 0xc83a3a, 0, i);
});
// Carro de libros (se empuja).
def('ӽ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(0.8, 0.5, 0.55), cx, 0.35, cz, 0x5a3e22, 0.05);
  const cols = [0xc85a5a, 0x5a8ac8, 0x6ab070, 0xe8c04a];
  for (const h of [0.27, 0.47]) for (let i = 0; i < 7; i++) put(parts, box(0.08, 0.16, 0.02), cx - 0.3 + i * 0.1, h, cz + 0.28, cols[(i + (h > 0.3 ? 1 : 0)) % 4], 0.04);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(parts, cyl(0.07, 0.07, 0.04, 8).rotateZ(Math.PI / 2), cx + sx * 0.36, 0.07, cz + sz * 0.2, 0x2a2a32, 0.03);
});
// Busto del museo sobre su pedestal.
def('ϯ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(0.5, 0.6, 0.5), cx, 0.3, cz, 0x5a5a74, 0.05);
  put(parts, box(0.54, 0.05, 0.54), cx, 0.62, cz, 0x8a8aa0, 0.03);
  put(parts, box(0.36, 0.2, 0.2), cx, 0.74, cz, 0xc8c8d8, 0.05);
  put(parts, sph(0.13, 7, 5), cx, 0.96, cz, 0xc8c8d8, 0.05);
});

// ---------------------------------------------------------------- ciudad y monumentos
// Monumento: pedestal escalonado y la estatua de bronce.
def('Γ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(0.72, 0.24, 0.72), cx, 0.12, cz, 0xa8a4a0, 0.05);
  put(parts, box(0.5, 0.22, 0.5), cx, 0.35, cz, 0xc4c0bc, 0.05);
  put(parts, box(0.22, 0.42, 0.16), cx, 0.67, cz, 0x7a8a7a, 0.06);
  for (const s of [-1, 1]) put(parts, box(0.06, 0.3, 0.07), cx + s * 0.15, 0.7, cz, 0x7a8a7a, 0.06);
  put(parts, sph(0.09, 6, 4), cx, 0.96, cz, 0x7a8a7a, 0.05);
});
// La Mano de Punta del Este: cinco dedos que salen de la arena.
def('M', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  [0.84, 1.22, 1.31, 1.12, 0.66].forEach((h, i) => {
    const dx = (i - 2) * 0.19;
    put(parts, cyl(0.07, 0.09, h, 6).translate(0, h / 2, 0).rotateZ(-dx * 0.5), cx + dx, 0, cz + (i === 4 ? 0.12 : 0), 0xe8e2d2, 0.05, i);
  });
});
// Torre de los Homenajes: fuste blanco con la bandera.
def('ԍ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(0.5, 0.12, 0.5), cx, 0.06, cz, 0xc8c4bc, 0.03);
  put(parts, box(0.38, 2.0, 0.38), cx, 1.1, cz, 0xf4f2ec, 0.04);
  put(parts, cyl(0.015, 0.015, 0.55, 4), cx, 2.37, cz, 0x2a2a34, 0);
  for (let i = 0; i < 3; i++) put(parts, box(0.34, 0.07, 0.01), cx + 0.18, 2.58 - i * 0.07, cz, i === 1 ? 0xffffff : 0x6cc8f0, 0);
  put(parts, box(0.06, 0.06, 0.012), cx + 0.05, 2.57, cz, 0xf2c02a, 0);
});
// Muralla de la Ciudadela: lienzo de piedra con su cornisa.
def('Ԁ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(1, 1.1, 1), cx, 0.55, cz, 0xb0a07c, 0.07, x + y);
  put(parts, box(1.04, 0.1, 1.04), cx, 1.15, cz, 0xefe2c2, 0.04);
});
// Tribuna: gradas que suben hacia atrás; varias filas seguidas arman una sola tribuna.
def('Z', ({ parts, ch, x, y }) => {
  const cx = x + 0.5;
  let below = 0;
  while (ch(x, y + 1 + below) === 'Z') below++;
  const base = below * 0.9;
  if (base) put(parts, box(1, base, 1), cx, base / 2, y + 0.5, 0xd8d4cc, 0.04);
  for (let i = 0; i < 3; i++) {
    const h = base + (i + 1) * 0.3, z = y + 1 - (i + 0.5) / 3;
    put(parts, box(1, h - base, 1 / 3), cx, base + (h - base) / 2, z, 0xe8e4dc, 0.04, i);
    put(parts, box(1, 0.05, 0.08), cx, h + 0.025, z + 1 / 6 - 0.05, 0x3a7ad8, 0.03, i);
  }
});
// Azotea: el techo plano de un edificio alto, a la altura de su fachada, con tanque de agua.
def('{', ({ parts, bldBelow, facadeH, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5, n = bldBelow(x, y), h = n ? n * facadeH : 0.15;
  put(parts, box(1, h, 1), cx, h / 2, cz, 0xbfae94, 0.03);
  put(parts, box(1, 0.04, 1), cx, h + 0.02, cz, 0x6c6c78, 0.06, x);
  if (rnd(x, y, 1) > 0.5) put(parts, box(0.3, 0.26, 0.26), cx - 0.2, h + 0.15, cz - 0.1, 0xb8bcc8, 0.04);
  else put(parts, box(0.24, 0.3, 0.3), cx + 0.2, h + 0.17, cz, 0x8a6a4a, 0.05);
});
// Vidrio de la terminal: un paño de vidrio azul del alto de una fachada.
def('(', ({ parts, facadeH, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(1, facadeH, 0.96), cx, facadeH / 2, cz, 0x4a9ac8, 0.06, x);
  put(parts, box(0.1, facadeH, 0.02), cx, facadeH / 2, y + 0.99, 0xd8e8f0, 0);
  put(parts, box(1, 0.05, 0.98), cx, facadeH - 0.02, cz, 0xd8e8f0, 0);
});
// Ascensor del shopping: puertas de acero en la pared.
def('Ͽ', ({ parts, glow, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(1, 1.05, 1), cx, 0.525, cz, 0x6a6662, 0.04);
  for (const s of [-1, 1]) put(parts, box(0.38, 0.82, 0.02), cx + s * 0.195, 0.41, y + 1.005, s < 0 ? 0x9aa6b4 : 0x8a96a4, 0.03);
  put(glow, box(0.1, 0.05, 0.02), cx, 0.94, y + 1.01, 0xff8a3a, 0);
});
// Torre de piedra con su tronera iluminada.
def('z', ({ parts, glow, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, box(1, 1.6, 1), cx, 0.8, cz, 0x5a5870, 0.07, x + y);
  put(glow, box(0.12, 0.42, 0.02), cx, 0.9, y + 1.01, 0xffd76a, 0);
});
// Fortaleza del Cerro: el cerro, y arriba los muros y el faro.
def('ԏ', ({ parts, glow, x, y, lamp }) => {
  const cx = x + 0.5, cz = y + 0.5, h = 1.4;
  put(parts, cyl(0.38, 0.78, h, 6), cx, h / 2, cz, 0x8c8c96, 0.14, x + y);
  put(parts, box(0.62, 0.26, 0.62), cx, h + 0.13, cz, 0xb8a47e, 0.05);
  for (const [dx, dz] of [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]) put(parts, box(0.1, 0.1, 0.1), cx + dx, h + 0.31, cz + dz, 0xb8a47e, 0.05);
  put(parts, cyl(0.08, 0.1, 0.5, 6), cx, h + 0.5, cz, 0xf4f2ec, 0.03);
  put(parts, cyl(0.105, 0.105, 0.1, 6), cx, h + 0.55, cz, 0xd8302e, 0.03);
  put(glow, cyl(0.07, 0.07, 0.1, 6), cx, h + 0.8, cz, 0xffe060, 0);
  lamp(cx, h + 0.9, cz, 0xfff2a0, false);
});
// Palacio Salvo: la cúpula va arriba del edificio (a la altura de la fachada que tiene adelante). La del medio
// lleva el tambor octogonal y la aguja con su faro; las de los costados, la balaustrada.
def('ԉ', ({ parts, glow, ch, bldBelow, facadeH, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5, h = bldBelow(x, y) * facadeH;
  if (h) put(parts, box(1, h, 1), cx, h / 2, cz, 0xecdcb8, 0.03);
  const mid = ch(x, y - 1) === 'Ԋ' || (ch(x - 1, y) === 'ԉ' && ch(x + 1, y) === 'ԉ');
  if (!mid) { put(parts, box(0.9, 0.22, 0.9), cx, h + 0.11, cz, 0xc8b48a, 0.04); return; }
  put(parts, cyl(0.44, 0.48, 0.25, 8), cx, h + 0.12, cz, 0xc8b48a, 0.04);
  put(parts, cyl(0.38, 0.38, 0.6, 8), cx, h + 0.55, cz, 0xecdcb8, 0.04);
  put(parts, cyl(0.385, 0.385, 0.2, 8), cx, h + 0.55, cz, 0x3a4a68, 0.03);
  put(parts, new THREE.SphereGeometry(0.4, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), cx, h + 0.85, cz, 0x7a9a88, 0.06);
  if (ch(x, y - 1) === 'Ԋ') {
    put(parts, cyl(0.12, 0.17, 0.5, 8), cx, h + 1.45, cz, 0xecdcb8, 0.03);
    put(glow, cyl(0.08, 0.08, 0.14, 8), cx, h + 1.77, cz, 0xffe060, 0);
    put(parts, cone(0.1, 0.45, 8), cx, h + 2.06, cz, 0x7a9a88, 0.04);
  }
});
// la aguja la arma la cúpula de abajo
def('Ԋ', ({ ch, x, y }) => ch(x, y + 1) === 'ԉ');
// Faros: la torre la arma el casillero de la base (con la linterna si está arriba); el de arriba no dibuja nada.
const lighthouse = (top: string, band: number): Gen => ({ parts, glow, ch, x, y, lamp }) => {
  const cx = x + 0.5, cz = y + 0.5;
  put(parts, cyl(0.42, 0.46, 0.12, 8), cx, 0.06, cz, 0xa89878, 0.04);
  put(parts, cyl(0.3, 0.38, 1.6, 8), cx, 0.8, cz, 0xf4f0e6, 0.03);
  for (const h of [0.5, 1.2]) put(parts, cyl(0.4 - 0.05 * (h + 0.125), 0.4 - 0.05 * (h - 0.125), 0.25, 8), cx, h, cz, band, 0.03); // apenas más ancha que la torre
  put(parts, box(0.18, 0.3, 0.02), cx, 0.27, cz + 0.37, 0x5a3a1a, 0);
  if (ch(x, y - 1) !== top) return;
  put(parts, cyl(0.42, 0.42, 0.06, 8), cx, 1.63, cz, 0x3a3a3a, 0.03);
  put(glow, cyl(0.22, 0.22, 0.32, 8), cx, 1.82, cz, 0xfff27a, 0);
  put(parts, cone(0.3, 0.3, 8), cx, 2.13, cz, band, 0.04);
  lamp(cx, 1.9, cz + 0.3, 0xfff2a0, false);
};
def('l', lighthouse('L', 0xd83a3a));
def('Ӧ', lighthouse('ӧ', 0xc8403a));
def('L', ({ ch, x, y }) => ch(x, y + 1) === 'l');
def('ӧ', ({ ch, x, y }) => ch(x, y + 1) === 'Ӧ');

// ---------------------------------------------------------------- Fiesta de la Patria Gaucha
const pole = (p: THREE.BufferGeometry[], cx: number, cz: number, h: number) => put(p, cyl(0.03, 0.04, h, 5), cx, h / 2, cz, 0x8a5a2e, 0.05);
def('ϑ', ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  pole(parts, cx, cz, 1.35);
  for (let i = 0; i < 4; i++) put(parts, box(0.3, 0.05, 0.01), cx + 0.17, 1.3 - i * 0.05, cz, i % 2 ? 0x5aa8e8 : 0xf4f4f4, 0);
  put(parts, box(0.06, 0.06, 0.012), cx + 0.06, 1.28, cz, 0xf2c02a, 0);
});
const sortija = (side: number): Gen => ({ parts, x, y }) => {
  const cx = x + 0.5, cz = y + 0.5;
  pole(parts, cx, cz, 1.4);
  put(parts, box(0.6, 0.06, 0.06), cx + side * 0.25, 1.36, cz, 0x9a6c40, 0.04);
  put(parts, box(0.03, 0.22, 0.03), cx - 0.12, 1.1, cz + 0.05, 0xe0263a, 0);
  put(parts, box(0.03, 0.22, 0.03), cx + 0.12, 1.1, cz + 0.05, 0x5aa8e8, 0);
};
def('ϕ', sortija(1));
def('Ϸ', sortija(-1));

// ---------------------------------------------------------------- plantas sobre el suelo (no son sólidas)
// Como las flores: el dibujo 2D queda en el suelo y encima se paran unas piezas.
def('Я', ({ parts, x, y }) => { // girasoles
  for (const [px, py] of [[4, 5], [9, 3], [12, 7]]) {
    const sx = x + px / 16, sz = y + 0.3 + py / 32, h = 0.5 + (12 - py) * 0.02;
    put(parts, cyl(0.018, 0.022, h, 4), sx, h / 2, sz, 0x3a8a30, 0.05);
    put(parts, cyl(0.1, 0.1, 0.03, 8).rotateX(1.2), sx, h + 0.04, sz + 0.02, 0xf4c020, 0.04);
    put(parts, cyl(0.05, 0.05, 0.035, 6).rotateX(1.2), sx, h + 0.045, sz + 0.03, 0x6a4018, 0.04);
  }
});
def('Ю', ({ parts, x, y }) => { // totoras
  [[3, 9], [6, 12], [9, 10], [12, 11]].forEach(([px, ph], i) => {
    const sx = x + px / 16, sz = y + 0.4 + rnd(x, y, i) * 0.3, h = ph * 0.055;
    put(parts, cyl(0.014, 0.02, h, 4), sx, h / 2, sz, 0x5a8a3a, 0.05, i);
    put(parts, cyl(0.035, 0.035, 0.15, 5), sx, h + 0.02, sz, 0x6a3a1e, 0.05, i);
  });
});
def('Ч', ({ parts, x, y }) => { // paja brava
  [[3, 11, 0x9ab04a], [6, 13, 0xb8c860], [9, 12, 0x9ab04a], [12, 10, 0xb8c860]].forEach(([px, ph, col], i) => {
    const sx = x + px / 16, sz = y + 0.4 + rnd(x, y, i) * 0.3, h = ph * 0.055;
    put(parts, cone(0.07, h, 3), sx, h / 2, sz, col, 0.08, i, rnd(x, y, i + 5) * 3);
    put(parts, cone(0.05, 0.16, 4).rotateX(Math.PI), sx, h + 0.02, sz, 0xe8e0a8, 0.04, i);
  });
});
def('Ц', ({ parts, x, y }) => { // piedritas
  [[3, 9, 4], [8, 7, 5], [10, 12, 3], [2, 13, 3]].forEach(([px, py, w], i) => {
    const r = w * 0.022;
    put(parts, dod(r).scale(1, 0.6, 1), x + (px + w / 2) / 16, r * 0.4, y + py / 16, i % 2 ? 0xb4b4bc : 0x8a8a92, 0.1, i, rnd(x, y, i) * 6);
  });
});

// ---------------------------------------------------------------- el Buquebus «China Zorrilla» (12×3 casilleros)
// El barco entero lo arma el casillero de la proa de arriba; los demás solo ponen el agua debajo.
for (let iy = 0; iy < SHIP_H; iy++) for (let ix = 0; ix < SHIP_W; ix++) {
  PROPS_3D[String.fromCharCode(SHIP_BASE + iy * SHIP_W + ix)] = ({ parts, water, ch, x, y }) => {
    const ox = x - ix, oy = y - iy;
    if (ch(ox, oy) !== String.fromCharCode(SHIP_BASE)) return false; // falta la proa: queda el pixel art
    const q = new THREE.PlaneGeometry(1, 1, 2, 2);
    q.rotateX(-Math.PI / 2);
    q.translate(x + 0.5, 0.01, y + 0.5);
    water.push(q);
    if (ix || iy) return;
    const P = (a: number, b: number) => [ox + a, oy + b];
    const plan = [P(0.2, 1.55), P(2.2, 0.35), P(11.85, 0.35), P(11.85, 2.75), P(2.2, 2.75)];
    put(parts, prism(plan, 0.35), 0, -0.15, 0, 0x2a3a5a, 0.04);
    put(parts, prism(plan, 0.05), 0, 0.2, 0, 0xc83a3a, 0.02);
    put(parts, prism(plan, 0.5), 0, 0.25, 0, 0xe8eef4, 0.03);
    put(parts, prism(plan, 0.05), 0, 0.75, 0, 0xc8a060, 0.03);
    const zc = oy + 1.55;
    let base = 0.8;
    for (const [x0, x1, d, h, glass] of [[2.5, 10.75, 2.0, 0.5, 0x2a3550], [3.6, 9.4, 1.6, 0.45, 0x2a3550], [5.1, 8.0, 1.2, 0.35, 0x5a9ad8]] as const) {
      put(parts, box(x1 - x0, h, d), ox + (x0 + x1) / 2, base + h / 2, zc, 0xf4f8fc, 0.03);
      put(parts, box(x1 - x0 + 0.02, 0.12, d + 0.02), ox + (x0 + x1) / 2, base + h * 0.55, zc, glass, 0.02);
      base += h;
    }
    const deck2 = 0.8 + 0.5 + 0.45; // las chimeneas van sobre la cubierta del medio, detrás del puente
    for (const fx of [8.3, 9.05]) {
      put(parts, box(0.55, 0.55, 0.42), ox + fx, deck2 + 0.275, zc, 0xe89a20, 0.04);
      put(parts, box(0.56, 0.12, 0.43), ox + fx, deck2 + 0.61, zc, 0x1a1a24, 0.02);
    }
    put(parts, cyl(0.02, 0.02, 0.6, 4), ox + 5.75, base + 0.3, zc, 0x9aa8bc, 0);
  };
}
