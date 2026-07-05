// 梨園闖關 — game state machine. All grading delegates to the symbolic engine.
import { pingZe, toneName, lookup, groupOf, verifyText, toneOf } from "./prosody.js";
import { WORLDS, STAGES, STAGE_IDS, MASKS } from "./levels.js";
import { maskSVG } from "./masks.js";
import { createOperaFigure } from "./opera-figure.js";
import { openPoseTrainer } from "./pose-trainer.js";
import { openFaceAR } from "./face-ar.js";
import { openHeritage } from "./open-data.js";
import { openGlossary } from "./glossary.js";
import { openVoice } from "./voice.js";
import { t, getLang, setLang, LANGS } from "./i18n.js";
import { heroScene, mountainFooter } from "./ornaments.js";

const SAVE_KEY = "cantomesh.quest.v1";
const app = document.getElementById("app");

// Animated opera figures: track them so each screen change tears down rAF loops.
let figures = [];
function clearFigures() { figures.forEach((f) => f.destroy()); figures = []; }
function mountFigure(sel, opts) {
  const host = document.querySelector(sel);
  if (!host) return null;
  const f = createOperaFigure(opts);
  host.append(f.el);
  figures.push(f);
  return f;
}

/* ---------------- persistence ---------------- */
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && raw.stars) return { stats: { correct: 0, total: 0, seen: {} }, seenIntro: false, ...raw };
  } catch { /* ignore */ }
  return { stars: {}, cleared: {}, masks: [], stats: { correct: 0, total: 0, seen: {} }, seenIntro: false };
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* ignore */ } }
let progress = load();

// Measured-pedagogy tracking (a learning-outcomes signal — the OperAR / ASIA lesson).
function recordAnswer(ok, chars) {
  progress.stats.total++;
  if (ok) progress.stats.correct++;
  for (const c of chars) if (lookup(c)) progress.stats.seen[c] = true;
  save();
}
function roundChars(r) {
  if (r.kind === "tone") return [r.char];
  if (r.kind === "rhyme") return [...r.shang, ...r.xiaPrefix];
  if (r.kind === "verify") return [...r.couplet.replace(/\n/g, "")];
  return [];
}
const masteredCount = () => Object.keys(progress.stats.seen).length;
const accuracy = () => progress.stats.total ? Math.round((progress.stats.correct / progress.stats.total) * 100) : 0;

const totalStars = () => Object.values(progress.stars).reduce((a, b) => a + b, 0);
const maxStars = () => STAGES.length * 3;
const isUnlocked = (i) => i === 0 || !!progress.cleared[STAGE_IDS[i - 1]];

/* ---------------- helpers ---------------- */
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const starStr = (n) => "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n);

function charChip(ch) {
  const jp = lookup(ch);
  const pz = jp ? pingZe(jp) : null;
  const cls = pz === "平" ? " ping" : pz === "仄" ? " ze" : "";
  return `<span class="ch${cls}"><span class="hz">${esc(ch)}</span>` +
    `<span class="mark">${pz || "·"}</span><span class="jp">${jp || "?"}</span></span>`;
}
function lineChips(line) {
  return `<span class="verse-line">${[...line].map(charChip).join("")}</span>`;
}

/* ---------------- round builders ---------------- */
function buildTone(r) {
  const jp = lookup(r.char);
  const correct = pingZe(jp);
  return {
    prompt: t("ch.tone.q", { char: esc(r.char) }),
    options: [{ label: t("opt.ping"), value: "平" }, { label: t("opt.ze"), value: "仄" }],
    answer: correct,
    reveal(val) {
      const name = toneName(jp), tone = toneOf(jp);
      const why = correct === "平"
        ? t("reveal.ping", { name, t: tone })
        : (name && name.endsWith("入") ? t("reveal.ru", { name }) : t("reveal.ze", { name, t: tone }));
      return { ok: val === correct, html:
        `<div class="reveal-char">${charChip(r.char)}</div><p>${esc(r.char)} · <code>${jp}</code> · <b>${name}</b></p><p class="why">${why}</p>` };
    },
  };
}

