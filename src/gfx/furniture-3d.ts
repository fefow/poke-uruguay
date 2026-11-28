// Muebles y objetos de uso low-poly del mundo 3D: mesas, sillas, camas, bibliotecas, mostradores, góndolas, máquinas,
// cajones, fardos, barriles, bancos... Antes se armaban doblando su dibujo 2D sobre una caja (foldBox) y en 3D se veían
// como un dibujo pegado; acá cada uno tiene piezas propias (tapa, patas, estantes, almohadas) con los colores de su dibujo.
// Mismo estilo que props-3d.ts: pocas caras, pintadas por vértice. Cada generador devuelve false cuando en ese lugar o
// en ese tema no le toca (por ejemplo la «mesa» de un gimnasio, que es otro dibujo): entonces queda el mueble doblado.
// Los que van en fila (mostradores, góndolas, bibliotecas, bancos de espera) se unen con el vecino igual: sin costados
// ni patas en el medio, así una fila se ve como un solo mueble.
import * as THREE from 'three';
import { paint, at, box, rnd } from './world-3d.ts';

export interface FurnCtx {
  parts: THREE.BufferGeometry[];
  /** piezas que brillan solas (pantallas, luces) */
  glow: THREE.BufferGeometry[];
  x: number; y: number;
  ch: (x: number, y: number) => string | null;
  theme: string | null;
}
type Gen = (c: FurnCtx) => boolean | void;

const C = (h: number) => new THREE.Color(h);
const put = (list: THREE.BufferGeometry[], g: THREE.BufferGeometry, x: number, y: number, z: number, col: number, jitter = 0.05, seed = 0, ry = 0) =>
  list.push(paint(at(g, x, y, z, ry), C(col), jitter, seed));
const cyl = (rt: number, rb: number, h: number, seg = 7) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sph = (r: number, w = 7, h = 5) => new THREE.SphereGeometry(r, w, h);

export const FURN_3D: Record<string, Gen> = {};
const def = (chars: string, g: Gen) => { for (const c of chars) FURN_3D[c] = g; };

const WOOD = 0xb87440, WOOD_TOP = 0xd08c50, WOOD_DARK = 0x6a3e22;

/** Hasta dónde llega un mueble en x: si el vecino de al lado es de la misma fila, se pega a él (sin hueco). */
function span(c: FurnCtx, same: string, inset: number) {
  const w = !!c.ch(c.x - 1, c.y) && same.includes(c.ch(c.x - 1, c.y)!);
  const e = !!c.ch(c.x + 1, c.y) && same.includes(c.ch(c.x + 1, c.y)!);
  const x0 = c.x + (w ? 0 : inset), x1 = c.x + 1 - (e ? 0 : inset);
  return { x0, x1, w, e, cx: (x0 + x1) / 2, len: x1 - x0 };
}

// ---------------------------------------------------------------- mesas
/** Mesa: tapa con canto y cuatro patas (en una fila de mesas, patas solo en las puntas). */
function table(c: FurnCtx, same: string, h: number, top: number, leg: number, z0 = 0.14, z1 = 0.86) {
  const { x0, x1, w, e, cx, len } = span(c, same, 0.06);
  const cz = c.y + (z0 + z1) / 2, d = z1 - z0;
  put(c.parts, box(len, 0.07, d), cx, h - 0.035, cz, top, 0.04, c.x);
  put(c.parts, box(len, 0.05, 0.03), cx, h - 0.1, c.y + z1 - 0.03, leg, 0.03, c.y); // faldón de adelante
  for (const [lx, on] of [[x0 + 0.07, !w], [x1 - 0.07, !e]] as const) {
    if (!on) continue;
    for (const lz of [c.y + z0 + 0.07, c.y + z1 - 0.07]) put(c.parts, box(0.07, h - 0.07, 0.07), lx, (h - 0.07) / 2, lz, leg, 0.03, c.x);
  }
  return { cx, cz, h };
}
def('T', (c) => {
  if (c.theme?.startsWith('gym_')) return false; // en los gimnasios la «mesa» es un panel del tema
  if (c.theme === 'casino') { // mesa de paño: borde rojo, paño verde, fichas y cartas
    const t = table(c, 'T', 0.5, 0x9a1a2a, 0x4a1a1a, 0.1, 0.9);
    put(c.parts, box(0.72, 0.02, 0.6), t.cx, 0.51, t.cz, 0x2a9a4a, 0.03, c.x);
    put(c.parts, box(0.12, 0.01, 0.17), t.cx - 0.12, 0.525, t.cz, 0xf4f4f4, 0, c.x, 0.3);
    put(c.parts, box(0.12, 0.01, 0.17), t.cx + 0.05, 0.525, t.cz + 0.02, 0xf4f4f4, 0, c.y, -0.2);
    for (let i = 0; i < 3; i++) put(c.parts, cyl(0.04, 0.04, 0.03 + i * 0.02, 8), t.cx + 0.2, 0.53 + i * 0.01, t.cz - 0.12 + i * 0.1, [0xd83030, 0x2a2a2a, 0xf2c02a][i], 0);
    return;
  }
  table(c, 'TԹ', 0.5, WOOD_TOP, WOOD_DARK);
});
// Mesa con mate: el mate con la yerba y el termo al lado.
def('Թ', (c) => {
  const t = table(c, 'TԹ', 0.5, WOOD_TOP, WOOD_DARK);
  put(c.parts, cyl(0.06, 0.045, 0.1, 8), t.cx - 0.12, 0.55, t.cz + 0.05, 0x8a5a2a, 0.04, c.x);
  put(c.parts, cyl(0.05, 0.05, 0.01, 8), t.cx - 0.12, 0.605, t.cz + 0.05, 0x5aa83a, 0);
  put(c.parts, cyl(0.006, 0.006, 0.14, 4).rotateZ(0.3), t.cx - 0.1, 0.65, t.cz + 0.05, 0xd8d8d8, 0);
  put(c.parts, cyl(0.045, 0.05, 0.26, 8), t.cx + 0.14, 0.63, t.cz - 0.06, 0xe8e8ea, 0.03, c.y);
  put(c.parts, cyl(0.035, 0.045, 0.05, 8), t.cx + 0.14, 0.785, t.cz - 0.06, 0x3a3a40, 0.03);
});
// Mesita con radio: mesita oscura y una radio con su dial.
def('Կ', (c) => {
  const t = table(c, 'Կ', 0.48, 0x7a4a2a, 0x3a2414, 0.25, 0.85);
  put(c.parts, box(0.46, 0.2, 0.18), t.cx, 0.58, t.cz, 0x8a8a92, 0.04, c.x);
  put(c.parts, box(0.2, 0.08, 0.01), t.cx - 0.08, 0.6, t.cz + 0.095, 0x3ac870, 0);
  put(c.parts, cyl(0.03, 0.03, 0.02, 8).rotateX(Math.PI / 2), t.cx + 0.14, 0.59, t.cz + 0.095, 0xd8c040, 0);
  put(c.parts, cyl(0.004, 0.004, 0.3, 3).rotateZ(-0.5), t.cx + 0.2, 0.8, t.cz - 0.04, 0xc8c8c8, 0);
});
// Escritorio de oficina (Frigorífico del Anglo): madera oscura, papeles y una carpeta.
def('ӹ', (c) => {
  const t = table(c, 'ӹ', 0.52, 0x5a4030, 0x2a1e18);
  put(c.parts, box(0.3, 0.06, 0.48), t.cx + (rnd(c.x, c.y) > 0.5 ? 0.15 : -0.15), 0.18, t.cz, 0x4a3426, 0.03, c.x); // cajonera
  put(c.parts, box(0.22, 0.01, 0.16), t.cx - 0.1, 0.525, t.cz + 0.04, 0xf4f4ee, 0, c.x, 0.15);
  put(c.parts, box(0.16, 0.03, 0.2), t.cx + 0.16, 0.535, t.cz - 0.02, 0x2a5ab0, 0.03, c.y, -0.1);
});
// Mesa con sillas de afuera: mesita clara con un vaso y dos banquitos.
def('З', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.5;
  put(c.parts, cyl(0.3, 0.3, 0.05, 10), cx, 0.46, cz, 0xf2e2b8, 0.03, c.x);
  put(c.parts, cyl(0.04, 0.06, 0.44, 6), cx, 0.22, cz, 0x7a4a2a, 0.04);
  put(c.parts, cyl(0.04, 0.035, 0.08, 6), cx + 0.08, 0.52, cz, 0xe03a3a, 0);
  for (const s of [-1, 1]) {
    put(c.parts, cyl(0.12, 0.12, 0.05, 8), cx + s * 0.38, 0.28, cz + 0.05, 0x8a5a30, 0.04, s);
    put(c.parts, cyl(0.025, 0.03, 0.26, 5), cx + s * 0.38, 0.13, cz + 0.05, 0x5a3420, 0.04, s);
  }
});

