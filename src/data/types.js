import { deepFreeze } from '../core/util.js';

export const TYPES = deepFreeze({
  normal: { name: 'Normal', color: '#a8a17a' },
  fuego: { name: 'Fuego', color: '#e8672c' },
  agua: { name: 'Agua', color: '#3f86e0' },
  planta: { name: 'Planta', color: '#5cae3c' },
  electrico: { name: 'Eléctrico', color: '#e8c21c' },
  tierra: { name: 'Tierra', color: '#c49a4c' },
  roca: { name: 'Roca', color: '#a48e48' },
  volador: { name: 'Volador', color: '#8e9de8' },
  bicho: { name: 'Bicho', color: '#9bb51e' },
  veneno: { name: 'Veneno', color: '#a04aa0' },
  siniestro: { name: 'Siniestro', color: '#6b5546' },
  psiquico: { name: 'Psíquico', color: '#ef5585' },
  lucha: { name: 'Lucha', color: '#bd3428' },
});

// attacker -> defender -> multiplier (missing = 1)
const CHART = deepFreeze({
  normal: { roca: 0.5 },
  fuego: { planta: 2, bicho: 2, fuego: 0.5, agua: 0.5, roca: 0.5 },
  agua: { fuego: 2, tierra: 2, roca: 2, agua: 0.5, planta: 0.5 },
  planta: { agua: 2, tierra: 2, roca: 2, fuego: 0.5, planta: 0.5, volador: 0.5, bicho: 0.5, veneno: 0.5 },
  electrico: { agua: 2, volador: 2, planta: 0.5, electrico: 0.5, tierra: 0 },
  tierra: { fuego: 2, electrico: 2, roca: 2, veneno: 2, planta: 0.5, bicho: 0.5, volador: 0 },
  roca: { fuego: 2, volador: 2, bicho: 2, lucha: 0.5, tierra: 0.5 },
  volador: { planta: 2, bicho: 2, lucha: 2, electrico: 0.5, roca: 0.5 },
  bicho: { planta: 2, psiquico: 2, siniestro: 2, fuego: 0.5, volador: 0.5, lucha: 0.5, veneno: 0.5 },
  veneno: { planta: 2, veneno: 0.5, tierra: 0.5, roca: 0.5 },
  siniestro: { psiquico: 2, siniestro: 0.5, lucha: 0.5 },
  psiquico: { lucha: 2, veneno: 2, psiquico: 0.5, siniestro: 0 },
  lucha: { normal: 2, roca: 2, siniestro: 2, volador: 0.5, psiquico: 0.5, bicho: 0.5, veneno: 0.5 },
});

export function effectiveness(moveType, defTypes) {
  return defTypes.reduce((m, t) => m * (CHART[moveType]?.[t] ?? 1), 1);
}
