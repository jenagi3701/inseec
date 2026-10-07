'use strict';
// ---------------------------------------------------------
// MAP THEMES & PARALLAX BACKGROUNDS (all drawn procedurally)
// ---------------------------------------------------------
const THEMES = {
  forest: { sky: ['#5cc9b3', '#e6ffd0'], sun: '#fffbcc', cloud: '#f0fff0', far: '#2e7d4f', far2: '#3d9e5a', sea: '#2b9c8f', sea2: '#6fd6c4' },
  ocean: { sky: ['#3fa9f5', '#c4efff'], sun: '#fff27a', cloud: '#ffffff', far: '#3d7a5a', sea: '#1f7fc8', sea2: '#7fd0f5', seaTop: 150 },
  sky: { sky: ['#6ec3ff', '#e8f7ff'], sun: '#fffde0', cloud: '#ffffff', far: '#9ccc65', far2: '#7cb342' },
  desert: { sky: ['#f59e5b', '#ffe8c2'], sun: '#fff3b0', cloud: '#ffe7c7', far: '#e0a85a', far2: '#cf8f45', haze: true },
  snow: { sky: ['#8fbde6', '#eef6ff'], sun: '#ffffff', cloud: '#ffffff', far: '#b8cde3', far2: '#93aecb', snowfall: true },
  volcano: { sky: ['#2a0a0a', '#a5401f'], cloud: '#5a2a22', far: '#2b1612', far2: '#3d1d16', embers: true },
  storm: { sky: ['#232433', '#585b72'], sea: '#283044', sea2: '#5a6a8a', cloud: '#3a3c4f', far: '#1b1d29', rain: true, seaTop: 172 },
};

