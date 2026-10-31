// Authored story beats for the routes. Every guided route gets (a) a toll keeper who blocks the narrowest part of the
// trail until the trainers before it are beaten, (b) a person who lost something that sits in a grass clearing,
// and (c) a fog machine of the PP with a clue. Text is per route so each walk has its own small story.
import { TILE_INFO } from '../gfx/tiles.js';

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
function narrowestCut(m, busy) {
  const h = m.tiles.length, w = m.tiles[0].length;
  const long = w >= h;
  const span = long ? w : h, cross = long ? h : w;
  let best = null;
  for (let a = Math.floor(span * 0.3); a <= Math.floor(span * 0.7); a++) {
    const cells = [];
    for (let b = 1; b < cross - 1; b++) {
      const [x, y] = long ? [a, b] : [b, a];
      if (!solid(m.tiles[y][x]) && m.tiles[y][x] !== '~' && m.tiles[y][x] !== 'λ') cells.push([x, y]);
    }
    if (!cells.length || cells.length > 4 || cells.some(([x, y]) => busy.has(`${x},${y}`))) continue;
    if (!best || cells.length < best.length) best = cells;
  }
  return best;
}

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

/** Adds the toll keeper, the lost-item person and the fog machine to a guided route map. */
export function addRouteStory(m, id) {
  const st = ROUTE_STORIES[id];
  if (!st || m.theme === 'cueva' || m.dark || m.safari) return;
  m.npcs ??= [];
  const busy = new Set([...m.npcs, ...(m.items ?? []), ...(m.legend ? [m.legend] : [])].map((o) => `${o.x},${o.y}`));
  const trainers = m.npcs.filter((n) => n.trainer);

  // toll keeper: blocks the narrowest cross-section until every trainer on the route is beaten
  const cut = trainers.length > 1 ? narrowestCut(m, busy) : null;
  if (cut) {
    const [who, look, text] = st.gate;
    // whichever end the player enters from, only the trainers on that side must be beaten (never ones behind the gate)
    const long = m.tiles[0].length >= m.tiles.length;
    const at = (n) => (long ? n.x : n.y);
    const edge = long ? cut[0][0] : cut[0][1];
    const lo = trainers.filter((n) => at(n) < edge).map((n) => n.trainer.id);
    const hi = trainers.filter((n) => at(n) > edge).map((n) => n.trainer.id);
    const done = (f) => lo.every((t) => f[`tr_${t}`]) || hi.every((t) => f[`tr_${t}`]);
    if (lo.length && hi.length) cut.forEach(([x, y]) => { m.npcs.push({ x, y, look, dir: 'down', blocker: true, name: who, text: [text, 'Todavía quedan entrenadores en el camino.'], cond: (f) => !done(f) }); busy.add(`${x},${y}`); });
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
  if (mach) m.npcs.push({ x: mach[0], y: mach[1], look: 'machine', dir: 'down', name: 'Máquina de niebla', script: 'route_fog', clue: st.fog, doneFlag: `rf_${id}` });
}
