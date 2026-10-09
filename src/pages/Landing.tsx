import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { DEMO_PERSONA, DEMO_USERS } from '../data/users';
import { DEMO_ACTIVITIES } from '../data/activities';
import { CATEGORIES, ENERGIES, categoryById } from '../data/taxonomy';
import { formatPrice, formatShortDay, formatTime } from '../lib/format';
import { ME } from '../store/state';
import { Icon, type IconName } from '../components/Icon';
import { Avatar, AvatarStack, CoverArt, Logo } from '../components/ui';
import { DemoBanner } from '../components/Layout';
import { t } from '../i18n';

const user = (id: string) => DEMO_USERS.find((u) => u.id === id);

const STEPS: { n: string; title: string; text: string; jp: string }[] = [
  { n: '01', jp: '好', title: 'Partage ce que tu aimes', text: 'Ghibli, jeux coop, japonais débutant, dessin… Ton profil est un graphe de passions, pas une fiche de rencontre.' },
  { n: '02', jp: '遊', title: 'Faites quelque chose ensemble', text: 'Une activité en petit groupe donne un sujet de conversation tout trouvé. Personne n’a à « briller ».' },
  { n: '03', jp: '縁', title: 'Revoyez-vous naturellement', text: 'Après l’activité, chacun dit en privé s’il veut revoir le groupe. Si oui, un cercle se forme et la suite s’organise.' },
];

