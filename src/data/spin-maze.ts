// "Spinner" mazes: islands of floor joined by one-way lanes of arrow tiles. Stepping on an arrow throws the player along
// it until a plain tile stops them, so the way through is a directed graph the player has to work out by trying lanes.
// The generator searches fixed seeds until the graph has no dead ends (every island leads back to the entrance) and the
// route to the boss is long; the result is deterministic.
export const ARROWS = { up: 'Ϣ', down: 'Ϥ', left: 'Ϧ', right: 'Ϩ' } as const;
export type Alcove = { x: number; y: number; face: 'up' | 'down' | 'left' | 'right' };

const XS = [3, 8, 13, 18, 23, 28];
const YS = [8, 12, 16];
export const SPIN_W = 32, SPIN_H = 24;

export function spinMaze(seed0 = 1) {
  for (let seed = seed0; seed < seed0 + 5000; seed++) {
    let s = seed * 2654435761 >>> 0;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    // nodes: id "c,r" (r 0..2) and "L" for the entrance hall
    const edges: { a: string; b: string; kind: 'h' | 'v' | 'l'; i: number; r: number }[] = [];
    const id = (i, r) => `${i},${r}`;
    for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) if (rnd() < 0.85) { const f = (r % 2 === 0) !== (rnd() < 0.3); edges.push({ a: f ? id(i, r) : id(i + 1, r), b: f ? id(i + 1, r) : id(i, r), kind: 'h', i, r }); }
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) if (rnd() < 0.85) { const f = (i % 2 === 0) !== (rnd() < 0.3); edges.push({ a: f ? id(i, r) : id(i, r + 1), b: f ? id(i, r + 1) : id(i, r), kind: 'v', i, r }); }
    for (let i = 0; i < 6; i++) if (i === 2 || rnd() < 0.6) { const up = i === 2 || rnd() < 0.5; edges.push({ a: up ? 'L' : id(i, 2), b: up ? id(i, 2) : 'L', kind: 'l', i, r: 2 }); }
    const nodes = ['L']; for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) nodes.push(id(i, r));
    const reach = (from, rev) => { const seen = new Set([from]); const q = [from]; for (let k = 0; k < q.length; k++) for (const e of edges) { const [u, v] = rev ? [e.b, e.a] : [e.a, e.b]; if (u === q[k] && !seen.has(v)) { seen.add(v); q.push(v); } } return seen; };
    const fwd = reach('L', false), back = reach('L', true);
    const keep = new Set(nodes.filter((n) => fwd.has(n) && back.has(n)));
    const goal = id(2, 0);
    if (keep.size < 15 || !keep.has(goal)) continue;
    const E = edges.filter((e) => keep.has(e.a) && keep.has(e.b));
    // shortest route to the boss
    const prev = new Map([['L', null]]); const q = ['L'];
    for (let k = 0; k < q.length; k++) for (const e of E) if (e.a === q[k] && !prev.has(e.b)) { prev.set(e.b, q[k]); q.push(e.b); }
    const path: string[] = []; for (let n: string | null = goal; n; n = prev.get(n) ?? null) path.unshift(n);
    if (path.length < 9) continue;
    // draw
    const g: string[][] = Array.from({ length: SPIN_H }, () => Array(SPIN_W).fill('x'));
    const put = (x, y, c) => { g[y][x] = c; };
    const rect = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, c); };
    rect(10, 1, 17, 4, 'Y'); rect(13, 1, 14, 4, 'A'); for (const [x, y] of [[10, 1], [17, 1], [10, 4], [17, 4]]) put(x, y, 'N');
    g[0][13] = 'X'; g[0][14] = 'Z';
    rect(2, 20, 29, 22, 'Y'); put(14, 23, 'm'); put(15, 23, 'm');
    for (let y = 5; y <= 7; y++) { put(13, y, ARROWS.up); put(14, y, ARROWS.down); }
    const pos = (n) => (n === 'L' ? null : { x: XS[+n.split(',')[0]], y: YS[+n.split(',')[1]] });
    const wide = (n) => n === goal;
    for (const n of keep) { const p = pos(n); if (!p) continue; put(p.x, p.y, 'Ϲ'); if (wide(n)) put(p.x + 1, p.y, 'Ϲ'); }
    const lane = new Set<string>();
    for (const e of E) {
      if (e.kind === 'h') {
        const y = YS[e.r], x1 = XS[e.i] + (wide(id(e.i, e.r)) ? 2 : 1), x2 = XS[e.i + 1] - 1, right = e.a === id(e.i, e.r);
        for (let x = x1; x <= x2; x++) { put(x, y, right ? ARROWS.right : ARROWS.left); lane.add(`${x},${y}`); }
      } else if (e.kind === 'v') {
        const x = XS[e.i], y1 = YS[e.r] + 1, y2 = YS[e.r + 1] - 1, down = e.a === id(e.i, e.r);
        for (let y = y1; y <= y2; y++) { put(x, y, down ? ARROWS.down : ARROWS.up); lane.add(`${x},${y}`); }
      } else {
        const x = XS[e.i], up = e.a === 'L';
        for (let y = YS[2] + 1; y <= 19; y++) { put(x, y, up ? ARROWS.up : ARROWS.down); lane.add(`${x},${y}`); }
      }
    }
    for (let y = 5; y <= 7; y++) { lane.add(`13,${y}`); lane.add(`14,${y}`); }
    // alcoves beside islands (for trainers and items): a free side that is not a lane
    const alcoves: Alcove[] = [];
    const order = [...path.slice(1, -1), ...[...keep].filter((n) => n !== 'L' && !path.includes(n))];
    for (const n of order) {
      const p = pos(n)!;
      const spots: Alcove[] = [{ x: p.x, y: p.y - 1, face: 'down' }, { x: p.x, y: p.y + 1, face: 'up' }, { x: p.x - 1, y: p.y, face: 'right' }, { x: p.x + (wide(n) ? 2 : 1), y: p.y, face: 'left' }];
      const free = spots.find((a) => g[a.y]?.[a.x] === 'x' && a.y > 5 && a.y < 19 && ![[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => lane.has(`${a.x + dx},${a.y + dy}`) && !(a.x + dx === p.x && a.y + dy === p.y)));
      if (free) { put(free.x, free.y, 'Y'); alcoves.push(free); }
    }
    // decoration on the walls
    for (let y = 6; y < 19; y++) for (let x = 1; x < SPIN_W - 1; x++) if (g[y][x] === 'x' && (x * 7 + y * 3) % 11 === 0 && g[y + 1]?.[x] === 'x' ) put(x, y, 'ϻ');
    return { tiles: g.map((r) => r.join('')), alcoves, pathLen: path.length, seed };
  }
  throw new Error('spinMaze: no seed found');
}
