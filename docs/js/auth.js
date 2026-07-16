// ─────────────────────────────────────────────────────────────────────────────
// Optional Google sign-in for CANTOMESH, backed by Firebase Auth + Firestore.
//
// Design principle: auth is *purely additive*. The site's core value — the offline
// 平仄 verifier — must keep working with zero network and zero config. So this
// module:
//   • loads the Firebase SDK lazily, only when real config is present;
//   • degrades gracefully to localStorage when Firebase is not configured;
//   • never throws into the page on load.
//
// What signing in buys the user: their saved verse collection (我的唱詞集) syncs to
// the cloud (Firestore, per-uid) instead of living only in this browser.
// ─────────────────────────────────────────────────────────────────────────────

import { firebaseConfig, FIREBASE_VERSION } from "./firebase-config.js";

const CDN = (m) => `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-${m}.js`;

// Treat placeholder config as "not configured" so the site never crashes pre-setup.
const CONFIGURED =
  !!firebaseConfig &&
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.length > 12 &&
  !firebaseConfig.apiKey.startsWith("YOUR_") &&
  !firebaseConfig.projectId.startsWith("YOUR_");

let _auth = null;
let _db = null;
let _authFns = null; // GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
let _dbFns = null; // collection, addDoc, getDocs, deleteDoc, doc, query, orderBy

let currentUser = null;
const listeners = new Set();

export function authConfigured() {
  return CONFIGURED;
}

/** Subscribe to auth-state changes. Fires immediately with the current user. */
export function onUser(cb) {
  listeners.add(cb);
  cb(currentUser);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((cb) => cb(currentUser));
}

/** Lazily boot Firebase. Safe to call once on page load; no-op when unconfigured. */
export async function initAuth() {
  if (!CONFIGURED) return { configured: false };
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
    _authFns.onAuthStateChanged(_auth, async (user) => {
      currentUser = user;
      if (user) await mergeLocalIntoCloud().catch(() => {});
      emit();
    });
    return { configured: true };
  } catch (err) {
    console.warn("[cantomesh] Firebase init failed; staying in offline mode.", err);
    return { configured: false, error: err };
  }
}

export async function signIn() {
  if (!CONFIGURED || !_auth) throw new Error("auth-not-configured");
  const provider = new _authFns.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await _authFns.signInWithPopup(_auth, provider);
  return cred.user;
}

export async function signOutUser() {
  if (_auth) await _authFns.signOut(_auth);
}

export function getUser() {
  return currentUser;
}

// ── Saved-verse store ────────────────────────────────────────────────────────
// Signed in  → Firestore  users/{uid}/verses
// Signed out → localStorage  (and merged up on next sign-in)

const LS_KEY = "cantomesh:verses";

function localVerses() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function setLocalVerses(v) {
  localStorage.setItem(LS_KEY, JSON.stringify(v));
}

/** List saved verses, newest first. */
export async function listVerses() {
  if (currentUser && _db) {
    const { collection, getDocs, query, orderBy } = _dbFns;
    const snap = await getDocs(
      query(collection(_db, "users", currentUser.uid, "verses"), orderBy("ts", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return localVerses().sort((a, b) => b.ts - a.ts);
}

/** Persist a verse. `entry` = { text, score }. Returns the stored record. */
export async function saveVerse(entry) {
  const rec = { text: entry.text, score: entry.score ?? null, ts: Date.now() };
  if (currentUser && _db) {
    const { collection, addDoc } = _dbFns;
    const ref = await addDoc(collection(_db, "users", currentUser.uid, "verses"), rec);
    return { id: ref.id, ...rec };
  }
  const v = localVerses();
  const stored = { id: "loc-" + rec.ts, ...rec };
  v.push(stored);
  setLocalVerses(v);
  return stored;
}

export async function deleteVerse(id) {
  if (currentUser && _db && !String(id).startsWith("loc-")) {
    const { doc, deleteDoc } = _dbFns;
    await deleteDoc(doc(_db, "users", currentUser.uid, "verses", id));
    return;
  }
  setLocalVerses(localVerses().filter((v) => v.id !== id));
}

// On first sign-in, lift anything saved offline into the user's cloud collection.
async function mergeLocalIntoCloud() {
  const local = localVerses();
  if (!local.length || !_db) return;
  const { collection, addDoc } = _dbFns;
  for (const v of local) {
    await addDoc(collection(_db, "users", currentUser.uid, "verses"), {
      text: v.text,
      score: v.score ?? null,
      ts: v.ts || Date.now(),
    });
  }
  setLocalVerses([]);
}
