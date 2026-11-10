// Fiesta de la Patria Gaucha (Tacuarembó). It starts the first time the player walks into the town and lasts two days
// of the in-game clock (48 in-game hours of play, about 36 real minutes). While it lasts, the open field north-east of
// the town turns into the fair ground: flags, stalls, a stage, fires, the sortija arch and the jineteada corral, with
// folk and horses. Three games give prizes (never MTs nor held items): the sortija (timing), the jineteada (balance)
// and the taba (luck). When the second day ends everything is packed up for good.
// State: S.fiesta = { t0 } (playtime in seconds when it started). Flags use the `ev_fg_` prefix.
import { state } from '../game/state.ts';
import { MS_PER_HOUR } from '../gfx/screen.ts';
import { fitToMap } from './map-gen.ts';
import { SPECIES } from './species.ts';

export const FIESTA_MAP = 'tacuarembo';
export const FIESTA_NAME = 'Fiesta de la Patria Gaucha';
const HOURS = 48;
const GIFT = 'criollo';
const GIFT_LEVEL = 5;

/** In-game hours since the fiesta started, or null before it starts. */
function hoursIn(): number | null {
  const f = state()?.fiesta;
  if (!f) return null;
  return ((state().stats.playtime - f.t0) * 1000) / MS_PER_HOUR;
}
/** 'antes' (the player has not arrived yet), 1 or 2 (the day of the fiesta), or 'fin'. */
export function fiestaDay(): 'antes' | 1 | 2 | 'fin' {
  const h = hoursIn();
  if (h == null) return 'antes';
  if (h >= HOURS) return 'fin';
  return h < 24 ? 1 : 2;
}
/** The fair ground is up until the second day is over (it is already there when the player first arrives). */
export const fiestaUp = () => fiestaDay() !== 'fin';
/** Text for the banner when walking into town during the fiesta. */
export function fiestaBanner(): string | null {
  const d = fiestaDay();
  if (d === 1 || d === 2) return `${FIESTA_NAME} · día ${d} de 2`;
  return null;
}
const hoursLeft = () => Math.max(0, Math.ceil(HOURS - (hoursIn() ?? 0)));
const dayFlag = (game: string) => `ev_fg_${game}_d${fiestaDay() === 2 ? 2 : 1}`;

