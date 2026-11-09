// Who says what about a closed road. The people who block a road only describe the situation; the way forward is
// scattered as gossip among the townsfolk, one hint at a time, so the player has to talk to everybody and put it together.
// Per city: [a bit of local colour that explains little, a partial hint].
import { fitToMap } from './map-gen.ts';
import { STOP_INDEX } from './route.ts';

const GUARD = [
  'El guardia de la salida es de esos que miden a la gente por cómo trata a sus criaturas.',
  'Dicen que acepta un combate amistoso y que después deja pasar. Pero no con cualquiera.',
];

export const RUMORS: Record<string, [string, string]> = {
  colonia: ['Al Maestro Tabárez le preocupa que alguien recorra el país sin saber lo que lleva. No suelta a nadie así nomás.', 'En el almacén guardan una carta desde hace días. En el sobre dice «Para Tabárez».'],
  sanjose: ['Faltó alambre en la intendencia y nadie vio quién se lo llevó. Anoche pasó un camión sin patente.', 'Un empleado de la intendencia anda por la salida del pueblo con cara de pocos amigos. No habla con cualquiera.'],
  trinidad: ['Cortaron el camino a Palmitas y no dieron explicaciones. A los que mandan en eso no los vota nadie.', 'Dicen que en el gimnasio de acá se gana algo más que una medalla: la Liga se acuerda de quien le gana a su líder.'],
  mercedes: ['El correo dejó de repartir hacia el oeste. Dicen que se perdió algo importante.', 'La que firma los permisos de paso en el correo es Marta, pero hace días que nadie la ve.'],
  fraybentos: ['El capitán del Buquebus se descompone con solo mirar el agua. Por eso el barco no sale.', 'Cuentan que al norte el monte se cerró de espinas y que solo algo muy filoso abre paso. El capitán tenía algo así.'],
  paysandu: GUARD as [string, string],
  salto: ['Desde la represa dicen que el agua anda rara. Ya van tres noches de luces.', 'El que manda en el gimnasio de acá decide, de hecho, a quién se le abre el camino al norte.'],
  artigas: ['Los mineros de la cooperativa están furiosos: alguien se lleva las geodas en bolsas.', 'Un minero jura que el ladrón se esconde justo donde termina el pueblo.'],
  rivera: ['En la frontera siempre hubo controles, pero esta semana pusieron más.', 'El gimnasio militar forma a la gente que después da las órdenes en el camino.'],
  tacuarembo: ['La Parrilla de la Patria Gaucha lleva días cerrada y nadie cuenta por qué.', 'Dicen que el paso al sur lo cuida quien mejor conoce la tierra. Y esa es la del gimnasio.'],
  melo: ['Las Luces Malas se ven cada noche más cerca de la torre.', 'El pueblo respiraría si alguien apagara lo que hay arriba de esa torre.'],
  quebrada: ['Cada noche bajan camiones grises hacia Lascano. Nadie los frena.', 'En el gimnasio de roca dicen que Lavalleja jamás dejaría pasar a un cobarde. Su gente piensa igual.'],
  rocha: ['La laguna amaneció tapada de niebla y los flamencos se fueron.', 'Un guardaparque anda preocupado por alguien que vigila la salida hacia la costa.'],
  punta: ['El camino a Piriápolis lo cerraron sin aviso y los guardias no dicen quién dio la orden.', 'En el gimnasio del agua dicen que la Liga abre los caminos a quien sabe moverse en aguas turbias.'],
  minas: GUARD as [string, string],
  florida: ['Los pilotos de práctica ya no despegan: dicen que hay un humo raro.', 'El líder del gimnasio vuela alto: lo que él aprueba, la Liga lo respeta.'],
  durazno: ['De la refinería sale un convoy cada noche, sin logo.', 'La del gimnasio sabe mejor que nadie de qué viaja ahí. Dicen que quiere ver a alguien capaz antes de hablar.'],
  canelones: ['Este año la vendimia se atrasó. Algo anda mal con el clima.', 'El del gimnasio no suelta ni una uva sin saber con quién trata. Con el paso pasa lo mismo.'],
};

