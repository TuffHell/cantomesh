// 學藝手記 — an Instagram-style learning feed: post thoughts, each entry
// auto-attaches a snapshot of your real progress (stars, accuracy, masks,
// co-learn rounds), renders as feed cards, and exports a designed share PNG.
// Local-first (localStorage); signing in with Google syncs it to Firestore.
import { t, getLang } from "./i18n.js";
import { maskSVG } from "./masks.js";
import {
  authConfigured, initAuth, onUser, getUser, signIn, signOutUser,
  pullJournal, pushJournal,
} from "./auth.js";

const KEY = "cantomesh.journal.v1";
const CAP = 50;

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const save = (posts) => { try { localStorage.setItem(KEY, JSON.stringify(posts.slice(0, CAP))); } catch { /* ignore */ } };
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// Compact Google "G" mark for the sign-in button.
const GICON = `<svg class="jr-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7C43.7 37.9 46.5 31.8 46.5 24.5z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8z"/><path fill="#34A853" d="M24 48c6.4 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.3 0-11.7-3.7-13.6-9.1l-7.9 6.1C6.4 42.6 14.6 48 24 48z"/></svg>`;

// Merge two journals by id (unique timestamps), newest first, capped.
function mergePosts(a, b) {
  const byId = new Map();
  [...(a || []), ...(b || [])].forEach((p) => { if (p && p.id != null) byId.set(p.id, p); });
  return [...byId.values()].sort((x, y) => (y.when || 0) - (x.when || 0)).slice(0, CAP);
}

// Save locally, and (if signed in) mirror to the cloud.
function persist(posts) {
  save(posts);
  if (getUser()) pushJournal(posts.slice(0, CAP)).catch(() => { /* stay local */ });
}

function snapshot() {
  let quest = {}, loop = {}, best = {};
  try { quest = JSON.parse(localStorage.getItem("cantomesh.quest.v1")) || {}; } catch { /* */ }
  try { loop = JSON.parse(localStorage.getItem("cantomesh.colearn.v1")) || {}; } catch { /* */ }
  try { best = JSON.parse(localStorage.getItem("cantomesh.pose.v1")) || {}; } catch { /* */ }
  const stars = Object.values(quest.stars || {}).reduce((a, b) => a + b, 0);
  const acc = quest.stats?.total ? Math.round((quest.stats.correct / quest.stats.total) * 100) : 0;
  return {
    stars, acc,
    masks: (quest.masks || []).length,
    rounds: (loop.rounds || []).length,
    poses: ["saanbong", "seonfung", "liongseong"].filter((p) => (best[p] || 0) >= 74).length,
  };
}

const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
  " " + new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

function chips(s) {
  return `<span>★ ${s.stars}</span><span>${s.acc}% ${t("jr.acc")}</span>` +
    `<span>🎭 ${s.masks}</span><span>⟳ ${s.rounds} ${t("jr.rounds")}</span>` +
    (s.poses ? `<span>身段 ${s.poses}/3</span>` : "");
}

// Sign-in status shown in the compose card header.
function authStatus() {
  if (!authConfigured()) return `<small>${t("jr.local")}</small>`;
  const u = getUser();
  if (u) {
    const avatar = u.photoURL ? `<img class="jr-avatar" src="${u.photoURL}" alt="" referrerpolicy="no-referrer">` : "";
    return `<small class="jr-auth in">${avatar}<b>${esc(u.displayName || u.email || "")}</b>` +
      `<span class="jr-synced">${t("jr.synced")}</span>` +
      `<button class="jr-linkbtn" id="jr-signout">${t("jr.signout")}</button></small>`;
  }
  return `<small class="jr-auth out"><button class="jr-signin-btn" id="jr-signin">${GICON}${t("jr.signin")}</button></small>`;
}

// ── Auth wiring (registered once) ─────────────────────────────────────────────
let currentEl = null;
let authWired = false;

function wireAuth() {
  if (authWired) return;
  authWired = true;
  if (!authConfigured()) return;
  initAuth();
  onUser(async (user) => {
    if (user) {
      try {
        const cloud = await pullJournal();
        const merged = mergePosts(load(), cloud || []);
        save(merged);
        await pushJournal(merged);
      } catch { /* keep local copy */ }
    }
    if (currentEl && document.contains(currentEl)) renderJournal(currentEl);
  });
}

