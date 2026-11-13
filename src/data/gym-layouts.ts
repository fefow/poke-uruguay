import { rng } from './map-gen.ts';
import { applyPuzzle, type Puzzle } from './gym-puzzles.ts';
// Six gym floor plans (12x12), each also mirrored: twelve gyms, twelve different insides. The leader always waits at
// the far end; trainers stand where the player has to pass; the old guide stands near the entrance.
const TOP = 'xxxxxXZxxxxx';
const MAT = 'YYYYYmmYYYYY';
const L = 'YYYYYAAYYYYY';
const OPEN = 'YYYYYYYYYYYY';
const NN = 'NYYYYYYYYYYN';

const PLANS = [
  { // zig-zag: walls with alternating gaps
    tiles: [TOP, NN, L, 'xxxxxxxxxxYY', OPEN, 'YYxxxxxxxxxx', OPEN, 'xxxxxxxxxxYY', OPEN, 'YYxxxxxxxxxx', L, MAT],
    trainers: [{ x: 7, y: 8, dir: 'left' }, { x: 4, y: 4, dir: 'right' }], guide: { x: 8, y: 10 },
  },
  { // two side blocks with a central corridor
    tiles: [TOP, NN, L, OPEN, 'YxxxxYYxxxxY', 'YxNNxYYxNNxY', 'YxNNxYYxNNxY', 'YxxxxYYxxxxY', OPEN, 'YxxYYYYYYxxY', L, MAT],
    trainers: [{ x: 5, y: 5, dir: 'down' }, { x: 2, y: 8, dir: 'right' }], guide: { x: 9, y: 10 },
  },
  { // ring around a solid centre
    tiles: [TOP, NN, L, OPEN, 'YYxxxxxxxxYY', 'YYxxxxxxxxYY', 'YYxxxxxxxxYY', 'YYxxxxxxxxYY', 'YYxxxxxxxxYY', OPEN, L, MAT],
    trainers: [{ x: 1, y: 5, dir: 'down' }, { x: 10, y: 7, dir: 'up' }], guide: { x: 3, y: 9 },
  },
  { // side rooms off a central hall
    tiles: [TOP, NN, L, OPEN, 'xxxxYYYYxxxx', 'YYYxYYYYxYYY', 'YYYxYYYYxYYY', 'YYYxYYYYxYYY', OPEN, OPEN, L, MAT],
    trainers: [{ x: 1, y: 6, dir: 'down' }, { x: 10, y: 6, dir: 'down' }], guide: { x: 6, y: 9 },
  },
  { // forest of pillars
    tiles: [TOP, NN, L, 'YNYYNYYNYYNY', OPEN, 'YYNYYNYYNYYY', OPEN, 'YNYYNYYNYYNY', OPEN, 'YYNYYNYYNYYY', L, MAT],
    trainers: [{ x: 3, y: 4, dir: 'right' }, { x: 8, y: 6, dir: 'left' }], guide: { x: 10, y: 8 },
  },
  { // cross-shaped hall
    tiles: [TOP, NN, L, OPEN, 'xxxYYYYYYxxx', 'xxxYYYYYYxxx', OPEN, OPEN, 'xxxYYYYYYxxx', 'xxxYYYYYYxxx', L, MAT],
    trainers: [{ x: 1, y: 6, dir: 'right' }, { x: 10, y: 7, dir: 'left' }], guide: { x: 6, y: 4 },
  },
];
/**
 * Correo Uruguayo (Mercedes): a mail sorting centre, 26x20. The player walks the belt lanes of the sorting floor in
 * a zig-zag between rows of pigeonhole shelves ('ϊ'), past parcels ('ϋ') and two postal workers, to the director's office.
 */
