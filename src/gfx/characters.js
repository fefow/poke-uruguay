// Pixel-template character sprites (player + NPCs), 16x16, 4 directions, 3 frames.

const DOWN = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '..oHHHHHHHHHHo..',
  '...osssssssso...',
  '...osesssseso...',
  '...osssssssso...',
  '....oSSSSSSo....',
  '..occcccccccco..',
  '.oscccccccccccso',
  '.osCccccccccCso.',
  '..oCCCCCCCCCCo..',
  '...opppoopppo...',
];
const UP = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '..oHHHHHHHHHHo..',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '....oSSSSSSo....',
  '..occcccccccco..',
  '.oscccccccccccso',
  '.osCccccccccCso.',
  '..oCCCCCCCCCCo..',
  '...opppoopppo...',
];
const SIDE = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhHHHHHHo.',
  '...ohhsssssso...',
  '...ohssssseso...',
  '...osssssssso...',
  '....oSSSSSSo....',
  '....occcccco....',
  '....occccsco....',
  '....occccCso....',
  '....oCCCCCCo....',
  '....opppppo.....',
];
const P_DOWN = [
  '.....oooooo.....',
  '....oHHHHHHo....',
  '...oHHHwwHHHo...',
  '...orrrrrrrro...',
  '...ohssssssho...',
  '...osesssseso...',
  '....osssssso....',
  '....oRRRRRRo....',
  '...osBccccBso...',
  '..osBBccccBBso..',
  '..osBccccccBso..',
  '...oCCCCCCCCo...',
  '...oppppppppo...',
  '...opppoopppo...',
];
const P_UP = [
  '.....oooooo.....',
  '....oHHHHHHo....',
  '...oHHHHHHHHo...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '....ohhhhhho....',
  '....oRRRRRRo....',
  '...osBBBBBBso...',
  '..osBBccccBBso..',
  '..osBBBBBBBBso..',
  '...oCBBBBBBCo...',
  '...oppppppppo...',
  '...opppoopppo...',
];
const P_SIDE = [
  '.....oooooo.....',
  '....oHHHHHHo....',
  '....oHHHHHHrro..',
  '....ohhssssso...',
  '....ohhssesso...',
  '....ohhssssso...',
  '.....oRRRRRo....',
  '....oBBocccco...',
  '....oBBosccso...',
  '....oBBosccso...',
  '.....oBoCCCCo...',
  '.....oppppppo...',
  '.....opppppo....',
  '.....opppppo....',
];
// Female player: same cap and jersey, hair over the shoulders, a ponytail and a short skirt.
const patch = (rows, edits) => {
  const out = rows.map((r) => r.split(''));
  for (const [x, y, k] of edits) out[y][x] = k;
  return out.map((r) => r.join(''));
};
const withRows = (rows, over) => rows.map((r, y) => over[y] ?? r);
const F_DOWN = withRows(patch(P_DOWN, [[4, 7, 'h'], [11, 7, 'h'], [4, 8, 'h'], [11, 8, 'h'], [3, 5, 'h'], [12, 5, 'h'], [3, 6, 'h'], [12, 6, 'h'], [3, 7, 'o'], [12, 7, 'o']]),
  { 11: '....oCCCCCCo....', 12: '..orrrrrrrrrro..', 13: '...orrrrrrrro...' });
const F_UP = withRows(patch(P_UP, [[4, 7, 'h'], [11, 7, 'h'], [7, 8, 'h'], [8, 8, 'h'], [7, 9, 'h'], [8, 9, 'h'], [7, 10, 'h'], [8, 10, 'h']]),
  { 11: '....oCBBBBCo....', 12: '..orrrrrrrrrro..', 13: '...orrrrrrrro...' });
const F_SIDE = withRows(patch(P_SIDE, [[3, 3, 'h'], [3, 4, 'h'], [3, 5, 'h'], [4, 6, 'h'], [3, 6, 'h'], [3, 7, 'h'], [4, 8, 'h']]),
  { 11: '....orrrrrrro...', 12: '....orrrrrro....', 13: '.....opppppo....' });

const LEGS = {
  down: [['...oppo..oppo...', '...obbo..obbo...'], ['...oppo..oppo...', '...obbo...oo....'], ['...oppo..oppo...', '....oo...obbo...']],
  up: [['...oppo..oppo...', '...obbo..obbo...'], ['...oppo..oppo...', '...obbo...oo....'], ['...oppo..oppo...', '....oo...obbo...']],
  side: [['....oppppo......', '....obbbbo......'], ['...oppo.oppo....', '...obbo.obbo....'], ['....oppppo......', '....obbbbo......']],
};

