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
      if (a === 'jump' || a === 'up') tryJump();
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
  updatePlatforms(dt);
  updatePlayer(dt);
  updateEnv(dt);
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
    G.boss = spawnEnemy(L.boss, G.arenaX + AW - 50, GROUND, G.level, L.variant);
    G.boss.active = true; G.boss.face = -1; G.boss.stT = 1.5;
    toast('BOSS: ' + G.boss.name, 2.2); sfx('ult'); shake(6);
    for (const e of G.enemies) if (e.alive && e !== G.boss && e.x < G.arenaX) e.alive = false;
  }
  // camera
  let target = P.x - W * (touchOn() ? 0.34 : 0.42);
  if (G.arena) target = G.arenaX - (W - AW) / 2; // centre the arena in the view
  target = clamp(target, 0, G.worldW - W);
  G.cam += (target - G.cam) * Math.min(1, dt * 8);
  G.shake = Math.max(0, G.shake - dt * 30);
  G.flash = Math.max(0, G.flash - dt);
  if (G.won && G.t > G.endT) finishLevel(true);
  else if (G.over && G.t > G.endT) finishLevel(false);
}

function tryJump() {
  if ((P.lockUntil > G.t && !P.dash) || P.sinking || G.t < P.stunUntil) return;
  const D = CH[P.id], jv = 335 * (D.jump || 1);
  if (P.swim) { P.swim = false; P.vy = -300; P.y = GROUND + 2; sfx('water'); particles(P.x, GROUND, 8, ['#b3e5fc', '#fff'], { angle: -Math.PI / 2, spread: 0.8, spd: 90 }); return; }
  const qs = P.onGround && segAt(P.x).kind === 'quicksand';
  if (P.onGround || P.coyote > 0) { P.vy = -jv * (qs ? 0.78 : 1); P.sink = 0; P.onGround = false; P.coyote = 0; P.plat = null; sfx('jump'); particles(P.x, P.y, 4, ['#fff', '#ddd'], { angle: -Math.PI / 2, spread: 1.2, spd: 40 }); }
  else if (P.airJumps > 0) { P.airJumps--; P.vy = -jv * 0.9; sfx('jump'); particles(P.x, P.y, 8, ['#ff7a00', '#ffd23f'], { angle: Math.PI / 2, spread: 0.8, spd: 60 }); act('kick', 0.15, { fire: true }); }
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
  if (P.form && G.t > P.formUntil) endForm();
  P.buffs = P.buffs.filter(b => G.t < b.until);
  P.energy = Math.min(100, P.energy + dt * 2.2);
  if (P.regenUntil > G.t) P.hp = Math.min(P.maxHp, P.hp + P.regen * dt);
  if (P.coyote > 0) P.coyote -= dt;
  const seg = segAt(P.x);
  const locked = G.t < P.lockUntil || G.t < P.stunUntil || !!P.sinking;
  let spd = D.spd * statMul('spd') * G.mods.spd;
  if (P.form === 'white') spd *= 1.35;
  if (P.charging) spd *= 0.4;
  if (G.t < P.chillUntil) spd *= 0.55;
  if (P.onGround && seg.kind === 'shallow') spd *= 0.8;
  if (P.onGround && seg.kind === 'quicksand') spd *= 0.45;
  if (P.swim) spd *= P.form === 'mermaid' ? 1.25 : 0.6;
  const wind = inWind(P.x);
  if (wind && TRAITS.windRider(P.id)) spd *= 1.25;
  const onIce = P.onGround && ((seg.kind === 'ice' && !P.plat) || (P.plat && P.plat.kind === 'ice'));
  const slippery = onIce && !TRAITS.noSlip(P.id);
  if (P.dash && G.t < P.dash.until) { P.vx = P.dash.vx; }
  else {
    P.dash = null;
    let target = 0;
    if (!locked && !G.over && !G.won) {
      const dir = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0);
      target = dir * spd;
      if (dir) P.face = dir;
    }
    if (slippery) P.vx += (target - P.vx) * Math.min(1, dt * 2.2); else P.vx = target;
  }
  if (wind && !TRAITS.windRider(P.id)) P.x += wind * (P.onGround ? 45 : 70) * dt;
  if (P.charging && Math.random() < 0.5) particles(P.x + P.face * 18, P.y - 12, 1, ['#ffd23f', '#ff7a00', '#fff'], { spd: 30, grav: 0, life: 0.3 });
  if (P.transform > G.t && Math.random() < 0.6) particles(P.x + rand(-6, 6), P.y - rand(0, 24), 1, P.form === 'white' ? ['#ffffff', '#fff59d'] : ['#fff', '#ffd1dc'], { grav: -120, spd: 20 });
  if (hasBuff('POWER') && Math.random() < 0.25) particles(P.x + rand(-5, 5), P.y - rand(5, 22), 1, ['#ffffffaa', '#ffd1dc'], { grav: -90, spd: 15, life: 0.6 });
  if (P.form === 'white' && Math.random() < 0.5) particles(P.x + rand(-8, 8), P.y - rand(0, 26), 1, ['#ffffff', '#fffde7', '#e1f5fe'], { grav: -140, spd: 25, life: 0.5 });
  if (P.form === 'mermaid' && Math.random() < 0.2) particles(P.x + rand(-6, 6), P.y - rand(0, 20), 1, ['#4dd0e1', '#e0f7fa'], { grav: -60, spd: 10, life: 0.8 });
  if (G.t < P.chillUntil && Math.random() < 0.2) particles(P.x + rand(-6, 6), P.y - rand(0, 20), 1, ['#e1f5fe', '#81d4fa'], { grav: 30, spd: 10, life: 0.5 });
  // ride moving / bobbing platforms
  if (P.plat && P.onGround) {
    if (P.x + 4 > P.plat.x && P.x - 4 < P.plat.x + P.plat.w) { P.x += P.plat.dx; P.y = P.plat.y; } else P.plat = null;
  }
  const prevY = P.y, prevX = P.x;
  if (P.sinking) {
    // cursed-fruit users sink like a stone; a lifebuoy hauls them back
    P.vy = 30; P.y += P.vy * dt; P.vx = 0;
    if (Math.random() < 0.4) particles(P.x + rand(-4, 4), GROUND + 2, 1, ['#ffffff', '#b3e5fc'], { grav: -80, spd: 20, life: 0.6 });
    if (G.t - P.sinking > 1.0) rescue('sea');
    return;
  }
  if (P.swim) {
    P.vy = 0; P.y = GROUND + 10 + Math.round(Math.sin(G.t * 4));
    if (Math.random() < 0.1) particles(P.x + rand(-6, 6), GROUND + 2, 1, ['#ffffff'], { grav: -20, spd: 10, life: 0.4 });
  } else {
    P.vy += GRAV * dt;
    if (P.vy > 600) P.vy = 600;
    P.y += P.vy * dt;
  }
  const wasGround = P.onGround;
  if (!P.swim) P.onGround = false;
  if (P.vy >= 0 && !P.swim) {
    for (const pl of G.plats) {
      if (P.x + 4 > pl.x && P.x - 4 < pl.x + pl.w && prevY <= pl.y + 1 && P.y >= pl.y && !input.held.down) { P.y = pl.y; P.vy = 0; P.onGround = true; P.plat = pl; }
    }
    if (!P.onGround) { const fl = floorAt(P.x, 3); if (P.y >= fl && prevY <= fl + 3) { P.y = fl; P.vy = 0; P.onGround = true; P.plat = null; } }
  }
  if (P.onGround) P.airJumps = P.skyWalk > G.t ? 2 : 0;
  if (wasGround && !P.onGround && P.vy >= 0) P.coyote = 0.08;
  P.x += (P.vx + P.kx) * dt;
  P.kx -= P.kx * Math.min(1, 7 * dt);
  // you can't walk sideways into the ground from inside a pit (swimmers climb out)
  if (P.y > GROUND + 3 && !solidAt(prevX) && solidAt(P.x)) {
    if (P.swim) { P.swim = false; P.y = GROUND; P.vy = 0; P.onGround = true; sfx('jump'); }
    else P.x = prevX;
  }
  const minX = G.arena ? G.arenaX + 8 : 8, maxX = G.arena ? G.arenaX + AW - 8 : G.worldW - 8;
  P.x = clamp(P.x, minX, maxX);
  if (Math.abs(P.vx) > 1 && (P.onGround || P.swim)) P.walk += dt * 10 * (Math.abs(P.vx) / 90); else P.walk = 0;
  // terrain effects
  const here = segAt(P.x);
  // remember solid footing well away from any edge, so a rescue never drops you straight back in
  if (P.onGround && !P.plat && here.kind !== 'quicksand' && solidAt(P.x - 24) && solidAt(P.x + 24) && !inWind(P.x)) { P.safeX = P.x; }
  if (P.onGround && !P.plat && here.kind === 'quicksand') {
    P.sink = Math.min(14, (P.sink || 0) + dt * 9);
    if (P.sink >= 14 && G.t > (P.sinkHurt || 0)) { P.sinkHurt = G.t + 0.8; P.hp -= 3; popText(P.x, P.y - 28, '-3', '#ff9f43'); if (P.hp <= 0) { P.hp = 0; gameOver(); } }
  } else P.sink = Math.max(0, (P.sink || 0) - dt * 30);
  if (here.kind === 'shallow' && P.onGround && Math.abs(P.vx) > 1 && Math.random() < 0.2) particles(P.x, GROUND - 2, 1, ['#b3e5fc', '#fff'], { angle: -Math.PI / 2, spread: 0.7, spd: 40, life: 0.3 });
  if (P.id === 'shipwright' && here.kind === 'ship' && P.onGround && P.hp < P.maxHp) P.hp = Math.min(P.maxHp, P.hp + 3 * dt);
  if (here.kind === 'deep' && !P.swim && P.y >= GROUND + 6) {
    if (TRAITS.swimmer(P.id)) { P.swim = true; P.vy = 0; P.onGround = false; sfx('water'); particles(P.x, GROUND, 12, ['#b3e5fc', '#fff'], { angle: -Math.PI / 2, spread: 0.8, spd: 100 }); }
    else { P.sinking = G.t; P.swim = false; sfx('water'); toast('SEA CURSE! SINKING…', 1); particles(P.x, GROUND, 14, ['#b3e5fc', '#fff'], { angle: -Math.PI / 2, spread: 0.8, spd: 110 }); }
  }
  if (P.swim && here.kind !== 'deep') { P.swim = false; P.y = GROUND; P.onGround = true; }
  if (P.swim && !TRAITS.swimmer(P.id)) { P.swim = false; P.sinking = G.t; } // mermaid form ran out mid-swim
  if (here.kind === 'gap' && P.y > GROUND + 50) rescue('fall');
  if (here.kind === 'lava' && P.y >= GROUND + 4) rescue('lava');
}