function drawBackground(theme, camX, t, worldW) {
  const T = THEMES[theme] || THEMES.forest;
  const bands = 12;
  for (let i = 0; i < bands; i++) {
    g.fillStyle = mix(T.sky[0], T.sky[1], i / (bands - 1));
    g.fillRect(0, Math.floor(CAMY + i * (H + 10) / bands), W, Math.ceil((H + 10) / bands) + 1);
  }
  if (theme === 'storm' || theme === 'volcano') {
    if (theme === 'volcano') drawVolcanoBack(camX, t, T);
  } else if (T.sun) circle(258 - camX * 0.02, CAMY + 30, theme === 'desert' ? 20 : 15, T.sun);
  // drifting clouds
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 140 - camX * 0.15 + t * 4) % (W + 120) + W + 120) % (W + 120) - 60, cy = CAMY + 8 + (i * 37) % 44;
    R(cx, cy, 40, 8, T.cloud); R(cx + 8, cy - 6, 22, 6, T.cloud); R(cx - 6, cy + 4, 52, 5, T.cloud);
  }
  const par = (k, span) => (i, gap) => ((i * gap - camX * k) % span + span) % span - 120;
  switch (theme) {
    case 'forest': {
      const p = par(0.25, W + 300);
      R(0, 172, W, 60, T.sea); for (let y = 178; y < 232; y += 9) for (let x = 0; x < W; x += 32) R(x + (Math.floor(t * 8) + y) % 32 - (camX * 0.4) % 32, y, 9, 1, T.sea2);
      for (let i = 0; i < 4; i++) { const ix = p(i, 210); R(ix, 150, 140, 30, T.far); R(ix + 20, 136, 90, 16, T.far); R(ix + 45, 124, 40, 14, T.far2); }
      for (let px0 = 60; px0 < worldW; px0 += 190) { const sx = px0 - camX * 0.75; if (sx > -60 && sx < W + 60) ((px0 / 190) % 3 === 1 ? roundTree : palm)(sx, GROUND, T); }
      for (let px0 = 400; px0 < worldW; px0 += 760) { const sx = px0 - camX * 0.85; if (sx > -60 && sx < W + 60) hut(sx, GROUND); }
      break;
    }
    case 'ocean': {
      R(0, T.seaTop, W, 120, T.sea);
      for (let y = T.seaTop + 4; y < 252; y += 8) for (let x = -16; x < W + 16; x += 30) R(x + ((Math.floor(t * 10) + y) % 30) - ((camX * 0.5) % 30), y, 10, 1, T.sea2);
      const p = par(0.2, W + 400);
      for (let i = 0; i < 3; i++) { const ix = p(i, 260); R(ix, T.seaTop - 12, 70, 12, T.far); R(ix + 26, T.seaTop - 30, 4, 22, '#5d4037'); R(ix + 14, T.seaTop - 32, 28, 6, '#2e7d32'); }
      const q = par(0.35, W + 300);
      for (let i = 0; i < 2; i++) farShip(q(i, 330), T.seaTop + 2, t, i);
      break;
    }
    case 'sky': {
      // sea of clouds far below, floating islands with waterfalls that flow upward
      for (let i = 0; i < 9; i++) { const cx = ((i * 60 - camX * 0.3) % (W + 80) + W + 80) % (W + 80) - 40; R(cx, 226 + (i % 3) * 4, 70, 30, '#ffffff'); R(cx + 10, 220 + (i % 2) * 3, 46, 10, '#f3f9ff'); }
      const p = par(0.22, W + 360);
      for (let i = 0; i < 3; i++) floatIsle(p(i, 240), 130 + (i % 2) * 22, t, T, i);
      break;
    }
    case 'desert': {
      const p1 = par(0.12, W + 400), p2 = par(0.3, W + 320);
      for (let i = 0; i < 3; i++) { const ix = p1(i, 280); ziggurat(ix, 176, '#d29a55', '#b9813f'); }
      for (let i = 0; i < 5; i++) { const ix = p2(i, 150); R(ix, 196, 160, 40, T.far); R(ix + 30, 188, 100, 10, T.far); R(ix + 60, 182, 40, 8, T.far2); }
      for (let px0 = 140; px0 < worldW; px0 += 300) { const sx = px0 - camX * 0.8; if (sx > -60 && sx < W + 60) ((px0 / 300) % 2 ? cactus : adobe)(sx, GROUND); }
      g.fillStyle = 'rgba(255,220,160,0.12)'; g.fillRect(0, 150, W, 90);
      break;
    }
    case 'snow': {
      const p1 = par(0.12, W + 400), p2 = par(0.3, W + 300);
      for (let i = 0; i < 3; i++) mountain(p1(i, 260), 214, 120, T.far2, '#ffffff');
      for (let i = 0; i < 4; i++) mountain(p2(i, 170) + 40, 222, 70, T.far, '#f5fbff');
      for (let px0 = 90; px0 < worldW; px0 += 160) { const sx = px0 - camX * 0.8; if (sx > -40 && sx < W + 40) pine(sx, GROUND); }
      break;
    }
    case 'volcano': {
      for (let px0 = 120; px0 < worldW; px0 += 230) { const sx = px0 - camX * 0.8; if (sx > -40 && sx < W + 40) spire(sx, GROUND, px0); }
      break;
    }
    case 'storm': {
      R(0, T.seaTop, W, 90, T.sea);
      for (let y = T.seaTop + 4; y < 252; y += 8) for (let x = -16; x < W + 16; x += 32) R(x + ((Math.floor(t * 10) + y) % 32) - ((camX * 0.5) % 32), y, 10, 1, T.sea2);
      const p = par(0.3, W + 300);
      for (let i = 0; i < 4; i++) { const ix = p(i, 230); R(ix, 160, 90, 15, T.far); R(ix + 15, 150, 60, 10, T.far); R(ix + 30, 143, 25, 8, T.far); }
      for (let px0 = 120; px0 < worldW; px0 += 340) { const sx = px0 - camX * 0.8; if (sx > -40 && sx < W + 40) { R(sx, GROUND - 110, 4, 110, '#3b2b20'); R(sx - 30, GROUND - 95, 64, 3, '#3b2b20'); R(sx - 26, GROUND - 92, 56, 34, '#c9c2b0'); R(sx - 4, GROUND - 120, 14, 8, '#111'); R(sx - 1, GROUND - 118, 4, 2, '#fff'); } }
      break;
    }
  }
}

