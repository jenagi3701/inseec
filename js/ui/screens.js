'use strict';
// =========================================================
// SCREENS / FLOW
// =========================================================
const SCREENS = ['title', 'levels', 'select', 'result', 'pause', 'help', 'unlock', 'confirm', 'journey'];
function showScreen(name) {
  for (const s of SCREENS) if (s !== 'unlock' && s !== 'confirm') $('#screen-' + s).classList.toggle('hidden', s !== name);
  document.querySelectorAll('.walletCoins').forEach(el => { el.textContent = save.coins.toLocaleString('en-US'); });
  if (name && name !== 'pause' && name !== 'help') { $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); }
}
function goTitle() {
  G = null;
  $('#titleBest').textContent = save.bestScore.toLocaleString('en-US');
  $('#btnMute').textContent = '♪ SOUND: ' + (save.muted ? 'OFF' : 'ON');
  const J = save.journey, c = $('#btnContinue');
  c.classList.toggle('hidden', !J);
  if (J) c.textContent = '▶ CONTINUE · LV ' + J.level + (J.cp > 0 ? ' ⚑' + J.cp : '');
  $('#btnPlay').classList.toggle('primary', !J);
  $('#btnPlay').textContent = J ? '⚑ VOYAGE MAP' : '▶ PLAY';
  showScreen('title');
}
function continueJourney() {
  const J = save.journey;
  if (!J) return goLevels();
  if (J.cp > 0 && isUnlocked(J.char)) startLevel(J.level, J.char, true);
  else { selChar = isUnlocked(J.char) ? J.char : 'captain'; goSelect(Math.min(J.level, maxPlayable())); }
}

// ---- journey log + transferable save code ----
const SAVE_PREFIX = 'PPA1-';
function saveCode() { return SAVE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(save)))); }
function parseSaveCode(code) {
  code = String(code || '').trim().replace(/\s+/g, '');
  if (!code.startsWith(SAVE_PREFIX)) throw new Error('A save code starts with ' + SAVE_PREFIX);
  let o;
  try { o = JSON.parse(decodeURIComponent(escape(atob(code.slice(SAVE_PREFIX.length))))); } catch (e) { throw new Error('This code is incomplete or damaged. Copy the whole code and try again.'); }
  if (!o || typeof o !== 'object') throw new Error('This code is incomplete or damaged.');
  const n = (v, lo, hi) => (Number.isFinite(v) ? clamp(Math.floor(v), lo, hi) : lo);
  const s2 = defaultSave();
  s2.coins = n(o.coins, 0, 1e9); s2.totalScore = n(o.totalScore, 0, 1e12); s2.bestScore = n(o.bestScore, 0, 1e12);
  s2.highestLevel = n(o.highestLevel, 1, 6);
  s2.unlocked = ['captain'].concat((Array.isArray(o.unlocked) ? o.unlocked : []).filter(id => CH[id] && id !== 'captain'));
  s2.bosses = (Array.isArray(o.bosses) ? o.bosses : []).filter(b => b === 1 || b === 2);
  s2.cleared = (Array.isArray(o.cleared) ? o.cleared : []).filter(l => l >= 1 && l <= 5);
  if (o.levelBest && typeof o.levelBest === 'object') for (const k of ['1', '2', '3', '4', '5']) if (Number.isFinite(o.levelBest[k])) s2.levelBest[k] = n(o.levelBest[k], 0, 1e12);
  s2.selected = CH[o.selected] ? o.selected : 'captain';
  s2.muted = !!o.muted;
  const J = o.journey;
  if (J && typeof J === 'object' && J.level >= 1 && J.level <= 5 && CH[J.char]) s2.journey = { level: n(J.level, 1, 5), char: J.char, cp: n(J.cp, 0, 3), cpx: n(J.cpx, 0, 5000), score: n(J.score, 0, 1e9), coins: n(J.coins, 0, 1e9), kills: n(J.kills, 0, 999) };
  return s2;
}
function goJourney() {
  const lv = LEVELS.map(L => {
    const J = save.journey, cleared = save.cleared.includes(L.n), here = J && J.level === L.n;
    const st = cleared ? '✔ CLEARED · BEST ' + (save.levelBest[L.n] || 0).toLocaleString('en-US') : here ? (J.cp > 0 ? '⚑ CHECKPOINT ' + J.cp + ' OF ' + (L.boss ? 3 : 2) : '▶ NEXT STOP') : L.n > maxPlayable() ? '🔒 NOT REACHED' : '· OPEN';
    return `<li class="${cleared ? 'done' : here ? 'here' : ''}"><b>${L.n}. ${L.name}</b>${L.boss ? ' ☠' : ''}<span>${st}</span></li>`;
  }).join('');
  $('#journeyLog').innerHTML = `<ol class="jlog">${lv}</ol>
    <div class="jstats"><div>CREW <b>${save.unlocked.length}/9</b></div><div>BOSSES <b>${save.bosses.length}/2</b></div><div>🪙 <b>${save.coins.toLocaleString('en-US')}</b></div><div>⭐ TOTAL <b>${save.totalScore.toLocaleString('en-US')}</b></div></div>`;
  $('#saveCodeOut').value = saveCode();
  $('#saveCodeIn').value = '';
  $('#saveMsg').textContent = 'Your journey saves automatically in this browser at every checkpoint.';
  showScreen('journey');
}

