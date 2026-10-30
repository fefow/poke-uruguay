// DOM overlay UI: dialog box with typewriter, choice lists, panels, toasts.
// All text goes through textContent (no innerHTML with dynamic strings).
import { h, wait } from '../core/util.js';
import { input } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { settings, state } from './state.js';
import { charSprite } from '../gfx/characters.js';

// Speaker looks so each voice gets its own face and tint in the dialog box.
const FACES = {
  'Maestro Tabárez': 'prof', Madre: 'mom', Enfermera: 'nurse', Comerciante: 'clerk', Dueño: 'clerk', Policía: 'cop',
  Marinero: 'sailor', Surfista: 'swimmer', Abuelo: 'oldman', Vecina: 'girl', Vecino: 'oldman', Hermana: 'girl',
  Sofía: 'leader_ute', Lucía: 'leader_ose', 'Juan A. Lavalleja': 'leader_lavalleja', Candelaria: 'leader_ancap',
  Elena: 'leader_inc', Marta: 'leader_correo', 'Juan M. Boiso Lanza': 'leader_boiso', Tomás: 'leader_inavi', Ramón: 'leader_mgap', Mariela: 'leader_defensa', 'Horacio Quiroga': 'leader_quiroga', Capitán: 'ferry_captain',
  Biólogo: 'biologo', 'Ciclista veterano': 'ciclista', Farero: 'keeper', Calima: 'calima', Bruma: 'bruma', Brumario: 'brumario',
  Garúa: 'garua', Obdulio: 'champion', Estela: 'elite1', Teófilo: 'elite2', Dolores: 'elite3', Federico: 'elite4',
};
// Fixed tints for the main voices; any other speaker gets a stable hue from its name.
const TINTS = { '{player}': 205, '{rival}': 25, 'Maestro Tabárez': 150, Madre: 340 };

function speaker(name) {
  const s = state();
  const raw = name;
  const look = raw === '{player}' ? s?.player.look : raw === '{rival}' ? 'rival' : FACES[raw];
  let hue = TINTS[raw];
  if (hue == null) { let n = 0; for (const ch of raw) n = (n * 31 + ch.charCodeAt(0)) % 360; hue = n; }
  return { look, hue };
}


let root;
let dialog, dialogText, dialogName, dialogArrow, dialogFace;

export function mountUI(el) {
  root = el;
  dialogName = h('div', { class: 'dialog-name', hidden: true });
  dialogText = h('p', { class: 'dialog-text' });
  dialogArrow = h('span', { class: 'dialog-arrow', 'aria-hidden': 'true', text: '▼' });
  dialogFace = h('canvas', { class: 'dialog-face', width: 16, height: 17, hidden: true, 'aria-hidden': 'true' });
  dialog = h('div', { class: 'dialog', hidden: true, role: 'status', 'aria-live': 'polite' }, dialogFace, dialogName, dialogText, dialogArrow);
  root.append(dialog);
}

export const uiRoot = () => root;

/** Replace {player}/{rival} tokens. */
export function fmt(text) {
  const s = state();
  return String(text)
    .replaceAll('{player}', s?.player.name ?? 'Jugador')
    .replaceAll('{rival}', s?.rivalName ?? 'Facu');
}

const SPEEDS = { 1: 38, 2: 18, 3: 4 };

/**
 * Show text in the dialog box. Waits for A/B unless opts.auto (ms) is set.
 * opts.keep leaves the box open (used before a choice).
 */
export async function say(text, opts = {}) {
  const lines = Array.isArray(text) ? text : [text];
  for (let li = 0; li < lines.length; li++) {
    const msg = fmt(lines[li]);
    dialog.hidden = false;
    dialog.classList.toggle('is-battle', !!opts.battle);
    dialogName.hidden = !opts.name;
    dialogName.textContent = opts.name ? fmt(opts.name) : '';
    const who = opts.name ? speaker(opts.name) : null;
    dialog.classList.toggle('has-face', !!who?.look);
    dialog.style.setProperty('--who', who ? `oklch(0.52 0.13 ${who.hue})` : '');
    dialog.style.setProperty('--who-bg', who ? `oklch(0.97 0.025 ${who.hue})` : '');
    dialogFace.hidden = !who?.look;
    if (who?.look) {
      const g = dialogFace.getContext('2d');
      g.clearRect(0, 0, 16, 17);
      g.drawImage(charSprite(who.look, 'down', 0), 0, 0);
    }
    dialogArrow.hidden = true;
    dialogText.textContent = '';
    let done = false;
    let skip = false;
    const pop = input.push((a) => {
      if (a === 'a' || a === 'b') skip = true;
    });
    const delay = (SPEEDS[settings.textSpeed] ?? 18) / (input.held('run') ? 2 : 1);
    for (let i = 0; i < msg.length && !skip; i++) {
      dialogText.textContent = msg.slice(0, i + 1);
      if (i % 2 === 0 && msg[i] !== ' ') sfx('select');
      await wait(delay);
    }
    dialogText.textContent = msg;
    pop();
    const last = li === lines.length - 1;
    if (opts.auto && !(opts.keep && last)) {
      // Advance on A/B or after a pause, whichever comes first.
      await new Promise((res) => {
        const timer = setTimeout(() => { popAuto(); res(); }, opts.auto / (input.held('run') ? 2 : 1));
        const popAuto = input.push((a) => {
          if (a === 'a' || a === 'b') { clearTimeout(timer); popAuto(); res(); }
        });
      });
      done = true;
    }
    if (!done && !(opts.keep && last)) {
      dialogArrow.hidden = false;
      await input.waitFor(['a', 'b']);
      sfx('select');
    }
  }
  if (!opts.keep) closeDialog();
}

