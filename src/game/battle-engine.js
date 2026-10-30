// Pure battle rules (no DOM). Produces event lists that the scene animates.
// Runs on a seeded Rng and records every player action, so a battle can be
// replayed and verified server-side later (seed + actions => same result).
import { MOVES, STRUGGLE } from '../data/moves.js';
import { SPECIES } from '../data/species.js';
import { ITEMS } from '../data/items.js';
import { TYPES, effectiveness } from '../data/types.js';
import { Rng } from '../core/rng.js';
import { catchValue, shakeChance } from './capture.js';
import { calcStats, displayName, maxHp, expYield } from './creature.js';
import { clamp } from '../core/util.js';

const STAGE_KEYS = ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'];
const STATUS_NAMES = { brn: 'quemado', psn: 'envenenado', par: 'paralizado', slp: 'dormido' };
export const STATUS_SHORT = { brn: 'QUE', psn: 'ENV', par: 'PAR', slp: 'DOR' };
const IMMUNE = { brn: 'fuego', psn: 'veneno', par: 'electrico' };

const stageMult = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
const accMult = (s) => (s >= 0 ? (3 + s) / 3 : 3 / (3 - s));

export function makeBattler(c) {
  return { c, stages: Object.fromEntries(STAGE_KEYS.map((k) => [k, 0])), sleep: 0 };
}

export function effStat(b, key) {
  let v = calcStats(b.c)[key] * stageMult(b.stages[key]);
  if (key === 'spe' && b.c.status === 'par') v *= 0.5;
  return Math.max(1, Math.floor(v));
}

/** Core damage formula (exported for tests). */
export function computeDamage(att, def, move, rng, { forceCrit = null, forceRoll = null } = {}) {
  const sp = SPECIES[att.c.species];
  const dsp = SPECIES[def.c.species];
  const eff = effectiveness(move.type, dsp.types);
  if (eff === 0) return { dmg: 0, eff, crit: false };
  const phys = move.cat === 'fis';
  const critChance = move.fx.crit ? 1 / 8 : 1 / 16;
  const crit = forceCrit ?? rng.chance(critChance);
  let A = effStat(att, phys ? 'atk' : 'spa');
  let D = effStat(def, phys ? 'def' : 'spd');
  if (crit) {
    // Critical hits ignore the attacker's drops and defender's boosts.
    A = Math.max(A, calcStats(att.c)[phys ? 'atk' : 'spa']);
    D = Math.min(D, calcStats(def.c)[phys ? 'def' : 'spd']);
  }
  if (phys && att.c.status === 'brn') A = Math.floor(A / 2);
  const L = att.c.level;
  let base = Math.floor(Math.floor((Math.floor((2 * L) / 5 + 2) * move.power * A) / D) / 50) + 2;
  const stab = sp.types.includes(move.type) ? 1.5 : 1;
  const roll = forceRoll ?? rng.int(85, 100) / 100;
  const dmg = Math.max(1, Math.floor(base * stab * eff * (crit ? 1.5 : 1) * roll));
  return { dmg, eff, crit };
}

export class BattleEngine {
  #rng;
  #log = [];
  constructor({ party, foes, wild = false, trainer = null, seed }) {
    this.#rng = new Rng(seed);
    this.seed = this.#rng.seed;
    this.wild = wild;
    this.trainer = trainer;
    this.party = party;
    this.foes = foes;
    const first = party.findIndex((c) => c.hp > 0);
    this.p = makeBattler(party[first]);
    this.pIndex = first;
    this.f = makeBattler(foes[0]);
    this.fIndex = 0;
    this.turnNo = 0;
    this.runAttempts = 0;
    this.participants = new Set([party[first].uid]);
    this.aiItems = [...(trainer?.items ?? [])];
    this.over = null;
  }

