// Visual sprite editor (editor.html). Paints over any sprite the game generates with code and stores the
// result in src/data/sprite-overrides.js, which the game reads first (see gfx/overrides.js).
// Work in progress is kept in this browser; "Guardar en el juego" commits the file to GitHub (redeploys Pages).
import { SPECIES, DEX_ORDER } from '../data/species.js';
import { ITEMS } from '../data/items.js';
import { SPRITE_OVERRIDES } from '../data/sprite-overrides.js';
import { creatureSprite, SPRITE } from '../gfx/creatures.js';
import { charSprite, LOOKS } from '../gfx/characters.js';
import { itemCanvas } from '../gfx/items.js';
import { badgeCanvas } from '../gfx/badges.js';
import { tileCanvas, TILE_INFO, THEMES, T } from '../gfx/tiles.js';
import { generated, setOverrides } from '../gfx/overrides.js';
import { encodeSprite, decodeSprite, overridesSource, parseOverridesSource } from '../gfx/sprite-codec.js';
import { h, clamp, safeStorage } from '../core/util.js';
import { devToken, isDev, unlockDev, checkToken, lockDev } from '../core/devauth.js';

const REPO = 'fefow/poke-uruguay';
const FILE = 'src/data/sprite-overrides.js';
const store = safeStorage();
const DRAFTS_KEY = 'pokeuy:sprite-drafts';
const MAX_UNDO = 60;

// ---------------------------------------------------------------- catalogue
const DIRS = [['down', 'Abajo'], ['up', 'Arriba'], ['left', 'Izquierda'], ['right', 'Derecha']];
const MEDALS = ['Montevideo', 'Maldonado', 'Treinta y Tres', 'Durazno', 'Tacuarembó', 'Rivera', 'Salto', 'Fray Bentos'];
const THEME_NAMES = { poli: 'Policlínica', gym_agua: 'Gimnasio Agua', gym_elec: 'Gimnasio Eléctrico', gym_roca: 'Gimnasio Roca' };
const lookName = (k) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const CATS = [
  {
    id: 'creature', name: 'Criaturas', hint: '80×80. El dorso en combate es el mismo dibujo espejado.',
    entries: () => DEX_ORDER.map((k, i) => ({ key: `creature:${k}`, label: SPECIES[k].name, sub: `#${String(i + 1).padStart(3, '0')}`, w: SPRITE, h: SPRITE, draw: () => creatureSprite(k), kind: 'creature' })),
  },
  {
    id: 'char', name: 'Personajes', hint: '16×17, cuatro direcciones y tres pasos cada una.',
    entries: () => Object.keys(LOOKS).map((look) => ({
      key: `char:${look}|down|0`, label: lookName(look), sub: look, w: 16, h: 17, draw: () => charSprite(look, 'down', 0), kind: 'char', look,
      frames: DIRS.flatMap(([d]) => [0, 1, 2].map((f) => ({ key: `char:${look}|${d}|${f}`, dir: d, frame: f, w: 16, h: 17, draw: () => charSprite(look, d, f), kind: 'char', look, label: lookName(look) }))),
    })),
  },
  {
    id: 'item', name: 'Objetos', hint: '16×16. Se ven en la mochila, la tienda y el suelo.',
    entries: () => Object.keys(ITEMS).map((k) => ({ key: `item:${k}`, label: ITEMS[k].name, sub: k, w: 16, h: 16, draw: () => itemCanvas(k), kind: 'item' })),
  },
  {
    id: 'badge', name: 'Medallas', hint: '16×16. Se ven en el carnet de entrenador.',
    entries: () => MEDALS.map((n, i) => ({ key: `badge:${i + 1}`, label: `Medalla ${n}`, sub: `#${i + 1}`, w: 16, h: 16, draw: () => badgeCanvas(i + 1), kind: 'item' })),
  },
  {
    id: 'tile', name: 'Suelo y edificios', hint: '16×16. Las piezas se repiten para formar los mapas.',
    entries: () => [
      ...Object.keys(TILE_INFO).flatMap((ch) => {
        const n = TILE_INFO[ch].anim ? 4 : 1;
        return Array.from({ length: n }, (_, f) => ({ key: `tile:${ch}${f}`, label: TILE_INFO[ch].name + (n > 1 ? ` (cuadro ${f + 1})` : ''), sub: `"${ch}"`, w: T, h: T, draw: () => tileCanvas(ch, f), kind: 'tile' }));
      }),
      ...Object.entries(THEMES).flatMap(([theme, set]) => Object.keys(set).map((ch) => ({
        key: `tile:${theme}|${ch}0`, label: `${TILE_INFO[ch]?.name ?? ch} · ${THEME_NAMES[theme] ?? theme}`, sub: `"${ch}"`, w: T, h: T, draw: () => tileCanvas(ch, 0, theme), kind: 'tile',
      }))),
    ],
  },
];

