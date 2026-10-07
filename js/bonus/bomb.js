'use strict';
// =========================================================
// BONUS MODE — BOMB ISLAND (top-down grid arcade)
// =========================================================
// Walk the grid, drop bombs, blast crates, dodge monsters, grab coins and
// power-ups, then reach the exit once every monster is gone.
const BT = 16, BCOLS = 15, BROWS = 11, BOX = (W - BCOLS * BT) / 2, BOY = 2;
const B_WALL = 1, B_CRATE = 2;
const BOMB_POWERS = {
  fire: { icon: 'flame', label: 'BIGGER BLAST' },
  bomb: { icon: 'bomb', label: '+1 BOMB' },
  speed: { icon: 'wing', label: 'FASTER' },
  shield: { icon: 'guard', label: 'SHIELD' },
  star: { icon: 'white', label: 'INVINCIBLE!' },
};

function startBomb(stage, keep) {
  const rng = seeded(stage * 7331 + 17);
  const grid = [], loot = {};
  for (let y = 0; y < BROWS; y++) {
    grid.push([]);
    for (let x = 0; x < BCOLS; x++) {
      const border = x === 0 || y === 0 || x === BCOLS - 1 || y === BROWS - 1;
      const pillar = x % 2 === 0 && y % 2 === 0;
      const safe = (x <= 2 && y <= 2);
      grid[y].push(border || pillar ? B_WALL : (!safe && rng() < 0.5 + Math.min(0.15, stage * 0.02) ? B_CRATE : 0));
    }
  }
  const crates = [];
  for (let y = 0; y < BROWS; y++) for (let x = 0; x < BCOLS; x++) if (grid[y][x] === B_CRATE) crates.push([x, y]);
  for (let i = crates.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [crates[i], crates[j]] = [crates[j], crates[i]]; }
  // the exit hides under a crate far from the start
  const far = crates.slice().sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]));
  const exit = far[Math.floor(rng() * Math.min(6, far.length))];
  loot[exit + ''] = 'exit';
  const powerKeys = Object.keys(BOMB_POWERS);
  let pi = 0;
  for (const c of crates) {
    if (loot[c + '']) continue;
    const r = rng();
    if (r < 0.13) loot[c + ''] = powerKeys[(pi++ + stage) % powerKeys.length];
    else if (r < 0.45) loot[c + ''] = 'coin';
  }
  const prev = keep || {};
  G = {
    bomb: true, running: true, paused: false, over: false, won: false, t: 0, endT: 0, stage,
    grid, loot, exit, exitOpen: false, bombs: [], flames: [], items: [], monsters: [], parts: [], texts: [], fx: [],
    shake: 0, flash: 0, score: prev.score || 0, coinCount: 0, banked: 0, stats: { kills: 0, dmg: 0, hurt: 0 },
    level: 0, L: { name: 'Bomb Island' }, cam: 0, timers: [], hz: [], hbs: [], hearts: [], coins: [], enemies: [], cps: [],
  };
  const id = isUnlocked(save.selected) ? save.selected : 'captain';
  P = {
    id, bomb: true, tx: 1, ty: 1, x: tileX(1), y: tileY(1), moving: false, face: 1, walk: 0,
    hp: prev.hp || 3, maxHp: 3, range: prev.range || 2, maxBombs: prev.maxBombs || 1, speed: prev.speed || 62,
    shield: prev.shield || false, starUntil: 0, inv: 0, buffs: [], cd: {}, energy: 0,
  };
  // monsters: wanderers, plus chasers from stage 3
  const free = [];
  for (let y = 1; y < BROWS - 1; y++) for (let x = 1; x < BCOLS - 1; x++) if (!grid[y][x] && x + y > 7) free.push([x, y]);
  const nM = Math.min(free.length, 3 + stage);
  for (let i = 0; i < nM; i++) {
    const k = Math.floor(rng() * free.length), [mx, my] = free.splice(k, 1)[0];
    const chaser = stage >= 3 && i % 3 === 2;
    G.monsters.push({ kind: chaser ? 'chaser' : 'blob', tx: mx, ty: my, x: tileX(mx), y: tileY(my), moving: false, dir: [1, 0], spd: chaser ? 34 + stage * 2 : 26 + stage * 2, alive: true, id: i + 1 });
  }
  input.queue.length = 0; for (const k in input.held) input.held[k] = false;
  showScreen(null);
  $('#hud').classList.remove('hidden');
  document.body.classList.add('bomb-mode');
  setupBombHUD();
  updateTouchVisibility();
  toast('💣 BOMB ISLAND · STAGE ' + stage, 2);
}
function tileX(x) { return BOX + x * BT + BT / 2; }
function tileY(y) { return BOY + y * BT + BT / 2; }
function bombAt(x, y) { return G.bombs.find(b => b.tx === x && b.ty === y); }
function walkable(x, y, who) {
  if (x < 0 || y < 0 || x >= BCOLS || y >= BROWS) return false;
  if (G.grid[y][x]) return false;
  const b = bombAt(x, y);
  if (b && !(who && who.tx === x && who.ty === y)) return false;
  return true;
}

