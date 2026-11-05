// World definition: outdoor maps (ASCII tiles, legend in gfx/tiles.js) and
// generated interiors. Doors ('D') link to `doors` entries in row-major
// order; interior mats ('m') lead back to the door you entered from.
// Scripts receive the game `api` (see game/script-api.js).


import type { MapDef } from '../types.ts';
import { TR, room, HOUSE, POLI, SHOP, GYM, nurse, pc, poli, shop } from './map-kit.ts';

// ---------------------------------------------------------------- OUTDOORS
const BASE_OUTDOOR: Record<string, MapDef> = {
  carmelo: {
    name: 'Carmelo',
    music: 'town',
    bg: 'field',
    tiles: [
      '##########################',
      '#~~~~s...q.......q.....q.#',
      '#~~~~s..rrrrr...rrrrr....#',
      '#~~~~s..rrrrr...rrrrr....#',
      '#~~~~L..HwDwH...HwDwH....#',
      '#~~~~l....c.......c......#',
      '#~~~~s....ccccccccccccccc=',
      '#~~~~s....c....S.......c==',
      '#~~~~s..f.c.vvvvvvv....c.=',
      '#~~~~s....c.vvvvvvv....c.=',
      '#~~~~s....c.HwwDwwH..f.c.#',
      '#~~~~ss...c....c.......c.#',
      '#~~~~~s...cccccccccccccc.#',
      '#~~~~~s..f.....f...q.....#',
      '#~~~~~ss..f..f..f..f.....#',
      '#~~~~~~s..q..........q...#',
      '#~~~~~~ss.......S........#',
      '##########################',
    ],
    doors: ['casa_jugador', 'casa_rival', 'lab'],
    signs: [
      'CARMELO\nPueblo de bodegas y astilleros sobre el arroyo de las Vacas. Acá vive el Maestro Tabárez.',
      'RAMBLA DE CARMELO\nDesde la costa se ve la orilla argentina, al otro lado del río.',
    ],
    fish: [['pejerrey', 3, 6, 60], ['camalote', 3, 5, 30], ['aguaviva', 4, 6, 10]],
    exits: { e: { to: 'ruta1', req: 'has_starter', deny: ['¡Esperá, {player}!', 'Afuera del pueblo hay criaturas salvajes en los pastizales.', 'No podés irte sin hablar con el Maestro Tabárez. Pasá primero por su laboratorio.'] } },
    npcs: [
      { x: 20, y: 13, look: 'girl', wander: true, text: ['Los turistas vienen desde Buenos Aires en lancha, a ver los astilleros.', 'Dicen que en las noches de niebla el río se ve más ancho que el mar.'] },
      { x: 8, y: 11, look: 'oldman', text: ['Cuando yo era joven, había Ceibos en todas las orillas.', 'Ahora casi solo los cuida el Maestro Tabárez.'] },
      { x: 14, y: 12, look: 'boy', cond: (f) => !f.has_starter, text: ['¿Vas al laboratorio? Hoy entregan criaturas.'] },
      { x: 14, y: 12, look: 'boy', cond: (f) => f.has_starter, text: ['Buen compañero te tocó. Cuidalo.', 'Si se debilita, pasá por tu casa: tu madre siempre tiene el mate listo.'] },
    ],
  },

  ruta1: {
    name: 'Ruta 21',
    music: 'route',
    bg: 'field',
    tiles: [
      '##########################',
      '#....,,,,,....###....,,,,#',
      '#....,,,,,....###....,,,,#',
      '#..F.,,,,,..........R,,,,#',
      '#..F......====....=......#',
      '#..F...====..=....=..f...#',
      '=====..=.....=....=......#',
      '=....===.....=....======.=',
      '=..........,,=,,,.......==',
      '=.....S....,,=,,,.....,,.=',
      '#..........,,====....,,,.#',
      '#..R.......,,,,,=....,,,.#',
      '#.....###.......=........#',
      '#..,,,###..f....=====....#',
      '#..,,,....q.........=....#',
      '#..,,,,...........#####..#',
      '#..........R.............#',
      '##########################',
    ],
    signs: ['RUTA 1\n← Carmelo   Colonia del Sacramento →'],
    exits: { w: { to: 'carmelo' }, e: { to: 'colonia' } },
    enc: { rate: 0.12, list: [['teruterito', 2, 3, 28], ['hornerito', 2, 3, 22], ['nandulin', 3, 4, 14], ['hormiga', 2, 4, 14], ['ternero', 2, 4, 14], ['oruga', 2, 4, 14], ['tuco', 3, 4, 14], ['venadito', 4, 4, 4]] },
    fish: [['pejerrey', 3, 5, 70], ['camalote', 3, 5, 30]],
    npcs: [
      { x: 9, y: 5, look: 'boy', dir: 'down', sight: 4, trainer: TR('r1_a', 'Mateo', 'Aprendiz', [['oruga', 3], ['tuco', 3]], 80, 'Tenés una criatura. Veamos qué tal te va.', 'Me ganaste.', 'Voy a entrenar más en el pastizal.') },
      { x: 18, y: 9, look: 'girl', dir: 'left', sight: 4, trainer: TR('r1_b', 'Agustina', 'Estudiante', [['nandulin', 4]], 100, 'Mi Ñandú corre más rápido que el ómnibus.', 'Fuerte. Muy fuerte.', 'Montevideo está cerca. Allí hay un gimnasio de tipo Agua.', 'girl') },
      { x: 22, y: 13, look: 'gaucho', dir: 'up', text: ['Buen día.', 'Si tus criaturas están debilitadas, en Montevideo está la Policlínica. Las atienden gratis.'] },
      { x: 13, y: 15, look: 'oldman', script: 'gift_te_marcela' },
    ],
  },

  montevideo: {
    name: 'Montevideo',
    music: 'town',
    bg: 'city',
    theme: 'ciudad',
    tiles: [
      '____________________0:0_____________________',
      '__ZZZZZz__{{{{{{{{{_0:0___________WWWW_{{{{_',
      '__ZZZZZz__]]]]]]]]]_0:0__JJJJJJJ__WWWW_]]]]_',
      '__ZZZZZz__]]]]]]]]]_0:0__JJJdJJJ__WWWW_]]]]_',
      '__ZZDZZz__]]]]]]]]]_0:0__jjjjjjj__WDWW_]]]]_',
      '__________]]]]]]]]]_0:0__jjjDjjj_______]]]]_',
      '____________________///_____________________',
      '_"_______"__"____S_|0:0|_________"______"___',
      '000000000000000000/00000/0000000000000000000',
      '------------------/-000-/-------------------',
      '000000000000000000/00000/0000000000000000000',
      '_"____________"____|0:0|________"______"____',
      '___CCCCC_______{{{{_///__rrrrr_{{{{{{{{{{{{_',
      '___CCQCC_UUUUU_]]]]_0:0__rrrrr_]]]]]]]]]]]]_',
      '___IIDII_ttDtt_]]]]_0:0__HwDwH_]]]]]]]]]]]]_',
      '_______________]]]]_0:0________]]]]]]]]]]]]_',
      '___{{{{{{{{{{__]]]]_0:0________)))))))))))__',
      '___]]]]]]]]]]__]]]]_0:0________))))<>)))))__',
      '___]]]]]]]]]]_______0:0_"___"__(((((((((((__',
      '___]]]]]]]]]]_______0:0________(((((((((((__',
      '__"______"___"_____|0:0|_______(((((((((((__',
      '--------------------000-------0(((((((((((__',
      '0000000000000000000000000000000(((((((((((__',
      '????????|???????|?????????|?????????????????',
      '????????????S???????????????????????????????',
      '[[[[[[[[}}[[[[[[[[[[[[[[[[[[[[[[[[[[[[}}[[[[',
      '~~~~~~~~}}~~~~~~~~~~~~~~~~~~~~~~~~~~~~}}~~~~',
      '~~~~~~~~}}~~~~~~~~~~~~~~~~~~~~~~~~~~~~}}~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    // Row-major order of the door tiles: Estadio, Palacio Salvo, Palacio de la Luz (gimnasio), Policlínica, tienda, casa.
    doors: [
      { to: 'liga_1', req: (f) => f.badge12 && f.anglo_clear, deny: ['El Estadio Centenario está cerrado.', 'Solo entran quienes tengan las 12 medallas y hayan detenido al Dr. Díaz, el fundador del Equipo PP.'] },
      'palacio', 'gym_mvd', 'poli_mvd', 'shop_mvd', 'casa_mvd',
    ],
    fish: [['pejerrey', 8, 10, 55], ['aguaviva', 8, 10, 30], ['anguila', 9, 11, 15]],
    signs: [
      'MONTEVIDEO\nCapital de la República. Plaza Independencia ↑   Rambla ↓',
      'RAMBLA DE MONTEVIDEO\n22 km de costa para caminar con el mate bajo el brazo.',
    ],
    exits: {
      w: { to: 'rosario' },
    },
    npcs: [
      { x: 16, y: 24, look: 'girl', wander: true, text: ['En la Rambla, la gente toma mate y mira el río.', 'El Río de la Plata es marrón por los sedimentos, aunque parezca un mar.'] },
      { x: 26, y: 6, look: 'boy', text: ['El gimnasio de Montevideo es el Palacio de la Luz, la sede de UTE.', 'La presidenta, Sofía, usa criaturas de tipo Eléctrico. Las de Tierra no reciben su electricidad.'] },
      { x: 37, y: 23, look: 'sailor', dir: 'up', text: ['La terminal del Buquebus está cerrada por reformas.', 'Los barcos a Buenos Aires salen desde Colonia del Sacramento.'] },
      { x: 33, y: 5, look: 'oldman', text: ['El Palacio Salvo fue el edificio más alto de Sudamérica.', 'Adentro trabaja gente que sabe mucho de criaturas.'] },
    ],
  },

  interbalnearia: {
    name: 'Ruta Interbalnearia',
    music: 'route',
    bg: 'field',
    tiles: [
      '############################',
      '#..,,,,..###...,,,,,,..###.#',
      '#..,,,,..###...,,,,,,..###.#',
      '#..,,,,.......p..,,,,......#',
      '#...........==========.....#',
      '#..=========........=....,,#',
      '===...............S.=....,,#',
      '=....,,,,,..p.......=......=',
      '=....,,,,,...........=======',
      '=....,,,,,..R.....p.......==',
      '#.................,,,,,,...=',
      '#..p....,,,,......,,,,,,...#',
      '#.......,,,,......,,,,,,...#',
      '#sssssssssssssssssssssssssp#',
      '#sssssssssssssssssssssssssss',
      '#~~~~~~~~~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~~~~~~~~~~~~~~#',
      '############################',
    ],
    signs: ['RUTA INTERBALNEARIA\n← Montevideo   Punta del Este →\nAtlántida, Piriápolis y la costa de oro.'],
    exits: { w: { to: 'montevideo' }, e: { to: 'piriapolis' } },
    enc: { rate: 0.12, list: [['cardo', 11, 13, 6], ['comadreja', 10, 13, 22], ['pejerrey', 10, 12, 8], ['mulitin', 10, 13, 18], ['teruterito', 11, 13, 15], ['benteve', 11, 13, 15], ['yararita', 10, 12, 14], ['venadito', 11, 13, 10], ['mbigua', 12, 13, 6], ['gaviota', 11, 13, 12], ['cangrejo', 11, 13, 10], ['oveja', 10, 12, 12], ['chimango', 12, 13, 6], ['nimbo', 11, 13, 6], ['lechuza', 11, 13, 6], ['pibe', 11, 13, 6], ['coati', 11, 13, 6]] },
    fish: [['pejerrey', 11, 13, 50], ['aguaviva', 11, 13, 30], ['anguila', 12, 13, 20]],
    npcs: [
      { x: 8, y: 4, look: 'swimmer', dir: 'down', sight: 3, trainer: TR('ib_a', 'Santi', 'Surfista', [['mbigua', 13], ['lobito', 13]], 260, 'Las olas en La Paloma están muy buenas, pero primero un combate.', 'Me revolcaron.', 'Andá a Punta del Este: ahí está el segundo gimnasio.', 'swimmer') },
      { x: 16, y: 7, look: 'girl', dir: 'left', sight: 4, trainer: TR('ib_b', 'Valentina', 'Campista', [['butia', 12], ['benteve', 13]], 220, 'Acampé en Atlántida toda la semana.', 'Perdí.', 'Comprá Repelente si querés evitar a las criaturas de los pastizales.', 'girl') },
      { x: 24, y: 11, look: 'gaucho', dir: 'up', sight: 4, trainer: TR('ib_c', 'Don Rufino', 'Gaucho', [['mulitin', 13], ['nandulin', 13], ['zorrigris', 14]], 300, 'Nadie pasa sin enfrentarme primero.', 'Buen combate.', 'Contra la Mulita, nada mejor que el agua.', 'gaucho') },
      { x: 5, y: 13, look: 'boy', text: ['Esa niebla no es natural. Unos hombres de gris la generan con máquinas.', 'Se hacen llamar Equipo PP.'] },
    ],
    items: [{ x: 26, y: 1, item: 'mate', id: 'ib_item1' }],
  },

  punta: {
    name: 'Punta del Este',
    music: 'town',
    bg: 'beach',
    tiles: [
      '############################',
      '#..p...p...WWW..GGGGGGG.p..#',
      '#..........WWW..GGGaGGG....#',
      '#..CCCCC...WWW..hhhDhhh....#',
      '#..CCQCC....c......c.......#',
      '#..IIDII....cccccccc..gUUUUU',
      '#....c......c......c..gUUUUU',
      '======cccccccccccccccc.ttDtt',
      '=.........,,,c.......c...c.=',
      '=....p....,,,ccccccccccccc==',
      '=.........,,,......S.......=',
      '#ssssssssssssssssssssssssss#',
      '#ssssMsssssssssssssssssbbbs#',
      '#ssssssssssssssssssssss~~~s#',
      '#~~~~~~~~~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~~~~~~~~~~~~~~#',
      '############################',
    ],
    doors: ['gym_pde', 'poli_pde', 'shop_pde'],
    signs: ['PUNTA DEL ESTE\nPlaya Brava ↓ — Puerto ↘\n"Los Dedos" esperan en la arena.'],
    exits: { w: { to: 'piriapolis' }, e: { to: 'paloma' } },
    enc: { rate: 0.1, list: [['mbigua', 14, 16, 30], ['benteve', 14, 16, 25], ['lobito', 14, 16, 15], ['cotorrayo', 15, 16, 15], ['teruterazo', 16, 17, 5], ['flamenco', 15, 17, 6], ['tarantula', 15, 17, 8], ['gaviota', 15, 17, 8], ['hormiguero', 14, 16, 8]] },
    fish: [['aguaviva', 15, 17, 40], ['pejerrey', 15, 17, 30], ['franciscana', 16, 17, 15], ['anguila', 15, 17, 15]],
    npcs: [
      { x: 6, y: 12, look: 'girl', text: ['La Mano es una escultura de dedos que emergen de la arena.', 'Es un recordatorio para los bañistas: la playa Brava es peligrosa.'] },
      { x: 23, y: 12, look: 'sailor', dir: 'down', text: ['Desde el puerto se ve la Isla de Lobos.', 'A veces, en invierno, aparece una ballena cuyo canto se oye desde la costa.'] },
      { x: 14, y: 10, look: 'swimmer', wander: true, text: ['Con este calor, lo que más apetece es un chivito en la playa.'] },
      { x: 18, y: 9, look: 'grunt', dir: 'left', sight: 3, trainer: TR('pde_g1', 'Recluta PP', 'Equipo PP', [['yararita', 16], ['zorrigris', 16]], 320, 'Nadie tiene que saber lo del faro.', 'Igual ya es tarde.', 'La jefa Bruma está en Cabo Polonio. Hablé de más.', 'grunt') },
      { x: 25, y: 10, look: 'boy', text: ['El gimnasio de acá es la planta potabilizadora de OSE. Su presidenta, Lucía, usa tipo Agua.', 'Planta y Eléctrico le hacen daño.'] },
    ],
    items: [{ x: 1, y: 13, item: 'alfajor', id: 'pde_item1' }],
    legend: { x: 24, y: 12, species: 'ballenaplata', level: 55, flag: 'caught_ballenaplata', cond: (f) => f.champion, text: 'Un canto profundo sale del agua.' },
  },

  cabo: {
    name: 'Cabo Polonio',
    music: 'route',
    bg: 'beach',
    tiles: [
      '##########################',
      '#sss,,,,sssss,,,,,ssss~~~#',
      '#sss,,,,sssss,,,,,sssss~~#',
      '#ssssssssLssssssssssRRs~~#',
      '#ssssssssl.ssssssssRRRs~~#',
      '#sss,,,,s=sssss,,,ssss~~~#',
      '=sss,,,,s=sssss,,,ssss~~~#',
      '=sssssssss==========sss~~#',
      '=ssss,,,,,,,ssssss=ss~~~~#',
      '=ssss,,,,,,,ssssss=ssRR~~#',
      '#ssss,,,,,,,ssssss=sRRR~~#',
      '#sssssssssssssss,,,,s~~~~#',
      '#ssRRssssssssss,,,,ss~~~~#',
      '#~~~~~~~~~~~~~~~~~~~~~~~~#',
      '##########################',
    ],
    signs: [],
    exits: { w: { to: 'paloma' } },
    warps: [{ x: 9, y: 4, to: 'faro_cabo', tx: 4, ty: 6 }],
    enc: { rate: 0.12, list: [['lobito', 17, 20, 30], ['tortugal', 18, 20, 12], ['mbigua', 17, 19, 20], ['cotorrayo', 17, 19, 18], ['tatu', 17, 19, 20], ['pejerrey', 18, 20, 10], ['hormiguero', 18, 20, 6], ['chimango', 18, 20, 10]] },
    fish: [['franciscana', 18, 20, 30], ['aguaviva', 18, 20, 40], ['anguila', 18, 20, 30]],
    npcs: [
      { x: 2, y: 7, look: 'keeper', cond: (f) => !f.cabo_clear, text: ['El Equipo PP se llevó la lámpara del faro.', 'Sin luz, los barcos pueden chocar contra las rocas.'] },
      { x: 12, y: 7, look: 'grunt', dir: 'left', sight: 4, cond: (f) => !f.cabo_clear, trainer: TR('cp_g1', 'Recluta PP', 'Equipo PP', [['zorrigris', 19], ['yararita', 19]], 380, 'Alto. El faro es nuestro.', 'No es posible.', 'La jefa Bruma no será tan fácil.', 'grunt') },
      { x: 18, y: 9, look: 'grunt', dir: 'up', sight: 3, cond: (f) => !f.cabo_clear, trainer: TR('cp_g2', 'Recluta PP', 'Equipo PP', [['cuervon', 20], ['mulitin', 19]], 380, 'Más niebla, menos luz.', 'Me superaste.', 'No tengo más que decir.', 'grunt') },
      { x: 10, y: 4, look: 'bruma', dir: 'left', id: 'bruma', cond: (f) => !f.cabo_clear, script: 'bruma' },
      { x: 20, y: 6, look: 'boy', text: ['Acá no hay red eléctrica ni calles asfaltadas.', 'Los lobos marinos descansan al sol sobre las rocas.'] },
      { x: 3, y: 11, look: 'girl', wander: true, text: ['Las dunas se mueven con el viento. El pueblo entero cambia cada año.'] },
    ],
    items: [{ x: 21, y: 1, item: 'ultraesfera', id: 'cp_item1' }],
  },

  ruta8: {
    name: 'Ruta 8',
    music: 'route',
    bg: 'field',
    tiles: [
      '######.......#############',
      '#....#.......#.....,,,,..#',
      '#.,,,.=======.......,,,,.#',
      '#.,,,.=.............,,,,.#',
      '#.,,,.=....###..#####....#',
      '#.....=....###...........#',
      '#..R..========.......R...#',
      '#............=..,,,,,....#',
      '#..,,,,,.....=..,,,,,..#.#',
      '#..,,,,,..S..=..,,,,,..#.#',
      '#..,,,,,.....=...........#',
      '#~~~~~~~~bb~~=~~~~~~~~~~~#',
      '#~~~~~~~~bb~~b~~~~~~~~~~~#',
      '#.......=====...........##',
      '#..q....=.....,,,,,,,....#',
      '#.......=..R..,,,,,,,....#',
      '#.,,,,..=.....,,,,,,,....#',
      '#.,,,,..======...........#',
      '#.,,,,.......=...........#',
      '######.......=############',
    ],
    signs: ['RUTA 8 — Brigadier General Juan Antonio Lavalleja\n↑ Treinta y Tres / Quebrada de los Cuervos   ↓ Montevideo'],
    exits: { s: { to: 'montevideo' }, n: { to: 'minas' } },
    enc: { rate: 0.13, list: [['tala', 22, 24, 6], ['gatomontes', 22, 25, 15], ['venadito', 22, 24, 18], ['cotorrayo', 22, 24, 15], ['luciernito', 22, 24, 15], ['yararita', 23, 25, 15], ['yacarito', 22, 24, 12], ['zorrigris', 23, 25, 8], ['aguaraflama', 24, 24, 2], ['tamborilero', 23, 25, 8], ['boleador', 23, 25, 8], ['fanal', 23, 25, 8], ['tarantula', 23, 25, 8], ['viuda', 23, 25, 8], ['huron', 23, 25, 6], ['peon', 23, 25, 6], ['caudillo', 23, 25, 6]] },
    fish: [['anguila', 22, 25, 40], ['camalote', 22, 25, 40], ['pejerrey', 22, 24, 20]],
    npcs: [
      { x: 15, y: 15, look: 'gaucho', dir: 'left', sight: 4, trainer: TR('r8_a', 'Don Ceferino', 'Gaucho', [['nanduro', 25], ['venadito', 24]], 500, 'Por la Ruta 8 solo pasan los que tienen coraje.', 'Está bien, pasaste.', 'Que te vaya bien en el camino.', 'gaucho') },
      { x: 18, y: 7, look: 'girl', dir: 'down', sight: 3, trainer: TR('r8_b', 'Lucía B.', 'Naturalista', [['luciernito', 24], ['picaflorin', 25]], 480, 'Estudio a las criaturas luminosas de la zona.', 'Tenés mucha energía.', 'En la Quebrada viven Cuervos. Son de tipo Siniestro y Volador.', 'girl') },
      { x: 7, y: 3, look: 'grunt', dir: 'right', sight: 5, trainer: TR('r8_g', 'Recluta PP', 'Equipo PP', [['yarara', 27], ['cuervon', 26]], 540, 'El jefe Brumario está por capturar al Cardenal Azul.', 'No.', 'Ya es tarde. Con el Cardenal Azul capturado, la niebla no se va a ir.', 'grunt') },
      { x: 4, y: 14, look: 'oldman', text: ['Cuando sopla el pampero, el cielo queda despejado.', 'Dicen que lo trae una criatura enorme con alas de tormenta.'] },
    ],
    items: [{ x: 24, y: 1, item: 'mate_dulce', id: 'r8_item1' }],
  },

  quebrada: {
    name: 'Quebrada de los Cuervos',
    music: 'route',
    bg: 'canyon',
    tiles: [
      'KKKKKKKKKKKKKKKKKKKKKKKKKKKK',
      'KKK....kkkk......kkkk....KKK',
      'KK...,,,......R......,,,..KK',
      'KK...,,,...........,,,,,..KK',
      'KKK....kkk...##..kkk.....KKK',
      'KKKK......=========.....KKKK',
      'KKKKK..q..=..~~~..=..#..KKKK',
      'KKKK......=..~~~..=.....KKKK',
      'KK...,,,,,=..~b~..=,,,,,..KK',
      'KK...,,,,,....b...=,,,,,..KK',
      'KK...........~b~..=.......KK',
      'K..rrrrr.....~~~..=..CCCCC.K',
      'K..rrrrr.VVVVVVV..=..CCQCC.K',
      'K..HwDwH.VVVeVVV..=..IIDII.K',
      'K....c...yyyDyyy..=....c...K',
      'K....cccccccc=c========c...K',
      'K...........S=.....UUUUU...K',
      'K.....#......=.....ttDtt...K',
      'K............=.............K',
      'KKKKKKKKKKKKK===KKKKKKKKKKKK',
    ],
    doors: ['casa_tyt', 'poli_tyt', 'gym_tyt', 'shop_tyt'],
    signs: ['TREINTA Y TRES — QUEBRADA DE LOS CUERVOS\nPrimer Área Protegida del Uruguay. Cuidá la naturaleza.'],
    exits: { s: { to: 'minas' } },
    enc: { rate: 0.13, list: [['cuervon', 26, 29, 25], ['mulitin', 26, 28, 15], ['picaflorin', 27, 29, 12], ['oruga', 27, 29, 15], ['butia', 26, 28, 13], ['gatomontes', 27, 29, 12], ['mulitron', 29, 30, 8], ['curupi', 27, 29, 6], ['sapo', 27, 29, 6], ['ciempies', 27, 29, 6]] },
    fish: [['camalote', 26, 29, 50], ['anguila', 26, 29, 40], ['pejerrey', 26, 28, 10]],
    npcs: [
      { x: 12, y: 2, look: 'brumario', dir: 'down', id: 'brumario', cond: (f) => f[badgeOf('quebrada')] && !f.quebrada_clear, script: 'brumario' },
      { x: 12, y: 2, look: 'grunt', dir: 'down', cond: (f) => !f[badgeOf('quebrada')], text: ['El jefe está ocupado. Volvé cuando seas un rival de verdad.'] },
      { x: 10, y: 3, look: 'grunt', dir: 'right', sight: 3, cond: (f) => !f.quebrada_clear, trainer: TR('qb_g1', 'Recluta PP', 'Equipo PP', [['zorromonte', 30], ['yararita', 29]], 600, 'El Cardenal Azul va a ser nuestro.', 'No.', 'El jefe Brumario es imparable.', 'grunt') },
      { x: 15, y: 3, look: 'grunt', dir: 'left', sight: 3, cond: (f) => !f.quebrada_clear, trainer: TR('qb_g2', 'Recluta PP', 'Equipo PP', [['cuervon', 30], ['mulitron', 30]], 600, 'Más niebla para todos.', 'Me superaste.', 'No tengo más que decir.', 'grunt') },
      { x: 7, y: 9, look: 'gaucho', dir: 'right', sight: 4, trainer: TR('qb_a', 'Doña Ofelia', 'Paisana', [['gatomontes', 28], ['venadalto', 29]], 560, 'En la Quebrada se combate con respeto.', 'Bien jugado.', 'Don Aparicio es duro como la piedra de la quebrada.', 'gaucho') },
      { x: 22, y: 9, look: 'boy', text: ['En el fondo de la quebrada hay un arroyo.', 'Los cuervos de cabeza roja vuelan en círculos por arriba.'] },
      { x: 4, y: 18, look: 'girl', wander: true, text: ['Treinta y Tres se llama así por los 33 Orientales.', 'Acá la historia está en cada rincón.'] },
    ],
    items: [{ x: 3, y: 2, item: 'ultraesfera', id: 'qb_item1' }],
    legend: { x: 13, y: 1, species: 'pamperon', level: 50, flag: 'caught_pamperon', cond: (f) => f.champion, text: 'Un viento helado baja desde el cielo.' },
  },
  // ------------------------------------------------------------ localidades (sin gimnasio)
  rosario: {
    name: 'Rosario',
    music: 'town',
    bg: 'field',
    locality: true,
    tiles: [
      '##########################',
      '#..f.,,,,,,....f.......q.#',
      '#..UUUUU...,,,,..uuuuu...#',
      '#..UUUUU...,,,,..uuuuu...#',
      '#..ttDtt.........HwDwH...#',
      '#....c.............c.....#',
      '#....c....S........c.....#',
      'cccccccccccccccccccccccccc',
      '#...............f........#',
      '#..,,,,,,.....~~~~.......#',
      '#..,,,,,,.....~~~~..,,,,.#',
      '#..,,,,,,.....~~~~..,,,,.#',
      '#.q...............f......#',
      '#........F..F.......q....#',
      '##########################',
    ],
    doors: ['shop_ros', 'casa_ros'],
    signs: ['ROSARIO\nLocalidad del departamento de Colonia. Pueblo de paso en el camino al centro del país.'],
    exits: { w: { to: 'ruta1' }, e: { to: 'montevideo' } },
    enc: { rate: 0.1, list: [['tuco', 6, 8, 16], ['gaviota', 6, 8, 16], ['tatu', 7, 9, 14], ['chimango', 7, 9, 14], ['hormiga', 6, 8, 14], ['yacarito', 7, 9, 12], ['lobito', 7, 9, 10], ['cascarudo', 7, 9, 10]] },
    fish: [['pejerrey', 6, 9, 60], ['camalote', 6, 8, 30], ['aguaviva', 7, 9, 10]],
    npcs: [
      { x: 8, y: 8, look: 'boy', dir: 'right', sight: 4, trainer: TR('ros_a', 'Beto', 'Pescador', [['pejerrey', 7], ['sapo', 7]], 160, 'Hoy no pican. Mejor combatamos.', 'Me ganaste.', 'Con una caña de pescar vas a poder sacar criaturas del agua.', 'boy') },
      { x: 22, y: 6, look: 'girl', dir: 'down', sight: 3, trainer: TR('ros_b', 'Clara', 'Veterinaria', [['oveja', 8], ['ternero', 8]], 170, 'Cuido a los animales de la zona. Veamos cómo cuidás a los tuyos.', 'Se nota que los tratás bien.', 'En una casa del puerto de Colonia regalan un mapa de todo el país.', 'girl') },
      { x: 12, y: 8, look: 'oldman', text: ['Rosario es un pueblo de paso, pero bien tranquilo.', 'Si te cansás, comprá mate en el almacén.'] },
      { x: 4, y: 6, look: 'gaucho', wander: true, text: ['Acá se cría ganado de todos los tipos. Cada criatura tiene su lugar en el campo.'] },
    ],
    items: [{ x: 22, y: 1, item: 'mate', id: 'ros_item1' }],
    legend: { x: 22, y: 12, species: 'ombu', level: 60, flag: 'caught_ombu', cond: (f) => f.champion && f.caught_yaguarete, text: 'Un ombú solitario se alza en el campo. Su sombra parece moverse sin viento.' },
  },

  piriapolis: {
    name: 'Piriápolis',
    music: 'town',
    bg: 'beach',
    locality: true,
    tiles: [
      '############################',
      '#uuuuu..,,,,,.....uuuuu....#',
      '#uuuuu..,,,,,.....uuuuu.f..#',
      '#HwDwH...,,,,.....HwDwH...%#',
      '#........f..........c....%.#',
      '#..UUUUU............c..S..%#',
      '#..UUUUU............c......#',
      '#..ttDtt............c......#',
      '============================',
      '#.....................,,,..#',
      '#ssssssssssssssssssssssssss#',
      '#ssssssssssssssssssssssssss#',
      '#~~~~~~~~~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~sss~~~~~~~~~~~~#',
      '############################',
    ],
    doors: [{ to: 'obs_1', req: 'quebrada_clear', deny: ['El viejo Observatorio del Cerro tiene la puerta clausurada con candados.', 'Un cartel dice: "Cerrado por seguridad. Proyecto Pampero".'] }, 'casa_pir', 'shop_pir'],
    signs: ['PIRIÁPOLIS\nBalneario fundado a principios del siglo XX. Al fondo se ve el Cerro San Antonio.'],
    exits: { w: { to: 'interbalnearia' }, e: { to: 'punta' } },
    enc: { rate: 0.1, list: [['pejerrey', 12, 14, 14], ['gaviota', 12, 14, 12], ['avispa', 12, 14, 14], ['chimango', 13, 15, 10], ['murcielago', 12, 14, 12], ['tatu', 12, 14, 12], ['carpintero', 13, 15, 12], ['tuco', 13, 15, 10]] },
    fish: [['pejerrey', 12, 15, 50], ['aguaviva', 12, 15, 30], ['anguila', 13, 15, 20]],
    npcs: [
      { x: 14, y: 9, look: 'swimmer', dir: 'down', sight: 3, trainer: TR('pir_a', 'Mauro', 'Guardavidas', [['gaviota', 13], ['aguaviva', 13]], 260, 'Estoy de guardia, pero un combate no le hace mal a nadie.', 'Buen combate.', 'Cuidado con las aguavivas: dejan ronchas.', 'swimmer') },
      { x: 10, y: 6, look: 'girl', dir: 'right', sight: 4, trainer: TR('pir_b', 'Elena', 'Turista', [['flamenco', 14]], 280, 'Vine a ver el atardecer y encontré un rival.', 'Qué lástima.', 'Dicen que en La Paloma las olas son excelentes.', 'girl') },
      { x: 24, y: 4, look: 'oldman', wander: true, text: ['Desde la cima del cerro se ve toda la costa.', 'El mar acá es más calmo que en Punta del Este.'] },
      { x: 6, y: 9, look: 'boy', text: ['Mi abuelo dice que en el mar de Piriápolis se ven toninas en verano.'] },
    ],
    items: [{ x: 15, y: 2, item: 'superesfera', id: 'pir_item1' }],
  },

  paloma: {
    name: 'La Paloma',
    music: 'town',
    bg: 'beach',
    locality: true,
    tiles: [
      '############################',
      '#sss,,,,sssssssssss,,,,ssss#',
      '#ssssssssssssLsssssssssssss#',
      '#sssssssssssslsssssssssssss#',
      '#..UUUUU...........vvvvv...#',
      '#..UUUUU...........vvvvv...#',
      '#..ttDtt...........HwDwH...#',
      '#....c...............c.....#',
      '============================',
      '#........S.................#',
      '#ss,,,,,,sssssssssssss,,,,s#',
      '#ssssssssssssssssssssssssss#',
      '#~~~~~~~~~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~~~~~~sss~~~~~#',
      '############################',
    ],
    doors: ['shop_pal', 'casa_pal'],
    signs: ['LA PALOMA\nBalneario del departamento de Rocha. Faro de 1874 sobre la Punta del Diablo, más al este.'],
    exits: { w: { to: 'punta' }, e: { to: 'cabo' } },
    enc: { rate: 0.1, list: [['tatu', 16, 18, 14], ['pejerrey', 16, 18, 12], ['garza', 16, 18, 14], ['chimango', 17, 19, 10], ['hormiguero', 17, 19, 10], ['tuco', 16, 18, 12], ['gaviota', 16, 18, 14], ['cangrejo', 16, 18, 14]] },
    fish: [['pejerrey', 16, 19, 40], ['aguaviva', 16, 19, 30], ['franciscana', 17, 19, 15], ['anguila', 17, 19, 15]],
    npcs: [
      { x: 12, y: 9, look: 'swimmer', dir: 'down', sight: 3, trainer: TR('pal_a', 'Gonzalo', 'Surfista', [['gaviota', 17], ['cangrejo', 17]], 340, 'Las olas están perfectas. Después de este combate, voy al agua.', 'Me revolcaste.', 'La corriente de Rocha es fuerte. Cuidado al meterse.', 'swimmer') },
      { x: 22, y: 9, look: 'girl', dir: 'left', sight: 4, trainer: TR('pal_b', 'Lorena', 'Pescadora', [['garza', 18], ['pejerrey', 17]], 360, 'Si pescás tan bien como peleás, te va a ir de maravilla.', 'Pescás mejor que yo.', 'Las toninas se acercan cuando hay cardumen.', 'girl') },
      { x: 14, y: 7, look: 'oldman', text: ['El faro de La Paloma guía a los barcos desde hace casi siglo y medio.'] },
      { x: 26, y: 8, look: 'gaucho', dir: 'left', text: ['Más al este, en Cabo Polonio, no hay luz eléctrica.', 'Se vive con velas y con lo que da el mar.'] },
    ],
    items: [{ x: 25, y: 1, item: 'mate_dulce', id: 'pal_item1' }],
  },

  minas: {
    name: 'Minas',
    music: 'town',
    bg: 'canyon',
    locality: true,
    tiles: [
      '###########...############',
      '#KKKKK......=.......KKKKK#',
      '#KKKKK......=.......KKKKK#',
      '#KKKKK,,,,..=...q.....KKK#',
      '#KKK..,,,,..=............#',
      '......,,,,..=..,,,,,.....#',
      '#...........=..,,,,,.....#',
      '#...f.......=..,,,,,..f..#',
      '#..........S=............#',
      '#........====.....F......#',
      '#..UUUUU.=............q..#',
      '#..UUUUU.=.....oooooWWWWW#',
      '#..ttDtt.=.....oooooWWWWW#',
      '#....c...=.....HwDwHHwDwH#',
      '#....c...=.......c...%.%.#',
      '#....cccccccccccccc..%%%.#',
      '#..f.....=..........q....#',
      '######.......#############',
    ],
    doors: ['shop_min', 'casa_min', { to: 'pp_1', req: (f) => f.quebrada_clear && f[badgeOf('punta')], deny: 'La puerta de la fábrica está sellada con candados. Hay mucha niebla en las sierras, y alguien adentro. Primero hay que despejar la niebla del este.' }],
    signs: ['MINAS\nCapital del departamento de Lavalleja. Entre sierras, cerros y el agua más pura del país.'],
    exits: { s: { to: 'ruta8' }, n: { to: 'quebrada' }, w: { to: 'durazno', req: 'badge3', deny: 'Un camino de ceniza baja hacia el oeste. El aire quema: todavía no estás listo para ese calor.' } },
    enc: { rate: 0.1, list: [['tatadios', 24, 26, 14], ['pararrayo', 25, 27, 10], ['cuchilla', 25, 27, 10], ['cerro', 25, 27, 10], ['pombero', 25, 27, 8], ['lobomarino', 26, 27, 6], ['gatomontes', 24, 26, 14], ['cotorrayo', 24, 26, 14], ['criollo', 25, 27, 6], ['candil', 25, 27, 6], ['tapir', 25, 27, 6], ['fosil', 25, 27, 6]] },
    npcs: [
      { x: 7, y: 9, look: 'boy', dir: 'right', sight: 4, trainer: TR('min_a', 'Ramiro', 'Serrano', [['tatadios', 25], ['cerro', 26]], 520, 'Crecí entre estas sierras. Las conozco mejor que nadie.', 'Se nota que estás hecho para el camino.', 'Más adelante está la Quebrada de los Cuervos. El aire es distinto.', 'boy') },
      { x: 18, y: 6, look: 'girl', dir: 'left', sight: 3, trainer: TR('min_b', 'Marina', 'Guía de sierra', [['cuchilla', 26], ['pararrayo', 26]], 540, 'Si querés subir al cerro, antes demostrame que podés.', 'Podés subir.', 'La Virgen del Verdún se ve desde muchos puntos de la ciudad.', 'girl') },
      { x: 14, y: 16, look: 'oldman', text: ['Minas es famosa por el agua de manantial y los cerros.', 'Dicen que en las noches de luna llena aparece un felino enorme en las sierras.'] },
      { x: 18, y: 14, look: 'oldman', cond: (f) => !f.pp_clear, text: ['En la vieja fábrica del este se mueve gente de gris, y de noche se oyen máquinas.', 'Un zarzal tapa la entrada. Con un machete se podría pasar.'] },
      { x: 21, y: 10, look: 'gaucho', wander: true, text: ['Mi abuelo contaba que el yaguareté vivió por acá, antes de que se lo creyera extinto.'] },
    ],
    items: [{ x: 23, y: 5, item: 'alfajor', id: 'min_item1' }],
    legend: { x: 21, y: 4, species: 'yaguarete', level: 65, flag: 'caught_yaguarete', cond: (f) => f.champion && f.caught_pamperon && f.caught_ballenaplata && f.caught_soldemayo, text: 'Entre los cerros, unos ojos dorados te observan. Una presencia enorme llena el aire.' },
  },
};

// ---------------------------------------------------------------- INTERIORS
const BASE_INTERIOR: Record<string, MapDef> = {
  casa_jugador: room(HOUSE, {
    name: 'Tu casa',
    heal: true,
    npcs: [{ x: 4, y: 2, look: 'mom', dir: 'down', script: 'mom' }],
  }),
  casa_rival: room(HOUSE, {
    name: 'Casa de {rival}',
    npcs: [
      { x: 6, y: 4, look: 'girl', dir: 'left', script: 'rival_sister' },
      { x: 1, y: 2, look: 'rival', dir: 'down', cond: (f) => f.champion, text: ['Campeón. Volví a casa a entrenar.', 'La próxima vez en el Centenario te gano yo.'] },
    ],
  }),
  lab: room([
    'xBBBxxXxxBBB',
    'iiiiiiiiiiii',
    'iiiiiiiiiiPi',
    'iiiiTTTiiiii',
    'iiiiiiiiiiii',
    'BBiiiiiiiiBB',
    'iiiiiiiiiiii',
    'NiiiiiiiiiiN',
    'iiiiimmiiiii',
  ], {
    name: 'Laboratorio Tabárez',
    npcs: [
      { x: 5, y: 2, look: 'prof', dir: 'down', id: 'prof', script: 'prof' },
      { x: 4, y: 3, look: 'ball', species: 'ceibito', cond: (f) => !f.has_starter, script: 'starter' },
      { x: 5, y: 3, look: 'ball', species: 'tejuchispa', cond: (f) => !f.has_starter, script: 'starter' },
      { x: 6, y: 3, look: 'ball', species: 'carpinchito', cond: (f) => !f.has_starter, script: 'starter' },
      { x: 9, y: 6, look: 'clerk', dir: 'left', text: ['Soy ayudante del Maestro Tabárez.', 'Estudiamos cómo las criaturas se adaptan al clima del Río de la Plata.'] },
      { x: 7, y: 1, look: 'rival', dir: 'down', id: 'rival_lab', cond: (f) => !f.rival1 },
    ],
  }),
  casa_mvd: room(HOUSE, {
    name: 'Casa en Montevideo',
    npcs: [
      { x: 6, y: 3, look: 'oldman', dir: 'left', text: ['El candombe nació en los barrios Sur y Palermo.', 'Cuando suenan los tambores, hasta las criaturas siguen el ritmo.', 'Existe un movimiento llamado Danza Candombe que sube Ataque y Velocidad.'] },
      { x: 2, y: 5, look: 'girl', script: 'gift_garrapinada' },
    ],
  }),
  casa_tyt: room(HOUSE, {
    name: 'Casa en Treinta y Tres',
    npcs: [{ x: 6, y: 3, look: 'gaucho', dir: 'left', text: ['Los Treinta y Tres Orientales cruzaron el río en 1825.', 'Coraje como ese se llama "garra charrúa".'] }],
  }),
  palacio: room([
    'xxXxxxxxXxxx',
    'BBBiiiiiiBBB',
    'iiiiiiiiiiii',
    'iiTTiiiiTTii',
    'iiiiiiiiiiii',
    'NiiiiAAiiiiN',
    'iiiiiAAiiiii',
    'iiiiimmiiiii',
  ], {
    name: 'Palacio Salvo',
    npcs: [
      { x: 6, y: 2, look: 'clerk', dir: 'down', text: ['Bienvenido al Palacio Salvo.', 'Si tenés el Mapa de Uruguay, mirá cuántos lugares ya visitaste.'] },
      { x: 2, y: 2, look: 'prof', dir: 'down', text: ['En este palacio guardamos registros de todas las criaturas del país.', 'Algunas evolucionan al subir de nivel. Entrenalas con paciencia.'] },
      { x: 9, y: 2, look: 'boy', dir: 'down', text: ['Dato útil: si una criatura está dormida o paralizada, es más fácil capturarla.'] },
      { x: 6, y: 4, look: 'girl', dir: 'down', text: ['El tipo Lucha es fuerte contra Normal, Roca y Siniestro.', 'Pero sufre contra Volador y Psíquico.'] },
    ],
  }),
  faro_cabo: room([
    'xxxXXxxx',
    'iiiiiiii',
    'iiTTiiNi',
    'iiiiiiii',
    'Niiiiiii',
    'iiiiiiii',
    'iiiimmii',
  ], {
    name: 'Faro de Cabo Polonio',
    exitTo: { map: 'cabo', x: 9, y: 5 },
    npcs: [{ x: 5, y: 1, look: 'keeper', dir: 'down', script: 'keeper' }],
  }),
  pp_1: room([
    'xxxxXxxxxXxx',
    'iiiiiiiiiPAA',
    'iNiiiiiiiiAi',
    'iiiTTiiPiiii',
    'iiiiiiiiiiii',
    'iPiiiiiiiiNi',
    'iiiTTiiiiiii',
    'iiiiiiiiiiii',
    'iiiiimmiiiii',
  ], {
    name: 'Fábrica abandonada',
    music: 'cave',
    warps: [{ x: 11, y: 1, to: 'pp_2', tx: 5, ty: 6 }],
    npcs: [
      { x: 2, y: 4, look: 'grunt', dir: 'right', sight: 4, trainer: TR('pp_g1', 'Recluta PP', 'Equipo PP', [['yarara', 31], ['cuervon', 31]], 520, 'Esta fábrica es propiedad privada.', 'Qué mala suerte.', 'Garúa está arriba. No la subestimes.', 'grunt') },
      { x: 8, y: 6, look: 'grunt', dir: 'left', sight: 4, trainer: TR('pp_g2', 'Recluta PP', 'Equipo PP', [['zorromonte', 32], ['pombero', 32]], 540, 'Las máquinas no se tocan.', 'Las apagaste todas…', 'Subí por la escalera del fondo.', 'grunt') },
      { x: 6, y: 2, look: 'grunt', dir: 'down', sight: 3, trainer: TR('pp_g3', 'Recluta PP', 'Equipo PP', [['lobomarino', 33], ['yarara', 33]], 560, 'Alto. Nadie pasa de este piso.', 'Está bien, pasá.', 'Soy de los que quedaron después de Brumario.', 'grunt') },
      { x: 10, y: 4, look: 'grunt', dir: 'left', sight: 3, trainer: TR('pp_g4', 'Recluta PP', 'Equipo PP', [['caudillo', 34], ['cuervon', 34]], 600, 'Me dieron la orden de vigilar la escalera.', 'Subí, nomás.', 'Garúa cree que puede controlar el clima del país.', 'grunt') },
    ],
  }),
  pp_2: room([
    'xxxxXxxxxXxx',
    'iiiiiiiiiiii',
    'iPPiiiiiiPPi',
    'iiiiiiiiiiii',
    'iiiiAAAAiiii',
    'iiiiAAAAiiii',
    'iiiiiiiiiiii',
    'iiiiimmiiiii',
  ], {
    name: 'Fábrica: sala de máquinas',
    music: 'cave',
    exitTo: { map: 'pp_1', x: 11, y: 2 },
    npcs: [{ x: 5, y: 3, look: 'garua', dir: 'down', cond: (f) => !f.pp_clear, script: 'garua' }],
  }),
  shop_min: shop('Almacén de Minas', ['superesfera', 'ultraesfera', 'mate_dulce', 'dulce_de_leche', 'alfajor', 'torta_frita', 'chivito', 'refuerzo_ataque', 'refuerzo_defensa', 'refuerzo_especial', 'refuerzo_velocidad', 'piedra_agata', 'piedra_amatista', 'piedra_basalto', 'mt_parrillada', 'mt_tormenta_ceibo', 'mt_punio_gaucho']),
  casa_ros: room(HOUSE, {
    name: 'Casa en Rosario',
    npcs: [{ x: 6, y: 3, look: 'oldman', dir: 'left', script: 'gift_ros' }],
  }),
  casa_pir: room(HOUSE, {
    name: 'Casa en Piriápolis',
    npcs: [{ x: 6, y: 3, look: 'girl', dir: 'left', script: 'gift_pir' }],
  }),
  casa_pal: room(HOUSE, {
    name: 'Guardería de La Paloma',
    npcs: [{ x: 6, y: 3, look: 'swimmer', dir: 'left', script: 'gift_pal' }, { x: 2, y: 2, look: 'oldman', dir: 'down', script: 'guarderia' }],
  }),
  shop_dur: shop('Almacén de Durazno', ['superesfera', 'ultraesfera', 'mate_dulce', 'dulce_de_leche', 'alfajor', 'aloe', 'refuerzo_ataque', 'refuerzo_especial', 'piedra_agata', 'mt_parrillada']),
  casa_dur: room(HOUSE, {
    name: 'Casa en Durazno',
    npcs: [{ x: 6, y: 3, look: 'oldman', dir: 'left', script: 'gift_dur' }],
  }),
  casa_min: room(HOUSE, {
    name: 'Casa en Minas',
    npcs: [{ x: 6, y: 3, look: 'gaucho', dir: 'left', script: 'gift_min' }, { x: 3, y: 5, look: 'oldman', dir: 'right', script: 'gift_cana2' }],
  }),
  poli_mvd: poli('Policlínica de Montevideo'),
  poli_pde: poli('Policlínica de Punta del Este'),
  casino_pde: room(['xxXxxxxXxx', 'BBiiiiiiBB', 'iiiiiiiiii', 'nnniiiinnn', 'iiiiiiiiii', 'iPiPiiPiPi', 'iiiiiiiiii', 'iiiimmiiii'], {
    name: 'Casino Peninsula',
    npcs: [
      { x: 1, y: 2, look: 'clerk', dir: 'down', script: 'casino_cashier' },
      { x: 8, y: 2, look: 'clerk', dir: 'down', script: 'casino_prizes' },
      ...[1, 3, 6, 8].map((x) => ({ x, y: 5, look: null, script: 'casino_slots' })),
      { x: 4, y: 4, look: 'oldman', wander: true, text: ['Siete años sin ganar un Siete. Hoy es mi día.'] },
    ],
  }),
  poli_tyt: poli('Policlínica de Treinta y Tres'),
  shop_mvd: shop('Almacén de Montevideo', ['esfera', 'te_marcela', 'mate', 'ruda', 'linimento', 'aloe', 'despertador', 'repelente']),
  shop_pde: shop('Almacén de Punta del Este', ['esfera', 'superesfera', 'te_marcela', 'mate', 'mate_dulce', 'ruda', 'linimento', 'aloe', 'despertador', 'alfajor', 'repelente', 'refuerzo_ataque', 'refuerzo_defensa']),
  shop_tyt: shop('Almacén de Treinta y Tres', ['superesfera', 'ultraesfera', 'mate', 'mate_dulce', 'dulce_de_leche', 'chivito', 'alfajor', 'torta_frita', 'ruda', 'linimento', 'aloe', 'despertador', 'repelente', 'refuerzo_ataque', 'refuerzo_defensa', 'refuerzo_especial', 'refuerzo_velocidad', 'piedra_agata', 'piedra_amatista', 'piedra_basalto', 'mt_terremoto', 'mt_zumbido']),
  gym_mvd: room(GYM, {
    name: 'Palacio de la Luz (UTE)',
    theme: 'gym_elec',
    npcs: [
      { x: 5, y: 2, look: 'leader_ute', dir: 'down', script: 'leader', leader: 'ute' },
      { x: 8, y: 6, look: 'boy', dir: 'left', sight: 4, trainer: TR('g1_a', 'Nico', 'Electricista', [['luciernito', 8], ['nimbo', 8]], 200, 'Trabajo en la usina de UTE.', 'Se cortó la luz.', 'La presidenta Sofía usa tipo Eléctrico. ¿Tenés algo de tipo Tierra?', 'boy') },
      { x: 3, y: 9, look: 'girl', dir: 'right', sight: 4, trainer: TR('g1_b', 'Flor', 'Técnica de UTE', [['cotorrayo', 9]], 220, 'Mido cada kilovatio de la ciudad.', 'Corto circuito.', 'Sofía es muy buena. Suerte.', 'girl') },
      { x: 6, y: 10, look: 'oldman', dir: 'down', text: ['Bienvenido al Palacio de la Luz, sede de UTE.', 'La presidenta Sofía usa criaturas de tipo Eléctrico.', 'Las de tipo Tierra no reciben daño eléctrico.'] },
    ],
  }),
  gym_pde: room(GYM, {
    name: 'Planta de OSE (Punta del Este)',
    theme: 'gym_agua',
    npcs: [
      { x: 5, y: 2, look: 'leader_ose', dir: 'down', script: 'leader', leader: 'ose' },
      { x: 8, y: 6, look: 'swimmer', dir: 'left', sight: 4, trainer: TR('g2_a', 'Bruno', 'Operario de OSE', [['lobito', 14], ['lobito', 14]], 340, 'Cuido que el agua llegue limpia a cada canilla.', 'Se me rompió la cañería.', 'Lucía conoce cada cañería del país.', 'swimmer') },
      { x: 3, y: 9, look: 'girl', dir: 'right', sight: 4, trainer: TR('g2_b', 'Romina', 'Técnica de OSE', [['mbigua', 15]], 360, 'Analizo el agua todos los días.', 'Perdí.', 'Las criaturas de tipo Planta o Eléctrico le hacen daño al agua.', 'girl') },
      { x: 6, y: 10, look: 'oldman', dir: 'down', text: ['Planta de OSE de Punta del Este.', 'Lucía usa tipo Agua. Planta y Eléctrico tienen ventaja.'] },
    ],
  }),
  gym_tyt: room(GYM, {
    name: 'Gimnasio de Treinta y Tres',
    theme: 'gym_roca',
    npcs: [
      { x: 5, y: 2, look: 'leader_lavalleja', dir: 'down', script: 'leader', leader: 'lavalleja' },
      { x: 8, y: 6, look: 'gaucho', dir: 'left', sight: 4, trainer: TR('g3_a', 'Peón Ramiro', 'Peón', [['mulitin', 24], ['hornerazo', 24]], 540, 'La piedra no se quiebra.', 'Se quebró.', 'El agua y la planta le hacen daño a la roca.', 'gaucho') },
      { x: 3, y: 9, look: 'boy', dir: 'right', sight: 4, trainer: TR('g3_b', 'Tropero Lalo', 'Tropero', [['nanduro', 25]], 560, 'Ninguna tropa me detiene.', 'Perdí.', 'El general Lavalleja combate desde antes de que vos nacieras.', 'boy') },
      { x: 6, y: 10, look: 'oldman', dir: 'down', text: ['Gimnasio de Treinta y Tres.', 'El general Lavalleja usa tipo Roca y Tierra. Agua y Planta son tus mejores aliados.'] },
    ],
  }),
  estadio: room([
    'ZZZZZzzZZZZZ',
    'ZYYYYYYYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYAAYYYYZ',
    'ZZZZZAAZZZZZ',
    'ZZZZZAAZZZZZ',
    'ZZZZZAAZZZZZ',
    'ZZZZZAAZZZZZ',
    'ZYYYYAAYYYYZ',
    'ZNYYYAAYYYNZ',
    'ZYYYYAAYYYYZ',
    'ZYYYYYYYYYYZ',
    'YYYYYmmYYYYY',
  ], {
    name: 'Estadio Centenario: la final',
    music: 'title',
    exitTo: { map: 'liga_4', x: 5, y: 1 },
    npcs: [
      { x: 5, y: 2, look: 'champion', dir: 'down', script: 'champion' },
      { x: 5, y: 7, look: 'rival', dir: 'down', id: 'rival_final', cond: (f) => !f.rival4, script: 'rival_final' },
      { x: 6, y: 7, look: 'cop', dir: 'down', cond: (f) => !f.rival4, text: ['Primero tenés que vencer a {rival}.'] },
      { x: 2, y: 10, look: 'nurse', dir: 'right', script: 'nurse' },
      { x: 9, y: 10, look: 'clerk', dir: 'left', script: 'shop', stock: ['ultraesfera', 'mate_dulce', 'dulce_de_leche', 'chivito', 'alfajor', 'torta_frita'] },
    ],
    legend: { x: 6, y: 1, species: 'soldemayo', level: 60, flag: 'caught_soldemayo', cond: (f) => f.champion && f.caught_pamperon && f.caught_ballenaplata, text: 'El sol de la bandera aparece sobre la Torre de los Homenajes…' },
  }),
};

import { ACT2_OUTDOOR, ACT2_INTERIOR } from './maps-act2.ts';
import { SPECIES } from './species.ts';
import { MAP_BIOME, BIOMES } from './atlas.ts';
import { ROUTE_OUTDOOR, ROUTE_INTERIOR, rewire } from './maps-route.ts';
import { CHAIN, STOPS, GYM_STOPS, mapBand, STOP_INDEX, stopBand, gymAce, badgeOf } from './route.ts';
import { fitDown, fitSpecies } from './levels.ts';
import { fitToMap, wildList, teamOf, rng } from './map-gen.ts';
import { guideMap } from './guide.ts';
import { mazeMap } from './maze.ts';
import { addRouteStory } from './route-stories.ts';
import { flavorRoute, ROUTE_FLAVOR } from './route-flavor.ts';
import { addRumors } from './rumors.ts';
import { CUSTOM } from './custom-content.js';
import { layoutGym } from './gym-layouts.ts';
import { addFrayBentosStory } from './fraybentos.ts';
import { addMuelleStory, clearPierFolk } from './muelle.ts';
import { addCityEvents } from './events.ts';
import { SHIP_W, SHIP_H, shipChar } from '../gfx/tiles.ts';
import { WALL_CAPS, TILE_INFO } from '../gfx/tiles.ts';
import { MAP_OVERRIDES } from './map-overrides.js';
import { applyMapEdits, npcKeys } from './map-edits.ts';
import { scatterDecor } from './decor.ts';

export const OUTDOOR: Record<string, MapDef> = { ...BASE_OUTDOOR, ...ACT2_OUTDOOR, ...ROUTE_OUTDOOR };
export const INTERIOR: Record<string, MapDef> = { ...BASE_INTERIOR, ...ACT2_INTERIOR, ...ROUTE_INTERIOR };
rewire(OUTDOOR);
export const MAPS: Record<string, MapDef> = { ...OUTDOOR, ...INTERIOR };

/**
 * Fewer species per zone so the 151 creatures spread over every map. Each wild table keeps its
 * most common species; species left without any table (grass or fishing) are moved to a nearby
 * table with room, preferring one whose biome matches the creature's type, with levels shifted
 * to that table's range.
 */
const MAX_WILD = 4;
const CAP = 6;
(function trimWild() {
  const maps = Object.values(OUTDOOR).filter((m) => m.enc?.list && !m.fullWild);
  const kept = new Map(maps.map((m) => [m, [...m.enc.list].sort((x, y) => y[3] - x[3]).slice(0, MAX_WILD)]));
  const covered = new Set([...maps.flatMap((m) => kept.get(m).map((e) => e[0])), ...Object.values(OUTDOOR).flatMap((m) => (m.fish ?? []).map((e) => e[0]))]);
  const mid = (list) => list.reduce((a, e) => a + (e[1] + e[2]) / 2, 0) / list.length;
  const range = (m) => [Math.min(...m.enc.list.map((e) => e[1])), Math.max(...m.enc.list.map((e) => e[2]))];
  const biomeTypes = (m) => new Set((MAP_BIOME[m.id] ?? []).flatMap((b) => BIOMES[b]?.types ?? []));
  const lost = maps.flatMap((m) => m.enc.list.filter((e) => !covered.has(e[0])).map((e) => [m, e]));
  lost.sort((x, y) => x[1][1] - y[1][1]);
  for (const [from, e] of lost) {
    if (covered.has(e[0])) continue;
    const lvl = (e[1] + e[2]) / 2;
    const types = SPECIES[e[0]].types;
    const score = (m) => Math.abs(mid(m.enc.list) - lvl) + kept.get(m).length * 3 + (types.some((t) => biomeTypes(m).has(t)) ? 0 : 12) + (kept.get(m).length >= CAP ? 100 : 0);
    const target = maps.reduce((best, m) => (score(m) < score(best) ? m : best), from);
    const [lo, hi] = range(target);
    const span = e[2] - e[1];
    const nlo = Math.max(lo, Math.min(hi - span, Math.round(mid(target.enc.list) - span / 2)));
    kept.get(target).push([e[0], nlo, nlo + span, Math.min(e[3], 10)]);
    covered.add(e[0]);
  }
  for (const m of maps) m.enc.list = kept.get(m);
})();

/**
 * Level curve along the story. Each outdoor zone gets the band the player should have by the time
 * they get there (about the ace of the previous gym, never above the next one), so wild creatures
 * and route trainers only ever step up from one zone to the next. Levels written in the maps are
 * rescaled into these bands.
 */
export const ZONE_LEVELS = Object.fromEntries(CHAIN.map((id) => [id, mapBand(id)]));
(function retuneLevels() {
  const scale = (lv, [a, b]: number[], [lo, hi]: number[]) => (b === a ? lo : Math.round(lo + ((lv - a) * (hi - lo)) / (b - a)));
  for (const [id, band] of Object.entries(ZONE_LEVELS) as [string, number[]][]) {
    const m = OUTDOOR[id];
    if (!m || m.fullWild) continue;
    const lists = [m.enc?.list, m.fish].filter(Boolean);
    const all: number[] = lists.flatMap((l: any[]) => l.flatMap((e) => [e[1], e[2]]));
    if (!all.length) continue;
    const old = [Math.min(...all), Math.max(...all)];
    for (const l of lists as any[][]) for (const e of l) { e[1] = scale(e[1], old, band); e[2] = Math.max(e[1], scale(e[2], old, band)); e[0] = fitDown(e[0], e[1]); }
    for (const n of m.npcs ?? []) {
      if (!n.trainer) continue;
      n.trainer.team = n.trainer.team.map(([sp, lv]) => { const n2 = Math.min(band[1] + 2, Math.max(band[0], scale(lv, old, band))); return [fitSpecies(sp, n2), n2]; });
    }
  }
})();

/**
 * Buildings and dungeons were written for the old order of the story. Each belongs to a stop of the route and
 * its trainers are rescaled to that stop's curve: gym trainers sit just under the leader's ace, the rest of the
 * dungeons between the wild band and the ace.
 */
const PLACES = {
  fraybentos: ['gym_frb', 'anglo_1', 'casa_frb_faro', 'ferry_1', 'ferry_2', 'ferry_c1', 'ferry_c2', 'ferry_c3', 'ferry_c4', 'ferry_c5', 'terminal_frb', 'ferry_3', 'ferry_cocina', 'ferry_bodega', 'ferry_deck', 'ferry_cap'],
  paysandu: [],
  salto: ['gym_sal', 'radio_sal', 'represa_1', 'represa_2'],
  rivera: ['gym_riv', 'aduana_riv', 'torre_1', 'torre_2', 'torre_3', 'safari'],
  tacuarembo: ['gym_tac', 'parrilla_tac', 'ciclovia'],
  quebrada: ['gym_tyt'],
  paloma: ['cabo'],
  punta: ['gym_pde'],
  piriapolis: ['obs_1', 'obs_2', 'obs_3'],
  minas: ['pp_1', 'pp_2'],
  melo: ['anima_1', 'anima_2', 'anima_3'],
  durazno: ['gym_dur', 'refineria_dur'],
  montevideo: ['gym_mvd'],
  trinidad: ['gym_trinidad'],
  mercedes: ['gym_mercedes'],
  florida: ['gym_florida'],
  canelones: ['gym_canelones'],
};
/**
 * The gym a map "belongs to" for rematches: the first gym at or after the map on the story route
 * (everything before Trinidad belongs to Trinidad's medal). Returns the medal order, 1-based.
 * Maps off the route fall back on their trainers' level against each gym's ace.
 */
const ABBR = { mvd: 'montevideo', pde: 'punta', tyt: 'quebrada', tac: 'tacuarembo', riv: 'rivera', sal: 'salto', pay: 'paysandu', frb: 'fraybentos', dur: 'durazno', min: 'minas', ros: 'rosario', pir: 'piriapolis', pal: 'paloma' };
function stopOfMap(id) {
  if (STOP_INDEX[id] !== undefined) return STOP_INDEX[id];
  const ci = CHAIN.indexOf(id);
  if (ci >= 0) { let b = ci; while (STOP_INDEX[CHAIN[b]] === undefined) b++; return STOP_INDEX[CHAIN[b]]; }
  for (const [stop, ids] of Object.entries(PLACES)) if (ids.includes(id)) return STOP_INDEX[stop];
  const tail = id.replace(/^(gym|poli|shop|casa|anglo|ferry|torre|anima|represa|obs|liga|pp)_/, '').replace(/\d+$/, '');
  const key = ABBR[tail] ?? tail;
  return STOP_INDEX[key];
}
export function refGymOrder(mapId, maxLevel = 0) {
  const gyms = GYM_STOPS.map((g) => STOP_INDEX[g.id]);
  const i = stopOfMap(mapId);
  if (i !== undefined) {
    const k = gyms.findIndex((g) => g >= i);
    return k < 0 ? gyms.length : k + 1;
  }
  const k = GYM_STOPS.findIndex((g) => gymAce(g.id) + 1 >= maxLevel);
  return k < 0 ? GYM_STOPS.length : k + 1;
}

addMuelleStory(OUTDOOR.paysandu);
(function retuneBuildings() {
  for (const [stop, ids] of Object.entries(PLACES)) {
    const [lo, hi] = stopBand(STOP_INDEX[stop]);
    const ace = gymAce(stop);
    for (const id of ids) {
      const m = INTERIOR[id] ?? OUTDOOR[id];
      const gym = id.startsWith('gym_');
      let target = gym ? [Math.max(lo, ace - 4), ace - 1] : [hi, Math.max(hi + 1, ace - 1)];
      if (/^ferry_/.test(id)) { // the ship climbs from the main deck to the upper deck, in steps
        const t = ({ ferry_1: [0, 1], ferry_2: [1, 1], ferry_3: [2, 3], ferry_bodega: [2, 4], ferry_deck: [4, 5] } as any)[id] ?? [1, 2];
        target = [Math.min(lo + t[0], ace - 1), Math.min(lo + t[1], ace - 1)];
      }
      const lists = [m.enc?.list, m.fish].filter(Boolean);
      const wild = lists.flatMap((l) => l.flatMap((e) => [e[1], e[2]]));
      if (wild.length) {
        const wa = Math.min(...wild), wb = Math.max(...wild);
        const sc = (v) => (wb === wa ? lo : Math.round(lo + ((v - wa) * (hi - lo)) / (wb - wa)));
        for (const l of lists) for (const e of l) { e[1] = sc(e[1]); e[2] = Math.max(e[1], sc(e[2])); e[0] = fitDown(e[0], e[1]); }
      }
      const teams = (m.npcs ?? []).filter((n) => n.trainer).map((n) => n.trainer.team);
      const all = teams.flat().map((t) => t[1]);
      if (!all.length) continue;
      const a = Math.min(...all), b = Math.max(...all);
      for (const team of teams) {
        for (const t of team) {
          t[1] = b === a ? target[1] : Math.round(target[0] + ((t[1] - a) * (target[1] - target[0])) / (b - a));
          t[0] = fitSpecies(t[0], t[1]);
        }
      }
    }
  }
})();

/**
 * Rival encounters, placed on the route maps where the story needs them (stage = index in rivalTeamFor).
 * The rival stands on the road, so the player cannot walk past without meeting them.
 */
const RIVAL_AT = [
  ['r_rosario_sanjose', 'rival_bosque', 'rival_bosque'],
  ['ruta3', 'rival_mvd', 'rival2'],
  ['r_lascano_rocha', 'rival_r5', 'rival5'],
  ['r_sarandi_durazno', 'rival_r24', 'rival6'],
];
for (const [mapId, script, flag] of RIVAL_AT) {
  const m = OUTDOOR[mapId];
  const rows = m.tiles;
  const mid = Math.floor(rows[0].length / 2);
  let spot = null;
  for (let d = 0; d < mid && !spot; d++) for (const x of [mid + d, mid - d]) { const y = rows.findIndex((r) => r[x] === '='); if (y >= 0) { spot = { x, y }; break; } }
  const npc = { ...(spot ?? { x: mid, y: 8 }), look: 'rival', dir: 'up', id: script, cond: (f) => !f[flag], script };
  fitToMap(rows, [npc]);
  (m.npcs ??= []).push(npc);
}

// The founder of the Equipo PP waits by the Estadio Centenario once the player has the eighth medal and the factory in Minas is shut down.
(function placeCalima() {
  const m = OUTDOOR.montevideo;
  let door = null;
  m.tiles.forEach((row, y) => { const x = row.indexOf('D'); if (!door && x >= 0) door = { x, y }; });
  const npc: any = { x: door.x, y: door.y + 2, look: 'calima', dir: 'up', id: 'calima', cond: (f) => f.badge12 && f.pp_clear && !f.anglo_clear, script: 'calima' };
  fitToMap(m.tiles, [npc]);
  m.npcs.push(npc);
})();

// The Silbato del Hornero (Vuelo) comes from Florida, the windy city of the route.
Object.assign(INTERIOR.casa_florida.npcs[0], { script: 'gift_vuelo', text: undefined });

// Gift NPCs for the field moves (the Canoa and the Guantes de Domador; the Machete comes from the Buquebus captain in Colonia).
for (const [house, script] of [['casa_artigas', 'gift_surf'], ['casa_tac', 'gift_fuerza']]) {
  Object.assign(INTERIOR[house].npcs[0], { script, text: undefined });
}

/**
 * Field-move obstacles on the main road. Each one sits on the route right after the city where the player
 * receives the move and wins the medal that lets them use it:
 *   Corte (Machete, Medalla Salto): a thicket across the road after Belén.
 *   Surf (Canoa, Medalla Rivera): a river across Paso del Río Tacuarembó (map tranqueras).
 *   Fuerza (Guantes, Medalla Tacuarembó): a boulder in a gap in a wall of trees after Tupambaé.
 *   Destello (Farol, Medalla Maldonado): the dark mountain road between Piriápolis and Minas.
 */
/** Turns the generated road between Piriápolis and Minas into a dark cave of Roca and Bicho creatures. */
function makeCave(m) {
  m.dark = true;
  m.theme = 'cueva';
  m.music = 'cave';
  m.name = 'Cueva de las Sierras';
  m.signs = ['CUEVA DE LAS SIERRAS\nPiriápolis ←  ·  → Minas\nSin luz no se ve el camino. El Farol de Gaucho ayuda.'];
  const levels = m.enc.list.flatMap((e) => [e[1], e[2]]);
  const lo = Math.min(...levels), hi = Math.max(...levels);
  // The old road's creatures stay as rare visitors, so none of them becomes impossible to find.
  const fresh = wildList(['roca', 'bicho'], lo, hi, 8, 'cueva');
  m.enc.list = [...fresh, ...m.enc.list.filter((e) => !fresh.some((f) => f[0] === e[0])).map((e) => [e[0], e[1], e[2], 2])];
  const folk = [
    ['Minero Evaristo', 'Minero', ['roca'], ['El ruido de la roca se aprende con los años.', 'Se me derrumbó el túnel.', 'Seguí por el camino más claro.']],
    ['Espeleóloga Bianca', 'Espeleóloga', ['bicho', 'roca'], ['Estudio lo que vive donde no llega el sol.', 'No esperaba perder.', 'Los cristales marcan el camino.']],
    ['Entomólogo Ramiro', 'Entomólogo', ['bicho'], ['¿Sabías que acá hay escarabajos sin ojos?', 'Hoy me tocó a mí.', 'No pises los hongos.']],
  ];
  (m.npcs ?? []).filter((n) => n.trainer && !n.hideout).forEach((n, k) => {
    const [name, cls, types, [intro, lose, after]] = folk[k % folk.length];
    n.trainer.name = name;
    n.trainer.cls = cls;
    n.trainer.intro = intro; n.trainer.lose = lose; n.trainer.after = after;
    n.trainer.team = teamOf(types, n.trainer.team.map((t) => t[1]), `cueva${k}`);
  });
}

/** The last road before the capital becomes the "Calle Victoria": a cave full of veterans on the way to the Liga. */
function makeVictory(m) {
  m.theme = 'cueva';
  m.music = 'cave';
  m.name = 'Calle Victoria';
  m.signs = ['CALLE VICTORIA\nLas Piedras ←  ·  → Montevideo\nSolo siguen los entrenadores que ya ganaron muchas medallas.'].slice(0, m.signs?.length ?? 1);
  const levels = m.enc.list.flatMap((e) => [e[1], e[2]]);
  const lo = Math.min(...levels), hi = Math.max(...levels);
  const fresh = wildList(['roca', 'lucha', 'siniestro', 'tierra'], lo, hi, 8, 'victoria');
  m.enc.list = [...fresh, ...m.enc.list.filter((e) => !fresh.some((f) => f[0] === e[0])).map((e) => [e[0], e[1], e[2], 2])];
  const folk = [
    ['Veterano Aníbal', 'Veterano de la Liga', ['lucha', 'roca'], ['Pasé por acá hace veinte años y todavía me acuerdo de cada piedra.', 'Se nota que viniste a ganar.', 'Faltan pocos metros para el Estadio.']],
    ['Capitana Soledad', 'Ex finalista', ['normal', 'tierra'], ['Perdí la final por un solo punto. No pienso perder otra vez.', 'Merecías pasar.', 'Que el Campeón te encuentre en forma.']],
    ['Aspirante Néstor', 'Aspirante', ['siniestro', 'roca'], ['Llevo tres intentos a la Liga. Hoy no me frenás.', 'Quizás el cuarto sí.', 'La capital se ve desde la salida.']],
  ];
  (m.npcs ?? []).filter((n) => n.trainer).forEach((n, k) => {
    const [name, cls, types, [intro, lose, after]] = folk[k % folk.length];
    n.trainer.name = name; n.trainer.cls = cls; n.trainer.intro = intro; n.trainer.lose = lose; n.trainer.after = after;
    n.trainer.team = teamOf(types, n.trainer.team.map((t) => t[1] + 2), `victoria${k}`);
  });
}
makeVictory(OUTDOOR.r_laspiedras_montevideo);
// A field nurse sets up camp in a side chamber, and a Liga guard keeps the Montevideo end closed until the three veterans are beaten.
OUTDOOR.r_laspiedras_montevideo.npcs.push({ x: 0, y: 0, look: 'nurse', dir: 'down', name: 'Enfermera de campaña', script: 'camp_nurse' });
mazeMap(OUTDOOR.r_laspiedras_montevideo, 'r_laspiedras_montevideo', { kind: 'cave', extraItems: ['mate_dulce', 'superesfera'], fall: 'dulce_de_leche' });
{
  const m = OUTDOOR.r_laspiedras_montevideo;
  const ids = m.npcs.filter((n) => n.trainer).map((n) => n.trainer.id);
  const w = m.tiles[0].length;
  m.tiles.forEach((row, y) => {
    if (row[w - 1] !== '=') return;
    m.npcs.push({ x: w - 1, y, look: 'cop', dir: 'left', blocker: true, name: 'Guardia de la Liga', text: ['Calle Victoria: solo pasa quien venció a los tres veteranos del camino.', 'Es la regla de la Liga. Todavía te falta alguno.'], cond: (f) => !ids.every((id) => f[`tr_${id}`]) });
  });
}

/** The first long forest of the trip (Bosque Grande): thick trees, lots of bichos, plantas and voladores before the first gym. */
function makeForest(m, name, sign, seed, folk) {
  m.name = name;
  m.signs = [sign].slice(0, m.signs?.length ?? 1);
  const levels = m.enc.list.flatMap((e) => [e[1], e[2]]);
  const lo = Math.min(...levels), hi = Math.max(...levels);
  const fresh = wildList(['bicho', 'planta', 'volador'], lo, hi, 8, seed);
  m.enc.list = [...fresh, ...m.enc.list.filter((e) => !fresh.some((f) => f[0] === e[0])).map((e) => [e[0], e[1], e[2], 2])];
  (m.npcs ?? []).filter((n) => n.trainer).forEach((n, k) => {
    const [tname, cls, types, [intro, lose, after]] = folk[k % folk.length];
    n.trainer.name = tname; n.trainer.cls = cls; n.trainer.intro = intro; n.trainer.lose = lose; n.trainer.after = after;
    n.trainer.team = teamOf(types, n.trainer.team.map((t) => t[1]), `${seed}${k}`);
  });
}
makeForest(OUTDOOR.r_rosario_sanjose, 'Bosque Grande', 'BOSQUE GRANDE\nRosario ←  ·  → San José de Mayo\nHay más bichos que árboles. Cuidado con las telarañas.', 'bosque1', [
  ['Cazabichos Lautaro', 'Cazabichos', ['bicho'], ['Con la red no se me escapa nadie. Con vos, veremos.', 'Se me fue el más grande.', 'Los bichos de acá no pican, casi.']],
  ['Botánica Irene', 'Botánica', ['planta', 'bicho'], ['Estudio cada hoja de este monte.', 'Hasta las plantas pierden.', 'Seguí por el camino de tierra.']],
  ['Ornitólogo Matías', 'Ornitólogo', ['volador'], ['Desde las copas se oye de todo.', 'Se me voló la ventaja.', 'Mirá para arriba de vez en cuando.']],
]);
makeForest(OUTDOOR.r_ecilda_trinidad, 'Monte Espeso', 'MONTE ESPESO\nEcilda Paullier ↓  ·  ↑ Trinidad\nEl bosque sigue hasta Flores. No te salgas del camino.', 'bosque2', [
  ['Guardabosques Elías', 'Guardabosques', ['planta', 'volador'], ['Este monte tiene dueño: el que lo cuida.', 'Tenés buen paso.', 'Trinidad está al final del monte.']],
  ['Apicultor Ramón', 'Apicultor', ['bicho', 'volador'], ['Las abejas ya te vieron.', 'Me picó la derrota.', 'Dejá algo de miel.']],
  ['Cazabichos Delfina', 'Cazabichos', ['bicho', 'planta'], ['Un buen cazabichos nunca sale sin red.', 'Me ganaste limpio.', 'Seguí, el gimnasio te espera.']],
]);

mazeMap(OUTDOOR.r_rosario_sanjose, 'r_rosario_sanjose', { kind: 'forest', extraItems: ['te_marcela', 'esfera'] });
mazeMap(OUTDOOR.r_ecilda_trinidad, 'r_ecilda_trinidad', { kind: 'forest', extraItems: ['esfera', 'te_marcela'] });

/** First cave of the trip, between the first and second gym: miners, and the first PP grunts guarding the way out. */
function makePPCave(m) {
  m.theme = 'cueva';
  m.music = 'cave';
  m.name = 'Cueva de Palmitas';
  m.signs = ['CUEVA DE PALMITAS\nPalmitas ←  ·  → Mercedes\nHay luces de máquinas al fondo. Mejor no hacer ruido.'].slice(0, m.signs?.length ?? 1);
  const levels = m.enc.list.flatMap((e) => [e[1], e[2]]);
  const lo = Math.min(...levels), hi = Math.max(...levels);
  const fresh = wildList(['roca', 'bicho', 'tierra'], lo, hi, 8, 'cuevapalmitas');
  m.enc.list = [...fresh, ...m.enc.list.filter((e) => !fresh.some((f) => f[0] === e[0])).map((e) => [e[0], e[1], e[2], 2])];
  const folk = [
    ['Minero Wilson', 'Minero', ['roca'], ['Hace años que pico acá y nunca vi tanta gente rara.', 'Se me cayó el casco.', 'Los de gris pasaron por el fondo con cajas.'], 'boy'],
    ['Recluta PP', 'Equipo PP', ['siniestro', 'bicho'], ['Esta cueva es del Proyecto Pampero. Seguí de largo.', 'Informo que perdí.', 'No digas que nos viste.'], 'grunt'],
    ['Recluta PP', 'Equipo PP', ['siniestro', 'roca'], ['Instalamos una máquina de niebla acá. No la toques.', 'Qué problema.', 'Cuando la niebla se venda, vas a entender.'], 'grunt'],
  ];
  // two more people of the mountain, so the way through is not empty before anyone has heard of Marta
  const base = (m.npcs ?? []).find((n) => n.trainer);
  if (base) for (const [k, look] of [[3, 'girl'], [4, 'boy']] as const) m.npcs.push({ ...base, look, trainer: { ...base.trainer, id: `${base.trainer.id}_x${k}` } });
  folk.splice(1, 0,
    ['Espeleóloga Rosario', 'Espeleóloga', ['bicho', 'roca'], ['Bajo cada fin de semana a mirar la roca. Hoy te toca a vos.', 'Buen ojo.', 'Hay algo raro al fondo: se oyen voces.'], 'girl'],
    ['Minero Gastón', 'Minero', ['tierra', 'roca'], ['Acá abajo no se pasa sin pelear.', 'Me ganaste. Seguí.', 'Si ves a los de gris, no los sigas.'], 'boy'],
  );
  (m.npcs ?? []).filter((n) => n.trainer).forEach((n, k) => {
    const [tname, cls, types, [intro, lose, after], look] = folk[k % folk.length];
    n.trainer.name = tname; n.trainer.cls = cls; n.trainer.intro = intro; n.trainer.lose = lose; n.trainer.after = after;
    n.trainer.team = teamOf(types, n.trainer.team.map((t) => t[1]), `cuevap${k}`);
    n.look = look;
    if (cls === 'Equipo PP') { n.hideout = true; n.cond = (f) => !!f.marta_lost && !f.marta_help; }
  });
}
makePPCave(OUTDOOR.r_palmitas_mercedes);
// Mercedes' gym is closed: Marta, the Correo leader, is trapped at the end of the cave by two PP recruits.
{
  const cave = OUTDOOR.r_palmitas_mercedes;
  const ppIds = cave.npcs.filter((n) => n.trainer?.cls === 'Equipo PP').map((n) => n.trainer.id);
  // Marta is only in the cave once the player has heard she is missing (the Mercedes mail carrier tells them).
  cave.npcs.push({ x: 0, y: 0, look: 'leader_correo', dir: 'down', script: 'marta_cave', ppIds, hideout: true, cond: (f) => !!f.marta_lost && !f.marta_help });
  mazeMap(cave, 'r_palmitas_mercedes', { kind: 'cave', extraItems: ['esfera', 'te_marcela'], fall: 'mate_dulce' });
  const gymDoor = OUTDOOR.mercedes.doors.findIndex((d) => (typeof d === 'string' ? d : d.to) === 'gym_mercedes');
  OUTDOOR.mercedes.doors[gymDoor] = { to: 'gym_mercedes', req: 'marta_help', deny: ['El gimnasio del Correo está cerrado.', 'Un cartel en la puerta dice: "Volvemos pronto".'] };
  // Someone in town knows where Marta went (the gym only says it is closed).
  const mer = OUTDOOR.mercedes;
  let dx = 0, dy = 0;
  mer.tiles.forEach((r, y) => { let k = 0; [...r].forEach((c, x) => { if (c === 'D') { if (k++ === gymDoor) { dx = x; dy = y; } } }); });
  const cartero = { x: dx + 2, y: dy + 2, look: 'clerk', dir: 'left', id: 'mer_cartero', script: 'cartero_marta', text: ['Soy cartero del Correo y hoy no tengo a quién entregarle nada: la presidenta no está.', 'Marta salió ayer a llevar un paquete por la cueva de Palmitas, al oeste, y no volvió.', 'Unos tipos de gris la seguían. Si vas para allá, andá con cuidado.'], cond: (f) => !f.marta_help };
  const carteroAfter: any = { ...cartero, id: 'mer_cartero2', text: ['¡Marta volvió! Llegó con un paquete de planos y abrió el gimnasio.', 'Gracias por ir a buscarla.'], cond: (f) => !!f.marta_help };
  fitToMap(mer.tiles, [cartero]);
  carteroAfter.x = cartero.x; carteroAfter.y = cartero.y; // the same man, once Marta is back
  mer.npcs.push(cartero as any, carteroAfter);
}

// Tacuarembó's second house is the Criadero Los Teros: pens where creatures grow while you travel (api.criadero).
{
  const W = 24, H = 14;
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('i'));
  for (let x = 0; x < W; x++) g[0][x] = 'x';
  g[0][4] = 'X'; g[0][19] = 'X';
  for (let x = 9; x <= 14; x++) g[2][x] = 'T';
  g[1][0] = 'N'; g[1][23] = 'N'; g[12][0] = 'N'; g[12][23] = 'N';
  const pens = [1, 9, 17];
  for (const px of pens) for (let y = 5; y <= 10; y++) for (let x = px; x <= px + 5; x++) g[y][x] = (y === 5 || y === 10 || x === px || x === px + 5) ? 'F' : '.';
  g[13][11] = 'm'; g[13][12] = 'm';
  const beasts = [['alazan', 'corcel'], ['carpincho', 'carpincho'], ['gatomontes', 'pibe']];
  const critters = pens.flatMap((px, k) => beasts[k].map((sp, j) => ({ x: px + 1 + j * 3, y: 7 + j, look: `animal:${sp}`, wander: true, critter: true, dir: 'down', text: [`${SPECIES[sp].name} come tranquilo y no te hace caso.`] })));
  INTERIOR.casa_tac2 = MAPS.casa_tac2 = room(g.map((r) => r.join('')), {
    name: 'Criadero Los Teros',
    npcs: [
      { x: 11, y: 3, look: 'campesina', dir: 'down', script: 'criadero', name: 'Criadora' },
      { x: 4, y: 3, look: 'gaucho', dir: 'right', text: ['Mi yegua lleva una semana acá y volvió más mansa que nunca.', 'Se nota quién camina mucho: acá se les paga el tiempo en kilómetros.'] },
      { x: 20, y: 12, look: 'boy', dir: 'left', text: ['Dejé a mi bicho de compañero y ya cambió de forma. ¡Ni lo reconocí!', 'Si dejás a uno que está por evolucionar, lo hace acá solo.'] },
      ...critters,
    ] as any,
  });
}

