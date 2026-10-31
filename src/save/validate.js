// Rule-based save validation. Rejects values the game could never produce,
// whatever the signature says. The same rules are mirrored server-side in
// supabase/ so the server can be the final authority later.
import { badgeOf } from '../data/route.js';
import { SPECIES, MIN_LEVEL, STARTERS } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS, MAX_STACK, MAX_FICHAS } from '../data/items.js';
import { MAPS } from '../data/maps.js';
import { LOOKS } from '../gfx/characters.js';
import { expForLevel, calcStats, legalMoves, MAX_LEVEL } from '../game/creature.js';
import { sanitizeName } from '../core/util.js';
import { MAX_MONEY, PARTY_MAX } from '../game/state.js';

const STATUSES = new Set([null, 'brn', 'psn', 'par', 'slp']);
const LINES = {
  ceibito: ['ceibito', 'ceibal', 'ceibarbol'],
  tejuchispa: ['tejuchispa', 'tejubrasa', 'tejufogon'],
  carpinchito: ['carpinchito', 'carpincho', 'carpinchon'],
};
const STORY_FLAGS = new Set([
  'has_starter', 'starter_key', 'starter_ceibito', 'starter_tejuchispa', 'starter_carpinchito', 'met_prof', 'dex', 'dex_quest', 'got_carta', 'rival1', 'rival2', 'rival3', 'rival4',
  'badge1', 'badge2', 'badge3', 'badge4', 'badge5', 'badge6', 'badge7', 'badge8', 'badge9', 'badge10', 'badge11', 'badge12', 'cabo_clear', 'lamp_returned', 'quebrada_clear', 'champion', 'got_map_gift', 'gift_r1', 'gift_garr',
  'anima_clear', 'fog1', 'fog2', 'fog3', 'caught_pamperon', 'caught_ballenaplata', 'caught_soldemayo', 'caught_yaguarete', 'caught_ombu',
  'got_mapa', 'got_cana', 'got_vuelo', 'got_guantes', 'got_farol', 'got_cana2', 'got_cana3', 'got_machete', 'got_canoa', 'pp_clear', 'gift_ros', 'gift_pir', 'gift_pal', 'gift_min', 'gift_dur',
  'rival5', 'rival6', 'torre_clear', 'represa_clear', 'anglo_pp', 'anglo_clear', 'elite1', 'elite2', 'elite3', 'elite4',
  'obs_clear', 'obs_log', 'got_bici', 'ciclo_done', 'got_ticket', 'ferry_done', 'marta_help', 'parrilla_clear', 'aduana_clear', 'radio_clear', 'muelle_clear', 'ferry_bio', 'gift_tac', 'gift_riv', 'gift_sal', 'gift_pay', 'gift_frb',
]);
const FLAG_PATTERN = /^(tr|it|v|cl|rm[1-9]|open)_[a-z0-9_]{1,40}$/;

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function validateCreature(c, errors, where) {
  const e = (m) => errors.push(`${where}: ${m}`);
  if (!c || typeof c !== 'object') return e('no es un objeto'), null;
  const sp = SPECIES[c.species];
  if (!sp) return e(`especie desconocida "${c.species}"`), null;
  if (!isInt(c.level, 1, MAX_LEVEL)) e('nivel fuera de rango');
  if (c.level < MIN_LEVEL[c.species]) e(`${sp.name} no puede existir con nivel ${c.level}`);
  const lo = expForLevel(c.level);
  const hi = c.level >= MAX_LEVEL ? lo : expForLevel(c.level + 1) - 1;
  if (!isInt(c.exp, lo, hi)) e('EXP no coincide con el nivel');
  if (!Array.isArray(c.ivs) || c.ivs.length !== 6 || !c.ivs.every((v) => isInt(v, 0, 15))) e('IVs inválidos');
  if (!STATUSES.has(c.status ?? null)) e('estado inválido');
  if (!Array.isArray(c.moves) || c.moves.length < 1 || c.moves.length > 4) e('cantidad de movimientos inválida');
  else {
    const legal = legalMoves(c.species, c.level);
    const seen = new Set();
    for (const m of c.moves) {
      if (!MOVES[m?.id]) { e(`movimiento desconocido "${m?.id}"`); continue; }
      if (!legal.has(m.id)) e(`${sp.name} no puede saber ${MOVES[m.id].name} al nivel ${c.level}`);
      if (seen.has(m.id)) e('movimiento repetido');
      seen.add(m.id);
      if (!isInt(m.pp, 0, MOVES[m.id].pp)) e(`PP inválidos en ${MOVES[m.id].name}`);
    }
  }
  if (typeof c.uid !== 'string' || c.uid.length > 40) e('uid inválido');
  if (errors.length) return null;
  const max = calcStats(c).hp;
  if (!isInt(c.hp, 0, max)) e('PS fuera de rango');
  return {
    uid: c.uid,
    species: c.species,
    nickname: c.nickname ? sanitizeName(c.nickname, null) : null,
    level: c.level,
    exp: c.exp,
    ivs: [...c.ivs],
    hp: c.hp,
    status: c.status ?? null,
    moves: c.moves.map((m) => ({ id: m.id, pp: m.pp })),
    ot: Number.isInteger(c.ot) ? c.ot : null,
  };
}

