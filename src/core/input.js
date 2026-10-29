// Unified input: keyboard, touch pad and Gamepad API.
// Actions: up, down, left, right, a, b, start.
// UI layers push a handler; the top handler receives presses. When no
// handler is active, presses queue for the overworld.

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', KeyJ: 'a', Enter: 'enter',
  Space: 'run', // held: walk 1.5x faster
  KeyX: 'b', Backspace: 'b', KeyK: 'b', ShiftLeft: 'b', ShiftRight: 'b',
  Escape: 'start', KeyM: 'start', Tab: 'start',
};

/** Label for an action in on-screen hints (desktop keyboard). */
export const keyName = (action) => ({ a: 'Z', b: 'X' }[action]);

const held = new Set();
const queue = [];
const handlers = [];

function press(action) {
  const top = handlers.at(-1);
  if (top) top(action);
  else queue.push(action);
}

export const input = {
  held: (action) => held.has(action),
  heldDir() {
    for (const d of ['up', 'down', 'left', 'right']) if (held.has(d)) return d;
    return null;
  },
  /** Drain presses meant for the overworld. */
  take() {
    return queue.splice(0, queue.length);
  },
  clear() {
    queue.length = 0;
  },
  push(handler) {
    handlers.push(handler);
    queue.length = 0;
    return () => {
      const i = handlers.lastIndexOf(handler);
      if (i >= 0) handlers.splice(i, 1);
    };
  },
  get busy() {
    return handlers.length > 0;
  },
  /** Await the next press of any listed action. */
  waitFor(actions = ['a', 'b']) {
    return new Promise((resolve) => {
      const pop = input.push((a) => {
        if (actions.includes(a)) {
          pop();
          resolve(a);
        }
      });
    });
  },
  press,
};

addEventListener('keydown', (e) => {
  // Name entry field and bug-panel notes
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  let action = KEYMAP[e.code];
  if (!action) return;
  e.preventDefault();
  // Enter opens the menu in the overworld and confirms inside UI layers.
  if (action === 'enter') action = handlers.length ? 'a' : 'start';
  held.add(action);
  press(action);
});
addEventListener('keyup', (e) => {
  const action = KEYMAP[e.code];
  if (action === 'enter') { held.delete('a'); held.delete('start'); }
  else if (action) held.delete(action);
});
addEventListener('blur', () => held.clear());

// ---- Gamepad ----------------------------------------------------------------
const padPrev = {};
const PAD_BUTTONS = { 0: 'a', 1: 'b', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
export function pollGamepads() {
  const pads = navigator.getGamepads?.() ?? [];
  for (const gp of pads) {
    if (!gp) continue;
    const now = {};
    for (const [i, action] of Object.entries(PAD_BUTTONS)) {
      if (gp.buttons[i]?.pressed) now[action] = true;
    }
    const [ax, ay] = gp.axes;
    if (ax < -0.5) now.left = true;
    if (ax > 0.5) now.right = true;
    if (ay < -0.5) now.up = true;
    if (ay > 0.5) now.down = true;
    for (const action of ['a', 'b', 'start', 'up', 'down', 'left', 'right']) {
      const was = padPrev[action];
      if (now[action] && !was) {
        held.add(action);
        press(action);
      } else if (!now[action] && was) {
        held.delete(action);
      }
      padPrev[action] = !!now[action];
    }
  }
}
