import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { DEMO_PERSONA, DEMO_USERS } from '../data/users';
import { DEMO_ACTIVITIES } from '../data/activities';
import { CATEGORIES, ENERGIES } from '../data/taxonomy';
import { formatPrice, formatTime } from '../lib/format';
import { ME } from '../store/state';
import type { Profile } from '../data/types';
import { Icon, type IconName } from '../components/Icon';
import { Avatar, CoverArt, Logo, PartySlots, Sparkle, Stamp, avatarOf } from '../components/ui';
import { Scene } from '../components/art/Scene';
import { AnimeAvatar } from '../components/art/AnimeAvatar';
import { CharacterCard, InterestBadge } from '../components/CharacterCard';
import { DateTicket } from '../components/ActivityCard';
import { DemoBanner } from '../components/Layout';
import { t } from '../i18n';

const user = (id: string) => DEMO_USERS.find((u) => u.id === id) as Profile;

const RIBBON = ['Studio Ghibli', 'Jeux coop', 'Nihongo', 'Cosplay', 'Karaoké anime', 'Ramen', 'Club manga', 'Fighting games', 'Origami', 'Cozy games', 'Shōnen', 'Calligraphie', 'Escape room', 'Ciné-club'];

const PROMISES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'users', title: 'Petites équipes', text: 'De 4 à 10 personnes : tout le monde a sa place autour de la table.' },
  { icon: 'chat', title: 'Brise-glaces fournis', text: 'Chaque quête propose des questions pour lancer la discussion.' },
  { icon: 'sparkle', title: 'Débutant·es bienvenu·es', text: 'Pas de quiz d’entrée : on peut venir « juste curieux·se ».' },
  { icon: 'lock', title: 'Rien de forcé', text: 'Aucun numéro partagé. Les connexions ne sont visibles que si elles sont mutuelles.' },
];

/** Hero composition: three manga panels telling the product story. */
function HeroPanels() {
  const party = ['u-yuki', 'u-clara', 'u-nathan', 'u-ines'].map(user);
  return (
    <div className="relative mx-auto grid w-full max-w-xl grid-cols-5 gap-3" aria-label="Illustration : une équipe se retrouve pour un nouvel épisode">
      <div className="panel relative col-span-5 h-72 overflow-hidden sm:h-80">
        <Scene scene="street" time="crepuscule" className="absolute inset-0 h-full w-full" />
        <span className="sticker absolute top-3 left-3 bg-lav-soft text-lav-deep"><Icon name="repeat" className="size-3.5" /> Épisode 4 · Les Dimanches Ghibli</span>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-1 sm:gap-2">
          {party.map((u, i) => (
            <div key={u.id} className={`float ${i === 3 ? 'hidden sm:block' : ''}`} style={{ animationDelay: `${i * 0.6}s` }}>
              <AnimeAvatar config={avatarOf(u)} size={i === 1 ? 104 : 86} square className="block h-auto w-[78px] rounded-t-[22px] border-2 border-b-0 border-edge sm:w-auto" />
            </div>
          ))}
        </div>
        <span className="bubble pop absolute top-14 left-4 max-w-[60%] text-xs sm:left-5 sm:text-[13px]" style={{ animationDelay: '.3s' }}>On se revoit dimanche ?</span>
        <span className="bubble bubble-right pop absolute top-28 right-4 max-w-[60%] text-xs sm:top-24 sm:right-5 sm:text-[13px]" style={{ animationDelay: '.7s' }}>Grave ! J’apporte le thé 🍵</span>
      </div>
      <div className="panel col-span-3 overflow-hidden">
        <div className="relative h-20 border-b border-edge">
          <Scene scene="game-table" time="soir" className="absolute inset-0 h-full w-full" />
        </div>
        <div className="flex items-center gap-2 p-3">
          <DateTicket iso={DEMO_ACTIVITIES[2].startsAt} />
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-wider text-sakura-deep uppercase">Nouvelle quête</p>
            <p className="truncate font-display text-sm font-black">Soirée coop : Hanabi & co</p>
          </div>
        </div>
      </div>
      <div className="panel relative col-span-2 flex flex-col items-center justify-center overflow-hidden bg-sakura-soft p-3 text-center">
        <div className="speedlines absolute inset-[-40%] text-sakura-deep opacity-20" aria-hidden="true" />
        <p className="relative font-manga text-lg leading-tight text-sakura-deep">Équipe<br />formée !</p>
        <div className="relative mt-2"><PartySlots users={party.slice(0, 3)} max={5} size="xs" /></div>
      </div>
      <Sparkle className="float absolute -top-4 -left-3 size-9" />
      <Sparkle className="float absolute top-40 -right-4 size-6" color="#B9A7CC" style={{ animationDelay: '1.5s' }} />
    </div>
  );
}

