import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { DEMO_RECIPROCATORS, useApp } from '../store/AppContext';
import type { Activity, Feedback as FeedbackT } from '../data/types';
import { ME, uid } from '../store/state';
import { Icon } from '../components/Icon';
import { Avatar, AvatarStack, CoverArt, Modal } from '../components/ui';
import { ReportDialog } from '../components/ReportDialog';
import { useToast } from '../components/Toast';
import { interestLabel } from '../data/taxonomy';
import { formatShortDay, formatTime, relativeDay } from '../lib/format';

const RATINGS = [
  { v: 1, label: 'Pas pour moi', face: '😕' },
  { v: 2, label: 'Bof', face: '😐' },
  { v: 3, label: 'Sympa', face: '🙂' },
  { v: 4, label: 'Très bien', face: '😄' },
  { v: 5, label: 'Génial', face: '🤩' },
] as const;

export default function Feedback() {
  const { id = '' } = useParams();
  const { getActivity, isJoined, isPast, state } = useApp();
  const activity = getActivity(id);
  if (!activity || !isJoined(id) || !isPast(activity)) return <Navigate to="/historique" replace />;
  return state.feedback[id] ? <FollowUp activity={activity} feedback={state.feedback[id]} /> : <Form activity={activity} />;
}

function Form({ activity }: { activity: Activity }) {
  const { getUser, dispatch } = useApp();
  const [rating, setRating] = useState<FeedbackT['rating'] | 0>(0);
  const [meetAgain, setMeetAgain] = useState<FeedbackT['meetAgain'] | ''>('');
  const [connectWith, setConnectWith] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const others = activity.participantIds.filter((p) => p !== ME).map(getUser).filter(Boolean);

  const submit = () => {
    if (!rating || !meetAgain) return setError('Indique au moins ta note et si tu veux revoir le groupe.');
    const reciprocated = connectWith.filter((p) => DEMO_RECIPROCATORS.has(p));
    dispatch({ type: 'submitFeedback', reciprocated, feedback: { activityId: activity.id, rating, meetAgain, connectWith, note: note.trim(), at: new Date().toISOString() } });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/activites/${activity.id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-ink-2 hover:text-ink"><Icon name="arrowLeft" className="size-4" /> La quête</Link>
      <div className="panel relative mb-2 overflow-hidden">
        <CoverArt activity={activity} className="h-36" />
      </div>
      <span className="sticker mt-6 bg-lav-soft text-lav-deep">Fin d’épisode · {relativeDay(activity.startsAt)} · bilan privé</span>
      <h1 className="mt-3 font-manga text-3xl font-normal sm:text-4xl">{activity.title}</h1>
      <p className="mt-2 font-semibold text-ink-2">Tes réponses ne sont jamais montrées aux autres. Elles servent à former des guildes quand l’envie est partagée.</p>

      <section className="mt-10">
        <h2 className="text-xl">Comment c’était ?</h2>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {RATINGS.map((r) => (
            <button key={r.v} type="button" aria-pressed={rating === r.v} onClick={() => { setRating(r.v); setError(''); }}
              className="tile px-1 py-3 text-center text-xs font-bold sm:text-sm" aria-label={`${r.v} sur 5 : ${r.label}`}>
              <span className="block text-3xl" aria-hidden="true">{r.face}</span>{r.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel dusk relative mt-10 overflow-hidden p-6">
        <div className="speedlines absolute inset-[-60%] text-white opacity-[0.06]" aria-hidden="true" />
        <h2 className="relative font-manga text-2xl font-normal">Aimerais-tu revoir cette équipe ?</h2>
        <div className="relative mt-4 flex items-end gap-3"><AvatarStack users={others} size="md" /> <span className="bubble mb-7 text-xs text-ink">On se revoit ?</span></div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {([['oui', 'Oui, avec plaisir'], ['peut-etre', 'Peut-être'], ['non', 'Pas cette fois']] as const).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={meetAgain === v} onClick={() => { setMeetAgain(v); setError(''); }}
              className={`relative rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition ${meetAgain === v ? 'border-edge bg-surface text-lav-deep shadow-[var(--shadow-sm)]' : 'border-white/40 hover:bg-surface/10'}`}>
              {l}
            </button>
          ))}
        </div>
        <p className="relative mt-3 text-xs font-semibold text-ink-2">« Pas cette fois » est une réponse parfaitement normale. Personne n’en est informé.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl">Rester en contact avec quelqu’un en particulier ?</h2>
        <p className="mt-1 text-sm text-ink-2">Facultatif. La connexion n’apparaît que si l’autre personne t’a aussi choisi·e. Sinon, rien ne se passe — et personne ne le sait.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {others.map((u) => (
            <label key={u!.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-line bg-surface p-3 has-[:checked]:border-sakura has-[:checked]:bg-lav-soft has-[:checked]:shadow-[var(--shadow-sm)]">
              <input type="checkbox" className="size-4 accent-[var(--color-lav)]" checked={connectWith.includes(u!.id)}
                onChange={(e) => setConnectWith((c) => (e.target.checked ? [...c, u!.id] : c.filter((x) => x !== u!.id)))} />
              <Avatar user={u} size="md" />
              <span className="text-sm font-black">{u!.firstName}{u!.title ? <span className="block text-xs font-semibold text-ink-3">{u!.title}</span> : null}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <label className="font-display text-xl font-black" htmlFor="note">Un mot pour l’organisateur·rice ?</label>
        <textarea id="note" className="input mt-3 min-h-24" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ce qui t’a plu, ce qui pourrait être amélioré…" />
      </section>

      {error && <p className="mt-6 rounded-xl bg-sakura-soft p-3 text-sm text-sakura-deep" role="alert">{error}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-sakura-deep" onClick={() => setReportOpen(true)}><Icon name="flag" className="size-4" /> Un problème pendant l’activité ?</button>
        <button className="btn-primary px-6 py-3" onClick={submit}>Envoyer mon bilan</button>
      </div>
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="activity" targetId={activity.id} targetLabel="un problème" />
    </div>
  );
}

function FollowUp({ activity, feedback }: { activity: Activity; feedback: FeedbackT }) {
  const { getUser, getCommunity, activities, isPast, isJoined, isMember, dispatch, state, me } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [circleOpen, setCircleOpen] = useState(false);
  const [circleName, setCircleName] = useState(`Guilde — ${activity.title.split(':').pop()!.trim()}`);
  const [invited, setInvited] = useState<string[]>([]);
  useEffect(() => window.scrollTo(0, 0), []);

  const others = activity.participantIds.filter((p) => p !== ME);
  // Demo simulation of who else answered "oui"
  const alsoYes = others.filter((p) => DEMO_RECIPROCATORS.has(p));
  const mutual = state.connections.filter((c) => c.status === 'mutuelle' && feedback.connectWith.includes(c.userId));
  const pending = state.connections.filter((c) => c.status === 'en-attente' && feedback.connectWith.includes(c.userId));
  const community = activity.communityId ? getCommunity(activity.communityId) : undefined;
  const alreadyCircle = state.createdCommunities.find((c) => c.fromActivityId === activity.id);

  const groupTags = useMemo(() => {
    const counts = new Map<string, number>();
    [...activity.participantIds].forEach((p) => getUser(p)?.interests.forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1)));
    return [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([i]) => i).slice(0, 5);
  }, [activity, getUser]);

  const upcoming = activities.filter((a) => !isPast(a)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const nextOfCommunity = community ? upcoming.find((a) => a.communityId === community.id) : undefined;
  const suggestions = upcoming.filter((a) => a.id !== nextOfCommunity?.id && a.tags.some((t) => groupTags.includes(t))).slice(0, 3);

  const createCircle = () => {
    const name = circleName.trim();
    if (name.length < 3) return;
    const cid = uid('c');
    dispatch({
      type: 'createCircle',
      community: {
        id: cid, name, tagline: 'On s’est bien entendu·es, alors on se revoit.',
        description: `Guilde fondée après « ${activity.title} » par les participant·es qui voulaient se revoir.`, fromActivityId: activity.id,
        categoryId: activity.categoryId, tags: groupTags.length ? groupTags : activity.tags, memberIds: alsoYes, rhythm: 'À définir ensemble', organizerId: ME, origin: 'cercle',
      },
    });
    setCircleOpen(false);
    navigate(`/guildes/${cid}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/historique" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"><Icon name="arrowLeft" className="size-4" /> Historique</Link>
      <span className="sticker bg-matcha-soft text-matcha">Bilan envoyé · {activity.title}</span>
      <h1 className="mt-3 font-manga text-3xl font-normal sm:text-4xl">{feedback.meetAgain === 'non' ? 'Merci pour ton retour.' : 'Et maintenant, on se revoit ?'}</h1>

      {mutual.length > 0 && (
        <div className="pop panel relative mt-6 overflow-hidden bg-sakura-soft p-5">
          <div className="speedlines absolute inset-[-80%] text-sakura-deep opacity-15" aria-hidden="true" />
          <p className="relative font-manga text-xl text-sakura-deep">Connexion mutuelle 🎉</p>
          <div className="relative mt-3 flex flex-wrap gap-3">
            {mutual.map((c) => (
              <Link key={c.userId} to={`/profil/${c.userId}`} className="flex items-center gap-2 rounded-full border border-edge bg-surface py-1 pr-4 pl-1 text-sm font-black">
                <Avatar user={getUser(c.userId)} size="sm" /> {getUser(c.userId)?.firstName}
              </Link>
            ))}
          </div>
          <p className="relative mt-3 text-sm font-semibold text-ink-2">Vous vous êtes choisi·es mutuellement. Vous verrez désormais vos activités communes en priorité.</p>
        </div>
      )}
      {pending.length > 0 && <p className="mt-3 text-sm text-ink-3">{pending.length} demande{pending.length > 1 ? 's' : ''} en attente — visible{pending.length > 1 ? 's' : ''} par toi seul·e.</p>}

      {feedback.meetAgain !== 'non' ? (
        <div className="mt-8 space-y-6">
          {/* Same Circle */}
          {community ? (
            <section className="panel overflow-hidden">
              <div className="dusk border-b border-edge p-6">
                <span className="sticker bg-surface text-lav-deep">Même équipe, nouvel épisode</span>
                <h2 className="mt-3 font-manga text-2xl font-normal">{community.name} se retrouve bientôt</h2>
                <p className="mt-1 text-ink-2">{community.rhythm}. {alsoYes.length} personnes de cette équipe ont aussi envie de revenir (simulation démo).</p>
              </div>
              <div className="grid gap-3 p-6 sm:grid-cols-2">
                {nextOfCommunity ? (
                  isJoined(nextOfCommunity.id) ? (
                    <Link to={`/activites/${nextOfCommunity.id}`} className="btn-ghost justify-start"><Icon name="check" className="size-4 text-matcha" /> Inscrit·e à l’épisode suivant : {formatShortDay(nextOfCommunity.startsAt)}</Link>
                  ) : (
                    <button className="btn-lav justify-start" onClick={() => { dispatch({ type: 'join', activityId: nextOfCommunity.id, title: nextOfCommunity.title }); toast('Place réservée pour la prochaine rencontre !'); }}>
                      <Icon name="calendar" className="size-4" /> Rejoindre l’épisode suivant ({formatShortDay(nextOfCommunity.startsAt)})
                    </button>
                  )
                ) : (
                  <Link to={`/proposer?cercle=${community.id}`} className="btn-lav justify-start"><Icon name="plus" className="size-4" /> Proposer le prochain épisode</Link>
                )}
                {isMember(community.id) ? (
                  <Link to={`/guildes/${community.id}`} className="btn-ghost justify-start"><Icon name="circles" className="size-4" /> Dans mes guildes ✓</Link>
                ) : (
                  <button className="btn-ghost justify-start" onClick={() => { dispatch({ type: 'joinCommunity', communityId: community.id, name: community.name }); toast('Guilde ajoutée à tes guildes'); }}>
                    <Icon name="circles" className="size-4" /> Enregistrer cette équipe dans mes guildes
                  </button>
                )}
              </div>
            </section>
          ) : (
            <section className="panel overflow-hidden">
              <div className="dusk border-b border-edge p-6">
                <span className="sticker bg-surface text-lav-deep">Même équipe, nouvel épisode</span>
                <h2 className="mt-3 font-manga text-2xl font-normal">{alsoYes.length} personne{alsoYes.length > 1 ? 's' : ''} sur {others.length} veulent aussi se revoir</h2>
                <div className="mt-3 flex items-center gap-3"><AvatarStack users={alsoYes.map(getUser)} /><span className="text-sm text-ink-2">Réponses simulées pour la démo</span></div>
              </div>
              <div className="p-6">
                {alreadyCircle ? (
                  <Link to={`/guildes/${alreadyCircle.id}`} className="btn-lav"><Icon name="circles" className="size-4" /> Voir la guilde « {alreadyCircle.name} »</Link>
                ) : alsoYes.length >= 2 ? (
                  <>
                    <p className="text-sm text-ink-2">L’envie est partagée : transformez cette quête ponctuelle en guilde récurrente. Seules les personnes qui ont dit oui en feront partie.</p>
                    <button className="btn-lav mt-4" onClick={() => setCircleOpen(true)}><Icon name="circles" className="size-4" /> Fonder une guilde avec cette équipe</button>
                  </>
                ) : (
                  <p className="text-sm text-ink-2">Pas encore assez de réponses pour former une guilde. On te préviendra si d’autres personnes disent oui.</p>
                )}
              </div>
            </section>
          )}

          {/* Suggest another activity / invite */}
          <section className="card p-6">
            <h2 className="text-xl">Une autre quête pour cette équipe ?</h2>
            <p className="mt-1 text-sm text-ink-2">
              Basé sur ce que le groupe a en commun : {groupTags.length ? groupTags.map(interestLabel).join(', ') : 'vos passions'}.
            </p>
            <ul className="mt-4 divide-y divide-line">
              {suggestions.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Link to={`/activites/${a.id}`} className="min-w-0">
                    <p className="font-semibold hover:underline">{a.title}</p>
                    <p className="text-xs text-ink-3">{formatShortDay(a.startsAt)} · {formatTime(a.startsAt)} · {a.district}</p>
                  </Link>
                  <button className="btn-ghost btn-sm" disabled={invited.includes(a.id)}
                    onClick={() => { setInvited((i) => [...i, a.id]); dispatch({ type: 'notify', text: `Invitation envoyée au groupe pour « ${a.title} » (démo).`, link: `/activites/${a.id}` }); toast('Invitation envoyée au groupe (démo)'); }}>
                    {invited.includes(a.id) ? 'Invitation envoyée ✓' : 'Inviter le groupe'}
                  </button>
                </li>
              ))}
            </ul>
            <Link to={`/proposer${alreadyCircle ? `?cercle=${alreadyCircle.id}` : community ? `?cercle=${community.id}` : ''}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-lav-deep"><Icon name="plus" className="size-4" /> Proposer une nouvelle quête</Link>
          </section>
        </div>
      ) : (
        <div className="mt-8 card p-6">
          <p className="text-ink-2">Chaque groupe est différent. Voici d’autres quêtes qui pourraient te correspondre, {me?.firstName}.</p>
          <Link to="/activites" className="btn-primary mt-4">Découvrir d’autres quêtes</Link>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-ink-3">Note donnée : {feedback.rating}/5 · Réponse « revoir le groupe » : {feedback.meetAgain}</p>

      <Modal open={circleOpen} onClose={() => setCircleOpen(false)} title="Former une guilde">
        <p className="text-sm text-ink-2">La guilde réunira toi et les {alsoYes.length} personnes qui ont dit oui. Vous pourrez y écrire vos prochains épisodes.</p>
        <label className="label mt-4" htmlFor="circle-name">Nom de la guilde</label>
        <input id="circle-name" className="input" value={circleName} onChange={(e) => setCircleName(e.target.value)} maxLength={50} />
        {circleName.trim().length < 3 && <p className="mt-1 text-sm text-sakura-deep">3 caractères minimum.</p>}
        <div className="mt-4 flex items-center gap-3"><AvatarStack users={[...alsoYes.map(getUser), me ?? undefined]} /> <span className="text-sm text-ink-2">{alsoYes.length + 1} membres</span></div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setCircleOpen(false)}>Annuler</button>
          <button className="btn-lav" onClick={createCircle} disabled={circleName.trim().length < 3}>Créer la guilde</button>
        </div>
      </Modal>
    </div>
  );
}
