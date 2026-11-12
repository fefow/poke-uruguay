// The five legends and the Maestro Tabárez as a mentor.
//
// During the journey, one storyteller per legend tells what the old people say about it (ev_ley_<species>). After the
// Liga, Tabárez opens the last chapter in his laboratory: he gives a partial lead to the next legend, listens to each
// capture and rewards it, and closes the story when the five are registered. Each legend only shows up when the ones
// before it are at peace (see the `legend` entries of the maps), and the Ombú, the oldest, comes last.
//
// Before that, every time the player comes back to Carmelo, Tabárez has something to say about the latest thing that
// happened on the road (ev_tab_<n>), and the people who left the Equipo PP turn up again once it is dissolved.
import { TILE_INFO } from '../gfx/tiles.ts';
import { spot } from './mini-stories.ts';

type Legend = {
  key: string; name: string;
  teller: { map: string; near: [number, number]; look: string; name: string };
  tale: string[];            // what the storyteller says
  lead: string[];            // Tabárez's partial lead, once the legend can be found
  told: string[];            // Tabárez, when the player comes back with it
  prize: [string, number];
  needs: string[];           // flags that must be set before it shows up (besides `champion`)
};

/** In the order they can be found. */
export const LEYENDAS: Legend[] = [
  {
    key: 'pamperon', name: 'Cardenal Azul', needs: ['got_pluma'],
    teller: { map: 'ecilda', near: [8, 8], look: 'abuela', name: 'Abuela' },
    tale: ['Mi madre tendía la ropa mirando el cielo. Si pasaba el cardenal azul, la dejaba colgada toda la noche.', 'Decía que detrás de él venía el pampero, y que al otro día amanecía limpio y frío.', 'Hace años que no lo veo pasar. Y hace años que la niebla no se va del todo.'],
    lead: ['El Cardenal Azul volvió a volar, y todo pájaro vuelve a su nido.', 'Vos sabés dónde lo viste por primera vez. Llevá la pluma: sin ella no baja.'],
    told: ['Lo trajiste. No encerrado: con vos, que es otra cosa.', 'Díaz quiso una jaula. Vos le ofreciste compañía, y él eligió. Esa es toda la diferencia entre su proyecto y el nuestro.'],
    prize: ['ultraesfera', 5],
  },
  {
    key: 'ballenaplata', name: 'Ballenaplata', needs: [],
    teller: { map: 'paloma', near: [18, 6], look: 'pescador', name: 'Pescador viejo' },
    tale: ['En invierno, frente a Maldonado, canta una ballena del color de la plata.', 'Cuando canta, los pescadores apagamos el motor. No es por respeto: es que el mar se queda quieto y da miedo hacer ruido.', 'Nadie la vio desde la playa. Hay que estar en el agua.'],
    lead: ['Los biólogos de la costa grabaron un canto frente a Maldonado. Dura horas y calma el oleaje.', 'Desde la playa no se la ve. Los que la oyeron estaban en el agua.'],
    told: ['Ballenaplata. La oí una sola vez, de joven, desde un bote prestado.', 'El Cardenal ordena el viento y ella ordena el mar. Empiezo a creer que cada parte del país tiene quien la cuide.'],
    prize: ['dulce_de_leche', 2],
  },
  {
    key: 'soldemayo', name: 'Soldemayo', needs: ['caught_pamperon', 'caught_ballenaplata'],
    teller: { map: 'florida', near: [22, 26], look: 'maestra', name: 'Maestra' },
    tale: ['En Florida se declaró la independencia, y a mis alumnos les cuento lo que me contaron a mí.', 'El sol de la bandera tiene cara porque alguien lo vio así: un sol que mira.', 'Dicen que solo se muestra ante quien recorrió el país entero, y que elige el lugar más alto de la capital.'],
    lead: ['Con el viento y el mar en calma, algo cambió sobre la capital.', 'Los cuidadores del Centenario dicen que hay una luz sobre la Torre de los Homenajes, y que se ve desde la cancha de la final.'],
    told: ['El sol de la bandera. Pensé que era una figura, no una criatura.', 'Solo se muestra ante quien recorrió todo el país. Vos lo caminaste de Carmelo a Montevideo, pueblo por pueblo.'],
    prize: ['chivito', 2],
  },
  {
    key: 'yaguarete', name: 'Yaguareté', needs: ['caught_pamperon', 'caught_ballenaplata', 'caught_soldemayo'],
    teller: { map: 'casupa', near: [14, 12], look: 'gaucho', name: 'Tropero' },
    tale: ['Mi bisabuelo decía que al último yaguareté lo mataron hace más de cien años.', 'Yo arreo ganado por estas cuchillas desde gurí. Hay noches, cerca de Minas, en que la tropa entera se queda quieta mirando los cerros.', 'A un animal que no existe no se lo mira así.'],
    lead: ['Almada midió algo raro en las sierras de Minas: noches enteras sin un solo grillo.', 'Un silencio así lo impone un cazador. Y en esos cerros hace un siglo que no queda ninguno. O eso creíamos.'],
    told: ['El Yaguareté. Lo dimos por extinto y nos estuvo mirando todo este tiempo.', 'No lo trates como un trofeo. Es lo más antiguo que camina por este país. O casi.'],
    prize: ['garrapinada', 2],
  },
  {
    key: 'ombu', name: 'Ombú', needs: ['caught_pamperon', 'caught_ballenaplata', 'caught_soldemayo', 'caught_yaguarete'],
    teller: { map: 'sarandi', near: [16, 12], look: 'oldman', name: 'Paisano' },
    tale: ['En la llanura un ombú solo se ve desde una legua. Por eso los viejos se guiaban por ellos.', 'Mi abuelo hablaba de uno que no estaba nunca dos veces en el mismo lugar. Decía que toda criatura bajó alguna vez de su sombra.', 'Según él, solo se deja ver cuando el viento, el mar, el sol y el monte están en paz. Yo nunca lo vi.'],
    lead: ['Queda una leyenda, la más vieja. Dicen que toda criatura descendió de su sombra.', 'En el centro del país, antes de Durazno, hay un pueblo de plaza grande. Me escribieron que ahí creció un árbol que ayer no estaba.'],
    told: ['El Ombú. Entonces era cierto: hay un árbol del que bajó todo lo demás.', 'Guardalo bien. No hay otro.'],
    prize: ['pan_casero', 3],
  },
];

