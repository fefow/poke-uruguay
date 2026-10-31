import { deepFreeze } from '../core/util.js';
import { MOVES } from './moves.js';
import { LINES, LEGENDS } from './species-extra.js';

// Original creatures inspired by Uruguayan wildlife and culture.
// base: [hp, atk, def, spa, spd, spe]
// art: procedural sprite recipe (see gfx/creatures.js)
const S = (id, key, name, types, base, catchRate, baseExp, learn, desc, art, evo = null, extra = {}) => ({
  id, key, name, types, base, catchRate, baseExp, learn, desc, art, evo, ...extra,
});

const BASE_LIST = [
  // --- Starters -------------------------------------------------------
  S(1, 'ceibito', 'Ceibo', ['planta'], [45, 49, 49, 63, 63, 45], 45, 64,
    [[1, 'placaje'], [1, 'grunido'], [7, 'latigo_cepa'], [12, 'absorber'], [17, 'megaagotar'], [22, 'somnifero']],
    'Un brote de ceibo de las orillas de los arroyos. Su flor roja se abre cuando está en calma.',
    { plan: 'quad', c1: '#6cbf4a', c2: '#2f7a3a', c3: '#e0263a', feats: ['flower', 'ears_round', 'tail_short'] },
    { lvl: 14, to: 'ceibal' }),
  S(2, 'ceibal', 'Ceibal', ['planta'], [60, 64, 65, 80, 80, 60], 45, 142,
    [[1, 'placaje'], [1, 'absorber'], [9, 'latigo_cepa'], [13, 'somnifero'], [17, 'hoja_afilada'], [26, 'megaagotar'], [32, 'mate_amargo'], [38, 'rayo_ceibo']],
    'Sus ramas forman un bosque en miniatura sobre el lomo. Las aves anidan entre sus flores.',
    { plan: 'quad', c1: '#4fa83c', c2: '#2b5e2c', c3: '#e0263a', feats: ['flower', 'flower2', 'ears_pointy', 'tail_short'], size: 1.1 },
    { lvl: 30, to: 'ceibarbol' }),
  S(3, 'ceibarbol', 'Ceibárbol', ['planta', 'tierra'], [80, 90, 90, 100, 95, 70], 45, 236,
    [[1, 'absorber'], [1, 'hoja_afilada'], [17, 'hoja_afilada'], [26, 'megaagotar'], [32, 'excavar'], [36, 'mate_amargo'], [42, 'rayo_ceibo'], [50, 'terremoto']],
    'Un ceibo andante de siglos de edad. Se dice que conserva la memoria de los montes nativos.',
    { plan: 'quad', c1: '#3e8a33', c2: '#6b4a2a', c3: '#e0263a', feats: ['flower', 'flower2', 'tree', 'tail_short'], size: 1.25 }),
  S(4, 'tejuchispa', 'Tejuchispa', ['fuego'], [39, 52, 43, 60, 50, 65], 45, 62,
    [[1, 'placaje'], [1, 'grunido'], [7, 'ascuas'], [12, 'ataque_rapido'], [16, 'aranazo'], [21, 'rueda_fuego'], [26, 'malicioso']],
    'Un lagarto overo que guarda brasas bajo las escamas. Busca el calor de las parrillas encendidas.',
    { plan: 'lizard', c1: '#3a3a3a', c2: '#f2f0e6', c3: '#ff8a2a', feats: ['spots', 'flame_tail'] },
    { lvl: 14, to: 'tejubrasa' }),
  S(5, 'tejubrasa', 'Tejubrasa', ['fuego'], [58, 70, 58, 80, 65, 80], 45, 142,
    [[1, 'aranazo'], [1, 'ascuas'], [9, 'ataque_rapido'], [17, 'rueda_fuego'], [24, 'mordisco'], [28, 'golpe_karate'], [34, 'parrillada'], [40, 'candombe']],
    'Camina erguido. Sus escamas se ponen al rojo vivo cuando entra en combate.',
    { plan: 'lizard', c1: '#2e2e2e', c2: '#f2e6c6', c3: '#ff6a1a', feats: ['spots', 'flame_tail', 'crest'], size: 1.1 },
    { lvl: 30, to: 'tejufogon' }),
  S(6, 'tejufogon', 'Tejufogón', ['fuego', 'lucha'], [78, 104, 78, 95, 80, 100], 45, 240,
    [[1, 'rueda_fuego'], [1, 'golpe_karate'], [24, 'mordisco'], [32, 'patada_baja'], [36, 'parrillada'], [42, 'candombe'], [48, 'fogon'], [55, 'garra_charrua']],
    'Su fuego recuerda al de un fogón de estancia: congrega a los suyos y aleja a los intrusos.',
    { plan: 'lizard', c1: '#262626', c2: '#f5d6a0', c3: '#ff4a10', feats: ['spots', 'flame_tail', 'crest', 'mane'], size: 1.25 }),
  S(7, 'carpinchito', 'Carpincho', ['agua'], [50, 48, 60, 50, 54, 42], 45, 63,
    [[1, 'placaje'], [1, 'grunido'], [7, 'pistola_agua'], [12, 'burbuja'], [17, 'hidropulso'], [22, 'mate_amargo']],
    'Pasa el día en los esteros, sumergido junto a otros de su especie. Rara vez se altera.',
    { plan: 'quad', c1: '#9a6a3c', c2: '#6e4826', c3: '#3f86e0', feats: ['ears_round', 'snout', 'tail_none'] },
    { lvl: 14, to: 'carpincho' }),
  S(8, 'carpincho', 'Carpinchón', ['agua'], [70, 63, 80, 65, 75, 52], 45, 142,
    [[1, 'placaje'], [1, 'pistola_agua'], [9, 'burbuja'], [13, 'mate_amargo'], [17, 'hidropulso'], [26, 'golpe_cuerpo'], [32, 'cascada'], [38, 'ola_del_plata']],
    'Las aves se posan en su lomo sin que lo perturbe. Es el mayor roedor de la cuenca del Plata.',
    { plan: 'quad', c1: '#8a5a30', c2: '#5c3a1c', c3: '#3f86e0', feats: ['ears_round', 'snout', 'tail_none', 'bird_on_back'], size: 1.15 },
    { lvl: 30, to: 'carpinchon' }),
  S(9, 'carpinchon', 'Carpinchal', ['agua', 'tierra'], [100, 83, 100, 85, 95, 62], 45, 239,
    [[1, 'pistola_agua'], [1, 'golpe_cuerpo'], [26, 'golpe_cuerpo'], [32, 'excavar'], [36, 'cascada'], [40, 'mate_amargo'], [44, 'ola_del_plata'], [52, 'terremoto']],
    'Un gigante sereno de los humedales. Cuando se sumerge, el agua a su alrededor queda inmóvil.',
    { plan: 'quad', c1: '#7a4c26', c2: '#4c2e14', c3: '#3f86e0', feats: ['ears_round', 'snout', 'tail_none', 'bird_on_back', 'mud'], size: 1.3 }),

  // --- Common ---------------------------------------------------------
  S(10, 'teruterito', 'Tero', ['normal', 'volador'], [40, 45, 40, 35, 35, 56], 255, 50,
    [[1, 'picotazo'], [1, 'chirrido'], [5, 'ataque_rapido'], [11, 'ataque_ala'], [16, 'griterio'], [24, 'pico_taladro']],
    'Defiende su nido a gritos. Ningún intruso se acerca sin que todo el campo se entere.',
    { plan: 'bird', c1: '#d8d8d0', c2: '#3a3a44', c3: '#e0263a', feats: ['crest', 'mask'] },
    { lvl: 18, to: 'teruterazo' }),
  S(11, 'teruterazo', 'Terogarra', ['normal', 'volador'], [65, 75, 60, 55, 55, 91], 120, 155,
    [[1, 'picotazo'], [1, 'chirrido'], [11, 'ataque_ala'], [16, 'griterio'], [27, 'pico_taladro'], [35, 'candombe'], [42, 'vendaval']],
    'Los espolones de sus alas disuaden a los zorros. Vigila el campo como un centinela.',
    { plan: 'bird', c1: '#e0e0d8', c2: '#2a2a34', c3: '#e0263a', feats: ['crest', 'mask', 'spurs'], size: 1.2 }),
  S(12, 'hornerito', 'Hornero', ['volador'], [40, 50, 50, 30, 40, 50], 200, 55,
    [[1, 'picotazo'], [1, 'malicioso'], [6, 'bofeton_lodo'], [12, 'ataque_ala'], [17, 'defensa_ferrea'], [22, 'lanzarrocas']],
    'Construye hornos de barro sobre postes y ramas. Trabaja sin descanso durante la estación de cría.',
    { plan: 'bird', c1: '#c27a3a', c2: '#e6c49a', c3: '#8a5a30', feats: [] },
    { lvl: 20, to: 'hornerazo' }),
  S(13, 'hornerazo', 'Hornoroca', ['volador', 'roca'], [65, 80, 95, 45, 60, 65], 90, 160,
    [[1, 'picotazo'], [1, 'bofeton_lodo'], [12, 'ataque_ala'], [17, 'defensa_ferrea'], [22, 'lanzarrocas'], [30, 'avalancha'], [38, 'pico_taladro']],
    'Carga su horno de barro como una armadura. Es el ave que mejor representa al país.',
    { plan: 'bird', c1: '#b0662a', c2: '#e6c49a', c3: '#8a6a4a', feats: ['oven'], size: 1.2 }),
  S(14, 'nandulin', 'Ñandú', ['normal'], [50, 55, 40, 30, 40, 70], 190, 58,
    [[1, 'placaje'], [1, 'malicioso'], [6, 'ataque_rapido'], [12, 'patada_baja'], [18, 'golpe_cuerpo']],
    'Cruza las praderas a una velocidad que iguala a la de un caballo. No vuela y no lo necesita.',
    { plan: 'runner', c1: '#9c9486', c2: '#5c564c', c3: '#f2d25c', feats: [] },
    { lvl: 22, to: 'nanduro' }),
  S(15, 'nanduro', 'Ñanduro', ['normal', 'lucha'], [75, 95, 60, 40, 60, 100], 75, 170,
    [[1, 'patada_baja'], [1, 'ataque_rapido'], [18, 'golpe_cuerpo'], [26, 'candombe'], [34, 'derribo'], [42, 'garra_charrua']],
    'El macho incuba los huevos de toda la familia. Sus patadas son temidas en el campo.',
    { plan: 'runner', c1: '#8c8476', c2: '#4c463c', c3: '#f2d25c', feats: ['mane'], size: 1.3 }),
  S(16, 'mulitin', 'Mulita', ['tierra'], [50, 55, 75, 25, 40, 30], 190, 60,
    [[1, 'aranazo'], [1, 'defensa_ferrea'], [7, 'ataque_arena'], [12, 'bofeton_lodo'], [18, 'excavar'], [22, 'lanzarrocas']],
    'Se enrolla sobre sí misma como una esfera blindada. Cava madrigueras en los campos del norte.',
    { plan: 'armadillo', c1: '#b8a07a', c2: '#7a6448', c3: '#e8d8b0', feats: [] },
    { lvl: 24, to: 'mulitron' }),
  S(17, 'mulitron', 'Mulacero', ['tierra', 'roca'], [75, 90, 120, 40, 60, 45], 75, 170,
    [[1, 'aranazo'], [1, 'defensa_ferrea'], [18, 'excavar'], [22, 'lanzarrocas'], [30, 'avalancha'], [40, 'terremoto']],
    'Su coraza resiste el golpe de un pico. Al rodar deja surcos profundos en la tierra.',
    { plan: 'armadillo', c1: '#a08460', c2: '#5c4630', c3: '#d8c8a0', feats: ['spikes'], size: 1.25 }),
  S(18, 'zorrigris', 'Zorrigrís', ['siniestro'], [42, 55, 40, 45, 40, 70], 190, 58,
    [[1, 'aranazo'], [1, 'malicioso'], [6, 'mordisco'], [12, 'ataque_rapido'], [18, 'finta'], [23, 'maquinacion']],
    'Un zorro gris y astuto. Merodea las chacras en busca de choclos y raramente sale con las manos vacías.',
    { plan: 'quad', c1: '#8c8c88', c2: '#5c5450', c3: '#d8c8b0', feats: ['ears_pointy', 'tail_bushy', 'snout_long'] },
    { lvl: 25, to: 'zorromonte' }),
  S(19, 'zorromonte', 'Zorromonte', ['siniestro'], [68, 90, 65, 75, 65, 100], 75, 168,
    [[1, 'mordisco'], [1, 'finta'], [23, 'maquinacion'], [29, 'triturar'], [36, 'niebla_densa'], [44, 'candombe']],
    'Recorre los montes de noche. Sus ojos brillan entre los coronillas.',
    { plan: 'quad', c1: '#6c6460', c2: '#3c3430', c3: '#e8c070', feats: ['ears_pointy', 'tail_bushy', 'snout_long', 'mask'], size: 1.2 }),
  S(20, 'luciernito', 'Luciérnaga', ['bicho', 'electrico'], [40, 35, 40, 55, 45, 60], 190, 56,
    [[1, 'impactrueno'], [1, 'disparo_demora'], [7, 'picadura'], [13, 'onda_trueno'], [19, 'chispa']],
    'Ilumina las noches de verano en las sierras. Su luz es una señal para los de su especie.',
    { plan: 'bug', c1: '#4a4a3a', c2: '#f2e05c', c3: '#c8ff6a', feats: ['glow', 'antennae'] },
    { lvl: 26, to: 'luceron' }),
  S(21, 'luceron', 'Lucerna', ['bicho', 'electrico'], [65, 55, 60, 95, 75, 95], 75, 165,
    [[1, 'impactrueno'], [1, 'picadura'], [19, 'chispa'], [26, 'zumbido'], [34, 'rayo_pampero'], [40, 'meditacion']],
    'Un enjambre puede iluminar un pueblo entero durante un apagón.',
    { plan: 'bug', c1: '#3a3a2e', c2: '#f2e05c', c3: '#c8ff6a', feats: ['glow', 'antennae', 'wings4'], size: 1.25 }),
  S(22, 'yararita', 'Yarará', ['veneno'], [40, 55, 40, 40, 40, 55], 190, 58,
    [[1, 'picotazo_veneno'], [1, 'malicioso'], [8, 'mordisco'], [14, 'acido'], [20, 'toxico']],
    'Se oculta entre los pastizales. Advierte antes de atacar, y conviene hacerle caso.',
    { plan: 'snake', c1: '#8a6a3a', c2: '#3a2a1a', c3: '#e8d8a0', feats: ['pattern'] },
    { lvl: 28, to: 'yarara' }),
  S(23, 'yarara', 'Yararacusú', ['veneno', 'siniestro'], [65, 90, 70, 75, 70, 85], 75, 170,
    [[1, 'picotazo_veneno'], [1, 'mordisco'], [20, 'toxico'], [28, 'triturar'], [34, 'bomba_lodo'], [42, 'niebla_densa']],
    'El dibujo de su piel recuerda a un mapa antiguo. Respeta su territorio y no te atacará.',
    { plan: 'snake', c1: '#7a5a2a', c2: '#2a1a0a', c3: '#e8d8a0', feats: ['pattern', 'fangs'], size: 1.3 }),
  S(24, 'lobito', 'Lobo Fino', ['agua'], [50, 45, 45, 50, 50, 55], 190, 56,
    [[1, 'placaje'], [1, 'grunido'], [6, 'pistola_agua'], [12, 'hidropulso'], [20, 'golpe_cuerpo'], [26, 'cascada']],
    'Una cría de la Isla de Lobos. Aprende a nadar siguiendo el ruido de la colonia.',
    { plan: 'seal', c1: '#8a7e72', c2: '#c8bcae', c3: '#2a2420', feats: [] },
    { lvl: 24, to: 'lobomarino' }),
  S(25, 'lobomarino', 'Lobo Marino', ['agua', 'lucha'], [90, 95, 80, 70, 80, 65], 110, 118,
    [[1, 'hidropulso'], [1, 'golpe_karate'], [26, 'cascada'], [30, 'patada_baja'], [38, 'ola_del_plata'], [46, 'garra_charrua']],
    'Patrulla la costa de Rocha. Disputa cada roca de la lobería con rugidos y embestidas.',
    { plan: 'seal', c1: '#6a5444', c2: '#a8927c', c3: '#241810', feats: ['crest'], size: 1.1 },
    { lvl: 38, to: 'patriarca' }),
  S(0, 'patriarca', 'Patriarca', ['agua', 'lucha'], [105, 120, 95, 80, 90, 70], 45, 190,
    [[1, 'hidropulso'], [1, 'golpe_karate'], [30, 'patada_baja'], [38, 'ola_del_plata'], [46, 'garra_charrua'], [54, 'cascada']],
    'El macho dominante de la Isla de Lobos. Su rugido se oye desde la costa y ordena toda la colonia.',
    { plan: 'seal', c1: '#52402f', c2: '#8e7458', c3: '#1a100a', feats: ['mane', 'crest', 'scars'], size: 1.18 }),
  S(26, 'benteve', 'Benteveo', ['volador', 'bicho'], [55, 65, 50, 50, 50, 80], 150, 120,
    [[1, 'picotazo'], [1, 'malicioso'], [8, 'picadura'], [14, 'ataque_ala'], [20, 'disparo_demora'], [28, 'pico_taladro'], [34, 'zumbido']],
    'Su grito, "bien-te-veo", se oye desde los cables. Nada escapa a su vista.',
    { plan: 'bird', c1: '#f2d02a', c2: '#5a4630', c3: '#ffffff', feats: ['mask', 'crest'] }),
  S(27, 'cuervon', 'Cuervo', ['siniestro', 'volador'], [70, 85, 60, 60, 65, 75], 75, 160,
    [[1, 'picotazo'], [1, 'malicioso'], [10, 'mordisco'], [18, 'ataque_ala'], [26, 'finta'], [34, 'triturar'], [42, 'vendaval']],
    'Planea sobre la Quebrada de los Cuervos aprovechando las corrientes de aire cálido.',
    { plan: 'bird', c1: '#2a2a2e', c2: '#4a4a52', c3: '#d83a3a', feats: ['red_head', 'big_wings'], size: 1.2 }),
  S(28, 'butia', 'Butiá', ['planta'], [55, 55, 60, 50, 60, 35], 190, 62,
    [[1, 'absorber'], [1, 'grunido'], [8, 'latigo_cepa'], [14, 'somnifero'], [20, 'megaagotar']],
    'Una palmera joven de Rocha. Sus frutos naranjas tienen un sabor dulce y ácido.',
    { plan: 'plant', c1: '#5cae3c', c2: '#8a6a3a', c3: '#ff9a2a', feats: ['palm', 'fruits'] },
    { lvl: 22, to: 'butiazal' }),
  S(29, 'butiazal', 'Butiazal', ['planta', 'roca'], [80, 85, 100, 70, 80, 40], 75, 172,
    [[1, 'latigo_cepa'], [1, 'megaagotar'], [22, 'lanzarrocas'], [28, 'defensa_ferrea'], [34, 'avalancha'], [42, 'rayo_ceibo']],
    'Un palmar centenario que avanza con lentitud. Los licores de su fruto son célebres.',
    { plan: 'plant', c1: '#4a9a34', c2: '#6a5a4a', c3: '#ff8a1a', feats: ['palm', 'fruits', 'rocks'], size: 1.3 }),
  S(30, 'tortugal', 'Tortugal', ['roca', 'agua'], [80, 70, 110, 60, 85, 30], 60, 165,
    [[1, 'placaje'], [1, 'defensa_ferrea'], [10, 'pistola_agua'], [18, 'lanzarrocas'], [26, 'hidropulso'], [34, 'avalancha'], [42, 'ola_del_plata']],
    'Una tortuga verde que llega a las costas de Rocha cada verano.',
    { plan: 'turtle', c1: '#5c9a7a', c2: '#3a6a4a', c3: '#c8b878', feats: [] }),
  S(31, 'gatomontes', 'Gatomontés', ['siniestro', 'normal'], [60, 85, 55, 50, 55, 95], 90, 150,
    [[1, 'aranazo'], [1, 'malicioso'], [10, 'mordisco'], [18, 'ataque_rapido'], [26, 'finta'], [34, 'triturar'], [40, 'candombe']],
    'Un felino salvaje que casi nunca se deja ver. Sus manchas lo camuflan en el monte.',
    { plan: 'cat', c1: '#c8a870', c2: '#4a3a2a', c3: '#f2e8c8', feats: ['spots', 'ears_pointy', 'tail_long'] }),
  S(32, 'cotorrayo', 'Cotorrayo', ['electrico', 'volador'], [55, 50, 50, 75, 55, 90], 120, 140,
    [[1, 'impactrueno'], [1, 'picotazo'], [10, 'onda_trueno'], [16, 'ataque_ala'], [22, 'chispa'], [30, 'griterio'], [38, 'rayo_pampero']],
    'Vive en bandadas ruidosas sobre los eucaliptos. Sus plumas chisporrotean de electricidad estática.',
    { plan: 'bird', c1: '#5cc04a', c2: '#9adcff', c3: '#f2e05c', feats: ['parrot'] }),
  S(33, 'picaflorin', 'Picaflor', ['volador', 'psiquico'], [45, 40, 45, 80, 70, 110], 90, 150,
    [[1, 'picotazo'], [1, 'confusion'], [12, 'ataque_ala'], [18, 'absorber'], [24, 'meditacion'], [32, 'psiquico']],
    'Según la tradición, si entra en una casa trae noticias de alguien querido.',
    { plan: 'bird', c1: '#2ad8a0', c2: '#a04ae0', c3: '#ff4a8a', feats: ['long_beak', 'small'] }),
  S(34, 'mbigua', 'Mbiguá', ['agua', 'volador'], [60, 70, 55, 55, 55, 70], 120, 145,
    [[1, 'picotazo'], [1, 'pistola_agua'], [10, 'ataque_ala'], [16, 'hidropulso'], [24, 'pico_taladro'], [32, 'cascada']],
    'Un cormorán que se zambulle para pescar. Después se seca con las alas extendidas.',
    { plan: 'bird', c1: '#2a2e2a', c2: '#3a4a3a', c3: '#f2c03a', feats: ['long_neck'] }),
  S(35, 'venadito', 'Venado', ['normal'], [50, 55, 45, 50, 55, 65], 160, 60,
    [[1, 'placaje'], [1, 'grunido'], [8, 'ataque_rapido'], [14, 'confusion'], [20, 'golpe_cuerpo']],
    'Un ciervo de campo muy cauto. Su pelaje huele a hierbas de la pradera.',
    { plan: 'quad', c1: '#c8945a', c2: '#8a5a30', c3: '#f2e8d8', feats: ['ears_long', 'tail_short', 'snout_long', 'legs_long'] },
    { lvl: 28, to: 'venadalto' }),
  S(36, 'venadalto', 'Venadalto', ['normal', 'psiquico'], [75, 80, 65, 90, 80, 95], 60, 175,
    [[1, 'placaje'], [1, 'confusion'], [20, 'golpe_cuerpo'], [28, 'meditacion'], [34, 'psiquico'], [42, 'derribo']],
    'Habita las praderas protegidas de Arerunguá. Sus astas reflejan la luz de la luna.',
    { plan: 'quad', c1: '#b8844a', c2: '#7a4a20', c3: '#f2e8d8', feats: ['ears_long', 'tail_short', 'snout_long', 'legs_long', 'antlers'], size: 1.25 }),
  S(37, 'aguaraflama', 'Aguaraflama', ['fuego', 'siniestro'], [70, 90, 60, 95, 70, 105], 30, 190,
    [[1, 'ascuas'], [1, 'mordisco'], [20, 'rueda_fuego'], [26, 'finta'], [32, 'parrillada'], [40, 'triturar'], [48, 'maquinacion']],
    'El aguará guazú es tan esquivo que muchos dudan de su existencia. Su melena arde al atardecer.',
    { plan: 'quad', c1: '#d8642a', c2: '#2a1a14', c3: '#ffd04a', feats: ['ears_pointy', 'tail_bushy', 'snout_long', 'legs_long', 'mane'], size: 1.2 }),
  S(38, 'yacarito', 'Yacaré', ['agua', 'siniestro'], [55, 65, 60, 40, 45, 45], 120, 66,
    [[1, 'aranazo'], [1, 'malicioso'], [8, 'pistola_agua'], [14, 'mordisco'], [20, 'hidropulso'], [26, 'triturar']],
    'Un yacaré overo joven. Permanece inmóvil como un tronco hasta que llega el momento de atacar.',
    { plan: 'croc', c1: '#5a6a3a', c2: '#3a4a2a', c3: '#e8d8a0', feats: [] },
    { lvl: 30, to: 'yacaron' }),
  S(39, 'yacaron', 'Yacarón', ['agua', 'siniestro'], [85, 105, 100, 55, 70, 60], 45, 178,
    [[1, 'mordisco'], [1, 'hidropulso'], [26, 'triturar'], [30, 'cascada'], [38, 'ola_del_plata'], [46, 'terremoto']],
    'Domina los bañados del este. Su mordida es la más potente de la región.',
    { plan: 'croc', c1: '#4a5a2a', c2: '#2a3a1a', c3: '#e8d8a0', feats: ['spikes'], size: 1.35 }),

  // --- Legendary ------------------------------------------------------
  S(40, 'pamperon', 'Cardenal Azul', ['electrico', 'volador'], [90, 90, 85, 125, 90, 100], 3, 261,
    [[1, 'impactrueno'], [1, 'ataque_ala'], [30, 'chispa'], [40, 'rayo_pampero'], [50, 'vendaval'], [60, 'meditacion']],
    'El espíritu del viento pampero. Al batir las alas llega el frío y se despeja el cielo.',
    { plan: 'bird', c1: '#3a5ad8', c2: '#f2f2ff', c3: '#f2e05c', feats: ['crest', 'big_wings', 'lightning'], size: 1.3 },
    null, { legendary: true }),
  S(41, 'ballenaplata', 'Ballenaplata', ['agua', 'psiquico'], [130, 85, 90, 110, 110, 60], 3, 270,
    [[1, 'hidropulso'], [1, 'confusion'], [40, 'ola_del_plata'], [48, 'canto_ballena'], [55, 'mate_amargo'], [62, 'meditacion']],
    'La ballena franca austral que canta frente a Punta del Este. Su canto aplaca las tormentas.',
    { plan: 'whale', c1: '#3a4a6a', c2: '#c8d0e0', c3: '#9adcff', feats: [], size: 1.02 },
    null, { legendary: true }),
  S(42, 'soldemayo', 'Soldemayo', ['fuego', 'psiquico'], [100, 100, 100, 100, 100, 100], 3, 270,
    [[1, 'ascuas'], [1, 'confusion'], [30, 'parrillada'], [40, 'psiquico'], [50, 'sol_de_mayo'], [60, 'meditacion']],
    'El sol con rostro de la bandera. Solo se manifiesta ante quienes recorrieron todo el país.',
    { plan: 'sun', c1: '#f2c02a', c2: '#d8901a', c3: '#ffe88a', feats: [], size: 1.4 },
    null, { legendary: true, mythic: true }),
];

