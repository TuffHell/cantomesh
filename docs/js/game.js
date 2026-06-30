// 梨園闖關 — game state machine. All grading delegates to the symbolic engine.
import { pingZe, toneName, lookup, groupOf, verifyText, toneOf } from "./prosody.js";
import { WORLDS, STAGES, STAGE_IDS, MASKS } from "./levels.js";
import { maskSVG } from "./masks.js";
import { createOperaFigure } from "./opera-figure.js";
import { openPoseTrainer } from "./pose-trainer.js";

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
    prompt: `「<b class="big">${esc(r.char)}</b>」 是 <b>平聲</b> 還是 <b>仄聲</b>？`,
    options: [{ label: "平", value: "平" }, { label: "仄", value: "仄" }],
    answer: correct,
    reveal(val) {
      const name = toneName(jp), t = toneOf(jp);
      const why = correct === "平"
        ? `${name}（第${t}聲）屬<b>平聲</b>——陰平、陽平聲長而穩。`
        : (name && name.endsWith("入")
          ? `${name}（入聲）收 -p/-t/-k，短促，<b>入聲皆仄</b>。`
          : `${name}（第${t}聲）屬<b>仄聲</b>——上、去、入聲皆仄。`);
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
    prompt: `補下句末字，使其 <b>平收</b> 且與「${esc(r.rhymeWith)}」<b>同韻</b>：<br>` +
      `<span class="couplet"><span class="cl">上句　${esc(r.shang)}</span>` +
      `<span class="cl">下句　${esc(r.xiaPrefix)}<span class="blank">？</span></span></span>`,
    options: r.bank.map((c) => ({ label: c, value: c })),
    answer: r.bank.find(okFor),
    reveal(val) {
      const jp = lookup(val), ok = okFor(val);
      const xia = r.xiaPrefix + val;
      const pz = pingZe(jp), same = groupOf(jp) === targetGroup;
      const why = ok ? `「${esc(val)}」${jp} 為平聲，韻母「${groupOf(jp)}」與「${esc(r.rhymeWith)}」相同，平收且押韻。`
        : `「${esc(val)}」${jp}：${pz === "平" ? "" : "<b>非平收</b>；"}${same ? "" : `韻母「${groupOf(jp)}」與「${esc(r.rhymeWith)}」(${targetGroup}) <b>不同韻</b>。`}`;
      return { ok, html: `<div class="verse">${lineChips(r.shang)}${lineChips(xia)}</div><p class="why">${why}</p>` };
    },
  };
}

