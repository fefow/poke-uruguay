// Swimmers: in every big stretch of water (where the canoe can sail) the only trainers are swimmers, floating offshore.
// Trainers that already look like swimmers are moved into the water; maps with a lot of water get one or two more.
import { tr } from './maps-act2.ts';
import { mapBand } from './route.ts';
import { rng } from './map-gen.ts';

const NAMES = ['Ramiro', 'Nahuel', 'Gabriela', 'Iván', 'Camila', 'Mauro', 'Sol', 'Bruno'];
const LINES = [
  ['¡Un navegante! Acá en el agua el que manda soy yo.', 'Me ganaste en mi propio terreno.', 'Seguí remando. Cuidado con la corriente.'],
  ['Hace horas que floto acá y nadie se animaba a venir.', 'Qué buena pelea.', 'El agua se pone brava más adelante.'],
  ['Me vi venir tu canoa desde lejos. ¡A combatir!', 'Está bien, está bien.', 'Mañana vuelvo a nadar acá.'],
];

export function addSwimmers(maps: Record<string, any>, skip: string[] = []) {
  for (const [id, m] of Object.entries(maps)) {
    if (!m?.tiles || m.indoor || skip.includes(id) || !m.exits) continue;
    const h = m.tiles.length, w = m.tiles[0].length;
    const at = (x: number, y: number) => m.tiles[y]?.[x];
    const free = (x: number, y: number) => !(m.npcs ?? []).some((n) => n.x === x && n.y === y) && !(m.flagTiles ?? []).some((f) => f.x === x && f.y === y);
    // offshore spots: the tile and its whole neighbourhood (radius 2) is water
    const deep: number[][] = [];
    for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
      let ok = true;
      for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (at(x + dx, y + dy) !== '~') { ok = false; break; }
      if (ok && free(x, y)) deep.push([x, y]);
    }
    const existing = (m.npcs ?? []).filter((n) => n.trainer && n.look === 'swimmer');
    if (deep.length < 12) continue; // not enough water for the canoe: swimmers stay where they are
    const r = rng(`swim${id}`);
    const want = Math.max(existing.length, deep.length >= 120 ? 3 : deep.length >= 50 ? 2 : 1);
    const taken: number[][] = [];
    const pick = () => {
      for (let tries = 0; tries < 60; tries++) {
        const c = deep[Math.floor(r() * deep.length)];
        if (taken.every(([x, y]) => Math.abs(x - c[0]) + Math.abs(y - c[1]) >= 7)) return c;
      }
      return null;
    };
    const band = mapBand(id) ?? [10, 14];
    let k = 0;
    const dirs = ['left', 'right', 'up', 'down'];
    for (let i = 0; i < want; i++) {
      const c = pick();
      if (!c) break;
      taken.push(c);
      const dir = dirs[Math.floor(r() * 4)];
      const ex = existing[i];
      if (ex) { ex.x = c[0]; ex.y = c[1]; ex.dir = dir; ex.sight = Math.max(ex.sight ?? 4, 4); ex.wander = false; continue; }
      const lo = Math.max(2, band[1] - 3), hi = band[1];
      const t = tr({ x: c[0], y: c[1], dir }, 'swimmer', `sw_${id}_${k}`, NAMES[(k + id.length) % NAMES.length], 'Nadador', ['agua'], [lo, hi], LINES[k % LINES.length] as [string, string, string], { dir, sight: 4 });
      (m.npcs ??= []).push(t);
      k++;
    }
    // any further swimmers that did not get a spot keep their place
  }
}
