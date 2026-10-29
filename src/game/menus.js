// Panels: pause menu, party, summary, bag, PokeDex, trainer card, options,
// save, shop and PC storage.
import { h, clamp, formatTime, pad } from '../core/util.js';
import { keyName } from '../core/input.js';
import { sfx, setVolumes } from '../core/audio.js';
import { SPECIES, DEX_ORDER } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { TYPES } from '../data/types.js';
import { creatureIcon, silhouette } from '../gfx/creatures.js';
import { panel, say, choose, ask, closeDialog, toast, fmt } from './ui.js';
import { state, settings, saveSettings, addItem, removeItem, spend, earn, hasItem, badgeCount, PARTY_MAX, markCaught } from './state.js';
import { displayName, maxHp, calcStats, expForLevel, STAT_KEYS, STAT_NAMES, gainExp, canEvolve, tmCompatible, stoneEvolution } from './creature.js';
import { applyItem, STATUS_SHORT } from './battle-engine.js';
import { saveGame, listSaves } from '../save/index.js';
import { MAPS } from '../data/maps.js';
import { OUTLINE, PLACES, ROUTES, LINKS, VIEW, TREES, HILLS, project } from '../data/atlas.js';
import { charSprite } from '../gfx/characters.js';
import { itemIcon } from '../gfx/items.js';
import { SAVE_CONFIG } from '../save/config.js';

// ---------------------------------------------------------------- helpers
function hpBar(c) {
  const r = c.hp / maxHp(c);
  return h('div', { class: 'hpbar' }, h('span', { class: 'hpbar-label', text: 'PS' }),
    h('div', { class: 'hpbar-track' }, h('div', { class: 'hpbar-fill no-anim', style: { '--hp': r }, 'data-level': r > 0.5 ? 'good' : r > 0.2 ? 'mid' : 'low' })));
}
const typeChip = (t) => h('span', { class: 'type-chip', style: { '--type': TYPES[t].color }, text: TYPES[t].name });

/** Simple vertical list navigation inside a panel. */
function listNav(items, { onPick, onCancel, onMove, start = 0, cols = 1, extra }) {
  let idx = clamp(start, 0, Math.max(0, items.length - 1));
  const render = () => {
    items.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    items[idx]?.scrollIntoView({ block: 'nearest' });
    onMove?.(idx);
  };
  items.forEach((el, i) => el.addEventListener('click', () => { idx = i; render(); onPick(idx); }));
  render();
  return (a) => {
    if (extra?.(a, idx)) return;
    const n = items.length;
    if (!n) { if (a === 'b' || a === 'start') onCancel(); return; }
    if (a === 'up') { idx = (idx - cols + n) % n; sfx('select'); render(); }
    else if (a === 'down') { idx = (idx + cols) % n; sfx('select'); render(); }
    else if (a === 'left' && cols > 1) { idx = (idx - 1 + n) % n; sfx('select'); render(); }
    else if (a === 'right' && cols > 1) { idx = (idx + 1) % n; sfx('select'); render(); }
    else if (a === 'a') onPick(idx);
    else if (a === 'b' || a === 'start') { sfx('cancel'); onCancel(); }
  };
}

/** Run an async flow with the panel's input temporarily suspended. */
function suspend(el, fn) {
  el.classList.add('is-suspended');
  return fn().finally(() => el.classList.remove('is-suspended'));
}

// ---------------------------------------------------------------- PAUSE
export async function openPauseMenu() {
  const S = state();
  sfx('confirm');
  let flight = null;
  while (true) {
    const entries = [];
    if (S.flags.dex) entries.push(['PokeDex', openDex]);
    if (S.party.length) entries.push(['Equipo', () => openParty({ mode: 'field' })]);
    entries.push(['Mochila', () => openBag({ mode: 'field' })]);
    if (hasItem('mapa_uruguay')) entries.push(['Mapa', openMap]);
    if (hasItem('silbato')) entries.push(['Vuelo', async () => { flight = await pickFlight(); }]);
    entries.push([S.player.name, openCard]);
    entries.push(['Guardar', openSave]);
    entries.push(['Opciones', openOptions]);
    entries.push(['Volver', null]);
    const i = await choose(entries.map((e) => e[0]), { cls: 'menu-pause' });
    if (i < 0 || !entries[i][1]) return;
    await entries[i][1]();
    if (flight) {
      const { flyTo } = await import('./world.js');
      return flyTo(flight);
    }
  }
}

/** Silbato del Hornero: pick a visited city to fly to. Returns the destination or null. */
async function pickFlight() {
  const { flyPoints, worldState } = await import('./world.js');
  if (worldState.map?.indoor) { await say('Acá adentro no se puede usar.'); return null; }
  const pts = flyPoints();
  if (!pts.length) { await say('Todavía no conocés ninguna ciudad adonde volar.'); return null; }
  const i = await choose(pts.map((p) => p.name), { cls: 'menu-sub' });
  return i < 0 ? null : pts[i];
}

// ---------------------------------------------------------------- PARTY
/**
 * mode: 'field' | 'battle' | 'forced' | 'item' | 'select'
 * returns chosen index (battle/forced/item/select) or -1/null.
 */
