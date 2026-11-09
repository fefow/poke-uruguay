// Naturalezas: cada criatura tiene una que sube un 10% una estadística y baja otra un 10%
// (las cinco neutras no cambian nada). La lista sigue la guía de Pokémon.
export type NatureStat = 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export interface Nature { name: string; up: NatureStat | null; down: NatureStat | null }

export const NATURES: Record<string, Nature> = Object.freeze({
  fuerte: { name: 'Fuerte', up: null, down: null },
  docil: { name: 'Dócil', up: null, down: null },
  seria: { name: 'Seria', up: null, down: null },
  timida: { name: 'Tímida', up: null, down: null },
  rara: { name: 'Rara', up: null, down: null },
  hurana: { name: 'Huraña', up: 'atk', down: 'def' },
  audaz: { name: 'Audaz', up: 'atk', down: 'spe' },
  firme: { name: 'Firme', up: 'atk', down: 'spa' },
  picara: { name: 'Pícara', up: 'atk', down: 'spd' },
  osada: { name: 'Osada', up: 'def', down: 'atk' },
  placida: { name: 'Plácida', up: 'def', down: 'spe' },
  agitada: { name: 'Agitada', up: 'def', down: 'spa' },
  floja: { name: 'Floja', up: 'def', down: 'spd' },
  miedosa: { name: 'Miedosa', up: 'spe', down: 'atk' },
  activa: { name: 'Activa', up: 'spe', down: 'def' },
  alegre: { name: 'Alegre', up: 'spe', down: 'spa' },
  ingenua: { name: 'Ingenua', up: 'spe', down: 'spd' },
  modesta: { name: 'Modesta', up: 'spa', down: 'atk' },
  afable: { name: 'Afable', up: 'spa', down: 'def' },
  mansa: { name: 'Mansa', up: 'spa', down: 'spe' },
  alocada: { name: 'Alocada', up: 'spa', down: 'spd' },
  serena: { name: 'Serena', up: 'spd', down: 'atk' },
  amable: { name: 'Amable', up: 'spd', down: 'def' },
  grosera: { name: 'Grosera', up: 'spd', down: 'spe' },
  cauta: { name: 'Cauta', up: 'spd', down: 'spa' },
});

export const NATURE_KEYS = Object.keys(NATURES);

/** Nature of a creature: the stored one, or (old saves) one derived from its uid so it never changes. */
export function natureOf(c: { uid: number | string; nature?: string | null }): string {
  if (c.nature && NATURES[c.nature]) return c.nature;
  let h = 7;
  for (const ch of String(c.uid)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NATURE_KEYS[h % NATURE_KEYS.length];
}

export function natureMult(c: { uid: number | string; nature?: string | null }, stat: string): number {
  const n = NATURES[natureOf(c)];
  return n.up === stat ? 1.1 : n.down === stat ? 0.9 : 1;
}

export function natureText(key: string): string {
  const n = NATURES[key];
  const NAMES: Record<string, string> = { atk: 'Ataque', def: 'Defensa', spa: 'At. Esp.', spd: 'Def. Esp.', spe: 'Velocidad' };
  return n.up ? `${n.name} (+${NAMES[n.up]}, -${NAMES[n.down!]})` : `${n.name} (neutra)`;
}
