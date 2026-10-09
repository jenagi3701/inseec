// Original illustrated settings for quest covers — slice-of-life places drawn in SVG.
// Each scene has three times of day so covers vary between activities.
import { useId, type ReactNode } from 'react';
import type { SceneId } from '../../data/types';

const INK = '#2b2440';
const line = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

type Time = 'jour' | 'crepuscule' | 'soir';
const SKIES: Record<Time, [string, string, string]> = {
  jour: ['#bcd8f3', '#dfeaf8', '#fff3e4'],
  crepuscule: ['#b6a3e8', '#f3b6cb', '#fde2c4'],
  soir: ['#3e3a6e', '#6c5ca8', '#c79ac4'],
};

export function timeFromSeed(seed: string): Time {
  const n = seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return (['jour', 'crepuscule', 'soir'] as Time[])[n % 3];
}

function Sky({ id, time }: { id: string; time: Time }) {
  const [a, b, c] = SKIES[time];
  return (
    <>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset=".6" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#sky${id})`} />
      {time === 'soir' ? (
        <g fill="#fff">
          {[[40, 30], [120, 18], [210, 40], [300, 22], [360, 50], [80, 60], [250, 70]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.4" opacity=".85" />)}
          <circle cx="330" cy="42" r="14" fill="#fff6d8" />
          <circle cx="336" cy="38" r="12" fill="#6c5ca8" opacity=".9" />
        </g>
      ) : (
        <g fill="#fff" opacity=".9">
          <path d="M40 58c0-9 12-12 17-6 4-8 18-7 19 3 8-1 11 9 4 11H44c-4 0-4-6-4-8z" />
          <path d="M250 36c0-7 9-9 13-5 3-6 14-5 15 2 6-1 8 7 3 8h-28c-3 0-3-4-3-5z" />
        </g>
      )}
    </>
  );
}

function Wires({ y = 40, time }: { y?: number; time: Time }) {
  const c = time === 'soir' ? '#1c1934' : INK;
  return (
    <g fill="none" stroke={c} strokeWidth="1.3" opacity=".75">
      <path d={`M-10 ${y}Q120 ${y + 22} 260 ${y + 4}T420 ${y + 10}`} />
      <path d={`M-10 ${y + 10}Q130 ${y + 34} 260 ${y + 14}T420 ${y + 22}`} />
    </g>
  );
}

function Tone({ id }: { id: string }) {
  return (
    <>
      <defs>
        <pattern id={`tone${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.85" fill={INK} opacity=".16" />
        </pattern>
      </defs>
      <rect width="400" height="220" fill={`url(#tone${id})`} style={{ mixBlendMode: 'multiply' }} />
    </>
  );
}

function Petals({ color = '#f7b8ca', seed = 0 }: { color?: string; seed?: number }) {
  const pts = [[60, 40], [140, 90], [230, 30], [310, 110], [370, 60], [190, 150], [30, 130]];
  return (
    <g fill={color} stroke={INK} strokeWidth=".8">
      {pts.map(([x, y], i) => (
        <path key={i} d="M0 0c3-4 8-3 8 1-1 4-6 5-8-1z" transform={`translate(${(x + seed * 13) % 400} ${y}) rotate(${(i * 47 + seed * 20) % 360})`} />
      ))}
    </g>
  );
}

const windowGlow = (time: Time) => (time === 'soir' ? '#ffe3a3' : '#fdf6ea');

/* ——— 1. Manga café / bookshop ——— */
function MangaCafe({ id, time }: { id: string; time: Time }) {
  const spines = ['#f7b8ca', '#b9a6ea', '#a8d8c6', '#f5c88a', '#9fbbe3', '#e88a8a', '#fff1c9', '#c7b3e8'];
  return (
    <>
      <rect width="400" height="220" fill="#fbe9df" />
      {/* window */}
      <g>
        <rect x="24" y="22" width="130" height="112" rx="6" fill="#fff" {...line} />
        <svg x="30" y="28" width="118" height="100" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice"><Sky id={id + 'w'} time={time} /><path d="M0 170h60v-50h50v30h60v-70h70v60h60v-40h100v150H0z" fill={time === 'soir' ? '#2c2850' : '#a8b4d6'} /></svg>
        <path d="M89 22v112M24 78h130" {...line} />
      </g>
      {/* shelves */}
      <g>
        <rect x="190" y="14" width="196" height="150" fill="#c99a76" {...line} />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <rect x="198" y={22 + r * 47} width="180" height="40" fill="#8a5a3c" stroke={INK} strokeWidth="1.5" />
            {Array.from({ length: 13 }, (_, i) => {
              const w = 9 + ((i * 7 + r * 3) % 5);
              const x = 200 + i * 13.6;
              const h = 30 + ((i * 5 + r) % 8);
              return <rect key={i} x={x} y={60 + r * 47 - h} width={w} height={h} rx="1.5" fill={spines[(i + r * 3) % spines.length]} stroke={INK} strokeWidth="1.2" />;
            })}
          </g>
        ))}
      </g>
      {/* lamp */}
      <path d="M118 0v26" {...line} />
      <path d="M100 44c0-10 8-18 18-18s18 8 18 18z" fill="#f7b8ca" {...line} />
      <ellipse cx="118" cy="62" rx="40" ry="12" fill="#fff3c9" opacity=".55" />
      {/* counter */}
      <rect x="-5" y="160" width="410" height="70" fill="#e8b98e" {...line} />
      <rect x="-5" y="160" width="410" height="10" fill="#f2cba4" stroke={INK} strokeWidth="2" />
      {/* open manga */}
      <g transform="translate(120 128)">
        <path d="M0 34L40 26L80 34L80 40L40 33L0 40Z" fill="#fff" {...line} />
        <path d="M0 34L40 26V33L0 40Z" fill="#fff" {...line} />
        <path d="M6 32l28-5M6 28l28-5" stroke={INK} strokeWidth="1" opacity=".4" />
        <rect x="46" y="27" width="12" height="6" fill={INK} opacity=".25" transform="skewY(10)" />
      </g>
      {/* cups */}
      {[[250, 140, '#fff'], [290, 146, '#b9a6ea']].map(([x, y, c]) => (
        <g key={String(x)} transform={`translate(${x} ${y})`}>
          <path d="M0 0h26l-3 20H3z" fill={String(c)} {...line} />
          <path d="M26 5c8 0 8 10 0 10" fill="none" {...line} />
          <path d="M8-6c-3-5 3-7 0-12M17-6c-3-5 3-7 0-12" fill="none" stroke={INK} strokeWidth="1.4" opacity=".5" />
        </g>
      ))}
      <ellipse cx="60" cy="168" rx="26" ry="6" fill={INK} opacity=".08" />
      <path d="M45 166c0-16 4-24 15-24s15 8 15 24z" fill="#a8d8c6" {...line} />
      <path d="M60 142c-8-14-2-24 6-26-2 10 4 16-6 26zM60 142c8-12 18-12 22-6-8 0-14 4-22 6z" fill="#7fbf8f" {...line} />
      <Tone id={id} />
    </>
  );
}

/* ——— 2. Board-game table ——— */
function GameTable({ id, time }: { id: string; time: Time }) {
  return (
    <>
      <rect width="400" height="220" fill="#e7eef8" />
      <rect x="250" y="12" width="120" height="76" rx="6" fill="#fff" {...line} />
      <svg x="256" y="18" width="108" height="64" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice"><Sky id={id + 'w'} time={time} /></svg>
      <path d="M310 12v76" {...line} />
      {/* garland */}
      <path d="M0 20Q100 50 230 18" fill="none" stroke={INK} strokeWidth="1.3" />
      {[30, 70, 110, 150, 190].map((x, i) => <path key={x} d={`M${x} ${28 + Math.sin(i) * 3}l7 14 7-14z`} fill={['#f7b8ca', '#b9a6ea', '#a8d8c6', '#f5c88a', '#9fbbe3'][i]} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />)}
      {/* table */}
      <path d="M-20 228L40 96H360L420 228Z" fill="#d79c6b" {...line} />
      <path d="M40 96H360L366 106H34Z" fill="#e8b98e" stroke={INK} strokeWidth="1.6" />
      {/* board */}
      <path d="M120 112H280L300 176H100Z" fill="#fff6e4" {...line} />
      {Array.from({ length: 5 }, (_, i) => <path key={'v' + i} d={`M${140 + i * 30} 112L${125 + i * 37.5} 176`} stroke={INK} strokeWidth="1" opacity=".5" />)}
      {[128, 144, 160].map((y) => <path key={y} d={`M${120 - (y - 112) * 0.31} ${y}H${280 + (y - 112) * 0.31}`} stroke={INK} strokeWidth="1" opacity=".5" />)}
      <path d="M150 128l8-6 8 6-8 6z" fill="#f7b8ca" stroke={INK} strokeWidth="1.4" />
      <path d="M220 150l9-7 9 7-9 7z" fill="#b9a6ea" stroke={INK} strokeWidth="1.4" />
      {/* meeples */}
      {[[188, 118, '#e88a8a'], [246, 126, '#9fbbe3'], [170, 150, '#a8d8c6']].map(([x, y, c]) => (
        <path key={String(x)} transform={`translate(${x} ${y})`} d="M6 0a4 4 0 1 1 0 .1M0 16l2-7-4-1 4-3h8l4 3-4 1 2 7z" fill={String(c)} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      ))}
      {/* cards */}
      <g transform="translate(40 150)">
        {[-18, -6, 6].map((r, i) => <rect key={r} x="0" y="0" width="30" height="42" rx="4" fill={['#fff', '#fde3ec', '#ece6fb'][i]} {...line} transform={`rotate(${r} 15 42)`} />)}
        <circle cx="21" cy="16" r="5" fill="#f7b8ca" stroke={INK} strokeWidth="1.3" transform="rotate(6 15 42)" />
      </g>
      {/* dice */}
      {[[318, 150, 8], [346, 166, -12]].map(([x, y, r]) => (
        <g key={x} transform={`translate(${x} ${y}) rotate(${r})`}>
          <rect x="0" y="0" width="20" height="20" rx="4" fill="#fff" {...line} />
          <circle cx="6" cy="6" r="1.8" fill={INK} /><circle cx="14" cy="14" r="1.8" fill={INK} /><circle cx="10" cy="10" r="1.8" fill={INK} />
        </g>
      ))}
      <g transform="translate(330 104)">
        <path d="M0 0h24l-3 18H3z" fill="#a8d8c6" {...line} />
        <path d="M8-6c-3-5 3-7 0-12" fill="none" stroke={INK} strokeWidth="1.4" opacity=".5" />
      </g>
      <Tone id={id} />
    </>
  );
}

/* ——— 3. Japanese neighbourhood street ——— */
function Street({ id, time }: { id: string; time: Time }) {
  const night = time === 'soir';
  const bld = night ? '#4b4580' : '#c8d3ea';
  const bld2 = night ? '#5b5394' : '#e6dcf3';
  return (
    <>
      <Sky id={id} time={time} />
      {/* far buildings */}
      <path d="M0 110h40V70h36v26h30V58h44v40h26V76h40v34h40V64h50v30h34V80h60v140H0z" fill={bld} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" opacity=".9" />
      {[[52, 80], [118, 70], [128, 86], [262, 74], [272, 90], [360, 92]].map(([x, y]) => <rect key={x + '' + y} x={x} y={y} width="7" height="7" fill={windowGlow(time)} opacity=".9" />)}
      <Wires y={30} time={time} />
      {/* utility pole */}
      <path d="M360 0v190M344 26h32M348 40h24" {...line} />
      {/* shop */}
      <rect x="40" y="96" width="200" height="110" fill={bld2} {...line} />
      <path d="M30 96h220l-12 22H42z" fill="#d9577f" {...line} />
      <path d="M42 118h196" stroke="#fff" strokeWidth="2" opacity=".5" />
      {/* noren curtain */}
      <g>
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${86 + i * 27} 126h25v38q-12 5-25 0z`} fill="#3f4f7d" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        ))}
        <circle cx="140" cy="146" r="9" fill="none" stroke="#fff" strokeWidth="2" opacity=".85" />
      </g>
      <rect x="86" y="164" width="108" height="42" fill={windowGlow(time)} {...line} />
      <path d="M140 164v42" {...line} />
      {/* lanterns */}
      {[60, 220].map((x) => (
        <g key={x} className="float" style={{ animationDelay: `${x / 100}s`, transformOrigin: `${x}px 118px` }}>
          <path d={`M${x} 118v8`} {...line} />
          <ellipse cx={x} cy="140" rx="11" ry="15" fill={night ? '#ff9db5' : '#f7b8ca'} {...line} />
          <path d={`M${x - 11} 140h22M${x - 9} 132h18M${x - 9} 148h18`} stroke={INK} strokeWidth="1" opacity=".4" />
          {night && <ellipse cx={x} cy="140" rx="22" ry="26" fill="#ffb3c6" opacity=".25" />}
        </g>
      ))}
      {/* vending machine */}
      <g transform="translate(270 112)">
        <rect width="46" height="94" rx="4" fill="#9fbbe3" {...line} />
        <rect x="6" y="8" width="34" height="44" rx="2" fill={night ? '#fff3c9' : '#fff'} stroke={INK} strokeWidth="1.5" />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={10 + c * 10} y={12 + r * 13} width="6" height="10" rx="2" fill={['#f7b8ca', '#a8d8c6', '#f5c88a'][(r + c) % 3]} stroke={INK} strokeWidth="1" />))}
        <rect x="10" y="62" width="26" height="8" rx="2" fill={INK} opacity=".3" />
        <rect x="8" y="78" width="30" height="10" rx="2" fill="#fff" stroke={INK} strokeWidth="1.4" />
      </g>
      {/* ground */}
      <rect x="-5" y="204" width="410" height="20" fill={night ? '#3a3560' : '#e9dccb'} {...line} />
      {/* cat */}
      <g transform="translate(330 186)">
        <path d="M0 18c0-10 6-14 14-14l3-6 3 6c4 2 6 6 6 14z" fill="#fff" {...line} />
        <path d="M26 16c8 0 10-8 6-12" fill="none" {...line} />
        <circle cx="12" cy="10" r="1.2" fill={INK} /><circle cx="18" cy="10" r="1.2" fill={INK} />
      </g>
      <Petals seed={id.length} />
      <Tone id={id} />
    </>
  );
}

/* ——— 4. Arcade ——— */
function Arcade({ id }: { id: string; time: Time }) {
  const cab = (x: number, body: string, screen: string, k: number) => (
    <g key={x} transform={`translate(${x} 40)`}>
      <ellipse cx="40" cy="168" rx="46" ry="8" fill="#000" opacity=".15" />
      <path d="M8 0h64l6 70-4 40 4 56H4l4-56-4-40z" fill={body} {...line} />
      <rect x="14" y="10" width="52" height="14" rx="3" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <path d="M22 17h36" stroke={body} strokeWidth="3" strokeLinecap="round" />
      <rect x="14" y="32" width="52" height="40" rx="4" fill={screen} stroke={INK} strokeWidth="1.8" />
      {/* pixel sprite (generic) */}
      <g fill="#fff" opacity=".95">
        {k === 0 && <path d="M30 44h6v6h6v-6h6v12h-6v6h-6v-6h-6z" />}
        {k === 1 && <path d="M28 58l12-14 12 14z" />}
        {k === 2 && <><circle cx="34" cy="52" r="7" /><rect x="44" y="48" width="6" height="6" /></>}
      </g>
      <ellipse cx="40" cy="52" rx="34" ry="26" fill={screen} opacity=".22" />
      <path d="M8 86h68l-4 14H12z" fill="#fff" {...line} />
      <path d="M26 88v-8" {...line} />
      <circle cx="26" cy="79" r="4" fill="#f7b8ca" stroke={INK} strokeWidth="1.5" />
      <circle cx="46" cy="92" r="3" fill="#a8d8c6" stroke={INK} strokeWidth="1.3" />
      <circle cx="56" cy="90" r="3" fill="#f5c88a" stroke={INK} strokeWidth="1.3" />
    </g>
  );
  return (
    <>
      <rect width="400" height="220" fill="#5d4f96" />
      <rect width="400" height="220" fill="#3c3470" opacity=".35" />
      <g opacity=".35" stroke="#b9a6ea" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 50 - 20} 220L${200} 150`} />)}
        <path d="M0 196H400M0 178H400" />
      </g>
      <g transform="translate(160 18)">
        <rect width="80" height="20" rx="10" fill="#2b2440" stroke="#ffd1dc" strokeWidth="1.5" />
        {[14, 30, 46, 62].map((x, i) => <circle key={x} cx={x + 2} cy="10" r="3" fill={['#ffd1dc', '#c7b3e8', '#a8d8c6', '#fff1c9'][i]} />)}
      </g>
      {cab(30, '#f7b8ca', '#6e56c2', 0)}
      {cab(150, '#9fbbe3', '#d9577f', 1)}
      {cab(270, '#a8d8c6', '#4e74a8', 2)}
      <Tone id={id} />
    </>
  );
}

