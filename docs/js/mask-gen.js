// Procedural 臉譜 generator — turns a face's geometry into a UNIQUE opera mask.
// Deterministic: the same facial metrics always yield the same 臉譜, different
// faces yield visibly different colour archetypes, motifs and patterns.
// Pure (no DOM), so it is unit-testable.

// Traditional 臉譜 colour archetypes (colour → operatic meaning).
const ROLES = [
  { id: "red",    primary: "#b23a2e", secondary: "#e8b84b", zh: "紅淨 · 忠勇", en: "Crimson · Loyal & Brave", trait_zh: "赤膽忠心，剛正不阿", trait_en: "Unshakeable loyalty and courage" },
  { id: "black",  primary: "#2c2824", secondary: "#cfc7b6", zh: "黑淨 · 剛直", en: "Black · Upright", trait_zh: "鐵面無私，剛烈耿直", trait_en: "Iron-willed and just" },
  { id: "white",  primary: "#f0e9db", secondary: "#7a2a3a", zh: "白面 · 機謀", en: "White · Cunning", trait_zh: "足智多謀，深藏不露", trait_en: "Sharp-witted and strategic" },
  { id: "blue",   primary: "#2f5f8f", secondary: "#e8b84b", zh: "藍淨 · 勇猛", en: "Azure · Fierce", trait_zh: "剛勇桀驁，意志如鐵", trait_en: "Bold, wild and iron-willed" },
  { id: "green",  primary: "#3a6a5a", secondary: "#e8b84b", zh: "綠林 · 俠義", en: "Green · Chivalrous", trait_zh: "俠肝義膽，快意恩仇", trait_en: "Righteous and free-spirited" },
  { id: "gold",   primary: "#b8893a", secondary: "#b23a2e", zh: "金面 · 神威", en: "Gold · Divine", trait_zh: "神通廣大，威儀非凡", trait_en: "Otherworldly and majestic" },
  { id: "purple", primary: "#6f4a7a", secondary: "#e8b84b", zh: "紫面 · 智勇", en: "Violet · Wise", trait_zh: "沉穩剛毅，智勇雙全", trait_en: "Steady, wise and brave" },
];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// FaceMesh indices: 234/454 face edges, 10/152 top/chin, 133/362 inner eyes,
// 1 nose-tip, 168 nose-bridge, 61/291 mouth corners.
export function faceMetrics(lm) {
  const w = dist(lm[234], lm[454]) || 1e-6;
  const h = dist(lm[10], lm[152]) || 1e-6;
  return {
    aspect: w / h,                               // wide vs narrow face
    eyeSpacing: dist(lm[133], lm[362]) / w,      // set of the eyes
    noseRatio: dist(lm[168], lm[1]) / h,         // nose length
    mouthRatio: dist(lm[61], lm[291]) / w,       // mouth width
  };
}

// Deterministic metrics → design parameters.
export function metricsToParams(m) {
  const seed = Math.abs(
    Math.round(m.aspect * 137) * 7 +
    Math.round(m.eyeSpacing * 211) * 13 +
    Math.round(m.noseRatio * 173) * 5 +
    Math.round(m.mouthRatio * 197) * 3
  );
  const role = ROLES[seed % ROLES.length];
  return {
    seed,
    role,
    motif: (seed >> 2) % 5,                       // forehead motif
    cheek: (seed >> 4) % 4,                       // cheek pattern
    faceW: 40 * Math.min(1.18, Math.max(0.85, m.aspect * 1.35)),
    browAngle: (m.eyeSpacing - 0.34) * 60,        // wider eyes → flatter brows
    archetype: { zh: role.zh, en: role.en, trait_zh: role.trait_zh, trait_en: role.trait_en },
  };
}

