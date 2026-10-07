'use strict';
// =========================================================
// SCREENS / FLOW
// =========================================================
const SCREENS = ['title', 'levels', 'mapinfo', 'select', 'result', 'pause', 'help', 'unlock', 'confirm', 'journey'];
function showScreen(name) {
  for (const s of SCREENS) if (s !== 'unlock' && s !== 'confirm') $('#screen-' + s).classList.toggle('hidden', s !== name);
  document.querySelectorAll('.walletCoins').forEach(el => { el.textContent = save.coins.toLocaleString('en-US'); });
  if (name && name !== 'pause' && name !== 'help') { $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); document.body.classList.remove('bomb-mode'); }
}
function goTitle() {
  G = null;
  $('#titleBest').textContent = save.bestScore.toLocaleString('en-US');
  $('#btnMute').textContent = '♪ SOUND: ' + (save.muted ? 'OFF' : 'ON');
  applyTouchMode();
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
  else { selChar = isUnlocked(J.char) ? J.char : 'captain'; goMapInfo(Math.min(J.level, maxPlayable())); }
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
  s2.highestLevel = n(o.highestLevel, 1, LEVELS.length + 1);
  s2.unlocked = ['captain'].concat((Array.isArray(o.unlocked) ? o.unlocked : []).filter(id => CH[id] && id !== 'captain'));
  s2.bosses = (Array.isArray(o.bosses) ? o.bosses : []).filter(b => b === 1 || b === 2);
  s2.cleared = (Array.isArray(o.cleared) ? o.cleared : []).filter(l => l >= 1 && l <= LEVELS.length);
  if (o.levelBest && typeof o.levelBest === 'object') for (const k of LEVELS.map(l => String(l.n))) if (Number.isFinite(o.levelBest[k])) s2.levelBest[k] = n(o.levelBest[k], 0, 1e12);
  s2.selected = CH[o.selected] ? o.selected : 'captain';
  s2.muted = !!o.muted;
  const J = o.journey;
  if (J && typeof J === 'object' && J.level >= 1 && J.level <= LEVELS.length && CH[J.char]) s2.journey = { level: n(J.level, 1, LEVELS.length), char: J.char, cp: n(J.cp, 0, 3), cpx: n(J.cpx, 0, 5000), score: n(J.score, 0, 1e9), coins: n(J.coins, 0, 1e9), kills: n(J.kills, 0, 999) };
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

function maxPlayable() { return Math.min(LEVELS.length, save.highestLevel); }
function goLevels() {
  G = null;
  const list = $('#levelList');
  list.innerHTML = '';
  for (const L of LEVELS) {
    const M = MAPS[L.map];
    const locked = L.n > maxPlayable();
    const cleared = save.cleared.includes(L.n);
    const b = document.createElement('button');
    b.className = 'level-card' + (locked ? ' locked' : '') + (cleared ? ' cleared' : '');
    b.dataset.level = L.n;
    b.innerHTML = `<canvas width="160" height="90"></canvas><div class="lc-name"><span class="num">${L.n}</span> ${M.icon} ${L.name}</div><div class="sub stars">${starStr(M.difficulty)}</div><div class="sub">${L.desc}</div><div class="sub">${locked ? '🔒 Clear Level ' + (L.n - 1) : cleared ? '✔ BEST ' + (save.levelBest[L.n] || 0).toLocaleString('en-US') : 'NEW!'}</div>`;
    renderMapPreview(b.querySelector('canvas'), L.map);
    if (!locked) b.addEventListener('click', () => goMapInfo(L.n));
    list.appendChild(b);
  }
  // bonus mode card
  const bonusOpen = save.highestLevel >= BONUS_UNLOCK_LEVEL;
  const bb = document.createElement('button');
  bb.className = 'level-card bonus' + (bonusOpen ? '' : ' locked');
  bb.id = 'bombCard';
  bb.innerHTML = `<canvas width="130" height="70"></canvas><div class="lc-name">💣 BONUS · Bomb Island</div><div class="sub">Top-down arcade mini-game</div><div class="sub">${bonusOpen ? 'BEST STAGE ' + (save.bombBest || 0) : '🔒 Clear Level ' + (BONUS_UNLOCK_LEVEL - 1) + ' (' + LEVELS[BONUS_UNLOCK_LEVEL - 2].name + ')'}</div>`;
  renderBombPreview(bb.querySelector('canvas'));
  if (bonusOpen) bb.addEventListener('click', () => startBomb(1));
  list.appendChild(bb);
  showScreen('levels');
}

function goMapInfo(n) {
  G = null;
  const L = LEVELS[n - 1], M = MAPS[L.map];
  selLevel = n;
  $('#miTitle').textContent = 'LEVEL ' + n + ' · ' + M.icon + ' ' + M.name.toUpperCase();
  renderMapPreview($('#miCanvas'), L.map);
  $('#miBlurb').textContent = M.blurb + (L.boss ? (L.bossN ? ' A boss guards the end!' : ' A mini boss guards the end!') : '');
  $('#miDiff').textContent = starStr(M.difficulty);
  $('#miAdv').innerHTML = M.advText.map(t => `<li>${t}</li>`).join('');
  $('#miHaz').innerHTML = M.hazardText.map(t => `<li>${t}</li>`).join('');
  $('#miRec').innerHTML = recommendedFor(L.map).map(id => `<div class="rec ${isUnlocked(id) ? '' : 'locked'}"><canvas width="32" height="32"></canvas><span>${CH[id].emoji} ${CH[id].short}<br><i class="stars">${starStr(stars(id, L.map))}</i>${MAP_NOTES[id] && MAP_NOTES[id][L.map] ? '<br><small>' + MAP_NOTES[id][L.map] + '</small>' : ''}</span></div>`).join('');
  $('#miRec').querySelectorAll('canvas').forEach((cv, i) => { const id = recommendedFor(L.map)[i]; portrait(cv, id, !isUnlocked(id)); });
  showScreen('mapinfo');
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
  if (u.type === 'boss') { const L = LEVELS.find(l => l.bossN === u.n); return 'Defeat Boss ' + u.n + ' (Level ' + L.n + ' · ' + L.name + ')'; }
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
  const M = MAPS[LEVELS[level - 1].map];
  $('#selectTitle').textContent = 'SELECT YOUR PIRATE · ' + M.icon + ' ' + M.name.toUpperCase();
  renderSelect();
  showScreen('select');
}
function statPips(n) { let h = ''; for (let i = 1; i <= 5; i++) h += `<i class="${i <= n ? 'on' : ''}"></i>`; return `<span class="pips">${h}</span>`; }
function renderSelect() {
  const mapId = LEVELS[selLevel - 1].map;
  const grid = $('#charGrid');
  grid.innerHTML = '';
  for (const id of CH_ORDER) {
    const D = CH[id], un = isUnlocked(id), st = stars(id, mapId);
    const b = document.createElement('button');
    b.className = 'char-card' + (un ? '' : ' locked') + (id === selChar ? ' sel' : '') + (st >= 4 ? ' good' : st <= 2 ? ' bad' : '');
    b.dataset.char = id;
    b.innerHTML = `<canvas width="32" height="32"></canvas><div class="cname">${D.emoji} ${D.short}</div><div class="mstars s${st}">${starStr(st)}</div>` +
      (un ? '' : `<div class="lock">🔒 ${reqText(D.unlock)}</div>`);
    portrait(b.querySelector('canvas'), id, !un);
    b.addEventListener('click', () => { selChar = id; renderSelect(); });
    grid.appendChild(b);
  }
  const D = CH[selChar], un = isUnlocked(selChar), st = stars(selChar, mapId), M = MAPS[mapId];
  const strong = MAP_ORDER.filter(m => stars(selChar, m) >= 4).map(m => MAPS[m].icon + ' ' + MAPS[m].name).join(', ');
  const weak = MAP_ORDER.filter(m => stars(selChar, m) <= 2).map(m => MAPS[m].icon + ' ' + MAPS[m].name).join(', ');
  const sm = STAR_MODS[st];
  const fx2 = v => (v >= 1 ? '+' : '') + Math.round((v - 1) * 100) + '%';
  const note = MAP_NOTES[selChar] && MAP_NOTES[selChar][mapId];
  const sk = s => D[s] ? `<div class="sk">${iconImg(SKILL_ICONS[selChar][s], 'skicon')}<div><b>[${{ basic: 'J', s1: 'Q', s2: 'E', s3: 'F', ult: 'R' }[s]}] ${D[s].name}</b>${D[s].cd ? ' · ' + D[s].cd + 's' : s === 'ult' ? ' · energy' : ''}<br><span>${D[s].desc}</span></div></div>` : '';
  let action = '';
  if (!un) {
    const u = D.unlock;
    action = `<div class="req">🔒 ${reqLong(u)}</div>`;
    if (u.type === 'coins') action += `<button class="btn primary" id="btnBuy" ${save.coins >= u.n ? '' : 'disabled'}>UNLOCK 🪙 ${u.n}</button>` + (save.coins < u.n ? `<div class="tiny">Need ${u.n - save.coins} more coins</div>` : '');
  }
  $('#charInfo').innerHTML = `<h3>${D.emoji} ${D.name}</h3><div class="role">${D.title}<br>ROLE: ${D.role} · HP ${D.hp}</div>
    <div class="statgrid"><span>ATTACK</span>${statPips(D.stats.atk)}<span>DEFENSE</span>${statPips(D.stats.def)}<span>SPEED</span>${statPips(D.stats.spd)}</div>
    <div class="special">★ SPECIAL: ${D.special}</div>
    <div class="mapfit s${st}"><b>${M.icon} ${M.name}: ${starStr(st)}</b><br>ATK ${fx2(sm[0])} · DMG TAKEN ${fx2(sm[1])} · SPEED ${fx2(sm[2])}${note ? '<br>» ' + note : ''}${SEA_WEAK.has(selChar) && (mapId === 'ocean' || mapId === 'final') ? '<br>⚠ Cursed fruit: sinks in deep water!' : ''}</div>
    <div class="strongweak"><div><b class="good">STRONG</b> ${strong || '—'}</div><div><b class="bad">WEAK</b> ${weak || '—'}</div></div>
    ${sk('basic')}${sk('s1')}${sk('s2')}${sk('s3')}${sk('ult')}${action}`;
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
    save.journey = n < LEVELS.length ? { level: n + 1, char: P.id, cp: 0, cpx: 0, score: 0, coins: 0, kills: 0 } : null;
  }
  save.bestScore = Math.max(save.bestScore, G.score);
  persist();
  const fresh = win ? checkUnlocks() : [];
  $('#hud').classList.add('hidden');
  $('#touch').classList.add('hidden');
  const final = win && n === LEVELS.length;
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
  if (win && !final) add('[ NEXT LEVEL ]', 'primary', () => goMapInfo(n + 1), 'btnNext');
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