// ---------------------------------------------------------------- generated roster
const ROLE_W = { a: [1, 1.35, 1, 0.7, 0.85, 0.95], s: [1, 0.7, 0.9, 1.4, 1, 0.95], t: [1.35, 0.9, 1.4, 0.8, 1.2, 0.55], f: [0.85, 1, 0.75, 1, 0.8, 1.45], b: [1, 1, 1, 1, 1, 1] };
const statsFor = (bst, role) => {
  const w = ROLE_W[role];
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => Math.max(20, Math.round((bst * x) / sum)));
};
const expFor = (bst) => Math.round(Math.pow(bst / 100, 2.3) * 4.6);

const SLOTS = [[1, 45], [1, 45], [6, 50], [10, 58], [14, 66], [19, 78], [24, 90], [30, 96], [36, 105], [43, 115], [50, 130]];
const damaging = (type) => Object.entries(MOVES).filter(([, m]) => m.type === type && m.power > 0);
const STATUS_BY_TYPE = {
  veneno: 'gas_venenoso', psiquico: 'hipnosis', bicho: 'disparo_demora', electrico: 'onda_trueno', planta: 'somnifero',
  tierra: 'escudo_barro', roca: 'defensa_ferrea', siniestro: 'maquinacion', fuego: 'malicioso', agua: 'malicioso', volador: 'chirrido', lucha: 'candombe', normal: 'grunido',
};
const UTILITY = { a: 'candombe', s: 'meditacion', t: 'mate_amargo', f: 'candombe', b: 'mate_amargo' };

