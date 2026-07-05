// 圖解粵劇 — illustrated glossary that translates hard Cantonese-opera terms
// through PICTURES, plus a matching mini-game built on the same cards.
// Term data + round-builder are pure (unit-testable); the screen code renders.
import { t, getLang } from "./i18n.js";

const INK = "#221d18", VER = "#b23a2e", GOLD = "#a9802f", JADE = "#3a6a5a", PAPER = "#fffdf8";

// Each term: compact SVG illustration + bilingual plain-language explanation.
export const TERMS = [
  { id: "seoi_zau", zh: "水袖", jp: "seoi2 zau6", en: "Water sleeves",
    ex_zh: "戲服長長的白綢袖，甩動如流水，用來放大情緒。", ex_en: "Long white silk sleeves flicked like flowing water to amplify emotion.",
    svg: `<path d="M20 30 q10 -14 24 -10 l4 8 q-14 2 -18 12 q16 30 6 52 q-16 -6 -20 -26 q-2 -20 4 -36 Z" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><path d="M44 20 q14 -6 22 4 q-6 26 8 48 q-14 8 -24 -4 q-12 -24 -6 -48 Z" fill="${VER}" stroke="${INK}" stroke-width="2"/>` },
  { id: "ling_zi", zh: "翎子", jp: "ling4 zi2", en: "Pheasant feathers",
    ex_zh: "頭盔上兩根長雉雞尾，武將轉頭時隨勢飛舞。", ex_en: "Two long pheasant tail-feathers on the helmet that whip as a warrior turns.",
    svg: `<circle cx="50" cy="70" r="16" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><path d="M42 56 Q18 30 26 8 M58 56 Q82 30 74 8" stroke="${JADE}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M26 8 l-4 6 M74 8 l4 6" stroke="${JADE}" stroke-width="2.4"/><path d="M38 62 q12 -8 24 0" stroke="${GOLD}" stroke-width="3" fill="none"/>` },
  { id: "man_coeng", zh: "文場", jp: "man4 coeng4", en: "Melodic ensemble",
    ex_zh: "拉弦吹管的樂隊——高胡、揚琴，托住唱腔。", ex_en: "The strings-and-winds band (gaohu, dulcimer) that carries the singing.",
    svg: `<ellipse cx="38" cy="66" rx="12" ry="14" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><rect x="35" y="10" width="6" height="46" rx="2" fill="${INK}"/><path d="M28 20 l52 44" stroke="${VER}" stroke-width="2.4"/><path d="M41 16 q8 -6 10 2 M41 24 q8 -6 10 2" stroke="${INK}" stroke-width="1.6" fill="none"/>` },
  { id: "mou_coeng", zh: "武場", jp: "mou5 coeng4", en: "Percussion",
    ex_zh: "鑼鼓鈸——掌管節奏與氣勢，亮相一刻鑼鼓齊鳴。", ex_en: "Gongs, drums and cymbals — the rhythm and thunder behind every pose.",
    svg: `<circle cx="50" cy="46" r="26" fill="${GOLD}" stroke="${INK}" stroke-width="2.4"/><circle cx="50" cy="46" r="10" fill="${VER}" stroke="${INK}" stroke-width="1.6"/><path d="M78 20 l10 -10 M80 16 l8 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` },
  { id: "saang", zh: "生", jp: "saang1", en: "Male role",
    ex_zh: "男主角行當——文質彬彬或武藝高強。", ex_en: "The male lead role type — scholar-refined or martial.",
    svg: `<ellipse cx="50" cy="50" rx="24" ry="28" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><path d="M30 34 Q50 20 70 34" fill="${INK}"/><path d="M38 48 q6 -4 12 0 M50 48 q6 -4 12 0" stroke="${INK}" stroke-width="2" fill="none"/><path d="M44 66 q6 4 12 0" stroke="${VER}" stroke-width="2.4" fill="none"/><path d="M50 78 l0 14 M44 92 l12 0" stroke="${INK}" stroke-width="2"/>` },
  { id: "daan", zh: "旦", jp: "daan3", en: "Female role",
    ex_zh: "女主角行當——鳳眼貼片，唱子喉假音。", ex_en: "The female lead role type — phoenix eyes, sung in falsetto (子喉).",
    svg: `<ellipse cx="50" cy="52" rx="23" ry="27" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><path d="M28 40 Q34 22 50 24 Q66 22 72 40 Q60 30 50 32 Q40 30 28 40 Z" fill="${INK}"/><circle cx="50" cy="26" r="4" fill="${VER}"/><path d="M38 50 q6 -6 12 -1 M50 49 q6 -5 12 1" stroke="${INK}" stroke-width="2" fill="none"/><path d="M34 60 q6 -6 12 -2 M66 60 q-6 -6 -12 -2" fill="none" stroke="${VER}" stroke-width="2" opacity="0.6"/><path d="M45 68 q5 4 10 0" stroke="${VER}" stroke-width="2.4" fill="none"/>` },
  { id: "zing", zh: "淨", jp: "zing6", en: "Painted face",
    ex_zh: "大花面行當——滿臉譜彩，聲如洪鐘。", ex_en: "The painted-face role — bold full-face patterns, thunderous voice.",
    svg: `<ellipse cx="50" cy="50" rx="25" ry="29" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><path d="M25 42 Q50 18 75 42 Q50 34 25 42 Z" fill="${VER}"/><path d="M30 52 q8 14 4 26 q-8 -6 -10 -18 Z" fill="${JADE}"/><path d="M70 52 q-8 14 -4 26 q8 -6 10 -18 Z" fill="${JADE}"/><path d="M36 50 q7 -7 14 0 q-7 6 -14 0 Z M50 50 q7 -7 14 0 q-7 6 -14 0 Z" fill="${INK}"/><path d="M43 70 q7 5 14 0" stroke="${GOLD}" stroke-width="3" fill="none"/>` },
  { id: "cau", zh: "丑", jp: "cau2", en: "Clown role",
    ex_zh: "諧角行當——鼻樑一塊白，妙語連珠。", ex_en: "The comic role — a white patch on the nose, quick with wit.",
    svg: `<ellipse cx="50" cy="52" rx="24" ry="27" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><rect x="40" y="42" width="20" height="16" rx="6" fill="#f0e9db" stroke="${INK}" stroke-width="1.6"/><circle cx="40" cy="46" r="3" fill="${INK}"/><circle cx="60" cy="46" r="3" fill="${INK}"/><path d="M40 68 q10 8 20 0" stroke="${VER}" stroke-width="2.6" fill="none"/><path d="M30 34 q20 -12 40 0" fill="${INK}"/>` },
  { id: "loeng_soeng", zh: "亮相", jp: "loeng6 soeng3", en: "Freeze pose",
    ex_zh: "動作到頂點忽然定格，配一聲鑼——攝住全場。", ex_en: "A sudden dramatic freeze at the climax, punctuated by a gong crash.",
    svg: `<circle cx="50" cy="26" r="9" fill="${PAPER}" stroke="${INK}" stroke-width="2"/><path d="M50 35 l0 28 M50 42 l-20 -12 M50 42 l18 -20 M50 63 l-12 24 M50 63 l12 24" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M74 14 l4 -8 M80 22 l8 -4 M70 8 l0 -6" stroke="${VER}" stroke-width="2.4" stroke-linecap="round"/>` },
];

