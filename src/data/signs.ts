// Signs and hidden items, the small things that make a classic map feel lived in (a classic route has three or
// four signs and one or two things hidden in the scenery; a city has a sign at every important door).
// Every sign is placed on plain ground and kept only if nothing that was reachable gets cut off.
import { rng } from './map-gen.ts';
import { TILE_INFO } from '../gfx/tiles.ts';

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const solid = (c) => c === undefined || !!TILE_INFO[c]?.solid;
const PLAIN = new Set(['.', ',', 'f']);
const ARROW = { n: '↑', s: '↓', e: '→', w: '←' };

const TIPS = [
  'CONSEJO DE ENTRENADOR\nEl pastizal alto esconde criaturas salvajes. El pasto corto, no.',
  'CONSEJO DE ENTRENADOR\nLos desniveles se bajan de un salto, pero no se pueden subir. Mirá bien antes de saltar.',
  'CONSEJO DE ENTRENADOR\nLos mojones de la ruta anotan a quien pasa: si tus criaturas caen, despertás junto al último.',
  'CONSEJO DE ENTRENADOR\nDe noche salen otras criaturas. Vale la pena volver a pasar cuando oscurece.',
  'CONSEJO DE ENTRENADOR\nLas criaturas de agua solo aparecen en el agua.',
  'CONSEJO DE ENTRENADOR\nHay cosas escondidas entre las piedras y los árboles. Revisá lo que te llame la atención.',
];
const HIDDEN = ['mate', 'esfera', 'mate', 'te_marcela', 'esfera'];

/** Reading order of the 'S' tiles, which is the order of m.signs. */
const signCells = (rows) => {
  const out = [];
  rows.forEach((r, y) => r.forEach((c, x) => { if (c === 'S') out.push(`${x},${y}`); }));
  return out;
};

function reachCount(rows, starts) {
  const seen = new Set(starts.map(([x, y]) => `${x},${y}`));
  const st = [...starts];
  while (st.length) {
    const [x, y] = st.pop();
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (!seen.has(k) && !solid(rows[ny]?.[nx])) { seen.add(k); st.push([nx, ny]); }
    }
  }
  return seen.size;
}

function placer(m) {
  const rows = m.tiles.map((r) => [...r]);
  const h = rows.length, w = rows[0].length;
  const texts = new Map(signCells(rows).map((k, i) => [k, m.signs?.[i] ?? '…']));
  const objs = [...(m.npcs ?? []), ...(m.items ?? []), ...(m.legend ? [m.legend] : [])];
  const busy = (x, y) => objs.some((o) => Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1);
  const starts = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && !solid(rows[y][x])) starts.push([x, y]);
  }
  if (!starts.length) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === 'D') starts.push([x, y + 1]);
  let before = reachCount(rows, starts);
  /** Puts a sign at (x, y) if the tile is plain, free, away from doors and blocks nothing. */
  const sign = (x, y, text) => {
    if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1 || !PLAIN.has(rows[y][x]) || busy(x, y)) return false;
    if (D4.some(([dx, dy]) => ['D', 'S', 'm'].includes(rows[y + dy]?.[x + dx]))) return false;
    if (rows[y + 1]?.[x] === 'D' || rows[y - 1]?.[x] === 'D') return false;
    const was = rows[y][x];
    rows[y][x] = 'S';
    const after = reachCount(rows, starts);
    if (after < before - 1) { rows[y][x] = was; return false; }
    before = after;
    texts.set(`${x},${y}`, text);
    return true;
  };
  const done = () => {
    m.tiles = rows.map((r) => r.join(''));
    m.signs = signCells(rows).map((k) => texts.get(k) ?? '…');
  };
  return { rows, w, h, sign, done, starts };
}

/** The first plain tile beside the walkable way, searched outwards from (x, y). */
function near(p, x, y, text, r = 4) {
  for (let d = 1; d <= r; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
    const cx = x + dx, cy = y + dy;
    if (!D4.some(([ex, ey]) => ['=', 'c', 'b'].includes(p.rows[cy + ey]?.[cx + ex]) || PLAIN.has(p.rows[cy + ey]?.[cx + ex]))) continue;
    if (p.sign(cx, cy, text)) return true;
  }
  return false;
}

