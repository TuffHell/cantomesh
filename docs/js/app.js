// UI wiring for the static CANTOMESH demo.
import { verifyText } from "./prosody.js";
import { startInkCanvas } from "./ink-canvas.js";

const $ = (id) => document.getElementById(id);

startInkCanvas($("ink"));

// Curated demo couplets. Each is covered by the offline dictionary so the
// verifier can score it with zero network and zero key.
const EXAMPLES = [
  {
    label: "大灣頌",
    note: "合律 · 愛國",
    text: "大灣花開千川月\n粵韻聲聲愛國家",
  },
  {
    label: "詠中華",
    note: "四句押韻",
    text: "月明江上千年夢\n粵劇傳承萬代家\n水墨花開春復暖\n笙歌一曲詠中華",
  },
  {
    label: "破律示例",
    note: "上句失仄",
    text: "花開滿江紅\n月照故人家",
  },
];

function scoreLabel(report) {
  if (report.score === 100) return "合律";
  if (report.score >= 85) return "微瑕";
  return "待煉";
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

  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function analyze() {
  const text = $("verse-in").value.trim();
  if (!text) return;
  renderReport(verifyText(text));
}

function loadExample(ex) {
  $("verse-in").value = ex.text;
  analyze();
}

// Build the example chips.
const box = $("examples");
EXAMPLES.forEach((ex, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ghost chip";
  b.innerHTML = `${ex.label}<span class="chip-note">${ex.note}</span>`;
  b.addEventListener("click", () => loadExample(ex));
  box.appendChild(b);
});

$("btn-analyze").addEventListener("click", analyze);

// Ctrl/Cmd+Enter to analyze.
$("verse-in").addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze();
});

// Auto-run the first example on load so the page is alive immediately.
loadExample(EXAMPLES[0]);
