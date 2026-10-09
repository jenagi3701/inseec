import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { Icon } from '../components/Icon';
import { Avatar, EmptyState, Modal, SectionHeader } from '../components/ui';
import { GuildCrest } from '../components/Guild';
import { Scene } from '../components/art/Scene';
import { useToast } from '../components/Toast';
import { categoryById, interestLabel } from '../data/taxonomy';
import { formatShortDay, formatTime } from '../lib/format';
import { ME } from '../store/state';

export default function CommunityDetail() {
  const { id = '' } = useParams();
  const { getCommunity, activities, isPast, isMember, isJoined, getUser, communityMembers, familiarIds, dispatch, state } = useApp();
  const toast = useToast();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const c = getCommunity(id);
  if (!c) return <EmptyState icon="circles" title="Guilde introuvable" text="Cette guilde n’existe pas ou plus." action={<Link to="/guildes" className="btn-primary btn-sm">Mes guildes</Link>} />;

  const cat = categoryById(c.categoryId);
  const member = isMember(c.id);
  const episodes = activities.filter((a) => a.communityId === c.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = episodes.filter((a) => !isPast(a));
  const attended = episodes.filter((a) => isPast(a) && isJoined(a.id)).length;
  const members = communityMembers(c).filter((m) => !state.blocked.includes(m));
  // "Same team" follow-ups: other quests matching the guild's shared interests
  const ideas = activities.filter((a) => !isPast(a) && a.communityId !== c.id && a.tags.some((t) => c.tags.includes(t))).slice(0, 3);
  const nextIdx = episodes.findIndex((a) => !isPast(a));

  return (
    <div>
      <Link to="/guildes" className="mb-5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-bold text-ink-2 hover:bg-surface hover:text-ink"><Icon name="arrowLeft" className="size-4" /> Mes guildes</Link>

      {/* ——— Guild banner ——— */}
      <header className="panel relative overflow-hidden">
        <Scene scene={cat.scene} time="crepuscule" seed={c.id} className="absolute inset-y-0 right-0 h-full w-full md:w-[58%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/95 via-cream/90 to-cream/75 md:bg-gradient-to-r md:from-cream md:from-45% md:via-cream/85 md:via-62% md:to-cream/10" aria-hidden="true" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-10">
          <GuildCrest categoryId={c.categoryId} born={c.origin === 'cercle'} className="size-24 md:size-32" />
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2">
              {c.origin === 'cercle' && <span className="sticker bg-surface text-lav-deep">Née d’une première rencontre</span>}
              <span className="sticker scope-day bg-surface" style={{ color: cat.ink }}>{cat.label}</span>
              {member && <span className="sticker bg-lavender text-on-accent">Membre</span>}
            </div>
            <h1 className="mt-3 font-manga text-4xl leading-tight font-bold md:text-5xl">{c.name}</h1>
            <p className="mt-1 font-display text-xl font-bold text-ink-2">{c.tagline}</p>
            <p className="mt-3 font-semibold text-ink-2">{c.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {member ? (
                <>
                  <Link to={`/proposer?cercle=${c.id}`} className="btn-lav"><Icon name="plus" className="size-4" /> Proposer un épisode</Link>
                  <button className="btn-ghost" onClick={() => setConfirmLeave(true)}>Quitter la guilde</button>
                </>
              ) : (
                <button className="btn-lav" onClick={() => { dispatch({ type: 'joinCommunity', communityId: c.id, name: c.name }); toast(`Bienvenue dans la guilde « ${c.name} »`); }}>
                  <Icon name="circles" className="size-4" /> Rejoindre cette guilde
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Rythme', c.rhythm, 'repeat'],
          ['Membres', `${members.length} personnes`, 'users'],
          ['Ton parcours', attended ? `${attended} épisode${attended > 1 ? 's' : ''} vécu${attended > 1 ? 's' : ''} ensemble` : 'Pas encore d’épisode vécu', 'heart'],
        ].map(([k, v, icon]) => (
          <div key={k} className="card flex items-center gap-3 p-4">
            <span className="inline-flex size-10 items-center justify-center rounded-xl border border-edge bg-lav-soft text-lav-deep"><Icon name={icon as 'users'} className="size-5" /></span>
            <div><p className="text-[11px] font-bold tracking-wider text-ink-3 uppercase">{k}</p><p className="font-bold">{v}</p></div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-12">
          {/* ——— Story timeline ——— */}
          <section>
            <SectionHeader title="L’histoire de la guilde" kicker="Saison 1" jp="物語" />
            {episodes.length ? (
              <ol className="relative space-y-3 pl-2">
                <span className="absolute top-4 bottom-4 left-[29px] w-0.5 bg-ink/15" aria-hidden="true" />
                {episodes.map((a, i) => {
                  const done = isPast(a);
                  const isNext = i === nextIdx;
                  const mine = isJoined(a.id);
                  return (
                    <li key={a.id} className="relative flex items-center gap-4">
                      <span className={`relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-edge font-manga text-sm ${isNext ? 'bg-sakura text-on-accent' : done ? 'bg-lav-soft text-lav-deep' : 'bg-surface'}`} style={{ boxShadow: 'var(--shadow-sm)' }}>
                        {i + 1}
                      </span>
                      <Link to={`/activites/${a.id}`} className={`card flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 px-4 py-3 ${done ? 'bg-cream' : ''}`}>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold tracking-wider uppercase text-ink-3">Épisode {i + 1} · {formatShortDay(a.startsAt)} · {formatTime(a.startsAt)}</p>
                          <p className="truncate font-display font-bold">{a.title}</p>
                        </div>
                        <span className={`sticker ${done ? (mine ? 'bg-lav-soft text-lav-deep' : 'bg-cream-2 text-ink-3') : mine ? 'bg-matcha-soft text-matcha' : isNext ? 'bg-sakura-soft text-sakura-deep' : 'bg-surface text-ink-3'}`}>
                          {done ? (mine ? 'Vécu ensemble' : 'Passé') : mine ? 'Inscrit·e' : isNext ? 'Prochain épisode' : 'À venir'}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {member && (
                  <li className="relative flex items-center gap-4">
                    <span className="relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-ink-3 bg-surface text-ink-3"><Icon name="plus" className="size-5" /></span>
                    <Link to={`/proposer?cercle=${c.id}`} className="font-bold text-lav-deep hover:underline">Écrire l’épisode suivant…</Link>
                  </li>
                )}
              </ol>
            ) : (
              <EmptyState icon="calendar" title="L’histoire commence ici" text="Aucun épisode encore. Propose une date, un lieu public et une activité." action={member ? <Link to={`/proposer?cercle=${c.id}`} className="btn-lav btn-sm">Proposer un épisode</Link> : undefined} />
            )}
          </section>

          {upcoming.length > 0 && (
            <section>
              <SectionHeader title="Prochains épisodes" />
              <div className="grid gap-6 sm:grid-cols-2">{upcoming.map((a) => <ActivityCard key={a.id} activity={a} showReason={false} />)}</div>
            </section>
          )}

          {ideas.length > 0 && (
            <section>
              <SectionHeader title="Idées de quêtes pour la guilde" kicker={`Selon vos passions communes : ${c.tags.slice(0, 3).map(interestLabel).join(', ')}`} />
              <div className="grid gap-6 sm:grid-cols-2">{ideas.map((a) => <ActivityCard key={a.id} activity={a} compact />)}</div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg">Membres de la guilde</h2>
            <ul className="mt-4 space-y-2">
              {members.map((m) => {
                const u = getUser(m);
                if (!u) return null;
                return (
                  <li key={m}>
                    <Link to={m === ME ? '/profil' : `/profil/${m}`} className="flex items-center gap-3 rounded-2xl border-2 border-transparent p-1.5 hover:border-ink-3 hover:bg-cream">
                      <Avatar user={u} size="md" />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-1 text-sm font-bold">
                          {m === ME ? 'Toi' : u.firstName}
                          {m === c.organizerId && <span className="chip bg-peach px-1.5 py-0 text-[10px] text-peach-deep">Maître de guilde</span>}
                          {familiarIds.has(m) && <span className="chip bg-lav-soft px-1.5 py-0 text-[10px] text-lav-deep">Déjà rencontré·e</span>}
                        </p>
                        {u.title && <p className="truncate text-xs font-semibold text-ink-3">{u.title}</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {!member && <p className="mt-4 text-xs font-semibold text-ink-3">Rejoindre une guilde ne t’engage à rien : tu choisis à quels épisodes tu participes.</p>}
          </div>
        </aside>
      </div>

      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Quitter cette guilde ?">
        <p className="text-sm font-semibold text-ink-2">Tu ne verras plus ses prochains épisodes en priorité. Les membres ne sont pas notifié·es. Tu pourras revenir quand tu veux.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirmLeave(false)}>Rester</button>
          <button className="btn-primary" onClick={() => { dispatch({ type: 'leaveCommunity', communityId: c.id }); setConfirmLeave(false); toast('Tu as quitté la guilde'); }}>Quitter</button>
        </div>
      </Modal>
    </div>
  );
}
