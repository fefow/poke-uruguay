// Ampliación de la Dex hasta 151 criaturas. Original, inspirada en la fauna,
// la flora y la cultura del Uruguay. Las estadísticas y los movimientos se
// generan a partir de un rol y del tipo (ver species.js).
//
// Cada línea evolutiva:  { t: tipo principal, role, bst: [BST por etapa], evo: [niveles], mons: [...] }
// Cada criatura:  [clave, nombre, tipo secundario | null, plano, c1, c2, c3, rasgos, tamaño, descripción]
// Roles: a = físico, s = especial, t = resistente, f = veloz, b = equilibrado.

const TRIO = [305, 415, 525];
const PAIR = [320, 470];

export const LINES = [
  // ---------------------------------------------------------------- PLANTA
  { t: 'planta', role: 't', bst: TRIO, evo: [16, 34], mons: [
    ['tala', 'Tala', null, 'bloom', '#4a8a3a', '#7a5a30', '#e8d070', 'tree thorns', 0.9, 'Un arbusto espinoso del monte nativo. Sus frutos amarillos atraen a las aves.'],
    ['talar', 'Talar', null, 'bloom', '#3e7a34', '#6a4a2a', '#e8c040', 'tree thorns', 1.05, 'Forma pequeños bosques que frenan el viento. Sus espinas ahuyentan a los intrusos.'],
    ['talamonte', 'Talamonte', 'tierra', 'bloom', '#2e6a2e', '#5a3e22', '#e8b030', 'tree thorns', 1.25, 'Un árbol anciano de los montes ribereños. Sus raíces sostienen el suelo durante las crecidas.'],
  ] },
  { t: 'planta', role: 'a', bst: PAIR, evo: [24], mons: [
    ['cardo', 'Cardo', null, 'bloom', '#6a8a4a', '#4a6a3a', '#a04ac8', 'thorns', 0.9, 'Crece en los campos sin que nadie lo siembre. Su flor violeta esconde espinas finas.'],
    ['cardal', 'Cardal', 'siniestro', 'bloom', '#587a3c', '#3a5a2c', '#c040a0', 'thorns', 1.15, 'Un cardal entero se mueve como una sola criatura. El ganado lo evita.'],
  ] },
  { t: 'planta', role: 'b', bst: [410], evo: [], mons: [
    ['camalote', 'Camalote', 'agua', 'bloom', '#4aa850', '#6a8a3a', '#b070e0', '', 1.0, 'Una isla flotante de los ríos del litoral. Lleva a otras criaturas aguas abajo.'],
  ] },

  // ---------------------------------------------------------------- FUEGO
  { t: 'fuego', role: 'f', bst: TRIO, evo: [17, 34], mons: [
    ['alazan', 'Alazán', null, 'quad', '#b8582a', '#7a3a1a', '#ff8a2a', 'ears_pointy snout_long legs_long tail_bushy', 0.95, 'Un potro color canela con la crin encendida. Galopa sin cansarse por los campos secos.'],
    ['corcel', 'Corcel', null, 'quad', '#c8441a', '#5a2410', '#ffa02a', 'ears_pointy snout_long legs_long tail_bushy mane', 1.1, 'Su crin arde cuando acelera. Deja huellas chamuscadas en el pasto.'],
    ['crinfuego', 'Crinfuego', 'lucha', 'quad', '#d83a10', '#3a1408', '#ffd040', 'ears_pointy snout_long legs_long tail_bushy mane', 1.3, 'Un corcel de leyenda. Los viejos jinetes decían verlo en las noches de tormenta.'],
  ] },
  { t: 'fuego', role: 's', bst: PAIR, evo: ['piedra_agata'], mons: [
    ['pavesa', 'Pavesa', null, 'wisp', '#ff8a2a', '#d8441a', '#ffe05c', '', 0.85, 'Una chispa viva que flota sobre las brasas. Se apaga si nadie la alimenta.'],
    ['fogata', 'Fogata', 'psiquico', 'wisp', '#ff6a1a', '#b0301a', '#fff08a', 'halo', 1.1, 'Reúne otras chispas a su alrededor. En invierno da calor a quienes se acercan.'],
  ] },
  { t: 'fuego', role: 'a', bst: PAIR, evo: [26], mons: [
    ['alacran', 'Alacrán', null, 'spider', '#c8441a', '#5a2410', '#ffb02a', 'tail_sting claws', 0.95, 'Vive bajo las piedras calientes. Su aguijón guarda un calor intenso.'],
    ['escorpio', 'Escorpio', 'veneno', 'spider', '#a8301a', '#2a1008', '#ffd040', 'tail_sting claws', 1.2, 'Su aguijón quema y envenena a la vez. Prefiere cazar al atardecer.'],
  ] },

  // ---------------------------------------------------------------- AGUA
  { t: 'agua', role: 'f', bst: PAIR, evo: [20], mons: [
    ['pejerrey', 'Pejerrey', null, 'fish', '#b8d0e0', '#7aa0c0', '#f2f2f2', 'stripe', 0.9, 'Un pez plateado de lagunas y costas. Se mueve en cardúmenes veloces.'],
    ['dorado', 'Dorado', null, 'fish', '#e0a02a', '#a86a1a', '#f8d870', 'stripe spikes', 1.2, 'El gran pez dorado del río Uruguay. Salta fuera del agua al ser capturado.'],
  ] },

  // ---------------------------------------------------------------- NORMAL
  { t: 'normal', role: 't', bst: TRIO, evo: [16, 32], mons: [
    ['ternero', 'Ternero', null, 'quad', '#a85a2a', '#f2f0e6', '#3a2a1a', 'ears_round snout tail_short', 0.9, 'Una cría de rodeo. Sigue a su manada y no se separa de ella.'],
    ['novillo', 'Novillo', null, 'quad', '#9a4a22', '#f2f0e6', '#3a2a1a', 'ears_round snout tail_short horns mask', 1.05, 'Criado a pasto, ya empuja con firmeza. Es la base de muchos asados.'],
    ['toro', 'Toro', 'lucha', 'quad', '#7a3a18', '#e8e0d0', '#3a2a1a', 'ears_round snout tail_short horns mask', 1.3, 'Un toro de estancia que no retrocede. Su embestida sacude el suelo.'],
  ] },
  { t: 'normal', role: 't', bst: PAIR, evo: [20], mons: [
    ['oveja', 'Oveja', null, 'quad', '#f2efe6', '#d8d4c8', '#3a3a3a', 'wool ears_round snout tail_short', 0.95, 'Su lana abriga a toda una familia. Se desplaza en grupo y evita quedarse sola.'],
    ['carnero', 'Carnero', 'lucha', 'quad', '#e8e0d0', '#cfc8b4', '#3a3a3a', 'wool horns ears_round snout tail_short', 1.15, 'Los machos chocan cabezas para decidir quién guía al rebaño.'],
  ] },
  { t: 'normal', role: 'f', bst: [440], evo: [], mons: [
    ['criollo', 'Criollo', null, 'quad', '#8a5a3a', '#2a1a10', '#f2f0e6', 'ears_pointy snout_long legs_long mane tail_bushy', 1.15, 'El caballo criollo, sobrio y resistente. Acompaña a los gauchos en jornadas de días enteros.'],
  ] },

  // ---------------------------------------------------------------- VOLADOR
  { t: 'volador', role: 'f', bst: TRIO, evo: [18, 34], mons: [
    ['gaviota', 'Gaviota', null, 'bird', '#f2f2f2', '#8a9aa8', '#e8a030', 'small', 1.0, 'Recorre la costa en busca de restos de pesca. Es ruidosa y muy curiosa.'],
    ['fragata', 'Fragata', 'agua', 'bird', '#2a3a4a', '#1a2430', '#e0263a', 'big_wings long_beak', 1.1, 'Persigue a otras aves en pleno vuelo para quitarles la presa.'],
    ['albatros', 'Albatros', 'agua', 'bird', '#f2f2f2', '#2a3a5a', '#f0b0a0', 'big_wings long_beak', 1.3, 'Planea sobre el océano durante semanas sin posarse. Sus alas son enormes.'],
  ] },
  { t: 'volador', role: 'a', bst: PAIR, evo: [22], mons: [
    ['chimango', 'Chimango', null, 'bird', '#a8825a', '#6a4a2a', '#e8d8b0', 'crest', 0.95, 'Un ave carroñera de campo abierto. Sigue a los tractores para cazar lo que levantan.'],
    ['carancho', 'Carancho', 'siniestro', 'bird', '#2a2a30', '#f2f2f2', '#e8602a', 'crest red_head', 1.15, 'Una rapaz oportunista de cara roja. No duda en disputarle la presa a cualquiera.'],
  ] },
  { t: 'volador', role: 's', bst: PAIR, evo: [26], mons: [
    ['garza', 'Garza', null, 'bird', '#e8eaf0', '#8a98a8', '#f2d02a', 'long_neck long_beak', 1.0, 'Espera inmóvil en la orilla hasta que pasa un pez. Es paciente y precisa.'],
    ['garzon', 'Garzón', 'agua', 'bird', '#f2f2f2', '#2a2a30', '#e0263a', 'long_neck long_beak red_head', 1.3, 'El mayor de los zancudos de los bañados. Su silueta se ve a kilómetros.'],
  ] },
  { t: 'volador', role: 's', bst: [440], evo: [], mons: [
    ['flamenco', 'Flamenco', 'psiquico', 'bird', '#f4a0b8', '#e06a90', '#2a2a2a', 'long_neck long_beak', 1.1, 'Descansa en un solo pie en las lagunas costeras. Se dice que medita mientras lo hace.'],
  ] },

  // ---------------------------------------------------------------- ELÉCTRICO
  { t: 'electrico', role: 's', bst: TRIO, evo: [18, 36], mons: [
    ['nimbo', 'Nimbo', null, 'wisp', '#8a96b0', '#6a7690', '#f2e05c', 'cloud', 0.85, 'Una nube pequeña que se carga de estática. Anuncia las tormentas de verano.'],
    ['cumulo', 'Cúmulo', 'volador', 'wisp', '#6a789a', '#4a5878', '#ffe44a', 'cloud', 1.1, 'Guarda rayos en su interior y los descarga hacia el suelo. Avanza empujada por el viento.'],
    ['tormenton', 'Tormentón', 'agua', 'wisp', '#3a4668', '#222c48', '#fff27a', 'cloud', 1.3, 'Una tormenta con voluntad propia. Donde pasa, el cielo se oscurece y el aire pesa.'],
  ] },
  { t: 'electrico', role: 'a', bst: PAIR, evo: ['piedra_agata'], mons: [
    ['anguila', 'Anguila', null, 'snake', '#4a6a5a', '#8ad0c0', '#f2e05c', 'pattern', 0.95, 'Vive en los fondos barrosos y aturde a sus presas con descargas.'],
    ['temblador', 'Temblador', 'agua', 'snake', '#2a5a6a', '#9af0e8', '#ffe44a', 'pattern fangs', 1.15, 'Puede paralizar a un animal grande con una sola descarga.'],
  ] },
  { t: 'veneno', role: 'f', bst: PAIR, evo: ['piedra_agata'], mons: [
    ['murcielago', 'Murciélago', 'volador', 'moth', '#5a4a6a', '#8a7a9a', '#ffe44a', 'bat', 0.95, 'Se orienta con chasquidos agudos y su mordida es venenosa. Pasa el día colgado en galpones abandonados.'],
    ['vespertino', 'Vespertino', 'volador', 'moth', '#3a2a4a', '#6a5a7a', '#ffe44a', 'bat', 1.2, 'Sale al anochecer en grandes bandadas. Su mordida deja un veneno que adormece.'],
  ] },
  { t: 'electrico', role: 's', bst: [450], evo: [], mons: [
    ['fanal', 'Fanal', 'psiquico', 'wisp', '#f2e05c', '#c8a02a', '#fffbd0', 'lantern', 1.0, 'Una luz que guía a los barcos en la niebla. Se la ve de lejos aunque no haya faro.'],
  ] },
  { t: 'electrico', role: 't', bst: [455], evo: [], mons: [
    ['pararrayo', 'Pararrayo', 'roca', 'golem', '#8a8a98', '#5a5a6a', '#ffe44a', 'rod', 1.0, 'Atrae los rayos hacia su cuerpo metálico y los almacena sin sufrir daño.'],
  ] },

  // ---------------------------------------------------------------- TIERRA
  { t: 'tierra', role: 'a', bst: TRIO, evo: [15, 32], mons: [
    ['tuco', 'Tuco', null, 'rodent', '#a8825a', '#6a4a2a', '#e8d0a0', 'claws', 0.9, 'Excava galerías bajo los médanos. Se oye su canto bajo la arena.'],
    ['tucotuco', 'Tucotuco', null, 'rodent', '#9a7248', '#5a3e22', '#e8d0a0', 'claws whiskers', 1.05, 'Sus túneles forman redes enormes. Siente las vibraciones a metros de distancia.'],
    ['tucoterra', 'Tucoterra', 'roca', 'rodent', '#8a6238', '#4a3018', '#d8c090', 'claws whiskers', 1.3, 'Remueve toneladas de tierra en una noche. El suelo se hunde donde hizo su madriguera.'],
  ] },
  { t: 'tierra', role: 't', bst: PAIR, evo: ['piedra_basalto'], mons: [
    ['tatu', 'Tatú', null, 'armadillo', '#7a6a58', '#5a4a3a', '#c8b898', '', 0.95, 'Un armadillo de escudo duro y paso lento. Cava en busca de raíces e insectos.'],
    ['tatucarreta', 'Tatú Carreta', 'roca', 'armadillo', '#6a5a48', '#4a3a2a', '#b8a888', 'spikes', 1.25, 'Un gigante blindado de la antigua fauna. Su caparazón resiste golpes enormes.'],
  ] },
  { t: 'tierra', role: 'a', bst: PAIR, evo: [24], mons: [
    ['cangrejo', 'Cangrejo', null, 'crab', '#a87a4a', '#d8602a', '#3a2a1a', '', 0.9, 'Vive en cuevas de barro de las costas del Plata. Sale con la marea baja.'],
    ['centollon', 'Centollón', 'agua', 'crab', '#8a5a30', '#e04a1a', '#3a2a1a', '', 1.2, 'Sus tenazas rompen la roca y la concha por igual.'],
  ] },
  { t: 'tierra', role: 't', bst: PAIR, evo: ['piedra_basalto'], mons: [
    ['hormiguero', 'Hormiguero', null, 'quad', '#7a7a6a', '#3a3a30', '#d8d0b0', 'snout_long tail_bushy ears_round', 0.95, 'Su lengua larga entra en los hormigueros sin esfuerzo.'],
    ['tamandua', 'Oso Hormiguero', 'lucha', 'quad', '#6a6a5a', '#2a2a22', '#d8d0b0', 'snout_long tail_bushy ears_round', 1.25, 'Se defiende con garras poderosas. Se alza ante pumas y jaguares.'],
  ] },

  // ---------------------------------------------------------------- SINIESTRO
  { t: 'siniestro', role: 's', bst: TRIO, evo: [17, 34], mons: [
    ['lechuza', 'Lechuza', null, 'owl', '#e8dcc0', '#8a6a4a', '#fffaf0', '', 0.9, 'Caza en silencio por los galpones. Su rostro blanco asusta a quien la ve de noche.'],
    ['carabo', 'Cárabo', 'psiquico', 'owl', '#8a7a62', '#4a3a2a', '#d8c8a0', '', 1.05, 'Ve perfectamente en la oscuridad. Su ulular anuncia cambios en el tiempo.'],
    ['buho', 'Búho', 'volador', 'owl', '#5a4a3a', '#2a1e14', '#e8c070', '', 1.3, 'Dueño de la noche rural. Pocos se atreven a mirarlo a los ojos.'],
  ] },
  { t: 'siniestro', role: 'b', bst: PAIR, evo: ['piedra_amatista'], mons: [
    ['comadreja', 'Comadreja', null, 'quad', '#8a8a82', '#4a4a44', '#f2f0e6', 'snout_long ears_round tail_bushy mask', 0.9, 'Se hace la muerta cuando la acorralan. Es más lista de lo que parece.'],
    ['zarigueya', 'Comadreja Overa', 'veneno', 'quad', '#6a6a62', '#3a3a34', '#e8e4d8', 'snout_long ears_round tail_bushy mask', 1.15, 'Su cola prensil le permite colgarse de las ramas. Sorprende con un mordisco certero.'],
  ] },
  { t: 'siniestro', role: 'f', bst: PAIR, evo: [25], mons: [
    ['huron', 'Hurón', null, 'cat', '#6a6a6a', '#2a2a2a', '#e8e8e8', '', 0.9, 'Esbelto y rápido, persigue presas por las madrigueras.'],
    ['grison', 'Hurón Mayor', 'lucha', 'cat', '#5a5a5e', '#1a1a1e', '#d8d8d8', '', 1.15, 'Ataca con una rapidez que sorprende a presas más grandes.'],
  ] },

  // ---------------------------------------------------------------- BICHO
  { t: 'bicho', role: 'b', bst: [290, 360, 500], evo: [12, 26], mons: [
    ['oruga', 'Oruga', null, 'bug', '#7ac048', '#4a8a2a', '#f2d02a', 'antennae', 0.85, 'Devora hojas sin descanso. Pronto empezará a envolverse en seda.'],
    ['crisalida', 'Crisálida', null, 'bug', '#8a9a58', '#5a6a38', '#c8d890', 'antennae', 0.95, 'Inmóvil, se transforma por dentro. Resiste cualquier golpe mientras tanto.'],
    ['monarca', 'Monarca', 'volador', 'moth', '#f08a1a', '#d86a10', '#2a1a10', '', 1.2, 'Migra miles de kilómetros siguiendo el calor. Sus alas parecen vitrales.'],
  ] },
  { t: 'bicho', role: 't', bst: PAIR, evo: [21], mons: [
    ['cascarudo', 'Cascarudo', null, 'bug', '#3a2a1a', '#5a3a2a', '#d8b050', '', 0.9, 'Un escarabajo de caparazón brillante que vuela con torpeza hacia las luces.'],
    ['escarabajon', 'Escarabajón', 'lucha', 'bug', '#2a2a3a', '#4a3a5a', '#d8b050', 'wings4 antennae', 1.2, 'Levanta varias veces su propio peso. Su cuerno es un arma eficaz.'],
  ] },
  { t: 'bicho', role: 'a', bst: PAIR, evo: [25], mons: [
    ['avispa', 'Avispa', null, 'bug', '#f2c02a', '#2a2a2a', '#f2e05c', 'wings4 antennae glow', 0.9, 'Defiende su nido con picaduras repetidas. Es agresiva si la molestan.'],
    ['camoati', 'Camoatí', 'veneno', 'bug', '#d8a020', '#2a2a2a', '#f2e05c', 'wings4 antennae glow', 1.15, 'Construye grandes nidos de papel en las ramas. Su colonia actúa como un solo ser.'],
  ] },
  { t: 'bicho', role: 'a', bst: PAIR, evo: [19], mons: [
    ['hormiga', 'Hormiga', null, 'spider', '#3a2018', '#5a3a28', '#c83a2a', 'claws', 0.85, 'Trabaja en hileras sin fin. Transporta hojas mucho más grandes que ella.'],
    ['cortadora', 'Cortadora', 'planta', 'spider', '#6a2a18', '#8a4a30', '#4aa83c', 'claws', 1.2, 'Sus mandíbulas cortan hojas como tijeras. Una colonia puede dejar un campo pelado.'],
  ] },
  { t: 'bicho', role: 'a', bst: [440], evo: [], mons: [
    ['tarantula', 'Tarántula', 'veneno', 'spider', '#4a3a2a', '#2a2018', '#c8a860', 'claws', 1.15, 'Cazadora nocturna de gran tamaño. Espera inmóvil en su cueva a que pase una presa.'],
  ] },

  // ---------------------------------------------------------------- VENENO
  { t: 'veneno', role: 't', bst: TRIO, evo: [17, 33], mons: [
    ['sapo', 'Sapo', null, 'frog', '#7a8a52', '#4a5a32', '#d8d8a0', 'spots', 0.9, 'Segrega una sustancia irritante cuando se siente amenazado. Canta tras la lluvia.'],
    ['cururu', 'Cururú', 'agua', 'frog', '#5a7a3a', '#3a5a22', '#e8e0a0', 'spots sac', 1.1, 'Hincha el cuerpo para parecer más grande. Su veneno paraliza a depredadores pequeños.'],
    ['escuerzo', 'Escuerzo', 'tierra', 'frog', '#8a9a3a', '#5a3a1a', '#e8d870', 'spots horns sac', 1.3, 'El sapo cornudo de la pampa. Se entierra y espera con la boca abierta.'],
  ] },
  { t: 'electrico', role: 's', bst: PAIR, evo: [24], mons: [
    ['aguaviva', 'Aguaviva', 'agua', 'jelly', '#b8d8f8', '#8ab8e8', '#e8b0f8', '', 0.95, 'Arrastrada por la corriente hasta las playas, deja ronchas dolorosas con descargas eléctricas.'],
    ['carabela', 'Carabela', 'agua', 'jelly', '#4a8ae8', '#2a5ac0', '#c870e8', 'float', 1.2, 'Sus tentáculos miden metros. Un solo roce con su descarga saca a un nadador del agua.'],
  ] },
  { t: 'veneno', role: 'a', bst: PAIR, evo: [23], mons: [
    ['viuda', 'Viuda', null, 'spider', '#1a1a22', '#2a2a32', '#e0263a', 'hourglass', 0.95, 'Teje redes irregulares en rincones oscuros. Su picadura debe tomarse en serio.'],
    ['viudanegra', 'Viuda Negra', 'siniestro', 'spider', '#101018', '#24242c', '#e0263a', 'hourglass claws', 1.2, 'Una araña silenciosa que acecha desde las sombras. Su veneno actúa rápido.'],
  ] },
  { t: 'veneno', role: 'a', bst: PAIR, evo: [22], mons: [
    ['ciempies', 'Ciempiés', null, 'snake', '#a8582a', '#d8a040', '#e0c060', 'pattern', 0.95, 'Recorre la hojarasca con decenas de patas. Pica sin aviso si lo pisan.'],
    ['escolopendra', 'Escolopendra', 'bicho', 'snake', '#7a2a1a', '#d89030', '#e8c070', 'pattern fangs', 1.2, 'Un ciempiés enorme de picadura intensa. Caza ratones y lagartijas.'],
  ] },

  // ---------------------------------------------------------------- PSÍQUICO
  { t: 'psiquico', role: 's', bst: TRIO, evo: [18, 36], mons: [
    ['candil', 'Candil', null, 'wisp', '#8ad8f0', '#5ab0d8', '#f2fcff', 'lantern', 0.85, 'Una luz tenue que aparece sobre los pastizales por la noche. Hipnotiza a quienes la siguen.'],
    ['fatuo', 'Fatuo', 'fuego', 'wisp', '#a8e8d0', '#5ac0a0', '#f2fffa', 'halo', 1.1, 'Flota a ras del suelo. Los viajeros dicen que prefiere guiarlos lejos del camino.'],
    ['luzmala', 'Luz Mala', 'fuego', 'wisp', '#d8f0ff', '#8ad0f0', '#ffffff', 'halo lantern', 1.3, 'La luz de las leyendas rurales. Aparece donde algo quedó enterrado, y nadie sabe por qué.'],
  ] },
  { t: 'psiquico', role: 's', bst: PAIR, evo: ['piedra_amatista'], mons: [
    ['franciscana', 'Franciscana', 'agua', 'whale', '#9aa8b8', '#e8eef4', '#c8e0f0', '', 0.62, 'El delfín más pequeño del Plata. Se comunica con sonidos que parecen un idioma.'],
    ['tonina', 'Tonina', 'agua', 'whale', '#6a7a90', '#dde4ec', '#9adcff', '', 0.9, 'Nada junto a los barcos y salta entre las olas. Su inteligencia sorprende a los pescadores.'],
  ] },
  { t: 'psiquico', role: 'a', bst: PAIR, evo: ['piedra_amatista'], mons: [
    ['tatadios', 'Tata Dios', 'bicho', 'bug', '#7ac048', '#5a9a30', '#e8f0a0', 'antennae wings4', 0.9, 'Una mantis que permanece en una postura casi de rezo. Percibe los movimientos antes de que ocurran.'],
    ['mantis', 'Mantis', 'bicho', 'bug', '#5a9a30', '#3a7a20', '#f0f8b0', 'antennae wings4', 1.2, 'Su sentido del tiempo es perfecto. Golpea en el instante exacto.'],
  ] },
  { t: 'psiquico', role: 't', bst: PAIR, evo: [30], mons: [
    ['tapir', 'Tapir', null, 'quad', '#6a6a72', '#3a3a42', '#d8d8e0', 'snout_long ears_round tail_short', 0.95, 'Duerme con el hocico apoyado en el suelo. Se dice que se alimenta de sueños.'],
    ['anta', 'Anta', 'tierra', 'quad', '#5a5a62', '#2a2a32', '#d0d0d8', 'snout_long ears_round tail_short', 1.25, 'Atraviesa la espesura sin que nadie lo vea. Su mirada distrae la mente.'],
  ] },
  { t: 'psiquico', role: 's', bst: [455], evo: [], mons: [
    ['curupi', 'Curupí', 'planta', 'biped', '#4a6a3a', '#d8b890', '#a8402a', 'beard', 1.05, 'Un ser del monte guaraní, de pies al revés. Confunde a los cazadores con huellas falsas.'],
  ] },
  { t: 'psiquico', role: 'f', bst: [460], evo: [], mons: [
    ['pombero', 'Pombero', 'siniestro', 'biped', '#3a3a2e', '#c8a070', '#8a6a2a', 'hat', 1.05, 'Dicen que ronda los campos de noche y silba para esconderse. Hay que dejarle tabaco y miel.'],
  ] },

  // ---------------------------------------------------------------- LUCHA
  { t: 'lucha', role: 'a', bst: TRIO, evo: [16, 34], mons: [
    ['pibe', 'Gurí', null, 'biped', '#6cb4ee', '#e8b890', '#ffffff', 'gloves', 0.9, 'Un joven luchador de barrio que entrena en la cancha. Nunca deja de correr.'],
    ['volante', 'Volante', null, 'biped', '#4a8ad8', '#d8a070', '#ffffff', '', 1.05, 'Domina la mitad de la cancha. Recupera y reparte sin perder la calma.'],
    ['capitan', 'Capitán', 'normal', 'biped', '#2a6ab8', '#c89060', '#f2c02a', 'gloves', 1.28, 'Lidera con garra y con el ejemplo. Su espíritu de equipo inspira a los demás.'],
  ] },
  { t: 'lucha', role: 'a', bst: PAIR, evo: [26], mons: [
    ['peon', 'Peón', null, 'biped', '#8a6a3a', '#d8a070', '#c83a2a', 'hat', 0.95, 'Trabaja de sol a sol en la estancia. Sus manos son más duras que la piedra.'],
    ['capataz', 'Capataz', 'normal', 'biped', '#6a4a22', '#c89060', '#c83a2a', 'hat beard', 1.2, 'Dirige la tropa con autoridad. Nadie lo ve cansado.'],
  ] },
  { t: 'lucha', role: 'a', bst: [450], evo: [], mons: [
    ['carpintero', 'Carpintero', 'volador', 'bird', '#2a2a2a', '#d8a040', '#e0263a', 'crest long_beak red_head', 1.1, 'Golpea los troncos con cadencia constante. Su pico no se desgasta y perfora la madera más dura.'],
  ] },
  { t: 'lucha', role: 'b', bst: PAIR, evo: [25], mons: [
    ['coati', 'Coatí', null, 'cat', '#9a6a3a', '#4a3018', '#f2e8d0', '', 0.9, 'Explora en grupo y no se asusta con facilidad. Su cola anillada es inconfundible.'],
    ['coatimundi', 'Coatí Mayor', 'normal', 'cat', '#8a5a2a', '#3a2410', '#f2e8d0', '', 1.2, 'El macho solitario es más fuerte y hábil de lo que aparenta.'],
  ] },
  { t: 'lucha', role: 'b', bst: [440], evo: [], mons: [
    ['tamborilero', 'Tamborilero', 'normal', 'biped', '#c83a3a', '#8a5a30', '#f2c02a', 'drum', 1.0, 'Marca el ritmo en las calles del barrio Sur. Su compás hace bailar a quien lo escucha.'],
  ] },
  { t: 'lucha', role: 'a', bst: [445], evo: [], mons: [
    ['boleador', 'Boleador', 'tierra', 'biped', '#7a2a1a', '#c89060', '#2a2a2a', 'hat gloves', 1.05, 'Lanza tres piedras atadas con la precisión que ya practicaban los antiguos charrúas.'],
  ] },
  { t: 'lucha', role: 'a', bst: [480], evo: [], mons: [
    ['caudillo', 'Caudillo', 'siniestro', 'biped', '#a8362a', '#d8a070', '#f2f2f2', 'hat beard', 1.2, 'Un jinete que reúne tropas a su alrededor. Su palabra pesa más que cualquier arma.'],
  ] },

  // ---------------------------------------------------------------- ROCA
  { t: 'roca', role: 't', bst: TRIO, evo: [17, 35], mons: [
    ['guijarro', 'Guijarro', null, 'golem', '#a8a8a0', '#8a8a82', '#e8e8e0', 'moss', 0.85, 'Una piedra redonda pulida por el arroyo. Rueda sin rumbo hasta encontrar un lugar.'],
    ['pedrusco', 'Pedrusco', null, 'golem', '#8c8c84', '#6a6a62', '#d8d8d0', 'moss', 1.05, 'Se endurece con el sol. Es difícil moverlo una vez que se planta.'],
    ['penasco', 'Peñasco', 'tierra', 'golem', '#7a7a74', '#5a5a54', '#c8c8c0', 'moss', 1.3, 'Una montaña pequeña que camina. Su peso hace temblar el suelo.'],
  ] },
  { t: 'roca', role: 's', bst: PAIR, evo: ['piedra_basalto'], mons: [
    ['geoda', 'Geoda', null, 'golem', '#8c8478', '#6a6258', '#b070e8', 'crystals', 0.95, 'Parece una piedra común hasta que se abre y muestra un interior violeta.'],
    ['amatista', 'Amatista', 'psiquico', 'golem', '#7a6a8a', '#5a4a6a', '#c890f8', 'crystals', 1.2, 'Los cristales de su espalda brillan con luz propia. Proviene de las canteras de Artigas.'],
  ] },
  { t: 'roca', role: 't', bst: PAIR, evo: ['piedra_basalto'], mons: [
    ['fosil', 'Fósil', null, 'armadillo', '#b8a888', '#8a7a5a', '#6a5a40', '', 0.95, 'Un resto antiguo que cobra vida al contacto con la humedad. Conserva memoria de eras pasadas.'],
    ['gliptodonte', 'Gliptodonte', 'tierra', 'armadillo', '#9a8a68', '#6a5a3a', '#4a3a28', 'spikes', 1.3, 'Un animal blindado de la prehistoria. Su caparazón era una armadura completa.'],
  ] },
  { t: 'roca', role: 'a', bst: PAIR, evo: [26], mons: [
    ['arenisca', 'Arenisca', null, 'golem', '#c8a070', '#a87a4a', '#e8c890', 'columns', 0.95, 'Se deshace con el viento, pero se recompone con la lluvia.'],
    ['cuarcita', 'Cuarcita', null, 'golem', '#d8d0c0', '#b0a890', '#ffffff', 'columns', 1.2, 'Dura y filosa. Sus aristas brillan al sol como espejos.'],
  ] },
  { t: 'roca', role: 'a', bst: [450], evo: [], mons: [
    ['cuchilla', 'Cuchilla', 'lucha', 'golem', '#6a7a6a', '#4a5a4a', '#c8d8c0', 'columns', 1.1, 'Una serranía hecha criatura. Se alza como una hoja de piedra sobre los campos.'],
  ] },
  { t: 'roca', role: 't', bst: [460], evo: [], mons: [
    ['cerro', 'Cerro', 'planta', 'golem', '#6a8a6a', '#4a6a4a', '#8ad060', 'moss', 1.2, 'Una colina con vida propia. Sobre su lomo crecen árboles y viven aves.'],
  ] },
];

