import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import type { Community } from '../data/types';
import { Icon } from '../components/Icon';
import { AvatarStack, EmptyState, SectionHeader } from '../components/ui';
import { useToast } from '../components/Toast';
import { categoryById, interestLabel } from '../data/taxonomy';
import { formatTime, relativeDay } from '../lib/format';

export function CommunityCard({ c }: { c: Community }) {
  const { activities, isPast, isMember, isJoined, getUser, communityMembers, familiarIds, dispatch, me } = useApp();
  const toast = useToast();
  const cat = categoryById(c.categoryId);
  const next = activities.filter((a) => a.communityId === c.id && !isPast(a)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const members = communityMembers(c);
  const known = members.filter((m) => familiarIds.has(m)).length;
  const member = isMember(c.id);
  const shared = c.tags.filter((t) => me?.interests.includes(t));
  return (
    <article className="card relative flex flex-col overflow-hidden transition hover:shadow-lg">
      <Link to={`/cercles/${c.id}`} className="absolute inset-0" aria-label={`Voir le cercle ${c.name}`} />
      <div className="flex items-start gap-4 p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl font-jp text-2xl font-bold text-white" style={{ background: cat.color }}>{cat.kanji}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {c.origin === 'cercle' && <span className="chip bg-ai-soft text-ai">Né d’une rencontre</span>}
            <span className="chip bg-paper-2 text-ink-2">{cat.short}</span>
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold">{c.name}</h3>
          <p className="text-sm text-ink-2">{c.tagline}</p>
        </div>
      </div>
      <div className="mt-auto space-y-3 border-t border-line bg-paper/60 p-5">
        <p className="flex items-center gap-2 text-sm text-ink-2"><Icon name="repeat" className="size-4" /> {c.rhythm}</p>
        <p className="flex items-center gap-2 text-sm">
          <Icon name="calendar" className="size-4 text-ink-2" />
          {next ? (
            <span>Prochaine rencontre : <strong>{relativeDay(next.startsAt)} · {formatTime(next.startsAt)}</strong>{isJoined(next.id) && <span className="text-matcha"> · inscrit·e ✓</span>}</span>
          ) : (
            <span className="text-ink-3">Prochaine rencontre à proposer</span>
          )}
        </p>
        {!member && shared.length > 0 && <p className="text-xs text-ink-3">En commun : {shared.map(interestLabel).join(', ')}</p>}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AvatarStack users={members.map(getUser)} max={4} size="xs" />
            <span className="text-xs text-ink-2">{members.length} membres{known ? ` · ${known} que tu connais` : ''}</span>
          </div>
          {!member && (
            <button className="btn-ai btn-sm relative z-10" onClick={() => { dispatch({ type: 'joinCommunity', communityId: c.id, name: c.name }); toast(`Bienvenue dans « ${c.name} »`); }}>
              Rejoindre
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Communities() {
  const { communities, isMember, me } = useApp();
  const mine = communities.filter((c) => isMember(c.id));
  const others = communities
    .filter((c) => !isMember(c.id))
    .map((c) => ({ c, n: c.tags.filter((t) => me?.interests.includes(t)).length }))
    .sort((a, b) => b.n - a.n)
    .map((x) => x.c);

  return (
    <div className="space-y-14">
      <div>
        <p className="eyebrow mb-2">Continuité</p>
        <h1 className="text-4xl font-semibold">Mes cercles</h1>
        <p className="mt-2 max-w-2xl text-ink-2">Un cercle, ce sont les mêmes visages qui se retrouvent régulièrement autour d’une passion commune. C’est ici que les rencontres deviennent des habitudes — et parfois des amitiés.</p>
      </div>

      <section>
        {mine.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {mine.map((c) => <CommunityCard key={c.id} c={c} />)}
          </div>
        ) : (
          <EmptyState icon="circles" title="Tu n’as pas encore de cercle" text="Participe à une activité, puis dis si tu veux revoir le groupe. Ou rejoins directement un cercle ci-dessous." action={<Link to="/activites" className="btn-primary btn-sm">Trouver une activité</Link>} />
        )}
      </section>

      <section className="grid gap-4 rounded-3xl bg-paper-2 p-6 md:grid-cols-3 md:p-8">
        {[
          ['1', 'Une activité', 'Tu participes à une activité découverte avec un petit groupe.'],
          ['2', 'Un bilan privé', 'Chacun indique en privé s’il veut revoir le groupe.'],
          ['3', 'Un cercle', 'Si l’envie est partagée, un cercle se forme et propose la suite.'],
        ].map(([n, title, text]) => (
          <div key={n}>
            <p className="font-display text-3xl font-semibold text-ai">{n}</p>
            <p className="mt-1 font-semibold">{title}</p>
            <p className="text-sm text-ink-2">{text}</p>
          </div>
        ))}
      </section>

      {others.length > 0 && (
        <section>
          <SectionHeader title="Cercles ouverts aux nouveaux" kicker="Triés selon tes passions" />
          <div className="grid gap-5 md:grid-cols-2">
            {others.map((c) => <CommunityCard key={c.id} c={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
