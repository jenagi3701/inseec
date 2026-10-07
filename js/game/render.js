'use strict';
// =========================================================
// RENDER
// =========================================================
function render() {
  g = mainCtx;
  g.imageSmoothingEnabled = false;
  if (!G) { renderMenuScene(); return; }
  const sh = G.shake > 0 ? Math.round(rand(-G.shake, G.shake) * 0.5) : 0;
  const shy = G.shake > 0 ? Math.round(rand(-G.shake, G.shake) * 0.5) : 0;
  const cam = Math.round(G.cam);
  g.save(); g.translate(0, -CAMY);
  drawBackground(G.theme, cam, G.t, G.worldW);
  g.save();
  g.translate(-cam + sh, shy);
  drawEnv(cam);
  drawTerrain(G.theme, cam);
  for (const pl of G.plats) if (pl.x + pl.w > cam && pl.x < cam + W) drawPlatform(pl, G.theme);
  // arena walls
  if (G.arena) { for (const x of [G.arenaX, G.arenaX + W - 4]) { R(x, 120, 4, GROUND - 120, '#5a3412'); R(x, 120, 4, 3, '#ffd23f'); } }
  else if (G.L.boss && !G.boss) { R(G.arenaX + 60, GROUND - 40, 3, 40, '#5a3412'); R(G.arenaX + 63, GROUND - 40, 16, 10, '#c22'); R(G.arenaX + 67, GROUND - 37, 6, 4, '#fff'); }
  // tutorial signs on level 1
  if (G.level === 1) {
    const tips = isTouch
      ? [[110, 'JOYSTICK = MOVE'], [470, '👊 = ATTACK'], [830, 'ROUND BUTTONS = SKILLS'], [1190, '★ = ULTIMATE'], [1550, 'KILLS GIVE POWER ORBS!']]
      : [[110, 'A/D MOVE·SPACE JUMP'], [470, 'J = ATTACK'], [830, 'Q / E / F = SKILLS'], [1190, 'R = ULTIMATE'], [1550, 'KILLS GIVE POWER ORBS!']];
    tips.push([G.worldW - 170, 'TREASURE →']);
    for (const [x, str] of tips) if (x > cam - 120 && x < cam + W + 120) {
      const wdt = str.length * 8 + 10;
      R(x - wdt / 2, 146, wdt, 16, '#3b2414cc'); R(x - 1, 162, 3, GROUND - 162, '#5a3412');
      pxText(str, x, 154, '#fff7e0');
    }
  }
  for (const c of G.cps) if (c.x > cam - 20 && c.x < cam + W + 20) drawCheckpoint(c);
  if (G.chest) { g.save(); g.translate(0, G.chest.drop || 0); drawChest(G.chest); g.restore(); }
  for (const o of G.hearts) drawOrb(o);
  for (const c of G.coins) if (c.x > cam - 10 && c.x < cam + W + 10) drawCoin(c.x, c.y, G.t + c.x * 0.01);
  for (const h of G.hz) if (h.kind === 'fire') drawHazard(h);
  for (const e of G.enemies) {
    if (!e.alive || e.x < cam - 60 || e.x > cam + W + 60) continue;
    drawEnemy(e);
    if (!e.boss && e.hp < e.maxHp && !e.hidden && !e.sub) { R(e.x - 8, e.y - e.h - 5, 16, 2, '#300'); R(e.x - 8, e.y - e.h - 5, 16 * e.hp / e.maxHp, 2, '#ff5252'); }
  }
  for (const h of G.hz) if (h.kind !== 'fire') drawHazard(h);
  drawPlayer();
  for (const h of G.hbs) if (h.draw && h.age >= (h.delay || 0)) h.draw(h);
  drawTerrainFront(cam);
  for (const f of G.fx) if (f.draw) f.draw(f);
  for (const p of G.parts) R(p.x, p.y, p.s, p.s, p.c);
  for (const t of G.texts) { const k = t.age / t.life; g.globalAlpha = 1 - k * k; pxText(t.str, t.x, t.y - t.age * 24, t.color); g.globalAlpha = 1; }
  if (P.charging) {
    const k = clamp((G.t - P.charging.start) / 1.2, 0, 1);
    R(P.x - 12, P.y - 34, 24, 4, '#000'); R(P.x - 11, P.y - 33, 22 * k, 2, k >= 1 ? '#fff' : '#ffd23f');
  }
  if (!G.arena && G.chest && !G.chest.open && G.chest.x - P.x > 150 && Math.floor(G.t * 2) % 2) pxText('→', cam + W - 16, 140, '#ffd23f');
  g.restore();
  g.restore();
  // screen-space weather & effects
  drawThemeOverlay(G.theme, G.t);
  drawSandstorm(cam);
  const storming = G.t < G.weather;
  if (storming) {
    g.fillStyle = 'rgba(15,20,50,0.38)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) { const x = (i * 53 + G.t * 300 + (i % 7) * 40) % (W + 40) - 20, y = (i * 37 + G.t * (500 + (i % 5) * 60)) % H; R(x, y, 1, 6, '#9fd8ff'); }
  }
  if (G.theme === 'storm' && !storming && Math.sin(G.t * 0.7) > 0.995) G.flash = 0.1;
  if (P.form === 'white') { g.fillStyle = 'rgba(255,255,240,' + (0.06 + Math.sin(G.t * 8) * 0.03) + ')'; g.fillRect(0, 0, W, H); }
  if (G.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(0.7, G.flash * 6) + ')'; g.fillRect(0, 0, W, H); }
}

