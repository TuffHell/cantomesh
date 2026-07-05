// Tests for the personalized mask generator + open-data challenge generation.
// Run: node scripts/verify_gen.mjs
import { faceMetrics, metricsToParams, generateMask, randomParams, PRESETS } from "../docs/js/mask-gen.js";
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
