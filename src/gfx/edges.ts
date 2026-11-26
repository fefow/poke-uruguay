// Edge and corner pieces, like the border metatiles of a classic tileset: water banks, tall grass patches, path
// and sand borders, joined tree masses and fences. The map keeps one character per cell (so game logic never
// changes); the piece is chosen from the 8 neighbours when the cell is drawn, the way a smart brush would pick it.
import { T, TILE_INFO, tileCanvas, groundUnder, treeTrunk, treeCrown, TREE_PAL } from './tiles.ts';
import { override, overrideEntry, overrideHasHoles } from './overrides.ts';

type Tiles = ArrayLike<ArrayLike<string>>;
export type EdgeFamily = 'water' | 'tall' | 'path' | 'sand' | 'tree' | 'fence' | 'street';

// neighbour bits: set when the neighbour belongs to the same mass
export const N = 1, NE = 2, E = 4, SE = 8, S = 16, SW = 32, W = 64, NW = 128;
const DIRS: [number, number, number][] = [[0, -1, N], [1, -1, NE], [1, 0, E], [1, 1, SE], [0, 1, S], [-1, 1, SW], [-1, 0, W], [-1, -1, NW]];

const FAMILY: Record<string, EdgeFamily> = { '~': 'water', ',': 'tall', '=': 'path', s: 'sand', '#': 'tree', q: 'tree', F: 'fence', c: 'street' };
const WATERISH = new Set(['~', 'ӫ', 'Ӥ', 'Ӣ', 'b', 'Ϡ']);
const PATHISH = new Set(['=', 'c', 'D', '_', 'b', 'ʎ', '}', '?']);
// ground a path or sand border shows against (grass, its plants and the things that stand on it)
const GRASSY = new Set(['.', ',', 'f', 'ӝ', '#', 'q', 'p', 'F', 'R', 'λ', 'K', '%', '\\']);

/** The family of a tile character, or null when it has no edge pieces. */
export function edgeFamily(ch: string | undefined): EdgeFamily | null {
  return (ch !== undefined && FAMILY[ch]) || null;
}

/** Whether a cell next to a cell of the given family counts as part of the same mass (no border between them). */
function joins(fam: EdgeFamily, tiles: Tiles, x: number, y: number): boolean {
  const c = tiles[y]?.[x];
  if (c === undefined) return fam !== 'fence'; // the map edge never draws a border
  switch (fam) {
    case 'water': return WATERISH.has(c) || groundUnder(tiles, x, y) === '~';
    case 'tall': return c === ',';
    case 'tree': return c === '#' || c === 'q'; // trees and ceibos share one mass
    case 'fence': return c === 'F';
    case 'street':
    case 'path': {
      if (PATHISH.has(c)) return true;
      if (TILE_INFO[c]?.over) return groundUnder(tiles, x, y) === '=' || groundUnder(tiles, x, y) === 'c';
      return !GRASSY.has(c);
    }
    case 'sand': {
      if (c === 's') return true;
      if (TILE_INFO[c]?.over) return groundUnder(tiles, x, y) === 's';
      return !GRASSY.has(c);
    }
  }
}

/** 8-bit neighbour mask; a diagonal only counts when both sides next to it are in the mass (47 distinct pieces). */
export function edgeMask(tiles: Tiles, x: number, y: number, fam: EdgeFamily): number {
  let m = 0;
  for (const [dx, dy, bit] of DIRS) if (joins(fam, tiles, x + dx, y + dy)) m |= bit;
  if (fam === 'fence') return m & (N | E | S | W);
  if (!(m & N) || !(m & E)) m &= ~NE;
  if (!(m & S) || !(m & E)) m &= ~SE;
  if (!(m & S) || !(m & W)) m &= ~SW;
  if (!(m & N) || !(m & W)) m &= ~NW;
  return m;
}

