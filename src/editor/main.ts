// Visual sprite editor (editor.html). Paints over any sprite the game generates with code and stores the
// result in src/data/sprite-overrides.js, which the game reads first (see gfx/overrides.js).
// Work in progress is kept in this browser; "Guardar en el juego" commits the file to GitHub (redeploys Pages).
import { SPECIES, DEX_ORDER } from '../data/species.ts';
import { ITEMS } from '../data/items.ts';
import { SPRITE_OVERRIDES } from '../data/sprite-overrides.js';
import { CUSTOM } from '../data/custom-content.js';
import { TYPES } from '../data/types.ts';
import { OUTDOOR } from '../data/maps.ts';
import { creatureSprite, SPRITE } from '../gfx/creatures.ts';
import { charSprite, LOOKS } from '../gfx/characters.ts';
import { itemCanvas } from '../gfx/items.ts';
import { badgeCanvas } from '../gfx/badges.ts';
import { tileCanvas, TILE_INFO, THEMES, T } from '../gfx/tiles.ts';
import { generated, setOverrides } from '../gfx/overrides.ts';
import { encodeSprite, decodeSprite, overridesSource, parseOverridesSource } from '../gfx/sprite-codec.ts';
import { h, clamp, safeStorage } from '../core/util.ts';
import { devToken, isDev, unlockDev, checkToken, lockDev } from '../core/devauth.ts';

const REPO = 'fefow/poke-uruguay';
const FILE = 'src/data/sprite-overrides.js';
const store = safeStorage();
const DRAFTS_KEY = 'pokeuy:sprite-drafts';
const CUSTOM_KEY = 'pokeuy:custom-drafts';
const CUSTOM_FILE = 'src/data/custom-content.js';
const MAX_UNDO = 60;

// ---------------------------------------------------------------- catalogue
const DIRS = [['down', 'Abajo'], ['up', 'Arriba'], ['left', 'Izquierda'], ['right', 'Derecha']];
const MEDALS = ['Montevideo', 'Maldonado', 'Treinta y Tres', 'Durazno', 'Tacuarembó', 'Rivera', 'Salto', 'Fray Bentos'];
const THEME_NAMES = { poli: 'Policlínica', gym_agua: 'Gimnasio Agua', gym_elec: 'Gimnasio Eléctrico', gym_roca: 'Gimnasio Roca' };
const lookName = (k) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// New content made here (creatures, looks, map pieces) waits in the browser until it is saved to the game.
type NewCustom = { creatures: any[]; looks: any[]; tiles: any[]; removed: { creatures: string[]; looks: string[]; tiles: string[] } };
const noRemoved = () => ({ creatures: [] as string[], looks: [] as string[], tiles: [] as string[] });
function loadCustom(): NewCustom {
  try {
    const o = JSON.parse(store.getItem(CUSTOM_KEY) || '{}');
    const fresh = (list, field, deployed) => (list ?? []).filter((x) => !deployed.some((d) => d[field] === x[field])); // already in the deployed game: drop
    return { creatures: fresh(o.creatures, 'key', CUSTOM.creatures), looks: fresh(o.looks, 'key', CUSTOM.looks), tiles: fresh(o.tiles, 'ch', CUSTOM.tiles), removed: { ...noRemoved(), ...(o.removed ?? {}) } };
  } catch { return { creatures: [], looks: [], tiles: [], removed: noRemoved() }; }
}
let newCustom: NewCustom = loadCustom();
const persistCustom = () => { try { store.setItem(CUSTOM_KEY, JSON.stringify(newCustom)); } catch { /* no space */ } };
const blank = (w, hgt) => { const c = document.createElement('canvas'); c.width = w; c.height = hgt; return c; };
const draftBase = (look) => newCustom.looks.find((l) => l.key === look)?.base ?? look;

/** Draws several 16×16 tiles side by side into one canvas (cols×rows), for pieces painted together. */
function composeTiles(tiles, cols, rows, src) {
  const c = blank(T * cols, T * rows);
  const g2 = c.getContext('2d');
  for (const t of tiles) g2.drawImage(src(t), t.col * T, t.row * T);
  return c;
}
/** The usual list of the game's tiles, themed variants included (the ones painted as a group are left out). */
function tileEntries(skip: Set<string>) {
  return [
    ...Object.keys(TILE_INFO).filter((ch) => !skip.has(ch)).flatMap((ch) => {
      const n = TILE_INFO[ch].anim ? 4 : 1;
      return Array.from({ length: n }, (_, f) => ({ key: `tile:${ch}${f}`, label: TILE_INFO[ch].name + (n > 1 ? ` (cuadro ${f + 1})` : ''), sub: `"${ch}"`, w: T, h: T, draw: () => tileCanvas(ch, f), kind: 'tile' }));
    }),
    ...Object.entries(THEMES).flatMap(([theme, set]) => Object.keys(set).map((ch) => ({
      key: `tile:${theme}|${ch}0`, label: `${TILE_INFO[ch]?.name ?? ch} · ${THEME_NAMES[theme] ?? theme}`, sub: `"${ch}"`, w: T, h: T, draw: () => tileCanvas(ch, 0, theme), kind: 'tile',
    }))),
  ];
}

