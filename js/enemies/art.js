'use strict';
// =========================================================
// NEW ENEMY ART — each archetype has its own silhouette
// =========================================================
// Painter p(x, y, w, h, color) is relative to the sprite's top-centre,
// mirrored by facing. C() whitens colours while the enemy flashes.

function legs(p, C, t, e, col, y0) {
  const ph = Math.floor(t * 8 + e.id) % 2;
  p(-3, y0, 3, 5 + ph, C(col)); p(1, y0, 3, 6 - ph, C(col)); p(-3, y0 + 5, 3, 1, '#1a1a1a'); p(1, y0 + 5, 3, 1, '#1a1a1a');
}

const ENEMY_ART = {
  sword(e, ox, fy, f, t, C) {
    const lean = e.st === 'lunge' ? 2 : 0, p = painter(f, ox + f * lean, fy - 24);
    legs(p, C, t, e, '#2b2b3a', 18);
    p(-4, 11, 8, 8, C('#b71c1c')); p(-4, 11, 2, 8, C('#7f0000')); p(-4, 17, 8, 1, C('#ffd23f'));
    p(-4, 4, 8, 7, C('#e0ac7e')); p(1, 6, 2, 2, '#111'); p(0, 9, 3, 1, '#5d4037');
    p(-6, 2, 12, 2, C('#1a1a1a')); p(-3, 0, 6, 2, C('#1a1a1a')); p(-1, 1, 2, 1, '#ffffff');
    if (e.st === 'wind') { p(3, 4, 2, 7, C('#e0ac7e')); p(4, -6, 1, 10, '#eceff1'); p(3, -6, 3, 1, '#ffd23f'); }
    else { p(3, 12, 6, 2, C('#e0ac7e')); p(9, 11, 11, 1, '#eceff1'); p(9, 12, 9, 1, '#b0bec5'); p(8, 10, 1, 4, '#ffd23f'); }
  },
  shield(e, ox, fy, f, t, C) {
    const p = painter(f, ox, fy - 26);
    legs(p, C, t, e, '#37474f', 20);
    p(-6, 11, 11, 10, C('#546e7a')); p(-6, 11, 11, 2, C('#90a4ae'));
    p(-5, 3, 9, 8, C('#d7a27a')); p(1, 6, 2, 2, '#111');
    p(-6, 0, 11, 5, C('#78909c')); p(-1, -2, 2, 2, C('#b0bec5'));
    const broken = e.broken;
    p(5, 5, 4, 20, C(broken ? '#6d4c41' : '#8d6e63')); p(4, 4, 6, 2, C('#cfd8dc')); p(4, 24, 6, 2, C('#cfd8dc'));
    if (!broken) { p(9, 4, 1, 22, C('#eceff1')); p(5, 13, 4, 3, C('#ffd23f')); }
    else { p(6, 12, 3, 1, '#3e2723'); p(7, 16, 2, 2, '#3e2723'); }
  },
  spear(e, ox, fy, f, t, C) {
    const p = painter(f, ox, fy - 26);
    legs(p, C, t, e, '#33691e', 20);
    p(-3, 11, 6, 10, C('#558b2f')); p(-3, 17, 6, 1, C('#c5e1a5'));
    p(-3, 4, 6, 7, C('#c68e5f')); p(1, 6, 2, 1, '#111');
    p(-6, 3, 12, 1, C('#c8a165')); p(-4, 1, 8, 2, C('#c8a165')); p(-1, -1, 2, 2, C('#c8a165'));
    if (e.st === 'thrust') { p(2, 13, 30, 1, '#8d6e63'); p(32, 12, 4, 3, '#cfd8dc'); p(35, 13, 2, 1, '#ffffff'); }
    else if (e.st === 'wind') { p(-6, 13, 22, 1, '#8d6e63'); p(16, 12, 4, 3, '#cfd8dc'); }
    else { p(5, -8, 1, 30, '#8d6e63'); p(4, -12, 3, 5, '#cfd8dc'); }
  },
  bomber(e, ox, fy, f, t, C) {
    const p = painter(f, ox, fy - 22);
    legs(p, C, t, e, '#4e342e', 17);
    p(-7, 8, 14, 10, C('#eeeeee')); for (let i = 0; i < 3; i++) p(-7, 9 + i * 3, 14, 1, C('#d32f2f'));
    p(-4, 1, 8, 7, C('#e5b48c')); p(1, 3, 2, 2, '#111'); p(-4, 0, 8, 2, C('#ff8f00'));
    if (e.st === 'wind') { p(-1, -9, 7, 7, '#212121'); p(1, -11, 2, 2, '#795548'); if (Math.floor(t * 20) % 2) p(2, -13, 2, 2, '#ffd23f'); p(3, -2, 2, 4, C('#e5b48c')); }
    else { p(6, 10, 6, 6, '#212121'); p(8, 8, 2, 2, '#795548'); }
  },
  seacreature(e, ox, fy, f, t, C) {
    const p = painter(f, ox, fy - 12);
    if (e.sub) { const b = Math.round(Math.sin(t * 4 + e.id)); p(-2, 2 + b, 6, 6, C('#455a64')); p(0, 0 + b, 3, 2, C('#455a64')); return; }
    p(-12, 4, 22, 8, C('#607d8b')); p(-8, 2, 14, 2, C('#607d8b')); p(-12, 9, 22, 3, C('#cfd8dc'));
    p(-2, -2, 5, 5, C('#546e7a')); p(-16, 2, 4, 4, C('#546e7a')); p(-17, 7, 4, 4, C('#546e7a'));
    p(6, 6, 2, 2, '#ffeb3b'); p(7, 6, 1, 1, '#111');
    for (let i = 0; i < 4; i++) p(4 + i * 2, 10, 1, 1, '#ffffff');
  },
  cannonship(e, ox, fy, f, t, C) {
    const b = Math.round(Math.sin(t * 2 + e.id) * 1.5), p = painter(f, ox, fy - 30 + b);
    p(-20, 18, 40, 10, C('#5d4037')); p(-18, 28, 36, 3, C('#3e2723')); p(-20, 18, 40, 2, C('#8d6e63'));
    p(-1, -4, 2, 22, '#3e2723'); p(-12, -2, 22, 14, C('#bdbdbd')); p(-5, 1, 8, 6, '#212121'); p(-3, 3, 2, 2, '#fff'); p(1, 3, 2, 2, '#fff');
    p(10, 12, 12, 5, '#263238'); p(20, 11, 3, 7, '#37474f');
    if (e.st === 'wind' && Math.floor(t * 16) % 2) p(23, 12, 3, 4, '#ffd23f');
    p(-14, 14, 4, 4, C('#2e7d32')); p(-14, 11, 4, 3, C('#e0ac7e'));
  },
  raider(e, ox, fy, f, t, C) {
    if (e.hidden) { const p = painter(f, ox, fy - 6); const k = Math.floor(t * 3 + e.id) % 2; p(-9, 2 + k, 18, 4 - k, '#c99a50'); p(-5, k, 10, 3, '#d9ad66'); return; }
    const crouch = e.st === 'leap' ? 0 : 2, p = painter(f, ox, fy - 22 + crouch);
    legs(p, C, t, e, '#8d6e63', 16 - crouch);
    p(-5, 8, 10, 9, C('#d7b77a')); p(-6, 10, 2, 8, C('#c49a5a'));
    p(-4, 1, 8, 7, C('#a1887f')); p(-4, 4, 8, 2, C('#5d4037')); p(1, 4, 2, 1, '#ffeb3b');
    p(-5, 0, 10, 2, C('#d7b77a')); p(-7, 2, 3, 6, C('#d7b77a'));
    p(4, 10, 4, 2, C('#a1887f')); p(8, 8, 2, 5, '#eceff1'); p(9, 7, 2, 2, '#eceff1');
  },
  skywarrior(e, ox, fy, f, t, C) {
    const flap = Math.floor(t * 10 + e.id) % 2, p = painter(f, ox, fy - 24);
    if (flap) { p(-16, 2, 10, 4, C('#ffffff')); p(-14, 0, 6, 2, C('#ffffff')); p(-18, 6, 6, 3, C('#e3f2fd')); }
    else { p(-16, 10, 10, 4, C('#ffffff')); p(-18, 14, 6, 3, C('#e3f2fd')); p(-14, 8, 6, 2, C('#ffffff')); }
    p(-3, 18, 3, 5, C('#1565c0')); p(1, 18, 3, 5, C('#1565c0'));
    p(-4, 10, 8, 8, C('#1e88e5')); p(-4, 10, 8, 2, C('#ffd23f'));
    p(-3, 3, 7, 7, C('#f1c27d')); p(1, 5, 2, 2, '#0d47a1');
    p(-4, 0, 9, 4, C('#ffd23f')); p(-6, 1, 2, 2, C('#ffffff')); p(5, 1, 2, 2, C('#ffffff'));
    if (e.st === 'dive') { p(2, 14, 18, 1, '#8d6e63'); p(20, 13, 4, 3, '#eceff1'); }
    else { p(4, 0, 1, 20, '#8d6e63'); p(3, -4, 3, 5, '#eceff1'); }
  },
  icemonster(e, ox, fy, f, t, C) {
    const p = painter(f, ox, fy - 22);
    p(-8, 6, 16, 14, C('#e3f2fd')); p(-9, 9, 18, 9, C('#e3f2fd')); p(-6, 4, 12, 3, C('#ffffff'));
    p(-7, 20, 5, 2, C('#90caf9')); p(2, 20, 5, 2, C('#90caf9'));
    p(-7, 1, 3, 4, C('#90caf9')); p(4, 1, 3, 4, C('#90caf9'));
    p(1, 8, 2, 2, '#1a237e'); p(5, 8, 2, 2, '#1a237e');
    p(0, 13, 7, e.st === 'wind' ? 4 : 2, '#3949ab'); p(1, 13, 1, 1, '#fff'); p(5, 13, 1, 1, '#fff');
    p(-10, 10, 3, 7, C('#bbdefb')); p(8, 10, 3, 7, C('#bbdefb'));
  },
  firemonster(e, ox, fy, f, t, C) {
    const fl = Math.floor(t * 12 + e.id) % 3, p = painter(f, ox, fy - 16);
    p(-6, 6, 12, 10, C('#ff7043')); p(-5, 3 - fl, 10, 4, C('#ffa726')); p(-3, 0 - fl, 6, 4, C('#ffca28')); p(-1, -3 - fl, 2, 3, C('#fff59d'));
    p(-6, 14, 12, 2, C('#e64a19'));
    p(0, 8, 2, 2, '#1a1a1a'); p(3, 8, 2, 2, '#1a1a1a'); p(1, 12, 3, 1, '#1a1a1a');
    p(-8, 9, 2, 2, C('#ffca28')); p(6, 9, 2, 2, C('#ffca28'));
  },
  warlord(e, ox, fy, f, t, C) {
    const V = e.variant === 'magma' ? { coat: '#5d1a10', trim: '#ff7043', skin: '#8d6e63', hat: '#2b1612' } : { coat: '#c49a5a', trim: '#5d4037', skin: '#d7a27a', hat: '#4e342e' };
    const p = painter(f, ox, fy - 44), ph = Math.floor(t * 6 + e.id) % 2;
    p(-9, 34, 7, 10 - ph, C('#3e2723')); p(2, 34, 7, 9 + ph, C('#3e2723'));
    p(-12, 16, 24, 20, C(V.coat)); p(-12, 16, 3, 22, C(V.trim)); p(9, 16, 3, 22, C(V.trim)); p(-12, 30, 24, 2, C('#ffd23f'));
    p(-7, 4, 14, 12, C(V.skin)); p(2, 8, 3, 2, '#111'); p(-3, 8, 3, 2, '#111'); p(-6, 13, 12, 3, C('#5d4037'));
    p(-14, 0, 28, 5, C(V.hat)); p(-9, -6, 18, 7, C(V.hat)); p(-2, -4, 4, 4, '#ffffff'); p(-1, -3, 2, 1, '#111');
    if (e.variant === 'magma') { p(-8, 20, 2, 8, '#ffca28'); p(4, 24, 2, 6, '#ffca28'); }
    if (e.st === 'wind' || e.st === 'slamwind') { p(10, -14, 4, 30, '#78909c'); p(4, -16, 16, 4, '#90a4ae'); p(2, -12, 4, 4, '#90a4ae'); p(18, -12, 4, 4, '#90a4ae'); }
    else if (!e.anchorOut) { p(12, 18, 4, 22, '#78909c'); p(6, 38, 16, 4, '#90a4ae'); p(6, 34, 4, 4, '#90a4ae'); p(18, 34, 4, 4, '#90a4ae'); p(11, 15, 6, 3, '#90a4ae'); }
  },
};
