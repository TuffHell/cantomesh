// Procedural 臉譜 engine. A face's geometry drives not just colour but the whole
// 谱式 (pattern structure) — 整臉 / 三塊瓦 / 十字門 / 碎臉 — plus motif, eye shape,
// brow, and accent, so different faces yield structurally different masks.
// Pure (no DOM), unit-testable. Also exposes curated PRESETS of traditional masks.

const INK = "#1c1610";
const BASE = "#f7f1e6";

// Colour archetypes (colour → operatic meaning).
const ROLES = [
  { id: "red",    primary: "#b23a2e", secondary: "#e8b84b", zh: "紅淨 · 忠勇", en: "Crimson · Loyal", trait_zh: "赤膽忠心，剛正不阿", trait_en: "Unshakeable loyalty and courage" },
  { id: "black",  primary: "#2c2824", secondary: "#e8e2d4", zh: "黑淨 · 剛直", en: "Black · Upright", trait_zh: "鐵面無私，剛烈耿直", trait_en: "Iron-willed and just" },
  { id: "white",  primary: "#e9e2d4", secondary: "#7a2a3a", zh: "白面 · 機謀", en: "White · Cunning", trait_zh: "足智多謀，深藏不露", trait_en: "Sharp-witted and strategic" },
  { id: "blue",   primary: "#2f5f8f", secondary: "#e8b84b", zh: "藍淨 · 勇猛", en: "Azure · Fierce", trait_zh: "剛勇桀驁，意志如鐵", trait_en: "Bold, wild and iron-willed" },
  { id: "green",  primary: "#3a6a5a", secondary: "#e8b84b", zh: "綠林 · 俠義", en: "Green · Chivalrous", trait_zh: "俠肝義膽，快意恩仇", trait_en: "Righteous and free-spirited" },
  { id: "gold",   primary: "#b8893a", secondary: "#b23a2e", zh: "金面 · 神威", en: "Gold · Divine", trait_zh: "神通廣大，威儀非凡", trait_en: "Otherworldly and majestic" },
  { id: "purple", primary: "#6f4a7a", secondary: "#e8b84b", zh: "紫面 · 智勇", en: "Violet · Wise", trait_zh: "沉穩剛毅，智勇雙全", trait_en: "Steady, wise and brave" },
];
const ACCENTS = ["#2f6f5f", "#2f5f8f", "#b8893a", "#6f4a7a", "#b23a2e", "#e8b84b", "#2c2824"];
const STYLES = ["zheng", "sankuaiwa", "shizimen", "sui"]; // 谱式

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function faceMetrics(lm) {
  const w = dist(lm[234], lm[454]) || 1e-6;
  const h = dist(lm[10], lm[152]) || 1e-6;
  return {
    aspect: w / h,
    eyeSpacing: dist(lm[133], lm[362]) / w,
    noseRatio: dist(lm[168], lm[1]) / h,
    mouthRatio: dist(lm[61], lm[291]) / w,
  };
}

// salt=0 → fully deterministic from the face. A non-zero salt keeps the
// face-DRIVEN parts (谱式 structure, eye shape, brow, face width — your actual
// features) but reshuffles the expressive parts (role colour, motif, cheek,
// accent), so every generation is a NEW mask still built on your face.
export function metricsToParams(m, salt = 0) {
  const faceSeed = Math.abs(
    Math.round(m.aspect * 137) * 7 + Math.round(m.eyeSpacing * 211) * 13 +
    Math.round(m.noseRatio * 173) * 5 + Math.round(m.mouthRatio * 197) * 3);
  const seed = faceSeed + Math.abs(Math.round(salt)) * 101;
  return {
    seed,
    role: ROLES[seed % ROLES.length],
    // face shape drives the structural 谱式 (wide → bolder patterns)
    style: STYLES[(m.aspect > 0.78 ? 1 : m.aspect < 0.66 ? 2 : (faceSeed >> 1) % 4) % 4],
    motif: (seed >> 2) % 8,
    eyeStyle: m.eyeSpacing > 0.36 ? 0 : m.eyeSpacing < 0.30 ? 2 : 1,
    brow: m.noseRatio > 0.34 ? 0 : m.noseRatio < 0.28 ? 2 : 1,
    cheek: (seed >> 4) % 4,
    accent: ACCENTS[(seed >> 5) % ACCENTS.length],
    faceW: 40 * Math.min(1.18, Math.max(0.86, m.aspect * 1.35)),
    get archetype() { const r = this.role; return { zh: r.zh, en: r.en, trait_zh: r.trait_zh, trait_en: r.trait_en }; },
  };
}

