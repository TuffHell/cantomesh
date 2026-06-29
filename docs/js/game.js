// 梨園闖關 — game state machine. All grading delegates to the symbolic engine.
import { pingZe, toneName, lookup, groupOf, verifyText, toneOf } from "./prosody.js";
import { WORLDS, STAGES, STAGE_IDS, MASKS } from "./levels.js";
import { maskSVG } from "./masks.js";

const SAVE_KEY = "cantomesh.quest.v1";
const app = document.getElementById("app");

/* ---------------- persistence ---------------- */
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && raw.stars) return raw;
  } catch { /* ignore */ }
  return { stars: {}, cleared: {}, masks: [] };
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* ignore */ } }
let progress = load();

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
  const pct = Math.round((totalStars() / maxStars()) * 100);
  let html = `
    <header class="g-hero"><canvas id="ink" aria-hidden="true"></canvas>
      <div class="g-hero-in">
        <p class="kicker">粵劇 · 平仄闖關 · 寓教於戲</p>
        <h1>梨園闖關</h1>
        <p class="lede">闖關習平仄、辨九聲、對佳句——集星以解鎖<b>臉譜</b>，成梨園宗師。</p>
        <div class="statline">
          <span>★ ${totalStars()} / ${maxStars()}</span>
          <span>面譜 ${progress.masks.length} / 4</span>
          <a class="tools-link" href="tools.html">練功房 · 工具 ↗</a>
        </div>
        <div class="pbar"><i style="width:${pct}%"></i></div>
      </div>
    </header>
    <main class="wrap">`;

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
  bootInk();
}

const TYPE_ICON = { tone: "聲", rhyme: "韻", verify: "律" };

function startStage(stageId) {
  const stage = STAGES.find((s) => s.id === stageId);
  const run = { i: 0, correct: 0, total: stage.rounds.length };
  renderRound(stage, run);
}

function renderRound(stage, run) {
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

renderMap();
