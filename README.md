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
| `npm run build:artifact` | Builds a single self-contained HTML page (`dist-artifact/kizuna.html`, in-memory routing, everything inline) for hosting in a sandboxed viewer such as a claude.ai artifact |

No API keys, environment variables or paid services are needed.

## Suggested 5-minute demo

1. **Landing** (`/`):
   - the manga-panel hero (a guild meeting for "Épisode 4")
   - the one-shot vs series comparison
   - the "3 episodes" explainer
   - the social-energy levels
   - the quest board and the character cards
2. Click **"Essayer la démo avec Camille"**. Camille already has three past quests, two guilds and one mutual connection.
3. **Accueil**:
   - an illustrated greeting banner whose scene follows the real time of day
   - a purple **"Fin d’épisode : envie de revoir cette équipe ?"** card
   - the split between **Suite de l’histoire** (your guilds, your next episode, familiar faces) and **Nouvelles aventures** (explained recommendations)
4. **Donner mon avis**: rate with an emoji, answer "Oui", tick Nathan and Hugo, then send. Nathan reciprocates, so a **mutual connection** appears. Hugo's request stays private and pending.
5. **Fonder une guilde avec cette équipe**: the one-off group becomes a guild, with a story timeline ("Saison 1"). Then **Proposer un épisode**.
6. **Quêtes**: filter by category and energy, search, then **Rejoindre l’équipe**. The first join shows the "code de la guilde", the party slots fill up, and the change persists after a reload.
7. **Profil**: the character sheet. Use **Modifier mon avatar** to try the character creator.
8. **Paramètres & sécurité**: privacy, report and block, the code of conduct, data export and deletion.

To start from scratch, use the account menu → *Se déconnecter (réinitialise la démo)*. Signing up normally takes you through the 7-step onboarding, which includes creating your character.

## Visual identity: "Cozy Tokyo at night"

A rainy evening in Tokyo with friends. The page and its sections are midnight-plum streets. Content objects (quest invitations, character sheets, guild cards, dialogs, popovers) are warm cream **paper** that glows like a lit café window.

- **Palette** (`src/index.css`, `@theme`):

  | Colour | Hex | Used for |
  | --- | --- | --- |
  | Midnight Plum | `#252238` | page, night base |
  | Deep Plum | `#343047` | night cards and sections |
  | Warm Cream | `#F4EBDD` | paper surfaces |
  | Sakura Pink | `#E99BB5` | primary buttons, selected filters, key highlights |
  | Rainy Tokyo Blue | `#86A9B8` | secondary actions, icons |
  | Lantern Gold | `#D7B77A` | small warm details only |
  | Matcha Sage | `#A6B59A` | supporting accent |
  | Muted Lavender | `#B9A7CC` | guilds and continuity |
  | Text | `#30283D` / `#F4EBDD` | on cream / on night |

- **Scope-aware tokens.** The default tokens are the night palette. The `.paper` and `.scope-day` classes re-declare the *same* token names with the day palette, so `text-ink`, `bg-sakura-soft`, `text-sakura-deep`… adapt to the surface they sit on. Accent *text* uses a light shade on night surfaces and a deep shade on cream, so pale pink text never lands on cream. Brand fills (sakura, rain, lavender, lantern, sage) always carry `text-on-accent` (`#252238`).
- **Contrast.** Every text/surface token pair is at least 4.5:1 (WCAG AA). The requested secondary grey `#81778A` measures about 3.6:1 on both cream and midnight, so it is kept as the `mute` token for icons and dividers. Secondary text uses slightly deeper (cream) or lighter (night) derived greys.
- **Depth.** Soft shadows, thin warm borders, gentle radial glows of lantern, sakura and rain light in the page background, and a hover glow on cards. No neon outlines or hard offset shadows.
- **Typography** (Google Fonts, OFL licence): *Dela Gothic One* for manga-style titles, *Zen Maru Gothic* for headings and kanji, *Nunito* for UI text.
- **Original illustrations** (`src/components/art/`):
  - `Scene.tsx`: six settings (manga café, game room, neighbourhood street, arcade, drawing atelier, riverside). Each has three evening lights: golden hour, sakura dusk, and a rainy night with rain and wet-asphalt reflections. Interiors are lamp-lit, and lanterns and windows glow amber.
  - `AnimeAvatar.tsx`: avatar generator. Guild crests are in `Guild.tsx`, the logo in `ui.tsx`.
  - No copyrighted characters, panels or logos. Franchise names appear only as text tags.
