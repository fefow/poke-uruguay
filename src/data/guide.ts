// Turns an open generated route into a guided one, the way Pokémon routes are laid out: a winding trail with
// thick tree walls on both sides, tall-grass clusters next to the trail, a few side pockets for trainers and
// items, and one-way ledges (tile 'λ') that can only be hopped downwards.
import { rng } from './map-gen.ts';
import { TILE_INFO } from '../gfx/tiles.ts';

const GROUND = new Set(['.', ',', 'f']);
const solid = (c) => c === undefined || !!TILE_INFO[c]?.solid;
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * m: an outdoor route map (or, with opts.town, a locality whose streets are the trail) ({tiles, npcs, items, ...}); opts.width: base half-width of the trail (smaller = denser).
 * Everything the player can reach before stays reachable, with the ledges counted as walls.
 */
export function guideMap(m, seed, opts: { width?: number; town?: boolean } = {}) {
  const base = opts.width ?? 3;
  const rand = rng(`guide${seed}`);
  const rows = m.tiles.map((r) => [...r]);
  const h = rows.length, w = rows[0].length;
  const at = (x, y) => rows[y]?.[x];
  const objs = [...(m.npcs ?? []), ...(m.items ?? []), ...(m.legend ? [m.legend] : [])];

  const TRAIL = opts.town ? '=bc' : '=b'; // in a locality the streets (cobbles) are the trail
  const guardObj = (x, y) => objs.some((o) => Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1) || rows[y][x] === 'S';

  // distance from the trail ('=' tiles, and the edge cells where the map exits)
  const dist = Array.from({ length: h }, () => Array(w).fill(99));
  const q = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (TRAIL.includes(rows[y][x])) { dist[y][x] = 0; q.push([x, y]); }
  if (!q.length) return;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (dist[ny]?.[nx] > dist[y][x] + 1) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); } }
  }

  // trail half-width wanders between base-1 and base+1 along the trail
  const phase = rand() * 9;
  const along = (x, y) => (w > h ? x : y);
  const widthAt = (x, y) => Math.max(1, Math.round(base + Math.sin(along(x, y) * 0.31 + phase) * 1.1));

  // pockets: clearings around every person, item and sign that sits away from the trail, joined to it by a short spur
  const open = new Set();
  const mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) open.add(`${x + dx},${y + dy}`); };
  const spurs = [];
  for (const o of objs) {
    mark(o.x, o.y, 2);
    if (dist[o.y]?.[o.x] > widthAt(o.x, o.y)) spurs.push([o.x, o.y]);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rows[y][x] === 'S') mark(x, y, 1);
  // two or three extra empty clearings with grass, so the sides are not a solid wall
  for (let k = 0; k < 3; k++) {
    const x = 4 + Math.floor(rand() * (w - 8)), y = 4 + Math.floor(rand() * (h - 8));
    if (dist[y][x] >= 4 && dist[y][x] < 8) { mark(x, y, 2); spurs.push([x, y]); }
  }
  const carve = (x, y) => {
    let cx = x, cy = y;
    for (let i = 0; i < 40 && dist[cy][cx] > 0; i++) {
      open.add(`${cx},${cy}`);
      const best = D4.map(([dx, dy]) => [cx + dx, cy + dy]).filter(([nx, ny]) => dist[ny]?.[nx] !== undefined).sort((a, b) => dist[a[1]][a[0]] - dist[b[1]][b[0]])[0];
      if (!best || dist[best[1]][best[0]] >= dist[cy][cx]) break;
      [cx, cy] = best;
    }
  };
  for (const [x, y] of spurs) carve(x, y);

  const placed = new Set();
  // tree walls: everything outside the trail corridor and the pockets
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (!GROUND.has(rows[y][x]) || dist[y][x] <= widthAt(x, y) || open.has(`${x},${y}`)) continue;
    rows[y][x] = rand() < 0.22 ? 'q' : '#';
    placed.add(`${x},${y}`);
  }

  // repair: any person, item or sign the trees have cut off gets a path cleared back to the trail
  const flood = () => {
    const seen = new Set();
    const st = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dist[y][x] === 0) { seen.add(`${x},${y}`); st.push([x, y]); }
    while (st.length) {
      const [x, y] = st.pop();
      for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy, k = `${nx},${ny}`; if (!seen.has(k) && !solid(at(nx, ny))) { seen.add(k); st.push([nx, ny]); } }
    }
    return seen;
  };
  const okSeen = flood();
  for (const o of objs) {
    const near = D4.some(([dx, dy]) => okSeen.has(`${o.x + dx},${o.y + dy}`)) || okSeen.has(`${o.x},${o.y}`);
    if (near) continue;
    const prev = new Map([[`${o.x},${o.y}`, null]]);
    const bq = [[o.x, o.y]];
    let hit = null;
    for (let i = 0; i < bq.length && !hit; i++) {
      const [x, y] = bq[i];
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (prev.has(k) || at(nx, ny) === undefined) continue;
        if (solid(at(nx, ny)) && !placed.has(k)) continue;
        prev.set(k, `${x},${y}`);
        if (okSeen.has(k)) { hit = k; break; }
        bq.push([nx, ny]);
      }
    }
    for (let k = hit; k; k = prev.get(k)) {
      if (placed.has(k)) { const [x, y] = k.split(',').map(Number); rows[y][x] = '.'; }
    }
  }

  // tall grass beside the trail, in clusters of 3-4 wide
  const patches = 4 + Math.floor(rand() * 3);
  for (let k = 0; k < patches; k++) {
    const x = 3 + Math.floor(rand() * (w - 7)), y = 3 + Math.floor(rand() * (h - 7));
    for (let dy = 0; dy < 2 + Math.floor(rand() * 2); dy++) for (let dx = 0; dx < 3 + Math.floor(rand() * 2); dx++) {
      const gx = x + dx, gy = y + dy;
      if ((rows[gy]?.[gx] === '.' || rows[gy]?.[gx] === 'f') && dist[gy][gx] >= 1 && dist[gy][gx] <= 4) rows[gy][gx] = ',';
    }
  }

  // Emerald-style grass belts: a band of tall grass that spans the whole trail, so the way forward means a few wild encounters
  const belts = opts.town ? 0 : w > h ? 2 : 1;
  for (let k = 0; k < belts; k++) {
    const pos = Math.floor((0.25 + 0.5 * ((k + rand()) / belts)) * (w > h ? w : h));
    for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
      if (Math.abs(along(x, y) - pos) <= 1 && (rows[y][x] === '.' || rows[y][x] === 'f') && !guardObj(x, y)) rows[y][x] = ',';
    }
  }

  // a grass patch with one bare tile in the middle hides an item, as Emerald does with its hidden potions
  const holes = opts.town ? 0 : 1 + Math.floor(rand() * 2);
  for (let k = 0, placed = 0; k < 60 && placed < holes; k++) {
    const x = 4 + Math.floor(rand() * (w - 8)), y = 4 + Math.floor(rand() * (h - 8));
    if (dist[y][x] < 1 || dist[y][x] > 5 || guardObj(x, y)) continue;
    const ring = D4.concat([[1, 1], [-1, -1], [1, -1], [-1, 1]]).map(([dx, dy]) => [x + dx, y + dy]);
    if (rows[y][x] !== '.' && rows[y][x] !== ',') continue;
    if (!ring.every(([rx, ry]) => rows[ry]?.[rx] === '.' || rows[ry]?.[rx] === ',' || rows[ry]?.[rx] === 'f')) continue;
    ring.forEach(([rx, ry]) => { rows[ry][rx] = ','; });
    rows[y][x] = '.';
    (m.items ??= []).push({ x, y, item: rand() < 0.5 ? 'mate' : 'esfera', id: `${seed}_hole${placed}` });
    objs.push({ x, y });
    placed++;
  }

  // ledges: short one-way lines across grass, never cutting off anything that was reachable
  const reach = () => {
    const starts = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dist[y][x] === 0) starts.push([x, y]);
    const seen = new Set(starts.map(([x, y]) => `${x},${y}`));
    const st = [...starts];
    while (st.length) {
      const [x, y] = st.pop();
      for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy, k = `${nx},${ny}`; if (!seen.has(k) && !solid(at(nx, ny)) ) { seen.add(k); st.push([nx, ny]); } }
    }
    return seen.size;
  };
  let before = reach();
  const guard = new Set(objs.flatMap((o) => [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => `${o.x + dx},${o.y + dy}`))));
  let ledges = 0;
  for (let tries = 0; tries < 500 && ledges < 5; tries++) {
    const len = 3 + Math.floor(rand() * 4);
    const x0 = 3 + Math.floor(rand() * (w - 6 - len)), y0 = 3 + Math.floor(rand() * (h - 6));
    const cells = [];
    for (let i = 0; i < len; i++) cells.push([x0 + i, y0]);
    const ok = cells.every(([x, y]) => (at(x, y) === '.' || at(x, y) === ',') && dist[y][x] >= 1 && !guard.has(`${x},${y}`) && !solid(at(x, y - 1)) && !solid(at(x, y + 1)) && at(x, y + 1) !== 'λ' && at(x, y - 1) !== 'λ');
    if (!ok) continue;
    const saved = cells.map(([x, y]) => at(x, y));
    cells.forEach(([x, y]) => { rows[y][x] = 'λ'; });
    if (reach() < before - cells.length) cells.forEach(([x, y], i) => { rows[y][x] = saved[i]; });
    else {
      cells.forEach(([x, y]) => guard.add(`${x},${y}`)); ledges++; before = reach();
      if (len >= 4) { const [sx, sy] = cells[Math.floor(len / 2)]; rows[sy][sx] = 'ʎ'; } // a flight of steps in the longer drops
    }
  }
  m.tiles = rows.map((r) => r.join(''));
}

