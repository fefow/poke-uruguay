// Visual map editor (map-editor.html). Paints tiles and moves, adds or removes people and items on any map
// the game builds, and stores the changes in src/data/map-overrides.js, which the game applies on top of
// its generated maps (see data/map-edits.js). Work in progress is kept in this browser; "Guardar en el juego"
// commits the file to GitHub (redeploys Pages).
import { OUTDOOR, INTERIOR, MAPS, MAP_ORIGINALS } from '../data/maps.ts';
import { CHAIN } from '../data/route.ts';
import { MAP_OVERRIDES } from '../data/map-overrides.js';
import { fitsGrown, mapEditsSource, parseMapEditsSource } from '../data/map-edits.ts';
import { ITEMS, isKeyItem } from '../data/items.ts';
import { tileCanvas, groundFor, drawBuildingTrim, drawGroundEdges, TILE_INFO, T, registerCustomTile, TILE_BACKGROUNDS } from '../gfx/tiles.ts';
import { CUSTOM } from '../data/custom-content.js';
import { SPRITE_OVERRIDES } from '../data/sprite-overrides.js';
import { setOverrides } from '../gfx/overrides.ts';
import { charSprite, LOOKS } from '../gfx/characters.ts';
import { drawItem } from '../gfx/items.ts';
import { h, safeStorage } from '../core/util.ts';
import { devToken, isDev, unlockDev, checkToken, lockDev } from '../core/devauth.ts';

const REPO = 'fefow/poke-uruguay';
const FILE = 'src/data/map-overrides.js';
const store = safeStorage();
const DRAFTS_KEY = 'pokeuy:map-drafts';
const MAX_UNDO = 80;
const LOCKED = new Set(['D', 'S']); // doors and signs are matched to their targets and texts in order
const SOLID = (c) => c === undefined || !!TILE_INFO[c]?.solid;
const DIRS = [['down', 'Abajo'], ['up', 'Arriba'], ['left', 'Izquierda'], ['right', 'Derecha']];
const KIND_NAME = { trainer: 'Entrenador', script: 'Evento', critter: 'Animal', blocker: 'Guardia de paso', npc: 'Persona', added: 'Persona nueva' };
const ITEM_KEYS = Object.keys(ITEMS).filter((k) => !isKeyItem(k));

