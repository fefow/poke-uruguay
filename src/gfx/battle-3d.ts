// Prueba visual: escenario de combate en 3D low-poly. Las criaturas, entrenadores y efectos siguen en pixel art
// (los dibuja battle-scene.ts en el canvas 2D transparente de arriba); acá va el cielo, el suelo, el paisaje y
// las dos plataformas, ubicadas para que caigan justo debajo de cada criatura.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { render3DScene, paint, at, box, hostTree, palm, rnd } from './world-3d.ts';
import { skyHour } from './screen.ts';

type Pal = [string, string, string, string]; // cielo arriba, cielo abajo, suelo lejos, suelo cerca
const SW = 480, SH = 270; // coordenadas del canvas 2D del combate
const FOE = { x: 236, y: 104 }, PLY = { x: 84, y: 178 };

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera;
let builtFor = '';
let clouds: THREE.Object3D[] = [];
let water: THREE.Mesh | null = null;
const time = { value: 0 };
let sun: THREE.DirectionalLight, hemi: THREE.HemisphereLight, glow: THREE.PointLight;

/** Punto del suelo (y = 0) que se ve en el píxel (px, py) del canvas 2D. */
function groundAt(px: number, py: number) {
  const ndc = new THREE.Vector3((px / SW) * 2 - 1, -((py / SH) * 2 - 1), 0.5);
  ndc.unproject(camera);
  const dir = ndc.sub(camera.position).normalize();
  const k = -camera.position.y / dir.y;
  return camera.position.clone().add(dir.multiplyScalar(k));
}

