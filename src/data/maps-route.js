// The cities, localities and roads added when the adventure became a 19-city route from Colonia
// to Montevideo (see route.js). Maps come from map-gen.js; `rewire` then connects every map on the
// chain to its neighbours and locks each city's road forward until the story opens it.
import { TR, room, HOUSE, GYM, poli, shop } from './map-kit.js';
import { city, route, wildList, teamOf, fitToMap, rng } from './map-gen.js';
import { STOPS, STOP_INDEX, CHAIN, mapBand, openFlag } from './route.js';
import { BIOMES, DEPARTMENTS, PLACES } from './atlas.js';
import { TILE_INFO } from '../gfx/tiles.js';

const DEPT = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));
const typesOf = (stopId) => BIOMES[DEPT[STOPS[STOP_INDEX[stopId]].dept].biome].types;

// ---------------------------------------------------------------- what each new place says about itself
const NEW = {
  sanjose: ['city', ['San José de Mayo, capital de un departamento de tambos y chacras.', 'Acá se hace la Fiesta de la Torta Frita, y nadie se queda con las ganas.'], 'Intendencia'],
  ecilda: ['loc', ['Ecilda Paullier vive del campo y de los viajeros que pasan por la ruta 1.', 'Un mate en el almacén y seguís camino.']],
  trinidad: ['city', ['Trinidad queda en el centro del país. Dicen que desde acá todo queda cerca.', 'La Plaza Independencia tiene la fuente más fotografiada de Flores.'], 'Centro de tropas'],
  palmitas: ['loc', ['Palmitas es chica, pero cruzan camiones de granos todo el día.', 'Los silos se ven desde varios kilómetros.']],
  mercedes: ['city', ['Mercedes mira al río Negro. Es la ciudad de los pescadores y de los remeros.', 'En primavera la costanera se llena de gente tomando mate.'], 'Club de remo'],
  villasoriano: ['loc', ['Villa Soriano fue el primer pueblo del país. Todavía se nota en las calles.', 'Desde el puerto sale el ferry hacia las islas del río Negro.']],
  young: ['loc', ['Young es un pueblo de gente trabajadora. El frigorífico de Fray Bentos queda cerca.', 'Acá se hacen los mejores chivitos de Río Negro, dicen.']],
  guichon: ['loc', ['Guichón tiene termas y una feria de artesanos.', 'Los fines de semana la plaza se llena de familias.']],
  belen: ['loc', ['Belén es un pueblo de citricultores y de pescadores del río Uruguay.', 'Las naranjas de Salto empiezan a verse desde acá.']],
  artigas: ['city', ['Artigas es la ciudad más al norte del país, pegada a Brasil.', 'Las piedras semipreciosas de la zona son famosas: ágatas y amatistas.'], 'Cooperativa de mineros'],
  baltasar: ['loc', ['Baltasar Brum queda junto a la cuchilla de Haedo.', 'Mucha gente cruza la frontera a hacer compras y vuelve al atardecer.']],
  tranqueras: ['loc', ['Tranqueras es la puerta de entrada al departamento de Rivera por el sur.', 'Los gauchos la llaman "el portón del Norte".']],
  tupambae: ['loc', ['Tupambaé es un paraje de lomadas y estancias. Se oye más el viento que a la gente.', 'Hay tradiciones criollas que acá no cambiaron nunca.']],
  melo: ['city', ['Melo es la capital de Cerro Largo. Limita con Brasil y con la laguna Merín.', 'Su carnaval y sus ferias de frontera son parte del orgullo local.'], 'Peña criolla'],
  cerrochato: ['loc', ['Cerro Chato está justo en el medio del país, donde se cruzan tres departamentos.', 'Los carteles dicen: "El centro de la patria".']],
  lascano: ['loc', ['Lascano queda al borde de los bañados de Rocha.', 'Los arroceros y los guías de aves comparten la plaza.']],
  rocha: ['city', ['Rocha guarda lagunas, palmares y las playas más tranquilas del Atlántico.', 'Los fines de semana vienen turistas a ver el amanecer sobre la laguna.'], 'Centro de guardaparques'],
  casupa: ['loc', ['Casupá es un pueblo en medio de las cuchillas, camino entre Minas y Florida.', 'El arroyo del mismo nombre baja cristalino y frío.']],
  florida: ['city', ['Florida es la cuna de la independencia: acá se declaró el 25 de agosto de 1825.', 'La Piedra Alta está en el centro: ahí se juró la libertad.'], 'Piedra Alta'],
  sarandi: ['loc', ['Sarandí Grande es un pueblo chico con una plaza grande y una escuela grande.', 'Cerca de acá pasó la caballería de los Treinta y Tres.']],
  sanramon: ['loc', ['San Ramón es famoso por sus quesos y por su feria de domingo.', 'Se huele la masa de las tortas fritas desde la entrada.']],
  canelones: ['city', ['Canelones es la capital del departamento que rodea a Montevideo.', 'Los viñedos de la zona producen el tannat que se sirve en todo el país.'], 'Bodega'],
  laspiedras: ['loc', ['Las Piedras es la ciudad de las batallas: acá se ganó la primera victoria patriota.', 'Montevideo queda a un paso, y se nota en el ruido.']],
};

