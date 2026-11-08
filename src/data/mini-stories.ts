// Mini stories: each one is self-contained in a single town. Beginning (a local tells what happened), mission (the
// person responsible stands in the same town and is dealt with by battle or by a choice) and ending (the local
// thanks the player and pays). They never touch the PP plot. Flags: ev_ms_<id>_<0|1|2>.
import { fitToMap } from './map-gen.ts';
import { mapBand } from './route.ts';
import { TR } from './map-kit.ts';

type Spot = { x: number; y: number; look: string; name: string };
type Story = {
  id: string; map: string; local: Spot; foe: Spot;
  start: string[];            // the local tells what happened and asks for help
  wait: string[];             // while the mission is open
  idle: string[];             // what the other person says before anybody asked the player
  pre: string[];              // the other person, when confronted
  team?: string[];            // battle: species, from a weaker to the strongest
  choice?: { q: string; options: string[]; right: number; wrong: string[] }; // talk: no battle
  lose: string; post: string[]; // after the foe is beaten / convinced
  end: string[]; after: string[];
  reward: [string, number][];
};

export const MINI_STORIES: Story[] = [
  {
    id: 'muelle', map: 'colonia', local: { x: 16, y: 22, look: 'sailor', name: 'Pescador Anselmo' }, foe: { x: 34, y: 20, look: 'gaucho', name: 'Contrabandista de yerba' },
    start: ['Desde la madrugada falta yerba en los almacenes de Colonia. Un tipo la saca en bolsas por el muelle, de noche, y la vende del otro lado del río.', 'No tengo cómo pararlo. Está por la zona del casco histórico, mirando para todos lados.'],
    wait: ['Si no lo frenás, el mate va a salir caro hasta en las casas de los vecinos.'],
    idle: ['No miro a nadie. Estoy esperando un barco, nada más.'],
    pre: ['¿Quién te dijo? Con un par de bolsas no le hago daño a nadie.', 'Si querés pasar, primero tenés que pasarme a mí.'],
    team: ['comadreja', 'cuervon', 'mulitin'], lose: 'Está bien, está bien. Devuelvo las bolsas.',
    post: ['Las devuelvo mañana. No me hagas hablar más.'],
    end: ['Las bolsas volvieron a los almacenes. Colonia vuelve a tomar mate como corresponde.', 'Tomá, esto lo juntamos entre los vecinos.'], after: ['Gracias a vos, el mate de la mañana sigue siendo el de siempre.'],
    reward: [['superesfera', 2], ['mate_dulce', 2]],
  },
  {
    id: 'copa', map: 'mercedes', local: { x: 12, y: 22, look: 'oldman', name: 'Presidente del Club de Remo' }, foe: { x: 30, y: 14, look: 'sailor', name: 'Remero rival' },
    start: ['Desapareció la copa de la regata del Club de Remo. La dejamos en la vitrina anoche y a la mañana no estaba.', 'Hay un remero de otro club que anda rondando por la costanera. No digo que haya sido él, pero preguntale.'],
    wait: ['Sin la copa no hay regata. Hace cuarenta años que se hace.'],
    idle: ['Vengo a mirar el río. Me relaja.'],
    pre: ['¿La copa? Qué sé yo. Si la querés, ganámela.'],
    team: ['garza', 'gaviota', 'anguila'], lose: 'Bueno, la escondí en el bote. Perdí.',
    post: ['Está en el bote amarrado. Llevásela y que no se enojen conmigo.'],
    end: ['La copa estaba exactamente donde dijo. Vamos a hacer la regata como siempre.', 'Tomá, un detalle del club.'], after: ['Esta copa va a durar otros cuarenta años. Gracias.'],
    reward: [['ultraesfera', 1], ['superesfera', 2]],
  },
  {
    id: 'apagon', map: 'trinidad', local: { x: 10, y: 20, look: 'obrero', name: 'Electricista Raúl' }, foe: { x: 32, y: 18, look: 'obrero', name: 'Vecino enojado' },
    start: ['Dos cuadras sin luz desde ayer. Alguien cortó un cable a propósito.', 'Hay un vecino que anda gritando por la plaza que le molestaba el zumbido. Hablá con él antes de que lo vuelva a hacer.'],
    wait: ['Cada hora sin luz son heladeras que se descongelan.'],
    idle: ['Hoy no tengo ganas de charlar.'],
    pre: ['El zumbido de ese transformador me tenía loco. No me arrepiento.', 'Si querés que lo repare, tendrás que convencerme.'],
    team: ['luciernito', 'cotorrayo', 'pararrayo'], lose: 'Está bien. Pido disculpas.',
    post: ['Hoy mismo ayudo a repararlo. No lo vuelvo a hacer.'],
    end: ['Volvió la luz y con ella el vecino, con una caja de herramientas. Dice que va a ayudar.', 'Tomá, por tu paciencia.'], after: ['Ahora el transformador suena menos, o me acostumbré.'],
    reward: [['refuerzo_ataque', 2], ['mate', 2]],
  },
  {
    id: 'furtivo', map: 'paysandu', local: { x: 36, y: 12, look: 'cop', name: 'Guardafauna' }, foe: { x: 52, y: 26, look: 'sailor', name: 'Pescador furtivo' },
    start: ['Alguien pesca de noche con red en una zona de veda, junto a la costanera. Si sigue, el río se queda sin dorados.', 'Anda por el puerto. No tengo pruebas, pero vos podés hablarle.'],
    wait: ['Los peces no vuelven una vez que se van.'],
    idle: ['Pesco con anzuelo, como todos. No me mires así.'],
    pre: ['La red es mía y el río es de todos. ¿Quién te pone a vos de juez?'],
    team: ['garza', 'tortugal', 'anguila'], lose: 'Bueno. Retiro la red.',
    post: ['La saco hoy mismo. Y no se lo cuentes a nadie.'],
    end: ['La red salió del río y el dorado vuelve a la orilla. Gracias en nombre de todos los pescadores.', 'Aceptá esto de la guardia.'], after: ['El río está más tranquilo ahora.'],
    reward: [['superesfera', 3]],
  },
  {
    id: 'termas', map: 'salto', local: { x: 36, y: 14, look: 'maestra', name: 'Administradora de las termas' }, foe: { x: 22, y: 30, look: 'clerk', name: 'Inspector' },
    start: ['Las termas están cerradas desde ayer. Un inspector dice que no cumplimos una norma, pero nunca me mostró cuál.', 'Está por la zona de la costanera. Fijate qué quiere de verdad.'],
    wait: ['Cada día cerrados son turistas que no vuelven.'],
    idle: ['Cumplo con mi trabajo. Nada más.'],
    pre: ['Hay normas. Yo solo las hago cumplir.', 'Aunque... la verdad es que me ofrecieron algo por cerrarlas. No sé por qué te cuento esto.'],
    team: ['murcielago', 'flamenco'], lose: 'Está bien. Reabro.',
    post: ['Voy a reabrir mañana temprano. Y no pienso volver a aceptar nada de nadie.'],
    end: ['Las termas abrieron esta mañana, con fila hasta la plaza. Te debemos un baño y un regalo.'], after: ['Ahora hay más gente que nunca. Gracias.'],
    reward: [['ultraesfera', 2]],
  },
  {
    id: 'cuatrero', map: 'tacuarembo', local: { x: 34, y: 28, look: 'gaucho', name: 'Capataz de la tropilla' }, foe: { x: 20, y: 18, look: 'gaucho', name: 'Cuatrero' },
    start: ['Faltan tres caballos de la tropilla desde la madrugada. Los vi irse por el camino de la feria.', 'Hay un forastero con un poncho que no pertenece a ningún establecimiento. Preguntale con respeto, pero firme.'],
    wait: ['Esos caballos valen más que mi sueldo de un año.'],
    idle: ['Estoy de paso. Quiero mirar la feria.'],
    pre: ['¿Caballos? No sé nada de caballos.', 'Hasta que me ganes, no te digo nada.'],
    team: ['alazan', 'boleador', 'caudillo'], lose: 'Los dejé en el corral del fondo. Perdí.',
    post: ['Están atrás del galpón. No les hice nada.'],
    end: ['Los tres caballos estaban en el corral del fondo, sanos. Con eso se paga cualquier malentendido.', 'Llevate esto de parte de la tropilla.'], after: ['Desde que volvieron, los caballos duermen en el establo.'],
    reward: [['ultraesfera', 2], ['mate_dulce', 2]],
  },
  {
    id: 'cerro_luz', map: 'melo', local: { x: 28, y: 30, look: 'oldman', name: 'Sereno del cerro' }, foe: { x: 40, y: 14, look: 'boy', name: 'Muchacho del cerro' },
    start: ['Cada noche se ven luces en el cerro y la gente dice que son aparecidos. Yo creo que es un muchacho que sube con una linterna.', 'Hablá con él y averiguá qué busca. Con buenas maneras.'],
    wait: ['Si es un chico, mejor que lo sepamos. Si no, también.'],
    idle: ['Estoy mirando el paisaje. Nada más.'],
    pre: ['Subo a mirar las estrellas. Me gusta el silencio de ahí arriba.', '¿Te animás a una pelea amistosa? Si ganás, te cuento todo.'],
    team: ['curupi', 'pombero'], lose: 'Está bien, está bien. Te cuento.',
    post: ['Armé un telescopio con latas y lentes viejos. La luz es de la linterna. No es ningún aparecido.'],
    end: ['Era un telescopio hecho a mano. El muchacho nos va a dar charlas de astronomía en la plaza.', 'Tomá, un detalle del pueblo.'], after: ['Ahora los domingos se llena la plaza para mirar la luna.'],
    reward: [['piedra_agata', 1], ['mate_dulce', 2]],
  },
  {
    id: 'naufrago', map: 'rocha', local: { x: 10, y: 30, look: 'sailor', name: 'Viejo marino' }, foe: { x: 38, y: 28, look: 'obrero', name: 'Saqueador de naufragios' },
    start: ['Un barco pesquero encalló anoche cerca de la barra. Alguien se está llevando las cajas de la bodega antes del amanecer.', 'Lo vi en la playa con una linterna. Hay que frenarlo antes de que desaparezca la carga.'],
    wait: ['La carga era de gente que vive de la pesca. No es botín de nadie.'],
    idle: ['Camino por la playa. Eso es todo.'],
    pre: ['Lo que el mar deja, es de quien lo encuentra.', 'Probame que no.'],
    team: ['tortugal', 'cangrejo', 'tatu'], lose: 'Bueno, bueno. Las cajas están en el galpón.',
    post: ['En el galpón de atrás. Devolvélas, que no valen tanto.'],
    end: ['La carga volvió a sus dueños. Hoy hay pescado fresco para todo el barrio.', 'Aceptá esto, de parte de los pescadores.'], after: ['El barco ya flota otra vez. Gracias.'],
    reward: [['superesfera', 3]],
  },
  {
    id: 'acertijo_florida', map: 'florida', local: { x: 40, y: 14, look: 'maestra', name: 'Maestra de la escuela 3' }, foe: { x: 28, y: 14, look: 'nino', name: 'Niño travieso' },
    start: ['Un alumno escondió la llave del salón y dice que solo la devuelve si alguien contesta lo que él pregunta. Es muy testarudo.', 'Está en la plaza. Seguile el juego, que acá no se castiga a nadie.'],
    wait: ['Los chicos no pueden entrar a clase. Y hace frío.'],
    idle: ['Jugando. No molesto a nadie.'],
    pre: ['Yo sé algo que ustedes no saben. A ver quién adivina.'],
    choice: { q: '¿En qué año se declaró la independencia del Uruguay?', options: ['1825', '1811', '1930'], right: 0, wrong: ['No, pensá de nuevo. Pista: es el año de los Treinta y Tres.'] },
    lose: '', post: ['¡Muy bien! La llave está debajo de la maceta. Qué aburrido, ganaste.'],
    end: ['La llave volvió a la cerradura. Los chicos entraron todos juntos. Tomá, de parte del colegio.'], after: ['Ahora el niño pregunta cosas más difíciles, pero ya no esconde nada.'],
    reward: [['superesfera', 2], ['mate', 3]],
  },
  {
    id: 'bici_durazno', map: 'durazno', local: { x: 30, y: 28, look: 'ciclista', name: 'Ciclista del club' }, foe: { x: 46, y: 18, look: 'boy', name: 'Muchacho de la plaza' },
    start: ['Alguien se llevó mi bicicleta de la puerta del club. Es la que usé en todas las carreras.', 'Hay un muchacho en la plaza que anda con una bici igual a la mía, pero no me animo a acusarlo.'],
    wait: ['Esa bici tiene mi nombre grabado abajo del cuadro.'],
    idle: ['Es mía. La compré con mis ahorros.'],
    pre: ['Esta bici es mía. ¿Por qué te interesa tanto?'],
    choice: { q: 'Para saber si es suya, ¿qué conviene mirar?', options: ['El número del cuadro', 'El color del manubrio', 'Si anda más rápido'], right: 0, wrong: ['Eso no demuestra nada. Pensá en algo que no se pueda cambiar.'] },
    lose: '', post: ['Tenés razón. La encontré tirada y me la quedé. Qué vergüenza. Se la devuelvo.'],
    end: ['Mi bici está de vuelta. El muchacho vino a pedir disculpas y hasta se ofreció a limpiarla.', 'Tomá, por tu ayuda.'], after: ['Desde entonces la dejo bien atada, por las dudas.'],
    reward: [['ultraesfera', 1], ['alfajor_triple', 1]],
  },
];