// pull the player back to the last safe ground after falling in water, a gap or lava
function rescue(kind) {
  const pct = kind === 'lava' ? (TRAITS.fireproof(P.id) ? 0.06 : 0.16) : 0.12;
  const dmg = Math.max(1, Math.round(P.maxHp * pct));
  P.hp -= dmg; G.stats.hurt += dmg;
  if (kind === 'sea') P.energy = Math.max(0, P.energy - 25);
  const msg = kind === 'sea' ? 'RESCUED BY A LIFEBUOY!' : kind === 'lava' ? 'OUCH! LAVA!' : 'CAUGHT BY A CLOUD!';
  P.sinking = null; P.swim = false; P.plat = null;
  P.x = nearestSolidX(P.safeX || 40); P.y = GROUND - 30; P.vy = -100; P.vx = 0; P.kx = 0; P.onGround = false;
  P.inv = G.t + 1.4;
  G.cam = clamp(P.x - W * 0.42, G.arena ? G.arenaX : 0, G.worldW - W);
  popText(P.x, P.y - 20, '-' + dmg, '#ff5252', true);
  toast(msg, 1.3); sfx('hurt'); shake(4);
  const cols = kind === 'lava' ? ['#ff7043', '#ffca28'] : kind === 'sea' ? ['#ff5252', '#ffffff'] : ['#ffffff', '#e3f2fd'];
  particles(P.x, P.y, 20, cols, { spd: 80 });
  fx({ x: P.x, y: P.y, life: 1, draw(f) { const k = f.age / f.life; g.globalAlpha = 1 - k; if (kind === 'sea') { g.strokeStyle = '#ff5252'; g.lineWidth = 3; g.beginPath(); g.arc(P.x, P.y - 12, 11, 0, Math.PI * 2); g.stroke(); R(P.x - 2, P.y - 25, 4, 4, '#fff'); R(P.x - 2, P.y + 1, 4, 3, '#fff'); } else if (kind === 'fall') { R(P.x - 14, P.y + 1, 28, 5, '#ffffff'); R(P.x - 9, P.y - 2, 18, 4, '#ffffff'); } g.globalAlpha = 1; } });
  if (P.hp <= 0) { P.hp = 0; gameOver(); }
}

