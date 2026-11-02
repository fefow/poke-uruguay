// One-time events in the cities: contests and games with prizes (items or a gift creature). They never touch the
// story against the PP. Each event is a script on a person placed in the city after the map editor's patches.
// Flags use the `ev_` prefix (see FLAG_PATTERN in save/validate.ts).
import { fitToMap, rng } from './map-gen.ts';
import { SPECIES } from './species.ts';
import { mapBand } from './route.ts';

// ---------------------------------------------------------------- riddles at route gates
const RIDDLES: [string, string[], number][] = [
  ['Tiene hojas pero no es árbol, tiene lomo pero no es animal, y siempre se cuenta de a uno. ¿Qué es?', ['Un libro', 'Un cardo', 'Una carreta'], 0],
  ['Se toma con bombilla, se comparte en ronda y nunca se agradece. ¿Qué es?', ['El mate', 'El tereré', 'El chimarrão frío'], 0],
  ['En el Río de la Plata no hay marea alta de mar abierto, pero sí algo que sube con el viento del sur. ¿Qué es?', ['La sudestada', 'El Pampero', 'La garúa'], 0],
  ['Es el plato nacional del sándwich: carne, huevo, jamón, panceta y más. ¿Cuál es?', ['El chivito', 'El choripán', 'La milanesa'], 0],
  ['El Palacio Salvo y el Estadio Centenario están en la misma ciudad. ¿Cuál?', ['Montevideo', 'Salto', 'Rivera'], 0],
  ['Caminás sin patas, tenés casa pero no sos caracol, y te llevás todo en el lomo. ¿Quién sos?', ['El carpincho', 'El tatú', 'La tortuga'], 1],
  ['Cuántos departamentos tiene el Uruguay?', ['Diecinueve', 'Veintiuno', 'Quince'], 0],
  ['Cuando el Pampero sopla fuerte, el cielo...', ['Se aclara de golpe', 'Se llena de niebla', 'Se vuelve rojo'], 0],
  ['La piedra semipreciosa que más se saca en Artigas es...', ['La amatista', 'La esmeralda', 'El rubí'], 0],
  ['El río que divide a Uruguay de Brasil en el este es...', ['La laguna Merín', 'El río Negro', 'El río Santa Lucía'], 0],
  ['Es dulce, se hace con leche y se unta en el alfajor, el pan y la cuchara. ¿Cuál es?', ['La jalea de membrillo', 'El dulce de leche', 'La miel de caña'], 1],
  ['Tiene dos ruedas, no es moto y en la Ciclovía no puede faltar. ¿Qué es?', ['El monopatín', 'El triciclo', 'La bicicleta'], 2],
  ['El mate se prepara con las hojas molidas de...', ['Yerba mate', 'Té negro', 'Manzanilla'], 0],
  ['La fortaleza que domina el Cerro de Montevideo da nombre al...', ['Cerro', 'Pocitos', 'Parque Rodó'], 0],
  ['¿Qué festividad se celebra con tambores y murgas entre enero y febrero?', ['El carnaval', 'La Vendimia', 'El Día del Patrimonio'], 0],
  ['El árbol de flor roja que es la flor nacional es...', ['El ombú', 'El tala', 'El ceibo'], 2],
  ['Si te llevás un termo bajo el brazo, seguro vas a...', ['Dormir', 'Tomar mate', 'Pescar'], 1],
  ['El mar que baña Punta del Este y Rocha es el...', ['Mar Caribe', 'Océano Atlántico', 'Pacífico'], 1],
  ['La carne del asado criollo se cocina sobre brasas en la...', ['Parrilla', 'Olla', 'Plancha'], 0],
];

export const riddleFor = (id: string) => RIDDLES[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % RIDDLES.length];