const PROMISES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'users', title: 'Petits groupes', text: 'La plupart des activités réunissent 4 à 10 personnes.' },
  { icon: 'chat', title: 'Brise-glaces fournis', text: 'Chaque activité propose des questions pour lancer la discussion.' },
  { icon: 'sparkle', title: 'Débutant·es bienvenu·es', text: 'Aucun quiz d’entrée : on peut venir « juste curieux·se ».' },
  { icon: 'lock', title: 'Rien de forcé', text: 'Pas de numéro partagé, connexions uniquement si c’est mutuel.' },
];

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
        <nav className="flex items-center gap-2 text-sm">
          <a href="#comment" className="hidden px-3 py-2 font-medium text-ink-2 hover:text-ink sm:block">Comment ça marche</a>
          <a href="#activites" className="hidden px-3 py-2 font-medium text-ink-2 hover:text-ink sm:block">Activités</a>
          {loggedIn ? (
            <Link to="/accueil" className="btn-ink btn-sm">Mon espace</Link>
          ) : (
            <Link to="/inscription" className="btn-ink btn-sm">Commencer</Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <div className="fade-up">
          <p className="eyebrow mb-5 flex items-center gap-2">
            <span className="inline-block h-px w-8 bg-shu" /> Lyon · culture pop japonaise & loisirs partagés
          </p>
          <h1 className="text-[2.6rem] leading-[1.05] font-semibold sm:text-6xl">
            Trouve ta communauté
            <br />
            <span className="text-shu italic">par ce que tu aimes.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">
            Des activités en petits groupes autour de l’anime, du manga, des jeux et de la culture japonaise. Et quand le courant passe, <strong className="font-semibold text-ink">on se revoit, avec les mêmes personnes.</strong>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={loggedIn ? '/accueil' : '/inscription'} className="btn-primary px-6 py-3 text-base">
              {t('cta.findPeople')} <Icon name="arrowRight" className="size-4" />
            </Link>
            <a href="#activites" className="btn-ghost px-6 py-3 text-base">{t('cta.explore')}</a>
          </div>
          <button onClick={startDemo} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ai hover:underline">
            <Icon name="sparkle" className="size-4" /> Essayer la démo avec le profil de Camille (déjà 3 activités)
          </button>
        </div>

        {/* Hero visual: continuity, not a one-off */}
        <div className="relative mx-auto w-full max-w-md" aria-label="Exemple : un groupe qui se retrouve au fil des rencontres">
          <div className="absolute -top-8 -right-6 font-jp text-[11rem] leading-none font-bold text-shu/10 select-none" aria-hidden="true">絆</div>
          <div className="card relative rotate-[-2deg] p-4 opacity-60">
            <p className="text-xs font-semibold text-ink-3">1re rencontre · Découverte</p>
            <p className="font-display font-semibold">Dimanche Ghibli : Chihiro</p>
          </div>
          <div className="card relative -mt-3 ml-6 rotate-[1.5deg] p-4 opacity-80">
            <p className="text-xs font-semibold text-ink-3">2e rencontre · 5 personnes sur 5 ont dit « on se revoit »</p>
            <p className="font-display font-semibold">Un cercle est né</p>
          </div>
          <div className="card relative -mt-2 overflow-hidden shadow-[0_30px_60px_-30px_rgba(29,27,38,0.45)]">
            <CoverArt category={categoryById('anime')} className="h-28" />
            <div className="p-5">
              <p className="chip mb-2 bg-ai-soft text-ai"><Icon name="repeat" className="size-3.5" /> Les Dimanches Ghibli · 4e rencontre</p>
              <p className="font-display text-xl font-semibold">Princesse Mononoké + thé hojicha</p>
              <div className="mt-4 flex items-center justify-between">
                <AvatarStack users={['u-yuki', 'u-clara', 'u-ines', 'u-amandine', 'u-nathan'].map(user)} size="sm" />
                <span className="text-xs font-semibold text-ai">Les mêmes visages, chaque mois</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning strip */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-px px-4 md:grid-cols-2">
          <div className="py-10 md:pr-10">
            <p className="eyebrow mb-2">Ce que l’on ne fait pas</p>
            <p className="font-display text-2xl text-ink-3 line-through decoration-shu/60">Un dîner avec des inconnus, puis chacun repart de zéro.</p>
          </div>
          <div className="border-t border-line py-10 md:border-t-0 md:border-l md:pl-10">
            <p className="eyebrow mb-2 text-shu">Ce que l’on fait</p>
            <p className="font-display text-2xl">On se rencontre par une passion, on fait quelque chose ensemble, et on laisse l’amitié grandir au fil des rencontres.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="comment" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20">
        <p className="eyebrow mb-2">Comment ça marche</p>
        <h2 className="max-w-2xl text-4xl font-semibold">Une première connexion par les passions. Une amitié par la répétition.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative overflow-hidden rounded-3xl bg-paper-2 p-7">
              <span className="absolute -right-2 -bottom-6 font-jp text-8xl font-bold text-ink/5" aria-hidden="true">{s.jp}</span>
              <p className="font-display text-sm font-semibold text-shu">{s.n}</p>
              <h3 className="mt-3 text-2xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-ink-2">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social energy */}
      <section className="bg-ink py-20 text-paper">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow mb-2 text-paper/50">Ton rythme, pas le nôtre</p>
          <h2 className="max-w-2xl text-4xl font-semibold">Choisis selon tes passions… et ton énergie sociale du moment.</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ENERGIES.map((e, i) => (
              <div key={e.id} className="rounded-2xl border border-paper/15 p-5">
                <div className="mb-4 flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((d) => (
                    <span key={d} className={`h-1.5 flex-1 rounded-full ${d <= [0, 2, 4, 3, 1][i] ? 'bg-shu' : 'bg-paper/15'}`} />
                  ))}
                </div>
                <p className="font-semibold">{e.label}</p>
                <p className="mt-1 text-sm text-paper/60">{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities preview */}
      <section id="activites" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Cette semaine à Lyon · exemples fictifs</p>
            <h2 className="text-4xl font-semibold">Bien plus que l’anime.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span key={c.id} className="chip border border-line bg-white text-ink-2">
                <span className="size-2 rounded-full" style={{ background: c.color }} /> {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((a) => (
            <Link key={a.id} to="/inscription" className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
              <CoverArt activity={a} className="h-28" />
              <div className="p-4">
                <p className="text-xs font-semibold text-shu">{formatShortDay(a.startsAt)} · {formatTime(a.startsAt)}</p>
                <p className="font-display text-lg font-semibold">{a.title}</p>
                <p className="mt-1 text-sm text-ink-2">{a.district} · {formatPrice(a.priceMin, a.priceMax)} · {a.maxParticipants} places max</p>
                {a.recurrence && <p className="mt-3 chip bg-ai-soft text-ai"><Icon name="repeat" className="size-3.5" /> Groupe récurrent</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* For introverts / newcomers */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-10 rounded-[2rem] bg-shu-soft p-8 md:grid-cols-[1fr_1.3fr] md:p-12">
          <div>
            <p className="eyebrow mb-2 text-shu-dark">Pensé pour</p>
            <h2 className="text-3xl font-semibold">Les timides, les nouveaux arrivants, les curieux·ses.</h2>
            <p className="mt-4 text-ink-2">« Je viens d’arriver à Lyon et je ne connais personne. » « Je n’ose pas aller seul·e à une convention. » Kizuna commence par une activité, pas par une conversation forcée.</p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar user={user('u-clara')} size="lg" />
              <p className="text-sm text-ink-2"><span className="font-semibold text-ink">Clara, 27 ans</span> (profil fictif)<br />arrivée de Nantes en septembre</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROMISES.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white p-5">
                <Icon name={p.icon} className="size-6 text-shu" />
                <p className="mt-3 font-semibold">{p.title}</p>
                <p className="mt-1 text-sm text-ink-2">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-matcha-soft text-matcha"><Icon name="shield" className="size-8" /></span>
          <div>
            <h2 className="text-2xl font-semibold">La confiance avant tout.</h2>
            <p className="mt-2 max-w-3xl text-ink-2">Lieux publics uniquement, organisateurs engagés sur une charte, signalement et blocage en deux clics, aucune coordonnée visible par défaut, et des connexions entre membres seulement lorsqu’elles sont mutuelles.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-ink py-20 text-center text-paper">
        <div className="mx-auto max-w-2xl px-4">
          <p className="font-jp text-lg text-paper/50">絆 — le lien qui se tisse</p>
          <h2 className="mt-3 text-4xl font-semibold">Fais des activités ensemble. Revois-toi naturellement.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={loggedIn ? '/accueil' : '/inscription'} className="btn-primary px-6 py-3 text-base">{t('cta.findPeople')}</Link>
            <button onClick={startDemo} className="btn border border-paper/30 px-6 py-3 text-base text-paper hover:bg-paper/10">Voir la démo</button>
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-8 text-xs text-ink-3">
        <span>Kizuna · prototype de démonstration · Lyon, France</span>
        <span>Toutes les personnes, lieux et événements affichés sont fictifs.</span>
      </footer>
    </div>
  );
}
