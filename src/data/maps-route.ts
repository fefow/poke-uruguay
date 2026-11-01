// The cities, localities and roads added when the adventure became a 19-city route from Colonia
// to Montevideo (see route.js). Maps come from map-gen.js; `rewire` then connects every map on the
// chain to its neighbours and locks each city's road forward until the story opens it.
import type { MapDef } from '../types.ts';
import { TR, room, HOUSE, GYM, poli, shop, casaNpc } from './map-kit.ts';
import { route, wildList, teamOf, fitToMap, rng } from './map-gen.ts';
import { retown } from './town-build.ts';
import { CITY_SPECS, LOC_ARCHETYPES, LOC_PLAN } from './town-specs.ts';
import { STOPS, STOP_INDEX, CHAIN, mapBand, openFlag } from './route.ts';
import { BIOMES, DEPARTMENTS, PLACES } from './atlas.ts';
import { TILE_INFO } from '../gfx/tiles.ts';

// Real road numbers of the legs (the map ids stay the same so saves keep working).
// Localities: two local trainers and someone who has seen the PP pass by, so every stop of the trip has a fight and a clue.
// [look, name, class, intro, lose, after] x2, then the clue.
const LOC_FOLK = {
  palmitas: [['gaucho', 'Ruben', 'Tambero', 'Ordeñé temprano; ahora tengo tiempo.', 'Me dejaste sin leche.', 'La cueva de acá cerca está llena de gente rara.'],
    ['girl', 'Sofía', 'Maestra rural', 'En la escuela enseño las criaturas del pago. Veamos qué sabés.', 'Aprobaste.', 'Mis alumnos dibujan la niebla gris. Antes no había.'],
    ['Anoche entraron camiones grises a la cueva, con máquinas tapadas.', 'El que manejaba tenía una P bordada en la campera.']],
  villasoriano: [['sailor', 'Néstor', 'Pescador', 'El río Negro da buena pesca y buenos rivales.', 'Se me cortó la línea.', 'Acá llegaron los primeros españoles. Es el pueblo más viejo del país.'],
    ['boy', 'Matías', 'Remero', 'Remo todos los días contra la corriente.', 'Me diste vuelta el bote.', 'En Fray Bentos hay movimiento raro en el Anglo.'],
    ['Un barco sin bandera subió por el río hacia Fray Bentos.', 'Llevaba unos tanques que largaban humo blanco.']],
  young: [['gaucho', 'Don Aurelio', 'Productor', 'Soja, trigo y combates. De todo un poco.', 'Mala cosecha.', 'Por la Ruta 24 andan buscando entrenadores fuertes.'],
    ['girl', 'Camila', 'Veterinaria', 'Curo vacas todo el día. Las criaturas me salen fácil.', 'Necesito una curita.', 'Se me perdieron dos vacas en la niebla de la semana pasada.'],
    ['La niebla de la semana pasada no era normal: tapó el campo de golpe y se fue igual.', 'Al otro día había huellas de camión en la banquina.']],
  guichon: [['oldman', 'Don Ciro', 'Bañista', 'Vengo por las termas de Guaviyú. Y por un combate.', 'Necesito otro baño.', 'Las aguas termales curan todo menos las derrotas.'],
    ['boy', 'Tobías', 'Ciclista', 'Pedaleo de Paysandú a Salto ida y vuelta.', 'Pinché.', 'En Salto hay una represa enorme. Dicen que la vigilan de noche.'],
    ['Un hombre de capa gris preguntó cuánta agua pasa por la represa de Salto.', 'Anotaba todo en una libreta con un dibujo de pájaro azul.']],
  belen: [['gaucho', 'Isidro', 'Citricultor', 'Las naranjas de Belén son las más dulces.', 'Exprimido.', 'Cuidá las criaturas del norte: son duras.'],
    ['sailor', 'Elba', 'Pescadora', 'En el Uruguay pescás dorados si tenés paciencia.', 'Se me escapó.', 'Del otro lado está Brasil. Del lado de acá, la niebla.'],
    ['Le robaron la caña a mi vecino. Fue uno de gris que decía que el río era de ellos.', 'Se fue hacia Artigas.']],
  baltasar: [['gaucho', 'Rolando', 'Forestal', 'Planto pinos, corto pinos. Y peleo entre pinos.', 'Me tiraste como a un tronco.', 'Las piedras de Artigas tienen colores que no ves en otro lado.'],
    ['girl', 'Jimena', 'Sandiera', 'Tranqueras es tierra de sandías. Probá una y después peleamos.', 'Te comiste todo.', 'Llevé sandías a Rivera y me hicieron pasar por un control del PP.'],
    ['Pasaron unos de gris con bolsas pesadas. Iban hacia Rivera.', 'Se les cayó una piedra violeta: una amatista.']],
  tranqueras: [['gaucho', 'Carmelo', 'Arriero', 'Llevo ganado por estos campos desde chico.', 'Se me dispersó la tropa.', 'En Tacuarembó la Parrilla de la Patria Gaucha está cerrada. Raro.'],
    ['girl', 'Florencia', 'Caminante', 'Recorro el norte a pie. Y peleo en el camino.', 'Me cansé.', 'El río viene crecido. Del otro lado ya es Tacuarembó.'],
    ['En la frontera el PP pone controles como si fuera la aduana.', 'A los que no pagan les dicen que la niebla los va a perder.']],
  tupambae: [['gaucho', 'Bruno', 'Esquilador', 'Esquilo cien ovejas por día. Una pelea más no me cansa.', 'Me trasquilaste.', 'En Melo hay una torre con luces que nadie entiende.'],
    ['oldman', 'Don Faustino', 'Pulpero', 'En mi pulpería se discute de todo. Ahora, combate.', 'Fiado no te lo doy.', 'Las Luces Malas aparecieron justo cuando llegaron los de gris.'],
    ['Las Luces Malas se ven cada noche más cerca de Melo.', 'Un de gris dijo en la pulpería que en la torre guardan una pieza de la máquina.']],
  cerrochato: [['girl', 'Leticia', 'Docente', 'Les enseño a los chicos la historia de la batalla de Arbolito.', 'Lección aprendida.', 'En la Quebrada de los Cuervos anida un pájaro que no es de este mundo.'],
    ['gaucho', 'Hilario', 'Domador', 'Domé potros más bravos que tus criaturas.', 'Me corcoveaste.', 'Hay gente de gris acampando en la Quebrada.'],
    ['Por la Ruta 8 bajan camiones grises desde Melo hacia Treinta y Tres.', 'Uno se paró acá y el chofer preguntó por la Quebrada de los Cuervos.']],
  lascano: [['gaucho', 'Ramón', 'Arrocero', 'El arroz de Lascano se exporta. Mis criaturas también ganan afuera.', 'Se me pasó el arroz.', 'Los bañados de Rocha están cubiertos de una niebla espesa.'],
    ['girl', 'Graciela', 'Bióloga', 'Estudio las aves de los bañados. Las criaturas también.', 'Anotado.', 'Los cisnes de cuello negro se fueron de la laguna. Algo los espantó.'],
    ['Los arrozales amanecieron con una capa de niebla que no se levanta ni con sol.', 'Vi una antena nueva sobre un galpón, del lado de Rocha.']],
  casupa: [['gaucho', 'Felipe', 'Tambero', 'La leche de Florida llega a todo el país.', 'Se cortó.', 'El cielo de Florida está lleno de aviones de práctica.'],
    ['boy', 'Ignacio', 'Estudiante', 'Vuelvo de Minas a estudiar a Florida. En el ómnibus, combates.', 'Me bajé en la parada equivocada.', 'Dicen que los de gris dejaron la fábrica de Minas y se fueron al centro del país.'],
    ['Después de lo de Minas, los camiones grises pasaron hacia Durazno.', 'Llevaban tanques con un olor fuerte, como a nafta.']],
  sarandi: [['gaucho', 'Abel', 'Ganadero', 'Acá el campo es plano y las peleas son derechas.', 'Me ganaste parejo.', 'En Durazno la refinería trabaja día y noche. Más que nunca.'],
    ['girl', 'Rocío', 'Ferroviaria', 'Por acá pasaba el tren. Ahora pasa la niebla.', 'Descarrilé.', 'Los que trabajan en la refinería no quieren hablar de lo que cargan.'],
    ['Cada noche sale un convoy de la refinería de Durazno hacia el sur.', 'No lleva el logo de la empresa: lleva una P.']],
  sanramon: [['oldman', 'Don Julio', 'Almacenero', 'Mi almacén tiene cien años. Mis criaturas, un poco menos.', 'Te debo una.', 'En Canelones hacen el mejor vino. El de Tomás, el líder, es famoso.'],
    ['boy', 'Lucas', 'Futbolista', 'Juego de lateral. Marco a cualquiera.', 'Me pasaste por arriba.', 'El Centenario está cerrado. Dicen que adentro hay alguien esperando.'],
    ['El convoy de la refinería pasó por acá rumbo a Montevideo.', 'Uno de gris dijo: «La niebla final va a tapar el Estadio».']],
  laspiedras: [['boy', 'Diego', 'Hincha de fútbol', 'Mi cuadro juega el domingo. Hoy juego yo.', 'Goleado.', 'Montevideo está cerca. El último tramo es el más difícil.'],
    ['girl', 'Natalia', 'Viñatera', 'En Las Piedras se pisaba uva y se ganaban batallas.', 'Me pisaste.', 'Acá Artigas ganó la batalla de Las Piedras. Vos podés ganar la tuya.'],
    ['Montevideo amaneció con una niebla que no deja ver el Cerro.', 'Dicen que es el último plan del Dr. Díaz.']],
};
function locFolk(id, types, lo, hi) {
  const [a, b, clue] = LOC_FOLK[id];
  const t = (k, [look, nm, cls, intro, lose, after], lv) => ({ x: 0, y: 0, look, dir: k ? 'left' : 'down', sight: 4, trainer: TR(`loc_${id}_${k}`, nm, cls, teamOf(types, lv, `loc${id}${k}`), Math.round(lv[1] * 22), intro, lose, after) });
  return [t(0, a, [lo, hi - 1]), t(1, b, [lo + 1, hi]), npc(0, 0, 'oldman', clue, { dir: 'down' })];
}

