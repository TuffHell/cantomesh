// 故事模式 — the full tale as a dark-scroll reader (the Ytong phone-scroll
// aesthetic): chapters with 🔊 narration, LORE words highlighted & tappable,
// and a famous-line 跟讀 finale with per-character tone chips.
import { WORLD_STORIES, CHAPTERS, FAMOUS_LINES, LORE } from "./stories.js";
import { storyScene } from "./story-scenes.js";
import { lookup, pingZe } from "./prosody.js";
import { speak, speakSlow, speakStatus } from "./speak.js";
import { t, getLang } from "./i18n.js";

const READ_KEY = "cantomesh.stories.v1";
export function getReadStories() {
  try { return JSON.parse(localStorage.getItem(READ_KEY)) || {}; } catch { return {}; }
}
function markRead(wid) {
  const r = getReadStories(); r[wid] = Date.now();
  try { localStorage.setItem(READ_KEY, JSON.stringify(r)); } catch { /* ignore */ }
}

// Highlight LORE characters inside prose so readers can tap the hard words.
function loreHighlight(text) {
  return [...text].map((ch) =>
    LORE[ch] ? `<span class="lore-hl" data-char="${ch}">${ch}</span>` : ch).join("");
}

const chip = (ch) => {
  const jp = lookup(ch);
  const pz = jp ? pingZe(jp) : null;
  return `<span class="ch${pz === "平" ? " ping" : pz === "仄" ? " ze" : ""}">
    <span class="hz">${ch}</span><span class="mark">${pz || "·"}</span><span class="jp">${jp || "?"}</span></span>`;
};

export function openStory(app, wid, onExit) {
  const s = WORLD_STORIES[wid], chapters = CHAPTERS[wid] || [], famous = FAMOUS_LINES[wid];
  if (!s) { onExit(); return; }
  const lang = getLang();
  const canSpeak = !["unsupported", "novoice"].includes(speakStatus());

  const chapterHtml = chapters.map((c, i) => `
    <section class="sr-chapter">
      <h3 class="sr-ct"><span>${t("story.chapter", { n: i + 1 })}</span>${lang === "en" ? c.t_en : c.t}</h3>
      ${c.p.map((para, j) => `
        <div class="sr-para">
          <p class="sr-p">${loreHighlight(lang === "en" ? (c.p_en[j] || para) : para)}</p>
          ${lang === "en" ? `<p class="sr-sub">${loreHighlight(para)}</p>` : `<p class="sr-sub">${c.p_en[j] || ""}</p>`}
          ${canSpeak ? `<button class="sr-spk" data-say="${para.replace(/"/g, "")}">🔊</button>` : ""}
        </div>`).join("")}
    </section>`).join("");

  app.innerHTML = `<div class="story-reader">
    <div class="sr-top wrap">
      <button class="back sr-back" id="sr-quit">${t("common.back")}</button>
    </div>
    <header class="sr-head wrap">
      <div class="sr-scene">${storyScene(wid)}</div>
      <p class="sp-era">${s.era}</p>
      <h1 class="sp-title">${[...s.title].map((c) => `<span data-char="${c}">${c}</span>`).join("")}</h1>
      <p class="sp-en">${s.en}</p>
    </header>
    <main class="wrap sr-body">
      ${chapterHtml}
      ${famous ? `<section class="sr-famous">
        <h3 class="sr-ct"><span>${t("story.famous")}</span></h3>
        <div class="verse"><div class="verse-line">${[...famous.line].map(chip).join("")}</div></div>
        <p class="sr-src">${lang === "en" ? famous.src_en : famous.src}</p>
        ${canSpeak ? `<div class="controls">
          <button class="primary" id="sr-say">🔊 ${t("acad.say")}</button>
          <button class="ghost" id="sr-slow">🐢 ${t("acad.slow")}</button>
        </div>` : ""}
        <p class="hint sr-hint">${t("acad.tapHint")}</p>
      </section>` : ""}
      <section class="sr-end">
        <button class="primary big" id="sr-done">${t("story.finish")}</button>
      </section>
    </main>
  </div>`;

  const $ = (sel) => app.querySelector(sel);
  $("#sr-quit").addEventListener("click", onExit);
  $("#sr-done").addEventListener("click", () => { markRead(wid); onExit(); });
  app.querySelectorAll(".sr-spk").forEach((b) => b.addEventListener("click", () => speak(b.dataset.say)));
  $("#sr-say")?.addEventListener("click", () => speak(famous.line));
  $("#sr-slow")?.addEventListener("click", () => speakSlow(famous.line));
  window.scrollTo(0, 0);
}
