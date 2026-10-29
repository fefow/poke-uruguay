// Creature model. Stats are ALWAYS derived from frozen species tables +
// level + IVs; they are never stored in saves, so editing a save cannot
// change attack/defense numbers directly.

import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { clamp } from '../core/util.js';
import { worldRng } from '../core/rng.js';

export const MAX_LEVEL = 100;
export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
export const STAT_NAMES = { hp: 'PS', atk: 'Ataque', def: 'Defensa', spa: 'At. Esp.', spd: 'Def. Esp.', spe: 'Velocidad', acc: 'Precisión', eva: 'Evasión' };

/** Medium-fast growth curve. */
export const expForLevel = (lvl) => (lvl <= 1 ? 0 : lvl ** 3);

export function levelForExp(exp) {
  let lvl = 1;
  while (lvl < MAX_LEVEL && expForLevel(lvl + 1) <= exp) lvl++;
  return lvl;
}

export function calcStats(c) {
  const sp = SPECIES[c.species];
  const out = {};
  STAT_KEYS.forEach((k, i) => {
    const core = Math.floor(((2 * sp.base[i] + c.ivs[i]) * c.level) / 100);
    out[k] = k === 'hp' ? core + c.level + 10 : core + 5;
  });
  return out;
}

/** Moves a species knows by default at a level: last four learned. */
export function defaultMoves(speciesKey, level) {
  const learn = SPECIES[speciesKey].learn.filter(([l]) => l <= level).map(([, m]) => m);
  const unique = [...new Set(learn)];
  return unique.slice(-4);
}

/** Every move a species could legitimately know at this level (incl. pre-evolutions). */
export function legalMoves(speciesKey, level) {
  const set = new Set();
  const visit = (key) => {
    for (const [l, m] of SPECIES[key].learn) if (l <= level) set.add(m);
  };
  visit(speciesKey);
  for (const s of Object.values(SPECIES)) {
    if (s.evo?.to === speciesKey) {
      visit(s.key);
      for (const s2 of Object.values(SPECIES)) if (s2.evo?.to === s.key) visit(s2.key);
    }
  }
  return set;
}

let uidCounter = 0;
export function newUid() {
  return `${Date.now().toString(36)}${(uidCounter++).toString(36)}${Math.floor(worldRng.next() * 1e6).toString(36)}`;
}

export function createCreature(speciesKey, level, { rng = worldRng, moves, nickname, ot } = {}) {
  const ivs = Array.from({ length: 6 }, () => rng.int(0, 15));
  const c = {
    uid: newUid(),
    species: speciesKey,
    nickname: nickname ?? null,
    level,
    exp: expForLevel(level),
    ivs,
    hp: 0,
    status: null,
    moves: (moves ?? defaultMoves(speciesKey, level)).map((id) => ({ id, pp: MOVES[id].pp })),
    ot: ot ?? null,
  };
  c.hp = calcStats(c).hp;
  return c;
}

export const displayName = (c) => c.nickname || SPECIES[c.species].name;
export const maxHp = (c) => calcStats(c).hp;

export function heal(c) {
  c.hp = maxHp(c);
  c.status = null;
  for (const m of c.moves) m.pp = MOVES[m.id].pp;
}

export function addHp(c, amount) {
  const before = c.hp;
  c.hp = clamp(c.hp + amount, 0, maxHp(c));
  return c.hp - before;
}

/**
 * Give EXP; returns events [{type:'level', level}, {type:'learn', move}, ...].
 * Learning when 4 moves are known is resolved by the caller.
 */
export function gainExp(c, amount) {
  const events = [];
  if (c.level >= MAX_LEVEL) return events;
  c.exp += amount;
  while (c.level < MAX_LEVEL && c.exp >= expForLevel(c.level + 1)) {
    const oldMax = maxHp(c);
    c.level++;
    c.hp += maxHp(c) - oldMax;
    events.push({ type: 'level', level: c.level });
    for (const [l, m] of SPECIES[c.species].learn) {
      if (l === c.level && !c.moves.some((x) => x.id === m)) events.push({ type: 'learn', move: m });
    }
  }
  if (c.level >= MAX_LEVEL) c.exp = expForLevel(MAX_LEVEL);
  return events;
}

export function canEvolve(c) {
  const evo = SPECIES[c.species].evo;
  return evo && c.level >= evo.lvl ? evo.to : null;
}

export function evolve(c) {
  const to = canEvolve(c);
  if (!to) return null;
  const oldMax = maxHp(c);
  c.species = to;
  c.hp = clamp(c.hp + (maxHp(c) - oldMax), 1, maxHp(c));
  return to;
}

export function learnMove(c, moveId, replaceIndex = null) {
  const slot = { id: moveId, pp: MOVES[moveId].pp };
  if (c.moves.length < 4) c.moves.push(slot);
  else if (replaceIndex != null) c.moves[replaceIndex] = slot;
}

/** EXP yielded when this creature faints. */
export function expYield(c, trainer = false) {
  return Math.floor((SPECIES[c.species].baseExp * c.level) / 7 * (trainer ? 1.5 : 1));
}