function drawPlayer() {
  if (G.t < P.inv && Math.floor(G.t * 16) % 2 && !G.over) return;
  const pose = { t: G.t, power: hasBuff('POWER'), mermaid: P.form === 'mermaid' };
  if (!P.onGround) pose.air = true;
  else if (Math.abs(P.vx) > 1) pose.walk = P.walk;
  if (P.act && G.t < P.act.until) Object.assign(pose, P.act, { act: P.act.type });
  if (P.charging) { pose.act = 'shoot'; pose.charge = true; }
  if (P.stretch && G.t - P.stretch.start < P.stretch.dur) {
    const s = P.stretch, t = G.t - s.start;
    pose.act = 'stretch'; pose.L = stretchLen();
    pose.fist = s.giant ? Math.round(4 + Math.min(1, t / s.windup) * (s.fist - 4)) : s.fist;
  }
  const spin = pose.act === 'spin';
  const face = spin ? (Math.floor(G.t * 20) % 2 ? 1 : -1) : P.face;
  // aura for buffs
  if (P.transform > G.t || hasBuff('POWER')) { g.globalAlpha = 0.35; R(P.x - 9, P.y - 27, 18, 28, '#ff6b6b'); g.globalAlpha = 1; }
  if (P.buffs.some(b => b.stat === 'def' && G.t < b.until)) { g.strokeStyle = 'rgba(142,245,155,0.6)'; g.lineWidth = 1; g.beginPath(); g.arc(P.x, P.y - 12, 16, 0, Math.PI * 2); g.stroke(); }
  pose.white = P.form === 'white';
  pose.emergency = P.form === 'emergency';
  if (P.swim) { pose.swim = true; pose.walk = G.t * 6; }
  const groundY = P.onGround ? P.y : GROUND;
  if (!P.swim && !P.sinking && (P.onGround || solidAt(P.x))) shadow(P.x, groundY, P.onGround ? 14 : 8);
  if (P.form === 'white') {
    const r = 18 + Math.sin(G.t * 10) * 2;
    g.globalAlpha = 0.35; circle(P.x, P.y - 13, Math.round(r), '#fffde7'); g.globalAlpha = 0.6; circle(P.x, P.y - 13, Math.round(r * 0.6), '#ffffff'); g.globalAlpha = 1;
  }
  heroOutlined(P.id, P.x, P.y + Math.round(P.sink || 0), face, pose, P.form === 'white' ? '#ffd23f' : undefined);
  if (G.t < P.stunUntil) for (let i = 0; i < 3; i++) { const a = G.t * 6 + i * 2.1; R(P.x + Math.cos(a) * 8 - 1, P.y - 30 + Math.sin(a) * 2, 3, 3, '#ffe066'); }
  // player marker: small bobbing arrow in the crew member's colour
  const my = Math.round(P.y - 34 + Math.sin(G.t * 5) * 1.5), mc = CH[P.id].color;
  g.fillStyle = '#120d1c'; g.fillRect(Math.round(P.x) - 4, my - 1, 9, 3); g.fillRect(Math.round(P.x) - 3, my + 2, 7, 1); g.fillRect(Math.round(P.x) - 2, my + 3, 5, 1); g.fillRect(Math.round(P.x) - 1, my + 4, 3, 1);
  g.fillStyle = mc; g.fillRect(Math.round(P.x) - 3, my, 7, 1); g.fillRect(Math.round(P.x) - 2, my + 1, 5, 1); g.fillRect(Math.round(P.x) - 1, my + 2, 3, 1); g.fillRect(Math.round(P.x), my + 3, 1, 1);
}

