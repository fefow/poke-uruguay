// A gym leader the player befriends without knowing who he is: Ramón, minister of Livestock and leader of the
// Tacuarembó gym, goes around the fields in a straw hat looking at what the fog does to the cattle.
//  1. Tranqueras (before Rivera): a PP recruit dumps fog residue on a field; after the battle Ramón walks up,
//     thanks the player and gives a mate. Flags ev_ramon_0 (the recruit called the player) and ev_ramon_1.
//  2. Paso del Río Tacuarembó (after Rivera): Ramón walks up again, asks how Rivera went and promises a mate in
//     Tacuarembó. If the player skipped the first meeting, they meet here for the first time. Flag ev_ramon_2.
//  3. Tacuarembó gym: if they met, he greets the player as a friend and owns up (FRIEND_INTRO in story.ts).
import { fitToMap } from './map-gen.ts';
import { mapBand, badgeOf } from './route.ts';
import { TR } from './map-kit.ts';

const HAT = 'Hombre de sombrero';
// Old saves that are already past a meeting never see it out of order.
const RIVERA = badgeOf('rivera');
const TACUAREMBO = badgeOf('tacuarembo');

/** True once the player has met Ramón out in the fields. */
export const metRamon = (api) => api.flag('ev_ramon_1') || api.flag('ev_ramon_2');

/** What Ramón says at his gym when he already knows the player. */
export function ramonGymIntro(api): string[] {
  return [
    '¡{player}! ¿Cómo has estado? Pasá, pasá, que estás en tu casa.',
    'Sí, el del sombrero era yo. Ramón, ministro de Ganadería, Agricultura y Pesca.',
    'No te lo dije antes porque en el campo nadie le habla igual a un ministro. Y yo necesitaba saber qué le estaba haciendo la niebla a la gente de verdad.',
    api.flag('ev_ramon_1')
      ? 'Lo que hiciste en Tranqueras con aquel recluta no lo hace cualquiera. Desde ese día tenía ganas de verte acá.'
      : 'Desde que charlamos en el paso del río tenía ganas de verte acá.',
    'Pero en este gimnasio no hay amistad que valga. El monte no se rinde fácil, y yo tampoco.',
  ];
}

