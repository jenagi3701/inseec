// Pure state + reducer for the demo. Persisted to localStorage by AppProvider.
import type { Activity, Community, Feedback, Message, Notification, Profile, Report } from '../data/types';
import { DEMO_MESSAGES } from '../data/communities';
import { daysAgo } from '../data/dates';
import { DEMO_USERS } from '../data/users';

const nameOf = (id: string) => DEMO_USERS.find((u) => u.id === id)?.firstName ?? 'Ce membre';

export const ME = 'me';

export interface Privacy {
  showAge: boolean;
  showNeighborhood: boolean;
  profileVisibility: 'membres' | 'participants';
  allowConnectionRequests: boolean;
  emailReminders: boolean;
}

export interface Connection {
  userId: string;
  status: 'en-attente' | 'mutuelle';
  at: string;
}

export interface AppState {
  version: number;
  account: { email: string; firstName: string; demo: boolean } | null;
  profile: Profile | null;
  onboarded: boolean;
  joined: string[]; // activity ids (past = attended)
  saved: string[];
  communities: string[];
  createdCommunities: Community[];
  createdActivities: Activity[];
  messages: Message[];
  feedback: Record<string, Feedback>;
  connections: Connection[];
  blocked: string[];
  reports: Report[];
  notifications: Notification[];
  privacy: Privacy;
  guidelinesAccepted: boolean;
}

export const STATE_VERSION = 4;

export const initialState: AppState = {
  version: STATE_VERSION,
  account: null,
  profile: null,
  onboarded: false,
  joined: [],
  saved: [],
  communities: [],
  createdCommunities: [],
  createdActivities: [],
  messages: DEMO_MESSAGES,
  feedback: {},
  connections: [],
  blocked: [],
  reports: [],
  notifications: [],
  privacy: { showAge: false, showNeighborhood: true, profileVisibility: 'participants', allowConnectionRequests: true, emailReminders: true },
  guidelinesAccepted: false,
};

/** History the demo persona already has, so the continuity features are visible immediately. */
export function seedPersonaHistory(state: AppState): AppState {
  return {
    ...state,
    joined: ['p-ghibli', 'p-nihongo', 'p-decouverte', 'a-ghibli-mononoke', 'a-nihongo'],
    saved: ['a-ramen', 'a-croquis'],
    communities: ['c-ghibli', 'c-nihongo'],
    feedback: {
      'p-ghibli': { activityId: 'p-ghibli', rating: 5, meetAgain: 'oui', connectWith: ['u-clara'], note: '', at: daysAgo(18, 20) },
      'p-nihongo': { activityId: 'p-nihongo', rating: 4, meetAgain: 'oui', connectWith: [], note: '', at: daysAgo(7, 21) },
    },
    connections: [{ userId: 'u-clara', status: 'mutuelle', at: daysAgo(18, 21) }],
    notifications: [
      { id: 'n-seed-1', text: 'Comment s’est passée « Découverte : jeux de société japonais » ? Dis-nous si tu veux revoir cette équipe.', link: '/activites/p-decouverte/bilan', at: daysAgo(2, 10), read: false },
      { id: 'n-seed-2', text: 'Les Dimanches Ghibli : l’épisode 2 arrive dimanche. 4 compagnons de route y vont déjà.', link: '/activites/a-ghibli-mononoke', at: daysAgo(1, 9), read: false },
      { id: 'n-seed-3', text: 'Connexion mutuelle avec Clara : vous avez accepté de rester en contact.', link: '/profil/u-clara', at: daysAgo(18, 21), read: true },
    ],
    guidelinesAccepted: true,
  };
}

export type Action =
  | { type: 'signup'; email: string; firstName: string }
  | { type: 'startDemo'; profile: Profile }
  | { type: 'saveProfile'; profile: Profile; finishOnboarding?: boolean }
  | { type: 'acceptGuidelines' }
  | { type: 'join'; activityId: string; title: string }
  | { type: 'leave'; activityId: string }
  | { type: 'toggleSave'; activityId: string }
  | { type: 'joinCommunity'; communityId: string; name: string }
  | { type: 'leaveCommunity'; communityId: string }
  | { type: 'postMessage'; activityId: string; text: string }
  | { type: 'submitFeedback'; feedback: Feedback; reciprocated: string[] }
  | { type: 'createCircle'; community: Community }
  | { type: 'createActivity'; activity: Activity }
  | { type: 'requestConnection'; userId: string; mutual: boolean }
  | { type: 'removeConnection'; userId: string }
  | { type: 'block'; userId: string }
  | { type: 'unblock'; userId: string }
  | { type: 'report'; report: Report }
  | { type: 'updatePrivacy'; privacy: Partial<Privacy> }
  | { type: 'markNotificationsRead' }
  | { type: 'notify'; text: string; link?: string }
  | { type: 'reset' };

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const note = (text: string, link?: string): Notification => ({ id: uid('n'), text, link, at: new Date().toISOString(), read: false });

