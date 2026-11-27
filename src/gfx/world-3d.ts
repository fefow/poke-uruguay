// Prueba visual: el mundo en 3D low-poly con Three.js.
// Las mecánicas no cambian: el mapa, los NPC y el jugador siguen en world.ts; este módulo solo los dibuja.
// Cada tile se convierte en una pieza 3D según su tipo (pasto, agua, árbol, techo, pared...) y toma sus
// colores del propio tile pixel art, así los mapas y lo que dibuja el editor se ven igual de reconocibles.
// El canvas 2D queda encima, transparente, para la lluvia, la niebla y los efectos de pantalla.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { T, TILE_INFO, THEMES, tileCanvas, topCanvas, tileWithoutGround, groundFor, WALL_CAPS, elevAt, cliffAt, themeOf, tollBoardCanvas, TOLL_BOARD_H } from './tiles.ts';
import { TOLL_FLOOR, TOLL_ROOF, TOLL_H, TOLL_V, TOLL_BOARD, tollZone } from '../data/toll-chars.ts';
import { PROPS_3D, type PropCtx } from './props-3d.ts';
import { cellCanvas, pieceKey } from './edges.ts';
import { charSprite } from './characters.ts';
import { drawGroundBall } from './items.ts';
import { canoeCanvas } from './ui-icons.ts';
import { creatureSprite } from './creatures.ts';
import { overworldCreature } from './overworld-creatures.ts';
import { skyHour } from './screen.ts';

const PHI_CAM = Math.atan2(0.95, 0.78); // inclinación de la cámara
const RW = 1920, RH = 1080; // resolución completa: los sprites pixel art quedan nítidos
let renderer: THREE.WebGLRenderer | null = null;
// Niebla alrededor del jugador (como el degradé del mapa 2D): un THREE.Fog con `near` negativo no se mide desde la
// cámara sino en el suelo, desde el punto que la cámara mira (el jugador). Así la niebla del PP tapa todo a unos
// casilleros del jugador también hacia abajo de la pantalla, no solo a lo lejos.
THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n\tvarying float vFogDepth;\n\tvarying float vFogRing;\n#endif';
THREE.ShaderChunk.fog_vertex = `#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	vec3 fogW = cameraPosition + transpose( mat3( viewMatrix ) ) * mvPosition.xyz;
	vec3 fogF = - vec3( viewMatrix[ 0 ][ 2 ], viewMatrix[ 1 ][ 2 ], viewMatrix[ 2 ][ 2 ] );
	vec3 fogC = cameraPosition + fogF * ( ( cameraPosition.y - 0.4 ) / max( 0.05, - fogF.y ) );
	vFogRing = length( fogW.xz - fogC.xz ) + max( 0.0, fogW.y - 1.2 ) * 0.5;
#endif`;
THREE.ShaderChunk.fog_pars_fragment = THREE.ShaderChunk.fog_pars_fragment.replace('varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying float vFogRing;');
THREE.ShaderChunk.fog_fragment = THREE.ShaderChunk.fog_fragment.replace(
  'float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );',
  'float fogFactor = fogNear < 0.0 ? smoothstep( - fogNear, fogFar, vFogRing ) : smoothstep( fogNear, fogFar, vFogDepth );',
);

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
const prevWant = new THREE.Vector3();
const prevLook = new THREE.Vector3();
let camReady = false;

const STORE = 'pu-vista-3d';
let enabled = (() => { try { return localStorage.getItem(STORE) !== '0'; } catch { return true; } })();
export const is3D = () => enabled && !!renderer;
export function toggle3D() {
  enabled = !enabled;
  try { localStorage.setItem(STORE, enabled ? '1' : '0'); } catch { /* sin almacenamiento */ }
  return enabled;
}
/** Hay 3D en este equipo (WebGL anduvo) y la vista elegida: la usan las opciones y el botón del celular. */
export const has3D = () => !!renderer;
export const view3DOn = () => enabled;
/** Cambia de vista como la tecla V (opciones, botón 3D/2D del celular) y avisa con el cartelito. */
export function switchView() {
  const on = toggle3D();
  badge(on ? 'Vista 3D' : 'Vista 2D');
  for (const f of viewListeners) f(on);
  return on;
}
const viewListeners: ((on: boolean) => void)[] = [];
export const onViewChange = (f: (on: boolean) => void) => { viewListeners.push(f); };

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
      switchView();
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
const PATHS = new Set(['=', 'c', '_', '0', '-', ':', '/', 's', '?']);
const kindCache = new Map<string, Kind>();
function kindOf(ch: string): Kind {
  let k = kindCache.get(ch);
  if (k) return k;
  const info = TILE_INFO[ch] ?? {};
  const name: string = (info.name ?? '').toLowerCase();
  const code = ch.charCodeAt(0);
  if (WATER.has(ch) || name === 'agua' || name.startsWith('agua ') || name.startsWith('mar ')) k = 'water'; // 'bidón de agua' o 'fachada gimnasio agua' no son agua
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
// Height of the ground under the cell being built (plateaus of the `elev` layer): every object is lifted by it.
let LIFT = 0;
/** Ground height at a point of the current map (0 on flat maps), for people and things that stand on it. */
let liftAt: (x: number, z: number) => number = () => 0;
const LEVEL_H = 0.75; // one level of the `elev` layer, in tiles
export function at(geo: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, s = 1) {
  if (s !== 1) geo.scale(s, s, s);
  if (ry) geo.rotateY(ry);
  geo.translate(x, y + LIFT, z);
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

// ---------------------------------------------------------------- texturas pixel art sobre el low-poly
// Un atlas por mapa con los tiles 2D que usa: el suelo, los caminos, los árboles, las rocas y los muros
// llevan su propio dibujo encima de la forma 3D.
const AT = 1024, CELL = 16, PER = AT / CELL;
type Rect = [number, number, number, number]; // u0 v0 u1 v1
class Atlas {
  canvas = document.createElement('canvas');
  g: CanvasRenderingContext2D;
  cells = new Map<string, number>();
  constructor() { this.canvas.width = this.canvas.height = AT; this.g = this.canvas.getContext('2d')!; this.g.imageSmoothingEnabled = false; }
  rect(key: string, draw: () => HTMLCanvasElement, fill?: THREE.Color): Rect {
    let i = this.cells.get(key);
    if (i == null) {
      i = this.cells.size;
      if (i >= PER * PER) i = 0; // atlas lleno (no pasa en mapas reales): reusa la primera celda
      else {
        this.cells.set(key, i);
        const x = (i % PER) * CELL, y = Math.floor(i / PER) * CELL;
        if (fill) { this.g.fillStyle = '#' + fill.getHexString(THREE.SRGBColorSpace); this.g.fillRect(x, y, CELL, CELL); }
        this.g.drawImage(draw(), x, y, CELL, CELL);
      }
    }
    const x = (i % PER) * CELL, y = Math.floor(i / PER) * CELL;
    const e = 0.02;
    return [(x + e) / AT, 1 - (y + CELL - e) / AT, (x + CELL - e) / AT, 1 - (y + e) / AT];
  }
}
/** Geometría texturizada que se arma de a triángulos (posición, uv y un leve tinte por cara). */
class TexGeo {
  pos: number[] = []; uv: number[] = []; col: number[] = [];
  tri(p: number[][], q: number[][], k = 1) {
    for (let i = 0; i < 3; i++) { this.pos.push(...p[i]); this.uv.push(...q[i]); this.col.push(k, k, k); }
  }
  /** Proyecta el dibujo sobre una forma: 'front' de frente (copas, rocas), 'box' cara por cara (muros, acantilados). */
  add(geo: THREE.BufferGeometry, r: Rect, mode: 'front' | 'box', box3: { x0: number; y0: number; z0: number; w: number; h: number; d: number }, vr: [number, number] = [0, 1], seed = 0, topR: Rect | null = null) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const P = g.attributes.position;
    const [u0, v0, u1, v1] = r;
    const V0 = v0 + (v1 - v0) * vr[0], V1 = v0 + (v1 - v0) * vr[1];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < P.count; i += 3) {
      a.fromBufferAttribute(P, i); b.fromBufferAttribute(P, i + 1); c.fromBufferAttribute(P, i + 2);
      n.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
      const top = mode === 'box' && Math.abs(n.y) > 0.6;
      const side = mode === 'box' && !top && Math.abs(n.x) > Math.abs(n.z);
      const uvOf = (p: THREE.Vector3) => {
        if (top && topR) return [(topR[0] + topR[2]) / 2, (topR[1] + topR[3]) / 2];
        let s: number, t: number;
        if (top) { s = (p.x - box3.x0) / box3.w; t = 1 - (p.z - box3.z0) / box3.d; }
        else { s = side ? (p.z - box3.z0) / box3.d : (p.x - box3.x0) / box3.w; t = (p.y - LIFT - box3.y0) / box3.h; }
        s = Math.min(1, Math.max(0, s)); t = Math.min(1, Math.max(0, t));
        return [u0 + (u1 - u0) * s, V0 + (V1 - V0) * t];
      };
      const k = 1 + (rnd(i, seed, 5) - 0.5) * 0.12;
      this.tri([[a.x, a.y, a.z], [b.x, b.y, b.z], [c.x, c.y, c.z]], [uvOf(a), uvOf(b), uvOf(c)], k);
    }
  }
  mesh(atlas: Atlas, cutout = false) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    geo.computeVertexNormals();
    const tex = new THREE.CanvasTexture(atlas.canvas);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0, alphaTest: cutout ? 0.5 : 0, side: cutout ? THREE.DoubleSide : THREE.FrontSide });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
}

