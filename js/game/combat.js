'use strict';
// ---------------------------------------------------------
// GAME STATE
// ---------------------------------------------------------
let G = null;   // current level state
let P = null;   // player

function statMul(stat) {
  let m = 1;
  for (const b of P.buffs) if (b.stat === stat && G.t < b.until) m *= b.mult;
  return m;
}
function hasBuff(name) { return P.buffs.some(b => b.name === name && G.t < b.until); }
function addBuff(name, stats, dur, icon) {
  P.buffs = P.buffs.filter(b => b.name !== name);
  for (const [stat, mult] of Object.entries(stats)) P.buffs.push({ name, stat, mult, until: G.t + dur, icon });
}

// ---- effect helpers ----
function particles(x, y, n, colors, o) {
  o = o || {};
  for (let i = 0; i < n; i++) {
    const a = o.angle != null ? o.angle + rand(-o.spread || 0, o.spread || 0) : rand(0, Math.PI * 2);
    const s = rand(o.min || 20, o.spd || 90);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, o.life || 0.7), age: 0, c: pick(colors), s: o.size || (Math.random() < 0.3 ? 2 : 1), grav: o.grav != null ? o.grav : 200 });
  }
}
function popText(x, y, str, color, big) { G.texts.push({ x, y, str, color, age: 0, life: big ? 1.4 : 0.8 }); }
function fx(o) { const f = Object.assign({ age: 0, life: 0.3 }, o); G.fx.push(f); return f; }
function shake(n) { G.shake = Math.max(G.shake, n); }
function sched(delay, fn) { G.timers.push({ at: G.t + delay, fn }); }
function lock(d) { P.lockUntil = Math.max(P.lockUntil, G.t + d); }
function sinv(d) { P.sinv = Math.max(P.sinv, G.t + d); }
function act(type, dur, extra) { P.act = Object.assign({ type, until: G.t + dur }, extra || {}); }
function toast(msg, dur) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), (dur || 1.4) * 1000);
}
function heal(n) {
  const before = P.hp; P.hp = Math.min(P.maxHp, P.hp + n);
  popText(P.x, P.y - 30, '+' + Math.round(P.hp - before), '#8ef59b', true);
  particles(P.x, P.y - 12, 16, ['#8ef59b', '#ffffff', '#c8ffd0'], { grav: -60, spd: 50 });
  sfx('heal');
}
function playerRect() { return { x: P.x - P.w / 2, y: P.y - P.h, w: P.w, h: P.h }; }
function enemyRect(e) { return { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h }; }
function hbRect(h) { return { x: h.x - h.w / 2, y: h.y - h.h / 2, w: h.w, h: h.h }; }
function liveEnemies() { return G.enemies.filter(e => e.alive && e.active); }
function onScreen() { return G.enemies.filter(e => e.alive && e.x > G.cam - 10 && e.x < G.cam + W + 10); }
function nearest(range, front) {
  let best = null, bd = 1e9;
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const dx = e.x - P.x;
    if (front && Math.sign(dx) !== P.face && Math.abs(dx) > 12) continue;
    const d = Math.hypot(dx, (e.y - e.h / 2) - (P.y - 12));
    if (d < range && d < bd) { bd = d; best = e; }
  }
  return best;
}

// ---- player hitboxes ----
function addHB(o) {
  const h = Object.assign({ x: P.x, y: P.y - 12, w: 10, h: 10, vx: 0, vy: 0, life: 0.15, age: 0, dmg: 10, tick: 0, pierce: Infinity, grav: 0, opts: {}, delay: 0, dead: false }, o);
  h.hits = new Map();
  if (h.follow) { h.face = P.face; h.x = P.x + P.face * h.follow.ox; h.y = P.y - h.follow.oy; }
  G.hbs.push(h); return h;
}
function melee(o) { return addHB(Object.assign({ life: 0.1 }, o, { follow: { ox: o.ox || 12, oy: o.oy || 12 } })); }
function shoot(o) {
  const h = addHB(Object.assign({ life: 1.2, pierce: 1 }, o));
  h.x = P.x + P.face * (o.ox || 10); h.y = P.y - (o.oy || 12); h.vx = (o.vx || 200) * P.face; h.face = P.face;
  if (G.sandstorm > 0 && !TRAITS.sandSight(P.id)) h.life *= 0.6; // sand cuts range
  return h;
}

