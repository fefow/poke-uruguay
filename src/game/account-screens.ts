// Account and save-slot screens: modern HTML overlays (not pixel art, on purpose)
// that sit on top of the animated title. They cover the whole screen, so they
// mount on #screen instead of the centred UI column.
//
// Keyboard: Tab / arrows move between controls, Enter uses them, Esc goes back,
// Supr deletes the focused save. Gamepad and the touch pad drive the same focus
// through the game's input stack.
import { h, formatTime } from '../core/util.ts';
import { input } from '../core/input.ts';
import { sfx } from '../core/audio.ts';
import { creatureSprite } from '../gfx/creatures.ts';
import { charSprite } from '../gfx/characters.ts';
import { SPECIES } from '../data/species.ts';
import { USERNAME_RE, PASSWORD_MIN, AuthError } from '../save/auth.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICONS = {
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z',
  lock: 'M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z',
  eye: 'M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  eyeOff: 'M3.3 2 22 20.7 20.7 22l-3.4-3.4A11 11 0 0 1 12 19c-5 0-9-4.5-10-7a13 13 0 0 1 4.2-5.1L2 3.3 3.3 2ZM12 5c5 0 9 4.5 10 7a12.7 12.7 0 0 1-2.9 4.1l-3.3-3.3A4 4 0 0 0 11.2 8.2L8.9 5.9A10 10 0 0 1 12 5Z',
  trash: 'M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h1.5v-8H10Zm3.5 0v8H15v-8h-1.5Z',
  plus: 'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7V4Z',
  cloud: 'M7 19a5 5 0 0 1-.8-9.9A6.5 6.5 0 0 1 18.8 8 5.5 5.5 0 0 1 18 19H7Z',
  device: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 3v13h10V5H7Zm4 14.5a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z',
  gear: 'M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8.5-2.6ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z',
  logout: 'M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3Zm5.6 4.4L14.2 8.8l2.2 2.2H8v2h8.4l-2.2 2.2 1.4 1.4L20.2 12l-4.6-4.6Z',
  login: 'M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5v-2h5V5h-5V3ZM9.6 7.4 8.2 8.8l2.2 2.2H2v2h8.4l-2.2 2.2 1.4 1.4L14.2 12 9.6 7.4Z',
  film: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v2h2V6H5Zm12 0v2h2V6h-2ZM5 10v4h2v-4H5Zm12 0v4h2v-4h-2ZM5 16v2h2v-2H5Zm12 0v2h2v-2h-2ZM9 6v12h6V6H9Z',
  alert: 'M12 2 1 21h22L12 2Zm-1 7h2v6h-2V9Zm0 8h2v2h-2v-2Z',
  check: 'M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4-9.6 9.6Z',
};

function icon(name: keyof typeof ICONS, cls = 'acct-ico') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', ICONS[name]);
  svg.append(p);
  return svg;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex="0"]';

/**
 * Mounts a full-screen layer and routes keyboard + game input to it.
 * Returns the element and a close function.
 */
