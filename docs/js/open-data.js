// 粵劇在港 — a government open-data panel: real Cantonese-opera venues + the HK
// ICH inventory, sourced from data.gov.hk / LCSD. Bridges "learn it" → "see it
// live", and puts the Open Data competition theme to work.
import { t } from "./i18n.js";

// Rough Hong Kong bounding box for plotting venue coordinates.
const HK = { minLat: 22.18, maxLat: 22.56, minLng: 113.83, maxLng: 114.42 };

export async function openHeritage(app, onExit) {
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
    render(app.querySelector("#h-body"), await res.json());
  } catch {
    app.querySelector("#h-body").textContent = t("od.fail");
  }
  return { destroy() {} };
}

function render(el, data) {
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
    <svg class="od-map" viewBox="0 0 100 66" preserveAspectRatio="xMidYMid meet" aria-label="venue map">${dots}</svg>
    <div class="od-venues">
      ${data.venues.map((v) => `<a class="od-venue" href="${v.url}" target="_blank" rel="noopener">
        <b>${v.name}</b><i>${v.en}</i><span>${v.district} · ${v.area}</span></a>`).join("")}
    </div>
    <p class="od-attr">${t("od.source")}:
      <a href="${data.source.url}" target="_blank" rel="noopener">${data.source.name}</a> — ${data.source.note}</p>`;
}
