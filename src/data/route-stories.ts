// Authored story beats for the routes. Every guided route gets (a) a toll keeper who blocks the narrowest part of the
// trail until the trainers before it are beaten, (b) a person who lost something that sits in a grass clearing,
// and (c) a fog machine of the PP with a clue. Text is per route so each walk has its own small story.
import { TILE_INFO } from '../gfx/tiles.ts';
import { STOPS } from './route.ts';

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const solid = (c) => c === undefined || !!TILE_INFO[c]?.solid;

// gate: [who, look, text]; quest: [who, look, ask, thanks, reward item]; fog: clue read on the machine.
export const ROUTE_STORIES = {
  ruta1: {
    gate: ['Peón de campo', 'gaucho', 'Esta tranquera es de don Eusebio. Pasa quien le gana a los peones; si no, a la ciudad no se va.'],
    quest: ['Doña Nelly', 'mom', 'Se me cayó el termo por el pasto. Buscalo en un claro, entre la hierba alta.', 'Mi termo. Gracias, {player}. Llevate esto para el camino.', 'mate'],
    fog: 'Un tubo viejo suelta humo gris. Una etiqueta dice: "Niebla Pampa S.A. · prueba de mercado".',
  },
  r_colonia_rosario: {
    gate: ['Capataz del puerto', 'sailor', 'Hay un derrumbe de cajas más adelante. Los estibadores lo despejan cuando termines con ellos.'],
    quest: ['Estibadora Lía', 'girl', 'Perdí una encomienda al bajar del camión. Debe estar en un claro del pasto.', 'La encomienda. Traía repuestos para el faro. Tomá.', 'esfera'],
    fog: 'Una caja con ventilador echa niebla sobre el camino. Alguien anotó "ensayo Colonia: turistas compran más al no ver el río".',
  },
  r_rosario_sanjose: {
    gate: ['Guardabosques', 'oldman', 'El bosque es largo y los nidos están por todos lados. Pasá cuando te hayas ganado el derecho con los que lo cuidan.'],
    quest: ['Leñador Aníbal', 'boy', 'Se me perdió el hacha grande. Seguro rodó a un claro del pasto.', 'Mi hacha. Ahora puedo terminar la leña. Gracias.', 'mate_dulce'],
    fog: 'Una máquina cubierta de ramas echa niebla entre los troncos. Se ve el sello de la PP en el costado.',
  },
  r_ecilda_trinidad: {
    gate: ['Carretero', 'gaucho', 'El camino se cierra más adelante: carreta atravesada. Mis ayudantes la mueven si los vencés.'],
    quest: ['Rosa, la quesera', 'mom', 'Dejé un queso por ahí, entre la hierba. Si lo encontrás, avisame.', 'Mi queso, y entero. Te regalo algo para la ruta.', 'mate'],
    fog: 'Una bomba de humo esconde el monte. La nota dice: "Los vecinos piden menos niebla. Subir presión."',
  },
  r_villasoriano_fraybentos: {
    gate: ['Lanchero', 'sailor', 'La balsa no cruza con trainers sueltos en la costa. Venciéndolos, paso libre.'],
    quest: ['Pescador Genaro', 'sailor', 'Perdí mi reel en los pastizales. Está en un claro, seguro.', 'Mi reel. Con esto vuelvo a pescar. Tomá.', 'superesfera'],
    fog: 'Una máquina de niebla en la orilla. Un papel dice: "El Anglo quiere niebla toda la semana".',
  },
  r_belen_artigas: {
    gate: ['Arriero', 'gaucho', 'La majada cruza el camino. Cuando mis muchachos terminen con vos, abro paso.'],
    quest: ['Arrocero Julián', 'boy', 'Se me cayó un saquito de semillas en el pasto. Debe estar en un claro.', 'Las semillas. Gracias, ahora cosecho tranquilo.', 'mate_dulce'],
    fog: 'La niebla acá llega del sur. En el costado de la máquina: "Frontera con Brasil: aumentar venta".',
  },
  r_baltasar_rivera: {
    gate: ['Contrabandista arrepentido', 'boy', 'Yo vigilaba este paso para otros. Si me ganás, te dejo; si no, sigo.'],
    quest: ['Doña Cirila', 'mom', 'Se me cayó el rosario en la hierba. Buscalo en un claro.', 'Mi rosario. Que tengas buen viaje.', 'superesfera'],
    fog: 'Una caja escondida suelta humo. La etiqueta dice: "Rivera: probar con la frontera cerrada".',
  },
  r_tupambae_melo: {
    gate: ['Capataz de estancia', 'gaucho', 'Alambrado cerrado por reparación. Mis peones lo abren si los vencés.'],
    quest: ['Jinete Rubén', 'gaucho', 'Perdí el mate de plata entre los pastos. Debe estar en un claro.', 'Mi mate de plata. Tomá un premio.', 'mate_dulce'],
    fog: 'Máquina de niebla en medio de la cuchilla. Alguien escribió: "Melo: la torre se ve mejor entre niebla".',
  },
  r_cerrochato_quebrada: {
    gate: ['Peón de arrozal', 'boy', 'El camino está embarrado más adelante. Dejo pasar a quien se anima a una pelea.'],
    quest: ['Maestra Elba', 'girl', 'Se me cayó la libreta con las notas. Debe estar en un claro de pasto.', 'La libreta. Gracias por cuidar mi trabajo.', 'esfera'],
    fog: 'Una máquina tose niebla. Dice: "Quebrada de los Cuervos: base del este".',
  },
  r_lascano_rocha: {
    gate: ['Guarda de tren', 'cop', 'Paso a nivel en reparación. Se abre cuando termines con los guardas del tramo.'],
    quest: ['Guarda Mario', 'cop', 'Perdí mi silbato en el pasto, por un claro. Sin él no puedo trabajar.', 'Mi silbato. Tomá una mano a cambio.', 'superesfera'],
    fog: 'Una máquina de niebla junto a la vía. "Facu pasó por acá. Preguntó mucho." está anotado en la etiqueta.',
  },
  r_rocha_paloma: {
    gate: ['Salvavidas', 'swimmer', 'La playa está cerrada hasta que los bañistas dejen de pelear. Vencelos y pasás.'],
    quest: ['Turista Camila', 'girl', 'Perdí mis anteojos de sol en el pasto, en un claro. Ayudame.', 'Mis anteojos. Tomá un regalo.', 'mate_dulce'],
    fog: 'Una máquina de niebla escondida entre los médanos. El cartel dice "Cabo Polonio: apagar el faro".',
  },
  r_casupa_florida: {
    gate: ['Contratista', 'gaucho', 'Puente en obra. Los obreros lo abren cuando los venzas.'],
    quest: ['Mecánico Raúl', 'boy', 'Se me cayó una llave inglesa al pasto, en un claro. ¿La buscás?', 'Mi llave. Con esto arreglo todo. Tomá.', 'esfera'],
    fog: 'Máquina de niebla nueva, apenas encendida. La etiqueta reza "Florida: cielo para los pájaros".',
  },
  r_sarandi_durazno: {
    gate: ['Chofer de ómnibus', 'cop', 'Cortaron el camino por un accidente de tránsito. Pasá cuando venzas a los curiosos.'],
    quest: ['Doña Inés', 'mom', 'Perdí mi canasta con alfajores. Debe estar en un claro de la hierba.', 'La canasta. Un alfajor para vos.', 'mate_dulce'],
    fog: 'Una caja de niebla junto a un poste. Dice: "Durazno: apagar la refinería, nadie lo nota".',
  },
  r_sanramon_canelones: {
    gate: ['Quintero', 'boy', 'La quinta está cerrada al paso. Si mis trabajadores caen, abro el portón.'],
    quest: ['Jardinero Efraín', 'oldman', 'Se me cayó la tijera de podar en el pasto. Un claro, creo.', 'Mi tijera. Gracias. Tomá esto.', 'superesfera'],
    fog: 'Máquina de niebla escondida en el vivero. Un papel: "Canelones: la niebla ya llegó a los viñedos".',
  },
  ruta8: {
    gate: ['Obrero vial', 'cop', 'Trabajos en la ruta. Mis compañeros lo despejan si los vencés.'],
    quest: ['Camionero Tito', 'boy', 'Se me cayó la linterna en la banquina. Estará en un claro del pasto.', 'Mi linterna. Tomá una mano.', 'esfera'],
    fog: 'Una máquina de niebla junto al camino. Alguien rayó: "Quitar antes que llegue la medalla".',
  },
  ruta5: {
    gate: ['Peón de tambo', 'boy', 'Las vacas cruzaron. Pasás cuando mis compañeros terminen contigo.'],
    quest: ['Tambero Walter', 'gaucho', 'Perdí la campana de las vacas. Debe haber caído en un claro.', 'La campana. Tomá, por la ayuda.', 'mate_dulce'],
    fog: 'Humo gris sube de una chimenea falsa. Papel: "Tacuarembó: la bicicleta no nos detiene".',
  },
  ruta30: {
    gate: ['Aduanero', 'cop', 'Hay un puesto de control más adelante. Hasta que los de la frontera caigan, no avanzo.'],
    quest: ['Cambista Osvaldo', 'oldman', 'Se me cayó un sobre de billetes viejos en el pasto. Un claro.', 'El sobre. No vale nada, pero tengo cariño. Tomá.', 'superesfera'],
    fog: 'Máquina de niebla junto a una antena. Dice: "Torre de Rivera: repetir cada tres horas".',
  },
  ruta31: {
    gate: ['Operario de represa', 'cop', 'El puente de servicio está cerrado. Mis colegas lo abren si ganás.'],
    quest: ['Técnica Bárbara', 'girl', 'Se me cayó el casco en el pasto. Debe estar en un claro.', 'Mi casco. La seguridad ante todo. Tomá.', 'esfera'],
    fog: 'Una caja de niebla mojada. Dice: "Salto: la represa sirve de refrigerante".',
  },
  ruta3: {
    gate: ['Remero del club', 'sailor', 'El camino está cortado por la crecida. Cuando los remeros se despejen, pasás.'],
    quest: ['Doña Hilda', 'mom', 'Dejé una cesta de tortas fritas en el pasto. Si la encontrás, un premio.', 'Mi cesta. Qué buenas, ¿verdad? Tomá.', 'mate_dulce'],
    fog: 'Máquina de niebla entre juncos. "Paysandú: crear mito del río embrujado".',
  },
  ruta24: {
    gate: ['Frigorífico: portero', 'cop', 'Camino cerrado para el turno de la tarde. Hablá primero con mi gente.'],
    quest: ['Obrero Julio', 'boy', 'Perdí mi cédula en el pasto. Un claro, seguramente.', 'Mi cédula. Gracias. Tomá un regalo.', 'superesfera'],
    fog: 'La máquina de niebla más grande hasta ahora. Una nota: "Anglo: producción lista, mover a Salto."',
  },
};

