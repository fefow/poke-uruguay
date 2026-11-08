/**
 * Everyday Uruguayan first names for the trainers the player can fight.
 *
 * Every trainer in the world gets a plain, common first name (Jorge, Sebastián, Camila...) chosen from the pools
 * below, so the road is not full of historical or famous names and the same name does not come up again and again.
 * Each pool is used up before any name repeats. The pools follow the most frequent names registered in Uruguay:
 * the "joven" lists are names common among people born from the late 80s on, the "mayor" lists among people born
 * from the 40s to the 70s (used for older-looking trainers and for anyone called Don/Doña).
 *
 * The name follows the person drawn in the world: a woman's look gets a woman's name and a woman's job title, and
 * the other way round. Team PP grunts, the story's villains and helpers (Dr. Salazar, Ing. Ferrari, Inspector Duarte,
 * the PP foremen...), gym leaders, the Alto Mando, the Campeón and the rival keep their names: they are written in
 * story.ts and are not touched here.
 *
 * Trainer ids do not change, so saved games keep every win.
 */

const MALE_YOUNG = [
  'Sebastián', 'Matías', 'Nicolás', 'Santiago', 'Martín', 'Diego', 'Gonzalo', 'Rodrigo', 'Pablo', 'Agustín',
  'Joaquín', 'Lucas', 'Mateo', 'Bruno', 'Thiago', 'Benjamín', 'Felipe', 'Franco', 'Maximiliano', 'Emiliano',
  'Ignacio', 'Andrés', 'Leandro', 'Germán', 'Mauricio', 'Fernando', 'Alejandro', 'Gastón', 'Guillermo', 'Marcos',
  'Ezequiel', 'Lautaro', 'Valentín', 'Santino', 'Bautista', 'Gabriel', 'Kevin', 'Jonathan', 'Cristian', 'Rafael',
  'Emanuel', 'Leonardo', 'Esteban', 'Damián', 'Alexis', 'Juan Manuel', 'Juan Ignacio', 'Manuel', 'Francisco', 'Álvaro',
  'Nahuel', 'Iván', 'Elías', 'Gerónimo', 'Ian', 'Axel', 'Juan Cruz', 'Lorenzo', 'Ramiro', 'Juan Pablo',
  'Federico', 'Marcelo', 'Javier', 'Leonel', 'Brian', 'Hernán', 'Mathías', 'Bryan', 'Juan Martín', 'Dylan',
];
const MALE_OLD = [
  'Jorge', 'Carlos', 'José', 'Luis', 'Juan', 'Daniel', 'Raúl', 'Walter', 'Nelson', 'Roberto',
  'Ricardo', 'Eduardo', 'Alberto', 'Hugo', 'Mario', 'Óscar', 'Julio', 'Rubén', 'Gustavo', 'Néstor',
  'Héctor', 'Miguel', 'Enrique', 'Ángel', 'Sergio', 'Víctor', 'Alfredo', 'Gerardo', 'Omar', 'Ariel',
  'Pedro', 'Antonio', 'Juan Carlos', 'José Luis', 'Milton', 'Wilson', 'Edgardo', 'Heber', 'Darío', 'Fabián',
  'Ernesto', 'Jesús', 'Luis Alberto', 'Hugo Daniel', 'Marcelo', 'Javier', 'Gonzalo', 'Álvaro', 'Ramiro', 'Gabriel',
];
const FEMALE_YOUNG = [
  'Camila', 'Valentina', 'Florencia', 'Agustina', 'Micaela', 'Natalia', 'Carolina', 'Fernanda', 'Victoria', 'Martina',
  'Paula', 'Romina', 'Daniela', 'Andrea', 'Gabriela', 'Belén', 'Josefina', 'Emilia', 'Catalina', 'Julieta',
  'Antonella', 'Melina', 'Rocío', 'Lorena', 'Jimena', 'Tamara', 'Stefanía', 'Mariana', 'Valeria', 'Isabella',
  'Renata', 'Zoe', 'Maite', 'Delfina', 'Pilar', 'Guadalupe', 'Milagros', 'Abril', 'Sabrina', 'Noelia',
  'Leticia', 'Paola', 'Cecilia', 'Verónica', 'Virginia', 'Luciana', 'Carla', 'Alejandra', 'Eugenia', 'Ana Clara',
];
const FEMALE_OLD = [
  'María', 'Ana', 'Laura', 'Silvia', 'Patricia', 'Claudia', 'Graciela', 'Mónica', 'Beatriz', 'Susana',
  'Mirta', 'Rosa', 'Teresa', 'Alicia', 'Gladys', 'Nelly', 'Norma', 'Raquel', 'Cristina', 'Sandra',
  'Adriana', 'Liliana', 'Ana María', 'María José', 'Isabel', 'Mercedes', 'Inés', 'Elsa', 'Olga', 'Margarita',
  'Lourdes', 'Rosario', 'Carmen', 'Sonia', 'Mabel', 'Blanca', 'Gloria', 'Stella', 'Nora', 'María del Carmen',
];
// Names the player already knows from the story (leaders, Alto Mando, the rival): no trainer on the road shares them.
const TAKEN = new Set(['Facundo', 'Facu', 'Tomás', 'Federico', 'Teófilo', 'Obdulio', 'Ramón', 'Sofía', 'Lucía', 'Elena',
  'Marta', 'Candelaria', 'Mariela', 'Zoraida', 'Estela', 'Dolores', 'Horacio']);

