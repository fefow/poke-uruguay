// Adventure-mode top bar (1920x1080 stage): place, medals, money, team and
// icon buttons with tooltips. Hidden in battle and while a script runs.
import { h } from '../core/util.ts';
import { input } from '../core/input.ts';
import { state, badgeCount } from './state.ts';
import { MAPS } from '../data/maps.ts';
import { creatureIcon } from '../gfx/creatures.ts';
import { displayName, maxHp } from './creature.ts';
import { fmt } from './ui.ts';

let stage, bar, placeEl, medalEl, moneyEl, teamEl, btns: Record<string, any> = {}, handlers: Record<string, any> = {}, sig = '', nextPoll = 0;

const ICON = {
  pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z"/>',
  medal: '<path d="M12 2l2.900 6 6.600.9-4.800 4.600 1.200 6.500L12 17l-5.900 3 1.200-6.500L2.500 8.900 9.100 8z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.500 9.500c0-1.100 1.100-1.800 2.500-1.800s2.500.7 2.500 1.800-1.100 1.500-2.500 1.900-2.500.8-2.500 1.900 1.100 1.800 2.500 1.800 2.500-.7 2.500-1.800" fill="none" stroke="#14183a" stroke-width="1.400"/>',
  bag: '<path d="M7 7V6a5 5 0 0 1 10 0v1h2.500l1 14h-17l1-14zm2 0h6V6a3 3 0 0 0-6 0z"/>',
  team: '<circle cx="12" cy="12" r="9.500" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.500 12h6.500a3 3 0 0 0 6 0h6.500" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" />',
  dex: '<path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3zm3 3v2h8V6z"/>',
  map: '<path d="M9 3l6 2 6-2v16l-6 2-6-2-6 2V5zm0 2v12l6 2V7z"/>',
  music: '<path d="M9 3v12.500A3.500 3.500 0 1 0 11 18.700V8h8V3z"/>',
  gear: '<path d="M10.300 2h3.400l.5 2.600 1.700.7 2.200-1.500 2.400 2.400-1.500 2.200.7 1.700 2.600.5v3.400l-2.600.5-.7 1.700 1.500 2.200-2.400 2.400-2.200-1.500-1.700.7-.5 2.600h-3.400l-.5-2.600-1.700-.7-2.200 1.500-2.400-2.400 1.500-2.200-.7-1.700L2 13.700v-3.400l2.600-.5.7-1.700-1.500-2.200 2.400-2.400 2.200 1.500 1.700-.7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
  menu: '<path d="M3 5h18v2.500H3zm0 5.800h18v2.500H3zm0 5.800h18v2.500H3z"/>',
};
function icon(k) {
  const el = h('span', { class: 'tb-ico' });
  el.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">${ICON[k]}</svg>`;
  return el;
}

function button(key, tip, onClick) {
  const b = h('button', { type: 'button', class: 'tb-btn', 'data-tip': tip, 'aria-label': tip }, icon(key));
  b.addEventListener('pointerdown', (e) => e.preventDefault()); // keep keyboard focus on the game
  b.addEventListener('click', onClick);
  return b;
}

/** handlers: { menu, bag, party, dex, map, options } — each opens that screen. */
export function mountSidebar(stageEl, hs = {}) {
  stage = stageEl;
  handlers = hs;
  placeEl = h('span', { class: 'tb-place' });
  medalEl = h('b');
  moneyEl = h('b');
  teamEl = h('ol', { class: 'tb-team' });
  const guard = (fn) => () => { if (!stage.classList.contains('is-game') || input.busy) return; fn?.(); };
  btns = {
    dex: button('dex', 'PokeDex', guard(() => handlers.dex?.())),
    party: button('team', 'Equipo', guard(() => handlers.party?.())),
    bag: button('bag', 'Mochila', guard(() => handlers.bag?.())),
    map: button('map', 'Mapa de Uruguay (T)', guard(() => handlers.map?.())),
    music: button('music', 'Música (N)', () => dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN' }))),
    options: button('gear', 'Ajustes (O)', guard(() => handlers.options?.())),
    menu: button('menu', 'Menú (Enter)', guard(() => input.press('start'))),
  };
  bar = h('header', { class: 'topbar', 'aria-label': 'Barra superior' },
    h('div', { class: 'tb-chip tb-chip-place', 'data-tip': 'Lugar actual' }, icon('pin'), placeEl),
    h('div', { class: 'tb-chip', 'data-tip': 'Medallas' }, icon('medal'), medalEl),
    h('div', { class: 'tb-chip', 'data-tip': 'Dinero' }, icon('coin'), moneyEl),
    teamEl,
    h('nav', { class: 'tb-tools' }, ...Object.values(btns)));
  stage.append(bar);
  fit();
  addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
  new ResizeObserver(fit).observe(document.documentElement);
}

/** Scale the fixed 1920x1080 stage to the window (letterboxed). */
function fit() {
  // 4% margin: the window never shows the game edge to edge, so browser bars and scrollbars cannot cut it
  const w = document.documentElement.clientWidth || innerWidth, h = Math.min(innerHeight, document.documentElement.clientHeight || innerHeight);
  const k = Math.min(w / 1920, h / 1080) * 0.96;
  stage.style.setProperty('--k', k.toFixed(4));
}

export function updateSidebar(now, inGame) {
  if (!stage) return;
  const show = inGame && !document.querySelector('.bhud');
  stage.classList.toggle('is-game', show);
  bar.classList.toggle('is-busy', input.busy);
  if (now < nextPoll) return;
  nextPoll = now + 250;
  const S = show ? state() : null;
  if (!S) { sig = ''; return; }
  btns.dex.hidden = !S.flags.dex;
  btns.party.hidden = !S.party.length;
  btns.map.hidden = !S.bag.mapa_uruguay;
  const place = fmt(MAPS[S.pos.map]?.name ?? '');
  const team = S.party.map((c) => `${c.species}${c.level}${c.hp}${c.status ?? ''}`).join(',');
  const next = [place, S.rivalName, S.player.money, badgeCount(), team].join('|');
  if (next === sig) return;
  sig = next;
  placeEl.textContent = place;
  medalEl.textContent = String(badgeCount());
  moneyEl.textContent = `$${S.player.money}`;
  teamEl.replaceChildren(...S.party.map((c) => {
    const max = maxHp(c), pct = Math.max(0, Math.min(1, c.hp / max));
    return h('li', { class: c.hp <= 0 ? 'is-down' : '', 'data-tip': `${displayName(c)} · Nv ${c.level} · ${c.hp}/${max} PS${c.status ? ' · ' + c.status : ''}` },
      h('img', { src: creatureIcon(c.species), alt: displayName(c), width: 36, height: 36 }),
      h('span', { class: `tb-bar${pct < 0.25 ? ' is-low' : pct < 0.5 ? ' is-mid' : ''}`, style: { '--hp': pct.toFixed(3) } }));
  }));
}