/** Narrowest cross-section of the trail (fewest walkable tiles) away from the map edges and from every object. */
function narrowestCut(m, busy, from = 0.3, to = 0.7, maxCells = 4) {
  const h = m.tiles.length, w = m.tiles[0].length;
  const long = w >= h;
  const span = long ? w : h, cross = long ? h : w;
  let best = null;
  for (let a = Math.floor(span * from); a <= Math.floor(span * to); a++) {
    const cells = [];
    for (let b = 1; b < cross - 1; b++) {
      const [x, y] = long ? [a, b] : [b, a];
      // water (the canoe) and ledges (jumping down) can be crossed too, so a closed gate must hold those tiles as well
      if (!solid(m.tiles[y][x]) || m.tiles[y][x] === '~' || m.tiles[y][x] === 'λ') cells.push([x, y]);
    }
    if (!cells.length || cells.length > maxCells || cells.some(([x, y]) => busy.has(`${x},${y}`))) continue;
    if (!best || cells.length < best.length) best = cells;
  }
  return best;
}

/** Who stands on a closed gate: on open water it has to be a swimmer. */
const blockLook = (m, x, y, look) => (m.tiles[y][x] === '~' ? 'swimmer' : look);

/** A free walkable tile near the trail (not on it), at least two tiles away from every object. */
function freeSpot(m, busy, prefer) {
  const h = m.tiles.length, w = m.tiles[0].length;
  const pts = [];
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
    const c = m.tiles[y][x];
    if (c !== '.' || [...busy].some((k) => { const [bx, by] = k.split(',').map(Number); return Math.abs(bx - x) + Math.abs(by - y) < 3; })) continue;
    if (D4.every(([dx, dy]) => !solid(m.tiles[y + dy][x + dx]))) pts.push([x, y]);
  }
  if (!pts.length) return null;
  const idx = Math.min(pts.length - 1, Math.floor(prefer * pts.length));
  return pts[idx];
}

