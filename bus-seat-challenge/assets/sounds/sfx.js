/* =====================================================================
   BUS SEAT CHALLENGE — 8-BIT AUDIO (WebAudio, no sound files)
   All effects and the background tune are synthesised at runtime, so
   there are no audio assets to load and nothing breaks when audio is
   unavailable. The game is fully playable with sound off.
   ===================================================================== */
(function () {
  'use strict';
  let ctx = null, master = null, musicGain = null;
  let sfxOn = true, musicOn = false;
  let musicTimer = null, nextNoteTime = 0, step = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
        musicGain = ctx.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, opts = {}) {
    const c = ensure(); if (!c) return;
    const t0 = (opts.at || c.currentTime) + (opts.delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = opts.type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
    const v = opts.vol == null ? 0.3 : opts.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(opts.music ? musicGain : master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);   // midi → Hz

  const sounds = {
    click()   { tone(660, 0.05, { vol: 0.15 }); },
    correct() { tone(N(76), 0.08); tone(N(83), 0.12, { delay: 0.07 }); },
    perfect() { tone(N(79), 0.06); tone(N(84), 0.06, { delay: 0.05 }); tone(N(91), 0.14, { delay: 0.1 }); },
    wrong()   { tone(220, 0.16, { type: 'sawtooth', vol: 0.25 }); tone(150, 0.22, { type: 'sawtooth', vol: 0.25, delay: 0.12 }); },
    combo()   { [72, 76, 79, 84, 88].forEach((n, i) => tone(N(n), 0.07, { delay: i * 0.05, vol: 0.22 })); },
    tick()    { tone(1200, 0.03, { vol: 0.12 }); },
    early()   { tone(300, 0.06, { type: 'triangle', vol: 0.2 }); },
    ding()    { tone(N(88), 0.25, { type: 'triangle', vol: 0.25 }); tone(N(84), 0.35, { type: 'triangle', vol: 0.25, delay: 0.18 }); },
    sparkle() { tone(N(96), 0.05, { vol: 0.15 }); tone(N(100), 0.06, { vol: 0.15, delay: 0.05 }); },
    hide()    { tone(500, 0.25, { type: 'triangle', slide: 120, vol: 0.2 }); },
    levelUp() { [60, 64, 67, 72, 67, 72, 76].forEach((n, i) => tone(N(n + 12), 0.12, { delay: i * 0.09, vol: 0.22 })); },
    gameOver(){ [67, 63, 60, 55].forEach((n, i) => tone(N(n), 0.22, { delay: i * 0.18, type: 'triangle', vol: 0.3 })); },
    victory() { [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(N(n + 12), 0.14, { delay: i * 0.08, vol: 0.22 })); tone(N(96), 0.6, { delay: 0.6, type: 'triangle', vol: 0.25 }); }
  };

  function play(name) { if (!sfxOn) return; const f = sounds[name]; if (f) try { f(); } catch (e) { /* audio is optional */ } }

  /* --------- tiny chiptune loop (16 steps, 2 bars) --------- */
  const BPM = 136, STEP = 60 / BPM / 4;
  const BASS = [48, 0, 48, 0, 55, 0, 55, 0, 53, 0, 53, 0, 50, 0, 55, 0, 45, 0, 45, 0, 52, 0, 52, 0, 53, 0, 53, 0, 55, 0, 55, 0];
  const LEAD = [72, 0, 76, 79, 0, 76, 0, 74, 72, 0, 0, 74, 76, 0, 79, 0, 81, 0, 79, 76, 0, 74, 0, 72, 74, 0, 76, 0, 74, 0, 0, 0];

  function scheduler() {
    if (!ctx) return;
    while (nextNoteTime < ctx.currentTime + 0.12) {
      const i = step % BASS.length;
      if (BASS[i]) tone(N(BASS[i]), STEP * 1.8, { type: 'triangle', vol: 0.35, at: nextNoteTime, music: true });
      if (LEAD[i]) tone(N(LEAD[i]), STEP * 0.9, { type: 'square', vol: 0.12, at: nextNoteTime, music: true });
      if (i % 4 === 0) tone(90, 0.05, { type: 'square', vol: 0.12, at: nextNoteTime, music: true });
      nextNoteTime += STEP; step++;
    }
  }
  function startMusic() {
    if (!musicOn || musicTimer) return;
    const c = ensure(); if (!c) return;
    nextNoteTime = c.currentTime + 0.05; step = 0;
    musicTimer = setInterval(scheduler, 40);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

  window.BSC_SFX = {
    play,
    unlock() { if (sfxOn || musicOn) ensure(); if (musicOn) startMusic(); },
    setSound(on) { sfxOn = !!on; },
    setMusic(on) { musicOn = !!on; if (musicOn) startMusic(); else stopMusic(); },
    get soundOn() { return sfxOn; },
    get musicOn() { return musicOn; }
  };
})();
