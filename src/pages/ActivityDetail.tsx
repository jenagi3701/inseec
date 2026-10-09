import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useJoin, SaveButton } from '../components/ActivityCard';
import { Icon, type IconName } from '../components/Icon';
import { Avatar, CoverArt, EmptyState, Modal } from '../components/ui';
import { ReportDialog } from '../components/ReportDialog';
import { GuidelinesList } from '../components/Guidelines';
import { useToast } from '../components/Toast';
import { categoryById, energyById, interestLabel } from '../data/taxonomy';
import { formatDateTime, formatDuration, formatPrice, levelActivityLabel, recurrenceLabel, relativeDay, timeAgo } from '../lib/format';
import { ME } from '../store/state';

export default function ActivityDetail() {
  const { id = '' } = useParams();
  const { getActivity } = useApp();
  const activity = getActivity(id);
  if (!activity) {
    return <EmptyState icon="search" title="Activité introuvable" text="Elle a peut-être été annulée, ou le lien est incorrect." action={<Link to="/activites" className="btn-primary btn-sm">Voir les activités</Link>} />;
  }
  return <Detail key={activity.id} id={activity.id} />;
}

function Info({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-ink-2"><Icon name={icon} className="size-[18px]" /></span>
      <div>
        <p className="text-xs font-semibold text-ink-3">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

function Detail({ id }: { id: string }) {
  const app = useApp();
  const { getActivity, getUser, getCommunity, recommendFor, me, state, dispatch, familiarIds } = app;
  const activity = getActivity(id)!;
  const navigate = useNavigate();
  const toast = useToast();
  const { joined, past, spots, full, join, leave, guidelinesModal } = useJoin(activity);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [report, setReport] = useState<{ type: 'message' | 'activity'; id: string; label: string } | null>(null);
  const [draft, setDraft] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);

  const cat = categoryById(activity.categoryId);
  const rec = recommendFor(activity);
  const community = activity.communityId ? getCommunity(activity.communityId) : undefined;
  const organizer = getUser(activity.organizerId);
  const blocked = new Set(state.blocked);
  const participants = activity.participantIds.filter((p) => !blocked.has(p)).map(getUser).filter(Boolean);
  const hasBlocked = activity.participantIds.some((p) => blocked.has(p));
  const messages = state.messages.filter((m) => m.activityId === activity.id && !blocked.has(m.authorId));
  const feedback = state.feedback[activity.id];

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (/(\+33|0)[1-9](\s?\d{2}){4}/.test(text) || /@\w+\.\w+/.test(text)) {
      toast('Astuce : évite de partager téléphone ou e-mail dans le fil de groupe.');
    }
    dispatch({ type: 'postMessage', activityId: activity.id, text });
    setDraft('');
  };

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
        <Icon name="arrowLeft" className="size-4" /> Retour
      </button>

      <div className="card overflow-hidden">
        <div className="relative">
          <CoverArt activity={activity} className="h-44 md:h-56" large />
          <div className="absolute top-3 right-3"><SaveButton activityId={activity.id} /></div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap gap-2">
            {community && (
              <Link to={`/cercles/${community.id}`} className="chip bg-ai-soft text-ai hover:underline">
                <Icon name="repeat" className="size-3.5" /> {community.name} · {recurrenceLabel(activity.recurrence)}
              </Link>
            )}
            {!community && activity.recurrence && <span className="chip bg-ai-soft text-ai">{recurrenceLabel(activity.recurrence)}</span>}
            {!activity.recurrence && <span className="chip bg-paper-2 text-ink-2">Activité découverte ponctuelle</span>}
            <span className="chip bg-paper-2 text-ink-2">{energyById(activity.energy).label}</span>
            {activity.firstTimerFriendly && <span className="chip bg-matcha-soft text-matcha">Idéal pour une première fois</span>}
            {activity.userCreated && <span className="chip bg-kin/15 text-kin">Proposée par toi</span>}
          </div>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{activity.title}</h1>
          <p className="mt-2 font-medium text-shu">{relativeDay(activity.startsAt)} · {formatDateTime(activity.startsAt)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {past && joined && (
            <div className="rounded-3xl bg-ai p-6 text-white">
              <p className="font-display text-xl font-semibold">{feedback ? 'Merci pour ton retour !' : 'Cette activité est terminée. Envie de revoir ce groupe ?'}</p>
              <p className="mt-1 text-white/75">{feedback ? 'Tu peux revenir sur ton bilan à tout moment.' : 'Ta réponse est privée — elle permet de former un cercle si l’envie est partagée.'}</p>
              <Link to={`/activites/${activity.id}/bilan`} className="btn mt-4 bg-white text-ai hover:bg-paper">{feedback ? 'Voir mon bilan' : 'Donner mon avis'}</Link>
            </div>
          )}

          <section className="card p-6">
            <h2 className="text-xl font-semibold">L’activité</h2>
            <p className="mt-3 leading-relaxed text-ink-2">{activity.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {activity.tags.map((t) => (
                <span key={t} className={`chip ${me?.interests.includes(t) ? 'bg-shu-soft text-shu-dark' : 'bg-paper-2 text-ink-2'}`}>{interestLabel(t)}</span>
              ))}
            </div>
          </section>

          {rec.reasons.length > 0 && !past && (
            <section className="card border-shu/30 bg-shu-soft/40 p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><Icon name="sparkle" className="size-5 text-shu" /> Pourquoi on te la propose</h2>
              <ul className="mt-3 space-y-1.5">
                {rec.reasons.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-ink-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-shu" /> {r}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-3">Règles simples et transparentes, pas un score de compatibilité.</p>
            </section>
          )}

          <section className="card p-6">
            <h2 className="text-xl font-semibold">Infos pratiques</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Info icon="calendar" label="Quand">{formatDateTime(activity.startsAt)}<br /><span className="text-ink-3">Durée : {formatDuration(activity.durationMin)}</span></Info>
              <Info icon="pin" label="Où (lieu public)">{activity.venue}<br /><span className="text-ink-3">{activity.address} · {activity.district}</span></Info>
              <Info icon="euro" label="Prix estimé">{formatPrice(activity.priceMin, activity.priceMax)}<br /><span className="text-ink-3">Payé sur place (démo)</span></Info>
              <Info icon="users" label="Groupe">{activity.participantIds.length} / {activity.maxParticipants} participant·es<br /><span className="text-ink-3">{levelActivityLabel(activity.level)}</span></Info>
              <Info icon="chat" label="Langue">{activity.language}</Info>
              <Info icon="repeat" label="Rythme">{recurrenceLabel(activity.recurrence)}{community && <><br /><span className="text-ink-3">{community.rhythm}</span></>}</Info>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-paper p-4">
              <Avatar user={organizer} />
              <div className="flex-1 text-sm">
                <p className="font-semibold">Organisé par {organizer?.firstName}</p>
                <p className="text-ink-2">Accueille personnellement les nouvelles personnes et s’engage sur la charte organisateur.</p>
              </div>
              {organizer && organizer.id !== ME && <Link to={`/profil/${organizer.id}`} className="text-sm font-semibold text-ai">Profil</Link>}
            </div>
          </section>

          {activity.icebreakers.length > 0 && (
            <section className="card p-6">
              <h2 className="text-xl font-semibold">Pour briser la glace</h2>
              <p className="mt-1 text-sm text-ink-2">Des questions posées sur la table. Personne n’est obligé·e d’y répondre.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {activity.icebreakers.map((q) => (
                  <p key={q} className="rounded-2xl bg-paper-2 px-4 py-3 font-display text-[15px]">« {q} »</p>
                ))}
              </div>
            </section>
          )}

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Discussion du groupe</h2>
              <span className="text-xs text-ink-3">Simulée — pas de temps réel</span>
            </div>
            {joined ? (
              <>
                <ul className="mt-4 space-y-4">
                  {messages.length === 0 && <li className="text-sm text-ink-3">Pas encore de message. Un petit « bonjour » fait souvent plaisir !</li>}
                  {messages.map((m) => {
                    const author = getUser(m.authorId);
                    return (
                      <li key={m.id} className="group flex gap-3">
                        <Avatar user={author} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm"><span className="font-semibold">{m.authorId === ME ? 'Toi' : author?.firstName}</span> <span className="text-xs text-ink-3">· {timeAgo(m.at)}</span></p>
                          <p className="text-sm break-words text-ink-2">{m.text}</p>
                        </div>
                        {m.authorId !== ME && (
                          <button className="self-start rounded-full p-1.5 text-ink-3 opacity-60 hover:bg-paper-2 hover:text-shu group-hover:opacity-100" aria-label={`Signaler le message de ${author?.firstName}`} onClick={() => setReport({ type: 'message', id: m.id, label: 'ce message' })}>
                            <Icon name="flag" className="size-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <form onSubmit={send} className="mt-5 flex gap-2">
                  <input className="input" placeholder="Écrire au groupe…" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} aria-label="Message au groupe" />
                  <button type="submit" className="btn-ink shrink-0 px-4" disabled={!draft.trim()} aria-label="Envoyer"><Icon name="send" className="size-4" /></button>
                </form>
                <p className="mt-2 text-xs text-ink-3">Visible uniquement par les participant·es. Pas de coordonnées personnelles dans le fil, s’il te plaît.</p>
              </>
            ) : (
              <p className="mt-3 rounded-2xl bg-paper p-4 text-sm text-ink-2">
                <Icon name="lock" className="mr-1 inline size-4" /> {messages.length} message{messages.length > 1 ? 's' : ''} dans le fil. La discussion est réservée aux participant·es pour protéger le groupe.
              </p>
            )}
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Règles du groupe</h2>
              <button className="text-sm font-semibold text-ai" onClick={() => setShowGuidelines((s) => !s)}>{showGuidelines ? 'Masquer' : 'Afficher'}</button>
            </div>
            <p className="mt-1 text-sm text-ink-2">Lieu public, bienveillance, consentement. Tu peux te désinscrire à tout moment.</p>
            {showGuidelines && <div className="mt-4"><GuidelinesList /></div>}
            <button className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-shu" onClick={() => setReport({ type: 'activity', id: activity.id, label: 'cette activité' })}>
              <Icon name="flag" className="size-4" /> Signaler cette activité
            </button>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-2xl font-semibold">{formatPrice(activity.priceMin, activity.priceMax)}</p>
              <p className={`text-sm font-semibold ${spots <= 2 ? 'text-shu' : 'text-matcha'}`}>
                {past ? 'Terminée' : spots > 0 ? `${spots} place${spots > 1 ? 's' : ''} restante${spots > 1 ? 's' : ''}` : joined ? 'Complet (dont toi)' : 'Complet'}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (activity.participantIds.length / activity.maxParticipants) * 100)}%`, background: cat.color }} />
            </div>
            <div className="mt-5">
              {past ? (
                <p className="text-sm text-ink-2">{joined ? 'Tu y as participé.' : 'Cette activité est passée.'}</p>
              ) : joined ? (
                <>
                  <p className="mb-3 flex items-center gap-2 rounded-xl bg-matcha-soft px-3 py-2 text-sm font-semibold text-matcha"><Icon name="check" className="size-4" /> Tu participes</p>
                  <button className="btn-ghost w-full" onClick={() => setConfirmLeave(true)}>Me désinscrire</button>
                </>
              ) : full ? (
                <>
                  <button className="btn-ghost w-full" disabled>Complet</button>
                  {community && <p className="mt-3 text-sm text-ink-2">Rejoins le cercle « {community.name} » pour être prévenu·e de la prochaine rencontre.</p>}
                </>
              ) : (
                <button className="btn-primary w-full py-3" onClick={join}>Je participe</button>
              )}
            </div>
            <p className="mt-3 text-xs text-ink-3">Démo : aucune réservation ni paiement réel.</p>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold">Participant·es ({activity.participantIds.length})</h2>
            {hasBlocked && <p className="mt-2 rounded-xl bg-shu-soft p-2.5 text-xs text-shu-dark">Un membre que tu as bloqué participe. Il est masqué de ta liste.</p>}
            <ul className="mt-4 space-y-3">
              {participants.map((u) => {
                const shared = u!.interests.filter((i) => me?.interests.includes(i));
                const isMe = u!.id === ME;
                return (
                  <li key={u!.id}>
                    <Link to={isMe ? '/profil' : `/profil/${u!.id}`} className="flex items-center gap-3 rounded-xl p-1 hover:bg-paper">
                      <Avatar user={u} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-semibold">
                          {isMe ? 'Toi' : u!.firstName}
                          {u!.id === activity.organizerId && <span className="chip bg-paper-2 px-1.5 py-0 text-[10px] text-ink-2">Orga</span>}
                          {familiarIds.has(u!.id) && <span className="chip bg-ai-soft px-1.5 py-0 text-[10px] text-ai">Déjà rencontré·e</span>}
                          {u!.newInTown && !isMe && <span className="chip bg-matcha-soft px-1.5 py-0 text-[10px] text-matcha">Nouveau·elle</span>}
                        </p>
                        {!isMe && <p className="truncate text-xs text-ink-3">{shared.length ? `En commun : ${shared.slice(0, 3).map(interestLabel).join(', ')}` : u!.interests.slice(0, 2).map(interestLabel).join(', ')}</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-ink-3">Seuls les prénoms et les centres d’intérêt sont visibles. Aucune coordonnée n’est partagée.</p>
          </div>

          {community && (
            <Link to={`/cercles/${community.id}`} className="card block p-5 transition hover:shadow-md">
              <p className="eyebrow mb-1 text-ai">Ce groupe se retrouve</p>
              <p className="font-display text-lg font-semibold">{community.name}</p>
              <p className="text-sm text-ink-2">{community.rhythm} · {app.communityMembers(community).length} membres</p>
              <p className="mt-2 text-sm font-semibold text-ai">Voir le cercle →</p>
            </Link>
          )}
        </aside>
      </div>

      {guidelinesModal}
      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Te désinscrire ?">
        <p className="text-sm text-ink-2">Ta place sera libérée pour quelqu’un d’autre. Pas de souci : ça arrive, et le groupe sera prévenu sans détail.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirmLeave(false)}>Garder ma place</button>
          <button className="btn-primary" onClick={() => { leave(); setConfirmLeave(false); }}>Me désinscrire</button>
        </div>
      </Modal>
      {report && <ReportDialog open onClose={() => setReport(null)} targetType={report.type} targetId={report.id} targetLabel={report.label} />}
    </div>
  );
}
