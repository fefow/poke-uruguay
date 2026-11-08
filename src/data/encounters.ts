import { SPECIES } from './species.ts';
import { wildList } from './map-gen.ts';
import { mapBand, STOPS } from './route.ts';

/** Where a wild creature is found, by the ground the player stands on. 'grass' is every dry creature of the map. */
export type Biome = 'grass' | 'plain' | 'forest' | 'sand' | 'volcanic' | 'cave' | 'water';
const CITIES = new Set(STOPS.filter((st) => st.kind === 'city').map((st) => st.id));
const FOREST_TYPES = ['planta', 'bicho', 'veneno', 'siniestro'];
const PLAIN_TYPES = ['normal', 'volador', 'tierra', 'electrico', 'lucha'];
const SAND_TYPES = ['tierra', 'roca', 'volador', 'bicho'];
const VOLCANIC_TYPES = ['fuego', 'tierra', 'roca'];
const NO_ZONES = new Set(['safari', 'parque_concurso']); // their long lists are one big park

/**
 * Which wild biome a tile belongs to, or null when nothing lives there.
 * Tall grass is "llanura" (plain) unless trees crowd around it, then it is forest; embers are volcanic; sand holds
 * its own creatures on routes and localities (never inside cities); water is for the canoe and the rod.
 */
export function tileBiome(m, at: (x: number, y: number) => string | null, x: number, y: number): Biome | null {
  const ch = at(x, y);
  if (ch === '~') return 'water';
  if (m.theme === 'cueva') return ch && !['#', 'q', 'R', 'K', 'p'].includes(ch) ? 'cave' : null;
  if (ch === ';') return 'volcanic';
  if (ch === 's') {
    if (!m.enc?.list?.length || m.indoor || CITIES.has(m.id) || NO_ZONES.has(m.id)) return null;
    // only a real beach counts: sand with water within 3 tiles. Sand-coloured ground inland is just terrain.
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (at(x + dx, y + dy) === '~') return 'sand';
    return null;
  }
  if (ch !== ',') return null;
  if (NO_ZONES.has(m.id)) return 'grass';
  let trees = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = at(x + dx, y + dy); if (c === '#' || c === 'q') trees++; }
  return trees >= 6 ? 'forest' : 'plain';
}

const zoneCache = new Map<string, any[]>();
/** Entries of the map's own list with one of `types`, topped up with creatures of those types of the map's level band. */
function zoneList(m, biome: 'sand' | 'volcanic', types: string[]) {
  const key = `${m.id ?? ''}|${biome}`;
  const hit = zoneCache.get(key);
  if (hit) return hit;
  const own = ((m.enc?.list ?? []) as any[]).filter(([sp]) => SPECIES[sp].types.some((t) => types.includes(t)) && !SPECIES[sp].types.includes('agua'));
  const [lo, hi] = bandOf(m);
  const out = [...own];
  if (out.length < 4) {
    for (const [k, a, b] of wildList(types, lo, hi, 6, `${biome}-${m.id}`)) {
      if (out.length >= 4) break;
      if (!out.some(([sp]) => sp === k) && !SPECIES[k].types.includes('agua')) out.push([k, a, b, 8]);
    }
  }
  zoneCache.set(key, out);
  return out;
}

const CAVE_TYPES = ['tierra', 'roca', 'veneno', 'bicho'];
/** Which of a map's wild entries can appear in a given biome. */
const NIGHT_TYPES = ['siniestro', 'veneno', 'psiquico'];
const DAY_TYPES = ['volador', 'planta', 'normal'];
/**
 * Day and night change who shows up: shadowy creatures come out after dark and are scarcer by day, birds and plants the
 * other way round. `night` is 0 (day) to 1 (full night). Nothing disappears: only the odds shift, so every map keeps its list.
 */
