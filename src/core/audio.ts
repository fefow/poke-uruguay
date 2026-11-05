// Chiptune audio with WebAudio: sound effects and looping tracks written as
// note lists. No audio files to download. Starts on the first user gesture.

let ctx = null;
let master, musicGain, sfxGain;
let current = null; // { name, timer }
const settings = { music: 0.5, sfx: 0.7 };

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(n) {
  if (!n || n === '-') return 0;
  const m = /^([A-G]#?)(\d)$/.exec(n);
  const midi = (Number(m[2]) + 1) * 12 + NOTE[m[1]];
  return 440 * 2 ** ((midi - 69) / 12);
}

export function initAudio() {
  if (ctx) return ctx.state === 'suspended' ? ctx.resume() : undefined;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();
  musicGain.connect(master);
  sfxGain.connect(master);
  applyVolumes();
  // A track requested before audio was unlocked starts now.
  if (current && !current.timer) {
    const name = current.name;
    current = null;
    playMusic(name);
  }
}

export function setVolumes({ music, sfx }) {
  if (music != null) settings.music = music;
  if (sfx != null) settings.sfx = sfx;
  applyVolumes();
}
function applyVolumes() {
  if (!ctx) return;
  musicGain.gain.value = settings.music * 0.18;
  sfxGain.gain.value = settings.sfx * 0.35;
}

// Game Boy-style pulse channels: narrow duty cycles give the thin, bright lead the handheld had.
const waves = new Map();
function pulseWave(duty) {
  if (waves.has(duty)) return waves.get(duty);
  const n = 32;
  const re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) {
    re[k] = Math.sin(2 * Math.PI * k * duty) / (k * Math.PI);
    im[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (k * Math.PI);
  }
  const w = ctx.createPeriodicWave(re, im);
  waves.set(duty, w);
  return w;
}

function tone(f, start, dur, { type = 'square', duty = 0, vol = 1, slide = 0, vib = 0, out = sfxGain } = {}) {
  if (!ctx || !f) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  if (duty) o.setPeriodicWave(pulseWave(duty));
  else o.type = type;
  o.frequency.setValueAtTime(f, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), start + dur);
  // Delayed vibrato on long notes, like the handheld composers did by hand.
  if (vib && dur > 0.3) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 5.5;
    depth.gain.setValueAtTime(0, start);
    depth.gain.linearRampToValueAtTime(f * 0.012 * vib, start + Math.min(0.35, dur * 0.6));
    lfo.connect(depth).connect(o.frequency);
    lfo.start(start);
    lfo.stop(start + dur + 0.02);
  }
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  // Hold most of the note, then release: a plucked decay sounds mushy at chiptune tempos.
  if (dur > 0.12) g.gain.setValueAtTime(vol * 0.8, start + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(out);
  o.start(start);
  o.stop(start + dur + 0.02);
}

// One shared second of white noise: every drum hit and effect reads a slice of it instead of building a buffer.
let noiseBuf = null;
function noise(start, dur, vol = 0.6, out = sfxGain, { hp = 0 } = {}) {
  if (!ctx) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  src.buffer = noiseBuf;
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.01, dur));
  let node = src;
  if (hp) {
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    node = src.connect(f);
  }
  node.connect(g).connect(out);
  src.start(start, Math.random() * 0.5, dur + 0.02);
}

