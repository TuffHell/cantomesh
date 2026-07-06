// AR 尋面 — reads your facial geometry (on-device MediaPipe FaceLandmarker) and
// generates a UNIQUE opera 臉譜 from it, then tracks it onto your face. Every
// face yields a different mask + 行當 reading. Video never leaves the device.
import { t, getLang } from "./i18n.js";
import { faceMetrics, generateMask, randomParams, PRESETS, maskFromLandmarks } from "./mask-gen.js";

const MP = "0.10.20";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const F = { L_EYE: 33, R_EYE: 263, L_EDGE: 234, R_EDGE: 454, TOP: 10, CHIN: 152 };

export function openFaceAR(app, onExit) {
  let landmarker = null, stream = null, raf = 0, running = true;
  let metrics = null, lastLm = null, params = null, maskImg = null, frames = 0, autoGen = false, lostFrames = 0;

  app.innerHTML = `
    <main class="wrap trainer">
      <div class="play-top">
        <button class="back" id="ar-quit">${t("common.back")}</button>
        <span class="odsource">MediaPipe FaceMesh · on-device</span>
      </div>
      <div class="card trainer-stage ar-stage">
        <div class="cam-wrap">
          <video id="cam" playsinline muted></video>
          <canvas id="ar" aria-hidden="true"></canvas>
          <div class="cam-status" id="cam-status">${t("cam.start")}</div>
          <div class="ar-hint" id="ar-hint" hidden>${t("ar.analyzing")}</div>
        </div>
        <div class="coach">
          <h2 id="ar-arch">${t("ar.yourmask")}</h2>
          <div class="mask-preview" id="mask-preview"></div>
          <p class="hint" id="ar-from"></p>
          <p class="cue" id="ar-trait"></p>
          <div class="controls">
            <button class="primary" id="gen-mask">${t("ar.generate")}</button>
            <button class="ghost" id="regen-mask" hidden>${t("ar.regen")}</button>
          </div>
          <p class="preset-label">${t("ar.presets")}</p>
          <div class="preset-row" id="preset-row"></div>
          <p class="privacy">${t("privacy")}</p>
        </div>
      </div>
    </main>`;

  const $ = (s) => app.querySelector(s);
  const video = $("#cam"), canvas = $("#ar"), ctx = canvas.getContext("2d");
  const status = $("#cam-status"), hint = $("#ar-hint");
  const lang = getLang();

  function cleanup() {
    running = false; cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((tk) => tk.stop());
    try { landmarker?.close(); } catch { /* ignore */ }
  }
  $("#ar-quit").addEventListener("click", () => { cleanup(); onExit(); });

  let fit = 1.7; // overlay width ÷ face width (portrait masks hug the real face)
  function applySvg(svg, p, name, trait, fromFace) {
    params = p;
    fit = fromFace ? 1.22 : 1.7;
    maskImg = new Image();
    maskImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    $("#mask-preview").innerHTML = svg;
    $("#ar-arch").textContent = name || (lang === "en" ? p.archetype.en : p.archetype.zh);
    $("#ar-trait").textContent = trait != null ? trait : (lang === "en" ? p.archetype.trait_en : p.archetype.trait_zh);
    $("#ar-from").textContent = fromFace ? t("ar.fromface") : "";
    $("#regen-mask").hidden = false;
  }
  // Portrait generation: the mask is painted FROM the live landmarks — the
  // silhouette is their jaw, sockets sit on their eyes, brows follow their
  // arch. A fresh salt each call varies the paint, never the identity.
  function genFromFace() {
    autoGen = true;
    const salt = 1 + Math.floor(Math.random() * 1e6);
    if (lastLm) {
      const { svg, params: p } = maskFromLandmarks(lastLm, salt, 300);
      applySvg(svg, p, null, null, true);
    } else {
      const p = randomParams();
      applySvg(generateMask(p, 300), p, null, null, false);
    }
  }

  $("#gen-mask").addEventListener("click", genFromFace);
  $("#regen-mask").addEventListener("click", genFromFace);

  // traditional preset gallery — pick a classic mask instead of generating one
  $("#preset-row").innerHTML = PRESETS.map((pr) =>
    `<button class="preset-thumb" data-id="${pr.id}" title="${lang === "en" ? pr.en : pr.zh}">${generateMask(pr.params, 52)}</button>`).join("");
  app.querySelectorAll(".preset-thumb").forEach((b) => b.addEventListener("click", () => {
    const pr = PRESETS.find((x) => x.id === b.dataset.id);
    autoGen = true;
    applySvg(generateMask(pr.params, 300), pr.params, lang === "en" ? pr.en : pr.zh, "", false);
  }));

  function drawMask(lm) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!maskImg || !maskImg.complete || !maskImg.naturalWidth) return;
    const cx = ((lm[F.L_EDGE].x + lm[F.R_EDGE].x) / 2) * w;
    const cy = ((lm[F.TOP].y + lm[F.CHIN].y) / 2) * h;
    const faceW = Math.hypot((lm[F.R_EDGE].x - lm[F.L_EDGE].x) * w, (lm[F.R_EDGE].y - lm[F.L_EDGE].y) * h);
    const roll = Math.atan2(lm[F.R_EYE].y - lm[F.L_EYE].y, lm[F.R_EYE].x - lm[F.L_EYE].x);
    const mw = faceW * fit, mh = mw * 1.22;
    ctx.save();
    ctx.translate(cx, cy - mh * 0.06); ctx.rotate(roll); ctx.globalAlpha = 0.92;
    ctx.drawImage(maskImg, -mw / 2, -mh / 2, mw, mh);
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
      if (lm) {
        hint.hidden = true;
        lastLm = lm;
        metrics = faceMetrics(lm);
        // auto-generate once stable, and RE-generate when a new face appears
        // (lost for >1s then found again → likely a different person).
        if ((!autoGen && ++frames > 20) || lostFrames > 30) genFromFace();
        lostFrames = 0;
        drawMask(lm);
      } else {
        lostFrames++;
        hint.hidden = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    raf = requestAnimationFrame(loop);
  }

  async function init() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
      video.srcObject = stream; await video.play();
    } catch (e) { status.innerHTML = t("cam.denied", { err: e.name || "error" }); return; }
    status.textContent = t("cam.model");
    try {
      const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP}`);
      const resolver = await vision.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP}/wasm`);
      landmarker = await vision.FaceLandmarker.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
        runningMode: "VIDEO", numFaces: 1,
      });
    } catch (e) { status.innerHTML = t("cam.modelfail", { msg: e.message || "" }); return; }
    status.hidden = true; hint.hidden = false;
    loop();
  }
  init();

  return { destroy: cleanup };
}