function correoPlan() {
  const W = 26, H = 20;
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('x'));
  const rect = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = c; };
  rect(8, 1, 17, 4, 'Y'); rect(12, 1, 13, 4, 'A'); g[1][8] = 'N'; g[1][17] = 'N'; g[4][8] = 'N'; g[4][17] = 'N'; // director's office
  g[0][12] = 'X'; g[0][13] = 'Z';
  rect(11, 5, 14, 5, 'Y');                                      // office door
  rect(1, 6, 24, 14, 'Y');                                      // sorting floor
  for (const y of [7, 10, 13]) rect(1, y, 24, y, 'ΐ');           // belts (the lanes)
  rect(1, 8, 24, 9, 'ϊ'); rect(3, 8, 4, 9, 'ΐ');                 // shelves with a gap on the left
  rect(1, 11, 24, 12, 'ϊ'); rect(21, 11, 22, 12, 'ΐ');           // shelves with a gap on the right
  for (const [x, y] of [[1, 7], [24, 7], [1, 10], [24, 10], [1, 13], [24, 13], [7, 6], [18, 6], [6, 14], [19, 14]]) g[y][x] = 'ϋ';
  rect(8, 15, 17, 18, 'Y'); rect(12, 15, 13, 18, 'A');          // reception hall
  for (const [x, y] of [[8, 15], [17, 15], [8, 18], [17, 18], [10, 16], [15, 16]]) g[y][x] = 'ϋ';
  g[19][12] = 'm'; g[19][13] = 'm';
  return {
    tiles: g.map((r) => r.join('')),
    leader: { x: 12, y: 2 },
    trainers: [{ x: 15, y: 10, dir: 'right' }, { x: 17, y: 7, dir: 'left' }],
    guide: { x: 10, y: 17 },
  };
}

/**
 * OSE (Maldonado), a water treatment plant 28x20: a big tank with a catwalk across it ('Ϲ'). The way to the
 * director's office goes over the catwalk or around the tank by either side; valves and pipes crowd the walls.
 */
function osePlan() {
  const W = 28, H = 20;
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('x'));
  const rect = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = c; };
  rect(10, 1, 17, 4, 'Y'); rect(13, 1, 14, 4, 'A'); for (const [x, y] of [[10, 1], [17, 1], [10, 4], [17, 4]]) g[y][x] = 'N';
  g[0][13] = 'X'; g[0][14] = 'Z';
  rect(12, 5, 15, 5, 'Y');
  rect(1, 6, 26, 17, 'Y');
  rect(8, 8, 19, 14, 'ϸ'); rect(13, 8, 14, 14, 'Ϲ');           // the tank and the catwalk across it
  rect(1, 8, 7, 8, 'ϸ'); rect(20, 8, 26, 8, 'ϸ');                // a canal on each side closes the pockets where the valves are: the catwalk is the only way north
  for (let x = 2; x < 10; x++) g[5][x] = 'ϻ'; for (let x = 18; x < 26; x++) g[5][x] = 'ϻ';
  for (const [x, y] of [[2, 14], [25, 14], [6, 16], [21, 16], [4, 11], [23, 11]]) g[y][x] = 'ϼ';
  rect(10, 18, 17, 18, 'Y');
  g[19][13] = 'm'; g[19][14] = 'm';
  // three sluice gates across the catwalk; four valves around the tank move them in pairs
  const gate = (id, y) => ({ id, tiles: [[13, y], [14, y]] as [number, number][], closed: 'Ӽ', open: 'Ϲ' });
  const puzzle: Puzzle = {
    gates: [gate('A', 9), gate('B', 11), gate('C', 13)],
    levers: [{ id: 'v1', x: 6, y: 10, flips: ['A', 'B'] }, { id: 'v2', x: 21, y: 10, flips: ['B', 'C'] }, { id: 'v3', x: 6, y: 13, flips: ['C'] }, { id: 'v4', x: 21, y: 13, flips: ['A'] }],
    goal: [13, 5],
    use: ['Giraste la válvula. Se oye correr agua por las cañerías.', 'Cerraste la válvula. El agua deja de correr.'],
    hint: ['Las compuertas de la pasarela están cerradas. Cada válvula del contorno del tanque mueve más de una.'],
  };
  return {
    tiles: g.map((r) => r.join('')),
    leader: { x: 13, y: 2 },
    trainers: [{ x: 9, y: 16, dir: 'up' }, { x: 17, y: 7, dir: 'left' }],
    guide: { x: 5, y: 16 },
    puzzle,
  };
}


type GymPlan = { puzzle?: Puzzle; tiles: string[]; leader: { x: number; y: number; dir?: string }; trainers: { x: number; y: number; dir: string }[]; guide: { x: number; y: number } };
const blank = (W = 28, H = 20) => {
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('x'));
  const rect = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) g[y][x] = c; };
  /** the director's room at the top: carpet down the middle, pillars at the corners, banners over it, a door below */
  const office = (x1 = 10, x2 = 17, doorX1 = 12, doorX2 = 15) => {
    rect(x1, 1, x2, 4, 'Y'); rect(13, 1, 14, 4, 'A'); for (const [x, y] of [[x1, 1], [x2, 1], [x1, 4], [x2, 4]]) g[y][x] = 'N';
    g[0][13] = 'X'; g[0][14] = 'Z'; rect(doorX1, 5, doorX2, 5, 'Y');
  };
  const mat = (x = 13) => { g[19][x] = 'm'; g[19][x + 1] = 'm'; };
  return { g, rect, office, mat, out: () => g.map((r) => r.join('')) };
};

