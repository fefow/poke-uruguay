// Procedural 16x16 item icons (no external images). itemIcon(key) returns a data URL
// for the DOM lists; drawItem(g, key, x, y) paints it on the world canvas.
import { ITEMS } from '../data/items.js';
import { MOVES } from '../data/moves.js';
import { TYPES } from '../data/types.js';

const INK = '#1a1a24';
const cache = new Map();
const canvases = new Map();

const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const disc = (g, cx, cy, rad, c) => { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, rad, 0, 7); g.fill(); };
const ring = (g, cx, cy, rad, fill) => { disc(g, cx, cy, rad + 1, INK); disc(g, cx, cy, rad, fill); };

function ball(g, top, band = null) {
  ring(g, 8, 8, 6, '#f2f2f2');
  g.fillStyle = top; g.beginPath(); g.arc(8, 8, 6, Math.PI, 0); g.fill();
  if (band) { r(g, 2, 5, 12, 1, band); }
  r(g, 2, 8, 12, 1, INK);
  disc(g, 8, 8, 2.2, INK); disc(g, 8, 8, 1.4, '#fff');
  r(g, 4, 4, 2, 1, '#ffffff99');
}

function mate(g, yerba, star = false) {
  // calabaza + yerba + bombilla
  r(g, 12, 1, 1, 8, '#c8ccd8'); r(g, 11, 1, 3, 1, '#9aa0b0'); r(g, 12, 8, 1, 1, '#9aa0b0');
  g.fillStyle = INK; g.beginPath(); g.ellipse(7, 10, 6, 5, 0, 0, 7); g.fill();
  g.fillStyle = '#9a6a3c'; g.beginPath(); g.ellipse(7, 10, 5, 4, 0, 0, 7); g.fill();
  r(g, 3, 12, 8, 1, '#7a4a24');
  r(g, 2, 6, 10, 2, INK); r(g, 3, 6, 8, 1, yerba);
  r(g, 4, 9, 2, 1, '#b88a58');
  if (star) { r(g, 7, 9, 1, 3, '#f2c02a'); r(g, 6, 10, 3, 1, '#f2c02a'); }
}

function bottle(g, body, cap = '#e8e8f0', label = '#fff') {
  r(g, 6, 1, 4, 2, INK); r(g, 7, 1, 2, 1, cap);
  r(g, 4, 3, 8, 12, INK); r(g, 5, 4, 6, 10, body); r(g, 5, 7, 6, 4, label);
  r(g, 6, 4, 1, 9, '#ffffff66');
}

function arrowBadge(g, col) {
  ring(g, 8, 8, 6, col);
  r(g, 7, 5, 2, 7, '#fff'); r(g, 5, 7, 6, 1, '#fff'); r(g, 6, 6, 4, 1, '#fff'); r(g, 7, 4, 2, 1, '#fff');
}

function gem(g, a, b, c) {
  g.fillStyle = INK; g.beginPath(); g.moveTo(8, 1); g.lineTo(14, 6); g.lineTo(12, 14); g.lineTo(4, 14); g.lineTo(2, 6); g.closePath(); g.fill();
  g.fillStyle = a; g.beginPath(); g.moveTo(8, 2.5); g.lineTo(12.6, 6.2); g.lineTo(11, 12.8); g.lineTo(5, 12.8); g.lineTo(3.4, 6.2); g.closePath(); g.fill();
  r(g, 6, 4, 2, 6, b); r(g, 9, 6, 2, 5, c);
  r(g, 5, 5, 1, 2, '#ffffffaa');
}

function disc3(g, col) {
  // MT: round disc colored by move type, with a label
  ring(g, 8, 8, 6.5, '#aab0c0');
  disc(g, 8, 8, 4.6, col);
  disc(g, 8, 8, 1.6, INK); disc(g, 8, 8, 0.8, '#fff');
  r(g, 4, 5, 3, 1, '#ffffffaa'); r(g, 3, 8, 1, 1, '#ffffff88');
}

