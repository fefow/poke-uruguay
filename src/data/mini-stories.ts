// Mini stories: a chain of things to do in and around a city (sometimes farther away) that ends by unlocking something
// the adventure needs: a key item that opens a way (Soga, Canoa, Bicicleta, Guantes) or a gym whose leader is away.
// Each story has a beginning (someone tells what happened), a mission in several steps spread over nearby places, and an
// ending. No riddles. People who block only describe the situation; the clues are partial and spread among several
// people. Characters leave walking, never vanish in front of the player.
//
// Progress is a number per story, the "stage": flag ev_ms_<id>_<n> is set when stage n is reached. Steps that can be done
// in any order are "parts" (ev_ms_<id>_p_<part>); when every part is done the story moves to the next stage.
// A story whose prize the player already owns (older saves, or the debug jump) counts as finished.
import { TILE_INFO } from '../gfx/tiles.ts';
import { mapBand, badgeOf } from './route.ts';

type Place = {
  map: string;
  near?: [number, number];      // the closest reachable free tile to this point
  from?: string;                // or: on the way in from this neighbour map, `frac` of the walk across
  frac?: number;
  grass?: boolean;              // prefer tall grass (something lost in the pastizal)
  door?: string;                // or: beside the door that leads to this interior
  replace?: string;             // or: the person with this script in an interior takes the role
};
type Act = {
  at: number;                   // stage at which this person moves the story on
  part?: string;                // a step that can be done in any order with the other parts
  say: string[];
  fight?: string;               // a wild creature to beat first (level: top of the map's band)
  fled?: string[];              // said when the fight was not won
  take?: string[];              // key items handed over
  give?: string;                // key item received
  grant?: [string, string];     // the prize: [item, flag that says it was received]
  then?: string[];              // said after giving or taking
  leave?: boolean;              // walks away when done
};
type Person = {
  key: string; at: Place; look: string; name?: string; dir?: string; animal?: boolean;
  show?: [number, number?];     // visible while lo <= stage < hi
  lines: [number, string[]][];  // what they say from a stage on (the last one that applies)
  acts?: Act[];
};
type Story = {
  id: string; title: string; done: number; parts?: string[];
  owned?: (f: Record<string, boolean>) => boolean; // the prize is already the player's
  gym?: { map: string; to: string; deny: string[] }; // a gym door that stays closed until the story ends
  people: Person[];
};

