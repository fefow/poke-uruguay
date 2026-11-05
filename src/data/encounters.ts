import { SPECIES } from './species.ts';
import { wildList } from './map-gen.ts';
import { mapBand } from './route.ts';

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

export function encounterList(m, biome: 'grass' | 'cave' | 'water', night = 0) {
  const isWater = (sp) => SPECIES[sp].types.includes('agua');
  const all: any[] = m.enc?.list ?? [];
  if (biome === 'water') return waterTable(m, 2);
  const dry = all.filter(([sp]) => !isWater(sp));
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
