// The pieces of a toll plaza ("peaje"), seen from above. Two sets: H for a plaza laid across a north-south road
// (the row of booths runs east-west) and V for one across an east-west road (the drawings turned a quarter).
// The floor goes in the tiles; the roof over the row of booths goes in the "encima" layer (m.top).
export const TOLL_H = { island: 'Ѣ', open: 'Ѳ', closed: 'Ѷ', barrier: 'Ѹ', nose: 'Ҏ', paved: 'Ҩ', roof: 'ѽ', roofOpen: 'Ѿ', roofClosed: 'ѿ' };
export const TOLL_V = { island: 'ѹ', open: 'Ѻ', closed: 'ѻ', barrier: 'Ѽ', nose: 'ҏ', paved: 'ҩ', roof: 'Ҥ', roofOpen: 'ҥ', roofClosed: 'Ҧ' };
/** Signs: the one that warns a toll is coming, and the legs of the blue board with the toll's name (left, middle, middle, right). */
export const TOLL_WARN = 'Ҋ';
export const TOLL_BOARD = ['ҋ', 'Ҍ', 'Ҍ', 'ҍ'];
/** Floor pieces of the plaza (3D draws their booths, barriers and roof itself). */
export const TOLL_FLOOR = new Set([TOLL_H, TOLL_V].flatMap((s) => [s.island, s.open, s.closed, s.barrier, s.nose, s.paved]).concat(TOLL_BOARD));
/** Roof pieces (encima layer). */
export const TOLL_ROOF = new Set([TOLL_H, TOLL_V].flatMap((s) => [s.roof, s.roofOpen, s.roofClosed]));
/** Whether a cell is under or right beside a toll's roof (m.toll, set by data/toll.ts): there the roof goes see-through. */
export function tollZone(t: { vertical: boolean; a: number; lo: number; hi: number }, x: number, y: number) {
  const [along, across] = t.vertical ? [x, y] : [y, x];
  return Math.abs(along - t.a) <= 1 && across >= t.lo - 1 && across <= t.hi + 1;
}
