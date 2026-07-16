// UI wiring for the static CANTOMESH demo.
import { verifyText } from "./prosody.js";
import { startInkCanvas } from "./ink-canvas.js";
import { initI18n, currentLang } from "./i18n.js";
import {
  initAuth,
  authConfigured,
  onUser,
  signIn,
  signOutUser,
  listVerses,
  saveVerse,
  deleteVerse,
} from "./auth.js";

const $ = (id) => document.getElementById(id);

startInkCanvas($("ink"));
initI18n();

// Curated demo couplets. Each is covered by the offline dictionary so the
// verifier can score it with zero network and zero key.
const EXAMPLES = [
  { label: "大灣頌", note: "合律 · 愛國", text: "大灣花開千川月\n粵韻聲聲愛國家" },
  { label: "詠中華", note: "四句押韻", text: "月明江上千年夢\n粵劇傳承萬代家\n水墨花開春復暖\n笙歌一曲詠中華" },
  { label: "破律示例", note: "上句失仄", text: "花開滿江紅\n月照故人家" },
];

// Small bilingual strings owned by app.js (dynamic UI the static i18n can't reach).
const T = {
  zh: {
    inTune: "合律", minor: "微瑕", rework: "待煉",
    saved: "已收藏入《我的唱詞集》", copied: "報告已複製",
    signinTodo: "Google 登入尚未設定 — 請先依 FIREBASE_SETUP.md 填好 firebase-config.js。",
    signinErr: "登入未完成。", hintLocal: "已存於此瀏覽器。以 Google 登入即可跨裝置同步。",
    hintCloud: "已同步至你的 Google 帳戶。", empty: "尚無收藏 — 於上方校驗一曲，按「★ 收藏」即可。",
    del: "刪除", reportHead: "CANTOMESH 平仄校驗",
  },
  en: {
    inTune: "In tune", minor: "Minor flaws", rework: "Needs work",
    saved: "Saved to your collection", copied: "Report copied",
    signinTodo: "Google sign-in isn't configured yet — fill in firebase-config.js per FIREBASE_SETUP.md.",
    signinErr: "Sign-in was not completed.", hintLocal: "Saved in this browser. Sign in with Google to sync across devices.",
    hintCloud: "Synced to your Google account.", empty: "No saved verses yet — check a verse above and press ★ Save.",
    del: "Delete", reportHead: "CANTOMESH 平仄 check",
  },
};
const t = (k) => (T[currentLang() === "en" ? "en" : "zh"][k]);

let lastVerify = null; // { text, report }

function scoreLabel(report) {
  if (report.score === 100) return t("inTune");
  if (report.score >= 85) return t("minor");
  return t("rework");
}

function renderReport(report) {
  const result = $("result");
  result.hidden = false;

  const score = $("score");
  score.textContent = report.score;
  score.className = "score" + (report.ok ? "" : " bad");
  $("verdict").textContent = scoreLabel(report);
  $("verdict").className = "verdict" + (report.ok ? "" : " bad");

  const verse = $("verse");
  verse.innerHTML = "";
  report.lines.forEach((line, i) => {
    const detail = report.char_detail[i] || [];
    const row = document.createElement("div");
    row.className = "verse-line";
    const tag = document.createElement("span");
    tag.className = "lineno";
    tag.textContent = `${line.role} L${line.index}`;
    row.appendChild(tag);

    detail.forEach((d) => {
      const span = document.createElement("span");
      span.className = "ch";
      const pz = d.pingze;
      if (pz === "平") span.classList.add("ping");
      if (pz === "仄") span.classList.add("ze");
      if (d.jyutping) span.title = `${d.char} ${d.jyutping} · ${d.tone_name || ""} · ${pz}`;
      span.innerHTML =
        d.char +
        `<span class="mark">${pz || "·"}</span>` +
        `<span class="jp">${d.jyutping || "?"}</span>` +
        `<span class="tone">${d.tone_name || ""}</span>`;
      row.appendChild(span);
    });
    verse.appendChild(row);
  });

  const ul = $("violations");
  ul.innerHTML = "";
  report.violations.forEach((v) => {
    const li = document.createElement("li");
    li.textContent = v;
    ul.appendChild(li);
  });
}

