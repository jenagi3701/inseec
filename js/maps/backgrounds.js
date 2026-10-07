'use strict';
// ---------------------------------------------------------
// LEVEL THEMES & BACKGROUND
// ---------------------------------------------------------
const THEMES = {
  day: { sky: ['#4bb8f5', '#bdf0ff'], sea: '#2a8fd6', sea2: '#6cc6f5', sand: '#f1d08a', sand2: '#d9b56a', top: '#fff0b5', hills: '#3d9e5a', sun: '#fff27a', cloud: '#ffffff' },
  jungle: { sky: ['#5cc9b3', '#e6ffd0'], sea: '#2b9c8f', sea2: '#6fd6c4', sand: '#b98a4f', sand2: '#946a38', top: '#3fae4b', hills: '#226b33', sun: '#fffbcc', cloud: '#f0fff0' },
  sunset: { sky: ['#ff6f61', '#ffc278'], sea: '#7a4c93', sea2: '#c08ad6', sand: '#e0a96d', sand2: '#b9814d', top: '#ffd9a0', hills: '#6e3456', sun: '#ffde59', cloud: '#ffd1dc' },
  night: { sky: ['#081530', '#2a3f6e'], sea: '#122a52', sea2: '#3a5d9c', sand: '#8a7a5a', sand2: '#6b5d43', top: '#b0a37f', hills: '#0f2140', moon: '#f5f3ce', cloud: '#55658f' },
  storm: { sky: ['#232433', '#585b72'], sea: '#283044', sea2: '#5a6a8a', sand: '#7a4e2d', sand2: '#5c3a20', top: '#a0703f', hills: '#1b1d29', cloud: '#3a3c4f', rain: true, deck: true },
};

function drawBackground(theme, camX, t, worldW) {
  const T = THEMES[theme];
  // sky bands
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    g.fillStyle = mix(T.sky[0], T.sky[1], i / (bands - 1));
    g.fillRect(0, Math.floor(i * 175 / bands), W, Math.ceil(175 / bands) + 1);
  }
  if (T.moon) {
    for (let i = 0; i < 40; i++) { const sx = (i * 97) % W, sy = CAMY + (i * 53) % 70; if ((i + Math.floor(t * 2)) % 7) R(sx, sy, 1, 1, '#fff'); }
    circle(270 - camX * 0.02, CAMY + 26, 12, T.moon); circle(265 - camX * 0.02, CAMY + 22, 3, '#dcd9a8');
  } else if (T.sun) circle(260 - camX * 0.02, CAMY + 30, 15, T.sun);
  // clouds
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 140 - camX * 0.15 + t * 4) % (W + 120) + W + 120) % (W + 120) - 60, cy = CAMY + 8 + (i * 37) % 44;
    R(cx, cy, 40, 8, T.cloud); R(cx + 8, cy - 6, 22, 6, T.cloud); R(cx - 6, cy + 4, 52, 5, T.cloud);
  }
  // far islands
  for (let i = 0; i < 5; i++) {
    const ix = ((i * 230 - camX * 0.3) % (W + 300) + W + 300) % (W + 300) - 150;
    R(ix, 160, 90, 15, T.hills); R(ix + 15, 150, 60, 10, T.hills); R(ix + 30, 143, 25, 8, T.hills);
    R(ix + 60, 128, 2, 22, T.hills); R(ix + 53, 126, 16, 3, T.hills);
  }
  // sea
  R(0, 172, W, GROUND - 172, T.sea);
  for (let y = 176; y < GROUND; y += 8) {
    for (let x = -16; x < W + 16; x += 32) {
      const wx = x + ((Math.floor(t * 10) + y) % 32) - ((camX * 0.5) % 32);
      R(wx, y, 10, 1, T.sea2);
    }
  }
  // palms (mid layer)
  for (let px0 = 120; px0 < worldW; px0 += 340) {
    const sx = px0 - camX * 0.8;
    if (sx < -40 || sx > W + 40) continue;
    palm(sx, GROUND, T);
  }
}
function palm(x, base, T) {
  const trunk = T.deck ? '#3b2b20' : '#8b5a2b';
  if (T.deck) { // ship masts on stormy level
    R(x, base - 110, 4, 110, trunk); R(x - 30, base - 95, 64, 3, trunk); R(x - 26, base - 92, 56, 34, '#c9c2b0'); R(x - 4, base - 120, 14, 8, '#111'); R(x - 1, base - 118, 4, 2, '#fff');
    return;
  }
  for (let i = 0; i < 10; i++) R(x + Math.round(Math.sin(i * 0.3) * 3), base - 8 - i * 6, 4, 7, i % 2 ? trunk : '#6b4423');
  const top = base - 68, lc = T === THEMES.night ? '#1d4a2a' : '#2f9e44';
  R(x - 16, top, 36, 4, lc); R(x - 22, top + 4, 10, 3, lc); R(x + 16, top + 4, 10, 3, lc); R(x - 6, top - 6, 16, 6, lc); R(x - 26, top + 7, 6, 3, lc); R(x + 24, top + 7, 6, 3, lc);
  R(x, top + 4, 3, 3, '#6b4423'); R(x + 3, top + 5, 3, 3, '#6b4423');
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
function drawGround(theme, camX) {
  const T = THEMES[theme];
  R(0, GROUND, W, 80, T.sand);
  R(0, GROUND, W, 2, T.top);
  const start = Math.floor(camX / 16) * 16;
  for (let wx = start; wx < camX + W + 16; wx += 16) {
    const h = (wx * 2654435761) >>> 0;
    const sx = wx - camX;
    if (T.deck) { R(sx, GROUND + 2, 1, 80, T.sand2); R(sx + 8, GROUND + 14, 8, 1, T.sand2); continue; }
    R(sx + (h % 13), GROUND + 6 + (h % 7) * 3, 2, 1, T.sand2);
    R(sx + ((h >> 4) % 11), GROUND + 12 + ((h >> 8) % 5) * 4, 1, 1, T.sand2);
    if (theme === 'jungle' && h % 3 === 0) R(sx + 4, GROUND - 3, 2, 3, '#3fae4b');
  }
}
function drawPlatform(p, theme) {
  const T = THEMES[theme];
  const top = T.deck ? '#8a5a33' : theme === 'jungle' ? '#3fae4b' : '#a0682f';
  R(p.x, p.y, p.w, 6, '#7a4a22'); R(p.x, p.y, p.w, 2, top);
  for (let i = 8; i < p.w; i += 12) R(p.x + i, p.y + 2, 1, 4, '#5a3412');
  R(p.x + 4, p.y + 6, 2, 6, '#5a3412'); R(p.x + p.w - 6, p.y + 6, 2, 6, '#5a3412');
}
