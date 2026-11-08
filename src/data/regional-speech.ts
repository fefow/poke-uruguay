/**
 * How people talk in each part of Uruguay. One local in each city speaks the way people speak there, so the country
 * does not sound the same from Colonia to Rivera:
 *   - The northern border (Artigas, Rivera, Tacuarembó, Cerro Largo): Spanish mixed with Portuguese (the "portuñol" or
 *     fronterizo): "bah", "tchê", "tri", "barbaridade", "guri", "a gente".
 *   - The east (Cerro Largo, Treinta y Tres, Rocha): "tú" instead of "vos" ("tú sabes", "¿tú viniste?").
 *   - The countryside in the middle (Durazno, Florida, Tacuarembó): country people who call you "usted" and say
 *     "la pucha", "pa'", "mire".
 *   - The litoral (Salto, Paysandú): river people, "che", "bo", the heat.
 *   - Canelones: "botija" for a kid, the farms and the vineyards.
 *   - Montevideo: "bo", "ta", "re", "posta", "de una".
 * Each entry finds the person by map and by the first line they used to say, and gives them new lines with the same
 * meaning. If that person is gone (the map was redrawn, or the line changed in the text editor), nothing happens.
 * Still pending (see docs/habla-regional.md): Colonia, San José, Flores, Soriano, Río Negro, Lavalleja and Maldonado.
 */

const SPEECH = [
  // Rivera: fronterizo, the city shares the street with Santana do Livramento.
  { map: 'rivera', was: 'En Rivera cruzás la calle y estás en otro país.', look: 'girl', text: [
    'Bah, tchê. Acá en Rivera cruzás la calle y ya tá no Brasil.',
    'Mi vó vendía de un lado y compraba del otro. Tri negocio, barbaridade.'] },
  // Artigas: fronterizo, across the bridge from Quaraí; the amethyst mines.
  { map: 'artigas', was: 'Acá la frontera con Brasil se cruza a pie, para comprar y para pasear.', look: 'artesana', text: [
    'Bah, acá la gente cruza el puente a Quaraí de chinelo nomás, pra comprar y pasear.',
    'Y las amatistas que salen de las minas son tri lindas. Una barbaridade, tchê.'] },
  // Tacuarembó: country and border at once.
  { map: 'tacuarembo', was: 'En Tacuarembó se hizo el primer asado de la Patria Gaucha.', look: 'gaucho', text: [
    'Bah, mire: en Tacuarembó la Patria Gaucha es cosa seria. Se prende el fogón y pa\' qué le cuento.',
    'Si a usted le gusta el campo, no se pierda el desfile, tchê.'] },
  // Cerro Largo (Melo): border plus the eastern "tú".
  { map: 'melo', was: 'En el campo de Cerro Largo hay más ovejas que gente.', look: 'gaucho', text: [
    'Bah, tchê. En el campo de Cerro Largo hay más ovejas que gente.',
    'Tú cruzas por Río Branco o por Aceguá y sigue todo igual, pero con otro acento. ¿Tú sabías?'] },
  // Treinta y Tres: eastern "tú", proud of the Olimar and the Treinta y Tres Orientales.
  { map: 'quebrada', was: 'Treinta y Tres se llama así por los 33 Orientales.', look: 'girl', text: [
    '¿Tú sabes por qué la ciudad se llama Treinta y Tres? Por los 33 Orientales, claro.',
    'Acá la historia está en cada rincón, y el Olimar la canta. Tú quédate un rato y vas a ver.'] },
  // Rocha: the best-known "tú" of the country, with the verb that goes with it.
  { map: 'rocha', was: 'Rocha es de playas largas y desiertas, con dunas y lobos marinos.', look: 'campesina', text: [
    'Rocha es de playas largas y desiertas, con dunas y lobos marinos. ¿Tú ya las conoces?',
    'En verano viene gente de Argentina y Brasil. En invierno quedamos los de acá, y tú sabes que ahí es otra cosa.'] },
  // Salto: the litoral, the heat, "che".
  { map: 'salto', was: 'Las termas de Salto son buenas para el cuerpo y para la cabeza.', look: 'turista', text: [
    'Che, con este calor salteño lo único que da ganas es meterse en las termas. Te arreglan el cuerpo y la cabeza.',
    'Y si tenés algo de tipo Siniestro, el líder lo va a sufrir, eh.'] },
  // Paysandú: the litoral, "bo".
  { map: 'paysandu', was: 'Acá se hace la cerveza artesanal más rica del litoral, dicen los de acá.', look: 'nino', text: [
    'Bo, acá decimos que la cerveza artesanal más rica del litoral es sanducera. Y no se discute.',
    'En verano la playa Park se llena. Todo el mundo baja al río.'] },
  // Durazno: country speech, "usted", the folklore festival.
  { map: 'durazno', was: 'El Río Negro cruza por el medio de Durazno y hace una isla en la ciudad.', look: 'artesana', text: [
    'Buenas. ¿Usted ya vio el Yí? Pasa por el costado de la ciudad, mire qué lindo que es.',
    'Y pa\' la fiesta del folklore no queda un lugar libre. La pucha, cómo se llena.'] },
  // Florida: country speech, the Piedra Alta.
  { map: 'florida', was: 'En Florida se firmó la independencia; acá la historia está en las calles.', look: 'campesina', text: [
    'Mire, en Florida se declaró la independencia. Acá la historia anda por la calle, como usted y yo.',
    'La plaza tiene un monumento pa\' cada fecha importante. Pase y vea nomás.'] },
  // Canelones: farms and vineyards, "botija".
  { map: 'canelones', was: 'Acá hay vino bueno y se sirve con chivito.', look: 'turista', text: [
    '¿Qué andás haciendo, botija? Acá el vino es de las quintas de al lado, y se sirve con chivito.',
    'Todos los fines de semana alguien prende el fuego con vista a los viñedos.'] },
  // Montevideo: "bo", "re", "posta".
  { map: 'montevideo', was: 'En la Rambla, la gente toma mate y mira el río.', look: 'girl', text: [
    '¿Qué hacés, bo? En la Rambla la gente toma mate y mira el río. Re tranqui.',
    'Parece un mar, pero es marrón por el barro que trae el río. Posta.'] },
];

/** Gives one local in each city the way people speak there. */
export function addRegionalSpeech(outdoor: Record<string, any>) {
  for (const s of SPEECH) {
    const npc = (outdoor[s.map]?.npcs ?? []).find((n) => !n.trainer && !n.script && [].concat(n.text ?? [])[0] === s.was);
    if (npc) npc.text = [...s.text];
  }
}
