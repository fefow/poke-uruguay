// Long, arranged songs for WebAudio: a list of sections (melody, counter melody, chords, accompaniment style,
// drums) played in a fixed order and looped without a gap. Used for the open-world route theme, which used to
// be a 12-second loop. Everything is synthesised: soft plucked guitar, charango, flute, a GBA-style soft pulse,
// finger bass and a light bombo. No audio files.

export type Section = {
  bars: number; // 4/4 bars; every part below must add up to bars * 8 eighths
  chords: string; // 'C 8 Am 4 G7 4': chord name and length in eighths
  lead?: string; // 'G4 2 C5 2 - 4': note (or '-') and length in eighths
  leadInst?: Inst;
  counter?: string;
  counterInst?: Inst;
  comp: Comp[]; // accompaniment styles layered under the tune
  drums?: string; // one bar of sixteenths: b bombo, r rim of the bombo, h brush, - rest
  transpose?: number; // semitones for melody and chords
};
type Inst = 'flute' | 'charango' | 'pulse' | 'guitar';
type Comp = 'arp' | 'strum' | 'milonga' | 'pad' | 'tremolo' | 'bass';
export type Song = { bpm: number; sections: Record<string, Section>; order: string[] };

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function noteMidi(n: string): number {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  if (!m) throw new Error(`bad note ${n}`);
  return (Number(m[3]) + 1) * 12 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const QUALITY: Record<string, number[]> = {
  '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
  sus4: [0, 5, 7], add9: [0, 4, 7, 14],
};
/** Chord name to { root pitch class, intervals }. */
export function parseChord(name: string, transpose = 0) {
  const m = /^([A-G])(#|b)?(.*)$/.exec(name);
  if (!m || !QUALITY[m[3]]) throw new Error(`bad chord ${name}`);
  const root = (NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + transpose + 24) % 12;
  return { root, iv: QUALITY[m[3]] };
}

export function pairs(str: string): [string, number][] {
  const t = str.trim().split(/\s+/);
  const out: [string, number][] = [];
  for (let i = 0; i < t.length; i += 2) out.push([t[i], Number(t[i + 1])]);
  return out;
}
export const partLength = (str: string) => pairs(str).reduce((s, [, d]) => s + d, 0);

// Guitar-like voicing: a bass note between E2 and D#3, the chord tones packed between G3 and G4.
function voicing(ch: { root: number; iv: number[] }) {
  const bass = 40 + ((ch.root - 4 + 12) % 12);
  const up = ch.iv.map((i) => 55 + ((ch.root + i - 7 + 24) % 12)).sort((a, b) => a - b);
  const fifth = bass + (ch.iv.includes(6) ? 6 : 7);
  return { bass, fifth, up };
}

// ---- Instruments ----------------------------------------------------------
type Ctx = { ac: AudioContext; out: AudioNode; noise: AudioBuffer };

function env(g: GainNode, t: number, vol: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

/** Plucked nylon string: saw + triangle through a closing low-pass, long exponential decay. */
function pluck(c: Ctx, f: number, t: number, vol: number, { decay = 1.4, bright = 7, detune = 0 } = {}) {
  const { ac } = c;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.6;
  lp.frequency.setValueAtTime(Math.min(f * bright, 5200), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.4, 260), t + 0.3);
  const g = ac.createGain();
  env(g, t, vol, 0.004, decay);
  const end = t + decay + 0.05;
  const oscs = detune ? [f, f * (1 + detune)] : [f];
  for (const fr of oscs) {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = fr;
    o.connect(lp);
    o.start(t);
    o.stop(end);
  }
  const body = ac.createOscillator();
  body.type = 'triangle';
  body.frequency.value = f;
  const bg = ac.createGain();
  bg.gain.value = 0.8;
  body.connect(bg).connect(lp);
  body.start(t);
  body.stop(end);
  lp.connect(g).connect(c.out);
}

/** Soft wooden flute: sine with a little triangle, slow attack, delayed vibrato and a breath at the start. */
function flute(c: Ctx, f: number, t: number, dur: number, vol: number) {
  const { ac } = c;
  const g = ac.createGain();
  const a = Math.min(0.07, dur * 0.3);
  const rel = Math.min(0.12, dur * 0.3);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol * 0.9, Math.max(t + a, t + dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
  const end = t + dur + 0.1;
  const o1 = ac.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = f;
  const o2 = ac.createOscillator();
  o2.type = 'triangle';
  o2.frequency.value = f;
  const g2 = ac.createGain();
  g2.gain.value = 0.35;
  if (dur > 0.45) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = 5;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(f * 0.008, t + Math.min(0.5, dur * 0.6));
    lfo.connect(depth);
    depth.connect(o1.frequency);
    depth.connect(o2.frequency);
    lfo.start(t);
    lfo.stop(end);
  }
  o1.connect(g);
  o2.connect(g2).connect(g);
  g.connect(c.out);
  o1.start(t);
  o2.start(t);
  o1.stop(end);
  o2.stop(end);
  // Breath: a short puff of filtered noise.
  const src = ac.createBufferSource();
  src.buffer = c.noise;
  const hp = ac.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.value = Math.min(f * 3, 6000);
  hp.Q.value = 1.2;
  const ng = ac.createGain();
  env(ng, t, vol * 0.18, 0.01, 0.08);
  src.connect(hp).connect(ng).connect(c.out);
  src.start(t, Math.random() * 0.5, 0.12);
}

const waves = new WeakMap<AudioContext, PeriodicWave>();
/** The handheld lead, but with a 50% duty and a gentle filter so it sounds round rather than buzzy. */
function softPulse(c: Ctx, f: number, t: number, dur: number, vol: number) {
  const { ac } = c;
  let w = waves.get(ac);
  if (!w) {
    const n = 24;
    const re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k += 2) im[k] = 1 / k ** 1.4; // odd harmonics, rolled off faster than a square
    w = ac.createPeriodicWave(re, im);
    waves.set(ac, w);
  }
  const o = ac.createOscillator();
  o.setPeriodicWave(w);
  o.frequency.value = f;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.setValueAtTime(vol * 0.75, t + Math.max(0.02, dur * 0.6));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (dur > 0.45) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = 5.5;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(f * 0.01, t + 0.4);
    lfo.connect(depth).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.02);
  }
  o.connect(g).connect(c.out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function fingerBass(c: Ctx, f: number, t: number, vol: number, decay = 0.9) {
  const { ac } = c;
  const o = ac.createOscillator();
  o.type = 'triangle';
  o.frequency.value = f;
  const s = ac.createOscillator(); // a quiet octave sine gives the note some roundness on small speakers
  s.type = 'sine';
  s.frequency.value = f * 2;
  const sg = ac.createGain();
  sg.gain.value = 0.25;
  const g = ac.createGain();
  env(g, t, vol, 0.01, decay);
  o.connect(g);
  s.connect(sg).connect(g);
  g.connect(c.out);
  o.start(t);
  s.start(t);
  o.stop(t + decay + 0.05);
  s.stop(t + decay + 0.05);
}

function pad(c: Ctx, f: number, t: number, dur: number, vol: number) {
  const { ac } = c;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.5, dur * 0.4));
  g.gain.setValueAtTime(vol, t + dur * 0.75);
  g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
  for (const d of [-0.003, 0.003]) {
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f * (1 + d);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.35);
  }
  g.connect(c.out);
}

