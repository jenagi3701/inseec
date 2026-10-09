// Agenda (upcoming), History + feedback, Saved activities.
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { Icon } from '../components/Icon';
import { AvatarStack, CategoryDot, EmptyState } from '../components/ui';
import { DateTicket } from '../components/ActivityCard';
import { Scene } from '../components/art/Scene';
import { categoryById } from '../data/taxonomy';
import { formatDay, formatTime, relativeDay } from '../lib/format';
import type { Activity } from '../data/types';
import { ME } from '../store/state';

export function PageHeader({ jp, kicker, title, text }: { jp: string; kicker: string; title: string; text?: string }) {
  return (
    <header className="mb-8">
      <span className="sticker bg-white text-sakura-deep"><span className="font-jp">{jp}</span> {kicker}</span>
      <h1 className="mt-3 font-manga text-4xl font-normal md:text-5xl">{title}</h1>
      {text && <p className="mt-2 max-w-2xl font-semibold text-ink-2">{text}</p>}
    </header>
  );
}

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
      <PageHeader jp="予定" kicker="Agenda" title="Mes prochaines quêtes" text="Tu peux quitter une équipe à tout moment depuis la page de la quête." />
      <div className="mt-8">
        {mine.length ? (
          <div className="space-y-8">
            {groupByDay(mine).map((day) => (
              <section key={day[0].startsAt}>
                <h2 className="mb-3 font-sans text-sm font-black tracking-wide text-ink-2">{relativeDay(day[0].startsAt)} · {formatDay(day[0].startsAt)}</h2>
                <div className="space-y-3">
                  {day.map((a) => {
                    const rec = recommendFor(a);
                    const c = a.communityId ? getCommunity(a.communityId) : undefined;
                    return (
                      <Link key={a.id} to={`/activites/${a.id}`} className="card hover-lift flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                        <DateTicket iso={a.startsAt} />
                        <div className="w-16 shrink-0 text-center">
                          <p className="font-manga text-base">{formatTime(a.startsAt).replace(' h ', 'h')}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 font-display font-black"><CategoryDot id={a.categoryId} /> <span className="truncate">{a.title}</span></p>
                          <p className="truncate text-sm text-ink-2">{a.venue} · {a.district}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {c && <span className="chip bg-lav-soft text-lav"><Icon name="repeat" className="size-3" /> {c.name}</span>}
                            {rec.familiar.length > 0 && <span className="chip bg-sakura-soft text-sakura-deep">{rec.familiar.length} compagnon{rec.familiar.length > 1 ? 's' : ''} de route</span>}
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
          <EmptyState icon="calendar" title="Ton agenda est vide" text="Rejoins une équipe pour retrouver ta quête ici." action={<Link to="/activites" className="btn-primary btn-sm">Voir les quêtes</Link>} />
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
      <PageHeader jp="日記" kicker="Ton parcours" title="Journal d’aventure" text="Tes quêtes passées et tes bilans. Donne ton avis pour retrouver les équipes qui t’ont plu." />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card bg-sakura-pale p-5"><p className="font-manga text-3xl text-sakura-deep">{past.length}</p><p className="text-sm font-bold text-ink-2">quêtes vécues</p></div>
        <div className="card bg-lav-soft p-5"><p className="font-manga text-3xl text-lav-deep">{state.communities.length}</p><p className="text-sm font-bold text-ink-2">guildes</p></div>
        <div className="card bg-sora-soft p-5"><p className="font-manga text-3xl text-sora">{people.length}</p><p className="text-sm font-bold text-ink-2">compagnons de route</p></div>
      </div>
      <p className="mt-3 text-xs font-semibold text-ink-3">Ces chiffres sont pour toi seul·e. Personne ne voit combien de personnes tu connais : on ne collectionne pas les amis.</p>

      <div className="mt-10 space-y-3">
        {past.length ? (
          past.map((a) => {
            const fb = state.feedback[a.id];
            return (
              <div key={a.id} className="card flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-ink sm:block"><Scene scene={categoryById(a.categoryId).scene} seed={a.id} className="absolute inset-0 h-full w-full" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-ink-3">{relativeDay(a.startsAt)}</p>
                  <Link to={`/activites/${a.id}`} className="flex items-center gap-2 font-display font-black hover:underline"><CategoryDot id={a.categoryId} /> {a.title}</Link>
                  <div className="mt-2 flex items-center gap-2">
                    <AvatarStack users={a.participantIds.filter((p) => p !== ME).map(getUser)} max={5} size="xs" />
                    {fb && <span className="text-xs text-ink-3">Note {fb.rating}/5 · {fb.meetAgain === 'oui' ? 'Envie de continuer l’histoire' : fb.meetAgain === 'peut-etre' ? 'Peut-être' : 'Pas cette fois'}</span>}
                  </div>
                </div>
                {fb ? (
                  <Link to={`/activites/${a.id}/bilan`} className="btn-ghost btn-sm">Voir la suite</Link>
                ) : (
                  <Link to={`/activites/${a.id}/bilan`} className="btn-lav btn-sm">Donner mon avis</Link>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState icon="history" title="Ton journal est vierge" text="Tes quêtes passées et tes bilans apparaîtront ici." />
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
      <PageHeader jp="栞" kicker="Pour plus tard" title="Quêtes enregistrées" text="Les quêtes gardées de côté, sans engagement." />
      <div className="mt-8">
        {upcoming.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((a) => <ActivityCard key={a.id} activity={a} />)}</div>
        ) : (
          <EmptyState icon="bookmark" title="Rien d’enregistré" text="Touche le cœur d’une quête pour la garder de côté sans rejoindre l’équipe." action={<Link to="/activites" className="btn-primary btn-sm">Explorer</Link>} />
        )}
      </div>
    </div>
  );
}
