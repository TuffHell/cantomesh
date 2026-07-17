// Biomechanical scoring core for 身段 (opera posture) training.
// PURE functions over normalized landmarks {x,y,z,visibility} (y grows downward),
// so the "scientific rubric" is deterministic and unit-testable without a camera.
// Camera + MediaPipe live in pose-trainer.js; this file never touches the DOM.

// BlazePose (MediaPipe Pose) landmark indices we use.
export const LM = {
  NOSE: 0,
  L_SHO: 11, R_SHO: 12,
  L_ELB: 13, R_ELB: 14,
  L_WRI: 15, R_WRI: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26,
};

// Skeleton connections for drawing.
export const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Angle ABC (at vertex B) in degrees.
export function angleDeg(a, b, c) {
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby) || 1e-6;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

// Score one constraint -> { s: 0..1, hint }.
function scoreConstraint(c, lm) {
  if (c.kind === "angle") {
    const a = angleDeg(lm[c.joints[0]], lm[c.joints[1]], lm[c.joints[2]]);
    return { s: clamp01(1 - Math.abs(a - c.target) / c.tol), hint: c.hint, detail: a };
  }
  if (c.kind === "level") {
    // two points should sit at roughly the same height
    const d = Math.abs(lm[c.a].y - lm[c.b].y);
    return { s: clamp01(1 - d / c.tol), hint: c.hint, detail: d };
  }
  if (c.kind === "raise") {
    // c.point should be ABOVE c.ref by margin c.good (y grows downward)
    const margin = lm[c.ref].y - lm[c.point].y;
    return { s: clamp01(margin / c.good), hint: c.hint, detail: margin };
  }
  return { s: 0, hint: c.hint };
}

function scoreVariant(constraints, lm) {
  const results = constraints.map((c) => scoreConstraint(c, lm));
  const mean = results.reduce((a, r) => a + r.s, 0) / results.length;
  const worst = results.reduce((a, r) => (r.s < a.s ? r : a), results[0]);
  return { score: mean, worst, results };
}

function visibleEnough(pose, lm) {
  const idxs = new Set();
  pose.variants.flat().forEach((c) => {
    if (c.kind === "angle") c.joints.forEach((i) => idxs.add(i));
    else { if (c.a != null) idxs.add(c.a); if (c.b != null) idxs.add(c.b);
           if (c.point != null) idxs.add(c.point); if (c.ref != null) idxs.add(c.ref); }
  });
  for (const i of idxs) {
    const v = lm[i]?.visibility;
    if (v != null && v < 0.35) return false;
  }
  return true;
}

// Score a full pose: picks the best-matching variant (handles left/right mirror).
// Returns { ok, score: 0..100, worstHint }.
export function scorePose(landmarks, pose) {
  if (!landmarks || landmarks.length < 25) return { ok: false, reason: "no-body", score: 0 };
  if (!visibleEnough(pose, landmarks)) return { ok: false, reason: "visibility", score: 0 };
  let best = null;
  for (const v of pose.variants) {
    const r = scoreVariant(v, landmarks);
    if (!best || r.score > best.score) best = r;
  }
  return {
    ok: true,
    score: Math.round(best.score * 100),
    worstHint: best.worst.s < 0.7 ? best.worst.hint : null,
  };
}

// ---- Reference 身段 rubric (opera postures) ----
export const POSES = [
  {
    id: "saanbong", name: "山膀", role: "基本功",
    cue: "雙臂環抱於身前，沉肩墜肘，掌心向外，掌與肩平。",
    hold: 0,
    ghost: { le: [0.28, 0.35], lw: [0.43, 0.30], re: [0.72, 0.35], rw: [0.57, 0.30] },
    variants: [[
      { kind: "angle", joints: [LM.L_SHO, LM.L_ELB, LM.L_WRI], target: 110, tol: 78, hint: "hint.bendElbow" },
      { kind: "angle", joints: [LM.R_SHO, LM.R_ELB, LM.R_WRI], target: 110, tol: 78, hint: "hint.bendElbow" },
      { kind: "level", a: LM.L_WRI, b: LM.L_SHO, tol: 0.28, hint: "hint.handsShoulder" },
      { kind: "level", a: LM.R_WRI, b: LM.R_SHO, tol: 0.28, hint: "hint.handsShoulder" },
    ]],
  },
  {
    id: "seonfung", name: "順風旗", role: "身段",
    cue: "一臂高舉過頂，另一臂平展如旗，舒展挺拔。",
    hold: 0,
    ghost: { le: [0.28, 0.30], lw: [0.15, 0.30], re: [0.64, 0.16], rw: [0.69, 0.03] },
    variants: [
      [ // right arm up, left arm extended
        { kind: "raise", point: LM.R_WRI, ref: LM.NOSE, good: 0.05, hint: "hint.raiseAbove" },
        { kind: "angle", joints: [LM.R_SHO, LM.R_ELB, LM.R_WRI], target: 165, tol: 55, hint: "hint.straightenRaised" },
        { kind: "level", a: LM.L_WRI, b: LM.L_SHO, tol: 0.20, hint: "hint.extendLevel" },
      ],
      [ // left arm up, right arm extended
        { kind: "raise", point: LM.L_WRI, ref: LM.NOSE, good: 0.05, hint: "hint.raiseAbove" },
        { kind: "angle", joints: [LM.L_SHO, LM.L_ELB, LM.L_WRI], target: 165, tol: 55, hint: "hint.straightenRaised" },
        { kind: "level", a: LM.R_WRI, b: LM.R_SHO, tol: 0.20, hint: "hint.extendLevel" },
      ],
    ],
  },
  {
    id: "liongseong", name: "亮相", role: "定格",
    cue: "一臂高指，一臂橫展，凝神定格——穩住一秒。",
    hold: 900,
    ghost: { le: [0.30, 0.31], lw: [0.13, 0.33], re: [0.62, 0.14], rw: [0.66, 0.02] },
    variants: [
      [
        { kind: "raise", point: LM.R_WRI, ref: LM.NOSE, good: 0.06, hint: "hint.pointHigh" },
        { kind: "angle", joints: [LM.R_SHO, LM.R_ELB, LM.R_WRI], target: 170, tol: 45, hint: "hint.straightenRaised" },
        { kind: "level", a: LM.L_WRI, b: LM.L_SHO, tol: 0.20, hint: "hint.extendLevel" },
        { kind: "angle", joints: [LM.L_SHO, LM.L_ELB, LM.L_WRI], target: 165, tol: 55, hint: "hint.straightenExtended" },
      ],
      [
        { kind: "raise", point: LM.L_WRI, ref: LM.NOSE, good: 0.06, hint: "hint.pointHigh" },
        { kind: "angle", joints: [LM.L_SHO, LM.L_ELB, LM.L_WRI], target: 170, tol: 45, hint: "hint.straightenRaised" },
        { kind: "level", a: LM.R_WRI, b: LM.R_SHO, tol: 0.20, hint: "hint.extendLevel" },
        { kind: "angle", joints: [LM.R_SHO, LM.R_ELB, LM.R_WRI], target: 165, tol: 55, hint: "hint.straightenExtended" },
      ],
    ],
  },
];
