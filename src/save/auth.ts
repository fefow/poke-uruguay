// Username + password accounts on top of Supabase Auth (GoTrue), over plain fetch.
//
// Supabase Auth wants an email, so the username is mapped to a synthetic one
// (`name@users.pokeuy.invalid`). `.invalid` is reserved and never resolves, and the
// server has email confirmation disabled, so nothing is ever sent. There is no
// password recovery: an admin resets it from Supabase Studio.
import { SAVE_CONFIG } from './config.ts';
import { safeStorage } from '../core/util.ts';

const KEY = 'urumon:session';
const EMAIL_DOMAIN = 'users.pokeuy.invalid';
const store = safeStorage();

export const USERNAME_RE = /^[a-z0-9_]{3,16}$/;
export const PASSWORD_MIN = 8;

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}

type Session = { access_token: string; refresh_token: string; expires_at: number; username: string };

const emailFor = (username: string) => `${username}@${EMAIL_DOMAIN}`;
const url = (path: string) => `${SAVE_CONFIG.supabase.url.replace(/\/$/, '')}/auth/v1${path}`;

function readSession(): Session | null {
  try {
    const s = JSON.parse(store.getItem(KEY) ?? 'null');
    return s?.access_token && s?.refresh_token ? s : null;
  } catch { return null; }
}
const writeSession = (s: Session) => store.setItem(KEY, JSON.stringify(s));
export const clearSession = () => store.removeItem(KEY);

/** Name of the signed-in player, or null. */
export const currentUser = (): string | null => readSession()?.username ?? null;

/** Spanish message for the errors players can actually hit. */
function explain(status: number, body: any): string {
  const code = body?.error_code ?? body?.code;
  if (code === 'user_already_exists' || code === 'email_exists') return 'Ese nombre de usuario ya está en uso.';
  if (code === 'invalid_credentials') return 'Usuario o contraseña incorrectos.';
  if (code === 'weak_password') return `La contraseña tiene que tener al menos ${PASSWORD_MIN} caracteres.`;
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || status === 429) return 'Demasiados intentos. Esperá un rato y probá de nuevo.';
  if (code === 'signup_disabled') return 'El registro está cerrado por ahora.';
  return 'No se pudo completar. Probá de nuevo en un rato.';
}

async function call(path: string, body: unknown, token?: string) {
  let res: Response;
  try {
    res = await fetch(url(path), {
      method: 'POST',
      headers: { apikey: SAVE_CONFIG.supabase.anonKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('No hay conexión con el servidor.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new AuthError(explain(res.status, json), res.status);
  return json;
}

function toSession(json: any, username: string): Session {
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: json.expires_at ?? Math.floor(Date.now() / 1000) + (json.expires_in ?? 3600),
    username,
  };
}

export function validateCredentials(username: string, password: string): string | null {
  if (!USERNAME_RE.test(username)) return 'El usuario debe tener de 3 a 16 caracteres: letras minúsculas, números o _.';
  if (password.length < PASSWORD_MIN) return `La contraseña tiene que tener al menos ${PASSWORD_MIN} caracteres.`;
  if (password.length > 72) return 'La contraseña es demasiado larga (máximo 72).';
  return null;
}

export async function signUp(username: string, password: string) {
  username = username.trim().toLowerCase();
  const bad = validateCredentials(username, password);
  if (bad) throw new AuthError(bad);
  const json = await call('/signup', { email: emailFor(username), password });
  if (!json?.access_token) throw new AuthError('No se pudo crear la cuenta.');
  writeSession(toSession(json, username));
  return username;
}

export async function signIn(username: string, password: string) {
  username = username.trim().toLowerCase();
  if (!USERNAME_RE.test(username) || !password) throw new AuthError('Usuario o contraseña incorrectos.');
  const json = await call('/token?grant_type=password', { email: emailFor(username), password });
  writeSession(toSession(json, username));
  return username;
}

export async function signOut() {
  const s = readSession();
  clearSession();
  if (s) await call('/logout?scope=local', {}, s.access_token).catch(() => {});
}

let refreshing: Promise<string | null> | null = null;

/** Valid access token (refreshing it when about to expire), or null when signed out. */
export async function getAccessToken(): Promise<string | null> {
  const s = readSession();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  refreshing ??= (async () => {
    try {
      const json = await call('/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
      const next = toSession(json, s.username);
      writeSession(next);
      return next.access_token;
    } catch (err) {
      // A rejected refresh token means the session is gone; a network error does not.
      if (err instanceof AuthError && err.status >= 400 && err.status < 500) clearSession();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
