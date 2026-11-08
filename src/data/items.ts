import { deepFreeze } from '../core/util.ts';
import type { Item } from '../types.ts';
import { MOVES } from './moves.ts';

// pocket: 'items' | 'balls' | 'key'
// use: what the item does; validated in game/items logic, never trusted from saves.
const BASE_ITEMS = {
  ficha: { name: 'Ficha de Casino', pocket: 'items', price: 0, desc: 'Se compran en el Casino Peninsula de Maldonado y se juegan en las tragamonedas. Se cambian por premios, no por dinero.' },
  esfera: { name: 'Pokeball', pocket: 'balls', price: 200, ball: 1, desc: 'Una bola de cuero para atrapar criaturas salvajes. Efectividad ×1.' },
  superesfera: { name: 'Superball', pocket: 'balls', price: 600, ball: 1.5, desc: 'Mejor que la Pokeball. Cosida a mano en Tacuarembó. Efectividad ×1,5.' },
  ultraesfera: { name: 'Ultraball', pocket: 'balls', price: 1200, ball: 2, desc: 'Alta tecnología oriental. Efectividad ×2. Ideal para criaturas raras o de nivel alto.' },
  safari_ball: { name: 'Safari Ball', pocket: 'balls', price: 0, ball: 'safari', desc: 'Solo del Safari. Atrapa criaturas salvajes; con Galleta de Campaña, más seguido. Se devuelve al salir.' },
  cebo: { name: 'Galleta de Campaña', pocket: 'items', price: 0, bait: true, desc: 'Solo en el Safari. Comida para ganarse a la criatura: se encariña y es más fácil de atrapar (hasta 3 por criatura).' },
  esfera_celeste: { name: 'Pokeball Celeste', pocket: 'balls', price: 0, ball: 255, desc: 'Celeste como la camiseta. Atrapa sin fallar.' },

  te_marcela: { mate: true, name: 'Mate Lavado', pocket: 'items', price: 300, heal: 10, desc: 'El mate más suave, casi lavado. Recupera 10 PS.' },
  mate: { mate: true, name: 'Mate', pocket: 'items', price: 700, heal: 20, desc: 'Un mate bien cebado y caliente. Recupera 20 PS.' },
  mate_dulce: { mate: true, name: 'Mate con Carqueja', pocket: 'items', price: 1200, heal: 40, desc: 'Un mate fuerte, con carqueja. Recupera 40 PS.' },
  dulce_de_leche: { mate: true, name: 'Primer Mate', pocket: 'items', price: 2500, heal: 80, desc: 'El mate completo, con todo. Recupera 80 PS.' },
  chivito: { name: 'Chivito', pocket: 'items', price: 3000, heal: 9999, cure: 'all', desc: 'El sándwich nacional. Restaura PS y cura problemas de estado.' },
  alfajor_triple: { name: 'Alfajor Triple', pocket: 'items', price: 4000, revive: 1, desc: 'Triple de dulce de leche. Reanima a una criatura debilitada con todos sus PS.' },
  pan_casero: { name: 'Pan Casero', pocket: 'items', price: 3500, pp: 99, desc: 'Recién horneado. Restaura todos los PP de cada movimiento.' },
  ruda: { name: 'Ruda', pocket: 'items', price: 100, cure: 'psn', desc: 'Hierba de agosto. Cura el envenenamiento.' },
  linimento: { name: 'Linimento', pocket: 'items', price: 200, cure: 'par', desc: 'Cura la parálisis.' },
  aloe: { name: 'Aloe', pocket: 'items', price: 250, cure: 'brn', desc: 'Calma las quemaduras.' },
  despertador: { name: 'Despertador', pocket: 'items', price: 250, cure: 'slp', desc: 'Un timbre estridente que despierta a cualquiera.' },
  alfajor: { name: 'Alfajor', pocket: 'items', price: 1500, revive: 0.5, desc: 'Reanima a una criatura debilitada con la mitad de sus PS.' },
  torta_frita: { name: 'Torta Frita', pocket: 'items', price: 1000, pp: 5, desc: 'Ideal para días de lluvia. Restaura 5 PP de cada movimiento.' },
  garrapinada: { name: 'Garrapiñada', pocket: 'items', price: 0, rareCandy: true, desc: 'Maní con caramelo de la rambla. Sube un nivel.' },
  piedra_agata: { name: 'Piedra Ágata', pocket: 'items', price: 2100, stone: 'piedra_agata', desc: 'Ágata de Artigas, cargada de energía. Hace evolucionar a ciertas criaturas de fuego y eléctricas.' },
  piedra_amatista: { name: 'Piedra Amatista', pocket: 'items', price: 2100, stone: 'piedra_amatista', desc: 'Amatista de Artigas. Hace evolucionar a ciertas criaturas psíquicas y siniestras.' },
  piedra_basalto: { name: 'Piedra Basalto', pocket: 'items', price: 2100, stone: 'piedra_basalto', desc: 'Basalto de las canteras del norte. Hace evolucionar a ciertas criaturas de tierra y roca.' },

  // Equipables: a creature holds one; they work only for that creature (or, Repartir Exp, for the whole team)
  repartir_exp: { name: 'Repartir Exp', pocket: 'held', price: 6000, held: { shareExp: true }, desc: 'Si una criatura del equipo lo lleva, la EXP de cada combate se reparte entre todo el equipo, no solo entre quienes pelearon. Las del PC no cuentan.' },
  banda_fuerza: { name: 'Banda de Fuerza', pocket: 'held', price: 4000, held: { stat: 'atk', mult: 1.1 }, desc: 'Equipada, sube un 10 % el Ataque de la criatura.' },
  chapa_acero: { name: 'Chapa de Acero', pocket: 'held', price: 4000, held: { stat: 'def', mult: 1.1 }, desc: 'Equipada, sube un 10 % la Defensa de la criatura.' },
  bombilla_plata: { name: 'Bombilla de Plata', pocket: 'held', price: 4000, held: { stat: 'spa', mult: 1.1 }, desc: 'Equipada, sube un 10 % el Ataque Especial de la criatura.' },
  poncho_lluvia: { name: 'Poncho de Lluvia', pocket: 'held', price: 4000, held: { stat: 'spd', mult: 1.1 }, desc: 'Equipado, sube un 10 % la Defensa Especial de la criatura.' },
  alpargatas: { name: 'Alpargatas Livianas', pocket: 'held', price: 4000, held: { stat: 'spe', mult: 1.1 }, desc: 'Equipadas, suben un 10 % la Velocidad de la criatura.' },
  restos_asado: { name: 'Restos de Asado', pocket: 'held', price: 5000, held: { leftovers: 1 / 16 }, desc: 'Equipados, la criatura recupera 1/16 de sus PS al final de cada turno de combate.' },

  refuerzo_ataque: { name: 'Refuerzo de Ataque', pocket: 'items', price: 500, xstat: 'atk', desc: 'Solo en combate. Sube el Ataque de la criatura activa.' },
  refuerzo_defensa: { name: 'Refuerzo de Defensa', pocket: 'items', price: 550, xstat: 'def', desc: 'Solo en combate. Sube la Defensa de la criatura activa.' },
  refuerzo_especial: { name: 'Refuerzo Especial', pocket: 'items', price: 500, xstat: 'spa', desc: 'Solo en combate. Sube el Ataque Especial de la criatura activa.' },
  refuerzo_velocidad: { name: 'Refuerzo de Velocidad', pocket: 'items', price: 550, xstat: 'spe', desc: 'Solo en combate. Sube la Velocidad de la criatura activa.' },
  refuerzo_precision: { name: 'Refuerzo de Precisión', pocket: 'items', price: 600, xstat: 'acc', desc: 'Solo en combate. Sube la Precisión de la criatura activa.' },
  refuerzo_resistencia: { name: 'Refuerzo de Resistencia', pocket: 'items', price: 550, xstat: 'spd', desc: 'Solo en combate. Sube la Defensa Especial de la criatura activa.' },
  concentracion: { name: 'Concentración', pocket: 'items', price: 650, focus: true, desc: 'Solo en combate. La criatura activa pega golpes críticos mucho más seguido hasta que sea cambiada.' },
  repelente_super: { name: 'Super Repelente', pocket: 'items', price: 500, repel: 200, desc: 'Evita criaturas salvajes débiles por 200 pasos.' },
  repelente_max: { name: 'Repelente Máximo', pocket: 'items', price: 700, repel: 250, desc: 'Evita criaturas salvajes débiles por 250 pasos.' },
  repelente: { name: 'Repelente', pocket: 'items', price: 350, repel: 100, desc: 'Evita criaturas salvajes débiles por 100 pasos.' },

  carta_tabarez: { name: 'Carta de Tabárez', pocket: 'key', price: 0, desc: 'Una carta cerrada que el almacenero de Colonia del Sacramento guardaba para el Maestro Tabárez.' },
  uru_dex: { name: 'PokeDex', pocket: 'key', price: 0, desc: 'Registra las criaturas que viste y atrapaste.' },
  lampara: { name: 'Lámpara del Faro', pocket: 'key', price: 0, desc: 'La lámpara del faro de Cabo Polonio. Hay que devolverla.' },
  mapa_uruguay: { name: 'Mapa de Uruguay', pocket: 'key', price: 0, desc: 'Muestra el país entero y marca los lugares que ya visitaste y dónde estás ahora.' },
  cana_pescar: { name: 'Caña Vieja', pocket: 'key', price: 0, rod: 1, desc: 'Una caña simple. Parada frente al agua, apretá A: solo pican las criaturas más comunes y chicas.' },
  cana_buena: { name: 'Caña Buena', pocket: 'key', price: 0, rod: 2, desc: 'Más firme y con mejor carnada. Atrae criaturas acuáticas de mayor nivel.' },
  cana_super: { name: 'Súper Caña', pocket: 'key', price: 0, rod: 3, desc: 'La mejor caña. Pican todas las criaturas de la zona, incluso las más raras y fuertes.' },
  machete: { name: 'Machete', pocket: 'key', price: 0, desc: 'Corte: parate frente a un zarzal y apretá A para abrirte paso. Hace falta la Medalla Salto.' },
  canoa: { name: 'Canoa', pocket: 'key', price: 0, desc: 'Surf: permite navegar por el agua. Caminá hacia la orilla para subirte. Hace falta la Medalla Rivera.' },
  guantes: { name: 'Guantes de Domador', pocket: 'key', price: 0, desc: 'Fuerza: empujá rocas pesadas caminando contra ellas. Hace falta la Medalla Tacuarembó.' },
  soga: { name: 'Soga de Escalador', pocket: 'key', price: 0, desc: 'Trepar: parate frente a una cascada de la cueva y caminá contra ella para subir por la soga. Para bajar, caminá hacia abajo desde la cornisa.' },
  farol: { name: 'Farol de Gaucho', pocket: 'key', price: 0, desc: 'Destello: ilumina las cuevas oscuras. Se usa desde el menú. Hace falta la Medalla Maldonado.' },
  bici: { name: 'Bicicleta', pocket: 'key', price: 0, bike: true, desc: 'Cuatro veces más rápida que caminar, pero solo para moverse: no cambia nada en los combates. Se usa desde el menú. No se puede usar bajo techo.' },
  ticket_ferry: { name: 'Ticket del Buquebus', pocket: 'key', price: 0, desc: 'Pasaje para subir al Buquebus China Zorrilla, atracado en la terminal de Fray Bentos.' },
  credencial_anglo: { name: 'Credencial de operario', pocket: 'key', price: 0, desc: 'Credencial del Frigorífico Anglo a nombre de un operario. Alguien la perdió adentro.' },
  llave_c2: { name: 'Llave del camarote 2', pocket: 'key', price: 0, desc: 'Llave de bronce con una chapita: "Camarote 2". Del Buquebus China Zorrilla.' },
  llave_bodega: { name: 'Llave de la bodega', pocket: 'key', price: 0, desc: 'Llave grande y oxidada. Abre la bodega del Buquebus China Zorrilla.' },
  llave_cubierta: { name: 'Llave de la cubierta', pocket: 'key', price: 0, desc: 'Llave de la puerta a la cubierta superior del Buquebus China Zorrilla.' },
  silbato: { name: 'Silbato del Hornero', pocket: 'key', price: 0, desc: 'Vuelo: un hornero te lleva en vuelo a cualquier ciudad que ya visitaste. Hace falta la Medalla Florida. Se usa desde el menú.' },
  boleto: { name: 'Entrada al Centenario', pocket: 'key', price: 0, desc: 'Permite entrar a la Liga en el Estadio Centenario.' },
  // Mini stories: things carried from one person to another along the way
  soga_mojada: { name: 'Soga mojada', pocket: 'key', price: 0, desc: 'Una soga de escalador de colores, mojada y con olor a río. Su dueño la perdió en la Cueva de Palmitas.' },
  cabos: { name: 'Cabos de amarre', pocket: 'key', price: 0, desc: 'Unos rollos de cabo nuevo del depósito del almacén de Mercedes, para amarrar un bote.' },
  cuaderno_quiroga: { name: 'Cuaderno empapado', pocket: 'key', price: 0, desc: 'Un cuaderno lleno de letra apretada, con "H. Q." en la tapa. Se lo llevó el viento en la Ruta 3.' },
  brea: { name: 'Tarro de brea', pocket: 'key', price: 0, desc: 'Brea caliente de un carpintero de ribera de Tranqueras. Sirve para tapar un casco rajado.' },
  remos: { name: 'Remos', pocket: 'key', price: 0, desc: 'Un par de remos con iniciales talladas en el mango. Los trajo la corriente hasta Belén.' },
  correa: { name: 'Correa de motor', pocket: 'key', price: 0, desc: 'Una correa nueva del taller de la frontera, en Rivera. Es la medida de un camión.' },
  cabestro: { name: 'Cabestro', pocket: 'key', price: 0, desc: 'El cabestro del potro moro del domador de Tacuarembó. Sin él no se deja tocar por nadie.' },
};

// Máquinas de movimientos (MT): se consumen al usarse. Una criatura puede aprender
// el movimiento si comparte tipo con él o si es de tipo Normal (ver tmCompatible).
export const TM_MOVES = ['terremoto', 'psiquico', 'triturar', 'descarga', 'parrillada', 'cascada', 'bomba_lodo', 'tormenta_ceibo', 'avalancha', 'zumbido', 'punio_gaucho', 'vendaval', 'fogon', 'megaagotar', 'garra_charrua', 'premonicion', 'sombra_nocturna', 'excavar', 'derribo', 'pico_taladro'];
for (const m of TM_MOVES) {
  BASE_ITEMS[`mt_${m}`] = { name: `MT ${MOVES[m].name}`, pocket: 'tm', price: 3000, tm: m, desc: `Enseña ${MOVES[m].name} (${MOVES[m].power} de poder) a una criatura compatible. Se gasta al usarla.` };
}

export const ITEMS: Record<string, Item> = deepFreeze(BASE_ITEMS);

export const KEY_ITEMS = deepFreeze(Object.keys(ITEMS).filter((k) => ITEMS[k].pocket === 'key'));
export const MAX_STACK = 99;
export const MAX_FICHAS = 999;
