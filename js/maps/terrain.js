'use strict';
// =========================================================
// TERRAIN — a level is a row of segments plus floating platforms
// =========================================================
// Segment kinds:
//   solid:   ground, ship, ice (slippery), quicksand (sinking), shallow (wet, slow)
//   no floor: deep (water), gap (bottomless sky), lava
const SOLID = { ground: 1, ship: 1, ice: 1, quicksand: 1, shallow: 1 };

function buildTerrain(map, rng, hasBoss) {
  const segs = [], plats = [], coinSpots = [], slots = { ground: [], water: [], air: [], sand: [] }, iceSpots = [];
  let x = 0;
  const r = (a, b) => Math.round(a + rng() * (b - a));
  const seg = (kind, w) => { segs.push({ x0: x, x1: x + w, kind }); x += w; };
  const ground = (w, decorate) => {
    const x0 = x; seg('ground', w);
    for (let gx = x0 + 60; gx < x - 40; gx += 70) slots.ground.push(gx);
    slots.air.push(x0 + w / 2);
    if (decorate && w > 180) {
      const pw = 48 + Math.floor(rng() * 3) * 12, py = rng() < 0.5 ? 192 : 174, px = x0 + r(40, w - pw - 40);
      plats.push({ x: px, y: py, w: pw, kind: map.theme === 'sky' ? 'cloud' : map.theme === 'snow' ? 'ice' : 'wood' });
      for (let i = 0; i < 3; i++) coinSpots.push([px + pw / 2 - 12 + i * 12, py - 10]);
    }
    for (let i = 0; i < 2; i++) coinSpots.push([x0 + r(30, w - 30), GROUND - 8 - Math.floor(rng() * 3) * 10]);
  };
  ground(300, false);
  const endLimit = map.len - (hasBoss ? AW + 120 : 280);
  let ci = 0;
  while (x < endLimit) {
    const c = map.chunks[ci++ % map.chunks.length];
    const x0 = x;
    switch (c) {
      case 'flat': ground(r(200, 300), true); break;
      case 'shallow': seg('shallow', r(90, 140)); slots.ground.push(x0 + 40); break;
      case 'water': {
        const w = r(150, 200); seg('deep', w);
        // floating barrels: stepping stones for those who cannot swim
        const n = Math.ceil(w / 52);
        for (let i = 1; i < n; i++) { const bx = x0 + (w / n) * i - 10; plats.push({ x: bx, y: GROUND - 4, w: 20, kind: 'barrel', bob: 2, phase: i }); coinSpots.push([bx + 10, GROUND - 22]); }
        slots.water.push(x0 + w / 2);
        break;
      }
      case 'ship': {
        const w = r(220, 260); seg('ship', w);
        plats.push({ x: x0 + w / 2 - 28, y: 198, w: 56, kind: 'cabin' });
        slots.ground.push(x0 + 50, x0 + w - 50);
        coinSpots.push([x0 + w / 2 - 8, 188], [x0 + w / 2 + 8, 188]);
        break;
      }
      case 'gap': { seg('gap', r(46, 58)); for (let i = 0; i < 3; i++) coinSpots.push([x0 + 12 + i * 12, GROUND - 30 - (i === 1 ? 8 : 0)]); slots.air.push(x0 + 20); break; }
      case 'bridge': {
        const w = r(140, 165); seg('gap', w);
        plats.push({ x: x0 + 8, y: GROUND, w: 40, kind: 'cloud', move: { ax: x0 + 8, bx: x0 + w - 48, spd: 0.55 }, phase: rng() * 6 });
        slots.air.push(x0 + w / 2);
        break;
      }
      case 'quicksand': seg('quicksand', r(70, 110)); slots.sand.push(x0 + 30); break;
      case 'ruins': {
        ground(240, false);
        plats.push({ x: x0 + 40, y: 200, w: 60, kind: 'stone' }, { x: x0 + 120, y: 176, w: 60, kind: 'stone' }, { x: x0 + 170, y: 200, w: 40, kind: 'stone' });
        coinSpots.push([x0 + 140, 166], [x0 + 152, 166], [x0 + 164, 166]);
        break;
      }
      case 'ice': {
        const w = r(170, 240); seg('ice', w);
        plats.push({ x: x0 + w / 2 - 30, y: 190, w: 60, kind: 'ice' });
        slots.ground.push(x0 + 50, x0 + w - 40);
        iceSpots.push(x0 + w / 2);
        break;
      }
      case 'lava': seg('lava', r(44, 56)); coinSpots.push([x0 + 24, GROUND - 34]); break;
      case 'lavawide': {
        const w = r(130, 150); seg('lava', w);
        for (const k of [0.33, 0.66]) plats.push({ x: x0 + w * k - 13, y: GROUND - 6, w: 26, kind: 'rock', bob: 1, phase: k * 9 });
        break;
      }
    }
  }
  // the finish: a long safe stretch (boss arena or treasure)
  const tail = hasBoss ? Math.max(AW + 160, map.len - x) : Math.max(260, map.len - x);
  const tx = x; seg(map.theme === 'ocean' ? 'ship' : 'ground', tail);
  if (!hasBoss) for (let gx = tx + 40; gx < x - 120; gx += 80) slots.ground.push(gx);
  for (const p of plats) { p.baseX = p.x; p.baseY = p.y; p.dx = 0; }
  return { segs, plats, coinSpots, slots, iceSpots, len: x };
}