function analyze() {
  const text = $("verse-in").value.trim();
  if (!text) return;
  const report = verifyText(text);
  lastVerify = { text, report };
  renderReport(report);
  $("result").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function loadExample(ex) {
  $("verse-in").value = ex.text;
  analyze();
}

// ── Toast ───────────────────────────────────────────────────────────────────
let toastTimer = null;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ── Example chips ────────────────────────────────────────────────────────────
const box = $("examples");
EXAMPLES.forEach((ex) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ghost chip";
  b.innerHTML = `${ex.label}<span class="chip-note">${ex.note}</span>`;
  b.addEventListener("click", () => loadExample(ex));
  box.appendChild(b);
});

$("btn-analyze").addEventListener("click", analyze);
$("verse-in").addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze();
});

// ── Save / copy ──────────────────────────────────────────────────────────────
$("btn-save").addEventListener("click", async () => {
  if (!lastVerify) return;
  await saveVerse({ text: lastVerify.text, score: lastVerify.report.score });
  toast(t("saved"));
  refreshCollection();
});

$("btn-copy").addEventListener("click", async () => {
  if (!lastVerify) return;
  const { text, report } = lastVerify;
  const lines = report.char_detail
    .map((line, i) => {
      const role = report.lines[i] ? `${report.lines[i].role} L${report.lines[i].index}` : `L${i + 1}`;
      const body = line.map((d) => `${d.char}(${d.pingze || "·"})`).join(" ");
      return `${role}  ${body}`;
    })
    .join("\n");
  const out =
    `${t("reportHead")} · ${report.score}/100 (${scoreLabel(report)})\n` +
    `${lines}\n` +
    (report.violations.length ? report.violations.map((v) => "• " + v).join("\n") : "✓") +
    `\n— ${text.replace(/\n/g, " / ")}`;
  try {
    await navigator.clipboard.writeText(out);
    toast(t("copied"));
  } catch {
    toast(out.slice(0, 40) + "…");
  }
});

// ── My verse collection ──────────────────────────────────────────────────────
let signedIn = false;

function updateHint() {
  $("coll-hint").textContent = signedIn ? t("hintCloud") : t("hintLocal");
}

async function refreshCollection() {
  let verses = [];
  try {
    verses = await listVerses();
  } catch {
    verses = [];
  }
  const coll = $("collection");
  const cards = $("verse-cards");
  updateHint();

  if (!verses.length && !signedIn) {
    coll.hidden = true;
    return;
  }
  coll.hidden = false;
  cards.innerHTML = "";

  if (!verses.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = t("empty");
    cards.appendChild(empty);
    return;
  }

  verses.forEach((v) => {
    const card = document.createElement("div");
    card.className = "verse-card";
    const pre = document.createElement("pre");
    pre.textContent = v.text;
    const row = document.createElement("div");
    row.className = "row";
    const s = document.createElement("span");
    s.className = "mini-score" + (v.score === 100 ? "" : " bad");
    s.textContent = (v.score ?? "—") + " / 100";
    const del = document.createElement("button");
    del.className = "link-btn del";
    del.textContent = t("del");
    del.addEventListener("click", async () => {
      await deleteVerse(v.id);
      refreshCollection();
    });
    row.append(s, del);
    card.append(pre, row);
    cards.appendChild(card);
  });
}

// ── Auth UI ──────────────────────────────────────────────────────────────────
$("btn-signin").addEventListener("click", async () => {
  if (!authConfigured()) {
    toast(t("signinTodo"));
    return;
  }
  try {
    await signIn();
  } catch (e) {
    if (e && e.code !== "auth/popup-closed-by-user") toast(t("signinErr"));
  }
});
$("btn-signout").addEventListener("click", () => signOutUser());

onUser((user) => {
  signedIn = !!user;
  $("btn-signin").hidden = !!user;
  $("user-chip").hidden = !user;
  if (user) {
    const av = $("user-avatar");
    if (user.photoURL) av.src = user.photoURL;
    else av.removeAttribute("src");
    $("user-name").textContent = user.displayName || user.email || "";
  }
  refreshCollection();
});

// Re-render dynamic, language-dependent UI when the language toggles.
document.addEventListener("langchange", () => {
  if (lastVerify) renderReport(lastVerify.report);
  refreshCollection();
});

// Boot Firebase (no-op / graceful when unconfigured), then paint the collection.
initAuth().finally(refreshCollection);

// Auto-run the first example on load so the page is alive immediately.
loadExample(EXAMPLES[0]);