export const LOOKS = {
  // The player has its own silhouette: celeste cap and jersey, red scarf, orange backpack.
  player_m: { h: '#3a2a1a', H: '#6cb4ee', r: '#2a6aae', s: '#f2c8a0', S: '#d8a880', c: '#6cb4ee', C: '#3f86c8', w: '#ffffff', R: '#e0263a', B: '#e8a02a', p: '#22222e', b: '#f2f2f2' },
  player_f: { h: '#8a4a2a', H: '#6cb4ee', r: '#2a6aae', s: '#f2c8a0', S: '#d8a880', c: '#6cb4ee', C: '#3f86c8', w: '#ffffff', R: '#e0263a', B: '#e8a02a', p: '#22222e', b: '#f2f2f2' },
  rival: { h: '#2a2a3a', H: '#2a2a3a', s: '#e8b890', S: '#c89870', c: '#e0263a', C: '#a01a2a', p: '#2a2a2a', b: '#1a1a1a' },
  prof: { h: '#e8e8e8', H: '#e8e8e8', s: '#f2c8a0', S: '#d8a880', c: '#6cb4ee', C: '#3f86c8', p: '#5a4a3a', b: '#2a1a10' },
  mom: { h: '#5a2a1a', H: '#5a2a1a', s: '#f2c8a0', S: '#d8a880', c: '#e86a8a', C: '#b84a6a', p: '#5a5a8a', b: '#2a2a2a', long: true },
  nurse: { h: '#f2a0b8', H: '#ffffff', s: '#f2c8a0', S: '#d8a880', c: '#ffffff', C: '#f2a0b8', p: '#f2a0b8', b: '#ffffff', long: true },
  clerk: { h: '#3a2a1a', H: '#4a9a4a', s: '#e8b890', S: '#c89870', c: '#4a9a4a', C: '#2a6a2a', p: '#3a3a3a', b: '#1a1a1a' },
  gaucho: { h: '#1a1a1a', H: '#1a1a1a', s: '#c8946a', S: '#a8744a', c: '#a83a2a', C: '#6a2a1a', p: '#e8e0d0', b: '#3a2a1a' },
  grunt: { h: '#6a6a7a', H: '#4a4a5a', s: '#d8c8b8', S: '#a8988a', c: '#7a7a8a', C: '#4a4a5a', p: '#3a3a4a', b: '#1a1a1a' },
  boss: { h: '#d8d8e8', H: '#2a2a3a', s: '#e8c8a8', S: '#c8a888', c: '#2a2a3a', C: '#1a1a2a', p: '#2a2a3a', b: '#8a8aa0' },
  bruma: { h: '#b8a8d8', H: '#4a2a6a', s: '#e8c8a8', S: '#c8a888', c: '#7a4a9a', C: '#4a2a6a', p: '#2a1a3a', b: '#1a1020' },
  brumario: { h: '#e8e8f0', H: '#e8e8f0', s: '#e8c8a8', S: '#c8a888', c: '#2a2a3a', C: '#14141e', p: '#14141e', b: '#8a8aa0' },
  garua: { h: '#9aa8a8', H: '#2a4a4a', s: '#d8b898', S: '#b89878', c: '#3a7a7a', C: '#1e4a4a', p: '#1e2e2e', b: '#0e1a1a' },
  leader_gaucho: { h: '#e8e8e8', H: '#1a1a1a', s: '#c8946a', S: '#a8744a', c: '#8a2a2a', C: '#4a1a1a', p: '#e8e0d0', b: '#3a2a1a' },
  leader_fire: { h: '#c8402a', H: '#c8402a', s: '#d8a070', S: '#b88050', c: '#e8702a', C: '#a83a1a', p: '#3a2a2a', b: '#1a1210', long: true },
  leader_forest: { h: '#6a4a2a', H: '#3a6a3a', s: '#e8b890', S: '#c89870', c: '#4a8a3a', C: '#2f5a2a', p: '#5a4a2a', b: '#2a1a10' },
  leader_dojo: { h: '#2a1a1a', H: '#2a1a1a', s: '#f2c8a0', S: '#d8a880', c: '#f4f4f4', C: '#c8c8d0', p: '#f4f4f4', b: '#2a2a2a', long: true },
  leader_psy: { h: '#e8e8f0', H: '#e8e8f0', s: '#e8c8a8', S: '#c8a888', c: '#6a3a9a', C: '#3e2266', p: '#3e2266', b: '#1a1020' },
  leader_dark: { h: '#c8c8d8', H: '#c8c8d8', s: '#e8d0c8', S: '#c8b0a8', c: '#2a2a3a', C: '#14141e', p: '#14141e', b: '#0a0a12', long: true },
  calima: { h: '#a8a8b8', H: '#a8a8b8', s: '#e8c8a8', S: '#c8a888', c: '#f2f2f2', C: '#c8c8d8', p: '#22222e', b: '#14141e' },
  elite1: { h: '#6a4a2a', H: '#6a4a2a', s: '#f2c8a0', S: '#d8a880', c: '#7ac8f0', C: '#3f86c8', p: '#f2f2f2', b: '#2a5a9a', long: true },
  elite2: { h: '#3a2a1a', H: '#e8b02a', s: '#c8946a', S: '#a8744a', c: '#a8782c', C: '#6a4a1a', p: '#5a4a3a', b: '#2a1a10' },
  elite3: { h: '#4a2a5a', H: '#3a6a3a', s: '#e8c8b8', S: '#c8a898', c: '#4a2a6a', C: '#2f1a4a', p: '#2a1a3a', b: '#1a1020', long: true },
  elite4: { h: '#1a1a1a', H: '#1a1a1a', s: '#a87a5a', S: '#8a5a3a', c: '#f2f2f2', C: '#c8c8d0', p: '#2a3a8a', b: '#f2f2f2' },
  oldman: { h: '#e8e8e8', H: '#8a6a4a', s: '#e8b890', S: '#c89870', c: '#8a6a4a', C: '#5a4a3a', p: '#4a4a4a', b: '#2a1a10' },
  girl: { h: '#c8862a', H: '#f2c02a', s: '#f2c8a0', S: '#d8a880', c: '#f2c02a', C: '#c8902a', p: '#5aa8e8', b: '#c83a3a', long: true },
  boy: { h: '#3a2a1a', H: '#3a2a1a', s: '#d8a070', S: '#b88050', c: '#4ac04a', C: '#2a8a2a', p: '#3a5a8a', b: '#2a2a2a' },
  swimmer: { h: '#2a2a2a', H: '#f2e05c', s: '#e8b080', S: '#c89060', c: '#e8b080', C: '#c89060', p: '#3a7ad8', b: '#e8b080' },
  sailor: { h: '#ffffff', H: '#ffffff', s: '#e8b890', S: '#c89870', c: '#3a5ad8', C: '#ffffff', p: '#1a2a5a', b: '#1a1a1a' },
  cop: { h: '#1a2a5a', H: '#1a2a5a', s: '#e8b890', S: '#c89870', c: '#3a5a9a', C: '#1a2a5a', p: '#1a2a3a', b: '#1a1a1a' },
  leader_water: { h: '#2a6ad8', H: '#2a6ad8', s: '#f2c8a0', S: '#d8a880', c: '#7ac8f0', C: '#2a6ad8', p: '#f2f2f2', b: '#2a6ad8', long: true },
  leader_elec: { h: '#f2e05c', H: '#f2e05c', s: '#f2c8a0', S: '#d8a880', c: '#2a2a2a', C: '#f2e05c', p: '#2a2a2a', b: '#f2e05c', long: true },
  champion: { h: '#2a2a2a', H: '#5aa8e8', s: '#a87a5a', S: '#8a5a3a', c: '#5aa8e8', C: '#ffffff', p: '#1a1a1a', b: '#1a1a1a' },
  keeper: { h: '#5a5a5a', H: '#1a2a5a', s: '#e8b890', S: '#c89870', c: '#1a2a5a', C: '#f2f2f2', p: '#3a3a3a', b: '#1a1a1a' },
};

