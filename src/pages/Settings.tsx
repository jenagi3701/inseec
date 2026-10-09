import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Icon } from '../components/Icon';
import { Avatar, Modal } from '../components/ui';
import { GuidelinesList, ORGANIZER_EXPECTATIONS } from '../components/Guidelines';
import { useToast } from '../components/Toast';
import { timeAgo } from '../lib/format';
import type { Privacy } from '../store/state';

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 px-6 py-4">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-sm text-ink-2">{hint}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-matcha peer-focus-visible:ring-2 peer-focus-visible:ring-lav" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

const SAFETY_TIPS = [
  'Toutes les activités ont lieu dans un lieu public ou chez un partenaire identifié.',
  'Préviens un·e proche de l’endroit où tu vas, surtout pour une première fois.',
  'Organise ton trajet retour à l’avance (TCL, Vélo’v, taxi).',
  'Tu peux partir à tout moment, sans te justifier.',
  'Ne partage tes coordonnées que si tu le souhaites vraiment — la plateforme ne l’exige jamais.',
  'En cas de danger immédiat : 17 (police) ou 112. Violences faites aux femmes : 3919. Tout comportement problématique peut aussi être signalé ici.',
];

export default function Settings() {
  const { state, dispatch, getUser, getActivity } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const p = state.privacy;
  const set = (patch: Partial<Privacy>) => { dispatch({ type: 'updatePrivacy', privacy: patch }); toast('Préférence enregistrée'); };

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const exportData = () => {
    if (__EMBEDDED__) {
      // Downloads are blocked in the embedded viewer: copy the JSON instead.
      navigator.clipboard
        .writeText(JSON.stringify(state, null, 2))
        .then(() => toast('Données copiées dans le presse-papiers (JSON)'))
        .catch(() => toast('Copie impossible dans cette vue. Lance l’app en local pour exporter.'));
      return;
    }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kizuna-mes-donnees.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Export téléchargé');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <span className="sticker bg-surface text-sakura-deep"><span className="font-jp">設定</span> Compte</span>
        <h1 className="mt-2 font-manga text-4xl font-normal md:text-5xl">Paramètres & sécurité</h1>
        <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Sections">
          {[['confidentialite', 'Confidentialité'], ['connexions', 'Connexions'], ['blocages', 'Blocages & signalements'], ['charte', 'Charte'], ['securite', 'Conseils sécurité'], ['donnees', 'Mes données']].map(([id, l]) => (
            <a key={id} href={`#${id}`} className="chip border border-line bg-surface px-3 py-1.5 text-ink-2 hover:border-ink-3-3">{l}</a>
          ))}
        </nav>
      </div>

      <section id="confidentialite" className="scroll-mt-24">
        <h2 className="mb-3 text-2xl">Confidentialité</h2>
        <div className="card divide-y divide-line">
          <Toggle checked={p.showNeighborhood} onChange={(v) => set({ showNeighborhood: v })} label="Afficher mon quartier" hint="Sinon, seule ta ville est visible." />
          <Toggle checked={p.showAge} onChange={(v) => set({ showAge: v })} label="Afficher mon âge" hint="Désactivé par défaut." />
          <Toggle checked={p.allowConnectionRequests} onChange={(v) => set({ allowConnectionRequests: v })} label="Autoriser les demandes de connexion" hint="Uniquement de personnes rencontrées lors d’une activité, et seulement si c’est mutuel." />
          <Toggle checked={p.emailReminders} onChange={(v) => set({ emailReminders: v })} label="Rappels par e-mail la veille d’une activité" hint="Démo : aucun e-mail n’est envoyé." />
          <div className="px-6 py-4">
            <p className="text-sm font-semibold">Qui peut voir mon profil complet ?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="toggle-pill" aria-pressed={p.profileVisibility === 'participants'} onClick={() => set({ profileVisibility: 'participants' })}>Les participant·es de mes activités</button>
              <button className="toggle-pill" aria-pressed={p.profileVisibility === 'membres'} onClick={() => set({ profileVisibility: 'membres' })}>Tous les membres</button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-3">Ton e-mail, ton nom de famille et tes coordonnées ne sont jamais affichés.</p>
      </section>

      <section id="connexions" className="scroll-mt-24">
        <h2 className="mb-3 text-2xl">Connexions</h2>
        <div className="card p-6">
          {state.connections.length ? (
            <ul className="space-y-3">
              {state.connections.map((c) => {
                const u = getUser(c.userId);
                return (
                  <li key={c.userId} className="flex items-center gap-3">
                    <Avatar user={u} size="sm" />
                    <Link to={`/profil/${c.userId}`} className="flex-1 text-sm font-semibold hover:underline">{u?.firstName}</Link>
                    <span className={`chip ${c.status === 'mutuelle' ? 'bg-lav-soft text-lav-deep' : 'bg-cream-2 text-ink-3'}`}>{c.status === 'mutuelle' ? 'Mutuelle' : 'En attente (privé)'}</span>
                    <button className="text-xs text-ink-3 hover:text-sakura-deep" onClick={() => { dispatch({ type: 'removeConnection', userId: c.userId }); toast('Connexion retirée'); }}>Retirer</button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-ink-2">Aucune connexion pour l’instant. Elles se créent après une activité, uniquement si l’envie est réciproque.</p>
          )}
        </div>
      </section>

      <section id="blocages" className="scroll-mt-24">
        <h2 className="mb-3 text-2xl">Blocages & signalements</h2>
        <div className="card divide-y divide-line">
          <div className="p-6">
            <p className="text-sm font-semibold">Membres bloqués</p>
            {state.blocked.length ? (
              <ul className="mt-3 space-y-2">
                {state.blocked.map((id) => (
                  <li key={id} className="flex items-center gap-3">
                    <Avatar user={getUser(id)} size="sm" />
                    <span className="flex-1 text-sm">{getUser(id)?.firstName}</span>
                    <button className="btn-ghost btn-sm" onClick={() => { dispatch({ type: 'unblock', userId: id }); toast('Membre débloqué'); }}>Débloquer</button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1 text-sm text-ink-2">Personne. Tu peux bloquer un membre depuis son profil.</p>}
          </div>
          <div className="p-6">
            <p className="text-sm font-semibold">Mes signalements</p>
            {state.reports.length ? (
              <ul className="mt-3 space-y-2">
                {state.reports.map((r) => (
                  <li key={r.id} className="text-sm text-ink-2">
                    <span className="font-medium text-ink">{r.reason}</span> · {r.targetType === 'user' ? getUser(r.targetId)?.firstName : r.targetType === 'activity' ? getActivity(r.targetId)?.title : 'un message'} · {timeAgo(r.at)} · <span className="chip bg-cream-2 text-ink-3">Reçu (démo)</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1 text-sm text-ink-2">Aucun signalement envoyé.</p>}
          </div>
        </div>
      </section>

      <section id="charte" className="scroll-mt-24">
        <h2 className="mb-3 text-2xl">Charte de la communauté</h2>
        <GuidelinesList />
        <div className="mt-4 card p-6">
          <p className="font-semibold">Ce que nous attendons des organisateur·rices</p>
          <ul className="mt-3 space-y-2">
            {ORGANIZER_EXPECTATIONS.map((e) => <li key={e} className="flex gap-2 text-sm text-ink-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-matcha" /> {e}</li>)}
          </ul>
        </div>
        <div className="mt-4 card p-6">
          <p className="font-semibold">Contenus publiés par les membres</p>
          <p className="mt-2 text-sm text-ink-2">Les messages de groupe sont visibles uniquement par les participant·es. Tout message peut être signalé ; en production, les contenus signalés sont examinés par une équipe de modération sous 24 h, et les comptes en infraction répétée sont suspendus.</p>
        </div>
      </section>

      <section id="securite" className="scroll-mt-24">
        <h2 className="mb-3 text-2xl">Se rencontrer en confiance</h2>
        <div className="card p-6">
          <ul className="space-y-3">
            {SAFETY_TIPS.map((tip) => <li key={tip} className="flex gap-3 text-sm text-ink-2"><Icon name="shield" className="mt-0.5 size-4 shrink-0 text-matcha" /> {tip}</li>)}
          </ul>
        </div>
      </section>

      <section id="donnees" className="scroll-mt-24">
        <h2 className="mb-3 text-2xl">Mes données</h2>
        <div className="card p-6">
          <p className="text-sm text-ink-2">Kizuna ne collecte que ce qui sert aux recommandations : prénom, ville, passions, disponibilités et préférences. Pas de photo obligatoire, pas de données sensibles. Dans ce prototype, tout reste dans ton navigateur (localStorage).</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={exportData}><Icon name="arrowRight" className="size-4 rotate-90" /> {__EMBEDDED__ ? 'Copier mes données (JSON)' : 'Exporter mes données (JSON)'}</button>
            <button className="btn-ghost text-sakura-deep" onClick={() => setDeleteOpen(true)}><Icon name="x" className="size-4" /> Supprimer mon compte</button>
          </div>
        </div>
      </section>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer ton compte ?">
        <p className="text-sm text-ink-2">Ton profil, tes inscriptions, tes guildes et tes messages seront effacés. Dans la démo, cela réinitialise simplement l’application.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setDeleteOpen(false)}>Annuler</button>
          <button className="btn-primary" onClick={() => { navigate('/'); dispatch({ type: 'reset' }); }}>Supprimer définitivement</button>
        </div>
      </Modal>
    </div>
  );
}
