// Deterministic PRNG (mulberry32). Battles run on a seeded instance so a
// future server (Supabase edge function) can replay them from seed + actions.

export class Rng {
  #state;
  constructor(seed = Rng.freshSeed()) {
    this.seed = seed >>> 0;
    this.#state = this.seed;
  }
  static freshSeed() {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0];
  }
  next() {
    let t = (this.#state = (this.#state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  chance(p) {
    return this.next() < p;
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  weighted(entries, weightKey = 'w') {
    const total = entries.reduce((s, e) => s + e[weightKey], 0);
    let r = this.next() * total;
    for (const e of entries) {
      r -= e[weightKey];
      if (r < 0) return e;
    }
    return entries.at(-1);
  }
}

/** Shared RNG for non-critical randomness (overworld, NPC wandering). */
export const worldRng = new Rng();
