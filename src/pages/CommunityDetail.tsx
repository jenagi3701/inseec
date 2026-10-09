import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { Icon } from '../components/Icon';
import { Avatar, EmptyState, Modal, SectionHeader } from '../components/ui';
import { useToast } from '../components/Toast';
import { categoryById, interestLabel } from '../data/taxonomy';
import { formatShortDay } from '../lib/format';
import { ME } from '../store/state';

export default function CommunityDetail() {
  const { id = '' } = useParams();
  const { getCommunity, activities, isPast, isMember, isJoined, getUser, communityMembers, familiarIds, dispatch, state } = useApp();
  const toast = useToast();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const c = getCommunity(id);
  if (!c) return <EmptyState icon="circles" title="Cercle introuvable" text="Ce cercle n’existe pas ou plus." action={<Link to="/cercles" className="btn-primary btn-sm">Mes cercles</Link>} />;

  const cat = categoryById(c.categoryId);
  const member = isMember(c.id);
  const own = activities.filter((a) => a.communityId === c.id);
  const upcoming = own.filter((a) => !isPast(a)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = own.filter((a) => isPast(a)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const attended = past.filter((a) => isJoined(a.id)).length;
  const members = communityMembers(c).filter((m) => !state.blocked.includes(m));
  // Feature: "Same Circle" follow-ups — other activities matching the circle's shared interests
  const ideas = activities.filter((a) => !isPast(a) && a.communityId !== c.id && a.tags.some((t) => c.tags.includes(t))).slice(0, 3);

  return (
    <div>
      <Link to="/cercles" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"><Icon name="arrowLeft" className="size-4" /> Mes cercles</Link>

      <header className="relative overflow-hidden rounded-[2rem] p-6 md:p-10" style={{ background: cat.tint }}>
        <span className="pointer-events-none absolute -right-4 -bottom-12 font-jp text-[12rem] leading-none font-bold opacity-15 select-none" style={{ color: cat.color }} aria-hidden="true">{cat.kanji}</span>
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap gap-2">
            {c.origin === 'cercle' && <span className="chip bg-white/80 text-ai">Né d’une première rencontre</span>}
            <span className="chip bg-white/80" style={{ color: cat.color }}>{cat.label}</span>
            {member && <span className="chip bg-ai text-white">Membre</span>}
          </div>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{c.name}</h1>
          <p className="mt-2 font-display text-xl text-ink-2 italic">{c.tagline}</p>
          <p className="mt-4 text-ink-2">{c.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {member ? (
              <>
                <Link to={`/proposer?cercle=${c.id}`} className="btn-ai"><Icon name="plus" className="size-4" /> Proposer une rencontre</Link>
                <button className="btn-ghost" onClick={() => setConfirmLeave(true)}>Quitter le cercle</button>
              </>
            ) : (
              <button className="btn-ai" onClick={() => { dispatch({ type: 'joinCommunity', communityId: c.id, name: c.name }); toast(`Bienvenue dans « ${c.name} »`); }}>
                <Icon name="circles" className="size-4" /> Rejoindre ce cercle
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs font-semibold text-ink-3">Rythme</p><p className="mt-1 font-semibold">{c.rhythm}</p></div>
        <div className="card p-5"><p className="text-xs font-semibold text-ink-3">Membres</p><p className="mt-1 font-semibold">{members.length} personnes</p></div>
        <div className="card p-5"><p className="text-xs font-semibold text-ink-3">Ton parcours</p><p className="mt-1 font-semibold">{attended ? `${attended} rencontre${attended > 1 ? 's' : ''} ensemble` : 'Pas encore de rencontre'}</p></div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <section>
            <SectionHeader title="Prochaines rencontres" />
            {upcoming.length ? (
              <div className="grid gap-5 sm:grid-cols-2">{upcoming.map((a) => <ActivityCard key={a.id} activity={a} showReason={false} />)}</div>
            ) : (
              <EmptyState icon="calendar" title="Aucune rencontre planifiée" text="Lance la prochaine : propose une date, un lieu public et une activité." action={member ? <Link to={`/proposer?cercle=${c.id}`} className="btn-ai btn-sm">Proposer une rencontre</Link> : undefined} />
            )}
          </section>

          {ideas.length > 0 && (
            <section>
              <SectionHeader title="Idées pour le groupe" kicker={`Selon vos passions communes : ${c.tags.slice(0, 3).map(interestLabel).join(', ')}`} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{ideas.map((a) => <ActivityCard key={a.id} activity={a} compact />)}</div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <SectionHeader title="Rencontres passées" />
              <ol className="relative space-y-4 border-l-2 border-line pl-6">
                {past.map((a) => (
                  <li key={a.id} className="relative">
                    <span className={`absolute top-1.5 -left-[31px] size-3 rounded-full ring-4 ring-paper ${isJoined(a.id) ? 'bg-ai' : 'bg-line'}`} />
                    <Link to={`/activites/${a.id}`} className="font-semibold hover:underline">{a.title}</Link>
                    <p className="text-sm text-ink-3">{formatShortDay(a.startsAt)} · {a.participantIds.length} participant·es{isJoined(a.id) ? ' · tu y étais' : ''}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold">Membres</h2>
            <ul className="mt-4 space-y-3">
              {members.map((m) => {
                const u = getUser(m);
                if (!u) return null;
                return (
                  <li key={m}>
                    <Link to={m === ME ? '/profil' : `/profil/${m}`} className="flex items-center gap-3 rounded-xl p-1 hover:bg-paper">
                      <Avatar user={u} size="sm" />
                      <span className="text-sm font-semibold">{m === ME ? 'Toi' : u.firstName}</span>
                      {m === c.organizerId && <span className="chip bg-paper-2 px-1.5 py-0 text-[10px] text-ink-2">Anime le cercle</span>}
                      {familiarIds.has(m) && <span className="chip bg-ai-soft px-1.5 py-0 text-[10px] text-ai">Déjà rencontré·e</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {!member && <p className="mt-4 text-xs text-ink-3">Rejoindre un cercle ne t’engage à rien : tu choisis à quelles rencontres tu participes.</p>}
          </div>
        </aside>
      </div>

      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Quitter ce cercle ?">
        <p className="text-sm text-ink-2">Tu ne verras plus ses prochaines rencontres en priorité. Les membres ne sont pas notifié·es. Tu pourras revenir quand tu veux.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirmLeave(false)}>Rester</button>
          <button className="btn-primary" onClick={() => { dispatch({ type: 'leaveCommunity', communityId: c.id }); setConfirmLeave(false); toast('Tu as quitté le cercle'); }}>Quitter</button>
        </div>
      </Modal>
    </div>
  );
}
