// Prueba visual: el mundo en 3D low-poly con Three.js.
// Las mecánicas no cambian: el mapa, los NPC y el jugador siguen en world.ts; este módulo solo los dibuja.
// Cada tile se convierte en una pieza 3D según su tipo (pasto, agua, árbol, techo, pared...) y toma sus
// colores del propio tile pixel art, así los mapas y lo que dibuja el editor se ven igual de reconocibles.
// El canvas 2D queda encima, transparente, para la lluvia, la niebla y los efectos de pantalla.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { T, TILE_INFO, tileCanvas, tileWithoutGround, groundFor, WALL_CAPS } from './tiles.ts';
import { LOOKS } from './characters.ts';
import { creatureSprite } from './creatures.ts';
import { skyHour } from './screen.ts';

const RW = 960, RH = 540; // resolución interna: se agranda sin suavizar, da el aire retro
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene, camera: THREE.PerspectiveCamera;
let sun: THREE.DirectionalLight, hemi: THREE.HemisphereLight, playerLamp: THREE.PointLight;
let staticGroup: THREE.Group | null = null;
let waterMat: THREE.MeshStandardMaterial | null = null;
let waterTime = { value: 0 };
let builtKey = '';
let drewAt = -1;
let lampSpots: { x: number; z: number; y: number; color: number; always: boolean }[] = [];
const lampPool: THREE.PointLight[] = [];
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
let camReady = false;

const STORE = 'pu-vista-3d';
let enabled = (() => { try { return localStorage.getItem(STORE) !== '0'; } catch { return true; } })();
export const is3D = () => enabled && !!renderer;
export function toggle3D() {
  enabled = !enabled;
  try { localStorage.setItem(STORE, enabled ? '1' : '0'); } catch { /* sin almacenamiento */ }
  return enabled;
}

export function mount3D(host: HTMLElement) {
  try {
    const canvas = document.createElement('canvas');
    canvas.id = 'three';
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setSize(RW, RH, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.prepend(canvas);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, RW / RH, 0.1, 200);
    hemi = new THREE.HemisphereLight(0xcfe8ff, 0x5a7a3a, 1.1);
    sun = new THREE.DirectionalLight(0xfff2d8, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80;
    sun.shadow.bias = -0.0015;
    sun.shadow.normalBias = 0.03;
    playerLamp = new THREE.PointLight(0xffe6b0, 0, 7, 1.6);
    scene.add(hemi, sun, sun.target, playerLamp);
    for (let i = 0; i < 8; i++) {
      const l = new THREE.PointLight(0xffc870, 0, 6, 1.8);
      lampPool.push(l);
      scene.add(l);
    }
    addEventListener('keydown', (e) => {
      if (e.code !== 'KeyV' || e.repeat || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      const on = toggle3D();
      badge(on ? 'Vista 3D' : 'Vista 2D');
    });
    return true;
  } catch (e) {
    console.warn('Three.js no disponible, queda la vista 2D', e);
    renderer = null;
    return false;
  }
}

function badge(text: string) {
  const host = document.getElementById('screen');
  if (!host) return;
  let b = document.getElementById('vista-badge');
  if (!b) {
    b = document.createElement('div');
    b.id = 'vista-badge';
    host.append(b);
  }
  b.textContent = `${text} · tecla V`;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
}

/** true si el mundo 3D se dibujó en este cuadro (main.ts muestra su canvas y apaga el de Pixi). */
export function drew3DThisFrame(now: number) {
  return now - drewAt < 40;
}

// ---------------------------------------------------------------- colores tomados del pixel art
const avgCache = new Map<string, THREE.Color>();
const modeCache = new Map<string, THREE.Color>();
function pixels(c: HTMLCanvasElement) {
  return c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height).data;
}
function vivid(c: THREE.Color, k = 1.12) {
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return c.setHSL(hsl.h, Math.min(1, hsl.s * k), hsl.l);
}
/** Color promedio de un tile (el suelo). */
function avgColor(key: string, c: HTMLCanvasElement) {
  let col = avgCache.get(key);
  if (col) return col;
  const d = pixels(c);
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  col = n ? vivid(new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace)) : new THREE.Color(0x78c850);
  avgCache.set(key, col);
  return col;
}
/** Los colores más usados de un objeto sin su suelo (ignora el contorno oscuro). */
function mainColors(key: string, c: HTMLCanvasElement, fallback: THREE.Color): [THREE.Color, THREE.Color] {
  const k1 = key + '|1', k2 = key + '|2';
  if (modeCache.has(k1)) return [modeCache.get(k1)!, modeCache.get(k2)!];
  const d = pixels(c);
  const count = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    if (lum < 45) continue;
    const q = ((d[i] >> 5) << 6) | ((d[i + 1] >> 5) << 3) | (d[i + 2] >> 5);
    const e = count.get(q) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2];
    count.set(q, e);
  }
  const top = [...count.values()].sort((a, b) => b.n - a.n);
  const mk = (e) => (e ? vivid(new THREE.Color().setRGB(e.r / e.n / 255, e.g / e.n / 255, e.b / e.n / 255, THREE.SRGBColorSpace), 1.18) : fallback.clone());
  const a = mk(top[0]), b = top[1] && top[1].n > top[0].n * 0.12 ? mk(top[1]) : a.clone().multiplyScalar(0.75);
  modeCache.set(k1, a); modeCache.set(k2, b);
  return [a, b];
}