export function openParty({ mode = 'field', active = -1, title } = {}) {
  const S = state();
  return panel('panel-party', (el, close) => {
    const head = h('header', { class: 'panel-title', text: title ?? (mode === 'forced' ? 'Elegí la próxima criatura' : mode === 'item' || mode === 'select' ? 'Elegí una criatura' : 'Equipo') });
    const list = h('ol', { class: 'party-list' });
    let swapFrom = null;
    const rows = [];
    const build = () => {
      rows.length = 0;
      list.replaceChildren(...S.party.map((c, i) => {
        const li = h('li', { class: `party-row ${c.hp <= 0 ? 'is-fainted' : ''} ${i === active ? 'is-current' : ''} ${swapFrom === i ? 'is-swapping' : ''}` },
          h('img', { src: creatureIcon(c.species), alt: '', class: 'party-icon', width: 80, height: 80 }),
          h('div', { class: 'party-main' },
            h('div', { class: 'party-name' }, h('span', { text: displayName(c) }), c.status ? h('span', { class: 'status-chip', 'data-status': c.status, text: STATUS_SHORT[c.status] }) : null),
            h('div', { class: 'party-lv', text: `Nv${c.level}` }),
            hpBar(c),
            h('div', { class: 'party-hp', text: `${c.hp}/${maxHp(c)}` }),
          ));
        rows.push(li);
        return li;
      }));
    };
    build();
    const foot = h('footer', { class: 'panel-foot', text: mode === 'forced' ? '' : 'B: volver' });
    el.append(head, list, foot);
    let nav;
    const makeNav = (start) => {
      nav = listNav(rows, {
        start,
        onCancel: () => { if (mode === 'forced') return sfx('bump'); if (swapFrom != null) { swapFrom = null; build(); nav = makeNav(start); return; } close(-1); },
        onPick: (i) => suspend(el, () => pick(i)),
      });
      return nav;
    };
    const pick = async (i) => {
      const c = S.party[i];
      if (swapFrom != null) {
        [S.party[swapFrom], S.party[i]] = [S.party[i], S.party[swapFrom]];
        swapFrom = null;
        sfx('confirm');
        build();
        makeNav(i);
        return;
      }
      if (mode === 'item' || mode === 'select') return close(i);
      if (mode === 'forced' || mode === 'battle') {
        const opts = ['Cambiar', 'Datos', 'Cancelar'];
        const r = await choose(opts, { cls: 'menu-sub' });
        if (r === 1) return openSummary(i);
        if (r !== 0) return;
        if (c.hp <= 0) return say(`¡${displayName(c)} no tiene energía para pelear!`);
        if (i === active) return say(`¡${displayName(c)} ya está en combate!`);
        return close(i);
      }
      const r = await choose(['Datos', 'Mover', 'Cancelar'], { cls: 'menu-sub' });
      if (r === 0) await openSummary(i);
      else if (r === 1) { swapFrom = i; build(); makeNav(i); }
    };
    makeNav(Math.max(0, mode === 'forced' ? S.party.findIndex((c) => c.hp > 0) : 0));
    return (a) => { if (!el.classList.contains('is-suspended')) nav(a); };
  });
}

// ---------------------------------------------------------------- SUMMARY
export function openSummary(index) {
  const S = state();
  let i = index;
  return panel('panel-summary', (el, close) => {
    const render = () => {
      const c = S.party[i];
      const sp = SPECIES[c.species];
      const st = calcStats(c);
      const next = c.level >= 100 ? 0 : expForLevel(c.level + 1) - c.exp;
      el.replaceChildren(
        h('header', { class: 'panel-title' }, h('span', { text: `#${pad(sp.id)} ${displayName(c)}` }), h('span', { text: `Nv${c.level}` })),
        h('div', { class: 'summary-grid' },
          h('div', { class: 'summary-art' },
            h('img', { src: creatureIcon(c.species), alt: sp.name, width: 80, height: 80 }),
            h('div', { class: 'chips' }, sp.types.map(typeChip)),
            h('p', { class: 'small', text: `Especie: ${sp.name}` }),
            h('p', { class: 'small', text: `EO: ${c.ot ?? S.player.id}` }),
            h('p', { class: 'small', text: next ? `EXP para Nv${c.level + 1}: ${next}` : 'Nivel máximo' }),
          ),
          h('div', { class: 'summary-stats' },
            h('div', { class: 'row' }, h('span', { text: 'PS' }), h('b', { text: `${c.hp}/${st.hp}` })),
            ...STAT_KEYS.slice(1).map((k) => h('div', { class: 'row' }, h('span', { text: STAT_NAMES[k] }), h('b', { text: String(st[k]) }))),
          ),
        ),
        h('ul', { class: 'summary-moves' }, c.moves.map((m) => {
          const d = MOVES[m.id];
          return h('li', {},
            h('div', { class: 'row' }, typeChip(d.type), h('b', { text: d.name }), h('span', { text: `PP ${m.pp}/${d.pp}` })),
            h('div', { class: 'small', text: `${d.cat === 'est' ? 'Estado' : d.cat === 'fis' ? 'Físico' : 'Especial'} · Pot. ${d.power || '—'} · Prec. ${d.acc} — ${d.desc}` }));
        })),
        h('footer', { class: 'panel-foot', text: `↑↓ cambiar · ${keyName('b')} volver` }),
      );
    };
    render();
    return (a) => {
      if (a === 'b' || a === 'a' || a === 'start') { sfx('cancel'); close(); }
      else if (a === 'up' || a === 'down') { i = (i + (a === 'up' ? -1 : 1) + S.party.length) % S.party.length; sfx('select'); render(); }
    };
  });
}

