// Mecanismos de los gimnasios. Cada gimnasio tiene un recorrido propio hasta el líder:
//  - compuertas y válvulas (OSE, ANCAP), tablero de luces (UTE), carros y bloques que se empujan (Quiroga, Lavalleja),
//    barreras que suben al vencer al guardia (Defensa), riego que seca las enredaderas (MGAP) y obstáculos que cambian
//    cada tantos pasos (INAVI con enjambres, Boiso con hélices).
// El estado de un gimnasio vive solo mientras se está adentro: al salir y volver a entrar todo vuelve a empezar, así que
// un carro atascado nunca deja a nadie encerrado. Las reglas son puras para que las pruebas simulen el mismo recorrido.
export type Gate = {
  id: string; tiles: [number, number][];
  closed: string; open?: string; init?: 'open' | 'closed';
  beaten?: number[];          // se abre al vencer a estos entrenadores (índice en el gimnasio)
  beatenIds?: string[];       // los mismos, ya resueltos a ids (lo completa layoutGym)
  allLevers?: string[];       // se abre con todas estas palancas activadas
  allGates?: string[];        // se abre con todas estas compuertas abiertas
  closedPhases?: number[];    // cerrada durante estas fases del reloj de pasos
};
export type Lever = { id: string; x: number; y: number; flips: string[] };
export type Puzzle = {
  gates: Gate[]; levers: Lever[];
  period?: number; phases?: number;     // reloj: cada `period` pasos cambia la fase (de `phases`)
  goal: [number, number];               // casilla que alcanza el líder (pruebas)
  hint?: string[];                      // lo que cuenta el guía de la entrada
  use?: [string, string];               // mensaje al accionar una palanca (encendida, apagada)
};
export type PuzzleState = { on: Set<string>; steps: number; beaten: (id: string) => boolean };

export const phaseOf = (p: Puzzle, steps: number) => (p.period ? Math.floor(steps / p.period) % (p.phases ?? 2) : 0);

export function gateOpen(p: Puzzle, g: Gate, st: PuzzleState): boolean {
  if (g.beatenIds) return g.beatenIds.every((id) => st.beaten(id));
  if (g.allLevers) return g.allLevers.every((id) => st.on.has(id));
  if (g.allGates) return g.allGates.every((id) => gateOpen(p, p.gates.find((o) => o.id === id)!, st));
  if (g.closedPhases) return !g.closedPhases.includes(phaseOf(p, st.steps));
  let flips = 0;
  for (const l of p.levers) if (st.on.has(l.id) && l.flips.includes(g.id)) flips++;
  return (g.init === 'open') !== (flips % 2 === 1);
}
export const leverChar = (on: boolean) => (on ? 'Ԓ' : 'ԑ');

/** Writes the current state of gates and levers into `rows` (mutates them). Returns true if something changed. */
export function applyPuzzle(rows: string[], p: Puzzle, st: PuzzleState): boolean {
  let changed = false;
  const put = (x: number, y: number, c: string) => { if (rows[y]?.[x] !== undefined && rows[y][x] !== c) { rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1); changed = true; } };
  for (const g of p.gates) { const ch = gateOpen(p, g, st) ? (g.open ?? 'Y') : g.closed; for (const [x, y] of g.tiles) put(x, y, ch); }
  for (const l of p.levers) put(l.x, l.y, leverChar(st.on.has(l.id)));
  return changed;
}

// ------------------------------------------------------------------------------------------------ simulation (tests)
const MOVES: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const PUSH = new Set(['ӽ', 'Ӿ']);
type Sim = { tiles: string[]; blocked: Set<string>; solid: (c: string) => boolean; puzzle: Puzzle; start: [number, number]; beatenAll?: boolean };

/** Levers and clock: breadth-first search over (position, levers, clock). Returns steps to the goal, or null, and whether
 *  every reachable state can still reach the goal (no soft lock). */