// ---------------------------------------------------------------- contest scoring
/** Points of a creature for the capture contest: level, rarity, base stats and health at the catch. */
export function contestScore(c: any): number {
  const sp = SPECIES[c.species];
  const bst = sp.base.reduce((a, b) => a + b, 0);
  const hpPct = Math.max(0, Math.min(1, c.hp / (c.maxHp || c.stats?.hp || c.hp || 1)));
  return Math.round(c.level * 3 + (255 - (sp.catchRate ?? 100)) / 4 + bst / 8 + hpPct * 40);
}
export const CONTEST_CITY = 'canelones'; // the city with the bug gym

/** Hand-written park for the contest: clearings, tall grass and groves, one gate at the bottom. */
export function parkTiles(w = 38, h = 26): string[] {
  const r = rng('parque_concurso');
  const g: string[][] = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? '#' : ',')));
  for (let i = 0; i < 26; i++) { // groves
    const cx = 2 + Math.floor(r() * (w - 6)), cy = 2 + Math.floor(r() * (h - 8)), bw = 2 + Math.floor(r() * 3), bh = 2 + Math.floor(r() * 3);
    for (let y = cy; y < cy + bh; y++) for (let x = cx; x < cx + bw; x++) if (g[y]?.[x] === ',' && r() < 0.8) g[y][x] = 'q';
  }
  for (let i = 0; i < 9; i++) { // clearings of short grass
    const cx = 3 + Math.floor(r() * (w - 9)), cy = 2 + Math.floor(r() * (h - 9));
    for (let y = cy; y < cy + 4; y++) for (let x = cx; x < cx + 5; x++) if (g[y][x] !== '#') g[y][x] = r() < 0.2 ? 'f' : '.';
  }
  for (let x = 4; x < w - 4; x++) g[h - 4][x] = '=';          // main path
  for (let y = h - 4; y < h - 1; y++) { g[y][w >> 1] = '='; g[y][(w >> 1) + 1] = '='; }
  for (let y = h - 3; y < h - 1; y++) for (let x = (w >> 1) - 2; x < (w >> 1) + 4; x++) if (g[y][x] === 'q') g[y][x] = '.';
  return g.map((row) => row.join(''));
}
export const PARK = { w: 38, h: 26, gate: { x: 19, y: 24 } };

// ---------------------------------------------------------------- scripts
const O = (lo: number, hi: number) => hi; // readability: the top of a band
const topOf = (id: string) => O(...(mapBand(id) as [number, number]));

