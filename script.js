/* =========================================================
   PIXEL PIRATE ADVENTURE — 9 character pirate platformer
   Vanilla JS + Canvas. All art is drawn procedurally.
   ========================================================= */
'use strict';
(() => {

// ---------------------------------------------------------
// constants & utils
// ---------------------------------------------------------
const W = 480, H = 270, GROUND = 232, GRAV = 900, STEP = 1 / 60;
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function seeded(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const FONT = '8px "Press Start 2P", monospace';

// ---------------------------------------------------------
// save (localStorage)
// ---------------------------------------------------------
const SAVE_KEY = 'pixelPirateAdventure_v1';
const defaultSave = () => ({ coins: 0, totalScore: 0, bestScore: 0, unlocked: ['captain'], highestLevel: 1, bosses: [], levelBest: {}, cleared: [], selected: 'captain', muted: false });
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s === 'object') {
      const m = Object.assign(defaultSave(), s);
      if (!Array.isArray(m.unlocked) || !m.unlocked.includes('captain')) m.unlocked = ['captain'].concat(Array.isArray(m.unlocked) ? m.unlocked : []);
      return m;
    }
  } catch (e) { /* corrupted or blocked storage */ }
  return defaultSave();
}
let save = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

// ---------------------------------------------------------
// audio (tiny WebAudio synth)
// ---------------------------------------------------------
let actx = null;
const lastSfx = {};
function tone(f, d, type, slide, vol, delay) {
  const t = actx.currentTime + (delay || 0);
  const o = actx.createOscillator(), gn = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t + d);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + d);
  o.connect(gn).connect(actx.destination); o.start(t); o.stop(t + d + 0.03);
}
const SFX = {
  hit: [[180, .07, 'square', -90, .05]],
  punch: [[140, .06, 'triangle', -60, .08]],
  slash: [[900, .08, 'sawtooth', -700, .03]],
  shoot: [[600, .07, 'square', -400, .035]],
  coin: [[988, .06, 'square', 0, .035], [1318, .1, 'square', 0, .035, .06]],
  jump: [[260, .12, 'square', 280, .035]],
  skill: [[420, .16, 'sawtooth', 300, .04]],
  ult: [[110, .6, 'sawtooth', 500, .06], [220, .6, 'square', 400, .03, .1]],
  hurt: [[200, .18, 'square', -150, .06]],
  boom: [[90, .35, 'sawtooth', -50, .08]],
  zap: [[1500, .2, 'sawtooth', -1300, .05]],
  heal: [[520, .2, 'sine', 300, .06], [780, .25, 'sine', 300, .05, .12]],
  wind: [[300, .4, 'triangle', -150, .04]],
  water: [[220, .35, 'triangle', 200, .05]],
  kill: [[500, .1, 'square', -300, .04]],
  open: [[523, .1, 'square', 0, .04], [659, .1, 'square', 0, .04, .1], [784, .2, 'square', 0, .04, .2]],
  unlock: [[523, .12, 'square', 0, .05], [659, .12, 'square', 0, .05, .12], [784, .12, 'square', 0, .05, .24], [1046, .35, 'square', 0, .05, .36]],
  melody: [[659, .14, 'triangle', 0, .06], [784, .14, 'triangle', 0, .06, .15], [988, .14, 'triangle', 0, .06, .3], [1175, .3, 'triangle', 0, .06, .45]],
  over: [[392, .25, 'square', 0, .05], [330, .25, 'square', 0, .05, .25], [262, .5, 'square', 0, .05, .5]],
};
function sfx(name) {
  if (save.muted) return;
  const now = performance.now();
  if (lastSfx[name] && now - lastSfx[name] < 45) return;
  lastSfx[name] = now;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    for (const n of SFX[name] || []) tone(...n);
  } catch (e) { /* audio not available */ }
}

// ---------------------------------------------------------
// input
// ---------------------------------------------------------
const input = { held: {}, queue: [] };
const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', KeyW: 'jump', ArrowUp: 'jump',
  KeyJ: 'attack', KeyQ: 's1', KeyE: 's2', KeyF: 's3', KeyR: 'ult',
  Escape: 'pause', KeyP: 'pause',
};
function press(a) { if (!input.held[a]) { input.held[a] = true; input.queue.push([a, true]); } }
function release(a) { if (input.held[a]) { input.held[a] = false; input.queue.push([a, false]); } }
window.addEventListener('keydown', e => {
  const a = KEYMAP[e.code];
  if (!a) return;
  if (G && G.running) e.preventDefault();
  if (e.repeat) return;
  press(a);
});
window.addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) release(a); });
window.addEventListener('blur', () => { for (const k in input.held) release(k); });

// ---------------------------------------------------------
// drawing helpers
// ---------------------------------------------------------
const canvas = $('#game');
const mainCtx = canvas.getContext('2d');
let g = mainCtx;
function withCtx(c, fn) { const old = g; g = c; try { fn(); } finally { g = old; } }
function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
// sprite-space painter: x relative to centre, mirrored by facing
function painter(face, ox, oy) {
  return (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(face > 0 ? ox + x : ox - x - w, oy + y, w, h); };
}
function pxText(str, x, y, color, align) {
  g.font = FONT; g.textAlign = align || 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#000'; g.fillText(str, x + 1, y + 1);
  g.fillStyle = color; g.fillText(str, x, y);
}

// ---------------------------------------------------------
// HERO LOOKS (original pixel designs)
// ---------------------------------------------------------
const LOOK = {
  captain: {
    skin: '#f2c49b', shirt: '#d63c3c', pants: '#3a6fd6', shoes: '#c79a5a',
    torso(U) { U(-1, 12, 2, 5, '#f2c49b'); U(-4, 17, 8, 1, '#f5d76e'); },
    head(U) {
      U(-4, 3, 8, 2, '#1d1d1d'); U(-4, 5, 1, 3, '#1d1d1d'); U(-3, 5, 2, 1, '#1d1d1d');
      U(-7, 3, 14, 1, '#e8c547'); U(-4, 0, 8, 3, '#f0d060'); U(-4, 2, 8, 1, '#c22'); U(-3, 0, 6, 1, '#f7e08a');
      U(1, 9, 2, 1, '#9b3a2a');
    },
  },
  swordsman: {
    skin: '#e6b48a', shirt: '#eeeeee', pants: '#24243a', shoes: '#111',
    torso(U) { U(-4, 16, 8, 2, '#2e8b3e'); U(-4, 15, 8, 1, '#3fae4b'); },
    back(U) { U(-7, 13, 1, 6, '#f5f5f5'); U(-6, 14, 1, 6, '#c33'); U(-5, 15, 1, 5, '#222'); },
    head(U) {
      U(-4, 3, 8, 2, '#3fae4b'); U(-4, 5, 1, 2, '#3fae4b'); U(-3, 2, 1, 1, '#3fae4b'); U(0, 2, 1, 1, '#3fae4b'); U(2, 2, 1, 1, '#3fae4b');
      U(-4, 8, 1, 2, '#ffd23f'); U(1, 6, 3, 1, '#2b2b2b');
    },
    weapon(U, pose) {
      if (pose.act === 'slash' || pose.act === 'spin') { U(9, 4, 2, 2, '#c33'); U(11, 2, 1, 1, '#ddd'); U(10, 3, 1, 1, '#ddd'); U(12, 1, 2, 1, '#fff'); U(2, 10, 6, 1, '#ddd'); }
      else { U(3, 18, 1, 1, '#000'); }
    },
  },
  navigator: {
    skin: '#f6cfae', shirt: '#ffffff', pants: '#f6cfae', shoes: '#2a7bd6',
    torso(U) { U(-4, 13, 8, 1, '#2a7bd6'); U(-4, 15, 8, 1, '#2a7bd6'); U(-4, 17, 8, 3, '#f2a83e'); },
    back(U) { U(-6, 5, 2, 11, '#ff8a2a'); U(-5, 15, 2, 2, '#ff8a2a'); },
    head(U) { U(-4, 3, 8, 2, '#ff8a2a'); U(-4, 5, 2, 3, '#ff8a2a'); U(3, 4, 1, 2, '#ff8a2a'); U(1, 8, 1, 1, '#f49a9a'); },
    weapon(U, pose) {
      if (pose.act === 'cast') { U(4, -2, 1, 13, '#4ab0ff'); U(3, -3, 3, 2, '#9fe6ff'); }
      else { U(5, 6, 1, 17, '#4ab0ff'); U(4, 5, 3, 2, '#9fe6ff'); U(5, 11, 1, 1, '#1d4f8a'); U(5, 16, 1, 1, '#1d4f8a'); }
    },
  },
  sniper: {
    skin: '#c98b5a', shirt: '#8b5a2b', pants: '#6e7f3a', shoes: '#3b2414',
    torso(U) { U(-3, 12, 1, 6, '#6e7f3a'); U(2, 12, 1, 6, '#6e7f3a'); U(-4, 17, 8, 1, '#3b2414'); },
    head(U) {
      U(-5, 2, 10, 3, '#1a1a1a'); U(-5, 5, 2, 4, '#1a1a1a'); U(-4, 1, 3, 1, '#1a1a1a'); U(1, 1, 3, 1, '#1a1a1a');
      U(-3, 3, 7, 2, '#ffd23f'); U(1, 3, 2, 2, '#7fe3ff');
      U(4, 8, 4, 1, '#c98b5a'); U(7, 8, 1, 1, '#a86a3d');
    },
    weapon(U, pose) {
      if (pose.act === 'shoot' || pose.charge) { U(4, 12, 9, 2, '#6b4423'); U(13, 12, 5, 1, '#9aa'); U(6, 14, 2, 2, '#4a2e17'); }
      else { U(-6, 9, 1, 10, '#6b4423'); U(-6, 7, 1, 2, '#9aa'); }
    },
  },
  cook: {
    skin: '#f2c8a2', shirt: '#22232b', pants: '#22232b', shoes: '#6b3f22',
    torso(U) { U(-1, 12, 3, 1, '#5b8cff'); U(0, 13, 1, 4, '#ffcc00'); U(-4, 17, 8, 1, '#111'); },
    head(U) { U(-4, 3, 8, 2, '#ffe066'); U(-4, 5, 1, 3, '#ffe066'); U(1, 4, 3, 5, '#ffe066'); U(0, 4, 1, 2, '#ffe066'); U(-1, 7, 1, 1, '#111'); U(-1, 6, 2, 1, '#b8860b'); },
  },
  doctor: {
    skin: '#f7d7b5', shirt: '#f4f7ff', pants: '#3a3f5c', shoes: '#222',
    torso(U) { U(-5, 12, 10, 8, '#f4f7ff'); U(-1, 12, 2, 8, '#d6e2f5'); U(2, 14, 2, 2, '#e23b3b'); U(-5, 19, 10, 1, '#c8d3e8'); },
    back(U) { U(-8, 14, 4, 4, '#8b4513'); U(-7, 15, 2, 1, '#fff'); },
    head(U) {
      U(-4, 3, 8, 2, '#7a4b2a'); U(-4, 5, 1, 2, '#7a4b2a');
      U(-5, 0, 10, 3, '#3fd0c9'); U(-6, 2, 12, 1, '#2aa8a1'); U(-1, 0, 2, 3, '#fff'); U(-2, 1, 4, 1, '#fff'); U(-1, 1, 2, 1, '#e23b3b');
      U(1, 7, 3, 1, '#333'); U(1, 8, 1, 1, '#333'); U(3, 8, 1, 1, '#333');
    },
  },
  archaeologist: {
    skin: '#e9c1a0', shirt: '#7c4dff', pants: '#3b2b6b', shoes: '#1b1430',
    torso(U) { U(-4, 12, 8, 8, '#7c4dff'); U(-1, 12, 2, 8, '#5a33c9'); U(-4, 16, 8, 1, '#ffd700'); },
    back(U) { U(-6, 4, 2, 13, '#1b1430'); },
    head(U, pose) {
      U(-4, 3, 8, 2, '#1b1430'); U(-4, 5, 2, 4, '#1b1430'); U(-4, 4, 8, 1, '#ffd700'); U(1, 4, 1, 1, '#4dd0e1');
      if (pose.mermaid) { U(-6, 3, 2, 6, '#4dd0e1'); }
    },
  },
  shipwright: {
    skin: '#e0a679', shirt: '#ff4f6d', pants: '#22305a', shoes: '#111', sleeve: '#9aa6b2', hand: '#c9d2dc',
    torso(U) { U(-3, 13, 1, 1, '#ffd23f'); U(1, 15, 1, 1, '#ffd23f'); U(-2, 16, 1, 1, '#ffd23f'); U(2, 12, 1, 1, '#ffd23f'); U(-4, 17, 8, 1, '#111'); },
    head(U) { U(-4, 1, 9, 4, '#2ec5ff'); U(3, 0, 5, 2, '#2ec5ff'); U(-4, 5, 1, 2, '#2ec5ff'); U(0, 7, 4, 2, '#111'); U(2, 7, 1, 1, '#7fe3ff'); },
    weapon(U, pose) {
      if (pose.cannon) { U(-2, 6, 12, 5, '#6b7785'); U(10, 5, 3, 7, '#3b4450'); U(0, 7, 8, 1, '#c9d2dc'); }
    },
  },
  musician: {
    skin: '#f3e3d3', shirt: '#5a2d82', pants: '#24183a', shoes: '#111',
    torso(U) { U(-1, 12, 2, 2, '#fff'); U(1, 14, 1, 1, '#ffd23f'); U(1, 16, 1, 1, '#ffd23f'); U(-4, 17, 8, 1, '#ffd23f'); },
    back(U) { U(-8, 10, 3, 8, '#a0522d'); U(-7, 8, 1, 3, '#5a2d0c'); U(-7, 12, 1, 4, '#5a2d0c'); },
    head(U) { U(-4, 4, 8, 1, '#ddd'); U(-4, 5, 1, 4, '#ddd'); U(-4, -3, 8, 4, '#1c1c1c'); U(-6, 1, 12, 2, '#1c1c1c'); U(-4, 0, 8, 1, '#b52b40'); },
    weapon(U, pose) {
      if (pose.act === 'slash') { U(9, 12, 9, 1, '#e8e8f0'); U(8, 11, 1, 3, '#ffd23f'); }
      else { U(4, 17, 1, 7, '#c0c0d0'); U(3, 16, 3, 1, '#ffd23f'); }
    },
  },
};