// Who keeps each city's road closed (the reason is in GATE_STORY, story.js).
const GATE_LOOK = { colonia: 'girl', sanjose: 'clerk', artigas: 'gaucho', melo: 'oldman', rocha: 'gaucho' };
const REAL_ROAD = {
  r_colonia_rosario: 'Ruta 1', r_villasoriano_fraybentos: 'Ruta 2', r_belen_artigas: 'Ruta 30', r_baltasar_rivera: 'Ruta 30',
  r_tupambae_melo: 'Ruta 26', r_cerrochato_quebrada: 'Ruta 8', r_lascano_rocha: 'Ruta 15', r_rocha_paloma: 'Ruta 15', r_sarandi_durazno: 'Ruta 5',
};

const DEPT = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));
const typesOf = (stopId) => BIOMES[DEPT[STOPS[STOP_INDEX[stopId]].dept].biome].types;

// ---------------------------------------------------------------- what each new place says about itself
const NEW = {
  colonia: ['city', ['Colonia del Sacramento es Patrimonio de la Humanidad: calles empedradas, un faro y el río ancho como mar.', 'Desde el puerto salen los Buquebus hacia Buenos Aires.'], 'Puerto'],
  sanjose: ['city', ['San José de Mayo, capital de un departamento de tambos y chacras.', 'Acá se hace la Fiesta de la Torta Frita, y nadie se queda con las ganas.'], 'Intendencia'],
  ecilda: ['loc', ['Ecilda Paullier vive del campo y de los viajeros que pasan por la ruta.', 'Un mate en el almacén y seguís camino.']],
  trinidad: ['city', ['Trinidad queda en el centro del país. Dicen que desde acá todo queda cerca.', 'La Plaza Independencia tiene la fuente más fotografiada de Flores.'], 'Centro de tropas'],
  palmitas: ['loc', ['Palmitas es chica, pero cruzan camiones de granos todo el día.', 'Los silos se ven desde varios kilómetros.']],
  mercedes: ['city', ['Mercedes mira al río Negro. Es la ciudad de los pescadores y de los remeros.', 'En primavera la costanera se llena de gente tomando mate.'], 'Club de remo'],
  villasoriano: ['loc', ['Villa Soriano fue el primer pueblo del país. Todavía se nota en las calles.', 'Desde el puerto sale el ferry hacia las islas del río Negro.']],
  young: ['loc', ['Young es un pueblo de gente trabajadora. El frigorífico de Fray Bentos queda cerca.', 'Acá se hacen los mejores chivitos de Río Negro, dicen.']],
  guichon: ['loc', ['Las Termas de Guaviyú quedan sobre la Ruta 3, a mitad de camino entre Paysandú y Salto.', 'Acá paran los camioneros a darse un baño caliente antes de seguir.']],
  belen: ['loc', ['Belén es un pueblo de citricultores y de pescadores del río Uruguay.', 'Las naranjas de Salto empiezan a verse desde acá.']],
  artigas: ['city', ['Artigas es la ciudad más al norte del país, pegada a Brasil.', 'Las piedras semipreciosas de la zona son famosas: ágatas y amatistas.'], 'Cooperativa de mineros'],
  baltasar: ['loc', ['Tranqueras queda sobre la Ruta 30, entre Artigas y Rivera.', 'Es tierra de sandías: en verano las venden al costado de la ruta.']],
  tranqueras: ['loc', ['La Ruta 5 cruza acá el río Tacuarembó, el límite con el departamento de Rivera.', 'Los arrieros esperan la bajante para pasar el ganado.']],
  tupambae: ['loc', ['Tupambaé es un paraje de lomadas y estancias. Se oye más el viento que a la gente.', 'Hay tradiciones criollas que acá no cambiaron nunca.']],
  melo: ['city', ['Melo es la capital de Cerro Largo. Limita con Brasil y con la laguna Merín.', 'Su carnaval y sus ferias de frontera son parte del orgullo local.'], 'Peña criolla'],
  cerrochato: ['loc', ['Arbolito queda sobre la Ruta 8, entre Treinta y Tres y Melo.', 'Cerca de acá fue la batalla de Arbolito, en 1904. Todavía hay un monumento.']],
  lascano: ['loc', ['Lascano queda al borde de los bañados de Rocha.', 'Los arroceros y los guías de aves comparten la plaza.']],
  rocha: ['city', ['Rocha guarda lagunas, palmares y las playas más tranquilas del Atlántico.', 'Los fines de semana vienen turistas a ver el amanecer sobre la laguna.'], 'Centro de guardaparques'],
  casupa: ['loc', ['Casupá es un pueblo en medio de las cuchillas, camino entre Minas y Florida.', 'El arroyo del mismo nombre baja cristalino y frío.']],
  florida: ['city', ['Florida es la cuna de la independencia: acá se declaró el 25 de agosto de 1825.', 'La Piedra Alta está en el centro: ahí se juró la libertad.'], 'Piedra Alta'],
  sarandi: ['loc', ['Sarandí Grande es un pueblo chico con una plaza grande y una escuela grande.', 'Cerca de acá pasó la caballería de los Treinta y Tres.']],
  sanramon: ['loc', ['San Ramón es famoso por sus quesos y por su feria de domingo.', 'Se huele la masa de las tortas fritas desde la entrada.']],
  canelones: ['city', ['Canelones es la capital del departamento que rodea a Montevideo.', 'Los viñedos de la zona producen el tannat que se sirve en todo el país.'], 'Bodega'],
  laspiedras: ['loc', ['Las Piedras es la ciudad de las batallas: acá se ganó la primera victoria patriota.', 'Montevideo queda a un paso, y se nota en el ruido.']],
};