const FULL = 255;
// outdoor themes that only change the ground (sand, dry grass, red earth, stone): the edge pieces stand on that ground
const GROUND_THEMES = new Set(['arena', 'seca', 'colorada', 'sierra']);
/** Whether edge pieces apply to this cell: outdoor maps (plain or with a ground theme), tiles not redrawn in the sprite editor. */
function edgesOn(ch: string, theme: string | null) {
  const base = theme?.split('+')[0] || null; // a city set's theme ('<ground>+<set>') follows its ground theme
  if ((base && !GROUND_THEMES.has(base)) || !FAMILY[ch]) return false;
  // a tree redrawn in the sprite editor still joins its neighbours when the drawing has see-through parts, and a
  // redrawn tall grass keeps its drawing inside the patch (only the ring round the patch is the border piece)
  if (FAMILY[ch] === 'tree') return overrideHasHoles(`tile:${ch}0`) || (ch === '#' && !overrideEntry('tile:#0'));
  if (ch === ',') return true;
  const o = overrideEntry(`tile:${ch}0`);
  return !(o && o.w === T && o.h === T);
}

/** A key naming the piece drawn at a cell (tile char plus its edge mask), for caches and the map metrics. */
export function pieceKey(tiles: Tiles, x: number, y: number, theme: string | null = null): string {
  const ch = tiles[y][x];
  if (!edgesOn(ch, theme)) return ch;
  const fam = FAMILY[ch];
  const m = edgeMask(tiles, x, y, fam);
  return m === FULL || (fam === 'fence' && m === 0) ? ch : `${ch}${m}`;
}

// ---- drawing ----
const cache = new Map<string, HTMLCanvasElement>();
function mk() {
  const c = document.createElement('canvas');
  c.width = c.height = T;
  return c;
}

/**
 * Distance (in pixels) from a pixel to the nearest open side of the cell, with rounded outer corners of radius R and
 * a small notch at inner corners (both sides in the mass, the diagonal open). Interior pixels get a large value.
 */
function depth(px: number, py: number, m: number, R: number): number {
  const cx = px + 0.5, cy = py + 0.5;
  const dN = m & N ? 99 : cy, dS = m & S ? 99 : T - cy, dW = m & W ? 99 : cx, dE = m & E ? 99 : T - cx;
  let d = Math.min(dN, dS, dW, dE);
  const round = (a: number, b: number) => (a < R && b < R ? R - Math.hypot(R - a, R - b) : 99);
  if (!(m & N) && !(m & W)) d = Math.min(d, round(dN, dW));
  if (!(m & N) && !(m & E)) d = Math.min(d, round(dN, dE));
  if (!(m & S) && !(m & W)) d = Math.min(d, round(dS, dW));
  if (!(m & S) && !(m & E)) d = Math.min(d, round(dS, dE));
  if (m & N && m & W && !(m & NW)) d = Math.min(d, Math.hypot(cx, cy));
  if (m & N && m & E && !(m & NE)) d = Math.min(d, Math.hypot(T - cx, cy));
  if (m & S && m & W && !(m & SW)) d = Math.min(d, Math.hypot(cx, T - cy));
  if (m & S && m & E && !(m & SE)) d = Math.min(d, Math.hypot(T - cx, T - cy));
  return d;
}

interface Border { out: number; R: number; bands: string[]; tufts?: string }
const BORDERS: Partial<Record<EdgeFamily, Border>> = {
  // the bank of the land comes 2 px into the water, a dark edge under it and lighter shallows
  water: { out: 2, R: 5, bands: ['#20456e', '#2a6aae', '#62b2ee'] },
  // tall grass: the short grass shows round the patch, with blade tips poking out and a dark foot
  tall: { out: 2, R: 4, bands: ['#2e7a2a', '#3a8a30'], tufts: '#3f9434' },
  // a path or sand patch: grass 1 px over it, a dark lip and a lit line, rounded corners
  path: { out: 1, R: 4, bands: ['#a8824e', '#f0dcae'] },
  sand: { out: 1, R: 4, bands: ['#d2b070', '#fff2c8'] },
  // a paved street: a stone curb between the grass and the paving (dark joint, lit kerb, its shaded face)
  street: { out: 1, R: 2, bands: ['#56524a', '#ece4d2', '#b4ac9a'] },
};