function drum(c: Ctx, kind: string, t: number) {
  const { ac } = c;
  if (kind === 'b') {
    // Bombo legüero: a soft low thump with a skin slap.
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
    const g = ac.createGain();
    env(g, t, 0.7, 0.005, 0.32);
    o.connect(g).connect(c.out);
    o.start(t);
    o.stop(t + 0.4);
  }
  const src = ac.createBufferSource();
  src.buffer = c.noise;
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  if (kind === 'b') {
    f.type = 'lowpass';
    f.frequency.value = 700;
    env(g, t, 0.12, 0.003, 0.06);
  } else if (kind === 'r') {
    // Wooden rim of the bombo: short and hollow.
    f.type = 'bandpass';
    f.frequency.value = 1700;
    f.Q.value = 3;
    env(g, t, 0.3, 0.002, 0.05);
  } else {
    f.type = 'highpass';
    f.frequency.value = 4500;
    env(g, t, 0.06, 0.004, 0.07);
  }
  src.connect(f).connect(g).connect(c.out);
  src.start(t, Math.random() * 0.5, 0.15);
}

// ---- Arrangement to events -----------------------------------------------------------
type Ev = { at: number; play: (c: Ctx, t: number, e: number) => void }; // at: eighths from the song start

function lead(inst: Inst, midi: number, len: number, vol: number): Ev['play'] {
  return (c, t, e) => {
    const f = hz(midi), dur = len * e;
    if (inst === 'flute') flute(c, f, t, dur * 0.95, vol);
    else if (inst === 'pulse') softPulse(c, f, t, dur * 0.9, vol * 0.8);
    else if (inst === 'charango') {
      pluck(c, f, t, vol * 1.3, { decay: Math.max(0.6, Math.min(1.8, dur * 1.3)), bright: 9, detune: 0.004 });
      // Long notes on the charango are played trémolo, as a folk player would sustain them.
      if (dur > 0.9) for (let x = t + e * 0.5; x < t + dur - e * 0.3; x += e * 0.5) pluck(c, f, x, vol * 0.8, { decay: 0.5, bright: 8, detune: 0.004 });
    } else pluck(c, f, t, vol, { decay: 1.6 });
  };
}

