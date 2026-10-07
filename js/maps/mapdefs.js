'use strict';
// =========================================================
// MAPS — environments, their rules, and how each crew member fares there
// =========================================================
// Each map lists the terrain chunks the level builder strings together,
// the hazards it switches on, and its enemy pool. Star ratings (1-5) per
// character turn into real stat changes via STAR_MODS.

const MAPS = {
  island: {
    name: 'Jungle Isle', icon: '🌴', theme: 'forest', len: 2600, difficulty: 1,
    blurb: 'A balanced tropical island with trees, rocks and pirate huts.',
    chunks: ['flat', 'flat', 'flat', 'shallow', 'flat'],
    hazards: [],
    hazardText: ['🌊 Shallow streams (slow you down)'],
    advText: ['👊 Every fighter works here'],
  },
  ocean: {
    name: 'Open Sea', icon: '🌊', theme: 'ocean', len: 3000, difficulty: 2,
    blurb: 'Leap between ships and floating barrels. Deep water everywhere.',
    chunks: ['water', 'ship', 'water', 'flat', 'water', 'ship'],
    hazards: ['deepwater'],
    hazardText: ['🌊 Deep water — cursed-fruit users sink!', '💣 Cannon ships'],
    advText: ['🌊 Swimmers move freely', '🔧 Shipwright repairs on deck'],
  },
  sky: {
    name: 'Sky Island', icon: '☁️', theme: 'sky', len: 3000, difficulty: 3,
    blurb: 'Cloud islands, sky bridges, moving platforms and lightning clouds.',
    chunks: ['flat', 'gap', 'flat', 'bridge', 'flat', 'gap'],
    hazards: ['wind', 'thunder'],
    hazardText: ['⬇ Bottomless gaps', '🌪 Wind zones', '⚡ Lightning clouds'],
    advText: ['🌪 Wind & weather powers', '🎯 Ranged fighters on high ground'],
  },
  desert: {
    name: 'Sunscar Desert', icon: '🏜', theme: 'desert', len: 3100, difficulty: 3,
    blurb: 'Dunes, ruins and a buried village. Sandstorms hide ambushers.',
    chunks: ['flat', 'quicksand', 'flat', 'ruins', 'quicksand', 'flat'],
    hazards: ['sandstorm'],
    hazardText: ['🌫 Sandstorms cut visibility', '⏳ Quicksand', '👁 Hidden raiders'],
    advText: ['🥽 Goggles see through sand', '📜 Ruin experts'],
  },
  snow: {
    name: 'Frostfang Peaks', icon: '❄️', theme: 'snow', len: 3100, difficulty: 4,
    blurb: 'Frozen ground, ice caves and falling icicles.',
    chunks: ['flat', 'ice', 'flat', 'ice', 'flat'],
    hazards: ['icicles'],
    hazardText: ['🧊 Slippery ice', '❄ Falling icicles', '🥶 Chilling monsters'],
    advText: ['🔥 Fire users keep their footing', '🦌 Cold-proof fur'],
  },
  volcano: {
    name: 'Cinder Volcano', icon: '🌋', theme: 'volcano', len: 3200, difficulty: 4,
    blurb: 'Lava pits, smoke and a rain of burning rocks.',
    chunks: ['flat', 'lava', 'flat', 'lavawide', 'flat', 'lava'],
    hazards: ['rocks'],
    hazardText: ['🔥 Lava pits', '🪨 Falling rocks', '♨ Fire monsters'],
    advText: ['🔥 Fire users resist burns', '🌊 Water beats fire monsters'],
  },
  final: {
    name: 'Stormcrown Isle', icon: '☠️', theme: 'storm', len: 3000, difficulty: 5,
    blurb: 'The Admiral’s fortress. Every danger of the seas at once.',
    chunks: ['flat', 'water', 'flat', 'lava', 'ship', 'gap', 'flat'],
    hazards: ['deepwater', 'thunder'],
    hazardText: ['🌊 Deep water', '🔥 Lava', '⚡ Storm'],
    advText: ['⭐ Your strongest, best-matched pirate'],
  },
};
const MAP_ORDER = ['island', 'ocean', 'sky', 'desert', 'snow', 'volcano', 'final'];