// ---------------------------------------------------------------- which way each leg of the journey heads
// Derived from the atlas coordinates, so the road really goes north, south, east or west like the country does.
const OPP = { e: 'w', w: 'e', n: 's', s: 'n' };
const LEG_DIR = {};
const OWNER = {};
STOPS.forEach((st, k) => {
  const nx = STOPS[k + 1];
  for (const mapId of [st.id, ...st.via]) OWNER[mapId] = k;
  if (!nx) return;
  const a = PLACES.find((p) => p.id === st.id), b = PLACES.find((p) => p.id === nx.id);
  const dx = (b.lon - a.lon) * 0.82, dy = b.lat - a.lat;
  LEG_DIR[k] = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 'n' : 's');
});
/** Side of `mapId` the road to the next map leaves through. */
const dirOf = (mapId) => LEG_DIR[OWNER[mapId]];
const ARROW = { e: '→', w: '←', n: '↑', s: '↓' };

const LOOKS = ['boy', 'girl', 'gaucho', 'oldman', 'clerk', 'sailor'];
const TRAINERS = [
  ['Naturalista', ['bicho', 'planta'], ['Estudio las especies de esta zona.', 'Anoto el resultado.', 'Seguí por el camino principal.']],
  ['Peón', ['normal', 'lucha'], ['Pasé la mañana arreando, ahora toca combatir.', 'Se me escapó la tropilla y el combate.', 'Buen viaje.']],
  ['Estudiante', ['normal', 'volador'], ['Voy camino a la escuela, pero un combate no me retrasa.', 'Llegaré tarde, pero valió la pena.', 'Aprendí algo nuevo.']],
  ['Pescador', ['agua'], ['Hoy no pica nada, así que combatamos.', 'Mejor pesco.', 'El río da y quita.']],
  ['Viajero', ['normal', 'tierra'], ['Voy de paso, pero no rechazo un combate.', 'Qué bien peleás.', 'Que tengas buen camino.']],
  ['Baqueano', ['planta', 'tierra'], ['Conozco cada rincón de este camino.', 'Me ganaste de local.', 'Seguí derecho.']],
];

const casaNpc = (look, text) => ({ x: 6, y: 3, look, dir: 'left', text: [].concat(text) });
const npc = (x, y, look, text, extra = {}) => ({ x, y, look, text: [].concat(text), ...extra });

