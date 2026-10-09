import type { AvatarConfig } from '../data/types';
import { ACCESSORIES, AVATAR_BGS, AnimeAvatar, EXPRESSIONS, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, OUTFITS, SKIN_TONES } from './art/AnimeAvatar';
import { Icon } from './Icon';

function Swatches({ label, colors, value, onChange, names }: { label: string; colors: string[]; value: number; onChange: (i: number) => void; names?: string[] }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {colors.map((c, i) => (
          <button
            key={c + i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={names?.[i] ?? `${label} ${i + 1}`}
            title={names?.[i]}
            onClick={() => onChange(i)}
            className={`size-8 rounded-full border-2 transition ${value === i ? 'scale-110 border-edge ring-2 ring-sakura ring-offset-2 ring-offset-cream' : 'border-ink/30 hover:border-ink-3'}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

function Options({ label, options, value, onChange }: { label: string; options: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o, i) => (
          <button key={o} type="button" className="toggle-pill px-3 py-1.5 text-xs" aria-pressed={value === i} onClick={() => onChange(i)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

const rnd = (n: number) => Math.floor(Math.random() * n);
export const randomAvatar = (): AvatarConfig => ({
  hair: rnd(HAIR_STYLES.length), hairColor: rnd(HAIR_COLORS.length), skin: rnd(SKIN_TONES.length), eyes: rnd(EYE_COLORS.length),
  outfit: rnd(OUTFITS.length), accessory: rnd(ACCESSORIES.length), expression: rnd(EXPRESSIONS.length), bg: rnd(AVATAR_BGS.length),
});

/** Character creator: live preview + parts. All parts are original drawings. */
export function AvatarEditor({ value, onChange, name }: { value: AvatarConfig; onChange: (v: AvatarConfig) => void; name?: string }) {
  const set = (patch: Partial<AvatarConfig>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3 md:sticky md:top-4 md:self-start">
        <div className="panel relative overflow-hidden p-2">
          <AnimeAvatar config={value} size={180} square />
          {name && <span className="sticker absolute bottom-3 left-1/2 -translate-x-1/2 bg-surface">{name}</span>}
        </div>
        <button type="button" className="btn-ghost btn-sm" onClick={() => onChange(randomAvatar())}>
          <Icon name="sparkle" className="size-4" /> Aléatoire
        </button>
      </div>
      <div className="space-y-5">
        <Options label="Coiffure" options={HAIR_STYLES} value={value.hair} onChange={(hair) => set({ hair })} />
        <Swatches label="Couleur des cheveux" colors={HAIR_COLORS.map((h) => h.base)} names={HAIR_COLORS.map((h) => h.name)} value={value.hairColor} onChange={(hairColor) => set({ hairColor })} />
        <Swatches label="Teint" colors={SKIN_TONES} value={value.skin} onChange={(skin) => set({ skin })} />
        <Swatches label="Couleur des yeux" colors={EYE_COLORS} value={value.eyes} onChange={(eyes) => set({ eyes })} />
        <Options label="Expression" options={EXPRESSIONS} value={value.expression} onChange={(expression) => set({ expression })} />
        <Swatches label="Tenue" colors={OUTFITS.map((o) => o.color)} names={OUTFITS.map((o) => o.name)} value={value.outfit} onChange={(outfit) => set({ outfit })} />
        <Options label="Accessoire" options={ACCESSORIES} value={value.accessory} onChange={(accessory) => set({ accessory })} />
        <Swatches label="Fond" colors={AVATAR_BGS} value={value.bg} onChange={(bg) => set({ bg })} />
      </div>
    </div>
  );
}