- **Motion:** floating characters, falling petals, a slow lantern flicker and pop-in bubbles, all disabled under `prefers-reduced-motion`.

### Vocabulary (French UI)

| Term | Meaning |
| --- | --- |
| **Quête** | An activity (one-off or a guild's episode) |
| **Équipe** | The participants of a quest; free places are shown as dashed "party slots" |
| **Guilde** | A recurring community; route `/guildes` (old `/cercles` URLs redirect) |
| **Épisode** | One meeting of a guild; the guild page shows them as a story timeline |
| **Fiche personnage** | The profile: illustrated avatar, title, interest badges |
| **Compagnons de route** | People you have already met |

Each themed label sits next to plain wording ("Rejoindre l’équipe", "Quitter l’équipe", "Proposer une quête"), so the theme never replaces clarity.

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
    users.ts         fictional members (with avatar configs & character titles) + the "Camille" persona
    dates.ts         helpers that generate dates relative to today
    types.ts         data model
  lib/
    matching.ts      transparent rule-based recommendations + "why" reasons
    format.ts        French date/price formatting
  store/
    state.ts         app state, actions, reducer (pure, unit-tested)
    AppContext.tsx   provider, derived selectors, localStorage persistence, demo reciprocity simulation
  components/
    art/             original SVG illustrations: Scene (6 settings × 3 times of day), AnimeAvatar generator
    ActivityCard.tsx quest card (+ useJoin, SaveButton, DateTicket)
    CharacterCard.tsx, Guild.tsx (crest + guild card), AvatarEditor.tsx
    Layout, ProfileFields, ReportDialog, Guidelines, ui primitives (panels, stickers, bubbles, stamps), icons
  pages/           one file per screen (Landing, Signup, Onboarding, Home, Discover, ActivityDetail,
                   Feedback, Communities, CommunityDetail, Lists [Agenda/History/Saved], Profile,
                   Settings, Propose, About)
  i18n/            French dictionary for shared UI strings (add en.ts for English)
```

## Editing the demo content

- **Categories / energy levels / interests**: edit `src/data/taxonomy.ts`. Each category has a label, a colour, a light tint, a kanji stamp, an illustrated `scene` and a `questLabel` used on quest covers. Interest ids are referenced by users and activities, and `npm test` checks that they stay consistent.
- **Activities**: add an object to `DEMO_ACTIVITIES` in `src/data/activities.ts`. Use `onWeekday(weekday, extraWeeks, hour, minute)` for upcoming dates (0 = Sunday … 6 = Saturday) or `daysAgo(n, hour)` for past ones, so the demo never goes stale. Set `communityId` to attach it to a circle and `recurrence` for recurring formats. Keep `participantIds.length ≤ maxParticipants`.
- **Members**: add to `DEMO_USERS` in `src/data/users.ts`. `avatar` is optional (indexes into the lists in `AnimeAvatar.tsx`); without it an avatar is generated from the id. `title` is the short character title. The demo persona is `DEMO_PERSONA`, and her history is seeded in `seedPersonaHistory()` (`src/store/state.ts`).
- **Circles**: `DEMO_COMMUNITIES` in `src/data/communities.ts`.
- **Who "says yes" in the simulation**: `DEMO_RECIPROCATORS` in `src/store/AppContext.tsx`.
- **Recommendation rules and weights**: `recommend()` in `src/lib/matching.ts`.
- If you change the shape of the stored state, bump `STATE_VERSION` in `src/store/state.ts` so old browser data is discarded.

## What is real and what is simulated

| Works for real (in the browser) | Simulated / not built |
| --- | --- |
| Navigation between all 12+ screens, responsive mobile/desktop, character creator | Authentication: sign-up validates the form but creates no account |
| Onboarding with validation, skippable steps and editable profile | Other members' choices: "meet again" and "stay in touch" answers come from a fixed rule |
| Join / leave with live participant counts, full-activity handling | Group chat is local only: no real-time, nobody replies |
| Save / unsave, agenda, history, post-activity feedback | No payments, bookings, emails or push notifications |
| Circles: join, leave, create from a feedback, propose activities to them | Reports are stored locally; no moderation team receives them |
| Rule-based recommendations with explanations, filters, search, sorting | No maps or geolocation: distances are fixed demo values from Bellecour |
| Report, block, privacy toggles, JSON data export, account deletion (reset) | No external event integrations |
| Persistence across reloads (`localStorage`) | |

What production would need is described in `docs/PRODUCT.md` → *Production roadmap*.