const stockAt = (i) => (i < 9 ? ['esfera', 'te_marcela', 'ruda', 'alfajor']
  : i < 20 ? ['esfera', 'superesfera', 'te_marcela', 'mate', 'ruda', 'linimento', 'alfajor', 'repelente']
    : i < 30 ? ['superesfera', 'ultraesfera', 'mate', 'mate_dulce', 'aloe', 'despertador', 'alfajor', 'torta_frita']
      : ['ultraesfera', 'mate_dulce', 'dulce_de_leche', 'aloe', 'despertador', 'torta_frita', 'chivito']);

// Gyms of the cities that have one here (the older cities with a gym are built in maps-act2.js).
const GYM_TYPE = { inc: 'tierra', correo: 'normal', boiso: 'volador', inavi: 'bicho' };
const GYM_NAME = { inc: 'Instituto de Colonización', correo: 'Correo Uruguayo', boiso: 'Escuela de Aviación', inavi: 'Instituto de Vitivinicultura' };
const GYM_TRAINERS = {
  tierra: [['Aureliano', 'Colono', ['La tierra no perdona al que no trabaja.', 'Me dio una buena lección.', 'Elena te espera al fondo.']], ['Mirta', 'Agrónoma', ['Conozco cada suelo de Flores.', 'Quedé enterrada…', 'Seguí, el suelo es firme.']]],
  normal: [['Fabián', 'Cartero', ['Entrego todo, hasta combates.', 'Paquete devuelto.', 'Marta está al fondo.']], ['Silvia', 'Telegrafista', ['Mensaje urgente: te voy a ganar.', 'Mensaje no entregado.', 'Pasá, la presidenta espera.']]],
  volador: [['Ismael', 'Aeromodelista', ['Mi planeador y yo somos uno.', 'Aterricé mal.', 'El maestro Boiso está arriba.']], ['Clara', 'Paracaidista', ['Un salto y listo.', 'Se me abrió tarde.', 'Seguí adelante.']]],
  bicho: [['Gabriel', 'Viñatero', ['Los bichos cuidan mis uvas.', 'Cosecha perdida.', 'Tomás te espera.']], ['Rosa', 'Apicultora', ['Cuidado con el aguijón.', 'Me picó la derrota.', 'Seguí, no te voy a frenar.']]],
};
export const ROUTE_OUTDOOR = {};
export const ROUTE_INTERIOR = {};

/** Put NPCs and items on free ground, away from roads. */
function settle(m) {
  const taken = new Set();
  fitToMap(m.tiles, m.npcs ?? [], taken);
  fitToMap(m.tiles, m.items ?? [], taken);
}


