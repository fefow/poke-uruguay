// Tolls ("peajes"): on some routes, right before the exit to the next zone, the road crosses a toll plaza, seen from
// above like the real ones: a row of booths on concrete islands with a lane between each two, all under one roof.
// Each lane has a light on the roof: green = open (walkable, a trigger there charges $115), red = closed (its barrier
// is down and it blocks). Past the plaza a concrete barrier closes the rest of the row, so nobody goes around it.
// On the way in, a sign warns that a toll is coming and a blue board gives the toll's name.
import { CHAIN } from './route.ts';
import { cellSolid } from '../gfx/tiles.ts';
import { TOLL_H, TOLL_V, TOLL_WARN, TOLL_BOARD } from './toll-chars.ts';

const TOLL_ROUTES = ['r_rosario_sanjose', 'ruta24', 'r_belen_artigas', 'r_tupambae_melo', 'r_lascano_rocha', 'r_sarandi_durazno', 'r_sanramon_canelones'];
/** The name on each toll's board (and what reading it says). */
const TOLL_NAMES: Record<string, [string, string]> = {
  r_rosario_sanjose: ['CUFRE', 'Cufré'],
  ruta24: ['QUEGUAY', 'Queguay'],
  r_belen_artigas: ['CUAREIM', 'Cuareim'],
  r_tupambae_melo: ['CONVENTOS', 'Conventos'],
  r_lascano_rocha: ['CEBOLLATI', 'Cebollatí'],
  r_sarandi_durazno: ['RIO YI', 'Río Yí'],
  r_sanramon_canelones: ['SANTA LUCIA', 'Santa Lucía'],
};
const TRAIL = new Set(['=', 'b']);
const SOLID_WALL = new Set(['#', 'F', 'H', 'w', 'R', 'r', 'S', 'K']); // a sign already closes its tile
const GROUND = new Set(['.', ',', '=', 'f']); // what the plaza may pave over
const PLAZA = 5; // the plaza spans 5 cells each side of the road's middle: islands on odd offsets, lanes on even ones

