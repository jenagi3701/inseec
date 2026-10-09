import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import type { Profile } from '../data/types';
import { ME } from '../store/state';
import { DemoBanner } from '../components/Layout';
import { Icon } from '../components/Icon';
import { Logo } from '../components/ui';
import { AboutFields, AvailabilityFields, CityFields, EnergyFields, InterestFields, LevelFields } from '../components/ProfileFields';
import { AvatarEditor, randomAvatar } from '../components/AvatarEditor';
import { CharacterCard } from '../components/CharacterCard';
import { ENERGIES, interestLabel, levelLabel } from '../data/taxonomy';

const STEPS = [
  { key: 'ville', jp: '街', title: 'Où commence ton aventure ?', sub: 'Pour te proposer des quêtes près de chez toi.', optional: false },
  { key: 'perso', jp: '顔', title: 'Crée ton personnage', sub: 'Un avatar illustré plutôt qu’une photo. Tu pourras le changer quand tu veux.', optional: true },
  { key: 'niveau', jp: '道', title: 'Ton rapport à la culture pop japonaise ?', sub: 'Débutant·e ou passionné·e : tout le monde a sa place dans la guilde.', optional: true },
  { key: 'interets', jp: '好', title: 'Qu’est-ce que tu aimes ?', sub: 'Choisis au moins 3 passions. Ce sont tes badges, et la base de tes recommandations.', optional: false },
  { key: 'energie', jp: '気', title: 'Ton énergie sociale', sub: 'Plutôt cosy ou plutôt tournoi ? Les deux, ça marche aussi.', optional: true },
  { key: 'dispo', jp: '時', title: 'Tes disponibilités', sub: 'On privilégiera les quêtes sur ces créneaux.', optional: true },
  { key: 'toi', jp: '声', title: 'Pour finir', sub: 'Les langues que tu parles, et un mot sur toi si tu veux.', optional: true },
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
        avatar: randomAvatar(),
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
    window.scrollTo(0, 0);
  };

  const skip = () => {
    // Sensible defaults when optional questions are skipped
    if (current.key === 'energie' && !p.energy.length) set({ energy: ['social', 'calme'] });
    if (current.key === 'dispo' && !p.availability.length) set({ availability: ['semaine-soir', 'samedi-aprem', 'dimanche-aprem'] });
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const finish = () => {
    dispatch({ type: 'saveProfile', profile: { ...p, energy: p.energy.length ? p.energy : ['social', 'calme'] }, finishOnboarding: true });
    navigate('/accueil');
  };

  const progress = Math.round((Math.min(step, STEPS.length) / STEPS.length) * 100);
  const preview: Profile = { ...p, interests: p.interests.length ? p.interests : [], energy: p.energy };

  return (
    <div className="min-h-dvh">
      <DemoBanner />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="sticker bg-surface text-ink-2">{isLast ? 'Récapitulatif' : `Étape ${step + 1} / ${STEPS.length}`}</span>
        </div>
        {/* Progress as quest map */}
        <div className="mb-10 flex items-center gap-1.5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l’inscription">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center gap-1.5">
              <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-2 font-jp text-sm font-bold transition ${i < step ? 'border-edge bg-lavender text-on-accent' : i === step ? 'border-edge bg-sakura text-on-accent' : 'border-line bg-surface text-ink-3'}`}>{s.jp}</span>
              {i < STEPS.length - 1 && <span className={`h-1 flex-1 rounded-full ${i < step ? 'bg-lavender' : 'bg-line'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
          <div>
            <div key={step} className="">
              {!isLast ? (
                <>
                  <h1 className="font-manga text-3xl font-bold sm:text-4xl">{current.title}</h1>
                  <p className="mt-2 mb-8 font-semibold text-ink-2">{current.sub}</p>
                  {current.key === 'ville' && <CityFields p={p} set={set} />}
                  {current.key === 'perso' && (
                    <div className="space-y-6">
                      <AvatarEditor value={p.avatar!} onChange={(avatar) => set({ avatar })} name={p.firstName} />
                      <div>
                        <label className="label" htmlFor="title">Ton titre de personnage <span className="font-semibold text-ink-3">(facultatif)</span></label>
                        <input id="title" className="input" value={p.title ?? ''} onChange={(e) => set({ title: e.target.value })} maxLength={40} placeholder="Ex. Exploratrice des Pentes, Barde du karaoké…" />
                      </div>
                    </div>
                  )}
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

            {error && <p className="mt-6 rounded-xl border-2 border-sakura bg-sakura-soft p-3 text-sm font-bold text-sakura-deep" role="alert">{error}</p>}

            <div className="sticky bottom-0 mt-10 flex items-center justify-between gap-3 border-t border-edge bg-cream/95 py-4 backdrop-blur">
              <button className="btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                <Icon name="arrowLeft" className="size-4" /> Retour
              </button>
              <div className="flex gap-2">
                {!isLast && current.optional && (
                  <button className="rounded-full px-4 text-sm font-bold text-ink-2 hover:text-ink" onClick={skip}>Passer</button>
                )}
                {isLast ? (
                  <button className="btn-primary" onClick={finish}>Commencer l’aventure <Icon name="arrowRight" className="size-4" /></button>
                ) : (
                  <button className="btn-primary" onClick={next}>Continuer <Icon name="arrowRight" className="size-4" /></button>
                )}
              </div>
            </div>
          </div>

          {/* Live character card */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <p className="eyebrow mb-3 flex items-center gap-2">Ta fiche se construit</p>
              <CharacterCard user={preview} maxBadges={8} footer={p.interests.length === 0 ? <p className="text-xs font-semibold text-ink-3">Tes badges de passion apparaîtront ici.</p> : undefined} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Summary({ p }: { p: Profile }) {
  return (
    <div>
      <h1 className="font-manga text-3xl font-bold sm:text-4xl">Enchanté·e, {p.firstName} !</h1>
      <p className="mt-2 mb-8 font-semibold text-ink-2">Voici ta fiche. Tu pourras tout modifier depuis ton profil.</p>
      <div className="mb-6 max-w-xs lg:hidden"><CharacterCard user={p} maxBadges={8} /></div>
      <dl className="card divide-y-2 divide-line">
        {[
          ['Ville', `${p.city}${p.neighborhood ? ` · ${p.neighborhood}` : ''} · jusqu’à ${p.distanceKm} km`],
          ['Niveau', levelLabel(p.level)],
          ['Passions', p.interests.map(interestLabel).join(', ')],
          ['Ambiances', (p.energy.length ? p.energy : ['social', 'calme']).map((e) => { const x = ENERGIES.find((y) => y.id === e); return x ? x.label : ''; }).join(', ')],
          ['Langues', p.languages.join(', ') || '—'],
        ].map(([k, v]) => (
          <div key={k} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[8rem_1fr]">
            <dt className="text-sm font-bold">{k}</dt>
            <dd className="text-sm font-semibold text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm font-semibold text-ink-3">Nous ne demandons ni photo, ni nom de famille, ni orientation, ni données sensibles.</p>
    </div>
  );
}