export function closeDialog() {
  if (dialog) dialog.hidden = true;
}

/**
 * Vertical choice list. Returns chosen index, or -1 when cancelled with B.
 * options: array of strings or {label, disabled, hint}
 */
export function choose(options, { cancel = true, cls = '', title = null, start = 0, onMove = null, cols = 1 } = {}) {
  return new Promise((resolve) => {
    const opts = options.map((o) => (typeof o === 'string' ? { label: o } : o));
    let idx = Math.min(start, opts.length - 1);
    const items = opts.map((o, i) =>
      h('li', { class: o.disabled ? 'is-disabled' : '', role: 'option', onclick: () => { idx = i; render(); pick(); } },
        o.icon ? h('img', { class: 'item-icon', src: o.icon, alt: '' }) : null,
        o.content ?? h('span', { class: 'label', text: fmt(o.label) }),
        o.content ? null : o.hint ? h('span', { class: 'hint', text: o.hint }) : null),
    );
    const list = h('ul', { class: 'menu-list', role: 'listbox' }, items);
    const box = h('div', { class: `menu ${cls}` }, title ? h('div', { class: 'menu-title', text: fmt(title) }) : null, list);
    root.append(box);
    const render = () => {
      items.forEach((li, i) => li.classList.toggle('is-active', i === idx));
      items[idx]?.scrollIntoView({ block: 'nearest' });
      onMove?.(idx);
    };
    const finish = (v) => {
      pop();
      box.remove();
      resolve(v);
    };
    const pick = () => {
      if (opts[idx].disabled) return sfx('bump');
      sfx('confirm');
      finish(idx);
    };
    const pop = input.push((a) => {
      const n = opts.length;
      if (a === 'up') { idx = (idx - cols + n) % n; sfx('select'); render(); }
      else if (a === 'down') { idx = (idx + cols) % n; sfx('select'); render(); }
      else if (cols > 1 && a === 'left') { idx = (idx - 1 + n) % n; sfx('select'); render(); }
      else if (cols > 1 && a === 'right') { idx = (idx + 1) % n; sfx('select'); render(); }
      else if (a === 'a') pick();
      else if ((a === 'b' || a === 'start') && cancel) { sfx('cancel'); finish(-1); }
    });
    render();
  });
}

export async function ask(question, opts = {}) {
  await say(question, { ...opts, keep: true });
  const r = await choose(['Sí', 'No'], { cls: 'menu-yesno', cancel: true });
  closeDialog();
  return r === 0;
}

export function toast(text, ms = 1800) {
  const t = h('div', { class: 'toast', role: 'status', text: fmt(text) });
  root.append(t);
  setTimeout(() => t.remove(), ms);
}

/**
 * Full-screen panel. build(panel, close) fills it and returns an input handler.
 * Resolves with whatever close(value) passes.
 */
export function panel(cls, build) {
  return new Promise((resolve) => {
    const el = h('section', { class: `panel ${cls}` });
    root.append(el);
    let pop = () => {};
    const close = (v) => {
      pop();
      el.remove();
      resolve(v);
    };
    const handler = build(el, close);
    if (handler) pop = input.push(handler);
  });
}

/** Name entry using a real <input> so mobile keyboards work. */
export function textInput(label, value = '', placeholder = '') {
  return new Promise((resolve) => {
    const field = h('input', { id: 'name-input', class: 'text-input', maxlength: '10', autocomplete: 'off', spellcheck: 'false', value, placeholder });
    const ok = h('button', { class: 'btn', type: 'submit', text: 'Listo' });
    const form = h('form', { class: 'panel panel-name' },
      h('label', { for: 'name-input', class: 'menu-title', text: label }), field, ok);
    const pop = input.push(() => {});
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      pop();
      form.remove();
      resolve(field.value);
    });
    root.append(form);
    setTimeout(() => field.focus(), 50);
  });
}

export async function fadeOut(ms = 250) {
  root.parentElement.classList.add('is-faded');
  await wait(ms);
}
export async function fadeIn(ms = 250) {
  root.parentElement.classList.remove('is-faded');
  await wait(ms);
}

export function hpColor(ratio) {
  return ratio > 0.5 ? 'var(--hp-good)' : ratio > 0.2 ? 'var(--hp-mid)' : 'var(--hp-low)';
}
