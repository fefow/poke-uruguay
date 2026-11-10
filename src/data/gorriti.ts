// Maldonado's sea route and Isla Gorriti.
// From the south beach of Maldonado a marked channel (red buoys, deep sea and reefs on both sides) winds a long way
// across the bay to Isla Gorriti. Only the canoe gets in, and swimmers wait along the whole channel. The island has the
// ruins of the old Fortín, a beach with sea lions and a few items.
import { tr } from './maps-act2.ts';
import { stopBand, gymAce, STOP_INDEX } from './route.ts';
import { wildList, fishList, rng, teamOf } from './map-gen.ts';
import { TR } from './map-kit.ts';

const DEEP = 'ӫ', REEF = 'Ӥ', BUOY = 'Ӣ';
/** Columns of the opening in Maldonado's south wall (the same x on the sea route's first row). */
export const SEA_GAP = [28, 35] as const;

type Grid = string[][];
const blank = (w: number, h: number, ch: string): Grid => Array.from({ length: h }, () => Array(w).fill(ch));
const rows = (g: Grid) => g.map((r) => r.join(''));

/** Sets every cell within a radius of (cx,cy) that satisfies `only`. */
function disc(g: Grid, cx: number, cy: number, rad: number, ch: string, only?: (c: string) => boolean) {
  for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
    if (y < 0 || x < 0 || y >= g.length || x >= g[0].length) continue;
    if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad + 0.5 && (!only || only(g[y][x]))) g[y][x] = ch;
  }
}

const SEA_W = 64, SEA_H = 112;
// Centreline of the channel: straight runs joined at corners, from Maldonado (north) to the island (south).
const WAYPOINTS: [number, number][] = [[32, 0], [32, 12], [12, 12], [12, 34], [50, 34], [50, 58], [16, 58], [16, 82], [46, 82], [46, 104], [32, 104], [32, SEA_H - 1]];

function centreline() {
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < WAYPOINTS.length; i++) {
    const [x0, y0] = WAYPOINTS[i], [x1, y1] = WAYPOINTS[i + 1];
    const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
    for (let x = x0, y = y0; x !== x1 || y !== y1; x += dx, y += dy) out.push([x, y]);
  }
  out.push(WAYPOINTS[WAYPOINTS.length - 1]);
  return out;
}

const NAMES = ['Ramiro', 'Nahuel', 'Gabriela', 'Iván', 'Camila', 'Mauro', 'Sol', 'Bruno', 'Lucía', 'Tomás', 'Elena'];
const LINES: [string, string, string][] = [
  ['¡Primer tramo del canal! Nadie pasa sin mojarse.', 'Pasá nomás. Más adelante hay más gente.', 'Seguí las boyas rojas y no te salgas del canal.'],
  ['Desde acá se ve la península entera. Qué lindo es esto.', 'Buen combate.', 'Fuera del canal el mar es muy hondo. Ni lo intentes.'],
  ['Hace una semana que cuido este recodo.', 'Me ganaste en mi propio recodo.', 'Después de la curva hay corriente.'],
  ['¿Vas a Gorriti? Primero tenés que pasar por mí.', 'Pasaste. Cuidá la canoa.', 'Los lobos marinos de la isla no muerden, pero gritan fuerte.'],
  ['Las boyas las pusimos nosotros. Tienen que respetarse.', 'Está bien, está bien.', 'Todavía falta un buen trecho.'],
  ['¡Qué tamaño de bahía! Nadé hasta cansarme.', 'Me cansaste más vos que el mar.', 'No te distraigas con las gaviotas.'],
  ['Se acabó el tramo fácil. Desde acá hay que remar de verdad.', 'Remás bien.', 'Casi llegás. Ya se ven las ruinas.'],
  ['Me contaron que hubo un fuerte en la isla. Yo solo veo mar.', 'Hoy perdí el mar y el combate.', 'La isla queda al final del canal.'],
  ['El último tramo es mío. ¡Nadie llega a Gorriti sin pelear!', 'Pasá. La isla es tuya.', 'En la isla hay ruinas de un fuerte del siglo dieciocho.'],
];
const CLS = ['Nadador', 'Nadadora', 'Surfista', 'Nadador', 'Guardavidas', 'Nadadora', 'Surfista', 'Nadador', 'Nadadora'];