export const MINI_STORIES: Story[] = [
  {
    id: 'soga', title: 'La soga del escalador', done: 5, owned: (f) => !!f.got_soga,
    people: [
      {
        key: 'escalador', at: { map: 'casa_frb', replace: 'gift_soga' }, look: 'gaucho', name: 'Escalador',
        lines: [[1, ['La soga quedó colgada en la boca de la cueva. Con este tobillo no vuelvo a buscarla.']], [5, ['En las cuevas, las cascadas esconden cornisas. Subí con la soga y fijate qué guardan.']]],
        acts: [
          { at: 0, say: ['Trepé cuanta pared hay entre Fray Bentos y Rivera. En la Cueva de Palmitas me torcí el tobillo y salí como pude.', 'La soga quedó colgada en la entrada. Sin ella no subo ni una escalera.'] },
          {
            at: 4, take: ['soga_mojada'], say: ['¡Mi soga! Está mojada y con olor a río, pero entera.'],
            grant: ['soga', 'got_soga'], then: ['Yo ya no tengo fuerzas para más. Llevátela vos.', 'En las cuevas hay cascadas que caen sobre cornisas escondidas. Caminá contra la cascada y subís; para bajar, caminá hacia abajo desde la cornisa.'],
          },
        ],
      },
      {
        key: 'pescadora', at: { map: 'villasoriano', near: [8, 10] }, look: 'girl', name: 'Pescadora',
        lines: [[0, ['El río trae de todo. Hace unos días me encontré una soga de colores colgando de una piedra, río arriba.']], [2, ['Con la soga atada al bote no me animo a soltarla. Los cabos viejos se deshacen en la mano.']], [4, ['Los cabos nuevos aguantan cualquier correntada. Gracias.']]],
        acts: [
          { at: 1, say: ['¿Una soga de escalador? Sí, la tengo. La encontré colgando en la boca de una cueva.', 'Ahora es lo único que tengo para amarrar el bote: los cabos viejos se pudrieron con el agua.'] },
          { at: 3, take: ['cabos'], say: ['¡Cabos nuevos! Con esto el bote queda firme.', 'Tomá la soga. Que vuelva a su dueño.'], give: 'soga_mojada' },
        ],
      },
      {
        key: 'encargado', at: { map: 'shop_mercedes', near: [3, 5] }, look: 'almacenero', name: 'Encargado del depósito',
        lines: [[0, ['Ordeno el depósito. Hay de todo, hasta lo que nadie pide.']], [3, ['Si se termina el rollo, en un mes llega otro.']]],
        acts: [{ at: 2, say: ['¿Cabos de amarre para una pescadora de Villa Soriano? Me quedan unos rollos en el fondo.', 'A la gente del río no se le cobra. Llevalos.'], give: 'cabos' }],
      },
      { key: 'vecina_frb', at: { map: 'fraybentos', near: [30, 14] }, look: 'mom', name: 'Vecina', show: [1, 5], lines: [[1, ['Al escalador lo vi volver rengo del lado de Palmitas, sin nada al hombro.', 'Lo que se pierde por allá, el río lo baja hasta Villa Soriano.']]] },
      { key: 'vecino_vs', at: { map: 'villasoriano', near: [18, 6] }, look: 'oldman', name: 'Vecino', lines: [[0, ['Acá vivimos del río. Lo que no llega por agua, llega desde Mercedes.']], [2, ['Para los botes, todo se compra en Mercedes. El almacén tiene un depósito enorme.']]] },
    ],
  },
  {
    id: 'quiroga', title: 'El cuaderno de Quiroga', done: 3, owned: (f) => !!f[badgeOf('salto')],
    gym: { map: 'salto', to: 'gym_sal', deny: ['La puerta del gimnasio está cerrada.', 'Un cartel escrito a mano dice: "Salí a escribir. H. Q."'] },
    people: [
      {
        key: 'quiroga', at: { map: 'guichon', near: [20, 8] }, look: 'leader_quiroga', name: 'Horacio Quiroga', show: [0, 3],
        lines: [[1, ['Sin ese cuaderno no vuelvo. Ahí está el cuento entero, y no me lo acuerdo de memoria.']]],
        acts: [
          { at: 0, say: ['Vine a las termas a terminar un cuento, lejos del ruido de la ciudad.', 'En la ruta se levantó un viento de los que arrancan sombreros, y el cuaderno salió volando de la valija.'] },
          { at: 2, take: ['cuaderno_quiroga'], say: ['¡El cuaderno! Mojado, pero se lee todo.', 'El gimnasio estuvo cerrado demasiado tiempo. Vuelvo a Salto ya mismo; te espero allá.'], leave: true },
        ],
      },
      {
        key: 'cuaderno', at: { map: 'ruta3', from: 'guichon', frac: 0.45, grass: true }, look: 'ball', show: [0, 2],
        lines: [[0, ['Entre el pastizal hay un cuaderno empapado, lleno de letra apretada. En la tapa dice "H. Q.".', 'No es tuyo. Lo dejás donde estaba.']]],
        acts: [{ at: 1, say: ['Entre el pastizal hay un cuaderno empapado, lleno de letra apretada. En la tapa dice "H. Q.".'], give: 'cuaderno_quiroga' }],
      },
      { key: 'gurisa', at: { map: 'ruta3', from: 'salto', frac: 0.3 }, look: 'girl', name: 'Caminante', lines: [[0, ['Hace unos días el viento soplaba tan fuerte que volaban hojas escritas sobre el pastizal.', 'Iban para el lado de las termas.']]] },
      { key: 'vecino_sal', at: { map: 'salto', near: [22, 20] }, look: 'oldman', name: 'Vecino', lines: [[0, ['El escritor del gimnasio salió hacia el sur con una valija llena de papeles.']], [3, ['El escritor volvió y abrió el gimnasio. Dicen que terminó el cuento.']]] },
      { key: 'vecina_sal', at: { map: 'salto', near: [44, 30] }, look: 'maestra', name: 'Maestra', lines: [[0, ['Quiroga dice que el agua caliente le aclara las ideas. Cuando se traba con un cuento, desaparece unos días.']]] },
    ],
  },
  {
    id: 'canoa', title: 'La canoa del Cuareim', done: 3, parts: ['brea', 'remos'], owned: (f) => !!f.got_canoa,
    people: [
      {
        key: 'pescador', at: { map: 'casa_artigas', replace: 'gift_surf' }, look: 'pescador', name: 'Pescador',
        lines: [[1, ['Con el casco rajado se llena de agua en dos remadas. Y sin remos, ni hablar.']], [3, ['El Cuareim es manso, pero hay que respetarlo. La Canoa solo resiste con la Medalla Rivera.']]],
        acts: [
          { at: 0, say: ['Vivo a orillas del río desde que nací. Tengo una canoa para el Cuareim, pero no está para usarse.', 'La semana pasada el casco se rajó contra una piedra, y la correntada se llevó los remos.'] },
          {
            at: 2, take: ['brea', 'remos'], say: ['¡Brea de la buena y mis remos! Dame un rato.', '… Listo. El casco quedó como nuevo.'],
            grant: ['canoa', 'got_canoa'], then: ['La canoa es tuya. Caminá hacia el agua y subís sola.', 'Ojo: las corrientes de más al este son fuertes. Hace falta la Medalla Rivera para animarse.'],
          },
        ],
      },
      {
        key: 'carpintero', at: { map: 'baltasar', near: [20, 8] }, look: 'obrero', name: 'Carpintero de ribera',
        lines: [[0, ['Calafateo cascos desde chico. Brea nunca me falta.']]],
        acts: [{ at: 1, part: 'brea', say: ['¿Un casco rajado en Artigas? Eso se arregla con brea caliente.', 'Llevate este tarro. Que no se enfríe en el camino.'], give: 'brea' }],
      },
      {
        key: 'remera', at: { map: 'belen', near: [8, 14] }, look: 'girl', name: 'Muchacha de la costa',
        lines: [[0, ['Esta mañana la corriente trajo unos remos hasta la orilla. Los guardé por si aparece el dueño.']]],
        acts: [{ at: 1, part: 'remos', say: ['¿Son de un pescador de Artigas? Tienen las iniciales talladas en el mango.', 'Llevaselos. Acá no los usa nadie.'], give: 'remos' }],
      },
      { key: 'vecino_art', at: { map: 'artigas', near: [20, 20] }, look: 'gaucho', name: 'Vecino', lines: [[0, ['Lo que se lleva el río aparece días después en la costa de Belén.']]] },
      { key: 'vecina_art', at: { map: 'artigas', near: [40, 14] }, look: 'campesina', name: 'Vecina', lines: [[0, ['Los cascos de madera se tapan con brea. En Tranqueras hay carpinteros de ribera que la preparan.']]] },
    ],
  },
  {
    id: 'bici', title: 'Las bicicletas que no llegan', done: 5, owned: (f) => !!f.got_bici,
    people: [
      {
        key: 'duena', at: { map: 'bici_tac', replace: 'gift_tac' }, look: 'mom', name: 'Dueña',
        lines: [[1, ['El local sin bicicletas parece un galpón. Ojalá aparezca ese camión.']], [5, ['Al norte de la ciudad empieza la Ciclovía. Solo se entra en bicicleta. Usala desde el menú.']]],
        acts: [
          { at: 0, say: ['Bienvenido a El Pedal. Hace veinte años que armo bicicletas para el norte.', 'El camión que trae las bicicletas desde Rivera tenía que llegar ayer, y no apareció. No tengo una sola para mostrar.'] },
          {
            at: 4, say: ['¡Llegó el camión! El chofer me contó lo que hiciste.', 'Esta quedó para vos: va cuatro veces más rápido que caminando.'],
            grant: ['bici', 'got_bici'], then: ['Se usa desde el menú. Bajo techo no se puede, y en combate no cambia nada.', 'Al norte de la ciudad hay una Ciclovía. Solo se entra en bicicleta.'],
          },
        ],
      },
      {
        key: 'camionero', at: { map: 'tranqueras', near: [10, 8] }, look: 'camionero', name: 'Camionero', show: [0, 4],
        lines: [[0, ['Llevo bicicletas para Tacuarembó, y el camión no arranca.']], [2, ['Una correa así no la tiene cualquiera. Hace falta un taller grande.']]],
        acts: [
          { at: 1, say: ['¿Te manda la de El Pedal? Decile que no me olvidé de ella.', 'Se cortó la correa del motor justo al cruzar el paso. Una correa así no se consigue en un pueblo.'] },
          { at: 3, take: ['correa'], say: ['¡La correa! Es justo la medida.', 'Listo, arranca. Me voy derecho a Tacuarembó, que la dueña debe estar furiosa.'], leave: true },
        ],
      },
      {
        key: 'mecanico', at: { map: 'rivera', near: [40, 24] }, look: 'obrero', name: 'Mecánico de la frontera',
        lines: [[0, ['Arreglo camiones de los dos lados de la frontera. Repuestos tengo de todo.']]],
        acts: [{ at: 2, say: ['¿Una correa para el camión de las bicicletas? Lo conozco, pasa todas las semanas.', 'Tomá, es la medida justa. Ya me la pagará cuando vuelva.'], give: 'correa' }],
      },
      { key: 'vecino_tac', at: { map: 'tacuarembo', near: [30, 20] }, look: 'gaucho', name: 'Vecino', lines: [[0, ['Los camiones que vienen de Rivera cruzan por el Paso del Río Tacuarembó.']]] },
      { key: 'vecina_riv', at: { map: 'rivera', near: [24, 30] }, look: 'girl', name: 'Vecina', lines: [[0, ['El taller de la frontera tiene repuestos que no hay en ningún otro lado del país.']]] },
    ],
  },
  {
    id: 'potro', title: 'El potro del domador', done: 3, owned: (f) => !!f.got_guantes,
    people: [
      {
        key: 'domador', at: { map: 'casa_tac', replace: 'gift_fuerza' }, look: 'gaucho', name: 'Domador',
        lines: [[1, ['Sin el moro no me puedo ir a la doma de Melo.']], [3, ['Con esos guantes movés lo que quieras. Pero la Medalla Tacuarembó es la que te da el derecho.']]],
        acts: [
          { at: 0, say: ['Domo potros hace años y no hay animal que me gane de fuerza. Salvo el moro.', 'Anoche rompió el palenque y salió al galope. Este es su cabestro: sin él no se deja tocar por nadie.'], give: 'cabestro' },
          {
            at: 2, say: ['¡Volvió el moro! Llegó solo al trote, con el cabestro puesto.', 'Tomá: estos guantes son los que uso para la doma. Con ellos podés empujar rocas pesadas, caminando contra ellas.'],
            grant: ['guantes', 'got_guantes'], then: ['Solo te van a servir si ganás la Medalla Tacuarembó.'],
          },
        ],
      },
      {
        key: 'potro', at: { map: 'r_tupambae_melo', from: 'tupambae', frac: 0.25 }, look: 'animal:alazan', animal: true, show: [0, 2],
        lines: [[0, ['Un potro moro pasta tranquilo. Cuando te acercás, resopla y da un paso atrás.']]],
        acts: [{ at: 1, take: ['cabestro'], say: ['El potro moro huele el cabestro y se queda quieto.', 'Le pasás el cabestro por la cabeza. Apenas lo soltás, sale al trote hacia Tacuarembó.'], leave: true }],
      },
      { key: 'moro', at: { map: 'tacuarembo', door: 'casa_tac' }, look: 'animal:alazan', animal: true, show: [2], lines: [[2, ['El potro moro come pasto junto a la casa del domador. Esta vez está bien atado.']]] },
      { key: 'peon_tac', at: { map: 'tacuarembo', near: [44, 20] }, look: 'gaucho', name: 'Peón', lines: [[0, ['Anoche pasó un caballo al galope por la calle. Iba para el sur.']]] },
      { key: 'vecina_tup', at: { map: 'tupambae', near: [14, 8] }, look: 'campesina', name: 'Vecina', show: [0, 2], lines: [[0, ['Algo se comió la mitad de mi huerta. Las huellas son de herradura y siguen hacia el camino a Melo.']]] },
    ],
  },
  {
    id: 'vendimia', title: 'La vendimia', done: 3, parts: ['e1', 'e2', 'e3'], owned: (f) => !!f[badgeOf('canelones')],
    gym: { map: 'canelones', to: 'gym_canelones', deny: ['La puerta del gimnasio del INAVI está cerrada.', 'Una nota pegada en el vidrio dice: "Estoy en la vendimia. Tomás."'] },
    people: [
      {
        key: 'tomas', at: { map: 'sanramon', near: [12, 8] }, look: 'leader_inavi', name: 'Tomás', show: [0, 3],
        lines: [[1, ['Mientras los enjambres sigan en las parras, no me muevo de acá.']]],
        acts: [
          { at: 0, say: ['Soy Tomás, el del gimnasio de Canelones. Este año la vendimia viene mal.', 'Tres enjambres se instalaron en las parras de San Ramón. Si no se van, se pierde la cosecha entera.'] },
          { at: 2, say: ['Las parras están libres. Ya se puede cosechar.', 'El gimnasio estuvo cerrado demasiado tiempo. Vuelvo a Canelones; te espero allá.'], leave: true },
        ],
      },
      ...([['e1', 'sanramon', [6, 5], 'avispa'], ['e2', 'sanramon', [20, 11], 'camoati'], ['e3', 'r_sanramon_canelones', null, 'cortadora']] as [string, string, [number, number] | null, string][]).map(([part, map, near, sp]) => ({
        key: part, at: near ? { map, near } : { map, from: 'sanramon', frac: 0.15 }, look: `animal:${sp}`, animal: true, part,
        lines: [[0, ['Un enjambre zumba sobre las parras. Mejor no molestarlo sin motivo.']]] as [number, string[]][],
        acts: [{ at: 1, part, fight: sp, say: ['Un enjambre zumba sobre las parras, comiéndose la uva.'], fled: ['El enjambre sigue sobre las parras.'], then: ['El enjambre se dispersa y las parras quedan tranquilas.'] }],
      })),
      { key: 'vecino_can', at: { map: 'canelones', near: [32, 24] }, look: 'oldman', name: 'Vecino', lines: [[0, ['Este año la uva se pierde en la planta. Dicen que hay plaga en los viñedos de San Ramón.']], [3, ['Tomás volvió de la vendimia. El gimnasio abrió otra vez.']]] },
    ],
  },
];

