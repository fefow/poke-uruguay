// Story scripts. Each receives the script API (see game/script-api.js) and the
// NPC that triggered it. Text uses Rioplatense Spanish ("vos"), in a sober tone aimed at adults.
import { SPECIES } from './species.ts';
import { EVENT_SCRIPTS, riddleFor } from './events.ts';
import { FAVOR_SCRIPTS } from './favors.ts';
import { MS_SCRIPTS } from './mini-stories.ts';
import { STOPS, GYM_STOPS, STOP_INDEX, mapBand, openFlag, gymAce, badgeOf } from './route.ts';
import { teamOf } from './map-gen.ts';
import { bossTeam, rescaleTeam } from './levels.ts';

// The rival picks the creature the player's starter is strong against (like the modern games),
// so the first fights are winnable without grinding.
const COUNTER = { ceibito: 'carpinchito', tejuchispa: 'ceibito', carpinchito: 'tejuchispa' };
const LINE = {
  ceibito: ['ceibito', 'ceibal', 'ceibarbol'],
  tejuchispa: ['tejuchispa', 'tejubrasa', 'tejufogon'],
  carpinchito: ['carpinchito', 'carpincho', 'carpinchon'],
};

// Level range of each rival fight, by where on the route it happens (see RIVAL_AT in maps.js).
const RIVAL_MAPS = [null, 'fraybentos', 'ruta3', 'r_lascano_rocha', 'r_sarandi_durazno'];
const rivalLevels = (stage) => {
  if (stage === 0) return null;
  if (stage === 5) { const a = gymAce('montevideo'); return [a - 1, a + 1]; }
  const [, hi] = mapBand(RIVAL_MAPS[stage]);
  return [hi, hi + 2];
};

export function rivalTeamFor(playerStarter, stage) {
  const line = LINE[COUNTER[playerStarter]];
  const team = [
    [[line[0], 5]],
    [[line[0], 13], ['zorrigris', 12]],
    [['teruterazo', 17], ['zorrigris', 18], [line[1], 20]],
    // Lascano (before Rocha)
    [['hornerazo', 35], ['zorromonte', 36], ['yacaron', 36], ['coatimundi', 37], [line[2], 38]],
    // Sarandí Grande (before Durazno)
    [['zorromonte', 45], ['lobomarino', 45], ['venadalto', 46], ['yacaron', 46], ['coatimundi', 47], [line[2], 49]],
    // Estadio Centenario (before the Champion)
    [['carancho', 50], ['yacaron', 51], ['gliptodonte', 51], ['mantis', 52], ['venadalto', 52], [line[2], 54]],
  ][stage];
  return rivalLevels(stage) ? rescaleTeam(team, rivalLevels(stage)) : team;
}
const rivalTeam = (api, stage) => rivalTeamFor(api.starterKey(), stage);

const rival = (api, stage, prize, intro, lose, after) => ({
  id: `rival_${stage}`, name: '{rival}', cls: 'Rival', look: 'rival', team: rivalTeam(api, stage), prize, intro, lose, after, ai: stage >= 2 ? 'smart' : 'basic',
});

export const LEADERS = {
  // Each gym leader heads a state body or is a figure from the city's history, and their type matches it.
  inc: {
    order: 1, id: 'leader_inc', name: 'Elena', cls: 'Presidenta del Instituto de Colonización', look: 'leader_inc', ai: 'smart', items: ['mate'],
    team: teamOf(['tierra'], [8, 9, 10], 'inc'), prize: 500, badge: 'badge1', badgeName: 'Medalla Trinidad', reward: 'mate', rewardQty: 1, tm: 'mt_excavar',
    intro: ['Bienvenido a Trinidad. Soy Elena, presidenta del Instituto Nacional de Colonización.', 'Mi trabajo es repartir tierra a quienes la trabajan, y conozco cada terrón del país.', 'Veamos si tus criaturas aguantan el peso de la tierra.'],
    lose: 'Buena siembra. Se nota que trabajaste duro.',
    after: ['La Medalla Trinidad es tuya.', 'Seguí hacia Mercedes, sobre el río. Allá el Correo reparte noticias y desafíos.'],
  },
  correo: {
    order: 2, id: 'leader_correo', name: 'Marta', cls: 'Presidenta del Correo Uruguayo', look: 'leader_correo', ai: 'smart', items: ['mate'],
    team: teamOf(['normal'], [10, 11, 12], 'correo'), prize: 800, badge: 'badge2', badgeName: 'Medalla Mercedes', reward: 'superesfera', rewardQty: 2, tm: 'mt_derribo',
    intro: ['Soy Marta, presidenta del Correo Uruguayo.', 'Llevamos cartas y paquetes a todos los rincones del país, con sol, lluvia o niebla.', 'Mis criaturas son simples y confiables. Eso, en un combate, vale mucho.'],
    lose: 'Entrega completada. Buen combate.',
    after: ['La Medalla Mercedes es tuya.', 'Seguí hacia Fray Bentos. Dicen que el viejo Anglo volvió a prender las luces.'],
  },
  boiso: {
    order: 9, id: 'leader_boiso', name: 'Juan M. Boiso Lanza', cls: 'Pionero de la aviación', look: 'leader_boiso', ai: 'smart', items: ['mate_dulce'],
    team: teamOf(['volador'], [30, 32, 34, 36, 38], 'boiso'), prize: 4400, badge: 'badge9', badgeName: 'Medalla Florida', reward: 'mate_dulce', rewardQty: 2, tm: 'mt_pico_taladro',
    intro: ['Soy Juan Manuel Boiso Lanza. En mil novecientos once fui el primer uruguayo en cruzar el Río de la Plata en un biplano.', 'Florida tiene el mejor viento de la llanura. Acá se aprende a volar.', 'Veamos si podés seguirme el ritmo.'],
    lose: 'Aterrizaje forzoso. Me ganaste en el aire.',
    after: ['La Medalla Florida es tuya.', 'Con ella, el Silbato del Hornero te obedece: ya podés volar a cualquier ciudad que hayas visitado.', 'Seguí hacia Durazno. Se pone caluroso.'],
  },
  inavi: {
    order: 11, id: 'leader_inavi', name: 'Tomás', cls: 'Presidente del INAVI', look: 'leader_inavi', ai: 'smart', items: ['mate_dulce'],
    team: teamOf(['bicho'], [38, 40, 42, 44, 46], 'inavi'), prize: 6800, badge: 'badge11', badgeName: 'Medalla Canelones', reward: 'mate_dulce', rewardQty: 3, tm: 'mt_zumbido',
    intro: ['Soy Tomás, presidente del Instituto Nacional de Vitivinicultura.', 'Canelones es tierra de viñedos, y un viñedo sin insectos no existe.', 'Que empiece la vendimia.'],
    lose: 'Cosecha perdida… pero qué buena cosecha de combate.',
    after: ['La Medalla Canelones es tuya.', 'Falta una sola medalla: Montevideo, el Palacio de la Luz.', 'Y después, Dr. Díaz. Tené cuidado.'],
  },
  ute: {
    order: 8, id: 'leader_ute', name: 'Sofía', cls: 'Presidenta de UTE', look: 'leader_ute', ai: 'smart', items: ['mate'],
    team: [['luciernito', 7], ['nimbo', 7], ['cotorrayo', 9]], prize: 1400, badge: 'badge8', badgeName: 'Medalla Montevideo', reward: 'mate', rewardQty: 1, tm: 'mt_descarga',
    intro: ['Soy Sofía, presidenta de UTE, la empresa estatal que lleva la luz a todo el país.', 'Este es el Palacio de la Luz: desde acá se dirige la energía de Montevideo.', 'Veamos si resistís la corriente.'],
    lose: 'Se cortó el circuito. Fue un buen combate.',
    after: ['La Medalla Montevideo es tuya. Son doce: la Liga está abierta.', 'Pero antes del Estadio Centenario, Dr. Díaz te espera en el puerto. Es el fundador del Equipo PP.'],
  },
  ose: {
    order: 6, id: 'leader_ose', name: 'Lucía', cls: 'Presidenta de OSE', look: 'leader_ose', ai: 'smart', items: ['mate'],
    team: [['lobito', 15], ['mbigua', 16], ['carpincho', 18]], prize: 2200, badge: 'badge6', badgeName: 'Medalla Maldonado', reward: 'superesfera', rewardQty: 2, tm: 'mt_cascada',
    intro: ['Bienvenido a Punta del Este. Soy Lucía, presidenta de OSE.', 'Obras Sanitarias del Estado lleva el agua potable a cada casa del país, y la cuida como un tesoro.', 'Veamos si resistís la corriente.'],
    lose: 'Me superaste. Fue una derrota limpia.',
    after: ['La Medalla Maldonado es tuya.', 'Siguiendo hacia el interior, en Minas, una fábrica abandonada volvió a funcionar.', 'Garúa está detrás. Llevá el machete: hay zarzales.'],
  },
  lavalleja: {
    order: 5, id: 'leader_lavalleja', name: 'Juan A. Lavalleja', cls: 'Héroe de los Treinta y Tres', look: 'leader_lavalleja', ai: 'smart', items: ['mate_dulce'],
    team: [['mulitin', 27], ['hornerazo', 28], ['tortugal', 28], ['mulitron', 30]], prize: 3200, badge: 'badge5', badgeName: 'Medalla Treinta y Tres', reward: 'ultraesfera', rewardQty: 5, tm: 'mt_avalancha',
    intro: ['Soy Juan Antonio Lavalleja. Con treinta y dos compañeros desembarqué en la Agraciada para liberar la Provincia Oriental.', 'Esta ciudad lleva el nombre de aquel grupo: los Treinta y Tres Orientales.', 'La piedra de estas sierras lo resiste todo. Veamos si vos también.'],
    lose: 'Hacía mucho que nadie me ganaba.',
    after: ['La Medalla Treinta y Tres es tuya.', 'El jefe del Equipo PP subió a la Quebrada de los Cuervos, el valle al este de la ciudad. Quiere capturar al Cardenal Azul.', 'Tenés que detenerlo.'],
  },
  ancap: {
    order: 7, id: 'leader_ancap', name: 'Candelaria', cls: 'Presidenta de ANCAP', look: 'leader_ancap', ai: 'smart', items: ['mate_dulce'],
    team: [['corcel', 34], ['fatuo', 35], ['escorpio', 36], ['crinfuego', 37], ['luzmala', 39]], prize: 4200, badge: 'badge7', badgeName: 'Medalla Durazno', reward: 'ultraesfera', rewardQty: 5, need: ['refineria_clear', ['Ahora no puedo combatir. El Equipo PP tomó el depósito de la refinería, acá en Durazno.', 'Si ese combustible sale para Montevideo, la niebla va a tapar la capital. Sacalos y te espero.']], tm: 'mt_fogon',
    intro: ['Bienvenido a Durazno. Soy Candelaria, presidenta de ANCAP.', 'Mi organismo refina los combustibles del país: el fuego es mi oficio.', 'Veamos si tus criaturas aguantan el calor.'],
    lose: 'Se apagó la llama. Buen combate.',
    after: ['La Medalla Durazno es tuya.', 'Falta poco: Canelones y, después, Montevideo.', 'Dicen que el fundador del Equipo PP espera en la capital.'],
  },
  mgap: {
    order: 4, id: 'leader_mgap', name: 'Ramón', cls: 'Ministro de Ganadería', look: 'leader_mgap', ai: 'smart', items: ['mate_dulce'],
    team: [['butiazal', 35], ['cortadora', 35], ['cardal', 36], ['curupi', 37], ['talamonte', 38]], prize: 4800, badge: 'badge4', badgeName: 'Medalla Tacuarembó', reward: 'pan_casero', rewardQty: 2, tm: 'mt_megaagotar',
    intro: ['Buenas, entrenador. Soy Ramón, ministro de Ganadería, Agricultura y Pesca.', 'Mi trabajo es cuidar el campo y el monte, que sostienen al país.', 'La naturaleza no se rinde fácil. Veamos si vos tampoco.'],
    lose: 'El monte te eligió. Es tuyo el triunfo.',
    after: ['La Medalla Tacuarembó es tuya.', 'Hacia el este el camino sigue a Melo y a la Quebrada de los Cuervos.', 'Allá arriba se juntan los jefes del Equipo PP. Tené cuidado.'],
  },
  defensa: {
    order: 3, id: 'leader_defensa', name: 'Mariela', cls: 'Ministra de Defensa', look: 'leader_defensa', ai: 'smart', items: ['mate_dulce'],
    team: [['capataz', 42], ['grison', 42], ['coatimundi', 43], ['toro', 44], ['capitan', 45]], prize: 5200, badge: 'badge3', badgeName: 'Medalla Rivera', reward: 'alfajor_triple', rewardQty: 3, tm: 'mt_garra_charrua',
    intro: ['Soy Mariela, ministra de Defensa Nacional.', 'Cuido la frontera y entreno acá, en Rivera, con disciplina de cuartel.', 'Mostrame qué sabés hacer.'],
    lose: 'Ganaste con respeto. Eso vale mucho.',
    after: ['La Medalla Rivera es tuya.', 'La niebla de la Torre sigue ahí, al norte de la plaza. Si querés apagarla, adelante.', 'Seguí hacia Tacuarembó: el ministro de Ganadería te espera.'],
  },
  quiroga: {
    order: 2, id: 'leader_quiroga', name: 'Horacio Quiroga', cls: 'Escritor', look: 'leader_quiroga', ai: 'smart', items: ['dulce_de_leche'],
    team: [['tonina', 44], ['venadalto', 45], ['mantis', 46], ['anta', 46], ['luzmala', 47], ['amatista', 48]], prize: 5800, badge: 'badge2', badgeName: 'Medalla Salto', reward: 'pan_casero', rewardQty: 3, tm: 'mt_premonicion',
    intro: ['Te esperaba, {player}. Escribí tu llegada antes de que llegaras.', 'Soy Horacio Quiroga. Nací en Salto y le debo a esta ciudad mis cuentos más oscuros.', 'Veamos si tu camino coincide con lo que escribí.'],
    lose: 'El final no era ese. Qué honor.',
    after: ['La Medalla Salto es tuya.', 'La Represa sigue bajo control de los de gris, bajo el puente.', 'Seguí hacia Artigas y Rivera. El camino se pone más duro.'],
  },
  anglo: {
    order: 1, id: 'leader_anglo', name: 'Zoraida', cls: 'Directora del Museo del Anglo', look: 'leader_dark', ai: 'smart', items: ['dulce_de_leche', 'dulce_de_leche'],
    team: [['yarara', 47], ['zorromonte', 48], ['vespertino', 48], ['zarigueya', 48], ['buho', 49], ['yacaron', 50]], prize: 6500, badge: 'badge1', badgeName: 'Medalla Fray Bentos', reward: 'alfajor_triple', rewardQty: 5, tm: 'mt_sombra_nocturna',
    intro: ['Bienvenido al Museo del Anglo, {player}. Cada caja de despacho de estas salas fue una máquina de otra época.', 'Soy Zoraida. Cuido el museo de noche, entre las sombras y los mecanismos.', 'Llegaste hasta acá usando las cajas. Ahora demostrá que sabés pelear como sabés moverte.'],
    lose: 'Salí de la sombra gracias a vos. Y llegaste mejor de lo que pensé.',
    after: ['La Medalla Fray Bentos es tuya. Es la tercera de doce.', 'El Equipo PP usa el viejo frigorífico como depósito. Hay gente que trabaja ahí adentro sin querer.', 'Del puerto sale un barco que lleva el nombre de una gran actriz. Quien lo sube puede conseguir una herramienta que abre el monte.'],
  },
};