/** Which end of the route's long axis the story enters from: 'lo' (west/north) or 'hi' (east/south). */
function entryEnd(m, id): 'lo' | 'hi' {
  const from = STOPS.find((st) => st.via?.includes(id))?.id ?? /^r_([a-z]+)_/.exec(id)?.[1];
  const side = Object.entries((m.exits ?? {}) as Record<string, any>).find(([, e]) => e?.to === from)?.[0];
  return side === 'e' || side === 's' ? 'hi' : 'lo';
}


// Each route keeps only some of the obstacles so no two walks feel the same: g = trainers' toll gate, r = riddle herd,
// l = lever gate, f = PP fog machine. (The lost-item person and the local legend are on every route.)
const ROUTE_MIX: Record<string, string> = {
  ruta1: 'g', r_colonia_rosario: 'gf', r_rosario_sanjose: 'r', r_ecilda_trinidad: 'lg', r_villasoriano_fraybentos: 'fr',
  r_belen_artigas: 'g', r_baltasar_rivera: 'rl', r_tupambae_melo: 'f', r_cerrochato_quebrada: 'gl', r_lascano_rocha: 'r',
  r_rocha_paloma: 'gf', r_casupa_florida: 'l', r_sarandi_durazno: 'gr', r_sanramon_canelones: 'f',
  ruta8: 'g', ruta5: 'r', ruta30: '', ruta31: 'l', ruta3: 'g', ruta24: 'f',
};
const mixOf = (id: string) => ROUTE_MIX[id] ?? 'g';

