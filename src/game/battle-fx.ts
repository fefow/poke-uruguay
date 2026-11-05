// Attack effects of the battle scene, one look per kind of move. The scene sets A.eff = { style, p, x1, y1, x2, y2, color }
// and advances p from 0 to 1; drawEffect paints it on top of the creatures.
export type FxStyle = 'quake' | 'wave' | 'wind' | 'flame' | 'bolt' | 'leaves' | 'rocks' | 'bubbles' | 'rings' | 'shadow' | 'swarm' | null;

/** Which special look a move gets, from its name first and its type second. null = the plain lunge / orb. */
export function pickStyle(type: string, kind: string, name = ''): FxStyle {
  if (kind === 'status') return null;
  const n = name.toLowerCase();
  if (/terremoto|temblor|sismo|aplast|pisot|avalancha|derrumbe|excav|maremoto/.test(n)) return 'quake';
  if (/tornado|vendaval|torbellino|remolino|r[aá]faga|viento|pampero|ciclon|ciclón/.test(n)) return 'wind';
  if (/\bola\b|tsunami|marea|oleaje|cascada|diluvio|surf|hidro|chorro|pistola agua|burbuja/.test(n)) return 'wave';
  if (/trueno|rayo|descarga|chispa|impactrueno|el[eé]ctric/.test(n)) return 'bolt';
  switch (type) {
    case 'tierra': return 'quake';
    case 'agua': return 'wave';
    case 'volador': return kind === 'esp' ? 'wind' : null;
    case 'fuego': return kind === 'esp' ? 'flame' : null;
    case 'electrico': return 'bolt';
    case 'planta': return kind === 'esp' ? 'leaves' : null;
    case 'roca': return 'rocks';
    case 'veneno': return kind === 'esp' ? 'bubbles' : null;
    case 'psiquico': return 'rings';
    case 'siniestro': return kind === 'esp' ? 'shadow' : null;
    case 'bicho': return kind === 'esp' ? 'swarm' : null;
    case 'normal': return /gri|grito|chirrido|ruido|voz/.test(n) ? 'rings' : null;
    default: return null;
  }
}

/** Milliseconds each look lasts. */
export const FX_MS: Record<string, number> = { quake: 720, wave: 700, wind: 760, flame: 620, bolt: 520, leaves: 660, rocks: 700, bubbles: 640, rings: 640, shadow: 640, swarm: 660 };

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// small deterministic noise so each particle keeps its own path
const hash = (i: number, s = 1) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

