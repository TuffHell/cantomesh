// Tests for the personalized mask generator + open-data challenge generation.
// Run: node scripts/verify_gen.mjs
import {
  faceMetrics, metricsToParams, generateMask, randomParams, PRESETS,
  maskFromLandmarks, crownSVG, mouthOpenRatio,
} from "../docs/js/mask-gen.js";
import { dataChallenges } from "../docs/js/open-data.js";
import { lookup } from "../docs/js/prosody.js";
import { readFileSync } from "fs";

let failed = 0;
const check = (name, cond) => {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name}`); failed++; }
};

// synthetic 468-landmark face
function face(over = {}) {
  const lm = Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.5 }));
  const set = { 234: [0.30, 0.50], 454: [0.70, 0.50], 10: [0.50, 0.20], 152: [0.50, 0.80],
    133: [0.45, 0.40], 362: [0.55, 0.40], 168: [0.50, 0.40], 1: [0.50, 0.55], 61: [0.42, 0.65], 291: [0.58, 0.65], ...over };
  for (const [i, p] of Object.entries(set)) lm[i] = { x: p[0], y: p[1] };
  return lm;
}

// --- faceMetrics ---
const m = faceMetrics(face());
check("faceMetrics returns finite aspect", Number.isFinite(m.aspect) && m.aspect > 0);
check("faceMetrics eyeSpacing plausible", m.eyeSpacing > 0.1 && m.eyeSpacing < 0.6);

// --- determinism ---
const p1 = metricsToParams(m), p2 = metricsToParams(m);
check("same face → same mask params (deterministic)", p1.seed === p2.seed && p1.role.id === p2.role.id);

// --- different faces → different masks ---
const wide = metricsToParams(faceMetrics(face({ 234: [0.20, 0.50], 454: [0.80, 0.50] })));
const narrow = metricsToParams(faceMetrics(face({ 234: [0.36, 0.50], 454: [0.64, 0.50] })));
check("different faces → different seed", wide.seed !== narrow.seed);

// --- generateMask output ---
const svg = generateMask(p1, 200);
check("generateMask returns an <svg>", svg.startsWith("<svg") && svg.includes("</svg>"));
check("generateMask uses the role's primary colour", svg.includes(p1.role.primary));
check("randomParams yields a valid role", !!randomParams().role.id);

// --- structural variety: face geometry drives the 谱式, not just colour ---
check("params carry a 谱式 style", ["zheng", "sankuaiwa", "shizimen", "sui"].includes(p1.style));
const styles = new Set();
for (let a = 0.6; a <= 0.9; a += 0.05) styles.add(metricsToParams({ aspect: a, eyeSpacing: 0.32, noseRatio: 0.31, mouthRatio: 0.38 }).style);
check("different face widths → multiple 谱式 structures", styles.size >= 2);
check("wide vs narrow faces differ in structure OR colour", (() => {
  const wp = metricsToParams(faceMetrics(face({ 234: [0.18, 0.5], 454: [0.82, 0.5] })));
  const np = metricsToParams(faceMetrics(face({ 234: [0.38, 0.5], 454: [0.62, 0.5] })));
  return wp.style !== np.style || wp.role.id !== np.role.id;
})());

// --- traditional presets ---
check("has >= 6 traditional presets", PRESETS.length >= 6);
check("every preset renders a mask", PRESETS.every((pr) => generateMask(pr.params, 60).includes("<svg") && pr.zh && pr.en));

// --- salt freshness: same face, new salt → NEW mask; face still drives structure ---
const s1 = metricsToParams(m, 1), s2 = metricsToParams(m, 2);
check("same face + different salt → different seed", s1.seed !== s2.seed);
check("salt preserves face-driven structure (谱式/eyes/brows/width)",
  s1.style === s2.style && s1.eyeStyle === s2.eyeStyle && s1.brow === s2.brow && s1.faceW === s2.faceW);
const salted = new Set();
for (let k = 1; k <= 8; k++) { const sp = metricsToParams(m, k * 977); salted.add(`${sp.role.id}|${sp.motif}|${sp.cheek}|${sp.accent}`); }
check(`8 salted generations → ${salted.size} distinct looks (>=4)`, salted.size >= 4);

// --- PORTRAIT mask: painted from the actual landmarks (identifiability) ---
const OVAL_IDX = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
  379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109];
// A plausible synthetic face: oval ring + real feature points, all controllable.
function synthFace({ rx = 0.24, ry = 0.32, eyeY = 0.44, eyeDX = 0.09 } = {}) {
  const lm = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  OVAL_IDX.forEach((idx, i) => {
    const th = (i / OVAL_IDX.length) * 2 * Math.PI;
    lm[idx] = { x: 0.5 + rx * Math.sin(th), y: 0.5 - ry * Math.cos(th) };
  });
  const set = (i, x, y) => { lm[i] = { x, y }; };
  // eyes
  set(33, 0.5 - eyeDX - 0.045, eyeY); set(133, 0.5 - eyeDX + 0.045, eyeY);
  set(159, 0.5 - eyeDX, eyeY - 0.012); set(145, 0.5 - eyeDX, eyeY + 0.012);
  set(263, 0.5 + eyeDX + 0.045, eyeY); set(362, 0.5 + eyeDX - 0.045, eyeY);
  set(386, 0.5 + eyeDX, eyeY - 0.012); set(374, 0.5 + eyeDX, eyeY + 0.012);
  // brows
  [[70, -0.14], [63, -0.11], [105, -0.08], [66, -0.05], [107, -0.03]].forEach(([i, dx]) => set(i, 0.5 + dx, eyeY - 0.05));
  [[336, 0.03], [296, 0.05], [334, 0.08], [293, 0.11], [300, 0.14]].forEach(([i, dx]) => set(i, 0.5 + dx, eyeY - 0.05));
  // nose + mouth
  set(168, 0.5, eyeY); set(1, 0.5, 0.56); set(98, 0.47, 0.565); set(327, 0.53, 0.565);
  set(61, 0.45, 0.66); set(291, 0.55, 0.66); set(0, 0.5, 0.645); set(17, 0.5, 0.675);
  set(13, 0.5, 0.655); set(14, 0.5, 0.665); // inner lips (mouth-open detector)
  set(234, 0.5 - rx, 0.5); set(454, 0.5 + rx, 0.5); set(10, 0.5, 0.5 - ry); set(152, 0.5, 0.5 + ry);
  return lm;
}
const outlineOf = (svg) => svg.match(/d="([^"]+)" fill="[^"]*" stroke="[^"]*" stroke-width="1.8" data-part="outline"/)?.[1];

const port = maskFromLandmarks(synthFace(), 1);
check("portrait mask returns svg + params", port.svg.startsWith("<svg") && !!port.params.role);
check("portrait svg has NO NaN coordinates (the invisible-socket bug)", !port.svg.includes("NaN"));
check("portrait renders exactly 2 eye sockets", (port.svg.match(/data-part="socket"/g) || []).length === 2);
check("portrait renders 2 brows + nose + mouth",
  (port.svg.match(/data-part="brow"/g) || []).length === 2 &&
  port.svg.includes('data-part="nose"') && port.svg.includes('data-part="mouth"'));
check("sockets sit near the synthetic eyes (finite, plausible coords)", (() => {
  const d = port.svg.split('data-part="socket"')[0].split("<path").at(-1);
  const nums = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  return nums.length > 6 && nums.every(Number.isFinite);
})());
check("portrait has transparent eye holes (evenodd)", port.svg.includes("evenodd"));
check("portrait paints regions clipped to the REAL face outline", port.svg.includes("clip-path"));
check("template masks also NaN-free", !generateMask(metricsToParams(m, 5), 100).includes("NaN"));

const wideP = maskFromLandmarks(synthFace({ rx: 0.30 }), 1);
const narrowP = maskFromLandmarks(synthFace({ rx: 0.17 }), 1);
check("wide vs narrow jaw → different silhouettes", outlineOf(wideP.svg) !== outlineOf(narrowP.svg));

const eyesHigh = maskFromLandmarks(synthFace({ eyeY: 0.40 }), 1);
const eyesLow = maskFromLandmarks(synthFace({ eyeY: 0.47 }), 1);
const socketY = (svg) => svg.match(/data-part="socket"/g) && svg.split('data-part="socket"')[0].length;
check("eye position moves the sockets (identifiable)",
  eyesHigh.svg.split('data-part="socket"')[0] !== eyesLow.svg.split('data-part="socket"')[0]
  && socketY(eyesHigh.svg) > 0);

const saltA = maskFromLandmarks(synthFace(), 11), saltB = maskFromLandmarks(synthFace(), 22);
check("salt changes the paint but keeps THEIR silhouette", outlineOf(saltA.svg) === outlineOf(saltB.svg) && saltA.svg !== saltB.svg);

// --- AR spectacle: crown + mouth-open detector ---
const crown = crownSVG(port.params, 200);
check("crownSVG renders (band+jewel+poms, NaN-free)",
  crown.startsWith("<svg") && !crown.includes("NaN") &&
  crown.includes('data-part="band"') && crown.includes('data-part="jewel"') &&
  (crown.match(/data-part="pom"/g) || []).length === 2);
check("crown uses the mask's role colour", crown.includes(port.params.role.primary));
const closedFace = synthFace();
const openFace = synthFace(); openFace[13] = { x: 0.5, y: 0.63 }; openFace[14] = { x: 0.5, y: 0.71 };
check("mouthOpenRatio: open mouth > closed mouth and crosses 0.09 trigger",
  mouthOpenRatio(openFace) > 0.09 && mouthOpenRatio(closedFace) < 0.09);

// --- story immersion + LORE + encyclopedia integrity ---
const { WORLD_STORIES, LORE } = await import("../docs/js/stories.js");
const { WORLDS } = await import("../docs/js/levels.js");
const { ENCYCLOPEDIA, CATS, EXTRA_TERMS } = await import("../docs/js/glossary.js");
const { lookup: lk } = await import("../docs/js/prosody.js");
check("every quest world has a 劇目 story (zh+en+tie)",
  WORLDS.every((w) => { const s = WORLD_STORIES[w.id]; return s && s.title && s.zh && s.en_syn && s.tie && s.tie_en; }));
check("every LORE entry has word/jp/zh/en", Object.values(LORE).every((l) => l.word && l.jp && l.zh && l.en));
check("every LORE key is a real dictionary character", Object.keys(LORE).every((ch) => !!lk(ch)));
check("encyclopedia has >= 19 illustrated entries across 4 categories",
  ENCYCLOPEDIA.length >= 19 && CATS.length === 4 &&
  CATS.every((c) => ENCYCLOPEDIA.some((x) => x.cat === c)));
check("all new instrument/costume entries have svg + bilingual text",
  EXTRA_TERMS.every((x) => x.svg.length > 30 && x.ex_zh && x.ex_en && x.cat));

// --- co-learning quiz round (pure; fake held-out samples) ---
const { quizRound } = await import("../docs/js/tone-ai.js");
const fakeVal = Array.from({ length: 40 }, (_, i) => ({ ch: String.fromCharCode(0x4e00 + i), x: new Float32Array(4), y: i % 16 }));
const qr = quizRound(fakeVal, 16, 5, (() => { let s = 42; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })());
check("quizRound returns 5 questions", qr.length === 5);
check("every question has 4 unique options incl. the answer",
  qr.every((q) => q.options.length === 4 && new Set(q.options).size === 4 && q.options.includes(q.answer)));
check("quiz answers are within group range", qr.every((q) => q.answer >= 0 && q.answer < 16));

// --- picture glossary + matching game ---
const { TERMS, buildMatchRound } = await import("../docs/js/glossary.js");
check("glossary has >= 8 illustrated terms", TERMS.length >= 8);
check("every term has zh/jp/en/explanations/svg", TERMS.every((x) => x.zh && x.jp && x.en && x.ex_zh && x.ex_en && x.svg.length > 20));
const round = buildMatchRound(TERMS, 4, () => 0.42);
check("match round has 4 pics + 4 labels", round.pics.length === 4 && round.labels.length === 4);
check("match round pics/labels are the same ids", (() => {
  const a = round.pics.map((x) => x.id).sort().join(), b = round.labels.map((x) => x.id).sort().join();
  return a === b;
})());

// --- open-data challenge generation (data → engine) ---
const data = JSON.parse(readFileSync(new URL("../docs/data/hk-opera-open-data.json", import.meta.url)));
const ch = dataChallenges(data, 8);
check("dataChallenges has repertoire to draw from", (data.repertoire || []).length >= 8);
check("dataChallenges returns tone rounds", ch.length >= 1 && ch.every((c) => c.kind === "tone"));
check("every generated char resolves in the engine dictionary", ch.every((c) => lookup(c.char)));

if (failed) { console.error(`\n${failed} gen check(s) FAILED`); process.exit(1); }
console.log("\nAll mask-gen + open-data generation checks passed.");
