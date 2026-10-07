'use strict';
// ---------------------------------------------------------
// enemy sprites
// ---------------------------------------------------------
function drawEnemy(e) {
  const hw = e.boss ? 52 : 40, up = e.h + (e.boss ? 18 : 18);
  if (!e.fly && !e.water && !e.hidden && solidAt(e.x)) shadow(e.x, GROUND, Math.max(10, Math.min(e.w, 30)));
  const art = ENEMY_ART[e.type];
  const C = c => (e.flash > 0 ? '#ffffff' : c);
  outlined(hw, up, (ax, ay) => (art ? art(e, ax, ay, e.face || 1, G ? G.t : 0, C) : drawEnemyBody(e, ax, ay)), e.x, e.y);
  if (!e.hidden && !e.sub) drawEnemyStatus(e);
}
function drawEnemyBody(e, ox, fy) {
  const f = e.face || 1;
  const t = G ? G.t : 0;
  const flash = e.flash > 0;
  const C = c => (flash ? '#ffffff' : c);
  if (e.type === 'slime') {
    const sq = e.onGround ? (Math.sin(t * 8 + e.id) > 0 ? 1 : 0) : -2;
    const p = painter(f, ox, fy - 10);
    const body = e.tint || '#55d16b', dark = e.tint2 || '#2f9c45';
    p(-6, 1 + sq, 12, 9 - sq, C(body)); p(-7, 4 + sq, 14, 6 - sq, C(body)); p(-4, 0 + sq, 8, 1, C(body));
    p(-7, 9, 14, 1, C(dark)); p(-4, 2 + sq, 2, 1, '#d9ffe0');
    p(1, 4 + sq, 2, 2, '#111'); p(4, 4 + sq, 2, 2, '#111'); p(2, 4 + sq, 1, 1, '#fff'); p(5, 4 + sq, 1, 1, '#fff');
  } else if (e.type === 'grunt' || e.type === 'gunner') {
    const ph = Math.floor(t * 8 + e.id) % 2;
    const p = painter(f, ox, fy - 24);
    const skin = e.skin || (e.type === 'gunner' ? '#8aa35a' : '#4aa3a2');
    p(-3, 18, 3, 5 + ph, C('#5a3b22')); p(1, 18, 3, 6 - ph, C('#5a3b22')); p(-3, 23, 3, 1, '#222'); p(1, 23, 3, 1, '#222');
    p(-4, 12, 8, 6, C('#e6e6e6')); p(-4, 13, 8, 1, C('#3a4a8a')); p(-4, 15, 8, 1, C('#3a4a8a')); p(-4, 17, 8, 1, C('#3b2414'));
    p(-5, 3, 9, 9, C(skin)); p(-2, 1, 3, 2, C('#2f7a79')); p(4, 8, 2, 2, C(skin));
    p(1, 5, 3, 3, '#ffe066'); p(2, 6, 2, 2, '#111'); p(2, 10, 3, 1, '#1f4f4e');
    if (e.type === 'gunner') { p(-5, 2, 9, 2, C('#c62828')); p(-7, 3, 2, 2, C('#c62828')); }
    p(-6, 12, 2, 5, C(skin));
    if (e.type === 'grunt') {
      if (e.st === 'wind') { p(3, 4, 2, 6, C(skin)); p(4, -4, 1, 8, '#cfd8dc'); p(3, 3, 3, 1, '#8d6e63'); }
      else if (e.st === 'swing') { p(3, 12, 6, 2, C(skin)); p(9, 12, 10, 2, '#cfd8dc'); }
      else { p(3, 12, 2, 5, C(skin)); p(4, 17, 1, 6, '#cfd8dc'); }
    } else {
      p(3, 12, 6, 2, C(skin)); p(8, 11, 6, 2, '#37474f'); p(8, 13, 2, 2, '#5d4037');
      if (e.st === 'wind' && Math.floor(t * 20) % 2) p(14, 10, 3, 3, '#ffd23f');
    }
  } else if (e.type === 'flyer') {
    const flap = Math.floor(t * 12 + e.id) % 2;
    const p = painter(f, ox, fy - 12);
    p(-4, 3, 9, 6, C('#6b3fa0')); p(-3, 4, 7, 4, C('#8455c9'));
    if (flap) { p(-10, 0, 7, 3, C('#4a2a78')); p(-9, 3, 4, 2, C('#4a2a78')); }
    else { p(-10, 6, 7, 3, C('#4a2a78')); p(-9, 9, 4, 2, C('#4a2a78')); }
    p(5, 4, 4, 2, '#ff9f1a'); p(2, 4, 2, 2, '#ff2d2d'); p(-1, 9, 1, 2, '#ff9f1a'); p(2, 9, 1, 2, '#ff9f1a');
  } else if (e.type === 'heavy') {
    const p = painter(f, ox, fy - 30);
    const up = e.st === 'wind';
    p(-9, 24, 6, 6, C('#a8473a')); p(3, 24, 6, 6, C('#a8473a'));
    p(-12, 6, 24, 19, C('#e8735a')); p(-10, 3, 20, 4, C('#e8735a')); p(-8, 1, 6, 3, C('#ff9f80')); p(3, 0, 4, 4, C('#ff9f80'));
    p(-8, 10, 3, 3, C('#ffb08a')); p(-3, 18, 4, 3, C('#ffb08a')); p(5, 16, 3, 3, C('#ffb08a'));
    p(3, 9, 3, 3, '#111'); p(4, 9, 1, 1, '#ff3'); p(1, 14, 7, 2, '#5a1f17');
    if (up) { p(9, -6, 6, 14, C('#c85a48')); p(-15, -6, 6, 14, C('#c85a48')); }
    else { p(10, 8, 6, 14, C('#c85a48')); p(-16, 8, 6, 14, C('#c85a48')); p(10, 20, 7, 5, C('#a8473a')); }
  } else if (e.type === 'crab') {
    const p = painter(f, ox, fy - 40);
    const lw = Math.floor(t * 10) % 2;
    for (let i = 0; i < 3; i++) { p(-20 + i * 6, 32 + (i + lw) % 2, 3, 8, C('#9c2a1c')); p(8 + i * 6, 32 + (i + lw + 1) % 2, 3, 8, C('#9c2a1c')); }
    p(-26, 12, 52, 22, C('#d9412b')); p(-22, 8, 44, 6, C('#d9412b')); p(-18, 6, 36, 3, C('#9aa6b2')); p(-22, 9, 44, 2, C('#6b7785'));
    p(-16, 18, 6, 4, C('#ff7a5c')); p(4, 20, 8, 4, C('#ff7a5c'));
    p(4, -2, 3, 10, C('#9c2a1c')); p(12, -2, 3, 10, C('#9c2a1c')); p(3, -5, 5, 5, '#fff'); p(11, -5, 5, 5, '#fff'); p(5, -4, 2, 3, '#111'); p(13, -4, 2, 3, '#111');
    const open = e.st === 'charge' || e.st === 'wind' ? 4 : 0;
    p(24, 6 - open, 16, 8, C('#e8553c')); p(24, 16 + open, 16, 7, C('#c13a26')); p(36, 6 - open, 4, 17 + open * 2, C('#d9412b'));
    p(-34, 10, 10, 12, C('#c13a26')); p(-36, 8, 6, 6, C('#e8553c'));
    if (e.phase2) { p(-6, 24, 12, 2, '#ffde59'); }
  } else if (e.type === 'kraken') {
    const p = painter(f, ox, fy - 60);
    for (let i = 0; i < 6; i++) {
      const sx = -24 + i * 9, wv = Math.round(Math.sin(t * 5 + i) * 3);
      p(sx, 42, 5, 14, C('#7b3fb3')); p(sx + wv, 54, 5, 6, C('#7b3fb3')); p(sx + 1, 46, 2, 2, C('#c79bf2'));
    }
    p(-24, 12, 48, 32, C('#9a52d6')); p(-20, 6, 40, 8, C('#9a52d6')); p(-16, 2, 32, 5, C('#9a52d6'));
    p(-12, 20, 6, 6, C('#c79bf2')); p(-18, 32, 4, 4, C('#c79bf2')); p(10, 34, 5, 5, C('#c79bf2'));
    p(4, 16, 9, 9, '#fff'); p(8, 18, 4, 5, e.phase2 ? '#ff2d2d' : '#111');
    p(-10, 16, 9, 7, '#111'); p(-14, 15, 26, 1, '#111');
    p(-22, -6, 44, 9, C('#1c1c1c')); p(-28, 2, 56, 3, C('#1c1c1c')); p(-4, -4, 8, 5, '#fff'); p(-2, -3, 4, 1, '#111'); p(-3, -1, 6, 1, '#ffd23f');
    p(-2, 30, 10, 3, '#3b0f5c');
    if (e.st === 'cannons' || e.st === 'wind') { p(24, 20, 14, 6, '#37474f'); p(36, 18, 4, 10, '#263238'); }
  }
}
function drawEnemyStatus(e) {
  const ox = Math.round(e.x), fy = Math.round(e.y), t = G.t;
  // stun stars / hold arms
  if (G && (G.t < e.stunUntil || G.t < e.holdUntil)) {
    const top = fy - e.h - 5;
    if (G.t < e.holdUntil) {
      for (let i = -1; i <= 1; i++) { R(ox + i * 6 - 1, fy - e.h * 0.7, 3, e.h * 0.7, '#b388ff'); R(ox + i * 6 - 2, fy - e.h * 0.7 - 3, 5, 4, '#e1bee7'); }
    } else {
      for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; R(ox + Math.cos(a) * 8 - 1, top + Math.sin(a) * 2, 3, 3, '#ffe066'); }
    }
  }
  if (G && G.t < e.burnUntil && Math.floor(t * 15) % 2) R(ox - 3 + Math.random() * 6, fy - e.h * Math.random(), 3, 3, '#ff7a00');
}