// ---------------------------------------------------------------- town layouts
// Every generated town picks one of these, so no two neighbours look alike: plazas with a fountain,
// a river with bridges, a seafront, a long road town, a park, hills. Slots are [street, x, size]:
// 'L' fits a gym (7 wide), 'S' a Policlínica, shop or house (5 wide).
const A = 'a', B = 'b', C = 'c';
const CITY_STYLES = {
  plaza: { w: 32, h: 22, sa: 6, sb: 16, vroads: [7, 24], plazas: [[11, 7, 10, 6]], decor: { '#': 8, f: 10 },
    slots: [[A, 2, 'L'], [A, 11, 'L'], [A, 20, 'L'], [B, 2, 'S'], [B, 9, 'S'], [B, 15, 'S'], [B, 26, 'S']] },
  rio: { w: 34, h: 20, sa: 7, sb: 15, vroads: [13, 22], water: [[16, 1, 3, 18]], bridges: [[16, 18, 7], [16, 18, 15]], decor: { '#': 8, f: 6 },
    slots: [[A, 2, 'L'], [A, 9, 'S'], [A, 20, 'L'], [A, 28, 'S'], [B, 2, 'S'], [B, 8, 'S'], [B, 24, 'S'], [B, 29, 'S']] },
  costa: { w: 36, h: 18, sa: 6, sb: 11, vroads: [9, 26], water: [[1, 13, 34, 4]], decor: { '#': 6, f: 6 },
    slots: [[A, 2, 'L'], [A, 11, 'L'], [A, 20, 'L'], [A, 29, 'S'], [B, 3, 'S'], [B, 12, 'S'], [B, 19, 'S'], [B, 29, 'S']] },
  cruz: { w: 30, h: 26, sa: 7, sb: 15, sc: 23, vroads: [14], decor: { '#': 10, f: 8, q: 4 },
    slots: [[A, 2, 'L'], [A, 11, 'L'], [A, 20, 'L'], [B, 2, 'S'], [B, 8, 'S'], [B, 17, 'S'], [B, 23, 'S'], [C, 3, 'S'], [C, 9, 'S'], [C, 17, 'S'], [C, 23, 'S']] },
  parque: { w: 28, h: 22, sa: 6, sb: 16, vroads: [13], groves: [[3, 8, 9, 6, '#']], water: [[16, 9, 6, 4]], decor: { f: 10, q: 4 },
    slots: [[A, 2, 'L'], [A, 10, 'S'], [A, 15, 'L'], [B, 2, 'S'], [B, 8, 'S'], [B, 17, 'S'], [B, 22, 'S']] },
  cerros: { w: 30, h: 20, sa: 7, sb: 14, vroads: [10, 20], decor: { R: 14, '#': 6, f: 4 },
    slots: [[A, 2, 'L'], [A, 12, 'L'], [A, 22, 'S'], [B, 3, 'S'], [B, 14, 'S'], [B, 23, 'S']] },
  larga: { w: 44, h: 14, sa: 8, groves: [[3, 10, 38, 2, 'q']], decor: { '#': 8, f: 10 },
    slots: [[A, 2, 'L'], [A, 10, 'S'], [A, 16, 'S'], [A, 22, 'L'], [A, 30, 'S'], [A, 36, 'S']] },
  calle: { w: 26, h: 18, sa: 6, sb: 13, vroads: [14], decor: { '#': 10, q: 5, f: 10 },
    slots: [[A, 1, 'L'], [A, 9, 'S'], [A, 15, 'S'], [A, 21, 'S'], [B, 4, 'S'], [B, 16, 'S']] },
};
const LOC_STYLES = {
  ruta: { w: 30, h: 12, sa: 7, decor: { '#': 8, f: 6 }, slots: [[A, 3, 'S'], [A, 10, 'S'], [A, 17, 'S'], [A, 24, 'S']] },
  plazita: { w: 24, h: 16, sa: 6, plazas: [[9, 8, 6, 5]], decor: { '#': 6, f: 8 }, slots: [[A, 2, 'S'], [A, 9, 'S'], [A, 16, 'S']] },
  arroyo: { w: 26, h: 16, sa: 7, water: [[12, 1, 2, 14]], bridges: [[12, 13, 7]], decor: { '#': 8, f: 6 }, slots: [[A, 2, 'S'], [A, 7, 'S'], [A, 15, 'S'], [A, 20, 'S']] },
  cerrito: { w: 24, h: 20, sa: 8, sb: 15, vroads: [11], decor: { R: 8, '#': 6 }, slots: [[A, 3, 'S'], [A, 15, 'S'], [B, 3, 'S'], [B, 15, 'S']] },
  costera: { w: 28, h: 14, sa: 6, water: [[1, 9, 26, 3]], decor: { '#': 4, f: 6 }, slots: [[A, 3, 'S'], [A, 11, 'S'], [A, 19, 'S']] },
  cruce: { w: 22, h: 22, sa: 7, sb: 15, vroads: [10], decor: { '#': 8, f: 6 }, slots: [[A, 2, 'S'], [A, 14, 'S'], [B, 2, 'S'], [B, 14, 'S']] },
};
const CITY_ORDER = ['plaza', 'rio', 'costa', 'cruz', 'parque', 'cerros', 'larga', 'calle'];
const LOC_ORDER = ['ruta', 'plazita', 'arroyo', 'cerrito', 'costera', 'cruce'];
const DECOR_HOUSES = ['house', 'houseB', 'houseG', 'houseO'];

