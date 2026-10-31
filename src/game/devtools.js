// Developer menu (only for the unlocked owner): jump to any stop with the story done up to there, level the
// team, give items and medals, so changes can be tried without replaying the whole adventure.
import { STOPS, GYM_STOPS, badgeOf, openFlag, stopBand } from '../data/route.js';
import { OUTDOOR } from '../data/maps.js';
import { teamOf } from '../data/map-gen.js';
import { fitSpecies } from '../data/levels.js';
import { createCreature, heal, expForLevel } from './creature.js';
import { state, addItem, earn, markCaught, PARTY_MAX } from './state.js';
import { choose, toast } from './ui.js';

const NAME = (st) => `${st.kind === 'city' ? '' : '· '}${st.name}`;

/** Where to put the player in a stop's map: below the Policlínica door, else below the shop door, else any road. */
function spawnOf(id) {
  const m = OUTDOOR[id];
  for (const pat of ['IIDII', 'ttDtt']) {
    for (let y = 0; y < m.tiles.length; y++) {
      const x = m.tiles[y].indexOf(pat);
      if (x >= 0) return { id, name: m.name, x: x + 2, y: y + 1 };
    }
  }
  for (let y = 0; y < m.tiles.length; y++) {
    const x = [...m.tiles[y]].findIndex((c) => c === 'c' || c === '=');
    if (x >= 0) return { id, name: m.name, x, y };
  }
  return { id, name: m.name, x: 2, y: 2 };
}

/** Sets flags and items as if the story up to (not including) stop `k` had been played. */
function progressTo(k) {
  const S = state();
  const set = (...flags) => flags.forEach((f) => { S.flags[f] = true; });
  const give = (key) => { S.bag[key] = 1; };
  set('met_prof', 'has_starter', 'dex_quest', 'got_carta', 'dex', 'rival1', 'got_mapa', 'got_cana');
  give('uru_dex'); give('mapa_uruguay');
  S.bag.esfera = Math.max(S.bag.esfera ?? 0, 20);
  const passed = (id) => STOPS.findIndex((s) => s.id === id) < k;
  STOPS.forEach((st, j) => {
    if (j >= k) return;
    set(openFlag(st.id), `v_${st.id}`);
    if (st.gym) set(badgeOf(st.id));
  });
  set(`v_${STOPS[k].id}`);
  if (passed('palmitas')) set('marta_help');
  if (passed('fraybentos')) set('anglo_pp');
  if (passed('fraybentos')) { set('got_ticket', 'ferry_done', 'got_machete'); give('machete'); }
  if (passed('salto')) set('represa_clear');
  if (passed('artigas')) { set('got_canoa'); give('canoa'); }
  if (passed('rivera')) set('torre_clear');
  if (passed('tacuarembo')) { set('got_guantes'); give('guantes'); }
  if (passed('quebrada')) set('quebrada_clear');
  if (passed('paloma')) { set('cabo_clear', 'lamp_returned', 'got_farol'); give('farol'); }
  if (passed('piriapolis')) set('obs_clear');
  if (passed('minas')) set('pp_clear');
  if (passed('florida')) { set('got_vuelo'); give('silbato'); }
}

/** A full team of 6 around `lv`, built on the player's starter line. */
function buildTeam(lv) {
  const S = state();
  const starter = ['ceibito', 'tejuchispa', 'carpinchito'].find((k) => S.flags[`starter_${k}`]) ?? 'tejuchispa';
  S.flags[`starter_${starter}`] = true; S.flags.starter_key = true;
  const picks = [[starter, lv]];
  [['agua', 'volador'], ['electrico', 'psiquico'], ['planta', 'tierra'], ['lucha', 'roca'], ['siniestro', 'bicho']]
    .forEach((types, i) => picks.push(teamOf(types, [lv], `dev${lv}${i}`)[0]));
  S.party = picks.slice(0, PARTY_MAX).map(([sp, l]) => { const c = createCreature(fitSpecies(sp, l), l); markCaught(c.species); return c; });
}

function levelTeam(lv) {
  const S = state();
  for (const c of S.party) { c.level = lv; c.exp = expForLevel(lv); heal(c); }
}

async function pickStop(title) {
  const i = await choose(STOPS.map(NAME), { title });
  return i < 0 ? null : i;
}

/** Returns a warp point (like the Silbato) when the player should be moved, else null. */
export async function openDevMenu() {
  const S = state();
  while (true) {
    const i = await choose([
      'Ir a una ciudad con la historia hecha',
      'Ir a una ciudad (solo moverme)',
      'Subir el equipo de nivel',
      'Curar el equipo',
      'Dinero y objetos',
      'Todas las medallas y Liga abierta',
      'Volver',
    ], { title: 'Desarrollo', cls: 'menu-sub' });
    if (i < 0 || i === 6) return null;
    if (i === 0) {
      const k = await pickStop('Historia hecha hasta…');
      if (k === null) continue;
      progressTo(k);
      buildTeam(stopBand(k)[1]);
      const pt = spawnOf(STOPS[k].id);
      S.lastHeal = { map: pt.id, x: pt.x, y: pt.y };
      toast(`Listo: ${STOPS[k].name}, equipo nivel ${stopBand(k)[1]}`);
      return pt;
    }
    if (i === 1) {
      const k = await pickStop('Ir a…');
      if (k === null) continue;
      S.flags[`v_${STOPS[k].id}`] = true;
      return spawnOf(STOPS[k].id);
    }
    if (i === 2) {
      const lvls = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70];
      const j = await choose(lvls.map((n) => `Nivel ${n}`), { title: 'Nivel del equipo', cls: 'menu-sub' });
      if (j < 0) continue;
      if (!S.party.length) buildTeam(lvls[j]); else levelTeam(lvls[j]);
      toast(`Equipo en nivel ${lvls[j]}`);
    }
    if (i === 3) { for (const c of S.party) heal(c); toast('Equipo curado'); }
    if (i === 4) {
      earn(50000);
      for (const [k, q] of [['esfera', 30], ['superesfera', 30], ['ultraesfera', 30], ['mate', 15], ['mate_dulce', 15], ['alfajor', 10], ['aloe', 10]]) addItem(k, q);
      toast('+$50000 y objetos');
    }
    if (i === 5) {
      progressTo(STOPS.length - 1);
      for (const st of GYM_STOPS) S.flags[badgeOf(st.id)] = true;
      S.flags.anglo_clear = true;
      toast('12 medallas, Liga abierta');
    }
  }
}