/**
 * Centro Toxicológico (Fray Bentos, veneno; the plan keeps the id `anglo`): a lab of teleport crates of reagents. Every room is sealed; each holds three crates (red, blue,
 * yellow) that send the visitor to another room. Only one crate per room moves you forward; the director's office has no
 * door at all and can only be reached by the last crate of the chain. Two trainers stand next to crates.
 */
const ANGLO_CHAIN = ['Ϟ', 'Ϛ', 'Ϝ', 'Ϝ', 'Ϟ', 'Ϛ']; // lobby, then R5, R3, R1, R4, R2: the colour that moves forward in each
function angloPlan(id = 'gym_frb'): GymPlan & { warps: any[] } {
  const { g, rect, mat, out } = blank();
  type Room = { x1: number; y1: number; x2: number; y2: number };
  const rooms: Room[] = [
    { x1: 10, y1: 14, x2: 17, y2: 18 }, // lobby
    { x1: 2, y1: 15, x2: 8, y2: 18 },   // R5
    { x1: 2, y1: 9, x2: 8, y2: 13 },    // R3
    { x1: 2, y1: 2, x2: 8, y2: 7 },     // R1
    { x1: 19, y1: 9, x2: 25, y2: 13 },  // R4
    { x1: 19, y1: 2, x2: 25, y2: 7 },   // R2
  ];
  const office: Room = { x1: 10, y1: 1, x2: 17, y2: 5 };
  for (const r of [...rooms, office]) rect(r.x1, r.y1, r.x2, r.y2, 'Y');
  rect(13, 1, 14, 5, 'A'); g[0][13] = 'X'; g[0][14] = 'Z';
  for (const [x, y] of [[10, 1], [17, 1], [10, 5], [17, 5]]) g[y][x] = 'N';
  mat();
  [[10, 18, 'Ϯ'], [17, 18, 'Ϯ'], [3, 16, 'ϯ'], [7, 11, 'Ϯ'], [20, 11, 'ϯ'], [24, 4, 'Ϯ'], [4, 4, 'ϯ'], [10, 14, 'ϯ'], [17, 14, 'ϯ'], [2, 13, 'ϼ'], [25, 9, 'ϼ'], [8, 7, 'Ϯ'], [19, 7, 'Ϯ']].forEach(([x, y, c]: any) => { g[y][x] = c; });
  rect(13, 15, 14, 18, 'A');                                       // red runner in the lobby
  const land = (r: Room) => ({ x: r.x1 + ((r.x2 - r.x1) >> 1), y: r.y2 });
  const warps: any[] = [];
  const pads: { x: number; y: number }[][] = [];
  rooms.forEach((r, k) => {
    const cx = r.x1 + ((r.x2 - r.x1) >> 1), py = r.y1 + 1;
    const xs = [r.x1 + 1, cx, r.x2 - 1];
    // a different arrangement of colours in each room, so a position never means the same thing twice
    const order = [['Ϛ', 'Ϝ', 'Ϟ'], ['Ϝ', 'Ϟ', 'Ϛ'], ['Ϟ', 'Ϛ', 'Ϝ'], ['Ϝ', 'Ϛ', 'Ϟ'], ['Ϟ', 'Ϝ', 'Ϛ'], ['Ϛ', 'Ϟ', 'Ϝ']][(k * 5 + 2) % 6];
    pads[k] = [];
    order.forEach((c, j) => {
      const x = xs[j]; g[py][x] = c; pads[k].push({ x, y: py });
      const good = c === ANGLO_CHAIN[k];
      const dest = good ? (k === 5 ? office : rooms[k + 1]) : (j === 1 && k > 1 ? rooms[k - 1] : rooms[0]);
      const l = good && k === 5 ? { x: 13, y: 5 } : land(dest);
      warps.push({ x, y: py, to: id, tx: l.x, ty: l.y });
    });
  });
  g[5][11] = 'Ϟ'; warps.push({ x: 11, y: 5, to: id, tx: 13, ty: 17 }); // the way out of the office
  return {
    tiles: out(), leader: { x: 13, y: 2 }, warps,
    trainers: [{ x: pads[3][1].x - 1, y: pads[3][1].y, dir: 'right' }, { x: pads[4][2].x - 1, y: pads[4][2].y, dir: 'right' }],
    guide: { x: 12, y: 17 },
  };
}

