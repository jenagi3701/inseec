# 🐔 Chic Career

**Find the right job. Apply smarter. Track everything.**
*Your career journey, one quest at a time.*

Chic Career is a working local prototype of a job-search command centre for marketing and communication students: a job board, a personal tracker, an AI application assistant and an application CRM in one place. A pixel-art **Career Chicken** comes along for the whole journey.

> **Honesty notes**
> - **Job offers are DEMO DATA.** The 24 offers (plus 3 that arrive on refresh) are fictional and are labelled DEMO throughout the UI. The prototype has **no live connection** to LinkedIn, Indeed or Welcome to the Jungle, and it does **no scraping**. "Open original" links run a search on the platform; they are not real listings.
> - **The AI is a local mock.** It is rule-based and deterministic, runs in your browser and never sends data anywhere. The provider interface is ready for a real LLM (see `js/ai.js`), which would only run after explicit user consent.
> - **The demo profile is fictional** (Camille Martin, `example.com` addresses).

---

## Platform language

The interface is available in **English and French**. Use the 🌐 **EN / FR** selector in the top bar, or **My Profile → AI Settings → Platform language**. The choice is remembered. The first visit follows the browser language.

The translation layer is `js/i18n.js`, which holds a dictionary plus patterns for dynamic text. It translates interface text only. Job offers, CV content, your answers and cover letters stay as written. A cover letter's language is chosen separately: it follows the offer's language, or you can pick French or English.

## Run it

No build step, no backend and no install are needed.

```bash
# option 1: just open the file
open chic-career/index.html            # macOS  (or double-click it)

# option 2: serve the folder (recommended for clipboard access)
cd market-track && python3 -m http.server 8080
# → http://localhost:8080
```

On first launch the app loads the demo profile, CVs, jobs and applications. You can change this in **My Profile → AI Settings**:
- **Reload demo data** resets everything to the demo.
- **Start fresh** erases everything so you can see the empty states and the level-1 chick.
- **Export my data** downloads everything as JSON.

Two sample CVs for testing upload are in `assets/demo/`: `CV-Demo-Alex-Moreau.docx` and `.pdf`.

---

## The demo flow (try this first)

1. **Dashboard**: open the *Recommended for you* quest **Assistant(e) Chef de Produit Marketing — Pépite Foods** (≈89% match, available on all 3 platforms and merged into one card).
2. **Job detail**: the transparent score, with strong, partial and missing points and the formula. FMCG experience shows as *partial*, because it only comes from an academic project.
3. **✨ PREPARE MY APPLICATION** starts a 7-step mission:
   1. Select the CV version (the score is recalculated for each CV).
   2. Confirm the portfolio.
   3. Job analysis: *Why you fit* / *What could strengthen your application*.
   4. **3 smart questions**: motivation for this company, the FMCG gap, and a personal connection. The chicken also lists what it already knows and is not asking about.
   5. Generate in French or English, with the writing animation and the 🐔 **Quality check** (personalisation, repetition risk, CV repetition, similarity to previous letters, invented-figure check). If repetition is too high, the letter is regenerated automatically.
   6. Review and edit: Regenerate, Shorten, and More natural / professional / confident / creative / company-focused / marketing-focused. You can also translate FR ↔ EN, copy, download, save versions and re-check.
   7. Open the original platform, then confirm **✓ I submitted this application**.
4. The **confirmation** suggests a follow-up in 7 days and lets you set a reminder (*Set reminder*). The **tracker**, **timeline**, **company page**, **statistics** and the chicken's **journey position** all update.
5. In **Applications**, drag a card to *Interview* to open **Interview mode**: likely questions, STAR stories and practice answers. Drag it to *Offer* for the 👑 celebration.

---

## Features

