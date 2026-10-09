import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { EmptyState, SectionHeader, Stamp } from '../components/ui';
import { GuildCard } from '../components/Guild';
import { Scene } from '../components/art/Scene';

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
      <header className="panel relative overflow-hidden">
        <Scene scene="manga-cafe" time="soir" seed="guilds" className="absolute inset-y-0 right-0 h-full w-full md:w-[58%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/95 via-cream/90 to-cream/75 md:bg-gradient-to-r md:from-cream md:from-45% md:via-cream/85 md:via-62% md:to-cream/10" aria-hidden="true" />
        <div className="relative p-6 md:p-8">
          <span className="sticker bg-surface text-lav-deep">Continuité</span>
          <h1 className="mt-3 font-manga text-4xl font-bold md:text-5xl">Mes guildes</h1>
          <p className="mt-2 max-w-xl font-semibold text-ink-2">Une guilde, ce sont les mêmes visages qui se retrouvent régulièrement autour d’une passion. C’est ici que les rencontres deviennent des habitudes, et parfois des amitiés.</p>
        </div>
      </header>

      <section>
        {mine.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {mine.map((c) => <GuildCard key={c.id} c={c} />)}
          </div>
        ) : (
          <EmptyState icon="circles" title="Tu n’as pas encore de guilde" text="Participe à une quête, puis dis si tu veux revoir l’équipe. Ou rejoins directement une guilde ci-dessous." action={<Link to="/activites" className="btn-primary btn-sm">Trouver une quête</Link>} />
        )}
      </section>

      <section className="panel grid gap-6 bg-lav-soft p-6 md:grid-cols-3 md:p-8">
        {[
          ['遊', 'Une quête', 'Tu participes à une activité découverte avec une petite équipe.'],
          ['心', 'Un bilan privé', 'Chacun indique en privé s’il veut revoir l’équipe.'],
          ['絆', 'Une guilde', 'Si l’envie est partagée, une guilde naît et propose l’épisode suivant.'],
        ].map(([k, title, text], i) => (
          <div key={k} className="flex gap-4">
            <Stamp kanji={k} color={['#E99BB5', '#86A9B8', '#B9A7CC'][i]} className="size-12 text-2xl" />
            <div>
              <p className="font-manga text-sm text-lav-deep">Étape {i + 1}</p>
              <p className="font-display text-lg font-bold">{title}</p>
              <p className="text-sm font-semibold text-ink-2">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {others.length > 0 && (
        <section>
          <SectionHeader title="Guildes ouvertes aux nouveaux" kicker="Triées selon tes passions" />
          <div className="grid gap-6 md:grid-cols-2">
            {others.map((c) => <GuildCard key={c.id} c={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
