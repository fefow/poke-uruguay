// Route markers ("mojones"): on the long stretches between Policlínicas, a marker beside the trail saves a respawn point
// when the player walks past it. If the party faints afterwards, it wakes up there, fully healed (the marker itself never heals).
import { CHAIN, STOP_INDEX } from './route.ts';

const SOLIDISH = new Set(['#', 'F', '~', 'λ', 'H', 'w', 'R', 'r']);

export function addCheckpoints(maps: Record<string, any>) {
  for (const id of CHAIN) {
    if (STOP_INDEX[id] !== undefined) continue; // cities and localities have a Policlínica or are small
    const m = maps[id];
    if (!m?.tiles || m.indoor || m.dark || m.safari) continue;
    const w = m.tiles[0].length, h = m.tiles.length;
    if (Math.max(w, h) < 56) continue;
    const long = w >= h;
    const span = long ? w : h;
    const fractions = span >= 90 ? [0.33, 0.67] : [0.5];
    const at = (x: number, y: number) => m.tiles[y]?.[x];
    const trail = (c: string) => c === '=' || c === 'b';
    const busy = (x: number, y: number) => [...(m.npcs ?? []), ...(m.items ?? [])].some((o) => Math.abs(o.x - x) + Math.abs(o.y - y) < 3);
    for (const f of fractions) {
      let placed = false;
      for (const strict of [true, false]) for (let d = 0; d < span * 0.2 && !placed; d++) {
        for (const sign of d ? [-1, 1] : [1]) {
          const a = Math.floor(span * f) + sign * d;
          for (let b = 2; b < (long ? h : w) - 2 && !placed; b++) {
            const [x, y] = long ? [a, b] : [b, a];
            const c = at(x, y);
            if (c !== '.' && c !== ',') continue;
            const near = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as number[][]).filter(([dx, dy]) => trail(at(x + dx, y + dy)));
            if ((strict && !near.length) || busy(x, y)) continue;
            // keep it off the narrow bits: at least two walkable neighbours besides the trail, and no wall of markers
            const open = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as number[][]).filter(([dx, dy]) => !SOLIDISH.has(at(x + dx, y + dy)) && at(x + dx, y + dy) !== undefined).length;
            if (open < 2) continue;
            m.tiles[y] = m.tiles[y].slice(0, x) + 'Щ' + m.tiles[y].slice(x + 1);
            placed = true;
          }
        }
      }
    }
  }
}
