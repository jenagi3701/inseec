/* =====================================================================
   BUS SEAT CHALLENGE — 8-BIT AUDIO (WebAudio, no sound files)
   All effects and the background tune are synthesised at runtime.
   Robustness:
     • the AudioContext is created/resumed inside a real user gesture
       (pointerup / touchend / click / keydown) and re-unlocked whenever
       the browser suspends it (tab switch, iOS interruptions)
     • iOS: plays a silent <audio> loop + sets audioSession to "playback"
       so sound works even with the ringer switch on silent
     • a compressor keeps the loud mix clean on small speakers
   The game is fully playable with sound off.
   ===================================================================== */
(function () {
  'use strict';
  let ctx = null, master = null, sfxBus = null, musicBus = null, analyser = null;
  let sfxOn = true, musicOn = false;
  let musicTimer = null, nextNoteTime = 0, step = 0;
  let silentEl = null;

  // tiny silent WAV, looped on iOS to switch the audio session to "playback"
  const SILENT_WAV = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

  function create() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC({ latencyHint: 'interactive' });
    } catch (e) {
      try { ctx = new AC(); } catch (e2) { ctx = null; return null; }
    }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.15;
    master = ctx.createGain(); master.gain.value = 0.9;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1.0;
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55;
    analyser = ctx.createAnalyser(); analyser.fftSize = 512;
    sfxBus.connect(master); musicBus.connect(master);
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    ctx.onstatechange = () => { if (ctx.state === 'running' && musicOn) startMusic(); };
    return ctx;
  }

  // Must be called from inside a user gesture the first time.
  function unlock() {
    if (!sfxOn && !musicOn) return;
    if (!ctx && !create()) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* Safari only */ }
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
      // classic iOS unlock: play an empty buffer synchronously inside the gesture
      try {
        const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
        s.buffer = b; s.connect(ctx.destination); s.start(0);
      } catch (e) { /* ignore */ }
    }
    if (!silentEl && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
      try {
        silentEl = new Audio(SILENT_WAV);
        silentEl.loop = true; silentEl.setAttribute('playsinline', '');
        silentEl.play().catch(() => {});
      } catch (e) { /* ignore */ }
    }
    if (musicOn) startMusic();
  }

  // unlock on every kind of user gesture until audio is running
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev =>
    document.addEventListener(ev, () => { if (!ctx || ctx.state !== 'running') unlock(); }, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { stopMusic(); ctx.suspend().catch(() => {}); }
    else { ctx.resume().catch(() => {}); if (musicOn) startMusic(); }
  });

  function tone(freq, dur, opts = {}) {
    if (!ctx || ctx.state === 'closed') return;
    const t0 = (opts.at || ctx.currentTime) + (opts.delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opts.type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
    const v = opts.vol == null ? 0.5 : opts.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.006);
    g.gain.setValueAtTime(v, t0 + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(opts.music ? musicBus : sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);   // midi → Hz

  const sounds = {
    click()   { tone(N(81), 0.06, { vol: 0.3 }); },
    correct() { tone(N(76), 0.1); tone(N(83), 0.16, { delay: 0.08 }); },
    perfect() { tone(N(79), 0.08); tone(N(84), 0.08, { delay: 0.06 }); tone(N(91), 0.2, { delay: 0.12 }); },
    wrong()   { tone(220, 0.18, { type: 'sawtooth', vol: 0.4 }); tone(150, 0.28, { type: 'sawtooth', vol: 0.4, delay: 0.14 }); },
    combo()   { [72, 76, 79, 84, 88].forEach((n, i) => tone(N(n), 0.09, { delay: i * 0.06, vol: 0.4 })); },
    tick()    { tone(1320, 0.04, { vol: 0.25 }); },
    early()   { tone(300, 0.08, { type: 'triangle', vol: 0.4 }); },
    ding()    { tone(N(88), 0.3, { type: 'triangle', vol: 0.5 }); tone(N(84), 0.45, { type: 'triangle', vol: 0.5, delay: 0.2 }); },
    sparkle() { tone(N(96), 0.07, { vol: 0.3 }); tone(N(100), 0.09, { vol: 0.3, delay: 0.06 }); },
    hide()    { tone(500, 0.3, { type: 'triangle', slide: 120, vol: 0.45 }); },
    levelUp() { [60, 64, 67, 72, 67, 72, 76].forEach((n, i) => tone(N(n + 12), 0.14, { delay: i * 0.1, vol: 0.4 })); },
    gameOver(){ [67, 63, 60, 55].forEach((n, i) => tone(N(n), 0.28, { delay: i * 0.2, type: 'triangle', vol: 0.55 })); },
    victory() { [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(N(n + 12), 0.16, { delay: i * 0.09, vol: 0.4 })); tone(N(96), 0.7, { delay: 0.65, type: 'triangle', vol: 0.45 }); }
  };

  function play(name) {
    if (!sfxOn) return;
    if (!ctx || ctx.state !== 'running') { unlock(); if (!ctx) return; }
    const f = sounds[name];
    if (f) try { f(); } catch (e) { /* audio is optional */ }
  }

  /* --------- chiptune loop (32 steps, 2 bars) --------- */
  const BPM = 136, STEP = 60 / BPM / 4;
  const BASS = [48, 0, 48, 0, 55, 0, 55, 0, 53, 0, 53, 0, 50, 0, 55, 0, 45, 0, 45, 0, 52, 0, 52, 0, 53, 0, 53, 0, 55, 0, 55, 0];
  const LEAD = [72, 0, 76, 79, 0, 76, 0, 74, 72, 0, 0, 74, 76, 0, 79, 0, 81, 0, 79, 76, 0, 74, 0, 72, 74, 0, 76, 0, 74, 0, 0, 0];

  function scheduler() {
    if (!ctx || ctx.state !== 'running') return;
    if (nextNoteTime < ctx.currentTime) nextNoteTime = ctx.currentTime + 0.03;   // catch up after a stall
    while (nextNoteTime < ctx.currentTime + 0.15) {
      const i = step % BASS.length;
      if (BASS[i]) tone(N(BASS[i]), STEP * 1.8, { type: 'triangle', vol: 0.7, at: nextNoteTime, music: true });
      if (LEAD[i]) tone(N(LEAD[i]), STEP * 0.9, { type: 'square', vol: 0.22, at: nextNoteTime, music: true });
      if (i % 4 === 0) tone(110, 0.05, { type: 'square', vol: 0.25, slide: 50, at: nextNoteTime, music: true });
      nextNoteTime += STEP; step++;
    }
  }
  function startMusic() {
    if (!musicOn || musicTimer || !ctx) return;
    nextNoteTime = ctx.currentTime + 0.05;
    musicTimer = setInterval(scheduler, 40);
    scheduler();
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

  window.BSC_SFX = {
    play,
    unlock,
    setSound(on) { sfxOn = !!on; if (sfxOn && ctx) unlock(); },
    setMusic(on) {
      musicOn = !!on;
      if (musicOn) { if (ctx) unlock(); }    // first start happens on the next user gesture
      else stopMusic();
    },
    get soundOn() { return sfxOn; },
    get musicOn() { return musicOn; },
    get state() { return ctx ? ctx.state : 'none'; },
    // current output peak (0–1), used by automated tests
    level() {
      if (!analyser) return 0;
      const a = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(a);
      let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); return m;
    }
  };
})();
