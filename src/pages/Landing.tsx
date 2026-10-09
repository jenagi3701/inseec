import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { DEMO_PERSONA, DEMO_USERS } from '../data/users';
import { DEMO_ACTIVITIES } from '../data/activities';
import { CATEGORIES, ENERGIES } from '../data/taxonomy';
import { formatPrice, formatTime } from '../lib/format';
import { ME } from '../store/state';
import type { Profile } from '../data/types';
import { Icon, type IconName } from '../components/Icon';
import { Avatar, AvatarStack, CoverArt, Logo, PartySlots, Stamp } from '../components/ui';
import { GuildCrest } from '../components/Guild';
import { Scene } from '../components/art/Scene';
import { CharacterCard, InterestBadge } from '../components/CharacterCard';
import { DateTicket } from '../components/ActivityCard';
import { DemoBanner } from '../components/Layout';
import { t } from '../i18n';

const user = (id: string) => DEMO_USERS.find((u) => u.id === id) as Profile;

const PROMISES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'users', title: 'Petites équipes', text: 'De 4 à 10 personnes : tout le monde a sa place autour de la table.' },
  { icon: 'chat', title: 'Brise-glaces fournis', text: 'Chaque quête propose des questions pour lancer la discussion.' },
  { icon: 'sparkle', title: 'Débutant·es bienvenu·es', text: 'Pas de quiz d’entrée : on peut venir « juste curieux·se ».' },
  { icon: 'lock', title: 'Rien de forcé', text: 'Aucun numéro partagé. Les connexions ne sont visibles que si elles sont mutuelles.' },
];