/** Deterministic learnset: strongest suitable move of the species' types at each slot. */
function learnsetFor(types, role) {
  const [prim, sec] = types;
  const taken = new Set();
  const out = [];
  SLOTS.forEach(([lvl, cap], i) => {
    const pools = i === 0 ? [damaging(prim)] : i === 1 ? [damaging('normal')] : sec && i % 2 === 0 ? [damaging(sec), damaging(prim)] : (sec ? [damaging(prim), damaging(sec)] : [damaging(prim)]);
    for (const pool of pools) {
      const cands = pool
        .filter(([k, m]) => !taken.has(k) && m.power <= cap && (i > 1 || m.power <= 70))
        .map(([k, m]) => [k, m.power + ((role === 's') === (m.cat === 'esp') ? 20 : 0)])
        .sort((x, y) => y[1] - x[1]);
      if (cands.length) { taken.add(cands[0][0]); out.push([lvl, cands[0][0]]); return; }
    }
  });
  const st = STATUS_BY_TYPE[prim];
  if (st && !taken.has(st)) { taken.add(st); out.push([16, st]); }
  const ut = role === 's' && prim !== 'psiquico' ? 'mate_amargo' : UTILITY[role];
  if (!taken.has(ut) && MOVES[ut]) out.push([26, ut]);
  return out.sort((x, y) => x[0] - y[0]);
}

