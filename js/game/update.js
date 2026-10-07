'use strict';
// =========================================================
// UPDATE
// =========================================================
function update(dt) {
  G.t += dt;
  // queued input
  while (input.queue.length) {
    const [a, down] = input.queue.shift();
    if (a === 'pause') { if (down) togglePause(); continue; }
    if (G.over || G.won) continue;
    if (down) {
      if (a === 'jump') tryJump();
      else if (a === 'attack') tryBasic();
      else if (a === 's1' || a === 's2' || a === 's3' || a === 'ult') trySkill(a);
    } else if (P.charging && P.charging.slot === a) releaseCharge();
  }
  if (!G.over && !G.won && input.held.attack) tryBasic();

  // timers
  if (G.timers.length) {
    const due = G.timers.filter(t => t.at <= G.t);
    if (due.length) { G.timers = G.timers.filter(t => t.at > G.t); for (const t of due) if (!G.over) t.fn(); }
  }
  updatePlayer(dt);
  for (const e of G.enemies) if (e.alive) updateEnemy(e, dt);
  if (G.enemies.length > 80) G.enemies = G.enemies.filter(e => e.alive);
  updateHitboxes(dt);
  updateHazards(dt);
  updateCoins(dt);
  updateFx(dt);
  updateChest(dt);
  updateCheckpoints();

  // boss arena trigger
  const L = G.L;
  if (L.boss && !G.arena && P.x > G.arenaX + 60 && !save._noBoss) {
    G.arena = true;
    G.boss = spawnEnemy(L.boss, G.arenaX + W - 50, GROUND, G.level);
    G.boss.active = true; G.boss.face = -1; G.boss.stT = 1.5;
    toast('BOSS: ' + G.boss.name, 2.2); sfx('ult'); shake(6);
    for (const e of G.enemies) if (e.alive && e !== G.boss && e.x < G.arenaX) e.alive = false;
  }
  // camera
  let target = P.x - W * 0.42;
  if (G.arena) target = G.arenaX;
  target = clamp(target, 0, G.worldW - W);
  G.cam += (target - G.cam) * Math.min(1, dt * 8);
  G.shake = Math.max(0, G.shake - dt * 30);
  G.flash = Math.max(0, G.flash - dt);
  if (G.won && G.t > G.endT) finishLevel(true);
  else if (G.over && G.t > G.endT) finishLevel(false);
}

function tryJump() {
  if (P.lockUntil > G.t && !P.dash) return;
  if (P.onGround || P.coyote > 0) { P.vy = -335; P.onGround = false; P.coyote = 0; sfx('jump'); particles(P.x, P.y, 4, ['#fff', '#ddd'], { angle: -Math.PI / 2, spread: 1.2, spd: 40 }); }
}
function tryBasic() {
  if (G.t < P.cd.basic || G.t < P.lockUntil || P.charging) return;
  const D = CH[P.id];
  D.basic.use();
  P.cd.basic = G.t + D.basic.cd / statMul('aspd');
}
function trySkill(slot) {
  const D = CH[P.id], sk = D[slot];
  if (!sk || P.charging) return;
  if (G.t < P.lockUntil) return;
  if (slot === 'ult') {
    if (P.energy < 100) { toast('ULTIMATE CHARGING… ' + Math.floor(P.energy) + '%', 0.9); return; }
    P.energy = 0;
    G.flash = 0.12;
    toast(sk.name.toUpperCase() + '!', 1.2);
    sk.use();
    return;
  }
  if (G.t < P.cd[slot]) return;
  if (sk.hold) { P.charging = { slot, start: G.t }; return; }
  sk.use();
  P.cd[slot] = G.t + sk.cd;
}
function releaseCharge() {
  const c = P.charging; P.charging = null;
  const sk = CH[P.id][c.slot];
  const k = clamp((G.t - c.start) / 1.2, 0, 1);
  sk.fire(k);
  P.cd[c.slot] = G.t + sk.cd;
}

