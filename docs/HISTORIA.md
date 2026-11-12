# Poke Uruguay: la historia completa

> **Documento vivo.** Es la fuente de consulta de la historia. Cada cambio de historia (jefes, orden de ciudades, diálogos clave, eventos, misiones, MT, objetos de historia) debe actualizar este archivo **en el mismo PR**. Ver `CLAUDE.md`.
> Última actualización: 2026-11-12 (v213).

## Dónde está cada cosa en el código

| Qué | Archivo |
|---|---|
| Orden de ciudades, localidades, rutas y niveles | `src/data/route.ts` (`STOPS`, `badgeOf`, `stopBand`, `gymAce`) |
| Líderes, Alto Mando, Campeón, jefes y guiones | `src/data/story.ts` (`LEADERS`, `ELITES`, `CHAMPION`, `EVENTS`, `GATE_STORY`, `SCRIPTS`) |
| Misiones de edificios tomados por el PP | `src/data/story.ts` `EVENTS` + salas en `maps-act2.ts` (`eventRoom`) |
| Historias y personajes de rutas | `route-stories.ts`, `route-folk.ts`, `route-flavor.ts`, `maps-route.ts` |
| Favores entre pueblos | `favors.ts` |
| Mini historias (cadenas de eventos) | `mini-stories.ts` |
| Eventos opcionales (quiz, payada, concurso de bichos) | `events.ts` |
| Amistad con Ramón | `amistad.ts` |
| Huevo | `egg.ts` |
| Medidor de Niebla (plantas del PP) | `toxicity.ts` (`PP_PLANTS`, total 85 puntos + 15 de máquinas sueltas) |
| Habla regional | `regional-speech.ts`, `docs/habla-regional.md` |
| Nombres de entrenadores | `trainer-names.ts` |

Notas de lectura: los campos `order` y `badge` dentro de `LEADERS` son heredados. **Manda el orden de `STOPS`** (la medalla N es la del N-ésimo gimnasio de la ruta).

## Premisa

- El **Maestro Tabárez** (ex director técnico, hoy estudia las criaturas del Uruguay) tiene su laboratorio en Carmelo. Su sobrino y tu rival es **Facu**.
- El **Cardenal Azul** (especie `pamperon`) trae el viento **pampero**: cuando cruza el país el cielo se limpia y la niebla se va.
- Tabárez y el **Dr. Díaz** estudiaron años ese ciclo en el Observatorio del Cerro (Piriápolis): el **Proyecto Pampero**. Díaz quiso vender el clima (si el Cardenal no vuela, la niebla se queda y se cobra), Tabárez se negó y Díaz se fue. De ahí nace el **Equipo PP**.
- El PP vende niebla artificial, controla máquinas de niebla y plantas (frigorífico, represa, torres, fábricas) y se apoderó de edificios clave.
- El compañero inicial del jugador nació en el laboratorio durante el proyecto: guarda un eco del ciclo del viento, por eso el PP lo persigue (Tabárez lo confiesa en Fray Bentos).
- La historia es lineal, con pequeñas decisiones de niebla (`fog1` a `fog3`) que solo cambian una línea del final. Facu nunca se une al PP.
- Reglas de redacción: español rioplatense neutro, tono serio, sin diminutivos; los líderes son jefes de organismos del Estado o figuras históricas de la ciudad; nunca el nombre real de una persona viva en su cargo actual (solo el cargo con nombre de pila).

## Equipo PP

| Personaje | Rol | Dónde | Notas |
|---|---|---|---|
| **Bruma** | Administradora | Frigorífico Anglo (Fray Bentos), Torre de Niebla (Rivera), Cabo Polonio | Tres combates |
| **Garúa** | Comandante | Represa (Salto), Fábrica de Minas | Dos combates |
| **Brumario** | Jefe del este | Quebrada de los Cuervos (Treinta y Tres) | Tiene al Cardenal Azul entre dos máquinas de niebla |
| **Almada** | Investigador, ex alumno de Tabárez | Observatorio del Cerro (Piriápolis) | Deja el PP al perder y lleva el registro a Tabárez |
| **Dr. Díaz** | Fundador | Montevideo (puerto) | Jefe final del PP; requiere las 12 medallas |
| Capataces (Ferreira, Rondeau, Bianchi, Cáceres, Vidal) | Jefes de edificio | Refinería, Parrilla, Aduana, Radio, Muelle | Ver misiones |

## Recorrido por ciudades (orden de `STOPS`)

Cada pareja de ciudades tiene una localidad en medio. Las ciudades sin gimnasio cierran el camino con una persona (`GATE_STORY`) que se va cuando se cumple su condición.