const P = (n, t, d, o = {}) => tone(freq(n), t, d, { duty: 0.25, vol: 0.55, ...o });
const SFX = {
  select: (t) => tone(1046, t, 0.04, { duty: 0.125, vol: 0.35 }),
  confirm: (t) => { tone(784, t, 0.05, { duty: 0.25, vol: 0.5 }); tone(1175, t + 0.05, 0.08, { duty: 0.25, vol: 0.5 }); },
  cancel: (t) => tone(392, t, 0.09, { duty: 0.5, slide: -150, vol: 0.5 }),
  menu: (t) => { tone(1175, t, 0.04, { duty: 0.125, vol: 0.4 }); tone(1568, t + 0.04, 0.06, { duty: 0.125, vol: 0.4 }); },
  bump: (t) => tone(98, t, 0.09, { duty: 0.5, vol: 0.6 }),
  hit: (t) => { noise(t, 0.14, 0.8); tone(180, t, 0.1, { slide: -100, duty: 0.5 }); },
  super: (t) => { noise(t, 0.24, 1); tone(240, t, 0.18, { slide: -180, duty: 0.5 }); tone(480, t + 0.05, 0.14, { slide: -300, duty: 0.25 }); },
  weak: (t) => { noise(t, 0.07, 0.4, sfxGain, { hp: 1500 }); tone(140, t, 0.06, { duty: 0.125 }); },
  crit: (t) => { noise(t, 0.3, 1); tone(880, t, 0.06, { duty: 0.125 }); tone(1320, t + 0.06, 0.12, { duty: 0.125 }); },
  faint: (t) => tone(520, t, 0.7, { slide: -470, duty: 0.5, vol: 0.5 }),
  heal: (t) => ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => P(n, t + i * 0.12, 0.14)),
  levelup: (t) => ['G4', 'B4', 'D5', 'G5'].forEach((n, i) => P(n, t + i * 0.09, 0.12, { vol: 0.6 })),
  catch: (t) => ['C5', 'G4', 'C5', 'E5', 'G5'].forEach((n, i) => P(n, t + i * 0.1, 0.12)),
  shake: (t) => { tone(220, t, 0.06, { type: 'triangle', slide: 60 }); noise(t, 0.04, 0.25, sfxGain, { hp: 3000 }); },
  throw: (t) => tone(300, t, 0.3, { slide: 600, type: 'triangle' }),
  poof: (t) => { noise(t, 0.25, 0.6, sfxGain, { hp: 800 }); tone(600, t, 0.2, { slide: -400, duty: 0.125, vol: 0.3 }); },
  encounter: (t) => { for (let i = 0; i < 8; i++) tone(freq(['C5', 'D#5', 'G5', 'C6'][i % 4]), t + i * 0.045, 0.05, { duty: 0.25 }); },
  door: (t) => { noise(t, 0.05, 0.3, sfxGain, { hp: 600 }); tone(200, t, 0.06, { duty: 0.5 }); tone(150, t + 0.07, 0.08, { duty: 0.5 }); },
  ledge: (t) => { tone(330, t, 0.16, { duty: 0.25, slide: 330, vol: 0.45 }); noise(t + 0.2, 0.06, 0.3, sfxGain, { hp: 400 }); },
  grass: (t) => noise(t, 0.05, 0.12, sfxGain, { hp: 4000 }),
  splash: (t) => { noise(t, 0.22, 0.45, sfxGain, { hp: 1200 }); tone(700, t, 0.12, { type: 'sine', slide: -350, vol: 0.25 }); },
  boulder: (t) => { noise(t, 0.3, 0.7, sfxGain); tone(70, t, 0.3, { type: 'triangle', vol: 0.8 }); },
  run: (t) => [0, 1, 2].forEach((i) => tone(600 - i * 120, t + i * 0.06, 0.06, { duty: 0.125, vol: 0.35 })),
  expTick: (t) => tone(1760, t, 0.02, { duty: 0.125, vol: 0.18 }),
  lowhp: (t) => { tone(1568, t, 0.07, { duty: 0.5, vol: 0.25 }); tone(1568, t + 0.12, 0.07, { duty: 0.5, vol: 0.25 }); },
  save: (t) => ['E5', 'G5', 'C6'].forEach((n, i) => P(n, t + i * 0.08, 0.1, { duty: 0.125 })),
  stat_up: (t) => tone(400, t, 0.25, { slide: 500, duty: 0.25 }),
  stat_down: (t) => tone(700, t, 0.25, { slide: -450, duty: 0.25 }),
  money: (t) => { tone(1320, t, 0.05, { duty: 0.125 }); tone(1760, t + 0.06, 0.14, { duty: 0.125 }); },
  evolve: (t) => ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'].forEach((n, i) => P(n, t + i * 0.1, 0.16, { vol: 0.7 })),
};

// Short fanfares that pause the background track while they play, like receiving an item in the originals.
const JINGLES = {
  item: { bpm: 150, lead: 'C5 1 C5 1 C5 1 E5 1 G5 4 F5 2 A5 2 G5 6', bass: 'C3 4 F2 4 C3 8' },
  key: { bpm: 140, lead: 'G4 1 B4 1 D5 1 G5 3 E5 1 F#5 1 G5 2 D6 6', bass: 'G2 4 C3 2 D3 2 G2 6' },
  badge: { bpm: 132, lead: 'G4 2 C5 2 E5 2 G5 4 E5 2 G5 2 A5 2 B5 2 C6 8', bass: 'C3 4 E3 4 F2 4 G2 4 C3 6' },
  creature: { bpm: 140, lead: 'E5 2 C5 2 G5 2 E5 2 A5 2 B5 2 C6 6', bass: 'C3 4 G2 4 A2 2 G2 2 C3 6' },
};