/** Lay out a town: required buildings first (gym on a large slot), the other slots get plain houses. */
function layoutTown(styleName, table, id, required) {
  const st = table[styleName];
  const r = rng(`town${id}`);
  const free = st.slots.map((s, k) => ({ s, k }));
  const slotFor = (kind) => {
    const pool = free.filter(({ s }) => (kind === 'gym' ? s[2] === 'L' : true));
    // prefer small slots for small buildings so large ones stay available
    const small = kind === 'gym' ? pool : (pool.filter(({ s }) => s[2] === 'S').length ? pool.filter(({ s }) => s[2] === 'S') : pool);
    const pick = small[Math.floor(r() * small.length)];
    free.splice(free.indexOf(pick), 1);
    return pick.s;
  };
  const rowsOf = { a: [], b: [], c: [] };
  for (const [kind, target] of required) {
    const [row, x] = slotFor(kind);
    rowsOf[row].push([kind === 'gym' ? target.gym : kind === 'house2' ? 'houseG' : kind, x, target.to]);
  }
  free.forEach(({ s: [row, x, size] }, i) => rowsOf[row].push([size === 'L' ? 'houseB' : DECOR_HOUSES[i % 4], x]));
  const G = city({ seed: id, w: st.w, h: st.h, sa: st.sa, sb: st.sb ?? 0, sc: st.sc ?? 0, a: rowsOf.a, b: rowsOf.b, c: rowsOf.c, vroads: st.vroads ?? [], decor: st.decor ?? {}, water: st.water ?? [], plazas: st.plazas ?? [], groves: st.groves ?? [], bridges: st.bridges ?? [], signs: [[st.w - 3, st.sa + 1]] });
  const want = required.length;
  const doors = G.tiles.join('').split('').filter((c) => c === 'D').length;
  if (doors !== G.doors.length || G.doors.length < want) throw new Error(`pueblo ${id} (${styleName}): edificios superpuestos`);
  return { G, st };
}

