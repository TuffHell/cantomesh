// Parity + sanity checks for the client-side engine. Run: node scripts/verify_web.mjs
import {
  verifyText, pingZe, annotate, findRhymes, checkTemplate, TEMPLATES,
} from "../docs/js/prosody.js";
import { BUNDLED } from "../docs/js/jyutping-data.js";

let failed = 0;
const check = (name, cond) => {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name}`); failed++; }
};

// --- tone parity with the Python core ---
check("月 jyut6 -> 仄 (checked)", pingZe("jyut6") === "仄");
check("家 gaa1 -> 平", pingZe("gaa1") === "平");
check("識 sik1 -> 仄 (checked overrides level)", pingZe("sik1") === "仄");

// --- dictionary coverage (the functional fix) ---
check("dictionary >= 20000 chars", Object.keys(BUNDLED).length >= 20000);
check("simplified 粤 resolves", BUNDLED["粤"] === "jyut6");
check("simplified 剧 resolves", BUNDLED["剧"] === "kek6");
check("simplified 风 resolves", !!BUNDLED["风"]);

// --- verify ---
const r = verifyText("大湾花开千川月\n粤韵声声爱国家");
check("valid couplet score 100", r.score === 100 && r.ok);
const bad = verifyText("家\n你");
check("broken couplet -> 70", bad.violations.length === 2 && bad.score === 70);

// --- annotate ---
const a = annotate("我哋一齐撑粤剧");
check("annotate covers all demo chars", a.coverage === 1 && a.total === 7);
check("annotate yields 平/仄", a.tokens.every((t) => t.pingze === "平" || t.pingze === "仄"));

// --- rhyme finder ---
const rh = findRhymes("家");
check("家 rhyme group = aa", rh.group === "aa");
check("家 rhymes include 花", rh.results.some((x) => x.char === "花"));
check("rhyme results sorted ping-first", rh.results[0].pingze === "平");

// --- template ---
const tm = checkTemplate("粤韵声声爱国家", TEMPLATES["七字 · 下句（平收）"]);
check("template length matches (7)", tm.actualLen === 7 && tm.lengthOk);
check("template end position 平 matches", tm.cells[6].ok === true);

if (failed) { console.error(`\n${failed} check(s) FAILED`); process.exit(1); }
console.log("\nAll web engine checks passed.");