function updatePlayer(dt) {
  const D = CH[P.id];
  if (P.form && G.t > P.formUntil) { P.form = null; particles(P.x, P.y - 10, 12, ['#4dd0e1', '#fff'], {}); }
  P.buffs = P.buffs.filter(b => G.t < b.until);
  P.energy = Math.min(100, P.energy + dt * 2.2);
  if (P.coyote > 0) P.coyote -= dt;
  const locked = G.t < P.lockUntil;
  let spd = D.spd * statMul('spd');
  if (P.charging) spd *= 0.4;
  if (P.dash && G.t < P.dash.until) { P.vx = P.dash.vx; }
  else {
    P.dash = null;
    if (locked || G.over || G.won) P.vx = 0;
    else {
      const dir = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0);
      P.vx = dir * spd;
      if (dir) P.face = dir;
    }
  }
  if (P.charging) {
    if (Math.random() < 0.5) particles(P.x + P.face * 18, P.y - 12, 1, ['#ffd23f', '#ff7a00', '#fff'], { spd: 30, grav: 0, life: 0.3 });
  }
  if (P.transform > G.t && Math.random() < 0.6) particles(P.x + rand(-6, 6), P.y - rand(0, 24), 1, ['#fff', '#ffd1dc'], { grav: -120, spd: 20 });
  if (hasBuff('POWER') && Math.random() < 0.25) particles(P.x + rand(-5, 5), P.y - rand(5, 22), 1, ['#ffffffaa', '#ffd1dc'], { grav: -90, spd: 15, life: 0.6 });
  if (P.form === 'mermaid' && Math.random() < 0.2) particles(P.x + rand(-6, 6), P.y - rand(0, 20), 1, ['#4dd0e1', '#e0f7fa'], { grav: -60, spd: 10, life: 0.8 });
  // physics
  const prevY = P.y;
  P.vy += GRAV * dt;
  if (P.vy > 600) P.vy = 600;
  P.y += P.vy * dt;
  const wasGround = P.onGround;
  P.onGround = false;
  if (P.vy >= 0) {
    for (const pl of G.plats) {
      if (P.x + 4 > pl.x && P.x - 4 < pl.x + pl.w && prevY <= pl.y + 0.5 && P.y >= pl.y && !input.held.down) { P.y = pl.y; P.vy = 0; P.onGround = true; }
    }
    if (P.y >= GROUND) { P.y = GROUND; P.vy = 0; P.onGround = true; }
  }
  if (wasGround && !P.onGround && P.vy >= 0) P.coyote = 0.08;
  P.x += (P.vx + P.kx) * dt;
  P.kx -= P.kx * Math.min(1, 7 * dt);
  const minX = G.arena ? G.arenaX + 8 : 8, maxX = G.arena ? G.arenaX + W - 8 : G.worldW - 8;
  P.x = clamp(P.x, minX, maxX);
  if (Math.abs(P.vx) > 1 && P.onGround) P.walk += dt * 10 * (Math.abs(P.vx) / 90); else P.walk = 0;
}

function updateHitboxes(dt) {
  for (const h of G.hbs) {
    h.age += dt;
    if (h.age >= h.life) { h.dead = true; continue; }
    if (h.follow) { h.x = P.x + P.face * h.follow.ox; h.y = P.y - h.follow.oy; }
    else { h.vy += h.grav * dt; h.x += h.vx * dt; h.y += h.vy * dt; }
    if (h.update) h.update(h, dt);
    if (h.dead) continue;
    if (h.solid && h.y + h.h / 2 >= GROUND) { if (h.onGround) h.onGround(h); else h.dead = true; if (h.dead) continue; }
    if (!h.follow && (h.x < G.cam - 140 || h.x > G.cam + W + 140)) { h.dead = true; continue; }
    if (h.age < h.delay) continue;
    const r = hbRect(h);
    for (const e of G.enemies) {
      if (!e.alive) continue;
      if (!overlap(r, enemyRect(e))) continue;
      const last = h.hits.get(e);
      if (last !== undefined && (h.tick === 0 || G.t - last < h.tick)) continue;
      h.hits.set(e, G.t);
      hitEnemy(e, h.dmg, h.opts, h);
      if (h.onHit) h.onHit(h, e);
      h.pierce--;
      if (h.pierce <= 0) { h.dead = true; break; }
    }
  }
  G.hbs = G.hbs.filter(h => !h.dead);
}

function updateHazards(dt) {
  const pr = playerRect();
  for (const h of G.hz) {
    h.age += dt;
    if (h.age >= h.life) { h.dead = true; continue; }
    h.vy += h.grav * dt; h.x += h.vx * dt; h.y += h.vy * dt;
    if (h.grav && h.y + h.h / 2 >= GROUND) {
      h.dead = true;
      if (h.boom) { shake(3); particles(h.x, GROUND, 12, ['#ff7a00', '#ffd23f', '#555'], { spd: 110 }); addHazard({ x: h.x, y: GROUND - 10, w: 36, h: 20, life: 0.12, dmg: h.dmg, kind: 'none' }); }
      else particles(h.x, GROUND - 2, 5, ['#b3e5fc', '#fff'], { spd: 60 });
      continue;
    }
    if (h.age < h.delay) continue;
    if (overlap({ x: h.x - h.w / 2, y: h.y - h.h / 2, w: h.w, h: h.h }, pr)) {
      hurtPlayer(h.dmg, h.x);
      if (h.once && h.kind !== 'tentacle' && h.kind !== 'none') h.dead = true;
    }
  }
  G.hz = G.hz.filter(h => !h.dead);
}

