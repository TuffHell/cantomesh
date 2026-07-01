// 身段訓練 — on-device camera pose trainer. Streams webcam → MediaPipe Pose
// Landmarker (BlazePose) → the tested scoring core (pose-coach.js) → live score,
// per-joint coaching, and 亮相 hold-detection. All inference is on-device; the
// video never leaves the browser.
import { POSES, CONNECTIONS, scorePose, LM } from "./pose-coach.js";
import { t } from "./i18n.js";

const MP = "0.10.20";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const POSE_KEY = "cantomesh.pose.v1";
const PASS = 78; // score needed to count as a clean attempt

const loadBest = () => { try { return JSON.parse(localStorage.getItem(POSE_KEY)) || {}; } catch { return {}; } };
const saveBest = (b) => { try { localStorage.setItem(POSE_KEY, JSON.stringify(b)); } catch { /* ignore */ } };

// Reference silhouette ("ghost") drawn from a set of arm joints {le,lw,re,rw}.
function ghostSVG(g) {
  if (!g) return "";
  const N = [0.5, 0.15], LS = [0.40, 0.30], RS = [0.60, 0.30], MS = [0.5, 0.30], MH = [0.5, 0.58],
    LH = [0.45, 0.58], RH = [0.55, 0.58], LK = [0.45, 0.78], RK = [0.55, 0.78], LA = [0.46, 0.96], RA = [0.54, 0.96];
  const c = (a) => `${(a[0] * 100).toFixed(1)},${(a[1] * 100).toFixed(1)}`;
  const line = (a, b) => `<line x1="${a[0] * 100}" y1="${a[1] * 100}" x2="${b[0] * 100}" y2="${b[1] * 100}"/>`;
  const poly = (...pts) => `<polyline points="${pts.map(c).join(" ")}"/>`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="${N[0] * 100}" cy="${N[1] * 100}" r="6"/>
      ${line(MS, MH)}${line(LS, RS)}${line(LH, RH)}
      ${poly(LS, g.le, g.lw)}${poly(RS, g.re, g.rw)}
      ${poly(LH, LK, LA)}${poly(RH, RK, RA)}
    </g></svg>`;
}

export function openPoseTrainer(app, onExit) {
  let landmarker = null, stream = null, raf = 0, running = true;
  let poseIdx = 0, holdStart = 0, peak = 0;
  let routine = false, seqStep = 0, combo = 0, ghostAnim = 0;
  const SEQ = [0, 1, 2]; // 山膀 → 順風旗 → 亮相
  const best = loadBest();

  app.innerHTML = `
    <main class="wrap trainer">
      <div class="play-top">
        <button class="back" id="t-quit">${t("common.back")}</button>
        <div class="pose-tabs" id="pose-tabs">
          ${POSES.map((p, i) => `<button class="ptab ${i === 0 ? "active" : ""}" data-i="${i}">${p.name}</button>`).join("")}
          <button class="ptab" data-i="routine">${t("routine.tab")}</button>
        </div>
      </div>
      <div class="card trainer-stage">
        <div class="cam-wrap">
          <video id="cam" playsinline muted></video>
          <div class="ghost" id="ghost" aria-hidden="true"></div>
          <canvas id="skel"></canvas>
          <div class="cam-status" id="cam-status">${t("cam.start")}</div>
          <div class="peak-badge" id="peak-badge" hidden></div>
        </div>
        <div class="coach">
          <h2 id="pose-name"></h2>
          <p class="cue" id="pose-cue"></p>
          <div class="score-meter"><i id="score-fill"></i><span id="pass-mark" style="left:${PASS}%"></span></div>
          <div class="score-line"><span id="score-num">--</span><small id="best-num"></small></div>
          <p class="coach-hint" id="coach-hint">${t("trainer.stand")}</p>
          <div class="hold-row" id="hold-row" hidden><span>${t("trainer.holding")}</span><span class="hold-track"><i id="hold-fill"></i></span></div>
          <p class="privacy">${t("privacy")}</p>
        </div>
      </div>
    </main>`;

  const $ = (s) => app.querySelector(s);
  const video = $("#cam"), canvas = $("#skel"), ctx = canvas.getContext("2d");
  const status = $("#cam-status");

  function cleanup() {
    running = false;
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    try { landmarker?.close(); } catch { /* ignore */ }
  }
  function quit() { cleanup(); onExit(); }
  $("#t-quit").addEventListener("click", quit);

  const setGhost = (g) => { $("#ghost").innerHTML = ghostSVG(g); };

  function selectPose(i) {
    routine = false; cancelAnimationFrame(ghostAnim);
    poseIdx = i; holdStart = 0; peak = 0;
    app.querySelectorAll(".ptab").forEach((b) => b.classList.toggle("active", b.dataset.i === String(i)));
    const p = POSES[i];
    $("#pose-name").textContent = t(`pose.${p.id}.name`);
    $("#pose-cue").textContent = t(`pose.${p.id}.cue`);
    $("#hold-row").hidden = !p.hold;
    $("#best-num").textContent = best[p.id] ? t("trainer.best", { n: best[p.id] }) : "";
    $("#peak-badge").hidden = true;
    setGhost(p.ghost);
    $("#ghost").classList.remove("matched");
  }

  // ---- movement routine (a flowing sequence, not a frozen hold) ----
  function selectRoutine() {
    routine = true; seqStep = 0; combo = 0; holdStart = 0;
    app.querySelectorAll(".ptab").forEach((b) => b.classList.toggle("active", b.dataset.i === "routine"));
    $("#pose-name").textContent = t("routine.title");
    $("#pose-cue").textContent = t("routine.cue");
    $("#hold-row").hidden = false;
    $("#best-num").textContent = "";
    $("#peak-badge").hidden = true;
    $("#score-num").textContent = "--";
    setGhost(POSES[SEQ[0]].ghost);
    updateRoutineHint();
  }
  function updateRoutineHint() {
    const p = POSES[SEQ[seqStep]];
    $("#coach-hint").textContent = t("routine.step", {
      n: seqStep + 1, total: SEQ.length, pose: t(`pose.${p.id}.name`), combo,
    });
  }
  function animateGhost(fromG, toG) {
    cancelAnimationFrame(ghostAnim);
    const t0 = performance.now(), dur = 650, keys = ["le", "lw", "re", "rw"];
    const lerp = (a, b, u) => a + (b - a) * u;
    const tick = () => {
      const u = Math.min(1, (performance.now() - t0) / dur);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const g = {};
      for (const k of keys) g[k] = [lerp(fromG[k][0], toG[k][0], e), lerp(fromG[k][1], toG[k][1], e)];
      setGhost(g);
      if (u < 1) ghostAnim = requestAnimationFrame(tick);
    };
    ghostAnim = requestAnimationFrame(tick);
  }
  function routineTick(score) {
    const cur = POSES[SEQ[seqStep]], need = 500;
    if (score >= PASS) {
      if (!holdStart) holdStart = performance.now();
      const held = performance.now() - holdStart;
      $("#hold-fill").style.width = `${Math.min(100, (held / need) * 100)}%`;
      if (held >= need) {
        combo++;
        const next = POSES[SEQ[(seqStep + 1) % SEQ.length]];
        animateGhost(cur.ghost, next.ghost);
        seqStep = (seqStep + 1) % SEQ.length;
        holdStart = 0; $("#hold-fill").style.width = "0%";
        updateRoutineHint();
        if (seqStep === 0) { const b = $("#peak-badge"); b.hidden = false; b.textContent = t("routine.done", { combo }); }
      }
    } else {
      holdStart = 0; $("#hold-fill").style.width = "0%"; updateRoutineHint();
    }
  }

  app.querySelectorAll(".ptab").forEach((b) =>
    b.addEventListener("click", () => (b.dataset.i === "routine" ? selectRoutine() : selectPose(Number(b.dataset.i)))));
  selectPose(0);

  function drawSkeleton(lm) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(178,58,46,0.85)";
    for (const [a, b] of CONNECTIONS) {
      if (!lm[a] || !lm[b]) continue;
      ctx.beginPath(); ctx.moveTo(lm[a].x * w, lm[a].y * h); ctx.lineTo(lm[b].x * w, lm[b].y * h); ctx.stroke();
    }
    ctx.fillStyle = "#a9802f";
    for (const i of [LM.NOSE, LM.L_SHO, LM.R_SHO, LM.L_ELB, LM.R_ELB, LM.L_WRI, LM.R_WRI]) {
      if (!lm[i]) continue;
      ctx.beginPath(); ctx.arc(lm[i].x * w, lm[i].y * h, 6, 0, Math.PI * 2); ctx.fill();
    }
  }

  function onResult(score, hint, pose) {
    $("#ghost")?.classList.toggle("matched", score >= PASS);
    $("#score-fill").style.width = `${score}%`;
    $("#score-fill").style.background = score >= PASS ? "var(--jade)" : "var(--gold)";
    $("#score-num").textContent = score;
    if (routine) { routineTick(score); return; }
    $("#coach-hint").textContent = hint ? t(hint) : (score >= PASS ? t("trainer.hold") : t("trainer.adjust"));
    peak = Math.max(peak, score);

    // hold / completion logic
    const need = pose.hold || 500;
    if (score >= PASS) {
      if (!holdStart) holdStart = performance.now();
      const held = performance.now() - holdStart;
      if (pose.hold) { $("#hold-fill").style.width = `${Math.min(100, (held / need) * 100)}%`; }
      if (held >= need) complete(pose);
    } else {
      holdStart = 0;
      if (pose.hold) $("#hold-fill").style.width = "0%";
    }
  }

  function complete(pose) {
    if (best[pose.id] !== undefined && peak <= best[pose.id] && best[pose.id] >= PASS) {
      // already recorded a better/equal attempt; still celebrate briefly
    }
    best[pose.id] = Math.max(best[pose.id] || 0, peak);
    saveBest(best);
    $("#best-num").textContent = `最佳 ${best[pose.id]}`;
    const badge = $("#peak-badge");
    badge.hidden = false;
    badge.textContent = t("trainer.pass", { name: t(`pose.${pose.id}.name`), n: peak });
    holdStart = 0; peak = 0;
  }

  function loop() {
    if (!running) return;
    if (video.readyState >= 2 && landmarker) {
      canvas.width = video.videoWidth || canvas.clientWidth;
      canvas.height = video.videoHeight || canvas.clientHeight;
      let res;
      try { res = landmarker.detectForVideo(video, performance.now()); } catch { /* skip frame */ }
      const lm = res?.landmarks?.[0];
      const pose = routine ? POSES[SEQ[seqStep]] : POSES[poseIdx];
      if (lm) {
        drawSkeleton(lm);
        const r = scorePose(lm, pose);
        if (r.ok) onResult(r.score, r.worstHint, pose);
        else { $("#coach-hint").textContent = t("trainer.framing"); $("#score-num").textContent = "--"; $("#score-fill").style.width = "0%"; }
      }
    }
    raf = requestAnimationFrame(loop);
  }

  async function init() {
    // 1) camera
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
      video.srcObject = stream;
      await video.play();
    } catch (e) {
      status.innerHTML = t("cam.denied", { err: e.name || "error" });
      return;
    }
    // 2) model (on-device, downloaded once)
    status.textContent = t("cam.model");
    try {
      const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP}`);
      const resolver = await vision.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP}/wasm`);
      landmarker = await vision.PoseLandmarker.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
        runningMode: "VIDEO", numPoses: 1,
      });
    } catch (e) {
      status.innerHTML = t("cam.modelfail", { msg: e.message || "" });
      return;
    }
    status.hidden = true;
    loop();
  }
  init();

  return { destroy: cleanup };
}
