// Parity check: the client-side JS verifier must match the Python core's output.
// Run: node scripts/verify_web.mjs
import { verifyText, pingZe } from "../docs/js/prosody.js";

let failed = 0;
function check(name, cond) {
  if (cond) { console.log(`  ok   ${name}`); }
  else { console.error(`  FAIL ${name}`); failed++; }
}

// Tone classification (mirrors tests/test_tones.py).
check("月 jyut6 -> 仄 (checked)", pingZe("jyut6") === "仄");
check("家 gaa1 -> 平", pingZe("gaa1") === "平");
check("平 ping4 -> 平", pingZe("ping4") === "平");
check("識 sik1 -> 仄 (checked overrides level)", pingZe("sik1") === "仄");
check("你 nei5 -> 仄", pingZe("nei5") === "仄");

// Valid demo couplet must score 100 with full coverage (mirrors test_verifier.py).
const r = verifyText("大湾花开千川月\n粤韵声声爱国家");
check("couplet score 100", r.score === 100);
check("couplet ok", r.ok === true);
check("couplet 2 lines", r.lines.length === 2);
check("L1 role 上句", r.lines[0].role === "上句");
check("L2 role 下句", r.lines[1].role === "下句");
check("full romanization coverage",
  r.char_detail.every((line) => line.every((c) => c.jyutping)));

// A broken stanza must lose points.
const bad = verifyText("家\n你");
check("broken couplet flagged", bad.violations.length === 2 && bad.score === 70);

if (failed) { console.error(`\n${failed} parity check(s) FAILED`); process.exit(1); }
console.log("\nAll web/Python parity checks passed.");