// ---------------------------------------------------------------- BAG
const POCKETS = [['items', 'Objetos'], ['balls', 'Pokeballs'], ['key', 'Clave']];

function itemUsable(key, c) {
  const it = ITEMS[key];
  if (it.tm) return tmCompatible(c.species, it.tm) && !c.moves.some((m) => m.id === it.tm);
  if (it.stone) return !!stoneEvolution(c, key);
  if (it.revive) return c.hp <= 0;
  if (c.hp <= 0) return false;
  if (it.heal && c.hp < maxHp(c)) return true;
  if (it.cure && c.status && (it.cure === 'all' || it.cure === c.status)) return true;
  if (it.pp) return c.moves.some((m) => m.pp < MOVES[m.id].pp);
  if (it.rareCandy) return c.level < 100;
  return false;
}

/** mode 'field' | 'battle'. Battle returns {item, target} or null. */
export function openBag({ mode = 'field', wild = false } = {}) {
  const S = state();
  let pocket = 0;
  return panel('panel-bag', (el, close) => {
    const tabs = h('nav', { class: 'bag-tabs' });
    const list = h('ul', { class: 'bag-list' });
    const desc = h('p', { class: 'bag-desc' });
    el.append(h('header', { class: 'panel-title', text: 'Mochila' }), tabs, list, desc, h('footer', { class: 'panel-foot', text: `←→ bolsillo · ${keyName('a')} usar · ${keyName('b')} volver` }));
    let keys = [];
    let nav;
    const render = (start = 0) => {
      tabs.replaceChildren(...POCKETS.map(([, n], i) => h('span', { class: i === pocket ? 'is-active' : '', text: n })));
      keys = Object.keys(S.bag).filter((k) => ITEMS[k]?.pocket === POCKETS[pocket][0]);
      const rows = keys.map((k) => h('li', {}, h('span', { class: 'item-name' }, h('img', { class: 'item-icon', src: itemIcon(k), alt: '' }), ITEMS[k].name), h('b', { text: ITEMS[k].pocket === 'key' ? '' : `×${S.bag[k]}` })));
      if (!rows.length) desc.textContent = 'No hay nada en este bolsillo.';
      list.replaceChildren(...rows);
      nav = listNav(rows, {
        start,
        onMove: (i) => (desc.textContent = keys[i] ? ITEMS[keys[i]].desc : ''),
        onCancel: () => close(null),
        onPick: (i) => suspend(el, () => use(keys[i], i)),
        extra: (a) => {
          if (a === 'left' || a === 'right') {
            pocket = (pocket + (a === 'left' ? -1 : 1) + POCKETS.length) % POCKETS.length;
            sfx('select');
            render();
            return true;
          }
          return false;
        },
      });
    };
    const use = async (key, i) => {
      if (!key) return;
      const it = ITEMS[key];
      if (mode === 'battle') {
        if (it.pocket === 'key') return say('¡No es momento de usar eso!');
        if (it.ball) {
          if (S.party.length >= PARTY_MAX && S.box.length >= 500) return say('¡No hay lugar para más criaturas!');
          return close({ item: key });
        }
        if (it.repel) return say('¡No es momento de usar eso!');
        if (it.tm || it.stone) return say('Mejor usala fuera de combate.');
        if (it.rareCandy) return say('Mejor usala fuera de combate.');
        if (it.xstat) {
          const act = S.party.findIndex((c) => c.hp > 0);
          return close({ item: key, target: act });
        }
        const t = await openParty({ mode: 'item', title: `Usar ${it.name}` });
        if (t < 0) return;
        if (!itemUsable(key, S.party[t])) return say('No tendría ningún efecto.');
        return close({ item: key, target: t });
      }
      const r = await choose(['Usar', 'Tirar', 'Cancelar'], { cls: 'menu-sub' });
      if (r === 1) {
        if (it.pocket === 'key') return say('¡Eso es muy importante para tirarlo!');
        if (await ask(`¿Tirar 1 ${it.name}?`)) { removeItem(key, 1); render(Math.min(i, keys.length - 1)); }
        return;
      }
      if (r !== 0) return;
      await useInField(key);
      render(Math.min(i, Object.keys(S.bag).length));
    };
    render();
    return (a) => { if (!el.classList.contains('is-suspended')) nav(a); };
  });
}

