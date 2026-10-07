'use strict';
// =========================================================
// MAP PREVIEWS — paint a still of each map into any canvas
// =========================================================
const previewBuf = document.createElement('canvas'); previewBuf.width = 320; previewBuf.height = 180;
const previewCache = {};
function renderMapPreview(canvasEl, mapId) {
  const M = MAPS[mapId];
  if (!previewCache[mapId]) {
    const keep = [W, H, CAMY]; W = 320; H = 180; CAMY = GROUND - H + 32; // previews use the close framing
    try {
    const pc = previewBuf.getContext('2d');
    pc.imageSmoothingEnabled = false;
    pc.clearRect(0, 0, W, H);
    withCtx(pc, () => {
      pc.save(); pc.translate(0, -CAMY);
      drawBackground(M.theme, 900, 3, 4000);
      drawGround(M.theme, 900);
      // a taste of each map's signature terrain
      const hint = { ocean: 'deep', sky: 'gap', desert: 'quicksand', snow: 'ice', volcano: 'lava', final: 'lava', island: 'shallow' }[mapId];
      const fakeG = { t: 3, segs: [{ x0: 0, x1: 130, kind: 'ground' }, { x0: 130, x1: 220, kind: hint }, { x0: 220, x1: 400, kind: mapId === 'ocean' ? 'ship' : 'ground' }] };
      const realG = G; G = fakeG;
      try {
        if (hint === 'gap') { pc.fillStyle = mix(THEMES.sky.sky[0], THEMES.sky.sky[1], 0.9); pc.fillRect(130, GROUND, 90, 40); }
        else if (hint === 'ice') { R(130, GROUND, 90, 40, '#a7d8f5'); R(130, GROUND, 90, 2, '#e8f7ff'); }
        else if (hint === 'deep' || hint === 'lava' || hint === 'quicksand' || hint === 'shallow') {
          R(130, GROUND, 90, 40, hint === 'lava' ? '#3e0f05' : hint === 'quicksand' ? '#b8894a' : '#0d3b66');
          G.parts = [];
          const seg = fakeG.segs[1];
          if (hint === 'lava') { R(130, GROUND + 4, 90, 40, '#e64a19'); R(130, GROUND + 4, 90, 2, '#ffca28'); }
          else if (hint === 'quicksand') { for (let x = 132; x < 218; x += 10) R(x, GROUND + 3 + (x % 3) * 3, 4, 1, '#8a6232'); }
          else { pc.fillStyle = 'rgba(30,120,200,0.72)'; pc.fillRect(130, hint === 'deep' ? GROUND + 2 : GROUND - 4, 90, 50); }
          void seg;
        }
        if (mapId === 'ocean') { R(220, GROUND, 180, 40, '#6b3f22'); R(220, GROUND, 180, 3, '#a0682f'); R(280, GROUND - 110, 4, 110, '#4a2a14'); R(248, GROUND - 102, 68, 42, '#f3ead6'); }
        if (mapId === 'sky') { R(150, 196, 40, 6, '#ffffff'); }
      } finally { G = realG; }
      // a few enemy silhouettes and the hero for scale
      shadow(70, GROUND, 14);
      heroOutlined('captain', 70, GROUND, 1, { t: 0 });
      const foe = { island: 'sword', ocean: 'seacreature', sky: 'skywarrior', desert: 'raider', snow: 'icemonster', volcano: 'firemonster', final: 'shield' }[mapId];
      const e = { type: foe, id: 1, x: 260, y: foe === 'skywarrior' ? 160 : foe === 'seacreature' ? 200 : GROUND, w: 16, h: 22, face: -1, flash: 0, st: 'idle', onGround: true, stunUntil: 0, holdUntil: 0, burnUntil: 0 };
      outlined(40, 40, (ax, ay) => ENEMY_ART[foe](e, ax, ay, -1, 3, c => c), e.x, e.y);
      pc.restore();
    });
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    out.getContext('2d').drawImage(previewBuf, 0, 0);
    previewCache[mapId] = out;
    } finally { [W, H, CAMY] = keep; }
  }
  const c = canvasEl.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(previewCache[mapId], 0, 0, canvasEl.width, canvasEl.height);
}