const tellFlag = (k: string) => `ev_ley_${k}`;
const toldFlag = (k: string) => `ev_ley_ok_${k}`;

/** What Tabárez says about the road so far: the latest thing that happened and that he has not commented yet. */
const NEWS: [string, string[]][] = [
  ['badge1', ['Elena me escribió desde Trinidad. Dice que tu equipo pisa firme.', 'El huevo que te llevó Gonzalo apareció entre los pajonales de Palmitas. Cuando nazca, contame qué salió.']],
  ['marta_help', ['Marta me mandó copia de los planos que le quisieron sacar en la cueva. Son máquinas de niebla, {player}.', 'Conozco la letra de los márgenes. Ojalá me equivoque.']],
  ['anglo_pp', ['Desde Fray Bentos duermo mal. Te debía esa verdad desde el primer día.', 'El Medidor de Niebla lo armamos Díaz y yo para estudiar el cielo. Ahora sirve para saber cuánto le falta a él para taparlo.']],
  ['represa_clear', ['Vi desde acá cómo volvía la luz al litoral. Fue la Represa, ¿no?', 'Garúa es ingeniera. Díaz siempre supo rodearse de gente capaz y convencerla de que hacía un bien.']],
  ['torre_clear', ['Mariela me llamó desde Rivera: la Torre de Niebla está apagada y la frontera volvió a verse.', 'Bruma cree de verdad que cuida el clima. Díaz le dice a cada uno lo que quiere oír.']],
  ['quebrada_clear', ['Veinte años esperé para verlo volar otra vez. Todavía me tiemblan las manos.', 'Guardá bien esa pluma. El Cardenal no se la deja a cualquiera.']],
  ['lamp_returned', ['El farero de Cabo Polonio me mandó saludos. Dice que la luz gira como antes y que los barcos volvieron a pasar cerca.']],
  ['obs_clear', ['Almada volvió. Trajo el registro del Observatorio y pidió trabajo, de lo que fuera.', 'Le dije que acá siempre hay viento para medir. Está ahí, con los instrumentos.']],
  ['pp_clear', ['La fábrica de Minas está parada. Queda Díaz, y lo conozco: no va a esperar sentado.', 'Cuando tengas las doce medallas, buscalo en el puerto de Montevideo. Yo voy a estar cerca.']],
  ['anglo_clear', ['Díaz declaró dos días seguidos. Entregó los planos de todas las torres.', '{rival} está revisando conmigo lo que le mandó al PP. No fue culpa suya, pero quiere repararlo.', 'A vos te queda lo tuyo: el Estadio Centenario.']],
];