function drawHero(id, x, fy, face, pose) {
  pose = pose || {};
  const L = LOOK[id];
  const ox = Math.round(x), oy = Math.round(fy) - 24;
  const P_ = painter(face, ox, oy);
  const ph = pose.walk != null ? Math.floor(pose.walk) % 4 : -1;
  const bob = ph === 1 || ph === 3 ? 1 : 0;
  const U = (a, b, w, h, c) => P_(a, b + bob, w, h, c);
  const skin = pose.power ? '#ff9c8c' : L.skin;
  const sleeve = L.sleeve || skin;
  const hand = L.hand || skin;
  if (L.back) L.back(U, pose);
  // back arm
  U(-6, 12, 2, 5, sleeve); U(-6, 17, 2, 1, hand);
  // legs
  if (pose.mermaid) {
    const sw = Math.round(Math.sin((pose.t || 0) * 10) * 1);
    P_(-4, 18, 8, 3, '#21c7b8'); P_(-3 + sw, 21, 6, 2, '#1aa597'); P_(-1 + sw, 23, 6, 1, '#5ff2e4'); P_(-4, 19, 8, 1, '#7ff9ec');
  } else if (pose.act === 'kick') {
    P_(-3, 18, 3, 5, L.pants); P_(-3, 23, 3, 1, L.shoes);
    P_(0, 15, 9, 3, L.pants); P_(9, 15, 2, 3, L.shoes);
    if (pose.fire) { P_(4, 13, 3, 2, '#ffb000'); P_(7, 12, 4, 3, '#ff6a00'); P_(10, 14, 3, 2, '#ffd23f'); P_(1, 14, 3, 1, '#ff3d00'); }
  } else if (pose.air) {
    P_(-3, 18, 3, 4, L.pants); P_(-3, 22, 3, 1, L.shoes);
    P_(1, 17, 3, 4, L.pants); P_(1, 21, 3, 1, L.shoes);
  } else {
    const lx = ph === 1 ? [-4, 1] : ph === 3 ? [-2, -1] : [-3, 0];
    P_(lx[0], 18, 3, 5, L.pants); P_(lx[0], 23, 3, 1, L.shoes);
    P_(lx[1], 18, 3, 5, L.pants); P_(lx[1], 23, 4, 1, L.shoes);
  }
  // torso + head
  U(-4, 12, 8, 6, L.shirt);
  if (L.torso) L.torso(U, pose);
  U(-4, 4, 8, 8, skin);
  U(2, 7, 1, 2, '#111');
  U(1, 10, 2, 1, '#8a3b3b');
  if (L.head) L.head(U, pose, skin);
  // front arm by action
  const act = pose.act;
  if (act === 'stretch') {
    const len = Math.max(0, Math.round(pose.L || 0));
    const s = pose.fist || 4;
    for (let i = 0; i < len; i += 2) U(3 + i, 13 + (Math.sin(i * 0.3 + (pose.t || 0) * 30) > 0.7 ? 1 : 0), 2, 2, skin);
    U(3 + len, 14 - Math.ceil(s / 2), s, s, skin);
    U(3 + len + s - 1, 14 - Math.ceil(s / 2), 1, s, '#d99a7a');
  } else if (act === 'punch' || act === 'shoot') {
    U(3, 13, 6, 2, sleeve); U(9, 12, 3, 3, hand);
  } else if (act === 'slash') {
    U(3, 11, 5, 2, sleeve); U(8, 10, 2, 2, hand);
  } else if (act === 'cast') {
    U(3, 6, 2, 6, sleeve); U(3, 4, 2, 2, hand);
  } else if (act === 'rocket') {
    U(3, 12, 2, 2, '#555');
  } else if (act !== 'spin') {
    U(3, 12, 2, 5, sleeve); U(3, 17, 2, 1, hand);
  }
  if (L.weapon) L.weapon(U, pose);
}

// ---------------------------------------------------------
// enemy sprites
// ---------------------------------------------------------
function drawEnemy(e) {
  const ox = Math.round(e.x), fy = Math.round(e.y);
  const f = e.face || 1;
  const t = G ? G.t : 0;
  const flash = e.flash > 0;
  const C = c => (flash ? '#ffffff' : c);
  if (e.type === 'slime') {
    const sq = e.onGround ? (Math.sin(t * 8 + e.id) > 0 ? 1 : 0) : -2;
    const p = painter(f, ox, fy - 10);
    const body = e.tint || '#55d16b', dark = e.tint2 || '#2f9c45';
    p(-6, 1 + sq, 12, 9 - sq, C(body)); p(-7, 4 + sq, 14, 6 - sq, C(body)); p(-4, 0 + sq, 8, 1, C(body));
    p(-7, 9, 14, 1, C(dark)); p(-4, 2 + sq, 2, 1, '#d9ffe0');
    p(1, 4 + sq, 2, 2, '#111'); p(4, 4 + sq, 2, 2, '#111'); p(2, 4 + sq, 1, 1, '#fff'); p(5, 4 + sq, 1, 1, '#fff');
  } else if (e.type === 'grunt' || e.type === 'gunner') {
    const ph = Math.floor(t * 8 + e.id) % 2;
    const p = painter(f, ox, fy - 24);
    const skin = e.type === 'gunner' ? '#8aa35a' : '#4aa3a2';
    p(-3, 18, 3, 5 + ph, C('#5a3b22')); p(1, 18, 3, 6 - ph, C('#5a3b22')); p(-3, 23, 3, 1, '#222'); p(1, 23, 3, 1, '#222');
    p(-4, 12, 8, 6, C('#e6e6e6')); p(-4, 13, 8, 1, C('#3a4a8a')); p(-4, 15, 8, 1, C('#3a4a8a')); p(-4, 17, 8, 1, C('#3b2414'));
    p(-5, 3, 9, 9, C(skin)); p(-2, 1, 3, 2, C('#2f7a79')); p(4, 8, 2, 2, C(skin));
    p(1, 5, 3, 3, '#ffe066'); p(2, 6, 2, 2, '#111'); p(2, 10, 3, 1, '#1f4f4e');
    if (e.type === 'gunner') { p(-5, 2, 9, 2, C('#c62828')); p(-7, 3, 2, 2, C('#c62828')); }
    p(-6, 12, 2, 5, C(skin));
    if (e.type === 'grunt') {
      if (e.st === 'wind') { p(3, 4, 2, 6, C(skin)); p(4, -4, 1, 8, '#cfd8dc'); p(3, 3, 3, 1, '#8d6e63'); }
      else if (e.st === 'swing') { p(3, 12, 6, 2, C(skin)); p(9, 12, 10, 2, '#cfd8dc'); }
      else { p(3, 12, 2, 5, C(skin)); p(4, 17, 1, 6, '#cfd8dc'); }
    } else {
      p(3, 12, 6, 2, C(skin)); p(8, 11, 6, 2, '#37474f'); p(8, 13, 2, 2, '#5d4037');
      if (e.st === 'wind' && Math.floor(t * 20) % 2) p(14, 10, 3, 3, '#ffd23f');
    }
  } else if (e.type === 'flyer') {
    const flap = Math.floor(t * 12 + e.id) % 2;
    const p = painter(f, ox, fy - 12);
    p(-4, 3, 9, 6, C('#6b3fa0')); p(-3, 4, 7, 4, C('#8455c9'));
    if (flap) { p(-10, 0, 7, 3, C('#4a2a78')); p(-9, 3, 4, 2, C('#4a2a78')); }
    else { p(-10, 6, 7, 3, C('#4a2a78')); p(-9, 9, 4, 2, C('#4a2a78')); }
    p(5, 4, 4, 2, '#ff9f1a'); p(2, 4, 2, 2, '#ff2d2d'); p(-1, 9, 1, 2, '#ff9f1a'); p(2, 9, 1, 2, '#ff9f1a');
  } else if (e.type === 'heavy') {
    const p = painter(f, ox, fy - 30);
    const up = e.st === 'wind';
    p(-9, 24, 6, 6, C('#a8473a')); p(3, 24, 6, 6, C('#a8473a'));
    p(-12, 6, 24, 19, C('#e8735a')); p(-10, 3, 20, 4, C('#e8735a')); p(-8, 1, 6, 3, C('#ff9f80')); p(3, 0, 4, 4, C('#ff9f80'));
    p(-8, 10, 3, 3, C('#ffb08a')); p(-3, 18, 4, 3, C('#ffb08a')); p(5, 16, 3, 3, C('#ffb08a'));
    p(3, 9, 3, 3, '#111'); p(4, 9, 1, 1, '#ff3'); p(1, 14, 7, 2, '#5a1f17');
    if (up) { p(9, -6, 6, 14, C('#c85a48')); p(-15, -6, 6, 14, C('#c85a48')); }
    else { p(10, 8, 6, 14, C('#c85a48')); p(-16, 8, 6, 14, C('#c85a48')); p(10, 20, 7, 5, C('#a8473a')); }
  } else if (e.type === 'crab') {
    const p = painter(f, ox, fy - 40);
    const lw = Math.floor(t * 10) % 2;
    for (let i = 0; i < 3; i++) { p(-20 + i * 6, 32 + (i + lw) % 2, 3, 8, C('#9c2a1c')); p(8 + i * 6, 32 + (i + lw + 1) % 2, 3, 8, C('#9c2a1c')); }
    p(-26, 12, 52, 22, C('#d9412b')); p(-22, 8, 44, 6, C('#d9412b')); p(-18, 6, 36, 3, C('#9aa6b2')); p(-22, 9, 44, 2, C('#6b7785'));
    p(-16, 18, 6, 4, C('#ff7a5c')); p(4, 20, 8, 4, C('#ff7a5c'));
    p(4, -2, 3, 10, C('#9c2a1c')); p(12, -2, 3, 10, C('#9c2a1c')); p(3, -5, 5, 5, '#fff'); p(11, -5, 5, 5, '#fff'); p(5, -4, 2, 3, '#111'); p(13, -4, 2, 3, '#111');
    const open = e.st === 'charge' || e.st === 'wind' ? 4 : 0;
    p(24, 6 - open, 16, 8, C('#e8553c')); p(24, 16 + open, 16, 7, C('#c13a26')); p(36, 6 - open, 4, 17 + open * 2, C('#d9412b'));
    p(-34, 10, 10, 12, C('#c13a26')); p(-36, 8, 6, 6, C('#e8553c'));
    if (e.phase2) { p(-6, 24, 12, 2, '#ffde59'); }
  } else if (e.type === 'kraken') {
    const p = painter(f, ox, fy - 60);
    for (let i = 0; i < 6; i++) {
      const sx = -24 + i * 9, wv = Math.round(Math.sin(t * 5 + i) * 3);
      p(sx, 42, 5, 14, C('#7b3fb3')); p(sx + wv, 54, 5, 6, C('#7b3fb3')); p(sx + 1, 46, 2, 2, C('#c79bf2'));
    }
    p(-24, 12, 48, 32, C('#9a52d6')); p(-20, 6, 40, 8, C('#9a52d6')); p(-16, 2, 32, 5, C('#9a52d6'));
    p(-12, 20, 6, 6, C('#c79bf2')); p(-18, 32, 4, 4, C('#c79bf2')); p(10, 34, 5, 5, C('#c79bf2'));
    p(4, 16, 9, 9, '#fff'); p(8, 18, 4, 5, e.phase2 ? '#ff2d2d' : '#111');
    p(-10, 16, 9, 7, '#111'); p(-14, 15, 26, 1, '#111');
    p(-22, -6, 44, 9, C('#1c1c1c')); p(-28, 2, 56, 3, C('#1c1c1c')); p(-4, -4, 8, 5, '#fff'); p(-2, -3, 4, 1, '#111'); p(-3, -1, 6, 1, '#ffd23f');
    p(-2, 30, 10, 3, '#3b0f5c');
    if (e.st === 'cannons' || e.st === 'wind') { p(24, 20, 14, 6, '#37474f'); p(36, 18, 4, 10, '#263238'); }
  }
  // stun stars / hold arms
  if (G && (G.t < e.stunUntil || G.t < e.holdUntil)) {
    const top = fy - e.h - 5;
    if (G.t < e.holdUntil) {
      for (let i = -1; i <= 1; i++) { R(ox + i * 6 - 1, fy - e.h * 0.7, 3, e.h * 0.7, '#b388ff'); R(ox + i * 6 - 2, fy - e.h * 0.7 - 3, 5, 4, '#e1bee7'); }
    } else {
      for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; R(ox + Math.cos(a) * 8 - 1, top + Math.sin(a) * 2, 3, 3, '#ffe066'); }
    }
  }
  if (G && G.t < e.burnUntil && Math.floor(t * 15) % 2) R(ox - 3 + Math.random() * 6, fy - e.h * Math.random(), 3, 3, '#ff7a00');
}

function drawCoin(x, y, t) {
  const fr = Math.floor(t * 8) % 4, w = [6, 4, 2, 4][fr];
  R(x - w / 2, y - 3, w, 6, '#ffd23f'); R(x - w / 2, y + 2, w, 1, '#b8860b');
  if (w > 2) R(x - w / 2 + 1, y - 2, 1, 2, '#fff8c2');
}
function drawHeart(x, y) {
  x = Math.round(x); y = Math.round(y);
  R(x - 3, y - 3, 2, 1, '#ff3b3b'); R(x + 1, y - 3, 2, 1, '#ff3b3b'); R(x - 4, y - 2, 8, 2, '#ff3b3b'); R(x - 3, y, 6, 1, '#ff3b3b'); R(x - 2, y + 1, 4, 1, '#ff3b3b'); R(x - 1, y + 2, 2, 1, '#ff3b3b'); R(x - 3, y - 2, 1, 1, '#ffd0d0');
}
function drawChest(c) {
  const x = Math.round(c.x), y = GROUND;
  R(x - 12, y - 14, 24, 14, '#8b5a2b'); R(x - 12, y - 14, 24, 2, '#ffd23f'); R(x - 12, y - 2, 24, 2, '#5a3b1a');
  R(x - 12, y - 14, 2, 14, '#ffd23f'); R(x + 10, y - 14, 2, 14, '#ffd23f');
  if (c.open) {
    R(x - 12, y - 24, 24, 6, '#a0682f'); R(x - 12, y - 24, 24, 1, '#ffd23f');
    R(x - 9, y - 17, 18, 4, '#ffd23f'); R(x - 6, y - 18, 3, 2, '#fff8c2'); R(x + 2, y - 18, 4, 2, '#ff4f6d');
  } else {
    R(x - 13, y - 20, 26, 7, '#a0682f'); R(x - 13, y - 20, 26, 1, '#ffd23f'); R(x - 2, y - 15, 4, 5, '#ffd23f'); R(x - 1, y - 13, 2, 2, '#333');
    if (Math.floor(G.t * 4) % 2) R(x + 8, y - 26, 2, 2, '#fff');
  }
}

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
    for (let i = 0; i < 40; i++) { const sx = (i * 97) % W, sy = (i * 53) % 120; if ((i + Math.floor(t * 2)) % 7) R(sx, sy, 1, 1, '#fff'); }
    circle(400 - camX * 0.02, 40, 14, T.moon); circle(394 - camX * 0.02, 36, 3, '#dcd9a8');
  } else if (T.sun) circle(380 - camX * 0.02, 46, 18, T.sun);
  // clouds
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 140 - camX * 0.15 + t * 4) % (W + 120) + W + 120) % (W + 120) - 60, cy = 20 + (i * 37) % 70;
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
  R(0, GROUND, W, H - GROUND, T.sand);
  R(0, GROUND, W, 2, T.top);
  const start = Math.floor(camX / 16) * 16;
  for (let wx = start; wx < camX + W + 16; wx += 16) {
    const h = (wx * 2654435761) >>> 0;
    const sx = wx - camX;
    if (T.deck) { R(sx, GROUND + 2, 1, H - GROUND, T.sand2); R(sx + 8, GROUND + 14, 8, 1, T.sand2); continue; }
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

// ---------------------------------------------------------
// GAME STATE
// ---------------------------------------------------------
let G = null;   // current level state
let P = null;   // player

function statMul(stat) {
  let m = 1;
  for (const b of P.buffs) if (b.stat === stat && G.t < b.until) m *= b.mult;
  return m;
}
function hasBuff(name) { return P.buffs.some(b => b.name === name && G.t < b.until); }
function addBuff(name, stats, dur, icon) {
  P.buffs = P.buffs.filter(b => b.name !== name);
  for (const [stat, mult] of Object.entries(stats)) P.buffs.push({ name, stat, mult, until: G.t + dur, icon });
}

// ---- effect helpers ----
function particles(x, y, n, colors, o) {
  o = o || {};
  for (let i = 0; i < n; i++) {
    const a = o.angle != null ? o.angle + rand(-o.spread || 0, o.spread || 0) : rand(0, Math.PI * 2);
    const s = rand(o.min || 20, o.spd || 90);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, o.life || 0.7), age: 0, c: pick(colors), s: o.size || (Math.random() < 0.3 ? 2 : 1), grav: o.grav != null ? o.grav : 200 });
  }
}
function popText(x, y, str, color, big) { G.texts.push({ x, y, str, color, age: 0, life: big ? 1.4 : 0.8 }); }
function fx(o) { const f = Object.assign({ age: 0, life: 0.3 }, o); G.fx.push(f); return f; }
function shake(n) { G.shake = Math.max(G.shake, n); }
function sched(delay, fn) { G.timers.push({ at: G.t + delay, fn }); }
function lock(d) { P.lockUntil = Math.max(P.lockUntil, G.t + d); }
function sinv(d) { P.sinv = Math.max(P.sinv, G.t + d); }
function act(type, dur, extra) { P.act = Object.assign({ type, until: G.t + dur }, extra || {}); }
function toast(msg, dur) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), (dur || 1.4) * 1000);
}
function heal(n) {
  const before = P.hp; P.hp = Math.min(P.maxHp, P.hp + n);
  popText(P.x, P.y - 30, '+' + Math.round(P.hp - before), '#8ef59b', true);
  particles(P.x, P.y - 12, 16, ['#8ef59b', '#ffffff', '#c8ffd0'], { grav: -60, spd: 50 });
  sfx('heal');
}
function playerRect() { return { x: P.x - P.w / 2, y: P.y - P.h, w: P.w, h: P.h }; }
function enemyRect(e) { return { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h }; }
function hbRect(h) { return { x: h.x - h.w / 2, y: h.y - h.h / 2, w: h.w, h: h.h }; }
function liveEnemies() { return G.enemies.filter(e => e.alive && e.active); }
function onScreen() { return G.enemies.filter(e => e.alive && e.x > G.cam - 10 && e.x < G.cam + W + 10); }
function nearest(range, front) {
  let best = null, bd = 1e9;
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const dx = e.x - P.x;
    if (front && Math.sign(dx) !== P.face && Math.abs(dx) > 12) continue;
    const d = Math.hypot(dx, (e.y - e.h / 2) - (P.y - 12));
    if (d < range && d < bd) { bd = d; best = e; }
  }
  return best;
}

