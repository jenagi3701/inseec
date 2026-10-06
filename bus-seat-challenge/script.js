/* =====================================================================
   BUS SEAT CHALLENGE — GAME ENGINE
   ---------------------------------------------------------------------
   Sections
     1. Utilities, RNG, storage
     2. Settings
     3. Menu screens (menu, map, how-to, scores, settings)
     4. Canvas, layout & input
     5. Scenario generator           ← generateRound()
     6. Round runtime / state machine ← update()
     7. Decisions, scoring, combos   ← decide(), applyResult()
     8. Rendering                    ← render()
     9. Modals (intro, clear, game over, pause, completion)
    10. Boot
   Configuration lives in config.js (window.BSC_CONFIG).
   ===================================================================== */
(() => {
  'use strict';

  const CFG = window.BSC_CONFIG;
  const SP = window.BSC_SPRITES;
  const BUS = window.BSC_BUS;
  const SFX = window.BSC_SFX;
  const P = CFG.passengers;
  const LEVELS = CFG.levels;

  /* =================================================================
     1. UTILITIES, RNG, STORAGE
     ================================================================= */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const params = new URLSearchParams(location.search);

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const rint = (rng, [a, b]) => a + Math.floor(rng() * (b - a + 1));
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  function shuffle(rng, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function weighted(rng, obj) {
    const e = Object.entries(obj); let x = rng() * e.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of e) { if ((x -= w) < 0) return k; }
    return e[0][0];
  }
  function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  const pad2 = n => String(n).padStart(2, '0');
  const fmtS = s => (s == null || !isFinite(s)) ? '—' : s.toFixed(2) + 's';
  const rand = (a, b) => a + Math.random() * (b - a);

  const STORE_KEY = 'busSeatChallenge.save.v1';
  function defaults() {
    let reduced = false;
    try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
    return {
      unlocked: 1,
      levels: {},                               // { "3": { best, stars } }
      best: { score: 0, combo: 0, reaction: null, level: 0 },
      stats: { games: 0, correct: 0, decisions: 0 },
      daily: { date: '', best: 0, plays: 0 },
      settings: { sound: true, music: false, contrast: false, reduced }
    };
  }
  function load() {
    const d = defaults();
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        for (const k of Object.keys(d)) {
          if (s[k] === undefined) continue;
          if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) Object.assign(d[k], s[k]);
          else d[k] = s[k];
        }
      }
    } catch (e) { /* storage unavailable: play without saving */ }
    d.unlocked = clamp(d.unlocked | 0, 1, LEVELS.length);
    return d;
  }
  let save = load();
  function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

  /* =================================================================
     2. SETTINGS
     ================================================================= */
  const SETTINGS = [
    { key: 'sound', label: '🔊 SOUND', desc: 'Arcade sound effects.' },
    { key: 'music', label: '🎵 MUSIC', desc: 'Chiptune background loop.' },
    { key: 'contrast', label: '◐ HIGH CONTRAST', desc: 'Stronger colours, dimmer background passengers.' },
    { key: 'reduced', label: '🐢 REDUCED MOTION', desc: 'No shake, no scrolling scenery, calmer effects.' }
  ];
  function applySettings() {
    const s = save.settings;
    document.body.classList.toggle('hc', !!s.contrast);
    document.body.classList.toggle('reduced', !!s.reduced);
    SFX.setSound(s.sound);
    SFX.setMusic(s.music);
  }
  function toggleSetting(key) {
    save.settings[key] = !save.settings[key];
    persist(); applySettings();
    if (key === 'sound' && save.settings.sound) SFX.play('click');
  }
  function settingsHTML() {
    return SETTINGS.map(o => `
      <button class="toggle" data-toggle="${o.key}" aria-pressed="${!!save.settings[o.key]}">
        <span>${o.label}<small>${o.desc}</small></span>
        <span class="state">${save.settings[o.key] ? 'ON' : 'OFF'}</span>
      </button>`).join('');
  }
  function bindToggles(root) {
    $$('[data-toggle]', root).forEach(b => b.addEventListener('click', () => {
      toggleSetting(b.dataset.toggle);
      b.setAttribute('aria-pressed', !!save.settings[b.dataset.toggle]);
      $('.state', b).textContent = save.settings[b.dataset.toggle] ? 'ON' : 'OFF';
    }));
  }

  /* =================================================================
     3. MENU SCREENS
     ================================================================= */
  const G = {
    screen: 'menu', run: null, round: null, paused: false, modal: null,
    t: 0, last: 0, timeScale: Math.max(0.1, parseFloat(params.get('speed')) || 1),
    shake: 0, particles: [], popups: [], scenery: 0, busMoving: false, busSpeed: 1,
    door: 0, doorTarget: 0, wipe: 0, focus: -1, kb: false, hover: null, menuT: 0
  };

  function show(id) {
    G.screen = id;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + id));
    if (id === 'menu') renderMenu();
    if (id === 'map') renderMap();
    if (id === 'how') renderHow();
    if (id === 'score') renderScores();
    if (id === 'settings') { $('#settings-list').innerHTML = settingsHTML(); bindToggles($('#settings-list')); }
    if (id === 'game') { requestAnimationFrame(resize); setTimeout(() => { if (!G.modal) $('#game-canvas').focus({ preventScroll: true }); }, 50); }
    const first = $('#screen-' + id + ' .btn');
    if (id !== 'game' && first && G.kb) first.focus();
  }

  function renderMenu() {
    const b = save.best;
    $('#menu-best').textContent = b.score > 0 ? `HI-SCORE ${b.score} · BEST STOP ${pad2(b.level)}` : 'NEW PASSENGER? START WITH STOP 01!';
  }

  function stars(n, max = 3) { return '★'.repeat(n) + '☆'.repeat(max - n); }

  function renderMap() {
    const ol = $('#route');
    const today = todayStr();
    const dBest = save.daily.date === today ? save.daily.best : 0;
    let html = `<li><button class="stop daily" data-daily="1">
        <span class="s-icon">📅</span>
        <span><span class="s-name">DAILY CHALLENGE</span><br><span class="s-skill">${today} · 10 passengers · 4 seats · 8s</span></span>
        <span class="s-right">TODAY<br>${dBest}</span></button></li>`;
    LEVELS.forEach((L, i) => {
      const n = i + 1, locked = n > save.unlocked, rec = save.levels[n];
      const done = !!rec;
      html += `<li><button class="stop ${n === save.unlocked ? 'current' : ''}" data-level="${n}" ${locked ? 'disabled aria-disabled="true"' : ''}
          aria-label="Stop ${n}: ${L.stop}${locked ? ', locked' : ''}${done ? ', cleared' : ''}">
        <span class="s-icon">${locked ? '🔒' : L.icon}</span>
        <span><span class="s-name">${n === LEVELS.length ? '<span class="final-tag">FINAL STOP</span>' : 'STOP ' + pad2(n)} — ${L.stop}</span><br>
          <span class="s-skill">${L.skill}${locked ? ' · LOCKED' : ''}</span></span>
        <span class="s-right">${done ? '✓ ' + rec.best + '<br><span class="stars">' + stars(rec.stars) + '</span>' : (locked ? '🔒' : 'NEW')}</span>
      </button></li>`;
    });
    ol.innerHTML = html;
    $$('[data-level]', ol).forEach(b => b.addEventListener('click', () => { SFX.play('click'); startRun('campaign', +b.dataset.level); }));
    $('[data-daily]', ol).addEventListener('click', () => { SFX.play('click'); startRun('daily', 1); });
    const cur = $('.stop.current', ol);
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: save.settings.reduced ? 'auto' : 'smooth' }), 30);
  }

  function spriteCanvas(look, scale) {
    const spr = SP.get(look, 0, false);
    const c = document.createElement('canvas');
    c.width = spr.width * scale; c.height = spr.height * scale;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(spr, 0, 0, c.width, c.height);
    return c;
  }
  const NEED_LABEL = ['CAN STAND', '★ SOME NEED', '★★ HIGH NEED', '★★★ NEEDS IT MOST'];
  function exampleLook(type) {
    const rng = mulberry32(hashStr('book-' + type));
    return SP.randomLook(rng, P[type]);
  }
  let howBuilt = false;
  function renderHow() {
    if (howBuilt) return; howBuilt = true;
    const box = $('#cluebook');
    CFG.clueBook.forEach(t => {
      const d = P[t];
      const card = document.createElement('div');
      card.className = 'clue' + (d.decoy ? ' decoy' : '');
      card.appendChild(spriteCanvas(exampleLook(t), 3));
      card.insertAdjacentHTML('beforeend', `<div class="c-name">${d.name}</div>
        <div class="c-need">${d.wheelchair ? '♿ WHEELCHAIR SPACE' : d.decoy ? '✗ DECOY — CAN STAND' : NEED_LABEL[d.need]}</div>
        <div class="c-why">${d.why}</div>`);
      box.appendChild(card);
    });
  }

  function renderScores() {
    const b = save.best, s = save.stats, today = todayStr();
    let rows = LEVELS.map((L, i) => {
      const r = save.levels[i + 1];
      return `<tr><td>${pad2(i + 1)} ${L.icon}</td><td>${L.stop}</td><td>${r ? r.best : (i + 1 > save.unlocked ? '🔒' : '—')}</td><td>${r ? stars(r.stars) : ''}</td></tr>`;
    }).join('');
    $('#score-body').innerHTML = `
      <div class="stat-grid">
        <div class="stat"><span class="k">⭐ BEST RUN</span><span class="v">${b.score}</span></div>
        <div class="stat"><span class="k">🚏 FURTHEST STOP</span><span class="v">${pad2(b.level)}</span></div>
        <div class="stat"><span class="k">🔥 BEST COMBO</span><span class="v">${b.combo}x</span></div>
        <div class="stat"><span class="k">⚡ BEST REACTION</span><span class="v">${fmtS(b.reaction)}</span></div>
        <div class="stat"><span class="k">📅 TODAY'S BEST</span><span class="v">${save.daily.date === today ? save.daily.best : 0}</span></div>
        <div class="stat"><span class="k">🎯 ACCURACY</span><span class="v">${s.decisions ? Math.round(s.correct / s.decisions * 100) : 0}%</span></div>
      </div>
      <table class="levels"><thead><tr><th>STOP</th><th>NAME</th><th>BEST</th><th>STARS</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="hint" style="margin-top:10px">Games played: ${s.games}</p>`;
  }

  /* ---- menu bus animation (drawn in the main loop) ---- */
  const menuCv = $('#menu-canvas'), menuCtx = menuCv.getContext('2d');
  function drawMenu(dt) {
    G.menuT += dt;
    const c = menuCtx, W = 320, H = 110, red = save.settings.reduced, hc = save.settings.contrast;
    c.imageSmoothingEnabled = false;
    const off = red ? 0 : G.menuT * 40;
    const L = { windows: [[0, 0, W, 70]] };
    BUS.drawScenery(c, L, 'sunset', off, hc);
    c.fillStyle = '#3a3f4e'; c.fillRect(0, 70, W, 40);
    c.fillStyle = '#f2c94c';
    for (let x = -((off * 2) % 32); x < W; x += 32) c.fillRect(Math.round(x), 88, 16, 3);
    c.fillStyle = '#5a6072'; c.fillRect(0, 70, W, 3);
    const bus = BUS.busExterior();
    const bob = red ? 0 : (Math.floor(G.menuT * 6) % 2);
    const bx = Math.round(W / 2 - 66 + (red ? 0 : Math.sin(G.menuT * 0.8) * 30));
    c.drawImage(bus, bx, 46 + bob, 132, 68);
    // bus stop sign passing by
    const sx = Math.round(W - ((off * 2) % (W + 60)));
    c.fillStyle = '#c0c6d4'; c.fillRect(sx, 40, 2, 32);
    c.fillStyle = '#2f63b8'; c.fillRect(sx - 6, 34, 14, 10);
    c.fillStyle = '#fff'; c.fillRect(sx - 3, 37, 8, 1); c.fillRect(sx - 3, 40, 8, 1);
  }

  /* =================================================================
     4. CANVAS, LAYOUT & INPUT
     ================================================================= */
  const canvas = $('#game-canvas'), ctx = canvas.getContext('2d');
  const stage = $('#stage');
  const view = { L: BUS.layouts.wide, scale: 1, cssW: 0, cssH: 0 };

  function resize() {
    const r = stage.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const tall = r.height > r.width * 1.05;
    const L = BUS.layouts[tall ? 'tall' : 'wide'];
    const changed = L !== view.L;
    view.L = L;
    const s = Math.min((r.width - 8) / L.W, (r.height - 8) / L.H);
    view.cssW = Math.floor(L.W * s); view.cssH = Math.floor(L.H * s);
    canvas.style.width = view.cssW + 'px'; canvas.style.height = view.cssH + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(view.cssW * dpr); canvas.height = Math.round(view.cssH * dpr);
    view.scale = canvas.width / L.W;
    if (changed && G.round) snapAll();
  }
  new ResizeObserver(() => resize()).observe(stage);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  function resolve(ref) {
    const L = view.L;
    switch (ref.k) {
      case 'slot': return L.slots[ref.i];
      case 'seat': return L.seatAnchor(ref.i);
      case 'wc': return { x: L.wc.px, y: L.wc.py };
      case 'entry': return L.entry;
      case 'stage': return L.stage;
      case 'outside': return L.outside;
      default: return { x: ref.x, y: ref.y };
    }
  }
  function snapAll() {
    for (const p of G.round.passengers) {
      const ref = p.target || p.at || { k: 'outside' };
      const pos = resolve(ref); p.x = pos.x; p.y = pos.y;
    }
  }

  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * view.L.W, y: (e.clientY - r.top) / r.height * view.L.H };
  }
  function entityRect(e) {
    if (e.kind === 'p') {
      const a = SP.anchor(e.p.look);
      return { x: e.p.x - a.x - 3, y: e.p.y - a.y - 3, w: a.w + 6, h: a.h + 6, cx: e.p.x, cy: e.p.y - 14, z: e.p.y };
    }
    const r = spotRect(e.T);
    return { x: r.x, y: r.y, w: r.w, h: r.h, cx: r.x + r.w / 2, cy: r.y + r.h / 2, z: r.y + r.h };
  }
  function hitTest(pt) {
    const list = candidates();
    let best = null, bz = -1;
    for (const e of list) {
      const r = entityRect(e);
      if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h && r.z > bz) { best = e; bz = r.z; }
    }
    if (best) return best;
    let bd = 26;  // forgiving radius for touch
    for (const e of list) {
      const r = entityRect(e), d = Math.hypot(pt.x - r.cx, pt.y - r.cy);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    SFX.unlock();
    if (G.paused || G.modal) return;
    G.kb = false;
    const r = G.round;
    if (!r) return;
    if (r.phase !== 'decide') return;
    const hit = hitTest(toLogical(e));
    if (hit) onPick(hit);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    G.hover = (G.round && G.round.phase === 'decide') ? hitTest(toLogical(e)) : null;
  });
  canvas.addEventListener('pointerleave', () => { G.hover = null; });

  document.addEventListener('keydown', e => {
    SFX.unlock();
    if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) G.kb = true;
    if (G.modal) {
      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && G.modal === 'pause') { e.preventDefault(); resume(); }
      return;
    }
    if (G.screen !== 'game') {
      if (e.key === 'Escape' && G.screen !== 'menu') show('menu');
      return;
    }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { e.preventDefault(); pause(); return; }
    const r = G.round;
    if (!r || r.phase !== 'decide') return;
    const list = candidates();
    if (!list.length) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || (k === 'Tab' && !e.shiftKey)) { e.preventDefault(); G.focus = (G.focus + 1) % list.length; }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || (k === 'Tab' && e.shiftKey)) { e.preventDefault(); G.focus = (G.focus - 1 + list.length) % list.length; }
    else if ((k === 'Enter' || k === ' ') && G.focus >= 0) { e.preventDefault(); onPick(list[G.focus % list.length]); }
    else if (/^[1-9]$/.test(k)) { const i = +k - 1; if (list[i]) { G.kb = true; e.preventDefault(); onPick(list[i]); } }
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden && G.screen === 'game' && !G.modal) pause(); });

  /* =================================================================
     5. SCENARIO GENERATOR
     ================================================================= */
  let UID = 1;
  function makePassenger(type, rng, look) {
    const def = P[type];
    return {
      id: UID++, type, def, look: look || SP.randomLook(rng, def),
      x: 0, y: 0, at: null, target: null, queue: [], wait: 0,
      state: 'outside', inside: false, walking: false, speed: 70,
      phase: rng() * 10, anim: null, late: 0, twin: false, onArrive: null
    };
  }
  function seatType(i) { return i < BUS.PRIORITY_SEATS ? 'priority' : 'normal'; }
  function featureMode(Lv) {
    let best = null, bw = 0;
    for (const [m, w] of Object.entries(Lv.modes)) if (m !== 'standard' && w > bw) { best = m; bw = w; }
    return best;
  }

  function generateRound(Lv, rng, roundNo) {
    let mode = weighted(rng, Lv.modes);
    const feat = featureMode(Lv);
    if (feat && roundNo === 2) mode = feat;       // guarantee the stop's new mechanic shows up
    if (mode === 'place') return genPlace(Lv, rng);

    const single = mode === 'memory' || mode === 'flash' || mode === 'quick';
    const n = rint(rng, Lv.passengers);
    let seatTargets = single ? 1 : rint(rng, Lv.targets);
    let needyN = mode === 'quick' ? 1 : clamp(rint(rng, Lv.needy), seatTargets, n - 1);

    const pool = Lv.needyPool.filter(t => !(single && P[t].wheelchair) && !(mode === 'quick' && P[t].need < 2));
    const types = [];
    let hiddenType = null;
    if (mode !== 'quick' && Lv.hiddenPool.length && rng() < Lv.hiddenChance && n - needyN >= 1) {
      hiddenType = pick(rng, Lv.hiddenPool); types.push(hiddenType);
    }
    let guard = 0;
    while (types.length < needyN && guard++ < 200) {
      const t = pick(rng, pool);
      if (P[t].wheelchair && types.some(x => P[x].wheelchair)) continue;
      if (types.includes(t) && rng() < 0.8) continue;
      types.push(t);
    }
    // force different need levels so the player has to prioritise
    if (Lv.mixNeeds && types.length >= 2) {
      const seatNeeds = new Set(types.filter(t => !P[t].wheelchair).map(t => P[t].need));
      if (seatNeeds.size < 2) {
        const cur = [...seatNeeds][0];
        const alt = pool.filter(t => !P[t].wheelchair && P[t].need !== cur);
        let idx = -1;
        for (let i = types.length - 1; i >= 0; i--) if (types[i] !== hiddenType && !P[types[i]].wheelchair) { idx = i; break; }
        if (alt.length && idx >= 0) types[idx] = pick(rng, alt);
      }
    }
    // there must be someone who needs a seat (not only a wheelchair user)
    if (!types.some(t => !P[t].wheelchair && P[t].need > 0)) types.push(pick(rng, pool.filter(t => !P[t].wheelchair)));
    const seatNeedy = types.filter(t => !P[t].wheelchair && P[t].need > 0).length;
    seatTargets = clamp(seatTargets, 1, seatNeedy);

    const passengers = types.map(t => makePassenger(t, rng));
    if (hiddenType) {
      const orig = passengers[0];
      const tw = makePassenger('young', rng, SP.twinLook(orig.look, P[hiddenType].twin));
      tw.twin = true; passengers.push(tw);
    }
    let decoys = 0;
    while (passengers.length < n) {
      let t;
      if (Lv.decoyPool.length && rng() < Lv.decoyChance) { t = pick(rng, Lv.decoyPool); decoys++; }
      else t = pick(rng, Lv.fillerPool);
      passengers.push(makePassenger(t, rng));
    }
    shuffle(rng, passengers);

    // free seats → targets
    const seatIdx = shuffle(rng, [...Array(14).keys()]).slice(0, seatTargets);
    const targets = seatIdx.map(i => ({ kind: 'seat', i }));
    if (passengers.some(p => p.def.wheelchair)) targets.splice(Math.floor(rng() * (targets.length + 1)), 0, { kind: 'wc' });

    // standing slots (spread order), shuffled assignment
    const slotOrder = shuffle(rng, [...Array(12).keys()]);
    passengers.forEach((p, i) => { p.home = { k: 'slot', i: slotOrder[i] }; });
    // late boarders (moving levels)
    if (Lv.moving && mode !== 'memory' && mode !== 'flash' && mode !== 'quick') {
      const lateN = Math.min(Lv.moving.late || 0, passengers.length - 1);
      const order = shuffle(rng, passengers.filter(p => !p.def.wheelchair));
      // half the time, a passenger in need boards late (track the newcomer!)
      if (rng() < 0.5) order.sort((a, b) => (b.def.need > 0) - (a.def.need > 0));
      order.slice(0, lateN).forEach((p, i) => { p.late = 0.2 + i * 0.6; });
    }
    let distraction = Lv.distraction || 0;
    if (mode === 'distraction') distraction = Math.min(3, distraction + 1);
    assignAnims(passengers, distraction, rng);

    return {
      mode, passengers, targets, ti: 0, distraction,
      seatOcc: fillSeats(rng, seatIdx, Lv),
      wcFree: true,
      pigeon: distraction >= 3 ? { t: rng() } : null,
      observation: !!hiddenType || decoys > 0 || mode === 'memory' || mode === 'flash',
      hiddenType
    };
  }

  function genPlace(Lv, rng) {
    const pool = Lv.needyPool;
    const roll = rng();
    let type;
    if (roll < 0.28 && pool.includes('wheelchair')) type = 'wheelchair';
    else if (roll < 0.72) type = pick(rng, pool.filter(t => P[t].need >= 2 && !P[t].wheelchair));
    else if (roll < 0.82) type = pick(rng, pool.filter(t => P[t].need === 1).concat(['heavyBags']));
    else type = pick(rng, Lv.fillerPool);
    const subject = makePassenger(type, rng);
    subject.subject = true;
    const spots = [];
    const pri = Math.floor(rng() * BUS.PRIORITY_SEATS);
    spots.push({ kind: 'seat', i: pri });
    const normals = shuffle(rng, [...Array(14).keys()].filter(i => i >= BUS.PRIORITY_SEATS));
    const nNormal = rng() < 0.5 ? 2 : 1;
    normals.slice(0, nNormal).forEach(i => spots.push({ kind: 'seat', i }));
    const wcFree = P[type].wheelchair || rng() < 0.55;
    if (wcFree) spots.push({ kind: 'wc' });
    shuffle(rng, spots);
    const bg = [];
    const nbg = clamp(rint(rng, Lv.passengers) - 3, 1, 4);
    for (let i = 0; i < nbg; i++) { const p = makePassenger(pick(rng, Lv.fillerPool), rng); p.home = { k: 'slot', i: i + 4 }; p.background = true; bg.push(p); }
    subject.home = { k: 'stage' };
    if (!wcFree) {                     // the wheelchair space is already in use
      const w = makePassenger('wheelchair', rng);
      w.background = true; w.state = 'parked'; w.inside = true; w.home = { k: 'wc' }; w.parkedAtStart = true;
      bg.push(w);
    }
    const passengers = bg.concat([subject]);
    assignAnims(bg, Lv.distraction || 0, rng);
    return {
      mode: 'place', passengers, targets: [{ kind: 'place' }], spots, subject, ti: 0,
      distraction: Lv.distraction || 0,
      seatOcc: fillSeats(rng, spots.filter(s => s.kind === 'seat').map(s => s.i), Lv),
      wcFree, pigeon: null, observation: false, hiddenType: null
    };
  }

  function fillSeats(rng, freeIdx, Lv) {
    const occ = {};
    const seatedPool = ['young', 'student', 'worker', 'tourist', 'phone', 'headphones', 'elderly', 'young'];
    for (let i = 0; i < 14; i++) {
      if (freeIdx.includes(i)) continue;
      const t = pick(rng, seatedPool);
      occ[i] = { npc: true, look: SP.randomLook(rng, P[t]), sleepy: rng() < 0.2 };
    }
    return occ;
  }

  function assignAnims(passengers, level, rng) {
    if (!level) return;
    const fillers = passengers.filter(p => p.def.need === 0 && !p.def.wheelchair && !p.twin);
    shuffle(rng, fillers);
    const kinds = level >= 2 ? ['dance', 'notes', 'jump', 'phone'] : ['notes', 'phone'];
    fillers.slice(0, level).forEach(p => {
      p.anim = p.def.look.headphones ? 'notes' : p.def.look.phone ? 'phone' : pick(rng, kinds);
    });
  }

  /* =================================================================
     6. RUN & ROUND RUNTIME
     ================================================================= */
  function levelCfg() { return G.run.kind === 'daily' ? CFG.daily : LEVELS[G.run.level - 1]; }

  function startRun(kind, level) {
    SFX.unlock();
    G.run = {
      kind, startLevel: level, level, score: 0, hearts: CFG.lives, combo: 0, bestCombo: 0,
      decisions: [], highest: level, roundNo: 0, levelStats: null,
      rng: kind === 'daily' ? mulberry32(hashStr('bsc-daily-' + todayStr())) : Math.random
    };
    G.round = null;
    show('game');
    startLevel(level);
  }

  function startLevel(n) {
    const run = G.run;
    run.level = n; run.highest = Math.max(run.highest, n); run.roundNo = 0;
    run.levelStats = { correct: 0, total: 0, score: 0, rts: [], mistakes: 0 };
    G.round = null;
    updateHUD();
    openLevelIntro();
  }

  function nextRound() {
    const run = G.run, Lv = levelCfg();
    if (run.roundNo >= Lv.rounds) return levelComplete();
    run.roundNo++;
    const r = generateRound(Lv, run.kind === 'daily' ? run.rng : Math.random, run.roundNo);
    r.phase = 'arrive'; r.phaseT = 0; r.mistakes = 0; r.decisions = 0; r.hidden = false; r.marks = [];
    r.Lv = Lv;
    for (const p of r.passengers) {
      const o = resolve(p.parkedAtStart ? p.home : { k: 'outside' }); p.x = o.x; p.y = o.y; p.at = p.parkedAtStart ? p.home : null;
    }
    G.round = r;
    G.busMoving = true; G.busSpeed = 1; G.doorTarget = 0; G.wipe = 1; G.focus = -1; G.hover = null;
    setPrompt(`🚏 STOP ${run.roundNo}/${Lv.rounds} — PASSENGERS BOARDING…`);
    updateHUD();
  }

  function board(r) {
    const reduced = save.settings.reduced;
    let i = 0;
    for (const p of r.passengers) {
      if (p.late) continue;
      if (reduced || p.parkedAtStart) {
        const pos = resolve(p.home); p.x = pos.x; p.y = pos.y; p.at = p.home; p.inside = true;
        p.state = p.parkedAtStart ? 'parked' : 'standing';
        continue;
      }
      p.state = 'boarding'; p.speed = 230; p.wait = i * 0.07;
      p.queue = [{ k: 'entry' }, p.home];
      i++;
    }
    G.doorTarget = 1;
  }

  function onArrive(p, ref) {
    if (ref.k === 'entry') { p.inside = true; return; }
    if (ref.k === 'slot' || ref.k === 'stage') { p.at = ref; if (p.state === 'boarding') p.state = 'standing'; p.speed = 70; return; }
    if (ref.k === 'seat') { p.state = 'seated'; p.at = ref; G.round.seatOcc[ref.i] = { p, look: p.look }; return; }
    if (ref.k === 'wc') { p.state = 'parked'; p.at = ref; return; }
  }

  function movePassenger(p, dt) {
    if (p.wait > 0) { p.wait -= dt; return; }
    if (!p.target) { if (p.queue.length) p.target = p.queue.shift(); else { p.walking = false; return; } }
    const pos = resolve(p.target);
    const dx = pos.x - p.x, dy = pos.y - p.y, d = Math.hypot(dx, dy);
    const sp = p.speed * (p.def.slow ? 0.45 : 1) * (p.def.wheelchair ? 1.1 : 1);
    if (d <= sp * dt || d < 0.5) {
      p.x = pos.x; p.y = pos.y;
      const ref = p.target; p.target = null;
      onArrive(p, ref);
      if (!p.queue.length) p.walking = false;
    } else {
      p.x += dx / d * sp * dt; p.y += dy / d * sp * dt; p.walking = true;
    }
  }

  function isCandidate(p) { return p.inside && (p.state === 'standing' || p.state === 'boarding') && !p.background && !p.subject; }

  function candidates() {
    const r = G.round;
    if (!r || r.phase !== 'decide') return [];
    let list;
    if (r.mode === 'place') {
      list = r.spots.filter(s => spotFree(s)).map(T => ({ kind: 'spot', T }));
    } else {
      list = r.passengers.filter(isCandidate).map(p => ({ kind: 'p', p }));
    }
    const tall = view.L.name === 'tall';
    list.sort((a, b) => {
      const ra = entityRect(a), rb = entityRect(b);
      if (tall) return Math.round(ra.z / 30) - Math.round(rb.z / 30) || ra.cx - rb.cx;
      return ra.cx - rb.cx;
    });
    return list;
  }
  function spotFree(T) { return T.kind === 'wc' ? G.round.wcFree : !G.round.seatOcc[T.i]; }

  function startDecision() {
    const r = G.round, Lv = r.Lv;
    r.phase = 'decide'; r.phaseT = 0;
    r.decStart = G.t;
    r.limit = Lv.time;
    r.lastTick = Math.ceil(r.limit);
    r.marks = [];
    G.focus = G.kb ? 0 : -1;
    if (r.mode === 'quick') {
      const target = r.passengers.find(p => p.def.need >= 2 && !p.def.wheelchair) || r.passengers[0];
      const delay = rand(0.7, 1.8);
      r.quick = { target, at: G.t + delay, end: G.t + delay + (Lv.quickWindow || 1.2), active: false };
      r.limit = delay + (Lv.quickWindow || 1.2);
    }
    // late boarders start walking in now
    for (const p of r.passengers) {
      if (p.late && p.state === 'outside') {
        p.state = 'boarding'; p.speed = 75 * ((Lv.moving && Lv.moving.speed) || 1); p.wait = p.late;
        p.queue = [{ k: 'entry' }, p.home];
        G.doorTarget = 1;
      }
    }
    r.nextShuffle = G.t + (Lv.moving ? rand(...Lv.moving.every) : 1e9);
    updatePromptForDecision();
  }

  function updatePromptForDecision() {
    const r = G.round;
    if (r.mode === 'place') { setPrompt('🧭 WHERE SHOULD THE NEW PASSENGER GO?'); return; }
    if (r.mode === 'quick') { setPrompt(r.quick.active ? '✨ NOW! TAP THE SPARKLE! ✨' : '⚡ GET READY… TAP THE ✨ SPARKLE!'); return; }
    const T = r.targets[r.ti];
    const what = T.kind === 'wc' ? 'THE ♿ WHEELCHAIR SPACE' : seatType(T.i) === 'priority' ? 'THE ★ PRIORITY SEAT' : 'THE ★ FREE SEAT';
    const left = r.targets.length - r.ti;
    setPrompt(`${r.hidden ? '🧠 FROM MEMORY: ' : ''}WHO GETS ${what}?${left > 1 ? ` (${left} SPOTS)` : ''}`);
  }

  function update(dt) {
    G.t += dt;
    // particles & popups always animate
    G.particles = G.particles.filter(pt => (pt.life -= dt) > 0);
    for (const pt of G.particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += (pt.g || 0) * dt; }
    G.popups = G.popups.filter(pp => (pp.life -= dt) > 0);
    for (const pp of G.popups) pp.y -= 14 * dt;
    G.shake = Math.max(0, G.shake - dt * 20);
    G.door += clamp(G.doorTarget - G.door, -dt * 4, dt * 4);
    if (G.busMoving && !save.settings.reduced) G.scenery += dt * 90 * G.busSpeed;

    const r = G.round;
    if (!r) return;
    r.phaseT += dt;
    for (const p of r.passengers) movePassenger(p, dt);
    animParticles(r, dt);

    switch (r.phase) {
      case 'arrive':
        G.wipe = Math.max(0, 1 - r.phaseT / 0.35);
        G.busSpeed = Math.max(0, 1 - r.phaseT / 0.6);
        if (r.phaseT >= 0.6) { G.busMoving = false; r.phase = 'board'; r.phaseT = 0; board(r); }
        break;
      case 'board': {
        const waiting = r.passengers.some(p => !p.late && (p.state === 'boarding' || p.state === 'outside'));
        if (!waiting && r.phaseT > 0.15) {
          G.doorTarget = 0;
          SFX.play('ding');
          if (r.mode === 'memory' || r.mode === 'flash') {
            r.phase = 'look'; r.phaseT = 0;
            r.lookDur = (r.Lv.lookTime || 2.4) * (r.mode === 'flash' ? 0.6 : 1);
            r.lastCount = 99;
            setPrompt(r.mode === 'flash' ? '⚡ FLASH ROUND! LOOK FAST!' : '👀 LOOK! MEMORIZE WHO NEEDS A SEAT!');
          } else startDecision();
        }
        break;
      }
      case 'look': {
        const left = Math.ceil(r.lookDur - r.phaseT);
        if (r.mode === 'memory' && left !== r.lastCount && left > 0) { r.lastCount = left; SFX.play('tick'); }
        if (r.phaseT >= r.lookDur) { r.hidden = true; SFX.play('hide'); startDecision(); }
        break;
      }
      case 'decide': updateDecide(r, dt); break;
      case 'resolve':
        if (r.phaseT >= r.resolveDur) {
          if (G.run.hearts <= 0) { r.phase = 'over'; gameOver(); break; }
          if (r.mode !== 'place' && r.ti < r.targets.length) { r.hidden = r.mode === 'memory' || r.mode === 'flash' ? r.hidden : false; startDecision(); }
          else {
            r.phase = 'outro'; r.phaseT = 0;
            if (r.mistakes === 0) { callout('PERFECT BUS SENSE! 🚌', '', 'good'); SFX.play('combo'); }
            setPrompt('🚌 NEXT STOP →');
          }
        }
        break;
      case 'outro':
        if (r.phaseT > 0.5) { G.busMoving = true; G.busSpeed = Math.min(1, (r.phaseT - 0.5) / 0.4); }
        if (r.phaseT > 0.9) G.wipe = Math.min(1, (r.phaseT - 0.9) / 0.3);
        if (r.phaseT >= 1.25) nextRound();
        break;
    }
  }

  function updateDecide(r, dt) {
    const el = G.t - r.decStart;
    const rem = r.limit - el;
    // ticking for the last 3 seconds
    const c = Math.ceil(rem);
    if (c < r.lastTick) { r.lastTick = c; if (c <= 3 && c > 0) SFX.play('tick'); }
    if (r.mode === 'quick' && !r.quick.active && G.t >= r.quick.at) {
      r.quick.active = true; SFX.play('sparkle'); updatePromptForDecision();
    }
    // moving passengers shuffle around
    if (r.Lv.moving && !r.hidden && G.t >= r.nextShuffle) {
      r.nextShuffle = G.t + rand(...r.Lv.moving.every) / ((r.Lv.moving && r.Lv.moving.speed) || 1);
      const movers = r.passengers.filter(p => p.state === 'standing' && !p.walking && p.inside && !p.subject);
      const used = new Set(r.passengers.filter(p => p.state !== 'seated' && p.state !== 'parked').map(p => {
        const ref = p.target && p.target.k === 'slot' ? p.target : (p.queue.find(q => q.k === 'slot') || p.at || p.home);
        return ref && ref.k === 'slot' ? ref.i : -1;
      }));
      const free = [...Array(12).keys()].filter(i => !used.has(i));
      if (movers.length && free.length) {
        const p = pick(Math.random, movers);
        const slot = { k: 'slot', i: pick(Math.random, free) };
        p.home = slot; p.speed = 60 * (r.Lv.moving.speed || 1); p.queue = [slot];
      }
    }
    if (r.passengers.every(p => !(p.state === 'boarding' && p.late))) G.doorTarget = 0;
    if (rem <= 0) decide(null);
  }

  function animParticles(r, dt) {
    if (save.settings.reduced) return;
    for (const p of r.passengers) {
      if (!p.inside || p.state === 'seated' || r.hidden) continue;
      p.pt = (p.pt || 0) - dt;
      if (p.pt > 0) continue;
      if (p.anim === 'notes') { p.pt = 0.55; G.particles.push({ x: p.x + 6, y: p.y - 30, vx: rand(4, 10), vy: -14, life: 1.2, type: 'note' }); }
      else if (p.def.look.tired && !p.twin) { p.pt = 1.1; G.particles.push({ x: p.x + 5, y: p.y - 31, vx: 5, vy: -8, life: 1.4, type: 'z' }); }
      else p.pt = 1;
    }
  }

  /* =================================================================
     7. DECISIONS, SCORING, COMBOS
     ================================================================= */
  function needFor(p, T) {
    if (T.kind === 'wc') return p.def.wheelchair ? 3 : -1;
    return p.def.wheelchair ? -1 : p.def.need;
  }

  function placeCorrect(p, T, r) {
    const d = p.def;
    const freeSpots = r.spots.filter(spotFree);
    const hasFreePriority = freeSpots.some(s => s.kind === 'seat' && seatType(s.i) === 'priority');
    const hasFreeNormal = freeSpots.some(s => s.kind === 'seat' && seatType(s.i) === 'normal');
    if (d.wheelchair) return T.kind === 'wc';
    if (T.kind === 'wc') return false;
    const type = seatType(T.i);
    if (d.need >= 2) return type === 'priority' || !hasFreePriority;
    if (d.need === 1) return true;
    return type === 'normal' || !hasFreeNormal;
  }
  function placeReason(p, T, ok) {
    const d = p.def;
    if (d.wheelchair) return ok ? '♿ The wheelchair space — safe & secure.' : '♿ Wheelchair users need the wheelchair space.';
    if (T.kind === 'wc') return '♿ Keep the wheelchair space free.';
    if (d.need >= 2) return ok ? 'Priority seat: close to the door, made for them.' : 'Priority seats exist for them — closer to the door.';
    if (d.need === 1) return 'Any seat works for them.';
    return ok ? 'Normal seat — priority seats stay free for those in need.' : 'Keep priority seats free for people who need them.';
  }

  function onPick(entity) {
    const r = G.round;
    if (!r || r.phase !== 'decide') return;
    if (r.mode === 'quick' && !r.quick.active) {
      SFX.play('early');
      popup(entity.kind === 'p' ? entity.p.x : view.L.W / 2, (entity.kind === 'p' ? entity.p.y : 100) - 36, 'WAIT FOR IT…', '#ffffff');
      return;
    }
    decide(entity);
  }

  function decide(entity) {
    const r = G.round;
    const timeout = !entity;
    const rt = r.mode === 'quick' ? (r.quick.active ? G.t - r.quick.at : r.limit) : G.t - r.decStart;
    let correct = false, mover = null, wrongP = null, reason = '', eagle = false, moverTarget = null;

    if (r.mode === 'place') {
      const p = r.subject;
      const free = r.spots.filter(spotFree);
      if (!timeout) correct = placeCorrect(p, entity.T, r);
      const T = correct ? entity.T : free.find(s => placeCorrect(p, s, r));
      reason = timeout ? placeReason(p, T, true) : placeReason(p, entity.T, correct);
      mover = p; moverTarget = T;
      if (!correct && entity) r.marks.push({ spot: entity.T, ok: false });
      r.marks.push({ spot: T, ok: true });
    } else {
      const T = r.targets[r.ti];
      // passengers stepping in through the door count too: look before you click!
      const pool = r.passengers.filter(q => isCandidate(q) || (q.late && q.state === 'boarding'));
      let best;
      if (r.mode === 'quick') {
        best = [r.quick.target];
        correct = !timeout && entity.p === r.quick.target;
      } else {
        const max = Math.max(...pool.map(q => needFor(q, T)));
        best = pool.filter(q => needFor(q, T) === max);
        correct = !timeout && needFor(entity.p, T) === max;
      }
      const p = entity && entity.p;
      if (correct) {
        mover = p; eagle = !!p.def.hidden;
        reason = T.kind === 'wc' ? P.wheelchair.why : p.def.why;
        if (best.length > 1 && r.mode !== 'quick') reason = 'More than one right answer here — good call!';
      } else {
        mover = best.find(q => q.def.hidden) || best[0];
        wrongP = p;
        reason = wrongReason(p, T, mover);
      }
      moverTarget = T;
      if (wrongP) r.marks.push({ p: wrongP, ok: false });
      if (mover) r.marks.push({ p: mover, ok: true });
    }

    r.hidden = false;           // reveal after the decision
    _reason = reason;
    applyResult(correct, rt, { timeout, eagle, obs: r.observation, at: mover || (entity && entity.p) });
    if (mover && moverTarget) sendTo(mover, moverTarget);

    r.ti++;
    r.decisions++;
    if (!correct) r.mistakes++;
    r.phase = 'resolve'; r.phaseT = 0;
    r.resolveDur = correct ? 0.6 : 1.4;
    G.focus = G.kb ? 0 : -1; G.hover = null;
  }

  function wrongReason(p, T, best) {
    const bn = best ? best.def.name : 'Someone';
    if (!p) return best ? `${bn}: ${best.def.why}` : '';
    if (G.round.mode === 'quick') return 'Tap the sparkling passenger!';
    if (T.kind === 'seat' && p.def.wheelchair) return '♿ They need the wheelchair space, not a seat.';
    if (T.kind === 'wc') return '♿ That space is for the wheelchair user.';
    if (p.twin) return 'Look closer! Their look-alike had the clue.';
    if (p.def.decoy) return `${p.def.why}`;
    return `${bn} needed it more. ${best ? best.def.why : ''}`;
  }

  function sendTo(p, T) {
    const r = G.round;
    const ref = T.kind === 'wc' ? { k: 'wc' } : { k: 'seat', i: T.i };
    if (T.kind === 'wc') r.wcFree = false;
    else r.seatOcc[T.i] = { reserved: true, look: null };
    p.state = 'toSeat'; p.speed = 150; p.queue = [ref]; p.target = null; p.wait = 0;
  }

  function speedBonus(rt) {
    for (const row of CFG.scoring.speedBonus) if (rt < row.under) return row.bonus;
    return 0;
  }
  function comboInfo(c) {
    for (const row of CFG.scoring.combos) if (c >= row.at) return row;
    return { mult: 1, label: '' };
  }

  const MSG_OK = ['NICE!', 'GOOD EYES!', 'FAST THINKING!', 'PERFECT!', 'QUICK REFLEX!', 'GOOD CALL!'];
  const MSG_FAST = ['LIGHTNING FAST! ⚡', 'DID YOU EVEN BLINK?', 'PERFECT REACTION! ⚡'];
  const MSG_BAD = ['LOOK AGAIN!', 'OOPS!', 'NOT THIS ONE!'];

  function applyResult(correct, rt, o) {
    const run = G.run, ls = run.levelStats, sc = CFG.scoring;
    const at = o.at ? { x: o.at.x, y: o.at.y - 34 } : { x: view.L.W / 2, y: view.L.H / 2 };
    run.decisions.push({ ok: correct, rt: o.timeout ? null : rt, obs: !!o.obs, timeout: !!o.timeout });
    ls.total++;
    if (correct) {
      run.combo++; run.bestCombo = Math.max(run.bestCombo, run.combo);
      const bonus = speedBonus(rt);
      const ci = comboInfo(run.combo);
      const pts = Math.round((sc.correct + bonus) * ci.mult / 5) * 5;   // arcade-style multiples of 5
      run.score += pts; ls.score += pts; ls.correct++; ls.rts.push(rt);
      popup(at.x, at.y, '+' + pts, '#7dff9a');
      sparkles(at.x, at.y + 10, '#ffd23f', 14);
      let main;
      if (rt < sc.perfectReaction) main = pick(Math.random, MSG_FAST);
      else if (o.eagle) main = 'EAGLE EYES! 👀';
      else if (rt > sc.slowReaction) main = 'GOOD OBSERVATION! 👀';
      else main = pick(Math.random, MSG_OK);
      const milestone = CFG.scoring.combos.find(c => c.at === run.combo);
      if (milestone) {
        callout(milestone.label + '!', `${main} · ×${milestone.mult} points`, 'combo');
        SFX.play('combo');
      } else {
        callout(main, G.round ? lastReason() : '', 'good');
        SFX.play(rt < sc.perfectReaction ? 'perfect' : 'correct');
      }
      if (!save.settings.reduced) G.shake = 2;
      announce(`Correct. ${main} Plus ${pts} points.`);
    } else {
      run.combo = 0; run.hearts = Math.max(0, run.hearts - 1); ls.mistakes++;
      if (o.timeout) ls.rts.push(G.round.limit);
      const before = run.score;
      run.score = Math.max(0, run.score + sc.wrong);
      ls.score += run.score - before;
      popup(at.x, at.y, String(sc.wrong), '#ff6b6b');
      const main = o.timeout ? 'TOO SLOW!' : pick(Math.random, MSG_BAD);
      callout(main, lastReason(), 'bad');
      SFX.play('wrong');
      if (!save.settings.reduced) G.shake = 6;
      announce(`${main} ${lastReason()} ${run.hearts} hearts left.`);
    }
    updateHUD();
  }
  // reason of the decision being resolved (set by decide() just before applyResult)
  let _reason = '';
  function lastReason() { return _reason; }

  /* =================================================================
     8. RENDERING
     ================================================================= */
  const driverLook = SP.randomLook(mulberry32(7), { look: { cap: true } });
  driverLook.shirt = '#2f63b8';

  function spotRect(T) {
    const L = view.L;
    if (T.kind === 'wc') return { x: L.wc.x, y: L.wc.y, w: L.wc.w, h: L.wc.h };
    const s = L.seats[T.i];
    return { x: s.x - 2, y: s.y - 8, w: 26, h: 34 };
  }

  function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  function textOut(str, x, y, size, color, align = 'center') {
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size / 3);
    ctx.strokeStyle = '#1b1325'; ctx.strokeText(str, x, y);
    ctx.fillStyle = color; ctx.fillText(str, x, y);
  }

  function drawSeated(look, s, dim) {
    const spr = SP.get(look, 0, save.settings.contrast);
    const a = SP.anchor(look);
    if (dim) ctx.globalAlpha = 0.55;
    ctx.drawImage(spr, 0, 0, a.w, 20, s.x + 11 - a.x, s.y - 6, a.w, 20);
    const pants = look.dress || look.pants;
    px(s.x + 6, s.y + 11, 10, 5, '#1b1325');
    px(s.x + 7, s.y + 12, 8, 3, pants);
    px(s.x + 7, s.y + 15, 3, 5, '#1b1325'); px(s.x + 12, s.y + 15, 3, 5, '#1b1325');
    px(s.x + 8, s.y + 15, 1, 4, look.dress ? look.skin : pants); px(s.x + 13, s.y + 15, 1, 4, look.dress ? look.skin : pants);
    px(s.x + 7, s.y + 19, 3, 2, look.shoes); px(s.x + 12, s.y + 19, 3, 2, look.shoes);
    ctx.globalAlpha = 1;
  }

  function drawSeat(i, r) {
    const L = view.L, s = L.seats[i], hc = save.settings.contrast;
    ctx.drawImage(BUS.seatSprite(seatType(i), hc), s.x, s.y);
    const occ = r && r.seatOcc[i];
    if (occ && occ.look) {
      drawSeated(occ.look, s, hc && occ.npc);
      if (occ.sleepy && !save.settings.reduced && Math.floor(G.t * 1.5 + i) % 3 === 0) textOut('z', s.x + 18, s.y - 6, 5, '#ffffff');
    }
  }

  function drawPassenger(p, r) {
    const hc = save.settings.contrast, reduced = save.settings.reduced;
    if (r.hidden && p.inside && !p.background) {
      const sil = SP.silhouette(hc);
      ctx.drawImage(sil, Math.round(p.x - 11), Math.round(p.y - 30));
      textOut('?', p.x, p.y - 18, 8, hc ? '#000' : '#ffd23f');
      return;
    }
    const a = SP.anchor(p.look);
    let ox = 0, oy = 0, frame = 0;
    if (p.walking) {
      const spd = p.def.slow ? 4 : 9;
      frame = Math.floor(G.t * spd + p.phase) % 2;
      if (p.def.slow) oy = frame;                   // visible limp
    } else if (!reduced) {
      oy = Math.sin(G.t * 2.4 + p.phase) > 0.7 ? -1 : 0;
      if (p.anim === 'dance') { ox = Math.round(Math.sin(G.t * 8 + p.phase) * 2); oy = -Math.abs(Math.round(Math.sin(G.t * 8 + p.phase) * 3)); frame = Math.floor(G.t * 4) % 2; }
      if (p.anim === 'jump') { const k = (G.t * 1.3 + p.phase) % 2; oy = k < 0.35 ? -Math.round(Math.sin(k / 0.35 * Math.PI) * 6) : 0; }
    }
    const spr = SP.get(p.look, frame, hc);
    const dim = hc && p.background;
    if (dim) ctx.globalAlpha = 0.5;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(Math.round(p.x - 7), Math.round(p.y - 1), 14, 3);
    ctx.drawImage(spr, Math.round(p.x - a.x + ox), Math.round(p.y - a.y + oy));
    ctx.globalAlpha = 1;
    if (p.anim === 'phone' && Math.floor(G.t * 3 + p.phase) % 2 === 0) {
      ctx.fillStyle = 'rgba(127,232,255,.45)'; ctx.fillRect(Math.round(p.x - 4 + ox), Math.round(p.y - 19 + oy), 8, 5);
    }
  }

  function drawPigeon(r) {
    const L = view.L, [A, B] = L.pigeonPath;
    const k = (G.t * 0.07 + r.pigeon.t) % 2, f = k < 1 ? k : 2 - k;
    const x = Math.round(A.x + (B.x - A.x) * f), y = Math.round(A.y + (B.y - A.y) * f);
    const peck = Math.floor(G.t * 3) % 3 === 0 ? 1 : 0, dir = k < 1 ? 1 : -1;
    px(x - 4, y - 6, 8, 4, '#1b1325'); px(x - 3, y - 5, 6, 3, '#9aa3b5');
    px(x + dir * 3 - 1, y - 8 + peck, 3, 3, '#1b1325'); px(x + dir * 3, y - 7 + peck, 2, 2, '#6b7a8f');
    px(x + dir * 5, y - 6 + peck, 1, 1, '#f39c33');
    px(x - 1, y - 2, 1, 2, '#f39c33'); px(x + 1, y - 2, 1, 2, '#f39c33');
  }

  function drawDriver(L) {
    const spr = SP.get(driverLook, 0, save.settings.contrast);
    if (L.name === 'wide') {
      ctx.drawImage(spr, 0, 0, 22, 20, L.driver.x - 11, L.driver.y - 20, 22, 20);
      px(L.driver.x + 8, L.driver.y - 12, 3, 10, '#1b1325');     // steering wheel
    } else {
      ctx.drawImage(spr, 0, 0, 22, 20, L.driver.x - 11, L.driver.y - 22, 22, 20);
    }
  }

  function arrow(x, y, color) {
    const b = save.settings.reduced ? 0 : Math.round(Math.sin(G.t * 7) * 2);
    y += b;
    px(x - 5, y - 6, 11, 4, '#1b1325'); px(x - 4, y - 5, 9, 2, color);
    px(x - 4, y - 2, 9, 2, '#1b1325'); px(x - 3, y - 2, 7, 1, color);
    px(x - 3, y, 7, 2, '#1b1325'); px(x - 2, y, 5, 1, color);
    px(x - 1, y + 2, 3, 1, '#1b1325'); px(x, y + 1, 1, 1, color);
  }

  function dashedRect(rc, color, phase, width = 1.5) {
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.lineDashOffset = -phase;
    ctx.lineWidth = width + 1.5; ctx.strokeStyle = '#1b1325';
    ctx.strokeRect(rc.x + 0.5, rc.y + 0.5, rc.w - 1, rc.h - 1);
    ctx.lineWidth = width; ctx.strokeStyle = color;
    ctx.strokeRect(rc.x + 0.5, rc.y + 0.5, rc.w - 1, rc.h - 1);
    ctx.restore();
  }

  function corners(rc, color) {
    const l = 5;
    [[rc.x, rc.y, 1, 1], [rc.x + rc.w, rc.y, -1, 1], [rc.x, rc.y + rc.h, 1, -1], [rc.x + rc.w, rc.y + rc.h, -1, -1]].forEach(([x, y, sx, sy]) => {
      px(sx > 0 ? x : x - l, sy > 0 ? y : y - 2, l, 2, color);
      px(sx > 0 ? x : x - 2, sy > 0 ? y : y - l, 2, l, color);
    });
  }

  function markBubble(x, y, ok) {
    px(x - 6, y - 6, 13, 12, '#1b1325');
    px(x - 5, y - 5, 11, 10, ok ? '#4fd67a' : '#ff5d6c');
    textOut(ok ? '✓' : '✗', x + 0.5, y + 0.5, 7, '#ffffff');
  }

  function render() {
    const L = view.L, r = G.round, hc = save.settings.contrast;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sh = G.shake > 0 ? G.shake : 0;
    const sx = sh ? (Math.random() * 2 - 1) * sh : 0, sy = sh ? (Math.random() * 2 - 1) * sh : 0;
    ctx.setTransform(view.scale, 0, 0, view.scale, sx * view.scale, sy * view.scale);
    ctx.imageSmoothingEnabled = false;

    const theme = r ? r.Lv.sky : (G.run ? levelCfg().sky : 'day');
    BUS.drawScenery(ctx, L, theme, G.scenery, hc);
    ctx.drawImage(BUS.shell(L, hc), 0, 0);
    BUS.drawAds(ctx, L, G.t, !!r && r.distraction >= 2 && !save.settings.reduced, hc);
    BUS.drawDoor(ctx, L, G.door, hc);
    drawDriver(L);

    const decide = r && r.phase === 'decide';
    const phase = (G.t * 12) % 14;
    // floor-level: highlight target spots
    if (r) {
      if (r.mode === 'place') {
        if (decide) r.spots.filter(spotFree).forEach(T => dashedRect(spotRect(T), '#ffd23f', phase, 1.5));
      } else if (r.ti < r.targets.length && r.phase !== 'arrive') {
        r.targets.forEach((T, k) => {
          if (k < r.ti) return;
          if (k === r.ti && (decide || r.phase === 'look' || r.phase === 'board')) dashedRect(spotRect(T), '#ffd23f', phase, 2);
          else if (k > r.ti) dashedRect(spotRect(T), 'rgba(255,255,255,.5)', 0, 1);
        });
      }
    }

    // depth-sorted sprites
    const items = [];
    for (let i = 0; i < L.seats.length; i++) items.push({ z: L.seats[i].y + 22, f: () => drawSeat(i, r) });
    for (const p of L.poles) items.push({ z: p.y, f: () => BUS.drawPole(ctx, p, hc) });
    if (r) {
      for (const p of r.passengers) {
        if (p.state === 'seated' || p.state === 'outside' && p.wait > 0 && !p.walking) continue;
        if (p.state === 'outside' && p.y > L.H) continue;
        items.push({ z: p.y, f: () => drawPassenger(p, r) });
      }
      if (r.pigeon) items.push({ z: L.pigeonPath[0].y, f: () => drawPigeon(r) });
    }
    items.sort((a, b) => a.z - b.z);
    for (const it of items) it.f();

    if (r) drawOverlays(r, decide);

    // particles
    for (const pt of G.particles) {
      const a = Math.min(1, pt.life * 2);
      ctx.globalAlpha = a;
      if (pt.type === 'note') textOut('♪', pt.x, pt.y, 7, '#ff9ad5');
      else if (pt.type === 'z') textOut('z', pt.x, pt.y, 6, '#d8ccff');
      else { px(pt.x - 1, pt.y - 1, pt.s || 2, pt.s || 2, pt.c); }
      ctx.globalAlpha = 1;
    }
    for (const pp of G.popups) {
      ctx.globalAlpha = Math.min(1, pp.life * 2.5);
      textOut(pp.text, pp.x, pp.y, pp.size || 8, pp.color);
      ctx.globalAlpha = 1;
    }
    if (G.wipe > 0) {
      ctx.fillStyle = `rgba(14,10,28,${G.wipe})`;
      ctx.fillRect(-10, -10, L.W + 20, L.H + 20);
      if (G.run && G.wipe > 0.4 && r) textOut(r.phase === 'outro' ? 'NEXT STOP →' : `STOP ${G.run.roundNo}/${r.Lv.rounds}`, L.W / 2, L.H / 2, 12, '#ffd23f');
    }
  }

  function drawOverlays(r, decide) {
    const L = view.L;
    // current target arrow
    if (r.mode !== 'place' && r.ti < r.targets.length && (decide || r.phase === 'look')) {
      const rc = spotRect(r.targets[r.ti]);
      arrow(rc.x + rc.w / 2, rc.y - 8, '#ffd23f');
      textOut(r.targets[r.ti].kind === 'wc' ? '♿' : '★', rc.x + rc.w - 2, rc.y + 2, 6, '#ffd23f');
    }
    // place-round subject
    if (r.mode === 'place' && r.subject.inside && (decide || r.phase === 'board')) {
      const s = r.subject, a = SP.anchor(s.look);
      arrow(s.x, s.y - a.y - 10, '#5ad1ff');
      if (decide) dashedRect({ x: s.x - a.x - 3, y: s.y - a.y - 3, w: a.w + 6, h: a.h + 6 }, '#5ad1ff', (G.t * 12) % 14, 1.5);
    }
    // quick-click sparkle
    if (r.mode === 'quick' && decide && r.quick.active) {
      const p = r.quick.target, a = SP.anchor(p.look);
      const on = Math.floor(G.t * 10) % 2 === 0;
      corners({ x: p.x - a.x - 4, y: p.y - a.y - 4, w: a.w + 8, h: a.h + 8 }, on ? '#ffffff' : '#ffd23f');
      textOut('!', p.x, p.y - a.y - 10, 9, '#ffd23f');
      if (!save.settings.reduced && Math.random() < 0.5) G.particles.push({ x: p.x + rand(-12, 12), y: p.y - rand(4, 30), vx: 0, vy: -10, life: 0.4, c: '#fff7a8', s: 2 });
    }
    // look countdown
    if (r.phase === 'look' || (decide && r.hidden)) {
      ctx.fillStyle = 'rgba(14,10,28,.7)'; ctx.fillRect(0, L.H - 22, L.W, 22);
      const left = Math.max(1, Math.ceil(r.lookDur - r.phaseT));
      if (r.phase === 'look') textOut(r.mode === 'flash' ? 'FLASH! LOOK!' : `LOOK! ${left}…`, L.W / 2, L.H - 11, 9, '#ffd23f');
      else textOut('WHO WAS IT? REMEMBER!', L.W / 2, L.H - 11, 7, '#ffffff');
    }
    // decision marks (✓ right answer, ✗ wrong pick)
    if (r.phase === 'resolve' || r.phase === 'outro') {
      for (const m of r.marks) {
        if (m.p) { const a = SP.anchor(m.p.look); markBubble(m.p.x, m.p.y - a.y - 9, m.ok); }
        else if (m.spot) { const rc = spotRect(m.spot); markBubble(rc.x + rc.w / 2, rc.y - 6, m.ok); }
      }
    }
    // hover & keyboard focus
    if (decide) {
      const list = candidates();
      if (G.hover && list.some(e => sameEntity(e, G.hover))) corners(entityRect(G.hover), '#ffffff');
      if (G.kb) {
        list.forEach((e, i) => {
          const rc = entityRect(e);
          if (i < 9) {
            px(rc.cx - 6, rc.y - 11, 12, 11, '#1b1325'); px(rc.cx - 5, rc.y - 10, 10, 9, i === G.focus ? '#ffd23f' : '#ffffff');
            ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#1b1325'; ctx.fillText(String(i + 1), rc.cx + 0.5, rc.y - 5);
          }
          if (i === G.focus) { corners(rc, '#ffd23f'); dashedRect(rc, '#ffd23f', 0, 1); }
        });
      }
    }
  }
  function sameEntity(a, b) { return a && b && a.kind === b.kind && (a.kind === 'p' ? a.p === b.p : a.T === b.T); }

  /* ---------- feedback helpers ---------- */
  function popup(x, y, text, color, size) { G.popups.push({ x, y, text, color, life: 1.1, size }); }
  function sparkles(x, y, c, n) {
    if (save.settings.reduced) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rand(25, 70);
      G.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 90, life: rand(0.4, 0.8), c: i % 3 ? c : '#ffffff', s: 2 });
    }
  }
  let calloutTimer = null;
  function callout(main, sub, cls) {
    const el = $('#callout');
    el.className = 'callout';
    $('.c-main', el).textContent = main;
    $('.c-sub', el).textContent = sub || '';
    void el.offsetWidth;
    el.className = 'callout show ' + (cls || '');
    clearTimeout(calloutTimer);
    calloutTimer = setTimeout(() => { el.className = 'callout'; }, 1400);
  }
  function setPrompt(t) { const el = $('#prompt-text'); if (el.textContent !== t) { el.textContent = t; } }
  function announce(t) { $('#sr-live').textContent = t; }

  /* ---------- HUD ---------- */
  let lastCombo = 0;
  function updateHUD() {
    const run = G.run; if (!run) return;
    const Lv = levelCfg();
    $('#hud-level').textContent = run.kind === 'daily' ? '📅 DAILY' : `STOP ${pad2(run.level)} ${Lv.icon}`;
    $('#hud-round').textContent = `${run.kind === 'daily' ? 'SITUATION' : Lv.stop} · ${Math.max(1, run.roundNo)}/${Lv.rounds}`;
    let h = '';
    for (let i = 0; i < CFG.lives; i++) h += i < run.hearts ? '<span class="h-full">♥</span>' : '<span class="h-empty">♡</span>';
    $('#hud-hearts').innerHTML = h;
    $('#hud-hearts').setAttribute('aria-label', `${run.hearts} of ${CFG.lives} lives`);
    $('#hud-score').textContent = run.score;
    const combo = $('#hud-combo');
    const ci = comboInfo(run.combo);
    combo.textContent = run.combo >= 2 ? `🔥${run.combo} ${ci.mult > 1 ? '×' + ci.mult : ''}` : '';
    if (run.combo > lastCombo && run.combo >= 2) { combo.classList.remove('pop'); void combo.offsetWidth; combo.classList.add('pop'); }
    lastCombo = run.combo;
  }
  function updateTimerHUD() {
    const r = G.round;
    const t = $('#hud-time'), fill = $('#timer-fill'), box = $('#hud-timer');
    let rem = null, frac = 1;
    if (r && r.phase === 'decide') { rem = Math.max(0, r.limit - (G.t - r.decStart)); frac = rem / r.limit; }
    else if (r && r.phase === 'look') { rem = Math.max(0, r.lookDur - r.phaseT); frac = rem / r.lookDur; }
    const txt = rem == null ? '--.-' : rem.toFixed(1).padStart(4, '0') + 's';
    if (t.textContent !== txt) t.textContent = txt;
    fill.style.transform = `scaleX(${frac})`;
    const low = rem != null && rem < 3 && r.phase === 'decide';
    fill.classList.toggle('low', low); box.classList.toggle('low', low);
  }

  /* =================================================================
     9. MODALS
     ================================================================= */
  function openModal(kind, html, bind) {
    G.modal = kind;
    const m = $('#modal'), card = $('#modal-card');
    card.innerHTML = html;
    m.hidden = false;
    if (bind) bind(card);
    const primary = $('.btn-primary', card) || $('.btn', card);
    if (primary) setTimeout(() => primary.focus({ preventScroll: true }), 30);
  }
  function closeModal() { G.modal = null; $('#modal').hidden = true; }

  function learnFigures(types) {
    if (!types || !types.length) return '';
    return `<div class="learn">${types.map(t => `<figure data-learn="${t}"><figcaption>${P[t].name}</figcaption></figure>`).join('')}</div>`;
  }
  function mountLearn(card) {
    $$('[data-learn]', card).forEach(f => f.prepend(spriteCanvas(exampleLook(f.dataset.learn), 2)));
  }

  function openLevelIntro() {
    const run = G.run, Lv = levelCfg();
    const daily = run.kind === 'daily';
    const today = todayStr();
    const dBest = save.daily.date === today ? save.daily.best : 0;
    openModal('intro', `
      <span class="tag">${daily ? '📅 ' + today : `STOP ${pad2(run.level)} · ${Lv.skill}`}</span>
      <h2>${Lv.icon} ${Lv.stop}</h2>
      ${learnFigures(Lv.learn)}
      <p class="tip">💡 ${Lv.tip}</p>
      <div class="kv">
        <span>🧍 Passengers</span><b>${Lv.passengers[0]}${Lv.passengers[1] !== Lv.passengers[0] ? '–' + Lv.passengers[1] : ''}</b>
        <span>⏱ Time per decision</span><b>${Lv.time}s</b>
        <span>🚏 Situations</span><b>${Lv.rounds}</b>
        ${daily ? `<span>🏆 Today's best</span><b>${dBest}</b>` : ''}
      </div>
      <div class="actions"><button class="btn btn-primary" data-go>GO! ▶</button>
      <button class="btn btn-small" data-quit>◀ ${daily ? 'MENU' : 'ROUTE MAP'}</button></div>`, card => {
      mountLearn(card);
      $('[data-go]', card).addEventListener('click', () => { SFX.play('click'); closeModal(); nextRound(); $('#game-canvas').focus({ preventScroll: true }); });
      $('[data-quit]', card).addEventListener('click', () => { closeModal(); endRun(false); show(daily ? 'menu' : 'map'); });
    });
  }

  function perf(decs) {
    const n = decs.length, ok = decs.filter(d => d.ok).length;
    const answered = decs.filter(d => d.rt != null).map(d => d.rt);
    const okRts = decs.filter(d => d.ok && d.rt != null).map(d => d.rt);
    const avg = answered.length ? answered.reduce((a, b) => a + b, 0) / answered.length : null;
    const best = okRts.length ? Math.min(...okRts) : null;
    // speed score only rewards correct answers (a fast wrong click is not a good reaction)
    const speed = n ? Math.round(decs.reduce((s, d) => s + (d.ok && d.rt != null ? clamp((5 - d.rt) / 4.4, 0, 1) : 0), 0) / n * 100) : 0;
    const obs = decs.filter(d => d.obs);
    const decPct = n ? Math.round(ok / n * 100) : 0;
    const obsPct = obs.length ? Math.round(obs.filter(d => d.ok).length / obs.length * 100) : decPct;
    return { n, ok, avg, best, speed, obsPct, decPct };
  }
  function perfHTML(p, run) {
    const bar = (label, v) => `<div class="row"><span>${label}</span><span class="bar"><i style="width:${v}%"></i></span><span class="pct">${v}%</span></div>`;
    return `<h3 class="sub-title">YOUR PERFORMANCE</h3>
      <div class="perf">
        ${bar('⚡ Reaction speed', p.speed)}
        ${bar('👀 Observation', p.obsPct)}
        ${bar('🧠 Decision making', p.decPct)}
      </div>
      <div class="kv">
        <span>🎯 Average reaction</span><b>${fmtS(p.avg)}</b>
        <span>⚡ Best reaction</span><b>${fmtS(p.best)}</b>
        <span>🔥 Highest combo</span><b>${run.bestCombo}x</b>
        <span>✓ Correct decisions</span><b>${p.ok}/${p.n}</b>
        ${run.kind === 'daily' ? '' : `<span>🚏 Highest stop</span><b>${pad2(run.highest)}</b>`}
      </div>`;
  }

  function levelComplete() {
    const run = G.run, Lv = levelCfg(), ls = run.levelStats, sc = CFG.scoring;
    G.round = null;
    if (run.kind === 'daily') return finishDaily(true);
    const bonus = sc.levelClearBonus + run.hearts * sc.heartBonus;
    run.score += bonus; ls.score += bonus;
    const starsN = ls.mistakes === 0 ? 3 : ls.mistakes === 1 ? 2 : 1;
    const n = run.level;
    const prev = save.levels[n];
    const newBest = !prev || ls.score > prev.best;
    save.levels[n] = { best: Math.max(prev ? prev.best : 0, ls.score), stars: Math.max(prev ? prev.stars : 0, starsN) };
    if (n < LEVELS.length) save.unlocked = Math.max(save.unlocked, n + 1);
    save.best.level = Math.max(save.best.level, n);
    recordRunBests(false);
    persist();
    updateHUD();
    if (n >= LEVELS.length) return completion();
    const healed = Math.min(CFG.lives, run.hearts + CFG.healOnLevelClear) - run.hearts;
    run.hearts += healed;
    SFX.play('levelUp');
    const avg = ls.rts.length ? ls.rts.reduce((a, b) => a + b, 0) / ls.rts.length : null;
    const title = pick(Math.random, ['BUS STOP CLEARED!', 'BUS STOP CLEARED!', "YOU'RE GETTING FASTER!"]);
    openModal('clear', `
      <span class="tag">STOP ${pad2(n)} · ${Lv.stop}</span>
      <h2>${title}</h2>
      <div class="stars-big" aria-label="${starsN} of 3 stars">${'★'.repeat(starsN)}<span class="off">${'★'.repeat(3 - starsN)}</span></div>
      ${newBest ? '<div class="new-best">NEW STOP RECORD!</div>' : ''}
      <div class="kv">
        <span>⭐ Stop score</span><b>${ls.score}</b>
        <span>🎁 Clear bonus</span><b>+${bonus}</b>
        <span>🎯 Accuracy</span><b>${ls.total ? Math.round(ls.correct / ls.total * 100) : 0}%</b>
        <span>⚡ Avg reaction</span><b>${fmtS(avg)}</b>
        <span>❤ Hearts</span><b>${run.hearts}/${CFG.lives}${healed ? ' (+' + healed + ')' : ''}</b>
        <span>🏁 Run score</span><b>${run.score}</b>
      </div>
      <p class="tip">🔓 Next: <b>STOP ${pad2(n + 1)} — ${LEVELS[n].stop}</b> (${LEVELS[n].skill})</p>
      <div class="actions"><button class="btn btn-primary" data-next>NEXT STOP →</button>
      <button class="btn btn-small" data-map>🗺 ROUTE MAP</button></div>`, card => {
      $('[data-next]', card).addEventListener('click', () => { SFX.play('click'); closeModal(); startLevel(n + 1); });
      $('[data-map]', card).addEventListener('click', () => { closeModal(); endRun(true); show('map'); });
    });
  }

  function recordRunBests(countGame) {
    const run = G.run; if (!run) return { newScore: false };
    const p = perf(run.decisions);
    let newScore = false;
    if (run.kind !== 'daily' && run.score > save.best.score) { save.best.score = run.score; newScore = true; }
    save.best.combo = Math.max(save.best.combo, run.bestCombo);
    if (p.best != null && (save.best.reaction == null || p.best < save.best.reaction)) save.best.reaction = p.best;
    if (countGame && !run.counted) {
      run.counted = true;
      save.stats.games++; save.stats.correct += p.ok; save.stats.decisions += p.n;
    }
    persist();
    return { newScore };
  }

  function endRun(countGame) {
    if (G.run && G.run.decisions.length) recordRunBests(countGame);
    G.round = null; G.busMoving = false;
  }

  function gameOver() {
    const run = G.run;
    if (run.kind === 'daily') return finishDaily(false);
    const { newScore } = recordRunBests(true);
    SFX.play('gameOver');
    const p = perf(run.decisions);
    openModal('over', `
      <h2>GAME OVER</h2>
      <div class="big">⭐ ${run.score}</div>
      ${newScore ? '<div class="new-best">NEW HIGH SCORE!</div>' : `<p class="hint">High score: ${save.best.score}</p>`}
      ${perfHTML(p, run)}
      <div class="actions"><button class="btn btn-primary" data-retry>↻ TRY AGAIN</button>
      <button class="btn btn-small" data-menu>◀ BACK TO MENU</button></div>`, card => {
      $('[data-retry]', card).addEventListener('click', () => { closeModal(); startRun('campaign', run.level); });
      $('[data-menu]', card).addEventListener('click', () => { closeModal(); G.round = null; show('menu'); });
    });
  }

  function completion() {
    const run = G.run;
    const { newScore } = recordRunBests(true);
    SFX.play('victory');
    for (let i = 0; i < 4; i++) setTimeout(() => sparkles(rand(60, view.L.W - 60), rand(40, 120), ['#ffd23f', '#5ad1ff', '#ff6fb5', '#7dff9a'][i], 30), i * 250);
    const p = perf(run.decisions);
    openModal('complete', `
      <span class="tag">FINAL STOP CLEARED</span>
      <h2>🏆 MASTER OF THE BUS!</h2>
      <p>PERFECT BUS SENSE. You looked, thought and reacted all the way to the last stop.</p>
      <div class="big">⭐ ${run.score}</div>
      ${newScore ? '<div class="new-best">NEW HIGH SCORE!</div>' : ''}
      ${perfHTML(p, run)}
      <div class="actions"><button class="btn btn-primary" data-daily>📅 TRY THE DAILY CHALLENGE</button>
      <button class="btn" data-again>↻ PLAY AGAIN</button>
      <button class="btn btn-small" data-menu>◀ BACK TO MENU</button></div>`, card => {
      $('[data-daily]', card).addEventListener('click', () => { closeModal(); startRun('daily', 1); });
      $('[data-again]', card).addEventListener('click', () => { closeModal(); startRun('campaign', 1); });
      $('[data-menu]', card).addEventListener('click', () => { closeModal(); show('menu'); });
    });
  }

  function finishDaily(cleared) {
    const run = G.run, today = todayStr();
    G.round = null;
    if (save.daily.date !== today) { save.daily.date = today; save.daily.best = 0; save.daily.plays = 0; }
    save.daily.plays++;
    const newBest = run.score > save.daily.best;
    if (newBest) save.daily.best = run.score;
    recordRunBests(true);
    persist();
    SFX.play(cleared ? 'levelUp' : 'gameOver');
    const p = perf(run.decisions);
    openModal('daily', `
      <span class="tag">📅 DAILY CHALLENGE · ${today}</span>
      <h2>${cleared ? 'DAILY COMPLETE!' : 'GAME OVER'}</h2>
      <div class="big">⭐ ${run.score}</div>
      ${newBest ? "<div class=\"new-best\">NEW TODAY'S BEST!</div>" : `<p class="hint">Today's best: ${save.daily.best}</p>`}
      ${perfHTML(p, run)}
      <p class="hint">Same bus for everyone today. Come back tomorrow for a new one!</p>
      <div class="actions"><button class="btn btn-primary" data-retry>↻ TRY AGAIN</button>
      <button class="btn btn-small" data-menu>◀ BACK TO MENU</button></div>`, card => {
      $('[data-retry]', card).addEventListener('click', () => { closeModal(); startRun('daily', 1); });
      $('[data-menu]', card).addEventListener('click', () => { closeModal(); show('menu'); });
    });
  }

  function pause() {
    if (G.modal || G.screen !== 'game') return;
    G.paused = true;
    openModal('pause', `
      <h2>❚❚ PAUSED</h2>
      <p class="hint">The scene is hidden while paused — no peeking!</p>
      <div class="settings-list">${settingsHTML()}</div>
      <div class="actions"><button class="btn btn-primary" data-resume>▶ RESUME</button>
      <button class="btn btn-small" data-quit>◀ QUIT TO MENU</button></div>`, card => {
      bindToggles(card);
      $('[data-resume]', card).addEventListener('click', resume);
      $('[data-quit]', card).addEventListener('click', () => { closeModal(); G.paused = false; endRun(true); show('menu'); });
    });
  }
  function resume() {
    if (G.modal !== 'pause') return;
    closeModal(); G.paused = false; G.last = performance.now();
    $('#game-canvas').focus({ preventScroll: true });
  }
  $('#btn-pause').addEventListener('click', () => { SFX.unlock(); pause(); });

  /* =================================================================
     10. BOOT
     ================================================================= */
  $$('[data-action]').forEach(b => b.addEventListener('click', () => {
    SFX.unlock(); SFX.play('click');
    const a = b.dataset.action;
    if (a === 'start') show('map');
    else if (a === 'daily') startRun('daily', 1);
    else if (a === 'how' || a === 'score' || a === 'settings' || a === 'menu') show(a);
    else if (a === 'reset') {
      if (confirm('Reset all progress, scores and unlocked stops?')) {
        const keep = save.settings; save = defaults(); save.settings = keep; persist(); renderScores();
      }
    }
  }));

  function loop(now) {
    const dt = Math.min(0.05, ((now - (G.last || now)) / 1000)) * G.timeScale;
    G.last = now;
    if (G.screen === 'menu') drawMenu(dt);
    if (G.screen === 'game') {
      if (!G.paused && !G.modal) update(dt);
      else if (G.modal && G.modal !== 'pause') {
        // keep the background alive behind result cards
        G.particles = G.particles.filter(pt => (pt.life -= dt) > 0);
        for (const pt of G.particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += (pt.g || 0) * dt; }
      }
      if (G.modal === 'pause') { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0e0a1c'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      else render();
      updateTimerHUD();
    }
    requestAnimationFrame(loop);
  }

  applySettings();
  renderMenu();
  resize();
  requestAnimationFrame(loop);

  // Small debug / test hook (used by automated play-tests)
  window.__BSC = {
    G, CFG, save: () => save, view,
    candidates, onPick, needFor,
    answer() {
      const r = G.round; if (!r || r.phase !== 'decide') return null;
      const list = candidates();
      if (r.mode === 'place') return list.find(e => placeCorrect(r.subject, e.T, r)) || null;
      if (r.mode === 'quick') return r.quick.active ? list.find(e => e.p === r.quick.target) : null;
      if (r.passengers.some(p => p.late && p.state === 'boarding' && !p.inside)) return null;   // wait for boarders
      const T = r.targets[r.ti];
      const max = Math.max(...list.map(e => needFor(e.p, T)));
      return list.find(e => needFor(e.p, T) === max) || null;
    },
    wrong() {
      const r = G.round; if (!r || r.phase !== 'decide') return null;
      const list = candidates();
      if (r.mode === 'place') return list.find(e => !placeCorrect(r.subject, e.T, r)) || null;
      if (r.mode === 'quick') return r.quick.active ? list.find(e => e.p !== r.quick.target) : null;
      const T = r.targets[r.ti];
      const max = Math.max(...list.map(e => needFor(e.p, T)));
      return list.find(e => needFor(e.p, T) !== max) || null;
    },
    generate: (lvl, seed) => generateRound(LEVELS[lvl - 1], mulberry32(seed), 1)
  };
})();
