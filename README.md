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

## Visual identity: "cozy anime + social RPG"

- **Palette** (`src/index.css`, `@theme`):
  - warm cream paper with a dotted texture
  - **sakura** pink for actions and discovery
  - **lavender** for guilds and continuity
  - muted **sora** blue, matcha and peach as supporting colours
  - deep plum **ink** for line-art instead of pure black
- **Manga language**:
  - ink-outlined panels with an offset shadow (`panel`, `card`, `btn`)
  - screentone and speed-line textures
  - speech bubbles (`.bubble`)
  - sticker labels and hanko-style kanji stamps
  - slight card tilts and floating petals; all motion respects `prefers-reduced-motion`
- **Typography** (Google Fonts, OFL licence): *Dela Gothic One* for big manga-style titles, *Zen Maru Gothic* for headings and kanji, *Nunito* for readable UI text.
- **Original illustrations** (`src/components/art/`):
  - `Scene.tsx`: six slice-of-life settings (manga café/bookshop, game table, neighbourhood street with lanterns and a vending machine, arcade, drawing atelier, riverside), each in three times of day.
  - `AnimeAvatar.tsx`: an avatar generator with 6 hairstyles, 8 hair colours, 6 skin tones, eye colours, expressions, outfits and accessories. Demo members are either hand-tuned or generated from a seed.
  - Guild crests (`Guild.tsx`), the logo mark and decorations (`ui.tsx`).
- **No copyrighted material**: no existing characters, manga panels or franchise logos. Franchise names appear only as text interest tags, with a "no affiliation" notice.

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