// ---- player hitboxes ----
function addHB(o) {
  const h = Object.assign({ x: P.x, y: P.y - 12, w: 10, h: 10, vx: 0, vy: 0, life: 0.15, age: 0, dmg: 10, tick: 0, pierce: Infinity, grav: 0, opts: {}, delay: 0, dead: false }, o);
  h.hits = new Map();
  if (h.follow) { h.face = P.face; h.x = P.x + P.face * h.follow.ox; h.y = P.y - h.follow.oy; }
  G.hbs.push(h); return h;
}
function melee(o) { return addHB(Object.assign({ life: 0.1 }, o, { follow: { ox: o.ox || 12, oy: o.oy || 12 } })); }
function shoot(o) {
  const h = addHB(Object.assign({ life: 1.2, pierce: 1 }, o));
  h.x = P.x + P.face * (o.ox || 10); h.y = P.y - (o.oy || 12); h.vx = (o.vx || 200) * P.face; h.face = P.face;
  return h;
}

function hitEnemy(e, dmg, opts, src) {
  if (!e.alive) return;
  opts = opts || {};
  let mult = statMul('atk');
  if (opts.water && P.form === 'mermaid') mult *= 1.8;
  const d = Math.max(1, Math.round(dmg * mult * rand(0.9, 1.1)));
  e.hp -= d; e.flash = 0.1; e.active = true;
  popText(e.x + rand(-4, 4), e.y - e.h - 4, String(d), opts.crit ? '#ffd23f' : '#ffffff');
  const sx = src ? (src.follow ? P.x : src.x) : P.x;
  const dir = opts.dir || (Math.sign(e.x - sx) || P.face);
  if (!e.boss) {
    const kb = opts.kb != null ? opts.kb : 60;
    e.kx = dir * kb * (1 - e.kbRes);
    if (opts.launch && !e.heavy) { e.vy = -opts.launch; e.onGround = false; }
    else if (opts.juggle && !e.onGround && !e.heavy) e.vy = -110;
    if (opts.spike && !e.heavy) e.vy = 320;
  }
  if (!e.boss && !e.heavy) {
    e.flinch = G.t + 0.3; // brief hit-stun: no contact damage, wind-ups get interrupted
    if (e.st === 'wind' || e.st === 'swoop') { e.st = e.type === 'flyer' ? 'rise' : 'idle'; e.stT = 0.6; }
  }
  if (opts.stun) e.stunUntil = Math.max(e.stunUntil, G.t + opts.stun * (e.boss ? 0.25 : 1));
  if (opts.hold) e.holdUntil = Math.max(e.holdUntil, G.t + opts.hold * (e.boss ? 0.3 : 1));
  if (opts.burn) { e.burnUntil = G.t + opts.burn; e.burnNext = G.t + 0.3; }
  P.energy = Math.min(100, P.energy + d * 0.12);
  G.stats.dmg += d;
  particles(e.x, e.y - e.h / 2, 5, opts.colors || ['#fff', '#ffd23f', '#ff9f43'], { spd: 70, life: 0.35 });
  sfx('hit');
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.alive = false; e.hp = 0;
  G.stats.kills++;
  G.score += e.score;
  P.energy = Math.min(100, P.energy + 5);
  particles(e.x, e.y - e.h / 2, e.boss ? 60 : 14, e.boss ? ['#ffd23f', '#ff4f6d', '#fff', '#7b3fb3'] : ['#fff', '#ddd', e.type === 'slime' ? '#55d16b' : '#ff9f43'], { spd: e.boss ? 180 : 100 });
  popText(e.x, e.y - e.h - 10, '+' + e.score, '#ffd23f');
  dropCoins(e.x, e.y - e.h / 2, e.coins);
  if (!e.boss && Math.random() < (e.heavy ? 0.5 : 0.12)) G.hearts.push({ x: e.x, y: e.y - e.h / 2, vy: -150, age: 0 });
  sfx(e.boss ? 'boom' : 'kill');
  if (e.boss) bossDefeated(e);
}

function dropCoins(x, y, value) {
  let left = value;
  while (left > 0) {
    const v = left >= 25 ? 25 : left >= 10 ? 10 : 5;
    left -= v;
    G.coins.push({ x, y, vx: rand(-70, 70), vy: rand(-220, -120), v, age: 0, ground: false });
  }
}

function hurtPlayer(dmg, fromX) {
  if (G.over || G.won || G.t < P.inv || G.t < P.sinv) return;
  const d = Math.max(1, Math.round(dmg * statMul('def')));
  P.hp -= d;
  P.inv = G.t + 0.9;
  P.kx = (Math.sign(P.x - fromX) || -P.face) * 140; P.vy = -140; P.onGround = false;
  G.stats.hurt += d;
  popText(P.x, P.y - 28, '-' + d, '#ff5252');
  shake(4); sfx('hurt');
  particles(P.x, P.y - 12, 8, ['#ff5252', '#fff'], { spd: 80 });
  if (P.hp <= 0) { P.hp = 0; gameOver(); }
}

// ---- enemy hazards (projectiles / slams) ----
function addHazard(o) {
  const h = Object.assign({ x: 0, y: 0, w: 6, h: 6, vx: 0, vy: 0, grav: 0, life: 3, age: 0, dmg: 10, delay: 0, once: true, dead: false, kind: 'ball' }, o);
  G.hz.push(h); return h;
}

