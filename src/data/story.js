// Story scripts. Each receives the script API (see game/script-api.js) and the
// NPC that triggered it. Text uses Rioplatense Spanish ("vos"), in a sober tone aimed at adults.
import { SPECIES } from './species.js';

// The rival picks the creature the player's starter is strong against (like the modern games),
// so the first fights are winnable without grinding.
const COUNTER = { ceibito: 'carpinchito', tejuchispa: 'ceibito', carpinchito: 'tejuchispa' };
const LINE = {
  ceibito: ['ceibito', 'ceibal', 'ceibarbol'],
  tejuchispa: ['tejuchispa', 'tejubrasa', 'tejufogon'],
  carpinchito: ['carpinchito', 'carpincho', 'carpinchon'],
};

export function rivalTeamFor(playerStarter, stage) {
  const line = LINE[COUNTER[playerStarter]];
  return [
    [[line[0], 5]],
    [['zorrigris', 11], [line[0], 13]],
    [['teruterazo', 17], ['hornerazo', 17], ['zorrigris', 18], [line[1], 20]],
    // Ruta 5 (before Tacuarembó)
    [['hornerazo', 38], ['zorromonte', 39], ['yacaron', 39], ['coatimundi', 39], [line[2], 41]],
    // Ruta 24 (before Fray Bentos)
    [['zorromonte', 45], ['lobomarino', 45], ['venadalto', 46], ['yacaron', 46], ['coatimundi', 47], [line[2], 49]],
    // Estadio Centenario (before the Champion)
    [['carancho', 50], ['yacaron', 51], ['gliptodonte', 51], ['mantis', 52], ['venadalto', 52], [line[2], 54]],
  ][stage];
}
const rivalTeam = (api, stage) => rivalTeamFor(api.starterKey(), stage);

const rival = (api, stage, prize, intro, lose, after) => ({
  id: `rival_${stage}`, name: '{rival}', cls: 'Rival', look: 'rival', team: rivalTeam(api, stage), prize, intro, lose, after, ai: stage >= 2 ? 'smart' : 'basic',
});

