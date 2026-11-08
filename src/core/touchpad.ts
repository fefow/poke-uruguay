// On-screen controls for phones and tablets, styled like a handheld console: a D-pad on the left, Z and X (the same keys as on a computer) on the
// right, floating over the full-screen game, MENÚ and ×2 (run) on top. They drive the same actions as the keyboard (see input.ts). Landscape only:
// in portrait a hint asks to rotate. Desktop (a mouse or any hover device) never sees any of this.
import { input } from './input.ts';

const TOUCH = '(hover: none) and (pointer: coarse)';

export function mountTouchPad() {
  if (!matchMedia(TOUCH).matches) return;
  document.body.classList.add('gb');
  const el = (tag: string, cls: string, text = '') => { const e = document.createElement(tag); e.className = cls; if (text) e.textContent = text; return e; };
  const buzz = () => { try { navigator.vibrate?.(8); } catch { /* not supported */ } };

  // plain buttons: held while the finger is down
  const button = (cls: string, label: string, action: string) => {
    const b = el('button', `gb-btn ${cls}`, label) as HTMLButtonElement;
    b.type = 'button';
    b.setAttribute('aria-label', action);
    let down = false;
    const up = () => { if (!down) return; down = false; b.classList.remove('is-down'); input.release(action); };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); if (down) return; down = true; b.classList.add('is-down'); buzz(); input.hold(action); });
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(t, up);
    return b;
  };

  // D-pad: one touch area; the direction follows the finger, also when it slides across the cross
  const dpad = el('div', 'gb-dpad');
  for (const d of ['up', 'down', 'left', 'right']) dpad.append(el('i', `gb-arrow ga-${d}`));
  dpad.append(el('i', 'gb-hub'));
  let dir: string | null = null, repeat = 0, delay = 0;
  const stop = () => { clearTimeout(delay); clearInterval(repeat); };
  const setDir = (d: string | null) => {
    if (d === dir) return;
    if (dir) { input.release(dir); dpad.classList.remove(`on-${dir}`); }
    stop();
    dir = d;
    if (!d) return;
    dpad.classList.add(`on-${d}`);
    buzz();
    input.hold(d);
    // menus step on presses, so a held direction repeats like a key does
    delay = window.setTimeout(() => { repeat = window.setInterval(() => input.press(d), 130); }, 320);
  };
  const aim = (e: PointerEvent) => {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.1) return setDir(null);
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
  };
  dpad.addEventListener('pointerdown', (e) => { e.preventDefault(); dpad.setPointerCapture?.(e.pointerId); aim(e); });
  dpad.addEventListener('pointermove', (e) => { if (e.buttons || e.pressure > 0) aim(e); });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) dpad.addEventListener(t, () => setDir(null));

  const left = el('div', 'gb-side gb-left');
  const lt = el('div', 'gb-top'); lt.append(button('gb-pill', 'MENÚ', 'start'));
  left.append(lt, dpad);
  const right = el('div', 'gb-side gb-right');
  const rt = el('div', 'gb-top'); rt.append(button('gb-pill', '×2', 'run'));
  const ab = el('div', 'gb-ab'); ab.append(button('gb-round gb-b', 'X', 'b'), button('gb-round gb-a', 'Z', 'a'));
  right.append(rt, ab);
  const pad = el('div', 'gb-pad'); pad.append(left, right);
  pad.addEventListener('contextmenu', (e) => e.preventDefault());

  const rotate = el('div', 'gb-rotate');
  rotate.append(el('div', 'gb-rotate-icon', '⟳'), el('p', '', 'Girá el celular para jugar'), el('p', 'gb-rotate-sub', 'El juego se juega en horizontal, como una consola portátil.'));
  document.body.append(pad, rotate);

  // iOS: no zoom by pinch or double tap, no long-press menus or text selection while playing
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(t, (e) => e.preventDefault());
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => { const now = Date.now(); if (now - lastTouch < 350) e.preventDefault(); lastTouch = now; }, { passive: false });

  // Safari shows its bars and cannot go full screen: suggest installing it to the home screen (once)
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let seen = false;
  try { seen = localStorage.getItem('pk_a2hs') === '1'; } catch { /* private mode */ }
  if (ios && !(navigator as any).standalone && !seen) {
    const tip = el('div', 'gb-tip');
    tip.append(el('span', '', 'Para jugar a pantalla completa: Compartir → Agregar a pantalla de inicio.'));
    const x = el('button', 'gb-tip-x', '✕') as HTMLButtonElement;
    x.type = 'button';
    x.addEventListener('click', () => { tip.remove(); try { localStorage.setItem('pk_a2hs', '1'); } catch { /* ignore */ } });
    tip.append(x);
    document.body.append(tip);
    setTimeout(() => tip.remove(), 12000);
  }
}
