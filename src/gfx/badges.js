// Procedural 16x16 gym medals (pixel by pixel, so they stay crisp when scaled).
// badgeIcon(n) returns a data URL for medal n (1-8) in the trainer card.
const INK = '#1a1a24';
const cache = new Map();

// plate colours + emblem rows ('.' transparent, letters index the emblem palette)
const MEDALS = {
  // 1 Montevideo, Eléctrico: rayo
  1: { plate: ['#4f8fe8', '#2f63b8'], pal: { y: '#ffe23a', o: '#e8a41c' }, rows: [
    '',
    '',
    '.......yyyy.....',
    '......yyyy......',
    '.....yyyy.......',
    '....yyyyyyyy....',
    '......yyyyy.....',
    '.....yyyy.o.....',
    '....yyyoo.......',
    '...yyoo.........',
    '...yo...........',
  ] },
  // 2 Maldonado, Agua: gota
  2: { plate: ['#3cc0d8', '#1f8aa8'], pal: { w: '#ffffff', c: '#bfefff' }, rows: [
    '',
    '',
    '.......ww.......',
    '......www.......',
    '.....wwwww......',
    '....wwwwwww.....',
    '....wwwwwwc.....',
    '....wwwwwcc.....',
    '....wwwwwcc.....',
    '.....wwwcc......',
    '......ccc.......',
  ] },
  // 3 Treinta y Tres, Roca: peñasco
  3: { plate: ['#b89a5a', '#8a6e38'], pal: { g: '#8e8e9a', w: '#c8c8d4', d: '#5a5a66' }, rows: [
    '',
    '',
    '',
    '......gggg......',
    '....wwgggggg....',
    '...wwggggggdg...',
    '...wggggggggd...',
    '...ggggggddgd...',
    '...gggggggddd...',
    '....gdddddddd...',
    '.....dddddd.....',
  ] },
  // 4 Durazno, Fuego: llama
  4: { plate: ['#f08a3a', '#b8501a'], pal: { r: '#e83a1c', y: '#ffd83a', w: '#fff4b0' }, rows: [
    '',
    '',
    '.......r........',
    '......rr........',
    '.....rrr.r......',
    '....rrrrrr......',
    '....rryyrrr.....',
    '...rryyyyyr.....',
    '...rryywwyr.....',
    '...rrryyyrr.....',
    '....rrrrrr......',
    '.....rrrr.......',
  ] },
  // 5 Tacuarembó, Planta: hoja
  5: { plate: ['#58b84a', '#2f7a2c'], pal: { w: '#d8ff9a', l: '#9ae05a', d: '#3f8f2c' }, rows: [
    '',
    '',
    '.........wwww...',
    '.......wwwlll...',
    '.....wwwllll....',
    '....wwlllllld...',
    '...wllllllldd...',
    '...wlllllddd....',
    '..dllllddd......',
    '.ddlddd.........',
    'dd..............',
  ] },
  // 6 Rivera, Lucha: puño
  6: { plate: ['#d8503a', '#9a2a1a'], pal: { w: '#fff0e0', s: '#e8b890', k: '#8a4a2a' }, rows: [
    '',
    '',
    '',
    '...ssssssss.....',
    '...skskskssk....',
    '...ssssssss.....',
    '...ssssssss.....',
    '...sssssssw.....',
    '....ssssss......',
    '....ssssss......',
    '.....wwww.......',
  ] },
  // 7 Salto, Psíquico: ojo
  7: { plate: ['#9a6ae0', '#6a3aa8'], pal: { w: '#ffffff', p: '#c24aa8', k: '#1a1a24' }, rows: [
    '',
    '',
    '',
    '',
    '......wwww......',
    '....wwwwwwww....',
    '...wwwppppwww...',
    '..wwwppkkppwww..',
    '...wwwppppwww...',
    '....wwwwwwww....',
    '......wwww......',
  ] },
  // 8 Fray Bentos, Siniestro: luna
  8: { plate: ['#c85a78', '#8a2a48'], pal: { w: '#fff0c8', y: '#ffd83a' }, rows: [
    '',
    '',
    '',
    '.....wwww.......',
    '....wwww.....y..',
    '...wwww........',
    '...wwww.........',
    '...wwww.........',
    '...wwwww........',
    '....wwwwwwww....',
    '.....wwwwww.....',
  ] },
};

function draw(n) {
  const m = MEDALS[n];
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const g = c.getContext('2d');
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d > 7.2) continue;
      if (d > 6.2) px(x, y, INK);
      else if (d > 5.4) px(x, y, m.plate[1]);
      else px(x, y, m.plate[0]);
    }
  }
  px(3, 3, '#ffffffaa'); px(4, 2, '#ffffffaa'); px(2, 4, '#ffffffaa');
  m.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = m.pal[row[x]];
      if (col) px(x, y + 2, col);
    }
  });
  return c;
}

export function badgeIcon(n) {
  if (!cache.has(n)) cache.set(n, draw(n).toDataURL());
  return cache.get(n);
}