// =========================================================
// CHARACTERS
// =========================================================
const CH = {
  captain: {
    short: 'Captain', name: 'Captain Lumo', title: 'Rubber Pirate Captain', emoji: '🧑', role: 'Close-range fighter', hp: 100, spd: 96,
    unlock: { type: 'free' },
    basic: { name: 'Punch', cd: 0.26, desc: 'Quick rubber punches.', use() {
      act('punch', 0.12); sfx('punch');
      melee({ ox: 12, oy: 12, w: 18, h: 12, dmg: 12, opts: { kb: 80 } });
    } },
    s1: { name: 'Rubber Punch', cd: 3, desc: 'Stretch an arm far forward to smash a distant enemy.', use() {
      const dur = 0.38; P.stretch = { start: G.t, dur, max: 150, windup: 0, fist: 4 };
      lock(dur); sfx('skill');
      addHB({ follow: { ox: 0, oy: 12 }, w: 12, h: 12, life: dur * 0.6, dmg: 32, pierce: 1, opts: { kb: 200 },
        update(h) { h.x = P.x + P.face * (10 + stretchLen()); } });
    } },
    s2: { name: 'Power Mode', cd: 14, desc: 'Transform! +ATK, +attack speed, +move speed for 7s.', use() {
      lock(0.55); sinv(0.55); act('cast', 0.55); sfx('ult');
      P.transform = G.t + 0.55;
      for (let i = 0; i < 4; i++) sched(i * 0.12, () => { particles(P.x, P.y - 12, 10, ['#ff9c8c', '#ffffff', '#ffd1dc'], { grav: -80, spd: 60 }); shake(1); });
      sched(0.55, () => { addBuff('POWER', { atk: 1.5, aspd: 1.7, spd: 1.35 }, 7, '💢'); toast('POWER MODE!'); });
    } },
    ult: { name: 'Giant Rubber Strike', desc: 'Inflate a GIANT fist and launch a devastating long-range punch.', use() {
      const dur = 1.0; P.stretch = { start: G.t, dur, max: 290, windup: 0.35, fist: 22, giant: true };
      lock(dur); sinv(dur); sfx('ult');
      addHB({ follow: { ox: 0, oy: 14 }, w: 40, h: 40, delay: 0.35, life: 0.75, dmg: 150, opts: { kb: 320, stun: 0.6, crit: true },
        update(h) { h.x = P.x + P.face * (14 + stretchLen() + 10); } });
      sched(0.38, () => shake(10));
      sched(0.5, () => shake(8));
    } },
  },
  swordsman: {
    short: 'Swordsman', name: 'Kaito Triblade', title: 'Three-Blade Swordsman', emoji: '⚔️', role: 'Close-range damage dealer', hp: 110, spd: 90,
    unlock: { type: 'coins', n: 300 },
    basic: { name: 'Slash', cd: 0.3, desc: 'Fast sword slash.', use() {
      act('slash', 0.14); sfx('slash');
      P.combo = (P.combo + 1) % 2;
      slashFx(P.x + P.face * 10, P.y - 13, 16, P.combo ? '#ffffff' : '#c8e6ff', P.combo ? -1 : 1);
      melee({ ox: 15, oy: 12, w: 26, h: 22, dmg: 14, opts: { kb: 70 } });
    } },
    s1: { name: 'Three-Blade Slash', cd: 4, desc: 'Slash in three directions at once and fire a blade wave.', use() {
      act('slash', 0.3); lock(0.25); sfx('slash'); sfx('skill');
      slashFx(P.x + P.face * 12, P.y - 12, 22, '#ffffff', 1);
      slashFx(P.x, P.y - 30, 20, '#ff6b6b', -1, true);
      slashFx(P.x - P.face * 12, P.y - 12, 20, '#90caf9', -1);
      melee({ ox: 18, oy: 12, w: 34, h: 26, dmg: 28, opts: { kb: 140 } });
      melee({ ox: 0, oy: 30, w: 34, h: 24, dmg: 28, opts: { launch: 160 } });
      melee({ ox: -16, oy: 12, w: 28, h: 24, dmg: 28, opts: { kb: 140 } });
      shoot({ vx: 260, w: 10, h: 22, life: 0.45, dmg: 18, pierce: 3, ox: 20, draw: h => { R(h.x - 1, h.y - 11, 3, 22, '#e3f2fd'); R(h.x - h.face * 3, h.y - 8, 2, 16, '#90caf9'); } });
    } },
    s2: { name: 'Spinning Sword', cd: 6, desc: 'Spin forward like a whirlwind of steel, hitting repeatedly.', use() {
      act('spin', 0.6); sfx('slash'); sinv(0.6);
      P.dash = { vx: P.face * 210, until: G.t + 0.6 };
      addHB({ follow: { ox: 2, oy: 12 }, w: 38, h: 28, life: 0.6, tick: 0.1, dmg: 10, opts: { kb: 50 },
        draw(h) { const a = G.t * 30; for (let i = 0; i < 3; i++) { const an = a + i * 2.1; R(h.x + Math.cos(an) * 16 - 2, h.y + Math.sin(an) * 9 - 1, 5, 2, ['#fff', '#ff6b6b', '#90caf9'][i]); } } });
    } },
    ult: { name: 'Triple Sword Storm', desc: 'A blinding multi-hit combo across a huge area.', use() {
      lock(1.4); sinv(1.4); sfx('ult');
      act('slash', 1.4);
      const h = addHB({ follow: { ox: 50, oy: 16 }, w: 170, h: 90, life: 1.3, tick: 0.09, dmg: 12, opts: { kb: 20, stun: 0.3 },
        draw(hb) { for (let i = 0; i < 4; i++) { const x = hb.x + rand(-80, 80), y = hb.y + rand(-40, 40), l = rand(14, 30); g.strokeStyle = pick(['#fff', '#ff6b6b', '#90caf9', '#e0f7fa']); g.lineWidth = 2; g.beginPath(); g.moveTo(x - l, y - l * 0.5); g.lineTo(x + l, y + l * 0.5); g.stroke(); } } });
      sched(1.3, () => { melee({ ox: 50, oy: 16, w: 180, h: 100, dmg: 60, opts: { kb: 260, crit: true } }); shake(10); sfx('boom'); slashFx(h.x, h.y, 50, '#ffffff', 1); });
      for (let i = 0; i < 6; i++) sched(i * 0.2, () => { shake(3); sfx('slash'); });
    } },
  },
  navigator: {
    short: 'Navigator', name: 'Nimbus Mira', title: 'Weather Navigator', emoji: '🌩', role: 'Ranged / area damage', hp: 90, spd: 94,
    unlock: { type: 'level', n: 2 },
    basic: { name: 'Gust', cd: 0.4, desc: 'Small wind projectile.', use() {
      act('cast', 0.15); sfx('wind');
      shoot({ vx: 270, w: 10, h: 8, life: 0.75, dmg: 12, ox: 10, oy: 16, opts: { kb: 90 },
        draw: h => { const k = Math.floor(G.t * 20) % 2; R(h.x - 5, h.y - 2 + k, 8, 1, '#e0f7fa'); R(h.x - 3, h.y + 1 - k, 8, 1, '#b2ebf2'); R(h.x + 2, h.y - 1, 3, 3, '#ffffff'); } });
    } },
    s1: { name: 'Lightning', cd: 4, desc: 'Call a lightning bolt onto the nearest enemy (stuns).', use() {
      act('cast', 0.35); lock(0.2);
      const tgt = nearest(280, false);
      const x = tgt ? tgt.x : P.x + P.face * 100;
      lightning(x, 48, 1.2);
    } },
    s2: { name: 'Wind Storm', cd: 7, desc: 'Summon a roaming tornado that lifts and shreds enemies.', use() {
      act('cast', 0.3); sfx('wind');
      tornado(P.x + P.face * 20, P.face * 90, 2.4);
    } },
    ult: { name: 'Weather Chaos', desc: 'Lightning, wind and rain all at once over the whole screen.', use() {
      act('cast', 1.0); lock(0.6); sinv(0.8); sfx('ult');
      G.weather = G.t + 4;
      tornado(P.x + 30, 110, 3.5); tornado(P.x - 30, -110, 3.5);
      for (let i = 0; i < 12; i++) sched(0.2 + i * 0.28, () => {
        const list = onScreen();
        const x = list.length ? pick(list).x : G.cam + rand(30, W - 30);
        lightning(x, 40, 1);
      });
      addHB({ x: 0, y: GROUND - 60, w: W, h: 140, life: 4, tick: 0.5, dmg: 7, opts: { kb: 10, colors: ['#81d4fa', '#fff'] },
        update(h) { h.x = G.cam + W / 2; } });
    } },
  },
  sniper: {
    short: 'Sniper', name: 'Pip Longshot', title: 'Long-Range Sniper', emoji: '🎯', role: 'Long-range damage', hp: 85, spd: 92,
    unlock: { type: 'coins', n: 500 },
    basic: { name: 'Shot', cd: 0.45, desc: 'Long-distance bullet.', use() {
      act('shoot', 0.15); sfx('shoot');
      shoot({ vx: 430, w: 6, h: 3, life: 1.0, dmg: 15, ox: 16, oy: 12, opts: { kb: 50 }, draw: h => { R(h.x - 3, h.y - 1, 6, 2, '#ffd23f'); R(h.x - h.face * 6, h.y - 1, 3, 1, '#fff6'); } });
    } },
    s1: { name: 'Power Shot', cd: 3.5, hold: true, desc: 'HOLD to charge, release to fire. Longer charge = more damage.', fire(k) {
      act('shoot', 0.25); sfx(k > 0.7 ? 'boom' : 'shoot'); shake(2 + k * 5);
      const size = Math.round(4 + k * 8);
      shoot({ vx: 380 + k * 200, w: size + 4, h: size, life: 1.2, dmg: Math.round(20 + k * 95), pierce: k > 0.7 ? 4 : 1, ox: 18, oy: 12, opts: { kb: 80 + k * 220, crit: k > 0.95 },
        draw: h => { R(h.x - h.w / 2, h.y - h.h / 2, h.w, h.h, '#ff9f43'); R(h.x - h.w / 2 + 1, h.y - h.h / 2 + 1, h.w - 2, h.h - 2, '#ffe066'); particles(h.x - h.face * h.w / 2, h.y, 1, ['#ffd23f', '#ff7a00'], { spd: 20, life: 0.3, grav: 0 }); } });
      P.kx = -P.face * (40 + k * 120);
    } },
    s2: { name: 'Trick Shot', cd: 4, desc: 'A ricochet shot that bounces once and homes in on enemies.', use() {
      act('shoot', 0.2); sfx('shoot');
      const h = shoot({ vx: 300, w: 6, h: 6, life: 2.2, dmg: 34, pierce: 2, ox: 16, oy: 14, solid: true, opts: { kb: 120 },
        draw: hb => { R(hb.x - 3, hb.y - 3, 6, 6, '#ff4f6d'); R(hb.x - 1, hb.y - 1, 2, 2, '#fff'); particles(hb.x, hb.y, 1, ['#ff4f6d', '#ffd1dc'], { spd: 10, life: 0.3, grav: 0 }); },
        onGround(hb) {
          if (hb.bounced) { hb.dead = true; return; }
          hb.bounced = true; hb.y = GROUND - 4; sfx('hit'); particles(hb.x, GROUND, 6, ['#fff', '#ff4f6d'], { spd: 60 });
          retarget(hb);
        },
        onHit(hb) { retarget(hb); } });
      h.vy = 110;
    } },
    ult: { name: 'Mega Shot', desc: 'Charge a colossal shot that pierces across the entire screen.', use() {
      lock(0.9); sinv(0.9); act('shoot', 0.9, { charge: true }); sfx('ult');
      for (let i = 0; i < 6; i++) sched(i * 0.06, () => particles(P.x + P.face * 18, P.y - 12, 6, ['#ffd23f', '#fff', '#ff7a00'], { spd: 50, grav: 0 }));
      sched(0.45, () => {
        sfx('boom'); shake(10); P.kx = -P.face * 200;
        shoot({ vx: 720, w: 64, h: 28, life: 1.0, dmg: 170, ox: 30, oy: 12, opts: { kb: 260, crit: true },
          draw: h => { R(h.x - 32, h.y - 14, 64, 28, '#ff7a00'); R(h.x - 30, h.y - 10, 60, 20, '#ffd23f'); R(h.x - 26, h.y - 5, 52, 10, '#fff'); for (let i = 1; i < 6; i++) R(h.x - h.face * (32 + i * 14), h.y - 10 + i * 2, 12, 20 - i * 4, 'rgba(255,210,63,' + (0.8 - i * 0.13) + ')'); } });
      });
    } },
  },
  cook: {
    short: 'Cook', name: 'Remy Flambé', title: 'Kick Fighter / Cook', emoji: '🔥', role: 'Fast melee combo', hp: 100, spd: 106,
    unlock: { type: 'level', n: 3 },
    basic: { name: 'Kick Combo', cd: 0.22, desc: 'Fast 3-hit kick combo (3rd kick knocks back).', use() {
      if (G.t - P.comboT > 0.6) P.combo = 0;
      P.combo = (P.combo + 1) % 3; P.comboT = G.t;
      const last = P.combo === 0;
      act('kick', 0.13); sfx('punch');
      melee({ ox: 13, oy: last ? 14 : 8, w: 22, h: 14, dmg: last ? 20 : 11, opts: { kb: last ? 190 : 60 } });
    } },
    s1: { name: 'Fire Kick', cd: 4, desc: 'A blazing kick that sets enemies on fire.', use() {
      act('kick', 0.35, { fire: true }); lock(0.3); sfx('boom');
      P.dash = { vx: P.face * 170, until: G.t + 0.15 };
      melee({ ox: 16, oy: 12, w: 32, h: 26, dmg: 42, life: 0.2, opts: { kb: 230, burn: 2.5, colors: ['#ff7a00', '#ffd23f', '#ff3d00'] } });
      particles(P.x + P.face * 16, P.y - 12, 20, ['#ff7a00', '#ffd23f', '#ff3d00'], { spd: 110, grav: -60 });
      shake(3);
    } },
    s2: { name: 'Air Combo', cd: 6, desc: 'Launch enemies skyward and juggle them with kicks.', use() {
      act('kick', 0.2); sfx('skill');
      melee({ ox: 12, oy: 10, w: 26, h: 22, dmg: 14, opts: { launch: 320, kb: 10 } });
      P.vy = -320; P.onGround = false;
      for (let i = 0; i < 4; i++) sched(0.15 + i * 0.09, () => { act('kick', 0.08); sfx('punch'); melee({ ox: 10, oy: 16, w: 36, h: 40, dmg: 10, opts: { juggle: true, kb: 10 } }); particles(P.x + P.face * 12, P.y - 14, 4, ['#fff', '#ffd23f'], { spd: 70 }); });
      sched(0.55, () => { act('kick', 0.15); melee({ ox: 10, oy: 10, w: 40, h: 46, dmg: 24, opts: { spike: true, kb: 120 } }); shake(4); sfx('boom'); });
    } },
    ult: { name: 'Flame Leg Storm', desc: 'Dash across the screen unleashing a storm of fiery kicks.', use() {
      lock(1.2); sinv(1.3); sfx('ult');
      P.dash = { vx: P.face * 330, until: G.t + 1.1 };
      act('kick', 1.15, { fire: true });
      addHB({ follow: { ox: 8, oy: 14 }, w: 48, h: 40, life: 1.15, tick: 0.08, dmg: 10, opts: { burn: 3, kb: 40, colors: ['#ff7a00', '#ffd23f'] },
        draw(h) { for (let i = 0; i < 4; i++) R(h.x + rand(-22, 22), h.y + rand(-18, 18), 4, 4, pick(['#ff7a00', '#ffd23f', '#ff3d00'])); particles(P.x, P.y - 6, 2, ['#ff7a00', '#ffd23f'], { spd: 40, grav: -100, life: 0.5 }); } });
      const startX = P.x;
      sched(1.15, () => {
        // the whole flame trail erupts behind the dash
        const mid = (startX + P.x) / 2, len = Math.abs(P.x - startX) + 70;
        addHB({ x: mid, y: P.y - 16, w: len, h: 60, life: 0.15, dmg: 55, opts: { kb: 200, burn: 3, launch: 200, crit: true, colors: ['#ff7a00', '#ffd23f'] } });
        for (let i = 0; i < 12; i++) { const x = startX + (P.x - startX) * i / 11; particles(x, GROUND - 4, 5, ['#ff7a00', '#ffd23f', '#ff3d00'], { angle: -Math.PI / 2, spread: 0.6, spd: 160 }); }
        shake(10); sfx('boom');
      });
    } },
  },
  doctor: {
    short: 'Doctor', name: 'Doc Tansy', title: 'Pirate Doctor', emoji: '💊', role: 'Support / healing', hp: 95, spd: 88,
    unlock: { type: 'boss', n: 1 },
    basic: { name: 'Pill Toss', cd: 0.42, desc: 'Throw a small medical capsule.', use() {
      act('shoot', 0.14); sfx('shoot');
      const h = shoot({ vx: 250, w: 6, h: 4, life: 1.1, dmg: 13, ox: 10, oy: 14, grav: 260, solid: true, opts: { kb: 60 },
        draw: hb => { R(hb.x - 3, hb.y - 2, 3, 4, '#e23b3b'); R(hb.x, hb.y - 2, 3, 4, '#ffffff'); } });
      h.vy = -90;
    } },
    s1: { name: 'Heal', cd: 8, desc: 'Restore 35 HP.', use() {
      act('cast', 0.3); lock(0.25); heal(35);
      fx({ x: P.x, y: P.y - 12, life: 0.6, draw(f) { const r = 8 + f.age * 40; g.strokeStyle = 'rgba(142,245,155,' + (1 - f.age / f.life) + ')'; g.lineWidth = 2; g.strokeRect(P.x - r, P.y - 12 - r, r * 2, r * 2); } });
    } },
    s2: { name: 'Power Buff', cd: 14, desc: '+ATK, +DEF, +SPEED for 8s.', use() {
      act('cast', 0.3); sfx('skill');
      addBuff('BOOST', { atk: 1.35, def: 0.7, spd: 1.25 }, 8, '💉');
      particles(P.x, P.y - 12, 20, ['#ffd23f', '#ff4f6d', '#fff'], { grav: -80, spd: 60 });
      toast('POWER BUFF!');
    } },
    ult: { name: 'Full Recovery', desc: 'Massive heal + strong defense boost. The healing wave also repels enemies.', use() {
      act('cast', 0.8); lock(0.6); sinv(0.8); sfx('ult');
      heal(90);
      addBuff('ARMOR', { def: 0.45 }, 8, '🛡');
      melee({ ox: 0, oy: 12, w: 160, h: 70, dmg: 22, life: 0.2, opts: { kb: 260, colors: ['#8ef59b', '#fff'] } });
      fx({ x: P.x, y: P.y - 12, life: 0.8, draw(f) { const r = 10 + f.age * 140; g.strokeStyle = 'rgba(142,245,155,' + (1 - f.age / f.life) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(f.x, f.y, r, 0, Math.PI * 2); g.stroke(); } });
      toast('FULL RECOVERY!');
    } },
  },
  archaeologist: {
    short: 'Archaeologist', name: 'Iris Tidewell', title: 'Mystical Archaeologist', emoji: '🌊', role: 'Crowd control / area damage', hp: 95, spd: 92,
    unlock: { type: 'level', n: 4 },
    basic: { name: 'Spirit Hand', cd: 0.38, desc: 'A magic hand sprouts beneath an enemy. In Mermaid Form: water jet.', use() {
      act('cast', 0.15);
      if (P.form === 'mermaid') {
        sfx('water');
        shoot({ vx: 300, w: 12, h: 6, life: 0.7, dmg: 13, ox: 10, opts: { water: true, kb: 120, colors: ['#4dd0e1', '#fff'] }, draw: h => { R(h.x - 6, h.y - 2, 12, 4, '#4dd0e1'); R(h.x - 3, h.y - 1, 8, 2, '#e0f7fa'); } });
        return;
      }
      sfx('hit');
      const tgt = nearest(150, true);
      const x = tgt ? tgt.x : P.x + P.face * 55;
      spiritHand(x, 13, 0);
    } },
    s1: { name: 'Multiple Arms', cd: 6, desc: 'Arms sprout around up to 3 enemies and immobilize them.', use() {
      act('cast', 0.4); sfx('skill');
      const list = G.enemies.filter(e => e.alive && Math.abs(e.x - P.x) < 230).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x)).slice(0, 3);
      if (!list.length) list.push({ x: P.x + P.face * 70, y: GROUND, fake: true });
      for (const e of list) {
        for (let i = -1; i <= 1; i++) spiritHand(e.x + i * 9, 0, 0.05 * (i + 1));
        if (!e.fake) { e.active = true; hitEnemy(e, 26, { hold: 2.6, kb: 0, colors: ['#b388ff', '#fff'] }); }
      }
    } },
    s2: { name: 'Water Wave', cd: 6, desc: 'A large wave that pushes enemies far away.', use() {
      act('cast', 0.35); sfx('water');
      shoot({ vx: 210, w: 34, h: 38, life: 1.2, dmg: 22, pierce: Infinity, ox: 18, oy: 18, opts: { kb: 300, water: true, colors: ['#4dd0e1', '#fff'] },
        draw: h => waveDraw(h.x, h.y + 19, 34, 38, h.face) });
    } },
    s3: { name: 'Mermaid Form', cd: 16, desc: 'Transform: faster swimming movement and water attacks x1.8 for 8s.', use() {
      lock(0.4); sinv(0.4); sfx('water'); sfx('skill');
      particles(P.x, P.y - 10, 30, ['#4dd0e1', '#e0f7fa', '#80deea'], { grav: -60, spd: 70 });
      P.form = 'mermaid'; P.formUntil = G.t + 8;
      addBuff('MERMAID', { spd: 1.5 }, 8, '🧜');
      toast('MERMAID FORM!');
    } },
    ult: { name: 'Ocean Grab', desc: 'Giant arms seize every enemy on screen, then a huge wave crashes through.', use() {
      lock(1.2); sinv(1.4); act('cast', 1.2); sfx('ult');
      for (const e of onScreen()) {
        e.active = true;
        fx({ x: e.x, y: e.y, life: 1.2, draw(f) { const h = Math.min(1, f.age * 4) * 40; R(f.x - 14, f.y - h, 6, h, '#9575cd'); R(f.x + 8, f.y - h, 6, h, '#9575cd'); R(f.x - 16, f.y - h - 4, 10, 6, '#d1c4e9'); R(f.x + 6, f.y - h - 4, 10, 6, '#d1c4e9'); } });
        hitEnemy(e, 50, { hold: 3.2, kb: 0, colors: ['#b388ff', '#fff'] });
      }
      shake(5);
      sched(0.6, () => {
        shake(9); sfx('water');
        const h = addHB({ x: P.face > 0 ? G.cam - 40 : G.cam + W + 40, y: GROUND - 36, w: 90, h: 72, vx: P.face * 420, life: 1.5, dmg: 60, opts: { kb: 320, water: true, colors: ['#4dd0e1', '#fff'] } });
        h.face = P.face; h.draw = hb => waveDraw(hb.x, GROUND, 90, 72, hb.face);
      });
    } },
  },
  shipwright: {
    short: 'Shipwright', name: 'Bolt Ironkeel', title: 'Cyborg Shipwright', emoji: '🤖', role: 'Heavy ranged damage', hp: 130, spd: 82,
    unlock: { type: 'coins', n: 800 },
    basic: { name: 'Mech Punch / Cannon', cd: 0.45, desc: 'Mechanical punch up close, small cannon shot at range.', use() {
      const close = G.enemies.some(e => e.alive && Math.abs(e.x - (P.x + P.face * 14)) < 18 + e.w / 2 && Math.abs((e.y - e.h / 2) - (P.y - 12)) < 24);
      if (close) { act('punch', 0.15); sfx('punch'); melee({ ox: 14, oy: 12, w: 22, h: 16, dmg: 18, opts: { kb: 150 } }); shake(1); }
      else { act('shoot', 0.15); sfx('shoot'); shoot({ vx: 300, w: 6, h: 6, life: 0.9, dmg: 13, ox: 14, opts: { kb: 70 }, draw: h => { R(h.x - 3, h.y - 3, 6, 6, '#37474f'); R(h.x - 2, h.y - 2, 2, 2, '#90a4ae'); } }); }
    } },
    s1: { name: 'Mini Cannon', cd: 3.5, desc: 'Fire an explosive cannonball (area damage).', use() {
      act('shoot', 0.25); sfx('boom'); shake(2); P.kx = -P.face * 90;
      const h = shoot({ vx: 270, w: 10, h: 10, life: 1.6, dmg: 20, ox: 14, oy: 14, grav: 160, solid: true, opts: { kb: 60 },
        draw: hb => { R(hb.x - 5, hb.y - 5, 10, 10, '#263238'); R(hb.x - 3, hb.y - 3, 3, 3, '#78909c'); },
        onHit: hb => explode(hb.x, hb.y, 44), onGround: hb => { explode(hb.x, hb.y, 44); hb.dead = true; } });
      h.vy = -60;
    } },
    s2: { name: 'Rocket Arm', cd: 5, desc: 'Launch your mechanical arm forward — it returns to you.', use() {
      act('rocket', 0.95); sfx('skill');
      const h = shoot({ vx: 340, w: 14, h: 10, life: 0.95, dmg: 32, pierce: Infinity, ox: 12, oy: 12, opts: { kb: 200 },
        update(hb) {
          if (hb.age > 0.45 && !hb.ret) { hb.ret = true; hb.hits.clear(); }
          if (hb.ret) { const dx = P.x - hb.x, dy = (P.y - 12) - hb.y, d = Math.hypot(dx, dy) || 1; hb.vx = dx / d * 420; hb.vy = dy / d * 420; if (d < 10) hb.dead = true; }
          particles(hb.x - Math.sign(hb.vx) * 7, hb.y, 1, ['#ff7a00', '#ffd23f'], { spd: 20, life: 0.25, grav: 0 });
        },
        draw: hb => { g.strokeStyle = '#78909c'; g.lineWidth = 1; g.beginPath(); g.moveTo(P.x + P.face * 5, P.y - 11); g.lineTo(hb.x, hb.y); g.stroke(); R(hb.x - 7, hb.y - 4, 10, 8, '#9aa6b2'); R(hb.x + (hb.face > 0 ? 3 : -7), hb.y - 5, 4, 10, '#c9d2dc'); } });
      h.face = P.face;
    } },
    ult: { name: 'Mecha Cannon', desc: 'Transform into a walking fortress and fire a huge energy cannon.', use() {
      lock(1.7); sinv(1.7); act('shoot', 1.7, { cannon: true }); sfx('ult');
      for (let i = 0; i < 10; i++) sched(i * 0.06, () => { const a = rand(0, 6.28); G.parts.push({ x: P.x + P.face * 16 + Math.cos(a) * 30, y: P.y - 15 + Math.sin(a) * 30, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, life: 0.5, age: 0, c: '#4fc3f7', s: 2, grav: 0 }); });
      sched(0.65, () => {
        sfx('boom'); shake(8);
        addHB({ follow: { ox: 250, oy: 15 }, w: 470, h: 32, life: 0.95, tick: 0.1, dmg: 22, opts: { kb: 60, colors: ['#4fc3f7', '#fff'] },
          draw(h) {
            const x0 = P.x + P.face * 14, x1 = P.x + P.face * 480, y = P.y - 15, fl = Math.floor(G.t * 30) % 2;
            const L = Math.min(x0, x1), Wd = Math.abs(x1 - x0);
            R(L, y - 14 - fl, Wd, 28 + fl * 2, '#0288d1'); R(L, y - 9, Wd, 18, '#4fc3f7'); R(L, y - 4, Wd, 8, '#ffffff');
            shake(2);
          } });
      });
    } },
  },
  musician: {
    short: 'Musician', name: 'Maestro Vale', title: 'Musical Swordsman', emoji: '🎵', role: 'Support + sword fighter', hp: 100, spd: 96,
    unlock: { type: 'boss', n: 2 },
    basic: { name: 'Rapier', cd: 0.3, desc: 'Elegant sword thrust.', use() {
      act('slash', 0.14); sfx('slash');
      slashFx(P.x + P.face * 12, P.y - 12, 14, '#e1bee7', 1);
      melee({ ox: 15, oy: 12, w: 26, h: 14, dmg: 13, opts: { kb: 70 } });
    } },
    s1: { name: 'Sound Blast', cd: 4, desc: 'An expanding sound wave that damages and briefly stuns.', use() {
      act('cast', 0.3); sfx('melody');
      soundRing(220, 0.85, 26, 0.6);
    } },
    s2: { name: 'Music Buff', cd: 14, desc: 'A melody granting +attack speed, +move speed, +defense for 8s.', use() {
      act('cast', 0.6); sfx('melody');
      addBuff('MELODY', { aspd: 1.5, spd: 1.3, def: 0.7 }, 8, '🎶');
      for (let i = 0; i < 5; i++) sched(i * 0.12, () => noteParticle(P.x + rand(-10, 10), P.y - 26));
      toast('MUSIC BUFF!');
    } },
    ult: { name: 'Musical Blade', desc: 'A sword symphony with huge sound waves that stun every enemy they touch.', use() {
      lock(1.4); sinv(1.5); sfx('ult');
      for (let i = 0; i < 6; i++) sched(i * 0.15, () => {
        act('slash', 0.12); sfx('slash');
        const side = i % 2 ? -1 : 1;
        slashFx(P.x + P.face * side * 16, P.y - 12, 22, i % 2 ? '#ce93d8' : '#fff', side);
        melee({ ox: 18 * side, oy: 12, w: 50, h: 34, dmg: 18, opts: { kb: 40 } });
      });
      for (let i = 0; i < 3; i++) sched(0.3 + i * 0.35, () => {
        sfx('melody'); shake(5);
        const ring = addHB({ x: P.x, y: P.y - 14, w: 10, h: 10, life: 0.7, dmg: 25, opts: { stun: 2.6, kb: 30, colors: ['#ce93d8', '#fff'] },
          update(h) { const r = 10 + h.age * 300; h.w = r * 2; h.h = Math.min(r * 2, 90); },
          draw(h) { g.strokeStyle = 'rgba(206,147,216,' + (1 - h.age / h.life) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(h.x, h.y, h.w / 2, h.h / 2, 0, 0, Math.PI * 2); g.stroke(); } });
        for (let k = 0; k < 4; k++) noteParticle(ring.x + rand(-40, 40), ring.y + rand(-20, 10));
      });
    } },
  },
};
const CH_ORDER = ['captain', 'swordsman', 'navigator', 'sniper', 'cook', 'doctor', 'archaeologist', 'shipwright', 'musician'];

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

