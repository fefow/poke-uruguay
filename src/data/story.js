// Story scripts. Each receives the script API (see game/script-api.js) and the
// NPC that triggered it. Text uses Rioplatense Spanish ("vos").
import { SPECIES } from './species.js';

const COUNTER = { ceibito: 'tejuchispa', tejuchispa: 'carpinchito', carpinchito: 'ceibito' };
const LINE = {
  ceibito: ['ceibito', 'ceibal', 'ceibarbol'],
  tejuchispa: ['tejuchispa', 'tejubrasa', 'tejufogon'],
  carpinchito: ['carpinchito', 'carpincho', 'carpinchon'],
};

function rivalTeam(api, stage) {
  const line = LINE[COUNTER[api.starterKey()]];
  return [
    [[line[0], 5]],
    [['teruterito', 9], [line[0], 11]],
    [['teruterazo', 24], ['hornerazo', 24], ['zorromonte', 25], [line[1], 27]],
    [['teruterazo', 37], ['zorromonte', 37], ['hornerazo', 38], ['yacaron', 38], [line[2], 41]],
  ][stage];
}

const rival = (api, stage, prize, intro, lose, after) => ({
  id: `rival_${stage}`, name: '{rival}', cls: 'Rival', look: 'rival', team: rivalTeam(api, stage), prize, intro, lose, after, ai: stage >= 2 ? 'smart' : 'basic',
});

export const LEADERS = {
  lucia: {
    id: 'leader_lucia', name: 'Lucía', cls: 'Líder', look: 'leader_water', ai: 'smart', items: ['mate'],
    team: [['lobito', 12], ['mbigua', 12], ['carpincho', 14]], prize: 1400, badge: 'badge1', badgeName: 'Medalla Rambla', reward: 'mate', rewardQty: 3,
    intro: ['¡Hola! Soy Lucía, líder del Gimnasio de Montevideo.', 'Nado en la Rambla todas las mañanas, haga frío o calor.', '¿Vos y tus criaturas aguantan la corriente del Plata? ¡Veamos!'],
    lose: '¡Uf! Me llevaste puesta como una ola.',
    after: ['Te ganaste la Medalla Rambla. Con ella la policía te deja pasar a la Interbalnearia.', 'Se dice que el Equipo Niebla anda por la costa este. ¡Cuidate!'],
  },
  sofia: {
    id: 'leader_sofia', name: 'Sofía', cls: 'Líder', look: 'leader_elec', ai: 'smart', items: ['mate'],
    team: [['luciernito', 19], ['cotorrayo', 20], ['luceron', 22]], prize: 2200, badge: 'badge2', badgeName: 'Medalla Ola', reward: 'superesfera', rewardQty: 5,
    intro: ['¡Bienvenido a Punta! Soy Sofía.', 'Mis criaturas juntan la estática de las tormentas de verano.', '¡Preparate para un shock!'],
    lose: '¡Me dejaste sin batería!',
    after: ['La Medalla Ola es tuya.', 'Escuché que el Equipo Niebla se llevó la lámpara del faro de Cabo Polonio, al este.', 'Si la recuperás, seguro te dejan pasar por la Ruta 8.'],
  },
  aparicio: {
    id: 'leader_aparicio', name: 'Don Aparicio', cls: 'Líder', look: 'gaucho', ai: 'smart', items: ['mate_dulce'],
    team: [['mulitin', 29], ['hornerazo', 30], ['tortugal', 30], ['mulitron', 32]], prize: 3200, badge: 'badge3', badgeName: 'Medalla Quebrada', reward: 'ultraesfera', rewardQty: 5,
    intro: ['Buenas, gurí. Soy Aparicio.', 'Cuido estas sierras desde hace sesenta inviernos.', 'La piedra de la quebrada aguanta todo. ¿Vos aguantás?'],
    lose: '¡Pucha! Hacía años que nadie me ganaba.',
    after: ['La Medalla Quebrada es tuya.', 'El jefe del Equipo Niebla subió a lo alto de la quebrada. Quiere atrapar al Pampero.', '¡Andá, que el país te necesita!'],
  },
};

