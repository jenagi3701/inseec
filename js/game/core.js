'use strict';
// ---------------------------------------------------------
// constants & utils
// ---------------------------------------------------------
// W x H is the visible camera window (zoomed in 1.5x over the 480x270 HUD layout);
// CAMY scrolls the view down so it frames the ground and the action.
const W = 320, H = 180, CAMY = 72, GROUND = 232, GRAV = 900, STEP = 1 / 60;
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
