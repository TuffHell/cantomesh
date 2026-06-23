// Parity check: the client-side JS verifier must match the Python core's output.
// Run: node scripts/verify_web.mjs
import { verifyText, pingZe, toneName } from "../docs/js/prosody.js";

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

// 九聲六調 tone names (mirrors app/core/tones.tone_name).
check("詩 si1 -> 陰平", toneName("si1") === "陰平");
check("事 si6 -> 陽去", toneName("si6") === "陽去");
check("色 sik1 -> 陰入 (checked tone 1)", toneName("sik1") === "陰入");
check("錫 sek3 -> 中入 (checked tone 3)", toneName("sek3") === "中入");
check("食 sik6 -> 陽入 (checked tone 6)", toneName("sik6") === "陽入");

// Valid demo couplet must score 100 with full coverage (mirrors test_verifier.py).
const r = verifyText("大灣花開千川月\n粵韻聲聲愛國家");
check("couplet score 100", r.score === 100);
check("couplet ok", r.ok === true);
check("couplet 2 lines", r.lines.length === 2);
check("L1 role 上句", r.lines[0].role === "上句");
check("L2 role 下句", r.lines[1].role === "下句");
check("full romanization coverage",
  r.char_detail.every((line) => line.every((c) => c.jyutping)));
check("char_detail carries tone_name + pingze",
  r.char_detail[0][0].tone_name === "陽去" && r.char_detail[0][0].pingze === "仄"); // 大 daai6

// Four-line example must keep its 押韻 across both 下句.
const quad = verifyText("月明江上千年夢\n粵劇傳承萬代家\n水墨花開春復暖\n笙歌一曲詠中華");
check("four-line example scores 100", quad.score === 100 && quad.ok === true);

// A broken stanza must lose points.
const bad = verifyText("家\n你");
check("broken couplet flagged", bad.violations.length === 2 && bad.score === 70);

if (failed) { console.error(`\n${failed} parity check(s) FAILED`); process.exit(1); }
console.log("\nAll web/Python parity checks passed.");
