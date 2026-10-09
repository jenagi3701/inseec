// Agenda (upcoming), History + feedback, Saved activities.
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { Icon } from '../components/Icon';
import { AvatarStack, CategoryDot, EmptyState } from '../components/ui';
import { formatDay, formatTime, relativeDay } from '../lib/format';
import type { Activity } from '../data/types';
import { ME } from '../store/state';

function groupByDay(list: Activity[]) {
  const map = new Map<string, Activity[]>();
  list.forEach((a) => {
    const k = new Date(a.startsAt).toDateString();
    map.set(k, [...(map.get(k) ?? []), a]);
  });
  return [...map.values()];
}

export function Agenda() {
  const { activities, isPast, isJoined, getUser, recommendFor, getCommunity } = useApp();
  const mine = activities.filter((a) => !isPast(a) && isJoined(a.id)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <div>
      <p className="eyebrow mb-2">Agenda</p>
      <h1 className="text-4xl font-semibold">Mes prochaines activités</h1>
      <p className="mt-2 text-ink-2">Tu peux te désinscrire à tout moment depuis la page de l’activité.</p>
      <div className="mt-8">
        {mine.length ? (
          <div className="space-y-8">
            {groupByDay(mine).map((day) => (
              <section key={day[0].startsAt}>
                <h2 className="mb-3 font-sans text-sm font-semibold text-ink-2 capitalize">{relativeDay(day[0].startsAt)} · {formatDay(day[0].startsAt)}</h2>
                <div className="space-y-3">
                  {day.map((a) => {
                    const rec = recommendFor(a);
                    const c = a.communityId ? getCommunity(a.communityId) : undefined;
                    return (
                      <Link key={a.id} to={`/activites/${a.id}`} className="card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-md sm:flex-nowrap">
                        <div className="w-16 shrink-0 text-center">
                          <p className="font-display text-xl font-semibold">{formatTime(a.startsAt)}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 font-semibold"><CategoryDot id={a.categoryId} /> <span className="truncate">{a.title}</span></p>
                          <p className="truncate text-sm text-ink-2">{a.venue} · {a.district}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {c && <span className="chip bg-ai-soft text-ai"><Icon name="repeat" className="size-3" /> {c.name}</span>}
                            {rec.familiar.length > 0 && <span className="chip bg-ai-soft text-ai">{rec.familiar.length} visage{rec.familiar.length > 1 ? 's' : ''} familier{rec.familiar.length > 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                        <AvatarStack users={a.participantIds.map(getUser)} max={4} size="xs" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState icon="calendar" title="Ton agenda est vide" text="Inscris-toi à une activité pour la retrouver ici." action={<Link to="/activites" className="btn-primary btn-sm">Découvrir les activités</Link>} />
        )}
      </div>
    </div>
  );
}

export function History() {
  const { activities, isPast, isJoined, state, getUser, familiarIds } = useApp();
  const past = activities.filter((a) => isPast(a) && isJoined(a.id)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const people = [...familiarIds].map(getUser).filter(Boolean);
  return (
    <div>
      <p className="eyebrow mb-2">Ton parcours</p>
      <h1 className="text-4xl font-semibold">Historique & bilans</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="font-display text-3xl font-semibold">{past.length}</p><p className="text-sm text-ink-2">activités vécues</p></div>
        <div className="card p-5"><p className="font-display text-3xl font-semibold">{state.communities.length}</p><p className="text-sm text-ink-2">cercles</p></div>
        <div className="card p-5"><p className="font-display text-3xl font-semibold">{people.length}</p><p className="text-sm text-ink-2">visages familiers</p></div>
      </div>
      <p className="mt-3 text-xs text-ink-3">Ces chiffres sont pour toi seul·e. Personne ne voit combien de personnes tu connais : on ne collectionne pas les amis.</p>

      <div className="mt-10 space-y-3">
        {past.length ? (
          past.map((a) => {
            const fb = state.feedback[a.id];
            return (
              <div key={a.id} className="card flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink-3">{relativeDay(a.startsAt)}</p>
                  <Link to={`/activites/${a.id}`} className="flex items-center gap-2 font-semibold hover:underline"><CategoryDot id={a.categoryId} /> {a.title}</Link>
                  <div className="mt-2 flex items-center gap-2">
                    <AvatarStack users={a.participantIds.filter((p) => p !== ME).map(getUser)} max={5} size="xs" />
                    {fb && <span className="text-xs text-ink-3">Note {fb.rating}/5 · {fb.meetAgain === 'oui' ? 'Envie de se revoir' : fb.meetAgain === 'peut-etre' ? 'Peut-être' : 'Pas cette fois'}</span>}
                  </div>
                </div>
                {fb ? (
                  <Link to={`/activites/${a.id}/bilan`} className="btn-ghost btn-sm">Voir la suite</Link>
                ) : (
                  <Link to={`/activites/${a.id}/bilan`} className="btn-ai btn-sm">Donner mon avis</Link>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState icon="history" title="Pas encore d’historique" text="Tes activités passées et tes bilans apparaîtront ici." />
        )}
      </div>
    </div>
  );
}

export function Saved() {
  const { activities, state, isPast } = useApp();
  const saved = state.saved.map((id) => activities.find((a) => a.id === id)).filter((a): a is Activity => !!a);
  const upcoming = saved.filter((a) => !isPast(a));
  return (
    <div>
      <p className="eyebrow mb-2">Pour plus tard</p>
      <h1 className="text-4xl font-semibold">Activités enregistrées</h1>
      <div className="mt-8">
        {upcoming.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((a) => <ActivityCard key={a.id} activity={a} />)}</div>
        ) : (
          <EmptyState icon="bookmark" title="Rien d’enregistré" text="Touche le marque-page d’une activité pour la garder de côté sans t’inscrire." action={<Link to="/activites" className="btn-primary btn-sm">Explorer</Link>} />
        )}
      </div>
    </div>
  );
}
