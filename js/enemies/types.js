'use strict';
// =========================================================
// ENEMIES
// =========================================================
const ENEMY = {
  slime: { w: 14, h: 10, hp: 30, dmg: 10, spd: 40, score: 50, coins: 10 },
  grunt: { w: 12, h: 22, hp: 55, dmg: 12, spd: 36, score: 100, coins: 15 },
  gunner: { w: 12, h: 22, hp: 45, dmg: 12, spd: 32, score: 120, coins: 20 },
  flyer: { w: 16, h: 12, hp: 28, dmg: 10, spd: 55, score: 80, coins: 10, fly: true },
  heavy: { w: 26, h: 30, hp: 170, dmg: 18, spd: 22, score: 250, coins: 40, kbRes: 0.85, heavy: true },
  crab: { w: 60, h: 40, hp: 950, dmg: 20, spd: 40, score: 2000, coins: 250, boss: true, name: 'IRONCLAW CRAB' },
  kraken: { w: 56, h: 60, hp: 1800, dmg: 24, spd: 30, score: 5000, coins: 500, boss: true, name: 'ADMIRAL MURKFANG' },
};
let eid = 1;
function spawnEnemy(type, x, y, lvl) {
  const D = ENEMY[type];
  const hpMul = [1, 1.15, 1.4, 1.55, 1.75][lvl - 1] || 1, dmgMul = [1, 1.05, 1.15, 1.25, 1.35][lvl - 1] || 1;
  const e = {
    id: eid++, type, x, y: y != null ? y : GROUND, w: D.w, h: D.h,
    hp: Math.round(D.hp * (D.boss ? 1 : hpMul)), dmg: Math.round(D.dmg * (D.boss ? 1 : dmgMul)), spd: D.spd,
    score: D.score, coins: D.coins, fly: !!D.fly, boss: !!D.boss, heavy: !!D.heavy, kbRes: D.kbRes || (D.boss ? 1 : 0),
    vx: 0, vy: 0, kx: 0, face: -1, onGround: true, alive: true, active: false, flash: 0,
    stunUntil: 0, holdUntil: 0, flinch: 0, burnUntil: 0, burnNext: 0, st: 'idle', stT: rand(0.5, 1.5), cd: rand(0.5, 1.5), baseY: y || 0, name: D.name,
  };
  e.maxHp = e.hp;
  if (type === 'slime' && lvl >= 3) { e.tint = '#5ab4ff'; e.tint2 = '#2f78c9'; }
  G.enemies.push(e);
  return e;
}