/** Color liso de la tapa de un muro: el color del muro, un poco más oscuro. */
const capCache = new Map<string, THREE.Color>();
function wallCap(key: string, c: HTMLCanvasElement) {
  let col = capCache.get(key);
  if (!col) { col = avgColor(key + '|avg', c).clone().multiplyScalar(0.72); capCache.set(key, col); }
  return col;
}
function solidCanvas(col: THREE.Color) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = '#' + col.getHexString(THREE.SRGBColorSpace);
  g.fillRect(0, 0, 16, 16);
  return c;
}
// ---------------------------------------------------------------- muebles y objetos con volumen
// El dibujo 2D de un mueble ya viene en vista 3/4: arriba se ve la tapa y abajo el frente. Se "dobla" el sprite
// por esa línea y queda una caja: la tapa lleva la parte de arriba del dibujo, el frente la de abajo y los
// costados repiten el borde. fr = parte del dibujo (en filas con pintura) que es frente; h = alto en casilleros
// (sin h, sale del dibujo); d = fondo. thin = placa fina (cercos, carteles): todo el dibujo va de frente.
interface Furn { fr: number; h?: number; d?: number; thin?: boolean }
const FURN: Record<string, Furn> = {};
const furn = (chars: string, f: Furn) => { for (const c of chars) FURN[c] = f; };
furn('TԹЗԿӹ', { fr: 0.4, h: 0.5 }); // mesas y escritorios
furn('Ը', { fr: 0.55, h: 0.5 }); // sillas
furn('EՍ', { fr: 0.3, h: 0.34 }); // camas y camillas
furn('BԶԵՇՆϊϮ', { fr: 0.82, h: 0.95, d: 0.5 }); // bibliotecas, roperos, heladeras, góndolas, vitrinas
furn('ԳԴnՊՃ', { fr: 0.55, h: 0.58 }); // cocina, mesada, mostradores, cómoda
furn('ԱԲՌΔד', { fr: 0.5, h: 0.42 }); // sofás y bancos
furn('ՈՋЭӷϋאΞШγ', { fr: 0.6 }); // cajones, bolsas, fardos, barriles, contenedores
furn('PϼϻӸ', { fr: 0.62 }); // máquinas
furn('СΠՏ', { fr: 0.75 }); // cestos, buzones, bidones
furn('ϒϓϔНЪѢϬ', { fr: 0.5 }); // puestos, tablado, tanques, bebedero, cabina
furn('Fρ[', { fr: 1, thin: true, d: 0.14 }); // cercos, tapias, barandas
furn('SחЩЛ<>', { fr: 1, thin: true, d: 0.1 }); // carteles y mojones
const FURN_NAMES: [RegExp, Furn][] = [
  [/cerco|reja|baranda|tapia/, { fr: 1, thin: true, d: 0.14 }],
  [/cartel|mojón/, { fr: 1, thin: true, d: 0.1 }],
  [/mesa|escritorio/, { fr: 0.4, h: 0.5 }],
  [/cama|camilla/, { fr: 0.3, h: 0.34 }],
  [/biblioteca|estante|ropero|heladera|góndola|vitrina|armario|casilleros/, { fr: 0.82, h: 0.95, d: 0.5 }],
  [/silla|banco|sofá/, { fr: 0.5, h: 0.42 }],
  [/mostrador|mesada|cocina|cómoda/, { fr: 0.55, h: 0.58 }],
  [/cajón|caja|barril|fardo|contenedor|máquina|equipo|bidón|cesto|buzón|puesto/, { fr: 0.6 }],
];
function furnOf(c: string): Furn | null {
  if (c in FURN) return FURN[c];
  const name: string = (TILE_INFO[c]?.name ?? '').toLowerCase();
  for (const [re, f] of FURN_NAMES) if (re.test(name)) return (FURN[c] = f);
  return null;
}
/** Filas y columnas con pintura de un dibujo de 16×16 (sin suelo). */
const bbCache = new Map<string, [number, number, number, number] | null>();
function opaqueBox(key: string, c: HTMLCanvasElement) {
  if (bbCache.has(key)) return bbCache.get(key)!;
  const d = pixels(c), w = c.width, h = c.height;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const r: [number, number, number, number] | null = x1 < 0 ? null : [x0 * 16 / w, y0 * 16 / h, (x1 + 1) * 16 / w, (y1 + 1) * 16 / h];
  bbCache.set(key, r);
  return r;
}
/** Caja de un mueble en el casillero (tx, ty), con el dibujo doblado entre tapa y frente. */
function foldBox(tg: TexGeo, r: Rect, tx: number, ty: number, bb: [number, number, number, number], f: Furn, run = false) {
  const [px0, py0, px1, py1] = bb;
  const rows = py1 - py0;
  const frontPx = f.thin ? rows : Math.max(1, Math.round(rows * f.fr));
  const fold = py1 - frontPx; // fila donde termina la tapa y empieza el frente
  // un cerco o tapia que sigue hacia arriba o abajo en el mapa es una tira continua: ocupa todo el casillero
  // de fondo, baja, y su dibujo 2D (visto desde arriba) va en la tapa
  const h = run ? 0.45 : f.h ?? Math.min(1.6, (frontPx / 16) * 1.15);
  const d = run ? 1 : f.d ?? Math.min(0.9, Math.max(0.2, ((fold - py0) / 16) * 1.1));
  const X0 = tx + px0 / 16, X1 = tx + px1 / 16;
  const Zf = run ? ty + 1 : f.thin ? ty + 0.5 + d / 2 : Math.min(ty + 0.97, ty + py1 / 16), Zb = Zf - d;
  const [u0, v0, u1, v1] = r;
  const U = (px: number) => u0 + (u1 - u0) * (px / 16), V = (py: number) => v1 - (v1 - v0) * (py / 16);
  const quad = (a: number[], b: number[], c: number[], e: number[], ua: number[], ub: number[], uc: number[], ue: number[], k: number) => {
    // a b arriba (izq, der), c e abajo (izq, der), mirando la cara de frente
    tg.tri([a, c, b], [ua, uc, ub], k);
    tg.tri([b, c, e], [ub, uc, ue], k);
  };
  // frente
  quad([X0, h, Zf], [X1, h, Zf], [X0, 0, Zf], [X1, 0, Zf], [U(px0), V(fold)], [U(px1), V(fold)], [U(px0), V(py1)], [U(px1), V(py1)], 1);
  // tapa: en una placa fina, la fila de arriba del dibujo; si no, la parte de arriba del sprite
  const t0 = py0, t1 = run ? py1 : f.thin ? py0 + 1 : Math.max(fold, py0 + 1);
  quad([X0, h, Zb], [X1, h, Zb], [X0, h, Zf], [X1, h, Zf], [U(px0), V(t0)], [U(px1), V(t0)], [U(px0), V(t1)], [U(px1), V(t1)], 1.06);
  // costados: repiten la columna del borde del frente
  const sl = [U(px0), U(Math.min(px1, px0 + 1))], sr = [U(Math.max(px0, px1 - 1)), U(px1)];
  quad([X0, h, Zb], [X0, h, Zf], [X0, 0, Zb], [X0, 0, Zf], [sl[0], V(fold)], [sl[1], V(fold)], [sl[0], V(py1)], [sl[1], V(py1)], 0.78);
  quad([X1, h, Zf], [X1, h, Zb], [X1, 0, Zf], [X1, 0, Zb], [sr[0], V(fold)], [sr[1], V(fold)], [sr[0], V(py1)], [sr[1], V(py1)], 0.78);
  // fondo (afuera la cámara puede verlo de lejos)
  quad([X1, h, Zb], [X0, h, Zb], [X1, 0, Zb], [X0, 0, Zb], [U(px0), V(fold)], [U(px1), V(fold)], [U(px0), V(py1)], [U(px1), V(py1)], 0.7);
}

