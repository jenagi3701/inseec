/* ==========================================================================
   MARKETRACK — ai.js
   AI layer with a provider interface. The default provider is a LOCAL MOCK:
   deterministic, rule-based, runs entirely in the browser, sends nothing
   anywhere. A real LLM provider can be plugged in later (see ExternalProvider)
   — it would require explicit user consent before any CV data leaves the device.

   Every output is tagged with where it comes from:
     profile  = facts from the user's CV / profile / portfolio
     offer    = information from the job offer
     answers  = what the user told the Career Chicken
     suggestion = the chicken's own suggestion (never presented as fact)
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const K = () => MT.knowledge;

  /* ---------------------------------------------------------- provider registry */
  const MockProvider = { id: 'mock', label: 'Local demo AI (rule-based, offline)', external: false, ready: () => true };
  const ExternalProvider = {
    id: 'external', label: 'External LLM API (not configured)', external: true,
    ready: () => false,
    // Integration point: a backend endpoint would receive { job, knowledge, answers } only after the
    // user explicitly accepts sending their CV data. Not implemented in the local prototype.
    call: () => Promise.reject(new Error('External AI is not configured in this prototype.'))
  };
  function provider() {
    const s = MT.storage.get('settings', {});
    return s.aiProvider === 'external' ? ExternalProvider : MockProvider;
  }

  /* ---------------------------------------------------------- helpers */
  const METRIC_RE = /[+\-]?\d+([.,]\d+)?\s?%|\+\s?\d+|\b\d+\s?(k€|€|k|abonnés|followers|articles|créateurs|creators|clients|réponses|responses|participants|vues|views|bénévoles|volunteers|publications|posts)\b/i;
  function metricClause(bullet) {
    if (!METRIC_RE.test(bullet)) return '';
    const parts = bullet.split(/\s*[:;—–]\s*|,\s+/);
    const p = parts.find((x) => METRIC_RE.test(x)) || bullet;
    return p.trim().replace(/\.$/, '');
  }
  function itemSkills(item) {
    const text = (item.role || item.title || '') + ' ' + (item.bullets || []).join(' ') + ' ' + (item.summary || '');
    return K().detectSkills(text).concat(item.skills || []).filter((v, i, a) => a.indexOf(v) === i);
  }

  /** Rank CV experiences/projects (+ portfolio projects) as evidence for a job. */
  function rankEvidence(job, kb, usage) {
    usage = usage || {};
    const req = job.requirements.required, pref = job.requirements.preferred;
    const items = kb.experiences.map((e) => ({ kind: 'experience', ref: e.id, item: e }))
      .concat(kb.projects.map((p) => ({ kind: 'project', ref: p.id, item: p })));
    return items.map((x) => {
      const sk = itemSkills(x.item);
      const mReq = req.filter((k) => sk.indexOf(k) !== -1), mPref = pref.filter((k) => sk.indexOf(k) !== -1);
      const bl = (x.item.bullets || []).slice().sort((a, b) => (/%/.test(b) ? 1 : 0) - (/%/.test(a) ? 1 : 0));
      const metricBullet = bl.find((b) => METRIC_RE.test(b) && K().detectSkills(b).some((k) => mReq.indexOf(k) !== -1 || mPref.indexOf(k) !== -1))
        || bl.find((b) => METRIC_RE.test(b));
      let rel = 2 * mReq.length + mPref.length + (x.item.industry && x.item.industry === job.industry ? 2 : 0) + (metricBullet ? 1 : 0) + (x.item.type === 'volunteer' ? -1.5 : 0) + (x.kind === 'project' ? -2 : 0);
      const used = usage[x.ref] || 0;
      return Object.assign(x, { skills: sk, matched: mReq.concat(mPref), rel, used, adjusted: rel - 0.8 * used, metric: metricBullet ? metricClause(metricBullet) : '', metricBullet: metricBullet || '' });
    }).sort((a, b) => b.rel - a.rel).map((x, i, arr) => Object.assign(x, { eligible: x.rel >= arr[0].rel * 0.8 }))
      .sort((a, b) => (b.eligible - a.eligible) || ((a.kind === 'project') - (b.kind === 'project')) || (b.adjusted - a.adjusted) || (b.rel - a.rel));
  }

  /* ---------------------------------------------------------- job analysis */
  function analyzeJob(job, cvId) {
    const kb = MT.matching.buildKnowledge(cvId);
    const match = MT.matching.score(job, kb);
    const ev = rankEvidence(job, kb);
    const fit = [], strengthen = [];
    const top = ev.filter((e) => e.matched.length).slice(0, 2);
    top.forEach((e) => {
      const name = e.kind === 'project' ? 'Your project “' + e.item.title + '”' : 'Your ' + e.item.role + ' experience at ' + e.item.company;
      fit.push({ source: 'profile', text: name + ' covers ' + e.matched.slice(0, 3).map((k) => K().skillLabel(k).toLowerCase()).join(', ') + (e.metric ? ' — with a measurable result (' + e.metric + ').' : '.') });
    });
    const strongSkills = match.strong.filter((s) => s.kind === 'skill').map((s) => s.label.toLowerCase());
    if (strongSkills.length) fit.push({ source: 'offer', text: 'The offer asks for ' + strongSkills.slice(0, 4).join(', ') + ' — all visible in your CV.' });
    const pf = (kb.portfolioProjects || []).find((p) => (p.skills || []).some((k) => job.requirements.required.indexOf(k) !== -1));
    if (pf) fit.push({ source: 'profile', text: 'Your portfolio shows “' + pf.title + '”, which supports the ' + K().skillLabel((pf.skills || []).find((k) => job.requirements.required.indexOf(k) !== -1)).toLowerCase() + ' dimension.' });
    const pref = match.strong.filter((s) => s.kind === 'preference').map((s) => s.label);
    if (pref.length) fit.push({ source: 'profile', text: 'It fits your preferences: ' + pref.slice(0, 2).join(' · ') + '.' });

    match.missing.filter((m) => !m.minor).forEach((m) => strengthen.push({ source: 'offer', text: m.label + ' — ' + m.note + '.' }));
    match.partial.forEach((m) => strengthen.push({ source: 'suggestion', text: m.label + ' — ' + m.note + '.' }));
    if (!kb.portfolio.url && !kb.profile.portfolio) strengthen.push({ source: 'suggestion', text: 'No portfolio linked yet — adding one gives recruiters something to look at.' });
    const prevAnswers = previousAnswersFor(job.company);
    if (!prevAnswers.motivation_company) strengthen.push({ source: 'suggestion', text: 'Your personal motivation for ' + job.company + ' isn’t recorded yet — the chicken will ask you.' });

    return { kb, match, evidence: ev, fit: fit.slice(0, 5), strengthen: strengthen.slice(0, 6) };
  }

  /* ---------------------------------------------------------- smart questions */
  const B2C = ['fmcg', 'beauty', 'fashion', 'food-service', 'ecommerce', 'travel', 'culture', 'mobility', 'media'];
  function previousAnswersFor(company) {
    const all = MT.storage.get('answers', {});
    return all['company:' + U().norm(company)] || {};
  }
  /**
   * Decide what to ask: Do I already know it? → don't ask. Is it important for the letter? → ask.
   * Max 5 questions, usually 3.
   */
  function questions(job, analysis, existing) {
    existing = existing || {};
    const kb = analysis.kb;
    const known = Object.assign({}, previousAnswersFor(job.company), existing);
    const out = [];
    const ask = (q) => { if (!known[q.id] && out.length < 5) out.push(q); };
    const lang = job.language;
    const skipped = []; // transparency: what we chose NOT to ask, and why

    ask({
      id: 'motivation_company', category: 'Motivation', icon: '💛',
      text: 'Why are you interested in ' + job.company + ' specifically?',
      hint: 'One or two concrete reasons — a product, their approach, something you noticed. Your own words make the letter yours.',
      why: 'I can read the offer, but I can’t know what genuinely attracts you to ' + job.company + '.',
      chips: (job.companyAbout || '').split(/(?<=\.)\s+/).filter(Boolean).slice(0, 2).map((s) => s.replace(/\.$/, ''))
    });
    if (known.motivation_company) skipped.push('Motivation for ' + job.company + ' — you already told me in a previous application.');

    const indReq = job.industryRequired;
    if (indReq && analysis.match.components.industry < 1) {
      const lbl = K().industryLabel(indReq);
      const proj = kb.projects.find((p) => p.industry === indReq);
      ask({
        id: 'gap_industry', category: 'Experience', icon: '🧩',
        text: 'The offer values ' + lbl + ' experience. ' + (proj ? 'Besides your “' + proj.title + '” project, do' : 'Do') + ' you have any exposure that isn’t on your CV?',
        hint: 'A course, a job, a strong personal interest… If not, just say “no” — I’ll focus on transferable experience and won’t invent anything.',
        why: 'This is the main gap between your CV and the offer.'
      });
    }

    const isB2C = B2C.indexOf(job.industry) !== -1;
    if (isB2C) ask({
      id: 'personal_connection', category: 'Personal connection', icon: '✨',
      text: 'Is there a ' + job.company + ' product, campaign, project or value you genuinely like?',
      hint: 'Only if it’s true — “not really” is a perfectly good answer.',
      why: 'A real, personal detail is what makes a recruiter remember a letter.'
    });

    const titleT = U().tokens(job.title);
    const roleKnown = (kb.prefs.desiredPositions || []).some((p) => { const pt = U().tokens(p).filter((w) => w.length > 2); return pt.length && pt.filter((w) => titleT.indexOf(w) !== -1).length / pt.length >= 0.6; });
    if (!roleKnown) ask({
      id: 'role_attraction', category: 'Position', icon: '🎯',
      text: 'What attracts you most about the “' + job.title + '” role?',
      hint: 'A mission from the offer, a skill you want to grow, the team…',
      why: 'This role isn’t in your desired positions, so I don’t know why it appeals to you.',
      chips: (job.responsibilities || []).slice(0, 3)
    });
    else skipped.push('Why this role — it matches the positions in your preferences.');

    const ev = analysis.evidence.filter((e) => e.kind === 'experience' && e.matched.length);
    if (ev.length >= 2 && ev[0].rel - ev[1].rel < 1) ask({
      id: 'highlight_experience', category: 'Experience', icon: '⭐', type: 'choice',
      text: 'Which experience would you most like to highlight?',
      hint: 'Both are relevant to this offer — pick the one you’re most proud of.',
      why: 'Two of your experiences fit this offer equally well.',
      options: ev.slice(0, 3).map((e) => ({ value: e.ref, label: e.item.role + ' — ' + e.item.company }))
    });
    else if (ev.length) skipped.push('Which experience to highlight — ' + ev[0].item.company + ' is clearly the most relevant.');

    if (!kb.profile.careerGoals) ask({
      id: 'career_goal', category: 'Career goal', icon: '🧭',
      text: 'Why does this position make sense for your next career step?',
      hint: 'One sentence is enough.', why: 'Your profile has no career goal yet.'
    });
    else skipped.push('Career goal — taken from your profile.');
    if (!kb.profile.pitch) ask({
      id: 'differentiator', category: 'Differentiator', icon: '🔖',
      text: 'What would you like the recruiter to remember about you?',
      hint: 'A strength, a habit, a way of working.', why: 'Your profile has no personal pitch yet.'
    });
    else skipped.push('What makes you different — taken from your profile pitch.');

    return { list: out, skipped, lang };
  }

  function rememberAnswers(company, answers) {
    MT.storage.update('answers', {}, (all) => {
      const k = 'company:' + U().norm(company);
      const keep = {};
      ['motivation_company', 'personal_connection'].forEach((q) => { if (answers[q] && String(answers[q]).trim()) keep[q] = answers[q]; });
      all[k] = Object.assign({}, all[k] || {}, keep);
    });
  }

  /* ---------------------------------------------------------- interview prep */
  function interviewPrep(job, cvId) {
    const a = analyzeJob(job, cvId);
    const fr = job.language === 'fr';
    const general = fr
      ? ['Présentez-vous en deux minutes.', 'Pourquoi ce ' + (/altern/i.test(job.contractType) ? 'contrat en alternance' : 'stage') + ' maintenant ?', 'Quelle est votre plus grande réussite à ce jour ?', 'Parlez-nous d’une difficulté et de la façon dont vous l’avez gérée.']
      : ['Tell us about yourself in two minutes.', 'Why this ' + (/apprentice|altern/i.test(job.contractType) ? 'apprenticeship' : 'internship') + ' now?', 'What achievement are you proudest of?', 'Tell us about a difficulty and how you handled it.'];
    const company = fr
      ? ['Pourquoi ' + job.company + ' plutôt qu’une autre entreprise du secteur ?', 'Que savez-vous de ' + job.company + ' et de ses produits ?', 'Comment décririez-vous notre marque à un ami ?']
      : ['Why ' + job.company + ' rather than another company in this sector?', 'What do you know about ' + job.company + ' and its products?', 'How would you describe our brand to a friend?'];
    const role = (job.responsibilities || []).slice(0, 3).map((r) => fr ? 'Comment aborderiez-vous cette mission : « ' + r + ' » ?' : 'How would you approach this task: “' + r + '”?')
      .concat(job.requirements.required.slice(0, 2).map((k) => fr ? 'Racontez une situation où vous avez mobilisé : ' + K().skillLabel(k, 'fr') + '.' : 'Tell us about a time you used ' + K().skillLabel(k).toLowerCase() + '.'));
    const cv = a.evidence.slice(0, 3).map((e) => e.kind === 'project'
      ? (fr ? 'Présentez votre projet « ' + e.item.title + ' » : votre rôle, votre méthode, le résultat.' : 'Walk us through your project “' + e.item.title + '”: your role, method and result.')
      : (fr ? 'Chez ' + e.item.company + ', quel a été votre impact principal ?' : 'At ' + e.item.company + ', what was your main impact?'));
    a.match.missing.filter((m) => !m.minor).slice(0, 2).forEach((m) => cv.push(fr ? 'Le poste demande « ' + m.label + ' » : comment comptez-vous monter en compétence ?' : 'The role requires “' + m.label + '” — how would you get up to speed?'));
    const star = a.evidence.filter((e) => e.matched.length).slice(0, 3).map((e) => ({
      title: (e.item.company || e.item.title),
      situation: e.kind === 'project' ? 'Academic project: ' + e.item.title : e.item.role + ' at ' + e.item.company + (e.item.dates ? ' (' + e.item.dates + ')' : ''),
      task: e.metricBullet || (e.item.bullets || [])[0] || '',
      action: 'Describe what YOU personally did — the decisions and steps (not on your CV, fill it in).',
      result: e.metric || 'Add a result you can actually stand behind.'
    }));
    const talking = a.fit.map((f) => f.text);
    return { general, company, role, cv, star, talking, analysis: a };
  }

  function evaluatePractice(answer) {
    const words = U().tokens(answer).length;
    const tips = [];
    if (words < 60) tips.push('A bit short — aim for 1–2 minutes when spoken (≈120–250 words).');
    if (words > 320) tips.push('Quite long — try to land your point in under 2 minutes.');
    if (!/\d/.test(answer)) tips.push('Add a concrete figure or result if you have a real one.');
    if (!/(j['’]ai|je |I |I'|I’|my |mon |ma )/i.test(answer)) tips.push('Use “I” — recruiters want to hear your personal contribution.');
    if (!/(résultat|result|donc|so |ainsi|therefore|outcome|impact)/i.test(answer)) tips.push('Close with the outcome (the R of STAR).');
    return { words, tips, ok: !tips.length };
  }

  /* ---------------------------------------------------------- follow-up message */
  function followUpMessage(app, lang) {
    const p = MT.storage.get('profile', {});
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
    const date = app.applicationDate ? U().fmtLong(app.applicationDate) : '';
    if (lang === 'en') {
      return 'Subject: Following up — ' + app.position + '\n\n' + (app.contact && app.contact.name ? 'Dear ' + app.contact.name.replace(/\s*\(.*\)/, '') + ',' : 'Hello,') + '\n\n' +
        'I applied for the ' + app.position + ' position at ' + app.company + (date ? ' on ' + date : '') + ' and wanted to check whether my application is still under consideration.\n\n' +
        'I’m still very interested in the role and happy to share any additional information or work samples' + (p.portfolio ? ' (my portfolio: ' + p.portfolio + ')' : '') + '.\n\nThank you for your time,\n' + name;
    }
    return 'Objet : Suivi de ma candidature — ' + app.position + '\n\n' + (app.contact && app.contact.name ? 'Bonjour ' + app.contact.name.replace(/\s*\(.*\)/, '') + ',' : 'Bonjour,') + '\n\n' +
      'Je me permets de revenir vers vous concernant ma candidature au poste de ' + app.position + ' chez ' + app.company + (date ? ', envoyée le ' + date : '') + '.\n\n' +
      'Le poste m’intéresse toujours beaucoup et je reste disponible pour vous transmettre tout complément' + (p.portfolio ? ' (mon portfolio : ' + p.portfolio + ')' : '') + '.\n\nBien cordialement,\n' + name;
  }

  MT.ai = { provider, MockProvider, ExternalProvider, analyzeJob, rankEvidence, questions, rememberAnswers, previousAnswersFor, interviewPrep, evaluatePractice, followUpMessage, metricClause, METRIC_RE };
})(window.MT = window.MT || {});