function mountLayer(cls: string, onBack: () => void) {
  const screen = document.querySelector('#screen') ?? document.body;
  const el: HTMLElement = h('div', { class: `acct ${cls}`, role: 'dialog', 'aria-modal': 'true' });
  const focusables = () => [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null && !n.closest('.acct-modal-host[hidden]'));
  const scope = () => {
    // A confirmation modal on top takes the keyboard.
    const modal = el.querySelector<HTMLElement>('.acct-modal');
    return modal ? [...modal.querySelectorAll<HTMLElement>(FOCUSABLE)] : focusables();
  };
  // Spatial navigation: nearest control in the pressed direction.
  const move = (dir: string) => {
    const list = scope();
    if (!list.length) return;
    const cur = document.activeElement as HTMLElement;
    if (!list.includes(cur)) { list[0].focus(); return; }
    const a = cur.getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best: HTMLElement | null = null, bestScore = Infinity;
    for (const n of list) {
      if (n === cur) continue;
      const b = n.getBoundingClientRect();
      const bx = b.left + b.width / 2, by = b.top + b.height / 2;
      const dx = bx - ax, dy = by - ay;
      const main = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
      if (main <= 2) continue;
      const side = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
      const score = main + side * 2.5;
      if (score < bestScore) { bestScore = score; best = n; }
    }
    if (best) { best.focus(); sfx('select'); }
  };
  const back = () => {
    const modal = el.querySelector<HTMLElement>('.acct-modal');
    if (modal) (modal.querySelector('[data-cancel]') as HTMLElement)?.click();
    else onBack();
  };
  // Keys pressed inside the layer never reach the game.
  el.addEventListener('keydown', (e: KeyboardEvent) => {
    e.stopPropagation();
    const t = e.target as HTMLElement;
    const typing = t instanceof HTMLInputElement && (t.type === 'text' || t.type === 'password');
    if (e.key === 'Escape') { e.preventDefault(); back(); return; }
    if (e.key === 'Tab') {
      // Keep Tab inside the modal when one is open.
      const list = scope();
      if (!list.length) return;
      const i = list.indexOf(t);
      if (e.shiftKey && i <= 0) { e.preventDefault(); list.at(-1).focus(); }
      else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus(); }
      return;
    }
    const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
    if (dir && !(typing && (dir === 'left' || dir === 'right'))) { e.preventDefault(); move(dir); }
  });
  // Gamepad, touch pad, and keys pressed while nothing in the layer has focus.
  const pop = input.push((a) => {
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') move(a);
    else if (a === 'a') {
      const cur = document.activeElement as HTMLElement;
      if (el.contains(cur)) cur.click(); else scope()[0]?.focus();
    } else if (a === 'b' || a === 'start') back();
  });
  screen.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  const close = () => { pop(); el.remove(); };
  return { el, close, focusFirst: (sel?: string) => setTimeout(() => (el.querySelector<HTMLElement>(sel ?? FOCUSABLE))?.focus({ preventScroll: true }), 60) };
}

