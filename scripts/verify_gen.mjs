// Tests for the personalized mask generator + open-data challenge generation.
// Run: node scripts/verify_gen.mjs
import { faceMetrics, metricsToParams, generateMask, randomParams } from "../docs/js/mask-gen.js";
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

// --- open-data challenge generation (data → engine) ---
const data = JSON.parse(readFileSync(new URL("../docs/data/hk-opera-open-data.json", import.meta.url)));
const ch = dataChallenges(data, 8);
check("dataChallenges has repertoire to draw from", (data.repertoire || []).length >= 8);
check("dataChallenges returns tone rounds", ch.length >= 1 && ch.every((c) => c.kind === "tone"));
check("every generated char resolves in the engine dictionary", ch.every((c) => lookup(c.char)));

if (failed) { console.error(`\n${failed} gen check(s) FAILED`); process.exit(1); }
console.log("\nAll mask-gen + open-data generation checks passed.");
