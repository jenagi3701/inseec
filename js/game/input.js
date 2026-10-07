'use strict';
// ---------------------------------------------------------
// input
// ---------------------------------------------------------
const input = { held: {}, queue: [] };
const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyJ: 'attack', KeyQ: 's1', KeyE: 's2', KeyF: 's3', KeyR: 'ult',
  Escape: 'pause', KeyP: 'pause',
};
function press(a) { if (!input.held[a]) { input.held[a] = true; input.queue.push([a, true]); } }
function release(a) { if (input.held[a]) { input.held[a] = false; input.queue.push([a, false]); } }
window.addEventListener('keydown', e => {
  const a = KEYMAP[e.code];
  if (!a) return;
  if (G && G.running) e.preventDefault();
  if (e.repeat) return;
  press(a);
});
window.addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) release(a); });
window.addEventListener('blur', () => { for (const k in input.held) release(k); });
