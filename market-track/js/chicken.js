/* ==========================================================================
   MARKETRACK — chicken.js
   The Career Chicken: pixel-art sprite generator, moods, accessories,
   levels / XP, achievements, journey position and daily quests.
   Progress is always *derived from real actions* (applications, statuses…),
   never invented. Rejections never move the chicken backwards.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;

  /* ------------------------------------------------------------ sprite (20×20) */
  const BASE = [
    '....................',
    '............R.R.R...',
    '...........RRRRRR...',
    '..........KKKKKKK...',
    '.........KWWWWWWWK..',
    '.........KWWWWWEWKOO',
    '.K.......KWWWWWEWKO.',
    '.KK......KWWWWWWWKr.',
    '.KWK.....KWWWWWWWK..',
    '.KWWKKKKKWWWWWWWWK..',
    '.KWWWWWWWWWWWWWWWK..',
    '.KWWWWwwwwWWWWWWWK..',
    '.KWWWWWwwwwWWWWWWK..',
    '..KWWWWWWWWWWWWWK...',
    '...KWWWWWWWWWWWK....',
    '....KKKKKKKKKKK.....',
    '.......Y...Y........',
    '.......Y...Y........',
    '......YYY.YYY.......',
    '....................'
  ];

  const PALETTE = {
    adult: { K: '#2B2622', W: '#FFFDF7', w: '#E9DFCC', R: '#E5484D', r: '#E5484D', O: '#F28C28', Y: '#F2B53A', E: '#2B2622' },
    chick: { K: '#2B2622', W: '#FFD95A', w: '#F2BE3A', R: '#FFD95A', r: '#FFD95A', O: '#F28C28', Y: '#F28C28', E: '#2B2622' }
  };

  // Accessory overlays: [x, y, color] pixels (coordinates may exceed the 20×20 grid).
  const C = { brown: '#8A5A3B', brownD: '#6B4329', grey: '#5B6470', greyL: '#B9C2CC', screen: '#7FB3D5', gold: '#F5B700', goldD: '#C98E00', navy: '#2F3E5C', paper: '#FFFFFF', line: '#9AA3AD', red: '#E5484D', mic: '#3A3F47', star: '#FFC83D', green: '#4E9A6B' };
  function rect(x, y, w, h, col) { const p = []; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) p.push([x + i, y + j, col]); return p; }
  const ACCESSORIES = {
    backpack: { label: 'Tiny backpack', px: [].concat(rect(3, 9, 4, 5, C.brown), rect(3, 9, 4, 1, C.brownD), rect(4, 11, 2, 1, C.brownD)) },
    laptop: { label: 'Tiny laptop', px: [].concat(rect(17, 12, 5, 3, C.grey), rect(18, 12, 3, 2, C.screen), rect(16, 15, 7, 1, C.greyL)) },
    document: { label: 'Application document', px: [].concat(rect(17, 9, 4, 5, C.paper), rect(17, 9, 4, 1, C.line), rect(18, 11, 2, 1, C.line), rect(18, 12, 2, 1, C.line), [[16, 9, C.line], [16, 13, C.line], [21, 9, C.line], [21, 13, C.line]]) },
    target: { label: 'Small target', px: [].concat(rect(-2, 2, 3, 3, C.red), [[-1, 3, C.paper]]) },
    microphone: { label: 'Microphone', px: [].concat(rect(19, 8, 2, 2, C.mic), rect(19, 10, 1, 4, C.grey)) },
    star: { label: 'Small star', px: [[1, 1, C.star], [0, 2, C.star], [1, 2, C.star], [2, 2, C.star], [1, 3, C.star]] },
    crown: { label: 'Crown', px: [].concat(rect(11, 0, 6, 2, C.gold), [[11, -1, C.gold], [13, -1, C.gold], [16, -1, C.gold], [14, -2, C.gold], [13, 1, C.red], [15, 1, C.goldD]]), hidesComb: true },
    tie: { label: 'Interview tie', px: [[15, 8, C.navy], [15, 9, C.navy], [16, 9, C.navy], [15, 10, C.navy], [15, 11, C.navy]] },
    blazer: { label: 'Blazer', px: [].concat(rect(10, 10, 7, 4, C.navy), [[13, 10, '#FFFDF7'], [14, 10, '#FFFDF7']]) },
    flag: { label: 'Flag', px: [].concat(rect(20, 3, 1, 13, C.grey), rect(21, 3, 4, 3, C.green)) },
    telescope: { label: 'Telescope', px: [].concat(rect(18, 3, 4, 2, C.brown), rect(22, 2, 1, 4, C.brownD)) },
    paperBlank: { label: 'Blank document', px: [].concat(rect(17, 9, 4, 5, C.paper), [[16, 9, C.line], [16, 13, C.line], [21, 9, C.line], [21, 13, C.line]]) },
    campfire: { label: 'Campfire', px: [].concat(rect(-3, 16, 4, 1, C.brown), [[-2, 14, '#F28C28'], [-1, 13, C.red], [-1, 14, '#F5B700'], [-2, 15, '#F28C28'], [-1, 15, '#F5B700'], [0, 15, '#F28C28']]) },
    magnifier: { label: 'Magnifying glass', px: [].concat([[19, 4, C.grey], [20, 4, C.grey], [18, 5, C.grey], [21, 5, C.grey], [18, 6, C.grey], [21, 6, C.grey], [19, 7, C.grey], [20, 7, C.grey], [19, 5, C.screen], [20, 5, C.screen], [19, 6, C.screen], [20, 6, C.screen], [21, 8, C.brownD], [22, 9, C.brownD]]) },
    sweat: { label: '', px: [[8, 3, C.screen], [8, 4, C.screen]] },
    hearts: { label: '', px: [[21, 0, C.red], [23, 0, C.red], [21, 1, C.red], [22, 1, C.red], [23, 1, C.red], [22, 2, C.red]] }
  };

  // Mood = eye / cheek tweaks + optional overlay
  const MOODS = {
    curious: { eye: 'normal' },
    nervous: { eye: 'normal', extra: 'sweat' },
    excited: { eye: 'happy', cheek: true, extra: 'hearts' },
    optimistic: { eye: 'happy', cheek: true },
    thoughtful: { eye: 'up' },
    determined: { eye: 'focus' },
    confident: { eye: 'happy' },
    patient: { eye: 'closed' },
    motivated: { eye: 'focus', cheek: true },
    celebrating: { eye: 'happy', cheek: true },
    happy: { eye: 'happy', cheek: true }
  };

  function svg(opts) {
    opts = opts || {};
    const size = opts.size || 96;
    const level = opts.level || (MT.chicken && MT.chicken._levelCache) || 2;
    const pal = level <= 1 && !opts.adult ? PALETTE.chick : PALETTE.adult;
    const mood = MOODS[opts.mood] || MOODS.curious;
    const acc = (opts.accessories || []).slice();
    if (opts.prop) acc.push(opts.prop);
    if (mood.extra) acc.push(mood.extra);
    const hidesComb = acc.some((a) => ACCESSORIES[a] && ACCESSORIES[a].hidesComb) || pal === PALETTE.chick;

    const px = [];
    BASE.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        let ch = row[x];
        if (ch === '.') continue;
        if (hidesComb && y <= 2 && ch === 'R') continue;
        if (ch === 'E') {
          // eye variants on the 2×1 eye column (x=15, y=5..6)
          if (mood.eye === 'happy') { if (y === 6) ch = 'W'; }
          else if (mood.eye === 'closed') { if (y === 5) ch = 'W'; }
          else if (mood.eye === 'up') { if (y === 6) ch = 'W'; }
        }
        px.push([x, y, pal[ch] || ch]);
      }
    });
    if (mood.eye === 'happy') px.push([14, 5, pal.E], [16, 5, pal.E]); // ^ shaped
    if (mood.eye === 'up') px.push([15, 4, pal.E]);
    if (mood.eye === 'focus') px.push([14, 4, pal.K], [15, 4, pal.K]); // brow
    if (mood.cheek) px.push([14, 7, '#F7A1A8']);
    acc.forEach((a) => { const d = ACCESSORIES[a]; if (d) d.px.forEach((p) => px.push(p)); });

    const rects = px.map((p) => '<rect x="' + p[0] + '" y="' + p[1] + '" width="1.02" height="1.02" fill="' + p[2] + '"/>').join('');
    const cls = 'chicken-svg' + (opts.animate === false ? '' : ' chicken-svg--' + (opts.anim || 'bob'));
    return '<svg class="' + cls + '" viewBox="-4 -3 30 23" width="' + size + '" height="' + Math.round(size * 23 / 30) + '" shape-rendering="crispEdges" role="img" aria-label="' + U().esc(opts.label || 'Career Chicken, ' + (opts.mood || 'curious')) + '">' + rects + '</svg>';
  }

  /* ------------------------------------------------------------ progress model */
  const STATUS_ORDER = ['to_apply', 'applied', 'follow_up', 'interview', 'final_round', 'offer'];
  const STATUS_META = {
    to_apply: { label: 'To Apply', emoji: '📝' }, applied: { label: 'Applied', emoji: '📄' }, follow_up: { label: 'Follow-up', emoji: '💌' },
    interview: { label: 'Interview', emoji: '🎤' }, final_round: { label: 'Final Round', emoji: '🔥' }, offer: { label: 'Offer', emoji: '👑' },
    rejected: { label: 'Rejected', emoji: '🌧' }, withdrawn: { label: 'Withdrawn', emoji: '↩' }
  };
  /** Highest pipeline stage an application ever reached (rejection never lowers it). */
  function maxStage(app) {
    let best = Math.max(0, STATUS_ORDER.indexOf(app.status));
    (app.timeline || []).forEach((e) => { if (e.status) best = Math.max(best, STATUS_ORDER.indexOf(e.status)); });
    if ((app.status === 'rejected' || app.status === 'withdrawn') && app.applicationDate) best = Math.max(best, 1);
    return best;
  }

  function stats() {
    const apps = MT.storage.get('applications', []);
    const jobs = MT.storage.get('jobs', []);
    const act = MT.storage.get('activity', { viewedJobs: {} });
    const saved = MT.storage.get('saved', {});
    const letters = MT.storage.get('coverLetters', []);
    const cvs = MT.storage.get('cvs', []);
    const profile = MT.storage.get('profile', {});
    const reached = apps.map(maxStage);
    const count = (i) => reached.filter((r) => r >= i).length;
    const applied = count(1);
    const interviews = count(3);
    const finals = count(4);
    const offers = apps.filter((a) => a.status === 'offer').length;
    const interviewDone = apps.filter((a) => maxStage(a) >= 4 || (a.timeline || []).some((e) => e.type === 'interview_done')).length;
    const highMatchApplied = apps.some((a) => maxStage(a) >= 1 && (a.matchScore || 0) >= 90);
    const lettersApplied = apps.filter((a) => maxStage(a) >= 1 && a.coverLetterId).length;
    const uniqueLetters = letters.filter((l) => (l.similarityScore || 0) < 30).length;
    return {
      apps, jobs: jobs.length, viewed: Object.keys(act.viewedJobs || {}).length, saved: Object.keys(saved).length,
      applied, interviews, finals, offers, interviewDone, highMatchApplied, lettersApplied, uniqueLetters,
      cvUploaded: cvs.length > 0, portfolio: !!(profile.portfolio), letters: letters.length
    };
  }

  const ACHIEVEMENTS = [
    { id: 'first-step', icon: '🐣', title: 'FIRST STEP', text: 'Your first application.', test: (s) => s.applied >= 1 },
    { id: 'explorer', icon: '🔎', title: 'EXPLORER', text: 'You explored 25 relevant jobs.', test: (s) => s.viewed >= 25, progress: (s) => [s.viewed, 25] },
    { id: 'sharp-eye', icon: '🎯', title: 'SHARP EYE', text: 'You applied to a 90%+ match.', test: (s) => s.highMatchApplied },
    { id: 'app-pro', icon: '📄', title: 'APPLICATION PRO', text: 'You sent 10 personalised applications.', test: (s) => s.lettersApplied >= 10, progress: (s) => [s.lettersApplied, 10] },
    { id: 'personal-touch', icon: '💌', title: 'PERSONAL TOUCH', text: 'You generated 10 unique cover letters.', test: (s) => s.uniqueLetters >= 10, progress: (s) => [s.uniqueLetters, 10] },
    { id: 'brave', icon: '🎤', title: 'BRAVE CHICKEN', text: 'Your first interview.', test: (s) => s.interviews >= 1 },
    { id: 'conqueror', icon: '👑', title: 'CAREER CONQUEROR', text: 'Your first offer.', test: (s) => s.offers >= 1 }
  ];

  const UNLOCKS = [
    { id: 'backpack', when: 'First CV uploaded', test: (s) => s.cvUploaded },
    { id: 'laptop', when: 'Portfolio added', test: (s) => s.portfolio },
    { id: 'document', when: 'First application', test: (s) => s.applied >= 1 },
    { id: 'target', when: '5 applications', test: (s) => s.applied >= 5 },
    { id: 'microphone', when: 'First interview', test: (s) => s.interviews >= 1 },
    { id: 'star', when: 'Interview completed', test: (s) => s.interviewDone >= 1 },
    { id: 'crown', when: 'First offer', test: (s) => s.offers >= 1 }
  ];

  const LEVELS = [
    { n: 1, icon: '🐣', name: 'Career Chick', text: 'The journey begins.', xp: 0 },
    { n: 2, icon: '🐔', name: 'Job Explorer', text: 'Discovering opportunities.', xp: 60 },
    { n: 3, icon: '🎒', name: 'Opportunity Hunter', text: 'Actively applying.', xp: 200 },
    { n: 4, icon: '⚡', name: 'Strategic Applicant', text: 'Personalising every application.', xp: 400 },
    { n: 5, icon: '🎤', name: 'Interview Pro', text: 'Ready for interviews.', xp: 650, needs: (s) => s.interviews >= 1 },
    { n: 6, icon: '🔥', name: 'Career Challenger', text: 'Approaching the goal.', xp: 900, needs: (s) => s.finals >= 1 },
    { n: 7, icon: '👑', name: 'Career Conqueror', text: 'Offer received!', xp: 1200, needs: (s) => s.offers >= 1 }
  ];

  /** XP rewards quality actions (personalised letters, interviews), not volume. */
  function xp(s) {
    s = s || stats();
    const q = MT.storage.get('quests', { xpTotal: 0 });
    let total = 0;
    total += Math.min(s.viewed, 40) * 2;
    total += Math.min(s.saved, 20) * 5;
    total += (s.cvUploaded ? 25 : 0) + (s.portfolio ? 20 : 0);
    total += s.applied * 30;
    total += s.lettersApplied * 25;
    total += s.interviews * 80 + s.finals * 100 + s.offers * 300;
    total += q.xpTotal || 0;
    return total;
  }

  /**
   * Levels 1–4 are earned with XP (quality actions); levels 5–7 are real
   * milestones (first interview, final round, offer) — never bought with XP.
   */
  function level(s) {
    s = s || stats();
    const x = xp(s);
    let cur = LEVELS[0];
    LEVELS.forEach((l) => {
      if (l.needs ? l.needs(s) : (x >= l.xp && (l.n < 4 || s.lettersApplied >= 1))) cur = l.n > cur.n ? l : cur;
    });
    const next = LEVELS.find((l) => l.n === cur.n + 1);
    let pct = 1;
    if (next && !next.needs) pct = Math.max(0, Math.min(1, (x - cur.xp) / (next.xp - cur.xp)));
    else if (next) pct = Math.max(0, Math.min(0.95, (x - cur.xp) / Math.max(1, next.xp - cur.xp)));
    MT.chicken._levelCache = cur.n;
    const unlockHint = next && next.needs ? { 5: 'unlocks with your first interview', 6: 'unlocks when you reach a final round', 7: 'unlocks with your first offer' }[next.n] : '';
    return { current: cur, next, xp: x, pct, unlockHint };
  }

  /* ------------------------------------------------------------ journey */
  const CHECKPOINTS = [
    { id: 'start', icon: '🥚', label: 'START' },
    { id: 'discover', icon: '🔎', label: 'DISCOVER' },
    { id: 'explore', icon: '🗺️', label: 'EXPLORE' },
    { id: 'apply', icon: '📄', label: 'APPLY' },
    { id: 'interview', icon: '🎤', label: 'INTERVIEW' },
    { id: 'final', icon: '🚪', label: 'FINAL STEP' },
    { id: 'dream', icon: '👑', label: 'DREAM JOB' }
  ];
  /** Returns a float 0..6 along the checkpoints, from real progress. */
  function journeyPosition(s) {
    s = s || stats();
    if (s.offers) return { pos: 6, mood: 'celebrating', line: 'WE DID IT! 👑' };
    if (s.finals) return { pos: 5 + Math.min(0.5, s.finals * 0.2), mood: 'motivated', line: 'The final gate is right there. Deep breath.' };
    if (s.interviews) return { pos: 4 + Math.min(0.6, (s.interviews - 1) * 0.2 + 0.1), mood: 'confident', line: 'Interview season! Let’s get ready.' };
    if (s.applied) return { pos: 3 + Math.min(0.7, s.applied * 0.1), mood: s.applied >= 3 ? 'patient' : 'determined', line: s.applied >= 3 ? 'Waiting for answers… patient, but a little anxious.' : 'Applications are out there. Keep going!' };
    if (s.saved) return { pos: 2 + Math.min(0.6, s.saved * 0.1), mood: 'optimistic', line: 'Good finds! Ready to prepare an application?' };
    if (s.viewed) return { pos: 1 + Math.min(0.7, s.viewed * 0.05), mood: 'curious', line: 'So many offers to sniff around…' };
    return { pos: 0, mood: 'nervous', line: 'A little nervous… but ready for the adventure.' };
  }

  function currentAccessories(s) {
    s = s || stats();
    const unlocked = UNLOCKS.filter((u) => u.test(s)).map((u) => u.id);
    const settings = MT.storage.get('settings', {});
    let worn = settings.worn;
    if (!Array.isArray(worn)) worn = unlocked.slice(-2); // default: two most recent — never overloaded
    worn = worn.filter((w) => unlocked.indexOf(w) !== -1).slice(0, 2);
    return { unlocked, worn };
  }

  function reactionToScore(sc) {
    if (sc >= 90) return { mood: 'excited', line: 'Okay… THIS looks interesting.' };
    if (sc >= 75) return { mood: 'optimistic', line: 'Pretty good match. Let’s investigate.' };
    if (sc >= 50) return { mood: 'thoughtful', line: 'Interesting… but we have a few gaps to work on.' };
    return { mood: 'curious', line: 'Not the strongest match, but let’s see if there’s something worth exploring.' };
  }

  /* ------------------------------------------------------------ daily quests */
  function dailyQuests() {
    const day = U().isoDay(Date.now());
    let q = MT.storage.get('quests', { xpTotal: 0 });
    if (q.date !== day) { q = { xpTotal: q.xpTotal || 0, date: day, done: {} }; MT.storage.set('quests', q); }
    const apps = MT.storage.get('applications', []);
    const list = [{ id: 'explore', icon: '🔎', text: 'Explore 5 new offers', xp: 10, href: '#/jobs' }];
    const toApply = apps.find((a) => a.status === 'to_apply');
    list.push({ id: 'apply', icon: '📄', text: toApply ? 'Complete your application to ' + toApply.company : 'Complete 1 personalised application', xp: 30, href: toApply && toApply.jobId ? '#/prepare/' + toApply.jobId : '#/jobs' });
    const fu = apps.filter((a) => a.followUpDate && ['applied', 'follow_up'].indexOf(a.status) !== -1).sort((a, b) => a.followUpDate - b.followUpDate)[0];
    if (fu) list.push({ id: 'follow', icon: '💌', text: 'Follow up with ' + fu.company, xp: 20, href: '#/applications/' + fu.id });
    const iv = apps.find((a) => a.status === 'interview' || a.status === 'final_round');
    if (iv) list.push({ id: 'prep', icon: '🎤', text: 'Prepare your ' + iv.company + ' interview', xp: 25, href: '#/applications/' + iv.id + '/prep' });
    else list.push({ id: 'profile', icon: '🧾', text: 'Polish one experience in your CV data', xp: 10, href: '#/profile/cvs' });
    return list.map((x) => Object.assign(x, { done: !!q.done[x.id] }));
  }
  function toggleQuest(id, xpVal) {
    MT.storage.update('quests', { xpTotal: 0, done: {} }, (q) => {
      q.done = q.done || {};
      if (q.done[id]) { delete q.done[id]; q.xpTotal = Math.max(0, (q.xpTotal || 0) - xpVal); }
      else { q.done[id] = true; q.xpTotal = (q.xpTotal || 0) + xpVal; }
    });
  }

  MT.chicken = {
    svg, ACCESSORIES, MOODS, STATUS_ORDER, STATUS_META, maxStage, stats, xp, level, LEVELS, ACHIEVEMENTS, UNLOCKS,
    CHECKPOINTS, journeyPosition, currentAccessories, reactionToScore, dailyQuests, toggleQuest, _levelCache: 2
  };
})(window.MT = window.MT || {});
