// Unit tests for the from-scratch neural net. Run: node scripts/verify_nn.mjs
import { ToneNet, GlyphCNN, rng } from "../docs/js/nn.js";

let failed = 0;
const check = (name, cond) => {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name}`); failed++; }
};

const acc = (net, data, head) => {
  let hit = 0;
  for (const d of data) if (net.predict(d.x)[head].argmax === d.y[head]) hit++;
  return hit / data.length;
};

// --- XOR: the classic non-linear sanity check ---
const xor = [
  { x: new Float32Array([0, 0]), y: { a: 0 } },
  { x: new Float32Array([0, 1]), y: { a: 1 } },
  { x: new Float32Array([1, 0]), y: { a: 1 } },
  { x: new Float32Array([1, 1]), y: { a: 0 } },
];
const xnet = new ToneNet({ inDim: 2, hidden: 12, heads: { a: 2 }, seed: 7 });
let firstLoss = 0, lastLoss = 0;
for (let e = 0; e < 1200; e++) {
  const l = xnet.trainBatch(xor, 5e-3);
  if (e === 0) firstLoss = l;
  lastLoss = l;
}
check(`XOR learned (loss ${firstLoss.toFixed(2)} → ${lastLoss.toFixed(3)})`, lastLoss < 0.1 && lastLoss < firstLoss);
check("XOR accuracy 100%", acc(xnet, xor, "a") === 1);

// --- two gaussian blobs, two heads sharing a trunk ---
const rand = rng(123);
const blobs = [];
for (let i = 0; i < 300; i++) {
  const cls = i % 2;
  const cx = cls ? 0.7 : 0.3, cy = cls ? 0.3 : 0.7;
  blobs.push({
    x: new Float32Array([cx + (rand() - 0.5) * 0.25, cy + (rand() - 0.5) * 0.25]),
    y: { a: cls, b: 1 - cls },
  });
}
const train = blobs.slice(0, 240), val = blobs.slice(240);
const bnet = new ToneNet({ inDim: 2, hidden: 16, heads: { a: 2, b: 2 }, seed: 3 });
for (let e = 0; e < 40; e++)
  for (let i = 0; i < train.length; i += 16) bnet.trainBatch(train.slice(i, i + 16), 3e-3);
check(`blobs held-out acc head-a ${(acc(bnet, val, "a") * 100).toFixed(0)}% > 90%`, acc(bnet, val, "a") > 0.9);
check(`blobs held-out acc head-b ${(acc(bnet, val, "b") * 100).toFixed(0)}% > 90%`, acc(bnet, val, "b") > 0.9);

// --- serialization roundtrip preserves predictions ---
const j = bnet.toJSON();
const clone = ToneNet.fromJSON(JSON.parse(JSON.stringify(j)));
const p1 = bnet.predict(val[0].x).a.probs, p2 = clone.predict(val[0].x).a.probs;
check("serialization roundtrip preserves probs", Math.abs(p1[0] - p2[0]) < 1e-6);

// --- seeded determinism ---
const d1 = new ToneNet({ inDim: 4, hidden: 6, heads: { a: 3 }, seed: 9 });
const d2 = new ToneNet({ inDim: 4, hidden: 6, heads: { a: 3 }, seed: 9 });
check("same seed → identical init", d1.W1.every((v, i) => v === d2.W1[i]));

// --- GlyphCNN: translation invariance (the reason it exists) ---
// A 3×3 motif ("+" vs "×") placed at a RANDOM position in a 14×14 image.
// Position-sensitive models fail this; a conv net must not.
const S2 = 14, r2 = rng(77);
const PLUS = [[0, 1, 0], [1, 1, 1], [0, 1, 0]];
const CROSS = [[1, 0, 1], [0, 1, 0], [1, 0, 1]];
function motifSample() {
  const cls = r2() < 0.5 ? 0 : 1;
  const m = cls ? CROSS : PLUS;
  const x = new Float32Array(S2 * S2);
  for (let i = 0; i < x.length; i++) x[i] = r2() * 0.15; // light noise
  const r0 = 1 + Math.floor(r2() * (S2 - 5)), c0 = 1 + Math.floor(r2() * (S2 - 5));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (m[r][c]) x[(r0 + r) * S2 + c0 + c] = 1;
  return { x, y: cls };
}
const mTrain = Array.from({ length: 500 }, motifSample);
const mVal = Array.from({ length: 200 }, motifSample);
const cnn = new GlyphCNN({ size: S2, filters: 6, kernel: 3, hidden: 32, classes: 2, seed: 5 });
for (let e = 0; e < 8; e++)
  for (let i = 0; i < mTrain.length; i += 16) cnn.trainBatch(mTrain.slice(i, i + 16), 3e-3);
let cnnHit = 0;
for (const d of mVal) if (cnn.predict(d.x).argmax === d.y) cnnHit++;
const cnnAcc = cnnHit / mVal.length;
check(`CNN finds a motif at ANY position (val ${(cnnAcc * 100).toFixed(0)}% > 90%)`, cnnAcc > 0.9);

// serialization roundtrip
const cj = GlyphCNN.fromJSON(JSON.parse(JSON.stringify(cnn.toJSON())));
check("CNN serialization preserves predictions",
  Math.abs(cj.predict(mVal[0].x).probs[0] - cnn.predict(mVal[0].x).probs[0]) < 1e-6);

if (failed) { console.error(`\n${failed} nn check(s) FAILED`); process.exit(1); }
console.log("\nAll neural-net checks passed.");
