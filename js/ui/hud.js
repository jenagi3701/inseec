'use strict';
// =========================================================
// HUD (DOM)
// =========================================================
const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function heartSVG(state) {
  const px = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
  let r = '';
  px.forEach((row, y) => row.split('').forEach((c, x) => {
    if (c !== '1') return;
    const fill = state === 'full' || (state === 'half' && x < 4) ? (y === 1 && x === 1 ? '#ffb3b3' : '#ff3b3b') : '#4a2a2a';
    r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
  }));
  return `<svg viewBox="0 0 7 6" shape-rendering="crispEdges">${r}</svg>`;
}
function setupHUD() {
  const D = CH[P.id];
  const slots = [['basic', 'J', 'ATTACK'], ['s1', 'Q', 'SKILL 1'], ['s2', 'E', 'SKILL 2']];
  if (D.s3) slots.push(['s3', 'F', 'SKILL 3']);
  slots.push(['ult', 'R', 'ULTIMATE']);
  $('#skills').innerHTML = slots.map(([s, k, label]) => {
    const sk = D[s];
    return `<div class="skill ${s === 'ult' ? 'ult' : ''}" id="sk-${s}" title="[${k}] ${label}">${iconImg(SKILL_ICONS[P.id][s], 'sicon')}<div class="row1"><span class="key">[${k}] ${label}</span></div><div class="row1 sname">${sk.name}</div><span class="state"></span><div class="cbar"><i></i></div></div>`;
  }).join('');
  // round touch buttons show the skill's pixel icon
  document.querySelectorAll('#tbtns .tbtn').forEach(b => {
    const slot = b.dataset.slot, name = slot ? SKILL_ICONS[P.id][slot] : 'jump';
    b.querySelectorAll('img').forEach(i => i.remove());
    b.insertAdjacentHTML('afterbegin', iconImg(name));
    b.classList.toggle('hidden', !!slot && !D[slot]);
    if (slot && D[slot]) b.setAttribute('aria-label', D[slot].name);
  });
  const st = stars(P.id, G.mapId);
  $('#levelName').textContent = 'LEVEL ' + G.level + ' · ' + G.M.icon + ' ' + G.L.name.toUpperCase() + ' · ' + D.emoji + ' ' + D.name.toUpperCase() + ' ' + starStr(st);
  for (const k in hudCache) delete hudCache[k];
}
function updateHUD() {
  if (!G || !G.running) return;
  const per = P.maxHp / 5;
  let hearts = '';
  for (let i = 0; i < 5; i++) hearts += heartSVG(P.hp >= (i + 1) * per - 0.01 ? 'full' : P.hp >= (i + 0.5) * per ? 'half' : 'empty');
  if (hudCache.hearts !== hearts) { hudCache.hearts = hearts; $('#hearts').innerHTML = hearts; }
  setText('#hpText', 'HP ' + Math.ceil(P.hp) + '/' + P.maxHp + (P.resting ? ' ♥+' : ''));
  setText('#rank', 'RANK ' + '★'.repeat(G.rank) + '☆'.repeat(RANK_MAX - G.rank) + (G.rank < RANK_MAX ? '  ' + G.rankKills + '/' + RANK_KILLS : ''));
  const combo = G.combo >= 2 && G.t - G.comboT < 3.5 ? 'x' + G.combo + ' COMBO' : '';
  setText('#combo', combo);
  setText('#hudCoins', String(G.coinCount));
  setText('#hudScore', G.score.toLocaleString('en-US'));
  setText('#hudKills', String(G.stats.kills));
  const buffs = P.buffs.filter((b, i, a) => a.findIndex(x => x.name === b.name) === i).map(b => `<span class="buff">${b.icon} ${b.name} ${Math.ceil(b.until - G.t)}s</span>`).join('') + (P.form ? '' : '');
  const shieldTag = P.shieldHits > 0 ? `<span class="buff">🛡 SHIELD x${P.shieldHits}</span>` : '';
  if (hudCache.buffs !== buffs + shieldTag) { hudCache.buffs = buffs + shieldTag; $('#buffs').innerHTML = buffs + shieldTag; }
  if (false) { hudCache.buffs = buffs; $('#buffs').innerHTML = buffs; }
  const D = CH[P.id];
  for (const s of ['basic', 's1', 's2', 's3', 'ult']) {
    if (!D[s]) continue;
    const el = $('#sk-' + s);
    let state, pct, ready;
    if (s === 'ult') {
      ready = P.energy >= 100; pct = P.energy;
      state = ready ? 'READY! PRESS R' : 'ENERGY ' + Math.floor(P.energy) + '%';
    } else {
      const max = s === 'basic' ? D.basic.cd / statMul('aspd') : D[s].cd;
      const left = Math.max(0, P.cd[s] - G.t);
      ready = left <= 0;
      if (P.charging && P.charging.slot === s) { pct = clamp((G.t - P.charging.start) / 1.2, 0, 1) * 100; state = 'CHARGING ' + Math.round(pct) + '%'; }
      else { pct = ready ? 100 : 100 - left / max * 100; state = ready ? 'SKILL READY' : 'COOLDOWN ' + left.toFixed(1) + 's'; }
    }
    const cls = 'skill' + (s === 'ult' ? ' ult' : '') + (ready ? ' ready' : ' cool');
    const key = s + '|' + state + '|' + Math.round(pct) + '|' + cls;
    if (hudCache[s] === key) continue;
    hudCache[s] = key;
    el.className = cls;
    el.querySelector('.state').textContent = state;
    el.querySelector('.cbar i').style.width = pct + '%';
    const tb = document.querySelector('#touch [data-action="' + (s === 'basic' ? 'attack' : s) + '"]');
    if (tb) {
      tb.style.setProperty('--cd', ready ? 0 : (1 - pct / 100).toFixed(2));
      tb.classList.toggle('ready', ready); tb.classList.toggle('cool', !ready);
      const left = s === 'ult' ? 0 : Math.max(0, P.cd[s] - G.t);
      tb.querySelector('.cdn').textContent = s === 'ult' ? (ready ? '' : Math.floor(P.energy) + '%') : (left > 0.6 ? Math.ceil(left) : '');
    }
  }
  // smart SKILL button shows the skill it will fire next
  const sb = $('#tbtns [data-action="skill"]');
  if (sb && !sb.classList.contains('off')) {
    const next = pickSmartSkill();
    const waits = ['s1', 's2', 's3'].filter(k => D[k]).map(k => [k, Math.max(0, P.cd[k] - G.t)]);
    const soonest = waits.sort((x, y) => x[1] - y[1])[0];
    const show = next || (soonest && soonest[0]);
    const key = 'smart|' + show + '|' + !!next + '|' + (next ? '' : Math.ceil(soonest[1]));
    if (hudCache.smart !== key) {
      hudCache.smart = key;
      sb.querySelectorAll('img').forEach(i => i.remove());
      sb.insertAdjacentHTML('afterbegin', iconImg(SKILL_ICONS[P.id][show]));
      sb.classList.toggle('cool', !next); sb.classList.toggle('ready', !!next);
      sb.querySelector('.cdn').textContent = next ? '' : Math.ceil(soonest[1]);
      sb.setAttribute('aria-label', D[show].name);
    }
    sb.style.setProperty('--cd', next ? 0 : (soonest[1] / D[soonest[0]].cd).toFixed(2));
  }
  const b = G.boss && G.boss.alive ? G.boss : null;
  $('#bossBar').classList.toggle('hidden', !b);
  if (b) { setText('#bossName', '☠ ' + b.name + (b.phase2 ? ' (ENRAGED)' : '')); $('#bossFill').style.width = (b.hp / b.maxHp * 100) + '%'; }
}
