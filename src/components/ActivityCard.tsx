import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Activity } from '../data/types';
import { useApp } from '../store/AppContext';
import { formatPrice, formatTime, recurrenceLabel, levelActivityLabel } from '../lib/format';
import { explain } from '../lib/matching';
import { energyById } from '../data/taxonomy';
import { Icon } from './Icon';
import { Avatar, CoverArt, Modal, PartySlots, Sparkle } from './ui';
import { GuidelinesList } from './Guidelines';
import { useToast } from './Toast';

export function useJoin(activity: Activity) {
  const { state, dispatch, isJoined, isPast } = useApp();
  const toast = useToast();
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const joined = isJoined(activity.id);
  const past = isPast(activity);
  const spots = activity.maxParticipants - activity.participantIds.length;
  const full = spots <= 0 && !joined;

  const doJoin = () => {
    dispatch({ type: 'join', activityId: activity.id, title: activity.title });
    toast('Tu as rejoint l’équipe ! Ta place est réservée.');
  };
  const join = () => {
    if (!state.guidelinesAccepted) return setGuidelinesOpen(true);
    doJoin();
  };
  const leave = () => {
    dispatch({ type: 'leave', activityId: activity.id });
    toast('Tu as quitté l’équipe. Ta place est libérée.');
  };

  const guidelinesModal = (
    <Modal open={guidelinesOpen} onClose={() => setGuidelinesOpen(false)} title="Le code de la guilde">
      <p className="mb-4 text-sm text-ink-2">Avant ta première quête, quelques règles simples pour que chacun·e se sente bien. Tu ne les verras qu’une fois.</p>
      <GuidelinesList compact />
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost" onClick={() => setGuidelinesOpen(false)}>Plus tard</button>
        <button
          className="btn-primary"
          onClick={() => {
            dispatch({ type: 'acceptGuidelines' });
            setGuidelinesOpen(false);
            doJoin();
          }}
        >
          J’accepte et je rejoins l’équipe
        </button>
      </div>
    </Modal>
  );

  return { joined, past, spots, full, join, leave, guidelinesModal };
}

export function SaveButton({ activityId, className = '' }: { activityId: string; className?: string }) {
  const { isSaved, dispatch } = useApp();
  const toast = useToast();
  const saved = isSaved(activityId);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'toggleSave', activityId });
        toast(saved ? 'Retirée de tes quêtes enregistrées' : 'Quête enregistrée pour plus tard');
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Retirer des activités enregistrées' : 'Enregistrer l’activité'}
      className={`inline-flex size-9 items-center justify-center rounded-full border-2 border-ink bg-white transition hover:-translate-y-0.5 ${saved ? 'text-sakura' : 'text-ink-2'} ${className}`}
      style={{ boxShadow: '2px 2px 0 0 #2b2440' }}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z" />
      </svg>
    </button>
  );
}

/** Calendar-ticket date: weekday + day number. */
export function DateTicket({ iso, className = '' }: { iso: string; className?: string }) {
  const d = new Date(iso);
  return (
    <span className={`inline-flex w-12 shrink-0 flex-col self-start items-center overflow-hidden rounded-xl border-2 border-ink bg-white text-center ${className}`} style={{ boxShadow: '2px 2px 0 0 #2b2440' }}>
      <span className="w-full bg-sakura-deep py-0.5 text-[10px] font-black tracking-wider text-white uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
      <span className="font-manga text-lg leading-7">{d.getDate()}</span>
    </span>
  );
}

export function ActivityCard({ activity, showReason = true, compact = false }: { activity: Activity; showReason?: boolean; compact?: boolean }) {
  const { getUser, recommendFor, communities } = useApp();
  const { joined, past, spots, full, join, guidelinesModal } = useJoin(activity);
  const rec = recommendFor(activity);
  const community = activity.communityId ? communities.find((c) => c.id === activity.communityId) : undefined;
  const participants = activity.participantIds.map(getUser);
  const energy = energyById(activity.energy);
  const friend = rec.familiar.length ? getUser(rec.familiar[0]) : undefined;

  return (
    <article className="card hover-lift group relative flex flex-col overflow-hidden">
      <Link to={`/activites/${activity.id}`} className="absolute inset-0 z-0" aria-label={`Voir ${activity.title}`} />
      <div className="relative border-b-2 border-ink">
        <CoverArt activity={activity} className={compact ? 'h-28' : 'h-40'}>
          <div className="absolute top-3 right-3 z-10">
            <SaveButton activityId={activity.id} />
          </div>
          {friend && !past && (
            <div className="pop absolute bottom-3 left-3 flex items-end gap-1.5">
              <Avatar user={friend} size="sm" />
              <span className="bubble mb-5 px-2.5 py-1 text-[11px] leading-tight">
                {friend.firstName}{rec.familiar.length > 1 ? ` +${rec.familiar.length - 1}` : ''} y va !
              </span>
            </div>
          )}
        </CoverArt>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex gap-3">
          <DateTicket iso={activity.startsAt} />
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-sakura-deep">{formatTime(activity.startsAt)} · {activity.district}</p>
            <h3 className="text-[1.05rem] leading-snug">{activity.title}</h3>
          </div>
        </div>
        {!compact && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activity.recurrence ? (
              <span className="chip border-[1.5px] border-lav/40 bg-lav-soft text-lav-deep">
                <Icon name="repeat" className="size-3.5" /> {community ? community.name : recurrenceLabel(activity.recurrence)}
              </span>
            ) : (
              <span className="chip border-[1.5px] border-sakura/30 bg-sakura-pale text-sakura-deep">Quête unique</span>
            )}
            <span className="chip bg-cream-2 text-ink-2">{energy.emoji} {energy.label}</span>
            <span className="chip bg-cream-2 text-ink-2">{formatPrice(activity.priceMin, activity.priceMax)}</span>
            {activity.level === 'debutant' && <span className="chip bg-matcha-soft text-matcha">🌱 {levelActivityLabel(activity.level)}</span>}
          </div>
        )}
        {showReason && rec.reasons.length > 0 && !compact && (
          <p className="relative mt-3 rounded-2xl border-2 border-dashed border-lav/40 bg-lav-soft/50 px-3 py-2 pl-8 text-xs leading-relaxed text-ink-2">
            <Sparkle className="absolute top-2 left-2 size-4" color="#c7b3e8" />
            <span className="font-extrabold text-ink">Pour toi : </span>
            {explain(rec)}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-black tracking-wider text-ink-3 uppercase">Équipe · {activity.participantIds.length}/{activity.maxParticipants}</p>
            <PartySlots users={participants} max={activity.maxParticipants} size="xs" limit={compact ? 4 : 7} />
          </div>
          <div className="relative z-10 shrink-0">
            {past ? (
              <span className="sticker bg-cream-2 text-ink-3">Terminée</span>
            ) : joined ? (
              <span className="sticker bg-matcha-soft text-matcha"><Icon name="check" className="size-3.5" /> Dans l’équipe</span>
            ) : full ? (
              <span className="sticker bg-cream-2 text-ink-3">Complet</span>
            ) : (
              <button className="btn-primary btn-sm" onClick={join}>
                Rejoindre{spots <= 2 ? ` · ${spots} place${spots > 1 ? 's' : ''}` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
      {guidelinesModal}
    </article>
  );
}
