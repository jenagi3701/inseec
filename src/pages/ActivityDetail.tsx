import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useJoin, SaveButton, DateTicket } from '../components/ActivityCard';
import { Icon, type IconName } from '../components/Icon';
import { Avatar, CoverArt, EmptyState, Modal, PartySlots, Sparkle } from '../components/ui';
import { GuildCrest } from '../components/Guild';
import { InterestBadge } from '../components/CharacterCard';
import { ReportDialog } from '../components/ReportDialog';
import { GuidelinesList } from '../components/Guidelines';
import { useToast } from '../components/Toast';
import { energyById } from '../data/taxonomy';
import { episodeOf, formatDateTime, formatDuration, formatPrice, levelActivityLabel, recurrenceLabel, relativeDay, timeAgo } from '../lib/format';
import { ME } from '../store/state';

export default function ActivityDetail() {
  const { id = '' } = useParams();
  const { getActivity } = useApp();
  const activity = getActivity(id);
  if (!activity) {
    return <EmptyState icon="search" title="Quête introuvable" text="Elle a peut-être été annulée, ou le lien est incorrect." action={<Link to="/activites" className="btn-primary btn-sm">Voir les quêtes</Link>} />;
  }
  return <Detail key={activity.id} id={activity.id} />;
}

function Info({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-sakura-pale text-sakura-deep" style={{ boxShadow: '2px 2px 0 0 #2b2440' }}>
        <Icon name={icon} className="size-[18px]" strokeWidth={2} />
      </span>
      <div>
        <p className="text-[11px] font-black tracking-wider text-ink-3 uppercase">{label}</p>
        <div className="text-sm font-semibold">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, jp, children, className = '', aside }: { title: string; jp?: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={`card p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{jp && <span className="mr-2 font-jp text-sakura">{jp}</span>}{title}</h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Detail({ id }: { id: string }) {
  const app = useApp();
  const { getActivity, getUser, getCommunity, recommendFor, me, state, dispatch, familiarIds, activities } = app;
  const activity = getActivity(id)!;
  const navigate = useNavigate();
  const toast = useToast();
  const { joined, past, spots, full, join, leave, guidelinesModal } = useJoin(activity);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [report, setReport] = useState<{ type: 'message' | 'activity'; id: string; label: string } | null>(null);
  const [draft, setDraft] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);

  const energy = energyById(activity.energy);
  const rec = recommendFor(activity);
  const community = activity.communityId ? getCommunity(activity.communityId) : undefined;
  const ep = episodeOf(activities, activity);
  const organizer = getUser(activity.organizerId);
  const blocked = new Set(state.blocked);
  const participants = activity.participantIds.filter((p) => !blocked.has(p)).map(getUser).filter(Boolean);
  const hasBlocked = activity.participantIds.some((p) => blocked.has(p));
  const messages = state.messages.filter((m) => m.activityId === activity.id && !blocked.has(m.authorId));
  const feedback = state.feedback[activity.id];
  const speakers = participants.filter((u) => u!.id !== ME);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (/(\+33|0)[1-9](\s?\d{2}){4}/.test(text) || /@\w+\.\w+/.test(text)) {
      toast('Astuce : évite de partager téléphone ou e-mail dans le fil de l’équipe.');
    }
    dispatch({ type: 'postMessage', activityId: activity.id, text });
    setDraft('');
  };

  return (
    <div className="pb-20 lg:pb-0">
      <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-extrabold text-ink-2 hover:bg-white hover:text-ink">
        <Icon name="arrowLeft" className="size-4" /> Retour
      </button>

      {/* ——— Quest hero ——— */}
      <div className="panel overflow-hidden">
        <div className="relative border-b-2 border-ink">
          <CoverArt activity={activity} className="h-52 md:h-72" large>
            <div className="absolute top-3 right-3"><SaveButton activityId={activity.id} /></div>
            {ep && <span className="sticker absolute bottom-3 left-3 bg-lav-deep text-white">Épisode {ep}{community ? ` · ${community.name}` : ''}</span>}
          </CoverArt>
        </div>
        <div className="flex gap-4 p-6 md:p-8">
          <DateTicket iso={activity.startsAt} className="hidden sm:inline-flex" />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {community ? (
                <Link to={`/guildes/${community.id}`} className="chip border-[1.5px] border-lav/40 bg-lav-soft text-lav-deep hover:underline">
                  <Icon name="repeat" className="size-3.5" /> Guilde {community.name} · {recurrenceLabel(activity.recurrence)}
                </Link>
              ) : activity.recurrence ? (
                <span className="chip bg-lav-soft text-lav-deep">{recurrenceLabel(activity.recurrence)}</span>
              ) : (
                <span className="chip border-[1.5px] border-sakura/30 bg-sakura-pale text-sakura-deep">Quête unique · découverte</span>
              )}
              <span className="chip bg-cream-2 text-ink-2">{energy.emoji} {energy.label}</span>
              {activity.firstTimerFriendly && <span className="chip bg-matcha-soft text-matcha">🌱 Idéal pour une première fois</span>}
              {activity.userCreated && <span className="chip bg-peach text-peach-deep">Proposée par toi</span>}
            </div>
            <h1 className="mt-3 font-manga text-3xl leading-tight font-normal md:text-4xl">{activity.title}</h1>
            <p className="mt-2 font-extrabold text-sakura-deep">{relativeDay(activity.startsAt)} · {formatDateTime(activity.startsAt)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {past && joined && (
            <div className="panel relative overflow-hidden bg-lav-deep p-6 text-white">
              <div className="speedlines absolute inset-[-60%] text-white opacity-[0.06]" aria-hidden="true" />
              <p className="relative font-manga text-2xl">{feedback ? 'Merci pour ton bilan !' : 'Fin d’épisode. Envie de revoir cette équipe ?'}</p>
              <p className="relative mt-1 text-white/75">{feedback ? 'Tu peux revenir sur ton bilan à tout moment.' : 'Ta réponse est privée. Elle permet de fonder une guilde si l’envie est partagée.'}</p>
              <Link to={`/activites/${activity.id}/bilan`} className="btn-ghost relative mt-4">{feedback ? 'Voir mon bilan' : 'Donner mon avis'}</Link>
            </div>
          )}

          <Section title="Le scénario" jp="話">
            <p className="leading-relaxed font-semibold text-ink-2">{activity.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {activity.tags.map((t) => <InterestBadge key={t} id={t} highlight={!!me?.interests.includes(t)} />)}
            </div>
          </Section>

          {rec.reasons.length > 0 && !past && (
            <section className="relative rounded-[var(--radius-card)] border-2 border-dashed border-lav bg-lav-soft/60 p-6">
              <Sparkle className="absolute -top-3 -left-3 size-7" />
              <h2 className="text-xl">Pourquoi cette quête pour toi</h2>
              <ul className="mt-3 space-y-1.5">
                {rec.reasons.map((r) => (
                  <li key={r} className="flex gap-2 text-sm font-semibold text-ink-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-lav-deep" strokeWidth={2.5} /> {r}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-semibold text-ink-3">Règles simples et transparentes, pas un score de compatibilité.</p>
            </section>
          )}

          <Section title="Carte de la quête" jp="地図">
            <div className="grid gap-5 sm:grid-cols-2">
              <Info icon="calendar" label="Quand">{formatDateTime(activity.startsAt)}<br /><span className="font-normal text-ink-3">Durée : {formatDuration(activity.durationMin)}</span></Info>
              <Info icon="pin" label="Où · lieu public">{activity.venue}<br /><span className="font-normal text-ink-3">{activity.address} · {activity.district}</span></Info>
              <Info icon="euro" label="Prix estimé">{formatPrice(activity.priceMin, activity.priceMax)}<br /><span className="font-normal text-ink-3">Payé sur place (démo)</span></Info>
              <Info icon="users" label="Équipe">{activity.participantIds.length} / {activity.maxParticipants} membres<br /><span className="font-normal text-ink-3">{levelActivityLabel(activity.level)}</span></Info>
              <Info icon="chat" label="Langue">{activity.language}</Info>
              <Info icon="repeat" label="Rythme">{recurrenceLabel(activity.recurrence)}{community && <><br /><span className="font-normal text-ink-3">{community.rhythm}</span></>}</Info>
            </div>
            <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border-2 border-ink bg-sakura-pale p-4 sm:flex-row sm:items-center">
              <Avatar user={organizer} size="lg" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-[11px] font-black tracking-wider text-sakura-deep uppercase">Guide de la quête</p>
                <p className="font-display text-lg font-black">{organizer?.firstName}{organizer?.title ? <span className="text-sm font-bold text-ink-3"> · {organizer.title}</span> : null}</p>
                <p className="font-semibold text-ink-2">Accueille personnellement les nouvelles personnes et s’engage sur la charte organisateur.</p>
              </div>
              {organizer && organizer.id !== ME && <Link to={`/profil/${organizer.id}`} className="btn-ghost btn-sm">Profil</Link>}
            </div>
          </Section>

          {activity.icebreakers.length > 0 && (
            <Section title="Pour briser la glace" jp="氷">
              <p className="text-sm font-semibold text-ink-2">Des questions posées sur la table. Personne n’est obligé·e d’y répondre.</p>
              <div className="mt-5 space-y-5">
                {activity.icebreakers.map((q, i) => {
                  const who = speakers[i % Math.max(1, speakers.length)];
                  const right = i % 2 === 1;
                  return (
                    <div key={q} className={`flex items-end gap-2 ${right ? 'flex-row-reverse' : ''}`}>
                      {who && <Avatar user={who} size="md" />}
                      <span className={`bubble mb-4 text-[15px] ${right ? 'bubble-right bg-sakura-pale' : ''}`}>« {q} »</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          <Section title="Discussion de l’équipe" jp="話" aside={<span className="text-xs font-bold text-ink-3">Simulée, pas de temps réel</span>}>
            {joined ? (
              <>
                <ul className="space-y-4">
                  {messages.length === 0 && <li className="text-sm text-ink-3">Pas encore de message. Un petit « bonjour » fait souvent plaisir !</li>}
                  {messages.map((m) => {
                    const author = getUser(m.authorId);
                    const mine = m.authorId === ME;
                    return (
                      <li key={m.id} className={`group flex items-start gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                        <Avatar user={author} size="sm" />
                        <div className={`max-w-[80%] rounded-2xl border-2 border-ink px-3.5 py-2 ${mine ? 'rounded-tr-sm bg-sakura-soft' : 'rounded-tl-sm bg-white'}`}>
                          <p className="text-xs font-black">{mine ? 'Toi' : author?.firstName} <span className="font-semibold text-ink-3">· {timeAgo(m.at)}</span></p>
                          <p className="text-sm font-semibold break-words text-ink-2">{m.text}</p>
                        </div>
                        {!mine && (
                          <button className="self-center rounded-full p-1.5 text-ink-3 opacity-60 hover:bg-cream-2 hover:text-sakura-deep group-hover:opacity-100" aria-label={`Signaler le message de ${author?.firstName}`} onClick={() => setReport({ type: 'message', id: m.id, label: 'ce message' })}>
                            <Icon name="flag" className="size-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <form onSubmit={send} className="mt-5 flex gap-2">
                  <input className="input" placeholder="Écrire à l’équipe…" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} aria-label="Message au groupe" />
                  <button type="submit" className="btn-ink shrink-0 px-4" disabled={!draft.trim()} aria-label="Envoyer"><Icon name="send" className="size-4" /></button>
                </form>
                <p className="mt-2 text-xs font-semibold text-ink-3">Visible uniquement par l’équipe. Pas de coordonnées personnelles dans le fil, s’il te plaît.</p>
              </>
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-line bg-cream p-4 text-sm font-semibold text-ink-2">
                <Icon name="lock" className="mr-1 inline size-4" /> {messages.length} message{messages.length > 1 ? 's' : ''} dans le fil. La discussion est réservée aux membres de l’équipe pour la protéger.
              </p>
            )}
          </Section>

          <Section title="Le code de l’équipe" jp="約" aside={<button className="text-sm font-extrabold text-lav-deep" onClick={() => setShowGuidelines((s) => !s)}>{showGuidelines ? 'Masquer' : 'Afficher'}</button>}>
            <p className="text-sm font-semibold text-ink-2">Lieu public, bienveillance, consentement. Tu peux quitter l’équipe à tout moment.</p>
            {showGuidelines && <div className="mt-4"><GuidelinesList /></div>}
            <button className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-3 hover:text-sakura-deep" onClick={() => setReport({ type: 'activity', id: activity.id, label: 'cette activité' })}>
              <Icon name="flag" className="size-4" /> Signaler cette activité
            </button>
          </Section>
        </div>

        {/* ——— Sidebar ——— */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="panel overflow-hidden">
            <div className="flex items-baseline justify-between border-b-2 border-ink bg-sakura-soft px-5 py-4">
              <p className="font-manga text-2xl">{formatPrice(activity.priceMin, activity.priceMax)}</p>
              <p className={`text-sm font-black ${spots <= 2 ? 'text-sakura-deep' : 'text-matcha'}`}>
                {past ? 'Terminée' : spots > 0 ? `${spots} place${spots > 1 ? 's' : ''} libre${spots > 1 ? 's' : ''}` : joined ? 'Complet (dont toi)' : 'Équipe complète'}
              </p>
            </div>
            <div className="p-5">
              <p className="mb-2 text-[11px] font-black tracking-wider text-ink-3 uppercase">Équipe · {activity.participantIds.length}/{activity.maxParticipants}</p>
              <PartySlots users={participants} max={activity.maxParticipants} size="sm" limit={10} />
              <div className="mt-5">
                {past ? (
                  <p className="text-sm font-semibold text-ink-2">{joined ? 'Tu faisais partie de l’équipe.' : 'Cette quête est terminée.'}</p>
                ) : joined ? (
                  <>
                    <p className="mb-3 flex items-center gap-2 rounded-xl border-2 border-matcha bg-matcha-soft px-3 py-2 text-sm font-black text-matcha"><Icon name="check" className="size-4" strokeWidth={2.5} /> Tu fais partie de l’équipe</p>
                    <button className="btn-ghost w-full" onClick={() => setConfirmLeave(true)}>Quitter l’équipe</button>
                  </>
                ) : full ? (
                  <>
                    <button className="btn-ghost w-full" disabled>Équipe complète</button>
                    {community && <p className="mt-3 text-sm font-semibold text-ink-2">Rejoins la guilde « {community.name} » pour être prévenu·e du prochain épisode.</p>}
                  </>
                ) : (
                  <button className="btn-primary w-full py-3 text-base" onClick={join}>Rejoindre l’équipe</button>
                )}
              </div>
              <p className="mt-3 text-xs font-semibold text-ink-3">Démo : aucune réservation ni paiement réel.</p>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg">L’équipe ({activity.participantIds.length})</h2>
            {hasBlocked && <p className="mt-2 rounded-xl bg-sakura-soft p-2.5 text-xs font-bold text-sakura-deep">Un membre que tu as bloqué participe. Il est masqué de ta liste.</p>}
            <ul className="mt-4 space-y-2">
              {participants.map((u) => {
                const shared = u!.interests.filter((i) => me?.interests.includes(i));
                const isMe = u!.id === ME;
                return (
                  <li key={u!.id}>
                    <Link to={isMe ? '/profil' : `/profil/${u!.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-transparent p-1.5 hover:border-ink hover:bg-cream">
                      <Avatar user={u} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-1 text-sm font-black">
                          {isMe ? 'Toi' : u!.firstName}
                          {u!.id === activity.organizerId && <span className="chip bg-peach px-1.5 py-0 text-[10px] text-peach-deep">Guide</span>}
                          {familiarIds.has(u!.id) && <span className="chip bg-lav-soft px-1.5 py-0 text-[10px] text-lav-deep">Déjà rencontré·e</span>}
                          {u!.newInTown && !isMe && <span className="chip bg-matcha-soft px-1.5 py-0 text-[10px] text-matcha">Nouveau·elle</span>}
                        </p>
                        {!isMe && <p className="truncate text-xs font-semibold text-ink-3">{shared.length ? `★ ${shared.length} passion${shared.length > 1 ? 's' : ''} en commun` : u!.title}</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs font-semibold text-ink-3">Seuls les prénoms, avatars et passions sont visibles. Aucune coordonnée n’est partagée.</p>
          </div>

          {community && (
            <Link to={`/guildes/${community.id}`} className="card hover-lift flex items-center gap-4 p-5">
              <GuildCrest categoryId={community.categoryId} born={community.origin === 'cercle'} />
              <div>
                <p className="eyebrow text-lav-deep">Cette équipe se retrouve</p>
                <p className="font-display text-lg font-black">{community.name}</p>
                <p className="text-sm font-semibold text-ink-2">{community.rhythm} · {app.communityMembers(community).length} membres</p>
              </div>
            </Link>
          )}
        </aside>
      </div>

      {/* Mobile: keep the main action reachable without scrolling to the sidebar */}
      {!past && (
        <div className="fixed inset-x-3 bottom-[5.25rem] z-30 flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-white px-4 py-2.5 lg:hidden" style={{ boxShadow: '4px 4px 0 0 #2b2440' }}>
          <div className="min-w-0">
            <p className="font-manga text-lg leading-none">{formatPrice(activity.priceMin, activity.priceMax)}</p>
            <p className={`text-xs font-black ${spots <= 2 ? 'text-sakura-deep' : 'text-matcha'}`}>{joined ? 'Ta place est réservée' : spots > 0 ? `${spots} place${spots > 1 ? 's' : ''} libre${spots > 1 ? 's' : ''}` : 'Équipe complète'}</p>
          </div>
          {joined ? (
            <span className="sticker shrink-0 bg-matcha-soft text-matcha"><Icon name="check" className="size-3.5" /> Inscrit·e</span>
          ) : full ? (
            <span className="sticker shrink-0 bg-cream-2 text-ink-3">Complet</span>
          ) : (
            <button className="btn-primary btn-sm shrink-0 px-4 py-2 text-sm" onClick={join} aria-label="Rejoindre l’équipe (barre mobile)">Rejoindre</button>
          )}
        </div>
      )}
      {guidelinesModal}
      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Quitter l’équipe ?">
        <p className="text-sm font-semibold text-ink-2">Ta place sera libérée pour quelqu’un d’autre. Pas de souci, ça arrive : l’équipe sera prévenue sans détail.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirmLeave(false)}>Garder ma place</button>
          <button className="btn-primary" onClick={() => { leave(); setConfirmLeave(false); }}>Quitter l’équipe</button>
        </div>
      </Modal>
      {report && <ReportDialog open onClose={() => setReport(null)} targetType={report.type} targetId={report.id} targetLabel={report.label} />}
    </div>
  );
}