const WALLS = new Set(['#', 'q', 'R']);

/**
 * Last pass over a generated route or locality so it reads like a hand-made map instead of tile-by-tile noise:
 * walls take the tile most of their neighbourhood has (whole stands of trees, ceibos or rock, not a mix per tile),
 * and lone tall-grass or flower tiles become plain grass (grass comes in patches). Only walls swap for walls and
 * walkable ground for walkable ground, so nothing that was reachable changes.
 */
export function tidyMap(m) {
  const h = m.tiles.length, w = m.tiles[0].length;
  let rows = m.tiles.map((r) => [...r]);
  const held = new Set([...(m.npcs ?? []), ...(m.items ?? []), ...(m.legend ? [m.legend] : [])].map((o) => `${o.x},${o.y}`));
  for (let pass = 0; pass < 2; pass++) {
    const next = rows.map((r) => [...r]);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (!WALLS.has(rows[y][x])) continue;
      const count = new Map();
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const c = rows[y + dy]?.[x + dx];
        if (WALLS.has(c)) count.set(c, (count.get(c) ?? 0) + 1);
      }
      let best = rows[y][x], top = count.get(best) ?? 0;
      for (const [c, n] of count) if (n > top) { best = c; top = n; }
      next[y][x] = best;
    }
    rows = next;
  }
  // ceibos grow in small stands at the edge of the woods, not one per tile
  const rand = rng(`tidy${m.name ?? ''}${w}x${h}`);
  const edgeTrees = [];
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
    if (rows[y][x] === '#' && D4.some(([dx, dy]) => !solid(rows[y + dy][x + dx]))) edgeTrees.push([x, y]);
  }
  for (let k = Math.round((w * h) / 400); k > 0 && edgeTrees.length; k--) {
    const [cx, cy] = edgeTrees[Math.floor(rand() * edgeTrees.length)];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (rows[cy + dy]?.[cx + dx] === '#' && cy + dy > 0 && cx + dx > 0 && cy + dy < h - 1 && cx + dx < w - 1) rows[cy + dy][cx + dx] = 'q';
  }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const c = rows[y][x];
    if ((c !== ',' && c !== 'f') || held.has(`${x},${y}`)) continue;
    if (!D4.some(([dx, dy]) => rows[y + dy][x + dx] === c)) rows[y][x] = '.';
  }
  m.tiles = rows.map((r) => r.join(''));
}

