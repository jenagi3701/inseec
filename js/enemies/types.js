'use strict';
// =========================================================
// ENEMIES
// =========================================================
// weak: elements that deal x1.5, resist: x0.6. Shield pirates also block
// frontal hits unless the attack is explosive, lightning, sound, or from behind.
const ENEMY = {
  slime: { w: 14, h: 10, hp: 30, dmg: 10, spd: 40, score: 50, coins: 10, weak: ['fire'], label: 'Wild Blob' },
  grunt: { w: 12, h: 22, hp: 55, dmg: 12, spd: 36, score: 100, coins: 15, weak: ['lightning'], label: 'Pirate Grunt' },
  sword: { w: 12, h: 22, hp: 50, dmg: 14, spd: 52, score: 130, coins: 15, weak: ['blunt'], label: 'Sword Pirate' },
  gunner: { w: 12, h: 22, hp: 45, dmg: 12, spd: 32, score: 120, coins: 20, weak: ['pierce'], label: 'Gunner' },
  shield: { w: 16, h: 24, hp: 80, dmg: 14, spd: 24, score: 160, coins: 20, weak: ['explosive', 'sound', 'lightning'], label: 'Shield Pirate' },
  spear: { w: 12, h: 24, hp: 60, dmg: 15, spd: 34, score: 140, coins: 18, weak: ['wind'], label: 'Spear Pirate' },
  bomber: { w: 14, h: 20, hp: 50, dmg: 18, spd: 30, score: 150, coins: 20, weak: ['water'], label: 'Bomb Thrower' },
  flyer: { w: 16, h: 12, hp: 28, dmg: 10, spd: 55, score: 80, coins: 10, fly: true, weak: ['wind', 'pierce'], label: 'Gloomgull' },
  heavy: { w: 26, h: 30, hp: 170, dmg: 18, spd: 22, score: 250, coins: 40, kbRes: 0.85, heavy: true, weak: ['slash'], label: 'Heavy Brute' },
  seacreature: { w: 24, h: 12, hp: 60, dmg: 16, spd: 40, score: 150, coins: 20, water: true, weak: ['lightning'], resist: ['water'], label: 'Reef Leaper' },
  cannonship: { w: 40, h: 30, hp: 140, dmg: 18, spd: 0, score: 260, coins: 40, water: true, heavy: true, kbRes: 1, weak: ['explosive', 'fire'], resist: ['water'], label: 'Cannon Ship' },
  raider: { w: 12, h: 20, hp: 55, dmg: 14, spd: 85, score: 150, coins: 20, weak: ['sound'], label: 'Desert Raider' },
  skywarrior: { w: 16, h: 24, hp: 60, dmg: 15, spd: 50, score: 170, coins: 22, fly: true, weak: ['wind'], label: 'Sky Warrior' },
  icemonster: { w: 18, h: 22, hp: 90, dmg: 14, spd: 26, score: 170, coins: 22, weak: ['fire'], resist: ['water'], label: 'Frost Yeti' },
  firemonster: { w: 12, h: 16, hp: 45, dmg: 12, spd: 45, score: 140, coins: 18, fireproof: true, weak: ['water'], resist: ['fire'], label: 'Ember Imp' },
  warlord: { w: 30, h: 44, hp: 950, dmg: 20, spd: 34, score: 1500, coins: 200, boss: true, label: 'Warlord' },
  crab: { w: 60, h: 40, hp: 950, dmg: 20, spd: 40, score: 2000, coins: 250, boss: true, name: 'IRONCLAW CRAB', weak: ['lightning'] },
  kraken: { w: 56, h: 60, hp: 1800, dmg: 24, spd: 30, score: 5000, coins: 500, boss: true, name: 'ADMIRAL MURKFANG' },
};
const LV_HP = [1, 1.1, 1.25, 1.35, 1.45, 1.6, 1.75], LV_DMG = [1, 1.05, 1.1, 1.18, 1.25, 1.32, 1.4];
let eid = 1;
function spawnEnemy(type, x, y, lvl, variant) {
  const D = ENEMY[type];
  const hpMul = LV_HP[lvl - 1] || 1.8, dmgMul = LV_DMG[lvl - 1] || 1.4;
  const e = {
    id: eid++, type, x, y: y != null ? y : GROUND, w: D.w, h: D.h,
    hp: Math.round(D.hp * (D.boss ? 1 : hpMul)), dmg: Math.round(D.dmg * (D.boss ? 1 : dmgMul)), spd: D.spd,
    score: D.score, coins: D.coins, fly: !!D.fly, water: !!D.water, boss: !!D.boss, heavy: !!D.heavy, kbRes: D.kbRes || (D.boss ? 1 : 0),
    weak: D.weak || [], resist: D.resist || [], fireproof: !!D.fireproof,
    vx: 0, vy: 0, kx: 0, face: -1, onGround: true, alive: true, active: false, flash: 0,
    stunUntil: 0, holdUntil: 0, flinch: 0, burnUntil: 0, burnNext: 0, st: 'idle', stT: rand(0.5, 1.5), cd: rand(0.5, 1.5), baseY: y || 0, name: D.name,
  };
  const theme = G && G.theme;
  if (type === 'slime') {
    if (theme === 'desert') { e.tint = '#e0b060'; e.tint2 = '#b8893a'; }
    else if (theme === 'snow') { e.tint = '#bfe3ff'; e.tint2 = '#7fb3e0'; }
    else if (lvl >= 3) { e.tint = '#5ab4ff'; e.tint2 = '#2f78c9'; }
  }
  if (type === 'grunt' && theme === 'snow') { e.skin = '#9fc9e6'; e.weak = ['fire']; }
  if (type === 'raider') e.hidden = true;
  if (type === 'seacreature') { e.sub = true; const sg = G ? segAt(x) : null; e.hx0 = sg ? sg.x0 : x - 60; e.hx1 = sg ? sg.x1 : x + 60; e.y = GROUND + 14; }
  if (type === 'cannonship') { e.y = GROUND + 4; e.stT = 2; }
  if (type === 'warlord') {
    e.variant = variant || 'dune';
    e.name = e.variant === 'magma' ? 'MAGMA WARLORD KILNOR' : 'DUNE WARLORD ZAHRAK';
    if (e.variant === 'magma') { e.hp = 1150; e.fireproof = true; e.weak = ['water']; e.resist = ['fire']; } else { e.weak = ['water', 'wind']; }
  }
  e.maxHp = e.hp;
  G.enemies.push(e);
  return e;
}

