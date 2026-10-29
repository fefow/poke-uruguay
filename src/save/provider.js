// Storage backends behind one interface, so localStorage can be swapped for
// a self-hosted Supabase without touching game code.
//
// interface SaveProvider {
//   list(): Promise<Array<{ slot, summary, savedAt }>>
//   load(slot): Promise<Envelope | null>
//   save(slot, envelope): Promise<void>
//   remove(slot): Promise<void>
// }
import { safeStorage } from '../core/util.js';

export class LocalStorageProvider {
  #store = safeStorage();
  #prefix = 'urumon:save:';

  async list() {
    const out = [];
    for (let i = 0; i < this.#store.length; i++) {
      const k = this.#store.key(i);
      if (!k?.startsWith(this.#prefix)) continue;
      try {
        const env = JSON.parse(this.#store.getItem(k));
        out.push({ slot: Number(k.slice(this.#prefix.length)), summary: env.summary, savedAt: env.savedAt });
      } catch { /* skip unreadable slot */ }
    }
    return out.sort((a, b) => a.slot - b.slot);
  }

  async load(slot) {
    const raw = this.#store.getItem(this.#prefix + slot);
    if (!raw) return null;
    if (raw.length > 2_000_000) throw new Error('Partida demasiado grande');
    return JSON.parse(raw);
  }

  async save(slot, envelope) {
    try {
      this.#store.setItem(this.#prefix + slot, JSON.stringify(envelope));
    } catch (err) {
      throw new Error('No hay espacio para guardar en este navegador.', { cause: err });
    }
  }

  async remove(slot) {
    this.#store.removeItem(this.#prefix + slot);
  }
}

/**
 * Supabase (PostgREST) backend for the VPS phase. Talks to the `saves` table
 * and the `submit_save` RPC defined in supabase/schema.sql. The server
 * re-validates every save; the client signature is only advisory there.
 */
export class SupabaseProvider {
  #url;
  #anonKey;
  #getToken;

  constructor({ url, anonKey, getAccessToken }) {
    this.#url = url.replace(/\/$/, '');
    this.#anonKey = anonKey;
    this.#getToken = getAccessToken;
  }

  async #req(path, init = {}) {
    const token = (await this.#getToken?.()) ?? this.#anonKey;
    const res = await fetch(`${this.#url}${path}`, {
      ...init,
      headers: {
        apikey: this.#anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Servidor de partidas: ${res.status} ${body.slice(0, 200)}`);
    }
    return res.status === 204 ? null : res.json();
  }

  async list() {
    const rows = await this.#req('/rest/v1/saves?select=slot,summary,saved_at&order=slot');
    return rows.map((r) => ({ slot: r.slot, summary: r.summary, savedAt: Date.parse(r.saved_at) }));
  }

  async load(slot) {
    const rows = await this.#req(`/rest/v1/saves?select=envelope&slot=eq.${encodeURIComponent(slot)}`);
    return rows[0]?.envelope ?? null;
  }

  async save(slot, envelope) {
    // RPC so the database function validates before writing.
    await this.#req('/rest/v1/rpc/submit_save', { method: 'POST', body: JSON.stringify({ p_slot: slot, p_envelope: envelope }) });
  }

  async remove(slot) {
    await this.#req(`/rest/v1/saves?slot=eq.${encodeURIComponent(slot)}`, { method: 'DELETE' });
  }
}