export const EVENT_SCRIPTS: Record<string, (api: any, npc?: any) => Promise<void>> = {
  // Colonia: a quiz about the old town from the lighthouse keeper's helper.
  async ev_quiz(api) {
    const who = 'Guía del casco histórico';
    if (api.flag('ev_quiz')) return api.say('Ya pasaste mi examen. Colonia tiene más historia de la que cabe en una tarde.', { name: who });
    if (!(await api.ask('Hago un examen a los que dicen conocer Colonia. Tres preguntas. Si acertás dos, hay premio. ¿Probás?', { name: who }))) return;
    const Q: [string, string[], number][] = [
      ['¿Qué fundaron los portugueses en 1680 frente a Buenos Aires?', ['La Colonia del Sacramento', 'El Fuerte de Santa Teresa', 'La Ciudad Vieja'], 0],
      ['¿Qué calle del barrio histórico tiene un nombre que parece de viaje?', ['Calle de los Suspiros', 'Calle de las Gaviotas', 'Calle del Muelle Viejo'], 0],
      ['¿Qué ayuda a los barcos a no encallar?', ['El faro', 'La aduana', 'La plaza'], 0],
    ];
    let ok = 0;
    for (const [q, opts, ans] of Q) {
      await api.say(q, { name: who, keep: true });
      const r = await api.choose(opts, { cancel: false });
      if (r === ans) { ok++; await api.say('Correcto.', { name: who }); } else await api.say('No exactamente.', { name: who });
    }
    api.setFlag('ev_quiz');
    if (ok >= 2) {
      api.sfx('catch');
      await api.say(`${ok} de 3. Merecido. Tomá estos regalos del barrio.`, { name: who });
      await api.give('superesfera', 3);
      await api.give('mate_dulce', 2);
    } else {
      await api.say(`${ok} de 3. Volvé a pasear por el casco histórico y se te va a pegar algo. Tomá, por el intento.`, { name: who });
      await api.give('esfera', 3);
    }
  },

  // San José: a payada duel; pick the verse that closes the rhyme, three rounds.
  async ev_payada(api) {
    const who = 'Payador';
    if (api.flag('ev_payada')) return api.say('Ganaste el verso y yo perdí la voz. Pasa que la tradición manda.', { name: who });
    if (!(await api.ask('Pagamos con un premio al que me siga el verso sin perder la rima. Son tres. ¿Te animás a contrapuntear?', { name: who }))) return;
    const R: [string, string[], number][] = [
      ['"Salgo a cantar al camino / con la guitarra en la mano, / buscando al que sea más sano / y le pelee su destino…" ¿Cómo cierra?', ['Mi canto es siempre ufano', 'Con el sol y el pampero vecino', 'Llevo el mate y el poncho cuyano'], 1],
      ['"Cuando el Pampero aparece / se aclara hasta el cielo entero, / porque lo manda el…"', ['Camino verdadero', 'Tiempo ligero', 'Cielo y el aguacero'], 0],
      ['"En la mesa del tambero / siempre hay lugar para el que llegue / y un mate de buen…"', ['Compañero', 'Entrevero', 'Yerbatero'], 0],
    ];
    let ok = 0;
    for (const [q, opts, ans] of R) {
      await api.say(q, { name: who, keep: true });
      const r = await api.choose(opts, { cancel: false });
      if (r === ans) ok++;
      await api.say(r === ans ? 'Rimó.' : 'No cierra.', { name: who });
    }
    api.setFlag('ev_payada');
    if (ok >= 2) {
      api.sfx('catch');
      await api.say('Cantás mejor que lo que decís. Llevate esto de recuerdo.', { name: who });
      await api.give('mate_dulce', 3);
      await api.give('refuerzo_ataque', 2);
    } else {
      await api.say('Todavía te falta cancha, pero hay que animarse. Tomá un mate.', { name: who });
      await api.give('mate', 2);
    }
  },

  // Mercedes: a lightning tournament, three fights in a row without healing; the prize is a gift creature.
  async ev_torneo(api, npc) {
    const who = 'Organizador del torneo';
    if (api.flag('ev_torneo')) return api.say('El torneo del Club de Remo ya lo ganaste. Siempre hay otra regata, pero esa copa es tuya.', { name: who });
    await api.say(['Torneo relámpago del Club de Remo: tres combates seguidos, sin curar entre uno y otro.', 'Si ganás los tres, te llevás una criatura del club como premio. Si perdés, podés volver a intentar.'], { name: who });
    if (!(await api.ask('¿Entrás?', { name: who }))) return;
    const hi = topOf('mercedes');
    const teams: [string, string, string, [string, number][]][] = [
      ['sailor', 'Remero Gustavo', 'Remero', [['nandulin', hi - 2], ['tuco', hi - 1]]],
      ['girl', 'Remera Paula', 'Remera', [['hornerito', hi - 1], ['oruga', hi - 1], ['hormiga', hi]]],
      ['gaucho', 'Comodoro Aldo', 'Comodoro', [['teruterito', hi], ['zorrigris', hi + 1]]],
    ];
    for (let i = 0; i < teams.length; i++) {
      const [look, name, cls, team] = teams[i];
      await api.say(`Combate ${i + 1} de 3.`, { name: who });
      const res = await api.battle({ id: `tor_${i}`, name, cls, look, team: team.filter(([k]) => SPECIES[k]), prize: 150 * (i + 1), intro: ['¡A remar!'], lose: 'Buena remada.', after: null, ai: 'basic' }, { canLose: true });
      if (res !== 'win') {
        api.healParty({ silent: true });
        return api.say('Quedaste eliminado, pero atendimos a tus criaturas. Volvé cuando quieras.', { name: who });
      }
    }
    api.setFlag('ev_torneo');
    api.sfx('catch');
    await api.say(['¡Campeón del torneo relámpago!', 'El club te regala una criatura criada en la costanera.'], { name: who });
    const key = SPECIES.lobomarino ? 'lobomarino' : 'nandulin';
    api.giveCreature(key, Math.max(5, hi - 4));
    await api.say(`{player} recibió a ${SPECIES[key].name}.`);
    api.healParty({ silent: true });
  },

  // Trade NPCs: hand over a creature of one species, get another at the same level. One trade each (flag ev_trade_<id>).
  async ev_trueque(api, npc) {
    const { tid: id, want, offer } = npc as any;
    const who = (npc as any).name ?? 'Coleccionista';
    if (api.flag(`ev_trade_${id}`)) return api.say('Gracias por el trato. Lo cuido como si fuera mío.', { name: who });
    await api.say([`Ando buscando un ${SPECIES[want].name} desde hace meses.`, `Si tenés uno, te lo cambio por mi ${SPECIES[offer].name}. Del mismo nivel que me des.`], { name: who });
    if (!(await api.ask(`¿Hacemos el cambio? (un ${SPECIES[want].name} por un ${SPECIES[offer].name})`))) return;
    if (!(await api.tradeCreature(want, offer))) return api.say('Cuando tengas uno, volvé.', { name: who });
    api.setFlag(`ev_trade_${id}`);
    await api.say(`Trato hecho. {player} recibió a ${SPECIES[offer].name}.`);
  },

  // Rocha: a treasure hunt. Three clues in the town (folk who remember a detail each); the old man puts them together.
  async ev_pista(api, npc) {
    const n = npc.clue as number;
    if (api.flag('ev_tesoro')) return api.say(npc.after ?? 'Se ve que alguien encontró la caja. Los chicos del pueblo están felices.', { name: npc.name });
    await api.say(npc.text, { name: npc.name });
    if (!api.flag(`ev_clue${n}`)) { api.setFlag(`ev_clue${n}`); api.sfx('confirm'); }
  },
  async ev_buscatesoros(api) {
    const who = 'Buscatesoros';
    if (api.flag('ev_tesoro')) return api.say('Gracias por ayudarme a cerrar esa historia. El mar guarda las otras.', { name: who });
    const clues = [1, 2, 3].filter((i) => api.flag(`ev_clue${i}`)).length;
    if (clues === 0) return api.say(['Dicen que un marinero escondió una caja cerca de la costa hace cien años.', 'Los que saben algo andan por el pueblo. Todos recuerdan un pedacito distinto.'], { name: who });
    if (clues < 3) return api.say([`Con ${clues} dato${clues === 1 ? '' : 's'} no alcanza para cavar.`, 'Seguí preguntando por el pueblo.'], { name: who });
    await api.say(['Un faro, tres palmeras y la sombra del mediodía… ¡Todo cuadra!', '¿Vamos a cavar juntos?'], { name: who });
    api.setFlag('ev_tesoro');
    api.sfx('catch');
    await api.say('Cavamos un buen rato. La caja estaba ahí, tal cual la describieron.', { name: who });
    await api.give('ultraesfera', 3);
    await api.give('alfajor_triple', 1);
    const hi = topOf('rocha');
    const key = SPECIES.cangrejo ? 'cangrejo' : 'tuco';
    api.giveCreature(key, Math.max(5, hi - 6));
    await api.say(`Dentro había un huevo viejo que se abrió. {player} recibió a ${SPECIES[key].name}.`);
  },

  // Canelones (bug gym): the capture contest. Twenty balls, a few minutes, then the judges score the creature you keep.
  async ev_concurso(api) {
    const who = 'Organizador del concurso';
    const entered = api.contestActive?.() ?? false;
    if (api.flag('ev_concurso')) return api.say('El concurso de este año ya se juzgó. El parque queda para los paseos.', { name: who });
    const mine = api.contestCreatures();
    if (mine.length || api.flag('ev_concurso_in')) {
      // judging
      await api.say('Tiempo cumplido. Vamos a juzgar lo que trajiste.', { name: who });
      if (!mine.length) {
        api.setFlag('ev_concurso');
        return api.say('No atrapaste nada, así que no hay nada que juzgar. Gracias por participar.', { name: who });
      }
      const opts = mine.map((c) => `${c.name} Nv.${c.level} · ${contestScore(c)} pts`);
      await api.say('Elegí la criatura que presentás. Es la que te quedás; las demás vuelven al parque.', { name: who, keep: true });
      const k = await api.choose(opts, { cancel: false });
      const pick = mine[k];
      const score = contestScore(pick);
      const hi = topOf(CONTEST_CITY);
      const rivals = [['Tomás', hi * 3 + 130], ['Lucía', hi * 3 + 105], ['Don Ariel', hi * 3 + 85]] as [string, number][];
      const table = [...rivals, ['Vos', score] as [string, number]].sort((a, b) => b[1] - a[1]);
      const place = table.findIndex(([n]) => n === 'Vos') + 1;
      await api.say(['Resultados:', ...table.map(([n, p], i) => `${i + 1}.º ${n}: ${p} puntos`)], { name: who });
      api.contestFinish(pick.uid);
      api.setFlag('ev_concurso');
      api.sfx('catch');
      if (place === 1) { await api.say('¡Primer puesto!', { name: who }); await api.give('piedra_agata', 1); await api.give('ultraesfera', 2); }
      else if (place === 2) { await api.say('Segundo puesto. Muy bien.', { name: who }); await api.give('alfajor_triple', 1); await api.give('superesfera', 3); }
      else if (place === 3) { await api.say('Tercer puesto.', { name: who }); await api.give('mate_dulce', 3); }
      else { await api.say('Quedaste cuarto, pero participar suma. Una compensación.', { name: who }); await api.give('superesfera', 2); }
      return api.say(`Quedate con ${pick.name}. Fue un placer.`, { name: who });
    }
    void entered;
    await api.say(['Concurso de captura del Parque de Canelones: una sola participación.', 'Te damos 20 balls del parque y 8 minutos. Atrapá criaturas dentro del parque; al final elegís una y los jueces la puntúan.', 'Se puntúa el nivel, lo rara que es, sus características y cuánta salud conserva al atraparla.'], { name: who });
    if (!(await api.ask('¿Participás?', { name: who }))) return;
    api.setFlag('ev_concurso_in');
    api.contestStart(8, 20);
    api.sfx('confirm');
    await api.say('Suerte. Cuando suene la campana, volvé a verme.', { name: who });
    await api.warp('parque_concurso', PARK.gate.x, PARK.gate.y - 1, 'up');
  },
  async ev_concurso_salida(api) {
    if (!(await api.ask('¿Querés terminar antes? Los jueces te esperan en el pueblo.', { name: 'Guardaparque' }))) return;
    api.contestLeave();
    await api.say('Te acompaño a la salida.', { name: 'Guardaparque' });
    await api.warp(api.contestGate().map, api.contestGate().x, api.contestGate().y, 'down');
  },
};

