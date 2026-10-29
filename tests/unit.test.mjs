// Node unit tests (no browser): run with `node --test tests/`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDamage, makeBattler, BattleEngine, applyItem } from '../src/game/battle-engine.js';
import { createCreature, calcStats, expForLevel, gainExp, legalMoves } from '../src/game/creature.js';
import { effectiveness } from '../src/data/types.js';
import { MOVES } from '../src/data/moves.js';
import { SPECIES } from '../src/data/species.js';
import { Rng } from '../src/core/rng.js';
import { validateSave } from '../src/save/validate.js';
import { canonical, sha256, hmacSha256 } from '../src/save/integrity.js';
import { newState } from '../src/game/state.js';

const mon = (sp, lvl, seed = 1) => createCreature(sp, lvl, { rng: new Rng(seed) });

test('type chart basics', () => {
  assert.equal(effectiveness('agua', ['fuego']), 2);
  assert.equal(effectiveness('electrico', ['tierra']), 0);
  assert.equal(effectiveness('planta', ['agua', 'tierra']), 4);
  assert.equal(effectiveness('fuego', ['agua', 'roca']), 0.25);
});

test('data tables are frozen (runtime tampering is a no-op/throws)', () => {
  assert.ok(Object.isFrozen(MOVES.placaje));
  assert.throws(() => { 'use strict'; MOVES.placaje.power = 999; });
  assert.throws(() => { SPECIES.ceibito.base[1] = 999; });
});

test('damage formula is deterministic with a fixed roll', () => {
  const a = makeBattler(mon('tejuchispa', 10));
  const d = makeBattler(mon('ceibito', 10));
  const r1 = computeDamage(a, d, MOVES.ascuas, new Rng(5), { forceCrit: false, forceRoll: 1 });
  const r2 = computeDamage(a, d, MOVES.ascuas, new Rng(9), { forceCrit: false, forceRoll: 1 });
  assert.equal(r1.dmg, r2.dmg);
  assert.equal(r1.eff, 2);
  const neutral = computeDamage(a, d, MOVES.aranazo, new Rng(5), { forceCrit: false, forceRoll: 1 });
  assert.ok(r1.dmg > neutral.dmg, 'super effective STAB beats neutral');
});

test('immunity deals 0', () => {
  const a = makeBattler(mon('luciernito', 20));
  const d = makeBattler(mon('mulitin', 20));
  assert.equal(computeDamage(a, d, MOVES.impactrueno, new Rng(1)).dmg, 0);
});

test('battles replay identically from seed + actions', () => {
  const run = () => {
    const party = [mon('ceibito', 12, 3)];
    const foes = [mon('teruterito', 10, 4), mon('zorrigris', 10, 5)];
    const e = new BattleEngine({ party, foes, wild: false, trainer: { name: 'T', ai: 'smart' }, seed: 1234 });
    const out = [];
    for (let i = 0; i < 30 && !e.over; i++) {
      out.push(...e.turn({ type: 'move', index: i % party[0].moves.length }));
      const nxt = out.findLast((x) => x.t === 'foeNext');
      if (nxt && !nxt.done) { nxt.done = true; e.sendFoe(nxt.index); }
    }
    return { over: e.over, hp: party[0].hp, log: e.log };
  };
  const a = run();
  const b = run();
  assert.deepEqual(a, b);
});

test('exp curve and level up', () => {
  const c = mon('ceibito', 5);
  const ev = gainExp(c, expForLevel(9) - c.exp);
  assert.equal(c.level, 9);
  assert.ok(ev.some((e) => e.type === 'learn' && e.move === 'latigo_cepa'));
});

test('items heal and revive correctly', () => {
  const c = mon('carpinchito', 10);
  const max = calcStats(c).hp;
  c.hp = 1;
  assert.match(applyItem('te_marcela', c), /recuperó 20 PS/);
  c.hp = 0;
  assert.equal(applyItem('mate', c), null, 'cannot heal fainted');
  applyItem('alfajor', c);
  assert.equal(c.hp, Math.floor(max / 2));
});

test('legal moves include pre-evolution moves', () => {
  const set = legalMoves('ceibarbol', 40);
  assert.ok(set.has('somnifero'));
  assert.ok(!set.has('terremoto'));
});

function goodSave() {
  const s = newState({ name: 'Dusi', look: 'player_m' });
  s.flags = { has_starter: true, starter_ceibito: true, dex: true };
  const c = mon('ceibito', 8);
  c.ot = s.player.id;
  s.party.push(c);
  s.dex = { seen: ['ceibito'], caught: ['ceibito'] };
  s.bag = { esfera: 5 };
  s.pos = { map: 'ruta1', x: 3, y: 7, dir: 'down' };
  return JSON.parse(JSON.stringify(s));
}

test('valid save passes validation', () => {
  const r = validateSave(goodSave());
  assert.equal(r.ok, true, r.errors.join(', '));
});

test('validation rejects edited stats/levels/moves/money/items', () => {
  const cases = [
    (s) => (s.party[0].level = 60),
    (s) => (s.party[0].exp = 999999),
    (s) => (s.party[0].ivs[0] = 31),
    (s) => (s.party[0].hp = 9999),
    (s) => (s.party[0].moves[0] = { id: 'terremoto', pp: 10 }),
    (s) => (s.party[0].moves[0].pp = 99),
    (s) => (s.party[0].species = 'pamperon'),
    (s) => (s.player.money = 50000),
    (s) => (s.bag.esfera_celeste = 1),
    (s) => (s.bag.esfera = 500),
    (s) => (s.flags.badge3 = true),
    (s) => (s.flags.hack = true),
    (s) => s.party.push(mon('tejuchispa', 5, 77)),
    (s) => (s.party[0].atk = 999), // ignored: stats are never read from saves
  ];
  cases.forEach((mutate, i) => {
    const s = goodSave();
    mutate(s);
    const r = validateSave(s);
    if (i === cases.length - 1) {
      assert.equal(r.ok, true);
      assert.equal(r.data.party[0].atk, undefined, 'unknown fields are dropped');
    } else {
      assert.equal(r.ok, false, `case ${i} should be rejected`);
    }
  });
});

test('canonical JSON is key-order independent', () => {
  assert.equal(canonical({ b: 1, a: [2, { d: 1, c: 2 }] }), canonical({ a: [2, { c: 2, d: 1 }], b: 1 }));
});

test('pure-JS SHA-256/HMAC match known vectors', () => {
  const hex = (u) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');
  assert.equal(hex(sha256(new TextEncoder().encode('abc'))), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(hex(hmacSha256(new TextEncoder().encode('key'), new TextEncoder().encode('The quick brown fox jumps over the lazy dog'))), 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
});