/** Team of a story boss, rescaled to the level curve of the city where they are met. */
const bossAt = (stopId, team, plus = 0) => rescaleTeam(team, [gymAce(stopId) - 3 + plus, gymAce(stopId) + plus]);

// Gym n is the n-th gym of the route: its team size, ace level, prize and reward all follow that position.
const GYM_SIZE = [2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6];
const GYM_PRIZE = [500, 800, 1200, 1800, 2400, 3000, 3600, 4400, 5200, 6000, 6800, 7500];
const GYM_REWARD = [['mate', 1], ['superesfera', 2], ['mate', 2], ['superesfera', 2], ['mate_dulce', 1], ['superesfera', 3], ['ultraesfera', 2], ['mate_dulce', 2], ['ultraesfera', 3], ['ultraesfera', 4], ['mate_dulce', 3], ['pan_casero', 3]];
for (const [key, L] of Object.entries(LEADERS)) {
  const idx = GYM_STOPS.findIndex((st) => st.gym === key);
  const stop = GYM_STOPS[idx];
  const ace = gymAce(stop.id);
  const types = [...new Set([L.team[0], L.team[L.team.length - 1]].flatMap(([sp]) => SPECIES[sp].types))];
  L.order = idx + 1;
  L.badge = badgeOf(stop.id);
  L.team = bossTeam(L.team, GYM_SIZE[idx], ace, types, `gym_${key}`);
  L.prize = GYM_PRIZE[idx];
  [L.reward, L.rewardQty] = GYM_REWARD[idx] as [any, any];
}

// Each leader also gives something against the PP: a clue, a favour or a closed door. Text only, no items.
const CONTRIB = {
  inc: 'Mirá este mapa de tierras: donde hay niebla espesa, las chacras se están secando. Ahí van a estar sus torres.',
  correo: 'Tengo cartas de todo el litoral que hablan de una niebla comprada. Que el Correo avise: la próxima torre está cerca del frigorífico.',
  anglo: 'Conozco los depósitos del Anglo de memoria. Las máquinas están en el último piso: subí.',
  quiroga: 'Escribí un cuento sobre una niebla que se vende. El final marca una represa. Mirá debajo del puente.',
  defensa: 'Cerré la frontera para sus camiones. Hasta que apagues la Torre, no pasan más.',
  mgap: 'La niebla ya le mata terneros al ganado de la zona. Esto es una cuestión de campo, no de ciencia.',
  lavalleja: 'Treinta y tres hombres cruzaron un río sin saber si volvían. A vos no te va a frenar una niebla.',
  ose: 'Corté el agua de la bomba que alimenta una de sus máquinas. No va a durar mucho, apurate.',
  ancap: 'Les cerré el combustible. La fábrica de Minas va a funcionar a media máquina.',
  boiso: 'Volé sobre la niebla. Se junta en un nudo, entre sierras. Ahí está el corazón.',
  inavi: 'Los productores de la zona van a declarar ante la intendencia si hace falta. Que se sepa el precio de esta niebla.',
  ute: 'Corté la red que alimenta la última torre. Dr. Díaz está solo en el puerto.',
};
for (const [key, line] of Object.entries(CONTRIB)) LEADERS[key].after.push(line);

export const CHAMPION = (rematch) => ({
  id: rematch ? 'champion_rematch' : 'champion', name: 'Obdulio', cls: 'Campeón', look: 'champion', ai: 'smart', items: ['dulce_de_leche', 'dulce_de_leche', 'chivito'],
  team: rescaleTeam([['capitan', 57], ['crinfuego', 57], ['albatros', 58], ['tucoterra', 58], ['yacaron', 58], ['aguaraflama', 60]], [gymAce('montevideo') + 5, gymAce('montevideo') + 8]).map(([sp, l]) => [sp, Math.min(95, l + (rematch ? 14 : 0))]),
  prize: rematch ? 24000 : 12000,
  intro: rematch
    ? ['Volviste, {player}. El Centenario siempre está abierto para una revancha.', 'Esta vez no me reservo nada.']
    : ['Así que vos sos {player}.', 'Soy Obdulio, Campeón de la Liga Oriental.', 'En este estadio se ganó el primer Mundial. Acá se juega con garra.', 'Que empiece el partido.'],
  lose: rematch ? 'Un gran partido.' : 'Ganaste. Limpio y con garra.',
  after: ['Sos un verdadero campeón.'],
});

// Alto Mando: four members fought in a row before the Champion.
export const ELITES = [
  { name: 'Estela', cls: 'Alto Mando', look: 'elite1', items: ['dulce_de_leche'], team: [['albatros', 53], ['monarca', 53], ['garzon', 53], ['carancho', 53], ['buho', 55]], prize: 7000,
    intro: ['Soy Estela, del Alto Mando. Mi territorio es el aire.', 'Pocos llegan hasta acá. Veamos qué tan alto volás.'], lose: 'Volaste más alto que yo.', after: ['Seguí. La próxima sala es de tierra firme.'] },
  { name: 'Teófilo', cls: 'Alto Mando', look: 'elite2', items: ['dulce_de_leche'], team: [['penasco', 58], ['gliptodonte', 58], ['tamandua', 59], ['tucoterra', 59], ['escuerzo', 61]], prize: 7500,
    intro: ['Teófilo, del Alto Mando. Piedra y tierra: lo que no se mueve.', 'Para pasar tenés que quebrarme.'], lose: 'Me quebraste. Bien hecho.', after: ['Adelante. La que sigue no juega limpio.'] },
  { name: 'Dolores', cls: 'Alto Mando', look: 'elite3', items: ['dulce_de_leche'], team: [['viudanegra', 59], ['escolopendra', 59], ['mantis', 60], ['zarigueya', 60], ['camoati', 61]], prize: 8000,
    intro: ['Dolores, del Alto Mando. Veneno y alas de insecto.', 'Cuidá tu equipo: con un solo roce alcanza.'], lose: 'Inmune a mi veneno. Increíble.', after: ['Pasá. El último de nosotros te espera.'] },
  { name: 'Federico', cls: 'Alto Mando', look: 'elite4', items: ['dulce_de_leche', 'chivito'], team: [['capitan', 55], ['toro', 55], ['venadalto', 56], ['coatimundi', 56], ['lobomarino', 56]], prize: 9000,
    intro: ['Federico. Último del Alto Mando antes del Campeón.', 'Fuerza, garra y sin trampa. Que empiece el partido.'], lose: 'Entraste a la historia. Andá por el Campeón.', after: ['La cancha está lista. El Campeón y tu rival te esperan.'] },
];

/**
 * Side missions: a building taken over by the Equipo PP. The recruits inside vanish once beaten, then the
 * boss appears; freeing the building gives a TM. Rooms are built in maps-act2.js (eventRoom).
 */
/**
 * Why the road out of each city without a gym is closed, and what opens it. need: a flag the story must set first.
 * foe: a PP recruit to beat on the spot. The person who blocks the road leaves once it opens (see maps-route.js).
 */
const GATE_STORY = {
  colonia: {
    name: 'Vecina', need: 'dex',
    waiting: ['El Maestro Tabárez me pidió que no te dejara seguir sin la PokeDex.', 'Llevale la carta del almacén y volvé.'],
    intro: ['¡Ya tenés la PokeDex! El Maestro va a estar orgulloso.'],
    thanks: ['El camino a Rosario es tuyo. Por la Ruta 1 hay mucho entrenador con ganas de pelear.'],
    open: ['Buen viaje. Saludos al Maestro cuando vuelvas.'],
  },
  sanjose: {
    name: 'Empleado de la intendencia',
    intro: ['Uno del Equipo PP se está llevando el alambre de la intendencia. Dice que es para unas torres en el litoral.', 'Yo solo no puedo. ¿Me das una mano?'],
    foe: { types: ['veneno', 'siniestro'], intro: ['¿Y vos quién sos? Este alambre ya está pago. Correte.'], lose: 'Pará, pará. Me rindo.', after: ['Bueno, me voy. Igual las torres se van a levantar, con o sin alambre de San José.'] },
    thanks: ['Gracias. Se fue hacia el norte, por la ruta a Trinidad. Ojo con esa gente.', 'El camino a Ecilda Paullier queda abierto.'],
    open: ['Desde que se fue ese tipo, no falta más alambre.'],
  },
  artigas: {
    name: 'Minero de la cooperativa',
    intro: ['Un tipo de capa gris se metió en la cantera y se lleva las geodas en bolsas.', 'Dice que las piedras sirven para cargar las máquinas de niebla. Está acá nomás, en la salida.'],
    foe: { types: ['roca', 'siniestro'], intro: ['Estas geodas son del Proyecto Pampero ahora. Andá a buscar las tuyas.'], lose: 'Las piedras pesan demasiado.', after: ['Me llevo lo que pude. El jefe va a estar furioso.'] },
    thanks: ['¡Se fue sin las bolsas! La cooperativa te debe una.', 'El camino a Tranqueras queda abierto. Si ves más de esos, avisá.'],
    open: ['Las geodas vuelven a la cooperativa. Gracias otra vez.'],
  },
  melo: {
    name: 'Vecino', need: 'anima_clear',
    waiting: ['Desde que se apagaron las luces de la Torre de las Ánimas, nadie se anima a salir hacia Treinta y Tres.', 'Dicen que en la torre hay una máquina rara, y que las Luces Malas no dejan pasar a nadie.', 'Si alguien la apagara…'],
    intro: ['¡Volvieron las luces de la torre! Vi desde acá cómo se apagaban las Luces Malas.'],
    thanks: ['Ya se puede salir hacia Arbolito. Gracias, {player}.'],
    open: ['Esta noche la torre está tranquila.'],
  },
  rocha: {
    name: 'Guardaparque',
    intro: ['La Laguna de Rocha amaneció tapada de niebla. No es de acá: huele a máquina.', 'Hay uno del Equipo PP vigilando el camino a la costa. Si lo sacás, puedo abrir el paso.'],
    foe: { types: ['agua', 'siniestro'], intro: ['La laguna es nuestra hasta que termine la prueba. Nadie pasa.'], lose: 'La niebla no me salvó.', after: ['Ya está. Apago el aparato. Pero esto no termina acá: la jefa está en la costa.'] },
    thanks: ['La niebla se levanta sobre la laguna. Ya se ven los flamencos.', 'El camino a La Paloma queda abierto.'],
    open: ['La laguna está despejada. Se ven los cisnes de cuello negro.'],
  },
};