// ---------------------------------------------------------------- riddle masters in four cities (one prize each, once)
Object.assign(EVENT_SCRIPTS, {
  async ev_adivino(api, npc) {
    const { tid, prize, qty } = npc as any;
    const who = (npc as any).name ?? 'Adivino';
    if (api.flag(`ev_adiv_${tid}`)) return api.say('Ya me ganaste mis tres acertijos. Se me acabaron los buenos.', { name: who });
    await api.say(['Hago tres preguntas y no perdono ninguna.', 'Si respondés bien las tres seguidas, hay premio. Si fallás una, empezamos de nuevo.'], { name: who });
    if (!(await api.ask('¿Te animás?', { name: who }))) return;
    const start = [...tid].reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let k = 0; k < 3; k++) {
      const [q, opts, ans] = RIDDLES[(start + k * 5) % RIDDLES.length];
      const order = opts.map((_, i) => i).sort((a, b) => ((a * 7 + k + start) % 5) - ((b * 7 + k + start) % 5));
      await api.say(`Pregunta ${k + 1}: ${q}`, { name: who, keep: true });
      const r = await api.choose(order.map((i) => opts[i]), { cancel: false });
      if (order[r] !== ans) return api.say('No es eso. Pensalo mejor y volvé a empezar.', { name: who });
      api.sfx('confirm');
    }
    api.setFlag(`ev_adiv_${tid}`);
    api.sfx('catch');
    await api.say('Las tres. Hacía años que nadie me ganaba.', { name: who });
    await api.give(prize, qty);
  },
});

