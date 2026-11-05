// Tolls ("peajes"): on some routes, right before the exit to the next zone, the whole width of the road is closed by a row of
// toll cabins with a single lane through them (a trigger on the lane charges $115). Nobody can go around it: every walkable
// tile of that row (grass, water, ledges) becomes a cabin, except the lane.
import { CHAIN, STOP_INDEX } from './route.ts';

const TOLL_ROUTES = ['r_rosario_sanjose', 'ruta24', 'r_belen_artigas', 'r_tupambae_melo', 'r_lascano_rocha', 'r_sarandi_durazno', 'r_sanramon_canelones'];
const TRAIL = new Set(['=', 'b']);
const SOLID_WALL = new Set(['#', 'F', 'H', 'w', 'R', 'r']);

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
    const span = vertical ? w : h, cross = vertical ? h : w;
    const at = (x: number, y: number) => m.tiles[y]?.[x];
    const busy = (x: number, y: number) => [...(m.npcs ?? []), ...(m.items ?? [])].some((o) => Math.abs(o.x - x) + Math.abs(o.y - y) < 2);
    let best: { a: number; cells: number[][]; lane: number[][]; score: number } | null = null;
    for (let off = 4; off <= 26; off++) {
      const a = side === 'e' || side === 's' ? span - 1 - off : off;
      if (a < 3 || a > span - 4) continue; // never on the border row/column
      const cells: number[][] = [];
      const trail: number[][] = [];
      let bad = false;
      for (let b = 0; b < cross; b++) {
        const [x, y] = vertical ? [a, b] : [b, a];
        const c = at(x, y);
        if (c === undefined || SOLID_WALL.has(c)) continue;
        if (busy(x, y)) { bad = true; break; }
        cells.push([x, y]);
        if (TRAIL.has(c)) trail.push([x, y]);
      }
      if (bad || !cells.length || cells.length > 18 || !trail.length) continue;
      const mid = Math.floor((trail.length - 1) / 2);
      const lane = trail.length >= 2 ? [trail[mid], trail[mid + 1]] : [trail[0]];
      const score = cells.length * 3 + off;
      if (!best || score < best.score) best = { a, cells, lane, score };
    }
    if (!best) continue;
    const put = (x: number, y: number, c: string) => { m.tiles[y] = m.tiles[y].slice(0, x) + c + m.tiles[y].slice(x + 1); };
    const isLane = (x: number, y: number) => best!.lane.some(([lx, ly]) => lx === x && ly === y);
    for (const [x, y] of best.cells) put(x, y, isLane(x, y) ? 'Ѳ' : 'Ѣ');
    const xs = best.lane.map((c) => c[0]), ys = best.lane.map((c) => c[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    (m.triggers ??= []).push({ x: x0, y: y0, w: Math.max(...xs) - x0 + 1, h: Math.max(...ys) - y0 + 1, script: 'toll_booth', tollId: `peaje_${id}` });
    void STOP_INDEX;
  }
}
