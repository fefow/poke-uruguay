// Story scripts. Each receives the script API (see game/script-api.js) and the
// NPC that triggered it. Text uses Rioplatense Spanish ("vos"), in a sober tone aimed at adults.
import { SPECIES } from './species.js';
import { STOPS, GYM_STOPS, STOP_INDEX, mapBand, openFlag, gymAce, badgeOf } from './route.js';
import { teamOf } from './map-gen.js';
import { bossTeam, rescaleTeam } from './levels.js';

// The rival picks the creature the player's starter is strong against (like the modern games),
// so the first fights are winnable without grinding.
const COUNTER = { ceibito: 'carpinchito', tejuchispa: 'ceibito', carpinchito: 'tejuchispa' };
const LINE = {
  ceibito: ['ceibito', 'ceibal', 'ceibarbol'],
  tejuchispa: ['tejuchispa', 'tejubrasa', 'tejufogon'],
  carpinchito: ['carpinchito', 'carpincho', 'carpinchon'],
};

// Level range of each rival fight, by where on the route it happens (see RIVAL_AT in maps.js).
const RIVAL_LEVELS = [null, [13, 13], [19, 23], [27, 31], [37, 41], [49, 52]];

export function rivalTeamFor(playerStarter, stage) {
  const line = LINE[COUNTER[playerStarter]];
  const team = [
    [[line[0], 5]],
    [[line[0], 13]],
    [['teruterazo', 17], ['hornerazo', 17], ['zorrigris', 18], [line[1], 20]],
    // Lascano (before Rocha)
    [['hornerazo', 35], ['zorromonte', 36], ['yacaron', 36], ['coatimundi', 37], [line[2], 38]],
    // Sarandí Grande (before Durazno)
    [['zorromonte', 45], ['lobomarino', 45], ['venadalto', 46], ['yacaron', 46], ['coatimundi', 47], [line[2], 49]],
    // Estadio Centenario (before the Champion)
    [['carancho', 50], ['yacaron', 51], ['gliptodonte', 51], ['mantis', 52], ['venadalto', 52], [line[2], 54]],
  ][stage];
  return RIVAL_LEVELS[stage] ? rescaleTeam(team, RIVAL_LEVELS[stage]) : team;
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
    after: ['La Medalla Canelones es tuya.', 'Falta una sola medalla: Montevideo, el Palacio de la Luz.', 'Y después, Calima. Tené cuidado.'],
  },
  ute: {
    order: 8, id: 'leader_ute', name: 'Sofía', cls: 'Presidenta de UTE', look: 'leader_ute', ai: 'smart', items: ['mate'],
    team: [['luciernito', 7], ['nimbo', 7], ['cotorrayo', 9]], prize: 1400, badge: 'badge8', badgeName: 'Medalla Montevideo', reward: 'mate', rewardQty: 1, tm: 'mt_descarga',
    intro: ['Soy Sofía, presidenta de UTE, la empresa estatal que lleva la luz a todo el país.', 'Este es el Palacio de la Luz: desde acá se dirige la energía de Montevideo.', 'Veamos si resistís la corriente.'],
    lose: 'Se cortó el circuito. Fue un buen combate.',
    after: ['La Medalla Montevideo es tuya. Son doce: la Liga está abierta.', 'Pero antes del Estadio Centenario, Calima te espera en el puerto. Es el fundador del Equipo PP.'],
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
    after: ['La Medalla Treinta y Tres es tuya.', 'El jefe del Equipo PP subió a lo alto de la quebrada. Quiere capturar al Pampero.', 'Tenés que detenerlo.'],
  },
  ancap: {
    order: 7, id: 'leader_ancap', name: 'Candelaria', cls: 'Presidenta de ANCAP', look: 'leader_ancap', ai: 'smart', items: ['mate_dulce'],
    team: [['corcel', 34], ['fatuo', 35], ['escorpio', 36], ['crinfuego', 37], ['luzmala', 39]], prize: 4200, badge: 'badge7', badgeName: 'Medalla Durazno', reward: 'ultraesfera', rewardQty: 5, tm: 'mt_fogon',
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
    intro: ['Gracias por abrir el gimnasio, {player}. Estuve encerrada demasiado tiempo.', 'Soy Zoraida. Trabajo de noche, entre las sombras.', 'No me subestimes: la oscuridad también tiene sus reglas.'],
    lose: 'Salí de la sombra gracias a vos.',
    after: ['La Medalla Fray Bentos es tuya. Es la tercera de doce.', 'El Equipo PP usa el viejo Anglo como depósito. Ahí hay algo que no cierra.', 'Seguí hacia Paysandú y Salto. Entrená y curá a tu equipo en cada ciudad.'],
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
  [L.reward, L.rewardQty] = GYM_REWARD[idx];
}

