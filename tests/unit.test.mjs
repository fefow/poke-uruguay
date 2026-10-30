// Node unit tests (no browser): run with `node --test tests/`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDamage, makeBattler, BattleEngine, applyItem } from '../src/game/battle-engine.js';
import { createCreature, calcStats, expForLevel, gainExp, legalMoves, tmCompatible } from '../src/game/creature.js';
import { ITEMS } from '../src/data/items.js';
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
  assert.equal(c.moves.length, 2, 'starters begin with two moves');
  const ev = gainExp(c, expForLevel(10) - c.exp);
  assert.equal(c.level, 10);
  assert.ok(ev.some((e) => e.type === 'learn' && e.move === 'megaagotar'));
});

test('legacy starter moves stay legal for old saves', () => {
  assert.ok(legalMoves('ceibito', 9).has('megaagotar'));
  assert.ok(legalMoves('tejuchispa', 5).has('grunido'));
});

test('items heal and revive correctly', () => {
  const c = mon('carpinchito', 10);
  const max = calcStats(c).hp;
  c.hp = 1;
  assert.match(applyItem('te_marcela', c), /recuperó 15 PS/);
  c.hp = 0;
  assert.equal(applyItem('mate', c), null, 'cannot heal fainted');
  applyItem('alfajor', c);
  assert.equal(c.hp, Math.floor(max / 2));
});

test('legal moves include pre-evolution moves', () => {
  const set = legalMoves('ceibarbol', 40);
  assert.ok(set.has('somnifero'));
  assert.ok(!set.has('psiquico'));
});

test('MT: compatibilidad por tipo y legalidad', () => {
  assert.ok(tmCompatible('tejuchispa', 'parrillada'));
  assert.ok(!tmCompatible('tejuchispa', 'cascada'));
  assert.ok(legalMoves('tejuchispa', 5).has('parrillada'));
  assert.ok(!legalMoves('tejuchispa', 5).has('cascada'));
});

