import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { DEMO_ACTIVITIES } from '../data/activities';
import { DEMO_COMMUNITIES } from '../data/communities';
import { DEMO_USERS } from '../data/users';
import type { Activity, Community, Profile } from '../data/types';
import { recommend, type Recommendation } from '../lib/matching';
import { ME, STATE_VERSION, initialState, reducer, type Action, type AppState } from './state';

const STORAGE_KEY = 'kizuna-demo-state';

/**
 * Demo-only simulation of other members' choices. In production these would
 * come from the server once the other participants answer themselves.
 * These members "also" opt in to reconnect / meet again.
 */
export const DEMO_RECIPROCATORS = new Set(['u-clara', 'u-nathan', 'u-ines', 'u-yuki', 'u-aiko', 'u-lucas', 'u-amandine']);

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== STATE_VERSION) return initialState;
    return parsed;
  } catch {
    return initialState;
  }
}

export interface Derived {
  state: AppState;
  dispatch: (a: Action) => void;
  me: Profile | null;
  activities: Activity[];
  communities: Community[];
  users: Profile[];
  getActivity: (id: string) => Activity | undefined;
  getCommunity: (id: string) => Community | undefined;
  getUser: (id: string) => Profile | undefined;
  isPast: (a: Activity) => boolean;
  isJoined: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  isMember: (communityId: string) => boolean;
  /** People met at activities attended or in shared communities. */
  familiarIds: Set<string>;
  recommendFor: (a: Activity) => Recommendation;
  communityMembers: (c: Community) => string[];
  unread: number;
}

const Ctx = createContext<Derived | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode) — demo keeps working in memory */
    }
  }, [state]);

  const value = useMemo<Derived>(() => {
    const now = Date.now();
    const joined = new Set(state.joined);
    const myCommunities = new Set(state.communities);
    const blocked = new Set(state.blocked);

    const activities = [...DEMO_ACTIVITIES, ...state.createdActivities].map((a) => ({
      ...a,
      participantIds: joined.has(a.id) && !a.participantIds.includes(ME) ? [...a.participantIds, ME] : a.participantIds.filter((p) => p !== ME || joined.has(a.id)),
    }));
    const communities = [...DEMO_COMMUNITIES, ...state.createdCommunities];
    const isPast = (a: Activity) => new Date(a.startsAt).getTime() + a.durationMin * 60000 < now;

    const familiarIds = new Set<string>();
    for (const a of activities) {
      if (joined.has(a.id) && isPast(a)) a.participantIds.forEach((p) => familiarIds.add(p));
    }
    for (const c of communities) {
      if (myCommunities.has(c.id)) c.memberIds.forEach((p) => familiarIds.add(p));
    }
    state.connections.forEach((c) => familiarIds.add(c.userId));
    familiarIds.delete(ME);
    blocked.forEach((b) => familiarIds.delete(b));

    const me = state.profile ? { ...state.profile, id: ME } : null;
    const users = me ? [...DEMO_USERS, me] : DEMO_USERS;

    return {
      state,
      dispatch,
      me,
      activities,
      communities,
      users,
      getActivity: (id) => activities.find((a) => a.id === id),
      getCommunity: (id) => communities.find((c) => c.id === id),
      getUser: (id) => users.find((u) => u.id === id),
      isPast,
      isJoined: (id) => joined.has(id),
      isSaved: (id) => state.saved.includes(id),
      isMember: (id) => myCommunities.has(id),
      familiarIds,
      recommendFor: (a) =>
        me ? recommend(me, a, { familiarIds, myCommunityIds: myCommunities }, a.participantIds) : { score: 0, reasons: [], sharedInterests: [], familiar: [] },
      communityMembers: (c) => (myCommunities.has(c.id) ? [...c.memberIds.filter((m) => m !== ME), ME] : c.memberIds),
      unread: state.notifications.filter((n) => !n.read).length,
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
