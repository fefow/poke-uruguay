// Static checks on world data: row widths, NPC/item placement, doors, exits.
import { MAPS, OUTDOOR, INTERIOR } from '../src/data/maps.js';
const SOLID = new Set('~#qpRKkFSHwrugovWLlMZzxXnBTPENOGhaJjdVyeCQIUt'.split(''));
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
// every interior reachable
const linked = new Set(Object.values(OUTDOOR).flatMap((m) => (m.doors ?? []).map((d) => (typeof d === 'string' ? d : d.to))).concat(Object.values(OUTDOOR).flatMap((m) => (m.warps ?? []).map((w) => w.to))));
for (const id of Object.keys(INTERIOR)) if (!linked.has(id)) bad(`interior ${id} is not linked from any door`);
console.log(problems ? `${problems} problem(s)` : 'maps OK');
process.exit(problems ? 1 : 0);
