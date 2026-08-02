# Syllabus Tracker

A single-user, mobile-first progress tracker for **two tracks**, built to be
used at night on a phone. A unit is **complete when everything in it is ticked**
— completion is derived from the checklist, not declared by a button. Each unit
still states its gate artifact, so the standard for ticking a subtopic is "I
could produce this", not "I have read about this".

| Track | Content | Hours | Units |
| ----- | ------- | ----- | ----- |
| **GATE 2027 — CS** | 12 subjects → weekly topics → daily subtopics, plus the live 28-week campaign timeline (W0 → exam, 6 Feb 2027) | 852 h first-pass (1,245 h across the full campaign) | 12 subjects · 86 target marks |
| **Backend Engineering** | 12 phases → topics → the full "what exactly to learn" subtopic list | 267 h | 12 phases |

Everything is checkable at **subtopic** level — 123 GATE subtopics and 201
backend subtopics, each with its own hour allocation.

Alongside the plan sits a **reference layer**: the syllabus itself, broken down
to 733 GATE concepts across 75 chapters plus all 201 backend concepts, each with
one line saying what it is or what gets asked, and each chapter naming the exact
book chapter that covers it. The GATE text is verbatim from the official IIT
Madras syllabus, with the 2027 additions and removals flagged.

The GATE **Timeline** tab is live: it ticks every second, counts down to the
first exam session, highlights the current week against real dates, and lets
you mark each weekly gate passed or failed. Every tick, gate and review is
logged, so the dashboard reports real hours per day rather than estimates.

- **Stack:** Vite + React + TypeScript, Tailwind (no component library)
- **Backend:** Firebase — Firestore for data (no login)
- **Hosting:** Netlify
- **Access:** no sign-in. All data lives under the fixed path `users/me`.

> ⚠️ **No login = open data.** Without authentication the security rules cannot
> tie access to a person, so `users/me` is world-readable/writable by anyone with
> the app's (public) Firebase config. This is the deliberate trade-off for
> "enter without login". If you need it locked down, re-introduce Firebase Auth.

---

## 1. Prerequisites

- Node.js 18+ and npm
- The Firebase CLI (only needed to deploy the security rules):

  ```bash
  npm install -g firebase-tools
  ```

## 2. Create the Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**. Name it, finish
   the wizard (Analytics optional).
2. **Create Firestore:** Build → Firestore Database → **Create database** →
   **Production mode** → pick a region.
3. **Register a web app:** Project settings (gear icon) → **General** → *Your apps*
   → **Web** (`</>`). Register it. Copy the `firebaseConfig` values — you'll paste
   them into `.env` next.

(No Authentication setup — this app has no login.)

## 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` from the `firebaseConfig` object shown when you registered the web
app:

| .env var                           | firebaseConfig key   |
| ---------------------------------- | -------------------- |
| `VITE_FIREBASE_API_KEY`            | `apiKey`             |
| `VITE_FIREBASE_AUTH_DOMAIN`        | `authDomain`         |
| `VITE_FIREBASE_PROJECT_ID`         | `projectId`          |
| `VITE_FIREBASE_STORAGE_BUCKET`     | `storageBucket`      |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| `messagingSenderId`  |
| `VITE_FIREBASE_APP_ID`             | `appId`              |

These are client-side identifiers, not secrets — real access control is enforced
by the security rules below. `.env` is gitignored regardless.

## 4. Run locally

```bash
npm install
npm run dev
```

Open the printed URL — the app loads straight in, no login. On first load it
**seeds** all 12 phases and a `meta` document automatically (only if none exist).
The seed script verifies the hours sum to 267 and throws loudly if they don't.

## 5. Deploy the security rules

There is no login, so the rules can't be tied to a user. `firestore.rules` allows
open read/write to the single `users/me` path and denies everything else. You must
publish these rules or Firestore (in Production mode) will deny all access.

1. Point `.firebaserc` at your project: replace `your-project-id` with your actual
   project id (or run `firebase use --add`).
2. Deploy the rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

⚠️ These rules are intentionally open (see the warning at the top). Anyone with the
public Firebase config can read/write `users/me`. Re-add Firebase Auth if you need
access control.