// ---------------------------------------------------------------- cities and localities
for (const [id, [kind, lines, place]] of Object.entries(NEW)) {
  const stop = STOPS[STOP_INDEX[id]];
  const i = STOP_INDEX[id];
  const [lo, hi] = mapBand(id);
  const types = typesOf(id);
  const isCity = kind === 'city';
  const gymType = isCity && stop.gym ? GYM_TYPE[stop.gym] : null;
  const required = [
    ...(gymType ? [['gym', { gym: gymType, to: `gym_${id}` }]] : []),
    ...(isCity ? [['poli', { to: `poli_${id}` }]] : []),
    ['shop', { to: `shop_${id}` }],
    ['house', { to: `casa_${id}` }],
    ...(isCity ? [['house2', { to: `casa_${id}2` }]] : []),
  ];
  const kindIdx = Object.keys(NEW).filter((k) => (NEW[k][0] === 'city') === isCity).indexOf(id);
  const order = isCity ? CITY_ORDER : LOC_ORDER;
  const { G, st } = layoutTown(order[kindIdx % order.length], isCity ? CITY_STYLES : LOC_STYLES, id, required);
  ROUTE_OUTDOOR[id] = {
    name: stop.name, music: 'town', bg: 'field', tiles: G.tiles, doors: [...G.doors],
    signs: [`${stop.name.toUpperCase()}\n${lines[0]}`],
    exits: {},
    enc: { rate: 0.1, list: wildList(types, lo, hi, 6, id) },
    fish: undefined,
    npcs: [
      npc(st.w >> 1, st.sa + 2, LOOKS[i % LOOKS.length], lines, { wander: true }),
      npc((st.w >> 1) + 4, st.sa + 3, LOOKS[(i + 2) % LOOKS.length], [lines[1], isCity ? 'La Policlínica y el almacén están sobre la calle principal.' : 'Acá hay un almacén y poco más. Es lo bueno del pueblo.'], { dir: 'down' }),
      ...(isCity && !stop.gym ? [{ x: 5, y: st.sa + 2, look: 'cop', dir: 'right', script: 'town_gate', stop: id }] : []),
    ],
  };
  settle(ROUTE_OUTDOOR[id]);
  if (gymType) {
    const [lo2, hi2] = [Math.max(2, mapBand(id)[1] - 3), mapBand(id)[1] + 1];
    ROUTE_INTERIOR[`gym_${id}`] = room(GYM, {
      name: `${GYM_NAME[stop.gym]} (${stop.name})`, theme: `gym_${gymType}`,
      npcs: [
        { x: 5, y: 2, look: `leader_${stop.gym}`, dir: 'down', script: 'leader', leader: stop.gym },
        ...GYM_TRAINERS[gymType].map(([nm, cls, [intro, lose, after]], k) => {
          const spot = k ? { x: 3, y: 9, dir: 'right' } : { x: 8, y: 6, dir: 'left' };
          return { ...spot, look: LOOKS[(i + k) % LOOKS.length], sight: 4, trainer: TR(`g_${id}_${k}`, nm, cls, teamOf([gymType], [lo2 + k, hi2], `g${id}${k}`), (hi2 + 2) * 20, intro, lose, after) };
        }),
      ],
    });
  }
  if (isCity) ROUTE_INTERIOR[`poli_${id}`] = poli(`Policlínica de ${stop.name}`);
  ROUTE_INTERIOR[`shop_${id}`] = shop(`Almacén de ${stop.name}`, stockAt(i));
  if (id === 'sanjose') ROUTE_INTERIOR.shop_sanjose.npcs[0].script = 'shop_carta';
  ROUTE_INTERIOR[`casa_${id}`] = room(HOUSE, { name: `Casa en ${stop.name}`, npcs: [casaNpc(LOOKS[(i + 1) % LOOKS.length], isCity && place ? [`Soy del ${place}.`, lines[1]] : lines)] });
  if (isCity) ROUTE_INTERIOR[`casa_${id}2`] = room(HOUSE, { name: `Otra casa en ${stop.name}`, npcs: [casaNpc(LOOKS[(i + 3) % LOOKS.length], [lines[1], 'Cuando pasa gente de afuera, se anima el pueblo.'])] });
}

// ---------------------------------------------------------------- roads between stops
// Road shapes: w x h are for an east-west road (a north-south one swaps them).
const ROUTE_STYLES = [
  { w: 30, h: 16, grass: [[4, 3, 4]], ponds: [], trees: 8, rocks: 4, sign: 'Un camino de tierra y pasto, con tránsito de tropas y de camiones.' },
  { w: 46, h: 16, grass: [[6, 3, 4]], ponds: [], trees: 16, rocks: 6, sign: 'Un camino largo entre estancias y alambrados.' },
  { w: 36, h: 24, grass: [[3, 3, 5]], ponds: [[2, 5, 3]], trees: 10, rocks: 4, sign: 'Pasto alto y bañados a los costados. Cuidado con el barro.' },
  { w: 54, h: 14, grass: [[5, 3, 4]], ponds: [], trees: 8, rocks: 3, bridge: [26, 29], sign: 'Un puente de madera cruza el arroyo.' },
  { w: 34, h: 28, grass: [[2, 3, 4]], ponds: [], trees: 6, rocks: 14, sign: 'Tierra pedregosa y cerros bajos. Se camina despacio.' },
  { w: 42, h: 20, grass: [[4, 3, 5]], ponds: [[1, 6, 4]], trees: 12, rocks: 5, sign: 'Un monte criollo bordea la ruta.' },
];

