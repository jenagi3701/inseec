/* ==========================================================================
   MARKETRACK — dashboard.js
   "What should I do today?" — greeting, the Chicken's Career Journey map,
   daily quests, KPIs, funnel, recommended quests, recent applications,
   next actions, upcoming follow-ups and achievements.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);
  const CH = () => MT.chicken;

  const MAP_PATH = 'M60,300 C130,300 150,215 225,220 S330,300 395,262 S470,170 540,190 S640,265 705,232 S790,140 845,140 S915,95 950,70';

  function journeyMap(s, lv, acc) {
    const j = CH().journeyPosition(s);
    const cps = CH().CHECKPOINTS;
    const clouds = [[120, 60, 1], [430, 45, 0.8], [760, 55, 1.1]].map((c) => '<g class="cloud" transform="translate(' + c[0] + ',' + c[1] + ') scale(' + c[2] + ')"><ellipse cx="0" cy="0" rx="34" ry="13"/><ellipse cx="22" cy="-8" rx="20" ry="14"/><ellipse cx="-18" cy="-6" rx="16" ry="11"/></g>').join('');
    const stars = [[300, 40], [600, 30], [880, 30], [520, 80], [60, 90]].map((p) => '<path class="mstar" d="M' + p[0] + ',' + (p[1] - 6) + 'l2,4 4,2 -4,2 -2,4 -2,-4 -4,-2 4,-2z"/>').join('');
    return '<section class="journey card card--map" aria-labelledby="jt">' +
      '<div class="journey__head"><div><p class="eyebrow">THE CHICKEN’S CAREER JOURNEY</p><h2 class="display-sm" id="jt">Help your chicken reach its dream job.</h2></div>' +
      '<button class="chicken-badge" id="open-cp" aria-label="Open career profile">' + lv.current.icon + ' Level ' + lv.current.n + ' · ' + esc(lv.current.name) + '</button></div>' +
      '<div class="journey__map"><svg viewBox="0 0 1000 340" class="map-svg" role="img" aria-label="Career journey map: the chicken is at ' + esc(cps[Math.min(6, Math.floor(j.pos))].label) + '">' +
      '<defs><linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="sky1"/><stop offset="1" class="sky2"/></linearGradient></defs>' +
      '<rect width="1000" height="340" fill="url(#sky)" rx="18"/>' + stars + clouds +
      '<path class="hill hill--back" d="M0,250 Q160,170 320,240 T640,220 T1000,180 V340 H0Z"/><path class="hill hill--front" d="M0,300 Q200,240 420,300 T820,280 T1000,260 V340 H0Z"/>' +
      '<path id="jpath" class="jpath" d="' + MAP_PATH + '"/><path class="jpath jpath--done" id="jdone" d="' + MAP_PATH + '"/>' +
      '<g id="jcps"></g><g id="jchicken" class="jchicken"></g></svg></div>' +
      '<ol class="journey__list">' + cps.map((c, i) => '<li class="' + (i <= Math.floor(j.pos) ? 'is-reached' : '') + (i === Math.floor(j.pos) ? ' is-here' : '') + '"><span aria-hidden="true">' + c.icon + '</span> ' + c.label + (i === Math.floor(j.pos) ? ' <strong>← your chicken</strong>' : '') + '</li>').join('') + '</ol>' +
      '<p class="journey__line"><span class="speech">“' + esc(j.line) + '”</span></p></section>';
  }
  function placeMap(root, s, acc, lv) {
    const path = root.querySelector('#jpath');
    if (!path || !path.getTotalLength) return;
    const L = path.getTotalLength();
    const j = CH().journeyPosition(s);
    const cps = CH().CHECKPOINTS;
    root.querySelector('#jcps').innerHTML = cps.map((c, i) => {
      const p = path.getPointAtLength(L * i / 6);
      const reached = i <= j.pos;
      return '<g class="cp' + (reached ? ' is-reached' : '') + '" transform="translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')"><rect x="-17" y="-17" width="34" height="34" rx="9" class="cp__box"/><text y="7" text-anchor="middle" class="cp__icon">' + c.icon + '</text>' +
        '<text y="38" text-anchor="middle" class="cp__label">' + c.label + '</text></g>';
    }).join('');
    const frac = Math.min(1, j.pos / 6);
    const done = root.querySelector('#jdone');
    done.style.strokeDasharray = L; done.style.strokeDashoffset = L * (1 - frac); done.style.opacity = frac > 0 ? 1 : 0;
    const pt = path.getPointAtLength(L * frac);
    const svgStr = CH().svg({ mood: j.mood, accessories: acc.worn, size: 72, level: lv.current.n });
    const g = root.querySelector('#jchicken');
    g.innerHTML = '<g transform="translate(-36,-62)">' + svgStr.replace('<svg ', '<svg x="0" y="0" ') + '</g>';
    g.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
  }

  function render(root) {
    const s = CH().stats(), lv = CH().level(s), acc = CH().currentAccessories(s);
    const p = MT.storage.get('profile', {});
    const jobs = MT.jobsService.all();
    const apps = s.apps;
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const newToday = jobs.filter((j) => j.status !== 'expired' && U().daysBetween(j.publishedAt, Date.now()) <= 0);
    const relevant = jobs.filter((j) => j.status !== 'expired' && MT.matching.scoreCached(j).score >= 70);
    const followUps = apps.filter((a) => a.followUpDate && ['applied', 'follow_up'].indexOf(a.status) !== -1 && U().daysBetween(Date.now(), a.followUpDate) <= 3);
    const interviewsUp = apps.filter((a) => a.interviewDate && a.interviewDate > Date.now() - U().DAY && ['interview', 'final_round'].indexOf(a.status) !== -1);
    const appliedIds = new Set(apps.filter((a) => a.status !== 'to_apply').map((a) => a.jobId));
    const recos = jobs.filter((j) => j.status !== 'expired' && !appliedIds.has(j.id)).sort((a, b) => (MT.matching.scoreCached(b).score + (U().daysBetween(b.publishedAt, Date.now()) <= 2 ? 6 : 0)) - (MT.matching.scoreCached(a).score + (U().daysBetween(a.publishedAt, Date.now()) <= 2 ? 6 : 0))).slice(0, 3);
    const quests = CH().dailyQuests();
    const meta = MT.jobsService.meta();
    const st = MT.statistics.compute();
    const recent = apps.slice().filter((a) => a.status !== 'to_apply').sort((a, b) => (b.applicationDate || 0) - (a.applicationDate || 0)).slice(0, 5);

    const actions = [];
    followUps.forEach((a) => actions.push({ icon: '💌', text: 'Follow up with ' + a.company, sub: U().relDay(a.followUpDate), href: '#/applications/' + a.id + '/followup' }));
    interviewsUp.forEach((a) => actions.push({ icon: '🎤', text: 'Prepare interview for ' + a.company, sub: U().fmtDate(a.interviewDate, { weekday: 'short', day: 'numeric', month: 'short' }), href: '#/applications/' + a.id + '/prep' }));
    apps.filter((a) => a.status === 'to_apply' && a.jobId).forEach((a) => actions.push({ icon: '📄', text: 'Apply to ' + a.company, sub: a.position, href: '#/prepare/' + a.jobId }));
    if (recos[0] && actions.length < 4) actions.push({ icon: '✨', text: 'Explore ' + recos[0].company, sub: MT.matching.scoreCached(recos[0]).score + '% match', href: '#/jobs/' + recos[0].id });
    if (!MT.cv.active().length) actions.unshift({ icon: '🎒', text: 'Upload your CV', sub: 'Unlocks matching & letters', href: '#/profile/cvs' });

    root.innerHTML =
      '<section class="hello"><div class="hello__txt"><p class="eyebrow">' + U().fmtDate(Date.now(), { weekday: 'long', day: 'numeric', month: 'long' }) + ' · Last updated: ' + esc(U().lastUpdatedLabel(meta.lastRefresh)) + '</p>' +
      '<h1 class="display">' + greet + (p.firstName ? ', ' + esc(p.firstName) : '') + ' 👋</h1><p class="lead">What should we do today? You have:</p>' +
      '<ul class="today"><li><a href="#/jobs"><strong>' + newToday.length + '</strong> new job' + (newToday.length === 1 ? '' : 's') + ' today · ' + relevant.length + ' relevant</a></li>' +
      '<li><a href="#/applications"><strong>' + followUps.length + '</strong> application' + (followUps.length === 1 ? '' : 's') + ' to follow up</a></li>' +
      '<li><a href="#/applications"><strong>' + interviewsUp.length + '</strong> interview' + (interviewsUp.length === 1 ? '' : 's') + ' coming up</a></li></ul></div>' +
      '<div class="hello__quests card"><h2 class="h4">TODAY’S CHICKEN QUESTS</h2><ul class="quests">' + quests.map((q) => '<li class="quest' + (q.done ? ' is-done' : '') + '"><label class="check"><input type="checkbox" data-quest="' + q.id + '" data-xp="' + q.xp + '"' + (q.done ? ' checked' : '') + '><span>' + q.icon + ' ' + esc(q.text) + '</span></label><a class="quest__go" href="' + q.href + '" aria-label="Go: ' + esc(q.text) + '">→</a><span class="xp">+' + q.xp + ' XP</span></li>').join('') + '</ul><p class="small muted">Quality over quantity: XP rewards personalised applications and real milestones, not mass-applying.</p></div></section>' +

      journeyMap(s, lv, acc) +

      '<div class="kpis kpis--strip">' + [[newToday.length, 'New jobs'], [relevant.length, 'Relevant offers'], [s.saved, 'Saved'], [s.applied, 'Applied'], [s.interviews, 'Interviews'], [s.offers, 'Offers'], [apps.filter((a) => a.status === 'rejected').length, 'Rejected'], [st.responseRate + '%', 'Response rate']].map((k) => '<div class="kpi"><span class="kpi__v">' + k[0] + '</span><span class="kpi__l">' + k[1] + '</span></div>').join('') + '</div>' +

      '<div class="dash-grid">' +
      '<section class="dash-reco"><div class="section-head"><h2 class="h3">Recommended for you</h2><a href="#/jobs" class="link">All jobs →</a></div>' +
      (recos.length ? '<div class="jgrid jgrid--3">' + recos.map((j) => MT.jobs.jobCard(j, { quest: true })).join('') + '</div>' : U().emptyState({ title: 'No recommendations', text: 'Nothing interesting yet. Let’s keep exploring.', prop: 'telescope' })) + '</section>' +

      '<section class="card dash-actions"><h2 class="h3">Your next actions</h2>' + (actions.length ? '<ul class="actions">' + actions.slice(0, 5).map((a) => '<li><a href="' + a.href + '"><span class="actions__icon" aria-hidden="true">' + a.icon + '</span><span><strong>' + esc(a.text) + '</strong><br><span class="small muted">' + esc(a.sub) + '</span></span><span aria-hidden="true">→</span></a></li>').join('') + '</ul>' : '<p class="muted">All clear — time to explore new quests.</p>') + '</section>' +

      '<section class="card dash-recent"><div class="section-head"><h2 class="h3">Your applications</h2><a href="#/applications" class="link">Tracker →</a></div>' +
      (recent.length ? '<div class="table-wrap"><table class="table"><caption class="sr-only">Recent applications</caption><thead><tr><th scope="col">Company</th><th scope="col">Position</th><th scope="col">Contract</th><th scope="col">Date applied</th><th scope="col">Status</th></tr></thead><tbody>' +
        recent.map((a) => '<tr><td><a href="#/applications/' + a.id + '">' + esc(a.company) + '</a></td><td>' + esc(a.position) + '</td><td>' + esc(a.contractType || '') + '</td><td>' + U().fmtShort(a.applicationDate) + '</td><td><span class="status status--' + a.status + '">' + CH().STATUS_META[a.status].emoji + ' ' + CH().STATUS_META[a.status].label + '</span></td></tr>').join('') + '</tbody></table></div>'
        : U().emptyState({ title: 'Ready for our first mission?', text: 'Every career journey starts with one application.', prop: 'paperBlank', action: { href: '#/jobs', label: 'Find a job' } })) + '</section>' +

      '<section class="card dash-funnel"><h2 class="h3">Application funnel</h2>' + MT.statistics.funnel(st.funnel) + '</section>' +

      '<section class="card dash-upcoming"><h2 class="h3">Upcoming follow-ups & interviews</h2>' + upcoming() + '</section>' +

      '<section class="card dash-ach"><div class="section-head"><h2 class="h3">Achievements</h2><button class="link" id="open-cp2">Career profile →</button></div><div class="ach-grid ach-grid--compact">' + CH().ACHIEVEMENTS.map(MT.profile.achCard).join('') + '</div></section>' +
      '</div>';

    placeMap(root, s, acc, lv);
    MT.jobs.bindCards(root, () => render(root));
    U().$$('[data-quest]', root).forEach((c) => c.onchange = () => {
      CH().toggleQuest(c.dataset.quest, +c.dataset.xp);
      if (c.checked) U().toast('+' + c.dataset.xp + ' XP — nice work! 🐔', 'success');
      const before = lv.current.n; render(root); MT.app.renderChrome();
      const after = CH().level().current.n; if (after > before) U().toast('LEVEL UP! Your chicken is now a ' + CH().level().current.name + ' ' + CH().level().current.icon, 'success', { duration: 6000 });
    });
    root.querySelector('#open-cp').onclick = MT.profile.careerProfile;
    root.querySelector('#open-cp2').onclick = MT.profile.careerProfile;
  }

  function upcoming() {
    const rems = MT.storage.get('reminders', []).filter((r) => !r.done && r.date > Date.now() - 3 * U().DAY).sort((a, b) => a.date - b.date).slice(0, 5);
    if (!rems.length) return '<p class="muted">No reminders. Set one from any application’s Follow-up tab.</p>';
    return '<ul class="list">' + rems.map((r) => '<li class="list__row"><a href="#/applications/' + r.applicationId + (r.kind === 'interview' ? '/prep' : '/followup') + '"><span>' + (r.kind === 'interview' ? '🎤' : '⏰') + ' ' + esc(r.title) + '</span><span class="small ' + (U().daysBetween(Date.now(), r.date) <= 0 ? 'text-alert' : 'muted') + '">' + U().fmtShort(r.date) + ' · ' + U().relDay(r.date) + '</span></a></li>').join('') + '</ul>';
  }

  MT.dashboard = { render };
})(window.MT = window.MT || {});