1. **Carmelo.** Inicio. Tu madre te manda con Tabárez. Hablás con él antes de elegir; elegís inicial entre tres Pokeballs y el rival toma la suya caminando y elige la que le gana a la tuya (Fuego → Agua, Agua → Planta, Planta → Fuego).
2. **Colonia del Sacramento.** Hay que traerle a Tabárez la carta del almacén. A cambio: PokeDex y 5 Pokeballs. Una vecina cierra la Ruta 1 hasta tener la PokeDex.
3. **Rosario** (localidad). Caña de pescar. En Bosque Grande hay una revancha corta con el rival.
4. **San José de Mayo.** Un recluta del PP se lleva el alambre de la intendencia; se lo vence y se abre el camino.
5. **Ecilda Paullier** (localidad).
6. **Trinidad. Gimnasio 1.** Elena, Instituto de Colonización, **Tierra**. Tras la medalla, el ayudante **Gonzalo** entrega el **Huevo**, que eclosiona a los 1000 pasos en Gato Pajero Nv8.
7. **Palmitas** (localidad). Cueva donde Marta, del Correo, está retenida por dos reclutas.
8. **Mercedes. Gimnasio 2.** Marta, Correo Uruguayo, **Normal**. Cerrado hasta liberarla.
9. **Villa Soriano** (localidad).
10. **Fray Bentos. Gimnasio 3.** Zoraida, Museo del Anglo, **Siniestro**. Antes, en el Frigorífico Anglo, Bruma defiende las máquinas; Tabárez llega, confiesa el origen del compañero y entrega el **Medidor de Niebla** (flag `anglo_pp`). Un obrero neutral del Anglo da el Ticket del Buquebus.
11. **Young** (localidad) y **Paysandú.** Misión del **Muelle** (Vidal, MT Bomba Lodo). Caña Vieja en el muelle, Súper Caña en una casa.
12. **Termas de Guaviyú** (localidad) y **Salto. Gimnasio 4.** Horacio Quiroga, **Psíquico**. Misión de la **Radio** (Cáceres, MT Psíquico) y la **Represa** (Garúa, flag `represa_clear`). Mini historia El cuaderno de Quiroga.
13. **Belén** (localidad) y **Artigas.** Un minero pide echar a un recluta que se lleva geodas. Mini historia La canoa del Cuareim (Surf).
14. **Tranqueras** (localidad) y **Rivera. Gimnasio 5.** Mariela, Ministra de Defensa, **Lucha**. Hay que apagar la **Torre de Niebla** (Bruma). Misión de la **Aduana** (Bianchi, MT Puño Gaucho). Mi Zoo (safari).
15. **Paso del Río Tacuarembó** (localidad) y **Tacuarembó. Gimnasio 6.** Ramón, Ministro de Ganadería, **Planta**; lo conociste antes sin saber quién era (`amistad.ts`). Bicicleta y ciclovía. Misión de la **Parrilla** (Rondeau, MT Parrillada). Mini historia El potro del domador (Fuerza). **Fiesta de la Patria Gaucha** (`fiesta.ts`): empieza la primera vez que entrás al pueblo y dura dos días del reloj; el campo al noreste se vuelve predio con sortija, jineteada y taba (premios sin MT ni equipables) y regalo de un Criollo; al terminar el segundo día se desarma para siempre.
16. **Tupambaé** (localidad) y **Melo.** En la **Torre de las Ánimas** el Ánima del Sereno (`anima_clear`, MT Triturar) abre el camino.
17. **Arbolito** (localidad) y **Treinta y Tres. Gimnasio 7.** Juan A. Lavalleja, **Roca**. Al este está la **Quebrada de los Cuervos** (mapa propio, pide la medalla): el ayudante **Martín** sube detrás del jugador; **Brumario** custodia al Cardenal Azul; al vencerlo el Cardenal se va, Tabárez llega, cuenta la historia completa y entrega la **Pluma Azul** (`quebrada_clear`). El Cardenal se captura después de la Liga.
18. **Lascano** (localidad) y **Rocha.** La laguna está cubierta de niebla; un recluta vigila el camino a La Paloma.
19. **La Paloma** (localidad, Guardería) y **Cabo Polonio.** Bruma robó la lámpara del faro; al vencerla se devuelve y el farero da el **Farol** (Destello).
20. **Maldonado. Gimnasio 8.** Lucía, OSE, **Agua**. Casino Peninsula (las fichas nunca vuelven a dinero; las tragamonedas son un minijuego sin texto dentro de la máquina, con 1, 3 o 5 líneas: filas y diagonales; música de salón suave).
    - Identidad de la ciudad: Casapueblo (terrazas blancas con arcos, cartel) en la esquina noroeste, faro rojo y blanco en la punta este, sombrillas en la playa y vecinos que comentan Casapueblo, el faro, la Mano y los lobos marinos.
    - **Canal de Gorriti (opcional, solo con la Canoa).** El mar de Maldonado está cerrado con rocas y agua profunda: la única ruta navegable es un hueco en el muro sur de la ciudad (entre boyas rojas), que abre un canal marcado de más de 240 casillas, con mar profundo y arrecifes a los lados, tres bancos de arena con objetos y nueve nadadores que suben de nivel hacia la isla. Un cartel en la playa y dos vecinos lo anuncian. Termina en **Isla Gorriti**: ruinas del Fortín de San Fernando, lobos marinos, dos entrenadores (Arqueólogo y Guardaparque), un guardaparque que cuenta del canto en el agua y tres objetos. La legendaria Ballenaplata sigue en Maldonado (post-campeón); la cueva de la isla queda para más adelante.
