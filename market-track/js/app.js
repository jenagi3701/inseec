/* ==========================================================================
   MARKETRACK — app.js
   Bootstrap, hash router, app chrome (sidebar chicken widget, top bar,
   mobile navigation), daily scheduler and local reminder notifications.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);

  const NAV = [
    ['dashboard', 'Dashboard', '🏠'], ['jobs', 'Jobs', '🔎'], ['saved', 'Saved', '★'], ['applications', 'Applications', '📋'],
    ['companies', 'Companies', '🏢'], ['statistics', 'Statistics', '📊'], ['profile', 'My Profile', '🐔']
  ];
  let lastRoute = null;

  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, query] = h.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const params = {};
    (query || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); params[k] = decodeURIComponent(v || ''); });
    return { section: parts[0] || 'dashboard', a: parts[1], b: parts[2], params, key: path };
  }

  function render() {
    const r = parse();
    const view = document.querySelector('#view');
    const routeChanged = r.key !== lastRoute;
    lastRoute = r.key;
    view.classList.remove('view-enter'); void view.offsetWidth; if (routeChanged) view.classList.add('view-enter');
    try {
      switch (r.section) {
        case 'jobs': r.a ? MT.jobs.renderDetail(view, r.a) : MT.jobs.renderList(view); break;
        case 'saved': MT.jobs.renderSaved(view); break;
        case 'applications': r.a ? MT.applications.renderRecord(view, r.a, r.b) : MT.applications.renderBoard(view); break;
        case 'companies': r.a ? MT.companies.renderDetail(view, r.a) : MT.companies.renderList(view); break;
        case 'statistics': MT.statistics.render(view); break;
        case 'profile': MT.profile.render(view, r.a); break;
        case 'prepare': MT.mission.render(view, r.a, r.params); break;
        default: MT.dashboard.render(view);
      }
    } catch (e) {
      console.error(e);
      view.innerHTML = '<div class="notice notice--error" role="alert"><strong>Oops — this page hit a problem.</strong> ' + esc(e.message) + ' <a href="#/dashboard">Back to the dashboard</a></div>';
    }
    const navKey = r.section === 'prepare' ? 'jobs' : r.section;
    U().$$('[data-nav]').forEach((a) => { const on = a.dataset.nav === navKey; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const label = (NAV.find((n) => n[0] === navKey) || NAV[0])[1];
    document.title = (r.section === 'prepare' ? 'Mission' : label) + ' · MARKETRACK';
    if (routeChanged) {
      window.scrollTo(0, 0);
      const h1 = view.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
      document.querySelector('.more-sheet') && document.querySelector('.more-sheet').classList.remove('is-open');
    }
    renderChrome();
  }

  function renderChrome() {
    const s = MT.chicken.stats(), lv = MT.chicken.level(s), acc = MT.chicken.currentAccessories(s);
    const j = MT.chicken.journeyPosition(s);
    const w = document.querySelector('#chicken-widget');
    if (w) w.innerHTML = '<button class="cw" id="cw-btn" aria-label="Open career profile: level ' + lv.current.n + ', ' + esc(lv.current.name) + '">' +
      '<span class="cw__art">' + MT.chicken.svg({ mood: j.mood, accessories: acc.worn, size: 78, level: lv.current.n }) + '</span>' +
      '<span class="cw__txt"><span class="cw__name">' + esc(lv.current.name.toUpperCase()) + '</span><span class="cw__lvl">Level ' + lv.current.n + ' · ' + lv.xp.toLocaleString('en') + ' XP</span>' +
      '<span class="xpbar xpbar--sm" aria-hidden="true"><span style="--v:' + Math.round(lv.pct * 100) + '%"></span></span>' +
      '<span class="cw__next">' + (lv.next ? 'Next: ' + esc(lv.next.name) : 'Max level 👑') + '</span></span></button>';
    const b = document.querySelector('#cw-btn'); if (b) b.onclick = MT.profile.careerProfile;
    const m = MT.jobsService.meta();
    U().$$('.js-last-updated').forEach((x) => { x.textContent = U().lastUpdatedLabel(m.lastRefresh); });
    const counts = { saved: s.saved, applications: s.apps.filter((a) => ['to_apply', 'applied', 'follow_up', 'interview', 'final_round'].indexOf(a.status) !== -1).length };
    U().$$('[data-count]').forEach((x) => { const v = counts[x.dataset.count]; x.textContent = v || ''; x.hidden = !v; });
    const bell = document.querySelector('#bell');
    if (bell) bell.hidden = !('Notification' in window) || Notification.permission !== 'default';
  }

  function checkReminders() {
    const today = U().isoDay(Date.now());
    const due = MT.storage.get('reminders', []).filter((r) => !r.done && U().daysBetween(Date.now(), r.date) <= 0 && r.notified !== today);
    if (!due.length) return;
    due.slice(0, 3).forEach((r) => {
      U().toast((r.kind === 'interview' ? '🎤 ' : '⏰ ') + r.title + ' — ' + U().relDay(r.date).toLowerCase(), 'warn', { duration: 9000, action: { label: 'Open', fn: () => { location.hash = '#/applications/' + r.applicationId + (r.kind === 'interview' ? '/prep' : '/followup'); } } });
      if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('MARKETRACK 🐔', { body: r.title }); } catch (e) { /* some browsers need a service worker */ } }
    });
    MT.storage.update('reminders', [], (list) => list.forEach((r) => { if (due.some((d) => d.id === r.id)) r.notified = today; }));
  }

  function bindShell() {
    U().$$('.brand__mark').forEach((m) => { m.innerHTML = MT.chicken.svg({ size: 40, animate: false, mood: 'confident', label: 'MARKETRACK chicken' }); });
    document.querySelector('#nav').innerHTML = NAV.map((n) => '<a class="nav__link" data-nav="' + n[0] + '" href="#/' + n[0] + '"><span class="nav__icon" aria-hidden="true">' + n[2] + '</span><span>' + n[1] + '</span>' + (n[0] === 'saved' || n[0] === 'applications' ? '<span class="nav__count" data-count="' + n[0] + '" hidden></span>' : '') + '</a>').join('');
    const mob = NAV.slice(0, 4);
    document.querySelector('#mobile-nav').innerHTML = mob.map((n) => '<a class="mnav__link" data-nav="' + n[0] + '" href="#/' + n[0] + '"><span aria-hidden="true">' + n[2] + '</span><span>' + (n[0] === 'applications' ? 'Tracker' : n[1]) + '</span></a>').join('') +
      '<button class="mnav__link" id="more-btn" aria-expanded="false" aria-controls="more-sheet"><span aria-hidden="true">☰</span><span>More</span></button>';
    document.querySelector('#more-sheet').innerHTML = NAV.slice(4).map((n) => '<a class="nav__link" data-nav="' + n[0] + '" href="#/' + n[0] + '"><span class="nav__icon" aria-hidden="true">' + n[2] + '</span>' + n[1] + '</a>').join('');
    document.querySelector('#more-btn').onclick = (e) => { const s = document.querySelector('#more-sheet'); const o = s.classList.toggle('is-open'); e.currentTarget.setAttribute('aria-expanded', o); };
    document.querySelector('#assistant-btn').onclick = () => MT.assistant.isOpen() ? MT.assistant.close() : MT.assistant.open();
    document.querySelector('#refresh-top').onclick = () => MT.jobs.runRefresh(() => render());
    document.querySelector('#bell').onclick = () => Notification.requestPermission().then((p) => { U().toast(p === 'granted' ? 'Reminder notifications enabled 🔔' : 'Notifications not enabled — reminders will still show inside MARKETRACK.', 'info'); renderChrome(); });
  }

  function boot() {
    MT.seed.ensure();
    bindShell();
    MT.jobsService.startScheduler((r) => {
      MT.matching.invalidate();
      setTimeout(() => U().toast('Daily refresh: ' + r.newJobs + ' new offer' + (r.newJobs === 1 ? '' : 's') + ', ' + r.updated + ' updated, ' + r.expired + ' expired (demo feed).', 'info', { duration: 6000 }), 600);
    });
    window.addEventListener('hashchange', render);
    render();
    setTimeout(checkReminders, 900);
    setInterval(checkReminders, 10 * 60 * 1000);
    if (!MT.storage.isPersistent()) U().toast('Your browser blocks local storage (private mode?). Data will be lost when you close the tab.', 'error', { duration: 9000 });
  }

  MT.app = { render, renderChrome, boot };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.MT = window.MT || {});
