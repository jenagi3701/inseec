// Original anime-style bust avatars, drawn from simple SVG parts.
// No existing character is reproduced: every combination is generated.
import { useId } from 'react';
import type { AvatarConfig } from '../../data/types';

export const HAIR_STYLES = ['Courts en pointes', 'Carré frange', 'Longs ondulés', 'Chignon', 'Mi-longs décoiffés', 'Couettes'];
export const HAIR_COLORS = [
  { name: 'Chocolat', base: '#4a3330', shade: '#33221f' },
  { name: 'Nuit', base: '#2c2f4a', shade: '#1c1e33' },
  { name: 'Châtain', base: '#8a5a3c', shade: '#6a4129' },
  { name: 'Sakura', base: '#f0a3bb', shade: '#d77f9c' },
  { name: 'Lavande', base: '#b3a0e6', shade: '#8f7acb' },
  { name: 'Argent', base: '#d9dbe6', shade: '#aeb1c4' },
  { name: 'Miel', base: '#e8b860', shade: '#c9953f' },
  { name: 'Menthe', base: '#8fcab8', shade: '#68a894' },
];
export const SKIN_TONES = ['#ffe3d3', '#f6cfb5', '#e7b493', '#c98e6b', '#9c6a4c', '#6f4a36'];
export const EYE_COLORS = ['#6b4a3a', '#3f5fa8', '#7b5ac9', '#3f8a6c', '#c45a7a', '#c08a2e'];
export const OUTFITS = [
  { name: 'Sweat sakura', color: '#E99BB5', trim: '#fff' },
  { name: 'Veste marine', color: '#3f4f7d', trim: '#e7ecf7' },
  { name: 'Pull crème', color: '#f2e2c4', trim: '#c9a97a' },
  { name: 'Hoodie lavande', color: '#B9A7CC', trim: '#fff' },
  { name: 'Chemise sauge', color: '#A6B59A', trim: '#fff' },
  { name: 'Haut prune', color: '#5b3f6b', trim: '#f0c6d4' },
];
export const ACCESSORIES = ['Aucun', 'Lunettes rondes', 'Barrette étoile', 'Casque audio', 'Fleur', 'Pansement'];
export const EXPRESSIONS = ['Sourire', 'Ravi·e', 'Serein·e', 'Clin d’œil'];
export const AVATAR_BGS = ['#F6DCE5', '#E9E1F1', '#DCE8EC', '#E2E9DA', '#F2E4C6', '#F4EBDD'];

const INK = '#2a2338';

