import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { DEMO_RECIPROCATORS, useApp } from '../store/AppContext';
import type { AvatarConfig, Profile } from '../data/types';
import { Icon } from '../components/Icon';
import { CategoryDot, Modal, avatarOf } from '../components/ui';
import { AboutFields, AvailabilityFields, CityFields, EnergyFields, InterestFields, LevelFields } from '../components/ProfileFields';
import { AvatarEditor } from '../components/AvatarEditor';
import { AnimeAvatar, AVATAR_BGS } from '../components/art/AnimeAvatar';
import { CharacterCard, InterestBadge } from '../components/CharacterCard';
import { GuildCrest } from '../components/Guild';
import { ReportDialog } from '../components/ReportDialog';
import { useToast } from '../components/Toast';
import { ENERGIES, GROUP_SIZES, INTEREST_GROUP_LABELS, SLOTS, interestById, levelLabel } from '../data/taxonomy';
import { formatShortDay } from '../lib/format';
import { ME } from '../store/state';

const SECTIONS = [
  { key: 'ville', label: 'Ville & distance', C: CityFields },
  { key: 'niveau', label: 'Niveau', C: LevelFields },
  { key: 'interets', label: 'Passions', C: InterestFields },
  { key: 'energie', label: 'Énergie sociale & équipe', C: EnergyFields },
  { key: 'dispo', label: 'Disponibilités & format', C: AvailabilityFields },
  { key: 'toi', label: 'Langues & bio', C: AboutFields },
] as const;

