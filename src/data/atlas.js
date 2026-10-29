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
  { id: 'durazno', name: 'Durazno', kind: 'loc', lon: -56.5, lat: -33.0, note: 'Zona de ceniza y magma' },
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
  ['punta', 'paloma'], ['paloma', 'cabo'], ['montevideo', 'minas'], ['minas', 'quebrada'], ['minas', 'durazno'],
]);

export const VIEW = { w: 340, h: 250, lon0: -59.76, lon1: -52.04, lat0: -29.9, lat1: -35.2 };
export const project = (lon, lat) => [
  Math.round(((lon - VIEW.lon0) / (VIEW.lon1 - VIEW.lon0)) * VIEW.w * 10) / 10,
  Math.round(((VIEW.lat0 - lat) / (VIEW.lat0 - VIEW.lat1)) * VIEW.h * 10) / 10,
];

// Departamentos y zonas ------------------------------------------------------
// Cada departamento pertenece a una zona (bioma) que decide qué elementos aparecen allí.
export const BIOMES = deepFreeze({
  playa: { name: 'Costa y arena', color: '#ecd9a0', edge: '#c8b070', types: ['agua', 'tierra', 'volador', 'bicho'] },
  ciudad: { name: 'Ciudad', color: '#b4bccf', edge: '#8a93aa', types: ['electrico', 'normal', 'siniestro', 'lucha', 'veneno'] },
  campo: { name: 'Campo', color: '#b4cc72', edge: '#8aa44c', types: ['normal', 'planta', 'tierra', 'volador', 'bicho'] },
  bosque: { name: 'Monte', color: '#5f9f58', edge: '#3f7a3c', types: ['planta', 'bicho', 'veneno'] },
  magma: { name: 'Ceniza y magma', color: '#e0805a', edge: '#b05030', types: ['fuego', 'tierra', 'roca'] },
  hielo: { name: 'Sierra helada', color: '#cfe6f2', edge: '#9cc4d8', types: ['psiquico', 'agua', 'roca'] },
});

// w: peso para repartir el territorio (los departamentos chicos achican su zona).
export const DEPARTMENTS = deepFreeze([
  { id: 'artigas', name: 'Artigas', lon: -56.9, lat: -30.5, biome: 'campo' },
  { id: 'salto', name: 'Salto', lon: -57.3, lat: -31.5, biome: 'campo' },
  { id: 'paysandu', name: 'Paysandú', lon: -57.6, lat: -32.3, biome: 'campo' },
  { id: 'rionegro', name: 'Río Negro', lon: -57.4, lat: -32.95, biome: 'campo' },
  { id: 'soriano', name: 'Soriano', lon: -57.7, lat: -33.6, biome: 'campo' },
  { id: 'colonia', name: 'Colonia', lon: -57.45, lat: -34.25, biome: 'playa', w: 0.8 },
  { id: 'rivera', name: 'Rivera', lon: -55.5, lat: -31.1, biome: 'bosque' },
  { id: 'tacuarembo', name: 'Tacuarembó', lon: -55.9, lat: -32.1, biome: 'bosque', w: 1.2 },
  { id: 'durazno', name: 'Durazno', lon: -56.5, lat: -33.0, biome: 'magma' },
  { id: 'flores', name: 'Flores', lon: -56.9, lat: -33.55, biome: 'magma', w: 0.55 },
  { id: 'florida', name: 'Florida', lon: -56.0, lat: -33.9, biome: 'magma', w: 0.8 },
  { id: 'sanjose', name: 'San José', lon: -56.8, lat: -34.35, biome: 'campo', w: 0.7 },
  { id: 'canelones', name: 'Canelones', lon: -55.95, lat: -34.6, biome: 'ciudad', w: 0.65 },
  { id: 'montevideo', name: 'Montevideo', lon: -56.2, lat: -34.85, biome: 'ciudad', w: 0.3 },
  { id: 'lavalleja', name: 'Lavalleja', lon: -55.3, lat: -34.0, biome: 'hielo', w: 0.9 },
  { id: 'maldonado', name: 'Maldonado', lon: -54.8, lat: -34.6, biome: 'playa', w: 0.65 },
  { id: 'rocha', name: 'Rocha', lon: -54.0, lat: -34.1, biome: 'playa' },
  { id: 'treintaytres', name: 'Treinta y Tres', lon: -54.2, lat: -33.2, biome: 'campo' },
  { id: 'cerrolargo', name: 'Cerro Largo', lon: -54.2, lat: -32.4, biome: 'campo' },
]);

// Departamento de cada lugar del mapa.
export const PLACE_DEPT = deepFreeze({
  colonia: 'colonia', rosario: 'colonia', montevideo: 'montevideo', piriapolis: 'maldonado', punta: 'maldonado',
  paloma: 'rocha', cabo: 'rocha', minas: 'lavalleja', quebrada: 'treintaytres', durazno: 'durazno',
});

// Zona (bioma) de cada mapa con criaturas salvajes.
export const MAP_BIOME = deepFreeze({
  ruta1: ['campo'], rosario: ['playa'], interbalnearia: ['ciudad', 'playa'], piriapolis: ['playa'], punta: ['playa'], paloma: ['playa'], cabo: ['playa'],
  ruta8: ['campo', 'ciudad'], minas: ['hielo', 'campo'], quebrada: ['campo', 'bosque'], durazno: ['magma'],
});

// Adornos del mapa (pinos y cerros), en [lon, lat].
export const TREES = deepFreeze([
  [-57.4, -30.7], [-57.2, -31.6], [-56.8, -30.5], [-56.2, -31.3], [-55.6, -31.2], [-55.0, -31.9], [-54.3, -32.4], [-56.9, -32.4],
  [-57.5, -33.3], [-56.6, -33.4], [-55.9, -33.9], [-55.3, -32.9], [-54.2, -33.9], [-54.7, -34.4], [-57.0, -34.3], [-55.7, -32.2],
]);
export const HILLS = deepFreeze([[-56.4, -32.0], [-55.2, -33.3], [-54.6, -31.9], [-56.6, -30.9], [-54.1, -33.0], [-55.9, -33.1]]);