export const EVENTS = {
  refineria: {
    flag: 'refineria_clear', name: 'Capataz Ferreira', mt: 'mt_descarga', held: 'banda_fuerza', prize: 3800,
    team: [['yarara', 49], ['pavesa', 49], ['caudillo', 50], ['temblador', 51]],
    intro: ['De este depósito sale el combustible de la niebla. Cada tanque que cargamos tapa un departamento entero.', 'El Dr. Díaz necesita una última carga para Montevideo. No vas a ser vos quien la frene.'],
    lose: 'Se me fue la presión.',
    after: ['Está bien. Cierro las válvulas. Sin este combustible, la niebla de Montevideo no va a durar.', 'Pero el Dr. Díaz ya está en el Centenario.'],
    thanks: ['El depósito vuelve a ser de ANCAP. Gracias, {player}.', 'Candelaria te espera en el gimnasio. Y llevate esta MT, la usamos para las chispas de los motores.'],
  },
  parrilla: {
    flag: 'parrilla_clear', name: 'Capataz Rondeau', mt: 'mt_parrillada', held: 'chapa_acero', prize: 2800,
    team: [['yarara', 40], ['cuervon', 40], ['pombero', 41], ['zorromonte', 42]],
    intro: ['Esta parrilla es ahora cuartel del Equipo PP. Sin asado, la gente no se junta; y sin gente, nadie nos molesta.', 'No te voy a dejar arruinar el plan.'],
    lose: 'Me quedé sin brasas.',
    after: ['Está bien. Nos vamos. Que sigan con su asado.'],
    thanks: ['La parrilla de la Patria Gaucha vuelve a abrir. Gracias, {player}.', 'Tomá esta MT: es la receta de mi abuelo, el fuego justo para cada corte.'],
  },
  aduana: {
    flag: 'aduana_clear', name: 'Inspector Bianchi', mt: 'mt_punio_gaucho', held: 'alpargatas', prize: 3000,
    team: [['yarara', 44], ['vespertino', 44], ['pombero', 45], ['caudillo', 46]],
    intro: ['La aduana ahora es del Equipo PP. Todo lo que cruza la frontera pasa por nosotros.', 'Documentos, por favor. Y un combate.'],
    lose: 'Sin sello no se pasa… y yo perdí el mío.',
    after: ['Está bien, nos vamos. Que la aduana vuelva a ser pública.'],
    thanks: ['La aduana de Rivera vuelve a funcionar. Gracias, {player}.', 'Tomá esta MT. La usan los pesadores de la frontera: puro puño y poco papel.'],
  },
  radio: {
    flag: 'radio_clear', name: 'Locutora Cáceres', mt: 'mt_psiquico', held: 'bombilla_plata', prize: 3300,
    team: [['vespertino', 46], ['pombero', 46], ['caudillo', 47], ['temblador', 48]],
    intro: ['Esta radio ahora transmite lo que el Equipo PP quiere que se oiga. Nada de pronósticos reales.', 'Salí al aire sin permiso, y no pienso callarme.'],
    lose: 'Se cortó la transmisión…',
    after: ['Está bien, me voy. Que vuelva la programación de siempre.'],
    thanks: ['La radio de Salto vuelve al aire. Gracias, {player}.', 'Tomá esta MT: con ella las ondas viajan directo a la mente de cualquiera.'],
  },
  muelle: {
    flag: 'muelle_clear', opens: 'open_paysandu', name: 'Contramaestre Vidal', mt: 'mt_bomba_lodo', held: 'poncho_lluvia', prize: 3600,
    team: [['cururu', 47], ['dorado', 48], ['patriarca', 49], ['temblador', 50]],
    intro: ['El muelle del puerto es nuestro. Por acá entra el material de las torres de niebla.', 'Quien quiera pasar, va a tener que hundirse primero.'],
    lose: 'Me hundí yo solo…',
    after: ['Está bien. Levanto el campamento. Que el muelle sea de todos otra vez.'],
    thanks: ['El muelle de Paysandú vuelve a trabajar. Gracias, {player}.', 'Tomá esta MT: la mejor arma contra el barro del río.'],
  },
};

/** A town that lives off the fog asks the player to leave the machine on. The answer only colours the ending. */
async function fogChoice(api, flag, who, lines) {
  await api.say(lines, { name: who });
  api.setFlag(flag);
  await api.say(['La máquina se apagó. Cuesta aceptarlo, pero no hay vuelta atrás.', 'Con el tiempo nos vamos a acostumbrar. Gracias por frenarlos, {player}.'], { name: who });
}