/** Plays a fanfare over a muted music track; resolves when it ends so scripts can wait for it. */
export function jingle(name) {
  const j = JINGLES[name];
  if (!ctx || !j) return Promise.resolve();
  const eighth = 60 / j.bpm / 2;
  const t0 = ctx.currentTime + 0.03;
  let t = t0;
  for (const [n, d] of parseSeq(j.lead)) { tone(freq(n), t, d * eighth * 0.92, { duty: 0.25, vol: 0.55, vib: 1 }); tone(freq(n), t + eighth * 0.5, d * eighth * 0.8, { duty: 0.125, vol: 0.15 }); t += d * eighth; }
  const end = t;
  t = t0;
  for (const [n, d] of parseSeq(j.bass)) { tone(freq(n), t, d * eighth * 0.85, { type: 'triangle', vol: 0.8 }); t += d * eighth; }
  const len = end - t0;
  if (musicGain) {
    const g = musicGain.gain;
    const base = settings.music * 0.18;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(0.0001, t0);
    g.setValueAtTime(0.0001, end + 0.1);
    g.linearRampToValueAtTime(base, end + 0.6);
  }
  return new Promise((r) => setTimeout(r, len * 1000 + 150));
}

// Low-HP alarm: the classic double beep that loops while the active creature is in the red.
let lowTimer = null;
export function lowHpAlarm(on) {
  if (on && !lowTimer) {
    sfx('lowhp');
    lowTimer = setInterval(() => sfx('lowhp'), 520);
  } else if (!on && lowTimer) {
    clearInterval(lowTimer);
    lowTimer = null;
  }
}

export function sfx(name) {
  if (!ctx || !SFX[name]) return;
  SFX[name](ctx.currentTime + 0.001);
}