function melodyEvents(evs: Ev[], start: number, part: string, inst: Inst, vol: number, tr: number) {
  let at = start;
  for (const [n, d] of pairs(part)) {
    if (n !== '-') evs.push({ at, play: lead(inst, noteMidi(n) + tr, d, vol) });
    at += d;
  }
}

function compEvents(evs: Ev[], start: number, s: Section) {
  const tr = s.transpose ?? 0;
  // Chord at each eighth of the section.
  const at: ReturnType<typeof voicing>[] = [];
  const spans: { from: number; len: number; v: ReturnType<typeof voicing> }[] = [];
  for (const [name, d] of pairs(s.chords)) {
    const v = voicing(parseChord(name, tr));
    spans.push({ from: at.length, len: d, v });
    for (let i = 0; i < d; i++) at.push(v);
  }
  const P = (m: number, vol: number, o = {}) => ((c: Ctx, t: number) => pluck(c, hz(m), t, vol, o)) as Ev['play'];
  for (let i = 0; i < at.length; i++) {
    const v = at[i], pos = i % 8, t = start + i;
    const top = v.up;
    for (const style of s.comp) {
      if (style === 'arp') {
        // Finger-picked pattern: bass, then the chord tones rolling up and down.
        const pick = [v.bass, top[1], top[2], top[top.length - 1] + (top.length < 4 ? 12 : 0), v.fifth, top[2], top[1], top[0]][pos];
        evs.push({ at: t, play: P(pick, pos === 0 || pos === 4 ? 0.34 : 0.2, { decay: pos === 0 ? 2 : 1.3 }) });
      } else if (style === 'strum') {
        // Rasguido: bass on 1 and 3, soft down/up strums in between.
        if (pos === 0 || pos === 4) evs.push({ at: t, play: P(pos === 0 ? v.bass : v.fifth, 0.32, { decay: 1.6 }) });
        if (pos === 2 || pos === 3 || pos === 6 || pos === 7) {
          const up = pos === 3 || pos === 7;
          const notes = up ? [...top].reverse() : top;
          evs.push({ at: t, play: (c, tt) => notes.forEach((m, k) => pluck(c, hz(m), tt + k * 0.014, up ? 0.07 : 0.1, { decay: 0.7, bright: 5 })) });
        }
      } else if (style === 'milonga') {
        // 3+3+2 milonga bass with muted chord stabs on the off beats.
        if (pos === 0 || pos === 3 || pos === 6) {
          const m = pos === 3 ? v.fifth : pos === 6 ? v.bass + 12 : v.bass;
          evs.push({ at: t, play: (c, tt) => fingerBass(c, hz(m), tt, pos === 6 ? 0.4 : 0.55, 0.7) });
        }
        if (pos === 2 || pos === 5 || pos === 7) evs.push({ at: t, play: (c, tt) => top.forEach((m, k) => pluck(c, hz(m), tt + k * 0.01, 0.07, { decay: 0.35, bright: 4 })) });
      } else if (style === 'bass') {
        if (pos === 0 || pos === 4) evs.push({ at: t, play: (c, tt) => fingerBass(c, hz(pos === 0 ? v.bass : v.fifth), tt, 0.5, 1.1) });
      } else if (style === 'tremolo') {
        // Charango trémolo on the top of the chord, two notes per eighth.
        for (const half of [0, 0.5]) {
          const m = top[(i * 2 + half * 2) % top.length] + 12;
          evs.push({ at: t + half, play: P(m, 0.05, { decay: 0.45, bright: 8, detune: 0.004 }) });
        }
      }
    }
  }
  if (s.comp.includes('pad')) {
    for (const sp of spans) for (const m of sp.v.up) evs.push({ at: start + sp.from, play: (c, t, e) => pad(c, hz(m), t, sp.len * e, 0.045) });
  }
  if (s.drums) {
    for (let i = 0; i < s.bars * 16; i++) {
      const k = s.drums[i % s.drums.length];
      if (k !== '-') evs.push({ at: start + i / 2, play: (c, t) => drum(c, k, t) });
    }
  }
}