// screen-space weather drawn over everything (snowfall, embers, rain, heat haze)
function drawThemeOverlay(theme, t) {
  const T = THEMES[theme] || {};
  if (T.snowfall) for (let i = 0; i < 50; i++) { const x = ((i * 47 + t * (12 + i % 5 * 4) + Math.sin(t + i) * 10) % (W + 10) + W + 10) % (W + 10) - 5, y = (i * 29 + t * (20 + i % 4 * 6)) % H; R(x, y, i % 3 ? 1 : 2, i % 3 ? 1 : 2, '#ffffff'); }
  if (T.embers) for (let i = 0; i < 30; i++) { const x = (i * 61 + Math.sin(t * 0.7 + i) * 14 + W * 2) % W, y = H - ((i * 37 + t * (18 + i % 5 * 5)) % H); R(x, y, 1, 1, i % 2 ? '#ffb74d' : '#ff7043'); }
  if (T.rain) for (let i = 0; i < 40; i++) { const x = (i * 53 + t * 300 + (i % 7) * 40) % (W + 40) - 20, y = (i * 37 + t * (500 + (i % 5) * 60)) % H; R(x, y, 1, 6, '#9fd8ff88'); }
  if (theme === 'volcano') { g.fillStyle = 'rgba(255,90,30,' + (0.05 + Math.sin(t * 2) * 0.03) + ')'; g.fillRect(0, 0, W, H); }
}