// ---- Music -------------------------------------------------------------
// Each track: bpm, lead [note, eighths], bass [note, eighths], drums pattern.
const TRACKS = {
  title: {
    bpm: 96,
    lead: 'E5 2 G5 2 A5 4 G5 2 E5 2 D5 4 C5 2 D5 2 E5 2 G5 2 E5 8 E5 2 G5 2 A5 4 C6 2 B5 2 A5 4 G5 2 E5 2 D5 2 C5 2 C5 8',
    bass: 'A2 4 A2 4 F2 4 F2 4 C3 4 C3 4 G2 4 G2 4 A2 4 A2 4 F2 4 F2 4 G2 4 G2 4 C3 4 C3 4',
    drums: 'k-h-s-h-k-h-s-hh',
  },
  town: {
    bpm: 112,
    lead: 'C5 2 E5 2 G5 2 E5 2 F5 2 A5 2 G5 4 E5 2 D5 2 C5 2 D5 2 E5 4 - 4 C5 2 E5 2 G5 2 C6 2 B5 2 A5 2 G5 4 F5 2 E5 2 D5 2 B4 2 C5 4 - 4',
    bass: 'C3 4 G2 4 F2 4 C3 4 A2 4 F2 4 G2 4 G2 4 C3 4 E3 4 F2 4 A2 4 F2 4 G2 4 C3 4 C3 4',
    drums: 'k---s---k-k-s---',
  },
  route: {
    bpm: 132,
    lead: 'G4 2 C5 2 E5 2 G5 3 F5 1 E5 2 D5 2 C5 2 D5 2 E5 4 C5 4 A4 2 C5 2 F5 2 A5 3 G5 1 F5 2 E5 2 D5 2 B4 2 C5 8',
    bass: 'C3 2 C3 2 G2 2 G2 2 C3 2 C3 2 G2 2 G2 2 F2 2 F2 2 C3 2 C3 2 F2 2 F2 2 G2 2 G2 2 A2 2 A2 2 F2 2 F2 2 G2 2 G2 2 C3 2 C3 2',
    drums: 'k-hsk-hsk-hsk-ss',
  },
  // Candombe-flavoured battle: syncopated tambor pattern in the drums.
  battle: {
    bpm: 168,
    lead: 'E5 1 E5 1 - 1 E5 1 G5 2 E5 2 D5 1 D5 1 - 1 D5 1 F5 2 D5 2 C5 1 C5 1 - 1 C5 1 E5 2 G5 2 B4 2 C5 2 D5 4 E5 1 E5 1 - 1 E5 1 A5 2 G5 2 F5 2 E5 2 D5 2 C5 2 B4 2 G4 2 A4 2 B4 2 C5 4',
    bass: 'A2 1 A2 1 A3 1 A2 1 A2 1 A2 1 A3 1 A2 1 G2 1 G2 1 G3 1 G2 1 G2 1 G2 1 G3 1 G2 1 F2 1 F2 1 F3 1 F2 1 F2 1 F2 1 F3 1 F2 1 E2 1 E2 1 E3 1 E2 1 G#2 1 G#2 1 G#3 1 G#2 1',
    drums: 'k-sk-hs-k-ss-hs-',
  },
  victory: {
    bpm: 140,
    lead: 'C5 1 E5 1 G5 1 C6 5 B5 2 C6 2 D6 2 C6 6 - 2 G5 2 A5 2 B5 2 C6 8',
    bass: 'C3 4 C3 4 G2 4 G2 4 F2 4 G2 4 C3 8',
    drums: 'k---s---k-k-s---',
  },
  // Zone themes: caves are slow and low, gyms drive, the beach sways, the forest is light, the sierra is stern.
  cave: {
    bpm: 76,
    lead: 'A4 4 - 2 C5 2 E5 4 D5 2 C5 2 B4 4 - 4 A4 4 - 2 E5 2 G5 4 F5 2 E5 2 D5 4 - 4',
    bass: 'A2 8 F2 8 D2 8 E2 8',
    drums: 'k-----------h---',
  },
  gym: {
    bpm: 150,
    lead: 'E5 1 E5 1 G5 2 E5 2 D5 2 E5 1 E5 1 A5 2 G5 2 E5 2 C5 1 C5 1 E5 2 D5 2 C5 2 B4 2 D5 2 E5 4 - 2',
    bass: 'E2 2 E2 2 E2 2 E2 2 A2 2 A2 2 A2 2 A2 2 C3 2 C3 2 D3 2 D3 2 E2 2 E2 2 B2 2 B2 2',
    drums: 'k-s-k-s-k-sskhs-',
  },
  beach: {
    bpm: 100,
    lead: 'G5 2 E5 2 C5 2 E5 2 G5 4 A5 2 G5 2 E5 4 - 4 F5 2 D5 2 A4 2 D5 2 F5 4 G5 2 F5 2 E5 4 - 4',
    bass: 'C3 4 G2 4 C3 4 G2 4 F2 4 C3 4 G2 4 G2 4',
    drums: 'k---h-h-k---h-h-',
  },
  forest: {
    bpm: 104,
    lead: 'E5 2 G5 2 B5 4 A5 2 G5 2 E5 4 D5 2 F5 2 A5 4 G5 2 F5 2 D5 4 E5 2 G5 2 B5 2 E6 2 D6 4 B5 4',
    bass: 'E3 4 B2 4 D3 4 A2 4 E3 4 B2 4 G2 4 B2 4',
    drums: 'k-------s-------',
  },
  sierra: {
    bpm: 118,
    lead: 'D5 2 F5 2 A5 2 D6 2 C6 2 A5 2 F5 4 C5 2 E5 2 G5 2 C6 2 B5 2 G5 2 E5 4',
    bass: 'D3 4 D3 4 C3 4 C3 4 A#2 4 A#2 4 A2 4 A2 4',
    drums: 'k-hsk-hsk-hsk-ss',
  },
  pp: {
    bpm: 124,
    lead: 'A4 2 A4 2 C5 2 A4 2 E5 2 A4 2 D#5 2 E5 2 G4 2 G4 2 B4 2 G4 2 D5 2 G4 2 C#5 2 D5 2',
    bass: 'A2 2 A2 2 A2 2 A2 2 A2 2 A2 2 A2 2 A2 2 G2 2 G2 2 G2 2 G2 2 G2 2 G2 2 G2 2 G2 2',
    drums: 'k-s-k-s-kks-k-s-',
  },
  casino: {
    bpm: 150,
    lead: 'C5 1 E5 1 G5 1 E5 1 C5 1 E5 1 G5 1 C6 1 A5 1 F5 1 A5 1 C6 1 B5 1 G5 1 D5 1 G5 1',
    bass: 'C3 2 G2 2 C3 2 G2 2 F2 2 C3 2 G2 2 G2 2',
    drums: 'k-h-s-h-k-h-s-h-',
  },
  ferry: {
    bpm: 108,
    lead: 'E5 4 G5 2 E5 2 D5 4 C5 4 D5 4 F5 2 D5 2 C5 4 B4 4',
    bass: 'C3 4 G2 4 A2 4 E2 4',
    drums: 'k---s---k---s---',
  },
  league: {
    bpm: 132,
    lead: 'C5 2 E5 2 G5 4 C6 4 B5 2 G5 2 E5 4 F5 2 A5 2 C6 4 B5 2 G5 2 D5 4',
    bass: 'C3 4 C3 4 E3 4 G2 4 F2 4 F2 4 G2 4 G2 4',
    drums: 'k-sk-hs-k-ss-hs-',
  },
  credits: {
    bpm: 88,
    lead: 'G4 4 C5 4 E5 4 D5 2 C5 2 A4 4 C5 4 G4 8 F4 4 A4 4 C5 4 B4 2 A4 2 G4 4 B4 4 C5 8',
    bass: 'C3 8 A2 8 F2 8 G2 8 F2 8 G2 8 C3 16',
    drums: 'k-------s-------',
  },
};