export const LEADERS = {
  // Each gym leader heads a state body or is a figure from the city's history, and their type matches it.
  ute: {
    order: 1, id: 'leader_ute', name: 'Sofía', cls: 'Presidenta de UTE', look: 'leader_ute', ai: 'smart', items: ['mate'],
    team: [['luciernito', 7], ['nimbo', 7], ['cotorrayo', 9]], prize: 1400, badge: 'badge1', badgeName: 'Medalla Montevideo', reward: 'mate', rewardQty: 1, tm: 'mt_descarga',
    intro: ['Soy Sofía, presidenta de UTE, la empresa estatal que lleva la luz a todo el país.', 'Este es el Palacio de la Luz: desde acá se dirige la energía de Montevideo.', 'Veamos si resistís la corriente.'],
    lose: 'Se cortó el circuito. Fue un buen combate.',
    after: ['Te ganaste la Medalla Montevideo. Con ella la policía te deja pasar a la Interbalnearia.', 'Hay apagones raros en la costa este. Dicen que es obra del Equipo PP. Andá con cuidado.'],
  },
  ose: {
    order: 2, id: 'leader_ose', name: 'Lucía', cls: 'Presidenta de OSE', look: 'leader_ose', ai: 'smart', items: ['mate'],
    team: [['lobito', 15], ['mbigua', 16], ['carpincho', 18]], prize: 2200, badge: 'badge2', badgeName: 'Medalla Maldonado', reward: 'superesfera', rewardQty: 2, tm: 'mt_cascada',
    intro: ['Bienvenido a Punta del Este. Soy Lucía, presidenta de OSE.', 'Obras Sanitarias del Estado lleva el agua potable a cada casa del país, y la cuida como un tesoro.', 'Veamos si resistís la corriente.'],
    lose: 'Me superaste. Fue una derrota limpia.',
    after: ['La Medalla Maldonado es tuya.', 'El Equipo PP robó la lámpara del faro de Cabo Polonio, al este.', 'Si la recuperás, te van a dejar pasar por la Ruta 8.'],
  },
  lavalleja: {
    order: 3, id: 'leader_lavalleja', name: 'Juan A. Lavalleja', cls: 'Héroe de los Treinta y Tres', look: 'leader_lavalleja', ai: 'smart', items: ['mate_dulce'],
    team: [['mulitin', 27], ['hornerazo', 28], ['tortugal', 28], ['mulitron', 30]], prize: 3200, badge: 'badge3', badgeName: 'Medalla Treinta y Tres', reward: 'ultraesfera', rewardQty: 5, tm: 'mt_avalancha',
    intro: ['Soy Juan Antonio Lavalleja. Con treinta y dos compañeros desembarqué en la Agraciada para liberar la Provincia Oriental.', 'Esta ciudad lleva el nombre de aquel grupo: los Treinta y Tres Orientales.', 'La piedra de estas sierras lo resiste todo. Veamos si vos también.'],
    lose: 'Hacía mucho que nadie me ganaba.',
    after: ['La Medalla Treinta y Tres es tuya.', 'El jefe del Equipo PP subió a lo alto de la quebrada. Quiere capturar al Pampero.', 'Tenés que detenerlo.'],
  },
  ancap: {
    order: 4, id: 'leader_ancap', name: 'Candelaria', cls: 'Presidenta de ANCAP', look: 'leader_ancap', ai: 'smart', items: ['mate_dulce'],
    team: [['corcel', 34], ['fatuo', 35], ['escorpio', 36], ['crinfuego', 37], ['luzmala', 39]], prize: 4200, badge: 'badge4', badgeName: 'Medalla Durazno', reward: 'ultraesfera', rewardQty: 5, tm: 'mt_fogon',
    intro: ['Bienvenido a Durazno. Soy Candelaria, presidenta de ANCAP.', 'Mi organismo refina los combustibles del país: el fuego es mi oficio.', 'Veamos si tus criaturas aguantan el calor.'],
    lose: 'Se apagó la llama. Buen combate.',
    after: ['La Medalla Durazno es tuya.', 'Desde hace semanas el suelo se enfría raro: alguien está drenando el calor de las brasas con máquinas.', 'La fábrica abandonada de Minas volvió a funcionar. Me da mala espina.'],
  },
  mgap: {
    order: 5, id: 'leader_mgap', name: 'Ramón', cls: 'Ministro de Ganadería', look: 'leader_mgap', ai: 'smart', items: ['mate_dulce'],
    team: [['butiazal', 35], ['cortadora', 35], ['cardal', 36], ['curupi', 37], ['talamonte', 38]], prize: 4800, badge: 'badge5', badgeName: 'Medalla Tacuarembó', reward: 'pan_casero', rewardQty: 2, tm: 'mt_megaagotar',
    intro: ['Buenas, entrenador. Soy Ramón, ministro de Ganadería, Agricultura y Pesca.', 'Mi trabajo es cuidar el campo y el monte, que sostienen al país.', 'La naturaleza no se rinde fácil. Veamos si vos tampoco.'],
    lose: 'El monte te eligió. Es tuyo el triunfo.',
    after: ['La Medalla Tacuarembó es tuya.', 'Al este, camino a Rivera, la niebla es cada vez más espesa. Sale de una torre que levantaron los de gris.', 'Tené cuidado: en la frontera nadie te va a ayudar.'],
  },
  defensa: {
    order: 6, id: 'leader_defensa', name: 'Mariela', cls: 'Ministra de Defensa', look: 'leader_defensa', ai: 'smart', items: ['mate_dulce'],
    team: [['capataz', 42], ['grison', 42], ['coatimundi', 43], ['toro', 44], ['capitan', 45]], prize: 5200, badge: 'badge6', badgeName: 'Medalla Rivera', reward: 'alfajor_triple', rewardQty: 3, tm: 'mt_garra_charrua',
    intro: ['Soy Mariela, ministra de Defensa Nacional.', 'Cuido la frontera y entreno acá, en Rivera, con disciplina de cuartel.', 'Mostrame qué sabés hacer.'],
    lose: 'Ganaste con respeto. Eso vale mucho.',
    after: ['La Medalla Rivera es tuya.', 'Con la Torre apagada, el sol volvió a la ciudad. Gracias.', 'Al oeste, en Salto, la Represa se quedó sin luz. Eso no es casualidad.'],
  },
  quiroga: {
    order: 7, id: 'leader_quiroga', name: 'Horacio Quiroga', cls: 'Escritor', look: 'leader_quiroga', ai: 'smart', items: ['dulce_de_leche'],
    team: [['tonina', 44], ['venadalto', 45], ['mantis', 46], ['anta', 46], ['luzmala', 47], ['amatista', 48]], prize: 5800, badge: 'badge7', badgeName: 'Medalla Salto', reward: 'pan_casero', rewardQty: 3, tm: 'mt_premonicion',
    intro: ['Te esperaba, {player}. Escribí tu llegada antes de que llegaras.', 'Soy Horacio Quiroga. Nací en Salto y le debo a esta ciudad mis cuentos más oscuros.', 'Veamos si tu camino coincide con lo que escribí.'],
    lose: 'El final no era ese. Qué honor.',
    after: ['La Medalla Salto es tuya.', 'Al sur, en Fray Bentos, los de gris usan el viejo frigorífico como cuartel central.', 'El jefe de todo esto se llama Calima. Prepará a tus criaturas.'],
  },
  anglo: {
    order: 8, id: 'leader_anglo', name: 'Zoraida', cls: 'Directora del Museo del Anglo', look: 'leader_dark', ai: 'smart', items: ['dulce_de_leche', 'dulce_de_leche'],
    team: [['yarara', 44], ['zorromonte', 45], ['vespertino', 45], ['zarigueya', 45], ['buho', 46], ['yacaron', 47]], prize: 6500, badge: 'badge8', badgeName: 'Medalla Fray Bentos', reward: 'alfajor_triple', rewardQty: 5, tm: 'mt_sombra_nocturna',
    intro: ['Gracias por abrir el gimnasio, {player}. Estuve encerrada demasiado tiempo.', 'Soy Zoraida. Trabajo de noche, entre las sombras.', 'No me subestimes: la oscuridad también tiene sus reglas.'],
    lose: 'Salí de la sombra gracias a vos.',
    after: ['La Medalla Fray Bentos es tuya. Son ocho: la Liga está abierta.', 'Volvé a Montevideo. El Estadio Centenario te espera.', 'Con el Alto Mando se juega distinto. Entrená, curá a tu equipo y entrá con todo.'],
  },
};

