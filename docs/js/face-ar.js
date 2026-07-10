// AR 尋面 — reads your facial geometry (on-device MediaPipe FaceLandmarker) and
// generates a UNIQUE opera 臉譜 from it, then tracks it onto your face. Every
// face yields a different mask + 行當 reading. Video never leaves the device.
import { t, getLang } from "./i18n.js";
import {
  faceMetrics, generateMask, randomParams, PRESETS, maskFromLandmarks,
  crownSVG, mouthOpenRatio,
} from "./mask-gen.js";

const MP = "0.10.20";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const F = { L_EYE: 33, R_EYE: 263, L_EDGE: 234, R_EDGE: 454, TOP: 10, CHIN: 152 };

export function openFaceAR(app, onExit) {
  let landmarker = null, stream = null, raf = 0, running = true;
  let metrics = null, lastLm = null, params = null, maskImg = null, crownImg = null;
  let frames = 0, autoGen = false, lostFrames = 0;
  // spectacle state: feather/earring spring physics, particles, mouth trigger
  const sway = { a: 0, v: 0 }, ear = { a: 0, v: 0 };
  let prevRoll = 0, mouthWas = false, hasBurst = false;
  const sparks = [], petals = [];

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
            <button class="ghost" id="snap" hidden>${t("ar.photo")}</button>
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
    fit = fromFace ? 1.12 : 1.7;
    maskImg = new Image();
    maskImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    crownImg = new Image();
    crownImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(crownSVG(p, 300));
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
  $("#snap").addEventListener("click", snapshot);

  // traditional preset gallery — pick a classic mask instead of generating one
  $("#preset-row").innerHTML = PRESETS.map((pr) =>
    `<button class="preset-thumb" data-id="${pr.id}" title="${lang === "en" ? pr.en : pr.zh}">${generateMask(pr.params, 52)}</button>`).join("");
  app.querySelectorAll(".preset-thumb").forEach((b) => b.addEventListener("click", () => {
    const pr = PRESETS.find((x) => x.id === b.dataset.id);
    autoGen = true;
    applySvg(generateMask(pr.params, 300), pr.params, lang === "en" ? pr.en : pr.zh, "", false);
  }));

  const GOLD = "216,178,90", SEAL = "178,58,46";

  function drawStage(w, h) {
    // red curtain edges + top swag + vignette → screenshots look designed
    for (const side of [0, 1]) {
      const g = ctx.createLinearGradient(side ? w : 0, 0, side ? w - w * 0.1 : w * 0.1, 0);
      g.addColorStop(0, `rgba(${SEAL},0.5)`); g.addColorStop(1, `rgba(${SEAL},0)`);
      ctx.fillStyle = g; ctx.fillRect(side ? w * 0.9 : 0, 0, w * 0.1, h);
    }
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.12);
    top.addColorStop(0, `rgba(${SEAL},0.55)`); top.addColorStop(1, `rgba(${SEAL},0)`);
    ctx.fillStyle = top;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0);
    for (let i = 6; i >= 0; i--) ctx.quadraticCurveTo(w * (i + 0.5) / 7, h * 0.10, w * i / 7, h * 0.045);
    ctx.closePath(); ctx.fill();
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.42, w / 2, h / 2, h * 0.85);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(20,12,8,0.32)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  function feather(x, y, len, baseAng, bend, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(baseAng);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.35, -len * 0.55 + bend * 0.4, bend, -len);
    ctx.lineWidth = 5; ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.stroke();
    for (let i = 1; i <= 4; i++) { // barb dots up the quill
      const p = i / 4.6;
      ctx.beginPath();
      ctx.arc(bend * p * p + len * 0.30 * p * (1 - p) * 2, -len * p, 3.4 - i * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? `rgba(${GOLD},0.95)` : color; ctx.fill();
    }
    ctx.restore();
  }

  function drawScene(lm) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    drawStage(w, h);
    if (!maskImg || !maskImg.complete || !maskImg.naturalWidth) return;
    const cx = ((lm[F.L_EDGE].x + lm[F.R_EDGE].x) / 2) * w;
    const cy = ((lm[F.TOP].y + lm[F.CHIN].y) / 2) * h;
    const faceW = Math.hypot((lm[F.R_EDGE].x - lm[F.L_EDGE].x) * w, (lm[F.R_EDGE].y - lm[F.L_EDGE].y) * h);
    const roll = Math.atan2(lm[F.R_EYE].y - lm[F.L_EYE].y, lm[F.R_EYE].x - lm[F.L_EYE].x);
    const mw = faceW * fit, mh = mw * 1.22;

    // spring physics: feathers lag the head, earrings pendulum toward gravity
    const rollV = roll - prevRoll; prevRoll = roll;
    sway.v += (-roll * 0.5 - sway.a) * 0.12 - rollV * 3.2; sway.v *= 0.86; sway.a += sway.v;
    ear.v += (-roll * 1.2 - ear.a) * 0.09; ear.v *= 0.90; ear.a += ear.v;

    ctx.save();
    ctx.translate(cx, cy - mh * 0.02); ctx.rotate(roll);
    const crownY = -mh * 0.5 - mw * 0.16;
    // 翎子 feathers behind the crown, whipping with sway
    const fcol = `rgba(47,111,95,0.95)`;
    feather(-mw * 0.34, crownY + mw * 0.12, mw * 0.72, -0.5, sway.a * 90 - 10, fcol);
    feather(mw * 0.34, crownY + mw * 0.12, mw * 0.72, 0.5, sway.a * 90 + 10, fcol);
    // mask + crown
    ctx.globalAlpha = 0.92;
    ctx.drawImage(maskImg, -mw / 2, -mh / 2, mw, mh);
    if (crownImg?.complete && crownImg.naturalWidth) {
      ctx.globalAlpha = 1;
      ctx.drawImage(crownImg, -mw * 0.62, crownY - mw * 0.28, mw * 1.24, mw * 0.62);
    }
    // swinging earrings at the jaw
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * mw * 0.44, mh * 0.16); ctx.rotate(ear.a);
      ctx.strokeStyle = `rgba(${GOLD},0.95)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, mw * 0.10); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, mw * 0.13, mw * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${SEAL},0.95)`; ctx.fill();
      ctx.strokeStyle = `rgba(${GOLD},0.9)`; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // ambient gold sparkles around the face
    if (sparks.length < 26 && Math.random() < 0.5) {
      const a = Math.random() * Math.PI * 2;
      sparks.push({ x: cx + Math.cos(a) * mw * (0.55 + Math.random() * 0.25), y: cy + Math.sin(a) * mh * 0.5, l: 1, r: 1.4 + Math.random() * 2.2 });
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.y -= 0.7; s.l -= 0.016;
      ctx.globalAlpha = Math.max(0, s.l) * 0.9;
      ctx.fillStyle = `rgb(${GOLD})`;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.r * 2); ctx.lineTo(s.x + s.r * 0.7, s.y); ctx.lineTo(s.x, s.y + s.r * 2); ctx.lineTo(s.x - s.r * 0.7, s.y);
      ctx.closePath(); ctx.fill();
      if (s.l <= 0) sparks.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    // open your mouth → petal burst 🎉
    const open = mouthOpenRatio(lm) > 0.09;
    if (open && !mouthWas) {
      hasBurst = true;
      for (let i = 0; i < 16; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const sp = 3 + Math.random() * 5;
        petals.push({ x: cx, y: cy + mh * 0.2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, l: 1, gold: Math.random() < 0.35 });
      }
    }
    mouthWas = open;
    for (let i = petals.length - 1; i >= 0; i--) {
      const p2 = petals[i];
      p2.x += p2.vx; p2.y += p2.vy; p2.vy += 0.12; p2.vx *= 0.99; p2.r += p2.vr; p2.l -= 0.012;
      ctx.save(); ctx.translate(p2.x, p2.y); ctx.rotate(p2.r);
      ctx.globalAlpha = Math.max(0, p2.l) * 0.9;
      ctx.fillStyle = p2.gold ? `rgb(${GOLD})` : `rgb(${SEAL})`;
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (p2.l <= 0) petals.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  // designed, downloadable photo card — the shareable moment
  function snapshot() {
    const w = video.videoWidth, h = video.videoHeight;
    if (!w) return;
    const out = document.createElement("canvas");
    const band = Math.round(h * 0.16);
    out.width = w; out.height = h + band;
    const o = out.getContext("2d");
    o.save(); o.translate(w, 0); o.scale(-1, 1); // selfie orientation, as seen
    o.drawImage(video, 0, 0, w, h); o.drawImage(canvas, 0, 0, w, h);
    o.restore();
    o.fillStyle = "#1c1610"; o.fillRect(0, h, w, band);
    o.strokeStyle = "#d8b25a"; o.lineWidth = 4; o.strokeRect(8, 8, w - 16, h + band - 16);
    o.fillStyle = "#b23a2e"; o.fillRect(w - band * 0.9, h + band * 0.18, band * 0.64, band * 0.64);
    o.fillStyle = "#f4efe6";
    o.font = `${band * 0.42}px "Noto Serif TC", serif`; o.textBaseline = "middle";
    o.fillText($("#ar-arch").textContent, band * 0.35, h + band * 0.42);
    o.font = `${band * 0.2}px "Noto Serif TC", serif`; o.fillStyle = "#d8b25a";
    o.fillText("梨園闖關 · CANTOMESH", band * 0.35, h + band * 0.76);
    o.font = `${band * 0.4}px "Noto Serif TC", serif`; o.fillStyle = "#f4efe6";
    o.fillText("粵", w - band * 0.74, h + band * 0.52);
    const a = document.createElement("a");
    a.download = "cantomesh-lianpu.png";
    a.href = out.toDataURL("image/png");
    a.click();
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
        // tease the mouth-open surprise until they discover it
        if (hasBurst) { hint.hidden = true; }
        else { hint.textContent = t("ar.openmouth"); hint.hidden = false; }
        lastLm = lm;
        metrics = faceMetrics(lm);
        // auto-generate once stable, and RE-generate when a new face appears
        // (lost for >1s then found again → likely a different person).
        if ((!autoGen && ++frames > 20) || lostFrames > 30) genFromFace();
        lostFrames = 0;
        drawScene(lm);
      } else {
        lostFrames++;
        hint.textContent = t("ar.detecting");
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
    $("#snap").hidden = false;
    loop();
  }
  init();

  return { destroy: cleanup };
}