const P = (a) => `${a[0]},${a[1]}`;

// ---- structural 谱式 colour regions ----
function styleRegions(p) {
  const k = p.role.primary, s = p.role.secondary, a = p.accent, fw = p.faceW, L = 50 - fw * 0.62, R = 50 + fw * 0.62;
  switch (p.style) {
    case "zheng": // 整臉 — a full dominant wash, white eye band
      return `<path d="M${L} 34 Q50 8 ${R} 34 Q${R} 74 50 90 Q${L} 74 ${L} 34 Z" fill="${k}"/>
        <path d="M26 50 Q50 40 74 50 Q50 66 26 50 Z" fill="${BASE}" opacity="0.92"/>`;
    case "sankuaiwa": // 三塊瓦 — forehead block + two cheek blocks
      return `<path d="M${L + 4} 34 Q50 12 ${R - 4} 34 Q50 40 ${L + 4} 34 Z" fill="${k}"/>
        <path d="M${L} 50 Q34 48 40 72 Q28 74 ${L} 60 Z" fill="${k}"/>
        <path d="M${R} 50 Q66 48 60 72 Q72 74 ${R} 60 Z" fill="${k}"/>
        <path d="M42 44 h16 l-3 34 h-10 Z" fill="${s}" opacity="0.5"/>`;
    case "shizimen": // 十字門 — vertical band + eye band forming a cross
      return `<rect x="43" y="16" width="14" height="78" rx="5" fill="${k}"/>
        <path d="M22 50 Q50 42 78 50 Q50 60 22 50 Z" fill="${k}"/>
        <path d="M46 20 h8 v66 h-8 Z" fill="${s}" opacity="0.45"/>`;
    default: // 碎臉 — fragmented multi-colour patches
      return `<path d="M${L + 3} 34 Q50 14 ${R - 3} 34 Q50 30 ${L + 3} 34 Z" fill="${k}"/>
        <path d="M28 48 Q40 46 40 66 Q30 66 26 56 Z" fill="${a}" opacity="0.85"/>
        <path d="M72 48 Q60 46 60 66 Q70 66 74 56 Z" fill="${a}" opacity="0.85"/>
        <path d="M44 60 h12 l-2 26 h-8 Z" fill="${s}" opacity="0.6"/>
        <circle cx="34" cy="78" r="4" fill="${k}"/><circle cx="66" cy="78" r="4" fill="${k}"/>`;
  }
}

function motifShape(i, p) {
  const c = p.role.secondary, a = p.accent;
  switch (i) {
    case 0: return `<path d="M50 12 L44 30 L50 24 L56 30 Z" fill="${c}"/>`;                                    // flame
    case 1: return `<path d="M50 14 q-12 6 0 16 q12 -10 0 -16 Z" fill="${c}"/><circle cx="50" cy="21" r="2.4" fill="${a}"/>`; // ruyi
    case 2: return `<circle cx="50" cy="20" r="8.5" fill="none" stroke="${c}" stroke-width="2.2"/><path d="M50 12 a8.5 8.5 0 0 1 0 17 a4.25 4.25 0 0 1 0 -8.5 a4.25 4.25 0 0 0 0 -8.5" fill="${c}"/>`; // taiji
    case 3: return `<path d="M50 14 q-9 3 -8 12 q6 -3 8 -8 q2 5 8 8 q1 -9 -8 -12" fill="${c}"/>`;                // butterfly
    case 4: return `<circle cx="43" cy="19" r="4" fill="${c}"/><path d="M60 15 a5 5 0 1 1 -0.01 0" fill="none" stroke="${c}" stroke-width="2.2"/>`; // sun+moon
    case 5: return `<path d="M50 14 q-10 4 -6 12 q6 4 6 -2 q0 6 6 2 q4 -8 -6 -12 Z" fill="${c}"/>`;             // lotus
    case 6: return `<path d="M42 16 q8 -6 16 0 q-2 8 -8 8 q-6 0 -8 -8 Z" fill="${c}"/>`;                        // bat (蝠)
    default: return `<path d="M50 13 q-6 4 -6 10 q0 6 6 8 q6 -2 6 -8 q0 -6 -6 -10 Z" fill="none" stroke="${c}" stroke-width="2"/><circle cx="50" cy="21" r="2" fill="${a}"/>`; // gourd
  }
}

