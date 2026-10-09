import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import type { Activity, CategoryId, EnergyId, Recurrence } from '../data/types';
import { CATEGORIES, ENERGIES, INTERESTS } from '../data/taxonomy';
import { ME, uid } from '../store/state';
import { Pill } from '../components/ProfileFields';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function Propose() {
  const { communities, isMember, getCommunity, dispatch, me } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const preCircle = params.get('cercle') ?? '';
  const circle = preCircle ? getCommunity(preCircle) : undefined;
  const myCircles = communities.filter((c) => isMember(c.id));
  const nextWeek = new Date(Date.now() + 7 * 86400000);

  const [f, setF] = useState({
    title: '',
    categoryId: (circle?.categoryId ?? 'anime') as CategoryId,
    description: '',
    date: toDateInput(nextWeek),
    time: '15:00',
    durationMin: 120,
    venue: '',
    district: '',
    priceMin: 0,
    priceMax: 0,
    maxParticipants: 6,
    level: 'tous' as Activity['level'],
    energy: 'social' as EnergyId,
    tags: circle?.tags.slice(0, 3) ?? ([] as string[]),
    recurrence: (circle ? 'mensuel' : null) as Recurrence,
    communityId: circle && isMember(circle.id) ? circle.id : '',
    publicPlace: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const startsAt = new Date(`${f.date}T${f.time}`);
    if (f.title.trim().length < 5) err.title = 'Donne un titre d’au moins 5 caractères.';
    if (f.description.trim().length < 20) err.description = 'Décris l’activité en quelques phrases (20 caractères minimum).';
    if (isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) err.date = 'Choisis une date à venir.';
    if (f.venue.trim().length < 3) err.venue = 'Indique un lieu public précis.';
    if (f.maxParticipants < 3 || f.maxParticipants > 30) err.maxParticipants = 'Entre 3 et 30 personnes.';
    if (f.priceMax < f.priceMin) err.price = 'Le prix max doit être supérieur au prix min.';
    if (!f.tags.length) err.tags = 'Choisis au moins une passion liée.';
    if (!f.publicPlace) err.publicPlace = 'Les activités doivent avoir lieu dans un lieu public.';
    setErrors(err);
    if (Object.keys(err).length) {
      toast('Quelques champs sont à compléter');
      return;
    }
    const activity: Activity = {
      id: uid('a'),
      title: f.title.trim(),
      categoryId: f.categoryId,
      description: f.description.trim(),
      startsAt: startsAt.toISOString(),
      durationMin: f.durationMin,
      venue: f.venue.trim(),
      address: f.venue.trim(),
      district: f.district.trim() || 'Lyon',
      distanceKm: 2,
      priceMin: f.priceMin,
      priceMax: f.priceMax,
      maxParticipants: f.maxParticipants,
      participantIds: [],
      level: f.level,
      organizerId: ME,
      communityId: f.communityId || undefined,
      recurrence: f.recurrence,
      energy: f.energy,
      tags: f.tags,
      language: me?.languages[0] ?? 'Français',
      firstTimerFriendly: f.level !== 'confirme',
      icebreakers: ['Qu’est-ce qui t’a donné envie de venir ?'],
      userCreated: true,
    };
    dispatch({ type: 'createActivity', activity });
    navigate(`/activites/${activity.id}`);
  };

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-sm text-sakura-deep">{errors[k]}</p> : null);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={circle ? `/guildes/${circle.id}` : '/activites'} className="mb-5 flex w-fit items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"><Icon name="arrowLeft" className="size-4" /> Retour</Link>
      <span className="sticker bg-white text-sakura-deep"><span className="font-jp">依頼</span> {circle ? `Nouvel épisode pour « ${circle.name} »` : 'Organiser'}</span>
      <h1 className="mt-2 font-manga text-4xl font-normal md:text-5xl">{circle ? 'Proposer un épisode' : 'Proposer une quête'}</h1>
      <p className="mt-2 font-semibold text-ink-2">Petite équipe, lieu public, prix clair : c’est tout ce qu’il faut pour une bonne quête.</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-6">
        <div>
          <label className="label" htmlFor="title">Titre</label>
          <input id="title" className="input" value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex. Soirée manga & thé au jasmin" maxLength={80} />
          <Err k="title" />
        </div>
        <div>
          <span className="label">Catégorie</span>
          <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Pill key={c.id} active={f.categoryId === c.id} onClick={() => set({ categoryId: c.id })}>{c.label}</Pill>)}</div>
        </div>
        <div>
          <label className="label" htmlFor="desc">Description</label>
          <textarea id="desc" className="input min-h-28" value={f.description} onChange={(e) => set({ description: e.target.value })} maxLength={600} placeholder="Ce que vous allez faire, pour qui c’est pensé, ce qu’il faut apporter…" />
          <Err k="description" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="date">Date</label><input id="date" type="date" className="input" value={f.date} min={toDateInput(new Date())} onChange={(e) => set({ date: e.target.value })} /></div>
          <div><label className="label" htmlFor="time">Heure</label><input id="time" type="time" className="input" value={f.time} onChange={(e) => set({ time: e.target.value })} /></div>
          <div>
            <label className="label" htmlFor="dur">Durée</label>
            <select id="dur" className="input" value={f.durationMin} onChange={(e) => set({ durationMin: Number(e.target.value) })}>
              {[60, 90, 120, 150, 180, 240].map((d) => <option key={d} value={d}>{d >= 60 ? `${Math.floor(d / 60)} h${d % 60 ? ' 30' : ''}` : `${d} min`}</option>)}
            </select>
          </div>
        </div>
        <Err k="date" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="venue">Lieu public</label>
            <input id="venue" className="input" value={f.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="Café, parc, bar à jeux, médiathèque…" />
            <Err k="venue" />
          </div>
          <div>
            <label className="label" htmlFor="district">Quartier</label>
            <input id="district" className="input" value={f.district} onChange={(e) => set({ district: e.target.value })} placeholder="Ex. Croix-Rousse" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="pmin">Prix min (€)</label><input id="pmin" type="number" min={0} className="input" value={f.priceMin} onChange={(e) => set({ priceMin: Math.max(0, Number(e.target.value)) })} /></div>
          <div><label className="label" htmlFor="pmax">Prix max (€)</label><input id="pmax" type="number" min={0} className="input" value={f.priceMax} onChange={(e) => set({ priceMax: Math.max(0, Number(e.target.value)) })} /></div>
          <div><label className="label" htmlFor="max">Places</label><input id="max" type="number" min={3} max={30} className="input" value={f.maxParticipants} onChange={(e) => set({ maxParticipants: Number(e.target.value) })} /></div>
        </div>
        <Err k="price" /><Err k="maxParticipants" />
        <div>
          <span className="label">Ambiance</span>
          <div className="flex flex-wrap gap-2">{ENERGIES.map((e) => <Pill key={e.id} active={f.energy === e.id} onClick={() => set({ energy: e.id })}>{e.label}</Pill>)}</div>
        </div>
        <div>
          <span className="label">Niveau</span>
          <div className="flex flex-wrap gap-2">
            {([['debutant', 'Débutant·es bienvenu·es'], ['tous', 'Tous niveaux'], ['confirme', 'Confirmé·es']] as const).map(([v, l]) => <Pill key={v} active={f.level === v} onClick={() => set({ level: v })}>{l}</Pill>)}
          </div>
        </div>
        <div>
          <span className="label">Passions liées</span>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-line bg-white p-3">
            {INTERESTS.map((i) => <Pill key={i.id} active={f.tags.includes(i.id)} onClick={() => set({ tags: f.tags.includes(i.id) ? f.tags.filter((t) => t !== i.id) : [...f.tags, i.id] })}>{i.label}</Pill>)}
          </div>
          <Err k="tags" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rec">Rythme</label>
            <select id="rec" className="input" value={f.recurrence ?? ''} onChange={(e) => set({ recurrence: (e.target.value || null) as Recurrence })}>
              <option value="">Ponctuelle</option>
              <option value="hebdo">Chaque semaine</option>
              <option value="bimensuel">Toutes les 2 semaines</option>
              <option value="mensuel">Chaque mois</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="circle">Guilde</label>
            <select id="circle" className="input" value={f.communityId} onChange={(e) => set({ communityId: e.target.value })}>
              <option value="">Aucune — quête ouverte à tous</option>
              {myCircles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-sakura" checked={f.publicPlace} onChange={(e) => set({ publicPlace: e.target.checked })} />
          <span>Je confirme que l’activité a lieu dans un lieu public, que le prix indiqué est exact, et je m’engage à respecter la charte organisateur.<Err k="publicPlace" /></span>
        </label>
        <div className="flex justify-end gap-2">
          <Link to="/activites" className="btn-ghost">Annuler</Link>
          <button type="submit" className="btn-primary">Publier la quête</button>
        </div>
        <p className="text-right text-xs text-ink-3">Démo : la quête est visible uniquement dans ce navigateur.</p>
      </form>
    </div>
  );
}
