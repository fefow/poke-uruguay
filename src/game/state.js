// Live game state. Module-private (never attached to window) and only
// mutated through the game's own systems.
import { ITEMS, MAX_STACK } from '../data/items.js';
import { clamp, safeStorage } from '../core/util.js';

export const MAX_MONEY = 999999;
export const PARTY_MAX = 6;

let S = null;

export function newState({ name, look }) {
  S = {
    version: 1,
    player: { name, look, id: Math.floor(10000 + Math.random() * 89999), money: 3000 },
    rivalName: 'Facu',
    pos: { map: 'casa_jugador', x: 6, y: 5, dir: 'down' },
    party: [],
    box: [],
    bag: {},
    flags: {},
    dex: { seen: [], caught: [] },
    stats: { playtime: 0, steps: 0, battlesWon: 0, moneyEarned: 0, moneySpent: 0, caught: 0 },
    lastHeal: { map: 'casa_jugador', x: 6, y: 5 },
    repel: 0,
    created: Date.now(),
    saveCount: 0,
  };
  return S;
}

export const state = () => S;
export const setState = (s) => (S = s);

export const flag = (k) => !!S.flags[k];
export function setFlag(k, v = true) {
  if (v) S.flags[k] = true;
  else delete S.flags[k];
}

export function addItem(key, qty = 1) {
  if (!ITEMS[key]) return 0;
  const before = S.bag[key] ?? 0;
  const max = ITEMS[key].pocket === 'key' ? 1 : MAX_STACK;
  S.bag[key] = clamp(before + qty, 0, max);
  if (S.bag[key] === 0) delete S.bag[key];
  return (S.bag[key] ?? 0) - before;
}
export const hasItem = (key, qty = 1) => (S.bag[key] ?? 0) >= qty;
export const removeItem = (key, qty = 1) => addItem(key, -qty);

export function earn(amount) {
  const before = S.player.money;
  S.player.money = clamp(before + amount, 0, MAX_MONEY);
  S.stats.moneyEarned += S.player.money - before;
}
export function spend(amount) {
  if (S.player.money < amount) return false;
  S.player.money -= amount;
  S.stats.moneySpent += amount;
  return true;
}
/** Losing a battle. Tracked as spent so the money ledger still balances. */
export function loseMoney(amount) {
  const lost = Math.min(S.player.money, amount);
  S.player.money -= lost;
  S.stats.moneySpent += lost;
  return lost;
}

export function markSeen(key) {
  if (!S.dex.seen.includes(key)) S.dex.seen.push(key);
}
export function markCaught(key) {
  markSeen(key);
  if (!S.dex.caught.includes(key)) S.dex.caught.push(key);
}

export function badgeCount() {
  return ['badge1', 'badge2', 'badge3'].filter(flag).length;
}

// ---- Settings (per device, not part of the save) ------------------------------
const store = safeStorage();
const SETTINGS_KEY = 'urumon:settings';
const DEFAULT_SETTINGS = { textSpeed: 2, music: 0.5, sfx: 0.7, anims: true, hudParty: true };
export const settings = (() => {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(store.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
})();
export function saveSettings() {
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* storage full or blocked: settings stay in memory */ }
}
