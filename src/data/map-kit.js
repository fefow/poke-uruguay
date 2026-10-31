// Shared builders for map definitions (rooms, shops, Policlínicas, gyms).
export const TR = (id, name, cls, team, prize, intro, lose, after, look = 'boy') => ({ id, name, cls, team, prize, intro, lose, after, look });

export function room(rows, extra) {
  return { indoor: true, music: 'town', bg: 'indoor', tiles: rows, ...extra };
}

export const HOUSE = [
  'xxXxxxxXxx',
  'BBiiiiiiiE',
  'iiiiiiiiii',
  'iiiTTiiiiN',
  'iiiTTiiiii',
  'iiiiiiiiii',
  'Niiiiiiiii',
  'iiiimmiiii',
];
export const POLI = [
  'xxXxxxxxxXxx',
  'iiiiiiiiiPii',
  'iinnnnnnniii',
  'iiiiiiiiiiii',
  'NiiiiiiiiiiN',
  'iiAAAAAAAAii',
  'iEEiiiiiiEEi',
  'iiiiimmiiiii',
];
export const SHOP = [
  'xxXxxxxXxx',
  'BBBiiiiBBB',
  'iiiiiiiiii',
  'nnniiiiiii',
  'iiiiiiiiii',
  'iiiiiiiBBi',
  'Niiiiiiiii',
  'iiiimmiiii',
];
export const GYM = [
  'xxxxxXZxxxxx',
  'NYYYYYYYYYYN',
  'YYYYYAAYYYYY',
  'YYYYYAAYYYYY',
  'NNNYYAAYYNNN',
  'YYYYYAAYYYYY',
  'YYYYYAAYYYYY',
  'YYNNNAANNNYY',
  'YYYYYAAYYYYY',
  'YYYYYAAYYYYY',
  'NYYYYAAYYYYN',
  'YYYYYmmYYYYY',
];

// The person inside a house: where they stand, where they look and whether they wander all vary from house to house.
const SPOTS = [
  { x: 6, y: 3, dir: 'left' }, { x: 2, y: 4, dir: 'right' }, { x: 7, y: 5, dir: 'up', wander: true }, { x: 5, y: 6, dir: 'down' },
  { x: 1, y: 2, dir: 'down' }, { x: 7, y: 6, dir: 'left', wander: true }, { x: 8, y: 2, dir: 'down' }, { x: 3, y: 6, dir: 'up' },
];
const hashOf = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const casaNpc = (look, text) => {
  const t = [].concat(text);
  const spot = SPOTS[hashOf(t[0]) % SPOTS.length];
  return { ...spot, look, text: t };
};
export const nurse = { x: 5, y: 1, look: 'nurse', dir: 'down', script: 'nurse' };
export const pc = { x: 9, y: 1, look: null, script: 'pc' };
export const poli = (name) => room(POLI, { name, theme: 'poli', heal: true, npcs: [nurse, pc, { x: 2, y: 5, look: 'oldman', wander: true, text: ['La Policlínica atiende gratis. Es un servicio público.'] }] });
export const shop = (name, stock) => room(SHOP, { name, npcs: [{ x: 1, y: 2, look: 'clerk', dir: 'down', script: 'shop', stock }] });

