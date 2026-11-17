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