/** Flattens a song into timed events once; returns them sorted plus the total length in eighths. */
export function arrange(song: Song) {
  const evs: Ev[] = [];
  let at = 0;
  for (const id of song.order) {
    const s = song.sections[id];
    const tr = s.transpose ?? 0;
    if (s.lead) melodyEvents(evs, at, s.lead, s.leadInst ?? 'flute', 0.42, tr);
    if (s.counter) melodyEvents(evs, at, s.counter, s.counterInst ?? 'flute', 0.2, tr);
    compEvents(evs, at, s);
    at += s.bars * 8;
  }
  evs.sort((a, b) => a.at - b.at);
  return { evs, length: at };
}

const noiseBufs = new WeakMap<AudioContext, AudioBuffer>();
/** Starts a song on `out`; call the returned tick() every ~200 ms to keep scheduling ahead. */
export function startSong(ac: AudioContext, out: AudioNode, song: Song) {
  let noise = noiseBufs.get(ac);
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBufs.set(ac, noise);
  }
  const c: Ctx = { ac, out, noise };
  const { evs, length } = arrange(song);
  const e = 60 / song.bpm / 2;
  let origin = ac.currentTime + 0.08;
  let i = 0;
  const tick = () => {
    const horizon = ac.currentTime + 1.2;
    while (origin + evs[i].at * e < horizon) {
      // A hair of timing and no two notes exactly on the grid: sounds played, not sequenced.
      evs[i].play(c, origin + evs[i].at * e + Math.random() * 0.006, e);
      if (++i >= evs.length) {
        i = 0;
        origin += length * e; // seamless loop back to the intro
      }
    }
  };
  tick();
  return tick;
}

// ---- The route theme -----------------------------------------------------------------
// The original route melody is the A theme. Around it: a guitar intro, a milonga B section in the relative minor,
// a calm interlude, a D section in F, the theme again a tone higher, a charango milonga and an outro that runs
// back into the intro. About 3 min 50 s before it repeats.
const THEME = 'G4 2 C5 2 E5 2 G5 3 F5 1 E5 2 D5 2 C5 2 D5 2 E5 6 C5 8 A4 2 C5 2 F5 2 A5 3 G5 1 F5 2 E5 2 D5 2 B4 4 C5 12';
const THEME_CHORDS = 'C 8 Em 4 G7 4 Dm 4 Am 4 C 8 F 8 Dm7 8 G 4 Gsus4 4 C 8';
const THEME_COUNTER = 'E4 8 D4 8 F4 4 E4 4 E4 8 C4 8 F4 8 D4 4 F4 4 E4 8';

