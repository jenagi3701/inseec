// Core data model for the Kizuna prototype.
// Everything here is demo data held in the browser — there is no backend.

export type CategoryId = 'anime' | 'jeux' | 'culture' | 'gaming' | 'creatif' | 'sorties';

export type EnergyId = 'calme' | 'creatif' | 'competitif' | 'social' | 'culturel';

export type LevelId = 'debutant' | 'curieux' | 'passionne';

export type GroupSizeId = 'petit' | 'moyen' | 'grand';

export type SlotId =
  | 'semaine-soir'
  | 'samedi-matin'
  | 'samedi-aprem'
  | 'samedi-soir'
  | 'dimanche-matin'
  | 'dimanche-aprem'
  | 'dimanche-soir';

export type Recurrence = 'hebdo' | 'bimensuel' | 'mensuel' | null;

export type FormatPref = 'recurrent' | 'ponctuel' | 'les-deux';

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  kanji: string; // editorial accent used in cover art
  color: string; // css color for accents
  tint: string; // light background tint
}

export interface Energy {
  id: EnergyId;
  label: string;
  description: string;
}

export type InterestGroup = 'genre' | 'fandom' | 'loisir' | 'culture';

export interface Interest {
  id: string;
  label: string;
  group: InterestGroup;
}

export interface Profile {
  id: string;
  firstName: string;
  age?: number;
  pronouns?: string;
  city: string;
  neighborhood?: string;
  bio: string;
  interests: string[]; // interest ids — the "interest graph"
  level: LevelId;
  energy: EnergyId[];
  languages: string[];
  groupSize: GroupSizeId;
  availability: SlotId[];
  format: FormatPref;
  distanceKm: number;
  avatarHue: number;
  newInTown?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  categoryId: CategoryId;
  description: string;
  startsAt: string; // ISO
  durationMin: number;
  venue: string;
  address: string;
  district: string;
  distanceKm: number; // from Lyon centre (Bellecour) — demo approximation
  priceMin: number;
  priceMax: number;
  maxParticipants: number;
  participantIds: string[]; // seed participants (current user added via state)
  level: 'debutant' | 'tous' | 'confirme';
  organizerId: string;
  communityId?: string;
  recurrence: Recurrence;
  energy: EnergyId;
  tags: string[]; // interest ids
  language: string;
  firstTimerFriendly: boolean;
  icebreakers: string[];
  userCreated?: boolean;
}

export interface Community {
  id: string;
  name: string;
  tagline: string;
  description: string;
  categoryId: CategoryId;
  tags: string[];
  memberIds: string[];
  rhythm: string;
  organizerId: string;
  origin: 'organisateur' | 'cercle'; // "cercle" = born from a Same Circle opt-in
  fromActivityId?: string; // the one-off activity a circle was formed after
}

export interface Message {
  id: string;
  activityId: string;
  authorId: string;
  text: string;
  at: string;
}

export interface Feedback {
  activityId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  meetAgain: 'oui' | 'peut-etre' | 'non';
  connectWith: string[]; // participant ids — revealed only if mutual
  note: string;
  at: string;
}

export interface Notification {
  id: string;
  text: string;
  link?: string;
  at: string;
  read: boolean;
}

export interface Report {
  id: string;
  targetType: 'user' | 'message' | 'activity';
  targetId: string;
  reason: string;
  details: string;
  at: string;
}