const AI = {
  slime(e, dt) {
    e.face = Math.sign(P.x - e.x) || e.face;
    if (e.onGround) {
      e.vx *= 0.8;
      e.cd -= dt;
      if (e.cd <= 0) { e.cd = rand(0.8, 1.4); e.vy = -rand(170, 230); e.vx = e.face * rand(50, 80); e.onGround = false; }
    }
  },
  grunt(e, dt) {
    const dx = P.x - e.x;
    e.stT -= dt;
    if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'swing'; e.stT = 0.18; addHazard({ x: e.x + e.face * 16, y: e.y - 12, w: 22, h: 18, life: 0.15, dmg: e.dmg, kind: 'none', once: true }); sfx('slash'); } return; }
    if (e.st === 'swing') { e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 1.0; } return; }
    e.face = Math.sign(dx) || e.face;
    if (Math.abs(dx) < 24 && e.stT <= 0 && Math.abs(P.y - e.y) < 30) { e.st = 'wind'; e.stT = 0.45; e.vx = 0; }
    else e.vx = Math.abs(dx) > 14 ? e.face * e.spd : 0;
  },
  gunner(e, dt) {
    const dx = P.x - e.x;
    e.face = Math.sign(dx) || e.face;
    e.stT -= dt;
    if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = rand(1.6, 2.4); sfx('shoot'); addHazard({ x: e.x + e.face * 14, y: e.y - 13, vx: e.face * 170, w: 5, h: 3, life: 2.5, dmg: e.dmg, kind: 'bullet' }); } return; }
    const ad = Math.abs(dx);
    if (ad < 90) e.vx = -e.face * e.spd; else if (ad > 150) e.vx = e.face * e.spd; else e.vx = 0;
    if (e.stT <= 0 && ad < 170) { e.st = 'wind'; e.stT = 0.45; }
  },
  flyer(e, dt) {
    e.stT -= dt;
    const dx = P.x - e.x;
    if (e.st === 'swoop') {
      const tx = e.tx - e.x, ty = e.ty - e.y, d = Math.hypot(tx, ty);
      if (d < 6 || e.stT <= 0) { e.st = 'rise'; e.stT = 1; }
      else { e.vx = tx / d * 150; e.y += ty / d * 150 * dt; }
      return;
    }
    if (e.st === 'rise') { e.y += (e.baseY - e.y) * Math.min(1, dt * 2.5); e.vx = -e.face * 40; if (e.stT <= 0) { e.st = 'idle'; e.stT = rand(1.8, 2.8); } return; }
    e.face = Math.sign(dx) || e.face;
    e.vx = Math.abs(dx) > 50 ? e.face * e.spd : 0;
    e.y = e.baseY + Math.sin(G.t * 3 + e.id) * 8;
    if (e.stT <= 0 && Math.abs(dx) < 140) { e.st = 'swoop'; e.tx = P.x; e.ty = P.y - 8; e.stT = 1.2; }
  },
  heavy(e, dt) {
    const dx = P.x - e.x;
    e.stT -= dt;
    if (e.st === 'wind') {
      e.vx = 0;
      if (e.stT <= 0) {
        e.st = 'idle'; e.stT = 1.6; shake(4); sfx('boom');
        addHazard({ x: e.x, y: GROUND - 8, w: 54, h: 16, life: 0.15, dmg: e.dmg, kind: 'none' });
        for (const s of [-1, 1]) addHazard({ x: e.x + s * 20, y: GROUND - 5, vx: s * 150, w: 10, h: 10, life: 0.9, dmg: Math.round(e.dmg * 0.7), kind: 'shock' });
        particles(e.x, GROUND, 14, ['#c8a26a', '#fff'], { angle: -Math.PI / 2, spread: 1.3, spd: 120 });
      }
      return;
    }
    e.face = Math.sign(dx) || e.face;
    if (Math.abs(dx) < 60 && e.stT <= 0) { e.st = 'wind'; e.stT = 0.7; e.vx = 0; }
    else e.vx = Math.abs(dx) > 20 ? e.face * e.spd : 0;
  },
  crab(e, dt) {
    const sp = e.phase2 ? 1.35 : 1;
    if (!e.phase2 && e.hp < e.maxHp / 2) { e.phase2 = true; toast('IRONCLAW IS ENRAGED!'); }
    e.stT -= dt * sp;
    const dx = P.x - e.x;
    switch (e.st) {
      case 'idle':
        e.face = Math.sign(dx) || e.face; e.vx = Math.abs(dx) > 40 ? e.face * e.spd : 0;
        if (e.stT <= 0) { e.pat = ((e.pat || 0) + 1) % 3; e.st = ['wind', 'bubbles', 'jump'][e.pat]; e.stT = e.st === 'wind' ? 0.7 : 0.4; e.shots = 0; }
        break;
      case 'wind': e.vx = 0; e.x += Math.sin(G.t * 60) * 0.6; if (e.stT <= 0) { e.st = 'charge'; e.face = Math.sign(dx) || e.face; } break;
      case 'charge':
        e.vx = e.face * 230 * sp;
        if ((e.face > 0 && e.x >= G.arenaX + W - 34) || (e.face < 0 && e.x <= G.arenaX + 34)) { e.vx = 0; e.st = 'dizzy'; e.stT = 1; shake(6); sfx('boom'); e.stunUntil = G.t + 0.9; }
        break;
      case 'dizzy': e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 1; } break;
      case 'bubbles':
        e.vx = 0; e.face = Math.sign(dx) || e.face;
        if (e.stT <= 0) {
          e.stT = 0.18; e.shots++;
          addHazard({ x: e.x + e.face * 30, y: e.y - 28, vx: e.face * rand(80, 220), vy: rand(-260, -160), grav: 380, w: 9, h: 9, life: 3, dmg: 14, kind: 'bubble' });
          sfx('water');
          if (e.shots >= (e.phase2 ? 7 : 5)) { e.st = 'idle'; e.stT = 1.2; }
        }
        break;
      case 'jump':
        if (e.stT <= 0 && e.onGround && !e.jumped) { e.jumped = true; e.vy = -430; e.onGround = false; e.vx = clamp((P.x - e.x) * 1.0, -220, 220); }
        else if (e.jumped && e.onGround) {
          e.jumped = false; e.vx = 0; e.st = 'idle'; e.stT = 1.3; shake(8); sfx('boom');
          addHazard({ x: e.x, y: GROUND - 10, w: 80, h: 20, life: 0.15, dmg: 20, kind: 'none' });
          for (const s of [-1, 1]) addHazard({ x: e.x + s * 30, y: GROUND - 6, vx: s * 190, w: 12, h: 12, life: 1.6, dmg: 14, kind: 'shock' });
        }
        break;
    }
  },
  kraken(e, dt) {
    const sp = e.phase2 ? 1.4 : 1;
    if (!e.phase2 && e.hp < e.maxHp / 2) { e.phase2 = true; toast('MURKFANG IS FURIOUS!'); shake(8); }
    e.stT -= dt * sp;
    const dx = P.x - e.x;
    switch (e.st) {
      case 'idle':
        e.face = Math.sign(dx) || e.face; e.vx = Math.abs(dx) > 90 ? e.face * e.spd : (Math.abs(dx) < 50 ? -e.face * e.spd : 0);
        if (e.stT <= 0) { e.pat = ((e.pat || 0) + 1) % 4; e.st = ['cannons', 'tentacles', 'summon', 'wind'][e.pat]; e.stT = 0.5; e.shots = 0; }
        break;
      case 'cannons':
        e.vx = 0; e.face = Math.sign(dx) || e.face;
        if (e.stT <= 0) {
          e.stT = 0.35; e.shots++;
          const tx = P.x + rand(-40, 40), tt = 1.0, vx = (tx - e.x) / tt, vy = -0.5 * 400 * tt + (GROUND - (e.y - 30) - 0) / tt;
          addHazard({ x: e.x + e.face * 30, y: e.y - 30, vx, vy: Math.min(vy, -150), grav: 400, w: 10, h: 10, life: 3, dmg: 18, kind: 'cannon', boom: true });
          sfx('boom');
          if (e.shots >= (e.phase2 ? 5 : 3)) { e.st = 'idle'; e.stT = 1.2; }
        }
        break;
      case 'tentacles':
        e.vx = 0;
        if (e.stT <= 0) {
          const xs = [P.x, P.x - 70, P.x + 70];
          if (e.phase2) xs.push(P.x - 120, P.x + 120);
          for (const x of xs) addHazard({ x: clamp(x, G.arenaX + 10, G.arenaX + W - 10), y: GROUND - 30, w: 18, h: 60, delay: 0.9, life: 1.5, dmg: 20, kind: 'tentacle', once: true });
          e.st = 'idle'; e.stT = 2;
        }
        break;
      case 'summon':
        e.vx = 0;
        if (e.stT <= 0) {
          const minions = G.enemies.filter(m => m.alive && !m.boss).length;
          if (minions < 4) { const m1 = spawnEnemy('slime', e.x - 40, GROUND, 5); m1.active = true; const m2 = spawnEnemy('flyer', e.x, 150, 5); m2.active = true; m2.baseY = 150; m1.coins = m2.coins = 5; }
          particles(e.x, e.y - 30, 20, ['#7b3fb3', '#c79bf2'], { spd: 100 });
          e.st = 'idle'; e.stT = 1.5;
        }
        break;
      case 'wind': e.vx = 0; e.x += Math.sin(G.t * 60) * 0.6; if (e.stT <= 0) { e.st = 'charge'; e.face = Math.sign(dx) || e.face; } break;
      case 'charge':
        e.vx = e.face * 250 * sp;
        if (Math.random() < 0.5) particles(e.x - e.face * 20, e.y - 20, 1, ['#3b0f5c', '#111'], { spd: 20, grav: 0 });
        if ((e.face > 0 && e.x >= G.arenaX + W - 34) || (e.face < 0 && e.x <= G.arenaX + 34)) { e.vx = 0; e.st = 'idle'; e.stT = 1.4; shake(7); sfx('boom'); e.stunUntil = G.t + 0.8; }
        break;
    }
  },
};