/** Composes an area piece: `inside` art where the cell is deep in the mass, `outside` ground beyond the border. */
function areaPiece(fam: EdgeFamily, m: number, inside: HTMLCanvasElement, outside: HTMLCanvasElement) {
  const b = BORDERS[fam]!;
  const c = mk();
  const g = c.getContext('2d')!;
  g.drawImage(inside, 0, 0);
  const out = outside.getContext('2d')!.getImageData(0, 0, T, T).data;
  const img = g.getImageData(0, 0, T, T);
  const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const bands = b.bands.map(hex), tuft = b.tufts ? hex(b.tufts) : null;
  for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
    const d = depth(px, py, m, b.R);
    if (d >= b.out + bands.length) continue;
    const i = (py * T + px) * 4;
    let col: number[] | null = null;
    if (d < b.out) {
      // blade tips: every third pixel of the outer ring keeps a dark-green tip
      if (tuft && d >= b.out - 1 && (px * 7 + py * 3) % 3 === 0) col = tuft;
      else { img.data[i] = out[i]; img.data[i + 1] = out[i + 1]; img.data[i + 2] = out[i + 2]; img.data[i + 3] = 255; continue; }
    } else col = bands[Math.min(bands.length - 1, Math.floor(d - b.out))];
    img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/**
 * A tree inside a mass: neighbouring crowns overlap (each pair of trees shares a crown drawn half on each cell),
 * the gaps between them are dark canopy, and trunks only show along the bottom row, like a classic forest edge.
 */
function treePiece(m: number, ground: HTMLCanvasElement, sprite: HTMLCanvasElement | null) {
  const c = mk();
  const g = c.getContext('2d')!;
  g.drawImage(ground, 0, 0);
  // dark canopy under the crowns, rounded where the mass ends
  g.fillStyle = TREE_PAL[0];
  for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) if (depth(px, py, m, 6) >= 3.5 && (m & (N | E | S | W))) g.fillRect(px, py, 1, 1);
  const at = (ox: number, oy: number, f: (g: CanvasRenderingContext2D) => void) => { g.save(); g.translate(ox, oy); f(g); g.restore(); };
  const H = T / 2;
  if (sprite) { // the editor's drawing of the tree: copies of it overlap the same way, in screen order
    for (const [bit, ox, oy] of [[NW, -H, -H], [NE, H, -H], [N, 0, -H], [W, -H, 0], [E, H, 0], [0, 0, 0], [SW, -H, H], [SE, H, H], [S, 0, H]] as const) if (!bit || m & bit) g.drawImage(sprite, ox, oy);
    return c;
  }
  if (!(m & S)) { // bottom row: trunks of this tree and of the shared crowns at its sides
    if (m & W) at(-H, 0, treeTrunk);
    if (m & E) at(H, 0, treeTrunk);
    treeTrunk(g);
  }
  if (m & NW) at(-H, -H, treeCrown);
  if (m & NE) at(H, -H, treeCrown);
  if (m & N) at(0, -H, treeCrown);
  if (m & W) at(-H, 0, treeCrown);
  if (m & E) at(H, 0, treeCrown);
  treeCrown(g);
  if (m & SW) at(-H, H, treeCrown);
  if (m & SE) at(H, H, treeCrown);
  if (m & S) at(0, H, treeCrown);
  return c;
}