const CHAMPION = (rematch) => ({
  id: rematch ? 'champion_rematch' : 'champion', name: 'Obdulio', cls: 'Campeón', look: 'champion', ai: 'smart', items: ['dulce_de_leche', 'dulce_de_leche'],
  team: [['nanduro', 40], ['zorromonte', 40], ['yacaron', 41], ['lobomarino', 41], ['gatomontes', 41], ['aguaraflama', 43]].map(([s, l]) => [s, l + (rematch ? 14 : 0)]),
  prize: rematch ? 12000 : 8000,
  intro: rematch
    ? ['¡Volviste, {player}! El Centenario siempre está abierto para una revancha.', 'Esta vez no me guardo nada.']
    : ['Así que vos sos {player}.', 'Soy Obdulio, Campeón de la Liga Oriental.', 'En este estadio se ganó el primer Mundial. Acá se juega con garra.', '¡Que empiece el partido!'],
  lose: rematch ? '¡Qué partidazo!' : '…Ganaste. Limpio y con garra.',
  after: ['Sos un verdadero campeón.'],
});

export const SCRIPTS = {
  async mom(api) {
    if (!api.flag('has_starter')) {
      await api.say(['¡{player}! ¡Por fin te levantaste!', 'La Profesora Arazá te está esperando en su laboratorio.', 'Es el edificio de techo violeta. ¡Andá, que hoy es tu gran día!'], { name: 'Mamá' });
      return;
    }
    await api.say(['¡Mirá qué bien se te ve!', 'Descansá un poquito. Te preparo un té de marcela.'], { name: 'Mamá' });
    await api.healParty();
    await api.say('¡Listo! Tus criaturas están como nuevas. ¡Cuidate mucho!', { name: 'Mamá' });
  },

  async rival_sister(api) {
    if (!api.flag('got_map_gift')) {
      await api.say(['Hola, {player}. Mi hermano {rival} ya salió para el laboratorio.', 'Siempre quiere ser el primero en todo…', 'Tomá, llevate esto para el viaje.'], { name: 'Hermana' });
      await api.give('te_marcela', 3);
      api.setFlag('got_map_gift');
    } else {
      await api.say(['¡Mucha suerte en tu viaje! Si ves a {rival}, decile que llame a casa.'], { name: 'Hermana' });
    }
  },

  async prof(api) {
    if (!api.flag('has_starter')) {
      if (!api.flag('met_prof')) {
        api.setFlag('met_prof');
        await api.say([
          '¡{player}! ¡Llegaste!',
          'Soy la Profesora Arazá. Estudio a las criaturas del Uruguay.',
          'Viven en los montes, las playas, las sierras y hasta en la Rambla.',
          'Hoy vas a elegir a tu primer compañero.',
          'En la mesa hay tres Esferas. Elegí la que más te guste.',
        ], { name: 'Prof. Arazá' });
        await api.say('¡Eh! ¿Y yo qué? ¡Yo llegué primero!', { name: '{rival}' });
        await api.say('Tranquilo, {rival}. Vos elegís después.', { name: 'Prof. Arazá' });
      } else {
        await api.say('Elegí una de las Esferas de la mesa.', { name: 'Prof. Arazá' });
      }
      return;
    }
    if (!api.flag('dex')) return;
    const seen = api.state.dex.seen.length;
    const caught = api.state.dex.caught.length;
    await api.say([`Veamos tu UruDex… Viste ${seen} y atrapaste ${caught} especies.`,
      caught >= 39 ? '¡Increíble! ¡Lo completaste casi todo!' : caught >= 20 ? '¡Vas muy bien! Seguí recorriendo el país.' : 'Hay muchas más criaturas por descubrir. ¡Seguí explorando!'], { name: 'Prof. Arazá' });
  },

  async starter(api, npc) {
    const key = npc.species;
    const sp = SPECIES[key];
    await api.showCreature(key);
    const ok = await api.ask(`¿Elegís a ${sp.name}, la criatura de tipo ${api.typeNames(key)}?`);
    api.hideCreature();
    if (!ok) return;
    api.setFlag('has_starter');
    api.setFlag(`starter_${key}`);
    api.setFlag('starter_key');
    api.giveCreature(key, 5, { silent: true });
    api.sfx('catch');
    await api.say(`¡{player} recibió a ${sp.name}!`);
    const rk = COUNTER[key];
    await api.say([`¡Entonces yo me quedo con ${SPECIES[rk].name}!`, '¡Es justo el que le gana al tuyo, je!'], { name: '{rival}' });
    await api.say(['Ahora tomá esto también: la UruDex.', 'Registra cada criatura que veas o atrapes.', 'Y unas Esferas para atrapar criaturas salvajes.'], { name: 'Prof. Arazá' });
    await api.give('uru_dex', 1);
    await api.give('esfera', 5);
    api.setFlag('dex');
    await api.say(['¡{player}! ¡Probemos nuestras criaturas!', '¡Batalla ya!'], { name: '{rival}' });
    const res = await api.battle(rival(api, 0, 100, null, '¡No puede ser! ¡Elegí mal!', null), { canLose: true });
    api.setFlag('rival1');
    if (res === 'lose') await api.say(['¡Ja! ¡Gané! Soy el mejor.', 'Igual… tu criatura tiene potencial.'], { name: '{rival}' });
    else await api.say(['Bah, fue suerte.', '¡Me voy a hacer más fuerte que vos!'], { name: '{rival}' });
    api.healParty({ silent: true });
    await api.say(['¡Qué batalla! Ya les curé las heridas.',
      'Ahora, {player}: el país es grande. Hay tres Gimnasios, en Montevideo, Punta del Este y Treinta y Tres.',
      'Si conseguís las tres medallas, podés desafiar al Campeón en el Estadio Centenario.',
      'Y cuidado con el Equipo Niebla. Últimamente aparece niebla muy rara en la costa…',
      'Tu mamá te puede curar en casa. ¡Buen viaje!'], { name: 'Prof. Arazá' });
  },

  async gift_te_marcela(api) {
    if (api.flag('gift_r1')) return api.say('Que tengas buen viaje. Y tomá mate, que hace bien.', { name: 'Abuelo' });
    await api.say(['¡Ah, un entrenador joven! Tomá, para el camino.'], { name: 'Abuelo' });
    await api.give('esfera', 3);
    api.setFlag('gift_r1');
  },

  async gift_garrapinada(api) {
    if (api.flag('gift_garr')) return api.say('¿Viste los carritos de garrapiñada en la Rambla? ¡Qué olor!', { name: 'Vecina' });
    await api.say('¡Recién compré garrapiñada en la Rambla! Tomá una, hace que tu criatura suba de nivel.', { name: 'Vecina' });
    await api.give('garrapinada', 1);
    api.setFlag('gift_garr');
  },

  async rival_mvd(api) {
    if (api.flag('rival2')) return;
    await api.say(['¡{player}! ¡Te estaba esperando!', 'Ya atrapé una criatura nueva en la Ruta 1.', '¡A ver si seguís siendo tan suertudo!'], { name: '{rival}' });
    const res = await api.battle(rival(api, 1, 400, null, '¡Otra vez! ¿Cómo hacés?', null));
    if (res !== 'win') return;
    api.setFlag('rival2');
    await api.say(['Voy al gimnasio antes que vos. ¡Chau!'], { name: '{rival}' });
    await api.npcLeave('rival_mvd');
  },

  async nurse(api) {
    await api.say(['¡Bienvenido a la Policlínica!', 'Vamos a atender a tus criaturas.'], { name: 'Enfermera' });
    await api.healParty();
    api.setLastHeal();
    await api.say('¡Listo! Están como nuevas. ¡Volvé cuando quieras!', { name: 'Enfermera' });
  },

  async pc(api) {
    api.sfx('confirm');
    await api.openPC();
  },

  async shop(api, npc) {
    await api.say('¡Buenas! ¿Qué vas a llevar?', { name: 'Almacenero', keep: true });
    await api.openShop(npc.stock);
  },

  async leader(api, npc) {
    const L = LEADERS[npc.leader];
    if (api.flag(L.badge)) {
      await api.say(L.after, { name: L.name });
      return;
    }
    await api.say(L.intro, { name: L.name });
    const res = await api.battle(L);
    if (res !== 'win') return;
    api.setFlag(L.badge);
    api.sfx('levelup');
    await api.say(`¡{player} recibió la ${L.badgeName}!`);
    await api.give(L.reward, L.rewardQty);
    await api.say(L.after, { name: L.name });
  },

  async bruma(api) {
    await api.say(['Vaya, vaya. Un gurí metido.', 'Soy Bruma, del Equipo Niebla.', 'Sin la lámpara del faro, la niebla cubre la costa y nadie ve lo que hacemos.', '¡No vas a arruinar nuestros planes!'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma', name: 'Bruma', cls: 'Admin. Niebla', look: 'boss', ai: 'smart', team: [['yararita', 22], ['zorrigris', 23], ['cuervon', 24]], prize: 1500, lose: '¡Imposible! ¡Mi niebla!', items: ['mate'] });
    if (res !== 'win') return;
    await api.say(['¡Bah! Llevate tu lamparita.', 'Igual es tarde: el jefe Brumario ya va camino a la Quebrada de los Cuervos.', '¡Con el Pampero en nuestro poder, la niebla será eterna!'], { name: 'Bruma' });
    await api.give('lampara', 1);
    api.setFlag('cabo_clear');
    await api.npcLeave('bruma');
    await api.say('Deberías devolverle la lámpara al farero. Está adentro del faro.');
  },

  async keeper(api) {
    if (api.hasItem('lampara')) {
      await api.say(['¡La lámpara! ¡La recuperaste!', 'Esta noche el faro de Cabo Polonio vuelve a brillar.', 'Tomá, es lo menos que puedo hacer.'], { name: 'Farero' });
      api.takeItem('lampara');
      await api.give('superesfera', 5);
      await api.give('alfajor', 2);
      api.setFlag('lamp_returned');
      await api.say(['La policía ya abrió la Ruta 8, al norte de Montevideo.', 'Dicen que el Equipo Niebla fue para la Quebrada de los Cuervos.'], { name: 'Farero' });
      return;
    }
    if (api.flag('lamp_returned')) return api.say('Gracias a vos, los barcos navegan seguros.', { name: 'Farero' });
    await api.say(['¡Se llevaron la lámpara! Una mujer de gris, con una capa…', 'Está afuera, del lado de las rocas.'], { name: 'Farero' });
  },

  async rival_r8(api) {
    if (api.flag('rival3')) return;
    await api.say(['¡{player}! Ya sé lo del Equipo Niebla.', 'Pero antes de ir a la Quebrada… ¡vamos a ver quién es más fuerte!'], { name: '{rival}' });
    const res = await api.battle(rival(api, 2, 1200, null, '¡Sos un hueso duro de roer!', null));
    if (res !== 'win') return;
    api.setFlag('rival3');
    await api.say(['Bien. Andá vos primero. Yo te cubro la espalda.', '…¡Pero en el Centenario te gano!'], { name: '{rival}' });
    await api.npcLeave('rival_r8');
  },

  async brumario(api) {
    await api.say(['Así que vos sos el entrenador que molesta a mis reclutas.', 'Soy Brumario, jefe del Equipo Niebla.', 'El Pampero limpia el cielo y se lleva la niebla. Si lo atrapo, el país será nuestro: gris, quieto, sin viento.', '¡Fuera de mi camino!'], { name: 'Brumario' });
    const res = await api.battle({ id: 'brumario', name: 'Brumario', cls: 'Jefe Niebla', look: 'boss', ai: 'smart', team: [['yarara', 33], ['zorromonte', 33], ['cuervon', 34], ['lobomarino', 35]], prize: 3000, lose: '¡No! ¡El viento… vuelve!', items: ['mate_dulce', 'mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('quebrada_clear');
    await api.flash();
    api.sfx('evolve');
    await api.say(['¡Un viento helado baja de las sierras!', '¡Una silueta enorme con alas de tormenta cruza el cielo!', '…El Pampero se fue volando hacia el sur. La niebla se disipa.'],);
    await api.say(['¡Mi plan…! Bah. El Equipo Niebla se disuelve.', 'Quizás… un cielo limpio tampoco está tan mal.'], { name: 'Brumario' });
    await api.npcLeave('brumario');
    await api.say(['Tu celular vibra. Es un mensaje de la Profesora Arazá:', '"¡Me enteré de todo, {player}! ¡Sos un héroe!', 'El Estadio Centenario ya abrió sus puertas para vos. ¡La Liga te espera en Montevideo!"']);
  },

  async rival_final(api) {
    if (api.flag('rival4')) return;
    await api.say(['¡Llegaste, {player}!', 'Desde Colonia que te vengo persiguiendo.', 'Esta es mi revancha. ¡Con todo lo que tengo!'], { name: '{rival}' });
    const res = await api.battle(rival(api, 3, 4000, null, '…Sos mejor que yo. Lo admito.', null));
    if (res !== 'win') return;
    api.setFlag('rival4');
    await api.say(['Andá. El Campeón te espera arriba.', 'Y ganale, ¿eh? Que si no, quedo mal yo también.'], { name: '{rival}' });
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
      await api.say(['¡Sos imparable! Volvé cuando quieras.'], { name: 'Obdulio' });
      return;
    }
    await api.say(['¡Felicitaciones, {player}! Desde hoy sos el nuevo Campeón de la Liga Oriental.', 'Tu nombre va a quedar en el Salón de la Fama del Centenario.'], { name: 'Obdulio' });
    api.setFlag('champion');
    await api.hallOfFame();
    await api.credits();
    await api.say(['…', 'Algunas semanas después, en Colonia.', 'Dicen que nuevas criaturas legendarias fueron vistas en el país:', 'un viento helado en la Quebrada, un canto en la costa de Punta…', 'Tu aventura continúa.']);
  },
};
