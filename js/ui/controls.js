'use strict';
// =========================================================
// layout & touch
// =========================================================
const isTouch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
// on-screen controls: 'auto' (touch devices), 'on' or 'off' — saved per player
function touchOn() { const m = save.touchMode || 'auto'; return m === 'on' || (m === 'auto' && isTouch); }
function applyTouchMode() { document.body.classList.toggle('touch-on', touchOn()); const b = $('#btnTouch'); if (b) b.textContent = '🎮 TOUCH CONTROLS: ' + (save.touchMode || 'auto').toUpperCase(); }
function updateTouchVisibility() { applyTouchMode(); $('#touch').classList.toggle('hidden', !(touchOn() && G && G.running)); }
function layout() {
  const s = Math.max(0.5, Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
  const st = $('#stage');
  st.style.width = Math.floor(STAGE_W * s) + 'px';
  st.style.height = Math.floor(STAGE_H * s) + 'px';
  st.style.setProperty('--u', s + 'px');
}
window.addEventListener('resize', layout);

// Two button styles:
//  SIMPLE (default): auto-attack + one smart SKILL button that fires the best ready skill → 4 buttons
//  FULL: every skill on its own button → 6 buttons
function simpleControls() { return (save.controlStyle || 'simple') === 'simple'; }
const BTN_LAYOUTS = {
  simple: { cx: 62, cy: 48, rad: 74, attack: { a: null, s: 62 }, jump: { a: 196, s: 48 }, skill: { a: 132, s: 52 }, ult: { a: 72, s: 48 } },
  full: { cx: 64, cy: 46, rad: 72, attack: { a: null, s: 56 }, jump: { a: 200, s: 40 }, s1: { a: 158, s: 38 }, s2: { a: 122, s: 38 }, s3: { a: 89, s: 38 }, ult: { a: 56, s: 40 } },
};
function placeButtons() {
  const Lt = BTN_LAYOUTS[simpleControls() ? 'simple' : 'full'];
  document.querySelectorAll('#tbtns .tbtn').forEach(b => {
    const L = Lt[b.dataset.action];
    b.classList.toggle('off', !L);
    if (!L) return;
    let x = Lt.cx, y = Lt.cy;
    if (L.a != null) { x = Lt.cx - Math.cos(L.a * Math.PI / 180) * Lt.rad; y = Lt.cy + Math.sin(L.a * Math.PI / 180) * Lt.rad; }
    b.style.setProperty('--s', L.s); b.style.setProperty('--r', (x - L.s / 2).toFixed(1)); b.style.setProperty('--b', (y - L.s / 2).toFixed(1));
  });
  const label = '🕹 BUTTONS: ' + (simpleControls() ? 'SIMPLE (AUTO-ATTACK)' : 'FULL');
  for (const id of ['#btnStyle', '#btnStyle2']) { const el = $(id); if (el) el.textContent = label; }
}
placeButtons();
function toggleControlStyle() { save.controlStyle = simpleControls() ? 'full' : 'simple'; persist(); placeButtons(); }
// auto-attack only with simple on-screen controls
function autoAttackOn() { return touchOn() && simpleControls(); }

// the smart SKILL button picks the skill that fits the moment
const SKILL_TAGS = { captain: { s2: 'buff' }, swordsman: { s3: 'guard' }, sniper: { s3: 'escape' }, cook: { s3: 'move' }, doctor: { s1: 'heal', s2: 'buff', s3: 'heal' }, archaeologist: { s3: 'form' }, musician: { s2: 'buff' } };
function pickSmartSkill() {
  const D = CH[P.id], tags = SKILL_TAGS[P.id] || {};
  const foes = G.enemies.filter(e => e.alive && !e.hidden && !e.sub && Math.abs(e.x - P.x) < 180 && Math.abs(e.y - P.y) < 80);
  const dist = foes.length ? Math.min(...foes.map(e => Math.abs(e.x - P.x))) : 999;
  const hpK = P.hp / P.maxHp;
  let best = null, bestScore = 0;
  ['s1', 's2', 's3'].forEach((s, i) => {
    if (!D[s] || G.t < P.cd[s]) return;
    const tag = tags[s] || 'attack';
    let sc = 0;
    if (tag === 'heal') sc = hpK < 0.55 ? 100 : hpK < 0.85 ? 20 : 0;
    else if (tag === 'buff') sc = foes.length ? 40 : 3;
    else if (tag === 'guard') sc = dist < 60 ? 60 : 0;
    else if (tag === 'escape') sc = dist < 45 ? 80 : 0;
    else if (tag === 'move') sc = !P.onGround || !solidAt(P.x + P.face * 30) ? 90 : 2;
    else if (tag === 'form') sc = foes.length ? 30 : 4;
    else sc = foes.length ? 55 - i : 6 - i;
    if (sc > bestScore) { bestScore = sc; best = s; }
  });
  return best;
}

document.querySelectorAll('#tbtns .tbtn').forEach(b => {
  const a = b.dataset.action;
  const down = e => { e.preventDefault(); b.classList.add('active'); try { b.setPointerCapture(e.pointerId); } catch (_) { /* old browsers */ } press(a); };
  const up = e => { e.preventDefault(); b.classList.remove('active'); release(a); };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});

// Virtual joystick: drag anywhere on the pad; 8 directions, release to stop.
const joy = { id: null, x: 0, y: 0 };
(function setupJoystick() {
  const el = $('#joy'), knob = $('#joyKnob');
  const dirs = { left: false, right: false, up: false, down: false };
  const setDir = (k, on) => { if (dirs[k] === on) return; dirs[k] = on; on ? press(k) : release(k); };
  const move = e => {
    const r = el.getBoundingClientRect(), R0 = r.width * 0.36;
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R0) { dx = dx / d * R0; dy = dy / d * R0; }
    joy.x = dx / R0; joy.y = dy / R0;
    knob.style.setProperty('--jx', dx + 'px'); knob.style.setProperty('--jy', dy + 'px');
    // 8-way: each axis switches on past ~38% of the throw
    setDir('left', joy.x < -0.38); setDir('right', joy.x > 0.38);
    setDir('up', joy.y < -0.55); setDir('down', joy.y > 0.55);
  };
  const end = () => {
    joy.id = null; joy.x = joy.y = 0; el.classList.remove('active');
    knob.style.setProperty('--jx', '0px'); knob.style.setProperty('--jy', '0px');
    for (const k in dirs) setDir(k, false);
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); joy.id = e.pointerId; el.classList.add('active'); try { el.setPointerCapture(e.pointerId); } catch (_) { /* old browsers */ } move(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === joy.id) move(e); });
  el.addEventListener('pointerup', e => { if (e.pointerId === joy.id) end(); });
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', e => { if (e.pointerId === joy.id) end(); });
  window.addEventListener('blur', end);
})();

