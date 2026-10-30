// Helpers that keep authored teams consistent with the level curve of the route: a team written for
// level 45 can be rescaled to level 12 without leaving a fully evolved creature at level 12.
import { SPECIES } from './species.js';
import { teamOf } from './map-gen.js';

const STONE_LEVEL = 28; // stone evolutions have no level of their own: treat them as mid-game

const PREV = (() => {
  const out = {};
  for (const s of Object.values(SPECIES)) if (s.evo) out[s.evo.to] = s;
  return out;
})();

/** Lowest level at which a species is expected to exist in the wild or in a trainer's team. */
export function minLevelOf(key) {
  const from = PREV[key];
  if (!from) return 1;
  const own = from.evo.stone ? STONE_LEVEL : from.evo.lvl;
  return Math.max(own, minLevelOf(from.key) + 1);
}

/** Moves a species along its evolution line (back or forward) until its stage matches the level. */
export function fitSpecies(key, lv) {
  let k = key;
  while (PREV[k] && minLevelOf(k) > lv) k = PREV[k].key;
  for (let next = SPECIES[k].evo?.to; next && minLevelOf(next) + (SPECIES[k].evo.stone ? 6 : 0) <= lv; next = SPECIES[k].evo?.to) k = next;
  return k;
}

/** Like fitSpecies, but only steps back: a wild creature never evolves just because the area is tougher. */
export function fitDown(key, lv) {
  let k = key;
  while (PREV[k] && minLevelOf(k) > lv) k = PREV[k].key;
  return k;
}

/** Rescales a team's levels from their own range into [lo, hi] and downgrades species that no longer fit. */
export function rescaleTeam(team, [lo, hi]) {
  const lvls = team.map((t) => t[1]);
  const a = Math.min(...lvls), b = Math.max(...lvls);
  return team.map(([sp, lv]) => {
    const n = b === a ? hi : Math.round(lo + ((lv - a) * (hi - lo)) / (b - a));
    return [fitSpecies(sp, n), n];
  });
}

/** Team for a boss of the given size whose strongest creature is `ace`. Fills missing slots from `types`. */
export function bossTeam(team, size, ace, types, seed) {
  const base = team.slice(0, Math.max(0, size - 1)).concat(team.slice(-1)).slice(0, size);
  const out = [...base];
  if (out.length < size) {
    const extra = teamOf(types, Array.from({ length: size - out.length }, () => ace - 2), seed);
    out.splice(out.length - 1, 0, ...extra);
  }
  const step = size > 1 ? Math.min(3, Math.max(1, Math.round(ace / 12))) : 0;
  return out.map(([sp], i) => {
    const lv = Math.max(2, ace - (size - 1 - i) * step * 0.7);
    const n = Math.round(lv);
    return [fitSpecies(sp, n), n];
  });
}
