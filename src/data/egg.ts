// The egg (like the one in the classic games): Tabárez's assistant hands it over in Trinidad after the first medal.
// It travels in the bag and hatches by itself after the player has walked EGG.steps steps with it.
// The creature inside is the Gato Pajero, the hardest base creature to find in the wild (one route, rare).
export const EGG = Object.freeze({ item: 'huevo', species: 'pibe', level: 8, steps: 1000 });

/** What the player notices when looking at the egg, by how many steps are left. */
export function eggHint(left: number) {
  if (left <= 100) return 'Se oyen ruidos adentro. Parece que va a nacer muy pronto.';
  if (left <= 350) return 'De vez en cuando se mueve. Ya falta poco.';
  if (left <= 700) return 'Se siente tibio. A veces parece que algo se mueve adentro.';
  return 'Un huevo grande y liso. Va a tardar bastante en nacer.';
}