/**
 * Raised ground: on routes that run north-south, the way climbs a terrace every so often, a cliff face ('K') across
 * the whole width with a flight of steps ('ʎ') where the trail meets it. The cliff only replaces walkable ground and
 * is kept only if everything stays reachable through the steps.
 */
export function terraceMap(m) {
  const h = m.tiles.length, w = m.tiles[0].length;
  if (h <= w || h < 40) return 0;
  const rows = m.tiles.map((r) => [...r]);
  const objs = [...(m.npcs ?? []), ...(m.items ?? []), ...(m.legend ? [m.legend] : [])];
  const near = (x, y) => objs.some((o) => Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 2);
  const trig = (x, y) => (m.triggers ?? []).some((t) => x >= t.x - 1 && x <= t.x + (t.w ?? 1) && y >= t.y - 1 && y <= t.y + (t.h ?? 1));
  const starts = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && !solid(rows[y][x])) starts.push([x, y]);
  const reach = () => {
    const seen = new Set(starts.map(([x, y]) => `${x},${y}`));
    const st = [...starts];
    while (st.length) {
      const [x, y] = st.pop();
      for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy, k = `${nx},${ny}`; if (!seen.has(k) && !solid(rows[ny]?.[nx])) { seen.add(k); st.push([nx, ny]); } }
    }
    return seen;
  };
  let seen = reach();
  const want = Math.floor(h / 30);
  let made = 0;
  for (let k = 1; k <= want; k++) {
    const target = Math.round((h * k) / (want + 1));
    for (let d = 0; d < 20; d++) {
      const y = target + (d % 2 ? -1 : 1) * Math.ceil(d / 2);
      if (y < 6 || y > h - 7) continue;
      const cells = [];
      let trail = -1, bad = false;
      for (let x = 1; x < w - 1; x++) {
        const c = rows[y][x];
        if (solid(c)) continue;
        if (!['.', ',', 'f', '='].includes(c) || near(x, y) || trig(x, y) || rows[y - 1][x] === 'λ' || rows[y + 1][x] === 'λ' || rows[y + 1][x] === 'K' || rows[y - 1][x] === 'K') { bad = true; break; }
        cells.push(x);
        if (c === '=' && trail < 0) trail = x;
      }
      if (bad || cells.length < 3 || cells.length > 20 || trail < 0) continue;
      if (cells.at(-1) - cells[0] !== cells.length - 1) continue; // one clean span from wall to wall
      // the steps need open ground above and below them
      if (solid(rows[y - 1][trail]) || solid(rows[y + 1][trail])) continue;
      const saved = cells.map((x) => rows[y][x]);
      for (const x of cells) rows[y][x] = x === trail ? 'ʎ' : 'K';
      const after = reach();
      const lost = [...seen].filter((key) => !after.has(key)).length;
      if (lost > cells.length - 1) { cells.forEach((x, i) => { rows[y][x] = saved[i]; }); continue; }
      seen = after;
      made++;
      break;
    }
  }
  if (made) m.tiles = rows.map((r) => r.join(''));
  return made;
}