// buttons
$('#btnPlay').addEventListener('click', () => { sfx('coin'); goLevels(); });
$('#btnCrew').addEventListener('click', () => goSelect(maxPlayable()));
$('#btnContinue').addEventListener('click', () => { sfx('coin'); continueJourney(); });
$('#btnJourney').addEventListener('click', goJourney);
$('#journeyBack').addEventListener('click', goTitle);
$('#btnCopyCode').addEventListener('click', () => {
  const ta = $('#saveCodeOut');
  const fallback = () => { ta.focus(); ta.select(); $('#saveMsg').textContent = 'Code selected. Press Ctrl+C (or Copy) to copy it.'; };
  try { navigator.clipboard.writeText(ta.value).then(() => { $('#saveMsg').textContent = 'Save code copied. Paste it on another device to continue.'; }, fallback); } catch (e) { fallback(); }
});
$('#btnLoadCode').addEventListener('click', () => {
  let next;
  try { next = parseSaveCode($('#saveCodeIn').value); } catch (e) { $('#saveMsg').textContent = e.message; return; }
  askConfirm('REPLACE THIS JOURNEY WITH THE LOADED ONE?', () => { save = next; persist(); goJourney(); $('#saveMsg').textContent = 'Journey loaded! Press BACK and CONTINUE to play.'; });
});
$('#btnHelp').addEventListener('click', () => $('#screen-help').classList.remove('hidden'));
$('#helpClose').addEventListener('click', () => $('#screen-help').classList.add('hidden'));
$('#btnStyle').addEventListener('click', toggleControlStyle);
$('#btnStyle2').addEventListener('click', toggleControlStyle);
$('#btnTouch').addEventListener('click', () => { const order = ['auto', 'on', 'off']; save.touchMode = order[(order.indexOf(save.touchMode || 'auto') + 1) % 3]; persist(); applyTouchMode(); });
$('#btnMute').addEventListener('click', () => { save.muted = !save.muted; persist(); $('#btnMute').textContent = '♪ SOUND: ' + (save.muted ? 'OFF' : 'ON'); });
$('#btnReset').addEventListener('click', () => askConfirm('ERASE ALL PROGRESS?', () => { save = defaultSave(); persist(); goTitle(); }));
document.querySelectorAll('[data-go="title"]').forEach(b => b.addEventListener('click', goTitle));
$('#selectBack').addEventListener('click', () => goMapInfo(selLevel));
$('#miBack').addEventListener('click', goLevels);
$('#miEnter').addEventListener('click', () => goSelect(selLevel));
$('#btnSail').addEventListener('click', () => { if (isUnlocked(selChar)) startLevel(selLevel, selChar); });
$('#pauseBtn').addEventListener('click', () => togglePause(true));
$('#btnResume').addEventListener('click', () => togglePause(false));
$('#btnRestart').addEventListener('click', () => { $('#screen-pause').classList.add('hidden'); startLevel(G.level, P.id); });
$('#btnQuit').addEventListener('click', () => { $('#screen-pause').classList.add('hidden'); goLevels(); });
$('#unlockOk').addEventListener('click', () => { $('#screen-unlock').classList.add('hidden'); nextCelebration(); if (!$('#screen-select').classList.contains('hidden')) renderSelect(); });
window.addEventListener('keydown', e => {
  if (e.code === 'Enter' && !$('#screen-unlock').classList.contains('hidden')) { e.preventDefault(); $('#unlockOk').click(); }
});