// Tacuarembó's bicycle shop: racks of bikes, a mechanic's bench, and the owner gives the family bike away (script gift_tac).
{
  const W = 16, H = 10;
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('i'));
  for (let x = 0; x < W; x++) g[0][x] = 'x';
  g[0][3] = 'X'; g[0][12] = 'X';
  for (let x = 1; x <= 5; x++) g[2][x] = 'T';
  for (let x = 10; x <= 14; x++) g[2][x] = 'T';
  for (let x = 6; x <= 9; x++) g[5][x] = 'T';
  g[1][0] = 'N'; g[1][15] = 'N'; g[8][0] = 'N'; g[8][15] = 'N';
  g[9][7] = 'm'; g[9][8] = 'm';
  INTERIOR.bici_tac = MAPS.bici_tac = room(g.map((r) => r.join('')), {
    name: 'Bicicletería El Pedal',
    npcs: [
      { x: 7, y: 4, look: 'campesina', dir: 'down', script: 'gift_tac', name: 'Dueña' },
      { x: 3, y: 6, look: 'boy', dir: 'right', text: ['Mi bici tiene dieciocho cambios. Con eso subo cualquier cuesta del norte.', 'Dicen que la Ciclovía tiene tramos tan largos que ni se ve el final.'] },
      { x: 12, y: 6, look: 'gaucho', dir: 'left', wander: true, text: ['Vine a arreglar una goma. Siempre se pincha en el peor momento.', 'A caballo no se pincha, pero tampoco se va al supermercado.'] },
    ] as any,
  });
}