function buildLines() {
  const out = [];
  for (const L of LINES) {
    L.mons.forEach(([key, name, sec, plan, c1, c2, c3, feats, size, desc], i) => {
      const types = sec ? [L.t, sec] : [L.t];
      const bst = L.bst[Math.min(i, L.bst.length - 1)];
      const last = i === L.mons.length - 1;
      const single = L.mons.length === 1;
      const catchRate = single ? 90 : last ? 60 : i === 0 ? 190 : 110;
      const step = L.evo[i];
      const evo = last ? null : typeof step === 'string' ? { lvl: 1, stone: step, to: L.mons[i + 1][0] } : { lvl: step, to: L.mons[i + 1][0] };
      out.push({
        id: 0, key, name, types, base: statsFor(bst, L.role), catchRate, baseExp: expFor(bst), learn: learnsetFor(types, L.role), desc,
        art: { plan, c1, c2, c3, feats: feats ? feats.split(' ') : [], size }, evo,
      });
    });
  }
  return out;
}

function buildLegends() {
  return LEGENDS.map((l) => ({
    id: 0, key: l.key, name: l.name, types: l.types, base: l.base, catchRate: 3, baseExp: 270, learn: l.learn, desc: l.desc,
    art: { plan: l.plan, c1: l.c1, c2: l.c2, c3: l.c3, feats: l.feats, size: l.size }, evo: null, legendary: true, ...(l.mythic ? { mythic: true } : {}),
  }));
}

// Dex order: the original 39 regular species, the new lines, then the five legendaries.
const REGULAR = BASE_LIST.filter((s) => !s.legendary);
const OLD_LEGENDS = BASE_LIST.filter((s) => s.legendary);
const LIST = [...REGULAR, ...buildLines(), ...OLD_LEGENDS, ...buildLegends()].map((s, i) => ({ ...s, id: i + 1 }));

export const SPECIES = deepFreeze(Object.fromEntries(LIST.map((s) => [s.key, s])));
export const DEX_ORDER = deepFreeze(LIST.map((s) => s.key));
export const STARTERS = deepFreeze(['ceibito', 'tejuchispa', 'carpinchito']);

/** Minimum level a species can legitimately exist at (used by save validation). */
export const MIN_LEVEL = deepFreeze(
  (() => {
    const out = {};
    for (const s of LIST) out[s.key] ??= 1;
    for (const s of LIST) if (s.evo) out[s.evo.to] = Math.max(out[s.evo.to], s.evo.lvl, out[s.key]);
    // second pass for 3-stage lines
    for (const s of LIST) if (s.evo) out[s.evo.to] = Math.max(out[s.evo.to], out[s.key] + 1);
    return out;
  })(),
);
