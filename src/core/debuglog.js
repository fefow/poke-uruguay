// Bug log: captures errors automatically, keeps game breadcrumbs and player
// notes in localStorage, and exports them as a .txt / clipboard / GitHub issue.
// Read-only with respect to game state: it never changes a save.
import { h, safeStorage } from './util.js';
import { REPORT_CONFIG } from '../save/config.js';
import { isDev, unlockDev } from './devauth.js';

const KEY = 'pokeuy:debuglog';
const MAX = 400;
const REPO_ISSUES = 'https://github.com/fefow/poke-uruguay/issues/new';
const store = safeStorage();

let entries = load();
let getBuildFn = () => '?';
let sent = 0; // per page load, to avoid flooding the table
let queue = [];
let timer = 0;
const clientId = (() => {
  try {
    let id = store.getItem('pokeuy:clientid');
    if (!id) store.setItem('pokeuy:clientid', (id = crypto.randomUUID()));
    return id;
  } catch { return 'anon'; }
})();
let contextFn = () => ({});
let onChange = () => {};

function load() {
  try {
    const v = JSON.parse(store.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.slice(-MAX) : [];
  } catch {
    return [];
  }
}
function persist() {
  try { store.setItem(KEY, JSON.stringify(entries.slice(-MAX))); } catch { /* storage full */ }
}

/** Provide a function returning current game context (map, position, party…). */
export function setContext(fn) {
  contextFn = fn;
}

function ctx() {
  try { return contextFn() ?? {}; } catch { return {}; }
}

/** level: 'error' | 'warn' | 'info' | 'note' */
export function log(level, msg, detail) {
  const c = ctx();
  const e = { t: new Date().toISOString(), level, msg: String(msg).slice(0, 2000), where: c.where ?? '' };
  if (detail) e.detail = String(detail).slice(0, 4000);
  if (level === 'error' || level === 'note') e.ctx = c;
  // Collapse identical repeated errors
  const last = entries.at(-1);
  if (last && last.level === level && last.msg === e.msg && level !== 'note') {
    last.count = (last.count ?? 1) + 1;
    last.t = e.t;
  } else entries.push(e);
  if (entries.length > MAX) entries = entries.slice(-MAX);
  persist();
  onChange();
  if (level === 'error') flashBadge();
  if (level !== 'info') enqueue(e);
}

// ---- automatic online upload (only when REPORT_CONFIG.enabled)
const REPO = 'fefow/poke-uruguay';
const BRANCH = 'bug-reports';
const token = () => { try { return store.getItem('pokeuy:ghtoken') || ''; } catch { return ''; } };
let repoTimer = 0;
let repoBusy = false;
let repoDirty = false;
let repoStatus = '';

/** Write the whole local log to reports/<client>.json on the bug-reports branch. */
async function syncRepo() {
  if (repoBusy) { repoDirty = true; return; }
  repoBusy = true;
  const url = `https://api.github.com/repos/${REPO}/contents/reports/${clientId}.json`;
  const headers = { Authorization: `Bearer ${token()}`, Accept: 'application/vnd.github+json' };
  try {
    do {
      repoDirty = false;
      const cur = await fetch(`${url}?ref=${BRANCH}`, { headers });
      if (!cur.ok && cur.status !== 404) throw new Error(`GitHub ${cur.status}`);
      const sha = cur.ok ? (await cur.json()).sha : undefined;
      const text = buildJson({ build: getBuildFn() });
      const body = { message: 'bug report', branch: BRANCH, content: btoa(unescape(encodeURIComponent(text))), sha };
      const put = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!put.ok) throw new Error(`GitHub ${put.status}`);
      repoStatus = `Subido ${new Date().toLocaleTimeString('es-UY')}`;
    } while (repoDirty);
  } catch (err) {
    repoStatus = `No se pudo subir (${err.message})`;
  }
  repoBusy = false;
  onChange();
}

