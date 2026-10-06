/* ==========================================================================
   CHIC CAREER — statistics.js
   Application statistics. Charts are plain HTML/SVG (no library):
   single-series bars in one hue, hover/focus tooltips, and a data table
   for every chart. Everything recomputes from the tracker on each render.
   ========================================================================== */
(function (MT) {
  'use strict';
  const U = () => MT.ui;
  const esc = (s) => MT.ui.esc(s);
  const CH = () => MT.chicken;

  function compute() {
    const apps = MT.applications.all();
    const sent = apps.filter((a) => CH().maxStage(a) >= 1 || a.applicationDate);
    const responded = sent.filter((a) => CH().maxStage(a) >= 3 || a.status === 'rejected');
    const interviews = sent.filter((a) => CH().maxStage(a) >= 3);
    const offers = sent.filter((a) => a.status === 'offer');
    const pct = (n) => (sent.length ? Math.round(n / sent.length * 100) : 0);
    const now = new Date();
    const thisMonth = sent.filter((a) => { const d = new Date(a.applicationDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push([d.toLocaleDateString(U().locale(), { month: 'short' }) + (d.getMonth() === 0 || i === 5 ? ' ' + String(d.getFullYear()).slice(2) : ''), sent.filter((a) => { const x = new Date(a.applicationDate); return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear(); }).length]);
    }
    const group = (fn) => { const m = {}; sent.forEach((a) => { const k = fn(a) || 'Unknown'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    return {
      apps, sent, thisMonth, responseRate: pct(responded.length), interviewRate: pct(interviews.length), offerRate: pct(offers.length),
      months,
      byContract: group((a) => a.contractType),
      bySource: group((a) => MT.jobsService.SOURCE_LABEL[a.source] || (a.source === 'manual' ? 'Manual' : a.source)),
      byIndustry: group((a) => a.industry ? MT.knowledge.industryLabel(a.industry) : ''),
      byLocation: group((a) => a.location),
      byStatus: MT.applications.COLUMNS.map((s) => [CH().STATUS_META[s].label, apps.filter((a) => a.status === s).length]),
      funnel: [['Saved', apps.length + Object.keys(MT.storage.get('saved', {})).filter((id) => !apps.some((a) => a.jobId === id)).length], ['Applied', sent.length], ['Follow-up', apps.filter((a) => CH().maxStage(a) >= 2).length], ['Interview', interviews.length], ['Final Round', apps.filter((a) => CH().maxStage(a) >= 4).length], ['Offer', offers.length]]
    };
  }

  /** Horizontal bars — readable on mobile, labels never collide. */
  function hbars(title, rows, unit) {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    const id = 'c' + U().hash(title).toString(36);
    return '<figure class="chart card"><figcaption class="chart__title">' + esc(title) + '</figcaption>' +
      (rows.length ? '<div class="hbars">' + rows.map((r) => '<div class="hbar" tabindex="0" aria-label="' + esc(r[0]) + ': ' + r[1] + ' ' + (unit || 'applications') + '"><span class="hbar__label">' + esc(r[0]) + '</span><span class="hbar__track"><span class="hbar__fill" style="--w:' + (r[1] / max * 100) + '%"></span></span><span class="hbar__val">' + r[1] + '</span><span class="tip" role="tooltip">' + esc(r[0]) + ' — <strong>' + r[1] + '</strong> ' + (unit || 'applications') + '</span></div>').join('') + '</div>' : '<p class="muted small">No data yet.</p>') +
      tableToggle(id, rows, unit) + '</figure>';
  }
  /** Vertical columns for time (months). */
  function columns(title, rows) {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    const W = 560, H = 220, pad = 28, bw = (W - pad * 2) / rows.length;
    const id = 'c' + U().hash(title).toString(36);
    const ticks = [0, Math.ceil(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);
    return '<figure class="chart card"><figcaption class="chart__title">' + esc(title) + '</figcaption><div class="cols-wrap"><svg viewBox="0 0 ' + W + ' ' + (H + 30) + '" class="cols" role="img" aria-label="' + esc(title) + '">' +
      ticks.map((t) => { const y = H - (t / max) * (H - 20); return '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pad - 8) + '" y="' + (y + 4) + '" class="axis" text-anchor="end">' + t + '</text>'; }).join('') +
      rows.map((r, i) => { const h = (r[1] / max) * (H - 20), x = pad + i * bw + bw * 0.22, w = bw * 0.56, y = H - h; return '<g class="col" tabindex="0"><title>' + esc(r[0]) + ': ' + r[1] + ' applications</title><rect x="' + (x - bw * 0.2) + '" y="0" width="' + bw + '" height="' + H + '" class="col__hit"/>' + (r[1] ? '<path d="M' + x + ',' + H + 'V' + (y + 4) + 'q0,-4 4,-4h' + (w - 8) + 'q4,0 4,4V' + H + 'z" class="col__bar"/>' : '') + '<text x="' + (x + w / 2) + '" y="' + (H + 20) + '" class="axis" text-anchor="middle">' + esc(r[0]) + '</text>' + (r[1] ? '<text x="' + (x + w / 2) + '" y="' + (y - 6) + '" class="col__val" text-anchor="middle">' + r[1] + '</text>' : '') + '</g>'; }).join('') +
      '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + H + '" y2="' + H + '" class="baseline"/></svg></div>' + tableToggle(id, rows) + '</figure>';
  }
  function tableToggle(id, rows, unit) {
    return '<details class="chart__table"><summary>View as table</summary><table class="table table--sm"><thead><tr><th scope="col">Category</th><th scope="col">' + esc(U().cap(unit || 'applications')) + '</th></tr></thead><tbody>' + rows.map((r) => '<tr><td>' + esc(r[0]) + '</td><td>' + r[1] + '</td></tr>').join('') + '</tbody></table></details>';
  }
  function funnel(rows) {
    const max = Math.max(1, rows[0][1], rows[1][1]);
    return '<ol class="funnel" aria-label="Application funnel">' + rows.map((r, i) => '<li class="funnel__step"><span class="funnel__bar" style="--w:' + Math.max(6, r[1] / max * 100) + '%"><span class="funnel__label">' + esc(r[0]) + '</span><span class="funnel__val">' + r[1] + '</span></span>' + (i < rows.length - 1 ? '<span class="funnel__arrow" aria-hidden="true">↓</span>' : '') + '</li>').join('') + '</ol>';
  }

  function render(root) {
    const s = compute();
    root.innerHTML = '<header class="page-head"><div><p class="eyebrow">Your numbers</p><h1 class="display">Statistics</h1><p class="lead">Updated live from your application tracker. Rejections are part of the journey — they never erase progress.</p></div></header>' +
      '<div class="kpis kpis--hero">' +
      '<div class="kpi"><span class="kpi__v">' + s.thisMonth + '</span><span class="kpi__l">Applications this month</span></div>' +
      '<div class="kpi"><span class="kpi__v">' + s.responseRate + '%</span><span class="kpi__l">Response rate</span></div>' +
      '<div class="kpi"><span class="kpi__v">' + s.interviewRate + '%</span><span class="kpi__l">Interview rate</span></div>' +
      '<div class="kpi"><span class="kpi__v">' + s.offerRate + '%</span><span class="kpi__l">Offer rate</span></div></div>' +
      '<p class="small muted">Rates are computed on ' + s.sent.length + ' sent application' + (s.sent.length === 1 ? '' : 's') + '. Response = an interview, an offer or a rejection.</p>' +
      (s.sent.length ? '' : U().emptyState({ title: 'No statistics yet', text: 'Send your first application and your chicken will start drawing charts.', prop: 'paperBlank', action: { href: '#/jobs', label: 'Find a job' } })) +
      '<div class="charts">' + columns('Applications per month', s.months) + '<figure class="chart card"><figcaption class="chart__title">Application funnel</figcaption>' + funnel(s.funnel) + '</figure>' +
      hbars('Applications by status', s.byStatus) + hbars('Applications by contract', s.byContract) + hbars('Applications by source', s.bySource) + hbars('Applications by industry', s.byIndustry) + hbars('Applications by location', s.byLocation) + '</div>';
  }

  MT.statistics = { compute, render, hbars, funnel };
})(window.MT = window.MT || {});
