import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Activity, Category, Profile } from '../data/types';
import { categoryById } from '../data/taxonomy';
import { Icon, type IconName } from './Icon';
import { AnimeAvatar, avatarFromSeed } from './art/AnimeAvatar';
import { Scene } from './art/Scene';

/* ——— Brand ——— */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M10 6h44a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8H30l-12 9v-9h-8a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8z" fill="#E99BB5" stroke="#2a2338" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="25" cy="29" r="10" fill="none" stroke="#252238" strokeWidth="5" />
      <circle cx="39" cy="29" r="10" fill="none" stroke="#252238" strokeWidth="5" />
      <path d="M52 2l1.6 3.6L57 7l-3.4 1.4L52 12l-1.6-3.6L47 7l3.4-1.4z" fill="#D7B77A" stroke="#30283D" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${light ? 'text-on-night' : 'text-ink'}`}>
      <LogoMark />
      <span className="font-manga text-xl leading-none tracking-wide">Kizuna</span>
      <span className={`font-jp text-sm font-bold ${light ? 'text-on-night/60' : 'text-sakura-deep'}`}>絆</span>
    </span>
  );
}

/* ——— Characters ——— */
type AvatarUser = Pick<Profile, 'firstName' | 'avatarHue'> & { id?: string; avatar?: Profile['avatar'] };

export const avatarOf = (u: AvatarUser) => u.avatar ?? avatarFromSeed(u.id ?? u.firstName, u.avatarHue);

const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 96, '2xl': 140 } as const;

export function Avatar({ user, size = 'md', ring = false, className = '' }: { user?: AvatarUser | null; size?: keyof typeof SIZES; ring?: boolean; className?: string }) {
  const px = SIZES[size];
  if (!user) return <span className="inline-block shrink-0 rounded-full bg-cream-2" style={{ width: px, height: px }} />;
  return (
    <span className={`inline-flex shrink-0 rounded-full border-edge bg-surface ${size === 'xs' ? 'border-[1.5px]' : 'border-2'} ${ring ? 'ring-2 ring-surface' : ''} ${className}`} style={{ width: px, height: px }}>
      <AnimeAvatar config={avatarOf(user)} size={px - (size === 'xs' ? 3 : 4)} className="rounded-full" />
    </span>
  );
}

export function AvatarStack({ users, max = 5, size = 'sm' }: { users: (Profile | undefined)[]; max?: number; size?: 'xs' | 'sm' | 'md' }) {
  const shown = users.filter(Boolean).slice(0, max) as Profile[];
  const extra = users.filter(Boolean).length - shown.length;
  const px = SIZES[size];
  return (
    <span className="flex -space-x-2">
      {shown.map((u) => <Avatar key={u.id} user={u} size={size} />)}
      {extra > 0 && (
        <span className="inline-flex items-center justify-center rounded-full border border-edge bg-cream-2 text-[10px] font-black text-ink-2" style={{ width: px, height: px }}>+{extra}</span>
      )}
    </span>
  );
}

/** RPG-style party: filled avatars plus dashed "free slot" circles. */
export function PartySlots({ users, max, size = 'sm', limit = 8 }: { users: (Profile | undefined)[]; max: number; size?: 'xs' | 'sm'; limit?: number }) {
  const present = users.filter(Boolean) as Profile[];
  const shownMax = Math.min(max, limit);
  const shown = present.slice(0, shownMax);
  const free = Math.max(0, shownMax - shown.length);
  const px = SIZES[size];
  return (
    <span className="flex flex-wrap items-center gap-1" aria-label={`${present.length} membres d’équipe sur ${max} places`}>
      {shown.map((u) => <Avatar key={u.id} user={u} size={size} />)}
      {Array.from({ length: free }, (_, i) => (
        <span key={i} className="inline-flex items-center justify-center rounded-full border-2 border-dashed border-ink-3/60 bg-surface/70 text-ink-3" style={{ width: px, height: px }} aria-hidden="true">
          <Icon name="plus" className="size-3" strokeWidth={2.5} />
        </span>
      ))}
      {max > limit && <span className="ml-1 text-[11px] font-bold text-ink-3">/{max}</span>}
    </span>
  );
}

/* ——— Illustration ——— */
/** Illustrated quest cover: scene + category sticker + hanko stamp. */
export function CoverArt({ activity, category, className = 'h-36', large = false, children }: { activity?: Activity; category?: Category; className?: string; large?: boolean; children?: ReactNode }) {
  const cat = category ?? categoryById(activity!.categoryId);
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: cat.tint }}>
      <Scene scene={cat.scene} seed={activity?.id ?? cat.id} className="absolute inset-0 h-full w-full" />
      <span className="sticker scope-day absolute top-3 left-3 bg-surface" style={{ color: cat.ink }}>{cat.questLabel}</span>
      <Stamp kanji={cat.kanji} color={cat.color} className={`absolute right-3 bottom-3 ${large ? 'size-16 text-3xl' : 'size-11 text-xl'}`} />
      {children}
    </div>
  );
}

/** Hanko-like stamp with a single kanji. */
export function Stamp({ kanji, color, className = 'size-11 text-xl' }: { kanji: string; color: string; className?: string }) {
  return (
    <span className={`inline-flex rotate-[-8deg] items-center justify-center rounded-xl border border-edge font-jp font-black text-on-accent ${className}`} style={{ background: color, boxShadow: 'var(--shadow-sm)' }} aria-hidden="true">
      {kanji}
    </span>
  );
}

export function Sparkle({ className = 'size-5', color = '#D7B77A', style }: { className?: string; color?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <path d="M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z" fill={color} stroke="#30283D" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function SpeechBubble({ children, className = '', right = false }: { children: ReactNode; className?: string; right?: boolean }) {
  return <span className={`bubble inline-block text-sm ${right ? 'bubble-right' : ''} ${className}`}>{children}</span>;
}

export function CategoryDot({ id }: { id: string }) {
  const c = categoryById(id);
  return <span className="inline-block size-2.5 shrink-0 rounded-full border border-edge" style={{ background: c.color }} />;
}

/* ——— Layout helpers ——— */
export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card relative flex flex-col items-center overflow-hidden px-6 py-12 text-center">
      <div className="screentone absolute inset-0 text-lav-deep opacity-10" aria-hidden="true" />
      <span className="relative mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-edge bg-lav-soft text-lav-deep" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Icon name={icon} className="size-6" />
      </span>
      <Sparkle className="absolute top-8 left-[calc(50%+28px)] size-4" />
      <h3 className="relative text-xl">{title}</h3>
      <p className="relative mt-1 max-w-sm text-sm text-ink-2">{text}</p>
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, kicker, link, linkLabel, jp }: { title: string; kicker?: string; link?: string; linkLabel?: string; jp?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="eyebrow mb-1">{kicker}</p>}
        <h2 className="relative inline-block text-2xl md:text-[1.7rem]">
          {jp && <span className="mr-2 font-jp text-sakura-deep">{jp}</span>}
          {title}
          <span className="absolute -bottom-1 left-0 h-1.5 w-full -skew-x-12 rounded-full bg-sakura/35 -z-10" aria-hidden="true" />
        </h2>
      </div>
      {link && (
        <Link to={link} className="shrink-0 rounded-full px-2 py-1 text-sm font-extrabold text-lav-deep hover:bg-lav-soft">
          {linkLabel ?? 'Tout voir'} →
        </Link>
      )}
    </div>
  );
}

/** Pill showing a mode: "continue the story" (lavender) vs "new adventures" (sakura). */
export function ModeTag({ mode }: { mode: 'retrouver' | 'decouvrir' }) {
  return mode === 'retrouver' ? (
    <span className="sticker bg-lav-soft text-lav-deep"><Icon name="repeat" className="size-3.5" /> Suite de l’histoire</span>
  ) : (
    <span className="sticker bg-sakura-soft text-sakura-deep"><Icon name="compass" className="size-3.5" /> Nouvelles aventures</span>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`scope-day pop max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-edge bg-cream p-6 outline-none sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        style={{ boxShadow: '0 30px 60px -20px rgb(8 6 18 / 0.8)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl">{title}</h2>
          <button onClick={onClose} className="rounded-full border-2 border-transparent p-1 text-ink-2 hover:border-ink-3 hover:bg-surface" aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DemoBadge({ className = '' }: { className?: string }) {
  return <span className={`sticker bg-peach text-peach-deep ${className}`}>Démo</span>;
}
