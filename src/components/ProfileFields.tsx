// Field groups shared by onboarding and profile editing.
import { useState } from 'react';
import type { EnergyId, FormatPref, GroupSizeId, LevelId, Profile, SlotId } from '../data/types';
import { CITIES, ENERGIES, GROUP_SIZES, INTERESTS, INTEREST_GROUP_LABELS, LANGUAGES, LEVELS, SLOTS } from '../data/taxonomy';

type Patch = (p: Partial<Profile>) => void;

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="toggle-pill" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

export function CityFields({ p, set }: { p: Profile; set: Patch }) {
  return (
    <div className="space-y-6">
      <div>
        <span className="label">Ta ville</span>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button key={c.id} type="button" disabled={!c.available} className="toggle-pill disabled:cursor-not-allowed disabled:opacity-40" aria-pressed={p.city === c.id} onClick={() => set({ city: c.id })}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-3">Lancement à Lyon et Villeurbanne. Les autres villes ouvriront selon la demande.</p>
      </div>
      <div>
        <label className="label" htmlFor="neighborhood">Ton quartier <span className="font-normal text-ink-3">(facultatif)</span></label>
        <input id="neighborhood" className="input" value={p.neighborhood ?? ''} onChange={(e) => set({ neighborhood: e.target.value })} placeholder="Ex. Croix-Rousse, Guillotière…" maxLength={40} />
      </div>
      <div>
        <label className="label" htmlFor="distance">Distance maximale : <span className="text-sakura-deep">{p.distanceKm} km</span></label>
        <input id="distance" type="range" min={1} max={15} value={p.distanceKm} onChange={(e) => set({ distanceKm: Number(e.target.value) })} className="w-full accent-sakura" />
        <div className="flex justify-between text-xs text-ink-3"><span>À pied</span><span>Toute la métropole</span></div>
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
        <input type="checkbox" checked={!!p.newInTown} onChange={(e) => set({ newInTown: e.target.checked })} className="size-4 accent-sakura" />
        Je viens d’arriver dans la ville — montre-moi les quêtes accueillantes pour les nouveaux.
      </label>
    </div>
  );
}

export function LevelFields({ p, set }: { p: Profile; set: Patch }) {
  return (
    <div className="grid gap-3">
      {LEVELS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => set({ level: l.id as LevelId })}
          aria-pressed={p.level === l.id}
          className="tile p-4"
        >
          <p className="font-display font-black">{l.label}</p>
          <p className="text-sm text-ink-2">{l.description}</p>
        </button>
      ))}
      <p className="text-sm text-ink-3">Pas de quiz, pas de jugement : cela sert seulement à te proposer des activités au bon niveau.</p>
    </div>
  );
}

export function InterestFields({ p, set }: { p: Profile; set: Patch }) {
  const [q, setQ] = useState('');
  const groups = Object.keys(INTEREST_GROUP_LABELS) as (keyof typeof INTEREST_GROUP_LABELS)[];
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return (
    <div className="space-y-6">
      <input className="input" placeholder="Rechercher (ex. Ghibli, cosplay, japonais…)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un centre d’intérêt" />
      {groups.map((g) => {
        const items = INTERESTS.filter((i) => i.group === g && norm(i.label).includes(norm(q)));
        if (!items.length) return null;
        return (
          <div key={g}>
            <p className="eyebrow mb-2">{INTEREST_GROUP_LABELS[g]}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((i) => (
                <Pill key={i.id} active={p.interests.includes(i.id)} onClick={() => set({ interests: toggle(p.interests, i.id) })}>
                  {i.label}
                </Pill>
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-sm text-ink-2">
        <span className="font-semibold text-ink">{p.interests.length}</span> sélectionné{p.interests.length > 1 ? 's' : ''}. Mélange les univers : on te proposera des quêtes qui traversent tes passions. Les titres d’œuvres sont de simples étiquettes, sans lien officiel.
      </p>
    </div>
  );
}

export function EnergyFields({ p, set }: { p: Profile; set: Patch }) {
  return (
    <div className="space-y-6">
      <div>
        <span className="label">Quelles ambiances te conviennent ? <span className="font-normal text-ink-3">(plusieurs choix)</span></span>
        <div className="grid gap-2 sm:grid-cols-2">
          {ENERGIES.map((e) => (
            <button
              key={e.id}
              type="button"
              aria-pressed={p.energy.includes(e.id)}
              onClick={() => set({ energy: toggle(p.energy, e.id as EnergyId) })}
              className="tile p-3.5"
            >
              <p className="text-sm font-black">{e.emoji} {e.label}</p>
              <p className="text-xs text-ink-2">{e.description}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Taille d’équipe préférée</span>
        <div className="flex flex-wrap gap-2">
          {GROUP_SIZES.map((g) => (
            <Pill key={g.id} active={p.groupSize === g.id} onClick={() => set({ groupSize: g.id as GroupSizeId })}>{g.label}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AvailabilityFields({ p, set }: { p: Profile; set: Patch }) {
  const formats: { id: FormatPref; label: string; text: string }[] = [
    { id: 'recurrent', label: 'Guildes récurrentes', text: 'Revoir les mêmes personnes régulièrement.' },
    { id: 'ponctuel', label: 'Quêtes ponctuelles', text: 'Découvrir sans engagement.' },
    { id: 'les-deux', label: 'Les deux', text: 'Je commence ponctuel, je reste si ça accroche.' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <span className="label">Quand es-tu disponible ?</span>
        <div className="flex flex-wrap gap-2">
          {SLOTS.map((s) => (
            <Pill key={s.id} active={p.availability.includes(s.id)} onClick={() => set({ availability: toggle(p.availability, s.id as SlotId) })}>{s.label}</Pill>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Ce que tu recherches</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {formats.map((f) => (
            <button key={f.id} type="button" aria-pressed={p.format === f.id} onClick={() => set({ format: f.id })}
              className="tile p-3.5">
              <p className="text-sm font-black">{f.label}</p>
              <p className="text-xs text-ink-2">{f.text}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AboutFields({ p, set }: { p: Profile; set: Patch }) {
  return (
    <div className="space-y-6">
      <div>
        <span className="label">Langues parlées</span>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <Pill key={l} active={p.languages.includes(l)} onClick={() => set({ languages: toggle(p.languages, l) })}>{l}</Pill>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="bio">Quelques mots sur toi <span className="font-normal text-ink-3">(facultatif)</span></label>
        <textarea id="bio" className="input min-h-28" maxLength={240} value={p.bio} onChange={(e) => set({ bio: e.target.value })}
          placeholder="Ex. Je viens d’arriver à Lyon, je regarde surtout du slice of life et j’aimerais apprendre le japonais." />
        <p className="mt-1 text-right text-xs text-ink-3">{p.bio.length}/240 · Évite d’indiquer ton nom de famille, ton adresse ou ton numéro.</p>
      </div>
    </div>
  );
}