/* ——— 5. Drawing atelier ——— */
function Atelier({ id, time }: { id: string; time: Time }) {
  return (
    <>
      <rect width="400" height="220" fill="#fdf0de" />
      <rect x="30" y="14" width="160" height="104" rx="6" fill="#fff" {...line} />
      <svg x="36" y="20" width="148" height="92" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice"><Sky id={id + 'w'} time={time} /><path d="M0 160Q100 110 200 150T400 130V220H0z" fill="#a8d8c6" stroke={INK} strokeWidth="3" /></svg>
      <path d="M110 14v104M30 66h160" {...line} />
      {/* string of drawings */}
      <path d="M210 26Q300 44 390 24" fill="none" stroke={INK} strokeWidth="1.3" />
      {[[232, 30, '#fde3ec'], [286, 36, '#ece6fb'], [340, 32, '#e3f0d9']].map(([x, y, c], i) => (
        <g key={String(x)} transform={`translate(${x} ${y}) rotate(${[-6, 3, -2][i]})`}>
          <rect width="40" height="48" fill={String(c)} {...line} />
          <circle cx="20" cy="20" r="9" fill="none" stroke={INK} strokeWidth="1.4" />
          <path d="M14 21h3M23 21h3M16 26q4 3 8 0M8 46q12-14 24 0" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
          <rect x="16" y="-4" width="8" height="8" fill="#f5c88a" stroke={INK} strokeWidth="1.2" />
        </g>
      ))}
      {/* desk */}
      <rect x="-5" y="150" width="410" height="80" fill="#c99a76" {...line} />
      {/* sketchbook */}
      <g transform="translate(110 120) rotate(-6)">
        <rect width="150" height="70" rx="4" fill="#fff" {...line} />
        <path d="M75 0v70" stroke={INK} strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M20 46q12-26 34-14 10 6 4 18" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="36" cy="30" r="10" fill="none" stroke={INK} strokeWidth="1.5" />
        <path d="M92 18h40M92 28h30M92 38h36" stroke={INK} strokeWidth="1.2" opacity=".35" />
      </g>
      {/* pencil */}
      <g transform="translate(272 170) rotate(-24)">
        <rect width="70" height="9" fill="#f5c88a" {...line} />
        <path d="M70 0l12 4.5-12 4.5z" fill="#fde7cf" {...line} />
        <rect x="-8" width="8" height="9" fill="#f7b8ca" {...line} />
      </g>
      {/* pencil cup */}
      <g transform="translate(330 104)">
        {[[-6, '#b9a6ea'], [4, '#f7b8ca'], [12, '#a8d8c6']].map(([r, c]) => <rect key={String(r)} x={12 + Number(r)} y="-20" width="6" height="44" fill={String(c)} stroke={INK} strokeWidth="1.3" transform={`rotate(${r} 20 24)`} />)}
        <path d="M0 10h40l-4 40H4z" fill="#9fbbe3" {...line} />
      </g>
      <g transform="translate(40 116)">
        <path d="M6 34c0-14 4-20 14-20s14 6 14 20z" fill="#f2cba4" {...line} />
        <path d="M20 14c-10-12-4-22 4-24-2 10 4 14-4 24zM20 14c8-10 18-10 22-4-8 0-14 2-22 4zM20 14c-8-8-18-6-20 0 8-2 14 0 20 0z" fill="#7fbf8f" {...line} />
      </g>
      <Tone id={id} />
    </>
  );
}

