// Dev tool (not part of npm test): Monte Carlo win rates for scripted fights.
// Usage: node tests/balance.mjs
import { BattleEngine } from '../src/game/battle-engine.js';
import { createCreature, calcStats } from '../src/game/creature.js';
import { effectiveness } from '../src/data/types.js';
import { MOVES } from '../src/data/moves.js';
import { SPECIES } from '../src/data/species.js';
import { Rng } from '../src/core/rng.js';
import { SCRIPTS_FOR_TEST } from './balance-teams.mjs';

const N = 300;

/** A reasonable player: best expected-damage move; switches in the next healthy mon when forced. */
function playerAction(e) {
  const att = e.p.c;
  const def = e.f.c;
  let best = 0;
  let bestScore = -1;
  att.moves.forEach((m, i) => {
    const mv = MOVES[m.id];
    if (m.pp <= 0) return;
    const eff = effectiveness(mv.type, SPECIES[def.species].types);
    const stab = SPECIES[att.species].types.includes(mv.type) ? 1.5 : 1;
    const sc = mv.cat === 'est' ? 5 : mv.power * eff * stab * (mv.acc / 100);
    if (sc > bestScore) { bestScore = sc; best = i; }
  });
  return { type: 'move', index: best };
}

export function fight(partySpec, foeSpec, trainerAi = 'smart', seed = 1) {
  const rng = new Rng(seed * 7919);
  const party = partySpec.map(([sp, lv]) => createCreature(sp, lv, { rng }));
  const foes = foeSpec.map(([sp, lv]) => createCreature(sp, lv, { rng }));
  const e = new BattleEngine({ party, foes, wild: false, trainer: { ai: trainerAi, items: [] }, seed });
  let turns = 0;
  while (!e.over && turns < 400) {
    const ev = e.turn(playerAction(e));
    turns++;
    for (const x of ev) {
      if (x.t === 'foeNext') e.sendFoe(x.index);
      if (x.t === 'needSwitch') e.forceSwitch(party.findIndex((c) => c.hp > 0));
    }
  }
  return { win: e.over === 'win', turns, left: party.filter((c) => c.hp > 0).length };
}

export function rate(label, partySpec, foeSpec, ai) {
  let w = 0;
  for (let s = 1; s <= N; s++) w += fight(partySpec, foeSpec, ai, s).win ? 1 : 0;
  console.log(`${label.padEnd(46)} win ${(100 * w / N).toFixed(0)}%`);
}

if (process.argv[1]?.endsWith('balance.mjs')) SCRIPTS_FOR_TEST(rate);