// ---------------------------------------------------------------- construir el mapa
interface WorldView {
  map: any; tiles: string[][] | string[]; npcs: any[]; items: any[]; legend: any; player: any;
  emote: any; lit: boolean; bike: boolean; flash: number; look: string; zoom: number;
  /** niebla: 'machine' (máquina del PP encendida, densa), 'story' (Cabo Polonio / Quebrada sin despejar), 'weather' (clima) */
  fog: 'machine' | 'story' | 'weather' | null;
  entityPos: (e: any) => { x: number; y: number };
  tileAt: (x: number, y: number) => string | null;
}

// ---------------------------------------------------------------- peaje (ver data/toll.ts)
let tollRoof: { mat: THREE.MeshStandardMaterial; k: number } | null = null;
const TOLL_PAVED = new Set([TOLL_H, TOLL_V].flatMap((s) => [s.island, s.open, s.closed, s.nose, s.paved]));
const TC = {
  concrete: new THREE.Color(0xd4d0c4), booth: new THREE.Color(0xf4f6f8), blue: new THREE.Color(0x1f4fa8), glass: new THREE.Color(0x8ac8e8),
  yellow: new THREE.Color(0xf2c02a), red: new THREE.Color(0xd8302a), white: new THREE.Color(0xf4f2ea), dark: new THREE.Color(0x1a1a22),
  roof: new THREE.Color(0xdfe3e8), steel: new THREE.Color(0x8a8a92), cone: new THREE.Color(0xf07a1a), green: new THREE.Color(0x4af060), lamp: new THREE.Color(0xf03a3a),
};
/**
 * La plaza de peaje en 3D: islas con su cabina, barreras (bajas en los carriles cerrados, arriba en los abiertos), la valla
 * de hormigón, las patas del cartel y el techo con su luz por carril (verde abierto, rojo cerrado). Todo se ubica con
 * r = a lo largo de la fila de cabinas y t = en el sentido de la ruta; en una ruta este-oeste la fila va de norte a sur.
 */
