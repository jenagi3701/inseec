/* ==========================================================================
   CHIC CAREER — ui.js
   Shared UI helpers: escaping, dates, toasts, modals, drawers, text utils.
   ========================================================================== */
(function (MT) {
  'use strict';

  const DAY = 86400000;

  /* ---------- escaping / templating ---------- */
  function esc(v) {
    return String(v === undefined || v === null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- dates ---------- */
  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function today() { return startOfDay(new Date()); }
  function isoDay(d) {
    const x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function addDays(d, n) { return new Date(new Date(d).getTime() + n * DAY); }
  function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / DAY); }
  function fmtDate(d, opts) {
    if (!d) return '—';
    const x = new Date(d);
    if (isNaN(x)) return '—';
    return x.toLocaleDateString(loc(), opts || { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtShort(d) { return fmtDate(d, { day: '2-digit', month: 'short' }); }
  function fmtLong(d) { return fmtDate(d, { day: '2-digit', month: 'long', year: 'numeric' }); }
  function fmtTime(d) { return new Date(d).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' }); }
  function fr() { return !!(MT.i18n && MT.i18n.lang === 'fr'); }
  function loc() { return fr() ? 'fr-FR' : 'en-GB'; }
  function relDay(d) {
    if (!d) return '—';
    const n = daysBetween(today(), d);
    if (n === 0) return fr() ? 'Aujourd’hui' : 'Today';
    if (n === -1) return fr() ? 'Hier' : 'Yesterday';
    if (n === 1) return fr() ? 'Demain' : 'Tomorrow';
    if (n < 0) return fr() ? 'il y a ' + Math.abs(n) + ' jours' : Math.abs(n) + ' days ago';
    return fr() ? 'dans ' + n + ' jours' : 'In ' + n + ' days';
  }
  function lastUpdatedLabel(ts) {
    if (!ts) return fr() ? 'Jamais' : 'Never';
    const n = daysBetween(ts, today());
    const day = n === 0 ? (fr() ? 'Aujourd’hui' : 'Today') : n === 1 ? (fr() ? 'Hier' : 'Yesterday') : fmtDate(ts);
    return day + (fr() ? ' à ' : ' at ') + fmtTime(ts);
  }

  /* ---------- text utils ---------- */
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9+#%€ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function tokens(s) { return norm(s).split(' ').filter((w) => w.length > 1); }
  function jaccard(a, b) {
    const A = new Set(a), B = new Set(b);
    if (!A.size && !B.size) return 0;
    let inter = 0;
    A.forEach((x) => { if (B.has(x)) inter++; });
    return inter / (A.size + B.size - inter);
  }
  function shingles(s, n) {
    const t = tokens(s);
    const out = [];
    for (let i = 0; i + n <= t.length; i++) out.push(t.slice(i, i + n).join(' '));
    return out;
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function seeded(seed) {
    let s = seed >>> 0 || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function debounce(fn, ms) { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }
  function isValidUrl(u) {
    try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch (e) { return false; }
  }
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '')); }
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function sleep(ms) { return new Promise((r) => setTimeout(r, prefersReducedMotion() ? Math.min(ms, 120) : ms)); }

  /* ---------- toasts ---------- */
  function toast(msg, type, opts) {
    const host = $('#toasts');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'info');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const icon = { success: '✓', error: '!', info: '🐔', warn: '⚠' }[type || 'info'] || '🐔';
    el.innerHTML = '<span class="toast__icon" aria-hidden="true">' + icon + '</span><span class="toast__msg">' + esc(msg) + '</span>' +
      (opts && opts.action ? '<button class="toast__action" type="button">' + esc(opts.action.label) + '</button>' : '') +
      '<button class="toast__close" type="button" aria-label="Dismiss notification">×</button>';
    host.appendChild(el);
    const close = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 250); };
    el.querySelector('.toast__close').onclick = close;
    if (opts && opts.action) el.querySelector('.toast__action').onclick = () => { opts.action.fn(); close(); };
    setTimeout(close, (opts && opts.duration) || (type === 'error' ? 7000 : 4200));
  }

  /* ---------- modal ---------- */
  let modalStack = [];
  function modal(opts) {
    const host = $('#modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    const id = 'm' + Math.random().toString(36).slice(2, 7);
    wrap.innerHTML =
      '<div class="modal ' + (opts.size ? 'modal--' + opts.size : '') + ' ' + (opts.className || '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-t">' +
      '<header class="modal__head"><h2 class="modal__title" id="' + id + '-t">' + (opts.titleHtml || esc(opts.title || '')) + '</h2>' +
      '<button type="button" class="icon-btn modal__close" aria-label="Close dialog">×</button></header>' +
      '<div class="modal__body">' + (opts.body || '') + '</div>' +
      (opts.footer ? '<footer class="modal__foot">' + opts.footer + '</footer>' : '') +
      '</div>';
    const prevFocus = document.activeElement;
    host.appendChild(wrap);
    document.body.classList.add('has-modal');
    const dlg = wrap.querySelector('.modal');
    const api = {
      el: dlg,
      close: function () {
        wrap.classList.add('is-leaving');
        setTimeout(() => wrap.remove(), 180);
        modalStack = modalStack.filter((m) => m !== api);
        if (!modalStack.length) document.body.classList.remove('has-modal');
        if (prevFocus && prevFocus.focus) prevFocus.focus();
        if (opts.onClose) opts.onClose();
      }
    };
    modalStack.push(api);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap && !opts.sticky) api.close(); });
    dlg.querySelector('.modal__close').onclick = api.close;
    dlg.addEventListener('keydown', (e) => trapFocus(e, dlg));
    requestAnimationFrame(() => {
      const f = dlg.querySelector('[autofocus], input, select, textarea, button:not(.modal__close)');
      (f || dlg.querySelector('.modal__close')).focus();
    });
    if (opts.onOpen) opts.onOpen(dlg, api);
    return api;
  }
  function trapFocus(e, root) {
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]', root)
      .filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalStack.length) { modalStack[modalStack.length - 1].close(); return; }
      if (MT.assistant && MT.assistant.isOpen()) MT.assistant.close();
    }
  });

  function confirmDialog(title, message, okLabel, danger) {
    return new Promise((resolve) => {
      let done = false;
      const m = modal({
        title: title, size: 'sm',
        body: '<p>' + esc(message) + '</p>',
        footer: '<button type="button" class="btn btn--ghost" data-act="no">Cancel</button>' +
          '<button type="button" class="btn ' + (danger ? 'btn--danger' : 'btn--primary') + '" data-act="yes">' + esc(okLabel || 'Confirm') + '</button>',
        onClose: () => { if (!done) resolve(false); }
      });
      m.el.querySelector('[data-act=no]').onclick = () => { done = true; resolve(false); m.close(); };
      m.el.querySelector('[data-act=yes]').onclick = () => { done = true; resolve(true); m.close(); };
    });
  }

  /* ---------- clipboard / download ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard', 'success'));
    }
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Copied to clipboard', 'success'); } catch (e) { toast('Copy failed — select the text manually.', 'error'); }
    ta.remove();
    return Promise.resolve();
  }
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- small components ---------- */
  function scoreClass(score) {
    if (score >= 85) return 'score--high';
    if (score >= 70) return 'score--good';
    if (score >= 50) return 'score--mid';
    return 'score--low';
  }
  function scoreRing(score, size) {
    size = size || 56;
    const r = size / 2 - 5, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    return '<span class="ring ' + scoreClass(score) + '" style="width:' + size + 'px;height:' + size + 'px" role="img" aria-label="' + score + '% match">' +
      '<svg viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring__bg"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring__fg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
      '<span class="ring__label">' + score + '<small>%</small></span></span>';
  }
  function emptyState(opts) {
    return '<div class="empty">' +
      '<div class="empty__art">' + (MT.chicken ? MT.chicken.svg({ mood: opts.mood || 'curious', prop: opts.prop, size: 120 }) : '🐔') + '</div>' +
      '<h3 class="empty__title">' + esc(opts.title) + '</h3>' +
      '<p class="empty__text">' + esc(opts.text) + '</p>' +
      (opts.action ? '<a class="btn btn--primary" href="' + esc(opts.action.href) + '">' + esc(opts.action.label) + '</a>' : '') +
      '</div>';
  }

  MT.ui = {
    DAY, esc, $, $$, today, startOfDay, isoDay, addDays, daysBetween, fmtDate, fmtShort, fmtLong, fmtTime, relDay, lastUpdatedLabel,
    norm, tokens, jaccard, shingles, hash, seeded, cap, debounce, isValidUrl, isValidEmail, prefersReducedMotion, sleep,
    toast, modal, confirmDialog, locale: loc, copyText, download, scoreClass, scoreRing, emptyState
  };
})(window.MT = window.MT || {});
