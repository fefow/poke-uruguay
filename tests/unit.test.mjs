// Node unit tests (no browser): run with `node --test tests/`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDamage, makeBattler, BattleEngine, applyItem } from '../src/game/battle-engine.ts';
import { createCreature, calcStats, expForLevel, gainExp, legalMoves, tmCompatible } from '../src/game/creature.ts';
import { ITEMS } from '../src/data/items.ts';
import { effectiveness } from '../src/data/types.ts';
import { MOVES } from '../src/data/moves.ts';
import { SPECIES } from '../src/data/species.ts';
import { Rng } from '../src/core/rng.ts';
import { validateSave } from '../src/save/validate.ts';
import { canonical, sha256, hmacSha256 } from '../src/save/integrity.ts';
import { newState } from '../src/game/state.ts';
import { EGG } from '../src/data/egg.ts';

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
  const ev = gainExp(c, expForLevel(12) - c.exp);
  assert.equal(c.level, 12);
  assert.ok(ev.some((e) => e.type === 'learn' && e.move === 'latigo_cepa'));
  assert.ok(c.moves.length <= 4);
});

test('legacy starter moves stay legal for old saves', () => {
  assert.ok(legalMoves('ceibito', 9).has('megaagotar'));
  assert.ok(legalMoves('tejuchispa', 5).has('grunido'));
});

