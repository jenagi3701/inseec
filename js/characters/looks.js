'use strict';
// ---------------------------------------------------------
// HERO LOOKS (original pixel designs)
// ---------------------------------------------------------
const LOOK = {
  captain: {
    skin: '#f2c49b', shirt: '#d63c3c', pants: '#3a6fd6', shoes: '#c79a5a',
    torso(U) { U(-1, 12, 2, 5, '#f2c49b'); U(-4, 17, 8, 1, '#f5d76e'); },
    head(U) {
      U(-4, 3, 8, 2, '#1d1d1d'); U(-4, 5, 1, 3, '#1d1d1d'); U(-3, 5, 2, 1, '#1d1d1d');
      U(-7, 3, 14, 1, '#e8c547'); U(-4, 0, 8, 3, '#f0d060'); U(-4, 2, 8, 1, '#c22'); U(-3, 0, 6, 1, '#f7e08a');
      U(1, 9, 2, 1, '#9b3a2a');
    },
  },
  swordsman: {
    skin: '#e6b48a', shirt: '#eeeeee', pants: '#24243a', shoes: '#111',
    torso(U) { U(-4, 16, 8, 2, '#2e8b3e'); U(-4, 15, 8, 1, '#3fae4b'); },
    back(U) { U(-7, 13, 1, 6, '#f5f5f5'); U(-6, 14, 1, 6, '#c33'); U(-5, 15, 1, 5, '#222'); },
    head(U) {
      U(-4, 3, 8, 2, '#3fae4b'); U(-4, 5, 1, 2, '#3fae4b'); U(-3, 2, 1, 1, '#3fae4b'); U(0, 2, 1, 1, '#3fae4b'); U(2, 2, 1, 1, '#3fae4b');
      U(-4, 8, 1, 2, '#ffd23f'); U(1, 6, 3, 1, '#2b2b2b');
    },
    weapon(U, pose) {
      if (pose.act === 'slash' || pose.act === 'spin') { U(9, 4, 2, 2, '#c33'); U(11, 2, 1, 1, '#ddd'); U(10, 3, 1, 1, '#ddd'); U(12, 1, 2, 1, '#fff'); U(2, 10, 6, 1, '#ddd'); }
      else { U(3, 18, 1, 1, '#000'); }
    },
  },
  navigator: {
    skin: '#f6cfae', shirt: '#ffffff', pants: '#f6cfae', shoes: '#2a7bd6',
    torso(U) { U(-4, 13, 8, 1, '#2a7bd6'); U(-4, 15, 8, 1, '#2a7bd6'); U(-4, 17, 8, 3, '#f2a83e'); },
    back(U) { U(-6, 5, 2, 11, '#ff8a2a'); U(-5, 15, 2, 2, '#ff8a2a'); },
    head(U) { U(-4, 3, 8, 2, '#ff8a2a'); U(-4, 5, 2, 3, '#ff8a2a'); U(3, 4, 1, 2, '#ff8a2a'); U(1, 8, 1, 1, '#f49a9a'); },
    weapon(U, pose) {
      if (pose.act === 'cast') { U(4, -2, 1, 13, '#4ab0ff'); U(3, -3, 3, 2, '#9fe6ff'); }
      else { U(5, 6, 1, 17, '#4ab0ff'); U(4, 5, 3, 2, '#9fe6ff'); U(5, 11, 1, 1, '#1d4f8a'); U(5, 16, 1, 1, '#1d4f8a'); }
    },
  },
  sniper: {
    skin: '#c98b5a', shirt: '#8b5a2b', pants: '#6e7f3a', shoes: '#3b2414',
    torso(U) { U(-3, 12, 1, 6, '#6e7f3a'); U(2, 12, 1, 6, '#6e7f3a'); U(-4, 17, 8, 1, '#3b2414'); },
    head(U) {
      U(-5, 2, 10, 3, '#1a1a1a'); U(-5, 5, 2, 4, '#1a1a1a'); U(-4, 1, 3, 1, '#1a1a1a'); U(1, 1, 3, 1, '#1a1a1a');
      U(-3, 3, 7, 2, '#ffd23f'); U(1, 3, 2, 2, '#7fe3ff');
      U(4, 8, 4, 1, '#c98b5a'); U(7, 8, 1, 1, '#a86a3d');
    },
    weapon(U, pose) {
      if (pose.act === 'shoot' || pose.charge) { U(4, 12, 9, 2, '#6b4423'); U(13, 12, 5, 1, '#9aa'); U(6, 14, 2, 2, '#4a2e17'); }
      else { U(-6, 9, 1, 10, '#6b4423'); U(-6, 7, 1, 2, '#9aa'); }
    },
  },
  cook: {
    skin: '#f2c8a2', shirt: '#22232b', pants: '#22232b', shoes: '#6b3f22',
    torso(U) { U(-1, 12, 3, 1, '#5b8cff'); U(0, 13, 1, 4, '#ffcc00'); U(-4, 17, 8, 1, '#111'); },
    head(U) { U(-4, 3, 8, 2, '#ffe066'); U(-4, 5, 1, 3, '#ffe066'); U(1, 4, 3, 5, '#ffe066'); U(0, 4, 1, 2, '#ffe066'); U(-1, 7, 1, 1, '#111'); U(-1, 6, 2, 1, '#b8860b'); },
  },
  doctor: {
    skin: '#f7d7b5', shirt: '#f4f7ff', pants: '#3a3f5c', shoes: '#222',
    torso(U) { U(-5, 12, 10, 8, '#f4f7ff'); U(-1, 12, 2, 8, '#d6e2f5'); U(2, 14, 2, 2, '#e23b3b'); U(-5, 19, 10, 1, '#c8d3e8'); },
    back(U) { U(-8, 14, 4, 4, '#8b4513'); U(-7, 15, 2, 1, '#fff'); },
    head(U) {
      U(-4, 3, 8, 2, '#7a4b2a'); U(-4, 5, 1, 2, '#7a4b2a');
      U(-5, 0, 10, 3, '#3fd0c9'); U(-6, 2, 12, 1, '#2aa8a1'); U(-1, 0, 2, 3, '#fff'); U(-2, 1, 4, 1, '#fff'); U(-1, 1, 2, 1, '#e23b3b');
      U(1, 7, 3, 1, '#333'); U(1, 8, 1, 1, '#333'); U(3, 8, 1, 1, '#333');
    },
  },
  archaeologist: {
    skin: '#e9c1a0', shirt: '#7c4dff', pants: '#3b2b6b', shoes: '#1b1430',
    torso(U) { U(-4, 12, 8, 8, '#7c4dff'); U(-1, 12, 2, 8, '#5a33c9'); U(-4, 16, 8, 1, '#ffd700'); },
    back(U) { U(-6, 4, 2, 13, '#1b1430'); },
    head(U, pose) {
      U(-4, 3, 8, 2, '#1b1430'); U(-4, 5, 2, 4, '#1b1430'); U(-4, 4, 8, 1, '#ffd700'); U(1, 4, 1, 1, '#4dd0e1');
      if (pose.mermaid) { U(-6, 3, 2, 6, '#4dd0e1'); }
    },
  },
  shipwright: {
    skin: '#e0a679', shirt: '#ff4f6d', pants: '#22305a', shoes: '#111', sleeve: '#9aa6b2', hand: '#c9d2dc',
    torso(U) { U(-3, 13, 1, 1, '#ffd23f'); U(1, 15, 1, 1, '#ffd23f'); U(-2, 16, 1, 1, '#ffd23f'); U(2, 12, 1, 1, '#ffd23f'); U(-4, 17, 8, 1, '#111'); },
    head(U) { U(-4, 1, 9, 4, '#2ec5ff'); U(3, 0, 5, 2, '#2ec5ff'); U(-4, 5, 1, 2, '#2ec5ff'); U(0, 7, 4, 2, '#111'); U(2, 7, 1, 1, '#7fe3ff'); },
    weapon(U, pose) {
      if (pose.cannon) { U(-2, 6, 12, 5, '#6b7785'); U(10, 5, 3, 7, '#3b4450'); U(0, 7, 8, 1, '#c9d2dc'); }
    },
  },
  musician: {
    skin: '#f3e3d3', shirt: '#5a2d82', pants: '#24183a', shoes: '#111',
    torso(U) { U(-1, 12, 2, 2, '#fff'); U(1, 14, 1, 1, '#ffd23f'); U(1, 16, 1, 1, '#ffd23f'); U(-4, 17, 8, 1, '#ffd23f'); },
    back(U) { U(-8, 10, 3, 8, '#a0522d'); U(-7, 8, 1, 3, '#5a2d0c'); U(-7, 12, 1, 4, '#5a2d0c'); },
    head(U) { U(-4, 4, 8, 1, '#ddd'); U(-4, 5, 1, 4, '#ddd'); U(-4, -3, 8, 4, '#1c1c1c'); U(-6, 1, 12, 2, '#1c1c1c'); U(-4, 0, 8, 1, '#b52b40'); },
    weapon(U, pose) {
      if (pose.act === 'slash') { U(9, 12, 9, 1, '#e8e8f0'); U(8, 11, 1, 3, '#ffd23f'); }
      else { U(4, 17, 1, 7, '#c0c0d0'); U(3, 16, 3, 1, '#ffd23f'); }
    },
  },
};