/**
 * Quiroga (Salto, psíquico): the writer's library. Four long reading aisles, two tiles high, are split by shelf walls
 * that each have a single one-tile gap, alternating right and left, so the way to the study goes back and forth. A
 * trainer stands in front of the first two gaps, so there is no way past them without being seen.
 */
function quirogaPlan(): GymPlan {
  const { g, rect, office, out } = blank();
  office();
  rect(1, 6, 26, 7, 'Y'); rect(1, 9, 26, 10, 'Y'); rect(1, 12, 26, 13, 'Y'); rect(1, 15, 26, 16, 'Y'); // aisles
  rect(1, 8, 26, 8, 'ϻ'); rect(1, 11, 26, 11, 'ϻ'); rect(1, 14, 26, 14, 'ϻ');                           // shelves
  g[8][24] = 'Y'; g[11][3] = 'Y'; g[14][24] = 'Y';                                                         // the gaps
  rect(10, 17, 17, 18, 'Y'); g[19][13] = 'm'; g[19][14] = 'm';
  for (const [x, y] of [[8, 6], [16, 6], [20, 7], [7, 10], [15, 9], [21, 10], [8, 13], [16, 12], [12, 16], [20, 15], [5, 16]]) g[y][x] = 'ϼ';     // reading desks
  for (let x = 2; x < 10; x++) if (g[5][x] === 'x') g[5][x] = 'ϻ'; for (let x = 18; x < 26; x++) if (g[5][x] === 'x') g[5][x] = 'ϻ';
  // book carts ('ӽ') plug each gap and jam the aisles: they are pushed, never pulled
  for (const [x, y] of [[24, 14], [3, 11], [24, 8], [21, 12], [21, 13], [18, 6], [18, 7], [6, 9], [6, 10]]) g[y][x] = 'ӽ';
  const puzzle: Puzzle = { gates: [], levers: [], goal: [13, 5], hint: ['Los carros de libros se empujan, no se tiran. Si uno queda contra la pared, salí y volvé a entrar: la biblioteca se acomoda sola.'] };
  return { tiles: out(), leader: { x: 13, y: 2 }, trainers: [{ x: 14, y: 16, dir: 'left' }, { x: 12, y: 10, dir: 'right' }], guide: { x: 11, y: 18 }, puzzle };
}


/** Defensa (Rivera, lucha): an army training course; sandbags and dummies scattered over a long parade ground. */
function defensaPlan(): GymPlan {
  const { g, rect, office, mat, out } = blank();
  office(); rect(1, 6, 26, 17, 'Y'); rect(10, 18, 17, 18, 'Y');
  // two guard posts cut the parade ground: sandbag walls with a boom barrier that rises when the guard loses
  for (const y of [8, 12]) { rect(1, y, 26, y, 'ϼ'); rect(12, y, 15, y, 'Ԙ'); }
  for (const [x, y] of [[4, 14], [8, 16], [20, 15], [23, 14], [5, 10], [22, 10], [8, 6], [19, 7], [3, 7]]) g[y][x] = 'ϼ';
  for (let x = 2; x < 26; x += 3) g[5][x] = 'ϻ';
  mat();
  const gate = (id, y, k) => ({ id, tiles: [12, 13, 14, 15].map((x) => [x, y] as [number, number]), closed: 'Ԙ', open: 'Y', beaten: [k] });
  const puzzle: Puzzle = { gates: [gate('P1', 12, 0), gate('P2', 8, 1)], levers: [], goal: [13, 5], hint: ['Cada puesto tiene su barrera y su guardia. La barrera sube cuando el guardia pierde.'] };
  return { tiles: out(), leader: { x: 13, y: 2 }, trainers: [{ x: 10, y: 14, dir: 'right' }, { x: 17, y: 10, dir: 'left' }], guide: { x: 4, y: 17 }, puzzle };
}


