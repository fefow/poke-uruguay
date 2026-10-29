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

export const nurse = { x: 5, y: 1, look: 'nurse', dir: 'down', script: 'nurse' };
export const pc = { x: 9, y: 1, look: null, script: 'pc' };
export const poli = (name) => room(POLI, { name, theme: 'poli', heal: true, npcs: [nurse, pc, { x: 2, y: 5, look: 'oldman', wander: true, text: ['La Policlínica atiende gratis. Es un servicio público.'] }] });
export const shop = (name, stock) => room(SHOP, { name, npcs: [{ x: 1, y: 2, look: 'clerk', dir: 'down', script: 'shop', stock }] });