// Montevideo's shop is the Shopping: three floors of shops joined by a lift ('Ͽ' in the wall walks you to the next floor up).
{
  const W = 22, H = 14;
  type Store = [string[], string, string, string]; // stock, clerk look, clerk name, greeting
  const floors: { id: string; name: string; stores: [Store, Store]; folk: [string, string[]] }[] = [
    { id: 'shop_mvd', name: 'Shopping de Montevideo · Planta baja', folk: ['abuela', ['Vengo todos los sábados a mirar vidrieras. Comprar, casi nunca.', 'El ascensor sube hasta la confitería.']], stores: [
      [['esfera', 'superesfera', 'ultraesfera', 'mate', 'mate_dulce', 'dulce_de_leche'], 'clerk', 'Almacenero', 'Almacén Central. ¿Qué se lleva?'],
      [['aloe', 'ruda', 'linimento', 'despertador', 'repelente'], 'maestra', 'Farmacéutica', 'Farmacia del Shopping. Pase, pase.'],
    ] },
    { id: 'shopping_2', name: 'Shopping de Montevideo · Primer piso', folk: ['hincha', ['Entrené tres meses con los suplementos de arriba y ni así le gané a mi primo.', 'Arriba hay una confitería que es una locura.']], stores: [
      [['refuerzo_ataque', 'refuerzo_defensa', 'refuerzo_especial', 'refuerzo_velocidad', 'refuerzo_precision', 'refuerzo_resistencia', 'concentracion'], 'obrero', 'Preparador', 'Suplementos para entrenadores. Todo con boleta.'],
      [['repelente', 'repelente_super', 'repelente_max'], 'campesina', 'Vendedora', 'Casa del Campo. Repelentes de todo tipo.'],
    ] },
    { id: 'shopping_3', name: 'Shopping de Montevideo · Confitería y joyas', folk: ['boy', ['Me gasté la mesada en una torta frita. Valió la pena.', 'El ascensor de este piso baja directo a la planta baja.']], stores: [
      [['alfajor', 'torta_frita', 'chivito', 'pan_casero', 'alfajor_triple'], 'cocinero', 'Confitero', 'Confitería. Lo que cura, cura rico.'],
      [['piedra_agata', 'piedra_amatista', 'piedra_basalto'], 'artesana', 'Joyera', 'Piedras de las sierras. Cada una despierta algo distinto.'],
    ] },
  ];
  floors.forEach((f, k) => {
    const g: string[][] = Array.from({ length: H }, () => Array(W).fill('i'));
    for (let x = 0; x < W; x++) g[0][x] = 'x';
    for (const x of [3, 7, 14, 18]) g[0][x] = 'X';
    g[0][10] = 'Ͽ'; g[0][11] = 'Ͽ';
    for (const x of [1, 2, 3, 4, 5, 6, 15, 16, 17, 18, 19, 20]) g[1][x] = 'B';
    for (const x of [2, 3, 4, 17, 18, 19]) g[3][x] = 'n';
    for (const [x, y] of [[0, 1], [21, 1], [8, 6], [13, 6], [0, 12], [21, 12], [4, 9], [17, 9]]) g[y][x] = 'N';
    for (const x of [7, 8, 13, 14]) g[9][x] = 'T';
    g[13][10] = 'm'; g[13][11] = 'm';
    const [[stockL, lookL, nameL, greetL], [stockR, lookR, nameR, greetR]] = f.stores;
    const next = floors[(k + 1) % floors.length].id;
    INTERIOR[f.id] = MAPS[f.id] = room(g.map((r) => r.join('')), {
      name: f.name,
      npcs: [
        { x: 3, y: 2, look: lookL, dir: 'down', script: 'shop', fixedStock: true, stock: stockL, greeting: greetL, clerkName: nameL },
        { x: 18, y: 2, look: lookR, dir: 'down', script: 'shop', fixedStock: true, stock: stockR, greeting: greetR, clerkName: nameR },
        { x: 10, y: 7, look: f.folk[0], dir: 'down', wander: true, text: f.folk[1] },
      ] as any,
      warps: [{ x: 10, y: 0, to: next, tx: 10, ty: 1 }, { x: 11, y: 0, to: next, tx: 11, ty: 1 }],
      ...(k ? { exitTo: { map: floors[k - 1].id, x: 10, y: 1 } } : {}),
    });
  });
}

