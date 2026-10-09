import { Icon } from './Icon';

export const GUIDELINES: { title: string; text: string }[] = [
  { title: 'Bienveillance d’abord', text: 'Personne n’est « trop débutant·e » ni « trop fan ». On ne se moque pas des goûts des autres.' },
  { title: 'Lieux publics uniquement', text: 'Les activités ont lieu dans des lieux publics ou partenaires. Pas de rendez-vous au domicile d’un membre.' },
  { title: 'Consentement', text: 'On ne partage pas ses coordonnées sans accord mutuel. Les photos d’autres personnes se prennent avec leur permission.' },
  { title: 'Pas de drague insistante', text: 'Kizuna est un espace d’amitié. Une invitation refusée ne se répète pas.' },
  { title: 'Prévenir si on ne vient pas', text: 'Désinscris-toi dès que possible : une place libérée, c’est quelqu’un d’autre qui peut venir.' },
  { title: 'Signaler, c’est protéger', text: 'Un comportement te met mal à l’aise ? Signale-le, c’est confidentiel. Tu peux aussi bloquer un membre.' },
];

export const ORGANIZER_EXPECTATIONS = [
  'Arriver 10 minutes avant et accueillir personnellement les nouvelles personnes.',
  'Donner un lieu de rendez-vous précis et un moyen de reconnaître le groupe.',
  'Annoncer le prix réel et ce qui est inclus, sans frais cachés.',
  'Veiller à ce que chacun·e puisse participer à la conversation.',
  'Signaler tout incident à l’équipe Kizuna dans les 24 h.',
];

export function GuidelinesList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
      {GUIDELINES.map((g) => (
        <li key={g.title} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
          <Icon name="leaf" className="mt-0.5 size-5 shrink-0 text-matcha" />
          <div>
            <p className="text-sm font-semibold">{g.title}</p>
            <p className="text-sm text-ink-2">{g.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