| Area | What works |
|---|---|
| **Job data** | Modular adapters (LinkedIn / Indeed / WTTJ) each emit their own raw format. The pipeline then normalises, **de-duplicates across platforms** (company + title similarity + location + description + URL) and upserts. It detects **new, updated, expired and already-seen** offers. A **daily scheduler** runs on first open each day, and **Refresh jobs** runs it on demand. |
| **Search & filters** | Free-text search over title, company, description, skills (FR/EN aliases), tools and location. Filters: contract (Stage≈Internship, Alternance≈Apprenticeship), field, location (incl. Remote/Hybrid/France/Other), source, publication date, duration, salary min/max, minimum match, show expired. Sort by match, recency, salary or company. |
| **Relevance score** | Weighted and explainable: skills, position/field, contract and duration, location, experience, tools, industry, education, keywords, and a language penalty. It is shown as strong / partial / missing points with a points table. It is a recommendation and never hides offers. |
| **Profile** | Personal info, career goal, personal pitch, preferences (contracts, locations, work mode, fields, industries, durations, positions, keywords, companies). |
| **CVs** | Upload **PDF/DOCX** (parsed locally: a ZIP reader for DOCX; a PDF reader with Flate/ASCII85 and ToUnicode support). There is a paste-text fallback, multiple named versions, *replace* (which keeps older versions), and a default CV. All extracted data stays editable: education, experiences, internships, projects, skills, tools, languages, certifications, achievements and results, plus detected job titles and industries. |
| **Portfolio** | URL, description, other links (LinkedIn, Behance, GitHub, website, other), and the projects you describe. It is never fetched or scraped. |
| **Knowledge base** | One structured view, with the CV evidence behind each skill. |
| **AI assistant** | 🐔 Career Chicken panel: analyse, fit, gaps, letter, improve, more personal, shorter, interview questions, follow-up draft. Every output is tagged *Your profile*, *Job offer*, *Your answers* or *Chicken suggestion*. |
| **Cover letters** | Built in this order: plan (facts), then render (language + tone), then check. CV = evidence, portfolio = at most one pointer, letter = why this company + role + me. The **anti-repetition engine** compares against previous letters, the CV, the portfolio and the profile; rotates openings, phrasing and the main experience; refuses stock openings; checks that every number exists in a source; and blocks buzzwords. Letters are versioned and store their full generation metadata. |
| **Tracker** | Kanban board (To Apply → Applied → Follow-up → Interview → Final Round → Offer / Rejected / Withdrawn) with drag and drop plus an accessible "Move to" select. Each record has every requested field, a timeline (with manual events), documents (the CV and letter versions used, your answers), follow-ups (reminders and a follow-up draft) and interview prep. Duplicate-application and expired-offer warnings are included. |
| **Companies** | History per company: positions, dates, statuses, interviews, rejections, offers, and open offers in the feed. |
| **Statistics** | Applications per month, by status, contract, source, industry and location; the funnel; response, interview and offer rates. Charts include hover/focus tooltips and a table view. |
| **Saved** | Notes, priority (high/medium/low), expired flag, move to application, remove. |
| **Career Chicken** | A pixel-art sprite with moods and accessories. The journey map position is derived from real progress, and **rejections never move it back**. Levels 1–4 come from XP; levels 5–7 come only from real milestones (interview, final round, offer). There are unlockable accessories (wear up to 2), daily quests, achievements, a career profile, reactions to match scores, mission mode and an offer celebration. |

---

## Architecture

```
chic-career/
├── index.html              app shell (sidebar, top bar, mobile nav, modal/toast roots)
├── css/
│   ├── style.css           design tokens + components
│   └── responsive.css      laptop / tablet / mobile
├── js/
│   ├── i18n.js             platform language (EN/FR) translation layer
│   ├── storage.js          localStorage repository (namespaced keys, pub/sub) ← swap for an API client later
│   ├── ui.js               escaping, dates, text similarity, modal / toast / confirm helpers
│   ├── knowledge.js        skills (FR/EN aliases + related), tools, fields, industries, languages
│   ├── data.js             DEMO catalogue, demo profile, CVs, applications
│   ├── adapters.js         JobDataService + LinkedIn / Indeed / WTTJ adapters, dedupe, scheduler
│   ├── matching.js         profile knowledge base + transparent match score
│   ├── chicken.js          sprite generator, moods, accessories, XP, levels, journey, quests
│   ├── cv.js               DOCX/PDF text extraction + section parser + CV versions
│   ├── ai.js               AI provider interface, analysis, smart questions, interview prep, follow-ups
│   ├── cover-letter.js     plan → render → check, anti-repetition, tones, FR/EN
│   ├── applications.js     application model, Kanban, record, timeline, follow-ups, interview mode
│   ├── jobs.js             discovery, filters, job detail, saved jobs
│   ├── mission.js          7-step application mission
│   ├── profile.js          profile tabs, CV review editor, portfolio, preferences, AI settings, career profile
│   ├── companies.js        company tracking
│   ├── statistics.js       KPIs + charts (HTML/SVG, no library)
│   ├── dashboard.js        "What should I do today?", journey map, quests, funnel
│   ├── assistant.js        Career Chicken side panel
│   ├── seed.js             demo seeding / start fresh
│   └── app.js              router, chrome, daily scheduler, reminder notifications
└── assets/demo/            sample CVs (DOCX + PDF) for upload testing
```