function parseSeq(str) {
  const parts = str.trim().split(/\s+/);
  const out = [];
  for (let i = 0; i < parts.length; i += 2) out.push([parts[i], Number(parts[i + 1])]);
  return out;
}

export function playMusic(name) {
  if (current?.name === name) return;
  stopMusic();
  const track = TRACKS[name];
  if (!track || !ctx) {
    current = { name, timer: null };
    return;
  }
  const eighth = 60 / track.bpm / 2;
  const lead = parseSeq(track.lead);
  const bass = parseSeq(track.bass);
  const loopLen = lead.reduce((s, [, d]) => s + d, 0) * eighth;
  const bus = ctx.createGain();
  bus.connect(musicGain);
  const state = { name, timer: null, bus, next: ctx.currentTime + 0.05 };
  const schedule = () => {
    // Schedule one loop ahead so timing stays tight even if the tab throttles.
    while (state.next < ctx.currentTime + loopLen + 0.5) {
      let t = state.next;
      for (const [n, d] of lead) {
        const len = d * eighth;
        tone(freq(n), t, len * 0.9, { duty: track.duty ?? 0.25, vol: 0.5, vib: 1, out: bus });
        // Second pulse channel: a quiet echo of the lead a sixteenth behind, which thickens the tune.
        if (n !== '-') tone(freq(n), t + eighth * 0.5, len * 0.75, { duty: 0.125, vol: 0.14, out: bus });
        t += len;
      }
      t = state.next;
      const bassLen = bass.reduce((s, [, d]) => s + d, 0) * eighth;
      for (let rep = 0; rep * bassLen < loopLen - 0.001; rep++) {
        for (const [n, d] of bass) {
          if (t >= state.next + loopLen) break;
          tone(freq(n), t, d * eighth * 0.85, { type: 'triangle', vol: 0.9, out: bus });
          t += d * eighth;
        }
      }
      const steps = Math.round(loopLen / (eighth / 2));
      for (let s = 0; s < steps; s++) {
        const ch = track.drums[s % track.drums.length];
        const at = state.next + s * (eighth / 2);
        if (ch === 'k') tone(90, at, 0.09, { type: 'sine', vol: 0.9, slide: -50, out: bus });
        else if (ch === 's') noise(at, 0.08, 0.35, bus, { hp: 900 });
        else if (ch === 'h') noise(at, 0.025, 0.12, bus, { hp: 5000 });
      }
      state.next += loopLen;
    }
  };
  schedule();
  state.timer = setInterval(schedule, 500);
  current = state;
}

export function stopMusic() {
  if (current?.timer) clearInterval(current.timer);
  if (current?.bus) {
    // Short fade so a track change never clicks; notes already scheduled die with the bus.
    const bus = current.bus;
    bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    setTimeout(() => bus.disconnect(), 160);
  }
  current = null;
}

export function currentTrack() {
  return current?.name ?? null;
}