/** The long channel from Maldonado to Isla Gorriti. */
export function makeSea() {
  const g = blank(SEA_W, SEA_H, DEEP);
  const P = centreline();
  for (const [x, y] of P) disc(g, x, y, 3, '~');
  // wide open water in front of Maldonado
  for (let y = 0; y < 6; y++) for (let x = 24; x <= 40; x++) g[y][x] = '~';
  const itemSpots: { x: number; y: number }[] = [];
  // side pockets with a sandbar, each holding an item
  for (const i of [46, 118, 188]) {
    const [x, y] = P[Math.min(i, P.length - 1)], [nx, ny] = P[Math.min(i + 1, P.length - 1)];
    const horizontal = nx !== x;
    const off = 6;
    const px = horizontal ? x : x + (x < 32 ? off : -off);
    const py = horizontal ? y + (y < 56 ? off : -off) : y;
    disc(g, px, py, 2.4, '~');
    g[py][px] = 's';
    itemSpots.push({ x: px, y: py });
  }
  // the channel's edges: reefs on the deep side, buoys marking the water side
  const at = (x: number, y: number) => g[y]?.[x];
  const r = rng('gorriti-mar');
  const edge: [number, number][] = [], wall: [number, number][] = [];
  for (let y = 0; y < SEA_H; y++) for (let x = 0; x < SEA_W; x++) {
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (g[y][x] === '~' && at(x + dx, y + dy) === DEEP) || (g[y][x] === DEEP && at(x + dx, y + dy) === '~'));
    if (!near) continue;
    (g[y][x] === '~' ? edge : wall).push([x, y]);
  }
  for (const [x, y] of wall) if (r() < 0.32 && y > 0 && y < SEA_H - 1) g[y][x] = REEF;
  for (const [x, y] of edge) if ((x * 7 + y * 13) % 11 === 0 && y > 6 && y < SEA_H - 6 && !itemSpots.some((s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 5)) g[y][x] = BUOY;
  // the mouth next to Maldonado stays open
  for (let x = SEA_GAP[0]; x <= SEA_GAP[1]; x++) g[0][x] = '~';
  const [lo0, hi0] = stopBand(STOP_INDEX.punta);
  const ace = gymAce('punta');
  // swimmers along the channel, facing back toward Maldonado, with levels rising toward the island
  const npcs: any[] = [];
  const first = 18, step = Math.floor((P.length - 40) / 9);
  for (let k = 0; k < 9; k++) {
    const i = first + k * step;
    const [x, y] = P[i], [nx, ny] = P[i + 1];
    const dir = ny > y ? 'up' : ny < y ? 'down' : nx > x ? 'left' : 'right';
    const hi = Math.round(hi0 + ((ace - hi0) * k) / 8), lo = Math.max(lo0, hi - 3);
    const lv = k % 3 === 2 ? [lo + 1, hi - 1, hi] : [lo + 1, hi];
    npcs.push(tr({ x, y, dir }, 'swimmer', `gm_${k}`, NAMES[k], CLS[k], ['agua'], lv, LINES[k], { dir, sight: 4 }));
  }
  const items = [
    { ...itemSpots[0], item: 'ultraesfera', id: 'gm_item1' },
    { ...itemSpots[1], item: 'refuerzo_especial', id: 'gm_item2' },
    { ...itemSpots[2], item: 'superesfera', id: 'gm_item3' },
  ];
  return {
    name: 'Canal de Gorriti',
    music: 'route',
    bg: 'beach',
    tiles: rows(g),
    exits: { n: { to: 'punta' }, s: { to: 'gorriti' } },
    npcs,
    items,
    // swimmers and the sea creatures of the bay
    enc: { rate: 0.12, list: wildList(['agua'], hi0 - 2, ace - 1, 8, 'gorriti-mar') },
    fish: fishList(hi0, ace, 'gorriti-mar'),
  };
}