// ---------------------------------------------------------------- drafts and working copies
let base = structuredClone(MAP_OVERRIDES); // what the game has now
let drafts = load(); // { id: patch | null } changes not saved to GitHub yet (null = back to the original)
function load() {
  try { return JSON.parse(store.getItem(DRAFTS_KEY) || '{}'); } catch { return {}; }
}
function persist() {
  try { store.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch { /* storage blocked */ }
}
const patchOf = (id) => (id in drafts ? drafts[id] : base[id]) ?? null;

/** The map as the editor works on it: the original plus its patch, with removed things kept (hidden) so they can come back. */
function working(id) {
  const o = MAP_ORIGINALS[id];
  const p: any = patchOf(id) ?? {};
  const grown = Array.isArray(p.tiles) && fitsGrown(o.tiles, p.tiles);
  const tiles = (grown ? p.tiles : o.tiles).map((r) => [...r]);
  const shift = grown ? { x: p.shift?.x ?? 0, y: p.shift?.y ?? 0 } : { x: 0, y: 0 };
  const npcs: any[] = o.npcs.map((n0) => {
    const n = { ...n0, x: n0.x + shift.x, y: n0.y + shift.y };
    const q = p.npcs?.[n.key];
    return { ...n, text: n.text ? [...n.text] : null, ...(q && !q.remove ? { x: q.x ?? n.x, y: q.y ?? n.y, dir: q.dir ?? n.dir, text: q.text && n.text ? [...q.text] : n.text } : {}), removed: !!q?.remove };
  });
  for (const a of p.addNpcs ?? []) npcs.push({ key: null, kind: 'added', x: a.x, y: a.y, look: a.look, dir: a.dir ?? 'down', text: [...(a.text ?? ['…'])], wander: !!a.wander });
  const items = o.items.map((it0) => {
    const it = { ...it0, x: it0.x + shift.x, y: it0.y + shift.y };
    const q = p.items?.[it.id];
    return { ...it, ...(q && !q.remove ? { x: q.x ?? it.x, y: q.y ?? it.y } : {}), removed: !!q?.remove };
  });
  for (const a of p.addItems ?? []) items.push({ ...a, added: true });
  return { tiles, npcs, items, weather: p.weather ?? 'random', ground: p.ground ?? 'auto', shift };
}

/** The patch that turns the original into W, or null when nothing changed. */
function diff(id, W) {
  const o = MAP_ORIGINALS[id];
  const p: any = {};
  const rows = W.tiles.map((r) => r.join(''));
  const sh = W.shift ?? { x: 0, y: 0 };
  if (rows.length !== o.tiles.length || rows[0].length !== o.tiles[0].length || rows.some((r, y) => r !== o.tiles[y])) p.tiles = rows;
  if (sh.x || sh.y) p.shift = { x: sh.x, y: sh.y };
  const npcs = {};
  W.npcs.filter((n) => n.key).forEach((n) => {
    const was0 = o.npcs.find((x) => x.key === n.key);
    const was = { ...was0, x: was0.x + sh.x, y: was0.y + sh.y };
    if (n.removed) { npcs[n.key] = { remove: true }; return; }
    const q: any = {};
    if (n.x !== was.x || n.y !== was.y) Object.assign(q, { x: n.x, y: n.y });
    if (n.dir !== was.dir) q.dir = n.dir;
    if (n.text && JSON.stringify(n.text) !== JSON.stringify(was.text)) q.text = n.text;
    if (Object.keys(q).length) npcs[n.key] = q;
  });
  if (Object.keys(npcs).length) p.npcs = npcs;
  const added = W.npcs.filter((n) => !n.key).map((n) => ({ x: n.x, y: n.y, look: n.look, dir: n.dir, text: n.text, ...(n.wander ? { wander: true } : {}) }));
  if (added.length) p.addNpcs = added;
  const items = {};
  W.items.filter((it) => !it.added).forEach((it) => {
    const was0 = o.items.find((x) => x.id === it.id);
    const was = { ...was0, x: was0.x + sh.x, y: was0.y + sh.y };
    if (it.removed) items[it.id] = { remove: true };
    else if (it.x !== was.x || it.y !== was.y) items[it.id] = { x: it.x, y: it.y };
  });
  if (Object.keys(items).length) p.items = items;
  const addItems = W.items.filter((it) => it.added).map(({ x, y, item, id: iid }) => ({ x, y, item, id: iid }));
  if (addItems.length) p.addItems = addItems;
  if (W.weather && W.weather !== 'random') p.weather = W.weather;
  if (W.ground && W.ground !== 'auto') p.ground = W.ground;
  return Object.keys(p).length ? p : null;
}

// ---------------------------------------------------------------- editor state
const S = {
  id: null, W: null, tool: 'paint', tile: '.', zoom: 2, grid: true,
  sel: null, // { type: 'npc'|'item', ref }
  drag: null, painting: false, hover: null, undo: [], redo: [], problems: [], filter: '', tileFilter: '',
};
const nameOf = (id) => (MAPS[id]?.name ?? id).replace('{rival}', 'tu rival');
const isOutdoor = (id) => id in OUTDOOR;

// ---------------------------------------------------------------- layout
const root = document.getElementById('editor');
const pending = h('span', { class: 'ed-pending' });
const statusEl = h('p', { class: 'me-status', role: 'status' });
const btn = (text, onclick, extra = {}) => h('button', { class: 'ed-btn', type: 'button', text, onclick, ...extra });
const undoBtn = btn('Deshacer', () => undo(), { title: 'Ctrl+Z' });
const redoBtn = btn('Rehacer', () => redo(), { title: 'Ctrl+Y' });
const resetBtn = btn('Volver al original', () => resetMap(), { title: 'Descarta todos los cambios de este mapa' });
const saveBtn = btn('Guardar en el juego', () => saveToGitHub(), { class: 'ed-btn is-primary' });
const head = h('header', { class: 'ed-head' },
  h('div', { class: 'ed-brand' }, h('b', { text: 'Poke Uruguay' }), h('span', { text: 'Editor de mapas' })),
  h('a', { class: 'ed-btn ed-mini', href: 'editor.html', text: 'Editor de sprites' }),
  h('a', { class: 'ed-btn ed-mini', href: 'texts.html', text: 'Editor de textos' }),
  pending,
  h('div', { class: 'ed-actions' }, undoBtn, redoBtn, resetBtn, btn('Descargar', () => download()), saveBtn));

const search = h('input', { class: 'ed-input', type: 'search', placeholder: 'Buscar mapa…', oninput: () => { S.filter = search.value.toLowerCase(); renderMapList(); } });
const mapList = h('ul', { class: 'ed-list me-maps' });
const side = h('aside', { class: 'ed-side' }, search, mapList);

const canvas = h('canvas', { class: 'me-canvas' });
const g = canvas.getContext('2d');
const hoverEl = h('p', { class: 'me-hover' });
const zoomSel = h('select', { class: 'ed-input me-zoom', onchange: () => { S.zoom = +zoomSel.value; draw(); } },
  [1, 2, 3, 4].map((z) => h('option', { value: z, text: `Zoom ×${z}`, selected: z === S.zoom })));
const gridChk = h('input', { type: 'checkbox', checked: S.grid, onchange: () => { S.grid = gridChk.checked; draw(); } });
const toolBtns: Record<string, HTMLElement> = {};
const TOOLS = [['paint', 'Pincel', 'B'], ['fill', 'Rellenar', 'G'], ['pick', 'Cuentagotas', 'I'], ['move', 'Mover / elegir', 'V']];
const toolbar = h('div', { class: 'me-toolbar' },
  TOOLS.map(([id, label, key]) => (toolBtns[id] = h('button', { class: 'ed-btn ed-mini', type: 'button', onclick: () => setTool(id) }, label, ' ', h('kbd', { text: key })))),
  zoomSel, h('label', { class: 'me-check' }, gridChk, ' Grilla'));
const stage = h('div', { class: 'me-stage' }, canvas);
const center = h('main', { class: 'me-center' }, toolbar, stage, hoverEl, statusEl);

const tileSearch = h('input', { class: 'ed-input', type: 'search', placeholder: 'Buscar pieza…', oninput: () => { S.tileFilter = tileSearch.value.toLowerCase(); renderPalette(); } });
const current = h('div', { class: 'me-current' });
const palette = h('div', { class: 'me-palette' });
const inspector = h('div', { class: 'me-inspector' });
const entityList = h('ul', { class: 'me-entities' });
const checks = h('div', { class: 'me-checks' });
const WEATHERS: [string, string][] = [['random', 'Aleatorio (cambia solo)'], ['clear', 'Siempre despejado'], ['rain', 'Siempre lluvia'], ['storm', 'Siempre tormenta'], ['fog', 'Siempre niebla']];
const weatherSel = h('select', { class: 'ed-input', onchange: () => edit(() => { S.W.weather = weatherSel.value; }) },
  WEATHERS.map(([v, n]) => h('option', { value: v, text: n })));
const groundSel = h('select', { class: 'ed-input', title: 'Suelo que se ve detrás de árboles, arbustos y piezas con transparencia en este mapa', onchange: () => edit(() => { S.W.ground = groundSel.value; }) },
  TILE_BACKGROUNDS.map(([v, n]) => h('option', { value: v, text: v === 'auto' ? 'Automático (pasto, o el suelo de al lado)' : n })));
const addLook = h('select', { class: 'ed-input' }, Object.keys(LOOKS).filter((k) => !k.startsWith('leader_') && !k.startsWith('player') && k !== 'rival').map((k) => h('option', { value: k, text: k, selected: k === 'oldman' })));
const addItemSel = h('select', { class: 'ed-input' }, ITEM_KEYS.map((k) => h('option', { value: k, text: ITEMS[k].name, selected: k === 'te_marcela' })));
const sizeInfo = h('p', { class: 'ed-hint' });
const growIn = (def = 0) => h('input', { class: 'ed-input', type: 'number', min: '0', max: '120', value: String(def), style: { width: '100%' } });
const GROW: [string, string, HTMLInputElement][] = [['left', 'Izq.', growIn()], ['top', 'Arriba', growIn()], ['right', 'Der.', growIn()], ['bottom', 'Abajo', growIn()]];
const right = h('aside', { class: 'me-right' },
  h('section', {}, h('h2', { text: 'Piezas' }), h('a', { class: 'ed-btn ed-mini is-primary', href: 'editor.html#nueva-pieza', target: '_blank', rel: 'noopener', title: 'Abre el editor de sprites para crear y dibujar una pieza nueva; después de guardarla aparece acá', text: '＋ Nueva pieza' }), current, tileSearch, palette),
  h('section', {}, h('h2', { text: 'Seleccionado' }), inspector),
  h('section', {}, h('h2', { text: 'Clima de la zona' }), weatherSel,
    h('p', { class: 'ed-hint', text: 'Aleatorio: despejado, lluvia, tormenta o niebla según el momento. En interiores no se nota.' })),
  h('section', {}, h('h2', { text: 'Fondo base del mapa' }), groundSel,
    h('p', { class: 'ed-hint', text: 'El suelo que se ve detrás de árboles, arbustos, rocas y las piezas dibujadas con transparencia. Automático: pasto, o el suelo que tengan alrededor.' })),
  h('section', {}, h('h2', { text: 'Tamaño del mapa' }), sizeInfo,
    h('div', { class: 'me-row' }, ...GROW.map(([k, label, inp]) => h('label', { class: 'me-field', style: { flex: '1' } }, label, inp))),
    btn('Agrandar con la pieza elegida', () => growMap(), { title: 'Agrega filas y columnas nuevas rellenas con la pieza que tengas elegida; después pintás la forma que quieras' }),
    h('p', { class: 'ed-hint', text: 'Máximo 200×200. Las filas nuevas se rellenan con la pieza elegida (por ejemplo árboles o pared para cerrar lo que no uses). Si agrandás por la izquierda o arriba, todo lo que hay en el mapa se corre. Ojo: algunos mapas se conectan con otros por coordenadas fijas, y agrandar por esos lados puede desalinear una entrada; en ese caso preferí agrandar por la derecha o abajo.' })),
  h('section', {}, h('h2', { text: 'Agregar' }),
    h('div', { class: 'me-row' }, addLook, btn('+ Persona', () => addNpc())),
    h('div', { class: 'me-row' }, addItemSel, btn('+ Objeto', () => addItem()))),
  h('section', {}, h('h2', { text: 'Gente y objetos' }), entityList),
  h('section', {}, h('h2', { text: 'Revisión' }), checks));
root.append(head, h('div', { class: 'ed-body me-body' }, side, center, right));

function status(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = `me-status ${kind ? `is-${kind}` : ''}`;
}

// ---------------------------------------------------------------- lists
function renderMapList() {
  const group = (title, ids) => {
    const shown = ids.filter((id) => !S.filter || id.toLowerCase().includes(S.filter) || nameOf(id).toLowerCase().includes(S.filter));
    if (!shown.length) return [];
    return [h('li', { class: 'me-group', text: title }), ...shown.map((id) => h('li', {
      class: `me-map ${id === S.id ? 'is-active' : ''}`, onclick: () => openMap(id), title: id,
    }, h('span', { text: nameOf(id) }), h('small', { text: id }), patchOf(id) ? h('i', { class: `me-dot ${id in drafts ? 'is-draft' : ''}`, title: id in drafts ? 'Cambios sin guardar' : 'Editado' }) : null))];
  };
  mapList.replaceChildren(...group('Exteriores (en orden de la historia)', storyOrder().outdoor), ...group('Interiores (por ciudad, en orden de la historia)', storyOrder().indoor));
}

/** Maps in the order the player meets them: the route from Carmelo to Montevideo, then whatever is left; interiors follow their city. */
let ORDER = null;
function storyOrder() {
  if (ORDER) return ORDER;
  const outdoor = [...new Set([...CHAIN, ...Object.keys(OUTDOOR)])].filter((id) => id in OUTDOOR);
  const seen = new Set<string>();
  const indoor: string[] = [];
  const visit = (id: string) => {
    for (const d of (MAPS[id] as any)?.doors ?? []) {
      const to = typeof d === 'string' ? d : d?.to;
      if (to && to in INTERIOR && !seen.has(to)) { seen.add(to); indoor.push(to); visit(to); }
    }
    for (const w of Object.values((MAPS[id] as any)?.doorWarps ?? {})) {
      const to = (w as any)?.to;
      if (to && to in INTERIOR && !seen.has(to)) { seen.add(to); indoor.push(to); visit(to); }
    }
  };
  outdoor.forEach(visit);
  for (const id of Object.keys(INTERIOR)) if (!seen.has(id)) indoor.push(id);
  return (ORDER = { outdoor, indoor });
}

/** Pieces made in the sprite editor: deployed ones plus drafts waiting in this browser. */
const MINE: string[] = [];
function loadMine() {
  MINE.length = 0;
  let own: any = { tiles: [], removed: { tiles: [] } };
  let sp: any = {};
  try { own = { ...own, ...JSON.parse(localStorage.getItem('pokeuy:custom-drafts') || '{}') }; } catch { /* none */ }
  try { sp = JSON.parse(localStorage.getItem('pokeuy:sprite-drafts') || '{}'); } catch { /* none */ }
  const gone = own.removed?.tiles ?? [];
  const all = [...(CUSTOM.tiles ?? []).filter((t) => !(own.tiles ?? []).some((n) => n.ch === t.ch)), ...(own.tiles ?? [])].filter((t) => !gone.includes(t.ch));
  for (const t of all) { registerCustomTile(t.ch, t.name, !!t.solid); MINE.push(t.ch); }
  const table = { ...SPRITE_OVERRIDES };
  // Drafts only matter for pieces that are not in the game yet; for everything else the saved art wins (old drafts must not hide it).
  const fresh = new Set((own.tiles ?? []).filter((n) => !(CUSTOM.tiles ?? []).some((d) => d.ch === n.ch)).map((n) => n.ch));
  for (const [k, v] of Object.entries(sp)) { if (v && fresh.has(k.replace(/^tile:/, '').slice(0, -1))) table[k] = v; }
  setOverrides(table);
}
loadMine();
// Coming back from the sprite editor tab: pick up new or redrawn pieces without reloading.
window.addEventListener('focus', () => { loadMine(); renderPalette(); try { draw(); } catch { /* not ready */ } });

function renderPalette() {
  const theme = MAPS[S.id]?.theme ?? null;
  const okCh = (ch) => !LOCKED.has(ch) && (!S.tileFilter || TILE_INFO[ch].name.toLowerCase().includes(S.tileFilter));
  const order = [...MINE.filter(okCh), ...Object.keys(TILE_INFO).filter((ch) => !MINE.includes(ch) && okCh(ch))];
  palette.replaceChildren(...order.map((ch) => {
    const c = h('canvas', { width: T, height: T });
    c.getContext('2d').drawImage(tileCanvas(ch, 0, theme), 0, 0);
    return h('button', { type: 'button', class: `me-tile ${ch === S.tile ? 'is-active' : ''} ${MINE.includes(ch) ? 'is-mine' : ''}`, title: `${MINE.includes(ch) ? '★ Tuya · ' : ''}${TILE_INFO[ch].name} "${ch}"${TILE_INFO[ch].solid ? ' · no se pisa' : ''}`, onclick: () => pickTile(ch) }, c);
  }));
  const c = h('canvas', { width: T, height: T });
  c.getContext('2d').drawImage(tileCanvas(S.tile, 0, theme), 0, 0);
  current.replaceChildren(c, h('span', { text: `${TILE_INFO[S.tile]?.name ?? S.tile} "${S.tile}"${TILE_INFO[S.tile]?.solid ? ' · no se pisa' : ''}` }));
}

function pickTile(ch) {
  if (LOCKED.has(ch)) return status('Las puertas y los carteles no se pintan: van atados a su destino y su texto.', 'warn');
  S.tile = ch;
  if (S.tool === 'pick' || S.tool === 'move') setTool('paint');
  renderPalette();
}

function renderEntities() {
  const W = S.W;
  const li = (type, ref, label, sub) => h('li', {
    class: `${S.sel?.ref === ref ? 'is-active' : ''} ${ref.removed ? 'is-removed' : ''}`, onclick: () => { select(type, ref); },
  }, h('span', { text: label }), h('small', { text: sub }));
  entityList.replaceChildren(
    ...W.npcs.map((n) => li('npc', n, n.name ?? (n.look ? `${KIND_NAME[n.kind]} (${n.look})` : KIND_NAME[n.kind]), `${KIND_NAME[n.kind]} · ${n.x},${n.y}${n.removed ? ' · borrado' : ''}`)),
    ...W.items.map((it) => li('item', it, ITEMS[it.item]?.name ?? it.item, `Objeto · ${it.x},${it.y}${it.removed ? ' · borrado' : ''}`)));
}

function renderInspector() {
  const sel = S.sel;
  if (!sel) { inspector.replaceChildren(h('p', { class: 'ed-hint', text: 'Elegí una persona u objeto con la herramienta Mover, o desde la lista de abajo.' })); return; }
  const r = sel.ref;
  const rows = [];
  if (sel.type === 'npc') {
    rows.push(h('p', {}, h('b', { text: r.name ?? KIND_NAME[r.kind] }), ` · ${KIND_NAME[r.kind]} · casilla ${r.x},${r.y}`));
    if (r.kind === 'added') {
      const look = h('select', { class: 'ed-input', onchange: () => { if (look.value === 'swimmer' && S.W.tiles[r.y]?.[r.x] !== '~') { look.value = r.look; status('El nadador solo puede estar sobre agua: movelo al agua primero.', 'warn'); return; } edit(() => { r.look = look.value; }); } },
        Object.keys(LOOKS).map((k) => h('option', { value: k, text: k, selected: k === r.look })));
      rows.push(h('label', { class: 'me-field' }, 'Aspecto', look));
      const wander = h('input', { type: 'checkbox', checked: r.wander, onchange: () => edit(() => { r.wander = wander.checked; }) });
      rows.push(h('label', { class: 'me-check' }, wander, ' Camina por la zona'));
    }
    const dir = h('select', { class: 'ed-input', onchange: () => edit(() => { r.dir = dir.value; }) }, DIRS.map(([d, n]) => h('option', { value: d, text: n, selected: d === (r.dir ?? 'down') })));
    rows.push(h('label', { class: 'me-field' }, 'Mira hacia', dir));
    if (r.text) {
      const ta = h('textarea', { class: 'ed-input me-text', rows: 4, text: r.text.join('\n') });
      ta.addEventListener('change', () => edit(() => { r.text = ta.value.split('\n').map((s) => s.trim()).filter(Boolean); if (!r.text.length) r.text = ['…']; }));
      rows.push(h('label', { class: 'me-field' }, 'Qué dice (una línea por cuadro de diálogo)', ta));
    } else if (r.kind !== 'critter') {
      rows.push(h('p', { class: 'ed-hint', text: 'Lo que dice viene de la historia del juego: acá solo se puede mover.' }));
    }
  } else {
    rows.push(h('p', {}, h('b', { text: ITEMS[r.item]?.name ?? r.item }), ` · casilla ${r.x},${r.y}`));
  }
  rows.push(h('div', { class: 'me-row' },
    r.removed ? btn('Volver a poner', () => edit(() => { r.removed = false; })) : btn('Borrar', () => removeSel(), { class: 'ed-btn me-danger' })));
  inspector.replaceChildren(...rows);
}

// ---------------------------------------------------------------- drawing
function draw() {
  const W = S.W;
  if (!W) return;
  const m = MAPS[S.id];
  const hgt = W.tiles.length, wid = W.tiles[0].length;
  const Z = S.zoom;
  canvas.width = wid * T * Z;
  canvas.height = hgt * T * Z;
  g.imageSmoothingEnabled = false;
  g.setTransform(Z, 0, 0, Z, 0, 0);
  const rows = W.tiles.map((r) => r.join(''));
  for (let y = 0; y < hgt; y++) for (let x = 0; x < wid; x++) g.drawImage(tileCanvas(rows[y][x], 0, m.theme, groundFor(rows, x, y, S.W.ground, m.theme)), x * T, y * T);
  if (!m.indoor) { drawGroundEdges(g, rows, 0, 0, wid - 1, hgt - 1, 0, 0, m.theme); drawBuildingTrim(g, rows, 0, 0, wid - 1, hgt - 1, 0, 0, m.theme); }
  for (const it of W.items) {
    if (it.removed) continue;
    drawItem(g, it.item, it.x * T, it.y * T - 1);
  }
  for (const n of W.npcs) {
    if (n.removed) continue;
    let spr = null;
    try { if (n.look && !String(n.look).startsWith('animal:')) spr = charSprite(n.look, n.dir ?? 'down', 0); } catch { spr = null; }
    if (spr) g.drawImage(spr, n.x * T, n.y * T - 2);
    else { g.fillStyle = n.kind === 'critter' ? 'rgba(200,140,60,.85)' : 'rgba(255,255,255,.7)'; g.fillRect(n.x * T + 4, n.y * T + 4, 8, 8); }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  // exits and doors, labelled at screen size so they stay readable at any zoom
  const tag = (text, px, py, color, align = 'center') => {
    g.font = '600 12px system-ui, sans-serif';
    const w = g.measureText(text).width + 8;
    const x0 = Math.max(2, Math.min(canvas.width - w - 2, align === 'center' ? px - w / 2 : align === 'right' ? px - w : px));
    const y0 = Math.max(2, Math.min(canvas.height - 18, py));
    g.fillStyle = 'rgba(10,12,30,.78)'; g.fillRect(x0, y0, w, 16);
    g.fillStyle = color; g.fillText(text, x0 + 4, y0 + 12);
  };
  const S1 = T * Z;
  for (const [side, ex] of Object.entries(m.exits ?? {})) {
    const label = `${{ n: '↑', s: '↓', w: '←', e: '→' }[side]} ${nameOf(ex.to)}`;
    if (side === 'n') tag(label, canvas.width / 2, 2, '#ffe05a');
    else if (side === 's') tag(label, canvas.width / 2, canvas.height - 18, '#ffe05a');
    else if (side === 'w') tag(label, 2, canvas.height / 2 - 8, '#ffe05a', 'left');
    else tag(label, canvas.width - 2, canvas.height / 2 - 8, '#ffe05a', 'right');
  }
  const doors = (m.doors ?? []).map((d) => (typeof d === 'string' ? d : d.to));
  let k = 0;
  rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (c !== 'D') return;
    const to = doors[k++];
    tag(to ? nameOf(to) : '¿?', x * S1 + S1 / 2, y * S1 - 18, '#fff');
  }));
  if (S.grid && Z >= 2) {
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= wid; x++) { g.moveTo(x * T * Z + 0.5, 0); g.lineTo(x * T * Z + 0.5, hgt * T * Z); }
    for (let y = 0; y <= hgt; y++) { g.moveTo(0, y * T * Z + 0.5); g.lineTo(wid * T * Z, y * T * Z + 0.5); }
    g.stroke();
  }
  // problems in red, selection in yellow, hover in white
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(255,70,70,.95)';
  for (const p of S.problems) if (p.x != null) g.strokeRect(p.x * T * Z + 1, p.y * T * Z + 1, T * Z - 2, T * Z - 2);
  if (S.sel && !S.sel.ref.removed) { g.strokeStyle = '#ffe05a'; g.strokeRect(S.sel.ref.x * T * Z + 1, S.sel.ref.y * T * Z + 1, T * Z - 2, T * Z - 2); }
  if (S.hover) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.strokeRect(S.hover.x * T * Z + 0.5, S.hover.y * T * Z + 0.5, T * Z - 1, T * Z - 1); }
}

