// ─────────────────────────────────────────────────────────────────────────────
// Firebase web config for CANTOMESH Google sign-in.
//
// These values are PUBLIC identifiers, not secrets — Firebase web config is meant
// to ship in client code. Access is gated by Firebase Security Rules + the list of
// Authorized Domains, NOT by hiding this object. It is safe to commit.
//
// HOW TO FILL THIS IN (one-time, ~5 min):
//   1. Go to https://console.firebase.google.com  →  Add project (name it e.g. cantomesh).
//   2. Build → Authentication → Get started → Sign-in method → enable **Google**.
//   3. Project settings (⚙) → General → "Your apps" → Web (</>) → register an app.
//      Copy the `firebaseConfig` object it shows you into the fields below.
//   4. Authentication → Settings → Authorized domains → add:
//        tuffhell.github.io      (your GitHub Pages host)
//        localhost               (for local testing)
//   5. (Optional cloud sync) Build → Firestore Database → Create database
//      (production mode), then paste the rules from docs/FIREBASE_SETUP.md.
//
// Until real values are filled in, the site stays fully functional in OFFLINE mode:
// the 平仄 verifier and the "我的唱詞集" collection just use localStorage, and the
// sign-in button shows a friendly "not configured yet" note instead of erroring.
// ─────────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyCMG5Eb8vaJVCJeWkkBIA7_0kjiYANfZtA",
  authDomain: "cantomesh-d1146.firebaseapp.com",
  projectId: "cantomesh-d1146",
  storageBucket: "cantomesh-d1146.firebasestorage.app",
  messagingSenderId: "959677613724",
  appId: "1:959677613724:web:a0ed0f0f93848b49548f59",
  measurementId: "G-F40Y1E1ZSR",
};

// Pin the Firebase JS SDK version loaded from the gstatic CDN.
export const FIREBASE_VERSION = "10.12.2";
