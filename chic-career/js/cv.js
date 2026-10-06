/* ==========================================================================
   CHIC CAREER — cv.js
   Local CV processing. Files are read in the browser only; the original
   binary is never uploaded anywhere and is not stored — only the extracted
   text and the structured data (which the user can always edit).

   - DOCX: minimal ZIP reader + DecompressionStream('deflate-raw') → document.xml
   - PDF : stream inflater + text-operator reader (+ ToUnicode CMaps)
   - Then a heuristic section parser (FR / EN headings) → structured data.
   The parser only *extracts*; it never fills a gap with invented content.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const K = () => MT.knowledge;
  const MAX_SIZE = 8 * 1024 * 1024;

  /* ================================================================ inflate */
  async function inflate(bytes, format) {
    const ds = new DecompressionStream(format || 'deflate');
    const reader = new Blob([bytes]).stream().pipeThrough(ds).getReader();
    const chunks = []; let len = 0;
    try {
      for (;;) { const r = await reader.read(); if (r.done) break; chunks.push(r.value); len += r.value.length; }
    } catch (e) { if (!len) throw e; } // keep what was decoded before trailing junk
    const out = new Uint8Array(len); let o = 0;
    chunks.forEach((c) => { out.set(c, o); o += c.length; });
    return out;
  }
  function latin1(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return s;
  }

  /* ================================================================ DOCX */
  async function docxText(buf) {
    const b = new Uint8Array(buf);
    const dv = new DataView(buf);
    let eocd = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error('not-zip');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    let entry = null;
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nlen));
      if (name === 'word/document.xml') entry = { method, csize, off };
      p += 46 + nlen + elen + clen;
    }
    if (!entry) throw new Error('no-document-xml');
    const lnl = dv.getUint16(entry.off + 26, true), lel = dv.getUint16(entry.off + 28, true);
    const start = entry.off + 30 + lnl + lel;
    const data = b.subarray(start, start + entry.csize);
    const xmlBytes = entry.method === 8 ? await inflate(data, 'deflate-raw') : data;
    const xml = new TextDecoder('utf-8').decode(xmlBytes);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const lines = [];
    Array.from(doc.getElementsByTagNameNS(W, 'p')).forEach((para) => {
      let t = '';
      const walk = (node) => {
        node.childNodes.forEach((c) => {
          if (c.nodeType !== 1) return;
          if (c.localName === 't') t += c.textContent;
          else if (c.localName === 'tab') t += '\t';
          else if (c.localName === 'br') t += '\n';
          else walk(c);
        });
      };
      walk(para);
      const pStyle = para.getElementsByTagNameNS(W, 'pStyle')[0];
      const isList = para.getElementsByTagNameNS(W, 'numPr').length > 0 || (pStyle && /list|puce|bullet/i.test(pStyle.getAttributeNS(W, 'val') || pStyle.getAttribute('w:val') || ''));
      if (t.trim()) lines.push((isList ? '• ' : '') + t.trim());
      else lines.push('');
    });
    return lines.join('\n');
  }

  /* ================================================================ PDF */
  function pdfUnescape(s) {
    return s.replace(/\\([nrtbf()\\]|[0-7]{1,3}|\r?\n)/g, (m, g) => {
      if (/^[0-7]+$/.test(g)) return String.fromCharCode(parseInt(g, 8));
      return { n: '\n', r: '', t: '\t', b: '', f: '', '(': '(', ')': ')', '\\': '\\' }[g] !== undefined ? { n: '\n', r: '', t: '\t', b: '', f: '', '(': '(', ')': ')', '\\': '\\' }[g] : '';
    });
  }
  function parseCMap(txt) {
    const map = {};
    const hex = (h) => parseInt(h, 16);
    const uni = (h) => { let s = ''; for (let i = 0; i + 4 <= h.length; i += 4) s += String.fromCharCode(hex(h.substr(i, 4))); if (h.length === 2) s = String.fromCharCode(hex(h)); return s; };
    (txt.match(/beginbfchar([\s\S]*?)endbfchar/g) || []).forEach((block) => {
      (block.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || []).forEach((pair) => {
        const m = pair.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/); map[hex(m[1])] = uni(m[2]);
      });
    });
    (txt.match(/beginbfrange([\s\S]*?)endbfrange/g) || []).forEach((block) => {
      const re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<([0-9A-Fa-f]+)>|\[([^\]]*)\])/g; let m;
      while ((m = re.exec(block))) {
        const a = hex(m[1]), z = hex(m[2]);
        if (m[4]) { const base = hex(m[4]); for (let c = a; c <= z; c++) map[c] = String.fromCharCode(base + (c - a)); }
        else { const arr = (m[5].match(/<([0-9A-Fa-f]+)>/g) || []).map((x) => uni(x.slice(1, -1))); for (let c = a; c <= z; c++) map[c] = arr[c - a] || ''; }
      }
    });
    return map;
  }

  async function pdfText(buf) {
    const bytes = new Uint8Array(buf);
    const s = latin1(bytes);
    const objects = {}; // num -> { dict, data(decoded string|null) }
    const objRe = /(\d+)\s+0\s+obj\b/g; let m;
    const positions = [];
    while ((m = objRe.exec(s))) positions.push({ num: +m[1], at: m.index + m[0].length });
    for (let i = 0; i < positions.length; i++) {
      const { num, at } = positions[i];
      const end = s.indexOf('endobj', at);
      const body = s.slice(at, end < 0 ? (positions[i + 1] ? positions[i + 1].at : s.length) : end);
      const si = body.search(/stream\r?\n/);
      if (si < 0) { objects[num] = { dict: body, data: null }; continue; }
      const dict = body.slice(0, si);
      const hdr = body.slice(si).match(/^stream\r?\n/)[0].length;
      let dataStart = at + si + hdr;
      const lenM = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
      let dataEnd = lenM ? dataStart + parseInt(lenM[1], 10) : at + body.lastIndexOf('endstream');
      let raw = bytes.subarray(dataStart, dataEnd);
      while (raw.length && (raw[raw.length - 1] === 10 || raw[raw.length - 1] === 13)) raw = raw.subarray(0, raw.length - 1);
      let data = null;
      try {
        if (/\/ASCII85Decode|\/A85/.test(dict)) raw = ascii85(raw);
        if (/\/FlateDecode|\/Fl\b/.test(dict)) data = latin1(await inflate(raw, 'deflate'));
        else if (!/\/Filter/.test(dict) || /\/ASCII85Decode/.test(dict)) data = latin1(raw);
      } catch (e) { data = null; }
      objects[num] = { dict, data };
    }
    // unpack object streams (PDF 1.5+)
    Object.keys(objects).forEach((k) => {
      const o = objects[k];
      if (!/\/Type\s*\/ObjStm/.test(o.dict) || !o.data) return;
      const n = +(o.dict.match(/\/N\s+(\d+)/) || [])[1], first = +(o.dict.match(/\/First\s+(\d+)/) || [])[1];
      const nums = o.data.slice(0, first).trim().split(/\s+/).map(Number);
      for (let i = 0; i < n; i++) {
        const onum = nums[i * 2], off = nums[i * 2 + 1], next = i + 1 < n ? nums[i * 2 + 3] : o.data.length - first;
        if (!objects[onum]) objects[onum] = { dict: o.data.slice(first + off, first + next), data: null };
      }
    });
    // fonts → ToUnicode maps, resource names → fonts
    const fontMaps = {};
    Object.keys(objects).forEach((k) => {
      const tu = objects[k].dict.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
      if (tu && objects[tu[1]] && objects[tu[1]].data) fontMaps[k] = parseCMap(objects[tu[1]].data);
    });
    const nameToFont = {};
    Object.keys(objects).forEach((k) => {
      const d = objects[k].dict;
      const re = /\/([A-Za-z0-9_.+-]+)\s+(\d+)\s+0\s+R/g; let r;
      while ((r = re.exec(d))) if (fontMaps[r[2]]) nameToFont[r[1]] = fontMaps[r[2]];
    });
    // content streams: anything with text operators
    const out = [];
    Object.keys(objects).sort((a, b) => a - b).forEach((k) => {
      const o = objects[k];
      if (!o.data || !/BT[\s\S]*?ET/.test(o.data) || /\/Type\s*\/(XRef|ObjStm)/.test(o.dict)) return;
      out.push(readContent(o.data, nameToFont));
    });
    return out.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  }

  function ascii85(bytes) {
    let s = latin1(bytes).replace(/\s+/g, '');
    if (s.indexOf('<~') === 0) s = s.slice(2);
    const end = s.indexOf('~>'); if (end !== -1) s = s.slice(0, end);
    const out = [];
    for (let i = 0; i < s.length;) {
      if (s[i] === 'z') { out.push(0, 0, 0, 0); i++; continue; }
      const chunk = s.slice(i, i + 5); i += 5;
      const pad = 5 - chunk.length;
      let v = 0;
      for (let k = 0; k < 5; k++) v = v * 85 + ((k < chunk.length ? chunk.charCodeAt(k) : 117) - 33);
      const b = [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
      for (let k = 0; k < 4 - pad; k++) out.push(b[k]);
    }
    return new Uint8Array(out);
  }

  function readContent(c, nameToFont) {
    let text = '', font = null, lastY = null;
    const decodeHex = (h) => {
      h = h.replace(/\s+/g, '');
      if (font) { let r = ''; const step = h.length % 4 === 0 && Object.keys(font).some((x) => +x > 255) ? 4 : 2; for (let i = 0; i < h.length; i += step) r += font[parseInt(h.substr(i, step), 16)] || ''; return r; }
      let r = ''; for (let i = 0; i < h.length; i += 2) r += String.fromCharCode(parseInt(h.substr(i, 2), 16)); return r;
    };
    const WIN = { 128: '€', 133: '…', 145: '‘', 146: '’', 147: '“', 148: '”', 149: '•', 150: '–', 151: '—', 153: '™', 156: 'œ', 140: 'Œ' };
    const decodeLit = (l) => {
      const u = pdfUnescape(l);
      if (font) { let r = ''; for (let i = 0; i < u.length; i++) r += font[u.charCodeAt(i)] !== undefined ? font[u.charCodeAt(i)] : u[i]; return r; }
      return u.replace(/[\x80-\x9f]/g, (ch) => WIN[ch.charCodeAt(0)] || ''); // WinAnsiEncoding
    };
    const tokRe = /\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>|\[|\]|\/[^\s/\[\]()<>]+|-?\d*\.?\d+|[A-Za-z'"*]+/g;
    let stack = [], arr = null, t;
    while ((t = tokRe.exec(c))) {
      const v = t[0];
      if (v === '[') { arr = []; continue; }
      if (v === ']') { stack.push({ arr }); arr = null; continue; }
      const val = v[0] === '(' ? { s: decodeLit(v.slice(1, -1)) } : v[0] === '<' ? { s: decodeHex(v.slice(1, -1)) } : v[0] === '/' ? { name: v.slice(1) } : /^-?\d*\.?\d+$/.test(v) ? { n: parseFloat(v) } : { op: v };
      if (arr && !val.op) { arr.push(val); continue; }
      if (!val.op) { stack.push(val); continue; }
      const op = val.op;
      if (op === 'Tf') { const nm = stack[stack.length - 2]; font = nm && nm.name ? (nameToFont[nm.name] || null) : null; }
      else if (op === 'Tj' || op === "'" || op === '"') { const x = stack[stack.length - 1]; if (op !== 'Tj') text += '\n'; if (x && x.s !== undefined) text += x.s; }
      else if (op === 'TJ') {
        const a = (stack[stack.length - 1] || {}).arr || [];
        a.forEach((x) => { if (x.s !== undefined) text += x.s; else if (x.n !== undefined && x.n < -180) text += ' '; });
      } else if (op === 'Td' || op === 'TD') { const ty = (stack[stack.length - 1] || {}).n || 0; if (Math.abs(ty) > 0.5) text += '\n'; else text += ' '; }
      else if (op === 'Tm') { const y = (stack[stack.length - 1] || {}).n; if (lastY !== null && Math.abs(y - lastY) > 0.5) text += '\n'; else if (lastY !== null) text += ' '; lastY = y; }
      else if (op === 'T*') text += '\n';
      else if (op === 'ET') text += '\n';
      stack = [];
    }
    return text;
  }

  /* ================================================================ file entry point */
  async function extractFile(file) {
    if (!file) throw friendly('No file selected.');
    const name = file.name || '';
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'doc') throw friendly('Old Word files (.doc) aren’t supported. Save your CV as .docx or .pdf and try again.');
    if (ext !== 'pdf' && ext !== 'docx') throw friendly('Unsupported format “.' + ext + '”. Please upload a PDF or DOCX CV.');
    if (file.size === 0) throw friendly('This file is empty. Please choose another CV.');
    if (file.size > MAX_SIZE) throw friendly('This file is larger than 8 MB. Please export a lighter version of your CV.');
    if (typeof DecompressionStream === 'undefined') throw friendly('Your browser can’t read compressed files. Paste your CV text instead.');
    const buf = await file.arrayBuffer();
    const head = latin1(new Uint8Array(buf.slice(0, 5)));
    let text = '';
    try {
      if (ext === 'pdf') {
        if (head.indexOf('%PDF') !== 0) throw friendly('This doesn’t look like a valid PDF file.');
        text = await pdfText(buf);
      } else {
        if (head.indexOf('PK') !== 0) throw friendly('This doesn’t look like a valid DOCX file.');
        text = await docxText(buf);
      }
    } catch (e) {
      if (e.friendly) throw e;
      console.error(e);
      throw friendly('We couldn’t read this file. It may be damaged or protected. You can paste your CV text instead.');
    }
    const letters = (text.match(/[A-Za-zÀ-ÿ]/g) || []).length;
    if (letters < 80) {
      const err = friendly('We couldn’t find readable text in this file (it may be a scanned image or use embedded fonts). Paste your CV text below so nothing is lost.');
      err.partialText = text;
      throw err;
    }
    return text;
  }
  function friendly(msg) { const e = new Error(msg); e.friendly = true; return e; }

  /* ================================================================ section parser */
  const HEADINGS = [
    ['education', /^(formations?|education|études|etudes|diplomes?|diplômes?|parcours academique|academic background|cursus)$/],
    ['experience', /^(experiences?( professionnelles?)?|expériences?( professionnelles?)?|professional experience|work experience|employment|parcours professionnel|experience)$/],
    ['internships', /^(stages?|internships?|alternances?)$/],
    ['projects', /^(projets?( academiques| académiques| personnels)?|projects?|academic projects|realisations|réalisations)$/],
    ['skills', /^(competences?|compétences?|skills|hard skills|soft skills|savoir faire|savoir-faire|expertise)$/],
    ['tools', /^(outils|tools|logiciels|software|informatique|it skills|stack)$/],
    ['languages', /^(langues?|languages?)$/],
    ['certifications', /^(certifications?|certificats?|certificates?)$/],
    ['achievements', /^(achievements?|accomplishments?|reussites|réussites|resultats|résultats|prix|awards?)$/],
    ['interests', /^(centres? d.interets?|centres? d.intérêts?|interests|hobbies|loisirs|activites|activités)$/]
  ];
  const BULLET = /^\s*[•\-–—▪●◦*·►✓]\s*/;
  const DATE = /((janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|été|ete|summer|spring|autumn|hiver|winter|printemps)[a-zé.]*\s*)?(19|20)\d{2}(\s*[–\-—àto]+\s*((janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec|jan|feb|mar|apr|may|jun|jul|aug|sep)[a-zé.]*\s*)?((19|20)\d{2}|present|présent|aujourd.hui|now|en cours))?/i;
  const CITIES = ['Lyon', 'Paris', 'Marseille', 'Lille', 'Bordeaux', 'Toulouse', 'Nantes', 'Grenoble', 'Nice', 'Rennes', 'Strasbourg', 'Montpellier', 'London', 'Londres', 'Remote', 'Barcelona', 'Madrid', 'Berlin', 'Bruxelles', 'Genève', 'Geneva'];

  function headingOf(line) {
    const n = U().norm(line).replace(/[:]/g, '').trim();
    if (!n || line.length > 45) return null;
    const h = HEADINGS.find((x) => x[1].test(n));
    return h ? h[0] : null;
  }
  function splitList(text) {
    const seen = new Set();
    return text.split(/\n|,|;|•|\||·/).map((x) => x.replace(BULLET, '').trim()).filter((x) => {
      const k = U().norm(x);
      if (!x || x.length >= 60 || seen.has(k)) return false;
      seen.add(k); return true;
    });
  }
  function parseEntryHeader(line) {
    const dateM = line.match(DATE);
    const dates = dateM ? dateM[0].trim() : '';
    let rest = dates ? line.replace(dateM[0], '') : line;
    rest = rest.replace(/[\s—–\-|,]+$/, '').trim();
    const parts = rest.split(/\s+[—–\-|@]\s+|\s+chez\s+|\s+at\s+|\t+/).map((x) => x.trim()).filter(Boolean);
    let role = parts[0] || rest, company = parts[1] || '', location = '';
    const tail = parts.slice(2).join(' ');
    const city = CITIES.find((c) => (company + ' ' + tail).indexOf(c) !== -1);
    if (city) { location = city; company = company.replace(new RegExp(',?\\s*' + city), '').trim(); }
    const paren = company.match(/\(([^)]+)\)/);
    const industryText = paren ? paren[1] : '';
    company = company.replace(/\([^)]*\)/, '').replace(/[,\s]+$/, '').trim();
    const industry = K().detectIndustries(industryText + ' ' + company + ' ' + role)[0] || '';
    const type = /stage|stagiaire|intern/i.test(role) ? 'internship' : /alternan|apprenti/i.test(role) ? 'apprenticeship' : /benevol|bénévol|volunt/i.test(role) ? 'volunteer' : 'job';
    return { role, company, location, dates, industry, type };
  }

  function parseText(text) {
    const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim());
    const sections = { header: [] };
    let cur = 'header';
    lines.forEach((l) => {
      if (!l) return;
      const h = headingOf(l);
      if (h) { cur = h; sections[cur] = sections[cur] || []; return; }
      (sections[cur] = sections[cur] || []).push(l);
    });

    function entries(list, kind) {
      const out = [];
      let e = null;
      (list || []).forEach((l) => {
        const isBullet = BULLET.test(l);
        if (!isBullet && l.length < 160 && (DATE.test(l) || (kind === 'project' && /\s[—–|]\s/.test(l)))) {
          e = kind === 'project'
            ? { id: U().hash(l).toString(36), title: l.replace(DATE, '').replace(/[\s—–\-|]+$/, '').trim(), context: (l.match(DATE) || [''])[0], bullets: [], industry: K().detectIndustries(l)[0] || '' }
            : Object.assign({ id: 'exp_' + U().hash(l).toString(36), bullets: [] }, parseEntryHeader(l));
          out.push(e);
        } else if (e) {
          e.bullets.push(l.replace(BULLET, ''));
        } else if (kind === 'project') {
          e = { id: U().hash(l).toString(36), title: l.replace(BULLET, ''), context: '', bullets: [], industry: '' }; out.push(e);
        }
      });
      out.forEach((x) => { if (!x.industry) x.industry = K().detectIndustries((x.bullets || []).join(' '))[0] || ''; });
      return out;
    }

    const education = (sections.education || []).filter((l) => !BULLET.test(l)).map((l) => {
      const dates = (l.match(DATE) || [''])[0];
      const parts = l.replace(dates, '').split(/\s+[—–\-|]\s+|,\s+/).map((x) => x.trim()).filter(Boolean);
      const degree = parts[0] || l;
      const level = /(msc|master|mba|bac\s*\+\s*5|grande ecole|grande école|m2)/i.test(l) ? 5 : /(m1|bac\s*\+\s*4)/i.test(l) ? 4 : /(licence|bachelor|bba|bac\s*\+\s*3|l3)/i.test(l) ? 3 : /(bts|dut|but|bac\s*\+\s*2)/i.test(l) ? 2 : 1;
      return { degree, school: parts.slice(1).join(', '), dates: dates.trim(), level };
    });

    const experience = entries(sections.experience, 'experience').concat(entries(sections.internships, 'experience').map((x) => Object.assign(x, { type: x.type === 'job' ? 'internship' : x.type })));
    const projects = entries(sections.projects, 'project');
    const skillsText = (sections.skills || []).join('\n');
    const toolsText = (sections.tools || []).join('\n');
    let skills = splitList(skillsText);
    let tools = splitList(toolsText);
    const detectedTools = K().detectTools(text);
    detectedTools.forEach((t) => { if (!tools.some((x) => U().norm(x) === U().norm(t))) tools.push(t); });
    skills = skills.filter((s) => !tools.some((t) => U().norm(t) === U().norm(s)));
    const langText = (sections.languages || []).join('\n') || text;
    const languages = K().detectLanguages(langText);
    const certifications = splitList((sections.certifications || []).join('\n'));
    const allBullets = experience.concat(projects).reduce((a, e) => a.concat(e.bullets || []), []);
    const results = allBullets.filter((b) => /[+\-]?\d+([.,]\d+)?\s?%|\+\s?\d+|\d+\s?(k€|€|k|abonnés|followers|articles|créateurs|creators|clients|réponses|responses|participants|vues|views)/i.test(b));
    const achievements = (sections.achievements || []).map((l) => l.replace(BULLET, '')).concat(results);
    const industries = Array.from(new Set(experience.map((e) => e.industry).filter(Boolean)));

    const header = sections.header || [];
    const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [''])[0];
    const phone = (text.match(/(\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/) || [''])[0];
    const detectedSkillKeys = K().detectSkills(text);

    return {
      contact: { name: header[0] || '', email, phone },
      education, experience, projects, skills, tools, languages, certifications,
      achievements: Array.from(new Set(achievements)),
      jobTitles: experience.map((e) => e.role).filter(Boolean),
      industries,
      detectedSkillKeys,
      sectionsFound: Object.keys(sections).filter((s) => s !== 'header' && s !== 'interests')
    };
  }

  /* ================================================================ CV store */
  function list() { return MT.storage.get('cvs', []); }
  function active() { return list().filter((c) => !c.archived); }
  function getDefault() { const l = active(); return l.find((c) => c.isDefault) || l[0] || null; }

  function add(o) {
    const cvs = list();
    const sameName = cvs.filter((c) => U().norm(c.name) === U().norm(o.name));
    const version = sameName.length ? Math.max.apply(null, sameName.map((c) => c.version || 1)) + 1 : 1;
    sameName.forEach((c) => { c.archived = true; if (c.isDefault) { c.isDefault = false; o.isDefault = true; } });
    const rec = {
      id: MT.storage.uid('cv'), name: o.name, filename: o.filename || 'pasted-text.txt', version,
      targetRole: o.targetRole || '', uploadDate: Date.now(), size: o.size || 0, sourceType: o.sourceType || 'upload',
      text: o.text, parsedData: o.parsedData || parseText(o.text), isDefault: !!o.isDefault || !active().length, archived: false
    };
    if (rec.isDefault) cvs.forEach((c) => { c.isDefault = false; });
    cvs.push(rec);
    MT.storage.set('cvs', cvs);
    return rec;
  }
  function setDefault(id) { MT.storage.update('cvs', [], (cvs) => { cvs.forEach((c) => { c.isDefault = c.id === id; }); }); }
  function remove(id) {
    MT.storage.update('cvs', [], (cvs) => {
      const wasDefault = (cvs.find((c) => c.id === id) || {}).isDefault;
      const next = cvs.filter((c) => c.id !== id);
      if (wasDefault) { const a = next.find((c) => !c.archived); if (a) a.isDefault = true; }
      return next;
    });
  }
  function update(id, patch) { MT.storage.update('cvs', [], (cvs) => { const c = cvs.find((x) => x.id === id); if (c) Object.assign(c, patch); }); }
  function label(cv) { return cv ? cv.name + ' · v' + (cv.version || 1) : '—'; }

  MT.cv = { extractFile, parseText, docxText, pdfText, list, active, getDefault, add, setDefault, remove, update, label, MAX_SIZE };
})(window.MT = window.MT || {});