const C = (c: string | number) => new THREE.Color(c as any);
function skyTexture(top: string, bottom: string) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function build(bg: string, pal: Pal) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, SW / SH, 0.1, 200);
  camera.position.set(0, 3.1, 9.5);
  camera.lookAt(0, 0.9, 0);
  camera.updateMatrixWorld();
  const dark = bg === 'cave';
  const indoor = bg === 'indoor';
  scene.background = skyTexture(pal[0], pal[1]);
  hemi = new THREE.HemisphereLight(0xdcefff, C(pal[3]), dark ? 0.35 : 1.15);
  sun = new THREE.DirectionalLight(0xfff0d8, dark ? 0.4 : 2.4);
  sun.position.set(-6, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
  sun.shadow.bias = -0.001;
  glow = new THREE.PointLight(0x9ad0ff, dark ? 30 : 0, 14, 1.6);
  glow.position.set(0, 3, 2);
  scene.add(hemi, sun, glow);
  scene.fog = new THREE.Fog(C(pal[1]), 22, 60);

  const foe = groundAt(FOE.x, FOE.y);
  const ply = groundAt(PLY.x, PLY.y);
  const parts: THREE.BufferGeometry[] = [];
  const far = C(pal[2]), near = C(pal[3]);
  // suelo: grilla facetada que va del color lejano al cercano, plana donde están las plataformas
  {
    const pos: number[] = [], col: number[] = [];
    const N = 2;
    const wet = bg === 'beach' || bg === 'wetland';
    const hAt = (x: number, z: number) => {
      const d = Math.min(Math.hypot(x - foe.x, z - foe.z), Math.hypot(x - ply.x, z - ply.z));
      const flat = Math.min(1, Math.max(0, (d - 2.2) / 3));
      return (rnd(x, z, 4) - 0.5) * 0.35 * flat + (z < -14 && !wet ? (-14 - z) * 0.06 : 0);
    };
    const tmp = new THREE.Color();
    for (let z = -40; z < 12; z += N) for (let x = -34; x < 34; x += N) {
      if (bg === 'beach' && z < -16) continue; // el mar empieza donde termina la arena
      const A = [x, hAt(x, z), z], B = [x + N, hAt(x + N, z), z], Cc = [x, hAt(x, z + N), z + N], D = [x + N, hAt(x + N, z + N), z + N];
      const k = Math.min(1, Math.max(0, (z + 30) / 40));
      for (const [tri, s] of [[[A, Cc, B], 1], [[B, Cc, D], 2]] as [number[][], number][]) {
        tmp.copy(far).lerp(near, k).multiplyScalar(1 + (rnd(x, z, s) - 0.5) * 0.1);
        for (const v of tri) { pos.push(...v); col.push(tmp.r, tmp.g, tmp.b); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    parts.push(g);
  }
  // plataformas: discos facetados con borde de tierra, donde se paran las criaturas
  const platform = (p: THREE.Vector3, r: number) => {
    const top = far.clone().lerp(near, 0.5).multiplyScalar(1.12);
    const rim = indoor ? C(pal[3]).multiplyScalar(0.8) : dark ? C('#4a4656') : C('#8a6a44');
    parts.push(paint(at(new THREE.CylinderGeometry(r, r * 1.08, 0.32, 9), p.x, 0.02, p.z, 0.3), rim, 0.08, p.x));
    parts.push(paint(at(new THREE.CylinderGeometry(r * 0.96, r * 0.98, 0.1, 9), p.x, 0.22, p.z, 0.3), top, 0.1, p.z));
    // sombra de la criatura sobre la plataforma
    const sh = new THREE.Mesh(new THREE.CircleGeometry(r * 0.55, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(p.x, 0.28, p.z);
    sh.scale.y = 0.7;
    scene!.add(sh);
  };
  platform(foe, 2.7);
  platform(ply, 1.9);
  // paisaje según el lugar
  const tree = (x: number, z: number, s = 1, leaf = '#3f8a3a') => {
    const g: THREE.BufferGeometry[] = [];
    hostTree(g, x, z, C(leaf), C('#6a4426'), 0);
    for (const q of g) { q.translate(-x, 0, -z); q.scale(s, s, s); q.translate(x, 0, z); parts.push(q); }
  };
  const hill = (x: number, z: number, w: number, h: number, c: string) => {
    const g = new THREE.IcosahedronGeometry(1, 1);
    g.scale(w, h, w * 0.6);
    parts.push(paint(at(g, x, 0, z), C(c), 0.08, x + z));
  };
  const rock = (x: number, z: number, s: number, c = '#8a8a92') => {
    const g = new THREE.DodecahedronGeometry(s, 0);
    g.scale(1, 0.7, 1);
    parts.push(paint(at(g, x, s * 0.3, z, rnd(x, z) * 6), C(c), 0.14, x));
  };
  const keep = (x: number, z: number) => Math.hypot(x - foe.x, z - foe.z) > 2.6 && Math.hypot(x - ply.x, z - ply.z) > 3;
  if (bg === 'field' || bg === 'wetland' || bg === 'sierra') {
    const hc = bg === 'sierra' ? ['#7e8a6a', '#6a7458', '#8a9478'] : ['#8cc88a', '#74b672', '#98d090'];
    hill(-16, -30, 12, bg === 'sierra' ? 9 : 4, hc[0]); hill(2, -34, 16, bg === 'sierra' ? 12 : 5, hc[1]); hill(20, -28, 11, bg === 'sierra' ? 8 : 3.5, hc[2]);
    if (bg === 'sierra') for (const [x, z, s] of [[-7, -6, 0.7], [6, -9, 0.9], [-3, 3, 0.5], [9, 1, 0.6]]) rock(x, z, s);
    tree(-9, -12, 1.6, '#3a7a3a'); tree(10, -16, 1.4); tree(-13, -4, 1.3, '#4a9a48');
    if (bg === 'field') for (let x = -8; x <= 16; x += 1.4) { parts.push(paint(at(box(0.08, 0.6, 0.08), x, 0.3, -11), C('#6a5030'), 0.05, x)); }
    if (bg === 'field') parts.push(paint(at(box(24, 0.06, 0.05), 4, 0.48, -11), C('#6a5030'), 0.03, 1));
    if (bg === 'wetland') for (let i = 0; i < 26; i++) {
      const x = (rnd(i, 1) - 0.5) * 24, z = -12 + rnd(i, 2) * 16;
      if (keep(x, z)) parts.push(paint(at(new THREE.ConeGeometry(0.06, 0.9 + rnd(i, 3) * 0.5, 3), x, 0.45, z), C('#5e7e38'), 0.1, i));
    }
  }
  if (bg === 'forest') {
    for (let i = 0; i < 40; i++) {
      const x = (rnd(i, 5) - 0.5) * 40, z = -24 + rnd(i, 6) * 26;
      if (keep(x, z) && (Math.abs(x) > 5 || z < -8)) tree(x, z, 1.2 + rnd(i, 7) * 0.9, rnd(i, 8) > 0.5 ? '#2f6a2a' : '#3f7f30');
    }
  }
  if (bg === 'beach') {
    const leaf = C('#4aa83a'), trunk = C('#9a6a3a');
    for (const [x, z] of [[-10, -6], [-12, -2], [11, -9]]) { const g: THREE.BufferGeometry[] = []; palm(g, x, z, leaf, trunk, 0); for (const q of g) { q.translate(-x, 0, -z); q.scale(1.6, 1.6, 1.6); q.translate(x, 0, z); parts.push(q); } }
  }
  if (bg === 'city') {
    for (let i = 0; i < 12; i++) {
      const x = -30 + i * 5.4, h = 4 + rnd(i, 9) * 6, z = -28 - rnd(i, 3) * 6;
      const c = ['#a8b4c8', '#c8b8a0', '#9aa8b8', '#d0c4b0'][i % 4];
      parts.push(paint(at(box(3.6, h, 3), x, h / 2, z), C(c), 0.04, i));
      for (let wy = 1; wy < h - 0.6; wy += 1.1) for (let wx = -1.1; wx <= 1.1; wx += 1.1) parts.push(paint(at(box(0.5, 0.6, 0.05), x + wx, wy, z + 1.52), C('#5a7aa8'), 0.05, wy));
    }
    for (const x of [-9, 9]) { parts.push(paint(at(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 5), x, 1.2, -5), C('#2a2a36'), 0.04, x)); }
  }
  if (bg === 'canyon') {
    for (const [x, z, w, h] of [[-15, -18, 6, 9], [-4, -26, 8, 12], [9, -20, 6, 8], [18, -14, 5, 10]]) {
      const g = new THREE.CylinderGeometry(w * 0.7, w, h, 7);
      parts.push(paint(at(g, x, h / 2, z, rnd(x, z) * 3), C(rnd(x, z, 2) > 0.5 ? '#a8784a' : '#946a42'), 0.1, x));
      parts.push(paint(at(new THREE.CylinderGeometry(w * 0.72, w * 0.72, 0.4, 7), x, h + 0.2, z, rnd(x, z) * 3), C('#c8986a'), 0.05, z));
    }
    for (const [x, z, s] of [[-7, -5, 0.8], [7, -8, 1], [10, 2, 0.6]]) rock(x, z, s, '#9a7452');
  }
  if (dark) {
    for (let i = 0; i < 30; i++) {
      const x = (rnd(i, 1) - 0.5) * 36, z = -26 + rnd(i, 2) * 26;
      if (!keep(x, z) || (Math.abs(x - foe.x) < 3.5 && z < foe.z)) continue; // nada tapa a la criatura rival
      const h = 0.8 + rnd(i, 3) * 2.8;
      parts.push(paint(at(new THREE.ConeGeometry(0.4 + rnd(i, 4) * 0.5, h, 6), x, h / 2, z), C(rnd(i, 5) > 0.5 ? '#4a4656' : '#3a3646'), 0.12, i));
      parts.push(paint(at(new THREE.ConeGeometry(0.3 + rnd(i, 6) * 0.4, 1.5 + rnd(i, 7) * 2, 5).rotateX(Math.PI), x * 1.1, 7, z - 2), C('#2e2a36'), 0.1, i + 50));
    }
    scene.fog = new THREE.Fog(0x14121a, 10, 34);
  }
  if (indoor) {
    parts.push(paint(at(box(40, 10, 0.5), 0, 5, -14), C(pal[0]), 0.03, 1));
    for (let x = -18; x <= 18; x += 4) parts.push(paint(at(box(0.6, 10, 0.7), x, 5, -13.6), C(pal[3]), 0.03, x));
    scene.fog = null;
  }
  // nubes low-poly que cruzan despacio
  clouds = [];
  if (!dark && !indoor && bg !== 'forest') {
    for (let i = 0; i < 5; i++) {
      const g: THREE.BufferGeometry[] = [];
      for (let j = 0; j < 3; j++) g.push(paint(at(new THREE.IcosahedronGeometry(0.9 + rnd(i, j) * 0.6, 0), j * 1.2, rnd(i, j + 3) * 0.4, 0), C('#ffffff'), 0.06, j));
      const cm = new THREE.Mesh(mergeGeometries(g.map(strip)), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, transparent: true, opacity: 0.92 }));
      cm.position.set(-30 + i * 13, 9 + rnd(i, 9) * 4, -30 - rnd(i, 8) * 6);
      cm.scale.set(1.6, 0.8, 1);
      scene.add(cm);
      clouds.push(cm);
    }
  }
  // agua al fondo (playa, humedal)
  water = null;
  if (bg === 'beach' || bg === 'wetland') {
    const wg = new THREE.PlaneGeometry(80, bg === 'beach' ? 24 : 10, 40, 12);
    wg.rotateX(-Math.PI / 2);
    const wm = new THREE.MeshStandardMaterial({ color: bg === 'beach' ? 0x3a8fd8 : 0x6aa8c8, flatShading: true, roughness: 0.3, transparent: true, opacity: 0.9 });
    wm.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = time;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.y += sin(position.x * 0.9 + uTime * 1.4) * 0.12 + cos(position.z * 1.3 + uTime) * 0.1;`);
    };
    water = new THREE.Mesh(wg, wm);
    water.position.set(0, bg === 'beach' ? -0.1 : 0.15, bg === 'beach' ? -27 : -20);
    scene.add(water);
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts.map(strip)), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}
function strip(g: THREE.BufferGeometry) {
  const q = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(q.attributes)) if (k !== 'position' && k !== 'color') q.deleteAttribute(k);
  if (!q.attributes.color) paint(q, new THREE.Color(0xffffff), 0);
  return q;
}

/** Dibuja el escenario 3D del combate. Devuelve false si no hay WebGL (sigue el fondo 2D). */
export function drawBattle3D(bg: string, pal: Pal, t: number, shake: number, tinted: boolean) {
  const key = `${bg}|${pal.join()}`;
  if (key !== builtFor || !scene) { build(bg, pal); builtFor = key; }
  if (!scene) return;
  time.value = t / 1000;
  clouds.forEach((c, i) => { c.position.x = ((c.position.x + 30 + 0.004 * (1 + i * 0.2)) % 66) - 30; });
  // hora del día, como el tinte del fondo 2D
  const hr = skyHour();
  const night = !tinted ? 0 : hr >= 20 || hr < 5.5 ? 1 : hr >= 18 ? 0.45 : hr < 7.5 ? 0.25 : 0;
  const dusk = !tinted ? 0 : (hr >= 17 && hr < 20) || (hr >= 5.5 && hr < 8) ? 1 : 0;
  sun.intensity = bg === 'cave' ? 0.4 : 2.4 * (1 - night * 0.8);
  sun.color.set(0xfff0d8).lerp(new THREE.Color(0xff9a50), dusk * 0.6).lerp(new THREE.Color(0x8aa0ff), night);
  hemi.intensity = bg === 'cave' ? 0.35 : 1.15 - night * 0.75;
  camera.position.x = shake ? Math.sin(t / 20) * shake * 0.02 : 0;
  render3DScene(scene, camera);
}