export const MS_SCRIPTS: Record<string, (api: any, npc?: any) => Promise<void>> = {
  async ms_local(api, npc) {
    const s = MINI_STORIES.find((m) => m.id === npc.msId)!;
    const k = (i) => `ev_ms_${s.id}_${i}`;
    if (api.flag(k(2))) return api.say(s.after, { name: npc.name });
    if (api.flag(k(1))) {
      await api.say(s.end, { name: npc.name });
      api.setFlag(k(2));
      api.sfx('catch');
      for (const [item, q] of s.reward) await api.give(item, q);
      return;
    }
    if (api.flag(k(0))) return api.say(s.wait, { name: npc.name });
    await api.say(s.start, { name: npc.name });
    api.setFlag(k(0));
  },
  async ms_foe(api, npc) {
    const s = MINI_STORIES.find((m) => m.id === npc.msId)!;
    const k = (i) => `ev_ms_${s.id}_${i}`;
    if (api.flag(k(1))) return api.say(s.post, { name: npc.name });
    if (!api.flag(k(0))) return api.say(s.idle, { name: npc.name });
    await api.say(s.pre, { name: npc.name });
    if (s.choice) {
      await api.say(s.choice.q, { name: npc.name, keep: true });
      for (;;) {
        const r = await api.choose(s.choice.options, { cancel: false });
        if (r === s.choice.right) break;
        await api.say(s.choice.wrong, { name: npc.name });
        await api.say(s.choice.q, { name: npc.name, keep: true });
      }
    } else {
      const [, hi] = mapBand(s.map);
      const team = s.team!.map((sp, i, a) => [sp, Math.max(2, hi - (a.length - 1 - i))]);
      const res = await api.battle(TR(`ms_${s.id}`, npc.name, 'Rival del pueblo', team, hi * 30, null, s.lose, null, npc.look), { canLose: true });
      if (res !== 'win') return api.say('Volvé cuando tus criaturas estén listas.', { name: npc.name });
    }
    api.setFlag(k(1));
    await api.say(s.post, { name: npc.name });
  },
};

export function addMiniStories(OUTDOOR: Record<string, any>) {
  for (const s of MINI_STORIES) {
    const m = OUTDOOR[s.map];
    if (!m) continue;
    const list = [
      { x: s.local.x, y: s.local.y, look: s.local.look, dir: 'down', name: s.local.name, script: 'ms_local', msId: s.id },
      { x: s.foe.x, y: s.foe.y, look: s.foe.look, dir: 'down', name: s.foe.name, script: 'ms_foe', msId: s.id },
    ];
    const taken = new Set<string>((m.npcs ?? []).map((o) => `${o.x},${o.y}`));
    fitToMap(m.tiles, list, taken);
    (m.npcs ??= []).push(...list);
  }
}
