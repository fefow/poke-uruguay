// Text editor (texts.html): every plain dialogue line of the game, searchable and editable. Changes are stored as
// "original line -> new line" in src/data/text-overrides.js, which the game applies when it shows a line.
// Work in progress is kept in this browser; "Guardar en el juego" commits the file to GitHub (redeploys Pages).
import { TEXT_INDEX } from '../gen/text-index.js';
import { TEXT_OVERRIDES } from '../data/text-overrides.js';
import { h, safeStorage } from '../core/util.ts';
import { devToken, isDev, unlockDev, checkToken, lockDev } from '../core/devauth.ts';

const REPO = 'fefow/poke-uruguay';
const FILE = 'src/data/text-overrides.js';
const store = safeStorage();
const DRAFT_KEY = 'pokeuy:text-drafts';
const PAGE = 60;

let base: Record<string, string> = { ...TEXT_OVERRIDES };
let drafts: Record<string, string | null> = (() => { try { return JSON.parse(store.getItem(DRAFT_KEY) || '{}'); } catch { return {}; } })();
const persist = () => { try { store.setItem(DRAFT_KEY, JSON.stringify(drafts)); } catch { /* no space */ } };
const current = (orig: string) => (orig in drafts ? (drafts[orig] ?? orig) : (base[orig] ?? orig));
const norm = (t: string) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const source = (m: Record<string, string>) => `// Dialogue lines rewritten in the text editor (texts.html): original line -> new line. Written by the editor.\nexport const TEXT_OVERRIDES = {\n${Object.keys(m).sort().map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(m[k])}`).join(',\n')}\n};\n`;
const parse = (t: string): Record<string, string> => {
  const a = t.indexOf('{', t.indexOf('TEXT_OVERRIDES')), b = t.lastIndexOf('}');
  return a < 0 || b < a ? {} : JSON.parse(t.slice(a, b + 1).replace(/,\s*}$/, '}'));
};
const pending = () => Object.keys(drafts).length;

const root = document.getElementById('editor')!;
const search = h('input', { type: 'search', class: 'ed-input', placeholder: 'Buscar por texto, personaje o evento (ej: farero)…', oninput: () => { shown = PAGE; render(); } });
const only = h('select', { class: 'ed-input', style: { flex: '0 0 auto', minWidth: '0' }, onchange: () => { shown = PAGE; render(); } },
  h('option', { value: 'all', text: 'Todos' }), h('option', { value: 'edited', text: 'Editados' }));
const saveBtn = h('button', { class: 'ed-btn is-primary', type: 'button', text: 'Guardar en el juego', onclick: () => save() });
const msg = h('p', { class: 'te-status', role: 'status' });
const list = h('div', { class: 'te-list' });
const more = h('button', { class: 'ed-btn', type: 'button', text: 'Ver más', onclick: () => { shown += PAGE; render(); } });
let shown = PAGE;
const status = (t: string, kind = '') => { msg.textContent = t; msg.dataset.kind = kind; };
const sync = () => { saveBtn.textContent = pending() ? `Guardar en el juego (${pending()})` : 'Guardar en el juego'; };

function render() {
  const q = norm(search.value.trim());
  const edited = only.value === 'edited';
  const rows = TEXT_INDEX.filter((e) => {
    if (edited && !(e.text in drafts) && !(e.text in base)) return false;
    if (!q) return true;
    return norm(e.text).includes(q) || norm(current(e.text)).includes(q) || e.uses.some((u) => norm(`${u.ctx} ${u.who} ${u.file}`).includes(q));
  });
  const cards = rows.slice(0, shown).map((e) => {
    const area = h('textarea', { rows: '2', spellcheck: 'true' }) as HTMLTextAreaElement;
    area.value = current(e.text);
    const orig = h('div', { class: 'te-orig', hidden: true });
    const reset = h('button', { class: 'ed-btn ed-mini', type: 'button', text: 'Restaurar este texto', hidden: true });
    const card = h('div', { class: 'te-card' });
    const refresh = () => {
      const now = area.value, isEdited = now !== e.text;
      card.classList.toggle('is-edited', isEdited);
      reset.hidden = !isEdited;
      orig.hidden = !isEdited;
      orig.textContent = `Original: ${e.text}`;
    };
    area.addEventListener('input', () => {
      const v = area.value;
      if (v === e.text || !v.trim()) { if (e.text in base) drafts[e.text] = null; else delete drafts[e.text]; }
      else if (base[e.text] === v) delete drafts[e.text];
      else drafts[e.text] = v;
      persist(); sync(); refresh();
    });
    reset.addEventListener('click', () => { area.value = e.text; area.dispatchEvent(new Event('input')); });
    const where = e.uses.slice(0, 4).map((u) => h('span', {}, h('b', { text: u.who || u.ctx }), ` · ${u.ctx !== u.who && u.who ? u.ctx + ' · ' : ''}${u.file}:${u.line}`));
    card.append(h('div', { class: 'te-meta' }, ...where, e.uses.length > 1 ? h('span', { text: `Se dice en ${e.uses.length} lugares` }) : null), area, orig, reset);
    refresh();
    return card;
  });
  list.replaceChildren(...cards);
  more.hidden = rows.length <= shown;
  status(`${rows.length} texto${rows.length === 1 ? '' : 's'}${q || edited ? ' encontrados' : ''}. Cada recuadro es un globo de diálogo; si un texto se dice en varios lugares, el cambio vale en todos.`);
}

const b64encode = (t: string) => btoa(unescape(encodeURIComponent(t)));
const b64decode = (b: string) => decodeURIComponent(escape(atob(b.replace(/\s/g, ''))));
async function save() {
  if (!pending()) return status('No hay cambios para guardar.');
  const headers = { Authorization: `Bearer ${devToken()}`, Accept: 'application/vnd.github+json' };
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
  status('Guardando en GitHub…');
  try {
    for (let attempt = 1; ; attempt++) {
      const cur = await fetch(`${url}?ref=main&t=${Date.now()}`, { headers, cache: 'no-store' });
      if (!cur.ok && cur.status !== 404) throw new Error(`GitHub respondió ${cur.status}`);
      const meta: any = cur.ok ? await cur.json() : null;
      let text = meta ? b64decode(meta.content ?? '') : '';
      if (meta && !text.trim() && meta.size > 0) {
        const raw = await fetch(`${url}?ref=main`, { headers: { ...headers, Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
        if (!raw.ok) throw new Error('No se pudo leer la copia actual; no se guardó nada.');
        text = await raw.text();
      }
      const merged = parse(text);
      for (const [k, v] of Object.entries(drafts)) { if (v === null) delete merged[k]; else merged[k] = v; }
      const n = pending();
      const body: any = { message: `Editor de textos: ${n} cambio${n === 1 ? '' : 's'}`, content: b64encode(source(merged)), branch: 'main' };
      if (meta) body.sha = meta.sha;
      const put = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body), cache: 'no-store' });
      if ((put.status === 409 || put.status === 422) && attempt < 5) { await new Promise((r) => setTimeout(r, 1200 * attempt)); continue; }
      if (!put.ok) throw new Error(`GitHub respondió ${put.status}`);
      base = merged; drafts = {}; persist(); sync(); render();
      return status('Guardado. El juego publicado se actualiza solo en uno o dos minutos.', 'ok');
    }
  } catch (err: any) {
    status(`No se pudo guardar: ${err.message}`, 'error');
  }
}

function start() {
  lock.remove();
  root.append(h('div', { class: 'te' },
    h('div', { class: 'ed-brand' }, h('b', { text: 'Poke Uruguay' }), h('span', { text: 'Editor de textos' }),
      h('a', { class: 'ed-btn ed-mini', href: 'editor.html', text: 'Editor de sprites' }), h('a', { class: 'ed-btn ed-mini', href: 'map-editor.html', text: 'Editor de mapas' })),
    h('div', { class: 'te-bar' }, search, only, saveBtn), msg, list, more));
  sync();
  render();
}
const lockInput = h('input', { type: 'password', class: 'ed-input', placeholder: 'Token de GitHub', autocomplete: 'off', spellcheck: 'false' });
const lockMsg = h('p', { class: 'ed-lock-msg', role: 'status' });
const lockForm = h('form', { class: 'ed-lock-card' },
  h('b', { text: 'Poke Uruguay' }), h('h1', { text: 'Editor de textos' }),
  h('p', { text: 'Acceso solo para el desarrollador. Ingresá un token de GitHub con permiso de escritura sobre el repo del juego.' }),
  lockInput, h('button', { class: 'ed-btn is-primary', type: 'submit', text: 'Entrar' }), lockMsg);
const lock = h('div', { class: 'ed-lock' }, lockForm);
document.body.append(lock);
const denied = { denied: 'Ese token no tiene permiso de escritura sobre el repo.', offline: 'No se pudo conectar con GitHub. Probá de nuevo.' };
lockForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  lockMsg.textContent = 'Verificando…';
  const r = await unlockDev(lockInput.value);
  if (r === 'ok') start(); else lockMsg.textContent = denied[r];
});
if (isDev()) {
  lockMsg.textContent = 'Verificando acceso…';
  checkToken(devToken()).then((r) => { if (r === 'ok') return start(); if (r === 'denied') lockDev(); lockMsg.textContent = denied[r]; });
}
if (typeof __QA__ !== 'undefined' && __QA__) start();
