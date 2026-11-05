// Route trainers watch the trail: each one faces the road (the way a person standing by a path would), and about a third
// of them pace back and forth beside it while keeping their eyes on it.
import { CHAIN, STOP_INDEX } from './route.ts';

const DIRS: Record<string, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const SIDE: Record<string, [number, number]> = { up: [1, 0], down: [1, 0], left: [0, 1], right: [0, 1] };
const TRAIL = new Set(['=', 'b']);

export function aimRouteTrainers(maps: Record<string, any>) {
  for (const id of CHAIN) {
    if (STOP_INDEX[id] !== undefined) continue;
    const m = maps[id];
    if (!m?.tiles || m.indoor || m.dark || m.safari) continue;
    const at = (x: number, y: number) => m.tiles[y]?.[x];
    const solid = (x: number, y: number) => ['#', 'F', 'H', 'w', 'R', 'r', 'λ', '~'].includes(at(x, y)) || at(x, y) === undefined;
    for (const n of m.npcs ?? []) {
      if (!n.trainer || n.gate || n.blocker || n.script || n.leader || n.adjacent || n.wander || TRAIL.has(at(n.x, n.y))) continue;
      let best: { dir: string; k: number } | null = null;
      for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
        for (let k = 1; k <= 9; k++) {
          const c = at(n.x + dx * k, n.y + dy * k);
          if (TRAIL.has(c)) { if (!best || k < best.k) best = { dir, k }; break; }
          if (solid(n.x + dx * k, n.y + dy * k)) break;
        }
      }
      if (!best) {
        // no straight line to the trail: face the way of the nearest trail tile
        let bd = 99, bx = 0, by = 0;
        for (let y = Math.max(0, n.y - 12); y < Math.min(m.tiles.length, n.y + 13); y++) for (let x = Math.max(0, n.x - 12); x < Math.min(m.tiles[0].length, n.x + 13); x++) {
          if (!TRAIL.has(at(x, y))) continue;
          const d = Math.abs(x - n.x) + Math.abs(y - n.y);
          if (d < bd) { bd = d; bx = x - n.x; by = y - n.y; }
        }
        if (bd === 99) continue;
        n.dir = Math.abs(bx) >= Math.abs(by) ? (bx < 0 ? 'left' : 'right') : (by < 0 ? 'up' : 'down');
        continue;
      }
      n.dir = best.dir;
      n.sight = Math.max(n.sight ?? 4, Math.min(8, best.k + 1));
      const h = [...(n.trainer.id as string)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      if (h % 3 === 0) n.patrol = [...SIDE[best.dir], 2];
    }
  }
}