function drawHazard(h) {
  const x = Math.round(h.x), y = Math.round(h.y);
  if (h.kind === 'bullet') { R(x - 3, y - 1, 6, 3, '#ff5252'); R(x - 1, y, 2, 1, '#fff'); }
  else if (h.kind === 'bubble') { circle(x, y, 4, '#81d4fa'); R(x - 2, y - 2, 2, 2, '#fff'); }
  else if (h.kind === 'cannon') { circle(x, y, 5, '#212121'); R(x - 2, y - 3, 2, 2, '#757575'); }
  else if (h.kind === 'shock') { R(x - 5, y - 2, 10, 7, '#c8a26a'); R(x - 3, y - 6, 6, 4, '#e8d4a8'); }
  else if (h.kind === 'bomb') { circle(x, y, 4, '#212121'); R(x - 1, y - 6, 2, 2, '#795548'); if (Math.floor(G.t * (h.landed ? 20 : 10)) % 2) R(x, y - 8, 2, 2, '#ffd23f'); if (h.landed) { g.globalAlpha = 0.4; R(x - 22, GROUND - 1, 44, 1, '#ff5252'); g.globalAlpha = 1; } }
  else if (h.kind === 'snow') { circle(x, y, 4, '#ffffff'); R(x - 2, y - 2, 2, 2, '#e1f5fe'); }
  else if (h.kind === 'icicle') { R(x - 3, y - 6, 6, 6, '#b3e5fc'); R(x - 2, y, 4, 5, '#b3e5fc'); R(x - 1, y + 5, 2, 3, '#e1f5fe'); }
  else if (h.kind === 'rock') {
    if (h.shadow) { const k = clamp((h.y - CAMY) / (GROUND - CAMY), 0, 1); g.globalAlpha = 0.25 + k * 0.4; R(x - 4 - k * 4, GROUND - 1, 8 + k * 8, 2, '#000'); g.globalAlpha = 1; }
    circle(x, y, 5, '#4e342e'); R(x - 3, y - 3, 3, 2, '#8d6e63'); R(x + 1, y + 1, 2, 2, '#ff7043');
    if (Math.random() < 0.4) particles(x, y - 4, 1, ['#ff7043', '#9e9e9e'], { spd: 10, grav: -30, life: 0.4 });
  }
  else if (h.kind === 'fire') { const f = Math.floor(G.t * 12 + x) % 3; R(x - 8, y + 2, 16, 3, '#e64a19'); R(x - 6, y - 2 - f, 4, 5 + f, '#ff7043'); R(x - 1, y - 4 + f, 4, 7 - f, '#ffa726'); R(x + 4, y - 1 - f, 3, 4 + f, '#ffca28'); }
  else if (h.kind === 'anchor') { const a = Math.floor(h.age * 12) % 2; R(x - 2, y - 7, 4, 14, '#78909c'); R(x - 7, y + 5, 14, 3, '#90a4ae'); R(x - 7, y + 2 - a, 3, 3, '#90a4ae'); R(x + 4, y + 2 - a, 3, 3, '#90a4ae'); R(x - 4, y - 8, 8, 3, '#90a4ae'); }
  else if (h.kind === 'tentacle') {
    if (h.age < h.delay) { if (Math.floor(h.age * 12) % 2) { R(x - 10, GROUND - 2, 20, 2, '#ff5252'); pxText('!', x, GROUND - 12, '#ff5252'); } }
    else { const k = Math.min(1, (h.age - h.delay) * 8); const hh = Math.round(60 * k); R(x - 6, GROUND - hh, 12, hh, '#7b3fb3'); R(x - 4, GROUND - hh, 8, 6, '#c79bf2'); for (let i = 8; i < hh; i += 10) R(x - 2, GROUND - hh + i, 4, 3, '#c79bf2'); }
  }
}

// menu background scene
let menuT = 0, menuLast = 0;
function renderMenuScene() {
  const now = performance.now() / 1000; const dt = Math.min(0.05, now - (menuLast || now)); menuLast = now; menuT += dt;
  const cam = menuT * 30;
  g.save(); g.translate(0, -CAMY);
  drawBackground('forest', cam, menuT, 1e6);
  drawGround('forest', cam);
  const fakeG = G; // drawHero uses no G
  const id = save.selected && save.unlocked.includes(save.selected) ? save.selected : 'captain';
  shadow(110, GROUND, 14);
  heroOutlined(id, 110, GROUND, 1, { walk: menuT * 8, t: menuT });
  drawCoin(150 + Math.sin(menuT * 2) * 2, GROUND - 30, menuT);
  g.restore();
  void fakeG;
}
