# Cambios de la noche del 5 al 6 de noviembre (rama `escenarios`)

Objetivo: acercar el juego a la sensación de Pokémon de GBA/DS. Todo es opcional o aditivo; el terreno Clásico sigue por defecto y no se tocó ningún dibujo hecho a mano.

## Sonido (efectos)
- Efectos con ondas de pulso más suaves, filtro pasa-bajos y un eco corto (bus de audio común).
- Un sonido por estilo de ataque (fuego, rayo, olas, terremoto, hojas, rocas, burbujas, anillos, sombra, enjambre), carga previa, golpe físico, proyectil y estado.
- Golpe crítico, grito propio de cada criatura (al aparecer, al salir, al debilitarse y al elegirla en la PokeDex), alarma de PS bajos, cuenta de EXP, huida.
- Mundo: pasto, salto de cornisa, empujar roca, machete, pesca (lanzar y picada), PC, timbre de bici, chapoteo de canoa, guardar partida.
- Fanfarrias al recibir un objeto, un objeto clave y una medalla; fanfarria de curación.
- Ambiente: lluvia, tormenta con truenos, viento, oleaje en playas, pájaros de día, grillos de noche, goteo en cuevas. Se apaga bajo techo y en combate (la lluvia sigue en combates al aire libre).
- Músicas: entrenador, rival, líder/jefe y tema corto cuando un entrenador te ve.

## Visual
- Transiciones de combate: persianas (salvajes), espiral (entrenadores), iris (líderes, jefes y rival).
- Salto de cornisa con arco, hojas al pisar pasto, pasto que tapa los pies al caminar, estela detrás de la canoa.
- Criatura acompañante que sigue al jugador (Opciones > Criatura acompañante).
- Máquina de curación con pokebolas que se encienden una a una.
- Evolución con rayos de luz y silueta blanca que pulsa.
- Opciones > Colores: Normales o Vivos.

## Historia y eventos
- Cinemáticas nuevas (se saltan con A/B): cabo liberado, Quebrada liberada (Cardenal Azul), torre de Rivera apagada, observatorio, represa encendida, Dr. Díaz derrotado (anglo), tres escenas con el rival (tras los duelos de la Quebrada, la ruta 24 y el final) y la victoria en la Liga.
- Vecinos de una ciudad comentan la medalla del gimnasio local y, con la Liga ganada, el campeonato.

## Para probar
Build de prueba: https://claude.ai/artifact/2zfqDzHATgnsotgnGred7p

## Más
- Día y noche cambian las probabilidades de encuentros en pasto: de noche salen más Siniestro, Veneno y Psíquico, de día más Volador, Planta y Normal. Nadie desaparece de la lista de una zona.
- Espuma animada en todas las orillas; vecinos quietos que miran alrededor y se giran hacia vos; sonidos de estados alterados.
- Test de referencias cruzadas (`tests/check-maps.mjs`): scripts, músicas, objetos, especies y cinemáticas que se nombran tienen que existir.