function brand(sub = 'La tierra de los charrúas') {
  return h('div', { class: 'acct-brand' },
    h('div', { class: 'acct-flag', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'), h('b')),
    h('div', {}, h('h1', { text: 'Poke Uruguay' }), h('p', { text: sub })));
}

function spinner() { return h('span', { class: 'acct-spin', 'aria-hidden': 'true' }); }

// ---------------------------------------------------------------- login / register
export type AuthResult = { kind: 'cloud'; username: string; created: boolean } | { kind: 'local' };

export function authScreen({ notice = '', signIn, signUp, start = 'login' }: {
  notice?: string;
  signIn: (u: string, p: string) => Promise<string>;
  signUp: (u: string, p: string) => Promise<string>;
  start?: 'login' | 'register';
}): Promise<AuthResult> {
  return new Promise((resolve) => {
    let mode: 'login' | 'register' = start;
    let busy = false;
    let layer;

    const tabLogin = h('button', { type: 'button', class: 'acct-seg-btn', role: 'tab', text: 'Iniciar sesión' });
    const tabReg = h('button', { type: 'button', class: 'acct-seg-btn', role: 'tab', text: 'Crear cuenta' });
    const seg = h('div', { class: 'acct-seg', role: 'tablist' }, h('span', { class: 'acct-seg-pill', 'aria-hidden': 'true' }), tabLogin, tabReg);

    const field = (id, label, ico, attrs, extra = null) => {
      const inp = h('input', { id, class: 'acct-input', spellcheck: 'false', autocapitalize: 'off', ...attrs });
      const wrap = h('div', { class: 'acct-field' },
        h('label', { for: id, text: label }),
        h('div', { class: 'acct-input-wrap' }, icon(ico, 'acct-ico acct-ico-lead'), inp, extra));
      return { inp, wrap };
    };
    const eyeBtn = (getInputs: () => HTMLInputElement[]) => {
      const b = h('button', { type: 'button', class: 'acct-eye', title: 'Mostrar contraseña', 'aria-label': 'Mostrar contraseña' }, icon('eye'));
      b.addEventListener('click', () => {
        const show = getInputs()[0].type === 'password';
        for (const i of getInputs()) i.type = show ? 'text' : 'password';
        b.replaceChildren(icon(show ? 'eyeOff' : 'eye'));
        b.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
      return b;
    };
    const user = field('acct-user', 'Usuario', 'user', { type: 'text', maxlength: '16', autocomplete: 'username', placeholder: 'tu_usuario' });
    const pass = field('acct-pass', 'Contraseña', 'lock', { type: 'password', maxlength: '72', placeholder: '••••••••' }, eyeBtn(() => [pass.inp, pass2.inp]));
    const pass2 = field('acct-pass2', 'Repetí la contraseña', 'lock', { type: 'password', maxlength: '72', autocomplete: 'new-password', placeholder: '••••••••' });

    const userHint = h('p', { class: 'acct-hint' });
    const meter = h('div', { class: 'acct-meter', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'));
    const passHint = h('p', { class: 'acct-hint' });
    const matchHint = h('p', { class: 'acct-hint' });
    user.wrap.append(userHint);
    pass.wrap.append(meter, passHint);
    pass2.wrap.append(matchHint);

    const alert = h('div', { class: 'acct-alert', role: 'alert', hidden: true });
    const showAlert = (text, kind = 'error') => {
      alert.className = `acct-alert is-${kind}`;
      alert.replaceChildren(icon(kind === 'error' ? 'alert' : 'check'), h('span', { text }));
      alert.hidden = !text;
    };
    if (notice) showAlert(notice, 'info');

    const submitLabel = h('span');
    const submit = h('button', { type: 'button', class: 'acct-btn acct-btn-primary' }, submitLabel);
    const guest = h('button', { type: 'button', class: 'acct-btn acct-btn-ghost' }, icon('device'), h('span', { text: 'Jugar sin cuenta' }));
    const guestNote = h('p', { class: 'acct-fine', text: 'Sin cuenta, tus partidas quedan solo en este navegador.' });
    const regNote = h('p', { class: 'acct-fine acct-fine-warn', text: 'No hay recuperación de contraseña: anotala en un lugar seguro.' });

    const title = h('h2', { class: 'acct-card-title' });
    const subtitle = h('p', { class: 'acct-card-sub' });

    const card = h('div', { class: 'acct-card' },
      seg, title, subtitle,
      h('div', { class: 'acct-fields' }, user.wrap, pass.wrap, pass2.wrap),
      alert, submit, regNote,
      h('div', { class: 'acct-or' }, h('span', { text: 'o' })),
      guest, guestNote);

    const strength = (p: string) => {
      if (!p) return 0;
      let s = p.length >= PASSWORD_MIN ? 1 : 0;
      if (p.length >= 12) s++;
      if (/[a-z]/.test(p) && /[A-Z0-9]/.test(p)) s++;
      if (/[^a-zA-Z0-9]/.test(p) || p.length >= 16) s++;
      return Math.max(1, s);
    };
    const live = () => {
      const reg = mode === 'register';
      const u = user.inp.value.trim().toLowerCase();
      const p = pass.inp.value;
      if (reg) {
        const okU = USERNAME_RE.test(u);
        userHint.textContent = !u ? '3 a 16 caracteres: letras minúsculas, números o _.' : okU ? 'Nombre disponible para probar.' : 'Solo letras minúsculas, números o _ (3 a 16).';
        userHint.className = `acct-hint ${u ? (okU ? 'is-ok' : 'is-bad') : ''}`;
        const s = strength(p);
        meter.dataset.level = String(p ? s : 0);
        passHint.textContent = !p ? `Mínimo ${PASSWORD_MIN} caracteres.` : p.length < PASSWORD_MIN ? `Faltan ${PASSWORD_MIN - p.length} caracteres.` : ['', 'Aceptable', 'Buena', 'Muy buena', 'Excelente'][s];
        passHint.className = `acct-hint ${p ? (p.length >= PASSWORD_MIN ? 'is-ok' : 'is-bad') : ''}`;
        const p2 = pass2.inp.value;
        matchHint.textContent = !p2 ? '' : p2 === p ? 'Las contraseñas coinciden.' : 'Las contraseñas no coinciden.';
        matchHint.className = `acct-hint ${p2 ? (p2 === p ? 'is-ok' : 'is-bad') : ''}`;
      }
      submit.disabled = busy || !u || !p || (reg && (!USERNAME_RE.test(u) || p.length < PASSWORD_MIN || p !== pass2.inp.value));
    };
    const setMode = (m: 'login' | 'register', focus = true) => {
      mode = m;
      const reg = m === 'register';
      card.classList.toggle('is-register', reg);
      tabLogin.setAttribute('aria-selected', String(!reg));
      tabReg.setAttribute('aria-selected', String(reg));
      title.textContent = reg ? 'Creá tu cuenta' : 'Bienvenido de vuelta';
      subtitle.textContent = reg ? 'Guardá hasta 10 partidas online y seguí jugando desde cualquier dispositivo.' : 'Entrá con tu usuario para seguir tus partidas.';
      submitLabel.textContent = reg ? 'Crear cuenta' : 'Entrar';
      pass.inp.setAttribute('autocomplete', reg ? 'new-password' : 'current-password');
      for (const n of [pass2.wrap, regNote, userHint, meter, passHint]) n.hidden = !reg;
      if (alert.classList.contains('is-error')) showAlert('');
      live();
      if (focus) user.inp.focus();
    };

    const finish = (r: AuthResult) => { layer.close(); resolve(r); };
    const go = async () => {
      live();
      if (submit.disabled) {
        if (!user.inp.value.trim()) user.inp.focus();
        else if (!pass.inp.value) pass.inp.focus();
        else if (mode === 'register') pass2.inp.focus();
        return;
      }
      busy = true;
      card.classList.add('is-busy');
      submit.replaceChildren(spinner(), h('span', { text: mode === 'register' ? 'Creando cuenta…' : 'Entrando…' }));
      showAlert('');
      try {
        const u = user.inp.value.trim().toLowerCase();
        const name = mode === 'register' ? await signUp(u, pass.inp.value) : await signIn(u, pass.inp.value);
        sfx('confirm');
        finish({ kind: 'cloud', username: name, created: mode === 'register' });
      } catch (err) {
        sfx('bump');
        showAlert(err instanceof AuthError ? err.message : 'No se pudo completar. Probá de nuevo.');
        card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        busy = false;
        card.classList.remove('is-busy');
        submit.replaceChildren(submitLabel);
        live();
        pass.inp.select();
      }
    };

    tabLogin.addEventListener('click', () => { if (!busy) { sfx('select'); setMode('login'); } });
    tabReg.addEventListener('click', () => { if (!busy) { sfx('select'); setMode('register'); } });
    for (const f of [user, pass, pass2]) {
      f.inp.addEventListener('input', live);
      f.inp.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (f === user) pass.inp.focus();
        else if (f === pass && mode === 'register') pass2.inp.focus();
        else go();
      });
    }
    submit.addEventListener('click', go);
    guest.addEventListener('click', () => { if (!busy) { sfx('confirm'); finish({ kind: 'local' }); } });

    const features = h('ul', { class: 'acct-features' },
      ...[['cloud', 'Tus partidas en la nube', 'Seguí desde la compu o el celular.'],
        ['film', '10 partidas por cuenta', 'Probá otros iniciales y rutas.'],
        ['check', 'Guardado automático', 'Cada pocos segundos, sin pensarlo.']].map(([ic, t, d]) =>
        h('li', {}, h('span', { class: 'acct-feat-ico' }, icon(ic as any)), h('div', {}, h('b', { text: t }), h('span', { text: d })))));

    layer = mountLayer('acct-auth', () => { if (!busy) guest.click(); });
    layer.el.append(h('div', { class: 'acct-auth-grid' },
      h('section', { class: 'acct-hero' }, brand(), features),
      card));
    setMode(mode, false);
    layer.focusFirst('#acct-user');
  });
}

// ---------------------------------------------------------------- confirmation
export function confirmModal(host: HTMLElement, { title, text, ok = 'Aceptar', cancel = 'Cancelar', danger = false, detail = null as HTMLElement | null }): Promise<boolean> {
  return new Promise((resolve) => {
    const prev = document.activeElement as HTMLElement;
    const okBtn = h('button', { type: 'button', class: `acct-btn ${danger ? 'acct-btn-danger' : 'acct-btn-primary'}`, text: ok });
    const noBtn = h('button', { type: 'button', class: 'acct-btn acct-btn-ghost', 'data-cancel': '', text: cancel });
    const box = h('div', { class: 'acct-modal', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'acct-modal-t' },
      danger ? h('div', { class: 'acct-modal-ico' }, icon('trash')) : null,
      h('h3', { id: 'acct-modal-t', text: title }),
      h('p', { text }),
      detail,
      h('div', { class: 'acct-modal-actions' }, noBtn, okBtn));
    const scrim = h('div', { class: 'acct-scrim' }, box);
    const done = (v: boolean) => { scrim.remove(); sfx(v ? 'confirm' : 'cancel'); prev?.focus?.({ preventScroll: true }); resolve(v); };
    okBtn.addEventListener('click', () => done(true));
    noBtn.addEventListener('click', () => done(false));
    scrim.addEventListener('click', (e) => { if (e.target === scrim) done(false); });
    host.append(scrim);
    // Cancel is focused first so a stray Enter never deletes anything.
    setTimeout(() => noBtn.focus(), 30);
  });
}

// ---------------------------------------------------------------- save slots
export type SlotInfo = { slot: number; savedAt?: number; summary: any };
export type HubAction =
  | { type: 'load'; save: SlotInfo }
  | { type: 'new'; slot: number }
  | { type: 'options' | 'credits' | 'login' | 'logout' | 'expired' };

function spriteSrc(c): string {
  try {
    if (c instanceof HTMLCanvasElement) return c.toDataURL();
    if (c instanceof HTMLImageElement) return c.src;
    if (c && 'width' in c) {
      const cv = document.createElement('canvas');
      cv.width = c.width; cv.height = c.height;
      cv.getContext('2d').drawImage(c, 0, 0);
      return cv.toDataURL();
    }
  } catch { /* fall through */ }
  return '';
}

function avatar(summary) {
  const lead = summary?.lead && SPECIES[summary.lead] ? summary.lead : null;
  const src = lead ? spriteSrc(creatureSprite(lead)) : spriteSrc(charSprite(summary?.look ?? 'player_m', 'down'));
  return h('div', { class: `acct-avatar ${lead ? 'is-creature' : 'is-char'}` }, src ? h('img', { src, alt: '' }) : null);
}

function ago(ts?: number) {
  if (!ts || !Number.isFinite(ts)) return '';
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'Hace un momento';
  if (s < 3600) return `Hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Hace ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) { const d = Math.floor(s / 86400); return `Hace ${d} día${d > 1 ? 's' : ''}`; }
  return new Date(ts).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function savesHub({ slots, account, cloud, canLogin, load, remove, notice = '', version = '' }: {
  slots: number;
  account: string | null;
  cloud: boolean;
  canLogin: boolean;
  load: () => Promise<SlotInfo[]>;
  remove: (slot: number) => Promise<void>;
  notice?: string;
  version?: string;
}): Promise<HubAction> {
  return new Promise((resolve) => {
    let saves: SlotInfo[] = [];
    let layer;
    const finish = (a: HubAction) => { layer.close(); resolve(a); };

    const grid = h('div', { class: 'acct-grid', role: 'list' });
    const banner = h('div', { class: 'acct-alert', role: 'status', hidden: true });
    const showBanner = (text, kind = 'info') => {
      banner.className = `acct-alert is-${kind}`;
      banner.replaceChildren(icon(kind === 'error' ? 'alert' : 'check'), h('span', { text }));
      banner.hidden = !text;
    };
    const counter = h('span', { class: 'acct-count' });

    const card = (n: number) => {
      const s = saves.find((x) => x.slot === n);
      const num = h('span', { class: 'acct-slot-num', text: String(n).padStart(2, '0') });
      if (!s) {
        const b = h('button', { type: 'button', class: 'acct-slot is-empty', role: 'listitem', 'aria-label': `Ranura ${n}: vacía. Empezar una partida nueva` },
          num, h('span', { class: 'acct-slot-plus' }, icon('plus')), h('b', { text: 'Nueva partida' }), h('span', { class: 'acct-slot-sub', text: 'Ranura libre' }));
        b.addEventListener('click', () => { sfx('confirm'); finish({ type: 'new', slot: n }); });
        return b;
      }
      const sm = s.summary ?? {};
      const badges = Math.max(0, Math.min(12, sm.badges ?? 0));
      const pips = h('div', { class: 'acct-pips', title: `${badges} medallas`, 'aria-hidden': 'true' },
        ...Array.from({ length: 12 }, (_, i) => h('i', { class: i < badges ? 'on' : '' })));
      const del = h('button', { type: 'button', class: 'acct-slot-del', title: 'Borrar partida', 'aria-label': `Borrar la partida de la ranura ${n}` }, icon('trash'));
      const main = h('button', { type: 'button', class: 'acct-slot-main', 'aria-label': `Ranura ${n}: ${sm.name}, ${badges} medallas. Continuar` },
        num,
        sm.champion ? h('span', { class: 'acct-champ', title: 'Campeón' }, icon('star'), h('span', { text: 'Campeón' })) : null,
        avatar(sm),
        h('b', { class: 'acct-slot-name', text: sm.name ?? 'Partida' }),
        h('span', { class: 'acct-slot-loc', text: sm.location || '—' }),
        pips,
        h('div', { class: 'acct-slot-stats' },
          h('span', {}, h('em', { text: String(badges) }), ' med.'),
          h('span', {}, h('em', { text: String(sm.dex ?? 0) }), ' dex'),
          h('span', {}, h('em', { text: formatTime(sm.playtime ?? 0) }), ' h')),
        h('span', { class: 'acct-slot-sub', text: ago(s.savedAt) }));
      main.addEventListener('click', () => { sfx('confirm'); finish({ type: 'load', save: s }); });
      const askDelete = async () => {
        const ok = await confirmModal(layer.el, {
          title: '¿Borrar esta partida?',
          text: `Se va a borrar para siempre la partida de ${sm.name ?? 'esta ranura'} (ranura ${n}). Esto no se puede deshacer.`,
          detail: h('div', { class: 'acct-modal-detail' }, avatar(sm), h('div', {},
            h('b', { text: sm.name ?? 'Partida' }),
            h('span', { text: `${sm.location || '—'} · ${badges} medallas · ${formatTime(sm.playtime ?? 0)} jugadas` }))),
          ok: 'Borrar partida', danger: true,
        });
        if (!ok) return;
        const wrap = del.closest('.acct-slot');
        wrap?.classList.add('is-deleting');
        try {
          await remove(n);
          saves = saves.filter((x) => x.slot !== n);
          showBanner(`Partida de la ranura ${n} borrada.`, 'ok');
          render(n);
        } catch (err) {
          wrap?.classList.remove('is-deleting');
          sfx('bump');
          showBanner(`No se pudo borrar: ${err?.message ?? 'error desconocido'}`, 'error');
        }
      };
      del.addEventListener('click', (e) => { e.stopPropagation(); askDelete(); });
      const wrap = h('div', { class: 'acct-slot is-full', role: 'listitem', 'data-slot': String(n) }, main, del);
      wrap.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Delete' || (e.key === 'Backspace' && !(e.target instanceof HTMLInputElement))) { e.preventDefault(); askDelete(); }
      });
      return wrap;
    };

    const render = (focusSlot?: number) => {
      grid.replaceChildren(...Array.from({ length: slots }, (_, i) => card(i + 1)));
      counter.textContent = `${saves.length} de ${slots} ranuras usadas`;
      if (focusSlot) {
        const el = grid.children[focusSlot - 1] as HTMLElement;
        (el?.matches('button') ? el : el?.querySelector('button'))?.focus({ preventScroll: true });
      }
    };

    const skeleton = () => grid.replaceChildren(...Array.from({ length: slots }, () => h('div', { class: 'acct-slot is-skeleton', 'aria-hidden': 'true' })));

    const fetchSaves = async () => {
      skeleton();
      counter.textContent = 'Cargando partidas…';
      try {
        saves = (await load()).filter((s) => s.slot >= 1 && s.slot <= slots);
        render();
        layer.focusFirst('.acct-grid button');
      } catch (err) {
        if (cloud && err?.status === 401) { finish({ type: 'expired' }); return; }
        // Never show empty slots after a failed read: starting a game there could overwrite a save.
        const retry = h('button', { type: 'button', class: 'acct-btn acct-btn-primary', text: 'Reintentar' });
        retry.addEventListener('click', fetchSaves);
        grid.replaceChildren(h('div', { class: 'acct-empty-state' },
          icon('alert', 'acct-ico acct-ico-big'),
          h('b', { text: 'No se pudieron cargar tus partidas' }),
          h('span', { text: cloud ? 'Revisá tu conexión. Tus partidas siguen guardadas en el servidor.' : 'El navegador no deja leer el almacenamiento.' }),
          retry));
        counter.textContent = '';
        setTimeout(() => retry.focus(), 30);
      }
    };

    const chip = h('div', { class: `acct-chip ${cloud ? 'is-cloud' : 'is-local'}` },
      h('span', { class: 'acct-chip-av', text: cloud && account ? account[0].toUpperCase() : '' }, cloud ? null : icon('device')),
      h('div', {}, h('b', { text: cloud ? account : 'Sin cuenta' }),
        h('span', {}, icon(cloud ? 'cloud' : 'device', 'acct-ico acct-ico-sm'), cloud ? 'Guardado en la nube' : 'Guardado en este dispositivo')));
    const navBtn = (ic, label, act: HubAction['type']) => {
      const b = h('button', { type: 'button', class: 'acct-nav-btn' }, icon(ic), h('span', { text: label }));
      b.addEventListener('click', () => { sfx('confirm'); finish({ type: act } as HubAction); });
      return b;
    };
    const nav = h('nav', { class: 'acct-nav' },
      navBtn('gear', 'Opciones', 'options'),
      navBtn('film', 'Créditos', 'credits'),
      canLogin ? (cloud ? navBtn('logout', 'Cerrar sesión', 'logout') : navBtn('login', 'Iniciar sesión', 'login')) : null);

    layer = mountLayer('acct-hub', () => {});
    layer.el.append(h('div', { class: 'acct-hub-wrap' },
      h('header', { class: 'acct-top' }, brand('Elegí una partida'), h('div', { class: 'acct-top-r' }, chip, nav)),
      h('div', { class: 'acct-hub-head' }, h('h2', { text: 'Tus partidas' }), counter),
      banner,
      grid,
      h('footer', { class: 'acct-foot' },
        h('span', {}, h('kbd', { text: '←↑↓→' }), ' moverse'),
        h('span', {}, h('kbd', { text: 'Enter' }), ' elegir'),
        h('span', {}, h('kbd', { text: 'Supr' }), ' borrar'),
        version ? h('span', { class: 'acct-ver', text: `Versión ${version}` }) : null)));
    if (notice) showBanner(notice, 'ok');
    fetchSaves();
  });
}