/**
 * More room to walk, like the classic routes (about 60% of the map walkable instead of 50%): the tree walls step back
 * from the open ground, concave corners first so the walls stay smooth, then one tile at a time along the whole edge.
 * A wall cell only opens when every open cell round it is already in the same reachable area, counting people,
 * scene triggers, ledges, water and thickets as walls, so no new shortcut appears past a blocker or a gate. The
 * outer three rows and columns are never touched (exits stay where they are, and the trees at the edge keep their
 * hidden items).
 */
export function openMap(m, target = 0.6) {
  const h = m.tiles.length, w = m.tiles[0].length;
  const rows = m.tiles.map((r) => [...r]);
  const people = new Set((m.npcs ?? []).map((o) => `${o.x},${o.y}`));
  const trig = (x, y) => (m.triggers ?? []).some((t) => x >= t.x && x < t.x + (t.w ?? 1) && y >= t.y && y < t.y + (t.h ?? 1));
  const open = (x, y) => !solid(rows[y]?.[x]) && !people.has(`${x},${y}`) && !trig(x, y);
  const total = w * h;
  let walk = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!solid(rows[y][x])) walk++;
  // label the reachable areas
  const area = new Int32Array(total).fill(-1);
  let next = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (area[y * w + x] >= 0 || !open(x, y)) continue;
    const st = [[x, y]];
    area[y * w + x] = next;
    while (st.length) {
      const [cx, cy] = st.pop();
      for (const [dx, dy] of D4) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || area[ny * w + nx] >= 0 || !open(nx, ny)) continue;
        area[ny * w + nx] = next;
        st.push([nx, ny]);
      }
    }
    next++;
  }
  let made = 0;
  for (let round = 0; round < 8 && walk / total < target; round++) {
    for (const need of [3, 2, 1]) {
      const picks = [];
      for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
        if (!WALLS.has(rows[y][x]) && rows[y][x] !== 'p') continue; // tree, ceibo, rock and palm walls
        let sides = 0, id = -1, mixed = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (!solid(rows[ny][nx]) && (people.has(`${nx},${ny}`) || trig(nx, ny))) { mixed = true; continue; }
          const a = area[ny * w + nx];
          if (!solid(rows[ny][nx]) && a < 0) mixed = true;
          if (a < 0) continue;
          if (id >= 0 && a !== id) mixed = true;
          id = a;
          if (!dx || !dy) sides++;
        }
        // a wall between two different areas, or next to something that is not plain ground, stays
        if (mixed || id < 0 || sides < need) continue;
        const N = [rows[y - 1][x], rows[y + 1][x], rows[y][x - 1], rows[y][x + 1]];
        if (N.some((c) => c === 'λ' || c === 'ʎ' || c === 'K' || c === '~' || c === '%' || c === '\\')) continue;
        picks.push([x, y, id]);
      }
      for (const [x, y, id] of picks) {
        if (walk / total >= target) break;
        rows[y][x] = '.';
        area[y * w + x] = id;
        walk++;
        made++;
      }
      if (walk / total >= target) break;
      if (need === 1) break; // one ring per round, so the walls step back evenly
    }
  }
  // bits of fence left standing on their own once the trees behind them stepped back (three tiles or less) go too
  const seenF = new Set();
  for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
    if (rows[y][x] !== 'F' || seenF.has(`${x},${y}`)) continue;
    const comp = [[x, y]];
    seenF.add(`${x},${y}`);
    for (let i = 0; i < comp.length; i++) for (const [dx, dy] of D4) {
      const nx = comp[i][0] + dx, ny = comp[i][1] + dy;
      if (rows[ny]?.[nx] === 'F' && !seenF.has(`${nx},${ny}`)) { seenF.add(`${nx},${ny}`); comp.push([nx, ny]); }
    }
    if (comp.length > 3 || comp.some(([cx, cy]) => cx < 3 || cy < 3 || cx >= w - 3 || cy >= h - 3)) continue;
    let id = -1, ok = true;
    for (const [cx, cy] of comp) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy, c = rows[ny][nx];
      if (c === 'F') continue;
      if (solid(c)) { if (D4.some(([ex, ey]) => ex === dx && ey === dy) && !WALLS.has(c) && c !== 'p') ok = false; continue; }
      const a = area[ny * w + nx];
      if (a < 0 || (id >= 0 && a !== id)) ok = false;
      id = a;
    }
    if (!ok || id < 0) continue;
    for (const [cx, cy] of comp) { rows[cy][cx] = '.'; area[cy * w + cx] = id; made++; }
  }
  if (made) m.tiles = rows.map((r) => r.join(''));
  return made;
}

/**
 * Tall grass in clean patches (a classic route paints a block of tall grass, not scattered tiles): a grass tile with
 * tall grass on three or four sides joins the patch, and a tall-grass tile sticking out on its own (one neighbour or
 * none) goes back to grass. Only plain grass and tall grass change, never under people or items.
 */
export function grassBlocks(m) {
  const h = m.tiles.length, w = m.tiles[0].length;
  const rows = m.tiles.map((r) => [...r]);
  const held = new Set([...(m.npcs ?? []), ...(m.items ?? []), ...(m.legend ? [m.legend] : [])].map((o) => `${o.x},${o.y}`));
  let made = 0;
  for (let pass = 0; pass < 3; pass++) {
    let n = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const c = rows[y][x];
      if ((c !== '.' && c !== ',') || held.has(`${x},${y}`)) continue;
      const k = D4.filter(([dx, dy]) => rows[y + dy][x + dx] === ',').length;
      if (c === '.' && k >= 3) { rows[y][x] = ','; n++; }
      else if (c === ',' && k <= 1) { rows[y][x] = '.'; n++; }
    }
    made += n;
    if (!n) break;
  }
  if (made) m.tiles = rows.map((r) => r.join(''));
  return made;
}
