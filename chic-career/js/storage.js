/* ==========================================================================
   CHIC CAREER — storage.js
   Thin, reusable persistence layer on top of localStorage.
   Every collection lives under its own namespaced key so that a backend /
   database adapter can later replace this file without touching the views.
   ========================================================================== */
(function (MT) {
  'use strict';

  const PREFIX = 'chiccareer:';
  const LEGACY_PREFIX = 'marketrack:'; // data saved under the app's previous name
  const SCHEMA_VERSION = 3;

  // Known collections. Keeping the list explicit documents the data model.
  const KEYS = {
    meta: 'meta',               // { schemaVersion, seededAt, lastRefresh }
    profile: 'profile',         // User profile + preferences + portfolio
    cvs: 'cvs',                 // CV versions (metadata + extracted data, never the binary)
    jobs: 'jobs',               // Normalised, de-duplicated job offers
    seenJobIds: 'seenJobIds',   // Raw source ids already ingested (refresh bookkeeping)
    saved: 'saved',             // { [jobId]: { savedAt, notes, priority } }
    applications: 'applications',
    coverLetters: 'coverLetters',
    answers: 'answers',         // Answers given to the Career Chicken, by application
    drafts: 'drafts',           // In-progress application missions, by jobId
    reminders: 'reminders',
    quests: 'quests',           // Daily quests state { date, done: {id:true} , xpLog: [] }
    activity: 'activity',       // { viewedJobs: {id: date}, xpBonus }
    settings: 'settings',       // AI + UI settings
    interviewPrep: 'interviewPrep'
  };

  const memoryFallback = {};
  let storageOk = true;
  try {
    const t = PREFIX + '__test';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
  } catch (e) {
    storageOk = false;
  }

  // One-time migration from the app's previous name (MARKETRACK) so nobody loses data.
  if (storageOk) {
    try {
      if (window.localStorage.getItem(PREFIX + 'meta') === null) {
        Object.keys(window.localStorage).filter((k) => k.indexOf(LEGACY_PREFIX) === 0).forEach((k) => {
          window.localStorage.setItem(PREFIX + k.slice(LEGACY_PREFIX.length), window.localStorage.getItem(k));
          window.localStorage.removeItem(k);
        });
      }
    } catch (e) { /* ignore */ }
  }

  function raw(key) { return PREFIX + key; }

  function get(key, fallback) {
    try {
      const v = storageOk ? window.localStorage.getItem(raw(key)) : memoryFallback[key];
      if (v === null || v === undefined) return clone(fallback);
      return JSON.parse(v);
    } catch (e) {
      console.warn('[storage] could not read', key, e);
      return clone(fallback);
    }
  }

  function set(key, value) {
    const str = JSON.stringify(value);
    try {
      if (storageOk) window.localStorage.setItem(raw(key), str);
      else memoryFallback[key] = str;
      emit(key);
      return true;
    } catch (e) {
      console.error('[storage] write failed', key, e);
      if (MT.ui && MT.ui.toast) {
        MT.ui.toast('Your browser storage is full. Remove old CV versions or cover letters to free space.', 'error');
      }
      return false;
    }
  }

  function update(key, fallback, fn) {
    const current = get(key, fallback);
    const next = fn(current);
    set(key, next === undefined ? current : next);
    return next === undefined ? current : next;
  }

  function remove(key) {
    try {
      if (storageOk) window.localStorage.removeItem(raw(key));
      else delete memoryFallback[key];
    } catch (e) { /* ignore */ }
    emit(key);
  }

  function clearAll() {
    Object.values(KEYS).forEach(remove);
  }

  function clone(v) {
    return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---- tiny pub/sub so views can re-render when data changes ---- */
  const listeners = {};
  function on(key, fn) { (listeners[key] = listeners[key] || []).push(fn); }
  function emit(key) {
    (listeners[key] || []).forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    (listeners['*'] || []).forEach((fn) => { try { fn(key); } catch (e) { console.error(e); } });
  }

  function usageBytes() {
    if (!storageOk) return 0;
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0) total += (localStorage.getItem(k) || '').length * 2;
    }
    return total;
  }

  MT.storage = { KEYS, SCHEMA_VERSION, get, set, update, remove, clearAll, uid, on, emit, clone, usageBytes, isPersistent: () => storageOk };
})(window.MT = window.MT || {});
