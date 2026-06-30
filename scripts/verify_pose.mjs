// Unit tests for the biomechanical pose-scoring core. Run: node scripts/verify_pose.mjs
import { angleDeg, scorePose, POSES, LM } from "../docs/js/pose-coach.js";

let failed = 0;
const check = (name, cond) => {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name}`); failed++; }
};

// 33 landmarks, all visible at center; override specific joints.
function body(overrides = {}) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  for (const [i, p] of Object.entries(overrides)) lm[i] = { z: 0, visibility: 1, ...p };
  return lm;
}
const pose = (id) => POSES.find((p) => p.id === id);

// --- angle primitive ---
check("angleDeg right angle ~90", Math.abs(angleDeg({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }) - 90) < 0.5);
check("angleDeg straight ~180", Math.abs(angleDeg({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }) - 180) < 0.5);

// --- 順風旗: right arm up, left arm out (constructed to satisfy the rubric) ---
const seonGood = body({
  [LM.NOSE]: { x: 0.50, y: 0.30 },
  [LM.R_SHO]: { x: 0.58, y: 0.42 }, [LM.R_ELB]: { x: 0.615, y: 0.27 }, [LM.R_WRI]: { x: 0.66, y: 0.12 },
  [LM.L_SHO]: { x: 0.42, y: 0.42 }, [LM.L_ELB]: { x: 0.31, y: 0.42 }, [LM.L_WRI]: { x: 0.20, y: 0.42 },
});
const seonBad = body({
  [LM.NOSE]: { x: 0.50, y: 0.30 },
  [LM.R_SHO]: { x: 0.58, y: 0.42 }, [LM.R_ELB]: { x: 0.59, y: 0.55 }, [LM.R_WRI]: { x: 0.60, y: 0.66 },
  [LM.L_SHO]: { x: 0.42, y: 0.42 }, [LM.L_ELB]: { x: 0.41, y: 0.55 }, [LM.L_WRI]: { x: 0.40, y: 0.66 },
});
const gScore = scorePose(seonGood, pose("seonfung")).score;
const bScore = scorePose(seonBad, pose("seonfung")).score;
check(`順風旗 good pose scores high (${gScore})`, gScore > 60);
check(`順風旗 arms-down scores low (${bScore})`, bScore < 45);
check("順風旗 good > bad", gScore > bScore);
check("順風旗 good has no nagging hint", scorePose(seonGood, pose("seonfung")).worstHint == null);
check("順風旗 bad returns a corrective hint", typeof scorePose(seonBad, pose("seonfung")).worstHint === "string");

// --- visibility gating ---
const occluded = body({
  [LM.NOSE]: { x: 0.5, y: 0.3 },
  [LM.R_WRI]: { x: 0.66, y: 0.12, visibility: 0.1 }, // a used joint is hidden
});
check("low visibility → ok:false", scorePose(occluded, pose("seonfung")).ok === false);
check("empty body → ok:false", scorePose([], pose("seonfung")).ok === false);

// --- 山膀: integration monotonicity (wrists at shoulder height beats wrists at hips) ---
const base = {
  [LM.L_SHO]: { x: 0.40, y: 0.45 }, [LM.R_SHO]: { x: 0.60, y: 0.45 },
  [LM.L_ELB]: { x: 0.30, y: 0.45 }, [LM.R_ELB]: { x: 0.70, y: 0.45 },
};
const saanBetter = body({ ...base, [LM.L_WRI]: { x: 0.45, y: 0.45 }, [LM.R_WRI]: { x: 0.55, y: 0.45 } });
const saanWorse = body({ ...base, [LM.L_WRI]: { x: 0.45, y: 0.70 }, [LM.R_WRI]: { x: 0.55, y: 0.70 } });
check("山膀 returns a number", typeof scorePose(saanBetter, pose("saanbong")).score === "number");
check("山膀 wrists-at-shoulder > wrists-at-hip",
  scorePose(saanBetter, pose("saanbong")).score > scorePose(saanWorse, pose("saanbong")).score);

// --- 亮相 requires a hold (rubric metadata) ---
check("亮相 has hold time", pose("liongseong").hold >= 1000);

if (failed) { console.error(`\n${failed} pose check(s) FAILED`); process.exit(1); }
console.log("\nAll pose-coach checks passed.");
