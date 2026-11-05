// Chiptune audio with WebAudio: sound effects and looping tracks written as
// note lists. No audio files to download. Starts on the first user gesture.

let ctx = null;
let master, musicGain, sfxGain;
let current = null; // { name, timer, resume }
let pendingResume = null;
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
  // Handheld-era (GBA/DS) colour: a soft low-pass takes the 8-bit edge off, and a short room echo gives depth.
  const tone_ = ctx.createBiquadFilter();
  tone_.type = 'lowpass';
  tone_.frequency.value = 5200;
  tone_.Q.value = 0.4;
  tone_.connect(master);
  musicGain.connect(tone_);
  sfxGain.connect(tone_);
  const echo = ctx.createDelay(0.5);
  const fb = ctx.createGain();
  const wet = ctx.createGain();
  const damp = ctx.createBiquadFilter();
  echo.delayTime.value = 0.11;
  fb.gain.value = 0.28;
  wet.gain.value = 0.22;
  damp.type = 'lowpass';
  damp.frequency.value = 2400;
  tone_.connect(echo);
  echo.connect(damp).connect(fb).connect(echo);
  damp.connect(wet).connect(master);
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
  if (duty) o.setPeriodicWave(pulseWave(Math.max(0.25, duty)));
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
  // Attack effects, one per animation style, timed to the drawn effect.
  dash: (t) => noise(t, 0.12, 0.35, sfxGain, { hp: 2500 }),
  charge: (t) => tone(220, t, 0.3, { duty: 0.125, slide: 440, vol: 0.35 }),
  orb: (t) => tone(880, t, 0.3, { duty: 0.25, slide: -500, vol: 0.3, vib: 2 }),
  aura: (t) => [0, 1, 2, 3].forEach((i) => tone(1046 + i * 262, t + i * 0.07, 0.08, { duty: 0.125, vol: 0.25 })),
  fx_quake: (t) => { for (let i = 0; i < 6; i++) { noise(t + i * 0.11, 0.14, 0.6); tone(55 + (i % 2) * 10, t + i * 0.11, 0.12, { type: 'triangle', vol: 0.9 }); } },
  fx_wave: (t) => { noise(t, 0.6, 0.35, sfxGain, { hp: 700 }); tone(300, t, 0.55, { type: 'sine', slide: 300, vol: 0.2 }); },
  fx_wind: (t) => { for (let i = 0; i < 3; i++) noise(t + i * 0.2, 0.3, 0.3, sfxGain, { hp: 1800 + i * 800 }); },
  fx_flame: (t) => { noise(t, 0.55, 0.5, sfxGain, { hp: 300 }); for (let i = 0; i < 5; i++) noise(t + i * 0.1, 0.03, 0.4, sfxGain, { hp: 4000 }); },
  fx_bolt: (t) => { for (let i = 0; i < 5; i++) tone(1400 - i * 150, t + i * 0.06, 0.05, { duty: 0.5, vol: 0.4 }); noise(t + 0.15, 0.25, 0.8); },
  fx_leaves: (t) => { for (let i = 0; i < 6; i++) { noise(t + i * 0.09, 0.05, 0.25, sfxGain, { hp: 3500 }); tone(900 + i * 70, t + i * 0.09, 0.04, { duty: 0.125, vol: 0.15 }); } },
  fx_rocks: (t) => { for (let i = 0; i < 4; i++) { noise(t + 0.15 + i * 0.12, 0.1, 0.7); tone(90, t + 0.15 + i * 0.12, 0.1, { type: 'triangle', vol: 0.8 }); } },
  fx_bubbles: (t) => { for (let i = 0; i < 7; i++) tone(500 + ((i * 137) % 400), t + i * 0.08, 0.06, { type: 'sine', slide: 300, vol: 0.35 }); },
  fx_rings: (t) => { for (let i = 0; i < 3; i++) tone(660 * (1 + i * 0.25), t + i * 0.15, 0.3, { type: 'sine', vol: 0.3, vib: 3 }); },
  fx_shadow: (t) => { tone(160, t, 0.6, { duty: 0.5, slide: -80, vol: 0.35, vib: 4 }); tone(240, t + 0.1, 0.5, { duty: 0.125, slide: -120, vol: 0.2 }); },
  fx_swarm: (t) => { tone(220, t, 0.6, { type: 'sawtooth', vol: 0.15, vib: 6 }); tone(233, t, 0.6, { type: 'sawtooth', vol: 0.12, vib: 5 }); },
  cut: (t) => { noise(t, 0.08, 0.6, sfxGain, { hp: 3000 }); tone(1200, t, 0.08, { duty: 0.125, slide: -800, vol: 0.3 }); noise(t + 0.1, 0.15, 0.3, sfxGain, { hp: 1500 }); },
  cast: (t) => { noise(t, 0.25, 0.3, sfxGain, { hp: 3000 }); noise(t + 0.4, 0.15, 0.35, sfxGain, { hp: 900 }); },
  bite: (t) => { tone(1568, t, 0.05, { duty: 0.25, vol: 0.5 }); tone(1568, t + 0.09, 0.05, { duty: 0.25, vol: 0.5 }); noise(t, 0.2, 0.4, sfxGain, { hp: 1200 }); },
  pc: (t) => ['C6', 'G5', 'E6', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.06, 0.06, { duty: 0.125, vol: 0.3 })),
  bell: (t) => { tone(2093, t, 0.25, { type: 'sine', vol: 0.4 }); tone(2093, t + 0.18, 0.35, { type: 'sine', vol: 0.35 }); },
  stat_up: (t) => tone(400, t, 0.25, { slide: 500, duty: 0.25 }),
  stat_down: (t) => tone(700, t, 0.25, { slide: -450, duty: 0.25 }),
  money: (t) => { tone(1320, t, 0.05, { duty: 0.125 }); tone(1760, t + 0.06, 0.14, { duty: 0.125 }); },
  evolve: (t) => ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'].forEach((n, i) => P(n, t + i * 0.1, 0.16, { vol: 0.7 })),
};

