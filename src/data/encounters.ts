import { SPECIES } from './species.ts';

const CAVE_TYPES = ['tierra', 'roca', 'veneno', 'bicho'];
/** Which of a map's wild entries can appear in a given biome. */
export function encounterList(m, biome: 'grass' | 'cave' | 'water') {
  const isWater = (sp) => SPECIES[sp].types.includes('agua');
  const all: any[] = m.enc?.list ?? [];
  if (biome === 'water') {
    const fromFish: any[] = (m.fish ?? []).filter(([sp]) => isWater(sp));
    return fromFish.length ? fromFish : all.filter(([sp]) => isWater(sp));
  }
  const dry = all.filter(([sp]) => !isWater(sp));
  if (biome === 'cave') {
    const cave = dry.filter(([sp]) => SPECIES[sp].types.some((t) => CAVE_TYPES.includes(t)));
    return cave.length ? cave : dry;
  }
  return dry;
}
