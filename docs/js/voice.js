// 子喉變聲 — mic → on-device granular pitch shifter (AudioWorklet) → the high
// falsetto register of a Cantonese-opera 花旦. Audio never leaves the device.
// The worklet is inlined via a Blob URL so the static site needs no extra file.
import { t } from "./i18n.js";

// Two-tap granular pitch shifter with Hann-window crossfade.
const WORKLET = `
class CantoShifter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "ratio", defaultValue: 1.4, minValue: 1.0, maxValue: 3.0 },
      { name: "vibHz", defaultValue: 5.5, minValue: 0, maxValue: 8 },
      { name: "vibDepth", defaultValue: 0, minValue: 0, maxValue: 0.8 }, // semitones
    ];
  }
  constructor() {
    super();
    this.N = 8192; this.buf = new Float32Array(this.N);
    this.w = 0; this.tc = 0; this.G = 2048; this.ph = 0;
    this.taps = [{ start: 0, prev: 0 }, { start: 0, prev: 0.5 }];
  }
  process(inputs, outputs, params) {
    const inp = inputs[0][0], outL = outputs[0][0], outR = outputs[0][1];
    if (!inp || !outL) return true;
    // operatic vibrato: modulate the pitch ratio a few cents around the target
    this.ph += (inp.length / sampleRate) * params.vibHz[0] * 2 * Math.PI;
    const ratio = params.ratio[0] * Math.pow(2, (params.vibDepth[0] * Math.sin(this.ph)) / 12);
    const G = this.G, N = this.N;
    for (let i = 0; i < inp.length; i++) {
      this.buf[this.w % N] = inp[i];
      let s = 0;
      for (let k = 0; k < 2; k++) {
        const tap = this.taps[k];
        const p = ((this.tc / G) + k * 0.5) % 1;
        if (p < tap.prev) tap.start = this.w - G * ratio - 2; // new grain: snapshot behind write head
        tap.prev = p;
        const r = tap.start + p * G * ratio;
        const r0 = Math.floor(r), fr = r - r0;
        const a = this.buf[((r0 % N) + N) % N], b = this.buf[(((r0 + 1) % N) + N) % N];
        const win = 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
        s += (a + (b - a) * fr) * win;
      }
      outL[i] = s;
      if (outR) outR[i] = s;
      this.w++; this.tc++;
    }
    return true;
  }
}
registerProcessor("canto-shifter", CantoShifter);`;

// Small stage-hall impulse for a touch of 戲棚 space.
function makeImpulse(ctx, seconds = 1.1, decay = 3.5) {
  const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export function openVoice(app, onExit) {
  let ctx = null, stream = null, node = null, analyser = null, raf = 0, on = false;

  app.innerHTML = `<main class="wrap heritage voice">
    <div class="play-top">
      <button class="back" id="v-quit">${t("common.back")}</button>
      <span class="odsource">Web Audio · on-device</span>
    </div>
    <div class="card center">
      <h2 class="g-title">${t("voice.title")}</h2>
      <p class="hint">${t("voice.sub")}</p>
      <canvas id="v-meter" width="260" height="14" aria-hidden="true"></canvas>
      <div class="controls" style="justify-content:center">
        <button class="primary" id="v-toggle">${t("voice.start")}</button>
      </div>
      <div class="v-presets">
        <button class="m-label" data-st="4" data-vib="0.15">${t("voice.p1")}</button>
        <button class="m-label sel" data-st="9" data-vib="0.30">${t("voice.p2")}</button>
        <button class="m-label" data-st="13" data-vib="0.38">${t("voice.p3")}</button>
      </div>
      <label class="v-slider">${t("voice.pitch")} <b id="v-st">+9</b>
        <input id="v-pitch" type="range" min="2" max="14" step="1" value="9" />
      </label>
      <p class="note" style="text-align:left">${t("voice.headphones")}</p>
      <p class="privacy">${t("privacy")}</p>
      <p class="hint" id="v-status"></p>
    </div></main>`;

  const $ = (s) => app.querySelector(s);
  const meter = $("#v-meter"), mctx = meter.getContext("2d");

  function drawMeter() {
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
    mctx.clearRect(0, 0, 260, 14);
    mctx.fillStyle = peak > 0.6 ? "#b23a2e" : "#3a6a5a";
    mctx.fillRect(0, 0, 260 * Math.min(1, peak * 1.6), 14);
    raf = requestAnimationFrame(drawMeter);
  }

  const stToRatio = (st) => Math.pow(2, st / 12);

  async function start() {
    if (!window.AudioWorkletNode) { $("#v-status").textContent = t("voice.unsupported"); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }, video: false,
      });
    } catch (e) { $("#v-status").innerHTML = t("mic.denied", { err: e.name || "error" }); return; }
    ctx = new AudioContext();
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
    const src = ctx.createMediaStreamSource(stream);
    node = new AudioWorkletNode(ctx, "canto-shifter", { outputChannelCount: [2] });
    node.parameters.get("ratio").value = stToRatio(Number($("#v-pitch").value));
    node.parameters.get("vibDepth").value = 0.3;
    // stage voicing: brightness + presence (the "ring" of an opera voice),
    // gentle compression for loudness, then dry + 戲棚 reverb
    const bright = ctx.createBiquadFilter();
    bright.type = "highshelf"; bright.frequency.value = 1800; bright.gain.value = 6;
    const presence = ctx.createBiquadFilter();
    presence.type = "peaking"; presence.frequency.value = 3300; presence.Q.value = 1.1; presence.gain.value = 4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
    const dry = ctx.createGain(); dry.gain.value = 0.9;
    const wet = ctx.createGain(); wet.gain.value = 0.26;
    const verb = ctx.createConvolver(); verb.buffer = makeImpulse(ctx);
    analyser = ctx.createAnalyser(); analyser.fftSize = 512;
    src.connect(node);
    node.connect(bright).connect(presence).connect(comp);
    comp.connect(dry).connect(ctx.destination);
    comp.connect(verb).connect(wet).connect(ctx.destination);
    comp.connect(analyser);
    on = true;
    $("#v-toggle").textContent = t("voice.stop");
    $("#v-status").textContent = t("voice.live");
    drawMeter();
  }
  function stop() {
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((tk) => tk.stop());
    try { ctx?.close(); } catch { /* ignore */ }
    ctx = null; node = null; analyser = null; on = false;
    mctx.clearRect(0, 0, 260, 14);
    $("#v-toggle").textContent = t("voice.start");
    $("#v-status").textContent = "";
  }

  $("#v-toggle").addEventListener("click", () => (on ? stop() : start()));
  $("#v-pitch").addEventListener("input", (e) => {
    $("#v-st").textContent = `+${e.target.value}`;
    node?.parameters.get("ratio").setValueAtTime(stToRatio(Number(e.target.value)), ctx.currentTime);
  });
  app.querySelectorAll(".v-presets .m-label").forEach((b) => b.addEventListener("click", () => {
    app.querySelectorAll(".v-presets .m-label").forEach((x) => x.classList.toggle("sel", x === b));
    const st = Number(b.dataset.st), vib = Number(b.dataset.vib);
    $("#v-pitch").value = st; $("#v-st").textContent = `+${st}`;
    if (node && ctx) {
      node.parameters.get("ratio").setValueAtTime(stToRatio(st), ctx.currentTime);
      node.parameters.get("vibDepth").setValueAtTime(vib, ctx.currentTime);
    }
  }));
  $("#v-quit").addEventListener("click", () => { stop(); onExit(); });

  return { destroy: stop };
}
