'use strict';
// ---- shared skill helpers ----
function stretchLen() {
  const s = P.stretch;
  if (!s) return 0;
  const t = G.t - s.start;
  if (t > s.dur) return 0;
  if (t < s.windup) return 0;
  const k = (t - s.windup) / (s.dur - s.windup);
  return s.max * (k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65);
}
function slashFx(x, y, r, color, dir, vertical) {
  const face = P.face;
  fx({ x, y, life: 0.16, draw(f) {
    g.strokeStyle = color; g.globalAlpha = 1 - f.age / f.life; g.lineWidth = 3; g.beginPath();
    if (vertical) g.arc(f.x, f.y, r, Math.PI * 1.1, Math.PI * 1.9);
    else if (face > 0) g.arc(f.x - r * 0.4, f.y, r, -Math.PI / 2.2 * dir, Math.PI / 2.2 * dir, dir < 0);
    else g.arc(f.x + r * 0.4, f.y, r, Math.PI + Math.PI / 2.2 * dir, Math.PI - Math.PI / 2.2 * dir, dir > 0);
    g.stroke(); g.globalAlpha = 1;
  } });
}
function lightning(x, dmg, stun) {
  sfx('zap'); shake(4); G.flash = 0.08;
  fx({ x, y: 0, life: 0.25, draw(f) {
    g.strokeStyle = '#fff59d'; g.lineWidth = 4; g.beginPath(); g.moveTo(f.x, -5);
    let cx = f.x; for (let y = 0; y < GROUND; y += 18) { cx = f.x + rand(-8, 8); g.lineTo(cx, y); } g.lineTo(f.x, GROUND); g.stroke();
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.stroke();
    R(f.x - 10, GROUND - 3, 20, 3, '#fff59d');
  } });
  addHB({ x, y: GROUND - 60, w: 26, h: 130, life: 0.12, dmg, opts: { stun, kb: 20, colors: ['#fff59d', '#fff'] } });
  particles(x, GROUND - 2, 10, ['#fff59d', '#fff'], { angle: -Math.PI / 2, spread: 1, spd: 120 });
}
function tornado(x, vx, life) {
  addHB({ x, y: GROUND - 23, w: 28, h: 46, vx, life, tick: 0.2, dmg: 8, opts: { launch: 140, kb: 30, colors: ['#e0f7fa', '#fff'] },
    draw(h) { for (let i = 0; i < 8; i++) { const w = 6 + i * 3, off = Math.sin(G.t * 14 + i) * 3; R(h.x - w / 2 + off, h.y + 20 - i * 6, w, 4, i % 2 ? '#e0f7fa' : '#b2ebf2'); } } });
}
function retarget(hb) {
  let best = null, bd = 260;
  for (const e of G.enemies) { if (!e.alive || hb.hits.has(e)) continue; const d = Math.hypot(e.x - hb.x, e.y - e.h / 2 - hb.y); if (d < bd) { bd = d; best = e; } }
  if (best) { const dx = best.x - hb.x, dy = best.y - best.h / 2 - hb.y, d = Math.hypot(dx, dy) || 1; hb.vx = dx / d * 380; hb.vy = dy / d * 380; }
  else { hb.vy = -Math.abs(hb.vy || 110); }
}
function spiritHand(x, dmg, delay) {
  fx({ x, y: GROUND, life: 0.45 + delay, draw(f) {
    const k = clamp((f.age - delay) / 0.12, 0, 1) * (1 - clamp((f.age - delay - 0.3) / 0.15, 0, 1));
    const h = Math.round(22 * k); if (h <= 0) return;
    R(f.x - 2, f.y - h, 4, h, '#9575cd'); R(f.x - 4, f.y - h - 4, 8, 5, '#d1c4e9'); R(f.x - 5, f.y - h - 7, 2, 4, '#d1c4e9'); R(f.x - 1, f.y - h - 8, 2, 4, '#d1c4e9'); R(f.x + 3, f.y - h - 7, 2, 4, '#d1c4e9');
    if (Math.random() < 0.3) R(f.x + rand(-8, 8), f.y - rand(0, h), 2, 2, '#f8bbd0');
  } });
  if (dmg) addHB({ x, y: GROUND - 14, w: 16, h: 28, delay: delay + 0.05, life: delay + 0.18, dmg, opts: { kb: 30, launch: 80, colors: ['#b388ff', '#fff'] } });
}
function waveDraw(x, base, w, h, face) {
  const t = G.t;
  for (let i = 0; i < w; i += 3) {
    const k = i / w, hh = Math.round(h * (face > 0 ? k : 1 - k) * (0.8 + 0.2 * Math.sin(t * 20 + i)));
    R(x - w / 2 + i, base - hh, 3, hh, '#1e88e5'); R(x - w / 2 + i, base - hh, 3, 3, '#e0f7fa');
  }
}
function explode(x, y, r) {
  sfx('boom'); shake(4);
  addHB({ x, y, w: r * 1.4, h: r, life: 0.12, dmg: 40, opts: { kb: 200, colors: ['#ff7a00', '#ffd23f', '#555'] } });
  fx({ x, y, life: 0.35, draw(f) { const k = f.age / f.life; circle(f.x, f.y, r * 0.5 * (0.5 + k), k < 0.5 ? '#ffd23f' : '#ff7a00'); circle(f.x, f.y, r * 0.3 * (1 - k), '#ffffff'); } });
  particles(x, y, 18, ['#ff7a00', '#ffd23f', '#555', '#999'], { spd: 140 });
}
function soundRing(spd, life, dmg, stun) {
  shoot({ vx: spd, w: 16, h: 16, life, dmg, pierce: Infinity, ox: 14, oy: 13, opts: { stun, kb: 120, colors: ['#ce93d8', '#fff'] },
    update(h) { const s = 16 + h.age * 50; h.w = s * 0.7; h.h = s; },
    draw(h) { g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(206,147,216,' + (1 - i * 0.3) + ')'; g.beginPath(); const r = h.h / 2 - i * 4; if (r > 0) { g.arc(h.x - h.face * i * 5, h.y, r, h.face > 0 ? -1.1 : Math.PI - 1.1, h.face > 0 ? 1.1 : Math.PI + 1.1); g.stroke(); } } } });
}
function noteParticle(x, y) {
  fx({ x, y, life: 1, draw(f) { const yy = f.y - f.age * 30, xx = f.x + Math.sin(f.age * 8) * 4; g.globalAlpha = 1 - f.age; R(xx, yy, 3, 3, '#ce93d8'); R(xx + 2, yy - 6, 1, 7, '#ce93d8'); R(xx + 3, yy - 6, 2, 1, '#ce93d8'); g.globalAlpha = 1; } });
}