/** Interest graph: interests grouped by family, with shared ones highlighted. */
function InterestGraph({ interests, highlight }: { interests: string[]; highlight?: string[] }) {
  const groups = Object.keys(INTEREST_GROUP_LABELS) as (keyof typeof INTEREST_GROUP_LABELS)[];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((g) => {
        const items = interests.filter((i) => interestById(i)?.group === g);
        if (!items.length) return null;
        return (
          <div key={g} className="rounded-2xl border-2 border-dashed border-line bg-cream p-4">
            <p className="eyebrow mb-2">{INTEREST_GROUP_LABELS[g]}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((i) => <InterestBadge key={i} id={i} highlight={highlight?.includes(i)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Portrait({ user, children }: { user: Profile; children?: React.ReactNode }) {
  const cfg = avatarOf(user);
  return (
    <div className="panel overflow-hidden">
      <div className="relative border-b-2 border-ink" style={{ background: AVATAR_BGS[cfg.bg % AVATAR_BGS.length] }}>
        <div className="screentone-lg absolute inset-0 text-ink opacity-10" aria-hidden="true" />
        <div className="speedlines absolute inset-[-50%] text-white opacity-30" aria-hidden="true" />
        <AnimeAvatar config={cfg} size={260} square className="relative mx-auto block h-auto w-full max-w-[260px]" title={`Avatar de ${user.firstName}`} />
        <span className="sticker absolute top-3 left-3 bg-white">{levelLabel(user.level)}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function MyProfile() {
  const { me, dispatch, state, activities, isPast, isJoined, communities, isMember } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState({ firstName: '', title: '' });
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<AvatarConfig | null>(null);
  if (!me) return <Navigate to="/onboarding" replace />;

  const open = (key: string) => { setDraft(me); setEditing(key); };
  const save = () => {
    if (!draft) return;
    if (draft.interests.length < 3) return toast('Garde au moins 3 centres d’intérêt.');
    dispatch({ type: 'saveProfile', profile: draft });
    setEditing(null);
    toast('Fiche personnage mise à jour');
  };
  const section = SECTIONS.find((s) => s.key === editing);
  const lived = activities.filter((a) => isPast(a) && isJoined(a.id)).length;
  const guilds = communities.filter((c) => isMember(c.id));

  return (
    <div>
      <div className="mb-6">
        <span className="sticker bg-white text-sakura-deep"><span className="font-jp">プロフィール</span> Fiche personnage</span>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Portrait user={me}>
            <h1 className="font-manga text-3xl font-normal">{me.firstName}{state.privacy.showAge && me.age ? `, ${me.age}` : ''}</h1>
            {me.title && <p className="font-bold text-sakura-deep">{me.title}</p>}
            <p className="mt-1 text-sm font-semibold text-ink-2">{me.city}{state.privacy.showNeighborhood && me.neighborhood ? ` · ${me.neighborhood}` : ''}{me.newInTown ? ' · nouveau·elle en ville' : ''}</p>
            {me.bio && <p className="bubble mt-4 text-sm font-semibold">{me.bio}</p>}
            <div className="mt-6 grid gap-2">
              <button className="btn-primary" onClick={() => { setAvatarDraft(avatarOf(me)); setAvatarOpen(true); }}><Icon name="sparkle" className="size-4" /> Modifier mon avatar</button>
              <button className="btn-ghost" onClick={() => { setNameDraft({ firstName: me.firstName, title: me.title ?? '' }); setNameOpen(true); }}>Prénom & titre</button>
            </div>
          </Portrait>
          <p className="text-xs font-semibold text-ink-3"><Icon name="lock" className="inline size-3.5" /> Les autres membres voient ton prénom, ton avatar, ton quartier (si activé), ta bio et tes passions. Jamais ton e-mail. <Link to="/parametres" className="font-extrabold text-lav-deep">Confidentialité</Link></p>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl"><span className="mr-2 font-jp text-sakura">好</span>Mon graphe de passions</h2>
              <button className="btn-ghost btn-sm" onClick={() => open('interets')}>Modifier</button>
            </div>
            <p className="mt-1 mb-4 text-sm font-semibold text-ink-2">Tes recommandations traversent toutes ces passions, pas une seule. Les titres d’œuvres sont de simples étiquettes.</p>
            <InterestGraph interests={me.interests} />
          </section>

          <section className="card p-6">
            <h2 className="text-xl"><span className="mr-2 font-jp text-sakura">旅</span>Mon parcours</h2>
            <p className="mt-1 text-xs font-semibold text-ink-3">Visible par toi seul·e. Ici, on ne collectionne pas les amis.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/historique" className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-sakura-pale p-4 hover:-translate-y-0.5">
                <span className="font-manga text-3xl text-sakura-deep">{lived}</span>
                <span className="text-sm font-bold">quête{lived > 1 ? 's' : ''} vécue{lived > 1 ? 's' : ''}<br /><span className="font-semibold text-ink-3">Journal d’aventure →</span></span>
              </Link>
              <Link to="/guildes" className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-lav-soft p-4 hover:-translate-y-0.5">
                <span className="flex -space-x-3">{guilds.slice(0, 3).map((g) => <GuildCrest key={g.id} categoryId={g.categoryId} className="size-10" />)}</span>
                <span className="text-sm font-bold">{guilds.length} guilde{guilds.length > 1 ? 's' : ''}<br /><span className="font-semibold text-ink-3">Mes guildes →</span></span>
              </Link>
            </div>
          </section>

          <section className="card divide-y-2 divide-line">
            {[
              { key: 'ville', label: 'Ville & distance', value: `${me.city}${me.neighborhood ? ` · ${me.neighborhood}` : ''} · ${me.distanceKm} km max` },
              { key: 'niveau', label: 'Niveau', value: levelLabel(me.level) },
              { key: 'energie', label: 'Ambiance & taille d’équipe', value: `${me.energy.map((e) => { const x = ENERGIES.find((y) => y.id === e); return x ? `${x.emoji} ${x.label}` : ''; }).join(', ')} · ${GROUP_SIZES.find((g) => g.id === me.groupSize)?.label}` },
              { key: 'dispo', label: 'Disponibilités', value: `${me.availability.map((s) => SLOTS.find((x) => x.id === s)?.label).join(', ') || '—'} · ${me.format === 'recurrent' ? 'Guildes récurrentes' : me.format === 'ponctuel' ? 'Quêtes ponctuelles' : 'Guildes & quêtes ponctuelles'}` },
              { key: 'toi', label: 'Langues & bio', value: me.languages.join(', ') },
            ].map((r) => (
              <div key={r.key} className="flex items-start justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-black">{r.label}</p>
                  <p className="text-sm font-semibold text-ink-2">{r.value}</p>
                </div>
                <button className="shrink-0 text-sm font-extrabold text-lav-deep" onClick={() => open(r.key)}>Modifier</button>
              </div>
            ))}
          </section>
        </div>
      </div>

      <Modal open={!!section} onClose={() => setEditing(null)} title={section?.label ?? ''}>
        {section && draft && <section.C p={draft} set={(patch) => setDraft((d) => ({ ...d!, ...patch }))} />}
        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 bg-cream pt-3">
          <button className="btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
          <button className="btn-primary" onClick={save}>Enregistrer</button>
        </div>
      </Modal>
      <Modal open={avatarOpen} onClose={() => setAvatarOpen(false)} title="Crée ton personnage" wide>
        {avatarDraft && <AvatarEditor value={avatarDraft} onChange={setAvatarDraft} name={me.firstName} />}
        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 bg-cream pt-3">
          <button className="btn-ghost" onClick={() => setAvatarOpen(false)}>Annuler</button>
          <button className="btn-primary" onClick={() => { dispatch({ type: 'saveProfile', profile: { ...me, avatar: avatarDraft! } }); setAvatarOpen(false); toast('Nouvel avatar enregistré ✨'); }}>Enregistrer l’avatar</button>
        </div>
      </Modal>
      <Modal open={nameOpen} onClose={() => setNameOpen(false)} title="Prénom & titre">
        <label className="label" htmlFor="pf-name">Prénom</label>
        <input id="pf-name" className="input" value={nameDraft.firstName} onChange={(e) => setNameDraft((d) => ({ ...d, firstName: e.target.value }))} maxLength={30} />
        {nameDraft.firstName.trim().length < 2 && <p className="mt-1 text-sm font-bold text-sakura-deep">2 caractères minimum.</p>}
        <label className="label mt-4" htmlFor="pf-title">Titre de personnage <span className="font-semibold text-ink-3">(facultatif)</span></label>
        <input id="pf-title" className="input" value={nameDraft.title} onChange={(e) => setNameDraft((d) => ({ ...d, title: e.target.value }))} maxLength={40} placeholder="Ex. Barde du karaoké, Stratège coopératif…" />
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setNameOpen(false)}>Annuler</button>
          <button className="btn-primary" disabled={nameDraft.firstName.trim().length < 2} onClick={() => { dispatch({ type: 'saveProfile', profile: { ...me, firstName: nameDraft.firstName.trim(), title: nameDraft.title.trim() || undefined } }); setNameOpen(false); toast('Fiche mise à jour'); }}>Enregistrer</button>
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
  const sharedGuilds = communities.filter((c) => isMember(c.id) && c.memberIds.includes(id));
  const met = familiarIds.has(id);

  if (blocked) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <Icon name="ban" className="mx-auto size-8 text-ink-3" />
        <h1 className="mt-3 text-2xl">Tu as bloqué ce membre</h1>
        <p className="mt-2 text-sm font-semibold text-ink-2">Vous ne voyez plus vos messages respectifs et il ne peut pas te demander en connexion.</p>
        <button className="btn-ghost mt-5" onClick={() => { dispatch({ type: 'unblock', userId: id }); toast('Membre débloqué'); }}>Débloquer</button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Portrait user={u}>
            <h1 className="font-manga text-3xl font-normal">{u.firstName}</h1>
            {u.title && <p className="font-bold text-sakura-deep">{u.title}</p>}
            <p className="mt-1 text-sm font-semibold text-ink-2">{u.neighborhood ?? u.city}{u.newInTown ? ' · nouveau·elle en ville' : ''}</p>
            <p className="mt-1 text-xs font-semibold text-ink-3">Personnage fictif (démo)</p>
            <div className="mt-5">
              {connection?.status === 'mutuelle' ? (
                <span className="sticker bg-lav-soft px-3 py-1.5 text-lav-deep"><Icon name="check" className="size-4" /> En contact</span>
              ) : connection ? (
                <span className="sticker bg-cream-2 px-3 py-1.5 text-ink-2">Demande envoyée (discrète)</span>
              ) : met && state.privacy.allowConnectionRequests ? (
                <button className="btn-lav w-full" onClick={() => {
                  const mutual = DEMO_RECIPROCATORS.has(id);
                  dispatch({ type: 'requestConnection', userId: id, mutual });
                  toast(mutual ? `${u.firstName} souhaitait aussi rester en contact !` : 'Demande envoyée. Elle restera discrète tant qu’elle n’est pas réciproque.');
                }}>
                  <Icon name="wave" className="size-4" /> Rester en contact
                </button>
              ) : null}
            </div>
          </Portrait>
          <div className="flex flex-wrap gap-4 px-1 text-sm font-bold">
            <button className="inline-flex items-center gap-1.5 text-ink-3 hover:text-sakura-deep" onClick={() => setReportOpen(true)}><Icon name="flag" className="size-4" /> Signaler</button>
            <button className="inline-flex items-center gap-1.5 text-ink-3 hover:text-sakura-deep" onClick={() => setBlockOpen(true)}><Icon name="ban" className="size-4" /> Bloquer</button>
            {connection && <button className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink" onClick={() => { dispatch({ type: 'removeConnection', userId: id }); toast('Connexion retirée'); }}><Icon name="x" className="size-4" /> Retirer la connexion</button>}
          </div>
        </div>

        <div className="space-y-6">
          {u.bio && <p className="bubble text-base font-semibold">{u.bio}</p>}
          {!met && <p className="rounded-2xl border-2 border-dashed border-line bg-white p-4 text-sm font-semibold text-ink-2">Vous ne vous êtes pas encore rencontré·es. La connexion devient possible après une quête commune.</p>}

          <section className="card p-6">
            <h2 className="text-xl">Passions {shared.length > 0 && <span className="text-base font-bold text-sakura-deep">· ★ {shared.length} en commun avec toi</span>}</h2>
            <div className="mt-4"><InterestGraph interests={u.interests} highlight={shared} /></div>
          </section>

          {(together.length > 0 || sharedGuilds.length > 0) && (
            <section className="card p-6">
              <h2 className="text-xl"><span className="mr-2 font-jp text-sakura">絆</span>Votre histoire commune</h2>
              {sharedGuilds.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {sharedGuilds.map((c) => (
                    <Link key={c.id} to={`/guildes/${c.id}`} className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-lav-soft py-1.5 pr-4 pl-2 text-sm font-black text-lav-deep hover:-translate-y-0.5">
                      <GuildCrest categoryId={c.categoryId} className="size-8" /> {c.name}
                    </Link>
                  ))}
                </div>
              )}
              <ul className="mt-4 space-y-2">
                {together.map((a) => (
                  <li key={a.id}>
                    <Link to={`/activites/${a.id}`} className="flex items-center gap-2 text-sm font-semibold hover:underline">
                      <CategoryDot id={a.categoryId} /> {a.title} <span className="text-ink-3">· {formatShortDay(a.startsAt)}{isPast(a) ? '' : ' (à venir)'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {me && (
            <section>
              <p className="eyebrow mb-3">Toi, vu par l’équipe</p>
              <div className="max-w-xs"><CharacterCard user={me} highlight={shared} maxBadges={5} /></div>
            </section>
          )}
        </div>
      </div>

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={id} targetLabel={u.firstName} allowBlock />
      <Modal open={blockOpen} onClose={() => setBlockOpen(false)} title={`Bloquer ${u.firstName} ?`}>
        <p className="text-sm font-semibold text-ink-2">Vous ne verrez plus vos messages respectifs, {u.firstName} sera masqué·e de tes listes et ne pourra plus te demander en connexion. {u.firstName} n’est pas notifié·e.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setBlockOpen(false)}>Annuler</button>
          <button className="btn-primary" onClick={() => { dispatch({ type: 'block', userId: id }); setBlockOpen(false); toast('Membre bloqué'); }}>Bloquer</button>
        </div>
      </Modal>
    </div>
  );
}
