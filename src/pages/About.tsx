import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';

const FEATURES: { icon: IconName; name: string; jp: string; text: string; retention: string }[] = [
  { icon: 'circles', name: 'Même équipe → guilde', jp: '輪', text: 'Après une activité, chacun dit en privé s’il veut revoir le groupe. Si au moins 2 autres personnes disent oui, le groupe peut devenir une guilde récurrente avec une prochaine activité suggérée.', retention: 'Transforme une rencontre ponctuelle en habitude : la 2e participation devient le choix par défaut.' },
  { icon: 'sparkle', name: 'Graphe de passions', jp: '好', text: 'Le profil est un ensemble de passions (genres, univers, loisirs, culture) plutôt qu’un fandom unique. Les recommandations traversent ces passions et expliquent leurs raisons.', retention: 'Plus de variété d’activités pertinentes = plus de raisons de revenir chaque semaine.' },
  { icon: 'wave', name: 'Visages familiers', jp: '顔', text: 'Les activités où vont des personnes déjà rencontrées sont mises en avant, et l’accueil distingue « Retrouver » de « Découvrir ».', retention: 'Les gens reviennent pour les personnes, pas seulement pour l’activité.' },
  { icon: 'lock', name: 'Connexion discrète et mutuelle', jp: '縁', text: 'On peut indiquer vouloir rester en contact avec quelqu’un. La connexion n’apparaît que si c’est réciproque — sinon rien, ni rejet ni notification.', retention: 'Réduit la peur du rejet, frein majeur chez les personnes timides.' },
  { icon: 'users', name: 'Énergie sociale', jp: '気', text: 'Chaque activité a une ambiance (calme, créatif, compétitif, social, culturel). On choisit selon son humeur du moment, pas seulement selon le sujet.', retention: 'Les introvertis trouvent un format confortable au lieu d’abandonner après une soirée trop intense.' },
];

const GLOSSARY: [string, string, string][] = [
  ['Quête', '依', 'Une activité en petit groupe : karaoké, atelier ramen, soirée jeux…'],
  ['Équipe', '組', 'Les personnes inscrites à une même quête.'],
  ['Guilde', '絆', 'Un groupe récurrent qui se retrouve régulièrement autour d’une passion.'],
  ['Épisode', '話', 'Une rencontre d’une guilde. Les épisodes forment l’histoire du groupe.'],
  ['Fiche personnage', '顔', 'Ton profil : avatar illustré, titre, badges de passion, ambiance préférée.'],
  ['Compagnons de route', '友', 'Les personnes que tu as déjà rencontrées lors d’une quête ou d’une guilde.'],
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl">
      <span className="sticker bg-surface text-sakura-deep"><span className="font-jp">物語</span> À propos du projet</span>
      <h1 className="font-manga text-4xl leading-tight font-normal md:text-5xl">Les passions créent le premier lien. Les activités le renforcent. Les guildes lui laissent le temps de grandir.</h1>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-cream-2 p-6">
          <p className="eyebrow mb-2">Approche « dîner entre inconnus »</p>
          <p className="font-display text-xl">Rencontrer de nouvelles personnes.</p>
          <p className="mt-2 text-sm text-ink-2">Un format unique, des tables qui changent, et l’on repart souvent de zéro la fois suivante.</p>
        </div>
        <div className="dusk rounded-3xl border border-edge p-6">
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-ink-3 uppercase">Kizuna</p>
          <p className="font-display text-xl">Se rencontrer par ce qu’on aime, faire ensemble, se revoir.</p>
          <p className="mt-2 text-sm text-ink-2">Des activités variées, une ambiance choisie, et des groupes qui se retrouvent.</p>
        </div>
      </div>

      <h2 className="mt-14 font-manga text-3xl font-normal">Ce qui nous différencie</h2>
      <div className="mt-6 space-y-4">
        {FEATURES.map((f) => (
          <div key={f.name} className="card grid gap-4 p-6 md:grid-cols-[auto_1fr_16rem]">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-sakura-soft font-jp text-xl font-bold text-sakura-deep">{f.jp}</span>
            <div>
              <p className="flex items-center gap-2 font-display text-xl font-semibold"><Icon name={f.icon} className="size-5 text-sakura-deep" /> {f.name}</p>
              <p className="mt-1 text-sm text-ink-2">{f.text}</p>
            </div>
            <p className="rounded-2xl bg-cream p-3 text-sm"><span className="font-semibold">Rétention : </span><span className="text-ink-2">{f.retention}</span></p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-manga text-3xl font-normal">Le vocabulaire de l’aventure</h2>
      <p className="mt-2 font-semibold text-ink-2">Un univers inspiré des RPG, mais des mots toujours compréhensibles. Chaque terme est accompagné de son sens concret dans l’interface.</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {GLOSSARY.map(([term, jp, meaning]) => (
          <div key={term} className="card flex items-start gap-3 p-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-sakura-soft font-jp font-black text-sakura-deep">{jp}</span>
            <div><dt className="font-display font-black">{term}</dt><dd className="text-sm font-semibold text-ink-2">{meaning}</dd></div>
          </div>
        ))}
      </dl>

      <h2 className="mt-14 font-manga text-3xl font-normal">Identité visuelle & droits</h2>
      <div className="mt-6 card p-6 text-sm font-semibold text-ink-2">
        <ul className="space-y-2">
          <li>• <strong className="text-ink">Illustrations originales</strong> : décors (café manga, rue de quartier, arcade, atelier, bord de fleuve, table de jeu), avatars et blasons sont dessinés en SVG pour ce projet. Aucun personnage, panneau de manga ou logo existant n’est reproduit.</li>
          <li>• <strong className="text-ink">Avatars générés</strong> à partir de pièces simples (coiffure, couleurs, expression, accessoire) : chaque membre crée son propre personnage, sans photo.</li>
          <li>• <strong className="text-ink">Franchises citées comme étiquettes</strong> : les noms d’œuvres sont de simples centres d’intérêt saisis par les membres. Kizuna n’est affilié à aucun studio, éditeur ou ayant droit.</li>
          <li>• <strong className="text-ink">Typographies libres</strong> (Google Fonts, licence OFL) : Dela Gothic One, Zen Maru Gothic, Nunito.</li>
        </ul>
      </div>

      <h2 className="mt-14 font-manga text-3xl font-normal">Ce qui est simulé dans ce prototype</h2>
      <div className="mt-6 card p-6 text-sm text-ink-2">
        <ul className="space-y-2">
          <li>• <strong className="text-ink">Pas de backend</strong> : toutes les données (profil, inscriptions, guildes, messages) sont stockées dans le navigateur (localStorage).</li>
          <li>• <strong className="text-ink">Pas de vraie authentification</strong> : l’inscription valide le formulaire mais ne crée aucun compte.</li>
          <li>• <strong className="text-ink">Les autres membres sont fictifs</strong> : leurs réponses « revoir le groupe » et « rester en contact » sont simulées par une règle fixe.</li>
          <li>• <strong className="text-ink">Discussion non temps réel</strong> : tes messages s’ajoutent localement ; personne ne répond.</li>
          <li>• <strong className="text-ink">Aucun paiement ni réservation réelle</strong>, aucun e-mail envoyé, aucun signalement transmis.</li>
          <li>• <strong className="text-ink">Recommandations à base de règles</strong> transparentes, pas un modèle de compatibilité validé.</li>
        </ul>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/accueil" className="btn-primary">Retour à l’accueil</Link>
        <Link to="/parametres#charte" className="btn-ghost">Charte de la communauté</Link>
      </div>
    </div>
  );
}
