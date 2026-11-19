// Prueba visual: el mundo en 3D low-poly con Three.js.
// Las mecánicas no cambian: el mapa, los NPC y el jugador siguen en world.ts; este módulo solo los dibuja.
// Cada tile se convierte en una pieza 3D según su tipo (pasto, agua, árbol, techo, pared...) y toma sus
// colores del propio tile pixel art, así los mapas y lo que dibuja el editor se ven igual de reconocibles.
// El canvas 2D queda encima, transparente, para la lluvia, la niebla y los efectos de pantalla.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { T, TILE_INFO, tileCanvas, tileWithoutGround, groundFor, WALL_CAPS } from './tiles.ts';
import { charSprite } from './characters.ts';
import { drawGroundBall } from './items.ts';
import { canoeCanvas } from './ui-icons.ts';
import { creatureSprite } from './creatures.ts';
import { skyHour } from './screen.ts';

const PHI_CAM = Math.atan2(0.95, 0.78); // inclinación de la cámara
const RW = 1920, RH = 1080; // resolución completa: los sprites pixel art quedan nítidos
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
/** Otra escena 3D (los combates) con el mismo renderizador; cuenta como cuadro 3D para mostrar su canvas. */
export function render3DScene(sc: THREE.Scene, cam: THREE.Camera) {
  if (!renderer) return;
  renderer.render(sc, cam);
  drewAt = performance.now();
}
export const RENDER_SIZE = { w: 1920, h: 1080 };

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
const WALL = new Set(['ι', 'H', 'w', 'W', 'I', 't', 'h', 'j', 'a', 'd', 'Q', 'ӟ', 'ӡ']);
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
export const rnd = (x: number, y: number, s = 0) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
export function paint(geo: THREE.BufferGeometry, col: THREE.Color, jitter = 0.06, seed = 0) {
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
export function at(geo: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, s = 1) {
  if (s !== 1) geo.scale(s, s, s);
  if (ry) geo.rotateY(ry);
  geo.translate(x, y, z);
  return geo;
}
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

export function hostTree(parts: THREE.BufferGeometry[], x: number, z: number, leaf: THREE.Color, trunk: THREE.Color, h: number) {
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
export function palm(parts: THREE.BufferGeometry[], x: number, z: number, leaf: THREE.Color, trunk: THREE.Color, h: number) {
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
    staticGroup.traverse((o: any) => { if (o.geometry !== objGeo) o.geometry?.dispose(); });
  }
  for (const sm of staticMats.splice(0)) { boardMats.delete(sm); sm.map?.dispose(); sm.dispose(); }
  bldMesh = null;
  const m = v.map;
  const tiles = v.tiles as any;
  const W = m.w, H = m.h;
  const theme = m.theme ?? null;
  const parts: THREE.BufferGeometry[] = [];
  const glow: THREE.BufferGeometry[] = [];
  const sprites: { c: string; x: number; y: number }[] = [];
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
  // Edificios afuera: cada columna de techo + fachada se arma como una casa 3D con su propio pixel art
  // (fachada vertical con puerta, ventanas, cruz de la policlínica o emblema del gimnasio; techo a dos aguas).
  const bld = m.indoor ? new Set<number>() : buildBuildings(m, tiles, theme, parts, groundColor);
  // Objetos de cada tile
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (bld.has(y * W + x)) continue;
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
      case 'fence':
      case 'sign':
      case 'lamp':
        sprites.push({ c, x, y });
        if (k === 'lamp') lampSpots.push({ x: cx, y: 0.85, z: y + 0.9, color: 0xffd890, always: false });
        break;
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
      case 'tallprop':
        sprites.push({ c, x, y });
        if (c === 'П') lampSpots.push({ x: cx, y: 0.6, z: y + 0.8, color: 0xff9a40, always: true });
        break;
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
  if (bldMesh) staticGroup.add(bldMesh);
  // objetos en pixel art: un cartel por tile, agrupados por tipo de tile (una sola llamada de dibujo cada uno)
  const byChar = new Map<string, { x: number; y: number }[]>();
  for (const sp of sprites) (byChar.get(sp.c) ?? byChar.set(sp.c, []).get(sp.c)!).push(sp);
  const mtx = new THREE.Matrix4();
  for (const [c, list] of byChar) {
    const bm = boardMat(objectCanvas(c, theme));
    staticMats.push(bm);
    const im = new THREE.InstancedMesh(objGeo, bm, list.length);
    list.forEach((sp, i) => im.setMatrixAt(i, mtx.makeTranslation(sp.x + 0.5, 0, sp.y + 1)));
    im.castShadow = true;
    staticGroup.add(im);
  }
  scene.add(staticGroup);
}
// ---------------------------------------------------------------- edificios con su pixel art
let bldMesh: THREE.Mesh | null = null;
const isBld = (tiles, W: number, H: number, x: number, y: number): boolean => {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const k = kindOf(tiles[y][x]);
  if (k === 'roof' || k === 'wall') return true;
  if (k === 'door') { const a = y > 0 ? kindOf(tiles[y - 1][x]) : null; return a === 'roof' || a === 'wall'; }
  return false;
};
const FACADE_H = Math.tan(PHI_CAM); // así una fila de fachada se ve en pantalla igual de alta que en el mapa 2D
function buildBuildings(m, tiles, theme: string | null, parts: THREE.BufferGeometry[], groundColor: (x: number, y: number) => THREE.Color) {
  const W = m.w, H = m.h;
  const used = new Set<number>();
  // atlas con los tiles de edificio que usa este mapa
  const cells = new Map<string, number>();
  const cellOf = (c: string) => { let i = cells.get(c); if (i == null) { i = cells.size; cells.set(c, i); } return i; };
  const pos: number[] = [], uv: number[] = [], nor: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[], cell: number) => {
    // a-b arriba (izq-der), d-c abajo (izq-der); la normal sale de la cara
    const col = cell % 32, row = Math.floor(cell / 32);
    const u0 = (col * 16 + 0.05) / 512, u1 = ((col + 1) * 16 - 0.05) / 512;
    const v1 = 1 - (row * 16 + 0.05) / 512, v0 = 1 - ((row + 1) * 16 - 0.05) / 512;
    const n = new THREE.Vector3().subVectors(new THREE.Vector3(...d), new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a))).normalize();
    for (const [p, q] of [[a, [u0, v1]], [d, [u0, v0]], [b, [u1, v1]], [b, [u1, v1]], [d, [u0, v0]], [c, [u1, v0]]] as [number[], number[]][]) {
      pos.push(...p); uv.push(...q); nor.push(n.x, n.y, n.z);
    }
  };
  // cada edificio (tiles de edificio conectados) comparte una misma altura de caballete: el techo queda parejo
  const comp = new Int32Array(W * H).fill(-1);
  const compRidge: number[] = [];
  const colOf = (x: number, y0: number) => { let y1 = y0; while (isBld(tiles, W, H, x, y1 + 1)) y1++; let F = 0; while (y1 - F >= y0 && kindOf(tiles[y1 - F][x]) !== 'roof') F++; return { y1, F: Math.max(1, F) }; };
  for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) {
    if (comp[sy * W + sx] >= 0 || !isBld(tiles, W, H, sx, sy)) continue;
    const id = compRidge.length;
    let best = 0;
    const stack = [[sx, sy]];
    comp[sy * W + sx] = id;
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (!isBld(tiles, W, H, cx, cy - 1)) { const { y1, F } = colOf(cx, cy); best = Math.max(best, F * FACADE_H + Math.max(0.5, (y1 + 1 - cy) * 0.32)); }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (isBld(tiles, W, H, nx, ny) && comp[ny * W + nx] < 0) { comp[ny * W + nx] = id; stack.push([nx, ny]); }
      }
    }
    compRidge.push(best);
  }
  for (let x = 0; x < W; x++) {
    let y = 0;
    while (y < H) {
      if (!isBld(tiles, W, H, x, y)) { y++; continue; }
      const y0 = y;
      while (y < H && isBld(tiles, W, H, x, y)) y++;
      const y1 = y - 1;
      // filas de fachada: las de abajo que no son techo
      let F = 0;
      while (y1 - F >= y0 && kindOf(tiles[y1 - F][x]) !== 'roof') F++;
      if (F === 0) F = 1; // solo techo: la última fila hace de fachada
      const R = y1 - y0 + 1 - F;
      for (let yy = y0; yy <= y1; yy++) used.add(yy * W + x);
      const front = y1 + 1, back = y0;
      const top = F * FACADE_H;
      const D = front - back;
      const zm = (front + back) / 2;
      const ridge = Math.max(top + 0.3, compRidge[comp[y0 * W + x]] ?? top + Math.max(0.5, D * 0.32));
      const x0 = x, x1 = x + 1;
      // fachada: una cara por fila, de abajo hacia arriba
      for (let i = 0; i < F; i++) {
        const c = tiles[y1 - i][x];
        quad([x0, (i + 1) * FACADE_H, front], [x1, (i + 1) * FACADE_H, front], [x1, i * FACADE_H, front], [x0, i * FACADE_H, front], cellOf(c));
      }
      // techo: las filas de techo del 2D van del caballete al alero por la cara de adelante, y repetidas atrás
      const roofRows = R > 0 ? Array.from({ length: R }, (_, i) => tiles[y0 + i][x]) : [tiles[y0][x]];
      const n = roofRows.length;
      for (let i = 0; i < n; i++) {
        const k0 = i / n, k1 = (i + 1) / n;
        const za = zm + (front - zm) * k0, zb = zm + (front - zm) * k1;
        const ha = ridge + (top - ridge) * k0, hb = ridge + (top - ridge) * k1;
        quad([x0, ha, za], [x1, ha, za], [x1, hb, zb], [x0, hb, zb], cellOf(roofRows[i]));
        const zc = zm + (back - zm) * k0, zd = zm + (back - zm) * k1;
        quad([x1, ha, zc], [x0, ha, zc], [x0, hb, zd], [x1, hb, zd], cellOf(roofRows[i]));
      }
      // paredes de los costados (frontón) y de atrás, del color de la fachada
      const wallCol = avgColor(`f|${theme}|${tiles[y1][x]}`, tileCanvas(tiles[y1][x], 0, theme, false)).clone().multiplyScalar(0.92);
      const gable = (xs: number, flip: boolean) => {
        const g = new THREE.BufferGeometry();
        const P = [[xs, 0, front], [xs, top, front], [xs, ridge, zm], [xs, top, back], [xs, 0, back]];
        const tri = [[0, 1, 2], [0, 2, 3], [0, 3, 4]];
        const arr: number[] = [];
        for (const t of tri) for (const o of [t, [t[0], t[2], t[1]]]) for (const j of o) arr.push(...P[j]); // las dos caras
        g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
        parts.push(paint(g, wallCol, 0.03, xs));
      };
      const sameRun = (xx: number) => isBld(tiles, W, H, xx, y0) && isBld(tiles, W, H, xx, y1) && !isBld(tiles, W, H, xx, y0 - 1) && !isBld(tiles, W, H, xx, y1 + 1);
      if (!sameRun(x - 1)) gable(x0, true);
      if (!sameRun(x + 1)) gable(x1, false);
      const bw = box(1, top, 0.02);
      parts.push(paint(at(bw, x + 0.5, top / 2, back + 0.01), wallCol, 0.03, x));
      // escalón de la vereda frente a la fachada
      parts.push(paint(at(box(1, 0.06, 0.18), x + 0.5, 0.03, front + 0.09), groundColor(x, Math.min(H - 1, front)).clone().multiplyScalar(0.85), 0.02, x));
    }
  }
  if (cells.size) {
    const atlas = document.createElement('canvas');
    atlas.width = atlas.height = 512;
    const g = atlas.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    for (const [c, i] of cells) g.drawImage(tileCanvas(c, 0, theme, false), (i % 32) * 16, Math.floor(i / 32) * 16);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    const mat = boardMat(atlas);
    mat.alphaTest = 0;
    mat.side = THREE.FrontSide;
    staticMats.push(mat);
    bldMesh = new THREE.Mesh(geo, mat);
    bldMesh.castShadow = true;
    bldMesh.receiveShadow = true;
  }
  return used;
}