// ---------------------------------------------------------------- scripts
export const FIESTA_SCRIPTS: Record<string, (api: any, npc?: any) => Promise<void>> = {
  // First step in Tacuarembó: the crier of the fiesta committee walks up to the player and tells what is going on.
  async fg_intro(api) {
    const who = 'Pregonero de la comisión';
    if (!state().fiesta) state().fiesta = { t0: state().stats.playtime };
    await api.npcApproach('fg_pregonero', 9);
    api.setFlag('ev_fg_intro');
    await api.say([
      `¡Llegaste justo! Hoy arranca la ${FIESTA_NAME}: dos días de fiesta en el predio del norte del pueblo.`,
      'Hay sortija, jineteada y taba, con premios para los que se animen. También hay música, fogones y tortas fritas.',
      'Cuando se termine el segundo día levantamos todo, así que no te duermas.',
    ], { name: who });
    await api.npcWalkOff('fg_pregonero', 12);
  },

  // The committee's table at the entrance of the fair ground.
  async fg_comision(api) {
    const who = 'Comisión de la fiesta';
    const d = fiestaDay();
    const h = hoursLeft();
    await api.say([
      `Bienvenido a la ${FIESTA_NAME}. Estamos en el día ${d === 2 ? 2 : 1} de 2; quedan unas ${h} horas de fiesta.`,
      'La sortija y la taba se juegan cada día. La jineteada da su premio mayor una sola vez.',
    ], { name: who });
  },

  // La sortija: three passes under the arch. All three rings: a Garrapiñada (once per day of fiesta).
  async fg_sortija(api, npc) {
    const who = npc?.name ?? 'Juez de la sortija';
    const f = dayFlag('sortija');
    if (api.flag(f)) return api.say(['Hoy ya te llevaste tu garrapiñada. Si mañana sigue la fiesta, volvé a correr.'], { name: who });
    await api.say(['La sortija: pasás al galope bajo el arco y tenés que enganchar la argolla con la vara.', 'Son tres pasadas, cada una más rápida. Si sacás las tres, la garrapiñada es tuya.'], { name: who });
    if (!(await api.ask('¿Corrés la sortija?', { name: who }))) return;
    const hits = await api.sortija();
    if (hits === 3) {
      api.setFlag(f);
      api.sfx('catch');
      await api.say('¡Las tres argollas! Hacía rato que no se veía una carrera así.', { name: who });
      await api.give('garrapinada', 1);
    } else if (hits > 0) {
      await api.say(`Sacaste ${hits} de 3. Para la garrapiñada hacen falta las tres. Podés volver a correr cuando quieras.`, { name: who });
    } else {
      await api.say('No enganchaste ninguna. Mirá la argolla, no al caballo. Podés volver a correr.', { name: who });
    }
  },

  // La jineteada: hold on to the colt until the bell. The first win gives a young Criollo; a later day, a Torta Frita.
  async fg_jineteada(api, npc) {
    const who = npc?.name ?? 'Juez de la jineteada';
    const won = api.flag('ev_fg_jinete');
    const f = dayFlag('jinete');
    if (won && api.flag(f)) return api.say('Por hoy ya fue suficiente. El potro también tiene que descansar.', { name: who });
    await api.say(won
      ? ['Volviste a la jineteada. El premio mayor ya es tuyo, pero el que aguanta se lleva una torta frita.']
      : ['La jineteada: subís al potro y tenés que aguantar arriba hasta que suene la campana.', 'El potro te va a tirar para un lado y para el otro: compensá con izquierda y derecha.', `Al que aguanta, la tropilla le regala un potrillo ${SPECIES[GIFT].name} criado acá.`], { name: who });
    if (!(await api.ask('¿Te subís?', { name: who }))) return;
    const ok = await api.jineteada(8);
    if (!ok) return api.say('Al suelo. Le pasa a los mejores. Sacudite el polvo y probá de nuevo cuando quieras.', { name: who });
    api.setFlag(f);
    api.sfx('catch');
    if (!won) {
      api.setFlag('ev_fg_jinete');
      await api.say('¡Aguantó hasta la campana! La tropilla cumple su palabra.', { name: who });
      api.giveCreature(GIFT, GIFT_LEVEL);
      await api.say(`{player} recibió a ${SPECIES[GIFT].name} (Nv. ${GIFT_LEVEL}).`);
    } else {
      await api.say('¡Otra vez arriba hasta el final! Tomá, te la ganaste.', { name: who });
      await api.give('torta_frita', 1);
    }
  },

  // La taba: $200 a throw. "Suerte" wins a prize, "culo" loses; at most three prizes a day.
  async fg_taba(api, npc) {
    const who = npc?.name ?? 'Tabero';
    const COST = 200;
    const won = () => [1, 2, 3].filter((i) => api.flag(`${dayFlag('taba')}_${i}`)).length;
    if (won() >= 3) return api.say('Ya te llevaste tres premios hoy. Dejá algo para los demás.', { name: who });
    await api.say(['La taba: la tirás al hoyo y, si cae de suerte, ganás. Si cae de culo, perdés.', `Cada tirada cuesta $${COST}. Premios: torta frita o alfajor.`], { name: who });
    for (;;) {
      if (won() >= 3) return api.say('Tres premios en un día. La taba te quiere.', { name: who });
      if (!(await api.ask(`¿Tirás? ($${COST})`, { name: who }))) return;
      if (!api.pay(COST)) return api.say('No te alcanza la plata para la tirada.', { name: who });
      api.sfx('throw');
      const r = Math.random();
      if (r < 0.4) {
        api.sfx('confirm');
        api.setFlag(`${dayFlag('taba')}_${won() + 1}`);
        const prize = Math.random() < 0.7 ? 'torta_frita' : 'alfajor';
        await api.say('¡Suerte! La taba cayó parada del lado bueno.', { name: who });
        await api.give(prize, 1);
      } else if (r < 0.85) {
        await api.say('Culo. Cayó del lado malo.', { name: who });
      } else {
        await api.say('Cayó de costado: no vale. Te devuelvo la plata.', { name: who });
        api.refund(COST);
      }
    }
  },

  // Folk of the fiesta: two lines, one for each day.
  async fg_folk(api, npc) {
    const lines = fiestaDay() === 2 && npc.text2 ? npc.text2 : npc.text;
    await api.say(lines, { name: npc.name });
  },
};

// ---------------------------------------------------------------- the fair ground
// '.' keeps the ground. Banderines (ϐ) with poles (ϑ), stalls (ϒ ϓ), stage (ϔ), sortija arch (ϕ ϖ Ϸ), fires (П),
// a cart (ב), hay bales (א) and firewood (τ). The ground is 26 x 8 tiles.
const GROUND = [
  'ϑϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϑ',
  '..........................',
  '.ϒϒ..ϓϒ.....ϔϔϔϔ.....П..ב.',
  '..........................',
  '..........................',
  '.ϕϖϷ......א.......τП..ϓϒ..',
  '..........................',
  'ϑϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϐϑ',
];
const GW = GROUND[0].length, GH = GROUND.length;

/** The open field that fits the fair ground best: fewest tiles that are not plain grass, nearest to the north-east. */
function findGround(tiles: string[]) {
  const H = tiles.length, W = tiles[0].length;
  let best = null as null | { x: number; y: number; bad: number; d: number };
  for (let y = 1; y + GH < H - 1; y++) for (let x = 1; x + GW < W - 1; x++) {
    let bad = 0;
    for (let dy = 0; dy < GH && (!best || bad <= best.bad); dy++) for (let dx = 0; dx < GW; dx++) if (tiles[y + dy][x + dx] !== '.') bad++;
    const d = (W - x) + y;
    if (!best || bad < best.bad || (bad === best.bad && d < best.d)) best = { x, y, bad, d };
  }
  return best;
}

