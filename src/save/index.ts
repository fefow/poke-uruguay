// Save manager: state -> validate -> sign -> provider, and back.
import { LocalStorageProvider, SupabaseProvider } from './provider.ts';
import { SAVE_CONFIG } from './config.ts';
import { getAccessToken, currentUser } from './auth.ts';
import { sign, verify, sha256Hex, canonical } from './integrity.ts';
import { validateSave } from './validate.ts';
import { SPECIES, MIN_LEVEL } from '../data/species.ts';
import { fitDown } from '../data/levels.ts';
import { legalMoves, calcStats } from '../game/creature.ts';
import { MOVES } from '../data/moves.ts';
import { ITEMS } from '../data/items.ts';
import { MAPS } from '../data/maps.ts';

let provider = null;
let cloud = false;
let buildHash = 'dev';

const makeCloud = () => new SupabaseProvider({ ...SAVE_CONFIG.supabase, getAccessToken } as any);

/** Where saves go right now: the signed-in account (cloud) or this device only. */
export function setSaveBackend(kind: 'cloud' | 'local') {
  cloud = kind === 'cloud' && SAVE_CONFIG.backend === 'supabase';
  provider = cloud ? makeCloud() : new LocalStorageProvider();
}
export const isCloud = () => cloud;

export async function initSaves() {
  setSaveBackend(SAVE_CONFIG.backend === 'supabase' && currentUser() ? 'cloud' : 'local');
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
    badges: Array.from({ length: 12 }, (_, i) => `badge${i + 1}`).filter((b) => s.flags[b]).length,
    dex: s.dex.caught.length,
    playtime: Math.floor(s.stats.playtime),
    location: MAPS[s.pos.map]?.name ?? '',
    champion: !!s.flags.champion,
    lead: s.party?.[0]?.species ?? null, // portrait on the save screen
  };
}

export async function listSaves() {
  return provider.list();
}

/** Creatures that an old build handed out above their stage (e.g. the Mercedes tournament gift) step back to the stage that fits their level. */
export function repairCreatures(state) {
  for (const c of [...(state?.party ?? []), ...(state?.box ?? [])]) {
    if (c && SPECIES[c.species] && c.level < MIN_LEVEL[c.species]) {
      c.species = fitDown(c.species, c.level);
      const legal = legalMoves(c.species, c.level);
      const keep = (c.moves ?? []).filter((m) => legal.has(m?.id));
      if (!keep.length) { const id = [...legal][0] as string; keep.push({ id, pp: MOVES[id].pp }); }
      c.moves = keep;
      c.hp = Math.min(c.hp, calcStats(c).hp);
    }
  }
}

export async function saveGame(slot, state) {
  repairCreatures(state);
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
  (envelope as any).sig = await sign({ build: envelope.build, data });
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
  // The signing key is per device, so it can only vouch for saves made on this
  // device. Cloud saves are vouched for by the server (submit_save re-checks every
  // write); they still go through validateSave() below.
  const sigOk = provider instanceof SupabaseProvider || await verify({ build: env.build, data: env.data }, env.sig);
  if (!sigOk) {
    return { ok: false, reason: 'Esta partida fue modificada fuera del juego (firma inválida) y no se puede cargar.' };
  }
  repairCreatures(env.data);
  const check = validateSave(env.data);
  if (!check.ok) return { ok: false, reason: 'La partida tiene datos imposibles y fue rechazada.', errors: check.errors };
  return { ok: true, state: check.data, outdated: env.build !== buildHash };
}

/**
 * Copies this device's saves into the signed-in account, for slots the account
 * has not used yet. Local copies are kept. The server re-checks every save, so
 * one from a build it does not know is reported as failed instead of uploaded.
 */
export async function localSavesToMigrate() {
  if (!cloud) return [];
  const local = await new LocalStorageProvider().list();
  const taken = new Set((await provider.list()).map((s) => s.slot));
  return local.filter((s) => !taken.has(s.slot));
}

export async function migrateLocalToCloud() {
  const out = { moved: 0, failed: [] as string[] };
  for (const { slot } of await localSavesToMigrate()) {
    const cloudProvider = provider;
    try {
      // Load through the normal path (signature + validation + repairs), then
      // save again so it is stamped with the current build.
      provider = new LocalStorageProvider();
      const res = await loadGame(slot);
      provider = cloudProvider;
      if (!res.ok) throw new Error(res.reason);
      await saveGame(slot, res.state);
      out.moved++;
    } catch (err) {
      out.failed.push(`Ranura ${slot}: ${err.message}`);
    } finally {
      provider = cloudProvider;
    }
  }
  return out;
}

export async function deleteSave(slot) {
  return provider.remove(slot);
}