// A local with a story of this stretch of land; some leave a small gift the first time. [name, look, lines, gift?]
const ROUTE_LEGENDS: Record<string, [string, string, string[], [string, number]?]> = {
  ruta1: ['Don Eusebio', 'gaucho', ['Esta tranquera la levantó mi abuelo con postes de ñandubay. Todavía no se pudrió ni uno.', 'Dicen que antes del pueblo, acá pasaban las tropas de carretas rumbo a la costa.']],
  r_colonia_rosario: ['Farero retirado', 'oldman', ['Desde esta curva se ve el faro. De niño contaba cuántas veces giraba la luz por noche.', 'En las noches sin viento, el río suena distinto.'], ['esfera', 2]],
  r_rosario_sanjose: ['Hachero Anselmo', 'gaucho', ['Este monte era mucho más espeso. Los eucaliptos vinieron después, con los inmigrantes.', 'Si oís un golpe seco en la noche, no es un fantasma: es un ñandubay que se parte de viejo.']],
  r_ecilda_trinidad: ['Carretera Dora', 'mom', ['Mi marido hacía carros. Hoy hacemos ruedas para turistas, pero me gusta oír el eje cantar.', 'En los días de calor, la sombra del único ombú de la ruta es el mejor negocio del lugar.'], ['mate', 2]],
  r_villasoriano_fraybentos: ['Balsero Ismael', 'sailor', ['Antes de las lanchas había balsas con caballos. Mi bisabuelo cruzó a Soriano cuarenta años seguidos.', 'Cuando el río crece, la balsa se queda amarrada y los pájaros se meten en el pasto como en casa.']],
  r_belen_artigas: ['Arrocero Julián', 'boy', ['Acá todo arroz es de frontera: un poco de acá, un poco de allá y el agua de ninguno.', 'Las garzas siguen al tractor como si fuera su dueño.'], ['mate_dulce', 2]],
  r_baltasar_rivera: ['Vendedora de dulces', 'mom', ['Mi tía cruzaba a Brasil por el campo, con la canasta en la cabeza. Nunca perdió un dulce.', 'La frontera es una línea en un mapa; acá es el almuerzo de todos los días.']],
  r_tupambae_melo: ['Alambrador Gerardo', 'gaucho', ['Cuatro hilos de alambre, tres varillas y una vida entera de cuchilla. Eso es mi trabajo.', 'En la loma se juntan nubes antes que en ningún lado. Mirá cómo vienen.']],
  r_cerrochato_quebrada: ['Maestra Elba', 'maestra', ['Cerro Chato queda en tres departamentos al mismo tiempo. Los chicos aprenden la historia de todos.', 'Si ves una luz baja en la madrugada, es el arrocero revisando la compuerta.'], ['esfera', 3]],
  r_lascano_rocha: ['Guardafauna Mirta', 'cop', ['Los bañados de acá alojan más aves que personas en todo el departamento.', 'No pises la orilla blanda: hay carpinchos que duermen el día entero y no les gusta el sobresalto.']],
  r_rocha_paloma: ['Pescador Ariel', 'sailor', ['Cuando la laguna se abre al mar, el agua cambia de color. Mi hijo dice que es magia; yo digo que es sal.', 'Las gaviotas conocen los horarios de las lanchas mejor que yo.'], ['superesfera', 1]],
  r_casupa_florida: ['Arriero Nicanor', 'gaucho', ['Este tramo lo marcaron las tropas hace más de cien años. El camino sigue donde las pezuñas lo dejaron.', 'Una tarde vi cruzar un ñandú con crías y paré el carro para dejarlos pasar.']],
  r_sarandi_durazno: ['Herrero Telmo', 'oldman', ['Mi forja no apaga nunca del todo: dejo brasas para la madrugada.', 'Los rieles viejos se oyen a cuatro leguas cuando pasa el tren.']],
  r_sanramon_canelones: ['Quintera Berta', 'mom', ['Acá el vino sale de mala gana y el tomate de buena. Es cuestión de suelos.', 'En diciembre, la ruta se llena de puestos de verdura. Se oye hasta el pregón.'], ['mate_dulce', 2]],
  ruta8: ['Peón de estancia', 'gaucho', ['Pasé toda mi vida en este campo y todavía encuentro algún rincón que no conocía.', 'A las seis de la tarde, la luz en esta cuchilla es dorada. Lástima que dura poco.']],
  ruta5: ['Gaucho viajero', 'gaucho', ['Siempre llevo yerba de más. En la ruta, alguien siempre necesita un mate.', 'Hay cosas que se aprenden caminando: dónde está el pozo, quién tiene perro, cuándo cambia el viento.'], ['mate', 3]],
  ruta30: ['Pescador del arroyo', 'sailor', ['Este arroyo cambia de humor con las lluvias. Hoy está manso; mañana quién sabe.', 'En la orilla de enfrente hay un viejo sauce donde dejé mi primer anzuelo.']],
  ruta31: ['Vecina del lugar', 'girl', ['Mi abuela contaba que de noche se oía un silbido largo en la sierra. Dicen que era el viento entre las piedras.', 'Hay un caminito de cabras que sube más rápido que la ruta, pero no se lo recomiendo a cualquiera.'], ['esfera', 2]],
  ruta3: ['Camionero Hugo', 'sailor', ['Veinte años manejando por acá y todavía me sorprende el cielo en esta parte del país.', 'Cuando llueve fuerte, el agua baja por la ruta como arroyo. Hay que ir despacio.']],
  ruta24: ['Estudiante de geología', 'boy', ['Estas piedras rojizas tienen más de quinientos millones de años. Es mucho para pisarlas sin saludar.', 'Las canteras de acá dieron granito para media ciudad.'], ['piedra_agata', 1]],
};