Scripts are plain (non-module) files attached to a single `window.MT` namespace, so the app runs from `file://` without a server.

### Going live later
- **Job sources:** replace an adapter's `fetchRaw()` with a call to an official API or authorised partner feed, behind a backend that holds the credentials, and set `mode: 'live'`. `normalize()`, dedupe and upsert stay the same.
- **AI:** implement `ExternalProvider` in `js/ai.js` behind a backend endpoint, with a consent step before any CV data leaves the device.
- **Persistence:** replace `storage.js` with an API client exposing the same `get/set/update` contract.

### Data models (localStorage keys `chiccareer:*`)

- **profile**: name, email, phone, location, linkedin, portfolio, website, careerGoals, pitch, `preferences{…}`, `portfolioData{url,title,summary,links,projects}`
- **cvs[]**: `id, name, filename, version, targetRole, uploadDate, isDefault, archived, text, parsedData{education, experience[{role,company,location,dates,type,industry,bullets}], projects, skills, tools, languages, certifications, achievements, jobTitles, industries}`
- **jobs[]**: `id, title, company, companyAbout, location, workMode, contractType, duration, salary, sources[{source,externalId,url,title,publishedAt}], description, responsibilities, requirements{required,preferred,tools,languages,qualifications,experience}, fields, industry, language, publishedAt, expiresAt, status, firstSeenAt, updatedAt`
- **applications[]**: `id, jobId, company, position, contractType, duration, location, source, url, salary, applicationDate, status, cvId, cvVersion, portfolioUrl, coverLetterId, coverLetterVersion, userAnswers, notes, contact{name,email}, interviewDate, followUpDate, timeline[], matchScore, lastUpdate`
- **coverLetters[]**: `id (coverLetterId), applicationId, jobId, language, cvId, cvVersion, portfolioVersion, jobVersion, userAnswers, plan, choices, content, createdAt, updatedAt, version, history[], similarityScore, personalizationScore, cvRepetition, quality`
- **saved**, **reminders**, **answers** (reusable answers by company), **drafts** (in-progress missions), **quests**, **activity**, **settings**, **interviewPrep**, **meta** (refresh cycle and report).

---

## Privacy

- Everything is stored in this browser's `localStorage`. There is no account and no server.
- CV files are read in the browser. **Only the extracted text and structured data are kept**; the file is never uploaded or stored.
- Portfolio URLs are only displayed and linked, never fetched.
- No email or application is ever sent automatically. Follow-ups are drafts you copy yourself.
- External AI would require explicit consent and is not enabled in this prototype.

## Accessibility & responsive

- Semantic landmarks and a skip link. Keyboard-operable everything, including the Kanban "Move to" alternative to drag and drop.
- Visible focus, labelled form fields, friendly error messages, `aria-live` toasts, focus-trapped modals, and a table view for every chart.
- `prefers-reduced-motion` support, plus a `forced-colors` fallback.
- Layouts for desktop, laptop and tablet. On mobile: bottom navigation, a filter drawer, a horizontally scrollable Kanban and a vertical journey list.

## QA checklist (verified in headless Chromium)

- ✅ Jobs load, search, filters, sorting, sources visible, duplicates merged (31 raw listings → 24 offers)
- ✅ Daily refresh (new / updated / expired / already seen), scheduled run on a new day
- ✅ CV upload: DOCX, PDF (standard fonts) and PDF (embedded TTF + ToUnicode). Unsupported format and unreadable file errors work. Versions and default CV work.
- ✅ Portfolio and profile persist after reload
- ✅ Job analysis, match score, smart questions (3 for the demo job), validation
- ✅ Letter generation, tone rewrites, FR ↔ EN translation, edits saved as versions, quality re-check
- ✅ No invented figures (number check); repetition scores computed against previous letters
- ✅ Apply confirmation → status *Applied*, timeline, follow-up reminder
- ✅ Kanban drag and drop / move, interview mode, offer celebration
- ✅ Statistics and dashboard update from tracker changes
- ✅ No horizontal overflow at 390 px, 820 px or 1360 px; no console errors

## Future extensions (architecture-ready, not implemented)

Gmail and Outlook, calendar sync, LinkedIn profile import, official job APIs, an AI interview simulator, automated follow-up drafts sent via email integration, job alerts, salary comparison, company research, ATS CV optimisation, multiple accounts, a cloud database, authentication and secure document storage.