function enqueue(e) {
  if (token()) {
    clearTimeout(repoTimer);
    repoTimer = setTimeout(syncRepo, e.level === 'note' ? 300 : 3000);
  }
  if (!REPORT_CONFIG.enabled || sent >= 40) return;
  queue.push(e);
  clearTimeout(timer);
  timer = setTimeout(flush, e.level === 'note' ? 0 : 2000);
}
async function flush() {
  const batch = queue.splice(0, 10);
  if (!batch.length) return;
  sent += batch.length;
  const rows = batch.map((e) => ({
    client_id: clientId,
    build: String(getBuildFn() ?? '').slice(0, 64),
    level: e.level,
    msg: e.msg,
    detail: e.detail ?? null,
    location: e.where || null,
    ctx: e.ctx ?? null,
    user_agent: navigator.userAgent.slice(0, 400),
  }));
  try {
    const res = await fetch(`${REPORT_CONFIG.url}/rest/v1/bug_reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: REPORT_CONFIG.anonKey, Authorization: `Bearer ${REPORT_CONFIG.anonKey}`, Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
      keepalive: true,
    });
    if (!res.ok) throw new Error(res.status);
  } catch { /* offline: the local log still has it */ }
  if (queue.length) timer = setTimeout(flush, 2000);
}

export const info = (msg) => log('info', msg);

export function installErrorCapture() {
  addEventListener('error', (ev) => {
    log('error', ev.message || 'Error', ev.error?.stack ?? `${ev.filename}:${ev.lineno}:${ev.colno}`);
  });
  addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason;
    log('error', `Promesa rechazada: ${r?.message ?? r}`, r?.stack);
  });
  for (const level of ['error', 'warn']) {
    const orig = console[level].bind(console);
    console[level] = (...args) => {
      orig(...args);
      const err = args.find((a) => a instanceof Error);
      log(level, args.map((a) => (a instanceof Error ? a.message : typeof a === 'object' ? safeJson(a) : String(a))).join(' '), err?.stack);
    };
  }
}

function safeJson(v) {
  try { return JSON.stringify(v).slice(0, 500); } catch { return String(v); }
}

export function clearLog() {
  entries = [];
  persist();
  onChange();
}

export function buildJson({ build = '?' } = {}) {
  return JSON.stringify({ app: 'poke-uruguay', exported: new Date().toISOString(), build, userAgent: navigator.userAgent, state: ctx(), entries }, null, 2);
}

export function buildReport({ build = '?' } = {}) {
  const c = ctx();
  const lines = [
    '=== Poke Uruguay — reporte de errores ===',
    `Fecha: ${new Date().toLocaleString('es-UY')}`,
    `Versión (build): ${build}`,
    `Navegador: ${navigator.userAgent}`,
    `Pantalla: ${innerWidth}x${innerHeight} · táctil: ${matchMedia('(pointer: coarse)').matches ? 'sí' : 'no'}`,
    `Estado actual: ${safeJson(c)}`,
    `Errores: ${entries.filter((e) => e.level === 'error').length} · Notas: ${entries.filter((e) => e.level === 'note').length}`,
    '',
    '--- Registro (más viejo primero) ---',
  ];
  for (const e of entries) {
    lines.push(`[${e.t}] ${e.level.toUpperCase()}${e.count ? ` x${e.count}` : ''} @ ${e.where || '-'}: ${e.msg}`);
    if (e.detail) lines.push(...e.detail.split('\n').slice(0, 8).map((l) => `    ${l.trim()}`));
    if (e.ctx && e.level !== 'info') lines.push(`    contexto: ${safeJson(e.ctx)}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------- panel UI
let panelEl = null;
let badge = null;

function flashBadge() {
  if (!badge) return;
  const n = entries.filter((e) => e.level === 'error').length;
  badge.dataset.count = n ? String(n) : '';
  badge.classList.add('has-error');
}

/**
 * Mount the bug button + panel. `blockInput()` must stop game input while the
 * panel is open and return a function that restores it.
 */
export function mountDebugPanel({ blockInput, getBuild }) {
  getBuildFn = getBuild ?? getBuildFn;
  // Only the developer sees the panel: errors are still recorded for everyone, but the button and F2
  // appear after unlocking with a GitHub token that can push to the repo (here with Ctrl+Shift+F2, or in editor.html).
  badge = h('button', { class: 'bug-btn', type: 'button', title: 'Panel de errores (F2)', 'aria-label': 'Abrir panel de errores', hidden: !isDev() }, '🐞');
  document.body.append(badge);
  flashBadge();
  if (!entries.some((e) => e.level === 'error')) badge.classList.remove('has-error');
  let release = null;

  const close = () => {
    panelEl?.remove();
    panelEl = null;
    onChange = () => {};
    release?.();
    release = null;
  };

  const open = () => {
    if (panelEl) return close();
    release = blockInput();
    const list = h('ol', { class: 'bug-list', reversed: true });
    const note = h('textarea', { id: 'bug-note', class: 'bug-note', rows: '3', maxlength: '1000', placeholder: 'Contá qué pasó: dónde estabas, qué hiciste, qué esperabas…' });
    const status = h('p', { class: 'bug-status', role: 'status' });
    const say = (t) => { status.textContent = t; };
    const render = () => {
      if (repoStatus) say(repoStatus);
      const items = entries.slice().reverse().slice(0, 120).map((e) =>
        h('li', { class: `lvl-${e.level}` },
          h('span', { class: 'bug-time', text: e.t.slice(11, 19) }),
          h('b', { text: e.level === 'note' ? 'NOTA' : e.level.toUpperCase() }),
          h('span', { class: 'bug-msg', text: `${e.msg}${e.count ? ` (x${e.count})` : ''}` }),
          e.where ? h('span', { class: 'bug-where', text: e.where }) : null));
      list.replaceChildren(...(items.length ? items : [h('li', { class: 'bug-empty', text: 'Sin registros todavía. Los errores aparecen acá solos.' })]));
    };
    onChange = render;
    render();

    const report = () => buildReport({ build: getBuild?.() });
    const tok = h('input', { class: 'bug-token', type: 'password', autocomplete: 'off', placeholder: 'Token de GitHub (solo se guarda en este navegador)' });
    const sync = h('div', { class: 'bug-sync' },
      tok,
      h('button', { type: 'button', onclick: () => {
        const v = tok.value.trim();
        try { if (v) store.setItem('pokeuy:ghtoken', v); else store.removeItem('pokeuy:ghtoken'); } catch { /* ignore */ }
        tok.value = '';
        say(v ? 'Token guardado. Subiendo…' : 'Token borrado: ya no se sube solo.');
        if (v) syncRepo();
      } }, 'Conectar'));
    const actions = h('div', { class: 'bug-actions' },
      h('button', { type: 'button', class: 'bug-primary', onclick: () => {
        const v = note.value.trim();
        if (!v) return say('Escribí algo en la nota primero.');
        log('note', v);
        note.value = '';
        say('Nota guardada en el registro.');
      } }, 'Guardar nota'),
      h('button', { type: 'button', onclick: async () => {
        try { await navigator.clipboard.writeText(report()); say('Reporte copiado. Pegalo en el chat.'); }
        catch { const ta = h('textarea', { class: 'bug-copy' }); ta.value = report(); panelEl.append(ta); ta.select(); say('Seleccioná el texto de abajo y copialo (Ctrl+C).'); }
      } }, 'Copiar'),
      h('button', { type: 'button', onclick: () => {
        const blob = new Blob([report()], { type: 'text/plain;charset=utf-8' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `poke-uruguay-errores-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt` });
        document.body.append(a);
        a.click();
        a.remove();
        say('Descargando el .txt…');
      } }, 'Descargar .txt'),
      h('button', { type: 'button', onclick: () => {
        const blob = new Blob([buildJson({ build: getBuild?.() })], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `poke-uruguay-errores-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json` });
        document.body.append(a);
        a.click();
        a.remove();
        say('Descargando el .json…');
      } }, 'Descargar .json'),
      h('button', { type: 'button', onclick: () => {
        const body = report();
        const max = 6000; // keep the URL under GitHub's limit
        const text = body.length > max ? `${body.slice(0, max)}\n\n[recortado: usá "Descargar .txt" y adjuntalo al issue]` : body;
        const firstErr = entries.findLast((e) => e.level === 'error' || e.level === 'note');
        const title = `Bug: ${(firstErr?.msg ?? 'reporte desde el juego').slice(0, 80)}`;
        open_(`${REPO_ISSUES}?labels=bug&title=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`);
        say('Se abrió GitHub con el reporte listo para enviar.');
      } }, 'Enviar a GitHub'),
      h('button', { type: 'button', class: 'bug-danger', onclick: () => {
        if (panelEl.dataset.confirm !== '1') { panelEl.dataset.confirm = '1'; return say('Tocá "Borrar" otra vez para confirmar.'); }
        delete panelEl.dataset.confirm;
        clearLog();
        say('Registro borrado.');
      } }, 'Borrar'),
    );

    panelEl = h('section', { class: 'bug-panel', role: 'dialog', 'aria-label': 'Panel de errores' },
      h('header', {}, h('strong', { text: '🐞 Registro de errores' }), h('button', { type: 'button', class: 'bug-close', 'aria-label': 'Cerrar', onclick: close }, '✕')),
      h('p', { class: 'bug-help', text: REPORT_CONFIG.enabled ? 'Los errores y tus notas se envían solos online. También podés copiar o descargar el reporte.' : 'Los errores se guardan solos en este navegador. Podés sumar notas y después copiar, descargar o mandar todo a GitHub.' }),
      list, note, actions, sync, status);
    document.body.append(panelEl);
  };

  const open_ = (url) => { const a = h('a', { href: url, target: '_blank', rel: 'noopener' }); document.body.append(a); a.click(); a.remove(); };

  badge.addEventListener('click', open);
  addEventListener('keydown', async (e) => {
    if (e.code === 'F2' && e.ctrlKey && e.shiftKey && !isDev()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const t = prompt('Modo desarrollador: token de GitHub con permiso de escritura sobre el repo');
      if (!t) return;
      const r = await unlockDev(t);
      if (r === 'ok') badge.hidden = false;
      else alert(r === 'offline' ? 'No se pudo verificar el token (sin conexión con GitHub).' : 'Ese token no tiene permiso sobre el repo.');
      return;
    }
    if (!isDev()) return;
    if (e.code === 'F2' || (e.code === 'Escape' && panelEl)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.code === 'Escape') close();
      else open();
    }
  }, true);
}