/* ——— 6. Riverside / park outing ——— */
function Riverside({ id, time }: { id: string; time: Time }) {
  const night = time === 'soir';
  return (
    <>
      <Sky id={id} time={time} />
      {!night && <circle cx="300" cy="70" r="22" fill="#fff3c9" stroke={INK} strokeWidth="1.6" />}
      <path d="M0 120Q60 92 130 112T260 104T400 112V150H0z" fill={night ? '#4b4580' : '#b9d7b0'} stroke={INK} strokeWidth="1.8" />
      {/* bridge */}
      <path d="M150 128Q220 84 290 128" fill="none" stroke={INK} strokeWidth="9" />
      <path d="M150 128Q220 84 290 128" fill="none" stroke={night ? '#8f84c9' : '#efe2cf'} strokeWidth="5.5" />
      <path d="M140 126H300" {...line} />
      {[170, 195, 220, 245, 270].map((x) => <path key={x} d={`M${x} 126v${-8 + Math.abs(x - 220) / 6}`} stroke={INK} strokeWidth="1.5" />)}
      {/* river */}
      <rect x="-5" y="128" width="410" height="50" fill={night ? '#5b5394' : '#9fc4e6'} stroke={INK} strokeWidth="2" />
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7">
        <path d="M30 144h30M120 156h40M240 146h26M310 160h44M80 168h24" />
      </g>
      {/* bank */}
      <path d="M-5 172Q100 164 200 172T405 170V225H-5z" fill={night ? '#3a3560' : '#d8e8c8'} stroke={INK} strokeWidth="2" />
      {/* autumn trees */}
      {[[40, 150, '#e88a6a'], [86, 160, '#f5b56a'], [350, 154, '#d9577f']].map(([x, y, c]) => (
        <g key={String(x)} transform={`translate(${x} ${y})`}>
          <path d="M0 40V10" stroke={INK} strokeWidth="3" />
          <circle cx="0" cy="0" r="20" fill={String(c)} {...line} />
          <circle cx="-12" cy="8" r="12" fill={String(c)} {...line} />
          <circle cx="12" cy="8" r="12" fill={String(c)} {...line} />
        </g>
      ))}
      {/* bench + picnic blanket */}
      <g transform="translate(180 178)">
        <path d="M0 18l14-14h70l14 14z" fill="#fde3ec" {...line} />
        <path d="M14 4l8 14M34 4l4 14M56 4l-2 14M76 4l-6 14" stroke="#f7b8ca" strokeWidth="3" />
        <rect x="36" y="-6" width="24" height="12" rx="3" fill="#fff" {...line} />
        <path d="M40-6v-4h16v4" fill="none" stroke={INK} strokeWidth="1.5" />
      </g>
      <Wires y={22} time={time} />
      <Petals color="#f5b56a" seed={id.length} />
      <Tone id={id} />
    </>
  );
}

const SCENES: Record<SceneId, (p: { id: string; time: Time }) => ReactNode> = {
  'manga-cafe': MangaCafe,
  'game-table': GameTable,
  street: Street,
  arcade: Arcade,
  atelier: Atelier,
  riverside: Riverside,
};

export function Scene({ scene, seed = scene, time, className = '' }: { scene: SceneId; seed?: string; time?: Time; className?: string }) {
  const id = useId().replace(/:/g, '');
  const t = time ?? timeFromSeed(seed);
  const Comp = SCENES[scene];
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <Comp id={id} time={t} />
    </svg>
  );
}