// Every gym has its own floor plan.
GYM_STOPS.forEach((stop, i) => {
  const door = (OUTDOOR[stop.id]?.doors ?? []).map((d) => (typeof d === 'string' ? d : d.to)).find((to) => to.startsWith('gym_'));
  if (door && INTERIOR[door]) layoutGym(INTERIOR[door], i, door);
});

/** A cave mouth: a wall of rock runs along the edge of the map beside the trail, and the trail ends in a dark opening in it. */
const MOUTH = { w: 'ϗ', e: 'ϙ', n: 'ϛ', s: 'ϝ' };
const WALL = { w: 'k', e: 'ϰ', n: 'ϱ', s: 'ϲ' };
function caveMouth(m, side) {
  const rows = m.tiles.map((r) => [...r]);
  const h = rows.length, w = rows[0].length;
  const cell = (d, k) => (side === 'e' ? [w - 1 - d, k] : side === 'w' ? [d, k] : side === 'n' ? [k, d] : [k, h - 1 - d]);
  const span = side === 'e' || side === 'w' ? h : w;
  const busy = new Set([...(m.npcs ?? []), ...(m.items ?? [])].map((o) => `${o.x},${o.y}`));
  const pathAt = (d, k) => { const [x, y] = cell(d, k); return rows[y]?.[x] === '=' || rows[y]?.[x] === 'c' || rows[y]?.[x] === 'b'; };
  const trail = [];
  for (let k = 0; k < span; k++) if (pathAt(0, k)) trail.push(k);
  if (!trail.length) return;
  const mid = trail[Math.floor(trail.length / 2)];
  for (let k = 1; k < span - 1; k++) {
    const [x, y] = cell(0, k);
    if (busy.has(`${x},${y}`)) continue;
    if (trail.includes(k)) { rows[y][x] = k === mid ? MOUTH[side] : WALL[side]; continue; }
    if (k < trail[0] - 5 || k > trail[trail.length - 1] + 5) continue;
    rows[y][x] = WALL[side];
  }
  // the two ends of the wall are rounded off
  const placed = [];
  for (let k = 0; k < span; k++) { const [x, y] = cell(0, k); if ([WALL[side], MOUTH[side]].includes(rows[y][x])) placed.push(k); }
  if (placed.length > 1) {
    const [a, b] = placed.filter((k) => { const [x, y] = cell(0, k); return rows[y][x] === WALL[side]; }).length ? [placed[0], placed[placed.length - 1]] : [null, null];
    for (const [k, c] of [[a, WALL_CAPS[side][0]], [b, WALL_CAPS[side][1]]]) { const [x, y] = cell(0, k); if (rows[y][x] === WALL[side]) rows[y][x] = c; }
  }
  // keep one clear way to the mouth: the tiles in front of it stay walkable
  const [fx, fy] = cell(1, mid);
  if (TILE_INFO[rows[fy][fx]]?.solid) rows[fy][fx] = '=';
  m.tiles = rows.map((r) => r.join(''));
}
// PP built a fog machine deep inside the Cueva de las Sierras; two recruits guard it. It is lit from the moment you arrive.
{
  const m = OUTDOOR.r_piriapolis_minas;
  const base = m.npcs.find((n) => n.trainer);
  const lv = base.trainer.team.map((t) => t[1]);
  const pp = (k, types, intro, lose, after) => ({ ...base, look: 'grunt', hideout: true, trainer: { ...base.trainer, id: `${base.trainer.id}_pp${k}`, name: 'Recluta PP', cls: 'Equipo PP', intro, lose, after, team: teamOf(types, lv.map((l) => l + 1), `sierraspp${k}`) as any } as any });
  m.npcs.push(
    pp(0, ['siniestro', 'roca'], 'La máquina funciona mejor sin luz. Nos gusta la oscuridad.', 'Se apagó todo.', 'Hacé lo que quieras con la máquina, yo no vi nada.'),
    pp(1, ['siniestro', 'bicho'], 'Este túnel va a dejar pasar niebla hasta Minas. Vos no la vas a frenar.', 'Se nos arruina el negocio.', 'El jefe se va a enterar de esto.'),
    { x: 0, y: 0, look: 'machine', dir: 'down', name: 'Máquina de niebla', script: 'route_fog', hideout: true, doneFlag: 'rf_r_piriapolis_minas', reward: 'mate_dulce', clue: 'Una máquina de la PP escondida entre los cristales. Sus luces rojas son lo único que se ve en la oscuridad. Echa niebla por el túnel hacia Minas.' },
  );
}
mazeMap(OUTDOOR.r_piriapolis_minas, 'r_piriapolis_minas', { kind: 'cave', extraItems: ['mate_dulce', 'superesfera'], fall: 'ultraesfera' });
for (const caveId of ['r_palmitas_mercedes', 'r_piriapolis_minas']) {
  const cave = OUTDOOR[caveId];
  for (const [side, ex] of Object.entries(cave.exits ?? {})) {
    caveMouth(cave, side);
    const opp = { e: 'w', w: 'e', n: 's', s: 'n' }[side];
    if (OUTDOOR[ex.to]) caveMouth(OUTDOOR[ex.to], opp);
  }
}

