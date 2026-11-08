// Panels: pause menu, party, summary, bag, PokeDex, trainer card, options,
// save, shop and PC storage.
import { h, clamp, formatTime, pad, wait } from '../core/util.ts';
import { keyName } from '../core/input.ts';
import { sfx, setVolumes, cry } from '../core/audio.ts';
import { SPECIES, DEX_ORDER } from '../data/species.ts';
import { MOVES } from '../data/moves.ts';
import { ITEMS } from '../data/items.ts';
import { TYPES } from '../data/types.ts';
import { creatureIcon, silhouette } from '../gfx/creatures.ts';
import { panel, say, choose, ask, closeDialog, toast, fmt } from './ui.ts';
import { capital, weekday, dateText, timeText, dayNumber } from './calendar.ts';
import { state, settings, saveSettings, addItem, removeItem, spend, earn, hasItem, badgeCount, PARTY_MAX, markCaught } from './state.ts';
import { displayName, maxHp, calcStats, expForLevel, STAT_KEYS, STAT_NAMES, gainExp, canEvolve, tmCompatible, stoneEvolution } from './creature.ts';
import { applyItem, STATUS_SHORT } from './battle-engine.ts';
import { saveGame, listSaves } from '../save/index.ts';
import { MAPS } from '../data/maps.ts';
import { OUTLINE, PLACES, ROUTES, LINKS, VIEW, BIOMES, DEPARTMENTS, PLACE_DEPT, project } from '../data/atlas.ts';
import { charSprite } from '../gfx/characters.ts';
import { itemIcon } from '../gfx/items.ts';
import { badgeIcon } from '../gfx/badges.ts';
import { badgeOf } from '../data/route.ts';
import { isDev } from '../core/devauth.ts';
import { SAVE_CONFIG } from '../save/config.ts';

// ---------------------------------------------------------------- helpers
function hpBar(c) {
  const r = c.hp / maxHp(c);
  return h('div', { class: 'hpbar' }, h('span', { class: 'hpbar-label', text: 'PS' }),
    h('div', { class: 'hpbar-track' }, h('div', { class: 'hpbar-fill no-anim', style: { '--hp': r }, 'data-level': r > 0.5 ? 'good' : r > 0.2 ? 'mid' : 'low' })));
}
const typeChip = (t) => h('span', { class: 'type-chip', style: { '--type': TYPES[t].color }, text: TYPES[t].name });

/** Simple vertical list navigation inside a panel. */
function listNav(items, { onPick, onCancel, onMove, start = 0, cols = 1, extra, skip }: { onPick?: any; onCancel?: any; onMove?: any; start?: number; cols?: number; extra?: any; skip?: (i: number) => boolean }) {
  let idx = clamp(start, 0, Math.max(0, items.length - 1));
  // rows the cursor must not stop on (creatures that cannot take the item); if every row is skipped nothing is
  const skipping = skip && items.some((_, i) => !skip(i)) ? skip : null;
  const settle = (i: number, step: number) => { let k = 0; while (skipping?.(i) && k++ < items.length) i = (i + step + items.length) % items.length; return i; };
  idx = settle(idx, 1);
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
    // In a grid, up/down only move between rows when there is more than one row.
    if (a === 'up' || a === 'down') {
      if (cols > 1 && n <= cols) return;
      idx = settle(a === 'up' ? (idx - cols + n) % n : (idx + cols) % n, a === 'up' ? -cols : cols);
      sfx('select'); render();
    }
    else if (a === 'left' && cols > 1) { idx = settle((idx - 1 + n) % n, -1); sfx('select'); render(); }
    else if (a === 'right' && cols > 1) { idx = settle((idx + 1) % n, 1); sfx('select'); render(); }
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
  sfx('menu');
  let flight = null;
  while (true) {
    const entries = [];
    if (S.flags.dex) entries.push(['PokeDex', openDex]);
    if (S.party.length) entries.push(['Equipo', () => openParty({ mode: 'field' })]);
    entries.push(['Mochila', () => openBag({ mode: 'field' })]);
    if (hasItem('mapa_uruguay')) entries.push(['Mapa', openMap]);
    if (hasItem('farol')) entries.push(['Destello', async () => { const { useFlash } = await import('./world.ts'); await say(useFlash()); }]);
    if (hasItem('silbato')) entries.push(['Vuelo', async () => { flight = await pickFlight(); }]);
    if (isDev()) entries.push(['Desarrollo', async () => { const { openDevMenu } = await import('./devtools.ts'); flight = await openDevMenu(); }]);
    entries.push([S.player.name, openCard]);
    entries.push(['Guardar', openSave]);
    entries.push(['Opciones', openOptions]);
    entries.push(['Volver', null]);
    const i = await choose(entries.map((e) => e[0]), { cls: 'menu-pause', title: `${capital(weekday())} ${dateText()}` });
    if (i < 0 || !entries[i][1]) return;
    await entries[i][1]();
    if (flight) {
      const { flyTo } = await import('./world.ts');
      return flyTo(flight);
    }
  }
}

