'use strict';
// =========================================================
// main loop
// =========================================================
let last = 0, acc = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  if (G && G.running && !G.paused) {
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) { update(STEP); acc -= STEP; steps++; }
    if (steps >= 5) acc = 0;
  }
  try { render(); updateHUD(); musicTick(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}

layout();
goTitle();
requestAnimationFrame(frame);

// expose a small API for debugging & automated tests
window.PP = {
  get G() { return G; }, get P() { return P; }, get save() { return save; },
  CH, LEVELS, CH_ORDER, ENEMY,
  startLevel, goSelect, goLevels, goTitle, buyChar, checkUnlocks, finishLevel,
  step(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || STEP); },
  press, release,
  reload() { save = loadSave(); },
  saveCode, parseSaveCode, continueJourney, goJourney,
};