// ---------------------------------------------------------------- fishing derby (Paysandú, on the river)
Object.assign(EVENT_SCRIPTS, {
  async ev_pesca(api) {
    const who = 'Juez de pesca';
    if (api.flag('ev_pesca')) return api.say('El concurso de este año ya tiene ganador: vos. Gracias por participar.', { name: who });
    if (!api.hasItem('cana_pescar') && !api.hasItem('cana_buena') && !api.hasItem('cana_super')) return api.say('Concurso de pesca del río. Hace falta una caña para anotarse.', { name: who });
    await api.say(['Concurso de pesca del Uruguay: cinco lanzadas. Cuando pique, tenés que recoger rápido; cuanto antes recojas, más pesa lo que sacás.', 'El pique no avisa mucho. Mirá bien el agua.'], { name: who });
    if (!(await api.ask('¿Te anotás?', { name: who }))) return;
    let score = 0;
    for (let i = 1; i <= 5; i++) {
      await api.say(`Lanzada ${i} de 5…`, { name: who });
      await api.wait(1300 + Math.floor(Math.random() * 2600));
      api.sfx('encounter');
      const t0 = Date.now();
      await api.ask('¡Algo tira de la línea! ¿Recogés?', { name: who });
      const ms = Date.now() - t0;
      const pts = ms <= 1500 ? 3 : ms <= 2600 ? 2 : 1;
      score += pts;
      await api.say(pts === 3 ? 'Un dorado enorme, de más de dos kilos.' : pts === 2 ? 'Un buen pejerrey.' : 'Casi se escapa. Salió una mojarra.', { name: who });
    }
    await api.say(`Puntaje final: ${score} de 15.`, { name: who });
    if (score < 6) return api.say('No alcanza para el podio. Podés anotarte de nuevo cuando quieras.', { name: who });
    api.setFlag('ev_pesca');
    api.sfx('catch');
    if (score >= 12) {
      await api.say('Primer puesto. Es un récord para el río.', { name: who });
      if (!api.hasItem('cana_super')) await api.give(api.hasItem('cana_buena') ? 'cana_super' : 'cana_buena', 1);
      await api.give('ultraesfera', 3);
    } else if (score >= 9) {
      await api.say('Segundo puesto. Una pesca muy pareja.', { name: who });
      await api.give('superesfera', 3);
      await api.give('alfajor_triple', 1);
    } else {
      await api.say('Tercer puesto. Lo importante es participar.', { name: who });
      await api.give('superesfera', 2);
    }
  },
});