function buildToll(m, parts: THREE.BufferGeometry[], glow: THREE.BufferGeometry[], fade: THREE.BufferGeometry[]) {
  const T0 = m.toll;
  const V = !!T0.vertical;
  const P = V ? TOLL_V : TOLL_H;
  const piece = (list: THREE.BufferGeometry[], cx: number, cz: number, r: number, y: number, t: number, sr: number, sy: number, st: number, col: THREE.Color, jitter = 0.04) => {
    const g = V ? box(st, sy, sr) : box(sr, sy, st);
    const x = cx + (V ? t : r), z = cz + (V ? r : t);
    list.push(paint(at(g, x, liftAt(x, z) + y, z), col, jitter, Math.round(x * 7 + z * 3)));
  };
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const c = m.tiles[y][x];
    if (!TOLL_FLOOR.has(c)) continue;
    const cx = x + 0.5, cz = y + 0.5;
    if (c === P.island) {
      piece(parts, cx, cz, 0, 0.06, 0, 0.56, 0.12, 1, TC.concrete);
      piece(parts, cx, cz, 0, 0.5, 0, 0.46, 0.8, 0.6, TC.booth, 0.02);
      piece(parts, cx, cz, 0, 0.95, 0, 0.52, 0.1, 0.66, TC.blue, 0.02);
      for (const s of [-1, 1]) piece(parts, cx, cz, s * 0.235, 0.55, 0, 0.02, 0.32, 0.4, TC.glass, 0);
    } else if (c === P.nose) {
      piece(parts, cx, cz, 0, 0.06, 0, 0.46, 0.12, 1, TC.concrete);
      for (const t of [-0.3, 0, 0.3]) piece(parts, cx, cz, 0, 0.125, t, 0.4, 0.015, 0.12, TC.yellow, 0);
      parts.push(paint(at(new THREE.CylinderGeometry(0.06, 0.07, 0.42, 6), cx, liftAt(cx, cz) + 0.33, cz), TC.yellow, 0.02, x));
    } else if (c === P.barrier) {
      piece(parts, cx, cz, 0, 0.2, 0, 1, 0.4, 0.3, TC.concrete, 0.05);
      piece(parts, cx, cz, 0, 0.42, 0, 1, 0.06, 0.16, TC.concrete.clone().multiplyScalar(1.08), 0.03);
    } else if (c === P.open || c === P.closed) {
      piece(parts, cx, cz, -0.4, 0.3, 0, 0.1, 0.6, 0.1, TC.yellow);
      if (c === P.closed) {
        for (let i = 0; i < 4; i++) piece(parts, cx, cz, -0.3 + i * 0.2, 0.52, 0, 0.2, 0.06, 0.06, i % 2 ? TC.white : TC.red, 0);
        for (const [r, t] of [[-0.1, -0.33], [0.2, 0.33]]) {
          const px = cx + (V ? t : r), pz = cz + (V ? r : t);
          parts.push(paint(at(new THREE.ConeGeometry(0.08, 0.24, 6), px, liftAt(px, pz) + 0.12, pz), TC.cone, 0.02, x));
        }
      } else for (let i = 0; i < 4; i++) piece(parts, cx, cz, -0.4, 0.66 + i * 0.2, 0, 0.06, 0.2, 0.06, i % 2 ? TC.white : TC.red, 0);
    }
  }
  // patas del cartel azul (el cartel en sí es un plano con su dibujo, ver build)
  if (T0.board) for (const dx of [0.25, TOLL_BOARD.length - 0.25]) { const x = T0.board.x + dx, z = T0.board.y + 0.5; parts.push(paint(at(box(0.08, 1.1, 0.08), x, liftAt(x, z) + 0.55, z), TC.steel, 0.02, dx)); }
  // techo: una losa sobre toda la fila, con su frente azul a los dos lados y pilares en las islas
  const H0 = 1.55;
  const lo = T0.lo, hi = T0.hi + 1, mid = (lo + hi) / 2, len = hi - lo;
  const a0 = T0.a + 0.5;
  const rc = (r: number, t: number) => (V ? [a0 + t, r] : [r, a0 + t]);
  const [mx, mz] = rc(mid, 0);
  const base = liftAt(mx, mz);
  const slab = (r: number, y: number, t: number, sr: number, sy: number, st: number, col: THREE.Color, list = fade) => {
    const [x, z] = rc(r, t);
    list.push(paint(at(V ? box(st, sy, sr) : box(sr, sy, st), x, base + y, z), col, 0.02, Math.round(r * 5)));
  };
  slab(mid, H0, 0, len + 0.2, 0.1, 1.3, TC.roof);
  for (const s of [-1, 1]) slab(mid, H0 - 0.04, s * 0.66, len + 0.24, 0.3, 0.06, TC.blue);
  for (const i of T0.islands) { const r = (V ? i.y : i.x) + 0.5; for (const s of [-1, 1]) slab(r, H0 / 2, s * 0.42, 0.1, H0, 0.1, TC.steel, parts); }
  // luces de cada carril: en el frente (de los dos lados) y una grande arriba del techo, que se ve desde la cámara
  for (const l of T0.lanes) {
    const r = (V ? l.y : l.x) + 0.5;
    const col = l.open ? TC.green : TC.lamp;
    for (const s of [-1, 1]) {
      slab(r, H0 - 0.04, s * 0.7, 0.34, 0.18, 0.04, TC.dark, parts);
      const [x, z] = rc(r, s * 0.73);
      glow.push(paint(at(new THREE.SphereGeometry(0.075, 8, 6), x, base + H0 - 0.04, z), col, 0));
    }
    const [x, z] = rc(r, 0);
    glow.push(paint(at(V ? box(0.4, 0.05, 0.3) : box(0.3, 0.05, 0.4), x, base + H0 + 0.08, z), col, 0));
  }
}
function build(v: WorldView) {
  if (staticGroup) {
    scene.remove(staticGroup);
    staticGroup.traverse((o: any) => { if (o.geometry !== objGeo) o.geometry?.dispose(); });
    for (const t of staticTex.splice(0)) { (t.material as any).map?.dispose(); (t.material as any).dispose(); }
  }
  for (const sm of staticMats.splice(0)) { boardMats.delete(sm); sm.map?.dispose(); sm.dispose(); }
  bldMesh = null;
  const m = v.map;
  const tiles = v.tiles as any;
  const W = m.w, H = m.h;
  const theme = m.theme ?? null;
  const parts: THREE.BufferGeometry[] = [];
  const glow: THREE.BufferGeometry[] = [];
  const atlas = new Atlas();
  const tg = new TexGeo();
  const fg = new TexGeo(); // muebles: su dibujo recortado (con transparencia)
  const sprites: { c: string; x: number; y: number; lift: number }[] = [];
  lampSpots = [];
  const ch = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : tiles[y][x]);
  const isWater = (x, y) => { const c = ch(x, y); return c != null && kindOf(c) === 'water'; };
  // Suelo: una grilla de vértices con relieve leve; las orillas bajan hacia el agua.
  // Plateaus: a corner of the grid takes the lowest height of the cells round it, so the edge cells (the cliffs)
  // slope down and the tops stay flat.
  const lev = (x: number, y: number) => (m.indoor ? 0 : elevAt(m, x, y));
  const gh = (vx: number, vy: number) => {
    let low = 99;
    for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) if (ch(vx + dx, vy + dy) != null) low = Math.min(low, lev(vx + dx, vy + dy));
    return gh0(vx, vy) + (low === 99 ? 0 : low * LEVEL_H);
  };
  const gh0 = (vx: number, vy: number) => {
    let w = 0, n = 0, hard = false, paths = 0;
    for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
      const c = ch(vx + dx, vy + dy);
      if (c == null) continue;
      n++;
      if (PATHS.has(c)) paths++;
      if (kindOf(c) === 'water') w++;
      const k = kindOf(c);
      if (k !== 'ground' && k !== 'grass' && k !== 'flowers' && k !== 'tree') hard = true;
      if (c === '=' || c === 'c' || c === 'b' || c === '_' || c === '0') hard = true;
      if (TOLL_FLOOR.has(c)) hard = true;
    }
    if (n && w === n) return -0.32;
    if (w) return -0.1;
    if (n && paths === n && !m.indoor) return -0.05; // los caminos van apenas hundidos: se marcan solos
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
  // el dibujo 2D del suelo de cada casillero (bajo un objeto, el suelo que lo rodea)
  const groundTile = (x: number, y: number): [string, () => HTMLCanvasElement] => {
    const c = tiles[y][x];
    const k = kindOf(c);
    if (TOLL_PAVED.has(c)) return [`g|toll|${c}`, () => tileCanvas(c, 0, null, false)]; // el piso del peaje (carriles, islas)
    if (k === 'water') return ['g|~', () => tileCanvas('~', 0, null, false)];
    if (!m.indoor && cliffAt(m, tiles, x, y)) return ['g|K', () => tileCanvas('K', 0, null, false)]; // a cliff face
    const under = groundFor(tiles, x, y, m.ground, theme);
    if (k === 'ground' || k === 'grass' || k === 'flowers' || k === 'door' || k === 'ledge') {
      // afuera, los bordes de camino, arena y pastizal son piezas propias (ver edges.ts)
      if (!m.indoor) { const th = themeOf(m, c); return [`g|${th}|${pieceKey(tiles, x, y, th)}|${under}|${m.ground ?? ''}`, () => cellCanvas(tiles, x, y, 0, th, under, m.ground ?? null)]; }
      return [`g|${theme}|${c}|${under}`, () => tileCanvas(c, 0, theme, under)];
    }
    if (typeof under === 'string' && under !== '~') return [`g|${theme}|${under}`, () => tileCanvas(under, 0, theme, false)];
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [1, 1], [-1, 1]]) {
      const n = ch(x + dx, y + dy);
      if (n != null && (kindOf(n) === 'ground' || kindOf(n) === 'door')) {
        const u2 = groundFor(tiles, x + dx, y + dy, m.ground, theme);
        return [`g|${theme}|${n}|${u2}`, () => tileCanvas(n, 0, theme, u2)];
      }
    }
    const base = m.indoor ? 'i' : '.';
    return [`g|${theme}|${base}`, () => tileCanvas(base, 0, theme, false)];
  };
  {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const [gk, gc] = groundTile(x, y);
      const r = atlas.rect(gk, gc);
      const h00 = gh(x, y), h10 = gh(x + 1, y), h01 = gh(x, y + 1), h11 = gh(x + 1, y + 1);
      const [u0, v0, u1, v1] = r;
      const A = [x, h00, y], B = [x + 1, h10, y], C = [x, h01, y + 1], D = [x + 1, h11, y + 1];
      const uA = [u0, v1], uB = [u1, v1], uC = [u0, v0], uD = [u1, v0];
      const k1 = 1 + (rnd(x, y, 1) - 0.5) * 0.06, k2 = 1 + (rnd(x, y, 2) - 0.5) * 0.06;
      if ((x + y) % 2) { tg.tri([A, C, B], [uA, uC, uB], k1); tg.tri([B, C, D], [uB, uC, uD], k2); }
      else { tg.tri([A, C, D], [uA, uC, uD], k1); tg.tri([A, D, B], [uA, uD, uB], k2); }
    }
  }
  // la altura del suelo en cualquier punto (interpolada entre las esquinas), para lo que se para encima
  liftAt = m.elev && !m.indoor ? (px: number, pz: number) => {
    const vx = Math.max(0, Math.min(W - 1, Math.floor(px))), vz = Math.max(0, Math.min(H - 1, Math.floor(pz)));
    const fx = Math.max(0, Math.min(1, px - vx)), fz = Math.max(0, Math.min(1, pz - vz));
    const a = gh(vx, vz) * (1 - fx) + gh(vx + 1, vz) * fx, b = gh(vx, vz + 1) * (1 - fx) + gh(vx + 1, vz + 1) * fx;
    return Math.max(0, a * (1 - fz) + b * fz);
  } : () => 0;
  // Agua: una lámina que ondula, por encima del lecho.
  const waterGeo: THREE.BufferGeometry[] = [];
  // Edificios afuera: cada columna de techo + fachada se arma como una casa 3D con su propio pixel art
  // (fachada vertical con puerta, ventanas, cruz de la policlínica o emblema del gimnasio; techo a dos aguas).
  const bld = m.indoor ? new Set<number>() : buildBuildings(m, tiles, theme, parts, groundColor);
  // Objetos low-poly (props-3d.ts) en lugar del cartel pixel art. Si el tema del mapa redibuja ese tile como otra
  // cosa (la N de los gimnasios no es una maceta), queda el cartel.
  const propCtx: Omit<PropCtx, 'x' | 'y'> = {
    parts, glow, water: waterGeo, ch, facadeH: FACADE_H,
    bldBelow: (x, y) => { let n = 0; while (isBld(tiles, W, H, x, y + 1 + n)) n++; return n; },
    lamp: (x, y, z, color, always) => { lampSpots.push({ x, y, z, color, always }); },
  };
  const lowPoly = (c: string, x: number, y: number) => {
    const gen = PROPS_3D[c];
    if (!gen) return false;
    const th = theme ? (THEMES as any)[theme] : null;
    if (th && Object.prototype.hasOwnProperty.call(th, c) && !SAME_IN_THEMES.has(c)) return false;
    return gen({ ...propCtx, x, y }) !== false;
  };
  // Objetos de cada tile
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (bld.has(y * W + x)) continue;
    const c: string = tiles[y][x];
    if (TOLL_FLOOR.has(c)) continue; // el peaje se arma aparte (buildToll)
    const k = kindOf(c);
    const cx = x + 0.5, cz = y + 0.5;
    const objKey = `o|${theme}|${c}`;
    const fallback = groundColor(x, y);
    const colors = () => mainColors(objKey, tileWithoutGround(c, 0, theme), fallback);
    const h0 = 0;
    LIFT = m.elev && !m.indoor && k !== 'water' ? lev(x, y) * LEVEL_H - (cliffAt(m, tiles, x, y) ? LEVEL_H / 2 : 0) : 0;
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
        const g: THREE.BufferGeometry[] = [];
        hostTree(g, cx, cz, c === 'q' ? new THREE.Color(0xd8343a) : leaf, trunk, h0);
        // tronco con su color; las copas llevan las hojas del dibujo 2D del árbol
        parts.push(g[0]);
        const r = atlas.rect(objKey, () => tileWithoutGround(c, 0, theme), leaf);
        for (const q of g.slice(1)) { q.computeBoundingBox(); const bb = q.boundingBox!; tg.add(q, r, 'front', { x0: bb.min.x, y0: bb.min.y, z0: bb.min.z, w: bb.max.x - bb.min.x, h: bb.max.y - bb.min.y, d: bb.max.z - bb.min.z }, [0.35, 1], x + y); }
        break;
      }
      case 'palm': palm(parts, cx, cz, new THREE.Color(0x4aa83a), new THREE.Color(0x9a6a3a), h0); break;
      case 'bush': {
        const [a] = colors();
        const r = atlas.rect(objKey, () => tileWithoutGround(c, 0, theme), a);
        const g = at(new THREE.IcosahedronGeometry(0.5, 0), cx, 0.35, cz, rnd(x, y) * 6);
        tg.add(g, r, 'front', { x0: cx - 0.5, y0: -0.15, z0: cz - 0.5, w: 1, h: 1, d: 1 }, [0, 1], x);
        break;
      }
      case 'rock': {
        const [a] = colors();
        const s = 0.75 + rnd(x, y, 3) * 0.35;
        const g = new THREE.DodecahedronGeometry(0.45, 0);
        g.scale(1, 0.75, 1);
        at(g, cx, 0.28 * s, cz, rnd(x, y) * 6, s);
        const r = atlas.rect(objKey, () => tileWithoutGround(c, 0, theme), a);
        tg.add(g, r, 'front', { x0: cx - 0.45 * s, y0: 0, z0: cz - 0.45 * s, w: 0.9 * s, h: 0.65 * s, d: 0.9 * s }, [0.1, 0.9], x + y);
        break;
      }
      case 'cliff': {
        const [a] = colors();
        const hh = m.indoor ? 1.1 : 1.2 + rnd(x, y, 8) * 0.25;
        const r = atlas.rect(objKey, () => tileWithoutGround(c, 0, theme), a);
        tg.add(at(box(1, hh, 1), cx, hh / 2, cz), r, 'box', { x0: x, y0: 0, z0: y, w: 1, h: hh, d: 1 }, [0, 1], x * 3 + y);
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
        // muros de interiores (los edificios de afuera los arma buildBuildings): llevan su dibujo, con cuadros y relojes
        // Solo el muro del fondo de cada sala (con piso adelante) va alto y muestra su dibujo de frente; el resto
        // queda bajo, como una maqueta cortada, para que ningún muro tape al jugador ni la sala de adelante.
        const [a] = colors();
        const below = ch(x, y + 1);
        // es muro de fondo si adelante no hay otro muro (un mueble contra la pared no lo baja)
        const back = !m.indoor || (below != null && kindOf(below) !== 'wall' && kindOf(below) !== 'cliff' && kindOf(below) !== 'roof');
        // el muro de fondo de la sala (macizo hasta el borde de arriba) va alto; los tabiques de adentro, a media altura
        let outer = true;
        for (let yy = y - 1; yy >= 0 && outer; yy--) if (!TILE_INFO[ch(x, yy) ?? 'x']?.solid) outer = false;
        const hh = m.indoor ? (back ? (outer ? 1.05 : 0.55) : 0.3) : 1.5;
        const r = atlas.rect(`w|${theme}|${c}`, () => tileCanvas(c, 0, theme, false), a);
        // la tapa del muro va lisa: con el dibujo encima, ventanas, cuadros y relojes se veían dos veces
        const capCol = wallCap(`w|${theme}|${c}`, tileCanvas(c, 0, theme, false));
        const cap = atlas.rect(`wc|${capCol.getHexString()}`, () => solidCanvas(capCol));
        tg.add(at(box(1, hh, 1), cx, hh / 2, cz), r, 'box', { x0: x, y0: 0, z0: y, w: 1, h: hh, d: 1 }, [0, 1], x + y, cap);
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
      case 'lamp': {
        const f = k === 'lamp' ? null : furnOf(c);
        const cv = f && objectCanvas(c, theme);
        const bb = cv && opaqueBox(`${theme}|${c}`, cv);
        if (f && bb) { foldBox(fg, atlas.rect(`o|${theme}|${c}`, () => cv), x, y, bb, f, !!f.thin && (ch(x, y - 1) === c || ch(x, y + 1) === c)); break; }
        if (!lowPoly(c, x, y)) sprites.push({ c, x, y, lift: LIFT });
        if (k === 'lamp') lampSpots.push({ x: cx, y: 0.85, z: y + 0.9, color: 0xffd890, always: false });
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
        const r = atlas.rect(`l|${theme}|${c}`, () => tileCanvas(c, 0, theme, groundFor(tiles, x, y, m.ground, theme)), a);
        tg.add(at(box(1, 0.22, 0.4), cx, 0.11, y + 0.3), r, 'box', { x0: x, y0: 0, z0: y + 0.1, w: 1, h: 0.22, d: 0.4 }, [0, 1], x);
        break;
      }
      case 'prop':
      case 'tallprop': {
        const f = k === 'prop' ? furnOf(c) : null;
        const cv = f && objectCanvas(c, theme);
        const bb = cv && opaqueBox(`${theme}|${c}`, cv);
        if (f && bb) { foldBox(fg, atlas.rect(`o|${theme}|${c}`, () => cv), x, y, bb, f, !!f.thin && (ch(x, y - 1) === c || ch(x, y + 1) === c)); break; }
        if (!lowPoly(c, x, y)) sprites.push({ c, x, y, lift: LIFT });
        if (c === 'П') lampSpots.push({ x: cx, y: 0.6, z: y + 0.8, color: 0xff9a40, always: true });
        break;
      }
      case 'ground': lowPoly(c, x, y); break; // girasoles, totoras, paja brava, piedritas
      default: break;
    }
  }
  LIFT = 0;
  const tollFade: THREE.BufferGeometry[] = [];
  if (m.toll && !m.indoor) buildToll(m, parts, glow, tollFade);
  // Fin del mapa: el terreno se corta en un barranco de tierra que baja al vacío, así se ve dónde termina.
  // Por las salidas (m.exits) el suelo sigue hacia afuera como una franja, con flechas en el borde.
  exitMarks = [];
  const openings: { side: string; a: number; b: number }[] = [];
  if (!m.indoor) {
    const walk = (x: number, y: number) => { const c = ch(x, y); return c != null && !!TILE_INFO[c] && !TILE_INFO[c].solid && kindOf(c) !== 'water'; };
    const quad = (A: number[], B: number[], C: number[], D: number[]) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...C, ...B, ...B, ...C, ...D], 3));
      return g;
    };
    const earth = new THREE.Color(0x6e4c30), earthDeep = new THREE.Color(0x4a3220);
    // un lado del borde: de la altura del suelo hasta abajo, con una franja de pasto arriba y tierra abajo
    const skirt = (x0: number, z0: number, x1: number, z1: number, h0: number, h1: number, top: THREE.Color, seed: number) => {
      const lip = 0.22;
      parts.push(paint(quad([x0, h0, z0], [x1, h1, z1], [x0, h0 - lip, z0], [x1, h1 - lip, z1]), top.clone().multiplyScalar(0.72), 0.04, seed));
      parts.push(paint(quad([x0, h0 - lip, z0], [x1, h1 - lip, z1], [x0, -EDGE_DROP * 0.5, z0], [x1, -EDGE_DROP * 0.5, z1]), earth, 0.08, seed + 1));
      parts.push(paint(quad([x0, -EDGE_DROP * 0.5, z0], [x1, -EDGE_DROP * 0.5, z1], [x0, -EDGE_DROP, z0], [x1, -EDGE_DROP, z1]), earthDeep, 0.08, seed + 2));
    };
    for (let x = 0; x < W; x++) {
      skirt(x + 1, 0, x, 0, gh(x + 1, 0), gh(x, 0), groundColor(x, 0), x); // norte (mira hacia -z)
      skirt(x, H, x + 1, H, gh(x, H), gh(x + 1, H), groundColor(x, H - 1), x + 500); // sur
    }
    for (let y = 0; y < H; y++) {
      skirt(0, y, 0, y + 1, gh(0, y), gh(0, y + 1), groundColor(0, y), y + 1000); // oeste
      skirt(W, y + 1, W, y, gh(W, y + 1), gh(W, y), groundColor(W - 1, y), y + 1500); // este
    }
    // aberturas: tramos seguidos de casillas transitables en un lado que tiene salida
    for (const side of ['n', 's', 'w', 'e']) {
      if (!m.exits?.[side]) continue;
      const len = side === 'n' || side === 's' ? W : H;
      const cell = (i: number): [number, number] => (side === 'n' ? [i, 0] : side === 's' ? [i, H - 1] : side === 'w' ? [0, i] : [W - 1, i]);
      for (let i = 0; i < len; i++) {
        if (!walk(...cell(i))) continue;
        let j = i;
        while (j + 1 < len && walk(...cell(j + 1))) j++;
        openings.push({ side, a: i, b: j });
        i = j;
      }
    }
    // el camino sigue: una franja de suelo que sale por la abertura y se pierde a lo lejos
    const OUT = 14;
    for (const o of openings) {
      const [cx, cy] = (o.side === 'n' ? [o.a, 0] : o.side === 's' ? [o.a, H - 1] : o.side === 'w' ? [0, o.a] : [W - 1, o.a]);
      const col = groundColor(cx, cy);
      const vtx = (i: number) => (o.side === 'n' ? [i, 0] : o.side === 's' ? [i, H] : o.side === 'w' ? [0, i] : [W, i]);
      for (let i = o.a; i <= o.b; i++) {
        const [ax, az] = vtx(i), [bx, bz] = vtx(i + 1);
        const ha = gh(ax, az), hb = gh(bx, bz);
        const [ox, oz] = o.side === 'n' ? [0, -OUT] : o.side === 's' ? [0, OUT] : o.side === 'w' ? [-OUT, 0] : [OUT, 0];
        // la franja baja apenas hacia el horizonte
        const ta = [ax, ha, az], tb = [bx, hb, bz], fa = [ax + ox, Math.min(ha, 0) - 0.05, az + oz], fb = [bx + ox, Math.min(hb, 0) - 0.05, bz + oz];
        const flip = o.side === 's' || o.side === 'w';
        const c = col.clone().multiplyScalar(0.92);
        parts.push(paint(flip ? quad(ta, tb, fa, fb) : quad(tb, ta, fb, fa), c, 0.05, i * 7 + 3));
      }
      // costados de la franja
      const [s0x, s0z] = vtx(o.a), [s1x, s1z] = vtx(o.b + 1);
      const [ox, oz] = o.side === 'n' ? [0, -OUT] : o.side === 's' ? [0, OUT] : o.side === 'w' ? [-OUT, 0] : [OUT, 0];
      const h0 = gh(s0x, s0z), h1 = gh(s1x, s1z);
      const side = (px: number, pz: number, h: number, inv: boolean) => {
        const A = [px, h, pz], B = [px + ox, Math.min(h, 0) - 0.05, pz + oz], C = [px, -EDGE_DROP, pz], D = [px + ox, -EDGE_DROP, pz + oz];
        parts.push(paint(inv ? quad(B, A, D, C) : quad(A, B, C, D), earth, 0.08, px * 3 + pz));
      };
      const n = o.side === 'n' || o.side === 'e';
      side(s0x, s0z, h0, !n); side(s1x, s1z, h1, n);
    }
  }
  staticGroup = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 });
  if (parts.length) {
    const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)).map(onlyPosColor), false);
    merged.computeVertexNormals();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    staticGroup.add(mesh);
  }
  const texMesh = tg.mesh(atlas);
  staticGroup.add(texMesh);
  staticTex.push(texMesh);
  if (fg.pos.length) {
    const fm = fg.mesh(atlas, true);
    staticGroup.add(fm);
    staticTex.push(fm);
  }
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
  // Más allá del borde del mapa: el fondo del barranco, oscuro, que se pierde en la bruma.
  if (!m.indoor) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: new THREE.Color(0x1c2636).lerp(groundColor(0, 0).clone().multiplyScalar(0.3), 0.3), roughness: 1 }));
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(W / 2, -EDGE_DROP, H / 2);
    edge.receiveShadow = true;
    staticGroup.add(edge);
    // flechas en el suelo de cada salida, apuntando hacia afuera (se animan en drawWorld3D)
    const rot = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 } as Record<string, number>;
    const dir = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] } as Record<string, number[]>;
    for (const o of openings) {
      const mid = (o.a + o.b + 1) / 2, wide = Math.min(1.6, (o.b - o.a + 1) * 0.55);
      const [x, z] = o.side === 'n' ? [mid, 0.55] : o.side === 's' ? [mid, H - 0.55] : o.side === 'w' ? [0.55, mid] : [W - 0.55, mid];
      for (let k = 0; k < 2; k++) {
        const g = chevronGeo.clone().scale(wide, 1, wide).rotateY(rot[o.side]);
        const mk = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
        mk.renderOrder = 2;
        staticGroup.add(mk);
        exitMarks.push({ mesh: mk, x, z, dx: dir[o.side][0], dz: dir[o.side][1], phase: k / 2 });
      }
    }
  }
  if (bldMesh) staticGroup.add(bldMesh);
  // el techo del peaje (se vuelve transparente cuando el jugador pasa por abajo) y el cartel azul con su nombre
  tollRoof = null;
  if (tollFade.length) {
    const tm = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6, metalness: 0.1, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(mergeGeometries(tollFade.map((p) => (p.index ? p.toNonIndexed() : p)).map(onlyPosColor), false), tm);
    mesh.geometry.computeVertexNormals();
    mesh.castShadow = true;
    staticGroup.add(mesh);
    staticTex.push(mesh);
    tollRoof = { mat: tm, k: 1 };
  }
  if (m.toll?.board) {
    const bm = boardMat(tollBoardCanvas(m.toll.name));
    staticMats.push(bm);
    const bh = TOLL_BOARD_H / T;
    const g = boardGeo(TOLL_BOARD.length, bh, TILT_OBJ); // inclinado hacia la cámara, como los demás carteles
    const { x, y } = m.toll.board;
    const bw = TOLL_BOARD.length / 2;
    g.translate(x + bw, liftAt(x + bw, y + 0.5) + 1.0, y + 0.56);
    staticGroup.add(new THREE.Mesh(g, bm));
  }
  // objetos en pixel art: un cartel por tile, agrupados por tipo de tile (una sola llamada de dibujo cada uno)
  const byChar = new Map<string, { x: number; y: number; lift: number }[]>();
  for (const sp of sprites) (byChar.get(sp.c) ?? byChar.set(sp.c, []).get(sp.c)!).push(sp);
  const mtx = new THREE.Matrix4();
  for (const [c, list] of byChar) {
    const bm = boardMat(objectCanvas(c, theme));
    staticMats.push(bm);
    const im = new THREE.InstancedMesh(objGeo, bm, list.length);
    list.forEach((sp, i) => im.setMatrixAt(i, mtx.makeTranslation(sp.x + 0.5, sp.lift, sp.y + 1)));
    im.castShadow = true;
    staticGroup.add(im);
  }
  // la capa «Encima» (copas, techos, arcos que tapan a la gente en 2D): un cartel por casilla, apenas delante de
  // quien esté parado ahí, así también lo tapa en 3D
  if (Array.isArray(m.top)) {
    const tops = new Map<string, { x: number; y: number }[]>();
    m.top.forEach((r: string, y: number) => [...r].forEach((c, x) => { if (c !== ' ' && TILE_INFO[c] && !TOLL_ROOF.has(c)) (tops.get(c) ?? tops.set(c, []).get(c)!).push({ x, y }); }));
    for (const [c, list] of tops) {
      const bm = boardMat(topCanvas(c, 0, theme));
      staticMats.push(bm);
      const im = new THREE.InstancedMesh(objGeo, bm, list.length);
      list.forEach((sp, i) => im.setMatrixAt(i, mtx.makeTranslation(sp.x + 0.5, liftAt(sp.x + 0.5, sp.y + 0.5), sp.y + 1.04)));
      staticGroup.add(im);
    }
  }
  scene.add(staticGroup);
}
// ---------------------------------------------------------------- edificios con su pixel art
let bldMesh: THREE.Mesh | null = null;
// ---------------------------------------------------------------- borde del mapa y salidas
const EDGE_DROP = 2.4; // cuánto baja el barranco del borde del mapa
// flecha «›» acostada en el suelo, apuntando hacia -z (norte)
const chevronGeo = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(-0.45, -0.15); sh.lineTo(0, 0.25); sh.lineTo(0.45, -0.15); sh.lineTo(0.45, -0.35); sh.lineTo(0, 0.05); sh.lineTo(-0.45, -0.35); sh.closePath();
  return new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2);
})();
let exitMarks: { mesh: THREE.Mesh; x: number; z: number; dx: number; dz: number; phase: number }[] = [];
const staticTex: THREE.Mesh[] = [];
const isBld = (tiles, W: number, H: number, x: number, y: number): boolean => {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const k = kindOf(tiles[y][x]);
  if (k === 'roof' || k === 'wall') return true;
  if (k === 'door') { const a = y > 0 ? kindOf(tiles[y - 1][x]) : null; return a === 'roof' || a === 'wall'; }
  return false;
};
const FACADE_H = Math.tan(PHI_CAM); // así una fila de fachada se ve en pantalla igual de alta que en el mapa 2D
/** Tiles que un tema redibuja pero siguen siendo lo mismo (la colmena y el busto de los gimnasios, la cueva). */
const SAME_IN_THEMES = new Set(['ҳ', 'ϯ', ...Object.keys(PROPS_3D).filter((c) => /^(estalagmita|cristales)$/.test(TILE_INFO[c]?.name ?? ''))]);
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
  // Cada columna de tiles de edificio se corta en edificios: filas de techo arriba y filas de fachada abajo.
  // Si debajo de una fachada vuelve a haber techo, ahí empieza otro edificio (una casa pegada detrás de una tienda).
  type Seg = { y0: number; y1: number; F: number };
  const segAt: (Seg | null)[] = new Array(W * H).fill(null);
  const colSegs: Seg[][] = Array.from({ length: W }, () => []);
  for (let x = 0; x < W; x++) {
    let y = 0;
    while (y < H) {
      if (!isBld(tiles, W, H, x, y)) { y++; continue; }
      const y0 = y;
      let wallSeen = false;
      while (y < H && isBld(tiles, W, H, x, y)) {
        const roof = kindOf(tiles[y][x]) === 'roof';
        if (roof && wallSeen) break;
        if (!roof) wallSeen = true;
        y++;
      }
      const y1 = y - 1;
      let F = 0;
      while (y1 - F >= y0 && kindOf(tiles[y1 - F][x]) !== 'roof') F++;
      const sg = { y0, y1, F: Math.max(1, F) };
      colSegs[x].push(sg);
      for (let yy = y0; yy <= y1; yy++) segAt[yy * W + x] = sg;
    }
  }
  const twin = (x: number, sg: Seg) => (x < 0 || x >= W ? null : colSegs[x].find((o) => o.y0 === sg.y0 && o.y1 === sg.y1) ?? null);
  // altura de caballete propia de una columna: sube con la profundidad, no más de 1,1 sobre la fachada
  const ownRidge = (sg: Seg) => sg.F * FACADE_H + Math.min(1.1, Math.max(0.45, (sg.y1 + 1 - sg.y0) * 0.3));
  // las columnas vecinas con el mismo frente y fondo son el mismo edificio y comparten el caballete
  const ridgeOf = new Map<Seg, number>();
  for (let x = 0; x < W; x++) for (const sg of colSegs[x]) {
    if (ridgeOf.has(sg)) continue;
    const run: Seg[] = [sg];
    for (let xx = x + 1, o = twin(xx, sg); o; xx++, o = twin(xx, sg)) run.push(o);
    const r = Math.max(...run.map(ownRidge));
    for (const o of run) ridgeOf.set(o, r);
  }
  const EAVE = 0.16; // alero: el techo sobresale de la fachada
  for (let x = 0; x < W; x++) for (const sg of colSegs[x]) {
      const { y0, y1, F } = sg;
      const R = y1 - y0 + 1 - F;
      for (let yy = y0; yy <= y1; yy++) used.add(yy * W + x);
      const front = y1 + 1, back = y0;
      const top = F * FACADE_H;
      const zm = (front + back) / 2;
      const ridge = Math.max(top + 0.3, ridgeOf.get(sg)!);
      const left = twin(x - 1, sg), right = twin(x + 1, sg);
      const x0 = x, x1 = x + 1;
      // fachada: una cara por fila, de abajo hacia arriba
      for (let i = 0; i < F; i++) {
        const c = tiles[y1 - i][x];
        quad([x0, (i + 1) * FACADE_H, front], [x1, (i + 1) * FACADE_H, front], [x1, i * FACADE_H, front], [x0, i * FACADE_H, front], cellOf(c));
      }
      // techo a dos aguas: las filas de techo del 2D van del caballete al alero por la cara de adelante, y repetidas atrás.
      // Un bloque sin filas de techo (fábrica, torre) lleva un techo liso del color de su pared.
      const roofRows = R > 0 ? Array.from({ length: R }, (_, i) => tiles[y0 + i][x]) : ['\u0000cap:' + tiles[y0][x]];
      const n = roofRows.length;
      const half = front - zm;
      const kE = 1 + EAVE / half; // el último tramo sigue la pendiente hasta el alero
      const ex0 = left ? x0 : x0 - EAVE * 0.6, ex1 = right ? x1 : x1 + EAVE * 0.6;
      for (let i = 0; i < n; i++) {
        const k0 = i / n, k1 = i === n - 1 ? kE : (i + 1) / n;
        const za = zm + half * k0, zb = zm + half * k1;
        const ha = ridge + (top - ridge) * k0, hb = ridge + (top - ridge) * k1;
        quad([ex0, ha, za], [ex1, ha, za], [ex1, hb, zb], [ex0, hb, zb], cellOf(roofRows[i]));
        const zc = zm - half * k0, zd = zm - half * k1;
        quad([ex1, ha, zc], [ex0, ha, zc], [ex0, hb, zd], [ex1, hb, zd], cellOf(roofRows[i]));
      }
      // paredes de los costados (frontón) y de atrás, del color de la fachada
      const wallCol = avgColor(`f|${theme}|${tiles[y1][x]}`, tileCanvas(tiles[y1][x], 0, theme, false)).clone().multiplyScalar(0.92);
      const gable = (xs: number) => {
        const g = new THREE.BufferGeometry();
        const P = [[xs, 0, front], [xs, top, front], [xs, ridge, zm], [xs, top, back], [xs, 0, back]];
        const tri = [[0, 1, 2], [0, 2, 3], [0, 3, 4]];
        const arr: number[] = [];
        for (const t of tri) for (const o of [t, [t[0], t[2], t[1]]]) for (const j of o) arr.push(...P[j]); // las dos caras
        g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
        parts.push(paint(g, wallCol, 0.03, xs));
      };
      if (!left) gable(x0);
      if (!right) gable(x1);
      const bw = box(1, top, 0.02);
      parts.push(paint(at(bw, x + 0.5, top / 2, back + 0.01), wallCol, 0.03, x));
      // escalón de la vereda frente a la fachada
      if (!isBld(tiles, W, H, x, front)) parts.push(paint(at(box(1, 0.06, 0.18), x + 0.5, 0.03, front + 0.09), groundColor(x, Math.min(H - 1, front)).clone().multiplyScalar(0.85), 0.02, x));
  }
  if (cells.size) {
    const atlas = document.createElement('canvas');
    atlas.width = atlas.height = 512;
    const g = atlas.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    for (const [c, i] of cells) {
      const cx = (i % 32) * 16, cy = Math.floor(i / 32) * 16;
      if (c.startsWith('\u0000cap:')) {
        // techo liso: el color de la pared, más oscuro, con una línea de borde
        const ch = c.slice(5);
        const col = avgColor(`f|${theme}|${ch}`, tileCanvas(ch, 0, theme, false)).clone().multiplyScalar(0.7);
        g.fillStyle = `#${col.getHexString()}`;
        g.fillRect(cx, cy, 16, 16);
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(cx, cy + 15, 16, 1);
      } else g.drawImage(tileCanvas(c, 0, theme, false), cx, cy);
    }
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
// Sombra redonda bajo los pies (como en el mapa 2D). Un cartel plano que proyecta la sombra del sol cambia de forma con
// cada paso y se estira de costado; los personajes y criaturas llevan esta en su lugar.
const blobGeo = new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2);
const blobMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
function board(c: HTMLCanvasElement, wTiles: number, tilt = TILT_CHAR, blob = 0): Board {
  const w = wTiles, h = (c.height / c.width) * wTiles;
  const mat = boardMat(c);
  const mesh = new THREE.Mesh(boardGeo(w, h, tilt), mat);
  mesh.castShadow = !blob;
  const root = new THREE.Group();
  root.add(mesh);
  if (blob) {
    const sh = new THREE.Mesh(blobGeo, blobMat);
    sh.scale.set(blob, 1, blob * 0.42);
    sh.position.set(0, 0.07, -0.08);
    sh.renderOrder = 1;
    root.add(sh);
    root.userData.blob = sh;
  }
  return { root, mesh, mat, key: '', w, h };
}
function setBoardCanvas(b: Board, c: HTMLCanvasElement) {
  if (b.mat && b.mat.map?.image !== c) { const t = texOf(c); b.mat.map = t; b.mat.emissiveMap = t; b.mat.needsUpdate = true; }
}
// La máquina de niebla no se pierde en su propia niebla: como en el mapa 2D, se ven la caja y sus luces.
const machMat = (color: number, basic = false) => basic ? new THREE.MeshBasicMaterial({ color, fog: false, toneMapped: false }) : new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, fog: false });
function machineBoard(): Board {
  const root = new THREE.Group();
  const body = new THREE.Mesh(box(0.8, 0.7, 0.6), machMat(0x4a4a5a));
  body.position.set(0, 0.35, 0);
  body.castShadow = true;
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 6), machMat(0x2a2a36));
  vent.position.set(0.2, 0.85, 0);
  const panel = new THREE.Mesh(box(0.3, 0.16, 0.04), machMat(0x7af08a, true));
  panel.position.set(-0.15, 0.45, 0.31);
  const led = new THREE.Mesh(box(0.1, 0.1, 0.04), machMat(0xff5a4a, true));
  led.position.set(0.22, 0.45, 0.31);
  root.add(body, vent, panel, led);
  root.userData.led = led;
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
  if (tollRoof) {
    const under = tollZone(m.toll, v.player.x, v.player.y);
    tollRoof.k += ((under ? 0.3 : 1) - tollRoof.k) * 0.15;
    tollRoof.mat.opacity = tollRoof.k;
    tollRoof.mat.depthWrite = tollRoof.k > 0.95;
  }
  // flechas de salida: avanzan hacia afuera y se apagan, dos por salida, una detrás de la otra
  for (const e of exitMarks) {
    const k = (t / 1400 + e.phase) % 1;
    const d = k * 0.9 - 0.35;
    const px = e.x + e.dx * d, pz = e.z + e.dz * d;
    e.mesh.position.set(px, liftAt(px, pz) + 0.03, pz);
    (e.mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.75;
  }
  const seen = new Set<any>();
  const onWaterAt = (x: number, z: number) => { const c = v.tileAt(Math.floor(x), Math.floor(z)); return c != null && kindOf(c) === 'water'; };
  // Un personaje se para en el centro de su casillero, un poco hacia adelante (como sus pies en el sprite 2D).
  const stand = (b: Board, pos: { x: number; y: number }) => {
    const x = pos.x / T + 0.5, z = pos.y / T + 0.72;
    b.root.position.set(x, onWaterAt(x, z - 0.2) ? -0.06 : liftAt(x, z - 0.22), z);
  };
  const p = v.player;
  const ppos = v.entityPos(p);
  const inCanoe = v.tileAt(p.x, p.y) === '~';
  const pb = boardFor(p, 'player:' + v.look, () => board(charSprite(v.look, 'down', 0), 1, TILT_CHAR, 0.34));
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
    if (look === 'machine') {
      const b = boardFor(n, 'machine', machineBoard);
      b.root.position.set(n.x + 0.5, liftAt(n.x + 0.5, n.y + 0.5), n.y + 0.5);
      (b.root.userData.led.material as THREE.MeshBasicMaterial).color.set(Math.floor(t / 400) % 2 ? 0xff5a4a : 0x8a2a2a);
      continue;
    }
    if (look === 'ball') {
      const b = boardFor(n, 'ball', () => board(ballCanvas(), 1));
      const under = v.tileAt(n.x, n.y);
      if (under && TILE_INFO[under]?.solid) {
        // sobre una mesa: la pokebola va arriba del tablero, pegada al dibujo del mueble (como en el mapa 2D)
        const up = 0.5;
        b.root.position.set(n.x + 0.5, up * Math.cos(TILT_OBJ), n.y + 1 - up * Math.sin(TILT_OBJ) + 0.06);
      } else stand(b, v.entityPos(n));
      continue;
    }
    if (typeof look === 'string' && look.startsWith('animal:')) {
      // criaturas a lo lejos: su propio sprite de mapa (mira a la derecha, a tamaño de pixel como los personajes);
      // las que no tienen usan su sprite de combate en chico (mira a la izquierda). Dan saltitos al moverse.
      const ow = overworldCreature(look.slice(7), !!n.moving || !!n.fly, t);
      const b = ow
        ? boardFor(n, look + ':ow', () => board(ow, ow.width / T, TILT_CHAR, Math.max(6, ow.width * 0.36) / T))
        : boardFor(n, look, () => board(creatureSprite(look.slice(7)), 1.5, TILT_CHAR, 0.38));
      if (ow) setBoardCanvas(b, ow);
      stand(b, v.entityPos(n));
      b.root.scale.x = ow ? (n.dir === 'left' ? -1 : 1) : n.dir === 'right' ? -1 : 1;
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
    const b = boardFor(n, lk, () => board(charSprite(lk, 'down', 0), 1, TILT_CHAR, 0.34));
    setBoardCanvas(b, charSprite(lk, n.dir, poseOf(n, false, false)));
    stand(b, v.entityPos(n));
  }
  v.items.forEach((it) => {
    if (it.hidden) return; // hidden in the scenery: nothing to see
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
  for (const [k, b] of boards) {
    if (!seen.has(k)) { dropBoard(b); boards.delete(k); continue; }
    // la sombra queda en el suelo aunque el sprite salte (desnivel, saltitos, la canoa); se achica al subir
    const sh = b.root.userData.blob as THREE.Mesh | undefined;
    if (sh) {
      const r = b.root.position, ground = onWaterAt(r.x, r.z - 0.2) ? -0.06 : liftAt(r.x, r.z - 0.22);
      const up = r.y - ground;
      sh.position.y = 0.07 - up;
      sh.visible = up < 1.5 && !(k === p && inCanoe);
    }
  }
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
  const cave = !m.indoor && (m.theme === 'cueva' || !!m.dark); // las cuevas siempre están oscuras, sea la hora que sea
  const hr = cave ? 0 : skyHour();
  const night = hr >= 20 || hr < 5.5 ? 1 : hr >= 18 ? (hr - 18) / 2 * 0.6 : hr < 7.5 ? 0.35 * (7.5 - hr) / 2 : 0;
  const dusk = hr >= 17 && hr < 20 ? 1 - Math.abs(hr - 18.5) / 1.5 : hr >= 5.5 && hr < 8 ? 1 - Math.abs(hr - 6.5) / 1.5 : 0;
  const dark = !!m.dark && !v.lit;
  const sky = new THREE.Color(0x8ecdf4).lerp(new THREE.Color(0xf2a070), Math.max(0, dusk) * 0.7).lerp(new THREE.Color(0x10183a), night);
  const indoor = !!m.indoor;
  scene.background = indoor || cave ? new THREE.Color(0x0c0c16) : sky;
  lightBoards(dark ? 0 : indoor ? 0.85 : 0.85 * (1 - night * 0.65) * (1 - Math.max(0, dusk) * 0.1), dark);
  hemi.intensity = dark ? 0.06 : indoor ? 1.55 : 1.15 - night * 0.8;
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
  // Niebla del PP y del clima: medida en el suelo desde el jugador (near negativo, ver fog_vertex arriba), con los
  // mismos radios que el degradé 2D: la máquina encendida deja ver poco más de un casillero alrededor.
  const FOG_RING = { machine: [1.1, 4.2], story: [2.5, 8], weather: [4, 12] } as const;
  const ring = !dark && !cave && !indoor && v.fog ? FOG_RING[v.fog] : null;
  const fogCol = new THREE.Color(0xc4ccd8).lerp(new THREE.Color(0x3a4258), night * 0.8);
  if (dark) scene.fog = new THREE.Fog(0x05050c, camD - 1, camD + 5);
  else if (cave) scene.fog = new THREE.Fog(0x05050c, camD - 1, camD + 10);
  else if (ring) scene.fog = new THREE.Fog(fogCol, -ring[0], ring[1]);
  else if (!indoor) scene.fog = new THREE.Fog(sky.getHex(), camD + 10, camD + 34);
  else scene.fog = null;
  if (ring) scene.background = fogCol;
  let tx = px, tz = pz;
  let want: THREE.Vector3, look: THREE.Vector3;
  if (indoor) {
    // Interiores: cámara más alta y empinada, alejada lo justo para que entre la sala entera (como en 2D). En salas
    // más grandes que la pantalla (gimnasios, el depósito) sigue al jugador sin mostrar el vacío de afuera.
    const pitch = 1.03; // ~59°
    const fovT = Math.tan((camera.fov * Math.PI) / 360);
    const aspect = camera.aspect;
    const maxW = 15.5 / zoom; // ancho máximo de piso a la vista (con zoom, menos)
    const needW = (m.w + 0.6) / (2 * fovT * aspect);
    const needH = ((m.h + 1.2) * Math.sin(pitch)) / (2 * fovT);
    const D = Math.min(Math.max(needW, needH, 9), maxW / (2 * fovT * aspect));
    const viewW = 2 * D * fovT * aspect;
    const viewH = (2 * D * fovT) / Math.sin(pitch);
    const fit = (p: number, size: number, view: number, lo: number) => (view >= size + lo ? size / 2 : Math.min(Math.max(p, view / 2 - lo / 2), size - view / 2 + lo / 2));
    tx = fit(px, m.w, viewW, 0.4);
    tz = fit(pz - 0.3, m.h, viewH, 0.8) + 0.25; // el muro del fondo se ve de frente: un poco más de lugar abajo
    look = new THREE.Vector3(tx, 0, tz);
    want = new THREE.Vector3(tx, D * Math.sin(pitch), tz + D * Math.cos(pitch));
  } else {
    want = new THREE.Vector3(tx, dist * 0.95, tz + dist * 0.78);
    look = new THREE.Vector3(tx, 0.4, tz + 0.2);
  }
  // Como en 2D, la cámara va pegada al jugador: si se arrastra detrás, el personaje se desliza por la pantalla al
  // caminar y vuelve al centro al frenar. Solo los saltos grandes (zoom, salas que se encuadran) se suavizan.
  if (!camReady) { camPos.copy(want); camLook.copy(look); prevWant.copy(want); prevLook.copy(look); camReady = true; }
  camPos.add(prevWant.sub(want).negate()); camLook.add(prevLook.sub(look).negate()); // sigue el paso del jugador tal cual
  camPos.lerp(want, 0.2); camLook.lerp(look, 0.2); // y suaviza solo lo que quedaba de un salto
  prevWant.copy(want); prevLook.copy(look);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  renderer.render(scene, camera);
  drewAt = performance.now();
}