let rn = 0;
for (const s of STOPS) for (const via of s.via) {
  if (!via.startsWith('r_')) continue;
  const [lo, hi] = mapBand(via);
  const a = STOPS[STOP_INDEX[s.id]];
  const b = STOPS[STOP_INDEX[s.id] + 1];
  const types = [...new Set([...typesOf(a.id), ...typesOf(b.id)])];
  const dir = dirOf(via);
  const vertical = dir === 'n' || dir === 's';
  const sty = ROUTE_STYLES[(rn * 5 + 2) % ROUTE_STYLES.length];
  const [lw, lh] = vertical ? [sty.h, sty.w] : [sty.w, sty.h];
  const mid = (vertical ? lw : lh) >> 1;
  const lane = mid + ((rn % 3) - 1) * 2;
  const R = route({ seed: via, w: lw, h: lh, axis: vertical ? 'v' : 'h', from: lane, to: lane, grass: sty.grass, ponds: sty.ponds, trees: sty.trees, treeChar: rn % 2 ? '#' : 'q', rocks: sty.rocks, flowers: 8, bridge: sty.bridge ?? null });
  const fishTrainer = (k) => TRAINERS[(rn + k) % TRAINERS.length];
  const ts = [0, 1, 2].filter((k) => R.spots[k]).map((k) => {
    const [cls, tt, [intro, lose, after]] = fishTrainer(k);
    const lv = [Math.max(lo, hi - 2 + (k % 2)), Math.min(hi, hi - (k % 2))];
    const nm = ['Gonzalo', 'Mariana', 'Atilio', 'Rosario', 'Julián', 'Lucía', 'Bruno', 'Carmen'][(rn * 3 + k) % 8];
    return { x: R.spots[k].x, y: R.spots[k].y, look: LOOKS[(rn + k) % 5], dir: R.spots[k].dir, sight: 4, trainer: TR(`${via}_${k}`, nm, cls, teamOf(tt, lv, `${via}${k}`), Math.round(lv[1] * 20), intro, lose, after) };
  });
  ROUTE_OUTDOOR[via] = {
    name: `Camino a ${b.name}`, music: 'route', bg: 'field', tiles: R.tiles,
    signs: [`${a.name.toUpperCase()} ${ARROW[OPP[dir]]}  ·  ${b.name.toUpperCase()} ${ARROW[dir]}\n${sty.sign}`].slice(0, R.signs.length),
    exits: {},
    enc: { rate: 0.12, list: wildList(types, lo, hi, 8, via) },
    fish: undefined,
    npcs: ts,
    items: R.itemSpots[0] ? [{ ...R.itemSpots[0], item: hi > 30 ? 'ultraesfera' : hi > 14 ? 'superesfera' : 'esfera', id: `${via}_item1` }] : [],
  };
  settle(ROUTE_OUTDOOR[via]);
  rn++;
}

// ---------------------------------------------------------------- wiring
const KEEP_TARGETS = new Set(['ciclovia', 'cabo']); // dead-end branches that keep their own exits
const CARVABLE = new Set('.,#qpRFfKks%`;=cb'.split(''));
const walkable = (ch) => ch !== undefined && !TILE_INFO[ch]?.solid;

/** Open a walkable corridor from the edge `side` of a map inwards. Returns false if no clean line exists. */
function carve(m, side) {
  const g = m.tiles.map((r) => [...r]);
  const H = g.length, W = g[0].length;
  const len = side === 'e' || side === 'w' ? H : W;
  const mid = len >> 1;
  const order = [...Array(len).keys()].filter((c) => c >= 2 && c <= len - 3).sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid));
  for (const c of order) {
    const cells = [];
    let ok = false;
    for (let d = 0; d < 12; d++) {
      const x = side === 'w' ? d : side === 'e' ? W - 1 - d : c;
      const y = side === 'n' ? d : side === 's' ? H - 1 - d : c;
      const ch = g[y][x];
      if (d >= 1 && walkable(ch) && ch !== '~') { ok = true; break; }
      if (!CARVABLE.has(ch)) break;
      cells.push([x, y]);
    }
    if (!ok) continue;
    for (const [x, y] of cells) g[y][x] = '=';
    m.tiles = g.map((r) => r.join(''));
    return true;
  }
  return false;
}