function drawHero(id, x, fy, face, pose) {
  pose = pose || {};
  const L = LOOK[id];
  const ox = Math.round(x), oy = Math.round(fy) - 24;
  const P_ = painter(face, ox, oy);
  const ph = pose.walk != null ? Math.floor(pose.walk) % 4 : -1;
  const bob = ph === 1 || ph === 3 ? 1 : 0;
  const U = (a, b, w, h, c) => P_(a, b + bob, w, h, c);
  const skin = pose.power ? '#ff9c8c' : L.skin;
  const sleeve = L.sleeve || skin;
  const hand = L.hand || skin;
  if (L.back) L.back(U, pose);
  // back arm
  U(-6, 12, 2, 5, sleeve); U(-6, 17, 2, 1, hand);
  // legs
  if (pose.mermaid) {
    const sw = Math.round(Math.sin((pose.t || 0) * 10) * 1);
    P_(-4, 18, 8, 3, '#21c7b8'); P_(-3 + sw, 21, 6, 2, '#1aa597'); P_(-1 + sw, 23, 6, 1, '#5ff2e4'); P_(-4, 19, 8, 1, '#7ff9ec');
  } else if (pose.act === 'kick') {
    P_(-3, 18, 3, 5, L.pants); P_(-3, 23, 3, 1, L.shoes);
    P_(0, 15, 9, 3, L.pants); P_(9, 15, 2, 3, L.shoes);
    if (pose.fire) { P_(4, 13, 3, 2, '#ffb000'); P_(7, 12, 4, 3, '#ff6a00'); P_(10, 14, 3, 2, '#ffd23f'); P_(1, 14, 3, 1, '#ff3d00'); }
  } else if (pose.air) {
    P_(-3, 18, 3, 4, L.pants); P_(-3, 22, 3, 1, L.shoes);
    P_(1, 17, 3, 4, L.pants); P_(1, 21, 3, 1, L.shoes);
  } else {
    const lx = ph === 1 ? [-4, 1] : ph === 3 ? [-2, -1] : [-3, 0];
    P_(lx[0], 18, 3, 5, L.pants); P_(lx[0], 23, 3, 1, L.shoes);
    P_(lx[1], 18, 3, 5, L.pants); P_(lx[1], 23, 4, 1, L.shoes);
  }
  // torso + head
  U(-4, 12, 8, 6, L.shirt);
  if (L.torso) L.torso(U, pose);
  U(-4, 4, 8, 8, skin);
  U(2, 7, 1, 2, '#111');
  U(1, 10, 2, 1, '#8a3b3b');
  if (L.head) L.head(U, pose, skin);
  // front arm by action
  const act = pose.act;
  if (act === 'stretch') {
    const len = Math.max(0, Math.round(pose.L || 0));
    const s = pose.fist || 4;
    for (let i = 0; i < len; i += 2) U(3 + i, 13 + (Math.sin(i * 0.3 + (pose.t || 0) * 30) > 0.7 ? 1 : 0), 2, 2, skin);
    U(3 + len, 14 - Math.ceil(s / 2), s, s, skin);
    U(3 + len + s - 1, 14 - Math.ceil(s / 2), 1, s, '#d99a7a');
  } else if (act === 'punch' || act === 'shoot') {
    U(3, 13, 6, 2, sleeve); U(9, 12, 3, 3, hand);
  } else if (act === 'slash') {
    U(3, 11, 5, 2, sleeve); U(8, 10, 2, 2, hand);
  } else if (act === 'cast') {
    U(3, 6, 2, 6, sleeve); U(3, 4, 2, 2, hand);
  } else if (act === 'rocket') {
    U(3, 12, 2, 2, '#555');
  } else if (act !== 'spin') {
    U(3, 12, 2, 5, sleeve); U(3, 17, 2, 1, hand);
  }
  if (L.weapon) L.weapon(U, pose);
}