// ---------------------------------------------------------------- which way each leg of the journey heads
// Derived from the atlas coordinates, so the road really goes north, south, east or west like the country does.
const OPP = { e: 'w', w: 'e', n: 's', s: 'n' };
const LEG_DIR = {};
const OWNER = {};
STOPS.forEach((st, k) => {
  const nx = STOPS[k + 1];
  for (const mapId of [st.id, ...st.via]) OWNER[mapId] = k;
  if (!nx) return;
  const a = PLACES.find((p) => p.id === st.id), b = PLACES.find((p) => p.id === nx.id);
  const dx = (b.lon - a.lon) * 0.82, dy = b.lat - a.lat;
  LEG_DIR[k] = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 'n' : 's');
});
// Two cities keep a dead-end branch on a fixed side (Tacuarembó: the Ciclovía to the north, Rocha/La Paloma: Cabo Polonio),
// so the legs that would collide with it head another way.
const LEG_OVERRIDE = { tranqueras: 'w', tacuarembo: 's' };
for (const [stop, dir] of Object.entries(LEG_OVERRIDE)) LEG_DIR[OWNER[stop]] = dir;
/** Side of `mapId` the road to the next map leaves through. */
const dirOf = (mapId) => LEG_DIR[OWNER[mapId]];
const ARROW = { e: '→', w: '←', n: '↑', s: '↓' };

const LOOKS = ['boy', 'girl', 'gaucho', 'oldman', 'clerk', 'sailor'];
// Townsfolk are drawn from a wider pool than trainers; trainers get the look of their class.
const FOLK_LOOKS = ['boy', 'girl', 'gaucho', 'oldman', 'campesina', 'pescador', 'maestra', 'obrero', 'turista', 'hincha', 'artesana', 'abuela', 'camionero', 'cartero', 'estudiante', 'murguero', 'nino', 'almacenero'];
const CLASS_LOOK = { Naturalista: 'biologo', Peón: 'gaucho', Estudiante: 'estudiante', Pescador: 'pescador', Viajero: 'turista', Baqueano: 'oldman' };
const TRAINERS = [
  ['Naturalista', ['bicho', 'planta'], ['Estudio las especies de esta zona.', 'Anoto el resultado.', 'Seguí por el camino principal.']],
  ['Peón', ['normal', 'lucha'], ['Pasé la mañana arreando, ahora toca combatir.', 'Se me escapó la tropilla y el combate.', 'Buen viaje.']],
  ['Estudiante', ['normal', 'volador'], ['Voy camino a la escuela, pero un combate no me retrasa.', 'Llegaré tarde, pero valió la pena.', 'Aprendí algo nuevo.']],
  ['Pescador', ['agua'], ['Hoy no pica nada, así que combatamos.', 'Mejor pesco.', 'El río da y quita.']],
  ['Viajero', ['normal', 'tierra'], ['Voy de paso, pero no rechazo un combate.', 'Qué bien peleás.', 'Que tengas buen camino.']],
  ['Baqueano', ['planta', 'tierra'], ['Conozco cada rincón de este camino.', 'Me ganaste de local.', 'Seguí derecho.']],
];

const HOUSE_LOOKS = ['boy', 'girl', 'gaucho', 'oldman', 'sailor', 'swimmer', 'ciclista', 'keeper', 'biologo', 'campesina', 'pescador', 'maestra', 'obrero', 'artesana', 'abuela', 'camionero', 'cartero', 'cocinero', 'murguero', 'hincha'];

// Residents are not statues: the second one in a house always wanders, and about a third of the first ones do too.
const houseFolk = (first, look2, text2) => {
  const wanders = [].concat(first.text).join('').length % 3 === 0;
  return [wanders ? { ...first, wander: true } : first, ...(look2 ? [{ ...casaNpc(look2, text2, first), wander: true }] : [])];
};

