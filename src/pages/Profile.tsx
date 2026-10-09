import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { DEMO_RECIPROCATORS, useApp } from '../store/AppContext';
import type { Profile } from '../data/types';
import { Icon } from '../components/Icon';
import { Avatar, CategoryDot, Modal } from '../components/ui';
import { AboutFields, AvailabilityFields, CityFields, EnergyFields, InterestFields, LevelFields } from '../components/ProfileFields';
import { ReportDialog } from '../components/ReportDialog';
import { useToast } from '../components/Toast';
import { ENERGIES, GROUP_SIZES, INTEREST_GROUP_LABELS, SLOTS, interestById, interestLabel, levelLabel } from '../data/taxonomy';
import { formatShortDay } from '../lib/format';
import { ME } from '../store/state';

const SECTIONS = [
  { key: 'ville', label: 'Ville & distance', C: CityFields },
  { key: 'niveau', label: 'Niveau', C: LevelFields },
  { key: 'interets', label: 'Passions', C: InterestFields },
  { key: 'energie', label: 'Énergie sociale & groupe', C: EnergyFields },
  { key: 'dispo', label: 'Disponibilités & format', C: AvailabilityFields },
  { key: 'toi', label: 'Langues & bio', C: AboutFields },
] as const;

/** Interest graph: interests grouped by type, with what's shared highlighted. */
function InterestGraph({ interests, highlight }: { interests: string[]; highlight?: string[] }) {
  const groups = Object.keys(INTEREST_GROUP_LABELS) as (keyof typeof INTEREST_GROUP_LABELS)[];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((g) => {
        const items = interests.filter((i) => interestById(i)?.group === g);
        if (!items.length) return null;
        return (
          <div key={g} className="rounded-2xl bg-paper p-4">
            <p className="eyebrow mb-2">{INTEREST_GROUP_LABELS[g]}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((i) => (
                <span key={i} className={`chip ${highlight?.includes(i) ? 'bg-shu text-white' : 'bg-white text-ink-2 ring-1 ring-line'}`}>{interestLabel(i)}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MyProfile() {
  const { me, dispatch, state } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [nameOpen, setNameOpen] = useState(false);
  if (!me) return <Navigate to="/onboarding" replace />;

  const open = (key: string) => { setDraft(me); setEditing(key); };
  const save = () => {
    if (!draft) return;
    if (draft.interests.length < 3) return toast('Garde au moins 3 centres d’intérêt.');
    dispatch({ type: 'saveProfile', profile: draft });
    setEditing(null);
    toast('Profil mis à jour');
  };
  const section = SECTIONS.find((s) => s.key === editing);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card overflow-hidden">
        <div className="h-24 bg-shu-soft screentone text-shu/30" />
        <div className="-mt-12 px-6 pb-6">
          <Avatar user={me} size="xl" ring />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold">{me.firstName}{state.privacy.showAge && me.age ? `, ${me.age}` : ''}</h1>
              <p className="text-ink-2">{me.city}{state.privacy.showNeighborhood && me.neighborhood ? ` · ${me.neighborhood}` : ''} · {levelLabel(me.level)}{me.newInTown ? ' · Nouveau·elle en ville' : ''}</p>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => { setNameDraft(me.firstName); setNameOpen(true); }}>Modifier le prénom</button>
          </div>
          {me.bio && <p className="mt-4 text-ink-2">{me.bio}</p>}
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-3"><Icon name="lock" className="inline size-3.5" /> Les autres membres voient ton prénom, ton quartier (si activé), ta bio et tes passions. Jamais ton e-mail. <Link to="/parametres" className="font-semibold text-ai">Confidentialité</Link></p>

      <section className="mt-8 card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mon graphe de passions</h2>
          <button className="text-sm font-semibold text-ai" onClick={() => open('interets')}>Modifier</button>
        </div>
        <p className="mt-1 mb-4 text-sm text-ink-2">Tes recommandations traversent toutes ces passions, pas une seule.</p>
        <InterestGraph interests={me.interests} />
      </section>

      <section className="mt-6 card divide-y divide-line">
        {[
          { key: 'ville', label: 'Ville & distance', value: `${me.city}${me.neighborhood ? ` · ${me.neighborhood}` : ''} · ${me.distanceKm} km max` },
          { key: 'niveau', label: 'Niveau', value: levelLabel(me.level) },
          { key: 'energie', label: 'Énergie & groupe', value: `${me.energy.map((e) => ENERGIES.find((x) => x.id === e)?.label).join(', ')} · ${GROUP_SIZES.find((g) => g.id === me.groupSize)?.label}` },
          { key: 'dispo', label: 'Disponibilités', value: `${me.availability.map((s) => SLOTS.find((x) => x.id === s)?.label).join(', ') || '—'} · ${me.format === 'recurrent' ? 'Groupes récurrents' : me.format === 'ponctuel' ? 'Activités ponctuelles' : 'Récurrent & ponctuel'}` },
          { key: 'toi', label: 'Langues & bio', value: me.languages.join(', ') },
        ].map((r) => (
          <div key={r.key} className="flex items-start justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-sm font-semibold">{r.label}</p>
              <p className="text-sm text-ink-2">{r.value}</p>
            </div>
            <button className="shrink-0 text-sm font-semibold text-ai" onClick={() => open(r.key)}>Modifier</button>
          </div>
        ))}
      </section>

      <Modal open={!!section} onClose={() => setEditing(null)} title={section?.label ?? ''}>
        {section && draft && <section.C p={draft} set={(patch) => setDraft((d) => ({ ...d!, ...patch }))} />}
        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 bg-paper pt-3">
          <button className="btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
          <button className="btn-primary" onClick={save}>Enregistrer</button>
        </div>
      </Modal>
      <Modal open={nameOpen} onClose={() => setNameOpen(false)} title="Ton prénom">
        <input className="input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={30} aria-label="Prénom" />
        {nameDraft.trim().length < 2 && <p className="mt-1 text-sm text-shu-dark">2 caractères minimum.</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setNameOpen(false)}>Annuler</button>
          <button className="btn-primary" disabled={nameDraft.trim().length < 2} onClick={() => { dispatch({ type: 'saveProfile', profile: { ...me, firstName: nameDraft.trim() } }); setNameOpen(false); toast('Prénom mis à jour'); }}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}

export function MemberProfile() {
  const { id = '' } = useParams();
  const { getUser, me, state, activities, isJoined, isPast, communities, isMember, dispatch, familiarIds } = useApp();
  const toast = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  if (id === ME) return <Navigate to="/profil" replace />;
  const u = getUser(id);
  if (!u) return <Navigate to="/accueil" replace />;

  const blocked = state.blocked.includes(id);
  const connection = state.connections.find((c) => c.userId === id);
  const shared = u.interests.filter((i) => me?.interests.includes(i));
  const together = activities.filter((a) => isJoined(a.id) && a.participantIds.includes(id)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const sharedCircles = communities.filter((c) => isMember(c.id) && c.memberIds.includes(id));
  const met = familiarIds.has(id);

  if (blocked) {
    return (
      <div className="mx-auto max-w-xl card p-8 text-center">
        <Icon name="ban" className="mx-auto size-8 text-ink-3" />
        <h1 className="mt-3 text-2xl font-semibold">Tu as bloqué ce membre</h1>
        <p className="mt-2 text-sm text-ink-2">Vous ne voyez plus vos messages respectifs et il ne peut pas te demander en connexion.</p>
        <button className="btn-ghost mt-5" onClick={() => { dispatch({ type: 'unblock', userId: id }); toast('Membre débloqué'); }}>Débloquer</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card overflow-hidden">
        <div className="h-24 screentone" style={{ background: `hsl(${u.avatarHue} 55% 92%)`, color: `hsl(${u.avatarHue} 45% 70%)` }} />
        <div className="-mt-12 px-6 pb-6">
          <Avatar user={u} size="xl" ring />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold">{u.firstName}</h1>
              <p className="text-ink-2">{u.neighborhood ?? u.city} · {levelLabel(u.level)}{u.newInTown ? ' · Nouveau·elle en ville' : ''}</p>
              <p className="mt-1 text-xs text-ink-3">Membre fictif (démo)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {connection?.status === 'mutuelle' ? (
                <span className="chip bg-ai-soft px-3 py-2 text-sm text-ai"><Icon name="check" className="size-4" /> En contact</span>
              ) : connection ? (
                <span className="chip bg-paper-2 px-3 py-2 text-sm text-ink-2">Demande envoyée</span>
              ) : met && state.privacy.allowConnectionRequests ? (
                <button className="btn-ai btn-sm" onClick={() => {
                  const mutual = DEMO_RECIPROCATORS.has(id);
                  dispatch({ type: 'requestConnection', userId: id, mutual });
                  toast(mutual ? `${u.firstName} souhaitait aussi rester en contact !` : 'Demande envoyée. Elle restera discrète tant qu’elle n’est pas réciproque.');
                }}>
                  <Icon name="wave" className="size-4" /> Rester en contact
                </button>
              ) : null}
            </div>
          </div>
          {u.bio && <p className="mt-4 text-ink-2">{u.bio}</p>}
          {!met && <p className="mt-4 rounded-xl bg-paper p-3 text-sm text-ink-2">Vous ne vous êtes pas encore rencontré·es. La connexion devient possible après une activité commune.</p>}
        </div>
      </div>

      <section className="mt-6 card p-6">
        <h2 className="text-xl font-semibold">Passions {shared.length > 0 && <span className="text-base font-normal text-ink-2">· {shared.length} en commun avec toi</span>}</h2>
        <div className="mt-4"><InterestGraph interests={u.interests} highlight={shared} /></div>
      </section>

      {(together.length > 0 || sharedCircles.length > 0) && (
        <section className="mt-6 card p-6">
          <h2 className="text-xl font-semibold">Votre histoire commune</h2>
          {sharedCircles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sharedCircles.map((c) => <Link key={c.id} to={`/cercles/${c.id}`} className="chip bg-ai-soft text-ai hover:underline"><Icon name="circles" className="size-3.5" /> {c.name}</Link>)}
            </div>
          )}
          <ul className="mt-4 space-y-2">
            {together.map((a) => (
              <li key={a.id}>
                <Link to={`/activites/${a.id}`} className="flex items-center gap-2 text-sm hover:underline">
                  <CategoryDot id={a.categoryId} /> {a.title} <span className="text-ink-3">· {formatShortDay(a.startsAt)}{isPast(a) ? '' : ' (à venir)'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <button className="inline-flex items-center gap-1.5 text-ink-3 hover:text-shu" onClick={() => setReportOpen(true)}><Icon name="flag" className="size-4" /> Signaler</button>
        <button className="inline-flex items-center gap-1.5 text-ink-3 hover:text-shu" onClick={() => setBlockOpen(true)}><Icon name="ban" className="size-4" /> Bloquer</button>
        {connection && <button className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink" onClick={() => { dispatch({ type: 'removeConnection', userId: id }); toast('Connexion retirée'); }}><Icon name="x" className="size-4" /> Retirer la connexion</button>}
      </div>

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={id} targetLabel={u.firstName} allowBlock />
      <Modal open={blockOpen} onClose={() => setBlockOpen(false)} title={`Bloquer ${u.firstName} ?`}>
        <p className="text-sm text-ink-2">Vous ne verrez plus vos messages respectifs, {u.firstName} sera masqué·e de tes listes et ne pourra plus te demander en connexion. {u.firstName} n’est pas notifié·e.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setBlockOpen(false)}>Annuler</button>
          <button className="btn-primary" onClick={() => { dispatch({ type: 'block', userId: id }); setBlockOpen(false); toast('Membre bloqué'); }}>Bloquer</button>
        </div>
      </Modal>
    </div>
  );
}