function eyes(style) {
  switch (style) {
    case 1: return `<path d="M29 56 q10 -10 20 -2 q-10 6 -20 2 Z" fill="${INK}"/><path d="M51 54 q10 -8 20 2 q-11 6 -20 0 Z" fill="${INK}"/>`; // 凤眼 upturned
    case 2: return `<path d="M30 52 q10 5 20 2 q-8 8 -20 2 Z" fill="${INK}"/><path d="M50 54 q10 -3 20 -2 q-12 9 -20 2 Z" fill="${INK}"/>`;   // drooping
    default: return `<path d="M30 54 q10 -9 20 -1 q-9 8 -20 1 Z" fill="${INK}"/><path d="M50 53 q10 -8 20 1 q-11 7 -20 0 Z" fill="${INK}"/>`; // round 净
  }
}
function brows(style, p) {
  const c = INK;
  if (style === 0) return `<path d="M28 46 q10 -8 20 -2" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M72 46 q-10 -8 -20 -2" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`; // angry up
  if (style === 2) return `<path d="M28 44 q10 5 20 3" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M72 44 q-10 5 -20 3" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`; // drooping
  return `<path d="M28 46 q10 -4 20 -1" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M72 46 q-10 -4 -20 -1" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`; // flat
}
function cheekAccent(i, p) {
  const c = p.role.secondary;
  const one = [
    `<path d="M70 62 q12 6 8 22 q-8 -3 -12 -14 Z" fill="${c}" opacity="0.8"/>`,
    `<path d="M72 60 q10 12 4 26 q-6 -2 -8 -12 q6 -8 2 -16 Z" fill="${c}" opacity="0.8"/>`,
    `<g fill="${c}" opacity="0.8"><path d="M72 60 q8 8 5 18 q-7 -3 -9 -12 Z"/><circle cx="74" cy="80" r="2.4"/></g>`,
    `<path d="M68 64 q14 4 11 24 q-10 -5 -13 -16 Z" fill="${c}" opacity="0.75"/>`,
  ][i % 4];
  return one + `<g transform="translate(100,0) scale(-1,1)">${one}</g>`;
}

export function generateMask(p, size = 300) {
  const fw = p.faceW, cx = 50;
  const face = `M${cx} 6 C${cx - fw * 0.62} 6 ${cx - fw * 0.72} 30 ${cx - fw * 0.66} 55
    C${cx - fw * 0.6} 88 ${cx - fw * 0.3} 118 ${cx} 118
    C${cx + fw * 0.3} 118 ${cx + fw * 0.6} 88 ${cx + fw * 0.66} 55
    C${cx + fw * 0.72} 30 ${cx + fw * 0.62} 6 ${cx} 6 Z`;
  return `<svg viewBox="0 0 100 122" width="${size}" height="${size * 1.22}" xmlns="http://www.w3.org/2000/svg" role="img">
    <path d="${face}" fill="${BASE}" stroke="${INK}" stroke-width="1.6"/>
    ${styleRegions(p)}
    ${cheekAccent(p.cheek, p)}
    ${motifShape(p.motif, p)}
    ${eyes(p.eyeStyle)}
    <circle cx="39" cy="55" r="2.5" fill="${BASE}"/><circle cx="61" cy="55" r="2.5" fill="${BASE}"/>
    ${brows(p.brow, p)}
    <path d="M50 60 L45 82 q5 4 10 0 Z" fill="none" stroke="${INK}" stroke-width="1.4"/>
    <path d="M40 92 q10 7 20 0 q-10 5 -20 0 Z" fill="${p.role.secondary}" stroke="${INK}" stroke-width="1.2"/>
  </svg>`;
}