const edgeOpen = (m, side) => {
  const W = m.tiles[0].length, H = m.tiles.length;
  const cells = side === 'w' ? m.tiles.map((r) => r[0]) : side === 'e' ? m.tiles.map((r) => r[W - 1]) : side === 'n' ? [...m.tiles[0]] : [...m.tiles[H - 1]];
  return cells.some((ch) => walkable(ch) && ch !== '~');
};

const FWD_DENY = (a, b) => (a.gym
  ? [`El camino a ${b} está cerrado.`, `Un guardia dice: "Primero tenés que ganar la medalla de ${a.name}."`]
  : a.id === 'colonia'
    ? ['Antes de salir hace falta una criatura.', 'El Maestro Tabárez te espera en el laboratorio.']
    : a.kind === 'city'
      ? [`El camino a ${b} está cerrado.`, `Habla con la gente de ${a.name}: alguien necesita una mano para abrir el paso.`]
      : []);

/** Connect the whole chain: each consecutive pair of maps gets an exit on opposite sides. */
export function rewire(OUTDOOR) {
  const had = {};
  const extras = {};
  for (const id of CHAIN) {
    const m = OUTDOOR[id];
    had[id] = new Set(Object.keys(m.exits ?? {}));
    extras[id] = Object.fromEntries(Object.entries(m.exits ?? {}).filter(([, e]) => KEEP_TARGETS.has(e.to)));
  }
  // maps that link back to a kept branch keep that link too
  for (const [id, m] of Object.entries(OUTDOOR)) {
    if (KEEP_TARGETS.has(id)) {
      const back = Object.entries(m.exits ?? {}).find(([, e]) => CHAIN.includes(e.to));
      if (back) extras[id] = { [back[0]]: back[1] };
    }
  }
  for (const id of CHAIN) OUTDOOR[id].exits = { ...extras[id] };
  const taken = (id, side) => OUTDOOR[id].exits[side] !== undefined;
  for (let k = 0; k < CHAIN.length - 1; k++) {
    const A = CHAIN[k], B = CHAIN[k + 1];
    const a = OUTDOOR[A], b = OUTDOOR[B];
    if (!a || !b) throw new Error(`mapa de la ruta inexistente: ${!a ? A : B}`);
    const sides = ['e', 'w', 'n', 's'];
    const heading = dirOf(A);
    const score = (s) => (s === heading ? 6 : 0) + (had[A].has(s) ? 2 : 0) + (had[B].has(OPP[s]) ? 2 : 0) + (edgeOpen(a, s) ? 1 : 0) + (edgeOpen(b, OPP[s]) ? 1 : 0) + (s === 'e' ? 0.1 : 0);
    const cand = sides.filter((s) => !taken(A, s) && !taken(B, OPP[s])).sort((x, y) => score(y) - score(x));
    let done = false;
    for (const s of cand) {
      const ca = edgeOpen(a, s) || carve(a, s);
      const cb = edgeOpen(b, OPP[s]) || carve(b, OPP[s]);
      if (!ca || !cb) continue;
      const stopA = STOPS[STOP_INDEX[A]];
      const fwd = stopA && STOP_INDEX[B] !== undefined ? STOPS[STOP_INDEX[B]].name : OUTDOOR[B].name.replace(/^Camino a /, '');
      const exit = { to: B };
      if (stopA && (stopA.kind === 'city')) {
        const flag = A === 'colonia' ? 'has_starter' : openFlag(A);
        exit.req = flag;
        exit.deny = FWD_DENY(stopA, fwd);
      }
      a.exits[s] = exit;
      b.exits[OPP[s]] = { to: A };
      done = true;
      break;
    }
    if (!done) throw new Error(`no se pudo conectar ${A} con ${B}`);
  }
}
