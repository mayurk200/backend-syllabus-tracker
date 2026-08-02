# Backend Syllabus Tracker

A single-user, mobile-first progress tracker for a 12-phase (267-hour) backend
engineering syllabus. Built to be used at night on a phone. The core rule it
enforces: **you advance on the gate, not on hours spent** — a phase is only
complete when its gate artifact exists, no matter how many topics are checked.

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

```
users/me/phases/{phaseId}   -> { title, hours, description, gate,
                                  gatePassed, topics: [{name, hours, detail, done}] }
users/me/meta/profile       -> { targetHoursPerWeek, startDate }
users/me/reviews/{autoId}   -> { stalled, nextObjective, createdAt }
```

**Topic % and gate status are tracked separately.** The UI never marks a phase
complete from topic completion alone — only `gatePassed` does that.

"Hours logged" on the dashboard = the sum of hours from topics you've marked
`done` (input measure), shown against the fixed 267h total.

## Screens

1. **Dashboard** — overall topic %, gates passed (X/12), hours logged vs 267, a
   tappable phase-progress strip, and the 70/30 build-vs-read ratio reminder.
2. **Phase detail** — gate box prominently at the top (toggle with a confirm),
   topic checklist with hours, running hours logged.
3. **Weekly review** — a modal to jot "what stalled" and "next single objective",
   timestamped and stored under `reviews`.

## Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the Vite dev server                 |
| `npm run build`     | Type-check and build to `dist/`           |
| `npm run preview`   | Preview the production build locally       |
| `npm run typecheck` | Type-check only                            |