function updateBomb(dt) {
  G.t += dt;
  while (input.queue.length) {
    const [a, down] = input.queue.shift();
    if (a === 'pause') { if (down) togglePause(); continue; }
    if (G.over || G.won) continue;
    if (down && (a === 'attack' || a === 'jump')) placeBomb();
  }
  if (!G.over && !G.won) bombMovePlayer(dt);
  for (const m of G.monsters) if (m.alive) bombMoveMonster(m, dt);
  // bombs tick
  for (const b of G.bombs) { b.t -= dt; if (b.t <= 0 && !b.done) explodeBomb(b); }
  G.bombs = G.bombs.filter(b => !b.done);
  for (const f of G.flames) f.life -= dt;
  G.flames = G.flames.filter(f => f.life > 0);
  // flames hurt
  for (const f of G.flames) {
    if (f.tx === P.tx && f.ty === P.ty) bombHurt();
    for (const m of G.monsters) if (m.alive && f.tx === m.tx && f.ty === m.ty) killMonster(m);
    for (const it of G.items) if (it.tx === f.tx && it.ty === f.ty && it.kind !== 'exit' && G.t - it.born > 0.6) it.gone = true;
  }
  G.items = G.items.filter(i => !i.gone);
  // monster contact
  for (const m of G.monsters) if (m.alive && Math.hypot(m.x - P.x, m.y - P.y) < 11) bombHurt();
  // pickups
  for (const it of G.items) {
    if (it.tx !== P.tx || it.ty !== P.ty || Math.hypot(tileX(it.tx) - P.x, tileY(it.ty) - P.y) > 6) continue;
    if (it.kind === 'exit') { if (G.exitOpen && !G.won) bombStageClear(); continue; }
    it.gone = true;
    if (it.kind === 'coin') { G.coinCount += 10; G.score += 20; sfx('coin'); popText(it.x, it.y - 6, '+10', '#ffd23f'); continue; }
    sfx('unlock'); popText(it.x, it.y - 8, BOMB_POWERS[it.kind].label, '#8ef59b', true);
    if (it.kind === 'fire') P.range = Math.min(6, P.range + 1);
    if (it.kind === 'bomb') P.maxBombs = Math.min(5, P.maxBombs + 1);
    if (it.kind === 'speed') P.speed = Math.min(110, P.speed + 12);
    if (it.kind === 'shield') P.shield = true;
    if (it.kind === 'star') P.starUntil = G.t + 6;
  }
  if (!G.exitOpen && G.monsters.every(m => !m.alive)) { G.exitOpen = true; toast('EXIT OPEN! FIND THE DOOR', 1.6); sfx('open'); }
  updateFx(dt);
  G.shake = Math.max(0, G.shake - dt * 30);
  G.flash = Math.max(0, G.flash - dt);
  if (G.won && G.t > G.endT) startBomb(G.stage + 1, { score: G.score, hp: P.hp, range: P.range, maxBombs: P.maxBombs, speed: P.speed, shield: P.shield, coins: 0 });
  else if (G.over && G.t > G.endT) finishBomb();
}

