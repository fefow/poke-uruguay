/**
 * What people outdoors say at night. By day every NPC says its own lines; once it gets dark (the in-game clock, see
 * nightLevel) the townsfolk on streets and routes switch to these, so nobody talks about the beach being full or the
 * sun on the rocks at midnight. People inside buildings keep a single set of lines.
 *
 * NIGHT_TALK: the NPC's first day line -> its whole night dialogue. Every clue or puzzle hint of the day version is kept
 *   (a player who only walks around at night must not lose information).
 * NIGHT_POOL: night lines for any outdoor NPC without an entry (added later in the map editor, or rewritten).
 * NIGHT_SWAP: single lines said by anyone outdoors (trainers, animals, scripts) that only make sense by day.
 */

export const NIGHT_TALK: Record<string, string[]> = {
  "Los turistas vienen desde Buenos Aires en lancha, a ver los astilleros.":
    ["A esta hora ya no queda ningún turista. Las lanchas duermen amarradas frente a los astilleros.",
     "Con la luna, el río parece todavía más ancho que de día."],
  "Cuando yo era joven, había Ceibos en todas las orillas.":
    ["De noche me siento acá a escuchar el río. Antes había Ceibos en todas las orillas.",
     "Ahora casi solo los cuida el Maestro Tabárez."],
  "¿Vas al laboratorio? Hoy entregan criaturas.":
    ["¿Vas al laboratorio a esta hora? El Maestro Tabárez sigue con la luz prendida.",
     "Hoy entregaba criaturas. Capaz que todavía te espera."],
  "Buen compañero te tocó. Cuidalo.":
    ["Ya es tarde para andar por los pastizales con un compañero nuevo.",
     "Si se debilita, volvé a tu casa: tu madre deja el mate listo hasta de noche."],
  "Hola.":
    ["Buenas noches."],
  "Buen día.":
    ["Buenas noches. Cuidado por la ruta, que no hay luz.",
     "Si tus criaturas están debilitadas, en Montevideo está la Policlínica. Atiende a toda hora."],
  "Bienvenido a Montevideo.":
    ["Bienvenido a Montevideo. De noche la ciudad no se apaga.",
     "Por la Avenida Italia llegás al Bulevar Artigas, que baja derecho hasta 18 de Julio y la Rambla. La Policlínica queda sobre 18 de Julio y atiende toda la noche."],
  "El Centenario se construyó para el primer Mundial, en 1930. Y la copa se quedó acá.":
    ["De noche prenden los focos del Centenario y se ve desde medio barrio.",
     "El primer Mundial se jugó acá, en 1930. La torre de arriba es la Torre de los Homenajes."],
  "Los días de clásico no se consigue lugar ni en el ómnibus.":
    ["Hoy no hay partido y el estadio está a oscuras. Los días de clásico ni a esta hora se consigue ómnibus.",
     "Dicen que la Liga se juega adentro. Solo entran los que juntaron las doce medallas."],
  "Doy la vuelta al Parque Batlle todas las mañanas. Los eucaliptos dan sombra todo el año.":
    ["De noche el Parque Batlle queda en silencio. Yo prefiero dar la vuelta temprano.",
     "Bajo los eucaliptos se oyen las lechuzas."],
  "El Palacio Salvo fue el edificio más alto de Sudamérica.":
    ["De noche el Palacio Salvo tiene las ventanas prendidas como un barco.",
     "Adentro trabaja gente que sabe mucho de criaturas. Algunos se quedan hasta tarde."],
  "El gimnasio de Montevideo es el Palacio de la Luz, la sede de UTE.":
    ["El Palacio de la Luz no se apaga nunca: es la sede de UTE.",
     "La presidenta, Sofía, usa criaturas de tipo Eléctrico. Las de Tierra no reciben su electricidad."],
  "Ese es el Buquebus de la carrera a Buenos Aires. La terminal de acá está cerrada por reformas.":
    ["El Buquebus de la carrera a Buenos Aires pasa la noche amarrado. La terminal de acá está cerrada por reformas.",
     "Los barcos a Buenos Aires salen desde Colonia del Sacramento."],
  "¿Qué hacés, bo? En la Rambla la gente toma mate y mira el río. Re tranqui.":
    ["¿Qué hacés, bo? De noche la Rambla es otra: se ven las luces del Cerro reflejadas en el agua.",
     "El río de día parece marrón. A esta hora es negro y se escucha más de lo que se ve."],
  "Todas las tardes bajo a la Rambla con el termo. El atardecer sobre el río no se paga.":
    ["El termo ya está vacío. Me quedé mirando las luces de los barcos.",
     "La Rambla de noche tiene un viento que te despeja la cabeza."],
  "Desde la punta del muelle salen pejerreyes cuando sopla del sur.":
    ["De noche salen pejerreyes de la punta del muelle, si sabés esperar.",
     "Con una buena caña y una linterna, hasta una anguila."],
  "En verano en la playa Pocitos no queda un metro libre. Hoy se puede caminar.":
    ["La playa Pocitos de noche es para caminar con los zapatos en la mano.",
     "Se oye el agua y nada más."],
  "Pedaleo la Rambla de punta a punta. A la ida, viento a favor; a la vuelta, en contra. Siempre.":
    ["Pedaleo la Rambla de noche porque no hay nadie. A la ida, viento a favor; a la vuelta, en contra. Siempre."],
  "Esta noche hay función en el Teatro Solís. Tiene más de ciento cincuenta años y la sala se sigue llenando.":
    ["Ya terminó la función en el Teatro Solís. La gente sale despacio, comentando.",
     "Tiene más de ciento cincuenta años y la sala se sigue llenando."],
  "Bajo el monumento a Artigas está su mausoleo. Hay guardia de honor día y noche.":
    ["La guardia de honor sigue firme al lado del mausoleo de Artigas, también a esta hora.",
     "La puerta de piedra del oeste es lo que queda de la Ciudadela, la muralla de la ciudad colonial."],
  "Saqué cien fotos del Palacio Salvo y en ninguna entra entero.":
    ["Saqué cien fotos del Palacio Salvo iluminado y en ninguna entra entero."],
  "Del otro lado de la puerta empieza la Ciudad Vieja. Los fines de semana la peatonal se llena de artesanos y músicos.":
    ["Del otro lado de la puerta empieza la Ciudad Vieja. De noche los bares de la peatonal quedan abiertos hasta tarde."],
  "En el Mercado del Puerto la parrilla no se apaga nunca. Pasá con hambre.":
    ["En el Mercado del Puerto ya bajaron las persianas, pero todavía huele a brasa.",
     "Mañana al mediodía vuelve a estar lleno."],
  "Pedí un chivito y me trajeron comida para tres.":
    ["Salí a cenar un chivito y me trajeron comida para tres. No sé cómo voy a dormir."],
  "La fuente de la Plaza Matriz tiene más monedas que agua.":
    ["De noche la fuente de la Plaza Matriz brilla con todas las monedas del fondo."],
  "Los contenedores bajan de los barcos y suben a los camiones. En el puerto no se para nunca.":
    ["En el puerto trabajan toda la noche. Los contenedores no esperan a nadie."],
  "La torre del puerto está cerrada y la antena de la cima no para de emitir. Nadie entiende de dónde sale tanta energía.":
    ["De noche se ve la luz de la antena de la torre del puerto, parpadeando. Nadie entiende de dónde sale tanta energía."],
  "El repique conversa con el chico y con el piano. Por eso se llama así: repica.":
    ["De noche los tambores se oyen desde lejos. El repique conversa con el chico y con el piano."],
  "Ya estamos todos. El piano manda el paso.":
    ["Ya estamos todos. De noche la cuerda suena mejor. El piano manda el paso."],
  "Esa niebla no es natural. Unos hombres de gris la generan con máquinas.":
    ["De noche la niebla baja más espesa. Unos hombres de gris la generan con máquinas.",
     "Se hacen llamar Equipo PP."],
  "La Mano es una escultura de dedos que emergen de la arena.":
    ["De noche la Mano parece salir de la arena para agarrar algo.",
     "Igual es un recordatorio: la playa Brava es peligrosa, y más a oscuras."],
  "Desde el puerto se ve la Isla de Lobos.":
    ["De noche, desde el puerto, se ve el faro de la Isla de Lobos.",
     "En invierno a veces se oye el canto de una ballena desde la costa."],
  "El gimnasio de acá es la planta potabilizadora de OSE. Su presidenta, Lucía, usa tipo Agua.":
    ["La planta potabilizadora de OSE trabaja toda la noche. Es el gimnasio de acá.",
     "Su presidenta, Lucía, usa tipo Agua. Planta y Eléctrico le hacen daño."],
  "Maldonado tiene la Mano más fotografiada del país.":
    ["De noche los turistas se van al casino. La Mano queda sola.",
     "En la temporada los precios suben más que la marea."],
  "Mi hijo salió a entrenar y todavía no volvió.":
    ["Ya es de noche y mi hijo sigue afuera entrenando.",
     "Le dejé la luz de la puerta prendida para que encuentre el camino."],
  "Con este calor, lo que más apetece es un chivito en la playa.":
    ["Ya refrescó. Ahora lo que apetece es un chivito caliente frente al mar."],
  "Casapueblo parece una escultura. Dicen que se fue agrandando durante décadas, sin planos.":
    ["De noche Casapueblo se ilumina entera, como una escultura de luz.",
     "Dicen que se fue agrandando durante décadas, sin planos."],
  "El faro de Punta del Este guía a los barcos desde hace más de un siglo y medio.":
    ["De noche se entiende para qué está el faro de Punta del Este: guía a los barcos desde hace más de un siglo y medio.",
     "Contá: la luz da una vuelta completa cada pocos segundos."],
  "Pasando las boyas rojas empieza el camino largo hasta Isla Gorriti.":
    ["Pasando las boyas rojas empieza el camino largo hasta Isla Gorriti. Las boyas tienen una luz chica para la noche.",
     "Fuera del canal el mar es muy hondo y las rocas asoman. No te salgas."],
  "En el puerto los lobos marinos esperan los restos de pescado. Son parte del paisaje.":
    ["De noche los lobos marinos duermen amontonados en el muelle. Roncan fuerte.",
     "Para ir a Gorriti hace falta canoa y mucha paciencia: el canal tiene varios nadadores."],
  "¡En Maldonado hay una mano gigante saliendo de la arena! Los turistas se sacan fotos todo el día.":
    ["¡En Maldonado hay una mano gigante saliendo de la arena! De noche da un poco de miedo."],
  "El camino a Piriápolis lo cerraron sin aviso y los guardias no dicen quién dio la orden.":
    ["El camino a Piriápolis sigue cerrado, también de noche. Los guardias no dicen quién dio la orden."],
  "En el gimnasio del agua dicen que la Liga abre los caminos a quien sabe moverse en aguas turbias.":
    ["En el gimnasio del agua dicen que la Liga abre los caminos a quien sabe moverse en aguas turbias. Y de noche todas las aguas son turbias."],
  "Del otro lado del casino hay premios que no se ven en ninguna tienda: criaturas raras para quien junta fichas.":
    ["El casino no cierra de noche. Hay premios que no se ven en ninguna tienda: criaturas raras para quien junta fichas."],
  "El Equipo PP se llevó la lámpara del faro.":
    ["Mirá el faro: está apagado. El Equipo PP se llevó la lámpara.",
     "Sin luz, esta noche los barcos pueden chocar contra las rocas."],
  "Acá no hay red eléctrica ni calles asfaltadas.":
    ["Acá no hay red eléctrica ni calles asfaltadas. De noche se vive con velas.",
     "Los lobos marinos duermen sobre las rocas. Se los oye respirar."],
  "Las dunas se mueven con el viento. El pueblo entero cambia cada año.":
    ["De noche el viento sigue moviendo las dunas. Mañana el pueblo va a estar un poco distinto."],
  "Vine a devolver lo que debía. El farero todavía no me habla, pero me deja limpiar la lámpara.":
    ["Vine a devolver lo que debía. A esta hora limpio la lámpara del faro.",
     "Díaz me dijo que cuidábamos el clima, y le creí porque quería creerle.",
     "Hay noches en que el Cardenal Azul pasa por arriba del faro. Con eso me alcanza."],
  "Cuando sopla el pampero, el cielo queda despejado.":
    ["Cuando sopla el pampero de noche, se ven todas las estrellas.",
     "Dicen que lo trae una criatura enorme con alas de tormenta."],
  "En el fondo de la quebrada hay un arroyo.":
    ["De noche se oye el arroyo del fondo de la quebrada desde acá.",
     "Los cuervos de cabeza roja duermen en los paredones."],
  "¿Tú sabes por qué la ciudad se llama Treinta y Tres? Por los 33 Orientales, claro.":
    ["¿Tú sabes por qué la ciudad se llama Treinta y Tres? Por los 33 Orientales, claro.",
     "De noche el Olimar suena más fuerte. Tú quédate un rato y vas a escucharlo."],
  "Cerca de acá hay quebradas y cascadas en medio de las sierras.":
    ["De noche las sierras se ven como sombras grandes. Ahí atrás hay quebradas y cascadas.",
     "Treinta y Tres se llama así por los Treinta y Tres Orientales, y a mucha honra."],
  "Treinta y Tres se llama así por los Treinta y Tres Orientales, y a mucha honra.":
    ["A esta hora los arrozales reflejan la luna como espejos.",
     "Treinta y Tres se llama así por los Treinta y Tres Orientales, y a mucha honra."],
  "Acá se toma mate hasta en la fila del banco.":
    ["De noche los carpinchos salen a comer al borde del agua.",
     "Si ves unos ojos brillando en el pasto, quedate quieto: seguro es uno de ellos."],
  "Cada noche bajan camiones grises hacia Lascano. Nadie los frena.":
    ["Ya están por pasar. Cada noche bajan camiones grises hacia Lascano. Nadie los frena."],
  "En el gimnasio de roca dicen que Lavalleja jamás dejaría pasar a un cobarde. Su gente piensa igual.":
    ["De noche el gimnasio de roca queda en silencio. Dicen que Lavalleja jamás dejaría pasar a un cobarde. Su gente piensa igual."],
  "Por el fondo de la quebrada corre el arroyo Yerbal.":
    ["De noche solo se oye el arroyo Yerbal, allá en el fondo.",
     "Los cuervos de cabeza roja anidan en los paredones. Este año casi no se ven."],
  "Un pájaro azul enorme, quieto entre dos máquinas.":
    ["Un pájaro azul enorme, quieto entre dos máquinas. Sus chispas iluminan la niebla.",
     "La niebla le pesa en las alas. No puede levantar vuelo."],
  "Una máquina de niebla del PP. Larga un humo gris hacia el pájaro.":
    ["Una máquina de niebla del PP. Una luz roja parpadea en el costado. Larga un humo gris hacia el pájaro."],
  "Rosario es un pueblo de paso, pero bien tranquilo.":
    ["De noche Rosario queda en silencio. Pasan pocos autos.",
     "Si te cansás, el almacén abre temprano."],
  "Acá se cría ganado de todos los tipos. Cada criatura tiene su lugar en el campo.":
    ["A esta hora el ganado duerme. Cada criatura tiene su lugar en el campo, también de noche."],
  "Desde la cima del cerro se ve toda la costa.":
    ["De noche, desde la cima del cerro, se ven las luces de toda la costa.",
     "El mar acá es más calmo que en Maldonado."],
  "Mi abuelo dice que en el mar de Piriápolis se ven toninas en verano.":
    ["Mi abuelo dice que de noche, en verano, se oye a las toninas respirar cerca de la orilla."],
  "El faro de La Paloma guía a los barcos desde hace casi siglo y medio.":
    ["Mirá el faro de La Paloma: guía a los barcos desde hace casi siglo y medio. De noche se entiende para qué está."],
  "Más al este, en Cabo Polonio, no hay luz eléctrica.":
    ["Más al este, en Cabo Polonio, no hay luz eléctrica.",
     "A esta hora allá están todos a la luz de las velas."],
  "Minas es famosa por el agua de manantial y los cerros.":
    ["Esta noche hay luna sobre los cerros de Minas.",
     "Dicen que en las noches de luna llena aparece un felino enorme en las sierras. Yo no salgo."],
  "En la vieja fábrica del este se mueve gente de gris, y de noche se oyen máquinas.":
    ["¿Oís? Son las máquinas de la vieja fábrica del este. De noche no paran.",
     "Un zarzal tapa la entrada. Con un machete se podría pasar."],
  "Mi abuelo contaba que el yaguareté vivió por acá, antes de que se lo creyera extinto.":
    ["Mi abuelo contaba que de noche se oía al yaguareté en las sierras, antes de que se lo creyera extinto."],
  "Las sierras de Minas están llenas de arroyos y cerros para trepar.":
    ["De noche las sierras de Minas no son para trepar. Hay arroyos y barrancos por todos lados.",
     "Mejor esperar a la mañana."],
  "Los domingos hay fútbol en la canchita del barrio.":
    ["A esta hora la canchita del barrio queda a oscuras. Los domingos de tarde es otra cosa.",
     "Yo tomo el último mate antes de ir a dormir."],
  "El guardia de la salida es de esos que miden a la gente por cómo trata a sus criaturas.":
    ["El guardia de la salida sigue en su puesto, aunque sea de noche. Mide a la gente por cómo trata a sus criaturas."],
  "Dicen que acepta un combate amistoso y que después deja pasar. Pero no con cualquiera.":
    ["Dicen que acepta un combate amistoso a cualquier hora y que después deja pasar. Pero no con cualquiera."],
  "Estoy desarmando la fábrica pieza por pieza, con una orden del juzgado en el bolsillo.":
    ["Trabajo hasta tarde: estoy desarmando la fábrica pieza por pieza, con una orden del juzgado en el bolsillo.",
     "La armé yo, así que sé por dónde empezar.",
     "Seguí a Díaz porque sus números cerraban. Nunca me pregunté para quién."],
  "Esto es un parque, no un campo de batalla: acá se viene a ver y a atrapar criaturas.":
    ["De noche el parque cambia: salen otras criaturas. Acá se viene a ver y a atrapar, no a pelear.",
     "Fijate el tiempo que contrataste. Cuando suena la campana, los guardias te acompañan a la salida."],
  "Acá la gente trabaja con el fuego desde siempre.":
    ["Fijate cómo brilla el suelo de noche. Acá la gente trabaja con el fuego desde siempre.",
     "El gimnasio es la sede de ANCAP en Durazno. Su presidenta, Candelaria, domina el fuego."],
  "Hace décadas no llueve como antes. La ceniza lo cubre todo.":
    ["Ni de noche refresca. Hace décadas no llueve como antes y la ceniza lo cubre todo.",
     "Las criaturas de fuego se sienten cómodas acá."],
  "Cruzando el puente de hierro se llega al norte. Pero el camino está cortado por la gente de gris.":
    ["Cruzando el puente de hierro se llega al norte. De noche la gente de gris vigila el camino cortado con linternas."],
  "Buenas. ¿Usted ya vio el Yí? Pasa por el costado de la ciudad, mire qué lindo que es.":
    ["Buenas noches. ¿Usted oye el Yí? Pasa por el costado de la ciudad, mire qué tranquilo a esta hora.",
     "Y pa' la fiesta del folklore no queda un lugar libre. La pucha, cómo se llena."],
  "De la refinería sale un convoy cada noche, sin logo.":
    ["Ya va a salir. De la refinería sale un convoy cada noche, sin logo."],
  "La del gimnasio sabe mejor que nadie de qué viaja ahí. Dicen que quiere ver a alguien capaz antes de hablar.":
    ["La del gimnasio sabe mejor que nadie qué viaja en ese convoy. Dicen que quiere ver a alguien capaz antes de hablar."],
  "Bah, mire: en Tacuarembó la Patria Gaucha es cosa seria. Se prende el fogón y pa' qué le cuento.":
    ["Bah, mire: de noche en Tacuarembó se prende el fogón y pa' qué le cuento.",
     "Si a usted le gusta el campo, no se pierda la ronda de guitarras, tchê."],
  "Dicen que Gardel nació acá. Otros dicen que en Toulouse.":
    ["Esta noche alguien cantaba un tango de Gardel en la esquina. Dicen que nació acá. Otros dicen que en Toulouse.",
     "En Tacuarembó nadie se pone de acuerdo."],
  "La parrilla de la Patria Gaucha fue tomada por el Equipo PP. Hay reclutas adentro.":
    ["La parrilla de la Patria Gaucha sigue tomada por el Equipo PP. Los reclutas no duermen.",
     "Si los sacás, el dueño te va a agradecer."],
  "La parrilla vuelve a abrir. Se huele el asado hasta acá.":
    ["La parrilla trabaja hasta tarde. Se huele el asado hasta acá."],
  "Hay movimiento raro en el norte. Los camiones del Equipo PP no paran.":
    ["De noche se ven los faroles de los camiones del Equipo PP subiendo al norte. No paran."],
  "La Policlínica y el almacén están sobre la calle principal. Nunca se equivocan: siempre están en el mismo lugar.":
    ["La Policlínica está sobre la calle principal y atiende toda la noche. El almacén abre temprano."],
  "La Parrilla de la Patria Gaucha lleva días cerrada y nadie cuenta por qué.":
    ["La Parrilla de la Patria Gaucha lleva días cerrada. De noche se ve una luz adentro y nadie cuenta por qué."],
  "Dicen que el paso al sur lo cuida quien mejor conoce la tierra. Y esa es la del gimnasio.":
    ["Dicen que el paso al sur lo cuida quien mejor conoce la tierra, de día y de noche. Y esa es la del gimnasio."],
  "Bah, tchê. Acá en Rivera cruzás la calle y ya tá no Brasil.":
    ["Bah, tchê. De noche en Rivera la calle de la frontera queda toda iluminada, de un lado y del otro.",
     "Mi vó cerraba el negocio tarde, pra aprovechar a los que cruzaban. Tri negocio, barbaridade."],
  "La aduana fue tomada por gente de gris. Nadie puede cruzar a Brasil.":
    ["La aduana sigue tomada por gente de gris. Ni de noche dejan cruzar a Brasil.",
     "Si los desalojás, hay recompensa."],
  "La aduana funciona otra vez. Gracias.":
    ["La aduana atiende otra vez, hasta de noche. Gracias."],
  "La niebla de la Torre nos tiene sin sol desde hace días.":
    ["La niebla de la Torre tapa hasta la luna. Hace días que no vemos el cielo.",
     "La policía no puede entrar. Alguien tiene que subir."],
  "El sol volvió a Rivera. Gracias.":
    ["Esta noche se ven las estrellas en Rivera otra vez. Gracias."],
  "Rivera y Santana do Livramento son una sola ciudad con dos banderas.":
    ["De noche Rivera y Santana do Livramento se ven como una sola ciudad con dos banderas.",
     "En el centro se habla español, portugués y el mezclado de los dos, hasta tarde."],
  "En la frontera siempre hubo controles, pero esta semana pusieron más.":
    ["En la frontera siempre hubo controles, pero esta semana pusieron más. Y de noche, más todavía."],
  "El gimnasio militar forma a la gente que después da las órdenes en el camino.":
    ["En el gimnasio militar tocan silencio a las diez. Ahí se forma la gente que después da las órdenes en el camino."],
  "En Canelones, un día por semana hacen el concurso de atrapar bichos. Te dan unas bolas y tenés un rato para elegir el mejor.":
    ["En Canelones, un día por semana hacen el concurso de atrapar bichos. Mañana podés averiguar cuál."],
  "Che, con este calor salteño lo único que da ganas es meterse en las termas. Te arreglan el cuerpo y la cabeza.":
    ["Che, de noche las termas de Salto son lo mejor: el agua caliente con el aire fresco. Te arreglan el cuerpo y la cabeza.",
     "Y si tenés algo de tipo Siniestro, el líder lo va a sufrir, eh."],
  "Hace días que la radio de Salto no da el pronóstico real: la tomó el Equipo PP.":
    ["La radio de Salto sigue tomada por el Equipo PP. De noche pasan música y ningún pronóstico.",
     "Si volvés a poner al aire a la gente de siempre, te lo van a agradecer."],
  "La radio vuelve a dar el pronóstico de siempre.":
    ["Ya volvió el informativo de la noche a la radio. Como siempre."],
  "El gimnasio es un observatorio con techo de vidrio.":
    ["De noche el techo de vidrio del gimnasio se llena de estrellas. Es un observatorio.",
     "Horacio Quiroga escribía cuentos oscuros en Salto. Dicen que el líder adivina tus movimientos."],
  "La Represa está tomada. Si querés ayudar, la entrada está debajo del puente.":
    ["De noche la Represa está llena de luces. Está tomada. Si querés ayudar, la entrada está debajo del puente."],
  "Desde la represa dicen que el agua anda rara. Ya van tres noches de luces.":
    ["Mirá para la represa. Ya van tres noches de luces y el agua anda rara."],
  "El que manda en el gimnasio de acá decide, de hecho, a quién se le abre el camino al norte.":
    ["El que manda en el gimnasio de acá decide a quién se le abre el camino al norte. A esta hora ya cerró."],
  "En Rivera hay un zoológico donde se paga la entrada y se prueba suerte por un rato con las criaturas del campo.":
    ["En Rivera hay un zoológico donde se paga la entrada y se prueba suerte con las criaturas del campo. Dicen que de noche salen otras."],
  "El muelle largo del puerto lo tomó el Equipo PP. Por ahí entra el material de las torres de niebla.":
    ["De noche el muelle largo del puerto está lleno de faroles del Equipo PP. Por ahí entra el material de las torres de niebla.",
     "Está tomado de punta a punta: para llegar al capataz hay que recorrerlo entero, y nadie te va a dejar pasar."],
  "El muelle volvió a trabajar con normalidad.":
    ["El muelle volvió a trabajar con normalidad. Esta noche descargan un barco."],
  "El Puente Internacional une dos países. Yo lo crucé de chica.":
    ["De noche las luces del Puente Internacional se reflejan en el río. Yo lo crucé de chica.",
     "Después de la niebla, todo se ve distinto."],
  "Más al sur está Fray Bentos. Allí se construyó el frigorífico que cambió el mundo.":
    ["Más al sur está Fray Bentos. Dicen que de noche se prenden luces en el frigorífico.",
     "Antes cambió el mundo. Hoy lo usan para otra cosa."],
  "Bo, acá decimos que la cerveza artesanal más rica del litoral es sanducera. Y no se discute.":
    ["Bo, a esta hora se toma la cerveza artesanal sanducera, la más rica del litoral. Y no se discute.",
     "En verano, de noche, la gente sigue en la playa Park mirando el río."],
  "En Maldonado hay un casino con fichas. Dicen que los premios no se compran con plata.":
    ["En Maldonado hay un casino que no cierra de noche. Dicen que los premios no se compran con plata."],
  "El proximo campeonato lo gano yo!":
    ["Me quedo entrenando hasta tarde. ¡El próximo campeonato lo gano yo!"],
  "El Anglo tuvo su época de oro. Después quedó vacío.":
    ["Mirá el Anglo: tiene luces prendidas a esta hora. Tuvo su época de oro y después quedó vacío.",
     "Hace unas semanas volvieron a prender las luces."],
  "El gimnasio de acá es de tipo Veneno. Zoraida dirige el Centro Toxicológico y atiende llamadas a cualquier hora.":
    ["El gimnasio de acá es de tipo Veneno. Zoraida dirige el Centro Toxicológico y atiende llamadas toda la noche.",
     "Dicen que en el frigorífico se mueve gente de gris. Con cuidado."],
  "El frigorífico es propiedad privada.":
    ["El frigorífico es propiedad privada. Y de noche, más todavía."],
  "El río Uruguay se ve ancho desde la costanera.":
    ["De noche el río Uruguay se ve negro desde la costanera. Del otro lado brillan las luces de Argentina.",
     "Hay una fábrica vieja que dio de comer a medio pueblo."],
  "Hay una fábrica vieja que dio de comer a medio pueblo.":
    ["De noche la fábrica vieja parece más grande. Dio de comer a medio pueblo.",
     "Cuando baja el río aparecen playas de arena por todos lados."],
  "El capitán del Buquebus se descompone con solo mirar el agua. Por eso el barco no sale.":
    ["El capitán del Buquebus no duerme: se descompone con solo pensar en el agua. Por eso el barco no sale."],
  "Cuentan que al norte el monte se cerró de espinas y que solo algo muy filoso abre paso. El capitán tenía algo así.":
    ["De noche no se ve, pero al norte el monte se cerró de espinas. Cuentan que solo algo muy filoso abre paso, y que el capitán tenía algo así."],
  "Desde chico pesco bajo ese muelle. El río tiene humor propio.":
    ["De noche pican mejor bajo ese muelle. El río tiene humor propio.",
     "Hoy no vi a la gente de la boletería. Los del barco andan nerviosos y nadie me explica por qué."],
  "Trabajé treinta años en esa planta. Las cámaras de frío tienen el piso cubierto de hielo: si arrancás a patinar, no frenás hasta chocar con algo.":
    ["Trabajé treinta años en esa planta, muchas veces en el turno de la noche. Las cámaras de frío tienen el piso cubierto de hielo: si arrancás a patinar, no frenás hasta chocar con algo.",
     "Si entrás, no te enojes con el piso. Se aprende probando dónde te frenás."],
  "Junto latas viejas del Anglo. Dicen que algunas valen plata.":
    ["Junto latas viejas del Anglo con una linterna. Dicen que algunas valen plata.",
     "Una vez encontré una con el dibujo de un barco. ¿Será el mismo de la boletería?"],
  "Traigo carga de Young. Desde que cerraron la salida norte con el zarzal, tengo que dar la vuelta por la ruta.":
    ["Traigo carga de Young y llego de noche. Desde que cerraron la salida norte con el zarzal, tengo que dar la vuelta por la ruta.",
     "Alguien con una herramienta filosa lo arreglaría en un minuto."],
  "Colonia del Sacramento es Patrimonio de la Humanidad: calles empedradas, un faro y el río ancho como mar.":
    ["De noche Colonia del Sacramento tiene faroles en las calles empedradas, y el faro gira sobre el río.",
     "Desde el puerto salen los Buquebus hacia Buenos Aires."],
  "Desde el puerto salen los Buquebus hacia Buenos Aires.":
    ["El último Buquebus del día ya salió hacia Buenos Aires.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "En el puerto repartieron folletos: \"Niebla garantizada, 30 días, $4000 por zona\".":
    ["Encontré esto tirado en la calle, ya de noche: \"Niebla garantizada, 30 días, $4000 por zona\".",
     "Nadie sabe quién los imprime. Solo dice \"Proyecto Pampero\"."],
  "Del Barrio Histórico no se va nadie sin sacarse una foto en las calles de piedra.":
    ["De noche el Barrio Histórico es más lindo todavía, con los faroles en las calles de piedra.",
     "El faro se ve desde todo el casco viejo, de día y de noche."],
  "Al Maestro Tabárez le preocupa que alguien recorra el país sin saber lo que lleva. No suelta a nadie así nomás.":
    ["Al Maestro Tabárez le preocupa que alguien recorra el país sin saber lo que lleva. Seguro está despierto pensando en eso."],
  "En el almacén guardan una carta desde hace días. En el sobre dice «Para Tabárez».":
    ["En el almacén guardan una carta desde hace días. En el sobre dice «Para Tabárez». Mañana temprano abren."],
  "Dicen que en Rivera hay un parque donde se pueden atrapar criaturas raras con unas pocas Pokeballs, sin gastar las tuyas.":
    ["Dicen que en Rivera hay un parque donde se pueden atrapar criaturas raras con unas pocas Pokeballs, sin gastar las tuyas. De noche salen otras."],
  "San José de Mayo, capital de un departamento de tambos y chacras.":
    ["De noche San José de Mayo duerme temprano: en los tambos se ordeña de madrugada.",
     "Acá se hace la Fiesta de la Torta Frita, y nadie se queda con las ganas."],
  "Acá se hace la Fiesta de la Torta Frita, y nadie se queda con las ganas.":
    ["Una torta frita caliente es lo mejor para una noche fresca. Acá se hace su fiesta, y nadie se queda con las ganas.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "Del Cabildo salió un aviso: gente de gris anda ofreciendo \"niebla por contrato\" a los productores.":
    ["El aviso del Cabildo sigue pegado en la puerta: gente de gris anda ofreciendo \"niebla por contrato\" a los productores.",
     "Si seguís al oeste, en Trinidad y Mercedes vas a saber más. Yo no me fiaría de ellos."],
  "Mi cuñado cerró el campo con \"niebla contratada\". Dice que así no helaba.":
    ["Mi cuñado cerró el campo con \"niebla contratada\". De noche ni se ven las luces de su casa.",
     "Le salió un ojo de la cara y ahora no la puede cortar."],
  "Acá hay chacras y tambos en cada camino. La leche llega fresca a la mesa.":
    ["A esta hora en los tambos ya duermen: se ordeña antes del amanecer.",
     "En el teatro del centro hoy hubo función. Recién sale la gente."],
  "Faltó alambre en la intendencia y nadie vio quién se lo llevó. Anoche pasó un camión sin patente.":
    ["Faltó alambre en la intendencia y nadie vio quién se lo llevó. Anoche pasó un camión sin patente, a esta misma hora."],
  "Un empleado de la intendencia anda por la salida del pueblo con cara de pocos amigos. No habla con cualquiera.":
    ["Un empleado de la intendencia sigue por la salida del pueblo, aunque sea de noche. No habla con cualquiera."],
  "Ecilda Paullier vive del campo y de los viajeros que pasan por la ruta.":
    ["De noche por Ecilda Paullier pasan pocos viajeros. Se oye el campo.",
     "Mañana temprano, un mate en el almacén y seguís camino."],
  "Un mate en el almacén y seguís camino.":
    ["El almacén ya cerró. Abre temprano, para los que salen a la ruta.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Los camiones de gris pasan de noche con unas máquinas tapadas con lona.":
    ["Quedate quieto y vas a ver: los camiones de gris pasan de noche con unas máquinas tapadas con lona.",
     "Dicen que van a Palmitas. Si vas para allá, andá con cuidado."],
  "Trinidad queda en el centro del país. Dicen que desde acá todo queda cerca.":
    ["De noche Trinidad queda en silencio. Dicen que desde acá todo queda cerca.",
     "La fuente de la Plaza Independencia está iluminada."],
  "La Plaza Independencia tiene la fuente más fotografiada de Flores.":
    ["La fuente de la Plaza Independencia se ve linda con las luces.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "Vendo menos desde que apareció la niebla en el norte.":
    ["Vendo menos desde que apareció la niebla en el norte. Cierro temprano.",
     "Los de gris compran toda la nafta y pagan en efectivo. Vienen de noche."],
  "En Trinidad la plaza es el punto de encuentro: se habla de campo y de fútbol.":
    ["De noche en la plaza de Trinidad quedan los últimos, hablando de campo y de fútbol.",
     "Mañana a la mañana se juntan otra vez."],
  "Hay más caballos que autos en las calles de tierra.":
    ["A esta hora los caballos duermen en los corrales. Hay más que autos.",
     "La lana de acá se vende en todo el país."],
  "Antes el camino era de tierra y se cortaba con cada lluvia.":
    ["De noche el camino se ve apenas. Antes era de tierra y se cortaba con cada lluvia.",
     "Mi abuela dice que el mejor chivito es el de la madrugada, de parado."],
  "La lana de acá se vende en todo el país.":
    ["Mañana sale un camión con lana para todo el país. Yo me voy a dormir."],
  "Cortaron el camino a Palmitas y no dieron explicaciones. A los que mandan en eso no los vota nadie.":
    ["Cortaron el camino a Palmitas y no dieron explicaciones. Ni de noche lo abren. A los que mandan en eso no los vota nadie."],
  "Dicen que en el gimnasio de acá se gana algo más que una medalla: la Liga se acuerda de quien le gana a su líder.":
    ["El gimnasio ya apagó las luces. Dicen que ahí se gana algo más que una medalla: la Liga se acuerda de quien le gana a su líder."],
  "Pasando Florida se acaba la llanura. Cuentan que allá el líder te regala un silbato para volar entre ciudades.":
    ["Pasando Florida se acaba la llanura. Cuentan que allá el líder te regala un silbato para volar entre ciudades, incluso de noche."],
  "Palmitas es chica, pero cruzan camiones de granos todo el día.":
    ["De noche por Palmitas cruzan los camiones de granos con las luces altas.",
     "Los silos se ven contra el cielo."],
  "Los silos se ven desde varios kilómetros.":
    ["De noche los silos tienen una luz roja arriba, para los aviones.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Anoche entraron camiones grises a la cueva, con máquinas tapadas.":
    ["Anoche, a esta hora, entraron camiones grises a la cueva, con máquinas tapadas.",
     "El que manejaba tenía una P bordada en la campera."],
  "Mercedes mira al río Negro. Es la ciudad de los pescadores y de los remeros.":
    ["De noche el río Negro refleja las luces de la costanera de Mercedes.",
     "Los remeros salen al amanecer. Los pescadores, antes."],
  "En primavera la costanera se llena de gente tomando mate.":
    ["De noche la costanera queda para los que caminan despacio.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "Vi camiones del Equipo PP bajando máquinas con un cartel: \"Cliente: pueblo de la costa\".":
    ["Vi camiones del Equipo PP bajando máquinas de noche, con un cartel: \"Cliente: pueblo de la costa\".",
     "¿Quién compra niebla?"],
  "En el Río Negro se pesca el dorado. Dicen que pelea más que un entrenador.":
    ["De noche el dorado del Río Negro se acerca a la orilla. Dicen que pelea más que un entrenador.",
     "Mercedes tiene la costanera más linda del litoral."],
  "Mercedes tiene la costanera más linda del litoral.":
    ["Mercedes tiene la costanera más linda del litoral, y de noche se le suman las luces.",
     "Las islas del río se llenan de pájaros en primavera. Ahora duermen."],
  "Las islas del río se llenan de pájaros en primavera.":
    ["De noche, en las islas del río, se oyen las garzas acomodándose.",
     "En el Río Negro se pesca el dorado. Dicen que pelea más que un entrenador."],
  "El correo dejó de repartir hacia el oeste. Dicen que se perdió algo importante.":
    ["El correo cerró hace rato. Dejó de repartir hacia el oeste: dicen que se perdió algo importante."],
  "La que firma los permisos de paso en el correo es Marta, pero hace días que nadie la ve.":
    ["La que firma los permisos de paso en el correo es Marta, pero hace días que nadie la ve. Tampoco de noche."],
  "Quien tenga tiempo, que pase por Melo: las luces de la torre no son un cuento y nadie sube por gusto.":
    ["Quien tenga tiempo, que pase por Melo: las luces de la torre se ven de noche, no son un cuento y nadie sube por gusto."],
  "Villa Soriano fue el primer pueblo del país. Todavía se nota en las calles.":
    ["De noche Villa Soriano parece detenida en el tiempo. Fue el primer pueblo del país.",
     "El ferry hacia las islas del río Negro sale mañana temprano."],
  "Desde el puerto sale el ferry hacia las islas del río Negro.":
    ["El ferry hacia las islas del río Negro ya no sale hasta mañana.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Un barco sin bandera subió por el río hacia Fray Bentos.":
    ["Anoche un barco sin bandera subió por el río hacia Fray Bentos, sin luces.",
     "Llevaba unos tanques que largaban humo blanco."],
  "Young es un pueblo de gente trabajadora. El frigorífico de Fray Bentos queda cerca.":
    ["En Young la gente se acuesta temprano: se trabaja desde la madrugada.",
     "Acá se hacen los mejores chivitos de Río Negro, dicen. El carrito de la esquina abre hasta tarde."],
  "Acá se hacen los mejores chivitos de Río Negro, dicen.":
    ["El carrito de chivitos de la esquina es lo único abierto a esta hora.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "La niebla de la semana pasada no era normal: tapó el campo de golpe y se fue igual.":
    ["La niebla de la semana pasada bajó de noche, tapó el campo de golpe y se fue igual.",
     "Al otro día había huellas de camión en la banquina."],
  "Las Termas de Guaviyú quedan sobre la Ruta 3, a mitad de camino entre Paysandú y Salto.":
    ["De noche las Termas de Guaviyú largan vapor. Quedan sobre la Ruta 3, a mitad de camino entre Paysandú y Salto.",
     "Los camioneros paran a darse un baño caliente antes de seguir."],
  "Acá paran los camioneros a darse un baño caliente antes de seguir.":
    ["A esta hora los camioneros duermen en la cabina, después del baño caliente.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Un hombre de capa gris preguntó cuánta agua pasa por la represa de Salto.":
    ["Anoche un hombre de capa gris preguntó cuánta agua pasa por la represa de Salto.",
     "Anotaba todo en una libreta con un dibujo de pájaro azul."],
  "Belén es un pueblo de citricultores y de pescadores del río Uruguay.":
    ["De noche Belén huele a azahar. Es pueblo de citricultores y de pescadores del río Uruguay.",
     "Los pescadores salen con faroles."],
  "Las naranjas de Salto empiezan a verse desde acá.":
    ["Las naranjas de Salto se cosechan de día. De noche se oye el río.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Le robaron la caña a mi vecino. Fue uno de gris que decía que el río era de ellos.":
    ["Le robaron la caña a mi vecino, de noche. Fue uno de gris que decía que el río era de ellos.",
     "Se fue hacia Artigas."],
  "Artigas es la ciudad más al norte del país, pegada a Brasil.":
    ["De noche, en Artigas, del otro lado del puente se ven las luces de Brasil.",
     "Las piedras semipreciosas de la zona son famosas: ágatas y amatistas."],
  "Las piedras semipreciosas de la zona son famosas: ágatas y amatistas.":
    ["Las amatistas de las vidrieras brillan con la luz de la calle.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "Bah, acá la gente cruza el puente a Quaraí de chinelo nomás, pra comprar y pasear.":
    ["Bah, de noche el puente a Quaraí sigue lleno de gente que va y viene de chinelo.",
     "Y las amatistas que salen de las minas son tri lindas. Una barbaridade, tchê."],
  "Se dice que de las minas salen amatistas que brillan como nada.":
    ["Se dice que las amatistas de las minas brillan hasta con la luna.",
     "En esta tierra nació una de las figuras más grandes de la historia."],
  "Los mineros de la cooperativa están furiosos: alguien se lleva las geodas en bolsas.":
    ["Los mineros de la cooperativa hacen guardia de noche: alguien se lleva las geodas en bolsas."],
  "Un minero jura que el ladrón se esconde justo donde termina el pueblo.":
    ["Un minero jura que el ladrón sale de noche y se esconde justo donde termina el pueblo."],
  "Tranqueras queda sobre la Ruta 30, entre Artigas y Rivera.":
    ["De noche en Tranqueras solo se oyen los grillos. Queda sobre la Ruta 30, entre Artigas y Rivera.",
     "Es tierra de sandías: en verano las venden al costado de la ruta."],
  "Es tierra de sandías: en verano las venden al costado de la ruta.":
    ["Los puestos de sandías del costado de la ruta ya cerraron. Mañana vuelven.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Pasaron unos de gris con bolsas pesadas. Iban hacia Rivera.":
    ["Pasaron unos de gris con bolsas pesadas, de noche. Iban hacia Rivera.",
     "Se les cayó una piedra violeta: una amatista."],
  "Gracias otra vez.":
    ["Gracias otra vez. Que descanses."],
  "La Ruta 5 cruza acá el río Tacuarembó, el límite con el departamento de Rivera.":
    ["De noche se oye el río Tacuarembó desde acá. La Ruta 5 lo cruza en el límite con Rivera.",
     "Los arrieros esperan la bajante para pasar el ganado."],
  "Los arrieros esperan la bajante para pasar el ganado.":
    ["Los arrieros duermen al lado del fuego, esperando la bajante.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "En la frontera el PP pone controles como si fuera la aduana.":
    ["De noche el PP pone controles en la frontera como si fuera la aduana.",
     "A los que no pagan les dicen que la niebla los va a perder."],
  "Nos vemos en Tacuarembó.":
    ["Ya es de noche. Nos vemos en Tacuarembó."],
  "Tupambaé es un paraje de lomadas y estancias. Se oye más el viento que a la gente.":
    ["De noche en Tupambaé se oye más el viento que a la gente. Ni una luz en las lomadas.",
     "Hay tradiciones criollas que acá no cambiaron nunca."],
  "Hay tradiciones criollas que acá no cambiaron nunca.":
    ["De noche se junta la gente en la pulpería, como siempre. Hay tradiciones que acá no cambiaron nunca.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Las Luces Malas se ven cada noche más cerca de Melo.":
    ["Mirá para el lado de Melo: las Luces Malas se ven cada noche más cerca.",
     "Un de gris dijo en la pulpería que en la torre guardan una pieza de la máquina."],
  "Melo es la capital de Cerro Largo. Limita con Brasil y con la laguna Merín.":
    ["De noche en Melo se ve la torre del Cabildo desde todos lados. Es la capital de Cerro Largo.",
     "Su carnaval y sus ferias de frontera son parte del orgullo local."],
  "Su carnaval y sus ferias de frontera son parte del orgullo local.":
    ["En carnaval, Melo no duerme. Hoy está tranquila.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "La torre vieja del Cabildo tiene luces de noche. Dicen que es el Sereno, que sigue de guardia.":
    ["¿Las ves? La torre vieja del Cabildo tiene luces de noche. Dicen que es el Sereno, que sigue de guardia.",
     "Nadie se anima a subir."],
  "La Laguna Merín está cerca y de ahí viene medio mundo a pescar.":
    ["De noche los pescadores de la Laguna Merín salen con faroles.",
     "En el campo de Cerro Largo hay más ovejas que gente."],
  "Bah, tchê. En el campo de Cerro Largo hay más ovejas que gente.":
    ["Bah, tchê. De noche en el campo de Cerro Largo hay más estrellas que ovejas, y eso es decir.",
     "Tú cruzas por Río Branco o por Aceguá y sigue todo igual, pero con otro acento. ¿Tú sabías?"],
  "Las Luces Malas se ven cada noche más cerca de la torre.":
    ["Mirá: las Luces Malas están otra vez sobre la torre. Cada noche más cerca."],
  "El pueblo respiraría si alguien apagara lo que hay arriba de esa torre.":
    ["El pueblo dormiría tranquilo si alguien apagara lo que hay arriba de esa torre."],
  "Los viejos dicen que las ánimas de la torre se calman con quien las trata con respeto.":
    ["Los viejos dicen que las ánimas de la torre salen de noche y se calman con quien las trata con respeto."],
  "Arbolito queda sobre la Ruta 8, entre Treinta y Tres y Melo.":
    ["De noche en Arbolito no pasa casi nadie. Queda sobre la Ruta 8, entre Treinta y Tres y Melo.",
     "Cerca de acá fue la batalla de Arbolito, en 1904. Todavía hay un monumento."],
  "Cerca de acá fue la batalla de Arbolito, en 1904. Todavía hay un monumento.":
    ["Los viejos dicen que de noche, cerca del monumento de la batalla de Arbolito, se oyen caballos.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Por la Ruta 8 bajan camiones grises desde Melo hacia Treinta y Tres.":
    ["Por la Ruta 8 bajan camiones grises desde Melo, de noche, hacia Treinta y Tres.",
     "Uno se paró acá y el chofer preguntó por la Quebrada de los Cuervos."],
  "Lascano queda al borde de los bañados de Rocha.":
    ["De noche, en los bañados de Lascano, cantan las ranas sin parar.",
     "Los arroceros y los guías de aves duermen temprano."],
  "Los arroceros y los guías de aves comparten la plaza.":
    ["Los guías de aves salen antes del amanecer. Los arroceros también.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Los arrozales amanecieron con una capa de niebla que no se levanta ni con sol.":
    ["La niebla sobre los arrozales no se levanta ni de noche.",
     "Vi una antena nueva sobre un galpón, del lado de Rocha. Tiene una luz roja."],
  "Rocha guarda lagunas, palmares y las playas más tranquilas del Atlántico.":
    ["De noche, en las lagunas de Rocha, se ven más estrellas que en ningún lado.",
     "Los turistas se acuestan temprano para ver el amanecer sobre la laguna."],
  "Los fines de semana vienen turistas a ver el amanecer sobre la laguna.":
    ["Los turistas que vienen a ver el amanecer sobre la laguna ya se fueron a dormir.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "Rocha es de playas largas y desiertas, con dunas y lobos marinos. ¿Tú ya las conoces?":
    ["De noche las playas de Rocha son puro ruido de olas. ¿Tú las escuchaste?",
     "En verano viene gente de Argentina y Brasil. En invierno quedamos los de acá, y tú sabes que ahí es otra cosa."],
  "En verano llega mucha gente de Argentina y Brasil. En invierno quedan los de acá.":
    ["En verano la gente se queda en la playa hasta tarde. En invierno, a esta hora, no hay nadie.",
     "Los pescadores salen antes del amanecer y vuelven con la red llena."],
  "La laguna amaneció tapada de niebla y los flamencos se fueron.":
    ["La niebla sobre la laguna no se va ni de noche. Los flamencos se fueron."],
  "Un guardaparque anda preocupado por alguien que vigila la salida hacia la costa.":
    ["Un guardaparque anda preocupado, hasta de noche, por alguien que vigila la salida hacia la costa."],
  "En Florida, quien venza al aviador del gimnasio se va de ahí con las alas prestadas.":
    ["En Florida, quien venza al aviador del gimnasio se va de ahí con las alas prestadas. Dicen que se puede volar hasta de noche."],
  "Me llamo Olivera. Fui recluta: el alambre de San José, las geodas de Artigas, la máquina de esta laguna.":
    ["Me llamo Olivera. Fui recluta: el alambre de San José, las geodas de Artigas, la máquina de esta laguna.",
     "Tres veces me cruzaste y tres veces perdí. A la tercera entendí que estaba del lado equivocado.",
     "Ahora cuento flamencos para el guardaparque. De noche no hay flamencos que contar, así que duermo."],
  "Casupá es un pueblo en medio de las cuchillas, camino entre Minas y Florida.":
    ["De noche en Casupá se oye el arroyo desde la plaza. Es un pueblo entre Minas y Florida.",
     "El agua baja cristalina y fría."],
  "El arroyo del mismo nombre baja cristalino y frío.":
    ["El arroyo de Casupá a esta hora suena más que de día.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Después de lo de Minas, los camiones grises pasaron hacia Durazno.":
    ["Después de lo de Minas, los camiones grises pasaron de noche hacia Durazno.",
     "Llevaban tanques con un olor fuerte, como a nafta."],
  "Florida es la cuna de la independencia: acá se declaró el 25 de agosto de 1825.":
    ["De noche la Piedra Alta está iluminada. Florida es la cuna de la independencia: acá se declaró el 25 de agosto de 1825.",
     "Ahí se juró la libertad."],
  "La Piedra Alta está en el centro: ahí se juró la libertad.":
    ["La Piedra Alta tiene un foco que la ilumina toda la noche. Ahí se juró la libertad.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "Mire, en Florida se declaró la independencia. Acá la historia anda por la calle, como usted y yo.":
    ["Buenas noches. Mire, en Florida se declaró la independencia. Acá la historia anda por la calle, como usted y yo, también a esta hora.",
     "La plaza tiene un monumento pa' cada fecha importante. Mañana pase y vea nomás."],
  "La plaza tiene un monumento para cada fecha importante.":
    ["De noche los monumentos de la plaza se ven más serios. Hay uno para cada fecha importante.",
     "Los carnavales de los pueblos de al lado son ruidosos y alegres. Se oyen desde acá."],
  "Los carnavales de los pueblos de al lado son ruidosos y alegres.":
    ["¿Oís los tambores? Los carnavales de los pueblos de al lado siguen hasta tarde.",
     "En Florida se firmó la independencia; acá la historia está en las calles."],
  "Los pilotos de práctica ya no despegan: dicen que hay un humo raro.":
    ["Los pilotos de práctica ya no despegan, ni de noche: dicen que hay un humo raro."],
  "El líder del gimnasio vuela alto: lo que él aprueba, la Liga lo respeta.":
    ["El líder del gimnasio vuela alto, de día y de noche: lo que él aprueba, la Liga lo respeta."],
  "Mi abuelo contaba que el hornero de acá aprendió a llevar gente por el cielo. Hay que ganárselo.":
    ["Mi abuelo contaba que el hornero de acá aprendió a llevar gente por el cielo, hasta de noche. Hay que ganárselo."],
  "Sarandí Grande es un pueblo chico con una plaza grande y una escuela grande.":
    ["De noche en Sarandí Grande solo queda prendida la luz de la escuela. Plaza grande, escuela grande.",
     "Cerca de acá pasó la caballería de los Treinta y Tres."],
  "Cerca de acá pasó la caballería de los Treinta y Tres.":
    ["Dicen que en las noches de viento se oye todavía la caballería de los Treinta y Tres.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Cada noche sale un convoy de la refinería de Durazno hacia el sur.":
    ["Esperá un rato y lo vas a ver: cada noche sale un convoy de la refinería de Durazno hacia el sur.",
     "No lleva el logo de la empresa: lleva una P."],
  "San Ramón es famoso por sus quesos y por su feria de domingo.":
    ["De noche San Ramón se prepara para la feria del domingo. Es famoso por sus quesos.",
     "Las tortas fritas se hacen de madrugada."],
  "Se huele la masa de las tortas fritas desde la entrada.":
    ["Todavía se huele la masa de las tortas fritas de la tarde.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "El convoy de la refinería pasó por acá rumbo a Montevideo.":
    ["El convoy de la refinería pasó por acá anoche, rumbo a Montevideo.",
     "Uno de gris dijo: «La niebla final va a tapar el Estadio»."],
  "Canelones es la capital del departamento que rodea a Montevideo.":
    ["De noche, desde Canelones, se ve el resplandor de Montevideo en el cielo.",
     "Los viñedos de la zona producen el tannat que se sirve en todo el país."],
  "Los viñedos de la zona producen el tannat que se sirve en todo el país.":
    ["En la vendimia se trabaja en los viñedos hasta de noche. El tannat de acá se sirve en todo el país.",
     "La Policlínica está sobre la calle principal y atiende toda la noche."],
  "Canelones es de viñedos y quintas; la uva tannat se da como en pocos lados.":
    ["De noche las quintas de Canelones quedan en silencio. La uva tannat se da como en pocos lados.",
     "Acá hay vino bueno y se sirve con chivito."],
  "¿Qué andás haciendo, botija? Acá el vino es de las quintas de al lado, y se sirve con chivito.":
    ["¿Qué andás haciendo a esta hora, botija? Acá el vino es de las quintas de al lado, y se sirve con chivito.",
     "Los fines de semana alguien prende el fuego con vista a los viñedos y se queda hasta tarde."],
  "Todos los fines de semana alguien hace un asado con vista a los viñedos.":
    ["Huele a asado: alguien cena con vista a los viñedos.",
     "Canelones es de viñedos y quintas; la uva tannat se da como en pocos lados."],
  "Este año la vendimia se atrasó. Algo anda mal con el clima.":
    ["Este año la vendimia se atrasó. Las noches ya no son frescas como antes. Algo anda mal con el clima."],
  "El del gimnasio no suelta ni una uva sin saber con quién trata. Con el paso pasa lo mismo.":
    ["El del gimnasio trabaja hasta tarde en la bodega. No suelta ni una uva sin saber con quién trata, y con el paso pasa lo mismo."],
  "El parque de la entrada tiene una puerta que se abre cuando empieza el concurso de bichos.":
    ["El parque de la entrada está cerrado de noche. La puerta se abre cuando empieza el concurso de bichos."],
  "Las Piedras es la ciudad de las batallas: acá se ganó la primera victoria patriota.":
    ["De noche en Las Piedras se oye pasar el tren a lo lejos. Acá se ganó la primera victoria patriota.",
     "Montevideo queda a un paso, y se nota en el resplandor del cielo."],
  "Montevideo queda a un paso, y se nota en el ruido.":
    ["Montevideo queda a un paso: de noche se ve su resplandor detrás de los árboles.",
     "Acá hay un almacén y poco más. Es lo bueno del pueblo."],
  "Montevideo amaneció con una niebla que no deja ver el Cerro.":
    ["La niebla sobre Montevideo no deja ver ni las luces del Cerro.",
     "Dicen que es el último plan del Dr. Díaz."],
  "Si el camino te parece largo, es que lo estás mirando con apuro.":
    ["Si el camino te parece largo, de noche te va a parecer el doble. Andá sin apuro.",
     "Los arroyos de esta ruta se oyen antes de verlos."],
  "Doy clase a seis chicos en el rancho del fondo.":
    ["Mis seis alumnos ya duermen en el rancho del fondo.",
     "Mañana les enseño a mirar el cielo de noche, antes de salir a contarlo."],
  "Hago esta ruta una vez por semana y siempre veo algo distinto.":
    ["Hago esta ruta una vez por semana. De noche siempre veo algo distinto.",
     "Hay un guardián en el paso al que le gustan los acertijos."],
  "Esta posta es de mi familia desde hace tres generaciones.":
    ["Esta posta es de mi familia desde hace tres generaciones. De noche dejamos un farol prendido.",
     "Acá paran los carreros, los viajantes y ahora hasta los entrenadores."],
  "Esa tranquera la arreglé yo. La traba verde se suelta primero y la roja siempre queda para el final.":
    ["Esa tranquera la arreglé yo, aunque de noche cuesta ver los colores. La traba verde se suelta primero y la roja siempre queda para el final.",
     "Si te equivocás, los cerrojos vuelven a su lugar y se empieza de nuevo."],
  "Esa tranquera la arreglé yo. La traba roja se suelta primero y la azul siempre queda para el final.":
    ["Esa tranquera la arreglé yo, aunque de noche cuesta ver los colores. La traba roja se suelta primero y la azul siempre queda para el final.",
     "Si te equivocás, los cerrojos vuelven a su lugar y se empieza de nuevo."],
  "Esa balsa la conozco de memoria. La amarra roja se suelta primero y la verde siempre queda para el final.":
    ["Esa balsa la conozco de memoria, la solté hasta de noche. La amarra roja se suelta primero y la verde siempre queda para el final.",
     "Si te equivocás, las amarras vuelven a tensarse y se empieza de nuevo."],
  "Estas piedras eran el Fortín de San Fernando, de cuando la costa se defendía con cañones.":
    ["De noche las piedras del Fortín de San Fernando dan un poco de respeto. Eran de cuando la costa se defendía con cañones.",
     "Los piratas ya no vienen. Ahora vienen turistas con canoa. Vos al menos remaste, y a oscuras."],
  "Soy guardaparque de la isla. El canal está marcado con boyas para que nadie se pierda en la bahía.":
    ["Soy guardaparque de la isla. De noche las boyas del canal tienen una luz para que nadie se pierda en la bahía.",
     "Desde acá se ven las luces de Maldonado. Hay quien dice que algo grande canta de noche en estas aguas. Esta noche, escuchá."],
};

export const NIGHT_POOL: string[][] = [
  ['Buenas noches. A esta hora ya no anda casi nadie por acá.'],
  ['De noche salen otras criaturas. Si tenés las tuyas cansadas, mejor no te alejes del camino.'],
  ['Salí a tomar aire antes de dormir. Se ven todas las estrellas.'],
  ['Mañana temprano hay que trabajar. Ya me voy a acostar.'],
  ['¿Oís los grillos? Así son las noches por acá.'],
  ['Andá con cuidado: de noche no se ven los pozos del camino.'],
  ['La Policlínica atiende toda la noche, por si las dudas.'],
  ['Esta noche hay luna. Se ve bien el camino.'],
];

export const NIGHT_SWAP: Record<string, string> = {
  'Vine a ver el atardecer y encontré un rival.': 'Vine a ver las estrellas sobre el cerro y encontré un rival.',
  'Un carpincho tomando sol en la costa, como si el puerto fuera suyo.': 'Un carpincho dormido en la costa, como si el puerto fuera suyo.',
  'Esta tarde sale la llamada desde acá, del Barrio Sur. Pero la cuerda está incompleta.': 'Esta noche sale la llamada desde acá, del Barrio Sur. Pero la cuerda está incompleta.',
  'El del repique bajó a la playa a templar el cuero al sol. El del piano dijo algo del parque y no lo vi más. Si los cruzás, avisales que ya salimos.': 'El del repique bajó a la playa a templar el cuero con un fuego de leña. El del piano dijo algo del parque y no lo vi más. Si los cruzás, avisales que ya salimos.',
  'El cuero se templa al sol o con fuego. Acá en la playa sale solo, sin apuro.': 'De noche el cuero se templa con fuego. Acá en la playa, con unas maderas, sale solo y sin apuro.',
  'Hay costillar al fuego desde el mediodía. A la noche se arma la ronda alrededor del fogón.': 'Hay costillar al fuego desde el mediodía. Ahora se arma la ronda alrededor del fogón.',
  'Un lobo marino toma sol y te mira sin apuro. Mejor no molestarlo.': 'Un lobo marino duerme sobre la roca y abre un ojo cuando pasás. Mejor no molestarlo.',
};

/** The night dialogue of an outdoor NPC whose day lines are `text` (the same NPC always gets the same pool lines). */
export function nightTalk(text: string | string[], x = 0, y = 0): string[] {
  const lines = Array.isArray(text) ? text : [text];
  return NIGHT_TALK[lines[0]] ?? NIGHT_POOL[Math.abs(x * 7 + y * 13) % NIGHT_POOL.length];
}

/** A single line as it should be said at night outdoors. */
export const nightLine = (line: string) => NIGHT_SWAP[line] ?? line;