/** Looks drawn as women (long hair in the character templates). Every other look is drawn as a man. */
const FEMALE_LOOKS = new Set(['girl', 'maestra', 'campesina', 'artesana', 'abuela']);
const OLD_LOOKS = new Set(['oldman', 'abuela', 'almacenero']);
const OLD_CLASS = /veterano|baqueano|caballero|señora|señor|pulper|almacener|paisan|colono|capitán|capitana|astrónomo|ganadero|productor/i;
/** The woman's look used when a trainer written as a woman was drawn with a man's job look. Swimmers stay as they are. */
const FEMALE_LOOK_FOR: Record<string, string> = {
  oldman: 'abuela', almacenero: 'abuela', gaucho: 'campesina', pescador: 'campesina', obrero: 'campesina',
  biologo: 'maestra', clerk: 'maestra', cocinero: 'artesana', estudiante: 'girl', turista: 'girl', boy: 'girl',
  sailor: 'girl', ciclista: 'girl', camionero: 'girl', hincha: 'girl', cartero: 'girl', cop: 'maestra',
};
/** First names the trainers were written with that are women's names (the original writer's intent is kept). */
const WRITTEN_FEMALE = new Set(['Agustina', 'Valentina', 'Sol', 'Lucía', 'Ofelia', 'Clara', 'Elena', 'Lorena', 'Marina',
  'Camila', 'Mirta', 'Mariana', 'Ana', 'Valeria', 'Elba', 'Brenda', 'Sofía', 'Florencia', 'Jimena', 'Leticia', 'Graciela',
  'Rocío', 'Natalia', 'Carmen', 'Rosario', 'Bianca', 'Irene', 'Delfina', 'Soledad', 'Flor', 'Romina', 'Vero', 'Inés',
  'Paula', 'Noelia', 'Alma', 'Gimena', 'Elvira', 'Ada', 'Lener', 'Silvia', 'Rosa']);
const FEMALE_TITLE = /^(Doña|Dama|Capitana|Azafata|Espeleóloga|Botánica|Cazabichos Delfina)\b/;
const writtenFemale = (name: string, cls: string, look: string) => FEMALE_LOOKS.has(look) || FEMALE_TITLE.test(name)
  || WRITTEN_FEMALE.has(name.split(' ').at(-1)!.replace(/\.$/, '')) || WRITTEN_FEMALE.has(name.split(' ')[0]) || cls in TO_MALE;

