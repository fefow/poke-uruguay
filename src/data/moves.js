import { deepFreeze } from '../core/util.js';

// cat: 'fis' (physical) | 'esp' (special) | 'est' (status)
// fx: { status, chance, self:{stat:delta}, foe:{stat:delta}, heal, drain, recoil, crit, prio, never }
// stats: atk def spa spd spe acc eva
// PP are halved from the raw table (rounded up) so strong moves cannot be spammed.
const M = (name, type, cat, power, acc, pp, desc, fx = {}) => ({ name, type, cat, power, acc, pp: Math.max(2, Math.ceil(pp / 2)), desc, fx });

export const MOVES = deepFreeze({
  // Normal
  placaje: M('Placaje', 'normal', 'fis', 40, 100, 35, 'Una embestida con todo el cuerpo.'),
  aranazo: M('Arañazo', 'normal', 'fis', 40, 100, 35, 'Araña al rival con garras afiladas.'),
  grunido: M('Gruñido', 'normal', 'est', 0, 100, 40, 'Un gruñido intimidante que baja el Ataque del rival.', { foe: { atk: -1 } }),
  malicioso: M('Malicioso', 'normal', 'est', 0, 100, 30, 'Mirada hostil que baja la Defensa del rival.', { foe: { def: -1 } }),
  ataque_rapido: M('Ataque Rápido', 'normal', 'fis', 40, 100, 30, 'Golpea primero casi siempre.', { prio: 1 }),
  golpe_cuerpo: M('Golpe Cuerpo', 'normal', 'fis', 85, 100, 15, 'Cae con todo su peso. Puede paralizar.', { status: 'par', chance: 0.3 }),
  derribo: M('Derribo', 'normal', 'fis', 90, 85, 20, 'Embestida temeraria. El usuario también se daña.', { recoil: 0.25 }),
  chirrido: M('Chirrido', 'normal', 'est', 0, 85, 40, 'Un chillido agudo que baja mucho la Defensa.', { foe: { def: -2 } }),
  candombe: M('Danza Candombe', 'normal', 'est', 0, 100, 20, 'Baila al ritmo de los tambores: sube Ataque y Velocidad.', { self: { atk: 1, spe: 1 } }),
  mate_amargo: M('Mate Amargo', 'normal', 'est', 0, 100, 10, 'Se toma un mate y recupera la mitad de sus PS.', { heal: 0.5 }),
  griterio: M('Griterío', 'normal', 'esp', 70, 100, 15, 'Un grito ensordecedor de tero en el campo.'),
  // Fuego
  ascuas: M('Ascuas', 'fuego', 'esp', 40, 100, 25, 'Lanza brasas. Puede quemar.', { status: 'brn', chance: 0.1 }),
  rueda_fuego: M('Rueda Fuego', 'fuego', 'fis', 60, 100, 25, 'Rueda envuelto en llamas. Puede quemar.', { status: 'brn', chance: 0.1 }),
  parrillada: M('Parrillada', 'fuego', 'esp', 90, 100, 15, 'Llamas de parrilla a leña. Puede quemar.', { status: 'brn', chance: 0.1 }),
  fogon: M('Fogón', 'fuego', 'fis', 120, 100, 15, 'Se lanza como un fogón criollo. Mucho retroceso.', { recoil: 0.33 }),
  sol_de_mayo: M('Sol de Mayo', 'fuego', 'esp', 110, 95, 5, 'El sol de la bandera ilumina y quema. Puede quemar.', { status: 'brn', chance: 0.3 }),
  // Agua
  pistola_agua: M('Pistola Agua', 'agua', 'esp', 40, 100, 25, 'Dispara un chorro de agua.'),
  burbuja: M('Burbuja', 'agua', 'esp', 40, 100, 30, 'Burbujas que pueden bajar la Velocidad.', { foe: { spe: -1 }, chance: 0.1 }),
  hidropulso: M('Hidropulso', 'agua', 'esp', 60, 100, 20, 'Pulso de agua del arroyo.'),
  cascada: M('Cascada', 'agua', 'fis', 80, 100, 15, 'Embiste con la fuerza de un salto de agua.'),
  ola_del_plata: M('Ola del Plata', 'agua', 'esp', 95, 90, 10, 'Una ola marrón del Río de la Plata.'),
  // Planta
  absorber: M('Absorber', 'planta', 'esp', 20, 100, 25, 'Roba energía: recupera la mitad del daño.', { drain: 0.5 }),
  latigo_cepa: M('Látigo Cepa', 'planta', 'fis', 45, 100, 25, 'Azota con lianas.'),
  hoja_afilada: M('Hoja Afilada', 'planta', 'fis', 55, 95, 25, 'Hojas cortantes. Golpe crítico fácil.', { crit: 1 }),
  megaagotar: M('Megaagotar', 'planta', 'esp', 50, 100, 15, 'Roba mucha energía al rival.', { drain: 0.5 }),
  somnifero: M('Somnífero', 'planta', 'est', 0, 75, 15, 'Polvo de flor de ceibo que duerme.', { status: 'slp', chance: 1 }),
  rayo_ceibo: M('Rayo Ceibo', 'planta', 'esp', 95, 100, 10, 'Un rayo rojo como la flor nacional.'),
  // Eléctrico
  impactrueno: M('Impactrueno', 'electrico', 'esp', 40, 100, 30, 'Descarga eléctrica. Puede paralizar.', { status: 'par', chance: 0.1 }),
  chispa: M('Chispa', 'electrico', 'fis', 65, 100, 20, 'Placaje eléctrico. Puede paralizar.', { status: 'par', chance: 0.3 }),
  onda_trueno: M('Onda Trueno', 'electrico', 'est', 0, 90, 20, 'Paraliza al rival.', { status: 'par', chance: 1 }),
  rayo_pampero: M('Rayo Pampero', 'electrico', 'esp', 95, 100, 15, 'La tormenta del sur cae de golpe. Puede paralizar.', { status: 'par', chance: 0.1 }),
  // Tierra
  bofeton_lodo: M('Bofetón Lodo', 'tierra', 'esp', 20, 100, 10, 'Barro a la cara: baja la Precisión.', { foe: { acc: -1 }, chance: 1 }),
  ataque_arena: M('Ataque Arena', 'tierra', 'est', 0, 100, 15, 'Arena de playa a los ojos.', { foe: { acc: -1 } }),
  excavar: M('Excavar', 'tierra', 'fis', 80, 100, 10, 'Cava rápido y golpea desde abajo.'),
  terremoto: M('Terremoto', 'tierra', 'fis', 100, 100, 10, 'Sacude todo el terreno.'),
  // Roca
  lanzarrocas: M('Lanzarrocas', 'roca', 'fis', 50, 90, 15, 'Lanza piedras de cantera.'),
  avalancha: M('Avalancha', 'roca', 'fis', 75, 90, 10, 'Rocas de la quebrada caen sobre el rival.'),
  defensa_ferrea: M('Defensa Férrea', 'roca', 'est', 0, 100, 15, 'Se endurece como horno de barro. Sube mucho la Defensa.', { self: { def: 2 } }),
  // Volador
  picotazo: M('Picotazo', 'volador', 'fis', 35, 100, 35, 'Pica con el pico.'),
  ataque_ala: M('Ataque Ala', 'volador', 'fis', 60, 100, 35, 'Golpea con las alas abiertas.'),
  pico_taladro: M('Pico Taladro', 'volador', 'fis', 80, 100, 20, 'Picotazo giratorio.'),
  vendaval: M('Vendaval', 'volador', 'esp', 110, 70, 10, 'Un viento pampero que lo arrastra todo.'),
  // Bicho
  picadura: M('Picadura', 'bicho', 'fis', 60, 100, 20, 'Muerde con fuerza.'),
  disparo_demora: M('Disparo Demora', 'bicho', 'est', 0, 95, 40, 'Hilos pegajosos: baja mucho la Velocidad.', { foe: { spe: -2 } }),
  zumbido: M('Zumbido', 'bicho', 'esp', 90, 100, 10, 'Un zumbido que aturde.'),
  // Veneno
  picotazo_veneno: M('Picotazo Veneno', 'veneno', 'fis', 15, 100, 35, 'Aguijón tóxico. Puede envenenar.', { status: 'psn', chance: 0.3 }),
  acido: M('Ácido', 'veneno', 'esp', 40, 100, 30, 'Rocía ácido corrosivo.'),
  toxico: M('Tóxico', 'veneno', 'est', 0, 90, 10, 'Envenena al rival.', { status: 'psn', chance: 1 }),
  bomba_lodo: M('Bomba Lodo', 'veneno', 'esp', 90, 100, 10, 'Lodo tóxico. Puede envenenar.', { status: 'psn', chance: 0.3 }),
  // Siniestro
  mordisco: M('Mordisco', 'siniestro', 'fis', 60, 100, 25, 'Muerde con malas intenciones.'),
  finta: M('Finta', 'siniestro', 'fis', 60, 100, 20, 'Engaña y nunca falla.', { never: true }),
  triturar: M('Triturar', 'siniestro', 'fis', 80, 100, 15, 'Tritura con colmillos. Puede bajar la Defensa.', { foe: { def: -1 }, chance: 0.2 }),
  maquinacion: M('Maquinación', 'siniestro', 'est', 0, 100, 20, 'Trama algo turbio. Sube mucho el At. Especial.', { self: { spa: 2 } }),
  niebla_densa: M('Niebla Densa', 'siniestro', 'esp', 85, 95, 10, 'Bruma oscura que asfixia. Puede bajar la Precisión.', { foe: { acc: -1 }, chance: 0.3 }),
  // Psíquico
  confusion: M('Confusión', 'psiquico', 'esp', 50, 100, 25, 'Ataque mental débil.'),
  psiquico: M('Psíquico', 'psiquico', 'esp', 90, 100, 10, 'Gran poder mental. Puede bajar la Def. Especial.', { foe: { spd: -1 }, chance: 0.1 }),
  meditacion: M('Meditación', 'psiquico', 'est', 0, 100, 20, 'Medita bajo el ombú. Sube At. Especial y Def. Especial.', { self: { spa: 1, spd: 1 } }),
  canto_ballena: M('Canto Ballena', 'psiquico', 'esp', 100, 95, 10, 'Un canto profundo desde el océano.'),
  // Lucha
  golpe_karate: M('Golpe Karate', 'lucha', 'fis', 50, 100, 25, 'Golpe de canto. Golpe crítico fácil.', { crit: 1 }),
  patada_baja: M('Patada Baja', 'lucha', 'fis', 65, 100, 20, 'Patada de ñandú a las piernas.'),
  garra_charrua: M('Garra Charrúa', 'lucha', 'fis', 120, 100, 5, 'Coraje que nunca se rinde. Baja la Defensa propia.', { self: { def: -1, spd: -1 }, selfAlways: true }),
  // --- ampliación de la Dex ---
  colmillo_fuego: M('Colmillo Fuego', 'fuego', 'fis', 65, 95, 15, 'Muerde con las fauces al rojo. Puede quemar.', { status: 'brn', chance: 0.15 }),
  punio_trueno: M('Puño Trueno', 'electrico', 'fis', 75, 100, 15, 'Un puñetazo cargado de electricidad. Puede paralizar.', { status: 'par', chance: 0.15 }),
  descarga: M('Descarga', 'electrico', 'esp', 65, 100, 20, 'Suelta la carga acumulada. Puede paralizar.', { status: 'par', chance: 0.2 }),
  campo_arado: M('Campo Arado', 'tierra', 'fis', 60, 100, 20, 'Levanta el suelo como un arado.'),
  piedra_afilada: M('Piedra Afilada', 'roca', 'fis', 100, 80, 5, 'Lasca cortante. Golpe crítico fácil.', { crit: 1 }),
  derrumbe: M('Derrumbe', 'roca', 'fis', 65, 95, 15, 'Hace caer parte de la ladera sobre el rival.'),
  viento_cortante: M('Viento Cortante', 'volador', 'esp', 55, 95, 25, 'Ráfaga afilada. Golpe crítico fácil.', { crit: 1 }),
  aguijon: M('Aguijón', 'bicho', 'fis', 80, 100, 15, 'Un aguijonazo profundo.'),
  telarana: M('Telaraña', 'bicho', 'esp', 50, 100, 25, 'Hilos que atrapan y debilitan.', { foe: { spe: -1 }, chance: 0.3 }),
  dardo_venenoso: M('Dardo Venenoso', 'veneno', 'fis', 60, 100, 20, 'Clava un dardo tóxico. Puede envenenar.', { status: 'psn', chance: 0.3 }),
  gas_venenoso: M('Gas Venenoso', 'veneno', 'est', 0, 90, 20, 'Una nube que envenena al rival.', { status: 'psn', chance: 1 }),
  hipnosis: M('Hipnosis', 'psiquico', 'est', 0, 60, 20, 'Una mirada que adormece.', { status: 'slp', chance: 1 }),
  premonicion: M('Premonición', 'psiquico', 'esp', 70, 100, 15, 'Anticipa el movimiento y golpea primero con la mente.'),
  sombra_nocturna: M('Sombra Nocturna', 'siniestro', 'esp', 65, 100, 15, 'Una sombra que cae sobre el rival.'),
  punio_gaucho: M('Puño Gaucho', 'lucha', 'fis', 70, 100, 20, 'Puñetazo de peón de estancia.'),
  barrida: M('Barrida', 'lucha', 'fis', 45, 100, 25, 'Barre las piernas. Puede bajar la Velocidad.', { foe: { spe: -1 }, chance: 0.3 }),
  escudo_barro: M('Escudo de Barro', 'tierra', 'est', 0, 100, 15, 'Se cubre de barro: sube la Defensa.', { self: { def: 1 } }),
  tormenta_ceibo: M('Tormenta de Pétalos', 'planta', 'esp', 85, 95, 10, 'Un remolino de pétalos rojos.'),
});

export const STRUGGLE = deepFreeze(M('Forcejeo', 'normal', 'fis', 50, 100, 1, 'Último recurso.', { recoil: 0.25, never: true }));
