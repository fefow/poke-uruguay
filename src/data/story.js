// Story scripts. Each receives the script API (see game/script-api.js) and the
// NPC that triggered it. Text uses Rioplatense Spanish ("vos"), in a sober tone aimed at adults.
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
    intro: ['Soy Lucía, líder del Gimnasio de Montevideo.', 'Entreno en la Rambla todas las mañanas, haga frío o calor.', 'Veamos si resistís la corriente del Plata.'],
    lose: 'Me superaste. Fue una derrota limpia.',
    after: ['Te ganaste la Medalla Rambla. Con ella la policía te deja pasar a la Interbalnearia.', 'Se dice que el Equipo Niebla opera en la costa este. Andá con cuidado.'],
  },
  sofia: {
    id: 'leader_sofia', name: 'Sofía', cls: 'Líder', look: 'leader_elec', ai: 'smart', items: ['mate'],
    team: [['luciernito', 19], ['cotorrayo', 20], ['luceron', 22]], prize: 2200, badge: 'badge2', badgeName: 'Medalla Ola', reward: 'superesfera', rewardQty: 5,
    intro: ['Bienvenido a Punta del Este. Soy Sofía.', 'Mis criaturas acumulan la electricidad de las tormentas de verano.', 'Preparate para el combate.'],
    lose: 'Me quedé sin respuesta. Buen combate.',
    after: ['La Medalla Ola es tuya.', 'El Equipo Niebla robó la lámpara del faro de Cabo Polonio, al este.', 'Si la recuperás, te van a dejar pasar por la Ruta 8.'],
  },
  aparicio: {
    id: 'leader_aparicio', name: 'Don Aparicio', cls: 'Líder', look: 'gaucho', ai: 'smart', items: ['mate_dulce'],
    team: [['mulitin', 29], ['hornerazo', 30], ['tortugal', 30], ['mulitron', 32]], prize: 3200, badge: 'badge3', badgeName: 'Medalla Quebrada', reward: 'ultraesfera', rewardQty: 5,
    intro: ['Buenas. Soy Aparicio.', 'Cuido estas sierras desde hace sesenta años.', 'La piedra de la quebrada lo resiste todo. Veamos si vos también.'],
    lose: 'Hacía años que nadie me ganaba.',
    after: ['La Medalla Quebrada es tuya.', 'El jefe del Equipo Niebla subió a lo alto de la quebrada. Quiere capturar al Pampero.', 'Tenés que detenerlo.'],
  },
};

const CHAMPION = (rematch) => ({
  id: rematch ? 'champion_rematch' : 'champion', name: 'Obdulio', cls: 'Campeón', look: 'champion', ai: 'smart', items: ['dulce_de_leche', 'dulce_de_leche'],
  team: [['nanduro', 40], ['zorromonte', 40], ['yacaron', 41], ['lobomarino', 41], ['gatomontes', 41], ['aguaraflama', 43]].map(([s, l]) => [s, l + (rematch ? 14 : 0)]),
  prize: rematch ? 12000 : 8000,
  intro: rematch
    ? ['Volviste, {player}. El Centenario siempre está abierto para una revancha.', 'Esta vez no me reservo nada.']
    : ['Así que vos sos {player}.', 'Soy Obdulio, Campeón de la Liga Oriental.', 'En este estadio se ganó el primer Mundial. Acá se juega con garra.', 'Que empiece el partido.'],
  lose: rematch ? 'Un gran partido.' : 'Ganaste. Limpio y con garra.',
  after: ['Sos un verdadero campeón.'],
});