/** MGAP (Tacuarembó, planta): a greenhouse with six long planting beds and watering barrels at the corners. */
function mgapPlan(): GymPlan {
  const { g, rect, office, mat, out } = blank();
  office(); rect(1, 6, 26, 17, 'Y'); rect(10, 18, 17, 18, 'Y');
  for (const y of [8, 12]) for (const x of [2, 11, 20]) rect(x, y, x + 5, y + 1, 'ϸ');
  for (const [x, y] of [[1, 6], [26, 6], [1, 17], [26, 17], [9, 16], [18, 16]]) g[y][x] = 'ϼ';
  for (let x = 2; x < 26; x += 3) g[5][x] = 'ϻ';
  mat();
  // a dry vine wall closes the middle of the greenhouse; three irrigation taps (two in the south, one in the north) bring it back to life
  const row = (y) => Array.from({ length: 26 }, (_, i) => [i + 1, y] as [number, number]);
  const puzzle: Puzzle = {
    gates: [{ id: 'V1', tiles: row(10), closed: 'ԗ', open: 'Y', allLevers: ['t1', 't2'] }, { id: 'V2', tiles: [12, 13, 14, 15].map((x) => [x, 5] as [number, number]), closed: 'ԗ', open: 'Y', allLevers: ['t3'] }],
    levers: [{ id: 't1', x: 1, y: 15, flips: [] }, { id: 't2', x: 26, y: 15, flips: [] }, { id: 't3', x: 9, y: 7, flips: [] }],
    goal: [13, 5],
    use: ['Abriste la llave de riego. El agua corre por los canteros.', 'Cerraste la llave de riego.'],
    hint: ['El invernadero está seco: las enredaderas cierran el paso y se marchitan con el riego. Las llaves de paso están lejos unas de otras.'],
  };
  return { tiles: out(), leader: { x: 13, y: 2 }, trainers: [{ x: 9, y: 11, dir: 'right' }, { x: 18, y: 14, dir: 'left' }], guide: { x: 4, y: 15 }, puzzle };
}


/** Lavalleja (Treinta y Tres, roca): a quarry cut by a river. One stone bridge joins the bank where you arrive with the far bank. */
function lavallejaPlan(): GymPlan {
  const { g, rect, out } = blank();
  rect(17, 1, 24, 4, 'Y'); rect(20, 1, 21, 4, 'A'); for (const [x, y] of [[17, 1], [24, 1], [17, 4], [24, 4]]) g[y][x] = 'N';
  g[0][20] = 'X'; g[0][21] = 'Z';
  rect(19, 5, 22, 5, 'Y');
  rect(1, 6, 26, 17, 'Y'); rect(12, 6, 14, 17, 'ϸ');                 // the river cuts the quarry in two
  rect(4, 18, 9, 18, 'Y'); g[19][6] = 'm'; g[19][7] = 'm';
  for (const [x, y] of [[2, 7], [3, 15], [8, 16], [16, 8], [24, 7], [17, 15], [22, 12], [25, 16], [19, 9], [26, 11]]) g[y][x] = 'ϼ';
  for (let x = 2; x < 26; x += 3) if (g[5][x] === 'x') g[5][x] = 'ϻ';
  // granite blocks ('Ӿ') on the west bank: pushed into the river they fill a tile; three in a row make a crossing
  // they travel along a lane (rows 9-10) walled in by boulders: row 10 lets the player walk beside them
  rect(2, 8, 11, 8, 'ϼ'); rect(2, 11, 11, 11, 'ϼ');
  for (const [x, y] of [[3, 9], [5, 9], [7, 9], [9, 9]]) g[y][x] = 'Ӿ';
  const puzzle: Puzzle = { gates: [], levers: [], goal: [20, 5], hint: ['Los bloques de granito se empujan hacia el río y lo rellenan de a una casilla. El río es ancho: un solo bloque no alcanza.'] };
  return { tiles: out(), leader: { x: 20, y: 2 }, trainers: [{ x: 9, y: 13, dir: 'right' }, { x: 20, y: 10, dir: 'left' }], guide: { x: 3, y: 17 }, puzzle };
}