export function drawEffect(g: any, e: any) {
  const { style, p, x1, y1, x2, y2, color } = e;
  g.save();
  switch (style) {
    case 'quake': {
      // cracks run along the ground from the user to the target, dust jumps up around the target
      const gy = y2 + 28;
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 2;
      const reach = clamp01(p * 2);
      g.beginPath(); g.moveTo(x1, gy);
      const steps = 12;
      for (let i = 1; i <= steps * reach; i++) g.lineTo(lerp(x1, x2, i / steps), gy + (i % 2 ? -4 : 4) * (1 - p * 0.4));
      g.stroke();
      g.fillStyle = color;
      for (let i = 0; i < 16; i++) {
        const k = clamp01(p * 1.4 - hash(i) * 0.3);
        if (k <= 0 || k >= 1) continue;
        g.globalAlpha = (1 - k) * 0.85;
        g.fillRect(x2 + (hash(i, 2) - 0.5) * 70, gy - Math.sin(k * Math.PI) * (14 + hash(i, 3) * 26), 3 + hash(i, 4) * 4, 3 + hash(i, 5) * 4);
      }
      break;
    }
    case 'wave': {
      // a wall of water rolls from the user over the target and breaks
      const dir = Math.sign(x2 - x1) || 1;
      const travel = clamp01(p / 0.75);
      const front = lerp(x1, x2 + dir * 24, travel);
      const base = (x: number) => lerp(y1, y2, clamp01((x - x1) / (x2 - x1 || 1)));
      const span = 90;
      for (let s = 0; s < span; s += 3) {
        const x = front - dir * s;
        if ((x - x1) * dir < 0) continue;
        const h = Math.max(0, 30 * Math.sin(Math.min(1, s / 40) * Math.PI * 0.5) * (1 - s / (span * 1.15))) * (p > 0.75 ? 1 - (p - 0.75) * 3 : 1);
        const wob = Math.sin(x * 0.2 + p * 24) * 3;
        const y = base(x) + 22;
        g.fillStyle = '#2f6fc0'; g.fillRect(x, y - h + wob, 3, h);
        g.fillStyle = color; g.fillRect(x, y - h + wob + 3, 3, Math.max(0, h - 3));
        g.fillStyle = '#eaf6ff'; g.fillRect(x, y - h + wob, 3, 3);
      }
      if (p > 0.7) {
        const k = (p - 0.7) / 0.3;
        g.fillStyle = '#eaf6ff';
        for (let i = 0; i < 14; i++) { const a = -Math.PI * (0.15 + hash(i) * 0.7); g.globalAlpha = 1 - k; g.fillRect(x2 + Math.cos(a) * k * 40 * (hash(i, 2) + 0.4), y2 + 10 + Math.sin(a) * k * 46 + k * k * 30, 3, 3); }
      }
      break;
    }
    case 'wind': {
      // a tornado stands on the target: rings of air that turn, widen and rise
      const fade = p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1;
      g.globalAlpha = 0.85 * fade;
      g.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const k = i / 15;
        const y = y2 + 26 - k * 70;
        const r = 8 + k * 26;
        const a = p * 18 + i * 1.1;
        g.strokeStyle = i % 3 ? '#e8f0ff' : color;
        g.beginPath(); g.ellipse(x2, y, r, 4 + k * 3, 0, a, a + Math.PI * 1.25); g.stroke();
      }
      g.fillStyle = '#dfe8f8';
      for (let i = 0; i < 6; i++) { const a = p * 14 + i * 1.05; g.fillRect(x2 + Math.cos(a) * 30, y2 - 8 + Math.sin(a * 1.3) * 22, 3, 2); }
      break;
    }
    case 'flame': {
      // a stream of fire from the user to the target, flickering
      for (let i = 0; i < 28; i++) {
        const k = clamp01(p * 1.5 - i * 0.022);
        if (k <= 0 || k >= 1) continue;
        const x = lerp(x1, x2, k) + (hash(i) - 0.5) * 8 * k;
        const y = lerp(y1, y2, k) - Math.sin(k * Math.PI) * 8 + (hash(i, 2) - 0.5) * 9 * k;
        const r = 2 + k * 6;
        g.globalAlpha = 1 - k * 0.4;
        g.fillStyle = k < 0.35 ? '#fff2a0' : k < 0.7 ? '#ffb43a' : '#e8672c';
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
      break;
    }
    case 'bolt': {
      // a lightning bolt strikes the target; the screen flashes on the first beat
      if (Math.floor(p * 10) % 2 === 0 || p > 0.8) {
        const top = y2 - 100;
        const pts: number[][] = [[x2 + 8, top]];
        for (let i = 1; i <= 7; i++) pts.push([x2 + (hash(i, Math.floor(p * 10)) - 0.5) * 26, lerp(top, y2 + 14, i / 7)]);
        for (const [w, c] of [[6, color], [2.5, '#ffffff']] as [number, string][]) {
          g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'miter';
          g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        }
        g.strokeStyle = color; g.lineWidth = 2;
        g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); g.lineTo(pts[3][0] + 18, pts[3][1] + 14); g.lineTo(pts[3][0] + 12, pts[3][1] + 26); g.stroke();
      }
      if (p < 0.22) { g.globalAlpha = (1 - p / 0.22) * 0.55; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 320, 180); }
      break;
    }
    case 'leaves': {
      // leaves whirl from the user to the target
      for (let i = 0; i < 14; i++) {
        const k = clamp01(p * 1.4 - i * 0.03);
        if (k <= 0 || k >= 1) continue;
        const x = lerp(x1, x2, k) + Math.sin(k * 9 + i) * 8;
        const y = lerp(y1, y2, k) - Math.sin(k * Math.PI) * 20 + Math.cos(k * 9 + i) * 8;
        g.save(); g.translate(x, y); g.rotate(k * 12 + i);
        g.fillStyle = i % 2 ? '#5cae3c' : '#8ed05a'; g.fillRect(-4, -2, 8, 4); g.fillStyle = '#2f6a22'; g.fillRect(-4, 0, 8, 1);
        g.restore();
      }
      break;
    }
    case 'rocks': {
      // stones fall on the target from above
      for (let i = 0; i < 6; i++) {
        const k = clamp01((p - i * 0.07) / 0.5);
        if (k <= 0) continue;
        const x = x2 + (hash(i) - 0.5) * 56;
        const land = y2 + 18 + (hash(i, 2) - 0.5) * 12;
        const y = k < 1 ? lerp(land - 120, land, k * k) : land;
        g.globalAlpha = k >= 1 ? clamp01(1 - (p - i * 0.07 - 0.5) * 3) : 1;
        g.fillStyle = '#7a6a3a'; g.fillRect(x - 5, y - 5, 10, 9);
        g.fillStyle = color; g.fillRect(x - 5, y - 5, 7, 5); g.fillStyle = '#4a3e22'; g.fillRect(x - 5, y + 3, 10, 1);
        if (k >= 1) { g.fillStyle = '#d8c896'; for (let d = 0; d < 4; d++) g.fillRect(x + (d - 1.5) * 9 * (p - i * 0.07 - 0.5) * 4, land - 4 - d * 2, 2, 2); }
      }
      break;
    }
    case 'bubbles': {
      // toxic bubbles rise around the target
      for (let i = 0; i < 12; i++) {
        const k = clamp01(p * 1.3 - hash(i) * 0.3);
        if (k <= 0 || k >= 1) continue;
        g.globalAlpha = 1 - k * 0.7;
        g.fillStyle = color; g.strokeStyle = '#e6c0f0'; g.lineWidth = 1;
        const r = 3 + hash(i, 2) * 5;
        g.beginPath(); g.arc(x2 + (hash(i, 3) - 0.5) * 50, y2 + 24 - k * 56, r, 0, 7); g.fill(); g.stroke();
      }
      break;
    }
    case 'rings': {
      // waves of force spread from the target
      g.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const k = clamp01(p * 1.5 - i * 0.2);
        if (k <= 0 || k >= 1) continue;
        g.globalAlpha = 1 - k;
        g.strokeStyle = i % 2 ? '#ffffff' : color;
        g.beginPath(); g.ellipse(x2, y2 + 6, 6 + k * 48, 4 + k * 34, 0, 0, 7); g.stroke();
      }
      break;
    }
    case 'shadow': {
      // dark spheres close in on the target
      for (let i = 0; i < 9; i++) {
        const k = clamp01(p * 1.3 - i * 0.04);
        const a = i * 0.7 + p * 5;
        const r = lerp(60, 4, k);
        g.globalAlpha = 0.25 + k * 0.6;
        g.fillStyle = i % 2 ? '#2a1e3a' : color;
        g.beginPath(); g.arc(x2 + Math.cos(a) * r, y2 + 4 + Math.sin(a) * r * 0.6, 4 + k * 5, 0, 7); g.fill();
      }
      break;
    }
    case 'swarm': {
      // a cloud of small insects circles the target
      g.fillStyle = color;
      for (let i = 0; i < 18; i++) {
        const a = p * 14 + i * 0.9;
        const r = 10 + (i % 4) * 7 + (1 - p) * 20;
        g.globalAlpha = p > 0.8 ? (1 - p) * 5 : 1;
        g.fillRect(x2 + Math.cos(a) * r, y2 + Math.sin(a * 1.2) * r * 0.6, 3, 2);
      }
      break;
    }
    default:
  }
  g.restore();
}