const RIDDLE_FREE = new Set(['ruta1', 'r_colonia_rosario', 'ruta30']); // no riddle gate on the first routes of the story, nor on the short river route (its Surf river already closes it)

/** Adds the toll keeper, the lost-item person and the fog machine to a guided route map. */
export function addRouteStory(m, id) {
  addParaje(m, id);
  const st = ROUTE_STORIES[id];
  if (!st || m.theme === 'cueva' || m.dark || m.safari) return;
  m.npcs ??= [];
  const busy = new Set([...m.npcs, ...(m.items ?? []), ...(m.legend ? [m.legend] : [])].map((o) => `${o.x},${o.y}`));
  const trainers = m.npcs.filter((n) => n.trainer);

  // toll keeper: blocks the narrowest cross-section until every trainer on the route is beaten
  const mix = mixOf(id);
  const cut = trainers.length > 1 && mix.includes('g') ? narrowestCut(m, busy, 0.3, 0.7, 10) : null;
  if (cut) {
    const [who, look, text] = st.gate;
    // whichever end the player enters from, only the trainers on that side must be beaten (never ones behind the gate)
    const long = m.tiles[0].length >= m.tiles.length;
    const at = (n) => (long ? n.x : n.y);
    const edge = long ? cut[0][0] : cut[0][1];
    const lo = trainers.filter((n) => at(n) < edge).map((n) => n.trainer.id);
    const hi = trainers.filter((n) => at(n) > edge).map((n) => n.trainer.id);
    const done = (f) => lo.every((t) => f[`tr_${t}`]) || hi.every((t) => f[`tr_${t}`]);
    if (lo.length && hi.length) cut.forEach(([x, y]) => { m.npcs.push({ x, y, look: blockLook(m, x, y, look), dir: 'down', blocker: true, fixed: true, name: who, text: [text, 'Todavía quedan entrenadores en el camino.'], cond: (f) => !done(f) }); busy.add(`${x},${y}`); });
  }

  // lost item: points to the clearing with the hidden item
  const hole = (m.items ?? []).find((i) => String(i.id).includes('_hole0'));
  const spot = freeSpot(m, busy, 0.35);
  if (hole && spot) {
    const [who, look, ask, thanks, reward] = st.quest;
    m.npcs.push({ x: spot[0], y: spot[1], look, dir: 'down', name: who, script: 'route_quest', holeFlag: `it_${hole.id}`, doneFlag: `rq_${id}`, ask, thanks, reward });
    busy.add(`${spot[0]},${spot[1]}`);
  }

  // fog machine: a PP object with a clue about the business
  const mach = freeSpot(m, busy, 0.75);
  if (mix.includes('l')) addLeverGate(m, id, busy);
  // riddle gate: a second obstacle earlier on the trail, opened by answering a riddle (never a battle)
  // The first routes (leaving Carmelo and Colonia) stay free: the story starts without obstacles.
  // It sits near the end the player arrives from, and the old man waits on that same side of the animals.
  const entry = entryEnd(m, id);
  const rcut = RIDDLE_FREE.has(id) || !mix.includes('r') ? null : entry === 'lo' ? narrowestCut(m, busy, 0.12, 0.28, 10) : narrowestCut(m, busy, 0.72, 0.88, 10);
  if (rcut) {
    const flag = `rf_rid_${id}`.slice(0, 40);
    // One herd of a single kind fills the pass (the old man is driving it); one old man stands beside it, on the
    // player's side, and asks the riddle. Answering sends the animals away.
    const herd = ['oveja', 'ternero', 'criollo', 'toro', 'carnero'];
    const seed = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 5);
    const kind = herd[seed % herd.length];
    const long = m.tiles[0].length >= m.tiles.length;
    const line = long ? rcut[0][0] : rcut[0][1];
    const onEntrySide = (x, y) => (entry === 'lo' ? (long ? x : y) < line : (long ? x : y) > line);
    rcut.forEach(([x, y]) => {
      m.npcs.push({ x, y, look: m.tiles[y][x] === '~' ? 'swimmer' : `animal:${kind}`, dir: 'down', blocker: true, fixed: true, text: ['Los animales no se mueven del camino.'], cond: (f) => !f[flag] });
      busy.add(`${x},${y}`);
    });
    // spot for the old man: open grass within two tiles of the pass, off the trail
    let spotM: [number, number] | null = null, bestD = 9;
    for (const [cx, cy] of rcut) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.abs(dx) + Math.abs(dy);
      if (!d || d >= bestD || !onEntrySide(x, y) || m.tiles[y]?.[x] !== '.' || busy.has(`${x},${y}`) || rcut.some(([rx, ry]) => rx === x && ry === y)) continue;
      if ([...busy].some((k) => { const [bx, by] = k.split(',').map(Number); return !rcut.some(([rx, ry]) => rx === bx && ry === by) && Math.abs(bx - x) + Math.abs(by - y) < 2; })) continue;
      spotM = [x, y]; bestD = d;
    }
    if (spotM) {
      const [ox, oy] = spotM, [tx, ty] = rcut[0];
      const dir = Math.abs(tx - ox) >= Math.abs(ty - oy) ? (tx < ox ? 'left' : 'right') : (ty < oy ? 'up' : 'down');
      m.npcs.push({ x: ox, y: oy, look: 'oldman', dir, fixed: true, name: 'Viejo del paso', script: 'route_riddle', riddleId: id, doneFlag: flag, text: 'Un viejo cuida el paso. Si alguien contesta bien su pregunta, los animales se apartan.' });
      busy.add(`${ox},${oy}`);
    } else {
      rcut.forEach(([x, y]) => { const i = m.npcs.findIndex((n) => n.x === x && n.y === y && n.blocker && !n.script); if (i >= 0) m.npcs.splice(i, 1); }); // no room for him: leave the way open
    }
  }
  // the local legend: a person with a story of this stretch of land, off the trail
  const lg = ROUTE_LEGENDS[id];
  const lspot = lg ? freeSpot(m, busy, 0.55) : null;
  if (lg && lspot) {
    m.npcs.push({ x: lspot[0], y: lspot[1], look: lg[1], dir: 'down', name: lg[0], script: 'route_legend', lines: lg[2], gift: lg[3] ?? null, doneFlag: `rq_leg_${id}`.slice(0, 40) });
    busy.add(`${lspot[0]},${lspot[1]}`);
  }
  if (mach && mix.includes('f')) m.npcs.push({ x: mach[0], y: mach[1], look: 'machine', dir: 'down', name: 'Máquina de niebla', script: 'route_fog', clue: st.fog, doneFlag: `rf_${id}` });
}