// ---------------------------------------------------------------- asientos
// Silla: patas, asiento con almohadón rojo y respaldo atrás.
def('Ը', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.55;
  for (const [dx, dz] of [[-0.17, -0.15], [0.17, -0.15], [-0.17, 0.17], [0.17, 0.17]]) put(c.parts, box(0.05, 0.26, 0.05), cx + dx, 0.13, cz + dz, WOOD_DARK, 0.03);
  put(c.parts, box(0.42, 0.05, 0.4), cx, 0.285, cz, WOOD, 0.04, c.x);
  put(c.parts, box(0.36, 0.05, 0.32), cx, 0.33, cz + 0.01, 0xd84a3a, 0.04, c.y);
  put(c.parts, box(0.42, 0.42, 0.05), cx, 0.53, cz - 0.18, WOOD, 0.04, c.x + 1);
  put(c.parts, box(0.3, 0.06, 0.06), cx, 0.66, cz - 0.15, WOOD_TOP, 0.03);
});
/** Sofá de dos cuerpos: base, almohadones, respaldo y el brazo del lado de afuera. */
const sofa = (arm: -1 | 1, pillow: boolean): Gen => (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.55, base = 0x2a7a50, soft = 0x3a9a64;
  put(c.parts, box(1, 0.24, 0.7), cx, 0.12, cz, base, 0.04, c.x);
  put(c.parts, box(0.84, 0.1, 0.5), cx - arm * 0.06, 0.29, cz + 0.08, soft, 0.04, c.y);
  put(c.parts, box(1, 0.36, 0.18), cx, 0.42, cz - 0.26, base, 0.04, c.x + 3);
  put(c.parts, box(0.16, 0.4, 0.7), cx + arm * 0.42, 0.2, cz, base, 0.04, c.x + 5);
  put(c.parts, box(0.17, 0.05, 0.72), cx + arm * 0.42, 0.42, cz, soft, 0.03);
  for (const s of [-1, 1]) put(c.parts, box(0.04, 0.06, 0.04), cx + s * 0.44, 0.03, cz + 0.3, WOOD_DARK, 0); // patitas
  if (pillow) put(c.parts, box(0.24, 0.22, 0.08), cx + arm * 0.18, 0.44, cz - 0.12, 0xf2c83a, 0.04, c.x, -arm * 0.2);
};
def('Ա', sofa(-1, true));
def('Բ', sofa(1, false));
/** Banco de madera con listones; con respaldo el de plaza. */
const bench = (back: boolean, slat: number, leg: number): Gen => (c) => {
  const { x0, x1, w, e, cx, len } = span(c, 'Δד', 0.08);
  const cz = c.y + 0.55;
  for (let i = 0; i < 3; i++) put(c.parts, box(len, 0.04, 0.1), cx, 0.36, cz - 0.12 + i * 0.12, slat, 0.06, c.x + i);
  for (const [lx, on] of [[x0 + 0.1, !w], [x1 - 0.1, !e]] as const) if (on) {
    put(c.parts, box(0.07, 0.34, 0.06), lx, 0.17, cz - 0.12, leg, 0.03);
    put(c.parts, box(0.07, 0.34, 0.06), lx, 0.17, cz + 0.12, leg, 0.03);
    if (back) put(c.parts, box(0.06, 0.32, 0.06), lx, 0.52, cz - 0.17, leg, 0.03);
  }
  if (back) for (let i = 0; i < 2; i++) put(c.parts, box(len, 0.08, 0.04), cx, 0.5 + i * 0.13, cz - 0.17, slat, 0.06, c.y + i);
};
def('Δ', bench(false, 0xb8743a, 0x4a3a30));
def('ד', bench(true, 0x8a5a2e, 0x3a3a3a));
// Banco de espera (Policlínica): asientos de plástico turquesa sobre un caño negro.
def('Ռ', (c) => {
  const { x0, x1, w, e, cx, len } = span(c, 'Ռ', 0.06);
  const cz = c.y + 0.55;
  put(c.parts, box(len, 0.05, 0.06), cx, 0.24, cz, 0x26262c, 0.03);
  for (const [lx, on] of [[x0 + 0.08, !w], [x1 - 0.08, !e]] as const) if (on) put(c.parts, box(0.05, 0.24, 0.36), lx, 0.12, cz, 0x26262c, 0.03);
  for (const s of [-0.22, 0.22]) {
    put(c.parts, box(0.38, 0.06, 0.36), c.x + 0.5 + s, 0.3, cz + 0.02, 0x2aa8a0, 0.04, c.x);
    put(c.parts, box(0.38, 0.36, 0.06), c.x + 0.5 + s, 0.5, cz - 0.17, 0x2aa8a0, 0.04, c.y, 0);
  }
});

