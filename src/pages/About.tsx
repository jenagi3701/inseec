import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';

const FEATURES: { icon: IconName; name: string; jp: string; text: string; retention: string }[] = [
  { icon: 'circles', name: 'Même cercle', jp: '輪', text: 'Après une activité, chacun dit en privé s’il veut revoir le groupe. Si au moins 2 autres personnes disent oui, le groupe peut devenir un cercle récurrent avec une prochaine activité suggérée.', retention: 'Transforme une rencontre ponctuelle en habitude : la 2e participation devient le choix par défaut.' },
  { icon: 'sparkle', name: 'Graphe de passions', jp: '好', text: 'Le profil est un ensemble de passions (genres, univers, loisirs, culture) plutôt qu’un fandom unique. Les recommandations traversent ces passions et expliquent leurs raisons.', retention: 'Plus de variété d’activités pertinentes = plus de raisons de revenir chaque semaine.' },
  { icon: 'wave', name: 'Visages familiers', jp: '顔', text: 'Les activités où vont des personnes déjà rencontrées sont mises en avant, et l’accueil distingue « Retrouver » de « Découvrir ».', retention: 'Les gens reviennent pour les personnes, pas seulement pour l’activité.' },
  { icon: 'lock', name: 'Connexion discrète et mutuelle', jp: '縁', text: 'On peut indiquer vouloir rester en contact avec quelqu’un. La connexion n’apparaît que si c’est réciproque — sinon rien, ni rejet ni notification.', retention: 'Réduit la peur du rejet, frein majeur chez les personnes timides.' },
  { icon: 'users', name: 'Énergie sociale', jp: '気', text: 'Chaque activité a une ambiance (calme, créatif, compétitif, social, culturel). On choisit selon son humeur du moment, pas seulement selon le sujet.', retention: 'Les introvertis trouvent un format confortable au lieu d’abandonner après une soirée trop intense.' },
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow mb-2">À propos du projet</p>
      <h1 className="text-4xl font-semibold md:text-5xl">Les passions créent le premier lien. Les activités le renforcent. Les cercles lui laissent le temps de grandir.</h1>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-paper-2 p-6">
          <p className="eyebrow mb-2">Approche « dîner entre inconnus »</p>
          <p className="font-display text-xl">Rencontrer de nouvelles personnes.</p>
          <p className="mt-2 text-sm text-ink-2">Un format unique, des tables qui changent, et l’on repart souvent de zéro la fois suivante.</p>
        </div>
        <div className="rounded-3xl bg-ai p-6 text-white">
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-white/60 uppercase">Kizuna</p>
          <p className="font-display text-xl">Se rencontrer par ce qu’on aime, faire ensemble, se revoir.</p>
          <p className="mt-2 text-sm text-white/75">Des activités variées, une ambiance choisie, et des groupes qui se retrouvent.</p>
        </div>
      </div>

      <h2 className="mt-14 text-3xl font-semibold">Ce qui nous différencie</h2>
      <div className="mt-6 space-y-4">
        {FEATURES.map((f) => (
          <div key={f.name} className="card grid gap-4 p-6 md:grid-cols-[auto_1fr_16rem]">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-shu-soft font-jp text-xl font-bold text-shu">{f.jp}</span>
            <div>
              <p className="flex items-center gap-2 font-display text-xl font-semibold"><Icon name={f.icon} className="size-5 text-shu" /> {f.name}</p>
              <p className="mt-1 text-sm text-ink-2">{f.text}</p>
            </div>
            <p className="rounded-2xl bg-paper p-3 text-sm"><span className="font-semibold">Rétention : </span><span className="text-ink-2">{f.retention}</span></p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 text-3xl font-semibold">Ce qui est simulé dans ce prototype</h2>
      <div className="mt-6 card p-6 text-sm text-ink-2">
        <ul className="space-y-2">
          <li>• <strong className="text-ink">Pas de backend</strong> : toutes les données (profil, inscriptions, cercles, messages) sont stockées dans le navigateur (localStorage).</li>
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