function motifShape(i, p) {
  const c = p.role.secondary, k = p.role.primary;
  switch (i) {
    case 0: return `<path d="M50 12 L44 30 L50 24 L56 30 Z" fill="${c}"/><path d="M50 15 L47 27 M50 15 L53 27" stroke="${k}" stroke-width="1"/>`; // flame
    case 1: return `<path d="M50 14 q-12 6 0 16 q12 -10 0 -16 Z" fill="${c}"/><circle cx="50" cy="21" r="2.5" fill="${k}"/>`;                   // ruyi
    case 2: return `<circle cx="50" cy="20" r="9" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M50 11 a9 9 0 0 1 0 18 a4.5 4.5 0 0 1 0 -9 a4.5 4.5 0 0 0 0 -9" fill="${c}"/>`; // taiji
    case 3: return `<g fill="${c}"><path d="M50 14 q-9 3 -8 12 q6 -3 8 -8 q2 5 8 8 q1 -9 -8 -12"/></g>`;                                       // butterfly
    default: return `<circle cx="42" cy="20" r="4.5" fill="${c}"/><path d="M58 15 h0 a5 5 0 1 1 -0.01 0" fill="none" stroke="${c}" stroke-width="2.4"/>`; // sun+moon
  }
}

function cheekPattern(i, p) {
  const c = p.role.primary;
  // drawn on the right, mirrored to the left by the caller
  switch (i) {
    case 0: return `<path d="M70 60 q14 6 10 26 q-10 -4 -14 -16 q1 -6 4 -10 Z" fill="${c}" opacity="0.9"/>`;
    case 1: return `<path d="M68 56 q16 12 8 34 q-6 -2 -8 -10 q6 -12 0 -24 Z" fill="${c}" opacity="0.9"/>`;
    case 2: return `<g fill="${c}" opacity="0.9"><path d="M72 58 q10 10 6 22 q-8 -4 -10 -14 Z"/><circle cx="74" cy="82" r="3"/></g>`;
    default: return `<path d="M66 62 q18 4 14 30 q-12 -6 -16 -20 q0 -6 2 -10 Z" fill="${c}" opacity="0.88"/>`;
  }
}

export function generateMask(p, size = 300) {
  const fw = p.faceW, cx = 50;
  const face = `M${cx} 6 C${cx - fw * 0.62} 6 ${cx - fw * 0.72} 30 ${cx - fw * 0.66} 55
    C${cx - fw * 0.6} 88 ${cx - fw * 0.3} 118 ${cx} 118
    C${cx + fw * 0.3} 118 ${cx + fw * 0.6} 88 ${cx + fw * 0.66} 55
    C${cx + fw * 0.72} 30 ${cx + fw * 0.62} 6 ${cx} 6 Z`;
  return `<svg viewBox="0 0 100 122" width="${size}" height="${size * 1.22}" xmlns="http://www.w3.org/2000/svg" role="img">
    <path d="${face}" fill="#f7f1e6" stroke="#1c1610" stroke-width="1.6"/>
    <!-- primary forehead wash -->
    <path d="M${cx - fw * 0.6} 42 Q${cx} 20 ${cx + fw * 0.6} 42 Q${cx} 34 ${cx - fw * 0.6} 42 Z" fill="${p.role.primary}" opacity="0.85"/>
    ${motifShape(p.motif, p)}
    <!-- cheeks (mirrored) -->
    ${cheekPattern(p.cheek, p)}
    <g transform="translate(100,0) scale(-1,1)">${cheekPattern(p.cheek, p)}</g>
    <!-- eye sockets (净 style) -->
    <path d="M30 54 q10 -9 20 -1 q-9 8 -20 1 Z" fill="#1c1610"/>
    <path d="M50 53 q10 -8 20 1 q-11 7 -20 0 Z" fill="#1c1610"/>
    <circle cx="39" cy="55" r="2.6" fill="#f7f1e6"/><circle cx="61" cy="55" r="2.6" fill="#f7f1e6"/>
    <!-- brows -->
    <path d="M28 47 q10 ${-6 - p.browAngle} 20 -1" stroke="#1c1610" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M72 47 q-10 ${-6 - p.browAngle} -20 -1" stroke="#1c1610" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- nose + mouth -->
    <path d="M50 60 L45 82 q5 4 10 0 Z" fill="none" stroke="#1c1610" stroke-width="1.4"/>
    <path d="M40 92 q10 7 20 0 q-10 5 -20 0 Z" fill="${p.role.secondary}" stroke="#1c1610" stroke-width="1.2"/>
  </svg>`;
}

export function randomParams() {
  return metricsToParams({
    aspect: 0.7 + Math.random() * 0.4,
    eyeSpacing: 0.28 + Math.random() * 0.14,
    noseRatio: 0.3 + Math.random() * 0.14,
    mouthRatio: 0.32 + Math.random() * 0.14,
  });
}