const ART = {
  esfera: (g) => ball(g, '#7ac8f0'),
  superesfera: (g) => ball(g, '#3a6ad8', '#9ac0ff'),
  ultraesfera: (g) => { ball(g, '#2a2a3a'); r(g, 3, 4, 3, 1, '#f2c02a'); r(g, 10, 4, 3, 1, '#f2c02a'); },
  esfera_celeste: (g) => { ball(g, '#bfe8ff', '#fff'); r(g, 7, 3, 2, 2, '#f2c02a'); },
  te_marcela: (g) => mate(g, '#b8e08a'),
  mate: (g) => mate(g, '#78b84a'),
  mate_dulce: (g) => mate(g, '#3a7a32'),
  dulce_de_leche: (g) => mate(g, '#c8902a', true),
  chivito: (g) => {
    r(g, 1, 4, 14, 3, INK); r(g, 2, 3, 12, 3, '#e8b868'); r(g, 4, 3, 2, 1, '#f8d890');
    r(g, 1, 7, 14, 2, INK); r(g, 2, 7, 12, 1, '#5cae3c');
    r(g, 2, 8, 12, 2, '#d85a4a'); r(g, 3, 9, 3, 1, '#f2c0b8');
    r(g, 5, 10, 6, 2, '#fff6c8'); r(g, 7, 10, 2, 1, '#f2c02a');
    r(g, 1, 11, 14, 4, INK); r(g, 2, 12, 12, 2, '#d8a050');
  },
  ruda: (g) => { r(g, 7, 7, 1, 8, '#2a6a2a'); for (const [x, y] of [[4, 3], [9, 2], [3, 8], [10, 7], [6, 1]]) { disc(g, x + 1.5, y + 1.5, 2.1, INK); disc(g, x + 1.5, y + 1.5, 1.5, '#4aa84a'); } },
  linimento: (g) => bottle(g, '#f2f2f8', '#3a6ad8', '#e0263a'),
  aloe: (g) => { for (const [x, h2, w] of [[3, 9, 3], [6, 12, 4], [10, 8, 3]]) { r(g, x - 1, 14 - h2, w + 2, h2, INK); r(g, x, 14 - h2 + 1, w, h2 - 1, '#5cae3c'); } r(g, 3, 13, 10, 2, '#9a6a3c'); },
  despertador: (g) => { ring(g, 8, 9, 5, '#fff'); r(g, 8, 6, 1, 4, INK); r(g, 8, 9, 3, 1, INK); disc(g, 3.5, 3.5, 2, '#e0263a'); disc(g, 12.5, 3.5, 2, '#e0263a'); r(g, 3, 14, 2, 1, INK); r(g, 11, 14, 2, 1, INK); },
  alfajor: (g) => { r(g, 1, 3, 14, 10, INK); r(g, 2, 4, 12, 3, '#6a3a1a'); r(g, 2, 7, 12, 2, '#e8c888'); r(g, 2, 9, 12, 3, '#6a3a1a'); r(g, 4, 5, 3, 1, '#8a5a3a'); r(g, 9, 10, 3, 1, '#8a5a3a'); },
  torta_frita: (g) => { g.fillStyle = INK; g.beginPath(); g.ellipse(8, 8, 7, 6, 0, 0, 7); g.fill(); g.fillStyle = '#d8a050'; g.beginPath(); g.ellipse(8, 8, 6, 5, 0, 0, 7); g.fill(); for (const [x, y] of [[5, 6], [9, 5], [7, 9], [11, 9]]) r(g, x, y, 1, 1, '#a8702a'); r(g, 4, 5, 3, 1, '#f0c878'); },
  garrapinada: (g) => { for (const [x, y] of [[2, 6], [7, 3], [8, 8], [3, 10]]) { g.fillStyle = INK; g.beginPath(); g.ellipse(x + 3, y + 2, 3.6, 2.8, 0, 0, 7); g.fill(); g.fillStyle = '#c8802a'; g.beginPath(); g.ellipse(x + 3, y + 2, 2.8, 2, 0, 0, 7); g.fill(); r(g, x + 2, y + 1, 1, 1, '#f0c070'); } },
  piedra_agata: (g) => gem(g, '#e8883a', '#f2c070', '#b85a22'),
  piedra_amatista: (g) => gem(g, '#9a5ad0', '#c89af0', '#6a3a9a'),
  piedra_basalto: (g) => gem(g, '#5a5e6a', '#8a8e9a', '#3a3e48'),
  refuerzo_ataque: (g) => arrowBadge(g, '#d83a3a'),
  refuerzo_defensa: (g) => arrowBadge(g, '#3a6ad8'),
  refuerzo_especial: (g) => arrowBadge(g, '#8a4ac8'),
  refuerzo_velocidad: (g) => arrowBadge(g, '#e0a820'),
  repelente: (g) => { r(g, 5, 1, 6, 2, INK); r(g, 6, 1, 4, 1, '#e0263a'); r(g, 4, 3, 8, 12, INK); r(g, 5, 4, 6, 10, '#4aa8d8'); r(g, 5, 8, 6, 3, '#fff'); r(g, 7, 9, 2, 1, '#2a6a2a'); r(g, 6, 4, 1, 9, '#ffffff66'); },
  uru_dex: (g) => { r(g, 2, 1, 12, 14, INK); r(g, 3, 2, 10, 12, '#d83a3a'); r(g, 4, 3, 8, 5, '#bfe8ff'); r(g, 4, 3, 8, 1, '#fff'); disc(g, 5, 11, 1.4, '#f2c02a'); r(g, 8, 10, 4, 1, INK); r(g, 8, 12, 4, 1, INK); },
  lampara: (g) => { r(g, 6, 1, 4, 2, INK); r(g, 4, 3, 8, 10, INK); r(g, 5, 4, 6, 8, '#fff2a8'); r(g, 7, 6, 2, 4, '#f2c02a'); r(g, 3, 13, 10, 2, INK); r(g, 4, 13, 8, 1, '#7a7a8a'); },
  mapa_uruguay: (g) => { r(g, 1, 2, 14, 12, INK); r(g, 2, 3, 12, 10, '#f0e0b0'); g.fillStyle = '#7aa850'; g.beginPath(); g.moveTo(5, 4); g.lineTo(11, 5); g.lineTo(12, 10); g.lineTo(7, 12); g.lineTo(4, 9); g.closePath(); g.fill(); r(g, 9, 9, 2, 2, '#e0263a'); },
  cana_pescar: (g) => { for (let i = 0; i < 12; i++) r(g, 2 + i, 13 - i, 2, 2, INK); for (let i = 0; i < 12; i++) r(g, 3 + i, 13 - i, 1, 1, '#a8702a'); r(g, 13, 2, 1, 7, '#c8ccd8'); disc(g, 13.5, 11, 1.6, '#e0263a'); },
  machete: (g) => { for (let i = 0; i < 9; i++) { r(g, 4 + i, 11 - i, 3, 3, INK); } for (let i = 0; i < 9; i++) r(g, 5 + i, 11 - i, 1, 2, '#d8dce8'); r(g, 2, 12, 4, 3, '#6a3a1a'); r(g, 2, 12, 4, 1, '#8a5a3a'); },
  canoa: (g) => { g.fillStyle = INK; g.beginPath(); g.moveTo(0, 7); g.lineTo(16, 7); g.quadraticCurveTo(13, 14, 8, 14); g.quadraticCurveTo(3, 14, 0, 7); g.fill(); g.fillStyle = '#b8803c'; g.beginPath(); g.moveTo(1.8, 8); g.lineTo(14.2, 8); g.quadraticCurveTo(12, 12.4, 8, 12.4); g.quadraticCurveTo(4, 12.4, 1.8, 8); g.fill(); r(g, 3, 8, 10, 1, '#d8a050'); r(g, 3, 10, 10, 1, '#8a5a26'); r(g, 11, 0, 1, 8, '#6a4a2a'); r(g, 10, 0, 3, 2, '#d8a050'); },
  bici: (g) => {
    for (const cx of [4, 12]) { g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.arc(cx, 11, 3.6, 0, 7); g.stroke(); g.strokeStyle = '#9aa0b8'; g.lineWidth = 0.8; g.beginPath(); g.arc(cx, 11, 3.6, 0, 7); g.stroke(); }
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(4, 11); g.lineTo(7, 5); g.lineTo(12, 11); g.moveTo(7, 5); g.lineTo(10, 5); g.moveTo(6, 4); g.lineTo(5, 4); g.stroke();
    g.strokeStyle = '#d83a3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(4, 11); g.lineTo(7, 5); g.lineTo(12, 11); g.moveTo(7, 5); g.lineTo(10, 5); g.stroke();
  },
  silbato: (g) => { r(g, 2, 6, 10, 6, INK); r(g, 3, 7, 8, 4, '#d8dce8'); r(g, 10, 4, 4, 3, INK); r(g, 11, 5, 2, 1, '#d8dce8'); r(g, 4, 8, 3, 1, '#f2c02a'); r(g, 3, 12, 1, 2, INK); r(g, 3, 14, 5, 1, INK); },
  boleto: (g) => { r(g, 1, 3, 14, 10, INK); r(g, 2, 4, 12, 8, '#7ac8f0'); r(g, 5, 4, 1, 8, '#fff'); r(g, 3, 6, 1, 4, '#fff'); r(g, 7, 6, 6, 1, '#16141e'); r(g, 7, 8, 5, 1, '#16141e'); r(g, 7, 10, 3, 1, '#16141e'); },
};

function draw(g, key) {
  const it = ITEMS[key];
  if (it?.tm) return disc3(g, TYPES[MOVES[it.tm].type].color);
  (ART[key] ?? ((c) => ring(c, 8, 8, 5, '#c8ccd8')))(g);
}

function canvasFor(key) {
  let c = canvases.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    draw(g, key);
    canvases.set(key, c);
  }
  return c;
}

export function itemIcon(key) {
  let u = cache.get(key);
  if (!u) { u = canvasFor(key).toDataURL(); cache.set(key, u); }
  return u;
}

export function drawItem(g, key, x, y) {
  g.drawImage(canvasFor(key), x, y);
}