/**
 * Tabárez in his laboratory, once the player has the PokeDex. Says the news of the road, then (after the Liga) leads
 * the search for the five legends. Returns true when he said something, so the caller can keep the PokeDex review short.
 */
export async function tabarezTalk(api: any): Promise<boolean> {
  const who = { name: 'Maestro Tabárez' };
  let spoke = false;
  let last = -1;
  NEWS.forEach(([flag], i) => { if (api.flag(flag) && !api.flag(`ev_tab_${i}`)) last = i; });
  if (last >= 0 && !api.flag('champion')) {
    await api.say(NEWS[last][1], who);
    spoke = true;
  }
  NEWS.forEach(([flag], i) => { if (api.flag(flag)) api.setFlag(`ev_tab_${i}`); });
  if (!api.flag('champion')) return spoke;

  if (!api.flag('ev_ley_intro')) {
    api.setFlag('ev_ley_intro');
    await api.say(['Campeón de la Liga Oriental. Salió de este laboratorio con una Pokeball y una carta por buscar.', 'Sentate, {player}. Ahora que el cielo volvió a ser de nadie, quiero mostrarte en qué trabajo.'], who);
    await api.say(['Díaz y yo estudiamos una sola criatura, el Cardenal Azul, y creímos que era única.', 'Revisando los registros con Almada y con {rival} encontramos otras cuatro. Aparecen en cuentos de fogón, en partes de pesca, en actas viejas. Siempre las mismas cinco.', 'El viento, el mar, el sol, el monte y un árbol. Las cinco leyendas.'], who);
    const heard = LEYENDAS.filter((l) => api.flag(tellFlag(l.key))).length;
    await api.say(heard >= 3 ? ['Vos recorriste el país escuchando a la gente. Seguro que ya te contaron más de una.']
      : ['En cada rincón del país hay alguien que cuenta una. Vale la pena escucharlos: saben más que mis instrumentos.'], who);
    await api.say(['No te pido que las captures para mí. Te pido que las encuentres antes de que aparezca otro Díaz.', 'Empezá por la que ya conocés. Y volvé a contarme.'], who);
    return true;
  }
  for (const l of LEYENDAS) {
    if (!api.flag(`caught_${l.key}`) || api.flag(toldFlag(l.key))) continue;
    api.setFlag(toldFlag(l.key));
    await api.say(l.told, who);
    await api.say('Esto es para el camino que falta.', who);
    await api.give(l.prize[0], l.prize[1]);
    spoke = true;
  }
  const next = LEYENDAS.find((l) => !api.flag(`caught_${l.key}`));
  if (!next) {
    if (!api.flag('ev_ley_fin')) {
      api.setFlag('ev_ley_fin');
      await api.say(['Las cinco. El viento, el mar, el sol, el monte y el árbol, todas con la misma persona.', 'Hace veinte años firmé un proyecto para entender el clima y casi termino ayudando a venderlo.', 'Vos hiciste lo contrario: recorriste el país, lo escuchaste y te ganaste su confianza. Eso no lo mide ningún instrumento.'], who);
      await api.say(['El registro del Proyecto Pampero se cierra hoy, con tu nombre en la última página.', 'Gracias, {player}. De parte mía, y de un cielo que vuelve a ser de nadie.'], who);
      await api.give('garrapinada', 3);
      await api.give('dulce_de_leche', 3);
      return true;
    }
    return spoke;
  }
  if (next.needs.every((f) => api.flag(f))) { await api.say(next.lead, who); return true; }
  // only the Cardenal can be out of reach here: older saves without the feather
  await api.say(['El Cardenal Azul volvió a volar, pero no baja ante cualquiera.', 'Dejó una pluma en la Quebrada de los Cuervos. Sin ella no te va a reconocer.'], who);
  return true;
}

export const LEYENDA_SCRIPTS: Record<string, (api: any, npc?: any) => Promise<void>> = {
  /** A storyteller: tells the legend; the first time it is remembered, so Tabárez knows the player heard it. */
  async ley_cuento(api, npc) {
    const l = LEYENDAS.find((o) => o.key === npc.ley)!;
    await api.say(l.tale, { name: l.teller.name });
    api.setFlag(tellFlag(l.key));
  },
};

