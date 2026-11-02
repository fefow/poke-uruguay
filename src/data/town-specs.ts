// One hand-made plan per city (44x30, the size of Montevideo) and a handful of locality archetypes.
// Specs are read by planTown (town-plan.js). Coordinates are tiles; roads are polylines, buildings find their
// own place along them. Every city has its own street network, landscape and landmarks.
import { rng } from './map-gen.ts';

/** Fence around a rectangle with an opening, as prop tiles. */
export const fence = ([x, y, w, h], gap = null) => {
  const out = [];
  for (let i = 0; i < w; i++) for (const yy of [y, y + h - 1]) if (!(gap && gap.side === (yy === y ? 'n' : 's') && i === gap.at)) out.push(['F', x + i, yy]);
  for (let j = 1; j < h - 1; j++) for (const xx of [x, x + w - 1]) if (!(gap && gap.side === (xx === x ? 'w' : 'e') && j === gap.at)) out.push(['F', xx, y + j]);
  return out;
};
const row = (ch, x, y, n, step = 1, vertical = false) => Array.from({ length: n }, (_, i) => [ch, vertical ? x : x + i * step, vertical ? y + i * step : y]);

const W = 44, H = 30;

export const CITY_SPECS = {
  // Colonia del Sacramento: colonial grid on a peninsula, sea to the east and south, lighthouse, wooden pier.
  colonia: {
    theme: null,
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 8,
      fills: [{ rect: [32, 1, 4, 28], ch: 's' }, { rect: [24, 22, 12, 7], ch: 's' }],
      water: [{ rect: [36, 1, 7, 28] }, { rect: [25, 25, 11, 4] }, { blob: [30, 27, 8, 3] }],
      paths: [[[1, 6], [33, 6]], [[1, 13], [33, 13]], [[1, 20], [31, 20]], [[7, 1], [7, 28]], [[16, 1], [16, 28]], [[25, 1], [25, 22]], [[31, 20], [31, 13]], [[33, 10], [41, 10]]],
      plazas: [{ x: 17, y: 14, w: 7, h: 5, piece: 'fuente', benches: true }],
      props: [['L', 31, 21], ['l', 31, 22], ['β', 34, 3], ['β', 34, 18], ...row('Δ', 9, 5, 1)],
      scatter: [['Ω', 5, 'road'], ['ñ', 8, 'away'], ['Σ', 6, 'road']],
      animals: [],
    },
    bld: [['poli', 'poli_colonia'], ['shop', 'shop_colonia'], ['house', 'casa_colonia'], ['houseG', 'casa_colonia2']],
    fill: 12,
  },
  // San José de Mayo: a ring road around the Plaza Artigas, dairy farms with fences and hay bales to the south-east.
  sanjose: {
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 9,
      paths: [[[1, 13], [42, 13]], [[22, 1], [22, 28]], [[17, 9], [27, 9], [27, 18], [17, 18], [17, 9]], [[3, 24], [40, 24]], [[8, 3], [8, 24]], [[36, 3], [36, 24]]],
      plazas: [{ x: 19, y: 11, w: 7, h: 6, piece: 'Γ', benches: true }],
      fills: [{ rect: [28, 20, 14, 8], ch: 'ζ' }],
      props: [...fence([29, 20, 13, 8], { side: 'w', at: 3 }), ...row('Ξ', 33, 23, 3, 2), ['Λ', 40, 22]],
      groves: [{ rect: [2, 2, 12, 5], tree: 'q', density: 0.6, lanes: 4 }],
      scatter: [['Ω', 6, 'road'], ['#', 10, 'away']],
      animals: [{ sp: 'ternero', n: 3, rect: [30, 22, 10, 5] }, { sp: 'novillo', n: 2, rect: [30, 22, 10, 5] }],
    },
    bld: [['poli', 'poli_sanjose'], ['shop', 'shop_sanjose'], ['house', 'casa_sanjose'], ['houseG', 'casa_sanjose2'], ['fabrica', null, [22, 8]]],
    fill: 10,
  },
  // Trinidad: a star of avenues around the Plaza Independencia, cornfields and pines at the edges.
  trinidad: {
    spec: {
      w: W, h: H, border: 'Ñ', tree: 'Ñ', road: 'c', lamps: 9,
      paths: [[[1, 15], [42, 15]], [[22, 1], [22, 28]], [[3, 4], [10, 4], [10, 11], [18, 11], [18, 15]], [[41, 26], [34, 26], [34, 19], [26, 19], [26, 15]], [[3, 26], [14, 26]], [[30, 4], [40, 4]]],
      plazas: [{ x: 18, y: 12, w: 9, h: 7, piece: 'fuente', benches: true, ring: 'Ω' }],
      fills: [{ rect: [2, 17, 12, 9], ch: 'ζ' }, { rect: [30, 6, 11, 8], ch: 'ζ' }],
      groves: [{ rect: [2, 2, 6, 6], tree: 'Ñ', lanes: 3 }, { rect: [34, 21, 8, 6], tree: 'Ñ', lanes: 3 }],
      props: [...fence([3, 18, 10, 7], { side: 'e', at: 3 }), ...row('Ξ', 5, 21, 3, 2)],
      scatter: [['Ω', 5, 'road'], ['Ñ', 8, 'away']],
      animals: [{ sp: 'oveja', n: 3, rect: [4, 19, 8, 5] }, { sp: 'criollo', n: 1, rect: [31, 7, 9, 5] }],
    },
    bld: [['gym', 'gym_trinidad', [22, 22]], ['poli', 'poli_trinidad'], ['shop', 'shop_trinidad'], ['house', 'casa_trinidad'], ['houseG', 'casa_trinidad2']],
    fill: 9,
  },
  // Mercedes: a costanera along the río Negro, docks reaching into the water and willows on the bank.
  mercedes: {
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 7,
      fills: [{ rect: [1, 1, 42, 3], ch: 's' }],
      water: [{ rect: [1, 1, 42, 5] }, { rect: [1, 1, 42, 4] }],
      paths: [[[1, 8], [12, 8], [12, 10], [30, 10], [30, 8], [42, 8]], [[20, 10], [20, 28]], [[6, 8], [6, 26]], [[36, 8], [36, 26]], [[3, 20], [40, 20]], [[9, 8], [9, 1]], [[26, 10], [26, 1]], [[33, 8], [33, 1]]],
      props: [...row('ñ', 2, 7, 8, 5), ['β', 15, 4], ['β', 28, 3], ['β', 38, 5], ['Δ', 14, 9], ['Δ', 24, 9]],
      groves: [{ rect: [2, 22, 10, 6], tree: 'ñ', density: 0.6, lanes: 4 }],
      scatter: [['Ω', 6, 'road'], ['ñ', 8, 'away']],
      animals: [],
    },
    bld: [['gym', 'gym_mercedes', [20, 16]], ['poli', 'poli_mercedes'], ['shop', 'shop_mercedes'], ['house', 'casa_mercedes'], ['houseG', 'casa_mercedes2']],
    fill: 10,
  },
  // Fray Bentos: the Anglo meatpacking plant along the river: factory halls, long avenue, dark gravel ground.
  fraybentos: {
    theme: 'sierra',
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 8,
      water: [{ rect: [1, 24, 42, 5] }],
      fills: [{ rect: [1, 21, 42, 3], ch: 's' }],
      paths: [[[1, 14], [42, 14]], [[10, 1], [10, 20]], [[30, 1], [30, 20]], [[1, 20], [42, 20]], [[20, 14], [20, 1]], [[36, 14], [36, 20]], [[4, 8], [16, 8]]],
      props: [...row('z', 14, 2, 2, 3), ['z', 38, 3], ['z', 40, 3], ['β', 12, 23], ['β', 31, 22], ['γ', 24, 18], ['γ', 25, 18], ['γ', 26, 18]],
      scatter: [['γ', 4, 'away'], ['τ', 4, 'road']],
      animals: [],
    },
    bld: [['siniestro', 'gym_frb', [24, 10]], ['poli', 'poli_frb', [14, 17]], ['shop', 'shop_frb', [34, 17]], ['house', 'casa_frb'], ['houseG', 'casa_frb2'], ['fabrica', 'anglo_1', [30, 8]], ['terminal', 'terminal_frb', [4, 17]], ['casaFaro', 'casa_frb_faro', [24, 17]]],
    fill: 6, fillKinds: ['fabrica', 'houseB'],
  },
  // Paysandú: the Uruguay river to the west with a long bridge, a hill with the cathedral, stepped streets.
  paysandu: {
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 8,
      water: [{ rect: [1, 1, 7, 28] }],
      fills: [{ rect: [8, 1, 3, 28], ch: 's' }],
      paths: [[[1, 14], [42, 14]], [[22, 1], [22, 28]], [[12, 6], [30, 6], [30, 10], [40, 10]], [[12, 22], [34, 22], [34, 18], [42, 18]], [[14, 1], [14, 28]], [[38, 1], [38, 28]]],
      hills: [{ rect: [24, 2, 12, 5], ch: 'μ', density: 0.5 }],
      plazas: [{ x: 23, y: 15, w: 7, h: 5, piece: 'Γ', benches: true }],
      props: [['β', 9, 4], ['β', 9, 24], ['L', 12, 3], ['l', 12, 4]],
      scatter: [['Ω', 5, 'road'], ['q', 8, 'away']],
      animals: [],
    },
    bld: [['poli', 'poli_pay'], ['shop', 'shop_pay'], ['houseO', 'casa_pay'], ['houseG', 'casa_pay2'], ['houseB', 'muelle_pay', [11, 12]]],
    fill: 10,
  },
  // Salto: a reservoir and dam wall in the north, thermal pools and orchards.
  // Salto (64x42): the Uruguay river along the whole north side with a railed embankment, the dam works to the east,
  // thermal-baths neighbourhood and a grid of barrios with citrus groves in the south.
  salto: {
    spec: {
      w: 64, h: 42, border: '#', road: 'c', lamps: 14,
      water: [{ rect: [4, 2, 54, 5] }, { blob: [52, 28, 4, 3] }, { blob: [56, 33, 3, 2] }],
      props: [...row('ρ', 3, 7, 56), ...row('ρ', 3, 1, 56)],
      paths: [[[1, 11], [62, 11]], [[22, 8], [22, 40]], [[44, 8], [44, 40]], [[4, 24], [60, 24]], [[10, 11], [10, 36]], [[32, 24], [32, 40]], [[4, 36], [44, 36]]],
      plazas: [{ x: 33, y: 12, w: 10, h: 5, piece: 'fuente', benches: true }],
      groves: [{ rect: [2, 26, 16, 8], tree: 'ö', density: 0.55, rows: true, lanes: 4 }, { rect: [46, 13, 14, 8], tree: 'ξ', rows: true, density: 0.9 }, { rect: [46, 26, 12, 6], tree: 'ö', density: 0.5, rows: true, lanes: 4 }],
      scatter: [['Ω', 8, 'road'], ['ξ', 10, 'away'], ['Ь', 3, 'road']],
      animals: [],
    },
    bld: [['psiquico', 'gym_sal', [34, 19]], ['poli', 'poli_sal', [14, 14]], ['shop', 'shop_sal', [26, 14]], ['houseV', 'casa_sal', [14, 20]], ['houseB', 'radio_sal', [28, 28]], ['fabrica', 'represa_1', [50, 9], 2], ['house', 'casa_sal2', [36, 28]]],
    fill: 16,
  },
  // Artigas: a mining town climbing a stony hill on a zigzag road, amethyst country.
  // Artigas (64x42): a winding mountain road climbing through the hills, amethyst quarry scree (ν) in the south-east,
  // a terraced square half-way up and barrios on the benches of the hill.
  artigas: {
    theme: 'sierra',
    spec: {
      w: 64, h: 42, border: '#', road: '=', lamps: 14,
      hills: [{ rect: [1, 1, 30, 8], ch: 'μ', density: 0.55 }, { rect: [38, 1, 25, 11], ch: 'μ', density: 0.6 }, { rect: [1, 34, 26, 7], ch: 'μ', density: 0.45 }],
      paths: [[[1, 39], [20, 39], [20, 31], [44, 31], [44, 22], [12, 22], [12, 15], [38, 15], [38, 1]], [[54, 31], [54, 40]], [[44, 22], [62, 22]], [[62, 31], [44, 31]], [[28, 31], [28, 22]], [[12, 22], [4, 22]]],
      plazas: [{ x: 22, y: 23, w: 10, h: 5, piece: 'fuente', benches: true }],
      fills: [{ rect: [46, 32, 16, 9], ch: 'ν' }],
      groves: [{ rect: [2, 24, 8, 8], tree: '#', density: 0.5, lanes: 3 }, { rect: [40, 3, 8, 6], tree: '#', density: 0.5, lanes: 3 }],
      scatter: [['ν', 14, 'away'], ['Ñ', 10, 'away'], ['R', 12, 'away'], ['Ь', 3, 'road']],
      props: [['τ', 50, 34], ['τ', 51, 34], ['τ', 55, 36], ['γ', 58, 35], ['γ', 59, 35]],
      animals: [{ sp: 'mulitin', n: 3, rect: [46, 32, 16, 9] }],
    },
    bld: [['poli', 'poli_artigas', [16, 18]], ['shop', 'shop_artigas', [30, 18]], ['house', 'casa_artigas', [24, 34]], ['houseG', 'casa_artigas2', [6, 26]]],
    fill: 14,
  },
  // Rivera: twin plazas on the border with a line of boundary stones down the middle.
  // Rivera (64x42): the dry border runs down the middle (marker posts, 'ρ'); two squares face each other across it, the
  // customs house stands on the avenue and the Mi Zoo gate and the tower sit in the east barrios.
  rivera: {
    spec: {
      w: 64, h: 42, border: '#', road: 'c', lamps: 14,
      paths: [[[1, 21], [62, 21]], [[32, 1], [32, 40]], [[6, 8], [58, 8]], [[6, 34], [58, 34]], [[16, 8], [16, 34]], [[48, 8], [48, 34]], [[16, 27], [48, 27]]],
      plazas: [{ x: 22, y: 22, w: 8, h: 6, piece: 'fuente', benches: false }, { x: 35, y: 22, w: 8, h: 6, piece: 'Γ' }, { x: 22, y: 12, w: 8, h: 6 }, { x: 35, y: 12, w: 8, h: 6, ring: 'Σ' }],
      props: [...row('ρ', 33, 2, 5, 1, true), ...row('ρ', 33, 11, 6, 1, true), ...row('ρ', 33, 22, 6, 1, true), ...row('ρ', 33, 30, 3, 1, true), ...row('ρ', 33, 36, 4, 1, true)],
      scatter: [['Ω', 8, 'road'], ['#', 10, 'away'], ['Ь', 3, 'road']],
      animals: [],
    },
    bld: [['lucha', 'gym_riv', [12, 14]], ['poli', 'poli_riv', [24, 4]], ['shop', 'shop_riv', [38, 4]], ['houseB', 'casa_riv', [8, 28]], ['house', 'aduana_riv', [26, 30]], ['houseG', 'safari_gate', [52, 14]], ['houseO', 'casa_riv2', [54, 28]], ['torre', 'torre_1', [44, 30]]],
    fill: 14,
  },
  // Tacuarembó: gaucho country: red earth, pine plantations to the west, eucalyptus to the east, parrilla.
  // Tacuarembó (64x42): red-earth city with eucalyptus forest to the north-west, the cattle fair field (fenced,
  // criollo horses and sheep) in the north-east, a long avenue, the bike district and a cobbled square.
  tacuarembo: {
    theme: 'colorada',
    spec: {
      w: 64, h: 42, border: 'Ñ', tree: 'Ñ', road: '=', lamps: 16,
      groves: [{ rect: [2, 2, 24, 16], tree: 'Ñ', density: 0.9, lanes: 5 }, { rect: [44, 28, 18, 12], tree: 'Ö', density: 0.9, lanes: 4 }, { rect: [2, 28, 12, 12], tree: 'Ñ', lanes: 4 }],
      paths: [[[1, 24], [62, 24]], [[30, 1], [30, 40]], [[30, 12], [58, 12]], [[44, 12], [44, 24]], [[12, 24], [12, 30]], [[50, 24], [50, 30]], [[14, 34], [44, 34]], [[30, 34], [30, 40]]],
      plazas: [{ x: 31, y: 25, w: 9, h: 6, piece: 'Γ', benches: true }, { x: 18, y: 25, w: 8, h: 5, piece: 'fuente', benches: true }],
      fills: [{ rect: [32, 13, 28, 8], ch: 'ζ' }],
      props: [...fence([33, 13, 26, 8], { side: 's', at: 6 }), ['Θ', 27, 18], ['Ξ', 50, 15], ['Ξ', 54, 17], ['Λ', 29, 23], ['Λ', 41, 23]],
      scatter: [['ö', 8, 'away'], ['Ω', 6, 'road'], ['Ь', 3, 'road']],
      animals: [{ sp: 'criollo', n: 4, rect: [34, 14, 24, 5] }, { sp: 'oveja', n: 3, rect: [34, 14, 24, 5] }],
    },
    bld: [['planta', 'gym_tac', [36, 16]], ['poli', 'poli_tac', [20, 20]], ['shop', 'shop_tac', [46, 28]], ['houseG', 'casa_tac', [8, 20]], ['houseO', 'casa_tac2', [54, 28]], ['houseB', 'bici_tac', [22, 28]], ['houseV', 'parrilla_tac', [16, 30]]],
    fill: 14,
  },
  // Melo: laguna Merín and low hills; a diagonal staircase main street, ombú in the plaza.
  // Melo (64x42): a stepped avenue crossing the cuchilla from the south-west to the north-east, a plaza with ñandubay
  // trees, the old tower on the east side, a pond with herons to the north-east and stony hills to the north-west.
  melo: {
    theme: 'seca',
    spec: {
      w: 64, h: 42, border: '#', road: 'c', lamps: 14,
      water: [{ blob: [52, 8, 9, 5] }, { blob: [10, 30, 6, 3] }],
      fills: [{ rect: [40, 1, 22, 15], ch: 's', only: '.' }],
      hills: [{ rect: [2, 2, 24, 10], ch: 'μ', density: 0.35 }],
      paths: [[[1, 38], [14, 38], [14, 30], [30, 30], [30, 22], [46, 22], [46, 14], [62, 14]], [[30, 1], [30, 36]], [[14, 38], [14, 14], [5, 14]], [[46, 22], [46, 40]], [[58, 14], [58, 26]], [[30, 36], [60, 36]]],
      plazas: [{ x: 31, y: 24, w: 10, h: 6, piece: 'ö', benches: true }, { x: 16, y: 31, w: 8, h: 5, piece: 'ö', benches: true }],
      groves: [{ rect: [2, 18, 10, 9], tree: 'ö', density: 0.35 }, { rect: [48, 28, 12, 6], tree: 'ö', density: 0.3 }],
      scatter: [['ö', 8, 'away'], ['Ω', 6, 'road'], ['R', 8, 'away']],
      props: [['β', 50, 11], ['Λ', 30, 23], ['Λ', 45, 21], ['Λ', 15, 37]],
      animals: [{ sp: 'garza', n: 3, rect: [41, 4, 9, 6] }],
    },
    bld: [['poli', 'poli_melo', [24, 24]], ['shop', 'shop_melo', [38, 26]], ['house', 'casa_melo', [8, 33]], ['houseG', 'casa_melo2', [50, 18]], ['torre', 'anima_1', [52, 22]]],
    fill: 16,
  },
  // Treinta y Tres: a stone canyon across the town with a narrow bridge, cuervos nest in the cliffs.
  quebrada: {
    theme: 'sierra',
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 11,
      water: [{ pts: [[1, 14], [14, 14], [18, 12], [30, 12], [32, 16], [42, 16]], w: 2 }],
      hills: [{ rect: [1, 8, 42, 3], ch: 'K', density: 0.9 }, { rect: [1, 19, 42, 3], ch: 'K', density: 0.9 }],
      paths: [[[1, 5], [42, 5]], [[22, 1], [22, 28]], [[1, 25], [42, 25]], [[8, 5], [8, 25]], [[36, 5], [36, 25]]],
      groves: [{ rect: [2, 22, 8, 5], tree: 'Ñ', lanes: 4 }, { rect: [26, 2, 10, 3], tree: 'Ñ', lanes: 4 }],
      scatter: [['ν', 8, 'away'], ['R', 8, 'away'], ['Ω', 3, 'road']],
      animals: [{ sp: 'cuervon', n: 3, rect: [10, 2, 10, 3] }],
    },
    bld: [['poli', 'poli_tyt'], ['shop', 'shop_tyt'], ['house', 'casa_tyt'], ['roca', 'gym_tyt', [26, 22]]],
    fill: 8,
  },
  // Rocha: butiá palm groves, a lagoon and dunes.
  // Rocha (64x42): palm groves in the north, the main avenue with a long square, a lagoon, and dunes opening to the
  // south where the town turns into beach. A promenade runs along the dunes.
  rocha: {
    theme: 'arena',
    spec: {
      w: 64, h: 42, border: 'p', tree: 'p', road: 'c', lamps: 16,
      water: [{ blob: [12, 34, 10, 4] }, { blob: [52, 6, 8, 3] }, { blob: [46, 36, 7, 3] }],
      fills: [{ rect: [1, 28, 62, 13], ch: 'ß', only: '.' }],
      groves: [{ rect: [2, 2, 22, 10], tree: 'p', density: 0.5, lanes: 4 }, { rect: [38, 12, 22, 7], tree: 'p', density: 0.45, lanes: 4 }, { rect: [28, 2, 12, 6], tree: 'p', density: 0.5, lanes: 4 }],
      paths: [[[1, 20], [62, 20]], [[32, 1], [32, 27]], [[32, 20], [32, 25], [58, 25]], [[14, 20], [14, 8]], [[48, 20], [48, 5]], [[6, 25], [32, 25]], [[8, 12], [24, 12]]],
      plazas: [{ x: 22, y: 21, w: 10, h: 3, piece: 'fuente', ring: null }, { x: 38, y: 21, w: 8, h: 3, piece: 'fuente', ring: null }],
      props: [['Λ', 30, 19], ['Λ', 40, 19], ['Λ', 10, 24], ['Λ', 56, 24]],
      scatter: [['p', 20, 'away'], ['ξ', 10, 'away'], ['Ω', 6, 'road']],
      animals: [{ sp: 'tuco', n: 3, rect: [10, 30, 40, 6] }],
    },
    bld: [['poli', 'poli_rocha', [20, 16]], ['shop', 'shop_rocha', [44, 16]], ['house', 'casa_rocha', [8, 16]], ['houseG', 'casa_rocha2', [54, 16]]],
    fill: 14,
  },
  // Maldonado / Punta del Este: a peninsula with the rambla, La Mano rising from the sand, the port with boats.
  // Punta del Este (64x42): the peninsula. The Rambla runs along the beach, the marina with moored boats opens to the
  // north-east, the casino stands on the avenue and the water gym sits near the sea wall.
  punta: {
    theme: 'arena',
    spec: {
      w: 64, h: 42, border: '#', road: 'c', lamps: 14,
      fills: [{ rect: [1, 28, 62, 3], ch: 's', only: '.' }],
      water: [{ rect: [1, 31, 62, 10] }, { rect: [48, 1, 15, 14] }],
      paths: [[[1, 26], [48, 26], [48, 18], [62, 18]], [[32, 1], [32, 27]], [[8, 1], [8, 26]], [[20, 8], [44, 8]], [[4, 16], [28, 16]], [[40, 16], [40, 26]], [[20, 27], [20, 29]], [[56, 18], [56, 26]]],
      plazas: [{ x: 22, y: 17, w: 9, h: 4, piece: 'fuente', benches: true }],
      props: [['M', 16, 29], ['β', 52, 14], ['β', 55, 12], ['β', 58, 15], ['β', 50, 11], ['γ', 58, 20], ['γ', 59, 20], ['Δ', 12, 25], ['Δ', 30, 25], ['Δ', 44, 25], ['Δ', 6, 25], ['Δ', 52, 25]],
      scatter: [['Ω', 8, 'road'], ['p', 10, 'away'], ['Ь', 3, 'road']],
      animals: [{ sp: 'lobito', n: 3, rect: [4, 29, 50, 1] }],
    },
    bld: [['agua', 'gym_pde', [30, 12]], ['poli', 'poli_pde', [12, 12]], ['shop', 'shop_pde', [44, 22]], ['casino', 'casino_pde', [48, 22]]],
    fill: 12,
  },
  // Minas: a valley between sierras: dense hills to the north, eucalyptus, a stream and the old factory.
  minas: {
    theme: 'sierra',
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 10,
      hills: [{ rect: [1, 1, 42, 6], ch: 'μ', density: 0.75 }, { rect: [1, 24, 14, 5], ch: 'μ', density: 0.6 }],
      water: [{ pts: [[36, 8], [30, 12], [30, 20], [36, 25], [36, 28]], w: 2 }],
      groves: [{ rect: [2, 9, 12, 6], tree: 'Ö', density: 0.7, lanes: 4 }, { rect: [18, 22, 10, 6], tree: 'Ö', density: 0.7, lanes: 4 }],
      paths: [[[1, 16], [42, 16]], [[22, 7], [22, 28]], [[8, 16], [8, 22], [16, 22]], [[22, 11], [40, 11]], [[38, 11], [38, 16]]],
      scatter: [['ν', 8, 'away'], ['Ω', 3, 'road']],
      props: [['Γ', 21, 8], ['Λ', 6, 12]],
      animals: [{ sp: 'gatomontes', n: 1, rect: [4, 10, 8, 4] }],
    },
    bld: [['shop', 'shop_min'], ['house', 'casa_min'], ['fabrica', 'pp_1', [32, 9], 2]], thicket: 'pp_1',
    fill: 9,
  },
  // Florida: the Piedra Alta monument plaza, windmills on the plain, a creek with willows.
  // Florida (64x42): the river Santa Lucía Chico to the west with two bridges, a civic square with a ring of trees,
  // a long avenue, the aero club field (dry grass) to the east with a ranch and sheep, and a grid of barrios.
  florida: {
    theme: 'seca',
    spec: {
      w: 64, h: 42, border: '#', road: 'c', lamps: 14,
      water: [{ pts: [[5, 1], [5, 14], [11, 20], [11, 40]], w: 3 }],
      paths: [[[1, 22], [62, 22]], [[32, 1], [32, 40]], [[16, 9], [58, 9]], [[16, 35], [58, 35]], [[16, 9], [16, 35]], [[48, 9], [48, 35]], [[16, 28], [48, 28]]],
      plazas: [{ x: 26, y: 15, w: 11, h: 9, piece: 'Γ', benches: true, ring: 'Ω' }],
      fills: [{ rect: [50, 11, 12, 22], ch: 'ζ' }],
      groves: [{ rect: [18, 3, 12, 4], tree: 'ñ', density: 0.6 }, { rect: [36, 3, 12, 4], tree: 'ñ', density: 0.6 }, { rect: [18, 37, 12, 3], tree: 'ñ', density: 0.6 }],
      props: [['Λ', 30, 21], ['Λ', 34, 23], ['Λ', 50, 13], ['Λ', 60, 18], ['Λ', 50, 28], ['ñ', 8, 5], ['ñ', 9, 17], ['ñ', 14, 30], ['ñ', 3, 36], ...fence([50, 11, 13, 22], { side: 'w', at: 11 })],
      scatter: [['Ω', 10, 'road'], ['ö', 8, 'away'], ['Ь', 3, 'road']],
      animals: [{ sp: 'oveja', n: 4, rect: [52, 13, 8, 16] }],
    },
    bld: [['volador', 'gym_florida', [32, 31]], ['poli', 'poli_florida', [22, 12]], ['shop', 'shop_florida', [42, 12]], ['house', 'casa_florida', [20, 26]], ['houseG', 'casa_florida2', [42, 26]]],
    fill: 16,
  },
  // Durazno (64x42): ash country over an old volcano: lava fields at the corners, the Yí river across the south with an
  // iron bridge, a grid of barrios on the ash terrace and the refinery by the water.
  durazno: {
    spec: {
      w: 64, h: 42, border: 'K', tree: 'R', road: '=', lamps: 0,
      fills: [{ rect: [1, 1, 62, 40], ch: '`' }],
      water: [{ rect: [1, 30, 62, 3] }],
      paths: [[[1, 18], [62, 18]], [[32, 1], [32, 40]], [[8, 8], [56, 8]], [[8, 25], [56, 25]], [[14, 8], [14, 25]], [[50, 8], [50, 25]], [[32, 36], [58, 36]], [[6, 36], [32, 36]]],
      props: [
        ['^', 3, 3], ['^', 4, 3], ['^', 4, 4], ['^', 5, 4], ['^', 3, 4], ['^', 58, 3], ['^', 59, 3], ['^', 59, 4], ['^', 60, 4], ['^', 58, 4],
        ['^', 3, 38], ['^', 4, 38], ['^', 59, 38], ['^', 60, 38], ['^', 60, 37], ['^', 4, 37],
      ],
      scatter: [[';', 50, 'away'], ['R', 24, 'away'], ['Ω', 5, 'road']],
      animals: [],
    },
    bld: [['fuego', 'gym_dur', [34, 12]], ['poli', 'poli_dur', [22, 12]], ['shop', 'shop_dur', [44, 12]], ['house', 'casa_dur', [18, 21]], ['houseB', 'refineria_dur', [44, 33]]],
    fill: 14,
  },
  // Canelones: vineyards in long rows around a plaza, windmills and the bodega.
  // Canelones: a bigger city (64x42) in barrios: the civic centre with the fountain and the bug gym, a creek with
  // bridges to the north, orchards (ξ) on both sides, and a park to the south-east.
  canelones: {
    spec: {
      w: 64, h: 42, border: '#', road: 'c', lamps: 18,
      water: [{ pts: [[1, 8], [20, 9], [44, 8], [62, 9]], w: 3 }],
      paths: [[[1, 18], [62, 18]], [[32, 1], [32, 40]], [[1, 32], [62, 32]], [[12, 12], [12, 40]], [[52, 12], [52, 40]], [[12, 25], [52, 25]]],
      plazas: [{ x: 27, y: 19, w: 11, h: 6, piece: 'fuente', benches: true }, { x: 42, y: 33, w: 9, h: 6, piece: 'fuente', benches: true }],
      groves: [
        { rect: [2, 2, 18, 5], tree: 'ξ', rows: true, density: 1 }, { rect: [24, 2, 16, 5], tree: 'ξ', rows: true, density: 1 }, { rect: [44, 2, 18, 5], tree: 'ξ', rows: true, density: 1 },
        { rect: [2, 34, 8, 6], tree: 'ξ', rows: true, density: 1 }, { rect: [14, 34, 16, 6], tree: 'ξ', rows: true, density: 1 }, { rect: [54, 34, 8, 6], tree: 'ξ', rows: true, density: 1 },
      ],
      props: [['Λ', 30, 17], ['Λ', 34, 26], ['Λ', 10, 31], ['Λ', 54, 31], ['Ξ', 2, 17], ['Ξ', 61, 17], ['Ξ', 2, 31], ['Ξ', 61, 31]],
      scatter: [['Ω', 10, 'road'], ['#', 8, 'away'], ['Ь', 4, 'road']],
      animals: [],
    },
    bld: [['bicho', 'gym_canelones', [32, 13]], ['poli', 'poli_canelones', [20, 14]], ['shop', 'shop_canelones', [44, 14]], ['house', 'casa_canelones', [8, 22]], ['houseG', 'casa_canelones2', [56, 22]]],
    fill: 16,
  },
};

