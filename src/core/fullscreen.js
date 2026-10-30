// Fullscreen toggle: corner button plus the F key (ignored while typing).
import { h } from './util.js';

const target = () => document.documentElement;
const active = () => !!document.fullscreenElement;

function toggle() {
  if (!document.fullscreenEnabled) return;
  (active() ? document.exitFullscreen() : target().requestFullscreen({ navigationUI: 'hide' })).catch(() => {});
}

export function mountFullscreen() {
  if (!document.fullscreenEnabled) return;
  const btn = h('button', { class: 'fs-btn', type: 'button', title: 'Pantalla completa (F)', 'aria-label': 'Pantalla completa', text: '⛶', onclick: toggle });
  document.body.append(btn);
  document.addEventListener('fullscreenchange', () => btn.classList.toggle('is-on', active()));
  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyF' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    e.preventDefault();
    toggle();
  });
}
