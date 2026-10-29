// Mapa de Uruguay: contorno simplificado y posición de cada lugar (longitud, latitud).
import { deepFreeze } from '../core/util.js';

// [lon, lat], en sentido horario desde Bella Unión.
export const OUTLINE = [
  [-57.6, -30.2], [-56.6, -30.1], [-56.0, -30.25], [-55.5, -30.85], [-55.0, -31.2], [-54.5, -31.5], [-53.9, -31.95],
  [-53.4, -32.6], [-53.5, -33.0], [-53.4, -33.7], [-53.75, -34.4], [-54.15, -34.68], [-54.95, -34.95], [-55.5, -34.95],
  [-56.2, -34.9], [-56.8, -34.8], [-57.5, -34.45], [-57.9, -34.5], [-58.4, -33.95], [-58.3, -33.1], [-58.1, -32.3],
  [-57.95, -31.4],
];

// kind: 'city' (con gimnasio) | 'loc' (localidad: almacén y gente con objetos) | 'place' (lugar de la historia)
// maps: ids de mapa que cuentan como "estar en" ese lugar (además de sus interiores).
export const PLACES = deepFreeze([
  { id: 'colonia', name: 'Colonia del Sacramento', kind: 'city', lon: -57.84, lat: -34.47, color: '#f2f2f2', note: 'Laboratorio del Maestro Tabárez' },
  { id: 'rosario', name: 'Rosario', kind: 'loc', lon: -57.35, lat: -34.31, note: 'Caña de Pescar' },
  { id: 'montevideo', name: 'Montevideo', kind: 'city', lon: -56.19, lat: -34.9, color: '#3f86e0', note: 'Gimnasio de Agua · Mapa' },
  { id: 'piriapolis', name: 'Piriápolis', kind: 'loc', lon: -55.27, lat: -34.86, note: 'Almacén y Alfajores' },
  { id: 'punta', name: 'Punta del Este', kind: 'city', lon: -54.95, lat: -34.96, color: '#e8c21c', note: 'Gimnasio Eléctrico' },
  { id: 'paloma', name: 'La Paloma', kind: 'loc', lon: -54.17, lat: -34.66, note: 'Superballs' },
  { id: 'cabo', name: 'Cabo Polonio', kind: 'place', lon: -53.77, lat: -34.4, note: 'Faro' },
  { id: 'minas', name: 'Minas', kind: 'loc', lon: -55.24, lat: -34.37, note: 'Mate: Canarias' },
  { id: 'quebrada', name: 'Treinta y Tres', kind: 'city', lon: -54.38, lat: -33.23, color: '#a48e48', note: 'Gimnasio de Roca' },
]);

// Mapas de ruta: se muestran entre los dos lugares que unen.
export const ROUTES = deepFreeze({
  ruta1: ['colonia', 'rosario'],
  interbalnearia: ['montevideo', 'piriapolis'],
  ruta8: ['montevideo', 'minas'],
});

// Líneas que unen los lugares en orden de recorrido.
export const LINKS = deepFreeze([
  ['colonia', 'rosario'], ['rosario', 'montevideo'], ['montevideo', 'piriapolis'], ['piriapolis', 'punta'],
  ['punta', 'paloma'], ['paloma', 'cabo'], ['montevideo', 'minas'], ['minas', 'quebrada'],
]);

export const VIEW = { w: 300, h: 280, lon0: -58.7, lon1: -53.0, lat0: -30.0, lat1: -35.2 };
export const project = (lon, lat) => [
  Math.round(((lon - VIEW.lon0) / (VIEW.lon1 - VIEW.lon0)) * VIEW.w * 10) / 10,
  Math.round(((VIEW.lat0 - lat) / (VIEW.lat0 - VIEW.lat1)) * VIEW.h * 10) / 10,
];
