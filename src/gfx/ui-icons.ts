// Small 16x16 pixel icons of the on-screen bar (medals, money, place). The editor can redraw each one under the
// key 'ui:<name>' (tab "Iconos de pantalla"); until then they use the drawings below.
import { override } from './overrides.ts';

export const UI_ICONS: { key: string; name: string }[] = [
  { key: 'medallas', name: 'Medallas' },
  { key: 'dinero', name: 'Dinero' },
  { key: 'ubicacion', name: 'Ubicación' },
];

const INK = '#23162e';

function make(paint: (put: (x: number, y: number, c: string) => void) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d');
  paint((x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); });
  return c;
}

/** Fills a disc pixel by pixel with an outline, a lit upper-left and a shaded lower-right. */
function disc(put, cx: number, cy: number, r: number, [fill, light, shade]: string[]) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d > r + 0.5) continue;
    if (d > r - 0.7) { put(x, y, INK); continue; }
    const lit = x - cx + (y - cy) < -r * 0.9;
    const dark = x - cx + (y - cy) > r * 0.9;
    put(x, y, lit ? light : dark ? shade : fill);
  }
}

const DRAW: Record<string, () => HTMLCanvasElement> = {
  medallas: () => make((put) => {
    // ribbon: red and blue tails meeting under the neck
    const tail = (x0: number, col: string, hi: string) => {
      for (let y = 0; y < 7; y++) for (let k = 0; k < 4; k++) {
        const x = x0 + (y >> 1) * (x0 < 7 ? 1 : -1) + k;
        put(x, y, k === 0 || k === 3 ? INK : k === 1 ? hi : col);
      }
    };
    tail(3, '#d8343c', '#ff7a7a');
    tail(9, '#2f63b8', '#6aa4f0');
    disc(put, 7.5, 10.5, 5, ['#f2c02a', '#ffe98a', '#c08a14']);
    // star
    for (const [x, y] of [[7, 8], [8, 8], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [6, 11], [7, 11], [8, 11], [9, 11], [6, 12], [9, 12], [7, 9], [8, 9]]) put(x, y, '#fff6c8');
  }),
  dinero: () => make((put) => {
    disc(put, 7.5, 7.5, 7, ['#f2c02a', '#ffe98a', '#c08a14']);
    // inner ring
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d > 5 && d < 5.9) put(x, y, '#d89a1c'); }
    const S = ['.ddd.', 'd....', '.ddd.', '....d', '.ddd.'];
    S.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'd') put(5 + i, 5 + j, '#7a4a0a'); }));
    put(7, 3, '#7a4a0a'); put(7, 4, '#7a4a0a'); put(7, 10, '#7a4a0a'); put(7, 11, '#7a4a0a');
  }),
  ubicacion: () => make((put) => {
    const rows = [
      '................',
      '.....oooooo.....',
      '....orrrrrso....',
      '...orRRrrrrso...',
      '...orRrrrrrso...',
      '...orrrwwrrso...',
      '...orrrwwrrso...',
      '...orrrrrrrso...',
      '....orrrrrso....',
      '....orrrrsso....',
      '.....orrrso.....',
      '.....orrsso.....',
      '......orso......',
      '......orso......',
      '.......oo.......',
      '................',
    ];
    const pal = { o: INK, r: '#e0343c', R: '#ff8a8a', s: '#a01826', w: '#ffffff' };
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) put(x, y, pal[ch]); }));
  }),
};

const cache = new Map<string, HTMLCanvasElement>();
/** 16x16 canvas for an on-screen icon (the editor's drawing if there is one). */
export function uiIconCanvas(key: string): HTMLCanvasElement {
  const drawn = override(`ui:${key}`, 16, 16);
  if (drawn) return drawn;
  if (!cache.has(key)) cache.set(key, DRAW[key]());
  return cache.get(key);
}
const urls = new Map<string, string>();
/** Data URL of the icon, for <img>. */
export function uiIconUrl(key: string): string {
  const drawn = override(`ui:${key}`, 16, 16);
  if (drawn) return drawn.toDataURL();
  if (!urls.has(key)) urls.set(key, uiIconCanvas(key).toDataURL());
  return urls.get(key);
}
