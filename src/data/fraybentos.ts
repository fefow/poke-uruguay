// Fray Bentos: the people of the town and its history (the Anglo meat plant, the river port). Placed on top of the
// town the map editor draws, so they only need a rough spot; fitToMap moves them to free ground.
import { fitToMap } from './map-gen.ts';

export function addFrayBentosStory(m: any) {
  const taken = new Set<string>((m.npcs ?? []).map((n) => `${n.x},${n.y}`));
  const folk: any[] = [
    // on the waterfront, facing the town: tells the history in three stages (see SCRIPTS.frb_historia)
    { x: 22, y: 22, look: 'maestra', dir: 'up', name: 'Profesora Irene', script: 'frb_historia' },
    // an old fisherman at the foot of the pier
    { x: 11, y: 22, look: 'sailor', dir: 'left', name: 'Pescador', text: ['Desde chico pesco bajo ese muelle. El río tiene humor propio.', 'Hoy no vi a la gente de la boletería. Los del barco andan nerviosos y nadie me explica por qué.'] },
    // retired Anglo worker by the factory gate: tells how the plant worked
    { x: 34, y: 15, look: 'obrero', dir: 'right', name: 'Jubilado del Anglo', text: ['Trabajé treinta años en esa planta. Las cámaras de frío tenían cintas por todos lados: una te llevaba, otra te devolvía.', 'Si entrás, no te enojes con las cintas. Cada una va para un solo lado, y se aprende probando.'] },
    // a kid who collects tins from the old factory
    { x: 26, y: 20, look: 'nino', dir: 'down', wander: true, name: 'Nene', text: ['Junto latas viejas del Anglo. Dicen que algunas valen plata.', 'Una vez encontré una con el dibujo de un barco. ¿Será el mismo de la boletería?'] },
    // someone who knows the port's rumours
    { x: 28, y: 19, look: 'camionero', dir: 'left', wander: true, name: 'Camionero', text: ['Traigo carga de Young. Desde que cerraron la salida norte con el zarzal, tengo que dar la vuelta por la ruta.', 'Alguien con una herramienta filosa lo arreglaría en un minuto.'] },
  ];
  // river life along the shore: animals seen up close but not fought
  const critter = (x, y, sp, text) => ({ x, y, look: `animal:${sp}`, wander: true, critter: true, dir: 'down', text });
  folk.push(
    critter(16, 22, 'carpincho', ['Un carpincho tomando sol en la costa, como si el puerto fuera suyo.']),
    critter(30, 22, 'cumulo', ['Un cuervo mira desde la orilla las latas viejas del Anglo.']),
    critter(36, 21, 'nimbo', ['Una golondrina va y viene del muelle al techo del puerto.']),
  );
  fitToMap(m.tiles, folk, taken);
  (m.npcs ??= []).push(...folk);
}
