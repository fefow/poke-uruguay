import { rivalTeamFor, LEADERS } from '../src/data/story.js';

// What a normal player (no grinding) roughly has at each story beat:
// the starter (evolved when due) plus a couple of caught creatures a few levels behind.
const LINES = {
  ceibito: ['ceibito', 'ceibal', 'ceibarbol'],
  tejuchispa: ['tejuchispa', 'tejubrasa', 'tejufogon'],
  carpinchito: ['carpinchito', 'carpincho', 'carpinchon'],
};
const stage = (key, lv) => LINES[key][lv >= 30 ? 2 : lv >= 14 ? 1 : 0];
const team = (key, lv, extra) => [[stage(key, lv), lv], ...extra.map(([sp, d]) => [sp, lv - d])];

export function SCRIPTS_FOR_TEST(rate) {
  for (const key of Object.keys(LINES)) {
    console.log(`\n== starter ${key}`);
    for (const lv of [5, 6]) rate(`rival 1 | starter lvl ${lv}`, [[key, lv]], rivalTeamFor(key, 0), 'basic');
    for (const lv of [12, 13, 14]) rate(`rival 2 | lead ${lv} +2 mons`, team(key, lv, [['teruterito', 3], ['zorrigris', 4]]), rivalTeamFor(key, 1), 'basic');
    for (const lv of [12, 14, 16]) rate(`gym 1 Lucía | lead ${lv} +2 mons`, team(key, lv, [['teruterito', 2], ['zorrigris', 3]]), LEADERS.lucia.team, 'smart');
    for (const lv of [22, 24, 26]) rate(`gym 2 Sofía | lead ${lv} +2 mons`, team(key, lv, [['teruterazo', 3], ['zorromonte', 3]]), LEADERS.sofia.team, 'smart');
    for (const lv of [24, 26, 28]) rate(`rival 3 | lead ${lv} +2 mons`, team(key, lv, [['teruterazo', 3], ['zorromonte', 3]]), rivalTeamFor(key, 2), 'smart');
    for (const lv of [29, 31, 33]) rate(`gym 3 Aparicio | lead ${lv} +3 mons`, team(key, lv, [['teruterazo', 3], ['zorromonte', 3], ['butiazal', 4]]), LEADERS.aparicio.team, 'smart');
    for (const lv of [36, 38, 40]) rate(`rival 4 | lead ${lv} +3 mons`, team(key, lv, [['teruterazo', 2], ['zorromonte', 3], ['lobomarino', 3]]), rivalTeamFor(key, 3), 'smart');
    const CH = [['nanduro', 38], ['zorromonte', 38], ['yacaron', 39], ['lobomarino', 39], ['gatomontes', 39], ['aguaraflama', 41]];
    for (const lv of [38, 40, 42]) rate(`champion | lead ${lv} +4 mons`, team(key, lv, [['teruterazo', 2], ['zorromonte', 2], ['lobomarino', 2], ['venadalto', 2], ['yacaron', 3]]), CH, 'smart');
  }
}
