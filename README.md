# Kizuna 絆 — prototype

**Fais-toi des amis par ce que tu aimes.** Kizuna is a social discovery web app for Lyon: small-group activities around anime, manga, Japanese culture, board games and gaming, and **recurring circles** so that the people you meet once can become people you see again.

> Demo prototype. All members, venues and events are fictional. There is no backend: data stays in your browser.

- Product definition, UX, data model, business model, KPIs, GDPR: [`docs/PRODUCT.md`](docs/PRODUCT.md)
- Presentation summary for classmates, partners or investors: [`docs/PITCH.md`](docs/PITCH.md)

## Run it locally

Requirements: **Node.js 20+** (tested with Node 22) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds the production bundle into `dist/` |
| `npm run preview` | Serves the built bundle |
| `npm test` | Runs unit tests (recommendation rules, reducer, demo data integrity) |
| `npm run typecheck` | TypeScript only |

No API keys, environment variables or paid services are needed.

## Suggested 5-minute demo

1. **Landing** (`/`): positioning, "Retrouver / Découvrir", social-energy levels.
2. Click **"Essayer la démo avec le profil de Camille"**. Camille already has three past activities, two circles and one mutual connection.
3. **Accueil**: the blue card asks *"Envie de revoir ce groupe ?"* about a one-off board-game night. The dashboard separates **Retrouver** (your next meeting, your circles, familiar faces) from **Découvrir** (recommendations with plain-language reasons).
4. **Donner mon avis**: rate the activity, answer "Oui", tick Nathan and Hugo, then send. Nathan reciprocates, so a **mutual connection** appears. Hugo's request stays private and pending.
5. **Former un cercle avec ce groupe**: the one-off group becomes a recurring circle. Then **Proposer une rencontre** to plan the next one.
6. **Découvrir**: filter by category and energy, search, then join an activity. The first join shows the community guidelines, and the participant count updates. Reload the page: it persists.
7. **Profil**, **Paramètres & sécurité**: privacy toggles, report and block, guidelines, data export and deletion.

To start from scratch, use the account menu → *Se déconnecter (réinitialise la démo)*. You can also sign up normally to go through the 6-step onboarding.

## Tech stack

- React 19 + TypeScript, Vite 7
- Tailwind CSS 4 (design tokens in `src/index.css`)
- React Router 7
- State: `useReducer` + Context, persisted to `localStorage` (`src/store`)
- Vitest for unit tests

## Project structure

```
src/
  data/            ← demo content & taxonomy (edit these)
    taxonomy.ts      categories, social-energy levels, interests, time slots, levels, cities
    activities.ts    demo activities (Lyon, fictional)
    communities.ts   demo circles + seed group messages
    users.ts         fictional members + the "Camille" demo persona
    dates.ts         helpers that generate dates relative to today
    types.ts         data model
  lib/
    matching.ts      transparent rule-based recommendations + "why" reasons
    format.ts        French date/price formatting
  store/
    state.ts         app state, actions, reducer (pure, unit-tested)
    AppContext.tsx   provider, derived selectors, localStorage persistence, demo reciprocity simulation
  components/      Layout, ActivityCard, ProfileFields, ReportDialog, Guidelines, ui primitives, icons
  pages/           one file per screen (Landing, Signup, Onboarding, Home, Discover, ActivityDetail,
                   Feedback, Communities, CommunityDetail, Lists [Agenda/History/Saved], Profile,
                   Settings, Propose, About)
  i18n/            French dictionary for shared UI strings (add en.ts for English)
```

## Editing the demo content

- **Categories / energy levels / interests**: edit `src/data/taxonomy.ts`. Each category has a label, a colour, a light tint and a kanji used in the generated cover art. Interest ids are referenced by users and activities, and `npm test` checks that they stay consistent.
- **Activities**: add an object to `DEMO_ACTIVITIES` in `src/data/activities.ts`. Use `onWeekday(weekday, extraWeeks, hour, minute)` for upcoming dates (0 = Sunday … 6 = Saturday) or `daysAgo(n, hour)` for past ones, so the demo never goes stale. Set `communityId` to attach it to a circle and `recurrence` for recurring formats. Keep `participantIds.length ≤ maxParticipants`.
- **Members**: add to `DEMO_USERS` in `src/data/users.ts`. The demo persona is `DEMO_PERSONA`, and her history is seeded in `seedPersonaHistory()` (`src/store/state.ts`).
- **Circles**: `DEMO_COMMUNITIES` in `src/data/communities.ts`.
- **Who "says yes" in the simulation**: `DEMO_RECIPROCATORS` in `src/store/AppContext.tsx`.
- **Recommendation rules and weights**: `recommend()` in `src/lib/matching.ts`.
- If you change the shape of the stored state, bump `STATE_VERSION` in `src/store/state.ts` so old browser data is discarded.

## What is real and what is simulated

| Works for real (in the browser) | Simulated / not built |
| --- | --- |
| Navigation between all 12+ screens, responsive mobile/desktop | Authentication: sign-up validates the form but creates no account |
| Onboarding with validation, skippable steps and editable profile | Other members' choices: "meet again" and "stay in touch" answers come from a fixed rule |
| Join / leave with live participant counts, full-activity handling | Group chat is local only: no real-time, nobody replies |
| Save / unsave, agenda, history, post-activity feedback | No payments, bookings, emails or push notifications |
| Circles: join, leave, create from a feedback, propose activities to them | Reports are stored locally; no moderation team receives them |
| Rule-based recommendations with explanations, filters, search, sorting | No maps or geolocation: distances are fixed demo values from Bellecour |
| Report, block, privacy toggles, JSON data export, account deletion (reset) | No external event integrations |
| Persistence across reloads (`localStorage`) | |

What production would need is described in `docs/PRODUCT.md` → *Production roadmap*.
