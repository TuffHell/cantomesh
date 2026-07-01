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

function render(el, data, onPractice) {
  const px = (v) => ((v.lng - HK.minLng) / (HK.maxLng - HK.minLng)) * 100;
  const py = (v) => (1 - (v.lat - HK.minLat) / (HK.maxLat - HK.minLat)) * 66;
  const dots = data.venues.map((v) =>
    `<g class="od-dot"><circle cx="${px(v).toFixed(1)}" cy="${py(v).toFixed(1)}" r="1.7"/>` +
    `<text x="${(px(v) + 2.4).toFixed(1)}" y="${(py(v) + 1).toFixed(1)}">${v.en}</text></g>`).join("");

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
    <svg class="od-map" viewBox="0 0 100 66" preserveAspectRatio="xMidYMid meet" aria-label="venue map">${dots}</svg>
    <div class="od-venues">
      ${data.venues.map((v) => `<a class="od-venue" href="${v.url}" target="_blank" rel="noopener">
        <b>${v.name}</b><i>${v.en}</i><span>${v.district} · ${v.area}</span></a>`).join("")}
    </div>
    <p class="od-attr">${t("od.source")}:
      <a href="${data.source.url}" target="_blank" rel="noopener">${data.source.name}</a> — ${data.source.note}</p>`;

  if (onPractice) {
    el.querySelector("#od-play").addEventListener("click", () => onPractice(dataChallenges(data)));
  }
}
