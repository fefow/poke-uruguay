// Paysandú: the PP holds the long pier. The boardwalk snakes from the beach (north-east) west, south, east, south and west
// again to a platform at its far end; every person on it stands on the boardwalk and sees along it, so nobody can be
// dodged. The foreman waits on the platform once every recruit is beaten (SCRIPTS.event_boss, flag muelle_clear).
import { tr, grunt } from './maps-act2.ts';
import { fitToMap } from './map-gen.ts';
import { STOP_INDEX, stopBand, gymAce } from './route.ts';

export function addMuelleStory(m: any) {
  if (!m?.tiles) return;
  const [lo, hi] = stopBand(STOP_INDEX.paysandu);
  const top = gymAce('paysandu') - 1;
  const lv = (k: number): [number, number] => { const a = Math.min(top - 1, Math.max(lo, hi - 2) + Math.floor(k / 2)); return [a, Math.min(top, a + 1)]; };
  const gates = ['mu_g1', 'mu_g2', 'mu_g3', 'mu_g4', 'mu_g5', 'mu_g6', 'mu_g7'];
  const done = (f) => gates.every((id) => f[`tr_${id}`]);
  const G = (i: number, x: number, y: number, dir: string, intro: string, lose: string, after: string) =>
    grunt({ x, y, dir }, gates[i], lv(i + 1), intro, lose, after, { dir, sight: 6, gate: true });
  const list: any[] = [
    tr({ x: 36, y: 7, dir: 'right' }, 'sailor', 'mu_a', 'Tomás', 'Marinero', ['agua', 'volador'], lv(0), ['El muelle largo está cerrado, pero yo trabajo acá desde antes.', 'Buen viento a favor.', 'Más adelante hay gente del PP. No son de acá.'], { dir: 'right', sight: 6, gate: true }),
    G(0, 28, 7, 'right', 'Este muelle es nuestro. Dé la vuelta.', 'Me sacaron del tablón.', 'Seguí, que atrás hay más. Y el capataz al final.'),
    tr({ x: 19, y: 7, dir: 'right' }, 'obrero', 'mu_b', 'Estibador Gómez', 'Estibador', ['lucha', 'normal'], lv(2), ['Descargo cajas desde las seis de la mañana.', 'Se me cayó la carga.', 'Esas cajas no son de ningún armador conocido.'], { dir: 'right', sight: 6, gate: true }),
    G(1, 8, 14, 'up', 'Parado ahí. El muelle no se pasa.', 'Qué pena.', 'El tablón sigue hacia el sur y después vuelve al este.'),
    tr({ x: 20, y: 21, dir: 'left' }, 'pescador', 'mu_c', 'Roque', 'Pescador', ['agua'], lv(3), ['Pesco acá desde que mi padre me trajo.', 'Se me soltó una grande.', 'Mi hermano pesca en la playa. Preguntale por las cañas.'], { dir: 'left', sight: 6, gate: true }),
    G(2, 30, 21, 'left', 'Alto. Esto es propiedad del Proyecto Pampero.', 'No puede ser.', 'Dos más y el capataz, y ya no te molestamos.'),
    G(3, 34, 28, 'up', 'Por acá no baja nadie sin permiso.', 'Está bien.', 'Sigue hacia el oeste hasta la plataforma.'),
    tr({ x: 26, y: 35, dir: 'right' }, 'sailor', 'mu_d', 'Marino Beltrán', 'Marinero', ['agua', 'siniestro'], lv(5), ['Vi cómo entraron estas máquinas de noche.', 'Las olas me ganaron.', 'El capataz está al final, en la plataforma.'], { dir: 'right', sight: 6, gate: true }),
    G(4, 16, 35, 'right', 'Última guardia. Tu camino termina acá.', 'Me retiro.', 'El capataz Vidal te espera al fondo.'),
    G(5, 7, 33, 'down', 'Yo cuido la plataforma. Nadie le habla al capataz sin pasar por mí.', 'Perdí.', 'Anda, el capataz es el último.'),
    G(6, 7, 37, 'up', 'Estás rodeado. Rendite.', 'Imposible.', 'Hablale al capataz.'),
    { x: 4, y: 35, look: 'pp_capataz', dir: 'right', id: 'boss_muelle', cond: (f) => done(f) && !f.muelle_clear, script: 'event_boss', event: 'muelle' },
    { x: 4, y: 35, look: 'sailor', dir: 'right', cond: (f) => f.muelle_clear, script: 'event_owner', event: 'muelle' },
  ];
  (m.npcs ??= []).push(...list);
}

/** After every other scripted addition: nobody who is not part of the dock story may stand on the boardwalk (it is one tile wide). */
export function clearPierFolk(m: any) {
  if (!m?.tiles) return;
  const stray = (m.npcs ?? []).filter((n) => !n.trainer && !n.script?.startsWith('event_') && !n.id?.startsWith('boss_') && ['b', '~'].includes(m.tiles[n.y]?.[n.x]));
  stray.forEach((n) => { n.x = 47; n.y = 15; });
  fitToMap(m.tiles, stray, new Set<string>((m.npcs ?? []).filter((n) => !stray.includes(n)).map((n) => `${n.x},${n.y}`)));
}