// ---- curated traditional presets (recognisable archetypes) ----
function preset(roleId, style, motif, eyeStyle, brow, cheek, accent) {
  const role = ROLES.find((r) => r.id === roleId);
  return { seed: 0, role, style, motif, eyeStyle, brow, cheek, accent, faceW: 40,
    archetype: { zh: role.zh, en: role.en, trait_zh: role.trait_zh, trait_en: role.trait_en } };
}
export const PRESETS = [
  { id: "guan",  zh: "紅生 · 關公", en: "Guan Gong (Red)",  params: preset("red", "zheng", 0, 1, 0, 0, "#2c2824") },
  { id: "bao",   zh: "黑淨 · 包公", en: "Bao Gong (Black)", params: preset("black", "zheng", 4, 0, 1, 1, "#e8e2d4") },
  { id: "cao",   zh: "白面 · 曹操", en: "Cao Cao (White)",  params: preset("white", "zheng", 7, 2, 2, 2, "#7a2a3a") },
  { id: "dou",   zh: "藍淨 · 竇爾敦", en: "Dou Erdun (Blue)", params: preset("blue", "sankuaiwa", 1, 0, 0, 3, "#e8b84b") },
  { id: "hou",   zh: "金面 · 美猴王", en: "Monkey King (Gold)", params: preset("gold", "sui", 2, 1, 0, 2, "#b23a2e") },
  { id: "zhang", zh: "黑淨 · 張飛", en: "Zhang Fei (Black)", params: preset("black", "sankuaiwa", 3, 0, 0, 1, "#e8e2d4") },
];

export function randomParams() {
  return metricsToParams({
    aspect: 0.62 + Math.random() * 0.28,
    eyeSpacing: 0.26 + Math.random() * 0.16,
    noseRatio: 0.26 + Math.random() * 0.16,
    mouthRatio: 0.30 + Math.random() * 0.16,
  });
}

// ===========================================================================
// PORTRAIT MASK — painted directly from the person's 468 FaceMesh landmarks.
// The silhouette IS their jaw/forehead; sockets sit on their real eyes (with
// transparent holes so their own eyes look through); brows follow their arch;
// the 谱式 pattern is clipped to their true face shape. Identifiable, not a
// recoloured template.
// ===========================================================================

// FaceMesh landmark chains/points.
const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
  379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109];
const LBROW = [70, 63, 105, 66, 107], RBROW = [336, 296, 334, 293, 300];
const LEYE = { out: 33, inn: 133, top: 159, bot: 145 };
const REYE = { out: 263, inn: 362, top: 386, bot: 374 };
const NOSE = { bridge: 168, tip: 1, wl: 98, wr: 327 };
const MOUTH = { l: 61, r: 291, top: 0, bot: 17 };