export function solveLevers(sim: Sim) {
  const { puzzle: p } = sim;
  const W = sim.tiles[0].length;
  const cyc = p.period ? p.period * (p.phases ?? 2) : 1;
  const ids = p.levers.map((l) => l.id);
  const rowsFor = new Map<string, string[]>();
  const grid = (mask: number, t: number) => {
    const ph = p.period ? Math.floor(t / p.period) : 0;
    const k = `${mask}/${ph}`;
    let r = rowsFor.get(k);
    if (!r) { r = sim.tiles.slice(); applyPuzzle(r, p, { on: new Set(ids.filter((_, i) => mask >> i & 1)), steps: ph * (p.period ?? 0), beaten: () => !!sim.beatenAll }); rowsFor.set(k, r); }
    return r;
  };
  const key = (x: number, y: number, m: number, t: number) => ((((y * W + x) * 64 + m) * cyc) + t);
  const start = key(sim.start[0], sim.start[1], 0, 0);
  const seen = new Map<number, number>([[start, 0]]);
  const rev = new Map<number, number[]>();
  const q = [start];
  const dec = (k: number) => { const t = k % cyc; k = (k - t) / cyc; const m = k % 64; k = (k - m) / 64; return [k % W, Math.floor(k / W), m, t]; };
  let goal: number | null = null;
  const link = (a: number, b: number) => { (rev.get(b) ?? rev.set(b, []).get(b)!).push(a); };
  for (let i = 0; i < q.length; i++) {
    const cur = q[i]; const [x, y, m, t] = dec(cur);
    const rows = grid(m, t);
    if (x === p.goal[0] && y === p.goal[1] && goal == null) goal = cur;
    const push = (nk: number) => { link(cur, nk); if (!seen.has(nk)) { seen.set(nk, seen.get(cur)! + 1); q.push(nk); } };
    for (const [dx, dy] of MOVES) {
      const nx = x + dx, ny = y + dy;
      const nm = rows[ny]?.[nx];
      if (nm === undefined) continue;
      const lv = p.levers.findIndex((l) => l.x === nx && l.y === ny);
      if (lv >= 0) { push(key(x, y, m ^ (1 << lv), t)); continue; }
      if (sim.solid(nm) || sim.blocked.has(`${nx},${ny}`)) continue;
      push(key(nx, ny, m, (t + 1) % cyc));
    }
  }
  const goals = [...seen.keys()].filter((k) => { const [x, y] = dec(k); return x === p.goal[0] && y === p.goal[1]; });
  const back = new Set(goals); const bq = [...goals];
  for (let i = 0; i < bq.length; i++) for (const a of rev.get(bq[i]) ?? []) if (!back.has(a)) { back.add(a); bq.push(a); }
  return { solved: goals.length > 0, steps: goals.length ? Math.min(...goals.map((k) => seen.get(k)!)) : null, softLock: [...seen.keys()].some((k) => !back.has(k)), states: seen.size };
}

/** Pushable blocks (all of one kind per gym): search over pushes; the player may walk freely between pushes (flood fill).
 *  Granite blocks pushed into the river (`ϸ`) fill that tile and disappear. */
export function solvePushes(sim: Sim, limit = 600000) {
  const { puzzle: p } = sim;
  const W = sim.tiles[0].length;
  const rows0 = sim.tiles.slice();
  applyPuzzle(rows0, p, { on: new Set(), steps: 0, beaten: () => !!sim.beatenAll });
  const init: number[] = [];
  let kind = 'ӽ';
  const base = rows0.map((r, y) => [...r].map((c, x) => { if (PUSH.has(c)) { init.push(y * W + x); kind = c; return 'Y'; } return c; }));
  init.sort((a, b) => a - b);
  const fillable = kind === 'Ӿ';
  const walk = (blocks: number[], filled: number[], x: number, y: number) => {
    const c = base[y]?.[x];
    if (c === undefined || sim.blocked.has(`${x},${y}`) || blocks.includes(y * W + x)) return false;
    return !sim.solid(c) || filled.includes(y * W + x);
  };
  const region = (blocks: number[], filled: number[], from: number) => {
    const seen = new Set([from]); const q = [from];
    for (let i = 0; i < q.length; i++) { const x = q[i] % W, y = Math.floor(q[i] / W); for (const [dx, dy] of MOVES) { const n = (y + dy) * W + x + dx; if (!seen.has(n) && walk(blocks, filled, x + dx, y + dy)) { seen.add(n); q.push(n); } } }
    return seen;
  };
  const startPl = sim.start[1] * W + sim.start[0];
  const goalPl = p.goal[1] * W + p.goal[0];
  const mk = (blocks: number[], filled: number[], pl: number) => { const r = region(blocks, filled, pl); return { blocks, filled, r, key: `${blocks.join(',')}|${filled.join(',')}|${Math.min(...r)}` }; };
  const first = mk(init, [], startPl);
  const seen = new Set([first.key]);
  let frontier = [first];
  for (let depth = 0; frontier.length && seen.size < limit; depth++) {
    const next: typeof frontier = [];
    for (const f of frontier) {
      if (f.r.has(goalPl)) return { solved: true, pushes: depth, states: seen.size };
      f.blocks.forEach((b, bi) => {
        const bx = b % W, by = Math.floor(b / W);
        for (const [dx, dy] of MOVES) {
          if (!f.r.has((by - dy) * W + bx - dx)) continue;
          const tx = bx + dx, ty = by + dy, ti = ty * W + tx;
          const fill = fillable && base[ty]?.[tx] === 'ϸ' && !f.filled.includes(ti);
          if (!fill && !walk(f.blocks, f.filled, tx, ty)) continue;
          const nb = f.blocks.slice(); const nf = f.filled.slice();
          if (fill) { nb.splice(bi, 1); nf.push(ti); nf.sort((a, c) => a - c); } else nb[bi] = ti;
          nb.sort((a, c) => a - c);
          const c = mk(nb, nf, b);
          if (!seen.has(c.key)) { seen.add(c.key); next.push(c); }
        }
      });
    }
    frontier = next;
  }
  return { solved: false, pushes: null, states: seen.size };
}
