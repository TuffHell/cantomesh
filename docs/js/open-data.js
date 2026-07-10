// 粵劇在港 — government open data put to WORK, not just displayed:
//   1) real LCSD Cantonese-opera venues + the HK ICH inventory (data.gov.hk);
//   2) real 劇目 (repertoire) fed through the 平仄 engine to auto-generate live
//      training challenges. The dataset becomes the AI's training corpus.
import { t } from "./i18n.js";
import { lookup } from "./prosody.js";

const HK = { minLat: 22.18, maxLat: 22.56, minLng: 113.83, maxLng: 114.42 };

// Turn repertoire titles from the open dataset into engine-graded tone challenges.
export function dataChallenges(data, n = 8) {
  const chars = [...new Set((data.repertoire || []).join(""))].filter((c) => lookup(c));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, n).map((c) => ({ kind: "tone", char: c }));
}

export async function openHeritage(app, onExit, onPractice) {
  app.innerHTML = `<main class="wrap heritage">
    <div class="play-top">
      <button class="back" id="h-quit">${t("common.back")}</button>
      <span class="odsource">data.gov.hk · LCSD</span>
    </div>
    <div class="card"><div id="h-body">${t("od.loading")}</div></div>
  </main>`;
  app.querySelector("#h-quit").addEventListener("click", onExit);

  try {
    const res = await fetch("data/hk-opera-open-data.json", { cache: "no-store" });
    render(app.querySelector("#h-body"), await res.json(), onPractice);
  } catch {
    app.querySelector("#h-body").textContent = t("od.fail");
  }
  return { destroy() {} };
}

// Stylized Hong Kong coastline (ink-map style) drawn in the same lat/lng frame
// as the venue dots, so the geography reads instantly: NT/Kowloon landmass,
// Victoria Harbour, HK Island, Lantau.
const HK_LAND = `
  <rect x="0" y="0" width="100" height="66" class="od-sea"/>
  <path class="od-land" d="M0 0 H100 V33 L92 35 L88 40 L93 43 L82 46 L70 44 L63 45.5 L58 47 L54 45
    L48 42.5 L40 44 L32 42 L24 41 L18 36 L8 34 L0 36 Z"/>
  <path class="od-land" d="M52 49.5 Q56 47.6 62 48.2 Q70 48.2 72.5 50 Q71 54 64 55.5 Q56 56 52 53 Z"/>
  <path class="od-land" d="M13 50 Q20 46 30 48 Q34.5 50 32 54 Q24 58.5 16 56.5 Q11.5 53.5 13 50 Z"/>
  <path class="od-wave" d="M44 47.6 q2 -1 4 0 M60 46.8 q2 -1 4 0 M38 52 q2 -1 4 0"/>`;

function render(el, data, onPractice) {
  const px = (v) => ((v.lng - HK.minLng) / (HK.maxLng - HK.minLng)) * 100;
  const py = (v) => (1 - (v.lat - HK.minLat) / (HK.maxLat - HK.minLat)) * 66;
  const dots = data.venues.map((v) => {
    const x = px(v), y = py(v);
    const anchor = v.anchor || "start";
    const tx = anchor === "end" ? x - 2.6 : x + 2.6;
    return `<g class="od-dot" data-id="${v.id}" role="button" tabindex="0">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.9"/>
      <text x="${tx.toFixed(1)}" y="${(y + 1 + (v.dy || 0)).toFixed(1)}" text-anchor="${anchor}">${v.en}</text></g>`;
  }).join("");

  el.innerHTML = `
    <div class="od-head"><h2>${t("od.title")}</h2><p class="hint">${t("od.sub")}</p></div>
    <div class="od-ich">
      <b>${data.ich.name} · ${data.ich.en}</b>
      <span>${data.ich.unesco}</span><span>${data.ich.hkList}</span>
    </div>
    <div class="od-corpus">
      <h4>${t("od.corpus")}</h4>
      <div class="od-tags">${(data.repertoire || []).map((r) => `<span>${r}</span>`).join("")}</div>
      <div class="controls">
        <button class="primary" id="od-play">${t("od.practice")}</button>
      </div>
      <small class="hint">${t("od.practiceNote")}</small>
    </div>
    <svg class="od-map" viewBox="0 0 100 66" preserveAspectRatio="xMidYMid meet" aria-label="venue map">${HK_LAND}${dots}</svg>
    <p class="od-mapnote">${t("od.mapTip")}</p>
    <div class="od-venues">
      ${data.venues.map((v) => `<div class="od-venue" id="venue-${v.id}">
        <a href="${v.url}" target="_blank" rel="noopener"><b>${v.name}</b><i>${v.en}</i></a>
        <span>${v.district} · ${v.area}</span>
        <a class="od-loc" href="https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}" target="_blank" rel="noopener">📍 ${t("od.route")}</a>
      </div>`).join("")}
    </div>
    <p class="od-attr">${t("od.source")}:
      <a href="${data.source.url}" target="_blank" rel="noopener">${data.source.name}</a> — ${data.source.note}</p>`;

  // map dot ↔ venue card linking: tap a dot, its card lights up and scrolls into view
  el.querySelectorAll(".od-dot").forEach((g) => {
    const activate = () => {
      el.querySelectorAll(".od-venue").forEach((c) => c.classList.remove("sel"));
      el.querySelectorAll(".od-dot").forEach((d) => d.classList.remove("sel"));
      g.classList.add("sel");
      const card = el.querySelector(`#venue-${g.dataset.id}`);
      card?.classList.add("sel");
      card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    g.addEventListener("click", activate);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") activate(); });
  });

  if (onPractice) {
    el.querySelector("#od-play").addEventListener("click", () => onPractice(dataChallenges(data)));
  }
}
