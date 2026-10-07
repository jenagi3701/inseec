'use strict';
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

function startLevel(n, charId, resume) {
  const L = LEVELS[n - 1];
  const D = CH[charId];
  const rng = seeded(n * 977);
  eid = 1;
  G = {
    level: n, L, theme: L.theme, worldW: L.len, t: 0, running: true, paused: false, over: false, won: false,
    enemies: [], hbs: [], hz: [], hearts: [], parts: [], texts: [], fx: [], coins: [], timers: [], plats: [],
    cam: 0, shake: 0, flash: 0, weather: 0, score: 0, coinCount: 0, banked: 0, cps: [],
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
  // checkpoints: two along the route, plus one at the boss gate
  for (const k of [0.36, 0.68]) G.cps.push({ x: Math.round(L.len * k), done: false });
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
  toast(resume && save.journey.cp > 0 ? 'JOURNEY CONTINUES · CHECKPOINT ' + save.journey.cp : 'LEVEL ' + n + ': ' + L.name.toUpperCase(), 2);
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
  const cx = P.x < G.arenaX + W / 2 ? P.x + 50 : P.x - 50;
  G.chest = { x: clamp(cx, G.arenaX + 30, G.arenaX + W - 30), open: false, drop: -60 };
}