export function renderJournal(el) {
  currentEl = el;
  wireAuth();
  const lang = getLang();
  const posts = load();
  const showNote = authConfigured() && !getUser();
  el.innerHTML = `
    <div class="card jr-compose">
      <div class="jr-head">${maskSVG("tongsang", 40)}<div><b>${t("jr.title")}</b>${authStatus()}</div></div>
      ${showNote ? `<p class="hint jr-note">${t("jr.signinNote")}</p>` : ""}
      <textarea id="jr-text" rows="3" maxlength="280" placeholder="${t("jr.ph")}"></textarea>
      <div class="jr-snapshot">${chips(snapshot())}</div>
      <div class="controls">
        <button class="primary" id="jr-post">${t("jr.post")}</button>
        <span class="hint" id="jr-count">0 / 280</span>
      </div>
    </div>
    <div id="jr-feed">${posts.map(postCard).join("") || `<p class="hint jr-empty">${t("jr.empty")}</p>`}</div>`;

  const $ = (s) => el.querySelector(s);
  $("#jr-text").addEventListener("input", (e) => { $("#jr-count").textContent = `${e.target.value.length} / 280`; });
  $("#jr-post").addEventListener("click", () => {
    const text = $("#jr-text").value.trim();
    if (!text) return;
    const posts2 = load();
    posts2.unshift({ id: Date.now(), text, snap: snapshot(), when: Date.now() });
    persist(posts2);
    renderJournal(el);
  });
  el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
    persist(load().filter((p) => p.id !== Number(b.dataset.del)));
    renderJournal(el);
  }));
  el.querySelectorAll("[data-share]").forEach((b) => b.addEventListener("click", () => {
    const post = load().find((p) => p.id === Number(b.dataset.share));
    if (post) sharePNG(post, lang);
  }));
  $("#jr-signin")?.addEventListener("click", async () => {
    try { await signIn(); } catch (e) { if (e && e.code !== "auth/popup-closed-by-user") console.warn(e); }
  });
  $("#jr-signout")?.addEventListener("click", () => signOutUser());
}

function postCard(p) {
  return `<article class="card jr-post">
    <header class="jr-head">${maskSVG("tongsang", 34)}
      <div><b>${t("jr.me")}</b><small>${fmtDate(p.when)}</small></div>
      <div class="jr-actions">
        <button data-share="${p.id}" title="share">📤</button>
        <button data-del="${p.id}" title="delete">🗑</button>
      </div>
    </header>
    <p class="jr-body">${esc(p.text)}</p>
    <footer class="jr-snapshot">${chips(p.snap)}</footer>
  </article>`;
}

// Designed share card — dark jade scroll, gold brand, the post + progress.
function sharePNG(post, lang) {
  const W = 1080, H = 1350;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#12211c"); g.addColorStop(0.5, "#1c332b"); g.addColorStop(1, "#0e1a16");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = "#d8b25a"; c.lineWidth = 6; c.strokeRect(36, 36, W - 72, H - 72);
  c.strokeStyle = "rgba(216,178,90,0.35)"; c.lineWidth = 2; c.strokeRect(52, 52, W - 104, H - 104);
  c.fillStyle = "#d8b25a";
  c.font = `900 92px "Noto Serif TC", serif`; c.textAlign = "center";
  c.fillText("梨園闖關", W / 2, 210);
  c.font = `28px "Noto Serif TC", serif`; c.fillStyle = "rgba(216,178,90,0.8)";
  c.fillText("CANTOMESH · 學藝手記", W / 2, 262);
  c.fillStyle = "#f4efe6"; c.font = `44px "Noto Serif TC", serif`; c.textAlign = "left";
  // simple wrap
  const words = [...post.text]; let line = "", y = 420;
  for (const ch of words) {
    line += ch;
    if (c.measureText(line).width > W - 260 || ch === "\n") { c.fillText(line, 130, y); y += 66; line = ""; }
    if (y > 900) break;
  }
  if (line) c.fillText(line, 130, y);
  const s = post.snap;
  c.font = `900 64px "Noto Serif TC", serif`; c.fillStyle = "#d8b25a"; c.textAlign = "center";
  const stats = [[`★ ${s.stars}`, t("jr.stars")], [`${s.acc}%`, t("jr.acc")], [`${s.rounds}`, t("jr.rounds")]];
  stats.forEach(([v, label], i) => {
    const x = W / 4 + (i * W) / 4;
    c.fillStyle = "#f4efe6"; c.font = `900 72px "Noto Serif TC", serif`; c.fillText(v, x, 1080);
    c.fillStyle = "rgba(216,178,90,0.85)"; c.font = `26px "Noto Serif TC", serif`; c.fillText(label, x, 1130);
  });
  c.fillStyle = "#b23a2e"; c.fillRect(W / 2 - 44, 1180, 88, 88);
  c.fillStyle = "#f4efe6"; c.font = `52px "Noto Serif TC", serif`; c.fillText("粵", W / 2, 1242);
  const a = document.createElement("a");
  a.download = "cantomesh-journal.png";
  a.href = cv.toDataURL("image/png");
  a.click();
}
