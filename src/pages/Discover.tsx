import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { EmptyState } from '../components/ui';
import { Scene } from '../components/art/Scene';
import { Icon } from '../components/Icon';
import { CATEGORIES, ENERGIES, interestLabel } from '../data/taxonomy';
import { slotOf } from '../lib/matching';

type Sort = 'pertinence' | 'date' | 'distance';

export default function Discover() {
  const { activities, isPast, recommendFor, me } = useApp();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('pertinence');
  const [showFilters, setShowFilters] = useState(false);

  const cat = params.get('categorie') ?? '';
  const energy = params.get('energie') ?? '';
  const [onlyBeginner, setOnlyBeginner] = useState(false);
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyRecurring, setOnlyRecurring] = useState(false);
  const [onlyFamiliar, setOnlyFamiliar] = useState(false);
  const [onlyMySlots, setOnlyMySlots] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [maxKm, setMaxKm] = useState(me?.distanceKm ?? 15);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const query = norm(q.trim());
    const list = activities
      .filter((a) => !isPast(a))
      .filter((a) => !cat || a.categoryId === cat)
      .filter((a) => !energy || a.energy === energy)
      .filter((a) => !onlyBeginner || a.level === 'debutant')
      .filter((a) => !onlyFree || a.priceMin === 0)
      .filter((a) => !onlyRecurring || !!a.recurrence)
      .filter((a) => !onlyAvailable || a.participantIds.length < a.maxParticipants)
      .filter((a) => a.distanceKm <= maxKm)
      .filter((a) => !onlyMySlots || !!me?.availability.includes(slotOf(a.startsAt)))
      .filter((a) => !query || norm(`${a.title} ${a.description} ${a.district} ${a.tags.map(interestLabel).join(' ')}`).includes(query))
      .map((a) => ({ a, r: recommendFor(a) }))
      .filter((x) => !onlyFamiliar || x.r.familiar.length > 0);
    if (sort === 'pertinence') list.sort((x, y) => y.r.score - x.r.score);
    if (sort === 'date') list.sort((x, y) => x.a.startsAt.localeCompare(y.a.startsAt));
    if (sort === 'distance') list.sort((x, y) => x.a.distanceKm - y.a.distanceKm);
    return list.map((x) => x.a);
  }, [activities, isPast, cat, energy, onlyBeginner, onlyFree, onlyRecurring, onlyAvailable, maxKm, onlyMySlots, q, recommendFor, onlyFamiliar, sort, me]);

  const activeFilters = [onlyBeginner, onlyFree, onlyRecurring, onlyFamiliar, onlyMySlots, onlyAvailable, maxKm !== (me?.distanceKm ?? 15)].filter(Boolean).length;
  const reset = () => {
    setQ('');
    setParams({}, { replace: true });
    setOnlyBeginner(false); setOnlyFree(false); setOnlyRecurring(false); setOnlyFamiliar(false); setOnlyMySlots(false); setOnlyAvailable(false);
    setMaxKm(me?.distanceKm ?? 15);
  };

  const Check = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-sakura" /> {label}
    </label>
  );

  return (
    <div>
      <header className="panel relative overflow-hidden">
        <Scene scene="riverside" time="crepuscule" seed="board" className="absolute inset-y-0 right-0 h-full w-full md:w-[58%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/95 via-cream/90 to-cream/75 md:bg-gradient-to-r md:from-cream md:from-45% md:via-cream/85 md:via-62% md:to-cream/10" aria-hidden="true" />
        <div className="relative p-6 md:p-8">
          <span className="sticker bg-surface text-ink-2"><span className="font-jp text-sakura-deep">依頼</span> Lyon & Villeurbanne</span>
          <h1 className="mt-3 font-manga text-4xl font-normal md:text-5xl">Tableau des quêtes</h1>
          <p className="mt-2 max-w-md font-semibold text-ink-2">Toutes les activités à venir. Choisis selon tes passions… et ton énergie du jour.</p>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
          <input className="input pl-10" placeholder="Chercher une quête : Ghibli, ramen, tournoi, Croix-Rousse…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher une activité" />
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Trier">
            <option value="pertinence">Pour moi ✨</option>
            <option value="date">Date</option>
            <option value="distance">Distance</option>
          </select>
          <button className="btn-ghost" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <Icon name="filter" className="size-4" /> Filtres{activeFilters ? ` (${activeFilters})` : ''}
          </button>
        </div>
      </div>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Catégories">
        <button className="toggle-pill shrink-0" aria-pressed={!cat} onClick={() => setParam('categorie', '')}>Toutes les quêtes</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className="toggle-pill shrink-0" aria-pressed={cat === c.id} onClick={() => setParam('categorie', cat === c.id ? '' : c.id)}>
            <span className="mr-1.5 inline-block size-2.5 rounded-full border border-edge" style={{ background: c.color }} /> {c.label}
          </button>
        ))}
      </div>
      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Énergie sociale">
        {ENERGIES.map((e) => (
          <button key={e.id} className="toggle-pill shrink-0 text-xs" aria-pressed={energy === e.id} onClick={() => setParam('energie', energy === e.id ? '' : e.id)}>
            {e.emoji} {e.label}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="pop card mt-4 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Check checked={onlyBeginner} onChange={setOnlyBeginner} label="Débutant·es bienvenu·es" />
          <Check checked={onlyFree} onChange={setOnlyFree} label="Gratuit ou prix libre" />
          <Check checked={onlyRecurring} onChange={setOnlyRecurring} label="Groupes récurrents" />
          <Check checked={onlyFamiliar} onChange={setOnlyFamiliar} label="Avec des visages familiers" />
          <Check checked={onlyMySlots} onChange={setOnlyMySlots} label="Sur mes créneaux" />
          <Check checked={onlyAvailable} onChange={setOnlyAvailable} label="Places disponibles" />
          <div className="sm:col-span-2">
            <label className="text-sm" htmlFor="maxkm">Distance max. depuis le centre : <strong>{maxKm} km</strong></label>
            <input id="maxkm" type="range" min={1} max={15} value={maxKm} onChange={(e) => setMaxKm(Number(e.target.value))} className="w-full accent-sakura" />
          </div>
        </div>
      )}

      <div className="mt-6 mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-2"><strong className="text-ink">{results.length}</strong> quête{results.length > 1 ? 's' : ''} à venir</p>
        {(activeFilters > 0 || cat || energy || q) && <button className="text-sm font-semibold text-lav-deep" onClick={reset}>Réinitialiser</button>}
      </div>

      {results.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => <ActivityCard key={a.id} activity={a} />)}
        </div>
      ) : (
        <EmptyState icon="search" title="Aucune quête ne correspond" text="Essaie d’élargir la distance ou de retirer un filtre. Tu peux aussi proposer l’activité que tu cherches." action={<button className="btn-ghost btn-sm" onClick={reset}>Réinitialiser les filtres</button>} />
      )}
    </div>
  );
}
