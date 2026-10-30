// Act 2: Durazno and the north and west of the country (Durazno, Tacuarembó, Rivera, Salto,
// Paysandú, Fray Bentos), the Equipo PP hideouts and the Liga. Maps come from map-gen.js.
import { TR, room, HOUSE, GYM, poli, shop } from './map-kit.js';
import { city, route, wildList, fishList, teamOf, fitToMap } from './map-gen.js';

// ---------------------------------------------------------------- helpers
const tr = (spot, look, id, name, cls, types, levels, [intro, lose, after], opts = {}) => ({
  x: spot.x, y: spot.y, look, dir: opts.dir ?? spot.dir ?? 'down', sight: opts.sight ?? 4, ...(opts.cond ? { cond: opts.cond } : {}), ...(opts.gate ? { gate: true } : {}),
  trainer: TR(id, name, cls, opts.team ?? teamOf(types, levels, id), Math.round(levels[levels.length - 1] * 20), intro, lose, after, look),
});
const grunt = (spot, id, levels, intro, lose, after, opts = {}) => tr(spot, 'grunt', id, 'Recluta PP', 'Equipo PP', ['veneno', 'siniestro'], levels, [intro, lose, after], opts);
const npc = (x, y, look, text, extra = {}) => ({ x, y, look, text: [].concat(text), ...extra });
const wander = (x, y, look, text) => npc(x, y, look, text, { wander: true });
const house = (name, ...npcs) => room(HOUSE, { name, npcs });
const casaNpc = (look, text) => ({ x: 6, y: 3, look, dir: 'left', text: [].concat(text) });

const FOREST = ['planta', 'bicho', 'veneno'];

// ---------------------------------------------------------------- DURAZNO (gym 4, fire)
const DUR = city({
  seed: 'durazno', w: 26, h: 18, sa: 6, sb: 13, base: '`', border: 'K', road: '=',
  a: [['fuego', 2, 'gym_dur'], ['poli', 11, 'poli_dur'], ['shop', 18, 'shop_dur']],
  b: [['house', 3, 'casa_dur']],
  vroads: [14], nroads: [9],
  decor: { ';': 26, R: 8 },
  water: [[18, 9, 3, 2, '^'], [6, 15, 3, 1, '^'], [20, 15, 4, 1, '^']],
  signs: [[16, 7]],
  exits: { e: 6, n: 9 },
});

// ---------------------------------------------------------------- RUTA 5: Durazno -> Tacuarembó
// Open prairie: wide, almost no trees, big grass fields and a blocked road.
const R5 = route({ seed: 'ruta5', w: 30, h: 30, axis: 'v', from: 14, to: 9, grass: [[9, 3, 6]], ponds: [], trees: 0, rocks: 3, flowers: 22, gates: [20] });
// ---------------------------------------------------------------- TACUAREMBÓ (gym 5, grass)
const TAC = city({
  seed: 'tacuarembo', sa: 6, sb: 15,
  a: [['houseG', 2, 'casa_tac'], ['planta', 8, 'gym_tac'], ['poli', 17, 'poli_tac'], ['shop', 23, 'shop_tac']],
  b: [['houseO', 4, 'casa_tac2'], ['houseV', 17]],
  vroads: [14], nroads: [14], sroads: [14], decor: { '#': 14, q: 6, f: 14 },
  signs: [[26, 7], [7, 16]],
  exits: { w: 6, e: 6, s: 14, n: 14 },
});
// ---------------------------------------------------------------- CICLOVÍA (bicycle only)
// A long paved cycle path north of Tacuarembó: you are on the bike the whole way, trainers block it and the end has a reward.
const CIC = route({ seed: 'ciclovia', w: 16, h: 62, axis: 'v', from: 8, to: 8, path: 'c', grass: [[2, 3, 3]], ponds: [], trees: 8, rocks: 4, flowers: 30, gates: [16, 28, 40], signs: 0 });
// ---------------------------------------------------------------- RUTA 30: Tacuarembó -> Rivera
// Short and tidy: a customs post (fence line with one opening) before the border city.
const R30 = route({ seed: 'ruta30', w: 30, h: 14, axis: 'h', from: 6, to: 7, grass: [[3, 3, 4]], ponds: [], trees: 6, treeChar: '#', flowers: 4, gates: [12] });
// ---------------------------------------------------------------- RIVERA (gym 6, fighting)
const RIV = city({
  seed: 'rivera', sa: 6, sb: 15,
  a: [['houseB', 2, 'casa_riv'], ['lucha', 8, { to: 'gym_riv', req: 'torre_clear', deny: ['La puerta del gimnasio está cerrada y hay un recluta del Equipo PP custodiándola.', 'La Torre de Niebla, al norte de la plaza, mantiene la ciudad entera bajo control.'] }], ['poli', 17, 'poli_riv'], ['shop', 23, 'shop_riv']],
  b: [['house', 4], ['houseO', 17, 'casa_riv2'], ['torre', 23, 'torre_1']],
  vroads: [14], decor: { '#': 8, q: 4, f: 10 },
  signs: [[26, 7], [14, 18]],
  exits: { w: 6 },
});
// ---------------------------------------------------------------- RUTA 31: Salto <- Tacuarembó
// Long and dense: cane fields and woods, with a guarded road block halfway.
const R31 = route({ seed: 'ruta31', w: 44, h: 16, axis: 'h', from: 8, to: 6, grass: [[7, 3, 4]], ponds: [[1, 3, 3]], trees: 45, treeChar: '#', rocks: 3, gates: [24] });
// ---------------------------------------------------------------- SALTO (gym 7, psychic)
const SAL = city({
  seed: 'salto', sa: 6, sb: 15,
  a: [['houseV', 3, 'casa_sal'], ['psiquico', 9, 'gym_sal'], ['poli', 18, 'poli_sal'], ['shop', 23, 'shop_sal']],
  b: [['houseB', 3], ['fabrica', 8, 'represa_1'], ['house', 18, 'casa_sal2']],
  vroads: [15], sroads: [15], decor: { p: 8, f: 12, '#': 6 },
  water: [[1, 16, 8, 3], [20, 17, 6, 2]],
  signs: [[7, 7], [14, 18]],
  exits: { e: 6, s: 15 },
});
// ---------------------------------------------------------------- RUTA 3: Salto -> Paysandú
// River crossing: a long bridge over the Uruguay with guards that cannot be avoided.
const R3 = route({ seed: 'ruta3', w: 18, h: 48, axis: 'v', from: 9, to: 9, grass: [[2, 3, 4]], ponds: [], trees: 6, bridge: [14, 34], gates: [19, 29] });
// ---------------------------------------------------------------- PAYSANDÚ (locality)
const PAY = city({
  seed: 'paysandu', w: 26, h: 18, sa: 6, sb: 13, road: 'c',
  a: [['houseO', 3, 'casa_pay'], ['poli', 10, 'poli_pay'], ['shop', 18, 'shop_pay']],
  b: [['houseG', 6, 'casa_pay2']],
  vroads: [14], nroads: [12], sroads: [14], decor: { '#': 8, q: 6, f: 10 },
  signs: [[16, 7]],
  exits: { n: 12, s: 14 },
});
// ---------------------------------------------------------------- RUTA 24: Paysandú -> Fray Bentos
// Rocky ridge: narrow and short, packed with boulders.
const R24 = route({ seed: 'ruta24', w: 20, h: 26, axis: 'v', from: 10, to: 10, grass: [[4, 3, 4]], ponds: [[1, 3, 3]], trees: 3, rocks: 28, gates: [12] });
// ---------------------------------------------------------------- FRAY BENTOS (gym 8, dark)
const FRB = city({
  seed: 'fraybentos', sa: 6, sb: 15, road: 'c',
  a: [['house', 2, 'casa_frb'], ['siniestro', 8, { to: 'gym_frb', req: 'anglo_clear', deny: ['La puerta del gimnasio está cerrada con candado.', 'Un cartel dice: "Cerrado por orden del director del frigorífico".'] }], ['poli', 17, 'poli_frb'], ['shop', 23, 'shop_frb']],
  b: [['houseB', 1], ['fabrica', 7, 'anglo_1'], ['houseG', 17, 'casa_frb2']],
  vroads: [14], decor: { '#': 8, f: 8 },
  water: [[1, 17, 26, 1]],
  signs: [[6, 7], [26, 7]],
  exits: { n: 14 },
});

