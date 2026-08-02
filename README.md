# Backend Syllabus Tracker

A single-user, mobile-first progress tracker for a 12-phase (267-hour) backend
engineering syllabus. Built to be used at night on a phone. The core rule it
enforces: **you advance on the gate, not on hours spent** — a phase is only
complete when its gate artifact exists, no matter how many topics are checked.

- **Stack:** Vite + React + TypeScript, Tailwind (no component library)
- **Backend:** Firebase — Firestore for data, Firebase Auth (Google) for a single user
- **Hosting:** Firebase Hosting
- **Access control:** Firestore security rules locked to your UID only

---

## 1. Prerequisites

- Node.js 18+ and npm
- A Google account
- The Firebase CLI:

  ```bash
  npm install -g firebase-tools
  ```

## 2. Create the Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**. Name it, finish
   the wizard (Analytics optional).
2. **Enable Authentication:** Build → Authentication → **Get started** → **Sign-in
   method** → enable **Google** → save. Under Authentication → **Settings →
   Authorized domains**, make sure `localhost` and your `*.web.app` /
   `*.firebaseapp.com` domain are listed (they are by default).
3. **Create Firestore:** Build → Firestore Database → **Create database** →
   **Production mode** → pick a region.
4. **Register a web app:** Project settings (gear icon) → **General** → *Your apps*
   → **Web** (`</>`). Register it. Copy the `firebaseConfig` values — you'll paste
   them into `.env` next.

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

Open the printed URL, sign in with Google. On first sign-in the app **seeds** all
12 phases and a `meta` document automatically (only if none exist). The seed
script verifies the hours sum to 267 and throws loudly if they don't.

## 5. Lock down the security rules (important)

The app is single-user. You must pin the rules to *your* UID.

1. Sign in locally once. Find your UID in Firebase Console → Authentication →
   **Users** (the "User UID" column), or log `auth.currentUser.uid` in the browser
   console.
2. Open `firestore.rules` and replace `YOUR_UID_HERE` with your UID.
3. Point `.firebaserc` at your project: replace `your-project-id` with your actual
   project id (or run `firebase use --add`).
4. Deploy the rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

The rules allow reads/writes under `users/{uid}/**` **only** when the caller is
authenticated, the path UID matches the caller, and the caller's UID equals your
hardcoded UID. Everything else is denied.

## 6. Deploy to Firebase Hosting

First-time setup (once per machine/project):

```bash
firebase login
firebase use --add        # select your project, alias it "default"
```

Then build and deploy:

```bash
npm run build
firebase deploy --only hosting
```

Or both hosting + rules at once:

```bash
npm run deploy            # runs build, then `firebase deploy`
```

Your app will be live at `https://<project-id>.web.app`.

---

## Data model

```
users/{uid}/phases/{phaseId}   -> { title, hours, description, gate,
                                     gatePassed, topics: [{name, hours, detail, done}] }
users/{uid}/meta/profile       -> { targetHoursPerWeek, startDate }
users/{uid}/reviews/{autoId}   -> { stalled, nextObjective, createdAt }
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
| `npm run deploy`    | Build then `firebase deploy`               |