/** Optional attractions and extras scattered across the route, mentioned by one more neighbour in nearby cities. */
export const ATTRACTIONS: Record<string, [string, string]> = {
  colonia: ['girl', 'Dicen que en Rivera hay un parque donde se pueden atrapar criaturas raras con unas pocas Pokeballs, sin gastar las tuyas.'],
  trinidad: ['boy', 'Pasando Florida se acaba la llanura. Cuentan que allá el líder te regala un silbato para volar entre ciudades.'],
  mercedes: ['oldman', 'Quien tenga tiempo, que pase por Melo: las luces de la torre no son un cuento y nadie sube por gusto.'],
  paysandu: ['campesina', 'En Maldonado hay un casino con fichas. Dicen que los premios no se compran con plata.'],
  salto: ['oldman', 'En Rivera hay un zoológico donde se paga la entrada y se prueba suerte por un rato con las criaturas del campo.'],
  rivera: ['boy', 'En Canelones, un día por semana hacen el concurso de atrapar bichos. Te dan unas bolas y tenés un rato para elegir el mejor.'],
  melo: ['girl', 'Los viejos dicen que las ánimas de la torre se calman con quien las trata con respeto.'],
  rocha: ['campesina', 'En Florida, quien venza al aviador del gimnasio se va de ahí con las alas prestadas.'],
  punta: ['boy', 'Del otro lado del casino hay premios que no se ven en ninguna tienda: criaturas raras para quien junta fichas.'],
  florida: ['oldman', 'Mi abuelo contaba que el hornero de acá aprendió a llevar gente por el cielo. Hay que ganárselo.'],
  canelones: ['girl', 'El parque de la entrada tiene una puerta que se abre cuando empieza el concurso de bichos.'],
  montevideo: ['girl', 'La torre del puerto está cerrada y la antena de la cima no para de emitir. Nadie entiende de dónde sale tanta energía.'],
};

const LOOKS: [string, string][] = [['oldman', 'abuela'], ['boy', 'maestra'], ['campesina', 'hincha'], ['pescador', 'nino'], ['obrero', 'turista'], ['almacenero', 'estudiante'], ['artesana', 'ciclista'], ['cocinero', 'cartero']];

/** Puts the two gossips of each city on its map (anywhere free on the ground, away from the roads). */
export function addRumors(OUTDOOR) {
  for (const [id, [a, b]] of Object.entries(RUMORS)) {
    const m = OUTDOOR[id];
    if (!m?.tiles) continue;
    const [la, lb] = LOOKS[(STOP_INDEX[id] ?? 0) % LOOKS.length];
    const W = m.tiles[0].length, H = m.tiles.length;
    const taken = new Set<string>([...(m.npcs ?? []), ...(m.items ?? [])].map((o) => `${o.x},${o.y}`));
    const folk = [{ x: Math.round(W * 0.3), y: Math.round(H * 0.55), look: la, dir: 'down', text: [a] }, { x: Math.round(W * 0.7), y: Math.round(H * 0.4), look: lb, dir: 'down', text: [b], wander: true }];
    fitToMap(m.tiles, folk, taken);
    (m.npcs ??= []).push(...(folk as any[]));
  }
  for (const [id, [look, text]] of Object.entries(ATTRACTIONS)) {
    const m = OUTDOOR[id];
    if (!m?.tiles) continue;
    const W = m.tiles[0].length, H = m.tiles.length;
    const taken = new Set<string>([...(m.npcs ?? []), ...(m.items ?? [])].map((o) => `${o.x},${o.y}`));
    const folk = [{ x: Math.round(W * 0.5), y: Math.round(H * 0.7), look, dir: 'down', text: [text], wander: true }];
    fitToMap(m.tiles, folk, taken);
    (m.npcs ??= []).push(...(folk as any[]));
  }
}