  get log() {
    return { seed: this.seed, actions: this.#log.slice() };
  }

  name(side) {
    const b = side === 0 ? this.p : this.f;
    const n = displayName(b.c);
    if (side === 0) return n;
    return this.wild ? `${n} salvaje` : `${n} rival`;
  }

  // --------------------------------------------------------------- turns
  /** action: {type:'move', index} | {type:'switch', index} | {type:'item', item, target} | {type:'ball', item} | {type:'run'} */
  turn(action) {
    if (this.over) return [];
    // Running from a trainer is refused without spending the turn: the foe does not get a free attack.
    if (action.type === 'run' && !this.wild) return [{ t: 'text', msg: '¡No podés huir de un combate contra un entrenador!' }];
    this.#log.push({ t: this.turnNo, ...action });
    this.turnNo++;
    const ev = [];
    const foeAct = this.#aiChoose();

    // Non-move player actions resolve first.
    if (action.type === 'run') {
      if (this.#tryRun(ev)) return ev;
    } else if (action.type === 'switch') {
      this.#doSwitch(0, action.index, ev);
    } else if (action.type === 'item') {
      this.#useItem(action.item, action.target, ev);
    } else if (action.type === 'ball') {
      if (this.#throwBall(action.item, ev)) return ev;
    }

    if (foeAct.type === 'item') this.#aiUseItem(foeAct.item, ev);

    const pMove = action.type === 'move' ? this.#pickMove(this.p, action.index) : null;
    const fMove = foeAct.type === 'move' ? this.#pickMove(this.f, foeAct.index) : null;
    const order = [];
    if (pMove && fMove) {
      const pp = pMove.move.fx.prio ?? 0;
      const fp = fMove.move.fx.prio ?? 0;
      const ps = effStat(this.p, 'spe');
      const fs = effStat(this.f, 'spe');
      const pFirst = pp !== fp ? pp > fp : ps !== fs ? ps > fs : this.#rng.chance(0.5);
      order.push(...(pFirst ? [[0, pMove], [1, fMove]] : [[1, fMove], [0, pMove]]));
    } else if (pMove) order.push([0, pMove]);
    else if (fMove) order.push([1, fMove]);

    for (const [side, m] of order) {
      const user = side === 0 ? this.p : this.f;
      if (user.c.hp <= 0) continue;
      const target = side === 0 ? this.f : this.p;
      if (target.c.hp <= 0) continue;
      this.#execMove(side, m, ev);
      if (this.#checkFaints(ev)) break;
    }
    if (!this.over) this.#endOfTurn(ev);
    return ev;
  }

  #pickMove(b, index) {
    const usable = b.c.moves.filter((m) => m.pp > 0);
    if (!usable.length) return { move: STRUGGLE, slot: null };
    const slot = b.c.moves[index] && b.c.moves[index].pp > 0 ? b.c.moves[index] : usable[0];
    return { move: MOVES[slot.id], slot };
  }

  #execMove(side, { move, slot }, ev) {
    const user = side === 0 ? this.p : this.f;
    const target = side === 0 ? this.f : this.p;
    const uName = this.name(side);
    // Status that prevents acting
    if (user.c.status === 'slp') {
      if (user.sleep > 0) {
        user.sleep--;
        ev.push({ t: 'text', msg: `${uName} está dormido.` }, { t: 'statusAnim', side, status: 'slp' });
        return;
      }
      user.c.status = null;
      ev.push({ t: 'text', msg: `¡${uName} se despertó!` }, { t: 'hud', php: this.p.c.hp, fhp: this.f.c.hp });
    }
    if (user.c.status === 'par' && this.#rng.chance(0.25)) {
      ev.push({ t: 'text', msg: `¡${uName} está paralizado! No se puede mover.` }, { t: 'statusAnim', side, status: 'par' });
      return;
    }
    if (slot) slot.pp = Math.max(0, slot.pp - 1);
    ev.push({ t: 'text', msg: `¡${uName} usó ${move.name}!` });
    // Accuracy
    if (!move.fx.never && (move.acc < 100 || user.stages.acc !== 0 || target.stages.eva !== 0)) {
      const p = (move.acc / 100) * accMult(user.stages.acc - target.stages.eva);
      if (!this.#rng.chance(p)) {
        ev.push({ t: 'text', msg: '¡Pero falló!' });
        return;
      }
    }
    const tName = this.name(1 - side);
    if (move.cat === 'est') {
      ev.push({ t: 'anim', side, move: move.type, kind: 'status' });
      this.#applyEffects(side, move, ev, true);
      return;
    }
    const r = computeDamage(user, target, move, this.#rng);
    if (r.eff === 0) {
      ev.push({ t: 'text', msg: `No afecta a ${tName}…` });
      return;
    }
    ev.push({ t: 'anim', side, move: move.type, kind: move.cat });
    const dealt = Math.min(target.c.hp, r.dmg);
    target.c.hp -= dealt;
    ev.push({ t: 'damage', side: 1 - side, amount: dealt, eff: r.eff, hp: target.c.hp });
    if (r.crit) ev.push({ t: 'text', msg: '¡Golpe crítico!' });
    if (r.eff > 1) ev.push({ t: 'text', msg: '¡Es súper eficaz!' });
    else if (r.eff < 1) ev.push({ t: 'text', msg: 'No es muy eficaz…' });
    if (move.fx.drain && dealt > 0) {
      const healed = Math.min(maxHp(user.c) - user.c.hp, Math.max(1, Math.floor(dealt * move.fx.drain)));
      if (healed > 0) {
        user.c.hp += healed;
        ev.push({ t: 'heal', side, hp: user.c.hp }, { t: 'text', msg: `¡${tName} perdió energía!` });
      }
    }
    if (move.fx.recoil && dealt > 0) {
      const rec = Math.min(user.c.hp, Math.max(1, Math.floor(dealt * move.fx.recoil)));
      user.c.hp -= rec;
      ev.push({ t: 'damage', side, amount: rec, eff: 1, hp: user.c.hp }, { t: 'text', msg: `${uName} también se lastimó.` });
    }
    if (target.c.hp > 0 || move.fx.selfAlways) this.#applyEffects(side, move, ev, false);
  }

  #applyEffects(side, move, ev, isStatusMove) {
    const user = side === 0 ? this.p : this.f;
    const target = side === 0 ? this.f : this.p;
    const fx = move.fx;
    const chance = isStatusMove ? 1 : fx.chance ?? 1;
    let did = false;
    if (fx.heal) {
      const amt = Math.min(maxHp(user.c) - user.c.hp, Math.floor(maxHp(user.c) * fx.heal));
      if (amt > 0) {
        user.c.hp += amt;
        ev.push({ t: 'heal', side, hp: user.c.hp }, { t: 'text', msg: `${this.name(side)} recuperó energía.` });
      } else ev.push({ t: 'text', msg: '¡Sus PS ya están al máximo!' });
      did = true;
    }
    if (fx.status && target.c.hp > 0 && this.#rng.chance(chance)) {
      const ok = this.#inflict(1 - side, fx.status, ev);
      if (!ok && isStatusMove) ev.push({ t: 'text', msg: '¡Pero no tuvo efecto!' });
      did = true;
    }
    if (fx.self && (isStatusMove || fx.selfAlways || this.#rng.chance(chance))) {
      for (const [k, d] of Object.entries(fx.self)) this.#changeStage(side, k, d, ev);
      did = true;
    }
    if (fx.foe && target.c.hp > 0 && this.#rng.chance(chance)) {
      for (const [k, d] of Object.entries(fx.foe)) this.#changeStage(1 - side, k, d, ev);
      did = true;
    }
    if (isStatusMove && !did) ev.push({ t: 'text', msg: '¡Pero no pasó nada!' });
  }

  #inflict(side, status, ev) {
    const b = side === 0 ? this.p : this.f;
    if (b.c.status) return false;
    if (SPECIES[b.c.species].types.includes(IMMUNE[status])) return false;
    b.c.status = status;
    if (status === 'slp') b.sleep = this.#rng.int(1, 3);
    ev.push({ t: 'statusAnim', side, status }, { t: 'hud', php: this.p.c.hp, fhp: this.f.c.hp }, { t: 'text', msg: `¡${this.name(side)} está ${STATUS_NAMES[status]}!` });
    return true;
  }

  #changeStage(side, key, delta, ev) {
    const b = side === 0 ? this.p : this.f;
    const before = b.stages[key];
    b.stages[key] = clamp(before + delta, -6, 6);
    const names = { atk: 'Ataque', def: 'Defensa', spa: 'At. Esp.', spd: 'Def. Esp.', spe: 'Velocidad', acc: 'Precisión', eva: 'Evasión' };
    const n = this.name(side);
    if (b.stages[key] === before) {
      ev.push({ t: 'text', msg: `¡${names[key]} de ${n} no puede ${delta > 0 ? 'subir' : 'bajar'} más!` });
      return;
    }
    const big = Math.abs(delta) >= 2 ? ' mucho' : '';
    ev.push({ t: 'stat', side, up: delta > 0 }, { t: 'text', msg: `¡${delta > 0 ? 'Subió' : 'Bajó'}${big} ${names[key] === 'Defensa' || names[key] === 'Velocidad' || names[key] === 'Precisión' || names[key] === 'Evasión' ? 'la' : 'el'} ${names[key]} de ${n}!` });
  }

  #endOfTurn(ev) {
    for (const side of [0, 1]) {
      const b = side === 0 ? this.p : this.f;
      if (b.c.hp <= 0) continue;
      if (b.c.status === 'brn' || b.c.status === 'psn') {
        const d = Math.min(b.c.hp, Math.max(1, Math.floor(maxHp(b.c) / 8)));
        b.c.hp -= d;
        ev.push({ t: 'statusAnim', side, status: b.c.status }, { t: 'damage', side, amount: d, eff: 1, hp: b.c.hp },
          { t: 'text', msg: b.c.status === 'brn' ? `${this.name(side)} sufre por la quemadura.` : `${this.name(side)} sufre por el veneno.` });
      }
    }
    this.#checkFaints(ev);
  }