// Each department has its own flavour: its townsfolk talk about what their land is known for.
const DEPT_FOLK = {
  colonia: ['Del Barrio Histórico no se va nadie sin sacarse una foto en las calles de piedra.', 'El faro se ve desde todo el casco viejo, de día y de noche.', 'Los barcos llegan y se van, pero la gente de acá se queda.'],
  sanjose: ['Acá hay chacras y tambos en cada camino. La leche llega fresca a la mesa.', 'En el teatro del centro se hacen obras todo el año.', 'Los domingos la plaza se llena de familias con termo.'],
  flores: ['En Trinidad la plaza es el punto de encuentro: se habla de campo y de fútbol.', 'Hay más caballos que autos en las calles de tierra.', 'La lana de acá se vende en todo el país.'],
  soriano: ['En el Río Negro se pesca el dorado. Dicen que pelea más que un entrenador.', 'Mercedes tiene la costanera más linda del litoral.', 'Las islas del río se llenan de pájaros en primavera.'],
  rionegro: ['El río Uruguay se ve ancho desde la costanera.', 'Hay una fábrica vieja que dio de comer a medio pueblo.', 'Cuando baja el río aparecen playas de arena por todos lados.'],
  paysandu: ['Acá se hace la cerveza artesanal más rica del litoral, dicen los de acá.', 'La playa Park es el lugar de verano de la ciudad.', 'Los paysandueros somos de hablar fuerte y de abrazar más fuerte.'],
  salto: ['Las termas de Salto son lo mejor para el cuerpo y el bolsillo.', 'De las quintas salen naranjas para todo el país.', 'La represa de Salto Grande es una de las obras más grandes de la región.'],
  artigas: ['Acá la frontera con Brasil se cruza a pie, para comprar y para pasear.', 'Se dice que de las minas salen amatistas que brillan como nada.', 'En esta tierra nació una de las figuras más grandes de la historia.'],
  rivera: ['Rivera y Santana do Livramento son una sola ciudad con dos banderas.', 'En el centro se habla español, portugués y el mezclado de los dos.', 'Los fines de semana la gente cruza la calle para ir de compras a otro país.'],
  tacuarembo: ['En Tacuarembó hay mucha ganadería y mucho gaucho de verdad.', 'La fiesta de la Patria Gaucha reúne a todo el país en marzo.', 'El Valle Edén tiene una leyenda para cada piedra.'],
  cerrolargo: ['La Laguna Merín está cerca y de ahí viene medio mundo a pescar.', 'En el campo de Cerro Largo hay más ovejas que gente.', 'Melo es ciudad de frontera: cuando uno cruza, sigue todo igual pero con otro acento.'],
  treintaytres: ['Cerca de acá hay quebradas y cascadas en medio de las sierras.', 'Treinta y Tres se llama así por los Treinta y Tres Orientales, y a mucha honra.', 'Los arrozales se ven como espejos cuando los inundan.'],
  rocha: ['Rocha es de playas largas y desiertas, con dunas y lobos marinos.', 'En verano llega mucha gente de Argentina y Brasil. En invierno quedan los de acá.', 'Los pescadores salen antes del amanecer y vuelven con la red llena.'],
  maldonado: ['Punta del Este tiene la Mano más fotografiada del país.', 'En la temporada los precios suben más que la marea.', 'Los lobos marinos de la isla se oyen desde el puerto.'],
  lavalleja: ['Las sierras de Minas están llenas de arroyos y cerros para trepar.', 'Acá se hace la mejor agua mineral del país.', 'En abril hay peregrinación al Cerro Verdún.'],
  florida: ['En Florida se firmó la independencia; acá la historia está en las calles.', 'La plaza tiene un monumento para cada fecha importante.', 'Los carnavales de los pueblos de al lado son ruidosos y alegres.'],
  durazno: ['El Río Negro cruza por el medio de Durazno y hace una isla en la ciudad.', 'Acá se realiza una fiesta nacional del folklore que no se la pierde nadie.', 'Durazno queda al centro del país: de acá todo está a la misma distancia.'],
  canelones: ['Canelones es de viñedos y quintas; la uva tannat se da como en pocos lados.', 'Acá hay vino bueno y se sirve con chivito.', 'Todos los fines de semana alguien hace un asado con vista a los viñedos.'],
  montevideo: ['En Montevideo el mate se toma caminando por la rambla.', 'En el Palacio Salvo sobran leyendas y faltan ascensores.', 'Los sábados el fútbol corta las calles; el candombe corta el resto.'],
};
const npc = (x, y, look, text, extra = {}) => ({ x, y, look, text: [].concat(text), ...extra });

const stockAt = (i) => (i < 9 ? ['esfera', 'te_marcela', 'ruda', 'alfajor']
  : i < 20 ? ['esfera', 'superesfera', 'te_marcela', 'mate', 'ruda', 'linimento', 'alfajor', 'repelente', 'refuerzo_ataque', 'refuerzo_defensa']
    : i < 30 ? ['superesfera', 'ultraesfera', 'mate', 'mate_dulce', 'aloe', 'despertador', 'alfajor', 'torta_frita', 'repelente_super', 'refuerzo_precision', 'refuerzo_resistencia']
      : ['ultraesfera', 'mate_dulce', 'dulce_de_leche', 'aloe', 'despertador', 'torta_frita', 'chivito', 'repelente_max', 'concentracion', 'refuerzo_precision']);

const WORK_AT = { colonia: 'Soy empleado del puerto.', sanjose: 'Soy empleado de la intendencia.', trinidad: 'Soy soldado del centro de tropas.', mercedes: 'Soy socio del club de remo.', artigas: 'Soy minero de la cooperativa.' };

// Gyms of the cities that have one here (the older cities with a gym are built in maps-act2.js).
const GYM_TYPE = { inc: 'tierra', correo: 'normal', boiso: 'volador', inavi: 'bicho' };
const GYM_NAME = { inc: 'Instituto de Colonización', correo: 'Correo Uruguayo', boiso: 'Escuela de Aviación', inavi: 'Instituto de Vitivinicultura' };
const GYM_TRAINERS = {
  tierra: [['Aureliano', 'Colono', ['La tierra no perdona al que no trabaja.', 'Me dio una buena lección.', 'Elena te espera al fondo.']], ['Mirta', 'Agrónoma', ['Conozco cada suelo de Flores.', 'Quedé enterrada…', 'Seguí, el suelo es firme.']]],
  normal: [['Fabián', 'Cartero', ['Entrego todo, hasta combates.', 'Paquete devuelto.', 'Marta está al fondo.']], ['Silvia', 'Telegrafista', ['Mensaje urgente: te voy a ganar.', 'Mensaje no entregado.', 'Pasá, la presidenta espera.']]],
  volador: [['Ismael', 'Aeromodelista', ['Mi planeador y yo somos uno.', 'Aterricé mal.', 'El maestro Boiso está arriba.']], ['Clara', 'Paracaidista', ['Un salto y listo.', 'Se me abrió tarde.', 'Seguí adelante.']]],
  bicho: [['Gabriel', 'Viñatero', ['Los bichos cuidan mis uvas.', 'Cosecha perdida.', 'Tomás te espera.']], ['Rosa', 'Apicultora', ['Cuidado con el aguijón.', 'Me picó la derrota.', 'Seguí, no te voy a frenar.']]],
};
const KEEP_TARGETS = new Set(['ciclovia', 'cabo']); // dead-end branches that keep their own exits
export const ROUTE_OUTDOOR: Record<string, MapDef> = {};
export const ROUTE_INTERIOR: Record<string, MapDef> = {};