// ---------------------------------------------------------------- editing
const snap = () => JSON.stringify({ tiles: S.W.tiles, npcs: S.W.npcs, items: S.W.items, weather: S.W.weather, ground: S.W.ground, shift: S.W.shift });
function pushUndo() {
  S.undo.push(snap());
  if (S.undo.length > MAX_UNDO) S.undo.shift();
  S.redo = [];
}
function restoreSnap(json) {
  const o = JSON.parse(json);
  S.W = o;
  weatherSel.value = o.weather ?? 'random';
  groundSel.value = o.ground ?? 'auto';
  if (S.sel) S.sel = null;
}
function undo() {
  if (!S.undo.length) return;
  S.redo.push(snap());
  restoreSnap(S.undo.pop());
  changed();
}
function redo() {
  if (!S.redo.length) return;
  S.undo.push(snap());
  restoreSnap(S.redo.pop());
  changed();
}
/** One undoable change. */
function edit(fn) {
  pushUndo();
  fn();
  changed();
}
function changed() {
  sizeInfo.textContent = `Ahora: ${S.W.tiles[0].length}×${S.W.tiles.length} casillas.`;
  const p = diff(S.id, S.W);
  const was = base[S.id] ?? null;
  if (JSON.stringify(p) === JSON.stringify(was)) delete drafts[S.id];
  else drafts[S.id] = p;
  persist();
  runChecks();
  draw();
  renderEntities();
  renderInspector();
  renderMapList();
  syncPending();
  undoBtn.disabled = !S.undo.length;
  redoBtn.disabled = !S.redo.length;
}