// ---------------------------------------------------------------- bike race (Ciclovía de Tacuarembó)
let race: { t0: number; top: boolean } | null = null;
const secs = (ms: number) => (ms / 1000).toFixed(1).replace('.', ',');
Object.assign(EVENT_SCRIPTS, {
  async ev_carrera_juez(api) {
    const who = 'Juez de largada';
    if (api.flag('ev_carrera')) return api.say('La carrera ya la ganaste. El récord de la ciclovía sigue siendo tuyo.', { name: who });
    if (!api.hasItem('bici')) return api.say('Esto es una carrera de bicicletas. Sin bici no se larga.', { name: who });
    if (race?.top) {
      const ms = Date.now() - race.t0;
      race = null;
      await api.say(`Cronometrado: ${secs(ms)} segundos de ida y vuelta.`, { name: who });
      if (ms > 24000) return api.say('Se te fue el tiempo. El límite es de 24 segundos. Podés largar de nuevo cuando quieras.', { name: who });
      api.setFlag('ev_carrera');
      api.sfx('catch');
      if (ms <= 12500) { await api.say('Es un tiempo de campeonato. Medalla de oro.', { name: who }); await api.give('piedra_basalto', 1); await api.give('ultraesfera', 3); }
      else if (ms <= 17000) { await api.say('Muy buen tiempo. Medalla de plata.', { name: who }); await api.give('alfajor_triple', 1); await api.give('ultraesfera', 2); }
      else { await api.say('Llegaste dentro del límite. Medalla de bronce.', { name: who }); await api.give('superesfera', 3); }
      return;
    }
    await api.say(['Carrera de ida y vuelta por la Ciclovía: hasta el cronometrista del final y de regreso acá.', 'El límite son 24 segundos. Los ciclistas del camino tienen que haber quedado atrás: si te cruzan, te frenan.'], { name: who });
    if (!(await api.ask('¿Largás?', { name: who }))) return;
    race = { t0: 0, top: false };
    await api.say('Preparados… ¡Ya!', { name: who });
    race.t0 = Date.now();
  },
  async ev_carrera_meta(api) {
    const who = 'Cronometrista';
    if (api.flag('ev_carrera')) return api.say('Qué carrera. Todavía se comenta.', { name: who });
    if (!race) return api.say('Acá termina la Ciclovía. El que organiza las carreras está en la largada, al sur.', { name: who });
    const ms = Date.now() - race.t0;
    if (ms > 24000) { race = null; return api.say('Llegaste tarde: ya pasó el tiempo límite. Volvé a largar desde el sur.', { name: who }); }
    race.top = true;
    api.sfx('confirm');
    await api.say(`Marca de ida: ${secs(ms)} segundos. ¡Volvé a la largada!`, { name: who });
  },
});