async function useInField(key) {
  const S = state();
  const it = ITEMS[key];
  if (key === 'uru_dex') return openDex();
  if (key === 'mapa_uruguay') return openMap();
  if (it.pocket === 'key') return say(it.desc);
  if (it.ball) return say('¡Las Pokeballs se usan en combate!');
  if (it.repel) {
    S.repel = it.repel;
    removeItem(key, 1);
    sfx('confirm');
    return say(`Usaste ${it.name}. Las criaturas débiles no se van a acercar.`);
  }
  if (it.xstat) return say('Solo se puede usar en combate.');
  const t = await openParty({ mode: 'item', title: `Usar ${it.name}` });
  if (t < 0) return;
  const c = S.party[t];
  if (!itemUsable(key, c)) return say('No tendría ningún efecto.');
  if (it.tm) {
    const { learnFlow } = await import('./battle-scene.js');
    await learnFlow(c, it.tm);
    // Solo se gasta si la criatura realmente aprendió el movimiento.
    if (c.moves.some((m) => m.id === it.tm)) removeItem(key, 1);
    return;
  }
  if (it.stone) {
    const { evolutionScene } = await import('./battle-scene.js');
    const to = stoneEvolution(c, key);
    removeItem(key, 1);
    return evolutionScene(c, to);
  }
  removeItem(key, 1);
  if (it.rareCandy) {
    const { learnFlow, evolutionScene } = await import('./battle-scene.js');
    const evs = gainExp(c, expForLevel(c.level + 1) - c.exp);
    sfx('levelup');
    for (const ev of evs) {
      if (ev.type === 'level') await say(`¡${displayName(c)} subió al nivel ${ev.level}!`);
      else await learnFlow(c, ev.move);
    }
    if (canEvolve(c)) await evolutionScene(c);
    return;
  }
  const msg = applyItem(key, c);
  sfx('heal');
  await say(msg ?? 'No tuvo efecto.');
}

// ---------------------------------------------------------------- DEX
export function openDex() {
  const S = state();
  return panel('panel-dex', (el, close) => {
    const seen = new Set(S.dex.seen);
    const caught = new Set(S.dex.caught);
    const head = h('header', { class: 'panel-title' }, h('span', { text: 'PokeDex' }), h('span', { text: `Vistos ${seen.size} · Atrapados ${caught.size}` }));
    const grid = h('ul', { class: 'dex-grid' });
    const rows = DEX_ORDER.map((k) => {
      const sp = SPECIES[k];
      const known = seen.has(k);
      return h('li', { class: `${caught.has(k) ? 'is-caught' : ''}` },
        h('img', { src: known ? creatureIcon(k) : silhouette(k), alt: '', width: 80, height: 80 }),
        h('span', { class: 'num', text: pad(sp.id) }),
        h('span', { class: 'name', text: known ? sp.name : '???' }));
    });
    grid.append(...rows);
    el.append(head, grid, h('footer', { class: 'panel-foot', text: `${keyName('a')} ver detalle · ${keyName('b')} volver` }));
    let detail = null;
    const nav = listNav(rows, {
      cols: 4,
      onCancel: () => close(),
      onPick: (i) => {
        const k = DEX_ORDER[i];
        if (!seen.has(k)) return sfx('bump');
        sfx('confirm');
        const sp = SPECIES[k];
        const isCaught = caught.has(k);
        detail = h('div', { class: 'dex-detail' },
          h('header', { class: 'panel-title', text: `#${pad(sp.id)} ${sp.name}` }),
          h('div', { class: 'dex-body' },
            h('img', { src: creatureIcon(k), alt: sp.name, width: 80, height: 80 }),
            h('div', {},
              h('div', { class: 'chips' }, sp.types.map(typeChip)),
              h('p', { text: isCaught ? sp.desc : 'Atrapalo para saber más sobre esta criatura.' }),
              isCaught ? h('div', { class: 'base-stats' }, STAT_KEYS.map((s, j) => h('div', { class: 'row' }, h('span', { text: STAT_NAMES[s] }), h('i', { style: { '--v': sp.base[j] / 160 } }), h('b', { text: String(sp.base[j]) })))) : null,
              sp.evo && isCaught ? h('p', { class: 'small', text: sp.evo.stone ? `Evoluciona con ${ITEMS[sp.evo.stone].name}.` : `Evoluciona en el nivel ${sp.evo.lvl}.` }) : null,
            )),
          h('footer', { class: 'panel-foot', text: `${keyName('b')} volver` }));
        el.append(detail);
      },
    });
    return (a) => {
      if (detail) {
        if (a === 'a' || a === 'b' || a === 'start') { detail.remove(); detail = null; sfx('cancel'); }
        return;
      }
      nav(a);
    };
  });
}

// ---------------------------------------------------------------- MAP
/** Where the player is, as a point on the atlas: a place id, or a spot between two places for routes. */
function atlasHere() {
  const S = state();
  let m = MAPS[S.pos.map];
  if (m?.indoor) m = MAPS[m.exitTo?.map] ?? m;
  const id = m?.id;
  const place = PLACES.find((p) => p.id === id);
  if (place) return { id, at: project(place.lon, place.lat), label: place.name };
  if (ROUTES[id]) {
    const [a, b] = ROUTES[id].map((k) => PLACES.find((p) => p.id === k));
    const pa = project(a.lon, a.lat);
    const pb = project(b.lon, b.lat);
    return { id, at: [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], label: m.name };
  }
  return null;
}