// A road that is closed has someone standing in it (a police officer, or PP once they are around) who says why.
for (const [mapId, m] of Object.entries(OUTDOOR)) {
  for (const [side, ex] of Object.entries(m.exits ?? {})) {
    if (!ex.req || !Array.isArray(ex.deny)) continue;
    const w = m.tiles[0].length, h = m.tiles.length;
    const cells = side === 'e' ? m.tiles.map((_, y) => [w - 1, y]) : side === 'w' ? m.tiles.map((_, y) => [0, y]) : side === 'n' ? [...m.tiles[0]].map((_, x) => [x, 0]) : [...m.tiles[h - 1]].map((_, x) => [x, h - 1]);
    let open = cells.filter(([x, y]) => !TILE_INFO[m.tiles[y][x]]?.solid);
    if (!open.length || open.length > 5) continue;
    if (mapId === 'carmelo') { // at home a neighbour stops you, not a row of officers: one gap in the fence, one person in it
      const keep = open[Math.floor(open.length / 2)];
      for (const [x, y] of open) if (y !== keep[1]) m.tiles[y] = m.tiles[y].slice(0, x) + '#' + m.tiles[y].slice(x + 1);
      open = [keep];
    }
    if (mapId === 'fraybentos' && side === 'n') { // the road to Young is overgrown: real thickets that only the Machete opens
      for (const [x] of open) for (const [tx, ty] of [[x, 0], [x - 1, 1], [x, 1], [x + 1, 1]]) if (m.tiles[ty][tx] !== '#') m.tiles[ty] = m.tiles[ty].slice(0, tx) + '%' + m.tiles[ty].slice(tx + 1);
      continue;
    }
    const pp = STOP_INDEX[mapId] >= STOP_INDEX.fraybentos;
    const done = (f) => (typeof ex.req === 'string' ? f[ex.req] : ex.req(f));
    // Who stands in the way, and why, varies from road to road: a fallen tree, works, a flood, a herd, a stranded truck.
    // Only roads that wait for a medal or a favour get a cover story; special ones (the bike path, the Machete) keep their own text.
    const dest = String(ex.deny[0] ?? '').match(/^El camino a (.+?) está cerrado\.?$/)?.[1];
    const why = String(ex.deny[1] ?? '');
    const hint = why || null; // already vague (see FWD_DENY); the real clues are the rumours (rumors.ts)
    let who: any = null;
    if (mapId !== 'carmelo' && dest && hint) {
      const civil = [
        ['obrero', 'Bombero', `Se cayó un árbol sobre el camino a ${dest} y ya están los bomberos cortándolo. No se puede pasar.`],
        ['obrero', 'Obrero vial', `Estamos reparando el asfalto del camino a ${dest}. Está cortado hasta nuevo aviso.`],
        ['campesina', 'Vecina', `Se desbordó el arroyo y el camino a ${dest} quedó bajo agua. Esperá a que baje.`],
        ['camionero', 'Camionero', `Mi camión quedó varado en el camino a ${dest}, atravesado en la ruta. Estamos esperando la grúa.`],
        ['gaucho', 'Arriero', `Hay una tropa de vacas cruzando el camino a ${dest}. Va a tardar un rato.`],
        ['clerk', 'Funcionario', `La Intendencia cortó el camino a ${dest} por una obra. El desvío también está cerrado.`],
        ['cop', 'Guardia', `Estamos trabajando en una situación en el camino a ${dest}. Le pido que espere un poco y vuelva en un rato.`],
      ];
      const list = pp ? [...civil.slice(0, 6), ['grunt', 'Equipo PP', `El camino a ${dest} está cerrado por orden del PP.`]] : civil;
      const [look, name, intro] = mapId === 'fraybentos' ? ['gaucho', 'Arriero', `Los zarzales se cerraron sobre el camino a ${dest}.`] : list[(STOP_INDEX[mapId] ?? 0) % list.length];
      who = { look, name, text: look === 'grunt' ? ex.deny : [intro, hint] };
    }
    for (const [x, y] of open) {
      if ((m.npcs ?? []).some((n) => n.x === x && n.y === y)) continue;
      (m.npcs ??= []).push({ x, y, look: who?.look ?? (mapId === 'carmelo' ? 'oldman' : pp ? 'grunt' : 'cop'), dir: side === 'e' ? 'left' : side === 'w' ? 'right' : side === 'n' ? 'down' : 'up', blocker: true, name: who?.name ?? (mapId === 'carmelo' ? 'Vecino' : pp ? 'Equipo PP' : 'Guardia'), text: who?.text ?? ex.deny, cond: (f) => !done(f) });
    }
  }
}

