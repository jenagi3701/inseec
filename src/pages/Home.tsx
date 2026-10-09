import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { Icon } from '../components/Icon';
import { AvatarStack, CoverArt, EmptyState, SectionHeader } from '../components/ui';
import { formatDay, formatTime, relativeDay } from '../lib/format';
import { categoryById, interestLabel } from '../data/taxonomy';
import { Pill } from '../components/ProfileFields';

export default function Home() {
  const { me, activities, communities, isPast, isJoined, isMember, recommendFor, state, getUser, communityMembers } = useApp();
  const [interest, setInterest] = useState(me?.interests[0] ?? '');

  const data = useMemo(() => {
    const upcoming = activities.filter((a) => !isPast(a)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const mine = upcoming.filter((a) => isJoined(a.id));
    const open = upcoming.filter((a) => !isJoined(a.id));
    const scored = open.map((a) => ({ a, r: recommendFor(a) }));
    const pendingFeedback = activities.filter((a) => isPast(a) && isJoined(a.id) && !state.feedback[a.id]);
    const familiar = scored.filter((x) => x.r.familiar.length > 0 && !(x.a.communityId && isMember(x.a.communityId))).slice(0, 3).map((x) => x.a);
    // Each activity appears in one section only, so the dashboard stays varied
    const shown = new Set(familiar.map((a) => a.id));
    const recommended = [...scored].sort((x, y) => y.r.score - x.r.score).map((x) => x.a).filter((a) => !shown.has(a.id)).slice(0, 6);
    recommended.forEach((a) => shown.add(a.id));
    const near = open.filter((a) => a.distanceKm <= 1.5 && !shown.has(a.id)).slice(0, 3);
    near.forEach((a) => shown.add(a.id));
    const myCircles = communities.filter((c) => isMember(c.id)).map((c) => ({ c, next: upcoming.find((a) => a.communityId === c.id) }));
    return { mine, pendingFeedback, familiar, recommended, near, myCircles, open, shown };
  }, [activities, communities, isPast, isJoined, isMember, recommendFor, state.feedback]);

  const byInterest = data.open.filter((a) => a.tags.includes(interest) && !data.shown.has(a.id)).slice(0, 3);
  const next = data.mine[0];

  return (
    <div className="space-y-14">
      <section className="fade-up">
        <p className="eyebrow mb-2">{formatDay(new Date().toISOString())}</p>
        <h1 className="text-4xl font-semibold">Bonjour {me?.firstName} 👋</h1>
        <p className="mt-2 text-ink-2">
          {data.myCircles.length
            ? `Tu fais partie de ${data.myCircles.length} cercle${data.myCircles.length > 1 ? 's' : ''} et ${data.mine.length} activité${data.mine.length > 1 ? 's' : ''} t’attend${data.mine.length > 1 ? 'ent' : ''}.`
            : 'Commence par une activité qui te ressemble. Si le groupe te plaît, tu pourras le retrouver.'}
        </p>
      </section>

      {/* Continuity prompt */}
      {data.pendingFeedback.map((a) => (
        <section key={a.id} className="fade-up overflow-hidden rounded-3xl bg-ai text-white">
          <div className="grid items-center gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-white/60 uppercase">{relativeDay(a.startsAt)} · {a.title}</p>
              <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Envie de revoir ce groupe ?</h2>
              <p className="mt-2 max-w-xl text-white/75">Ta réponse reste privée. Si plusieurs personnes disent oui, on vous propose de former un cercle et une prochaine activité.</p>
              <div className="mt-4 flex items-center gap-3">
                <AvatarStack users={a.participantIds.filter((p) => p !== 'me').map(getUser)} />
                <span className="text-sm text-white/70">{a.participantIds.length - 1} autres participant·es</span>
              </div>
            </div>
            <Link to={`/activites/${a.id}/bilan`} className="btn bg-white px-6 py-3 text-ai hover:bg-paper">
              Donner mon avis <Icon name="arrowRight" className="size-4" />
            </Link>
          </div>
        </section>
      ))}

      {/* RECONNECT */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <span className="chip bg-ai-soft text-ai"><Icon name="repeat" className="size-3.5" /> Retrouver</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Ta prochaine rencontre</h2>
            {next ? (
              <Link to={`/activites/${next.id}`} className="card block overflow-hidden transition hover:shadow-lg">
                <CoverArt activity={next} className="h-28" />
                <div className="p-5">
                  <p className="text-sm font-semibold text-shu">{relativeDay(next.startsAt)} · {formatTime(next.startsAt)}</p>
                  <p className="font-display text-xl font-semibold">{next.title}</p>
                  <p className="mt-1 text-sm text-ink-2">{next.venue}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <AvatarStack users={next.participantIds.map(getUser)} />
                    <span className="text-xs text-ink-2">{recommendFor(next).familiar.length} que tu connais déjà</span>
                  </div>
                </div>
              </Link>
            ) : (
              <EmptyState icon="calendar" title="Rien de prévu" text="Inscris-toi à une activité pour la voir ici." action={<Link to="/activites" className="btn-primary btn-sm">Découvrir</Link>} />
            )}
          </div>

          <div>
            <SectionHeader title="Tes cercles" link="/cercles" linkLabel="Mes cercles" />
            {data.myCircles.length ? (
              <div className="grid gap-3">
                {data.myCircles.map(({ c, next: n }) => (
                  <Link key={c.id} to={`/cercles/${c.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-md">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl font-jp text-xl font-bold text-white" style={{ background: categoryById(c.categoryId).color }}>
                      {categoryById(c.categoryId).kanji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="truncate text-sm text-ink-2">
                        {n ? <>Prochaine rencontre : <span className="font-medium text-ink">{relativeDay(n.startsAt)}</span>{isJoined(n.id) ? ' · inscrit·e ✓' : ''}</> : 'Prochaine rencontre à proposer'}
                      </p>
                    </div>
                    <AvatarStack users={communityMembers(c).map(getUser)} max={3} size="xs" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon="circles" title="Pas encore de cercle" text="Après une activité, dis si tu veux revoir le groupe : c’est comme ça que naissent les cercles." />
            )}
          </div>
        </div>

        {data.familiar.length > 0 && (
          <div className="mt-10">
            <SectionHeader title="Avec des visages familiers" kicker="Des personnes que tu as déjà rencontrées y vont" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.familiar.map((a) => <ActivityCard key={a.id} activity={a} />)}
            </div>
          </div>
        )}
      </section>

      {/* DISCOVER */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <span className="chip bg-shu-soft text-shu-dark"><Icon name="compass" className="size-3.5" /> Découvrir</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <SectionHeader title="Recommandé pour toi" kicker="Selon tes passions, tes créneaux et ton énergie" link="/activites" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.recommended.map((a) => <ActivityCard key={a.id} activity={a} />)}
        </div>
        <p className="mt-3 text-xs text-ink-3">
          <Icon name="info" className="inline size-3.5" /> Les recommandations reposent sur des règles simples et transparentes (centres d’intérêt communs, créneau, taille de groupe, distance, visages familiers). Ce n’est pas un score de compatibilité.
        </p>
      </section>

      <section>
        <SectionHeader title="Par tes passions" link="/activites" />
        <div className="mb-5 flex flex-wrap gap-2">
          {me?.interests.slice(0, 8).map((i) => (
            <Pill key={i} active={interest === i} onClick={() => setInterest(i)}>{interestLabel(i)}</Pill>
          ))}
        </div>
        {byInterest.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {byInterest.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        ) : (
          <EmptyState icon="sparkle" title="Rien pour l’instant" text={`Pas d’autre activité « ${interestLabel(interest)} » que celles déjà proposées plus haut. Et si tu en proposais une ?`} action={<Link to="/proposer" className="btn-primary btn-sm">Proposer une activité</Link>} />
        )}
      </section>

      {data.near.length > 0 && (
        <section>
          <SectionHeader title="Tout près du centre" kicker="À moins de 1,5 km de Bellecour" link="/activites" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.near.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
