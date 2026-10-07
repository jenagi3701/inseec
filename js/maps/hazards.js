'use strict';
// =========================================================
// ENVIRONMENT HAZARDS — reusable, switched on per map
// =========================================================
// Each hazard is an object with update(h, dt) and draw(h). Maps list the
// hazard kinds they use; setupHazards() places them along the level.

function setupHazards(map, built, rng) {
  G.env = [];
  // traps stay away from where enemies stand, so you rarely face both at once
  const nearFoe = (x, r) => G.enemies.some(e => !e.fly && !e.water && Math.abs(e.x - x) < r);
  G.sandstorm = 0; G.sandK = 0;
  for (const kind of map.hazards) {
    if (kind === 'wind') {
      // wind zones over the sky route, alternating direction
      let dir = 1;
      for (let x = 500; x < built.len - 500; x += 620) { G.env.push({ kind: 'wind', x0: x, x1: x + 220, dir, phase: rng() * 6 }); dir = -dir; }
    } else if (kind === 'thunder') {
      for (let x = 650; x < built.len - (G.L.boss ? W + 120 : 300); x += 560) if (!nearFoe(x, 110)) G.env.push({ kind: 'thunder', x, t0: rng() * 3, cycle: 4.6 });
    } else if (kind === 'icicles') {
      for (let x = 420; x < built.len - 300; x += 230) if (!nearFoe(x, 90)) G.env.push({ kind: 'icicle', x: x + Math.round(rng() * 60), y: 122, state: 'hang', t: 0 });
    } else if (kind === 'rocks') {
      G.env.push({ kind: 'rockfall', next: 2 });
    } else if (kind === 'sandstorm') {
      G.env.push({ kind: 'sandstorm', next: 9 });
    }
  }
}

function fighting() { return G.enemies.some(e => e.alive && e.active && !e.hidden && !e.sub && Math.abs(e.x - P.x) < 150); }
function inWind(x) {
  for (const h of G.env) if (h.kind === 'wind' && x > h.x0 && x < h.x1 && windOn(h)) return h.dir;
  return 0;
}
function windOn(h) { return Math.sin(G.t * 0.9 + h.phase) > -0.35; }

function updateEnv(dt) {
  for (const h of G.env) {
    switch (h.kind) {
      case 'thunder': {
        const tt = (G.t + h.t0) % h.cycle;
        const prev = h.tt || 0; h.tt = tt;
        if (prev < h.cycle - 0.6 && tt >= h.cycle - 0.6 && Math.abs(P.x - h.x) < W) sfx('zap');
        if (prev > tt) { // strike
          if (Math.abs(P.x - h.x) < W) { G.flash = Math.max(G.flash, 0.06); shake(2); }
          if (Math.abs(P.x - h.x) < 14 && P.y > 150) {
            if (TRAITS.stormProof(P.id)) { P.energy = Math.min(100, P.energy + 20); popText(P.x, P.y - 30, 'ABSORBED ⚡', '#fff59d', true); }
            else { hurtPlayer(18, h.x); P.stunUntil = G.t + 0.5; }
          }
          for (const e of G.enemies) if (e.alive && Math.abs(e.x - h.x) < 14 && !e.boss) hitEnemy(e, 30, { el: 'lightning', env: true, kb: 0, stun: 1 });
        }
        break;
      }
      case 'icicle': {
        if (h.state === 'hang' && Math.abs(P.x - h.x) < 46) { h.state = 'shake'; h.t = 0.55; }
        else if (h.state === 'shake') { h.t -= dt; if (h.t <= 0) { h.state = 'gone'; h.t = 7; addHazard({ x: h.x, y: h.y + 8, vy: 40, grav: 700, w: 6, h: 12, dmg: 14, kind: 'icicle', life: 3, ground: true }); } }
        else if (h.state === 'gone') { h.t -= dt; if (h.t <= 0) h.state = 'hang'; }
        break;
      }
      case 'rockfall': {
        h.next -= dt;
        if (h.next <= 0 && !G.arena && fighting()) h.next = 1; // no rocks while you're in a fight
        else if (h.next <= 0 && !G.arena) {
          h.next = rand(2.4, 3.6);
          const x = clamp(P.x + rand(-40, 130) * (P.face || 1), G.cam + 10, G.cam + W - 10);
          addHazard({ x, y: CAMY - 10, vy: 0, grav: 260, w: 10, h: 10, dmg: 14, kind: 'rock', life: 4, delay: 0, shadow: true, ground: true, fire: true });
        }
        break;
      }
      case 'sandstorm': {
        h.next -= dt;
        if (G.sandstorm > 0) { G.sandstorm -= dt; if (G.sandstorm <= 0) { h.next = rand(10, 14); toast('THE STORM PASSES', 1.2); } }
        else if (h.next <= 0 && fighting()) h.next = 2;
        else if (h.next <= 0) { G.sandstorm = 7; toast('🌫 SANDSTORM!', 1.4); sfx('wind'); }
        G.sandK += ((G.sandstorm > 0 ? 1 : 0) - G.sandK) * Math.min(1, dt * 2);
        break;
      }
    }
  }
}

