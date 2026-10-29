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
const LEGS = {
  down: [['...oppo..oppo...', '...obbo..obbo...'], ['...oppo..oppo...', '...obbo...oo....'], ['...oppo..oppo...', '....oo...obbo...']],
  up: [['...oppo..oppo...', '...obbo..obbo...'], ['...oppo..oppo...', '...obbo...oo....'], ['...oppo..oppo...', '....oo...obbo...']],
  side: [['....oppppo......', '....obbbbo......'], ['...oppo.oppo....', '...obbo.obbo....'], ['....oppppo......', '....obbbbo......']],
};

export const LOOKS = {
  // The player has its own silhouette: celeste cap and jersey, red scarf, orange backpack.
  player_m: { h: '#3a2a1a', H: '#6cb4ee', r: '#2a6aae', s: '#f2c8a0', S: '#d8a880', c: '#6cb4ee', C: '#3f86c8', w: '#ffffff', R: '#e0263a', B: '#e8a02a', p: '#22222e', b: '#f2f2f2' },
  player_f: { h: '#8a4a2a', H: '#6cb4ee', r: '#2a6aae', s: '#f2c8a0', S: '#d8a880', c: '#6cb4ee', C: '#3f86c8', w: '#ffffff', R: '#e0263a', B: '#e8a02a', p: '#22222e', b: '#f2f2f2', long: true },
  rival: { h: '#2a2a3a', H: '#2a2a3a', s: '#e8b890', S: '#c89870', c: '#e0263a', C: '#a01a2a', p: '#2a2a2a', b: '#1a1a1a' },
  prof: { h: '#d8d8d8', H: '#d8d8d8', s: '#f2c8a0', S: '#d8a880', c: '#f8f8f8', C: '#c8c8d0', p: '#5a4a3a', b: '#2a1a10' },
  mom: { h: '#5a2a1a', H: '#5a2a1a', s: '#f2c8a0', S: '#d8a880', c: '#e86a8a', C: '#b84a6a', p: '#5a5a8a', b: '#2a2a2a', long: true },
  nurse: { h: '#f2a0b8', H: '#ffffff', s: '#f2c8a0', S: '#d8a880', c: '#ffffff', C: '#f2a0b8', p: '#f2a0b8', b: '#ffffff', long: true },
  clerk: { h: '#3a2a1a', H: '#4a9a4a', s: '#e8b890', S: '#c89870', c: '#4a9a4a', C: '#2a6a2a', p: '#3a3a3a', b: '#1a1a1a' },
  gaucho: { h: '#1a1a1a', H: '#1a1a1a', s: '#c8946a', S: '#a8744a', c: '#a83a2a', C: '#6a2a1a', p: '#e8e0d0', b: '#3a2a1a' },
  grunt: { h: '#6a6a7a', H: '#4a4a5a', s: '#d8c8b8', S: '#a8988a', c: '#7a7a8a', C: '#4a4a5a', p: '#3a3a4a', b: '#1a1a1a' },
  boss: { h: '#d8d8e8', H: '#2a2a3a', s: '#e8c8a8', S: '#c8a888', c: '#2a2a3a', C: '#1a1a2a', p: '#2a2a3a', b: '#8a8aa0' },
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
  const body = isP ? (dir === 'down' ? P_DOWN : dir === 'up' ? P_UP : P_SIDE) : dir === 'down' ? DOWN : dir === 'up' ? UP : SIDE;
  const legs = LEGS[dir === 'left' || dir === 'right' ? 'side' : dir][frame];
  const flip = dir === 'left';
  const bob = frame ? 0 : 1;
  // soft shadow
  g.fillStyle = 'rgba(0,0,0,0.22)';
  g.fillRect(4, 15, 8, 2);
  draw(g, [...body, ...legs], pal, 0, bob, flip);
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
