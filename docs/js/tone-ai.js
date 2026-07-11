// 見字知韻 — the rime-AI pipeline. The 20,865-character Jyutping dictionary
// becomes a supervised dataset (24×24 glyph → one of the 16 largest rhyme
// families), and a hand-written convolutional network trains live in the
// browser to predict what a NEVER-SEEN character rhymes with.
//
// Findings baked into this design (all measured in-browser):
//  · raw-pixel MLPs fail — phonetic components move around, so conv is needed;
//  · TONE is the wrong target: a phonetic series (媽麻馬…) keeps its RIME but
//    scrambles its tone. Rime prediction reaches ~2.6× the majority baseline.
import { BUNDLED } from "./jyutping-data.js";
import { groupOf } from "./prosody.js";
import { GlyphCNN, rng } from "./nn.js";

export const GLYPH = 24;
export const N_GROUPS = 16;
const MODEL_KEY = "cantomesh.rimenet.v1";
const SEED = 20250711;

// ---- glyph rasterizer (browser only) ----
let _cv = null, _cx = null;
export function glyphTensor(ch) {
  if (!_cv) {
    _cv = document.createElement("canvas");
    _cv.width = GLYPH; _cv.height = GLYPH;
    _cx = _cv.getContext("2d", { willReadFrequently: true });
  }
  _cx.fillStyle = "#fff"; _cx.fillRect(0, 0, GLYPH, GLYPH);
  _cx.fillStyle = "#000";
  _cx.font = `${GLYPH - 3}px "Noto Serif TC", serif`;
  _cx.textAlign = "center"; _cx.textBaseline = "middle";
  _cx.fillText(ch, GLYPH / 2, GLYPH / 2 + 1);
  const d = _cx.getImageData(0, 0, GLYPH, GLYPH).data;
  const x = new Float32Array(GLYPH * GLYPH);
  for (let i = 0; i < x.length; i++) x[i] = 1 - d[i * 4] / 255;
  return x;
}

// The 16 largest rhyme families (deterministic over the whole dictionary),
// each with three common exemplar characters for the playground.
export function rimeGroups() {
  const freq = {}, sample = {};
  for (const ch of Object.keys(BUNDLED)) {
    const g = groupOf(BUNDLED[ch]);
    freq[g] = (freq[g] || 0) + 1;
    if (!sample[g]) sample[g] = [];
    if (sample[g].length < 3) sample[g].push(ch);
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, N_GROUPS).map((x) => x[0]);
  return { groups: top, index: Object.fromEntries(top.map((g, i) => [g, i])), exemplars: sample };
}

export function buildDataset({ scan = 12000, valFrac = 0.1 } = {}) {
  const { groups, index, exemplars } = rimeGroups();
  const chars = Object.keys(BUNDLED);
  const rand = rng(SEED);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)); [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const data = [];
  for (const ch of chars.slice(0, scan)) {
    const gi = index[groupOf(BUNDLED[ch])];
    if (gi == null) continue;
    data.push({ ch, x: glyphTensor(ch), y: gi });
  }
  const nVal = Math.max(80, Math.floor(data.length * valFrac));
  return { train: data.slice(nVal), val: data.slice(0, nVal), groups, index, exemplars };
}

export function baseline(data) {
  const cnt = new Array(N_GROUPS).fill(0);
  for (const d of data) cnt[d.y]++;
  return Math.max(...cnt) / data.length;
}

export function evaluate(net, data) {
  let hit = 0;
  for (const d of data) if (net.predict(d.x).argmax === d.y) hit++;
  return hit / data.length;
}

// Unthrottled micro-yield (setTimeout is clamped to ~1s in background tabs).
const _mc = typeof MessageChannel !== "undefined" ? new MessageChannel() : null;
function microYield() {
  if (!_mc) return Promise.resolve();
  return new Promise((r) => { _mc.port1.onmessage = () => r(); _mc.port2.postMessage(0); });
}

export async function trainLive(net, ds, { epochs = 8, batch = 16, onProgress } = {}) {
  const { train, val } = ds;
  const history = [];
  let step = 0;
  const totalSteps = epochs * Math.ceil(train.length / batch);
  for (let e = 0; e < epochs; e++) {
    const lr = e < epochs * 0.6 ? 3e-3 : 1e-3;
    for (let i = 0; i < train.length; i += batch) {
      const loss = net.trainBatch(train.slice(i, i + batch), lr);
      step++;
      if (step % 10 === 0) {
        history.push({ step, loss });
        onProgress?.({ step, totalSteps, epoch: e + 1, epochs, loss, history });
        await microYield();
      }
    }
    const acc = evaluate(net, val.slice(0, 300));
    history.push({ step, loss: null, valRime: acc });
    onProgress?.({ step, totalSteps, epoch: e + 1, epochs, valRime: acc, history });
    await microYield();
  }
  return evaluate(net, val);
}

export function newNet(seed = 42) {
  return new GlyphCNN({ size: GLYPH, filters: 10, kernel: 5, hidden: 96, classes: N_GROUPS, seed });
}
export const PARAM_COUNT = (() => {
  const n = { F: 10, K: 5, hidden: 96, classes: N_GROUPS, P: 10 };
  return n.F * n.K * n.K + n.F + n.F * n.P * n.P * n.hidden + n.hidden + n.hidden * n.classes + n.classes;
})();

export function predictChar(net, ch, meta) {
  const out = net.predict(glyphTensor(ch));
  const trueGroup = BUNDLED[ch] ? groupOf(BUNDLED[ch]) : null;
  return {
    out,
    predGroup: meta.groups[out.argmax],
    partners: (meta.exemplars[meta.groups[out.argmax]] || []).filter((c) => c !== ch),
    trueGroup,
    inTask: trueGroup != null && meta.index[trueGroup] != null,
    jp: BUNDLED[ch] || null,
  };
}

// One co-learning quiz round: n held-out characters, each with 4 options
// (the true rhyme family + 3 distractors). Human and AI answer the same round.
export function quizRound(valSamples, nGroups = N_GROUPS, n = 5, rand = Math.random) {
  const pool = [...valSamples];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((s) => {
    const opts = new Set([s.y]);
    while (opts.size < 4) opts.add(Math.floor(rand() * nGroups));
    const options = [...opts];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1)); [options[i], options[j]] = [options[j], options[i]];
    }
    return { ch: s.ch, x: s.x, answer: s.y, options };
  });
}

export function saveModel(net, meta) {
  try { localStorage.setItem(MODEL_KEY, JSON.stringify({ meta, net: net.toJSON() })); } catch { /* quota */ }
}
export function loadModel() {
  try {
    const j = JSON.parse(localStorage.getItem(MODEL_KEY));
    return j ? { meta: j.meta, net: GlyphCNN.fromJSON(j.net) } : null;
  } catch { return null; }
}

// Pre-trained weights shipped with the site — first-time visitors get a working
// model instantly; training in the Lab stays as the live demonstration.
export async function loadPretrained() {
  try {
    const res = await fetch("models/rimenet.json", { cache: "force-cache" });
    if (!res.ok) return null;
    const j = await res.json();
    return { meta: j.meta || {}, net: GlyphCNN.fromJSON(j.net) };
  } catch { return null; }
}