// quick attack hitbox in front of an enemy (optionally following it)
function eStrike(e, ox, oy, w, h, life, dmg, extra) {
  const hz = addHazard(Object.assign({ x: e.x + e.face * ox, y: e.y - oy, w, h, life, dmg, kind: 'none', fox: ox, foy: oy }, extra || {}));
  hz.follow = extra && extra.follow ? e : null;
  return hz;
}
function bombLand(h) {
  if (!solidAt(h.x)) { h.dead = true; particles(h.x, GROUND, 6, ['#b3e5fc', '#fff'], { spd: 50 }); return; }
  h.y = GROUND - 4; h.vx = 0; h.vy = 0; h.grav = 0; h.landed = true; h.fuse = 0.7; h.dmgArmed = false;
}
function bombBoom(h) {
  h.dead = true; sfx('boom'); shake(3);
  particles(h.x, h.y, 16, ['#ff7a00', '#ffd23f', '#555'], { spd: 120 });
  addHazard({ x: h.x, y: h.y - 8, w: 44, h: 26, life: 0.15, dmg: h.dmg, kind: 'none' });
}
function fireZone(x, life) {
  if (!solidAt(x)) return;
  if (G.hz.filter(h => h.kind === 'fire').length > 14) return;
  addHazard({ x, y: GROUND - 5, w: 18, h: 10, life: life || 3.2, dmg: 6, kind: 'fire', once: false, fire: true });
}
function arcTo(fromX, fromY, toX, toY, t, grav) { return { vx: (toX - fromX) / t, vy: (toY - fromY - 0.5 * grav * t * t) / t }; }

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
  sword(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'lunge'; e.stT = 0.28; sfx('slash'); eStrike(e, 12, 12, 22, 16, 0.28, e.dmg, { follow: true }); } return; }
    if (e.st === 'lunge') { e.vx = e.face * 240; if (e.stT <= 0) { e.st = 'rest'; e.stT = 1.1; } return; }
    if (e.st === 'rest') { e.vx = 0; if (e.stT <= 0) e.st = 'idle'; return; }
    e.face = Math.sign(dx) || e.face;
    if (ad < 75 && Math.abs(P.y - e.y) < 30 && e.stT <= 0) { e.st = 'wind'; e.stT = 0.38; e.vx = 0; }
    else e.vx = ad > 18 ? e.face * e.spd : 0;
  },
  shield(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 1.4; sfx('punch'); eStrike(e, 12, 12, 20, 22, 0.15, e.dmg, { push: 220 }); } return; }
    e.face = Math.sign(dx) || e.face;
    if (ad < 24 && e.stT <= 0) { e.st = 'wind'; e.stT = 0.5; e.vx = 0; }
    else e.vx = ad > 16 ? e.face * e.spd : 0;
  },
  spear(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'thrust'; e.stT = 0.25; sfx('slash'); eStrike(e, 30, 13, 42, 8, 0.22, e.dmg); } return; }
    if (e.st === 'thrust') { e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 1.1; } return; }
    e.face = Math.sign(dx) || e.face;
    if (ad < 52 && e.stT <= 0 && Math.abs(P.y - e.y) < 26) { e.st = 'wind'; e.stT = 0.45; e.vx = 0; }
    else if (ad < 30) e.vx = -e.face * e.spd; else e.vx = ad > 44 ? e.face * e.spd : 0;
  },
  bomber(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    e.face = Math.sign(dx) || e.face;
    if (e.st === 'wind') {
      e.vx = 0;
      if (e.stT <= 0) {
        e.st = 'idle'; e.stT = rand(2.2, 2.8); sfx('jump');
        const v = arcTo(e.x, e.y - 26, P.x + P.vx * 0.5, GROUND - 4, 0.9, 380);
        addHazard({ x: e.x, y: e.y - 26, vx: v.vx, vy: v.vy, grav: 380, w: 7, h: 7, life: 5, dmg: e.dmg, kind: 'bomb', ground: true, onLand: bombLand, harmless: true });
      }
      return;
    }
    if (ad < 90) e.vx = -e.face * e.spd; else if (ad > 170) e.vx = e.face * e.spd; else e.vx = 0;
    if (e.stT <= 0 && ad < 210) { e.st = 'wind'; e.stT = 0.6; }
  },
  seacreature(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    if (e.sub) {
      e.face = Math.sign(dx) || e.face;
      e.vx = clamp(dx, -1, 1) * 30;
      if (ad < 95 && e.stT <= 0 && P.y < GROUND + 6) { e.sub = false; e.vy = -400; e.vx = clamp(dx * 1.7, -170, 170); sfx('water'); particles(e.x, GROUND, 10, ['#b3e5fc', '#fff'], { angle: -Math.PI / 2, spread: 0.8, spd: 120 }); }
    }
  },
  cannonship(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    e.face = Math.sign(dx) || e.face; e.vx = 0;
    if (e.st === 'wind') {
      if (e.stT <= 0) {
        e.st = 'idle'; e.stT = 3; sfx('boom'); shake(2);
        const v = arcTo(e.x + e.face * 22, e.y - 18, P.x, GROUND - 6, 1.2, 380);
        addHazard({ x: e.x + e.face * 22, y: e.y - 18, vx: v.vx, vy: v.vy, grav: 380, w: 10, h: 10, life: 4, dmg: e.dmg, kind: 'cannon', boom: true });
        particles(e.x + e.face * 24, e.y - 16, 8, ['#9e9e9e', '#fff'], { spd: 40, grav: -30 });
      }
    } else if (e.stT <= 0 && ad < 270) { e.st = 'wind'; e.stT = 0.6; }
  },
  raider(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    if (e.hidden) {
      e.vx = 0;
      if (ad < (G.sandstorm > 0 ? 95 : 62) && e.stT <= 0) { reveal(e); e.vy = -260; e.onGround = false; e.vx = (Math.sign(dx) || 1) * 150; e.face = Math.sign(dx) || 1; }
      return;
    }
    if (e.st === 'leap') { if (e.onGround) { e.st = 'attack'; e.stT = 3.2; } return; }
    if (e.st === 'burrow') { e.vx = 0; if (e.stT <= 0) { e.hidden = true; e.st = 'idle'; e.stT = 2.2; particles(e.x, GROUND, 8, ['#c99a50', '#e8bf76'], { spd: 50 }); } return; }
    e.face = Math.sign(dx) || e.face;
    e.vx = ad > 14 ? e.face * e.spd : 0;
    e.cd -= dt;
    if (ad < 24 && e.cd <= 0) { e.cd = 0.65; sfx('slash'); eStrike(e, 10, 10, 18, 16, 0.12, e.dmg); }
    if (e.stT <= 0) { e.st = 'burrow'; e.stT = 0.6; }
  },
  skywarrior(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'dive'; e.stT = 0.9; const d = Math.hypot(P.x - e.x, P.y - 12 - e.y) || 1; e.dvx = (P.x - e.x) / d * 220; e.dvy = (P.y - 12 - e.y) / d * 220; eStrike(e, 10, 10, 20, 18, 0.9, e.dmg, { follow: true }); sfx('slash'); } return; }
    if (e.st === 'dive') { e.vx = e.dvx; e.y += e.dvy * dt; if (e.stT <= 0 || e.y > GROUND - 14) { e.st = 'rise'; e.stT = 1.2; } return; }
    if (e.st === 'rise') { e.vx = -e.face * 50; e.y += (e.baseY - e.y) * Math.min(1, dt * 2.2); if (e.stT <= 0) { e.st = 'idle'; e.stT = rand(1.6, 2.4); } return; }
    e.face = Math.sign(dx) || e.face;
    const want = P.x - e.face * 60;
    e.vx = clamp(want - e.x, -1, 1) * e.spd;
    e.y = e.baseY + Math.sin(G.t * 2.5 + e.id) * 6;
    if (e.stT <= 0 && ad < 150) { e.st = 'wind'; e.stT = 0.5; }
  },
  icemonster(e, dt) {
    const dx = P.x - e.x, ad = Math.abs(dx); e.stT -= dt;
    e.face = Math.sign(dx) || e.face;
    if (e.st === 'wind') {
      e.vx = 0;
      if (e.stT <= 0) { e.st = 'idle'; e.stT = rand(2.4, 3); sfx('wind'); addHazard({ x: e.x + e.face * 10, y: e.y - 14, vx: e.face * 160, vy: -110, grav: 300, w: 8, h: 8, life: 3, dmg: e.dmg, kind: 'snow', chill: true, ground: true }); }
      return;
    }
    e.vx = ad > 24 ? e.face * e.spd : 0;
    if (ad < 160 && e.stT <= 0) { e.st = 'wind'; e.stT = 0.55; }
  },
  firemonster(e, dt) {
    e.face = Math.sign(P.x - e.x) || e.face;
    if (e.onGround) {
      if (e.wasAir) { e.wasAir = false; fireZone(e.x, 3); }
      e.vx *= 0.8; e.cd -= dt;
      if (e.cd <= 0) { e.cd = rand(0.9, 1.4); e.vy = -rand(200, 250); e.vx = e.face * rand(60, 90); e.onGround = false; e.wasAir = true; }
    }
  },
  warlord(e, dt) {
    const sp = e.phase2 ? 1.3 : 1;
    if (!e.phase2 && e.hp < e.maxHp / 2) { e.phase2 = true; toast(e.name.split(' ').slice(-1)[0] + ' IS ENRAGED!'); shake(6); }
    e.stT -= dt * sp;
    const dx = P.x - e.x;
    switch (e.st) {
      case 'idle':
        e.face = Math.sign(dx) || e.face; e.vx = Math.abs(dx) > 50 ? e.face * e.spd : 0;
        if (e.stT <= 0) { e.pat = ((e.pat || 0) + 1) % 4; e.st = ['throw', 'wind', 'slamwind', 'summon'][e.pat]; e.stT = 0.6; }
        break;
      case 'throw':
        e.vx = 0;
        if (e.stT <= 0 && !e.anchorOut) {
          e.anchorOut = true; sfx('skill');
          const ow = e;
          addHazard({ x: e.x + e.face * 16, y: e.y - 22, vx: e.face * 250, w: 16, h: 14, life: 2.4, dmg: 16, kind: 'anchor', once: false,
            update(h, d) { h.age2 = (h.age2 || 0) + d; if (h.age2 > 0.6) { const ddx = ow.x - h.x, ddy = ow.y - 22 - h.y, dd = Math.hypot(ddx, ddy) || 1; h.vx = ddx / dd * 270; h.vy = ddy / dd * 270; if (dd < 14) { h.dead = true; ow.anchorOut = false; } } } });
          e.st = 'idle'; e.stT = 2.2;
        }
        break;
      case 'wind': e.vx = 0; e.x += Math.sin(G.t * 60) * 0.6; if (e.stT <= 0) { e.st = 'charge'; e.face = Math.sign(dx) || e.face; } break;
      case 'charge':
        e.vx = e.face * 250 * sp;
        if (e.variant === 'magma' && Math.random() < 0.08) fireZone(e.x, 2.5);
        if ((e.face > 0 && e.x >= G.arenaX + AW - 26) || (e.face < 0 && e.x <= G.arenaX + 26)) { e.vx = 0; e.st = 'idle'; e.stT = 1.4; shake(6); sfx('boom'); e.stunUntil = G.t + 0.9; }
        break;
      case 'slamwind':
        if (e.stT <= 0 && e.onGround && !e.jumped) { e.jumped = true; e.vy = -420; e.onGround = false; e.vx = clamp(dx, -200, 200); }
        else if (e.jumped && e.onGround) {
          e.jumped = false; e.vx = 0; e.st = 'idle'; e.stT = 1.4; shake(8); sfx('boom');
          addHazard({ x: e.x, y: GROUND - 10, w: 70, h: 20, life: 0.15, dmg: 20, kind: 'none' });
          for (const s2 of [-1, 1]) addHazard({ x: e.x + s2 * 26, y: GROUND - 6, vx: s2 * 180, w: 12, h: 12, life: 1.4, dmg: 14, kind: 'shock' });
          if (e.variant === 'magma') for (const o of [-50, -25, 25, 50]) fireZone(e.x + o, 3.5);
        }
        break;
      case 'summon':
        e.vx = 0;
        if (e.stT <= 0) {
          const minions = G.enemies.filter(m => m.alive && !m.boss).length;
          if (minions < 3) for (const o of [-60, 60]) { const t = e.variant === 'magma' ? 'firemonster' : 'raider'; const m = spawnEnemy(t, clamp(e.x + o, G.arenaX + 20, G.arenaX + AW - 20), GROUND, G.level); m.active = true; m.coins = 5; if (m.hidden) { m.hidden = false; m.st = 'attack'; m.stT = 4; } }
          particles(e.x, e.y - 30, 20, ['#ffd23f', '#fff'], { spd: 100 });
          e.st = 'idle'; e.stT = 1.6;
        }
        break;
    }
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
        if ((e.face > 0 && e.x >= G.arenaX + AW - 34) || (e.face < 0 && e.x <= G.arenaX + 34)) { e.vx = 0; e.st = 'dizzy'; e.stT = 1; shake(6); sfx('boom'); e.stunUntil = G.t + 0.9; }
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
          for (const x of xs) addHazard({ x: clamp(x, G.arenaX + 10, G.arenaX + AW - 10), y: GROUND - 30, w: 18, h: 60, delay: 0.9, life: 1.5, dmg: 20, kind: 'tentacle', once: true });
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
        if ((e.face > 0 && e.x >= G.arenaX + AW - 34) || (e.face < 0 && e.x <= G.arenaX + 34)) { e.vx = 0; e.st = 'idle'; e.stT = 1.4; shake(7); sfx('boom'); e.stunUntil = G.t + 0.8; }
        break;
    }
  },
};