const ISL_W = 64, ISL_H = 52;
/** Isla Gorriti: the ruins of the Fortín, sea lions on the beach and a lookout over the bay. */
export function makeIsland() {
  const g = blank(ISL_W, ISL_H, DEEP);
  const cx = 32, cy = 31, rx = 23, ry = 15;
  const r = rng('gorriti-isla');
  for (let y = 0; y < ISL_H; y++) for (let x = 0; x < ISL_W; x++) {
    const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    g[y][x] = e < 0.5 ? (r() < 0.3 ? ',' : '.') : e < 0.72 ? '.' : e < 1 ? 's' : e < 1.55 ? '~' : DEEP;
  }
  // the approach: a channel from the north edge down to the island's shore
  disc(g, 32, 0, 4, '~');
  for (let y = 0; y <= 17; y++) for (let x = 29; x <= 35; x++) if (g[y][x] === DEEP) g[y][x] = '~';
  for (let x = 28; x <= 36; x++) g[0][x] = '~';
  // trees and palms
  for (let y = 0; y < ISL_H; y++) for (let x = 0; x < ISL_W; x++) {
    if (g[y][x] === '.' && r() < 0.07) g[y][x] = '#';
    else if (g[y][x] === 's' && r() < 0.05) g[y][x] = 'p';
  }
  // the Fortín: a square of broken stone walls with a gap facing the beach
  const fx0 = 26, fx1 = 38, fy0 = 27, fy1 = 35;
  for (let y = fy0; y <= fy1; y++) for (let x = fx0; x <= fx1; x++) {
    const border = y === fy0 || y === fy1 || x === fx0 || x === fx1;
    g[y][x] = border ? 'R' : '.';
  }
  for (const [x, y] of [[32, fy1], [31, fy1], [33, fy1], [fx0, 31], [fx1, 30], [29, fy0], [36, fy0]]) g[y][x] = '.';
  // clear the neighbourhood of the Fortín of trees
  for (let y = fy0 - 1; y <= fy1 + 2; y++) for (let x = fx0 - 1; x <= fx1 + 1; x++) if (g[y][x] === '#') g[y][x] = '.';
  // a flagstone path from the shore to the gap
  for (let y = 19; y <= fy1 + 1; y++) if (!['R', '~'].includes(g[y][32])) g[y][32] = '=';
  g[fy1 + 3][34] = 'S';
  const [lo0] = stopBand(STOP_INDEX.punta);
  const ace = gymAce('punta');
  const lions = [[12, 30], [14, 35], [50, 34], [52, 29], [40, 43]].filter(([x, y]) => g[y]?.[x] === 's');
  const npcs: any[] = [
    ...lions.map(([x, y]) => ({ x, y, look: 'animal:lobito', dir: 'down', wander: true, critter: true, text: ['Un lobo marino toma sol y te mira sin apuro. Mejor no molestarlo.'] })),
    { x: 31, y: 33, look: 'oldman', dir: 'down', text: ['Estas piedras eran el Fortín de San Fernando, de cuando la costa se defendía con cañones.', 'Los piratas ya no vienen. Ahora vienen turistas con canoa. Vos al menos remaste.'] },
    { x: 33, y: 38, look: 'keeper', dir: 'up', text: ['Soy guardaparque de la isla. El canal está marcado con boyas para que nadie se pierda en la bahía.', 'Desde acá se ve Maldonado y, a lo lejos, la isla de Lobos. Hay quien dice que algo grande canta de noche en estas aguas.'] },
    { x: 20, y: 31, look: 'oldman', dir: 'right', sight: 4, trainer: TR('gi_a', 'Arqueólogo Mateo', 'Arqueólogo', teamOf(['roca', 'tierra'], [ace - 3, ace - 2], 'gi_a'), 520, 'Estoy buscando balas de cañón entre la arena. ¡Y alguien me interrumpe!', 'Perdí hasta las ganas de excavar.', 'Los muros guardan más de lo que parece.', 'oldman') },
    { x: 44, y: 36, look: 'keeper', dir: 'left', sight: 4, trainer: TR('gi_b', 'Guardaparque Silvia', 'Guardaparque', teamOf(['agua', 'normal'], [ace - 2, ace - 1], 'gi_b'), 540, 'En la isla se cuida todo. También a quienes llegan sin avisar.', 'Tenés buena mano con tus criaturas.', 'Cuando la marea baja se ven los restos del muelle viejo.', 'keeper') },
  ];
  const free = (x: number, y: number) => ['.', ',', 's', '='].includes(g[y]?.[x]);
  const items = [
    { x: 29, y: 29, item: 'ultraesfera', id: 'gi_item1' },
    { x: 8 + 0, y: 33, item: 'mate_dulce', id: 'gi_item2' },
    { x: 54, y: 33, item: 'refuerzo_ataque', id: 'gi_item3' },
  ].map((it) => (free(it.x, it.y) ? it : { ...it, x: it.x + 1, y: it.y })).filter((it) => free(it.x, it.y));
  const hi0 = ace - 2;
  return {
    name: 'Isla Gorriti',
    music: 'route',
    bg: 'beach',
    tiles: rows(g),
    exits: { n: { to: 'gorriti_mar' } },
    signs: ['ISLA GORRITI\nRuinas del Fortín de San Fernando. Zona de lobos marinos: no acercarse.'],
    npcs,
    items,
    enc: { rate: 0.1, list: wildList(['agua', 'normal', 'volador'], lo0 + 1, hi0, 8, 'gorriti-isla') },
    fish: fishList(lo0 + 1, ace, 'gorriti-isla'),
  };
}

/**
 * Maldonado's identity: Casapueblo's white terraces, the lighthouse, parasols on the beach, local talk, and the opening
 * in the south wall where the marked channel to Isla Gorriti begins. Also registers the two sea maps.
 */
