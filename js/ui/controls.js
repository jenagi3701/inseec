'use strict';
// =========================================================
// layout & touch
// =========================================================
const isTouch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
if (isTouch) document.body.classList.add('touch');
function updateTouchVisibility() { $('#touch').classList.toggle('hidden', !(isTouch && G && G.running)); }
function layout() {
  const s = Math.max(0.5, Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
  const st = $('#stage');
  st.style.width = Math.floor(STAGE_W * s) + 'px';
  st.style.height = Math.floor(STAGE_H * s) + 'px';
  st.style.setProperty('--u', s + 'px');
}
window.addEventListener('resize', layout);
document.querySelectorAll('#touch .tbtn').forEach(b => {
  const a = b.dataset.action;
  const down = e => { e.preventDefault(); b.classList.add('active'); press(a); };
  const up = e => { e.preventDefault(); b.classList.remove('active'); release(a); };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('pointerleave', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});

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
$('#btnMute').addEventListener('click', () => { save.muted = !save.muted; persist(); $('#btnMute').textContent = '♪ SOUND: ' + (save.muted ? 'OFF' : 'ON'); });
$('#btnReset').addEventListener('click', () => askConfirm('ERASE ALL PROGRESS?', () => { save = defaultSave(); persist(); goTitle(); }));
document.querySelectorAll('[data-go="title"]').forEach(b => b.addEventListener('click', goTitle));
$('#selectBack').addEventListener('click', goLevels);
$('#btnSail').addEventListener('click', () => { if (isUnlocked(selChar)) startLevel(selLevel, selChar); });
$('#pauseBtn').addEventListener('click', () => togglePause(true));
$('#btnResume').addEventListener('click', () => togglePause(false));
$('#btnRestart').addEventListener('click', () => { $('#screen-pause').classList.add('hidden'); startLevel(G.level, P.id); });
$('#btnQuit').addEventListener('click', () => { $('#screen-pause').classList.add('hidden'); goLevels(); });
$('#unlockOk').addEventListener('click', () => { $('#screen-unlock').classList.add('hidden'); nextCelebration(); if (!$('#screen-select').classList.contains('hidden')) renderSelect(); });
window.addEventListener('keydown', e => {
  if (e.code === 'Enter' && !$('#screen-unlock').classList.contains('hidden')) { e.preventDefault(); $('#unlockOk').click(); }
});