const stageFlag = (s: Story, n: number) => `ev_ms_${s.id}_${n}`;
const partFlag = (s: Story, p: string) => `ev_ms_${s.id}_p_${p}`;
/** How far the player got in a story (0 = nobody talked yet; s.done = finished). */
export function stageOf(s: Story, has: (k: string) => boolean): number {
  const f = new Proxy({}, { get: (_, k) => has(String(k)) }) as Record<string, boolean>;
  if (s.owned?.(f)) return s.done;
  for (let n = s.done; n > 0; n--) if (has(stageFlag(s, n))) return n;
  return 0;
}
const byId = (id: string) => MINI_STORIES.find((m) => m.id === id)!;

export const MS_SCRIPTS: Record<string, (api: any, npc?: any) => Promise<void>> = {
  async ms_step(api, npc) {
    const s = byId(npc.ms);
    const p = s.people.find((o) => o.key === npc.msKey)!;
    const st = stageOf(s, (k) => api.flag(k));
    const name = p.name ? { name: p.name } : {};
    const act = (p.acts ?? []).find((a) => a.at === st && !(a.part && api.flag(partFlag(s, a.part))));
    if (!act) {
      const line = [...p.lines].reverse().find(([from]) => from <= st);
      if (line) await api.say(line[1], name);
      return;
    }
    await api.say(act.say, name);
    if (act.fight) {
      const [, hi] = mapBand(npc.map) ?? [20, 24];
      const res = await api.wildBattle(act.fight, hi);
      if (res !== 'win' && res !== 'caught') { if (res !== 'lose' && act.fled) await api.say(act.fled); return; }
    }
    for (const k of act.take ?? []) api.takeItem(k, 1);
    if (act.give) await api.give(act.give, 1);
    if (act.grant) { await api.give(act.grant[0], 1); api.setFlag(act.grant[1]); }
    if (act.part) {
      api.setFlag(partFlag(s, act.part));
      if ((s.parts ?? []).every((q) => api.flag(partFlag(s, q)))) api.setFlag(stageFlag(s, st + 1));
    } else api.setFlag(stageFlag(s, st + 1));
    if (act.then) await api.say(act.then, name);
    if (act.leave) await api.npcWalkOff(npc.id);
  },
};