function hitEnemy(e, dmg, opts, src) {
  if (!e.alive || e.sub) return;
  opts = opts || {};
  if (e.hidden) reveal(e);
  const el = opts.el || (opts.water ? 'water' : CH[P.id].el);
  let mult = opts.env ? 1 : statMul('atk') * G.mods.atk * (G.mods.rank || 1);
  if (opts.water && P.form === 'mermaid') mult *= 1.8;
  if (P.form === 'white' && !opts.env) mult *= 1.6;
  let tag = '';
  if (e.weak.includes(el)) { mult *= 1.5; tag = 'WEAK!'; }
  else if (e.resist.includes(el)) { mult *= 0.6; tag = 'RESIST'; }
  if (el === 'fire' && e.fireproof) { mult *= 0.3; tag = 'RESIST'; }
  const sx = src ? (src.follow ? P.x : src.x) : P.x;
  const dir = opts.dir || (Math.sign(e.x - sx) || P.face);
  // shield pirates block hits from the front unless the attack can bypass the shield
  if (e.type === 'shield' && !e.broken && !opts.env && !opts.crit && dir === -e.face && !e.weak.includes(el) && !(G.t < e.stunUntil)) {
    mult *= 0.15; tag = 'BLOCK'; sfx('punch'); P.kx = -dir * 90;
    particles(e.x + e.face * 8, e.y - 14, 6, ['#eceff1', '#ffd23f'], { spd: 80 });
  } else if (e.type === 'shield' && !e.broken && (el === 'explosive' || opts.crit)) { e.broken = true; tag = 'SHIELD BROKEN!'; }
  const d = Math.max(1, Math.round(dmg * mult * rand(0.9, 1.1)));
  e.hp -= d; e.flash = 0.1; e.active = true;
  popText(e.x + rand(-4, 4), e.y - e.h - 4, String(d), opts.crit ? '#ffd23f' : tag === 'WEAK!' ? '#ffeb3b' : '#ffffff');
  if (tag && (tag !== 'BLOCK' || !e.lastTag || G.t - e.lastTag > 0.6)) { e.lastTag = G.t; popText(e.x, e.y - e.h - 14, tag, tag === 'WEAK!' ? '#ffeb3b' : tag === 'BLOCK' ? '#b0bec5' : tag === 'RESIST' ? '#90a4ae' : '#ff9f43'); }
  if (!e.boss && !e.water) {
    let kb = opts.kb != null ? opts.kb : 60;
    if (P.form === 'white') kb = kb * 1.8 + 60;
    if (tag === 'BLOCK') kb = 0;
    e.kx = dir * kb * (1 - e.kbRes);
    if (opts.launch && !e.heavy) { e.vy = -opts.launch; e.onGround = false; }
    else if (opts.juggle && !e.onGround && !e.heavy) e.vy = -110;
    if (opts.spike && !e.heavy) e.vy = 320;
  }
  if (!e.boss && !e.heavy) {
    e.flinch = G.t + 0.3; // brief hit-stun: no contact damage, wind-ups get interrupted
    if (e.st === 'wind' || e.st === 'swoop') { e.st = e.type === 'flyer' ? 'rise' : 'idle'; e.stT = 0.6; }
  }
  if (opts.stun) e.stunUntil = Math.max(e.stunUntil, G.t + opts.stun * (e.boss ? 0.25 : 1));
  if (opts.hold) e.holdUntil = Math.max(e.holdUntil, G.t + opts.hold * (e.boss ? 0.3 : 1));
  if (opts.burn) { e.burnUntil = G.t + opts.burn; e.burnNext = G.t + 0.3; }
  P.energy = Math.min(100, P.energy + d * 0.12);
  G.stats.dmg += d;
  particles(e.x, e.y - e.h / 2, 5, opts.colors || ['#fff', '#ffd23f', '#ff9f43'], { spd: 70, life: 0.35 });
  sfx('hit');
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.alive = false; e.hp = 0;
  G.stats.kills++;
  G.score += e.score;
  particles(e.x, e.y - e.h / 2, e.boss ? 60 : 14, e.boss ? ['#ffd23f', '#ff4f6d', '#fff', '#7b3fb3'] : ['#fff', '#ddd', e.type === 'slime' ? '#55d16b' : '#ff9f43'], { spd: e.boss ? 180 : 100 });
  popText(e.x, e.y - e.h - 10, '+' + e.score, '#ffd23f');
  dropCoins(e.x, e.y - e.h / 2, e.coins);
  onKillRewards(e);
  sfx(e.boss ? 'boom' : 'kill');
  if (e.boss) bossDefeated(e);
}

