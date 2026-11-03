// Paysandú: the PP holds the long pier. A three-plank-wide boardwalk snakes from the beach (north-east) west, south, east,
// south and west again to a platform at its far end. Everybody stands on an outer plank and looks across the boardwalk, so
// nobody can be dodged. All trainers use Water creatures (alone or with a second thematic type). The foreman waits on the platform once every recruit is beaten (SCRIPTS.event_boss, flag muelle_clear).
import { tr, grunt } from './maps-act2.ts';
import { fitToMap } from './map-gen.ts';
import { STOP_INDEX, stopBand, gymAce } from './route.ts';
import { fishList } from './map-gen.ts';

export function addMuelleStory(m: any) {
  if (!m?.tiles) return;
  const [lo, hi] = stopBand(STOP_INDEX.paysandu);
  const top = gymAce('paysandu') - 1;
  const lv = (k: number): [number, number] => { const a = Math.min(top - 1, Math.max(lo, hi - 2) + Math.floor(k / 2)); return [a, Math.min(top, a + 1)]; };
  // Fishing table for the contest and for casual fishing: the river's water creatures at the zone's level.
  m.fish = fishList(lo, hi + 1, 'paysandu');
  const gates = ['mu_g1', 'mu_g2', 'mu_g3', 'mu_g4', 'mu_g5', 'mu_g6', 'mu_g7', 'mu_g8'];
  const done = (f) => gates.every((id) => f[`tr_${id}`]);
  const G = (i: number, x: number, y: number, dir: string, intro: string, lose: string, after: string, sight = 2) =>
    tr({ x, y, dir }, 'grunt', gates[i], 'Recluta PP', 'Equipo PP', ['agua'], lv(i + 1), [intro, lose, after], { dir, sight, gate: true });
  const F = (id: string, x: number, y: number, dir: string, look: string, name: string, cls: string, types: string[], k: number, lines: string[], sight = 2) =>
    tr({ x, y, dir }, look, id, name, cls, types, lv(k), lines as any, { dir, sight });
  const list: any[] = [
    F('mu_a', 37, 8, 'up', 'sailor', 'Tomás', 'Marinero', ['agua'], 0, ['Trabajo en este muelle desde antes de que lo cerraran.', 'Buen viento a favor.', 'Más adelante hay gente del PP. No son de acá.']),
    G(0, 30, 6, 'down', 'Este muelle es nuestro. Dé la vuelta.', 'Me sacaron del tablón.', 'Seguí, que atrás hay más. Y el capataz al final.'),
    F('mu_b', 22, 8, 'up', 'obrero', 'Estibador Gómez', 'Estibador', ['agua'], 2, ['Descargo cajas desde las seis de la mañana.', 'Se me cayó la carga.', 'Esas cajas no son de ningún armador conocido.']),
    G(1, 14, 6, 'down', 'Parado ahí. El muelle no se pasa.', 'Qué pena.', 'El tablón sigue hacia el sur y después vuelve al este.'),
    G(2, 7, 13, 'right', 'Alto. Esto es propiedad del Proyecto Pampero.', 'No puede ser.', 'Quedan más. Y el capataz, al final.'),
    F('mu_c', 9, 17, 'left', 'pescador', 'Roque', 'Pescador', ['agua'], 3, ['Pesco acá desde que mi padre me trajo.', 'Se me soltó una grande.', 'Mi hermano pesca en la playa. Preguntale por las cañas.']),
    G(3, 16, 20, 'down', 'Por acá no baja nadie sin permiso.', 'Está bien.', 'El tablón sigue al este y después baja.'),
    F('mu_d', 24, 22, 'up', 'pescador', 'Anselmo', 'Pescador', ['agua'], 4, ['La corriente trae de todo desde que están ellos.', 'Eso es pesca de verdad.', 'Mirá bien el agua. Hay un concurso de pesca con el juez de la entrada.']),
    G(4, 33, 27, 'right', 'Última curva. Tu camino termina acá.', 'Me retiro.', 'Seguí al oeste hasta la plataforma.'),
    F('mu_e', 35, 31, 'left', 'sailor', 'Marino Beltrán', 'Marinero', ['agua'], 5, ['Vi cómo entraron estas máquinas de noche.', 'Las olas me ganaron.', 'El capataz está al final, en la plataforma.']),
    F('mu_f', 26, 34, 'down', 'pescador', 'Doña Elba', 'Pescadora', ['agua'], 6, ['Con la red no se discute: o pica o no pica.', 'Vaya, vaya.', 'Más adelante cuidan la plataforma.']),
    G(5, 18, 36, 'up', 'Yo cuido la plataforma. Nadie le habla al capataz sin pasar por mí.', 'Perdí.', 'Anda, el capataz es el último.'),
    G(6, 8, 33, 'down', 'Estás rodeado. Rendite.', 'Imposible.', 'Hablale al capataz.', 3),
    G(7, 8, 37, 'up', 'No pasás de acá.', 'Qué mala suerte.', 'Hablale al capataz.', 3),
    { x: 6, y: 35, look: 'pp_capataz', dir: 'right', id: 'boss_muelle', cond: (f) => done(f) && !f.muelle_clear, script: 'event_boss', event: 'muelle' },
    { x: 6, y: 35, look: 'sailor', dir: 'right', cond: (f) => f.muelle_clear, script: 'event_owner', event: 'muelle' },
    { x: 40, y: 8, look: 'sailor', dir: 'up', name: 'Juez de pesca', script: 'ev_pesca' },
  ];
  (m.npcs ??= []).push(...list);
  decorate(m, list);
}