// ---------------------------------------------------------------- placing people on the maps

const solid = (c: string | undefined) => c === undefined || !!TILE_INFO[c]?.solid;
const GROUND = new Set(['.', ',', '`', ';', 'f', 's', 'i', 'Y', 'A', 'c', '=', 'b']);
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** A free tile the player can reach, as close as possible to what `at` asks for. */
function spot(m: any, at: Place): [number, number] | null {
  const rows: string[] = m.tiles;
  const h = rows.length, w = rows[0].length;
  const tile = (x: number, y: number) => rows[y]?.[x];
  const taken = new Set<string>([...(m.npcs ?? []), ...(m.items ?? [])].map((o) => `${o.x},${o.y}`));
  const seeds: [number, number][] = [];
  if (m.indoor) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (tile(x, y) === 'm') seeds.push([x, y]);
  } else {
    const sides = at.from ? Object.entries(m.exits ?? {}).filter(([, e]: any) => e.to === at.from).map(([k]) => k) : Object.keys(m.exits ?? {});
    for (const side of sides) {
      const cells = side === 'n' ? [...Array(w).keys()].map((x) => [x, 0]) : side === 's' ? [...Array(w).keys()].map((x) => [x, h - 1]) : side === 'w' ? [...Array(h).keys()].map((y) => [0, y]) : [...Array(h).keys()].map((y) => [w - 1, y]);
      for (const [x, y] of cells) if (!solid(tile(x, y))) seeds.push([x, y]);
    }
  }
  // walk the map from the way in
  const dist = new Map<string, number>();
  const q: [number, number][] = [];
  for (const [x, y] of seeds) { dist.set(`${x},${y}`, 0); q.push([x, y]); }
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (dist.has(k) || solid(tile(nx, ny))) continue;
      dist.set(k, dist.get(`${x},${y}`)! + 1);
      q.push([nx, ny]);
    }
  }
  const far = Math.max(0, ...dist.values());
  let target = at.near;
  if (at.door) {
    const i = (m.doors ?? []).findIndex((d: any) => (typeof d === 'string' ? d : d.to) === at.door);
    let n = -1;
    for (let y = 0; y < h && !target; y++) for (let x = 0; x < w; x++) if (tile(x, y) === 'D' && ++n === i) { target = [x + 2, y + 2]; break; }
  }
  let best: [number, number] | null = null, bestScore = Infinity;
  for (const [k, d] of dist) {
    const [x, y] = k.split(',').map(Number);
    const c = tile(x, y);
    if (!GROUND.has(c) || taken.has(k) || x < 1 || y < 1 || x > w - 2 || y > h - 2) continue;
    if (tile(x, y - 1) === 'D' || tile(x, y - 1) === 'm' || c === 'm') continue; // never in front of a door
    if (D4.filter(([dx, dy]) => !solid(tile(x + dx, y + dy))).length < 3) continue; // never plugs a narrow pass
    let score = target ? Math.abs(x - target[0]) + Math.abs(y - target[1]) : Math.abs(d - far * (at.frac ?? 0.5));
    if (c === '=' || c === 'c') score += 2;
    if (at.grass && c !== ',') score += 6;
    if (score < bestScore) { best = [x, y]; bestScore = score; }
  }
  return best;
}