function onlyPosColor(g: THREE.BufferGeometry) {
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'color') g.deleteAttribute(k);
  if (!g.attributes.color) paint(g, new THREE.Color(0xffffff), 0);
  return g;
}

// ---------------------------------------------------------------- pixel art parado en el mundo
// Personajes y objetos son los mismos sprites del juego 2D, puestos como carteles dentro de la escena 3D:
// el terreno, los árboles y el agua son low-poly, y lo que tiene cara o detalle sigue siendo pixel art.
const PHI = PHI_CAM;
// Los objetos se inclinan apenas hacia atrás: así un tile de objeto ocupa en pantalla justo su casillero y
// los objetos de varios tiles (faro, carteles grandes) se apilan sin cortes, como en el mapa 2D.
const TILT_OBJ = 2 * PHI - Math.PI / 2;
// Los personajes miran de frente a la cámara: se ven sin achatarse.
const TILT_CHAR = Math.PI / 2 - PHI;
const texCache = new WeakMap<HTMLCanvasElement, THREE.Texture>();
function texOf(c: HTMLCanvasElement) {
  let t = texCache.get(c);
  if (!t) {
    t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(c, t);
  }
  return t;
}
const boardMats = new Set<THREE.MeshLambertMaterial>();
function boardMat(c: HTMLCanvasElement) {
  const map = texOf(c);
  const m = new THREE.MeshLambertMaterial({ map, emissiveMap: map, emissive: 0xffffff, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false });
  boardMats.add(m);
  return m;
}
/** Luz de los sprites: casi todo es su propio color (fiel al pixel art) y el resto lo pone la luz de la escena. */
function lightBoards(day: number, dark: boolean) {
  for (const m of boardMats) {
    m.color.setScalar(dark ? 1.2 : 0.3);
    m.emissiveIntensity = dark ? 0 : day;
  }
}
const boardGeo = (w: number, h: number, tilt: number) => {
  const g = new THREE.PlaneGeometry(w, h);
  g.translate(0, h / 2, 0);
  g.rotateX(-tilt);
  return g;
};
const objGeo = boardGeo(1, 1, TILT_OBJ);
const staticMats: THREE.MeshLambertMaterial[] = [];
const objCanvas = new Map<string, HTMLCanvasElement>();
function objectCanvas(c: string, theme: string | null) {
  const k = `${theme}|${c}`;
  let cv = objCanvas.get(k);
  if (!cv) { cv = tileWithoutGround(c, 0, theme); objCanvas.set(k, cv); }
  return cv;
}