## 6. Deploy to Netlify

Firebase is used only for data; hosting is Netlify. Pick one method.

**A. Git-based (recommended — auto-deploys on every push):**

1. Push the repo to GitHub (already done).
2. <https://app.netlify.com> → **Add new site → Import an existing project** → pick
   this repo.
3. Build settings are auto-detected from `netlify.toml` (build `npm run build`,
   publish `dist`). Leave them as-is.
4. **Site configuration → Environment variables** → add the six `VITE_FIREBASE_*`
   values from your `.env`. Netlify builds in the cloud, so it needs them at build
   time (they're public client identifiers, not secrets).
5. Deploy. Every push to `main` now rebuilds and redeploys automatically.

**B. Netlify CLI:**

```bash
npm install -g netlify-cli
netlify login
netlify deploy --build --prod
```

The app has no login, so nothing else is needed after deploy — the live URL loads
straight into the tracker.

---

## Data model

**Firestore is the source of truth.** The files under `src/data/` are a
one-time bootstrap payload only — after the first load, every read and write
goes to the database and the app never falls back to the local copy.

```
users/me/tracks/{trackId}                  -> 'gate' | 'backend'
users/me/tracks/{trackId}/phases/{phaseId} -> { title, hours, description, gate,
                                                gatePassed, targetMarks?, weeks?,
                                                topics: [{ name, hours, detail, done,
                                                  subtopics: [{ name, hours, done, isNew? }] }] }
users/me/tracks/gate/weeks/{weekId}        -> { title, dates, start, end, phase, kind,
                                                hours, days[], dayDone[], gate,
                                                milestone?, status, missedAt }
users/me/tracks/{trackId}/meta/profile     -> { targetHoursPerWeek, startDate }
users/me/tracks/{trackId}/meta/seed        -> { version, at }
users/me/tracks/{trackId}/reviews/{autoId} -> { stalled, nextObjective, builtPct,
                                                previousDone, createdAt }
users/me/tracks/{trackId}/activity/{autoId}-> { kind, label, hours, at }
```

Legacy v1 data at `users/me/phases/*` is migrated automatically on first load:
ticked topics and passed gates are carried across to the backend track, and the
old documents are left in place as a safety net.

**Completion is derived from the checklist.** Ticking a parent topic cascades to
its subtopics; ticking every subtopic marks the parent done; ticking every
subtopic in a unit writes `gatePassed: true` on that unit, and unticking any one
of them clears it again. There is no button — `isPhaseComplete()` returns
`allWorkDone(phase) || phase.gatePassed`, the second half only so that units
passed by hand before this rule changed stay complete until the next tick
recomputes them. Both transitions are recorded in the activity log.

"Hours logged" = the sum of hours from **subtopics** you've marked done (input
measure), shown against the track's fixed total.

**One tick, both places.** On the GATE track the same day of study exists twice
— as a day of a campaign week on the Timeline, and as a subtopic inside its
subject. `src/data/gateLinks.ts` links the two positionally (every week has 7
days, every core-week topic has 6 subtopics, so day 0–5 ↔ subtopic 0–5 and
Sunday has no counterpart), and ticking either one writes the other. 108 links
across the 18 core weeks W1–W18; setup, revision, mock and taper weeks are
campaign-only. Only the originating tick logs its hours, so nothing double-counts.

**Missing a week is recorded, permanently.** Once a campaign week's end passes
with study days still unticked, `missedAt` is written to that week and never
cleared. Finishing the work afterwards still counts — the week shows "caught up
late" rather than disappearing. The Backlog page derives the same thing straight
from the dates, so a week that has just closed shows immediately, before the
sweep that persists it has run.

**Every tick writes an event.** Ticking a subtopic, closing a topic, passing a
gate, working a campaign day or saving a review appends one document to
`activity` with its hour delta and a client timestamp. That log is what makes
"hours this week", the weekday bars and the pace chart a record rather than an
estimate — nothing on those charts is inferred.

## Screens

1. **Dashboard** — the landing screen: the one gate you are on right now with
   everything else reporting to it — gates X/12, hours logged, the unit ladder,
   the literal next three subtopics, hours per weekday this week, build-vs-read
   from your last four reviews, and recent activity.