// ---------------------------------------------------------------- camas
/** Cama: base, colchón con la frazada, almohada y cabecera al norte. Dos camas seguidas de norte a sur son una sola. */
const bed = (frame: number, blanket: number, legs: number): Gen => (c) => {
  const cx = c.x + 0.5;
  const head = c.ch(c.x, c.y - 1) !== c.ch(c.x, c.y), foot = c.ch(c.x, c.y + 1) !== c.ch(c.x, c.y);
  const z0 = c.y + (head ? 0.08 : 0), z1 = c.y + 1 - (foot ? 0.06 : 0), cz = (z0 + z1) / 2, d = z1 - z0;
  put(c.parts, box(0.8, 0.16, d), cx, 0.14, cz, frame, 0.04, c.x);
  for (const lz of [z0 + 0.05, z1 - 0.05]) for (const s of [-1, 1]) put(c.parts, box(0.06, 0.08, 0.06), cx + s * 0.36, 0.04, lz, legs, 0.02);
  put(c.parts, box(0.74, 0.08, d - (head ? 0.04 : 0)), cx, 0.26, cz + (head ? 0.02 : 0), 0xf4f4f0, 0.02, c.y); // sábana
  const bz0 = head ? z0 + 0.3 : z0;
  put(c.parts, box(0.78, 0.07, z1 - bz0), cx, 0.3, (bz0 + z1) / 2, blanket, 0.05, c.x + c.y); // frazada
  if (head) {
    put(c.parts, box(0.5, 0.08, 0.18), cx, 0.33, z0 + 0.14, 0xffffff, 0.02, c.x);
    put(c.parts, box(0.84, 0.5, 0.06), cx, 0.25, z0, frame, 0.04, c.y);
  }
  if (foot) put(c.parts, box(0.84, 0.3, 0.05), cx, 0.15, z1, frame, 0.04, c.x + 2);
};
def('E', (c) => (c.theme === 'poli' ? bed(0xe4ecee, 0x2aa89a, 0x8a9aa0)(c) : c.theme === 'barco' ? bed(0x9a6a3a, 0x2a6ad8, WOOD_DARK)(c) : bed(0x8a5430, 0x3a7ad8, WOOD_DARK)(c)));
// Camilla: patas de metal, colchoneta blanca y sábana verde agua.
def('Ս', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.5;
  for (const dz of [-0.36, 0.36]) for (const s of [-1, 1]) put(c.parts, cyl(0.025, 0.025, 0.32, 5), cx + s * 0.3, 0.16, cz + dz, 0xa8b0b8, 0.02);
  put(c.parts, box(0.7, 0.06, 0.86), cx, 0.34, cz, 0xa8b0b8, 0.02);
  put(c.parts, box(0.64, 0.08, 0.82), cx, 0.41, cz, 0xf4f8f8, 0.02, c.x);
  put(c.parts, box(0.66, 0.04, 0.5), cx, 0.465, cz + 0.15, 0x8ad8c0, 0.03, c.y);
  put(c.parts, box(0.42, 0.07, 0.16), cx, 0.48, cz - 0.28, 0xffffff, 0.02);
});

// ---------------------------------------------------------------- estanterías y roperos
/**
 * Mueble con estantes, abierto adelante: fondo, costados (solo en las puntas de una fila), tapa, estantes y lo que va
 * en cada estante (libros, productos, botellas) en cajitas de colores al azar de la paleta.
 */