function segAt(x) {
  const s = G.segs;
  let lo = 0, hi = s.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (x < s[m].x0) hi = m - 1; else if (x >= s[m].x1) lo = m + 1; else return s[m]; }
  return x < 0 ? s[0] : s[s.length - 1];
}
function solidAt(x) { return !!SOLID[segAt(x).kind]; }
// floor height under a body of half-width hw centred at x (Infinity = no floor)
function floorAt(x, hw) {
  hw = hw || 0;
  return solidAt(x) || (hw && (solidAt(x - hw) || solidAt(x + hw))) ? GROUND : Infinity;
}
function nearestSolidX(x) {
  if (solidAt(x)) return x;
  for (let d = 4; d < 600; d += 4) { if (solidAt(x - d)) return x - d - 6; if (solidAt(x + d)) return x + d + 6; }
  return 40;
}

function updatePlatforms(dt) {
  for (const p of G.plats) {
    const ox = p.x;
    if (p.move) { const k = (Math.sin(G.t * p.move.spd + p.phase) + 1) / 2; p.x = p.move.ax + (p.move.bx - p.move.ax) * k; }
    if (p.bob) p.y = p.baseY + Math.round(Math.sin(G.t * 2 + p.phase) * p.bob);
    p.dx = p.x - ox;
  }
}

