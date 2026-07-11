// Tap-a-character popover — anywhere a 字 appears, tapping it teaches it:
// jyutping, 九聲 name + pitch-contour hint, 平仄, rhyme family with partner
// characters, curated meaning/historical context (LORE), and 🔊 pronunciation.
import { lookup, toneName, pingZe, groupOf, toneOf } from "./prosody.js";
import { LORE } from "./stories.js";
import { speak, speakSlow, speakStatus } from "./speak.js";
import { t, getLang } from "./i18n.js";

// Beginner-friendly pitch contours for the 九聲 (55/35/33/21/13/22 …).
const CONTOUR = {
  "陰平": "55 ˥˥ 高而平", "陰上": "35 ˧˥ 由中升高", "陰去": "33 ˧˧ 中而平",
  "陽平": "21 ˨˩ 低而沉", "陽上": "13 ˩˧ 由低微升", "陽去": "22 ˨˨ 低而平",
  "陰入": "5 ˥ 高促", "中入": "3 ˧ 中促", "陽入": "2 ˨ 低促",
};
const CONTOUR_EN = {
  "陰平": "high level", "陰上": "mid rising", "陰去": "mid level",
  "陽平": "low falling", "陽上": "low rising", "陽去": "low level",
  "陰入": "high clipped", "中入": "mid clipped", "陽入": "low clipped",
};

let pop = null, exemplarsCache = null;

function exemplarsFor(group) {
  if (!exemplarsCache) exemplarsCache = {};
  return exemplarsCache[group] || [];
}
export function provideExemplars(map) { exemplarsCache = map; }

function ensurePop() {
  if (pop) return pop;
  pop = document.createElement("div");
  pop.className = "wi-pop";
  pop.hidden = true;
  document.body.appendChild(pop);
  document.addEventListener("pointerdown", (e) => {
    if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true;
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") pop.hidden = true; });
  return pop;
}

export function showCharInfo(ch, anchorRect) {
  const jp = lookup(ch);
  if (!jp) return false;
  const lang = getLang();
  const name = toneName(jp), pz = pingZe(jp), grp = groupOf(jp), tone = toneOf(jp);
  const lore = LORE[ch];
  const partners = exemplarsFor(grp).filter((c) => c !== ch).slice(0, 3);
  const canSpeak = speakStatus() !== "unsupported" && speakStatus() !== "novoice";
  const p = ensurePop();
  p.innerHTML = `
    <div class="wi-head"><b class="wi-ch">${ch}</b>
      <div class="wi-jp"><code>${jp}</code>
        ${canSpeak ? `<button class="wi-spk" data-s="n" title="讀">🔊</button><button class="wi-spk" data-s="s" title="慢讀">🐢</button>` : ""}
      </div>
    </div>
    <div class="wi-row"><span class="wi-tag ${pz === "平" ? "ping" : "ze"}">${pz}</span>
      <span>${name} · 第${tone}聲</span><small>${lang === "en" ? (CONTOUR_EN[name] || "") : (CONTOUR[name] || "")}</small></div>
    <div class="wi-row"><span class="wi-tag rime">-${grp}</span>
      <span>${t("wi.rhymes")} ${partners.join("·") || "—"}</span></div>
    ${lore ? `<div class="wi-lore"><b>${lore.word}</b> <code>${lore.jp}</code><p>${lang === "en" ? lore.en : lore.zh}</p></div>` : ""}
    ${speakStatus() === "fallback" ? `<small class="wi-note">${t("wi.fallbackVoice")}</small>` : ""}`;
  p.querySelectorAll(".wi-spk").forEach((b) =>
    b.addEventListener("click", () => (b.dataset.s === "s" ? speakSlow(ch) : speak(ch))));
  p.hidden = false;
  const pw = 280;
  const x = Math.min(Math.max(8, anchorRect.left + anchorRect.width / 2 - pw / 2), innerWidth - pw - 8);
  const below = anchorRect.bottom + 8;
  p.style.left = `${x + scrollX}px`;
  p.style.top = `${(below + 240 > innerHeight ? anchorRect.top - 8 - Math.min(240, p.offsetHeight || 200) : below) + scrollY}px`;
  return true;
}

// Event delegation: any .ch glyph or [data-char] element becomes tappable.
export function enableCharTap(root = document) {
  root.addEventListener("click", (e) => {
    const chip = e.target.closest?.(".ch");
    const tagged = e.target.closest?.("[data-char]");
    let ch = null;
    if (tagged) ch = tagged.dataset.char;
    else if (chip) ch = chip.querySelector(".hz")?.textContent?.trim();
    if (ch && ch.length === 1) {
      const rect = (tagged || chip).getBoundingClientRect();
      showCharInfo(ch, rect);
    }
  });
}