// ---------- scenery pieces ----------
function palm(x, base, T) {
  for (let i = 0; i < 10; i++) R(x + Math.round(Math.sin(i * 0.3) * 3), base - 8 - i * 6, 4, 7, i % 2 ? '#8b5a2b' : '#6b4423');
  const top = base - 68, lc = '#2f9e44';
  R(x - 16, top, 36, 4, lc); R(x - 22, top + 4, 10, 3, lc); R(x + 16, top + 4, 10, 3, lc); R(x - 6, top - 6, 16, 6, lc); R(x - 26, top + 7, 6, 3, lc); R(x + 24, top + 7, 6, 3, lc);
  R(x, top + 4, 3, 3, '#6b4423'); R(x + 3, top + 5, 3, 3, '#6b4423');
}
function roundTree(x, base) {
  R(x, base - 46, 6, 46, '#5d4037'); R(x - 4, base - 6, 14, 6, '#4e342e');
  circle(x + 3, base - 60, 20, '#2e7d32'); circle(x - 9, base - 52, 12, '#388e3c'); circle(x + 15, base - 50, 13, '#1b5e20'); circle(x + 2, base - 70, 10, '#43a047');
  R(x - 20, base - 4, 10, 4, '#9e9e9e'); R(x - 18, base - 7, 6, 3, '#bdbdbd'); // rock
}
function hut(x, base) {
  R(x - 22, base - 26, 44, 26, '#a1887f'); R(x - 26, base - 34, 52, 10, '#d7b46a'); R(x - 20, base - 40, 40, 8, '#c9a457'); R(x - 6, base - 18, 12, 18, '#4e342e');
  R(x + 22, base - 46, 2, 46, '#4e342e'); R(x + 24, base - 46, 14, 9, '#111'); R(x + 29, base - 44, 3, 3, '#fff');
}
function farShip(x, y, t, i) {
  const b = Math.round(Math.sin(t * 1.5 + i) * 1.5);
  R(x, y - 8 + b, 46, 8, '#4e342e'); R(x + 4, y - 10 + b, 38, 2, '#6d4c41'); R(x + 21, y - 40 + b, 2, 30, '#3e2723'); R(x + 10, y - 36 + b, 24, 18, '#eeeeee'); R(x + 23, y - 46 + b, 8, 5, '#111');
}
function floatIsle(x, y, t, T, i) {
  R(x, y, 70, 10, '#8d6e63'); R(x + 6, y + 10, 58, 8, '#6d4c41'); R(x + 18, y + 18, 34, 8, '#5d4037'); R(x + 28, y + 26, 14, 6, '#4e342e');
  R(x, y - 3, 70, 4, T.far); R(x + 10, y - 16, 4, 13, '#5d4037'); circle(x + 12, y - 20, 7, T.far2);
  // an upward waterfall: water flowing into the sky
  for (let k = 0; k < 6; k++) { const yy = y - 6 - ((t * 30 + k * 12 + i * 7) % 70); R(x + 50, yy, 4, 6, k % 2 ? '#b3e5fc' : '#e1f5fe'); }
  R(x + 48, y - 76, 8, 70, 'rgba(179,229,252,0.35)');
}
function ziggurat(x, base, c1, c2) { for (let i = 0; i < 4; i++) R(x + i * 10, base - (i + 1) * 12, 100 - i * 20, 12, i % 2 ? c2 : c1); R(x + 44, base - 12, 12, 12, '#7a4f22'); }
function adobe(x, base) { R(x - 18, base - 24, 36, 24, '#d9a86c'); R(x - 18, base - 26, 36, 3, '#c08c4f'); R(x - 4, base - 14, 8, 14, '#6d4c41'); R(x + 8, base - 18, 6, 5, '#4e342e'); R(x - 14, base - 30, 8, 5, '#b07a42'); }
function cactus(x, base) { R(x, base - 30, 6, 30, '#558b2f'); R(x - 8, base - 22, 8, 4, '#558b2f'); R(x - 8, base - 28, 4, 8, '#558b2f'); R(x + 6, base - 18, 8, 4, '#558b2f'); R(x + 10, base - 26, 4, 10, '#558b2f'); R(x + 1, base - 30, 2, 30, '#7cb342'); }
function mountain(x, base, h, c, cap) {
  for (let i = 0; i < h; i += 4) { const w = Math.round((h - i) * 1.2); R(x - w / 2, base - i - 4, w, 4, i > h * 0.7 ? cap : c); }
}
function pine(x, base) {
  R(x - 2, base - 10, 4, 10, '#5d4037');
  for (let i = 0; i < 4; i++) { const w = 26 - i * 6; R(x - w / 2, base - 16 - i * 9, w, 8, '#2e5d4b'); R(x - w / 2 + 2, base - 16 - i * 9, w - 4, 2, '#ffffff'); }
}
function spire(x, base, seed) {
  const h = 40 + (seed % 3) * 14;
  R(x - 8, base - h, 16, h, '#3e2723'); R(x - 5, base - h - 8, 10, 8, '#4e342e'); R(x - 2, base - h - 14, 4, 6, '#5d4037');
  R(x - 3, base - h + 10, 2, h - 10, '#bf360c');
}
function drawVolcanoBack(camX, t, T) {
  const vx = 170 - camX * 0.05;
  for (let i = 0; i < 90; i += 3) { const w = 40 + i * 2.2; R(vx - w / 2, 120 + i, w, 3, i < 6 ? '#5d2a1c' : T.far2); }
  R(vx - 20, 118, 40, 4, '#ff7043'); R(vx - 14, 116, 28, 2, '#ffca28');
  for (let k = 0; k < 7; k++) { const yy = 112 - ((t * 14 + k * 14) % 90), r0 = 6 + ((t * 14 + k * 14) % 90) / 7; circle(vx + Math.sin(t + k) * 8, yy, Math.round(r0), 'rgba(70,40,35,0.55)'); }
  for (let i = 0; i < 4; i++) { const ix = ((i * 120 - camX * 0.2) % (W + 200) + W + 200) % (W + 200) - 100; R(ix, 200, 120, 40, T.far); R(ix + 20, 190, 70, 12, T.far); }
}
function circle(cx, cy, r, c) {
  g.fillStyle = c;
  for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); }
}
function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = ((pa >> 16) & 255) + ((((pb >> 16) & 255) - ((pa >> 16) & 255)) * k);
  const gg = ((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * k);
  const bl = (pa & 255) + (((pb & 255) - (pa & 255)) * k);
  return `rgb(${r | 0},${gg | 0},${bl | 0})`;
}
// plain ground strip for menu scenes and previews
function drawGround(theme, camX) {
  const C = TERRAIN_COLORS[theme] || TERRAIN_COLORS.forest;
  R(0, GROUND, W, 40, C.body); R(0, GROUND, W, 2, C.top);
  for (let wx = Math.floor(camX / 16) * 16; wx < camX + W + 16; wx += 16) { const h = (wx * 2654435761) >>> 0; R(wx - camX + (h % 13), GROUND + 6 + (h % 7) * 3, 2, 1, C.dark); }
}
