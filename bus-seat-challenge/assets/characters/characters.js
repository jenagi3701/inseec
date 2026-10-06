/* =====================================================================
   BUS SEAT CHALLENGE — PIXEL-ART CHARACTER GENERATOR
   All passengers are drawn procedurally on a small pixel grid, then
   outlined automatically and cached as tiny canvases. No image files,
   no copyrighted assets. Each visual clue (cane, crutches, baby, bump,
   wheelchair, brace, badge…) is a distinct silhouette or shape, so the
   game never relies on colour alone.
   ===================================================================== */
(function () {
  'use strict';

  const OUT = '#1b1325';           // outline colour
  const EYE = '#1b1325';

  const PAL = {
    skins: ['#f7d7bf', '#eab48c', '#c98b5e', '#94603d', '#5f3b27'],
    hairs: ['#2a1c14', '#5b3920', '#9c4f25', '#d8a03c', '#1d1f3b', '#7c3a6a', '#b7412e'],
    grays: ['#d9d9e3', '#bfc0cc', '#f0f0f5'],
    shirts: ['#e4574b', '#3f8fd8', '#4cb86b', '#f0a43a', '#8b5cc7', '#e46fa6', '#2fb6b0', '#f2d14b', '#6b7a8f', '#c0d4e8'],
    pants: ['#2f3b5c', '#3c3c46', '#5b4636', '#2d5a7b', '#6d2f3f', '#4a5a3a'],
    shoes: ['#2a2230', '#5a3a26', '#e9e9ef', '#b23a3a'],
    umbrellas: ['#d9365e', '#3a7be0', '#2fb67a', '#8e44ad']
  };

  /* ---------- colour helpers ---------- */
  const rgbCache = {};
  function hex2rgb(h) {
    if (rgbCache[h]) return rgbCache[h];
    const n = parseInt(h.slice(1), 16);
    return (rgbCache[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  function toHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  // f > 0 lightens, f < 0 darkens
  function shade(h, f) {
    const [r, g, b] = hex2rgb(h);
    const m = v => (f < 0 ? v * (1 + f) : v + (255 - v) * f);
    return toHex(m(r), m(g), m(b));
  }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }

  /* ---------- pixel grid ---------- */
  class Grid {
    constructor(w, h) { this.w = w; this.h = h; this.p = new Array(w * h).fill(null); }
    set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.p[y * this.w + x] = c; }
    get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.p[y * this.w + x] : null; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    pts(list, c) { for (const [x, y] of list) this.set(x, y, c); }
    // matrix: array of strings, chars map to colours via `map`
    stamp(x, y, rows, map) {
      rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = map[row[i]]; if (c) this.set(x + i, y + j, c); } });
    }
    outline(c) {
      const src = this.p.slice();
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x]) continue;
        const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && src[yy * this.w + xx];
        if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) this.p[y * this.w + x] = c;
      }
      return this;
    }
    toCanvas() {
      const cv = document.createElement('canvas');
      cv.width = this.w; cv.height = this.h;
      const cx = cv.getContext('2d');
      const img = cx.createImageData(this.w, this.h);
      for (let i = 0; i < this.p.length; i++) {
        const c = this.p[i]; if (!c) continue;
        const [r, g, b] = hex2rgb(c);
        img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
      return cv;
    }
  }

  /* ---------- look generation ---------- */
  function pick(rng, a) { return a[Math.floor(rng() * a.length)]; }

  function randomLook(rng, def) {
    const f = Object.assign({}, def.look || {});
    if (f.pregnant) f.dress = true;
    const look = {
      skin: pick(rng, PAL.skins),
      hair: f.elderly ? pick(rng, PAL.grays) : pick(rng, PAL.hairs),
      hairStyle: f.elderly ? pick(rng, ['bald', 'short', 'bun', 'short'])
        : f.pregnant ? pick(rng, ['long', 'bun', 'long', 'curly'])
          : pick(rng, ['short', 'long', 'spiky', 'bun', 'curly', 'short']),
      shirt: pick(rng, PAL.shirts),
      pants: pick(rng, PAL.pants),
      shoes: pick(rng, PAL.shoes),
      dress: f.pregnant ? pick(rng, ['#e46fa6', '#8b5cc7', '#2fb6b0', '#f0a43a', '#3f8fd8']) : null,
      umbrella: pick(rng, PAL.umbrellas),
      f
    };
    look.glasses = f.elderly ? rng() < 0.7 : rng() < 0.12;
    look.mustache = f.elderly && look.hairStyle !== 'bun' && rng() < 0.4;
    if (f.cap || f.hat) look.hairStyle = look.hairStyle === 'long' ? 'long' : 'short';
    return look;
  }

  // Same person (clothes, hair, skin) but with different feature flags
  function twinLook(look, flags) {
    const t = JSON.parse(JSON.stringify(look));
    t.f = Object.assign({}, flags || {});
    return t;
  }

  /* ---------- STANDING PERSON (22 x 32, feet anchor 11,30) ---------- */
  const PW = 22, PH = 32;

  function drawPerson(look, frame) {
    const g = new Grid(PW, PH);
    const f = look.f || {};
    const skin = look.skin, hair = look.hair;
    const pants = look.pants, shoe = look.shoes;
    const top = f.vest ? '#f28c28' : (f.dress ? look.dress : look.shirt);
    const sleeve = f.vest ? look.shirt : top;
    const hy = f.elderly ? 1 : 0;           // hunched older passengers
    const legUp = frame === 1 ? 1 : 0;      // walking frame

    /* long hair, behind body */
    if (look.hairStyle === 'long') g.rect(6, 5 + hy, 10, 9, shade(hair, -0.18));

    /* legs */
    const CAST = '#f4f4f8';
    if (f.dress) {
      g.rect(6, 20, 10, 4, top);                         // A-line skirt
      g.rect(6, 23, 10, 1, shade(top, -0.2));
      g.rect(8, 24, 2, 4 - legUp, skin);
      g.rect(12, 24, 2, 4, skin);
      g.rect(7, 28 - legUp, 3, 2, shoe);
      g.rect(12, 28, 3, 2, shoe);
    } else {
      g.rect(8, 20, 3, 8 - legUp, pants);
      g.rect(7, 28 - legUp, 4, 2, shoe);
      if (f.cast) {
        g.rect(11, 20, 3, 8, CAST); g.rect(11, 28, 4, 2, CAST);
        g.rect(11, 22, 3, 1, '#c9c9d6'); g.rect(11, 25, 3, 1, '#c9c9d6');
      } else {
        g.rect(11, 20, 3, 8, shade(pants, -0.12));
        g.rect(11, 28, 4, 2, shoe);
      }
      if (f.brace) {                                    // small hidden clue
        g.rect(8, 22 - legUp, 3, 1, '#c5ccdb');
        g.rect(8, 25 - legUp, 3, 1, '#c5ccdb');
        g.rect(10, 22 - legUp, 1, 4, '#59607a');
      }
    }

    /* torso */
    g.rect(7, 11, 8, 9, top);
    g.rect(14, 12, 1, 8, shade(top, -0.15));
    g.rect(10, 11, 2, 1, skin);                         // neck
    if (!f.dress) g.rect(7, 19, 8, 1, shade(pants, -0.3));
    if (f.vest) { g.rect(7, 15, 8, 1, '#f8f27a'); g.rect(7, 17, 8, 1, '#f8f27a'); g.rect(10, 12, 2, 7, look.shirt); }
    if (f.backpack) { g.rect(8, 11, 1, 6, '#3a3f4e'); g.rect(13, 11, 1, 6, '#3a3f4e'); }

    /* arms (default) */
    const holding = f.baby || f.pet || f.phone;
    if (!holding) {
      g.rect(6, 12, 1, 6, sleeve); g.rect(15, 12, 1, 6, sleeve);
      g.rect(6, 18, 1, 2, skin); g.rect(15, 18, 1, 2, skin);
    } else {
      g.rect(6, 12, 1, 4, sleeve); g.rect(15, 12, 1, 4, sleeve);
      g.set(7, 16, sleeve); g.set(14, 16, sleeve);
    }

    /* pregnancy bump (side silhouette) + hand on bump */
    if (f.pregnant) {
      // round belly in side-profile, clearly sticking out of the body line
      const rows = [[13, 1], [14, 2], [15, 3], [16, 4], [17, 4], [18, 4], [19, 3], [20, 2]];
      for (const [y, w] of rows) g.rect(14, y, w, 1, top);
      g.pts([[15, 15], [16, 16], [15, 16]], shade(top, 0.35));                  // highlight
      g.pts([[17, 18], [16, 19]], shade(top, -0.25));                           // shadow
      g.rect(15, 12, 1, 2, sleeve); g.set(15, 14, skin); g.set(16, 14, skin);   // hand resting on top
      g.rect(6, 12, 1, 5, sleeve); g.set(6, 17, skin);                          // other hand on back
    }

    /* things held in front */
    if (f.baby) {
      // swaddled baby: round head with face + bonnet, blanket bundle, cradling arms
      const bs = mix(skin, '#ffd9c7', 0.45);
      g.rect(8, 15, 8, 5, '#fff3c4'); g.rect(7, 16, 1, 3, '#fff3c4');
      g.pts([[9, 17], [11, 18], [13, 17], [14, 19]], '#f6b8d1');
      g.rect(9, 12, 4, 1, '#ff9ccc'); g.rect(8, 13, 1, 3, '#ff9ccc');            // bonnet
      g.rect(9, 13, 4, 3, bs);                                                  // face
      g.set(10, 14, EYE); g.set(12, 14, EYE); g.set(11, 15, '#e07a8f');
      g.rect(7, 19, 9, 1, skin);                                                // cradling forearm
      g.set(16, 18, skin);
    }
    if (f.pet) {
      g.rect(8, 14, 6, 6, '#9aa1b3'); g.rect(9, 16, 4, 3, '#2f3445');
      g.rect(10, 16, 1, 3, '#9aa1b3'); g.rect(12, 16, 1, 3, '#9aa1b3');
      g.set(9, 17, '#ffd23f'); g.set(11, 17, '#ffd23f');  // cat eyes
      g.set(9, 13, '#f08a3c'); g.set(12, 13, '#f08a3c');  // ears poking out
      g.rect(10, 13, 2, 1, '#2f3445');
      g.set(7, 16, skin); g.set(14, 16, skin);
    }
    if (f.phone) {
      g.set(8, 16, skin); g.set(13, 16, skin);
      g.rect(9, 15, 4, 3, '#2b2f3a'); g.rect(10, 15, 2, 2, '#7fe8ff');
    }
    if (f.camera) {
      g.pts([[8, 11], [9, 12], [12, 12], [13, 11]], '#2b2f3a');
      g.rect(9, 13, 4, 3, '#2b2f3a'); g.rect(10, 14, 2, 1, '#9fb4c9'); g.set(12, 13, '#e0e0e0');
    }
    if (f.lanyard) {
      const isDecoy = f.lanyard === 'decoy';
      const strap = isDecoy ? '#2f5fbf' : '#2f8a3e';
      g.pts([[8, 11], [9, 12], [9, 13], [13, 11], [12, 12], [12, 13]], strap);
      if (!isDecoy) { g.set(9, 12, '#ffd23f'); g.set(12, 12, '#ffd23f'); }
      g.rect(9, 14, 4, 3, isDecoy ? '#ffffff' : '#2f8a3e');
      if (isDecoy) g.rect(10, 15, 2, 1, '#2f5fbf');
      else { g.set(10, 15, '#ffd23f'); g.set(11, 15, '#ffd23f'); g.set(10, 14, '#ffd23f'); g.set(11, 16, '#ffd23f'); }
    }
    if (f.badge) {
      const isDecoy = f.badge === 'decoy';
      g.rect(12, 13, 3, 3, isDecoy ? '#ffd23f' : '#ffffff');
      g.set(13, 14, isDecoy ? '#2a2230' : '#ff3d9a');
    }
    if (f.bags === 'heavy') {
      g.rect(1, 19, 5, 8, '#d9b77c'); g.rect(1, 19, 5, 1, '#b08f55');
      g.rect(2, 15, 1, 4, '#5fbf4a'); g.set(2, 14, '#2e8b3d');     // leek
      g.rect(4, 15, 1, 4, '#e3a54f');                              // baguette
      g.rect(16, 19, 5, 8, '#e8e8ee'); g.rect(16, 22, 5, 1, '#d0473f');
      g.rect(17, 18, 3, 1, '#f39c33');
      g.set(17, 5, '#7fd3ff'); g.set(17, 6, '#7fd3ff'); g.set(16, 6, '#bfeaff');   // sweat drop
    }
    if (f.bags === 'light') {
      g.rect(15, 20, 3, 4, '#f4a7c0'); g.set(16, 19, '#c46b8b');
    }
    if (f.crutches) {
      g.rect(3, 12, 1, 18, '#aab3c5'); g.rect(18, 12, 1, 18, '#aab3c5');
      g.rect(2, 11, 3, 1, '#3a3f4e'); g.rect(17, 11, 3, 1, '#3a3f4e');
      g.rect(4, 18, 2, 1, '#3a3f4e'); g.rect(16, 18, 2, 1, '#3a3f4e');
    }
    if (f.cane) {
      g.rect(17, 19, 1, 11, '#7a4a2a'); g.rect(16, 18, 2, 1, '#7a4a2a');
    }
    if (f.umbrella) {
      const u = look.umbrella;
      g.pts([[16, 15], [17, 15], [17, 16], [17, 17]], '#3a2a20');
      g.rect(16, 18, 3, 6, u); g.rect(17, 24, 1, 3, u); g.rect(16, 20, 3, 1, shade(u, -0.35));
      g.rect(17, 27, 1, 3, '#c0c6d4');
    }

    /* head */
    const hyy = 4 + hy;
    g.rect(7, hyy, 8, 6, skin); g.rect(8, hyy + 6, 6, 1, skin);
    g.set(6, hyy + 3, skin); g.set(15, hyy + 3, skin);
    const ey = hyy + 3 + (f.phone ? 1 : 0);
    const ex = f.pregnant ? 1 : 0;   // looking sideways a little
    const blush = mix(skin, '#ff6b6b', 0.3);
    if (f.tired) {
      g.rect(8, ey, 2, 1, '#3b2a45'); g.rect(12, ey, 2, 1, '#3b2a45');
      g.set(9, ey + 1, '#a58bbd'); g.set(12, ey + 1, '#a58bbd');
      g.rect(10, ey + 2, 2, 1, '#5a2a35');
    } else {
      g.set(9 + ex, ey, EYE); g.set(12 + ex, ey, EYE);
      g.set(8, ey + 1, blush); g.set(13, ey + 1, blush);
      g.rect(10 + ex, ey + 2, 2, 1, shade(skin, -0.35));
    }
    if (look.glasses && !f.tired) {
      // frame + light lenses (with the pupil kept as a dark dot below the glint)
      g.pts([[8, ey], [10, ey], [11, ey], [13, ey]], '#2a2a35');
      g.set(9 + ex, ey, '#cfeaff'); g.set(12 + ex, ey, '#cfeaff');
      g.rect(8, ey - 1, 3, 1, '#2a2a35'); g.rect(11, ey - 1, 3, 1, '#2a2a35');
      g.set(9, ey + 1, EYE); g.set(12, ey + 1, EYE);
    }
    if (look.mustache) g.rect(9, ey + 2, 4, 1, hair);

    /* hair */
    const hs = look.hairStyle;
    const t = 3 + hy;
    if (hs === 'bald') {
      g.rect(7, t + 3, 1, 2, hair); g.rect(14, t + 3, 1, 2, hair);
    } else if (hs === 'curly') {
      g.rect(6, t - 1, 10, 4, hair); g.rect(6, t + 3, 1, 3, hair); g.rect(15, t + 3, 1, 3, hair);
      g.pts([[7, t], [10, t - 1], [13, t], [8, t + 2]], shade(hair, 0.2));
    } else {
      g.rect(7, t, 8, 2, hair); g.set(7, t + 2, hair); g.set(14, t + 2, hair); g.rect(8, t + 2, 3, 1, hair);
      if (hs === 'long') { g.rect(6, t + 1, 1, 8, hair); g.rect(15, t + 1, 1, 8, hair); }
      if (hs === 'bun') g.rect(9, t - 2, 4, 2, hair);
      if (hs === 'spiky') g.pts([[7, t - 1], [9, t - 1], [11, t - 1], [13, t - 1]], hair);
      g.rect(8, t, 3, 1, shade(hair, 0.18));
    }
    if (f.cap) { g.rect(7, t - 1, 8, 3, '#d0473f'); g.rect(13, t + 1, 4, 1, '#a8332c'); g.set(10, t - 1, '#ffd23f'); }
    if (f.hat) { g.rect(5, t + 1, 12, 1, '#e8c872'); g.rect(8, t - 2, 6, 3, '#e8c872'); g.rect(8, t, 6, 1, '#d0473f'); }
    if (f.headphones) {
      g.pts([[7, t], [8, t - 1], [9, t - 1], [10, t - 1], [11, t - 1], [12, t - 1], [13, t - 1], [14, t]], '#2a2230');
      g.rect(5, t + 2, 2, 3, '#ff4f6d'); g.rect(15, t + 2, 2, 3, '#ff4f6d');
    }

    return g;
  }

  /* ---------- PREGNANT PASSENGER — side profile so the bump reads instantly ---------- */
  function drawPregnant(look, frame) {
    const g = new Grid(PW, PH);
    const skin = look.skin, hair = look.hair, top = look.dress, shoe = look.shoes;
    const step = frame === 1 ? 1 : 0;
    // long hair behind
    g.rect(7, 3, 4, 10, shade(hair, -0.15));
    // legs (side view, alternating when walking)
    g.rect(9 + step, 24, 2, 4, skin); g.rect(11 - step, 24, 2, 4, shade(skin, -0.12));
    g.rect(9 + step, 28, 4, 2, shoe); g.rect(11 - step, 28, 4, 2, shade(shoe, -0.2));
    // dress + round belly
    g.rect(8, 11, 5, 4, top);
    const belly = [[14, 6], [15, 7], [16, 8], [17, 9], [18, 9], [19, 9], [20, 8], [21, 7]];
    for (const [y, w] of belly) g.rect(8, y, w, 1, top);
    g.rect(8, 22, 6, 2, shade(top, -0.15));
    g.pts([[14, 16], [15, 16], [15, 17]], shade(top, 0.35));
    g.pts([[16, 20], [15, 21]], shade(top, -0.25));
    // arm with hand resting on the bump, other hand on lower back
    g.rect(10, 12, 2, 4, shade(top, -0.12)); g.pts([[12, 16], [13, 17]], shade(top, -0.12));
    g.rect(14, 17, 2, 1, skin);
    g.set(7, 18, skin);
    // head (profile, facing right)
    g.rect(9, 4, 5, 7, skin); g.set(14, 7, skin); g.set(14, 8, skin);
    g.rect(10, 11, 2, 1, skin);
    g.set(12, 6, EYE); g.set(12, 9, shade(skin, -0.35)); g.set(11, 8, mix(skin, '#ff6b6b', 0.3));
    // hair
    g.rect(8, 3, 6, 2, hair); g.rect(8, 5, 2, 5, hair); g.set(10, 5, hair);
    if (look.hairStyle === 'bun') g.rect(6, 3, 2, 3, hair);
    if (look.glasses) { g.set(12, 6, '#2a2a35'); g.set(13, 6, '#cfeaff'); }
    return g;
  }

  /* ---------- WHEELCHAIR USER (26 x 32, anchor 13,30) ---------- */
  const WW = 26, WH = 32;
  function drawWheelchair(look) {
    const g = new Grid(WW, WH);
    const skin = look.skin, hair = look.hair, top = look.shirt, pants = look.pants;
    // chair back + push handle
    g.rect(6, 9, 2, 12, '#2b3445'); g.rect(3, 9, 4, 1, '#2b3445');
    // body (seated)
    g.rect(9, 11, 8, 8, top); g.rect(16, 12, 1, 7, shade(top, -0.15));
    g.rect(12, 11, 2, 1, skin);
    // arm reaching down to the wheel rim
    g.rect(15, 12, 1, 5, top); g.set(15, 17, skin);
    // seat + thighs (forward) + shins (down)
    g.rect(8, 19, 12, 2, '#3c4a63');
    g.rect(11, 17, 9, 2, pants);
    g.rect(18, 19, 3, 6, pants);
    g.rect(18, 25, 4, 2, look.shoes);
    g.rect(17, 27, 6, 1, '#8d94a6');                     // footrest
    // big wheel (side view) — unmistakable silhouette
    const cx = 10, cy = 24, r = 6;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= r + 0.3 && d > r - 1.3) g.set(cx + x, cy + y, '#2a2f3d');
      else if (d <= r - 1.3 && d > r - 2.2) g.set(cx + x, cy + y, '#9aa3b5');
    }
    for (let k = -4; k <= 4; k++) { g.set(cx + k, cy, '#c0c6d4'); g.set(cx, cy + k, '#c0c6d4'); }
    g.rect(cx - 1, cy - 1, 3, 3, '#e5e8ef');
    // front caster
    g.rect(20, 28, 3, 2, '#2a2f3d'); g.rect(21, 26, 1, 2, '#8d94a6');
    // head
    g.rect(9, 3, 8, 6, skin); g.rect(10, 9, 6, 1, skin);
    g.set(8, 6, skin); g.set(17, 6, skin);
    g.set(11, 6, EYE); g.set(14, 6, EYE);
    g.set(10, 7, mix(skin, '#ff6b6b', 0.3)); g.set(15, 7, mix(skin, '#ff6b6b', 0.3));
    g.rect(12, 8, 2, 1, shade(skin, -0.35));
    const hs = look.hairStyle;
    if (hs === 'curly') { g.rect(8, 1, 10, 4, hair); }
    else if (hs !== 'bald') {
      g.rect(9, 2, 8, 2, hair); g.set(9, 4, hair); g.set(16, 4, hair); g.rect(10, 4, 3, 1, hair);
      if (hs === 'long') { g.rect(8, 3, 1, 8, hair); g.rect(17, 3, 1, 8, hair); }
      if (hs === 'bun') g.rect(11, 0, 4, 2, hair);
    }
    return g;
  }

  /* ---------- silhouette used in MEMORY / FLASH rounds ---------- */
  function drawSilhouette(hc) {
    const base = drawPerson({ skin: '#000000', hair: '#000000', hairStyle: 'short', shirt: '#000000', pants: '#000000', shoes: '#000000', f: {} }, 0);
    const g = new Grid(PW, PH);
    const fill = hc ? '#ffffff' : '#4a4466';
    for (let i = 0; i < base.p.length; i++) if (base.p[i]) g.p[i] = fill;
    return g.outline(hc ? '#000000' : '#8f86bf').toCanvas();
  }

  /* ---------- cache ---------- */
  const cache = new Map();
  function lookKey(look) {
    return [look.skin, look.hair, look.hairStyle, look.shirt, look.pants, look.shoes, look.dress, look.umbrella,
      look.glasses ? 1 : 0, look.mustache ? 1 : 0, JSON.stringify(look.f)].join('|');
  }
  function get(look, frame, hc) {
    const wheel = look.f && look.f.wheelchair;
    const key = (wheel ? 'W' : 'P') + (wheel ? 0 : frame) + (hc ? 'h' : '') + lookKey(look);
    let cv = cache.get(key);
    if (!cv) {
      const g = wheel ? drawWheelchair(look) : (look.f && look.f.pregnant) ? drawPregnant(look, frame) : drawPerson(look, frame);
      cv = g.outline(hc ? '#000000' : OUT).toCanvas();
      cache.set(key, cv);
      if (cache.size > 600) cache.delete(cache.keys().next().value);
    }
    return cv;
  }
  let silCache = {};
  function silhouette(hc) { const k = hc ? 'h' : 'n'; return silCache[k] || (silCache[k] = drawSilhouette(hc)); }

  // anchor = feet point inside the sprite
  function anchor(look) { return (look.f && look.f.wheelchair) ? { x: 13, y: 30, w: WW, h: WH } : { x: 11, y: 30, w: PW, h: PH }; }

  window.BSC_SPRITES = { Grid, PAL, OUT, shade, mix, hex2rgb, randomLook, twinLook, get, silhouette, anchor };
})();