// ---------------------------------------------------------------- placement
export function addCityEvents(OUTDOOR: Record<string, any>) {
  const put = (mapId: string, list: any[]) => {
    const m = OUTDOOR[mapId];
    if (!m) return;
    const taken = new Set<string>((m.npcs ?? []).map((n) => `${n.x},${n.y}`));
    fitToMap(m.tiles, list, taken);
    (m.npcs ??= []).push(...list);
  };
  put('colonia', [{ x: 20, y: 18, look: 'maestra', dir: 'down', name: 'Guía del casco histórico', script: 'ev_quiz' }]);
  put('sanjose', [{ x: 22, y: 14, look: 'gaucho', dir: 'left', name: 'Payador', script: 'ev_payada' }]);
  put('mercedes', [{ x: 18, y: 20, look: 'clerk', dir: 'down', name: 'Organizador del torneo', script: 'ev_torneo' }]);
  put('rocha', [
    { x: 14, y: 14, look: 'sailor', dir: 'right', name: 'Pescador', script: 'ev_pista', clue: 1, text: ['Mi abuelo contaba que la caja del marinero estaba a la vista del faro, pero que nadie la vio nunca de día.'] },
    { x: 24, y: 18, look: 'oldman', dir: 'left', name: 'Abuela del almacén', script: 'ev_pista', clue: 2, text: ['Tres palmeras había en la punta, decía mi madre. Hoy queda solo una, la más chica.'] },
    { x: 30, y: 12, look: 'nino', dir: 'down', name: 'Nene', script: 'ev_pista', clue: 3, text: ['A mediodía la sombra de la palmera señala hacia el mar. Mi tío dice que ahí hay que cavar.'] },
    { x: 20, y: 22, look: 'obrero', dir: 'down', name: 'Buscatesoros', script: 'ev_buscatesoros' },
  ]);
  const trade = (id, want, offer, look, name, x, y) => ({ x, y, look, dir: 'down', name, script: 'ev_trueque', tid: id, want, offer });
  put('florida', [trade('flo', 'sapo', 'lechuza', 'maestra', 'Naturalista', 30, 18)]);
  put('durazno', [trade('dur', 'tuco', 'coati', 'oldman', 'Coleccionista', 28, 16)]);
  put('melo', [trade('mel', 'garza', 'alacran', 'gaucho', 'Viajante', 34, 24)]);
  put('salto', [trade('sal', 'gaviota', 'tatadios', 'sailor', 'Marinero retirado', 26, 20)]);
  put('paysandu', [trade('pay', 'pejerrey', 'cangrejo', 'sailor', 'Pescador del puerto', 22, 26)]);
  put('canelones', [trade('can', 'oruga', 'hormiga', 'maestra', 'Entomóloga', 26, 22)]);
  put('rocha', [trade('roc', 'chimango', 'comadreja', 'gaucho', 'Paisano', 26, 14)]);
  put('tacuarembo', [trade('tac', 'oveja', 'zorrigris', 'boy', 'Peón', 28, 22)]);
  put('paysandu', [{ x: 30, y: 24, look: 'sailor', dir: 'down', name: 'Juez de pesca', script: 'ev_pesca' }]);
  const adiv = (id, prize, qty, look, name, x, y) => ({ x, y, look, dir: 'down', name, script: 'ev_adivino', tid: id, prize, qty });
  put('rivera', [adiv('riv', 'piedra_amatista', 1, 'oldman', 'Adivino de la frontera', 28, 30)]);
  put('artigas', [adiv('art', 'piedra_agata', 1, 'maestra', 'Maestra de acertijos', 26, 18)]);
  put('melo', [adiv('mel', 'ultraesfera', 3, 'gaucho', 'Cuentero', 20, 28)]);
  put('tacuarembo', [adiv('tac', 'alfajor_triple', 2, 'gaucho', 'Payador de la feria', 24, 28)]);
  put('salto', [adiv('sal', 'superesfera', 4, 'maestra', 'Guía de las termas', 30, 24)]);
  put('punta', [adiv('pun', 'ultraesfera', 2, 'sailor', 'Capitán del puerto', 30, 22)]);
  put('florida', [adiv('flo', 'piedra_agata', 1, 'oldman', 'Relojero de la plaza', 36, 22)]);
  put('minas', [adiv('min', 'piedra_basalto', 1, 'oldman', 'Sabio del cerro', 28, 28)]);
  const cic = OUTDOOR.ciclovia;
  if (cic) {
    const hh = cic.tiles.length;
    put('ciclovia', [
      { x: 9, y: hh - 5, look: 'cop', dir: 'down', name: 'Juez de largada', script: 'ev_carrera_juez' },
      { x: 9, y: 5, look: 'ciclista', dir: 'down', name: 'Cronometrista', script: 'ev_carrera_meta' },
    ]);
  }
  const t = OUTDOOR[CONTEST_CITY];
  if (t) {
    const org = { x: 20, y: 14, look: 'cop', dir: 'down', name: 'Organizador del concurso', script: 'ev_concurso' };
    put(CONTEST_CITY, [org]);
    // the gate: a free walkable tile next to the organizer
    const free = ([[0, 1], [1, 0], [-1, 0], [0, -1]] as number[][]).map(([dx, dy]) => [org.x + dx, org.y + dy]).find(([x, y]) => t.tiles[y]?.[x] && '.,=c'.includes(t.tiles[y][x]));
    t.contestGate = { x: (free ?? [org.x, org.y + 1])[0], y: (free ?? [org.x, org.y + 1])[1] };
  }
}
