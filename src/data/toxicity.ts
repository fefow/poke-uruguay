// Medidor de Niebla: how much PP fog is left in Uruguay. Starts at 100 % and drops as the player closes the PP's
// plants (85 points, story events) and switches off the loose fog machines on the routes (15 points shared among them).
// Pure over the save's flags: nothing new is stored except who gave the device (got_medidor).
import { MAPS } from './maps.ts';

/** PP plants in story order: [flag set when it closes, name shown once closed, weight]. Weights add up to 85. */
export const PP_PLANTS: [string, string, number][] = [
  ['anglo_pp', 'Frigorífico Anglo · Fray Bentos', 6],
  ['muelle_clear', 'Muelle del puerto · Paysandú', 4],
  ['represa_clear', 'Represa de Salto Grande · Salto', 10],
  ['radio_clear', 'Radio de Salto', 3],
  ['torre_clear', 'Torre del transmisor · Rivera', 8],
  ['aduana_clear', 'Aduana de Rivera', 3],
  ['parrilla_clear', 'Parrilla de la Patria Gaucha · Tacuarembó', 3],
  ['anima_clear', 'Torre de las Ánimas · Melo', 5],
  ['quebrada_clear', 'Quebrada de los Cuervos', 8],
  ['open_rocha', 'Laguna de Rocha', 3],
  ['cabo_clear', 'Faro de Cabo Polonio', 6],
  ['obs_clear', 'Observatorio · Piriápolis', 4],
  ['pp_clear', 'Fábrica de Minas', 10],
  ['refineria_clear', 'Refinería · Durazno', 5],
  ['anglo_clear', 'Dr. Díaz · Montevideo', 7],
];
const MACHINE_SHARE = 15;

let machineFlags: string[] | null = null;
/** doneFlag of every loose PP fog machine in the world (route machines and hideouts), counted once. */
export function fogMachineFlags(): string[] {
  if (machineFlags) return machineFlags;
  const set = new Set<string>();
  for (const m of Object.values(MAPS) as any[]) for (const n of m?.npcs ?? []) if (n.script === 'route_fog' && n.doneFlag) set.add(n.doneFlag);
  return (machineFlags = [...set]);
}

export interface FogReading { pct: number; plantsDone: [string, string, number][]; plantsTotal: number; machinesDone: number; machinesTotal: number }

/** Current reading from the save's flags. pct is a whole number 0..100. */
export function fogReading(flags: Record<string, any>): FogReading {
  const plantsDone = PP_PLANTS.filter(([f]) => flags[f]);
  const machines = fogMachineFlags();
  const machinesDone = machines.filter((f) => flags[f]).length;
  const cut = plantsDone.reduce((s, p) => s + p[2], 0) + (machines.length ? (MACHINE_SHARE * machinesDone) / machines.length : MACHINE_SHARE);
  const pct = Math.max(0, Math.min(100, Math.round(100 - cut)));
  return { pct, plantsDone, plantsTotal: PP_PLANTS.length, machinesDone, machinesTotal: machines.length };
}

/** Colour band of a reading, used by the HUD chip and the panel bar. */
export const fogBand = (pct: number) => (pct >= 70 ? 'is-high' : pct >= 35 ? 'is-mid' : pct > 0 ? 'is-low' : 'is-clean');
