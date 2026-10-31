// Capture rules, modelled on the classic handhelds (3rd/4th generation formula):
//  - the species' catch rate (rarity), the foe's remaining HP and any status condition
//  - the ball multiplier (Pokeball 1x, Superball 1.5x, Ultraball 2x, Celeste always catches)
//  - a level factor: low-level creatures are easy to catch, very high ones are stubborn
// Then four shake checks must all pass. Pure functions, so they can be unit-tested.

export const levelFactor = (level) => (level <= 20 ? (30 - level) / 10 : level <= 40 ? 1 : level <= 60 ? 0.85 : 0.7);

/** Modified catch value `a` (0-255). 255 means a sure catch. */
export function catchValue({ catchRate, level, hp, maxHp, ball, status = null }) {
  if (ball >= 255) return 255;
  const statusBonus = status === 'slp' ? 2 : status ? 1.5 : 1;
  const a = (((3 * maxHp - 2 * hp) * catchRate * ball) / (3 * maxHp)) * statusBonus * levelFactor(level);
  return Math.min(255, Math.max(1, a));
}

/** Chance that a single shake check passes. */
export const shakeChance = (a) => (a >= 255 ? 1 : Math.min(1, 1 / Math.pow(255 / a, 0.1875)));

/** Overall chance to catch (four checks). */
export const catchProbability = (a) => shakeChance(a) ** 4;