export function addMaldonado(outdoor: Record<string, any>, all: Record<string, any>) {
  const m = outdoor.punta;
  if (!m) return;
  const g: Grid = m.tiles.map((r: string) => [...r]);
  const H = g.length;
  const put = (x: number, y: number, ch: string) => { if (g[y]?.[x] !== undefined) g[y][x] = ch; };
  // Casapueblo: terraced white house with arches and a tiled roof, at the north-west corner
  for (let x = 2; x <= 6; x++) put(x, 2, 'Ӡ');
  for (let x = 1; x <= 7; x++) put(x, 3, 'Ӡ');
  for (const [x, ch] of [[1, 'ӟ'], [2, 'ӟ'], [3, 'ӡ'], [4, 'ӟ'], [5, 'ӡ'], [6, 'ӟ'], [7, 'ӟ']] as [number, string][]) put(x, 4, ch);
  // lighthouse on the east point
  put(61, 26, 'ӧ'); put(61, 27, 'Ӧ');
  // parasols on the beach
  for (const [x, y] of [[12, 29], [24, 29], [26, 29], [40, 29], [42, 29], [46, 29], [11, 30], [28, 30], [44, 30]]) if (g[y][x] === 's') put(x, y, 'Ж');
  // the mouth of the channel: a gap in the south wall flanked by buoys
  for (let x = SEA_GAP[0]; x <= SEA_GAP[1]; x++) put(x, H - 1, '~');
  for (const [x, y] of [[SEA_GAP[0] - 1, 36], [SEA_GAP[1] + 1, 36], [SEA_GAP[0] - 1, 33], [SEA_GAP[1] + 1, 33]]) if (g[y][x] === '~') put(x, y, 'Ӣ');
  // a sign on the beach and one at Casapueblo, spliced in reading order so each sign keeps its own text
  const signs: string[] = [...(m.signs ?? [])];
  const addSign = (x: number, y: number, text: string) => {
    put(x, y, 'S');
    let idx = 0;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < g[0].length; xx++) if (g[yy][xx] === 'S' && (yy < y || (yy === y && xx < x))) idx++;
    signs.splice(idx, 0, text);
  };
  addSign(3, 6, 'CASAPUEBLO\nTaller, casa y mirador de paredes blancas sobre la roca. El atardecer se ve desde las terrazas.');
  addSign(32, 30, 'ISLA GORRITI ↓\nSeguí las boyas rojas por el canal marcado. Solo con canoa.\nHay nadadores en todo el recorrido.');
  m.tiles = rows(g);
  m.signs = signs;
  for (const n of m.npcs ?? []) if (['Ӡ', 'ӟ', 'ӡ'].includes(g[n.y]?.[n.x])) { n.x = 9; n.y = Math.max(2, n.y); }
  const walk = (x: number, y: number) => ['.', 'c', 's'].includes(g[y]?.[x]) && !(m.npcs ?? []).some((n: any) => n.x === x && n.y === y);
  const talk = (x: number, y: number, look: string, text: string[], dir = 'down') => { if (walk(x, y)) (m.npcs ??= []).push({ x, y, look, dir, text }); };
  talk(5, 7, 'turista', ['Casapueblo parece una escultura. Dicen que se fue agrandando durante décadas, sin planos.', 'Desde las terrazas se ve cómo el sol se hunde en el agua.']);
  talk(60, 28, 'oldman', ['El faro de Punta del Este guía a los barcos desde hace más de un siglo y medio.', 'Fijate que la luz da una vuelta completa cada pocos segundos.'], 'left');
  talk(36, 30, 'pescador', ['Pasando las boyas rojas empieza el camino largo hasta Isla Gorriti.', 'Fuera del canal el mar es muy hondo y las rocas asoman. No te salgas.'], 'down');
  talk(21, 28, 'sailor', ['En el puerto los lobos marinos esperan los restos de pescado. Son parte del paisaje.', 'Para ir a Gorriti hace falta canoa y mucha paciencia: el canal tiene varios nadadores.'], 'right');
  talk(46, 28, 'boy', ['¡En Maldonado hay una mano gigante saliendo de la arena! Los turistas se sacan fotos todo el día.']);
  m.exits = { ...(m.exits ?? {}), s: { to: 'gorriti_mar' } };
  const sea: any = makeSea(), isl: any = makeIsland();
  sea.exits.n = { to: 'punta' };
  for (const [id, map] of [['gorriti_mar', sea], ['gorriti', isl]] as [string, any][]) { outdoor[id] = map; all[id] = map; }
}
