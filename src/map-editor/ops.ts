// Grid operations used by the map editor (no DOM): shapes, stamps (copy/paste), replace and the "what changed"
// overlay. Kept apart so the unit tests can check them in Node.

export type Cell = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Grid = string[][];

/** The rectangle between two corners (in any order). */
export function rectBetween(a: Cell, b: Cell): Rect {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
}

/** Cells of a rectangle: all of them, or only its border. */
export function rectCells(a: Cell, b: Cell, filled = true): Cell[] {
  const r = rectBetween(a, b);
  const out: Cell[] = [];
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
    if (filled || x === r.x || y === r.y || x === r.x + r.w - 1 || y === r.y + r.h - 1) out.push({ x, y });
  }
  return out;
}

/** Cells of a straight line (Bresenham), both ends included. */
export function lineCells(a: Cell, b: Cell): Cell[] {
  const out: Cell[] = [];
  let x = a.x, y = a.y;
  const dx = Math.abs(b.x - a.x), dy = -Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1, sy = a.y < b.y ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    out.push({ x, y });
    if (x === b.x && y === b.y) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return out;
}

/** Square brush of side `size` with the cell under the pointer at its top-left-centre. */
export function brushCells(c: Cell, size = 1): Cell[] {
  const off = Math.floor((size - 1) / 2);
  const out: Cell[] = [];
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) out.push({ x: c.x - off + dx, y: c.y - off + dy });
  return out;
}

/** A copy of part of the grid (clipped to it). */
export function copyRegion(tiles: Grid, r: Rect): Grid {
  const out: Grid = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    if (!tiles[y]) continue;
    const row = tiles[y].slice(Math.max(0, r.x), r.x + r.w);
    if (row.length) out.push(row);
  }
  return out;
}

export const flipH = (s: Grid): Grid => s.map((r) => [...r].reverse());
export const flipV = (s: Grid): Grid => [...s].reverse().map((r) => [...r]);
/** Quarter turn clockwise. */
export const rotate = (s: Grid): Grid => (s.length ? s[0].map((_, x) => s.map((r) => r[x]).reverse()) : []);

/**
 * Writes `stamp` with its top-left at (x, y). Cells outside the grid, locked cells in the map and locked
 * cells in the stamp are left as they are. Returns how many cells changed.
 */
export function pasteStamp(tiles: Grid, stamp: Grid, x: number, y: number, locked: Set<string>): number {
  let n = 0;
  stamp.forEach((row, dy) => row.forEach((ch, dx) => {
    const r = tiles[y + dy];
    const cur = r?.[x + dx];
    if (cur === undefined || cur === ch || locked.has(cur) || locked.has(ch)) return;
    r[x + dx] = ch;
    n++;
  }));
  return n;
}

/** Fills cells with one tile (skipping locked ones). Returns how many changed. */
export function paintCells(tiles: Grid, cells: Cell[], ch: string, locked: Set<string>): number {
  let n = 0;
  for (const { x, y } of cells) {
    const cur = tiles[y]?.[x];
    if (cur === undefined || cur === ch || locked.has(cur)) continue;
    tiles[y][x] = ch;
    n++;
  }
  return n;
}

/** Every `from` tile in the grid (or inside `area`) becomes `to`. Returns how many changed. */
export function replaceAll(tiles: Grid, from: string, to: string, locked: Set<string>, area?: Rect): number {
  if (from === to || locked.has(from)) return 0;
  let n = 0;
  tiles.forEach((row, y) => row.forEach((ch, x) => {
    if (ch !== from) return;
    if (area && (x < area.x || y < area.y || x >= area.x + area.w || y >= area.y + area.h)) return;
    row[x] = to;
    n++;
  }));
  return n;
}

/** Cells that differ from the original map (the original placed at `shift` when the map was grown). */
export function changedCells(original: string[], tiles: Grid, shift = { x: 0, y: 0 }): Cell[] {
  const out: Cell[] = [];
  tiles.forEach((row, y) => row.forEach((ch, x) => {
    const was = original[y - shift.y]?.[x - shift.x];
    if (was !== ch) out.push({ x, y });
  }));
  return out;
}

/** Biggest whole zoom (1..max) at which a w×h map of tile size t fits in the given box; at least 1. */
export function fitZoom(w: number, h: number, t: number, boxW: number, boxH: number, max = 6): number {
  let z = 1;
  for (let k = 2; k <= max; k++) if (w * t * k <= boxW && h * t * k <= boxH) z = k;
  return z;
}

/** Terrain the smart brush tidies (the tiles that have edge pieces, see gfx/edges.ts) and whether it can be walked on. */
export const SMART_TERRAIN: Record<string, { walk: boolean }> = { '~': { walk: false }, '#': { walk: false }, ',': { walk: true }, '=': { walk: true }, s: { walk: true } };
/** Plain ground the smart brush may turn into the painted terrain. */
const SOFT = new Set(['.', 'f', 'ӝ', ',']);

/**
 * The smart brush: after a stroke of terrain, tidies the cells round it so every mass gets clean edge pieces, like a
 * classic tileset's smart path. A ground cell with terrain on 3 or 4 sides becomes terrain (no 1-tile notches), and
 * for walkable terrain two cells that only touch at a corner get joined (a diagonal path cannot be walked).
 * `keep(x, y)` protects cells (people, items, doors). Returns the cells it changed.
 */
export function smartSmooth(grid: Grid, cells: Cell[], ch: string, keep: (x: number, y: number) => boolean = () => false): Cell[] {
  const t = SMART_TERRAIN[ch];
  if (!t) return [];
  const changed: Cell[] = [];
  const is = (x: number, y: number) => grid[y]?.[x] === ch;
  const soft = (x: number, y: number) => grid[y]?.[x] !== undefined && grid[y][x] !== ch && SOFT.has(grid[y][x]) && !keep(x, y);
  const set = (x: number, y: number) => { grid[y][x] = ch; changed.push({ x, y }); };
  const area = new Map<string, Cell>();
  for (const c of cells) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) area.set(`${c.x + dx},${c.y + dy}`, { x: c.x + dx, y: c.y + dy });
  for (let pass = 0; pass < 3; pass++) {
    let n = changed.length;
    for (const { x, y } of area.values()) {
      if (!soft(x, y)) continue;
      const sides = +is(x, y - 1) + +is(x + 1, y) + +is(x, y + 1) + +is(x - 1, y);
      if (sides >= 3) set(x, y);
    }
    if (t.walk) for (const { x, y } of area.values()) {
      if (!is(x, y)) continue;
      for (const [dx, dy] of [[1, 1], [-1, 1]]) {
        if (!is(x + dx, y + dy) || is(x + dx, y) || is(x, y + dy)) continue;
        if (soft(x + dx, y)) set(x + dx, y);
        else if (soft(x, y + dy)) set(x, y + dy);
      }
    }
    if (changed.length === n) break;
  }
  return changed;
}
