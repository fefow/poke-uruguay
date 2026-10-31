// The adventure's backbone: 19 cities from Carmelo to Montevideo, with a locality between
// every pair. Everything that depends on the order of the story (level curve, which border opens when,
// the atlas, gym order) is derived from this one table.
import { deepFreeze } from '../core/util.js';

/**
 * kind: 'city' | 'loc'. map: id of the map that represents the stop. gym: leader key (cities with a gym).
 * dept: department id (see atlas DEPARTMENTS). chain: maps walked, in order, from this stop to the next
 * (routes between stops; the stop itself is not repeated).
 */
export const STOPS = deepFreeze([
  { id: 'carmelo', name: 'Carmelo', kind: 'city', dept: 'colonia', via: ['ruta1'] },
  { id: 'colonia', name: 'Colonia del Sacramento', kind: 'city', dept: 'colonia', via: ['r_colonia_rosario'] },
  { id: 'rosario', name: 'Rosario', kind: 'loc', dept: 'colonia', via: ['r_rosario_sanjose'] },
  { id: 'sanjose', name: 'San José de Mayo', kind: 'city', dept: 'sanjose', via: [] },
  { id: 'ecilda', name: 'Ecilda Paullier', kind: 'loc', dept: 'sanjose', via: ['r_ecilda_trinidad'] },
  { id: 'trinidad', name: 'Trinidad', kind: 'city', dept: 'flores', gym: 'inc', via: [] },
  { id: 'palmitas', name: 'Palmitas', kind: 'loc', dept: 'soriano', via: ['r_palmitas_mercedes'] },
  { id: 'mercedes', name: 'Mercedes', kind: 'city', dept: 'soriano', gym: 'correo', via: [] },
  { id: 'villasoriano', name: 'Villa Soriano', kind: 'loc', dept: 'soriano', via: ['r_villasoriano_fraybentos'] },
  { id: 'fraybentos', name: 'Fray Bentos', kind: 'city', dept: 'rionegro', gym: 'anglo', via: [] },
  { id: 'young', name: 'Young', kind: 'loc', dept: 'rionegro', via: ['ruta24'] },
  { id: 'paysandu', name: 'Paysandú', kind: 'city', dept: 'paysandu', via: [] },
  { id: 'guichon', name: 'Guichón', kind: 'loc', dept: 'paysandu', via: ['ruta3'] },
  { id: 'salto', name: 'Salto', kind: 'city', dept: 'salto', gym: 'quiroga', via: [] },
  { id: 'belen', name: 'Belén', kind: 'loc', dept: 'salto', via: ['r_belen_artigas'] },
  { id: 'artigas', name: 'Artigas', kind: 'city', dept: 'artigas', via: [] },
  { id: 'baltasar', name: 'Baltasar Brum', kind: 'loc', dept: 'artigas', via: ['r_baltasar_rivera'] },
  { id: 'rivera', name: 'Rivera', kind: 'city', dept: 'rivera', gym: 'defensa', via: [] },
  { id: 'tranqueras', name: 'Tranqueras', kind: 'loc', dept: 'rivera', via: ['ruta30'] },
  { id: 'tacuarembo', name: 'Tacuarembó', kind: 'city', dept: 'tacuarembo', gym: 'mgap', via: [] },
  { id: 'tupambae', name: 'Tupambaé', kind: 'loc', dept: 'cerrolargo', via: ['r_tupambae_melo'] },
  { id: 'melo', name: 'Melo', kind: 'city', dept: 'cerrolargo', via: [] },
  { id: 'cerrochato', name: 'Cerro Chato', kind: 'loc', dept: 'treintaytres', via: ['r_cerrochato_quebrada'] },
  { id: 'quebrada', name: 'Treinta y Tres', kind: 'city', dept: 'treintaytres', gym: 'lavalleja', via: [] },
  { id: 'lascano', name: 'Lascano', kind: 'loc', dept: 'rocha', via: ['r_lascano_rocha'] },
  { id: 'rocha', name: 'Rocha', kind: 'city', dept: 'rocha', via: ['r_rocha_paloma'] },
  { id: 'paloma', name: 'La Paloma', kind: 'loc', dept: 'rocha', via: [] },
  { id: 'punta', name: 'Maldonado', kind: 'city', dept: 'maldonado', gym: 'ose', via: [] },
  { id: 'piriapolis', name: 'Piriápolis', kind: 'loc', dept: 'maldonado', via: ['r_piriapolis_minas'] },
  { id: 'minas', name: 'Minas', kind: 'city', dept: 'lavalleja', via: [] },
  { id: 'casupa', name: 'Casupá', kind: 'loc', dept: 'florida', via: ['r_casupa_florida'] },
  { id: 'florida', name: 'Florida', kind: 'city', dept: 'florida', gym: 'boiso', via: [] },
  { id: 'sarandi', name: 'Sarandí Grande', kind: 'loc', dept: 'florida', via: ['r_sarandi_durazno'] },
  { id: 'durazno', name: 'Durazno', kind: 'city', dept: 'durazno', gym: 'ancap', via: [] },
  { id: 'sanramon', name: 'San Ramón', kind: 'loc', dept: 'canelones', via: ['r_sanramon_canelones'] },
  { id: 'canelones', name: 'Canelones', kind: 'city', dept: 'canelones', gym: 'inavi', via: [] },
  { id: 'laspiedras', name: 'Las Piedras', kind: 'loc', dept: 'canelones', via: ['r_laspiedras_montevideo'] },
  { id: 'montevideo', name: 'Montevideo', kind: 'city', dept: 'montevideo', gym: 'ute', via: [] },
]);