// ---------- drawing ----------
const TERRAIN_COLORS = {
  forest: { top: '#4caf50', body: '#8d6e3f', dark: '#6d5230' },
  ocean: { top: '#fff0b5', body: '#f1d08a', dark: '#d9b56a' },
  sky: { top: '#7cb342', body: '#a1785a', dark: '#7a5a40' },
  desert: { top: '#ffe0a3', body: '#e8bf76', dark: '#c99a50' },
  snow: { top: '#ffffff', body: '#dfe9f3', dark: '#b8c8d8' },
  volcano: { top: '#6d4c41', body: '#3e2723', dark: '#2a1a17' },
  storm: { top: '#a0703f', body: '#7a4e2d', dark: '#5c3a20' },
};
function drawTerrain(theme, cam) {
  const C = TERRAIN_COLORS[theme] || TERRAIN_COLORS.forest;
  for (const s of G.segs) {
    if (s.x1 < cam || s.x0 > cam + W) continue;
    const x0 = Math.max(s.x0, cam - 2), x1 = Math.min(s.x1, cam + W + 2), w = x1 - x0;
    switch (s.kind) {
      case 'ground': case 'shallow':
        R(x0, GROUND, w, 40, C.body); R(x0, GROUND, w, 2, C.top);
        for (let wx = Math.floor(x0 / 16) * 16; wx < x1; wx += 16) {
          const h = (wx * 2654435761) >>> 0;
          if (wx + 2 > x1 || wx < x0) continue;
          R(wx + (h % 11), GROUND + 6 + (h % 5) * 4, 2, 1, C.dark);
          if (theme === 'forest' && h % 3 === 0) R(wx + 4, GROUND - 3, 2, 3, '#3fae4b');
          if (theme === 'snow' && h % 4 === 0) R(wx + 6, GROUND - 2, 4, 2, '#ffffff');
          if (theme === 'sky') { R(wx, GROUND + 2, 16, 2, '#558b2f'); if (h % 3 === 0) { R(wx + 5, GROUND - 3, 2, 3, '#8bc34a'); R(wx + 5, GROUND - 4, 2, 1, h % 2 ? '#fff176' : '#f8bbd0'); } }
        }
        if (s.x0 >= x0) edge(s.x0, C);
        if (s.x1 <= x1) edge(s.x1 - 3, C);
        break;
      case 'ship':
        R(x0, GROUND, w, 40, '#6b3f22'); R(x0, GROUND, w, 3, '#a0682f'); R(x0, GROUND + 8, w, 2, '#4a2a14');
        for (let wx = Math.ceil(x0 / 24) * 24; wx < x1; wx += 24) R(wx, GROUND + 3, 1, 5, '#4a2a14');
        if (s.x0 >= x0) { R(s.x0, GROUND - 10, 4, 50, '#4a2a14'); R(s.x0, GROUND - 10, 4, 2, '#ffd23f'); }
        if (s.x1 <= x1) { R(s.x1 - 4, GROUND - 10, 4, 50, '#4a2a14'); R(s.x1 - 4, GROUND - 10, 4, 2, '#ffd23f'); }
        // mast + sail
        { const mx = (s.x0 + s.x1) / 2 + 40; if (mx > cam - 40 && mx < cam + W + 40) { R(mx, GROUND - 120, 4, 120, '#4a2a14'); R(mx - 34, GROUND - 112, 72, 46, '#f3ead6'); R(mx - 34, GROUND - 112, 72, 3, '#c9bfa8'); R(mx - 8, GROUND - 98, 18, 14, '#222'); R(mx - 4, GROUND - 94, 3, 3, '#fff'); R(mx + 3, GROUND - 94, 3, 3, '#fff'); R(mx, GROUND - 128, 14, 8, '#c62828'); } }
        break;
      case 'ice':
        R(x0, GROUND, w, 40, '#a7d8f5'); R(x0, GROUND, w, 2, '#e8f7ff');
        for (let wx = Math.ceil(x0 / 20) * 20; wx < x1; wx += 20) R(wx, GROUND + 4, 8, 1, '#ffffff');
        break;
      case 'quicksand': {
        R(x0, GROUND, w, 40, '#b8894a');
        const t = G.t;
        for (let wx = Math.ceil(x0 / 10) * 10; wx < x1; wx += 10) R(wx + Math.sin(t * 2 + wx) * 2, GROUND + 2 + ((wx / 10) % 3) * 3, 4, 1, '#8a6232');
        R(x0, GROUND, w, 1, '#d4a865');
        break;
      }
      case 'gap': break; // sky shows through
      case 'deep': R(x0, GROUND + 26, w, 20, '#0d3b66'); break; // sea floor (front water drawn later)
      case 'lava': R(x0, GROUND + 6, w, 40, '#3e0f05'); break;
    }
  }
}
function edge(x, C) { R(x, GROUND, 3, 40, C.dark); }

// water and lava are drawn in front of characters so they look submerged
function drawTerrainFront(cam) {
  for (const s of G.segs) {
    if (s.x1 < cam || s.x0 > cam + W) continue;
    const x0 = Math.max(s.x0, cam - 2), x1 = Math.min(s.x1, cam + W + 2), w = x1 - x0;
    if (s.kind === 'deep' || s.kind === 'shallow') {
      const top = s.kind === 'deep' ? GROUND + 2 : GROUND - 4;
      g.fillStyle = s.kind === 'deep' ? 'rgba(30,120,200,0.72)' : 'rgba(80,170,230,0.5)';
      g.fillRect(x0, top, w, 50);
      for (let wx = Math.ceil(x0 / 14) * 14; wx < x1 - 6; wx += 14) R(wx + Math.round(Math.sin(G.t * 3 + wx * 0.2) * 2), top + (Math.floor(G.t * 4 + wx) % 2), 6, 1, '#cfefff');
      if (s.kind === 'deep') { R(x0, top + 14, w, 1, 'rgba(255,255,255,0.15)'); }
    } else if (s.kind === 'quicksand') {
      R(x0, GROUND + 1, w, 30, '#b8894a');
      for (let wx = Math.ceil(x0 / 10) * 10; wx < x1 - 4; wx += 10) R(wx + Math.sin(G.t * 2 + wx) * 2, GROUND + 3 + ((wx / 10) % 3) * 3, 4, 1, '#8a6232');
    } else if (s.kind === 'lava') {
      R(x0, GROUND + 4, w, 40, '#e64a19'); R(x0, GROUND + 4, w, 2, '#ffca28');
      for (let wx = Math.ceil(x0 / 12) * 12; wx < x1 - 4; wx += 12) { const b = Math.sin(G.t * 4 + wx) > 0.6; R(wx, GROUND + 7 + (wx % 5), 4, 2, b ? '#ffeb3b' : '#ff7043'); }
      if (Math.random() < 0.15) particles(x0 + Math.random() * w, GROUND + 4, 1, ['#ffca28', '#ff7043'], { angle: -Math.PI / 2, spread: 0.4, spd: 60, grav: 120, life: 0.6 });
      g.fillStyle = 'rgba(255,120,40,0.12)'; g.fillRect(x0, GROUND - 30, w, 34);
    }
  }
}

