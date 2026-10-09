import { Link } from 'react-router-dom';
import type { Community } from '../data/types';
import { useApp } from '../store/AppContext';
import { categoryById, interestLabel } from '../data/taxonomy';
import { episodeOf, formatTime, relativeDay } from '../lib/format';
import { Icon } from './Icon';
import { AvatarStack } from './ui';
import { useToast } from './Toast';

/** Heraldic guild crest: shield in the category colour with its kanji. */
export function GuildCrest({ categoryId, className = 'size-14', born = false }: { categoryId: string; className?: string; born?: boolean }) {
  const cat = categoryById(categoryId);
  return (
    <svg viewBox="0 0 64 72" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M32 4L58 12V34C58 52 46 63 32 68C18 63 6 52 6 34V12Z" fill={cat.color} stroke="#30283D" strokeWidth="3" strokeLinejoin="round" />
      <path d="M32 10L52 16V34C52 48 43 57 32 61C21 57 12 48 12 34V16Z" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
      <text x="32" y="44" textAnchor="middle" fontFamily="'Zen Maru Gothic', sans-serif" fontWeight="900" fontSize="24" fill="#252238">{cat.kanji}</text>
      {born && <path d="M52 2l2 4.4 4.6 1-3.4 3.2.8 4.8L52 13.2l-4 2.2.8-4.8L45.4 7.4l4.6-1z" fill="#D7B77A" stroke="#30283D" strokeWidth="1.6" strokeLinejoin="round" />}
    </svg>
  );
}

export function GuildCard({ c }: { c: Community }) {
  const { activities, isPast, isMember, isJoined, getUser, communityMembers, familiarIds, dispatch, me } = useApp();
  const toast = useToast();
  const cat = categoryById(c.categoryId);
  const next = activities.filter((a) => a.communityId === c.id && !isPast(a)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const members = communityMembers(c);
  const known = members.filter((m) => familiarIds.has(m)).length;
  const member = isMember(c.id);
  const shared = c.tags.filter((t) => me?.interests.includes(t));
  const ep = next ? episodeOf(activities, next) : null;
  return (
    <article className="paper hover-lift relative flex flex-col overflow-hidden">
      <Link to={`/guildes/${c.id}`} className="absolute inset-0" aria-label={`Voir la guilde ${c.name}`} />
      <div className="relative flex items-start gap-4 border-b border-edge p-5" style={{ background: cat.tint }}>
        <div className="screentone absolute inset-0 opacity-15" style={{ color: cat.color }} aria-hidden="true" />
        <GuildCrest categoryId={c.categoryId} born={c.origin === 'cercle'} className="relative size-16" />
        <div className="relative min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {c.origin === 'cercle' && <span className="sticker bg-surface text-lav-deep">Née d’une quête</span>}
            {member && <span className="sticker bg-lavender text-on-accent">Membre</span>}
          </div>
          <h3 className="mt-2 text-xl leading-tight">{c.name}</h3>
          <p className="text-sm font-semibold text-ink-2">{c.tagline}</p>
        </div>
      </div>
      <div className="mt-auto space-y-3 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-2"><Icon name="repeat" className="size-4" /> {c.rhythm}</p>
        <p className="flex items-center gap-2 text-sm">
          <Icon name="calendar" className="size-4 shrink-0 text-ink-2" />
          {next ? (
            <span>
              {ep && <span className="sticker mr-1.5 bg-sakura-soft text-sakura-deep">Ép. {ep}</span>}
              <strong>{relativeDay(next.startsAt)} · {formatTime(next.startsAt)}</strong>
              {isJoined(next.id) && <span className="font-bold text-matcha"> · inscrit·e ✓</span>}
            </span>
          ) : (
            <span className="font-semibold text-ink-3">Prochain épisode à proposer</span>
          )}
        </p>
        {!member && shared.length > 0 && <p className="text-xs font-semibold text-ink-3">En commun : {shared.map(interestLabel).join(', ')}</p>}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AvatarStack users={members.map(getUser)} max={4} size="xs" />
            <span className="text-xs font-semibold text-ink-2">{members.length} membres{known ? ` · ${known} que tu connais` : ''}</span>
          </div>
          {!member && (
            <button className="btn-lav btn-sm relative z-10" onClick={() => { dispatch({ type: 'joinCommunity', communityId: c.id, name: c.name }); toast(`Bienvenue dans la guilde « ${c.name} »`); }}>
              Rejoindre
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
