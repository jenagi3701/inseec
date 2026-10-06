/* ==========================================================================
   MARKETRACK — adapters.js
   Job Data Service + one replaceable adapter per platform.

       Daily scheduler → JobDataService.refresh()
           → adapters[].fetchRaw()     (platform-shaped records)
           → adapter.normalize()       (common Job shape)
           → dedupe()                  (same offer on several platforms)
           → upsert()                  (new / updated / expired / already seen)
           → storage + dashboard update

   IMPORTANT: no adapter here talks to LinkedIn, Indeed or Welcome to the
   Jungle. They run in DEMO mode on the fictional catalogue in data.js.
   No scraping is implemented. To go live, replace an adapter's `fetchRaw`
   with a call to an official API / authorised partner feed (through a
   backend that holds the credentials) and set `mode: 'live'`.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const DAY = 86400000;

  function searchUrl(source, q, city) {
    const e = encodeURIComponent;
    if (source === 'linkedin') return 'https://www.linkedin.com/jobs/search/?keywords=' + e(q) + (city && city !== 'Remote' ? '&location=' + e(city) : '');
    if (source === 'indeed') return 'https://fr.indeed.com/jobs?q=' + e(q) + (city && city !== 'Remote' ? '&l=' + e(city) : '');
    return 'https://www.welcometothejungle.com/fr/jobs?query=' + e(q);
  }

  /* ----- Demo catalogue access (would be a network call in a live adapter) ----- */
  function demoOffersFor(source, cycle) {
    const out = [];
    MT.demo.OFFERS.forEach((o) => {
      if (o.reserve && o.reserve > cycle) return;            // not "published" yet
      (o.listings || []).forEach((l, i) => {
        if (l.src !== source) return;
        out.push({ offer: o, listing: l, idx: i });
      });
    });
    return out;
  }
  // Simulated content changes so that "updated offers" can be demonstrated.
  function simulatedChanges(o, cycle) {
    const c = { salary: o.salary, expiredDaysAgo: o.expiredDaysAgo };
    if (o.key === 'sauge-crm' && cycle >= 1) c.salary = { min: 1200, max: 1250 };
    if (o.key === 'quanta-data' && cycle >= 2) c.expiredDaysAgo = 0;
    return c;
  }

  /* ================================================================== Adapters */
  const LinkedInAdapter = {
    id: 'linkedin', label: 'LinkedIn', mode: 'demo',
    describe: 'Demo adapter. A live version would use an official LinkedIn partner integration via a backend — never scraping.',
    fetchRaw: function (ctx) {
      return demoOffersFor('linkedin', ctx.cycle).map(({ offer: o, listing: l }) => {
        const ch = simulatedChanges(o, ctx.cycle);
        const posted = ctx.base - l.daysAgo * DAY;
        return {
          entityUrn: 'urn:li:demoJob:' + U().hash(o.key + 'li'),
          jobTitle: l.title || o.title,
          companyName: o.company,
          companyDescription: o.companyAbout,
          formattedLocation: o.city === 'Remote' ? 'France (Remote)' : o.city + ', France',
          workplaceType: { remote: 'REMOTE', hybrid: 'HYBRID', onsite: 'ON_SITE' }[o.workMode],
          employmentType: /alternance|apprentice/i.test(o.contract) ? 'APPRENTICESHIP' : 'INTERNSHIP',
          durationText: o.duration + ' months',
          compensation: ch.salary ? { min: ch.salary.min, max: ch.salary.max, period: 'MONTHLY', currency: 'EUR' } : null,
          listedAt: posted,
          expireAt: ch.expiredDaysAgo !== undefined ? ctx.base - ch.expiredDaysAgo * DAY : posted + 45 * DAY,
          descriptionText: o.description,
          _structured: o, // demo-only: the catalogue already carries structured requirements
          applyUrl: searchUrl('linkedin', o.title + ' ' + o.company, o.city)
        };
      });
    },
    normalize: function (r) {
      const o = r._structured;
      return baseJob(o, {
        source: 'linkedin', externalId: r.entityUrn, title: r.jobTitle, company: r.companyName,
        companyAbout: r.companyDescription, location: r.formattedLocation === 'France (Remote)' ? 'Remote' : r.formattedLocation.split(',')[0],
        workMode: { REMOTE: 'remote', HYBRID: 'hybrid', ON_SITE: 'onsite' }[r.workplaceType],
        salary: r.compensation ? { min: r.compensation.min, max: r.compensation.max } : null,
        publishedAt: r.listedAt, expiresAt: r.expireAt, description: r.descriptionText, url: r.applyUrl
      });
    }
  };

  const IndeedAdapter = {
    id: 'indeed', label: 'Indeed', mode: 'demo',
    describe: 'Demo adapter. A live version would use an authorised Indeed partner/XML feed via a backend.',
    fetchRaw: function (ctx) {
      return demoOffersFor('indeed', ctx.cycle).map(({ offer: o, listing: l }) => {
        const ch = simulatedChanges(o, ctx.cycle);
        return {
          jobkey: 'demo' + U().hash(o.key + 'in').toString(16),
          title: l.title || o.title,
          company: o.company,
          formattedLocation: o.city === 'Remote' ? 'Télétravail' : o.city + ' (' + ({ Lyon: '69', Paris: '75', Marseille: '13', Grenoble: '38' }[o.city] || '') + ')',
          remote: o.workMode,
          jobTypes: [o.contract + ' — ' + o.duration + ' mois'],
          salarySnippet: ch.salary ? (ch.salary.min === ch.salary.max ? ch.salary.min + ' € par mois' : ch.salary.min + ' € - ' + ch.salary.max + ' € par mois') : '',
          date: new Date(ctx.base - l.daysAgo * DAY).toISOString(),
          expired: ch.expiredDaysAgo !== undefined,
          snippet: o.description,
          _structured: o,
          url: searchUrl('indeed', o.title + ' ' + o.company, o.city)
        };
      });
    },
    normalize: function (r) {
      const o = r._structured;
      const nums = (r.salarySnippet.match(/\d[\d\s]*/g) || []).map((n) => parseInt(n.replace(/\s/g, ''), 10));
      return baseJob(o, {
        source: 'indeed', externalId: r.jobkey, title: r.title, company: r.company, companyAbout: o.companyAbout,
        location: r.formattedLocation === 'Télétravail' ? 'Remote' : r.formattedLocation.replace(/\s*\(.*\)/, ''),
        workMode: r.remote,
        salary: nums.length ? { min: nums[0], max: nums[1] || nums[0] } : null,
        publishedAt: Date.parse(r.date), expiresAt: r.expired ? Date.now() - DAY : Date.parse(r.date) + 45 * DAY,
        description: r.snippet, url: r.url
      });
    }
  };

  const WTTJAdapter = {
    id: 'wttj', label: 'Welcome to the Jungle', mode: 'demo',
    describe: 'Demo adapter. A live version would use an official Welcome to the Jungle partner integration via a backend.',
    fetchRaw: function (ctx) {
      return demoOffersFor('wttj', ctx.cycle).map(({ offer: o, listing: l }) => {
        const ch = simulatedChanges(o, ctx.cycle);
        return {
          reference: 'WTTJ-DEMO-' + U().hash(o.key + 'wt').toString(36).toUpperCase(),
          name: l.title || o.title,
          organization: { name: o.company, description: o.companyAbout },
          office: { city: o.city },
          contract_type: /alternance|apprentice/i.test(o.contract) ? 'apprenticeship' : 'internship',
          contract_duration_min: o.duration,
          remote: { remote: 'full', hybrid: 'partial', onsite: 'no' }[o.workMode],
          salary_min: ch.salary ? ch.salary.min : null, salary_max: ch.salary ? ch.salary.max : null,
          published_at: new Date(ctx.base - l.daysAgo * DAY).toISOString(),
          archived: ch.expiredDaysAgo !== undefined,
          description: o.description,
          _structured: o,
          url: searchUrl('wttj', o.title + ' ' + o.company)
        };
      });
    },
    normalize: function (r) {
      const o = r._structured;
      return baseJob(o, {
        source: 'wttj', externalId: r.reference, title: r.name, company: r.organization.name, companyAbout: r.organization.description,
        location: r.office.city, workMode: { full: 'remote', partial: 'hybrid', no: 'onsite' }[r.remote],
        salary: r.salary_min ? { min: r.salary_min, max: r.salary_max } : null,
        publishedAt: Date.parse(r.published_at), expiresAt: r.archived ? Date.now() - DAY : Date.parse(r.published_at) + 45 * DAY,
        description: r.description, url: r.url
      });
    }
  };

  /** Build the common Job shape from normalised fields (+ structured demo requirements). */
  function baseJob(o, f) {
    return {
      title: f.title, company: f.company, companyAbout: f.companyAbout || '', location: f.location,
      workMode: f.workMode, contractType: o.contract, duration: o.duration, salary: f.salary,
      language: o.language, fields: o.fields.slice(), industry: o.industry, industryRequired: o.industryRequired || null,
      description: f.description || '', responsibilities: o.responsibilities.slice(),
      requirements: { required: o.required.slice(), preferred: o.preferred.slice(), tools: o.tools.slice(), languages: o.languages.slice(), qualifications: o.qualifications.slice(), experience: o.experience },
      publishedAt: f.publishedAt, expiresAt: f.expiresAt,
      sources: [{ source: f.source, externalId: f.externalId, url: f.url, title: f.title, publishedAt: f.publishedAt }],
      demo: true
    };
  }

  const ADAPTERS = [LinkedInAdapter, IndeedAdapter, WTTJAdapter];
  const SOURCE_LABEL = { linkedin: 'LinkedIn', indeed: 'Indeed', wttj: 'Welcome to the Jungle' };

  /* ================================================================== Dedupe */
  const TITLE_NOISE = ['h f', 'hf', 'f h', 'stage', 'stagiaire', 'intern', 'internship', 'alternance', 'alternant', 'alternante', 'apprentice', 'apprenticeship', 'e', 'months', 'mois', 'remote', '6', '12', 'x', 'de', 'du', 'des', 'la', 'le', 'en', 'et', 'and', 'the'];
  function titleTokens(t) {
    return U().tokens(String(t).replace(/\(e\)|\(h\/f\)|h\/f|f\/h|\(.*?\)/gi, ' ')).filter((w) => TITLE_NOISE.indexOf(w) === -1)
      .map((w) => w.replace(/s$/, '').replace(/e$/, ''));
  }
  function isDuplicate(a, b) {
    if (U().norm(a.company) !== U().norm(b.company)) return false;
    const sameCity = U().norm(a.location) === U().norm(b.location);
    const titleSim = U().jaccard(titleTokens(a.title), titleTokens(b.title));
    const descSim = U().jaccard(U().tokens(a.description), U().tokens(b.description));
    const sameUrl = a.sources.some((s) => b.sources.some((t) => s.url && s.url === t.url));
    return sameUrl || (sameCity && titleSim >= 0.5) || (titleSim >= 0.34 && descSim >= 0.6);
  }
  function titleNoise(t) { return (/h\/f|f\/h/i.test(t) ? 10 : 0) + (/^(stage|stagiaire|alternant)|\s-\s(stage|alternance)|\(\d+ (months|mois)\)|\(remote\)/i.test(t) ? 6 : 0) + t.length / 100; }
  function mergeInto(target, dup) {
    if (titleNoise(dup.title) < titleNoise(target.title)) target.title = dup.title;
    dup.sources.forEach((s) => {
      if (!target.sources.some((x) => x.source === s.source && x.externalId === s.externalId)) target.sources.push(s);
    });
    target.publishedAt = Math.min(target.publishedAt, dup.publishedAt);
    target.expiresAt = Math.max(target.expiresAt || 0, dup.expiresAt || 0);
    if (!target.salary && dup.salary) target.salary = dup.salary;
  }
  function dedupe(list) {
    const out = [];
    let merged = 0;
    list.forEach((j) => {
      const twin = out.find((x) => isDuplicate(x, j));
      if (twin) { mergeInto(twin, j); merged++; } else out.push(j);
    });
    return { jobs: out, merged };
  }

  /* ================================================================== Service */
  const JobDataService = {
    adapters: ADAPTERS,
    SOURCE_LABEL,
    searchUrl,

    all: function () { return MT.storage.get('jobs', []); },
    get: function (id) { return this.all().find((j) => j.id === id) || null; },
    meta: function () { return MT.storage.get('meta', {}); },

    /** Fetch from every adapter → normalise → dedupe → upsert. Returns a report. */
    refresh: function (opts) {
      opts = opts || {};
      const meta = this.meta();
      const cycle = opts.initial ? 0 : (meta.cycle || 0) + 1;
      const base = opts.initial ? Date.now() : (meta.catalogueBase || Date.now());
      const ctx = { cycle, base };
      const seen = new Set(MT.storage.get('seenJobIds', []));
      let raw = 0, alreadySeen = 0, errors = [];

      const normalised = [];
      ADAPTERS.forEach((a) => {
        try {
          a.fetchRaw(ctx).forEach((r) => {
            raw++;
            const j = a.normalize(r);
            if (!j.title || !j.company) return; // reject incomplete offers
            const ext = j.sources[0].externalId;
            if (seen.has(ext)) alreadySeen++; else seen.add(ext);
            normalised.push(j);
          });
        } catch (e) { errors.push(a.label); console.error(e); }
      });

      const { jobs: fresh, merged } = dedupe(normalised);
      const existing = this.all();
      const report = { newJobs: 0, updated: 0, expired: 0, duplicates: merged, raw, alreadySeen, errors, at: Date.now() };
      const now = Date.now();

      fresh.forEach((f) => {
        const old = existing.find((e) => isDuplicate(e, f));
        if (!old) {
          f.id = 'job_' + U().hash(U().norm(f.company) + '|' + U().norm(f.location) + '|' + f.sources[0].externalId).toString(36);
          f.firstSeenAt = opts.initial ? f.publishedAt : now;
          f.updatedAt = now;
          f.status = f.expiresAt < now ? 'expired' : 'active';
          existing.push(f);
          report.newJobs++;
        } else {
          const changed = JSON.stringify(old.salary) !== JSON.stringify(f.salary) || old.description !== f.description;
          f.sources.forEach((s) => { if (!old.sources.some((x) => x.externalId === s.externalId)) old.sources.push(s); });
          if (changed) { old.salary = f.salary; old.description = f.description; old.updatedAt = now; old.changeNote = 'Updated on ' + U().fmtShort(now); report.updated++; }
          old.expiresAt = f.expiresAt;
        }
      });
      // expiry pass (offers are never deleted — history must survive)
      existing.forEach((j) => {
        if (j.status !== 'expired' && j.expiresAt && j.expiresAt < now) { j.status = 'expired'; j.expiredAt = now; report.expired++; }
      });

      MT.storage.set('jobs', existing);
      MT.storage.set('seenJobIds', Array.from(seen));
      MT.storage.set('meta', Object.assign(meta, { cycle, catalogueBase: base, lastRefresh: now, lastReport: report }));
      return report;
    },

    /** Prototype "daily scheduler": runs once per calendar day when the app is open. */
    startScheduler: function (onRun) {
      const check = () => {
        const m = this.meta();
        if (!m.lastRefresh || U().isoDay(m.lastRefresh) !== U().isoDay(Date.now())) {
          const r = this.refresh({ auto: true });
          if (onRun) onRun(r, true);
        }
      };
      check();
      setInterval(check, 30 * 60 * 1000);
    },

    isNew: function (job) { return job.firstSeenAt && U().daysBetween(job.firstSeenAt, Date.now()) <= 0 || U().daysBetween(job.publishedAt, Date.now()) <= 0; },
    preferredSource: function (job) {
      const saved = (MT.storage.get('settings', {}).preferredSources || {})[job.id];
      return job.sources.find((s) => s.source === saved) || job.sources[0];
    },
    setPreferredSource: function (jobId, source) {
      MT.storage.update('settings', {}, (s) => { s.preferredSources = s.preferredSources || {}; s.preferredSources[jobId] = source; });
    },
    _isDuplicate: isDuplicate,
    _dedupe: dedupe
  };

  MT.jobsService = JobDataService;
})(window.MT = window.MT || {});