/** People who left the Equipo PP, back in the places where the player met them, once the PP is dissolved. */
const AFTER_PP: { map: string; near: [number, number]; look: string; name: string; text: string[] }[] = [
  { map: 'rocha', near: [10, 20], look: 'obrero', name: 'Olivera', text: ['Me llamo Olivera. Fui recluta: el alambre de San José, las geodas de Artigas, la máquina de esta laguna.', 'Tres veces me cruzaste y tres veces perdí. A la tercera entendí que estaba del lado equivocado.', 'Ahora cuento flamencos para el guardaparque. Pagan menos, pero duermo.'] },
  { map: 'cabo', near: [8, 9], look: 'bruma', name: 'Bruma', text: ['Vine a devolver lo que debía. El farero todavía no me habla, pero me deja limpiar la lámpara.', 'Díaz me dijo que cuidábamos el clima, y le creí porque quería creerle.', 'Desde acá se ve pasar al Cardenal Azul. Con eso me alcanza.'] },
  { map: 'minas', near: [14, 20], look: 'garua', name: 'Garúa', text: ['Estoy desarmando la fábrica pieza por pieza, con una orden del juzgado en el bolsillo.', 'La armé yo, así que sé por dónde empezar.', 'Seguí a Díaz porque sus números cerraban. Nunca me pregunté para quién.'] },
];

const solid = (c: string | undefined) => c === undefined || !!TILE_INFO[c]?.solid;

/** Open ground for a legend to stand on: every tile around it is free, so it never plugs a street. */
function clearing(m: any, near: [number, number]): [number, number] | null {
  const rows: string[] = m.tiles;
  const taken = new Set<string>([...(m.npcs ?? []), ...(m.items ?? [])].map((o) => `${o.x},${o.y}`));
  let best: [number, number] | null = null, bestD = Infinity;
  for (let y = 2; y < rows.length - 2; y++) for (let x = 2; x < rows[0].length - 2; x++) {
    if (!'.,`;f'.includes(rows[y][x])) continue;
    let open = true, roads = 0;
    for (let dy = -1; dy <= 1 && open; dy++) for (let dx = -1; dx <= 1; dx++) { if (solid(rows[y + dy]?.[x + dx]) || taken.has(`${x + dx},${y + dy}`)) { open = false; break; } if ('=c'.includes(rows[y + dy][x + dx])) roads++; }
    if (!open) continue;
    const d = Math.abs(x - near[0]) + Math.abs(y - near[1]) + roads * 4; // away from the streets when there is room
    if (d < bestD) { best = [x, y]; bestD = d; }
  }
  return best;
}

/** Puts the storytellers and the former PP people on their maps, and the Ombú on the plain of Sarandí Grande. */
export function addLeyendas(OUTDOOR: Record<string, any>) {
  for (const l of LEYENDAS) {
    const m = OUTDOOR[l.teller.map];
    const at = m && spot(m, { map: l.teller.map, near: l.teller.near });
    if (at) (m.npcs ??= []).push({ x: at[0], y: at[1], look: l.teller.look, dir: 'down', name: l.teller.name, script: 'ley_cuento', ley: l.key, id: `ley_${l.key}` });
  }
  for (const p of AFTER_PP) {
    const m = OUTDOOR[p.map];
    const at = m && spot(m, { map: p.map, near: p.near });
    if (at) (m.npcs ??= []).push({ x: at[0], y: at[1], look: p.look, dir: 'down', name: p.name, text: p.text, cond: (f) => !!f.anglo_clear });
  }
  const sar = OUTDOOR.sarandi;
  if (sar && !sar.legend) {
    const at = clearing(sar, [Math.round(sar.tiles[0].length * 0.7), Math.round(sar.tiles.length * 0.35)]);
    const ombu = LEYENDAS.find((l) => l.key === 'ombu')!;
    if (at) sar.legend = { x: at[0], y: at[1], species: 'ombu', level: 70, flag: 'caught_ombu', cond: (f) => !!f.champion && ombu.needs.every((k) => f[k]), text: ['Donde termina el pueblo y empieza el campo hay un ombú enorme que ayer no estaba.', 'Bajo su sombra no se oye nada. Las ramas se mueven sin viento.'] };
  }
}
