/* ==========================================================================
   MARKETRACK — assistant.js
   🐔 Career Chicken side panel. Context-aware actions; every answer is
   labelled: Your profile · Job offer · Your answers · Chicken suggestion.
   The chicken is a companion, never a recruiter, and never states invented
   information as fact.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);
  let open = false, ctx = {}, lastFocus = null;

  const ACTIONS = [
    ['analyze', '🔎 Analyze this job'], ['fit', '💛 Why am I a good fit?'], ['missing', '🧩 What is missing from my profile?'],
    ['letter', '✍️ Generate cover letter'], ['improve', '✨ Improve my cover letter'], ['personal', '🫶 Make it more personal'],
    ['shorter', '✂️ Make it shorter'], ['interview', '🎤 Prepare interview questions'], ['followup', '💌 Create follow-up message']
  ];

  function contextFromRoute() {
    const h = location.hash;
    let m = h.match(/^#\/jobs\/([^/?]+)/) || h.match(/^#\/prepare\/([^/?]+)/);
    if (m) return { job: MT.jobsService.get(m[1]) };
    m = h.match(/^#\/applications\/([^/?]+)/);
    if (m) { const a = MT.applications.get(m[1]); return { app: a, job: a && a.jobId ? MT.jobsService.get(a.jobId) : null }; }
    return {};
  }

  function openPanel(c) {
    ctx = Object.assign(contextFromRoute(), c || {});
    if (ctx.job && !ctx.app) ctx.app = MT.applications.byJob(ctx.job.id).sort((a, b) => b.lastUpdate - a.lastUpdate)[0] || null;
    const el = document.querySelector('#assistant');
    lastFocus = document.activeElement;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    open = true;
    renderPanel();
    el.querySelector('.assistant__close').focus();
  }
  function close() {
    const el = document.querySelector('#assistant');
    el.classList.remove('is-open'); open = false;
    setTimeout(() => { if (!open) el.hidden = true; }, 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function renderPanel(output) {
    const el = document.querySelector('#assistant');
    const jobs = MT.jobsService.all().filter((j) => j.status !== 'expired').sort((a, b) => MT.matching.scoreCached(b).score - MT.matching.scoreCached(a).score);
    el.innerHTML = '<div class="assistant__inner" role="dialog" aria-modal="false" aria-labelledby="as-t">' +
      '<header class="assistant__head">' + MT.chicken.svg({ mood: output ? 'happy' : 'curious', size: 52 }) + '<div><h2 class="h4" id="as-t">🐔 Career Chicken</h2><p class="small muted">Your career companion — not a recruiter.</p></div><button class="icon-btn assistant__close" aria-label="Close Career Chicken panel">×</button></header>' +
      '<div class="assistant__ctx"><label class="field field--sm"><span>Talking about</span><select id="as-job"><option value="">— choose a job —</option>' + jobs.map((j) => '<option value="' + j.id + '"' + (ctx.job && ctx.job.id === j.id ? ' selected' : '') + '>' + esc(j.company + ' — ' + j.title) + '</option>').join('') + '</select></label></div>' +
      '<div class="assistant__actions">' + ACTIONS.map((a) => '<button class="chipbtn" data-act="' + a[0] + '"' + (!ctx.job ? ' disabled' : '') + '>' + a[1] + '</button>').join('') + '</div>' +
      '<div class="assistant__out" aria-live="polite">' + (output || '<p class="speech">“' + (ctx.job ? 'What should we look at for ' + esc(ctx.job.company) + '?' : 'Pick a job and I’ll help you with it.') + '”</p>') + '</div>' +
      '<p class="assistant__legend small"><span class="tag tag--profile">Your profile</span> <span class="tag tag--offer">Job offer</span> <span class="tag tag--answers">Your answers</span> <span class="tag tag--suggestion">Chicken suggestion</span></p></div>';
    el.querySelector('.assistant__close').onclick = close;
    el.querySelector('#as-job').onchange = (e) => { ctx = { job: MT.jobsService.get(e.target.value) }; if (ctx.job) ctx.app = MT.applications.byJob(ctx.job.id)[0] || null; renderPanel(); };
    U().$$('[data-act]', el).forEach((b) => b.onclick = () => run(b.dataset.act));
  }

  const block = (tag, title, items) => '<div class="ablock"><p class="ablock__t"><span class="tag tag--' + tag + '">' + MT.jobs.tagLabel(tag) + '</span> ' + esc(title) + '</p>' + (Array.isArray(items) ? '<ul>' + items.map((i) => '<li>' + i + '</li>').join('') + '</ul>' : '<p>' + items + '</p>') + '</div>';

  async function run(act) {
    const job = ctx.job;
    if (!job) return;
    const out = document.querySelector('.assistant__out');
    out.innerHTML = '<p class="speech"><span class="spinner" aria-hidden="true"></span> Thinking…</p>';
    await U().sleep(350);
    let html = '';
    try {
      const a = MT.ai.analyzeJob(job, ctx.app && ctx.app.cvId);
      const app = ctx.app;
      const letter = app && app.coverLetterId ? MT.coverLetter.get(app.coverLetterId) : null;
      if (act === 'analyze') {
        html = block('offer', job.title + ' at ' + job.company, [esc(job.contractType + ' · ' + job.duration + ' months · ' + job.location), 'Needs: ' + esc(job.requirements.required.map((k) => MT.knowledge.skillLabel(k)).join(', '))]) +
          block('profile', a.match.score + '% match — ' + a.match.label, a.match.strong.slice(0, 5).map((x) => esc(x.label))) +
          block('suggestion', 'My take', '“' + esc(MT.chicken.reactionToScore(a.match.score).line) + '” The score is a recommendation, not a hiring prediction.');
      } else if (act === 'fit') {
        html = a.fit.map((f) => block(f.source, '', esc(f.text))).join('');
      } else if (act === 'missing') {
        html = block('offer', 'Asked by the offer, not found in your CV', a.match.missing.map((m) => esc(m.label + ' — ' + m.note)).concat(a.match.missing.length ? [] : ['Nothing major.'])) +
          block('profile', 'Partially covered', a.match.partial.map((m) => esc(m.label + ' — ' + m.note))) +
          block('suggestion', 'What you can do', 'If you genuinely have one of these skills, add it to your CV data (My Profile → CVs → Review data). I will never add it for you.');
      } else if (act === 'letter') {
        html = block('suggestion', 'Let’s start the mission', '<a class="btn btn--primary btn--sm" href="#/prepare/' + job.id + '">✨ Prepare my application</a>');
      } else if (act === 'improve' || act === 'personal') {
        if (!letter) html = block('suggestion', 'No letter yet', 'Generate a letter first — <a href="#/prepare/' + job.id + '">start the mission</a>.');
        else {
          const unanswered = ['motivation_company', 'personal_connection', 'role_attraction'].filter((k) => !(letter.userAnswers || {})[k]);
          html = block('profile', 'Current letter', 'v' + letter.version + ' · personalisation ' + letter.personalizationScore + '% · similarity to previous letters ' + letter.similarityScore + '%') +
            (Object.keys(letter.userAnswers || {}).length ? block('answers', 'Answers already used', Object.keys(letter.userAnswers).filter((k) => letter.userAnswers[k]).map((k) => esc(k.replace(/_/g, ' ') + ': “' + letter.userAnswers[k] + '”'))) : '') +
            block('suggestion', act === 'personal' ? 'To make it more personal' : 'Ideas to improve it', (unanswered.length ? unanswered.map((k) => 'Answer: ' + esc(k.replace(/_/g, ' '))) : ['Try the “More company-focused” rewrite.']).concat(['<a href="#/prepare/' + job.id + '?step=' + (act === 'personal' ? 4 : 6) + '&letter=' + letter.id + '">Open the ' + (act === 'personal' ? 'questions' : 'editor') + ' →</a>']));
        }
      } else if (act === 'shorter') {
        if (!letter) html = block('suggestion', 'No letter yet', 'Generate a letter first — <a href="#/prepare/' + job.id + '">start the mission</a>.');
        else {
          const gen = MT.coverLetter.generate({ job, plan: letter.plan, applicationId: letter.applicationId, cvId: letter.cvId, lang: letter.language, tone: 'short' });
          const rec = MT.coverLetter.save(gen, { applicationId: letter.applicationId, cvId: letter.cvId, job, coverLetterId: letter.id });
          html = block('suggestion', 'Shorter version saved as v' + rec.version + ' (' + gen.quality.words + ' words, same facts)', '<pre class="letter-view letter-view--sm">' + esc(gen.body) + '</pre><a href="#/prepare/' + job.id + '?step=6&letter=' + rec.id + '">Open in the editor →</a>');
        }
      } else if (act === 'interview') {
        const p = MT.ai.interviewPrep(job, app && app.cvId);
        html = block('offer', 'About ' + job.company + ' and the role', p.company.slice(0, 2).concat(p.role.slice(0, 2)).map(esc)) + block('profile', 'From your CV', p.cv.slice(0, 3).map(esc)) +
          (app ? block('suggestion', 'Full preparation', '<a href="#/applications/' + app.id + '/prep">Open interview mode →</a> <span class="small muted">(available once the application reaches Interview)</span>') : '');
      } else if (act === 'followup') {
        if (!app || !app.applicationDate) html = block('suggestion', 'Nothing to follow up yet', 'Follow-ups make sense once you have applied. Confirm your application first.');
        else {
          const txt = MT.ai.followUpMessage(app, job.language);
          html = block('suggestion', 'Draft — copy it into your own email', '<textarea class="assistant__ta" rows="9" aria-label="Follow-up draft">' + esc(txt) + '</textarea><button class="btn btn--sm btn--ghost" id="as-copy">Copy</button> <span class="small muted">Nothing is sent automatically.</span>');
        }
      }
    } catch (e) {
      console.error(e);
      html = '<div class="notice notice--error" role="alert">The chicken tripped over something: ' + esc(e.message) + '. Please try again.</div>';
    }
    renderPanel(html);
    const c = document.querySelector('#as-copy'); if (c) c.onclick = () => U().copyText(document.querySelector('.assistant__ta').value);
  }

  MT.assistant = { open: openPanel, close, isOpen: () => open };
})(window.MT = window.MT || {});
