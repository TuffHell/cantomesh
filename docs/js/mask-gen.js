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

export function metricsToParams(m) {
  const seed = Math.abs(
    Math.round(m.aspect * 137) * 7 + Math.round(m.eyeSpacing * 211) * 13 +
    Math.round(m.noseRatio * 173) * 5 + Math.round(m.mouthRatio * 197) * 3);
  return {
    seed,
    role: ROLES[seed % ROLES.length],
    // face shape drives the structural 谱式 (wide → bolder patterns)
    style: STYLES[(m.aspect > 0.78 ? 1 : m.aspect < 0.66 ? 2 : (seed >> 1) % 4) % 4],
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