function byClock(list: any[], night: number) {
  if (!night) return list.map(([sp, lo, hi, w]) => [sp, lo, hi, (w ?? 1) * (SPECIES[sp].types.some((t) => NIGHT_TYPES.includes(t)) ? 0.5 : SPECIES[sp].types.some((t) => DAY_TYPES.includes(t)) ? 1.25 : 1)]);
  return list.map(([sp, lo, hi, w]) => [sp, lo, hi, (w ?? 1) * (SPECIES[sp].types.some((t) => NIGHT_TYPES.includes(t)) ? 1 + 2 * night : SPECIES[sp].types.some((t) => DAY_TYPES.includes(t)) ? 1 - 0.5 * night : 1)]);
}

export function encounterList(m, biome: Biome, night = 0) {
  const isWater = (sp) => SPECIES[sp].types.includes('agua');
  const all: any[] = m.enc?.list ?? [];
  if (biome === 'water') return waterTable(m, 2);
  const dry = all.filter(([sp]) => !isWater(sp));
  if (biome === 'sand') return byClock(zoneList(m, 'sand', SAND_TYPES), night);
  if (biome === 'volcanic') return byClock(zoneList(m, 'volcanic', VOLCANIC_TYPES), night);
  if (biome === 'plain' || biome === 'forest') {
    // Same creatures of the map, other odds: normal and flying kinds roam the open plain, plants and bugs hide in the
    // trees. The ones that do not belong stay possible but rare, so nothing on the map's list becomes unobtainable.
    const has = (sp, ts) => SPECIES[sp].types.some((t) => ts.includes(t));
    return byClock(dry.map(([sp, lo, hi, w]) => {
      const inForest = has(sp, FOREST_TYPES), inPlain = has(sp, PLAIN_TYPES);
      const fit = biome === 'forest' ? (inForest ? 1.6 : 0.25) : inPlain || !inForest ? 1.3 : 0.2;
      return [sp, lo, hi, (w ?? 1) * fit];
    }), night);
  }
  if (biome === 'cave') {
    const cave = dry.filter(([sp]) => SPECIES[sp].types.some((t) => CAVE_TYPES.includes(t)));
    return cave.length ? cave : dry;
  }
  return byClock(dry, night);
}

const WATER_W = [24, 18, 15, 12, 10, 8, 7, 6];
const tables = new Map<string, any[]>();

/** Level band of a map: its place on the route, or the levels of its own wild list. */
function bandOf(m): [number, number] {
  const band = m.id ? mapBand(m.id) : null;
  if (band) return [band[0], band[1]];
  const l: any[] = m.enc?.list ?? [];
  if (l.length) return [Math.min(...l.map((e) => e[1])), Math.max(...l.map((e) => e[2]))];
  return [8, 12];
}

/**
 * Water creatures of a map by how they are reached (all in percentages, [species, lo, hi, weight]):
 * 0/1 Caña Vieja: only small creatures of low level, whatever the zone; 2 Caña Buena and the canoe: the zone's own
 * eight water creatures; 3 Súper Caña: the same, with the rarer ones about twice as likely and one level higher.
 */
export function waterTable(m, rod: number): any[] {
  const key = `${m.id ?? ''}|${rod >= 3 ? 3 : rod === 1 ? 1 : 2}`;
  const hit = tables.get(key);
  if (hit) return hit;
  let out: any[];
  if (rod === 1) {
    out = wildList(['agua'], 4, 9, 4, 'caña-vieja').map(([k, a, b], i) => [k, a, b, [45, 30, 15, 10][i]]);
  } else {
    const [lo, hi] = bandOf(m);
    const base = wildList(['agua'], lo, hi, 8, `agua-${m.id}`).map(([k, a, b], i) => [k, a, b, WATER_W[i] ?? 5]);
    out = rod >= 3 ? base.map(([k, a, b, w], i) => [k, a, Math.min(hi + 1, b + 1), Math.round(w * (1 + i * 0.3))]) : base;
  }
  tables.set(key, out);
  return out;
}