// The gossip that explains, a little at a time, why the roads are closed.
addRumors(OUTDOOR);

// Routes are guided, not open fields: a trail between tree walls, grass clusters, side pockets and one-way ledges.
for (const [id, m] of Object.entries(OUTDOOR)) {
  if (!(id.startsWith('r_') || id.startsWith('ruta')) || m.theme === 'cueva' || m.dark || m.safari) continue;
  if (m.maze) { addRouteStory(m, id); continue; }
  guideMap(m, id, { width: id === 'r_rosario_sanjose' || id === 'r_ecilda_trinidad' ? 2 : 3 });
  flavorRoute(m, id);
  addRouteStory(m, id);
}

// Localities get the same treatment, more gently: the open fields around the streets close into tree walls.
for (const stop of STOPS) {
  if (stop.kind !== 'loc' || !OUTDOOR[stop.id]) continue;
  guideMap(OUTDOOR[stop.id], stop.id, { width: 4, town: true });
}

// Creatures made in the sprite editor join the wild lists of the maps they were given.
for (const c of CUSTOM.creatures) {
  for (const id of c.habitats ?? []) {
    const lst = OUTDOOR[id]?.enc?.list;
    if (!lst?.length) continue;
    const lo = Math.min(...lst.map((e) => e[1])), hi = Math.max(...lst.map((e) => e[2]));
    if (!lst.some((e) => e[0] === c.key)) lst.push([c.key, lo, hi, 8]);
  }
}

