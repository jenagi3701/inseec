'use strict';
// =========================================================
// LEVELS
// =========================================================
// The main adventure: one level per map. Difficulty comes from mixing
// enemy archetypes and hazards, not only from bigger HP numbers.
const LEVELS = [
  { map: 'island', pool: { slime: 6, grunt: 4, sword: 3 }, desc: 'Grunts, sword pirates & wild blobs' },
  { map: 'ocean', pool: { grunt: 4, gunner: 2, shield: 2, seacreature: 4, cannonship: 2 }, boss: 'crab', bossN: 1, desc: 'Sailors, sea creatures & cannon ships' },
  { map: 'sky', pool: { flyer: 4, skywarrior: 5, spear: 3, bomber: 2, sword: 2 }, desc: 'Sky warriors & bomb throwers' },
  { map: 'desert', pool: { raider: 6, gunner: 2, bomber: 3, slime: 3 }, boss: 'warlord', variant: 'dune', desc: 'Hidden raiders + MINI BOSS' },
  { map: 'snow', pool: { icemonster: 5, shield: 3, spear: 3, flyer: 3, grunt: 2 }, desc: 'Frost yetis & frozen pirates' },
  { map: 'volcano', pool: { firemonster: 6, heavy: 3, bomber: 2, sword: 2, raider: 2 }, boss: 'warlord', variant: 'magma', desc: 'Ember imps + MINI BOSS' },
  { map: 'final', pool: { sword: 3, shield: 2, spear: 2, gunner: 2, bomber: 2, heavy: 2, seacreature: 2, flyer: 2, skywarrior: 1 }, boss: 'kraken', bossN: 2, desc: 'FINAL BOSS' },
];
LEVELS.forEach((L, i) => { L.n = i + 1; const M = MAPS[L.map]; L.name = M.name; L.theme = M.theme; L.len = M.len; });

function startLevel(n, charId, resume) {
  const L = LEVELS[n - 1], M = MAPS[L.map];
  const D = CH[charId];
  const rng = seeded(n * 977);
  eid = 1;
  const built = buildTerrain(M, rng, !!L.boss);
  const sm = STAR_MODS[stars(charId, L.map)];
  G = {
    level: n, L, M, mapId: L.map, theme: L.theme, worldW: built.len, t: 0, running: true, paused: false, over: false, won: false,
    enemies: [], hbs: [], hz: [], hearts: [], parts: [], texts: [], fx: [], coins: [], timers: [], plats: built.plats, segs: built.segs, env: [],
    cam: 0, shake: 0, flash: 0, weather: 0, score: 0, coinCount: 0, banked: 0, cps: [], sandstorm: 0, sandK: 0,
    stats: { kills: 0, dmg: 0, hurt: 0 },
    mods: { atk: sm[0], def: sm[1], spd: sm[2], rank: 1 },
    rank: 1, rankKills: 0, combo: 0, comboT: -9,
    arena: false, arenaX: L.boss ? built.len - W : 0, boss: null, chest: null, endT: 0,
  };
  P = {
    id: charId, x: 96, y: GROUND, w: 12, h: 22, vx: 0, vy: 0, kx: 0, face: 1, onGround: true, coyote: 0,
    hp: D.hp, maxHp: D.hp, energy: 0, cd: { basic: 0, s1: 0, s2: 0, s3: 0 }, buffs: [],
    inv: 0, sinv: 0, lockUntil: 0, dash: null, act: null, stretch: null, walk: 0, combo: 0, comboT: 0,
    charging: null, form: null, formUntil: 0, transform: 0,
    safeX: 40, shieldHits: 0, swim: false, sinking: null, sink: 0, plat: null, airJumps: 0, skyWalk: 0, chillUntil: 0, stunUntil: 0, regen: 0, regenUntil: 0,
  };
  for (const [cx, cy] of built.coinSpots) G.coins.push({ x: cx, y: cy, vx: 0, vy: 0, v: 5, age: 0, placed: true });
  setupHazards(M, built, rng);
  placeEnemies(L, built, rng, n);
  if (!L.boss) G.chest = { x: G.worldW - 60, open: false };
  // checkpoints: two along the route (always on solid ground), plus one at the boss gate
  for (const k of [0.36, 0.68]) G.cps.push({ x: Math.round(nearestSolidX(G.worldW * k)), done: false });
  if (L.boss) G.cps.push({ x: G.arenaX - 40, done: false });
  const J = save.journey;
  if (resume && J && J.level === n && J.cp > 0) {
    // continue the saved journey from its last checkpoint
    const cx = J.cpx;
    G.cps.forEach((c, i) => { if (i < J.cp) c.done = true; });
    G.enemies = G.enemies.filter(e => e.x > cx + 60);
    G.coins = G.coins.filter(c => c.x > cx);
    P.x = cx + 4; G.cam = clamp(P.x - W * 0.42, 0, G.worldW - W);
    G.score = J.score || 0; G.coinCount = G.banked = J.coins || 0; G.stats.kills = J.kills || 0;
  } else {
    save.journey = { level: n, char: charId, cp: 0, cpx: 0, score: 0, coins: 0, kills: 0 };
  }
  save.journey.char = charId;
  P.face = 1;
  setupHUD();
  showScreen(null);
  $('#hud').classList.remove('hidden');
  updateTouchVisibility();
  input.queue.length = 0;
  for (const k in input.held) input.held[k] = false;
  const st = stars(charId, L.map);
  toast(resume && save.journey.cp > 0 ? 'JOURNEY CONTINUES · CHECKPOINT ' + save.journey.cp : M.icon + ' ' + L.name.toUpperCase() + ' ' + starStr(st), 2.2);
  save.selected = charId; persist();
}

