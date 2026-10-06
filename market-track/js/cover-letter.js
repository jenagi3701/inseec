/* ==========================================================================
   MARKETRACK — cover-letter.js
   Cover-letter engine (local mock AI, deterministic).

   Separation of concerns, as required:
     CV        = what I have done      → used as *evidence*, never pasted
     Portfolio = what I can show       → one pointer at most
     Letter    = why this company + why this role + why me

   1. PLAN   (facts, language-neutral): which experience(s), which offer need,
              which user answers. Built in the priority order
              job need → user evidence → motivation → company link → career fit.
   2. RENDER (language + tone): picks phrasing templates, avoiding the ones
              used in previous letters (anti-repetition engine).
   3. CHECK  : similarity vs previous letters / CV / portfolio / profile,
              invented-number check, buzzwords, structure → scores.
              Too repetitive → automatically regenerated with another seed.
   Stylistic changes re-render the SAME plan: facts never change.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const K = () => MT.knowledge;

  /* --------------------------------------------------------- vocabulary */
  const SKILL_PHRASE = {
    'social-media': ['les réseaux sociaux de la marque', 'the brand’s social media'],
    'community': ['l’animation de la communauté', 'community management'],
    'content-creation': ['la création de contenus', 'content creation'],
    'copywriting': ['la rédaction', 'writing'],
    'seo': ['le référencement naturel', 'SEO'],
    'sea': ['le suivi des campagnes Google Ads', 'paid search campaigns'],
    'paid-media': ['les campagnes payantes', 'paid campaigns'],
    'crm': ['la newsletter et le CRM', 'email and CRM'],
    'product-launch': ['le lancement d’un produit', 'a product launch'],
    'product-marketing': ['le marketing produit', 'product marketing'],
    'brand': ['le positionnement de marque', 'brand positioning'],
    'market-research': ['l’étude du marché et des consommateurs', 'market and consumer research'],
    'data-analysis': ['le suivi des indicateurs', 'tracking performance metrics'],
    'web-analytics': ['l’analyse du trafic web', 'web analytics'],
    'communication': ['la communication', 'communication'],
    'events': ['l’organisation d’événements', 'event organisation'],
    'influence': ['les collaborations avec des créateurs', 'creator partnerships'],
    'ecommerce': ['le site e-commerce', 'the e-commerce site'],
    'growth': ['les tests d’acquisition', 'acquisition experiments'],
    'project-management': ['la coordination de projet', 'project coordination'],
    'graphic-design': ['la création de visuels', 'creating visuals'],
    'video': ['le montage vidéo', 'video editing'],
    'trade-marketing': ['le trade marketing', 'trade marketing']
  };
  const INDUSTRY_FR = { fmcg: 'la grande consommation', beauty: 'la cosmétique', fashion: 'la mode', media: 'les médias', tech: 'la tech', ecommerce: 'l’e-commerce', mobility: 'la mobilité', 'food-service': 'la restauration', culture: 'la culture', agency: 'l’agence', travel: 'le voyage' };
  const INDUSTRY_EN = { fmcg: 'FMCG', beauty: 'beauty', fashion: 'fashion', media: 'media', tech: 'tech', ecommerce: 'e-commerce', mobility: 'mobility', 'food-service': 'food service', culture: 'culture', agency: 'agency work', travel: 'travel' };
  const FIELD_PHRASE = { Marketing: ['le marketing', 'marketing'], 'Digital Marketing': ['le marketing digital', 'digital marketing'], Communication: ['la communication', 'communication'], 'Social Media': ['les réseaux sociaux', 'social media'], Content: ['le contenu', 'content'], Brand: ['la marque', 'brand'], Product: ['le marketing produit', 'product marketing'], Growth: ['la croissance', 'growth'], CRM: ['le CRM', 'CRM'], 'SEO / SEA': ['l’acquisition', 'acquisition'], 'E-commerce': ['l’e-commerce', 'e-commerce'], 'Marketing Project Management': ['la gestion de projets marketing', 'marketing project management'] };

  const BUZZWORDS = ['dynamique', 'motivé', 'motivée', 'passionné', 'passionnée', 'rigoureux', 'rigoureuse', 'force de proposition', 'polyvalent', 'polyvalente', 'esprit d’équipe', 'synergie', 'dynamic', 'passionate', 'team player', 'synergy', 'go-getter', 'results-driven', 'hard-working', 'highly motivated', 'detail-oriented', 'self-starter'];
  const BANNED_OPENINGS = ['je suis actuellement', 'votre offre a particulierement retenu mon attention', 'i am currently', 'i am writing to apply'];

  // Tiny FR→EN dictionary for metric clauses copied from a French CV.
  const METRIC_FR_EN = [
    [/taux d[’']ouverture moyen de/gi, 'an average open rate of'], [/taux d[’']ouverture/gi, 'open rate'], [/d[’']abonnés/gi, 'followers'], [/abonnés/gi, 'followers'],
    [/trafic organique/gi, 'organic traffic'], [/enquête consommateurs/gi, 'consumer survey'], [/réponses/gi, 'responses'], [/créateurs/gi, 'creators'],
    [/seeding auprès de/gi, 'seeding with'], [/en (\d+) mois/gi, 'in $1 months'], [/publications par semaine/gi, 'posts per week'], [/bénévoles/gi, 'volunteers'],
    [/articles de blog/gi, 'blog articles'], [/(\d)\s+%/g, '$1%'], [/croissance de la communauté/gi, 'community growth'], [/coordination de/gi, 'coordinating']
  ];
  const FR_STOP = /\b(de|des|du|le|la|les|d[’']|l[’']|auprès|moyen|une|un|et)\b/i;
  function metricIn(lang, clause) {
    if (!clause) return '';
    const isFr = detectLang(clause) === 'fr' || /[éèàùç’]/.test(clause);
    if (lang === 'fr') return isFr ? clause.replace(/^./, (c) => c.toLowerCase()) : clause;
    if (!isFr) return clause;
    let t = clause;
    METRIC_FR_EN.forEach(([re, to]) => { t = t.replace(re, to); });
    if (FR_STOP.test(t)) return ''; // can't translate faithfully → leave the figure out rather than garble it
    return t.replace(/^./, (c) => c.toLowerCase());
  }

  function detectLang(text) {
    const t = ' ' + U().norm(text) + ' ';
    const fr = (t.match(/ (le|la|les|des|une|et|est|pour|avec|dans|vous|nous|je|du|au|sur|que|qui) /g) || []).length;
    const en = (t.match(/ (the|and|is|for|with|in|you|we|to|of|on|that|which|my|your|our) /g) || []).length;
    return fr >= en ? 'fr' : 'en';
  }

  /* --------------------------------------------------------- grammar helpers */
  const vowel = (s) => /^[aeiouyhàâéèêëîïôûüAEIOUYHÀÂÉÈÊËÎÏÔÛÜ]/.test(String(s || '').trim());
  const de = (s) => (vowel(s) ? 'd’' : 'de ') + s;
  const deArt = (x) => (/^le /.test(x) ? 'du ' + x.slice(3) : /^les /.test(x) ? 'des ' + x.slice(4) : /^la |^l’/.test(x) ? 'de ' + x : de(x));
  const lc = (s) => String(s || '').replace(/^./, (c) => c.toLowerCase());
  const trimEnd = (s) => String(s || '').trim().replace(/[.!…\s]+$/, '');
  const isNegative = (a) => /^(non|no|nope|pas vraiment|not really|rien|nothing|aucun|aucune|none|pas encore|not yet|je ne sais pas|i don.t know)\b/i.test(String(a || '').trim());
  function answerForm(a) {
    const t = U().norm(a);
    if (/^(parce que|parce qu|car |because|since|comme )/.test(t)) return 'because';
    if (/^(le|la|les|l |leur|leurs|son|sa|ses|un|une|des|votre|vos|ce|cette|ces|the|their|its|his|her|a|an|your|this|that|these|how|the way|l)\b/.test(t) || /^l['’]/.test(String(a).trim())) return 'noun';
    return 'clause';
  }
  function cleanAnswer(a) { return lc(trimEnd(String(a || '').replace(/\s+/g, ' '))); }
  function stripBecause(a) { return cleanAnswer(a).replace(/^(parce que|parce qu['’]|car|because|since)\s*/i, ''); }
  function contractNoun(job, lang) {
    const alt = /altern|apprentice/i.test(job.contractType);
    return lang === 'fr' ? (alt ? 'cette alternance' : 'ce stage') : (alt ? 'this apprenticeship' : 'this internship');
  }
  function skillPhrase(k, lang) { return (SKILL_PHRASE[k] || [K().skillLabel(k, 'fr'), K().skillLabel(k)])[lang === 'fr' ? 0 : 1]; }
  function joinAnd(list, lang) {
    if (list.length <= 1) return list[0] || '';
    return list.slice(0, -1).join(', ') + (lang === 'fr' ? ' et ' : ' and ') + list[list.length - 1];
  }
  function respPhrase(r) {
    return lc(trimEnd(String(r).replace(/\s*\([^)]*\)/g, '')));
  }

  /* --------------------------------------------------------- history */
  function history(excludeAppId) {
    return MT.storage.get('coverLetters', []).filter((l) => l.applicationId !== excludeAppId).sort((a, b) => b.createdAt - a.createdAt);
  }

  /* ========================================================= 1. PLAN */
  function buildPlan(ctx) {
    const { job, cvId, answers } = ctx;
    const analysis = MT.ai.analyzeJob(job, cvId);
    const kb = analysis.kb;
    const hist = history(ctx.applicationId);
    const usage = {};
    hist.slice(0, 6).forEach((l) => { if (l.plan && l.plan.evidence && l.plan.evidence[0]) usage[l.plan.evidence[0].ref] = (usage[l.plan.evidence[0].ref] || 0) + 1; });
    let ev = MT.ai.rankEvidence(job, kb, usage);
    if (answers.highlight_experience) {
      const forced = ev.find((e) => e.ref === answers.highlight_experience);
      if (forced) ev = [forced].concat(ev.filter((e) => e !== forced));
    }
    const chosen = ev.filter((e) => e.rel > 0).slice(0, 2);
    if (!chosen.length && ev.length) chosen.push(ev[0]);
    if (chosen[1] && chosen[1].rel < 2) chosen.pop();

    // job need: the responsibility that best matches the chosen evidence
    const evSkills = chosen.reduce((a, e) => a.concat(e.matched), []);
    const resps = (job.responsibilities || []).map((r) => ({ r, s: K().detectSkills(r).filter((k) => evSkills.indexOf(k) !== -1).length }))
      .sort((a, b) => b.s - a.s);
    const need = resps[0] ? resps[0].r : '';
    const need2 = resps.find((x) => x.r !== need && x.s > 0) ? resps.find((x) => x.r !== need && x.s > 0).r : (resps[1] ? resps[1].r : '');

    // portfolio pointer: only a project that supports a required skill
    const pfProj = (kb.portfolioProjects || []).find((p) => (p.skills || []).some((k) => job.requirements.required.indexOf(k) !== -1));
    const portfolioUrl = ctx.includePortfolio === false ? '' : (ctx.portfolioUrl || kb.profile.portfolio || (kb.portfolio && kb.portfolio.url) || '');

    const lastGoalUse = hist.slice(0, 2).some((l) => l.plan && l.plan.usedGoal);
    const edu = (kb.parsed.education || [])[0] || null;

    return {
      jobId: job.id, company: job.company, title: job.title, contractType: job.contractType, duration: job.duration,
      jobLang: job.language, industry: job.industry, industryRequired: job.industryRequired,
      need, need2, requiredSkills: job.requirements.required.slice(0, 3),
      evidence: chosen.map((e) => ({
        ref: e.ref, kind: e.kind, company: e.item.company || '', role: e.item.role || '', title: e.item.title || '',
        skills: (e.matched.length ? e.matched : e.skills).slice(0, 2), metric: e.metric, industry: e.item.industry || ''
      })),
      answers: Object.assign({}, answers),
      portfolio: portfolioUrl ? { url: portfolioUrl, project: pfProj ? pfProj.title.split(' — ')[0].replace(/[«»]/g, '').replace(/\s+/g, ' ').trim() : '' } : null,
      education: edu ? { degree: edu.degree, school: edu.school } : null,
      goal: kb.profile.careerGoals || '', pitch: kb.profile.pitch || '', usedGoal: !lastGoalUse && !!kb.profile.careerGoals,
      fields: job.fields.slice(0, 2),
      contact: ctx.contactName || '',
      sender: { name: [kb.profile.firstName, kb.profile.lastName].filter(Boolean).join(' '), email: kb.profile.email || '', phone: kb.profile.phone || '', city: kb.profile.location || '' },
      matchScore: analysis.match.score
    };
  }

  /* ========================================================= 2. RENDER */
  // Each pool entry: { id, tones?: [...], when?(c) , fr(c), en(c) }. Same ids across languages
  // so translating keeps the structure; tone filters the pool; history avoids reuse.
  const OPENINGS = [
    { id: 'o-need', when: (c) => c.needQuote, fr: (c) => '« ' + c.needQuote + ' » : c’est la ligne de votre offre ' + de(c.p.title) + ' qui m’a donné envie de vous écrire.', en: (c) => '“' + c.needQuote + '” — that line in your ' + c.p.title + ' offer is what made me want to write to you.' },
    { id: 'o-motiv', when: (c) => c.motiv, fr: (c) => c.motivFr(true), en: (c) => c.motivEn(true) },
    { id: 'o-evidence', when: (c) => c.ev1, fr: (c) => 'Chez ' + c.ev1.company + ', j’ai travaillé sur ' + c.ev1sk + '. C’est précisément ce que je retrouve dans votre offre ' + de(c.p.title) + ' chez ' + c.p.company + '.', en: (c) => 'At ' + c.ev1.company + ', I worked on ' + c.ev1sk + ' — which is exactly what I see in your ' + c.p.title + ' offer at ' + c.p.company + '.' },
    { id: 'o-connection', when: (c) => c.conn, fr: (c) => 'Mon premier lien avec ' + c.p.company + ' : ' + c.conn + '. Votre offre ' + de(c.p.title) + ' m’a donné l’occasion de le transformer en candidature.', en: (c) => 'My first connection with ' + c.p.company + ': ' + c.conn + '. Your ' + c.p.title + ' offer gave me a reason to turn it into an application.' },
    { id: 'o-question', tones: ['creative'], when: (c) => c.p.requiredSkills.length, fr: (c) => 'Que se passe-t-il quand on confie ' + skillPhrase(c.p.requiredSkills[0], 'fr') + ' à quelqu’un qui aime autant créer que mesurer ? C’est un peu la question que je vous propose d’explorer avec ' + contractNoun(c.job, 'fr') + ' ' + de(c.p.title) + '.', en: (c) => 'What happens when you hand ' + skillPhrase(c.p.requiredSkills[0], 'en') + ' to someone who likes creating as much as measuring? That’s the question I’d like to explore with you through ' + contractNoun(c.job, 'en') + ' as ' + c.p.title + '.' },
    { id: 'o-direct', tones: ['professional', 'short', 'confident', 'natural', 'company', 'marketing'], fr: (c) => 'Je vous propose ma candidature pour ' + contractNoun(c.job, 'fr') + ' ' + de(c.p.title) + ' chez ' + c.p.company + ' (' + c.p.duration + ' mois).', en: (c) => 'I would like to apply for ' + contractNoun(c.job, 'en') + ' as ' + c.p.title + ' at ' + c.p.company + ' (' + c.p.duration + ' months).' }
  ];
  const CONNECTIONS = [
    { id: 'c-frame', when: (c) => c.p.education, fr: (c) => 'Mon ' + c.p.education.degree + ' m’a donné le cadre ; mes expériences en ' + c.fieldFr + ' m’ont donné la pratique.', en: (c) => 'My ' + c.p.education.degree + ' gave me the framework; my experience in ' + c.fieldEn + ' gave me the practice.' },
    { id: 'c-path', fr: (c) => 'Mon parcours s’est construit autour ' + deArt(c.fieldFrArt) + ', avec un fil rouge : relier les idées créatives à des résultats concrets.', en: (c) => 'My path has been built around ' + c.fieldEn + ', with one common thread: connecting creative ideas to concrete results.' },
    { id: 'c-pitch', when: (c) => c.p.pitch && c.p.pitch.length < 140 && detectLang(c.p.pitch) === c.lang, fr: (c) => 'Ce que j’apporte tient en une idée : ' + lc(trimEnd(c.p.pitch)) + '.', en: (c) => 'What I bring comes down to one idea: ' + lc(trimEnd(c.p.pitch)) + '.' }
  ];
  const EVIDENCE = [
    { id: 'e-chez', fr: (c, e, s, m) => 'Chez ' + e.company + ', en tant que ' + lc(e.role.replace(/\s*\(.*\)/, '')) + ', j’ai travaillé sur ' + s + '.' + (m ? ' ' + c.pick(['Le résultat le plus parlant : ', 'Un chiffre que je garde en tête : ', 'Concrètement : '], e.ref) + m + '.' : ''), en: (c, e, s, m) => 'At ' + e.company + ', as ' + lc(c.roleEn(e.role)) + ', I worked on ' + s + '.' + (m ? ' ' + c.pick(['The most telling result: ', 'One figure I keep in mind: ', 'In concrete terms: '], e.ref) + m + '.' : '') },
    { id: 'e-story', fr: (c, e, s, m) => 'Mon expérience chez ' + e.company + ' en est le meilleur exemple : ' + s + ' y faisaient partie de mon quotidien' + (m ? ', avec ' + m : '') + '.', en: (c, e, s, m) => 'My time at ' + e.company + ' is the best example: ' + s + ' were part of my day-to-day' + (m ? ', with ' + m : '') + '.' },
    { id: 'e-learned', fr: (c, e, s, m) => 'C’est chez ' + e.company + ' que j’ai appris ce que demandent concrètement ' + s + (m ? ' — et ce que cela peut donner : ' + m : '') + '.', en: (c, e, s, m) => 'It was at ' + e.company + ' that I learned what ' + s + ' really involve' + (m ? ' — and what they can deliver: ' + m : '') + '.' }
  ];
  const PROJECT_EV = {
    fr: (c, e, s, m) => 'Dans le cadre d’un projet académique (' + e.title.replace(/\s*\(.*\)/, '') + '), j’ai également travaillé sur ' + s + (m ? ', avec un point concret : ' + m : '') + '.',
    en: (c, e, s, m) => 'In an academic project (' + e.title.replace(/\s*\(.*\)/, '') + '), I also worked on ' + s + (m ? ', with one concrete element: ' + m : '') + '.'
  };
  const LINKS = [
    { id: 'l-direct', fr: (c) => 'C’est une expérience que je pourrais mobiliser directement pour ' + c.needInf + '.', en: (c) => 'It is experience I could put to use straight away to ' + c.needInfEn + '.' },
    { id: 'l-bridge', fr: (c) => 'J’y vois un lien direct avec votre besoin : ' + c.needInf + '.', en: (c) => 'I see a direct link with what you need: ' + c.needInfEn + '.' },
    { id: 'l-confident', tones: ['confident', 'marketing'], fr: (c) => 'Je sais donc ce que demande votre mission — ' + c.needInf + ' — et je peux m’y engager dès le premier jour.', en: (c) => 'I know what your brief requires — to ' + c.needInfEn + ' — and I can contribute from day one.' }
  ];
  const MOTIVATIONS = [
    { id: 'm-step', fr: (c) => c.contractCap + ' ' + de(c.p.duration + ' mois') + ' arrive au bon moment : ' + c.goalFr + '.', en: (c) => 'This ' + c.p.duration + '-month ' + (c.alt ? 'apprenticeship' : 'internship') + ' comes at the right time: ' + c.goalEn + '.' },
    { id: 'm-why', fr: (c) => 'Si je vise ce poste, c’est parce que ' + c.goalFrClause + '.', en: (c) => 'I am aiming for this role because ' + c.goalEnClause + '.' },
    { id: 'm-next', fr: (c) => 'Pour la suite, ' + c.goalFr + ' — et ' + contractNoun(c.job, 'fr') + ' chez ' + c.p.company + ' en serait une étape très cohérente.', en: (c) => 'Looking ahead, ' + c.goalEn + ' — and ' + contractNoun(c.job, 'en') + ' at ' + c.p.company + ' would be a very coherent step.' }
  ];
  const CLOSINGS = [
    { id: 'cl-talk', fr: (c) => 'J’aimerais beaucoup vous expliquer de vive voix comment je compte contribuer ' + c.closeFocusFr + '.', en: (c) => 'I would love to explain in person how I plan to contribute to ' + c.closeFocusEn + '.' },
    { id: 'cl-call', tones: ['confident', 'natural', 'marketing', 'creative', 'company', 'short'], fr: (c) => 'Avec plaisir pour en parler lors d’un échange, quand cela vous convient.', en: (c) => 'Let’s talk — I’m available whenever suits you.' },
    { id: 'cl-formal', tones: ['professional', 'natural', 'company', 'short'], fr: (c) => 'Je me tiens à votre disposition pour un entretien et vous remercie pour l’attention portée à ma candidature.', en: (c) => 'I am available for an interview at your convenience and thank you for considering my application.' }
  ];

  function render(plan, opts) {
    const lang = opts.lang || plan.jobLang || 'fr';
    const tone = opts.tone || 'natural';
    const seed = opts.seed || 1;
    const rnd = U().seeded(U().hash(plan.jobId + '|' + seed + '|' + tone));
    const used = opts.avoid || {};
    const job = opts.job || MT.jobsService.get(plan.jobId) || { contractType: plan.contractType, language: plan.jobLang };
    const fr = lang === 'fr';
    const choices = {};

    // answers usable in this language
    const ans = {}; const droppedAnswers = [];
    Object.keys(plan.answers || {}).forEach((k) => {
      const v = plan.answers[k];
      if (!v || k === 'highlight_experience') return;
      if (isNegative(v)) { ans[k] = { negative: true }; return; }
      if (detectLang(v) !== lang && U().tokens(v).length > 3) { droppedAnswers.push(k); return; }
      ans[k] = { text: v, form: answerForm(v) };
    });

    const c = { p: plan, job, lang };
    c.alt = /altern|apprentice/i.test(plan.contractType);
    c.contractCap = U().cap(contractNoun(job, 'fr'));
    c.pick = (arr, salt) => arr[U().hash(salt + seed) % arr.length];
    c.roleEn = (r) => (detectLang(r) === 'fr' ? r.replace(/Stagiaire/i, 'Intern').replace(/Assistante?/i, 'Assistant').replace(/Bénévole/i, 'Volunteer').replace(/\(temps partiel\)/i, '(part-time)').replace(/Communication/i, 'Communications').replace(/Marketing Digital/i, 'Digital Marketing') : r).replace(/\s*\(.*\)/, '');
    const sameLangOffer = plan.jobLang === lang;
    c.needQuote = sameLangOffer && plan.need ? trimEnd(plan.need.replace(/\s*\([^)]*\)/g, '')) : '';
    c.needInf = sameLangOffer && plan.need ? respPhrase(plan.need) : 'travailler sur ' + skillPhrase(plan.requiredSkills[0], 'fr');
    c.needInfEn = sameLangOffer && plan.need ? respPhrase(plan.need) : 'work on ' + skillPhrase(plan.requiredSkills[0], 'en');
    if (fr && sameLangOffer && plan.need) c.needInf = respPhrase(plan.need);
    const f = (plan.fields || []).map((x) => FIELD_PHRASE[x] || [x.toLowerCase(), x.toLowerCase()]);
    c.fieldFr = f.length ? joinAnd(f.map((x) => x[0]), 'fr') : 'le marketing';
    c.fieldEn = f.length ? joinAnd(f.map((x) => x[1]), 'en') : 'marketing';
    if (c.fieldFr.indexOf(' et ') !== -1) c.fieldFr = f[0][0];
    c.fieldFrArt = f.length ? f[0][0] : 'le marketing';
    c.fieldFr = c.fieldFr.replace(/^(le |la |les |l’)/, '');
    const e1 = plan.evidence[0];
    c.ev1 = e1 && e1.kind === 'experience' ? e1 : null;
    c.ev1sk = c.ev1 ? joinAnd(c.ev1.skills.map((k) => skillPhrase(k, lang)), lang) : '';

    // motivation from the user's own answer
    const m = ans.motivation_company && !ans.motivation_company.negative ? ans.motivation_company : null;
    c.motiv = !!m;
    c.motivFr = (lead) => {
      if (!m) return '';
      if (m.form === 'because') return (lead ? 'Je postule chez ' + plan.company + ' parce que ' : 'Je m’intéresse à ' + plan.company + ' parce que ') + stripBecause(m.text) + '.';
      if (m.form === 'noun') return c.pick(['Ce qui m’attire chez ' + plan.company + ', c’est ' + cleanAnswer(m.text) + '.', 'Si ' + plan.company + ' a retenu mon attention, c’est d’abord pour ' + cleanAnswer(m.text) + '.'], 'mf');
      return 'Mon intérêt pour ' + plan.company + ' est très concret : ' + cleanAnswer(m.text) + '.';
    };
    c.motivEn = (lead) => {
      if (!m) return '';
      if (m.form === 'because') return 'I am applying to ' + plan.company + ' because ' + stripBecause(m.text) + '.';
      if (m.form === 'noun') return c.pick(['What draws me to ' + plan.company + ' is ' + cleanAnswer(m.text) + '.', plan.company + ' caught my attention first for ' + cleanAnswer(m.text) + '.'], 'me');
      return 'My interest in ' + plan.company + ' is very concrete: ' + cleanAnswer(m.text) + '.';
    };
    const pc = ans.personal_connection && !ans.personal_connection.negative ? ans.personal_connection : null;
    c.conn = pc ? cleanAnswer(pc.text) : '';
    const ra = ans.role_attraction && !ans.role_attraction.negative ? ans.role_attraction : null;

    // career-goal phrasing (rotates to avoid copying the profile sentence in every letter)
    const goalRaw = ans.career_goal && ans.career_goal.text ? ans.career_goal.text : (plan.usedGoal ? plan.goal : '');
    const goalSameLang = goalRaw && detectLang(goalRaw) === lang;
    const fieldGoalFr = 'je veux approfondir ' + (f[0] ? f[0][0] : 'le marketing') + ' au sein d’une équipe qui travaille sur des sujets concrets';
    const fieldGoalEn = 'I want to go deeper into ' + (f[0] ? f[0][1] : 'marketing') + ' within a team working on concrete topics';
    c.goalFr = goalSameLang && fr ? cleanAnswer(goalRaw).replace(/^(construire|developper|développer)/i, (x) => 'je souhaite ' + x.toLowerCase()) : fieldGoalFr;
    c.goalEn = goalSameLang && !fr ? cleanAnswer(goalRaw) : fieldGoalEn;
    c.goalFrClause = c.goalFr; c.goalEnClause = c.goalEn;
    c.closeFocusFr = 'à vos projets chez ' + plan.company;
    if (sameLangOffer && plan.need) {
      const mm = respPhrase(plan.need).match(/^participer (au|aux|à la|à l’|à l')\s*(.*)$/i);
      if (mm) c.closeFocusFr = mm[1] + (/’|'$/.test(mm[1]) ? '' : ' ') + mm[2];
    }
    c.closeFocusEn = 'your team’s work at ' + plan.company;

    // Explicit style requests win over anti-repetition for the slots they define.
    const TONE_PREFS = {
      confident: { opening: 'o-evidence', link: 'l-confident', closing: 'cl-call' },
      professional: { opening: 'o-direct', connection: 'c-frame', link: 'l-direct', closing: 'cl-formal' },
      creative: { opening: 'o-question', connection: 'c-pitch', closing: 'cl-call' },
      marketing: { opening: 'o-evidence', connection: 'c-path', link: 'l-confident' },
      company: { opening: c.motiv ? 'o-motiv' : (c.conn ? 'o-connection' : 'o-need'), closing: 'cl-talk' }
    };
    function choose(pool, slot) {
      const all = pool.filter((t) => (!t.when || t.when(c)) && (!t.tones || t.tones.indexOf(tone) !== -1));
      if (opts.forceIds && opts.forceIds[slot]) { const forced = all.find((t) => t.id === opts.forceIds[slot]); if (forced) { choices[slot] = forced.id; return forced; } }
      const tp = (TONE_PREFS[tone] || {})[slot];
      const preferred = tp && all.find((t) => t.id === tp);
      if (preferred) { choices[slot] = preferred.id; return preferred; }
      let cands = all.filter((t) => !(used[slot] || []).includes(t.id));
      if (!cands.length) cands = all;
      const t = cands[Math.floor(rnd() * cands.length)] || pool[pool.length - 1];
      choices[slot] = t.id;
      return t;
    }

    const paras = [];
    const short = tone === 'short';

    // Opening
    const o = choose(OPENINGS, 'opening');
    let opening = o[lang](c);
    if (o.id !== 'o-motiv' && c.motiv && !short) opening += ' ' + (fr ? c.motivFr(false) : c.motivEn(false));
    if (o.id !== 'o-connection' && c.conn && (tone === 'company' || (!short && o.id !== 'o-motiv' && rnd() < 0.5))) {
      opening += ' ' + (fr ? c.pick(['J’ai d’ailleurs un attachement personnel à ' + c.conn + '.', 'Un détail compte aussi pour moi : ' + c.conn + '.'], 'pc') : c.pick(['I also have a personal attachment to ' + c.conn + '.', 'One detail matters to me too: ' + c.conn + '.'], 'pc'));
      c.connUsed = true;
    } else if (o.id === 'o-connection') c.connUsed = true;
    paras.push(opening);

    // Company-focused paragraph (from the offer only — no invented company facts)
    if (tone === 'company' && plan.need2 && sameLangOffer) {
      paras.push(fr ? 'Votre offre décrit aussi une mission qui me parle particulièrement : ' + respPhrase(plan.need2) + '. C’est exactement le type de projet sur lequel je veux progresser chez ' + plan.company + '.' : 'Your offer also describes a task that speaks to me: ' + respPhrase(plan.need2) + '. That is exactly the kind of work I want to grow in at ' + plan.company + '.');
    }

    // Connection + evidence
    let body = '';
    if (!short) body += choose(CONNECTIONS, 'connection')[lang](c) + ' ';
    plan.evidence.slice(0, short ? 1 : 2).forEach((e, i) => {
      const s = joinAnd(e.skills.map((k) => skillPhrase(k, lang)), lang);
      const mt = metricIn(lang, e.metric);
      if (e.kind === 'project') body += PROJECT_EV[lang](c, e, s, mt) + ' ';
      else if (i === 0 && o.id === 'o-evidence') body += (fr ? (mt ? 'Un résultat en particulier : ' + mt + '. ' : '') : (mt ? 'One result in particular: ' + mt + '. ' : ''));
      else body += choose(EVIDENCE, 'evidence' + i)[lang](c, e, s, mt) + ' ';
      if (i === 0 && !short) {
        body += choose(LINKS, 'link')[lang](c) + ' ';
        if (tone === 'confident') body += (fr ? 'J’ai la conviction de pouvoir apporter une contribution concrète dès les premières semaines. ' : 'I am confident I can make a concrete contribution within the first weeks. ');
      }
    });
    if (tone === 'marketing') {
      const ms = plan.evidence.map((e) => metricIn(lang, e.metric)).filter(Boolean);
      if (ms.length) body += (fr ? 'Je raisonne en résultats mesurables : ' : 'I think in measurable results: ') + joinAnd(ms, lang) + (fr ? ' — et je suivrai les indicateurs de la nouvelle mission avec la même exigence. ' : ' — and I will track the KPIs of this new role with the same rigour. ');
    }
    // gap handling: only from what the user said
    const gap = ans.gap_industry;
    if (gap && plan.industryRequired) {
      const ind = fr ? INDUSTRY_FR[plan.industryRequired] : INDUSTRY_EN[plan.industryRequired];
      if (gap.negative) body += fr ? 'Je n’ai pas encore d’expérience professionnelle dans ' + ind + ', mais les mécaniques que j’ai pratiquées — ' + joinAnd((plan.evidence[0] || { skills: [] }).skills.map((k) => skillPhrase(k, 'fr')), 'fr') + ' — s’y transposent directement. ' : 'I don’t have professional ' + ind + ' experience yet, but the mechanics I have practised — ' + joinAnd((plan.evidence[0] || { skills: [] }).skills.map((k) => skillPhrase(k, 'en')), 'en') + ' — transfer directly. ';
      else if (gap.text) body += (fr ? 'Côté ' + ind.replace(/^(la |le |les |l’)/, '') + ' : ' : 'On the ' + ind + ' side: ') + cleanAnswer(gap.text) + '. ';
    }
    if (plan.portfolio && plan.portfolio.project && !short) body += fr ? 'Si vous souhaitez voir le travail en détail, le projet « ' + plan.portfolio.project + ' » est présenté dans mon portfolio.' : 'If you would like to see the work itself, the “' + plan.portfolio.project + '” project is in my portfolio.';
    paras.push(body.trim());

    // Motivation / career coherence
    if (!short) {
      let mot = '';
      if (ra) mot += (fr ? (ra.form === 'noun' ? 'Dans ce poste, c’est surtout ' + cleanAnswer(ra.text) + ' qui me motive. ' : 'Ce qui me motive dans ce rôle : ' + cleanAnswer(ra.text) + '. ') : (ra.form === 'noun' ? 'In this role, it is above all ' + cleanAnswer(ra.text) + ' that motivates me. ' : 'What motivates me in this role: ' + cleanAnswer(ra.text) + '. '));
      mot += choose(MOTIVATIONS, 'motivation')[lang](c);
      if (c.conn && !c.connUsed) mot += ' ' + (fr ? 'Et j’ai un attachement sincère à ' + c.conn + '.' : 'And I have a genuine attachment to ' + c.conn + '.');
      paras.push(mot);
    }

    // Closing
    paras.push(choose(CLOSINGS, 'closing')[lang](c));

    // envelope
    const s = plan.sender;
    const header = [s.name, [s.city, s.email, s.phone].filter(Boolean).join(' · ')].filter(Boolean).join('\n');
    const today = new Date().toLocaleDateString(fr ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const subject = fr ? 'Objet : Candidature — ' + plan.title + ' (' + plan.contractType + ', ' + plan.duration + ' mois)' : 'Subject: Application — ' + plan.title + ' (' + plan.contractType + ', ' + plan.duration + ' months)';
    const contactName = plan.contact ? plan.contact.replace(/\s*\(.*\)/, '') : '';
    const salutation = fr ? (contactName ? 'Bonjour ' + contactName + ',' : (tone === 'professional' ? 'Madame, Monsieur,' : 'Bonjour,')) : (contactName ? 'Dear ' + contactName + ',' : 'Dear Hiring Team,');
    const signoff = fr ? (tone === 'professional' ? 'Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.' : 'Bien cordialement,') : (tone === 'professional' ? 'Yours sincerely,' : 'Best regards,');
    const text = header + '\n' + (fr ? s.city + ', le ' + today : today) + '\n\n' + plan.company + '\n' + subject + '\n\n' + salutation + '\n\n' + paras.join('\n\n') + '\n\n' + signoff + '\n' + s.name;
    return { text, body: paras.join('\n\n'), choices, lang, tone, droppedAnswers };
  }

  /* ========================================================= 3. CHECK */
  function overlapRatio(text, source, n) {
    const a = U().shingles(text, n);
    if (!a.length) return 0;
    const b = new Set(U().shingles(source, n));
    return a.filter((x) => b.has(x)).length / a.length;
  }
  function quality(result, plan, ctx) {
    const body = result.body;
    const kb = MT.matching.buildKnowledge(ctx.cvId);
    const hist = history(ctx.applicationId).slice(0, 12);
    const prevSims = hist.map((l) => ({ id: l.id, company: l.company, sim: U().jaccard(U().shingles(l.body || l.content, 3), U().shingles(body, 3)) }));
    const prevMax = prevSims.reduce((a, b) => (b.sim > a.sim ? b : a), { sim: 0 });
    const cvText = (kb.cv && kb.cv.text) || '';
    const cvBullets = kb.experiences.reduce((a, e) => a.concat(e.bullets || []), []).concat(kb.projects.reduce((a, p) => a.concat(p.bullets || []), [])).join('\n');
    const cvRep = Math.max(overlapRatio(body, cvText + '\n' + cvBullets, 5), 0);
    const copiedCvSentence = U().shingles(body, 8).some((g) => U().shingles(cvText + '\n' + cvBullets, 8).indexOf(g) !== -1);
    const pfText = ((kb.portfolio && kb.portfolio.summary) || '') + ' ' + (kb.portfolioProjects || []).map((p) => p.summary).join(' ');
    const pfRep = overlapRatio(body, pfText, 5);
    const profileRep = overlapRatio(body, (kb.profile.careerGoals || '') + ' ' + (kb.profile.pitch || ''), 6);
    // invented numbers: every number in the body must exist in a source
    const sources = [cvText, cvBullets, JSON.stringify(plan.answers || {}), (ctx.job && (ctx.job.description + ' ' + ctx.job.companyAbout + ' ' + (ctx.job.responsibilities || []).join(' '))) || '', String(plan.duration)].join(' ');
    const nums = (body.match(/\d+([.,]\d+)?/g) || []);
    const unsupportedNums = nums.filter((n) => sources.indexOf(n) === -1);
    const lower = ' ' + U().norm(body) + ' ';
    const buzz = BUZZWORDS.filter((b) => lower.indexOf(' ' + U().norm(b) + ' ') !== -1);
    const words = U().tokens(body).length;
    const firstSentence = U().norm(body.split(/(?<=[.!?])\s/)[0]);
    const bannedOpening = BANNED_OPENINGS.some((b) => firstSentence.indexOf(b) === 0);
    const openingReused = hist.slice(0, 3).some((l) => l.plan && l.choices && l.choices.opening === result.choices.opening);
    const evReused = hist.slice(0, 3).filter((l) => l.plan && l.plan.evidence && plan.evidence[0] && l.plan.evidence[0].ref === plan.evidence[0].ref).length;
    const answersUsed = Object.keys(plan.answers || {}).filter((k) => plan.answers[k] && !isNegative(plan.answers[k]) && k !== 'highlight_experience' && result.droppedAnswers.indexOf(k) === -1).length;
    const mentionsCompany = body.indexOf(plan.company) !== -1;
    const mentionsTitle = result.text.indexOf(plan.title) !== -1;
    const hasMetric = plan.evidence.some((e) => e.metric);
    const evidenceReal = plan.evidence.every((e) => (e.company && cvText.indexOf(e.company) !== -1) || (e.title && (cvText.indexOf(e.title.split(' —')[0]) !== -1 || kb.projects.some((p) => p.title === e.title))) || kb.experiences.some((x) => x.id === e.ref));
    const langOk = detectLang(body) === result.lang;
    const range = result.tone === 'short' ? [90, 230] : [150, 400];

    let pers = 0;
    if (mentionsCompany) pers += 12;
    if (mentionsTitle) pers += 8;
    if (plan.need && result.body.indexOf(trimEnd(plan.need.replace(/\s*\([^)]*\)/g, '')).slice(0, 25)) !== -1 || /need|besoin|mission|offre|offer/.test(body)) pers += 14;
    pers += Math.min(30, answersUsed * 12);
    if (hasMetric) pers += 12;
    if (plan.evidence.length) pers += 12;
    if (words >= range[0] && words <= range[1]) pers += 8;
    if (!openingReused) pers += 4;
    pers -= buzz.length * 5;
    pers -= Math.max(0, Math.round(prevMax.sim * 100) - 25);
    pers = Math.max(10, Math.min(98, pers));

    const prevPct = Math.round(prevMax.sim * 100), cvPct = Math.round(cvRep * 100), pfPct = Math.round(pfRep * 100);
    const risk = prevPct > 35 || cvPct > 25 || copiedCvSentence ? 'High' : prevPct > 22 || cvPct > 14 ? 'Medium' : 'Low';
    const checks = [
      { ok: mentionsCompany, label: 'Mentions ' + plan.company + ' specifically' },
      { ok: mentionsTitle, label: 'Mentions the exact position' },
      { ok: answersUsed > 0 || !!plan.need, label: answersUsed ? 'Uses your own motivation (' + answersUsed + ' answer' + (answersUsed > 1 ? 's' : '') + ')' : 'Motivation tied to the offer (no personal answer given)', warn: !answersUsed },
      { ok: evidenceReal, label: 'No invented experience — evidence comes from your CV' },
      { ok: !unsupportedNums.length, label: unsupportedNums.length ? 'Unverified figures: ' + unsupportedNums.join(', ') : 'No invented figures — every number comes from your CV/offer' },
      { ok: hasMetric, label: hasMetric ? 'Uses concrete evidence' : 'No measurable result available — consider adding one to your CV', warn: !hasMetric },
      { ok: !copiedCvSentence && cvPct <= 20, label: 'Low CV repetition (' + cvPct + '%)' },
      { ok: pfPct <= 20, label: 'Low portfolio repetition (' + pfPct + '%)' },
      { ok: prevPct <= 30, label: 'Low previous-letter similarity (' + prevPct + '%)' },
      { ok: !openingReused && !bannedOpening, label: openingReused ? 'Opening style was used recently' : 'Fresh opening (not a stock phrase)', warn: openingReused },
      { ok: evReused < 3, label: evReused ? 'Main experience used in ' + evReused + ' recent letter' + (evReused > 1 ? 's' : '') : 'Main experience not overused', warn: evReused >= 2 },
      { ok: buzz.length <= 1, label: buzz.length ? 'Buzzwords: ' + buzz.join(', ') : 'No buzzwords' },
      { ok: words >= range[0] && words <= range[1], label: 'Concise (' + words + ' words)' , warn: true },
      { ok: langOk, label: 'Written in ' + (result.lang === 'fr' ? 'French' : 'English') }
    ];
    if (result.droppedAnswers.length) checks.push({ ok: false, warn: true, label: result.droppedAnswers.length + ' answer(s) written in another language were left out — answer in ' + (result.lang === 'fr' ? 'French' : 'English') + ' to include them' });
    return {
      personalization: pers, previousSimilarity: prevPct, similarTo: prevMax.company || '', cvRepetition: cvPct, portfolioRepetition: pfPct, profileRepetition: Math.round(profileRep * 100),
      risk, checks, words, unsupportedNums, buzz, passes: risk !== 'High' && !unsupportedNums.length && !copiedCvSentence && prevPct <= 30
    };
  }

  /* ========================================================= public API */
  function avoidMap(appId) {
    const avoid = {};
    history(appId).slice(0, 4).forEach((l) => {
      Object.keys(l.choices || {}).forEach((slot) => { (avoid[slot] = avoid[slot] || []).push(l.choices[slot]); });
    });
    return avoid;
  }

  /**
   * Generate a letter. Retries with new seeds while repetition is too high.
   * ctx: { job, cvId, applicationId, answers, lang, tone, plan?, forceIds?, seed? }
   */
  function generate(ctx) {
    if (!ctx.job) throw new Error('Missing job');
    if (!ctx.job.company) throw new Error('This offer has no company name — add it before generating a letter.');
    const plan = ctx.plan || buildPlan(ctx);
    if (!plan.sender.name) throw new Error('Add your first and last name in My Profile so the letter can be signed.');
    const avoid = avoidMap(ctx.applicationId);
    let best = null, attempts = 0;
    const baseSeed = ctx.seed || (Date.now() % 100000);
    for (let i = 0; i < 6; i++) {
      attempts++;
      const r = render(plan, { lang: ctx.lang, tone: ctx.tone, seed: baseSeed + i * 7919, avoid, forceIds: ctx.forceIds, job: ctx.job });
      const q = quality(r, plan, ctx);
      const score = q.personalization - q.previousSimilarity - q.cvRepetition;
      if (!best || score > best.score) best = { r, q, score };
      if (q.passes && !ctx.forceIds) break;
      if (ctx.forceIds) break;
    }
    return { plan, text: best.r.text, body: best.r.body, choices: best.r.choices, lang: best.r.lang, tone: best.r.tone, quality: best.q, attempts };
  }

  /** Re-run checks on a user-edited text. */
  function recheck(text, letter, ctx) {
    const parts = text.split(/\n\n+/);
    const body = parts.length > 4 ? parts.slice(3, -1).join('\n\n') : text;
    return quality({ text, body, choices: letter.choices || {}, lang: letter.language, tone: letter.tone, droppedAnswers: [] }, letter.plan, ctx);
  }

  /** Persist a letter (new record or new version of an existing one). */
  function save(gen, meta) {
    const letters = MT.storage.get('coverLetters', []);
    const now = Date.now();
    let rec = meta.coverLetterId ? letters.find((l) => l.id === meta.coverLetterId) : null;
    if (rec) {
      rec.history = rec.history || [];
      rec.history.push({ content: rec.content, at: rec.updatedAt, label: 'v' + rec.version + ' · ' + rec.tone + ' · ' + rec.language });
      rec.history = rec.history.slice(-10);
      rec.version += 1;
    } else {
      rec = { id: MT.storage.uid('cl'), createdAt: now, version: 1, history: [] };
      letters.push(rec);
    }
    const cv = (MT.storage.get('cvs', []).find((c) => c.id === meta.cvId) || {});
    const job = meta.job || {};
    const profile = MT.storage.get('profile', {});
    Object.assign(rec, {
      applicationId: meta.applicationId, jobId: job.id, company: job.company, title: job.title,
      language: gen.lang, tone: gen.tone, cvId: meta.cvId, cvVersion: cv.name ? cv.name + ' v' + cv.version : '',
      portfolioVersion: profile.portfolio ? profile.portfolio + ' @ ' + U().fmtDate(profile.portfolioUpdatedAt || now) : '',
      jobVersion: job.id ? job.id + '@' + (job.updatedAt || job.firstSeenAt || '') : '',
      userAnswers: Object.assign({}, gen.plan.answers), plan: gen.plan, choices: gen.choices,
      content: gen.text, body: gen.body, updatedAt: now,
      similarityScore: gen.quality.previousSimilarity, personalizationScore: gen.quality.personalization,
      cvRepetition: gen.quality.cvRepetition, quality: gen.quality, edited: !!gen.edited
    });
    MT.storage.set('coverLetters', letters);
    return rec;
  }
  function get(id) { return MT.storage.get('coverLetters', []).find((l) => l.id === id) || null; }

  MT.coverLetter = { buildPlan, render, generate, recheck, save, get, history, detectLang, quality, BUZZWORDS, _metricIn: metricIn };
})(window.MT = window.MT || {});
