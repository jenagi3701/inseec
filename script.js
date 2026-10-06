/* =========================================================
   EGG ME — a cozy pixel-art egg timer
   Vanilla JS, no dependencies.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. TRANSLATIONS
     All user-facing text lives here.
     --------------------------------------------------------- */
  const translations = {
    en: {
      appName: 'EGG ME',
      skipToContent: 'Skip to content',
      languageLabel: 'Language',
      pickLegend: 'Choose how cooked you want your egg',
      levels: {
        soft:       { name: 'SOFT',        desc: 'Very runny yolk' },
        mediumSoft: { name: 'MEDIUM SOFT', desc: 'Soft, creamy yolk' },
        medium:     { name: 'MEDIUM',      desc: 'Set yolk, soft center' },
        mediumHard: { name: 'MEDIUM HARD', desc: 'Mostly firm yolk' },
        hard:       { name: 'HARD',        desc: 'Fully firm yolk' }
      },
      minutes: (n) => (n === 1 ? '1 minute' : n + ' minutes'),
      startCooking: 'START COOKING',
      pickFirst: 'Pick an egg first!',
      selected: (name, time) => name + ' selected, ' + time,
      cooking: 'YOUR EGG IS COOKING…',
      almostReady: 'ALMOST READY…',
      paused: 'PAUSED',
      pause: 'PAUSE',
      resume: 'RESUME',
      restart: 'RESTART',
      cancel: 'CANCEL',
      ready: 'YOUR EGG IS READY!',
      readyTitle: 'READY! · EGG ME',
      cookAnother: 'COOK ANOTHER EGG',
      playSound: 'PLAY ALARM',
      eggTip: 'EGG TIP',
      eggTipText: 'Cooking times are approximate and may vary depending on the egg and cooking conditions.',
      doneTip: 'Plunge it into cold water to stop the cooking.',
      progressLabel: 'Cooking progress',
      timeLeft: (t) => t + ' left',
      announceStart: (name, time) => 'Cooking started: ' + name + ', ' + time + '.',
      announcePause: 'Timer paused.',
      announceResume: 'Timer resumed.',
      announceRestart: 'Timer restarted.',
      announceCancel: 'Timer cancelled.',
      announceOneMinute: 'One minute left.',
      soundBlocked: 'Sound is blocked by your browser. Use the alarm button to play it.'
    },
    fr: {
      appName: 'EGG ME',
      skipToContent: 'Aller au contenu',
      languageLabel: 'Langue',
      pickLegend: 'Choisissez la cuisson de votre œuf',
      levels: {
        soft:       { name: 'ŒUF COULANT',     desc: 'Jaune bien coulant' },
        mediumSoft: { name: 'ŒUF MOLLET',      desc: 'Jaune tendre et crémeux' },
        medium:     { name: 'ŒUF À POINT',     desc: 'Jaune pris, cœur fondant' },
        mediumHard: { name: 'ŒUF PRESQUE DUR', desc: 'Jaune presque ferme' },
        hard:       { name: 'ŒUF DUR',         desc: 'Jaune entièrement ferme' }
      },
      minutes: (n) => (n === 1 ? '1 minute' : n + ' minutes'),
      startCooking: 'COMMENCER LA CUISSON',
      pickFirst: 'Choisissez d’abord un œuf !',
      selected: (name, time) => name + ' sélectionné, ' + time,
      cooking: 'VOTRE ŒUF CUIT…',
      almostReady: 'PRESQUE PRÊT…',
      paused: 'EN PAUSE',
      pause: 'PAUSE',
      resume: 'REPRENDRE',
      restart: 'RECOMMENCER',
      cancel: 'ANNULER',
      ready: 'VOTRE ŒUF EST PRÊT !',
      readyTitle: 'PRÊT ! · EGG ME',
      cookAnother: 'CUIRE UN AUTRE ŒUF',
      playSound: 'JOUER L’ALARME',
      eggTip: 'ASTUCE ŒUF',
      eggTipText: 'Les temps de cuisson sont indicatifs et peuvent varier selon l’œuf et les conditions de cuisson.',
      doneTip: 'Plongez-le dans l’eau froide pour stopper la cuisson.',
      progressLabel: 'Progression de la cuisson',
      timeLeft: (t) => 'Encore ' + t,
      announceStart: (name, time) => 'Cuisson lancée : ' + name + ', ' + time + '.',
      announcePause: 'Minuteur en pause.',
      announceResume: 'Minuteur relancé.',
      announceRestart: 'Minuteur recommencé.',
      announceCancel: 'Minuteur annulé.',
      announceOneMinute: 'Plus qu’une minute.',
      soundBlocked: 'Le son est bloqué par votre navigateur. Utilisez le bouton d’alarme pour l’écouter.'
    }
  };

  /* ---------------------------------------------------------
     2. COOKING LEVELS
     `doneness` drives the yolk illustration (0 = raw, 1 = hard).
     --------------------------------------------------------- */
  const LEVELS = [
    { id: 'soft',       seconds: 5 * 60,  doneness: 0.06 },
    { id: 'mediumSoft', seconds: 6 * 60,  doneness: 0.30 },
    { id: 'medium',     seconds: 7 * 60,  doneness: 0.55 },
    { id: 'mediumHard', seconds: 8 * 60,  doneness: 0.78 },
    { id: 'hard',       seconds: 10 * 60, doneness: 1.00 }
  ];
  const levelById = (id) => LEVELS.find((l) => l.id === id) || null;

  /* ---------------------------------------------------------
     3. PIXEL CANVAS → SVG
     A tiny helper that collects coloured pixels and outputs a
     crisp SVG (horizontal runs are merged into single rects).
     --------------------------------------------------------- */
  class PixelCanvas {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.px = new Array(w * h).fill(null);
    }
    inBounds(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    set(x, y, c) { if (this.inBounds(x, y)) this.px[y * this.w + x] = c; }
    get(x, y) { return this.inBounds(x, y) ? this.px[y * this.w + x] : null; }
    rect(x, y, w, h, c) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    }
    toSVG(className) {
      let body = '';
      for (let y = 0; y < this.h; y++) {
        let x = 0;
        while (x < this.w) {
          const c = this.px[y * this.w + x];
          if (!c) { x++; continue; }
          let run = 1;
          while (x + run < this.w && this.px[y * this.w + x + run] === c) run++;
          body += '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + c + '"/>';
          x += run;
        }
      }
      return '<svg class="' + (className || '') + '" viewBox="0 0 ' + this.w + ' ' + this.h +
        '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + body + '</svg>';
    }
  }

  // Build a pixel SVG from rows of characters and a palette.
  function spriteSVG(rows, palette, className) {
    const h = rows.length;
    const w = Math.max.apply(null, rows.map((r) => r.length));
    const pc = new PixelCanvas(w, h);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = palette[row[x]];
        if (c) pc.set(x, y, c);
      }
    });
    return pc.toSVG(className);
  }

  /* ---------------------------------------------------------
     4. EGG ILLUSTRATION
     A cross-section of a boiled egg drawn on a 26×32 grid.
     --------------------------------------------------------- */
  const C = {
    outline: '#3d2817',
    white: '#fff9ee',
    whiteHi: '#ffffff',
    whiteShade: '#efdfc2',
    runny: '#ff9a14',
    runnyEdge: '#e2700a',
    jammy: '#f79a1e',
    shine: '#ffe9b0',
    cream: '#fdbb3f',
    set: '#ffd45e',
    setEdge: '#ebb53c',
    hard: '#fbe08f',
    hardCrumb: '#f2cc68',
    hardEdge: '#e6c062',
    blush: '#f6a2a2',
    sweat: '#8fd3f4',
    lens: '#241a12',
    glint: '#ffffff'
  };

  const EGG_W = 26;
  const EGG_H = 32;
  const EGG_CX = 13;
  const EGG_CY = 17;
  const EGG_A = 11.5;
  const EGG_B = 15;
  const YOLK_CY = 18.5;
  const YOLK_R = 6.6;

  function insideEggShape(x, y) {
    const px = x + 0.5;
    const py = y + 0.5;
    const t = (py - EGG_CY) / EGG_B;
    if (t < -1 || t > 1) return false;
    const f = 1 + 0.16 * t; // wider at the bottom
    const dx = (px - EGG_CX) / (EGG_A * f);
    return dx * dx + t * t <= 1;
  }

  // Small deterministic hash for "crumbly" textures.
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

  const FACES = {
    // [x, y, colourKey]
    neutral: [
      [9, 6, 'outline'], [9, 7, 'outline'], [16, 6, 'outline'], [16, 7, 'outline'],
      [12, 9, 'outline'], [13, 9, 'outline']
    ],
    happy: [
      [8, 7, 'outline'], [9, 6, 'outline'], [10, 7, 'outline'],
      [15, 7, 'outline'], [16, 6, 'outline'], [17, 7, 'outline'],
      [11, 9, 'outline'], [12, 10, 'outline'], [13, 10, 'outline'], [14, 9, 'outline'],
      [7, 9, 'blush'], [18, 9, 'blush']
    ],
    relaxed: [
      [8, 6, 'outline'], [9, 7, 'outline'], [10, 6, 'outline'],
      [15, 6, 'outline'], [16, 7, 'outline'], [17, 6, 'outline'],
      [11, 9, 'outline'], [12, 10, 'outline'], [13, 10, 'outline'], [14, 9, 'outline'],
      [7, 8, 'blush'], [18, 8, 'blush']
    ],
    flustered: [
      [8, 6, 'glint'], [9, 6, 'outline'], [8, 7, 'outline'], [9, 7, 'outline'],
      [16, 6, 'glint'], [17, 6, 'outline'], [16, 7, 'outline'], [17, 7, 'outline'],
      [12, 9, 'outline'], [13, 9, 'outline'], [12, 10, 'outline'], [13, 10, 'outline'],
      [6, 9, 'blush'], [7, 9, 'blush'], [18, 9, 'blush'], [19, 9, 'blush'],
      [19, 4, 'sweat'], [19, 5, 'sweat'], [18, 5, 'sweat']
    ],
    cool: (function () {
      const p = [];
      for (let x = 7; x <= 18; x++) p.push([x, 6, 'lens']);
      for (let x = 7; x <= 11; x++) p.push([x, 7, 'lens']);
      for (let x = 14; x <= 18; x++) p.push([x, 7, 'lens']);
      for (let x = 8; x <= 10; x++) p.push([x, 8, 'lens']);
      for (let x = 15; x <= 17; x++) p.push([x, 8, 'lens']);
      p.push([8, 7, 'glint'], [15, 7, 'glint']);
      p.push([11, 10, 'outline'], [12, 10, 'outline'], [13, 10, 'outline'], [14, 9, 'outline']);
      return p;
    })()
  };

  /**
   * Render an egg cross-section.
   * @param {number} doneness 0 (raw) … 1 (hard)
   * @param {string|null} face key of FACES or null
   */
  function eggSVG(doneness, face, className) {
    const d = Math.max(0, Math.min(1, doneness));
    const pc = new PixelCanvas(EGG_W, EGG_H);

    // --- White + outline ---
    for (let y = 0; y < EGG_H; y++) {
      for (let x = 0; x < EGG_W; x++) {
        if (!insideEggShape(x, y)) continue;
        const edge = !insideEggShape(x - 1, y) || !insideEggShape(x + 1, y) ||
                     !insideEggShape(x, y - 1) || !insideEggShape(x, y + 1);
        pc.set(x, y, edge ? C.outline : C.white);
      }
    }
    // Soft shading next to the outline (shadow bottom-right, light top-left)
    for (let y = 0; y < EGG_H; y++) {
      for (let x = 0; x < EGG_W; x++) {
        if (pc.get(x, y) !== C.white) continue;
        const nearEdge = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([i, j]) => pc.get(x + i, y + j) === C.outline);
        if (!nearEdge) continue;
        const dx = x + 0.5 - EGG_CX;
        const dy = y + 0.5 - EGG_CY;
        if (dx * 0.7 + dy > 6) pc.set(x, y, C.whiteShade);
        else if (dx + dy * 0.8 < -9) pc.set(x, y, C.whiteHi);
      }
    }
    const isWhite = (x, y) => {
      const c = pc.get(x, y);
      return c === C.white || c === C.whiteShade || c === C.whiteHi;
    };

    // --- Yolk parameters derived from doneness ---
    let liquidFrac = 1 - d;
    if (liquidFrac > 0.9) liquidFrac = 1;
    if (d >= 0.95) liquidFrac = 0;
    const liquidR = YOLK_R * liquidFrac;
    const runny = d < 0.2;
    const liquidColor = runny ? C.runny : C.jammy;
    const isHard = d >= 0.92;
    const setColor = isHard ? C.hard : C.set;
    const setEdge = isHard ? C.hardEdge : C.setEdge;
    const drip = Math.max(0, Math.min(1, (0.2 - d) / 0.2)); // runny yolk flows out

    const yolk = new Set();
    const key = (x, y) => x + ',' + y;
    const addCircle = (cx, cy, r) => {
      for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
        for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          if (dx * dx + dy * dy <= r * r && isWhite(x, y)) yolk.add(key(x, y));
        }
      }
    };
    addCircle(EGG_CX, YOLK_CY, YOLK_R);

    // Runny drips spilling over the white
    const dripCells = new Set();
    if (drip > 0) {
      const before = new Set(yolk);
      addCircle(EGG_CX + 2, YOLK_CY + YOLK_R - 0.4, 1.6 + 1.2 * drip);
      addCircle(EGG_CX + 2.5, YOLK_CY + YOLK_R + 1.2 + 0.8 * drip, 1.0 + 0.5 * drip);
      if (drip > 0.35) addCircle(EGG_CX - 2.5, YOLK_CY + YOLK_R + 0.6 + 1.6 * drip, 0.95);
      yolk.forEach((k) => { if (!before.has(k)) dripCells.add(k); });
    }

    // Paint yolk
    yolk.forEach((k) => {
      const [x, y] = k.split(',').map(Number);
      const dx = x + 0.5 - EGG_CX;
      const dy = y + 0.5 - YOLK_CY;
      const r = Math.sqrt(dx * dx + dy * dy);
      const edge = !yolk.has(key(x - 1, y)) || !yolk.has(key(x + 1, y)) ||
                   !yolk.has(key(x, y - 1)) || !yolk.has(key(x, y + 1));
      let c;
      if (dripCells.has(k) || r <= liquidR) {
        c = liquidFrac >= 1 && edge ? C.runnyEdge : liquidColor;
      } else if (liquidR > 0 && r <= liquidR + 1.15) {
        c = C.cream; // creamy band between liquid and set yolk
      } else {
        c = edge ? setEdge : setColor;
        if (isHard && !edge && hash(x, y) % 5 === 0) c = C.hardCrumb;
      }
      pc.set(x, y, c);
    });

    // Glossy shine on liquid yolk
    if (liquidR >= 2.4) {
      const sx = Math.round(EGG_CX - 0.5 - liquidR * 0.5);
      const sy = Math.round(YOLK_CY - 0.5 - liquidR * 0.5);
      pc.set(sx, sy, C.shine);
      pc.set(sx + 1, sy, C.shine);
      pc.set(sx, sy + 1, C.shine);
    } else if (liquidR > 0.6) {
      pc.set(Math.round(EGG_CX - 1), Math.round(YOLK_CY - 1), C.shine);
    }

    // Face
    if (face && FACES[face]) {
      FACES[face].forEach(([x, y, ck]) => {
        if (isWhite(x, y) || ck === 'lens' || ck === 'glint') {
          if (pc.get(x, y) && pc.get(x, y) !== C.outline) pc.set(x, y, C[ck]);
        }
      });
    }

    return pc.toSVG(className || 'egg-svg');
  }

  /* ---------------------------------------------------------
     5. POT, FLAMES, PLATE & ICON SPRITES
     --------------------------------------------------------- */
  const POT = {
    outline: '#3d2817',
    body: '#5c8d89',
    hi: '#8db9b2',
    rim: '#9cc5be',
    rimLow: '#7fafa8',
    shade: '#456e6b',
    inner: '#2f4a48',
    water: '#7cc6e6',
    waterHi: '#c4ebf7'
  };

  function potBackSVG() {
    const pc = new PixelCanvas(44, 2);
    pc.rect(3, 0, 38, 1, POT.outline);
    pc.rect(3, 1, 38, 1, POT.inner);
    pc.set(2, 1, POT.outline);
    pc.set(41, 1, POT.outline);
    return pc.toSVG('pot-back-svg');
  }

  function potFrontSVG() {
    const pc = new PixelCanvas(44, 21);
    // water
    pc.rect(2, 0, 40, 2, POT.water);
    pc.set(2, 0, POT.outline); pc.set(41, 0, POT.outline);
    pc.set(2, 1, POT.outline); pc.set(41, 1, POT.outline);
    // front rim
    pc.rect(1, 2, 42, 1, POT.outline);
    pc.rect(1, 3, 42, 1, POT.rim);
    pc.rect(1, 4, 42, 1, POT.rimLow);
    pc.set(0, 3, POT.outline); pc.set(43, 3, POT.outline);
    pc.set(0, 4, POT.outline); pc.set(43, 4, POT.outline);
    pc.rect(1, 5, 42, 1, POT.outline);
    // body
    for (let y = 6; y <= 19; y++) {
      const inset = y >= 19 ? 3 : y >= 18 ? 2 : y >= 17 ? 1 : 0;
      const l = 3 + inset;
      const r = 40 - inset;
      pc.rect(l, y, r - l + 1, 1, POT.body);
      pc.set(l - 1, y, POT.outline);
      pc.set(r + 1, y, POT.outline);
      if (y >= 7 && y <= 15) { pc.set(l + 2, y, POT.hi); pc.set(l + 3, y, POT.hi); }
      if (y >= 7) { pc.set(r, y, POT.shade); pc.set(r - 1, y, POT.shade); }
      if (y === 6) pc.rect(l, y, r - l + 1, 1, POT.shade);
      if (y >= 17) pc.rect(l, y, r - l + 1, 1, y === 19 ? POT.shade : pc.get(l + 4, y));
    }
    pc.rect(6, 20, 32, 1, POT.outline);
    pc.set(4, 19, POT.outline); pc.set(39, 19, POT.outline);
    // highlight sparkle on rim
    pc.set(6, 3, '#d8efea'); pc.set(7, 3, '#d8efea');
    // handles
    [[0, 1], [41, 1]].forEach(([hx]) => {
      pc.rect(hx, 7, 3, 1, POT.outline);
      pc.rect(hx, 10, 3, 1, POT.outline);
      pc.set(hx === 0 ? 0 : 42, 8, POT.outline);
      pc.set(hx === 0 ? 0 : 42, 9, POT.outline);
      pc.rect(hx === 0 ? 1 : 41, 8, 1, 2, POT.rim);
    });
    let svg = pc.toSVG('pot-front-svg');
    // animated water highlights (two frames)
    const frameA = [5, 11, 19, 27, 34];
    const frameB = [8, 15, 23, 30, 37];
    const hi = (xs, cls) => '<g class="' + cls + '">' +
      xs.map((x) => '<rect x="' + x + '" y="0" width="2" height="1" fill="' + POT.waterHi + '"/>').join('') + '</g>';
    svg = svg.replace('</svg>', hi(frameA, 'wave wave-a') + hi(frameB, 'wave wave-b') + '</svg>');
    return svg;
  }

  function flamesSVG() {
    const O = '#ff7a1a';
    const Y = '#ffc93c';
    const frame = (rowsByFlame, cls) => {
      const pc = new PixelCanvas(44, 5);
      [13, 21, 29].forEach((cx) => {
        rowsByFlame.forEach((row, y) => {
          for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '.') continue;
            pc.set(cx - 2 + i, y, ch === 'o' ? O : Y);
          }
        });
      });
      return pc;
    };
    const a = frame(['..o..', '.oyo.', '.oyo.', 'oyyyo'], 'a');
    const b = frame(['.o...', '..oo.', '.oyo.', 'oyyyo'], 'b');
    // burner bar
    const bar = new PixelCanvas(44, 5);
    bar.rect(9, 4, 26, 1, '#3d2817');
    const rects = (pc) => pc.toSVG('').replace(/^<svg[^>]*>|<\/svg>$/g, '');
    return '<svg class="flames-svg" viewBox="0 0 44 5" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' +
      '<g class="flame flame-a">' + rects(a) + '</g>' +
      '<g class="flame flame-b">' + rects(b) + '</g>' +
      rects(bar) + '</svg>';
  }

  function plateSVG() {
    return spriteSVG([
      '....oooooooooooooooooooooooooooo....',
      '..ooppppppppppppppppppppppppppppoo..',
      '.opphhhhhhhhhhhhhhhhhhhhhhhhhhhhppo.',
      '.oppppppppppppppppppppppppppppppppo.',
      '..oossssssssssssssssssssssssssssoo..',
      '....oooooooooooooooooooooooooooo....'
    ], { o: '#3d2817', p: '#fffdf7', h: '#ffffff', s: '#e8d7b8' }, 'plate-svg');
  }

  const ICONS = {
    pause: ['.......', '.##.##.', '.##.##.', '.##.##.', '.##.##.', '.##.##.', '.......'],
    play: ['.#.....', '.##....', '.###...', '.####..', '.###...', '.##....', '.#.....'],
    restart: ['..####..', '.#....##', '#....###', '#.......', '#.......', '#......#', '.#....#.', '..####..'],
    cancel: ['##...##', '###.###', '.#####.', '..###..', '.#####.', '###.###', '##...##'],
    bell: ['...##...', '..####..', '.######.', '.######.', '.######.', '########', '........', '...##...'],
    check: ['.......#', '......##', '#....##.', '##..##..', '.####...', '..##....'],
    tip: ['..###..', '.#...#.', '#.....#', '#.....#', '.#...#.', '..###..', '..###..', '...#...']
  };

  function iconDataURI(rows) {
    const svg = spriteSVG(rows, { '#': '#000' }, '').replace('<svg class=""', '<svg xmlns="http://www.w3.org/2000/svg"');
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  /* ---------------------------------------------------------
     6. PIXEL DIGITS (5×7) for the countdown
     --------------------------------------------------------- */
  const DIGITS = {
    '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    ':': ['.', '#', '#', '.', '#', '#', '.']
  };

  function digitsSVG(text, opts) {
    const o = opts || {};
    // layout characters with 1px spacing
    let x = 0;
    const cells = [];
    const colon = [];
    for (const ch of text) {
      const glyph = DIGITS[ch];
      if (!glyph) continue;
      glyph.forEach((row, y) => {
        for (let i = 0; i < row.length; i++) {
          if (row[i] === '#') (ch === ':' ? colon : cells).push([x + i, y]);
        }
      });
      x += glyph[0].length + 1;
    }
    const w = x; // includes trailing space used for shadow
    const r = (pts, fill, off) => pts.map(([px, py]) =>
      '<rect x="' + (px + off) + '" y="' + (py + off) + '" width="1" height="1" fill="' + fill + '"/>').join('');
    const ink = o.color || '#3d2817';
    const shadow = o.shadow === false ? '' :
      r(cells, '#f4a01c', 0.5) + '<g class="colon-shadow">' + r(colon, '#f4a01c', 0.5) + '</g>';
    return '<svg class="' + (o.className || 'digits-svg') + '" viewBox="0 0 ' + w + ' ' + (o.shadow === false ? 7 : 8) +
      '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' +
      shadow + r(cells, ink, 0) + '<g class="colon">' + r(colon, ink, 0) + '</g></svg>';
  }

  /* ---------------------------------------------------------
     7. ALARM (Web Audio)
     The chime is pre-scheduled on the audio clock when the timer
     runs, so it rings on time even if the tab is in the background.
     ring() guarantees the chime is heard at most once per completion.
     --------------------------------------------------------- */
  const Alarm = {
    ctx: null,
    group: null, // { master, nodes, at }

    unlock() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!this.ctx) this.ctx = new AC();
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        // Play a silent buffer (required by some mobile browsers)
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(this.ctx.destination);
        src.start(0);
      } catch (e) { /* audio unavailable — visual alert still works */ }
    },

    running() { return !!this.ctx && this.ctx.state === 'running'; },

    build(at) {
      const ctx = this.ctx;
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      const nodes = [];
      const note = (freq, t, dur, peak, type) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + dur + 0.05);
        nodes.push(osc);
      };
      // A gentle "ding-ding-ding-ding" arpeggio, played three times, then a soft high ding.
      const melody = [783.99, 1046.5, 1318.51, 1567.98]; // G5 C6 E6 G6
      for (let round = 0; round < 3; round++) {
        const base = at + round * 0.95;
        melody.forEach((f, i) => {
          note(f, base + i * 0.12, 0.42, 0.16, 'triangle');
          note(f * 2, base + i * 0.12, 0.25, 0.03, 'sine');
        });
      }
      note(2093, at + 3 * 0.95, 0.9, 0.12, 'sine');
      return { master, nodes, at };
    },

    schedule(secondsFromNow) {
      this.cancel();
      if (!this.running()) return;
      try { this.group = this.build(this.ctx.currentTime + Math.max(0, secondsFromNow)); } catch (e) { this.group = null; }
    },

    cancel() {
      if (!this.group) return;
      this.group.nodes.forEach((n) => { try { n.stop(0); } catch (e) { /* already stopped */ } });
      try { this.group.master.disconnect(); } catch (e) { /* noop */ }
      this.group = null;
    },

    playNow() {
      this.cancel();
      if (!this.running()) return false;
      try { this.group = this.build(this.ctx.currentTime + 0.05); return true; } catch (e) { return false; }
    },

    /** Ring for a completed timer. Returns true if the chime is (or will be) audible. */
    ring(onLatePlay) {
      if (this.group && this.running()) {
        // Already scheduled: is it playing now (or about to)?
        if (this.ctx.currentTime >= this.group.at - 0.35) return true;
        this.cancel(); // audio clock lagged (e.g. suspended) — play right now instead
      }
      if (this.running()) return this.playNow();
      if (this.ctx) {
        this.ctx.resume().then(() => {
          if (this.running() && this.playNow() && onLatePlay) onLatePlay();
        }).catch(() => {});
      }
      return false;
    }
  };

  /* ---------------------------------------------------------
     8. SCREEN WAKE LOCK (keeps the screen on while cooking)
     --------------------------------------------------------- */
  const WakeLock = {
    sentinel: null,
    async request() {
      try {
        if ('wakeLock' in navigator && !this.sentinel) {
          this.sentinel = await navigator.wakeLock.request('screen');
          this.sentinel.addEventListener('release', () => { this.sentinel = null; });
        }
      } catch (e) { this.sentinel = null; }
    },
    release() {
      if (this.sentinel) { this.sentinel.release().catch(() => {}); this.sentinel = null; }
    }
  };

  /* ---------------------------------------------------------
     9. STATE & DOM
     --------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const dom = {
    html: document.documentElement,
    langBtns: Array.from(document.querySelectorAll('.lang-btn')),
    grid: $('egg-grid'),
    startBtn: $('start-btn'),
    startTime: $('start-time'),
    startHint: $('start-hint'),
    screens: { home: $('screen-home'), timer: $('screen-timer'), done: $('screen-done') },
    homeTitle: $('home-title'),
    potScene: $('pot-scene'),
    potEgg: $('pot-egg'),
    pot: $('pot'),
    flames: $('flames'),
    digits: $('countdown-digits'),
    countdownText: $('countdown-text'),
    status: $('timer-status'),
    timerLevel: $('timer-level'),
    timerTotal: $('timer-total'),
    progress: $('progress'),
    progressFill: $('progress-fill'),
    pauseBtn: $('pause-btn'),
    pauseLabel: $('pause-label'),
    restartBtn: $('restart-btn'),
    cancelBtn: $('cancel-btn'),
    doneEgg: $('done-egg'),
    doneLevel: $('done-level'),
    soundBtn: $('sound-btn'),
    againBtn: $('again-btn'),
    announcer: $('announcer'),
    alertAnnouncer: $('alert-announcer')
  };

  const state = {
    lang: 'en',
    selectedId: null,
    screen: 'home',
    hintKey: null
  };

  const timer = {
    status: 'idle', // idle | running | paused | done
    level: null,
    durationMs: 0,
    endAt: 0,
    remainingMs: 0,
    intervalId: null,
    timeoutId: null,
    finishId: null,
    shownSecond: null,
    eggKey: null,
    statusKey: null,
    announcedMinute: false
  };

  const storage = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  const t = () => translations[state.lang];
  const levelText = (id) => t().levels[id];
  const fmtClock = (totalSeconds, pad) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return (pad ? String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
  };

  let announceTimer = null;
  function announce(msg) {
    dom.announcer.textContent = '';
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { dom.announcer.textContent = msg; }, 60);
  }

  /* ---------------------------------------------------------
     10. HOME SCREEN
     --------------------------------------------------------- */
  function buildEggCards() {
    dom.grid.innerHTML = LEVELS.map((lvl, i) => (
      '<label class="egg-card" data-level="' + lvl.id + '" style="--i:' + i + '">' +
        '<input type="radio" name="egg-level" class="visually-hidden egg-radio" value="' + lvl.id + '">' +
        '<span class="egg-card-inner">' +
          '<span class="egg-check" aria-hidden="true"></span>' +
          '<span class="egg-art" aria-hidden="true"></span>' +
          '<span class="egg-name"></span>' +
          '<span class="egg-time"><span class="egg-time-art" aria-hidden="true">' +
            digitsSVG(fmtClock(lvl.seconds, false), { shadow: false, color: '#a84a00', className: 'mini-digits' }) + '</span>' +
            '<span class="visually-hidden egg-time-sr"></span></span>' +
          '<span class="egg-desc"></span>' +
        '</span>' +
      '</label>'
    )).join('');

    dom.grid.querySelectorAll('.egg-radio').forEach((radio) => {
      radio.addEventListener('change', () => selectLevel(radio.value, true));
      radio.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!radio.checked) { radio.checked = true; selectLevel(radio.value, true); }
          startCooking();
        }
      });
    });
    renderEggArt();
  }

  function renderEggArt() {
    dom.grid.querySelectorAll('.egg-card').forEach((card) => {
      const lvl = levelById(card.dataset.level);
      const selected = lvl.id === state.selectedId;
      card.querySelector('.egg-art').innerHTML = eggSVG(lvl.doneness, selected ? 'happy' : null);
    });
  }

  function renderCardText() {
    dom.grid.querySelectorAll('.egg-card').forEach((card) => {
      const lvl = levelById(card.dataset.level);
      const txt = levelText(lvl.id);
      card.querySelector('.egg-name').textContent = txt.name;
      card.querySelector('.egg-desc').textContent = txt.desc;
      card.querySelector('.egg-time-sr').textContent = t().minutes(lvl.seconds / 60);
      card.setAttribute('lang', state.lang);
    });
  }

  function selectLevel(id, userAction) {
    const lvl = levelById(id);
    if (!lvl) return;
    state.selectedId = id;
    storage.set('eggme-level', id);
    dom.grid.querySelectorAll('.egg-card').forEach((card) => {
      const on = card.dataset.level === id;
      card.classList.toggle('is-selected', on);
      const radio = card.querySelector('input');
      radio.checked = on;
      if (on && userAction) {
        // restart the "hop" animation
        card.classList.remove('just-picked');
        void card.offsetWidth; // eslint-disable-line no-void
        card.classList.add('just-picked');
      }
    });
    renderEggArt();
    state.hintKey = null;
    renderStartButton();
    if (userAction) announce(t().selected(levelText(id).name, t().minutes(lvl.seconds / 60)));
  }

  function renderStartButton() {
    const lvl = levelById(state.selectedId);
    dom.startBtn.setAttribute('aria-disabled', lvl ? 'false' : 'true');
    dom.startTime.innerHTML = lvl ? digitsSVG(fmtClock(lvl.seconds, false), { shadow: false, color: '#ffb703', className: 'mini-digits' }) : '';
    dom.startTime.hidden = !lvl;
    dom.startHint.textContent = state.hintKey ? t()[state.hintKey] : '';
  }

  function startCooking() {
    const lvl = levelById(state.selectedId);
    if (!lvl) {
      state.hintKey = 'pickFirst';
      renderStartButton();
      dom.grid.classList.remove('nudge');
      void dom.grid.offsetWidth; // eslint-disable-line no-void
      dom.grid.classList.add('nudge');
      const first = dom.grid.querySelector('.egg-radio');
      if (first) first.focus();
      return;
    }
    Alarm.unlock(); // must happen inside the user gesture
    startTimer(lvl);
    showScreen('timer');
    announce(t().announceStart(levelText(lvl.id).name, t().minutes(lvl.seconds / 60)));
  }

  /* ---------------------------------------------------------
     11. TIMER ENGINE (timestamp based)
     --------------------------------------------------------- */
  function clearHandles() {
    if (timer.intervalId !== null) { clearInterval(timer.intervalId); timer.intervalId = null; }
    if (timer.timeoutId !== null) { clearTimeout(timer.timeoutId); timer.timeoutId = null; }
    if (timer.finishId !== null) { clearTimeout(timer.finishId); timer.finishId = null; }
  }

  function runFrom(remainingMs) {
    clearHandles(); // never more than one running loop
    timer.status = 'running';
    timer.remainingMs = remainingMs;
    timer.endAt = Date.now() + remainingMs;
    timer.intervalId = setInterval(tick, 200);
    timer.timeoutId = setTimeout(tick, remainingMs + 15); // precise finish
    Alarm.schedule(remainingMs / 1000);
    WakeLock.request();
    dom.screens.timer.classList.remove('is-paused', 'is-finished');
    tick();
  }

  function startTimer(level) {
    timer.level = level;
    timer.durationMs = level.seconds * 1000;
    timer.shownSecond = null;
    timer.eggKey = null;
    timer.statusKey = null;
    timer.announcedMinute = false;
    dom.timerTotal.innerHTML = digitsSVG(fmtClock(level.seconds, false), { shadow: false, color: '#a84a00', className: 'mini-digits' }) +
      '<span class="visually-hidden">' + fmtClock(level.seconds, false) + '</span>';
    renderTimerText();
    runFrom(timer.durationMs);
  }

  function tick() {
    if (timer.status !== 'running') return;
    const remaining = Math.max(0, timer.endAt - Date.now());
    timer.remainingMs = remaining;
    renderTimer(remaining);
    if (remaining <= 0) completeTimer();
  }

  function pauseTimer() {
    if (timer.status !== 'running') return;
    const remaining = Math.max(0, timer.endAt - Date.now());
    if (remaining <= 0) { tick(); return; }
    clearHandles();
    Alarm.cancel();
    WakeLock.release();
    timer.status = 'paused';
    timer.remainingMs = remaining;
    dom.screens.timer.classList.add('is-paused');
    renderTimer(remaining);
    renderTimerText();
    announce(t().announcePause);
  }

  function resumeTimer() {
    if (timer.status !== 'paused') return;
    Alarm.unlock();
    runFrom(timer.remainingMs);
    renderTimerText();
    announce(t().announceResume);
  }

  function restartTimer() {
    if (!timer.level || timer.status === 'done') return;
    Alarm.unlock();
    startTimer(timer.level);
    announce(t().announceRestart);
  }

  function cancelTimer() {
    clearHandles();
    Alarm.cancel();
    WakeLock.release();
    timer.status = 'idle';
    document.title = t().appName;
    showScreen('home');
    announce(t().announceCancel);
  }

  function completeTimer() {
    if (timer.status !== 'running') return; // completion triggers exactly once
    timer.status = 'done';
    clearHandles();
    WakeLock.release();
    renderTimer(0);
    dom.screens.timer.classList.add('is-finished');
    const audible = Alarm.ring(() => { dom.soundBtn.hidden = true; });
    dom.soundBtn.hidden = audible;
    if (navigator.vibrate) { try { navigator.vibrate([180, 90, 180, 90, 260]); } catch (e) { /* noop */ } }
    document.title = t().readyTitle;
    // Let the 00:00 show for a beat, then celebrate.
    timer.finishId = setTimeout(() => {
      timer.finishId = null;
      renderDone();
      showScreen('done');
      flash();
      dom.alertAnnouncer.textContent = '';
      setTimeout(() => {
        dom.alertAnnouncer.textContent = t().ready + ' ' + levelText(timer.level.id).name +
          (audible ? '' : ' ' + t().soundBlocked);
      }, 50);
    }, 900);
  }

  /* ---------------------------------------------------------
     12. TIMER RENDERING
     --------------------------------------------------------- */
  function faceFor(progress) {
    if (timer.status === 'done') return 'cool';
    if (progress < 0.06) return 'neutral';
    if (progress < 0.85) return 'relaxed';
    return 'flustered';
  }

  function renderTimer(remainingMs) {
    const total = timer.durationMs || 1;
    const progress = Math.min(1, Math.max(0, 1 - remainingMs / total));
    const secs = Math.ceil(remainingMs / 1000);

    if (secs !== timer.shownSecond) {
      timer.shownSecond = secs;
      const clock = fmtClock(secs, true);
      dom.digits.innerHTML = digitsSVG(clock);
      dom.countdownText.textContent = t().timeLeft(clock);
      if (timer.status === 'running') document.title = clock + ' · ' + t().appName;
      if (!timer.announcedMinute && secs === 60 && timer.durationMs > 60000 && timer.status === 'running') {
        timer.announcedMinute = true;
        announce(t().announceOneMinute);
      }
    }

    // Progress bar: continuous fill, quantised to tiny pixel steps
    const pct = Math.round(progress * 1000) / 10;
    dom.progressFill.style.width = pct + '%';
    const now = String(Math.floor(progress * 100));
    if (dom.progress.getAttribute('aria-valuenow') !== now) {
      dom.progress.setAttribute('aria-valuenow', now);
      dom.progress.setAttribute('aria-valuetext', now + '%');
    }

    // Egg evolves from raw towards the selected doneness
    const target = timer.level ? timer.level.doneness : 0;
    const eased = 1 - Math.pow(1 - progress, 1.4);
    const doneness = Math.round(target * eased * 40) / 40;
    const face = faceFor(progress);
    const key = doneness + '|' + face;
    if (key !== timer.eggKey) {
      timer.eggKey = key;
      dom.potEgg.innerHTML = eggSVG(doneness, face);
    }

    const statusKey = timer.status === 'paused' ? 'paused' : progress >= 0.85 ? 'almostReady' : 'cooking';
    if (statusKey !== timer.statusKey) {
      timer.statusKey = statusKey;
      renderTimerText();
    }
  }

  function renderTimerText() {
    const paused = timer.status === 'paused';
    dom.pauseLabel.dataset.i18n = paused ? 'resume' : 'pause';
    dom.pauseLabel.textContent = t()[dom.pauseLabel.dataset.i18n];
    dom.pauseBtn.classList.toggle('is-resume', paused);
    dom.pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    if (timer.statusKey) {
      dom.status.dataset.i18n = timer.statusKey;
      dom.status.textContent = t()[timer.statusKey];
    }
    if (timer.level) dom.timerLevel.textContent = levelText(timer.level.id).name;
    if (timer.shownSecond !== null) dom.countdownText.textContent = t().timeLeft(fmtClock(timer.shownSecond, true));
    if (timer.status === 'running' && timer.shownSecond !== null) {
      document.title = fmtClock(timer.shownSecond, true) + ' · ' + t().appName;
    } else if (timer.status === 'done') {
      document.title = t().readyTitle;
    } else if (timer.status === 'paused') {
      document.title = t().paused + ' · ' + t().appName;
    }
  }

  function renderDone() {
    if (!timer.level) return;
    dom.doneEgg.innerHTML = eggSVG(timer.level.doneness, 'cool');
    const clock = fmtClock(timer.level.seconds, false);
    dom.doneLevel.innerHTML = '';
    dom.doneLevel.append(levelText(timer.level.id).name + ' · ');
    dom.doneLevel.insertAdjacentHTML('beforeend',
      '<span class="done-time">' + digitsSVG(clock, { shadow: false, color: '#ffb703', className: 'mini-digits' }) + '</span>' +
      '<span class="visually-hidden">' + clock + '</span>');
  }

  // Full-screen pixel flash: a strong visual alert that works without sound
  function flash() {
    const el = document.getElementById('flash');
    el.classList.remove('is-on');
    void el.offsetWidth; // eslint-disable-line no-void
    el.classList.add('is-on');
  }

  /* ---------------------------------------------------------
     13. SCREENS
     --------------------------------------------------------- */
  function showScreen(name) {
    state.screen = name;
    Object.keys(dom.screens).forEach((k) => {
      const el = dom.screens[k];
      const on = k === name;
      el.hidden = !on;
      el.classList.toggle('is-active', on);
    });
    window.scrollTo(0, 0);
    if (name === 'home') {
      document.title = t().appName;
      const sel = dom.grid.querySelector('.egg-radio:checked');
      (sel || dom.homeTitle).focus({ preventScroll: true });
    } else if (name === 'timer') {
      dom.pauseBtn.focus({ preventScroll: true });
    } else if (name === 'done') {
      dom.againBtn.focus({ preventScroll: true });
    }
  }

  /* ---------------------------------------------------------
     14. LANGUAGE
     --------------------------------------------------------- */
  function applyLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    state.lang = lang;
    storage.set('eggme-lang', lang);
    dom.html.lang = lang;
    dom.langBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = t()[el.dataset.i18n];
      if (typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const val = t()[el.dataset.i18nAriaLabel];
      if (typeof val === 'string') el.setAttribute('aria-label', val);
    });

    renderCardText();
    renderStartButton();
    renderTimerText();
    if (state.screen === 'done') renderDone();
    if (state.screen === 'home') document.title = t().appName;
  }

  /* ---------------------------------------------------------
     15. INIT
     --------------------------------------------------------- */
  function init() {
    // Icon sprites as CSS masks
    const rootStyle = document.documentElement.style;
    Object.keys(ICONS).forEach((name) => rootStyle.setProperty('--icon-' + name, iconDataURI(ICONS[name])));

    // Static pixel art
    dom.pot.innerHTML = potBackSVG() + potFrontSVG();
    dom.flames.innerHTML = flamesSVG();
    document.querySelector('.plate').innerHTML = plateSVG();

    buildEggCards();

    // Events
    dom.langBtns.forEach((b) => b.addEventListener('click', () => applyLanguage(b.dataset.lang)));
    dom.startBtn.addEventListener('click', startCooking);
    dom.pauseBtn.addEventListener('click', () => {
      if (timer.status === 'running') pauseTimer();
      else if (timer.status === 'paused') resumeTimer();
    });
    dom.restartBtn.addEventListener('click', restartTimer);
    dom.cancelBtn.addEventListener('click', cancelTimer);
    dom.againBtn.addEventListener('click', () => {
      Alarm.cancel();
      timer.status = 'idle';
      showScreen('home');
    });
    dom.soundBtn.addEventListener('click', () => {
      Alarm.unlock();
      const play = () => { if (Alarm.playNow()) dom.soundBtn.hidden = true; };
      if (Alarm.running()) play();
      else if (Alarm.ctx) Alarm.ctx.resume().then(play).catch(() => {});
    });

    // Catch up immediately when returning to the tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (timer.status === 'running') { tick(); WakeLock.request(); }
      }
    });

    // Restore preferences
    const savedLang = storage.get('eggme-lang');
    const savedLevel = storage.get('eggme-level');
    if (savedLevel && levelById(savedLevel)) selectLevel(savedLevel, false);
    applyLanguage(savedLang && translations[savedLang] ? savedLang : 'en');
    showScreen('home');
    // Don't steal focus on first load
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }

  init();
})();