/** Silbato del Hornero: pick a visited city to fly to. Returns the destination or null. */
async function pickFlight() {
  const { flyPoints, worldState } = await import('./world.ts');
  if (!state().flags[badgeOf('florida')]) { await say('El hornero no te obedece todavía. Hace falta la Medalla Florida.'); return null; }
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
/** compat(c) -> { ok, label } marks each creature as able or not to take the item being used (TM, stone). */
export function openParty({ mode = 'field', active = -1, title, onUse, compat = null }: { mode?: string; active?: number; title?: string; onUse?: any; compat?: any } = {}): Promise<any> {
  const S = state();
  return panel('panel-party', (el, close) => {
    const head = h('header', { class: 'panel-title', text: title ?? (mode === 'forced' ? 'Elegí la próxima criatura' : mode === 'item' || mode === 'select' || mode === 'use' ? 'Elegí una criatura' : 'Equipo') });
    if (mode === 'forced') el.classList.add('is-forced');
    const list = h('ol', { class: 'party-list' });
    let swapFrom = null;
    const rows = [];
    // anim = { i, from }: row i is drawn with its old HP so the bar can slide to the new value.
    const build = (anim?) => {
      rows.length = 0;
      list.replaceChildren(...S.party.map((c, i) => {
        const shown = anim && anim.i === i ? { ...c, hp: anim.from } : c;
        const cp = compat ? compat(c) : null;
        const li = h('li', { class: `party-row ${shown.hp <= 0 ? 'is-fainted' : ''} ${i === active ? 'is-current' : ''} ${swapFrom === i ? 'is-swapping' : ''} ${cp ? (cp.ok ? 'is-compat' : 'is-incompat') : ''}` },
          h('img', { src: creatureIcon(c.species), alt: '', class: 'party-icon', width: 80, height: 80 }),
          h('div', { class: 'party-main' },
            h('div', { class: 'party-name' }, h('span', { text: displayName(c) }), c.status ? h('span', { class: 'status-chip', 'data-status': c.status, text: STATUS_SHORT[c.status] }) : null),
            h('div', { class: 'party-lv', text: `Nv${c.level}` }),
            hpBar(shown),
            h('div', { class: 'party-hp', text: `${shown.hp}/${maxHp(c)}` }),
            cp ? h('div', { class: `party-compat ${cp.ok ? 'is-ok' : 'is-no'}`, text: cp.label }) : null,
          ));
        rows.push(li);
        return li;
      }));
    };
    build();
    /** Shows the HP bar and counter of row i rising from `from` to its current value. */
    const animate = async (i, from) => {
      const c = S.party[i];
      if (c.hp === from) { build(); makeNav(i); return; }
      build({ i, from });
      makeNav(i);
      const fill = rows[i].querySelector('.hpbar-fill');
      const num = rows[i].querySelector('.party-hp');
      await wait(60);
      const r = c.hp / maxHp(c);
      fill.classList.remove('no-anim');
      fill.style.setProperty('--hp', r);
      fill.dataset.level = r > 0.5 ? 'good' : r > 0.2 ? 'mid' : 'low';
      rows[i].classList.remove('is-fainted');
      const steps = 14;
      for (let k = 1; k <= steps; k++) {
        num.textContent = `${Math.round(from + ((c.hp - from) * k) / steps)}/${maxHp(c)}`;
        if (k % 3 === 0) sfx('select');
        await wait(50);
      }
      num.textContent = `${c.hp}/${maxHp(c)}`;
      await wait(250);
    };
    const foot = h('footer', { class: 'panel-foot', text: mode === 'forced' ? '' : `${keyName('b')}: volver` });
    el.append(head, list, foot);
    let nav;
    const makeNav = (start) => {
      nav = listNav(rows, {
        start,
        cols: 3,
        skip: compat ? (i) => !compat(S.party[i]).ok : undefined,
        onCancel: () => { if (mode === 'forced') return sfx('bump'); if (swapFrom != null) { swapFrom = null; build(); nav = makeNav(start); return; } close(-1); },
        onPick: (i) => suspend(el, () => pick(i)),
      });
      return nav;
    };
    const pick = async (i) => {
      const c = S.party[i];
      if (mode === 'forced' && c.hp <= 0) return sfx('bump');
      if (swapFrom != null) {
        [S.party[swapFrom], S.party[i]] = [S.party[i], S.party[swapFrom]];
        swapFrom = null;
        sfx('confirm');
        build();
        makeNav(i);
        return;
      }
      if (compat && !compat(c).ok) return say(`${displayName(c)}: ${compat(c).label.toLowerCase()}.`);
      if (mode === 'item' || mode === 'select') return close(i);
      if (mode === 'use') { if (await onUse(i, animate)) close(i); return; }
      if (mode === 'forced' || mode === 'battle') {
        const opts = ['Cambiar', 'Datos', 'Cancelar'];
        const r = await choose(opts, { cls: 'menu-sub' });
        if (r === 1) return openSummary(i);
        if (r !== 0) return;
        if (c.hp <= 0) return say(`¡${displayName(c)} no tiene energía para pelear!`);
        if (i === active) return say(`¡${displayName(c)} ya está en combate!`);
        return close(i);
      }
      const opts = ['Datos', 'Mover', ...(c.held ? ['Quitar objeto'] : []), 'Cancelar'];
      const r = await choose(opts, { cls: 'menu-sub' });
      if (r === 0) await openSummary(i);
      else if (r === 1) { swapFrom = i; build(); makeNav(i); }
      else if (c.held && r === 2) {
        addItem(c.held, 1);
        await say(`${displayName(c)} devolvió ${ITEMS[c.held].name} a la mochila.`);
        c.held = null;
        build(); makeNav(i);
      }
    };
    makeNav(Math.max(0, mode === 'forced' ? S.party.findIndex((c) => c.hp > 0) : 0));
    return (a) => { if (!el.classList.contains('is-suspended')) nav(a); };
  });
}

// ---------------------------------------------------------------- SUMMARY
export function openSummary(index) {
  const S = state();
  let i = index;
  let cur = -1; // move-reorder cursor (-1 = off)
  let pick = -1; // move picked up to swap
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
            h('p', { class: 'small', text: c.held ? `Objeto: ${ITEMS[c.held]?.name}` : 'Objeto: —' }),
            h('p', { class: 'small', text: next ? `EXP para Nv${c.level + 1}: ${next}` : 'Nivel máximo' }),
          ),
          h('div', { class: 'summary-stats' },
            h('div', { class: 'row' }, h('span', { text: 'PS' }), h('b', { text: `${c.hp}/${st.hp}` })),
            ...STAT_KEYS.slice(1).map((k) => h('div', { class: 'row' }, h('span', { text: STAT_NAMES[k] }), h('b', { text: String(st[k]) }))),
          ),
        ),
        h('div', { class: 'mv-bar' + (cur >= 0 ? ' is-on' : '') },
          h('b', { text: 'Ataques' }),
          h('span', { text: cur < 0 ? `[${keyName('a')}] Reordenar ataques` : pick < 0 ? `↑↓ elegí el ataque · [${keyName('a')}] tomarlo · [${keyName('b')}] listo` : `↑↓ elegí con cuál cambiarlo · [${keyName('a')}] intercambiar · [${keyName('b')}] cancelar` })),
        h('ul', { class: 'summary-moves' }, c.moves.map((m) => {
          const d = MOVES[m.id];
          const k = c.moves.indexOf(m);
          return h('li', { style: k === pick ? { outline: '0.6cqi solid #e0a020', background: '#fff3c4' } : k === cur ? { outline: '0.6cqi solid #2a7de1', background: '#cfe8ff' } : {} },
            h('div', { class: 'row' }, typeChip(d.type), h('b', { text: (k === pick ? '⇄ ' : '') + d.name }), h('span', { text: `PP ${m.pp}/${d.pp}` })),
            h('div', { class: 'small', text: `${d.cat === 'est' ? 'Estado' : d.cat === 'fis' ? 'Físico' : 'Especial'} · Pot. ${d.power || '—'} · Prec. ${d.acc}` }),
            h('div', { class: 'small mv-desc', text: d.desc }));
        })),
        h('footer', { class: 'panel-foot', text: cur >= 0 ? `↑↓ elegir ataque · ${keyName('a')} ${pick >= 0 ? 'intercambiar' : 'tomar'} · ${keyName('b')} salir` : `↑↓ cambiar · ${keyName('a')} reordenar ataques · ${keyName('b')} volver` }),
      );
    };
    render();
    return (a) => {
      const c = S.party[i];
      if (cur >= 0) {
        if (a === 'b' || a === 'start') { sfx('cancel'); if (pick >= 0) pick = -1; else cur = -1; render(); }
        else if (a === 'up' || a === 'down') { cur = (cur + (a === 'up' ? -1 : 1) + c.moves.length) % c.moves.length; sfx('select'); render(); }
        else if (a === 'a') {
          sfx('select');
          if (pick < 0) pick = cur;
          else { if (pick !== cur) [c.moves[pick], c.moves[cur]] = [c.moves[cur], c.moves[pick]]; pick = -1; }
          render();
        }
      }
      else if (a === 'a' && c.moves.length > 1) { sfx('select'); cur = 0; render(); }
      else if (a === 'b' || a === 'a' || a === 'start') { sfx('cancel'); close(); }
      else if (a === 'up' || a === 'down') { i = (i + (a === 'up' ? -1 : 1) + S.party.length) % S.party.length; sfx('select'); render(); }
    };
  });
}