export function addFiesta(OUTDOOR: Record<string, any>) {
  const m = OUTDOOR[FIESTA_MAP];
  if (!m) return;
  const g = findGround(m.tiles);
  if (!g) return;
  const { x: ox, y: oy } = g;
  // decorations: only on plain grass, and only while the fiesta lasts (applied by the world when the map loads)
  m.condTiles ??= [];
  GROUND.forEach((row, dy) => [...row].forEach((ch, dx) => {
    if (ch !== '.' && m.tiles[oy + dy]?.[ox + dx] === '.') m.condTiles.push({ x: ox + dx, y: oy + dy, ch, cond: fiestaUp });
  }));
  m.enterNote = fiestaBanner;
  const up = () => fiestaUp();
  const folk = (x, y, look, name, text, text2 = null, extra = {}) => ({ x: ox + x, y: oy + y, look, dir: 'down', name, script: 'fg_folk', text, text2, cond: up, ...extra });
  const list: any[] = [
    { x: ox, y: oy + 3, look: 'clerk', dir: 'right', name: 'Comisión de la fiesta', script: 'fg_comision', cond: up },
    { x: ox, y: oy + 5, look: 'gaucho', dir: 'right', name: 'Juez de la sortija', script: 'fg_sortija', cond: up },
    { x: ox + 2, y: oy + 6, look: 'animal:criollo', dir: 'right', cond: up },
    { x: ox + 9, y: oy + 3, look: 'oldman', dir: 'down', name: 'Tabero', script: 'fg_taba', cond: up },
    { x: ox + 18, y: oy + 4, look: 'gaucho', dir: 'down', name: 'Juez de la jineteada', script: 'fg_jineteada', cond: up },
    { x: ox + 17, y: oy + 6, look: 'animal:criollo', dir: 'left', cond: up },
    { x: ox + 19, y: oy + 6, look: 'animal:criollo', dir: 'right', wander: true, cond: up },
    folk(13, 1, 'gaucho', 'Payador del tablado', ['Esta noche hay payada de contrapunto en el tablado. El que pierde el verso paga el asado.'], ['Ayer canté hasta que se hizo de día. Hoy la voz me sale a medias, pero sale.']),
    folk(14, 1, 'murguero', 'Guitarrero', ['Afino la guitarra para la milonga de la noche. Una cuerda nueva y ya está.'], ['Segundo día de fiesta: las cuerdas ya saben solas lo que hay que tocar.']),
    folk(3, 3, 'artesana', 'Artesana', ['Tejo ponchos y fajas en el telar. Para la fiesta traje los colores de siempre: celeste, blanco y un poco de rojo.'], ['Quedan pocas fajas. La gente del interior compra temprano.']),
    folk(6, 3, 'cocinero', 'Vendedor de tortas fritas', ['Tortas fritas recién hechas. Acá no se venden: el que gana en la taba se lleva una.'], ['La masa la hacemos a la madrugada. Ayer se acabaron antes de la medianoche.']),
    folk(21, 3, 'campesina', 'Asadora', ['Hay costillar al fuego desde el mediodía. A la noche se arma la ronda alrededor del fogón.'], ['Último día de fogón. El humo se ve desde la ruta.']),
    folk(24, 3, 'nino', 'Nene', ['¡Mirá los caballos! Cuando sea grande quiero correr la sortija.'], ['Ayer vi a uno que aguantó toda la jineteada. ¡Fue increíble!'], { wander: true }),
    folk(11, 6, 'abuela', 'Abuela', ['Vengo a la Patria Gaucha desde que era chica. Antes se venía a caballo desde las estancias.'], ['Mañana ya no queda nada de esto. Hay que aprovechar.']),
    folk(23, 6, 'hincha', 'Paisano', ['Las fogatas, los caballos, la guitarra... Para mí es la mejor fiesta del año.'], ['Estoy juntando fuerzas para la última noche.'], { wander: true }),
    // the crier only walks in for the welcome and leaves
    { x: ox, y: oy + 4, look: 'cop', dir: 'down', id: 'fg_pregonero', name: 'Pregonero de la comisión', cond: (f) => !f.ev_fg_intro, arrive: true },
  ];
  const taken = new Set<string>([...(m.npcs ?? []).map((o) => `${o.x},${o.y}`), ...m.condTiles.map((t) => `${t.x},${t.y}`)]);
  fitToMap(m.tiles, list, taken);
  (m.npcs ??= []).push(...list);
  // the welcome: anywhere in town, the first step
  (m.triggers ??= []).push({ x: 0, y: 0, w: m.tiles[0].length, h: m.tiles.length, script: 'fg_intro', cond: (f) => !f.ev_fg_intro });
}