// stars -> [attack multiplier, damage-taken multiplier, speed multiplier]
const STAR_MODS = { 1: [0.75, 1.3, 0.9], 2: [0.88, 1.15, 0.95], 3: [1, 1, 1], 4: [1.12, 0.92, 1.03], 5: [1.25, 0.82, 1.07] };

// character -> map -> stars
const CHAR_MAP = {
  captain:       { island: 5, ocean: 2, sky: 3, desert: 4, snow: 3, volcano: 3, final: 4 },
  swordsman:     { island: 4, ocean: 4, sky: 2, desert: 4, snow: 3, volcano: 3, final: 4 },
  navigator:     { island: 3, ocean: 4, sky: 5, desert: 3, snow: 3, volcano: 2, final: 4 },
  sniper:        { island: 3, ocean: 4, sky: 4, desert: 5, snow: 4, volcano: 3, final: 3 },
  cook:          { island: 4, ocean: 4, sky: 4, desert: 3, snow: 5, volcano: 5, final: 4 },
  doctor:        { island: 4, ocean: 2, sky: 3, desert: 3, snow: 5, volcano: 3, final: 4 },
  archaeologist: { island: 4, ocean: 3, sky: 3, desert: 5, snow: 3, volcano: 2, final: 4 },
  shipwright:    { island: 3, ocean: 5, sky: 2, desert: 3, snow: 3, volcano: 4, final: 4 },
  musician:      { island: 3, ocean: 4, sky: 3, desert: 3, snow: 4, volcano: 2, final: 4 },
};

// Characters whose cursed-fruit powers make deep water deadly.
// (The archaeologist's Mermaid Form lifts the curse while it lasts.)
const SEA_WEAK = new Set(['captain', 'doctor', 'archaeologist']);

// Short notes shown on cards explaining *why* a rating is what it is.
const MAP_NOTES = {
  captain: { ocean: 'Sinks in deep water', island: 'Home turf' },
  swordsman: { sky: 'Heavy blades, short jumps' },
  navigator: { sky: 'Rides the wind, absorbs lightning', volcano: 'Heat ruins her forecasts' },
  sniper: { desert: 'Goggles see through sandstorms', sky: 'Snipes from high ground' },
  cook: { snow: 'Fiery legs never slip', volcano: 'Immune to burns', sky: 'Sky Walk crosses gaps' },
  doctor: { ocean: 'Sinks in deep water', snow: 'Thick fur, no chill' },
  archaeologist: { desert: 'Reads the ruins', ocean: 'Sinks — unless in Mermaid Form' },
  shipwright: { ocean: 'Ship decks heal him', sky: 'Too heavy for big jumps', volcano: 'Steel body resists heat' },
  musician: { snow: 'Echoes in the ice caves' },
};

function stars(id, mapId) { return (CHAR_MAP[id] && CHAR_MAP[id][mapId]) || 3; }
function starStr(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function recommendedFor(mapId) {
  return CH_ORDER.filter(id => stars(id, mapId) >= 5).concat(CH_ORDER.filter(id => stars(id, mapId) === 4)).slice(0, 3);
}
// Per-character special rules that apply on top of star ratings.
const TRAITS = {
  swimmer: id => !SEA_WEAK.has(id) || (P && P.id === id && P.form === 'mermaid'),
  noSlip: id => id === 'cook' || id === 'doctor',
  fireproof: id => id === 'cook' || id === 'shipwright',
  windRider: id => id === 'navigator',
  stormProof: id => id === 'navigator',
  sandSight: id => id === 'sniper',
  noChill: id => id === 'doctor' || id === 'cook',
};