function maxPlayable() { return Math.min(5, save.highestLevel); }
function goLevels() {
  G = null;
  const list = $('#levelList');
  list.innerHTML = '';
  for (const L of LEVELS) {
    const locked = L.n > maxPlayable();
    const cleared = save.cleared.includes(L.n);
    const b = document.createElement('button');
    b.className = 'level-card' + (locked ? ' locked' : '') + (cleared ? ' cleared' : '');
    b.dataset.level = L.n;
    b.innerHTML = `<div class="num">${L.n}</div><div>${L.name}</div><div class="sub">${L.desc}${L.boss ? ' ☠' : ''}</div><div class="sub">${locked ? '🔒 Clear Level ' + (L.n - 1) : cleared ? '✔ BEST ' + (save.levelBest[L.n] || 0).toLocaleString('en-US') : 'NEW!'}</div>`;
    if (!locked) b.addEventListener('click', () => goSelect(L.n));
    list.appendChild(b);
  }
  showScreen('levels');
}

let selLevel = 1, selChar = 'captain';
function reqText(u) {
  if (u.type === 'coins') return u.n + ' coins';
  if (u.type === 'level') return 'Level ' + u.n;
  if (u.type === 'boss') return 'Boss ' + u.n;
  return '';
}
function reqLong(u) {
  if (u.type === 'coins') return 'Unlock for 🪙 ' + u.n + ' coins';
  if (u.type === 'level') return 'Reach Level ' + u.n + ' (clear Level ' + (u.n - 1) + ')';
  if (u.type === 'boss') return 'Defeat Boss ' + u.n + (u.n === 1 ? ' (Level 3)' : ' (Level 5)');
  return '';
}
function isUnlocked(id) { return save.unlocked.includes(id); }

function portrait(canvasEl, id, locked) {
  const c = canvasEl.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, canvasEl.width, canvasEl.height);
  withCtx(c, () => {
    const s = canvasEl.width / 32;
    c.save(); c.scale(s, s);
    if (!locked) { c.fillStyle = CH[id].color + '55'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#00000022'; c.fillRect(0, 26, 32, 6); }
    heroOutlined(id, 16, 29, 1, { t: 0 });
    c.restore();
    if (locked) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#0b1226'; c.fillRect(0, 0, canvasEl.width, canvasEl.height); c.globalCompositeOperation = 'source-over'; }
  });
}