// =========================================================
// ENEMIES
// =========================================================
const ENEMY = {
  slime: { w: 14, h: 10, hp: 30, dmg: 10, spd: 40, score: 50, coins: 10 },
  grunt: { w: 12, h: 22, hp: 55, dmg: 12, spd: 36, score: 100, coins: 15 },
  gunner: { w: 12, h: 22, hp: 45, dmg: 12, spd: 32, score: 120, coins: 20 },
  flyer: { w: 16, h: 12, hp: 28, dmg: 10, spd: 55, score: 80, coins: 10, fly: true },
  heavy: { w: 26, h: 30, hp: 170, dmg: 18, spd: 22, score: 250, coins: 40, kbRes: 0.85, heavy: true },
  crab: { w: 60, h: 40, hp: 950, dmg: 20, spd: 40, score: 2000, coins: 250, boss: true, name: 'IRONCLAW CRAB' },
  kraken: { w: 56, h: 60, hp: 1800, dmg: 24, spd: 30, score: 5000, coins: 500, boss: true, name: 'ADMIRAL MURKFANG' },
};
let eid = 1;
function spawnEnemy(type, x, y, lvl) {
  const D = ENEMY[type];
  const hpMul = [1, 1.15, 1.4, 1.55, 1.75][lvl - 1] || 1, dmgMul = [1, 1.05, 1.15, 1.25, 1.35][lvl - 1] || 1;
  const e = {
    id: eid++, type, x, y: y != null ? y : GROUND, w: D.w, h: D.h,
    hp: Math.round(D.hp * (D.boss ? 1 : hpMul)), dmg: Math.round(D.dmg * (D.boss ? 1 : dmgMul)), spd: D.spd,
    score: D.score, coins: D.coins, fly: !!D.fly, boss: !!D.boss, heavy: !!D.heavy, kbRes: D.kbRes || (D.boss ? 1 : 0),
    vx: 0, vy: 0, kx: 0, face: -1, onGround: true, alive: true, active: false, flash: 0,
    stunUntil: 0, holdUntil: 0, flinch: 0, burnUntil: 0, burnNext: 0, st: 'idle', stT: rand(0.5, 1.5), cd: rand(0.5, 1.5), baseY: y || 0, name: D.name,
  };
  e.maxHp = e.hp;
  if (type === 'slime' && lvl >= 3) { e.tint = '#5ab4ff'; e.tint2 = '#2f78c9'; }
  G.enemies.push(e);
  return e;
}

const AI = {
  slime(e, dt) {
    e.face = Math.sign(P.x - e.x) || e.face;
    if (e.onGround) {
      e.vx *= 0.8;
      e.cd -= dt;
      if (e.cd <= 0) { e.cd = rand(0.8, 1.4); e.vy = -rand(170, 230); e.vx = e.face * rand(50, 80); e.onGround = false; }
    }
  },
  grunt(e, dt) {
    const dx = P.x - e.x;
    e.stT -= dt;
    if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'swing'; e.stT = 0.18; addHazard({ x: e.x + e.face * 16, y: e.y - 12, w: 22, h: 18, life: 0.15, dmg: e.dmg, kind: 'none', once: true }); sfx('slash'); } return; }
    if (e.st === 'swing') { e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 1.0; } return; }
    e.face = Math.sign(dx) || e.face;
    if (Math.abs(dx) < 24 && e.stT <= 0 && Math.abs(P.y - e.y) < 30) { e.st = 'wind'; e.stT = 0.45; e.vx = 0; }
    else e.vx = Math.abs(dx) > 14 ? e.face * e.spd : 0;
  },
  gunner(e, dt) {
    const dx = P.x - e.x;
    e.face = Math.sign(dx) || e.face;
    e.stT -= dt;
    if (e.st === 'wind') { e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = rand(1.6, 2.4); sfx('shoot'); addHazard({ x: e.x + e.face * 14, y: e.y - 13, vx: e.face * 170, w: 5, h: 3, life: 2.5, dmg: e.dmg, kind: 'bullet' }); } return; }
    const ad = Math.abs(dx);
    if (ad < 110) e.vx = -e.face * e.spd; else if (ad > 190) e.vx = e.face * e.spd; else e.vx = 0;
    if (e.stT <= 0 && ad < 240) { e.st = 'wind'; e.stT = 0.45; }
  },
  flyer(e, dt) {
    e.stT -= dt;
    const dx = P.x - e.x;
    if (e.st === 'swoop') {
      const tx = e.tx - e.x, ty = e.ty - e.y, d = Math.hypot(tx, ty);
      if (d < 6 || e.stT <= 0) { e.st = 'rise'; e.stT = 1; }
      else { e.vx = tx / d * 150; e.y += ty / d * 150 * dt; }
      return;
    }
    if (e.st === 'rise') { e.y += (e.baseY - e.y) * Math.min(1, dt * 2.5); e.vx = -e.face * 40; if (e.stT <= 0) { e.st = 'idle'; e.stT = rand(1.8, 2.8); } return; }
    e.face = Math.sign(dx) || e.face;
    e.vx = Math.abs(dx) > 50 ? e.face * e.spd : 0;
    e.y = e.baseY + Math.sin(G.t * 3 + e.id) * 8;
    if (e.stT <= 0 && Math.abs(dx) < 140) { e.st = 'swoop'; e.tx = P.x; e.ty = P.y - 8; e.stT = 1.2; }
  },
  heavy(e, dt) {
    const dx = P.x - e.x;
    e.stT -= dt;
    if (e.st === 'wind') {
      e.vx = 0;
      if (e.stT <= 0) {
        e.st = 'idle'; e.stT = 1.6; shake(4); sfx('boom');
        addHazard({ x: e.x, y: GROUND - 8, w: 54, h: 16, life: 0.15, dmg: e.dmg, kind: 'none' });
        for (const s of [-1, 1]) addHazard({ x: e.x + s * 20, y: GROUND - 5, vx: s * 150, w: 10, h: 10, life: 0.9, dmg: Math.round(e.dmg * 0.7), kind: 'shock' });
        particles(e.x, GROUND, 14, ['#c8a26a', '#fff'], { angle: -Math.PI / 2, spread: 1.3, spd: 120 });
      }
      return;
    }
    e.face = Math.sign(dx) || e.face;
    if (Math.abs(dx) < 60 && e.stT <= 0) { e.st = 'wind'; e.stT = 0.7; e.vx = 0; }
    else e.vx = Math.abs(dx) > 20 ? e.face * e.spd : 0;
  },
  crab(e, dt) {
    const sp = e.phase2 ? 1.35 : 1;
    if (!e.phase2 && e.hp < e.maxHp / 2) { e.phase2 = true; toast('IRONCLAW IS ENRAGED!'); }
    e.stT -= dt * sp;
    const dx = P.x - e.x;
    switch (e.st) {
      case 'idle':
        e.face = Math.sign(dx) || e.face; e.vx = Math.abs(dx) > 40 ? e.face * e.spd : 0;
        if (e.stT <= 0) { e.pat = ((e.pat || 0) + 1) % 3; e.st = ['wind', 'bubbles', 'jump'][e.pat]; e.stT = e.st === 'wind' ? 0.7 : 0.4; e.shots = 0; }
        break;
      case 'wind': e.vx = 0; e.x += Math.sin(G.t * 60) * 0.6; if (e.stT <= 0) { e.st = 'charge'; e.face = Math.sign(dx) || e.face; } break;
      case 'charge':
        e.vx = e.face * 230 * sp;
        if ((e.face > 0 && e.x >= G.arenaX + W - 34) || (e.face < 0 && e.x <= G.arenaX + 34)) { e.vx = 0; e.st = 'dizzy'; e.stT = 1; shake(6); sfx('boom'); e.stunUntil = G.t + 0.9; }
        break;
      case 'dizzy': e.vx = 0; if (e.stT <= 0) { e.st = 'idle'; e.stT = 1; } break;
      case 'bubbles':
        e.vx = 0; e.face = Math.sign(dx) || e.face;
        if (e.stT <= 0) {
          e.stT = 0.18; e.shots++;
          addHazard({ x: e.x + e.face * 30, y: e.y - 28, vx: e.face * rand(80, 220), vy: rand(-260, -160), grav: 380, w: 9, h: 9, life: 3, dmg: 14, kind: 'bubble' });
          sfx('water');
          if (e.shots >= (e.phase2 ? 7 : 5)) { e.st = 'idle'; e.stT = 1.2; }
        }
        break;
      case 'jump':
        if (e.stT <= 0 && e.onGround && !e.jumped) { e.jumped = true; e.vy = -430; e.onGround = false; e.vx = clamp((P.x - e.x) * 1.0, -220, 220); }
        else if (e.jumped && e.onGround) {
          e.jumped = false; e.vx = 0; e.st = 'idle'; e.stT = 1.3; shake(8); sfx('boom');
          addHazard({ x: e.x, y: GROUND - 10, w: 80, h: 20, life: 0.15, dmg: 20, kind: 'none' });
          for (const s of [-1, 1]) addHazard({ x: e.x + s * 30, y: GROUND - 6, vx: s * 190, w: 12, h: 12, life: 1.6, dmg: 14, kind: 'shock' });
        }
        break;
    }
  },
  kraken(e, dt) {
    const sp = e.phase2 ? 1.4 : 1;
    if (!e.phase2 && e.hp < e.maxHp / 2) { e.phase2 = true; toast('MURKFANG IS FURIOUS!'); shake(8); }
    e.stT -= dt * sp;
    const dx = P.x - e.x;
    switch (e.st) {
      case 'idle':
        e.face = Math.sign(dx) || e.face; e.vx = Math.abs(dx) > 90 ? e.face * e.spd : (Math.abs(dx) < 50 ? -e.face * e.spd : 0);
        if (e.stT <= 0) { e.pat = ((e.pat || 0) + 1) % 4; e.st = ['cannons', 'tentacles', 'summon', 'wind'][e.pat]; e.stT = 0.5; e.shots = 0; }
        break;
      case 'cannons':
        e.vx = 0; e.face = Math.sign(dx) || e.face;
        if (e.stT <= 0) {
          e.stT = 0.35; e.shots++;
          const tx = P.x + rand(-40, 40), tt = 1.0, vx = (tx - e.x) / tt, vy = -0.5 * 400 * tt + (GROUND - (e.y - 30) - 0) / tt;
          addHazard({ x: e.x + e.face * 30, y: e.y - 30, vx, vy: Math.min(vy, -150), grav: 400, w: 10, h: 10, life: 3, dmg: 18, kind: 'cannon', boom: true });
          sfx('boom');
          if (e.shots >= (e.phase2 ? 5 : 3)) { e.st = 'idle'; e.stT = 1.2; }
        }
        break;
      case 'tentacles':
        e.vx = 0;
        if (e.stT <= 0) {
          const xs = [P.x, P.x - 70, P.x + 70];
          if (e.phase2) xs.push(P.x - 140, P.x + 140);
          for (const x of xs) addHazard({ x: clamp(x, G.arenaX + 10, G.arenaX + W - 10), y: GROUND - 30, w: 18, h: 60, delay: 0.9, life: 1.5, dmg: 20, kind: 'tentacle', once: true });
          e.st = 'idle'; e.stT = 2;
        }
        break;
      case 'summon':
        e.vx = 0;
        if (e.stT <= 0) {
          const minions = G.enemies.filter(m => m.alive && !m.boss).length;
          if (minions < 4) { const m1 = spawnEnemy('slime', e.x - 40, GROUND, 5); m1.active = true; const m2 = spawnEnemy('flyer', e.x, 150, 5); m2.active = true; m2.baseY = 150; m1.coins = m2.coins = 5; }
          particles(e.x, e.y - 30, 20, ['#7b3fb3', '#c79bf2'], { spd: 100 });
          e.st = 'idle'; e.stT = 1.5;
        }
        break;
      case 'wind': e.vx = 0; e.x += Math.sin(G.t * 60) * 0.6; if (e.stT <= 0) { e.st = 'charge'; e.face = Math.sign(dx) || e.face; } break;
      case 'charge':
        e.vx = e.face * 250 * sp;
        if (Math.random() < 0.5) particles(e.x - e.face * 20, e.y - 20, 1, ['#3b0f5c', '#111'], { spd: 20, grav: 0 });
        if ((e.face > 0 && e.x >= G.arenaX + W - 34) || (e.face < 0 && e.x <= G.arenaX + 34)) { e.vx = 0; e.st = 'idle'; e.stT = 1.4; shake(7); sfx('boom'); e.stunUntil = G.t + 0.8; }
        break;
    }
  },
};

