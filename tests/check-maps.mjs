// Static checks on world data: row widths, NPC/item placement, doors, exits.
import { MAPS, OUTDOOR, INTERIOR } from '../src/data/maps.js';
const SOLID = new Set('~#qpRKkFSHwrugovWLlMZzxXnBTPENOGhaJjdVyeCQIUt%^123456789!@$&*+'.split(''));
let problems = 0;
const bad = (m) => { problems++; console.log('✗', m); };
for (const [id, m] of Object.entries(MAPS)) {
  const w = m.tiles[0].length;
  m.tiles.forEach((r, y) => r.length !== w && bad(`${id} row ${y} width ${r.length} != ${w}`));
  const at = (x, y) => m.tiles[y]?.[x];
  for (const n of m.npcs ?? []) {
    const t = at(n.x, n.y);
    if (t == null) bad(`${id} npc out of bounds ${n.x},${n.y}`);
    else if (SOLID.has(t) && n.look !== 'ball' && n.look !== null) bad(`${id} npc on solid '${t}' at ${n.x},${n.y} (${n.look})`);
  }
  for (const it of m.items ?? []) { const t = at(it.x, it.y); if (t == null || SOLID.has(t)) bad(`${id} item on '${t}' at ${it.x},${it.y}`); }
  if (m.legend) { const t = at(m.legend.x, m.legend.y); if (t == null || SOLID.has(t)) bad(`${id} legend on '${t}'`); }
  const doors = m.tiles.join('').split('').filter((c) => c === 'D').length;
  if ((m.doors?.length ?? 0) !== doors) bad(`${id} has ${doors} doors but ${m.doors?.length ?? 0} door targets`);
  for (const d of m.doors ?? []) { const to = typeof d === 'string' ? d : d.to; if (!MAPS[to]) bad(`${id} door -> missing ${to}`); }
  for (const [side, ex] of Object.entries(m.exits ?? {})) {
    if (!MAPS[ex.to]) bad(`${id} exit ${side} -> missing ${ex.to}`);
    const edge = side === 'e' ? m.tiles.map((r) => r[w - 1]) : side === 'w' ? m.tiles.map((r) => r[0]) : side === 'n' ? [...m.tiles[0]] : [...m.tiles.at(-1)];
    if (!edge.some((t) => !SOLID.has(t))) bad(`${id} exit ${side} has no walkable edge tile`);
  }
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
const walkable = (m, x, y) => { const t = m.tiles[y]?.[x]; return t !== undefined && (!SOLID.has(t) || t === '%' || t === '~'); }; // thickets (machete) and water (canoe) count as passable
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
  for (const n of m.npcs ?? []) if (n.look !== null && !seen.has(`${n.x},${n.y}`)) bad(`${id} npc at ${n.x},${n.y} unreachable`);
  for (const it of m.items ?? []) if (!seen.has(`${it.x},${it.y}`)) bad(`${id} item ${it.id} at ${it.x},${it.y} unreachable`);
}
console.log(problems ? `${problems} problem(s)` : 'maps OK');
process.exit(problems ? 1 : 0);