function reveal(e) {
  if (!e.hidden) return;
  e.hidden = false; e.st = 'leap'; e.stT = 0;
  sfx('slash'); particles(e.x, GROUND - 2, 12, ['#c99a50', '#e8bf76'], { angle: -Math.PI / 2, spread: 1, spd: 110 });
  popText(e.x, e.y - 30, '!', '#ff5252', true);
}
function enemyFell(e) {
  if (!e.alive) return;
  e.alive = false;
  G.stats.kills++; G.score += e.score;
  const wet = segAt(e.x).kind === 'deep';
  popText(e.x, GROUND - 20, wet ? 'SPLASH!' : 'FELL!', '#8fd3ff', true);
  particles(e.x, GROUND, 14, wet ? ['#b3e5fc', '#fff'] : ['#fff'], { angle: -Math.PI / 2, spread: 0.9, spd: 140 });
  dropCoins(nearestSolidX(e.x), GROUND - 20, e.coins);
  sfx('water');
}
function updateEnemy(e, dt) {
  if (!e.active) { if (Math.abs(e.x - P.x) < 210) e.active = true; else return; }
  e.flash -= dt;
  if (G.t < e.burnUntil && G.t >= e.burnNext) { e.burnNext = G.t + 0.3; hitEnemy(e, 4, { kb: 0, el: 'fire', colors: ['#ff7a00', '#ffd23f'] }); if (!e.alive) return; }
  const stunned = G.t < e.stunUntil || G.t < e.holdUntil;
  if (!stunned) AI[e.type](e, dt);
  else { e.vx = 0; if (e.st === 'charge' || e.st === 'lunge' || e.st === 'dive') e.st = 'idle'; }
  // walkers never step off a ledge on purpose
  if (!e.fly && !e.water && !e.boss && e.onGround && e.vx && !solidAt(e.x + Math.sign(e.vx) * (e.w / 2 + 3))) e.vx = 0;
  if (e.water) {
    if (e.type === 'cannonship') { e.y = GROUND + 4 + Math.sin(G.t * 2 + e.id); }
    else if (e.sub) { e.y = GROUND + 14; e.vy = 0; }
    else {
      e.vy += GRAV * dt; e.y += e.vy * dt;
      if (e.vy > 0 && e.y >= GROUND + 14) { e.sub = true; e.stT = 2.4; e.y = GROUND + 14; particles(e.x, GROUND, 8, ['#b3e5fc', '#fff'], { angle: -Math.PI / 2, spread: 0.8, spd: 90 }); }
    }
  } else if (!e.fly) {
    e.vy += GRAV * dt; e.y += e.vy * dt;
    const solid = solidAt(e.x) || (e.boss && G.arena);
    if (solid && e.y >= GROUND && e.y - e.vy * dt <= GROUND + 2) { e.y = GROUND; e.vy = 0; e.onGround = true; } else e.onGround = false;
    if (e.y > GROUND + 40) { enemyFell(e); return; }
  } else if (e.vy) {
    e.y += e.vy * dt; e.vy *= 0.9; if (Math.abs(e.vy) < 5) e.vy = 0; e.y = Math.min(e.y, GROUND - 4);
  }
  if (G.t < e.holdUntil) { e.kx = 0; if (!e.fly && e.vy < 0) e.vy = 0; }
  e.x += (e.vx + e.kx) * dt;
  e.kx -= e.kx * Math.min(1, 8 * dt);
  let minX = G.arena ? G.arenaX + 10 : 10, maxX = G.arena ? G.arenaX + AW - 10 : G.worldW - 10;
  if (e.type === 'seacreature' && e.sub) { minX = e.hx0 + 10; maxX = e.hx1 - 10; }
  if (e.type === 'cannonship') { minX = maxX = e.x; }
  e.x = clamp(e.x, minX, maxX);
  if (!stunned && !e.hidden && !e.sub && !(G.t < e.flinch) && overlap(enemyRect(e), playerRect())) hurtPlayer(e.dmg, e.x);
}