function setTile(x, y, ch) {
  const row = S.W.tiles[y];
  if (!row || row[x] === undefined || row[x] === ch) return false;
  if (LOCKED.has(row[x])) { status('Esa casilla es una puerta o un cartel: no se puede pintar encima.', 'warn'); return false; }
  row[x] = ch;
  return true;
}
function fill(x0, y0, ch) {
  const from = S.W.tiles[y0]?.[x0];
  if (from === undefined || from === ch || LOCKED.has(from)) return;
  const q = [[x0, y0]];
  const seen = new Set([`${x0},${y0}`]);
  while (q.length) {
    const [x, y] = q.pop();
    S.W.tiles[y][x] = ch;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (!seen.has(k) && S.W.tiles[ny]?.[nx] === from) { seen.add(k); q.push([nx, ny]); }
    }
  }
}
function entityAt(x, y) {
  const n = S.W.npcs.find((o) => !o.removed && o.x === x && o.y === y);
  if (n) return { type: 'npc', ref: n };
  const it = S.W.items.find((o) => !o.removed && o.x === x && o.y === y);
  return it ? { type: 'item', ref: it } : null;
}
const occupied = (x, y, except?) => [...S.W.npcs, ...S.W.items].some((o) => o !== except && !o.removed && o.x === x && o.y === y);
function select(type, ref) {
  S.sel = { type, ref };
  draw();
  renderEntities();
  renderInspector();
}
function removeSel() {
  const r = S.sel?.ref;
  if (!r) return;
  edit(() => {
    if (r.kind === 'added') S.W.npcs.splice(S.W.npcs.indexOf(r), 1);
    else if (r.added) S.W.items.splice(S.W.items.indexOf(r), 1);
    else r.removed = true;
    S.sel = null;
  });
}
function freeSpot() {
  const W = S.W;
  const cy = Math.floor(W.tiles.length / 2), cx = Math.floor(W.tiles[0].length / 2);
  for (let r = 0; r < 40; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = cx + dx, y = cy + dy;
    if (!SOLID(W.tiles[y]?.[x]) && !occupied(x, y)) return [x, y];
  }
  return [cx, cy];
}
/** Closest free water tile to the centre of the map (swimmers can only stand on water), or null. */
function waterSpot(): [number, number] | null {
  const W = S.W;
  const cy = Math.floor(W.tiles.length / 2), cx = Math.floor(W.tiles[0].length / 2);
  for (let r = 0; r < Math.max(W.tiles.length, W.tiles[0].length); r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = cx + dx, y = cy + dy;
    if (W.tiles[y]?.[x] === '~' && !occupied(x, y)) return [x, y];
  }
  return null;
}
function addNpc() {
  let [x, y] = freeSpot();
  if (addLook.value === 'swimmer') {
    const w = waterSpot();
    if (!w) { status('Este mapa no tiene agua: el nadador solo puede estar sobre agua.', 'warn'); return; }
    [x, y] = w;
  }
  edit(() => {
    const n = { key: null, kind: 'added', x, y, look: addLook.value, dir: 'down', text: ['Hola.'], wander: false };
    S.W.npcs.push(n);
    S.sel = { type: 'npc', ref: n };
  });
  setTool('move');
  status('Persona agregada en el centro: arrastrala con Mover y escribí qué dice.', 'ok');
}
function addItem() {
  const [x, y] = freeSpot();
  const used = new Set(S.W.items.map((it) => it.id));
  let n = 1;
  while (used.has(`ed_${S.id}_${n}`)) n++;
  edit(() => {
    const it = { id: `ed_${S.id}_${n}`, x, y, item: addItemSel.value, added: true };
    S.W.items.push(it);
    S.sel = { type: 'item', ref: it };
  });
  setTool('move');
  status('Objeto agregado en el centro: arrastralo con Mover a donde quieras.', 'ok');
}
/** Adds rows/columns on any side, filled with the chosen tile. Everything in the map keeps its place on the ground. */
function growMap() {
  const n = Object.fromEntries(GROW.map(([k, , inp]) => [k, Math.max(0, Math.min(120, Math.floor(+inp.value || 0)))]));
  if (!n.left && !n.top && !n.right && !n.bottom) return status('Poné cuántas filas o columnas querés agregar.', 'warn');
  const wid = S.W.tiles[0].length + n.left + n.right, hgt = S.W.tiles.length + n.top + n.bottom;
  if (wid > 200 || hgt > 200) return status('El mapa no puede pasar de 200×200 casillas.', 'warn');
  const ch = LOCKED.has(S.tile) ? '.' : S.tile;
  edit(() => {
    const W = S.W;
    const old = W.tiles;
    const blank = () => Array(wid).fill(ch);
    const rows = [];
    for (let y = 0; y < n.top; y++) rows.push(blank());
    for (const r of old) rows.push([...Array(n.left).fill(ch), ...r, ...Array(n.right).fill(ch)]);
    for (let y = 0; y < n.bottom; y++) rows.push(blank());
    W.tiles = rows;
    for (const o of [...W.npcs, ...W.items]) { o.x += n.left; o.y += n.top; }
    W.shift = { x: (W.shift?.x ?? 0) + n.left, y: (W.shift?.y ?? 0) + n.top };
    S.sel = null;
  });
  for (const [, , inp] of GROW) inp.value = '0';
  status(`Mapa agrandado a ${S.W.tiles[0].length}×${S.W.tiles.length}. Ahora pintá la forma que quieras.`, 'ok');
}
function resetMap() {
  if (!patchOf(S.id)) return status('Este mapa no tiene cambios.');
  edit(() => { const o = MAP_ORIGINALS[S.id]; S.W = { tiles: o.tiles.map((r) => [...r]), npcs: o.npcs.map((n) => ({ ...n, text: n.text ? [...n.text] : null, removed: false })), items: o.items.map((it) => ({ ...it, removed: false })), weather: 'random', ground: 'auto', shift: { x: 0, y: 0 } }; S.sel = null; });
  status('Mapa vuelto al original. Si lo guardás, el juego también vuelve al original.', 'ok');
}