/** Returns { ok, errors, data } where data is a rebuilt clean copy. */
export function validateSave(d) {
  const errors = [];
  const e = (m) => errors.push(m);
  if (!d || typeof d !== 'object') return { ok: false, errors: ['datos vacíos'] };
  if (d.version !== 1) e('versión de partida desconocida');
  const p = d.player ?? {};
  if (!LOOKS[p.look] || !String(p.look).startsWith('player_')) e('apariencia inválida');
  if (!isInt(p.id, 10000, 99999)) e('ID de entrenador inválido');
  if (!isInt(p.money, 0, MAX_MONEY)) e('dinero fuera de rango');
  const st = d.stats ?? {};
  for (const k of ['playtime', 'steps', 'battlesWon', 'moneyEarned', 'moneySpent', 'caught']) if (!(Number.isFinite(st[k]) && st[k] >= 0)) e(`estadística "${k}" inválida`);
  // Money ledger: you can't hold more than you started with + earned - spent.
  if (p.money > 3000 + (st.moneyEarned ?? 0) - (st.moneySpent ?? 0)) e('el dinero no cuadra con lo ganado y gastado');
  if ((st.moneyEarned ?? 0) > ((st.battlesWon ?? 0) + 2) * 13000) e('dinero ganado imposible para las batallas jugadas');

  // Flags
  const flags = {};
  for (const [k, v] of Object.entries(d.flags ?? {})) {
    if (v !== true) continue;
    if (!STORY_FLAGS.has(k) && !FLAG_PATTERN.test(k)) { e(`marca desconocida "${k}"`); continue; }
    flags[k] = true;
  }
  // Story order: every medal needs the previous one, and each PP hideout needs its medal.
  for (let i = 2; i <= 12; i++) if (flags[`badge${i}`] && !flags[`badge${i - 1}`]) e('medallas fuera de orden');
  const needs = [
    ['anglo_pp', badgeOf('fraybentos'), 'el Frigorífico Anglo'],
    ['represa_clear', badgeOf('salto'), 'la Represa'],
    ['torre_clear', badgeOf('rivera'), 'la Torre de Niebla'],
    ['quebrada_clear', badgeOf('quebrada'), 'la Quebrada de los Cuervos'],
    ['cabo_clear', badgeOf('quebrada'), 'el faro de Cabo Polonio'],
    ['obs_clear', 'quebrada_clear', 'el Observatorio'],
    ['pp_clear', badgeOf('punta'), 'la fábrica de Minas'],
    ['anglo_clear', 'badge12', 'Dr. Díaz'],
  ];
  for (const [flag, req, what] of needs) if (flags[flag] && !flags[req]) e(`${what} no pudo haberse completado`);
  if (flags.pp_clear && !flags.quebrada_clear) e('la fábrica de Minas no pudo haberse completado');
  if (flags.anglo_clear && !flags.pp_clear) e('Dr. Díaz no pudo haberse vencido antes que Garúa');
  for (let i = 2; i <= 4; i++) if (flags[`elite${i}`] && !flags[`elite${i - 1}`]) e('Alto Mando fuera de orden');
  if (flags.elite1 && !(flags.badge12 && flags.anglo_clear)) e('Alto Mando sin las doce medallas');
  if (flags.champion && !(flags.badge12 && flags.anglo_clear && flags.elite4 && flags.rival4)) e('campeón sin completar la Liga');

  // Position
  const pos = d.pos ?? {};
  const map = MAPS[pos.map];
  if (!map) e('mapa desconocido');
  else if (!isInt(pos.x, 0, map.tiles[0].length - 1) || !isInt(pos.y, 0, map.tiles.length - 1)) e('posición fuera del mapa');
  if (!['up', 'down', 'left', 'right'].includes(pos.dir)) e('dirección inválida');
  const lh = d.lastHeal ?? {};
  if (!MAPS[lh.map]) e('punto de cura inválido');

  // Creatures
  const party = [];
  const box = [];
  if (!Array.isArray(d.party) || d.party.length > PARTY_MAX) e('equipo inválido');
  else d.party.forEach((c, i) => { const v = validateCreature(c, errors, `Equipo #${i + 1}`); if (v) party.push(v); });
  if (!Array.isArray(d.box) || d.box.length > 500) e('caja inválida');
  else d.box.forEach((c, i) => { const v = validateCreature(c, errors, `Caja #${i + 1}`); if (v) box.push(v); });
  const all = [...party, ...box];
  if (flags.has_starter && party.length === 0) e('equipo vacío');
  const uids = new Set(all.map((c) => c.uid));
  if (uids.size !== all.length) e('criaturas duplicadas');
  // Starters cannot be found in the wild: at most one line, matching the choice.
  const starterLines = all.filter((c) => Object.values(LINES).flat().includes(c.species));
  const chosen = STARTERS.find((s) => flags[`starter_${s}`]);
  if (starterLines.length > 1) e('más de un inicial');
  if (starterLines.length === 1 && (!chosen || !LINES[chosen].includes(starterLines[0].species))) e('inicial no coincide con el elegido');
  // Legendaries: only after becoming champion, at most one each.
  for (const leg of ['pamperon', 'ballenaplata', 'soldemayo', 'yaguarete', 'ombu']) {
    const n = all.filter((c) => c.species === leg).length;
    if (n > 1 || (n === 1 && !(flags.champion && flags[`caught_${leg}`]))) e(`${SPECIES[leg].name} no se pudo haber atrapado`);
  }

  // Bag
  const bag = {};
  for (const [k, q] of Object.entries(d.bag ?? {})) {
    const it = ITEMS[k];
    if (!it) { e(`objeto desconocido "${k}"`); continue; }
    const max = it.pocket === 'key' ? 1 : k === 'ficha' ? MAX_FICHAS : MAX_STACK;
    if (!isInt(q, 1, max)) { e(`cantidad inválida de ${it.name}`); continue; }
    bag[k] = q;
  }
  if (bag.lampara && !(flags.cabo_clear && !flags.lamp_returned)) e('Lámpara del Faro imposible');
  if (bag.esfera_celeste) e('Pokeball Celeste no se puede obtener');
  if (bag.mapa_uruguay && !flags.got_mapa) e('Mapa de Uruguay sin haberlo recibido');
  if (bag.cana_pescar && !flags.got_cana) e('Caña Vieja sin haberla recibido');
  if (bag.cana_buena && !flags.got_cana2) e('Caña Buena sin haberla recibido');
  if (bag.cana_super && !flags.got_cana3) e('Súper Caña sin haberla recibido');
  if (bag.carta_tabarez && !(flags.got_carta && !flags.dex)) e('Carta de Tabárez imposible');
  if (bag.machete && !flags.got_machete) e('Machete sin haberlo recibido');
  if (bag.ticket_ferry && !(flags.got_ticket && !flags.ferry_done)) e('Ticket del Buquebus imposible');
  if (flags.ferry_done && !flags.got_ticket) e('el Buquebus no pudo haber zarpado');
  if (flags.got_machete && !flags.ferry_done) e('el Machete lo entrega el capitán del Buquebus');
  if (bag.bici && !flags.got_bici) e('Bicicleta sin haberla recibido');
  if (bag.guantes && !flags.got_guantes) e('Guantes sin haberlos recibido');
  if (bag.farol && !flags.got_farol) e('Farol sin haberlo recibido');
  if (bag.canoa && !flags.got_canoa) e('Canoa sin haberla recibido');
  if (!(d.safari && Number.isFinite(d.safari.until))) { delete bag.safari_ball; delete bag.cebo; }
  if (bag.silbato && !flags.got_vuelo) e('Silbato del Hornero sin haberlo recibido');

  // Dex
  const seen = (d.dex?.seen ?? []).filter((k) => SPECIES[k]);
  const caught = (d.dex?.caught ?? []).filter((k) => SPECIES[k]);
  if (seen.length !== (d.dex?.seen ?? []).length || caught.length !== (d.dex?.caught ?? []).length) e('PokeDex con especies desconocidas');
  if (!caught.every((k) => seen.includes(k))) e('PokeDex inconsistente');
  for (const c of all) if (!caught.includes(c.species)) e(`${SPECIES[c.species].name} no figura como atrapado en la PokeDex`);

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    errors,
    data: {
      version: 1,
      player: { name: sanitizeName(p.name), look: p.look, id: p.id, money: p.money },
      rivalName: sanitizeName(d.rivalName, 'Facu'),
      pos: { map: pos.map, x: pos.x, y: pos.y, dir: pos.dir },
      party,
      box,
      bag,
      flags,
      dex: { seen: [...new Set(seen)], caught: [...new Set(caught)] },
      stats: { playtime: st.playtime, steps: st.steps, battlesWon: st.battlesWon, moneyEarned: st.moneyEarned, moneySpent: st.moneySpent, caught: st.caught },
      lastHeal: { map: lh.map, x: lh.x | 0, y: lh.y | 0 },
      repel: isInt(d.repel, 0, 100) ? d.repel : 0,
      safari: d.safari && Number.isFinite(d.safari.until) && d.safari.until <= Date.now() + 30 * 60000 ? { until: Math.floor(d.safari.until) } : null,
      daycare: d.daycare && box.some((c) => c.uid === d.daycare.uid) && isInt(d.daycare.steps, 0, st.steps) ? { uid: d.daycare.uid, steps: d.daycare.steps } : null,
      created: Number.isFinite(d.created) ? d.created : Date.now(),
      saveCount: isInt(d.saveCount, 0, 1e7) ? d.saveCount : 0,
      battleLog: Array.isArray(d.battleLog) ? d.battleLog.slice(-20) : [],
    },
  };
}