const without = (list: string[], id: string) => list.filter((x) => x !== id);
const withId = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'signup':
      return { ...initialState, account: { email: action.email, firstName: action.firstName, demo: false } };
    case 'startDemo':
      return seedPersonaHistory({
        ...initialState,
        account: { email: 'camille@demo.kizuna', firstName: action.profile.firstName, demo: true },
        profile: action.profile,
        onboarded: true,
      });
    case 'saveProfile':
      return {
        ...state,
        profile: action.profile,
        onboarded: action.finishOnboarding ? true : state.onboarded,
        notifications: action.finishOnboarding
          ? [note('Bienvenue dans l’aventure ! Voici des quêtes choisies selon tes passions.', '/accueil'), ...state.notifications]
          : state.notifications,
      };
    case 'acceptGuidelines':
      return { ...state, guidelinesAccepted: true };
    case 'join':
      return {
        ...state,
        joined: withId(state.joined, action.activityId),
        notifications: [note(`Tu as rejoint l’équipe de « ${action.title} ». Tu peux la quitter à tout moment.`, `/activites/${action.activityId}`), ...state.notifications],
      };
    case 'leave':
      return { ...state, joined: without(state.joined, action.activityId) };
    case 'toggleSave':
      return { ...state, saved: state.saved.includes(action.activityId) ? without(state.saved, action.activityId) : [...state.saved, action.activityId] };
    case 'joinCommunity':
      return {
        ...state,
        communities: withId(state.communities, action.communityId),
        notifications: [note(`Tu as rejoint la guilde « ${action.name} ». Ses prochains épisodes s’afficheront en priorité.`, `/guildes/${action.communityId}`), ...state.notifications],
      };
    case 'leaveCommunity':
      return { ...state, communities: without(state.communities, action.communityId) };
    case 'postMessage':
      return {
        ...state,
        messages: [...state.messages, { id: uid('m'), activityId: action.activityId, authorId: ME, text: action.text, at: new Date().toISOString() }],
      };
    case 'submitFeedback': {
      const existing = new Set(state.connections.map((c) => c.userId));
      const newConnections = action.feedback.connectWith
        .filter((id) => !existing.has(id))
        .map((id) => ({ userId: id, status: action.reciprocated.includes(id) ? ('mutuelle' as const) : ('en-attente' as const), at: new Date().toISOString() }));
      const mutualNotes = newConnections.filter((c) => c.status === 'mutuelle').map((c) => note(`Connexion mutuelle avec ${nameOf(c.userId)} : vous avez accepté de rester en contact.`, `/profil/${c.userId}`));
      return {
        ...state,
        feedback: { ...state.feedback, [action.feedback.activityId]: action.feedback },
        connections: [...state.connections, ...newConnections],
        notifications: [...mutualNotes, ...state.notifications],
      };
    }
    case 'createCircle':
      return {
        ...state,
        createdCommunities: [...state.createdCommunities, action.community],
        communities: withId(state.communities, action.community.id),
        notifications: [note(`Ta guilde « ${action.community.name} » est fondée. Écris le premier épisode !`, `/guildes/${action.community.id}`), ...state.notifications],
      };
    case 'createActivity':
      return {
        ...state,
        createdActivities: [...state.createdActivities, action.activity],
        joined: withId(state.joined, action.activity.id),
        notifications: [note(`Ta quête « ${action.activity.title} » est publiée (démo).`, `/activites/${action.activity.id}`), ...state.notifications],
      };
    case 'requestConnection':
      if (state.connections.some((c) => c.userId === action.userId)) return state;
      return {
        ...state,
        connections: [...state.connections, { userId: action.userId, status: action.mutual ? 'mutuelle' : 'en-attente', at: new Date().toISOString() }],
        notifications: action.mutual ? [note(`Connexion mutuelle avec ${nameOf(action.userId)}. Vous pouvez désormais vous retrouver plus facilement.`, `/profil/${action.userId}`), ...state.notifications] : state.notifications,
      };
    case 'removeConnection':
      return { ...state, connections: state.connections.filter((c) => c.userId !== action.userId) };
    case 'block':
      return {
        ...state,
        blocked: withId(state.blocked, action.userId),
        connections: state.connections.filter((c) => c.userId !== action.userId),
      };
    case 'unblock':
      return { ...state, blocked: without(state.blocked, action.userId) };
    case 'report':
      return { ...state, reports: [...state.reports, action.report] };
    case 'updatePrivacy':
      return { ...state, privacy: { ...state.privacy, ...action.privacy } };
    case 'markNotificationsRead':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'notify':
      return { ...state, notifications: [note(action.text, action.link), ...state.notifications] };
    case 'reset':
      return initialState;
  }
}
