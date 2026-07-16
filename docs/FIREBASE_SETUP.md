# Google Sign-in via Firebase — setup guide

CANTOMESH's public site works with **zero** Firebase configuration: the 平仄
verifier and the "我的唱詞集 / My verse collection" run entirely offline
(localStorage). Signing in with Google is **purely additive** — it syncs a user's
saved verses to the cloud (Firestore, keyed per user) so the collection follows
them across devices.

This guide has two halves:
- **What the developer already did** (the code that ships in this repo).
- **What *you* must do** to switch it on (≈ 5–10 minutes, no code changes).

---

## Architecture (what's already built)

```
 docs/js/firebase-config.js   ← you paste your project's public config here
 docs/js/auth.js              ← lazy-loads Firebase, Google popup sign-in,
                                 auth-state listener, Firestore verse store
 docs/js/app.js               ← wires the sign-in button, avatar, collection UI
```

Design decisions made for you:
- **Graceful when unconfigured.** While `firebase-config.js` still holds the
  `YOUR_…` placeholders, the SDK is never loaded, the site never errors, and the
  sign-in button shows a friendly "not configured yet" toast. Saved verses live
  in `localStorage`.
- **Lazy SDK load.** Firebase is imported from the gstatic CDN *only* when real
  config is present, so the offline core stays fast and dependency-free.
- **Auto-merge on first sign-in.** Anything a user saved offline is lifted into
  their cloud collection the first time they authenticate.
- **Least surprise on data.** Verses are stored at
  `users/{uid}/verses/{autoId}` with `{ text, score, ts }` — nothing else, no PII
  beyond the Google account Firebase itself manages.

---

## What you need to do

### 1 · Create a Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** (e.g. `cantomesh`).
2. Google Analytics is optional — you can skip it.

### 2 · Enable Google sign-in
1. **Build → Authentication → Get started.**
2. **Sign-in method → Add new provider → Google → Enable.**
3. Set a project support email, then **Save**.

### 3 · Register a Web app and copy the config
1. **Project settings (⚙) → General → Your apps → Web (`</>`).**
2. Give it a nickname (Firebase Hosting is *not* needed — you're on GitHub Pages).
3. Firebase shows a `firebaseConfig = { … }` object. Copy those six values into
   [`docs/js/firebase-config.js`](js/firebase-config.js), replacing every
   `YOUR_…` placeholder. Commit the file — **these values are public identifiers,
   not secrets** (see the security note below).

### 4 · Authorize your domains
**Authentication → Settings → Authorized domains → Add domain:**
- `tuffhell.github.io` — your GitHub Pages host
- `localhost` — for local testing

(Google sign-in popups are rejected from any domain not on this list — this, not
config-hiding, is what actually protects the project.)

### 5 · (Optional) Turn on cloud sync with Firestore
Skip this and sign-in still works — the collection just won't sync across devices.
To enable sync:
1. **Build → Firestore Database → Create database → Production mode.**
2. **Rules** tab → paste these and **Publish** (each user can only touch their own
   verses):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/verses/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 6 · Test it
1. Locally: from the repo root run `python3 -m http.server -d docs 8099` and open
   <http://localhost:8099/> → click **以 Google 登入 / Sign in with Google**.
2. A Google popup should appear; after sign-in your avatar and name replace the
   button, and saved verses sync. Sign out and back in on another device to
   confirm the collection follows you.

---

## Security & privacy notes (for the write-up / judges)

- **The web config is not a secret.** Firebase's own docs state the web API key
  only identifies the project to Google; it grants no privileged access.
  Protection comes from **Authorized Domains** + **Security Rules**, both set
  above. It is normal and correct to commit `firebase-config.js`.
- **Data minimisation.** Only the user's own verse text, score and timestamp are
  stored, under their `uid`. The rules make cross-user reads impossible.
- **No lock-in.** Because the offline path is a first-class mode, removing
  Firebase later is a one-file change — the verifier never depended on it.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Button shows "not configured yet" toast | `firebase-config.js` still has `YOUR_…` placeholders. |
| `auth/unauthorized-domain` in console | Add the exact host under Authentication → Settings → Authorized domains. |
| Popup opens then closes, no sign-in | Usually an ad/popup blocker, or `localhost` not authorized. |
| Verses don't sync across devices | Firestore not created, or rules not published (step 5). |