function bombDir() {
  // keyboard / joystick: pick one axis (the stronger joystick axis wins on diagonals)
  const h = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0), v = (input.held.down ? 1 : 0) - (input.held.up ? 1 : 0);
  if (h && v) return Math.abs(joy.x) > Math.abs(joy.y) || !joy.id ? [h, 0] : [0, v];
  if (h) return [h, 0];
  if (v) return [0, v];
  return null;
}
function bombMovePlayer(dt) {
  const d = bombDir();
  if (!P.moving && d) {
    if (d[0]) P.face = d[0];
    const nx = P.tx + d[0], ny = P.ty + d[1];
    if (walkable(nx, ny, P)) { P.tx = nx; P.ty = ny; P.moving = true; }
  }
  if (P.moving) {
    const gx = tileX(P.tx), gy = tileY(P.ty), dx = gx - P.x, dy = gy - P.y, dist = Math.hypot(dx, dy), step = P.speed * dt;
    if (dist <= step) { P.x = gx; P.y = gy; P.moving = false; } else { P.x += dx / dist * step; P.y += dy / dist * step; }
    P.walk += dt * 10;
  } else P.walk = 0;
}
function bombMoveMonster(m, dt) {
  if (!m.moving) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let choice = null;
    if (m.kind === 'chaser') {
      const best = dirs.filter(d => walkable(m.tx + d[0], m.ty + d[1])).sort((a, b) => Math.hypot(m.tx + a[0] - P.tx, m.ty + a[1] - P.ty) - Math.hypot(m.tx + b[0] - P.tx, m.ty + b[1] - P.ty));
      choice = Math.random() < 0.8 ? best[0] : pick(best);
    } else {
      if (walkable(m.tx + m.dir[0], m.ty + m.dir[1]) && Math.random() < 0.75) choice = m.dir;
      else { const opts = dirs.filter(d => walkable(m.tx + d[0], m.ty + d[1])); choice = opts.length ? pick(opts) : null; }
    }
    if (choice) { m.dir = choice; m.tx += choice[0]; m.ty += choice[1]; m.moving = true; }
  }
  if (m.moving) {
    const gx = tileX(m.tx), gy = tileY(m.ty), dx = gx - m.x, dy = gy - m.y, dist = Math.hypot(dx, dy), step = m.spd * dt;
    if (dist <= step) { m.x = gx; m.y = gy; m.moving = false; } else { m.x += dx / dist * step; m.y += dy / dist * step; }
  }
}
function placeBomb() {
  if (G.bombs.length >= P.maxBombs || bombAt(P.tx, P.ty)) return;
  // drop the bomb on the tile the player is mostly standing on
  const tx = Math.round((P.x - BOX - BT / 2) / BT), ty = Math.round((P.y - BOY - BT / 2) / BT);
  if (G.grid[ty][tx] || bombAt(tx, ty)) return;
  G.bombs.push({ tx, ty, t: 2.5, range: P.range, done: false });
  sfx('jump');
}
function explodeBomb(b) {
  b.done = true;
  sfx('boom'); shake(4);
  const add = (x, y) => G.flames.push({ tx: x, ty: y, life: 0.5 });
  add(b.tx, b.ty);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (let i = 1; i <= b.range; i++) {
      const x = b.tx + dx * i, y = b.ty + dy * i, cell = G.grid[y][x];
      if (cell === B_WALL) break;
      add(x, y);
      if (cell === B_CRATE) { breakCrate(x, y); break; }
      const other = bombAt(x, y);
      if (other && !other.done) other.t = Math.min(other.t, 0.08); // chain reaction
    }
  }
  particles(tileX(b.tx), tileY(b.ty), 16, ['#ff7a00', '#ffd23f', '#fff'], { spd: 100, grav: 0 });
}
function breakCrate(x, y) {
  G.grid[y][x] = 0;
  particles(tileX(x), tileY(y), 10, ['#a0682f', '#7a4a22', '#ffd23f'], { spd: 70, grav: 120 });
  const kind = G.loot[[x, y] + ''];
  if (kind) G.items.push({ kind, tx: x, ty: y, x: tileX(x), y: tileY(y), born: G.t });
  G.score += 10;
}
function killMonster(m) {
  m.alive = false; G.stats.kills++; G.score += 100;
  popText(m.x, m.y - 8, '+100', '#ffd23f');
  particles(m.x, m.y, 14, m.kind === 'chaser' ? ['#ff7043', '#ffca28'] : ['#55d16b', '#fff'], { spd: 90, grav: 0 });
  sfx('kill');
}
function bombHurt() {
  if (G.over || G.won || G.t < P.inv || G.t < P.starUntil) return;
  if (P.shield) { P.shield = false; P.inv = G.t + 1.2; popText(P.x, P.y - 14, 'SHIELD!', '#90caf9', true); sfx('punch'); return; }
  P.hp--; P.inv = G.t + 1.5; shake(5); sfx('hurt');
  popText(P.x, P.y - 14, '-1 ❤', '#ff5252', true);
  if (P.hp <= 0) { G.over = true; G.endT = G.t + 1.4; toast('KA-BOOM! GAME OVER', 1.4); }
}
function bombStageClear() {
  G.won = true; G.endT = G.t + 1.6; G.score += 300 * G.stage;
  save.coins += G.coinCount; G.banked = G.coinCount;
  save.bombBest = Math.max(save.bombBest || 0, G.stage);
  persist();
  sfx('open'); toast('STAGE ' + G.stage + ' CLEAR! +' + G.coinCount + ' COINS', 1.6);
}
function finishBomb() {
  if (!G.running) return;
  G.running = false;
  save.coins += G.coinCount - G.banked;
  save.bombBest = Math.max(save.bombBest || 0, G.stage - 1);
  save.bestScore = Math.max(save.bestScore, G.score);
  persist();
  document.body.classList.remove('bomb-mode');
  $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden');
  $('#resultTitle').textContent = '💣 BOMB ISLAND OVER';
  $('#resultStats').innerHTML = `<div class="big">⭐ SCORE: ${G.score.toLocaleString('en-US')}</div><div>🏝 STAGE REACHED: ${G.stage}</div><div>👾 MONSTERS BLASTED: ${G.stats.kills}</div><div>🪙 COINS THIS STAGE: ${G.coinCount}</div><div class="tiny">BEST STAGE CLEARED: ${save.bombBest || 0} · 🪙 TOTAL: ${save.coins.toLocaleString('en-US')}</div>`;
  const btns = $('#resultButtons'); btns.innerHTML = '';
  const add = (label, cls, fn, id) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label; b.id = id; b.addEventListener('click', fn); btns.appendChild(b); };
  add('↻ PLAY AGAIN', 'primary', () => startBomb(1), 'btnBombAgain');
  add('⚑ VOYAGE MAP', '', () => goLevels(), 'btnMap');
  showScreen('result');
  sfx('over');
}