21. **Piriápolis** (localidad). **Observatorio del Cerro**: Almada (`obs_clear`, MT Terremoto).
22. **Minas.** **Fábrica**: Garúa (`pp_clear`, MT Vendaval). Decisión de niebla `fog3`.
23. **Casupá** (localidad) y **Florida. Gimnasio 9.** Juan M. Boiso Lanza, **Volador**. Tras la medalla Boiso regala el **Silbato del Hornero** (MO Vuelo, flag `got_vuelo`).
24. **Sarandí Grande** (localidad) y **Durazno. Gimnasio 10.** Candelaria, ANCAP, **Fuego**: el gimnasio, los entrenadores y los salvajes de la zona volcánica son todos de Fuego. Cerrado hasta liberar el **Depósito de la refinería** (Ferreira, MT Descarga). Los edificios tomados por el PP tienen fachada propia.
25. **San Ramón** (localidad) y **Canelones. Gimnasio 11.** Tomás, INAVI, **Bicho**. Concurso de Bichos; mini historia La vendimia (Tomás está en San Ramón, espantando tres enjambres, hasta que se despejan las parras). El gimnasio es un viñedo laberinto y hábitat de insectos (setos con uvas, flores y telarañas, colmenas, hongos gigantes, árboles); sus entrenadores usan solo criaturas de tipo Bicho.
26. **Las Piedras** (localidad; la ruta hacia Montevideo es el Camino Maldonado, cueva de tres veteranos y guardia de la Liga) y **Montevideo. Gimnasio 12.** Sofía, UTE, **Eléctrico**, en el Palacio de la Luz. El puerto queda cerrado por la Torre del puerto del PP (ver Final). Montevideo es la ciudad más grande del juego (64x42): se entra por el oeste, desde el Camino Maldonado, a través del Parque Batlle (Estadio Centenario con la Torre de los Homenajes); la Avenida Italia y el Bulevar Artigas bajan a 18 de Julio (Shopping, Policlínica, Palacio de la Luz) y a la Rambla con la playa Pocitos y su muelle. En el centro, la Plaza Independencia (monumento y mausoleo de Artigas, Palacio Salvo, Teatro Solís) y la Puerta de la Ciudadela, que lleva a la Ciudad Vieja: Mercado del Puerto, Plaza Matriz, el muelle con el Buquebus amarrado y la Torre del puerto. Del otro lado de la bahía se ve el Cerro con su fortaleza.

### Buquebus China Zorrilla

El Ticket del Buquebus llega de la mano del obrero del Anglo. En el barco (Terminal de Montevideo) se pelea con Facu en cubierta; el capitán, mareado, pide un **Mate** y a cambio entrega el **Machete**. Después el barco zarpa para no volver (`ferry_done`).

### Final

1. Con las 12 medallas y la Fábrica de Minas liberada (`pp_clear`), en Montevideo se abre la **Torre del puerto** (sede del PP, 3 pisos: `sede_1`, `sede_2`, `sede_3` en `maps-act2.ts`). Piso 1: **Bruma** (flag `ev_sede_1`). Piso 2: **Brumario** y **Garúa** en dos tandas (`ev_sede_2a`, `ev_sede_2`). Cúpula: **Dr. Díaz**; aparecen caminando Facu, Tabárez y el Cardenal Azul, y se apaga la niebla (flag `anglo_clear`, el Medidor baja a 0 %). Hasta entonces el Estadio Centenario está cerrado y la gente de Montevideo lo explica.
2. **Liga en el Estadio Centenario:** Estela (aire), Teófilo (roca y tierra), Dolores (veneno y bicho), Federico (lucha y normal), duelo final con Facu y el Campeón **Obdulio** (con revancha).
3. Epílogo: semanas después, en Carmelo, se hablan de legendarias (viento helado en la Quebrada, un canto en Maldonado). Quedan las legendarias, las revanchas y el Cardenal Azul.