// Unique characters get extra pixels on top of the shared body templates.
// d(x, y, colour, w, h) draws one rectangle in unflipped (right-facing) coordinates.
const PP = (d, x, y, col) => { for (const dx of [0, 3]) { d(x + dx, y, col, 2, 2); d(x + dx, y + 2, col, 1, 1); } };
const DECO = {
  // Maestro Tabárez: celeste tracksuit, glasses, whistle cord.
  prof: (d, dir) => {
    if (dir === 'down') { d(4, 6, '#1a1a24', 8, 1); d(7, 10, '#f8f8f8', 1, 3); d(10, 10, '#f8d040', 2, 2); d(6, 9, '#f8f8f8', 1, 2); }
    else if (dir === 'up') d(7, 10, '#f8f8f8', 2, 3);
    else { d(8, 6, '#1a1a24', 4, 1); d(7, 10, '#f8f8f8', 1, 3); }
  },
  // Rival (the professor's grandson): white stripe on the jersey and a celeste headband.
  rival: (d, dir) => {
    d(3, 3, '#6cb4ee', 10, 1);
    if (dir === 'down') { d(4, 11, '#f8f8f8', 8, 1); d(7, 9, '#f8f8f8', 2, 2); }
    else if (dir === 'up') d(4, 11, '#f8f8f8', 8, 1);
    else d(5, 11, '#f8f8f8', 6, 1);
  },
  // PP recruits: dark mask over the eyes and the PP emblem.
  grunt: (d, dir) => {
    if (dir === 'down') { d(4, 6, '#14141e', 8, 1); PP(d, 5, 10, '#f2f2f2'); }
    else if (dir === 'up') PP(d, 5, 10, '#f2f2f2');
    else { d(7, 6, '#14141e', 5, 1); d(6, 10, '#f2f2f2', 1, 2); d(8, 10, '#f2f2f2', 1, 2); }
  },
  // Bruma: violet hood and cloak with a gold PP badge.
  bruma: (d, dir) => {
    if (dir !== 'up') { d(3, 4, '#4a2a6a', 1, 5); d(12, 4, '#4a2a6a', 1, 5); d(3, 3, '#4a2a6a', 10, 1); }
    if (dir === 'down') { PP(d, 5, 10, '#f8d040'); d(4, 12, '#4a2a6a', 8, 2); }
    else if (dir === 'up') d(7, 10, '#f8d040', 2, 2);
    else { d(6, 10, '#f8d040', 1, 2); d(5, 12, '#4a2a6a', 6, 2); }
  },
  // Brumario: long dark coat, white collar, gold monocle.
  brumario: (d, dir) => {
    d(3, 9, '#f2f2f2', 10, 1);
    if (dir === 'down') { d(10, 6, '#f8d040', 2, 1); d(11, 7, '#f8d040', 1, 1); PP(d, 5, 10, '#e0263a'); d(3, 12, '#14141e', 10, 2); }
    else if (dir === 'up') d(3, 12, '#14141e', 10, 2);
    else { d(11, 6, '#f8d040', 1, 2); d(5, 10, '#e0263a', 1, 2); d(4, 12, '#14141e', 8, 2); }
  },
  // Garúa: grey-green commander with an eyepatch, gold epaulettes and a beret.
  garua: (d, dir) => {
    d(3, 2, '#2a4a4a', 10, 1);
    if (dir === 'down') { d(9, 5, '#14141e', 3, 2); d(3, 9, '#f8d040', 2, 1); d(11, 9, '#f8d040', 2, 1); d(7, 10, '#f8d040', 2, 1); }
    else if (dir === 'up') { d(3, 9, '#f8d040', 2, 1); d(11, 9, '#f8d040', 2, 1); }
    else { d(10, 5, '#14141e', 2, 2); d(5, 9, '#f8d040', 2, 1); }
  },
  // Lucía: white headband and a wave on her top.
  leader_water: (d, dir) => {
    d(3, 3, '#f2f2f2', 10, 1);
    if (dir === 'down') { d(7, 10, '#f2f2f2', 2, 1); d(6, 11, '#f2f2f2', 1, 1); d(9, 11, '#f2f2f2', 1, 1); }
  },
  // Sofía: goggles on the forehead and a lightning bolt.
  leader_elec: (d, dir) => {
    if (dir !== 'up') { d(5, 3, '#2a2a2a', 2, 1); d(9, 3, '#2a2a2a', 2, 1); d(5, 2, '#8ac8f0', 2, 1); d(9, 2, '#8ac8f0', 2, 1); }
    if (dir === 'down') { d(8, 10, '#f2e05c', 1, 1); d(7, 11, '#f2e05c', 2, 1); d(7, 12, '#f2e05c', 1, 1); }
  },
  // Don Aparicio: black beret, white moustache, striped poncho.
  leader_gaucho: (d, dir) => {
    d(2, 1, '#1a1a1a', 12, 2); d(3, 0, '#1a1a1a', 9, 1);
    if (dir === 'down') { d(6, 7, '#f2f2f2', 4, 1); d(3, 9, '#6cb4ee', 10, 1); d(2, 10, '#f2f2f2', 12, 1); d(2, 11, '#8a2a2a', 12, 1); d(3, 12, '#6cb4ee', 10, 1); }
    else if (dir === 'up') { d(2, 10, '#f2f2f2', 12, 1); d(2, 11, '#8a2a2a', 12, 2); }
    else { d(9, 7, '#f2f2f2', 3, 1); d(4, 10, '#f2f2f2', 8, 1); d(4, 11, '#8a2a2a', 8, 2); }
  },
  // Obdulio, the champion: celeste jersey with crest and captain's armband.
  champion: (d, dir) => {
    if (dir === 'down') { d(10, 10, '#f8f8f8', 2, 2); d(1, 10, '#14141e', 2, 1); d(1, 11, '#f8d040', 2, 1); }
    else if (dir === 'up') { d(6, 9, '#f8f8f8', 1, 4); d(7, 9, '#f8f8f8', 2, 1); d(7, 11, '#f8f8f8', 2, 1); d(8, 12, '#f8f8f8', 1, 1); }
    else d(6, 11, '#f8d040', 2, 1);
  },
  leader_fire: (d, dir) => {
    d(3, 3, '#ff9a2a', 10, 1);
    if (dir === 'down') { d(5, 9, '#5a3a1a', 6, 4); d(7, 10, '#3a2a10', 2, 2); }
    else if (dir === 'up') d(5, 9, '#5a3a1a', 6, 4);
    else d(5, 9, '#5a3a1a', 5, 3);
  },
  leader_forest: (d, dir) => {
    d(2, 1, '#2f5a2a', 12, 2); d(3, 0, '#2f5a2a', 9, 1);
    if (dir === 'down') { d(5, 7, '#6a4a2a', 6, 2); d(7, 10, '#b8f090', 2, 2); }
    else if (dir === 'side') { d(8, 7, '#6a4a2a', 3, 2); d(6, 10, '#b8f090', 1, 2); }
  },
  leader_dojo: (d, dir) => {
    d(3, 3, '#e0263a', 10, 1);
    if (dir === 'down') { d(3, 12, '#14141e', 10, 1); d(7, 9, '#c8c8d0', 2, 3); }
    else if (dir === 'up') d(3, 12, '#14141e', 10, 1);
    else d(4, 12, '#14141e', 8, 1);
  },
  leader_psy: (d, dir) => {
    if (dir === 'down') { d(4, 6, '#1a1a24', 8, 1); d(6, 10, '#f8d040', 1, 1); d(9, 11, '#f8d040', 1, 1); d(7, 12, '#f8d040', 1, 1); d(3, 12, '#3e2266', 10, 2); }
    else if (dir === 'up') { d(6, 10, '#f8d040', 1, 1); d(9, 11, '#f8d040', 1, 1); d(3, 12, '#3e2266', 10, 2); }
    else { d(8, 6, '#1a1a24', 4, 1); d(6, 11, '#f8d040', 1, 1); d(4, 12, '#3e2266', 8, 2); }
  },
  leader_dark: (d, dir) => {
    if (dir === 'down') { d(7, 10, '#e8e0f0', 2, 2); d(8, 10, '#14141e', 1, 2); d(3, 12, '#14141e', 10, 2); d(6, 8, '#8a2a4a', 4, 1); }
    else if (dir === 'up') d(3, 12, '#14141e', 10, 2);
    else { d(6, 10, '#e8e0f0', 1, 2); d(4, 12, '#14141e', 8, 2); }
  },
  // Calima: white coat, dark round glasses, red tie and the PP badge.
  calima: (d, dir) => {
    if (dir === 'down') { d(4, 6, '#14141e', 8, 1); d(7, 9, '#e0263a', 2, 3); d(4, 10, '#14141e', 1, 3); d(11, 10, '#14141e', 1, 3); d(10, 10, '#f8d040', 1, 1); }
    else if (dir === 'up') { d(7, 9, '#c8c8d8', 2, 4); }
    else { d(8, 6, '#14141e', 4, 1); d(6, 9, '#e0263a', 1, 3); }
  },
  elite1: (d, dir) => {
    d(3, 3, '#2a2a3a', 10, 1);
    if (dir !== 'up') { d(4, 2, '#8ac8f0', 3, 1); d(9, 2, '#8ac8f0', 3, 1); }
    if (dir === 'down') { d(3, 10, '#f2f2f2', 2, 2); d(11, 10, '#f2f2f2', 2, 2); }
  },
  elite2: (d, dir) => {
    d(3, 2, '#e8b02a', 10, 1); d(5, 1, '#f8d040', 6, 1);
    if (dir === 'down') { d(3, 10, '#5a3a1a', 10, 1); d(7, 9, '#f8d040', 2, 1); }
    else if (dir === 'up') d(3, 10, '#5a3a1a', 10, 1);
    else d(4, 10, '#5a3a1a', 8, 1);
  },
  elite3: (d, dir) => {
    d(3, 3, '#2f1a4a', 10, 1);
    if (dir === 'down') { d(5, 7, '#2f1a4a', 6, 1); d(4, 9, '#8a5ad0', 8, 1); d(7, 11, '#8a5ad0', 2, 1); }
    else if (dir === 'up') d(4, 9, '#8a5ad0', 8, 1);
    else { d(8, 7, '#2f1a4a', 3, 1); d(5, 9, '#8a5ad0', 6, 1); }
  },
  elite4: (d, dir) => {
    d(3, 3, '#2a3a8a', 10, 1);
    if (dir === 'down') { d(7, 10, '#2a3a8a', 2, 1); d(10, 10, '#f8d040', 2, 2); d(1, 10, '#e0263a', 2, 1); }
    else if (dir === 'up') { d(6, 9, '#2a3a8a', 1, 4); d(7, 9, '#2a3a8a', 2, 1); d(7, 11, '#2a3a8a', 2, 1); d(8, 12, '#2a3a8a', 1, 1); }
    else d(6, 11, '#2a3a8a', 3, 1);
  },
  mom: (d, dir) => { if (dir === 'down') d(5, 10, '#f8f8f8', 6, 4); else if (dir !== 'up') d(5, 10, '#f8f8f8', 5, 3); },
};

