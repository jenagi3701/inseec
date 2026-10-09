const fr = 'fr-FR';

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString(fr, { weekday: 'long', day: 'numeric', month: 'long' });

export const formatShortDay = (iso: string) =>
  new Date(iso).toLocaleDateString(fr, { weekday: 'short', day: 'numeric', month: 'short' });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(fr, { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');

export const formatDateTime = (iso: string) => `${formatDay(iso)} · ${formatTime(iso)}`;

export const formatPrice = (min: number, max: number) => {
  if (max === 0) return 'Gratuit';
  if (min === max) return `${min} €`;
  if (min === 0) return `Gratuit – ${max} €`;
  return `${min} – ${max} €`;
};

export const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m}` : ''}` : `${m} min`;
};

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Aujourd’hui';
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  if (diff > 1 && diff < 7) return `Dans ${diff} jours`;
  if (diff < -1 && diff > -30) return `Il y a ${-diff} jours`;
  return formatShortDay(iso);
}

export const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'à l’instant';
  if (diff < 60) return `il y a ${Math.round(diff)} min`;
  if (diff < 1440) return `il y a ${Math.round(diff / 60)} h`;
  return `il y a ${Math.round(diff / 1440)} j`;
};

export const recurrenceLabel = (r: string | null) =>
  r === 'hebdo' ? 'Chaque semaine' : r === 'bimensuel' ? 'Toutes les 2 semaines' : r === 'mensuel' ? 'Chaque mois' : 'Ponctuel';

export const levelActivityLabel = (l: string) =>
  l === 'debutant' ? 'Débutant·es bienvenu·es' : l === 'confirme' ? 'Confirmé·es' : 'Tous niveaux';

/** Episode number of a recurring activity within its guild (1-based, chronological). */
export function episodeOf(all: { id: string; communityId?: string; startsAt: string }[], a: { id: string; communityId?: string; startsAt: string }): number | null {
  if (!a.communityId) return null;
  return all.filter((x) => x.communityId === a.communityId && x.startsAt <= a.startsAt).length;
}