function dropCoins(x, y, value) {
  let left = value;
  while (left > 0) {
    const v = left >= 25 ? 25 : left >= 10 ? 10 : 5;
    left -= v;
    G.coins.push({ x, y, vx: rand(-70, 70), vy: rand(-220, -120), v, age: 0, ground: false });
  }
}

function hurtPlayer(dmg, fromX) {
  if (G.over || G.won || G.t < P.inv || G.t < P.sinv) return;
  if (G.t < P.guardUntil) {
    // Iron Guard: block and counter
    P.guardUntil = 0; P.inv = G.t + 0.4; sfx('slash'); shake(3);
    popText(P.x, P.y - 30, 'COUNTER!', '#e0f7fa', true);
    slashFx(P.x + P.face * 14, P.y - 12, 24, '#ffffff', 1); slashFx(P.x - P.face * 14, P.y - 12, 24, '#ff6b6b', -1);
    melee({ ox: 0, oy: 12, w: 70, h: 34, dmg: 45, life: 0.12, opts: { kb: 220, crit: true } });
    return;
  }
  if (P.shieldHits > 0) {
    P.shieldHits--; P.inv = G.t + 0.6; sfx('punch');
    popText(P.x, P.y - 30, 'BLOCKED!', '#90caf9', true);
    particles(P.x, P.y - 12, 10, ['#90caf9', '#ffffff'], { spd: 80 });
    return;
  }
  const d = Math.max(1, Math.round(dmg * statMul('def') * G.mods.def));
  P.hp -= d;
  P.inv = G.t + 0.9;
  P.kx = (Math.sign(P.x - fromX) || -P.face) * 140; P.vy = -140; P.onGround = false;
  G.stats.hurt += d;
  popText(P.x, P.y - 28, '-' + d, '#ff5252');
  shake(4); sfx('hurt');
  particles(P.x, P.y - 12, 8, ['#ff5252', '#fff'], { spd: 80 });
  if (P.hp <= 0) { P.hp = 0; gameOver(); }
}
// chill slows the player unless they are cold-proof
function chillPlayer(dur) {
  if (TRAITS.noChill(P.id)) return;
  P.chillUntil = G.t + dur;
  particles(P.x, P.y - 12, 8, ['#e1f5fe', '#81d4fa'], { spd: 40 });
}

// ---- enemy hazards (projectiles / slams) ----
function addHazard(o) {
  const h = Object.assign({ x: 0, y: 0, w: 6, h: 6, vx: 0, vy: 0, grav: 0, life: 3, age: 0, dmg: 10, delay: 0, once: true, dead: false, kind: 'ball' }, o);
  G.hz.push(h); return h;
}