function updateEnemy(e, dt) {
  if (!e.active) { if (Math.abs(e.x - P.x) < 300) e.active = true; else return; }
  e.flash -= dt;
  if (G.t < e.burnUntil && G.t >= e.burnNext) { e.burnNext = G.t + 0.3; hitEnemy(e, 4, { kb: 0, colors: ['#ff7a00', '#ffd23f'] }); if (!e.alive) return; }
  const stunned = G.t < e.stunUntil || G.t < e.holdUntil;
  if (!stunned) AI[e.type](e, dt);
  else { e.vx = 0; if (e.st === 'charge') e.st = 'idle'; }
  if (!e.fly) {
    e.vy += GRAV * dt; e.y += e.vy * dt;
    if (e.y >= GROUND) { e.y = GROUND; e.vy = 0; e.onGround = true; } else e.onGround = false;
  } else if (e.vy) {
    e.y += e.vy * dt; e.vy *= 0.9; if (Math.abs(e.vy) < 5) e.vy = 0; e.y = Math.min(e.y, GROUND - 4);
  }
  if (G.t < e.holdUntil) { e.kx = 0; if (!e.fly && e.vy < 0) e.vy = 0; }
  e.x += (e.vx + e.kx) * dt;
  e.kx -= e.kx * Math.min(1, 8 * dt);
  const minX = G.arena ? G.arenaX + 10 : 10, maxX = G.arena ? G.arenaX + W - 10 : G.worldW - 10;
  e.x = clamp(e.x, minX, maxX);
  if (!stunned && !(G.t < e.flinch) && overlap(enemyRect(e), playerRect())) hurtPlayer(e.dmg, e.x);
}

// =========================================================
// LEVELS
// =========================================================
const LEVELS = [
  { n: 1, name: 'Sunny Shore', theme: 'day', len: 2400, mix: { slime: 8, grunt: 4 }, coins: 16, desc: 'Easy enemies' },
  { n: 2, name: 'Palm Jungle', theme: 'jungle', len: 2800, mix: { slime: 7, grunt: 7, flyer: 5 }, coins: 18, desc: 'More enemies' },
  { n: 3, name: 'Sunset Reef', theme: 'sunset', len: 3000, mix: { slime: 5, grunt: 7, flyer: 4, heavy: 3 }, coins: 20, boss: 'crab', bossN: 1, desc: 'Stronger enemies + Boss' },
  { n: 4, name: 'Moonlit Cove', theme: 'night', len: 3200, mix: { slime: 4, grunt: 4, gunner: 6, flyer: 7, heavy: 3 }, coins: 22, desc: 'New enemy types' },
  { n: 5, name: 'Storm Fortress', theme: 'storm', len: 2800, mix: { slime: 3, grunt: 5, gunner: 4, flyer: 5, heavy: 3 }, coins: 22, boss: 'kraken', bossN: 2, desc: 'FINAL BOSS' },
];

function startLevel(n, charId) {
  const L = LEVELS[n - 1];
  const D = CH[charId];
  const rng = seeded(n * 977);
  eid = 1;
  G = {
    level: n, L, theme: L.theme, worldW: L.len, t: 0, running: true, paused: false, over: false, won: false,
    enemies: [], hbs: [], hz: [], hearts: [], parts: [], texts: [], fx: [], coins: [], timers: [], plats: [],
    cam: 0, shake: 0, flash: 0, weather: 0, score: 0, coinCount: 0,
    stats: { kills: 0, dmg: 0, hurt: 0 },
    arena: false, arenaX: L.boss ? L.len - W : 0, boss: null, chest: null, endT: 0,
  };
  P = {
    id: charId, x: 40, y: GROUND, w: 12, h: 22, vx: 0, vy: 0, kx: 0, face: 1, onGround: true, coyote: 0,
    hp: D.hp, maxHp: D.hp, energy: 0, cd: { basic: 0, s1: 0, s2: 0, s3: 0 }, buffs: [],
    inv: 0, sinv: 0, lockUntil: 0, dash: null, act: null, stretch: null, walk: 0, combo: 0, comboT: 0,
    charging: null, form: null, formUntil: 0, transform: 0,
  };
  // platforms + coins
  const endX = L.boss ? G.arenaX - 120 : L.len - 160;
  for (let x = 260; x < endX; x += 220 + Math.floor(rng() * 140)) {
    const w = 48 + Math.floor(rng() * 4) * 12, y = rng() < 0.5 ? 192 : 172;
    G.plats.push({ x, y, w });
    for (let i = 0; i < 3; i++) G.coins.push({ x: x + w / 2 - 12 + i * 12, y: y - 10, vx: 0, vy: 0, v: 5, age: 0, placed: true });
  }
  for (let i = 0; i < L.coins - G.plats.length * 3 / 3; i++) {
    const x = 180 + rng() * (endX - 180);
    G.coins.push({ x, y: GROUND - 8 - Math.floor(rng() * 3) * 10, vx: 0, vy: 0, v: 5, age: 0, placed: true });
  }
  // enemies (shuffled, spread out)
  const types = [];
  for (const [t, c] of Object.entries(L.mix)) for (let i = 0; i < c; i++) types.push(t);
  for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
  const sx = 340, ex = endX;
  types.forEach((t, i) => {
    const x = sx + (ex - sx) * (i / Math.max(1, types.length - 1)) + (rng() - 0.5) * 40;
    const e = spawnEnemy(t, x, t === 'flyer' ? 140 + rng() * 40 : GROUND, n);
    if (t === 'flyer') e.baseY = e.y;
  });
  if (!L.boss) G.chest = { x: L.len - 60, open: false };
  P.face = 1;
  setupHUD();
  showScreen(null);
  $('#hud').classList.remove('hidden');
  updateTouchVisibility();
  input.queue.length = 0;
  for (const k in input.held) input.held[k] = false;
  toast('LEVEL ' + n + ': ' + L.name.toUpperCase(), 2);
  save.selected = charId; persist();
}

function bossDefeated(e) {
  G.boss = null;
  shake(14);
  toast(e.name + ' DEFEATED!', 2.5);
  const n = G.L.bossN;
  if (!save.bosses.includes(n)) { save.bosses.push(n); persist(); }
  for (const m of G.enemies) if (m.alive) { m.alive = false; particles(m.x, m.y - m.h / 2, 8, ['#fff'], {}); }
  G.hz.length = 0;
  const cx = P.x < G.arenaX + W / 2 ? P.x + 70 : P.x - 70;
  G.chest = { x: clamp(cx, G.arenaX + 30, G.arenaX + W - 30), open: false, drop: -60 };
}

// =========================================================
// UPDATE
// =========================================================
function update(dt) {
  G.t += dt;
  // queued input
  while (input.queue.length) {
    const [a, down] = input.queue.shift();
    if (a === 'pause') { if (down) togglePause(); continue; }
    if (G.over || G.won) continue;
    if (down) {
      if (a === 'jump') tryJump();
      else if (a === 'attack') tryBasic();
      else if (a === 's1' || a === 's2' || a === 's3' || a === 'ult') trySkill(a);
    } else if (P.charging && P.charging.slot === a) releaseCharge();
  }
  if (!G.over && !G.won && input.held.attack) tryBasic();

  // timers
  if (G.timers.length) {
    const due = G.timers.filter(t => t.at <= G.t);
    if (due.length) { G.timers = G.timers.filter(t => t.at > G.t); for (const t of due) if (!G.over) t.fn(); }
  }
  updatePlayer(dt);
  for (const e of G.enemies) if (e.alive) updateEnemy(e, dt);
  if (G.enemies.length > 80) G.enemies = G.enemies.filter(e => e.alive);
  updateHitboxes(dt);
  updateHazards(dt);
  updateCoins(dt);
  updateFx(dt);
  updateChest(dt);

  // boss arena trigger
  const L = G.L;
  if (L.boss && !G.arena && P.x > G.arenaX + 60 && !save._noBoss) {
    G.arena = true;
    G.boss = spawnEnemy(L.boss, G.arenaX + W - 70, GROUND, G.level);
    G.boss.active = true; G.boss.face = -1; G.boss.stT = 1.5;
    toast('BOSS: ' + G.boss.name, 2.2); sfx('ult'); shake(6);
    for (const e of G.enemies) if (e.alive && e !== G.boss && e.x < G.arenaX) e.alive = false;
  }
  // camera
  let target = P.x - W * 0.42;
  if (G.arena) target = G.arenaX;
  target = clamp(target, 0, G.worldW - W);
  G.cam += (target - G.cam) * Math.min(1, dt * 8);
  G.shake = Math.max(0, G.shake - dt * 30);
  G.flash = Math.max(0, G.flash - dt);
  if (G.won && G.t > G.endT) finishLevel(true);
  else if (G.over && G.t > G.endT) finishLevel(false);
}

function tryJump() {
  if (P.lockUntil > G.t && !P.dash) return;
  if (P.onGround || P.coyote > 0) { P.vy = -335; P.onGround = false; P.coyote = 0; sfx('jump'); particles(P.x, P.y, 4, ['#fff', '#ddd'], { angle: -Math.PI / 2, spread: 1.2, spd: 40 }); }
}
function tryBasic() {
  if (G.t < P.cd.basic || G.t < P.lockUntil || P.charging) return;
  const D = CH[P.id];
  D.basic.use();
  P.cd.basic = G.t + D.basic.cd / statMul('aspd');
}
function trySkill(slot) {
  const D = CH[P.id], sk = D[slot];
  if (!sk || P.charging) return;
  if (G.t < P.lockUntil) return;
  if (slot === 'ult') {
    if (P.energy < 100) { toast('ULTIMATE CHARGING… ' + Math.floor(P.energy) + '%', 0.9); return; }
    P.energy = 0;
    G.flash = 0.12;
    toast(sk.name.toUpperCase() + '!', 1.2);
    sk.use();
    return;
  }
  if (G.t < P.cd[slot]) return;
  if (sk.hold) { P.charging = { slot, start: G.t }; return; }
  sk.use();
  P.cd[slot] = G.t + sk.cd;
}
function releaseCharge() {
  const c = P.charging; P.charging = null;
  const sk = CH[P.id][c.slot];
  const k = clamp((G.t - c.start) / 1.2, 0, 1);
  sk.fire(k);
  P.cd[c.slot] = G.t + sk.cd;
}

