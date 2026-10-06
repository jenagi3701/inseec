/* ==========================================================================
   MARKETRACK — mission.js
   The one-click application preparation ("Chicken Mission"):
     01 CV → 02 Portfolio → 03 Job analysis → 04 Your questions →
     05 Cover letter → 06 Review → 07 Apply
   The app never claims an application was submitted: the user confirms it.
   Progress is stored as a draft so a browser refresh loses nothing.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);
  const CH = () => MT.chicken;

  const STEPS = [
    { n: 1, key: 'cv', label: 'CV' }, { n: 2, key: 'portfolio', label: 'Portfolio' }, { n: 3, key: 'analysis', label: 'Job Analysis' },
    { n: 4, key: 'questions', label: 'Your Questions' }, { n: 5, key: 'letter', label: 'Cover Letter' }, { n: 6, key: 'review', label: 'Review' }, { n: 7, key: 'apply', label: 'Apply' }
  ];
  const TONES = [['natural', 'More natural'], ['professional', 'More professional'], ['confident', 'More confident'], ['creative', 'More creative'], ['company', 'More company-focused'], ['marketing', 'More marketing-focused'], ['short', 'Shorten']];

  function getDraft(jobId) { return MT.storage.get('drafts', {})[jobId] || null; }
  function setDraft(jobId, patch) {
    let d;
    MT.storage.update('drafts', {}, (all) => { all[jobId] = Object.assign(all[jobId] || {}, patch, { updatedAt: Date.now() }); d = all[jobId]; });
    return d;
  }

  function render(root, jobId, params) {
    const job = MT.jobsService.get(jobId);
    if (!job) { root.innerHTML = U().emptyState({ title: 'Offer not found', text: 'This quest seems to have vanished from the map.', action: { href: '#/jobs', label: 'Back to jobs' } }); return; }
    const profile = MT.storage.get('profile', {});
    let d = getDraft(jobId);
    const defCv = MT.cv.getDefault();
    if (!d || d.done) {
      d = setDraft(jobId, { step: 1, cvId: defCv ? defCv.id : null, portfolioUrl: profile.portfolio || '', includePortfolio: !!profile.portfolio, answers: {}, skipped: {}, lang: job.language, tone: 'natural', letterId: null, done: false, startedAt: Date.now() });
    }
    if (params && params.step) {
      const patch = { step: Math.max(1, Math.min(7, +params.step)) };
      if (params.letter) {
        const l = MT.coverLetter.get(params.letter);
        if (l) { patch.letterId = l.id; patch.lang = l.language; patch.tone = l.tone; patch.answers = Object.assign({}, l.userAnswers); patch.appId = l.applicationId; patch.cvId = l.cvId || d.cvId; }
      }
      d = setDraft(jobId, patch);
      history.replaceState(null, '', '#/prepare/' + jobId);
    }

    const prior = MT.applications.byJob(job.id).filter((a) => a.status !== 'to_apply');
    const sameCompany = MT.applications.all().filter((a) => U().norm(a.company) === U().norm(job.company) && a.jobId !== job.id);
    const step = d.step;
    const pct = (step - 1) / (STEPS.length - 1) * 100;
    root.innerHTML =
      '<a class="back" href="#/jobs/' + job.id + '">← Back to the offer</a>' +
      '<header class="mission-head card card--dark"><div class="mission-head__txt"><p class="eyebrow">🐔 MISSION STARTED</p><h1 class="display-sm">' + esc(job.title) + '</h1><p>' + esc(job.company) + ' · ' + esc(job.contractType) + ' · ' + job.duration + ' months · ' + MT.matching.scoreCached(job).score + '% match</p></div>' +
      '<ol class="mission-path" aria-label="Mission steps">' + STEPS.map((s) => '<li class="mstep' + (s.n < step ? ' is-done' : s.n === step ? ' is-current' : '') + '"' + (s.n === step ? ' aria-current="step"' : '') + '>' +
        '<button type="button" class="mstep__btn" data-goto="' + s.n + '"' + (s.n > (d.maxStep || 1) && s.n > step ? ' disabled' : '') + '><span class="mstep__n">' + (s.n < step ? '✓' : s.n === step ? '→' : '○') + ' 0' + s.n + '</span><span class="mstep__l">' + s.label + '</span></button></li>').join('') +
      '<li class="mission-path__chicken" style="--p:' + pct + '%" aria-hidden="true">' + CH().svg({ mood: step >= 7 ? 'determined' : step === 4 ? 'thoughtful' : 'curious', accessories: step >= 5 ? ['laptop'] : [], size: 54, anim: 'walk' }) + '</li></ol></header>' +
      (prior.length ? '<div class="notice notice--warn" role="note"><strong>Heads-up:</strong> you already applied to this offer on ' + U().fmtDate(prior[0].applicationDate) + ' (' + CH().STATUS_META[prior[0].status].label + '). <a href="#/applications/' + prior[0].id + '">Open it</a> — or continue to prepare a new version.</div>' : '') +
      (sameCompany.length && step <= 3 ? '<div class="notice" role="note">You have ' + sameCompany.length + ' other application' + (sameCompany.length > 1 ? 's' : '') + ' at ' + esc(job.company) + ': ' + sameCompany.map((a) => esc(a.position) + ' (' + CH().STATUS_META[a.status].label + ')').join(', ') + '. <a href="#/companies/' + encodeURIComponent(job.company) + '">See company history</a></div>' : '') +
      (job.status === 'expired' ? '<div class="notice notice--warn" role="note"><strong>EXPIRED:</strong> this offer seems closed — you can still prepare, but the original link may no longer accept applications.</div>' : '') +
      '<section class="mission-body" id="mission-body"></section>';
    U().$$('[data-goto]', root).forEach((b) => b.onclick = () => { setDraft(jobId, { step: +b.dataset.goto }); render(root, jobId); });
    const body = root.querySelector('#mission-body');
    const go = (n) => { const dd = getDraft(jobId); setDraft(jobId, { step: n, maxStep: Math.max(dd.maxStep || 1, n) }); render(root, jobId); window.scrollTo({ top: 0, behavior: U().prefersReducedMotion() ? 'auto' : 'smooth' }); };
    ({ 1: stepCv, 2: stepPortfolio, 3: stepAnalysis, 4: stepQuestions, 5: stepLetter, 6: stepReview, 7: stepApply })[step](body, job, getDraft(jobId), go, root);
  }

  /* --------------------------------------------------------------- 01 CV */
  function stepCv(el, job, d, go) {
    const cvs = MT.cv.active();
    if (!cvs.length) {
      el.innerHTML = U().emptyState({ title: 'No CV uploaded', text: 'Upload your CV to unlock personalized job matching and AI applications.', prop: 'paperBlank', action: { href: '#/profile/cvs', label: 'Upload my CV' } });
      return;
    }
    el.innerHTML = '<div class="card"><h2 class="h3">01 · Select the CV for this application</h2><p class="muted">The selected CV is the only source of experience the chicken will use.</p>' +
      '<div class="cv-pick" role="radiogroup" aria-label="CV version">' + cvs.map((c) => {
        const sc = MT.matching.score(job, MT.matching.buildKnowledge(c.id)).score;
        return '<label class="cv-opt' + (c.id === d.cvId ? ' is-on' : '') + '"><input type="radio" name="cv" value="' + c.id + '"' + (c.id === d.cvId ? ' checked' : '') + '>' +
          '<span class="cv-opt__icon" aria-hidden="true">📄</span><span><strong>' + esc(c.name) + '</strong> <span class="badge">v' + c.version + '</span>' + (c.isDefault ? ' <span class="badge badge--ghost">Default</span>' : '') + '<br><span class="small muted">' + esc(c.targetRole || 'No target role') + ' · ' + esc(c.filename) + ' · ' + U().fmtDate(c.uploadDate) + '</span></span>' +
          '<span class="cv-opt__score ' + U().scoreClass(sc) + '">' + sc + '%</span></label>';
      }).join('') + '</div><p class="small muted">Match recalculated per CV version. <a href="#/profile/cvs">Manage CVs</a></p>' +
      '<p class="form-error" role="alert" hidden></p><div class="row-end"><button class="btn btn--primary" id="next">Use this CV →</button></div></div>';
    U().$$('[name=cv]', el).forEach((r) => r.onchange = () => { setDraft(job.id, { cvId: r.value }); U().$$('.cv-opt', el).forEach((o) => o.classList.toggle('is-on', o.contains(r))); });
    el.querySelector('#next').onclick = () => {
      const dd = getDraft(job.id);
      const p = MT.storage.get('profile', {});
      if (!dd.cvId) { const er = el.querySelector('.form-error'); er.hidden = false; er.textContent = 'Please choose a CV.'; return; }
      if (!p.firstName || !p.lastName) { const er = el.querySelector('.form-error'); er.hidden = false; er.innerHTML = 'Your first and last name are missing — they’re needed to sign the letter. <a href="#/profile/personal">Complete my profile</a>'; return; }
      const app = MT.applications.ensureForJob(job, dd.cvId);
      const cv = MT.storage.get('cvs', []).find((c) => c.id === dd.cvId);
      app.cvId = dd.cvId; app.cvVersion = cv.name + ' v' + cv.version;
      if (!app.timeline.some((e) => e.type === 'cv_selected')) app.timeline.push(MT.applications.event('cv_selected', Date.now(), { note: cv.name }));
      MT.applications.put(app);
      setDraft(job.id, { appId: app.id });
      go(2);
    };
  }

  /* --------------------------------------------------------------- 02 Portfolio */
  function stepPortfolio(el, job, d, go) {
    const p = MT.storage.get('profile', {});
    const pf = p.portfolioData || {};
    el.innerHTML = '<div class="card"><h2 class="h3">02 · Confirm your portfolio</h2><p class="muted">The portfolio shows what you can do. The letter will point to it once, at most — it won’t repeat it.</p>' +
      (p.portfolio ? '' : '<p class="notice notice--warn">No portfolio in your profile yet. You can add one here, or continue without it.</p>') +
      '<label class="field"><span>Portfolio URL for this application</span><input type="url" id="pf-url" value="' + esc(d.portfolioUrl || p.portfolio || '') + '" placeholder="https://myportfolio.com"></label>' +
      '<label class="check"><input type="checkbox" id="pf-inc"' + (d.includePortfolio !== false && (d.portfolioUrl || p.portfolio) ? ' checked' : '') + '><span>Include my portfolio in this application</span></label>' +
      ((pf.projects || []).length ? '<h3 class="h4">Projects you described <span class="tag tag--profile">your portfolio</span></h3><ul class="mini-list">' + pf.projects.map((x) => '<li><strong>' + esc(x.title) + '</strong> — <span class="muted">' + esc(x.summary) + '</span></li>').join('') + '</ul>' : '<p class="small muted">Tip: describe 2–3 portfolio projects in My Profile → Portfolio so the chicken can point to the right one (it never visits or scrapes your site).</p>') +
      '<p class="form-error" role="alert" hidden></p><div class="row-between"><button class="btn btn--ghost" data-back>← Back</button><button class="btn btn--primary" id="next">Confirm portfolio →</button></div></div>';
    el.querySelector('[data-back]').onclick = () => go(1);
    el.querySelector('#next').onclick = () => {
      const url = el.querySelector('#pf-url').value.trim();
      const inc = el.querySelector('#pf-inc').checked;
      if (inc && url && !U().isValidUrl(url)) { const er = el.querySelector('.form-error'); er.hidden = false; er.textContent = 'That portfolio URL doesn’t look valid — it should start with https://'; return; }
      if (inc && !url) { const er = el.querySelector('.form-error'); er.hidden = false; er.textContent = 'Add a portfolio URL, or untick “Include my portfolio”.'; return; }
      setDraft(job.id, { portfolioUrl: url, includePortfolio: inc && !!url });
      const app = MT.applications.get(getDraft(job.id).appId);
      if (app) { app.portfolioUrl = inc ? url : ''; MT.applications.put(app); }
      go(3);
    };
  }

  /* --------------------------------------------------------------- 03 Analysis */
  async function stepAnalysis(el, job, d, go) {
    el.innerHTML = '<div class="card loading-card">' + CH().svg({ mood: 'curious', prop: 'magnifier', size: 110, anim: 'think' }) + '<p class="speech">Analysing the offer, your CV and your portfolio…</p><div class="progress"><span style="--v:65%"></span></div></div>';
    await U().sleep(700);
    const a = MT.ai.analyzeJob(job, d.cvId);
    const cv = MT.storage.get('cvs', []).find((c) => c.id === d.cvId);
    const r = CH().reactionToScore(a.match.score);
    el.innerHTML = '<div class="grid-2 grid-2--wide-left"><div class="card"><h2 class="h3">03 · Your application</h2><dl class="summary">' +
      '<div><dt>Company</dt><dd>' + esc(job.company) + '</dd></div><div><dt>Position</dt><dd>' + esc(job.title) + '</dd></div><div><dt>Contract</dt><dd>' + esc(job.contractType) + ' · ' + job.duration + ' months</dd></div>' +
      '<div><dt>CV selected</dt><dd>' + esc(cv ? cv.name : '—') + '</dd></div><div><dt>Portfolio</dt><dd>' + (d.includePortfolio ? esc(d.portfolioUrl) : 'Not included') + '</dd></div><div><dt>Match</dt><dd><strong>' + a.match.score + '%</strong> · ' + esc(a.match.label) + '</dd></div></dl>' +
      '<h3 class="h4">Why you fit</h3><ul class="fit">' + a.fit.map((f) => '<li><span class="tag tag--' + f.source + '">' + MT.jobs.tagLabel(f.source) + '</span> ' + esc(f.text) + '</li>').join('') + '</ul>' +
      '<h3 class="h4">What could strengthen your application</h3><ul class="fit">' + a.strengthen.map((f) => '<li><span class="tag tag--' + f.source + '">' + MT.jobs.tagLabel(f.source) + '</span> ' + esc(f.text) + '</li>').join('') + '</ul></div>' +
      '<div class="card chicken-panel">' + U().scoreRing(a.match.score, 110) + CH().svg({ mood: r.mood, size: 110 }) + '<p class="speech">“' + esc(r.line) + '”</p><p class="small muted">Your chicken found a few things we should highlight.</p></div></div>' +
      '<div class="row-between"><button class="btn btn--ghost" data-back>← Back</button><button class="btn btn--primary" id="next">Continue →</button></div>';
    el.querySelector('[data-back]').onclick = () => go(2);
    el.querySelector('#next').onclick = () => go(4);
  }

  /* --------------------------------------------------------------- 04 Questions */
  function stepQuestions(el, job, d, go) {
    const a = MT.ai.analyzeJob(job, d.cvId);
    const qs = MT.ai.questions(job, a, {});
    const prev = MT.ai.previousAnswersFor(job.company);
    const n = qs.list.length;
    el.innerHTML = '<div class="card q-intro">' + CH().svg({ mood: 'thoughtful', size: 96, anim: 'think' }) + '<div><h2 class="h3">04 · ' + (n ? 'A few quick questions' : 'I have everything I need') + '</h2>' +
      '<p class="speech">' + (n ? '“I have enough information about your experience, but I need ' + n + ' quick answer' + (n > 1 ? 's' : '') + ' to make this application more personal.”' : '“Your profile and previous answers already cover what this letter needs.”') + '</p>' +
      '<p class="small muted">Answer in the language of your letter (offer language: ' + (job.language === 'fr' ? 'French' : 'English') + '). Short answers are perfect. Anything you skip is simply left out — never invented.</p></div></div>' +
      '<form id="q-form" class="q-list">' + qs.list.map((q, i) => qCard(q, i, d)).join('') + '</form>' +
      ((qs.skipped.length || Object.keys(prev).length) ? '<details class="card known"><summary>What I already know — so I’m not asking (' + (qs.skipped.length + Object.keys(prev).length) + ')</summary><ul>' + qs.skipped.map((s) => '<li>' + esc(s) + '</li>').join('') + Object.keys(prev).map((k) => '<li>' + esc(k.replace(/_/g, ' ')) + ': “' + esc(prev[k]) + '” <span class="tag tag--answers">previous answer</span></li>').join('') + '</ul></details>' : '') +
      '<p class="form-error" role="alert" hidden></p><div class="row-between"><button class="btn btn--ghost" data-back>← Back</button><button class="btn btn--primary" id="next">Save answers →</button></div>';
    el.querySelector('[data-back]').onclick = () => go(3);
    U().$$('[data-skip]', el).forEach((c) => c.onchange = () => { const t = el.querySelector('[data-q="' + c.dataset.skip + '"]'); if (t) t.disabled = c.checked; U().$$('[name="' + c.dataset.skip + '"]', el).forEach((x) => { x.disabled = c.checked; }); });
    el.querySelector('#next').onclick = () => {
      const answers = Object.assign({}, prev), skipped = {};
      qs.list.forEach((q) => {
        const sk = el.querySelector('[data-skip="' + q.id + '"]');
        if (sk && sk.checked) { skipped[q.id] = true; return; }
        if (q.type === 'choice') { const c = el.querySelector('[name="' + q.id + '"]:checked'); if (c) answers[q.id] = c.value; }
        else { const v = el.querySelector('[data-q="' + q.id + '"]').value.trim(); if (v) answers[q.id] = v; }
      });
      const unanswered = qs.list.filter((q) => !answers[q.id] && !skipped[q.id]);
      if (unanswered.length) {
        const er = el.querySelector('.form-error'); er.hidden = false;
        er.textContent = 'Answer or tick “Skip” for: ' + unanswered.map((q) => q.category).join(', ') + '. Skipping is fine — the letter just gets a little less personal.';
        const first = el.querySelector('[data-q="' + unanswered[0].id + '"]') || el.querySelector('[name="' + unanswered[0].id + '"]'); if (first) first.focus();
        return;
      }
      setDraft(job.id, { answers, skipped });
      MT.ai.rememberAnswers(job.company, answers);
      const app = MT.applications.get(getDraft(job.id).appId);
      if (app) { app.userAnswers = answers; MT.applications.put(app); }
      go(5);
    };
  }
  function qCard(q, i, d) {
    const val = (d.answers || {})[q.id] || '';
    const skipped = (d.skipped || {})[q.id];
    return '<fieldset class="card qcard"><legend class="qcard__cat">' + q.icon + ' ' + esc(q.category) + '</legend>' +
      '<label class="qcard__q" for="q-' + q.id + '">' + (i + 1) + '. ' + esc(q.text) + '</label>' +
      '<p class="small muted">' + esc(q.hint) + '</p>' +
      (q.type === 'choice'
        ? '<div class="choice-list" id="q-' + q.id + '">' + q.options.map((o) => '<label class="choice"><input type="radio" name="' + q.id + '" value="' + esc(o.value) + '"' + (val === o.value ? ' checked' : '') + (skipped ? ' disabled' : '') + '><span>' + esc(o.label) + '</span></label>').join('') + '</div>'
        : '<textarea id="q-' + q.id + '" data-q="' + q.id + '" rows="3"' + (skipped ? ' disabled' : '') + '>' + esc(val) + '</textarea>') +
      (q.chips && q.chips.length ? '<div class="qcard__ctx"><span class="tag tag--offer">from the offer</span> ' + q.chips.map((c) => '<span class="ctx-chip">' + esc(c) + '</span>').join('') + '</div>' : '') +
      '<div class="row-between small"><span class="muted">Why I ask: ' + esc(q.why) + '</span><label class="check"><input type="checkbox" data-skip="' + q.id + '"' + (skipped ? ' checked' : '') + '><span>Skip</span></label></div></fieldset>';
  }

  /* --------------------------------------------------------------- 05 Letter */
  function stepLetter(el, job, d, go) {
    const existing = d.letterId ? MT.coverLetter.get(d.letterId) : null;
    const lang = d.lang || job.language;
    el.innerHTML = '<div class="card gen-card"><h2 class="h3">05 · Generate my cover letter</h2>' +
      '<p>Offer language detected: <strong>' + (job.language === 'fr' ? 'French' : 'English') + '</strong>. You can override it.</p>' +
      '<div class="row-wrap"><button class="btn ' + (lang === 'fr' ? 'btn--primary' : 'btn--ghost') + '" data-gen="fr">Generate in French</button><button class="btn ' + (lang === 'en' ? 'btn--primary' : 'btn--ghost') + '" data-gen="en">Generate in English</button></div>' +
      '<p class="small muted">Generated locally by the demo AI from: the offer + your selected CV + your portfolio + your profile + your answers + your previous letters (to avoid repetition). Nothing leaves your browser.</p>' +
      (existing ? '<div class="notice notice--ok">A letter already exists for this mission (v' + existing.version + ', ' + existing.language.toUpperCase() + '). Generating again creates a new version. <button class="btn btn--sm btn--ghost" id="to-review">Go to review →</button></div>' : '') +
      '<div id="gen-stage"></div></div><div class="row-between"><button class="btn btn--ghost" data-back>← Back</button></div>';
    el.querySelector('[data-back]').onclick = () => go(4);
    const tr = el.querySelector('#to-review'); if (tr) tr.onclick = () => go(6);
    U().$$('[data-gen]', el).forEach((b) => b.onclick = () => generateFlow(el.querySelector('#gen-stage'), job, b.dataset.gen, go));
  }

  async function generateFlow(stage, job, lang, go) {
    const d = getDraft(job.id);
    U().$$('[data-gen]', stage.parentElement).forEach((b) => { b.disabled = true; });
    const lines = ['Your chicken is writing a personalized application…', 'Checking your experience…', 'Comparing with the job…', 'Making sure we don’t repeat your CV…', 'Almost ready!'];
    stage.innerHTML = '<div class="writing" role="status" aria-live="polite"><div class="writing__desk">' + CH().svg({ mood: 'determined', accessories: ['laptop'], size: 140, anim: 'type' }) + '</div><p class="writing__line" id="wl">' + lines[0] + '</p><div class="progress"><span id="wp" style="--v:5%"></span></div></div>';
    for (let i = 0; i < lines.length; i++) {
      stage.querySelector('#wl').textContent = lines[i];
      stage.querySelector('#wp').style.setProperty('--v', ((i + 1) / lines.length * 100) + '%');
      await U().sleep(520);
    }
    try {
      const app = MT.applications.get(d.appId);
      const final = MT.coverLetter.generate({ job, cvId: d.cvId, applicationId: d.appId, answers: d.answers || {}, lang, tone: 'natural', includePortfolio: !!d.includePortfolio, portfolioUrl: d.portfolioUrl, contactName: app && app.contact ? app.contact.name : '' });
      const rec = MT.coverLetter.save(final, { applicationId: d.appId, cvId: d.cvId, job, coverLetterId: d.letterId });
      setDraft(job.id, { letterId: rec.id, lang, tone: 'natural' });
      if (app) {
        app.coverLetterId = rec.id; app.coverLetterVersion = rec.version;
        app.timeline.push(MT.applications.event('letter', Date.now(), { note: (lang === 'fr' ? 'French' : 'English') + ' · v' + rec.version }));
        app.lastUpdate = Date.now(); MT.applications.put(app);
      }
      stage.innerHTML = qualityPanel(final.quality, final.attempts) + '<div class="row-end"><button class="btn btn--primary" id="to-review2">Review & edit →</button></div>';
      stage.querySelector('#to-review2').onclick = () => go(6);
      stage.querySelector('#to-review2').focus();
    } catch (e) {
      console.error(e);
      stage.innerHTML = '<div class="notice notice--error" role="alert"><strong>The letter couldn’t be generated.</strong> ' + esc(e.message || 'Something went wrong in the local AI.') + ' Your answers are saved — try again, or check your profile.</div>';
      U().$$('[data-gen]', stage.parentElement).forEach((b) => { b.disabled = false; });
    }
  }

  function qualityPanel(q, attempts) {
    const happy = q.risk === 'Low';
    return '<div class="quality"><div class="quality__chicken">' + CH().svg({ mood: happy ? 'happy' : 'thoughtful', size: 80 }) + '<p class="small">' + (happy ? '👍 Looks personal to me!' : 'Hmm, a bit close to something you already wrote.') + '</p></div>' +
      '<div class="quality__body"><h3 class="h4">🐔 QUALITY CHECK</h3><div class="kpis kpis--sm">' +
      '<div class="kpi"><span class="kpi__v">' + q.personalization + '%</span><span class="kpi__l">Personalisation</span></div>' +
      '<div class="kpi"><span class="kpi__v risk--' + q.risk.toLowerCase() + '">' + q.risk.toUpperCase() + '</span><span class="kpi__l">Repetition risk</span></div>' +
      '<div class="kpi"><span class="kpi__v">' + q.cvRepetition + '%</span><span class="kpi__l">CV repetition</span></div>' +
      '<div class="kpi"><span class="kpi__v">' + q.previousSimilarity + '%</span><span class="kpi__l">Previous-letter similarity' + (q.similarTo ? ' (closest: ' + esc(q.similarTo) + ')' : '') + '</span></div></div>' +
      '<ul class="checks">' + q.checks.map((c) => '<li class="' + (c.ok ? 'ok' : c.warn ? 'warn' : 'bad') + '"><span aria-hidden="true">' + (c.ok ? '✓' : c.warn ? '!' : '✗') + '</span> ' + esc(c.label) + '</li>').join('') + '</ul>' +
      (attempts > 1 ? '<p class="small muted">Automatically regenerated ' + (attempts - 1) + ' time' + (attempts > 2 ? 's' : '') + ' to reduce repetition.</p>' : '') + '</div></div>';
  }

  /* --------------------------------------------------------------- 06 Review */
  function stepReview(el, job, d, go) {
    const l = d.letterId ? MT.coverLetter.get(d.letterId) : null;
    if (!l) { el.innerHTML = '<div class="card"><p>No letter yet.</p><button class="btn btn--primary" id="b">Generate one →</button></div>'; el.querySelector('#b').onclick = () => go(5); return; }
    const p = l.plan;
    const cvName = (MT.storage.get('cvs', []).find((c) => c.id === l.cvId) || {}).name || '';
    el.innerHTML = '<div class="editor-layout"><div class="card editor">' +
      '<div class="editor__bar"><h2 class="h3">06 · Review & edit <span class="badge">v' + l.version + '</span> <span class="badge badge--ghost">' + l.language.toUpperCase() + '</span> <span class="badge badge--ghost">' + esc(l.tone) + '</span>' + (l.edited ? ' <span class="badge badge--ghost">edited</span>' : '') + '</h2>' +
      '<div class="toolbar" role="toolbar" aria-label="Rewrite options">' +
      '<button class="btn btn--sm btn--ghost" data-tone="regen">↻ Regenerate</button>' + TONES.map((t) => '<button class="btn btn--sm btn--ghost" data-tone="' + t[0] + '">' + t[1] + '</button>').join('') +
      '<button class="btn btn--sm btn--ghost" data-translate>Translate ' + (l.language === 'fr' ? 'FR → EN' : 'EN → FR') + '</button></div></div>' +
      '<label for="letter-text" class="sr-only">Cover letter text</label><textarea id="letter-text" class="letter-edit" spellcheck="true">' + esc(l.content) + '</textarea>' +
      '<div class="row-between editor__foot"><div class="row"><button class="btn btn--ghost btn--sm" id="copy">Copy</button><button class="btn btn--ghost btn--sm" id="dl">Download .txt</button><button class="btn btn--ghost btn--sm" id="recheck">Re-check quality</button>' +
      ((l.history || []).length ? '<label class="field field--inline field--sm"><span>Versions</span><select id="ver"><option value="">Current (v' + l.version + ')</option>' + l.history.map((h, i) => '<option value="' + i + '">' + esc(h.label) + '</option>').join('') + '</select></label>' : '') +
      '</div><button class="btn btn--primary btn--sm" id="save">Save edits</button></div>' +
      '<p class="small muted">Stylistic rewrites keep the same facts (same experiences, figures and answers). Rewriting replaces unsaved manual edits.</p></div>' +
      '<aside class="editor-side"><div class="card" id="q-panel">' + qualityPanel(l.quality, 1) + '</div>' +
      '<div class="card"><h3 class="h4">What this letter is built from</h3><ul class="facts-used">' +
      p.evidence.map((e) => '<li><span class="tag tag--profile">CV · ' + esc(cvName) + '</span> ' + esc(e.kind === 'project' ? 'Project: ' + e.title : e.role + ' — ' + e.company) + (e.metric ? ' <small>(' + esc(e.metric) + ')</small>' : '') + '</li>').join('') +
      (p.need ? '<li><span class="tag tag--offer">Job offer</span> ' + esc(p.need) + '</li>' : '') +
      Object.keys(p.answers || {}).filter((k) => p.answers[k]).map((k) => '<li><span class="tag tag--answers">Your answer</span> ' + esc(k.replace(/_/g, ' ')) + ': “' + esc(String(p.answers[k]).slice(0, 90)) + '”</li>').join('') +
      (p.portfolio ? '<li><span class="tag tag--profile">Portfolio</span> ' + esc(p.portfolio.project || p.portfolio.url) + '</li>' : '') +
      '<li><span class="tag tag--suggestion">Chicken</span> Structure & phrasing only — no facts added.</li></ul></div></aside></div>' +
      '<div class="row-between"><button class="btn btn--ghost" data-back>← Back</button><button class="btn btn--primary" id="next">Looks good — next: apply →</button></div>';

    const ta = el.querySelector('#letter-text');
    let dirty = false;
    ta.addEventListener('input', () => { dirty = true; });
    const app = MT.applications.get(d.appId);
    const ctx = { job, cvId: l.cvId, applicationId: d.appId };
    const regen = async (tone, lang, keepChoices) => {
      if (dirty && !(await U().confirmDialog('Replace your edits?', 'Rewriting creates a new version from the same facts. Your unsaved manual edits will be replaced (previous versions stay in the history).', 'Rewrite'))) return;
      el.querySelector('.editor').classList.add('is-busy');
      await U().sleep(450);
      try {
        const gen = MT.coverLetter.generate({ job, plan: l.plan, applicationId: d.appId, cvId: l.cvId, lang: lang || l.language, tone: tone || l.tone, forceIds: keepChoices ? l.choices : null, seed: Date.now() % 99991 });
        const rec = MT.coverLetter.save(gen, { applicationId: d.appId, cvId: l.cvId, job, coverLetterId: l.id });
        setDraft(job.id, { lang: rec.language, tone: rec.tone });
        if (app) { app.coverLetterVersion = rec.version; app.lastUpdate = Date.now(); MT.applications.put(app); }
        U().toast('New version v' + rec.version + ' — ' + (lang && lang !== l.language ? 'translated' : tone) + '.', 'success');
        render(document.querySelector('#view'), job.id);
      } catch (e) { U().toast('Rewrite failed: ' + e.message, 'error'); el.querySelector('.editor').classList.remove('is-busy'); }
    };
    U().$$('[data-tone]', el).forEach((b) => b.onclick = () => regen(b.dataset.tone === 'regen' ? l.tone : b.dataset.tone));
    el.querySelector('[data-translate]').onclick = () => regen(l.tone, l.language === 'fr' ? 'en' : 'fr', true);
    el.querySelector('#copy').onclick = () => U().copyText(ta.value);
    el.querySelector('#dl').onclick = () => U().download('Cover-Letter-' + job.company.replace(/\W+/g, '-') + '-' + l.language.toUpperCase() + '-v' + l.version + '.txt', ta.value);
    el.querySelector('#recheck').onclick = () => {
      const q = MT.coverLetter.recheck(ta.value, l, ctx);
      el.querySelector('#q-panel').innerHTML = qualityPanel(q, 1);
      U().toast('Quality re-checked', 'info');
    };
    const ver = el.querySelector('#ver');
    if (ver) ver.onchange = () => { if (ver.value !== '') { ta.value = l.history[+ver.value].content; dirty = true; U().toast('Older version loaded in the editor — save to restore it.', 'info'); } else { ta.value = l.content; dirty = false; } };
    el.querySelector('#save').onclick = () => {
      const q = MT.coverLetter.recheck(ta.value, l, ctx);
      const rec = MT.coverLetter.save({ plan: l.plan, text: ta.value, body: ta.value, choices: l.choices, lang: l.language, tone: l.tone, quality: q, edited: true }, { applicationId: d.appId, cvId: l.cvId, job, coverLetterId: l.id });
      if (app) { app.coverLetterVersion = rec.version; MT.applications.put(app); }
      dirty = false; U().toast('Edits saved as v' + rec.version, 'success');
      el.querySelector('#q-panel').innerHTML = qualityPanel(q, 1);
    };
    el.querySelector('[data-back]').onclick = () => go(5);
    el.querySelector('#next').onclick = async () => {
      if (dirty && await U().confirmDialog('Save your edits first?', 'You have unsaved changes in the letter.', 'Save & continue')) el.querySelector('#save').click();
      go(7);
    };
  }

  /* --------------------------------------------------------------- 07 Apply */
  function stepApply(el, job, d, go) {
    const src = MT.jobsService.preferredSource(job);
    const opened = !!d.openedOriginal;
    el.innerHTML = '<div class="grid-2 grid-2--wide-left"><div class="card"><h2 class="h3">07 · Apply on the original platform</h2>' +
      '<ol class="apply-steps"><li>Copy or download your letter (step 06).</li><li>Open the offer on <strong>' + esc(MT.jobsService.SOURCE_LABEL[src.source]) + '</strong> and submit your application there.</li><li>Come back and confirm — only then will the tracker say “Applied”.</li></ol>' +
      '<div class="row-wrap"><a class="btn btn--ghost" id="open-orig" href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">Open original application ↗</a>' +
      (d.letterId ? '<button class="btn btn--ghost" id="copy-l">Copy my letter</button>' : '') + '</div>' +
      '<p class="small muted">Demo offer: the link opens a search on ' + esc(MT.jobsService.SOURCE_LABEL[src.source]) + ', not a real listing. MARKETRACK never submits anything for you.</p>' +
      (opened ? '<p class="notice">You opened the original offer. Did you submit your application?</p>' : '') +
      '<div class="confirm-box"><button class="btn btn--primary btn--lg" id="confirm">✓ I submitted this application</button><button class="btn btn--ghost" id="later">Not yet — keep it in “To Apply”</button></div></div>' +
      '<div class="card chicken-panel">' + CH().svg({ mood: 'determined', accessories: ['document'], size: 120 }) + '<p class="speech">“Last step! I’ll wait here while you apply.”</p></div></div>' +
      '<div class="row-between"><button class="btn btn--ghost" data-back>← Back</button></div>';
    el.querySelector('#open-orig').addEventListener('click', () => { setDraft(job.id, { openedOriginal: true }); setTimeout(() => render(document.querySelector('#view'), job.id), 300); });
    const cl = el.querySelector('#copy-l'); if (cl) cl.onclick = () => U().copyText(MT.coverLetter.get(d.letterId).content);
    el.querySelector('[data-back]').onclick = () => go(6);
    el.querySelector('#later').onclick = () => { U().toast('Kept in “To Apply”. Your draft is saved.', 'info'); location.hash = '#/applications'; };
    el.querySelector('#confirm').onclick = () => {
      let app = d.appId ? MT.applications.get(d.appId) : null;
      if (!app) app = MT.applications.ensureForJob(job, d.cvId);
      MT.applications.setStatus(app.id, 'applied', { silent: true });
      app = MT.applications.get(app.id);
      setDraft(job.id, { done: true });
      confirmation(app);
    };
  }

  function confirmation(app) {
    const m = U().modal({
      title: 'Application submitted!', size: 'md', sticky: true,
      body: '<div class="center">' + CH().svg({ mood: 'happy', prop: 'flag', size: 140, anim: 'jump' }) + '<p class="speech speech--center">“Mission completed!”</p></div>' +
        '<dl class="summary"><div><dt>Company</dt><dd>' + esc(app.company) + '</dd></div><div><dt>Position</dt><dd>' + esc(app.position) + '</dd></div><div><dt>Date</dt><dd>' + U().fmtLong(app.applicationDate) + '</dd></div><div><dt>Next suggested action</dt><dd>Follow up in 7 days (' + U().fmtLong(Date.now() + 7 * U().DAY) + ')</dd></div></dl>',
      footer: '<button class="btn btn--ghost" data-skip>View tracker</button><button class="btn btn--primary" data-rem>⏰ Set reminder</button>'
    });
    m.el.querySelector('[data-rem]').onclick = () => {
      MT.applications.addReminder(app.id, Date.now() + 7 * U().DAY, 'Follow up with ' + app.company);
      U().toast('Reminder set: follow up with ' + app.company + ' on ' + U().fmtLong(Date.now() + 7 * U().DAY), 'success');
      m.close(); location.hash = '#/applications';
    };
    m.el.querySelector('[data-skip]').onclick = () => { m.close(); location.hash = '#/applications'; };
  }

  MT.mission = { render, qualityPanel };
})(window.MT = window.MT || {});
