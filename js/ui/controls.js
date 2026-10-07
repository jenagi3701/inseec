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

// Round action buttons fan out around the big attack button (units = stage px).
// Angles keep every button clear of its neighbours and of the screen edge.
const BTN_LAYOUT = { attack: { a: null, s: 56 }, jump: { a: 200, s: 40 }, s1: { a: 158, s: 38 }, s2: { a: 122, s: 38 }, s3: { a: 89, s: 38 }, ult: { a: 56, s: 40 } };
(function placeButtons() {
  const cx = 64, cy = 46, rad = 72;
  document.querySelectorAll('#tbtns .tbtn').forEach(b => {
    const L = BTN_LAYOUT[b.dataset.action];
    let x = cx, y = cy;
    if (L.a != null) { x = cx - Math.cos(L.a * Math.PI / 180) * rad; y = cy + Math.sin(L.a * Math.PI / 180) * rad; }
    b.style.setProperty('--s', L.s); b.style.setProperty('--r', (x - L.s / 2).toFixed(1)); b.style.setProperty('--b', (y - L.s / 2).toFixed(1));
  });
})();
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
function applyCamera() {
  setCameraMode(save.camera || 'wide');
  const label = '📷 CAMERA: ' + (save.camera === 'close' ? 'CLOSE' : 'WIDE');
  for (const id of ['#btnCamera', '#btnCamera2']) $(id).textContent = label;
  if (G && G.running) G.cam = clamp(P.x - W * 0.42, G.arena ? G.arenaX - (W - AW) / 2 : 0, G.worldW - W);
}
applyCamera();
const toggleCamera = () => { save.camera = save.camera === 'close' ? 'wide' : 'close'; persist(); applyCamera(); };
$('#btnCamera').addEventListener('click', toggleCamera);
$('#btnCamera2').addEventListener('click', toggleCamera);
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
