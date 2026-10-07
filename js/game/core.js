'use strict';
// ---------------------------------------------------------
// constants & utils
// ---------------------------------------------------------
// W x H is the visible camera window. Two camera modes: 'wide' (384x216, more vision)
// and 'close' (320x180, bigger sprites). CAMY scrolls the view so the ground sits 32px
// above the bottom edge. AW is the fixed width of boss arenas, independent of the camera.
const GROUND = 232, GRAV = 900, STEP = 1 / 60, AW = 320;
const CAMERA_MODES = { wide: [384, 216], close: [320, 180] };
let W = 384, H = 216, CAMY = GROUND - H + 32;
function setCameraMode(mode) {
  const [w, h] = CAMERA_MODES[mode] || CAMERA_MODES.wide;
  W = w; H = h; CAMY = GROUND - H + 32;
  const cv = document.querySelector('#game');
  if (cv) { cv.width = W; cv.height = H; }
  if (typeof fogBuf !== 'undefined') { fogBuf.width = W; fogBuf.height = H; }
}
const STAGE_W = 480, STAGE_H = 270;
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
const defaultSave = () => ({ journey: null, coins: 0, totalScore: 0, bestScore: 0, unlocked: ['captain'], highestLevel: 1, bosses: [], levelBest: {}, cleared: [], selected: 'captain', muted: false });
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
