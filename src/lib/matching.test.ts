import { describe, expect, it } from 'vitest';
import { recommend, slotOf } from './matching';
import { DEMO_ACTIVITIES } from '../data/activities';
import { DEMO_PERSONA } from '../data/users';
import { DEMO_COMMUNITIES } from '../data/communities';
import { INTERESTS } from '../data/taxonomy';
import { reducer, initialState, ME, seedPersonaHistory } from '../store/state';

const me = { ...DEMO_PERSONA, id: ME };
const ctx = { familiarIds: new Set<string>(), myCommunityIds: new Set<string>() };
const byId = (id: string) => DEMO_ACTIVITIES.find((a) => a.id === id)!;

describe('matching', () => {
  it('explains shared interests in plain French', () => {
    const rec = recommend(me, byId('a-ghibli-mononoke'), ctx);
    expect(rec.sharedInterests).toContain('ghibli');
    expect(rec.reasons[0]).toMatch(/Tu aimes Studio Ghibli/);
  });

  it('ranks an aligned cosy activity above a competitive one for a calm profile', () => {
    expect(recommend(me, byId('a-coop'), ctx).score).toBeGreaterThan(recommend(me, byId('a-fgc'), ctx).score);
  });

  it('boosts activities with familiar people and from my circles', () => {
    const a = byId('a-ghibli-mononoke');
    const base = recommend(me, a, ctx).score;
    const withCircle = recommend(me, a, { familiarIds: new Set(['u-clara']), myCommunityIds: new Set(['c-ghibli']) });
    expect(withCircle.score).toBeGreaterThan(base);
    expect(withCircle.familiar).toEqual(['u-clara']);
    expect(withCircle.reasons[0]).toMatch(/cercle/);
  });

  it('maps dates to availability slots', () => {
    expect(slotOf(new Date(2026, 9, 10, 15).toISOString())).toBe('samedi-aprem'); // Saturday
    expect(slotOf(new Date(2026, 9, 7, 20).toISOString())).toBe('semaine-soir'); // Wednesday
  });
});

describe('demo data integrity', () => {
  const interestIds = new Set(INTERESTS.map((i) => i.id));
  it('only references known interests and communities', () => {
    for (const a of DEMO_ACTIVITIES) {
      a.tags.forEach((t) => expect(interestIds.has(t), `${a.id}: ${t}`).toBe(true));
      if (a.communityId) expect(DEMO_COMMUNITIES.some((c) => c.id === a.communityId)).toBe(true);
      expect(a.participantIds.length).toBeLessThanOrEqual(a.maxParticipants);
    }
  });
});

describe('reducer', () => {
  it('joins and leaves activities', () => {
    let s = reducer(initialState, { type: 'join', activityId: 'a-coop', title: 'x' });
    expect(s.joined).toContain('a-coop');
    expect(s.notifications).toHaveLength(1);
    s = reducer(s, { type: 'leave', activityId: 'a-coop' });
    expect(s.joined).not.toContain('a-coop');
  });

  it('toggles saved activities', () => {
    let s = reducer(initialState, { type: 'toggleSave', activityId: 'a-ramen' });
    expect(s.saved).toEqual(['a-ramen']);
    s = reducer(s, { type: 'toggleSave', activityId: 'a-ramen' });
    expect(s.saved).toEqual([]);
  });

  it('creates mutual connections only when reciprocated', () => {
    const s = reducer(seedPersonaHistory(initialState), {
      type: 'submitFeedback',
      reciprocated: ['u-nathan'],
      feedback: { activityId: 'p-decouverte', rating: 5, meetAgain: 'oui', connectWith: ['u-nathan', 'u-hugo'], note: '', at: '' },
    });
    expect(s.connections.find((c) => c.userId === 'u-nathan')?.status).toBe('mutuelle');
    expect(s.connections.find((c) => c.userId === 'u-hugo')?.status).toBe('en-attente');
  });

  it('blocking removes an existing connection', () => {
    const s = reducer(seedPersonaHistory(initialState), { type: 'block', userId: 'u-clara' });
    expect(s.blocked).toContain('u-clara');
    expect(s.connections.some((c) => c.userId === 'u-clara')).toBe(false);
  });
});