/** A fence that joins its neighbours: rails run toward each fence next to it, with a post in the middle. */
function fencePiece(m: number, ground: HTMLCanvasElement) {
  const c = mk();
  const g = c.getContext('2d')!;
  g.drawImage(ground, 0, 0);
  const px = (x: number, y: number, col: string, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const rail = '#8a5a2a', lit = '#b07a44', post = '#6a4020', dark = '#3e2410';
  if (m & W) { px(0, 6, rail, 8, 2); px(0, 11, rail, 8, 2); px(0, 6, lit, 8, 1); }
  if (m & E) { px(8, 6, rail, 8, 2); px(8, 11, rail, 8, 2); px(8, 6, lit, 8, 1); }
  if (m & N) { px(7, 0, rail, 2, 8); px(7, 0, lit, 1, 8); }
  if (m & S) { px(7, 8, rail, 2, 8); px(7, 8, lit, 1, 8); px(9, 8, dark, 1, 8); }
  g.fillStyle = 'rgba(20,40,20,0.25)'; g.fillRect(6, 14, 5, 2);
  px(6, 3, dark, 4, 12); px(7, 3, post, 2, 11); px(7, 3, lit, 1, 1);
  return c;
}

/** The ground a bank or border shows on its outer side: sand or a path next to the water, else the map's ground. */
function outsideGround(fam: EdgeFamily, tiles: Tiles, x: number, y: number, ground: string | null): string {
  if (fam === 'water') {
    const count: Record<string, number> = {};
    for (const [dx, dy] of DIRS) { const n = tiles[y + dy]?.[x + dx]; if (n === 's' || n === '=' || n === 'c') count[n] = (count[n] ?? 0) + 1; }
    const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 2) return best[0];
  }
  return ground && ground !== 'auto' && TILE_INFO[ground] && ground !== '~' ? ground : '.';
}

/**
 * The canvas to draw for a cell of an outdoor map: the edge piece when the tile has a family and the cell is on
 * the border of its mass, else the plain tile. `under` is what groundFor() gives for the cell.
 */
export function cellCanvas(tiles: Tiles, x: number, y: number, frame: number, theme: string | null, under: string | boolean, ground: string | null = null): HTMLCanvasElement {
  const ch = tiles[y][x];
  if (!edgesOn(ch, theme)) return tileCanvas(ch, frame, theme, under);
  const fam = FAMILY[ch];
  const m = edgeMask(tiles, x, y, fam);
  if (fam === 'fence' ? m === 0 : m === FULL && fam !== 'tree') return tileCanvas(ch, frame, theme, under);
  const f = TILE_INFO[ch]?.anim ? frame % 4 : 0;
  const og = fam === 'tree' || fam === 'fence' ? (typeof under === 'string' ? under : '.') : outsideGround(fam, tiles, x, y, ground);
  const key = `${theme ?? ''}|${ch}|${m}|${f}|${og}`;
  let c = cache.get(key);
  if (!c) {
    const groundC = tileCanvas(og, f, og === '.' ? theme : null, false);
    if (fam === 'tree') c = treePiece(m, groundC, overrideHasHoles(`tile:${ch}0`) ? override(`tile:${ch}0`, T, T) : null);
    else if (fam === 'fence') c = fencePiece(m, groundC);
    else c = areaPiece(fam, m, tileCanvas(ch, frame, theme, false), groundC);
    cache.set(key, c);
  }
  return c;
}

/** Every piece of a family (for the editor's preview sheet): one canvas per distinct mask. */
export function familyMasks(fam: EdgeFamily): number[] {
  const seen = new Set<number>();
  for (let raw = 0; raw < 256; raw++) {
    let m = raw;
    if (fam === 'fence') m &= N | E | S | W;
    else {
      if (!(m & N) || !(m & E)) m &= ~NE;
      if (!(m & S) || !(m & E)) m &= ~SE;
      if (!(m & S) || !(m & W)) m &= ~SW;
      if (!(m & N) || !(m & W)) m &= ~NW;
    }
    seen.add(m);
  }
  return [...seen].sort((a, b) => a - b);
}