/** Hero: a rainy Tokyo-style street with two real interface cards on top. */
function HeroVisual() {
  const guild = ['u-yuki', 'u-clara', 'u-ines', 'u-amandine', 'u-nathan'].map(user);
  const quest = DEMO_ACTIVITIES.find((a) => a.id === 'a-coop')!;
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-label="Aperçu de l’application : une guilde et une nouvelle quête">
      <div className="panel relative h-[23rem] overflow-hidden sm:h-[26rem]">
        <Scene scene="street" time="soir" seed="hero" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-transparent to-transparent" aria-hidden="true" />
      </div>
      {/* Guild card */}
      <div className="paper absolute bottom-5 left-4 w-[min(20rem,calc(100%-2rem))] p-4 sm:-left-6">
        <div className="flex items-center gap-3">
          <GuildCrest categoryId="anime" className="size-10" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.12em] text-ink-3 uppercase">Ta guilde · épisode 4</p>
            <p className="truncate font-manga text-lg font-bold">Les Dimanches Ghibli</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-2">Dimanche · 15 h · Salon de thé Kissa, Croix-Rousse</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AvatarStack users={guild} size="xs" />
            <span className="text-xs text-ink-3">5 membres</span>
          </div>
          <span className="chip bg-matcha-soft text-matcha"><Icon name="check" className="size-3.5" /> Inscrit·e</span>
        </div>
      </div>
      {/* Quest card */}
      <div className="paper absolute top-5 right-4 hidden w-60 p-3 sm:block sm:-right-6">
        <div className="flex items-center gap-3">
          <DateTicket iso={quest.startsAt} />
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.12em] text-ink-3 uppercase">Nouvelle quête</p>
            <p className="truncate text-sm font-bold">Soirée coop : Hanabi & co</p>
            <p className="text-xs text-ink-3">Guillotière · 6 places</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const preview = DEMO_ACTIVITIES.filter((a) => ['a-ghibli-mononoke', 'a-coop', 'a-nihongo', 'a-croquis', 'a-fgc', 'a-ramen'].includes(a.id));
  const loggedIn = state.account && state.onboarded;

  const startDemo = () => {
    dispatch({ type: 'startDemo', profile: { ...DEMO_PERSONA, id: ME } });
    navigate('/accueil');
  };

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <DemoBanner />
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-bold">
          <a href="#comment" className="hidden rounded-full px-3 py-2 text-ink-2 hover:bg-surface hover:text-ink sm:block">Comment ça marche</a>
          <a href="#quetes" className="hidden rounded-full px-3 py-2 text-ink-2 hover:bg-surface hover:text-ink sm:block">Quêtes</a>
          <a href="#personnages" className="hidden rounded-full px-3 py-2 text-ink-2 hover:bg-surface hover:text-ink md:block">Personnages</a>
          {loggedIn ? <Link to="/accueil" className="btn-ink btn-sm ml-2">Mon espace</Link> : <Link to="/inscription" className="btn-ink btn-sm ml-2">Commencer</Link>}
        </nav>
      </header>

      {/* ——— Hero ——— */}
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-6 pb-16 md:grid-cols-[1.05fr_1fr] md:pt-12">
          <div className="">
            <p className="eyebrow">Lyon · Villeurbanne</p>
            <h1 className="mt-4 font-manga text-[2.5rem] leading-[1.15] font-bold sm:text-[3.4rem]">
              Trouve ta guilde.
              <br />
              <span className="text-sakura-deep">Vis des quêtes à plusieurs.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              Kizuna te fait rencontrer des gens à Lyon autour de l’anime, du manga, des jeux et de la culture japonaise : <strong className="text-ink">en petites équipes d’abord, puis en guildes qui se retrouvent, épisode après épisode.</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={loggedIn ? '/accueil' : '/inscription'} className="btn-primary px-6 py-3 text-base">
                {t('cta.findPeople')} <Icon name="arrowRight" className="size-4" />
              </Link>
              <a href="#quetes" className="btn-ghost px-6 py-3 text-base">{t('cta.explore')}</a>
            </div>
            <button onClick={startDemo} className="mt-5 inline-flex items-center gap-2 rounded-full px-1 text-left text-sm font-bold text-lav-deep hover:underline">
              Essayer la démo avec Camille, déjà membre de 2 guildes <Icon name="arrowRight" className="size-4" />
            </button>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* ——— One-shot vs series ——— */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="panel relative overflow-hidden bg-cream-2 p-7">
            <span className="sticker bg-surface text-ink-3">One-shot</span>
            <p className="mt-4 font-display text-2xl font-bold text-ink-3 line-through decoration-sakura decoration-[3px]">Un soir avec des inconnus, puis chacun repart de zéro.</p>
            <p className="mt-2 text-sm font-semibold text-ink-3">Le format des dîners entre inconnus et des grands événements.</p>
          </div>
          <div className="panel relative overflow-hidden bg-lav-soft p-7">
            <span className="sticker relative bg-surface text-lav-deep">Une série</span>
            <p className="relative mt-4 font-display text-2xl font-bold">Une passion pour se rencontrer, une activité pour se lancer, une guilde pour se retrouver.</p>
            <div className="relative mt-4 flex flex-wrap items-center gap-3">
              {[1, 2, 3, 4].map((ep) => (
                <span key={ep} className={`inline-flex size-9 items-center justify-center rounded-xl border border-edge font-manga text-sm ${ep === 4 ? 'bg-sakura text-on-accent' : 'bg-surface'}`}>{ep}</span>
              ))}
              <span className="text-sm font-bold text-lav-deep">épisodes avec les mêmes visages</span>
            </div>
          </div>
        </div>
      </section>

      {/* ——— How it works ——— */}
      <section id="comment" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20">
        <p className="eyebrow mb-2">Comment ça marche</p>
        <h2 className="max-w-3xl font-manga text-4xl leading-tight font-bold">Ton aventure sociale, en trois épisodes.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="panel overflow-hidden">
            <div className="relative flex h-48 items-center justify-center border-b border-edge bg-sakura-soft">
              <Avatar user={{ ...DEMO_PERSONA, id: 'persona' }} size="2xl" className="relative" />
              <div className="absolute top-5 left-3"><InterestBadge id="ghibli" /></div>
              <div className="absolute top-9 right-3"><InterestBadge id="jeux-societe" /></div>
              <div className="absolute bottom-5 left-4"><InterestBadge id="dessin" /></div>
              <div className="absolute right-3 bottom-7"><InterestBadge id="langue-japonaise" /></div>
            </div>
            <div className="p-6">
              <p className="font-manga text-sm text-sakura-deep">Épisode 1</p>
              <h3 className="mt-1 text-xl">Crée ton personnage</h3>
              <p className="mt-2 text-sm font-semibold text-ink-2">Ton avatar, tes passions (genres, univers, loisirs, culture japonaise), ton ambiance préférée. Pas de photo, pas de fiche de drague.</p>
            </div>
          </div>
          <div className="panel overflow-hidden">
            <div className="relative h-48 border-b border-edge">
              <Scene scene="game-table" time="jour" className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-x-0 bottom-3 flex justify-center">
                <span className="rounded-full border border-edge bg-surface px-3 py-1.5" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <PartySlots users={['u-hugo', 'u-nathan', 'u-lucas'].map(user)} max={6} size="xs" />
                </span>
              </div>
            </div>
            <div className="p-6">
              <p className="font-manga text-sm text-sakura-deep">Épisode 2</p>
              <h3 className="mt-1 text-xl">Rejoins une équipe</h3>
              <p className="mt-2 text-sm font-semibold text-ink-2">Une quête en petit groupe : jeux coop, ramen, croquis, karaoké… L’activité lance la conversation, personne n’a à « briller ».</p>
            </div>
          </div>
          <div className="panel overflow-hidden">
            <div className="relative flex h-48 items-center justify-center border-b border-edge bg-lav-soft">
              <div className="relative size-40">
                {['u-yuki', 'u-clara', 'u-ines', 'u-amandine', 'u-nathan'].map((id, i) => {
                  const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                  return <div key={id} className="absolute" style={{ left: `${50 + Math.cos(a) * 38}%`, top: `${50 + Math.sin(a) * 38}%`, transform: 'translate(-50%,-50%)' }}><Avatar user={user(id)} size="lg" /></div>;
                })}
                <Stamp kanji="絆" color="#B9A7CC" className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-2xl" />
              </div>
            </div>
            <div className="p-6">
              <p className="font-manga text-sm text-sakura-deep">Épisode 3</p>
              <h3 className="mt-1 text-xl">Fonde ta guilde</h3>
              <p className="mt-2 text-sm font-semibold text-ink-2">Après la quête, chacun dit en privé s’il veut revoir l’équipe. Si l’envie est partagée, une guilde naît et l’épisode suivant se prépare.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Social energy ——— */}
      <section className="relative overflow-hidden border-y border-edge bg-night py-20 text-on-night">
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="eyebrow mb-2 text-on-night/50">Ton rythme, pas le nôtre</p>
          <h2 className="max-w-2xl font-manga text-4xl leading-tight font-bold">Choisis ta quête selon tes passions… et ton énergie du jour.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ENERGIES.map((e, i) => (
              <div key={e.id} className="rounded-2xl border border-edge bg-plum/60 p-5">
                <p className="font-display font-bold">{e.label}</p>
                <p className="mt-1 text-sm text-on-night/70">{e.description}</p>
                <p className="mt-4 text-[11px] font-bold tracking-[0.12em] text-on-night/60 uppercase">Intensité sociale</p>
                <div className="mt-1.5 flex gap-1" aria-label={`Intensité ${[1, 3, 5, 4, 2][i]} sur 5`}>
                  {[0, 1, 2, 3, 4].map((d) => <span key={d} className={`h-1 flex-1 rounded-full ${d <= [0, 2, 4, 3, 1][i] ? 'bg-sakura' : 'bg-on-night/15'}`} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Quest board ——— */}
      <section id="quetes" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Tableau des quêtes · exemples fictifs à Lyon</p>
            <h2 className="font-manga text-4xl font-bold">Bien plus que regarder des anime.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span key={c.id} className="chip border border-edge bg-surface text-ink-2">
                <span className="size-2.5 rounded-full border border-edge" style={{ background: c.color }} /> {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((a) => (
            <Link key={a.id} to="/inscription" className="paper overflow-hidden">
              <div className="border-b border-edge"><CoverArt activity={a} className="h-36" /></div>
              <div className="flex gap-3 p-4">
                <DateTicket iso={a.startsAt} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-sakura-deep">{formatTime(a.startsAt)} · {a.district}</p>
                  <p className="font-display font-bold leading-snug">{a.title}</p>
                  <p className="mt-1 text-xs font-semibold text-ink-3">{formatPrice(a.priceMin, a.priceMax)} · équipe de {a.maxParticipants} max</p>
                  {a.recurrence && <p className="chip mt-2 bg-lav-soft text-lav-deep"><Icon name="repeat" className="size-3.5" /> Guilde récurrente</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ——— Characters ——— */}
      <section id="personnages" className="scroll-mt-8 border-y border-edge bg-sakura-soft py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow mb-2 text-sakura-deep">Pensé pour les timides & les nouveaux arrivants</p>
            <h2 className="font-manga text-4xl leading-tight font-bold">Des personnages, pas des profils.</h2>
            <p className="mt-4 font-semibold text-ink-2">« Je viens d’arriver à Lyon et je ne connais personne. » « Je n’ose pas aller seul·e à une convention. » Sur Kizuna, on se présente par ce qu’on aime, et l’activité fait le reste.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {PROMISES.map((p) => (
                <div key={p.title} className="rounded-2xl border border-edge bg-surface p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <Icon name={p.icon} className="size-6 text-sakura-deep" />
                  <p className="mt-2 font-display font-bold">{p.title}</p>
                  <p className="mt-1 text-sm text-ink-2">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative grid gap-5 sm:grid-cols-3">
            {(['u-clara', 'u-yuki', 'u-nathan'] as const).map((id, i) => (
              <div key={id} className={i === 1 ? 'sm:mt-10' : ''}>
                <CharacterCard user={user(id)} maxBadges={4} footer={<p className="border-l-2 border-sakura pl-3 text-xs italic text-ink-2">{['Je cherche des gens pour les films Ghibli !', 'Venez pratiquer le japonais, même un peu 🙂', 'Jeux coop > jeux compétitifs.'][i]}</p>} />
              </div>
            ))}
            <p className="text-xs font-semibold text-ink-3 sm:col-span-3">Personnages fictifs de démonstration · avatars générés à partir d’illustrations originales.</p>
          </div>
        </div>
      </section>

      {/* ——— Safety ——— */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="panel grid items-center gap-6 bg-matcha-soft p-7 md:grid-cols-[auto_1fr]">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl border border-edge bg-surface text-matcha" style={{ boxShadow: 'var(--shadow-sm)' }}><Icon name="shield" className="size-8" /></span>
          <div>
            <h2 className="text-2xl">La confiance avant tout.</h2>
            <p className="mt-2 max-w-3xl font-semibold text-ink-2">Lieux publics uniquement, organisateur·rices engagé·es sur une charte, signalement et blocage en deux clics, aucune coordonnée visible par défaut. Les connexions entre membres ne sont possibles que si elles sont mutuelles.</p>
          </div>
        </div>
      </section>

      {/* ——— Final CTA ——— */}
      <section className="px-4 pb-20">
        <div className="panel dusk relative mx-auto max-w-5xl overflow-hidden px-6 py-16 text-center">
          <div className="relative">
            <div className="mb-6 flex justify-center -space-x-3">
              {['u-julie', 'u-mehdi', 'u-aiko', 'u-tom', 'u-zoe'].map((id) => <Avatar key={id} user={user(id)} size="lg" />)}
            </div>
            <p className="font-jp text-lg font-bold text-ink-3">絆 — le lien qui se tisse</p>
            <h2 className="mx-auto mt-3 max-w-2xl font-manga text-4xl leading-tight font-bold">Ta prochaine équipe t’attend quelque part à Lyon.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to={loggedIn ? '/accueil' : '/inscription'} className="btn-primary px-6 py-3 text-base">{t('cta.findPeople')}</Link>
              <button onClick={startDemo} className="btn-ghost px-6 py-3 text-base">Voir la démo</button>
            </div>
          </div>
        </div>
      </section>
      <footer className="mx-auto max-w-6xl space-y-2 border-t border-line px-4 py-8 text-xs font-semibold text-ink-3">
        <div className="flex flex-wrap justify-between gap-4">
          <span>Kizuna · prototype de démonstration · Lyon, France</span>
          <span>Personnes, lieux et événements fictifs · illustrations et avatars originaux.</span>
        </div>
        <p>Les titres d’œuvres cités servent uniquement de centres d’intérêt saisis par les membres et appartiennent à leurs ayants droit. Kizuna n’est affilié à aucun studio, éditeur ou franchise.</p>
      </footer>
    </div>
  );
}
