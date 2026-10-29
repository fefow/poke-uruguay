// Save manager: state -> validate -> sign -> provider, and back.
import { LocalStorageProvider, SupabaseProvider } from './provider.js';
import { SAVE_CONFIG } from './config.js';
import { sign, verify, sha256Hex, canonical } from './integrity.js';
import { validateSave } from './validate.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { MAPS } from '../data/maps.js';

let provider = null;
let buildHash = 'dev';

export async function initSaves() {
  provider = SAVE_CONFIG.backend === 'supabase'
    ? new SupabaseProvider({ ...SAVE_CONFIG.supabase })
    : new LocalStorageProvider();
  // Fingerprint of the game rules. Lets a server reject saves made against
  // modified data tables (e.g. a patched move power).
  buildHash = (await sha256Hex(canonical({ SPECIES, MOVES, ITEMS }))).slice(0, 16);
  return buildHash;
}

export const getBuildHash = () => buildHash;

function summaryOf(s) {
  return {
    name: s.player.name,
    look: s.player.look,
    badges: ['badge1', 'badge2', 'badge3'].filter((b) => s.flags[b]).length,
    dex: s.dex.caught.length,
    playtime: Math.floor(s.stats.playtime),
    location: MAPS[s.pos.map]?.name ?? '',
    champion: !!s.flags.champion,
  };
}

export async function listSaves() {
  return provider.list();
}

export async function saveGame(slot, state) {
  // Round-trip through validation so we never write something we would refuse to load.
  const plain = JSON.parse(JSON.stringify(state));
  const check = validateSave(plain);
  if (!check.ok) throw new Error(`Estado inválido: ${check.errors[0]}`);
  const data = check.data;
  const envelope = {
    format: 'urumon-save',
    v: 1,
    build: buildHash,
    slot,
    savedAt: Date.now(),
    summary: summaryOf(data),
    data,
  };
  envelope.sig = await sign({ build: envelope.build, data });
  await provider.save(slot, envelope);
  return envelope;
}

/** Returns { ok, state?, reason?, errors? } */
export async function loadGame(slot) {
  let env;
  try {
    env = await provider.load(slot);
  } catch (err) {
    return { ok: false, reason: 'No se pudo leer la partida.', errors: [String(err.message)] };
  }
  if (!env) return { ok: false, reason: 'No hay partida en esa ranura.' };
  if (env.format !== 'urumon-save' || env.v !== 1) return { ok: false, reason: 'Formato de partida desconocido.' };
  const sigOk = await verify({ build: env.build, data: env.data }, env.sig);
  if (!sigOk) {
    return { ok: false, reason: 'Esta partida fue modificada fuera del juego (firma inválida) y no se puede cargar.' };
  }
  const check = validateSave(env.data);
  if (!check.ok) return { ok: false, reason: 'La partida tiene datos imposibles y fue rechazada.', errors: check.errors };
  return { ok: true, state: check.data, outdated: env.build !== buildHash };
}

export async function deleteSave(slot) {
  return provider.remove(slot);
}