// ---------------------------------------------------------------- qué es cada tile
type Kind = 'ground' | 'water' | 'tree' | 'palm' | 'bush' | 'rock' | 'cliff' | 'roof' | 'wall' | 'door' | 'fence' | 'sign' | 'lamp' | 'grass' | 'flowers' | 'ledge' | 'prop' | 'tallprop';
const WATER = new Set(['~', 'ӫ', 'ϸ', 'Ϡ', 'Ӥ', 'Ӣ']);
const CLIFF = new Set(['K', 'k', 'ϰ', 'ϱ', 'ϳ', 'ϲ', ...Object.values(WALL_CAPS).flat()]);
const ROOF = new Set(['r', 'u', 'g', 'o', 'v', 'C', 'G', 'J', 'U', 'Ӡ']);
const WALL = new Set(['H', 'w', 'W', 'I', 't', 'h', 'j', 'a', 'd', 'Q', 'ӟ', 'ӡ']);
const kindCache = new Map<string, Kind>();
function kindOf(ch: string): Kind {
  let k = kindCache.get(ch);
  if (k) return k;
  const info = TILE_INFO[ch] ?? {};
  const name: string = (info.name ?? '').toLowerCase();
  const code = ch.charCodeAt(0);
  if (WATER.has(ch) || name.includes('agua') || name.includes('mar ')) k = 'water';
  else if (ch === 'p' || name.includes('palmera')) k = 'palm';
  else if (ch === '#' || ch === 'q' || (code >= 0xe040 && code < 0xe080) || name.includes('árbol') || name.includes('ceibo') || name.includes('pino') || name.includes('eucalipto')) k = 'tree';
  else if (name.includes('seto') || name.includes('arbusto') || name.includes('hongos')) k = 'bush';
  else if (ch === 'R' || ch === 'ϴ' || ch === 'Ӿ' || name === 'roca' || name.includes('piedra')) k = 'rock';
  else if (CLIFF.has(ch) || (code >= 0xe000 && code < 0xe040) || name.includes('acantilado') || name.includes('pared de roca')) k = 'cliff';
  else if (ROOF.has(ch) || name.includes('techo') || name.includes('toldo')) k = 'roof';
  else if (WALL.has(ch) || name.includes('fachada') || name.includes('pared') || name.includes('ventana') || name.includes('edificio') || name.includes('emblema') || name.includes('muro')) k = 'wall';
  else if (ch === 'D' || name.includes('puerta')) k = info.solid ? 'wall' : 'door';
  else if (ch === 'F' || name.includes('cerco') || name.includes('reja') || name.includes('baranda')) k = 'fence';
  else if (ch === 'S' || name.includes('cartel')) k = 'sign';
  else if (ch === '|' || ch === 'Σ' || name.includes('farol') || name.includes('poste de luz')) k = 'lamp';
  else if (ch === ',' || info.enc) k = 'grass';
  else if (ch === 'f' || name.includes('flores')) k = 'flowers';
  else if (info.ledge) k = 'ledge';
  else if (info.solid) k = name.includes('faro') || name.includes('pilar') || name.includes('torre') || name.includes('estatua') || name.includes('mano') ? 'tallprop' : 'prop';
  else k = 'ground';
  kindCache.set(ch, k);
  return k;
}