// Battle backdrops follow the land: caves, forests, wetlands and sierras get their own, coastal routes the beach.
{
  const BG_OF_FLAVOR = { coast: 'beach', wetland: 'wetland', sierra: 'sierra', farm: 'field', suburb: 'city' };
  for (const [id, m] of Object.entries(OUTDOOR)) {
    if (m.theme === 'cueva') m.bg = 'cave';
    else if (id === 'r_rosario_sanjose' || id === 'r_ecilda_trinidad') m.bg = 'forest';
    else if (ROUTE_FLAVOR[id]) m.bg = BG_OF_FLAVOR[ROUTE_FLAVOR[id]];
  }
}

// The things lying on the ground are varied: remedies, repellent and mates as well as balls and food, by stage of the route.
{
  const COMMON = new Set(['esfera', 'superesfera', 'ultraesfera', 'alfajor', 'alfajor_triple', 'pan_casero', 'torta_frita']);
  const POOLS = [
    ['ruda', 'aloe', 'linimento', 'repelente', 'te_marcela', 'mate', 'esfera', 'alfajor'],
    ['ruda', 'aloe', 'linimento', 'repelente', 'mate', 'mate_dulce', 'superesfera', 'alfajor_triple', 'repelente_super'],
    ['aloe', 'linimento', 'repelente_super', 'repelente_max', 'mate_dulce', 'dulce_de_leche', 'ultraesfera', 'alfajor_triple', 'pan_casero'],
  ];
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  for (const [id, m] of Object.entries(OUTDOOR)) {
    for (const it of m.items ?? []) {
      if (!COMMON.has(it.item) || String(it.id).endsWith('_fall')) continue;
      const hi = mapBand(id)?.[1] ?? 0;
      const pool = POOLS[hi <= 12 ? 0 : hi <= 36 ? 1 : 2];
      it.item = pool[hash(String(it.id)) % pool.length];
    }
  }
}