function updateHitboxes(dt) {
  for (const h of G.hbs) {
    h.age += dt;
    if (h.age >= h.life) { h.dead = true; continue; }
    if (h.follow) { h.x = P.x + P.face * h.follow.ox; h.y = P.y - h.follow.oy; }
    else { h.vy += h.grav * dt; h.x += h.vx * dt; h.y += h.vy * dt; }
    if (h.update) h.update(h, dt);
    if (h.dead) continue;
    if (h.solid && h.y + h.h / 2 >= GROUND && solidAt(h.x)) { if (h.onGround) h.onGround(h); else h.dead = true; if (h.dead) continue; }
    if (h.y > GROUND + 70) { h.dead = true; continue; }
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
    if (h.age >= h.life) { if (h.landed) bombBoom(h); h.dead = true; continue; }
    if (h.follow) { if (!h.follow.alive) { h.dead = true; continue; } h.x = h.follow.x + h.follow.face * h.fox; h.y = h.follow.y - h.foy; }
    else { h.vy += h.grav * dt; h.x += h.vx * dt; h.y += h.vy * dt; }
    if (h.update) h.update(h, dt);
    if (h.dead) continue;
    if (h.landed) { h.fuse -= dt; if (h.fuse <= 0) bombBoom(h); continue; }
    if (h.grav && h.y + h.h / 2 >= GROUND && h.vy > 0) {
      if (solidAt(h.x)) {
        if (h.onLand) { h.onLand(h); continue; }
        h.dead = true;
        if (h.boom) { shake(3); particles(h.x, GROUND, 12, ['#ff7a00', '#ffd23f', '#555'], { spd: 110 }); addHazard({ x: h.x, y: GROUND - 10, w: 36, h: 20, life: 0.12, dmg: h.dmg, kind: 'none' }); }
        else particles(h.x, GROUND - 2, 6, h.kind === 'rock' ? ['#6d4c41', '#ff7043'] : h.kind === 'icicle' || h.kind === 'snow' ? ['#e1f5fe', '#fff'] : ['#b3e5fc', '#fff'], { spd: 60 });
        if (h.kind === 'rock') shake(2);
        continue;
      }
      if (h.y > GROUND + 50) { h.dead = true; particles(h.x, GROUND, 5, ['#b3e5fc', '#fff'], { spd: 50 }); continue; }
    }
    if (h.age < h.delay || h.harmless) continue;
    if (overlap({ x: h.x - h.w / 2, y: h.y - h.h / 2, w: h.w, h: h.h }, pr)) {
      if (h.fire && TRAITS.fireproof(P.id)) continue;
      const before = P.hp;
      hurtPlayer(h.dmg, h.x);
      if (P.hp < before) { if (h.chill) chillPlayer(2.2); if (h.push) P.kx = (Math.sign(P.x - h.x) || 1) * h.push; }
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
  updateOrbs(dt);
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