/** Boiso (Florida, volador): an airfield hangar; engines and fuselages stand in two rows beside a marked runway. */
function boisoPlan(): GymPlan {
  const { g, rect, office, mat, out } = blank();
  office(); rect(1, 6, 26, 17, 'Y'); rect(10, 18, 17, 18, 'Y');
  rect(12, 6, 15, 17, 'Ϲ');
  // three hangar walls cut the field; each is crossed on the runway through a spinning propeller
  for (const y of [9, 12, 15]) { rect(1, y, 26, y, 'ϻ'); rect(12, y, 15, y, 'Ԗ'); }
  for (const [x, y] of [[3, 7], [7, 10], [20, 10], [24, 7], [4, 13], [22, 13], [8, 16], [21, 16]]) { g[y][x] = 'ϼ'; g[y][x + 1] = 'ϼ'; }
  for (let x = 2; x < 26; x += 3) g[5][x] = 'ϻ';
  mat();
  const gate = (id, y, ph) => ({ id, tiles: [12, 13, 14, 15].map((x) => [x, y] as [number, number]), closed: 'Ԗ', open: 'Ϲ', closedPhases: [ph] });
  const puzzle: Puzzle = { gates: [gate('H1', 15, 0), gate('H2', 12, 1), gate('H3', 9, 0)], levers: [], period: 6, phases: 2, goal: [13, 5], hint: ['Las hélices giran por turnos: cuando una frena, la otra arranca. Se cruza entre una y otra.'] };
  return { tiles: out(), leader: { x: 13, y: 2 }, trainers: [{ x: 9, y: 10, dir: 'right' }, { x: 20, y: 13, dir: 'left' }], guide: { x: 22, y: 17 }, puzzle };
}


/** ANCAP (Durazno, fuego): a refinery. The floor is molten metal; the way through is a snaking steel walkway. */
function ancapPlan(): GymPlan {
  const { g, rect, office, mat, out } = blank();
  office(); rect(1, 6, 26, 17, 'ϸ'); rect(10, 18, 17, 18, 'Y');
  for (const [a, b, c, d] of [[12, 16, 15, 17], [3, 16, 15, 17], [3, 12, 4, 17], [3, 12, 24, 13], [23, 8, 24, 13], [5, 8, 24, 9], [5, 6, 6, 9], [5, 6, 15, 7]]) rect(a, b, c, d, 'Ϲ');
  for (let x = 2; x < 26; x += 3) g[5][x] = 'ϻ';
  mat();
  // fire jets cross the walkway in three places; valves beside it close one jet and open another
  const jet = (id, tiles, init) => ({ id, tiles: tiles as [number, number][], closed: 'ӿ', open: 'Ϲ', init: init as 'open' | 'closed' });
  const puzzle: Puzzle = {
    gates: [jet('G1', [[3, 14], [4, 14]], 'closed'), jet('G2', [[23, 10], [24, 10]], 'open'), jet('G3', [[5, 8], [6, 8]], 'closed')],
    levers: [{ id: 'k1', x: 2, y: 16, flips: ['G1', 'G2'] }, { id: 'k2', x: 18, y: 14, flips: ['G2', 'G3'] }, { id: 'k3', x: 14, y: 10, flips: ['G1', 'G3'] }],
    goal: [13, 5],
    use: ['Giraste la válvula. Se oye correr gas por los caños.', 'Volviste la válvula a su lugar. Se oye correr gas por los caños.'],
    hint: ['Cada válvula cierra un chorro y abre otro. Mirá antes de girarla: hay chorros que ya están abiertos.'],
  };
  return { tiles: out(), leader: { x: 13, y: 2 }, trainers: [{ x: 14, y: 13, dir: 'left' }, { x: 9, y: 8, dir: 'right' }], guide: { x: 4, y: 17 }, puzzle };
}