export function openMap() {
  const S = state();
  const visited = (id) => !!S.flags[`v_${id}`];
  const here = atlasHere();
  const pts = Object.fromEntries(PLACES.map((p) => [p.id, project(p.lon, p.lat)]));
  const land = OUTLINE.map(([lo, la]) => project(lo, la).join(',')).join(' ');
  const outline = (dy) => `<polygon points="${OUTLINE.map(([lo, la]) => { const [x, y] = project(lo, la); return `${x},${y + dy}`; }).join(' ')}"`;
  // Roads: slightly curved so the map reads like a board-game overworld.
  const road = ([a, b], i) => {
    const [x1, y1] = pts[a];
    const [x2, y2] = pts[b];
    const k = i % 2 ? 6 : -6;
    const cx = (x1 + x2) / 2 - ((y2 - y1) / Math.hypot(x2 - x1, y2 - y1)) * k;
    const cy = (y1 + y2) / 2 + ((x2 - x1) / Math.hypot(x2 - x1, y2 - y1)) * k;
    return `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
  };
  const roads = LINKS.map(road);
  const pine = ([lo, la]) => { const [x, y] = project(lo, la); return `<g transform="translate(${x} ${y})"><path d="M0 -9 L5 0 L-5 0 Z" class="pine"/><path d="M0 -5 L6 5 L-6 5 Z" class="pine"/><rect x="-1" y="5" width="2" height="3" class="trunk"/></g>`; };
  const hill = ([lo, la]) => { const [x, y] = project(lo, la); return `<path d="M${x - 9} ${y} a9 9 0 0 1 18 0 Z" class="hill"/><circle cx="${x - 3}" cy="${y - 4}" r="1" class="eye"/><circle cx="${x + 3}" cy="${y - 4}" r="1" class="eye"/>`; };
  const cloud = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})" class="cloud"><ellipse cx="0" cy="0" rx="12" ry="6"/><ellipse cx="-7" cy="2" rx="8" ry="5"/><ellipse cx="8" cy="2" rx="9" ry="5"/></g>`;
  const dots = PLACES.map((p) => {
    const [x, y] = pts[p.id];
    const cls = `node k-${p.kind} ${visited(p.id) ? 'is-seen' : ''}`;
    const gym = p.kind === 'city' ? `<circle cx="${x}" cy="${y - 0.5}" r="2.6" fill="${p.color ?? '#fff'}" class="pip"/>` : '';
    const mark = p.kind === 'place' ? `<path d="M${x} ${y - 5} L${x + 3.5} ${y + 2} L${x - 3.5} ${y + 2} Z" class="pip" fill="#fff"/>` : '';
    return `<g class="${cls}"><ellipse cx="${x}" cy="${y + 2.4}" rx="8" ry="5.2" class="base"/><ellipse cx="${x}" cy="${y}" rx="8" ry="5.2" class="top"/>${gym}${mark}</g>`;
  }).join('');
  const pc = charSprite(S.player.look, 'down', 0);
  const face = document.createElement('canvas');
  face.width = face.height = 40;
  const fg = face.getContext('2d');
  fg.imageSmoothingEnabled = false;
  fg.fillStyle = '#fff'; fg.beginPath(); fg.arc(20, 20, 19, 0, 7); fg.fill();
  fg.strokeStyle = '#16141e'; fg.lineWidth = 2; fg.stroke();
  fg.save(); fg.beginPath(); fg.arc(20, 20, 17.5, 0, 7); fg.clip();
  fg.drawImage(pc, 2, 0, 12, 11, 4, 5, 32, 29);
  fg.restore();
  const faceUrl = face.toDataURL();
  const svg = `<svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" role="img" aria-label="Mapa de Uruguay">
    <defs><linearGradient id="sea-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b92c4"/><stop offset="1" stop-color="#3f78ad"/></linearGradient></defs>
    
    <g class="waves"><path d="M18 205q4-4 8 0t8 0t8 0M26 213q4-4 8 0t8 0M10 222q4-4 8 0t8 0t8 0"/></g>
    ${outline(7)} class="shade"/>
    ${outline(0)} class="land"/>
    <g class="decor">${TREES.map(pine).join('')}${HILLS.map(hill).join('')}</g>
    <g class="roads">${roads.map((d) => `<path d="${d}" class="r-edge"/>`).join('')}${roads.map((d) => `<path d="${d}" class="r-fill"/>`).join('')}</g>
    ${dots}
    <g id="map-cursor" class="cursor"><ellipse rx="11.5" ry="7.5"/></g>
    ${here ? `<image id="map-face" class="face" href="${faceUrl}" x="${here.at[0] - 10}" y="${here.at[1] - 28}" width="20" height="20"/>` : ''}
    ${cloud(40, 40, 1.2)}${cloud(285, 215, 1.1)}${cloud(300, 120, 0.8)}${cloud(36, 150, 0.8)}${cloud(215, 18, 0.9)}
    <g class="title"><text x="272" y="64">URUGUAY</text>${Array.from({ length: 9 }, (_, i) => `<rect x="251" y="${10 + i * 3.4}" width="42" height="3.4" fill="${i % 2 ? '#5aa8e8' : '#fff'}"/>`).join('')}<rect x="251" y="10" width="17" height="17" fill="#fff"/><circle cx="259.5" cy="18.5" r="5" fill="#f2c02a" stroke="#c8902a" stroke-width="0.8"/></g>
  </svg>`;
  return panel('panel-map', (el, close) => {
    const wrap = h('div', { class: 'map-svg' });
    wrap.innerHTML = svg;
    const tag = h('div', { class: 'map-tag' }, h('b', { class: 'tag-name' }), h('small', { class: 'tag-note' }));
    el.append(
      h('header', { class: 'panel-title' }, h('span', { text: 'Mapa' }), h('span', { text: here ? `Estás en: ${here.label}` : '' })),
      wrap, tag,
      h('footer', { class: 'panel-foot', text: `←→↑↓ moverte por el mapa · ${keyName('b')} volver` }),
    );
    // Cursor graph: neighbours along the roads, picked by direction like the classic overworld map.
    const nb = Object.fromEntries(PLACES.map((p) => [p.id, []]));
    for (const [a, b] of LINKS) { nb[a].push(b); nb[b].push(a); }
    const dirs = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    const dist = (id) => Math.hypot(pts[id][0] - here.at[0], pts[id][1] - here.at[1]);
    let cur = !here ? PLACES[0].id : pts[here.id] ? here.id : PLACES.map((p) => p.id).sort((x, y) => dist(x) - dist(y))[0];
    const cursor = wrap.querySelector('#map-cursor');
    const show = () => {
      const p = PLACES.find((q) => q.id === cur);
      const [x, y] = pts[cur];
      cursor.setAttribute('transform', `translate(${x} ${y + 1})`);
      const seen = visited(cur);
      tag.querySelector('.tag-name').textContent = seen ? p.name : '???';
      tag.querySelector('.tag-note').textContent = seen ? `${p.kind === 'city' ? 'Ciudad con gimnasio' : p.kind === 'loc' ? 'Localidad' : 'Lugar especial'} · ${p.note}${here?.id === cur ? ' · Estás acá' : ''}` : 'Todavía no fuiste a este lugar.';
    };
    show();
    return (a) => {
      if (a === 'a' || a === 'b' || a === 'start') { sfx('cancel'); close(); return; }
      const d = dirs[a];
      if (!d) return;
      const [cx, cy] = pts[cur];
      let best = null;
      let bestScore = 0.35;
      for (const id of nb[cur]) {
        const [x, y] = pts[id];
        const len = Math.hypot(x - cx, y - cy);
        const score = ((x - cx) * d[0] + (y - cy) * d[1]) / len;
        if (score > bestScore) { bestScore = score; best = id; }
      }
      if (!best) return void sfx('bump');
      cur = best;
      sfx('select');
      show();
    };
  });
}

// ---------------------------------------------------------------- CARD
export function openCard() {
  const S = state();
  return panel('panel-card', (el, close) => {
    const badges = [['badge1', 'Montevideo', '#3f86e0'], ['badge2', 'Maldonado', '#e8c21c'], ['badge3', 'Treinta y Tres', '#a48e48']];
    el.append(
      h('header', { class: 'panel-title' }, h('span', { text: 'Carnet de Entrenador' }), h('span', { text: `ID ${S.player.id}` })),
      h('div', { class: 'card-body' },
        h('dl', {},
          h('dt', { text: 'Nombre' }), h('dd', { text: S.player.name }),
          h('dt', { text: 'Dinero' }), h('dd', { text: `$${S.player.money.toLocaleString('es-UY')}` }),
          h('dt', { text: 'PokeDex' }), h('dd', { text: `${S.dex.caught.length} / ${DEX_ORDER.length}` }),
          h('dt', { text: 'Tiempo' }), h('dd', { text: formatTime(S.stats.playtime) }),
          h('dt', { text: 'Victorias' }), h('dd', { text: String(S.stats.battlesWon) }),
          h('dt', { text: 'Inicio' }), h('dd', { text: new Date(S.created).toLocaleDateString('es-UY') }),
        ),
        h('div', { class: 'card-flag', 'aria-hidden': 'true' }),
      ),
      h('ul', { class: 'badges' }, badges.map(([f, n, col]) => h('li', { class: S.flags[f] ? 'is-earned' : '', style: { '--badge': col } }, h('i'), h('span', { text: n })))),
      S.flags.champion ? h('p', { class: 'champion-line', text: '★ Campeón de la Liga Oriental ★' }) : '',
      h('footer', { class: 'panel-foot', text: `${keyName('b')} volver` }),
    );
    return (a) => { if (a === 'a' || a === 'b' || a === 'start') { sfx('cancel'); close(); } };
  });
}

// ---------------------------------------------------------------- OPTIONS
export function openOptions() {
  return panel('panel-options', (el, close) => {
    const rows = [
      { label: 'Velocidad del texto', get: () => ['Lenta', 'Normal', 'Rápida'][settings.textSpeed - 1], step: (d) => (settings.textSpeed = clamp(settings.textSpeed + d, 1, 3)) },
      { label: 'Música', get: () => `${Math.round(settings.music * 10)}`, step: (d) => (settings.music = clamp(Math.round((settings.music + d * 0.1) * 10) / 10, 0, 1)) },
      { label: 'Efectos', get: () => `${Math.round(settings.sfx * 10)}`, step: (d) => (settings.sfx = clamp(Math.round((settings.sfx + d * 0.1) * 10) / 10, 0, 1)) },
      { label: 'Animaciones', get: () => (settings.anims ? 'Sí' : 'No'), step: () => (settings.anims = !settings.anims) },
      { label: 'Controles', get: () => 'Ver', step: () => { openControls(); }, noArrows: true },
    ];
    const items = rows.map((r) => h('li', {}, h('span', { text: r.label }), h('b', { text: '' })));
    const refresh = () => rows.forEach((r, i) => (items[i].querySelector('b').textContent = r.noArrows ? `▶ ${r.get()}` : `◀ ${r.get()} ▶`));
    refresh();
    el.append(h('header', { class: 'panel-title', text: 'Opciones' }), h('ul', { class: 'options-list' }, items),
      h('footer', { class: 'panel-foot', text: `←→ cambiar · ${keyName('b')} volver` }));
    const nav = listNav(items, {
      onCancel: () => { saveSettings(); setVolumes(settings); close(); },
      onPick: (i) => { if (rows[i].noArrows) { sfx('select'); rows[i].step(); } },
      extra: (a, i) => {
        if (rows[i].noArrows) return false;
        if (a === 'left' || a === 'right' || a === 'a') {
          rows[i].step(a === 'left' ? -1 : 1);
          setVolumes(settings);
          sfx('select');
          refresh();
          return true;
        }
        return false;
      },
    });
    return nav;
  });
}

const CONTROLS = [
  ['Flechas / W A S D', 'Mover al personaje'],
  ['Z / J', 'Aceptar, hablar, interactuar (botón A)'],
  ['X / K / Shift / Retroceso', 'Cancelar, volver (botón B)'],
  ['Espacio (mantener)', 'Caminar 1,5x más rápido'],
  ['Enter / Esc / M / Tab', 'Abrir el menú (en el menú, Enter acepta)'],
  ['N', 'Silenciar o activar la música'],
  ['O', 'Abrir ajustes'],
  ['P', 'Mostrar u ocultar el equipo'],
  ['T', 'Abrir el Mapa de Uruguay (cuando lo tengas)'],
  ['F2', 'Panel de errores y notas'],
  ['Gamepad / pantalla táctil', 'Cruz = mover · A y B = botones del mismo nombre'],
];

export function openControls() {
  return panel('panel-controls', (el, close) => {
    el.append(h('header', { class: 'panel-title', text: 'Controles' }),
      h('dl', { class: 'controls-list' }, CONTROLS.flatMap(([k, d]) => [h('dt', { text: k }), h('dd', { text: d })])),
      h('footer', { class: 'panel-foot', text: `${keyName('b')} volver` }));
    return (a) => { if (a === 'a' || a === 'b' || a === 'start') { sfx('cancel'); close(); } };
  });
}

// ---------------------------------------------------------------- SAVE
export async function openSave() {
  const S = state();
  const saves = await listSaves().catch(() => []);
  const bySlot = Object.fromEntries(saves.map((s) => [s.slot, s]));
  const opts = Array.from({ length: SAVE_CONFIG.slots }, (_, i) => {
    const s = bySlot[i + 1];
    return { label: `Ranura ${i + 1}`, hint: s ? `${s.summary.name} · ${s.summary.badges}🏅 · ${formatTime(s.summary.playtime)}` : 'Vacía' };
  });
  const start = Math.max(0, (S.slot ?? 1) - 1);
  await say('¿En qué ranura querés guardar?', { keep: true });
  const i = await choose(opts, { cls: 'menu-slots', start });
  closeDialog();
  if (i < 0) return;
  const slot = i + 1;
  if (bySlot[slot] && slot !== S.slot && !(await ask('Esa ranura ya tiene una partida. ¿Sobrescribirla?'))) return;
  try {
    S.saveCount++;
    await saveGame(slot, S);
    S.slot = slot;
    sfx('levelup');
    await say(`{player} guardó la partida en la ranura ${slot}.`);
  } catch (err) {
    S.saveCount--;
    sfx('bump');
    await say(['No se pudo guardar.', String(err.message)]);
  }
}

// ---------------------------------------------------------------- SHOP
export async function openShop(stock) {
  const S = state();
  while (true) {
    const r = await choose(['Comprar', 'Vender', 'Chau'], { cls: 'menu-sub', title: `$${S.player.money}` });
    closeDialog();
    if (r === 0) await buyFlow(stock);
    else if (r === 1) await sellFlow();
    else break;
    await say('¿Algo más?', { name: 'Almacenero', keep: true });
  }
  await say('¡Gracias! ¡Volvé pronto!', { name: 'Almacenero' });
}

function qtyPicker(title, unit, max) {
  return panel('panel-qty', (el, close) => {
    let q = 1;
    const val = h('b');
    const tot = h('span');
    const upd = () => { val.textContent = `×${pad(q, 2)}`; tot.textContent = `$${q * unit}`; };
    upd();
    el.append(h('div', { class: 'menu-title', text: title }), h('div', { class: 'qty-row' }, val, tot), h('footer', { class: 'panel-foot', text: '↑↓ ±1 · ←→ ±10' }));
    return (a) => {
      if (a === 'up') q = q >= max ? 1 : q + 1;
      else if (a === 'down') q = q <= 1 ? max : q - 1;
      else if (a === 'right') q = Math.min(max, q + 10);
      else if (a === 'left') q = Math.max(1, q - 10);
      else if (a === 'a') { sfx('confirm'); return close(q); }
      else if (a === 'b') { sfx('cancel'); return close(0); }
      sfx('select');
      upd();
    };
  });
}

async function buyFlow(stock) {
  const S = state();
  while (true) {
    const opts = stock.map((k) => ({ label: ITEMS[k].name, icon: itemIcon(k), hint: `$${ITEMS[k].price}` }));
    const i = await choose(opts, { cls: 'menu-shop', title: `Tenés $${S.player.money}`, onMove: (j) => descToast(stock[j]) });
    clearDescToast();
    if (i < 0) return;
    const k = stock[i];
    const it = ITEMS[k];
    const maxAfford = Math.floor(S.player.money / it.price);
    if (maxAfford < 1) { await say('No te alcanza la plata.', { name: 'Almacenero' }); continue; }
    const q = await qtyPicker(it.name, it.price, Math.min(99 - (S.bag[k] ?? 0), maxAfford, 99));
    if (!q) continue;
    if (!(await ask(`${it.name} ×${q} sale $${q * it.price}. ¿Te lo llevás?`, { name: 'Almacenero' }))) continue;
    if (!spend(q * it.price)) { await say('No te alcanza la plata.'); continue; }
    addItem(k, q);
    sfx('money');
    await say('¡Acá tenés! Gracias.', { name: 'Almacenero' });
    if (k === 'esfera' && q >= 10) {
      addItem('superesfera', 1);
      await say('Por comprar 10, te regalo una Superball.', { name: 'Almacenero' });
    }
  }
}

async function sellFlow() {
  const S = state();
  while (true) {
    const keys = Object.keys(S.bag).filter((k) => ITEMS[k].price > 0 && ITEMS[k].pocket !== 'key');
    if (!keys.length) return say('No tenés nada para vender.', { name: 'Almacenero' });
    const i = await choose(keys.map((k) => ({ label: `${ITEMS[k].name} ×${S.bag[k]}`, icon: itemIcon(k), hint: `$${ITEMS[k].price / 2}` })), { cls: 'menu-shop', title: 'Vender' });
    if (i < 0) return;
    const k = keys[i];
    const unit = ITEMS[k].price / 2;
    const q = await qtyPicker(ITEMS[k].name, unit, S.bag[k]);
    if (!q) continue;
    if (!(await ask(`Te doy $${q * unit}. ¿Trato hecho?`, { name: 'Almacenero' }))) continue;
    removeItem(k, q);
    earn(q * unit);
    sfx('money');
  }
}

let descEl = null;
function descToast(k) {
  clearDescToast();
  descEl = h('div', { class: 'shop-desc', text: ITEMS[k].desc });
  document.querySelector('#ui')?.append(descEl);
}
function clearDescToast() {
  descEl?.remove();
  descEl = null;
}

// ---------------------------------------------------------------- PC
export async function openPC() {
  const S = state();
  await say('Encendiste la computadora. Se conectó a la Caja de Criaturas.', { keep: true });
  while (true) {
    const r = await choose(['Retirar', 'Depositar', 'Apagar'], { cls: 'menu-sub' });
    closeDialog();
    if (r === 0) {
      if (!S.box.length) { await say('La Caja está vacía.'); continue; }
      if (S.party.length >= PARTY_MAX) { await say('Tu equipo está lleno.'); continue; }
      const i = await choose(S.box.map((c) => ({ label: displayName(c), hint: `Nv${c.level}` })), { cls: 'menu-shop', title: 'Caja' });
      if (i < 0) continue;
      const [c] = S.box.splice(i, 1);
      S.party.push(c);
      sfx('confirm');
      await say(`Retiraste a ${displayName(c)}.`);
    } else if (r === 1) {
      if (S.party.length <= 1) { await say('¡No podés quedarte sin criaturas!'); continue; }
      const i = await openParty({ mode: 'select', title: 'Depositar' });
      if (i < 0) continue;
      const alive = S.party.filter((c, j) => j !== i && c.hp > 0).length;
      if (!alive) { await say('Necesitás al menos una criatura sana en el equipo.'); continue; }
      const [c] = S.party.splice(i, 1);
      S.box.push(c);
      sfx('confirm');
      await say(`Depositaste a ${displayName(c)} en la Caja.`);
    } else return;
  }
}

export { hasItem, badgeCount, markCaught, fmt, toast };