// Short fanfares that pause the background track while they play, like receiving an item in the originals.
export const JINGLES = {
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

/**
 * Creature cry: every species gets its own short call, built from its key so it never changes.
 * `size` (about 0.7 to 2.4, from base stats) lowers the pitch of big creatures; a fainting creature cries slower and lower.
 */
export function cry(key, size = 1, { faint = false } = {}) {
  if (!ctx || !key) return;
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => { h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const stretch = faint ? 1.6 : 1;
  const base = (1400 / (0.6 + size)) * (faint ? 0.75 : 1);
  const duty = [0.125, 0.25, 0.5][Math.floor(rnd() * 3)];
  const segs = 2 + Math.floor(rnd() * 3);
  const rough = rnd() < 0.35;
  let t = ctx.currentTime + 0.01;
  for (let i = 0; i < segs; i++) {
    const d = (0.05 + rnd() * 0.12) * stretch;
    const f = base * (0.7 + rnd() * 0.8);
    const dir = faint ? -1 : rnd() < 0.5 ? -1 : 1;
    tone(f, t, d, { duty, vol: 0.6, slide: dir * f * (0.2 + rnd() * 0.5) });
    // A second voice a fifth apart makes the call less beepy.
    if (rnd() < 0.5) tone(f * 1.5, t, d * 0.8, { duty: 0.125, vol: 0.2, slide: dir * f * 0.3 });
    if (rough) noise(t, d, 0.25, sfxGain, { hp: f });
    t += d * (0.8 + rnd() * 0.3);
  }
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
export const TRACKS = {
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
  // Trainer battles: a driving minor riff for regular trainers, a cocky one for the rival, an epic one for leaders and bosses.
  trainer: {
    bpm: 160,
    lead: 'E5 1 F5 1 E5 1 D5 1 E5 2 B4 2 C5 2 D5 2 E5 4 G5 1 F5 1 E5 1 D5 1 C5 2 A4 2 B4 2 C5 2 D5 4 E5 1 F5 1 E5 1 D5 1 E5 2 B4 2 C5 2 E5 2 A5 4 G5 2 F5 2 E5 2 D5 2 C5 2 B4 2 C5 2 D5 2',
    bass: 'E2 1 E3 1 E2 1 E3 1 E2 1 E3 1 E2 1 E3 1 C2 1 C3 1 C2 1 C3 1 D2 1 D3 1 D2 1 D3 1',
    drums: 'k-hsk-hsk-hsk-ss',
  },
  leader: {
    bpm: 172,
    lead: 'A4 1 C5 1 E5 1 A5 1 G5 2 E5 2 F5 2 E5 2 D5 2 C5 2 D5 1 E5 1 F5 1 G5 1 A5 4 E5 4 A4 1 C5 1 E5 1 A5 1 B5 2 C6 2 B5 2 A5 2 G#5 2 E5 2 B4 2 D5 2 E5 8',
    bass: 'A2 1 A2 1 A3 1 A2 1 F2 1 F2 1 F3 1 F2 1 G2 1 G2 1 G3 1 G2 1 E2 1 E2 1 E3 1 E2 1',
    drums: 'k-sk-ks-k-sk-sss',
  },
  rival: {
    bpm: 150,
    lead: 'G4 1 B4 1 D5 2 G5 2 F#5 1 E5 1 D5 2 B4 2 C5 2 E5 2 G5 1 F#5 1 E5 2 D5 4 - 2 G4 1 B4 1 D5 2 G5 2 A5 1 B5 1 C6 2 B5 2 A5 2 F#5 2 D5 2 E5 1 F#5 1 G5 6 - 2',
    bass: 'G2 2 G3 2 G2 2 G3 2 C3 2 C3 2 D3 2 D3 2',
    drums: 'k-h-s-hkk-h-s-h-',
  },
  // A trainer's eyes meet yours: a short tense loop until the battle starts.
  spotted: {
    bpm: 140,
    duty: 0.125,
    lead: 'B4 1 D5 1 F5 1 B5 1 A5 2 F5 2 G5 1 E5 1 C5 2 D5 4 B4 1 D5 1 F5 1 B5 1 C6 2 A5 2 B5 1 G5 1 E5 2 F#5 4',
    bass: 'B2 2 B2 2 G2 2 A2 2',
    drums: 'k-h-k-h-k-h-ksss',
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

/** `resume`: the track this one interrupts (a short scene loop); currentTrack() keeps reporting it. */
export function playMusic(name, { resume = null } = {}) {
  if (current?.name === name) return;
  stopMusic();
  if (resume) pendingResume = resume;
  const track = TRACKS[name];
  if (!track || !ctx) {
    current = { name, timer: null, resume: pendingResume };
    pendingResume = null;
    return;
  }
  const eighth = 60 / track.bpm / 2;
  const lead = parseSeq(track.lead);
  const bass = parseSeq(track.bass);
  const loopLen = lead.reduce((s, [, d]) => s + d, 0) * eighth;
  const bus = ctx.createGain();
  bus.connect(musicGain);
  const state = { name, timer: null, bus, next: ctx.currentTime + 0.05, resume: pendingResume };
  pendingResume = null;
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
  return current?.resume ?? current?.name ?? null;
}
