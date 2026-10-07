'use strict';
// =========================================================
// PIXEL ICONS — original 12x12 art for every action button
// =========================================================
const ICON_PAL = {
  k: '#1a1a1a', w: '#ffffff', y: '#ffd23f', o: '#ff7a00', r: '#e53935', p: '#f2c49b', b: '#2979ff', c: '#4dd0e1',
  g: '#43a047', s: '#b0bec5', d: '#607d8b', n: '#8d6e63', v: '#9575cd', l: '#bbdefb', m: '#ce93d8', x: '#7f0000', e: '#90a4ae',
};
const ICON_ART = {
  fist: ['............', '...pppppp...', '..pkpkpkpp..', '..pppppppp..', '..pkpkpkpp..', '..pppppppp..', '..ppppppp...', '...pppppp...', '....rrrr....', '....rrrr....', '....rrrr....', '............'],
  stretch: ['............', '............', '.........ppp', '........pkpp', '.......ppppp', '......pp.ppp', '.....pp.....', '....pp......', 'rrrpp.......', 'rrrr........', 'rrr.........', '............'],
  power: ['.....ww.....', '....w..w....', '...w.ww.w...', '..r.rrrr.r..', '..rrrrrrrr..', '..rkrrrrkr..', '..rrrrrrrr..', '...rrkkrr...', '....rrrr....', '...w....w...', '..w......w..', '............'],
  haki: ['k....r.....k', '.k..rr....k.', '..k.r....k..', '...krrrrk...', '..rrkkkkrr..', 'rrrkkrrkkrrr', '..rrkkkkrr..', '...krrrrk...', '..k....r.k..', '.k....rr..k.', 'k.....r....k', '............'],
  white: ['...wwwwww...', '..wywwwwyw..', '.wwwwwwwwww.', '.wwpppppppw.', 'wwpkppppkpww', '.wpppppppp w'.replace(' ', 'w'), '.wpwwwwwwpw.', '.wppwwwwppw.', '..wpppppp w.'.replace(' ', 'w'), '...wwwwww...', '..w..ww..w..', '.w...ww...w.'],
  sword: ['..........ww', '.........ws.', '........ws..', '.......ws...', '......ws....', '.....ws.....', '..y.ws......', '...yy.......', '...yy.......', '..n..y......', '.n..........', 'n...........'],
  triple: ['w....w....w.', 's....s....s.', 's....s....s.', 's....s....s.', 's....s....s.', 's....s....s.', 's....s....s.', 'y....y....y.', 'yy..yy...yy.', 'r....k....w.', 'r....k....w.', '............'],
  spin: ['....wwww....', '..ww....ww..', '.w...ss...w.', 'w...s..s...w', 'w..s....s..w', 'w..s.yy.s..w', 'w..s.yy.s..w', 'w..s....s..w', '.w..s..s..w.', '..ww.ss.ww..', '....wwww....', '............'],
  guard: ['.s...s...s..', '.s...s...s..', '.s...s...s..', '.s...s...s..', 'yyyyyyyyyyy.', '.lllllllll..', '.lwwwwwwwl..', '.lwwwwwwwl..', '..lwwwwwl...', '...lwwwl....', '....lll.....', '............'],
  storm: ['w...r...k...', '.w...r...k..', '..w...r...k.', '...w...r...k', '..ww..rr..kk', '.ww..rr..kk.', 'ww..rr..kk..', '....w...r...', '.....w...r..', '......w...r.', '.......w....', '............'],
  wind: ['............', '....llll....', '...l....l...', '........l...', 'llllllllll..', '............', '.wwwwwwww...', '.........w..', '.........w..', '....wwwww...', '............', '............'],
  bolt: ['......yyyy..', '.....yyyy...', '....yyyy....', '...yyyy.....', '..yyyyyyyy..', '.....yyyy...', '....yyyy....', '...yyy......', '..yyy.......', '.yy.........', 'y...........', '............'],
  tornado: ['llllllllllll', '.wwwwwwwwww.', '..llllllll..', '...wwwwww...', '....llll....', '.....www....', '.....ll.....', '......w.....', '.....ll.....', '....ww......', '............', '............'],
  cloud: ['............', '...dddd.....', '..dddddddd..', '.dddddddddd.', 'dddddddddddd', '.dddddddddd.', '....y..y....', '...y..y.....', '..yyyyyy....', '....y..y....', '...y..y.....', '............'],
  chaos: ['..dddddddd..', '.dddddddddd.', '..dddddddd..', '..y..l..l...', '.yy.l..l..l.', 'yyyl..l..l..', '..y.l..ll...', '.y.ll..l..l.', '...l..lll...', '..llllllll..', '.l.wwwwww.l.', '............'],
  bullet: ['............', '............', '............', '....nnnn....', '.ssnnnnnnyy.', 'sssnnnnnnyyy', '.ssnnnnnnyy.', '....nnnn....', '............', '............', '............', '............'],
  charge: ['....rrrr....', '..rr....rr..', '.r..wwww..r.', '.r.w....w.r.', 'r.w..rr..w.r', 'r.w.rrrr.w.r', 'r.w.rrrr.w.r', 'r.w..rr..w.r', '.r.w....w.r.', '.r..wwww..r.', '..rr....rr..', '....rrrr....'],
  ricochet: ['............', 'rr..........', '.rr.........', '..rr........', '...rr.....rr', '....rr...rr.', '.....rr.rr..', '......rrr...', '......wr....', '............', 'ssssssssssss', '............'],
  smoke: ['....eeee....', '..eessssee..', '.essssssse..', 'esssseesssse', 'essseeeessse', '.esssssssse.', '..eesssee...', '....kkk.....', '...kkkkk....', '...kkokk....', '....kkk.....', '............'],
  mega: ['............', '.....oooo...', 'yyy.oyyyyo..', 'wwwwwwwwwwyo', 'wwwwwwwwwwwy', 'wwwwwwwwwwyo', 'yyy.oyyyyo..', '.....oooo...', '............', '............', '............', '............'],
  kick: ['............', '..........kk', '........kkkk', '.......kkkk.', '......kk....', '.....kk.....', '....kk......', 'kk.kk.......', 'kkkkk.......', 'kkkk........', 'nnn.........', '............'],
  fire: ['.....r......', '....rr..r...', '....ro..rr..', '...roo.ror..', '..rooyoooor.', '..rooyyoor..', '.roooyyyoor.', '.roooyyyyor.', '.rooyyyyyor.', '..rooyyyor..', '...rrooorr..', '............'],
  air: ['.....yy.....', '....yyyy....', '...yyyyyy...', '.....yy.....', '.....yy.....', '..kk.yy.kk..', '..kkk..kkk..', '...kkkkkk...', '....kkkk....', '.....kk.....', '............', '............'],
  wing: ['..........w.', '........ww..', '.......www..', '.....wwww...', '...wwwlww...', '..wwwlwww...', '.wwwlwww....', 'wwwlwww.....', '..wwwww.....', '....ww.oo...', '......oooo..', '............'],
  flame: ['r..r..r..r..', 'or.or.or.or.', 'yo.yo.yo.yo.', 'yy.yy.yy.yy.', '.k..k..k..k.', 'kkk.kkk.kkk.', '.k..k..k..k.', '............', 'oooooooooooo', 'rrrrrrrrrrrr', '............', '............'],
  pill: ['............', '............', '....rrww....', '...rrrwww...', '..rrrrwwww..', '..rrrrwwww..', '..rrrrwwww..', '..rrrrwwww..', '...rrrwww...', '....rrww....', '............', '............'],
  heart: ['............', '..rr....rr..', '.rwrr..rrrr.', '.rwrrrrrrrr.', '.rrrrrrrrrr.', '.rrrrrrrrrr.', '..rrrrrrrr..', '...rrrrrr...', '....rrrr....', '.....rr.....', '............', '............'],
  buff: ['.....yy.....', '....yyyy....', '...yyyyyy...', '..yy.yy.yy..', '.....yy.....', '..g..yy..b..', '.ggg.yy.bbb.', 'ggggg..bbbbb', '..g......b..', '..g......b..', '............', '............'],
  cross: ['....gggg....', '....gwwg....', '....gwwg....', '....gwwg....', 'ggggggwggggg', 'gwwwwwwwwwwg', 'gwwwwwwwwwwg', 'ggggggwggggg', '....gwwg....', '....gwwg....', '....gggg....', '............'],
  siren: ['.....yy.....', '..y..yy..y..', '...y....y...', '....rrbb....', '...rrrbbb...', '...rrrbbb...', '..rrrrbbbb..', '..rwrrbbwb..', '.kkkkkkkkkk.', '.kkkkkkkkkk.', '............', '............'],
  hand: ['............', '..v.v.v.....', '..v.v.v.v...', '..v.v.v.v...', '..vvvvvvv...', '..vvvvvvv.v.', '..vvvvvvvvv.', '...vvvvvvv..', '....vvvvv...', '....vvvv....', '....vvvv....', '...mmmmmm...'],
  arms: ['v...v...v...', 'vv..vv..vv..', '.v...v...v..', '.v...v...v..', '.v...v...v..', '.v...v...v..', '.v...v...v..', '.v...v...v..', '.v.kkkkkkk..', '.v.kkrkrkk..', '.v.kkkkkkk..', 'mmmmmmmmmmmm'],
  wave: ['............', '.......ll...', '.....lllll..', '....lbbblll.', '...lbbbbbll.', '...bbb..bbl.', '..bbb....b..', '.bbbb.......', 'bbbbbb......', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb', '............'],
  mermaid: ['....kkk.....', '...kpppk....', '...kpkpk....', '....ppp.....', '...vvvvv....', '....vvv.....', '....ccc.....', '....ccc.....', '.....cc.....', '......cc....', '....cccccc..', '...cc....cc.'],
  ocean: ['.v...v...v..', '.v...v...v..', 'lv..lv..lv..', 'lbblbbblbbl.', 'bbbbbbbbbbbl', 'bbwbbbwbbbbb', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb', '............', '............'],
  cannonball: ['............', '............', '....kkkk....', '...kdddkk...', '..kdwddddk..', '..kddddddk..', '..kddddddk..', '..kddddddk..', '...kddddk...', '....kkkk....', '............', '............'],
  cannon: ['............', '.......o.y..', '......kkk.y.', '..ddddddkky.', '.ddddddddkk.', 'ddddddddddk.', '.ddddddddkk.', '..nnnnnn....', '.nkknnkkn...', '.nkkn.nkkn..', '..kk...kk...', '............'],
  rocket: ['............', '.......sss..', '......sssss.', 'yo...ssssss.', 'oyoossssss..', 'yoossssss...', 'oyoossssss..', 'yo...ssssss.', '......sssss.', '.......sss..', '............', '............'],
  wall: ['ssssssssssss', 'sddsddsddsds', 'ssssssssssss', 'dsddsddsddsd', 'ssssssssssss', 'sddsddsddsds', 'ssssssssssss', 'dsddsddsddsd', 'ssssssssssss', 'sddsddsddsds', 'ssssssssssss', '............'],
  mecha: ['............', 'dd..........', 'ddd.cccccccc', 'ddddwwwwwwww', 'ddddwwwwwwww', 'ddd.cccccccc', 'dd..........', '.s..........', '.ss.........', '.sss........', '............', '............'],
  rapier: ['...........w', '..........w.', '.........w..', '........w...', '.......w....', '......w.....', '..yyyyw.....', '..y.yy......', '..y..y......', '...m........', '..m.........', '............'],
  sound: ['............', '...m....m...', '..m..m..m...', '.m..m..m..m.', '.m..m.mm..m.', '.m..m.mm..m.', '.m..m..m..m.', '..m..m..m...', '...m....m...', '............', '............', '............'],
  note: ['......mmmm..', '......mmmm..', '......m..m..', '......m..m..', '......m..m..', '......m..m..', '...mmmm.mm..', '..mmmmmmmm..', '..mmmm.mmm..', '...mm.......', '............', '............'],
  moon: ['....yyyy....', '..yyyy......', '.yyyy.......', '.yyy.....w..', 'yyyy....w.w.', 'yyyy.....w..', 'yyyy........', '.yyy........', '.yyyy....yy.', '..yyyyyyyy..', '....yyyy....', '............'],
  blade: ['m.........w.', '.m.......w..', 'mm..m...w...', '.m.m...w....', '..m...w.....', '.....w......', '..yyw.......', '...yy.......', '..y..y......', '.m..........', 'mm..........', '............'],
  jump: ['.....ww.....', '....wwww....', '...wwwwww...', '..wwwwwwww..', '.....ww.....', '.....ww.....', '.....ww.....', '............', '..ww....ww..', '..ww....ww..', '.www....www.', '............'],
  bomb: ['.......y.o..', '......o.y...', '.....n......', '....kkk.....', '..kkkkkkk...', '.kkwkkkkkk..', '.kwkkkkkkk..', '.kkkkkkkkk..', '.kkkkkkkkk..', '..kkkkkkk...', '....kkk.....', '............'],
};
const SKILL_ICONS = {
  captain: { basic: 'fist', s1: 'stretch', s2: 'power', s3: 'haki', ult: 'white' },
  swordsman: { basic: 'sword', s1: 'triple', s2: 'spin', s3: 'guard', ult: 'storm' },
  navigator: { basic: 'wind', s1: 'bolt', s2: 'tornado', s3: 'cloud', ult: 'chaos' },
  sniper: { basic: 'bullet', s1: 'charge', s2: 'ricochet', s3: 'smoke', ult: 'mega' },
  cook: { basic: 'kick', s1: 'fire', s2: 'air', s3: 'wing', ult: 'flame' },
  doctor: { basic: 'pill', s1: 'heart', s2: 'buff', s3: 'cross', ult: 'siren' },
  archaeologist: { basic: 'hand', s1: 'arms', s2: 'wave', s3: 'mermaid', ult: 'ocean' },
  shipwright: { basic: 'cannonball', s1: 'cannon', s2: 'rocket', s3: 'wall', ult: 'mecha' },
  musician: { basic: 'rapier', s1: 'sound', s2: 'note', s3: 'moon', ult: 'blade' },
};
const iconCache = {};
// returns a data: URL of the icon drawn at 12x12 (scaled crisply with CSS)
function iconURL(name) {
  if (iconCache[name]) return iconCache[name];
  const art = ICON_ART[name] || ICON_ART.fist;
  const c = document.createElement('canvas'); c.width = 12; c.height = 12;
  const x = c.getContext('2d');
  art.forEach((row, yy) => { for (let xx = 0; xx < 12; xx++) { const ch = row[xx]; if (ch && ch !== '.' && ICON_PAL[ch]) { x.fillStyle = ICON_PAL[ch]; x.fillRect(xx, yy, 1, 1); } } });
  iconCache[name] = c.toDataURL();
  return iconCache[name];
}
function iconImg(name, cls) { return `<img class="${cls || 'picon'}" src="${iconURL(name)}" alt="" draggable="false">`; }