## Misiones de edificios tomados por el PP

| Edificio | Ciudad | Jefe | MT | Flag |
|---|---|---|---|---|
| Depósito de la refinería | Durazno | Capataz Ferreira | Descarga | `refineria_clear` |
| Parrilla de la Patria Gaucha | Tacuarembó | Capataz Rondeau | Parrillada | `parrilla_clear` |
| Aduana | Rivera | Inspector Bianchi | Puño Gaucho | `aduana_clear` |
| Radio | Salto | Locutora Cáceres | Psíquico | `radio_clear` |
| Muelle | Paysandú | Contramaestre Vidal | Bomba Lodo | `muelle_clear` (abre `open_paysandu`) |

Los reclutas desaparecen al ser vencidos y entonces aparece el jefe. Cada jefe suelta además un objeto equipable.

## Medidor de Niebla (PP_PLANTS)

Anglo 6, Muelle 4, Represa 10, Radio 3, Torre 8, Aduana 3, Parrilla 3, Ánimas 5, Quebrada 8, Laguna de Rocha 3, Cabo Polonio 6, Observatorio 4, Fábrica de Minas 10, Refinería 5, Dr. Díaz 7 (suman 85), más 15 de máquinas sueltas. Una planta nueva del PP agrega aquí su flag y su peso, manteniendo el total en 85.

## Sistemas de apoyo a la historia

- **Atracciones opcionales y su pista:** Mi Zoo (Safari, Rivera), Vuelo (Boiso, Florida), Concurso de Bichos (Canelones), Torre de las Ánimas (Melo), premios del Casino (Maldonado). Un vecino errante en cada ciudad lo comenta (`ATTRACTIONS` en `rumors.ts`).
- **Mates:** Té Marcela 20 PS, Mate 50, Mate dulce 200, Dulce de leche restaura todo.
- **Medallas:** doce, numeradas por orden de ruta (`badgeOf`). Habilitan MO: Corte/Machete, Surf/Canoa, Fuerza/Guantes, Destello/Farol, Vuelo/Silbato.
- **MT:** solo como recompensa de misiones, eventos y líderes (nunca sueltas ni regalos de NPC).
- **Equipables:** solo de jefes del PP, torres y grandes eventos; no se venden.
- **Tipos y naturalezas:** 14 tipos (incluye Acero) y 25 naturalezas (`types.ts`, `natures.ts`).
- **Rival Facu:** Bosque Grande, Buquebus, Lascano, Sarandí Grande (rumbo a Durazno) y Centenario. Nunca se une al PP.
- **Pistas:** quienes bloquean un camino solo describen la situación, nunca dicen qué hacer; las pistas son parciales y repartidas.
- **Favores entre pueblos:** 13 cadenas (faro, queso, radio, carta, cosecha, frontera, cuchilla, cerro, laguna, cerro_mina, sierra, costa, ciudad). No tocan la historia del PP.
- **Eventos de ciudad (opcionales, una vez):** examen del casco histórico (Colonia), payada (San José), torneo (Mercedes), tesoro del marinero (Rocha), trueques, adivinos, carrera de la Ciclovía, concurso de bichos (Canelones) y **la llamada de candombe** (Montevideo): al director de la cuerda del Barrio Sur, junto a la Rambla, le faltan el repique (en la playa Pocitos) y el piano (en el Parque Batlle); avisados, cada tamborilero se va caminando y aparece junto a él; con los tres tambores la cuerda toca y regala 2 Chivitos y 3 Ultraballs (flags `ev_candombe_ok`, `ev_candombe_rep`, `ev_candombe_pia`, `ev_candombe`).
- **Mini historias:** cadenas de eventos en una ciudad y sus alrededores para conseguir un objeto o abrir un camino, sin acertijos (La soga del escalador, El cuaderno de Quiroga, La canoa del Cuareim, Las bicicletas que no llegan, El potro del domador, La vendimia, entre otras).
- **Rutas:** cada ruta conserva una o dos piezas entre compuerta, acertijo, palanca y máquina de niebla; las máquinas de niebla deben bloquear de verdad el camino.

## Pendiente conocido

- Equilibrio de niveles y estadísticas.
- Más contenido de historia y rutas con diseño verdaderamente único.
- Contenido de Rivera por reubicar y localidades dentro de ciudades.
