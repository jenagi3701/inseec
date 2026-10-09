# Kizuna — product definition, UX and strategy

*Working name: **Kizuna** (絆, "the bond that forms between people over time"). Check trademark and domain availability before any public launch: "Kizuna" is used by other products.*

---

## Phase 1 — Product definition

### Positioning (one sentence)

> **FR :** Kizuna aide les fans de culture pop japonaise à se faire des amis à Lyon : on se rencontre par une passion commune, on fait une activité ensemble en petit groupe, et on se revoit avec les mêmes personnes.
>
> **EN:** Kizuna helps people make friends through what they love: shared-interest activities in small groups that turn into recurring circles.

Short tagline: **« Rencontre-toi par ce que tu aimes. Reviens pour les gens. »**

Comparison with Timeleft:
- **Timeleft:** meet new people.
- **Kizuna:** meet through what you love, do things together, and see each other again.

### Target audience

| Segment | Core need |
| --- | --- |
| Newcomers to Lyon (students, Erasmus students, young professionals who just moved) | "I don't know anyone here." |
| Anime, manga and J-culture fans, from beginners to enthusiasts | "My friends don't share this passion." |
| Introverted or shy people | "Talking to strangers with no purpose is draining." |
| Japanese speakers and learners | Language exchange and cultural connection |

The primary launch persona is **Camille, 26**. She moved to Lyon for a job, likes Ghibli films and cooperative games, and feels a bit intimidated by bars and networking events.

### Problem

Making friends as an adult in a new city is hard. Existing options tend to fall into one of three traps:
1. **One-off formats** (dinners with strangers, meetups): every event starts from zero, and there is no mechanism to see the same people again.
2. **Fan forums and Discord**: online only, large and anonymous, with little real-life connection.
3. **Generic event apps**: large events where shy people stay on the sidelines.

Friendship needs **repeated, low-pressure contact with the same people**. No mainstream product is designed around that.

### Value proposition

1. **Interest-first:** the profile is an *interest graph* (genres, franchises, hobbies, Japanese culture), not a dating-style card.
2. **Activity-first:** you do something together (cook ramen, play a co-op game, draw), so conversation comes naturally.
3. **Continuity:** after each activity, a private "meet again?" question can turn the group into a **circle** with a next meeting.
4. **Low pressure:** you choose a *social energy* level, groups are small, icebreakers are provided, beginners are welcome and nothing is forced.

### Main user journey (implemented)

1. **Discover**: landing page → "Trouver mes personnes" or "Explorer les activités".
2. **Profile**: 6-step onboarding (city and distance → level → interests → energy and group size → availability and format → languages and bio). Optional steps can be skipped with sensible defaults.
3. **Recommendations**: the dashboard separates **Retrouver** (circles, next meeting, familiar faces) from **Découvrir** (recommended for you, by interest, near the centre), and every card explains *why* it is shown.
4. **Join**: the activity page shows practical info, the price, places left, the organizer, participants with shared interests, icebreakers, guidelines and the group discussion.
5. **Meet**: the group thread is visible to participants only, and personal contact details are discouraged.
6. **Reconnect**: a private post-activity check-in. If the wish to meet again is shared, the group can **join the next session**, **save the circle**, **form a new circle**, **invite the group** to another activity, or **connect with specific people** through mutual opt-in.

### Differentiating features and how they drive retention

| Feature | What it does | Retention mechanism |
| --- | --- | --- |
| **Même cercle** (Same Circle) | A private "meet again?" question after each activity. If ≥2 others say yes, the one-off group can become a recurring circle, with follow-up activities suggested from the group's shared interests. | Makes the 2nd and 3rd participation the default, not a new effort. |
| **Graphe de passions** (Interest Graph) | Multi-domain profile. Recommendations span fandoms, hobbies and culture, with transparent reasons. | More relevant options each week means more reasons to come back. |
| **Visages familiers** (Friendship Continuity) | Shows which upcoming activities involve people you have already met. "Retrouver" and "Découvrir" are separate on the home screen. | People return for the people, not only for the topic. |
| **Connexion discrète** *(additional)* | You can say you'd like to stay in touch with someone. It only shows up if mutual. There is no rejection notification and no visible friend count. | Removes fear of rejection, which is a key barrier for shy users. |
| **Énergie sociale** *(additional)* | Each activity is tagged calm, creative, competitive, social or cultural. Users filter by how they feel. | Introverts find a comfortable format instead of churning after one overwhelming night. |

