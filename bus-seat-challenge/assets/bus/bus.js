/* =====================================================================
   BUS SEAT CHALLENGE — BUS INTERIOR, LAYOUTS & SCENERY
   Two layouts share the same *semantic* slots so a round can switch
   between them live (e.g. when a phone rotates):
     • wide  — landscape, 384 x 216 logical pixels, front of bus → right
     • tall  — portrait,  216 x 384 logical pixels, front of bus → top
   Every layout exposes 14 seats (ordered by distance to the door, so
   index 0–2 are the priority seats), 12 standing slots, one wheelchair
   space, a door, an entry point and an outside point.
   ===================================================================== */
(function () {
  'use strict';
  const S = window.BSC_SPRITES;
  const { Grid, shade, OUT } = S;

  const SEAT_W = 22, SEAT_H = 24;
  const PRIORITY_SEATS = 3;   // seats with index < 3 are priority seats

  /* ---------------- LAYOUTS ---------------- */
  function buildWide() {
    const L = { name: 'wide', W: 384, H: 216 };
    const A = [], B = [];
    for (let i = 0; i < 7; i++) { A.push({ x: 10 + 30 * i, y: 30 }); B.push({ x: 10 + 30 * i, y: 176 }); }
    L.seats = [];
    for (let i = 6; i >= 0; i--) { L.seats.push(A[i]); L.seats.push(B[i]); }
    L.slots = [];
    [30, 78, 126, 174, 222, 270].forEach(x => L.slots.push({ x, y: 106 }));
    [54, 102, 150, 198, 246, 294].forEach(x => L.slots.push({ x, y: 146 }));
    // interleave lines so slot order spreads people out
    L.slots = [0, 6, 1, 7, 2, 8, 3, 9, 4, 10, 5, 11].map(i => L.slots[i]);
    L.wc = { x: 226, y: 36, w: 66, h: 40, px: 259, py: 72 };
    L.door = { x: 288, y: 200, w: 42, h: 16, vertical: false };
    L.entry = { x: 309, y: 184 };
    L.stage = { x: 314, y: 150 };   // where a PLACE-round passenger waits
    L.outside = { x: 309, y: 240 };
    L.poles = [{ x: 66, y: 66, h: 66 }, { x: 126, y: 66, h: 66 }, { x: 186, y: 66, h: 66 }, { x: 333, y: 196, h: 160 }];
    L.windows = [[6, 5, 70, 20], [110, 5, 70, 20], [216, 5, 70, 20], [298, 5, 32, 20], [378, 34, 6, 160]];
    L.ads = [[80, 6, 26, 18], [184, 6, 28, 18]];
    L.driver = { x: 356, y: 118 };
    L.cabin = { x: 336, y: 34, w: 48, h: 166 };
    L.pigeonPath = [{ x: 40, y: 168 }, { x: 330, y: 168 }];
    return L;
  }

  function buildTall() {
    const L = { name: 'tall', W: 216, H: 384 };
    const Lc = [], Rc = [];
    for (let i = 0; i < 7; i++) { Lc.push({ x: 8, y: 112 + 38 * i }); Rc.push({ x: 186, y: 100 + 38 * i }); }
    L.seats = [];
    for (let i = 0; i < 7; i++) { L.seats.push(Rc[i]); L.seats.push(Lc[i]); }
    const rows = [140, 192, 244, 296];
    const raw = [];
    rows.forEach((y, r) => [62, 108, 154].forEach(x => raw.push({ x: x + (r % 2 ? 8 : -4), y })));
    L.slots = [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11].map(i => raw[i]);
    L.wc = { x: 8, y: 50, w: 50, h: 54, px: 33, py: 100 };
    L.door = { x: 206, y: 28, w: 10, h: 54, vertical: true };
    L.entry = { x: 186, y: 76 };
    L.stage = { x: 150, y: 96 };
    L.outside = { x: 240, y: 76 };
    L.poles = [{ x: 38, y: 150, h: 40 }, { x: 178, y: 196, h: 40 }, { x: 38, y: 254, h: 40 }, { x: 178, y: 300, h: 40 }];
    L.windows = [[0, 110, 6, 262], [210, 96, 6, 276], [10, 2, 196, 12]];
    L.ads = [[72, 18, 30, 14], [120, 18, 30, 14]];
    L.driver = { x: 30, y: 42 };
    L.cabin = { x: 8, y: 16, w: 46, h: 30 };
    L.pigeonPath = [{ x: 60, y: 340 }, { x: 160, y: 340 }];
    return L;
  }

  const layouts = { wide: buildWide(), tall: buildTall() };
  for (const L of Object.values(layouts)) {
    L.seatAnchor = i => ({ x: L.seats[i].x + 11, y: L.seats[i].y + 22 });
  }

  /* ---------------- THEMES (sky by time of day) ---------------- */
  const THEMES = {
    morning: { skyTop: '#9fd6ff', skyBot: '#ffe2b8', far: '#c7b2dc', near: '#8a78b5', tree: '#58b86e', sun: '#fff1a8', lights: false },
    day:     { skyTop: '#6ec3ff', skyBot: '#c9ecff', far: '#9ab6d8', near: '#5f7fae', tree: '#3fa65c', sun: '#ffffff', lights: false },
    sunset:  { skyTop: '#ff7e6b', skyBot: '#ffd17a', far: '#b06090', near: '#6b3c6e', tree: '#4a3a5a', sun: '#ffe58a', lights: true },
    night:   { skyTop: '#121637', skyBot: '#2e2b63', far: '#2b2f5c', near: '#1b1d3a', tree: '#151a2c', sun: '#e8ecff', lights: true }
  };

  /* ---------------- SEAT SPRITES ---------------- */
  const seatCache = {};
  function seatSprite(type, hc) {
    const key = type + (hc ? 'h' : '');
    if (seatCache[key]) return seatCache[key];
    const g = new Grid(SEAT_W, SEAT_H);
    const fab = type === 'priority' ? (hc ? '#ffb000' : '#f0a23a') : (hc ? '#2a62d8' : '#3f7fd6');
    g.rect(2, 0, 18, 12, fab);
    g.rect(3, 1, 16, 1, shade(fab, 0.3));
    if (type === 'priority') {
      // stripes + pictogram (person with cane) → readable without colour
      for (let y = 3; y < 12; y += 3) g.rect(2, y, 18, 1, shade(fab, -0.18));
      g.stamp(7, 2, [
        '..##...',
        '..##...',
        '.####..',
        '#.##.#.',
        '..##..#',
        '..##..#',
        '.#..#.#',
        '.#..#.#'
      ], { '#': '#ffffff' });
    } else {
      for (let y = 3; y < 11; y += 3) for (let x = 4 + (y % 2); x < 19; x += 3) g.set(x, y, shade(fab, -0.2));
    }
    g.rect(1, 12, 20, 5, shade(fab, -0.12));
    g.rect(1, 16, 20, 1, shade(fab, -0.32));
    g.rect(4, 17, 2, 5, '#8d94a6'); g.rect(16, 17, 2, 5, '#8d94a6');
    g.rect(3, 22, 4, 1, '#5a6072'); g.rect(15, 22, 4, 1, '#5a6072');
    const cv = g.outline(hc ? '#000000' : OUT).toCanvas();
    return (seatCache[key] = cv);
  }

  const WC_ICON = [
    '...##......',
    '...##......',
    '...........',
    '...#.......',
    '...#####...',
    '...#.......',
    '.#.######..',
    '#..#....#..',
    '#..#....##.',
    '#.......#..',
    '.#..#......',
    '..##.......'
  ];
  let wcIconCv = null;
  function wcIcon() {
    if (wcIconCv) return wcIconCv;
    const g = new Grid(11, 12);
    g.stamp(0, 0, WC_ICON, { '#': '#ffffff' });
    return (wcIconCv = g.toCanvas());
  }

  /* ---------------- BUS SHELL (cached, windows transparent) ---------------- */
  const shellCache = {};
  function shell(L, hc) {
    const key = L.name + (hc ? 'h' : '');
    if (shellCache[key]) return shellCache[key];
    const cv = document.createElement('canvas');
    cv.width = L.W; cv.height = L.H;
    const c = cv.getContext('2d');
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

    const floorA = hc ? '#30333f' : '#5b6378', floorB = hc ? '#2a2d38' : '#545b6f';
    // floor tiles
    for (let y = 0; y < L.H; y += 8) for (let x = 0; x < L.W; x += 8) R(x, y, 8, 8, ((x + y) / 8) % 2 ? floorA : floorB);

    if (L.name === 'wide') {
      // aisle strip
      R(0, 82, 336, 84, hc ? '#24262f' : '#4b5266');
      R(0, 82, 336, 1, '#f2c94c'); R(0, 165, 336, 1, '#f2c94c');
      // top wall
      R(0, 0, L.W, 34, hc ? '#c9ccd6' : '#e7e0cd');
      R(0, 26, L.W, 4, hc ? '#8a8fa0' : '#c9bfa5');
      R(0, 30, L.W, 4, hc ? '#5a5f70' : '#a99d82');
      // bottom wall
      R(0, 204, L.W, 12, hc ? '#5a5f70' : '#8e8470');
      R(0, 202, L.W, 2, '#f2c94c');
      // driver cabin
      R(334, 34, 2, 166, hc ? '#ffffff' : '#b9e3ff');
      R(336, 34, 48, 166, hc ? '#3a3d48' : '#6e7690');
      R(366, 60, 10, 110, '#2b2f3a');                 // dashboard
      R(368, 64, 6, 10, '#7fe8ff'); R(368, 80, 6, 4, '#ff6b6b'); R(368, 88, 6, 4, '#7dff9a');
      // door gap
      R(L.door.x, 202, L.door.w, 14, '#1b1325');
      R(L.door.x - 2, 196, L.door.w + 4, 6, '#f2c94c');
      for (let x = L.door.x; x < L.door.x + L.door.w; x += 6) R(x, 197, 3, 4, '#1b1325');
    } else {
      R(36, 0, 144, L.H, hc ? '#24262f' : '#4b5266');
      R(36, 0, 1, L.H, '#f2c94c'); R(179, 0, 1, L.H, '#f2c94c');
      R(0, 0, 8, L.H, hc ? '#c9ccd6' : '#e7e0cd');
      R(208, 0, 8, L.H, hc ? '#c9ccd6' : '#e7e0cd');
      R(0, 0, L.W, 16, hc ? '#c9ccd6' : '#e7e0cd');
      R(0, 374, L.W, 10, hc ? '#5a5f70' : '#8e8470');
      R(8, 46, 46, 2, hc ? '#ffffff' : '#b9e3ff');
      R(8, 16, 46, 30, hc ? '#3a3d48' : '#6e7690');
      R(14, 18, 30, 6, '#2b2f3a');
      R(L.door.x, L.door.y, 10, L.door.h, '#1b1325');
      R(200, L.door.y - 2, 6, L.door.h + 4, '#f2c94c');
      for (let y = L.door.y; y < L.door.y + L.door.h; y += 6) R(201, y, 4, 3, '#1b1325');
    }
    // wheelchair space marking
    const w = L.wc;
    R(w.x, w.y, w.w, w.h, hc ? '#0b3d91' : '#2f63b8');
    c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.setLineDash([3, 2]);
    c.strokeRect(w.x + 1.5, w.y + 1.5, w.w - 3, w.h - 3); c.setLineDash([]);
    c.drawImage(wcIcon(), Math.round(w.x + w.w / 2 - 6), Math.round(w.y + 4));
    if (L.name === 'wide') { R(w.x + 4, w.y - 4, w.w - 8, 3, '#8d94a6'); }

    // windows: frames, then cut holes
    for (const [x, y, ww, hh] of L.windows) {
      R(x - 1, y - 1, ww + 2, hh + 2, hc ? '#000000' : '#5f6b80');
    }
    for (const [x, y, ww, hh] of L.windows) c.clearRect(x, y, ww, hh);
    shellCache[key] = cv;
    return cv;
  }

  /* ---------------- SCENERY behind the windows ---------------- */
  function h32(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; }

  function drawScenery(c, L, themeName, offset, hc) {
    const T = THEMES[themeName] || THEMES.day;
    for (const [x, y, w, h] of L.windows) {
      c.save();
      c.beginPath(); c.rect(x, y, w, h); c.clip();
      const vertical = h > w * 2;
      // sky
      const grad = c.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, hc ? '#000000' : T.skyTop); grad.addColorStop(1, hc ? '#222222' : T.skyBot);
      c.fillStyle = grad; c.fillRect(x, y, w, h);
      if (!vertical) {
        if (themeName !== 'day') { c.fillStyle = T.sun; c.fillRect(Math.round(x + w * 0.7 - (offset * 0.02) % 20), y + 3, 5, 5); }
        // far buildings
        const fo = Math.floor(offset * 0.25);
        for (let i = Math.floor((x + fo) / 10) - 1; i < Math.floor((x + w + fo) / 10) + 1; i++) {
          const hh = 6 + (h32(i) % 9);
          c.fillStyle = hc ? '#444' : T.far; c.fillRect(i * 10 - fo, y + h - hh, 9, hh);
          if (T.lights && h32(i * 7) % 3 === 0) { c.fillStyle = '#ffd86b'; c.fillRect(i * 10 - fo + 3, y + h - hh + 3, 2, 2); }
        }
        // near buildings / trees / lamps
        const no = Math.floor(offset);
        for (let i = Math.floor((x + no) / 26) - 1; i < Math.floor((x + w + no) / 26) + 1; i++) {
          const kind = h32(i * 13) % 4, bx = i * 26 - no;
          c.fillStyle = hc ? '#666' : T.near;
          if (kind === 0) { c.fillRect(bx, y + h - 13, 18, 13); if (T.lights) { c.fillStyle = '#ffd86b'; c.fillRect(bx + 3, y + h - 10, 3, 2); c.fillRect(bx + 11, y + h - 6, 3, 2); } }
          else if (kind === 1) { c.fillStyle = hc ? '#777' : T.tree; c.fillRect(bx + 4, y + h - 12, 9, 7); c.fillStyle = '#5a3a26'; c.fillRect(bx + 7, y + h - 5, 3, 5); }
          else if (kind === 2) { c.fillStyle = '#3a3f4e'; c.fillRect(bx + 8, y + h - 16, 1, 16); c.fillStyle = T.lights ? '#ffe58a' : '#c0c6d4'; c.fillRect(bx + 6, y + h - 17, 4, 2); }
        }
      } else {
        // side windows (portrait): objects slide downward
        const vo = Math.floor(offset);
        for (let i = Math.floor((y - vo) / 22) - 1; i < Math.floor((y + h - vo) / 22) + 2; i++) {
          const kind = h32(i * 11) % 3, by = i * 22 + vo;
          c.fillStyle = kind === 0 ? (hc ? '#666' : T.near) : kind === 1 ? (hc ? '#777' : T.tree) : (hc ? '#555' : T.far);
          c.fillRect(x, by, w, kind === 2 ? 6 : 12);
          if (T.lights && kind === 0) { c.fillStyle = '#ffd86b'; c.fillRect(x + 1, by + 4, 2, 2); }
        }
      }
      c.restore();
    }
  }

  /* ---------------- small props ---------------- */
  function drawPole(c, p, hc) {
    c.fillStyle = hc ? '#ffffff' : '#f2c94c';
    c.fillRect(p.x - 1, p.y - p.h, 2, p.h);
    c.fillStyle = hc ? '#000000' : '#b8902a';
    c.fillRect(p.x, p.y - p.h, 1, p.h);
    c.fillRect(p.x - 2, p.y - 1, 4, 2);
  }

  const AD_TEXT = ['EAT', 'SALE', 'NEW!', 'WOW', 'BUY', '50%'];
  function drawAds(c, L, t, flicker, hc) {
    L.ads.forEach(([x, y, w, h], i) => {
      const on = !flicker || Math.floor(t * 4 + i) % 2 === 0;
      c.fillStyle = hc ? '#000' : '#2b2f3a'; c.fillRect(x, y, w, h);
      c.fillStyle = hc ? '#fff' : (on ? ['#ff4f6d', '#5ad1ff'][i % 2] : '#ffd23f');
      c.fillRect(x + 1, y + 1, w - 2, h - 2);
      c.fillStyle = '#1b1325';
      c.font = '5px "Press Start 2P", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(AD_TEXT[(i * 2 + (flicker ? Math.floor(t * 1.5) : 0)) % AD_TEXT.length], x + w / 2, y + h / 2 + 0.5);
    });
  }

  function drawDoor(c, L, open, hc) {
    const d = L.door;
    const glass = hc ? '#ffffff' : '#9fd6ff', frame = hc ? '#000000' : '#3a3f4e';
    if (!d.vertical) {
      const half = d.w / 2, slide = Math.round(half * open * 0.85);
      c.fillStyle = frame; c.fillRect(d.x - slide, d.y, half, 16); c.fillRect(d.x + half + slide, d.y, half, 16);
      c.fillStyle = glass; c.fillRect(d.x - slide + 2, d.y + 3, half - 4, 8); c.fillRect(d.x + half + slide + 2, d.y + 3, half - 4, 8);
    } else {
      const half = d.h / 2, slide = Math.round(half * open * 0.85);
      c.fillStyle = frame; c.fillRect(d.x, d.y - slide, 10, half); c.fillRect(d.x, d.y + half + slide, 10, half);
      c.fillStyle = glass; c.fillRect(d.x + 3, d.y - slide + 3, 4, half - 6); c.fillRect(d.x + 3, d.y + half + slide + 3, 4, half - 6);
    }
  }

  /* ---------------- bus exterior (menu / map / icon) ---------------- */
  let exteriorCv = null;
  function busExterior() {
    if (exteriorCv) return exteriorCv;
    const g = new Grid(66, 34);
    g.rect(2, 3, 62, 24, '#ffc93c');
    g.rect(2, 3, 62, 2, '#ffe08a');
    g.rect(3, 6, 26, 3, '#1b1325'); g.rect(4, 7, 12, 1, '#ff9a3c');       // destination sign
    for (let i = 0; i < 5; i++) g.rect(4 + i * 9, 10, 8, 7, '#8fd3ff');
    for (let i = 0; i < 5; i++) g.rect(5 + i * 9, 11, 2, 1, '#e6f6ff');
    // tiny heads in windows
    [['#f7d7bf', '#2a1c14'], ['#94603d', '#1d1f3b'], ['#eab48c', '#d8a03c'], ['#c98b5e', '#d9d9e3']].forEach(([s, h], i) => {
      g.rect(6 + i * 9 + (i % 2) * 2, 13, 3, 3, s); g.rect(6 + i * 9 + (i % 2) * 2, 12, 3, 1, h);
    });
    g.rect(49, 9, 8, 16, '#3a3f4e'); g.rect(50, 10, 3, 14, '#8fd3ff'); g.rect(54, 10, 2, 14, '#8fd3ff');
    g.rect(58, 9, 5, 8, '#8fd3ff');                                         // windshield
    g.rect(2, 19, 46, 2, '#e4574b');
    g.rect(62, 20, 2, 3, '#fff6a8');                                        // headlight
    g.rect(1, 25, 64, 2, '#5a6072');
    const wheel = (cx) => {
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
        const d = Math.sqrt(x * x + y * y);
        if (d <= 4.3) g.set(cx + x, 28 + y, d < 1.6 ? '#c0c6d4' : '#2a2f3d');
      }
    };
    wheel(14); wheel(52);
    return (exteriorCv = g.outline(OUT).toCanvas());
  }

  window.BSC_BUS = {
    layouts, THEMES, SEAT_W, SEAT_H, PRIORITY_SEATS,
    seatSprite, wcIcon, shell, drawScenery, drawPole, drawAds, drawDoor, busExterior
  };
})();
