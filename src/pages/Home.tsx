import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ActivityCard, DateTicket } from '../components/ActivityCard';
import { Icon } from '../components/Icon';
import { Avatar, AvatarStack, CoverArt, EmptyState, ModeTag, PartySlots, SectionHeader, Sparkle } from '../components/ui';
import { Scene } from '../components/art/Scene';
import { GuildCrest } from '../components/Guild';
import { episodeOf, formatDay, formatTime, relativeDay } from '../lib/format';
import { interestLabel } from '../data/taxonomy';
import { ME } from '../store/state';

function timeOfDay() {
  const h = new Date().getHours();
  return h >= 20 || h < 6 ? 'soir' : h >= 17 ? 'crepuscule' : 'jour';
}

export default function Home() {
  const { me, activities, communities, isPast, isJoined, isMember, recommendFor, state, getUser, communityMembers, familiarIds } = useApp();
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
    const myGuilds = communities.filter((c) => isMember(c.id)).map((c) => ({ c, next: upcoming.find((a) => a.communityId === c.id) }));
    return { mine, pendingFeedback, familiar, recommended, near, myGuilds, open, shown };
  }, [activities, communities, isPast, isJoined, isMember, recommendFor, state.feedback]);

  const byInterest = data.open.filter((a) => a.tags.includes(interest) && !data.shown.has(a.id)).slice(0, 3);
  const next = data.mine[0];
  const nextRec = next ? recommendFor(next) : null;
  const nextEp = next ? episodeOf(activities, next) : null;

  return (
    <div className="space-y-16">
      {/* ——— Greeting banner ——— */}
      <section className="panel fade-up relative overflow-hidden">
        <Scene scene="street" time={timeOfDay()} seed="home" className="absolute inset-y-0 right-0 h-full w-full md:w-[58%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/95 via-cream/90 to-cream/75 md:bg-gradient-to-r md:from-cream md:from-40% md:via-cream/70 md:via-55% md:to-transparent" aria-hidden="true" />
        <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
          <div>
            <p className="eyebrow mb-2">{formatDay(new Date().toISOString())}</p>
            <h1 className="font-manga text-4xl font-normal md:text-5xl">Bonjour {me?.firstName} !</h1>
            <p className="mt-2 max-w-lg font-semibold text-ink-2">
              {data.myGuilds.length
                ? 'Ton histoire continue : tes guildes t’attendent, et de nouvelles quêtes sont apparues près de chez toi.'
                : 'Commence par une quête qui te ressemble. Si l’équipe te plaît, tu pourras la retrouver.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                [data.myGuilds.length, data.myGuilds.length > 1 ? 'guildes' : 'guilde', 'circles'],
                [data.mine.length, data.mine.length > 1 ? 'quêtes prévues' : 'quête prévue', 'calendar'],
                [familiarIds.size, 'compagnons de route', 'users'],
              ].map(([n, label, icon]) => (
                <span key={String(label)} className="sticker bg-white px-3 py-1.5 text-xs normal-case tracking-normal">
                  <Icon name={icon as 'users'} className="size-4 text-sakura-deep" /> <span className="font-manga text-base">{n}</span> {label}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden items-end gap-3 md:flex">
            <span className="bubble mb-16 text-sm">Prêt·e pour un nouvel épisode ?</span>
            <Avatar user={me} size="2xl" className="float" />
          </div>
        </div>
      </section>

      {/* ——— Continuity prompt ——— */}
      {data.pendingFeedback.map((a) => (
        <section key={a.id} className="panel fade-up relative overflow-hidden bg-lav-deep text-white">
          <div className="speedlines absolute inset-[-60%] text-white opacity-[0.06]" aria-hidden="true" />
          <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div>
              <span className="sticker bg-white text-lav-deep">Fin d’épisode · {relativeDay(a.startsAt)}</span>
              <h2 className="mt-3 font-manga text-3xl font-normal">Envie de revoir cette équipe ?</h2>
              <p className="mt-1 text-sm font-bold text-white/70">{a.title}</p>
              <p className="mt-2 max-w-xl text-white/80">Ta réponse reste privée. Si plusieurs personnes disent oui, l’équipe peut devenir une guilde, et l’épisode suivant se prépare.</p>
            </div>
            <div className="flex flex-col items-start gap-4 md:items-end">
              <div className="flex items-end gap-2">
                <AvatarStack users={a.participantIds.filter((p) => p !== ME).map(getUser)} size="md" />
                <span className="bubble mb-8 text-xs text-ink">On se revoit ?</span>
              </div>
              <Link to={`/activites/${a.id}/bilan`} className="btn-ghost px-6 py-3">
                Donner mon avis <Icon name="arrowRight" className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* ——— CONTINUE THE STORY ——— */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <ModeTag mode="retrouver" />
          <span className="h-0.5 flex-1 rounded bg-ink/10" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <SectionHeader title="Ta prochaine quête" />
            {next ? (
              <Link to={`/activites/${next.id}`} className="card hover-lift block overflow-hidden">
                <div className="border-b-2 border-ink">
                  <CoverArt activity={next} className="h-40">
                    {nextEp && <span className="sticker absolute bottom-3 left-3 bg-lav-deep text-white">Épisode {nextEp}</span>}
                  </CoverArt>
                </div>
                <div className="flex gap-3 p-5">
                  <DateTicket iso={next.startsAt} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-sakura-deep">{relativeDay(next.startsAt)} · {formatTime(next.startsAt)}</p>
                    <p className="font-display text-xl font-black leading-snug">{next.title}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-ink-2">{next.venue}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <PartySlots users={next.participantIds.map(getUser)} max={next.maxParticipants} size="xs" />
                    </div>
                    {nextRec && nextRec.familiar.length > 0 && <p className="mt-2 text-xs font-extrabold text-lav-deep">{nextRec.familiar.length} compagnon{nextRec.familiar.length > 1 ? 's' : ''} déjà rencontré{nextRec.familiar.length > 1 ? 's' : ''}</p>}
                  </div>
                </div>
              </Link>
            ) : (
              <EmptyState icon="calendar" title="Aucune quête prévue" text="Rejoins une équipe pour la voir ici." action={<Link to="/activites" className="btn-primary btn-sm">Voir les quêtes</Link>} />
            )}
          </div>

          <div>
            <SectionHeader title="Tes guildes" link="/guildes" linkLabel="Toutes mes guildes" />
            {data.myGuilds.length ? (
              <div className="grid gap-4">
                {data.myGuilds.map(({ c, next: n }) => {
                  const ep = n ? episodeOf(activities, n) : null;
                  return (
                    <Link key={c.id} to={`/guildes/${c.id}`} className="card hover-lift flex items-center gap-4 p-4">
                      <GuildCrest categoryId={c.categoryId} born={c.origin === 'cercle'} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg font-black">{c.name}</p>
                        <p className="truncate text-sm font-semibold text-ink-2">
                          {n ? <>{ep && <span className="font-extrabold text-sakura-deep">Épisode {ep} · </span>}{relativeDay(n.startsAt)}{isJoined(n.id) ? ' · inscrit·e ✓' : ''}</> : 'Prochain épisode à proposer'}
                        </p>
                      </div>
                      <AvatarStack users={communityMembers(c).map(getUser)} max={3} size="sm" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon="circles" title="Pas encore de guilde" text="Après une quête, dis si tu veux revoir l’équipe : c’est comme ça que naissent les guildes." />
            )}
          </div>
        </div>

        {data.familiar.length > 0 && (
          <div className="mt-12">
            <SectionHeader title="Avec des visages familiers" kicker="Des compagnons que tu as déjà rencontrés y vont" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.familiar.map((a) => <ActivityCard key={a.id} activity={a} />)}
            </div>
          </div>
        )}
      </section>

      {/* ——— NEW ADVENTURES ——— */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <ModeTag mode="decouvrir" />
          <span className="h-0.5 flex-1 rounded bg-ink/10" />
        </div>
        <SectionHeader title="Quêtes recommandées" kicker="Selon tes passions, tes créneaux et ton énergie" link="/activites" linkLabel="Toutes les quêtes" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.recommended.map((a) => <ActivityCard key={a.id} activity={a} />)}
        </div>
        <p className="mt-4 flex items-start gap-1.5 text-xs font-semibold text-ink-3">
          <Icon name="info" className="mt-0.5 size-3.5 shrink-0" /> Les recommandations reposent sur des règles simples et transparentes (passions communes, créneau, taille d’équipe, distance, visages familiers). Ce n’est pas un score de compatibilité.
        </p>
      </section>

      <section>
        <SectionHeader title="Par tes passions" link="/activites" />
        <div className="mb-6 flex flex-wrap gap-2">
          {me?.interests.slice(0, 8).map((i) => (
            <button key={i} type="button" className="toggle-pill" aria-pressed={interest === i} onClick={() => setInterest(i)}>{interestLabel(i)}</button>
          ))}
        </div>
        {byInterest.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {byInterest.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        ) : (
          <EmptyState icon="sparkle" title="Toutes trouvées !" text={`Pas d’autre quête « ${interestLabel(interest)} » que celles déjà proposées plus haut. Et si tu en lançais une ?`} action={<Link to="/proposer" className="btn-primary btn-sm">Proposer une quête</Link>} />
        )}
      </section>

      {data.near.length > 0 && (
        <section>
          <SectionHeader title="Tout près du centre" kicker="À moins de 1,5 km de Bellecour" link="/activites" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.near.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        </section>
      )}

      <section className="panel relative overflow-hidden bg-sakura-soft p-6 md:p-8">
        <div className="screentone-lg absolute inset-0 text-sakura opacity-15" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkle className="size-8" />
            <div>
              <p className="font-display text-xl font-black">Tu ne trouves pas ta quête ?</p>
              <p className="text-sm font-semibold text-ink-2">Lance-la toi-même : un lieu public, une date, et l’équipe se forme.</p>
            </div>
          </div>
          <Link to="/proposer" className="btn-primary">Proposer une quête</Link>
        </div>
      </section>
    </div>
  );
}