const CATS: any[] = [
  {
    id: 'creature', name: 'Criaturas', hint: '80×80. El dorso en combate es el mismo dibujo espejado.',
    make: 'creature',
    entries: () => [
      ...DEX_ORDER.map((k, i) => ({ key: `creature:${k}`, label: SPECIES[k].name, sub: `#${String(i + 1).padStart(3, '0')}`, w: SPRITE, h: SPRITE, draw: () => creatureSprite(k), kind: 'creature' })),
      ...newCustom.creatures.map((c) => ({ key: `creature:${c.key}`, label: c.name, sub: c.saved ? 'nueva · guardada' : 'nueva · sin guardar', w: SPRITE, h: SPRITE, draw: () => blank(SPRITE, SPRITE), kind: 'creature' })),
    ],
  },
  {
    id: 'char', make: 'char', name: 'Personajes', hint: '16×17, cuatro direcciones y tres pasos cada una.',
    entries: () => [...Object.keys(LOOKS), ...newCustom.looks.map((l) => l.key)].map((look) => ({
      key: `char:${look}|down|0`, label: (newCustom.looks.find((l) => l.key === look)?.name ?? lookName(look)), sub: look, w: 16, h: 17, draw: () => charSprite(draftBase(look), 'down', 0), kind: 'char', look,
      frames: DIRS.flatMap(([d]) => [0, 1, 2].map((f) => ({ key: `char:${look}|${d}|${f}`, dir: d, frame: f, w: 16, h: 17, draw: () => charSprite(draftBase(look), d, f), kind: 'char', look, label: (newCustom.looks.find((l) => l.key === look)?.name ?? lookName(look)) }))),
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
    id: 'tile', make: 'tile', name: 'Suelo y edificios', hint: '16×16. Las piezas se repiten para formar los mapas.',
    entries: () => {
      const all = [...(CUSTOM.tiles ?? []).filter((t) => !newCustom.tiles.some((n) => n.ch === t.ch)), ...newCustom.tiles];
      const groups = new Map<string, any[]>();
      for (const t of all) if (t.grp) groups.set(t.grp.id, [...(groups.get(t.grp.id) ?? []), t].sort((a, b) => a.grp.i - b.grp.i));
      const grouped = new Set([...groups.values()].flat().map((t) => t.ch));
      const unsaved = (t) => newCustom.tiles.some((n) => n.ch === t.ch && !n.saved);
      return [
        ...[...groups.entries()].map(([id, ts]) => {
          const { cols, rows } = ts[0].grp;
          const tiles = ts.map((t) => ({ ch: t.ch, col: t.grp.i % cols, row: Math.floor(t.grp.i / cols) }));
          return { key: `tilegroup:${id}`, label: ts[0].name.replace(/_\d+$/, ''), sub: `${cols}×${rows} casillas · ${ts.some(unsaved) ? 'sin guardar' : 'guardada'}`, w: T * cols, h: T * rows, tiles, kind: 'tile', draw: () => composeTiles(tiles, cols, rows, (t) => tileCanvas(t.ch in TILE_INFO ? t.ch : '.', 0)) };
        }),
        ...newCustom.tiles.filter((t) => !t.grp).map((t) => ({ key: `tile:${t.ch}0`, label: t.name, sub: t.saved ? 'nueva · guardada' : 'nueva · sin guardar', w: T, h: T, draw: () => tileCanvas('.', 0), kind: 'tile' })),
        ...tileEntries(grouped),
      ];
    },
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
  if (e.tiles) return groupPixels(e, pixelsOf);
  const o = live()[e.key];
  const px = o && o.w === e.w && o.h === e.h ? decodeSprite(o) : null;
  if (px) return px;
  return originalOf(e);
}
function originalOf(e) {
  if (e.tiles) return groupPixels(e, originalOf);
  const c = generated(e.draw);
  return c.getContext('2d').getImageData(0, 0, e.w, e.h).data.slice();
}
/** The tile entry behind one square of a group painted together. */
const subTile = (t) => ({ key: `tile:${t.ch}0`, w: T, h: T, draw: () => tileCanvas(t.ch in TILE_INFO ? t.ch : '.', 0) });
/** Pixels of a whole group: each square comes from its own tile. */
function groupPixels(e, one) {
  const W = e.w, out = new Uint8ClampedArray(W * e.h * 4);
  for (const t of e.tiles) {
    const px = one(subTile(t));
    for (let y = 0; y < T; y++) out.set(px.subarray(y * T * 4, (y + 1) * T * 4), ((t.row * T + y) * W + t.col * T) * 4);
  }
  return out;
}
const sameBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// ---------------------------------------------------------------- state
const S = {
  cat: CATS[0], entries: [], filter: '', entry: null, group: null,
  px: null, undo: [], redo: [], tool: 'pencil', mirror: false, grid: true, showOriginal: false,
  color: [22, 20, 30, 255], zoom: 8, hover: null, painting: false as boolean | string,
  sel: null, selAnchor: null, clip: null, pasteBlank: false, bulk: null, // selection, clipboard, last paste into several variants (undoable)
};

// ---------------------------------------------------------------- DOM
const root = document.getElementById('editor');
const statusEl = h('p', { class: 'ed-status', role: 'status' });
const pending = h('span', { class: 'ed-pending' });
const fileInput = h('input', { type: 'file', accept: '.js,.json,text/javascript,application/json', hidden: true, onchange: importFile });

const header = h('header', { class: 'ed-head' },
  h('div', { class: 'ed-brand' }, h('b', { text: 'Poke Uruguay' }), h('span', { text: 'Editor de sprites' })),
  h('a', { class: 'ed-btn ed-mini', href: 'map-editor.html', text: 'Editor de mapas' }),
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
const newBtn = h('button', { class: 'ed-btn is-primary ed-new', type: 'button', onclick: () => openNewForm() });
const delBtn = h('button', { class: 'ed-btn me-danger ed-new', type: 'button', hidden: true, text: 'Borrar esta creación', onclick: () => deleteCustom() });
const side = h('aside', { class: 'ed-side' }, tabs, newBtn, delBtn, search, catHint, list);

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

const TOOLS = [['pencil', 'Lápiz', 'B'], ['eraser', 'Borrador', 'E'], ['fill', 'Balde', 'G'], ['picker', 'Gotero', 'I'], ['select', 'Seleccionar', 'S']];
const toolBtns = TOOLS.map(([id, label, key]) => h('button', { type: 'button', class: 'ed-tool', 'data-tool': id, title: `${label} (${key})`, onclick: () => setTool(id) }, h('span', { text: label }), h('kbd', { text: key })));
const mirrorBtn = h('button', { type: 'button', class: 'ed-toggle', title: 'Dibujo simétrico (M)', onclick: () => { S.mirror = !S.mirror; syncTools(); } }, 'Simetría', h('kbd', { text: 'M' }));
const gridBtn = h('button', { type: 'button', class: 'ed-toggle', title: 'Cuadrícula (H)', onclick: () => { S.grid = !S.grid; syncTools(); drawBoard(); } }, 'Cuadrícula', h('kbd', { text: 'H' }));
const origBtn = h('button', { type: 'button', class: 'ed-toggle', title: 'Ver el original generado mientras lo mantenés apretado (O)' }, 'Ver original', h('kbd', { text: 'O' }));
origBtn.addEventListener('pointerdown', () => { S.showOriginal = true; drawBoard(); });
for (const ev of ['pointerup', 'pointerleave']) origBtn.addEventListener(ev, () => { S.showOriginal = false; drawBoard(); });

const pasteBlankBtn = h('button', { type: 'button', class: 'ed-toggle', title: 'Al pegar, lo transparente también borra lo que había debajo', onclick: () => { S.pasteBlank = !S.pasteBlank; syncTools(); } }, 'Pegar con transparencia');
const colorInput = h('input', { type: 'color', class: 'ed-color', oninput: () => { const [r, g, b] = hexToRgb(colorInput.value); S.color = [r, g, b, S.color[3] || 255]; syncColor(); } });
const alphaInput = h('input', { type: 'range', min: '0', max: '255', class: 'ed-alpha', oninput: () => { S.color[3] = +alphaInput.value; syncColor(); } });
const alphaLabel = h('span', { class: 'ed-alpha-val' });
const swatch = h('span', { class: 'ed-swatch' });
const usedColors = h('div', { class: 'ed-palette' });
const BASE_PALETTE = ['#16141e', '#ffffff', '#6cb4ee', '#2a6aae', '#f2c02a', '#e0263a', '#e8702a', '#5cae3c', '#2a6a2a', '#9a6a3c', '#6a3a1a', '#f2c8a0', '#c8ccd8', '#7a7a8a', '#8a4ac8', '#3fa8a0'];
const basePalette = h('div', { class: 'ed-palette' }, BASE_PALETTE.map((c) => h('button', { type: 'button', class: 'ed-chip', style: { '--c': c }, title: c, onclick: () => pickColor([...hexToRgb(c), 255]) })));

const importSize = h('select', { class: 'ed-input', title: 'Tamaño de la imagen importada dentro del lienzo' }, [['100', 'Importar al 100 %'], ['80', 'Importar al 80 %'], ['65', 'Importar al 65 %'], ['50', 'Importar al 50 %']].map(([v, t]) => h('option', { value: v, text: t })));
importSize.value = '80';
const importInput = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', style: { display: 'none' }, onchange: () => { const f = importInput.files?.[0]; importInput.value = ''; if (f) importImage(f).catch(() => status('No se pudo leer la imagen.', 'error')); } });
const prev1 = h('canvas', { class: 'ed-prev-1' });
const prev3 = h('canvas', { class: 'ed-prev-3' });
const scene = h('canvas', { class: 'ed-scene', width: 192, height: 112 });
const right = h('aside', { class: 'ed-right' },
  h('section', {}, h('h2', { text: 'Herramientas' }), h('div', { class: 'ed-tools' }, toolBtns), h('div', { class: 'ed-tools ed-toggles' }, mirrorBtn, gridBtn, origBtn)),
  h('section', {}, h('h2', { text: 'Acciones' }), h('div', { class: 'ed-tools' },
    h('button', { type: 'button', class: 'ed-tool', title: 'Deshacer (Ctrl+Z)', onclick: undo }, h('span', { text: 'Deshacer' }), h('kbd', { text: 'Ctrl Z' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Rehacer (Ctrl+Y)', onclick: redo }, h('span', { text: 'Rehacer' }), h('kbd', { text: 'Ctrl Y' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Copia la zona seleccionada (o todo el dibujo si no hay selección)', onclick: () => copySel() }, h('span', { text: 'Copiar' }), h('kbd', { text: 'Ctrl C' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Pega en la zona seleccionada, o en el mismo lugar de donde se copió', onclick: () => pasteHere() }, h('span', { text: 'Pegar' }), h('kbd', { text: 'Ctrl V' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Copia la zona y la pega en el mismo lugar de los otros pasos de este lado (las otras variantes)', onclick: () => pasteOthers('step') }, h('span', { text: 'Pegar en otros pasos' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Copia la zona y la pega en el mismo lugar de todas las demás imágenes de este personaje', onclick: () => pasteOthers('all') }, h('span', { text: 'Pegar en todas' })),
    pasteBlankBtn,
    h('button', { type: 'button', class: 'ed-tool', title: 'Espejar horizontalmente', onclick: () => transform('flip') }, h('span', { text: 'Espejar' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Mover todo 1 píxel (flechas)', onclick: () => transform('left') }, h('span', { text: 'Mover ←' }), h('kbd', { text: '←' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Mover todo 1 píxel (flechas)', onclick: () => transform('right') }, h('span', { text: 'Mover →' }), h('kbd', { text: '→' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Borrar todo el dibujo', onclick: () => transform('clear') }, h('span', { text: 'Vaciar' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Carga una imagen (PNG, JPG) ajustada al tamaño de este sprite; se quita el fondo liso', onclick: () => importInput.click() }, h('span', { text: 'Importar imagen' })), importSize, importInput,
    h('button', { type: 'button', class: 'ed-tool', title: 'Achica el dibujo (o la zona seleccionada) un 20 %, apoyado donde estaba. Varias veces seguidas pierde detalle: mejor importar de nuevo con otro tamaño', onclick: () => resizeBy(0.8) }, h('span', { text: 'Achicar' })),
    h('button', { type: 'button', class: 'ed-tool', title: 'Agranda el dibujo (o la zona seleccionada) un 25 %', onclick: () => resizeBy(1.25) }, h('span', { text: 'Agrandar' })),
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
const rgbHex = ([r, g, b]: number[]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const rgbaCss = ([r, g, b, a]: number[]) => `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;

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

// ---------------------------------------------------------------- new content
const slug = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const ROLES = [['b', 'Equilibrado'], ['a', 'Físico (ataque)'], ['s', 'Especial'], ['t', 'Resistente'], ['f', 'Veloz']];
const POWER = [['330', 'Débil (nivel temprano)'], ['430', 'Normal'], ['520', 'Fuerte (evolucionada)']];
const unsavedCustom = () => [...newCustom.creatures, ...newCustom.looks, ...newCustom.tiles].filter((x) => !x.saved).length + newCustom.removed.creatures.length + newCustom.removed.looks.length + newCustom.removed.tiles.length;

function field(label, input) { return h('label', { class: 'ed-field' }, h('span', { text: label }), input); }

function openNewForm() {
  const make = S.cat.make;
  if (!make) return;
  const err = h('p', { class: 'ed-hint', role: 'alert' });
  const name = h('input', { class: 'ed-input', type: 'text', maxlength: '28', placeholder: make === 'creature' ? 'Ej.: Yaguareté' : make === 'char' ? 'Ej.: Pescadora' : 'Ej.: Baldosa de patio' });
  const opts = (pairs, empty = null) => [...(empty ? [h('option', { value: '', text: empty })] : []), ...pairs.map(([v, t]) => h('option', { value: v, text: t }))];
  let fields: any[] = [field('Nombre', name)];
  let read: () => any = () => ({});
  if (make === 'creature') {
    const t1 = h('select', { class: 'ed-input' }, opts(Object.entries(TYPES).map(([k, v]) => [k, v.name])));
    const t2 = h('select', { class: 'ed-input' }, opts(Object.entries(TYPES).map(([k, v]) => [k, v.name]), 'Sin segundo tipo'));
    const role = h('select', { class: 'ed-input' }, opts(ROLES));
    const power = h('select', { class: 'ed-input' }, opts(POWER)); power.value = '430';
    const desc = h('textarea', { class: 'ed-input', rows: '3', maxlength: '200', placeholder: 'Una o dos frases sobre la criatura.' });
    const routes = Object.entries(OUTDOOR).filter(([id, m]: any) => (id.startsWith('r_') || id.startsWith('ruta')) && m.enc?.list?.length);
    const boxes = routes.map(([id, m]: any) => ({ id, cb: h('input', { type: 'checkbox' }), name: m.name }));
    fields = [...fields, field('Tipo', t1), field('Segundo tipo', t2), field('Rol de estadísticas', role), field('Fuerza', power), field('Descripción', desc),
      h('div', { class: 'ed-field' }, h('span', { text: 'Dónde aparece salvaje (opcional)' }), h('div', { class: 'ed-checks' }, boxes.map((b) => h('label', {}, b.cb, ` ${b.name} (${b.id.replace(/^r_/, '')})`))))];
    read = () => ({ type: t1.value, type2: t2.value || undefined, role: role.value, bst: +power.value, desc: desc.value.trim() || undefined, habitats: boxes.filter((b) => b.cb.checked).map((b) => b.id) });
  } else if (make === 'char') {
    const baseSel = h('select', { class: 'ed-input' }, opts(Object.keys(LOOKS).map((k) => [k, lookName(k)])));
    fields = [...fields, field('Empezar desde el aspecto de', baseSel)];
    read = () => ({ base: baseSel.value });
  } else {
    const solid = h('input', { type: 'checkbox' });
    const layout = h('select', { class: 'ed-input' }, opts([['1x1', '1 casilla'], ['2x1', '2 casillas en horizontal (2×1)'], ['1x2', '2 casillas en vertical (1×2)'], ['2x2', '4 casillas (2×2)'], ['4x1', '4 casillas en horizontal (4×1)'], ['1x4', '4 casillas en vertical (1×4)']]));
    fields = [...fields, field('Tamaño del dibujo', layout), h('p', { class: 'ed-hint', text: 'Con más de una casilla las dibujás juntas en un lienzo grande y se guardan por separado: Nombre_1, Nombre_2…' }),
      h('label', { class: 'ed-field' }, solid, ' Sólida (no se puede atravesar)')];
    read = () => ({ solid: solid.checked, layout: layout.value });
  }
  const close = () => modal.remove();
  const submit = () => {
    const nm = name.value.trim();
    if (!nm) { err.textContent = 'Ponele un nombre.'; return; }
    const extra = read();
    if (make === 'creature') {
      const key = slug(nm);
      if (!key) { err.textContent = 'El nombre necesita letras o números.'; return; }
      if (SPECIES[key] || newCustom.creatures.some((c) => c.key === key)) { err.textContent = 'Ya hay una criatura con ese nombre.'; return; }
      newCustom.creatures.push({ key, name: nm, ...extra });
    } else if (make === 'char') {
      const key = slug(nm) || 'personaje';
      if (LOOKS[key] || newCustom.looks.some((l) => l.key === key)) { err.textContent = 'Ya hay un personaje con ese nombre.'; return; }
      newCustom.looks.push({ key, name: nm, ...extra });
    } else {
      const { layout = '1x1', ...rest } = extra;
      const [cols, rows] = layout.split('x').map(Number);
      const n = cols * rows;
      const gid = slug(nm) || 'pieza';
      if (n > 1 && [...(CUSTOM.tiles ?? []), ...newCustom.tiles].some((t) => t.grp?.id === gid)) { err.textContent = 'Ya hay un grupo de piezas con ese nombre.'; return; }
      let code = 0xE200;
      const taken = (c) => c in TILE_INFO || (CUSTOM.tiles ?? []).some((t) => t.ch === c) || newCustom.tiles.some((t) => t.ch === c);
      for (let i = 0; i < n; i++) {
        while (taken(String.fromCharCode(code))) code++;
        newCustom.tiles.push({ ch: String.fromCharCode(code), name: n > 1 ? `${nm}_${i + 1}` : nm, ...rest, ...(n > 1 ? { grp: { id: gid, i, cols, rows } } : {}) });
        code++;
      }
    }
    persistCustom();
    close();
    selectCat(S.cat);
    const added = S.entries[S.entries.length - 1];
    const mine = make === 'tile' ? S.entries.find((x) => x.label === nm || x.label.replace(/_\d+$/, '') === nm) : null;
    const e = make === 'tile' ? (mine ?? S.entries[0]) : added;
    select(e);
    syncPending();
    status(`Se creó «${nm}». Dibujalo y tocá «Guardar en el juego».`, 'ok');
  };
  const modal = h('div', { class: 'ed-modal', onkeydown: (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') close(); } },
    h('form', { class: 'ed-dialog', onsubmit: (ev) => { ev.preventDefault(); submit(); } },
      h('h2', { text: make === 'creature' ? 'Nueva criatura' : make === 'char' ? 'Nuevo personaje' : 'Nueva pieza de mapa' }),
      ...fields, err,
      h('div', { class: 'ed-row' }, h('button', { class: 'ed-btn', type: 'button', text: 'Cancelar', onclick: close }), h('button', { class: 'ed-btn is-primary', type: 'submit', text: 'Crear' }))));
  document.body.append(modal);
  name.focus();
}

// ---------------------------------------------------------------- list
/** What the selected entry is, if it was created in this editor (deployed or not). */
function customOf(e) {
  if (!e) return null;
  const cre = (k) => newCustom.creatures.some((c) => c.key === k) || (CUSTOM.creatures ?? []).some((c) => c.key === k);
  const loo = (k) => newCustom.looks.some((c) => c.key === k) || (CUSTOM.looks ?? []).some((c) => c.key === k);
  const til = (ch) => newCustom.tiles.some((c) => c.ch === ch) || (CUSTOM.tiles ?? []).some((c) => c.ch === ch);
  if (e.key.startsWith('creature:') && cre(e.key.slice(9))) return { kind: 'creatures', keys: [e.key.slice(9)], name: e.label };
  if (e.look && loo(e.look)) return { kind: 'looks', keys: [e.look], name: e.label };
  if (e.tiles && e.tiles.every((t) => til(t.ch))) return { kind: 'tiles', keys: e.tiles.map((t) => t.ch), name: e.label };
  const m = e.key.match(/^tile:(.)0$/u);
  if (m && til(m[1])) return { kind: 'tiles', keys: [m[1]], name: e.label };
  return null;
}
function deleteCustom() {
  const c = customOf(S.group);
  if (!c) return;
  const extra = c.kind === 'tiles' ? ' Si ya la usaste en un mapa, esa casilla se ve como pasto.' : c.kind === 'creatures' ? ' Si alguien la tiene en su equipo, la partida podría fallar.' : '';
  if (!confirm(`¿Borrar «${c.name}»?${extra}`)) return;
  const field = c.kind === 'tiles' ? 'ch' : 'key';
  const inDeployed = (k) => (CUSTOM[c.kind] ?? []).some((x) => x[field] === k);
  for (const k of c.keys) {
    newCustom[c.kind] = newCustom[c.kind].filter((x) => x[field] !== k);
    if (inDeployed(k) && !newCustom.removed[c.kind].includes(k)) newCustom.removed[c.kind].push(k);
    // its drawings go too
    const prefix = c.kind === 'creatures' ? `creature:${k}` : c.kind === 'looks' ? `char:${k}|` : `tile:${k}`;
    for (const key of new Set([...Object.keys(base), ...Object.keys(drafts)])) {
      const mine = c.kind === 'creatures' ? key === prefix : c.kind === 'looks' ? key.startsWith(prefix) : key.startsWith(prefix) && /^\d$/.test(key.slice(prefix.length));
      if (!mine) continue;
      if (base[key]) drafts[key] = null; else delete drafts[key];
    }
  }
  persistCustom();
  persist();
  refreshLive();
  selectCat(S.cat);
  syncPending();
  status(`«${c.name}» borrada. ${unsavedCustom() ? 'Tocá «Guardar en el juego» para que desaparezca también del juego.' : ''}`, 'ok');
}

function selectCat(c) {
  S.cat = c;
  S.entries = c.entries();
  catHint.textContent = c.hint;
  newBtn.hidden = !c.make;
  newBtn.textContent = c.make === 'creature' ? '＋ Nueva criatura' : c.make === 'char' ? '＋ Nuevo personaje' : '＋ Nueva pieza';
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
    const keys = e.frames ? e.frames.map((f) => f.key) : e.tiles ? e.tiles.map((t) => `tile:${t.ch}0`) : [e.key];
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
  if (S.group !== e) S.bulk = null;
  S.group = e;
  S.entry = frame ?? (e.frames ? e.frames[0] : e);
  delBtn.hidden = !customOf(e);
  for (const li of list.children) li.classList.toggle('is-active', li._entry === e);
  S.px = pixelsOf(S.entry);
  S.undo = [];
  S.redo = [];
  // The selection follows you between variants (same place, same size); it is dropped if it does not fit.
  if (S.sel && (S.sel.x + S.sel.w > S.entry.w || S.sel.y + S.sel.h > S.entry.h)) S.sel = null;
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
  status((S.entry.tiles ? S.entry.tiles.some((t) => `tile:${t.ch}0` in drafts) : S.entry.key in drafts) ? 'Este sprite tiene cambios sin guardar en el juego.' : live()[S.entry.key] ? 'Este sprite ya está dibujado a mano en el juego.' : 'Sprite original, generado por el juego.');
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
  if (S.sel && !S.showOriginal) {
    g.save();
    g.lineWidth = 2;
    g.setLineDash([6, 4]);
    g.strokeStyle = '#ffffff';
    g.strokeRect(S.sel.x * z + 1, S.sel.y * z + 1, S.sel.w * z - 2, S.sel.h * z - 2);
    g.lineDashOffset = 5;
    g.strokeStyle = '#16141e';
    g.strokeRect(S.sel.x * z + 1, S.sel.y * z + 1, S.sel.w * z - 2, S.sel.h * z - 2);
    g.restore();
  }
  if (S.hover && !S.showOriginal && S.tool !== 'select') {
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
  S.bulk = null;
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
  if (tool === 'select') {
    S.selAnchor = cell;
    S.sel = { x: cell.x, y: cell.y, w: 1, h: 1 };
    drawBoard();
    return;
  }
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
  if (S.selAnchor && cell) {
    const a = S.selAnchor;
    S.sel = { x: Math.min(a.x, cell.x), y: Math.min(a.y, cell.y), w: Math.abs(cell.x - a.x) + 1, h: Math.abs(cell.y - a.y) + 1 };
  }
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
  if (S.selAnchor) {
    // A click without dragging clears the selection; a drag keeps the rectangle.
    if (S.sel && S.sel.w === 1 && S.sel.h === 1) S.sel = null;
    S.selAnchor = null;
    drawBoard();
    status(S.sel ? `Zona seleccionada: ${S.sel.w}×${S.sel.h} px. Ctrl+C la copia; Ctrl+V la pega en otra imagen.` : 'Sin selección: copiar toma todo el dibujo.');
    return;
  }
  if (!S.painting) return;
  S.painting = false;
  lastCell = null;
  commit();
};
board.addEventListener('pointerup', endStroke);
board.addEventListener('pointercancel', endStroke);
board.addEventListener('pointerleave', () => { S.hover = null; coords.textContent = ''; drawBoard(); });

/** Store the current pixels as a draft (or drop the draft when they match what the game already has). */
function storeDraft(e, px) {
  if (e.tiles) { // a group is saved as separate tiles
    for (const t of e.tiles) {
      const part = new Uint8ClampedArray(T * T * 4);
      for (let y = 0; y < T; y++) part.set(px.subarray(((t.row * T + y) * e.w + t.col * T) * 4, ((t.row * T + y) * e.w + t.col * T + T) * 4), y * T * 4);
      storeDraft(subTile(t), part);
    }
    return;
  }
  const orig = originalOf(e);
  if (sameBytes(px, orig)) {
    if (base[e.key]) drafts[e.key] = null;
    else delete drafts[e.key];
  } else {
    const enc = encodeSprite(px, e.w, e.h);
    if (JSON.stringify(enc) === JSON.stringify(base[e.key])) delete drafts[e.key];
    else drafts[e.key] = enc;
  }
}
/** Puts an image (e.g. made with an AI pixel-art tool) into the current sprite: background removed, cropped, scaled to fit, bottom-centred. */
async function importImage(file: File) {
  if (S.entry.tiles) return status('Importar imagen no está disponible para piezas de varios cuadros.', 'warn');
  const bmp = await createImageBitmap(file);
  const src = blank(bmp.width, bmp.height);
  const sg = src.getContext('2d', { willReadFrequently: true });
  sg.drawImage(bmp, 0, 0);
  const id = sg.getImageData(0, 0, bmp.width, bmp.height), d = id.data, W = bmp.width, H = bmp.height;
  if (!(d as any).some((_, i) => i % 4 === 3 && d[i] < 250)) { // flat background: flood from the borders over the corner colour(s)
    const corners = [0, (W - 1) * 4, (H - 1) * W * 4, ((H - 1) * W + W - 1) * 4];
    const near = (i) => corners.some((c) => Math.abs(d[i] - d[c]) + Math.abs(d[i + 1] - d[c + 1]) + Math.abs(d[i + 2] - d[c + 2]) < 60);
    const seen = new Uint8Array(W * H), st: number[] = [];
    for (let x = 0; x < W; x++) st.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
    while (st.length) {
      const q = st.pop()!;
      if (seen[q]) continue;
      seen[q] = 1;
      if (!near(q * 4)) continue;
      d[q * 4 + 3] = 0;
      const x = q % W;
      if (x > 0) st.push(q - 1);
      if (x < W - 1) st.push(q + 1);
      if (q >= W) st.push(q - W);
      if (q < W * (H - 1)) st.push(q + W);
    }
    sg.putImageData(id, 0, 0);
  }
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 20) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return status('La imagen está vacía o es toda del color del fondo.', 'warn');
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, w = S.entry.w, hh = S.entry.h;
  const k = Math.min(w / cw, hh / ch) * (+importSize.value / 100);
  const tw = Math.max(1, Math.round(cw * k)), th = Math.max(1, Math.round(ch * k));
  const out = blank(w, hh), og = out.getContext('2d', { willReadFrequently: true });
  og.imageSmoothingEnabled = k < 1;
  og.drawImage(src, x0, y0, cw, ch, Math.floor((w - tw) / 2), hh - th, tw, th);
  const px = og.getImageData(0, 0, w, hh).data;
  for (let i = 3; i < px.length; i += 4) px[i] = px[i] >= 128 ? 255 : 0;
  snapshot();
  S.px = new Uint8ClampedArray(px);
  commit();
  status('Imagen importada. Si mira para el otro lado usá "Espejar" (en el juego miran a la izquierda).', 'ok');
}

function commit() {
  const e = S.entry;
  storeDraft(e, S.px);
  persist();
  refreshLive();
  drawAll();
  refreshThumbs();
  if (S.group?.frames) renderFrames();
  markListDots();
  status((e.tiles ? e.tiles.some((t) => `tile:${t.ch}0` in drafts) : e.key in drafts) ? 'Cambios guardados en este navegador. Falta "Guardar en el juego" para publicarlos.' : 'Igual al sprite que ya tiene el juego.');
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
  if (S.bulk) {
    // Last thing done was "Pegar en otros pasos / en todas": put every touched image back.
    for (const { e, prev } of S.bulk) storeDraft(e, prev);
    S.bulk = null;
    persist(); refreshLive();
    S.px = pixelsOf(S.entry);
    drawAll(); refreshThumbs(); renderFrames(); markListDots();
    status('Se deshizo el pegado en las otras variantes.', 'ok');
    return;
  }
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

// ---------------------------------------------------------------- copy and paste
/** Rectangle to copy: the selection, or the whole sprite. */
const selRect = () => S.sel ?? { x: 0, y: 0, w: S.entry.w, h: S.entry.h };

function cut(px, W, r) {
  const out = new Uint8ClampedArray(r.w * r.h * 4);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) out.set(px.subarray(((r.y + y) * W + r.x + x) * 4, ((r.y + y) * W + r.x + x) * 4 + 4), (y * r.w + x) * 4);
  return out;
}
/** Draws the clip onto px (W×H) with its corner at (ox, oy). Transparent clip pixels leave what is underneath, unless blank. */
function stamp(px, W, H, clip, ox, oy, blank) {
  let n = 0;
  for (let y = 0; y < clip.h; y++) for (let x = 0; x < clip.w; x++) {
    const tx = ox + x, ty = oy + y;
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
    const i = (y * clip.w + x) * 4;
    if (clip.px[i + 3] === 0 && !blank) continue;
    px.set(clip.px.subarray(i, i + 4), (ty * W + tx) * 4);
    n++;
  }
  return n;
}

function copySel() {
  const r = selRect();
  S.clip = { w: r.w, h: r.h, px: cut(S.px, S.entry.w, r), x: r.x, y: r.y };
  status(`Copiado: ${S.sel ? `zona de ${r.w}×${r.h} px` : 'todo el dibujo'}. Andá a otra imagen y tocá Pegar (Ctrl+V).`, 'ok');
}
function pasteHere() {
  if (!S.clip) return status('Primero copiá algo (Ctrl+C).', 'error');
  const o = S.sel ? { x: S.sel.x, y: S.sel.y } : { x: S.clip.x, y: S.clip.y };
  snapshot();
  stamp(S.px, S.entry.w, S.entry.h, S.clip, o.x, o.y, S.pasteBlank);
  commit();
}
/** Copies the zone of this image to the same place of the other variants of this character. */
function pasteOthers(scope) {
  const g = S.group;
  const targets = (g.frames ?? []).filter((f) => f !== S.entry && (scope === 'all' || f.dir === S.entry.dir));
  if (!targets.length) return status('Este sprite no tiene otras variantes. Usá Copiar y Pegar entre imágenes.', 'error');
  const r = selRect();
  const clip = { w: r.w, h: r.h, px: cut(S.px, S.entry.w, r), x: r.x, y: r.y };
  S.clip = clip;
  const bulk = [];
  for (const f of targets) {
    const prev = pixelsOf(f);
    const next = prev.slice();
    stamp(next, f.w, f.h, clip, r.x, r.y, S.pasteBlank);
    bulk.push({ e: f, prev });
    storeDraft(f, next);
  }
  persist(); refreshLive();
  S.bulk = bulk;
  drawAll(); refreshThumbs(); renderFrames(); markListDots();
  status(`Pegado en ${targets.length} variante${targets.length === 1 ? '' : 's'}. Ctrl+Z lo deshace.`, 'ok');
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

/** Scales the drawing (or the selected zone) by f, keeping its bottom-centre where it was. */
function resizeBy(f: number) {
  const { w, h: hh } = S.entry;
  const r = selRect();
  const src = S.px;
  let x0 = r.x + r.w, y0 = r.y + r.h, x1 = -1, y1 = -1;
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (src[(y * w + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return status('No hay nada para cambiar de tamaño.', 'warn');
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const tw = Math.max(1, Math.round(cw * f)), th = Math.max(1, Math.round(ch * f));
  const piece = blank(cw, ch);
  piece.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(cut(src, w, { x: x0, y: y0, w: cw, h: ch })), cw, ch), 0, 0);
  const out = blank(w, hh), og = out.getContext('2d', { willReadFrequently: true });
  og.imageSmoothingEnabled = f < 1;
  const cx = Math.round((x0 + x1 + 1) / 2 - tw / 2), by = y1 + 1 - th;
  og.drawImage(piece, Math.max(0, Math.min(w - tw, cx)), Math.max(0, by), tw, th);
  const px = og.getImageData(0, 0, w, hh).data;
  snapshot();
  const next = src.slice();
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) next.fill(0, (y * w + x) * 4, (y * w + x) * 4 + 4);
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
    const i = (y * w + x) * 4;
    if (px[i + 3] >= 128) { next[i] = px[i]; next[i + 1] = px[i + 1]; next[i + 2] = px[i + 2]; next[i + 3] = 255; }
  }
  S.px = next;
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
  pasteBlankBtn.classList.toggle('is-active', S.pasteBlank);
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
  const n = Object.keys(drafts).length + unsavedCustom();
  pending.textContent = n ? `${n} cambio${n === 1 ? '' : 's'} sin guardar en el juego` : 'Todo guardado';
  pending.classList.toggle('has-changes', n > 0);
}

addEventListener('keydown', (ev) => {
  if (ev.target instanceof HTMLInputElement) return;
  const k = ev.key.toLowerCase();
  if ((ev.ctrlKey || ev.metaKey) && k === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
  if ((ev.ctrlKey || ev.metaKey) && k === 'y') { ev.preventDefault(); redo(); return; }
  if ((ev.ctrlKey || ev.metaKey) && k === 'c' && S.entry) { ev.preventDefault(); copySel(); return; }
  if ((ev.ctrlKey || ev.metaKey) && k === 'v' && S.entry) { ev.preventDefault(); pasteHere(); return; }
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const tool = { b: 'pencil', e: 'eraser', g: 'fill', i: 'picker', s: 'select' }[k];
  if (tool) setTool(tool);
  else if (k === 'escape' && S.sel) { S.sel = null; drawBoard(); }
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
  if (unsavedCustom()) {
    const b2 = new Blob([customSource(mergeCustom(CUSTOM))], { type: 'text/javascript' });
    const a2 = h('a', { href: URL.createObjectURL(b2), download: 'custom-content.js' });
    document.body.append(a2);
    a2.click();
    a2.remove();
    setTimeout(() => URL.revokeObjectURL(a2.href), 2000);
  }
  if (!quiet) status('Archivo descargado. Para que el juego lo use, va en src/data/sprite-overrides.js del repo (y custom-content.js si hay contenido nuevo).');
}

const strip = ({ saved, ...rest }: any) => rest;
/** The deployed custom content plus everything created here. */
function mergeCustom(cur: any) {
  const add = (a: any[], b: any[], f: string) => [...(a ?? []).filter((x) => !b.some((y) => y[f] === x[f])), ...b.map(strip)];
  const R = newCustom.removed;
  return { creatures: add(cur.creatures, newCustom.creatures, 'key').filter((x) => !R.creatures.includes(x.key)), looks: add(cur.looks, newCustom.looks, 'key').filter((x) => !R.looks.includes(x.key)), tiles: add(cur.tiles, newCustom.tiles, 'ch').filter((x) => !R.tiles.includes(x.ch)) };
}
const customSource = (c) => `// Content created from the sprite editor ("＋ Nuevo"): new creatures, character looks and map pieces.\n// The editor rewrites this file; do not edit by hand.\nexport const CUSTOM = ${JSON.stringify(c)};\n`;
const parseCustomSource = (t) => { const m = t.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/); const o = m ? JSON.parse(m[1]) : {}; return { creatures: o.creatures ?? [], looks: o.looks ?? [], tiles: o.tiles ?? [] }; };

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
  const hasSprites = Object.keys(drafts).length > 0;
  if (!hasSprites && !unsavedCustom()) return status('No hay cambios para guardar.');
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
  status('Guardando en GitHub…');
  // The browser may keep an old copy of a file (and its sha): always ask GitHub again, and if someone saved
  // in between (409), read the new copy and retry a few times before giving up.
  const putFile = async (file, message, makeContent) => {
    const url = `https://api.github.com/repos/${REPO}/contents/${file}`;
    for (let attempt = 1; ; attempt++) {
      const cur = await fetch(`${url}?ref=main&t=${Date.now()}`, { headers, cache: 'no-store' });
      if (!cur.ok && cur.status !== 404) throw await ghError(cur);
      const meta = cur.ok ? await cur.json() : null;
      const { text, result } = makeContent(meta ? b64decode(meta.content) : '');
      const body: any = { message, content: b64encode(text), branch: 'main' };
      if (meta) body.sha = meta.sha;
      const put = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body), cache: 'no-store' });
      if ((put.status === 409 || put.status === 422) && attempt < 5) { await new Promise((r) => setTimeout(r, 1200 * attempt)); continue; }
      if (!put.ok) throw await ghError(put);
      return result;
    }
  };
  try {
    if (hasSprites) {
      const n = Object.keys(drafts).length;
      // Merge on top of what is on GitHub now, so edits made from another computer are kept.
      base = await putFile(FILE, `Editor de sprites: ${n} cambio${n === 1 ? '' : 's'}`, (cur) => {
        const merged = parseOverridesSource(cur);
        for (const [k, v] of Object.entries(drafts)) {
          if (v) merged[k] = v;
          else delete merged[k];
        }
        return { text: overridesSource(merged), result: merged };
      });
      drafts = {};
      persist();
      refreshLive();
    }
    if (unsavedCustom()) {
      await putFile(CUSTOM_FILE, 'Editor de sprites: contenido nuevo (criaturas, personajes o piezas)', (cur) => {
        const merged = mergeCustom(cur ? parseCustomSource(cur) : { creatures: [], looks: [], tiles: [] });
        return { text: customSource(merged), result: merged };
      });
      for (const list of [newCustom.creatures, newCustom.looks, newCustom.tiles]) for (const x of list) x.saved = true;
      newCustom.removed = noRemoved();
      persistCustom();
    }
    selectCat(S.cat);
    syncPending();
    status('Guardado. El juego publicado se actualiza solo en uno o dos minutos; lo nuevo aparece al recargarlo.', 'ok');
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
  // Coming from the map editor's "＋ Nueva pieza": open the tile tab with the creation form ready
  const wantsTile = location.hash === '#nueva-pieza';
  selectCat(wantsTile ? (CATS.find((c) => c.id === 'tile') ?? CATS[0]) : CATS[0]);
  if (wantsTile) { history.replaceState(null, '', location.pathname); openNewForm(); }
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