function buildRhyme(r) {
  const targetJp = lookup(r.rhymeWith);
  const targetGroup = groupOf(targetJp);
  const okFor = (ch) => {
    const jp = lookup(ch);
    return jp && pingZe(jp) === "平" && groupOf(jp) === targetGroup;
  };
  return {
    prompt: t("ch.rhyme.q", { rhyme: esc(r.rhymeWith) }) +
      `<br><span class="couplet"><span class="cl">${t("label.shang")}　${esc(r.shang)}</span>` +
      `<span class="cl">${t("label.xia")}　${esc(r.xiaPrefix)}<span class="blank">？</span></span></span>`,
    options: r.bank.map((c) => ({ label: c, value: c })),
    answer: r.bank.find(okFor),
    reveal(val) {
      const jp = lookup(val), ok = okFor(val);
      const xia = r.xiaPrefix + val;
      const same = groupOf(jp) === targetGroup;
      let why;
      if (ok) {
        why = t("reveal.rhyme.ok", { ch: esc(val), jp, g: groupOf(jp), rhyme: esc(r.rhymeWith) });
      } else {
        why = t("reveal.rhyme.prefix", { ch: esc(val), jp });
        if (pingZe(jp) !== "平") why += t("reveal.rhyme.notlevel");
        if (!same) why += t("reveal.rhyme.notrhyme", { g: groupOf(jp), rhyme: esc(r.rhymeWith) });
      }
      return { ok, html: `<div class="verse">${lineChips(r.shang)}${lineChips(xia)}</div><p class="why">${why}</p>` };
    },
  };
}

function buildVerify(r) {
  const report = verifyText(r.couplet);
  const correct = report.ok ? "合律" : "失律";
  return {
    prompt: t("ch.verify.q") + `<div class="verse vshow">` +
      r.couplet.split("\n").map(lineChips).join("") + `</div>`,
    options: [{ label: t("opt.valid"), value: "合律" }, { label: t("opt.invalid"), value: "失律" }],
    answer: correct,
    reveal(val) {
      const why = report.ok ? t("reveal.verify.ok") : report.violations.map(esc).join("；");
      return { ok: val === correct, html: `<p class="why">${why}</p>` };
    },
  };
}

const BUILDERS = { tone: buildTone, rhyme: buildRhyme, verify: buildVerify };
const buildRound = (r) => BUILDERS[r.kind](r);

/* ---------------- screens ---------------- */
function renderMap() {
  clearFigures();
  const pct = Math.round((totalStars() / maxStars()) * 100);
  let html = `
    <header class="g-hero">${heroScene()}
      <div class="hero-figure" id="hero-fig" aria-hidden="true"></div>
      <div class="g-hero-in">
        <p class="kicker">${t("map.kicker")}</p>
        <h1>${t("map.title")}</h1>
        <p class="lede">${t("map.lede")}</p>
        <div class="statline">
          <span>★ ${totalStars()} / ${maxStars()}</span>
          <span>${t("map.masks")} ${progress.masks.length} / 4</span>
          <a href="#" id="replay-intro">${t("map.replay")}</a>
          <a href="#" id="lang-toggle">${getLang() === "en" ? "中文" : "EN"}</a>
          <a class="tools-link" href="tools.html">${t("map.tools")}</a>
        </div>
        <div class="pbar"><i style="width:${pct}%"></i></div>
      </div>
    </header>
    <main class="wrap">
      <section class="impact">
        <div class="impact-card stats-card">
          <h3>${t("stats.title")}</h3>
          <div class="stat-row">
            <div><b>${masteredCount()}</b><span>${t("stats.learned")}</span></div>
            <div><b>${accuracy()}%</b><span>${t("stats.acc")}</span></div>
            <div><b>${progress.stats.total}</b><span>${t("stats.total")}</span></div>
          </div>
        </div>
        <div class="impact-card mission-card">
          <h3>${t("mission.title")}</h3>
          <p>${t("mission.body")}</p>
        </div>
      </section>
      <section class="studio">
        <h3 class="studio-h">${t("studio.h")}</h3>
        <div class="studio-row">
          <button class="studio-tile" id="open-trainer"><span class="st-ic">身</span><b>${t("tile.train.t")}</b><small>${t("tile.train.s")}</small></button>
          <button class="studio-tile" id="open-ar"><span class="st-ic">臉</span><b>${t("tile.ar.t")}</b><small>${t("tile.ar.s")}</small></button>
          <button class="studio-tile" id="open-gloss"><span class="st-ic">圖</span><b>${t("tile.gloss.t")}</b><small>${t("tile.gloss.s")}</small></button>
          <button class="studio-tile" id="open-voice"><span class="st-ic">聲</span><b>${t("tile.voice.t")}</b><small>${t("tile.voice.s")}</small></button>
          <button class="studio-tile" id="open-heritage"><span class="st-ic">港</span><b>${t("tile.heritage.t")}</b><small>${t("tile.heritage.s")}</small></button>
        </div>
      </section>`;

  if (progress.masks.length) {
    html += `<section class="mask-shelf"><h3>${t("masks.shelf")}</h3><div class="masks">` +
      progress.masks.map((m) => `<figure>${maskSVG(m, 70)}<figcaption>${MASKS[m].name}</figcaption></figure>`).join("") +
      `</div></section>`;
  }

  let idx = 0;
  for (const w of WORLDS) {
    html += `<section class="world"><div class="world-head"><span class="wmask">${maskSVG(w.mask, 44)}</span>
      <div><h2>${w.name}</h2><p>${w.subtitle}</p></div></div><div class="stages">`;
    for (const s of w.stages) {
      const gi = idx++;
      const unlocked = isUnlocked(gi);
      const stars = progress.stars[s.id] || 0;
      const cleared = progress.cleared[s.id];
      html += `<button class="stage ${unlocked ? "" : "locked"} ${cleared ? "done" : ""}" data-stage="${s.id}" ${unlocked ? "" : "disabled"}>
        <span class="badge">${TYPE_ICON[s.type]}</span>
        <span class="stitle">${esc(s.title)}</span>
        <span class="stars">${unlocked ? starStr(stars) : "🔒"}</span></button>`;
    }
    html += `</div></section>`;
  }
  html += `</main>${mountainFooter()}<footer class="wrap">粤脉·镜 CANTOMESH · <a href="https://github.com/TuffHell/cantomesh" target="_blank" rel="noopener">GitHub</a> · <a href="tools.html">${t("map.tools")}</a></footer>`;
  app.innerHTML = html;

  app.querySelectorAll(".stage:not(.locked)").forEach((b) =>
    b.addEventListener("click", () => startStage(b.dataset.stage)));
  $("#replay-intro")?.addEventListener("click", (e) => { e.preventDefault(); renderIntro(); });
  $("#open-trainer")?.addEventListener("click", startTrainer);
  $("#open-ar")?.addEventListener("click", startFaceAR);
  $("#open-heritage")?.addEventListener("click", startHeritage);
  $("#open-gloss")?.addEventListener("click", () => { clearFigures(); openGlossary(app, renderMap); });
  $("#open-voice")?.addEventListener("click", () => { clearFigures(); openVoice(app, renderMap); });
  $("#lang-toggle")?.addEventListener("click", (e) => {
    e.preventDefault(); setLang(getLang() === "en" ? "zh" : "en"); renderMap();
  });
  mountFigure("#hero-fig", { role: "daan", size: 210 });
}