  /** Returns true if the battle loop for this turn should stop. */
  #checkFaints(ev) {
    let stop = false;
    if (this.f.c.hp <= 0 && !this.f.fainted) {
      this.f.fainted = true;
      ev.push({ t: 'faint', side: 1 }, { t: 'text', msg: `¡${this.name(1)} se debilitó!` }, { t: 'exp', foe: this.f.c });
      stop = true;
      const next = this.foes.findIndex((c) => c.hp > 0);
      if (next < 0) {
        this.over = 'win';
        ev.push({ t: 'end', result: 'win' });
      } else {
        ev.push({ t: 'foeNext', index: next });
      }
    }
    if (this.p.c.hp <= 0 && !this.p.fainted) {
      this.p.fainted = true;
      ev.push({ t: 'faint', side: 0 }, { t: 'text', msg: `¡${this.name(0)} se debilitó!` });
      stop = true;
      if (!this.party.some((c) => c.hp > 0)) {
        this.over = this.over ?? 'lose';
        if (this.over === 'lose') ev.push({ t: 'end', result: 'lose' });
      } else if (!this.over) ev.push({ t: 'needSwitch' });
    }
    return stop;
  }

  /** Called by the scene after 'foeNext'. */
  sendFoe(index) {
    this.fIndex = index;
    this.f = makeBattler(this.foes[index]);
    this.usedItemThisMon = false;
    this.participants = new Set([this.p.c.uid]);
    return [{ t: 'foeSent', index }, { t: 'text', msg: `¡${this.trainer?.name ?? 'El rival'} envió a ${displayName(this.f.c)}!` }];
  }

  /** Forced switch after a faint (does not use a turn). */
  forceSwitch(index) {
    const ev = [];
    this.#doSwitch(0, index, ev, true);
    return ev;
  }

  /** Optional switch offered between a trainer's creatures (no turn is used). */
  freeSwitch(index) {
    const ev = [];
    this.#doSwitch(0, index, ev, false);
    return ev;
  }

  #doSwitch(side, index, ev, forced = false) {
    if (side !== 0) return;
    if (!forced) ev.push({ t: 'text', msg: `¡${displayName(this.p.c)}, volvé!` }, { t: 'recall', side: 0 });
    this.pIndex = index;
    this.p = makeBattler(this.party[index]);
    this.participants.add(this.p.c.uid);
    ev.push({ t: 'send', side: 0, index }, { t: 'text', msg: `¡Adelante, ${displayName(this.p.c)}!` });
  }

  #tryRun(ev) {
    if (!this.wild) {
      ev.push({ t: 'text', msg: '¡No podés huir de un combate contra un entrenador!' });
      return false;
    }
    this.runAttempts++;
    const ps = effStat(this.p, 'spe');
    const fs = effStat(this.f, 'spe');
    const p = clamp(0.5 + (ps - fs) / (2 * fs) + 0.15 * (this.runAttempts - 1), 0.25, 1);
    if (ps >= fs || this.#rng.chance(p)) {
      this.over = 'run';
      ev.push({ t: 'text', msg: '¡Escapaste sin problemas!' }, { t: 'end', result: 'run' });
      return true;
    }
    ev.push({ t: 'text', msg: '¡No pudiste escapar!' });
    return false;
  }

  /** Returns true if battle ended (caught). Ball consumption is handled by the scene. */
  #throwBall(itemKey, ev) {
    const ball = ITEMS[itemKey]?.ball;
    if (!ball) return false;
    ev.push({ t: 'throw', item: itemKey });
    if (!this.wild) {
      ev.push({ t: 'block' }, { t: 'text', msg: '¡El entrenador bloqueó la Pokeball!' }, { t: 'text', msg: '¡No se puede robar!' });
      return false;
    }
    const c = this.f.c;
    let shakes = 0;
    if (ball === 'safari') {
      // Safari: wild, strong creatures. About 50/50 with one bait, better with more, worse with none.
      const base = [0.3, 0.5, 0.65, 0.75][Math.min(3, this.f.bait ?? 0)];
      const p = Math.min(0.95, base + (1 - c.hp / maxHp(c)) * 0.15);
      const per = p ** 0.25;
      while (shakes < 4 && this.#rng.next() < per) shakes++;
    } else {
    const a = catchValue({ catchRate: SPECIES[c.species].catchRate, level: c.level, hp: c.hp, maxHp: maxHp(c), ball, status: c.status });
    if (a >= 255) shakes = 4;
    else {
      const b = 65536 * shakeChance(a);
      while (shakes < 4 && this.#rng.int(0, 65535) < b) shakes++;
    }
    }
    const caught = shakes === 4;
    ev.push({ t: 'shakes', n: Math.min(shakes, 3), caught });
    if (caught) {
      this.over = 'caught';
      ev.push({ t: 'text', msg: `¡Atrapaste a ${displayName(c)}!` }, { t: 'end', result: 'caught' });
      return true;
    }
    ev.push({ t: 'text', msg: ['¡Se escapó de la Pokeball!', '¡Casi! Faltó muy poco.', '¡Parecía capturado!', '¡Por un pelo!'][shakes] });
    return false;
  }

  #useItem(itemKey, targetIndex, ev) {
    const it = ITEMS[itemKey];
    const c = this.party[targetIndex];
    ev.push({ t: 'text', msg: `Usaste ${it.name}.` });
    if (it.bait) {
      this.f.bait = Math.min(3, (this.f.bait ?? 0) + 1);
      ev.push({ t: 'text', msg: this.f.bait >= 3 ? `¡${displayName(this.f.c)} está encantado con vos!` : `¡${displayName(this.f.c)} se encariña con la galleta!` });
      return;
    }
    if (it.xstat) {
      this.#changeStage(0, it.xstat, 1, ev);
      return;
    }
    const res = applyItem(itemKey, c);
    if (res) {
      if (c === this.p.c) ev.push({ t: 'heal', side: 0, hp: c.hp }, { t: 'hud', php: this.p.c.hp, fhp: this.f.c.hp });
      ev.push({ t: 'text', msg: res });
    }
  }

  // ------------------------------------------------------------------ AI
  #aiChoose() {
    const f = this.f;
    const ai = this.trainer?.ai ?? (this.wild ? 'wild' : 'basic');
    const hpRatio = f.c.hp / maxHp(f.c);
    if (ai === 'smart' && hpRatio < 0.25 && this.aiItems.length && !this.usedItemThisMon) {
      this.usedItemThisMon = true;
      return { type: 'item', item: this.aiItems.shift() };
    }
    const moves = f.c.moves.map((m, i) => ({ m, i, data: MOVES[m.id] })).filter((x) => x.m.pp > 0);
    if (!moves.length) return { type: 'move', index: 0 };
    if (ai === 'wild') return { type: 'move', index: this.#rng.pick(moves).i };
    const scored = moves.map((x) => ({ ...x, score: this.#scoreMove(x.data, hpRatio) }));
    if (ai === 'basic' && this.#rng.chance(0.35)) return { type: 'move', index: this.#rng.pick(moves).i };
    scored.sort((a, b) => b.score - a.score);
    // A little noise so smart trainers are not perfectly predictable.
    const top = scored.filter((s) => s.score >= scored[0].score * 0.85);
    return { type: 'move', index: this.#rng.pick(top).i };
  }

  #scoreMove(move, hpRatio) {
    const target = this.p;
    if (move.cat !== 'est') {
      const eff = effectiveness(move.type, SPECIES[target.c.species].types);
      const stab = SPECIES[this.f.c.species].types.includes(move.type) ? 1.5 : 1;
      const phys = move.cat === 'fis';
      const ratio = effStat(this.f, phys ? 'atk' : 'spa') / effStat(target, phys ? 'def' : 'spd');
      return move.power * eff * stab * ratio * (move.acc / 100) * (move.fx.recoil ? 0.85 : 1);
    }
    let s = 10;
    if (move.fx.heal) s = hpRatio < 0.45 ? 140 : 0;
    if (move.fx.status) s = target.c.status ? 0 : 55;
    if (move.fx.self) s = hpRatio > 0.6 && Object.keys(move.fx.self).every((k) => this.f.stages[k] < 2) ? 50 : 0;
    if (move.fx.foe) s = Object.keys(move.fx.foe).every((k) => target.stages[k] > -2) ? 30 : 0;
    return s;
  }

  #aiUseItem(itemKey, ev) {
    const it = ITEMS[itemKey];
    ev.push({ t: 'text', msg: `¡${this.trainer.name} usó ${it.name}!` });
    const res = applyItem(itemKey, this.f.c);
    ev.push({ t: 'heal', side: 1, hp: this.f.c.hp }, { t: 'hud', php: this.p.c.hp, fhp: this.f.c.hp });
    if (res) ev.push({ t: 'text', msg: res.replace(displayName(this.f.c), this.name(1)) });
  }

  /** EXP shares: [[creature, amount]] for living participants. */
  expShares(foe) {
    const living = this.party.filter((c) => c.hp > 0 && this.participants.has(c.uid));
    if (!living.length) return [];
    const total = expYield(foe, !this.wild);
    const each = Math.max(1, Math.floor(total / living.length));
    return living.map((c) => [c, each]);
  }
}

/** Shared item effect (battle + overworld). Returns a message or null if it had no effect. */
export function applyItem(itemKey, c) {
  const it = ITEMS[itemKey];
  if (!it || !c) return null;
  const name = displayName(c);
  if (it.revive) {
    if (c.hp > 0) return null;
    c.hp = Math.max(1, Math.floor(maxHp(c) * it.revive));
    c.status = null;
    return `¡${name} se reanimó!`;
  }
  if (c.hp <= 0) return null;
  let msg = null;
  if (it.heal && c.hp < maxHp(c)) {
    const before = c.hp;
    c.hp = Math.min(maxHp(c), c.hp + it.heal);
    msg = `${name} ${it.mate ? 'tomó un mate y ' : ''}recuperó ${c.hp - before} PS.`;
  }
  if (it.cure && c.status && (it.cure === 'all' || it.cure === c.status)) {
    c.status = null;
    msg = msg ? `${msg} ¡Y se curó!` : `¡${name} se curó!`;
  }
  if (it.pp) {
    let any = false;
    for (const m of c.moves) {
      const max = MOVES[m.id].pp;
      if (m.pp < max) { m.pp = Math.min(max, m.pp + it.pp); any = true; }
    }
    if (any) msg = `Se restauraron los PP de ${name}.`;
  }
  return msg;
}

export { TYPES };
