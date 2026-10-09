import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Activity } from '../data/types';
import { useApp } from '../store/AppContext';
import { formatPrice, formatTime, recurrenceLabel, relativeDay, levelActivityLabel } from '../lib/format';
import { explain } from '../lib/matching';
import { energyById } from '../data/taxonomy';
import { Icon } from './Icon';
import { AvatarStack, CoverArt, Modal } from './ui';
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
    toast('Tu participes ! La place est réservée.');
  };
  const join = () => {
    if (!state.guidelinesAccepted) return setGuidelinesOpen(true);
    doJoin();
  };
  const leave = () => {
    dispatch({ type: 'leave', activityId: activity.id });
    toast('Désinscription confirmée. Ta place est libérée.');
  };

  const guidelinesModal = (
    <Modal open={guidelinesOpen} onClose={() => setGuidelinesOpen(false)} title="Avant ta première activité">
      <p className="mb-4 text-sm text-ink-2">Quelques règles simples pour que chacun·e se sente bien. Tu ne les verras qu’une fois.</p>
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
          J’accepte et je participe
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
        toast(saved ? 'Retirée de tes enregistrements' : 'Activité enregistrée');
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Retirer des activités enregistrées' : 'Enregistrer l’activité'}
      className={`inline-flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-line backdrop-blur transition hover:scale-105 ${saved ? 'text-shu' : 'text-ink-2'} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
    </button>
  );
}

export function ActivityCard({ activity, showReason = true, compact = false }: { activity: Activity; showReason?: boolean; compact?: boolean }) {
  const { getUser, recommendFor, communities } = useApp();
  const { joined, past, spots, full, join, guidelinesModal } = useJoin(activity);
  const rec = recommendFor(activity);
  const community = activity.communityId ? communities.find((c) => c.id === activity.communityId) : undefined;
  const participants = activity.participantIds.map(getUser);

  return (
    <article className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(29,27,38,0.25)]">
      <Link to={`/activites/${activity.id}`} className="absolute inset-0 z-0" aria-label={`Voir ${activity.title}`} />
      <div className="relative">
        <CoverArt activity={activity} className={compact ? 'h-24' : 'h-32'} />
        <div className="absolute top-3 right-3 z-10">
          <SaveButton activityId={activity.id} />
        </div>
        {rec.familiar.length > 0 && !past && (
          <span className="absolute bottom-3 left-3 chip bg-ai text-white">
            <Icon name="wave" className="size-3.5" /> {rec.familiar.length} visage{rec.familiar.length > 1 ? 's' : ''} familier{rec.familiar.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs font-semibold text-shu">
          {relativeDay(activity.startsAt)} · {formatTime(activity.startsAt)}
        </p>
        <h3 className="font-display text-lg leading-snug font-semibold">{activity.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-2">
          <Icon name="pin" className="size-4 shrink-0" /> <span className="truncate">{activity.venue} · {activity.district}</span>
        </p>
        {!compact && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activity.recurrence && (
              <span className="chip bg-ai-soft text-ai">
                <Icon name="repeat" className="size-3.5" /> {community ? community.name : recurrenceLabel(activity.recurrence)}
              </span>
            )}
            <span className="chip bg-paper-2 text-ink-2">{energyById(activity.energy).label}</span>
            <span className="chip bg-paper-2 text-ink-2">{formatPrice(activity.priceMin, activity.priceMax)}</span>
            {activity.level === 'debutant' && <span className="chip bg-matcha-soft text-matcha">{levelActivityLabel(activity.level)}</span>}
          </div>
        )}
        {showReason && rec.reasons.length > 0 && !compact && (
          <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-xs leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">Pourquoi pour toi : </span>
            {explain(rec)}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-2">
            <AvatarStack users={participants} max={4} size="xs" />
            <span className="text-xs text-ink-2">
              {activity.participantIds.length}/{activity.maxParticipants}
            </span>
          </div>
          <div className="relative z-10">
            {past ? (
              <span className="chip bg-paper-2 text-ink-3">Terminée</span>
            ) : joined ? (
              <span className="chip bg-matcha-soft text-matcha"><Icon name="check" className="size-3.5" /> Inscrit·e</span>
            ) : full ? (
              <span className="chip bg-paper-2 text-ink-3">Complet</span>
            ) : (
              <button className="btn-primary btn-sm" onClick={join}>
                Je participe{spots <= 2 ? ` · ${spots} place${spots > 1 ? 's' : ''}` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
      {guidelinesModal}
    </article>
  );
}
