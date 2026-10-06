/* ==========================================================================
   MARKETRACK — applications.js
   Application CRM: data model, Kanban tracker (drag & drop + keyboard/mobile
   "Move to"), application record (fields, timeline, documents, follow-ups,
   interview preparation), confirmation + celebration flows.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);
  const CH = () => MT.chicken;

  const COLUMNS = ['to_apply', 'applied', 'follow_up', 'interview', 'final_round', 'offer', 'rejected', 'withdrawn'];
  const EVENTS = {
    discovered: { label: 'Job discovered', icon: '🔎' }, saved: { label: 'Saved', icon: '🔖' }, cv_selected: { label: 'CV selected', icon: '📎' },
    letter: { label: 'Cover letter generated', icon: '✍️' }, applied: { label: 'Application submitted', icon: '📄', status: 'applied' },
    followup_reminder: { label: 'Follow-up reminder', icon: '⏰' }, followup_done: { label: 'Follow-up sent', icon: '💌', status: 'follow_up' },
    interview_scheduled: { label: 'Interview scheduled', icon: '🎤', status: 'interview' }, interview_done: { label: 'Interview completed', icon: '✨' },
    final_round: { label: 'Final round', icon: '🔥', status: 'final_round' }, offer: { label: 'Offer received', icon: '👑', status: 'offer' },
    rejected: { label: 'Rejected — progress kept', icon: '🌧' }, withdrawn: { label: 'Withdrawn', icon: '↩' }, to_apply: { label: 'Moved to To Apply', icon: '📝' },
    follow_up: { label: 'Moved to Follow-up', icon: '💌', status: 'follow_up' }, interview: { label: 'Moved to Interview', icon: '🎤', status: 'interview' },
    custom: { label: 'Note', icon: '📌' }
  };

  /* ================================================================ model */
  function all() { return MT.storage.get('applications', []); }
  function get(id) { return all().find((a) => a.id === id) || null; }
  function byJob(jobId) { return all().filter((a) => a.jobId === jobId); }
  function put(app) {
    MT.storage.update('applications', [], (list) => {
      const i = list.findIndex((a) => a.id === app.id);
      if (i === -1) list.push(app); else list[i] = app;
    });
    return app;
  }
  function event(type, at, extra) {
    const meta = EVENTS[type] || EVENTS.custom;
    return Object.assign({ id: MT.storage.uid('ev'), type, at: at || Date.now(), label: meta.label, icon: meta.icon, status: meta.status }, extra || {});
  }
  function create(o) {
    const job = o.job, s = o.snapshot || {};
    const cv = MT.storage.get('cvs', []).find((c) => c.id === o.cvId);
    const profile = MT.storage.get('profile', {});
    const app = {
      id: MT.storage.uid('app'), jobId: job ? job.id : null,
      company: s.company, position: s.title, contractType: s.contract, duration: s.duration, location: s.city, workMode: s.workMode,
      source: s.source, url: s.url || '', salary: s.salary || null, industry: s.industry || '', fields: s.fields || [],
      status: o.status || 'to_apply', applicationDate: o.applicationDate || null,
      cvId: o.cvId || null, cvVersion: cv ? cv.name + ' v' + cv.version : '', portfolioUrl: profile.portfolio || '',
      coverLetterId: null, coverLetterVersion: null, userAnswers: {}, notes: o.notes || '',
      contact: o.contact || { name: '', email: '' }, interviewDate: null, followUpDate: null,
      timeline: [], createdAt: Date.now(), lastUpdate: Date.now(), matchScore: o.matchScore || null
    };
    if (!o.silent) app.timeline.push(event('discovered', Date.now()));
    put(app);
    return app;
  }
  function snapshotOf(job) {
    const src = MT.jobsService.preferredSource(job);
    return { title: job.title, company: job.company, city: job.location, contract: job.contractType, duration: job.duration, source: src.source, url: src.url, workMode: job.workMode, industry: job.industry, fields: job.fields, salary: job.salary };
  }
  /** Find or create the working application for a job (used by the mission). */
  function ensureForJob(job, cvId) {
    const existing = byJob(job.id).find((a) => a.status === 'to_apply');
    if (existing) return existing;
    const app = create({ job, snapshot: snapshotOf(job), status: 'to_apply', cvId, matchScore: MT.matching.scoreCached(job).score });
    const saved = MT.storage.get('saved', {})[job.id];
    if (saved) { app.timeline.push(event('saved', saved.savedAt)); put(app); }
    return app;
  }
  function addEvent(id, type, extra) {
    const a = get(id); if (!a) return null;
    a.timeline.push(event(type, (extra && extra.at) || Date.now(), extra));
    a.lastUpdate = Date.now();
    return put(a);
  }
  function setStatus(id, status, opts) {
    const a = get(id); if (!a || a.status === status) return a;
    const prev = a.status;
    a.status = status;
    a.lastUpdate = Date.now();
    if (status === 'applied' && !a.applicationDate) a.applicationDate = Date.now();
    if ((status === 'applied') && !a.followUpDate) a.followUpDate = Date.now() + 7 * U().DAY;
    const map = { applied: 'applied', follow_up: 'followup_done', interview: 'interview_scheduled', final_round: 'final_round', offer: 'offer', rejected: 'rejected', withdrawn: 'withdrawn', to_apply: 'to_apply' };
    a.timeline.push(event(map[status] || 'custom', Date.now(), { from: prev }));
    put(a);
    if (!(opts && opts.silent)) {
      if (status === 'offer') celebrate(a);
      else if (status === 'interview' || status === 'final_round') interviewMode(a);
      else if (status === 'rejected') U().toast('Rejection logged. Your chicken keeps every step it has earned — onward. 🐔', 'info');
      else U().toast(a.company + ' → ' + CH().STATUS_META[status].label, 'success');
    }
    return a;
  }
  function remove(id) {
    MT.storage.update('applications', [], (l) => l.filter((a) => a.id !== id));
    MT.storage.update('reminders', [], (r) => r.filter((x) => x.applicationId !== id));
  }
  function addReminder(appId, date, title, kind) {
    MT.storage.update('reminders', [], (r) => { r.push({ id: MT.storage.uid('rem'), applicationId: appId, title, date, done: false, kind: kind || 'followup' }); });
    const a = get(appId);
    if (a && kind !== 'interview') { a.followUpDate = date; a.timeline.push(event('followup_reminder', Date.now(), { label: 'Follow-up reminder set for ' + U().fmtShort(date) })); put(a); }
  }

  /* ================================================================ celebration / interview mode */
  function celebrate(a) {
    const m = U().modal({
      title: '🏆 MISSION COMPLETE', size: 'md', className: 'celebrate',
      body: '<div class="celebrate__inner">' + confetti() +
        '<div class="celebrate__chicken">' + CH().svg({ mood: 'celebrating', accessories: ['crown'], size: 180, anim: 'jump', level: 7 }) + '</div>' +
        '<p class="eyebrow">Your chicken did it! 🐔👑</p><h3 class="display-sm">You received an offer from</h3>' +
        '<p class="celebrate__company">' + esc(a.company) + '</p><p class="celebrate__pos">' + esc(a.position) + '</p>' +
        '<p class="muted small">Logged because you moved this application to “Offer”. Take a moment — then read the details carefully before accepting.</p></div>',
      footer: '<button class="btn btn--primary" data-close>Celebrate & close</button>'
    });
    m.el.querySelector('[data-close]').onclick = m.close;
  }
  function confetti() {
    if (U().prefersReducedMotion()) return '';
    let s = '<div class="confetti" aria-hidden="true">';
    const cols = ['#F26B1D', '#FFD45C', '#5E8C6A', '#4F6D8F', '#E5484D'];
    for (let i = 0; i < 36; i++) s += '<i style="left:' + (i * 2.8) + '%;background:' + cols[i % 5] + ';animation-delay:' + (i % 9) * 0.12 + 's"></i>';
    return s + '</div>';
  }
  function interviewMode(a) {
    const m = U().modal({
      title: '🎤 INTERVIEW MODE', size: 'md',
      body: '<div class="center">' + CH().svg({ mood: 'confident', accessories: ['tie', 'microphone'], size: 150 }) +
        '<p class="speech speech--center">“Okay. Deep breath. Let’s prepare.”</p>' +
        '<p><strong>' + esc(a.company) + '</strong> · ' + esc(a.position) + '</p>' +
        '<label class="field field--inline"><span>Interview date</span><input type="datetime-local" id="iv-date" value="' + (a.interviewDate ? toLocalInput(a.interviewDate) : '') + '"></label></div>',
      footer: '<button class="btn btn--ghost" data-later>Later</button><button class="btn btn--primary" data-prep>Prepare for interview</button>'
    });
    const saveDate = () => {
      const v = m.el.querySelector('#iv-date').value;
      if (v) {
        const x = get(a.id); x.interviewDate = new Date(v).getTime(); put(x);
        MT.storage.update('reminders', [], (r) => { r.push({ id: MT.storage.uid('rem'), applicationId: a.id, title: 'Interview — ' + a.company, date: x.interviewDate, done: false, kind: 'interview' }); });
      }
    };
    m.el.querySelector('[data-later]').onclick = () => { saveDate(); m.close(); };
    m.el.querySelector('[data-prep]').onclick = () => { saveDate(); m.close(); location.hash = '#/applications/' + a.id + '/prep'; };
  }
  function toLocalInput(ts) { const d = new Date(ts); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }

  /* ================================================================ Kanban view */
  let filterText = '';
  function renderBoard(root) {
    const apps = all();
    const q = U().norm(filterText);
    const shown = apps.filter((a) => !q || U().norm(a.company + ' ' + a.position + ' ' + a.location).indexOf(q) !== -1);
    root.innerHTML =
      '<header class="page-head"><div><p class="eyebrow">Application CRM</p><h1 class="display">Applications</h1>' +
      '<p class="lead">Drag cards between columns — or use “Move to” on touch screens and keyboards.</p></div>' +
      '<div class="page-head__actions"><label class="search search--sm"><span class="sr-only">Filter applications</span><input type="search" id="app-filter" placeholder="Filter by company, role…" value="' + esc(filterText) + '"></label>' +
      '<button class="btn btn--primary" id="add-app">+ Add application</button></div></header>' +
      (apps.length ? '' : U().emptyState({ title: 'Ready to start applying?', text: 'Every career journey starts with one application.', prop: 'paperBlank', action: { href: '#/jobs', label: 'Find a job' } })) +
      '<div class="kanban" role="list" aria-label="Application board">' + COLUMNS.map((col) => {
        const items = shown.filter((a) => a.status === col).sort((a, b) => b.lastUpdate - a.lastUpdate);
        const meta = CH().STATUS_META[col];
        return '<section class="kanban__col kanban__col--' + col + '" data-col="' + col + '" role="listitem" aria-label="' + meta.label + ' column">' +
          '<header class="kanban__head"><span>' + meta.emoji + ' ' + meta.label + '</span><span class="count">' + items.length + '</span></header>' +
          '<div class="kanban__drop" data-drop="' + col + '">' + (items.map(card).join('') || '<p class="kanban__empty">' + emptyColText(col) + '</p>') + '</div></section>';
      }).join('') + '</div>';

    root.querySelector('#app-filter').addEventListener('input', U().debounce((e) => { filterText = e.target.value; renderBoard(root); root.querySelector('#app-filter').focus(); }, 200));
    root.querySelector('#add-app').onclick = manualAddModal;
    // drag & drop
    U().$$('.kcard', root).forEach((c) => {
      c.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', c.dataset.id); c.classList.add('is-dragging'); });
      c.addEventListener('dragend', () => c.classList.remove('is-dragging'));
    });
    U().$$('[data-drop]', root).forEach((z) => {
      z.addEventListener('dragover', (e) => { e.preventDefault(); z.classList.add('is-over'); });
      z.addEventListener('dragleave', () => z.classList.remove('is-over'));
      z.addEventListener('drop', (e) => {
        e.preventDefault(); z.classList.remove('is-over');
        const id = e.dataTransfer.getData('text/plain');
        if (id) { setStatus(id, z.dataset.drop); renderBoard(root); }
      });
    });
    U().$$('.kcard__move', root).forEach((sel) => sel.addEventListener('change', (e) => { setStatus(sel.dataset.id, e.target.value); renderBoard(root); }));
  }
  function emptyColText(col) {
    return { interview: 'Keep going. Your first interview could be next.', offer: 'The journey isn’t over. 🔥', rejected: 'Nothing here — good.', withdrawn: '—', to_apply: 'Save a job, then prepare it here.' }[col] || 'Nothing here yet.';
  }
  function card(a) {
    const job = a.jobId ? MT.jobsService.get(a.jobId) : null;
    const expired = job && job.status === 'expired';
    const fu = a.followUpDate && ['applied', 'follow_up'].indexOf(a.status) !== -1 ? U().daysBetween(Date.now(), a.followUpDate) : null;
    return '<article class="kcard" draggable="true" data-id="' + a.id + '">' +
      '<a class="kcard__link" href="#/applications/' + a.id + '"><span class="kcard__company">' + esc(a.company) + '</span><span class="kcard__pos">' + esc(a.position) + '</span></a>' +
      '<div class="kcard__meta"><span class="badge">' + esc(a.contractType || '') + '</span>' + (a.location ? '<span class="badge badge--ghost">' + esc(a.location) + '</span>' : '') +
      (a.matchScore ? '<span class="badge badge--score ' + U().scoreClass(a.matchScore) + '">' + a.matchScore + '%</span>' : '') + (expired ? '<span class="badge badge--expired">EXPIRED</span>' : '') + '</div>' +
      '<div class="kcard__foot"><span class="muted small">' + (a.applicationDate ? 'Applied ' + U().fmtShort(a.applicationDate) : 'Added ' + U().fmtShort(a.createdAt)) + '</span>' +
      (fu !== null ? '<span class="chip ' + (fu <= 0 ? 'chip--alert' : '') + '">⏰ ' + (fu < 0 ? 'Follow-up overdue' : fu === 0 ? 'Follow up today' : 'Follow up in ' + fu + 'd') + '</span>' : '') +
      (a.interviewDate && a.status === 'interview' ? '<span class="chip chip--accent">🎤 ' + U().fmtShort(a.interviewDate) + '</span>' : '') + '</div>' +
      '<label class="kcard__mover"><span class="sr-only">Move ' + esc(a.company) + ' to</span><select class="kcard__move" data-id="' + a.id + '">' +
      COLUMNS.map((c) => '<option value="' + c + '"' + (c === a.status ? ' selected' : '') + '>' + (c === a.status ? 'Move to…' : CH().STATUS_META[c].label) + '</option>').join('') + '</select></label></article>';
  }

  function manualAddModal() {
    const m = U().modal({
      title: 'Add an application manually', size: 'md',
      body: '<p class="muted small">For an offer found outside MARKETRACK. Nothing is sent anywhere.</p><form id="manual-app" class="form-grid" novalidate>' +
        field('company', 'Company *', 'text', true) + field('position', 'Job title *', 'text', true) +
        '<label class="field"><span>Contract</span><select name="contract"><option>Stage</option><option>Alternance</option><option>Internship</option><option>Apprenticeship</option></select></label>' +
        field('location', 'Location', 'text') + field('url', 'Original job URL', 'url') +
        '<label class="field"><span>Status</span><select name="status">' + COLUMNS.map((c) => '<option value="' + c + '">' + CH().STATUS_META[c].label + '</option>').join('') + '</select></label>' +
        '<p class="form-error" role="alert" hidden></p></form>',
      footer: '<button class="btn btn--ghost" data-cancel>Cancel</button><button class="btn btn--primary" data-ok>Add</button>'
    });
    m.el.querySelector('[data-cancel]').onclick = m.close;
    m.el.querySelector('[data-ok]').onclick = () => {
      const f = new FormData(m.el.querySelector('form'));
      const err = m.el.querySelector('.form-error');
      const company = (f.get('company') || '').trim(), position = (f.get('position') || '').trim(), url = (f.get('url') || '').trim();
      if (!company) { err.hidden = false; err.textContent = 'Please add the company name — it’s needed to track the application.'; return; }
      if (!position) { err.hidden = false; err.textContent = 'Please add the job title.'; return; }
      if (url && !U().isValidUrl(url)) { err.hidden = false; err.textContent = 'That URL doesn’t look valid. It should start with https://'; return; }
      const dup = all().find((a) => U().norm(a.company) === U().norm(company) && U().norm(a.position) === U().norm(position));
      if (dup) { err.hidden = false; err.innerHTML = 'You already track this application. <a href="#/applications/' + dup.id + '">Open it</a>'; return; }
      const app = create({ snapshot: { company, title: position, contract: f.get('contract'), city: f.get('location'), url, source: 'manual' }, status: 'to_apply' });
      if (f.get('status') !== 'to_apply') setStatus(app.id, f.get('status'), { silent: true });
      m.close(); U().toast('Application added', 'success'); MT.app.render();
    };
  }
  function field(name, label, type, req, val) {
    return '<label class="field"><span>' + label + '</span><input name="' + name + '" type="' + type + '"' + (req ? ' required aria-required="true"' : '') + ' value="' + esc(val || '') + '"></label>';
  }

  /* ================================================================ record view */
  function renderRecord(root, id, tab) {
    const a = get(id);
    if (!a) { root.innerHTML = U().emptyState({ title: 'Application not found', text: 'It may have been deleted.', action: { href: '#/applications', label: 'Back to applications' } }); return; }
    const job = a.jobId ? MT.jobsService.get(a.jobId) : null;
    const stage = CH().maxStage(a);
    const tabs = [['overview', 'Overview'], ['timeline', 'Timeline'], ['documents', 'Documents'], ['followup', 'Follow-up']].concat(stage >= 3 ? [['prep', '🎤 Interview prep']] : []);
    tab = tab || 'overview';
    root.innerHTML =
      '<a class="back" href="#/applications">← Applications</a>' +
      '<header class="record-head card">' +
      '<div class="record-head__main"><p class="eyebrow">' + esc(CH().STATUS_META[a.status].emoji + ' ' + CH().STATUS_META[a.status].label) + (job && job.status === 'expired' ? ' · <span class="badge badge--expired">EXPIRED OFFER — kept in your history</span>' : '') + '</p>' +
      '<h1 class="display-sm">' + esc(a.position) + '</h1><p class="lead"><a href="#/companies/' + encodeURIComponent(a.company) + '">' + esc(a.company) + '</a> · ' + esc([a.contractType, a.duration ? a.duration + ' months' : '', a.location].filter(Boolean).join(' · ')) + '</p></div>' +
      '<div class="record-head__side"><label class="field"><span>Status</span><select id="rec-status">' + COLUMNS.map((c) => '<option value="' + c + '"' + (c === a.status ? ' selected' : '') + '>' + CH().STATUS_META[c].label + '</option>').join('') + '</select></label>' +
      (a.status === 'to_apply' && a.jobId ? '<a class="btn btn--primary" href="#/prepare/' + a.jobId + '">✨ Continue mission</a>' : '') +
      (job ? '<a class="btn btn--ghost" href="#/jobs/' + job.id + '">View offer</a>' : '') + '</div></header>' +
      '<nav class="tabs" role="tablist">' + tabs.map((t) => '<a role="tab" class="tab' + (t[0] === tab ? ' is-active' : '') + '" aria-selected="' + (t[0] === tab) + '" href="#/applications/' + a.id + '/' + t[0] + '">' + t[1] + '</a>').join('') + '</nav>' +
      '<div class="tab-panel" id="rec-panel"></div>';
    root.querySelector('#rec-status').onchange = (e) => { setStatus(a.id, e.target.value); renderRecord(root, id, tab); };
    const panel = root.querySelector('#rec-panel');
    ({ overview: overviewTab, timeline: timelineTab, documents: documentsTab, followup: followupTab, prep: prepTab }[tab] || overviewTab)(panel, a, job, root);
  }

  function overviewTab(panel, a, job, root) {
    const cvs = MT.cv.list();
    panel.innerHTML = '<form class="card form-grid" id="rec-form" novalidate>' +
      field('company', 'Company *', 'text', true, a.company) + field('position', 'Job title *', 'text', true, a.position) +
      field('contractType', 'Contract', 'text', false, a.contractType) + field('location', 'Location', 'text', false, a.location) +
      field('source', 'Source', 'text', false, a.source ? (MT.jobsService.SOURCE_LABEL[a.source] || a.source) : '') + field('url', 'Original job URL', 'url', false, a.url) +
      '<label class="field"><span>Application date</span><input type="date" name="applicationDate" value="' + (a.applicationDate ? U().isoDay(a.applicationDate) : '') + '"></label>' +
      field('salary', 'Salary (€/month)', 'text', false, a.salary ? (a.salary.min === a.salary.max ? a.salary.min : a.salary.min + '–' + a.salary.max) : '') +
      field('contactName', 'Contact person', 'text', false, a.contact.name) + field('contactEmail', 'Contact email', 'email', false, a.contact.email) +
      '<label class="field"><span>Interview date</span><input type="datetime-local" name="interviewDate" value="' + (a.interviewDate ? toLocalInput(a.interviewDate) : '') + '"></label>' +
      '<label class="field"><span>Follow-up date</span><input type="date" name="followUpDate" value="' + (a.followUpDate ? U().isoDay(a.followUpDate) : '') + '"></label>' +
      '<label class="field"><span>CV version used</span><select name="cvId"><option value="">—</option>' + cvs.map((c) => '<option value="' + c.id + '"' + (c.id === a.cvId ? ' selected' : '') + '>' + esc(MT.cv.label(c)) + (c.archived ? ' (archived)' : '') + '</option>').join('') + '</select></label>' +
      field('portfolioUrl', 'Portfolio used', 'url', false, a.portfolioUrl) +
      '<label class="field field--full"><span>Notes</span><textarea name="notes" rows="4">' + esc(a.notes) + '</textarea></label>' +
      '<div class="field--full meta-row muted small">Last update: ' + U().fmtDate(a.lastUpdate) + ' · Cover letter: ' + (a.coverLetterId ? 'v' + (a.coverLetterVersion || 1) : 'none') + ' · Answers used: ' + Object.keys(a.userAnswers || {}).length + '</div>' +
      '<p class="form-error field--full" role="alert" hidden></p>' +
      '<div class="field--full row-end"><button type="button" class="btn btn--danger-ghost" id="rec-del">Delete</button><button class="btn btn--primary" type="submit">Save changes</button></div></form>';
    panel.querySelector('#rec-form').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target), err = panel.querySelector('.form-error');
      const company = f.get('company').trim(), position = f.get('position').trim(), url = f.get('url').trim(), email = f.get('contactEmail').trim(), pf = f.get('portfolioUrl').trim();
      const fail = (m) => { err.hidden = false; err.textContent = m; };
      if (!company) return fail('The company name can’t be empty.');
      if (!position) return fail('The job title can’t be empty.');
      if (url && !U().isValidUrl(url)) return fail('The job URL doesn’t look valid (it should start with https://).');
      if (pf && !U().isValidUrl(pf)) return fail('The portfolio URL doesn’t look valid.');
      if (email && !U().isValidEmail(email)) return fail('The contact email doesn’t look valid.');
      const x = get(a.id);
      const sal = f.get('salary').trim().match(/\d+/g);
      Object.assign(x, {
        company, position, contractType: f.get('contractType').trim(), location: f.get('location').trim(), url, portfolioUrl: pf,
        applicationDate: f.get('applicationDate') ? new Date(f.get('applicationDate')).getTime() : x.applicationDate,
        salary: sal ? { min: +sal[0], max: +(sal[1] || sal[0]) } : null,
        contact: { name: f.get('contactName').trim(), email },
        interviewDate: f.get('interviewDate') ? new Date(f.get('interviewDate')).getTime() : null,
        followUpDate: f.get('followUpDate') ? new Date(f.get('followUpDate')).getTime() : null,
        cvId: f.get('cvId') || null, notes: f.get('notes'), lastUpdate: Date.now()
      });
      const cv = MT.storage.get('cvs', []).find((c) => c.id === x.cvId); x.cvVersion = cv ? cv.name + ' v' + cv.version : x.cvVersion;
      put(x); U().toast('Application saved', 'success'); renderRecord(root, a.id, 'overview');
    };
    panel.querySelector('#rec-del').onclick = async () => {
      if (await U().confirmDialog('Delete application?', 'This removes ' + a.company + ' — ' + a.position + ' and its reminders. Cover letters are kept.', 'Delete', true)) {
        remove(a.id); U().toast('Application deleted', 'info'); location.hash = '#/applications';
      }
    };
  }

  function timelineTab(panel, a, job, root) {
    const tl = a.timeline.slice().sort((x, y) => x.at - y.at);
    panel.innerHTML = '<div class="grid-2"><div class="card"><h2 class="h3">Timeline</h2><ol class="timeline">' +
      tl.map((e) => '<li class="timeline__item"><span class="timeline__date">' + U().fmtShort(e.at) + '</span><span class="timeline__dot" aria-hidden="true">' + (e.icon || '•') + '</span><span class="timeline__label">' + esc(e.label) + (e.note ? '<small class="muted"> — ' + esc(e.note) + '</small>' : '') + '</span></li>').join('') +
      (a.followUpDate && ['applied', 'follow_up'].indexOf(a.status) !== -1 ? '<li class="timeline__item is-future"><span class="timeline__date">' + U().fmtShort(a.followUpDate) + '</span><span class="timeline__dot">⏰</span><span class="timeline__label">Follow-up reminder (upcoming)</span></li>' : '') +
      (a.interviewDate && a.interviewDate > Date.now() ? '<li class="timeline__item is-future"><span class="timeline__date">' + U().fmtShort(a.interviewDate) + '</span><span class="timeline__dot">🎤</span><span class="timeline__label">Interview (upcoming)</span></li>' : '') +
      '</ol></div><form class="card" id="ev-form"><h2 class="h3">Add an event</h2>' +
      '<label class="field"><span>What happened?</span><input name="label" required placeholder="e.g. Phone call with the recruiter"></label>' +
      '<label class="field"><span>Date</span><input type="date" name="date" value="' + U().isoDay(Date.now()) + '"></label>' +
      '<label class="field"><span>Type</span><select name="type"><option value="custom">Note</option><option value="followup_done">Follow-up sent</option><option value="interview_done">Interview completed</option></select></label>' +
      '<p class="form-error" role="alert" hidden></p><button class="btn btn--primary">Add event</button></form></div>';
    panel.querySelector('#ev-form').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const label = f.get('label').trim();
      if (!label) { const er = panel.querySelector('.form-error'); er.hidden = false; er.textContent = 'Describe the event in a few words.'; return; }
      const type = f.get('type');
      addEvent(a.id, type, { at: new Date(f.get('date')).getTime() + 12 * 3600000, label: type === 'custom' ? label : EVENTS[type].label, note: type === 'custom' ? '' : label });
      U().toast('Event added', 'success'); renderRecord(root, a.id, 'timeline');
    };
  }

  function documentsTab(panel, a) {
    const letters = MT.storage.get('coverLetters', []).filter((l) => l.applicationId === a.id);
    const cv = MT.storage.get('cvs', []).find((c) => c.id === a.cvId);
    panel.innerHTML = '<div class="grid-2"><div class="card"><h2 class="h3">CV used</h2>' + (cv ? '<p><strong>' + esc(cv.name) + '</strong> · v' + cv.version + '<br><span class="muted small">' + esc(cv.filename) + ' · uploaded ' + U().fmtDate(cv.uploadDate) + '</span></p>' : '<p class="muted">No CV recorded.</p>') +
      '<h2 class="h3">Portfolio used</h2><p>' + (a.portfolioUrl ? '<a href="' + esc(a.portfolioUrl) + '" target="_blank" rel="noopener">' + esc(a.portfolioUrl) + '</a>' : '<span class="muted">None</span>') + '</p>' +
      '<h2 class="h3">Your answers</h2>' + (Object.keys(a.userAnswers || {}).length ? '<dl class="answers">' + Object.keys(a.userAnswers).map((k) => '<dt>' + esc(k.replace(/_/g, ' ')) + '</dt><dd>' + esc(a.userAnswers[k]) + '</dd>').join('') + '</dl>' : '<p class="muted">No answers recorded.</p>') + '</div>' +
      '<div class="card"><h2 class="h3">Cover letters</h2>' + (letters.length ? letters.map((l) => '<article class="doc-item"><div><strong>Cover Letter — ' + esc(l.company) + '</strong> <span class="badge">v' + l.version + '</span> <span class="badge badge--ghost">' + l.language.toUpperCase() + '</span><br><span class="muted small">Updated ' + U().fmtDate(l.updatedAt) + ' · Personalisation ' + l.personalizationScore + '% · Similarity ' + l.similarityScore + '%</span></div>' +
        '<div class="row"><button class="btn btn--sm btn--ghost" data-view="' + l.id + '">View</button>' + (a.jobId ? '<a class="btn btn--sm btn--ghost" href="#/prepare/' + a.jobId + '?step=6&letter=' + l.id + '">Edit</a>' : '') + '</div></article>').join('') : '<p class="muted">No cover letter yet.</p>' + (a.jobId ? '<a class="btn btn--primary" href="#/prepare/' + a.jobId + '">✨ Prepare my application</a>' : '')) + '</div></div>';
    U().$$('[data-view]', panel).forEach((b) => b.onclick = () => {
      const l = MT.coverLetter.get(b.dataset.view);
      const m = U().modal({ title: 'Cover Letter — ' + l.company + ' (v' + l.version + ')', size: 'lg', body: '<pre class="letter-view">' + esc(l.content) + '</pre>' + (l.history && l.history.length ? '<details><summary>Previous versions (' + l.history.length + ')</summary>' + l.history.map((h) => '<h4>' + esc(h.label) + ' · ' + U().fmtDate(h.at) + '</h4><pre class="letter-view letter-view--old">' + esc(h.content) + '</pre>').join('') + '</details>' : ''), footer: '<button class="btn btn--ghost" data-copy>Copy</button><button class="btn btn--primary" data-dl>Download .txt</button>' });
      m.el.querySelector('[data-copy]').onclick = () => U().copyText(l.content);
      m.el.querySelector('[data-dl]').onclick = () => U().download('Cover-Letter-' + l.company.replace(/\W+/g, '-') + '-v' + l.version + '.txt', l.content);
    });
  }

  function followupTab(panel, a, job, root) {
    const rems = MT.storage.get('reminders', []).filter((r) => r.applicationId === a.id).sort((x, y) => x.date - y.date);
    const lang = (job && job.language) || 'fr';
    panel.innerHTML = '<div class="grid-2"><div class="card"><h2 class="h3">Reminders</h2>' +
      (rems.length ? '<ul class="list">' + rems.map((r) => '<li class="list__row"><label class="check"><input type="checkbox" data-rem="' + r.id + '"' + (r.done ? ' checked' : '') + '><span>' + esc(r.title) + ' — <strong>' + U().fmtDate(r.date) + '</strong> <span class="muted small">(' + U().relDay(r.date) + ')</span></span></label></li>').join('') + '</ul>' : '<p class="muted">No reminders yet.</p>') +
      '<form id="rem-form" class="row-wrap"><label class="field"><span>Remind me on</span><input type="date" name="date" required value="' + U().isoDay(Date.now() + 7 * U().DAY) + '"></label><button class="btn btn--primary">Set reminder</button></form>' +
      '<p class="muted small">Reminders are shown in MARKETRACK (and as a browser notification if you allow it). No email is ever sent automatically.</p></div>' +
      '<div class="card"><h2 class="h3">Follow-up message draft 🐔</h2><p class="muted small">A suggestion to copy into your own email client — edit it freely.</p>' +
      '<div class="seg" role="group" aria-label="Language"><button class="seg__btn' + (lang === 'fr' ? ' is-active' : '') + '" data-lang="fr">FR</button><button class="seg__btn' + (lang === 'en' ? ' is-active' : '') + '" data-lang="en">EN</button></div>' +
      '<label class="field"><span class="sr-only">Follow-up message</span><textarea id="fu-text" rows="12">' + esc(MT.ai.followUpMessage(a, lang)) + '</textarea></label>' +
      '<div class="row"><button class="btn btn--ghost" id="fu-copy">Copy</button><button class="btn btn--primary" id="fu-sent">✓ I sent a follow-up</button></div></div></div>';
    panel.querySelector('#rem-form').onsubmit = (e) => {
      e.preventDefault();
      const v = new FormData(e.target).get('date');
      if (!v) return;
      addReminder(a.id, new Date(v).getTime() + 9 * 3600000, 'Follow up with ' + a.company);
      U().toast('Reminder set for ' + U().fmtLong(v), 'success'); renderRecord(root, a.id, 'followup');
    };
    U().$$('[data-rem]', panel).forEach((c) => c.onchange = () => MT.storage.update('reminders', [], (r) => { const x = r.find((y) => y.id === c.dataset.rem); if (x) x.done = c.checked; }));
    U().$$('[data-lang]', panel).forEach((b) => b.onclick = () => { panel.querySelector('#fu-text').value = MT.ai.followUpMessage(a, b.dataset.lang); U().$$('[data-lang]', panel).forEach((x) => x.classList.toggle('is-active', x === b)); });
    panel.querySelector('#fu-copy').onclick = () => U().copyText(panel.querySelector('#fu-text').value);
    panel.querySelector('#fu-sent').onclick = () => {
      if (a.status === 'applied') setStatus(a.id, 'follow_up', { silent: true }); else addEvent(a.id, 'followup_done');
      const x = get(a.id); x.followUpDate = Date.now() + 7 * U().DAY; put(x);
      MT.storage.update('reminders', [], (r) => r.forEach((y) => { if (y.applicationId === a.id && y.kind !== 'interview') y.done = true; }));
      U().toast('Follow-up logged. Next nudge in 7 days.', 'success'); renderRecord(root, a.id, 'followup');
    };
  }

  function prepTab(panel, a, job) {
    if (!job) { panel.innerHTML = '<div class="card"><p>The original offer is no longer in the feed, so detailed preparation isn’t available. Use the timeline and notes to prepare.</p></div>'; return; }
    const prep = MT.ai.interviewPrep(job, a.cvId);
    const store = MT.storage.get('interviewPrep', {});
    const mine = store[a.id] || {};
    const qBlock = (title, tag, list, key) => '<section class="card"><h3 class="h4">' + title + ' <span class="tag tag--' + tag + '">' + { offer: 'from the offer', profile: 'from your CV', suggestion: 'chicken suggestion' }[tag] + '</span></h3><ol class="qlist">' +
      list.map((q, i) => '<li><p>' + esc(q) + '</p><details><summary>Practice my answer</summary><label class="field"><span class="sr-only">Your answer</span><textarea rows="4" data-prac="' + key + i + '">' + esc(mine[key + i] || '') + '</textarea></label><div class="prac-feedback" data-fb="' + key + i + '"></div><button class="btn btn--sm btn--ghost" data-check="' + key + i + '">Save & get feedback</button></details></li>').join('') + '</ol></section>';
    panel.innerHTML = '<div class="interview-hero card card--dark"><div>' + CH().svg({ mood: 'confident', accessories: ['tie', 'microphone'], size: 120 }) + '</div><div><p class="eyebrow">🎤 INTERVIEW MODE</p><h2 class="display-sm">“Okay. Deep breath. Let’s prepare.”</h2>' +
      '<p>' + esc(a.company) + ' · ' + esc(a.position) + (a.interviewDate ? ' · <strong>' + U().fmtDate(a.interviewDate, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + '</strong>' : '') + '</p>' +
      '<p class="small">Questions are generated locally from the offer and your CV — they are likely questions, not a script of the real interview.</p></div></div>' +
      '<div class="grid-2">' + qBlock('Likely questions', 'suggestion', prep.general, 'g') + qBlock('About ' + job.company, 'offer', prep.company, 'c') + qBlock('About the role', 'offer', prep.role, 'r') + qBlock('Based on your CV', 'profile', prep.cv, 'v') + '</div>' +
      '<section class="card"><h3 class="h4">STAR stories to prepare <span class="tag tag--profile">from your CV</span></h3><div class="star-grid">' +
      prep.star.map((s) => '<article class="star"><h4>' + esc(s.title) + '</h4><dl><dt>S</dt><dd>' + esc(s.situation) + '</dd><dt>T</dt><dd>' + esc(s.task) + '</dd><dt>A</dt><dd class="muted">' + esc(s.action) + '</dd><dt>R</dt><dd>' + esc(s.result) + '</dd></dl></article>').join('') + '</div></section>' +
      '<section class="card"><h3 class="h4">Talking points</h3><ul>' + prep.talking.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<div class="row"><button class="btn btn--primary" id="iv-done">✓ Interview completed</button><a class="btn btn--ghost" href="#/jobs/' + job.id + '">Review the offer</a><a class="btn btn--ghost" href="#/profile/cvs">Review my CV</a></div></section>';
    U().$$('[data-check]', panel).forEach((b) => b.onclick = () => {
      const k = b.dataset.check, v = panel.querySelector('[data-prac="' + k + '"]').value;
      MT.storage.update('interviewPrep', {}, (s) => { s[a.id] = s[a.id] || {}; s[a.id][k] = v; });
      const ev = MT.ai.evaluatePractice(v);
      panel.querySelector('[data-fb="' + k + '"]').innerHTML = '<p class="small">' + ev.words + ' words. ' + (ev.ok ? '✓ Solid structure — nice.' : '') + '</p>' + (ev.tips.length ? '<ul class="small">' + ev.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') + '<p class="muted small">Heuristic feedback (length, figures, STAR), not an evaluation of content.</p>';
    });
    panel.querySelector('#iv-done').onclick = () => { addEvent(a.id, 'interview_done'); U().toast('Interview completed — your chicken earned a ✨ star!', 'success'); MT.app.render(); };
  }

  MT.applications = { COLUMNS, EVENTS, all, get, byJob, put, create, event, ensureForJob, addEvent, setStatus, remove, addReminder, snapshotOf, renderBoard, renderRecord, celebrate, interviewMode };
})(window.MT = window.MT || {});
