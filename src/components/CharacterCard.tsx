import type { ReactNode } from 'react';
import type { Profile } from '../data/types';
import { ENERGIES, interestById, interestLabel, levelLabel } from '../data/taxonomy';
import { AVATAR_BGS } from './art/AnimeAvatar';
import { Avatar, avatarOf } from './ui';

const GROUP_STYLE: Record<string, string> = {
  genre: 'bg-sakura-soft text-sakura-deep',
  fandom: 'bg-lav-soft text-lav-deep',
  loisir: 'bg-sora-soft text-sora',
  culture: 'bg-matcha-soft text-matcha',
};

/** Interest badge, coloured by interest family. Franchise names are plain text tags. */
export function InterestBadge({ id, highlight = false }: { id: string; highlight?: boolean }) {
  const group = interestById(id)?.group ?? 'loisir';
  return (
    <span className={`chip border-[1.5px] ${highlight ? 'border-edge bg-sakura text-on-accent' : `border-transparent ${GROUP_STYLE[group]}`}`}>
      {highlight && '★ '}
      {interestLabel(id)}
    </span>
  );
}

/** Character-sheet style profile card. */
export function CharacterCard({ user, highlight = [], maxBadges = 6, footer, className = '', tilt = 0 }: { user: Profile; highlight?: string[]; maxBadges?: number; footer?: ReactNode; className?: string; tilt?: number }) {
  const bg = AVATAR_BGS[avatarOf(user).bg % AVATAR_BGS.length];
  const badges = [...user.interests].sort((a, b) => Number(highlight.includes(b)) - Number(highlight.includes(a))).slice(0, maxBadges);
  return (
    <article className={`paper overflow-hidden ${className}`} style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      <div className="relative h-20 border-b border-edge" style={{ background: bg }}>
        <div className="screentone absolute inset-0 text-ink opacity-10" />
        <span className="sticker absolute top-2.5 right-2.5 bg-surface">{levelLabel(user.level)}</span>
      </div>
      <div className="relative -mt-12 px-5 pb-5">
        <Avatar user={user} size="xl" className="bg-surface" />
        <h3 className="mt-2 text-xl leading-tight">{user.firstName}</h3>
        {user.title && <p className="text-sm font-bold text-sakura-deep">{user.title}</p>}
        <p className="mt-0.5 text-xs font-semibold text-ink-3">
          {user.neighborhood ?? user.city}
          {user.newInTown ? ' · nouveau·elle en ville' : ''}
          {user.energy.length > 0 && ` · ${user.energy.map((e) => ENERGIES.find((x) => x.id === e)?.emoji).join(' ')}`}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((i) => <InterestBadge key={i} id={i} highlight={highlight.includes(i)} />)}
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </article>
  );
}