function shelf(c: FurnCtx, same: string, o: { body: number; inner: number; items: number[]; h?: number; rows?: number; d?: number; bottle?: boolean }) {
  const h = o.h ?? 1.0, rows = o.rows ?? 3, d = o.d ?? 0.46;
  const { x0, x1, w, e, cx, len } = span(c, same, 0.04);
  const zb = c.y + 0.06, cz = zb + d / 2;
  put(c.parts, box(len, h, 0.04), cx, h / 2, zb + 0.02, o.inner, 0.03, c.x); // fondo
  if (!w) put(c.parts, box(0.05, h, d), x0 + 0.025, h / 2, cz, o.body, 0.03, c.y);
  if (!e) put(c.parts, box(0.05, h, d), x1 - 0.025, h / 2, cz, o.body, 0.03, c.y + 1);
  put(c.parts, box(len, 0.05, d + 0.02), cx, h - 0.025, cz, o.body, 0.03, c.x + 2);
  const step = (h - 0.12) / rows;
  for (let r = 0; r < rows; r++) {
    const y0 = 0.06 + r * step;
    put(c.parts, box(len, 0.04, d), cx, y0, cz, o.body, 0.03, c.x + r);
    // lo que hay en el estante
    const ix0 = x0 + (w ? 0.02 : 0.07), ix1 = x1 - (e ? 0.02 : 0.07);
    let px = ix0, i = 0;
    while (px < ix1 - 0.05) {
      const bw = o.bottle ? 0.08 : 0.06 + rnd(c.x, c.y, r * 13 + i) * 0.08;
      const bh = Math.min(step - 0.06, (o.bottle ? 0.2 : 0.13) + rnd(c.x, c.y, r * 7 + i + 50) * 0.1);
      const col = o.items[Math.floor(rnd(c.x, c.y, r * 5 + i + 90) * o.items.length)];
      const ww = Math.min(bw, ix1 - px);
      if (o.bottle) put(c.parts, cyl(0.03, 0.035, bh, 6), px + ww / 2, y0 + 0.02 + bh / 2, cz + 0.04, col, 0.04, i);
      else put(c.parts, box(ww - 0.01, bh, d - 0.12), px + ww / 2, y0 + 0.02 + bh / 2, cz + 0.02, col, 0.06, i + r);
      px += bw + (o.bottle ? 0.03 : 0.005);
      i++;
    }
  }
}
const BOOKS = [0xd83a3a, 0x3a6ad8, 0x3aa84a, 0xf2c02a, 0x8a4ac8, 0xe87a2a, 0xf0ead8];
def('B', (c) => {
  if (c.theme === 'casino') return shelf(c, 'B', { body: 0x3a1e18, inner: 0x5a2a20, items: [0xd83a3a, 0xf4f4f4, 0x8a4ac8, 0xf2c02a, 0x3ab0e8], bottle: true });
  shelf(c, 'B', { body: 0x8a5430, inner: 0x5a3420, items: BOOKS });
});
// Góndola del almacén: estantes blancos llenos de productos de colores.
def('Ն', (c) => shelf(c, 'Ն', { body: 0xe8e8e4, inner: 0xd0d0cc, items: [0x3aa84a, 0xf2c02a, 0xd83a3a, 0x3a6ad8, 0xf28a3a, 0xf4f4f4], h: 0.92, rows: 3, d: 0.5 }));
// Heladera de bebidas: gabinete blanco, botellas de colores adentro y un cartel azul arriba.
def('Շ', (c) => {
  shelf(c, 'Շ', { body: 0xf2f4f6, inner: 0x9ad0f0, items: [0xf2c02a, 0xd83a3a, 0x3aa84a, 0xe87a2a, 0x3a6ad8], h: 1.02, rows: 3, d: 0.5, bottle: true });
  const { cx, len } = span(c, 'Շ', 0.04);
  put(c.parts, box(len, 0.1, 0.04), cx, 0.96, c.y + 0.58, 0x2a6ad8, 0.03);
});
// Casilleros del Correo (gimnasio de Mercedes): una pared de casilleros oscuros, algunos con cartas.
def('ϊ', (c) => {
  if (c.theme !== 'gym_normal') return false;
  const cx = c.x + 0.5, deep = c.ch(c.x, c.y + 1) === 'ϊ';
  const d = deep ? 1 : 0.56, cz = c.y + d / 2;
  put(c.parts, box(1, 1.0, d), cx, 0.5, cz, 0x3a3830, 0.03, c.x);
  if (deep) return;
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
    const px = c.x + 0.2 + k * 0.3, py = 0.2 + r * 0.3;
    put(c.parts, box(0.24, 0.22, 0.02), px, py, c.y + d + 0.005, 0x26241e, 0.03, r * 3 + k);
    if (rnd(c.x, c.y, r * 3 + k) > 0.55) put(c.parts, box(0.16, 0.1, 0.02), px, py - 0.02, c.y + d + 0.015, 0xf4efe0, 0, k);
  }
});
// Vitrina del museo (gimnasio de Fray Bentos): base oscura, columnitas de vidrio y una pieza adentro.
def('Ϯ', (c) => {
  if (c.theme !== 'gym_siniestro') return false;
  const cx = c.x + 0.5, cz = c.y + 0.5;
  put(c.parts, box(0.76, 0.5, 0.6), cx, 0.25, cz, 0x2a2a3a, 0.04, c.x);
  put(c.parts, box(0.8, 0.04, 0.64), cx, 0.52, cz, 0x4a4a5a, 0.03);
  for (const [dx, dz] of [[-0.36, -0.28], [0.36, -0.28], [-0.36, 0.28], [0.36, 0.28]]) put(c.parts, box(0.03, 0.38, 0.03), cx + dx, 0.73, cz + dz, 0xbfe4ff, 0.02);
  put(c.parts, box(0.76, 0.03, 0.6), cx, 0.93, cz, 0xbfe4ff, 0.02);
  put(c.parts, box(0.22, 0.06, 0.16), cx, 0.57, cz, 0xa82a3a, 0.04, c.y);
  put(c.parts, new THREE.OctahedronGeometry(0.08, 0), cx, 0.7, cz, 0xf2c02a, 0.04);
});
// Ropero: dos puertas, la raya del medio y las manijas doradas.
def('Զ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.32;
  put(c.parts, box(0.86, 1.05, 0.5), cx, 0.525, cz, 0x9a5a30, 0.04, c.x);
  put(c.parts, box(0.9, 0.06, 0.54), cx, 1.08, cz, 0x7a4424, 0.03);
  put(c.parts, box(0.02, 0.92, 0.02), cx, 0.52, cz + 0.255, 0x4a2a14, 0);
  for (const s of [-1, 1]) {
    put(c.parts, box(0.34, 0.8, 0.02), cx + s * 0.21, 0.54, cz + 0.255, 0xb06a3a, 0.04, s);
    put(c.parts, box(0.03, 0.08, 0.03), cx + s * 0.05, 0.55, cz + 0.27, 0xf2c02a, 0);
  }
});
// Heladera: blanca, freezer arriba, manijas y algún imán de color.
def('Ե', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.32;
  put(c.parts, box(0.76, 1.08, 0.52), cx, 0.54, cz, 0xf4f4f2, 0.02, c.x);
  put(c.parts, box(0.78, 0.02, 0.02), cx, 0.76, cz + 0.265, 0xb8bcc0, 0);
  put(c.parts, box(0.04, 0.16, 0.04), cx + 0.3, 0.9, cz + 0.28, 0xa8acb0, 0);
  put(c.parts, box(0.04, 0.3, 0.04), cx + 0.3, 0.52, cz + 0.28, 0xa8acb0, 0);
  for (const [dx, dy, col] of [[-0.18, 0.9, 0x3aa84a], [-0.05, 0.55, 0xd83a3a], [-0.2, 0.42, 0xf2c02a], [0.1, 0.62, 0x3a6ad8]] as const)
    put(c.parts, box(0.07, 0.06, 0.02), cx + dx, dy, cz + 0.27, col, 0);
});
// Cómoda: cajones con tiradores y arriba un portarretrato y un florero.
def('Ճ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.34;
  put(c.parts, box(0.86, 0.6, 0.5), cx, 0.3, cz, 0x8a5430, 0.04, c.x);
  put(c.parts, box(0.9, 0.05, 0.54), cx, 0.625, cz, WOOD_TOP, 0.03);
  for (let i = 0; i < 3; i++) {
    put(c.parts, box(0.76, 0.15, 0.02), cx, 0.12 + i * 0.17, cz + 0.255, 0xa86a3a, 0.04, i);
    put(c.parts, box(0.08, 0.03, 0.03), cx, 0.12 + i * 0.17, cz + 0.27, 0xf2c02a, 0);
  }
  put(c.parts, cyl(0.05, 0.07, 0.18, 7), cx - 0.22, 0.74, cz, 0x3a6ad8, 0.04);
  put(c.parts, new THREE.IcosahedronGeometry(0.07, 0), cx - 0.22, 0.86, cz, 0xe84a6a, 0.08);
  put(c.parts, box(0.18, 0.2, 0.03), cx + 0.15, 0.75, cz - 0.05, 0x3a2a1e, 0.03, c.x, -0.15);
  put(c.parts, box(0.13, 0.14, 0.01), cx + 0.15, 0.75, cz - 0.03, 0xe8dcc0, 0, c.x, -0.15);
});