// ---------- HUD ----------
function setupBombHUD() {
  $('#skills').innerHTML = '';
  $('#levelName').textContent = '💣 BOMB ISLAND · STAGE ' + G.stage;
  document.querySelectorAll('#tbtns .tbtn').forEach(b => {
    const isBomb = b.dataset.action === 'attack';
    b.classList.toggle('hidden', !isBomb);
    b.querySelectorAll('img').forEach(i => i.remove());
    if (isBomb) b.insertAdjacentHTML('afterbegin', iconImg('bomb'));
  });
  for (const k in hudCache) delete hudCache[k];
}
function updateBombHUD() {
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += heartSVG(P.hp > i ? 'full' : 'empty');
  if (hudCache.hearts !== hearts) { hudCache.hearts = hearts; $('#hearts').innerHTML = hearts; }
  setText('#hpText', '💣' + P.maxBombs + ' 🔥' + P.range + (P.shield ? ' 🛡' : '') + (G.t < P.starUntil ? ' ★' : ''));
  setText('#hudCoins', String(G.coinCount));
  setText('#hudScore', G.score.toLocaleString('en-US'));
  setText('#hudKills', G.monsters.filter(m => m.alive).length + ' LEFT');
  setText('#buffs', '');
  $('#bossBar').classList.add('hidden');
}