// ---------------------------------------------------------------- parajes
const RANCHO = ['rrrrr', 'rrrrr', 'HwwwH'];
const PARAJE_FOLK: [string, string, string[]][] = [
  ['Doña Ramona', 'mom', ['Esta posta es de mi familia desde hace tres generaciones.', 'Acá paran los carreros, los viajantes y ahora hasta los entrenadores.']],
  ['Don Teodoro', 'gaucho', ['Si el camino te parece largo, es que lo estás mirando con apuro.', 'Los arroyos de esta ruta bajan con ganas después de la lluvia.']],
  ['Viajante Marcos', 'boy', ['Hago esta ruta una vez por semana y siempre veo algo distinto.', 'Hay un guardián en el paso al que le gustan los acertijos.']],
  ['Maestra rural Inés', 'maestra', ['Doy clase a seis chicos en el rancho del fondo.', 'Les enseño a mirar el campo antes de salir a contarlo.']],
];

/** A paraje: a small cluster of ranchos with fence, a well and two neighbours, set beside the trail of a long route. */
export function addParaje(m, id) {
  const w = m.tiles[0].length, h = m.tiles.length;
  if (Math.max(w, h) < 60 || m.theme === 'cueva' || m.dark || m.safari) return;
  const g = m.tiles.map((r) => [...r]);
  const free = (c) => c === '.' || c === ',' || c === 'f' || c === 'q' || c === '#' || c === 'R' || c === 'p';
  const trail = (c) => c === '=' || c === 'b';
  const AW = 9, AH = 6;
  const seed = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);
  const cands: [number, number][] = [];
  for (let y = 3; y < h - AH - 2; y++) for (let x = 3; x < w - AW - 2; x++) {
    let ok = true, near = false;
    for (let dy = -1; dy <= AH && ok; dy++) for (let dx = -1; dx <= AW && ok; dx++) {
      const c = g[y + dy]?.[x + dx];
      if (c === undefined || (dx >= 0 && dx < AW && dy >= 0 && dy < AH && !free(c))) ok = false;
      if (c && trail(c)) near = true;
    }
    const busy = [...(m.npcs ?? []), ...(m.items ?? [])].some((o) => o.x >= x - 1 && o.x <= x + AW && o.y >= y - 1 && o.y <= y + AH);
    if (ok && !busy) cands.push([x, y]);
    void near;
  }
  if (!cands.length) return;
  // prefer areas close to the trail (within 4 tiles) but not touching it
  const dTrail = (x, y) => { let best = 99; for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (trail(g[yy][xx])) best = Math.min(best, Math.abs(xx - x) + Math.abs(yy - y)); return best; };
  const dist = Array.from({ length: h }, () => Array(w).fill(999));
  const queue: [number, number][] = [];
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (trail(g[yy][xx])) { dist[yy][xx] = 0; queue.push([xx, yy]); }
  for (let i = 0; i < queue.length; i++) { const [qx, qy] = queue[i]; for (const [dx, dy] of D4) { const nx = qx + dx, ny = qy + dy; if (dist[ny]?.[nx] > dist[qy][qx] + 1) { dist[ny][nx] = dist[qy][qx] + 1; queue.push([nx, ny]); } } }
  void dTrail;
  const scored = cands.map(([x, y]) => [x, y, dist[y + (AH >> 1)][x + (AW >> 1)]] as [number, number, number]).filter(([, , d]) => d >= 3 && d <= 16).sort((a, b) => a[2] - b[2]);
  const pick = scored[seed % Math.max(1, Math.min(scored.length, 4))];
  if (!pick) return;
  const [x0, y0] = pick;
  const put = (x, y, pat) => pat.forEach((line, dy) => [...line].forEach((c, dx) => { g[y + dy][x + dx] = c; }));
  // signs are matched to 'S' tiles in reading order: find where the new one falls
  let signIdx = 0;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (g[yy][xx] === 'S' && (yy < y0 + 4 || (yy === y0 + 4 && xx < x0 + 4))) signIdx++;
  const backup = g.map((r) => [...r]);
  for (let dy = 0; dy < AH; dy++) for (let dx = 0; dx < AW; dx++) g[y0 + dy][x0 + dx] = '.';
  put(x0 + 2, y0, RANCHO);
  for (let dx = 0; dx < AW; dx++) g[y0 + 5][x0 + dx] = dx === 4 ? '.' : 'F';   // fence with a gap
  g[y0 + 4][x0 + 4] = 'S';
  // the whole area must stay reachable from the trail, otherwise the paraje is skipped
  const start = (() => { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (trail(g[yy][xx])) return [xx, yy]; return null; })();
  if (!start) return;
  const seen = new Set([start.join()]);
  const stack = [start];
  while (stack.length) { const [qx, qy] = stack.pop(); for (const [dx, dy] of D4) { const nx = qx + dx, ny = qy + dy, c = g[ny]?.[nx]; if (c !== undefined && !solid(c) && c !== 'λ' && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); stack.push([nx, ny]); } } }
  if (![[x0 + 1, y0 + 3], [x0 + 7, y0 + 3], [x0 + 6, y0 + 4]].every(([ex, ey]) => seen.has(`${ex},${ey}`))) { void backup; return; }
  m.tiles = g.map((r) => r.join(''));
  const folk = [PARAJE_FOLK[seed % 4], PARAJE_FOLK[(seed + 2) % 4]];
  (m.npcs ??= []).push(
    { x: x0 + 1, y: y0 + 3, look: folk[0][1], dir: 'down', name: folk[0][0], text: folk[0][2] },
    { x: x0 + 7, y: y0 + 3, look: folk[1][1], dir: 'down', wander: true, name: folk[1][0], text: folk[1][2] },
  );
  (m.signs ??= []).splice(signIdx, 0, 'Posta del camino\nAgua fresca y sombra. Se agradece pasar de a uno.');
  (m.items ??= []).push({ x: x0 + 6, y: y0 + 4, item: 'mate', id: `${id}_paraje` });
}


