// Modern 1920x1080 stage: the 4:3 pixel-art game sits in the centre and two
// side panels show live information (place, team, medals, objective hints).
import { h } from '../core/util.js';
import { state, badgeCount } from './state.js';
import { MAPS } from '../data/maps.js';
import { creatureIcon } from '../gfx/creatures.js';
import { displayName, maxHp } from './creature.js';
import { VERSION } from '../version.js';

let stage, left, right, sig = '', nextPoll = 0;

export function mountSidebar(stageEl) {
  stage = stageEl;
  left = stage.querySelector('#side-l');
  right = stage.querySelector('#side-r');
  fit();
  addEventListener('resize', fit);
}

/** Scale the fixed 1920x1080 stage to the window (letterboxed). */
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.setProperty('--k', k.toFixed(4));
}

const KEYS = [['Flechas', 'Mover'], ['Z / Enter', 'Aceptar'], ['X', 'Correr / volver'], ['Espacio', 'Velocidad x2'], ['Enter', 'Menú y mochila'], ['T', 'Mapa'], ['F2', 'Reportar fallo']];

export function updateSidebar(now, inGame) {
  if (!stage) return;
  stage.classList.toggle('is-game', inGame);
  if (now < nextPoll) return;
  nextPoll = now + 250;
  const S = inGame ? state() : null;
  if (!S) { if (sig !== 'off') { sig = 'off'; left.replaceChildren(); right.replaceChildren(); } return; }
  const place = MAPS[S.pos.map]?.name ?? '';
  const next = [place, S.player.money, badgeCount(), S.party.map((c) => `${c.species}${c.level}${c.hp}${c.status ?? ''}`).join(',')].join('|');
  if (next === sig) return;
  sig = next;
  left.replaceChildren(
    h('h1', { class: 'side-logo', text: 'Poke Uruguay' }),
    h('p', { class: 'side-sub', text: 'Aventuras en tierras charrúas' }),
    h('section', { class: 'side-card' }, h('h2', { text: 'Lugar' }), h('p', { class: 'side-place', text: place })),
    h('section', { class: 'side-card' }, h('h2', { text: 'Entrenador' }),
      h('p', { text: S.player.name }),
      h('p', { class: 'side-row' }, h('span', { text: 'Medallas' }), h('b', { text: String(badgeCount()) })),
      h('p', { class: 'side-row' }, h('span', { text: 'Dinero' }), h('b', { text: `$${S.player.money}` }))),
    h('p', { class: 'side-ver', text: `Versión ${VERSION}` }));
  right.replaceChildren(
    h('section', { class: 'side-card' }, h('h2', { text: 'Equipo' }),
      h('ol', { class: 'side-team' }, ...S.party.map((c) => {
        const max = maxHp(c), pct = Math.max(0, Math.min(1, c.hp / max));
        return h('li', { class: c.hp <= 0 ? 'is-down' : '' },
          h('img', { src: creatureIcon(c.species), alt: '', width: 48, height: 48 }),
          h('div', {}, h('b', { text: displayName(c) }), h('small', { text: `Nv ${c.level}${c.status ? ' · ' + c.status : ''}` }),
            h('span', { class: `side-bar${pct < 0.25 ? ' is-low' : pct < 0.5 ? ' is-mid' : ''}`, style: { '--hp': pct.toFixed(3) } })),
          h('em', { text: `${c.hp}/${max}` }));
      }))),
    h('section', { class: 'side-card' }, h('h2', { text: 'Controles' }),
      h('dl', { class: 'side-keys' }, ...KEYS.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })]))));
}