Things deliberately left out: points, badges, streaks, friend counts and popularity rankings. The history page states explicitly that "nobody sees how many people you know".

### The three biggest assumptions to validate

1. **Repeat intent:** after a good first activity, enough participants (target ≥40%) will say "yes, meet again" *and* actually attend a second session with the same group.
2. **Supply:** enough reliable organizers and partner venues (board-game cafés, manga shops, associations) will run small recurring activities in Lyon without being paid upfront.
3. **Niche breadth:** "Japanese pop culture + hobbies" is broad enough to fill weekly activities in one city, yet specific enough to feel like *my* community. The risk is that it is either too niche or that it dilutes into a generic event app.

---

## Phase 2 — UX and architecture

### Information architecture

```
/                     Landing (public)
/inscription          Sign-up (+ demo persona shortcut)
/onboarding           6-step onboarding + summary
── authenticated shell (top nav desktop / bottom tab bar mobile, notifications, account menu)
/accueil              Dashboard: Retrouver | Découvrir
/activites            Discovery: search, categories, energy, filters, sort
/activites/:id        Activity detail
/activites/:id/bilan  Post-activity feedback → follow-up (Same Circle)
/cercles              My circles + open circles
/cercles/:id          Circle detail: next meetings, ideas, timeline, members
/agenda               Upcoming activities
/historique           History & feedback
/enregistres          Saved activities
/profil               My profile (interest graph, editable sections)
/profil/:id           Member profile (shared interests, common history, connect, report, block)
/parametres           Privacy, connections, blocks & reports, guidelines, safety tips, data
/proposer             Propose an activity (optionally for a circle)
/a-propos             Concept & what is simulated
```

### Key flows

- **Onboarding:** progress bar, back and skip, validation (city required, ≥3 interests), summary.
- **Join:** the first join shows the community guidelines, which must be accepted. Joining updates the count and sends a notification. Leaving asks for confirmation and frees the place. Full activities are disabled.
- **Reconnect:** past activity → home prompt → feedback (rating, meet again, mutual-connect picks, note) → follow-up (mutual connections, circle actions, invite to suggested activities).
- **Safety:** report (reason required, optional block) on members, messages and activities; block; privacy toggles; export and delete data.

### Reusable components

`AppLayout`, `ActivityCard` (+ `useJoin`, `SaveButton`), `CoverArt` (generated editorial art: category colour, manga screentone, kanji), `Avatar` / `AvatarStack`, `ProfileFields` (shared by onboarding and profile editing), `ReportDialog`, `GuidelinesList`, `Modal`, `EmptyState`, `SectionHeader`, `Toast`, `Icon`.

### Data model (`src/data/types.ts`)

- **Profile**: id, firstName, city, neighborhood, bio, interests[], level, energy[], languages[], groupSize, availability[], format, distanceKm, newInTown
- **Activity**: id, title, categoryId, description, startsAt, durationMin, venue, address, district, distanceKm, priceMin/Max, maxParticipants, participantIds[], level, organizerId, communityId?, recurrence, energy, tags[], language, firstTimerFriendly, icebreakers[]
- **Community (cercle)**: id, name, tagline, description, categoryId, tags[], memberIds[], rhythm, organizerId, origin (`organisateur` | `cercle`), fromActivityId?
- **Feedback**: activityId, rating, meetAgain, connectWith[] (private), note
- **Connection**: userId, status (`en-attente` | `mutuelle`)
- **Message, Notification, Report, Privacy settings**

