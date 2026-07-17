// ─────────────────────────────────────────────────────────────────────────────
// Firebase web config for CANTOMESH Google sign-in (journal cloud sync).
//
// These are PUBLIC identifiers, not secrets — Firebase web config is meant to ship
// in client code. Access is gated by Firebase Security Rules + Authorized Domains,
// not by hiding this object, so it is safe to commit. See docs/FIREBASE_SETUP.md.
//
// To point at a different project: replace the six values below (Firebase console →
// Project settings → Your apps → Web) and the `default` id in .firebaserc.
// Until real values are present, the app stays fully offline — the journal just
// uses localStorage and the sign-in button shows a friendly "not set up" note.
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

// Firebase JS SDK version loaded from the gstatic CDN (lazily, only when configured).
export const FIREBASE_VERSION = "10.12.2";
