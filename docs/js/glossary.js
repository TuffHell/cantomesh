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

// ---- 戲寶百科: categories + instruments & costumes --------------------------
const CATMAP = {
  seoi_zau: "stage", ling_zi: "costume", man_coeng: "music", mou_coeng: "music",
  saang: "role", daan: "role", zing: "role", cau: "role", loeng_soeng: "stage",
};

export const EXTRA_TERMS = [
  { id: "gou_wu", cat: "music", zh: "高胡", jp: "gou1 wu4", en: "Gaohu fiddle",
    ex_zh: "粵樂「頭架」——兩弦高音胡琴，夾於兩膝間拉奏，音色清亮，領奏全場。", ex_en: "The lead two-string fiddle, held between the knees — bright, singing, and in charge.",
    svg: `<ellipse cx="42" cy="70" rx="13" ry="15" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><rect x="39" y="8" width="6" height="50" rx="2" fill="${INK}"/><path d="M32 16 l50 48" stroke="${VER}" stroke-width="2.4"/><circle cx="45" cy="14" r="3" fill="${GOLD}"/><circle cx="45" cy="22" r="3" fill="${GOLD}"/>` },
  { id: "joeng_kam", cat: "music", zh: "揚琴", jp: "joeng4 kam4", en: "Hammered dulcimer",
    ex_zh: "梯形擊弦樂器，雙竹輕敲，如珠落玉盤，是文場的骨幹。", ex_en: "A trapezoid of strings struck with bamboo hammers — pearls on a jade plate.",
    svg: `<path d="M22 34 L78 34 L88 72 L12 72 Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/><path d="M28 42 h44 M25 52 h50 M22 62 h56" stroke="${GOLD}" stroke-width="1.6"/><path d="M36 26 l10 14 M64 26 l-10 14" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` },
  { id: "bok_jyu", cat: "music", zh: "卜魚 · 板", jp: "buk1 jyu4", en: "Woodblock & clapper",
    ex_zh: "掌板師傅的令旗——卜魚定節拍，全團看它一聲下槌。", ex_en: "The percussion leader's baton — the whole company breathes on its tick.",
    svg: `<ellipse cx="50" cy="58" rx="24" ry="16" fill="${VER}" stroke="${INK}" stroke-width="2.4"/><path d="M30 58 q20 -10 40 0" stroke="${INK}" stroke-width="1.6" fill="none"/><rect x="62" y="18" width="6" height="30" rx="3" fill="${INK}" transform="rotate(24 65 33)"/>` },
  { id: "so_naa", cat: "music", zh: "嗩吶", jp: "so2 naa1", en: "Suona horn",
    ex_zh: "高亢的簧管，出將入相、婚喪喜慶皆由它開路，聲震戲棚。", ex_en: "The piercing double-reed horn that announces generals, weddings and gods alike.",
    svg: `<path d="M46 12 L54 12 L58 62 L42 62 Z" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><path d="M42 62 Q30 78 24 92 Q50 84 76 92 Q70 78 58 62 Z" fill="${VER}" stroke="${INK}" stroke-width="2.2"/><circle cx="50" cy="26" r="1.8" fill="${INK}"/><circle cx="50" cy="36" r="1.8" fill="${INK}"/><circle cx="50" cy="46" r="1.8" fill="${INK}"/>` },
  { id: "caa", cat: "music", zh: "鈸", jp: "bat6", en: "Cymbals",
    ex_zh: "武場之翼，與大鑼一呼一應。開打時鈸聲如浪，逐拍推高。", ex_en: "The crash that answers the gong — combat scenes surge on its waves.",
    svg: `<circle cx="42" cy="50" r="24" fill="${GOLD}" stroke="${INK}" stroke-width="2.2"/><circle cx="42" cy="50" r="6" fill="${VER}"/><circle cx="60" cy="60" r="24" fill="${GOLD}" stroke="${INK}" stroke-width="2.2" opacity="0.85"/><circle cx="60" cy="60" r="6" fill="${VER}"/>` },
  { id: "mong_pou", cat: "costume", zh: "蟒袍", jp: "mong5 pou4", en: "Python robe",
    ex_zh: "帝王將相的禮服，滿身蟒紋雲海。黃者至尊，非帝不服。", ex_en: "Court robe of emperors and generals, embroidered with four-clawed dragons; yellow is reserved for the throne.",
    svg: `<path d="M30 20 L70 20 L82 34 L72 42 L72 88 L28 88 L28 42 L18 34 Z" fill="${VER}" stroke="${INK}" stroke-width="2.2"/><path d="M40 46 q10 -8 20 0 q-10 10 -20 0 Z" fill="${GOLD}"/><path d="M34 66 q16 8 32 0" stroke="${GOLD}" stroke-width="2.4" fill="none"/><path d="M30 20 L70 20 L64 30 L36 30 Z" fill="${GOLD}" opacity="0.7"/>` },
  { id: "daai_kaau", cat: "costume", zh: "大靠", jp: "daai6 kaau3", en: "Battle armour",
    ex_zh: "武將鎧甲，背插四面三角靠旗——旗隨身轉，威風凜凜。", ex_en: "Stage armour with four banner flags rising from the back, wheeling as the general turns.",
    svg: `<path d="M36 40 L64 40 L68 88 L32 88 Z" fill="${JADE}" stroke="${INK}" stroke-width="2.2"/><path d="M40 40 L24 14 L44 30 Z M60 40 L76 14 L56 30 Z M46 36 L38 8 L52 26 Z M54 36 L62 8 L48 26 Z" fill="${VER}" stroke="${INK}" stroke-width="1.4"/><circle cx="50" cy="56" r="7" fill="${GOLD}" stroke="${INK}" stroke-width="1.4"/>` },
  { id: "pei_fung", cat: "costume", zh: "帔風", jp: "pei3 fung1", en: "Cape robe",
    ex_zh: "文場便服，對襟長帔，繡花淡雅——生旦居家相見，多着帔風。", ex_en: "The elegant informal robe for domestic scenes — soft embroidery, quiet grace.",
    svg: `<path d="M34 18 L66 18 L74 88 L26 88 Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.2"/><path d="M50 18 L50 88" stroke="${VER}" stroke-width="2"/><path d="M38 40 q6 -6 10 0 M52 40 q6 -6 10 0" stroke="${JADE}" stroke-width="1.8" fill="none"/><circle cx="42" cy="60" r="3" fill="${VER}" opacity="0.7"/><circle cx="58" cy="60" r="3" fill="${VER}" opacity="0.7"/>` },
  { id: "kwai_tau", cat: "costume", zh: "盔頭", jp: "kwai1 tau4", en: "Headdress",
    ex_zh: "冠、盔、巾、帽四大類逾百款——鳳冠珠搖，帥盔翎立，一頂盔頭一個身份。", ex_en: "Crowns, helmets, kerchiefs and hats — over a hundred kinds; the headdress names the character.",
    svg: `<path d="M26 62 Q50 30 74 62 L74 70 Q50 54 26 70 Z" fill="${VER}" stroke="${GOLD}" stroke-width="2.4"/><path d="M50 26 q-8 10 0 20 q8 -10 0 -20 Z" fill="${GOLD}" stroke="${INK}" stroke-width="1.4"/><circle cx="32" cy="56" r="4.5" fill="${GOLD}"/><circle cx="68" cy="56" r="4.5" fill="${GOLD}"/><path d="M30 50 Q14 34 20 16 M70 50 Q86 34 80 16" stroke="${JADE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` },
  { id: "daai_lo", cat: "music", zh: "大鑼", jp: "daai6 lo4", en: "Great gong",
    ex_zh: "武場之王——亮相、升堂、開打，全憑一鑼斷句。", ex_en: "King of the pit: one stroke seals a freeze, a verdict, a charge.",
    svg: `<circle cx="50" cy="48" r="27" fill="${GOLD}" stroke="${INK}" stroke-width="2.6"/><circle cx="50" cy="48" r="11" fill="${VER}" stroke="${INK}" stroke-width="1.6"/><path d="M76 20 l10 -10 M80 28 l10 -6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` },
];

export const CATS = ["role", "stage", "music", "costume"];
export const ENCYCLOPEDIA = [
  ...TERMS.map(x => ({ ...x, cat: CATMAP[x.id] || "stage" })),
  ...EXTRA_TERMS,
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
