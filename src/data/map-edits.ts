// Changes made in the map editor are stored per map as a small patch over the generated map:
//   tiles     the whole tile grid (only when some tile changed; ignored if the size or the doors/signs no longer match)
//   npcs      { key: { x, y, dir, text } | { remove: true } } for people already in the map, by npcKey()
//   addNpcs   [{ x, y, look, dir, text, wander }] new people (they only talk)
//   items     { id: { x, y } | { remove: true } } for items already in the map
//   addItems  [{ x, y, item, id }] new items on the ground
// The game applies them after building every map (end of maps.js), so a generator change keeps the edits.

/** A stable name for a person in a map: what it is (trainer id, script or look) and which one of those it is. */
export function npcKeys(npcs = []) {
  const seen = new Map();
  return npcs.map((n) => {
    const base = n.trainer?.id ? `tr:${n.trainer.id}` : n.script ? `s:${n.script}${n.leader ? `:${n.leader}` : ''}` : `look:${n.look ?? 'none'}`;
    const k = seen.get(base) ?? 0;
    seen.set(base, k + 1);
    return k ? `${base}@${k}` : base;
  });
}

const count = (tiles, ch) => tiles.join('').split(ch).length - 1;

/** Applies the editor's patches to the built maps, in place. Patches that no longer fit are skipped. */
export function applyMapEdits(maps, edits) {
  for (const [id, e] of Object.entries((edits ?? {}) as Record<string, any>)) {
    const m = maps[id];
    if (!m || !e) continue;
    if (Array.isArray(e.tiles) && fitsTiles(m.tiles, e.tiles)) m.tiles = [...e.tiles];
    if (e.npcs || e.addNpcs) {
      const keys = npcKeys(m.npcs);
      m.npcs = (m.npcs ?? []).flatMap((n, i) => {
        const p = e.npcs?.[keys[i]];
        if (!p) return [n];
        if (p.remove) return [];
        if (Number.isInteger(p.x) && Number.isInteger(p.y)) { n.x = p.x; n.y = p.y; }
        if (p.dir) n.dir = p.dir;
        if (Array.isArray(p.text) && n.text && !n.script && !n.trainer) n.text = p.text;
        return [n];
      });
      for (const a of e.addNpcs ?? []) m.npcs.push({ x: a.x, y: a.y, look: a.look, dir: a.dir ?? 'down', text: a.text ?? ['…'], ...(a.wander ? { wander: true } : {}) });
    }
    if (e.items || e.addItems) {
      m.items = (m.items ?? []).flatMap((it) => {
        const p = e.items?.[it.id];
        if (!p) return [it];
        if (p.remove) return [];
        if (Number.isInteger(p.x) && Number.isInteger(p.y)) { it.x = p.x; it.y = p.y; }
        return [it];
      });
      for (const a of e.addItems ?? []) m.items.push({ x: a.x, y: a.y, item: a.item, id: a.id });
    }
  }
}

/** Same size, and the same number of doors and signs (they are matched to their targets and texts in order). */
export function fitsTiles(before, after) {
  return after.length === before.length && after.every((r) => typeof r === 'string' && r.length === before[0].length)
    && count(after, 'D') === count(before, 'D') && count(after, 'S') === count(before, 'S');
}

export function mapEditsSource(map) {
  const keys = Object.keys(map).sort();
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])}`);
  return `// Map changes made in the visual map editor (map-editor.html), applied on top of the generated maps.
// Written by the editor: edit there, not by hand.
export const MAP_OVERRIDES = {
${lines.join(',\n')}${lines.length ? '\n' : ''}};
`;
}

export function parseMapEditsSource(src) {
  const start = src.indexOf('{', src.indexOf('MAP_OVERRIDES'));
  const end = src.lastIndexOf('}');
  if (start < 0 || end < start) return {};
  const body = src.slice(start, end + 1);
  return body.replace(/\s/g, '') === '{}' ? {} : JSON.parse(body);
}