export const SONGS: Record<string, Song> = {
  route: {
    bpm: 100,
    sections: {
      intro: { bars: 4, chords: 'C 8 Am 8 F 8 G 8', comp: ['arp'] },
      a1: { bars: 8, chords: THEME_CHORDS, lead: THEME, leadInst: 'flute', comp: ['arp'] },
      a2: {
        bars: 8, chords: THEME_CHORDS, lead: THEME, leadInst: 'charango', counter: THEME_COUNTER, counterInst: 'flute',
        comp: ['arp'], drums: 'b-----h-----b-h-',
      },
      b1: {
        bars: 8, chords: 'Am 8 F 8 C 8 G 8 F 8 C 8 Dm 8 E7 8',
        lead: 'A4 3 C5 3 E5 2 F5 3 E5 3 C5 2 G5 3 E5 3 C5 2 D5 6 B4 2 A4 3 C5 3 F5 2 E5 3 G5 3 E5 2 F5 3 E5 3 D5 2 B4 4 G#4 4',
        leadInst: 'flute', comp: ['milonga'], drums: 'b-----r-----b-r-',
      },
      b2: {
        bars: 8, chords: 'Am 8 F 8 C 8 G 8 F 8 C 8 Dm 4 F 4 G7 8',
        lead: 'A5 3 G5 1 E5 2 C5 2 F5 3 E5 1 C5 2 A4 2 G5 3 F5 1 E5 2 C5 2 D5 4 B4 2 D5 2 C5 3 D5 1 F5 2 A5 2 G5 3 E5 1 C5 2 E5 2 D5 2 F5 2 A5 2 C6 2 B5 4 A5 2 F5 2',
        leadInst: 'charango', comp: ['milonga', 'pad'], drums: 'b-----r-----b-r-',
      },
      a3: {
        bars: 8, chords: THEME_CHORDS, lead: THEME, leadInst: 'pulse', counter: THEME_COUNTER, counterInst: 'flute',
        comp: ['strum'], drums: 'b---h-r-b-h-r-h-',
      },
      c: {
        bars: 8, chords: 'F 8 G 8 Em 8 Am 8 Dm 8 G 8 C 8 C7 8',
        lead: 'C6 8 B5 8 G5 8 A5 4 E5 4 F5 8 D5 4 B4 4 C5 4 E5 4 G5 4 A#5 4',
        leadInst: 'flute', comp: ['arp', 'pad'],
      },
      d1: {
        bars: 8, chords: 'F 8 A# 8 C 8 F 8 Dm 8 Gm 8 C 8 C7 8',
        lead: 'C5 2 F5 2 A5 4 D5 2 F5 2 A#5 4 A5 2 G5 2 E5 2 C5 2 F5 8 D5 2 F5 2 A5 3 G5 1 F5 2 D5 2 A#4 4 C5 2 E5 2 G5 2 A#5 2 A5 4 G5 4',
        leadInst: 'flute', comp: ['arp'], drums: 'b-------b-----h-',
      },
      d2: {
        bars: 8, chords: 'F 8 A# 8 C 8 F 8 Dm 8 Gm 8 Em7 8 A7 8',
        lead: 'A5 3 G5 1 F5 2 C5 2 D5 3 F5 1 A#5 4 C6 2 A#5 2 G5 2 E5 2 F5 4 A5 4 D6 3 C6 1 A5 2 F5 2 G5 3 A5 1 A#5 2 D5 2 E5 2 G5 2 B5 2 D6 2 C#6 4 A5 2 E5 2',
        leadInst: 'charango', comp: ['strum'], drums: 'b-----h-----b-h-',
      },
      a4: {
        bars: 8, chords: THEME_CHORDS, lead: THEME, leadInst: 'flute', counter: THEME_COUNTER, counterInst: 'pulse',
        comp: ['tremolo', 'bass'], drums: 'b---h-r-b-h-r-h-', transpose: 2,
      },
      e: {
        bars: 8, chords: 'Am 8 Dm 8 G 8 C 8 F 8 Dm 8 Am 4 E7 4 Dm 4 G7 4',
        lead: 'E5 3 A5 3 E5 2 F5 3 A5 3 F5 2 D5 3 G5 3 B5 2 C6 6 G5 2 A5 3 F5 3 C5 2 D5 3 F5 3 A5 2 C6 2 B5 2 G#5 4 A5 2 F5 2 D5 2 B4 2',
        leadInst: 'charango', comp: ['milonga'], drums: 'b-----r-----b-rr',
      },
      a5: {
        bars: 8, chords: THEME_CHORDS, lead: THEME, leadInst: 'flute', counter: THEME_COUNTER, counterInst: 'charango',
        comp: ['arp', 'pad'], drums: 'b-------b-------',
      },
      outro: { bars: 4, chords: 'F 8 C 8 Dm7 8 G7 8', lead: 'A5 8 G5 8 F5 4 E5 4 D5 8', leadInst: 'flute', comp: ['arp'] },
    },
    order: ['intro', 'a1', 'a2', 'b1', 'b2', 'a3', 'c', 'd1', 'd2', 'a4', 'e', 'a5', 'outro'],
  },
};
