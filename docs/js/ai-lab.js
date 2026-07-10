// AI 實驗室 · 見字知韻 — train a real convolutional network, live, on the
// heritage dictionary; then probe it on characters it has never seen.
import { t } from "./i18n.js";
import {
  buildDataset, baseline, trainLive, newNet, predictChar,
  saveModel, loadModel, glyphTensor, GLYPH, N_GROUPS, PARAM_COUNT, rimeGroups,
} from "./tone-ai.js";

export function openAiLab(app, onExit) {
  let net = null, ds = null, base = null, meta = rimeGroups(), training = false, destroyed = false;
  const saved = loadModel();
  if (saved) net = saved.net;

  app.innerHTML = `<main class="wrap heritage ailab">
    <div class="play-top">
      <button class="back" id="l-quit">${t("common.back")}</button>
      <span class="odsource">hand-written CNN · on-device</span>
    </div>
    <div class="card">
      <h2 class="g-title">${t("lab.title")}</h2>
      <p class="hint">${t("lab.sub")}</p>
      <div class="lab-stats" id="lab-stats"></div>
      <div class="controls">
        <button class="primary" id="l-train">${t("lab.train")}</button>
        <label class="lab-size"><input type="checkbox" id="l-big" /> ${t("lab.big")}</label>
        <span class="hint" id="l-status">${saved ? t("lab.loaded", { p: Math.round((saved.meta?.acc || 0) * 100) }) : ""}</span>
      </div>
      <canvas id="l-chart" width="720" height="200"></canvas>
      <div class="lab-results" id="l-results" hidden></div>
    </div>
    <div class="card" id="l-playground" ${net ? "" : "hidden"}>
      <h2 class="g-title">${t("lab.playTitle")}</h2>
      <p class="hint">${t("lab.playSub")}</p>
      <div class="controls">
        <input id="l-char" class="oneline" maxlength="2" placeholder="鎮" style="width:5.5rem;font-size:1.6rem;text-align:center" />
        <button class="primary" id="l-predict">${t("lab.predict")}</button>
      </div>
      <div class="lab-pred" id="l-pred"></div>
    </div>
    <div class="card note-card"><p class="note">${t("lab.why")}</p></div>
  </main>`;

  const $ = (s) => app.querySelector(s);
  $("#l-quit").addEventListener("click", () => { destroyed = true; onExit(); });

  function renderStats() {
    const n = ds ? ds.train.length + ds.val.length : 0;
    $("#lab-stats").innerHTML = `
      <div><b>20,865</b><span>${t("lab.dict")}</span></div>
      <div><b>${N_GROUPS}</b><span>${t("lab.groups")}</span></div>
      <div><b>${n ? n.toLocaleString() : "—"}</b><span>${t("lab.samples")}</span></div>
      <div><b>${PARAM_COUNT.toLocaleString()}</b><span>${t("lab.params")}</span></div>`;
  }
  renderStats();

  function drawChart(history, baseAcc) {
    const cv = $("#l-chart"), c = cv.getContext("2d");
    const w = cv.width, h = cv.height, pad = 26;
    c.clearRect(0, 0, w, h);
    c.strokeStyle = "rgba(34,29,24,0.15)"; c.strokeRect(pad, 8, w - pad - 8, h - pad - 8);
    const losses = history.filter((p) => p.loss != null);
    const accs = history.filter((p) => p.valRime != null);
    const maxStep = Math.max(1, history.at(-1)?.step || 1);
    const X = (s) => pad + (s / maxStep) * (w - pad - 8);
    const accY = (a) => 8 + (1 - a / 0.5) * (h - pad - 16); // acc axis 0..50%
    if (baseAcc != null) {
      c.setLineDash([5, 5]); c.strokeStyle = "#a9802f"; c.beginPath();
      c.moveTo(pad, accY(baseAcc)); c.lineTo(w - 8, accY(baseAcc)); c.stroke(); c.setLineDash([]);
      c.fillStyle = "#a9802f"; c.font = "11px sans-serif";
      c.fillText(`baseline ${(baseAcc * 100).toFixed(0)}%`, pad + 4, accY(baseAcc) - 4);
    }
    if (losses.length > 1) {
      const maxL = Math.max(...losses.map((p) => p.loss));
      c.strokeStyle = "#b23a2e"; c.lineWidth = 2; c.beginPath();
      losses.forEach((p, i) => {
        const y = 8 + (p.loss / maxL) * (h - pad - 16);
        i ? c.lineTo(X(p.step), y) : c.moveTo(X(p.step), y);
      });
      c.stroke();
    }
    if (accs.length) {
      c.strokeStyle = "#3a6a5a"; c.lineWidth = 2.4; c.beginPath();
      accs.forEach((p, i) => (i ? c.lineTo(X(p.step), accY(p.valRime)) : c.moveTo(X(p.step), accY(p.valRime))));
      c.stroke();
      const last = accs.at(-1);
      c.fillStyle = "#3a6a5a";
      c.fillText(`韻 ${(last.valRime * 100).toFixed(0)}%`, X(last.step) - 44, accY(last.valRime) - 6);
    }
    c.fillStyle = "#b23a2e"; c.fillText("loss", pad + 4, 18);
  }

  async function runTraining() {
    if (training) return;
    training = true;
    $("#l-train").disabled = true;
    $("#l-status").textContent = t("lab.building");
    await new Promise((r) => setTimeout(r, 30));
    ds = buildDataset({ scan: 12000 });
    meta = { groups: ds.groups, index: ds.index, exemplars: ds.exemplars };
    base = baseline(ds.val);
    renderStats();
    net = newNet();
    const t0 = performance.now();
    const finalAcc = await trainLive(net, ds, {
      epochs: $("#l-big").checked ? 10 : 6,
      onProgress: ({ step, totalSteps, epoch, epochs, history }) => {
        if (destroyed) return;
        $("#l-status").textContent = t("lab.progress", { e: epoch, es: epochs, pct: Math.round((step / totalSteps) * 100) });
        drawChart(history, base);
      },
    });
    if (destroyed) return;
    const secs = ((performance.now() - t0) / 1000).toFixed(0);
    saveModel(net, { acc: finalAcc, base, when: Date.now() });
    $("#l-status").textContent = "";
    const res = $("#l-results");
    res.hidden = false;
    res.innerHTML = `
      <div><b class="${finalAcc > base ? "good" : ""}">${(finalAcc * 100).toFixed(1)}%</b>
        <span>${t("lab.acc")}</span><small>baseline ${(base * 100).toFixed(1)}%</small></div>
      <div><b class="good">×${(finalAcc / base).toFixed(1)}</b>
        <span>${t("lab.lift")}</span><small>${t("lab.unseenNote")}</small></div>
      <div><b>${secs}s</b><span>${t("lab.time")}</span><small>${ds.train.length.toLocaleString()} ${t("lab.samples")}</small></div>`;
    $("#l-playground").hidden = false;
    $("#l-train").disabled = false;
    $("#l-train").textContent = t("lab.retrain");
    training = false;
  }
  $("#l-train").addEventListener("click", runTraining);

  function renderPrediction(ch) {
    if (!net || !ch) return;
    const { out, predGroup, partners, trueGroup, inTask, jp } = predictChar(net, ch, meta);
    const ranked = [...out.probs.keys()].sort((a, b) => out.probs[b] - out.probs[a]).slice(0, 5);
    const bars = ranked.map((i) => {
      const p = out.probs[i], win = i === out.argmax;
      const ex = (meta.exemplars[meta.groups[i]] || []).slice(0, 2).join("");
      return `<div class="tbar"><span>-${meta.groups[i]} ${ex}</span><i style="width:${(p * 100).toFixed(1)}%" class="${win ? "win" : ""}"></i><small>${(p * 100).toFixed(0)}%</small></div>`;
    }).join("");
    let verdict;
    if (!jp) verdict = `<span class="unknown">${t("lab.unseen")}</span>`;
    else if (!inTask) verdict = `${t("lab.truth")} <code>${jp}</code> · ${t("lab.offtask", { g: trueGroup })}`;
    else {
      const hit = trueGroup === predGroup;
      verdict = `${t("lab.truth")} <code>${jp}</code> · ${hit ? `<span class="good">✓ ${t("lab.correct")}</span>` : `<span class="bad">✗ ${t("lab.wrong")}</span>`}`;
    }
    const x = glyphTensor(ch);
    const pv = document.createElement("canvas"); pv.width = GLYPH; pv.height = GLYPH;
    const pc = pv.getContext("2d"), img = pc.createImageData(GLYPH, GLYPH);
    for (let i = 0; i < x.length; i++) {
      const v = 255 - x[i] * 255;
      img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
    }
    pc.putImageData(img, 0, 0);
    $("#l-pred").innerHTML = `
      <div class="pred-row">
        <img class="glyph-pv" src="${pv.toDataURL()}" alt="${ch}" width="72" height="72"/>
        <div class="pred-main"><b>${ch}</b> → <b class="pz">-${predGroup}</b>
          <p>${t("lab.rhymesWith")} ${partners.map((c) => `<b>${c}</b>`).join("·") || "—"}</p>
          <p>${verdict}</p></div>
      </div>
      <div class="tbars">${bars}</div>`;
  }
  $("#l-predict").addEventListener("click", () => renderPrediction($("#l-char").value.trim()[0]));
  $("#l-char").addEventListener("keydown", (e) => { if (e.key === "Enter") renderPrediction(e.target.value.trim()[0]); });

  return { destroy() { destroyed = true; } };
}
