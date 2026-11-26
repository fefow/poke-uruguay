// Map metrics (compare with the classic layouts, see docs): walkable %, tile kinds, signs and hidden items per outdoor map.
// node tools/map-metrics.mjs [--all]  (default: averages for routes and towns; --all lists every map)
import { TILE_INFO } from '../src/gfx/tiles.ts';
import { OUTDOOR } from '../src/data/maps.ts';
import { MAP_OVERRIDES } from '../src/data/map-overrides.js';
import { pieceKey } from '../src/gfx/edges.ts';

const rows = [];
for (const [id, m] of Object.entries(OUTDOOR)) {
  if (m.theme === 'cueva') continue;
  const h = m.tiles.length, w = m.tiles[0].length;
  let walk = 0;
  const kinds = new Set(), pieces = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = m.tiles[y][x];
    kinds.add(c);
    pieces.add(pieceKey(m.tiles, x, y, m.theme ?? null));
    const k = m.coll?.[y]?.[x];
    if (k === 'o' || (k !== 'x' && !TILE_INFO[c]?.solid)) walk++;
  }
  const route = /^(r_|ruta)/.test(id);
  rows.push({ id, route, hand: !!MAP_OVERRIDES[id]?.tiles, size: `${w}x${h}`, walk: (100 * walk) / (w * h), kinds: kinds.size, pieces: pieces.size,
    levels: new Set((m.elev ?? []).join('').replace(/ /g, '0') || '0').size,
    signs: (m.signs ?? []).filter((s) => !s.hidden).length, hidden: (m.items ?? []).filter((i) => i.hidden).length });
}
const avg = (list, k) => (list.reduce((a, r) => a + r[k], 0) / Math.max(1, list.length)).toFixed(1);
for (const [label, list] of [['rutas', rows.filter((r) => r.route)], ['pueblos y ciudades', rows.filter((r) => !r.route)]]) {
  console.log(`${label} (${list.length}): caminable ${avg(list, 'walk')}%, tipos de tile ${avg(list, 'kinds')}, piezas ${avg(list, 'pieces')}, niveles de altura ${avg(list, 'levels')}, carteles ${avg(list, 'signs')}, ocultos ${avg(list, 'hidden')}`);
}
if (process.argv.includes('--all')) for (const r of rows) console.log(`${r.id.padEnd(28)} ${r.size.padEnd(7)} ${r.hand ? 'mano' : 'gen '} caminable ${r.walk.toFixed(0)}% tipos ${r.kinds} piezas ${r.pieces}`);
