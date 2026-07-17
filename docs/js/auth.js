// ─────────────────────────────────────────────────────────────────────────────
// Optional Google sign-in for CANTOMESH, backed by Firebase Auth + Firestore.
//
// Purely additive: the game and the 學藝手記 journal work fully offline with none
// of this. Signing in just syncs your journal to your Google account so it follows
// you across devices (the app already flags this: jr.local → "接通 Firebase 後…").
//
// This module:
//   • loads the Firebase SDK lazily, only when real config is present;
//   • never throws into the page on load;
//   • exposes a tiny per-user journal store in Firestore (doc users/{uid}).
// ─────────────────────────────────────────────────────────────────────────────

import { firebaseConfig, FIREBASE_VERSION } from "./firebase-config.js";

const CDN = (m) => `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-${m}.js`;

// Placeholder config counts as "not configured", so the app never crashes pre-setup.
const CONFIGURED =
  !!firebaseConfig &&
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.length > 12 &&
  !firebaseConfig.apiKey.startsWith("YOUR_") &&
  !String(firebaseConfig.projectId).startsWith("YOUR_");

let _auth = null;
let _db = null;
let _authFns = null;
let _dbFns = null;
let _booted = false;

let currentUser = null;
const listeners = new Set();

export function authConfigured() {
  return CONFIGURED;
}
export function getUser() {
  return currentUser;
}

/** Subscribe to auth-state changes. Fires immediately with the current user. */
export function onUser(cb) {
  listeners.add(cb);
  cb(currentUser);
  return () => listeners.delete(cb);
}
function emit() {
  listeners.forEach((cb) => { try { cb(currentUser); } catch { /* ignore */ } });
}

/** Boot Firebase once. No-op / graceful when unconfigured. */
export async function initAuth() {
  if (!CONFIGURED || _booted) return { configured: CONFIGURED };
  _booted = true;
  try {
    const [appMod, authMod, dbMod] = await Promise.all([
      import(CDN("app")),
      import(CDN("auth")),
      import(CDN("firestore")),
    ]);
    const app = appMod.initializeApp(firebaseConfig);
    _auth = authMod.getAuth(app);
    _authFns = authMod;
    _db = dbMod.getFirestore(app);
    _dbFns = dbMod;
    _authFns.onAuthStateChanged(_auth, (user) => { currentUser = user; emit(); });
    return { configured: true };
  } catch (err) {
    console.warn("[cantomesh] Firebase init failed; staying offline.", err);
    _booted = false;
    return { configured: false, error: err };
  }
}

export async function signIn() {
  if (!CONFIGURED) throw new Error("auth-not-configured");
  if (!_auth) await initAuth();
  const provider = new _authFns.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await _authFns.signInWithPopup(_auth, provider);
  return cred.user;
}

export async function signOutUser() {
  if (_auth) await _authFns.signOut(_auth);
}

// ── Per-user journal store (Firestore doc users/{uid}, field `journal`) ────────

/** Read the signed-in user's cloud journal. Returns [] if none, null if offline. */
export async function pullJournal() {
  if (!currentUser || !_db) return null;
  const { doc, getDoc } = _dbFns;
  const snap = await getDoc(doc(_db, "users", currentUser.uid));
  return (snap.exists() && Array.isArray(snap.data().journal)) ? snap.data().journal : [];
}

/** Write the journal array to the signed-in user's cloud doc. */
export async function pushJournal(posts) {
  if (!currentUser || !_db) return;
  const { doc, setDoc } = _dbFns;
  await setDoc(
    doc(_db, "users", currentUser.uid),
    { journal: posts, updated: Date.now() },
    { merge: true }
  );
}