// ---------------------------------------------------------------- mouse and keys
function cellAt(ev) {
  const r = canvas.getBoundingClientRect();
  const x = Math.floor((ev.clientX - r.left) / (T * S.zoom));
  const y = Math.floor((ev.clientY - r.top) / (T * S.zoom));
  return S.W?.tiles[y]?.[x] === undefined ? null : { x, y };
}
canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
canvas.addEventListener('pointerdown', (ev) => {
  const c = cellAt(ev);
  if (!c) return;
  canvas.setPointerCapture(ev.pointerId);
  if (ev.button === 2 || S.tool === 'pick') { pickTile(S.W.tiles[c.y][c.x]); return; }
  if (S.tool === 'move') {
    const e = entityAt(c.x, c.y);
    if (!e) { S.sel = null; draw(); renderEntities(); renderInspector(); return; }
    select(e.type, e.ref);
    S.drag = { ref: e.ref, before: snap(), moved: false };
    return;
  }
  if (S.tool === 'fill') { edit(() => fill(c.x, c.y, S.tile)); return; }
  pushUndo();
  S.painting = true;
  if (setTile(c.x, c.y, S.tile)) draw();
});
canvas.addEventListener('pointermove', (ev) => {
  const c = cellAt(ev);
  S.hover = c;
  if (c) {
    const ch = S.W.tiles[c.y][c.x];
    const e = entityAt(c.x, c.y);
    hoverEl.textContent = `Casilla ${c.x},${c.y} · ${TILE_INFO[ch]?.name ?? ch} "${ch}"${TILE_INFO[ch]?.solid ? ' (no se pisa)' : ''}${e ? ` · ${e.type === 'npc' ? (e.ref.name ?? KIND_NAME[e.ref.kind]) : ITEMS[e.ref.item]?.name}` : ''}`;
  }
  if (S.painting && c && S.tool === 'paint') setTile(c.x, c.y, S.tile);
  if (S.drag && c && (c.x !== S.drag.ref.x || c.y !== S.drag.ref.y)) {
    if (S.drag.ref.look === 'swimmer' && S.W.tiles[c.y][c.x] !== '~') status('El nadador solo puede estar sobre agua.', 'warn');
    else if ((S.drag.ref.look === 'swimmer' || !SOLID(S.W.tiles[c.y][c.x])) && !occupied(c.x, c.y, S.drag.ref)) { S.drag.ref.x = c.x; S.drag.ref.y = c.y; S.drag.moved = true; }
  }
  draw();
});
const endStroke = () => {
  if (S.painting) { S.painting = false; changed(); }
  if (S.drag) {
    if (S.drag.moved) { S.undo.push(S.drag.before); S.redo = []; changed(); }
    S.drag = null;
  }
};
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
canvas.addEventListener('pointerleave', () => { S.hover = null; draw(); });