function drawEnv(cam) {
  for (const h of G.env) {
    switch (h.kind) {
      case 'wind': {
        if (h.x1 < cam || h.x0 > cam + W) break;
        const on = windOn(h);
        R(h.x0, GROUND - 2, 3, 2, '#90caf9'); R(h.x1 - 3, GROUND - 2, 3, 2, '#90caf9');
        if (!on) break;
        for (let i = 0; i < 9; i++) {
          const span = h.x1 - h.x0, k = ((G.t * 160 * h.dir + i * 47) % span + span) % span;
          R(h.x0 + k, 140 + (i * 13) % 90, 14, 1, 'rgba(255,255,255,0.75)');
        }
        if (Math.abs(P.x - (h.x0 + h.x1) / 2) < W) pxText(h.dir > 0 ? '»' : '«', (h.x0 + h.x1) / 2, 128, '#e3f2fd');
        break;
      }
      case 'thunder': {
        if (h.x < cam - 40 || h.x > cam + W + 40) break;
        const tt = h.tt || 0, warn = tt > h.cycle - 0.9;
        const col = warn && Math.floor(G.t * 12) % 2 ? '#fff59d' : '#5c6378';
        R(h.x - 22, 116, 44, 10, col); R(h.x - 14, 110, 28, 6, col); R(h.x - 26, 122, 52, 6, '#474c5c');
        if (warn) { R(h.x - 8, GROUND - 2, 16, 2, '#fff59d'); }
        if (tt < 0.18) { g.strokeStyle = '#fff59d'; g.lineWidth = 3; g.beginPath(); g.moveTo(h.x, 128); for (let y = 140; y < GROUND; y += 16) g.lineTo(h.x + rand(-6, 6), y); g.lineTo(h.x, GROUND); g.stroke(); }
        break;
      }
      case 'icicle': {
        if (h.state === 'gone' || h.x < cam - 20 || h.x > cam + W + 20) break;
        const sx = h.state === 'shake' ? Math.round(Math.sin(G.t * 60)) : 0;
        R(h.x - 16, h.y - 6, 32, 6, '#cfe8f7');
        R(h.x - 3 + sx, h.y, 6, 6, '#b3e5fc'); R(h.x - 2 + sx, h.y + 6, 4, 5, '#b3e5fc'); R(h.x - 1 + sx, h.y + 11, 2, 4, '#e1f5fe');
        break;
      }
    }
  }
}

// screen-space visibility overlay for sandstorms
const fogBuf = document.createElement('canvas'); fogBuf.width = W; fogBuf.height = H;
const fogX = fogBuf.getContext('2d');
function drawSandstorm(cam) {
  if (!G.sandK || G.sandK < 0.02) return;
  const k = G.sandK * (TRAITS.sandSight(P.id) ? 0.45 : 1);
  fogX.globalCompositeOperation = 'source-over';
  fogX.clearRect(0, 0, W, H);
  fogX.fillStyle = 'rgba(196,148,82,' + (0.93 * k) + ')'; fogX.fillRect(0, 0, W, H);
  fogX.globalCompositeOperation = 'destination-out';
  const px = P.x - cam, py = P.y - 14 - CAMY, r = TRAITS.sandSight(P.id) ? 130 : 72;
  const grd = fogX.createRadialGradient(px, py, r * 0.35, px, py, r);
  grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  fogX.fillStyle = grd; fogX.fillRect(0, 0, W, H);
  fogX.globalCompositeOperation = 'source-over';
  g.drawImage(fogBuf, 0, 0);
  for (let i = 0; i < 60 * k; i++) { const x = ((i * 71 - G.t * 260) % W + W) % W, y = (i * 23 + Math.sin(G.t * 3 + i) * 6) % H; R(x, y, 6, 1, 'rgba(255,230,180,0.7)'); }
}