test('items heal and revive correctly', () => {
  const c = mon('carpinchito', 10);
  const max = calcStats(c).hp;
  c.hp = 1;
  assert.match(applyItem('te_marcela', c), /recuperó 10 PS/);
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

test('huevo: guardado válido, contador conservado y reglas de la historia', () => {
  const s = goodSave();
  s.flags.badge1 = true; s.flags.got_huevo = true;
  s.bag.huevo = 1;
  s.stats.steps = 500;
  s.egg = { steps: 120 };
  let r = validateSave(s);
  assert.equal(r.ok, true, r.errors.join(', '));
  assert.deepEqual(r.data.egg, { steps: 120 });
  s.egg = { steps: 9999 }; // a counter from the future starts counting now
  r = validateSave(s);
  assert.deepEqual(r.data.egg, { steps: 500 });
  const bad = [
    (x) => { delete x.flags.got_huevo; },
    (x) => { delete x.flags.badge1; },
    (x) => { x.flags.huevo_nacio = true; },
  ];
  for (const f of bad) { const x = JSON.parse(JSON.stringify(s)); f(x); assert.equal(validateSave(x).ok, false); }
  const born = goodSave();
  born.flags.huevo_nacio = true;
  assert.equal(validateSave(born).ok, false, 'no puede nacer sin haberlo recibido');
  assert.equal(SPECIES[EGG.species] && !Object.values(SPECIES).some((o) => o.evo?.to === EGG.species), true, 'el huevo trae una criatura base');
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
  const { DEX_ORDER: ALL, CUSTOM_KEYS } = await import('../src/data/species.ts');
  const { TYPES } = await import('../src/data/types.ts');
  const DEX_ORDER = ALL.filter((k) => !CUSTOM_KEYS.includes(k)); // creatures made in the editor are extra
  assert.equal(DEX_ORDER.length, 151);
  const evolved = new Set(DEX_ORDER.map((k) => SPECIES[k].evo?.to).filter(Boolean));
  assert.equal(DEX_ORDER.length - evolved.size, 81);
  assert.equal(DEX_ORDER.filter((k) => SPECIES[k].legendary).length, 5);
  const byType = {};
  for (const k of DEX_ORDER) byType[SPECIES[k].types[0]] = (byType[SPECIES[k].types[0]] ?? 0) + 1;
  for (const t of Object.keys(TYPES)) assert.ok(byType[t] === 11 || byType[t] === 12, `${t}: ${byType[t]}`);
  ALL.forEach((k, i) => {
    const s = SPECIES[k];
    assert.equal(s.id, i + 1);
    if (s.evo) assert.ok(SPECIES[s.evo.to], `${k} evoluciona a algo que no existe`);
    assert.ok(s.learn.length >= 4, `${k} aprende pocos movimientos`);
    for (const [, m] of s.learn) assert.ok(MOVES[m], `${k}: movimiento ${m} no existe`);
  });
});

test('toda criatura no legendaria se puede conseguir (inicial, salvaje o pesca) o es evolución', async () => {
  const { MAPS } = await import('../src/data/maps.ts');
  const { DEX_ORDER, STARTERS } = await import('../src/data/species.ts');
  const found = new Set(STARTERS);
  for (const m of Object.values(MAPS)) for (const [sp] of [...(m.enc?.list ?? []), ...(m.fish ?? [])]) found.add(sp);
  const evolved = new Set(DEX_ORDER.map((k) => SPECIES[k].evo?.to).filter(Boolean));
  const missing = DEX_ORDER.filter((k) => !SPECIES[k].legendary && !evolved.has(k) && !found.has(k));
  assert.deepEqual(missing, []);
});

test('captura: nivel, vida, rareza y pokeball cuentan', async () => {
  const { catchValue, catchProbability } = await import('../src/game/capture.ts');
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

test('al cambiar de criatura, la que sale muestra sus PS de antes del ataque', () => {
  const party = [mon('ceibito', 12), mon('tejuchispa', 12)];
  const full = party[1].hp;
  const e = new BattleEngine({ party, foes: [mon('zorrigris', 30, 4)], wild: true, seed: 5 });
  const ev = e.turn({ type: 'switch', index: 1 });
  const send = ev.find((x) => x.t === 'send');
  const dmg = ev.find((x) => x.t === 'damage' && x.side === 0);
  assert.equal(send.hp, full, 'sale con todos sus PS');
  assert.ok(dmg && dmg.hp < full, 'el golpe llega después y baja la vida');
  assert.ok(ev.indexOf(send) < ev.indexOf(dmg));
});

test('sprite codec round-trips pixels, alpha and big palettes', async () => {
  const { encodeSprite, decodeSprite, overridesSource, parseOverridesSource } = await import('../src/gfx/sprite-codec.ts');
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

test('tiles drawn with see-through parts keep their chosen ground', async () => {
  const { encodeSprite, decodeSprite, spriteHasHoles, overridesSource, parseOverridesSource } = await import('../src/gfx/sprite-codec.ts');
  const tree = { ...encodeSprite(new Uint8ClampedArray([20, 120, 40, 255, 0, 0, 0, 0]), 2, 1), bg: 's' };
  assert.equal(spriteHasHoles(tree), true);
  assert.equal(spriteHasHoles(encodeSprite(new Uint8ClampedArray([20, 120, 40, 255, 0, 0, 0, 255]), 2, 1)), false);
  assert.equal(spriteHasHoles(encodeSprite(new Uint8ClampedArray([0, 0, 0, 46, 0, 0, 0, 255]), 2, 1)), true); // a soft shadow
  assert.ok(decodeSprite(tree)); // the extra field does not get in the way
  assert.deepEqual(parseOverridesSource(overridesSource({ 'tile:#0': tree }))['tile:#0'].bg, 's');
});

test('ruta: de Colonia se llega a Montevideo siguiendo las salidas, y cada ciudad bloquea el camino hacia adelante', async () => {
  const { OUTDOOR } = await import('../src/data/maps.ts');
  const { CHAIN, STOPS, STOP_INDEX, openFlag } = await import('../src/data/route.ts');
  for (let i = 0; i < CHAIN.length - 1; i++) {
    const a = OUTDOOR[CHAIN[i]];
    const fwd = Object.values(a.exits).find((e) => e.to === CHAIN[i + 1]);
    const back = Object.values(OUTDOOR[CHAIN[i + 1]].exits).find((e) => e.to === CHAIN[i]);
    assert.ok(fwd && back, `${CHAIN[i]} y ${CHAIN[i + 1]} no están conectados en los dos sentidos`);
    const stop = STOPS[STOP_INDEX[CHAIN[i]]];
    if (stop?.kind === 'city' && CHAIN[i] !== 'montevideo') assert.ok(fwd.req, `${CHAIN[i]} no bloquea el camino a ${CHAIN[i + 1]}`);
    if (stop?.kind === 'loc') assert.equal(fwd.req, undefined, `${CHAIN[i]} no debería bloquear`);
  }
  assert.equal(openFlag('fraybentos'), 'open_fraybentos');
});

test('medallas: el N-ésimo gimnasio de la ruta da la medalla N y los equipos suben con el camino', async () => {
  const { LEADERS, rivalTeamFor } = await import('../src/data/story.ts');
  const { GYM_STOPS, gymAce } = await import('../src/data/route.ts');
  const { fitSpecies, minLevelOf } = await import('../src/data/levels.ts');
  GYM_STOPS.forEach((st, i) => {
    const L = LEADERS[st.gym];
    assert.equal(L.order, i + 1, `${st.gym} debería ser el gimnasio ${i + 1}`);
    assert.equal(L.badge, `badge${i + 1}`);
    assert.equal(Math.max(...L.team.map((t) => t[1])), gymAce(st.id), `el as de ${st.gym} no sigue la curva`);
    for (const [sp, lv] of L.team) assert.ok(minLevelOf(sp) <= lv, `${sp} no puede estar en nivel ${lv}`);
  });
  for (let s = 1; s <= 5; s++) {
    const prev = Math.max(...rivalTeamFor('ceibito', s - 1).map((t) => t[1]));
    assert.ok(Math.max(...rivalTeamFor('ceibito', s).map((t) => t[1])) > prev, `el rival ${s} no es más fuerte que el anterior`);
  }
  assert.equal(rivalTeamFor('ceibito', 1).length, 2);
  assert.equal(fitSpecies('carpinchon', 10), 'carpinchito');
});

test('MO: cada traba de la ruta tiene su fuente antes, su medalla y su obstáculo', async () => {
  const { OUTDOOR, INTERIOR } = await import('../src/data/maps.ts');
  const { CHAIN } = await import('../src/data/route.ts');
  const { SCRIPTS } = await import('../src/data/story.ts');
  const has = (id, ch) => OUTDOOR[id].tiles.some((r) => r.includes(ch));
  const at = (id) => CHAIN.indexOf(id);
  assert.ok(has('r_belen_artigas', '%'), 'falta el zarzal de Corte');
  assert.ok(has('ruta30', '~'), 'falta el río de Surf');
  assert.ok(has('r_tupambae_melo', '\\'), 'falta la roca de Fuerza');
  assert.ok(OUTDOOR.r_piriapolis_minas.dark, 'falta el túnel oscuro de Destello');
  // the move is handed out in a city before the obstacle, and that script exists
  // (through a mini story: every step of it happens before the obstacle, or on its near side)
  const { MINI_STORIES } = await import('../src/data/mini-stories.ts');
  for (const [house, city, block, ms] of [['casa_artigas', 'artigas', 'ruta30', 'canoa'], ['casa_tac', 'tacuarembo', 'r_tupambae_melo', 'potro']]) {
    assert.equal(INTERIOR[house].npcs[0].script, 'ms_step');
    assert.equal(INTERIOR[house].npcs[0].ms, ms);
    assert.ok(SCRIPTS.ms_step);
    assert.ok(at(city) < at(block), `${ms} debe darse antes de su obstáculo`);
    for (const p of MINI_STORIES.find((m) => m.id === ms).people) if (at(p.at.map) >= 0) assert.ok(at(p.at.map) <= at(block), `${ms}/${p.key} antes del obstáculo`);
  }
  assert.ok(at('paloma') < at('r_piriapolis_minas'), 'el farol se da antes del túnel');
  // the Machete comes from the Buquebus captain in Fray Bentos, long before the thicket
  assert.equal(INTERIOR.casa_frb_faro.npcs[0].script, 'keeper_colonia');
  assert.ok(SCRIPTS.keeper_colonia && SCRIPTS.ferry_captain);
  assert.ok(OUTDOOR.fraybentos.warps.some((w) => w.to === 'ferry_1'), 'el barco está al final del muelle de Fray Bentos');
  assert.ok(!OUTDOOR.montevideo.doors.some((d) => d.to === 'ferry_1'), 'Montevideo ya no tiene el Buquebus');
  assert.ok(at('fraybentos') < at('r_belen_artigas'));
});

test('ciudades: las 18 miden al menos como Montevideo y ninguna se repite; las localidades tampoco', async () => {
  const { OUTDOOR } = await import('../src/data/maps.ts');
  const { CITY_SPECS, LOC_PLAN } = await import('../src/data/town-specs.ts');
  const seen = new Map();
  for (const id of Object.keys(CITY_SPECS)) {
    const t = OUTDOOR[id].tiles;
    assert.ok(t.length >= 30, `${id} alto`);
    assert.ok(t[0].length >= 44, `${id} ancho`);
  }
  for (const id of [...Object.keys(CITY_SPECS), ...Object.keys(LOC_PLAN)]) {
    const key = OUTDOOR[id].tiles.join('|');
    assert.ok(!seen.has(key), `${id} es idéntica a ${seen.get(key)}`);
    seen.set(key, id);
  }
  // each locality has its own landscape: the set of scenery tiles differs from its neighbours'
  const scenery = (id) => [...new Set(OUTDOOR[id].tiles.join('').replace(/[#.cDwrugovWCQIUtHS=]/g, ''))].sort().join('');
  const locs = Object.keys(LOC_PLAN);
  const kinds = new Set(locs.map(scenery));
  assert.ok(kinds.size >= 8, `pocas identidades distintas en las localidades: ${kinds.size}`);
});

test('historia nueva: Dr. Díaz, Torre de las Ánimas en Melo, Calle Victoria y decisiones de niebla', async () => {
  const { OUTDOOR, INTERIOR } = await import('../src/data/maps.ts');
  const { SCRIPTS } = await import('../src/data/story.ts');
  assert.ok(SCRIPTS.anima && SCRIPTS.keeper_colonia);
  assert.ok(OUTDOOR.melo.doors.some((d) => (d.to ?? d) === 'anima_1'), 'la torre está en Melo');
  for (const id of ['anima_1', 'anima_2', 'anima_3']) assert.ok(INTERIOR[id], id);
  assert.equal(OUTDOOR.r_laspiedras_montevideo.name, 'Calle Victoria');
  const src = (await import('node:fs')).readFileSync(new URL('../src/data/story.ts', import.meta.url), 'utf8');
  assert.ok(!/Calima/.test(src.replace(/id: 'calima'|look: 'calima'|async calima|npcLeave\('calima'\)/g, '')), 'queda un Calima en los textos');
});

test('Casino Peninsula: fichas, tragamonedas y premios existen', async () => {
  const { MAPS } = await import('../src/data/maps.ts');
  const { SCRIPTS } = await import('../src/data/story.ts');
  const { ITEMS } = await import('../src/data/items.ts');
  assert.ok(ITEMS.ficha);
  assert.ok(MAPS.casino_pde.npcs.every((n) => !n.script || SCRIPTS[n.script]));
  assert.ok(MAPS.punta.doors.some((d) => (d.to ?? d) === 'casino_pde'));
  for (const k of ['mate_dulce', 'ultraesfera', 'dulce_de_leche', 'piedra_agata', 'mt_sombra_nocturna', 'mt_garra_charrua']) assert.ok(ITEMS[k], k);
});

test('inicio: bosque grande, cueva con el PP y Buquebus en Fray Bentos', async () => {
  const { OUTDOOR } = await import('../src/data/maps.ts');
  assert.equal(OUTDOOR.r_rosario_sanjose.name, 'Bosque Grande');
  assert.equal(OUTDOOR.r_palmitas_mercedes.name, 'Cueva de Palmitas');
  assert.ok(OUTDOOR.r_palmitas_mercedes.npcs.some((n) => n.trainer?.cls === 'Equipo PP'));
  assert.ok(!OUTDOOR.colonia.doors.some((d) => (d.to ?? d) === 'ferry_1'));
});

test('rutas guiadas: desniveles de un solo sentido y paredes de árboles', async () => {
  const { OUTDOOR } = await import('../src/data/maps.ts');
  const { TILE_INFO } = await import('../src/gfx/tiles.ts');
  assert.ok(TILE_INFO['λ'].ledge);
  const total = Object.values(OUTDOOR).reduce((n, m) => n + m.tiles.join('').split('λ').length - 1, 0);
  assert.ok(total > 20, 'hay desniveles en las rutas');
  const r = OUTDOOR.r_rosario_sanjose.tiles.join('');
  const trees = [...r].filter((c) => c === '#' || c === 'q' || (c >= '\uE040' && c < '\uE080')).length;
  assert.ok(trees / r.length > 0.25, 'el Bosque Grande tiene arboledas');
});

test('historias de ruta: las marcas rq_/rf_ son válidas en una partida guardada', async () => {
  const { validateSave } = await import('../src/save/validate.ts');
  const { OUTDOOR } = await import('../src/data/maps.ts');
  const flags = Object.values(OUTDOOR).flatMap((m) => (m.npcs ?? []).map((n) => n.doneFlag).filter(Boolean));
  assert.ok(flags.length > 10, 'hay misiones de ruta');
  assert.ok(flags.every((f) => /^(rq|rf)_[a-z0-9_]{1,40}$/.test(f)), 'formato de marca');
});

test('música por zona: todas las notas de las pistas son válidas y existen las zonas', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/core/audio.ts', import.meta.url), 'utf8');
  for (const name of ['cave', 'gym', 'beach', 'forest', 'sierra', 'pp', 'casino', 'ferry', 'league']) assert.ok(new RegExp(`\\n  ${name}: \\{`).test(src), `pista ${name}`);
  const seqs = [...src.matchAll(/(?:lead|bass): '([^']+)'/g)].map((m) => m[1]);
  for (const s of seqs) {
    const p = s.trim().split(/\s+/);
    for (let i = 0; i < p.length; i += 2) {
      assert.ok(p[i] === '-' || /^[A-G]#?\d$/.test(p[i]), `nota ${p[i]}`);
      assert.ok(Number.isInteger(Number(p[i + 1])), `duración ${p[i + 1]}`);
    }
  }
});

test('objetos de batalla nuevos: precisión, resistencia, concentración y repelentes', () => {
  assert.equal(ITEMS.refuerzo_precision.xstat, 'acc');
  assert.equal(ITEMS.refuerzo_resistencia.xstat, 'spd');
  assert.ok(ITEMS.concentracion.focus);
  assert.ok(ITEMS.repelente_max.repel > ITEMS.repelente_super.repel && ITEMS.repelente_super.repel > ITEMS.repelente.repel);
});

test('clima: aleatorio determinista por mapa y franja, y fijo cuando el editor lo define', async () => {
  const { weatherAt } = await import('../src/gfx/fx.ts');
  assert.equal(weatherAt('carmelo', null, 1e12), weatherAt('carmelo', null, 1e12 + 1000));
  const seen = {};
  for (let i = 0; i < 600; i++) { const w = weatherAt('colonia', null, 1e12 + i * 240000); seen[w] = (seen[w] ?? 0) + 1; }
  for (const k of ['clear', 'rain', 'storm', 'fog']) assert.ok(seen[k] > 5, `${k} ${JSON.stringify(seen)}`);
  assert.ok(seen.clear > seen.rain && seen.rain > seen.storm);
  for (const k of ['rain', 'storm', 'fog', 'clear']) assert.equal(weatherAt('x', k, 5), k);
});

test('map editor patches apply and survive a parse round trip', async () => {
  const { applyMapEdits, fitsTiles, npcKeys, mapEditsSource, parseMapEditsSource } = await import('../src/data/map-edits.ts');
  assert.deepEqual(npcKeys([{ look: 'boy' }, { look: 'boy' }, { trainer: { id: 'a' } }, { script: 'x' }]), ['look:boy', 'look:boy@1', 'tr:a', 's:x']);
  const tiles = ['#D#', '.S.', '...'];
  assert.ok(fitsTiles(tiles, ['#D#', '.S.', '~~~']));
  assert.ok(!fitsTiles(tiles, ['###', '.S.', '...']), 'a missing door is rejected');
  assert.ok(!fitsTiles(tiles, ['#D#', '.S.']), 'a smaller grid is rejected');
  const maps = { a: { tiles: [...tiles], npcs: [{ look: 'boy', x: 0, y: 2, text: ['hola'] }, { look: 'boy', x: 2, y: 2, text: ['chau'] }], items: [{ id: 'p1', x: 1, y: 2, item: 'mate' }] } };
  const edits = parseMapEditsSource(mapEditsSource({ a: {
    tiles: ['#D#', '.S.', '~..'],
    npcs: { 'look:boy': { x: 1, y: 2, text: ['buenas'] }, 'look:boy@1': { remove: true } },
    addNpcs: [{ x: 2, y: 1, look: 'girl', text: ['nueva'] }],
    items: { p1: { remove: true } }, addItems: [{ x: 0, y: 1, item: 'pokeball', id: 'ed_a_1' }],
  } }));
  applyMapEdits(maps, edits);
  const m = maps.a;
  assert.equal(m.tiles[2], '~..');
  assert.equal(m.npcs.length, 2);
  assert.deepEqual([m.npcs[0].x, m.npcs[0].text[0]], [1, 'buenas']);
  assert.equal(m.npcs[1].look, 'girl');
  assert.deepEqual(m.items.map((i) => i.id), ['ed_a_1']);
  assert.deepEqual(parseMapEditsSource(mapEditsSource({})), {});
});

test('todo camino cerrado entre ciudades tiene algo en la historia que lo abre', async () => {
  const { MAPS } = await import('../src/data/maps.ts');
  const { STOPS, CHAIN } = await import('../src/data/route.ts');
  const { EVENTS } = await import('../src/data/story.ts');
  const fs = await import('node:fs');
  const story = fs.readFileSync(new URL('../src/data/story.ts', import.meta.url), 'utf8');
  const canOpen = (flag) => {
    const id = flag.replace(/^open_/, '');
    const st = STOPS.find((x) => x.id === id);
    if (!st) return false;
    if (st.gym) return true; // winning the medal sets it (leader in story.js)
    if ((MAPS[id].npcs ?? []).some((n) => n.script === 'town_gate')) return true;
    if (Object.values(EVENTS).some((e) => e.opens === flag)) return true;
    return story.includes(`setFlag('${flag}')`);
  };
  const stuck = [];
  for (let i = 0; i < CHAIN.length - 1; i++) {
    for (const ex of Object.values(MAPS[CHAIN[i]].exits ?? {})) {
      if (ex.to !== CHAIN[i + 1] || typeof ex.req !== 'string' || !ex.req.startsWith('open_')) continue;
      if (!canOpen(ex.req)) stuck.push(`${CHAIN[i]} necesita ${ex.req}`);
    }
  }
  assert.deepEqual(stuck, []);
});

test('revancha: cada mapa pertenece al primer gimnasio por delante en la ruta', async () => {
  const { refGymOrder } = await import('../src/data/maps.ts');
  assert.equal(refGymOrder('ruta1'), 1);
  assert.equal(refGymOrder('r_ecilda_trinidad'), 1);
  assert.equal(refGymOrder('gym_trinidad'), 1);
  assert.equal(refGymOrder('palmitas'), 2);
  assert.equal(refGymOrder('fraybentos'), 3);
  assert.equal(refGymOrder('gym_mvd'), 12);
});

test('encuentros: el agua no sale en pastizal y las cuevas tienen su propio bioma', async () => {
  const { encounterList } = await import('../src/data/encounters.ts');
  const { MAPS } = await import('../src/data/maps.ts');
  const { SPECIES } = await import('../src/data/species.ts');
  const water = (sp) => SPECIES[sp].types.includes('agua');
  let checked = 0;
  for (const m of Object.values(MAPS)) {
    if (!m.enc) continue;
    assert.ok(encounterList(m, 'grass').every(([sp]) => !water(sp)), `${m.name}: agua en pastizal`);
    assert.ok(encounterList(m, 'water').every(([sp]) => water(sp)), `${m.name}: no-agua en el agua`);
    if (m.theme === 'cueva') assert.ok(encounterList(m, 'cave').length > 0, `${m.name}: cueva sin criaturas`);
    checked++;
  }
  assert.ok(checked > 20);
});

test('eventos: acertijo de ruta, puntaje del concurso y mapa del parque', async () => {
  const { SCRIPTS } = await import('../src/data/story.ts');
  const { contestScore, riddleFor, parkTiles, PARK } = await import('../src/data/events.ts');
  const { MAPS } = await import('../src/data/maps.ts');
  // riddle: right answer opens the gate, a wrong one does not
  const flags = {};
  const say = []; 
  const api = (pick) => ({ flag: (k) => !!flags[k], setFlag: (k) => { flags[k] = true; }, say: async (t) => { say.push(t); }, choose: async (o) => pick(o), sfx() {} });
  const npc = { riddleId: 'ruta1', doneFlag: 'rf_rid_ruta1', name: 'G', text: 'x' };
  const [, opts, ans] = riddleFor('ruta1');
  await SCRIPTS.route_riddle(api((o) => o.findIndex((t) => t !== opts[ans])), npc);
  assert.ok(!flags.rf_rid_ruta1);
  await SCRIPTS.route_riddle(api((o) => o.indexOf(opts[ans])), npc);
  assert.ok(flags.rf_rid_ruta1);
  // contest
  assert.ok(contestScore({ species: 'hornerito', level: 20, hp: 50, maxHp: 50 }) > contestScore({ species: 'hornerito', level: 20, hp: 5, maxHp: 50 }));
  assert.equal(parkTiles()[PARK.gate.y][PARK.gate.x], '=');
  const park = MAPS.parque_concurso;
  assert.ok(park.safari && park.contest);
  assert.ok(MAPS.canelones.npcs.some((n) => n.script === 'ev_concurso') && MAPS.canelones.contestGate);
  for (const c of ['colonia', 'sanjose', 'mercedes', 'rocha']) assert.ok(MAPS[c].npcs.some((n) => /^ev_/.test(n.script ?? '')), c);
});

test('palancas: el orden correcto abre la tranquera y un error reinicia', async () => {
  const { SCRIPTS } = await import('../src/data/story.ts');
  const flags = {};
  const api = { flag: (k) => !!flags[k], setFlag: (k, v = true) => { if (v) flags[k] = true; else delete flags[k]; }, say: async () => {}, sfx() {} };
  const mk = (lever) => ({ name: 'P', routeId: 'ruta1', lever, order: [2, 0, 1], doneFlag: 'rf_gt_ruta1' });
  await SCRIPTS.route_palanca(api, mk(0)); // wrong first lever
  assert.ok(!flags.rf_pl_ruta1_0);
  for (const k of [2, 0, 1]) await SCRIPTS.route_palanca(api, mk(k));
  assert.ok(flags.rf_gt_ruta1);
  const { MAPS } = await import('../src/data/maps.ts');
  assert.ok(Object.values(MAPS).some((m) => (m.npcs ?? []).some((n) => n.script === 'route_palanca')));
});

test('carrera de bicicletas: ida y vuelta dentro del límite da premio una sola vez', async () => {
  const { SCRIPTS } = await import('../src/data/story.ts');
  const flags = {}; const given = [];
  const api = { flag: (k) => !!flags[k], setFlag: (k) => { flags[k] = true; }, say: async () => {}, ask: async () => true, give: async (i) => { given.push(i); }, hasItem: () => true, sfx() {} };
  await SCRIPTS.ev_carrera_juez(api); // start
  await SCRIPTS.ev_carrera_meta(api); // top
  await SCRIPTS.ev_carrera_juez(api); // finish
  assert.ok(flags.ev_carrera && given.length >= 2);
  const n = given.length;
  await SCRIPTS.ev_carrera_juez(api);
  assert.equal(given.length, n);
});

test('editor de mapas: un mapa agrandado desplaza a su gente y acepta más tamaño', async () => {
  const { applyMapEdits, fitsGrown } = await import('../src/data/map-edits.ts');
  const before = ['###', '#D#', '...'];
  assert.ok(fitsGrown(before, ['#####', '#####', '##D##', '.....', '.....']));
  assert.ok(!fitsGrown(before, ['##', '#D']), 'no se puede achicar');
  assert.ok(!fitsGrown(before, ['#####', '#####', '#####', '.....']), 'cambia la cantidad de puertas');
  const maps = { m: { tiles: [...before], npcs: [{ x: 1, y: 2, look: 'oldman' }], items: [{ x: 0, y: 2, item: 'mate', id: 'a' }], warps: [{ x: 2, y: 2, to: 'z', tx: 0, ty: 0 }] } };
  applyMapEdits(maps, { m: { tiles: ['#####', '#####', '##D##', '.....', '.....'], shift: { x: 1, y: 1 } } });
  assert.equal(maps.m.tiles.length, 5);
  assert.deepEqual([maps.m.npcs[0].x, maps.m.npcs[0].y], [2, 3]);
  assert.deepEqual([maps.m.items[0].x, maps.m.items[0].y], [1, 3]);
  assert.deepEqual([maps.m.warps[0].x, maps.m.warps[0].y], [3, 3]);
});

test('every music track and jingle is made of valid notes and lengths', async () => {
  const { TRACKS, JINGLES } = await import('../src/core/audio.ts');
  for (const [name, t] of Object.entries({ ...TRACKS, ...JINGLES })) {
    for (const part of ['lead', 'bass']) {
      const tok = t[part].trim().split(/\s+/);
      assert.equal(tok.length % 2, 0, `${name}.${part}: notes and lengths come in pairs`);
      for (let i = 0; i < tok.length; i += 2) {
        assert.match(tok[i], /^(-|[A-G]#?\d)$/, `${name}.${part}: bad note ${tok[i]}`);
        assert.ok(Number(tok[i + 1]) > 0, `${name}.${part}: bad length ${tok[i + 1]}`);
      }
    }
    if (t.drums) assert.match(t.drums, /^[ksh-]+$/, `${name}.drums`);
  }
});

test('night shifts wild odds toward shadowy creatures without removing anyone', async () => {
  const { encounterList } = await import('../src/data/encounters.ts');
  const m = { enc: { list: [['pombero', 5, 7, 10], ['yarara', 5, 7, 10], ['ceibito', 5, 7, 10]] } };
  const w = (list, k) => list.find((e) => e[0] === k)[3];
  const day = encounterList(m, 'grass', 0), night = encounterList(m, 'grass', 1);
  assert.equal(day.length, night.length);
  assert.ok(w(night, 'pombero') > w(day, 'pombero'));
  assert.ok(w(night, 'ceibito') < w(day, 'ceibito'));
});

test('wild zones: plain, forest, sand and embers hold different creatures', async () => {
  const { encounterList, tileBiome } = await import('../src/data/encounters.ts');
  const { SPECIES } = await import('../src/data/species.ts');
  const { MAPS } = await import('../src/data/maps.ts');
  // plain favours normal kinds, forest favours plants and bugs; nobody on the map's list disappears
  const m = { id: 'x', enc: { list: [['pombero', 5, 7, 10], ['yarara', 5, 7, 10], ['ceibito', 5, 7, 10], ['carpincho', 5, 7, 10]] } };
  const w = (list, k) => list.find((e) => e[0] === k)?.[3] ?? 0;
  const plain = encounterList(m, 'plain'), forest = encounterList(m, 'forest');
  assert.equal(plain.length, forest.length);
  const typed = (t) => m.enc.list.map((e) => e[0]).filter((k) => SPECIES[k].types.includes(t));
  for (const k of typed('planta')) assert.ok(w(forest, k) > w(plain, k), `${k} should be likelier in the forest`);
  // tile classification: crowded grass is forest, open grass is plain, sand only outside cities, embers are volcanic
  const trees = ['#####', '#####', '##,##', '#####', '#####'];
  const at = (rows) => (x, y) => rows[y]?.[x] ?? null;
  assert.equal(tileBiome({ id: 'x', enc: m.enc }, at(trees), 2, 2), 'forest');
  assert.equal(tileBiome({ id: 'x', enc: m.enc }, at(['.....', '..,..', '.....']), 2, 1), 'plain');
  assert.equal(tileBiome({ id: 'x', enc: m.enc }, at(['s~']), 0, 0), 'sand');
  assert.equal(tileBiome({ id: 'x', enc: m.enc }, at(['s..']), 0, 0), null);
  assert.equal(tileBiome({ id: 'colonia', enc: m.enc }, at(['s']), 0, 0), null);
  assert.equal(tileBiome({ id: 'x', enc: m.enc }, at([';']), 0, 0), 'volcanic');
  // every sandy and volcanic map has creatures that never swim, in sensible kinds
  for (const [id, map] of Object.entries(MAPS)) {
    for (const [biome, ok] of [['sand', ['tierra', 'roca', 'volador', 'bicho']], ['volcanic', ['fuego', 'tierra', 'roca']]]) {
      if (!map.enc?.list?.length || !map.tiles.join('').includes(biome === 'sand' ? 's' : ';')) continue;
      const list = encounterList(map, biome);
      if (!list.length) continue;
      assert.ok(list.every(([sp]) => !SPECIES[sp].types.includes('agua') && SPECIES[sp].types.some((t) => ok.includes(t))), `${id}: ${biome} zone has strangers`);
    }
  }
});

test('map editor: a map can choose the ground behind its trees and bushes', async () => {
  const { applyMapEdits } = await import('../src/data/map-edits.ts');
  const maps = { a: { tiles: ['..'], npcs: [], items: [] } };
  applyMapEdits(maps, { a: { ground: 's' } });
  assert.equal(maps.a.ground, 's');
});

test('favores entre pueblos: cada cadena se pide, se lleva y se cobra en orden', async () => {
  const { FAVORS, FAVOR_SCRIPTS } = await import('../src/data/favors.ts');
  const { ITEMS } = await import('../src/data/items.ts');
  assert.ok(FAVORS.length >= 12);
  for (const c of FAVORS) {
    const flags = {}, given = [], said = [];
    const api = { flag: (k) => !!flags[k], setFlag: (k) => { flags[k] = true; }, say: async (t) => { said.push(t); }, sfx() {}, give: async (k, q) => { given.push([k, q]); } };
    const npc = (role, name) => ({ name, fvId: c.id, fvRole: role });
    // a middle person says nothing useful before the request, then the request is made
    await FAVOR_SCRIPTS.fv(api, npc(1, 'mid'));
    assert.deepEqual(said.pop(), c.idle);
    await FAVOR_SCRIPTS.fv(api, npc(0, 'giver'));
    assert.equal(flags[`ev_fv_${c.id}_0`], true);
    assert.equal(given.length, 0);
    // asking again before finishing only repeats the wait line
    await FAVOR_SCRIPTS.fv(api, npc(0, 'giver'));
    assert.deepEqual(said.pop(), c.wait);
    for (let j = 1; j <= c.mids.length; j++) await FAVOR_SCRIPTS.fv(api, npc(j, 'mid'));
    await FAVOR_SCRIPTS.fv(api, npc(0, 'giver'));
    assert.equal(flags[`ev_fv_${c.id}_z`], true);
    assert.deepEqual(given, c.reward);
    for (const [k] of c.reward) assert.ok(ITEMS[k], `${c.id}: ${k} existe`);
    for (const k of Object.keys(flags)) assert.match(k, /^ev_[a-z0-9_]{1,40}$/);
  }
});

test('mini historias: cadenas de pasos con personas en mapas reales, ítems clave y sin acertijos; cada una se completa', async () => {
  const { MINI_STORIES, MS_SCRIPTS, stageOf } = await import('../src/data/mini-stories.ts');
  const { SPECIES } = await import('../src/data/species.ts');
  const { ITEMS } = await import('../src/data/items.ts');
  const { MAPS } = await import('../src/data/maps.ts');
  assert.ok(MINI_STORIES.length >= 6);
  for (const s of MINI_STORIES) {
    const flags = {}, bag = {};
    const placed = s.people.map((p) => {
      const n = (MAPS[p.at.map]?.npcs ?? []).find((o) => o.ms === s.id && o.msKey === p.key);
      assert.ok(n, `${s.id}/${p.key}: está en ${p.at.map}`);
      return [p, n];
    });
    const api = {
      flag: (k) => !!flags[k], setFlag: (k) => { flags[k] = true; }, say: async () => {}, sfx() {},
      give: async (k) => { assert.ok(ITEMS[k], `${s.id}: ítem ${k}`); assert.equal(ITEMS[k].pocket, 'key', `${s.id}: ${k} es ítem clave`); bag[k] = 1; },
      takeItem: (k) => { assert.ok(bag[k], `${s.id}: entrega ${k} sin tenerlo`); delete bag[k]; },
      wildBattle: async (sp) => { assert.ok(SPECIES[sp], `${s.id}: especie ${sp}`); return 'win'; },
      npcWalkOff: async () => {}, choose: async () => { throw new Error(`${s.id}: no hay elecciones ni acertijos`); },
    };
    const stage = () => stageOf(s, (k) => !!flags[k]);
    for (let guard = 0; stage() < s.done && guard < 30; guard++) {
      const st = stage();
      const who = placed.find(([p]) => (p.acts ?? []).some((a) => a.at === st && !(a.part && flags[`ev_ms_${s.id}_p_${a.part}`])));
      assert.ok(who, `${s.id}: alguien hace avanzar la etapa ${st}`);
      await MS_SCRIPTS.ms_step(api, who[1]);
    }
    assert.equal(stage(), s.done, `${s.id} completa`);
    assert.deepEqual(Object.keys(bag).filter((k) => !['soga', 'canoa', 'bici', 'guantes'].includes(k)), [], `${s.id}: no quedan encargos en la mochila`);
    for (const k of Object.keys(flags)) assert.match(k, /^(ev_[a-z0-9_]{1,40}|got_[a-z]+)$/);
  }
});

test('in-game calendar: weekdays, dates, sleeping and saving', async () => {
  const cal = await import('../src/game/calendar.ts');
  const { setState } = await import('../src/game/state.ts');
  const s = newState({ name: 'Dusi', look: 'player_m' });
  setState(s);
  assert.equal(cal.weekday(), 'lunes');
  assert.equal(cal.fullText(), 'Lunes 1 de marzo · 08:00');
  cal.advanceClock(18 * 60000); // 18 real minutes = one in-game day
  assert.equal(cal.fullText(), 'Martes 2 de marzo · 08:00');
  assert.ok(cal.isDay('martes', 'jueves'));
  assert.ok(!cal.isDay('miercoles'));
  assert.equal(cal.shortText(), 'Mar 2 mar · 08:00');
  s.clock = 22 * 60 + 24 * 60 * 30; // day 31, 22:00
  assert.equal(cal.dateText(), '31 de marzo');
  assert.ok(cal.isDay('miércoles'));
  cal.sleepUntil(8);
  assert.equal(cal.fullText(), 'Jueves 1 de abril · 08:00');
  s.clock = cal.dayNumber() * 1440 + 3 * 60; // 3:00 at night: sleep until 8:00 the same day
  const day = cal.dayNumber();
  cal.sleepUntil(8);
  assert.equal(cal.dayNumber(), day);
  assert.equal(cal.timeText(), '08:00');
  assert.equal(cal.daysSince(day - 2), 2);
  // the clock is kept by save validation; old saves without it start on day 1 at 8:00
  const g = goodSave();
  g.clock = 5000;
  assert.equal(validateSave(g).data.clock, 5000);
  delete g.clock;
  assert.equal(validateSave(g).data.clock, 480);
});

test('medidor de niebla: arranca en 100 %, baja con las plantas del PP y las máquinas, y el guardado lo acepta', async () => {
  const { fogReading, PP_PLANTS, fogMachineFlags } = await import('../src/data/toxicity.ts');
  const { OUTDOOR } = await import('../src/data/maps.ts');
  assert.equal(PP_PLANTS.reduce((n, p) => n + p[2], 0), 85, 'las plantas valen 85 puntos');
  const machines = fogMachineFlags();
  const onRoutes = Object.values(OUTDOOR).flatMap((m) => (m.npcs ?? []).filter((n) => n.script === 'route_fog').map((n) => n.doneFlag));
  assert.ok(machines.length >= onRoutes.length && machines.length > 5, 'cuenta las máquinas sueltas');
  assert.equal(fogReading({}).pct, 100);
  const plants = Object.fromEntries(PP_PLANTS.map(([f]) => [f, true]));
  assert.equal(fogReading(plants).pct, 15, 'solo quedan las máquinas sueltas');
  assert.equal(fogReading({ ...plants, ...Object.fromEntries(machines.map((f) => [f, true])) }).pct, 0);
  assert.ok(fogReading({ anglo_pp: true }).pct < 100);
  const s = goodSave();
  s.bag.medidor_niebla = 1;
  assert.equal(validateSave(s).ok, false, 'sin haberlo recibido');
  s.flags.got_medidor = true;
  assert.equal(validateSave(s).ok, false, 'antes del Anglo');
});
