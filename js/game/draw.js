'use strict';
// ---------------------------------------------------------
// drawing helpers
// ---------------------------------------------------------
const canvas = $('#game');
const mainCtx = canvas.getContext('2d');
let g = mainCtx;
function withCtx(c, fn) { const old = g; g = c; try { fn(); } finally { g = old; } }
function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
// sprite-space painter: x relative to centre, mirrored by facing
function painter(face, ox, oy) {
  return (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(face > 0 ? ox + x : ox - x - w, oy + y, w, h); };
}
// Draw a sprite with a 1px dark outline so it reads clearly on any background.
// The sprite is painted to an offscreen buffer, a silhouette is made from it,
// and the silhouette is stamped in 4 directions underneath the sprite.
const OUT_AX = 380, OUT_AY = 110;
const sprBuf = document.createElement('canvas'), silBuf = document.createElement('canvas');
sprBuf.width = silBuf.width = OUT_AX * 2; sprBuf.height = silBuf.height = OUT_AY + 20;
const sprX = sprBuf.getContext('2d'), silX = silBuf.getContext('2d');
function outlined(hw, up, drawFn, x, y, color) {
  hw = Math.min(OUT_AX, Math.ceil(hw)); up = Math.min(OUT_AY, Math.ceil(up));
  const sx = OUT_AX - hw, sy = OUT_AY - up, w = hw * 2, h = up + 12;
  sprX.clearRect(sx, sy, w, h);
  withCtx(sprX, () => drawFn(OUT_AX, OUT_AY));
  silX.clearRect(sx, sy, w, h);
  silX.drawImage(sprBuf, sx, sy, w, h, sx, sy, w, h);
  silX.globalCompositeOperation = 'source-in';
  silX.fillStyle = color || '#120d1c'; silX.fillRect(sx, sy, w, h);
  silX.globalCompositeOperation = 'source-over';
  const dx = Math.round(x) - OUT_AX, dy = Math.round(y) - OUT_AY;
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.drawImage(silBuf, sx, sy, w, h, sx + dx + ox, sy + dy + oy, w, h);
  g.drawImage(sprBuf, sx, sy, w, h, sx + dx, sy + dy, w, h);
}
function heroOutlined(id, x, fy, face, pose, color) {
  pose = pose || {};
  const hw = 26 + (pose.L || 0) + (pose.fist || 0);
  outlined(hw, 40, (ax, ay) => drawHero(id, ax, ay, face, pose), x, fy, color);
}
function shadow(x, y, w) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(Math.round(x - w / 2), Math.round(y) - 1, w, 2); g.fillRect(Math.round(x - w / 2) + 2, Math.round(y), w - 4, 1); }

function pxText(str, x, y, color, align) {
  g.font = FONT; g.textAlign = align || 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#000'; g.fillText(str, x + 1, y + 1);
  g.fillStyle = color; g.fillText(str, x, y);
}
