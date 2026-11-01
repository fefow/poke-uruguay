// WebGL presentation layer (PixiJS). The game still draws its 480x270 pixel-art
// frame into a 2D canvas; this layer uploads it as a texture every frame and
// shows it through a colour-grading shader (vignette, warm light, soft bloom).
// If WebGL is unavailable the plain 2D canvas stays visible.
import 'pixi.js/unsafe-eval'; // no new Function(): the page CSP forbids eval
import { Application, Sprite, Texture, Filter, GlProgram, Container } from 'pixi.js';
import { W, H, skyHour } from './screen.ts';

const VERT = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
void main(){
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}`;

const FRAG = `in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uWarm;   // 0 = neutral, >0 warm light
uniform float uVig;    // vignette strength
uniform vec2 uTexel;   // 1 / source size
void main(){
  vec2 uv = vTextureCoord;
  vec3 c = texture(uTexture, uv).rgb;
  // soft bloom: average of the 4 diagonal neighbours, only the bright part
  vec3 b = (texture(uTexture, uv + uTexel * vec2( 1.5,  1.5)).rgb + texture(uTexture, uv + uTexel * vec2(-1.5,  1.5)).rgb
          + texture(uTexture, uv + uTexel * vec2( 1.5, -1.5)).rgb + texture(uTexture, uv + uTexel * vec2(-1.5, -1.5)).rgb) * 0.25;
  c += max(b - 0.72, 0.0) * 0.55;
  // gentle contrast + saturation
  c = (c - 0.5) * 1.06 + 0.5;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, 1.1);
  c *= mix(vec3(1.0), vec3(1.06, 1.0, 0.9), uWarm);
  // vignette
  vec2 d = uv - 0.5;
  float v = smoothstep(0.35, 0.95, length(d * vec2(1.0, 1.15)));
  c *= 1.0 - v * uVig;
  finalColor = vec4(c, 1.0);
}`;

let app = null;
let tex = null;
let uniforms = null;
let lightLayer = null;
let partLayer = null;
let glowTex = null;
const lightSprites = [];
const parts = [];
// What the world renderer says is on screen this frame (positions in 480x270 logical pixels).
const fx = { at: -1e9, outdoor: false, night: 0, lights: [] };
const SC = 4;

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return Texture.from(c);
}

/** Called by the world renderer every frame: outdoor flag, 0..1 night level and light sources [{x, y, r, color}]. */
export function setFx(outdoor, night, lights) {
  fx.at = performance.now();
  fx.outdoor = outdoor;
  fx.night = night;
  fx.lights = lights;
}

/** 0 by day, 1 at night, in between at dusk and dawn (in-game clock, like the colour grade). */
export function nightLevel(hr = skyHour()) {
  if (hr >= 20 || hr < 5.5) return 1;
  if (hr >= 18) return 0.55;
  if (hr < 7.5) return 0.3;
  return 0;
}

/** Create the WebGL canvas on top of the 2D one. Resolves false when WebGL is not available. */
export async function mountPixi(source, host) {
  try {
    const canvas = document.createElement('canvas');
    canvas.id = 'gl';
    app = new Application();
    await app.init({ canvas, width: W * 4, height: H * 4, antialias: false, background: '#000', autoDensity: false, preference: 'webgl' });
    const sprite = new Sprite(Texture.from(source));
    tex = sprite.texture;
    tex.source.scaleMode = 'nearest';
    sprite.width = W * 4;
    sprite.height = H * 4;
    uniforms = { uWarm: { value: 0, type: 'f32' }, uVig: { value: 0.28, type: 'f32' }, uTexel: { value: [1 / W, 1 / H], type: 'vec2<f32>' } };
    sprite.filters = [new Filter({ glProgram: GlProgram.from({ vertex: VERT, fragment: FRAG }), resources: { grade: uniforms } })];
    app.stage.addChild(sprite);
    glowTex = glowTexture();
    lightLayer = new Container();
    partLayer = new Container();
    app.stage.addChild(lightLayer, partLayer);
    for (let i = 0; i < 36; i++) {
      const sp = new Sprite(glowTex);
      sp.anchor.set(0.5);
      sp.blendMode = 'add';
      partLayer.addChild(sp);
      parts.push({ sp, x: Math.random() * 480, y: Math.random() * 270, v: 0.4 + Math.random() * 0.8, ph: Math.random() * 7, sz: 0.05 + Math.random() * 0.07 });
    }
    app.ticker.stop(); // we render manually, once per game frame
    host.append(canvas);
    host.classList.add('has-gl');
    return true;
  } catch (e) {
    console.warn('WebGL no disponible, se usa el canvas 2D', e);
    app = null;
    return false;
  }
}

export function setGrade({ warm = 0, vignette = 0.28 } = {}) {
  if (!uniforms) return;
  uniforms.uWarm.value = warm;
  uniforms.uVig.value = vignette;
}

const lamp = (i) => {
  while (lightSprites.length <= i) {
    const sp = new Sprite(glowTex);
    sp.anchor.set(0.5);
    sp.blendMode = 'add';
    lightLayer.addChild(sp);
    lightSprites.push(sp);
  }
  return lightSprites[i];
};

function updateFx(now) {
  const live = now - fx.at < 150 && fx.outdoor;
  // lights: lamps and fires, warm pools that flicker; stronger at night
  const lights = now - fx.at < 150 ? fx.lights : [];
  const glow = 0.25 + fx.night * 0.75;
  lights.forEach((l, i) => {
    const sp = lamp(i);
    const flick = 0.88 + 0.12 * Math.sin(now / 130 + l.x * 3.1 + l.y);
    sp.visible = true;
    sp.tint = l.color ?? 0xffc870;
    sp.position.set(l.x * SC, l.y * SC);
    sp.scale.set(((l.r ?? 34) * 2 * SC) / 128 * (0.96 + 0.04 * flick));
    sp.alpha = (l.strength ?? 0.6) * glow * flick;
  });
  for (let i = lights.length; i < lightSprites.length; i++) lightSprites[i].visible = false;
  // ambient particles: fireflies at night, floating pollen by day
  const night = fx.night;
  for (const p of parts) {
    p.sp.visible = live;
    if (!live) continue;
    p.x += (Math.sin(now / 1900 + p.ph) * 0.12 + 0.05) * p.v;
    p.y += Math.cos(now / 2300 + p.ph) * 0.1 * p.v - 0.03;
    if (p.x > 484) p.x = -4; if (p.x < -4) p.x = 484; if (p.y < -4) p.y = 274; if (p.y > 274) p.y = -4;
    const blink = Math.max(0, Math.sin(now / 700 + p.ph * 2));
    p.sp.position.set(p.x * SC, p.y * SC);
    if (night > 0.5) { p.sp.tint = 0xc8ff78; p.sp.scale.set(p.sz * 1.6); p.sp.alpha = 0.15 + 0.85 * blink * blink * night; }
    else { p.sp.tint = 0xfff4c8; p.sp.scale.set(p.sz); p.sp.alpha = 0.18 + 0.12 * blink; }
  }
}

export function renderPixi() {
  if (!app) return;
  updateFx(performance.now());
  tex.source.update();
  app.renderer.render(app.stage);
}

export const pixiActive = () => !!app;