function buildVerify(r) {
  const report = verifyText(r.couplet);
  const correct = report.ok ? "合律" : "失律";
  return {
    prompt: `此聯是否 <b>合律</b>？<div class="verse vshow">` +
      r.couplet.split("\n").map(lineChips).join("") + `</div>`,
    options: [{ label: "合律", value: "合律" }, { label: "失律", value: "失律" }],
    answer: correct,
    reveal(val) {
      const why = report.ok
        ? "句末平仄與押韻俱合：上句仄收，下句平收。"
        : report.violations.map(esc).join("；");
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
    <header class="g-hero"><canvas id="ink" aria-hidden="true"></canvas>
      <div class="hero-figure" id="hero-fig" aria-hidden="true"></div>
      <div class="g-hero-in">
        <p class="kicker">粵劇 · 平仄闖關 · 寓教於戲</p>
        <h1>梨園闖關</h1>
        <p class="lede">闖關習平仄、辨九聲、對佳句——集星以解鎖<b>臉譜</b>，成梨園宗師。</p>
        <div class="statline">
          <span>★ ${totalStars()} / ${maxStars()}</span>
          <span>面譜 ${progress.masks.length} / 4</span>
          <a href="#" id="replay-intro">序章 ↻</a>
          <a class="tools-link" href="tools.html">練功房 · 工具 ↗</a>
        </div>
        <div class="pbar"><i style="width:${pct}%"></i></div>
      </div>
    </header>
    <main class="wrap">
      <section class="impact">
        <div class="impact-card stats-card">
          <h3>學藝成效</h3>
          <div class="stat-row">
            <div><b>${masteredCount()}</b><span>已習字</span></div>
            <div><b>${accuracy()}%</b><span>答對率</span></div>
            <div><b>${progress.stats.total}</b><span>累計答題</span></div>
          </div>
        </div>
        <div class="impact-card mission-card">
          <h3>使命 · 文化人人可及</h3>
          <p>粤劇乃聯合國非遺，卻日漸式微。本作以<b>零門檻、零硬件、全離線</b>之姿，讓大灣區青年與全球華人皆可親手習藝——傳承，人人可及。評分全由<b>透明的符號引擎</b>實時裁定。</p>
        </div>
      </section>
      <section class="train-cta">
        <div class="impact-card train-card">
          <div>
            <h3>身段訓練 · 體感 AI</h3>
            <p>開啟鏡頭，以姿態辨識（MediaPipe）<b>實時評分</b>你的山膀、順風旗與亮相——關節角度量化，逐關精進。影像僅在本機處理，不上傳。</p>
          </div>
          <button class="primary" id="open-trainer">開始體感訓練 →</button>
        </div>
      </section>`;

  if (progress.masks.length) {
    html += `<section class="mask-shelf"><h3>已解鎖臉譜</h3><div class="masks">` +
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
  html += `</main><footer class="wrap">粤脉·镜 CANTOMESH · <a href="https://github.com/TuffHell/cantomesh" target="_blank" rel="noopener">GitHub</a> · <a href="tools.html">工具台</a></footer>`;
  app.innerHTML = html;

  app.querySelectorAll(".stage:not(.locked)").forEach((b) =>
    b.addEventListener("click", () => startStage(b.dataset.stage)));
  $("#replay-intro")?.addEventListener("click", (e) => { e.preventDefault(); renderIntro(); });
  $("#open-trainer")?.addEventListener("click", startTrainer);
  mountFigure("#hero-fig", { role: "daan", size: 210 });
  bootInk();
}

function startTrainer() {
  clearFigures();
  openPoseTrainer(app, renderMap);
}

/* ---------------- narrative intro (story-first onboarding) ---------------- */
const INTRO_BEATS = [
  "百年粵韻，唱念做打，曾響徹珠江兩岸。",
  "如今老倌漸老，戲臺漸冷——這一棒，誰來接？",
  "今日由你執筆：闖關習藝，讓粵劇在你聲中重生。",
];
function renderIntro() {
  clearFigures();
  app.innerHTML = `<main class="wrap intro"><canvas id="ink" aria-hidden="true"></canvas>
    <div class="intro-in">
      <div class="intro-figure" id="intro-fig" aria-hidden="true"></div>
      <p class="kicker">梨園闖關 · 序</p>
      ${INTRO_BEATS.map((b, i) => `<p class="beat" style="animation-delay:${0.3 + i * 0.9}s">${b}</p>`).join("")}
      <div class="intro-cta" style="animation-delay:${0.3 + INTRO_BEATS.length * 0.9}s">
        <button class="primary" id="begin">拜師學藝 →</button>
        <button class="ghost" id="skip">略過</button>
      </div>
    </div></main>`;
  const done = () => { progress.seenIntro = true; save(); renderMap(); };
  $("#begin").addEventListener("click", done);
  $("#skip").addEventListener("click", done);
  const master = mountFigure("#intro-fig", { role: "sang", size: 200 });
  if (master) setTimeout(() => master.pose(), 900); // a welcoming 亮相
  bootInk();
}

const TYPE_ICON = { tone: "聲", rhyme: "韻", verify: "律" };

function startStage(stageId) {
  const stage = STAGES.find((s) => s.id === stageId);
  const run = { i: 0, correct: 0, total: stage.rounds.length };
  renderRound(stage, run);
}

function renderRound(stage, run) {
  clearFigures();
  const r = buildRound(stage.rounds[run.i]);
  app.innerHTML = `
    <main class="wrap play">
      <div class="play-top">
        <button class="back" id="quit">← 退關</button>
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
    reveal.innerHTML = `<div class="verdict">${res.ok ? "✓ 答對" : "✗ 再思"}</div>${res.html}`;
    foot.hidden = false;
    const last = run.i === run.total - 1;
    foot.innerHTML = `<button class="primary" id="next">${last ? "完成本關" : "下一題 →"}</button>`;
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
  if (cleared && world.stages.every((s) => progress.cleared[s.id]) && !progress.masks.includes(world.mask)) {
    progress.masks.push(world.mask);
    unlockedMask = world.mask;
  }
  save();

  app.innerHTML = `<main class="wrap result">
    <div class="card center">
      ${cleared ? `<div class="result-figure" id="result-fig" aria-hidden="true"></div>` : ""}
      <p class="kicker">${esc(stage.title)} · 完成</p>
      <div class="bigstars ${stars ? "" : "none"}">${stars ? starStr(stars) : "未過關"}</div>
      <p>答對 ${run.correct} / ${run.total}</p>
      ${unlockedMask ? maskReward(unlockedMask) : ""}
      <div class="result-actions">
        ${stars < 3 ? `<button class="ghost" id="retry">重練</button>` : ""}
        <button class="primary" id="tomap">回地圖</button>
      </div>
    </div></main>`;
  if (unlockedMask) requestAnimationFrame(() => $(".mask-reward")?.classList.add("show"));
  if (cleared) {
    const star = mountFigure("#result-fig", { role: "daan", size: 150 });
    if (star) { star.pose(); setTimeout(() => star.pose(), 700); }
  }
  $("#tomap").addEventListener("click", renderMap);
  $("#retry")?.addEventListener("click", () => startStage(stage.id));
}

function maskReward(id) {
  const m = MASKS[id];
  return `<div class="mask-reward"><p class="unlock-label">🎭 解鎖臉譜</p>
    <div class="mask-art">${maskSVG(id, 130)}</div>
    <p class="mask-name">${m.name} · <span>${m.role}</span></p>
    <p class="mask-line">${m.line}</p></div>`;
}

/* ---------------- ink accent ---------------- */
async function bootInk() {
  const c = document.getElementById("ink");
  if (!c) return;
  try { const { startInkHero } = await import("./ink-hero.js"); startInkHero(c); } catch { /* ok */ }
}

// boot: first-time visitors see the story; returning players land on the map.
if (progress.seenIntro) renderMap();
else renderIntro();
