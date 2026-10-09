import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { DEMO_PERSONA } from '../data/users';
import { ME } from '../store/state';
import { DemoBanner } from '../components/Layout';
import { Icon } from '../components/Icon';
import { Logo } from '../components/ui';

export default function Signup() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', email: '', password: '', adult: false, terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.firstName.trim().length < 2) err.firstName = 'Indique ton prénom (2 caractères minimum).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = 'Adresse e-mail invalide.';
    if (form.password.length < 8) err.password = '8 caractères minimum.';
    if (!form.adult) err.adult = 'Kizuna est réservé aux personnes majeures.';
    if (!form.terms) err.terms = 'Merci d’accepter la charte et la politique de confidentialité.';
    setErrors(err);
    if (Object.keys(err).length) return;
    dispatch({ type: 'signup', email: form.email.trim(), firstName: form.firstName.trim() });
    navigate('/onboarding');
  };

  return (
    <div className="min-h-dvh">
      <DemoBanner />
      <div className="mx-auto grid min-h-[calc(100dvh-28px)] max-w-6xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-ink p-10 text-paper md:flex md:rounded-b-[2rem]">
          <Link to="/"><Logo light /></Link>
          <div>
            <p className="font-jp text-7xl font-bold text-shu">絆</p>
            <p className="mt-4 font-display text-3xl leading-tight">« Kizuna » : le lien qui se tisse entre des personnes, avec le temps.</p>
            <p className="mt-4 text-paper/60">Ici, on ne collectionne pas les contacts. On retrouve les mêmes visages, activité après activité.</p>
          </div>
          <p className="text-xs text-paper/40">Prototype — aucun compte réel n’est créé.</p>
        </div>
        <div className="flex flex-col justify-center px-4 py-10 sm:px-10">
          <Link to="/" className="mb-8 md:hidden"><Logo /></Link>
          <h1 className="text-3xl font-semibold">Crée ton compte</h1>
          <p className="mt-2 text-ink-2">2 minutes pour trouver tes premières activités.</p>
          <form onSubmit={submit} noValidate className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="firstName">Prénom</label>
              <input id="firstName" className="input" value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} autoComplete="given-name" aria-invalid={!!errors.firstName} />
              <p className="mt-1 text-xs text-ink-3">Seul ton prénom est visible des autres membres.</p>
              {errors.firstName && <p className="mt-1 text-sm text-shu-dark">{errors.firstName}</p>}
            </div>
            <div>
              <label className="label" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="input" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 text-sm text-shu-dark">{errors.email}</p>}
            </div>
            <div>
              <label className="label" htmlFor="password">Mot de passe</label>
              <input id="password" type="password" className="input" value={form.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" aria-invalid={!!errors.password} />
              {errors.password && <p className="mt-1 text-sm text-shu-dark">{errors.password}</p>}
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 size-4 accent-shu" checked={form.adult} onChange={(e) => set({ adult: e.target.checked })} />
              <span>J’ai 18 ans ou plus.{errors.adult && <span className="block text-shu-dark">{errors.adult}</span>}</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 size-4 accent-shu" checked={form.terms} onChange={(e) => set({ terms: e.target.checked })} />
              <span>
                J’accepte la charte de la communauté et la politique de confidentialité. Mes données servent uniquement à me proposer des activités.
                {errors.terms && <span className="block text-shu-dark">{errors.terms}</span>}
              </span>
            </label>
            <button type="submit" className="btn-primary w-full py-3 text-base">Continuer <Icon name="arrowRight" className="size-4" /></button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-ink-3"><span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" /></div>
          <button
            className="btn-ghost w-full py-3"
            onClick={() => {
              dispatch({ type: 'startDemo', profile: { ...DEMO_PERSONA, id: ME } });
              navigate('/accueil');
            }}
          >
            <Icon name="sparkle" className="size-4" /> Explorer avec le profil démo de Camille
          </button>
          <p className="mt-6 text-center text-xs text-ink-3">Démo : pas de vrai compte, pas de mot de passe stocké. Les données restent dans ce navigateur.</p>
        </div>
      </div>
    </div>
  );
}