// ---------------------------------------------------------------- localities
// Each archetype draws a small landscape; the seed shifts the geometry so two of the same kind still differ.
const roadsH = (r, w, h) => 7 + Math.floor(r() * Math.max(1, h - 12));

export const LOC_ARCHETYPES = {
  pinar: (id, w, h, r) => { const y = roadsH(r, w, h); return { w, h, border: 'Ñ', tree: 'Ñ', road: '=', lamps: 0, groves: [{ rect: [2, 2, w - 4, y - 4], tree: 'Ñ', lanes: 4, density: 0.95 }, { rect: [2, y + 4, w - 4, h - y - 6], tree: 'Ñ', lanes: 4, density: 0.9 }], paths: [[[1, y], [w - 2, y]], [[w >> 1, y], [w >> 1, 1]]], scatter: [['ξ', 4, 'away']], animals: [] }; },
  eucaliptal: (id, w, h, r) => { const y = roadsH(r, w, h); return { w, h, border: 'Ö', tree: 'Ö', road: '=', lamps: 0, groves: [{ rect: [2, 2, w - 4, y - 4], tree: 'Ö', lanes: 4, density: 0.8 }, { rect: [2, y + 4, 10, h - y - 6], tree: 'Ö', lanes: 4, density: 0.8 }], paths: [[[1, y], [w - 2, y]], [[10, y], [10, h - 2]]], fills: [{ rect: [14, y + 3, w - 16, h - y - 5], ch: 'ζ' }], scatter: [['Ξ', 3, 'away']], animals: [{ sp: 'carpincho', n: 1, rect: [15, y + 4, 6, 3] }] }; },
  arenal: (id, w, h, r) => { const y = 7 + Math.floor(r() * 3); return { w, h, border: '#', road: 'c', lamps: 0, fills: [{ rect: [1, 1, w - 2, h - 2], ch: 'ß', only: '.' }], water: [{ rect: [1, h - 5, w - 2, 4] }], paths: [[[1, y], [w - 2, y]], [[w >> 1, y], [w >> 1, h - 7]]], props: [['β', 4, h - 6], ['β', w - 6, h - 6]], scatter: [['p', 4, 'away'], ['ξ', 5, 'away']], animals: [{ sp: 'gaviota', n: 2, rect: [3, h - 7, w - 6, 1] }] }; },
  playa: (id, w, h, r) => { const y = 7 + Math.floor(r() * 3); return { w, h, border: '#', road: 'c', lamps: 8, fills: [{ rect: [1, h - 7, w - 2, 3], ch: 's', only: '.' }], water: [{ rect: [1, h - 4, w - 2, 3] }], paths: [[[1, y], [w - 2, y]], [[8, y], [8, h - 8]], [[w - 9, y], [w - 9, h - 8]]], props: [['β', 6, h - 6], ['β', w - 8, h - 6], ['L', w - 4, h - 9], ['l', w - 4, h - 8]], scatter: [['p', 3, 'away'], ['Δ', 2, 'road']], animals: [{ sp: 'lobito', n: 1, rect: [4, h - 7, w - 8, 1] }] }; },
  sierra: (id, w, h, r) => { const y = h - 6 - Math.floor(r() * 3); return { w, h, border: '#', road: '=', lamps: 0, hills: [{ rect: [1, 1, w - 2, y - 6], ch: 'μ', density: 0.7 }, { rect: [1, y + 3, w - 2, h - y - 4], ch: 'μ', density: 0.45 }], fills: [{ rect: [1, y - 5, w - 2, h - y + 3], ch: 'ν', only: '.' }], paths: [[[1, y], [w - 2, y]], [[w >> 1, y], [w >> 1, y - 5]]], scatter: [['R', 5, 'away'], ['ν', 6, 'away']], animals: [{ sp: 'cuchilla', n: 0, rect: [2, 2, 3, 3] }] }; },
  campo: (id, w, h, r) => { const y = roadsH(r, w, h); return { w, h, border: '#', road: '=', lamps: 0, fills: [{ rect: [2, y + 2, w - 4, h - y - 4], ch: 'ζ' }], paths: [[[1, y], [w - 2, y]], [[w - 8, y], [w - 8, y - 4]]], props: [...fence([3, y + 2, w - 6, h - y - 4], { side: 'n', at: 5 }), ['Λ', 5, y - 2], ['Ξ', 8, y + 3], ['Ξ', 10, y + 3]], scatter: [['ö', 2, 'away'], ['#', 4, 'away']], animals: [{ sp: 'ternero', n: 3, rect: [5, y + 3, w - 10, h - y - 6] }, { sp: 'oveja', n: 2, rect: [5, y + 3, w - 10, h - y - 6] }] }; },
  rio: (id, w, h, r) => { const x = 10 + Math.floor(r() * (w - 22)); return { w, h, border: '#', road: 'c', lamps: 0, water: [{ rect: [x, 1, 3, h - 2] }], paths: [[[1, h >> 1], [w - 2, h >> 1]]], props: [['ñ', x - 2, 4], ['ñ', x + 4, 6], ['ñ', x - 3, h - 5], ['β', x + 1, 3]], scatter: [['ñ', 3, 'away'], ['ξ', 4, 'away']], animals: [{ sp: 'garza', n: 1, rect: [x + 4, 3, 3, 3] }] }; },
  palmar: (id, w, h, r) => { const y = roadsH(r, w, h); return { w, h, border: 'p', tree: 'p', road: '=', lamps: 0, groves: [{ rect: [2, 2, w - 4, h - 4], tree: 'p', density: 0.35, lanes: 4 }], paths: [[[1, y], [w - 2, y]], [[w >> 1, y], [w >> 1, 1]]], water: [{ blob: [w - 7, h - 5, 4, 2] }], scatter: [['ξ', 4, 'away']], animals: [{ sp: 'tuco', n: 1, rect: [3, y + 2, 8, 3] }] }; },
  laguna: (id, w, h, r) => { const y = 7 + Math.floor(r() * 3); return { w, h, border: '#', road: 'c', lamps: 0, water: [{ blob: [w >> 1, h - 5, w >> 2, 3] }], fills: [{ rect: [1, h - 8, w - 2, 7], ch: 's', only: '.' }], paths: [[[1, y], [w - 2, y]], [[4, y], [4, h - 8]]], scatter: [['ñ', 4, 'away'], ['ξ', 4, 'away']], animals: [{ sp: 'garza', n: 2, rect: [3, h - 9, w - 6, 1] }] }; },
  colorada: (id, w, h, r) => { const y = roadsH(r, w, h); return { w, h, border: '#', road: '=', lamps: 0, hills: [{ rect: [w - 9, 1, 8, 5], ch: 'μ', density: 0.5 }], paths: [[[1, y], [w - 2, y]], [[w >> 1, y], [w >> 1, h - 2]]], scatter: [['ö', 2, 'away'], ['R', 5, 'away'], ['ξ', 4, 'away']], animals: [{ sp: 'criollo', n: 2, rect: [3, 2, 10, 3] }] }; },
  puerto: (id, w, h, r) => { const y = 7 + Math.floor(r() * 3); return { w, h, border: '#', road: 'c', lamps: 7, water: [{ rect: [1, h - 5, w - 2, 4] }], fills: [{ rect: [1, h - 7, w - 2, 2], ch: 's', only: '.' }], paths: [[[1, y], [w - 2, y]], [[8, y], [8, h - 7]], [[w - 8, y], [w - 8, h - 7]]], props: [['β', 6, h - 5], ['β', 14, h - 4], ['β', w - 10, h - 5], ['γ', w - 6, h - 8], ['γ', w - 5, h - 8]], scatter: [['τ', 2, 'road']], animals: [] }; },
  monte: (id, w, h, r) => { const y = roadsH(r, w, h); return { w, h, border: '#', road: '=', lamps: 0, groves: [{ rect: [2, 2, w - 4, h - 4], tree: '#', density: 0.55, lanes: 5 }], paths: [[[1, y], [w - 2, y]], [[w >> 1, y], [w >> 1, 1]]], water: [{ blob: [6, h - 5, 3, 2] }], scatter: [['ö', 2, 'away'], ['ξ', 6, 'away']], animals: [{ sp: 'venadito', n: 1, rect: [4, 3, 8, 3] }] }; },
  llanura: (id, w, h, r) => { const y = roadsH(r, w, h); return { w, h, border: '#', road: '=', lamps: 0, fills: [{ rect: [1, 1, w - 2, h - 2], ch: 'ζ' }], paths: [[[1, y], [w - 2, y]], [[w >> 1, y], [w >> 1, 1]]], props: [['Γ', (w >> 1) + 2, y - 2]], scatter: [['ö', 3, 'away'], ['Ξ', 4, 'away'], ['R', 3, 'away']], animals: [{ sp: 'nandulin', n: 2, rect: [3, y + 2, w - 6, 4] }] }; },
};

/** Which archetype (and ground theme) each locality uses. */
export const LOC_PLAN = {
  rosario: ['rio', null], ecilda: ['campo', 'seca'], palmitas: ['monte', 'seca'], villasoriano: ['puerto', null], young: ['eucaliptal', null],
  guichon: ['monte', null], belen: ['rio', null], baltasar: ['sierra', 'sierra'], tranqueras: ['colorada', 'colorada'], tupambae: ['llanura', 'seca'],
  cerrochato: ['campo', 'seca'], lascano: ['laguna', 'arena'], casupa: ['monte', null], sarandi: ['pinar', null], sanramon: ['campo', null],
  laspiedras: ['eucaliptal', 'colorada'], paloma: ['arenal', 'arena'], piriapolis: ['playa', 'arena'],
};
