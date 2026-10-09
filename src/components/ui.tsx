import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Activity, Category, Profile } from '../data/types';
import { categoryById } from '../data/taxonomy';
import { Icon, type IconName } from './Icon';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-semibold ${light ? 'text-paper' : 'text-ink'}`}>
      <svg viewBox="0 0 64 64" className="size-8" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#D9472B" />
        <circle cx="25" cy="32" r="11" fill="none" stroke="#FBF7F0" strokeWidth="5" />
        <circle cx="39" cy="32" r="11" fill="none" stroke="#FBF7F0" strokeWidth="5" />
      </svg>
      Kizuna
      <span className={`font-jp text-sm font-medium ${light ? 'text-paper/60' : 'text-ink-3'}`}>絆</span>
    </span>
  );
}

export function Avatar({ user, size = 'md', ring = false }: { user?: Pick<Profile, 'firstName' | 'avatarHue'> | null; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; ring?: boolean }) {
  const dims = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-24 text-3xl' }[size];
  const hue = user?.avatarHue ?? 0;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dims} ${ring ? 'ring-2 ring-white' : ''}`}
      style={{ background: `hsl(${hue} 55% 88%)`, color: `hsl(${hue} 45% 30%)` }}
      aria-hidden="true"
    >
      {user?.firstName?.[0] ?? '?'}
    </span>
  );
}

export function AvatarStack({ users, max = 5, size = 'sm' }: { users: (Profile | undefined)[]; max?: number; size?: 'xs' | 'sm' }) {
  const shown = users.filter(Boolean).slice(0, max) as Profile[];
  const extra = users.length - shown.length;
  return (
    <span className="flex -space-x-2">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} ring />
      ))}
      {extra > 0 && (
        <span className={`inline-flex items-center justify-center rounded-full bg-paper-2 font-semibold text-ink-2 ring-2 ring-white ${size === 'xs' ? 'size-6 text-[10px]' : 'size-8 text-xs'}`}>+{extra}</span>
      )}
    </span>
  );
}

/** Generated editorial cover: category colour, manga screentone and a kanji accent. */
export function CoverArt({ activity, category, className = 'h-36', large = false }: { activity?: Activity; category?: Category; className?: string; large?: boolean }) {
  const cat = category ?? categoryById(activity!.categoryId);
  const seed = (activity?.id ?? cat.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const angle = (seed % 5) * 18 - 30;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: cat.tint }} aria-hidden="true">
      <div className="screentone absolute inset-0 opacity-[0.18]" style={{ color: cat.color, transform: `rotate(${angle}deg) scale(1.6)` }} />
      <div className="absolute -right-6 -bottom-10 size-44 rounded-full opacity-90" style={{ background: cat.color }} />
      <div className="speedlines absolute -right-6 -bottom-10 size-44 rounded-full opacity-20" style={{ color: '#fff' }} />
      <span className={`absolute right-5 bottom-2 font-jp font-bold text-white/95 ${large ? 'text-8xl' : 'text-6xl'}`}>{cat.kanji}</span>
      <span className="absolute top-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold backdrop-blur" style={{ color: cat.color }}>
        {cat.label}
      </span>
    </div>
  );
}

export function CategoryDot({ id }: { id: string }) {
  const c = categoryById(id);
  return <span className="inline-block size-2 rounded-full" style={{ background: c.color }} />;
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-paper-2 text-ink-2">
        <Icon name={icon} />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, kicker, link, linkLabel }: { title: string; kicker?: string; link?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="eyebrow mb-1">{kicker}</p>}
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="shrink-0 text-sm font-semibold text-ai hover:underline">
          {linkLabel ?? 'Tout voir'} →
        </Link>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fade-up max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-paper p-6 outline-none sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-2 hover:bg-paper-2" aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DemoBadge({ className = '' }: { className?: string }) {
  return <span className={`chip bg-kin/15 text-kin ${className}`}>Démo</span>;
}
