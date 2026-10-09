// Simple, transparent rule-based recommendations.
// This is NOT a validated compatibility model: each rule adds points and a
// human-readable reason, and the UI shows the reasons rather than a "% match".
import type { Activity, Profile, SlotId } from '../data/types';
import { GROUP_SIZES, energyById, interestLabel } from '../data/taxonomy';

export function slotOf(iso: string): SlotId {
  const d = new Date(iso);
  const day = d.getDay();
  const h = d.getHours();
  const part = h < 12 ? 'matin' : h < 18 ? 'aprem' : 'soir';
  if (day === 6) return `samedi-${part}` as SlotId;
  if (day === 0) return `dimanche-${part}` as SlotId;
  return 'semaine-soir';
}

export interface Recommendation {
  score: number;
  reasons: string[];
  sharedInterests: string[];
  familiar: string[]; // ids of known people taking part
}

export interface MatchContext {
  familiarIds: Set<string>;
  myCommunityIds: Set<string>;
}

const joinFr = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;

export function recommend(profile: Profile, activity: Activity, ctx: MatchContext, participantIds = activity.participantIds): Recommendation {
  const reasons: string[] = [];
  let score = 0;

  const sharedInterests = activity.tags.filter((t) => profile.interests.includes(t));
  if (sharedInterests.length) {
    score += 3 * sharedInterests.length;
    reasons.push(`Tu aimes ${joinFr(sharedInterests.slice(0, 3).map(interestLabel))}`);
  }

  if (profile.energy.includes(activity.energy)) {
    score += 2;
    reasons.push(`Ambiance « ${energyById(activity.energy).label.toLowerCase()} », comme tu préfères`);
  }

  if (profile.availability.includes(slotOf(activity.startsAt))) {
    score += 2;
    reasons.push('Tu es disponible sur ce créneau');
  }

  const size = GROUP_SIZES.find((g) => g.id === profile.groupSize);
  if (size && activity.maxParticipants >= size.range[0] && activity.maxParticipants <= size.range[1]) {
    score += 1;
    reasons.push(size.id === 'petit' ? 'Petit groupe, comme tu l’aimes' : 'Taille de groupe qui te convient');
  }

  if (activity.distanceKm <= profile.distanceKm) {
    score += 1;
  } else {
    score -= 2;
  }

  const familiar = participantIds.filter((id) => ctx.familiarIds.has(id));
  if (familiar.length) {
    score += 2 + familiar.length;
    reasons.push(`${familiar.length} visage${familiar.length > 1 ? 's' : ''} familier${familiar.length > 1 ? 's' : ''} y participe${familiar.length > 1 ? 'nt' : ''}`);
  }

  if (activity.communityId && ctx.myCommunityIds.has(activity.communityId)) {
    score += 3;
    reasons.unshift('C’est la prochaine rencontre de ton cercle');
  } else if (activity.recurrence && profile.format !== 'ponctuel') {
    score += 1;
    reasons.push('Groupe récurrent : tu pourras revoir les mêmes personnes');
  }

  if (profile.level === 'debutant' && activity.level === 'debutant') {
    score += 1;
    reasons.push('Pensé pour les débutant·es');
  }
  if (profile.level === 'debutant' && activity.level === 'confirme') score -= 2;

  return { score, reasons, sharedInterests, familiar };
}

/** One-sentence explanation, e.g. for activity cards. */
export function explain(rec: Recommendation): string {
  if (!rec.reasons.length) return 'Une découverte en dehors de tes habitudes.';
  return rec.reasons.slice(0, 3).join(' · ');
}