export const STOP_INDEX = deepFreeze(Object.fromEntries(STOPS.map((s, i) => [s.id, i])));
export const GYM_STOPS = deepFreeze(STOPS.filter((s) => s.gym));
/** Flag of the medal won at a city's gym: medals are numbered in route order. */
export const badgeOf = (stopId) => `badge${GYM_STOPS.findIndex((s) => s.id === stopId) + 1}`;

/** Full walk order of maps, routes included: [carmelo, ruta1, colonia, r_colonia_rosario, rosario, r_rosario_sanjose, sanjose, ...]. */
export const CHAIN = deepFreeze(STOPS.flatMap((s) => [s.id, ...s.via]));

/** Centre of the wild-level band at a stop: gentle at first, steeper after the first gym, and a little more after every gym passed. */
const gymsBefore = (i) => STOPS.slice(0, i).filter((s) => s.gym).length;
export const stopCentre = (i) => (i <= 8 ? 2 + 0.9 * i : 9.2 + (i - 8) * 1.3) + 0.9 * gymsBefore(i);
/** Wild level band [lo, hi] of stop i. */
export const stopBand = (i) => { const c = stopCentre(i); return [Math.max(2, Math.round(c - 2)), Math.max(3, Math.round(c + 1.2))]; };
/** Level of a gym leader's ace: just above the wild creatures of their city. */
export const gymAce = (stopId) => stopBand(STOP_INDEX[stopId])[1] + 2;

/** Band of any map on the chain (routes take the mean of their neighbours). */
export function mapBand(mapId) {
  const ci = CHAIN.indexOf(mapId);
  if (ci < 0) return null;
  const stopAt = (k) => STOP_INDEX[CHAIN[k]];
  if (STOP_INDEX[mapId] !== undefined) return stopBand(STOP_INDEX[mapId]);
  let a = ci - 1; while (STOP_INDEX[CHAIN[a]] === undefined) a--;
  let b = ci + 1; while (STOP_INDEX[CHAIN[b]] === undefined) b++;
  const lo = stopBand(stopAt(a));
  const hi = stopBand(stopAt(b));
  const ia = stopAt(a), ib = stopAt(b);
  const c = (stopCentre(ia) + stopCentre(ib)) / 2;
  return [Math.max(lo[0], Math.round(c - 2)), Math.min(hi[1], Math.round(c + 1.2))];
}

/** Flag that opens the road forward from a city (set by that city's story beat). */
export const openFlag = (stopId) => `open_${stopId}`;