// ---------------------------------------------------------------- piezas
const rnd = (x: number, y: number, s = 0) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
function paint(geo: THREE.BufferGeometry, col: THREE.Color, jitter = 0.06, seed = 0) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 3) {
    const k = 1 + (rnd(i, seed, 3) - 0.5) * jitter * 2;
    for (let j = 0; j < 3 && i + j < n; j++) { arr[(i + j) * 3] = col.r * k; arr[(i + j) * 3 + 1] = col.g * k; arr[(i + j) * 3 + 2] = col.b * k; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
function at(geo: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, s = 1) {
  if (s !== 1) geo.scale(s, s, s);
  if (ry) geo.rotateY(ry);
  geo.translate(x, y, z);
  return geo;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function hostTree(parts: THREE.BufferGeometry[], x: number, z: number, leaf: THREE.Color, trunk: THREE.Color, h: number) {
  const s = 0.85 + rnd(x, z, 1) * 0.3;
  const ox = (rnd(x, z, 2) - 0.5) * 0.15, oz = (rnd(x, z, 4) - 0.5) * 0.15;
  parts.push(paint(at(new THREE.CylinderGeometry(0.08, 0.12, 0.6 * s, 5), x + ox, h + 0.3 * s, z + oz), trunk, 0.05, x));
  const round = rnd(x, z, 5) > 0.5;
  if (round) {
    parts.push(paint(at(new THREE.IcosahedronGeometry(0.5, 0), x + ox, h + 0.95 * s, z + oz, rnd(x, z, 6) * 6, s), leaf, 0.14, z));
    parts.push(paint(at(new THREE.IcosahedronGeometry(0.34, 0), x + ox + 0.12, h + 1.35 * s, z + oz - 0.05, rnd(x, z, 7) * 6, s), leaf.clone().multiplyScalar(1.12), 0.14, x + z));
  } else {
    parts.push(paint(at(new THREE.ConeGeometry(0.55, 0.85, 6), x + ox, h + 0.9 * s, z + oz, rnd(x, z, 6) * 6, s), leaf, 0.14, z));
    parts.push(paint(at(new THREE.ConeGeometry(0.4, 0.7, 6), x + ox, h + 1.35 * s, z + oz, rnd(x, z, 7) * 6, s), leaf.clone().multiplyScalar(1.12), 0.14, x + z));
  }
}
function palm(parts: THREE.BufferGeometry[], x: number, z: number, leaf: THREE.Color, trunk: THREE.Color, h: number) {
  const lean = (rnd(x, z, 2) - 0.5) * 0.3;
  const tr = new THREE.CylinderGeometry(0.06, 0.1, 1.3, 5);
  tr.rotateZ(lean);
  parts.push(paint(at(tr, x, h + 0.65, z), trunk, 0.1, x));
  const top = new THREE.Vector3(x - Math.sin(lean) * 0.65, h + 1.3, z);
  for (let i = 0; i < 6; i++) {
    const f = new THREE.ConeGeometry(0.12, 0.8, 3);
    f.rotateZ(Math.PI / 2 + 0.35);
    f.translate(0.4, 0, 0);
    f.rotateY((i / 6) * Math.PI * 2 + rnd(x, z, 3));
    parts.push(paint(at(f, top.x, top.y, top.z), leaf, 0.12, i));
  }
}

// ---------------------------------------------------------------- construir el mapa
interface WorldView {
  map: any; tiles: string[][] | string[]; npcs: any[]; items: any[]; legend: any; player: any;
  emote: any; lit: boolean; bike: boolean; flash: number; look: string; foggy: boolean; zoom: number;
  entityPos: (e: any) => { x: number; y: number };
  tileAt: (x: number, y: number) => string | null;
}

function build(v: WorldView) {
  if (staticGroup) {
    scene.remove(staticGroup);
    staticGroup.traverse((o: any) => { o.geometry?.dispose(); });
  }
  const m = v.map;
  const tiles = v.tiles as any;
  const W = m.w, H = m.h;
  const theme = m.theme ?? null;
  const parts: THREE.BufferGeometry[] = [];
  const glow: THREE.BufferGeometry[] = [];
  lampSpots = [];
  const ch = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : tiles[y][x]);
  const isWater = (x, y) => { const c = ch(x, y); return c != null && kindOf(c) === 'water'; };
  // Suelo: una grilla de vértices con relieve leve; las orillas bajan hacia el agua.
  const gh = (vx: number, vy: number) => {
    let w = 0, n = 0, hard = false;
    for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
      const c = ch(vx + dx, vy + dy);
      if (c == null) continue;
      n++;
      if (kindOf(c) === 'water') w++;
      const k = kindOf(c);
      if (k !== 'ground' && k !== 'grass' && k !== 'flowers' && k !== 'tree') hard = true;
      if (c === '=' || c === 'c' || c === 'b' || c === '_' || c === '0') hard = true;
    }
    if (n && w === n) return -0.32;
    if (w) return -0.1;
    if (m.indoor || hard) return 0;
    return (rnd(vx, vy, 9) - 0.5) * 0.14;
  };
  const groundColor = (x: number, y: number) => {
    const c = tiles[y][x];
    const k = kindOf(c);
    const under = groundFor(tiles, x, y, m.ground, theme);
    if (k === 'ground' || k === 'grass' || k === 'flowers' || k === 'door' || k === 'ledge') {
      const key = `g|${theme}|${c}|${under}`;
      return avgColor(key, tileCanvas(c, 0, theme, under));
    }
    if (typeof under === 'string' && under !== '~') return avgColor(`g|${theme}|${under}`, tileCanvas(under, 0, theme, false));
    // bajo un objeto va el mismo suelo que lo rodea (en interiores es el piso de la sala, no pasto)
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [1, 1], [-1, 1]]) {
      const n = ch(x + dx, y + dy);
      if (n != null && (kindOf(n) === 'ground' || kindOf(n) === 'door')) {
        const u2 = groundFor(tiles, x + dx, y + dy, m.ground, theme);
        return avgColor(`g|${theme}|${n}|${u2}`, tileCanvas(n, 0, theme, u2));
      }
    }
    const base = m.indoor ? 'i' : '.';
    return avgColor(`g|${theme}|${base}`, tileCanvas(base, 0, theme, false));
  };
  {
    const pos: number[] = [];
    const col: number[] = [];
    const tmp = new THREE.Color();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const base = isWater(x, y) ? new THREE.Color(0x3a6ab0) : groundColor(x, y);
      const h00 = gh(x, y), h10 = gh(x + 1, y), h01 = gh(x, y + 1), h11 = gh(x + 1, y + 1);
      const tri = (a: number[], b: number[], c: number[], s: number) => {
        pos.push(...a, ...b, ...c);
        tmp.copy(base).multiplyScalar(1 + (rnd(x, y, s) - 0.5) * 0.08);
        for (let i = 0; i < 3; i++) col.push(tmp.r, tmp.g, tmp.b);
      };
      const A = [x, h00, y], B = [x + 1, h10, y], C = [x, h01, y + 1], D = [x + 1, h11, y + 1];
      if ((x + y) % 2) { tri(A, C, B, 1); tri(B, C, D, 2); } else { tri(A, C, D, 1); tri(A, D, B, 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    parts.push(g);
  }
  // Agua: una lámina que ondula, por encima del lecho.
  const waterGeo: THREE.BufferGeometry[] = [];
  // Objetos de cada tile
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c: string = tiles[y][x];
    const k = kindOf(c);
    const cx = x + 0.5, cz = y + 0.5;
    const objKey = `o|${theme}|${c}`;
    const fallback = groundColor(x, y);
    const colors = () => mainColors(objKey, tileWithoutGround(c, 0, theme), fallback);
    const h0 = 0;
    switch (k) {
      case 'water': {
        const q = new THREE.PlaneGeometry(1, 1, 2, 2);
        q.rotateX(-Math.PI / 2);
        q.translate(cx, -0.12, cz);
        waterGeo.push(q);
        if (c === 'Ӥ') parts.push(paint(at(new THREE.DodecahedronGeometry(0.32, 0), cx, -0.05, cz, x), new THREE.Color(0x7a7a84), 0.1, x));
        if (c === 'Ӣ') {
          parts.push(paint(at(new THREE.CylinderGeometry(0.14, 0.18, 0.5, 6), cx, 0.1, cz), new THREE.Color(0xe0263a), 0.05, x));
          glow.push(paint(at(new THREE.SphereGeometry(0.07, 6, 4), cx, 0.42, cz), new THREE.Color(0xfff0a0), 0));
        }
        if (c === 'Ϡ') parts.push(paint(at(box(1, 1.4, 0.3), cx, 0.5, y + 0.15), new THREE.Color(0xbfe4ff), 0.15, x));
        break;
      }
      case 'tree': {
        const [a, b] = colors();
        const leaf = a.getHSL({ h: 0, s: 0, l: 0 }).l > 0.15 ? a : new THREE.Color(0x3f9a3a);
        const trunk = b.r > b.g ? b : new THREE.Color(0x7a4a2a);
        hostTree(parts, cx, cz, c === 'q' ? new THREE.Color(0xd8343a) : leaf, trunk, h0);
        break;
      }
      case 'palm': palm(parts, cx, cz, new THREE.Color(0x4aa83a), new THREE.Color(0x9a6a3a), h0); break;
      case 'bush': {
        const [a, b] = colors();
        parts.push(paint(at(new THREE.IcosahedronGeometry(0.5, 0), cx, 0.35, cz, rnd(x, y) * 6), a, 0.14, x));
        parts.push(paint(at(new THREE.IcosahedronGeometry(0.12, 0), cx + 0.25, 0.65, cz + 0.25), b, 0.1, y));
        break;
      }
      case 'rock': {
        const [a] = colors();
        const s = 0.75 + rnd(x, y, 3) * 0.35;
        const g = new THREE.DodecahedronGeometry(0.45, 0);
        g.scale(1, 0.75, 1);
        parts.push(paint(at(g, cx, 0.28 * s, cz, rnd(x, y) * 6, s), a, 0.16, x + y));
        break;
      }
      case 'cliff': {
        const [a, b] = colors();
        const hh = m.indoor ? 1.1 : 1.2 + rnd(x, y, 8) * 0.25;
        const g = box(1, hh, 1);
        parts.push(paint(at(g, cx, hh / 2, cz), a, 0.12, x * 3 + y));
        parts.push(paint(at(box(1.02, 0.12, 1.02), cx, hh, cz), b.clone().lerp(new THREE.Color(0x5aa84a), m.indoor ? 0 : 0.5), 0.1, x));
        break;
      }
      case 'roof': {
        const [a, b] = colors();
        const hh = 1.75;
        parts.push(paint(at(box(1, hh - 0.25, 1), cx, (hh - 0.25) / 2, cz), b.clone().lerp(new THREE.Color(0xf2e6d0), 0.4), 0.05, x));
        // techo a dos aguas cuando hay techo arriba y abajo; tapa plana en los bordes
        const above = ch(x, y - 1), below = ch(x, y + 1);
        const ridge = above && kindOf(above) === 'roof' && below && kindOf(below) === 'roof';
        const cap = box(1.04, ridge ? 0.5 : 0.28, 1.04);
        parts.push(paint(at(cap, cx, hh - 0.25 + (ridge ? 0.25 : 0.14), cz), a, 0.06, x + y));
        break;
      }
      case 'wall': {
        const [a, b] = colors();
        const hh = m.indoor ? 1.2 : 1.5;
        parts.push(paint(at(box(1, hh, 1), cx, hh / 2, cz), a, 0.05, x + y));
        // ventanas y emblemas: un panel que sobresale en la cara frontal, con el segundo color
        if (c === 'w' || (TILE_INFO[c]?.name ?? '').includes('ventana')) {
          glow.push(paint(at(box(0.5, 0.42, 0.06), cx, hh * 0.55, cz + 0.51), new THREE.Color(0xffe8a0), 0));
        } else if (!m.indoor) {
          parts.push(paint(at(box(0.6, 0.32, 0.05), cx, hh * 0.55, cz + 0.51), b, 0.05, x));
        }
        break;
      }
      case 'door': {
        const above = ch(x, y - 1);
        if (above && (kindOf(above) === 'wall' || kindOf(above) === 'roof')) {
          parts.push(paint(at(box(0.62, 0.95, 0.08), cx, 0.48, y + 0.04), new THREE.Color(0x5a3418), 0.04, x));
          parts.push(paint(at(box(0.78, 0.1, 0.16), cx, 1.0, y + 0.06), new THREE.Color(0xe8dcc0), 0.02, x));
        }
        break;
      }
      case 'fence': {
        const [a] = colors();
        parts.push(paint(at(box(0.1, 0.55, 0.1), cx, 0.27, cz), a, 0.05, x));
        const left = ch(x - 1, y), right = ch(x + 1, y), up = ch(x, y - 1), down = ch(x, y + 1);
        const isF = (q) => q && kindOf(q) === 'fence';
        if (isF(left) || isF(right) || !(isF(up) || isF(down))) for (const yy of [0.2, 0.42]) parts.push(paint(at(box(1, 0.07, 0.05), cx, yy, cz), a, 0.04, x));
        if (isF(up) || isF(down)) for (const yy of [0.2, 0.42]) parts.push(paint(at(box(0.05, 0.07, 1), cx, yy, cz), a, 0.04, x));
        break;
      }
      case 'sign': {
        parts.push(paint(at(box(0.08, 0.5, 0.08), cx, 0.25, cz), new THREE.Color(0x6a4220), 0.04, x));
        parts.push(paint(at(box(0.7, 0.42, 0.08), cx, 0.62, cz), new THREE.Color(0xc89458), 0.06, x));
        break;
      }
      case 'lamp': {
        parts.push(paint(at(new THREE.CylinderGeometry(0.04, 0.06, 1.3, 5), cx, 0.65, cz), new THREE.Color(0x2a2a36), 0.04, x));
        glow.push(paint(at(new THREE.OctahedronGeometry(0.13, 0), cx, 1.35, cz), new THREE.Color(0xffe0a0), 0));
        lampSpots.push({ x: cx, y: 1.3, z: cz, color: 0xffd890, always: false });
        break;
      }
      case 'grass': {
        const base = groundColor(x, y);
        for (let i = 0; i < 5; i++) {
          const g = new THREE.ConeGeometry(0.1, 0.38 + rnd(x, y, i) * 0.15, 3);
          parts.push(paint(at(g, x + 0.15 + rnd(x, y, i + 10) * 0.7, 0.18, y + 0.15 + rnd(x, y, i + 20) * 0.7, rnd(x, y, i) * 3), base.clone().multiplyScalar(0.8 + rnd(x, y, i + 30) * 0.3), 0.08, i));
        }
        break;
      }
      case 'flowers': {
        const pal = [0xf2e040, 0xf26a8a, 0xffffff, 0xa86af2];
        for (let i = 0; i < 4; i++) {
          parts.push(paint(at(new THREE.OctahedronGeometry(0.07, 0), x + 0.2 + rnd(x, y, i) * 0.6, 0.1, y + 0.2 + rnd(x, y, i + 9) * 0.6), new THREE.Color(pal[(x + y + i) % 4]), 0, i));
        }
        break;
      }
      case 'ledge': {
        const [a] = colors();
        parts.push(paint(at(box(1, 0.22, 0.4), cx, 0.11, y + 0.3), a.clone().multiplyScalar(0.85), 0.05, x));
        break;
      }
      case 'prop':
      case 'tallprop': {
        const [a, b] = colors();
        const tall = k === 'tallprop';
        const hh = tall ? 2.4 : m.indoor ? 0.75 : 0.6;
        parts.push(paint(at(box(tall ? 0.7 : 0.84, hh, tall ? 0.7 : 0.84), cx, hh / 2, cz), a, 0.06, x + y));
        parts.push(paint(at(box(tall ? 0.5 : 0.6, 0.08, tall ? 0.5 : 0.6), cx, hh + 0.04, cz), b, 0.04, x));
        if (c === 'П') { glow.push(paint(at(new THREE.OctahedronGeometry(0.2, 0), cx, hh + 0.2, cz), new THREE.Color(0xff9a40), 0)); lampSpots.push({ x: cx, y: hh + 0.3, z: cz, color: 0xff9a40, always: true }); }
        break;
      }
      default: break;
    }
  }
  staticGroup = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 });
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)).map(onlyPosColor), false);
  merged.computeVertexNormals();
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  staticGroup.add(mesh);
  if (glow.length) {
    const gm = new THREE.Mesh(mergeGeometries(glow.map((p) => (p.index ? p.toNonIndexed() : p)).map(onlyPosColor), false), new THREE.MeshBasicMaterial({ vertexColors: true }));
    staticGroup.add(gm);
  }
  if (waterGeo.length) {
    const wg = mergeGeometries(waterGeo.map((p) => { const q = p.toNonIndexed(); q.deleteAttribute('uv'); q.deleteAttribute('normal'); return q; }), false);
    waterMat = new THREE.MeshStandardMaterial({ color: 0x4aa8e8, transparent: true, opacity: 0.78, roughness: 0.25, metalness: 0.1, flatShading: true });
    waterMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = waterTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        transformed.y += sin(wp.x * 2.3 + uTime * 1.7) * 0.035 + cos(wp.z * 2.9 + uTime * 1.3) * 0.035;`);
    };
    const wm = new THREE.Mesh(wg, waterMat);
    wm.receiveShadow = true;
    staticGroup.add(wm);
  }
  // Más allá del borde del mapa: el mismo suelo, más oscuro, que se pierde en la bruma.
  if (!m.indoor) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: groundColor(0, 0).clone().multiplyScalar(0.55), roughness: 1 }));
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(W / 2, -0.4, H / 2);
    edge.receiveShadow = true;
    staticGroup.add(edge);
  }
  scene.add(staticGroup);
}
function onlyPosColor(g: THREE.BufferGeometry) {
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'color') g.deleteAttribute(k);
  if (!g.attributes.color) paint(g, new THREE.Color(0xffffff), 0);
  return g;
}

// ---------------------------------------------------------------- personajes
const toonMat = new Map<string, THREE.MeshStandardMaterial>();
function matOf(color: string | number) {
  const key = String(color);
  let m = toonMat.get(key);
  if (!m) {
    const c = new THREE.Color(color as any);
    vivid(c, 1.1);
    m = new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8 });
    toonMat.set(key, m);
  }
  return m;
}
interface Figure { root: THREE.Group; legL: THREE.Object3D; legR: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D; body: THREE.Object3D; kind: string }
function part(geo: THREE.BufferGeometry, color: string | number, x: number, y: number, z: number) {
  const m = new THREE.Mesh(geo, matOf(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
function person(look: string): Figure {
  look = look || 'boy';
  const p = LOOKS[look] ?? LOOKS.boy ?? { h: '#3a2a1a', H: '#3a2a1a', s: '#f2c8a0', c: '#6a8ac8', C: '#4a6aa8', p: '#3a3a4a', b: '#1a1a1a' };
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const mkLimb = (color: string, x: number, y: number, len: number, w: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const g = box(w, len, w);
    g.translate(0, -len / 2, 0);
    const m = new THREE.Mesh(g, matOf(color));
    m.castShadow = true;
    pivot.add(m);
    body.add(pivot);
    return pivot;
  };
  const legL = mkLimb(p.p, -0.09, 0.32, 0.3, 0.13);
  const legR = mkLimb(p.p, 0.09, 0.32, 0.3, 0.13);
  body.add(part(box(0.15, 0.06, 0.2), p.b, -0.09, 0.03, 0.03), part(box(0.15, 0.06, 0.2), p.b, 0.09, 0.03, 0.03));
  body.add(part(box(0.36, 0.34, 0.24), p.c, 0, 0.48, 0));
  const armL = mkLimb(p.C ?? p.c, -0.23, 0.62, 0.3, 0.1);
  const armR = mkLimb(p.C ?? p.c, 0.23, 0.62, 0.3, 0.1);
  const head = new THREE.Group();
  head.position.set(0, 0.82, 0);
  head.add(part(box(0.32, 0.3, 0.3), p.s, 0, 0, 0));
  head.add(part(box(0.35, 0.12, 0.34), p.H ?? p.h, 0, 0.17, -0.01));
  head.add(part(box(0.35, 0.18, 0.08), p.h, 0, 0.06, -0.15));
  if (p.long) head.add(part(box(0.34, 0.3, 0.08), p.h, 0, -0.08, -0.17));
  // ojos: dos puntos oscuros en la cara
  head.add(part(box(0.05, 0.07, 0.02), '#1a1a24', -0.07, 0.0, 0.155), part(box(0.05, 0.07, 0.02), '#1a1a24', 0.07, 0.0, 0.155));
  if (look.startsWith('player')) {
    head.add(part(box(0.36, 0.04, 0.16), p.H, 0, 0.12, 0.2)); // visera de la gorra
    body.add(part(box(0.3, 0.32, 0.14), p.B, 0, 0.52, -0.18)); // mochila
    body.add(part(box(0.38, 0.07, 0.26), p.R, 0, 0.66, 0.01)); // bufanda
  }
  body.add(head);
  return { root, legL, legR, armL, armR, body, kind: 'person' };
}
function critter(species: string): Figure {
  const spr = creatureSprite(species);
  const [a, b] = mainColors(`cr|${species}`, spr, new THREE.Color(0xa08060));
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), new THREE.MeshStandardMaterial({ color: a, flatShading: true, roughness: 0.8 }));
  torso.scale.set(1, 0.85, 1.25);
  torso.position.y = 0.28;
  torso.castShadow = true;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshStandardMaterial({ color: b, flatShading: true, roughness: 0.8 }));
  head.position.set(0, 0.45, 0.22);
  head.castShadow = true;
  body.add(torso, head);
  head.add(part(box(0.04, 0.05, 0.02), '#111', -0.06, 0.03, 0.14), part(box(0.04, 0.05, 0.02), '#111', 0.06, 0.03, 0.14));
  const dummy = new THREE.Object3D();
  return { root, legL: dummy, legR: dummy, armL: dummy, armR: dummy, body, kind: 'critter' };
}
function ballFigure(): Figure {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), matOf('#e0263a'));
  const bot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), matOf('#f2f2f2'));
  top.castShadow = bot.castShadow = true;
  top.position.y = bot.position.y = 0.17;
  const band = part(new THREE.CylinderGeometry(0.165, 0.165, 0.03, 8), '#1a1a24', 0, 0.17, 0);
  body.add(top, bot, band, part(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 6).rotateX(Math.PI / 2), '#ffffff', 0, 0.17, 0.16));
  const d = new THREE.Object3D();
  return { root, legL: d, legR: d, armL: d, armR: d, body, kind: 'ball' };
}
function machineFigure(): Figure {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  body.add(part(box(0.8, 0.7, 0.6), '#4a4a5a', 0, 0.35, 0), part(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 6), '#2a2a36', 0.2, 0.85, 0));
  const panel = new THREE.Mesh(box(0.3, 0.16, 0.04), new THREE.MeshBasicMaterial({ color: 0x7af08a }));
  panel.position.set(-0.15, 0.45, 0.31);
  body.add(panel);
  const d = new THREE.Object3D();
  return { root, legL: d, legR: d, armL: d, armR: d, body, kind: 'machine' };
}
function legendFigure(species: string): Figure {
  const f = critter(species);
  f.root.scale.setScalar(2.2);
  f.kind = 'legend';
  return f;
}

const figures = new Map<any, { fig: Figure; look: string }>();
let canoe: THREE.Group | null = null;
let emoteSprite: THREE.Sprite | null = null;
function figureFor(key: any, look: string, make: () => Figure) {
  let e = figures.get(key);
  if (!e || e.look !== look) {
    if (e) scene.remove(e.fig.root);
    e = { fig: make(), look };
    figures.set(key, e);
    scene.add(e.fig.root);
  }
  return e.fig;
}
const YAW = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };

function emoteTex() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 20;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(2, 0, 12, 16); g.fillRect(6, 16, 4, 3);
  g.fillStyle = '#1a1a24'; g.fillRect(6, 3, 4, 7); g.fillRect(6, 11, 4, 3);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------------------------------------------------------------- cuadro
export function drawWorld3D(v: WorldView, t: number) {
  if (!renderer) return;
  const m = v.map;
  const key = m.id + '|' + (v.tiles as any[]).map((r) => (typeof r === 'string' ? r : r.join(''))).join('/');
  if (key !== builtKey) {
    build(v);
    builtKey = key;
    for (const [, e] of figures) scene.remove(e.fig.root);
    figures.clear();
    camReady = false;
  }
  waterTime.value = t / 1000;
  const seen = new Set<any>();
  // entidades
  const place = (keyObj: any, fig: Figure, pos: { x: number; y: number }, dir: string, moving: boolean, phase: number) => {
    seen.add(keyObj);
    const x = pos.x / T + 0.5, z = pos.y / T + 0.5;
    const gx = Math.floor(x), gz = Math.floor(z);
    const onWater = v.tileAt(gx, gz) != null && kindOf(v.tileAt(gx, gz)!) === 'water';
    fig.root.position.set(x, onWater ? -0.05 : 0, z);
    const target = YAW[dir] ?? 0;
    let d = target - fig.root.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    fig.root.rotation.y += d * 0.35;
    const sw = moving ? Math.sin(phase) * 0.7 : 0;
    fig.legL.rotation.x = sw; fig.legR.rotation.x = -sw;
    fig.armL.rotation.x = -sw * 0.8; fig.armR.rotation.x = sw * 0.8;
    fig.body.position.y = moving ? Math.abs(Math.sin(phase)) * 0.04 : 0;
  };
  const p = v.player;
  const ppos = v.entityPos(p);
  const pf = figureFor(p, v.look, () => person(v.look));
  // salto de desnivel
  const hopK = p.moving && p.from && p.y - p.from.y === 2 ? Math.min(1, p.t / p.dur) : -1;
  place(p, pf, ppos, p.dir, p.moving, (t / 1000) * (p.dur < 150 ? 22 : 14));
  if (hopK >= 0) pf.root.position.y += Math.sin(hopK * Math.PI) * 0.45;
  // canoa
  const inCanoe = v.tileAt(p.x, p.y) === '~';
  if (inCanoe) {
    if (!canoe) {
      canoe = new THREE.Group();
      canoe.add(part(box(0.5, 0.18, 1.3), '#8a5a2a', 0, 0.05, 0), part(box(0.4, 0.06, 1.1), '#5a3418', 0, 0.15, 0));
      scene.add(canoe);
    }
    canoe.visible = true;
    canoe.position.copy(pf.root.position);
    canoe.position.y = -0.1 + Math.sin(t / 400) * 0.03;
    canoe.rotation.y = pf.root.rotation.y;
    pf.root.position.y = 0.0 + Math.sin(t / 400) * 0.03;
    pf.legL.rotation.x = pf.legR.rotation.x = -1.2;
  } else if (canoe) canoe.visible = false;
  for (const n of v.npcs) {
    if (!n.visible) continue;
    const look = n.def.look;
    if (look === null) continue;
    let fig: Figure;
    if (look === 'ball') fig = figureFor(n, 'ball', ballFigure);
    else if (look === 'machine') fig = figureFor(n, 'machine', machineFigure);
    else if (typeof look === 'string' && look.startsWith('animal:')) fig = figureFor(n, look, () => critter(look.slice(7)));
    else {
      let lk = look ?? 'boy';
      if (lk === 'swimmer' && v.tileAt(n.x, n.y) !== '~') lk = 'turista';
      fig = figureFor(n, lk, () => person(lk));
    }
    place(n, fig, v.entityPos(n), n.dir, n.moving, t / 70 + n.i);
    if (fig.kind === 'critter') {
      fig.body.position.y = n.moving ? Math.abs(Math.sin(t / 90)) * 0.12 : 0;
      if (n.fly) {
        const fk = Math.min(1, (performance.now() - n.fly.t0) / n.fly.ms);
        fig.root.position.x += fk * 3;
        fig.root.position.y += fk * fk * 9;
        fig.root.position.z -= fk * 3;
      }
    }
  }
  v.items.forEach((it) => {
    const fig = figureFor(it, 'ball', ballFigure);
    place(it, fig, { x: it.x * T, y: it.y * T }, 'down', false, 0);
    fig.body.rotation.y = Math.sin(t / 600 + it.x) * 0.4;
  });
  if (v.legend) {
    const fig = figureFor(v.legend, 'legend:' + v.legend.species, () => legendFigure(v.legend.species));
    place(v.legend, fig, { x: v.legend.x * T, y: v.legend.y * T }, 'down', false, 0);
    fig.root.position.y = 0.3 + Math.sin(t / 300) * 0.15;
  }
  for (const [k, e] of figures) if (!seen.has(k)) { scene.remove(e.fig.root); figures.delete(k); }
  // emoción "!" sobre un NPC
  if (v.emote) {
    if (!emoteSprite) {
      emoteSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoteTex(), depthTest: false }));
      emoteSprite.scale.set(0.45, 0.56, 1);
      emoteSprite.renderOrder = 10;
      scene.add(emoteSprite);
    }
    const ep = v.entityPos(v.emote.npc);
    emoteSprite.visible = true;
    emoteSprite.position.set(ep.x / T + 0.5, 1.55, ep.y / T + 0.5);
  } else if (emoteSprite) emoteSprite.visible = false;

  // ---- luz del día
  const hr = skyHour();
  const night = hr >= 20 || hr < 5.5 ? 1 : hr >= 18 ? (hr - 18) / 2 * 0.6 : hr < 7.5 ? 0.35 * (7.5 - hr) / 2 : 0;
  const dusk = hr >= 17 && hr < 20 ? 1 - Math.abs(hr - 18.5) / 1.5 : hr >= 5.5 && hr < 8 ? 1 - Math.abs(hr - 6.5) / 1.5 : 0;
  const dark = !!m.dark && !v.lit;
  const sky = new THREE.Color(0x8ecdf4).lerp(new THREE.Color(0xf2a070), Math.max(0, dusk) * 0.7).lerp(new THREE.Color(0x10183a), night);
  const indoor = !!m.indoor;
  scene.background = indoor || m.dark ? new THREE.Color(0x0c0c16) : sky;
  hemi.intensity = dark ? 0.06 : indoor ? 1.3 : 1.15 - night * 0.8;
  hemi.color.set(0xcfe8ff).lerp(new THREE.Color(0x6a7ad8), night);
  sun.intensity = dark ? 0 : indoor ? 1.2 : 2.6 * (1 - night * 0.85);
  sun.color.set(0xfff2d8).lerp(new THREE.Color(0xff9a50), Math.max(0, dusk) * 0.8).lerp(new THREE.Color(0x8aa0ff), night);
  const px = ppos.x / T + 0.5, pz = ppos.y / T + 0.5;
  sun.position.set(px - 8, 18, pz + 6);
  sun.target.position.set(px, 0, pz);
  playerLamp.position.set(px, 1.4, pz + 0.3);
  playerLamp.intensity = dark ? 6 : indoor ? 0 : night * 1.5;
  playerLamp.distance = dark ? 6 : 5;
  // faroles y fogones más cercanos
  const lit = lampSpots.filter((l) => l.always || night > 0.3).sort((a, b) => (a.x - px) ** 2 + (a.z - pz) ** 2 - ((b.x - px) ** 2 + (b.z - pz) ** 2));
  lampPool.forEach((l, i) => {
    const s = lit[i];
    if (!s) { l.intensity = 0; return; }
    l.position.set(s.x, s.y, s.z);
    l.color.set(s.color);
    l.intensity = (s.always ? 3 : 4 * night) * (0.9 + 0.1 * Math.sin(t / 130 + s.x * 3));
  });
  // niebla: clima, máquinas de niebla del PP y cuevas

  // ---- cámara: sigue al jugador desde arriba y atrás, como mirar el mapa en diagonal
  const zoom = v.zoom >= 2 ? 0.8 : 1;
  const dist = (indoor ? 10 : 15) * zoom;
  const camD = Math.hypot(dist * 0.95, dist * 0.78);
  if (dark) scene.fog = new THREE.Fog(0x05050c, camD - 1, camD + 5);
  else if (v.foggy) scene.fog = new THREE.Fog(0xc8d0dc, camD - 2, camD + 7);
  else if (!indoor) scene.fog = new THREE.Fog(sky.getHex(), camD + 10, camD + 34);
  else scene.fog = null;
  let tx = px, tz = pz;
  if (indoor) { tx = (tx * 2 + m.w / 2) / 3; tz = (tz * 2 + m.h / 2) / 3; }
  const want = new THREE.Vector3(tx, dist * 0.95, tz + dist * 0.78);
  const look = new THREE.Vector3(tx, 0.4, tz + 0.2);
  if (!camReady) { camPos.copy(want); camLook.copy(look); camReady = true; }
  camPos.lerp(want, 0.12);
  camLook.lerp(look, 0.16);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  renderer.render(scene, camera);
  drewAt = performance.now();
}