// ---------------------------------------------------------------- BAG
const POCKETS = [['items', 'Objetos'], ['tm', 'MT'], ['held', 'Equipables'], ['balls', 'Pokeballs'], ['key', 'Clave']];

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
        if (it.held) return say('Se equipa fuera de combate.');
        if (it.tm || it.stone) return say('Mejor usala fuera de combate.');
        if (it.rareCandy) return say('Mejor usala fuera de combate.');
        if (it.xstat || it.bait || it.focus) {
          const act = S.party.findIndex((c) => c.hp > 0);
          return close({ item: key, target: act });
        }
        const compat = (c) => {
    if (it.tm) {
      if (c.moves.some((m) => m.id === it.tm)) return { ok: false, label: 'Ya lo sabe' };
      return tmCompatible(c.species, it.tm) ? { ok: true, label: 'Apto' } : { ok: false, label: 'No apto' };
    }
    return itemUsable(key, c) ? { ok: true, label: 'Apto' } : { ok: false, label: 'No apto' };
  };
  const t = await openParty({ mode: 'item', title: `Usar ${it.name}`, compat });
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

/** Equip a held item on a team member (the one it replaces goes back to the bag). */
async function equipHeld(key) {
  const S = state();
  const it = ITEMS[key];
  const compat = (c) => (c.held === key ? { ok: false, label: 'Ya lo lleva' } : { ok: true, label: c.held ? `Cambia ${ITEMS[c.held]?.name ?? ''}` : 'Apto' });
  const t = await openParty({ mode: 'item', title: `Equipar ${it.name}`, compat });
  if (t < 0) return;
  const c = S.party[t];
  if (c.held === key) return say(`${displayName(c)} ya lleva ${it.name}.`);
  removeItem(key, 1);
  if (c.held) { addItem(c.held, 1); await say(`${displayName(c)} devolvió ${ITEMS[c.held].name} a la mochila.`); }
  c.held = key;
  sfx('confirm');
  await say(`${displayName(c)} lleva ${it.name}.`);
}