const cache = new Map();

function draw(g, rows, pal, ox, oy, flip) {
  rows.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const k = row[x];
      if (k === '.') continue;
      g.fillStyle = k === 'o' ? '#1a1a24' : k === 'e' ? '#1a1a24' : (pal[k] ?? '#ff00ff');
      g.fillRect(ox + (flip ? 15 - x : x), oy + y, 1, 1);
    }
  });
}

/** dir: 'down'|'up'|'left'|'right'; frame: 0 stand, 1/2 steps */
export function charSprite(look, dir, frame = 0) {
  const key = `${look}|${dir}|${frame}`;
  let c = cache.get(key);
  if (c) return c;
  const pal = LOOKS[look] ?? LOOKS.boy;
  c = document.createElement('canvas');
  c.width = 16;
  c.height = 17;
  const g = c.getContext('2d');
  const isP = look.startsWith('player');
  const fem = look === 'player_f';
  const body = isP ? (dir === 'down' ? (fem ? F_DOWN : P_DOWN) : dir === 'up' ? (fem ? F_UP : P_UP) : fem ? F_SIDE : P_SIDE) : dir === 'down' ? DOWN : dir === 'up' ? UP : SIDE;
  const legs = LEGS[dir === 'left' || dir === 'right' ? 'side' : dir][frame];
  const flip = dir === 'left';
  const bob = frame ? 0 : 1;
  // soft shadow
  g.fillStyle = 'rgba(0,0,0,0.22)';
  g.fillRect(4, 15, 8, 2);
  draw(g, [...body, ...legs], pal, 0, bob, flip);
  DECO[look]?.((x, y, col, w = 1, h = 1) => {
    g.fillStyle = col;
    g.fillRect(flip ? 16 - x - w : x, y + bob, w, h);
  }, dir === 'left' || dir === 'right' ? 'side' : dir);
  if (pal.long && dir !== 'up') {
    g.fillStyle = pal.h;
    if (dir === 'down') { g.fillRect(2, 5 + bob, 1, 5); g.fillRect(13, 5 + bob, 1, 5); }
    else g.fillRect(flip ? 11 : 4, 5 + bob, 1, 6);
  } else if (pal.long && dir === 'up') {
    g.fillStyle = pal.h;
    g.fillRect(4, 8 + bob, 8, 2);
  }
  cache.set(key, c);
  return c;
}