/** Routes and localities: a sign at each way in naming where it leads, a trainer tip, and 1-2 hidden items. */
export function signRoute(m, id, maps) {
  const p = placer(m);
  const title = (m.name ?? '').toUpperCase();
  const where = (side) => {
    const ex = m.exits?.[side];
    return ex && maps[ex.to] ? `${ARROW[side]} ${maps[ex.to].name}` : null;
  };
  const ways = Object.keys(m.exits ?? {}).map(where).filter(Boolean).join('   ');
  const rand = rng(`signs${id}`);
  const has = (x, y) => p.rows[y]?.[x] === 'S';
  let made = 0;
  for (const side of Object.keys(m.exits ?? {})) {
    // the walkable mouth on that edge
    const edge = p.starts.filter(([x, y]) => (side === 'w' ? x === 0 : side === 'e' ? x === p.w - 1 : side === 'n' ? y === 0 : y === p.h - 1));
    if (!edge.length) continue;
    const [ex, ey] = edge[Math.floor(edge.length / 2)];
    const inx = side === 'w' ? ex + 4 : side === 'e' ? ex - 4 : ex, iny = side === 'n' ? ey + 4 : side === 's' ? ey - 4 : ey;
    let already = false;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) if (has(inx + dx, iny + dy)) already = true;
    if (!already && near(p, inx, iny, `${title}\n${ways}`)) made++;
  }
  // a trainer tip somewhere along the middle
  if (p.w * p.h >= 500) {
    const tip = TIPS[Math.floor(rand() * TIPS.length)];
    near(p, p.w >> 1, p.h >> 1, tip, Math.max(p.w, p.h) >> 1);
  }
  p.done();
  hideItems(m, id, rand);
  return made;
}

/** One or two items hidden in a rock or at the edge of the trees, picked up by checking that spot. */
function hideItems(m, id, rand) {
  const rows = m.tiles;
  const h = rows.length, w = rows[0].length;
  const taken = new Set([...(m.items ?? []), ...(m.npcs ?? [])].map((o) => `${o.x},${o.y}`));
  // only spots the player can stand next to
  const reach = new Set<string>();
  const st = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && !solid(rows[y][x])) { reach.add(`${x},${y}`); st.push([x, y]); }
  }
  while (st.length) {
    const [x, y] = st.pop();
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (!reach.has(k) && !solid(rows[ny]?.[nx])) { reach.add(k); st.push([nx, ny]); }
    }
  }
  const spots = [];
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
    const c = rows[y][x];
    if ((c !== 'R' && c !== '#' && c !== 'q') || taken.has(`${x},${y}`)) continue;
    if (D4.some(([dx, dy]) => PLAIN.has(rows[y + dy][x + dx]) && reach.has(`${x + dx},${y + dy}`))) spots.push([x, y]);
  }
  const want = w * h >= 1500 ? 2 : 1;
  for (let k = 0; k < want && spots.length; k++) {
    const i = Math.floor(rand() * spots.length);
    const [x, y] = spots.splice(i, 1)[0];
    (m.items ??= []).push({ x, y, item: HIDDEN[Math.floor(rand() * HIDDEN.length)], id: `${id}_hid${k}`, hidden: true });
  }
}

/** Cities: a sign beside the gym, the Policlínica and the almacén, as every classic city has. */
export function signCity(m, leader?: { name: string; cls: string }) {
  const p = placer(m);
  let made = 0;
  const doors = [];
  p.rows.forEach((r, y) => r.forEach((c, x) => { if (c === 'D') doors.push([x, y]); }));
  (m.doors ?? []).forEach((d, i) => {
    const to = typeof d === 'string' ? d : d.to;
    const at = doors[i];
    if (!at) return;
    let text = null;
    if (/^poli_/.test(to)) text = 'POLICLÍNICA\nAtención para tus criaturas.';
    else if (/^shop_/.test(to)) text = 'ALMACÉN\nMates, Pokeballs y lo necesario para el camino.';
    else if (/^gym_/.test(to)) {
      text = leader ? `${m.name.toUpperCase()}: GIMNASIO\nLíder: ${leader.name}, ${leader.cls}.` : `${m.name.toUpperCase()}: GIMNASIO`;
    }
    if (!text) return;
    // beside the door, one row down (in front of the building, next to the way in)
    const [x, y] = at;
    if (p.sign(x - 2, y + 1, text) || p.sign(x + 2, y + 1, text) || p.sign(x - 3, y + 1, text) || p.sign(x + 3, y + 1, text)) made++;
  });
  p.done();
  return made;
}
