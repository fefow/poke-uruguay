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
export const casaNpc = (look, text, other = null) => {
  const t = [].concat(text);
  let k = hashOf(t[0]) % SPOTS.length;
  // a second resident never stands on, or right next to, the first one
  while (other && Math.abs(SPOTS[k].x - other.x) + Math.abs(SPOTS[k].y - other.y) < 3) k = (k + 1) % SPOTS.length;
  return { ...SPOTS[k], look, text: t };
};
export const nurse = { x: 5, y: 1, look: 'nurse', dir: 'down', script: 'nurse' };
export const pc = { x: 9, y: 1, look: null, script: 'pc' };
const PATIENTS = [
  ['abuela', ['La Policlínica atiende gratis. Es un servicio público.']],
  ['obrero', ['Me torcí el tobillo en la obra. Acá me atienden enseguida.']],
  ['nino', ['Vine a vacunarme. ¡No dolió nada!']],
  ['campesina', ['Hice cuarenta kilómetros para llegar. Vale la pena: te curan todo el equipo.']],
  ['oldman', ['Vengo todos los jueves a control. Más que paciente, soy parte del mobiliario.']],
];
export const poli = (name) => {
  const [look, text] = PATIENTS[hashOf(name) % PATIENTS.length];
  return room(POLI, { name, theme: 'poli', heal: true, npcs: [nurse, pc, { x: 2, y: 5, look, wander: true, text }] });
};
// Every shop has its own keeper and a customer chatting; the keeper's job decides how they greet you.
const KEEPERS = [
  ['clerk', 'Almacenero', 'Buenas. ¿Qué se lleva?'],
  ['almacenero', 'Don Atilio', 'Pase, pase. Hay de todo, y lo que no hay lo consigo.'],
  ['cocinero', 'Cocinero', 'Estoy con el horno prendido. ¿Le sirvo algo o se lleva algo?'],
  ['abuela', 'Doña Rosa', 'Mirá qué lindo día. ¿Qué te hace falta, mi vida?'],
  ['campesina', 'Dueña', 'Todo fresco, de la chacra. ¿Qué va a llevar?'],
];
const CUSTOMERS = [
  ['turista', ['Vine de paso y me quedé a comprar mate para toda la familia.', 'Acá todo cuesta menos que en la ciudad.']],
  ['camionero', ['Hago la ruta todos los días. Siempre paro acá por un bizcocho.']],
  ['estudiante', ['Estoy juntando para una mochila. Pero siempre termino comprando alfajores.']],
  ['hincha', ['¿Viste el partido de ayer? No quiero hablar del tema.']],
  ['murguero', ['Compro la yerba para el ensayo. Sin mate no hay murga.']],
];
export const shop = (name, stock) => {
  const [look, clerkName, greeting] = KEEPERS[hashOf(name) % KEEPERS.length];
  const [cl, ct] = CUSTOMERS[hashOf(name + 'c') % CUSTOMERS.length];
  return room(SHOP, { name, npcs: [{ x: 1, y: 2, look, dir: 'down', script: 'shop', stock, greeting, clerkName }, { x: 6, y: 4, look: cl, dir: 'left', wander: true, text: ct }] });
};