function updatePlayer(dt) {
  const D = CH[P.id];
  if (P.form && G.t > P.formUntil) { P.form = null; particles(P.x, P.y - 10, 12, ['#4dd0e1', '#fff'], {}); }
  P.buffs = P.buffs.filter(b => G.t < b.until);
  P.energy = Math.min(100, P.energy + dt * 2.2);
  if (P.coyote > 0) P.coyote -= dt;
  const locked = G.t < P.lockUntil;
  let spd = D.spd * statMul('spd');
  if (P.charging) spd *= 0.4;
  if (P.dash && G.t < P.dash.until) { P.vx = P.dash.vx; }
  else {
    P.dash = null;
    if (locked || G.over || G.won) P.vx = 0;
    else {
      const dir = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0);
      P.vx = dir * spd;
      if (dir) P.face = dir;
    }
  }
  if (P.charging) {
    if (Math.random() < 0.5) particles(P.x + P.face * 18, P.y - 12, 1, ['#ffd23f', '#ff7a00', '#fff'], { spd: 30, grav: 0, life: 0.3 });
  }
  if (P.transform > G.t && Math.random() < 0.6) particles(P.x + rand(-6, 6), P.y - rand(0, 24), 1, ['#fff', '#ffd1dc'], { grav: -120, spd: 20 });
  if (hasBuff('POWER') && Math.random() < 0.25) particles(P.x + rand(-5, 5), P.y - rand(5, 22), 1, ['#ffffffaa', '#ffd1dc'], { grav: -90, spd: 15, life: 0.6 });
  if (P.form === 'mermaid' && Math.random() < 0.2) particles(P.x + rand(-6, 6), P.y - rand(0, 20), 1, ['#4dd0e1', '#e0f7fa'], { grav: -60, spd: 10, life: 0.8 });
  // physics
  const prevY = P.y;
  P.vy += GRAV * dt;
  if (P.vy > 600) P.vy = 600;
  P.y += P.vy * dt;
  const wasGround = P.onGround;
  P.onGround = false;
  if (P.vy >= 0) {
    for (const pl of G.plats) {
      if (P.x + 4 > pl.x && P.x - 4 < pl.x + pl.w && prevY <= pl.y + 0.5 && P.y >= pl.y && !input.held.down) { P.y = pl.y; P.vy = 0; P.onGround = true; }
    }
    if (P.y >= GROUND) { P.y = GROUND; P.vy = 0; P.onGround = true; }
  }
  if (wasGround && !P.onGround && P.vy >= 0) P.coyote = 0.08;
  P.x += (P.vx + P.kx) * dt;
  P.kx -= P.kx * Math.min(1, 7 * dt);
  const minX = G.arena ? G.arenaX + 8 : 8, maxX = G.arena ? G.arenaX + W - 8 : G.worldW - 8;
  P.x = clamp(P.x, minX, maxX);
  if (Math.abs(P.vx) > 1 && P.onGround) P.walk += dt * 10 * (Math.abs(P.vx) / 90); else P.walk = 0;
}

function updateHitboxes(dt) {
  for (const h of G.hbs) {
    h.age += dt;
    if (h.age >= h.life) { h.dead = true; continue; }
    if (h.follow) { h.x = P.x + P.face * h.follow.ox; h.y = P.y - h.follow.oy; }
    else { h.vy += h.grav * dt; h.x += h.vx * dt; h.y += h.vy * dt; }
    if (h.update) h.update(h, dt);
    if (h.dead) continue;
    if (h.solid && h.y + h.h / 2 >= GROUND) { if (h.onGround) h.onGround(h); else h.dead = true; if (h.dead) continue; }
    if (!h.follow && (h.x < G.cam - 140 || h.x > G.cam + W + 140)) { h.dead = true; continue; }
    if (h.age < h.delay) continue;
    const r = hbRect(h);
    for (const e of G.enemies) {
      if (!e.alive) continue;
      if (!overlap(r, enemyRect(e))) continue;
      const last = h.hits.get(e);
      if (last !== undefined && (h.tick === 0 || G.t - last < h.tick)) continue;
      h.hits.set(e, G.t);
      hitEnemy(e, h.dmg, h.opts, h);
      if (h.onHit) h.onHit(h, e);
      h.pierce--;
      if (h.pierce <= 0) { h.dead = true; break; }
    }
  }
  G.hbs = G.hbs.filter(h => !h.dead);
}

function updateHazards(dt) {
  const pr = playerRect();
  for (const h of G.hz) {
    h.age += dt;
    if (h.age >= h.life) { h.dead = true; continue; }
    h.vy += h.grav * dt; h.x += h.vx * dt; h.y += h.vy * dt;
    if (h.grav && h.y + h.h / 2 >= GROUND) {
      h.dead = true;
      if (h.boom) { shake(3); particles(h.x, GROUND, 12, ['#ff7a00', '#ffd23f', '#555'], { spd: 110 }); addHazard({ x: h.x, y: GROUND - 10, w: 36, h: 20, life: 0.12, dmg: h.dmg, kind: 'none' }); }
      else particles(h.x, GROUND - 2, 5, ['#b3e5fc', '#fff'], { spd: 60 });
      continue;
    }
    if (h.age < h.delay) continue;
    if (overlap({ x: h.x - h.w / 2, y: h.y - h.h / 2, w: h.w, h: h.h }, pr)) {
      hurtPlayer(h.dmg, h.x);
      if (h.once && h.kind !== 'tentacle' && h.kind !== 'none') h.dead = true;
    }
  }
  G.hz = G.hz.filter(h => !h.dead);
}

function updateCoins(dt) {
  for (const c of G.coins) {
    c.age += dt;
    const dx = P.x - c.x, dy = (P.y - 12) - c.y, d = Math.hypot(dx, dy);
    if (c.age > 0.35 && d < 42) { c.x += dx / d * 220 * dt; c.y += dy / d * 220 * dt; }
    else if (!c.placed) {
      c.vy += GRAV * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.y >= GROUND - 4) { c.y = GROUND - 4; c.vy = -c.vy * 0.4; c.vx *= 0.7; if (Math.abs(c.vy) < 30) c.vy = 0; }
    }
    if (d < 10 && c.age > 0.2) {
      c.got = true; G.coinCount += c.v; G.score += c.v * 2;
      popText(c.x, c.y - 6, '+' + c.v, '#ffd23f'); sfx('coin');
    }
  }
  G.coins = G.coins.filter(c => !c.got);
  for (const h of G.hearts) {
    h.age += dt; h.vy += GRAV * 0.5 * dt; h.y += h.vy * dt;
    if (h.y >= GROUND - 5) { h.y = GROUND - 5; h.vy = 0; }
    if (h.age > 0.3 && Math.abs(P.x - h.x) < 10 && Math.abs(P.y - 10 - h.y) < 16) { h.got = true; heal(15); }
    if (h.age > 12) h.got = true;
  }
  G.hearts = G.hearts.filter(h => !h.got);
}

function updateFx(dt) {
  for (const p of G.parts) { p.age += dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  G.parts = G.parts.filter(p => p.age < p.life);
  if (G.parts.length > 600) G.parts.splice(0, G.parts.length - 600);
  for (const t of G.texts) t.age += dt;
  G.texts = G.texts.filter(t => t.age < t.life);
  for (const f of G.fx) f.age += dt;
  G.fx = G.fx.filter(f => f.age < f.life);
}

function updateChest(dt) {
  const c = G.chest;
  if (!c) return;
  if (c.drop != null && c.drop < 0) c.drop = Math.min(0, c.drop + dt * 120);
  if (!c.open && Math.abs(P.x - c.x) < 16 && !G.over) {
    c.open = true; sfx('open');
    const bonus = 50 + G.level * 30;
    G.coinCount += bonus; G.score += bonus * 2;
    popText(c.x, GROUND - 34, '+' + bonus + ' COINS', '#ffd23f', true);
    for (let i = 0; i < 14; i++) G.parts.push({ x: c.x, y: GROUND - 18, vx: rand(-60, 60), vy: rand(-220, -120), life: 1, age: 0, c: '#ffd23f', s: 3, grav: 500 });
    sfx('coin');
    particles(c.x, GROUND - 16, 30, ['#ffd23f', '#fff8c2', '#ff4f6d'], { angle: -Math.PI / 2, spread: 0.9, spd: 180 });
    toast('TREASURE FOUND!', 1.6);
    G.won = true; G.endT = G.t + 1.8;
  }
}

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
  drawBackground(G.theme, cam, G.t, G.worldW);
  g.save();
  g.translate(-cam + sh, shy);
  for (const pl of G.plats) if (pl.x + pl.w > cam && pl.x < cam + W) drawPlatform(pl, G.theme);
  g.restore();
  g.save(); g.translate(sh, shy); drawGround(G.theme, cam); g.restore();
  g.save();
  g.translate(-cam + sh, shy);
  // arena walls
  if (G.arena) { for (const x of [G.arenaX, G.arenaX + W - 4]) { R(x, 120, 4, GROUND - 120, '#5a3412'); R(x, 120, 4, 3, '#ffd23f'); } }
  else if (G.L.boss && !G.boss) { R(G.arenaX + 60, GROUND - 40, 3, 40, '#5a3412'); R(G.arenaX + 63, GROUND - 40, 16, 10, '#c22'); R(G.arenaX + 67, GROUND - 37, 6, 4, '#fff'); }
  if (G.chest) { g.save(); g.translate(0, G.chest.drop || 0); drawChest(G.chest); g.restore(); }
  for (const h of G.hearts) if (h.age < 9 || Math.floor(G.t * 8) % 2) drawHeart(h.x, h.y + Math.sin(G.t * 5) * 1.5);
  for (const c of G.coins) if (c.x > cam - 10 && c.x < cam + W + 10) drawCoin(c.x, c.y, G.t + c.x * 0.01);
  for (const e of G.enemies) {
    if (!e.alive || e.x < cam - 60 || e.x > cam + W + 60) continue;
    drawEnemy(e);
    if (!e.boss && e.hp < e.maxHp) { R(e.x - 8, e.y - e.h - 5, 16, 2, '#300'); R(e.x - 8, e.y - e.h - 5, 16 * e.hp / e.maxHp, 2, '#ff5252'); }
  }
  // enemy hazards
  for (const h of G.hz) drawHazard(h);
  // player
  drawPlayer();
  for (const h of G.hbs) if (h.draw && h.age >= (h.delay || 0)) h.draw(h);
  for (const f of G.fx) if (f.draw) f.draw(f);
  for (const p of G.parts) R(p.x, p.y, p.s, p.s, p.c);
  for (const t of G.texts) { const k = t.age / t.life; g.globalAlpha = 1 - k * k; pxText(t.str, t.x, t.y - t.age * 24, t.color); g.globalAlpha = 1; }
  // charge meter
  if (P.charging) {
    const k = clamp((G.t - P.charging.start) / 1.2, 0, 1);
    R(P.x - 12, P.y - 34, 24, 4, '#000'); R(P.x - 11, P.y - 33, 22 * k, 2, k >= 1 ? '#fff' : '#ffd23f');
  }
  // direction hint
  if (!G.arena && G.chest && !G.chest.open && G.chest.x - P.x > 200 && Math.floor(G.t * 2) % 2) pxText('→', cam + W - 16, 140, '#ffd23f');
  g.restore();
  // weather overlay
  const storming = G.t < G.weather;
  if (storming || THEMES[G.theme].rain) {
    if (storming) { g.fillStyle = 'rgba(15,20,50,0.38)'; g.fillRect(0, 0, W, H); }
    const n = storming ? 120 : 40;
    for (let i = 0; i < n; i++) { const x = (i * 53 + G.t * 300 + (i % 7) * 40) % (W + 40) - 20, y = (i * 37 + G.t * (500 + (i % 5) * 60)) % H; R(x, y, 1, 6, storming ? '#9fd8ff' : '#9fd8ff88'); }
    if (G.theme === 'storm' && !storming && Math.sin(G.t * 0.7) > 0.995) G.flash = 0.1;
  }
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
  drawHero(P.id, P.x, P.y, face, pose);
}

function drawHazard(h) {
  const x = Math.round(h.x), y = Math.round(h.y);
  if (h.kind === 'bullet') { R(x - 3, y - 1, 6, 3, '#ff5252'); R(x - 1, y, 2, 1, '#fff'); }
  else if (h.kind === 'bubble') { circle(x, y, 4, '#81d4fa'); R(x - 2, y - 2, 2, 2, '#fff'); }
  else if (h.kind === 'cannon') { circle(x, y, 5, '#212121'); R(x - 2, y - 3, 2, 2, '#757575'); }
  else if (h.kind === 'shock') { R(x - 5, y - 2, 10, 7, '#c8a26a'); R(x - 3, y - 6, 6, 4, '#e8d4a8'); }
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
  drawBackground('day', cam, menuT, 1e6);
  drawGround('day', cam);
  const fakeG = G; // drawHero uses no G
  const id = save.selected && save.unlocked.includes(save.selected) ? save.selected : 'captain';
  drawHero(id, 150, GROUND, 1, { walk: menuT * 8, t: menuT });
  drawCoin(200 + Math.sin(menuT * 2) * 2, GROUND - 30, menuT);
  void fakeG;
}

// =========================================================
// HUD (DOM)
// =========================================================
const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function heartSVG(state) {
  const px = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
  let r = '';
  px.forEach((row, y) => row.split('').forEach((c, x) => {
    if (c !== '1') return;
    const fill = state === 'full' || (state === 'half' && x < 4) ? (y === 1 && x === 1 ? '#ffb3b3' : '#ff3b3b') : '#4a2a2a';
    r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
  }));
  return `<svg viewBox="0 0 7 6" shape-rendering="crispEdges">${r}</svg>`;
}
function setupHUD() {
  const D = CH[P.id];
  const slots = [['basic', 'J', 'ATTACK'], ['s1', 'Q', 'SKILL 1'], ['s2', 'E', 'SKILL 2']];
  if (D.s3) slots.push(['s3', 'F', 'SKILL 3']);
  slots.push(['ult', 'R', 'ULTIMATE']);
  $('#skills').innerHTML = slots.map(([s, k, label]) => {
    const sk = D[s];
    return `<div class="skill ${s === 'ult' ? 'ult' : ''}" id="sk-${s}" title="[${k}] ${label}"><div class="row1"><span class="key">[${k}] ${label}</span></div><div class="row1 sname">${sk.name}</div><span class="state"></span><div class="cbar"><i></i></div></div>`;
  }).join('');
  $('#touchS3').classList.toggle('hidden', !D.s3);
  $('#levelName').textContent = 'LEVEL ' + G.level + ' · ' + G.L.name.toUpperCase() + ' · ' + D.emoji + ' ' + D.name.toUpperCase();
  for (const k in hudCache) delete hudCache[k];
}
function updateHUD() {
  if (!G || !G.running) return;
  const per = P.maxHp / 5;
  let hearts = '';
  for (let i = 0; i < 5; i++) hearts += heartSVG(P.hp >= (i + 1) * per - 0.01 ? 'full' : P.hp >= (i + 0.5) * per ? 'half' : 'empty');
  if (hudCache.hearts !== hearts) { hudCache.hearts = hearts; $('#hearts').innerHTML = hearts; }
  setText('#hpText', 'HP ' + Math.ceil(P.hp) + '/' + P.maxHp);
  setText('#hudCoins', String(G.coinCount));
  setText('#hudScore', G.score.toLocaleString('en-US'));
  setText('#hudKills', String(G.stats.kills));
  const buffs = P.buffs.filter((b, i, a) => a.findIndex(x => x.name === b.name) === i).map(b => `<span class="buff">${b.icon} ${b.name} ${Math.ceil(b.until - G.t)}s</span>`).join('') + (P.form ? '' : '');
  if (hudCache.buffs !== buffs) { hudCache.buffs = buffs; $('#buffs').innerHTML = buffs; }
  const D = CH[P.id];
  for (const s of ['basic', 's1', 's2', 's3', 'ult']) {
    if (!D[s]) continue;
    const el = $('#sk-' + s);
    let state, pct, ready;
    if (s === 'ult') {
      ready = P.energy >= 100; pct = P.energy;
      state = ready ? 'READY! PRESS R' : 'ENERGY ' + Math.floor(P.energy) + '%';
    } else {
      const max = s === 'basic' ? D.basic.cd / statMul('aspd') : D[s].cd;
      const left = Math.max(0, P.cd[s] - G.t);
      ready = left <= 0;
      if (P.charging && P.charging.slot === s) { pct = clamp((G.t - P.charging.start) / 1.2, 0, 1) * 100; state = 'CHARGING ' + Math.round(pct) + '%'; }
      else { pct = ready ? 100 : 100 - left / max * 100; state = ready ? 'SKILL READY' : 'COOLDOWN ' + left.toFixed(1) + 's'; }
    }
    const cls = 'skill' + (s === 'ult' ? ' ult' : '') + (ready ? ' ready' : ' cool');
    const key = s + '|' + state + '|' + Math.round(pct) + '|' + cls;
    if (hudCache[s] === key) continue;
    hudCache[s] = key;
    el.className = cls;
    el.querySelector('.state').textContent = state;
    el.querySelector('.cbar i').style.width = pct + '%';
    const tb = document.querySelector('#touch [data-action="' + (s === 'basic' ? 'attack' : s) + '"]');
    if (tb) { tb.style.setProperty('--cd', ready ? 0 : (1 - pct / 100).toFixed(2)); tb.classList.toggle('ready', ready); }
  }
  const b = G.boss && G.boss.alive ? G.boss : null;
  $('#bossBar').classList.toggle('hidden', !b);
  if (b) { setText('#bossName', '☠ ' + b.name + (b.phase2 ? ' (ENRAGED)' : '')); $('#bossFill').style.width = (b.hp / b.maxHp * 100) + '%'; }
}

