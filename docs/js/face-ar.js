// AR 尋面 — on-device opera 臉譜 try-on. Webcam → MediaPipe FaceLandmarker (468
// points) → an SVG 臉譜 is scaled/rotated onto the face every frame. The video
// never leaves the device. Ties into the 寻面 mask-unlock fantasy.
import { maskSVG } from "./masks.js";
import { MASKS } from "./levels.js";
import { t } from "./i18n.js";

const MP = "0.10.20";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// FaceMesh landmark indices.
const F = { L_EYE: 33, R_EYE: 263, L_EDGE: 234, R_EDGE: 454, TOP: 10, CHIN: 152 };

export function openFaceAR(app, onExit) {
  let landmarker = null, stream = null, raf = 0, running = true;
  const maskIds = Object.keys(MASKS);
  let currentMask = maskIds[0];
  const imgCache = {};

  function maskImage(id) {
    if (!imgCache[id]) {
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(maskSVG(id, 320));
      imgCache[id] = img;
    }
    return imgCache[id];
  }

  app.innerHTML = `
    <main class="wrap trainer">
      <div class="play-top">
        <button class="back" id="ar-quit">${t("common.back")}</button>
        <div class="pose-tabs" id="mask-tabs">
          ${maskIds.map((id, i) => `<button class="ptab ${i === 0 ? "active" : ""}" data-id="${id}">${MASKS[id].name}</button>`).join("")}
        </div>
      </div>
      <div class="card trainer-stage ar-stage">
        <div class="cam-wrap">
          <video id="cam" playsinline muted></video>
          <canvas id="ar" aria-hidden="true"></canvas>
          <div class="cam-status" id="cam-status">${t("cam.start")}</div>
          <div class="ar-hint" id="ar-hint" hidden>${t("ar.detecting")}</div>
        </div>
        <div class="coach">
          <h2 id="ar-name"></h2>
          <p class="cue" id="ar-line"></p>
          <p class="privacy">${t("privacy")}</p>
        </div>
      </div>
    </main>`;

  const $ = (s) => app.querySelector(s);
  const video = $("#cam"), canvas = $("#ar"), ctx = canvas.getContext("2d");
  const status = $("#cam-status"), hint = $("#ar-hint");

  function cleanup() {
    running = false; cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((tk) => tk.stop());
    try { landmarker?.close(); } catch { /* ignore */ }
  }
  $("#ar-quit").addEventListener("click", () => { cleanup(); onExit(); });

  function selectMask(id) {
    currentMask = id;
    app.querySelectorAll(".ptab").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
    $("#ar-name").textContent = MASKS[id].name;
    $("#ar-line").textContent = MASKS[id].line;
  }
  app.querySelectorAll(".ptab").forEach((b) => b.addEventListener("click", () => selectMask(b.dataset.id)));
  selectMask(currentMask);

  function drawMask(lm) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = ((lm[F.L_EDGE].x + lm[F.R_EDGE].x) / 2) * w;
    const cy = ((lm[F.TOP].y + lm[F.CHIN].y) / 2) * h;
    const faceW = Math.hypot((lm[F.R_EDGE].x - lm[F.L_EDGE].x) * w, (lm[F.R_EDGE].y - lm[F.L_EDGE].y) * h);
    const roll = Math.atan2(lm[F.R_EYE].y - lm[F.L_EYE].y, lm[F.R_EYE].x - lm[F.L_EYE].x);
    const mw = faceW * 1.7, mh = mw * 1.22;
    const img = maskImage(currentMask);
    if (!img.complete || !img.naturalWidth) return;
    ctx.save();
    ctx.translate(cx, cy - mh * 0.06);
    ctx.rotate(roll);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(img, -mw / 2, -mh / 2, mw, mh);
    ctx.restore();
  }

  function loop() {
    if (!running) return;
    if (video.readyState >= 2 && landmarker) {
      canvas.width = video.videoWidth || canvas.clientWidth;
      canvas.height = video.videoHeight || canvas.clientHeight;
      let res;
      try { res = landmarker.detectForVideo(video, performance.now()); } catch { /* skip */ }
      const lm = res?.faceLandmarks?.[0];
      if (lm) { hint.hidden = true; drawMask(lm); }
      else { hint.hidden = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
    raf = requestAnimationFrame(loop);
  }

  async function init() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
      video.srcObject = stream; await video.play();
    } catch (e) {
      status.innerHTML = t("cam.denied", { err: e.name || "error" }); return;
    }
    status.textContent = t("cam.model");
    try {
      const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP}`);
      const resolver = await vision.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP}/wasm`);
      landmarker = await vision.FaceLandmarker.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
        runningMode: "VIDEO", numFaces: 1,
      });
    } catch (e) {
      status.innerHTML = t("cam.modelfail", { msg: e.message || "" }); return;
    }
    status.hidden = true; hint.hidden = false;
    loop();
  }
  init();

  return { destroy: cleanup };
}