// Legendarias nuevas: el dúo genético (psíquico / planta), ver species.js.
export const LEGENDS = [
  { key: 'yaguarete', name: 'Yaguareté', types: ['psiquico', 'lucha'], base: [106, 110, 90, 154, 90, 130], plan: 'cat', c1: '#e8b040', c2: '#3a2a10', c3: '#f2e0a0', feats: ['spots'], size: 1.45,
    learn: [[1, 'confusion'], [1, 'aranazo'], [20, 'premonicion'], [30, 'patada_baja'], [40, 'psiquico'], [50, 'meditacion'], [60, 'garra_charrua']],
    desc: 'El gran felino que dominó los montes orientales. Se lo creía extinto, pero su mente aún recorre el país.' },
  { key: 'ombu', name: 'Ombú', types: ['planta', 'psiquico'], base: [100, 100, 100, 100, 100, 100], plan: 'bloom', c1: '#3a6a3a', c2: '#7a5a38', c3: '#f2e8b0', feats: ['tree'], size: 1.35, mythic: true,
    learn: [[1, 'absorber'], [1, 'confusion'], [30, 'megaagotar'], [40, 'tormenta_ceibo'], [50, 'psiquico'], [60, 'meditacion']],
    desc: 'Dicen que el ombú original aún crece solitario en la pampa y que toda criatura descendió de su sombra.' },
];
