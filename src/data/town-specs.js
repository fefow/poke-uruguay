// One hand-made plan per city (44x30, the size of Montevideo) and a handful of locality archetypes.
// Specs are read by planTown (town-plan.js). Coordinates are tiles; roads are polylines, buildings find their
// own place along them. Every city has its own street network, landscape and landmarks.
import { rng } from './map-gen.js';

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
    bld: [['siniestro', 'gym_frb', [24, 10]], ['poli', 'poli_frb', [14, 17]], ['shop', 'shop_frb', [34, 17]], ['house', 'casa_frb'], ['houseG', 'casa_frb2'], ['fabrica', 'anglo_1', [30, 8]], ['terminal', 'ferry_1', [4, 17]], ['casaFaro', 'casa_frb_faro', [24, 17]]],
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
  salto: {
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 9,
      water: [{ rect: [4, 2, 26, 4] }, { blob: [36, 22, 3, 2] }, { blob: [38, 25, 2, 1] }],
      props: [...row('ρ', 3, 6, 28), ...row('ρ', 3, 1, 28)],
      paths: [[[1, 9], [42, 9]], [[16, 7], [16, 28]], [[32, 7], [32, 28]], [[3, 17], [40, 17]], [[8, 9], [8, 25]], [[24, 17], [24, 27]]],
      groves: [{ rect: [2, 19, 12, 8], tree: 'ö', density: 0.55, rows: true, lanes: 4 }, { rect: [34, 11, 8, 5], tree: 'ξ', rows: true, density: 0.9 }],
      scatter: [['Ω', 6, 'road'], ['ξ', 8, 'away']],
      animals: [],
    },
    bld: [['psiquico', 'gym_sal', [22, 13]], ['poli', 'poli_sal'], ['shop', 'shop_sal'], ['houseV', 'casa_sal'], ['houseB', 'radio_sal', [10, 14]], ['fabrica', 'represa_1', [26, 8]], ['house', 'casa_sal2']],
    fill: 8,
  },
  // Artigas: a mining town climbing a stony hill on a zigzag road, amethyst country.
  artigas: {
    theme: 'sierra',
    spec: {
      w: W, h: H, border: '#', road: '=', lamps: 10,
      hills: [{ rect: [1, 1, 20, 6], ch: 'μ', density: 0.55 }, { rect: [26, 1, 17, 8], ch: 'μ', density: 0.6 }, { rect: [1, 24, 18, 5], ch: 'μ', density: 0.45 }],
      paths: [[[1, 27], [14, 27], [14, 21], [30, 21], [30, 15], [8, 15], [8, 10], [26, 10], [26, 1]], [[36, 21], [36, 28]], [[30, 15], [42, 15]], [[41, 21], [30, 21]]],
      fills: [{ rect: [30, 22, 12, 6], ch: 'ν' }],
      groves: [{ rect: [2, 17, 5, 5], tree: '#', density: 0.5, lanes: 3 }],
      scatter: [['ν', 10, 'away'], ['Ñ', 6, 'away'], ['R', 8, 'away']],
      props: [['τ', 33, 24], ['τ', 34, 24], ['γ', 38, 25]],
      animals: [{ sp: 'mulitin', n: 2, rect: [30, 22, 12, 6] }],
    },
    bld: [['poli', 'poli_artigas'], ['shop', 'shop_artigas'], ['house', 'casa_artigas'], ['houseG', 'casa_artigas2']],
    fill: 8,
  },
  // Rivera: twin plazas on the border with a line of boundary stones down the middle.
  rivera: {
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 7,
      paths: [[[1, 14], [42, 14]], [[22, 1], [22, 28]], [[4, 6], [40, 6]], [[4, 22], [40, 22]], [[11, 6], [11, 22]], [[33, 6], [33, 22]]],
      plazas: [{ x: 15, y: 15, w: 6, h: 6, piece: 'fuente', benches: false }, { x: 24, y: 15, w: 6, h: 6, piece: 'Γ' }, { x: 15, y: 7, w: 6, h: 6 }, { x: 24, y: 7, w: 6, h: 6, ring: 'Σ' }],
      props: [...row('ρ', 23, 2, 3, 1, true), ...row('ρ', 23, 8, 5, 1, true), ...row('ρ', 23, 16, 5, 1, true), ...row('ρ', 23, 23, 5, 1, true)],
      scatter: [['Ω', 6, 'road'], ['#', 8, 'away']],
      animals: [],
    },
    bld: [['lucha', 'gym_riv', [8, 18]], ['poli', 'poli_riv'], ['shop', 'shop_riv'], ['houseB', 'casa_riv'], ['house', 'aduana_riv'], ['houseG', 'safari_gate'], ['houseO', 'casa_riv2'], ['torre', 'torre_1', [34, 18]]],
    fill: 8,
  },
  // Tacuarembó: gaucho country: red earth, pine plantations to the west, eucalyptus to the east, parrilla.
  tacuarembo: {
    theme: 'colorada',
    spec: {
      w: W, h: H, border: 'Ñ', tree: 'Ñ', road: '=', lamps: 12,
      groves: [{ rect: [2, 2, 14, 12], tree: 'Ñ', density: 0.9, lanes: 5 }, { rect: [30, 20, 12, 8], tree: 'Ö', density: 0.9, lanes: 4 }, { rect: [2, 20, 8, 8], tree: 'Ñ', lanes: 4 }],
      paths: [[[1, 16], [42, 16]], [[20, 1], [20, 28]], [[20, 8], [38, 8]], [[28, 8], [28, 16]], [[8, 16], [8, 19]], [[34, 16], [34, 20]]],
      plazas: [{ x: 21, y: 17, w: 7, h: 5, piece: 'Γ', benches: true }],
      fills: [{ rect: [22, 9, 18, 5], ch: 'ζ' }],
      props: [...fence([23, 9, 16, 5], { side: 's', at: 4 }), ['Θ', 18, 12], ['Ξ', 33, 10], ['Ξ', 35, 11]],
      scatter: [['ö', 3, 'away'], ['Ω', 4, 'road']],
      animals: [{ sp: 'criollo', n: 3, rect: [24, 10, 14, 3] }, { sp: 'oveja', n: 2, rect: [24, 10, 14, 3] }],
    },
    bld: [['planta', 'gym_tac', [24, 12]], ['poli', 'poli_tac'], ['shop', 'shop_tac'], ['houseG', 'casa_tac'], ['houseO', 'casa_tac2'], ['houseV', 'parrilla_tac', [14, 18]]],
    fill: 7,
  },
  // Melo: laguna Merín and low hills; a diagonal staircase main street, ombú in the plaza.
  melo: {
    theme: 'seca',
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 9,
      water: [{ blob: [36, 6, 7, 4] }],
      fills: [{ rect: [28, 1, 14, 11], ch: 's', only: '.' }],
      hills: [{ rect: [2, 2, 16, 7], ch: 'μ', density: 0.35 }],
      paths: [[[1, 27], [10, 27], [10, 22], [20, 22], [20, 17], [30, 17], [30, 12], [42, 12]], [[20, 1], [20, 22]], [[10, 27], [10, 12], [4, 12]], [[30, 17], [30, 28]], [[40, 12], [40, 17]]],
      plazas: [{ x: 21, y: 18, w: 8, h: 6, piece: 'ö', benches: true }],
      scatter: [['ö', 5, 'away'], ['Ω', 4, 'road'], ['R', 5, 'away']],
      props: [['β', 34, 9]],
      animals: [{ sp: 'garza', n: 2, rect: [29, 3, 6, 4] }],
    },
    bld: [['poli', 'poli_melo'], ['shop', 'shop_melo'], ['house', 'casa_melo'], ['houseG', 'casa_melo2'], ['torre', 'anima_1', [34, 18]]],
    fill: 10,
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
  rocha: {
    theme: 'arena',
    spec: {
      w: W, h: H, border: 'p', tree: 'p', road: 'c', lamps: 12,
      water: [{ blob: [8, 24, 8, 3] }, { blob: [34, 5, 6, 3] }],
      fills: [{ rect: [1, 18, 42, 11], ch: 'ß', only: '.' }],
      groves: [{ rect: [2, 2, 14, 8], tree: 'p', density: 0.5, lanes: 4 }, { rect: [26, 10, 14, 6], tree: 'p', density: 0.45, lanes: 4 }],
      paths: [[[1, 13], [42, 13]], [[22, 1], [22, 18]], [[22, 13], [22, 17], [38, 17]], [[10, 13], [10, 7]], [[32, 13], [32, 1]]],
      plazas: [{ x: 15, y: 14, w: 6, h: 3, piece: 'fuente', ring: null }],
      scatter: [['p', 12, 'away'], ['ξ', 6, 'away'], ['Ω', 3, 'road']],
      animals: [{ sp: 'tuco', n: 2, rect: [12, 20, 20, 5] }],
    },
    bld: [['poli', 'poli_rocha'], ['shop', 'shop_rocha'], ['house', 'casa_rocha'], ['houseG', 'casa_rocha2']],
    fill: 8,
  },
  // Maldonado / Punta del Este: a peninsula with the rambla, La Mano rising from the sand, the port with boats.
  punta: {
    theme: 'arena',
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 7,
      fills: [{ rect: [1, 20, 42, 3], ch: 's', only: '.' }],
      water: [{ rect: [1, 23, 42, 6] }, { rect: [34, 1, 9, 12] }],
      paths: [[[1, 18], [34, 18], [34, 14], [42, 14]], [[22, 1], [22, 19]], [[6, 1], [6, 18]], [[14, 6], [30, 6]], [[3, 11], [18, 11]], [[28, 11], [28, 18]], [[18, 19], [18, 21]]],
      props: [['M', 12, 21], ['β', 30, 22], ['β', 37, 20], ['β', 36, 15], ['γ', 38, 17], ['γ', 39, 17], ['Δ', 9, 17], ['Δ', 25, 17], ['Δ', 31, 17]],
      scatter: [['Ω', 4, 'road'], ['p', 6, 'away']],
      animals: [{ sp: 'lobito', n: 2, rect: [4, 21, 30, 1] }],
    },
    bld: [['agua', 'gym_pde', [20, 12]], ['poli', 'poli_pde'], ['shop', 'shop_pde'], ['casino', 'casino_pde']],
    fill: 8,
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
  florida: {
    theme: 'seca',
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 9,
      water: [{ pts: [[4, 1], [4, 10], [10, 14], [10, 28]], w: 2 }],
      paths: [[[1, 15], [42, 15]], [[22, 1], [22, 28]], [[14, 6], [40, 6]], [[14, 24], [40, 24]], [[14, 6], [14, 24]], [[34, 6], [34, 24]]],
      plazas: [{ x: 18, y: 11, w: 9, h: 9, piece: 'Γ', benches: true, ring: 'Ω' }],
      fills: [{ rect: [36, 8, 6, 14], ch: 'ζ' }],
      props: [['Λ', 38, 9], ['Λ', 40, 13], ['Λ', 38, 18], ['ñ', 6, 4], ['ñ', 7, 12], ['ñ', 11, 20], ...fence([36, 8, 7, 14], { side: 'w', at: 6 })],
      scatter: [['Ω', 6, 'road'], ['ö', 4, 'away']],
      animals: [{ sp: 'oveja', n: 3, rect: [37, 10, 4, 10] }],
    },
    bld: [['volador', 'gym_florida', [22, 23]], ['poli', 'poli_florida'], ['shop', 'shop_florida'], ['house', 'casa_florida'], ['houseG', 'casa_florida2']],
    fill: 9,
  },
  // Durazno: ash country over an old volcano: lava pools, an iron bridge over the Yí.
  durazno: {
    spec: {
      w: W, h: H, border: 'K', tree: 'R', road: '=', lamps: 0,
      fills: [{ rect: [1, 1, 42, 28], ch: '`' }],
      water: [{ rect: [1, 19, 42, 3] }],
      paths: [[[1, 13], [42, 13]], [[22, 1], [22, 28]], [[6, 6], [38, 6]], [[6, 25], [38, 25]], [[22, 19], [22, 22]], [[10, 6], [10, 13]], [[34, 6], [34, 13]]],
      props: [['^', 3, 3], ['^', 4, 3], ['^', 4, 4], ['^', 38, 3], ['^', 39, 3], ['^', 39, 4], ['^', 3, 27], ['^', 38, 27]],
      scatter: [[';', 30, 'away'], ['R', 14, 'away'], ['Ω', 3, 'road']],
      animals: [],
    },
    bld: [['fuego', 'gym_dur', [26, 10]], ['poli', 'poli_dur'], ['shop', 'shop_dur'], ['house', 'casa_dur']],
    fill: 7,
  },
  // Canelones: vineyards in long rows around a plaza, windmills and the bodega.
  canelones: {
    spec: {
      w: W, h: H, border: '#', road: 'c', lamps: 10,
      paths: [[[1, 12], [42, 12]], [[22, 1], [22, 28]], [[4, 20], [40, 20]], [[10, 12], [10, 20]], [[34, 12], [34, 20]]],
      plazas: [{ x: 18, y: 13, w: 9, h: 6, piece: 'fuente', benches: true }],
      groves: [{ rect: [2, 22, 18, 6], tree: 'ξ', rows: true, density: 1 }, { rect: [24, 22, 18, 6], tree: 'ξ', rows: true, density: 1 }, { rect: [2, 2, 14, 7], tree: 'ξ', rows: true, density: 1 }, { rect: [28, 2, 14, 7], tree: 'ξ', rows: true, density: 1 }],
      props: [['Λ', 20, 4], ['Λ', 24, 27], ['Ξ', 2, 10], ['Ξ', 41, 10]],
      scatter: [['Ω', 6, 'road'], ['#', 6, 'away']],
      animals: [],
    },
    bld: [['bicho', 'gym_canelones', [22, 9]], ['poli', 'poli_canelones'], ['shop', 'shop_canelones'], ['house', 'casa_canelones'], ['houseG', 'casa_canelones2']],
    fill: 8,
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
