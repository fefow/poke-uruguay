// Favors between towns: somebody in one place asks for something that sends the player to another place, and the
// reward waits back where it began. They never touch the PP story. Flags are `ev_fv_<chain>_<step>` (ev_ prefix is
// accepted by the save validator). Each person holds the whole chain in `npc.fv`, so one script serves them all.
import { fitToMap } from './map-gen.ts';

type Spot = { map: string; x: number; y: number; look: string; name: string };
type Chain = {
  id: string;
  giver: Spot; mids: Spot[];
  ask: string[]; wait: string[];
  mid: string[][]; idle: string[]; midAfter: string[];
  done: string[]; after: string[];
  reward: [string, number][];
};

export const FAVORS: Chain[] = [
  {
    id: 'faro', giver: { map: 'colonia', x: 30, y: 21, look: 'boy', name: 'Aprendiz de farero' },
    mids: [{ map: 'rosario', x: 14, y: 8, look: 'oldman', name: 'Relojero' }],
    ask: ['La lámpara del faro perdió una pieza chica y el farero no duerme tranquilo.', 'Dicen que en Rosario hay un relojero que arregla lo que nadie arregla. Decile que va de mi parte.'],
    wait: ['Sin esa pieza la luz gira a medias. Los barcos del río lo notan.'],
    mid: [['Ah, la pieza del faro. La tengo lista desde ayer, solo faltaba que alguien la buscara.', 'Llevásela al muchacho de Colonia. Y que no la deje caer, que es de bronce de verdad.']],
    idle: ['Arreglo relojes y de vez en cuando una lámpara. Cada cosa con su tiempo.'], midAfter: ['Que la luz del faro no se apague. Es lo único que importa en la costa.'],
    done: ['¡La pieza! Ahora sí gira completa. Tomá, el farero me dejó esto para quien me ayudara.'], after: ['El faro funciona de noche otra vez. Gracias.'],
    reward: [['superesfera', 2]],
  },
  {
    id: 'queso', giver: { map: 'sanjose', x: 12, y: 18, look: 'mom', name: 'Quesera' },
    mids: [{ map: 'ecilda', x: 12, y: 6, look: 'gaucho', name: 'Tambero' }, { map: 'trinidad', x: 14, y: 22, look: 'clerk', name: 'Almacenero' }],
    ask: ['Mi queso de campo se está acabando y la leche buena no llega. El tambero de Ecilda me debe la última tanda.', 'Si pasás por ahí, recordale. Después andá a ver al almacenero de Trinidad, que sabe quién me compraba.'],
    wait: ['Con la leche que tengo no alcanza ni para el desayuno.'],
    mid: [['¿La quesera de San José? Ya mandé los tarros con el carro de ayer, pero me olvidé de avisarle.', 'Pasá por Trinidad y decile al almacenero que los recoja en la parada.'], ['Los tarros de leche. Los dejaron en la parada ayer a la tarde.', 'Decile a ella que la plata la dejo cuando pase. Y que el queso salió bien este año.']],
    idle: ['Ordeñe temprano, venta tarde. Así se vive en el tambo.'], midAfter: ['Todo en orden. Que siga el queso.'],
    done: ['Llegó la leche, y con ella el recado. Gracias por hacer de chasqui. Llevate esto.'], after: ['Salió el queso más gordo del año. Se te va a recordar.'],
    reward: [['mate_dulce', 3]],
  },
  {
    id: 'radio', giver: { map: 'mercedes', x: 28, y: 12, look: 'clerk', name: 'Radioaficionado' },
    mids: [{ map: 'palmitas', x: 12, y: 8, look: 'maestra', name: 'Maestra rural' }],
    ask: ['Mi radio capta de todo menos la escuela de Palmitas. Hace una semana que no responden.', 'Pasá a ver cómo están. Si hace falta algo, que la maestra me avise.'],
    wait: ['Sigo girando la perilla y nada. Algo pasa en esa escuelita.'],
    mid: [['Ah, el de la radio. La antena la tumbó el viento, pero los chicos ya la levantaron.', 'Decile que ahora sí, que escuche la frecuencia de la tarde.']],
    idle: ['Enseño a leer y a mirar el cielo. Lo segundo ayuda más seguido.'], midAfter: ['La antena quedó firme. Los chicos están orgullosos.'],
    done: ['¡Ahí está! Se oye clarito. Tomá un obsequio de la radio comunitaria.'], after: ['Ahora se escucha hasta el pronóstico. Gracias por el recado.'],
    reward: [['refuerzo_ataque', 2]],
  },
  {
    id: 'carta', giver: { map: 'fraybentos', x: 10, y: 20, look: 'cop', name: 'Cartero' },
    mids: [{ map: 'villasoriano', x: 12, y: 8, look: 'girl', name: 'Pescadora' }, { map: 'paysandu', x: 40, y: 24, look: 'oldman', name: 'Escribano' }],
    ask: ['Tengo una carta mal despachada. Va a nombre de una pescadora de Villa Soriano, pero la dirección se borró con el agua.', 'Preguntale por ella allá. Y después buscá al escribano de Paysandú, que sabe leer firmas viejas.'],
    wait: ['La carta quedó sin sello. Hay que entregarla en mano o se pierde.'],
    mid: [['¿Una carta para mí? Ya no espero a nadie... salvo a mi hermano de Paysandú.', 'Tal vez el escribano sepa algo. Lleva años leyendo papeles ajenos.'], ['Esa letra es de la pescadora, la reconozco: me debe un acta del año pasado.', 'Decile al cartero que ya está resuelto y que no se olvide de sellar la próxima.']],
    idle: ['Un escribano ve mucho papel y poca gente. Qué bueno que vengas.'], midAfter: ['Todo en regla. Que el correo siga andando.'],
    done: ['La carta llegó a destino. Nadie lo habría logrado sin vos. Aceptá esto del correo.'], after: ['El correo funciona gracias a gente así.'],
    reward: [['superesfera', 3]],
  },
  {
    id: 'cosecha', giver: { map: 'salto', x: 30, y: 16, look: 'gaucho', name: 'Quintero' },
    mids: [{ map: 'belen', x: 10, y: 10, look: 'boy', name: 'Peón de quinta' }],
    ask: ['La cosecha de naranjas está lista y falta quien ayude a embolsar. Mi peón se fue a Belén y no volvió.', 'Fijate si anda por allá. Solo necesito saber si va a volver.'],
    wait: ['Las naranjas no esperan. Se pasan en tres días.'],
    mid: [['El patrón de Salto me manda a buscar, ¿eh? Tengo a mi madre enferma, por eso me vine.', 'Decile que vuelvo en cuanto mejore. Que me guarde el lugar.']],
    idle: ['La quinta no da descanso, pero da de comer.'], midAfter: ['Cuando mi madre mejore vuelvo. Dile al patrón.'],
    done: ['Ya sabía yo. Un buen peón vuelve. Gracias por traer la noticia; tomá esto, es de la primera cosecha.'], after: ['Las naranjas salieron grandes este año.'],
    reward: [['alfajor_triple', 2]],
  },
  {
    id: 'frontera', giver: { map: 'artigas', x: 24, y: 28, look: 'maestra', name: 'Gemóloga' },
    mids: [{ map: 'baltasar', x: 12, y: 8, look: 'sailor', name: 'Camionero' }],
    ask: ['Esperaba un cargamento de amatistas y el camión no llegó. Salió de Baltasar Brum hace dos días.', 'Si lo encontrás, decile que no se preocupe por el retraso, pero que avise.'],
    wait: ['Sin esas piedras no puedo cerrar el pedido de la exposición.'],
    mid: [['Se me pinchó una goma en el camino y perdí un día. Ya salgo para Artigas.', 'Decile a la gemóloga que mañana llego con todo.']],
    idle: ['Manejo más de lo que duermo. Así es el oficio.'], midAfter: ['Ya salgo. Mañana estoy ahí.'],
    done: ['Llegó el camión y con él tus noticias. Una amatista de las buenas es para vos.'], after: ['La exposición salió espléndida.'],
    reward: [['piedra_amatista', 1]],
  },
  {
    id: 'cuchilla', giver: { map: 'tacuarembo', x: 30, y: 16, look: 'gaucho', name: 'Domador' },
    mids: [{ map: 'tranqueras', x: 12, y: 8, look: 'oldman', name: 'Herrero' }, { map: 'tupambae', x: 12, y: 8, look: 'boy', name: 'Aprendiz de peón' }],
    ask: ['Mi caballo perdió una herradura en la cuchilla. Hay un herrero en Tranqueras que hace las mejores.', 'Pedile una de mi parte y después fijate si alguien en Tupambaé puede ayudarme con el arreo.'],
    wait: ['Con una pata sin herradura no hay doma que valga.'],
    mid: [['¿La herradura del domador? Ya la tengo forjada. Llevásela a Tupambaé, a su aprendiz.', 'Que no la pierda como la anterior.'], ['La herradura para el patrón. La llevo yo en cuanto termine el arreo.', 'Decile que ya casi estamos.']],
    idle: ['Toda herradura lleva su tiempo, pero dura años.'], midAfter: ['Ya está en camino, no te preocupes.'],
    done: ['Ahí está. Mi caballo ya anda como nuevo. Tomá, es un detalle del criadero.'], after: ['El caballo corre otra vez. Gracias.'],
    reward: [['ultraesfera', 2]],
  },
  {
    id: 'cerro', giver: { map: 'melo', x: 24, y: 26, look: 'oldman', name: 'Cuentero del cerro' },
    mids: [{ map: 'cerrochato', x: 12, y: 8, look: 'maestra', name: 'Bibliotecaria' }],
    ask: ['Estoy escribiendo una historia vieja de Cerro Largo y me falta un libro que quedó en Cerro Chato.', 'Pedíselo a la bibliotecaria. Si pregunta quién lo quiere, decile que es el cuentero.'],
    wait: ['Sin ese libro la historia queda a medias. Y a mi edad no sé cuántas más pueda empezar.'],
    mid: [['El libro del cuentero. Hace años que quiere leerlo y nunca viene a buscarlo.', 'Llevásele. Es un préstamo, no un regalo, que se lo recuerdes.']],
    idle: ['Los libros no se leen solos. Eso lo aprendí enseñando.'], midAfter: ['Que lo cuide. Es el único ejemplar.'],
    done: ['¡El libro! Ahora la historia tiene principio y final. Esto es para vos por la molestia.'], after: ['Estoy terminando el relato. Pronto lo vas a escuchar.'],
    reward: [['piedra_agata', 1]],
  },
  {
    id: 'laguna', giver: { map: 'rocha', x: 22, y: 26, look: 'sailor', name: 'Pescador de laguna' },
    mids: [{ map: 'lascano', x: 12, y: 8, look: 'gaucho', name: 'Guardafauna' }, { map: 'paloma', x: 12, y: 8, look: 'girl', name: 'Surfista' }],
    ask: ['Hay una tormenta en camino y mi bote está atado en lugar flojo. Aviso a los de Lascano y La Paloma, pero no llego a todos.', 'Pasales el aviso. Quien reciba el mensaje te lo agradece.'],
    wait: ['El cielo está raro. Esos dos tienen que saberlo.'],
    mid: [['Entendido, aviso a los guardas y aseguro los botes. Pasá por La Paloma, que allá hay gente en el agua.'], ['¿Tormenta? Ya mismo salgo del agua y aviso a los demás surfistas.', 'Decile al pescador que le debo una.']],
    idle: ['Las olas hoy están perfectas. Mañana no sé.'], midAfter: ['Ya avisé a todos. Gracias.'],
    done: ['Si todos recibieron el aviso, nadie se mojó. Es lo único que importa. Tomá un recuerdo de la laguna.'], after: ['Pasó la tormenta sin daños. Gracias a vos.'],
    reward: [['superesfera', 3]],
  },
  {
    id: 'cerro_mina', giver: { map: 'minas', x: 26, y: 24, look: 'oldman', name: 'Minero jubilado' },
    mids: [{ map: 'piriapolis', x: 12, y: 8, look: 'boy', name: 'Vendedor de souvenirs' }],
    ask: ['Dejé mi casco de minero en una carpa de Piriápolis. Era de mi padre y no lo quiero perder.', 'Preguntá por el vendedor de souvenirs. Seguro lo vio.'],
    wait: ['Treinta años en la mina y ese casco siempre me protegió.'],
    mid: [['¿Un casco amarillo con una raya roja? Lo guardé en la caja de objetos perdidos.', 'Tomalo y llevalo a Minas. Y decile al jubilado que la próxima, que lo anote.']],
    idle: ['Vendo recuerdos del lugar. Alguno se queda, otros vuelven.'], midAfter: ['Que lo cuide. Estaba en buen estado.'],
    done: ['¡El casco de mi padre! No sabés lo que significa. Tomá, una piedra del fondo de la mina.'], after: ['Lo guardo en la repisa ahora. Gracias.'],
    reward: [['piedra_basalto', 1]],
  },
  {
    id: 'sierra', giver: { map: 'florida', x: 34, y: 24, look: 'maestra', name: 'Directora de escuela' },
    mids: [{ map: 'casupa', x: 10, y: 10, look: 'boy', name: 'Alumno' }, { map: 'sarandi', x: 12, y: 8, look: 'oldman', name: 'Farmacéutico' }],
    ask: ['Uno de mis alumnos de Casupá no vino a clase. Quiero saber si anda enfermo.', 'Pasá a verlo y si necesita algo, el farmacéutico de Sarandí del Yí sabe más que yo.'],
    wait: ['Es un buen alumno. No falta sin motivo.'],
    mid: [['Tengo fiebre, pero ya me estoy mejorando. ¿Me trae la tarea la maestra?', 'Si puede conseguirme jarabe, mejor. Dicen que en Sarandí venden el bueno.'], ['¿Jarabe para un alumno de Casupá? Claro, aquí está. Que mejore pronto.', 'Avisale a la directora que mañana mismo vuelve a clase.']],
    idle: ['Una botica de pueblo vive de lo cotidiano. Hoy parece que vendí todo.'], midAfter: ['El jarabe ya llegó. Me siento mejor, gracias.'],
    done: ['Qué alivio. Mañana vuelve a clase. Tomá un obsequio, es lo mínimo.'], after: ['Mi alumno volvió. Todo gracias a vos.'],
    reward: [['mate_dulce', 4]],
  },
  {
    id: 'costa', giver: { map: 'canelones', x: 28, y: 28, look: 'maestra', name: 'Apicultora' },
    mids: [{ map: 'sanramon', x: 12, y: 8, look: 'gaucho', name: 'Quintero' }, { map: 'laspiedras', x: 12, y: 8, look: 'girl', name: 'Vecina' }],
    ask: ['Mis abejas no están produciendo como siempre. Dicen que en San Ramón hay un quintero que usa un truco para mantener las colmenas.', 'Pasá a verlo. Si te regala algo, pasá también por Las Piedras: una vecina tiene el otro ingrediente.'],
    wait: ['Sin buena miel no hay negocio. Y ya ni sé cuánto aguantan.'],
    mid: [['Ah, la apicultora. El truco es plantar romero entre las colmenas. Tomá una bolsita de semillas.', 'Llevalas a Las Piedras: la vecina sabe plantarlas.'], ['¿Semillas de romero? Las planto ahora mismo. Va a tardar un mes, pero funciona.', 'Decile a la apicultora que la voy a ayudar yo.']],
    idle: ['Las flores no conocen de fronteras, pero las abejas sí.'], midAfter: ['El romero crece bien. Que no se rinda.'],
    done: ['Si la vecina ya plantó, la próxima cosecha va a ser buena. Gracias, aceptá esto con cariño.'], after: ['Las abejas están contentas. Muchas gracias.'],
    reward: [['superesfera', 2], ['mate_dulce', 2]],
  },
  {
    id: 'ciudad', giver: { map: 'montevideo', x: 8, y: 23, look: 'clerk', name: 'Guardia del puerto' },
    mids: [{ map: 'interbalnearia', x: 12, y: 8, look: 'sailor', name: 'Viajante' }],
    ask: ['Un viajante dejó un bolso en el puerto antes de salir hacia Interbalnearia. Tiene papeles que va a necesitar.', 'Si lo encontrás, decile que pase a buscarlo antes de que cierre la oficina.'],
    wait: ['El bolso lleva dos días acá. Papeles de verdad, de esos que no se reponen.'],
    mid: [['¿Mi bolso? Qué cabeza la mía. Decile al guardia que ya paso por ahí.', 'Gracias por avisarme. Tomá, es de lo poco que tengo.']],
    idle: ['Voy y vengo por la costa. Siempre me falta algo en la valija.'], midAfter: ['Ya voy para el puerto. Gracias.'],
    done: ['El viajante pasó a buscar el bolso. Menos mal. Tomá, es de parte del puerto.'], after: ['Una cosa menos en el depósito. Gracias.'],
    reward: [['ultraesfera', 2]],
  },
];