// ---------------------------------------------------------------- cocina y mostradores
/** Mueble bajo de cocina o mostrador: cuerpo, tapa que sobresale y frente con paneles (en fila, sin cortes). */
function counter(c: FurnCtx, same: string, body: number, top: number, panel: number, h = 0.6, d = 0.6) {
  const { cx, len } = span(c, same, 0.03);
  const cz = c.y + 0.12 + d / 2;
  put(c.parts, box(len, h - 0.05, d), cx, (h - 0.05) / 2, cz, body, 0.03, c.x);
  put(c.parts, box(len, 0.05, d + 0.06), cx, h - 0.025, cz + 0.02, top, 0.03, c.y);
  put(c.parts, box(len, 0.05, 0.02), cx, 0.025, cz + d / 2 + 0.005, 0x2a1e18, 0); // zócalo
  for (const s of [-0.22, 0.22]) put(c.parts, box(0.38, h - 0.22, 0.02), c.x + 0.5 + s, (h - 0.05) / 2 + 0.02, cz + d / 2 + 0.01, panel, 0.04, c.x + s * 10);
  return { cx, cz, h, d };
}
def('n', (c) => {
  if (c.theme === 'poli') { // mostrador blanco con la franja verde agua
    const k = counter(c, 'n', 0xf2f6f6, 0xffffff, 0xe4ecee, 0.62);
    put(c.parts, box(span(c, 'n', 0.03).len, 0.08, 0.02), k.cx, 0.42, k.cz + k.d / 2 + 0.025, 0x2aa89a, 0.03);
    return;
  }
  if (c.theme === 'casino') { counter(c, 'n', 0x8a1a2a, 0xe8c040, 0x6a1220, 0.62); return; }
  counter(c, 'n', WOOD, WOOD_TOP, 0x9a5a30);
});
// Mostrador con caja registradora.
def('Պ', (c) => {
  const k = counter(c, 'Պ', WOOD, WOOD_TOP, 0x9a5a30);
  put(c.parts, box(0.36, 0.14, 0.26), k.cx, 0.67, k.cz, 0x8a8a92, 0.03, c.x);
  put(c.parts, box(0.3, 0.1, 0.12).rotateX(-0.5), k.cx, 0.78, k.cz - 0.08, 0x5a5a62, 0.03);
  put(c.parts, box(0.2, 0.06, 0.01).rotateX(-0.5), k.cx, 0.8, k.cz - 0.02, 0x3ac870, 0);
  put(c.parts, box(0.26, 0.04, 0.1), k.cx, 0.62, k.cz + 0.16, 0x4a4a52, 0.03);
});
// Cocina con pava: horno blanco, hornallas negras, la ventanita del horno y la pava.
def('Գ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.42;
  put(c.parts, box(0.84, 0.58, 0.6), cx, 0.29, cz, 0xf2f2ee, 0.02, c.x);
  put(c.parts, box(0.84, 0.03, 0.6), cx, 0.595, cz, 0x2a2a30, 0.02);
  for (const [dx, dz] of [[-0.2, -0.13], [0.2, -0.13], [-0.2, 0.14], [0.2, 0.14]]) put(c.parts, cyl(0.09, 0.09, 0.02, 8), cx + dx, 0.62, cz + dz, 0x4a4a52, 0.03);
  put(c.parts, box(0.62, 0.3, 0.02), cx, 0.27, cz + 0.305, 0x2a2a30, 0.02);
  put(c.parts, box(0.4, 0.14, 0.02), cx, 0.29, cz + 0.315, 0xe8803a, 0.04);
  put(c.parts, box(0.6, 0.03, 0.04), cx, 0.47, cz + 0.32, 0xb8bcc0, 0);
  put(c.parts, sph(0.1, 8, 6).scale(1, 0.8, 1), cx - 0.2, 0.7, cz - 0.13, 0xc8ccd4, 0.03); // pava
  put(c.parts, cyl(0.015, 0.025, 0.12, 4).rotateZ(-1), cx - 0.08, 0.72, cz - 0.13, 0xc8ccd4, 0);
  put(c.parts, new THREE.TorusGeometry(0.06, 0.012, 4, 8, Math.PI), cx - 0.2, 0.78, cz - 0.13, 0x2a2a30, 0);
});
// Mesada con pileta: bajo mesada de madera, tapa clara, la pileta y la canilla.
def('Դ', (c) => {
  const k = counter(c, 'Դ', WOOD, 0xf0f0ea, 0x9a5a30, 0.58);
  put(c.parts, box(0.44, 0.02, 0.32), k.cx, 0.585, k.cz, 0x8a9aa8, 0.02);
  put(c.parts, cyl(0.02, 0.02, 0.16, 5), k.cx, 0.66, k.cz - 0.2, 0xc8ccd4, 0);
  put(c.parts, cyl(0.015, 0.015, 0.14, 5).rotateX(Math.PI / 2), k.cx, 0.73, k.cz - 0.14, 0xc8ccd4, 0);
  put(c.parts, cyl(0.025, 0.025, 0.03, 6), k.cx + 0.08, 0.6, k.cz - 0.21, 0xd83a3a, 0);
  put(c.parts, cyl(0.025, 0.025, 0.03, 6), k.cx - 0.08, 0.6, k.cz - 0.21, 0x3a6ad8, 0);
});