/** Puts every person of every story on its map, and closes the gyms whose leader is away. */
export function addMiniStories(OUTDOOR: Record<string, any>, INTERIOR: Record<string, any>) {
  const mapOf = (id: string) => OUTDOOR[id] ?? INTERIOR[id];
  for (const s of MINI_STORIES) {
    const has = (f: Record<string, boolean>) => (k: string) => !!f[k];
    for (const p of s.people) {
      const m = mapOf(p.at.map);
      if (!m) continue;
      const [lo, hi] = [p.show?.[0] ?? 0, p.show?.[1] ?? Infinity];
      const partDone = (f) => !!(p as any).part && !!f[partFlag(s, (p as any).part)];
      const cond = (f: Record<string, boolean>) => { const st = stageOf(s, has(f)); return st >= lo && st < hi && !partDone(f); };
      const role = { script: 'ms_step', ms: s.id, msKey: p.key, id: `ms_${s.id}_${p.key}`, name: p.name, map: p.at.map };
      if (p.at.replace) {
        const n = (m.npcs ?? []).find((o) => o.script === p.at.replace);
        if (n) { Object.assign(n, role, { text: undefined, cond: p.show ? cond : n.cond }); continue; }
      }
      const at = spot(m, p.at);
      if (!at) continue;
      (m.npcs ??= []).push({ x: at[0], y: at[1], look: p.look, dir: p.dir ?? 'down', ...role, cond, ...(p.animal ? { critter: true } : {}) });
    }
    if (s.gym) {
      const m = OUTDOOR[s.gym.map];
      const i = (m?.doors ?? []).findIndex((d) => (typeof d === 'string' ? d : d.to) === s.gym!.to);
      if (i >= 0) m.doors[i] = { to: s.gym.to, req: (f: Record<string, boolean>) => stageOf(s, has(f)) >= s.done, deny: s.gym.deny };
    }
  }
}
