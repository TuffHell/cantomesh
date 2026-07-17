// UI wiring for the CANTOMESH toolkit (tabs + four offline tools).
import {
  verifyText, annotate, findRhymes, checkTemplate, TEMPLATES,
} from "./prosody.js";
import { heroScene } from "./ornaments.js";

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

// Static heritage backdrop (replaces the old animated ink canvas).
const bg = $("#ink");
if (bg) bg.innerHTML = heroScene();

/* ---------------- Tabs ---------------- */
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.toggle("active", t === tab));
    panels.forEach((p) => (p.hidden = p.id !== "panel-" + tab.dataset.tab));
  });
});

/* ---------------- Shared char chip ---------------- */
function chip(c) {
  const pz = c.pingze;
  const span = el("span", "ch" + (pz === "平" ? " ping" : pz === "仄" ? " ze" : ""));
  span.innerHTML =
    `<span class="hz">${c.char}</span>` +
    `<span class="mark">${pz || "·"}</span>` +
    `<span class="jp">${c.jyutping || "?"}</span>`;
  return span;
}

/* ---------------- 1) Verify ---------------- */
function renderReport(report, mount) {
  mount.innerHTML = "";
  const head = el("div", "score-row");
  head.append(
    el("span", "score" + (report.ok ? "" : " bad"), String(report.score)),
    el("span", "of", "/ 100")
  );
  mount.append(head);

  const verse = el("div", "verse");
  report.lines.forEach((line, i) => {
    const row = el("div", "verse-line");
    row.append(el("span", "lineno", `${line.role} L${line.index}`));
    let pi = 0;
    (report.char_detail[i] || []).forEach((d) => {
      row.append(chip({ char: d.char, jyutping: d.jyutping, pingze: d.jyutping ? line.pingze[pi++] : null }));
    });
    verse.append(row);
  });
  mount.append(verse);

  const ul = el("ul", "violations");
  report.violations.forEach((v) => ul.append(el("li", null, v)));
  mount.append(ul);
}

$("#verify-run").addEventListener("click", () => {
  const text = $("#verify-in").value.trim();
  if (text) renderReport(verifyText(text), $("#verify-out"));
});
$("#verify-sample").addEventListener("click", () => {
  $("#verify-in").value = "大灣花開千川月\n粵韻聲聲愛國家";
  renderReport(verifyText($("#verify-in").value), $("#verify-out"));
});
$("#verify-in").addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") $("#verify-run").click();
});

/* ---------------- 2) Annotate ---------------- */
$("#annotate-run").addEventListener("click", () => {
  const { tokens, coverage, total } = annotate($("#annotate-in").value.trim());
  const out = $("#annotate-out");
  out.innerHTML = "";
  out.append(el("div", "meta",
    `共 ${total} 字 · 標音覆蓋 <b>${Math.round(coverage * 100)}%</b>`));
  const grid = el("div", "verse");
  let row = el("div", "verse-line");
  tokens.forEach((tk) => {
    if (tk.br) { grid.append(row); row = el("div", "verse-line"); return; }
    if (tk.punct) { row.append(el("span", "punct", tk.char)); return; }
    row.append(chip(tk));
  });
  grid.append(row);
  out.append(grid);
});
$("#annotate-sample").addEventListener("click", () => {
  $("#annotate-in").value = "我哋一齊撐粵劇，唱到全世界。";
  $("#annotate-run").click();
});

/* ---------------- 3) Rhyme finder ---------------- */
function rhymeColumn(title, items) {
  const col = el("div", "rhyme-col");
  col.append(el("h4", null, `${title} <span class="count">${items.length}</span>`));
  const wrap = el("div", "rhyme-chips");
  items.forEach((r) => {
    const c = el("button", "rchip" + (r.pingze === "平" ? " ping" : " ze"),
      `${r.char}<small>${r.jyutping}</small>`);
    c.title = "點按填入「韻腳」";
    c.addEventListener("click", () => { $("#rhyme-in").value = r.char; });
    wrap.append(c);
  });
  col.append(wrap);
  return col;
}
$("#rhyme-run").addEventListener("click", () => {
  const res = findRhymes($("#rhyme-in").value.trim());
  const out = $("#rhyme-out");
  out.innerHTML = "";
  if (!res.target) {
    out.append(el("div", "meta", res.unknown ? `未收錄「${res.unknown}」` : "請輸入一個漢字或粵拼"));
    return;
  }
  out.append(el("div", "meta",
    `韻母組 <b>${res.group}</b> · 目標 <code>${res.target}</code> · 共 ${res.total} 字（顯示前 ${res.results.length}）`));
  const cols = el("div", "rhyme-cols");
  cols.append(
    rhymeColumn("平聲 韻腳", res.results.filter((r) => r.pingze === "平")),
    rhymeColumn("仄聲 韻腳", res.results.filter((r) => r.pingze === "仄"))
  );
  out.append(cols);
});
$("#rhyme-in").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#rhyme-run").click(); });

/* ---------------- 4) Template ---------------- */
const sel = $("#tmpl-select");
Object.keys(TEMPLATES).forEach((k) => sel.append(new Option(`${k}  ${TEMPLATES[k]}`, k)));
$("#tmpl-run").addEventListener("click", () => {
  const tmpl = TEMPLATES[sel.value];
  const res = checkTemplate($("#tmpl-in").value.trim(), tmpl);
  const out = $("#tmpl-out");
  out.innerHTML = "";
  const lenNote = res.lengthOk ? "" :
    ` · <span class="warn">字數 ${res.actualLen}/${res.expectedLen}</span>`;
  out.append(el("div", "meta",
    `模板 <code>${tmpl}</code> · 合律 <b>${res.matches}/${res.compared}</b>${lenNote}`));
  const grid = el("div", "tmpl-grid");
  res.cells.forEach((c) => {
    const cell = el("div", "tcell " + (c.ok === true ? "good" : c.ok === false ? "bad" : "na"));
    cell.innerHTML =
      `<span class="hz">${c.char}</span>` +
      `<span class="jp">${c.jyutping || "?"}</span>` +
      `<span class="cmp">${c.actual || "·"}<i>${c.expected || "·"}</i></span>`;
    grid.append(cell);
  });
  out.append(grid);
  out.append(el("div", "hint",
    "註：傳統「一三五不論，二四六分明」——單數字位可較寬鬆，重點看雙數字位與句末。"));
});
$("#tmpl-sample").addEventListener("click", () => {
  sel.value = "七字 · 上句（仄收）";
  $("#tmpl-in").value = "大灣花開千川月";
  $("#tmpl-run").click();
});

/* ---------------- boot ---------------- */
$("#verify-sample").click();