async function useInField(key) {
  const S = state();
  const it = ITEMS[key];
  if (key === 'uru_dex') return openDex();
  if (key === 'mapa_uruguay') return openMap();
  if (key === 'bici') {
    const { toggleBike } = await import('./world.ts');
    return say(toggleBike());
  }
  if (it.pocket === 'key') return say(it.desc);
  if (it.held) return equipHeld(key);
  if (it.ball) return say('¡Las Pokeballs se usan en combate!');
  if (it.repel) {
    S.repel = it.repel;
    removeItem(key, 1);
    sfx('confirm');
    return say(`Usaste ${it.name}. Las criaturas débiles no se van a acercar.`);
  }
  if (it.xstat || it.bait || it.focus) return say('Solo se puede usar en combate.');
  if (!it.tm && !it.stone && !it.rareCandy) {
    // Stay inside the party menu: the bar fills up there, then the player keeps choosing or goes back.
    await openParty({
      mode: 'use',
      title: `Usar ${it.name}`,
      onUse: async (i, animate) => {
        const c = S.party[i];
        if (!itemUsable(key, c)) { await say('No tendría ningún efecto.'); return false; }
        removeItem(key, 1);
        const from = c.hp;
        const msg = applyItem(key, c);
        sfx('heal');
        await animate(i, from);
        await say(msg ?? 'No tuvo efecto.');
        return !hasItem(key);
      },
    });
    return;
  }
  const compat = (c) => {
    if (it.tm) {
      if (c.moves.some((m) => m.id === it.tm)) return { ok: false, label: 'Ya lo sabe' };
      return tmCompatible(c.species, it.tm) ? { ok: true, label: 'Apto' } : { ok: false, label: 'No apto' };
    }
    return itemUsable(key, c) ? { ok: true, label: 'Apto' } : { ok: false, label: 'No apto' };
  };
  const t = await openParty({ mode: 'item', title: `Usar ${it.name}`, compat });
  if (t < 0) return;
  const c = S.party[t];
  if (!itemUsable(key, c)) return say('No tendría ningún efecto.');
  if (it.tm) {
    const { learnFlow } = await import('./battle-scene.ts');
    await learnFlow(c, it.tm);
    // Solo se gasta si la criatura realmente aprendió el movimiento.
    if (c.moves.some((m) => m.id === it.tm)) removeItem(key, 1);
    return;
  }
  if (it.stone) {
    const { evolutionScene } = await import('./battle-scene.ts');
    const to = stoneEvolution(c, key);
    removeItem(key, 1);
    return evolutionScene(c, to);
  }
  removeItem(key, 1);
  if (it.rareCandy) {
    const { learnFlow, evolutionScene } = await import('./battle-scene.ts');
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
    let keys: string[] = DEX_ORDER.slice();
    const list = h('ul', { class: 'dex-list' });
    // Left column: follows the highlighted row. Nothing is revealed for creatures not yet seen.
    const left = h('section', { class: 'dex-info' });
    const show = (i) => {
      const k = keys[i];
      if (!k) { left.replaceChildren(h('p', { class: 'dex-desc', text: 'Ninguna criatura coincide con la búsqueda.' })); return; }
      const sp = SPECIES[k];
      if (!seen.has(k)) {
        left.replaceChildren(
          h('img', { class: 'dex-art', src: silhouette(k), alt: '' }),
          h('div', { class: 'dex-title', text: `#${pad(sp.id)} ???` }),
          h('p', { class: 'dex-desc', text: 'Sin datos. Todavía no viste a esta criatura.' }));
        return;
      }
      const isCaught = caught.has(k);
      left.replaceChildren(
        h('img', { class: 'dex-art', src: creatureIcon(k), alt: sp.name }),
        h('div', { class: 'dex-title', text: `#${pad(sp.id)} ${sp.name}` }),
        h('div', { class: 'chips' }, sp.types.map(typeChip)),
        h('p', { class: 'dex-desc', text: isCaught ? sp.desc : 'Atrapala para saber más sobre esta criatura.' }),
        isCaught ? h('div', { class: 'base-stats' }, STAT_KEYS.map((st, j) => h('div', { class: 'row' }, h('span', { text: STAT_NAMES[st] }), h('i', { style: { '--v': sp.base[j] / 160 } }), h('b', { text: String(sp.base[j]) })))) : null,
        sp.evo && isCaught ? h('p', { class: 'small', text: sp.evo.stone ? `Evoluciona con ${ITEMS[sp.evo.stone].name}.` : `Evoluciona en el nivel ${sp.evo.lvl}.` }) : null);
    };
    let nav = null;
    const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const rebuild = (keepKey = null) => {
      const q = norm(search.value.trim());
      const st = status.value;
      keys = DEX_ORDER.filter((k) => {
        const sp = SPECIES[k];
        if (st === 'caught' && !caught.has(k)) return false;
        if (st === 'seen' && !(seen.has(k) && !caught.has(k))) return false;
        if (st === 'unseen' && seen.has(k)) return false;
        if (!q) return true;
        if (String(sp.id).padStart(3, '0').includes(q) || String(sp.id) === q.replace(/^#/, '')) return true;
        return seen.has(k) && (norm(sp.name).includes(q) || sp.types.some((t) => norm(TYPES[t].name).includes(q)));
      });
      const rows = keys.map((k) => {
        const sp = SPECIES[k];
        return h('li', { class: caught.has(k) ? 'is-caught' : '' },
          h('span', { class: 'num', text: pad(sp.id) }),
          h('span', { class: 'name', text: seen.has(k) ? sp.name : '???' }),
          h('i', { class: 'ball', 'aria-hidden': 'true' }));
      });
      list.replaceChildren(...rows);
      nav = listNav(rows, { onCancel: () => close(), onPick: (i) => { const k = keys[i]; if (k && seen.has(k)) cry(k, SPECIES[k].base.reduce((a, b) => a + b, 0) / 250); }, onMove: show, start: Math.max(0, keys.indexOf(keepKey)) });
      if (!rows.length) show(0);
    };
    const search = h('input', { type: 'search', class: 'dex-search', placeholder: 'Buscar por nombre, tipo o número  ( / )', autocomplete: 'off', spellcheck: 'false', oninput: () => rebuild() });
    const status = h('select', { class: 'dex-status', onchange: () => rebuild() },
      ...[['all', 'Todos'], ['caught', 'Atrapados'], ['seen', 'Vistos sin atrapar'], ['unseen', 'Sin ver']].map(([v, t]) => h('option', { value: v, text: t })));
    const back = () => { search.blur(); status.blur(); };
    for (const f of [search, status]) f.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (e.key === 'Escape' && search.value) search.value = ''; e.preventDefault(); e.stopPropagation(); back(); rebuild(); }
    });
    const slash = (e: KeyboardEvent) => {
      if (!el.isConnected) return removeEventListener('keydown', slash);
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLSelectElement)) { e.preventDefault(); search.focus(); }
    };
    addEventListener('keydown', slash);
    rebuild();
    el.append(head, h('div', { class: 'dex-filter' }, search, status), h('div', { class: 'dex-layout' }, left, list), h('footer', { class: 'panel-foot', text: `↑↓ recorrer · ${keyName('a')} oír su grito · / buscar · ${keyName('b')} volver` }));
    return (a) => nav?.(a);
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

