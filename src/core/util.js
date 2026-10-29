// Small shared helpers.

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

/** Recursively freeze an object graph so game tables cannot be mutated at runtime. */
export function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) deepFreeze(obj[key]);
  }
  return obj;
}

/**
 * Tiny DOM builder. Text is always set with textContent, never innerHTML,
 * so player-controlled strings (names) cannot inject markup.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, sv);
        else el.style[sk] = sv;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Wrap a DOM change in a View Transition when the browser supports it. */
export function viewTransition(fn) {
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return document.startViewTransition(fn).finished.catch(() => {});
  }
  fn();
  return Promise.resolve();
}

export const pad = (n, len = 3) => String(n).padStart(len, '0');

export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  return `${hh}:${String(mm).padStart(2, '0')}`;
}

/** Only letters (incl. accents/ñ), digits and spaces; max 10 chars. */
export function sanitizeName(raw, fallback = 'Gurí') {
  const clean = String(raw ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim()
    .slice(0, 10);
  return clean || fallback;
}

export function safeStorage() {
  try {
    const k = '__urumon_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    // Private windows / blocked storage: in-memory fallback so the game still runs.
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
      key: (i) => [...mem.keys()][i] ?? null,
      get length() { return mem.size; },
    };
  }
}