2. **Progress** — hours logged vs the track total, subtopic count, a tappable
   unit-progress matrix, and the gate ladder (with target marks per subject on
   the GATE track).
3. **Timeline** (GATE only) — a live campaign clock: seconds-accurate countdown
   to 6 Feb 2027, a 28-week strip with milestone ticks and a "you are here"
   needle, this week broken into tickable days with their planned hours, and
   pass/fail on every weekly gate.
4. **Syllabus** — the reference page: every chapter and every concept, each with
   one line saying what it is or what gets asked. 733 GATE concepts across 75
   chapters, 201 backend concepts. Every subject carries a **Learn from** block
   (books ranked, one lecture course to pick, where to drill) and every one of
   the 75 GATE chapters and 54 backend topics names the exact book chapter that
   covers it. Searchable across names and explanations, filterable to what the
   2027 revision added or dropped. Read-only by design — ticking stays on the
   study plan so the two can never disagree.
5. **Unit detail** — everything about one subject or phase on one page, and the
   same on every roadmap: the gate artifact with a progress bar and a count of
   what is left to tick (no button — completion follows the checklist), topic →
   subtopic checklist on the right, then the **Learn from** block, then
   **Syllabus in full** — the unit's whole scope, every chapter naming the book
   chapter that covers it and every concept carrying its explanation. It opens
   expanded on GATE, where the official syllabus is a different shape from the
   weekly plan, and collapsed elsewhere, where the checklist above already is the
   syllabus. Backend subtopics additionally carry their explanation inline, next
   to the checkbox you tick.
6. **Backlog** — what is behind, oldest miss first. On GATE that is every
   campaign week that closed with days still open, each expanded into the
   individual days outstanding, with weeks you finished late still listed and
   marked as such. On roadmaps with no dates it is positional instead: anything
   unticked in a unit you have already moved past. Rows are not editable — each
   links to the page where the work actually gets ticked.
7. **Weekly review** — a full writing screen (not a cramped modal): what
   stalled, the next single objective, a drag-to-set build/read split, what last
   week said with a did-it / didn't answer, and the week's real hours.
8. **Reviews** — the honest log: pace per week against your target, and every
   review as a row, filterable to the weeks you missed target or passed a gate.

## Where the content comes from

- `src/data/gateData.ts` — the 12 GATE subjects, built from the *AIR < 50
  Campaign Plan* and the *196-day Daily To-Do List*. One topic per campaign
  week; one subtopic per study day (Mon–Thu 7 h each, Fri consolidation 7 h,
  Sat timed test + analysis 10 h = 45 h/week).
- `src/data/gateWeeks.ts` — the 28-week calendar with real dates, weekly gates
  and milestones M0–M8.
- `src/data/seedData.ts` — the backend syllabus with the complete "what exactly
  to learn" list for every topic.

Each file ships a verifier that throws at seed time if the hours stop adding up.

The Syllabus page reads from two further files, which hold no progress state and
are never seeded into Firestore:

- `src/data/gateSyllabus.ts` — 12 subjects → 75 chapters → 733 concepts. Every
  `official` string is the **verbatim** text of the syllabus released by IIT
  Madras ([CS](https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf),
  [GA](https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/GA_GATE2027_Syllabus.pdf));
  the concept lists under each line are the standard expansion from the texts the
  paper is set from. `isNew` flags what the 2027 revision made explicit (control
  unit design, memory interfacing, the tabular minimisation method) and `dropped`
  flags what it removed (secondary storage, the named OSI layers, ARP/ICMP/DHCP,
  FTP/SMTP), so you can positively confirm what to skip.
- `src/data/backendSyllabus.ts` — one line of explanation for each of the 201
  backend subtopics, keyed by name against `seedData.ts` rather than duplicating
  the tree, plus the canonical reading per phase. A concept with no gloss simply
  renders without one.

## Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the Vite dev server                 |
| `npm run build`     | Type-check and build to `dist/`           |
| `npm run preview`   | Preview the production build locally       |
| `npm run typecheck` | Type-check only                            |