function setTool(id) {
  S.tool = id;
  for (const [k, b] of Object.entries(toolBtns)) b.classList.toggle('is-active', k === id);
  canvas.dataset.tool = id;
}
addEventListener('keydown', (ev) => {
  if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement || ev.target instanceof HTMLSelectElement) return;
  const k = ev.key.toLowerCase();
  if ((ev.ctrlKey || ev.metaKey) && k === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
  if ((ev.ctrlKey || ev.metaKey) && k === 'y') { ev.preventDefault(); redo(); return; }
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const tool = { b: 'paint', g: 'fill', i: 'pick', v: 'move' }[k];
  if (tool) setTool(tool);
  else if (k === 'h') { S.grid = !S.grid; gridChk.checked = S.grid; draw(); }
  else if ((k === 'delete' || k === 'backspace') && S.sel) removeSel();
});

// ---------------------------------------------------------------- checks (same rules as tests/check-maps.mjs)
function runChecks() {
  const id = S.id, W = S.W, m = MAPS[id];
  const rows = W.tiles.map((r) => r.join(''));
  const at = (x, y) => rows[y]?.[x];
  const hgt = rows.length, wid = rows[0].length;
  const out = [];
  const npcs = W.npcs.filter((n) => !n.removed), items = W.items.filter((i) => !i.removed);
  for (const n of npcs) if (SOLID(at(n.x, n.y)) && n.look !== 'ball' && n.look !== null) out.push({ x: n.x, y: n.y, msg: `${n.name ?? KIND_NAME[n.kind]} está parado sobre algo que no se pisa.` });
  for (const n of npcs) if (n.look === 'swimmer' && at(n.x, n.y) !== '~') out.push({ x: n.x, y: n.y, msg: `${n.name ?? KIND_NAME[n.kind]} es un nadador y está en tierra: tiene que estar sobre agua.` });
  for (const it of items) if (SOLID(at(it.x, it.y))) out.push({ x: it.x, y: it.y, msg: `${ITEMS[it.item]?.name ?? it.item} está sobre algo que no se pisa.` });
  const pass = (x, y) => { const t = at(x, y); return t !== undefined && (!SOLID(t) || t === '%' || t === '~' || t === '\\'); };
  let starts = [];
  if (isOutdoor(id)) {
    for (const side of Object.keys(m.exits ?? {})) {
      const cells = side === 'e' ? rows.map((_, y) => [wid - 1, y]) : side === 'w' ? rows.map((_, y) => [0, y]) : side === 'n' ? [...rows[0]].map((_, x) => [x, 0]) : [...rows[hgt - 1]].map((_, x) => [x, hgt - 1]);
      const open = cells.filter(([x, y]) => pass(x, y));
      if (!open.length) out.push({ msg: `La salida hacia ${nameOf(m.exits[side].to)} quedó tapada.` });
      starts.push(...open.map(([x, y]) => [x, y, side]));
    }
  } else {
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'm') starts.push([x, y, 'mat']); }));
  }
  if (starts.length) {
    const seen = new Set([`${starts[0][0]},${starts[0][1]}`]);
    const q = [[starts[0][0], starts[0][1]]];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (pass(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    const near = (x, y) => seen.has(`${x},${y}`) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));
    for (const [x, y, side] of starts) if (!seen.has(`${x},${y}`)) out.push({ x, y, msg: `La salida ${side === 'mat' ? 'de la puerta' : `hacia ${nameOf(m.exits[side].to)}`} quedó separada del resto del mapa.` });
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'D' && isOutdoor(id) && !seen.has(`${x},${y + 1}`)) out.push({ x, y, msg: 'No se puede llegar al frente de una puerta.' }); }));
    for (const n of npcs) if (n.look !== null && n.kind !== 'critter' && !near(n.x, n.y)) out.push({ x: n.x, y: n.y, msg: `No se puede llegar a ${n.name ?? KIND_NAME[n.kind].toLowerCase()}.` });
    for (const it of items) if (!near(it.x, it.y)) out.push({ x: it.x, y: it.y, msg: `No se puede llegar a ${ITEMS[it.item]?.name ?? it.item}.` });
  }
  S.problems = out;
  checks.replaceChildren(out.length
    ? h('ul', { class: 'me-problems' }, out.map((p) => h('li', { text: p.msg })))
    : h('p', { class: 'me-ok', text: 'Todo en orden: se llega a todas las salidas, puertas, personas y objetos.' }));
}

