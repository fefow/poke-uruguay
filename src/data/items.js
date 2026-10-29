import { deepFreeze } from '../core/util.js';

// pocket: 'items' | 'balls' | 'key'
// use: what the item does; validated in game/items logic, never trusted from saves.
export const ITEMS = deepFreeze({
  esfera: { name: 'Pokeball', pocket: 'balls', price: 200, ball: 1, desc: 'Una bola de cuero para atrapar criaturas salvajes.' },
  superesfera: { name: 'Superball', pocket: 'balls', price: 600, ball: 1.5, desc: 'Mejor que la Pokeball. Cosida a mano en Tacuarembó.' },
  ultraesfera: { name: 'Ultraball', pocket: 'balls', price: 1200, ball: 2, desc: 'Alta tecnología oriental. Muy efectiva.' },
  esfera_celeste: { name: 'Pokeball Celeste', pocket: 'balls', price: 0, ball: 255, desc: 'Celeste como la camiseta. Atrapa sin fallar.' },

  te_marcela: { mate: true, name: 'Mate Lavado', pocket: 'items', price: 300, heal: 20, desc: 'Un mate ya muy cebado, suave. Tomándolo se recuperan 20 PS.' },
  mate: { mate: true, name: 'Mate Cebado', pocket: 'items', price: 700, heal: 60, desc: 'Un mate recién cebado, bien caliente. Tomándolo se recuperan 60 PS.' },
  mate_dulce: { mate: true, name: 'Mate Dulce', pocket: 'items', price: 1200, heal: 150, desc: 'Mate con azúcar y yuyos. Tomándolo se recuperan 150 PS.' },
  dulce_de_leche: { name: 'Dulce de Leche', pocket: 'items', price: 2500, heal: 9999, desc: 'Una cucharada restaura todos los PS.' },
  chivito: { name: 'Chivito', pocket: 'items', price: 3000, heal: 9999, cure: 'all', desc: 'El sándwich nacional. Restaura PS y cura problemas de estado.' },
  ruda: { name: 'Ruda', pocket: 'items', price: 100, cure: 'psn', desc: 'Hierba de agosto. Cura el envenenamiento.' },
  linimento: { name: 'Linimento', pocket: 'items', price: 200, cure: 'par', desc: 'Cura la parálisis.' },
  aloe: { name: 'Aloe', pocket: 'items', price: 250, cure: 'brn', desc: 'Calma las quemaduras.' },
  despertador: { name: 'Despertador', pocket: 'items', price: 250, cure: 'slp', desc: 'Un timbre estridente que despierta a cualquiera.' },
  alfajor: { name: 'Alfajor', pocket: 'items', price: 1500, revive: 0.5, desc: 'Reanima a una criatura debilitada con la mitad de sus PS.' },
  torta_frita: { name: 'Torta Frita', pocket: 'items', price: 1000, pp: 10, desc: 'Ideal para días de lluvia. Restaura 10 PP de cada movimiento.' },
  garrapinada: { name: 'Garrapiñada', pocket: 'items', price: 0, rareCandy: true, desc: 'Maní con caramelo de la rambla. Sube un nivel.' },
  repelente: { name: 'Repelente', pocket: 'items', price: 350, repel: 100, desc: 'Evita criaturas salvajes débiles por 100 pasos.' },

  uru_dex: { name: 'PokeDex', pocket: 'key', price: 0, desc: 'Registra las criaturas que viste y atrapaste.' },
  lampara: { name: 'Lámpara del Faro', pocket: 'key', price: 0, desc: 'La lámpara del faro de Cabo Polonio. Hay que devolverla.' },
  mapa_uruguay: { name: 'Mapa de Uruguay', pocket: 'key', price: 0, desc: 'Muestra el país entero y marca los lugares que ya visitaste y dónde estás ahora.' },
  cana_pescar: { name: 'Caña de Pescar', pocket: 'key', price: 0, desc: 'Parada frente al agua, tirá la caña con el botón A para pescar criaturas acuáticas.' },
  boleto: { name: 'Entrada al Centenario', pocket: 'key', price: 0, desc: 'Permite entrar a la Liga en el Estadio Centenario.' },
});

export const KEY_ITEMS = deepFreeze(Object.keys(ITEMS).filter((k) => ITEMS[k].pocket === 'key'));
export const MAX_STACK = 99;
