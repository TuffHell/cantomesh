// 速查 · Reference — a printable prosody + opera cheat-sheet, rendered from the
// live engine data (prosody.js) and the illustrated glossary (glossary.js) so it
// can never drift out of sync with what the game actually teaches.
import { BUNDLED } from "./jyutping-data.js";
import { pingZe, toneName, toneOf, groupOf, TEMPLATES, PING } from "./prosody.js";
import { ENCYCLOPEDIA, CATS } from "./glossary.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const cls = (jp) => (pingZe(jp) === PING ? "ping" : "ze");

// ── 1) 九聲六調 — the classic minimal set 詩史試時市事 · 色錫食, driven by the engine ──
const NINE = [
  ["詩", "si1"], ["史", "si2"], ["試", "si3"],
  ["時", "si4"], ["市", "si5"], ["事", "si6"],
  ["色", "sik1"], ["錫", "sek3"], ["食", "sik6"],
];
function toneGrid() {
  return NINE.map(([ch, jp]) =>
    `<div class="rt ${cls(jp)}"><b>${ch}</b><i>${jp}</i><span>${toneName(jp)}</span><em>${pingZe(jp)}</em></div>`
  ).join("");
}

// ── 3) 句式模板 — 平/仄 templates as coloured cells ──
function templates() {
  return Object.entries(TEMPLATES).map(([name, pat]) =>
    `<div class="tmpl-row"><span class="tname">${esc(name)}</span>` +
    `<span class="tcells">${[...pat].map((c) => `<b class="${c === PING ? "ping" : "ze"}">${c}</b>`).join("")}</span></div>`
  ).join("");
}

// ── 4) 韻部速查 — group the whole dictionary by rhyme group (平 first) ──
function rhymeGroups(topN = 18, perGroup = 16) {
  const groups = {};
  for (const ch in BUNDLED) {
    const jp = BUNDLED[ch];
    if (!jp) continue;
    (groups[groupOf(jp)] ||= []).push({ ch, jp, pz: pingZe(jp), t: toneOf(jp) });
  }
  return Object.entries(groups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, topN)
    .map(([g, list]) => {
      list.sort((a, b) => (a.pz !== b.pz ? (a.pz === PING ? -1 : 1) : a.t - b.t));
      const chips = list.slice(0, perGroup)
        .map((x) => `<span class="rchip ${x.pz === PING ? "ping" : "ze"}">${esc(x.ch)}<i>${x.jp}</i></span>`)
        .join("");
      return `<div class="rgroup"><h4>韻 <code>-${esc(g)}</code> <span class="cnt">${list.length}</span></h4><div class="rchips">${chips}</div></div>`;
    }).join("");
}

// ── 5) 戲寶百科 — the illustrated glossary, grouped by category ──
const CAT_ZH = { role: "行當", stage: "身段", music: "樂器", costume: "戲服" };
const CAT_EN = { role: "Role types", stage: "Stagecraft", music: "Instruments", costume: "Costumes" };
function encyclopedia() {
  return CATS.map((cat) => {
    const items = ENCYCLOPEDIA.filter((x) => x.cat === cat).map((x) =>
      `<div class="rterm">
        <svg viewBox="0 0 100 100" aria-hidden="true">${x.svg}</svg>
        <div class="rt-body">
          <p class="rt-head"><b>${esc(x.zh)}</b> <i>${esc(x.jp)}</i> <span class="en">${esc(x.en)}</span></p>
          <p>${esc(x.ex_zh)}</p><p class="en">${esc(x.ex_en)}</p>
        </div>
      </div>`).join("");
    return `<section class="cat-block"><h3 class="cat-h">${CAT_ZH[cat]} <small>${CAT_EN[cat]}</small></h3><div class="rterms">${items}</div></section>`;
  }).join("");
}

$("#ref-tones").innerHTML = toneGrid();
$("#ref-tmpl").innerHTML = templates();
$("#ref-rhyme").innerHTML = rhymeGroups();
$("#ref-enc").innerHTML = encyclopedia();

// Reflect the live dictionary size in the header.
$("#dictstat").textContent = `粵拼庫 · ${Object.keys(BUNDLED).length.toLocaleString()} 字`;