function updateCoins(dt) {
  for (const c of G.coins) {
    c.age += dt;
    const dx = P.x - c.x, dy = (P.y - 12) - c.y, d = Math.hypot(dx, dy);
    if (c.age > 0.35 && d < 42) { c.x += dx / d * 220 * dt; c.y += dy / d * 220 * dt; }
    else if (!c.placed) {
      c.vy += GRAV * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.y >= GROUND - 4) { c.y = GROUND - 4; c.vy = -c.vy * 0.4; c.vx *= 0.7; if (Math.abs(c.vy) < 30) c.vy = 0; }
    }
    if (d < 10 && c.age > 0.2) {
      c.got = true; G.coinCount += c.v; G.score += c.v * 2;
      popText(c.x, c.y - 6, '+' + c.v, '#ffd23f'); sfx('coin');
    }
  }
  G.coins = G.coins.filter(c => !c.got);
  for (const h of G.hearts) {
    h.age += dt; h.vy += GRAV * 0.5 * dt; h.y += h.vy * dt;
    if (h.y >= GROUND - 5) { h.y = GROUND - 5; h.vy = 0; }
    if (h.age > 0.3 && Math.abs(P.x - h.x) < 10 && Math.abs(P.y - 10 - h.y) < 16) { h.got = true; heal(15); }
    if (h.age > 12) h.got = true;
  }
  G.hearts = G.hearts.filter(h => !h.got);
}

function updateFx(dt) {
  for (const p of G.parts) { p.age += dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  G.parts = G.parts.filter(p => p.age < p.life);
  if (G.parts.length > 600) G.parts.splice(0, G.parts.length - 600);
  for (const t of G.texts) t.age += dt;
  G.texts = G.texts.filter(t => t.age < t.life);
  for (const f of G.fx) f.age += dt;
  G.fx = G.fx.filter(f => f.age < f.life);
}

function updateCheckpoints() {
  G.cps.forEach((c, i) => {
    if (c.done || G.over || P.x < c.x) return;
    c.done = true;
    // bank the coins found so far and record where to resume
    save.coins += G.coinCount - G.banked; G.banked = G.coinCount;
    save.journey = { level: G.level, char: P.id, cp: i + 1, cpx: c.x, score: G.score, coins: G.coinCount, kills: G.stats.kills };
    persist();
    P.hp = Math.min(P.maxHp, P.hp + Math.round(P.maxHp * 0.2));
    toast('⚑ JOURNEY SAVED!', 1.4); sfx('open');
    particles(c.x + 6, GROUND - 30, 20, ['#ffd23f', '#fff8c2', '#8ef59b'], { spd: 90, grav: -40 });
  });
}
function drawCheckpoint(c) {
  const x = Math.round(c.x), wave = Math.floor(G.t * 6) % 2;
  R(x, GROUND - 34, 2, 34, '#5a3412'); R(x - 1, GROUND - 36, 4, 3, '#ffd23f');
  const col = c.done ? '#ffd23f' : '#c62828';
  R(x + 2, GROUND - 33, 12, 8, col); R(x + 14, GROUND - 31 + wave, 2, 5, col);
  R(x + 6, GROUND - 31, 4, 4, c.done ? '#fff8c2' : '#fff');
  R(x - 3, GROUND - 2, 8, 2, '#5a3412');
}
function updateChest(dt) {
  const c = G.chest;
  if (!c) return;
  if (c.drop != null && c.drop < 0) c.drop = Math.min(0, c.drop + dt * 120);
  if (!c.open && Math.abs(P.x - c.x) < 16 && !G.over) {
    c.open = true; sfx('open');
    const bonus = 50 + G.level * 30;
    G.coinCount += bonus; G.score += bonus * 2;
    popText(c.x, GROUND - 34, '+' + bonus + ' COINS', '#ffd23f', true);
    for (let i = 0; i < 14; i++) G.parts.push({ x: c.x, y: GROUND - 18, vx: rand(-60, 60), vy: rand(-220, -120), life: 1, age: 0, c: '#ffd23f', s: 3, grav: 500 });
    sfx('coin');
    particles(c.x, GROUND - 16, 30, ['#ffd23f', '#fff8c2', '#ff4f6d'], { angle: -Math.PI / 2, spread: 0.9, spd: 180 });
    toast('TREASURE FOUND!', 1.6);
    G.won = true; G.endT = G.t + 1.8;
  }
}