// Blocky region map (like the classic Town Map): every cell belongs to the nearest department.
const CELL = 4;
let regionCache = null;
function mapRegions() {
  if (regionCache) return regionCache;
  const poly = OUTLINE.map(([lo, la]) => project(lo, la));
  const inside = (x, y) => {
    let c = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [xa, ya] = poly[a];
      const [xb, yb] = poly[b];
      if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) c = !c;
    }
    return c;
  };
  const centers = DEPARTMENTS.map((d) => ({ ...d, at: project(d.lon, d.lat), w: d.w ?? 1 }));
  const cols = Math.ceil(VIEW.w / CELL);
  const rows = Math.ceil(VIEW.h / CELL);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * CELL + CELL / 2;
      const y = r * CELL + CELL / 2;
      if (!inside(x, y)) continue;
      let best = null;
      let bd = Infinity;
      for (const d of centers) {
        const k = Math.hypot(d.at[0] - x, d.at[1] - y) / d.w;
        if (k < bd) { bd = k; best = d.id; }
      }
      grid[r][c] = best;
    }
  }
  const paths = {};
  let borders = '';
  let coast = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = grid[r][c];
      if (!id) continue;
      const x = c * CELL;
      const y = r * CELL;
      paths[id] = `${paths[id] ?? ''}M${x} ${y}h${CELL}v${CELL}h-${CELL}z`;
      const right = c + 1 < cols ? grid[r][c + 1] : null;
      const down = r + 1 < rows ? grid[r + 1][c] : null;
      const left = c ? grid[r][c - 1] : null;
      const up = r ? grid[r - 1][c] : null;
      if (right && right !== id) borders += `M${x + CELL} ${y}v${CELL}`;
      if (down && down !== id) borders += `M${x} ${y + CELL}h${CELL}`;
      if (!right) coast += `M${x + CELL} ${y}v${CELL}`;
      if (!down) coast += `M${x} ${y + CELL}h${CELL}`;
      if (!left) coast += `M${x} ${y}v${CELL}`;
      if (!up) coast += `M${x} ${y}h${CELL}`;
    }
  }
  regionCache = { paths, borders, coast, grid };
  return regionCache;
}