function startTrainer() {
  clearFigures();
  openPoseTrainer(app, renderMap);
}

function startFaceAR() {
  clearFigures();
  openFaceAR(app, renderMap);
}

function startHeritage() {
  clearFigures();
  openHeritage(app, renderMap, (rounds) => playRounds(t("od.practiceTitle"), rounds));
}

// First-run language gate — bilingual on purpose, before a language is chosen.
function renderLangPicker() {
  clearFigures();
  app.innerHTML = `<main class="wrap lang-pick">
    <div class="lang-card">
      <div class="seal big" aria-hidden="true">粤脉<br/>之鏡</div>
      <h1>粤脉 · 鏡 · CANTOMESH</h1>
      <p class="lang-sub">Choose your language　·　選擇語言</p>
      <p class="lang-note">Learn Cantonese opera from zero — no Chinese needed.</p>
      <div class="lang-grid">
        ${Object.entries(LANGS).map(([code, label]) => `<button class="lang-btn" data-l="${code}">${label}</button>`).join("")}
      </div>
    </div></main>`;
  app.querySelectorAll(".lang-btn").forEach((b) => b.addEventListener("click", () => {
    setLang(b.dataset.l);
    if (progress.seenIntro) renderMap(); else renderIntro();
  }));
}

/* ---------------- narrative intro (story-first onboarding) ---------------- */
const introBeats = () => [t("intro.beat1"), t("intro.beat2"), t("intro.beat3")];
function renderIntro() {
  clearFigures();
  const beats = introBeats();
  app.innerHTML = `<main class="wrap intro">${heroScene()}
    <div class="intro-in">
      <div class="intro-figure" id="intro-fig" aria-hidden="true"></div>
      <p class="kicker">${t("intro.kicker")}</p>
      ${beats.map((b, i) => `<p class="beat" style="animation-delay:${0.3 + i * 0.9}s">${b}</p>`).join("")}
      <div class="intro-cta" style="animation-delay:${0.3 + beats.length * 0.9}s">
        <button class="primary" id="begin">${t("intro.begin")}</button>
        <button class="ghost" id="skip">${t("intro.skip")}</button>
      </div>
    </div></main>`;
  const done = () => { progress.seenIntro = true; save(); renderMap(); };
  $("#begin").addEventListener("click", done);
  $("#skip").addEventListener("click", done);
  const master = mountFigure("#intro-fig", { role: "sang", size: 200 });
  if (master) setTimeout(() => master.pose(), 900); // a welcoming 亮相
}

const TYPE_ICON = { tone: "聲", rhyme: "韻", verify: "律" };

function runStage(stage) {
  renderRound(stage, { i: 0, correct: 0, total: stage.rounds.length });
}
function startStage(stageId) {
  runStage(STAGES.find((s) => s.id === stageId));
}
// Play a one-off stage built from open-data-generated rounds.
function playRounds(title, rounds) {
  clearFigures();
  runStage({ id: "data", title, worldId: "__data__", rounds });
}

