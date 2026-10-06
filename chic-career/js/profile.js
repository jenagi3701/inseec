/* ==========================================================================
   CHIC CAREER — profile.js
   My Profile: Personal information · CVs · Portfolio · Preferences ·
   Knowledge base · AI Settings (+ privacy & data controls).
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);
  const K = () => MT.knowledge;

  const TABS = [['personal', 'Personal Information'], ['cvs', 'CVs'], ['portfolio', 'Portfolio'], ['preferences', 'Preferences'], ['knowledge', 'Knowledge base'], ['ai', 'AI Settings']];
  const getP = () => MT.storage.get('profile', {});
  const setP = (p) => { MT.storage.set('profile', p); MT.matching.invalidate(); };

  function render(root, tab) {
    tab = tab || 'personal';
    const p = getP();
    root.innerHTML = '<header class="page-head"><div><p class="eyebrow">' + (p.demo ? '<span class="badge badge--demo">DEMO PROFILE</span> fictional data' : 'Your career knowledge base') + '</p><h1 class="display">My Profile</h1>' +
      '<p class="lead">Everything the chicken knows about you lives here — stored only in this browser.</p></div></header>' +
      '<nav class="tabs" role="tablist" aria-label="Profile sections">' + TABS.map((t) => '<a role="tab" class="tab' + (t[0] === tab ? ' is-active' : '') + '" aria-selected="' + (t[0] === tab) + '" href="#/profile/' + t[0] + '">' + t[1] + '</a>').join('') + '</nav><div id="ptab" class="tab-panel"></div>';
    const el = root.querySelector('#ptab');
    ({ personal, cvs, portfolio, preferences, knowledge, ai: aiSettings }[tab] || personal)(el, root);
  }

  function input(name, label, val, type, attrs) {
    return '<label class="field"><span>' + label + '</span><input name="' + name + '" type="' + (type || 'text') + '" value="' + esc(val || '') + '" ' + (attrs || '') + '></label>';
  }
  function showErr(form, msg) { const e = form.querySelector('.form-error'); e.hidden = !msg; e.textContent = msg || ''; if (msg) e.focus && e.scrollIntoView({ block: 'nearest' }); }

  /* ------------------------------------------------------------ personal */
  function personal(el) {
    const p = getP();
    el.innerHTML = '<form class="card form-grid" id="pf" novalidate><h2 class="h3 field--full">Personal information</h2>' +
      input('firstName', 'First name *', p.firstName, 'text', 'required autocomplete="given-name"') + input('lastName', 'Last name *', p.lastName, 'text', 'required autocomplete="family-name"') +
      input('email', 'Email', p.email, 'email', 'autocomplete="email"') + input('phone', 'Phone', p.phone, 'tel', 'autocomplete="tel"') +
      input('location', 'Location', p.location, 'text', 'autocomplete="address-level2"') + input('headline', 'Headline', p.headline) +
      input('linkedin', 'LinkedIn URL', p.linkedin, 'url', 'placeholder="https://www.linkedin.com/in/…"') + input('portfolio', 'Portfolio URL', p.portfolio, 'url', 'placeholder="https://myportfolio.com"') +
      input('website', 'Personal website (optional)', p.website, 'url') + '<span></span>' +
      '<label class="field field--full"><span>Career goal <small class="muted">— used to explain why a role fits your next step</small></span><textarea name="careerGoals" rows="2">' + esc(p.careerGoals || '') + '</textarea></label>' +
      '<label class="field field--full"><span>What should recruiters remember about you? <small class="muted">— your personal differentiator</small></span><textarea name="pitch" rows="2">' + esc(p.pitch || '') + '</textarea></label>' +
      '<p class="form-error field--full" role="alert" tabindex="-1" hidden></p><div class="field--full row-end"><button class="btn btn--primary">Save</button></div></form>';
    el.querySelector('#pf').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target), form = e.target;
      const v = (k) => (f.get(k) || '').trim();
      if (!v('firstName') || !v('lastName')) return showErr(form, 'First and last name are required — they sign your cover letters.');
      if (v('email') && !U().isValidEmail(v('email'))) return showErr(form, 'The email address doesn’t look valid.');
      for (const k of ['linkedin', 'portfolio', 'website']) if (v(k) && !U().isValidUrl(v(k))) return showErr(form, 'The ' + k + ' URL doesn’t look valid — it should start with https://');
      const p2 = getP();
      ['firstName', 'lastName', 'email', 'phone', 'location', 'headline', 'linkedin', 'website', 'careerGoals', 'pitch'].forEach((k) => { p2[k] = v(k); });
      if (v('portfolio') !== (p2.portfolio || '')) { p2.portfolio = v('portfolio'); p2.portfolioUpdatedAt = Date.now(); p2.portfolioData = Object.assign(p2.portfolioData || {}, { url: v('portfolio') }); }
      setP(p2); showErr(form, ''); U().toast('Profile saved', 'success'); MT.app.renderChrome();
    };
  }

  /* ------------------------------------------------------------ CVs */
  function cvs(el, root) {
    const list = MT.cv.list();
    const act = list.filter((c) => !c.archived), arch = list.filter((c) => c.archived);
    el.innerHTML = '<div class="grid-2 grid-2--wide-left"><section class="card"><h2 class="h3">My CVs</h2>' +
      (act.length ? '<ul class="cv-list">' + act.map((c) => cvRow(c)).join('') + '</ul>' : U().emptyState({ title: 'No CV uploaded', text: 'Upload your CV to unlock personalized job matching and AI applications.', prop: 'paperBlank' })) +
      (arch.length ? '<details><summary>Older versions (' + arch.length + ')</summary><ul class="cv-list cv-list--old">' + arch.map((c) => cvRow(c, true)).join('') + '</ul></details>' : '') + '</section>' +
      '<section class="card" id="upload-card"><h2 class="h3">Upload a CV</h2>' +
      '<form id="up" novalidate><div class="dropzone" id="dz" tabindex="0" role="button" aria-describedby="dz-help"><span class="dropzone__icon" aria-hidden="true">📄</span><strong>Drop your CV here</strong><span class="small muted" id="dz-help">PDF or DOCX · max 8 MB · or click to browse</span><input type="file" id="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="sr-only"></div>' +
      '<p class="small" id="file-name" aria-live="polite"></p>' +
      '<label class="field"><span>Name this version *</span><input name="name" required placeholder="e.g. CV Marketing — 2026" list="cv-names"></label><datalist id="cv-names">' + act.map((c) => '<option value="' + esc(c.name) + '">').join('') + '</datalist>' +
      '<p class="small muted">Using an existing name replaces that CV with a new version (the old one is kept in “Older versions”).</p>' +
      '<label class="field"><span>Target role</span><input name="targetRole" placeholder="e.g. Product marketing"></label>' +
      '<details id="paste-box"><summary>No file? Paste your CV text instead</summary><label class="field"><span class="sr-only">CV text</span><textarea name="text" rows="8" placeholder="Paste the text of your CV…"></textarea></label></details>' +
      '<p class="form-error" role="alert" tabindex="-1" hidden></p><button class="btn btn--primary" id="up-btn">Extract & save</button></form>' +
      '<p class="small muted privacy-note">🔒 Your file is read <strong>inside your browser</strong>. Only the extracted text and structured data are stored locally; the file itself is never uploaded or kept.</p></section></div>';

    // dropzone
    const dz = el.querySelector('#dz'), fi = el.querySelector('#file');
    let file = null;
    const setFile = (f) => { file = f; el.querySelector('#file-name').textContent = f ? 'Selected: ' + f.name + ' (' + Math.round(f.size / 1024) + ' KB)' : ''; const n = el.querySelector('[name=name]'); if (f && !n.value) n.value = f.name.replace(/\.(pdf|docx)$/i, '').replace(/[_-]+/g, ' '); };
    dz.onclick = () => fi.click();
    dz.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } };
    fi.onchange = () => setFile(fi.files[0]);
    ['dragenter', 'dragover'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove('is-over'); }));
    dz.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });

    el.querySelector('#up').onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target, f = new FormData(form);
      const name = (f.get('name') || '').trim(), pasted = (f.get('text') || '').trim();
      if (!file && !pasted) return showErr(form, 'Choose a PDF/DOCX file, or paste your CV text.');
      if (!name) return showErr(form, 'Give this CV version a name, e.g. “CV Marketing — 2026”.');
      const btn = el.querySelector('#up-btn'); btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Reading your CV…';
      try {
        const text = file ? await MT.cv.extractFile(file) : pasted;
        if (!file && U().tokens(text).length < 25) throw Object.assign(new Error('That text is too short to be a CV. Paste the full content.'), { friendly: true });
        const rec = MT.cv.add({ name, targetRole: (f.get('targetRole') || '').trim(), text, filename: file ? file.name : 'pasted-text.txt', size: file ? file.size : text.length, sourceType: file ? 'upload' : 'paste' });
        U().toast('CV extracted — please review what was found.', 'success');
        MT.app.renderChrome();
        cvs(el, root); editCv(rec.id, true);
      } catch (err) {
        console.error(err);
        showErr(form, err.friendly ? err.message : 'Something went wrong while reading the file. Try another file or paste the text.');
        if (err.partialText !== undefined) { el.querySelector('#paste-box').open = true; }
        btn.disabled = false; btn.textContent = 'Extract & save';
      }
    };
    bindCvRows(el, root);
  }
  function cvRow(c, old) {
    const pd = c.parsedData || {};
    return '<li class="cv-row' + (c.isDefault ? ' is-default' : '') + '"><span class="cv-row__icon" aria-hidden="true">' + (/\.docx$/i.test(c.filename) ? '📝' : '📄') + '</span>' +
      '<div class="cv-row__main"><strong>' + esc(c.name) + '</strong> <span class="badge">v' + c.version + '</span>' + (c.isDefault ? ' <span class="badge badge--accent">Default</span>' : '') + (c.sourceType === 'demo' ? ' <span class="badge badge--demo">DEMO</span>' : '') +
      '<br><span class="small muted">' + esc(c.filename) + ' · ' + U().fmtDate(c.uploadDate) + ' · ' + esc(c.targetRole || 'no target role') + '</span>' +
      '<br><span class="small">' + (pd.experience || []).length + ' experiences · ' + (pd.education || []).length + ' education · ' + (pd.skills || []).length + ' skills · ' + (pd.tools || []).length + ' tools</span></div>' +
      '<div class="cv-row__act"><button class="btn btn--sm btn--ghost" data-edit="' + c.id + '">Review data</button>' + (!old && !c.isDefault ? '<button class="btn btn--sm btn--ghost" data-def="' + c.id + '">Set default</button>' : '') +
      '<button class="btn btn--sm btn--danger-ghost" data-del="' + c.id + '" aria-label="Delete ' + esc(c.name) + '">Delete</button></div></li>';
  }
  function bindCvRows(el, root) {
    U().$$('[data-def]', el).forEach((b) => b.onclick = () => { MT.cv.setDefault(b.dataset.def); MT.matching.invalidate(); U().toast('Default CV updated', 'success'); cvs(el, root); });
    U().$$('[data-del]', el).forEach((b) => b.onclick = async () => {
      const used = MT.applications.all().filter((a) => a.cvId === b.dataset.del).length;
      if (await U().confirmDialog('Delete this CV?', used ? 'It was used in ' + used + ' application(s); they will keep the CV name but its data will be gone.' : 'Its extracted data will be removed from this browser.', 'Delete', true)) { MT.cv.remove(b.dataset.del); MT.matching.invalidate(); cvs(el, root); MT.app.renderChrome(); }
    });
    U().$$('[data-edit]', el).forEach((b) => b.onclick = () => editCv(b.dataset.edit));
  }

  /** Editable extracted data — the user always has the last word. */
  function editCv(id, fresh) {
    const c = MT.cv.list().find((x) => x.id === id);
    if (!c) return;
    const pd = c.parsedData;
    const lines = (arr) => esc((arr || []).join('\n'));
    const expBlock = (e, i, kind) => '<fieldset class="exp-edit" data-kind="' + kind + '" data-i="' + i + '"><legend>' + (kind === 'experience' ? 'Experience ' : 'Project ') + (i + 1) + '</legend><div class="form-grid">' +
      (kind === 'experience'
        ? input('role', 'Job title', e.role) + input('company', 'Company', e.company) + input('location', 'Location', e.location) + input('dates', 'Dates', e.dates) +
          '<label class="field"><span>Type</span><select name="type">' + ['internship', 'apprenticeship', 'job', 'volunteer'].map((t) => '<option' + (t === e.type ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label>' +
          '<label class="field"><span>Industry</span><select name="industry"><option value="">—</option>' + Object.keys(K().INDUSTRIES).map((k) => '<option value="' + k + '"' + (k === e.industry ? ' selected' : '') + '>' + esc(K().industryLabel(k)) + '</option>').join('') + '</select></label>'
        : input('title', 'Project', e.title) + input('context', 'Context / dates', e.context) +
          '<label class="field"><span>Industry</span><select name="industry"><option value="">—</option>' + Object.keys(K().INDUSTRIES).map((k) => '<option value="' + k + '"' + (k === e.industry ? ' selected' : '') + '>' + esc(K().industryLabel(k)) + '</option>').join('') + '</select></label>') +
      '<label class="field field--full"><span>Responsibilities & results (one per line)</span><textarea name="bullets" rows="4">' + lines(e.bullets) + '</textarea></label></div>' +
      '<button type="button" class="btn btn--sm btn--danger-ghost" data-rm>Remove</button></fieldset>';
    const m = U().modal({
      title: (fresh ? 'Review what we extracted — ' : 'CV data — ') + c.name, size: 'xl',
      body: (fresh ? '<p class="notice">Check every field: extraction is heuristic and may miss or misplace things. Nothing is invented — if something is missing, add it yourself.' + (pd.sectionsFound && !pd.sectionsFound.length ? ' <strong>No section headings were recognised</strong>, so most fields need to be filled manually.' : '') + '</p>' : '') +
        '<form id="cvf" class="cv-edit">' +
        '<div class="form-grid">' + input('name', 'Version name', c.name) + input('targetRole', 'Target role', c.targetRole) + '</div>' +
        '<h3 class="h4">Education <small class="muted">one per line: degree — school — dates</small></h3><textarea name="education" rows="3">' + esc((pd.education || []).map((e) => [e.degree, e.school, e.dates].filter(Boolean).join(' — ')).join('\n')) + '</textarea>' +
        '<h3 class="h4">Experience & internships</h3><div id="exps">' + (pd.experience || []).map((e, i) => expBlock(e, i, 'experience')).join('') + '</div><button type="button" class="btn btn--sm btn--ghost" id="add-exp">+ Add experience</button>' +
        '<h3 class="h4">Projects</h3><div id="prjs">' + (pd.projects || []).map((e, i) => expBlock(e, i, 'project')).join('') + '</div><button type="button" class="btn btn--sm btn--ghost" id="add-prj">+ Add project</button>' +
        '<div class="form-grid form-grid--3">' +
        '<label class="field"><span>Skills (one per line)</span><textarea name="skills" rows="6">' + lines(pd.skills) + '</textarea></label>' +
        '<label class="field"><span>Tools (one per line)</span><textarea name="tools" rows="6">' + lines(pd.tools) + '</textarea></label>' +
        '<label class="field"><span>Languages (Language — level)</span><textarea name="languages" rows="6">' + esc((pd.languages || []).map((l) => l.language + (l.level ? ' — ' + l.level : '')).join('\n')) + '</textarea></label>' +
        '<label class="field"><span>Certifications</span><textarea name="certifications" rows="4">' + lines(pd.certifications) + '</textarea></label>' +
        '<label class="field"><span>Achievements & quantifiable results</span><textarea name="achievements" rows="4">' + lines(pd.achievements) + '</textarea></label>' +
        '<div class="field"><span>Detected automatically</span><p class="small">Skill families: ' + esc(K().detectSkills(c.text + ' ' + (pd.skills || []).join(' ')).map((k) => K().skillLabel(k)).join(', ') || '—') + '</p><p class="small">Industries: ' + esc((pd.industries || []).map(K().industryLabel).join(', ') || '—') + '</p><p class="small">Job titles: ' + esc((pd.experience || []).map((e) => e.role).join(', ') || '—') + '</p></div></div>' +
        '<details><summary>Raw extracted text</summary><pre class="raw-text">' + esc(c.text) + '</pre></details></form>',
      footer: '<button class="btn btn--ghost" data-cancel>Cancel</button><button class="btn btn--primary" data-save>Save CV data</button>'
    });
    const dlg = m.el;
    const bindRm = () => U().$$('[data-rm]', dlg).forEach((b) => b.onclick = () => b.closest('fieldset').remove());
    bindRm();
    dlg.querySelector('#add-exp').onclick = () => { dlg.querySelector('#exps').insertAdjacentHTML('beforeend', expBlock({ bullets: [], type: 'internship' }, dlg.querySelectorAll('#exps fieldset').length, 'experience')); bindRm(); };
    dlg.querySelector('#add-prj').onclick = () => { dlg.querySelector('#prjs').insertAdjacentHTML('beforeend', expBlock({ bullets: [] }, dlg.querySelectorAll('#prjs fieldset').length, 'project')); bindRm(); };
    dlg.querySelector('[data-cancel]').onclick = m.close;
    dlg.querySelector('[data-save]').onclick = () => {
      const f = dlg.querySelector('#cvf');
      const val = (n) => (f.querySelector('[name=' + n + ']').value || '');
      const ln = (n) => val(n).split('\n').map((s) => s.trim()).filter(Boolean);
      const fsVal = (fs, n) => { const x = fs.querySelector('[name=' + n + ']'); return x ? x.value.trim() : ''; };
      const exps = U().$$('#exps fieldset', dlg).map((fs, i) => ({ id: (pd.experience[i] && pd.experience[i].id) || MT.storage.uid('exp'), role: fsVal(fs, 'role'), company: fsVal(fs, 'company'), location: fsVal(fs, 'location'), dates: fsVal(fs, 'dates'), type: fsVal(fs, 'type'), industry: fsVal(fs, 'industry'), bullets: fsVal(fs, 'bullets').split('\n').map((s) => s.trim()).filter(Boolean) })).filter((e) => e.role || e.company);
      const prjs = U().$$('#prjs fieldset', dlg).map((fs, i) => ({ id: (pd.projects[i] && pd.projects[i].id) || MT.storage.uid('prj'), title: fsVal(fs, 'title'), context: fsVal(fs, 'context'), industry: fsVal(fs, 'industry'), bullets: fsVal(fs, 'bullets').split('\n').map((s) => s.trim()).filter(Boolean) })).filter((p) => p.title);
      const edu = ln('education').map((l) => { const parts = l.split(/\s+—\s+|\s+-\s+/); return { degree: parts[0], school: parts[1] || '', dates: parts[2] || '', level: /(msc|master|mba|m2|grande)/i.test(l) ? 5 : /(m1)/i.test(l) ? 4 : /(licence|bachelor|bba)/i.test(l) ? 3 : 2 }; });
      const langs = ln('languages').map((l) => { const parts = l.split(/\s+—\s+|\s+-\s+|\s*\(\s*/); return { language: parts[0].replace(/\)$/, ''), level: (parts[1] || '').replace(/\)$/, '') }; });
      const newPd = Object.assign({}, pd, {
        education: edu, experience: exps, projects: prjs, skills: ln('skills'), tools: ln('tools'), languages: langs, certifications: ln('certifications'), achievements: ln('achievements'),
        jobTitles: exps.map((e) => e.role), industries: Array.from(new Set(exps.map((e) => e.industry).filter(Boolean)))
      });
      if (!val('name').trim()) { U().toast('The CV needs a name.', 'error'); return; }
      MT.cv.update(c.id, { parsedData: newPd, name: val('name').trim(), targetRole: val('targetRole').trim() });
      MT.matching.invalidate();
      m.close(); U().toast('CV data saved', 'success'); MT.app.render();
    };
  }

  /* ------------------------------------------------------------ portfolio */
  function portfolio(el) {
    const p = getP();
    const pf = p.portfolioData || { projects: [], links: [] };
    el.innerHTML = '<form class="card" id="pff" novalidate><h2 class="h3">My Portfolio</h2><p class="muted">What you can <em>show</em>. The chicken uses only what you write here — it never visits, scrapes or invents projects from your site.</p>' +
      '<div class="form-grid">' + input('url', 'Portfolio URL', p.portfolio, 'url', 'placeholder="https://myportfolio.com"') + input('title', 'Portfolio title', pf.title) +
      '<label class="field field--full"><span>Short description</span><textarea name="summary" rows="2">' + esc(pf.summary || '') + '</textarea></label></div>' +
      '<h3 class="h4">Other professional links</h3><div class="form-grid">' + input('linkedin', 'LinkedIn', p.linkedin, 'url') + input('behance', 'Behance', linkOf(pf, 'Behance'), 'url') + input('github', 'GitHub', linkOf(pf, 'GitHub'), 'url') + input('website', 'Personal website', p.website, 'url') + input('other', 'Other link', linkOf(pf, 'Other'), 'url') + '</div>' +
      '<h3 class="h4">Projects you want to be able to point to</h3><div id="pf-projects">' + (pf.projects || []).map(projRow).join('') + '</div><button type="button" class="btn btn--sm btn--ghost" id="add-pp">+ Add project</button>' +
      '<p class="form-error" role="alert" tabindex="-1" hidden></p><div class="row-end"><button class="btn btn--primary">Save portfolio</button></div></form>';
    const bind = () => U().$$('[data-rmp]', el).forEach((b) => b.onclick = () => b.closest('.pp-row').remove());
    bind();
    el.querySelector('#add-pp').onclick = () => { el.querySelector('#pf-projects').insertAdjacentHTML('beforeend', projRow({ title: '', summary: '', skills: [] })); bind(); };
    el.querySelector('#pff').onsubmit = (e) => {
      e.preventDefault();
      const form = e.target, f = new FormData(form), v = (k) => (f.get(k) || '').trim();
      for (const k of ['url', 'linkedin', 'behance', 'github', 'website', 'other']) if (v(k) && !U().isValidUrl(v(k))) return showErr(form, 'The ' + k + ' link doesn’t look valid — it should start with https://');
      const projects = U().$$('.pp-row', el).map((r) => ({ title: r.querySelector('[name=pt]').value.trim(), summary: r.querySelector('[name=ps]').value.trim(), url: r.querySelector('[name=pu]').value.trim(), skills: K().detectSkills(r.querySelector('[name=pt]').value + ' ' + r.querySelector('[name=ps]').value) })).filter((x) => x.title);
      const bad = projects.find((x) => x.url && !U().isValidUrl(x.url));
      if (bad) return showErr(form, 'The link for “' + bad.title + '” doesn’t look valid.');
      const p2 = getP();
      if (v('url') !== (p2.portfolio || '')) p2.portfolioUpdatedAt = Date.now();
      p2.portfolio = v('url'); p2.linkedin = v('linkedin'); p2.website = v('website');
      p2.portfolioData = { url: v('url'), title: v('title'), summary: v('summary'), projects, links: [['Behance', v('behance')], ['GitHub', v('github')], ['Other', v('other')]].filter((x) => x[1]).map((x) => ({ label: x[0], url: x[1] })) };
      setP(p2); showErr(form, ''); U().toast(v('url') ? 'Portfolio saved — 💻 tiny laptop unlocked!' : 'Portfolio saved', 'success'); MT.app.renderChrome();
    };
  }
  function linkOf(pf, label) { const l = (pf.links || []).find((x) => x.label === label); return l ? l.url : ''; }
  function projRow(p) {
    return '<div class="pp-row form-grid form-grid--3"><label class="field"><span>Project</span><input name="pt" value="' + esc(p.title) + '"></label><label class="field"><span>What it shows</span><input name="ps" value="' + esc(p.summary) + '"></label><label class="field"><span>Link (optional)</span><input name="pu" type="url" value="' + esc(p.url || '') + '"></label><button type="button" class="btn btn--sm btn--danger-ghost" data-rmp aria-label="Remove project">Remove</button></div>';
  }

  /* ------------------------------------------------------------ preferences */
  function preferences(el) {
    const p = getP(); const pr = p.preferences || {};
    const checks = (name, opts, sel) => '<div class="chips">' + opts.map((o) => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o, on = (sel || []).map(String).indexOf(String(v)) !== -1; return '<label class="fchip' + (on ? ' is-on' : '') + '"><input type="checkbox" name="' + name + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + '><span>' + (on ? '☑ ' : '☐ ') + esc(l) + '</span></label>'; }).join('') + '</div>';
    el.innerHTML = '<form class="card" id="prf"><h2 class="h3">Career preferences</h2><p class="muted">Used for the relevance score — never to hide offers from you.</p>' +
      '<fieldset class="fgroup"><legend>Contract</legend>' + checks('contracts', K().CONTRACTS, pr.contracts) + '</fieldset>' +
      '<fieldset class="fgroup"><legend>Locations</legend>' + checks('locations', ['Lyon', 'Paris', 'Remote', 'France', 'Marseille', 'Grenoble', 'Bordeaux', 'Lille'], pr.locations) + '</fieldset>' +
      '<fieldset class="fgroup"><legend>Work mode</legend>' + checks('workModes', [['remote', 'Remote'], ['hybrid', 'Hybrid'], ['onsite', 'On-site']], pr.workModes) + '</fieldset>' +
      '<fieldset class="fgroup"><legend>Fields</legend>' + checks('fields', K().FIELDS, pr.fields) + '</fieldset>' +
      '<fieldset class="fgroup"><legend>Preferred industries</legend>' + checks('industries', Object.keys(K().INDUSTRIES).map((k) => [k, K().industryLabel(k)]), pr.industries) + '</fieldset>' +
      '<fieldset class="fgroup"><legend>Desired duration</legend>' + checks('durations', [[3, '3 months'], [4, '4 months'], [6, '6 months'], [12, '12 months'], [24, '24 months']], pr.durations) + '</fieldset>' +
      '<div class="form-grid"><label class="field"><span>Desired positions (one per line)</span><textarea name="desiredPositions" rows="4">' + esc((pr.desiredPositions || []).join('\n')) + '</textarea></label>' +
      '<label class="field"><span>Keywords (one per line)</span><textarea name="keywords" rows="4">' + esc((pr.keywords || []).join('\n')) + '</textarea></label>' +
      '<label class="field"><span>Preferred companies (one per line)</span><textarea name="companies" rows="3">' + esc((pr.companies || []).join('\n')) + '</textarea></label></div>' +
      '<div class="row-end"><button class="btn btn--primary">Save preferences</button></div></form>';
    U().$$('.fchip input', el).forEach((i) => i.onchange = () => { i.parentElement.classList.toggle('is-on', i.checked); i.nextElementSibling.textContent = (i.checked ? '☑ ' : '☐ ') + i.nextElementSibling.textContent.slice(2); });
    el.querySelector('#prf').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target), ln = (k) => (f.get(k) || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const p2 = getP();
      p2.preferences = { contracts: f.getAll('contracts'), locations: f.getAll('locations'), workModes: f.getAll('workModes'), fields: f.getAll('fields'), industries: f.getAll('industries'), durations: f.getAll('durations').map(Number), desiredPositions: ln('desiredPositions'), keywords: ln('keywords'), companies: ln('companies') };
      setP(p2); U().toast('Preferences saved — match scores updated', 'success');
    };
  }

  /* ------------------------------------------------------------ knowledge base */
  function knowledge(el) {
    const kb = MT.matching.buildKnowledge();
    const pd = kb.parsed;
    const sec = (title, body) => '<section class="kb-sec"><h3 class="h4">' + title + '</h3>' + body + '</section>';
    const pills = (arr) => arr.length ? '<ul class="pill-list">' + arr.map((x) => '<li class="pill">' + esc(x) + '</li>').join('') + '</ul>' : '<p class="muted small">Nothing yet.</p>';
    el.innerHTML = '<div class="card"><h2 class="h3">PERSONAL PROFILE — knowledge base</h2><p class="muted">What the chicken knows, assembled from your default CV (' + esc(kb.cv ? kb.cv.name : 'none') + '), your profile and your portfolio. Edit the sources to change it.</p><div class="kb-grid">' +
      sec('🎓 Education', pills((pd.education || []).map((e) => e.degree + (e.school ? ' — ' + e.school : '')))) +
      sec('💼 Experience', pills((pd.experience || []).map((e) => e.role + ' — ' + e.company))) +
      sec('🧪 Projects', pills((pd.projects || []).map((p) => p.title))) +
      sec('🧠 Skills (with evidence)', Object.keys(kb.skills).length ? '<ul class="evidence">' + Object.keys(kb.skills).map((k) => '<li><strong>' + esc(K().skillLabel(k)) + '</strong> <span class="muted small">← ' + esc(Array.from(new Set(kb.skills[k].map((e) => e.label))).slice(0, 3).join(', ')) + '</span></li>').join('') + '</ul>' : '<p class="muted small">Upload a CV to build this.</p>') +
      sec('🛠 Tools', pills(pd.tools || [])) + sec('🌍 Languages', pills((pd.languages || []).map((l) => l.language + (l.level ? ' (' + l.level + ')' : '')))) +
      sec('🏅 Achievements', pills(pd.achievements || [])) + sec('🧭 Career goals', '<p>' + esc(kb.profile.careerGoals || '—') + '</p>') +
      sec('⚙️ Preferences', pills([].concat(kb.prefs.contracts || [], kb.prefs.locations || [], kb.prefs.fields || []))) +
      sec('🎨 Portfolio', '<p>' + (kb.profile.portfolio ? '<a href="' + esc(kb.profile.portfolio) + '" target="_blank" rel="noopener">' + esc(kb.profile.portfolio) + '</a>' : '—') + '</p>' + pills((kb.portfolioProjects || []).map((p) => p.title))) +
      sec('📄 CV versions', pills(MT.cv.active().map((c) => c.name + ' v' + c.version))) + '</div></div>';
  }

  /* ------------------------------------------------------------ AI settings / privacy */
  function aiSettings(el) {
    const s = MT.storage.get('settings', {});
    const kb = Math.round(MT.storage.usageBytes() / 1024);
    el.innerHTML = '<div class="grid-2"><form class="card" id="aif"><h2 class="h3">AI Settings</h2>' +
      '<fieldset class="fgroup"><legend>AI provider</legend>' +
      '<label class="radio-card is-on"><input type="radio" name="prov" value="mock" checked><span><strong>Local demo AI</strong> (active)<br><span class="small muted">Rule-based and deterministic. Runs in your browser. Nothing is sent anywhere.</span></span></label>' +
      '<label class="radio-card is-disabled"><input type="radio" name="prov" value="external" disabled><span><strong>External LLM API</strong> — not configured<br><span class="small muted">Architecture-ready (see <code>js/ai.js</code>). Using it would send your CV data, the offer and your answers to a third-party service — Chic Career would ask for your explicit consent first.</span></span></label></fieldset>' +
      '<fieldset class="fgroup"><legend>Platform language</legend><label class="field"><span class="sr-only">Language of the interface</span><select id="lang-settings" data-lang-pick><option value="en">English</option><option value="fr">Français</option></select></label>' +
      '<p class="small muted">Changes the language of the interface. Your data (offers, CV, letters) stays as written.</p></fieldset>' +
      '<fieldset class="fgroup"><legend>Default cover-letter language</legend><label class="field"><span class="sr-only">Language</span><select name="language"><option value="auto">Auto — detect from the offer</option><option value="fr">Always French</option><option value="en">Always English</option></select></label></fieldset>' +
      '<div class="row-end"><button class="btn btn--primary">Save</button></div></form>' +
      '<div class="card"><h2 class="h3">🔒 Privacy & your data</h2><ul class="privacy">' +
      '<li>All data is stored in this browser’s <code>localStorage</code> (' + kb + ' KB used). There is no account and no server.</li>' +
      '<li>CV files are parsed locally and never uploaded or kept — only extracted text and structured data.</li>' +
      '<li>Portfolio URLs are only displayed and used as you provided them; the app never fetches them.</li>' +
      '<li>“Open original” links leave Chic Career for the job platform. No email or application is ever sent automatically.</li></ul>' +
      '<div class="row-wrap"><button class="btn btn--ghost" id="export">Export my data (.json)</button><button class="btn btn--ghost" id="reset-demo">Reload demo data</button><button class="btn btn--danger-ghost" id="fresh">Start fresh (erase everything)</button></div></div></div>';
    el.querySelector('[name=language]').value = s.language || 'auto';
    const lp = el.querySelector('#lang-settings'); lp.value = MT.i18n.lang; lp.onchange = () => MT.i18n.setLang(lp.value);
    el.querySelector('#aif').onsubmit = (e) => { e.preventDefault(); MT.storage.update('settings', {}, (x) => { x.language = new FormData(e.target).get('language'); x.aiProvider = 'mock'; }); U().toast('AI settings saved', 'success'); };
    el.querySelector('#export').onclick = () => {
      const dump = {}; Object.values(MT.storage.KEYS).forEach((k) => { dump[k] = MT.storage.get(k, null); });
      U().download('chic-career-export-' + U().isoDay(Date.now()) + '.json', JSON.stringify(dump, null, 2), 'application/json');
    };
    el.querySelector('#reset-demo').onclick = async () => { if (await U().confirmDialog('Reload the demo?', 'This replaces all your data with the fictional demo profile, jobs and applications.', 'Reload demo', true)) { MT.seed.seedDemo(); MT.matching.invalidate(); U().toast('Demo data reloaded', 'success'); location.hash = '#/dashboard'; MT.app.render(); } };
    el.querySelector('#fresh').onclick = async () => { if (await U().confirmDialog('Erase everything?', 'Your profile, CVs, applications and letters will be deleted from this browser. Demo job offers stay available.', 'Erase', true)) { MT.seed.startFresh(); MT.matching.invalidate(); U().toast('Fresh start — your chicken is a tiny chick again 🐣', 'info'); location.hash = '#/dashboard'; MT.app.render(); } };
  }

  /* ------------------------------------------------------------ career profile (chicken) */
  function careerProfile() {
    const s = MT.chicken.stats(), lv = MT.chicken.level(s), acc = MT.chicken.currentAccessories(s);
    const j = MT.chicken.journeyPosition(s);
    const cp = MT.chicken.CHECKPOINTS[Math.min(6, Math.floor(j.pos))];
    const m = U().modal({
      title: 'Career Profile', size: 'lg',
      body: '<div class="career-profile"><div class="career-profile__hero">' + MT.chicken.svg({ mood: j.mood, accessories: acc.worn, size: 170, level: lv.current.n }) +
        '<div><p class="eyebrow">' + lv.current.icon + ' Level ' + lv.current.n + '</p><h3 class="display-sm">' + esc(lv.current.name) + '</h3><p>' + esc(lv.current.text) + '</p>' +
        '<div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(lv.pct * 100) + '" aria-label="Progress to next level"><span style="--v:' + Math.round(lv.pct * 100) + '%"></span></div>' +
        '<p class="small">' + lv.xp.toLocaleString('en') + ' XP' + (lv.next ? ' · next: ' + esc(lv.next.name) + (lv.unlockHint ? ' — ' + esc(lv.unlockHint) : ' at ' + lv.next.xp + ' XP') : ' · max level') + '</p>' +
        '<p class="small">Current mission: <strong>' + cp.icon + ' ' + cp.label + '</strong></p></div></div>' +
        '<div class="kpis kpis--sm"><div class="kpi"><span class="kpi__v">' + s.applied + '</span><span class="kpi__l">Applications</span></div><div class="kpi"><span class="kpi__v">' + s.interviews + '</span><span class="kpi__l">Interviews</span></div><div class="kpi"><span class="kpi__v">' + s.offers + '</span><span class="kpi__l">Offers</span></div><div class="kpi"><span class="kpi__v">' + s.letters + '</span><span class="kpi__l">Cover letters</span></div></div>' +
        '<h3 class="h4">Accessories <small class="muted">(wear up to 2 — your chicken stays classy)</small></h3><div class="acc-grid">' + MT.chicken.UNLOCKS.map((u) => {
          const un = acc.unlocked.indexOf(u.id) !== -1, worn = acc.worn.indexOf(u.id) !== -1;
          return '<label class="acc' + (un ? '' : ' is-locked') + (worn ? ' is-worn' : '') + '"><input type="checkbox" data-acc="' + u.id + '"' + (worn ? ' checked' : '') + (un ? '' : ' disabled') + '>' + MT.chicken.svg({ accessories: un ? [u.id] : [], size: 56, animate: false, mood: 'curious' }) + '<span class="small"><strong>' + esc(MT.chicken.ACCESSORIES[u.id].label) + '</strong><br>' + (un ? 'Unlocked' : '🔒 ' + esc(u.when)) + '</span></label>';
        }).join('') + '</div>' +
        '<h3 class="h4">Achievements</h3><div class="ach-grid">' + MT.chicken.ACHIEVEMENTS.map(achCard).join('') + '</div></div>',
      footer: '<button class="btn btn--primary" data-close>Close</button>'
    });
    m.el.querySelector('[data-close]').onclick = m.close;
    U().$$('[data-acc]', m.el).forEach((c) => c.onchange = () => {
      const chosen = U().$$('[data-acc]:checked', m.el).map((x) => x.dataset.acc);
      if (chosen.length > 2) { c.checked = false; U().toast('Two accessories max — a chicken with taste.', 'info'); return; }
      MT.storage.update('settings', {}, (x) => { x.worn = chosen; });
      U().$$('.acc', m.el).forEach((a) => a.classList.toggle('is-worn', a.querySelector('input').checked));
      MT.app.renderChrome();
    });
  }
  function achCard(a) {
    const s = MT.chicken.stats(), ok = a.test(s), pr = a.progress ? a.progress(s) : null;
    return '<article class="ach' + (ok ? ' is-unlocked' : ' is-locked') + '"><span class="ach__icon" aria-hidden="true">' + (ok ? a.icon : '🔒') + '</span><div><strong>' + esc(a.title) + '</strong><p class="small">' + esc(a.text) + '</p>' + (pr && !ok ? '<div class="xpbar xpbar--sm"><span style="--v:' + Math.min(100, Math.round(pr[0] / pr[1] * 100)) + '%"></span></div><p class="small muted">' + pr[0] + ' / ' + pr[1] + '</p>' : '') + '</div><span class="sr-only">' + (ok ? 'Unlocked' : 'Locked') + '</span></article>';
  }

  MT.profile = { render, careerProfile, achCard };
})(window.MT = window.MT || {});