const sign = (texts) => (r) => texts.slice(0, r.signs.length);

export const ACT2_OUTDOOR = {
  durazno: {
    name: 'Durazno', music: 'town', bg: 'canyon', tiles: DUR.tiles,
    doors: [...DUR.doors],
    signs: ['DURAZNO\nEn el centro del país el verano pega fuerte. Dicen que bajo la ceniza todavía hay brasas de un antiguo volcán.\nGimnasio de Durazno ←'],
    exits: {
      e: { to: 'minas' },
      n: { to: 'ruta5', req: 'pp_clear', deny: ['Un camino de tierra sube hacia el norte.', 'Antes de seguir, hay que resolver lo de la fábrica de Minas: el Equipo PP sigue activo.'] },
    },
    enc: { rate: 0.12, list: wildList(['fuego', 'tierra', 'roca'], 31, 34, 7, 'dur', ['pavesa', 'alacran', 'alazan', 'guijarro', 'geoda', 'arenisca']) },
    npcs: [
      npc(7, 8, 'gaucho', ['Acá la gente trabaja con el fuego desde siempre.', 'El gimnasio es la sede de ANCAP en Durazno. Su presidenta, Candelaria Ríos, domina el fuego.'], { dir: 'right' }),
      tr({ x: 7, y: 7, dir: 'right' }, 'gaucho', 'dur_a', 'Rodrigo', 'Herrero', ['fuego', 'tierra'], [32, 32], ['El calor de acá forja criaturas duras.', 'Se enfrió la cosa.', 'Candelaria Ríos usa tipo Fuego. Llevá algo de Agua o de Roca.']),
      tr({ x: 16, y: 8, dir: 'left' }, 'girl', 'dur_b', 'Camila', 'Geóloga', ['tierra', 'roca'], [32, 33], ['Estudio por qué el suelo guarda tanto calor.', 'Buen combate.', 'Los datos no cierran: el calor aumenta desde que llegó el Equipo PP.']),
      wander(12, 9, 'oldman', ['Hace décadas no llueve como antes. La ceniza lo cubre todo.', 'Las criaturas de fuego se sienten cómodas acá.']),
      npc(20, 8, 'boy', ['Cruzando el puente de hierro se llega al norte. Pero el camino está cortado por la gente de gris.'], { cond: (f) => !f.pp_clear }),
    ],
    items: [{ x: 23, y: 11, item: 'piedra_agata', id: 'dur_item1' }],
  },

  ruta5: {
    name: 'Ruta 5', music: 'route', bg: 'field', tiles: R5.tiles,
    signs: sign(['RUTA 5\nDurazno ↓  ·  Tacuarembó ↑\nCuidado con los camiones.'])(R5),
    exits: { s: { to: 'durazno' }, n: { to: 'tacuarembo' } },
    enc: { rate: 0.11, list: wildList(['normal', 'planta', 'tierra', 'volador', 'bicho'], 35, 38, 9, 'r5') },
    fish: fishList(35, 38, 5),
    npcs: [
      tr(R5.spots[0], 'oldman', 'r5_a', 'Aureliano', 'Camionero', ['normal', 'tierra'], [35, 36], ['Llevo veinte años por esta ruta. Combatamos.', 'Frené a tiempo.', 'Más adelante hay un cruce con policía. No es normal.']),
      tr(R5.spots[1], 'girl', 'r5_b', 'Mirta', 'Estudiante', ['planta', 'bicho'], [35, 37], ['Voy a Tacuarembó a rendir un examen.', 'Qué mala suerte.', 'Dicen que en Tacuarembó el líder entrena entre los árboles.']),
      grunt(R5.spots[2], 'r5_g1', [36, 37], 'Los de gris cortamos este camino.', 'Pasá, nomás.', 'La Torre de Niebla de Rivera ya está encendida. No van a llegar a tiempo.'),
      tr(R5.spots[4], 'boy', 'r5_c', 'Joaquín', 'Montañista', ['roca', 'volador'], [36, 37], ['¿Un combate? Dale.', 'Buen combate.', 'Descansá en la Policlínica de Tacuarembó antes de seguir.']),
      tr(R5.gateSpots[0], 'oldman', 'r5_gate', 'Hernán', 'Camionero', ['normal', 'tierra'], [37, 38], ['Mi camión se rompió justo acá. Y no te dejo pasar sin un combate.', 'Fue justo.', 'Cuando lo arreglen, seguí hacia Tacuarembó.'], { gate: true, sight: 3, dir: 'down' }),
      { ...npc(R5.walk[14].x, R5.walk[14].y, 'rival', [], { id: 'rival_r5', cond: (f) => !f.rival5, script: 'rival_r5', dir: 'up' }) },
    ],
    items: [{ ...R5.itemSpots[0], item: 'mate_dulce', id: 'r5_item1' }],
  },

  tacuarembo: {
    name: 'Tacuarembó', music: 'town', bg: 'field', tiles: TAC.tiles,
    doors: [...TAC.doors],
    signs: [
      'TACUAREMBÓ\nTierra de gauchos y cuna del tango. Cada marzo, la Patria Gaucha.',
      'GIMNASIO DE TACUAREMBÓ\nLíder: Ramón Villalba, ministro de Ganadería. Tipo Planta.',
    ],
    exits: {
      s: { to: 'ruta5' },
      n: { to: 'ciclovia', req: 'got_bici', deny: ['Al norte empieza la Ciclovía, un camino pavimentado larguísimo.', 'Un cartel dice: "Solo bicicletas".'] },
      e: { to: 'ruta30', req: 'badge5', deny: ['El camino al este lleva a Rivera.', 'Un guardia te frena: "Sólo pasan entrenadores con la Medalla Tacuarembó".'] },
      w: { to: 'ruta31', req: 'badge6', deny: ['El camino al oeste baja hacia Salto.', 'Un guardia te frena: "La Ruta 31 está cerrada. Primero resolvé lo de Rivera".'] },
    },
    enc: { rate: 0.1, list: wildList(FOREST, 40, 43, 8, 'tac') },
    npcs: [
      wander(10, 8, 'gaucho', ['En Tacuarembó se hizo el primer asado de la Patria Gaucha.', 'Si te gusta el campo, andá a ver el desfile.']),
      npc(20, 9, 'girl', ['Dicen que Gardel nació acá. Otros dicen que en Toulouse.', 'En Tacuarembó nadie se pone de acuerdo.'], { dir: 'down' }),
      tr({ x: 12, y: 8, dir: 'right' }, 'oldman', 'tac_a', 'Segundo', 'Baqueano', FOREST, [37, 38], ['Conozco este monte como a mi casa.', 'Me ganaste de visitante.', 'El ministro Villalba es duro pero justo.']),
      npc(24, 9, 'cop', ['Hay movimiento raro en el norte. Los camiones del Equipo PP no paran.'], { dir: 'left' }),
      npc(5, 13, 'clerk', ['La Policlínica y el almacén están sobre la calle principal. Nunca se equivocan: siempre están en el mismo lugar.']),
    ],
    items: [{ x: 22, y: 12, item: 'torta_frita', id: 'tac_item1' }],
  },

  ciclovia: {
    name: 'Ciclovía', music: 'route', bg: 'field', bikeOnly: true, tiles: CIC.tiles,
    exits: { s: { to: 'tacuarembo' } },
    enc: { rate: 0.08, list: wildList(['volador', 'electrico'], 44, 47, 5, 'cic') },
    npcs: [
      tr(CIC.gateSpots[0], 'boy', 'cic_a', 'Nicolás', 'Ciclista', ['volador', 'electrico'], [44, 45], ['¡Carrera! Si me ganás, seguís.', 'Me pasaste por encima.', 'Más adelante hay más ciclistas.'], { gate: true, sight: 4, dir: 'down' }),
      tr(CIC.gateSpots[1], 'girl', 'cic_b', 'Camila', 'Ciclista', ['electrico', 'normal'], [45, 46], ['Esta ciclovía es mía. Pagá peaje con un combate.', 'Buen ritmo.', 'Al final hay alguien esperando.'], { gate: true, sight: 4, dir: 'down' }),
      tr(CIC.gateSpots[2], 'gaucho', 'cic_c', 'Tomás', 'Ciclista', ['volador', 'normal'], [46, 47], ['El último tramo es el más duro.', 'Estaba difícil.', 'Ya casi llegás.'], { gate: true, sight: 4, dir: 'down' }),
      { x: CIC.walk[3].x, y: CIC.walk[3].y + 1, look: 'oldman', dir: 'down', script: 'gift_ciclovia' },
    ],
    items: [{ ...CIC.itemSpots[0], item: 'dulce_de_leche', id: 'cic_item1' }],
  },

  ruta30: {
    name: 'Ruta 30', music: 'route', bg: 'field', tiles: R30.tiles,
    signs: sign(['RUTA 30\nTacuarembó ←  ·  Rivera →\nFrontera con Brasil a pocos kilómetros.'])(R30),
    exits: { w: { to: 'tacuarembo' }, e: { to: 'rivera' } },
    enc: { rate: 0.12, list: wildList(['planta', 'bicho', 'veneno', 'lucha'], 39, 42, 9, 'r30') },
    fish: fishList(39, 42, 30),
    npcs: [
      tr(R30.spots[0], 'boy', 'r30_a', 'Gonzalo', 'Naturalista', ['bicho', 'planta'], [39, 40], ['Busco una especie que no figura en ningún libro.', 'Qué curioso.', 'Si ves una mariposa gigante, avisame.']),
      tr(R30.spots[1], 'girl', 'r30_b', 'Mariana', 'Apicultora', ['bicho'], [39, 41], ['No te acerques a las colmenas.', 'Zumbó fuerte.', 'La miel de esta zona es de las mejores del país.']),
      grunt(R30.spots[2], 'r30_g1', [40, 41], 'Esta ruta es nuestra desde ahora.', 'Qué mala suerte.', 'Rivera ya es de la jefa Bruma.'),
      tr(R30.spots[3], 'gaucho', 'r30_c', 'Atilio', 'Peón', ['normal', 'lucha'], [40, 41], ['Para pasar tenés que ganarle al peón.', 'Buen combate, amigo.', 'En la frontera se habla mezclado: portuñol.']),
      tr(R30.gateSpots[0], 'cop', 'r30_aduana', 'Inspector Duarte', 'Aduana', ['normal', 'lucha'], [41, 42], ['Aduana de Rivera. Documentos, por favor. Y un combate de rutina.', 'Todo en orden. Pasá.', 'Del otro lado de la plaza ya es Brasil.'], { gate: true, sight: 3 }),
      grunt(R30.spots[4], 'r30_g2', [41, 42], 'Dije que nadie pasa.', 'Está bien.', 'Pregunten en la plaza por la Torre.'),
    ],
    items: [{ ...R30.itemSpots[0], item: 'ultraesfera', id: 'r30_item1' }],
  },

  rivera: {
    name: 'Rivera', music: 'town', bg: 'field', tiles: RIV.tiles,
    doors: [...RIV.doors],
    signs: [
      'RIVERA\nLa ciudad que comparte calle con Brasil. La Plaza Internacional es una sola, con dos banderas.',
      'TORRE DE NIEBLA\nEntrada prohibida. — Equipo PP.',
    ],
    exits: { w: { to: 'ruta30' } },
    enc: { rate: 0.1, list: wildList(['lucha', 'normal', 'bicho', 'planta'], 40, 42, 8, 'riv') },
    npcs: [
      wander(10, 9, 'girl', ['En Rivera cruzás la calle y estás en otro país.', 'Mi abuelo vendía en un lado y compraba en el otro.']),
      npc(22, 9, 'oldman', ['La niebla de la Torre nos tiene sin sol desde hace días.', 'La policía no puede entrar. Alguien tiene que subir.'], { dir: 'left', cond: (f) => !f.torre_clear }),
      npc(22, 9, 'oldman', ['El sol volvió a Rivera. Gracias.'], { dir: 'left', cond: (f) => f.torre_clear }),
      grunt({ x: 11, y: 7, dir: 'down' }, 'riv_g1', [41, 42], 'Nadie entra al gimnasio.', 'Qué mala suerte.', 'La jefa Bruma está arriba de la Torre.', { cond: (f) => !f.torre_clear }),
      { x: 11, y: 7, look: 'cop', dir: 'down', text: ['Gracias por lo de la Torre. El gimnasio ya está abierto.'], cond: (f) => f.torre_clear },
    ],
    items: [{ x: 24, y: 9, item: 'refuerzo_defensa', id: 'riv_item1' }],
  },

  ruta31: {
    name: 'Ruta 31', music: 'route', bg: 'field', tiles: R31.tiles,
    signs: sign(['RUTA 31\nTacuarembó →  ·  Salto ←\nRiego de arroz y cañaverales.'])(R31),
    exits: { e: { to: 'tacuarembo' }, w: { to: 'salto' } },
    enc: { rate: 0.12, list: wildList(['normal', 'volador', 'bicho', 'agua', 'psiquico'], 42, 44, 9, 'r31') },
    fish: fishList(42, 44, 31),
    npcs: [
      tr(R31.spots[0], 'boy', 'r31_a', 'Ezequiel', 'Pescador', ['agua'], [42, 43], ['Pesco desde antes del amanecer.', 'Se escapó.', 'Salto tiene las mejores termas del país.']),
      tr(R31.spots[1], 'girl', 'r31_b', 'Ana', 'Cañera', ['planta', 'tierra'], [42, 44], ['El cañaveral es mi oficina.', 'Buen combate.', 'Cuidado en Salto: los apagones son culpa de gente de gris.']),
      grunt(R31.spots[2], 'r31_g1', [43, 44], 'Cortamos la luz a propósito.', 'No debía pasar esto.', 'La Represa es nuestra desde la mañana.'),
      tr(R31.spots[3], 'oldman', 'r31_c', 'Ceferino', 'Veterano', ['normal', 'lucha'], [43, 44], ['Pasé mil batallas. Una más no hace diferencia.', 'Me jubilo.', 'Los jóvenes de ahora combaten mejor que nosotros.']),
      tr(R31.gateSpots[0], 'gaucho', 'r31_gate', 'Capataz Olivera', 'Capataz', ['tierra', 'planta'], [43, 44], ['Este camino es de la estancia. Para pasar, tenés que ganarme.', 'Pasá, nomás.', 'Más adelante empieza Salto.'], { gate: true, sight: 3, dir: 'right' }),
      grunt(R31.spots[4], 'r31_g2', [44, 44], 'Quedate quieto.', 'Pasá.', 'Qué mala suerte.'),
    ],
    items: [{ ...R31.itemSpots[0], item: 'alfajor_triple', id: 'r31_item1' }],
  },

  salto: {
    name: 'Salto', music: 'town', bg: 'field', tiles: SAL.tiles,
    doors: [...SAL.doors],
    signs: [
      'SALTO\nTermas, naranjas y el río Uruguay. La represa de Salto Grande abastece de luz a medio país.',
      'REPRESA DE SALTO GRANDE ↓\nEntrada prohibida al público.',
    ],
    exits: {
      e: { to: 'ruta31' },
      s: { to: 'ruta3', req: (f) => f.badge7 && f.represa_clear, deny: ['Un camino sigue hacia el sur, a Paysandú.', 'Pero la Represa sigue en manos de la gente de gris, y el camino se abre recién cuando tengas la Medalla Salto y haya luz.'] },
    },
    enc: { rate: 0.1, list: wildList(['volador', 'psiquico', 'electrico', 'agua'], 44, 46, 8, 'sal') },
    fish: fishList(44, 46, 7),
    npcs: [
      wander(12, 9, 'swimmer', ['Las termas de Salto son buenas para el cuerpo y para la cabeza.', 'Si tenés algo de tipo Siniestro, el líder lo va a sufrir.']),
      npc(22, 9, 'girl', ['El gimnasio es un observatorio con techo de vidrio.', 'Horacio Quiroga escribía cuentos oscuros en Salto. Dicen que adivina tus movimientos.'], { dir: 'left' }),
      tr({ x: 11, y: 9, dir: 'down' }, 'oldman', 'sal_a', 'Don Rufino', 'Astrónomo aficionado', ['psiquico', 'volador'], [44, 44], ['Anoche vi algo raro en el cielo.', 'Qué cielo más despejado.', 'Los de gris prenden luces fuertes en la Represa.']),
      grunt({ x: 18, y: 9, dir: 'left' }, 'sal_g1', [44, 45], 'Esta ciudad se queda a oscuras.', 'No tiene sentido.', 'Garúa está dentro de la Represa.', { cond: (f) => !f.represa_clear }),
      npc(15, 11, 'cop', ['La Represa está tomada. Si querés ayudar, la entrada está debajo del puente.'], { dir: 'down', cond: (f) => !f.represa_clear }),
    ],
    items: [{ x: 5, y: 11, item: 'alfajor_triple', id: 'sal_item1' }],
  },

  ruta3: {
    name: 'Ruta 3', music: 'route', bg: 'field', tiles: R3.tiles,
    signs: sign(['RUTA 3\nSalto ↑  ·  Paysandú ↓\nSigue el río Uruguay.'])(R3),
    exits: { n: { to: 'salto' }, s: { to: 'paysandu' } },
    enc: { rate: 0.12, list: wildList(['normal', 'volador', 'siniestro', 'agua', 'tierra'], 46, 48, 9, 'r3') },
    fish: fishList(46, 48, 3),
    npcs: [
      tr(R3.spots[0], 'boy', 'r3_a', 'Facundo', 'Camionero', ['normal', 'tierra'], [46, 47], ['Voy y vengo por esta ruta todos los días.', 'Me quedé sin nafta.', 'En Paysandú hay una feria de artesanos.']),
      grunt(R3.spots[1], 'r3_g1', [47, 48], 'Sin la Represa, la niebla manda.', 'Imposible.', 'Calima nos va a premiar igual.'),
      tr(R3.spots[2], 'girl', 'r3_b', 'Lorena', 'Navegante', ['agua', 'volador'], [47, 48], ['El río es más grande que el mar para mí.', 'Buen viento.', 'Paysandú es la heroica.']),
      grunt(R3.spots[3], 'r3_g2', [48, 48], 'Mejor volvé.', 'No era tan difícil.', 'Nos vemos en el frigorífico.'),
      tr(R3.gateSpots[0], 'oldman', 'r3_c', 'Aníbal', 'Veterano', ['tierra', 'roca'], [47, 48], ['El puente es angosto y yo ocupo todo el ancho.', 'Me rindo. Pasá.', 'Fray Bentos está al sur de Paysandú.'], { gate: true, sight: 4 }),
      grunt(R3.gateSpots[1], 'r3_g3', [48, 49], 'Nadie cruza el río sin pasar por mí.', 'Se acabó.', 'Del otro lado está Paysandú.', { gate: true, sight: 4, dir: 'up' }),
    ],
    items: [{ ...R3.itemSpots[0], item: 'pan_casero', id: 'r3_item1' }],
  },

  paysandu: {
    name: 'Paysandú', music: 'town', bg: 'field', locality: true, tiles: PAY.tiles,
    doors: [...PAY.doors],
    signs: ['PAYSANDÚ\nLa Heroica. En el puente Internacional se cruza hacia Argentina.'],
    exits: { n: { to: 'ruta3' }, s: { to: 'ruta24' } },
    enc: { rate: 0.1, list: wildList(['normal', 'volador', 'tierra', 'agua'], 47, 49, 8, 'pay') },
    npcs: [
      wander(8, 9, 'girl', ['El Puente Internacional une dos países. Yo lo crucé de chica.', 'Después de la niebla, todo se ve distinto.']),
      npc(18, 9, 'gaucho', ['Más al sur está Fray Bentos. Allí se construyó el frigorífico que cambió el mundo.', 'Hoy lo usan para otra cosa.'], { dir: 'down' }),
      tr({ x: 20, y: 9, dir: 'left' }, 'sailor', 'pay_a', 'Marcelo', 'Marinero', ['agua', 'volador'], [47, 48], ['Navego el río hace treinta años.', 'Buen combate.', 'Los camiones de gris van al sur.']),
    ],
    items: [{ x: 3, y: 12, item: 'pan_casero', id: 'pay_item1' }],
  },

  ruta24: {
    name: 'Ruta 24', music: 'route', bg: 'field', tiles: R24.tiles,
    signs: sign(['RUTA 24\nPaysandú ↑  ·  Fray Bentos ↓\nEl frigorífico queda cerca del río.'])(R24),
    exits: { n: { to: 'paysandu' }, s: { to: 'fraybentos' } },
    enc: { rate: 0.12, list: wildList(['normal', 'siniestro', 'veneno', 'volador', 'tierra'], 48, 51, 9, 'r24') },
    fish: fishList(48, 51, 24),
    npcs: [
      tr(R24.spots[0], 'girl', 'r24_a', 'Valeria', 'Ingeniera', ['electrico', 'psiquico'], [48, 49], ['Estudio cómo funciona la niebla artificial.', 'Muy interesante.', 'Es una red de torres. Todas conectadas.']),
      grunt(R24.spots[1], 'r24_g1', [49, 50], 'El jefe no recibe visitas.', 'No.', 'Calima está arriba del frigorífico.'),
      tr(R24.spots[2], 'boy', 'r24_b', 'Santiago', 'Obrero', ['tierra', 'roca'], [48, 50], ['Salí del turno y me topé con vos.', 'Qué cansancio.', 'En el frigorífico hay movimientos raros.']),
      tr(R24.gateSpots[0], 'boy', 'r24_gate', 'Capataz Rivas', 'Obrero', ['roca', 'tierra'], [49, 50], ['La cantera está cerrada. A menos que me ganes.', 'Pasá, pero con cuidado.', 'Fray Bentos queda al sur.'], { gate: true, sight: 3 }),
      grunt(R24.spots[3], 'r24_g2', [50, 51], 'Última advertencia.', 'No lo puedo creer.', 'Calima es más fuerte que todos nosotros.'),
      { ...npc(R24.walk[18].x, R24.walk[18].y, 'rival', [], { id: 'rival_r24', cond: (f) => !f.rival6, script: 'rival_r24', dir: 'up' }) },
    ],
    items: [{ ...R24.itemSpots[0], item: 'alfajor_triple', id: 'r24_item1' }],
  },

  fraybentos: {
    name: 'Fray Bentos', music: 'town', bg: 'field', tiles: FRB.tiles,
    doors: [...FRB.doors],
    signs: [
      'FRAY BENTOS\nPatrimonio de la Humanidad. El Anglo exportó carne al mundo entero.',
      'FRIGORÍFICO ANGLO →\nVisitas suspendidas por mantenimiento.',
    ],
    exits: { n: { to: 'ruta24' } },
    enc: { rate: 0.1, list: wildList(['siniestro', 'veneno', 'electrico', 'normal'], 49, 51, 8, 'frb') },
    fish: fishList(49, 51, 8),
    npcs: [
      wander(10, 9, 'oldman', ['El Anglo tuvo su época de oro. Después quedó vacío.', 'Hace unas semanas volvieron a prender las luces.']),
      npc(21, 9, 'girl', ['El gimnasio de acá es de tipo Siniestro. Zoraida trabaja de noche.', 'Pero el gimnasio está cerrado: el director del frigorífico ordenó clausurarlo.'], { dir: 'down', cond: (f) => !f.anglo_clear }),
      npc(21, 9, 'girl', ['El gimnasio ya abrió. Zoraida te espera.'], { dir: 'down', cond: (f) => f.anglo_clear }),
      grunt({ x: 13, y: 11, dir: 'right' }, 'frb_g1', [50, 51], 'Acá nadie entra a la planta.', 'Increíble.', 'La entrada es la puerta grande del frigorífico.', { cond: (f) => !f.anglo_clear }),
      { x: 5, y: 3, look: 'grunt', dir: 'down', text: ['El frigorífico es propiedad privada.'], cond: (f) => !f.anglo_clear },
    ],
    items: [{ x: 24, y: 10, item: 'alfajor_triple', id: 'frb_item1' }],
  },
};

