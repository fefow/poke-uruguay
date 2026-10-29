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

function tone(f, start, dur, { type = 'square', vol = 1, slide = 0, out = sfxGain } = {}) {
  if (!ctx || !f) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(out);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(start, dur, vol = 0.6, out = sfxGain) {
  if (!ctx) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(g).connect(out);
  src.start(start);
}

const SFX = {
  select: (t) => tone(880, t, 0.05, { vol: 0.4 }),
  confirm: (t) => { tone(660, t, 0.06); tone(990, t + 0.06, 0.08); },
  cancel: (t) => tone(330, t, 0.08, { slide: -120 }),
  bump: (t) => tone(110, t, 0.08, { type: 'triangle' }),
  hit: (t) => { noise(t, 0.12, 0.8); tone(180, t, 0.1, { slide: -100 }); },
  super: (t) => { noise(t, 0.2, 1); tone(240, t, 0.18, { slide: -180 }); tone(480, t + 0.05, 0.12, { slide: -300 }); },
  weak: (t) => { noise(t, 0.06, 0.4); tone(140, t, 0.06); },
  faint: (t) => tone(500, t, 0.6, { slide: -460, type: 'sawtooth', vol: 0.5 }),
  heal: (t) => ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.12, 0.14, { vol: 0.5 })),
  levelup: (t) => ['G4', 'B4', 'D5', 'G5'].forEach((n, i) => tone(freq(n), t + i * 0.09, 0.12, { vol: 0.6 })),
  catch: (t) => ['C5', 'G4', 'C5', 'E5', 'G5'].forEach((n, i) => tone(freq(n), t + i * 0.1, 0.12)),
  shake: (t) => tone(220, t, 0.06, { type: 'triangle', slide: 60 }),
  throw: (t) => tone(300, t, 0.3, { slide: 600, type: 'triangle' }),
  encounter: (t) => { for (let i = 0; i < 6; i++) tone(freq(['C5', 'D#5', 'G5'][i % 3]), t + i * 0.05, 0.05); },
  door: (t) => { tone(200, t, 0.06); tone(150, t + 0.07, 0.08); },
  stat_up: (t) => tone(400, t, 0.25, { slide: 500 }),
  stat_down: (t) => tone(700, t, 0.25, { slide: -450 }),
  money: (t) => { tone(1320, t, 0.05); tone(1760, t + 0.06, 0.12); },
  evolve: (t) => ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.1, 0.16, { type: 'triangle', vol: 0.8 })),
};

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
        tone(freq(n), t, d * eighth * 0.9, { vol: 0.5, out: bus });
        t += d * eighth;
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
        else if (ch === 's') noise(at, 0.07, 0.35, bus);
        else if (ch === 'h') noise(at, 0.02, 0.12, bus);
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
    current.bus.gain.setValueAtTime(0, ctx.currentTime);
    const bus = current.bus;
    setTimeout(() => bus.disconnect(), 50);
  }
  current = null;
}

export function currentTrack() {
  return current?.name ?? null;
}
