import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import type { Profile } from '../data/types';
import { ME } from '../store/state';
import { DemoBanner } from '../components/Layout';
import { Icon } from '../components/Icon';
import { Logo } from '../components/ui';
import { AboutFields, AvailabilityFields, CityFields, EnergyFields, InterestFields, LevelFields } from '../components/ProfileFields';
import { ENERGIES, interestLabel, levelLabel } from '../data/taxonomy';

const STEPS = [
  { key: 'ville', title: 'Où veux-tu rencontrer du monde ?', sub: 'Pour te proposer des activités près de chez toi.', optional: false },
  { key: 'niveau', title: 'Ton rapport à la culture pop japonaise ?', sub: 'Débutant·e ou passionné·e : tout le monde a sa place.', optional: true },
  { key: 'interets', title: 'Qu’est-ce que tu aimes ?', sub: 'Choisis au moins 3 centres d’intérêt. C’est la base de tes recommandations.', optional: false },
  { key: 'energie', title: 'Ton énergie sociale', sub: 'Plutôt cosy ou plutôt tournoi ? Les deux, ça marche aussi.', optional: true },
  { key: 'dispo', title: 'Tes disponibilités', sub: 'On privilégiera les activités sur ces créneaux.', optional: true },
  { key: 'toi', title: 'Pour finir', sub: 'Les langues que tu parles, et un mot sur toi si tu veux.', optional: true },
] as const;

export default function Onboarding() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [p, setP] = useState<Profile>(
    () =>
      state.profile ?? {
        id: ME,
        firstName: state.account?.firstName ?? '',
        city: 'Lyon',
        bio: '',
        interests: [],
        level: 'curieux',
        energy: [],
        languages: ['Français'],
        groupSize: 'petit',
        availability: [],
        format: 'les-deux',
        distanceKm: 5,
        avatarHue: Math.floor(Math.random() * 360),
      },
  );

  if (!state.account) return <Navigate to="/inscription" replace />;
  if (state.onboarded) return <Navigate to="/accueil" replace />;

  const set = (patch: Partial<Profile>) => {
    setP((prev) => ({ ...prev, ...patch }));
    setError('');
  };
  const current = STEPS[step];
  const isLast = step === STEPS.length;

  const validate = () => {
    if (current?.key === 'ville' && !p.city) return 'Choisis une ville.';
    if (current?.key === 'interets' && p.interests.length < 3) return 'Choisis au moins 3 centres d’intérêt pour des recommandations pertinentes.';
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) return setError(err);
    setStep((s) => s + 1);
  };

  const skip = () => {
    // Sensible defaults when optional questions are skipped
    if (current.key === 'energie' && !p.energy.length) set({ energy: ['social', 'calme'] });
    if (current.key === 'dispo' && !p.availability.length) set({ availability: ['semaine-soir', 'samedi-aprem', 'dimanche-aprem'] });
    setStep((s) => s + 1);
  };

  const finish = () => {
    dispatch({ type: 'saveProfile', profile: { ...p, energy: p.energy.length ? p.energy : ['social', 'calme'] }, finishOnboarding: true });
    navigate('/accueil');
  };

  const progress = Math.round((Math.min(step, STEPS.length) / STEPS.length) * 100);

  return (
    <div className="min-h-dvh">
      <DemoBanner />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <span className="text-sm text-ink-3">{isLast ? 'Récapitulatif' : `Étape ${step + 1} sur ${STEPS.length}`}</span>
        </div>
        <div className="mb-10 h-1.5 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l’inscription">
          <div className="h-full rounded-full bg-shu transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div key={step} className="fade-up">
          {!isLast ? (
            <>
              <h1 className="text-3xl font-semibold sm:text-4xl">{current.title}</h1>
              <p className="mt-2 mb-8 text-ink-2">{current.sub}</p>
              {current.key === 'ville' && <CityFields p={p} set={set} />}
              {current.key === 'niveau' && <LevelFields p={p} set={set} />}
              {current.key === 'interets' && <InterestFields p={p} set={set} />}
              {current.key === 'energie' && <EnergyFields p={p} set={set} />}
              {current.key === 'dispo' && <AvailabilityFields p={p} set={set} />}
              {current.key === 'toi' && <AboutFields p={p} set={set} />}
            </>
          ) : (
            <Summary p={p} />
          )}
        </div>

        {error && <p className="mt-6 rounded-xl bg-shu-soft p-3 text-sm text-shu-dark" role="alert">{error}</p>}

        <div className="sticky bottom-0 mt-10 flex items-center justify-between gap-3 border-t border-line bg-paper/95 py-4 backdrop-blur">
          <button className="btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <Icon name="arrowLeft" className="size-4" /> Retour
          </button>
          <div className="flex gap-2">
            {!isLast && current.optional && (
              <button className="btn px-4 text-ink-2 hover:text-ink" onClick={skip}>Passer</button>
            )}
            {isLast ? (
              <button className="btn-primary" onClick={finish}>Voir mes activités <Icon name="arrowRight" className="size-4" /></button>
            ) : (
              <button className="btn-ink" onClick={next}>Continuer <Icon name="arrowRight" className="size-4" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ p }: { p: Profile }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold sm:text-4xl">Enchanté·e, {p.firstName} !</h1>
      <p className="mt-2 mb-8 text-ink-2">Voici ce qu’on a compris. Tu pourras tout modifier depuis ton profil.</p>
      <dl className="card divide-y divide-line">
        {[
          ['Ville', `${p.city}${p.neighborhood ? ` · ${p.neighborhood}` : ''} · jusqu’à ${p.distanceKm} km`],
          ['Niveau', levelLabel(p.level)],
          ['Passions', p.interests.map(interestLabel).join(', ')],
          ['Ambiances', (p.energy.length ? p.energy : ['social', 'calme']).map((e) => ENERGIES.find((x) => x.id === e)?.label).join(', ')],
          ['Langues', p.languages.join(', ') || '—'],
        ].map(([k, v]) => (
          <div key={k} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[8rem_1fr]">
            <dt className="text-sm font-semibold">{k}</dt>
            <dd className="text-sm text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-ink-3">Nous ne demandons ni photo, ni nom de famille, ni orientation, ni données sensibles.</p>
    </div>
  );
}
