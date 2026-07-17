# Google sign-in via Firebase — setup guide

CANTOMESH works with **zero** Firebase config: the game and the 學藝手記 journal run
fully offline (localStorage). Signing in with Google is **purely additive** — it
syncs a user's journal to their own Firestore document (`users/{uid}`) so it follows
them across devices. The app already flags this in the journal header
(`jr.local` → "接通 Firebase 後可與同好分享").

## What ships in the repo
```
docs/js/firebase-config.js   ← your project's public web config
docs/js/auth.js              ← lazy-loads Firebase, Google popup sign-in, journal store
docs/js/journal.js           ← sign-in button + merge/sync wired into the 手記 tab
firebase.json                ← hosting + firestore.rules
firestore.rules              ← each user reads/writes only users/{uid}
```
Graceful by design: while `firebase-config.js` holds placeholder values the SDK is
never loaded, nothing errors, and the journal shows the offline note instead of a
sign-in button.

## What you do (~5–10 min, no code)

1. **Create / pick a Firebase project** at <https://console.firebase.google.com>.
2. **Enable Google sign-in:** Build → **Authentication** → Get started →
   Sign-in method → **Google → Enable → Save**.
3. **Create Firestore:** Build → **Firestore Database** → Create database →
   Production mode.
4. **Copy your web config:** ⚙ Project settings → Your apps → Web (`</>`) → paste
   the six values into [`docs/js/firebase-config.js`](js/firebase-config.js), and
   put the project id in [`.firebaserc`](../.firebaserc). (These are public
   identifiers, not secrets — safe to commit.)
5. **Deploy:**
   ```bash
   npx firebase-tools login          # interactive browser OAuth
   npx firebase-tools deploy         # hosting + Firestore rules
   ```
   Site → `https://<project>.web.app`. Firebase Hosting domains are **auto-authorized**
   for Auth, so Google sign-in works there immediately.
   (Staying on GitHub Pages instead? Add `tuffhell.github.io` under
   Authentication → Settings → Authorized domains, and deploy rules with
   `npx firebase-tools deploy --only firestore:rules`.)

## Test
Open the site → **手記 / Journal** tab → **Sign in · sync** → pick a Google account.
Your avatar/name appears, the journal syncs, and posting on another device shows the
same entries.

## Security notes
- The web API key only identifies the project; protection comes from the Authorized
  Domains list + `firestore.rules` (each user is locked to `users/{uid}`).
- Only the user's own journal array + a timestamp are stored. No cross-user reads.
- Removing Firebase later is a config change — the game never depends on it.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Journal shows the offline note, no button | `firebase-config.js` still has placeholder values. |
| `auth/unauthorized-domain` in console | Add the exact host under Authentication → Settings → Authorized domains. |
| Popup opens then closes | Ad/popup blocker, or the host isn't authorized. |
| Journal doesn't sync | Firestore not created, or rules not deployed. |