/** Job titles written for the other gender: the title follows the person drawn. */
const TO_MALE: Record<string, string> = {
  Bióloga: 'Biólogo', Pescadora: 'Pescador', Apicultora: 'Apicultor', Ingeniera: 'Ingeniero', Geóloga: 'Geólogo',
  Espeleóloga: 'Espeleólogo', Botánica: 'Botánico', Cañera: 'Cañero', Viñatera: 'Viñatero', Sandiera: 'Sandiero',
  Almacenera: 'Almacenero', Veterinaria: 'Veterinario', Ferroviaria: 'Ferroviario', Agrónoma: 'Agrónomo',
  Alfarera: 'Alfarero', Paisana: 'Paisano', 'Maestra rural': 'Maestro rural', Curiosa: 'Curioso', Señora: 'Señor',
  Chica: 'Chico', Azafata: 'Auxiliar de vuelo', 'Ex finalista': 'Ex finalista', 'Técnica de UTE': 'Técnico de UTE',
  'Técnica de OSE': 'Técnico de OSE', 'Guía de sierra': 'Guía de sierra', Archivista: 'Archivista', Remera: 'Remero',
};
const TO_FEMALE: Record<string, string> = Object.fromEntries(Object.entries(TO_MALE).map(([f, m]) => [m, f]));
Object.assign(TO_FEMALE, {
  Domador: 'Domadora', Arriero: 'Arriera', Esquilador: 'Esquiladora', Ganadero: 'Ganadera', Productor: 'Productora',
  Citricultor: 'Citricultora', Arrocero: 'Arrocera', Forestal: 'Forestal', Montañista: 'Montañista', Futbolista: 'Futbolista',
  Caballero: 'Señora', Joven: 'Joven', Tripulante: 'Tripulante', Navegante: 'Navegante', Guardavidas: 'Guardavidas',
  Empleado: 'Empleada', 'Empleado de la intendencia': 'Empleada de la intendencia', Colono: 'Colona', Viñatero: 'Viñatera',
  Bañista: 'Bañista', Estibador: 'Estibadora', Capoeirista: 'Capoeirista', 'Operario de OSE': 'Operaria de OSE',
  Pescador: 'Pescadora', Naturalista: 'Naturalista', Peón: 'Peona', Marinero: 'Marinera', Obrero: 'Obrera',
  Estudiante: 'Estudiante', Viajero: 'Viajera', Baqueano: 'Baqueana', Tambero: 'Tambera', Minero: 'Minera',
  Camionero: 'Camionera', Nadador: 'Nadadora', Sereno: 'Serena', Herrero: 'Herrera', Electricista: 'Electricista',
  Aeromodelista: 'Aeromodelista', Gaucho: 'Paisana', Serrano: 'Serrana', Guardabosque: 'Guardabosques',
  Astrólogo: 'Astróloga', Cartero: 'Cartera', Ornitólogo: 'Ornitóloga', Entomólogo: 'Entomóloga', Apicultor: 'Apicultora',
  Veterano: 'Veterana', 'Veterano de la Liga': 'Veterana de la Liga', Aspirante: 'Aspirante', Tropero: 'Tropera',
});

/** Kept as written: grunts and story people called by title and surname. */
const KEEP = /^(Recluta|Dr\.|Ing\.|Inspector|Inspectora|Capataz|Técnica|Técnico|Escribano|Maitre)\b/;
const KEEP_CLASS = /PP|Líder|Comandante|Alto Mando|Campeón|Rival|Espíritu/;

/** A fixed shuffle (same order on every load) so neighbouring trainers do not get alphabetical names. */
function shuffled(list: string[], seed: number) {
  const a = list.filter((n) => !TAKEN.has(n));
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pool(list: string[], seed: number) {
  const order = shuffled(list, seed);
  const used = new Map<string, number>();
  let i = 0;
  return () => {
    const name = order[i % order.length];
    i++;
    used.set(name, (used.get(name) ?? 0) + 1);
    return name;
  };
}

/** Renames every ordinary trainer in the world. Call once, after the trainers' looks are final. */
export function nameTrainers(maps: Record<string, any>) {
  const next = {
    m: pool(MALE_YOUNG, 19),
    M: pool(MALE_OLD, 33),
    f: pool(FEMALE_YOUNG, 7),
    F: pool(FEMALE_OLD, 1825),
  };
  const done = new Set<any>();
  for (const m of Object.values(maps)) {
    for (const n of m.npcs ?? []) {
      const t = n.trainer;
      if (!t || done.has(t) || n.leader) continue;
      done.add(t);
      if (KEEP.test(t.name ?? '') || KEEP_CLASS.test(t.cls ?? '')) continue;
      let look = t.look ?? n.look;
      const female = look !== 'swimmer' && writtenFemale(t.name ?? '', t.cls ?? '', look);
      if (female && !FEMALE_LOOKS.has(look)) { look = FEMALE_LOOK_FOR[look] ?? 'girl'; n.look = look; t.look = look; }
      if (!female && FEMALE_LOOKS.has(look)) { look = look === 'abuela' ? 'oldman' : 'boy'; n.look = look; t.look = look; }
      const honor = /^(Don|Doña)\s/.test(t.name ?? '');
      const old = honor || OLD_LOOKS.has(look) || OLD_CLASS.test(t.cls ?? '');
      const first = next[(female ? 'f' : 'm').replace(/./, (c) => (old ? c.toUpperCase() : c))]();
      t.name = honor ? `${female ? 'Doña' : 'Don'} ${first}` : first;
      const cls = t.cls ?? '';
      const fixed = (female ? TO_FEMALE : TO_MALE)[cls];
      if (fixed) t.cls = fixed;
      if (n.name && n.name !== t.name) n.name = t.name;
    }
  }
}