export const SCRIPTS = {
  async mom(api) {
    if (!api.flag('has_starter')) {
      await api.say(['{player}, por fin te levantaste.', 'El Maestro Tabárez te espera en su laboratorio.', 'Es el edificio de techo violeta. Hoy empieza tu viaje.'], { name: 'Madre' });
      return;
    }
    await api.say(['Sentate y descansá un rato.', 'Te cebo unos mates.'], { name: 'Madre' });
    await api.healParty();
    await api.say('Listo. Tus criaturas están recuperadas. Cuidate.', { name: 'Madre' });
  },

  async rival_sister(api) {
    if (!api.flag('got_map_gift')) {
      await api.say(['Hola, {player}. {rival} ya salió para el laboratorio.', 'Siempre quiere ser el primero en todo.', 'Tomá, llevate esto para el viaje.'], { name: 'Hermana' });
      await api.give('te_marcela', 1);
      api.setFlag('got_map_gift');
    } else {
      await api.say(['Mucha suerte en el viaje. Si ves a {rival}, decile que llame a casa.'], { name: 'Hermana' });
    }
  },

  async prof(api) {
    if (!api.flag('has_starter')) {
      if (!api.flag('met_prof')) {
        api.setFlag('met_prof');
        await api.say([
          'Llegaste, {player}.',
          'Soy el Maestro Tabárez. Durante años dirigí a la selección; hoy estudio a las criaturas del Uruguay.',
          'Viven en los montes, las playas, las sierras y hasta en la Rambla.',
          'Hoy vas a elegir a tu primer compañero.',
          'En la mesa hay tres Pokeballs. Elegí con calma: esa criatura te va a acompañar mucho tiempo.',
          '{rival} es mi sobrino. Creció entre apuntes y Pokeballs, así que no te la va a hacer fácil.',
          'Hace años estudié el clima del Río de la Plata junto a un colega, Dr. Díaz. Hoy no sé dónde anda, pero el Cardenal Azul sigue siendo un misterio.',
        ], { name: 'Maestro Tabárez' });
        await api.say('¿Y yo? Llegué primero.', { name: '{rival}' });
        await api.say('Paciencia, {rival}. Vos elegís después.', { name: 'Maestro Tabárez' });
      } else {
        await api.say('Elegí una de las Pokeballs de la mesa.', { name: 'Maestro Tabárez' });
      }
      return;
    }
    if (!api.flag('dex')) {
      if (api.hasItem('carta_tabarez')) {
        api.takeItem('carta_tabarez');
        await api.say(['¡La carta! Gracias, {player}.', 'Es de un viejo colega. Dice que el Cardenal Azul se vio por el litoral.'], { name: 'Maestro Tabárez' });
        await api.say(['Como prometí: la PokeDex. Registra cada criatura que veas o captures.', 'Y unas Pokeballs para capturar criaturas salvajes.'], { name: 'Maestro Tabárez' });
        await api.give('uru_dex', 1);
        await api.give('esfera', 5);
        api.setFlag('dex');
        api.setFlag(openFlag('colonia')); // the neighbour who held the Ruta 1 gate steps aside
      } else {
        await api.say(['Te pedí una carta del almacén de Colonia del Sacramento, siguiendo la Ruta 21.', 'Cuando la tengas, traémela y te doy la PokeDex.'], { name: 'Maestro Tabárez' });
      }
      return;
    }
    const seen = api.state.dex.seen.length;
    const caught = api.state.dex.caught.length;
    await api.say([`Veamos tu PokeDex. Viste ${seen} y capturaste ${caught} especies.`,
      caught >= 120 ? 'Un registro casi completo. Es un trabajo notable.' : caught >= 60 ? 'Buen avance. Seguí recorriendo el país.' : 'Todavía quedan muchas especies por registrar. Seguí explorando.'], { name: 'Maestro Tabárez' });
  },

  async starter(api, npc) {
    if (!api.flag('met_prof')) {
      await api.say('Antes de elegir, tenés que hablar con el Maestro Tabárez.');
      return;
    }
    const key = npc.species;
    const sp = SPECIES[key];
    await api.showCreature(key);
    const ok = await api.ask(`¿Elegís a ${sp.name}, de tipo ${api.typeNames(key)}?`);
    api.hideCreature();
    if (!ok) return;
    api.setFlag('has_starter');
    api.setFlag(`starter_${key}`);
    api.setFlag('starter_key');
    api.giveCreature(key, 5, { silent: true });
    api.npcHide(key); // the Pokeball leaves the table
    api.sfx('catch');
    await api.say(`¡{player} recibió a ${sp.name}!`);
    const rk = COUNTER[key];
    await api.say(`Entonces yo me quedo con ${SPECIES[rk].name}.`, { name: '{rival}' });
    // {rival} walks to the table, takes the Pokeball he chose and only then turns to challenge the player
    await api.npcWalkNextTo('rival_lab', rk);
    await api.wait(250);
    api.npcHide(rk);
    api.sfx('catch');
    await api.wait(600);
    api.npcFacePlayer('rival_lab');
    await api.wait(300);
    await api.say(['Tiene desventaja contra el tuyo, pero no pienso ponértelo fácil.', '{player}, probemos a nuestras criaturas.', 'Combatamos.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 0, 100, null, 'Elegí mal.', null), { canLose: true });
    api.setFlag('rival1');
    if (res === 'lose') await api.say(['Gané. Sigo siendo mejor.', 'Igual, tu criatura tiene potencial.'], { name: '{rival}' });
    else await api.say(['Fue suerte.', 'Voy a entrenar hasta superarte.'], { name: '{rival}' });
    await api.npcExit('rival_lab'); // walks to the door and leaves
    api.healParty({ silent: true });
    await api.say(['Buen combate. Ya atendí a sus criaturas.',
      'Ahora, {player}: el país es grande. Hay doce Gimnasios, y el camino empieza acá, en Carmelo, y termina en Montevideo.',
      'Si conseguís las doce medallas, podés desafiar a la Liga en el Estadio Centenario.',
      'Y tené cuidado con el Equipo PP. Últimamente aparece una niebla extraña en el litoral.',
      'Tu madre puede curar a tus criaturas en casa.',
      'Antes de irte, {player}, te pido un favor. En el almacén de Colonia del Sacramento me guardan una carta.',
      'Seguí por la Ruta 21, entrenando en los pastizales y contra quien te desafíe. No vuelvas hasta tenerla.',
      'Traémela y te entrego la PokeDex y unas Pokeballs. Buen viaje.'], { name: 'Maestro Tabárez' });
    api.setFlag('dex_quest');
  },

  async gift_te_marcela(api) {
    if (api.flag('gift_r1')) return api.say('Que tengas buen viaje. Y tomá mate, que ayuda.', { name: 'Abuelo' });
    await api.say(['Un entrenador joven. Tomá, para el camino.'], { name: 'Abuelo' });
    await api.give('esfera', 1);
    api.setFlag('gift_r1');
  },

  async gift_mapa(api) {
    if (api.flag('got_mapa')) return api.say(['El Mapa de Uruguay te muestra dónde estás y qué lugares ya visitaste.', 'Abrilo desde el menú o con la tecla T.'], { name: 'Guía de turismo' });
    await api.say(['Bienvenido a Colonia del Sacramento. Trabajo en la oficina de turismo del puerto.', 'Tomá, un mapa del país. Te marca las ciudades y las localidades.'], { name: 'Guía de turismo' });
    await api.give('mapa_uruguay', 1);
    api.setFlag('got_mapa');
    await api.say('Entre ciudad y ciudad hay localidades sin gimnasio, pero con almacenes y gente con cosas útiles.', { name: 'Guía de turismo' });
  },

  async gift_ros(api) {
    await api.say(['Pesqué en estos arroyos toda la vida.', 'Somos tres hermanos pescadores: uno pesca en el muelle de Paysandú, otro vive en Minas y el menor tiene casa en Paysandú.', 'Cada uno te da una caña mejor, pero hay que ganársela con medallas.'], { name: 'Pescador retirado' });
  },

  // Three rods: Vieja (muelle de Paysandú), Buena (Minas), Súper (casa en Paysandú).
  async gift_cana(api) {
    if (api.flag('got_cana')) return api.say('Parate frente al agua y apretá A. Con esta caña solo pican las criaturas más comunes. Mi hermano en Minas tiene una mejor.', { name: 'Pescador del muelle' });
    await api.say(['¿Qué hacés, guri, todo tranquilo? ¿Te gusta la pesca?', '¿Por qué no te agarrás una de esas cañas viejas que tengo ahí de sobra?'], { name: 'Pescador del muelle' });
    await api.give('cana_pescar', 1);
    api.setFlag('got_cana');
    await api.say('Parate frente al agua y apretá el botón A. Con esta caña solo pican las criaturas más comunes. Más adelante, mi hermano de Minas te dará una mejor.', { name: 'Pescador del muelle' });
  },

  async gift_cana2(api) {
    if (api.flag('got_cana2')) return api.say('Con la Caña Buena pican criaturas más grandes. La Súper Caña la tiene mi hermano menor, en Paysandú.', { name: 'Pescador' });
    if (!api.flag('got_cana')) return api.say('En el muelle de Paysandú hay un pescador que regala una caña para empezar. Pasá primero por ahí.', { name: 'Pescador' });
    if (api.badges() < 3) return api.say(['Veo que ya sabés pescar.', 'Todavía te falta camino: volvé con tres medallas y te doy una caña buena.'], { name: 'Pescador' });
    await api.say(['Venís con tres medallas, y eso se nota en el trato con las criaturas.', 'Tomá: una caña buena, con mejor carnada.'], { name: 'Pescador' });
    await api.give('cana_buena', 1);
    api.setFlag('got_cana2');
    await api.say('Con ella pican criaturas de más nivel. Mi hermano menor, en Paysandú, guarda la mejor.', { name: 'Pescador' });
  },

  async gift_cana3(api) {
    if (api.flag('got_cana3')) return api.say('Con la Súper Caña puede picar cualquier cosa. Tené cuidado con lo que sacás.', { name: 'Pescador' });
    if (!api.flag('got_cana2')) return api.say('Mi hermano de Minas tiene la caña buena. Pasá primero por ahí.', { name: 'Pescador' });
    if (api.badges() < 7) return api.say(['La Súper Caña no es para cualquiera.', 'Volvé con siete medallas y es tuya.'], { name: 'Pescador' });
    await api.say(['Siete medallas. Mis hermanos no se equivocaron con vos.', 'Esta es la mejor caña que armé en mi vida.'], { name: 'Pescador' });
    await api.give('cana_super', 1);
    api.setFlag('got_cana3');
    await api.say('Con ella pican todas las criaturas de la zona, incluso las más raras y fuertes.', { name: 'Pescador' });
  },

  async gift_surf(api) {
    if (api.flag('got_canoa')) return api.say('El Cuareim es manso, pero hay que respetarlo. La Canoa solo resiste con la Medalla Rivera.', { name: 'Pescador' });
    await api.say(['Vivo a orillas del río desde que nací.', 'Te regalo esta canoa. Caminá hacia el agua y subís sola.', 'Ojo: las corrientes de más al este son fuertes. Hace falta la Medalla Rivera para animarse.'], { name: 'Pescador' });
    await api.give('canoa', 1);
    api.setFlag('got_canoa');
  },

  async gift_soga(api) {
    if (api.flag('got_soga')) return api.say('En las cuevas, las cascadas esconden cornisas. Subí con la soga y fijate qué guardan.', { name: 'Escalador' });
    await api.say(['Trepé cuanta pared hay entre Fray Bentos y Rivera, y ya no me quedan fuerzas para más.', 'Llevate mi soga. En las cuevas hay cascadas que caen sobre cornisas escondidas.', 'Caminá contra la cascada y subís; para bajar, caminá hacia abajo desde la cornisa.'], { name: 'Escalador' });
    await api.give('soga', 1);
    api.setFlag('got_soga');
  },

  async gift_fuerza(api) {
    if (api.flag('got_guantes')) return api.say('Con esos guantes movés lo que quieras. Pero la Medalla Tacuarembó es la que te da el derecho.', { name: 'Domador' });
    await api.say(['Domo potros hace años y no hay animal que me gane de fuerza.', 'Llevate estos guantes. Con ellos podés empujar rocas pesadas, caminando contra ellas.', 'Solo te van a servir si ganás la Medalla Tacuarembó.'], { name: 'Domador' });
    await api.give('guantes', 1);
    api.setFlag('got_guantes');
  },

  async gift_pir(api) {
    if (!api.flag('gift_pir')) {
      await api.say('Alquilo esta casa todos los veranos. Llevate unos alfajores, que me sobraron.', { name: 'Veraneante' });
      await api.give('alfajor', 1);
      api.setFlag('gift_pir');
    }
    await api.say('Cada verano vienen turistas de todo el continente.', { name: 'Veraneante' });
  },

  async gift_pal(api) {
    if (!api.flag('gift_pal')) {
      await api.say('Me mudé acá por las olas. Tomá, unas Superballs que ya no uso.', { name: 'Surfista' });
      await api.give('superesfera', 1);
      api.setFlag('gift_pal');
    }
    await api.say('Si te gusta el mar, no dejes de probar la pesca en La Paloma.', { name: 'Surfista' });
  },

  async gift_vuelo(api) {
    if (api.flag('got_vuelo')) return api.say('El viento de Florida no para nunca. Con el hornero ya podés cruzar el país en un rato.', { name: 'Criador de horneros' });
    await api.say(['Acá el viento llega de todos lados, y mis horneros aprendieron a usarlo.', 'Llevate este silbato. Si silbás, un hornero te lleva volando a cualquier ciudad que ya conozcas.', 'Se usa desde el menú, en la opción Vuelo. Eso sí: el hornero solo te obedece si ganaste la Medalla Florida.'], { name: 'Criador de horneros' });
    await api.give('silbato', 1);
    api.setFlag('got_vuelo');
  },

  /** Fábrica de Minas: an operator rushes in with bad news for Garúa, and sees you. */
  async scene_garua(api) {
    api.setFlag('ev_garua_intro');
    await api.npcWalkIn('obrero_fab', 6, 3, 10);
    api.npcFaceNpc('obrero_fab', 'garua');
    await api.say(['¡Jefa! No contestan ni la torre de Rivera ni la Quebrada.', 'Dicen que anda un entrenador apagándolo todo, de a una.'], { name: 'Operario' });
    api.npcFacePlayer('garua');
    await api.say('Ya lo sé. Mirá detrás tuyo.', { name: 'Garúa' });
    api.npcFacePlayer('obrero_fab');
    await api.say('¡Es él!', { name: 'Operario' });
    await api.say('Andá a avisar a la guardia del turno noche. De este me encargo yo.', { name: 'Garúa' });
    await api.npcWalkOff('obrero_fab');
    api.playerFaceNpc('garua');
    await SCRIPTS.garua(api);
  },

  async garua(api) {
    if (api.flag('pp_clear')) return api.say('Mi plan fracasó. Esta vez de verdad.', { name: 'Garúa' });
    await api.say(['Así que lograste llegar hasta acá. Otra vez.', 'Te dije que el plan de la Represa era un ensayo.', 'Brumario cayó y Bruma también, pero las máquinas siguen en pie. Con ellas, la niebla vuelve en cuestión de semanas.', 'Desde esta fábrica se va a gobernar el clima del país.'], { name: 'Garúa' });
    const res = await api.battle({ id: 'garua', name: 'Garúa', cls: 'Comandante PP', look: 'garua', ai: 'smart', team: bossAt('minas', [['yarara', 36], ['cuervon', 37], ['lobomarino', 37], ['pombero', 37], ['caudillo', 38]]), prize: 4500, lose: 'Se apagaron las máquinas…', items: ['mate_dulce', 'mate_dulce'] });
    if (res !== 'win') return;
    await api.say('Está bien. Me rindo. Por ahora.', { name: 'Garúa' });
    api.setFlag('pp_clear');
    api.setFlag('open_minas'); // Minas has no gym: beating Garúa is what opens the road west
    await api.say(['Las máquinas de la fábrica se detienen una por una.', 'El humo gris se va con el viento.']); // seen in the world itself: only winning the Liga gets a full-screen scene
    await api.say(['Pero no soy quien manda. PP quiere decir Proyecto Pampero, y el proyecto es del Dr. Díaz.', 'Dr. Díaz dejó el Anglo hace tiempo. Hoy espera en Montevideo, en el puerto, a quien llegue con las doce medallas.', 'Llevate esto.'], { name: 'Garúa' });
    await api.give('mt_vendaval', 1);
    await api.say('En la oficina de Garúa encontrás una vianda con Restos de Asado, guardada para la guardia nocturna.');
    await api.give('restos_asado', 1);
    await fogChoice(api, 'fog3', 'Vecino', ['Un vecino de Minas llega corriendo.', 'Gracias a esa fábrica, los viñedos de Canelones no se arruinan con el granizo. Muchos van a quedar sin protección.']);
    await api.say('Las máquinas de la fábrica se apagaron. Solo falta Dr. Díaz, en Montevideo.');
    await api.npcLeave('garua');
  },

  async gift_dur(api) {
    if (api.flag('gift_dur')) return api.say('El calor se aguanta mejor con un buen mate.', { name: 'Vecino' });
    await api.say(['No es fácil vivir con este calor.', 'Pero la gente de acá se las arregla. Llevate esto, que no lo uso.'], { name: 'Vecino' });
    await api.give('piedra_agata', 1);

    api.setFlag('gift_dur');
  },

  async gift_min(api) {
    if (api.flag('gift_min')) return api.say('Un buen mate se toma despacio y con buena compañía.', { name: 'Paisano' });
    await api.say('Los de acá tomamos mate con el agua de las sierras. Probalo, que es de lo mejor.', { name: 'Paisano' });
    await api.give('mate_dulce', 1);
    api.setFlag('gift_min');
  },

  async gift_garrapinada(api) {
    if (api.flag('gift_garr')) return api.say('Los carritos de garrapiñada de la Rambla son un clásico.', { name: 'Vecina' });
    await api.say('Compré garrapiñada en la Rambla. Tomá una: hace que tu criatura suba de nivel.', { name: 'Vecina' });
    await api.give('garrapinada', 1);
    api.setFlag('gift_garr');
  },

  // Bosque Grande, before San José: a short rematch with the starter alone, so the rival is present before the first gym.
  async rival_bosque(api) {
    if (api.flag('rival_bosque')) return;
    await api.npcApproach('rival_bosque'); // walks up from the road ahead, never pops in
    await api.say(['¡{player}! Sabía que ibas a pasar por acá.', 'Ya tengo la PokeDex llena de apuntes. Vos recién arrancás.', 'Mi tío dice que en el litoral hay niebla rara. Yo voy a Trinidad por la medalla. Pero antes, una revancha.'], { name: '{rival}' });
    const [, hi] = mapBand('r_rosario_sanjose');
    const line = LINE[COUNTER[api.starterKey()]];
    const team = rescaleTeam([[line[0], hi + 1]], [hi + 1, hi + 1]);
    const res = await api.battle({ id: 'rival_bosque', name: '{rival}', cls: 'Rival', look: 'rival', team, prize: 160, intro: null, lose: 'Otra vez vos. No puede ser.', after: null, ai: 'basic' }, { canLose: true });
    api.setFlag('rival_bosque');
    if (res !== 'win') { api.healParty({ silent: true }); await api.say(['Te gané. Así es como se entrena.', 'Ya curé a tus criaturas: no quiero ganarte con ventaja.'], { name: '{rival}' }); }
    await api.say(['Nos vemos en Trinidad. Si llegás primero, no le ganes a Elena antes que yo.'], { name: '{rival}' });
    await api.npcWalkOff('rival_bosque');
  },

  async rival_mvd(api) {
    if (api.flag('rival2')) return;
    await api.npcApproach('rival_mvd'); // walks up from the road ahead, never pops in
    await api.say(['{player}, te estaba esperando.', 'Me enteré de que le ganaste a Zoraida, en el Anglo.', 'Yo también estuve entrenando. Veamos quién está más fuerte.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 2, 700, null, 'Perdí. Buen combate.', null), { canLose: true });
    api.setFlag('rival2');
    if (res === 'win') await api.say(['Yo sigo hacia Salto. Nos vemos allá.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Esta vez gané yo. Entrená un poco más y volvé a intentarlo cuando quieras.', 'Yo sigo hacia Salto. Nos vemos allá.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcWalkOff('rival_mvd');
  },

  async nurse(api) {
    await api.say(['Bienvenido a la Policlínica.', 'Vamos a atender a tus criaturas.'], { name: 'Enfermera' });
    await api.healParty();
    api.setLastHeal();
    await api.say('Listo, están recuperadas. Volvé cuando lo necesites.', { name: 'Enfermera' });
  },

  async camp_nurse(api) {
    await api.say(['Armé este puesto para los que van a la Liga. Todos llegan con las criaturas cansadas.', 'Dejame que las atienda.'], { name: 'Enfermera de campaña' });
    await api.healParty();
    await api.say('Listo. Que la Calle Victoria te sea corta.', { name: 'Enfermera de campaña' });
  },

  async pc(api) {
    api.sfx('confirm');
    await api.openPC();
  },

  // Colonia's storekeeper holds Tabárez's letter (the player needs a few fights before getting the PokeDex).
  async shop_carta(api, npc) {
    if (api.flag('has_starter') && !api.flag('dex') && !api.flag('got_carta')) {
      await api.say(['¿Venís de parte del Maestro Tabárez? Te estaba esperando.', 'Tengo esta carta para él. Llevásela con cuidado.'], { name: 'Almacenero' });
      await api.give('carta_tabarez', 1);
      api.setFlag('got_carta');
    }
    return SCRIPTS.shop(api, npc);
  },

  async shop(api, npc) {
    await api.say(npc.greeting ?? 'Buenas. ¿Qué se lleva?', { name: npc.clerkName ?? 'Almacenero', keep: true });
    await api.openShop(npc.stock);
  },

  // Mercedes mail carrier: tells the player the gym is closed because Marta never came back, which starts the search.
  async cartero_marta(api, npc) {
    await api.say(npc.text, { name: 'Cartero' });
    if (!api.flag('marta_lost')) {
      api.setFlag('marta_lost');
      await api.say('Si te animás a buscarla, empezá por la cueva de Palmitas: ahí la vieron por última vez.', { name: 'Cartero' });
    }
  },

  // Marta, the Correo leader, is held at the end of the Palmitas cave by two PP recruits: freeing her opens Mercedes' gym.
  async marta_cave(api, npc) {
    const left = (npc.ppIds ?? []).filter((id) => !api.flag(`tr_${id}`)).length;
    if (left) return api.say(['Soy Marta, del Correo. Me siguieron hasta acá para quitarme un paquete con planos.', 'Los reclutas del PP me cierran el paso. Si los vencés, te lo agradezco.'], { name: 'Marta' });
    await api.say(['Gracias, {player}. Sin vos seguiría encerrada entre esas rocas.', 'Llevaban los planos de unas máquinas de niebla. Esto lo tiene que ver todo el país.', 'Ya no hace falta que me trates de usted. Después de esto, somos amigos.', 'Voy ahora mismo para el gimnasio. Cuando llegues, me va a gustar medir tu equipo.'], { name: 'Marta' });
    api.setFlag('marta_help');
  },

  // Route story beats (route-stories.js): a person who lost an object that lies in a grass clearing, and a PP fog machine.
  async route_quest(api, npc) {
    if (api.flag(npc.doneFlag)) return api.say('Gracias de nuevo. Ojalá todos fueran como vos.', { name: npc.name });
    if (!api.flag(npc.holeFlag)) return api.say(npc.ask, { name: npc.name });
    await api.say(npc.thanks, { name: npc.name });
    api.setFlag(npc.doneFlag);
    await api.give(npc.reward);
  },

  // A local with a story about the stretch of land; the first time, a small gift (when the route has one).
  async route_legend(api, npc) {
    await api.say(npc.lines, { name: npc.name });
    if (npc.gift && !api.flag(npc.doneFlag)) {
      api.setFlag(npc.doneFlag);
      await api.say('Llevate esto para el camino.', { name: npc.name });
      await api.give(npc.gift[0], npc.gift[1]);
    }
  },

  async route_fog(api, npc) {
    await api.say(npc.clue, { name: 'Máquina de niebla' });
    if (api.flag(npc.doneFlag)) return;
    const r = await api.choose(['Apagarla', 'Dejarla'], { cancel: true });
    if (r !== 0) return;
    api.setFlag(npc.doneFlag);
    api.sfx('confirm');
    await api.say('Apagaste la máquina. La niebla de la zona empieza a levantarse. Dentro hay una bolsa con provisiones.', { name: 'Máquina de niebla' });
    await api.give(npc.reward ?? 'mate');
  },

  // Casino Peninsula (Maldonado): fichas for money, tragamonedas, prizes for fichas (never back into money).
  async casino_cashier(api) {
    await api.say(['Bienvenido al Casino Peninsula. Las fichas no se cambian por dinero, solo por premios.', 'Diez fichas salen $500.'], { name: 'Cajero' });
    const r = await api.choose(['Comprar 10 fichas · $500', 'Comprar 50 fichas · $2500', 'No, gracias'], { cancel: true });
    if (r < 0 || r > 1) return api.say('Suerte en las máquinas.', { name: 'Cajero' });
    const n = r === 0 ? 10 : 50;
    if (api.hasItem('ficha', 1000 - n)) return api.say('Ya llevás demasiadas fichas. Jugá algunas antes.', { name: 'Cajero' });
    if (!api.pay(n * 50)) return api.say('No te alcanza el dinero.', { name: 'Cajero' });
    await api.give('ficha', n);
    api.sfx('confirm');
  },

  async casino_slots(api) {
    const SYM = ['Mate', 'Mate', 'Mate', 'Mate', 'Mate', 'Ceibo', 'Ceibo', 'Ceibo', 'Ceibo', 'Sol', 'Sol', 'Siete'];
    const PAY = { Mate: 4, Ceibo: 8, Sol: 40, Siete: 150 };
    await api.say('Tragamonedas. Tres iguales pagan; Siete Siete Siete es el premio mayor.', { name: 'Máquina' });
    for (;;) {
      const have = api.countItem('ficha');
      const r = await api.choose(['Apostar 1 ficha', 'Apostar 2 fichas', 'Apostar 3 fichas', 'Salir'], { cancel: true, title: `Fichas: ${have}` });
      if (r < 0 || r > 2) return;
      const bet = r + 1;
      if (!api.hasItem('ficha', bet)) return api.say('No tenés fichas suficientes.', { name: 'Máquina' });
      api.takeItem('ficha', bet);
      const reels = [0, 0, 0].map(() => SYM[Math.floor(Math.random() * SYM.length)]);
      api.sfx('confirm');
      let win = 0;
      if (reels[0] === reels[1] && reels[1] === reels[2]) win = PAY[reels[0]] * bet;
      else if (reels[0] === 'Mate' && reels[1] === 'Mate') win = bet;
      await api.say(`[ ${reels.join(' | ')} ]`, { name: 'Máquina' });
      if (win) { await api.give('ficha', win); api.sfx('confirm'); await api.say(`¡Ganaste ${win} ficha${win > 1 ? 's' : ''}!`, { name: 'Máquina' }); }
    }
  },

  async casino_prizes(api) {
    const PRIZES = [['mate_dulce', 'Mate con carqueja', 40], ['ultraesfera', 'Ultraball', 120], ['dulce_de_leche', 'Primer Mate', 200], ['piedra_agata', 'Piedra Ágata', 400], ['mt_sombra_nocturna', 'MT Sombra nocturna', 800], ['mt_garra_charrua', 'MT Garra charrúa', 1200]];
    await api.say('Mostrador de premios. Se paga solo con fichas.', { name: 'Premios' });
    for (;;) {
      const r = await api.choose([...PRIZES.map(([, n, c]) => `${n} · ${c} fichas`), 'Salir'], { cancel: true });
      if (r < 0 || r >= PRIZES.length) return api.say('Volvé cuando tengas más fichas.', { name: 'Premios' });
      const [key, name, cost] = PRIZES[r];
      if (!api.hasItem('ficha', cost)) { await api.say('No te alcanzan las fichas.', { name: 'Premios' }); continue; }
      api.takeItem('ficha', cost);
      await api.give(key, 1);
      await api.say(`Te llevás: ${name}.`, { name: 'Premios' });
    }
  },

  // Every city without a gym has someone who keeps the road closed for a reason of the story (GATE_STORY).
  // Without an entry, a guard asks for a friendly match.
  async town_gate(api, npc) {
    const i = STOP_INDEX[npc.stop];
    const here = STOPS[i];
    const next = STOPS[i + 1];
    const flag = openFlag(here.id);
    const G = GATE_STORY[here.id];
    const who = G?.name ?? 'Guardia';
    if (api.flag(flag)) return api.say(G?.open ?? [`El camino a ${next.name} está abierto.`, 'Cuidate en la ruta.'], { name: who });
    if (G?.need && !api.flag(G.need)) return api.say(G.waiting, { name: who });
    const [, hi] = mapBand(here.id);
    if (G?.foe) {
      await api.say(G.intro, { name: who });
      await api.say(G.foe.intro, { name: 'Recluta PP' });
      const team = teamOf(G.foe.types, [hi, hi + 1], `gatepp_${here.id}`);
      const res = await api.battle({ id: `gate_${here.id}`, name: 'Recluta PP', cls: 'Equipo PP', look: 'grunt', team, prize: (hi + 1) * 40, intro: null, lose: G.foe.lose, after: null, ai: 'basic' }, { canLose: true });
      if (res !== 'win') return api.say('Volvé cuando tus criaturas estén listas. No los dejes salirse con la suya.', { name: who });
      await api.say(G.foe.after, { name: 'Recluta PP' });
    } else if (G) {
      await api.say(G.intro, { name: who });
    } else {
      await api.say([`El camino a ${next.name} está cerrado por orden de la intendencia.`, 'Antes de dejar pasar a alguien, quiero ver cómo trata a sus criaturas.'], { name: who });
      const team = teamOf(['normal', 'lucha', 'tierra'], [hi - 1, hi, hi + 1], `gate_${here.id}`);
      const res = await api.battle({ id: `gate_${here.id}`, name: 'Guardia', cls: 'Guardia de ruta', look: 'cop', team, prize: (hi + 1) * 30, intro: null, lose: 'Todavía te falta.', after: null, ai: 'basic' }, { canLose: true });
      if (res !== 'win') return api.say('Entrená un poco y volvé. No hay apuro.', { name: who });
    }
    api.setFlag(flag);
    await api.say(G?.thanks ?? [`Bien tratadas, tus criaturas. Pasá nomás: el camino a ${next.name} queda abierto.`], { name: who });
    await api.npcLeave(`gate_${here.id}`);
  },

  async leader(api, npc) {
    const L = LEADERS[npc.leader];
    if (L.need && !api.flag(L.need[0])) return api.say(L.need[1], { name: L.name });
    if (api.flag(L.badge)) {
      // A rematch opens every two gyms, so the leader has had time to train.
      const tier = api.gymRematchTier(L.order);
      if (tier < 1 || api.flag(`rm${tier}_${L.id}`)) return api.say(L.after, { name: L.name });
      await api.say(['Volviste. Estuve entrenando desde la última vez.', 'Esta vez no me contengo.'], { name: L.name });
      if (!(await api.ask('¿Aceptás la revancha?'))) return;
      const res = await api.battle({ ...L, intro: null, team: api.rematchTeam(L.team, tier), prize: Math.round(L.prize * (1 + tier * 0.8)) });
      if (res !== 'win') return;
      api.setFlag(`rm${tier}_${L.id}`);
      api.healParty({ silent: true });
      await api.say('Tus criaturas quedaron recuperadas.');
      await api.say('Buen combate. Volvé cuando hayas recorrido más camino.', { name: L.name });
      return;
    }
    await api.say(L.intro, { name: L.name });
    const res = await api.battle({ ...L, intro: null }); // the intro was just said
    if (res !== 'win') return;
    api.setFlag(L.badge);
    const home = STOPS.find((st) => st.gym === npc.leader);
    if (home) api.setFlag(openFlag(home.id)); // winning the medal opens the road to the next city
    api.healParty({ silent: true });
    await api.say('Tus criaturas quedaron recuperadas.');
    api.jingle('badge');
    await api.say(`¡{player} recibió la ${L.badgeName}!`);
    await api.give(L.reward, L.rewardQty);
    await api.give(L.tm, 1);
    await api.say(['Tomá también esta MT. Enseña un movimiento nuevo a una criatura compatible.'], { name: L.name });
    await api.say(L.after, { name: L.name });
  },

  /** Cabo Polonio: the lighthouse keeper runs to you, then Bruma walks in and the two of them argue in front of you. */
  async scene_cabo(api) {
    api.setFlag('ev_cabo_intro');
    await api.npcWalkToPlayer('farero_cabo');
    await api.say(['¡Eh, vos! ¿Venís por el faro?', 'Una mujer vestida de gris subió a las rocas con mi lámpara. Desde entonces la luz no gira y los barcos ya no ven la costa.', 'Si alguien puede hacerla entrar en razón, sos vos. Fijate: ahí viene.'], { name: 'Farero' });
    await api.npcWalkIn('bruma', 10, 4, 14);
    api.npcFaceNpc('bruma', 'farero_cabo');
    api.npcFacePlayer('farero_cabo');
    await api.say(['¿Todavía llorando por la lámpara, viejo?', 'Sin esa luz nadie ve lo que hacemos en la costa. Y a mí me conviene así.'], { name: 'Bruma' });
    await api.say('Esa lámpara guía a los pescadores desde antes de que vos nacieras. No es tuya.', { name: 'Farero' });
    await api.say('Ahora es de nadie. Andate a tu faro, que acá hay cosas de adultos.', { name: 'Bruma' });
    await api.npcWalkTo('farero_cabo', 2, 7);
    api.npcFacePlayer('bruma');
    api.playerFaceNpc('bruma');
    await SCRIPTS.bruma(api);
  },

  async bruma(api) {
    await api.say(['Otra vez vos.', 'Sin la lámpara del faro, la niebla cubre la costa y nadie ve lo que hacemos.', 'Esta vez no hay torre que te frene. Vas a tener que pasar por mí.'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma', name: 'Bruma', cls: 'Admin. PP', look: 'bruma', ai: 'smart', team: bossAt('paloma', [['yararita', 22], ['zorrigris', 23], ['cuervon', 24]]), prize: 1500, lose: 'Imposible. Mi niebla…', items: ['mate'] });
    if (res !== 'win') return;
    await api.say(['Llevate tu lámpara.', 'Igual es tarde: Garúa ya puso a funcionar la fábrica de Minas.', 'Y Dr. Díaz nos espera en Montevideo.'], { name: 'Bruma' });
    await api.give('lampara', 1);
    await api.npcWalkOff('bruma');
    api.setFlag('cabo_clear');
    await api.say(['La niebla del cabo empieza a abrirse.', 'Después de tanto tiempo, el mar vuelve a verse.']); // seen in the world itself: only winning the Liga gets a full-screen scene
    await api.say('Deberías devolverle la lámpara al farero. Está dentro del faro.');
  },

  async keeper(api) {
    if (api.hasItem('lampara')) {
      await api.say(['La lámpara. La recuperaste.', 'Esta noche el faro de Cabo Polonio vuelve a funcionar.', 'Aceptá esto, es lo menos que puedo hacer.'], { name: 'Farero' });
      api.takeItem('lampara');
      api.setFlag('lamp_returned');
      await api.say(['Y llevate también este farol de gaucho. Alumbra hasta el túnel más oscuro.', 'Las sierras entre Piriápolis y Minas son pura oscuridad: lo vas a necesitar.', 'Se usa desde el menú, en Destello. Eso sí: solo te va a obedecer si ganaste la Medalla Maldonado.'], { name: 'Farero' });
      await api.give('farol', 1);
      api.setFlag('got_farol');
      return;
    }
    if (api.flag('lamp_returned')) return api.say('Gracias a vos, los barcos navegan seguros.', { name: 'Farero' });
    await api.say(['Se llevaron la lámpara. Fue una mujer vestida de gris, con capa.', 'Sigue afuera, del lado de las rocas.'], { name: 'Farero' });
  },

  /** Fray Bentos' history teacher: the Anglo, the museum, then the PP, as the player advances. */
  async frb_historia(api) {
    const nm = { name: 'Profesora Irene' };
    if (api.flag('anglo_pp')) return api.say(['Las máquinas que había en las cámaras de frío no eran de la fábrica. Las trajo alguien de afuera.', 'Y esa niebla artificial que se vende por el litoral, creo que no es una casualidad.', 'Esta ciudad fue la cocina del mundo. Que no sea ahora un depósito de máquinas ajenas.'], nm);
    if (api.flag(badgeOf('fraybentos'))) return api.say(['Veo que pasaste por el museo. Zoraida cuida ese lugar como a un tesoro.', 'Las cajas del museo se usaban para despachar mercadería entre depósitos. Ahora las usa ella para recibir a los visitantes.', 'Si te interesa la historia del Anglo, andá a ver el frigorífico viejo. Pero con cuidado: se movió gente rara por ahí.'], nm);
    return api.say(['Soy docente de historia. Fray Bentos nació alrededor de una fábrica de extracto de carne, hace más de un siglo y medio.', 'El Anglo faenaba miles de reses por día y mandaba conservas a medio mundo. Por eso le decían "la cocina del mundo".', 'Hoy el museo guarda esa historia. Preguntá por Zoraida, la directora.'], nm);
  },

  async rival_ferry(api) {
    if (api.flag('rival3')) return;
    await api.say(['{player}. Sabía que ibas a subir a este barco.', 'Alguien me escribió diciendo que trabaja con mi tío en un estudio del clima. Me pidió ayuda y le pasé un par de datos del laboratorio.', 'Si es ciencia, quiero ser parte. Pero antes de que entres al camarote del capitán, veamos quién es más fuerte.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 1, 1200, null, 'Sos un rival duro.', null), { canLose: true });
    api.setFlag('rival3');
    if (res === 'win') await api.say(['Bien. Pasá vos primero, el capitán te espera.', 'Pero en el Centenario te gano.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Todavía te falta. No pasa nada: entrená y volvé a medirte conmigo en el Centenario.', 'Dejo el paso libre al camarote del capitán.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcLeave('rival_ferry');
  },

  async ferry_bio(api) {
    if (api.flag('ferry_bio')) return api.say('Cuando la ballena canta, hasta el motor del barco parece callarse.', { name: 'Biólogo' });
    await api.say(['Soy biólogo marino. Viajo para estudiar a la criatura que canta frente a Punta del Este.', 'Mirá estas fotos: una ballena enorme, de color plata, que solo aparece en invierno.'], { name: 'Biólogo' });
    api.markSeen('ballenaplata');
    api.setFlag('ferry_bio');
    api.sfx('confirm');
    await api.say('¡Los datos de Ballenaplata se agregaron a la PokeDex!');
  },

  async event_boss(api, npc) {
    const E = EVENTS[npc.event];
    if (api.flag(E.flag)) return api.say(E.thanks, { name: 'Dueño' });
    await api.say(E.intro, { name: E.name });
    const res = await api.battle({ id: `ev_${npc.event}`, name: E.name, cls: 'Capataz PP', look: 'pp_capataz', ai: 'smart', team: E.team, prize: E.prize, lose: E.lose, items: ['mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag(E.flag);
    if (E.opens) api.setFlag(E.opens); // clearing the dock opens the road out of Paysandú (the city has no gate guard)
    await api.flash();
    await api.say(E.after, { name: E.name });
    await api.npcLeave(`boss_${npc.event}`);
    await api.ownerArrives(npc.event);
    await api.say(E.thanks, { name: 'Dueño' });
    await api.give(E.mt, 1);
    if (E.held) { await api.say('Además, entre las cosas del capataz había un objeto que sirve para equipar a una criatura.'); await api.give(E.held, 1); }
  },

  /** Toll booth on a route (placed by toll.ts): $115 to go through; broke players are turned back, until the fourth try. */
  async toll_booth(api, def) {
    const id = def.tollId ?? 'peaje';
    if (api.tollRecent(id)) return;
    const price = 115;
    await api.say(['PEAJE', `Tarifa: $${price}. Pase por la cabina.`], { name: 'Peaje' });
    if (api.pay(price)) {
      api.sfx('money');
      await api.say(['Gracias. Buen viaje y cuidado con las criaturas en la ruta.'], { name: 'Peaje' });
      api.tollPaid(id);
      return;
    }
    if (api.tollTry(id) > 3) {
      await api.say(['¿Otra vez sin plata? Bueno, ya van varias veces.', 'Está bien, por esta vez pasás. Pero lo vas a pagar con la patente, como todo en este país.'], { name: 'Peaje' });
      api.tollPaid(id);
      return;
    }
    await api.say(['No te alcanza para el peaje. Volvé cuando tengas $115.'], { name: 'Peaje' });
    await api.stepBack();
  },

  async event_owner(api, npc) {
    const E = EVENTS[npc.event];
    await api.say(['Gracias otra vez, {player}. Sin vos esto seguiría tomado.', 'Pasá cuando quieras.'], { name: 'Dueño' });
  },

  /** Fray Bentos' lighthouse keeper: his brother captains the Buquebus docked in the terminal. */
  async keeper_colonia(api) {
    if (api.flag('ferry_done')) return api.say('Mi hermano ya no está mareado. Gracias por el favor.', { name: 'Farero' });
    if (api.flag('got_ticket')) return api.say(['El Buquebus "China Zorrilla" está en la terminal, al lado del muelle.', 'Mi hermano, el capitán, está en su camarote. Llevale un Mate: en el almacén venden.'], { name: 'Farero' });
    await api.say(['Soy el farero de Fray Bentos. Hace cuarenta años que miro el río desde acá arriba.', 'Mi hermano es el capitán del Buquebus "China Zorrilla", el ferry nuevo que lleva el nombre de la actriz. Está atracado en la terminal.', 'Desde la prueba de mar anda mareado, y no hay nada que lo calme como un Mate bien cebado.', 'Para subir hace falta un ticket, y los reparte alguien de la empresa. Yo solo sé que hay gente de la planta que trabaja en el frigorífico a la fuerza.'], { name: 'Farero' });
  },

  /** A neutral worker kept inside the Anglo by the PP: returns his lost badge, gives the Buquebus ticket. */
  async obrero_anglo(api) {
    if (api.flag('got_ticket')) return api.say('Gracias por la credencial. Cuando salgas de este laberinto, subí al barco con el ticket.', { name: 'Operario' });
    if (api.hasItem('credencial_anglo') && !api.flag('anglo_pp')) {
      return api.say(['¡Esa es mi credencial! Pero con la jefa de la banda acá adentro no puedo despachar ningún pasaje.', 'Si ella se va, el ticket es tuyo. Quedate con la credencial hasta entonces.'], { name: 'Operario' });
    }
    if (api.hasItem('credencial_anglo')) {
      await api.say('¡Esa es mi credencial! Estaba perdida en alguna de las cintas.', { name: 'Operario' });
      api.takeItem('credencial_anglo');
      await api.say(['No soy del PP. Me tienen acá adentro manejando las cintas porque soy el único que las conoce.', 'Soy de los que despachan los pasajes del Buquebus. Tomá uno, es lo mínimo.'], { name: 'Operario' });
      await api.give('ticket_ferry', 1);
      api.setFlag('got_ticket');
      return api.say('Si el capitán anda mareado, llevale un Mate. Dicen que es lo único que lo calma.', { name: 'Operario' });
    }
    return api.say(['Yo trabajo en el Anglo desde antes de que llegaran estos del PP. Me tienen encerrado en esta oficina, a la vista de la jefa.', 'Perdí mi credencial de operario en algún rincón de las cintas y sin ella no puedo ni salir a cobrar.', 'Si la encontrás, hablamos. Yo despacho los pasajes del Buquebus.'], { name: 'Operario' });
  },

  async ferry_captain(api) {
    if (api.flag('ferry_done')) return;
    await api.say(['Uf… perdón. Soy el capitán de este barco, y estoy mareado desde que zarpamos de prueba.', 'Lo único que me calma es un Mate, de esos bien cebados. Pero acá a bordo se acabó la yerba.'], { name: 'Capitán' });
    if (!api.hasItem('mate')) return api.say(['Si me traés un Mate, te lo voy a agradecer toda la vida.', 'En el almacén de Fray Bentos venden.'], { name: 'Capitán' });
    if (!(await api.ask('¿Le das el Mate al capitán?'))) return api.say('El capitán suspira. Cuando quieras, acá estoy.', { name: 'Capitán' });
    api.takeItem('mate');
    api.sfx('heal');
    await api.say('{player} le dio el Mate al capitán. Poco a poco recupera el color.');
    await api.say(['Mucho mejor. Me salvaste, {player}.', 'En agradecimiento, tomá este machete: lo uso para abrir paso entre los zarzales del muelle viejo.', 'Se usa parándote frente al zarzal y apretando A. En Fray Bentos la guardia solo deja cortar a quien ganó la Medalla de este pueblo; en los caminos más al norte, a quien ganó la Medalla Salto.'], { name: 'Capitán' });
    await api.give('machete', 1);
    api.setFlag('got_machete');
    await api.say('También te dejo unas Pokeballs y unos panes que el barco no va a usar.', { name: 'Capitán' });
    await api.give('esfera', 5);
    await api.give('pan_casero', 2);
    api.takeItem('ticket_ferry');
    for (const k of ['llave_c2', 'llave_bodega', 'llave_cubierta']) if (api.hasItem(k)) api.takeItem(k);
    api.setFlag('ferry_done');
    await api.say(['Ahora, a trabajar: el barco zarpa en minutos rumbo a Buenos Aires.', 'Todos los pasajeros tienen que bajar. ¡Gracias por todo!'], { name: 'Capitán' });
    await api.warp('fraybentos', 3, 24, 'down');
    await api.say('El Buquebus "China Zorrilla" ya no se ve en el río. No va a volver a este puerto.');
    await api.say('Con el Machete vas a poder abrir los zarzales de la salida norte de Fray Bentos cuando ganes la Medalla del gimnasio del pueblo.');
  },

  /** The Ánima of Melo's tower: the Sereno who still keeps watch. Calmed after a battle, it asks for the PP piece to be gone. */
  async anima(api) {
    await api.say(['Una figura pálida sostiene un farol apagado.', 'Soy el Sereno de la torre. Alguien me sacó el farol y escondió acá una pieza que apaga todo.', 'No me dejan descansar. Si querés llevarte la pieza, antes tenés que vencerme.'], { name: 'Ánima' });
    const res = await api.battle({ id: 'anima', name: 'Ánima del Sereno', cls: 'Espíritu', look: 'anima', ai: 'smart', team: bossAt('melo', [['luzmala', 24], ['pombero', 25], ['viudanegra', 26], ['caudillo', 27]]), prize: 2400, lose: 'Todavía no…', items: ['mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('anima_clear');
    await api.flash();
    await api.say(['El farol se prende solo. La pieza de la máquina queda en el suelo, apagada.', 'Gracias. Ahora puedo descansar.', 'Llevate esto: lo usaban los serenos para ver en la oscuridad.'], { name: 'Ánima' });
    await api.give('mt_triturar', 1);
    await api.give('mate_dulce', 3);
    await api.npcLeave('anima');
    await api.say('Desde la ventana de la torre, las Luces Malas de Cerro Largo se apagan una por una.');
  },

  /** Halfway up the Quebrada de los Cuervos, Tabárez's assistant comes up the trail behind the player. */
  async scene_qb_ayudante(api) {
    api.setFlag('ev_qb_ayudante');
    await api.say('Se oyen pasos apurados por el sendero.');
    await api.npcApproach('ayudante_qb', 10);
    await api.say(['¡{player}! Soy Martín, el ayudante del Maestro Tabárez. Nos vimos en el laboratorio de Carmelo.', 'El Maestro me mandó a medir el viento de la quebrada. Hace tres días que el aire está quieto, y eso acá no pasa nunca.'], { name: 'Martín' });
    await api.say(['Cada tantos años el Cardenal Azul baja a esta quebrada a descansar, después de cruzar el país detrás del pampero.', 'El PP lo sabía. Rodearon el nido con máquinas: si la niebla no lo deja levantar vuelo, el viento no vuelve a soplar.'], { name: 'Martín' });
    await api.say(['Tus criaturas están cansadas. Dejame darles una mano.'], { name: 'Martín' });
    await api.healParty();
    await api.say(['Yo voy a avisarle al Maestro. Viene en camino desde Carmelo.', 'Arriba no te puedo ayudar: con los reclutas del PP no tengo chance.'], { name: 'Martín' });
    await api.npcWalkOff('ayudante_qb');
  },

  async brumario(api) {
    api.playerFaceNpc('brumario');
    await api.say(['Así que vos sos el entrenador que molesta a mis reclutas.', 'Soy Brumario, jefe del Equipo PP en el este.', 'Mirá atrás mío. El Cardenal Azul limpia el cielo y disipa la niebla. Mientras esté acá, el pampero no sopla.', 'Si lo capturo, el país será nuestro: gris, quieto, sin viento.', 'Apartate de mi camino.'], { name: 'Brumario' });
    const res = await api.battle({ id: 'brumario', name: 'Brumario', cls: 'Jefe PP', look: 'brumario', ai: 'smart', team: bossAt('quebrada', [['yarara', 32], ['zorromonte', 32], ['cuervon', 33], ['lobomarino', 34]], 1), prize: 3000, lose: 'No… el viento vuelve.', items: ['mate_dulce', 'mate_dulce'] });
    if (res !== 'win') return;
    await api.say(['Perdí. Pero esto no se termina acá.', 'Yo sólo respondo al Dr. Díaz. Él nunca se ensucia las manos.', 'Si querés seguir, la fábrica de Minas es el próximo paso. Garúa la dirige.'], { name: 'Brumario' });
    await api.npcWalkOff('brumario');
    // the machines go quiet one after the other and the bird breaks free
    api.sfx('cancel');
    api.npcHide('maq_qb1');
    await api.say('Una de las máquinas tose y se apaga.');
    api.sfx('cancel');
    api.npcHide('maq_qb2');
    await api.say(['La otra se queda sin humo.', 'El Cardenal Azul abre las alas. Te mira un momento, como si te conociera.']);
    api.sfx('evolve');
    await api.flash();
    await api.npcFlyOff('cardenal_qb');
    api.setFlag('quebrada_clear');
    await api.say(['Un viento helado baja de las sierras.', 'El Cardenal Azul se aleja hacia el sur, y la niebla de la Quebrada se disipa.']); // seen in the world itself: only winning the Liga gets a full-screen scene
    await api.say('Donde estaba el pájaro quedó una pluma azul que chispea.');
    // Tabárez comes up the trail, walking: he has been on the road since Martín called him.
    await api.npcApproach('tabarez_qb', 14);
    await api.say(['Llegué tarde para verlo de cerca, pero lo vi irse. Hacía veinte años que no lo veía volar.', 'Martín me contó lo que hiciste en la subida. Gracias, {player}.'], { name: 'Maestro Tabárez' });
    await api.say(['Te debo la historia completa.', 'El pampero no es solo un viento. Lo trae el Cardenal Azul: cuando cruza el país, el cielo se limpia y la niebla se va.', 'Con Díaz lo estudiamos años. Lo llamamos Proyecto Pampero: queríamos predecir el clima siguiendo su ciclo.'], { name: 'Maestro Tabárez' });
    await api.say(['Díaz quiso venderlo. Si el Cardenal deja de volar, la niebla se queda, y la niebla se puede cobrar.', 'Me negué y se fue. Ahora sé hasta dónde estaba dispuesto a llegar.', 'En Fray Bentos te dije que tu compañero guarda un eco del ciclo del viento. Es el eco del Cardenal: nació en mi laboratorio el día que pasó volando sobre Carmelo.'], { name: 'Maestro Tabárez' });
    await api.say(['Esa pluma la dejó para vos. Guardala.', 'Cuando el PP ya no exista, el Cardenal va a volver a descansar acá. Si la llevás, te va a reconocer.'], { name: 'Maestro Tabárez' });
    await api.give('pluma_azul', 1);
    api.setFlag('got_pluma');
    await api.say(['Nuestro laboratorio era el viejo Observatorio del Cerro, en Piriápolis. Si pasás por ahí, fijate qué quedó.', 'Y seguí hacia la costa: en el faro de Cabo Polonio falta una lámpara, y en Minas hay una fábrica abandonada que volvió a funcionar.'], { name: 'Maestro Tabárez' });
    await api.npcWalkOff('tabarez_qb');
  },

  async rival_r5(api) {
    if (api.flag('rival5')) return;
    await api.npcApproach('rival_r5'); // walks up from the road ahead, never pops in
    await api.say(['{player}. Te estaba esperando en el camino.', 'Pasé por la Quebrada de los Cuervos. Estaba vacía: ni un cuervo, ni un nido.', 'Los datos que mandé al PP sirvieron para esto. Me usaron, y yo les creí.', 'No te pido perdón. Te pido un combate: necesito saber si todavía sirvo para algo.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 3, 3200, null, 'Sos un rival duro. Muy duro.', null), { canLose: true });
    api.setFlag('rival5');
    if (res === 'win') await api.say(['Bien jugado. Yo voy a hablar con mi tío.', 'Nos vemos en el Centenario.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Todavía te falta un poco. Entrená y seguí.', 'Yo voy a hablar con mi tío.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcWalkOff('rival_r5');
  },

  async rival_r24(api) {
    if (api.flag('rival6')) return;
    await api.npcApproach('rival_r24'); // walks up from the road ahead, never pops in
    await api.say(['{player}. Hablé con mi tío. Fue socio del Dr. Díaz y nunca me lo dijo.', 'Ya no trabajo para nadie del PP: me di cuenta tarde de a quién le estaba creyendo.', 'No te pido ayuda, te pido que me veas pelear bien una vez. Falta Durazno y después la capital, y no pienso llegar segundo.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 4, 5000, null, 'Me ganaste otra vez. Bien.', null), { canLose: true });
    api.setFlag('rival6');
    if (res === 'win') await api.say(['Andá vos. Yo te sigo de cerca.', 'En el Centenario nos vemos las caras.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Esta vez gané yo, pero la capital es cosa tuya. Andá.', 'En el Centenario nos vemos las caras.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcWalkOff('rival_r24');
  },

  async safari_clerk(api) {
    await api.say(['Bienvenido a Mi Zoo. Es un parque con criaturas de todo el país, sueltas y a la vista.', 'Se paga por tiempo de visita. Pasado ese tiempo suena una campana y los guardias te acompañan a la salida.', 'Un minuto antes te vamos a avisar. No se devuelve el dinero si salís antes.'], { name: 'Boletería' });
    const opts = [['Visita corta · 5 minutos · $500', 5, 500], ['Visita media · 10 minutos · $900', 10, 900], ['Visita larga · 15 minutos · $1300', 15, 1300]];
    const r = await api.choose([...opts.map((o) => ({ label: o[0] })), 'No, gracias'], { cancel: true });
    if (r < 0 || r >= opts.length) return api.say('Cuando quieras, acá estamos.', { name: 'Boletería' });
    const [, min, price] = opts[r];
    if (!api.pay(price)) return api.say('No te alcanza el dinero para esa entrada.', { name: 'Boletería' });
    api.safariStart(min);
    api.sfx('confirm');
    await api.say([`Pagaste $${price}. Tenés ${min} minutos desde que cruces la puerta.`, 'Te damos 30 Safari Balls y 15 Galletas de Campaña. Con la galleta, la criatura se encariña y es más fácil de atrapar. Todo se devuelve al salir.', 'Que disfrutes la visita.'], { name: 'Boletería' });
    await api.warp('safari', 12, 17, 'up');
  },

  async safari_exit(api) {
    const left = api.safariLeft();
    const mins = Math.ceil(left / 60000);
    if (!(await api.ask(`Te quedan unos ${mins} minuto${mins === 1 ? '' : 's'} de visita. ¿Querés salir ahora?`, { name: 'Guardia' }))) return;
    api.safariLeave();
    await api.say('Gracias por la visita. Te acompaño a la salida.', { name: 'Guardia' });
    await api.warp(api.safariGate.map, api.safariGate.x, api.safariGate.y, 'down');
  },

  async criadero(api) {
    await api.criadero();
  },

  async guarderia(api) {
    await api.daycare();
  },

  async almada(api) {
    if (api.flag('obs_clear')) return;
    await api.say(['No esperaba visitas. Soy Almada, fui alumno del Maestro Tabárez en este mismo observatorio.', 'Estudiábamos cómo el Pampero ordena el clima del Río de la Plata. Dr. Díaz y Tabárez dirigían el proyecto.', 'Cuando Tabárez se negó a vender los datos, Dr. Díaz se quedó con los instrumentos y yo me fui con él.', 'Pensé que íbamos a proteger el clima. Resulta que quería controlarlo.'], { name: 'Almada' });
    await api.say('Acá guardo el registro original. Si querés leerlo, ganame primero.', { name: 'Almada' });
    const res = await api.battle({ id: 'almada', name: 'Almada', cls: 'Investigador PP', look: 'biologo', ai: 'smart', team: bossAt('piriapolis', [['luzmala', 37], ['fatuo', 37], ['pombero', 38], ['vespertino', 38], ['caudillo', 39]]), prize: 3200, lose: 'Tenías razón en venir hasta acá.', items: ['mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('obs_clear');
    api.setFlag('obs_log');
    await api.flash();
    await api.say(['Desde el observatorio, el cielo se ve limpio.']); // seen in the world itself: only winning the Liga gets a full-screen scene
    await api.say(['Tomá el registro. Está firmado por los dos: Tabárez y Dr. Díaz.', 'La última página la escribió Dr. Díaz: "El Cardenal Azul tiene un ciclo. Si lo interrumpo, la niebla es mía para siempre".', 'Por eso quiere capturarlo. No lo odia: lo necesita.'], { name: 'Almada' });
    await api.say(['Dejo el Equipo PP. Voy a llevarle esto a Tabárez en persona.', 'Y esta MT era del observatorio: se usaba para medir los temblores del cerro.'], { name: 'Almada' });
    await api.give('mt_terremoto', 1);
    await api.npcLeave('almada');
    await api.say(['Tu celular vibra. Es Facu:', '"Mi tío me contó que Almada fue su mejor alumno. Si lo convenciste de volver, ya hiciste más que yo.', 'No pienso quedarme atrás. Nos vemos en el camino."']);
  },

  async bruma2(api) {
    await api.say(['Volvimos a vernos.', 'Después del Anglo juré que no me ganarías otra vez.', 'Esta torre emite la niebla que cubre Rivera. Mientras esté encendida, nadie ve lo que hacemos.'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma2', name: 'Bruma', cls: 'Admin. PP', look: 'bruma', ai: 'smart', team: bossAt('rivera', [['yarara', 42], ['vespertino', 43], ['viudanegra', 43], ['zarigueya', 44], ['zorromonte', 44]]), prize: 5000, lose: 'No… la niebla…', items: ['dulce_de_leche'] });
    if (res !== 'win') return;
    api.setFlag('torre_clear');
    await api.flash();
    api.sfx('evolve');
    await api.say(['La baliza del transmisor parpadea… y se apaga.', 'La niebla de Rivera sube y desaparece.']); // seen in the world itself: only winning the Liga gets a full-screen scene
    await api.say(['Perdí… otra vez.', 'Dr. Díaz no se va a quedar en el norte. Dicen que prepara algo grande en Montevideo.', 'Hacé lo que quieras. Brumario espera en la Quebrada de los Cuervos.'], { name: 'Bruma' });
    await api.give('pan_casero', 1);
    await api.npcLeave('bruma2');
  },

  async garua2(api) {
    await api.say(['Así que vos sos el entrenador que nos molesta.', 'Soy Garúa, comandante del Equipo PP.', 'La Represa mueve las torres: sin electricidad no hay niebla. Y yo controlo los interruptores.'], { name: 'Garúa' });
    const res = await api.battle({ id: 'garua2', name: 'Garúa', cls: 'Comandante PP', look: 'garua', ai: 'smart', team: bossAt('salto', [['yarara', 46], ['lobomarino', 46], ['vespertino', 47], ['pombero', 47], ['caudillo', 48], ['temblador', 48]]), prize: 6000, lose: 'Otra vez a oscuras…', items: ['dulce_de_leche', 'dulce_de_leche'] });
    if (res !== 'win') return;
    api.setFlag('represa_clear');
    await api.flash();
    api.sfx('levelup');
    await api.say(['Las compuertas de la represa se abren.', 'En la ciudad, las luces se prenden una por una.']); // seen in the world itself: only winning the Liga gets a full-screen scene
    await api.say(['Perdí. Pero esto es solo una pieza: Dr. Díaz tiene otra torre en Rivera, y mucho más que eso.', 'Yo vuelvo a mi fábrica de Minas. Si querés alcanzarme, tendrás que llegar hasta allá.'], { name: 'Garúa' });
    await api.give('pan_casero', 1);
    await fogChoice(api, 'fog2', 'Ingeniero', ['Un ingeniero de la Represa se acerca.', 'Estas turbinas también alimentan la red de niebla de media región. Si la cortamos, hay pueblos que pierden la protección contra el granizo.']);
    await api.npcLeave('garua2');
  },

  async bruma_anglo(api) {
    await api.say(['Así que sos vos el que anda haciendo ruido en Fray Bentos.', 'Soy Bruma, administradora del Equipo PP.', 'Este frigorífico guarda las máquinas de niebla. Dr. Díaz las necesita funcionando.', 'Y vos tenés algo que él lleva años buscando: esa criatura que te acompaña guarda el eco del Cardenal Azul. Entregámela y nadie se lastima.'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma_anglo', name: 'Bruma', cls: 'Admin. PP', look: 'bruma', ai: 'smart', team: bossAt('fraybentos', [['yararita', 8], ['zorrigris', 9], ['lechuza', 10]], -2), prize: 700, lose: 'No… las máquinas…', items: ['mate'] });
    if (res !== 'win') return;
    await api.say(['Perdí. Pero el proyecto es más grande que este frigorífico.', 'Dr. Díaz tiene torres y una represa, y yo no soy la única que sigue sus órdenes.'], { name: 'Bruma' });
    await api.give('mate', 1);
    await api.say('Entre las cosas de Bruma queda un objeto raro: un Repartir Exp, de los que el PP usaba para entrenar a su gente.');
    await api.give('repartir_exp', 1);
    await api.npcApproach('tabarez_anglo', 14);
    api.npcFaceNpc('bruma_anglo', 'tabarez_anglo');
    await api.say(['Bruma. Sé para quién trabajás.', 'Decile a Dr. Díaz que esta vez voy a ir yo mismo.'], { name: 'Maestro Tabárez' });
    await api.say('Maestro… Él dijo que usted no vendría.', { name: 'Bruma' });
    await api.npcWalkOff('bruma_anglo');
    api.setFlag('anglo_pp');
    api.playerFaceNpc('tabarez_anglo');
    await api.say(['{player}, tengo que decirte algo que callé demasiado tiempo.', 'Tu compañero nació en mi laboratorio durante el Proyecto Pampero. Guarda un eco del ciclo del viento, y por eso el PP te sigue.', 'Perdoname por no habértelo dicho en Carmelo. Cuidalo mucho.'], { name: 'Maestro Tabárez' });
    await api.npcWalkOff('tabarez_anglo');
    await fogChoice(api, 'fog1', 'Capataz', ['Un capataz del frigorífico te frena a la salida.', 'Con la niebla, el pueblo no sufre inundaciones desde hace dos años. Si la apagás, vuelve el río.']);
  },

  async calima(api) {
    await api.say(['Así que sos vos.', 'Soy Dr. Díaz, fundador del Proyecto Pampero. Lo que ustedes llaman Equipo PP.', 'Mi idea es simple: el clima es un recurso. Con las torres, la niebla se vende por días, por zonas, por contrato.', 'El Cardenal Azul era un estorbo: cada vez que cruzaba el país, el pampero se llevaba mi niebla. Por eso quise encerrarlo en la Quebrada.', 'Tabárez nunca se animó a ir más lejos. Yo sí, y por eso hoy estoy acá.'], { name: 'Dr. Díaz' });
    await api.say(['Llegaste con las doce medallas. Se nota que no te asustan las torres.', 'Pero no vas a apagarme a mí.'], { name: 'Dr. Díaz' });
    const res = await api.battle({ id: 'calima', name: 'Dr. Díaz', cls: 'Fundador PP', look: 'calima', ai: 'smart', team: bossAt('montevideo', [['vespertino', 51], ['viudanegra', 52], ['tormenton', 53], ['yarara', 53], ['buho', 53], ['yacaron', 54]], 1), prize: 9000, lose: 'No… mi proyecto…', items: ['dulce_de_leche', 'dulce_de_leche', 'chivito'] });
    if (res !== 'win') return;
    await api.flash();
    api.sfx('evolve');
    await api.say(['Las últimas máquinas de niebla se apagan.', 'El Cardenal Azul vuelve a volar sobre el río. El cielo del Uruguay vuelve a ser de todos.']); // seen in the world itself: only winning the Liga gets a full-screen scene
    await api.say(['Gané perdiendo… Ya no tengo equipo, ni dinero, ni torres.', 'Hacé lo que quieras. Pero el cielo nunca fue de nadie.'], { name: 'Dr. Díaz' });
    await api.npcApproach('tabarez_mvd', 14);
    api.npcFaceNpc('calima', 'tabarez_mvd');
    await api.say(['Díaz.', 'Llegué a tiempo para ver que no te quedó nada.'], { name: 'Maestro Tabárez' });
    await api.say(['Tabárez. Siempre llegás cuando ya no hace falta.', 'Pero te lo dije en el Observatorio: el cielo no se queda quieto. Alguien lo iba a ordenar.'], { name: 'Dr. Díaz' });
    await api.say('Ordenar no es vender. Eso nunca lo entendiste.', { name: 'Maestro Tabárez' });
    await api.npcWalkOff('calima');
    api.setFlag('anglo_clear');
    api.playerFaceNpc('tabarez_mvd');
    await api.say(['Lo lograron, {player}. El Equipo PP está disuelto.', 'Con las doce medallas y el Equipo PP disuelto, la Liga te espera en el Estadio Centenario.', 'Dr. Díaz fue mi colega y no supe verlo venir. Gracias por corregir lo que yo no pude.'], { name: 'Maestro Tabárez' });
    await api.npcWalkOff('tabarez_mvd');
  },

  async elite(api, npc) {
    const E = ELITES[npc.elite - 1];
    await api.say(E.intro, { name: E.name });
    const res = await api.battle({ id: `elite${npc.elite}`, name: E.name, cls: E.cls, look: E.look, ai: 'smart', team: E.team, prize: E.prize, lose: E.lose, items: E.items }, { music: 'battle' });
    if (res !== 'win') return;
    api.setFlag(`elite${npc.elite}`);
    await api.say(E.after, { name: E.name });
  },

  async gift_tac(api) {
    if (api.flag('got_bici')) return api.say('Al norte de la ciudad empieza la Ciclovía. Solo se entra en bicicleta. Usala desde el menú.', { name: 'Dueña' });
    await api.say(['Bienvenido a El Pedal. Hace veinte años que armo bicicletas para el norte.', 'Esta quedó en el taller: era de mi hijo y ya no la usa. Llevatela, va cuatro veces más rápido que caminando.', 'Se usa desde el menú. Bajo techo no se puede, y en combate no cambia nada.'], { name: 'Dueña' });
    await api.give('bici', 1);
    api.setFlag('got_bici');
    api.setFlag('gift_tac');
    await api.say('Al norte de la ciudad hay una Ciclovía. Solo se entra en bicicleta.', { name: 'Dueña' });
  },

  async gift_ciclovia(api) {
    if (api.flag('ciclo_done')) return api.say('Cada vez que bajo por la ciclovía me siento joven.', { name: 'Ciclista veterano' });
    await api.say(['Llegaste hasta el final. Pocos lo hacen.', 'Eso se premia. Tomá, un mate bien fuerte para el camino.'], { name: 'Ciclista veterano' });
    await api.give('dulce_de_leche', 1);
    api.setFlag('ciclo_done');
  },

  async gift_riv(api) {
    if (api.flag('gift_riv')) return api.say('Del otro lado de la plaza se compra más barato. Pero acá, el café es mejor.', { name: 'Comerciante' });
    await api.say(['Compro de un lado y vendo del otro.', 'Tomá, un regalo para el viaje. Que no se te acaben las Ultraballs.'], { name: 'Comerciante' });
    await api.give('ultraesfera', 1);
    api.setFlag('gift_riv');
  },

  async gift_sal(api) {
    if (api.flag('gift_sal')) return api.say('La represa es el orgullo de Salto. Y ahora, un problema.', { name: 'Policía' });
    await api.say(['Estoy de guardia, pero algo puedo hacer.', 'Tomá, que te sirve más que a mí.'], { name: 'Policía' });
    await api.give('pan_casero', 1);
    api.setFlag('gift_sal');
  },

  async gift_pay(api) {
    if (api.flag('gift_pay')) return api.say('El río siempre vuelve a su cauce.', { name: 'Marinero' });
    await api.say(['Hace años que navego esta costa.', 'Llevate esto: no tiene mucho valor, pero sirve.'], { name: 'Marinero' });
    await api.give('ultraesfera', 1);
    api.setFlag('gift_pay');
  },

  async gift_frb(api) {
    if (api.flag('gift_frb')) return api.say('El gimnasio de acá fue el más temido del litoral.', { name: 'Vecina' });
    await api.say(['Mi abuelo me dijo que el frigorífico era cosa seria.', 'Tomá esto, para lo que venga.'], { name: 'Vecina' });
    await api.give('alfajor_triple', 1);
    api.setFlag('gift_frb');
  },

  async rival_final(api) {
    if (api.flag('rival4')) return;
    await api.say(['Llegaste, {player}.', 'Desde Carmelo que te vengo siguiendo.', 'Esta es mi revancha. Voy con todo.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 5, 8000, null, 'Sos mejor que yo. Lo admito.', null), { canLose: true });
    api.setFlag('rival4');
    if (res === 'win') await api.say(['Andá. El Campeón te espera arriba.', 'Y ganale. Si no, quedo mal yo también.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Esta vez gané yo, pero el Campeón es otra cosa. Andá, te espera arriba.', 'Y ganale. Si no, quedo mal yo también.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcLeave('rival_final');
  },

  async champion(api) {
    const rematch = api.flag('champion');
    if (rematch) {
      const again = await api.ask('¿Querés la revancha contra el Campeón Obdulio?');
      if (!again) return;
    }
    const C = CHAMPION(rematch);
    await api.say(C.intro, { name: 'Obdulio' });
    const res = await api.battle(C, { music: 'battle' });
    if (res !== 'win') return;
    if (rematch) {
      await api.say(['Sos imparable. Volvé cuando quieras.'], { name: 'Obdulio' });
      return;
    }
    await api.say(['Felicitaciones, {player}. Desde hoy sos el nuevo Campeón de la Liga Oriental.', 'Tu nombre va a quedar en el Salón de la Fama del Centenario.'], { name: 'Obdulio' });
    api.setFlag('champion');
    await api.cinematic('champion_won');
    await api.hallOfFame();
    await api.credits();
    const fogs = ['fog1', 'fog2', 'fog3'].filter((f) => api.flag(f)).length;
    await api.say(fogs === 3 ? ['Las tres máquinas quedaron apagadas del todo. Un año difícil para el campo, pero el cielo volvió a ser de nadie.']
      : fogs === 0 ? ['Dejaste que algunas máquinas siguieran a cargo de los pueblos. El cielo sigue pidiendo permiso, pero nadie perdió la cosecha.']
        : ['Algunos pueblos pasaron un año difícil y otros siguen con la red de niebla. Nadie quedó del todo conforme, y todos entendieron por qué.']);
    await api.say(['Algunas semanas después, en Carmelo.', 'Se habla de criaturas legendarias avistadas en el país:', 'un viento helado en la Quebrada, un canto en la costa de Punta del Este.', 'Tu aventura continúa.']);
  },
  // A guard who asks a riddle before letting you through (placed on routes by addRouteStory).
  async route_riddle(api, npc) {
    const [q, opts, ans] = riddleFor(npc.riddleId);
    if (api.flag(npc.doneFlag)) return api.say(['Los animales ya se fueron del camino.', 'Yo sigo con mi trabajo: alguien tiene que cuidar el paso.'], { name: npc.name });
    await api.say(['Estos animales no se van a mover solos.', q], { name: npc.name, keep: true });
    // shuffled by the route so the right answer is not always the first
    const order = opts.map((_, i) => i).sort((a, b) => ((a * 7 + npc.riddleId.length) % 5) - ((b * 7 + npc.riddleId.length) % 5));
    const r = await api.choose(order.map((i) => opts[i]), { cancel: false });
    if (order[r] !== ans) return api.say('No es eso. Pensalo y volvé a intentar.', { name: npc.name });
    api.sfx('confirm');
    api.setFlag(npc.doneFlag);
    await api.say('Correcto. Con eso alcanza: los animales se apartan del camino.', { name: npc.name });
  },

  // Lever gate: pull the three levers in the right order (see addLeverGate).
  async route_palanca(api, npc) {
    const key = (k) => `rf_pl_${npc.routeId}_${k}`.slice(0, 40);
    if (api.flag(npc.doneFlag)) return api.say('La tranquera ya está abierta.', { name: npc.name });
    const n = [0, 1, 2].filter((k) => api.flag(key(k))).length;
    if (api.flag(key(npc.lever))) { for (let k = 0; k < 3; k++) api.setFlag(key(k), false); api.sfx('cancel'); return api.say('Soltaste la palanca. Los cerrojos vuelven a su lugar.', { name: npc.name }); }
    if (npc.order[n] === npc.lever) {
      api.setFlag(key(npc.lever));
      api.sfx('confirm');
      if (n === 2) {
        api.setFlag(npc.doneFlag);
        for (let k = 0; k < 3; k++) api.setFlag(key(k), false);
        return api.say('Se oye el último cerrojo. La tranquera se abre sola.', { name: npc.name });
      }
      return api.say(`${npc.name}: algo hizo clic. ${n === 0 ? 'Un cerrojo se soltó.' : 'Otro cerrojo cedió.'}`);
    }
    for (let k = 0; k < 3; k++) api.setFlag(key(k), false);
    api.sfx('cancel');
    await api.say('Algo hizo un ruido seco. Los cerrojos volvieron a su lugar.', { name: npc.name });
  },

  ...EVENT_SCRIPTS,
  ...FAVOR_SCRIPTS,
  ...MS_SCRIPTS,
};

// The late-game content was written for a longer climb: bring it down to the route's level curve.
// Elite Four and Champion follow the eighth gym (ace 47); side missions follow the city they take place in.
const LEAGUE_ACE = gymAce('montevideo');
[[1, 3], [2, 4], [3, 5], [4, 6]].forEach(([a, b], i) => { ELITES[i].team = rescaleTeam(ELITES[i].team, [LEAGUE_ACE + a, LEAGUE_ACE + b]); });
const EVENT_STOP = { refineria: 'durazno', parrilla: 'tacuarembo', aduana: 'rivera', radio: 'salto', muelle: 'paysandu' };
for (const [ev, stop] of Object.entries(EVENT_STOP)) EVENTS[ev].team = bossAt(stop, EVENTS[ev].team);