function drawPlatform(p, theme) {
  const x = Math.round(p.x), y = Math.round(p.y), w = p.w;
  switch (p.kind) {
    case 'barrel':
      R(x + 2, y, w - 4, 14, '#8b5a2b'); R(x, y + 3, w, 2, '#5d4037'); R(x, y + 9, w, 2, '#5d4037'); R(x + 2, y, w - 4, 2, '#a0682f');
      break;
    case 'cloud': {
      if (p.move) {
        // dotted track showing where the moving cloud travels
        for (let tx = p.move.ax; tx < p.move.bx + w; tx += 8) R(tx, y + 12, 3, 1, 'rgba(255,255,255,0.75)');
        R(p.move.ax - 2, y + 10, 2, 5, '#64b5f6'); R(p.move.bx + w, y + 10, 2, 5, '#64b5f6');
      }
      const edge = p.move ? '#1e88e5' : '#90caf9';
      R(x - 1, y, w + 2, 8, edge); R(x + 3, y - 3, w - 6, 4, edge);
      R(x, y + 1, w, 6, '#ffffff'); R(x + 4, y - 2, w - 8, 4, '#ffffff'); R(x + 2, y + 7, w - 4, 2, '#bbdefb');
      if (p.move) { const k = Math.floor(G.t * 4) % 2; R(x + 4 + k, y + 3, 2, 2, '#1e88e5'); R(x + w - 6 - k, y + 3, 2, 2, '#1e88e5'); pxText('↔', x + w / 2, y - 7, '#1565c0'); }
      break;
    }
    case 'cabin':
      R(x, y, w, 34, '#7a4a22'); R(x, y, w, 3, '#a0682f'); R(x + 8, y + 10, 10, 8, '#ffe082'); R(x + w - 18, y + 10, 10, 8, '#ffe082'); R(x + w / 2 - 5, y + 18, 10, 16, '#4a2a14');
      break;
    case 'stone':
      R(x, y, w, 8, '#c9a46a'); R(x, y, w, 2, '#e8cf9a'); for (let i = 10; i < w; i += 14) R(x + i, y + 2, 1, 6, '#9c7a45');
      R(x + 6, y + 8, 5, GROUND - y - 8, '#b8935a'); R(x + w - 11, y + 8, 5, GROUND - y - 8, '#b8935a');
      break;
    case 'ice':
      R(x, y, w, 6, '#b3e5fc'); R(x, y, w, 2, '#ffffff'); for (let i = 4; i < w; i += 9) R(x + i, y + 6, 3, 4 + (i % 3) * 2, '#b3e5fc');
      break;
    case 'rock':
      R(x, y, w, 10, '#4e342e'); R(x, y, w, 2, '#8d6e63'); R(x + 3, y + 10, w - 6, 4, '#3e2723');
      break;
    default: {
      const top = theme === 'forest' ? '#3fae4b' : theme === 'storm' ? '#8a5a33' : '#a0682f';
      R(x, y, w, 6, '#7a4a22'); R(x, y, w, 2, top);
      for (let i = 8; i < w; i += 12) R(x + i, y + 2, 1, 4, '#5a3412');
      R(x + 4, y + 6, 2, 6, '#5a3412'); R(x + w - 6, y + 6, 2, 6, '#5a3412');
    }
  }
}
