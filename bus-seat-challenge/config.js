/* =====================================================================
   BUS SEAT CHALLENGE — MAIN GAME CONFIGURATION
   ---------------------------------------------------------------------
   Everything that defines *what* the game is lives here:
     • scoring        — points, speed bonus, combos
     • passengers     — every passenger type, its need level and look
     • levels         — the 10 stops of the campaign
     • daily          — the daily challenge rules
   The engine (script.js) only reads this object, so you can tune the
   game without touching engine code.
   ===================================================================== */
'use strict';

window.BSC_CONFIG = {
  version: 1,

  /* ---------------------------------------------------------------
     LIVES
     --------------------------------------------------------------- */
  lives: 3,              // hearts at the start of a run
  healOnLevelClear: 1,   // hearts restored after clearing a stop (max = lives)

  /* ---------------------------------------------------------------
     SCORING
     --------------------------------------------------------------- */
  scoring: {
    correct: 100,          // base points for a correct decision
    wrong: -100,           // penalty for a wrong decision / timeout
    // Speed bonus: first matching row wins (reaction time in seconds)
    speedBonus: [
      { under: 1, bonus: 100 },
      { under: 2, bonus: 75 },
      { under: 3, bonus: 50 },
      { under: 5, bonus: 25 }
    ],
    // Combo multipliers: first matching row (highest "at") wins
    combos: [
      { at: 10, mult: 3,   label: '10x PERFECT COMBO' },
      { at: 5,  mult: 2,   label: '5x COMBO' },
      { at: 3,  mult: 1.5, label: '3x COMBO' }
    ],
    perfectReaction: 1.0,  // under this (s) → "LIGHTNING FAST!"
    slowReaction: 3.0,     // over this (s) and correct → "GOOD OBSERVATION!"
    levelClearBonus: 200,  // bonus at the end of each stop
    heartBonus: 50         // bonus per remaining heart at the end of a stop
  },

  /* ---------------------------------------------------------------
     PASSENGER TYPES
     need:       how much this passenger needs a SEAT (0–3).
                 This is a game rule for these scenarios, not a moral
                 ranking of people. Context (free spot type, who else
                 is on board) decides the right answer each round.
     wheelchair: needs the wheelchair space, never a seat.
     look:       visual feature flags used by the pixel-art generator
                 (assets/characters/characters.js).
     slow:       walks slowly (visible when passengers move).
     hidden:     clue is small — trains attention to detail.
     twin:       look flags given to a look-alike "twin" (same clothes,
                 hair, skin) that does NOT need the seat.
     decoy:      looks like a clue but isn't.
     why:        short explanation shown after a decision.
     --------------------------------------------------------------- */
  passengers: {
    young:       { name: 'Young adult',      need: 0, look: {}, why: 'Can stand comfortably.' },
    student:     { name: 'Student',          need: 0, look: { cap: true, backpack: true }, why: 'Can stand comfortably.' },
    worker:      { name: 'Worker',           need: 0, look: { vest: true }, why: 'Can stand comfortably.' },
    tourist:     { name: 'Tourist',          need: 0, look: { hat: true, camera: true }, why: 'Can stand comfortably.' },
    phone:       { name: 'Phone scroller',   need: 0, look: { phone: true }, why: 'Busy, but can stand.' },
    headphones:  { name: 'Music fan',        need: 0, look: { headphones: true }, why: 'Can stand (and dance).' },

    elderly:     { name: 'Older passenger',  need: 2, look: { elderly: true }, why: 'Older passengers can lose balance.' },
    elderlyCane: { name: 'Older, with cane', need: 2, look: { elderly: true, cane: true }, why: 'Walking cane: balance is harder.' },
    pregnant:    { name: 'Pregnant',         need: 2, look: { pregnant: true }, why: 'Pregnancy makes standing tiring and risky.' },
    baby:        { name: 'Holding a baby',   need: 2, look: { baby: true }, why: 'Needs both arms for the baby.' },
    badge:       { name: '"Baby on board" badge', need: 2, look: { badge: true }, hidden: true, twin: { badge: 'decoy' },
                   why: 'The pink badge = early pregnancy. EAGLE EYES!' },
    lanyard:     { name: 'Sunflower lanyard', need: 2, look: { lanyard: true }, hidden: true, twin: { lanyard: 'decoy' },
                   why: 'The sunflower lanyard = a hidden disability.' },

    crutches:    { name: 'On crutches',      need: 3, look: { crutches: true, cast: true }, why: 'Crutches: standing is unsafe.' },
    legCast:     { name: 'Leg in a cast',    need: 3, look: { cast: true }, slow: true, why: 'Injured leg: cannot stand safely.' },
    legBrace:    { name: 'Leg brace',        need: 3, look: { brace: true }, slow: true, hidden: true, twin: {},
                   why: 'Small leg brace & slow walk. EAGLE EYES!' },

    heavyBags:   { name: 'Heavy bags',       need: 1, look: { bags: 'heavy' }, why: 'Heavy bags — some need, but less urgent.' },
    tired:       { name: 'Exhausted',        need: 1, look: { tired: true }, why: 'Very tired — some need, but less urgent.' },

    wheelchair:  { name: 'Wheelchair user',  need: 3, wheelchair: true, look: { wheelchair: true },
                   why: 'Needs the ♿ wheelchair space, not a seat.' },

    umbrella:    { name: 'Folded umbrella',  need: 0, look: { umbrella: true }, decoy: true, why: 'That is an umbrella, not a cane!' },
    lightBag:    { name: 'Small shopping bag', need: 0, look: { bags: 'light' }, decoy: true, why: 'One light bag — can stand.' },
    petCarrier:  { name: 'Cat carrier',      need: 0, look: { pet: true }, decoy: true, why: 'A cat, not a baby. Can stand.' }
  },

  // Order of the CLUE BOOK on the "How to play" screen
  clueBook: ['wheelchair', 'crutches', 'legCast', 'legBrace', 'pregnant', 'elderlyCane', 'baby', 'badge', 'lanyard',
             'heavyBags', 'tired', 'umbrella', 'petCarrier', 'lightBag', 'young'],

  /* ---------------------------------------------------------------
     LEVELS  (the bus route)
     passengers : [min,max] standing passengers that board
     targets    : [min,max] free seats to hand out this round
                  (a wheelchair user always adds the ♿ space as a target)
     needy      : [min,max] passengers with need > 0
     time       : seconds per decision
     modes      : weighted round types
                  standard | place | quick | memory | flash | distraction
     needyPool / fillerPool / decoyPool / hiddenPool : passenger type ids
     decoyChance: chance each filler is a decoy
     hiddenChance: chance a round contains a hidden clue + its twin
     mixNeeds   : force different need levels (forces prioritising)
     distraction: 0–3 visual noise level
     moving     : null or { every:[min,max] s between shuffles, late: n passengers boarding late, speed }
     quickWindow: seconds a QUICK CLICK target sparkles
     lookTime   : seconds to memorise in memory rounds (flash = lookTime*0.6)
     --------------------------------------------------------------- */
  levels: [
    {
      id: 1, stop: 'FIRST RIDE', skill: 'RECOGNITION', icon: '🚏', sky: 'morning',
      rounds: 4, passengers: [3, 3], targets: [1, 1], needy: [1, 1], time: 12,
      modes: { standard: 1 },
      needyPool: ['pregnant', 'elderlyCane', 'crutches'],
      fillerPool: ['young', 'student', 'worker'],
      decoyPool: [], decoyChance: 0, hiddenPool: [], hiddenChance: 0,
      mixNeeds: false, distraction: 0, moving: null,
      tip: 'A seat is free! Tap the passenger who needs it most.',
      learn: ['pregnant', 'elderlyCane', 'crutches']
    },
    {
      id: 2, stop: 'BUSY MORNING', skill: 'OBSERVATION', icon: '🚌', sky: 'morning',
      rounds: 5, passengers: [4, 4], targets: [1, 1], needy: [1, 2], time: 10,
      modes: { standard: 1 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby'],
      fillerPool: ['young', 'student', 'worker', 'tourist'],
      decoyPool: [], decoyChance: 0, hiddenPool: [], hiddenChance: 0,
      mixNeeds: false, distraction: 0, moving: null,
      tip: 'Look for the clues: canes, crutches, babies, baby bumps. Two in need? Both are fine answers!',
      learn: ['elderly', 'baby', 'crutches']
    },
    {
      id: 3, stop: 'RUSH HOUR', skill: 'PRIORITIZATION', icon: '🧠', sky: 'day',
      rounds: 5, passengers: [5, 5], targets: [1, 2], needy: [2, 3], time: 10,
      modes: { standard: 3, place: 1 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast', 'heavyBags', 'tired', 'wheelchair'],
      fillerPool: ['young', 'student', 'worker', 'tourist'],
      decoyPool: [], decoyChance: 0, hiddenPool: [], hiddenChance: 0,
      mixNeeds: true, distraction: 0, moving: null,
      tip: 'Several people in need? Help the one who needs it MOST. Wheelchair users need the ♿ space, not a seat. New: WHERE SHOULD THEY SIT? rounds.',
      learn: ['legCast', 'heavyBags', 'wheelchair']
    },
    {
      id: 4, stop: 'SPEED LANE', skill: 'SPEED', icon: '⚡', sky: 'day',
      rounds: 6, passengers: [5, 5], targets: [1, 1], needy: [1, 2], time: 5,
      modes: { standard: 3, quick: 2 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast', 'heavyBags'],
      fillerPool: ['young', 'student', 'worker', 'tourist', 'phone'],
      decoyPool: [], decoyChance: 0, hiddenPool: [], hiddenChance: 0,
      mixNeeds: false, distraction: 0, moving: null, quickWindow: 1.4,
      tip: 'LOOK → THINK → CLICK, fast! Under 1 second = +100 speed bonus. New: QUICK CLICK — tap the sparkling passenger!',
      learn: []
    },
    {
      id: 5, stop: 'DISTRACTION CITY', skill: 'FOCUS', icon: '📢', sky: 'day',
      rounds: 6, passengers: [6, 6], targets: [1, 2], needy: [1, 2], time: 7,
      modes: { standard: 2, distraction: 2 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast', 'heavyBags', 'tired'],
      fillerPool: ['young', 'student', 'worker', 'tourist', 'phone', 'headphones'],
      decoyPool: ['umbrella', 'lightBag', 'petCarrier'], decoyChance: 0.45, hiddenPool: [], hiddenChance: 0,
      mixNeeds: false, distraction: 2, moving: null,
      tip: 'Ignore the noise! An umbrella is not a cane. A cat carrier is not a baby. A small bag is not heavy luggage.',
      learn: ['umbrella', 'petCarrier', 'lightBag']
    },
    {
      id: 6, stop: 'MEMORY EXPRESS', skill: 'MEMORY', icon: '🧩', sky: 'day',
      rounds: 6, passengers: [5, 6], targets: [1, 1], needy: [1, 2], time: 6,
      modes: { memory: 3, flash: 2, standard: 1 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast'],
      fillerPool: ['young', 'student', 'worker', 'tourist', 'phone', 'headphones'],
      decoyPool: ['umbrella', 'petCarrier'], decoyChance: 0.25, hiddenPool: [], hiddenChance: 0,
      mixNeeds: false, distraction: 1, moving: null, lookTime: 2.4,
      tip: 'LOOK! … then the lights go out. Remember WHERE the person in need was standing.',
      learn: []
    },
    {
      id: 7, stop: 'PRIORITY PLAZA', skill: 'MULTIPLE PRIORITIES', icon: '🎯', sky: 'sunset',
      rounds: 5, passengers: [6, 7], targets: [2, 2], needy: [3, 4], time: 6,
      modes: { standard: 3, place: 1 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast', 'heavyBags', 'tired', 'wheelchair'],
      fillerPool: ['young', 'student', 'worker', 'tourist', 'phone', 'headphones'],
      decoyPool: ['umbrella', 'lightBag'], decoyChance: 0.25, hiddenPool: ['badge', 'lanyard'], hiddenChance: 0.6,
      mixNeeds: true, distraction: 1, moving: null,
      tip: 'Two seats, many needs. Hidden clues appear: a pink "baby on board" badge or a sunflower lanyard means they need to sit. Their twin does not!',
      learn: ['badge', 'lanyard']
    },
    {
      id: 8, stop: 'MOVING MARKET', skill: 'TRACKING', icon: '🏃', sky: 'sunset',
      rounds: 6, passengers: [6, 6], targets: [1, 2], needy: [2, 3], time: 6,
      modes: { standard: 4, quick: 1 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast', 'heavyBags'],
      fillerPool: ['young', 'student', 'worker', 'tourist', 'phone', 'headphones'],
      decoyPool: ['umbrella', 'petCarrier'], decoyChance: 0.25, hiddenPool: ['legBrace'], hiddenChance: 0.6,
      mixNeeds: true, distraction: 1, moving: { every: [1.3, 2.2], late: 1, speed: 1 }, quickWindow: 1.2,
      tip: 'Passengers move around and board late. Track them! Someone walking slowly may wear a small leg brace.',
      learn: ['legBrace']
    },
    {
      id: 9, stop: 'CHAOS STATION', skill: 'MULTITASKING', icon: '🌀', sky: 'night',
      rounds: 6, passengers: [8, 8], targets: [2, 3], needy: [3, 4], time: 5.5,
      modes: { standard: 3, distraction: 2, memory: 1, flash: 1, quick: 1, place: 1 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast', 'heavyBags', 'tired', 'wheelchair'],
      fillerPool: ['young', 'student', 'worker', 'tourist', 'phone', 'headphones'],
      decoyPool: ['umbrella', 'lightBag', 'petCarrier'], decoyChance: 0.35, hiddenPool: ['badge', 'lanyard', 'legBrace'], hiddenChance: 0.5,
      mixNeeds: true, distraction: 3, moving: { every: [1.1, 1.9], late: 1, speed: 1.15 }, quickWindow: 1.1, lookTime: 2.2,
      tip: 'Everything at once! Stay calm: LOOK → THINK → CLICK.',
      learn: []
    },
    {
      id: 10, stop: 'MASTER OF THE BUS', skill: 'EVERYTHING', icon: '🏆', sky: 'night',
      rounds: 7, passengers: [9, 10], targets: [2, 3], needy: [3, 5], time: 5,
      modes: { standard: 3, distraction: 2, memory: 1, flash: 1, quick: 1, place: 1 },
      needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast', 'heavyBags', 'tired', 'wheelchair'],
      fillerPool: ['young', 'student', 'worker', 'tourist', 'phone', 'headphones'],
      decoyPool: ['umbrella', 'lightBag', 'petCarrier'], decoyChance: 0.4, hiddenPool: ['badge', 'lanyard', 'legBrace'], hiddenChance: 0.7,
      mixNeeds: true, distraction: 3, moving: { every: [0.9, 1.6], late: 2, speed: 1.3 }, quickWindow: 1.0, lookTime: 2.0,
      tip: 'Final stop. Very little time, lots of people, hidden clues. Prove you are the MASTER OF THE BUS!',
      learn: []
    }
  ],

  /* ---------------------------------------------------------------
     DAILY CHALLENGE — same scenario for everyone on the same day
     (scenario generation is seeded with today's date)
     --------------------------------------------------------------- */
  daily: {
    id: 'daily', stop: 'DAILY CHALLENGE', skill: 'DAILY', icon: '📅', sky: 'sunset',
    rounds: 3, passengers: [10, 10], targets: [4, 4], needy: [4, 5], time: 8,
    modes: { standard: 1 },
    needyPool: ['pregnant', 'elderly', 'elderlyCane', 'crutches', 'baby', 'legCast', 'heavyBags', 'tired', 'wheelchair'],
    fillerPool: ['young', 'student', 'worker', 'tourist', 'phone', 'headphones'],
    decoyPool: ['umbrella', 'lightBag', 'petCarrier'], decoyChance: 0.35, hiddenPool: ['badge', 'lanyard', 'legBrace'], hiddenChance: 0.7,
    mixNeeds: true, distraction: 2, moving: { every: [1.6, 2.6], late: 1, speed: 1 },
    tip: '10 passengers · 4 seats · 8 seconds · 3 situations. Same bus for everyone today!',
    learn: []
  }
};
