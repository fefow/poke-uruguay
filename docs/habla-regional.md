# Habla regional y nombres de entrenadores

## Nombres de entrenadores (v191)

- Todos los entrenadores comunes del mundo (229, sin contar los 59 reclutas PP) tienen ahora un nombre de pila uruguayo común. Están en `src/data/trainer-names.ts`.
- Hay cuatro listas: hombres jóvenes, hombres mayores, mujeres jóvenes y mujeres mayores. Los mayores (aspecto de anciano, "Don"/"Doña", baqueanos, veteranos, almaceneros) reciben nombres de generaciones anteriores (Jorge, Walter, Graciela, Mirta...). El resto recibe nombres de gente más joven (Sebastián, Matías, Camila, Florencia...).
- Cada lista se recorre entera antes de repetir un nombre, así que ningún nombre aparece más de dos veces en todo el juego.
- El nombre sigue al sprite: a una mujer se le da nombre y oficio de mujer (Pescadora, Peona, Baqueana) y aspecto de mujer. Los entrenadores escritos como mujeres que tenían un aspecto de hombre (por ejemplo "Mariana, Peón" con sprite de gaucho) pasan a tener aspecto de mujer. Quedan 82 mujeres y 147 hombres.
- No se tocan: reclutas PP, líderes de gimnasio, Alto Mando, Campeón, rival, jefes PP y personajes de historia llamados por título y apellido (Dr. Salazar, Ing. Ferrari, Técnica Moreira, Inspector Duarte, Capataz Olivera, Capataz Rivas, Escribano Olivera, Maitre Ibarra). Tampoco los tres rivales del torneo de remo de Mercedes ni los rivales de las mini historias.
- Ningún entrenador comparte nombre con un líder, el Alto Mando, el Campeón o el rival (Facu).
- Los ids de entrenador no cambian, así que las partidas guardadas conservan las victorias.

## Habla regional (primera pasada)

`src/data/regional-speech.ts`: un vecino de cada ciudad habla como se habla ahí. Se busca al vecino por su primera línea original; si esa línea se cambió en el editor de textos, la regla no hace nada.

| Departamento | Ciudad | Rasgos usados |
|---|---|---|
| Rivera | Rivera | Fronterizo: "bah, tchê", "tá no Brasil", "vó", "tri", "barbaridade" |
| Artigas | Artigas | Fronterizo: "chinelo", "pra", "tri lindas", "barbaridade" |
| Tacuarembó | Tacuarembó | Campo + frontera: "bah, mire", "pa' qué le cuento", usted, "tchê" |
| Cerro Largo | Melo | Frontera + tuteo del este: "bah, tchê", "tú cruzas", "¿tú sabías?" |
| Treinta y Tres | Treinta y Tres | Tuteo: "¿tú sabes?", "tú quédate" |
| Rocha | Rocha | Tuteo con su verbo: "¿tú ya las conoces?", "tú sabes" |
| Salto | Salto | Litoral: "che", el calor salteño |
| Paysandú | Paysandú | Litoral: "bo", "sanducera" |
| Durazno | Durazno | Campo: usted, "mire", "pa'", "la pucha" |
| Florida | Florida | Campo: usted, "mire", "pase y vea nomás" |
| Canelones | Canelones | "Botija", quintas y viñedos |
| Montevideo | Montevideo | "Bo", "re tranqui", "posta" |

### Pendiente

- Colonia, San José, Flores (Trinidad), Soriano (Mercedes), Río Negro (Fray Bentos), Lavalleja (Minas) y Maldonado: hablan rioplatense sin rasgos muy marcados. Falta elegir qué los distingue (por ejemplo, vocabulario de campo en Flores y Soriano, o el habla de la temporada en Maldonado) y qué vecino lo dice.
- Llevar el habla a NPCs importantes de la historia de cada región (líder de gimnasio, ayudantes de eventos), si el usuario lo quiere.
- Las localidades (Tranqueras, Arbolito, Lascano...) todavía no tienen habla propia.