// =========================================================
// SCREENS / FLOW
// =========================================================
const SCREENS = ['title', 'levels', 'select', 'result', 'pause', 'help', 'unlock', 'confirm'];
function showScreen(name) {
  for (const s of SCREENS) if (s !== 'unlock' && s !== 'confirm') $('#screen-' + s).classList.toggle('hidden', s !== name);
  document.querySelectorAll('.walletCoins').forEach(el => { el.textContent = save.coins.toLocaleString('en-US'); });
  if (name && name !== 'pause' && name !== 'help') { $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); }
}
function goTitle() { G = null; $('#titleBest').textContent = save.bestScore.toLocaleString('en-US'); $('#btnMute').textContent = '♪ SOUND: ' + (save.muted ? 'OFF' : 'ON'); showScreen('title'); }

function maxPlayable() { return Math.min(5, save.highestLevel); }
function goLevels() {
  G = null;
  const list = $('#levelList');
  list.innerHTML = '';
  for (const L of LEVELS) {
    const locked = L.n > maxPlayable();
    const cleared = save.cleared.includes(L.n);
    const b = document.createElement('button');
    b.className = 'level-card' + (locked ? ' locked' : '') + (cleared ? ' cleared' : '');
    b.dataset.level = L.n;
    b.innerHTML = `<div class="num">${L.n}</div><div>${L.name}</div><div class="sub">${L.desc}${L.boss ? ' ☠' : ''}</div><div class="sub">${locked ? '🔒 Clear Level ' + (L.n - 1) : cleared ? '✔ BEST ' + (save.levelBest[L.n] || 0).toLocaleString('en-US') : 'NEW!'}</div>`;
    if (!locked) b.addEventListener('click', () => goSelect(L.n));
    list.appendChild(b);
  }
  showScreen('levels');
}

let selLevel = 1, selChar = 'captain';
function reqText(u) {
  if (u.type === 'coins') return u.n + ' coins';
  if (u.type === 'level') return 'Level ' + u.n;
  if (u.type === 'boss') return 'Boss ' + u.n;
  return '';
}
function reqLong(u) {
  if (u.type === 'coins') return 'Unlock for 🪙 ' + u.n + ' coins';
  if (u.type === 'level') return 'Reach Level ' + u.n + ' (clear Level ' + (u.n - 1) + ')';
  if (u.type === 'boss') return 'Defeat Boss ' + u.n + (u.n === 1 ? ' (Level 3)' : ' (Level 5)');
  return '';
}
function isUnlocked(id) { return save.unlocked.includes(id); }

function portrait(canvasEl, id, locked) {
  const c = canvasEl.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, canvasEl.width, canvasEl.height);
  withCtx(c, () => {
    const s = canvasEl.width / 32;
    c.save(); c.scale(s, s);
    drawHero(id, 16, 29, 1, { t: 0 });
    c.restore();
    if (locked) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#0b1226'; c.fillRect(0, 0, canvasEl.width, canvasEl.height); c.globalCompositeOperation = 'source-over'; }
  });
}

function goSelect(level) {
  G = null;
  selLevel = level;
  if (!isUnlocked(selChar)) selChar = isUnlocked(save.selected) ? save.selected : 'captain';
  $('#selectTitle').textContent = 'LEVEL ' + level + ' · ' + LEVELS[level - 1].name.toUpperCase() + ' — CHOOSE YOUR PIRATE';
  renderSelect();
  showScreen('select');
}
function renderSelect() {
  const grid = $('#charGrid');
  grid.innerHTML = '';
  for (const id of CH_ORDER) {
    const D = CH[id], un = isUnlocked(id);
    const b = document.createElement('button');
    b.className = 'char-card' + (un ? '' : ' locked') + (id === selChar ? ' sel' : '');
    b.dataset.char = id;
    b.innerHTML = `<canvas width="32" height="32"></canvas><div class="cname">${D.emoji} ${D.short}</div>` +
      (un ? '<div class="ok">🔓 READY</div>' : `<div class="lock">🔒 ${reqText(D.unlock)}</div>`);
    portrait(b.querySelector('canvas'), id, !un);
    b.addEventListener('click', () => { selChar = id; renderSelect(); });
    grid.appendChild(b);
  }
  const D = CH[selChar], un = isUnlocked(selChar);
  const sk = s => D[s] ? `<div class="sk"><b>[${{ basic: 'J', s1: 'Q', s2: 'E', s3: 'F', ult: 'R' }[s]}] ${D[s].name}</b>${D[s].cd ? ' · ' + D[s].cd + 's' : s === 'ult' ? ' · energy' : ''}<br><span>${D[s].desc}</span></div>` : '';
  let action = '';
  if (!un) {
    const u = D.unlock;
    action = `<div class="req">🔒 ${reqLong(u)}</div>`;
    if (u.type === 'coins') action += `<button class="btn primary" id="btnBuy" ${save.coins >= u.n ? '' : 'disabled'}>UNLOCK 🪙 ${u.n}</button>` + (save.coins < u.n ? `<div class="tiny">Need ${u.n - save.coins} more coins</div>` : '');
  }
  $('#charInfo').innerHTML = `<h3>${D.emoji} ${D.name}</h3><div class="role">${D.title}<br>${D.role} · HP ${D.hp}</div>${sk('basic')}${sk('s1')}${sk('s2')}${sk('s3')}${sk('ult')}${action}`;
  const buy = $('#btnBuy');
  if (buy) buy.addEventListener('click', () => buyChar(selChar));
  $('#btnSail').disabled = !un;
  document.querySelectorAll('.walletCoins').forEach(el => { el.textContent = save.coins.toLocaleString('en-US'); });
}
function buyChar(id) {
  const u = CH[id].unlock;
  if (u.type !== 'coins' || save.coins < u.n || isUnlocked(id)) return false;
  save.coins -= u.n;
  save.unlocked.push(id);
  persist();
  celebrate([id]);
  renderSelect();
  return true;
}

function checkUnlocks() {
  const fresh = [];
  for (const id of CH_ORDER) {
    if (isUnlocked(id)) continue;
    const u = CH[id].unlock;
    if ((u.type === 'level' && save.highestLevel >= u.n) || (u.type === 'boss' && save.bosses.includes(u.n))) { save.unlocked.push(id); fresh.push(id); }
  }
  if (fresh.length) persist();
  return fresh;
}

// celebration queue
const celebrateQ = [];
function celebrate(ids) { celebrateQ.push(...ids); if ($('#screen-unlock').classList.contains('hidden')) nextCelebration(); }
function nextCelebration() {
  const id = celebrateQ.shift();
  if (!id) { $('#screen-unlock').classList.add('hidden'); return; }
  const D = CH[id];
  $('#unlockName').textContent = D.emoji + ' ' + D.name;
  $('#unlockRole').textContent = D.title + ' — ' + D.role;
  portrait($('#unlockCanvas'), id, false);
  const conf = $('#confetti'); conf.innerHTML = '';
  const cols = ['#ffd23f', '#ff4f6d', '#4fc3f7', '#8ef59b', '#ce93d8', '#fff'];
  for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = pick(cols); s.style.animationDelay = (Math.random() * 1.8) + 's'; s.style.animationDuration = (1.2 + Math.random()) + 's'; conf.appendChild(s); }
  $('#screen-unlock').classList.remove('hidden');
  sfx('unlock');
}

function finishLevel(win) {
  if (!G.running) return;
  G.running = false;
  const n = G.level;
  const kills = G.stats.kills;
  let bonus = 0, hpBonus = 0;
  if (win) { bonus = 500 * n; hpBonus = Math.round(P.hp) * 5; G.score += bonus + hpBonus; }
  const coins = G.coinCount;
  save.coins += coins;
  save.totalScore += G.score;
  let newBest = false;
  if (win) {
    if (!save.cleared.includes(n)) save.cleared.push(n);
    save.highestLevel = Math.max(save.highestLevel, n + 1);
    if (G.score > (save.levelBest[n] || 0)) { save.levelBest[n] = G.score; newBest = true; }
  }
  save.bestScore = Math.max(save.bestScore, G.score);
  persist();
  const fresh = win ? checkUnlocks() : [];
  $('#hud').classList.add('hidden');
  $('#touch').classList.add('hidden');
  const final = win && n === 5;
  $('#resultTitle').textContent = win ? (final ? '🏆 LEGEND OF THE SEAS! 🏆' : 'LEVEL COMPLETE!') : '☠ SHIPWRECKED! ☠';
  $('#resultStats').innerHTML =
    `<div class="big">⭐ SCORE: ${G.score.toLocaleString('en-US')}</div>` +
    (newBest ? '<div class="newbest">NEW BEST FOR THIS LEVEL!</div>' : '') +
    `<div>🪙 COINS: ${coins.toLocaleString('en-US')}</div>` +
    `<div>☠ ENEMIES DEFEATED: ${kills}</div>` +
    (win ? `<div>⚓ CLEAR BONUS: ${bonus}</div><div>❤ HP BONUS: ${hpBonus}</div>` : '<div class="tiny">You keep the coins you collected!</div>') +
    `<div class="tiny">🪙 TOTAL COINS: ${save.coins.toLocaleString('en-US')}</div>`;
  const btns = $('#resultButtons');
  btns.innerHTML = '';
  const add = (label, cls, fn, id) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label; if (id) b.id = id; b.addEventListener('click', fn); btns.appendChild(b); };
  if (win && !final) add('[ NEXT LEVEL ]', 'primary', () => goSelect(n + 1), 'btnNext');
  if (final) add('[ PLAY AGAIN ]', 'primary', () => goLevels(), 'btnAgain');
  if (!win) add('↻ RETRY', 'primary', () => goSelect(n), 'btnRetry');
  add('⚑ VOYAGE MAP', '', () => goLevels(), 'btnMap');
  showScreen('result');
  sfx(win ? 'open' : 'over');
  if (fresh.length) setTimeout(() => celebrate(fresh), 500);
}
function gameOver() {
  G.over = true;
  P.lockUntil = G.t + 99;
  particles(P.x, P.y - 12, 30, ['#ff5252', '#fff', '#ffd23f'], { spd: 140 });
  toast('SHIPWRECKED!', 1.5);
  G.endT = G.t + 1.5;
}
function togglePause(force) {
  if (!G || !G.running) return;
  G.paused = force != null ? force : !G.paused;
  $('#screen-pause').classList.toggle('hidden', !G.paused);
  if (G.paused) for (const k in input.held) input.held[k] = false;
}

function askConfirm(text, yes) {
  $('#confirmText').textContent = text;
  $('#screen-confirm').classList.remove('hidden');
  $('#confirmYes').onclick = () => { $('#screen-confirm').classList.add('hidden'); yes(); };
  $('#confirmNo').onclick = () => $('#screen-confirm').classList.add('hidden');
}

// =========================================================
// layout & touch
// =========================================================
const isTouch = ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
if (isTouch) document.body.classList.add('touch');
function updateTouchVisibility() { $('#touch').classList.toggle('hidden', !(isTouch && G && G.running)); }
function layout() {
  const s = Math.max(0.5, Math.min(window.innerWidth / W, window.innerHeight / H));
  const st = $('#stage');
  st.style.width = Math.floor(W * s) + 'px';
  st.style.height = Math.floor(H * s) + 'px';
  st.style.setProperty('--u', s + 'px');
}
window.addEventListener('resize', layout);
document.querySelectorAll('#touch .tbtn').forEach(b => {
  const a = b.dataset.action;
  const down = e => { e.preventDefault(); b.classList.add('active'); press(a); };
  const up = e => { e.preventDefault(); b.classList.remove('active'); release(a); };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  b.addEventListener('pointerleave', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});

// buttons
$('#btnPlay').addEventListener('click', () => { sfx('coin'); goLevels(); });
$('#btnCrew').addEventListener('click', () => goSelect(maxPlayable()));
$('#btnHelp').addEventListener('click', () => $('#screen-help').classList.remove('hidden'));
$('#helpClose').addEventListener('click', () => $('#screen-help').classList.add('hidden'));
$('#btnMute').addEventListener('click', () => { save.muted = !save.muted; persist(); $('#btnMute').textContent = '♪ SOUND: ' + (save.muted ? 'OFF' : 'ON'); });
$('#btnReset').addEventListener('click', () => askConfirm('ERASE ALL PROGRESS?', () => { save = defaultSave(); persist(); goTitle(); }));
document.querySelectorAll('[data-go="title"]').forEach(b => b.addEventListener('click', goTitle));
$('#selectBack').addEventListener('click', goLevels);
$('#btnSail').addEventListener('click', () => { if (isUnlocked(selChar)) startLevel(selLevel, selChar); });
$('#pauseBtn').addEventListener('click', () => togglePause(true));
$('#btnResume').addEventListener('click', () => togglePause(false));
$('#btnRestart').addEventListener('click', () => { $('#screen-pause').classList.add('hidden'); startLevel(G.level, P.id); });
$('#btnQuit').addEventListener('click', () => { $('#screen-pause').classList.add('hidden'); goLevels(); });
$('#unlockOk').addEventListener('click', () => { $('#screen-unlock').classList.add('hidden'); nextCelebration(); if (!$('#screen-select').classList.contains('hidden')) renderSelect(); });
window.addEventListener('keydown', e => {
  if (e.code === 'Enter' && !$('#screen-unlock').classList.contains('hidden')) { e.preventDefault(); $('#unlockOk').click(); }
});

// =========================================================
// main loop
// =========================================================
let last = 0, acc = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  if (G && G.running && !G.paused) {
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) { update(STEP); acc -= STEP; steps++; }
    if (steps >= 5) acc = 0;
  }
  try { render(); updateHUD(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}

layout();
goTitle();
requestAnimationFrame(frame);

// expose a small API for debugging & automated tests
window.PP = {
  get G() { return G; }, get P() { return P; }, get save() { return save; },
  CH, LEVELS, CH_ORDER, ENEMY,
  startLevel, goSelect, goLevels, goTitle, buyChar, checkUnlocks, finishLevel,
  step(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || STEP); },
  press, release,
  reload() { save = loadSave(); },
};
})();
