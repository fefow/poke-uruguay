import { rivalTeamFor, LEADERS, ELITES, CHAMPION } from '../src/data/story.js';

// What a normal player (no grinding) roughly has at each story beat:
// the starter (evolved when due) plus a couple of caught creatures a few levels behind.
const LINES = {
  ceibito: ['ceibito', 'ceibal', 'ceibarbol'],
  tejuchispa: ['tejuchispa', 'tejubrasa', 'tejufogon'],
  carpinchito: ['carpinchito', 'carpincho', 'carpinchon'],
};
const stage = (key, lv) => LINES[key][lv >= 30 ? 2 : lv >= 14 ? 1 : 0];
const team = (key, lv, extra) => [[stage(key, lv), lv], ...extra.map(([sp, d]) => [sp, lv - d])];

// Later in the game the player's bench is made of evolved creatures a few levels behind the lead.
const BENCH = [['albatros', 3], ['yacaron', 3], ['capitan', 3], ['tucoterra', 3], ['venadalto', 4]];

export function SCRIPTS_FOR_TEST(rate) {
  for (const key of Object.keys(LINES)) {
    console.log(`\n== starter ${key}`);
    for (const lv of [5, 6]) rate(`rival 1 | starter lvl ${lv}`, [[key, lv]], rivalTeamFor(key, 0), 'basic');
    for (const lv of [12, 13, 14]) rate(`rival 2 | lead ${lv} +2 mons`, team(key, lv, [['teruterito', 3], ['zorrigris', 4]]), rivalTeamFor(key, 1), 'basic');
    for (const lv of [12, 14, 16]) rate(`gym 1 UTE | lead ${lv} +2 mons`, team(key, lv, [['teruterito', 2], ['zorrigris', 3]]), LEADERS.ute.team, 'smart');
    for (const lv of [22, 24, 26]) rate(`gym 2 OSE | lead ${lv} +2 mons`, team(key, lv, [['teruterazo', 3], ['zorromonte', 3]]), LEADERS.ose.team, 'smart');
    for (const lv of [24, 26, 28]) rate(`rival 3 | lead ${lv} +2 mons`, team(key, lv, [['teruterazo', 3], ['zorromonte', 3]]), rivalTeamFor(key, 2), 'smart');
    for (const lv of [29, 31, 33]) rate(`gym 3 Lavalleja | lead ${lv} +3 mons`, team(key, lv, [['teruterazo', 3], ['zorromonte', 3], ['butiazal', 4]]), LEADERS.lavalleja.team, 'smart');
    // lead 3 below, 1 below and 1 above the foe's strongest creature
    const later = (label, foe) => { const ace = Math.max(...foe.map(([, l]) => l)); for (const lv of [ace - 3, ace - 1, ace + 1]) rate(`${label} | lead ${lv} +5 mons`, team(key, lv, BENCH), foe, 'smart'); };
    later('gym 4 ANCAP', LEADERS.ancap.team);
    later('rival 4 (Ruta 5)', rivalTeamFor(key, 3));
    later('gym 5 MGAP', LEADERS.mgap.team);
    later('gym 6 Defensa', LEADERS.defensa.team);
    later('gym 7 Quiroga', LEADERS.quiroga.team);
    later('rival 5 (Ruta 24)', rivalTeamFor(key, 4));
    later('gym 8 Anglo', LEADERS.anglo.team);
    ELITES.forEach((E, i) => later(`Liga: ${E.name}`, E.team));
    later('rival final', rivalTeamFor(key, 5));
    later('champion', CHAMPION(false).team);
  }
}