/** Dock clutter along the outer planks and boats moored in the river; never beside a person (sight lines stay clear). */
function decorate(m: any, people: any[]) {
  const set = (x: number, y: number, c: string) => { m.tiles[y] = m.tiles[y].slice(0, x) + c + m.tiles[y].slice(x + 1); };
  const near = (x: number, y: number) => (m.npcs ?? []).concat(people).some((n) => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1);
  const at = (x: number, y: number) => m.tiles[y]?.[x];
  const piece = ['Ш', 'Г', 'Б', 'Ш', 'Г'];
  let k = 0;
  for (let y = 5; y < m.tiles.length - 1; y++) {
    for (let x = 1; x < 54; x++) {
      if (at(x, y) !== 'b' || near(x, y)) continue;
      // outer plank: water on one side and plank on the opposite side
      const edge = (at(x, y - 1) === '~' && at(x, y + 1) === 'b') || (at(x, y + 1) === '~' && at(x, y - 1) === 'b') || (at(x - 1, y) === '~' && at(x + 1, y) === 'b') || (at(x + 1, y) === '~' && at(x - 1, y) === 'b');
      if (!edge) continue;
      // the corridor needs both other lanes free: never next to existing decor
      if ('ШГБ'.includes(at(x - 1, y)) || 'ШГБ'.includes(at(x + 1, y)) || 'ШГБ'.includes(at(x, y - 1)) || 'ШГБ'.includes(at(x, y + 1))) continue;
      if ((x * 7 + y * 13) % 9 === 0) set(x, y, piece[k++ % piece.length]);
    }
  }
  // boats tied to the pier
  for (const [x, y] of [[20, 10], [28, 10], [18, 24], [28, 24], [20, 33], [28, 38]]) if (at(x, y) === '~' && at(x + 1, y) === '~' && at(x, y - 1) !== 'b') set(x, y, 'β');
}

/** After every other scripted addition: nobody who is not part of the dock story may stand on the boardwalk (it is only three planks wide). */
export function clearPierFolk(m: any) {
  if (!m?.tiles) return;
  const stray = (m.npcs ?? []).filter((n) => !n.trainer && !n.script?.startsWith('event_') && n.script !== 'ev_pesca' && !n.id?.startsWith('boss_') && ['b', '~'].includes(m.tiles[n.y]?.[n.x]));
  stray.forEach((n) => { n.x = 47; n.y = 15; });
  fitToMap(m.tiles, stray, new Set<string>((m.npcs ?? []).filter((n) => !stray.includes(n)).map((n) => `${n.x},${n.y}`)));
}
