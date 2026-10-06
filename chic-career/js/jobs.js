/* ==========================================================================
   CHIC CAREER — jobs.js
   Job discovery (search, filters, sorting, quest cards), job detail page
   (overview, requirements, transparent match, sources), Saved jobs.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);
  const K = () => MT.knowledge;
  const S = () => MT.jobsService;

  const DEFAULT_FILTERS = { q: '', contracts: [], fields: [], locations: [], sources: [], posted: 'any', durations: [], salaryMin: '', salaryMax: '', showExpired: false, minScore: 0, sort: 'relevance' };
  let filters = loadFilters();
  function loadFilters() { try { return Object.assign({}, DEFAULT_FILTERS, JSON.parse(sessionStorage.getItem('mt:jobFilters') || '{}')); } catch (e) { return Object.assign({}, DEFAULT_FILTERS); } }
  function saveFilters() { try { sessionStorage.setItem('mt:jobFilters', JSON.stringify(filters)); } catch (e) { /* private mode */ } }

  /* ------------------------------------------------------------ helpers */
  const WORK = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };
  function salaryText(s) { if (!s) return 'Salary not specified'; return (s.min === s.max ? s.min : s.min + '–' + s.max) + ' €/month'; }
  function sourceBadges(job, small) {
    return job.sources.map((s) => '<span class="src src--' + s.source + (small ? ' src--sm' : '') + '" title="' + esc(S().SOURCE_LABEL[s.source]) + '">' + esc(S().SOURCE_LABEL[s.source]) + '</span>').join('');
  }
  function isSaved(id) { return !!MT.storage.get('saved', {})[id]; }
  function toggleSave(id) {
    let now;
    MT.storage.update('saved', {}, (s) => { if (s[id]) { delete s[id]; now = false; } else { s[id] = { savedAt: Date.now(), notes: '', priority: 'medium' }; now = true; } });
    U().toast(now ? 'Saved — your chicken tucked it in its backpack 🎒' : 'Removed from saved', now ? 'success' : 'info');
    return now;
  }
  function markViewed(id) { MT.storage.update('activity', { viewedJobs: {} }, (a) => { a.viewedJobs = a.viewedJobs || {}; if (!a.viewedJobs[id]) a.viewedJobs[id] = Date.now(); }); }
  function appliedTo(jobId) { return MT.applications.byJob(jobId).find((a) => a.status !== 'to_apply'); }

  function matchJob(j, f) {
    if (!f.showExpired && j.status === 'expired') return false;
    if (f.q) {
      const hay = U().norm([j.title, j.company, j.description, j.location, (j.responsibilities || []).join(' '), j.requirements.required.concat(j.requirements.preferred).map((k) => K().skillLabel(k) + ' ' + K().skillLabel(k, 'fr')).join(' '), j.requirements.tools.join(' '), j.fields.join(' ')].join(' '));
      if (!U().norm(f.q).split(' ').every((w) => hay.indexOf(w) !== -1)) return false;
    }
    if (f.contracts.length) {
      const fam = K().CONTRACT_FAMILY[U().norm(j.contractType)];
      // Stage ≈ Internship and Alternance ≈ Apprenticeship (same contract family)
      if (!f.contracts.some((c) => K().CONTRACT_FAMILY[U().norm(c)] === fam)) return false;
    }
    if (f.fields.length && !f.fields.some((x) => j.fields.indexOf(x) !== -1)) return false;
    if (f.locations.length) {
      const ok = f.locations.some((l) => {
        if (l === 'Remote') return j.workMode === 'remote';
        if (l === 'Hybrid') return j.workMode === 'hybrid';
        if (l === 'France') return true;
        if (l === 'Other') return ['Lyon', 'Paris', 'Remote'].indexOf(j.location) === -1;
        return j.location === l;
      });
      if (!ok) return false;
    }
    if (f.sources.length && !j.sources.some((s) => f.sources.indexOf(s.source) !== -1)) return false;
    if (f.posted !== 'any') { const d = U().daysBetween(j.publishedAt, Date.now()); if (d > +f.posted) return false; }
    if (f.durations.length) { const ok = f.durations.some((d) => d === 'other' ? [3, 4, 6, 12].indexOf(j.duration) === -1 : +d === j.duration); if (!ok) return false; }
    if (f.salaryMin && (!j.salary || j.salary.max < +f.salaryMin)) return false;
    if (f.salaryMax && (!j.salary || j.salary.min > +f.salaryMax)) return false;
    if (f.minScore && MT.matching.scoreCached(j).score < f.minScore) return false;
    return true;
  }
  function sortJobs(list, how) {
    const sc = (j) => MT.matching.scoreCached(j).score;
    const by = {
      relevance: (a, b) => sc(b) - sc(a),
      recent: (a, b) => b.publishedAt - a.publishedAt,
      salary: (a, b) => ((b.salary || { max: 0 }).max) - ((a.salary || { max: 0 }).max),
      company: (a, b) => a.company.localeCompare(b.company)
    }[how] || ((a, b) => sc(b) - sc(a));
    return list.slice().sort(by);
  }

  /* ------------------------------------------------------------ job card */
  function jobCard(j, opts) {
    opts = opts || {};
    const m = MT.matching.scoreCached(j);
    const saved = isSaved(j.id);
    const applied = appliedTo(j.id);
    const viewed = (MT.storage.get('activity', {}).viewedJobs || {})[j.id];
    const isNew = U().daysBetween(j.publishedAt, Date.now()) <= 1 && !viewed;
    return '<article class="jcard' + (j.status === 'expired' ? ' is-expired' : '') + (opts.quest ? ' jcard--quest' : '') + '">' +
      (opts.quest ? '<p class="jcard__quest">🐔 NEW QUEST</p>' : '') +
      '<div class="jcard__top"><div class="jcard__titles">' +
      '<div class="jcard__flags">' + (isNew ? '<span class="badge badge--new">NEW</span>' : '') + (j.status === 'expired' ? '<span class="badge badge--expired">EXPIRED</span>' : '') + (applied ? '<span class="badge badge--applied">✓ ' + esc(MT.chicken.STATUS_META[applied.status].label) + '</span>' : '') + (viewed && !applied ? '<span class="badge badge--ghost">Seen</span>' : '') + (j.changeNote ? '<span class="badge badge--ghost">' + esc(j.changeNote) + '</span>' : '') + '</div>' +
      '<h3 class="jcard__title"><a href="#/jobs/' + j.id + '">' + esc(j.title) + '</a></h3>' +
      '<p class="jcard__company">' + esc(j.company) + '</p></div>' + U().scoreRing(m.score, 58) + '</div>' +
      '<ul class="jcard__facts"><li>📍 ' + esc(j.location) + '</li><li>' + esc(j.contractType) + ' — ' + j.duration + ' months</li><li>' + WORK[j.workMode] + '</li><li>' + esc(salaryText(j.salary)) + '</li></ul>' +
      (opts.quest ? '<p class="jcard__chicken">“' + esc(MT.chicken.reactionToScore(m.score).line) + '”</p>' : '') +
      '<div class="jcard__srcs">' + (j.sources.length > 1 ? '<span class="muted small">Available on</span>' : '<span class="muted small">Source</span>') + sourceBadges(j, true) + '<span class="badge badge--demo" title="Fictional demo offer">DEMO</span><span class="muted small jcard__date">' + U().relDay(j.publishedAt) + '</span></div>' +
      '<div class="jcard__actions">' +
      '<button class="btn btn--sm ' + (saved ? 'btn--saved' : 'btn--ghost') + '" data-save="' + j.id + '" aria-pressed="' + saved + '">' + (saved ? '★ Saved' : '☆ Save') + '</button>' +
      '<a class="btn btn--sm btn--ghost" href="#/jobs/' + j.id + '">' + (opts.quest ? 'Explore quest' : 'Analyze') + '</a>' +
      '<a class="btn btn--sm btn--primary" href="#/prepare/' + j.id + '">Apply</a></div></article>';
  }
  function bindCards(root, rerender) {
    U().$$('[data-save]', root).forEach((b) => b.onclick = () => { toggleSave(b.dataset.save); rerender(); });
  }

  /* ------------------------------------------------------------ Jobs list */
  function chipGroup(name, label, options, selected) {
    return '<fieldset class="fgroup"><legend>' + label + '</legend><div class="chips">' + options.map((o) => {
      const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
      const on = selected.indexOf(v) !== -1;
      return '<label class="fchip' + (on ? ' is-on' : '') + '"><input type="checkbox" name="' + name + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + '><span>' + esc(l) + '</span></label>';
    }).join('') + '</div></fieldset>';
  }
  function renderList(root) {
    const all = S().all();
    const list = sortJobs(all.filter((j) => matchJob(j, filters)), filters.sort);
    const meta = S().meta();
    const activeCount = ['contracts', 'fields', 'locations', 'sources', 'durations'].reduce((n, k) => n + filters[k].length, 0) + (filters.posted !== 'any') + !!filters.salaryMin + !!filters.salaryMax + !!filters.minScore + filters.showExpired;
    root.innerHTML =
      '<header class="page-head"><div><p class="eyebrow">Job discovery · <span class="badge badge--demo">DEMO DATA</span></p><h1 class="display">Jobs</h1>' +
      '<p class="lead">Offers from LinkedIn, Indeed and Welcome to the Jungle, de-duplicated and ranked for you.</p></div>' +
      '<div class="page-head__actions refresh-box"><span class="muted small">Last updated: <strong>' + esc(U().lastUpdatedLabel(meta.lastRefresh)) + '</strong></span><button class="btn btn--ghost" id="refresh-jobs">↻ Refresh jobs</button></div></header>' +
      '<div class="notice notice--demo" role="note"><strong>Demo mode.</strong> No live connection to LinkedIn, Indeed or Welcome to the Jungle exists in this prototype: offers are fictional and served by replaceable demo adapters. “Open original” links run a search on the platform — they are not real listings.</div>' +
      '<div class="searchbar"><label class="search"><span class="sr-only">Search jobs</span><span aria-hidden="true">🔎</span><input type="search" id="job-q" placeholder="Search title, company, skills, location… e.g. chef de produit, SEO, social media" value="' + esc(filters.q) + '"></label>' +
      '<label class="field field--inline"><span>Sort</span><select id="job-sort"><option value="relevance">Best match</option><option value="recent">Most recent</option><option value="salary">Salary</option><option value="company">Company A–Z</option></select></label>' +
      '<button class="btn btn--ghost filters-toggle" id="filters-toggle" aria-expanded="false" aria-controls="filters">Filters' + (activeCount ? ' (' + activeCount + ')' : '') + '</button></div>' +
      '<div class="jobs-layout"><aside class="filters" id="filters" aria-label="Job filters"><form id="filter-form">' +
      chipGroup('contracts', 'Contract', ['Stage', 'Alternance', 'Internship', 'Apprenticeship'], filters.contracts) +
      chipGroup('fields', 'Field', K().FIELDS.filter((f) => f !== 'Marketing Project Management').concat(['Marketing Project Management']).map((f) => [f, f === 'Marketing Project Management' ? 'Project Mgmt' : f]), filters.fields) +
      chipGroup('locations', 'Location', ['Lyon', 'Paris', 'France', 'Remote', 'Hybrid', 'Other'], filters.locations) +
      chipGroup('sources', 'Source', [['linkedin', 'LinkedIn'], ['indeed', 'Indeed'], ['wttj', 'Welcome to the Jungle']], filters.sources) +
      '<fieldset class="fgroup"><legend>Publication date</legend><div class="chips">' + [['any', 'Any time'], ['0', 'Today'], ['3', 'Last 3 days'], ['7', 'Last 7 days'], ['30', 'Last 30 days']].map((o) => '<label class="fchip' + (filters.posted === o[0] ? ' is-on' : '') + '"><input type="radio" name="posted" value="' + o[0] + '"' + (filters.posted === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>').join('') + '</div></fieldset>' +
      chipGroup('durations', 'Duration', [['3', '3 months'], ['4', '4 months'], ['6', '6 months'], ['12', '12 months'], ['other', 'Other']], filters.durations) +
      '<fieldset class="fgroup"><legend>Salary (€/month, if available)</legend><div class="row"><label class="field field--sm"><span>Min</span><input type="number" min="0" step="50" name="salaryMin" value="' + esc(filters.salaryMin) + '"></label><label class="field field--sm"><span>Max</span><input type="number" min="0" step="50" name="salaryMax" value="' + esc(filters.salaryMax) + '"></label></div></fieldset>' +
      '<fieldset class="fgroup"><legend>Match</legend><label class="field field--sm"><span>Minimum match: <output id="ms-out">' + filters.minScore + '%</output></span><input type="range" min="0" max="90" step="5" name="minScore" value="' + filters.minScore + '"></label>' +
      '<label class="check"><input type="checkbox" name="showExpired"' + (filters.showExpired ? ' checked' : '') + '><span>Show expired offers</span></label></fieldset>' +
      '<button type="button" class="btn btn--ghost btn--sm" id="reset-filters">Reset filters</button></form></aside>' +
      '<section class="jobs-results" aria-live="polite"><p class="results-count"><strong>' + list.length + '</strong> offer' + (list.length === 1 ? '' : 's') + ' · ' + all.length + ' in the feed · duplicates merged across platforms</p>' +
      (list.length ? '<div class="jgrid">' + list.map((j) => jobCard(j)).join('') + '</div>' : U().emptyState({ title: 'Nothing interesting yet', text: 'Let’s keep exploring — try removing a filter or searching with another keyword.', prop: 'telescope' })) +
      '</section></div>';

    root.querySelector('#job-sort').value = filters.sort;
    const q = root.querySelector('#job-q');
    q.addEventListener('input', U().debounce(() => { filters.q = q.value; saveFilters(); renderList(root); const n = root.querySelector('#job-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250));
    root.querySelector('#job-sort').onchange = (e) => { filters.sort = e.target.value; saveFilters(); renderList(root); };
    const form = root.querySelector('#filter-form');
    form.addEventListener('change', () => {
      const fd = new FormData(form);
      ['contracts', 'fields', 'locations', 'sources', 'durations'].forEach((k) => { filters[k] = fd.getAll(k); });
      filters.posted = fd.get('posted') || 'any';
      filters.salaryMin = fd.get('salaryMin'); filters.salaryMax = fd.get('salaryMax');
      filters.minScore = +fd.get('minScore'); filters.showExpired = !!fd.get('showExpired');
      saveFilters(); const open = root.querySelector('#filters').classList.contains('is-open'); renderList(root);
      if (open) { root.querySelector('#filters').classList.add('is-open'); root.querySelector('#filters-toggle').setAttribute('aria-expanded', 'true'); }
    });
    form.querySelector('[name=minScore]').addEventListener('input', (e) => { root.querySelector('#ms-out').textContent = e.target.value + '%'; });
    root.querySelector('#reset-filters').onclick = () => { filters = Object.assign({}, DEFAULT_FILTERS); saveFilters(); renderList(root); };
    root.querySelector('#filters-toggle').onclick = (e) => { const f = root.querySelector('#filters'); const o = f.classList.toggle('is-open'); e.currentTarget.setAttribute('aria-expanded', o); };
    root.querySelector('#refresh-jobs').onclick = () => runRefresh(() => renderList(root));
    bindCards(root, () => renderList(root));
  }

  function runRefresh(after) {
    const btn = document.querySelector('#refresh-jobs');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Refreshing…'; }
    setTimeout(() => {
      const r = S().refresh();
      MT.matching.invalidate();
      U().toast('Refresh done: ' + r.newJobs + ' new · ' + r.updated + ' updated · ' + r.expired + ' expired · ' + r.duplicates + ' duplicates merged · ' + r.alreadySeen + ' already seen.', 'success', { duration: 6500 });
      if (after) after();
      MT.app.renderChrome();
    }, U().prefersReducedMotion() ? 50 : 700);
  }

  /* ------------------------------------------------------------ Job detail */
  function renderDetail(root, id) {
    const j = S().get(id);
    if (!j) { root.innerHTML = U().emptyState({ title: 'Offer not found', text: 'It may have been removed from the feed.', action: { href: '#/jobs', label: 'Back to jobs' } }); return; }
    markViewed(j.id);
    const a = MT.ai.analyzeJob(j);
    const m = a.match;
    const r = MT.chicken.reactionToScore(m.score);
    const pref = S().preferredSource(j);
    const applied = appliedTo(j.id);
    const saved = isSaved(j.id);
    const comps = Object.keys(m.weights).map((k) => [k, Math.round(m.components[k] * m.weights[k]), m.weights[k]]);
    const reqList = (title, items, tag) => items.length ? '<div class="req"><h4>' + title + '</h4><ul class="pill-list">' + items.map((x) => '<li class="pill ' + (tag ? 'pill--' + tag(x) : '') + '">' + esc(typeof x === 'string' && K().SKILLS[x] ? K().skillLabel(x) : x) + '</li>').join('') + '</ul></div>' : '';
    const skillTag = (k) => { const st = MT.matching.skillStatus(a.kb, k); return st === 'full' ? 'ok' : st === 'partial' ? 'part' : 'miss'; };

    root.innerHTML = '<a class="back" href="#/jobs">← Jobs</a>' +
      (j.status === 'expired' ? '<div class="notice notice--warn" role="note"><strong>EXPIRED.</strong> This offer appears to be closed. It stays visible here (and in your tracker if you applied).</div>' : '') +
      '<div class="detail"><div class="detail__main">' +
      '<header class="card detail-head"><p class="eyebrow">' + esc(j.contractType) + ' · ' + j.duration + ' months · <span class="badge badge--demo">DEMO</span></p>' +
      '<h1 class="display-sm">' + esc(j.title) + '</h1><p class="lead"><a href="#/companies/' + encodeURIComponent(j.company) + '">' + esc(j.company) + '</a></p>' +
      '<dl class="facts">' +
      '<div><dt>Location</dt><dd>' + esc(j.location) + ' · ' + WORK[j.workMode] + '</dd></div><div><dt>Contract</dt><dd>' + esc(j.contractType) + '</dd></div><div><dt>Duration</dt><dd>' + j.duration + ' months</dd></div>' +
      '<div><dt>Salary</dt><dd>' + esc(salaryText(j.salary)) + '</dd></div><div><dt>Published</dt><dd>' + U().fmtDate(j.publishedAt) + '</dd></div><div><dt>Language</dt><dd>' + (j.language === 'fr' ? 'French' : 'English') + '</dd></div></dl>' +
      '<div class="detail-actions"><a class="btn btn--primary btn--lg" href="#/prepare/' + j.id + '">✨ PREPARE MY APPLICATION</a>' +
      '<button class="btn ' + (saved ? 'btn--saved' : 'btn--ghost') + '" id="d-save" aria-pressed="' + saved + '">' + (saved ? '★ Saved' : '☆ Save') + '</button>' +
      '<a class="btn btn--ghost" href="' + esc(pref.url) + '" target="_blank" rel="noopener noreferrer" title="Opens a search on ' + esc(S().SOURCE_LABEL[pref.source]) + ' — demo offers have no real listing">Open original ↗</a>' +
      '<button class="btn btn--ghost" id="d-ask">🐔 Ask the chicken</button></div>' +
      (applied ? '<p class="notice notice--ok">You already applied on ' + U().fmtDate(applied.applicationDate) + ' — <a href="#/applications/' + applied.id + '">open the application</a>.</p>' : '') + '</header>' +

      '<section class="card"><h2 class="h3">Available on</h2><p class="muted small">' + (j.sources.length > 1 ? 'The same offer was detected on ' + j.sources.length + ' platforms (same company, similar title, location and description) and merged. Choose your preferred source:' : 'Detected on one platform.') + '</p>' +
      '<div class="src-pick" role="radiogroup" aria-label="Preferred source">' + j.sources.map((s) => '<label class="src-opt' + (s.source === pref.source ? ' is-on' : '') + '"><input type="radio" name="psrc" value="' + s.source + '"' + (s.source === pref.source ? ' checked' : '') + '><span class="src src--' + s.source + '">' + esc(S().SOURCE_LABEL[s.source]) + '</span><span class="small muted">“' + esc(s.title) + '” · ' + U().fmtShort(s.publishedAt) + '</span></label>').join('') + '</div></section>' +

      '<section class="card"><h2 class="h3">About the company <span class="tag tag--offer">from the offer</span></h2><p>' + esc(j.companyAbout || 'No company description in the offer.') + '</p>' +
      '<h2 class="h3">Job description <span class="tag tag--offer">from the offer</span></h2>' + (j.description ? '<p>' + esc(j.description) + '</p>' : '<p class="muted">The offer has no description. Matching relies on the title and requirements only.</p>') +
      '<h3 class="h4">Responsibilities</h3><ul>' + j.responsibilities.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></section>' +

      '<section class="card"><h2 class="h3">Key requirements</h2><p class="muted small">Coloured by your profile: <span class="pill pill--ok">in your CV</span> <span class="pill pill--part">related</span> <span class="pill pill--miss">not found</span></p>' +
      reqList('Required skills', j.requirements.required, skillTag) + reqList('Preferred skills', j.requirements.preferred, skillTag) +
      reqList('Tools', j.requirements.tools, (t) => a.kb.tools.has(t.toLowerCase()) ? 'ok' : 'miss') + reqList('Languages', j.requirements.languages, (l) => a.kb.languages.indexOf(l) !== -1 ? 'ok' : 'miss') +
      reqList('Qualifications', j.requirements.qualifications) + '<div class="req"><h4>Experience</h4><p>' + esc(j.requirements.experience) + '</p></div></section></div>' +

      '<aside class="detail__side"><section class="card match-card"><div class="match-card__head">' + U().scoreRing(m.score, 92) + '<div><p class="eyebrow">Your profile</p><h2 class="h3">' + m.score + '% match</h2><p class="small">' + esc(m.label) + '</p></div></div>' +
      '<div class="chicken-says">' + MT.chicken.svg({ mood: r.mood, size: 64 }) + '<p class="speech">“' + esc(r.line) + '”</p></div>' +
      (m.noCv ? '<p class="notice notice--warn small">No CV uploaded — the score uses your preferences only. <a href="#/profile/cvs">Upload your CV</a></p>' : '') +
      '<h3 class="h4">Strong match</h3><ul class="mlist mlist--ok">' + (m.strong.map((s) => '<li>' + esc(s.label) + '</li>').join('') || '<li class="muted">—</li>') + '</ul>' +
      '<h3 class="h4">Partial match</h3><ul class="mlist mlist--part">' + (m.partial.map((s) => '<li>' + esc(s.label) + ' <small>— ' + esc(s.note) + '</small></li>').join('') || '<li class="muted">—</li>') + '</ul>' +
      '<h3 class="h4">Missing / unclear</h3><ul class="mlist mlist--miss">' + (m.missing.map((s) => '<li>' + esc(s.label) + ' <small>— ' + esc(s.note) + '</small></li>').join('') || '<li class="muted">Nothing major 🎉</li>') + '</ul>' +
      '<details class="breakdown"><summary>How is this score calculated?</summary><table class="table table--sm"><caption class="sr-only">Score components</caption><thead><tr><th scope="col">Component</th><th scope="col">Points</th></tr></thead><tbody>' +
      comps.map((c) => '<tr><td>' + U().cap(c[0]) + '</td><td><span class="bar-inline" style="--w:' + Math.round(c[1] / c[2] * 100) + '%"></span>' + c[1] + ' / ' + c[2] + '</td></tr>').join('') +
      '</tbody></table><p class="small muted">The score is a recommendation based on your CV and preferences — not a hiring prediction. A partial match is still worth exploring.</p></details></section>' +
      '<section class="card"><h2 class="h3">Why you fit</h2><ul class="fit">' + a.fit.map((f) => '<li><span class="tag tag--' + f.source + '">' + tagLabel(f.source) + '</span> ' + esc(f.text) + '</li>').join('') + '</ul>' +
      '<h2 class="h3">What could strengthen your application</h2><ul class="fit">' + a.strengthen.map((f) => '<li><span class="tag tag--' + f.source + '">' + tagLabel(f.source) + '</span> ' + esc(f.text) + '</li>').join('') + '</ul></section></aside></div>';

    root.querySelector('#d-save').onclick = () => { toggleSave(j.id); renderDetail(root, id); };
    root.querySelector('#d-ask').onclick = () => MT.assistant.open({ job: j });
    U().$$('[name=psrc]', root).forEach((r2) => r2.onchange = () => { S().setPreferredSource(j.id, r2.value); U().toast('Preferred source: ' + S().SOURCE_LABEL[r2.value], 'success'); renderDetail(root, id); });
  }
  function tagLabel(s) { return { profile: 'Your profile', offer: 'Job offer', answers: 'Your answers', suggestion: 'Suggestion' }[s] || s; }

  /* ------------------------------------------------------------ Saved */
  function renderSaved(root) {
    const saved = MT.storage.get('saved', {});
    const ids = Object.keys(saved);
    const order = { high: 0, medium: 1, low: 2 };
    const rows = ids.map((id) => ({ id, s: saved[id], j: S().get(id) })).filter((x) => x.j).sort((a, b) => order[a.s.priority] - order[b.s.priority] || b.s.savedAt - a.s.savedAt);
    root.innerHTML = '<header class="page-head"><div><p class="eyebrow">Shortlist</p><h1 class="display">Saved</h1><p class="lead">Your shortlist — add notes, set priorities, then move straight to an application.</p></div></header>' +
      (rows.length ? '<div class="saved-list">' + rows.map((x) => {
        const m = MT.matching.scoreCached(x.j); const ap = appliedTo(x.j.id);
        return '<article class="saved card prio--' + x.s.priority + (x.j.status === 'expired' ? ' is-expired' : '') + '">' +
          '<div class="saved__main">' + U().scoreRing(m.score, 52) + '<div><h3 class="h4"><a href="#/jobs/' + x.j.id + '">' + esc(x.j.title) + '</a></h3><p class="muted">' + esc(x.j.company) + ' · ' + esc(x.j.location) + ' · ' + esc(x.j.contractType) + ' ' + x.j.duration + ' months</p>' +
          '<p class="small">' + (x.j.status === 'expired' ? '<span class="badge badge--expired">EXPIRED</span> ' : '') + (ap ? '<span class="badge badge--applied">✓ ' + MT.chicken.STATUS_META[ap.status].label + '</span> ' : '') + 'Saved ' + U().relDay(x.s.savedAt).toLowerCase() + '</p></div></div>' +
          '<div class="saved__edit"><label class="field field--sm"><span>Priority</span><select data-prio="' + x.id + '">' + ['high', 'medium', 'low'].map((p) => '<option value="' + p + '"' + (p === x.s.priority ? ' selected' : '') + '>' + U().cap(p) + '</option>').join('') + '</select></label>' +
          '<label class="field"><span>Notes</span><textarea rows="2" data-notes="' + x.id + '" placeholder="Why it’s interesting, who to contact…">' + esc(x.s.notes) + '</textarea></label></div>' +
          '<div class="saved__actions">' + (x.j.status === 'expired' && !ap ? '<span class="small muted">Offer expired</span>' : '<a class="btn btn--primary btn--sm" href="#/prepare/' + x.j.id + '">Move to application →</a>') +
          '<button class="btn btn--ghost btn--sm" data-unsave="' + x.id + '">Remove</button></div></article>';
      }).join('') + '</div>' : U().emptyState({ title: 'No saved jobs', text: 'Your next opportunity starts here. Let’s find something interesting!', prop: 'telescope', action: { href: '#/jobs', label: 'Explore jobs' } }));
    U().$$('[data-prio]', root).forEach((s) => s.onchange = () => { MT.storage.update('saved', {}, (x) => { x[s.dataset.prio].priority = s.value; }); renderSaved(root); });
    U().$$('[data-notes]', root).forEach((t) => t.addEventListener('change', () => { MT.storage.update('saved', {}, (x) => { x[t.dataset.notes].notes = t.value; }); U().toast('Note saved', 'success'); }));
    U().$$('[data-unsave]', root).forEach((b) => b.onclick = () => { toggleSave(b.dataset.unsave); renderSaved(root); });
  }

  MT.jobs = { renderList, renderDetail, renderSaved, jobCard, bindCards, toggleSave, isSaved, runRefresh, salaryText, WORK, tagLabel, markViewed };
})(window.MT = window.MT || {});