// Pure round-builder for the matching game: n pairs, pictures & terms shuffled.
export function buildMatchRound(terms, n = 4, rand = Math.random) {
  const pool = [...terms];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, n);
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  return { pics: shuffle(chosen), labels: shuffle(chosen) };
}

const card = (term, lang) => `
  <button class="g-card" data-id="${term.id}">
    <svg viewBox="0 0 100 100">${term.svg}</svg>
    <b>${term.zh}</b><i>${term.jp}</i><span>${lang === "en" ? term.en : ""}</span>
  </button>`;

export function openGlossary(app, onExit) {
  const lang = getLang();
  let sel = null, matched = 0, tries = 0, round = null;

  function browse() {
    app.innerHTML = `<main class="wrap heritage">
      <div class="play-top">
        <button class="back" id="g-quit">${t("common.back")}</button>
        <button class="primary" id="g-play">${t("gloss.play")}</button>
      </div>
      <div class="card">
        <h2 class="g-title">${t("gloss.title")}</h2>
        <p class="hint">${t("gloss.sub")}</p>
        <div class="g-grid">${TERMS.map((x) => card(x, lang)).join("")}</div>
        <div class="g-explain" id="g-explain">${t("gloss.tap")}</div>
      </div></main>`;
    app.querySelector("#g-quit").addEventListener("click", onExit);
    app.querySelector("#g-play").addEventListener("click", game);
    app.querySelectorAll(".g-card").forEach((b) => b.addEventListener("click", () => {
      const x = TERMS.find((k) => k.id === b.dataset.id);
      app.querySelectorAll(".g-card").forEach((c) => c.classList.toggle("sel", c === b));
      app.querySelector("#g-explain").innerHTML =
        `<b>${x.zh}</b> <code>${x.jp}</code> · ${x.en}<br>${lang === "en" ? x.ex_en : x.ex_zh}`;
    }));
  }

  function game() {
    round = buildMatchRound(TERMS, 4); sel = null; matched = 0; tries = 0;
    app.innerHTML = `<main class="wrap heritage">
      <div class="play-top">
        <button class="back" id="g-back">${t("common.back")}</button>
        <span class="rcount" id="m-score">0 / 4</span>
      </div>
      <div class="card">
        <h2 class="g-title">${t("match.title")}</h2>
        <p class="hint">${t("match.sub")}</p>
        <div class="m-labels">${round.labels.map((x) =>
          `<button class="m-label" data-id="${x.id}">${x.zh}</button>`).join("")}</div>
        <div class="g-grid m-pics">${round.pics.map((x) =>
          `<button class="g-card" data-id="${x.id}"><svg viewBox="0 0 100 100">${x.svg}</svg></button>`).join("")}</div>
        <div class="g-explain" id="m-msg">${t("match.pick")}</div>
      </div></main>`;
    app.querySelector("#g-back").addEventListener("click", browse);
    app.querySelectorAll(".m-label").forEach((b) => b.addEventListener("click", () => {
      if (b.classList.contains("done")) return;
      sel = b.dataset.id;
      app.querySelectorAll(".m-label").forEach((c) => c.classList.toggle("sel", c === b));
    }));
    app.querySelectorAll(".m-pics .g-card").forEach((b) => b.addEventListener("click", () => {
      if (!sel || b.classList.contains("done")) return;
      tries++;
      if (b.dataset.id === sel) {
        matched++;
        b.classList.add("done");
        app.querySelector(`.m-label[data-id="${sel}"]`).classList.add("done");
        const x = TERMS.find((k) => k.id === sel);
        app.querySelector("#m-msg").innerHTML = `✓ <b>${x.zh}</b> · ${lang === "en" ? x.ex_en : x.ex_zh}`;
        app.querySelector("#m-score").textContent = `${matched} / 4`;
        sel = null;
        app.querySelectorAll(".m-label").forEach((c) => c.classList.remove("sel"));
        if (matched === 4) app.querySelector("#m-msg").innerHTML =
          `🎉 ${t("match.win", { tries })} <button class="ghost" id="m-again">${t("match.again")}</button>`;
        app.querySelector("#m-again")?.addEventListener("click", game);
      } else {
        b.classList.add("shake");
        setTimeout(() => b.classList.remove("shake"), 400);
        app.querySelector("#m-msg").textContent = t("match.no");
      }
    }));
  }

  browse();
  return { destroy() {} };
}