// ---------------------------------------------------------------- máquinas
def('P', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.34;
  if (c.theme === 'casino') { // tragamonedas: gabinete rojo, rodillos, palanca
    put(c.parts, box(0.7, 1.0, 0.5), cx, 0.5, cz, 0xc8202a, 0.04, c.x);
    put(c.parts, box(0.74, 0.12, 0.54), cx, 1.06, cz, 0xf2c02a, 0.03);
    put(c.parts, box(0.56, 0.24, 0.02), cx, 0.68, cz + 0.255, 0x1a1a22, 0);
    for (let i = 0; i < 3; i++) c.glow.push(paint(at(box(0.15, 0.2, 0.02), cx - 0.18 + i * 0.18, 0.68, cz + 0.265), C([0xfff4d0, 0xf2c02a, 0x6ae070][i]), 0));
    put(c.parts, box(0.6, 0.06, 0.16), cx, 0.45, cz + 0.3, 0xf2c02a, 0.03);
    put(c.parts, cyl(0.02, 0.02, 0.36, 5), cx + 0.4, 0.8, cz, 0xc8ccd4, 0);
    put(c.parts, sph(0.05), cx + 0.4, 1.0, cz, 0xd83030, 0);
    return;
  }
  const poli = c.theme === 'poli';
  const body = poli ? 0xf2f4f4 : c.theme === 'barco' ? 0xd8d0c0 : 0xb0b4bc;
  put(c.parts, box(0.74, 0.92, 0.5), cx, 0.46, cz, body, 0.03, c.x);
  put(c.parts, box(0.6, 0.06, 0.4), cx, 0.95, cz - 0.02, 0x8a8e96, 0.03);
  put(c.parts, box(0.52, 0.28, 0.02), cx, 0.66, cz + 0.255, 0x1e2a32, 0.02);
  c.glow.push(paint(at(box(0.44, 0.06, 0.02), cx - 0.02, 0.7, cz + 0.265), C(poli ? 0x6ae0d0 : 0x6ae070), 0));
  c.glow.push(paint(at(box(0.3, 0.04, 0.02), cx - 0.09, 0.61, cz + 0.265), C(poli ? 0x6ae0d0 : 0x6ae070), 0));
  for (const [dx, col] of [[-0.16, 0xd83a3a], [0.0, poli ? 0x2aa89a : 0xf2c02a], [0.16, 0x3aa84a]] as const) put(c.parts, box(0.08, 0.06, 0.04), cx + dx, 0.38, cz + 0.27, col, 0);
  put(c.parts, box(0.34, 0.03, 0.03), cx, 0.18, cz + 0.27, 0x3a3a42, 0);
});
// Bidón de agua: el dispensador blanco con el bidón azul encima y las dos canillas.
def('Տ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.4;
  put(c.parts, box(0.36, 0.62, 0.34), cx, 0.31, cz, 0xf2f4f4, 0.02, c.x);
  put(c.parts, cyl(0.15, 0.15, 0.34, 9), cx, 0.8, cz, 0x7ac8f0, 0.04);
  put(c.parts, cyl(0.06, 0.15, 0.06, 9), cx, 0.64, cz, 0x7ac8f0, 0.04);
  put(c.parts, box(0.1, 0.04, 0.06), cx - 0.08, 0.46, cz + 0.19, 0xd83a3a, 0);
  put(c.parts, box(0.1, 0.04, 0.06), cx + 0.08, 0.46, cz + 0.19, 0x3a6ad8, 0);
  put(c.parts, box(0.3, 0.03, 0.1), cx, 0.28, cz + 0.2, 0x8a8e96, 0);
});
// Cajón congelado (Frigorífico): freezer horizontal con tapa de vidrio y escarcha.
def('ӷ', (c) => {
  const { cx, len } = span(c, 'ӷ', 0.05);
  const cz = c.y + 0.5;
  put(c.parts, box(len, 0.52, 0.8), cx, 0.26, cz, 0xe4ecf2, 0.03, c.x);
  put(c.parts, box(len - 0.1, 0.04, 0.68), cx, 0.54, cz, 0x9ad0f0, 0.04, c.y);
  put(c.parts, box(len, 0.06, 0.02), cx, 0.12, cz + 0.41, 0x8a9aa8, 0);
  for (let i = 0; i < 3; i++) put(c.parts, box(0.12, 0.03, 0.1), cx - 0.25 + i * 0.25, 0.57, cz - 0.15 + rnd(c.x, c.y, i) * 0.3, 0xffffff, 0);
});
// Máquina de niebla (PP): gabinete gris con chimenea, rejilla y la luz roja.
def('Ӹ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.45;
  put(c.parts, box(0.78, 0.72, 0.6), cx, 0.36, cz, 0x6a6e78, 0.04, c.x);
  put(c.parts, box(0.6, 0.3, 0.02), cx, 0.38, cz + 0.305, 0x2a2c32, 0.02);
  for (let i = 0; i < 4; i++) put(c.parts, box(0.56, 0.025, 0.02), cx, 0.27 + i * 0.07, cz + 0.315, 0x8a8e96, 0);
  put(c.parts, cyl(0.1, 0.12, 0.34, 8), cx - 0.16, 0.89, cz - 0.08, 0x8a8e96, 0.04);
  put(c.parts, cyl(0.13, 0.11, 0.06, 8), cx - 0.16, 1.07, cz - 0.08, 0x4a4e56, 0.03);
  c.glow.push(paint(at(sph(0.045), cx + 0.25, 0.62, cz + 0.3), C(0xff4030), 0));
});

