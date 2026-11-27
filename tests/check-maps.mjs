import { TILE_INFO, collAt } from '../src/gfx/tiles.ts';
// Static checks on world data: row widths, NPC/item placement, doors, exits.
import { MAPS, OUTDOOR, INTERIOR } from '../src/data/maps.ts';
const SOLID = new Set(Object.entries(TILE_INFO).filter(([, v]) => v.solid).map(([k]) => k));
let problems = 0;
const bad = (m) => { problems++; console.log('✗', m); };
for (const [id, m] of Object.entries(MAPS)) {
  const w = m.tiles[0].length;
  m.tiles.forEach((r, y) => r.length !== w && bad(`${id} row ${y} width ${r.length} != ${w}`));
  const at = (x, y) => m.tiles[y]?.[x];
  for (const n of m.npcs ?? []) {
    const t = at(n.x, n.y);
    if (t == null) bad(`${id} npc out of bounds ${n.x},${n.y}`);
    else if (SOLID.has(t) && !(t === '~' && n.look === 'swimmer') && !(t === 'λ' && n.blocker) && n.look !== 'ball' && n.look !== null) bad(`${id} npc on solid '${t}' at ${n.x},${n.y} (${n.look})`);
  }
  if (m.elev) for (const o of [...(m.npcs ?? []), ...(m.items ?? []).filter((i) => !i.hidden)]) if (collAt(m, o.x, o.y) === true && m.coll?.[o.y]?.[o.x] !== 'x') bad(`${id} person or item on a cliff at ${o.x},${o.y}`);
  for (const it of m.items ?? []) { const t = at(it.x, it.y); if (t == null || (SOLID.has(t) && !it.hidden)) bad(`${id} item on '${t}' at ${it.x},${it.y}`); }
  if (m.legend) { const t = at(m.legend.x, m.legend.y); if (t == null || SOLID.has(t)) bad(`${id} legend on '${t}'`); }
  const doors = m.tiles.join('').split('').filter((c) => c === 'D').length;
  if ((m.doors?.length ?? 0) !== doors) bad(`${id} has ${doors} doors but ${m.doors?.length ?? 0} door targets`);
  for (const d of m.doors ?? []) { const to = typeof d === 'string' ? d : d.to; if (!MAPS[to]) bad(`${id} door -> missing ${to}`); }
  for (const [side, ex] of Object.entries(m.exits ?? {})) {
    if (!MAPS[ex.to]) bad(`${id} exit ${side} -> missing ${ex.to}`);
    const edge = side === 'e' ? m.tiles.map((r) => r[w - 1]) : side === 'w' ? m.tiles.map((r) => r[0]) : side === 'n' ? [...m.tiles[0]] : [...m.tiles.at(-1)];
    if (!edge.some((t) => !SOLID.has(t) || t === '%' || t === '~')) bad(`${id} exit ${side} has no walkable edge tile`);
  }
  for (const k of ['top', 'coll', 'elev']) if (m[k] && (m[k].length !== m.tiles.length || m[k].some((r) => r.length !== w))) bad(`${id} layer ${k} does not match the map size`);
  if (m.indoor && !m.tiles.join('').includes('m')) bad(`${id} interior without mat`);
  const signs = m.tiles.join('').split('').filter((c) => c === 'S').length;
  if (!m.indoor && (m.signs?.length ?? 0) !== signs) bad(`${id} has ${signs} signs but ${m.signs?.length ?? 0} texts`);
}
// Silbato del Hornero lands below each Policlínica door: it must be walkable.
for (const [id, m] of Object.entries(OUTDOOR)) {
  m.tiles.forEach((r, y) => { const x = r.indexOf('IIDII'); if (x >= 0 && SOLID.has(m.tiles[y + 1]?.[x + 2] ?? '#')) bad(`${id} fly point blocked`); });
}
// warps must land on walkable tiles
for (const [id, m] of Object.entries(MAPS)) for (const w of m.warps ?? []) { const t = MAPS[w.to]?.tiles[w.ty]?.[w.tx]; if (t == null || SOLID.has(t)) bad(`${id} warp lands on '${t}'`); }
// every interior reachable
const linked = new Set(Object.values(OUTDOOR).flatMap((m) => (m.doors ?? []).map((d) => (typeof d === 'string' ? d : d.to))).concat(Object.values(MAPS).flatMap((m) => (m.warps ?? []).map((w) => w.to))));
for (const id of Object.keys(INTERIOR)) if (!linked.has(id)) bad(`interior ${id} is not linked from any door`);
// connectivity: from the first walkable edge tile of an outdoor map, every exit, door front and NPC/item is reachable
const walkable = (m, x, y) => { const t = m.tiles[y]?.[x]; const c = collAt(m, x, y); if (t !== undefined && c === true) return false; if (t !== undefined && c === false) return true; // collision layer, then cliffs (elev)
  return t !== undefined && (!SOLID.has(t) || t === '%' || t === '~' || t === '\\' || t === 'Ϡ'); }; // thickets (machete) and water (canoe) count as passable