test('piedras: la evolución por piedra no depende del nivel', () => {
  const stoned = Object.values(SPECIES).filter((s) => s.evo?.stone);
  assert.ok(stoned.length >= 8);
  for (const s of stoned) assert.ok(ITEMS[s.evo.stone]?.stone === s.evo.stone, s.key);
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

test('Dex: 151 criaturas, 81 base, 70 evoluciones, 5 legendarias, tipos parejos', async () => {
  const { DEX_ORDER } = await import('../src/data/species.js');
  const { TYPES } = await import('../src/data/types.js');
  assert.equal(DEX_ORDER.length, 151);
  const evolved = new Set(DEX_ORDER.map((k) => SPECIES[k].evo?.to).filter(Boolean));
  assert.equal(DEX_ORDER.length - evolved.size, 81);
  assert.equal(DEX_ORDER.filter((k) => SPECIES[k].legendary).length, 5);
  const byType = {};
  for (const k of DEX_ORDER) byType[SPECIES[k].types[0]] = (byType[SPECIES[k].types[0]] ?? 0) + 1;
  for (const t of Object.keys(TYPES)) assert.ok(byType[t] === 11 || byType[t] === 12, `${t}: ${byType[t]}`);
  DEX_ORDER.forEach((k, i) => {
    const s = SPECIES[k];
    assert.equal(s.id, i + 1);
    if (s.evo) assert.ok(SPECIES[s.evo.to], `${k} evoluciona a algo que no existe`);
    assert.ok(s.learn.length >= 4, `${k} aprende pocos movimientos`);
    for (const [, m] of s.learn) assert.ok(MOVES[m], `${k}: movimiento ${m} no existe`);
  });
});

test('toda criatura no legendaria se puede conseguir (inicial, salvaje o pesca) o es evolución', async () => {
  const { MAPS } = await import('../src/data/maps.js');
  const { DEX_ORDER, STARTERS } = await import('../src/data/species.js');
  const found = new Set(STARTERS);
  for (const m of Object.values(MAPS)) for (const [sp] of [...(m.enc?.list ?? []), ...(m.fish ?? [])]) found.add(sp);
  const evolved = new Set(DEX_ORDER.map((k) => SPECIES[k].evo?.to).filter(Boolean));
  const missing = DEX_ORDER.filter((k) => !SPECIES[k].legendary && !evolved.has(k) && !found.has(k));
  assert.deepEqual(missing, []);
});

test('captura: nivel, vida, rareza y pokeball cuentan', async () => {
  const { catchValue, catchProbability } = await import('../src/game/capture.js');
  const P = (o) => catchProbability(catchValue({ catchRate: 190, level: 5, hp: 20, maxHp: 20, ball: 1, ...o }));
  // menos vida y mejor pokeball, más chance
  assert.ok(P({ hp: 3 }) > P({}));
  assert.ok(P({ ball: 2 }) > P({ ball: 1.5 }) && P({ ball: 1.5 }) > P({ ball: 1 }));
  // un nivel bajo es más fácil que uno alto con la misma vida y bola
  assert.ok(P({ level: 5 }) > P({ level: 30 }) && P({ level: 30 }) > P({ level: 60 }));
  // una criatura rara a vida completa con una Pokeball común casi no se captura
  assert.ok(P({ catchRate: 3, level: 60 }) < 0.02);
  // la rara con Ultraball, poca vida y dormida mejora pero sigue siendo difícil
  const hard = P({ catchRate: 3, level: 60, ball: 2, hp: 1, status: 'slp' });
  assert.ok(hard > P({ catchRate: 3, level: 60 }) && hard < 0.3);
  // la Pokeball Celeste siempre atrapa
  assert.equal(P({ ball: 255, catchRate: 3, level: 60 }), 1);
});

test('huir de un entrenador no gasta el turno', () => {
  const party = [mon('tejuchispa', 10)];
  const e = new BattleEngine({ party, foes: [mon('ceibito', 10, 2)], wild: false, trainer: { ai: 'basic', items: [] }, seed: 3 });
  const hp = party[0].hp;
  const ev = e.turn({ type: 'run' });
  assert.equal(ev.length, 1);
  assert.equal(ev[0].t, 'text');
  assert.equal(party[0].hp, hp);
});

test('los eventos de daño y curación llevan los PS en ese momento', () => {
  const party = [mon('ceibito', 12)];
  party[0].hp = 5;
  const e = new BattleEngine({ party, foes: [mon('tejuchispa', 12, 4)], wild: true, seed: 11 });
  const ev = e.turn({ type: 'move', index: party[0].moves.findIndex((m) => m.id === 'absorber') });
  for (const x of ev) if (x.t === 'damage' || x.t === 'heal') assert.ok(Number.isInteger(x.hp), `${x.t} sin hp`);
});

test('sprite codec round-trips pixels, alpha and big palettes', async () => {
  const { encodeSprite, decodeSprite, overridesSource, parseOverridesSource } = await import('../src/gfx/sprite-codec.js');
  const w = 12, h = 9;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (i % 7 === 0) continue; // transparent
    px.set([i * 3 % 256, i * 5 % 256, i * 11 % 256, i % 5 === 0 ? 56 : 255], i * 4);
  }
  const enc = encodeSprite(px, w, h);
  assert.equal(enc.c, 2); // more than 62 colours: two characters per pixel
  assert.deepEqual([...decodeSprite(enc)], [...px]);
  const small = encodeSprite(new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0]), 2, 1);
  assert.deepEqual(small, { w: 2, h: 1, c: 1, p: ['#ff0000'], d: ['0.'] });
  assert.equal(decodeSprite({ ...small, d: ['0'] }), null); // wrong row length is rejected
  const map = { 'badge:1': small, 'item:mate': enc };
  assert.deepEqual(parseOverridesSource(overridesSource(map)), map);
  assert.deepEqual(parseOverridesSource(overridesSource({})), {});
});
