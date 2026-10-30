// Dedicated flight animation for the legendary Pampero, used by the title screen and the intro.
// Not the Dex sprite warped by an effect: every frame is drawn from scratch with the wings
// at a different point of the wing beat (up, level, down), so it reads as a real flap.
import { flatOutline } from './creatures.js';

export const PAMPERO_W = 112;
export const PAMPERO_H = 84;
export const PAMPERO_FRAMES = 8;

const BLUE = '#3a5ad8', BLUE_DARK = '#2a3fa8', BLUE_LIGHT = '#5a7af0', WHITE = '#f2f2ff', GOLD = '#f2e05c', BEAK = '#e8a030';
const frames = [];

const poly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); };
const ell = (g, x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };

/** One wing: a blue arm from the shoulder and a fan of long feathers that follows the stroke. */
function wing(g, sx, sy, elev, len, dark) {
  const feather = (ang, l, w, col) => {
    const dx = Math.cos(ang) * l, dy = -Math.sin(ang) * l;
    const nx = -Math.sin(ang) * w, ny = -Math.cos(ang) * w;
    poly(g, [[sx - nx, sy - ny], [sx + dx * 0.55 - nx * 1.2, sy + dy * 0.55 - ny * 1.2], [sx + dx, sy + dy], [sx + dx * 0.55 + nx * 1.2, sy + dy * 0.55 + ny * 1.2], [sx + nx, sy + ny]], col);
  };
  const base = dark ? BLUE_DARK : BLUE;
  const tip = dark ? '#c8c8e0' : WHITE;
  // feathers fan out behind the leading edge; the longest ones trail further back as the wing lifts
  for (let k = 5; k >= 0; k--) {
    const ang = elev - 0.2 - k * 0.2;
    feather(ang, len * (1 - k * 0.08), 3.4, k % 2 ? tip : base);
  }
  feather(elev, len * 1.02, 4, base); // leading edge
  ell(g, sx + 2, sy + 1, 7, 4.5, base, -elev * 0.5);
}

/** Frame i of the wing beat, 0..PAMPERO_FRAMES-1. */
export function pamperoFrame(i) {
  const k = ((i % PAMPERO_FRAMES) + PAMPERO_FRAMES) % PAMPERO_FRAMES;
  if (frames[k]) return frames[k];
  const c = document.createElement('canvas');
  c.width = PAMPERO_W; c.height = PAMPERO_H;
  const g = c.getContext('2d');
  const phase = (k / PAMPERO_FRAMES) * Math.PI * 2;
  const beat = Math.cos(phase);                       // 1 = wings fully up, -1 = fully down
  const elev = 0.2 + 0.85 * beat;                     // radians above the horizontal
  const bob = -Math.cos(phase) * 2.5;                 // the body rises a little on the downstroke
  const bx = 56, by = 44 + bob;
  const sx = bx + 2, sy = by - 5;

  // far wing, tail and legs go behind the body
  wing(g, sx - 5, sy - 1, elev - 0.1, 46, true);
  const sway = Math.sin(phase + 1) * 2;
  poly(g, [[bx + 12, by], [bx + 40, by - 6 + sway], [bx + 38, by + 2 + sway], [bx + 14, by + 5]], WHITE);
  poly(g, [[bx + 14, by + 3], [bx + 36, by + 9 + sway], [bx + 30, by + 13 + sway], [bx + 12, by + 8]], BLUE_LIGHT);
  poly(g, [[bx + 34, by - 5 + sway], [bx + 46, by - 12 + sway], [bx + 41, by - 4 + sway], [bx + 48, by - 5 + sway], [bx + 38, by + 5 + sway]], GOLD); // lightning tail tip
  g.strokeStyle = '#d8a040'; g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(bx - 2, by + 9); g.lineTo(bx + 5, by + 15); g.moveTo(bx + 4, by + 9); g.lineTo(bx + 10, by + 14); g.stroke();

  // body, white chest, neck and head
  ell(g, bx, by, 19, 10.5, BLUE, -0.12);
  ell(g, bx - 4, by + 4, 13, 6, WHITE);
  ell(g, bx - 17, by - 6, 7, 6, BLUE);
  const hx = bx - 26, hy = by - 11;
  poly(g, [[hx + 3, hy - 5], [hx + 16, hy - 14], [hx + 12, hy - 2]], WHITE);        // crest
  poly(g, [[hx + 5, hy - 7], [hx + 14, hy - 20], [hx + 13, hy - 8]], BLUE_LIGHT);
  ell(g, hx, hy, 8.5, 7.5, BLUE);
  poly(g, [[hx - 6, hy - 1], [hx - 17, hy + 3], [hx - 6, hy + 5]], BEAK);            // beak
  ell(g, hx - 1, hy - 2, 2.6, 2.6, '#ffffff');
  g.fillStyle = '#141420'; g.fillRect(Math.round(hx - 2.5), Math.round(hy - 3), 2, 3);

  // near wing in front
  wing(g, sx, sy, elev, 54, false);
  // jagged lightning mark on the flank
  poly(g, [[bx + 2, by - 4], [bx - 3, by + 3], [bx + 1, by + 3], [bx - 2, by + 10], [bx + 7, by + 1], [bx + 3, by + 1], [bx + 6, by - 4]], GOLD);

  flatOutline(c);
  frames[k] = c;
  return c;
}

/** Frame for a point in time: `speed` is the length of one wing beat in ms. */
export function pamperoAt(t, speed = 700) {
  return pamperoFrame(Math.floor((t / speed) * PAMPERO_FRAMES));
}