function drawCoin(x, y, t) {
  const fr = Math.floor(t * 8) % 4, w = [6, 4, 2, 4][fr];
  R(x - w / 2, y - 3, w, 6, '#ffd23f'); R(x - w / 2, y + 2, w, 1, '#b8860b');
  if (w > 2) R(x - w / 2 + 1, y - 2, 1, 2, '#fff8c2');
}
function drawHeart(x, y) {
  x = Math.round(x); y = Math.round(y);
  R(x - 3, y - 3, 2, 1, '#ff3b3b'); R(x + 1, y - 3, 2, 1, '#ff3b3b'); R(x - 4, y - 2, 8, 2, '#ff3b3b'); R(x - 3, y, 6, 1, '#ff3b3b'); R(x - 2, y + 1, 4, 1, '#ff3b3b'); R(x - 1, y + 2, 2, 1, '#ff3b3b'); R(x - 3, y - 2, 1, 1, '#ffd0d0');
}
function drawChest(c) {
  const x = Math.round(c.x), y = GROUND;
  R(x - 12, y - 14, 24, 14, '#8b5a2b'); R(x - 12, y - 14, 24, 2, '#ffd23f'); R(x - 12, y - 2, 24, 2, '#5a3b1a');
  R(x - 12, y - 14, 2, 14, '#ffd23f'); R(x + 10, y - 14, 2, 14, '#ffd23f');
  if (c.open) {
    R(x - 12, y - 24, 24, 6, '#a0682f'); R(x - 12, y - 24, 24, 1, '#ffd23f');
    R(x - 9, y - 17, 18, 4, '#ffd23f'); R(x - 6, y - 18, 3, 2, '#fff8c2'); R(x + 2, y - 18, 4, 2, '#ff4f6d');
  } else {
    R(x - 13, y - 20, 26, 7, '#a0682f'); R(x - 13, y - 20, 26, 1, '#ffd23f'); R(x - 2, y - 15, 4, 5, '#ffd23f'); R(x - 1, y - 13, 2, 2, '#333');
    if (Math.floor(G.t * 4) % 2) R(x + 8, y - 26, 2, 2, '#fff');
  }
}