The production backend would map these to tables (users, interests, activities, registrations, communities, memberships, feedback, connections, blocks, reports, messages). Connection intents would be stored server-side and revealed only when they match.

### Recommendation logic (honest by design)

Additive rules in `src/lib/matching.ts`:
- +3 per shared interest
- +2 if the activity's energy matches the user's
- +2 if the time slot matches the user's availability
- +1 if the group size matches the user's preference
- +1 if the activity is within the user's distance (−2 if not)
- +2 (+1 per person) for familiar faces
- +3 if it is the user's own circle, +1 if recurring and the user likes recurring groups
- Adjustments for level

The UI shows the reasons ("Tu aimes Studio Ghibli et Slice of life · Petit groupe · Tu es disponible sur ce créneau"), never a "% match".

### Design direction

Warm paper background, ink text, a vermilion accent (*shu*) for discovery and indigo (*ai*) for reconnection. The two accent colours map to the product's two modes. Fraunces (editorial serif) is used for headings, Inter for UI, and Zen Kaku Gothic for kanji accents. Manga screentone and speed-line motifs are used sparingly in generated covers. There is no neon and no mascots, and all interface copy is in French.

---

## Business model and competitive strategy

1. **Target customer:** 18–35-year-olds in French university cities, starting in Lyon, who are new to the city or socially isolated and have Japanese pop-culture or hobby interests.
2. **Core problem:** adult friendship needs repetition. Current formats are one-off, online-only, or too large.
3. **Value proposition:** passion-based small-group activities that can turn into recurring circles.
4. **Competitive advantage:** the *continuity loop* (Same Circle + familiar faces + mutual connections) and a niche community identity. Timeleft optimizes for novelty, while Kizuna optimizes for repetition.
5. **Acquisition:**
   - Partner venues (board-game cafés, manga shops, karaoke boxes, Japanese restaurants), with QR codes on tables.
   - University associations (Japanese clubs, BDE, Erasmus/ESN).
   - Conventions, through group outings ("don't go alone").
   - Japanese language schools.
   - Referral: "bring a friend to your circle".
   - TikTok and Instagram content about meeting people through fandoms.
6. **Retention:** the circle's next meeting is pre-proposed after every activity. Circle reminders and familiar-face highlights follow, plus a monthly rhythm per circle, while recurring organizers get visibility and tools.
7. **Monetization hypotheses** (to test only *after* validating repeat attendance):
   - **Free:** discovery, joining free activities, circles, connections. The social core is never paywalled.
   - **Ticketed workshops** (ramen, calligraphy, escape rooms): a 10–15% commission on ticket price.
   - **Partner venues:** a referral fee or a fixed monthly fee for featured, guaranteed-attendance group nights (venues fill quiet weekday evenings).
   - **Organizer tools (Pro):** recurring scheduling, waitlists, paid tickets, attendance analytics.
   - **Optional membership** (~€5–8/month): priority places in popular circles, members' events, early access to conventions. This is only introduced if demand exceeds supply.
8. **Main risks and assumptions:**
   - Low second-attendance rates.
   - Organizer churn.
   - Venue dependence.
   - Safety incidents and reputational risk.
   - A niche that is too narrow in smaller cities.
   - Timeleft or Meetup adding "meet the same group again" features. The mitigation is community depth and the partner network.
   - Seasonality around the student calendar.

## Success metrics (KPIs)

| KPI | Why it matters | Early target (hypothesis) |
| --- | --- | --- |
| Onboarding completion | Friction check | ≥70% |
| Discovery → join conversion | Relevance of recommendations | ≥15% of activity views |
| Attendance rate (show-up / registered) | Reliability and trust | ≥80% |
| **% of users who attend a 2nd activity within 30 days** | Core proof of value | ≥40% |
| **Repeat participation with the same circle** | Proves the continuity thesis | ≥30% of 2nd activities are in a circle |
| Active recurring circles (≥2 meetings in 60 days) | Community health and supply | 20 in Lyon after 3 months |
| D30 retention | Overall stickiness | ≥25% |
| Post-activity satisfaction (≥4/5) | Experience quality | ≥85% |
| "Meet again = yes" rate | Leading indicator for circles | ≥40% |
| Referral rate | Organic growth | ≥15% of new users |