for (const m of Object.values(ACT2_OUTDOOR)) {
  const taken = new Set((m.npcs ?? []).filter((n) => n.script).map((n) => `${n.x},${n.y}`));
  fitToMap(m.tiles, (m.npcs ?? []).filter((n) => !n.script), taken);
  fitToMap(m.tiles, m.items ?? [], taken);
}

// ---------------------------------------------------------------- INTERIORS
const shopStock = (extra = []) => ['superesfera', 'ultraesfera', 'mate_dulce', 'dulce_de_leche', 'chivito', 'alfajor', 'ruda', 'linimento', 'aloe', 'despertador', 'repelente', ...extra];

// gym interiors share the 12x12 plan with a leader at the back and a couple of trainers
const gym = (name, theme, leaderLook, leaderKey, trainers) => room(GYM, {
  name, theme,
  npcs: [
    { x: 5, y: 2, look: leaderLook, dir: 'down', script: 'leader', leader: leaderKey },
    ...trainers,
  ],
});

// dungeon floors (shared 12-wide plans)
const FLOOR_UP = [
  'xxxxXxxxxXxx',
  'iiiiiiiiiPAA',
  'iNiiiiiiiiAi',
  'iiiTTiiPiiii',
  'iiiiiiiiiiii',
  'iPiiiiiiiiNi',
  'iiiTTiiiiiii',
  'iiiiiiiiiiii',
  'iiiiimmiiiii',
];
const FLOOR_MID = [
  'xxxxXxxxxXxx',
  'AAiiiiiiiiAA',
  'AiiNiiiiPiiA',
  'iiiiTTiiiiii',
  'iPiiiiiiiiPi',
  'iiiiiTTiiiii',
  'iNiiiiiiiiNi',
  'iiiiiiiiiiii',
  'iiiiimmiiiii',
];
const FLOOR_TOP = [
  'xxxxXxxxxXxx',
  'iiiiiiiiiiii',
  'iPPiiiiiiPPi',
  'iiiiiiiiiiii',
  'iiiiAAAAiiii',
  'iiiiAAAAiiii',
  'iiiiiiiiiiii',
  'iiiiimmiiiii',
];