/** INAVI (Canelones, bicho): a vineyard hedge maze, different every gym but always solvable; trainers wait at junctions. */
function inaviPlan(): GymPlan {
  const { g, rect, office, mat, out } = blank();
  office(9, 16, 11, 12); rect(1, 6, 26, 17, 'ϸ');
  const NC = 8, NR = 4, ox = 2, oy = 6;
  const rand = rng('inavi-maze');
  const seen = new Set<number>(); const parent = new Map<number, number>();
  const key = (i, j) => j * NC + i;
  const start: [number, number] = [3, NR - 1];
  const stack: [number, number][] = [start]; seen.add(key(...start));
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const nx = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]).map(([dx, dy]) => [i + dx, j + dy] as [number, number]).filter(([a, b]) => a >= 0 && a < NC && b >= 0 && b < NR && !seen.has(key(a, b)));
    if (!nx.length) { stack.pop(); continue; }
    const n = nx[Math.floor(rand() * nx.length)];
    seen.add(key(...n)); parent.set(key(...n), key(i, j)); stack.push(n);
  }
  const cell = (k) => [k % NC, Math.floor(k / NC)] as [number, number];
  for (let k = 0; k < NC * NR; k++) { const [i, j] = cell(k); rect(ox + 3 * i, oy + 3 * j, ox + 3 * i + 1, oy + 3 * j + 1, 'Y'); }
  for (const [c, p] of parent) {
    const [ci, cj] = cell(c), [pi, pj] = cell(p);
    if (ci !== pi) rect(ox + 3 * Math.min(ci, pi) + 2, oy + 3 * cj, ox + 3 * Math.min(ci, pi) + 2, oy + 3 * cj + 1, 'Y');
    else rect(ox + 3 * ci, oy + 3 * Math.min(cj, pj) + 2, ox + 3 * ci + 1, oy + 3 * Math.min(cj, pj) + 2, 'Y');
  }
  // the exit cell (top row, under the office door) and the way to it
  const exit: [number, number] = [3, 0];
  const route: number[] = []; for (let k: number | undefined = key(...exit); k !== undefined; k = parent.get(k)) route.unshift(k);
  rect(ox + 3 * 3, 5, ox + 3 * 3 + 1, 5, 'Y');
  rect(10, 18, 17, 18, 'Y'); rect(ox + 3 * 3, 17, ox + 3 * 3 + 1, 18, 'Y'); g[19][ox + 9] = 'm'; g[19][ox + 10] = 'm';
  // insect habitat: hedges with grapes, flowers and cobwebs, bee hives and giant mushrooms (all solid, same as the hedge they replace)
  const deco = rng('inavi-habitat');
  for (let y = 6; y <= 17; y++) for (let x = 1; x <= 26; x++) if (g[y][x] === 'ϸ') { const d = deco(); g[y][x] = d < 0.14 ? 'Ұ' : d < 0.26 ? 'ұ' : d < 0.32 ? 'Ҳ' : d < 0.36 ? 'ҳ' : d < 0.4 ? 'Ҵ' : 'ϸ'; }
  for (const [x, y] of [[2, 18], [25, 18]]) g[y][x] = 'ҳ';
  for (const [x, y] of [[4, 2], [5, 3], [22, 2], [21, 3], [6, 1], [20, 1]]) g[y][x] = 'N';
  const spot = (n: number) => { const [i, j] = cell(route[Math.min(route.length - 1, Math.max(1, Math.floor((route.length * n))))]); return { x: ox + 3 * i, y: oy + 3 * j }; };
  const t1 = spot(0.35), t2 = spot(0.7);
  // swarms plug some of the connectors along the route, taking turns: every 10 steps the closed ones open and the others close
  const link = (k: number) => {
    const [ci, cj] = cell(route[k + 1]), [pi, pj] = cell(route[k]);
    return ci !== pi ? [0, 1].map((d) => [ox + 3 * Math.min(ci, pi) + 2, oy + 3 * cj + d] as [number, number]) : [0, 1].map((d) => [ox + 3 * ci + d, oy + 3 * Math.min(cj, pj) + 2] as [number, number]);
  };
  const swarmLinks = [1, 3, 5, 7].filter((k) => k + 1 < route.length - 1);
  const puzzle: Puzzle = {
    gates: swarmLinks.map((k, n) => ({ id: `S${n}`, tiles: link(k), closed: 'ԕ', open: 'Y', closedPhases: [n % 2] })),
    levers: [], period: 10, phases: 2, goal: [ox + 9, 5],
    hint: ['Los enjambres cambian de pasillo cada tanto: lo que está cerrado ahora se abre enseguida. Con paciencia se cruza.'],
  };
  return { tiles: out(), leader: { x: 13, y: 2 }, trainers: [{ ...t1, dir: 'down' }, { ...t2, dir: 'down' }], guide: { x: 13, y: 18 }, puzzle };
}

