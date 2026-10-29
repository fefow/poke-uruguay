// In-canvas HUD: quick buttons (music, settings, team), a x1,5 speed badge
// while Space is held, and a live team panel. Read-only over game state.
import { h } from '../core/util.js';
import { input } from '../core/input.js';
import { setVolumes } from '../core/audio.js';
import { settings, saveSettings, state } from './state.js';
import { creatureIcon } from '../gfx/creatures.js';
import { displayName, maxHp } from './creature.js';

let el, speed, party, btnMusic, btnParty, btnMenu, savedEl;
let isGame = () => false;
let lastMusic = 0.5;
let sig = '';
let nextPoll = 0;

function setMusic(on) {
  if (on) settings.music = lastMusic || 0.5;
  else { if (settings.music > 0) lastMusic = settings.music; settings.music = 0; }
  setVolumes(settings);
  saveSettings();
  syncButtons();
}

function syncButtons() {
  const on = settings.music > 0;
  btnMusic.textContent = on ? '♪' : '♪̸';
  btnMusic.classList.toggle('is-off', !on);
  btnMusic.dataset.tip = on ? 'Silenciar música (N)' : 'Activar música (N)';
  btnParty.dataset.tip = settings.hudParty ? 'Ocultar equipo (P)' : 'Mostrar equipo (P)';
  btnMusic.setAttribute('aria-pressed', String(!on));
  btnParty.classList.toggle('is-off', !settings.hudParty);
  btnParty.setAttribute('aria-pressed', String(!!settings.hudParty));
}

export function mountHud({ screen, game, openSettings }) {
  isGame = game;
  speed = h('div', { class: 'hud-speed', 'aria-hidden': 'true' }, h('b', { text: '▶▶' }), h('span', { text: 'x1,5' }));
  party = h('ol', { class: 'hud-party', 'aria-label': 'Equipo' });
  btnMusic = h('button', { type: 'button', class: 'hud-btn', 'aria-label': 'Música' });
  btnParty = h('button', { type: 'button', class: 'hud-btn', 'aria-label': 'Equipo' }, '▤');
  btnMenu = h('button', { type: 'button', class: 'hud-btn', 'data-tip': 'Menú y mochila (Enter)', 'aria-label': 'Menú' }, '☰');
  const btnSet = h('button', { type: 'button', class: 'hud-btn', 'data-tip': 'Ajustes (O)', 'aria-label': 'Ajustes' }, '⚙');
  savedEl = h('div', { class: 'hud-saved', 'aria-hidden': 'true', text: 'Guardado' });
  el = h('div', { class: 'hud' }, h('div', { class: 'hud-tools' }, btnMenu, btnMusic, btnSet, btnParty), speed, party, savedEl);
  screen.append(el);

  const toggleMusic = () => setMusic(settings.music === 0);
  const toggleParty = () => { settings.hudParty = !settings.hudParty; saveSettings(); sig = ''; syncButtons(); };
  const settingsNow = () => { if (isGame() && !input.busy) openSettings(); };
  btnMusic.addEventListener('click', toggleMusic);
  btnParty.addEventListener('click', toggleParty);
  btnSet.addEventListener('click', settingsNow);
  btnMenu.addEventListener('click', () => { if (isGame() && !input.busy) input.press('start'); });
  // Don't steal focus from the game keys.
  for (const b of [btnMenu, btnMusic, btnParty, btnSet]) b.addEventListener('pointerdown', (e) => e.preventDefault());

  addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === 'KeyN') toggleMusic();
    else if (e.code === 'KeyP') toggleParty();
    else if (e.code === 'KeyO') settingsNow();
  });
  syncButtons();
}

/** Called every frame; DOM is only touched when something changed. */
export function updateHud(now) {
  if (!el) return;
  const game = isGame();
  const inBattle = !!document.querySelector('.bhud');
  const visible = game && !inBattle;
  el.hidden = !game;
  el.classList.toggle('in-battle', inBattle);
  el.classList.toggle('is-busy', input.busy && !inBattle);
  speed.classList.toggle('is-on', visible && input.held('run'));
  if (now < nextPoll) return;
  nextPoll = now + 250;
  const S = state();
  const show = visible && settings.hudParty && S?.party.length;
  party.hidden = !show;
  if (!show) return;
  const next = S.party.map((c) => `${c.species}|${c.nickname ?? ''}|${c.level}|${c.hp}|${c.status ?? ''}`).join(';');
  if (next === sig) return;
  sig = next;
  party.replaceChildren(...S.party.map((c) => {
    const max = maxHp(c);
    const pct = Math.max(0, Math.min(1, c.hp / max));
    return h('li', { class: `hud-mon${c.hp <= 0 ? ' is-down' : ''}`, title: `${displayName(c)} Nv${c.level} · ${c.hp}/${max} PS` },
      h('img', { src: creatureIcon(c.species), alt: displayName(c), width: 32, height: 32 }),
      h('span', { class: 'hud-mon-lv', text: `Nv${c.level}` }),
      h('span', { class: `hud-bar${pct < 0.25 ? ' is-low' : pct < 0.5 ? ' is-mid' : ''}`, style: { '--hp': pct.toFixed(3) }, role: 'img', 'aria-label': `${c.hp} de ${max} PS` }));
  }));
}

/** Brief "saved" indicator after an autosave. */
export function flashSaved() {
  if (!savedEl) return;
  savedEl.classList.remove('is-on');
  void savedEl.offsetWidth;
  savedEl.classList.add('is-on');
}