/** Put NPCs and items on free ground, away from roads. */
function settle(m) {
  const taken = new Set();
  fitToMap(m.tiles, m.npcs ?? [], taken);
  fitToMap(m.tiles, m.items ?? [], taken);
}


// ---------------------------------------------------------------- cities and localities
// Every city has its own plan (town-specs.js: 44x30 like Montevideo) and every locality one of the landscape
// archetypes, so no two places look alike. town-build.js turns a plan into tiles, doors, people and animals.
/** Sides of `mapId` the story walks through: where the previous map's road arrives and where ours leaves. */
function edgesFor(mapId) {
  const k = CHAIN.indexOf(mapId);
  const out = [];
  if (k > 0) out.push(OPP[dirOf(CHAIN[k - 1])]);
  if (dirOf(mapId)) out.push(dirOf(mapId));
  return [...new Set(out)];
}
const LOC_SIZES = [[30, 16], [26, 16], [28, 16], [24, 20], [28, 18], [24, 22]];
const kindOfDoor = (to, i) => (to.startsWith('shop') ? 'shop' : to.startsWith('poli') ? 'poli' : to.startsWith('casa') ? DECOR_HOUSES[i % 4] : 'houseB');


// Townsfolk so a 44x30 city does not feel empty: a few extra neighbours with local chatter and one loose item.
const FOLK = [
  'Acá se toma mate hasta en la fila del banco.', 'Dicen que cuando se levanta el Pampero se aclara hasta el último rincón.', 'Mi hijo salió a entrenar y todavía no volvió.',
  'El almacén tiene de todo, hasta lo que no necesitás.', 'Si ves un carpincho cruzando, esperá: no tiene apuro.', 'En verano esto se llena de turistas. Ahora se oye el viento.',
  'Antes el camino era de tierra y se cortaba con cada lluvia.', 'La murga ensaya los sábados en la plaza.', 'Los domingos hay fútbol en la canchita del barrio.',
  'Al atardecer el cielo se pone de un color que no se explica.', 'Mi abuela dice que el mejor chivito es el que se come de parado.', 'Cuando la tormenta viene del sur, se avisa sola: las gaviotas se meten tierra adentro.',
];
const ITEMS_BY_BAND = ['alfajor', 'esfera', 'pan_casero', 'torta_frita', 'superesfera', 'alfajor_triple'];
// The fog is sold: early towns hear about it as a business before the player meets the PP.
const FOG_HINTS = {
  colonia: [['oldman', ['En el puerto repartieron folletos: "Niebla garantizada, 30 días, $4000 por zona".', 'Nadie sabe quién los imprime. Solo dice "Proyecto Pampero".']]],
  sanjose: [['girl', ['Mi cuñado cerró el campo con "niebla contratada". Dice que así no helaba.', 'Le salió un ojo de la cara y ahora no la puede cortar.']]],
  trinidad: [['gaucho', ['Vendo menos desde que apareció la niebla en el norte.', 'Los de gris compran toda la nafta y pagan en efectivo.']]],
  mercedes: [['boy', ['Vi camiones del Equipo PP bajando máquinas con un cartel: "Cliente: pueblo de la costa".', '¿Quién compra niebla?']]],
};
function addFogHints(m, id) {
  for (const [look, text] of FOG_HINTS[id] ?? []) m.npcs.push(npc(0, 0, look, text, { dir: 'down' }));
}
function addFolk(m, id, n) {
  const i = STOP_INDEX[id] ?? 0;
  const have = (m.npcs ?? []).filter((o) => !o.critter).length;
  m.npcs = m.npcs ?? [];
  addFogHints(m, id);
  for (let k = 0; k < Math.max(0, n - have); k++) {
    // Every other neighbour talks about the department they live in; the rest keep the general chatter.
    const dept = DEPT_FOLK[STOPS[i]?.dept] ?? FOLK;
    const local = k % 2 === 0;
    const a = local ? dept[(k >> 1) % dept.length] : FOLK[(i * 3 + k * 5) % FOLK.length];
    const b = local ? dept[((k >> 1) + 1) % dept.length] : FOLK[(i * 3 + k * 5 + 4) % FOLK.length];
    m.npcs.push(npc(0, 0, FOLK_LOOKS[(i * 3 + k * 5 + 1) % FOLK_LOOKS.length], [a, b], k % 2 ? { wander: true } : { dir: ['down', 'left', 'right'][k % 3] }));
  }
  if (!m.items?.length) m.items = [{ x: 0, y: 0, item: ITEMS_BY_BAND[Math.min(5, Math.floor(i / 7))], id: `${id}_item1` }];
}

/** Plan of a locality: the archetype's landscape plus a shop and houses for its doors. */
function localityPlan(id, doors, size) {
  const [arch, theme] = LOC_PLAN[id] ?? ['campo', null];
  const [w, h] = LOC_SIZES[size % LOC_SIZES.length];
  const spec = LOC_ARCHETYPES[arch](id, w, h, rng(`loc${id}`));
  return { spec, theme, bld: doors.map((d, i) => [kindOfDoor(doorTo(d), i), doorTo(d)]), fill: 2 + (size % 3) };
}
const doorTo = (d) => (typeof d === 'string' ? d : d.to);
const DECOR_HOUSES = ['house', 'houseB', 'houseG', 'houseO'];