function goSelect(level) {
  G = null;
  selLevel = level;
  if (!isUnlocked(selChar)) selChar = isUnlocked(save.selected) ? save.selected : 'captain';
  $('#selectTitle').textContent = 'LEVEL ' + level + ' · ' + LEVELS[level - 1].name.toUpperCase() + ' — CHOOSE YOUR PIRATE';
  renderSelect();
  showScreen('select');
}
function renderSelect() {
  const grid = $('#charGrid');
  grid.innerHTML = '';
  for (const id of CH_ORDER) {
    const D = CH[id], un = isUnlocked(id);
    const b = document.createElement('button');
    b.className = 'char-card' + (un ? '' : ' locked') + (id === selChar ? ' sel' : '');
    b.dataset.char = id;
    b.innerHTML = `<canvas width="32" height="32"></canvas><div class="cname">${D.emoji} ${D.short}</div>` +
      (un ? '<div class="ok">🔓 READY</div>' : `<div class="lock">🔒 ${reqText(D.unlock)}</div>`);
    portrait(b.querySelector('canvas'), id, !un);
    b.addEventListener('click', () => { selChar = id; renderSelect(); });
    grid.appendChild(b);
  }
  const D = CH[selChar], un = isUnlocked(selChar);
  const sk = s => D[s] ? `<div class="sk"><b>[${{ basic: 'J', s1: 'Q', s2: 'E', s3: 'F', ult: 'R' }[s]}] ${D[s].name}</b>${D[s].cd ? ' · ' + D[s].cd + 's' : s === 'ult' ? ' · energy' : ''}<br><span>${D[s].desc}</span></div>` : '';
  let action = '';
  if (!un) {
    const u = D.unlock;
    action = `<div class="req">🔒 ${reqLong(u)}</div>`;
    if (u.type === 'coins') action += `<button class="btn primary" id="btnBuy" ${save.coins >= u.n ? '' : 'disabled'}>UNLOCK 🪙 ${u.n}</button>` + (save.coins < u.n ? `<div class="tiny">Need ${u.n - save.coins} more coins</div>` : '');
  }
  $('#charInfo').innerHTML = `<h3>${D.emoji} ${D.name}</h3><div class="role">${D.title}<br>${D.role} · HP ${D.hp}</div>${sk('basic')}${sk('s1')}${sk('s2')}${sk('s3')}${sk('ult')}${action}`;
  const buy = $('#btnBuy');
  if (buy) buy.addEventListener('click', () => buyChar(selChar));
  $('#btnSail').disabled = !un;
  document.querySelectorAll('.walletCoins').forEach(el => { el.textContent = save.coins.toLocaleString('en-US'); });
}
function buyChar(id) {
  const u = CH[id].unlock;
  if (u.type !== 'coins' || save.coins < u.n || isUnlocked(id)) return false;
  save.coins -= u.n;
  save.unlocked.push(id);
  persist();
  celebrate([id]);
  renderSelect();
  return true;
}

function checkUnlocks() {
  const fresh = [];
  for (const id of CH_ORDER) {
    if (isUnlocked(id)) continue;
    const u = CH[id].unlock;
    if ((u.type === 'level' && save.highestLevel >= u.n) || (u.type === 'boss' && save.bosses.includes(u.n))) { save.unlocked.push(id); fresh.push(id); }
  }
  if (fresh.length) persist();
  return fresh;
}

// celebration queue
const celebrateQ = [];
function celebrate(ids) { celebrateQ.push(...ids); if ($('#screen-unlock').classList.contains('hidden')) nextCelebration(); }
function nextCelebration() {
  const id = celebrateQ.shift();
  if (!id) { $('#screen-unlock').classList.add('hidden'); return; }
  const D = CH[id];
  $('#unlockName').textContent = D.emoji + ' ' + D.name;
  $('#unlockRole').textContent = D.title + ' — ' + D.role;
  portrait($('#unlockCanvas'), id, false);
  const conf = $('#confetti'); conf.innerHTML = '';
  const cols = ['#ffd23f', '#ff4f6d', '#4fc3f7', '#8ef59b', '#ce93d8', '#fff'];
  for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = pick(cols); s.style.animationDelay = (Math.random() * 1.8) + 's'; s.style.animationDuration = (1.2 + Math.random()) + 's'; conf.appendChild(s); }
  $('#screen-unlock').classList.remove('hidden');
  sfx('unlock');
}