// ---------------------------------------------------------------- almacén, campo y calle
// Cajón de frutas: cajón de listones y la fruta asomando arriba.
def('Ո', (c) => {
  const { cx, len } = span(c, 'Ո', 0.06);
  const cz = c.y + 0.5;
  put(c.parts, box(len, 0.34, 0.66), cx, 0.17, cz, 0xc8884a, 0.05, c.x);
  for (const dy of [0.08, 0.22]) put(c.parts, box(len + 0.01, 0.04, 0.67), cx, dy, cz, 0x8a5430, 0.03);
  const fr = [0xe8302a, 0xf2903a, 0x6ac83a, 0xf2d83a];
  for (let i = 0; i < 9; i++) put(c.parts, sph(0.09, 6, 4), c.x + 0.18 + (i % 3) * 0.32, 0.36, c.y + 0.28 + Math.floor(i / 3) * 0.22, fr[Math.floor(rnd(c.x, c.y, i) * 4)], 0.06, i);
});
// Bolsas de yerba apiladas.
def('Ջ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.5;
  const sack = (x: number, y: number, z: number, ry: number, s: number) => {
    put(c.parts, box(0.36, 0.2, 0.26), x, y, z, 0xece2c0, 0.04, s, ry);
    put(c.parts, box(0.37, 0.06, 0.27), x, y, z, 0x2f8a4a, 0.03, s, ry);
  };
  sack(cx - 0.2, 0.1, cz + 0.1, 0.1, 1); sack(cx + 0.18, 0.1, cz + 0.12, -0.1, 2); sack(cx, 0.1, cz - 0.18, 0.05, 3); sack(cx, 0.3, cz, 0.3, 4);
});
// Cajón de madera con listones.
def('Э', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.5, ry = (rnd(c.x, c.y) - 0.5) * 0.3;
  put(c.parts, box(0.62, 0.54, 0.62), cx, 0.27, cz, 0xc8904a, 0.05, c.x, ry);
  for (const dy of [0.06, 0.48]) put(c.parts, box(0.64, 0.06, 0.64), cx, dy, cz, 0x8a5a2e, 0.03, c.y, ry);
  put(c.parts, box(0.05, 0.5, 0.64), cx, 0.27, cz, 0x8a5a2e, 0.03, 1, ry);
});
// Fardo de pasto: bloque amarillo con los dos hilos que lo atan.
def('א', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.5, ry = (rnd(c.x, c.y) - 0.5) * 0.4;
  put(c.parts, box(0.86, 0.5, 0.56), cx, 0.25, cz, 0xe0b840, 0.07, c.x, ry);
  for (const s of [-0.2, 0.2]) {
    const ox = Math.cos(ry) * s, oz = -Math.sin(ry) * s;
    put(c.parts, box(0.03, 0.51, 0.57), cx + ox, 0.25, cz + oz, 0x9a6a2a, 0, 0, ry);
  }
  put(c.parts, box(0.8, 0.03, 0.5), cx, 0.51, cz, 0xf0d060, 0.06, c.y, ry);
});
// Barril: duelas de madera, dos zunchos y la tapa.
def('Ш', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.5;
  put(c.parts, cyl(0.26, 0.26, 0.6, 10), cx, 0.3, cz, 0x9a5a2e, 0.06, c.x);
  put(c.parts, cyl(0.3, 0.3, 0.2, 10), cx, 0.3, cz, 0xa8683a, 0.05, c.y);
  for (const dy of [0.1, 0.5]) put(c.parts, cyl(0.28, 0.28, 0.05, 10), cx, dy, cz, 0x3a3a40, 0.02);
  put(c.parts, cyl(0.24, 0.24, 0.02, 10), cx, 0.61, cz, 0x7a4424, 0.04);
});
// Rollo de pasto: un cilindro acostado, con la espiral en las caras.
def('Ξ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.52, ry = (rnd(c.x, c.y) - 0.5) * 0.5;
  put(c.parts, cyl(0.38, 0.38, 0.72, 12).rotateZ(Math.PI / 2), cx, 0.38, cz, 0xd8b040, 0.07, c.x, ry);
  for (const s of [-1, 1]) {
    const ox = Math.cos(ry) * s * 0.365, oz = -Math.sin(ry) * s * 0.365;
    put(c.parts, cyl(0.3, 0.3, 0.02, 12).rotateZ(Math.PI / 2), cx + ox, 0.38, cz + oz, 0xf0d070, 0.04, s, ry);
    put(c.parts, cyl(0.14, 0.14, 0.03, 10).rotateZ(Math.PI / 2), cx + ox, 0.38, cz + oz, 0xb08a30, 0.04, s, ry);
  }
});
// Contenedor: chapa azul acanalada (una fila de contenedores es uno largo).
def('γ', (c) => {
  const { x0, x1, w, e, cx, len } = span(c, 'γ', 0.04);
  const cz = c.y + 0.5;
  put(c.parts, box(len, 0.9, 0.84), cx, 0.45, cz, 0x2a4ab8, 0.04, c.x);
  for (let px = x0 + 0.08; px < x1 - 0.04; px += 0.14) put(c.parts, box(0.05, 0.84, 0.02), px, 0.45, cz + 0.425, 0x3a5ad0, 0.03);
  put(c.parts, box(len, 0.05, 0.86), cx, 0.9, cz, 0x1e3a90, 0.03);
  if (!w) put(c.parts, box(0.03, 0.9, 0.86), x0, 0.45, cz, 0x1e3a90, 0.03);
  if (!e) put(c.parts, box(0.03, 0.9, 0.86), x1, 0.45, cz, 0x1e3a90, 0.03);
});
// Cesto de basura verde con tapa.
def('С', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.55;
  put(c.parts, cyl(0.2, 0.16, 0.5, 9), cx, 0.25, cz, 0x2f8a4a, 0.04, c.x);
  put(c.parts, cyl(0.23, 0.23, 0.05, 9), cx, 0.52, cz, 0x3aa85a, 0.03);
  for (let i = 0; i < 3; i++) put(c.parts, box(0.02, 0.4, 0.02), cx - 0.08 + i * 0.08, 0.26, cz + 0.18, 0x1e6a34, 0);
});
// Buzón: caja roja sobre un poste, con la ranura y la banderita.
def('Π', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.55;
  put(c.parts, box(0.07, 0.5, 0.07), cx, 0.25, cz, 0x5a3a24, 0.03);
  put(c.parts, box(0.34, 0.26, 0.44), cx, 0.62, cz, 0xd8302a, 0.04, c.x);
  put(c.parts, cyl(0.17, 0.17, 0.44, 8).rotateX(Math.PI / 2).scale(1, 0.5, 1), cx, 0.75, cz, 0xd8302a, 0.04);
  put(c.parts, box(0.2, 0.025, 0.02), cx, 0.66, cz + 0.225, 0x2a1a1a, 0);
  put(c.parts, box(0.02, 0.2, 0.02), cx + 0.19, 0.72, cz + 0.05, 0x8a8a92, 0);
  put(c.parts, box(0.02, 0.07, 0.1), cx + 0.19, 0.8, cz + 0.1, 0xf2c02a, 0);
});
// Tanque australiano: aro de chapa galvanizada con el agua adentro.
def('Н', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.5;
  put(c.parts, new THREE.CylinderGeometry(0.47, 0.47, 0.44, 14, 1, true), cx, 0.22, cz, 0xa8acb2, 0.04, c.x);
  put(c.parts, cyl(0.44, 0.44, 0.02, 14), cx, 0.36, cz, 0x4a9ad8, 0.03);
  for (const dy of [0.1, 0.32]) put(c.parts, new THREE.TorusGeometry(0.475, 0.012, 3, 14).rotateX(Math.PI / 2), cx, dy, cz, 0x8a8e94, 0);
  put(c.parts, new THREE.TorusGeometry(0.47, 0.02, 3, 14).rotateX(Math.PI / 2), cx, 0.44, cz, 0xc8ccd2, 0);
});
// Bebedero de campo: pileta de hormigón con agua.
def('Ъ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.55;
  put(c.parts, box(0.86, 0.3, 0.42), cx, 0.15, cz, 0x9a9ea4, 0.05, c.x);
  put(c.parts, box(0.76, 0.02, 0.32), cx, 0.27, cz, 0x4a9ad8, 0.03);
  for (const s of [-1, 1]) put(c.parts, box(0.1, 0.06, 0.44), cx + s * 0.36, 0.03, cz, 0x7a7e84, 0.03);
});
// Bote salvavidas (Buquebus): casco naranja cerrado, con la franja de ventanitas.
def('Ϭ', (c) => {
  const cx = c.x + 0.5, cz = c.y + 0.5;
  put(c.parts, box(0.82, 0.3, 0.6), cx, 0.25, cz, 0xf07a1a, 0.04, c.x);
  put(c.parts, cyl(0.3, 0.3, 0.82, 10).rotateZ(Math.PI / 2).scale(1, 0.55, 1), cx, 0.42, cz, 0xf28a2a, 0.04, c.y);
  for (let i = 0; i < 3; i++) put(c.parts, box(0.12, 0.07, 0.02), cx - 0.24 + i * 0.24, 0.45, cz + 0.29, 0xf4f4f4, 0);
  for (const s of [-1, 1]) put(c.parts, box(0.06, 0.1, 0.62), cx + s * 0.3, 0.06, cz, 0x5a5e66, 0.03);
});
// Encomiendas (Correo): pila de cajas de cartón con cinta.
def('ϋ', (c) => {
  if (c.theme !== 'gym_normal') return false;
  const cx = c.x + 0.5, cz = c.y + 0.5;
  const pk = (x: number, y: number, z: number, w: number, h: number, ry: number, s: number) => {
    put(c.parts, box(w, h, w * 0.8), x, y + h / 2, z, 0xc8985a, 0.05, s, ry);
    put(c.parts, box(w + 0.005, 0.03, 0.05), x, y + h + 0.005, z, 0xe8d8a8, 0, s, ry);
  };
  pk(cx - 0.18, 0, cz + 0.1, 0.38, 0.3, 0.1, 1); pk(cx + 0.2, 0, cz + 0.05, 0.34, 0.26, -0.2, 2);
  pk(cx, 0, cz - 0.22, 0.4, 0.34, 0, 3); pk(cx - 0.02, 0.3, cz + 0.05, 0.3, 0.22, 0.35, 4);
});