function updateEnemy(e, dt) {
  if (!e.active) { if (Math.abs(e.x - P.x) < 210) e.active = true; else return; }
  e.flash -= dt;
  if (G.t < e.burnUntil && G.t >= e.burnNext) { e.burnNext = G.t + 0.3; hitEnemy(e, 4, { kb: 0, colors: ['#ff7a00', '#ffd23f'] }); if (!e.alive) return; }
  const stunned = G.t < e.stunUntil || G.t < e.holdUntil;
  if (!stunned) AI[e.type](e, dt);
  else { e.vx = 0; if (e.st === 'charge') e.st = 'idle'; }
  if (!e.fly) {
    e.vy += GRAV * dt; e.y += e.vy * dt;
    if (e.y >= GROUND) { e.y = GROUND; e.vy = 0; e.onGround = true; } else e.onGround = false;
  } else if (e.vy) {
    e.y += e.vy * dt; e.vy *= 0.9; if (Math.abs(e.vy) < 5) e.vy = 0; e.y = Math.min(e.y, GROUND - 4);
  }
  if (G.t < e.holdUntil) { e.kx = 0; if (!e.fly && e.vy < 0) e.vy = 0; }
  e.x += (e.vx + e.kx) * dt;
  e.kx -= e.kx * Math.min(1, 8 * dt);
  const minX = G.arena ? G.arenaX + 10 : 10, maxX = G.arena ? G.arenaX + W - 10 : G.worldW - 10;
  e.x = clamp(e.x, minX, maxX);
  if (!stunned && !(G.t < e.flinch) && overlap(enemyRect(e), playerRect())) hurtPlayer(e.dmg, e.x);
}