for (const [id, m] of Object.entries(OUTDOOR)) {
  const h = m.tiles.length; const w = m.tiles[0].length;
  const starts = [];
  for (const side of Object.keys(m.exits ?? {})) {
    const cells = side === 'e' ? m.tiles.map((_, y) => [w - 1, y]) : side === 'w' ? m.tiles.map((_, y) => [0, y]) : side === 'n' ? [...m.tiles[0]].map((_, x) => [x, 0]) : [...m.tiles[h - 1]].map((_, x) => [x, h - 1]);
    for (const [x, y] of cells) if (walkable(m, x, y)) starts.push([x, y, side]);
  }
  if (!starts.length) continue;
  const seen = new Set([`${starts[0][0]},${starts[0][1]}`]);
  const q = [[starts[0][0], starts[0][1]]];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx; const ny = y + dy;
      if (walkable(m, nx, ny) && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); q.push([nx, ny]); }
    }
  }
  for (const [x, y, side] of starts) if (!seen.has(`${x},${y}`)) bad(`${id} exit ${side} tile ${x},${y} is cut off from the rest of the map`);
  m.tiles.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'D' && !seen.has(`${x},${y + 1}`)) bad(`${id} door at ${x},${y} has no reachable front tile`); }));
  for (const n of m.npcs ?? []) if (n.look !== null && !n.blocker && !seen.has(`${n.x},${n.y}`)) bad(`${id} npc at ${n.x},${n.y} unreachable`);
  for (const it of m.items ?? []) if (!seen.has(`${it.x},${it.y}`) && !(it.hidden && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${it.x + dx},${it.y + dy}`)))) bad(`${id} item ${it.id} at ${it.x},${it.y} unreachable`);
}
// Nobody may trap the player. An NPC standing on its own spot must never split the doors, stairs, exits and items of a
// map into separate groups (a one-tile corridor, a doorway). A trainer who walks up to the player may end in a narrow
// pass, but then the game moves it aside (clearTheWay in world.ts): there must be a tile nearby where it blocks nothing.
{
  const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const landings = {};
  for (const m of Object.values(MAPS)) {
    for (const w of m.warps ?? []) (landings[w.to] ??= []).push([w.tx, w.ty]);
    if (m.exitTo) (landings[m.exitTo.map] ??= []).push([m.exitTo.x, m.exitTo.y]);
  }
  for (const [id, m] of Object.entries(MAPS)) {
    const h = m.tiles.length; const w = m.tiles[0].length;
    const walk = (x, y) => { const t = m.tiles[y]?.[x]; return t !== undefined && (t === 'm' || !SOLID.has(t) || t === '%' || t === '~' || t === '\\' || t === 'Ϡ'); };
    const keyCells = [];
    m.tiles.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'm') keyCells.push([x, y]); if (c === 'D') keyCells.push([x, y + 1]); }));
    for (const wp of m.warps ?? []) keyCells.push([wp.x, wp.y]);
    for (const l of landings[id] ?? []) keyCells.push(l);
    for (const it of m.items ?? []) keyCells.push([it.x, it.y]);
    if (!m.indoor) for (const side of Object.keys(m.exits ?? {})) {
      const cells = side === 'e' ? m.tiles.map((_, y) => [w - 1, y]) : side === 'w' ? m.tiles.map((_, y) => [0, y]) : side === 'n' ? [...m.tiles[0]].map((_, x) => [x, 0]) : [...m.tiles[h - 1]].map((_, x) => [x, h - 1]);
      keyCells.push(...cells.filter(([x, y]) => walk(x, y)));
    }
    const flood = (sx, sy, block) => {
      const seen = new Set([`${sx},${sy}`]); const q = [[sx, sy]];
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of D4) { const k = `${x + dx},${y + dy}`; if (!seen.has(k) && !block.has(k) && walk(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); } } }
      return seen;
    };
    const groups = (block) => {
      const label = new Map(); let g = 0;
      for (const [x, y] of keyCells) {
        const k = `${x},${y}`;
        if (block.has(k) || label.has(k) || !walk(x, y)) continue;
        g++; for (const c of flood(x, y, block)) label.set(c, g);
      }
      return new Set(keyCells.map(([x, y]) => label.get(`${x},${y}`)).filter(Boolean)).size;
    };
    const base = groups(new Set());
    const people = (m.npcs ?? []).filter((d) => d.look !== null && d.look !== 'ball' && !d.blocker && !d.gate && !d.arrive && d.script !== 'town_gate');
    for (const d of people) {
      if (!walk(d.x, d.y)) continue;
      if (groups(new Set([`${d.x},${d.y}`])) > base) { bad(`${id} ${d.trainer ? `trainer ${d.trainer.id}` : `npc ${d.id ?? d.look}`} at ${d.x},${d.y} blocks the only way through`); continue; }
      if (!d.trainer || !d.sight || d.wander || d.patrol || d.adjacent) continue;
      // Where the trainer may end up next to the player: indoors along its straight line, outdoors anywhere within its
      // sight (it sees all around, counted in walking steps) with the player one step farther away.
      const stops = [];
      if (m.indoor) {
        const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d.face ?? d.dir ?? 'down'];
        for (let i = 1; i < d.sight; i++) {
          const ex = d.x + dx * i; const ey = d.y + dy * i;
          if (!walk(ex, ey) || !walk(ex + dx, ey + dy)) break;
          stops.push([ex, ey, ex + dx, ey + dy]);
        }
      } else {
        for (let ey = d.y - d.sight + 1; ey <= d.y + d.sight - 1; ey++) for (let ex = d.x - d.sight + 1; ex <= d.x + d.sight - 1; ex++) {
          const r = Math.abs(ex - d.x) + Math.abs(ey - d.y);
          if (r < 1 || r > d.sight - 1 || !walk(ex, ey) || m.tiles[ey][ex] === '~') continue;
          // a tile whose open neighbours stay joined around it can never cut anyone off
          const ring = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].map(([ax, ay]) => walk(ex + ax, ey + ay));
          // runs of open tiles going round the ring; only runs holding a side neighbour matter
          let groupsAround = 0;
          if (ring.every(Boolean)) groupsAround = 1;
          else for (let i = 0; i < 8; i++) {
            if (!ring[i] || ring[(i + 7) % 8]) continue; // start of a run
            let side = false;
            for (let j = i; ring[j % 8] && j < i + 8; j++) if (j % 2 === 1) side = true;
            if (side) groupsAround++;
          }
          if (groupsAround <= 1) continue;
          for (const [ax, ay] of D4) {
            const px = ex + ax; const py = ey + ay;
            if (Math.abs(px - d.x) + Math.abs(py - d.y) === r + 1 && walk(px, py)) { stops.push([ex, ey, px, py]); break; }
          }
        }
      }
      for (const [ex, ey, px, py] of stops) {
        const all = flood(px, py, new Set()).size;
        const cuts = (x, y) => flood(px, py, new Set([`${x},${y}`])).size < all - 1;
        if (!cuts(ex, ey)) continue;
        // the step-aside search of clearTheWay: nearest tile reachable without crossing the player where it blocks nothing
        const seen = new Set([`${ex},${ey}`, `${px},${py}`]); const q = [[ex, ey]]; let ok = false;
        for (let j = 0; j < q.length && !ok && j < 400; j++) for (const [ax, ay] of D4) {
          const nx = q[j][0] + ax; const ny = q[j][1] + ay; const k = `${nx},${ny}`;
          if (seen.has(k) || !walk(nx, ny) || m.tiles[ny][nx] === 'm' || m.tiles[ny][nx] === '~') continue;
          seen.add(k); if (!cuts(nx, ny)) { ok = true; break; } q.push([nx, ny]);
        }
        if (!ok) bad(`${id} trainer ${d.trainer.id} walking to ${ex},${ey} would trap the player with nowhere to step aside`);
      }
    }
  }
}
// cross references: every script, track, item and species named by the data must exist
import { readFileSync, readdirSync } from 'node:fs';
import { SCRIPTS } from '../src/data/story.ts';
import { TRACKS } from '../src/core/audio.ts';
import { ITEMS } from '../src/data/items.ts';
import { SPECIES } from '../src/data/species.ts';
for (const [id, m] of Object.entries(MAPS)) {
  if (m.music && !TRACKS[m.music]) bad(`${id} music '${m.music}' does not exist`);
  for (const n of m.npcs ?? []) if (n.script && !SCRIPTS[n.script]) bad(`${id} npc script '${n.script}' does not exist`);
  for (const it of m.items ?? []) if (!ITEMS[it.item]) bad(`${id} ground item '${it.item}' is not an item`);
  for (const k of Object.keys(m.enc?.grass ?? {})) void k;
}
const sources = ['src/data', 'src/game'].flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.ts')).map((f) => `${d}/${f}`));
const cine = readFileSync('src/game/cinematics.ts', 'utf8');
for (const f of sources) {
  const src = readFileSync(f, 'utf8');
  for (const [, name] of src.matchAll(/cinematic\('([a-z_0-9]+)'\)/g)) if (!new RegExp(`\\b${name}:`).test(cine)) bad(`${f}: cinematic '${name}' is not defined`);
  for (const [, it] of src.matchAll(/api\.give\('([a-z_0-9]+)'/g)) if (!ITEMS[it]) bad(`${f}: api.give of unknown item '${it}'`);
  for (const [, sp] of src.matchAll(/giveCreature\('([a-z_0-9]+)'/g)) if (!SPECIES[sp]) bad(`${f}: giveCreature of unknown species '${sp}'`);
}
console.log(problems ? `${problems} problem(s)` : 'maps OK');
process.exit(problems ? 1 : 0);