// ---------------------------------------------------------------- open a map
function openMap(id) {
  S.id = id;
  S.W = working(id);
  S.sel = null;
  S.undo = [];
  S.redo = [];
  undoBtn.disabled = redoBtn.disabled = true;
  try { store.setItem('pokeuy:map-last', id); } catch { /* storage blocked */ }
  weatherSel.value = S.W.weather ?? 'random';
  groundSel.value = S.W.ground ?? 'auto';
  renderMapList();
  renderPalette();
  runChecks();
  renderEntities();
  renderInspector();
  draw();
  stage.scrollTo(0, 0);
  sizeInfo.textContent = `Ahora: ${S.W.tiles[0].length}×${S.W.tiles.length} casillas.`;
  status(`${nameOf(id)}: ${S.W.tiles[0].length}×${S.W.tiles.length} casillas.`);
}

function syncPending() {
  const n = Object.keys(drafts).length;
  pending.textContent = n ? `${n} mapa${n === 1 ? '' : 's'} con cambios sin guardar` : 'Sin cambios pendientes';
  pending.classList.toggle('has-changes', !!n);
  saveBtn.disabled = !n;
}

// ---------------------------------------------------------------- files & GitHub
function live() {
  const out = { ...base };
  for (const [k, v] of Object.entries(drafts)) {
    if (v) out[k] = v;
    else delete out[k];
  }
  return out;
}
function download() {
  const blob = new Blob([mapEditsSource(live())], { type: 'text/javascript' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'map-overrides.js' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const b64encode = (text) => btoa(unescape(encodeURIComponent(text)));
const b64decode = (b64) => decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));

async function saveToGitHub() {
  if (!Object.keys(drafts).length) return status('No hay cambios para guardar.');
  const bad = Object.keys(drafts).filter((id) => id === S.id && S.problems.length);
  if (bad.length && !confirm('Este mapa tiene problemas en la revisión (algo quedó tapado). ¿Guardar igual?')) return;
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
  const headers = { Authorization: `Bearer ${devToken()}`, Accept: 'application/vnd.github+json' };
  status('Guardando en GitHub…');
  try {
    // The browser may keep an old copy of the file (and its sha): always ask GitHub again, and if someone
    // saved in between (409), read the new copy and retry a few times before giving up.
    let merged;
    for (let attempt = 1; ; attempt++) {
      const cur = await fetch(`${url}?ref=main&t=${Date.now()}`, { headers, cache: 'no-store' });
      if (!cur.ok) throw await ghError(cur);
      const meta = await cur.json();
      // Merge on top of what is on GitHub now, so edits made from another computer are kept.
      merged = parseMapEditsSource(b64decode(meta.content));
      for (const [k, v] of Object.entries(drafts)) {
        if (v) merged[k] = v;
        else delete merged[k];
      }
      const names = Object.keys(drafts).map(nameOf).join(', ');
      const body = { message: `Editor de mapas: ${names}`, content: b64encode(mapEditsSource(merged)), sha: meta.sha, branch: 'main' };
      const put = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body), cache: 'no-store' });
      if ((put.status === 409 || put.status === 422) && attempt < 5) { await new Promise((r) => setTimeout(r, 1200 * attempt)); continue; }
      if (!put.ok) throw await ghError(put);
      break;
    }
    base = merged;
    drafts = {};
    persist();
    renderMapList();
    syncPending();
    status('Guardado. El juego publicado se actualiza solo en uno o dos minutos.', 'ok');
  } catch (err) {
    status(`No se pudo guardar en GitHub: ${err.message} Se descargó el archivo con tus cambios para que no los pierdas.`, 'error');
    download();
  }
}
async function ghError(res) {
  let detail = '';
  try { detail = (await res.json()).message ?? ''; } catch { /* no body */ }
  const hint = {
    401: 'El token venció o es incorrecto: generá uno nuevo.',
    403: 'El token no tiene permiso de escritura (Contents: Read and write) sobre este repositorio, o GitHub limitó los pedidos.',
    404: 'El token no ve el repositorio, o falta el archivo de mapas en main.',
    409: 'Alguien guardó al mismo tiempo: probá de nuevo.',
    422: 'GitHub rechazó el cambio: probá de nuevo.',
  }[res.status] ?? '';
  return new Error(`GitHub respondió ${res.status}${detail ? ` («${detail}»)` : ''}. ${hint}`);
}

// ---------------------------------------------------------------- start
// Locked until a GitHub token with write access to the repo is verified (checked again on every visit).
function start() {
  lock.remove();
  setTool('paint');
  syncPending();
  let last = null;
  try { last = store.getItem('pokeuy:map-last'); } catch { /* storage blocked */ }
  openMap(MAPS[last] ? last : 'carmelo');
}
const lockInput = h('input', { type: 'password', class: 'ed-input', placeholder: 'Token de GitHub', autocomplete: 'off', spellcheck: 'false' });
const lockMsg = h('p', { class: 'ed-lock-msg', role: 'status' });
const lockForm = h('form', { class: 'ed-lock-card' },
  h('b', { text: 'Poke Uruguay' }),
  h('h1', { text: 'Editor de mapas' }),
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
// QA builds open straight away (no token) so test scripts can drive the editor.
if (typeof __QA__ !== 'undefined' && __QA__) { start(); window.__me = { S, openMap, draw, diff, working }; }