for (const [id, [kind, lines, place]] of Object.entries(NEW)) {
  const stop = STOPS[STOP_INDEX[id]];
  const i = STOP_INDEX[id];
  const [lo, hi] = mapBand(id);
  const types = typesOf(id);
  const isCity = kind === 'city';
  const gymType = isCity && stop.gym ? GYM_TYPE[stop.gym] : null;
  const doors = [
    ...(id === 'melo' ? ['anima_1'] : []),
    ...(gymType ? [`gym_${id}`] : []),
    ...(isCity ? [`poli_${id}`] : []),
    ...(isCity ? [`shop_${id}`] : []),
    `casa_${id}`,
    ...(isCity ? [`casa_${id}2`] : []),
  ];
  const kindIdx = Object.keys(NEW).filter((k) => (NEW[k][0] === 'city') === isCity).indexOf(id);
  const cfg = isCity
    ? { ...CITY_SPECS[id], spec: CITY_SPECS[id].spec, fill: CITY_SPECS[id].fill, edges: edgesFor(id), gate: dirOf(id) }
    : { ...localityPlan(id, doors, kindIdx), edges: edgesFor(id) };
  if (isCity) cfg.bld = cfg.bld.map(([k, to, hint]) => [k === 'gym' ? gymType : k, to ?? undefined, hint]);
  const m = {
    name: stop.name, music: 'town', bg: 'field', tiles: null, doors,
    signs: [`${stop.name.toUpperCase()}\n${lines[0]}`],
    exits: {},
    enc: { rate: 0.1, list: wildList(types, lo, hi, 6, id) },
    fish: undefined,
    npcs: [
      npc(0, 0, FOLK_LOOKS[(i * 7) % FOLK_LOOKS.length], lines, { wander: true }),
      npc(0, 0, FOLK_LOOKS[(i * 7 + 5) % FOLK_LOOKS.length], [lines[1], isCity ? 'La Policlínica y el almacén están sobre la calle principal.' : 'Acá hay un almacén y poco más. Es lo bueno del pueblo.'], { dir: 'down' }),
      ...(id === 'colonia' ? [
        { x: 0, y: 0, look: 'girl', dir: 'down', sight: 4, trainer: TR('col_a', 'Valentina', 'Turista', [['teruterito', 5], ['hornerito', 5]], 100, 'Vine a ver el puerto y me quedé a pelear.', 'Buen combate.', 'Colonia tiene más para ver de lo que parece.') },
        { x: 0, y: 0, look: 'sailor', dir: 'left', sight: 4, trainer: TR('col_b', 'Ramiro', 'Marinero', [['nandulin', 5], ['oruga', 5], ['tuco', 5]], 130, 'Mientras espero el barco, entreno.', 'Me hundiste.', 'El río da muchas vueltas, igual que la vida.') },
        { x: 0, y: 0, look: 'gaucho', dir: 'down', sight: 4, trainer: TR('col_c', 'Don Eusebio', 'Paisano', [['hormiga', 5], ['tuco', 6]], 140, 'Pasá, pasá. Pero primero me mostrás qué traés.', 'Se nota que practicaste.', 'Con la PokeDex todo se aprende más rápido.') },
      ] : []),
      ...(id === 'sanjose' ? [
        { x: 0, y: 0, look: 'clerk', dir: 'down', sight: 4, trainer: TR('sj_a', 'Hernán', 'Empleado de la intendencia', teamOf(types, [lo, lo + 1], 'sja'), 120, 'Salí a almorzar y me quedaron ganas de pelear.', 'Perdí el recreo.', 'En Trinidad hay una líder de tipo Tierra. Llevá algo que le gane.') },
        { x: 0, y: 0, look: 'gaucho', dir: 'left', sight: 4, trainer: TR('sj_b', 'Don Washington', 'Tambero', teamOf(types, [lo, lo + 2], 'sjb'), 150, 'Mis vacas dan leche y mis criaturas dan batalla.', 'Se me cortó la leche.', 'Camino a Trinidad hay un monte espeso. No te metas de noche sin criaturas descansadas.') },
        npc(0, 0, 'oldman', ['Del Cabildo salió un aviso: gente de gris anda ofreciendo "niebla por contrato" a los productores.', 'Si seguís al oeste, en Trinidad y Mercedes vas a saber más. Yo no me fiaría de ellos.'], { dir: 'down' }),
      ] : []),
      ...(id === 'ecilda' ? [
        { x: 0, y: 0, look: 'boy', dir: 'down', sight: 4, trainer: TR('ec_a', 'Lautaro', 'Camionero', teamOf(types, [lo, lo + 1], 'eca'), 130, 'Paré a descansar y a pelear.', 'Me dejaste sin nafta.', 'En Trinidad, antes de entrar al gimnasio, conviene tener un par de curaciones.') },
        { x: 0, y: 0, look: 'girl', dir: 'right', sight: 4, trainer: TR('ec_b', 'Brenda', 'Almacenera', teamOf(types, [lo, lo + 2], 'ecb'), 150, 'No vendo nada sin antes verte pelear.', 'Está bien, te lo cobro igual.', 'Las Pokeballs se acaban rápido. Comprá antes de seguir.') },
        npc(0, 0, 'gaucho', ['Los camiones de gris pasan de noche con unas máquinas tapadas con lona.', 'Dicen que van a Palmitas. Si vas para allá, andá con cuidado.'], { dir: 'down' }),
      ] : []),
      ...(LOC_FOLK[id] ? locFolk(id, types, lo, hi) : []),
      ...(id === 'melo' ? [npc(0, 0, 'oldman', ['La torre vieja del Cabildo tiene luces de noche. Dicen que es el Sereno, que sigue de guardia.', 'Nadie se anima a subir.'], { dir: 'down' })] : []),
      ...(isCity && !stop.gym ? [{ x: 0, y: 0, look: GATE_LOOK[id] ?? 'cop', dir: 'right', script: 'town_gate', stop: id, id: `gate_${id}`, cond: (f) => !f[openFlag(id)] }] : []),
    ],
  };
  addFolk(m, id, isCity ? 7 : 4);
  ROUTE_OUTDOOR[id] = m as any;
  retown(m, id, cfg);
  if (gymType) {
    const [lo2, hi2] = [Math.max(2, mapBand(id)[1] - 3), mapBand(id)[1] + 1];
    ROUTE_INTERIOR[`gym_${id}`] = room(GYM, {
      name: `${GYM_NAME[stop.gym]} (${stop.name})`, theme: `gym_${gymType}`,
      npcs: [
        { x: 5, y: 2, look: `leader_${stop.gym}`, dir: 'down', script: 'leader', leader: stop.gym },
        ...GYM_TRAINERS[gymType].map(([nm, cls, [intro, lose, after]], k) => {
          const spot = k ? { x: 3, y: 9, dir: 'right' } : { x: 8, y: 6, dir: 'left' };
          return { ...spot, look: CLASS_LOOK[cls] ?? LOOKS[(i + k) % LOOKS.length], sight: 4, trainer: TR(`g_${id}_${k}`, nm, cls, teamOf([gymType], [lo2 + k, hi2], `g${id}${k}`), (hi2 + 2) * 20, intro, lose, after) };
        }),
      ],
    });
  }
  if (isCity) ROUTE_INTERIOR[`poli_${id}`] = poli(`Policlínica de ${stop.name}`);
  if (isCity) ROUTE_INTERIOR[`shop_${id}`] = shop(`Almacén de ${stop.name}`, stockAt(i));
  if (id === 'colonia') ROUTE_INTERIOR.shop_colonia.npcs[0].script = 'shop_carta';
  ROUTE_INTERIOR[`casa_${id}`] = room(HOUSE, { name: `Casa en ${stop.name}`, npcs: houseFolk(casaNpc(HOUSE_LOOKS[(i * 5 + 1) % HOUSE_LOOKS.length], isCity && place ? [WORK_AT[id] ?? `Trabajo en ${place}.`, lines[1]] : lines), i % 2 ? HOUSE_LOOKS[(i * 3 + 2) % HOUSE_LOOKS.length] : null, (DEPT_FOLK[stop.dept] ?? FOLK).slice(0, 2)) });
  if (id === 'colonia') ROUTE_INTERIOR.casa_colonia.npcs.push({ x: 7, y: 5, look: 'clerk', dir: 'left', script: 'gift_mapa' });
  if (isCity) ROUTE_INTERIOR[`casa_${id}2`] = room(HOUSE, { name: `Otra casa en ${stop.name}`, npcs: houseFolk(casaNpc(HOUSE_LOOKS[(i * 5 + 4) % HOUSE_LOOKS.length], [lines[1], 'Cuando pasa gente de afuera, se anima el pueblo.']), HOUSE_LOOKS[(i * 5 + 9) % HOUSE_LOOKS.length], (DEPT_FOLK[stop.dept] ?? FOLK).slice(1, 3)) });
}