// Quadratic midpoint smoothing → organic closed/open paths from landmark chains.
const smoothClosed = (pts) => {
  let d = `M ${(pts[0].x + pts.at(-1).x) / 2} ${(pts[0].y + pts.at(-1).y) / 2}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], n = pts[(i + 1) % pts.length];
    d += ` Q ${p.x} ${p.y} ${(p.x + n.x) / 2} ${(p.y + n.y) / 2}`;
  }
  return d + " Z";
};
const smoothOpen = (pts) => {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], n = pts[i + 1];
    d += ` Q ${p.x} ${p.y} ${(p.x + n.x) / 2} ${(p.y + n.y) / 2}`;
  }
  return d + ` L ${pts.at(-1).x} ${pts.at(-1).y}`;
};
const r1 = (v) => Math.round(v * 10) / 10;

// One exaggerated 净-style eye socket over the REAL eye, with a transparent
// hole (fill-rule evenodd) so the wearer's own eye shows through the mask.
// NOTE: takes landmark INDICES + the lm array — mapping indices directly was
// the NaN bug that made sockets vanish.
function socket(eyeIdx, lm, M, rim) {
  const out = M(lm[eyeIdx.out]), inn = M(lm[eyeIdx.inn]);
  const top = M(lm[eyeIdx.top]), bot = M(lm[eyeIdx.bot]);
  const cx = (out.x + inn.x) / 2, cy = (top.y + bot.y) / 2;
  const w = Math.max(7, Math.abs(out.x - inn.x));
  const h = Math.max(3, Math.abs(bot.y - top.y)) * 1.2;
  const dir = out.x > inn.x ? 1 : -1; // flick toward the temple
  // lower + wider than before: must NOT reach the brows, and the hole is large
  // so the real eyes read naturally (no googly rim ring).
  const tip = { x: out.x + dir * w * 0.30, y: cy - h * 1.45 };
  const base = { x: inn.x - dir * w * 0.10, y: cy + h * 0.25 };
  const leaf = `M ${r1(base.x)} ${r1(base.y)} Q ${r1(cx)} ${r1(cy - h * 1.9)} ${r1(tip.x)} ${r1(tip.y)}` +
    ` Q ${r1(out.x + dir * w * 0.16)} ${r1(cy + h * 1.6)} ${r1(base.x)} ${r1(base.y)} Z`;
  const rx = r1(w * 0.44), ry = r1(Math.max(3.0, h * 1.2));
  const hole = ` M ${r1(cx + w * 0.44)} ${r1(cy)} A ${rx} ${ry} 0 1 0 ${r1(cx - w * 0.44)} ${r1(cy)}` +
    ` A ${rx} ${ry} 0 1 0 ${r1(cx + w * 0.44)} ${r1(cy)} Z`;
  // paper-colour outer stroke so the socket separates from dark paint grounds
  return `<path d="${leaf}${hole}" fill="${INK}" fill-rule="evenodd" stroke="${rim}" stroke-width="1.1" data-part="socket"/>`;
}

// A single clean tapered brow following the real arch (sorted by x, one curve —
// no zigzag), flicked up at the temple end.
function browStroke(idxs, lm, M, lateralDir) {
  const pts = idxs.map((i) => M(lm[i])).sort((a, b) => a.x - b.x);
  const a = pts[0], b = pts.at(-1);
  const mid = { x: (a.x + b.x) / 2, y: Math.min(...pts.map((q) => q.y)) - 1.5 };
  const tail = lateralDir > 0 ? b : a;
  const flick = { x: tail.x + lateralDir * 3.5, y: tail.y - 3 };
  const d = `M ${r1(lateralDir > 0 ? a.x : b.x)} ${r1(lateralDir > 0 ? a.y : b.y)}` +
    ` Q ${r1(mid.x)} ${r1(mid.y)} ${r1(tail.x)} ${r1(tail.y)} L ${r1(flick.x)} ${r1(flick.y)}`;
  // paper under-stroke first, ink on top → brows separate from dark paint
  return `<path d="${d}" stroke="${BASE}" stroke-width="5.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round" data-part="brow"/>`;
}

// 谱式 regions painted RELATIVE to the real features, clipped to the real face.
function portraitRegions(p, a) {
  const k = p.role.primary, s = p.role.secondary, ac = p.accent;
  const browY = a.browY, eyeBotY = a.eyeBotY, topY = a.topY, chinY = a.chinY;
  const noseX = a.nose.x, cheekL = a.cheekL, cheekR = a.cheekR;
  switch (p.style) {
    case "zheng":
      return `<rect x="0" y="${topY - 6}" width="100" height="${chinY - topY + 12}" fill="${k}"/>
        <rect x="0" y="${browY + 1}" width="100" height="${eyeBotY - browY + 3}" fill="${BASE}" opacity="0.92"/>`;
    case "sankuaiwa":
      return `<rect x="0" y="${topY - 6}" width="100" height="${browY - topY + 4}" fill="${k}"/>
        <ellipse cx="${cheekL.x}" cy="${cheekL.y}" rx="${a.cheekR2}" ry="${a.cheekR2 * 1.25}" fill="${k}"/>
        <ellipse cx="${cheekR.x}" cy="${cheekR.y}" rx="${a.cheekR2}" ry="${a.cheekR2 * 1.25}" fill="${k}"/>
        <rect x="${noseX - 4}" y="${eyeBotY}" width="8" height="${chinY - eyeBotY - 8}" fill="${s}" opacity="0.5"/>`;
    case "shizimen": // 通天柱 stops at the nose bridge — never through mouth/chin
      return `<rect x="${noseX - 7}" y="${topY - 4}" width="14" height="${a.noseTopY - topY + 4}" rx="5" fill="${k}"/>
        <rect x="0" y="${browY + 2}" width="100" height="${eyeBotY - browY + 2}" fill="${k}"/>
        <rect x="${noseX - 3.5}" y="${topY}" width="7" height="${a.noseTopY - topY - 2}" fill="${s}" opacity="0.45"/>`;
    default: // sui — fragmented patches on the real cheeks, chin kept light
      return `<rect x="0" y="${topY - 6}" width="100" height="${(browY - topY) * 0.7 + 4}" fill="${k}"/>
        <ellipse cx="${cheekL.x}" cy="${cheekL.y}" rx="${a.cheekR2 * 0.8}" ry="${a.cheekR2}" fill="${ac}" opacity="0.85"/>
        <ellipse cx="${cheekR.x}" cy="${cheekR.y}" rx="${a.cheekR2 * 0.8}" ry="${a.cheekR2}" fill="${ac}" opacity="0.85"/>
        <circle cx="${cheekL.x}" cy="${chinY - 10}" r="3.4" fill="${k}"/><circle cx="${cheekR.x}" cy="${chinY - 10}" r="3.4" fill="${k}"/>`;
  }
}

// Light "muzzle" panel — 脸谱 keep the nose/mouth zone on pale ground so the
// features stay legible; patterns radiate AROUND them, not over them.
function muzzlePanel(a, mouthHalfW) {
  const cx = a.nose.x, top = a.noseTopY, bot = a.mouthY + 5;
  const rx = Math.max(10, mouthHalfW * 1.6);
  return `<ellipse cx="${r1(cx)}" cy="${r1((top + bot) / 2)}" rx="${r1(rx)}" ry="${r1((bot - top) / 2 + 3)}" fill="${BASE}" opacity="0.82" data-part="muzzle"/>`;
}

export function maskFromLandmarks(lm, salt = 0, size = 300) {
  const p = metricsToParams(faceMetrics(lm), salt);

  // Map the real face bbox into the 100×122 canvas, PRESERVING their aspect.
  const oval = OVAL.map((i) => lm[i]);
  const xs = oval.map((q) => q.x), ys = oval.map((q) => q.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const sc = Math.min(88 / (maxX - minX || 1e-6), 106 / (maxY - minY || 1e-6));
  const M = (q) => ({ x: r1(50 + (q.x - cx) * sc), y: r1(62 + (q.y - cy) * sc) });

  const O = oval.map(M);
  const outline = smoothClosed(O);
  const lb = LBROW.map((i) => M(lm[i])), rb = RBROW.map((i) => M(lm[i]));
  const anchors = {
    topY: Math.min(...O.map((q) => q.y)),
    chinY: Math.max(...O.map((q) => q.y)),
    browY: Math.min(...[...lb, ...rb].map((q) => q.y)),
    eyeBotY: Math.max(M(lm[LEYE.bot]).y, M(lm[REYE.bot]).y),
    nose: M(lm[NOSE.tip]),
    mouthY: M(lm[MOUTH.bot]).y,
    cheekL: { x: (M(lm[LEYE.out]).x + M(lm[NOSE.wl]).x) / 2 - 4, y: M(lm[NOSE.tip]).y },
    cheekR: { x: (M(lm[REYE.out]).x + M(lm[NOSE.wr]).x) / 2 + 4, y: M(lm[NOSE.tip]).y },
    cheekR2: 11,
  };

  // nose: a modest bridge-to-wings accent (not a giant triangle) — starts at
  // mid-bridge and hugs their real nostril width.
  const nb = M(lm[NOSE.bridge]), nt = anchors.nose, nwl = M(lm[NOSE.wl]), nwr = M(lm[NOSE.wr]);
  const nStartY = nb.y + (nt.y - nb.y) * 0.62; // shorter: start well below the eye line
  anchors.noseTopY = nStartY;
  const nose = `<path d="M ${r1(nb.x - 1.4)} ${r1(nStartY)} L ${r1(nwl.x)} ${r1(nt.y - 1)}` +
    ` Q ${r1(nt.x)} ${r1(nt.y + 2.4)} ${r1(nwr.x)} ${r1(nt.y - 1)} L ${r1(nb.x + 1.4)} ${r1(nStartY)}"` +
    ` fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" data-part="nose"/>` +
    `<path d="M ${r1(nwl.x)} ${r1(nt.y + 0.5)} q 1.6 1.6 3.2 0 M ${r1(nwr.x - 3.2)} ${r1(nt.y + 0.5)} q 1.6 1.6 3.2 0"` +
    ` fill="none" stroke="${INK}" stroke-width="1.1" data-part="nose"/>`;
  // mouth: real lips with a centre seam, not a lens
  const ml = M(lm[MOUTH.l]), mr = M(lm[MOUTH.r]), mt = M(lm[MOUTH.top]), mb = M(lm[MOUTH.bot]);
  const mcx = (ml.x + mr.x) / 2, mcy = (ml.y + mr.y) / 2;
  const mouth = `<path d="M ${r1(ml.x)} ${r1(ml.y)} Q ${r1(mt.x)} ${r1(mt.y - 0.8)} ${r1(mr.x)} ${r1(mr.y)}` +
    ` Q ${r1(mb.x)} ${r1(mb.y + 1.2)} ${r1(ml.x)} ${r1(ml.y)} Z" fill="${p.role.secondary}" stroke="${INK}" stroke-width="1.2" data-part="mouth"/>` +
    `<path d="M ${r1(ml.x)} ${r1(ml.y)} Q ${r1(mcx)} ${r1(mcy + 0.8)} ${r1(mr.x)} ${r1(mr.y)}"` +
    ` fill="none" stroke="${INK}" stroke-width="1.1" data-part="mouth"/>`;
  const fx = nb.x, fy = (anchors.topY + anchors.browY) / 2; // forehead motif anchor

  const svg = `<svg viewBox="0 0 100 122" width="${size}" height="${size * 1.22}" xmlns="http://www.w3.org/2000/svg" role="img">
    <defs><clipPath id="pf-${p.seed}"><path d="${outline}"/></clipPath></defs>
    <path d="${outline}" fill="${BASE}" stroke="${INK}" stroke-width="1.8" data-part="outline"/>
    <g clip-path="url(#pf-${p.seed})">${portraitRegions(p, anchors)}${muzzlePanel(anchors, (mr.x - ml.x) / 2)}</g>
    <g transform="translate(${r1(fx - 50)},${r1(fy - 20)})">${motifShape(p.motif, p)}</g>
    ${socket(LEYE, lm, M, p.role.secondary)}${socket(REYE, lm, M, p.role.secondary)}
    ${browStroke(LBROW, lm, M, -1)}${browStroke(RBROW, lm, M, 1)}
    ${nose}
    ${mouth}
    <path d="${outline}" fill="none" stroke="${p.accent}" stroke-width="0.8" opacity="0.5"/>
  </svg>`;
  return { svg, params: p };
}