// ---------------------------------------------------------------- overrides: deployed + drafts
let base = { ...SPRITE_OVERRIDES };
let drafts = load();
function load() {
  try { return JSON.parse(store.getItem(DRAFTS_KEY) || '{}'); } catch { return {}; }
}
function persist() {
  try { store.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch { status('No se pudo guardar el borrador en este navegador (sin espacio).', 'error'); }
}
function live() {
  const out = { ...base };
  for (const [k, v] of Object.entries(drafts)) {
    if (v) out[k] = v;
    else delete out[k];
  }
  return out;
}
const refreshLive = () => setOverrides(live());
refreshLive();

/** Current pixels of an entry: drawing if there is one, else the generated art. */
function pixelsOf(e) {
  const o = live()[e.key];
  const px = o && o.w === e.w && o.h === e.h ? decodeSprite(o) : null;
  if (px) return px;
  return originalOf(e);
}
function originalOf(e) {
  const c = generated(e.draw);
  return c.getContext('2d').getImageData(0, 0, e.w, e.h).data.slice();
}
const sameBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// ---------------------------------------------------------------- state
const S = {
  cat: CATS[0], entries: [], filter: '', entry: null, group: null,
  px: null, undo: [], redo: [], tool: 'pencil', mirror: false, grid: true, showOriginal: false,
  color: [22, 20, 30, 255], zoom: 8, hover: null, painting: false,
};

// ---------------------------------------------------------------- DOM
const root = document.getElementById('editor');
const statusEl = h('p', { class: 'ed-status', role: 'status' });
const pending = h('span', { class: 'ed-pending' });
const fileInput = h('input', { type: 'file', accept: '.js,.json,text/javascript,application/json', hidden: true, onchange: importFile });

const header = h('header', { class: 'ed-head' },
  h('div', { class: 'ed-brand' }, h('b', { text: 'Poke Uruguay' }), h('span', { text: 'Editor de sprites' })),
  pending,
  h('div', { class: 'ed-actions' },
    h('button', { class: 'ed-btn', type: 'button', text: 'Cargar archivo', onclick: () => fileInput.click() }),
    h('button', { class: 'ed-btn', type: 'button', text: 'Descargar archivo', onclick: () => download() }),
    h('button', { class: 'ed-btn is-primary', type: 'button', text: 'Guardar en el juego', onclick: saveToGitHub }),
    h('button', { class: 'ed-btn', type: 'button', text: 'Salir', title: 'Cierra el modo desarrollador en este navegador', onclick: () => { lockDev(); location.reload(); } }),
  ),
  fileInput,
);

const tabs = h('nav', { class: 'ed-tabs' }, CATS.map((c) => h('button', { type: 'button', 'data-cat': c.id, text: c.name, onclick: () => selectCat(c) })));
const search = h('input', { class: 'ed-input ed-search', type: 'search', placeholder: 'Buscar…', oninput: () => { S.filter = search.value.trim().toLowerCase(); renderList(); } });
const catHint = h('p', { class: 'ed-hint' });
const list = h('ul', { class: 'ed-list' });
const side = h('aside', { class: 'ed-side' }, tabs, search, catHint, list);

const title = h('h1', { class: 'ed-title' });
const subtitle = h('p', { class: 'ed-sub' });
const frames = h('div', { class: 'ed-frames' });
const board = h('canvas', { class: 'ed-board' });
const coords = h('span', { class: 'ed-coords' });
const center = h('main', { class: 'ed-center' },
  h('div', { class: 'ed-titlebar' }, h('div', {}, title, subtitle), coords),
  frames,
  h('div', { class: 'ed-stage' }, board),
  statusEl,
);

const TOOLS = [['pencil', 'Lápiz', 'B'], ['eraser', 'Borrador', 'E'], ['fill', 'Balde', 'G'], ['picker', 'Gotero', 'I']];
const toolBtns = TOOLS.map(([id, label, key]) => h('button', { type: 'button', class: 'ed-tool', 'data-tool': id, title: `${label} (${key})`, onclick: () => setTool(id) }, h('span', { text: label }), h('kbd', { text: key })));
const mirrorBtn = h('button', { type: 'button', class: 'ed-toggle', title: 'Dibujo simétrico (M)', onclick: () => { S.mirror = !S.mirror; syncTools(); } }, 'Simetría', h('kbd', { text: 'M' }));
const gridBtn = h('button', { type: 'button', class: 'ed-toggle', title: 'Cuadrícula (H)', onclick: () => { S.grid = !S.grid; syncTools(); drawBoard(); } }, 'Cuadrícula', h('kbd', { text: 'H' }));
const origBtn = h('button', { type: 'button', class: 'ed-toggle', title: 'Ver el original generado mientras lo mantenés apretado (O)' }, 'Ver original', h('kbd', { text: 'O' }));
origBtn.addEventListener('pointerdown', () => { S.showOriginal = true; drawBoard(); });
for (const ev of ['pointerup', 'pointerleave']) origBtn.addEventListener(ev, () => { S.showOriginal = false; drawBoard(); });

const colorInput = h('input', { type: 'color', class: 'ed-color', oninput: () => { const [r, g, b] = hexToRgb(colorInput.value); S.color = [r, g, b, S.color[3] || 255]; syncColor(); } });
const alphaInput = h('input', { type: 'range', min: '0', max: '255', class: 'ed-alpha', oninput: () => { S.color[3] = +alphaInput.value; syncColor(); } });
const alphaLabel = h('span', { class: 'ed-alpha-val' });
const swatch = h('span', { class: 'ed-swatch' });
const usedColors = h('div', { class: 'ed-palette' });
const BASE_PALETTE = ['#16141e', '#ffffff', '#6cb4ee', '#2a6aae', '#f2c02a', '#e0263a', '#e8702a', '#5cae3c', '#2a6a2a', '#9a6a3c', '#6a3a1a', '#f2c8a0', '#c8ccd8', '#7a7a8a', '#8a4ac8', '#3fa8a0'];
const basePalette = h('div', { class: 'ed-palette' }, BASE_PALETTE.map((c) => h('button', { type: 'button', class: 'ed-chip', style: { '--c': c }, title: c, onclick: () => pickColor([...hexToRgb(c), 255]) })));

const prev1 = h('canvas', { class: 'ed-prev-1' });
const prev3 = h('canvas', { class: 'ed-prev-3' });
const scene = h('canvas', { class: 'ed-scene', width: 192, height: 112 });
const right = h('aside', { class: 'ed-right' },
  h('section', {}, h('h2', { text: 'Herramientas' }), h('div', { class: 'ed-tools' }, toolBtns), h('div', { class: 'ed-tools ed-toggles' }, mirrorBtn, gridBtn, origBtn)),
  h('section', {}, h('h2', { text: 'Acciones' }), h('div', { class: 'ed-tools' },
    h('button', { type: 'button', class: 'ed-tool', title: 'Deshacer (Ctrl+Z)', onclick: undo }, h('span', { text: 'Deshacer' }), h('kbd', { text: 'Ctrl Z' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Rehacer (Ctrl+Y)', onclick: redo }, h('span', { text: 'Rehacer' }), h('kbd', { text: 'Ctrl Y' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Espejar horizontalmente', onclick: () => transform('flip') }, h('span', { text: 'Espejar' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Mover todo 1 píxel (flechas)', onclick: () => transform('left') }, h('span', { text: 'Mover ←' }), h('kbd', { text: '←' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Mover todo 1 píxel (flechas)', onclick: () => transform('right') }, h('span', { text: 'Mover →' }), h('kbd', { text: '→' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Borrar todo el dibujo', onclick: () => transform('clear') }, h('span', { text: 'Vaciar' })),
    h('button', { type: 'button', class: 'ed-tool is-danger', title: 'Volver al sprite que genera el juego', onclick: restore }, h('span', { text: 'Restaurar original' })),
  )),
  h('section', {}, h('h2', { text: 'Color' }),
    h('div', { class: 'ed-colorrow' }, swatch, colorInput, h('label', { class: 'ed-alpha-wrap' }, 'Opacidad', alphaInput, alphaLabel)),
    h('h3', { text: 'Colores de este sprite' }), usedColors,
    h('h3', { text: 'Paleta base' }), basePalette),
  h('section', {}, h('h2', { text: 'Vista previa' }), h('div', { class: 'ed-prevs' }, prev1, prev3), scene),
);

root.append(header, h('div', { class: 'ed-body' }, side, center, right));

// ---------------------------------------------------------------- helpers
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
const rgbHex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const rgbaCss = ([r, g, b, a]) => `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;

function status(text, kind = '') {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

function canvasFromPixels(px, w, hgt) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = hgt;
  c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(px), w, hgt), 0, 0);
  return c;
}

// ---------------------------------------------------------------- list
function selectCat(c) {
  S.cat = c;
  S.entries = c.entries();
  catHint.textContent = c.hint;
  for (const b of tabs.children) b.classList.toggle('is-active', b.dataset.cat === c.id);
  renderList();
  select(S.entries[0]);
}

const thumbObserver = new IntersectionObserver((items) => {
  for (const it of items) {
    if (!it.isIntersecting) continue;
    thumbObserver.unobserve(it.target);
    paintThumb(it.target);
  }
}, { root: list, rootMargin: '200px' });

function paintThumb(cv) {
  const e = cv._entry;
  cv.width = e.w;
  cv.height = e.h;
  cv.getContext('2d').drawImage(e.draw(), 0, 0);
}

function renderList() {
  const lv = live();
  const shown = S.entries.filter((e) => !S.filter || `${e.label} ${e.sub}`.toLowerCase().includes(S.filter));
  list.replaceChildren(...shown.map((e) => {
    const keys = e.frames ? e.frames.map((f) => f.key) : [e.key];
    const edited = keys.some((k) => lv[k]);
    const draft = keys.some((k) => k in drafts);
    const cv = h('canvas', { class: 'ed-thumb' });
    cv._entry = e;
    thumbObserver.observe(cv);
    const li = h('li', { class: `${S.group === e ? 'is-active' : ''}`, onclick: () => select(e) },
      cv, h('span', { class: 'ed-label', text: e.label }), h('small', { text: e.sub }),
      edited || draft ? h('i', { class: `ed-dot ${draft ? 'is-draft' : ''}`, title: draft ? 'Cambios sin guardar en el juego' : 'Dibujado en el editor' }) : null);
    li._entry = e;
    return li;
  }));
  if (!shown.length) list.append(h('li', { class: 'ed-empty', text: 'Nada coincide con la búsqueda.' }));
}

function refreshThumbs() {
  for (const li of list.children) {
    const cv = li.querySelector('canvas');
    if (cv?._entry && cv.width) paintThumb(cv);
  }
}

// ---------------------------------------------------------------- selection
function select(e, frame = null) {
  if (!e) return;
  S.group = e;
  S.entry = frame ?? (e.frames ? e.frames[0] : e);
  for (const li of list.children) li.classList.toggle('is-active', li._entry === e);
  S.px = pixelsOf(S.entry);
  S.undo = [];
  S.redo = [];
  const stage = board.parentElement.getBoundingClientRect();
  const aw = Math.max(320, stage.width - 48);
  const ah = Math.max(320, Math.min(stage.height, innerHeight - 220) - 48);
  S.zoom = clamp(Math.floor(Math.min(aw / S.entry.w, ah / S.entry.h)), 4, 40);
  board.width = S.entry.w * S.zoom;
  board.height = S.entry.h * S.zoom;
  board.style.setProperty('--cell', `${S.zoom}px`);
  title.textContent = S.entry.label ?? e.label;
  subtitle.textContent = `${S.entry.w}×${S.entry.h} px · ${S.entry.dir ? `${DIRS.find(([d]) => d === S.entry.dir)[1]}, paso ${S.entry.frame + 1}` : e.sub}`;
  renderFrames();
  drawAll();
  status(S.entry.key in drafts ? 'Este sprite tiene cambios sin guardar en el juego.' : live()[S.entry.key] ? 'Este sprite ya está dibujado a mano en el juego.' : 'Sprite original, generado por el juego.');
}

function renderFrames() {
  const e = S.group;
  if (!e.frames) { frames.replaceChildren(); frames.hidden = true; return; }
  frames.hidden = false;
  const lv = live();
  frames.replaceChildren(...DIRS.map(([d, name]) => h('div', { class: 'ed-frame-row' }, h('span', { text: name }),
    e.frames.filter((f) => f.dir === d).map((f) => {
      const cv = h('canvas', { width: 16, height: 17 });
      cv.getContext('2d').drawImage(f.draw(), 0, 0);
      return h('button', { type: 'button', class: `ed-frame ${S.entry === f ? 'is-active' : ''} ${lv[f.key] ? 'is-edited' : ''}`, title: `${name}, paso ${f.frame + 1}`, onclick: () => select(e, f) }, cv);
    }),
    d === 'left' ? h('button', { type: 'button', class: 'ed-btn ed-mini', text: 'Copiar de la derecha espejado', onclick: mirrorFromRight }) : null,
  )));
}

// ---------------------------------------------------------------- drawing
function drawBoard() {
  const { w, h: hh } = S.entry;
  const g = board.getContext('2d');
  const z = S.zoom;
  g.clearRect(0, 0, board.width, board.height);
  g.imageSmoothingEnabled = false;
  const px = S.showOriginal ? originalOf(S.entry) : S.px;
  g.drawImage(canvasFromPixels(px, w, hh), 0, 0, w * z, hh * z);
  if (S.grid && z >= 6) {
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 1; x < w; x++) { g.moveTo(x * z + 0.5, 0); g.lineTo(x * z + 0.5, hh * z); }
    for (let y = 1; y < hh; y++) { g.moveTo(0, y * z + 0.5); g.lineTo(w * z, y * z + 0.5); }
    g.stroke();
    if (S.mirror) {
      g.strokeStyle = 'rgba(242,192,42,0.6)';
      g.beginPath(); g.moveTo((w * z) / 2 + 0.5, 0); g.lineTo((w * z) / 2 + 0.5, hh * z); g.stroke();
    }
  }
  if (S.hover && !S.showOriginal) {
    g.strokeStyle = 'rgba(242,192,42,0.95)';
    g.lineWidth = 2;
    g.strokeRect(S.hover.x * z + 1, S.hover.y * z + 1, z - 2, z - 2);
  }
}

function drawPreviews() {
  const { w, h: hh, kind } = S.entry;
  const c = canvasFromPixels(S.px, w, hh);
  for (const [cv, s] of [[prev1, 1], [prev3, 3]]) {
    cv.width = w * s;
    cv.height = hh * s;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(c, 0, 0, w * s, hh * s);
  }
  const g = scene.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, scene.width, scene.height);
  if (kind === 'tile') {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 12; x++) g.drawImage(c, x * 16, y * 16);
  } else if (kind === 'creature') {
    // Battle look: foe on the right, the player's (mirrored) on the left.
    const sky = g.createLinearGradient(0, 0, 0, 112);
    sky.addColorStop(0, '#9ad0f0'); sky.addColorStop(1, '#e8f4d8');
    g.fillStyle = sky; g.fillRect(0, 0, 192, 112);
    g.fillStyle = '#7ab85a';
    g.beginPath(); g.ellipse(140, 66, 40, 9, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(52, 104, 48, 10, 0, 0, 7); g.fill();
    g.drawImage(c, 104, 0, 72, 72);
    g.save(); g.translate(92, 0); g.scale(-1, 1); g.drawImage(c, 0, 30, 80, 80); g.restore();
  } else if (kind === 'char') {
    g.fillStyle = '#5cae3c'; g.fillRect(0, 0, 192, 112);
    g.fillStyle = '#c8b078'; g.fillRect(0, 48, 192, 16);
  } else {
    g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, 192, 112);
    g.fillStyle = '#16141e'; g.font = '10px "Pixelify Sans", sans-serif';
    g.drawImage(c, 16, 24, 32, 32); g.drawImage(c, 64, 16, 48, 48); g.drawImage(c, 128, 32, 16, 16);
  }
}

// Walking preview for characters: frames 0,1,0,2 of the edited direction, with the live drawings.
let walkTimer = 0;
function animateWalk() {
  clearInterval(walkTimer);
  if (S.entry?.kind !== 'char') return;
  let i = 0;
  walkTimer = setInterval(() => {
    if (S.entry?.kind !== 'char') return clearInterval(walkTimer);
    const g = scene.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#5cae3c'; g.fillRect(0, 0, 192, 112);
    g.fillStyle = '#c8b078'; g.fillRect(0, 40, 192, 34);
    const step = [0, 1, 0, 2][i++ % 4];
    const { look, dir } = S.entry;
    const cur = S.entry.frame === step ? canvasFromPixels(S.px, 16, 17) : charSprite(look, dir, step);
    g.drawImage(cur, 80, 22, 32, 34);
    DIRS.forEach(([d], k) => g.drawImage(charSprite(look, d, 0), 16 + k * 44, 80, 16, 17));
  }, 180);
}

function drawPalette() {
  const counts = new Map();
  for (let i = 0; i < S.px.length; i += 4) {
    if (!S.px[i + 3]) continue;
    const k = `${S.px[i]},${S.px[i + 1]},${S.px[i + 2]},${S.px[i + 3]}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  usedColors.replaceChildren(...top.map(([k]) => {
    const c = k.split(',').map(Number);
    return h('button', { type: 'button', class: 'ed-chip', style: { '--c': rgbaCss(c) }, title: rgbHex(c), onclick: () => pickColor(c) });
  }));
}

function drawAll() {
  drawBoard();
  drawPreviews();
  drawPalette();
  animateWalk();
  syncColor();
  syncPending();
}

function cellAt(ev) {
  const r = board.getBoundingClientRect();
  const x = Math.floor(((ev.clientX - r.left) / r.width) * S.entry.w);
  const y = Math.floor(((ev.clientY - r.top) / r.height) * S.entry.h);
  return x >= 0 && y >= 0 && x < S.entry.w && y < S.entry.h ? { x, y } : null;
}

function setPixel(x, y, col) {
  const i = (y * S.entry.w + x) * 4;
  S.px[i] = col[0]; S.px[i + 1] = col[1]; S.px[i + 2] = col[2]; S.px[i + 3] = col[3];
}
function paintAt({ x, y }, col) {
  setPixel(x, y, col);
  if (S.mirror) setPixel(S.entry.w - 1 - x, y, col);
}
function getPixel(x, y) {
  const i = (y * S.entry.w + x) * 4;
  return [S.px[i], S.px[i + 1], S.px[i + 2], S.px[i + 3]];
}

function floodFill(x0, y0, col) {
  const { w, h: hh } = S.entry;
  const target = getPixel(x0, y0).join();
  if (target === col.join()) return;
  const stack = [[x0, y0]];
  const seen = new Uint8Array(w * hh);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= hh || seen[y * w + x]) continue;
    seen[y * w + x] = 1;
    if (getPixel(x, y).join() !== target) continue;
    setPixel(x, y, col);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function snapshot() {
  S.undo.push(S.px.slice());
  if (S.undo.length > MAX_UNDO) S.undo.shift();
  S.redo = [];
}

let lastCell = null;
board.addEventListener('contextmenu', (ev) => ev.preventDefault());
board.addEventListener('pointerdown', (ev) => {
  const cell = cellAt(ev);
  if (!cell) return;
  board.setPointerCapture(ev.pointerId);
  const tool = ev.button === 2 ? 'eraser' : S.tool;
  if (tool === 'picker') {
    pickColor(getPixel(cell.x, cell.y));
    setTool('pencil');
    return;
  }
  snapshot();
  if (tool === 'fill') {
    floodFill(cell.x, cell.y, S.color);
    if (S.mirror) floodFill(S.entry.w - 1 - cell.x, cell.y, S.color);
    commit();
    return;
  }
  S.painting = tool;
  lastCell = cell;
  paintAt(cell, tool === 'eraser' ? [0, 0, 0, 0] : S.color);
  drawBoard();
});
board.addEventListener('pointermove', (ev) => {
  const cell = cellAt(ev);
  S.hover = cell;
  coords.textContent = cell ? `x ${cell.x} · y ${cell.y}` : '';
  if (S.painting && cell) {
    // Fill the gap between pointer events so fast strokes stay continuous.
    const col = S.painting === 'eraser' ? [0, 0, 0, 0] : S.color;
    const from = lastCell ?? cell;
    const n = Math.max(Math.abs(cell.x - from.x), Math.abs(cell.y - from.y));
    for (let i = 1; i <= n; i++) paintAt({ x: Math.round(from.x + ((cell.x - from.x) * i) / n), y: Math.round(from.y + ((cell.y - from.y) * i) / n) }, col);
    paintAt(cell, col);
    lastCell = cell;
  }
  drawBoard();
});
const endStroke = () => {
  if (!S.painting) return;
  S.painting = false;
  lastCell = null;
  commit();
};
board.addEventListener('pointerup', endStroke);
board.addEventListener('pointercancel', endStroke);
board.addEventListener('pointerleave', () => { S.hover = null; coords.textContent = ''; drawBoard(); });

/** Store the current pixels as a draft (or drop the draft when they match what the game already has). */
function commit() {
  const e = S.entry;
  const orig = originalOf(e);
  if (sameBytes(S.px, orig)) {
    if (base[e.key]) drafts[e.key] = null;
    else delete drafts[e.key];
  } else {
    const enc = encodeSprite(S.px, e.w, e.h);
    if (JSON.stringify(enc) === JSON.stringify(base[e.key])) delete drafts[e.key];
    else drafts[e.key] = enc;
  }
  persist();
  refreshLive();
  drawAll();
  refreshThumbs();
  if (S.group?.frames) renderFrames();
  markListDots();
  status(e.key in drafts ? 'Cambios guardados en este navegador. Falta "Guardar en el juego" para publicarlos.' : 'Igual al sprite que ya tiene el juego.');
}

function markListDots() {
  const lv = live();
  for (const li of list.children) {
    const e = li._entry;
    if (!e) continue;
    const keys = e.frames ? e.frames.map((f) => f.key) : [e.key];
    const draft = keys.some((k) => k in drafts);
    const edited = keys.some((k) => lv[k]);
    li.querySelector('.ed-dot')?.remove();
    if (draft || edited) li.append(h('i', { class: `ed-dot ${draft ? 'is-draft' : ''}` }));
  }
}

function undo() {
  if (!S.undo.length) return;
  S.redo.push(S.px.slice());
  S.px = S.undo.pop();
  commit();
}
function redo() {
  if (!S.redo.length) return;
  S.undo.push(S.px.slice());
  S.px = S.redo.pop();
  commit();
}

function transform(kind) {
  const { w, h: hh } = S.entry;
  const src = S.px.slice();
  snapshot();
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
    let sx = x;
    let sy = y;
    if (kind === 'flip') sx = w - 1 - x;
    if (kind === 'left') sx = x + 1;
    if (kind === 'right') sx = x - 1;
    if (kind === 'up') sy = y + 1;
    if (kind === 'down') sy = y - 1;
    if (kind === 'clear' || sx < 0 || sx >= w || sy < 0 || sy >= hh) continue;
    out.set(src.subarray((sy * w + sx) * 4, (sy * w + sx) * 4 + 4), (y * w + x) * 4);
  }
  S.px = out;
  commit();
}

function restore() {
  snapshot();
  S.px = originalOf(S.entry);
  commit();
  status('Volvió al sprite original. Guardá en el juego para que el cambio llegue a todos.');
}

function mirrorFromRight() {
  const e = S.group;
  const f = S.entry;
  if (f.dir !== 'left') return;
  const src = e.frames.find((x) => x.dir === 'right' && x.frame === f.frame);
  const px = pixelsOf(src);
  snapshot();
  const out = new Uint8ClampedArray(px.length);
  for (let y = 0; y < 17; y++) for (let x = 0; x < 16; x++) out.set(px.subarray((y * 16 + 15 - x) * 4, (y * 16 + 15 - x) * 4 + 4), (y * 16 + x) * 4);
  S.px = out;
  commit();
}

// ---------------------------------------------------------------- tools & colour
function setTool(id) {
  S.tool = id;
  syncTools();
}
function syncTools() {
  for (const b of toolBtns) b.classList.toggle('is-active', b.dataset.tool === S.tool);
  mirrorBtn.classList.toggle('is-active', S.mirror);
  gridBtn.classList.toggle('is-active', S.grid);
  board.dataset.tool = S.tool;
  if (S.entry) drawBoard();
}
function pickColor(c) {
  S.color = c[3] ? [...c] : [S.color[0], S.color[1], S.color[2], 255];
  syncColor();
}
function syncColor() {
  colorInput.value = rgbHex(S.color);
  alphaInput.value = String(S.color[3]);
  alphaLabel.textContent = `${Math.round((S.color[3] / 255) * 100)}%`;
  swatch.style.setProperty('--c', rgbaCss(S.color));
}

function syncPending() {
  const n = Object.keys(drafts).length;
  pending.textContent = n ? `${n} cambio${n === 1 ? '' : 's'} sin guardar en el juego` : 'Todo guardado';
  pending.classList.toggle('has-changes', n > 0);
}

addEventListener('keydown', (ev) => {
  if (ev.target instanceof HTMLInputElement) return;
  const k = ev.key.toLowerCase();
  if ((ev.ctrlKey || ev.metaKey) && k === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
  if ((ev.ctrlKey || ev.metaKey) && k === 'y') { ev.preventDefault(); redo(); return; }
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const tool = { b: 'pencil', e: 'eraser', g: 'fill', i: 'picker' }[k];
  if (tool) setTool(tool);
  else if (k === 'm') { S.mirror = !S.mirror; syncTools(); }
  else if (k === 'h') { S.grid = !S.grid; syncTools(); }
  else if (k === 'o' && !S.showOriginal) { S.showOriginal = true; drawBoard(); }
  else if (ev.key.startsWith('Arrow')) { ev.preventDefault(); transform(ev.key.slice(5).toLowerCase()); }
});
addEventListener('keyup', (ev) => {
  if (ev.key.toLowerCase() === 'o' && S.showOriginal) { S.showOriginal = false; drawBoard(); }
});

// ---------------------------------------------------------------- files & GitHub
function download(quiet = false) {
  const blob = new Blob([overridesSource(live())], { type: 'text/javascript' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'sprite-overrides.js' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  if (!quiet) status('Archivo descargado. Para que el juego lo use, va en src/data/sprite-overrides.js del repo.');
}

async function importFile() {
  const f = fileInput.files?.[0];
  fileInput.value = '';
  if (!f) return;
  try {
    const text = await f.text();
    const map = text.trim().startsWith('{') ? JSON.parse(text) : parseOverridesSource(text);
    for (const k of Object.keys(base)) if (!(k in map)) drafts[k] = null;
    for (const [k, v] of Object.entries(map)) {
      if (!decodeSprite(v)) continue;
      if (JSON.stringify(v) === JSON.stringify(base[k])) delete drafts[k];
      else drafts[k] = v;
    }
    persist();
    refreshLive();
    select(S.group, S.entry);
    renderList();
    status(`Cargado ${f.name}: ${Object.keys(map).length} sprites.`, 'ok');
  } catch (err) {
    status(`No se pudo leer el archivo (${err.message}).`, 'error');
  }
}

const b64encode = (text) => btoa(unescape(encodeURIComponent(text)));
const b64decode = (b64) => decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));

async function saveToGitHub() {
  const token = devToken();
  if (!Object.keys(drafts).length) return status('No hay cambios para guardar.');
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
  status('Guardando en GitHub…');
  try {
    const cur = await fetch(`${url}?ref=main`, { headers });
    if (!cur.ok) throw await ghError(cur);
    const meta = await cur.json();
    // Merge on top of what is on GitHub now, so edits made from another computer are kept.
    const merged = parseOverridesSource(b64decode(meta.content));
    for (const [k, v] of Object.entries(drafts)) {
      if (v) merged[k] = v;
      else delete merged[k];
    }
    const n = Object.keys(drafts).length;
    const body = { message: `Editor de sprites: ${n} cambio${n === 1 ? '' : 's'}`, content: b64encode(overridesSource(merged)), sha: meta.sha, branch: 'main' };
    const put = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!put.ok) throw await ghError(put);
    base = merged;
    drafts = {};
    persist();
    refreshLive();
    renderList();
    syncPending();
    status('Guardado. El juego publicado se actualiza solo en uno o dos minutos.', 'ok');
  } catch (err) {
    status(`No se pudo guardar en GitHub: ${err.message} Se descargó el archivo con tus dibujos para que no los pierdas.`, 'error');
    download(true);
  }
}

/** Turns a failed GitHub response into a message that says what to fix. */
async function ghError(res) {
  let detail = '';
  try { detail = (await res.json()).message ?? ''; } catch { /* no body */ }
  const hint = {
    401: 'El token venció o es incorrecto: generá uno nuevo.',
    403: 'El token no tiene permiso de escritura (Contents: Read and write) sobre este repositorio, o GitHub limitó los pedidos.',
    404: 'El token no ve el repositorio: al crearlo hay que elegir "Only select repositories" con fefow/poke-uruguay.',
    409: 'Alguien guardó al mismo tiempo: probá de nuevo.',
    422: 'GitHub rechazó el cambio: probá de nuevo.',
  }[res.status] ?? '';
  return new Error(`GitHub respondió ${res.status}${detail ? ` («${detail}»)` : ''}. ${hint}`);
}

// ---------------------------------------------------------------- start
// Locked until a GitHub token with write access to the repo is verified (checked again on every visit).
function start() {
  lock.remove();
  syncTools();
  selectCat(CATS[0]);
}
const lockInput = h('input', { type: 'password', class: 'ed-input', placeholder: 'Token de GitHub', autocomplete: 'off', spellcheck: 'false' });
const lockMsg = h('p', { class: 'ed-lock-msg', role: 'status' });
const lockForm = h('form', { class: 'ed-lock-card' },
  h('b', { text: 'Poke Uruguay' }),
  h('h1', { text: 'Editor de sprites' }),
  h('p', { text: 'Acceso solo para el desarrollador. Ingresá un token de GitHub con permiso de escritura sobre el repo del juego.' }),
  lockInput,
  h('button', { class: 'ed-btn is-primary', type: 'submit', text: 'Entrar' }),
  lockMsg);
const lock = h('div', { class: 'ed-lock' }, lockForm);
document.body.append(lock);
const denied = { denied: 'Ese token no tiene permiso de escritura sobre el repo.', offline: 'No se pudo conectar con GitHub. Probá de nuevo.' };
lockForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  lockMsg.textContent = 'Verificando…';
  const r = await unlockDev(lockInput.value);
  if (r === 'ok') start();
  else lockMsg.textContent = denied[r];
});
if (isDev()) {
  lockMsg.textContent = 'Verificando acceso…';
  checkToken(devToken()).then((r) => {
    if (r === 'ok') return start();
    if (r === 'denied') lockDev();
    lockMsg.textContent = denied[r];
  });
}