/** Older cities and localities built by hand keep their buildings, people and exits but get a new plan. */
function replanExisting(OUTDOOR) {
  const doneBefore = new Set(Object.keys(ROUTE_OUTDOOR));
  for (const [id, cfg] of Object.entries(CITY_SPECS)) {
    if (doneBefore.has(id) || !OUTDOOR[id]) continue;
    const keepSides = Object.entries((OUTDOOR[id].exits ?? {}) as Record<string, any>).filter(([, e]) => KEEP_TARGETS.has(e.to)).map(([s]) => s);
    addFolk(OUTDOOR[id], id, 7);
    retown(OUTDOOR[id], id, { ...cfg, newDoors: (cfg as any).newDoors, edges: [...new Set([...edgesFor(id), ...keepSides])] });
  }
  for (const id of Object.keys(LOC_PLAN)) {
    if (doneBefore.has(id) || !OUTDOOR[id]) continue;
    const m = OUTDOOR[id];
    const keepSides = Object.entries((m.exits ?? {}) as Record<string, any>).filter(([, e]) => KEEP_TARGETS.has(e.to)).map(([s]) => s);
    const plan = localityPlan(id, (m.doors ?? []).filter((d) => !/^(shop|poli)_/.test(doorTo(d))), Object.keys(LOC_PLAN).indexOf(id));
    addFolk(m, id, 4);
    retown(m, id, { ...plan, drop: /^(shop|poli)_/, edges: [...new Set([...edgesFor(id), ...keepSides])] });
  }
}

// ---------------------------------------------------------------- roads between stops
// Road shapes: w x h are for an east-west road (a north-south one swaps them).
const ROUTE_STYLES = [
  { w: 72, h: 28, grass: [[9, 3, 5]], ponds: [[2, 4, 3]], trees: 40, rocks: 10, winding: 2, sign: 'Un camino de tierra y pasto, con tránsito de tropas y de camiones.' },
  { w: 96, h: 26, grass: [[12, 3, 5]], ponds: [], trees: 56, rocks: 14, winding: 3, bridge: [[30, 33], [64, 67]], sign: 'Un camino largo entre estancias y alambrados. Dos arroyos lo cortan.' },
  { w: 66, h: 40, grass: [[10, 3, 6]], ponds: [[3, 6, 4], [1, 9, 5]], trees: 34, rocks: 8, winding: 2, sign: 'Pasto alto y bañados a los costados. Cuidado con el barro.' },
  { w: 100, h: 24, grass: [[11, 3, 5]], ponds: [[1, 7, 3]], trees: 44, rocks: 8, winding: 3, bridge: [[44, 48]], sign: 'Un puente de madera cruza el arroyo.' },
  { w: 64, h: 44, grass: [[8, 2, 5]], ponds: [], trees: 26, rocks: 36, winding: 4, sign: 'Tierra pedregosa y cerros bajos. Se camina despacio.' },
  { w: 84, h: 32, grass: [[10, 3, 6]], ponds: [[2, 5, 5]], trees: 52, rocks: 12, winding: 3, bridge: [[52, 55]], sign: 'Un monte criollo bordea la ruta.' },
];

let rn = 0;
for (const s of STOPS) for (const via of s.via) {
  if (!via.startsWith('r_')) continue;
  const [lo, hi] = mapBand(via);
  const a = STOPS[STOP_INDEX[s.id]];
  const b = STOPS[STOP_INDEX[s.id] + 1];
  const types = [...new Set([...typesOf(a.id), ...typesOf(b.id)])];
  const dir = dirOf(via);
  const vertical = dir === 'n' || dir === 's';
  const sty = ROUTE_STYLES[(rn * 5 + 2) % ROUTE_STYLES.length];
  const [lw, lh] = vertical ? [sty.h, sty.w] : [sty.w, sty.h];
  const mid = (vertical ? lw : lh) >> 1;
  const lane = mid + ((rn % 3) - 1) * 2;
  const R = route({ seed: via, w: lw, h: lh, axis: vertical ? 'v' : 'h', from: lane, to: lane, grass: sty.grass, ponds: sty.ponds, trees: sty.trees, treeChar: rn % 2 ? '#' : 'q', rocks: sty.rocks, flowers: 14, bridge: sty.bridge ?? null, winding: sty.winding });
  const fishTrainer = (k) => TRAINERS[(rn + k) % TRAINERS.length];
  const ts = [...Array(Math.min(R.spots.length, Math.max(3, Math.round((vertical ? lh : lw) / 15))))].map((_, k) => k).filter((k) => R.spots[k]).map((k) => {
    const [cls, tt, [intro, lose, after]]: any = fishTrainer(k);
    const lv = [Math.max(lo, hi - 2 + (k % 2)), Math.min(hi, hi - (k % 2))];
    const nm = ['Gonzalo', 'Mariana', 'Atilio', 'Rosario', 'Julián', 'Lucía', 'Bruno', 'Carmen'][(rn * 3 + k) % 8];
    return { x: R.spots[k].x, y: R.spots[k].y, look: CLASS_LOOK[cls] ?? LOOKS[(rn + k) % 5], dir: R.spots[k].dir, sight: 4, trainer: TR(`${via}_${k}`, nm, cls, teamOf(tt, lv, `${via}${k}`), Math.round(lv[1] * 20), intro, lose, after) };
  });
  ROUTE_OUTDOOR[via] = {
    name: REAL_ROAD[via] ?? `Camino a ${b.name}`, music: 'route', bg: 'field', tiles: R.tiles,
    signs: [`${a.name.toUpperCase()} ${ARROW[OPP[dir]]}  ·  ${b.name.toUpperCase()} ${ARROW[dir]}\n${sty.sign}`].slice(0, R.signs.length),
    exits: {},
    enc: { rate: 0.12, list: wildList(types, lo, hi, 8, via) },
    fish: undefined,
    npcs: ts,
    items: R.itemSpots[0] ? [{ ...R.itemSpots[0], item: hi > 30 ? 'ultraesfera' : hi > 14 ? 'superesfera' : 'esfera', id: `${via}_item1` }] : [],
  };
  settle(ROUTE_OUTDOOR[via]);
  rn++;
}

