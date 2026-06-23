// UI wiring for the static CANTOMESH demo.
import { verifyText } from "./prosody.js";
import { startInkCanvas } from "./ink-canvas.js";

const $ = (id) => document.getElementById(id);

startInkCanvas($("ink"));

function renderReport(report) {
  const result = $("result");
  result.hidden = false;

  const score = $("score");
  score.textContent = report.score;
  score.className = "score" + (report.ok ? "" : " bad");

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

    let pi = 0;
    detail.forEach((d) => {
      const span = document.createElement("span");
      span.className = "ch";
      const pz = d.jyutping ? line.pingze[pi++] : null;
      if (pz === "平") span.classList.add("ping");
      if (pz === "仄") span.classList.add("ze");
      span.innerHTML =
        d.char +
        `<span class="mark">${pz || "·"}</span>` +
        `<span class="jp">${d.jyutping || "?"}</span>`;
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

$("btn-analyze").addEventListener("click", () => {
  const text = $("verse-in").value.trim();
  if (!text) return;
  renderReport(verifyText(text));
});

$("btn-sample").addEventListener("click", () => {
  $("verse-in").value = "大湾花开千川月\n粤韵声声爱国家";
  renderReport(verifyText($("verse-in").value));
});

// Ctrl/Cmd+Enter to analyze.
$("verse-in").addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") $("btn-analyze").click();
});

// Auto-run the sample on first load so the page is alive immediately.
$("btn-sample").click();