export const CHAMPION = (rematch) => ({
  id: rematch ? 'champion_rematch' : 'champion', name: 'Obdulio', cls: 'Campeón', look: 'champion', ai: 'smart', items: ['dulce_de_leche', 'dulce_de_leche', 'chivito'],
  team: [['capitan', 57], ['crinfuego', 57], ['albatros', 58], ['tucoterra', 58], ['yacaron', 58], ['aguaraflama', 60]].map(([sp, l]) => [sp, Math.min(95, l + (rematch ? 14 : 0))]),
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
  await api.say(['Mi hermano trabaja en el puerto de Montevideo. Hoy está atracado el Buquebus "China Zorrilla", el ferry nuevo que lleva el nombre de la actriz.', 'Con este ticket podés subir. Dicen que el capitán tiene algo para quien lo ayude. Y la Ruta 8 sigue cerrada por zarzas: sin ese algo no vas a pasar.'], { name: 'Farero' });
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
    team: [['yarara', 49], ['lobomarino', 49], ['caudillo', 50], ['temblador', 50]],
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
    if (!api.flag('dex')) return;
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
    await api.say(['Llevate también esto: la PokeDex.', 'Registra cada criatura que veas o captures.', 'Y unas Pokeballs para capturar criaturas salvajes.'], { name: 'Maestro Tabárez' });
    await api.give('uru_dex', 1);
    await api.give('esfera', 5);
    api.setFlag('dex');
    await api.say(['{player}, probemos a nuestras criaturas.', 'Combatamos.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 0, 100, null, 'Elegí mal.', null), { canLose: true });
    api.setFlag('rival1');
    if (res === 'lose') await api.say(['Gané. Sigo siendo mejor.', 'Igual, tu criatura tiene potencial.'], { name: '{rival}' });
    else await api.say(['Fue suerte.', 'Voy a entrenar hasta superarte.'], { name: '{rival}' });
    api.healParty({ silent: true });
    await api.say(['Buen combate. Ya atendí a sus criaturas.',
      'Ahora, {player}: el país es grande. Hay ocho Gimnasios, desde Montevideo hasta Fray Bentos.',
      'Si conseguís las ocho medallas, podés desafiar a la Liga en el Estadio Centenario.',
      'Y tené cuidado con el Equipo PP. Últimamente aparece una niebla extraña en la costa.',
      'Tu madre puede curar a tus criaturas en casa. Buen viaje.'], { name: 'Maestro Tabárez' });
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

  async gift_cana(api) {
    if (api.flag('got_cana')) return api.say('Parate frente al agua y apretá el botón A. Cada orilla tiene sus propias criaturas.', { name: 'Pescador' });
    await api.say(['Hace cuarenta años que pesco en estos arroyos.', 'Ya estoy grande para andar con tanta caña. Tomá, que te va a servir.'], { name: 'Pescador' });
    await api.give('cana_pescar', 1);
    api.setFlag('got_cana');
    await api.say('Parate frente al agua y apretá el botón A. Algunas criaturas solo se encuentran así.', { name: 'Pescador' });
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
    if (!api.flag('got_canoa')) {
      await api.say(['Tengo una canoa de más, de cuando remaba por el arroyo.', 'Con ella podés navegar: caminá hacia el agua y subís sola.', 'Dicen que hay islitas con tesoros frente a las playas.'], { name: 'Surfista' });
      await api.give('canoa', 1);
      api.setFlag('got_canoa');
      return;
    }
    await api.say('Si te gusta el mar, no dejes de probar la pesca en La Paloma.', { name: 'Surfista' });
  },

  async garua(api) {
    if (api.flag('pp_clear')) return api.say('Mi plan fracasó. Esta vez de verdad.', { name: 'Garúa' });
    await api.say(['Así que lograste llegar hasta acá.', 'Soy Garúa, comandante del Equipo PP.', 'Brumario cayó, pero las máquinas siguen en pie. Con ellas, la niebla vuelve en cuestión de semanas.', 'Desde esta fábrica se va a gobernar el clima del país.'], { name: 'Garúa' });
    const res = await api.battle({ id: 'garua', name: 'Garúa', cls: 'Comandante PP', look: 'garua', ai: 'smart', team: [['yarara', 36], ['cuervon', 37], ['lobomarino', 37], ['pombero', 37], ['caudillo', 38]], prize: 4500, lose: 'Se apagaron las máquinas…', items: ['mate_dulce', 'mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('pp_clear');
    await api.say(['Está bien. Me rindo. Por ahora.', 'Pero no soy quien manda. PP quiere decir Proyecto Pampero, y el proyecto es de Calima.', 'Calima levantó torres de niebla en el norte: una en Rivera, otra en la Represa de Salto. Su cuartel está en Fray Bentos.', 'Llevate esto. Lo usábamos para vigilar el país desde el aire.', 'Silbá y un hornero te lleva a cualquier ciudad que ya conozcas.'], { name: 'Garúa' });
    await api.give('silbato', 1);
    await api.give('mt_vendaval', 1);
    await api.say('Las máquinas de la fábrica se apagaron. Pero el Equipo PP sigue activo en el norte.');
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
    await api.say(['{player}, te estaba esperando.', 'Me enteré de que le ganaste a la presidenta de UTE.', 'Yo también estuve entrenando. Veamos quién está más fuerte.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 1, 700, null, 'Perdí. Buen combate.', null), { canLose: true });
    api.setFlag('rival2');
    if (res === 'win') await api.say(['Yo sigo hacia Punta del Este. Nos vemos allá.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Esta vez gané yo. Entrená un poco más y volvé a intentarlo cuando quieras.', 'Yo sigo hacia Punta del Este. Nos vemos allá.'], { name: '{rival}' });
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

  async shop(api, npc) {
    await api.say('Buenas. ¿Qué se lleva?', { name: 'Almacenero', keep: true });
    await api.openShop(npc.stock);
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
    await api.say(['Un entrometido más.', 'Soy Bruma, del Equipo PP.', 'Sin la lámpara del faro, la niebla cubre la costa y nadie ve lo que hacemos.', 'No vas a arruinar nuestros planes.'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma', name: 'Bruma', cls: 'Admin. PP', look: 'bruma', ai: 'smart', team: [['yararita', 22], ['zorrigris', 23], ['cuervon', 24]], prize: 1500, lose: 'Imposible. Mi niebla…', items: ['mate'] });
    if (res !== 'win') return;
    await api.say(['Llevate tu lámpara.', 'Igual es tarde: el jefe Brumario ya va camino a la Quebrada de los Cuervos.', 'Con el Pampero en nuestro poder, la niebla será permanente.'], { name: 'Bruma' });
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
      await keeperTicket(api);
      return;
    }
    if (api.flag('lamp_returned')) {
      if (!api.flag('got_ticket') && !api.flag('ferry_done') && !api.flag('quebrada_clear')) return keeperTicket(api);
      return api.say('Gracias a vos, los barcos navegan seguros.', { name: 'Farero' });
    }
    await api.say(['Se llevaron la lámpara. Fue una mujer vestida de gris, con capa.', 'Sigue afuera, del lado de las rocas.'], { name: 'Farero' });
  },

  async rival_ferry(api) {
    if (api.flag('rival3')) return;
    await api.say(['{player}. No sabía que también tenías ticket.', 'Mi abuelo me consiguió uno para conocer el barco. Pero antes, veamos quién es más fuerte.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 2, 1200, null, 'Sos un rival duro.', null), { canLose: true });
    api.setFlag('rival3');
    if (res === 'win') await api.say(['Bien. Andá vos primero. Yo me quedo viendo el barco.', 'Pero en el Centenario te gano.'], { name: '{rival}' });
    else {
      await api.say(['Todavía te falta. No pasa nada: entrená y volvé a medirte conmigo en el Centenario.', 'Andá vos primero. Yo me quedo viendo el barco.'], { name: '{rival}' });
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
    await api.say(['Mucho mejor. Me salvaste, {player}.', 'En agradecimiento, tomá esto: un machete de a bordo. Lo uso para cortar cabos y zarzas.', 'Con él vas a poder abrirte paso en el monte. Lo vas a necesitar para seguir tu viaje.'], { name: 'Capitán' });
    await api.give('machete', 1);
    api.setFlag('got_machete');
    api.takeItem('ticket_ferry');
    api.setFlag('ferry_done');
    await api.say(['Ahora, a trabajar: el barco zarpa en minutos rumbo a Buenos Aires.', 'Todos los pasajeros tienen que bajar. ¡Gracias por todo!'], { name: 'Capitán' });
    await api.warp('montevideo', 27, 4, 'down');
    await api.say('Desde el muelle mirás cómo el Buquebus "China Zorrilla" se aleja. No va a volver a este puerto.');
  },

  async brumario(api) {
    await api.say(['Así que vos sos el entrenador que molesta a mis reclutas.', 'Soy Brumario, jefe del Equipo PP en el este.', 'El Pampero limpia el cielo y disipa la niebla. Si lo capturo, el país será nuestro: gris, quieto, sin viento.', 'Apartate de mi camino.'], { name: 'Brumario' });
    const res = await api.battle({ id: 'brumario', name: 'Brumario', cls: 'Jefe PP', look: 'brumario', ai: 'smart', team: [['yarara', 32], ['zorromonte', 32], ['cuervon', 33], ['lobomarino', 34]], prize: 3000, lose: 'No… el viento vuelve.', items: ['mate_dulce', 'mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('quebrada_clear');
    await api.flash();
    api.sfx('evolve');
    await api.say(['Un viento helado baja de las sierras.', 'Una silueta enorme, con alas de tormenta, cruza el cielo.', 'El Pampero se aleja hacia el sur. La niebla se disipa.'],);
    await api.say(['Perdí. Pero esto no se termina acá.', 'Yo sólo respondo a Calima. Él nunca se ensucia las manos.', 'Si querés seguir, la fábrica de Minas es el próximo paso. Garúa la dirige.'], { name: 'Brumario' });
    await api.npcLeave('brumario');
    await api.say(['Tu celular vibra. Es un mensaje del Maestro Tabárez:', '"Me enteré de todo, {player}. Es un logro enorme, pero esto recién empieza.', 'Quedan muchas ciudades con gimnasio al oeste y al norte: empezá por Durazno, al oeste de Minas.', 'Y con la medalla en mano, mirá la fábrica abandonada."']);
    await api.say(['Otro mensaje, un minuto después:', '"Proyecto Pampero… ese nombre es mío. Fue un estudio que hice con Calima para predecir el clima con ayuda de las criaturas.', 'Se fue cuando me negué a venderlo. Si es él quien está detrás, esto también es cosa mía.', 'Nuestro laboratorio era el viejo Observatorio del Cerro, en Piriápolis. Si podés, pasá a ver qué quedó ahí."']);
  },

  async rival_r5(api) {
    if (api.flag('rival5')) return;
    await api.say(['{player}. Te estaba esperando en el camino.', 'Los de gris cortaron la ruta, pero no me van a frenar a mí.', 'Antes de entrar a Tacuarembó, veamos quién viene mejor.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 3, 3200, null, 'Sos un rival duro. Muy duro.', null), { canLose: true });
    api.setFlag('rival5');
    if (res === 'win') await api.say(['Bien jugado. Yo sigo hacia Rivera: algo raro hay en esa torre.', 'Nos vemos en el Centenario.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Todavía te falta un poco. Entrená y seguí.', 'Yo voy hacia Rivera: algo raro hay en esa torre.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcLeave('rival_r5');
  },

  async rival_r24(api) {
    if (api.flag('rival6')) return;
    await api.say(['{player}. Ya sé lo de Calima.', 'Mi tío fue su socio. Nunca me lo dijo hasta ahora, y todavía no sé qué pensar.', 'Fray Bentos es el último paso antes de la Liga, y no pienso quedarme atrás.', 'Mostrame cuánto mejoraste.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 4, 5000, null, 'Me ganaste otra vez. Bien.', null), { canLose: true });
    api.setFlag('rival6');
    if (res === 'win') await api.say(['Andá vos. Yo me quedo vigilando que no escape nadie.', 'En el Centenario nos vemos las caras.'], { name: '{rival}' });
    else {
      api.healParty({ silent: true });
      await api.say(['Esta vez gané yo, pero el frigorífico es cosa tuya. Andá.', 'En el Centenario nos vemos las caras.'], { name: '{rival}' });
      await api.say('Tus criaturas quedaron recuperadas.');
    }
    await api.npcLeave('rival_r24');
  },

  async safari_clerk(api) {
    await api.say(['Bienvenido al Safari Pan de Azúcar. Es un parque con criaturas de todo el país, sueltas y a la vista.', 'Se paga por tiempo de visita. Pasado ese tiempo suena una campana y los guardias te acompañan a la salida.', 'Un minuto antes te vamos a avisar. No se devuelve el dinero si salís antes.'], { name: 'Boletería' });
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
    const res = await api.battle({ id: 'almada', name: 'Almada', cls: 'Investigador PP', look: 'biologo', ai: 'smart', team: [['luzmala', 37], ['fatuo', 37], ['pombero', 38], ['vespertino', 38], ['caudillo', 39]], prize: 3200, lose: 'Tenías razón en venir hasta acá.', items: ['mate_dulce'] });
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
    await api.say(['Volvimos a vernos.', 'Después de Cabo Polonio juré que no me ganarías otra vez.', 'Esta torre emite la niebla que cubre Rivera. Mientras esté encendida, nadie ve lo que hacemos.'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma2', name: 'Bruma', cls: 'Admin. PP', look: 'bruma', ai: 'smart', team: [['yarara', 42], ['vespertino', 43], ['viudanegra', 43], ['zarigueya', 44], ['zorromonte', 44]], prize: 5000, lose: 'No… la niebla…', items: ['dulce_de_leche'] });
    if (res !== 'win') return;
    api.setFlag('torre_clear');
    await api.flash();
    api.sfx('evolve');
    await api.say(['La luz del transmisor se apaga.', 'Afuera, la niebla se disipa y el sol vuelve a la ciudad.'], {});
    await api.say(['Perdí… otra vez.', 'Calima tiene otra torre: la Represa de Salto Grande. Ahí le roban electricidad a todo el litoral.', 'Hacé lo que quieras. Él tiene el Anglo, y el Anglo es una fortaleza.'], { name: 'Bruma' });
    await api.give('pan_casero', 1);
    await api.npcLeave('bruma2');
    await api.say('Ya podés entrar al gimnasio de Rivera.');
  },

  async garua2(api) {
    await api.say(['Otra vez vos.', 'Mi plan en Minas fue un ensayo. Esta es la verdadera operación.', 'La Represa mueve las torres: sin electricidad no hay niebla. Y yo controlo los interruptores.'], { name: 'Garúa' });
    const res = await api.battle({ id: 'garua2', name: 'Garúa', cls: 'Comandante PP', look: 'garua', ai: 'smart', team: [['yarara', 46], ['lobomarino', 46], ['vespertino', 47], ['pombero', 47], ['caudillo', 48], ['temblador', 48]], prize: 6000, lose: 'Otra vez a oscuras…', items: ['dulce_de_leche', 'dulce_de_leche'] });
    if (res !== 'win') return;
    api.setFlag('represa_clear');
    await api.flash();
    api.sfx('levelup');
    await api.say(['Las turbinas vuelven a girar. En la ciudad, las luces se prenden una por una.'], {});
    await api.say(['Me retiro del Equipo PP. Ya no tiene sentido.', 'Calima usa a todos. Si lo detenés, quizás recupere algo de dignidad.', 'Está en lo alto del Anglo, en Fray Bentos. Cuidado con Brumario: lo puso de guardia.'], { name: 'Garúa' });
    await api.give('pan_casero', 1);
    await api.npcLeave('garua2');
    await api.say('Ya podés seguir hacia el sur, a Paysandú y Fray Bentos.');
  },

  async brumario2(api) {
    await api.say(['Llegaste lejos, entrenador.', 'Calima me puso a custodiar esta escalera. Si caigo, que me perdone.', 'No te voy a facilitar nada.'], { name: 'Brumario' });
    const res = await api.battle({ id: 'brumario2', name: 'Brumario', cls: 'Jefe PP', look: 'brumario', ai: 'smart', team: [['yarara', 48], ['zorromonte', 49], ['cuervon', 49], ['lobomarino', 50], ['viudanegra', 50], ['yacaron', 51]], prize: 6500, lose: 'Se acabó.', items: ['dulce_de_leche', 'dulce_de_leche'] });
    if (res !== 'win') return;
    api.setFlag('anglo_brumario');
    await api.say(['Adelante. Calima está en la dirección, arriba.', 'Yo ya no tengo nada que hacer en este equipo.'], { name: 'Brumario' });
    await api.npcLeave('brumario2');
  },

  async calima(api) {
    await api.say(['Así que sos vos.', 'Soy Calima, fundador del Proyecto Pampero. Lo que ustedes llaman Equipo PP.', 'Mi idea es simple: el clima es un recurso. Con las torres, la niebla se vende por días, por zonas, por contrato.', 'El Pampero natural era un estorbo. Por eso quise capturarlo.', 'Tabárez nunca se animó a ir más lejos. Yo sí, y por eso hoy estoy acá.'], { name: 'Calima' });
    await api.say(['Lástima que hayas apagado las torres.', 'Pero no vas a apagarme a mí.'], { name: 'Calima' });
    const res = await api.battle({ id: 'calima', name: 'Calima', cls: 'Fundador PP', look: 'calima', ai: 'smart', team: [['vespertino', 51], ['viudanegra', 52], ['tormenton', 53], ['yarara', 53], ['buho', 53], ['yacaron', 54]], prize: 9000, lose: 'No… mi proyecto…', items: ['dulce_de_leche', 'dulce_de_leche', 'chivito'] });
    if (res !== 'win') return;
    api.setFlag('anglo_clear');
    await api.flash();
    api.sfx('evolve');
    await api.say(['Las últimas máquinas de niebla se apagan. Desde la ventana se ve el río Uruguay, limpio, hasta el otro lado.'], {});
    await api.say(['Gané perdiendo… Ya no tengo equipo, ni dinero, ni torres.', 'Hacé lo que quieras. Pero el cielo nunca fue de nadie.'], { name: 'Calima' });
    await api.say(['Tu celular vibra otra vez. Es el Maestro Tabárez:', '"Lo lograron, {player}. El Equipo PP está disuelto.', 'El gimnasio de Fray Bentos ya reabrió. Con la octava medalla, la Liga te espera en el Estadio Centenario.', 'Calima fue mi colega y no supe verlo venir. Gracias por corregir lo que yo no pude."']);
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