// ---------------------------------------------------------------- wiring
const CARVABLE = new Set('.,#qpRFfKks%`;=cb'.split(''));
const walkable = (ch) => ch !== undefined && !TILE_INFO[ch]?.solid;

/** Open a walkable corridor from the edge `side` of a map inwards. Returns false if no clean line exists. */
function carve(m, side) {
  const g = m.tiles.map((r) => [...r]);
  const H = g.length, W = g[0].length;
  const len = side === 'e' || side === 'w' ? H : W;
  const mid = len >> 1;
  const order = [...Array(len).keys()].filter((c) => c >= 2 && c <= len - 3).sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid));
  for (const c of order) {
    const cells = [];
    let ok = false;
    for (let d = 0; d < 12; d++) {
      const x = side === 'w' ? d : side === 'e' ? W - 1 - d : c;
      const y = side === 'n' ? d : side === 's' ? H - 1 - d : c;
      const ch = g[y][x];
      if (d >= 1 && walkable(ch) && ch !== '~') { ok = true; break; }
      if (!CARVABLE.has(ch)) break;
      cells.push([x, y]);
    }
    if (!ok) continue;
    for (const [x, y] of cells) g[y][x] = '=';
    m.tiles = g.map((r) => r.join(''));
    return true;
  }
  return false;
}

const edgeOpen = (m, side) => {
  const W = m.tiles[0].length, H = m.tiles.length;
  const cells = side === 'w' ? m.tiles.map((r) => r[0]) : side === 'e' ? m.tiles.map((r) => r[W - 1]) : side === 'n' ? [...m.tiles[0]] : [...m.tiles[H - 1]];
  return cells.some((ch) => walkable(ch) && ch !== '~');
};

// What a closed road says: only the situation, never what to do. The way forward comes from the townsfolk (rumors.ts).
const VAGUE = [
  'Nadie sabe bien cuánto va a durar.',
  'Pregunté por el pueblo y cada uno cuenta una cosa distinta.',
  'Dicen que alguien sabe más, pero no es fácil dar con esa persona.',
  'Por ahora no se puede pasar. Más no sé.',
  'Volvé en un rato, o fijate si alguien por acá conoce a los que decidieron cortarlo.',
];
const FWD_DENY = (a, b) => (a.id === 'fraybentos'
  ? ['Todavía no podés dejar Fray Bentos.', 'Alguien en el pueblo espera que resuelvas lo del Anglo antes de que sigas camino.']
  : a.id === 'carmelo'
    ? ['Esperá, {player}.', 'Afuera del pueblo hay criaturas salvajes en los pastizales.', 'Pasá primero por el laboratorio del Maestro Tabárez.']
    : a.gym || a.kind === 'city'
      ? [`El camino a ${b} está cerrado.`, VAGUE[Math.abs([...a.id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % VAGUE.length]]
      : []);

/** Connect the whole chain: each consecutive pair of maps gets an exit on opposite sides. */
export function rewire(OUTDOOR) {
  replanExisting(OUTDOOR);
  const had = {};
  const extras = {};
  for (const id of CHAIN) {
    const m = OUTDOOR[id];
    had[id] = new Set(Object.keys(m.exits ?? {}));
    extras[id] = Object.fromEntries(Object.entries((m.exits ?? {}) as Record<string, any>).filter(([, e]) => KEEP_TARGETS.has(e.to)));
  }
  // maps that link back to a kept branch keep that link too
  for (const [id, m] of Object.entries(OUTDOOR) as [string, any][]) {
    if (KEEP_TARGETS.has(id)) {
      const back = Object.entries((m.exits ?? {}) as Record<string, any>).find(([, e]) => CHAIN.includes(e.to));
      if (back) extras[id] = { [back[0]]: back[1] };
    }
  }
  for (const id of CHAIN) OUTDOOR[id].exits = { ...extras[id] };
  const taken = (id, side) => OUTDOOR[id].exits[side] !== undefined;
  for (let k = 0; k < CHAIN.length - 1; k++) {
    const A = CHAIN[k], B = CHAIN[k + 1];
    const a = OUTDOOR[A], b = OUTDOOR[B];
    if (!a || !b) throw new Error(`mapa de la ruta inexistente: ${!a ? A : B}`);
    const sides = ['e', 'w', 'n', 's'];
    const heading = dirOf(A);
    const score = (s) => (s === heading ? 6 : 0) + (had[A].has(s) ? 2 : 0) + (had[B].has(OPP[s]) ? 2 : 0) + (edgeOpen(a, s) ? 1 : 0) + (edgeOpen(b, OPP[s]) ? 1 : 0) + (s === 'e' ? 0.1 : 0);
    const cand = sides.filter((s) => !taken(A, s) && !taken(B, OPP[s])).sort((x, y) => score(y) - score(x));
    let done = false;
    for (const s of cand) {
      const ca = edgeOpen(a, s) || carve(a, s);
      const cb = edgeOpen(b, OPP[s]) || carve(b, OPP[s]);
      if (!ca || !cb) continue;
      const stopA = STOPS[STOP_INDEX[A]];
      const fwd = STOPS[STOP_INDEX[CHAIN.slice(CHAIN.indexOf(B)).find((id) => STOP_INDEX[id] !== undefined)]]?.name ?? OUTDOOR[B].name;
      const exit: any = { to: B };
      if (stopA && (stopA.kind === 'city')) {
        const flag = A === 'carmelo' ? 'has_starter' : openFlag(A);
        exit.req = flag;
        exit.deny = FWD_DENY(stopA, fwd);
      }
      a.exits[s] = exit;
      b.exits[OPP[s]] = { to: A };
      done = true;
      break;
    }
    if (!done) throw new Error(`no se pudo conectar ${A} con ${B} (cand ${cand}; A ${Object.keys(a.exits)} B ${Object.keys(b.exits)}; edgeA ${["n","s","e","w"].filter((s)=>edgeOpen(a,s))} edgeB ${["n","s","e","w"].filter((s)=>edgeOpen(b,s))})`);
  }
  // A road edge with no exit would be a silent dead end: close it with the border tile.
  for (const id of ['ruta1', 'ciclovia', 'r_laspiedras_montevideo', 'montevideo']) {
    const m = OUTDOOR[id];
    if (!m) continue;
    const rows = m.tiles.map((r) => [...r]);
    const h = rows.length, w = rows[0].length;
    const sides = { n: [...Array(w).keys()].map((x) => [x, 0]), s: [...Array(w).keys()].map((x) => [x, h - 1]), w: [...Array(h).keys()].map((y) => [0, y]), e: [...Array(h).keys()].map((y) => [w - 1, y]) };
    for (const [side, cells] of Object.entries(sides)) {
      if (m.exits?.[side]) continue;
      for (const [x, y] of cells) if (!TILE_INFO[rows[y][x]]?.solid) rows[y][x] = '#';
    }
    m.tiles = rows.map((r) => r.join(''));
  }
}