const toonMat = new Map<string, THREE.MeshStandardMaterial>();
function matOf(color: string | number) {
  const key = String(color);
  let m = toonMat.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color as any), flatShading: true, roughness: 0.8 });
    toonMat.set(key, m);
  }
  return m;
}
function part(geo: THREE.BufferGeometry, color: string | number, x: number, y: number, z: number) {
  const m = new THREE.Mesh(geo, matOf(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

interface Board { root: THREE.Object3D; mesh: THREE.Mesh | null; mat: THREE.MeshLambertMaterial | null; key: string; w: number; h: number }
function board(c: HTMLCanvasElement, wTiles: number, tilt = TILT_CHAR): Board {
  const w = wTiles, h = (c.height / c.width) * wTiles;
  const mat = boardMat(c);
  const mesh = new THREE.Mesh(boardGeo(w, h, tilt), mat);
  mesh.castShadow = true;
  const root = new THREE.Group();
  root.add(mesh);
  return { root, mesh, mat, key: '', w, h };
}
function setBoardCanvas(b: Board, c: HTMLCanvasElement) {
  if (b.mat && b.mat.map?.image !== c) { const t = texOf(c); b.mat.map = t; b.mat.emissiveMap = t; b.mat.needsUpdate = true; }
}
function machineBoard(): Board {
  const root = new THREE.Group();
  root.add(part(box(0.8, 0.7, 0.6), '#4a4a5a', 0, 0.35, 0), part(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 6), '#2a2a36', 0.2, 0.85, 0));
  const panel = new THREE.Mesh(box(0.3, 0.16, 0.04), new THREE.MeshBasicMaterial({ color: 0x7af08a }));
  panel.position.set(-0.15, 0.45, 0.31);
  root.add(panel);
  return { root, mesh: null, mat: null, key: '', w: 1, h: 1 };
}
let ballCv: HTMLCanvasElement | null = null;
function ballCanvas() {
  if (!ballCv) {
    ballCv = document.createElement('canvas');
    ballCv.width = 16; ballCv.height = 16;
    drawGroundBall(ballCv.getContext('2d'), 0, 0);
  }
  return ballCv;
}

const boards = new Map<any, Board>();
let canoeBoard: Board | null = null;
let emoteSprite: THREE.Sprite | null = null;
const dropBoard = (b: Board) => { scene.remove(b.root); if (b.mat) { boardMats.delete(b.mat); b.mat.dispose(); } };
function boardFor(keyObj: any, key: string, make: () => Board) {
  let b = boards.get(keyObj);
  if (!b || b.key !== key) {
    if (b) dropBoard(b);
    b = make();
    b.key = key;
    boards.set(keyObj, b);
    scene.add(b.root);
  }
  return b;
}

function emoteTex() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 20;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(2, 0, 12, 16); g.fillRect(6, 16, 4, 3);
  g.fillStyle = '#1a1a24'; g.fillRect(6, 3, 4, 7); g.fillRect(6, 11, 4, 3);
  return texOf(c);
}

/** Pose de caminata, igual que en el mapa 2D. */
function poseOf(n: any, player: boolean, rowing: boolean) {
  if (rowing) return 0;
  if (player && n.moving) return n.t < n.dur / 2 ? (n.step % 2) + 1 : n.step % 2 ? 3 : 0;
  if (n.moving) return ((n.step ?? Math.floor(n.t / 100)) % 2) + 1;
  return 0;
}

// ---------------------------------------------------------------- cuadro
export function drawWorld3D(v: WorldView, t: number) {
  if (!renderer) return;
  const m = v.map;
  const key = m.id + '|' + (v.tiles as any[]).map((r) => (typeof r === 'string' ? r : r.join(''))).join('/');
  if (key !== builtKey) {
    build(v);
    builtKey = key;
    for (const [, b] of boards) dropBoard(b);
    boards.clear();
    camReady = false;
  }
  waterTime.value = t / 1000;
  const seen = new Set<any>();
  const onWaterAt = (x: number, z: number) => { const c = v.tileAt(Math.floor(x), Math.floor(z)); return c != null && kindOf(c) === 'water'; };
  // Un personaje se para en el centro de su casillero, un poco hacia adelante (como sus pies en el sprite 2D).
  const stand = (b: Board, pos: { x: number; y: number }) => {
    const x = pos.x / T + 0.5, z = pos.y / T + 0.72;
    b.root.position.set(x, onWaterAt(x, z - 0.2) ? -0.06 : 0, z);
  };
  const p = v.player;
  const ppos = v.entityPos(p);
  const inCanoe = v.tileAt(p.x, p.y) === '~';
  const pb = boardFor(p, 'player:' + v.look, () => board(charSprite(v.look, 'down', 0), 1));
  seen.add(p);
  setBoardCanvas(pb, charSprite(v.look, p.dir, poseOf(p, true, inCanoe)));
  stand(pb, ppos);
  // salto de desnivel: el sprite sube y baja, la sombra queda en el suelo
  const hopK = p.moving && p.from && p.y - p.from.y === 2 ? Math.min(1, p.t / p.dur) : -1;
  if (hopK >= 0) pb.root.position.y += Math.sin(hopK * Math.PI) * 0.45;
  if (inCanoe) {
    const cv = canoeCanvas(p.dir);
    if (!canoeBoard) { canoeBoard = board(cv, cv.width / T); scene.add(canoeBoard.root); }
    setBoardCanvas(canoeBoard, cv);
    canoeBoard.root.visible = true;
    const bob = Math.sin(t / 400) * 0.03;
    canoeBoard.root.position.set(pb.root.position.x, -0.12 + bob, pb.root.position.z + 0.05);
    pb.root.position.y = 0.05 + bob;
  } else if (canoeBoard) canoeBoard.root.visible = false;
  for (const n of v.npcs) {
    if (!n.visible) continue;
    const look = n.def.look;
    if (look === null) continue;
    seen.add(n);
    if (look === 'machine') { const b = boardFor(n, 'machine', machineBoard); b.root.position.set(n.x + 0.5, 0, n.y + 0.5); continue; }
    if (look === 'ball') { const b = boardFor(n, 'ball', () => board(ballCanvas(), 1)); stand(b, v.entityPos(n)); continue; }
    if (typeof look === 'string' && look.startsWith('animal:')) {
      // criaturas a lo lejos: su sprite de combate en chico, dan saltitos al moverse
      const cv = creatureSprite(look.slice(7));
      const b = boardFor(n, look, () => board(cv, 1.5));
      stand(b, v.entityPos(n));
      b.root.scale.x = n.dir === 'left' ? -1 : 1;
      b.root.position.y += n.moving ? Math.abs(Math.sin(t / 90)) * 0.12 : 0;
      if (n.fly) {
        const fk = Math.min(1, (performance.now() - n.fly.t0) / n.fly.ms);
        b.root.position.x += fk * 3;
        b.root.position.y += fk * fk * 9;
        b.root.position.z -= fk * 3;
      }
      continue;
    }
    let lk = look ?? 'boy';
    if (lk === 'swimmer' && v.tileAt(n.x, n.y) !== '~') lk = 'turista';
    const b = boardFor(n, lk, () => board(charSprite(lk, 'down', 0), 1));
    setBoardCanvas(b, charSprite(lk, n.dir, poseOf(n, false, false)));
    stand(b, v.entityPos(n));
  }
  v.items.forEach((it) => {
    seen.add(it);
    const b = boardFor(it, 'ball', () => board(ballCanvas(), 1));
    stand(b, { x: it.x * T, y: it.y * T });
  });
  if (v.legend) {
    seen.add(v.legend);
    const b = boardFor(v.legend, 'legend:' + v.legend.species, () => board(creatureSprite(v.legend.species), 2));
    stand(b, { x: v.legend.x * T, y: v.legend.y * T });
    b.root.position.y = Math.sin(t / 300) * 0.12;
  }
  for (const [k, b] of boards) if (!seen.has(k)) { dropBoard(b); boards.delete(k); }
  // emoción "!" sobre un NPC
  if (v.emote) {
    if (!emoteSprite) {
      emoteSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoteTex(), depthTest: false, toneMapped: false }));
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
  lightBoards(dark ? 0 : indoor ? 0.85 : 0.85 * (1 - night * 0.65) * (1 - Math.max(0, dusk) * 0.1), dark);
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