function Petals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {[8, 22, 37, 55, 68, 81, 93].map((left, i) => (
        <svg key={left} viewBox="0 0 12 10" className="petal absolute -top-6 size-3.5" style={{ left: `${left}%`, animationDuration: `${11 + (i % 4) * 3}s`, animationDelay: `${i * 1.7}s` }}>
          <path d="M1 5c3-5 9-5 10 0-1 5-7 5-10 0z" fill="#E99BB5" stroke="#30283D" strokeWidth=".8" />
        </svg>
      ))}
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
        <nav className="flex items-center gap-1 text-sm font-extrabold">
          <a href="#comment" className="hidden rounded-full px-3 py-2 text-ink-2 hover:bg-surface hover:text-ink sm:block">Comment ça marche</a>
          <a href="#quetes" className="hidden rounded-full px-3 py-2 text-ink-2 hover:bg-surface hover:text-ink sm:block">Quêtes</a>
          <a href="#personnages" className="hidden rounded-full px-3 py-2 text-ink-2 hover:bg-surface hover:text-ink md:block">Personnages</a>
          {loggedIn ? <Link to="/accueil" className="btn-ink btn-sm ml-2">Mon espace</Link> : <Link to="/inscription" className="btn-ink btn-sm ml-2">Commencer</Link>}
        </nav>
      </header>

      {/* ——— Hero ——— */}
      <section className="relative">
        <Petals />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-6 pb-16 md:grid-cols-[1.05fr_1fr] md:pt-12">
          <div className="fade-up">
            <span className="sticker bg-surface text-ink-2"><span className="font-jp text-sakura-deep">リヨン</span> Lyon · saison 1</span>
            <h1 className="mt-5 font-manga text-[2.6rem] leading-[1.1] font-normal sm:text-6xl">
              Trouve ta guilde.
              <br />
              <span className="relative inline-block text-sakura-deep">
                Vis des quêtes
                <svg viewBox="0 0 300 16" className="absolute -bottom-2 left-0 -z-10 h-3 w-full" preserveAspectRatio="none" aria-hidden="true"><path d="M4 11C70 3 160 3 296 9" fill="none" stroke="#B9A7CC" strokeWidth="7" strokeLinecap="round" /></svg>
              </span>
              <br />
              à plusieurs.
            </h1>
            <p className="mt-7 max-w-xl text-lg font-semibold text-ink-2">
              Kizuna te fait rencontrer des gens à Lyon autour de l’anime, du manga, des jeux et de la culture japonaise : <strong className="text-ink">en petites équipes d’abord, puis en guildes qui se retrouvent, épisode après épisode.</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={loggedIn ? '/accueil' : '/inscription'} className="btn-primary px-6 py-3 text-base">
                {t('cta.findPeople')} <Icon name="arrowRight" className="size-4" />
              </Link>
              <a href="#quetes" className="btn-ghost px-6 py-3 text-base">{t('cta.explore')}</a>
            </div>
            <button onClick={startDemo} className="mt-5 inline-flex items-center gap-2 rounded-full px-1 text-left text-sm font-extrabold text-lav-deep hover:underline">
              <Sparkle className="size-4 shrink-0" color="#B9A7CC" /> Essayer la démo avec Camille, déjà membre de 2 guildes
            </button>
          </div>
          <HeroPanels />
        </div>
      </section>

      {/* ——— Interest ribbon ——— */}
      <div className="relative -mx-4 -rotate-1 border-y border-edge bg-night py-3" aria-hidden="true">
        <div className="flex gap-6 overflow-hidden px-4 whitespace-nowrap font-display text-lg font-black text-on-night">
          {[...RIBBON, ...RIBBON].map((r, i) => (
            <span key={i} className="flex items-center gap-6">{r}<Sparkle className="size-4" color={i % 2 ? '#E99BB5' : '#B9A7CC'} /></span>
          ))}
        </div>
      </div>

      {/* ——— One-shot vs series ——— */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="panel relative overflow-hidden bg-cream-2 p-7">
            <span className="sticker bg-surface text-ink-3">One-shot</span>
            <p className="mt-4 font-display text-2xl font-black text-ink-3 line-through decoration-sakura decoration-[3px]">Un soir avec des inconnus, puis chacun repart de zéro.</p>
            <p className="mt-2 text-sm font-semibold text-ink-3">Le format des dîners entre inconnus et des grands événements.</p>
          </div>
          <div className="panel relative overflow-hidden bg-lav-soft p-7">
            <div className="screentone absolute inset-0 text-lav-deep opacity-15" aria-hidden="true" />
            <span className="sticker relative bg-surface text-lav-deep">Une série</span>
            <p className="relative mt-4 font-display text-2xl font-black">Une passion pour se rencontrer, une activité pour se lancer, une guilde pour se retrouver.</p>
            <div className="relative mt-4 flex flex-wrap items-center gap-3">
              {[1, 2, 3, 4].map((ep) => (
                <span key={ep} className={`inline-flex size-9 items-center justify-center rounded-xl border border-edge font-manga text-sm ${ep === 4 ? 'bg-sakura text-on-accent' : 'bg-surface'}`}>{ep}</span>
              ))}
              <span className="text-sm font-extrabold text-lav-deep">épisodes avec les mêmes visages</span>
            </div>
          </div>
        </div>
      </section>

      {/* ——— How it works ——— */}
      <section id="comment" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20">
        <p className="eyebrow mb-2">Comment ça marche</p>
        <h2 className="max-w-3xl font-manga text-4xl leading-tight font-normal">Ton aventure sociale, en trois épisodes.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="panel overflow-hidden">
            <div className="relative flex h-48 items-center justify-center border-b border-edge bg-sakura-soft">
              <div className="screentone-lg absolute inset-0 text-sakura-deep opacity-20" aria-hidden="true" />
              <Avatar user={{ ...DEMO_PERSONA, id: 'persona' }} size="2xl" className="relative" />
              <div className="absolute top-5 left-3 -rotate-6"><InterestBadge id="ghibli" /></div>
              <div className="absolute top-9 right-3 rotate-6"><InterestBadge id="jeux-societe" /></div>
              <div className="absolute bottom-5 left-4 rotate-3"><InterestBadge id="dessin" /></div>
              <div className="absolute right-3 bottom-7 -rotate-3"><InterestBadge id="langue-japonaise" /></div>
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
              <div className="speedlines absolute inset-[-30%] text-lav-deep opacity-15" aria-hidden="true" />
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
        <div className="screentone absolute inset-0 text-lav-deep opacity-10" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="eyebrow mb-2 text-on-night/50">Ton rythme, pas le nôtre</p>
          <h2 className="max-w-2xl font-manga text-4xl leading-tight font-normal">Choisis ta quête selon tes passions… et ton énergie du jour.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ENERGIES.map((e, i) => (
              <div key={e.id} className="rounded-2xl border-2 border-cream/25 bg-surface/5 p-5 transition hover:-translate-y-1 hover:border-sakura">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-edge bg-cream text-2xl" style={{ boxShadow: 'var(--shadow-sm)' }}>{e.emoji}</span>
                <p className="mt-4 font-display font-black">{e.label}</p>
                <p className="mt-1 text-sm text-on-night/60">{e.description}</p>
                <div className="mt-4 flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((d) => <span key={d} className={`h-1.5 flex-1 rounded-full ${d <= [0, 2, 4, 3, 1][i] ? 'bg-sakura' : 'bg-cream/15'}`} />)}
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
            <h2 className="font-manga text-4xl font-normal">Bien plus que regarder des anime.</h2>
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
          {preview.map((a, i) => (
            <Link key={a.id} to="/inscription" className="paper hover-lift overflow-hidden" style={{ rotate: `${[-0.6, 0.4, -0.3, 0.5, -0.4, 0.3][i]}deg` }}>
              <div className="border-b border-edge"><CoverArt activity={a} className="h-36" /></div>
              <div className="flex gap-3 p-4">
                <DateTicket iso={a.startsAt} />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-sakura-deep">{formatTime(a.startsAt)} · {a.district}</p>
                  <p className="font-display font-black leading-snug">{a.title}</p>
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
            <h2 className="font-manga text-4xl leading-tight font-normal">Des personnages, pas des profils.</h2>
            <p className="mt-4 font-semibold text-ink-2">« Je viens d’arriver à Lyon et je ne connais personne. » « Je n’ose pas aller seul·e à une convention. » Sur Kizuna, on se présente par ce qu’on aime, et l’activité fait le reste.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {PROMISES.map((p) => (
                <div key={p.title} className="rounded-2xl border border-edge bg-surface p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <Icon name={p.icon} className="size-6 text-sakura-deep" />
                  <p className="mt-2 font-display font-black">{p.title}</p>
                  <p className="mt-1 text-sm text-ink-2">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative grid gap-5 sm:grid-cols-3">
            {(['u-clara', 'u-yuki', 'u-nathan'] as const).map((id, i) => (
              <div key={id} className={i === 1 ? 'sm:mt-10' : ''}>
                <CharacterCard user={user(id)} maxBadges={4} tilt={[-2, 1.5, -1][i]} footer={<p className="bubble text-xs">{['Je cherche des gens pour les films Ghibli !', 'Venez pratiquer le japonais, même un peu 🙂', 'Jeux coop > jeux compétitifs.'][i]}</p>} />
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
          <div className="speedlines absolute inset-[-50%] text-white opacity-[0.07]" aria-hidden="true" />
          <div className="relative">
            <div className="mb-6 flex justify-center -space-x-3">
              {['u-julie', 'u-mehdi', 'u-aiko', 'u-tom', 'u-zoe'].map((id) => <Avatar key={id} user={user(id)} size="lg" />)}
            </div>
            <p className="font-jp text-lg font-bold text-ink-3">絆 — le lien qui se tisse</p>
            <h2 className="mx-auto mt-3 max-w-2xl font-manga text-4xl leading-tight font-normal">Ta prochaine équipe t’attend quelque part à Lyon.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to={loggedIn ? '/accueil' : '/inscription'} className="btn-primary px-6 py-3 text-base">{t('cta.findPeople')}</Link>
              <button onClick={startDemo} className="btn-ghost px-6 py-3 text-base">Voir la démo</button>
            </div>
          </div>
        </div>
      </section>
      <footer className="mx-auto max-w-6xl space-y-2 border-t-2 border-dashed border-line px-4 py-8 text-xs font-semibold text-ink-3">
        <div className="flex flex-wrap justify-between gap-4">
          <span>Kizuna · prototype de démonstration · Lyon, France</span>
          <span>Personnes, lieux et événements fictifs · illustrations et avatars originaux.</span>
        </div>
        <p>Les titres d’œuvres cités servent uniquement de centres d’intérêt saisis par les membres et appartiennent à leurs ayants droit. Kizuna n’est affilié à aucun studio, éditeur ou franchise.</p>
      </footer>
    </div>
  );
}