function renderRound(stage, run) {
  clearFigures();
  const r = buildRound(stage.rounds[run.i]);
  app.innerHTML = `
    <main class="wrap play">
      <div class="play-top">
        <button class="back" id="quit">${t("common.quit")}</button>
        <div class="dots">${stage.rounds.map((_, k) =>
          `<i class="${k < run.i ? "past" : k === run.i ? "now" : ""}"></i>`).join("")}</div>
        <span class="rcount">${run.i + 1}/${run.total}</span>
      </div>
      <div class="card q-card">
        <h2 class="qtitle">${esc(stage.title)}</h2>
        <div class="prompt">${r.prompt}</div>
        <div class="options">${r.options.map((o) =>
          `<button class="opt" data-v="${esc(o.value)}">${esc(o.label)}</button>`).join("")}</div>
        <div class="reveal" id="reveal" hidden></div>
        <div class="qfoot" id="qfoot" hidden></div>
      </div>
    </main>`;

  $("#quit").addEventListener("click", renderMap);
  const reveal = $("#reveal"), foot = $("#qfoot");
  let answered = false;
  app.querySelectorAll(".opt").forEach((btn) => btn.addEventListener("click", () => {
    if (answered) return;
    answered = true;
    const res = r.reveal(btn.dataset.v);
    if (res.ok) run.correct++;
    recordAnswer(res.ok, roundChars(stage.rounds[run.i]));
    app.querySelectorAll(".opt").forEach((b) => {
      b.disabled = true;
      if (b.dataset.v === r.answer) b.classList.add("correct");
      else if (b === btn) b.classList.add("wrong");
    });
    reveal.hidden = false;
    reveal.className = "reveal " + (res.ok ? "good" : "bad");
    reveal.innerHTML = `<div class="verdict">${res.ok ? t("verdict.right") : t("verdict.wrong")}</div>${res.html}`;
    foot.hidden = false;
    const last = run.i === run.total - 1;
    foot.innerHTML = `<button class="primary" id="next">${last ? t("btn.finish") : t("btn.next")}</button>`;
    $("#next").addEventListener("click", () => {
      run.i++;
      if (run.i < run.total) renderRound(stage, run);
      else finishStage(stage, run);
    });
  }));
}

function finishStage(stage, run) {
  clearFigures();
  const ratio = run.correct / run.total;
  const stars = ratio === 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.5 ? 1 : 0;
  const cleared = stars >= 1;
  if (cleared) {
    progress.cleared[stage.id] = true;
    progress.stars[stage.id] = Math.max(progress.stars[stage.id] || 0, stars);
  }

  // world completion → mask unlock
  let unlockedMask = null;
  const world = WORLDS.find((w) => w.id === stage.worldId);
  if (cleared && world && world.stages.every((s) => progress.cleared[s.id]) && !progress.masks.includes(world.mask)) {
    progress.masks.push(world.mask);
    unlockedMask = world.mask;
  }
  save();

  app.innerHTML = `<main class="wrap result">
    <div class="card center">
      ${cleared ? `<div class="result-figure" id="result-fig" aria-hidden="true"></div>` : ""}
      <p class="kicker">${esc(stage.title)} · ${t("result.done")}</p>
      <div class="bigstars ${stars ? "" : "none"}">${stars ? starStr(stars) : t("result.fail")}</div>
      <p>${t("result.correct", { c: run.correct, t: run.total })}</p>
      ${unlockedMask ? maskReward(unlockedMask) : ""}
      <div class="result-actions">
        ${stars < 3 ? `<button class="ghost" id="retry">${t("result.retry")}</button>` : ""}
        <button class="primary" id="tomap">${t("result.tomap")}</button>
      </div>
    </div></main>`;
  if (unlockedMask) requestAnimationFrame(() => $(".mask-reward")?.classList.add("show"));
  if (cleared) {
    const star = mountFigure("#result-fig", { role: "daan", size: 150 });
    if (star) { star.pose(); setTimeout(() => star.pose(), 700); }
  }
  $("#tomap").addEventListener("click", renderMap);
  $("#retry")?.addEventListener("click", () => runStage(stage));
}

function maskReward(id) {
  const m = MASKS[id];
  return `<div class="mask-reward"><p class="unlock-label">${t("mask.unlocked")}</p>
    <div class="mask-art">${maskSVG(id, 130)}</div>
    <p class="mask-name">${m.name} · <span>${m.role}</span></p>
    <p class="mask-line">${m.line}</p></div>`;
}

// boot: pick a language first (so non-Chinese learners can start), then story → map.
if (!getLang()) renderLangPicker();
else if (progress.seenIntro) renderMap();
else renderIntro();