// What the player finds and can buy follows the story: mates and shops scale with how far along the route the place is.
const MATES = ['te_marcela', 'mate', 'mate_dulce', 'dulce_de_leche'];
const mateAt = (id) => {
  const hi = mapBand(id)?.[1];
  return hi === undefined ? null : MATES[hi <= 12 ? 0 : hi <= 30 ? 1 : hi <= 48 ? 2 : 3];
};
const capMate = (item, id) => {
  const k = MATES.indexOf(item), cap = mateAt(id);
  return k < 0 || cap === null ? item : MATES[Math.min(k, MATES.indexOf(cap))];
};
for (const [id, m] of Object.entries(OUTDOOR)) {
  for (const it of m.items ?? []) it.item = capMate(it.item, id);
  for (const n of m.npcs ?? []) {
    if (n.script === 'route_quest') n.reward = capMate(n.reward, id);
    if (n.script === 'route_fog') n.reward = mateAt(id) ?? 'mate';
  }
}

const SHOP_TIERS = [
  [4, ['esfera', 'te_marcela', 'ruda', 'repelente']],
  [9, ['esfera', 'te_marcela', 'ruda', 'aloe', 'repelente', 'alfajor']],
  [16, ['esfera', 'superesfera', 'te_marcela', 'mate', 'ruda', 'aloe', 'linimento', 'despertador', 'alfajor', 'repelente', 'refuerzo_ataque', 'refuerzo_defensa', 'repartir_exp']],
  [24, ['superesfera', 'mate', 'ruda', 'aloe', 'linimento', 'despertador', 'alfajor', 'repelente', 'repelente_super', 'refuerzo_ataque', 'refuerzo_defensa', 'refuerzo_especial', 'refuerzo_velocidad', 'repartir_exp', 'banda_fuerza', 'chapa_acero']],
  [30, ['superesfera', 'ultraesfera', 'mate', 'mate_dulce', 'aloe', 'despertador', 'alfajor', 'torta_frita', 'repelente_super', 'refuerzo_precision', 'refuerzo_resistencia', 'repartir_exp', 'bombilla_plata', 'poncho_lluvia', 'alpargatas']],
  [99, ['ultraesfera', 'mate_dulce', 'dulce_de_leche', 'aloe', 'despertador', 'torta_frita', 'chivito', 'repelente_max', 'concentracion', 'refuerzo_precision', 'repartir_exp', 'restos_asado', 'banda_fuerza', 'bombilla_plata']],
];
for (const stop of STOPS) {
  if (stop.kind !== 'city') continue;
  const i = STOP_INDEX[stop.id];
  const tier = (SHOP_TIERS as any[]).find(([lim]) => i < lim)[1];
  for (const d of OUTDOOR[stop.id]?.doors ?? []) {
    const to = typeof d === 'string' ? d : d.to;
    if (!/^shop_/.test(to) || !INTERIOR[to]) continue;
    for (const n of INTERIOR[to].npcs) {
      if ((n.script !== 'shop' && n.script !== 'shop_carta') || n.fixedStock) continue;
      const keep = (n.stock ?? []).filter((x) => /^(piedra_|mt_)/.test(x) && i >= 12);
      n.stock = [...tier, ...keep];
    }
  }
}

const MO_BLOCKS = [
  ['r_belen_artigas', 'corte'],
  ['ruta30', 'surf'],
  ['r_tupambae_melo', 'fuerza'],
  ['r_piriapolis_minas', 'destello'],
];
(function placeFieldMoveBlocks() {
  const solid = (c) => !!TILE_INFO[c]?.solid;
  for (const [id, kind] of MO_BLOCKS) {
    const m = OUTDOOR[id];
    if (kind === 'destello') { makeCave(m); continue; }
    const npcCols = new Set((m.npcs ?? []).flatMap((n) => [n.x - 1, n.x, n.x + 1]));
    const rows = m.tiles;
    const mid = Math.floor(rows[0].length / 2) + (kind === 'surf' ? 0 : 3);
    // First column near the middle with no NPC around it and a road tile to anchor on.
    let x = mid;
    for (let d = 0; d < 30; d++) {
      const c = [mid + d, mid - d].find((cx) => !npcCols.has(cx) && !npcCols.has(cx + 1) && !npcCols.has(cx + 2) && rows.filter((r) => r[cx] === '=').length === (kind === 'fuerza' ? 1 : rows.filter((r) => r[cx] === '=').length || -1));
      if (c !== undefined) { x = c; break; }
    }
    const set = (cx, y, ch) => { rows[y] = rows[y].slice(0, cx) + ch + rows[y].slice(cx + 1); };
    const gap = rows.findIndex((r) => r[x] === '=');
    for (let y = 0; y < rows.length; y++) {
      const ch = rows[y][x];
      if (solid(ch) && ch !== '%') continue;
      if (kind === 'corte') set(x, y, '%');
      else if (kind === 'surf') { set(x, y, '~'); set(x + 1, y, solid(rows[y][x + 1]) ? rows[y][x + 1] : '~'); }
      else if (y === gap) set(x, y, '\\');
      else set(x, y, 'q');
    }
    const blocked = [...(m.items ?? []), ...(m.npcs ?? [])].filter((o) => solid(rows[o.y][o.x]) || rows[o.y][o.x] === '~' || rows[o.y][o.x] === '%');
    if (blocked.length) fitToMap(rows, blocked, new Set([...(m.items ?? []), ...(m.npcs ?? [])].filter((o) => !blocked.includes(o)).map((o) => `${o.x},${o.y}`)));
    if (kind === 'fuerza') for (const cx of [x + 1, x + 2, x - 1, x - 2]) if (solid(rows[gap][cx])) set(cx, gap, '.');
  }
})();

// What the map editor sees as "the original" (before its own changes), then the editor's changes on top.
// Scenery over open grass on routes and in localities (before the editor baseline below, so it is not an "edit").
const LOCALITIES = new Set(STOPS.filter((st) => st.kind === 'loc').map((st) => st.id));
scatterDecor(MAPS, (id) => id.startsWith('r_') || id.startsWith('ruta') || LOCALITIES.has(id));

export const MAP_ORIGINALS = Object.fromEntries(Object.entries(MAPS).map(([id, m]) => {
  const keys = npcKeys(m.npcs);
  return [id, {
    tiles: [...m.tiles],
    npcs: (m.npcs ?? []).map((n, i) => ({ key: keys[i], x: n.x, y: n.y, look: n.look, dir: n.dir, text: n.text && !n.script && !n.trainer ? [].concat(n.text) : null, kind: n.trainer ? 'trainer' : n.script ? 'script' : n.critter ? 'critter' : n.blocker ? 'blocker' : 'npc', name: n.name ?? n.trainer?.name ?? null })),
    items: (m.items ?? []).map((it) => ({ id: it.id, x: it.x, y: it.y, item: it.item })),
  }];
}));
applyMapEdits(MAPS, MAP_OVERRIDES);
// Trinidad gym: its trainers do not walk up to you, they only act when you pass right beside them
for (const n of MAPS.gym_trinidad?.npcs ?? []) if (n.trainer && !n.leader) { n.sight = 1; n.adjacent = true; }

// Fray Bentos harbour: the Buquebus is moored at the end of the pier (the pier is drawn in the map editor, the ship is
// added here, after the editor's patches). A sailor stands at the end of the pier and does not let anyone board without
// the ticket; the hull tile in front of the pier is the gangway to the ship's main deck. When the ferry quest is done the
// ship and the pier extension vanish for good.
{
  const fb: any = OUTDOOR.fraybentos;
  const put = (x, y, c) => { fb.tiles[y] = fb.tiles[y].slice(0, x) + c + fb.tiles[y].slice(x + 1); };
  const flagTiles: any[] = [];
  const X0 = 1, Y0 = 26;
  for (let iy = 0; iy < SHIP_H; iy++) for (let ix = 0; ix < SHIP_W; ix++) { put(X0 + ix, Y0 + iy, shipChar(ix, iy)); flagTiles.push({ flag: 'ferry_done', x: X0 + ix, y: Y0 + iy, ch: '~' }); }
  for (const y of [25, 26]) { put(3, y, 'b'); flagTiles.push({ flag: 'ferry_done', x: 3, y, ch: '~' }); }
  // the ship hull's gangway tile sits just below the pier end, at (3, 27)
  fb.flagTiles = flagTiles;
  (fb.warps ??= []).push({ x: 3, y: 27, to: 'ferry_1', tx: 11, ty: 4 });
  // the road north (to Young) is overgrown: real thickets, opened with the Machete (after the editor's patches, which redraw the tiles)
  for (let x = 0; x < fb.tiles[0].length; x++) {
    if (fb.tiles[0][x] === '#') continue;
    for (const [tx, ty] of [[x, 0], [x - 1, 1], [x, 1], [x + 1, 1]]) if (fb.tiles[ty][tx] !== '#') put(tx, ty, '%');
  }
  addFrayBentosStory(fb);
  // On the ferry every trainer notices the player from far away: the rooms are big and they must not be dodged.
  for (const [id, m] of Object.entries(INTERIOR) as [string, any][]) if (id.startsWith('ferry')) for (const n of m.npcs ?? []) if (n.trainer && !n.adjacent) n.sight = Math.max(n.sight ?? 3, 14);
  addCityEvents(OUTDOOR);
  clearPierFolk(OUTDOOR.paysandu);
  (fb.npcs ??= []).push({ x: 3, y: 25, look: 'sailor', dir: 'down', blocker: true, name: 'Marinero del muelle', text: ['El Buquebus "China Zorrilla" zarpa pronto. Sin ticket no sube nadie.', 'Los pasajes los despachan en la empresa. Preguntá por el pueblo.'], cond: (f) => !f.got_ticket });
}

import { addSwimmers } from './swimmers.ts';
addSwimmers(MAPS, ['paysandu', 'fraybentos']);
import { addTolls } from './toll.ts';
addTolls(OUTDOOR);
import { addCheckpoints } from './checkpoints.ts';
addCheckpoints(OUTDOOR);
import { aimRouteTrainers } from './route-folk.ts';
aimRouteTrainers(OUTDOOR);

// A trainer's class decides how the person looks (a Ciclista is drawn as a cyclist, not as an old man), and the person
// shown in battle is the one met in the world: same look, whatever was written when the trainer was built.
const CLASS_LOOK: [RegExp, string[]][] = [
  [/ciclista/i, ['ciclista']], [/camionero/i, ['camionero']], [/cartero|telegrafista|ferroviari/i, ['cartero']],
  [/almacener|pulper/i, ['almacenero']], [/maitre|cociner/i, ['cocinero']], [/hincha|futbolista|finalista/i, ['hincha']],
  [/surfista|bañista|guardavidas|nadador/i, ['swimmer']], [/^pescador/i, ['pescador']], [/marinero|navegante|tripulante|remero/i, ['sailor']],
  [/estudiante|aprendiz|aspirante/i, ['estudiante']], [/bi[oó]log|naturalista|ornit[oó]log|entom[oó]log|espele|apicult|geólog|botánic/i, ['biologo']],
  [/obrero|estibador|minero|electricista|operario|herrero|ingenier/i, ['obrero']], [/turista|viajero|azafata|caminante|campista|montañista/i, ['turista']],
  [/maestra|docente|archivista/i, ['maestra']], [/cañera|sandiera|viñatera|alfarera|agrónoma|paisana|campesin/i, ['campesina']],
  [/viñatero|colono|tambero|tropero|arriero|ganadero|esquilador|domador/i, ['gaucho']],
];
for (const m of Object.values(MAPS) as any[]) {
  for (const n of m.npcs ?? []) {
    if (!n.trainer || !n.look || n.look === 'ball') continue;
    const cls: string = n.trainer.cls ?? '';
    if (!/PP|Líder|Comandante|Capataz PP/.test(cls)) {
      const rule = CLASS_LOOK.find(([re]) => re.test(cls));
      if (rule && !rule[1].includes(n.look)) n.look = rule[1][0];
    }
    n.trainer.look = n.look;
  }
}
