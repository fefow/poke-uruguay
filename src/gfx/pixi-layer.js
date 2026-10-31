// WebGL presentation layer (PixiJS). The game still draws its 480x270 pixel-art
// frame into a 2D canvas; this layer uploads it as a texture every frame and
// shows it through a colour-grading shader (vignette, warm light, soft bloom).
// If WebGL is unavailable the plain 2D canvas stays visible.
import 'pixi.js/unsafe-eval'; // no new Function(): the page CSP forbids eval
import { Application, Sprite, Texture, Filter, GlProgram } from 'pixi.js';
import { W, H } from './screen.js';

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

export function renderPixi() {
  if (!app) return;
  tex.source.update();
  app.renderer.render(app.stage);
}

export const pixiActive = () => !!app;