export const ACT2_INTERIOR = {
  // --- gyms
  gym_dur: gym('Refinería de ANCAP (Durazno)', 'gym_fuego', 'leader_fire', 'ancap', [
    tr({ x: 8, y: 6 }, 'gaucho', 'g4_a', 'Hernán', 'Herrero', ['fuego'], [32, 33], ['La fragua nunca se apaga.', 'Me quemé.', 'Candelaria Ríos es más dura que el hierro.'], { dir: 'left' }),
    tr({ x: 3, y: 9 }, 'girl', 'g4_b', 'Vero', 'Alfarera', ['fuego', 'tierra'], [33, 34], ['Mis piezas salen del horno hoy.', 'Se enfrió.', 'Candelaria Ríos usa tipo Fuego.'], { dir: 'right' }),
    npc(6, 10, 'oldman', ['Gimnasio de Durazno. La líder usa criaturas de tipo Fuego.', 'Las de Agua, Tierra y Roca le hacen frente.'], { dir: 'down' }),
  ]),
  gym_tac: gym('Ministerio de Ganadería (Tacuarembó)', 'gym_planta', 'leader_forest', 'mgap', [
    tr({ x: 8, y: 6 }, 'boy', 'g5_a', 'Mateo', 'Guardabosque', ['planta', 'bicho'], [37, 38], ['El monte me enseñó a combatir.', 'Perdí en mi bosque.', 'El ministro conoce cada árbol.'], { dir: 'left' }),
    tr({ x: 3, y: 9 }, 'girl', 'g5_b', 'Inés', 'Botánica', ['planta', 'veneno'], [38, 39], ['Estudio las plantas, y también sus defensas.', 'Interesante.', 'Cuidado con el veneno de Ramón.'], { dir: 'right' }),
    npc(6, 10, 'oldman', ['Gimnasio de Tacuarembó. El líder usa criaturas de tipo Planta.', 'Fuego, Volador y Bicho tienen ventaja.'], { dir: 'down' }),
  ]),
  gym_riv: gym('Cuartel de la frontera (Rivera)', 'gym_lucha', 'leader_dojo', 'defensa', [
    tr({ x: 8, y: 6 }, 'boy', 'g6_a', 'Thiago', 'Capoeirista', ['lucha'], [40, 41], ['Ginga y golpe, esa es la clave.', 'Caí.', 'La ministra de Defensa entrena todas las mañanas.'], { dir: 'left' }),
    tr({ x: 3, y: 9 }, 'girl', 'g6_b', 'Paula', 'Karateka', ['lucha', 'normal'], [41, 42], ['Un cinturón negro no se regala.', 'Respeto.', 'La ministra Cabrera es la mejor de la frontera.'], { dir: 'right' }),
    npc(6, 10, 'oldman', ['Gimnasio de Rivera. La líder usa criaturas de tipo Lucha.', 'Las de tipo Psíquico y Volador la complican.'], { dir: 'down' }),
  ]),
  gym_sal: gym('Casa de Quiroga (Salto)', 'gym_psiquico', 'leader_psy', 'quiroga', [
    tr({ x: 8, y: 6 }, 'oldman', 'g7_a', 'Gabriel', 'Astrólogo', ['psiquico'], [43, 44], ['Las estrellas dicen que vas a perder.', 'No lo vi venir.', 'Quiroga ve el futuro.'], { dir: 'left' }),
    tr({ x: 3, y: 9 }, 'girl', 'g7_b', 'Noelia', 'Vidente', ['psiquico', 'volador'], [44, 44], ['Sé qué vas a elegir antes que vos.', 'Me equivoqué.', 'Quiroga usa tipo Psíquico.'], { dir: 'right' }),
    npc(6, 10, 'oldman', ['Gimnasio de Salto. El líder usa criaturas de tipo Psíquico.', 'Las de tipo Siniestro y Bicho tienen ventaja.'], { dir: 'down' }),
  ]),
  gym_frb: gym('Museo del Anglo (Fray Bentos)', 'gym_siniestro', 'leader_dark', 'anglo', [
    tr({ x: 8, y: 6 }, 'boy', 'g8_a', 'Dante', 'Sereno', ['siniestro'], [46, 46], ['La noche es mi territorio.', 'Salí de la sombra.', 'Zoraida cierra el camino a la Liga.'], { dir: 'left' }),
    tr({ x: 3, y: 9 }, 'girl', 'g8_b', 'Alma', 'Sombra', ['siniestro', 'veneno'], [46, 47], ['No me vas a ver venir.', 'Me ganaste.', 'La Liga está en Montevideo, en el Centenario.'], { dir: 'right' }),
    npc(6, 10, 'oldman', ['Gimnasio de Fray Bentos. La líder usa criaturas de tipo Siniestro.', 'Las de Lucha, Bicho y Hada... digo, las de Lucha y Bicho le hacen frente.'], { dir: 'down' }),
  ]),

  // --- Policlínicas, almacenes y casas
  poli_dur: poli('Policlínica de Durazno'),
  poli_tac: poli('Policlínica de Tacuarembó'),
  poli_riv: poli('Policlínica de Rivera'),
  poli_sal: poli('Policlínica de Salto'),
  poli_pay: poli('Policlínica de Paysandú'),
  poli_frb: poli('Policlínica de Fray Bentos'),
  shop_tac: shop('Almacén de Tacuarembó', shopStock(['pan_casero', 'alfajor_triple', 'refuerzo_ataque', 'refuerzo_defensa', 'piedra_basalto'])),
  shop_riv: shop('Almacén de Rivera', shopStock(['pan_casero', 'alfajor_triple', 'refuerzo_especial', 'refuerzo_velocidad', 'piedra_amatista'])),
  shop_sal: shop('Almacén de Salto', shopStock(['pan_casero', 'alfajor_triple', 'refuerzo_especial', 'refuerzo_velocidad', 'torta_frita'])),
  shop_pay: shop('Almacén de Paysandú', shopStock(['pan_casero', 'alfajor_triple', 'torta_frita'])),
  shop_frb: shop('Almacén de Fray Bentos', shopStock(['pan_casero', 'alfajor_triple', 'refuerzo_ataque', 'refuerzo_defensa', 'refuerzo_especial', 'refuerzo_velocidad', 'torta_frita'])),
  casa_tac: house('Casa en Tacuarembó', casaNpc('gaucho', ['Acá se asa de todo. Menos prisa.', 'Dicen que la Patria Gaucha reúne a más de cien mil personas.'])),
  casa_tac2: house('Casa en Tacuarembó', { x: 6, y: 3, look: 'girl', dir: 'left', script: 'gift_tac' }),
  casa_riv: house('Casa en Rivera', casaNpc('boy', ['Mi tía vive del otro lado de la plaza. Ella es de Brasil, yo de Uruguay.', 'Para nosotros no hay frontera.'])),
  casa_riv2: house('Casa en Rivera', { x: 6, y: 3, look: 'oldman', dir: 'left', script: 'gift_riv' }),
  casa_sal: house('Casa en Salto', casaNpc('girl', ['Las naranjas de Salto son las mejores. Probá un gajo.', 'Los termas relajan hasta al más nervioso.'])),
  casa_sal2: house('Casa en Salto', { x: 6, y: 3, look: 'cop', dir: 'left', script: 'gift_sal' }),
  casa_pay: house('Casa en Paysandú', casaNpc('oldman', ['Paysandú resistió un sitio de varios meses.', 'Por eso le dicen la Heroica.'])),
  casa_pay2: house('Casa en Paysandú', { x: 6, y: 3, look: 'sailor', dir: 'left', script: 'gift_pay' }),
  casa_frb: house('Casa en Fray Bentos', casaNpc('clerk', ['Mi abuelo trabajó en el Anglo. Decía que el olor del frigorífico se sentía a kilómetros.'])),
  casa_frb2: house('Casa en Fray Bentos', { x: 6, y: 3, look: 'girl', dir: 'left', script: 'gift_frb' }),

  // --- Buquebus "China Zorrilla" (Montevideo): the ferry the player boards once, three decks, the captain at the top
  ferry_1: room(FLOOR_UP, {
    name: 'Buquebus China Zorrilla: salón', music: 'town',
    warps: [{ x: 11, y: 1, to: 'ferry_2', tx: 5, ty: 7 }],
    npcs: [
      tr({ x: 2, y: 4 }, 'sailor', 'fe_a', 'Marinero Gómez', 'Marinero', ['agua', 'volador'], [20, 21], ['Primer viaje del barco y ya tengo que defenderlo.', 'Zozobré.', 'El capitán está arriba, en su camarote.'], { dir: 'right', sight: 4 }),
      tr({ x: 8, y: 6 }, 'girl', 'fe_b', 'Gimena', 'Turista', ['normal', 'volador'], [20, 22], ['Viajo a Buenos Aires por el día. Pero un combate no le hace mal a nadie.', 'Qué mala suerte.', 'Subí por la escalera del fondo.'], { dir: 'left', sight: 4 }),
      { x: 9, y: 4, look: 'clerk', dir: 'left', script: 'ferry_bio' },
      npc(6, 2, 'oldman', ['El barco se llama como la actriz China Zorrilla, una de las grandes de nuestro teatro.', 'Dicen que le hubiera gustado verlo navegar.'], { dir: 'down' }),
    ],
  }),
  ferry_2: room(FLOOR_MID, {
    name: 'Buquebus China Zorrilla: comedor', music: 'town',
    exitTo: { map: 'ferry_1', x: 11, y: 2 },
    warps: [{ x: 0, y: 1, to: 'ferry_3', tx: 5, ty: 6 }, { x: 11, y: 1, to: 'ferry_3', tx: 5, ty: 6 }],
    triggers: [{ x: 0, y: 5, w: 12, h: 1, cond: (f) => !f.rival3, script: 'rival_ferry' }],
    npcs: [
      tr({ x: 3, y: 5 }, 'clerk', 'fe_c', 'Maitre Ibarra', 'Maitre', ['normal'], [21, 22], ['Para subir hay que reservar. Y para pasar, ganarme.', 'Retiro lo dicho.', 'El capitán no se siente bien: hace días que no sale.'], { dir: 'right', sight: 4 }),
      tr({ x: 8, y: 3 }, 'boy', 'fe_d', 'Rodrigo', 'Tripulante', ['agua', 'normal'], [22, 23], ['Limpio las cubiertas, pero hoy hago una excepción.', 'Perdí el turno.', 'En el camarote de arriba está el capitán.'], { dir: 'down', sight: 3 }),
      { x: 5, y: 2, look: 'rival', dir: 'down', id: 'rival_ferry', cond: (f) => !f.rival3, script: 'rival_ferry' },
      npc(9, 5, 'girl', ['El comedor tiene chivitos, milanesas y mate para todos.', 'Pero el chivito del barco no es como el de la rambla.'], { dir: 'left' }),
    ],
  }),
  ferry_3: room(FLOOR_TOP, {
    name: 'Buquebus China Zorrilla: camarote del capitán', music: 'town',
    exitTo: { map: 'ferry_2', x: 11, y: 2 },
    npcs: [{ x: 5, y: 2, look: 'oldman', dir: 'down', script: 'ferry_captain' }],
  }),

  // --- Torre de Niebla (Rivera): three floors, Bruma at the top
  torre_1: room(FLOOR_UP, {
    name: 'Torre de Niebla: planta baja', music: 'cave',
    warps: [{ x: 11, y: 1, to: 'torre_2', tx: 5, ty: 7 }],
    npcs: [
      grunt({ x: 2, y: 4 }, 'tw_g1', [40, 41], 'Esta torre es del Equipo PP.', 'Qué mala suerte.', 'Subí, pero cuidado con arriba.', { dir: 'right', sight: 4 }),
      grunt({ x: 8, y: 6 }, 'tw_g2', [41, 42], 'No podés subir.', 'Estoy acabado.', 'La niebla se genera arriba.', { dir: 'left', sight: 4 }),
      grunt({ x: 6, y: 2 }, 'tw_g3', [41, 42], 'Alto.', 'Pasá, pasá.', 'Bruma te espera.', { dir: 'down', sight: 3 }),
    ],
    items: [{ x: 1, y: 7, item: 'mate_dulce', id: 'tw_item1' }],
  }),
  torre_2: room(FLOOR_MID, {
    name: 'Torre de Niebla: transmisor', music: 'cave',
    exitTo: { map: 'torre_1', x: 11, y: 2 },
    warps: [{ x: 0, y: 1, to: 'torre_3', tx: 5, ty: 6 }, { x: 11, y: 1, to: 'torre_3', tx: 5, ty: 6 }],
    npcs: [
      grunt({ x: 3, y: 5 }, 'tw_g4', [42, 42], 'El transmisor no se toca.', 'No era tan difícil.', 'Es el corazón de la torre.', { dir: 'right', sight: 4 }),
      grunt({ x: 8, y: 3 }, 'tw_g5', [42, 42], 'Un metro más y te hago volar.', 'Me ganaste.', 'Seguí hasta Bruma.', { dir: 'down', sight: 3 }),
      tr({ x: 9, y: 5, dir: 'left' }, 'clerk', 'tw_t1', 'Dr. Salazar', 'Técnico PP', ['electrico', 'veneno'], [42, 43], ['Yo diseñé la red de niebla.', 'Mis cálculos fallaron.', 'Calima nos dio los planos.'], { sight: 4 }),
    ],
    items: [{ x: 9, y: 6, item: 'alfajor_triple', id: 'tw_item2' }],
  }),
  torre_3: room(FLOOR_TOP, {
    name: 'Torre de Niebla: cima', music: 'cave',
    exitTo: { map: 'torre_2', x: 11, y: 2 },
    npcs: [{ x: 5, y: 2, look: 'bruma', dir: 'down', id: 'bruma2', cond: (f) => !f.torre_clear, script: 'bruma2' }],
  }),

  // --- Represa de Salto Grande: two floors, Garúa at the end
  represa_1: room(FLOOR_UP, {
    name: 'Represa: sala de turbinas', music: 'cave',
    warps: [{ x: 11, y: 1, to: 'represa_2', tx: 5, ty: 6 }],
    npcs: [
      grunt({ x: 2, y: 4 }, 'rp_g1', [44, 45], 'La represa es nuestra.', 'No puede ser.', 'Garúa está más arriba.', { dir: 'right', sight: 4 }),
      grunt({ x: 8, y: 6 }, 'rp_g2', [45, 46], 'Volvé afuera.', 'Perdí.', 'Pasá nomás.', { dir: 'left', sight: 4 }),
      tr({ x: 6, y: 2, dir: 'down' }, 'clerk', 'rp_t1', 'Ing. Ferrari', 'Técnico PP', ['electrico', 'agua'], [45, 46], ['Las turbinas son mi trabajo.', 'Me corté la luz.', 'La energía mueve las torres de niebla.'], { sight: 3 }),
    ],
    items: [{ x: 1, y: 7, item: 'ultraesfera', id: 'rp_item1' }],
  }),
  represa_2: room(FLOOR_TOP, {
    name: 'Represa: sala de control', music: 'cave',
    exitTo: { map: 'represa_1', x: 11, y: 2 },
    npcs: [{ x: 5, y: 2, look: 'garua', dir: 'down', id: 'garua2', cond: (f) => !f.represa_clear, script: 'garua2' }],
  }),

  // --- Frigorífico Anglo (Fray Bentos): three floors, Brumario and then Calima
  anglo_1: room(FLOOR_UP, {
    name: 'Frigorífico Anglo: galpón', music: 'cave',
    warps: [{ x: 11, y: 1, to: 'anglo_2', tx: 5, ty: 7 }],
    npcs: [
      grunt({ x: 2, y: 4 }, 'an_g1', [48, 48], 'Este galpón es del Equipo PP.', 'No pasa nada.', 'Subí. Calima te espera.', { dir: 'right', sight: 4 }),
      grunt({ x: 8, y: 6 }, 'an_g2', [48, 49], 'No pasás.', 'Qué mala suerte.', 'La escalera está al fondo.', { dir: 'left', sight: 4 }),
      grunt({ x: 6, y: 2 }, 'an_g3', [48, 49], 'Alto.', 'Pasá.', 'Calima está arriba.', { dir: 'down', sight: 3 }),
    ],
    items: [{ x: 1, y: 7, item: 'pan_casero', id: 'an_item1' }],
  }),
  anglo_2: room(FLOOR_MID, {
    name: 'Frigorífico Anglo: oficinas', music: 'cave',
    exitTo: { map: 'anglo_1', x: 11, y: 2 },
    warps: [{ x: 0, y: 1, to: 'anglo_3', tx: 5, ty: 6 }, { x: 11, y: 1, to: 'anglo_3', tx: 5, ty: 6 }],
    npcs: [
      grunt({ x: 3, y: 5 }, 'an_g4', [49, 50], 'Las oficinas son privadas.', 'Me ganaste.', 'El jefe de verdad está arriba.', { dir: 'right', sight: 4 }),
      grunt({ x: 8, y: 3 }, 'an_g5', [49, 50], 'Un paso más y listo.', 'Pasá.', 'No lo vas a detener.', { dir: 'down', sight: 3 }),
      { x: 5, y: 4, look: 'brumario', dir: 'down', id: 'brumario2', cond: (f) => !f.anglo_brumario, script: 'brumario2' },
    ],
    items: [{ x: 9, y: 6, item: 'alfajor_triple', id: 'an_item2' }],
  }),
  anglo_3: room(FLOOR_TOP, {
    name: 'Frigorífico Anglo: dirección', music: 'cave',
    exitTo: { map: 'anglo_2', x: 11, y: 2 },
    npcs: [{ x: 5, y: 2, look: 'calima', dir: 'down', id: 'calima', cond: (f) => !f.anglo_clear, script: 'calima' }],
  }),

  // --- Liga: Alto Mando en cuatro salas, luego el Campeón
  liga_1: room([
    'ZZZZZzzZZZZZ',
    'ZYYYYYYYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZZZZZAAZZZZZ',
    'ZYYYYAAYYYYZ',
    'ZNYYYAAYYYNZ',
    'ZYYYYAAYYYYZ',
    'YYYYYmmYYYYY',
  ], {
    name: 'Estadio Centenario: vestuario', music: 'title',
    warps: [{ x: 5, y: 0, to: 'liga_2', tx: 5, ty: 7 }],
    npcs: [
      { x: 5, y: 3, look: 'nurse', dir: 'down', script: 'nurse' },
      { x: 9, y: 6, look: 'clerk', dir: 'left', script: 'shop', stock: ['ultraesfera', 'mate_dulce', 'dulce_de_leche', 'chivito', 'alfajor_triple', 'pan_casero', 'torta_frita'] },
      { x: 5, y: 1, look: 'elite1', dir: 'down', cond: (f) => !f.elite1, script: 'elite', elite: 1 },
      { x: 3, y: 5, look: 'cop', dir: 'right', text: ['La Liga de Uruguay: cuatro miembros del Alto Mando y el Campeón.', 'No podés volver atrás una vez que empezás.'] },
    ],
  }),
  liga_2: room([
    'ZZZZZzzZZZZZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZZZZZAAZZZZZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'YYYYYmmYYYYY',
  ], {
    name: 'Estadio Centenario: túnel olímpico', music: 'title',
    exitTo: { map: 'liga_1', x: 5, y: 1 },
    warps: [{ x: 5, y: 0, to: 'liga_3', tx: 5, ty: 7 }],
    npcs: [{ x: 5, y: 1, look: 'elite2', dir: 'down', cond: (f) => !f.elite2, script: 'elite', elite: 2 }],
  }),
  liga_3: room([
    'ZZZZZzzZZZZZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZZZZZAAZZZZZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'YYYYYmmYYYYY',
  ], {
    name: 'Estadio Centenario: palco', music: 'title',
    exitTo: { map: 'liga_2', x: 5, y: 1 },
    warps: [{ x: 5, y: 0, to: 'liga_4', tx: 5, ty: 7 }],
    npcs: [{ x: 5, y: 1, look: 'elite3', dir: 'down', cond: (f) => !f.elite3, script: 'elite', elite: 3 }],
  }),
  liga_4: room([
    'ZZZZZzzZZZZZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZZZZZAAZZZZZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'YYYYYmmYYYYY',
  ], {
    name: 'Estadio Centenario: la cancha', music: 'title',
    exitTo: { map: 'liga_3', x: 5, y: 1 },
    warps: [{ x: 5, y: 0, to: 'estadio', tx: 5, ty: 11 }],
    npcs: [{ x: 5, y: 1, look: 'elite4', dir: 'down', cond: (f) => !f.elite4, script: 'elite', elite: 4 }],
  }),
};
