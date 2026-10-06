/* ==========================================================================
   CHIC CAREER — companies.js
   Company tracking: your full history with each company (applications,
   positions, dates, statuses, interviews, rejections, offers) + open offers.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);
  const CH = () => MT.chicken;

  function companies() {
    const map = {};
    const get = (name) => { const k = U().norm(name); return (map[k] = map[k] || { id: k, name, applications: [], jobs: [], saved: 0 }); };
    MT.applications.all().forEach((a) => get(a.company).applications.push(a));
    const saved = MT.storage.get('saved', {});
    MT.jobsService.all().forEach((j) => { const c = get(j.company); c.jobs.push(j); if (saved[j.id]) c.saved++; });
    return Object.values(map).map((c) => {
      const st = (s) => c.applications.filter((a) => a.status === s).length;
      return Object.assign(c, {
        interviews: c.applications.filter((a) => CH().maxStage(a) >= 3).length, rejections: st('rejected'), offers: st('offer'),
        lastActivity: Math.max(0, ...c.applications.map((a) => a.lastUpdate || 0)),
        industry: (c.jobs[0] || c.applications[0] || {}).industry || ''
      });
    });
  }

  function renderList(root) {
    const all = companies();
    const tracked = all.filter((c) => c.applications.length).sort((a, b) => b.lastActivity - a.lastActivity);
    const others = all.filter((c) => !c.applications.length && (c.saved || c.jobs.some((j) => j.status !== 'expired'))).sort((a, b) => b.saved - a.saved || a.name.localeCompare(b.name));
    const card = (c) => '<a class="ccard card" href="#/companies/' + encodeURIComponent(c.name) + '"><div class="ccard__logo" aria-hidden="true">' + esc(c.name.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 2).toUpperCase()) + '</div>' +
      '<div class="ccard__main"><h3 class="h4">' + esc(c.name) + '</h3><p class="small muted">' + esc(MT.knowledge.industryLabel(c.industry)) + '</p>' +
      '<p class="small">' + (c.applications.length ? c.applications.length + ' application' + (c.applications.length > 1 ? 's' : '') + ' · ' + c.applications.map((a) => CH().STATUS_META[a.status].emoji).join(' ') : c.jobs.length + ' open offer' + (c.jobs.length > 1 ? 's' : '') + (c.saved ? ' · ★ saved' : '')) + '</p></div>' +
      '<div class="ccard__stats">' + (c.interviews ? '<span class="chip chip--accent">🎤 ' + c.interviews + '</span>' : '') + (c.offers ? '<span class="chip chip--ok">👑 ' + c.offers + '</span>' : '') + (c.rejections ? '<span class="chip">🌧 ' + c.rejections + '</span>' : '') + '</div></a>';
    root.innerHTML = '<header class="page-head"><div><p class="eyebrow">Relationship history</p><h1 class="display">Companies</h1><p class="lead">Your history with each company, in one place.</p></div></header>' +
      '<h2 class="h3">Companies you applied to (' + tracked.length + ')</h2>' +
      (tracked.length ? '<div class="cgrid">' + tracked.map(card).join('') + '</div>' : U().emptyState({ title: 'No applications yet', text: 'Every career journey starts with one application.', prop: 'paperBlank', action: { href: '#/jobs', label: 'Find a job' } })) +
      '<h2 class="h3">Companies hiring in your feed (' + others.length + ')</h2><div class="cgrid">' + others.map(card).join('') + '</div>';
  }

  function renderDetail(root, name) {
    const c = companies().find((x) => x.id === U().norm(name));
    if (!c) { root.innerHTML = U().emptyState({ title: 'Company not found', text: 'No application or offer for this company yet.', action: { href: '#/companies', label: 'All companies' } }); return; }
    const apps = c.applications.slice().sort((a, b) => (b.applicationDate || b.createdAt) - (a.applicationDate || a.createdAt));
    root.innerHTML = '<a class="back" href="#/companies">← Companies</a><header class="card company-head"><div class="ccard__logo ccard__logo--lg" aria-hidden="true">' + esc(c.name.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 2).toUpperCase()) + '</div><div><p class="eyebrow">Company</p><h1 class="display-sm">' + esc(c.name) + '</h1><p class="muted">' + esc(MT.knowledge.industryLabel(c.industry)) + (c.jobs[0] && c.jobs[0].companyAbout ? ' · ' + esc(c.jobs[0].companyAbout) + ' <span class="tag tag--offer">from the offer</span>' : '') + '</p></div></header>' +
      '<div class="kpis"><div class="kpi"><span class="kpi__v">' + apps.length + '</span><span class="kpi__l">Applications</span></div><div class="kpi"><span class="kpi__v">' + c.interviews + '</span><span class="kpi__l">Interviews</span></div><div class="kpi"><span class="kpi__v">' + c.rejections + '</span><span class="kpi__l">Rejections</span></div><div class="kpi"><span class="kpi__v">' + c.offers + '</span><span class="kpi__l">Offers</span></div></div>' +
      '<section class="card"><h2 class="h3">Positions applied for</h2>' + (apps.length ? '<div class="table-wrap"><table class="table"><caption class="sr-only">Applications at ' + esc(c.name) + '</caption><thead><tr><th scope="col">Position</th><th scope="col">Contract</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Interview</th></tr></thead><tbody>' +
        apps.map((a) => '<tr><td><a href="#/applications/' + a.id + '">' + esc(a.position) + '</a></td><td>' + esc(a.contractType || '—') + '</td><td>' + (a.applicationDate ? U().fmtDate(a.applicationDate) : '<span class="muted">not applied yet</span>') + '</td><td><span class="status status--' + a.status + '">' + CH().STATUS_META[a.status].emoji + ' ' + CH().STATUS_META[a.status].label + '</span></td><td>' + (a.interviewDate ? U().fmtDate(a.interviewDate) : '—') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">You haven’t applied here yet.</p>') + '</section>' +
      '<section class="card"><h2 class="h3">Offers from ' + esc(c.name) + ' in your feed</h2>' + (c.jobs.length ? '<div class="jgrid">' + c.jobs.map((j) => MT.jobs.jobCard(j)).join('') + '</div>' : '<p class="muted">No current offer.</p>') + '</section>';
    MT.jobs.bindCards(root, () => renderDetail(root, name));
  }

  MT.companies = { companies, renderList, renderDetail };
})(window.MT = window.MT || {});