function bossDefeated(e) {
  G.boss = null;
  shake(14);
  toast(e.name + ' DEFEATED!', 2.5);
  const n = G.L.bossN;
  if (n && !save.bosses.includes(n)) { save.bosses.push(n); persist(); }
  for (const m of G.enemies) if (m.alive) { m.alive = false; particles(m.x, m.y - m.h / 2, 8, ['#fff'], {}); }
  G.hz.length = 0;
  const cx = P.x < G.arenaX + W / 2 ? P.x + 50 : P.x - 50;
  G.chest = { x: clamp(cx, G.arenaX + 30, G.arenaX + W - 30), open: false, drop: -60 };
}

const WATER_TYPES = { seacreature: 1, cannonship: 1 }, FLY_TYPES = { flyer: 1, skywarrior: 1 };
function placeEnemies(L, built, rng, n) {
  const types = [];
  for (const [t, c] of Object.entries(L.pool)) for (let i = 0; i < c; i++) types.push(t);
  for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
  const endX = L.boss ? G.arenaX - 80 : G.worldW - 140;
  const ok = x => x > 330 && x < endX;
  const ground = built.slots.ground.concat(built.slots.sand).filter(ok).sort((a, b) => a - b);
  const water = built.slots.water.filter(ok);
  const wTypes = types.filter(t => WATER_TYPES[t]).sort((a, b) => (a === 'cannonship') - (b === 'cannonship'));
  const fTypes = types.filter(t => FLY_TYPES[t]);
  const gTypes = types.filter(t => !WATER_TYPES[t] && !FLY_TYPES[t]);
  wTypes.forEach((t, i) => {
    if (!water.length) return;
    const wx = water[i % water.length] + (i >= water.length ? 30 : 0) + (t === 'cannonship' ? 20 : -20);
    spawnEnemy(t, wx, GROUND, n);
  });
  fTypes.forEach((t, i) => {
    const x = 380 + (endX - 380) * ((i + 0.5) / fTypes.length) + (rng() - 0.5) * 40;
    const e = spawnEnemy(t, x, 132 + rng() * 34, n); e.baseY = e.y;
  });
  gTypes.forEach((t, i) => {
    if (!ground.length) return;
    const idx = Math.min(ground.length - 1, Math.floor((i + 0.5) * ground.length / gTypes.length));
    spawnEnemy(t, ground[idx] + (rng() - 0.5) * 16, GROUND, n);
  });
}