// ---------- render ----------
const bombIconImgs = {};
function bombIcon(name) { if (!bombIconImgs[name]) { const im = new Image(); im.src = iconURL(name); bombIconImgs[name] = im; } return bombIconImgs[name]; }
function renderBomb() {
  const sh = G.shake > 0 ? Math.round(rand(-G.shake, G.shake) * 0.5) : 0;
  g.fillStyle = '#1f7fc8'; g.fillRect(0, 0, W, H);
  for (let y = 4; y < H; y += 8) for (let x = 0; x < W; x += 30) R(x + ((Math.floor(G.t * 10) + y) % 30), y, 9, 1, '#7fd0f5');
  g.save(); g.translate(sh, 0);
  R(BOX - 3, BOY - 1, BCOLS * BT + 6, BROWS * BT + 2, '#f1d08a');
  for (let y = 0; y < BROWS; y++) for (let x = 0; x < BCOLS; x++) {
    const px = BOX + x * BT, py = BOY + y * BT, c = G.grid[y][x];
    if (c === B_WALL) { R(px, py, BT, BT, '#5d6d7e'); R(px, py, BT, 3, '#85929e'); R(px + 2, py + 6, 5, 1, '#4a5662'); R(px + 9, py + 11, 5, 1, '#4a5662'); }
    else {
      R(px, py, BT, BT, (x + y) % 2 ? '#8fd18f' : '#9ad99a');
      if (c === B_CRATE) { R(px + 1, py + 1, BT - 2, BT - 2, '#a0682f'); R(px + 1, py + 1, BT - 2, 2, '#c08850'); R(px + 1, py + 7, BT - 2, 2, '#7a4a22'); R(px + 3, py + 3, 1, BT - 6, '#7a4a22'); R(px + BT - 4, py + 3, 1, BT - 6, '#7a4a22'); }
    }
  }
  // items
  for (const it of G.items) {
    const px = BOX + it.tx * BT, py = BOY + it.ty * BT;
    if (it.kind === 'exit') { R(px + 2, py + 1, 12, 14, G.exitOpen ? '#ffd23f' : '#6d4c41'); R(px + 4, py + 3, 8, 12, G.exitOpen ? '#4e342e' : '#3e2723'); R(px + 10, py + 9, 2, 2, '#ffd23f'); if (!G.exitOpen) pxText('🔒', px + 8, py - 3, '#fff'); continue; }
    if (it.kind === 'coin') { drawCoin(px + 8, py + 8 + Math.sin(G.t * 5 + it.tx) * 1.5, G.t); continue; }
    R(px + 1, py + 1, 14, 14, Math.floor(G.t * 6) % 2 ? '#ffffff' : '#ffe082'); const im = bombIcon(BOMB_POWERS[it.kind].icon); if (im.complete) g.drawImage(im, px + 2, py + 2, 12, 12);
  }
  // bombs
  for (const b of G.bombs) { const px = tileX(b.tx), py = tileY(b.ty), pulse = Math.floor(G.t * (b.t < 0.8 ? 16 : 6)) % 2; circle(px, py + 1, 6 + pulse, '#212121'); R(px - 3, py - 3, 2, 2, '#9e9e9e'); R(px + 2, py - 8, 2, 3, '#795548'); if (pulse) R(px + 3, py - 10, 2, 2, '#ffd23f'); }
  // flames
  for (const f of G.flames) { const px = BOX + f.tx * BT, py = BOY + f.ty * BT, k = f.life / 0.5; R(px + 1, py + 1, BT - 2, BT - 2, '#ff7a00'); R(px + 3, py + 3, BT - 6, BT - 6, k > 0.5 ? '#ffd23f' : '#ffab40'); R(px + 6, py + 6, 4, 4, '#ffffff'); }
  // monsters
  for (const m of G.monsters) {
    if (!m.alive) continue;
    const fake = { type: m.kind === 'chaser' ? 'firemonster' : 'slime', id: m.id, x: m.x, y: m.y + 7, w: 14, h: 12, face: m.dir[0] || 1, flash: 0, onGround: true, st: 'idle', stunUntil: 0, holdUntil: 0, burnUntil: 0 };
    outlined(20, 22, (ax, ay) => (ENEMY_ART[fake.type] ? ENEMY_ART[fake.type](fake, ax, ay, fake.face, G.t, c => c) : drawEnemyBody(fake, ax, ay)), fake.x, fake.y);
  }
  // player (drawn standing on its tile)
  if (!(G.t < P.inv && Math.floor(G.t * 16) % 2)) {
    if (G.t < P.starUntil) { g.globalAlpha = 0.45; circle(P.x, P.y - 4, 10, Math.floor(G.t * 10) % 2 ? '#fff59d' : '#ffffff'); g.globalAlpha = 1; }
    if (P.shield) { g.strokeStyle = '#90caf9'; g.lineWidth = 1; g.beginPath(); g.arc(P.x, P.y - 4, 11, 0, Math.PI * 2); g.stroke(); }
    heroOutlined(P.id, P.x, P.y + 7, P.face, { walk: P.moving ? P.walk : null, t: G.t });
  }
  for (const p of G.parts) R(p.x, p.y, p.s, p.s, p.c);
  for (const t of G.texts) { const k = t.age / t.life; g.globalAlpha = 1 - k * k; pxText(t.str, t.x, t.y - t.age * 24, t.color); g.globalAlpha = 1; }
  g.restore();
  if (G.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(0.7, G.flash * 6) + ')'; g.fillRect(0, 0, W, H); }
}
