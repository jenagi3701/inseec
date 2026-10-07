'use strict';
// =========================================================
// CHARACTERS
// =========================================================
const CH = {
  captain: {
    reach: 34, color: '#ff4f4f', short: 'Captain', name: 'Captain Lumo', title: 'Rubber Pirate Captain', emoji: '🧑', role: 'Close-range fighter', hp: 100, spd: 96, el: 'blunt', jump: 1,
    stats: { atk: 4, def: 3, spd: 4 }, special: 'Elastic body + Freedom Form',
    unlock: { type: 'free' },
    basic: { name: 'Punch', icon: 'fist', cd: 0.26, desc: 'Quick rubber punches. In Freedom Form: giant bouncing fists.', use() {
      if (P.form === 'white') {
        // cartoon-giant punches that bounce enemies around
        P.stretch = { start: G.t, dur: 0.22, max: 34, windup: 0, fist: 12 };
        sfx('punch'); shake(2);
        melee({ ox: 24, oy: 14, w: 40, h: 30, dmg: 22, life: 0.14, opts: { kb: 220, launch: 160, crit: true, colors: ['#ffffff', '#fff59d', '#ffd23f'] } });
        fx({ x: P.x + P.face * 40, y: P.y - 14, life: 0.25, draw(f) { const k = f.age / f.life; g.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y, 6 + k * 20, 0, Math.PI * 2); g.stroke(); } });
        return;
      }
      act('punch', 0.12); sfx('punch');
      melee({ ox: 12, oy: 12, w: 18, h: 12, dmg: 12, opts: { kb: 80 } });
    } },
    s1: { name: 'Elastic Punch', icon: 'stretch', cd: 2.6, desc: 'A fast long-range stretch punch.', use() {
      const white = P.form === 'white', dur = 0.3; P.stretch = { start: G.t, dur, max: white ? 200 : 150, windup: 0, fist: white ? 12 : 4 };
      lock(dur); sfx('skill');
      addHB({ follow: { ox: 0, oy: 12 }, w: white ? 22 : 12, h: white ? 22 : 12, life: dur * 0.6, dmg: 32, pierce: white ? 99 : 1, opts: { kb: 200 },
        update(h) { h.x = P.x + P.face * (10 + stretchLen()); } });
    } },
    s2: { name: 'Power Mode', icon: 'power', cd: 14, desc: 'Steam bursts out! +ATK, +attack speed, +move speed for 7s.', use() {
      lock(0.55); sinv(0.55); act('cast', 0.55); sfx('ult');
      P.transform = G.t + 0.55;
      for (let i = 0; i < 4; i++) sched(i * 0.12, () => { particles(P.x, P.y - 12, 10, ['#ff9c8c', '#ffffff', '#ffd1dc'], { grav: -80, spd: 60 }); shake(1); });
      sched(0.55, () => { addBuff('POWER', { atk: 1.5, aspd: 1.7, spd: 1.35 }, 7, '💢'); toast('POWER MODE!'); });
    } },
    s3: { name: "King's Pressure", icon: 'haki', cd: 12, desc: 'A wave of willpower. Weak foes faint (stunned), strong foes take damage and flinch.', use() {
      lock(0.45); sinv(0.45); act('cast', 0.45); sfx('ult'); shake(3);
      G.flash = 0.04;
      const R0 = 120;
      fx({ x: P.x, y: P.y - 14, life: 0.7, draw(f) {
        const k = f.age / f.life, r = 10 + k * R0;
        g.globalAlpha = 1 - k; g.lineWidth = 4; g.strokeStyle = '#1a0010'; g.beginPath(); g.arc(f.x, f.y, r, 0, Math.PI * 2); g.stroke();
        g.lineWidth = 2; g.strokeStyle = '#d50000'; g.beginPath(); g.arc(f.x, f.y, r - 3, 0, Math.PI * 2); g.stroke();
        for (let i = 0; i < 6; i++) { const a = i * 1.05 + f.age * 3; g.beginPath(); let px = f.x + Math.cos(a) * 8, py = f.y + Math.sin(a) * 8; g.moveTo(px, py); for (let s2 = 1; s2 < 5; s2++) { px = f.x + Math.cos(a + rand(-0.2, 0.2)) * r * s2 / 4; py = f.y + Math.sin(a + rand(-0.2, 0.2)) * r * s2 / 4; g.lineTo(px, py); } g.strokeStyle = i % 2 ? '#d50000' : '#1a0010'; g.stroke(); }
        g.globalAlpha = 1;
      } });
      for (const e of G.enemies) {
        if (!e.alive || e.sub || Math.hypot(e.x - P.x, (e.y - e.h / 2) - (P.y - 12)) > R0) continue;
        e.active = true;
        const weak = !e.boss && !e.heavy && e.maxHp < 100;
        if (weak) { hitEnemy(e, 10, { stun: 2.8, kb: 40, env: false, colors: ['#d50000', '#1a0010'] }); popText(e.x, e.y - e.h - 16, 'FAINTED', '#ff8a80'); }
        else hitEnemy(e, 42, { stun: 0.7, kb: 120, colors: ['#d50000', '#1a0010'] });
      }
    } },
    ult: { name: 'Freedom Form', icon: 'white', desc: 'Transform into a white-haired, laughing, rubbery force of nature for 10s: huge damage, speed and knockback.', use() {
      lock(0.9); sinv(1.1); act('cast', 0.9); sfx('ult');
      P.transform = G.t + 0.9;
      for (let i = 0; i < 6; i++) sched(i * 0.13, () => { particles(P.x, P.y - 14, 14, ['#ffffff', '#fffde7', '#fff59d'], { spd: 120, grav: -40 }); shake(2); sfx('melody'); });
      sched(0.9, () => {
        P.form = 'white'; P.formUntil = G.t + 10;
        G.flash = 0.2; shake(10); toast('FREEDOM FORM!', 1.6);
        melee({ ox: 0, oy: 14, w: 120, h: 70, dmg: 60, life: 0.15, opts: { kb: 300, launch: 220, crit: true, colors: ['#ffffff', '#fff59d'] } });
        fx({ x: P.x, y: P.y - 14, life: 0.6, draw(f) { const k = f.age / f.life; g.globalAlpha = 1 - k; circle(f.x, f.y, Math.round(10 + k * 90), '#ffffff'); g.globalAlpha = 1; } });
      });
    } },
  },
  swordsman: {
    reach: 36, color: '#3fd15b', short: 'Swordsman', name: 'Kaito Triblade', title: 'Three-Blade Swordsman', emoji: '⚔️', role: 'Close-range damage dealer', hp: 110, spd: 90,
    el: 'slash', jump: 0.94, stats: { atk: 5, def: 3, spd: 3 }, special: 'Three swords + parry',
    unlock: { type: 'coins', n: 300 },
    basic: { name: 'Slash', cd: 0.3, desc: 'Fast sword slash.', use() {
      act('slash', 0.14); sfx('slash');
      P.combo = (P.combo + 1) % 2;
      slashFx(P.x + P.face * 10, P.y - 13, 16, P.combo ? '#ffffff' : '#c8e6ff', P.combo ? -1 : 1);
      melee({ ox: 15, oy: 12, w: 26, h: 22, dmg: 14, opts: { kb: 70 } });
    } },
    s1: { name: 'Three-Blade Slash', cd: 4, desc: 'Slash in three directions at once and fire a blade wave.', use() {
      act('slash', 0.3); lock(0.25); sfx('slash'); sfx('skill');
      slashFx(P.x + P.face * 12, P.y - 12, 22, '#ffffff', 1);
      slashFx(P.x, P.y - 30, 20, '#ff6b6b', -1, true);
      slashFx(P.x - P.face * 12, P.y - 12, 20, '#90caf9', -1);
      melee({ ox: 18, oy: 12, w: 34, h: 26, dmg: 28, opts: { kb: 140 } });
      melee({ ox: 0, oy: 30, w: 34, h: 24, dmg: 28, opts: { launch: 160 } });
      melee({ ox: -16, oy: 12, w: 28, h: 24, dmg: 28, opts: { kb: 140 } });
      shoot({ vx: 260, w: 10, h: 22, life: 0.45, dmg: 18, pierce: 3, ox: 20, draw: h => { R(h.x - 1, h.y - 11, 3, 22, '#e3f2fd'); R(h.x - h.face * 3, h.y - 8, 2, 16, '#90caf9'); } });
    } },
    s2: { name: 'Spinning Sword', cd: 6, desc: 'Spin forward like a whirlwind of steel, hitting repeatedly.', use() {
      act('spin', 0.6); sfx('slash'); sinv(0.6);
      P.dash = { vx: P.face * 210, until: G.t + 0.6 };
      addHB({ follow: { ox: 2, oy: 12 }, w: 38, h: 28, life: 0.6, tick: 0.1, dmg: 10, opts: { kb: 50 },
        draw(h) { const a = G.t * 30; for (let i = 0; i < 3; i++) { const an = a + i * 2.1; R(h.x + Math.cos(an) * 16 - 2, h.y + Math.sin(an) * 9 - 1, 5, 2, ['#fff', '#ff6b6b', '#90caf9'][i]); } } });
    } },
    s3: { name: 'Iron Guard', icon: 'guard', cd: 7, desc: 'Raise all three blades for 1.2s. Blocks any hit and answers with a counter-slash.', use() {
      act('slash', 1.2); P.guardUntil = G.t + 1.2; sfx('skill');
      fx({ x: P.x, y: P.y, life: 1.2, draw(f) { g.globalAlpha = 0.5 + Math.sin(G.t * 20) * 0.2; g.strokeStyle = '#e0f7fa'; g.lineWidth = 2; g.strokeRect(P.x + P.face * 6 - 2, P.y - 26, 5, 24); g.globalAlpha = 1; } });
    } },
    ult: { name: 'Triple Sword Storm', desc: 'A blinding multi-hit combo across a huge area.', use() {
      lock(1.4); sinv(1.4); sfx('ult');
      act('slash', 1.4);
      const h = addHB({ follow: { ox: 50, oy: 16 }, w: 170, h: 90, life: 1.3, tick: 0.09, dmg: 12, opts: { kb: 20, stun: 0.3 },
        draw(hb) { for (let i = 0; i < 4; i++) { const x = hb.x + rand(-80, 80), y = hb.y + rand(-40, 40), l = rand(14, 30); g.strokeStyle = pick(['#fff', '#ff6b6b', '#90caf9', '#e0f7fa']); g.lineWidth = 2; g.beginPath(); g.moveTo(x - l, y - l * 0.5); g.lineTo(x + l, y + l * 0.5); g.stroke(); } } });
      sched(1.3, () => { melee({ ox: 50, oy: 16, w: 180, h: 100, dmg: 60, opts: { kb: 260, crit: true } }); shake(10); sfx('boom'); slashFx(h.x, h.y, 50, '#ffffff', 1); });
      for (let i = 0; i < 6; i++) sched(i * 0.2, () => { shake(3); sfx('slash'); });
    } },
  },
  navigator: {
    reach: 160, color: '#ff9a2a', short: 'Navigator', name: 'Nimbus Mira', title: 'Weather Navigator', emoji: '🌩', role: 'Ranged / area damage', hp: 90, spd: 94,
    el: 'wind', jump: 1, stats: { atk: 4, def: 2, spd: 4 }, special: 'Controls wind & lightning',
    unlock: { type: 'level', n: 2 },
    basic: { name: 'Gust', cd: 0.4, desc: 'Small wind projectile.', use() {
      act('cast', 0.15); sfx('wind');
      shoot({ vx: 270, w: 10, h: 8, life: 0.75, dmg: 12, ox: 10, oy: 16, opts: { kb: 90 },
        draw: h => { const k = Math.floor(G.t * 20) % 2; R(h.x - 5, h.y - 2 + k, 8, 1, '#e0f7fa'); R(h.x - 3, h.y + 1 - k, 8, 1, '#b2ebf2'); R(h.x + 2, h.y - 1, 3, 3, '#ffffff'); } });
    } },
    s1: { name: 'Lightning', cd: 4, desc: 'Call a lightning bolt onto the nearest enemy (stuns).', use() {
      act('cast', 0.35); lock(0.2);
      const tgt = nearest(280, false);
      const x = tgt ? tgt.x : P.x + P.face * 100;
      lightning(x, 48, 1.2);
    } },
    s2: { name: 'Wind Storm', cd: 7, desc: 'Summon a roaming tornado that lifts and shreds enemies.', use() {
      act('cast', 0.3); sfx('wind');
      tornado(P.x + P.face * 20, P.face * 90, 2.4);
    } },
    s3: { name: 'Thunder Cloud', icon: 'cloud', cd: 9, desc: 'A storm cloud drifts ahead and zaps enemies below it.', use() {
      act('cast', 0.3); sfx('zap');
      const cx = P.x + P.face * 30, dir = P.face;
      const c = fx({ x: cx, y: 130, life: 3.6, draw(f) { R(f.x - 18, f.y, 36, 9, '#5c6378'); R(f.x - 11, f.y - 5, 22, 6, '#6f7790'); if (Math.floor(G.t * 10) % 3 === 0) R(f.x - 2, f.y + 9, 4, 4, '#fff59d'); } });
      for (let i = 0; i < 6; i++) sched(0.4 + i * 0.55, () => { c.x += dir * 22; lightning(c.x, 22, 0.6); });
    } },
    ult: { name: 'Weather Chaos', desc: 'Lightning, wind and rain all at once over the whole screen.', use() {
      act('cast', 1.0); lock(0.6); sinv(0.8); sfx('ult');
      G.weather = G.t + 4;
      tornado(P.x + 30, 110, 3.5); tornado(P.x - 30, -110, 3.5);
      for (let i = 0; i < 12; i++) sched(0.2 + i * 0.28, () => {
        const list = onScreen();
        const x = list.length ? pick(list).x : G.cam + rand(30, W - 30);
        lightning(x, 40, 1);
      });
      addHB({ x: 0, y: GROUND - 60, w: W, h: 140, life: 4, tick: 0.5, dmg: 7, opts: { kb: 10, colors: ['#81d4fa', '#fff'] },
        update(h) { h.x = G.cam + W / 2; } });
    } },
  },
  sniper: {
    reach: 220, color: '#ffd23f', short: 'Sniper', name: 'Pip Longshot', title: 'Long-Range Sniper', emoji: '🎯', role: 'Long-range damage', hp: 85, spd: 92,
    el: 'pierce', jump: 1, stats: { atk: 4, def: 2, spd: 3 }, special: 'Charged shots + goggles',
    unlock: { type: 'coins', n: 500 },
    basic: { name: 'Shot', cd: 0.45, desc: 'Long-distance bullet.', use() {
      act('shoot', 0.15); sfx('shoot');
      shoot({ vx: 430, w: 6, h: 3, life: 1.0, dmg: 15, ox: 16, oy: 12, opts: { kb: 50 }, draw: h => { R(h.x - 3, h.y - 1, 6, 2, '#ffd23f'); R(h.x - h.face * 6, h.y - 1, 3, 1, '#fff6'); } });
    } },
    s1: { name: 'Power Shot', cd: 3.5, hold: true, desc: 'HOLD to charge, release to fire. Longer charge = more damage.', fire(k) {
      act('shoot', 0.25); sfx(k > 0.7 ? 'boom' : 'shoot'); shake(2 + k * 5);
      const size = Math.round(4 + k * 8);
      shoot({ vx: 380 + k * 200, w: size + 4, h: size, life: 1.2, dmg: Math.round(20 + k * 95), pierce: k > 0.7 ? 4 : 1, ox: 18, oy: 12, opts: { kb: 80 + k * 220, crit: k > 0.95 },
        draw: h => { R(h.x - h.w / 2, h.y - h.h / 2, h.w, h.h, '#ff9f43'); R(h.x - h.w / 2 + 1, h.y - h.h / 2 + 1, h.w - 2, h.h - 2, '#ffe066'); particles(h.x - h.face * h.w / 2, h.y, 1, ['#ffd23f', '#ff7a00'], { spd: 20, life: 0.3, grav: 0 }); } });
      P.kx = -P.face * (40 + k * 120);
    } },
    s2: { name: 'Trick Shot', cd: 4, desc: 'A ricochet shot that bounces once and homes in on enemies.', use() {
      act('shoot', 0.2); sfx('shoot');
      const h = shoot({ vx: 300, w: 6, h: 6, life: 2.2, dmg: 34, pierce: 2, ox: 16, oy: 14, solid: true, opts: { kb: 120 },
        draw: hb => { R(hb.x - 3, hb.y - 3, 6, 6, '#ff4f6d'); R(hb.x - 1, hb.y - 1, 2, 2, '#fff'); particles(hb.x, hb.y, 1, ['#ff4f6d', '#ffd1dc'], { spd: 10, life: 0.3, grav: 0 }); },
        onGround(hb) {
          if (hb.bounced) { hb.dead = true; return; }
          hb.bounced = true; hb.y = GROUND - 4; sfx('hit'); particles(hb.x, GROUND, 6, ['#fff', '#ff4f6d'], { spd: 60 });
          retarget(hb);
        },
        onHit(hb) { retarget(hb); } });
      h.vy = 110;
    } },
    s3: { name: 'Smoke Bomb', icon: 'smoke', cd: 8, desc: 'Vanish in smoke: nearby enemies are dazed and you flip backwards to safety.', use() {
      sfx('boom'); sinv(0.6);
      for (const e of G.enemies) if (e.alive && Math.abs(e.x - P.x) < 80 && Math.abs(e.y - P.y) < 60) hitEnemy(e, 8, { stun: 2.2, kb: 60, el: 'explosive', colors: ['#cfd8dc', '#fff'] });
      for (let i = 0; i < 26; i++) G.parts.push({ x: P.x + rand(-20, 20), y: P.y - rand(0, 24), vx: rand(-40, 40), vy: rand(-30, 10), life: rand(0.8, 1.4), age: 0, c: pick(['#cfd8dc', '#b0bec5', '#eceff1']), s: 4, grav: -10 });
      P.dash = { vx: -P.face * 220, until: G.t + 0.25 }; P.vy = -230; P.onGround = false;
    } },
    ult: { name: 'Mega Shot', desc: 'Charge a colossal shot that pierces across the entire screen.', use() {
      lock(0.9); sinv(0.9); act('shoot', 0.9, { charge: true }); sfx('ult');
      for (let i = 0; i < 6; i++) sched(i * 0.06, () => particles(P.x + P.face * 18, P.y - 12, 6, ['#ffd23f', '#fff', '#ff7a00'], { spd: 50, grav: 0 }));
      sched(0.45, () => {
        sfx('boom'); shake(10); P.kx = -P.face * 200;
        shoot({ vx: 720, w: 64, h: 28, life: 1.0, dmg: 170, ox: 30, oy: 12, opts: { kb: 260, crit: true },
          draw: h => { R(h.x - 32, h.y - 14, 64, 28, '#ff7a00'); R(h.x - 30, h.y - 10, 60, 20, '#ffd23f'); R(h.x - 26, h.y - 5, 52, 10, '#fff'); for (let i = 1; i < 6; i++) R(h.x - h.face * (32 + i * 14), h.y - 10 + i * 2, 12, 20 - i * 4, 'rgba(255,210,63,' + (0.8 - i * 0.13) + ')'); } });
      });
    } },
  },
  cook: {
    reach: 34, color: '#ffe066', short: 'Cook', name: 'Remy Flambé', title: 'Kick Fighter / Cook', emoji: '🔥', role: 'Fast melee combo', hp: 100, spd: 106,
    el: 'fire', jump: 1.05, stats: { atk: 4, def: 3, spd: 5 }, special: 'Fire kicks + Sky Walk',
    unlock: { type: 'level', n: 3 },
    basic: { name: 'Kick Combo', cd: 0.22, desc: 'Fast 3-hit kick combo (3rd kick knocks back).', use() {
      if (G.t - P.comboT > 0.6) P.combo = 0;
      P.combo = (P.combo + 1) % 3; P.comboT = G.t;
      const last = P.combo === 0;
      act('kick', 0.13); sfx('punch');
      melee({ ox: 13, oy: last ? 14 : 8, w: 22, h: 14, dmg: last ? 20 : 11, opts: { kb: last ? 190 : 60 } });
    } },
    s1: { name: 'Fire Kick', cd: 4, desc: 'A blazing kick that sets enemies on fire.', use() {
      act('kick', 0.35, { fire: true }); lock(0.3); sfx('boom');
      P.dash = { vx: P.face * 170, until: G.t + 0.15 };
      melee({ ox: 16, oy: 12, w: 32, h: 26, dmg: 42, life: 0.2, opts: { kb: 230, burn: 2.5, colors: ['#ff7a00', '#ffd23f', '#ff3d00'] } });
      particles(P.x + P.face * 16, P.y - 12, 20, ['#ff7a00', '#ffd23f', '#ff3d00'], { spd: 110, grav: -60 });
      shake(3);
    } },
    s2: { name: 'Air Combo', cd: 6, desc: 'Launch enemies skyward and juggle them with kicks.', use() {
      act('kick', 0.2); sfx('skill');
      melee({ ox: 12, oy: 10, w: 26, h: 22, dmg: 14, opts: { launch: 320, kb: 10 } });
      P.vy = -320; P.onGround = false;
      for (let i = 0; i < 4; i++) sched(0.15 + i * 0.09, () => { act('kick', 0.08); sfx('punch'); melee({ ox: 10, oy: 16, w: 36, h: 40, dmg: 10, opts: { juggle: true, kb: 10 } }); particles(P.x + P.face * 12, P.y - 14, 4, ['#fff', '#ffd23f'], { spd: 70 }); });
      sched(0.55, () => { act('kick', 0.15); melee({ ox: 10, oy: 10, w: 40, h: 46, dmg: 24, opts: { spike: true, kb: 120 } }); shake(4); sfx('boom'); });
    } },
    s3: { name: 'Sky Walk', icon: 'wing', cd: 10, desc: 'Kick the air itself: two extra mid-air jumps for 6s. Crosses any gap.', use() {
      sfx('jump'); P.skyWalk = G.t + 6; P.airJumps = 2; toast('SKY WALK!', 1);
      if (P.onGround) { P.vy = -340; P.onGround = false; P.plat = null; }
      particles(P.x, P.y, 14, ['#ff7a00', '#ffd23f', '#fff'], { angle: Math.PI / 2, spread: 1, spd: 80 });
      addBuff('SKY WALK', { spd: 1.0 }, 6, '👟');
    } },
    ult: { name: 'Flame Leg Storm', desc: 'Dash across the screen unleashing a storm of fiery kicks.', use() {
      lock(1.2); sinv(1.3); sfx('ult');
      P.dash = { vx: P.face * 330, until: G.t + 1.1 };
      act('kick', 1.15, { fire: true });
      addHB({ follow: { ox: 8, oy: 14 }, w: 48, h: 40, life: 1.15, tick: 0.08, dmg: 10, opts: { burn: 3, kb: 40, colors: ['#ff7a00', '#ffd23f'] },
        draw(h) { for (let i = 0; i < 4; i++) R(h.x + rand(-22, 22), h.y + rand(-18, 18), 4, 4, pick(['#ff7a00', '#ffd23f', '#ff3d00'])); particles(P.x, P.y - 6, 2, ['#ff7a00', '#ffd23f'], { spd: 40, grav: -100, life: 0.5 }); } });
      const startX = P.x;
      sched(1.15, () => {
        // the whole flame trail erupts behind the dash
        const mid = (startX + P.x) / 2, len = Math.abs(P.x - startX) + 70;
        addHB({ x: mid, y: P.y - 16, w: len, h: 60, life: 0.15, dmg: 55, opts: { kb: 200, burn: 3, launch: 200, crit: true, colors: ['#ff7a00', '#ffd23f'] } });
        for (let i = 0; i < 12; i++) { const x = startX + (P.x - startX) * i / 11; particles(x, GROUND - 4, 5, ['#ff7a00', '#ffd23f', '#ff3d00'], { angle: -Math.PI / 2, spread: 0.6, spd: 160 }); }
        shake(10); sfx('boom');
      });
    } },
  },
  doctor: {
    reach: 150, color: '#3f8cff', short: 'Doctor', name: 'Doc Bramble', title: 'Blue-Nosed Reindeer Doctor', emoji: '🦌', role: 'Support / healer', hp: 95, spd: 90, el: 'blunt', jump: 1.06,
    stats: { atk: 2, def: 4, spd: 3 }, special: 'Healing zones + Emergency Mode',
    unlock: { type: 'boss', n: 1 },
    basic: { name: 'Pill Toss', icon: 'pill', cd: 0.42, desc: 'Throw a small medical capsule.', use() {
      act('shoot', 0.14); sfx('shoot');
      const h = shoot({ vx: 250, w: 6, h: 4, life: 1.1, dmg: 13, ox: 10, oy: 12, grav: 260, solid: true, opts: { kb: 60 },
        draw: hb => { R(hb.x - 3, hb.y - 2, 3, 4, '#e23b3b'); R(hb.x, hb.y - 2, 3, 4, '#ffffff'); } });
      h.vy = -90;
    } },
    s1: { name: 'Heal', icon: 'heart', cd: 8, desc: 'Restore 35 HP.', use() {
      act('cast', 0.3); lock(0.25); heal(P.form === 'emergency' ? 50 : 35);
      fx({ x: P.x, y: P.y - 12, life: 0.6, draw(f) { const r = 8 + f.age * 40; g.strokeStyle = 'rgba(142,245,155,' + (1 - f.age / f.life) + ')'; g.lineWidth = 2; g.strokeRect(P.x - r, P.y - 12 - r, r * 2, r * 2); } });
    } },
    s2: { name: 'Team Buff', icon: 'buff', cd: 14, desc: '+ATK, +DEF, +SPEED for 8s.', use() {
      act('cast', 0.3); sfx('skill');
      addBuff('TEAM BUFF', { atk: 1.35, def: 0.7, spd: 1.25 }, 8, '💉');
      particles(P.x, P.y - 12, 20, ['#ffd23f', '#3f8cff', '#fff'], { grav: -80, spd: 60 });
      toast('TEAM BUFF!');
    } },
    s3: { name: 'Medical Burst', icon: 'cross', cd: 11, desc: 'Plant a healing field: heals you while you stand in it and stings enemies.', use() {
      act('cast', 0.35); sfx('heal');
      healZone(P.x, 52, 5, 7, false);
    } },
    ult: { name: 'Emergency Mode', icon: 'siren', desc: 'Sirens on! A huge healing field, strong defense and regeneration for 8s.', use() {
      act('cast', 0.8); lock(0.6); sinv(0.9); sfx('ult');
      P.transform = G.t + 0.6;
      sched(0.6, () => {
        P.form = 'emergency'; P.formUntil = G.t + 8;
        heal(40);
        addBuff('ARMOR', { def: 0.45 }, 8, '🛡');
        P.regen = 4; P.regenUntil = G.t + 8;
        healZone(P.x, 95, 6, 10, true);
        melee({ ox: 0, oy: 12, w: 150, h: 60, dmg: 18, life: 0.2, opts: { kb: 240, colors: ['#8ef59b', '#fff'] } });
        toast('EMERGENCY MODE!', 1.4);
      });
    } },
  },
  archaeologist: {
    reach: 150, color: '#a77bff', short: 'Archaeologist', name: 'Iris Tidewell', title: 'Mystical Archaeologist', emoji: '🌊', role: 'Crowd control / area damage', hp: 95, spd: 92,
    el: 'blunt', jump: 1, stats: { atk: 4, def: 3, spd: 3 }, special: 'Many arms + Mermaid Form',
    unlock: { type: 'level', n: 4 },
    basic: { name: 'Spirit Hand', cd: 0.38, desc: 'A magic hand sprouts beneath an enemy. In Mermaid Form: water jet.', use() {
      act('cast', 0.15);
      if (P.form === 'mermaid') {
        sfx('water');
        shoot({ vx: 300, w: 12, h: 6, life: 0.7, dmg: 13, ox: 10, opts: { water: true, kb: 120, colors: ['#4dd0e1', '#fff'] }, draw: h => { R(h.x - 6, h.y - 2, 12, 4, '#4dd0e1'); R(h.x - 3, h.y - 1, 8, 2, '#e0f7fa'); } });
        return;
      }
      sfx('hit');
      const tgt = nearest(150, true);
      const x = tgt ? tgt.x : P.x + P.face * 55;
      spiritHand(x, 13, 0);
    } },
    s1: { name: 'Multiple Arms', cd: 6, desc: 'Arms sprout around up to 3 enemies and immobilize them.', use() {
      act('cast', 0.4); sfx('skill');
      const list = G.enemies.filter(e => e.alive && Math.abs(e.x - P.x) < 230).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x)).slice(0, 3);
      if (!list.length) list.push({ x: P.x + P.face * 70, y: GROUND, fake: true });
      for (const e of list) {
        for (let i = -1; i <= 1; i++) spiritHand(e.x + i * 9, 0, 0.05 * (i + 1));
        if (!e.fake) { e.active = true; hitEnemy(e, 26, { hold: 2.6, kb: 0, colors: ['#b388ff', '#fff'] }); }
      }
    } },
    s2: { name: 'Water Wave', cd: 6, desc: 'A large wave that pushes enemies far away.', use() {
      act('cast', 0.35); sfx('water');
      shoot({ vx: 210, w: 34, h: 38, life: 1.2, dmg: 22, pierce: Infinity, ox: 18, oy: 18, opts: { kb: 300, water: true, colors: ['#4dd0e1', '#fff'] },
        draw: h => waveDraw(h.x, h.y + 19, 34, 38, h.face) });
    } },
    s3: { name: 'Mermaid Form', cd: 16, desc: 'Transform: faster swimming movement and water attacks x1.8 for 8s.', use() {
      lock(0.4); sinv(0.4); sfx('water'); sfx('skill');
      particles(P.x, P.y - 10, 30, ['#4dd0e1', '#e0f7fa', '#80deea'], { grav: -60, spd: 70 });
      P.form = 'mermaid'; P.formUntil = G.t + 8;
      addBuff('MERMAID', { spd: 1.5 }, 8, '🧜');
      toast('MERMAID FORM!');
    } },
    ult: { name: 'Ocean Grab', desc: 'Giant arms seize every enemy on screen, then a huge wave crashes through.', use() {
      lock(1.2); sinv(1.4); act('cast', 1.2); sfx('ult');
      for (const e of onScreen()) {
        e.active = true;
        fx({ x: e.x, y: e.y, life: 1.2, draw(f) { const h = Math.min(1, f.age * 4) * 40; R(f.x - 14, f.y - h, 6, h, '#9575cd'); R(f.x + 8, f.y - h, 6, h, '#9575cd'); R(f.x - 16, f.y - h - 4, 10, 6, '#d1c4e9'); R(f.x + 6, f.y - h - 4, 10, 6, '#d1c4e9'); } });
        hitEnemy(e, 50, { hold: 3.2, kb: 0, colors: ['#b388ff', '#fff'] });
      }
      shake(5);
      sched(0.6, () => {
        shake(9); sfx('water');
        const h = addHB({ x: P.face > 0 ? G.cam - 40 : G.cam + W + 40, y: GROUND - 36, w: 90, h: 72, vx: P.face * 420, life: 1.5, dmg: 60, opts: { kb: 320, water: true, colors: ['#4dd0e1', '#fff'] } });
        h.face = P.face; h.draw = hb => waveDraw(hb.x, GROUND, 90, 72, hb.face);
      });
    } },
  },
  shipwright: {
    reach: 130, color: '#2ec5ff', short: 'Shipwright', name: 'Bolt Ironkeel', title: 'Cyborg Shipwright', emoji: '🤖', role: 'Heavy ranged damage', hp: 130, spd: 82,
    el: 'explosive', jump: 0.88, stats: { atk: 5, def: 5, spd: 2 }, special: 'Cannons + steel barrier',
    unlock: { type: 'coins', n: 800 },
    basic: { name: 'Mech Punch / Cannon', cd: 0.45, desc: 'Mechanical punch up close, small cannon shot at range.', use() {
      const close = G.enemies.some(e => e.alive && Math.abs(e.x - (P.x + P.face * 14)) < 18 + e.w / 2 && Math.abs((e.y - e.h / 2) - (P.y - 12)) < 24);
      if (close) { act('punch', 0.15); sfx('punch'); melee({ ox: 14, oy: 12, w: 22, h: 16, dmg: 18, opts: { kb: 150 } }); shake(1); }
      else { act('shoot', 0.15); sfx('shoot'); shoot({ vx: 300, w: 6, h: 6, life: 0.9, dmg: 13, ox: 14, opts: { kb: 70 }, draw: h => { R(h.x - 3, h.y - 3, 6, 6, '#37474f'); R(h.x - 2, h.y - 2, 2, 2, '#90a4ae'); } }); }
    } },
    s1: { name: 'Mini Cannon', cd: 3.5, desc: 'Fire an explosive cannonball (area damage).', use() {
      act('shoot', 0.25); sfx('boom'); shake(2); P.kx = -P.face * 90;
      const h = shoot({ vx: 270, w: 10, h: 10, life: 1.6, dmg: 20, ox: 14, oy: 14, grav: 160, solid: true, opts: { kb: 60 },
        draw: hb => { R(hb.x - 5, hb.y - 5, 10, 10, '#263238'); R(hb.x - 3, hb.y - 3, 3, 3, '#78909c'); },
        onHit: hb => explode(hb.x, hb.y, 44), onGround: hb => { explode(hb.x, hb.y, 44); hb.dead = true; } });
      h.vy = -60;
    } },
    s2: { name: 'Rocket Arm', cd: 5, desc: 'Launch your mechanical arm forward — it returns to you.', use() {
      act('rocket', 0.95); sfx('skill');
      const h = shoot({ vx: 340, w: 14, h: 10, life: 0.95, dmg: 32, pierce: Infinity, ox: 12, oy: 12, opts: { kb: 200 },
        update(hb) {
          if (hb.age > 0.45 && !hb.ret) { hb.ret = true; hb.hits.clear(); }
          if (hb.ret) { const dx = P.x - hb.x, dy = (P.y - 12) - hb.y, d = Math.hypot(dx, dy) || 1; hb.vx = dx / d * 420; hb.vy = dy / d * 420; if (d < 10) hb.dead = true; }
          particles(hb.x - Math.sign(hb.vx) * 7, hb.y, 1, ['#ff7a00', '#ffd23f'], { spd: 20, life: 0.25, grav: 0 });
        },
        draw: hb => { g.strokeStyle = '#78909c'; g.lineWidth = 1; g.beginPath(); g.moveTo(P.x + P.face * 5, P.y - 11); g.lineTo(hb.x, hb.y); g.stroke(); R(hb.x - 7, hb.y - 4, 10, 8, '#9aa6b2'); R(hb.x + (hb.face > 0 ? 3 : -7), hb.y - 5, 4, 10, '#c9d2dc'); } });
      h.face = P.face;
    } },
    s3: { name: 'Steel Barrier', icon: 'wall', cd: 10, desc: 'Deploy a steel wall for 4s: it destroys incoming shots and shoves enemies back.', use() {
      act('punch', 0.3); sfx('punch'); shake(2);
      const x = P.x + P.face * 22;
      addHB({ x, y: GROUND - 18, w: 12, h: 36, life: 4, tick: 0.4, dmg: 5, opts: { kb: 160, el: 'blunt', colors: ['#cfd8dc', '#fff'] },
        update(h) { for (const z of G.hz) if (!z.follow && Math.abs(z.x - h.x) < 10 && Math.abs(z.y - h.y) < 22) { z.dead = true; particles(z.x, z.y, 5, ['#ffd23f', '#fff'], { spd: 60 }); } },
        draw(h) { R(h.x - 6, h.y - 18, 12, 36, '#78909c'); R(h.x - 6, h.y - 18, 12, 3, '#cfd8dc'); R(h.x - 4, h.y - 10, 8, 1, '#455a64'); R(h.x - 4, h.y, 8, 1, '#455a64'); R(h.x - 4, h.y + 10, 8, 1, '#455a64'); } });
    } },
    ult: { name: 'Mecha Cannon', desc: 'Transform into a walking fortress and fire a huge energy cannon.', use() {
      lock(1.7); sinv(1.7); act('shoot', 1.7, { cannon: true }); sfx('ult');
      for (let i = 0; i < 10; i++) sched(i * 0.06, () => { const a = rand(0, 6.28); G.parts.push({ x: P.x + P.face * 16 + Math.cos(a) * 30, y: P.y - 15 + Math.sin(a) * 30, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, life: 0.5, age: 0, c: '#4fc3f7', s: 2, grav: 0 }); });
      sched(0.65, () => {
        sfx('boom'); shake(8);
        addHB({ follow: { ox: 250, oy: 15 }, w: 470, h: 32, life: 0.95, tick: 0.1, dmg: 22, opts: { kb: 60, colors: ['#4fc3f7', '#fff'] },
          draw(h) {
            const x0 = P.x + P.face * 14, x1 = P.x + P.face * 480, y = P.y - 15, fl = Math.floor(G.t * 30) % 2;
            const L = Math.min(x0, x1), Wd = Math.abs(x1 - x0);
            R(L, y - 14 - fl, Wd, 28 + fl * 2, '#0288d1'); R(L, y - 9, Wd, 18, '#4fc3f7'); R(L, y - 4, Wd, 8, '#ffffff');
            shake(2);
          } });
      });
    } },
  },
  musician: {
    reach: 36, color: '#d07bff', short: 'Musician', name: 'Maestro Vale', title: 'Musical Swordsman', emoji: '🎵', role: 'Support + sword fighter', hp: 100, spd: 96,
    el: 'sound', jump: 1, stats: { atk: 3, def: 3, spd: 4 }, special: 'Music buffs + stuns',
    unlock: { type: 'boss', n: 2 },
    basic: { name: 'Rapier', cd: 0.3, desc: 'Elegant sword thrust.', use() {
      act('slash', 0.14); sfx('slash');
      slashFx(P.x + P.face * 12, P.y - 12, 14, '#e1bee7', 1);
      melee({ ox: 15, oy: 12, w: 26, h: 14, dmg: 13, opts: { kb: 70 } });
    } },
    s1: { name: 'Sound Blast', cd: 4, desc: 'An expanding sound wave that damages and briefly stuns.', use() {
      act('cast', 0.3); sfx('melody');
      soundRing(220, 0.85, 26, 0.6);
    } },
    s2: { name: 'Music Buff', cd: 14, desc: 'A melody granting +attack speed, +move speed, +defense for 8s.', use() {
      act('cast', 0.6); sfx('melody');
      addBuff('MELODY', { aspd: 1.5, spd: 1.3, def: 0.7 }, 8, '🎶');
      for (let i = 0; i < 5; i++) sched(i * 0.12, () => noteParticle(P.x + rand(-10, 10), P.y - 26));
      toast('MUSIC BUFF!');
    } },
    s3: { name: 'Lullaby', icon: 'moon', cd: 12, desc: 'A soft tune puts nearby enemies to sleep for 3.5s.', use() {
      act('cast', 0.6); sfx('melody');
      for (let i = 0; i < 8; i++) sched(i * 0.08, () => noteParticle(P.x + rand(-30, 30), P.y - 20));
      for (const e of G.enemies) if (e.alive && Math.hypot(e.x - P.x, e.y - P.y) < 140) {
        hitEnemy(e, 6, { stun: 3.5, kb: 0, colors: ['#ce93d8', '#fff'] });
        fx({ x: e.x, y: e.y - e.h, life: 2.5, draw(f) { if (!e.alive) return; g.globalAlpha = 1 - f.age / f.life; pxText('z', e.x + 6 + Math.sin(f.age * 3) * 3, e.y - e.h - 4 - (f.age * 8) % 12, '#e1bee7'); g.globalAlpha = 1; } });
      }
    } },
    ult: { name: 'Musical Blade', desc: 'A sword symphony with huge sound waves that stun every enemy they touch.', use() {
      lock(1.4); sinv(1.5); sfx('ult');
      for (let i = 0; i < 6; i++) sched(i * 0.15, () => {
        act('slash', 0.12); sfx('slash');
        const side = i % 2 ? -1 : 1;
        slashFx(P.x + P.face * side * 16, P.y - 12, 22, i % 2 ? '#ce93d8' : '#fff', side);
        melee({ ox: 18 * side, oy: 12, w: 50, h: 34, dmg: 18, opts: { kb: 40 } });
      });
      for (let i = 0; i < 3; i++) sched(0.3 + i * 0.35, () => {
        sfx('melody'); shake(5);
        const ring = addHB({ x: P.x, y: P.y - 14, w: 10, h: 10, life: 0.7, dmg: 25, opts: { stun: 2.6, kb: 30, colors: ['#ce93d8', '#fff'] },
          update(h) { const r = 10 + h.age * 300; h.w = r * 2; h.h = Math.min(r * 2, 90); },
          draw(h) { g.strokeStyle = 'rgba(206,147,216,' + (1 - h.age / h.life) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(h.x, h.y, h.w / 2, h.h / 2, 0, 0, Math.PI * 2); g.stroke(); } });
        for (let k = 0; k < 4; k++) noteParticle(ring.x + rand(-40, 40), ring.y + rand(-20, 10));
      });
    } },
  },
};
const CH_ORDER = ['captain', 'swordsman', 'navigator', 'sniper', 'cook', 'doctor', 'archaeologist', 'shipwright', 'musician'];
