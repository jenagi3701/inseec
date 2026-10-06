/* ==========================================================================
   MARKETRACK — matching.js
   1) Profile Knowledge Base: one structured view of everything the user has
      told us (profile + selected CV + portfolio), with the *evidence* behind
      each skill. Nothing is inferred beyond what the text contains.
   2) Transparent relevance score: weighted, explainable components.
      The score is a recommendation, never a hiring prediction.
   ========================================================================== */
(function (MT) {
  'use strict';
  const K = () => MT.knowledge;
  const U = () => MT.ui;

  /* ================================================================ Knowledge base */
  function buildKnowledge(cvId) {
    const profile = MT.storage.get('profile', {});
    const cvs = MT.storage.get('cvs', []);
    const cv = cvs.find((c) => c.id === cvId) || cvs.find((c) => c.isDefault) || cvs[0] || null;
    const portfolio = profile.portfolioData || {};
    const pd = (cv && cv.parsedData) || { education: [], experience: [], projects: [], skills: [], tools: [], languages: [], certifications: [], achievements: [], industries: [] };

    const skillEvidence = {}; // key -> [{type, ref, label, text}]
    function addEvidence(text, ev) {
      K().detectSkills(text).forEach((k) => {
        (skillEvidence[k] = skillEvidence[k] || []).push(Object.assign({ text: text }, ev));
      });
    }
    (pd.skills || []).forEach((s) => addEvidence(s, { type: 'cv-skill', label: 'CV skills' }));
    (pd.experience || []).forEach((e) => {
      addEvidence(e.role, { type: 'experience', ref: e.id, label: e.company });
      (e.bullets || []).forEach((b) => addEvidence(b, { type: 'experience', ref: e.id, label: e.company }));
    });
    (pd.projects || []).forEach((p) => (p.bullets || []).concat([p.title]).forEach((b) => addEvidence(b, { type: 'project', ref: p.id, label: p.title })));
    (portfolio.projects || []).forEach((p, i) => {
      addEvidence(p.title + ' ' + p.summary, { type: 'portfolio', ref: 'pf' + i, label: p.title });
      (p.skills || []).forEach((k) => { (skillEvidence[k] = skillEvidence[k] || []).push({ type: 'portfolio', ref: 'pf' + i, label: p.title, text: p.summary }); });
    });

    const tools = new Set((pd.tools || []).map((t) => t.toLowerCase()));
    K().detectTools((pd.experience || []).map((e) => (e.bullets || []).join(' ')).join(' ')).forEach((t) => tools.add(t.toLowerCase()));

    const expIndustries = new Set((pd.experience || []).map((e) => e.industry).filter(Boolean).concat(pd.industries || []));
    const projIndustries = new Set((pd.projects || []).map((p) => p.industry).filter(Boolean));
    (pd.projects || []).forEach((p) => K().detectIndustries(p.title + ' ' + (p.bullets || []).join(' ')).forEach((i) => projIndustries.add(i)));

    const eduLevel = Math.max(0, ...(pd.education || []).map((e) => e.level || (/(msc|master|bac\s*\+\s*5|grande ecole|grande école)/i.test(e.degree + ' ' + e.school) ? 5 : /(licence|bachelor|bac\s*\+\s*3)/i.test(e.degree) ? 3 : 2)));

    return {
      profile, cv, cvs, portfolio, parsed: pd,
      skills: skillEvidence,
      tools,
      languages: (pd.languages || []).map((l) => l.language),
      industries: { experience: expIndustries, projects: projIndustries },
      experiences: pd.experience || [],
      projects: pd.projects || [],
      portfolioProjects: portfolio.projects || [],
      eduLevel,
      prefs: profile.preferences || {}
    };
  }

  /* ================================================================ Match score */
  const WEIGHTS = { skills: 36, position: 14, contract: 8, location: 8, experience: 10, tools: 8, industry: 8, education: 3, keywords: 5 };

  function skillStatus(kb, key) {
    if (kb.skills[key] && kb.skills[key].length) return 'full';
    const rel = (K().SKILLS[key] || {}).related || [];
    if (rel.some((r) => kb.skills[r] && kb.skills[r].length)) return 'partial';
    return 'none';
  }

  function score(job, kb) {
    kb = kb || buildKnowledge();
    const req = job.requirements || { required: [], preferred: [], tools: [], languages: [] };
    const strong = [], partial = [], missing = [];
    const comp = {};

    // --- skills
    let got = 0, max = 0;
    const skillDetail = [];
    (req.required || []).forEach((k) => {
      const st = skillStatus(kb, k); max += 2; got += st === 'full' ? 2 : st === 'partial' ? 0.6 : 0;
      skillDetail.push({ key: k, required: true, status: st });
    });
    (req.preferred || []).forEach((k) => {
      const st = skillStatus(kb, k); max += 1; got += st === 'full' ? 1 : st === 'partial' ? 0.3 : 0;
      skillDetail.push({ key: k, required: false, status: st });
    });
    comp.skills = max ? got / max : 0.5;
    skillDetail.forEach((s) => {
      const label = K().skillLabel(s.key);
      if (s.status === 'full') strong.push({ label, kind: 'skill', evidence: (kb.skills[s.key] || [])[0] });
      else if (s.status === 'partial') {
        const rel = ((K().SKILLS[s.key] || {}).related || []).find((r) => kb.skills[r]);
        partial.push({ label, kind: 'skill', note: 'related experience in ' + K().skillLabel(rel).toLowerCase() });
      } else if (s.required) missing.push({ label, kind: 'skill', note: 'required in the offer — not found in your CV' });
      else missing.push({ label, kind: 'skill', note: 'nice-to-have — not found in your CV', minor: true });
    });

    // --- tools
    const jt = req.tools || [];
    const haveTools = jt.filter((t) => kb.tools.has(t.toLowerCase()));
    comp.tools = jt.length ? haveTools.length / jt.length : 1;
    if (haveTools.length) strong.push({ label: haveTools.join(', '), kind: 'tools' });
    const lackTools = jt.filter((t) => !kb.tools.has(t.toLowerCase()));
    if (lackTools.length) partial.push({ label: lackTools.join(', '), kind: 'tools', note: 'tools mentioned in the offer, not on your CV' });

    // --- position / field
    const pf = (kb.prefs.fields || []);
    const fieldHits = (job.fields || []).filter((f) => pf.indexOf(f) !== -1);
    const titleT = U().tokens(job.title);
    const posHit = (kb.prefs.desiredPositions || []).some((p) => {
      const pt = U().tokens(p).filter((w) => w.length > 2);
      return pt.length && pt.filter((w) => titleT.indexOf(w) !== -1).length / pt.length >= 0.6;
    });
    comp.position = Math.min(1, (fieldHits.length ? 0.35 + 0.4 * fieldHits.length / job.fields.length : 0.1) + (posHit ? 0.3 : 0));
    if (posHit) strong.push({ label: 'Matches a position you are looking for', kind: 'preference' });
    else if (fieldHits.length) strong.push({ label: 'Field: ' + fieldHits.join(', '), kind: 'preference' });

    // --- contract + duration
    const fam = K().CONTRACT_FAMILY[U().norm(job.contractType)];
    const wantFam = (kb.prefs.contracts || []).map((c) => K().CONTRACT_FAMILY[U().norm(c)]);
    const cOk = wantFam.indexOf(fam) !== -1;
    const durs = kb.prefs.durations || [];
    const dOk = !durs.length || durs.indexOf(job.duration) !== -1;
    comp.contract = (cOk ? 0.7 : 0) + (dOk ? 0.3 : 0.1);
    if (cOk) strong.push({ label: job.contractType + ' — ' + job.duration + ' months', kind: 'preference' });
    else missing.push({ label: 'Contract type (' + job.contractType + ')', kind: 'preference', note: 'not in your preferred contracts' });
    if (cOk && !dOk) partial.push({ label: 'Duration ' + job.duration + ' months', kind: 'preference', note: 'differs from your preferred duration' });

    // --- location
    const locs = (kb.prefs.locations || []).map((l) => U().norm(l));
    const city = U().norm(job.location);
    let lScore = 0;
    if (locs.indexOf(city) !== -1) lScore = 1;
    else if (job.workMode === 'remote' && locs.indexOf('remote') !== -1) lScore = 1;
    else if (job.workMode === 'remote') lScore = 0.6;
    else if (locs.indexOf('france') !== -1) lScore = 0.7;
    comp.location = lScore;
    if (lScore >= 1) strong.push({ label: (job.workMode === 'remote' ? 'Remote' : job.location) + ' fits your locations', kind: 'preference' });
    else partial.push({ label: 'Location: ' + job.location, kind: 'preference', note: 'outside your preferred locations' });

    // --- experience
    const jobSkills = (req.required || []).concat(req.preferred || []);
    const relevantExp = kb.experiences.filter((e) => {
      const ks = K().detectSkills(e.role + ' ' + (e.bullets || []).join(' '));
      return ks.filter((k) => jobSkills.indexOf(k) !== -1).length >= 2;
    });
    const anyExp = kb.experiences.some((e) => K().detectSkills(e.role + ' ' + (e.bullets || []).join(' ')).some((k) => jobSkills.indexOf(k) !== -1));
    comp.experience = relevantExp.length >= 2 ? 1 : relevantExp.length === 1 ? 0.75 : anyExp ? 0.45 : 0.2;

    // --- education
    comp.education = kb.eduLevel >= 4 ? 1 : kb.eduLevel >= 3 ? 0.8 : kb.cv ? 0.5 : 0.3;

    // --- industry
    let iScore = 0.25;
    const ind = job.industry;
    if (kb.industries.experience.has(ind)) iScore = 1;
    else if (kb.industries.projects.has(ind)) iScore = 0.6;
    else if ((kb.prefs.industries || []).indexOf(ind) !== -1) iScore = 0.5;
    comp.industry = iScore;
    const indLabel = K().industryLabel(ind);
    if (iScore === 1) strong.push({ label: indLabel + ' experience', kind: 'industry' });
    if (job.industryRequired && iScore < 1) {
      if (iScore === 0.6) partial.push({ label: indLabel + ' experience', kind: 'industry', note: 'only through an academic project — not professional experience' });
      else missing.push({ label: indLabel + ' experience', kind: 'industry', note: 'valued by the offer — not clearly demonstrated' });
    }

    // --- keywords
    const hay = job.title + ' ' + job.description + ' ' + (job.responsibilities || []).join(' ');
    const kwHits = (kb.prefs.keywords || []).filter((k) => K().containsAlias(hay, k));
    comp.keywords = Math.min(1, kwHits.length / 3);

    // --- languages (penalty only)
    const lackLang = (req.languages || []).filter((l) => kb.languages.indexOf(l) === -1);
    if (lackLang.length) missing.push({ label: lackLang.join(', '), kind: 'language', note: 'language requested by the offer' });

    let total = 0;
    Object.keys(WEIGHTS).forEach((k) => { total += WEIGHTS[k] * (comp[k] || 0); });
    if (lackLang.length) total -= 6 * lackLang.length;
    if (!kb.cv) total = Math.min(total, 60); // without a CV the score is mostly preferences
    total = Math.max(5, Math.min(99, Math.round(total)));

    return {
      score: total, components: comp, weights: WEIGHTS, strong, partial, missing,
      skillDetail, relevantExperiences: relevantExp.map((e) => e.id), keywordHits: kwHits,
      label: total >= 85 ? 'Strong match' : total >= 70 ? 'Good match' : total >= 50 ? 'Partial match' : 'Exploratory match',
      noCv: !kb.cv
    };
  }

  /* cache scores per render pass (profile changes invalidate via storage events) */
  let cache = null;
  MT.storage.on('*', (key) => { if (['profile', 'cvs'].indexOf(key) !== -1) cache = null; });
  function scoreCached(job) {
    if (!cache) cache = { kb: buildKnowledge(), map: {} };
    if (!cache.map[job.id]) cache.map[job.id] = score(job, cache.kb);
    return cache.map[job.id];
  }

  MT.matching = { buildKnowledge, score, scoreCached, skillStatus, WEIGHTS, invalidate: () => { cache = null; } };
})(window.MT = window.MT || {});