/** UTE (Montevideo, eléctrico): the power station. A live transformer hub in the middle; the ring around it is the only way, with generators at the corners. */
function utePlan(): GymPlan {
  const { g, rect, office, mat, out } = blank();
  office(); rect(1, 6, 26, 17, 'Y'); rect(10, 18, 17, 18, 'Y');
  rect(9, 8, 18, 14, 'ϸ');
  rect(12, 6, 15, 7, 'Ϲ'); rect(12, 15, 15, 17, 'Ϲ'); rect(3, 6, 3, 17, 'Ϲ'); rect(24, 6, 24, 17, 'Ϲ');
  for (const [x, y] of [[1, 6], [26, 6], [1, 17], [26, 17], [6, 9], [6, 14], [21, 9], [21, 14]]) { g[y][x] = 'ϼ'; }
  for (let x = 2; x < 26; x += 2) g[5][x] = 'ϻ';
  mat();
  // the armoured door of the director's office opens only with the four lamps above it lit; four breakers switch the lamps in pairs
  const lamp = (id, x) => ({ id, tiles: [[x, 5]] as [number, number][], closed: 'ԓ', open: 'Ԕ' });
  const puzzle: Puzzle = {
    gates: [lamp('L1', 9), lamp('L2', 10), lamp('L3', 17), lamp('L4', 18),
      { id: 'D', tiles: [12, 13, 14, 15].map((x) => [x, 5] as [number, number]), closed: 'Ӽ', open: 'Y', allGates: ['L1', 'L2', 'L3', 'L4'] }],
    levers: [{ id: 'b1', x: 2, y: 9, flips: ['L1', 'L2'] }, { id: 'b2', x: 25, y: 9, flips: ['L2', 'L3'] }, { id: 'b3', x: 2, y: 14, flips: ['L3', 'L4'] }, { id: 'b4', x: 25, y: 14, flips: ['L4', 'L1'] }],
    goal: [13, 5],
    use: ['Subiste la llave del tablero. Se oye un zumbido y algunas luces cambian.', 'Bajaste la llave del tablero. Se oye un zumbido y algunas luces cambian.'],
    hint: ['La puerta blindada de la oficina se abre con las cuatro luces prendidas. Cada tablero cambia dos luces vecinas.'],
  };
  return { tiles: out(), leader: { x: 13, y: 2 }, trainers: [{ x: 24, y: 7, dir: 'down' }, { x: 3, y: 7, dir: 'down' }], guide: { x: 10, y: 17 }, puzzle };
}

const FLIP = { left: 'right', right: 'left', up: 'up', down: 'down' };

/** Re-lay a gym interior with plan `i` (0-11): plans 6-11 are the mirror images of 0-5. */
export function layoutGym(m, i, id = '') {
  const made = ({ correo: correoPlan, ose: osePlan, anglo: angloPlan, quiroga: quirogaPlan, defensa: defensaPlan, mgap: mgapPlan, lavalleja: lavallejaPlan, boiso: boisoPlan, ancap: ancapPlan, inavi: inaviPlan, ute: utePlan } as Record<string, () => any>)[(m.npcs ?? []).find((n) => n.leader)?.leader];
  const bespoke = !!made;
  const plan = made ? (made as any)(id) : PLANS[i % PLANS.length];
  if ((plan as any).warps) m.warps = (plan as any).warps;
  const mirror = !bespoke && i >= PLANS.length;
  const fx = (x) => (mirror ? 11 - x : x);
  const lead = (plan as any).leader ?? { x: 5, y: 2 };
  m.tiles = plan.tiles.map((r) => (mirror ? [...r].reverse().join('') : r));
  const trainers = (m.npcs ?? []).filter((n) => n.trainer);
  const leader = (m.npcs ?? []).find((n) => n.script === 'leader');
  const guide = (m.npcs ?? []).find((n) => !n.trainer && n.script !== 'leader');
  if (leader) { leader.x = lead.x; leader.y = lead.y; if (lead.dir) leader.dir = lead.dir; }
  trainers.forEach((n, k) => { const s = plan.trainers[k % plan.trainers.length]; n.x = fx(s.x); n.y = s.y; n.dir = mirror ? FLIP[s.dir] : s.dir; });
  if (guide) { guide.x = fx(plan.guide.x); guide.y = plan.guide.y; }
  // this gym's mechanism: the guide at the door tells what it is (never how to solve it), barriers wait for their guard
  const pz = (plan as any).puzzle as Puzzle | undefined;
  if (pz) {
    const ids = trainers.map((n) => n.trainer.id);
    m.puzzle = { ...pz, gates: pz.gates.map((g) => (g.beaten ? { ...g, beatenIds: g.beaten.map((k) => ids[k]).filter(Boolean) } : g)) };
    applyPuzzle(m.tiles, m.puzzle, { on: new Set(), steps: 0, beaten: () => false });
    if (guide && pz.hint) guide.text = [...(Array.isArray(guide.text) ? guide.text : [guide.text]), ...pz.hint];
    else if (pz.hint) (m.npcs ??= []).push({ x: plan.guide.x, y: plan.guide.y, look: 'oldman', dir: 'down', text: pz.hint });
  }
}
