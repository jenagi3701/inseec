'use strict';
// =========================================================
// KILL REWARDS — power orbs, combos and Pirate Rank
// =========================================================
// Every defeated enemy makes you a little stronger:
//  • a small heal and ultimate energy on every kill
//  • a chance to drop a power orb (heavies, mini bosses and bosses always do)
//  • quick kills chain into a combo; every 5 is a RAMPAGE (bonus coins + rage)
//  • every 6 kills in a level ranks you up: +10 max HP and +5% attack (max rank 5)

const ORBS = {
  heal:     { icon: 'heart',  color: '#ff5252', label: '+25 HP',          weight: 32 },
  energy:   { icon: 'bolt',   color: '#ffd23f', label: '+40 ENERGY',      weight: 20 },
  rage:     { icon: 'power',  color: '#ff7043', label: 'RAGE! +30% ATK',  weight: 16 },
  shield:   { icon: 'guard',  color: '#90caf9', label: 'SHIELD x2',       weight: 14 },
  cooldown: { icon: 'spin',   color: '#b388ff', label: 'SKILLS READY!',   weight: 10 },
  speed:    { icon: 'wing',   color: '#80deea', label: 'SWIFT FEET',      weight: 8 },
};
const RANK_MAX = 5, RANK_KILLS = 6;

function pickOrb() {
  // when you're hurt, healing orbs are much more likely
  const low = P.hp < P.maxHp * 0.45;
  const entries = Object.entries(ORBS).map(([k, o]) => [k, o.weight * (k === 'heal' && low ? 3 : 1)]);
  let r = Math.random() * entries.reduce((a, [, w]) => a + w, 0);
  for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
  return 'heal';
}
function dropOrb(x, y, kind) {
  G.hearts.push({ kind: kind || pickOrb(), x, y, vy: -170, vx: rand(-40, 40), age: 0 });
}

function onKillRewards(e) {
  // small sustain on every kill
  P.energy = Math.min(100, P.energy + 8);
  if (P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + 3);
  // power orbs
  const n = e.boss ? 3 : e.heavy ? 1 : Math.random() < 0.28 ? 1 : 0;
  for (let i = 0; i < n; i++) dropOrb(e.x + (i - (n - 1) / 2) * 14, e.y - e.h / 2, e.boss && i === 0 ? 'heal' : undefined);
  // combo chain
  G.combo = G.t - G.comboT < 3.5 ? G.combo + 1 : 1;
  G.comboT = G.t;
  if (G.combo >= 2) popText(P.x, P.y - 40, 'x' + G.combo + ' COMBO', '#ffd23f');
  if (G.combo % 5 === 0) {
    G.coinCount += 20; G.score += 200;
    addBuff('RAGE', { atk: 1.3 }, 5, '💢');
    toast('RAMPAGE! x' + G.combo + '  +20 COINS', 1.2);
    sfx('unlock'); shake(3);
  }
  // pirate rank
  G.rankKills++;
  if (G.rankKills >= RANK_KILLS && G.rank < RANK_MAX) {
    G.rankKills = 0; G.rank++;
    P.maxHp += 10; P.hp = Math.min(P.maxHp, P.hp + 10);
    G.mods.rank = 1 + (G.rank - 1) * 0.05;
    toast('RANK UP! ' + '★'.repeat(G.rank) + '  +10 MAX HP', 1.6);
    sfx('unlock');
    particles(P.x, P.y - 12, 24, ['#ffd23f', '#ffffff', '#fff59d'], { grav: -80, spd: 90 });
  }
}

function applyOrb(o) {
  const O = ORBS[o.kind];
  popText(P.x, P.y - 34, O.label, O.color, true);
  sfx(o.kind === 'heal' ? 'heal' : 'coin');
  particles(o.x, o.y, 12, [O.color, '#ffffff'], { spd: 70, grav: -40 });
  switch (o.kind) {
    case 'heal': P.hp = Math.min(P.maxHp, P.hp + 25); break;
    case 'energy': P.energy = Math.min(100, P.energy + 40); break;
    case 'rage': addBuff('RAGE', { atk: 1.3 }, 8, '💢'); break;
    case 'shield': P.shieldHits = 2; break;
    case 'cooldown': for (const k in P.cd) P.cd[k] = 0; break;
    case 'speed': addBuff('SWIFT', { spd: 1.3 }, 8, '👟'); break;
  }
}

function updateOrbs(dt) {
  for (const o of G.hearts) {
    o.age += dt;
    o.vy += GRAV * 0.5 * dt; o.y += o.vy * dt; o.x += (o.vx || 0) * dt; if (o.vx) o.vx *= 0.96;
    const floorY = solidAt(o.x) ? GROUND - 6 : GROUND + 40;
    if (o.y >= floorY) { o.y = floorY; o.vy = 0; o.vx = 0; }
    // orbs drift to you once they've landed and you're close
    const dx = P.x - o.x, dy = (P.y - 12) - o.y, d = Math.hypot(dx, dy);
    if (o.age > 0.4 && d < 40) { o.x += dx / d * 160 * dt; o.y += dy / d * 160 * dt; }
    if (o.age > 0.3 && d < 12) { o.got = true; applyOrb(o); }
    if (o.age > 14 || o.y > GROUND + 30) o.got = true;
  }
  G.hearts = G.hearts.filter(o => !o.got);
}

const orbImgs = {};
function orbImage(name) { if (!orbImgs[name]) { const im = new Image(); im.src = iconURL(name); orbImgs[name] = im; } return orbImgs[name]; }
function drawOrb(o) {
  if (o.age > 10 && Math.floor(G.t * 8) % 2) return;
  const O = ORBS[o.kind], x = Math.round(o.x), y = Math.round(o.y + Math.sin(G.t * 5 + o.x) * 1.5);
  g.globalAlpha = 0.35 + Math.sin(G.t * 6) * 0.1; circle(x, y, 8, O.color); g.globalAlpha = 1;
  circle(x, y, 6, '#1a1a2e'); circle(x, y, 5, O.color);
  const im = orbImage(O.icon);
  if (im.complete) g.drawImage(im, x - 4, y - 4, 8, 8);
}