export function openMap() {
  const S = state();
  const visited = (id) => !!S.flags[`v_${id}`];
  const here = atlasHere();
  const pts = Object.fromEntries(PLACES.map((p) => [p.id, project(p.lon, p.lat)]));
  const reg = mapRegions();
  const biomeOf = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, BIOMES[d.biome]]));
  // A department only shows its zone colour once one of its places has been visited.
  const deptSeen = (id) => PLACES.some((p) => PLACE_DEPT[p.id] === id && visited(p.id));
  const deptPaths = DEPARTMENTS.map((d) => `<path d="${reg.paths[d.id] ?? ''}" fill="${deptSeen(d.id) ? biomeOf[d.id].color : '#7c8290'}"/>`).join('');
  const roads = LINKS.map(([a, b]) => `M${pts[a][0]} ${pts[a][1]}L${pts[b][0]} ${pts[b][1]}`).join('');
  const dots = PLACES.map((p) => {
    const [x, y] = pts[p.id];
    const seen = visited(p.id) ? 'is-seen' : '';
    if (!seen) return `<g class="node k-loc"><circle cx="${x}" cy="${y}" r="5.5"/></g>`;
    if (p.kind === 'city') return `<g class="node k-city ${seen}"><rect x="${x - 6}" y="${y - 6}" width="12" height="12"/><rect x="${x - 2.5}" y="${y - 2.5}" width="5" height="5" fill="${p.color ?? '#fff'}" class="pip"/></g>`;
    if (p.kind === 'place') return `<g class="node k-place ${seen}"><path d="M${x} ${y - 7}L${x + 6.5} ${y}L${x} ${y + 7}L${x - 6.5} ${y}Z"/></g>`;
    return `<g class="node k-loc ${seen}"><circle cx="${x}" cy="${y}" r="5.5"/></g>`;
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
  const grid = Array.from({ length: Math.floor(VIEW.w / 20) + 1 }, (_, i) => `M${i * 20} 0V${VIEW.h}`).join('') + Array.from({ length: Math.floor(VIEW.h / 20) + 1 }, (_, i) => `M0 ${i * 20}H${VIEW.w}`).join('');
  const svg = `<svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" role="img" aria-label="Mapa de Uruguay" shape-rendering="crispEdges">
    <rect width="${VIEW.w}" height="${VIEW.h}" class="sea"/><path d="${grid}" class="sea-grid"/>
    <g class="land">${deptPaths}</g>
    <path id="map-sel" class="sel" d=""/>
    <path d="${reg.borders}" class="borders"/><path d="${reg.coast}" class="coast"/>
    <path d="${roads}" class="r-edge"/><path d="${roads}" class="r-fill"/>
    ${dots}
    <g id="map-cursor" class="cursor"><rect x="-10" y="-10" width="20" height="20"/></g>
    ${here ? `<image id="map-face" class="face" href="${faceUrl}" x="${here.at[0] - 10}" y="${here.at[1] - 29}" width="20" height="20"/>` : ''}
  </svg>`;
  // Which element types actually show up around a place (from its real encounter table).
  const wildTypes = (id) => {
    const tot = {};
    for (const [sp, , , w] of MAPS[id]?.enc?.list ?? []) for (const t of SPECIES[sp].types) tot[t] = (tot[t] ?? 0) + w;
    return Object.entries(tot as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
  };
  const chip = (t) => h('span', { class: 'type-chip', style: { '--type': TYPES[t].color }, text: TYPES[t].name });
  return panel('panel-map', (el, close) => {
    const wrap = h('div', { class: 'map-svg' });
    wrap.innerHTML = svg;
    const f = (cls) => h('div', { class: cls });
    const info = h('aside', { class: 'map-info' },
      f('mi-name'), f('mi-kind'),
      h('div', { class: 'mi-block' }, h('small', { text: 'Departamento' }), f('mi-dept')),
      h('div', { class: 'mi-block' }, h('small', { text: 'Zona' }), h('div', { class: 'mi-zone' }, h('i', { class: 'mi-sw' }), h('b', { class: 'mi-zname' })), f('mi-ztypes')),
      h('div', { class: 'mi-block' }, h('small', { text: 'Criaturas que aparecen' }), f('mi-wild')),
      f('mi-note'),
    );
    el.append(
      h('header', { class: 'panel-title' }, h('span', { text: 'Mapa' }), h('span', { text: here ? `Estás en: ${here.label}` : '' })),
      h('div', { class: 'map-body' }, wrap, info),
      h('footer', { class: 'panel-foot', text: `←→↑↓ mover el cuadrado por el mapa · ${keyName('b')} volver` }),
    );
    // Free cursor: it moves over the whole map in small steps; a place shows its information when the cursor is on it,
    // anywhere else the department under it is described.
    const STEP = 4, SNAP = 8;
    const landPaths = [...wrap.querySelectorAll('.land path')] as SVGGeometryElement[];
    let cx = here ? here.at[0] : pts[PLACES[0].id][0];
    let cy = here ? here.at[1] : pts[PLACES[0].id][1];
    const cursor = wrap.querySelector('#map-cursor');
    const sel = wrap.querySelector('#map-sel');
    const q = (c) => info.querySelector(c);
    const none = () => [h('span', { class: 'mi-none', text: '???' })];
    const show = () => {
      cursor.setAttribute('transform', `translate(${cx} ${cy})`);
      // the nearest place, if the cursor is on it
      let cur = null, bd = SNAP;
      for (const p of PLACES) { const d = Math.hypot(pts[p.id][0] - cx, pts[p.id][1] - cy); if (d <= bd) { bd = d; cur = p.id; } }
      const pt = new DOMPoint(cx, cy);
      const di = landPaths.findIndex((el) => el.isPointInFill?.(pt));
      const dept = cur ? DEPARTMENTS.find((d) => d.id === PLACE_DEPT[cur]) : di >= 0 ? DEPARTMENTS[di] : null;
      sel.setAttribute('d', dept ? reg.paths[dept.id] ?? '' : '');
      if (cur) {
        const p = PLACES.find((o) => o.id === cur);
        const biome = BIOMES[dept.biome];
        const seen = visited(cur);
        q('.mi-name').textContent = seen ? p.name : '???';
        q('.mi-kind').textContent = !seen ? '???' : p.kind === 'city' ? 'Ciudad con gimnasio' : p.kind === 'loc' ? 'Localidad' : 'Lugar especial';
        q('.mi-dept').textContent = seen ? dept.name : '???';
        q('.mi-sw').style.background = seen ? biome.color : '#7c8290';
        q('.mi-zname').textContent = seen ? biome.name : '???';
        q('.mi-ztypes').replaceChildren(...(seen ? biome.types.map(chip) : none()));
        const wt = wildTypes(cur);
        q('.mi-wild').replaceChildren(...(!seen ? none() : wt.length ? wt.map(chip) : [h('span', { class: 'mi-none', text: 'Ninguna' })]));
        q('.mi-note').textContent = seen ? `${p.note}${here?.id === cur ? ' · Estás acá' : ''}` : 'Sin visitar';
      } else if (dept) {
        const biome = BIOMES[dept.biome];
        const seen = deptSeen(dept.id);
        q('.mi-name').textContent = seen ? dept.name : '???';
        q('.mi-kind').textContent = 'Departamento';
        q('.mi-dept').textContent = seen ? dept.name : '???';
        q('.mi-sw').style.background = seen ? biome.color : '#7c8290';
        q('.mi-zname').textContent = seen ? biome.name : '???';
        q('.mi-ztypes').replaceChildren(...(seen ? biome.types.map(chip) : none()));
        q('.mi-wild').replaceChildren();
        q('.mi-note').textContent = seen ? 'Moví el cuadrado sobre una localidad para ver sus datos.' : 'Todavía no visitaste este departamento.';
      } else {
        q('.mi-name').textContent = 'Fuera de Uruguay';
        q('.mi-kind').textContent = 'Mar, río u otro país';
        q('.mi-dept').textContent = '—';
        q('.mi-sw').style.background = '#7c8290';
        q('.mi-zname').textContent = '—';
        q('.mi-ztypes').replaceChildren();
        q('.mi-wild').replaceChildren();
        q('.mi-note').textContent = '';
      }
    };
    show();
    const dirs = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    return (a) => {
      if (a === 'a' || a === 'b' || a === 'start') { sfx('cancel'); close(); return; }
      const d = dirs[a];
      if (!d) return;
      const nx = Math.max(0, Math.min(VIEW.w, cx + d[0] * STEP)), ny = Math.max(0, Math.min(VIEW.h, cy + d[1] * STEP));
      if (nx === cx && ny === cy) return void sfx('bump');
      cx = nx; cy = ny;
      show();
    };
  });
}

// ---------------------------------------------------------------- CARD
function cardFace(look) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 17;
  c.getContext('2d').drawImage(charSprite(look, 'down', 0), 0, 0);
  return h('img', { src: c.toDataURL(), alt: '', class: 'card-sprite' });
}

export function openCard() {
  const S = state();
  return panel('panel-card', (el, close) => {
    // In route order; the last number picks the medal drawing (each medal keeps its type's art).
    const badges = [['badge1', 'Trinidad', '#b8864a', 9], ['badge2', 'Mercedes', '#c8c0b0', 10], ['badge3', 'Fray Bentos', '#c8506a', 8], ['badge4', 'Salto', '#8a5ad0', 7], ['badge5', 'Rivera', '#c8402a', 6], ['badge6', 'Tacuarembó', '#4aa03c', 5], ['badge7', 'Treinta y Tres', '#a48e48', 3], ['badge8', 'Maldonado', '#e8c21c', 2], ['badge9', 'Florida', '#8ac8f0', 11], ['badge10', 'Durazno', '#e8702a', 4], ['badge11', 'Canelones', '#9ac83a', 12], ['badge12', 'Montevideo', '#3f86e0', 1]];
    el.append(
      h('header', { class: 'panel-title' }, h('span', { class: 'card-tab', text: 'Ficha de Entrenador' }), h('span', { text: `N.º ID ${S.player.id}` })),
      h('div', { class: 'card-body' },
        h('dl', {},
          h('dt', { text: 'Nombre' }), h('dd', { text: S.player.name }),
          h('dt', { text: 'Dinero' }), h('dd', { text: `$${S.player.money.toLocaleString('es-UY')}` }),
          h('dt', { text: 'PokeDex' }), h('dd', { text: `${S.dex.caught.length} / ${DEX_ORDER.length}` }),
          h('dt', { text: 'Hoy' }), h('dd', { text: `${capital(weekday())} ${dateText()}` }),
          h('dt', { text: 'Hora' }), h('dd', { text: `${timeText()} · día ${dayNumber() + 1} de viaje` }),
          h('dt', { text: 'Tiempo' }), h('dd', { text: formatTime(S.stats.playtime) }),
          h('dt', { text: 'Victorias' }), h('dd', { text: String(S.stats.battlesWon) }),
          h('dt', { text: 'Inicio' }), h('dd', { text: new Date(S.created).toLocaleDateString('es-UY') }),
        ),
        h('div', { class: 'card-portrait', 'aria-hidden': 'true' }, cardFace(S.player.look)),
      ),
      h('div', { class: 'card-medals-title', text: 'Medallas' }),
      h('ul', { class: 'badges' }, badges.map(([f, n, col, art]) => h('li', { class: S.flags[f] ? 'is-earned' : '', style: { '--badge': col }, title: n }, S.flags[f] ? h('img', { class: 'badge-img', src: badgeIcon(art), alt: `Medalla ${n}` }) : h('i', { class: 'badge-slot' }), h('span', { text: n })))),
      S.flags.champion ? h('p', { class: 'champion-line', text: '★ Campeón de la Liga Oriental ★' }) : '',
      h('footer', { class: 'panel-foot', text: `${keyName('b')} volver` }),
    );
    return (a) => { if (a === 'a' || a === 'b' || a === 'start') { sfx('cancel'); close(); } };
  });
}

// ---------------------------------------------------------------- SOUND
/** Sound panel: one slider per bus (music, effects, battle and cries, weather and ambience). */
export function openSound() {
  return panel('panel-options', (el, close) => {
    const bar = (v) => '█'.repeat(Math.round(v * 10)) + '░'.repeat(10 - Math.round(v * 10));
    const slider = (key, label, hint, test?: () => void): any => ({ label, hint, key, test, get: () => `${bar(settings[key])} ${Math.round(settings[key] * 10)}`, step: (d) => (settings[key] = clamp(Math.round((settings[key] + d * 0.1) * 10) / 10, 0, 1)) });
    const rows: any[] = [
      slider('music', 'Música', 'Volumen de la música de fondo.'),
      slider('sfx', 'Efectos de sonido', 'Pasos, menús, objetos y los demás sonidos del mundo.', () => sfx('select')),
      slider('battleVol', 'Combate y gritos', 'Golpes, ataques y gritos de las criaturas.', () => sfx('hit')),
      slider('ambient', 'Clima y ambiente', 'Lluvia, viento, olas, pájaros y truenos. Si tapa el resto, bajalo.', () => sfx('select')),
      { label: 'Restablecer', hint: 'Vuelve a los volúmenes que trae el juego.', get: () => 'Aplicar', noArrows: true, step: () => { Object.assign(settings, { music: 0.5, sfx: 0.7, battleVol: 1, ambient: 0.25 }); } },
    ];
    const items = rows.map((r) => h('li', {}, h('span', { text: r.label }), h('b', { text: '' })));
    const refresh = () => rows.forEach((r, i) => (items[i].querySelector('b').textContent = r.noArrows ? `▶ ${r.get()}` : `◀ ${r.get()} ▶`));
    refresh();
    const hint = h('p', { class: 'bag-desc' });
    el.append(h('header', { class: 'panel-title', text: 'Sonido' }), h('ul', { class: 'options-list' }, items), hint,
      h('footer', { class: 'panel-foot', text: `←→ cambiar · ${keyName('b')} volver` }));
    const leave = () => { saveSettings(); setVolumes(settings); close(); };
    return listNav(items, {
      onMove: (i) => (hint.textContent = rows[i].hint ?? ''),
      onCancel: leave,
      onPick: (i) => { if (rows[i].noArrows) { rows[i].step(0); setVolumes(settings); sfx('select'); refresh(); } },
      extra: (a, i) => {
        if (rows[i].noArrows) return false;
        if (a === 'left' || a === 'right' || a === 'a') {
          rows[i].step(a === 'left' ? -1 : 1);
          setVolumes(settings);
          (rows[i].test ?? (() => sfx('select')))();
          refresh();
          return true;
        }
        return false;
      },
    });
  });
}

// ---------------------------------------------------------------- OPTIONS
export function openOptions() {
  return panel('panel-options', (el, close) => {
    const rows = [
      { label: 'Velocidad del texto', hint: 'Qué tan rápido aparecen los diálogos.', get: () => ['Lenta', 'Normal', 'Rápida'][settings.textSpeed - 1], step: (d) => (settings.textSpeed = clamp(settings.textSpeed + d, 1, 3)) },
      { label: 'Sonido', hint: 'Panel para ajustar la música, los efectos, el combate y el clima.', get: () => 'Abrir', step: () => { openSound(); }, noArrows: true },
      { label: 'Animaciones de combate', hint: 'Sí: los ataques y golpes se animan en combate. No: el combate muestra los resultados al instante.', get: () => (settings.anims ? 'Sí' : 'No'), step: () => (settings.anims = !settings.anims) },
      { label: 'Zoom del mapa', hint: 'Normal: se ve más del mapa. Cerca: el mapa se ve el doble de grande (los píxeles siguen enteros).', get: () => (settings.mapZoom >= 2 ? 'Cerca' : 'Normal'), step: () => (settings.mapZoom = settings.mapZoom >= 2 ? 1 : 2) },
      { label: 'Monitor de rendimiento', hint: 'Muestra FPS, tiempo de cuadro y ping arriba a la izquierda. También con F3.', get: () => (settings.perf ? 'Sí' : 'No'), step: async () => { (await import('../core/perf.ts')).togglePerf(); } },
      { label: 'Controles', hint: 'Muestra las teclas del juego.', get: () => 'Ver', step: () => { openControls(); }, noArrows: true },
    ];
    const items = rows.map((r) => h('li', {}, h('span', { text: r.label }), h('b', { text: '' })));
    const refresh = () => rows.forEach((r, i) => (items[i].querySelector('b').textContent = r.noArrows ? `▶ ${r.get()}` : `◀ ${r.get()} ▶`));
    refresh();
    const hint = h('p', { class: 'bag-desc' });
    const showHint = (i) => (hint.textContent = rows[i].hint ?? '');
    el.append(h('header', { class: 'panel-title', text: 'Opciones' }), h('ul', { class: 'options-list' }, items), hint,
      h('footer', { class: 'panel-foot', text: `←→ cambiar · ${keyName('b')} volver` }));
    const nav = listNav(items, {
      onMove: showHint,
      onCancel: () => { saveSettings(); setVolumes(settings); close(); },
      onPick: (i) => { if (rows[i].noArrows) { sfx('select'); rows[i].step(0); } },
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
  ['Z / J', 'Aceptar, hablar, interactuar'],
  ['X / K / Shift / Retroceso', 'Cancelar, volver'],
  ['Espacio (mantener)', 'Doble velocidad: caminar y combates'],
  ['Enter / Esc / M / Tab', 'Abrir el menú (en el menú, Enter acepta)'],
  ['N', 'Silenciar o activar la música'],
  ['O', 'Abrir ajustes'],
  ['P', 'Mostrar u ocultar el equipo'],
  ['T', 'Abrir el Mapa de Uruguay (cuando lo tengas)'],
  ['F2', 'Panel de errores y notas'],
  ['Gamepad', 'Cruz = mover · botón inferior = aceptar · botón derecho = volver'],
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
    sfx('save');
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
  sfx('pc');
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