function finishLevel(win) {
  if (!G.running) return;
  G.running = false;
  const n = G.level;
  const kills = G.stats.kills;
  let bonus = 0, hpBonus = 0;
  if (win) { bonus = 500 * n; hpBonus = Math.round(P.hp) * 5; G.score += bonus + hpBonus; }
  const coins = G.coinCount;
  save.coins += coins - G.banked; G.banked = coins;
  save.totalScore += G.score;
  let newBest = false;
  if (win) {
    if (!save.cleared.includes(n)) save.cleared.push(n);
    save.highestLevel = Math.max(save.highestLevel, n + 1);
    if (G.score > (save.levelBest[n] || 0)) { save.levelBest[n] = G.score; newBest = true; }
    save.journey = n < 5 ? { level: n + 1, char: P.id, cp: 0, cpx: 0, score: 0, coins: 0, kills: 0 } : null;
  }
  save.bestScore = Math.max(save.bestScore, G.score);
  persist();
  const fresh = win ? checkUnlocks() : [];
  $('#hud').classList.add('hidden');
  $('#touch').classList.add('hidden');
  const final = win && n === 5;
  $('#resultTitle').textContent = win ? (final ? '🏆 LEGEND OF THE SEAS! 🏆' : 'LEVEL COMPLETE!') : '☠ SHIPWRECKED! ☠';
  $('#resultStats').innerHTML =
    `<div class="big">⭐ SCORE: ${G.score.toLocaleString('en-US')}</div>` +
    (newBest ? '<div class="newbest">NEW BEST FOR THIS LEVEL!</div>' : '') +
    `<div>🪙 COINS: ${coins.toLocaleString('en-US')}</div>` +
    `<div>☠ ENEMIES DEFEATED: ${kills}</div>` +
    (win ? `<div>⚓ CLEAR BONUS: ${bonus}</div><div>❤ HP BONUS: ${hpBonus}</div>` : '<div class="tiny">You keep the coins you collected!' + (save.journey && save.journey.cp > 0 ? '<br>Your journey is saved at checkpoint ' + save.journey.cp + '.' : '') + '</div>') +
    `<div class="tiny">🪙 TOTAL COINS: ${save.coins.toLocaleString('en-US')}</div>`;
  const btns = $('#resultButtons');
  btns.innerHTML = '';
  const add = (label, cls, fn, id) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label; if (id) b.id = id; b.addEventListener('click', fn); btns.appendChild(b); };
  if (win && !final) add('[ NEXT LEVEL ]', 'primary', () => goSelect(n + 1), 'btnNext');
  if (final) add('[ PLAY AGAIN ]', 'primary', () => goLevels(), 'btnAgain');
  const J = save.journey;
  if (!win && J && J.level === n && J.cp > 0) add('⚑ CONTINUE FROM CHECKPOINT ' + J.cp, 'primary', () => startLevel(n, P.id, true), 'btnCheckpoint');
  if (!win) add('↻ RETRY LEVEL', J && J.cp > 0 ? '' : 'primary', () => goSelect(n), 'btnRetry');
  add('⚑ VOYAGE MAP', '', () => goLevels(), 'btnMap');
  showScreen('result');
  sfx(win ? 'open' : 'over');
  if (fresh.length) setTimeout(() => celebrate(fresh), 500);
}
function gameOver() {
  G.over = true;
  P.lockUntil = G.t + 99;
  particles(P.x, P.y - 12, 30, ['#ff5252', '#fff', '#ffd23f'], { spd: 140 });
  toast('SHIPWRECKED!', 1.5);
  G.endT = G.t + 1.5;
}
function togglePause(force) {
  if (!G || !G.running) return;
  G.paused = force != null ? force : !G.paused;
  $('#screen-pause').classList.toggle('hidden', !G.paused);
  if (G.paused) for (const k in input.held) input.held[k] = false;
}

function askConfirm(text, yes) {
  $('#confirmText').textContent = text;
  $('#screen-confirm').classList.remove('hidden');
  $('#confirmYes').onclick = () => { $('#screen-confirm').classList.add('hidden'); yes(); };
  $('#confirmNo').onclick = () => $('#screen-confirm').classList.add('hidden');
}
