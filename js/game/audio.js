'use strict';
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

// background music: an original heroic march (drums, galloping bass, brass
// swells and a horn fanfare), scheduled slightly ahead on the audio clock
let musicBus = null, noiseBuf = null;
function musicOut() {
  if (!musicBus) {
    musicBus = actx.createGain(); musicBus.gain.value = 0.6; musicBus.connect(actx.destination);
    const len = Math.floor(actx.sampleRate * 0.6);
    noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let k = 0; k < len; k++) d[k] = Math.random() * 2 - 1;
  }
  return musicBus;
}
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
function voice(m, t, d, type, vol, cutoff, attack, detune) {
  const o = actx.createOscillator(); o.type = type; o.frequency.value = mf(m); if (detune) o.detune.value = detune;
  const f = actx.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(cutoff * 0.45, t); f.frequency.linearRampToValueAtTime(cutoff, t + attack + 0.06);
  const gn = actx.createGain();
  gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + attack);
  gn.gain.setValueAtTime(vol, t + Math.max(attack, d - 0.07)); gn.gain.linearRampToValueAtTime(0.0001, t + d);
  o.connect(f).connect(gn).connect(musicOut()); o.start(t); o.stop(t + d + 0.05);
}
function drum(kind, t, vol) {
  const out = musicOut();
  if (kind === 'kick' || kind === 'tom') {
    const o = actx.createOscillator(), gn = actx.createGain(), kick = kind === 'kick';
    o.type = 'sine'; o.frequency.setValueAtTime(kick ? 150 : 120, t); o.frequency.exponentialRampToValueAtTime(kick ? 40 : 70, t + 0.2);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + (kick ? 0.32 : 0.4));
    o.connect(gn).connect(out); o.start(t); o.stop(t + 0.45); return;
  }
  const src = actx.createBufferSource(); src.buffer = noiseBuf;
  const f = actx.createBiquadFilter(); f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : kind === 'crash' ? 5000 : 1700;
  const gn = actx.createGain(), dd = kind === 'hat' ? 0.04 : kind === 'crash' ? 0.55 : 0.2;
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dd);
  src.connect(f).connect(gn).connect(out); src.start(t); src.stop(t + dd + 0.02);
}
// 4 bars of 16 steps. chords = brass voicing per bar (bass plays the root an octave down),
// melody = [step, midi note, length in steps]
const SONGS = {
  hero: { bpm: 104, introLoops: 1, kicks: [0, 6, 8], gallop: true,
    chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], // Dm  Bb  F  C
    melody: [[0, 69, 3], [3, 74, 5], [8, 77, 2], [10, 76, 2], [12, 74, 4], [16, 77, 6], [22, 74, 2], [24, 70, 4], [28, 74, 2], [30, 77, 2],
      [32, 81, 6], [38, 79, 2], [40, 77, 4], [44, 72, 4], [48, 76, 4], [52, 79, 4], [56, 84, 8]] },
  boss: { bpm: 124, introLoops: 0, kicks: [0, 3, 6, 8, 11, 14], gallop: true,
    chords: [[50, 53, 57], [51, 55, 58], [50, 53, 57], [49, 52, 57]], // Dm  Eb  Dm  A
    melody: [[0, 74, 2], [2, 74, 2], [4, 77, 2], [6, 74, 2], [8, 81, 4], [12, 80, 4], [16, 79, 6], [22, 75, 2], [24, 74, 8],
      [32, 74, 2], [34, 74, 2], [36, 77, 2], [38, 79, 2], [40, 81, 4], [44, 84, 4], [48, 82, 4], [52, 81, 4], [56, 73, 8]] },
};
const music = { next: 0, step: 0, song: null };
function playStep(song, step, t, len) {
  const i = step % 64, bar = Math.floor(i / 16), b = i % 16, loop = Math.floor(step / 64);
  const chord = song.chords[bar];
  // drums
  if (i === 0) drum('crash', t, 0.07);
  if (song.kicks.includes(b)) drum('kick', t, 0.5);
  if (b === 4 || b === 12) drum('snare', t, 0.22);
  if (b % 2 === 0) drum('hat', t, 0.035);
  if (bar === 3 && b >= 12) drum('tom', t, 0.28);
  // galloping bass (da-da-DUM)
  if (!song.gallop || b % 4 !== 1) voice(chord[0] - 12, t, len * 0.9, 'sawtooth', b % 4 === 0 ? 0.11 : 0.07, 520, 0.01);
  // brass swell at the top of each bar, stab on beat 3
  if (b === 0) for (const n of chord) { voice(n + 12, t, len * 15, 'sawtooth', 0.03, 1500, 0.18, -8); voice(n + 12, t, len * 15, 'sawtooth', 0.03, 1500, 0.18, 8); }
  if (b === 8) for (const n of chord) voice(n + 12, t, len * 2, 'square', 0.025, 2200, 0.02);
  // horn melody (after the intro build-up)
  if (loop >= song.introLoops) for (const [st, m, l] of song.melody) if (st === i) {
    voice(m, t, len * l * 0.95, 'sawtooth', 0.045, 2600, 0.04, -6);
    voice(m, t, len * l * 0.95, 'sawtooth', 0.045, 2600, 0.04, 6);
    voice(m - 12, t, len * l * 0.95, 'square', 0.02, 1400, 0.04);
  }
}
function musicTick() {
  if (!actx || save.muted || !G || !G.running || G.paused || G.over) { music.next = 0; return; }
  const song = G.arena ? SONGS.boss : SONGS.hero;
  if (music.song !== song || music.level !== G.level) { music.song = song; music.level = G.level; music.step = 0; music.next = 0; }
  const len = 60 / song.bpm / 4;
  if (music.next < actx.currentTime) music.next = actx.currentTime + 0.05;
  while (music.next < actx.currentTime + 0.15) {
    try { playStep(song, music.step, music.next, len); } catch (e) { /* audio unavailable */ }
    music.step++; music.next += len;
  }
}