// ---------------------------------------------------------------- lever gate
const LEVERS = [['Palanca verde', 'verde'], ['Palanca azul', 'azul'], ['Palanca roja', 'roja']];
const ORDERS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

/** A gate held by three levers on each side of it: they must be pulled in the right order, learned from a farmhand. */
export function addLeverGate(m, id, busy) {
  const w = m.tiles[0].length, h = m.tiles.length;
  if (Math.max(w, h) < 60) return;
  const cut = narrowestCut(m, busy, 0.5, 0.92, 12);
  if (!cut) return;
  const long = w >= h;
  const gateAt = long ? cut[0][0] : cut[0][1];
  const order = ORDERS[[...id].reduce((a, c) => (a * 17 + c.charCodeAt(0)) >>> 0, 3) % ORDERS.length];
  const taken = new Set<string>(busy);
  const spotsOn = (sign: number) => {
    const out: [number, number][] = [];
    for (let d = 3; d <= 26 && out.length < 4; d++) {
      for (let b = 2; b < (long ? h : w) - 2 && out.length < 4; b++) {
        const [x, y] = long ? [gateAt + sign * d, b] : [b, gateAt + sign * d];
        if (!['.', ','].includes(m.tiles[y]?.[x]) || !D4.every(([dx, dy]) => !solid(m.tiles[y + dy]?.[x + dx]))) continue;
        if ([...taken].some((k) => { const [bx, by] = k.split(',').map(Number); return Math.abs(bx - x) + Math.abs(by - y) < 3; })) continue;
        if (out.some(([ox, oy]) => Math.abs(ox - x) + Math.abs(oy - y) < 3)) continue;
        out.push([x, y]);
      }
    }
    return out;
  };
  const sides = [spotsOn(-1), spotsOn(1)];
  if (sides.some((l) => l.length < 4)) return;
  const done = `rf_gt_${id}`.slice(0, 40);
  const a = LEVERS[order[0]][1], c = LEVERS[order[2]][1];
  cut.forEach(([x, y]) => { m.npcs.push({ x, y, look: blockLook(m, x, y, 'gaucho'), dir: 'down', blocker: true, fixed: true, name: 'Tranquera', text: ['La tranquera está trabada con tres cerrojos.', 'Cada lado del camino tiene palancas que los mueven.'], cond: (f) => !f[done] }); taken.add(`${x},${y}`); });
  sides.forEach((list) => {
    LEVERS.forEach(([name], k) => { const [x, y] = list[k]; m.npcs.push({ x, y, look: 'machine', dir: 'down', name, script: 'route_palanca', routeId: id, lever: k, order, doneFlag: done }); taken.add(`${x},${y}`); });
    const [x, y] = list[3];
    m.npcs.push({ x, y, look: 'gaucho', dir: 'down', name: 'Peón', text: [`Esa tranquera la arreglé yo. La traba ${a} se suelta primero y la ${c} siempre queda para el final.`, 'Si te equivocás, los cerrojos vuelven a su lugar y se empieza de nuevo.'] });
  });
}
