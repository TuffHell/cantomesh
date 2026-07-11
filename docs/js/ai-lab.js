// AI 實驗室 · 見字知韻 — train a real convolutional network, live, on the
// heritage dictionary; then probe it on characters it has never seen.
import { t } from "./i18n.js";
import {
  buildDataset, baseline, trainLive, newNet, predictChar,
  saveModel, loadModel, loadPretrained, glyphTensor, GLYPH, N_GROUPS, PARAM_COUNT, rimeGroups, quizRound,
} from "./tone-ai.js";
import { recordMistake, clearMistakes } from "./mistakes.js";

const LOOP_KEY = "cantomesh.colearn.v1";
const loadLoop = () => { try { return JSON.parse(localStorage.getItem(LOOP_KEY)) || { rounds: [] }; } catch { return { rounds: [] }; } };
const saveLoop = (h) => { try { localStorage.setItem(LOOP_KEY, JSON.stringify(h)); } catch { /* ignore */ } };

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
    <div class="card" id="l-loop" ${net ? "" : "hidden"}>
      <h2 class="g-title">${t("loop.title")}</h2>
      <p class="hint">${t("loop.sub")}</p>
      <div class="loop-score" id="loop-score"></div>
      <canvas id="loop-chart" width="720" height="150" hidden></canvas>
      <div id="loop-area">
        <div class="controls"><button class="primary" id="loop-start">${t("loop.start")}</button></div>
      </div>
    </div>
    <div class="card note-card"><p class="note">${t("lab.why")}</p></div>
  </main>`;

  const $ = (s) => app.querySelector(s);
  $("#l-quit").addEventListener("click", () => { destroyed = true; onExit(); });

  // ================= 共學循環 · the educational loop =================
  // predict → check → correct → repeat. The human learns from revealed
  // answers; the AI learns from an extra training epoch. Both curves race.
  const loop = loadLoop();
  let round = null, qi = 0, userHits = 0, aiHits = 0;

  function loopStats() {
    const r = loop.rounds;
    if (!r.length) { $("#loop-score").innerHTML = ""; $("#loop-chart").hidden = true; return; }
    const last = r.at(-1);
    $("#loop-score").innerHTML =
      `<div><b class="you">${(last.user * 100).toFixed(0)}%</b><span>${t("loop.you")}</span></div>` +
      `<div><b class="ai">${(last.ai * 100).toFixed(0)}%</b><span>${t("loop.ai")}</span></div>` +
      `<div><b>${r.length}</b><span>${t("loop.rounds")}</span></div>`;
    const cv = $("#loop-chart"); cv.hidden = false;
    const c = cv.getContext("2d"), w = cv.width, h = cv.height, pad = 24;
    c.clearRect(0, 0, w, h);
    c.strokeStyle = "rgba(34,29,24,0.15)"; c.strokeRect(pad, 6, w - pad - 6, h - pad - 10);
    const X = (i) => pad + (r.length === 1 ? 0.5 : i / (r.length - 1)) * (w - pad - 10);
    const Y = (a) => 6 + (1 - a) * (h - pad - 14);
    const line = (key, color) => {
      c.strokeStyle = color; c.lineWidth = 2.2; c.beginPath();
      r.forEach((p, i) => (i ? c.lineTo(X(i), Y(p[key])) : c.moveTo(X(i), Y(p[key]))));
      c.stroke();
      c.fillStyle = color;
      r.forEach((p, i) => { c.beginPath(); c.arc(X(i), Y(p[key]), 2.6, 0, Math.PI * 2); c.fill(); });
    };
    line("user", "#3a6a5a"); line("ai", "#b23a2e");
    c.font = "11px sans-serif";
    c.fillStyle = "#3a6a5a"; c.fillText(t("loop.you"), pad + 4, 16);
    c.fillStyle = "#b23a2e"; c.fillText(t("loop.ai"), pad + 44, 16);
  }

  function ensureDs() {
    if (!ds) {
      ds = buildDataset({ scan: 12000 });
      meta = { groups: ds.groups, index: ds.index, exemplars: ds.exemplars };
      base = baseline(ds.val);
      renderStats();
    }
    return ds;
  }

  function startRound() {
    ensureDs();
    round = quizRound(ds.val, N_GROUPS, 5);
    qi = 0; userHits = 0; aiHits = 0;
    renderQuestion();
  }

  function renderQuestion() {
    const q = round[qi];
    const opts = q.options.map((gi) => {
      const ex = (meta.exemplars[meta.groups[gi]] || []).slice(0, 2).join("·");
      return `<button class="m-label loop-opt" data-g="${gi}">-${meta.groups[gi]}<small> ${ex}</small></button>`;
    }).join("");
    $("#loop-area").innerHTML = `
      <div class="loop-q">
        <span class="loop-prog">${qi + 1} / ${round.length}</span>
        <b class="loop-ch">${q.ch}</b>
        <p class="hint">${t("loop.ask")}</p>
        <div class="m-labels">${opts}</div>
        <div class="loop-reveal" id="loop-reveal" hidden></div>
      </div>`;
    app.querySelectorAll(".loop-opt").forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.g), b)));
  }

  function answer(gi, btn) {
    if ($("#loop-reveal").hidden === false) return;
    const q = round[qi];
    const aiPick = net.predict(q.x).argmax;
    const userRight = gi === q.answer, aiRight = aiPick === q.answer;
    if (userRight) { userHits++; clearMistakes([q.ch]); }
    else recordMistake(q.ch);
    if (aiRight) aiHits++;
    app.querySelectorAll(".loop-opt").forEach((b) => {
      const g = Number(b.dataset.g);
      b.disabled = true;
      if (g === q.answer) b.classList.add("done");
      else if (b === btn) b.classList.add("wrongpick");
      if (g === aiPick) b.insertAdjacentHTML("beforeend", `<em class="ai-tag">AI</em>`);
    });
    const rv = $("#loop-reveal");
    rv.hidden = false;
    rv.innerHTML = `<p>${userRight ? `<span class="good">✓ ${t("loop.uRight")}</span>` : `<span class="bad">✗ ${t("loop.uWrong")}</span>`}
      · AI ${aiRight ? `<span class="good">✓</span>` : `<span class="bad">✗</span>`}
      · ${t("lab.truth")} <b>-${meta.groups[q.answer]}</b>（${(meta.exemplars[meta.groups[q.answer]] || []).join("·")}）</p>
      <button class="primary" id="loop-next">${qi === round.length - 1 ? t("loop.finish") : t("btn.next")}</button>`;
    $("#loop-next").addEventListener("click", () => {
      qi++;
      if (qi < round.length) renderQuestion(); else finishRound();
    });
  }

  async function finishRound() {
    loop.rounds.push({ user: userHits / round.length, ai: aiHits / round.length, when: Date.now() });
    saveLoop(loop);
    loopStats();
    $("#loop-area").innerHTML = `
      <div class="loop-q center">
        <p class="loop-sum">${t("loop.sum", { u: userHits, a: aiHits, n: round.length })}</p>
        <p class="hint">${t("loop.lesson")}</p>
        <div class="controls" style="justify-content:center">
          <button class="ghost" id="loop-teach" ${training ? "disabled" : ""}>${t("loop.teach")}</button>
          <button class="primary" id="loop-again">${t("loop.again")}</button>
        </div>
        <p class="hint" id="loop-status"></p>
      </div>`;
    $("#loop-again").addEventListener("click", startRound);
    $("#loop-teach").addEventListener("click", async (e) => {
      if (training) return;
      training = true; e.target.disabled = true;
      $("#loop-status").textContent = t("loop.teaching");
      await trainLive(net, ensureDs(), {
        epochs: 1,
        onProgress: ({ step, totalSteps }) => {
          if (!destroyed) $("#loop-status").textContent = t("loop.teaching") + ` ${Math.round((step / totalSteps) * 100)}%`;
        },
      });
      if (destroyed) return;
      saveModel(net, { acc: null, when: Date.now() });
      $("#loop-status").textContent = t("loop.taught");
      e.target.disabled = false;
      training = false;
    });
  }

  $("#loop-start").addEventListener("click", startRound);
  loopStats();

  // no local model? load the pre-trained weights shipped with the site
  if (!net) {
    loadPretrained().then((m) => {
      if (destroyed || net || !m) return;
      net = m.net;
      $("#l-status").textContent = t("lab.pretrained", { p: Math.round((m.meta.acc || 0) * 100) });
      $("#l-playground").hidden = false;
      $("#l-loop").hidden = false;
    });
  }

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
    $("#l-loop").hidden = false;
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