export const FAVOR_SCRIPTS: Record<string, (api: any, npc?: any) => Promise<void>> = {
  async fv(api, npc) {
    const c: Chain = FAVORS.find((f) => f.id === npc.fvId)!;
    const key = (i) => `ev_fv_${c.id}_${i}`;
    const n = c.mids.length;
    const who = npc.name;
    if (npc.fvRole === 0) {
      if (api.flag(key('z'))) return api.say(c.after, { name: who });
      if (api.flag(key(0))) {
        if (api.flag(key(n))) {
          await api.say(c.done, { name: who });
          api.setFlag(key('z'));
          api.sfx('catch');
          for (const [item, q] of c.reward) await api.give(item, q);
          return;
        }
        return api.say(c.wait, { name: who });
      }
      await api.say(c.ask, { name: who });
      api.setFlag(key(0));
      return;
    }
    const j = npc.fvRole as number;
    if (api.flag(key(j))) return api.say(c.midAfter[0] ?? c.idle, { name: who });
    if (api.flag(key(j - 1))) {
      await api.say(c.mid[j - 1], { name: who });
      api.setFlag(key(j));
      return;
    }
    await api.say(c.idle, { name: who });
  },
};

export function addFavors(OUTDOOR: Record<string, any>) {
  const put = (s: Spot, fvId: string, fvRole: number) => {
    const m = OUTDOOR[s.map];
    if (!m) return;
    const list = [{ x: s.x, y: s.y, look: s.look, dir: 'down', name: s.name, script: 'fv', fvId, fvRole }];
    const taken = new Set<string>((m.npcs ?? []).map((o) => `${o.x},${o.y}`));
    fitToMap(m.tiles, list, taken);
    // never stand on the trail itself (a person there could block a narrow passage): step onto open grass nearby
    const n0 = list[0];
    if ('=cb'.includes(m.tiles[n0.y]?.[n0.x])) {
      const busy = new Set<string>([...taken, ...(m.items ?? []).map((o) => `${o.x},${o.y}`)]);
      const count = new Map<string, number>();
      for (const row of m.tiles) for (const ch of row) if (ch !== '#') count.set(ch, (count.get(ch) ?? 0) + 1);
      const ground = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '.'; // themed towns use their own ground character
      let best: [number, number] | null = null, bd = 99;
      for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
        const x = n0.x + dx, y = n0.y + dy, d = Math.abs(dx) + Math.abs(dy);
        if (d < bd && ('.,f' + ground).includes(m.tiles[y]?.[x] ?? '#') && !busy.has(`${x},${y}`)) { best = [x, y]; bd = d; }
      }
      if (best) [n0.x, n0.y] = best;
    }
    (m.npcs ??= []).push(...list);
  };
  for (const c of FAVORS) {
    put(c.giver, c.id, 0);
    c.mids.forEach((s, i) => put(s, c.id, i + 1));
  }
}