**Why repeat participation is the north-star metric:** the concept claims that friendship grows from repeated contact. If users attend once and never again, Kizuna is just another event app with worse supply than Meetup or Timeleft. The share of users who return *to the same people* directly measures the differentiation, drives organic retention, and lowers acquisition cost per active user.

*No real data exists yet. All figures in the prototype are fictional demo data, and the targets above are hypotheses to test.*

## Trust, safety and GDPR (France launch)

**In the prototype:**
- Community guidelines, accepted before the first join.
- Organizer expectations.
- Public-place-only activities, with an explicit checkbox when proposing one.
- Clear meeting details.
- Leaving an activity at any time.
- Mutual-only connections, with first name only and no contact details shown.
- Group thread visible to participants only, with a nudge against sharing phone numbers and emails.
- Report on members, messages and activities; block; privacy toggles (neighbourhood, age, profile visibility, connection requests).
- Safety tips, including French emergency numbers.
- Data export and account deletion.

**For production:**
- **GDPR basics:**
  - Lawful basis: contract for account and service, consent for marketing and optional profiling.
  - Privacy notice in French.
  - Data minimisation. Do not collect gender, orientation, ethnicity, religion, health or exact address.
  - Retention periods (e.g. delete inactive accounts after 24 months, keep messages for a limited time).
  - Rights: access, rectification, erasure, portability, objection, exercised in-app and within one month.
  - A record of processing activities.
  - Data Processing Agreements with processors and EU hosting.
  - Breach notification to the **CNIL** within 72 h.
- **Cookies and tracking:** CNIL rules (consent before non-essential cookies, reject as easy as accept).
- **Profiling:** recommendations are a light form of profiling. Explain them, which is already done in the UI, and allow users to opt out of personalised ranking.
- **Minors:** 18+ only at launch. Under 15, French law requires parental consent (*majorité numérique*).
- **Platform obligations:** under the EU **Digital Services Act**, provide notice-and-action for illegal content, statements of reasons for moderation decisions, and a contact point. Publish clear Terms of Service (CGU).
- **Moderation:** a human review queue (24 h service level agreement), escalation for in-person incidents, organizer vetting (ID check for organizers), venue partnerships, and an optional "first-time" buddy system.
- **Payments:** a PSP such as Stripe for ticketing. Never store card data.
- **Do a DPIA** if location or large-scale behavioural profiling is added.

## Production roadmap

1. **Backend and authentication:**
   - Postgres plus an API, e.g. Supabase, or a Node/NestJS or Django backend.
   - Email magic link or OAuth.
   - Server-side registrations with capacity locks and waitlists.
2. **Real-time chat** for group threads (WebSockets or Supabase Realtime) with moderation tooling.
3. **Server-side matching** of feedback and connection intents, so reciprocity is revealed only when it is real.
4. **Notifications:** email and push reminders (D-1, the next circle meeting).
5. **Organizer console:** create recurring series, attendance, check-in.
6. **Maps and distances:** geocode venues, compute real distances (OpenStreetMap/Nominatim or Mapbox).
7. **Payments** for workshops (Stripe Connect for organizer payouts).
8. **Analytics** for the KPIs above, using privacy-friendly tools such as Plausible or a self-hosted PostHog.
9. **English locale:** `src/i18n` already centralises shared UI strings.

## Assumptions made in this prototype

- Launch city is Lyon (plus Villeurbanne). Distances are approximate, measured from Place Bellecour.
- Users are adults (18+). The French interface uses inclusive spellings (e.g. *inscrit·e*) for a welcoming tone.
- Demo dates are generated relative to today, so the demo always has upcoming and past events.
- A circle can be formed when at least 2 other participants also say "yes".
