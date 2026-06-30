// 身段訓練 — on-device camera pose trainer. Streams webcam → MediaPipe Pose
// Landmarker (BlazePose) → the tested scoring core (pose-coach.js) → live score,
// per-joint coaching, and 亮相 hold-detection. All inference is on-device; the
// video never leaves the browser.
import { POSES, CONNECTIONS, scorePose, LM } from "./pose-coach.js";

const MP = "0.10.20";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const POSE_KEY = "cantomesh.pose.v1";
const PASS = 78; // score needed to count as a clean attempt

const loadBest = () => { try { return JSON.parse(localStorage.getItem(POSE_KEY)) || {}; } catch { return {}; } };
const saveBest = (b) => { try { localStorage.setItem(POSE_KEY, JSON.stringify(b)); } catch { /* ignore */ } };

export function openPoseTrainer(app, onExit) {
  let landmarker = null, stream = null, raf = 0, running = true;
  let poseIdx = 0, holdStart = 0, peak = 0;
  const best = loadBest();

  app.innerHTML = `
    <main class="wrap trainer">
      <div class="play-top">
        <button class="back" id="t-quit">← 返回</button>
        <div class="pose-tabs" id="pose-tabs">
          ${POSES.map((p, i) => `<button class="ptab ${i === 0 ? "active" : ""}" data-i="${i}">${p.name}</button>`).join("")}
        </div>
      </div>
      <div class="card trainer-stage">
        <div class="cam-wrap">
          <video id="cam" playsinline muted></video>
          <canvas id="skel"></canvas>
          <div class="cam-status" id="cam-status">啟動鏡頭中…</div>
          <div class="peak-badge" id="peak-badge" hidden></div>
        </div>
        <div class="coach">
          <h2 id="pose-name"></h2>
          <p class="cue" id="pose-cue"></p>
          <div class="score-meter"><i id="score-fill"></i><span id="pass-mark" style="left:${PASS}%"></span></div>
          <div class="score-line"><span id="score-num">--</span><small id="best-num"></small></div>
          <p class="coach-hint" id="coach-hint">請站到鏡頭前，全身入鏡。</p>
          <div class="hold-row" id="hold-row" hidden><span>定格</span><span class="hold-track"><i id="hold-fill"></i></span></div>
          <p class="privacy">🔒 影像僅在本機即時處理，不會上傳。</p>
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

  function selectPose(i) {
    poseIdx = i; holdStart = 0; peak = 0;
    app.querySelectorAll(".ptab").forEach((b, k) => b.classList.toggle("active", k === i));
    const p = POSES[i];
    $("#pose-name").textContent = `${p.name}　${p.role}`;
    $("#pose-cue").textContent = p.cue;
    $("#hold-row").hidden = !p.hold;
    $("#best-num").textContent = best[p.id] ? `最佳 ${best[p.id]}` : "";
    $("#peak-badge").hidden = true;
  }
  app.querySelectorAll(".ptab").forEach((b) =>
    b.addEventListener("click", () => selectPose(Number(b.dataset.i))));
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
    $("#score-fill").style.width = `${score}%`;
    $("#score-fill").style.background = score >= PASS ? "var(--jade)" : "var(--gold)";
    $("#score-num").textContent = score;
    $("#coach-hint").textContent = hint || (score >= PASS ? "穩住！漂亮的身段。" : "調整姿勢，貼近示範。");
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
    badge.textContent = `✓ ${pose.name} 達標 ${peak}`;
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
      const pose = POSES[poseIdx];
      if (lm) {
        drawSkeleton(lm);
        const r = scorePose(lm, pose);
        if (r.ok) onResult(r.score, r.worstHint, pose);
        else { $("#coach-hint").textContent = "請讓全身（含雙臂）清楚入鏡。"; $("#score-num").textContent = "--"; $("#score-fill").style.width = "0%"; }
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
      status.innerHTML = `無法啟用鏡頭（${e.name || "錯誤"}）。<br>請允許相機權限，並用 HTTPS 開啟本頁。`;
      return;
    }
    // 2) model (on-device, downloaded once)
    status.textContent = "載入體感模型中…（首次約數秒）";
    try {
      const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP}`);
      const resolver = await vision.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP}/wasm`);
      landmarker = await vision.PoseLandmarker.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
        runningMode: "VIDEO", numPoses: 1,
      });
    } catch (e) {
      status.innerHTML = `體感模型載入失敗（需連網下載一次）。<br>${e.message || ""}`;
      return;
    }
    status.hidden = true;
    loop();
  }
  init();

  return { destroy: cleanup };
}