export const AMISTAD_SCRIPTS: Record<string, (api: any, npc?: any) => Promise<void>> = {
  /** Tranqueras: the recruit calls the player from the field (trigger on the road) or is talked to. */
  async ramon_recluta(api) {
    if (api.flag('ev_ramon_1')) return;
    const who = 'Recluta PP';
    if (!api.flag('ev_ramon_0')) {
      api.setFlag('ev_ramon_0');
      await api.say('¡Eh, vos! ¿Qué mirás?', { name: who });
      await api.npcWalkToPlayer('pp_residuo');
      await api.say(['Estas bolsas son residuo de la máquina de niebla. Las vacío en este campo y nadie se entera.', 'Y si lo vas a andar contando por ahí, primero me tenés que ganar.'], { name: who });
    } else {
      api.npcFacePlayer('pp_residuo');
      await api.say('¿Otra vez vos? Las bolsas no se vacían solas.', { name: who });
    }
    const [, hi] = mapBand('baltasar');
    const team = [['zorrigris', hi - 1], ['yararita', hi]];
    const res = await api.battle(TR('ramon_recluta', who, 'Equipo PP', team, hi * 40, null, 'Bueno, bueno. Me llevo las bolsas.', null, 'grunt'), { canLose: true });
    if (res !== 'win') return api.say('Volvé cuando tus criaturas estén listas.', { name: who });
    await api.say('Esto no queda así. La jefa se va a enterar.', { name: who });
    await api.npcWalkOff('pp_residuo');
    api.setFlag('ev_ramon_1');
    await api.npcApproach('ramon_campo');
    await api.say(['Vi todo desde el alambrado. Gracias, de verdad.', 'Ese residuo quema el pasto. Con una lluvia encima, el arroyo se lo llevaba a todos los campos de la zona.'], { name: HAT });
    await api.say(['Me llamo Ramón. Ando recorriendo campos, viendo cómo le pega la niebla al ganado. Digamos que trabajo para el campo.', '¿Y vos cómo te llamás?'], { name: 'Ramón' });
    await api.say('Le decís tu nombre.');
    await api.say(['{player}. Me lo voy a acordar.', 'Yo sigo para Rivera: tengo una reunión con gente del gobierno. Un aburrimiento, pero hay que ir.', 'Tomá, que no sea nada. Para el camino.'], { name: 'Ramón' });
    await api.give('mate', 1);
    await api.say('Ojalá nos volvamos a cruzar. Cuidate.', { name: 'Ramón' });
    await api.npcWalkOff('ramon_campo');
  },

  /** Paso del Río Tacuarembó: Ramón walks up to the player on the way to Tacuarembó. */
  async ramon_paso(api) {
    if (api.flag('ev_ramon_2')) return;
    api.setFlag('ev_ramon_2');
    await api.npcApproach('ramon_paso');
    if (api.flag('ev_ramon_1')) {
      await api.say('¡{player}! ¡Qué casualidad encontrarte acá!', { name: 'Ramón' });
      await api.say(api.flag(RIVERA)
        ? ['Ya me enteré de que le ganaste a Mariela en Rivera. La conozco de esas reuniones: no le gana cualquiera.', '¿Y cómo has estado? Se te ve más curtido que en Tranqueras.']
        : ['¿Cómo te fue en Rivera? Yo terminé la reunión y me vine para acá.'], { name: 'Ramón' });
    } else {
      await api.say(['Buenas. ¿Venís de Rivera? Se te nota en las botas: el polvo colorado de allá no se va con nada.'], { name: HAT });
      await api.say(['Me llamo Ramón. Recorro los campos viendo cómo le pega la niebla al ganado.', '¿Y vos cómo te llamás?'], { name: 'Ramón' });
      await api.say('Le decís tu nombre.');
      await api.say('{player}. Me lo voy a acordar.', { name: 'Ramón' });
    }
    await api.say(['Vengo de ver los arroyos. Están bajos y con una espuma gris que no me gusta nada.', 'Yo voy para Tacuarembó, que allá tengo… bueno, mi trabajo. Cuando llegues, te invito un mate. Prometido.'], { name: 'Ramón' });
    await api.npcWalkOff('ramon_paso');
  },
};

/** Places the recruit, the triggers and Ramón (hidden until he walks in) in the two localities. */
export function addAmistad(OUTDOOR: Record<string, any>) {
  const add = (m, list) => {
    const taken = new Set<string>((m.npcs ?? []).map((o) => `${o.x},${o.y}`));
    fitToMap(m.tiles, list, taken);
    (m.npcs ??= []).push(...list);
  };
  const tq = OUTDOOR.baltasar;
  if (tq) {
    add(tq, [
      { x: 21, y: 12, look: 'grunt', dir: 'left', fixed: true, id: 'pp_residuo', name: 'Recluta PP', script: 'ramon_recluta', cond: (f) => !f.ev_ramon_1 && !f[RIVERA] },
      { x: 20, y: 11, look: 'leader_mgap', dir: 'down', fixed: true, id: 'ramon_campo', name: 'Ramón', arrive: true, cond: (f) => !f.ev_ramon_1 && !f[RIVERA], text: ['Gracias otra vez.'] },
    ]);
    // the recruit calls the player as soon as they walk past the middle of the village
    (tq.triggers ??= []).push({ x: 17, y: 0, w: 1, h: tq.tiles.length, script: 'ramon_recluta', cond: (f) => !f.ev_ramon_0 && !f.ev_ramon_1 && !f[RIVERA] });
  }
  const paso = OUTDOOR.tranqueras;
  if (paso) {
    add(paso, [{ x: 16, y: 9, look: 'leader_mgap', dir: 'down', id: 'ramon_paso', name: 'Ramón', arrive: true, cond: (f) => !f.ev_ramon_2 && !f[TACUAREMBO], text: ['Nos vemos en Tacuarembó.'] }]);
    // he meets the player on their first steps in the village, whichever way they came in
    (paso.triggers ??= []).push({ x: 0, y: 0, w: paso.tiles[0].length, h: paso.tiles.length, script: 'ramon_paso', cond: (f) => !f.ev_ramon_2 && !f[TACUAREMBO] });
  }
}