export const SCRIPTS = {
  async mom(api) {
    if (!api.flag('has_starter')) {
      await api.say(['{player}, por fin te levantaste.', 'El Maestro Tabárez te espera en su laboratorio.', 'Es el edificio de techo violeta. Hoy empieza tu viaje.'], { name: 'Madre' });
      return;
    }
    await api.say(['Sentate y descansá un rato.', 'Te preparo un té de marcela.'], { name: 'Madre' });
    await api.healParty();
    await api.say('Listo. Tus criaturas están recuperadas. Cuidate.', { name: 'Madre' });
  },

  async rival_sister(api) {
    if (!api.flag('got_map_gift')) {
      await api.say(['Hola, {player}. {rival} ya salió para el laboratorio.', 'Siempre quiere ser el primero en todo.', 'Tomá, llevate esto para el viaje.'], { name: 'Hermana' });
      await api.give('te_marcela', 3);
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
          'En la mesa hay tres Esferas. Elegí con calma: esa criatura te va a acompañar mucho tiempo.',
        ], { name: 'Maestro Tabárez' });
        await api.say('¿Y yo? Llegué primero.', { name: '{rival}' });
        await api.say('Paciencia, {rival}. Vos elegís después.', { name: 'Maestro Tabárez' });
      } else {
        await api.say('Elegí una de las Esferas de la mesa.', { name: 'Maestro Tabárez' });
      }
      return;
    }
    if (!api.flag('dex')) return;
    const seen = api.state.dex.seen.length;
    const caught = api.state.dex.caught.length;
    await api.say([`Veamos tu PokeDex. Viste ${seen} y capturaste ${caught} especies.`,
      caught >= 39 ? 'Un registro casi completo. Es un trabajo notable.' : caught >= 20 ? 'Buen avance. Seguí recorriendo el país.' : 'Todavía quedan muchas especies por registrar. Seguí explorando.'], { name: 'Maestro Tabárez' });
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
    await api.say([`Entonces yo me quedo con ${SPECIES[rk].name}.`, 'Tiene ventaja sobre el tuyo.'], { name: '{rival}' });
    await api.say(['Llevate también esto: la PokeDex.', 'Registra cada criatura que veas o captures.', 'Y unas Esferas para capturar criaturas salvajes.'], { name: 'Maestro Tabárez' });
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
      'Ahora, {player}: el país es grande. Hay tres Gimnasios, en Montevideo, Punta del Este y Treinta y Tres.',
      'Si conseguís las tres medallas, podés desafiar al Campeón en el Estadio Centenario.',
      'Y tené cuidado con el Equipo Niebla. Últimamente aparece una niebla extraña en la costa.',
      'Tu madre puede curar a tus criaturas en casa. Buen viaje.'], { name: 'Maestro Tabárez' });
  },

  async gift_te_marcela(api) {
    if (api.flag('gift_r1')) return api.say('Que tengas buen viaje. Y tomá mate, que ayuda.', { name: 'Abuelo' });
    await api.say(['Un entrenador joven. Tomá, para el camino.'], { name: 'Abuelo' });
    await api.give('esfera', 3);
    api.setFlag('gift_r1');
  },

  async gift_garrapinada(api) {
    if (api.flag('gift_garr')) return api.say('Los carritos de garrapiñada de la Rambla son un clásico.', { name: 'Vecina' });
    await api.say('Compré garrapiñada en la Rambla. Tomá una: hace que tu criatura suba de nivel.', { name: 'Vecina' });
    await api.give('garrapinada', 1);
    api.setFlag('gift_garr');
  },

  async rival_mvd(api) {
    if (api.flag('rival2')) return;
    await api.say(['{player}, te estaba esperando.', 'Ya capturé una criatura nueva en la Ruta 1.', 'Veamos si seguís teniendo tanta suerte.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 1, 400, null, 'Otra vez perdí. ¿Cómo lo hacés?', null));
    if (res !== 'win') return;
    api.setFlag('rival2');
    await api.say(['Voy al gimnasio antes que vos.'], { name: '{rival}' });
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
    await api.say(['Un entrometido más.', 'Soy Bruma, del Equipo Niebla.', 'Sin la lámpara del faro, la niebla cubre la costa y nadie ve lo que hacemos.', 'No vas a arruinar nuestros planes.'], { name: 'Bruma' });
    const res = await api.battle({ id: 'bruma', name: 'Bruma', cls: 'Admin. Niebla', look: 'boss', ai: 'smart', team: [['yararita', 22], ['zorrigris', 23], ['cuervon', 24]], prize: 1500, lose: 'Imposible. Mi niebla…', items: ['mate'] });
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
      await api.give('superesfera', 5);
      await api.give('alfajor', 2);
      api.setFlag('lamp_returned');
      await api.say(['La policía ya abrió la Ruta 8, al norte de Montevideo.', 'Dicen que el Equipo Niebla fue hacia la Quebrada de los Cuervos.'], { name: 'Farero' });
      return;
    }
    if (api.flag('lamp_returned')) return api.say('Gracias a vos, los barcos navegan seguros.', { name: 'Farero' });
    await api.say(['Se llevaron la lámpara. Fue una mujer vestida de gris, con capa.', 'Sigue afuera, del lado de las rocas.'], { name: 'Farero' });
  },

  async rival_r8(api) {
    if (api.flag('rival3')) return;
    await api.say(['{player}, ya sé lo del Equipo Niebla.', 'Pero antes de ir a la Quebrada, veamos quién es más fuerte.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 2, 1200, null, 'Sos un rival duro.', null));
    if (res !== 'win') return;
    api.setFlag('rival3');
    await api.say(['Bien. Andá vos primero. Yo te cubro.', 'Pero en el Centenario te gano.'], { name: '{rival}' });
    await api.npcLeave('rival_r8');
  },

  async brumario(api) {
    await api.say(['Así que vos sos el entrenador que molesta a mis reclutas.', 'Soy Brumario, jefe del Equipo Niebla.', 'El Pampero limpia el cielo y disipa la niebla. Si lo capturo, el país será nuestro: gris, quieto, sin viento.', 'Apartate de mi camino.'], { name: 'Brumario' });
    const res = await api.battle({ id: 'brumario', name: 'Brumario', cls: 'Jefe Niebla', look: 'boss', ai: 'smart', team: [['yarara', 33], ['zorromonte', 33], ['cuervon', 34], ['lobomarino', 35]], prize: 3000, lose: 'No… el viento vuelve.', items: ['mate_dulce', 'mate_dulce'] });
    if (res !== 'win') return;
    api.setFlag('quebrada_clear');
    await api.flash();
    api.sfx('evolve');
    await api.say(['Un viento helado baja de las sierras.', 'Una silueta enorme, con alas de tormenta, cruza el cielo.', 'El Pampero se aleja hacia el sur. La niebla se disipa.'],);
    await api.say(['Mi plan ha fracasado. El Equipo Niebla se disuelve.', 'Quizás un cielo despejado no sea tan malo.'], { name: 'Brumario' });
    await api.npcLeave('brumario');
    await api.say(['Tu celular vibra. Es un mensaje del Maestro Tabárez:', '"Me enteré de todo, {player}. Es un logro enorme.', 'El Estadio Centenario ya abrió sus puertas para vos. La Liga te espera en Montevideo."']);
  },

  async rival_final(api) {
    if (api.flag('rival4')) return;
    await api.say(['Llegaste, {player}.', 'Desde Colonia que te vengo siguiendo.', 'Esta es mi revancha. Voy con todo.'], { name: '{rival}' });
    const res = await api.battle(rival(api, 3, 4000, null, 'Sos mejor que yo. Lo admito.', null));
    if (res !== 'win') return;
    api.setFlag('rival4');
    await api.say(['Andá. El Campeón te espera arriba.', 'Y ganale. Si no, quedo mal yo también.'], { name: '{rival}' });
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