function fnv(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic avatar for members who never customised theirs. */
export function avatarFromSeed(seed: string, hue = 0): AvatarConfig {
  const pick = (n: number, salt: string) => fnv(`${seed}:${hue}:${salt}`) % n;
  const acc = pick(ACCESSORIES.length * 2, 'acc');
  return {
    hair: pick(HAIR_STYLES.length, 'hair'),
    hairColor: pick(HAIR_COLORS.length, 'hairColor'),
    skin: pick(SKIN_TONES.length, 'skin'),
    eyes: pick(EYE_COLORS.length, 'eyes'),
    outfit: pick(OUTFITS.length, 'outfit'),
    accessory: acc < ACCESSORIES.length ? acc : 0, // about half wear none
    expression: pick(EXPRESSIONS.length, 'expr'),
    bg: pick(AVATAR_BGS.length, 'bg'),
  };
}

/* ——— hair parts ——— */
function HairBack({ style, c }: { style: number; c: { base: string; shade: string } }) {
  const p = { fill: c.shade, stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  switch (style) {
    case 1: return <path {...p} d="M25 47C23 28 35 15 50 15C65 15 77 28 75 47L77 68C72 71 67 69 65 65L65 52H35L35 65C33 69 28 71 23 68Z" />;
    case 2: return <path {...p} d="M25 45C23 26 36 13 50 13C64 13 77 26 75 45C77 62 81 78 80 95C71 99 63 96 61 89L64 60H36L39 89C37 96 29 99 20 95C19 78 23 62 25 45Z" />;
    case 3: return <><circle {...p} cx="50" cy="13" r="9" /><path {...p} d="M27 46C25 29 37 18 50 18C63 18 75 29 73 46L72 54H28Z" /></>;
    case 4: return <path {...p} d="M25 46C22 28 35 15 50 15C65 15 78 28 75 46L75 62C71 64 68 63 66 60L66 52H34L34 60C32 63 29 64 25 62Z" />;
    case 5: return <>
      <path {...p} d="M28 38C18 44 14 60 17 80C20 86 26 86 29 80C29 66 31 54 33 46Z" />
      <path {...p} d="M72 38C82 44 86 60 83 80C80 86 74 86 71 80C71 66 69 54 67 46Z" />
      <path {...p} d="M27 46C25 29 37 18 50 18C63 18 75 29 73 46L72 52H28Z" />
    </>;
    default: return <path {...p} d="M27 47C26 31 36 18 50 18C64 18 74 31 73 47L70 52H30Z" />;
  }
}

function HairFront({ style, c }: { style: number; c: { base: string; shade: string } }) {
  const p = { fill: c.base, stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  const shine = <path d="M37 24Q50 18 63 24" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round" />;
  switch (style) {
    case 1: return <><path {...p} d="M27 44C26 28 37 18 50 18C63 18 74 28 73 44C67 40 60 38.5 50 38.5C40 38.5 33 40 27 44Z" />{shine}</>;
    case 2: return <><path {...p} d="M26 47C24 28 37 16 50 16C63 16 76 28 74 45C71 37 65 32.5 57 31.5C61 35 62 39 61 43C55 36.5 46 33.5 38 35.5C33 38.5 29 42 26 47Z" />{shine}</>;
    case 3: return <><path {...p} d="M27 45C25 28 37 18 50 18C63 18 75 28 73 45C70 38 66 34 60 33L56.5 41L52.5 33.5C46 34 42 36.5 40 41.5L37 34.5C32 36.5 29 40 27 45Z" />{shine}</>;
    case 4: return <><path {...p} d="M25 47C22 27 36 14 50 15C66 14 78 28 75 48L71.5 41L69.5 47.5L65 37L60.5 43.5L56 33L50.5 41.5L45 33L41 42.5L37 35L33 44L29.5 39Z" /><path {...p} d="M50 15C52 8 58 6 61 7C57 9.5 55 12.5 55 16Z" />{shine}</>;
    case 5: return <><path {...p} d="M27 44C26 28 37 18 50 18C63 18 74 28 73 44L69 41L66 44.5L62 39L58 43L54 37.5L50 42L46 37.5L42 43L38 39L34 44.5L31 41Z" />{shine}</>;
    default: return <><path {...p} d="M27 45C25 29 36 16 50 16C64 16 75 29 73 45L69.5 38L66.5 44.5L61.5 34L57.5 42.5L52.5 32L47.5 41.5L42.5 33L38.5 42.5L34.5 36L31 45.5Z" />{shine}</>;
  }
}

function Eyes({ expression, iris }: { expression: number; iris: string }) {
  const lash = { fill: 'none', stroke: INK, strokeWidth: 2.4, strokeLinecap: 'round' as const };
  const open = (cx: number) => (
    <g key={cx}>
      <ellipse cx={cx} cy={50.5} rx={4.3} ry={5.4} fill="#fff" />
      <ellipse cx={cx} cy={51} rx={3.6} ry={4.8} fill={iris} />
      <ellipse cx={cx} cy={49} rx={3.6} ry={2.6} fill={INK} opacity=".35" />
      <ellipse cx={cx} cy={51.5} rx={1.6} ry={2.3} fill={INK} />
      <circle cx={cx - 1.4} cy={48.6} r={1.25} fill="#fff" />
      <circle cx={cx + 1.5} cy={53.3} r={0.7} fill="#fff" />
      <path {...lash} d={`M${cx - 5.4} ${46.8}Q${cx} ${43.2} ${cx + 5.2} ${46.4}`} />
    </g>
  );
  const happy = (cx: number) => <path key={cx} {...lash} d={`M${cx - 4.5} 51Q${cx} 46 ${cx + 4.5} 51`} />;
  const calm = (cx: number) => <path key={cx} {...lash} strokeWidth={2} d={`M${cx - 4.5} 50Q${cx} 53 ${cx + 4.5} 50`} />;
  if (expression === 1) return <>{happy(40.5)}{happy(59.5)}</>;
  if (expression === 2) return <>{calm(40.5)}{calm(59.5)}</>;
  if (expression === 3) return <>{open(40.5)}{happy(59.5)}</>;
  return <>{open(40.5)}{open(59.5)}</>;
}

function Mouth({ expression }: { expression: number }) {
  if (expression === 1) return <path d="M46 61Q50 66 54 61Z" fill="#c4566f" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />;
  if (expression === 2) return <path d="M47.5 61.5Q50 63 52.5 61.5" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />;
  return <path d="M46.5 61Q50 64 53.5 61" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />;
}

function Accessory({ kind }: { kind: number }) {
  switch (kind) {
    case 1:
      return <g fill="none" stroke={INK} strokeWidth="1.5"><circle cx="40.5" cy="51" r="6.6" /><circle cx="59.5" cy="51" r="6.6" /><path d="M47 51h6" /></g>;
    case 2:
      return <path d="M66 30l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#ffd166" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />;
    case 3:
      return <g stroke={INK} strokeWidth="1.4"><path d="M24 48C23 26 36 12 50 12S77 26 76 48" fill="none" strokeWidth="3" /><rect x="19" y="43" width="9" height="14" rx="4" fill="#f7b8ca" /><rect x="72" y="43" width="9" height="14" rx="4" fill="#f7b8ca" /></g>;
    case 4:
      return <g stroke={INK} strokeWidth="1"><circle cx="31" cy="31" r="3.4" fill="#fff" /><circle cx="35.5" cy="28.5" r="3.4" fill="#ffd1dc" /><circle cx="30" cy="25.8" r="3.4" fill="#ffd1dc" /><circle cx="26" cy="29.5" r="3.4" fill="#ffd1dc" /><circle cx="31" cy="28.6" r="1.7" fill="#ffd166" /></g>;
    case 5:
      return <g><rect x="58" y="55.5" width="8" height="4" rx="1.6" fill="#f6dcc0" stroke={INK} strokeWidth="1" transform="rotate(-18 62 57.5)" /></g>;
    default:
      return null;
  }
}

export function AnimeAvatar({ config, size = 40, className = '', title, square = false }: { config: AvatarConfig; size?: number; className?: string; title?: string; square?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const hair = HAIR_COLORS[config.hairColor % HAIR_COLORS.length];
  const skin = SKIN_TONES[config.skin % SKIN_TONES.length];
  const iris = EYE_COLORS[config.eyes % EYE_COLORS.length];
  const outfit = OUTFITS[config.outfit % OUTFITS.length];
  const bg = AVATAR_BGS[config.bg % AVATAR_BGS.length];
  const style = config.hair % HAIR_STYLES.length;
  const expr = config.expression % EXPRESSIONS.length;
  const acc = config.accessory % ACCESSORIES.length;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <clipPath id={`c${uid}`}>{square ? <rect width="100" height="100" rx="18" /> : <circle cx="50" cy="50" r="50" />}</clipPath>
        <pattern id={`t${uid}`} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="0.9" fill={INK} opacity=".1" /></pattern>
      </defs>
      <g clipPath={`url(#c${uid})`}>
        <rect width="100" height="100" fill={bg} />
        <rect width="100" height="100" fill={`url(#t${uid})`} />
        <g transform="translate(-7 -1) scale(1.14)">
        <HairBack style={style} c={hair} />
        {/* shoulders & outfit */}
        <path d="M14 104C15 86 30 76 50 76C70 76 85 86 86 104Z" fill={outfit.color} stroke={INK} strokeWidth="1.4" />
        <path d="M41 77L50 88L59 77" fill={outfit.trim} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        {/* neck */}
        <path d="M43.5 62H56.5V79C53 82 47 82 43.5 79Z" fill={skin} stroke={INK} strokeWidth="1.3" />
        <path d="M43.5 66C47 69 53 69 56.5 66V70C53 72.5 47 72.5 43.5 70Z" fill={INK} opacity=".12" />
        {/* ears */}
        <ellipse cx="29.5" cy="51" rx="3.3" ry="5" fill={skin} stroke={INK} strokeWidth="1.3" />
        <ellipse cx="70.5" cy="51" rx="3.3" ry="5" fill={skin} stroke={INK} strokeWidth="1.3" />
        {/* face */}
        <path d="M30 44C30 30 38.5 23.5 50 23.5C61.5 23.5 70 30 70 44C70 56 63 66.5 50 70.5C37 66.5 30 56 30 44Z" fill={skin} stroke={INK} strokeWidth="1.4" />
        <ellipse cx="36" cy="57.5" rx="4" ry="2.2" fill="#f28fa8" opacity=".45" />
        <ellipse cx="64" cy="57.5" rx="4" ry="2.2" fill="#f28fa8" opacity=".45" />
        <Eyes expression={expr} iris={iris} />
        <path d="M35.5 41.5Q40 39.6 44.5 41M55.5 41Q60 39.6 64.5 41.5" fill="none" stroke={hair.shade} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M50.5 55.5l-.9 1.6h1.4" fill="none" stroke={INK} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".6" />
        <Mouth expression={expr} />
        <HairFront style={style} c={hair} />
        <Accessory kind={acc} />
        </g>
      </g>
    </svg>
  );
}
