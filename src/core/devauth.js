// Developer mode (bug panel, sprite editor): unlocked only by a GitHub token that can push to the repo.
// GitHub checks the token, so this is real access control, not just a hidden button.
// The token stays in this browser's storage (shared by the game and editor.html on the same site).
import { safeStorage } from './util.js';

const REPO = 'fefow/poke-uruguay';
const TOKEN_KEY = 'pokeuy:ghtoken';
const DEV_KEY = 'pokeuy:dev';
const store = safeStorage();

const get = (k) => { try { return store.getItem(k) || ''; } catch { return ''; } };

export const devToken = () => get(TOKEN_KEY);
export const isDev = () => get(DEV_KEY) === '1' && !!devToken();

/** Resolves 'ok', 'denied' (token without write access to the repo) or 'offline'. */
export async function checkToken(token) {
  if (!token) return 'denied';
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
    if (!res.ok) return res.status === 401 || res.status === 403 || res.status === 404 ? 'denied' : 'offline';
    return (await res.json()).permissions?.push ? 'ok' : 'denied';
  } catch {
    return 'offline';
  }
}

export async function unlockDev(token) {
  const r = await checkToken(token.trim());
  if (r === 'ok') {
    try { store.setItem(TOKEN_KEY, token.trim()); store.setItem(DEV_KEY, '1'); } catch { /* storage blocked */ }
  }
  return r;
}

export function lockDev() {
  try { store.removeItem(TOKEN_KEY); store.removeItem(DEV_KEY); } catch { /* storage blocked */ }
}