export function addTolls(maps: Record<string, any>) {
  for (const id of TOLL_ROUTES) {
    const m = maps[id];
    if (!m?.tiles || m.indoor) continue;
    const w = m.tiles[0].length, h = m.tiles.length;
    // the exit that leads on along the story
    const next = CHAIN[CHAIN.indexOf(id) + 1];
    const side = Object.entries(m.exits ?? {}).find(([, e]: any) => e.to === next)?.[0];
    if (!side) continue;
    const vertical = side === 'e' || side === 'w'; // the toll row is a column when the route leaves east or west
    const P = vertical ? TOLL_V : TOLL_H;
    const span = vertical ? w : h, cross = vertical ? h : w;
    const at = (x: number, y: number) => m.tiles[y]?.[x];
    const people = [...(m.npcs ?? []), ...(m.items ?? [])];
    const busy = (x: number, y: number, r = 2) => people.some((o) => Math.abs(o.x - x) + Math.abs(o.y - y) < r);
    let best: { a: number; cells: number[][]; mid: number; score: number } | null = null;
    for (let off = 4; off <= 26; off++) {
      const a = side === 'e' || side === 's' ? span - 1 - off : off;
      if (a < 3 || a > span - 4) continue; // never on the border row/column
      const cells: number[][] = [];
      const trail: number[] = [];
      let bad = false;
      for (let b = 0; b < cross; b++) {
        const [x, y] = vertical ? [a, b] : [b, a];
        const c = at(x, y);
        if (c === undefined || SOLID_WALL.has(c)) continue;
        if (busy(x, y)) { bad = true; break; }
        cells.push([x, y]);
        if (TRAIL.has(c)) trail.push(b);
      }
      if (bad || !cells.length || cells.length > 18 || !trail.length) continue;
      const mid = trail[Math.floor((trail.length - 1) / 2)];
      const score = cells.length * 3 + off;
      if (!best || score < best.score) best = { a, cells, mid, score };
    }
    if (!best) continue;
    const { a, mid } = best;
    const xy = (along: number, b: number): [number, number] => (vertical ? [along, b] : [b, along]);
    const put = (x: number, y: number, c: string) => {
      m.tiles[y] = m.tiles[y].slice(0, x) + c + m.tiles[y].slice(x + 1);
      if (m.coll?.[y]?.[x] && m.coll[y][x] !== ' ') m.coll[y] = m.coll[y].slice(0, x) + ' ' + m.coll[y].slice(x + 1); // the plaza decides what blocks
    };
    // approach: the side the player comes from (the toll sits before the exit)
    const back = side === 'e' || side === 's' ? -1 : 1;
    // which lanes are open: the one on the road always, and one more beside it (the side changes with the route)
    const extra = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 2 ? 2 : -2;
    const lanes: { x: number; y: number; open: boolean }[] = [];
    const islands: { x: number; y: number }[] = [];
    let lo = Infinity, hi = -Infinity;
    for (const [x, y] of best.cells) {
      const b = vertical ? y : x;
      const o = b - mid;
      if (Math.abs(o) > PLAZA) { put(x, y, P.barrier); continue; }
      lo = Math.min(lo, b); hi = Math.max(hi, b);
      if (o % 2) { put(x, y, P.island); islands.push({ x, y }); continue; }
      // pave both ends of the lane and put the noses of the islands round it
      for (const s of [-1, 1]) {
        const [qx, qy] = xy(a + s, b);
        if (GROUND.has(at(qx, qy)) && !busy(qx, qy)) put(qx, qy, P.paved);
        for (const n of [-1, 1]) {
          const [nx, ny] = xy(a + s, b + n);
          if (Math.abs(o + n) <= PLAZA && GROUND.has(at(nx, ny)) && !busy(nx, ny)) put(nx, ny, P.nose);
        }
      }
      lanes.push({ x, y, o, open: false } as any);
    }
    // a lane can open only when both its ends can be walked
    const reach = (l) => [-1, 1].every((s) => { const [qx, qy] = xy(a + s, vertical ? l.y : l.x); return at(qx, qy) !== undefined && !cellSolid(m, m.tiles, qx, qy); });
    for (const l of lanes as any[]) if (l.o === 0) l.open = reach(l);
    const second = [extra, -extra, 2 * extra, -2 * extra].map((o) => (lanes as any[]).find((l) => l.o === o && reach(l))).find(Boolean);
    if (second) second.open = true;
    for (const l of lanes as any[]) { put(l.x, l.y, l.open ? P.open : P.closed); delete l.o; }
    // an island with no lane beside it (walls round it) is only more barrier
    for (const i of islands.splice(0)) {
      const b = vertical ? i.y : i.x;
      const byLane = lanes.some((l) => Math.abs((vertical ? l.y : l.x) - b) === 1);
      if (byLane) islands.push(i); else put(i.x, i.y, P.barrier);
    }
    lo = Math.min(...[...lanes, ...islands].map((c) => (vertical ? c.y : c.x)));
    hi = Math.max(...[...lanes, ...islands].map((c) => (vertical ? c.y : c.x)));
    // roof over the whole row of booths, with each lane's light
    m.top ??= m.tiles.map(() => ' '.repeat(w));
    const roof = (x: number, y: number, c: string) => { m.top[y] = m.top[y].slice(0, x) + c + m.top[y].slice(x + 1); };
    for (const i of islands) roof(i.x, i.y, P.roof);
    for (const l of lanes) {
      roof(l.x, l.y, l.open ? P.roofOpen : P.roofClosed);
      if (l.open) (m.triggers ??= []).push({ x: l.x, y: l.y, w: 1, h: 1, script: 'toll_booth', tollId: `peaje_${id}` });
    }
    // signs on the way in: the name board a few steps before the plaza, the warning further back beside the road
    const [name, spoken] = TOLL_NAMES[id] ?? ['PEAJE', 'Peaje'];
    const lev = (x: number, y: number) => m.elev?.[y]?.[x] ?? ' ';
    const trigAt = (x: number, y: number) => (m.triggers ?? []).some((t) => x >= t.x && x < t.x + (t.w ?? 1) && y >= t.y && y < t.y + (t.h ?? 1));
    const free = (x0: number, y0: number, x1: number, y1: number, keep: (x: number, y: number) => boolean) => {
      const e = lev(x0, y0);
      for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) {
        const c = at(x, y);
        // the ring round it stays walkable, so the sign never closes a way through
        if (c === undefined || cellSolid(m, m.tiles, x, y) || lev(x, y) !== e || busy(x, y, 1) || trigAt(x, y)) return false;
        if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && (!GROUND.has(c) || !keep(x, y) || busy(x, y, 2))) return false;
      }
      return true;
    };
    const offRoad = (x: number, y: number) => !TRAIL.has(at(x, y));
    const signs: Record<string, string> = {};
    // the board (four cells wide, always east-west so it faces the camera): beside the road, 3 to 8 steps before the plaza
    let board: { x: number; y: number } | null = null;
    for (let d = 3; d <= 12 && !board; d++) for (const s of [2, -4, 3, -5, 4, -6, 5, -7, 6, -8]) {
      const [x, y] = vertical ? [a + back * d - (back < 0 ? 3 : 0), mid + s] : [mid + s, a + back * d];
      if (free(x, y, x + 3, y, offRoad)) { board = { x, y }; break; }
    }
    if (board) {
      TOLL_BOARD.forEach((c, i) => put(board!.x + i, board!.y, c));
      for (let i = 0; i < TOLL_BOARD.length; i++) signs[`${board.x + i},${board.y}`] = `Peaje ${spoken}. Tarifa: $115. Pase por un carril con luz verde.`;
    }
    // the warning: about 10 steps before (7 to 18), next to the road
    let warn: { x: number; y: number } | null = null;
    for (const d of [10, 11, 12, 13, 14, 15, 16, 17, 18, 9, 8, 7]) for (const s of [1, -1, 2, -2, 3, -3]) {
      if (warn) break;
      const [x, y] = vertical ? [a + back * d, mid + s] : [mid + s, a + back * d];
      const nearRoad = [1, 2, 3].some((k) => [[k, 0], [-k, 0], [0, k], [0, -k]].some(([dx, dy]) => TRAIL.has(at(x + dx, y + dy))));
      if (nearRoad && free(x, y, x, y, offRoad)) warn = { x, y };
    }
    if (warn) {
      put(warn.x, warn.y, TOLL_WARN);
      signs[`${warn.x},${warn.y}`] = 'PEAJE A 500 m. Tenga preparado el importe: $115.';
    }
    m.toll = { id: `peaje_${id}`, vertical, a, back, lo, hi, lanes, islands, board, warn, name, signs };
  }
}