export const CHAMPION = (rematch) => ({
  id: rematch ? 'champion_rematch' : 'champion', name: 'Obdulio', cls: 'Campeón', look: 'champion', ai: 'smart', items: ['dulce_de_leche', 'dulce_de_leche', 'chivito'],
  team: rescaleTeam([['capitan', 57], ['crinfuego', 57], ['albatros', 58], ['tucoterra', 58], ['yacaron', 58], ['aguaraflama', 60]], [54, 58]).map(([sp, l]) => [sp, Math.min(95, l + (rematch ? 14 : 0))]),
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

/** The lighthouse keeper's thanks: a ticket for the new Buquebus ferry docked in Montevideo. */
async function keeperTicket(api) {
  await api.say(['Mi hermano trabaja en el puerto de Montevideo. Hoy está atracado el Buquebus "China Zorrilla", el ferry nuevo que lleva el nombre de la actriz.', 'Con este ticket podés subir cuando llegues a la capital. Dicen que el capitán tiene algo para quien lo ayude.'], { name: 'Farero' });
  await api.give('ticket_ferry', 1);
  api.setFlag('got_ticket');
}

/**
 * Side missions: a building taken over by the Equipo PP. The recruits inside vanish once beaten, then the
 * boss appears; freeing the building gives a TM. Rooms are built in maps-act2.js (eventRoom).
 */
export const EVENTS = {
  parrilla: {
    flag: 'parrilla_clear', name: 'Capataz Rondeau', mt: 'mt_parrillada', prize: 2800,
    team: [['yarara', 40], ['cuervon', 40], ['pombero', 41], ['zorromonte', 42]],
    intro: ['Esta parrilla es ahora cuartel del Equipo PP. Sin asado, la gente no se junta; y sin gente, nadie nos molesta.', 'No te voy a dejar arruinar el plan.'],
    lose: 'Me quedé sin brasas.',
    after: ['Está bien. Nos vamos. Que sigan con su asado.'],
    thanks: ['La parrilla de la Patria Gaucha vuelve a abrir. Gracias, {player}.', 'Tomá esta MT: es la receta de mi abuelo, el fuego justo para cada corte.'],
  },
  aduana: {
    flag: 'aduana_clear', name: 'Inspector Bianchi', mt: 'mt_punio_gaucho', prize: 3000,
    team: [['yarara', 44], ['vespertino', 44], ['pombero', 45], ['caudillo', 46]],
    intro: ['La aduana ahora es del Equipo PP. Todo lo que cruza la frontera pasa por nosotros.', 'Documentos, por favor. Y un combate.'],
    lose: 'Sin sello no se pasa… y yo perdí el mío.',
    after: ['Está bien, nos vamos. Que la aduana vuelva a ser pública.'],
    thanks: ['La aduana de Rivera vuelve a funcionar. Gracias, {player}.', 'Tomá esta MT. La usan los pesadores de la frontera: puro puño y poco papel.'],
  },
  radio: {
    flag: 'radio_clear', name: 'Locutora Cáceres', mt: 'mt_psiquico', prize: 3300,
    team: [['vespertino', 46], ['pombero', 46], ['caudillo', 47], ['temblador', 48]],
    intro: ['Esta radio ahora transmite lo que el Equipo PP quiere que se oiga. Nada de pronósticos reales.', 'Salí al aire sin permiso, y no pienso callarme.'],
    lose: 'Se cortó la transmisión…',
    after: ['Está bien, me voy. Que vuelva la programación de siempre.'],
    thanks: ['La radio de Salto vuelve al aire. Gracias, {player}.', 'Tomá esta MT: con ella las ondas viajan directo a la mente de cualquiera.'],
  },
  muelle: {
    flag: 'muelle_clear', name: 'Contramaestre Vidal', mt: 'mt_bomba_lodo', prize: 3600,
    team: [['yarara', 49], ['patriarca', 49], ['caudillo', 50], ['temblador', 50]],
    intro: ['El muelle del puerto es nuestro. Por acá entra el material de las torres de niebla.', 'Quien quiera pasar, va a tener que hundirse primero.'],
    lose: 'Me hundí yo solo…',
    after: ['Está bien. Levanto el campamento. Que el muelle sea de todos otra vez.'],
    thanks: ['El muelle de Paysandú vuelve a trabajar. Gracias, {player}.', 'Tomá esta MT: la mejor arma contra el barro del río.'],
  },
};

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
          'Hace años estudié el clima del Río de la Plata junto a un colega, Calima. Hoy no sé dónde anda, pero el Pampero sigue siendo un misterio.',
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
        await api.say(['¡La carta! Gracias, {player}.', 'Es de un viejo colega. Dice que el Pampero se vio por el litoral.'], { name: 'Maestro Tabárez' });
        await api.say(['Como prometí: la PokeDex. Registra cada criatura que veas o captures.', 'Y unas Pokeballs para capturar criaturas salvajes.'], { name: 'Maestro Tabárez' });
        await api.give('uru_dex', 1);
        await api.give('esfera', 5);
        api.setFlag('dex');
      } else {
        await api.say(['Te pedí una carta del almacén de San José de Mayo, la próxima ciudad.', 'Cuando la tengas, traémela y te doy la PokeDex.'], { name: 'Maestro Tabárez' });
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
    api.sfx('catch');
    await api.say(`¡{player} recibió a ${sp.name}!`);
    const rk = COUNTER[key];
    await api.say([`Entonces yo me quedo con ${SPECIES[rk].name}.`, 'Tiene desventaja contra el tuyo, pero no pienso ponértelo fácil.'], { name: '{rival}' });
    await api.say(['{player}, probemos a nuestras criaturas.', 'Combatamos.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 0, 100, null, 'Elegí mal.', null), { canLose: true });
    api.setFlag('rival1');
    if (res === 'lose') await api.say(['Gané. Sigo siendo mejor.', 'Igual, tu criatura tiene potencial.'], { name: '{rival}' });
    else await api.say(['Fue suerte.', 'Voy a entrenar hasta superarte.'], { name: '{rival}' });
    api.healParty({ silent: true });
    await api.say(['Buen combate. Ya atendí a sus criaturas.',
      'Ahora, {player}: el país es grande. Hay doce Gimnasios, y el camino empieza acá, en Colonia, y termina en Montevideo.',
      'Si conseguís las doce medallas, podés desafiar a la Liga en el Estadio Centenario.',
      'Y tené cuidado con el Equipo PP. Últimamente aparece una niebla extraña en el litoral.',
      'Tu madre puede curar a tus criaturas en casa.',
      'Antes de irte, {player}, te pido un favor. En el almacén de San José de Mayo, la próxima ciudad, me guardan una carta.',
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
    await api.say(['Bienvenido a Montevideo. Trabajo en la oficina de turismo del Palacio.', 'Tomá, un mapa del país. Te marca las ciudades y las localidades.'], { name: 'Guía de turismo' });
    await api.give('mapa_uruguay', 1);
    api.setFlag('got_mapa');
    await api.say('Entre ciudad y ciudad hay localidades sin gimnasio, pero con almacenes y gente con cosas útiles.', { name: 'Guía de turismo' });
  },

  async gift_ros(api) {
    await api.say(['Pesqué en estos arroyos toda la vida.', 'Somos tres hermanos pescadores: uno vive en La Paloma, otro en Minas y el menor en Paysandú.', 'Cada uno te da una caña mejor, pero hay que ganársela con medallas.'], { name: 'Pescador retirado' });
  },

  // Three rods, each handed out later in the story: Vieja (La Paloma), Buena (Minas), Súper (Paysandú).
  async gift_cana(api) {
    if (api.flag('got_cana')) return api.say('Parate frente al agua y apretá A. Con esta caña solo pican las criaturas más comunes. Mi hermano en Minas tiene una mejor.', { name: 'Pescador' });
    if (api.badges() < 2) return api.say(['Soy pescador, como mis hermanos.', 'Todavía no te conozco. Volvé cuando tengas dos medallas y te presto una caña.'], { name: 'Pescador' });
    await api.say(['Tantos años de pesca y todavía me sorprende el río.', 'Tomá esta caña vieja: con ella pican las criaturas más comunes, nada del otro mundo.'], { name: 'Pescador' });
    await api.give('cana_pescar', 1);
    api.setFlag('got_cana');
    await api.say('Parate frente al agua y apretá el botón A. Con más medallas, mi hermano de Minas te dará una mejor.', { name: 'Pescador' });
  },

  async gift_cana2(api) {
    if (api.flag('got_cana2')) return api.say('Con la Caña Buena pican criaturas más grandes. La Súper Caña la tiene mi hermano menor, en Paysandú.', { name: 'Pescador' });
    if (!api.flag('got_cana')) return api.say('Mi hermano de La Paloma tiene una caña para empezar. Pasá primero por ahí.', { name: 'Pescador' });
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

  async gift_corte(api) {
    if (api.flag('got_machete')) return api.say('Un zarzal no es nada con un buen machete. Eso sí: la guardia solo deja cortar a quien ganó la Medalla Salto.', { name: 'Carpintero' });
    await api.say(['Trabajo la madera del puerto desde hace cuarenta años.', 'Tomá este machete. Sirve para abrirte paso entre zarzales.', 'Se usa parándote frente al zarzal y apretando A. Para cortar en los caminos del norte hace falta la Medalla Salto.'], { name: 'Carpintero' });
    await api.give('machete', 1);
    api.setFlag('got_machete');
  },

  async gift_surf(api) {
    if (api.flag('got_canoa')) return api.say('El Cuareim es manso, pero hay que respetarlo. La Canoa solo resiste con la Medalla Rivera.', { name: 'Pescador' });
    await api.say(['Vivo a orillas del río desde que nací.', 'Te regalo esta canoa. Caminá hacia el agua y subís sola.', 'Ojo: las corrientes de más al este son fuertes. Hace falta la Medalla Rivera para animarse.'], { name: 'Pescador' });
    await api.give('canoa', 1);
    api.setFlag('got_canoa');
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

  async garua(api) {
    if (api.flag('pp_clear')) return api.say('Mi plan fracasó. Esta vez de verdad.', { name: 'Garúa' });
    await api.say(['Así que lograste llegar hasta acá. Otra vez.', 'Te dije que el plan de la Represa era un ensayo.', 'Brumario cayó y Bruma también, pero las máquinas siguen en pie. Con ellas, la niebla vuelve en cuestión de semanas.', 'Desde esta fábrica se va a gobernar el clima del país.'], { name: 'Garúa' });
    const res = await api.battle({ id: 'garua', name: 'Garúa', cls: 'Comandante PP', look: 'garua', ai: 'smart', team: bossAt('minas', [['yarara', 36], ['cuervon', 37], ['lobomarino', 37], ['pombero', 37], ['caudillo', 38]]), prize: 4500, lose: 'Se apagaron las máquinas…', items: ['mate_dulce', 'mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('pp_clear');
    await api.say(['Está bien. Me rindo. Por ahora.', 'Pero no soy quien manda. PP quiere decir Proyecto Pampero, y el proyecto es de Calima.', 'Calima dejó el Anglo hace tiempo. Hoy espera en Montevideo, en el puerto, a quien llegue con las ocho medallas.', 'Llevate esto.'], { name: 'Garúa' });
    await api.give('mt_vendaval', 1);
    await api.say('Las máquinas de la fábrica se apagaron. Solo falta Calima, en Montevideo.');
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

  async rival_mvd(api) {
    if (api.flag('rival2')) return;
    await api.say(['{player}, te estaba esperando.', 'Me enteré de que le ganaste a Zoraida, en el Anglo.', 'Yo también estuve entrenando. Veamos quién está más fuerte.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 1, 700, null, 'Perdí. Buen combate.', null), { canLose: true });
    api.setFlag('rival2');
    if (res === 'win') await api.say(['Yo sigo hacia Paysandú. Nos vemos allá.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Esta vez gané yo. Entrená un poco más y volvé a intentarlo cuando quieras.', 'Yo sigo hacia Paysandú. Nos vemos allá.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcLeave('rival_mvd');
  },

  async nurse(api) {
    await api.say(['Bienvenido a la Policlínica.', 'Vamos a atender a tus criaturas.'], { name: 'Enfermera' });
    await api.healParty();
    api.setLastHeal();
    await api.say('Listo, están recuperadas. Volvé cuando lo necesites.', { name: 'Enfermera' });
  },

  async pc(api) {
    api.sfx('confirm');
    await api.openPC();
  },

  // San José de Mayo's storekeeper holds Tabárez's letter.
  async shop_carta(api, npc) {
    if (api.flag('has_starter') && !api.flag('dex') && !api.flag('got_carta')) {
      await api.say(['¿Venís de parte del Maestro Tabárez? Te estaba esperando.', 'Tengo esta carta para él. Llevásela con cuidado.'], { name: 'Almacenero' });
      await api.give('carta_tabarez', 1);
      api.setFlag('got_carta');
    }
    return SCRIPTS.shop(api, npc);
  },

  async shop(api, npc) {
    await api.say('Buenas. ¿Qué se lleva?', { name: 'Almacenero', keep: true });
    await api.openShop(npc.stock);
  },

  // Every city without a gym has a guard who opens the road to the next one after a friendly match.
  async town_gate(api, npc) {
    const i = STOP_INDEX[npc.stop];
    const here = STOPS[i];
    const next = STOPS[i + 1];
    const flag = openFlag(here.id);
    if (api.flag(flag)) return api.say([`El camino a ${next.name} está abierto.`, 'Cuidate en la ruta.'], { name: 'Guardia' });
    const [lo, hi] = mapBand(here.id);
    await api.say([`El camino a ${next.name} está cerrado por orden de la intendencia.`, 'Antes de dejar pasar a alguien, quiero ver cómo trata a sus criaturas.'], { name: 'Guardia' });
    const team = teamOf(['normal', 'lucha', 'tierra'], [hi - 1, hi, hi + 1], `gate_${here.id}`);
    const res = await api.battle({ id: `gate_${here.id}`, name: 'Guardia', cls: 'Guardia de ruta', look: 'cop', team, prize: (hi + 1) * 30, intro: null, lose: 'Todavía te falta.', after: null, ai: 'basic' }, { canLose: true });
    if (res !== 'win') return api.say('Entrená un poco y volvé. No hay apuro.', { name: 'Guardia' });
    api.setFlag(flag);
    await api.say([`Bien tratadas, tus criaturas. Pasá nomás: el camino a ${next.name} queda abierto.`], { name: 'Guardia' });
  },

  async leader(api, npc) {
    const L = LEADERS[npc.leader];
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
    const res = await api.battle(L);
    if (res !== 'win') return;
    api.setFlag(L.badge);
    const home = STOPS.find((st) => st.gym === npc.leader);
    if (home) api.setFlag(openFlag(home.id)); // winning the medal opens the road to the next city
    api.healParty({ silent: true });
    await api.say('Tus criaturas quedaron recuperadas.');
    api.sfx('levelup');
    await api.say(`¡{player} recibió la ${L.badgeName}!`);
    await api.give(L.reward, L.rewardQty);
    await api.give(L.tm, 1);
    await api.say(['Tomá también esta MT. Enseña un movimiento nuevo a una criatura compatible.'], { name: L.name });
    await api.say(L.after, { name: L.name });
  },

  async bruma(api) {
    await api.say(['Otra vez vos.', 'Sin la lámpara del faro, la niebla cubre la costa y nadie ve lo que hacemos.', 'Esta vez no hay torre que te frene. Vas a tener que pasar por mí.'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma', name: 'Bruma', cls: 'Admin. PP', look: 'bruma', ai: 'smart', team: bossAt('paloma', [['yararita', 22], ['zorrigris', 23], ['cuervon', 24]]), prize: 1500, lose: 'Imposible. Mi niebla…', items: ['mate'] });
    if (res !== 'win') return;
    await api.say(['Llevate tu lámpara.', 'Igual es tarde: Garúa ya puso a funcionar la fábrica de Minas.', 'Y Calima nos espera en Montevideo.'], { name: 'Bruma' });
    await api.give('lampara', 1);
    api.setFlag('cabo_clear');
    await api.npcLeave('bruma');
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
      await keeperTicket(api);
      return;
    }
    if (api.flag('lamp_returned')) {
      if (!api.flag('got_ticket') && !api.flag('ferry_done')) return keeperTicket(api);
      return api.say('Gracias a vos, los barcos navegan seguros.', { name: 'Farero' });
    }
    await api.say(['Se llevaron la lámpara. Fue una mujer vestida de gris, con capa.', 'Sigue afuera, del lado de las rocas.'], { name: 'Farero' });
  },

  async rival_ferry(api) {
    if (api.flag('rival3')) return;
    await api.say(['{player}. Te alcancé.', 'Cruzando esta frontera se acaba lo fácil. Antes, veamos quién es más fuerte.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 2, 1200, null, 'Sos un rival duro.', null), { canLose: true });
    api.setFlag('rival3');
    if (res === 'win') await api.say(['Bien. Andá vos primero. Yo sigo hacia Tacuarembó.', 'Pero en el Centenario te gano.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Todavía te falta. No pasa nada: entrená y volvé a medirte conmigo en el Centenario.', 'Yo sigo hacia Tacuarembó.'], { name: '{rival}' });
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
    await api.flash();
    await api.say(E.after, { name: E.name });
    await api.npcLeave(`boss_${npc.event}`);
    await api.say(E.thanks, { name: 'Dueño' });
    await api.give(E.mt, 1);
  },

  async event_owner(api, npc) {
    const E = EVENTS[npc.event];
    await api.say(['Gracias otra vez, {player}. Sin vos esto seguiría tomado.', 'Pasá cuando quieras.'], { name: 'Dueño' });
  },

  async ferry_captain(api) {
    if (api.flag('ferry_done')) return;
    await api.say(['Uf… perdón. Soy el capitán de este barco, y estoy mareado desde que zarpamos de prueba.', 'Lo único que me calma es un Mate, de esos bien cebados. Pero acá a bordo se acabó la yerba.'], { name: 'Capitán' });
    if (!api.hasItem('mate')) return api.say(['Si me traés un Mate, te lo voy a agradecer toda la vida.', 'En el almacén de Montevideo venden.'], { name: 'Capitán' });
    if (!(await api.ask('¿Le das el Mate al capitán?'))) return api.say('El capitán suspira. Cuando quieras, acá estoy.', { name: 'Capitán' });
    api.takeItem('mate');
    api.sfx('heal');
    await api.say('{player} le dio el Mate al capitán. Poco a poco recupera el color.');
    await api.say(['Mucho mejor. Me salvaste, {player}.', 'En agradecimiento, tomá esto: provisiones de a bordo y unas Ultraballs que el barco no va a usar.'], { name: 'Capitán' });
    await api.give('ultraesfera', 3);
    await api.give('pan_casero', 2);
    api.takeItem('ticket_ferry');
    api.setFlag('ferry_done');
    await api.say(['Ahora, a trabajar: el barco zarpa en minutos rumbo a Buenos Aires.', 'Todos los pasajeros tienen que bajar. ¡Gracias por todo!'], { name: 'Capitán' });
    await api.warp('montevideo', 27, 4, 'down');
    await api.say('Desde el muelle mirás cómo el Buquebus "China Zorrilla" se aleja. No va a volver a este puerto.');
  },

  async brumario(api) {
    await api.say(['Así que vos sos el entrenador que molesta a mis reclutas.', 'Soy Brumario, jefe del Equipo PP en el este.', 'El Pampero limpia el cielo y disipa la niebla. Si lo capturo, el país será nuestro: gris, quieto, sin viento.', 'Apartate de mi camino.'], { name: 'Brumario' });
    const res = await api.battle({ id: 'brumario', name: 'Brumario', cls: 'Jefe PP', look: 'brumario', ai: 'smart', team: bossAt('quebrada', [['yarara', 32], ['zorromonte', 32], ['cuervon', 33], ['lobomarino', 34]], 1), prize: 3000, lose: 'No… el viento vuelve.', items: ['mate_dulce', 'mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('quebrada_clear');
    await api.flash();
    api.sfx('evolve');
    await api.say(['Un viento helado baja de las sierras.', 'Una silueta enorme, con alas de tormenta, cruza el cielo.', 'El Pampero se aleja hacia el sur. La niebla se disipa.'],);
    await api.say(['Perdí. Pero esto no se termina acá.', 'Yo sólo respondo a Calima. Él nunca se ensucia las manos.', 'Si querés seguir, la fábrica de Minas es el próximo paso. Garúa la dirige.'], { name: 'Brumario' });
    await api.npcLeave('brumario');
    await api.say(['Tu celular vibra. Es un mensaje del Maestro Tabárez:', '"Me enteré de todo, {player}. Es un logro enorme, pero esto recién empieza.', 'Seguí hacia la costa de Rocha: en el faro de Cabo Polonio falta una lámpara.', 'Y más adelante, en Minas, hay una fábrica abandonada que volvió a funcionar. Mirala con cuidado."']);
    await api.say(['Otro mensaje, un minuto después:', '"Proyecto Pampero… ese nombre es mío. Fue un estudio que hice con Calima para predecir el clima con ayuda de las criaturas.', 'Se fue cuando me negué a venderlo. Si es él quien está detrás, esto también es cosa mía.', 'Nuestro laboratorio era el viejo Observatorio del Cerro, en Piriápolis. Si podés, pasá a ver qué quedó ahí."']);
  },

  async rival_r5(api) {
    if (api.flag('rival5')) return;
    await api.say(['{player}. Te estaba esperando en el camino.', 'Después de Treinta y Tres ya no queda nada fácil.', 'Antes de seguir hacia la costa, veamos quién viene mejor.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 3, 3200, null, 'Sos un rival duro. Muy duro.', null), { canLose: true });
    api.setFlag('rival5');
    if (res === 'win') await api.say(['Bien jugado. Yo sigo hacia Maldonado.', 'Nos vemos en el Centenario.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Todavía te falta un poco. Entrená y seguí.', 'Yo voy hacia Maldonado.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcLeave('rival_r5');
  },

  async rival_r24(api) {
    if (api.flag('rival6')) return;
    await api.say(['{player}. Ya sé lo del Equipo PP.', 'Mi tío fue socio de Calima. Nunca me lo dijo hasta ahora, y todavía no sé qué pensar.', 'Falta Durazno y después la capital, y no pienso llegar segundo.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 4, 5000, null, 'Me ganaste otra vez. Bien.', null), { canLose: true });
    api.setFlag('rival6');
    if (res === 'win') await api.say(['Andá vos. Yo te sigo de cerca.', 'En el Centenario nos vemos las caras.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Esta vez gané yo, pero la capital es cosa tuya. Andá.', 'En el Centenario nos vemos las caras.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcLeave('rival_r24');
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

  async guarderia(api) {
    await api.daycare();
  },

  async almada(api) {
    if (api.flag('obs_clear')) return;
    await api.say(['No esperaba visitas. Soy Almada, fui alumno del Maestro Tabárez en este mismo observatorio.', 'Estudiábamos cómo el Pampero ordena el clima del Río de la Plata. Calima y Tabárez dirigían el proyecto.', 'Cuando Tabárez se negó a vender los datos, Calima se quedó con los instrumentos y yo me fui con él.', 'Pensé que íbamos a proteger el clima. Resulta que quería controlarlo.'], { name: 'Almada' });
    await api.say('Acá guardo el registro original. Si querés leerlo, ganame primero.', { name: 'Almada' });
    const res = await api.battle({ id: 'almada', name: 'Almada', cls: 'Investigador PP', look: 'biologo', ai: 'smart', team: bossAt('piriapolis', [['luzmala', 37], ['fatuo', 37], ['pombero', 38], ['vespertino', 38], ['caudillo', 39]]), prize: 3200, lose: 'Tenías razón en venir hasta acá.', items: ['mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('obs_clear');
    api.setFlag('obs_log');
    await api.flash();
    await api.say(['Tomá el registro. Está firmado por los dos: Tabárez y Calima.', 'La última página la escribió Calima: "El Pampero tiene un ciclo. Si lo interrumpo, la niebla es mía para siempre".', 'Por eso quiere capturarlo. No lo odia: lo necesita.'], { name: 'Almada' });
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
    await api.say(['La luz del transmisor se apaga.', 'Afuera, la niebla se disipa y el sol vuelve a la ciudad.'], {});
    await api.say(['Perdí… otra vez.', 'Calima no se va a quedar en el norte. Dicen que prepara algo grande en Montevideo.', 'Hacé lo que quieras. Brumario espera en la Quebrada de los Cuervos.'], { name: 'Bruma' });
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
    await api.say(['Las turbinas vuelven a girar. En la ciudad, las luces se prenden una por una.'], {});
    await api.say(['Perdí. Pero esto es solo una pieza: Calima tiene otra torre en Rivera, y mucho más que eso.', 'Yo vuelvo a mi fábrica de Minas. Si querés alcanzarme, tendrás que llegar hasta allá.'], { name: 'Garúa' });
    await api.give('pan_casero', 1);
    await api.npcLeave('garua2');
  },

  async bruma_anglo(api) {
    await api.say(['Así que sos vos el que anda haciendo ruido en Fray Bentos.', 'Soy Bruma, administradora del Equipo PP.', 'Este frigorífico guarda las máquinas de niebla. Calima las necesita funcionando.'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma_anglo', name: 'Bruma', cls: 'Admin. PP', look: 'bruma', ai: 'smart', team: bossAt('fraybentos', [['yararita', 8], ['zorrigris', 9], ['lechuza', 10]], -2), prize: 700, lose: 'No… las máquinas…', items: ['mate'] });
    if (res !== 'win') return;
    api.setFlag('anglo_pp');
    await api.say(['Perdí. Pero el proyecto es más grande que este frigorífico.', 'Calima tiene torres y una represa, y yo no soy la única que sigue sus órdenes.'], { name: 'Bruma' });
    await api.give('mate', 1);
    await api.npcLeave('bruma_anglo');
  },

  async calima(api) {
    await api.say(['Así que sos vos.', 'Soy Calima, fundador del Proyecto Pampero. Lo que ustedes llaman Equipo PP.', 'Mi idea es simple: el clima es un recurso. Con las torres, la niebla se vende por días, por zonas, por contrato.', 'El Pampero natural era un estorbo. Por eso quise capturarlo.', 'Tabárez nunca se animó a ir más lejos. Yo sí, y por eso hoy estoy acá.'], { name: 'Calima' });
    await api.say(['Llegaste con las doce medallas. Se nota que no te asustan las torres.', 'Pero no vas a apagarme a mí.'], { name: 'Calima' });
    const res = await api.battle({ id: 'calima', name: 'Calima', cls: 'Fundador PP', look: 'calima', ai: 'smart', team: bossAt('montevideo', [['vespertino', 51], ['viudanegra', 52], ['tormenton', 53], ['yarara', 53], ['buho', 53], ['yacaron', 54]], 1), prize: 9000, lose: 'No… mi proyecto…', items: ['dulce_de_leche', 'dulce_de_leche', 'chivito'] });
    if (res !== 'win') return;
    api.setFlag('anglo_clear');
    await api.flash();
    api.sfx('evolve');
    await api.say(['Las últimas máquinas de niebla se apagan. Desde el puerto se ve el Río de la Plata, limpio, hasta el horizonte.'], {});
    await api.say(['Gané perdiendo… Ya no tengo equipo, ni dinero, ni torres.', 'Hacé lo que quieras. Pero el cielo nunca fue de nadie.'], { name: 'Calima' });
    await api.say(['Tu celular vibra otra vez. Es el Maestro Tabárez:', '"Lo lograron, {player}. El Equipo PP está disuelto.', 'Con las doce medallas y el Equipo PP disuelto, la Liga te espera en el Estadio Centenario.', 'Calima fue mi colega y no supe verlo venir. Gracias por corregir lo que yo no pude."']);
    await api.npcLeave('calima');
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
    if (api.flag('got_bici')) return api.say('Al norte de la ciudad empieza la Ciclovía. Solo se entra en bicicleta. Usala desde el menú.', { name: 'Vecina' });
    await api.say(['Vengo todos los días a regar estas plantas. Son del monte.', 'Esta bicicleta era de mi hijo y ya no la usa. Llevatela: va cuatro veces más rápido que caminando.', 'Se usa desde el menú. Bajo techo no se puede, y en combate no cambia nada.'], { name: 'Vecina' });
    await api.give('bici', 1);
    api.setFlag('got_bici');
    api.setFlag('gift_tac');
    await api.say('Al norte de la ciudad hay una Ciclovía. Solo se entra en bicicleta.', { name: 'Vecina' });
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
    await api.say(['Llegaste, {player}.', 'Desde Colonia que te vengo siguiendo.', 'Esta es mi revancha. Voy con todo.'], { name: '{rival}' });
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
    await api.hallOfFame();
    await api.credits();
    await api.say(['Algunas semanas después, en Colonia.', 'Se habla de criaturas legendarias avistadas en el país:', 'un viento helado en la Quebrada, un canto en la costa de Punta del Este.', 'Tu aventura continúa.']);
  },
};

// The late-game content was written for a longer climb: bring it down to the route's level curve.
// Elite Four and Champion follow the eighth gym (ace 47); side missions follow the city they take place in.
[[49, 52], [51, 54], [52, 55], [53, 56]].forEach((range, i) => { ELITES[i].team = rescaleTeam(ELITES[i].team, range); });
const EVENT_STOP = { parrilla: 'tacuarembo', aduana: 'rivera', radio: 'salto', muelle: 'paysandu' };
for (const [ev, stop] of Object.entries(EVENT_STOP)) EVENTS[ev].team = bossAt(stop, EVENTS[ev].team);
