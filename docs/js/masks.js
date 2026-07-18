// Procedural SVG 臉譜 (opera masks) awarded as 尋面 unlocks.
// Symmetrical, role-coloured faces built from simple shapes — no image assets.

const FACE = "M50 6 C24 6 12 28 12 52 C12 82 30 116 50 116 C70 116 88 82 88 52 C88 28 76 6 50 6 Z";

const PALETTES = {
  tongsang: { skin: "#f6e7d2", line: "#3a2a1c", brow: "#5a3a22", accent: "#c8893a", blush: "#d98a76", motif: "蝶" },
  hungsang: { skin: "#c0392b", line: "#2a0d08", brow: "#1a0805", accent: "#f4d27a", blush: "#8f2c22", motif: "火" },
  huadaan: { skin: "#fbeae6", line: "#5a2330", brow: "#7a2a3a", accent: "#c43a5a", blush: "#e58aa0", motif: "花" },
  daafaa: { skin: "#f4efe6", line: "#141210", brow: "#141210", accent: "#2f6f5f", blush: "#b23a2e", motif: "壽" },
};

// id -> extra forehead/cheek decoration to differentiate roles.
function decoration(id, p) {
  switch (id) {
    case "hungsang": // bold flame brows + gold forehead streaks
      return `
        <path d="M50 18 L46 34 L50 30 L54 34 Z" fill="${p.accent}"/>
        <path d="M34 26 q-6 8 -2 16" stroke="${p.accent}" stroke-width="2" fill="none"/>
        <path d="M66 26 q6 8 2 16" stroke="${p.accent}" stroke-width="2" fill="none"/>`;
    case "daafaa": // strong淨 split-colour cheeks
      return `
        <path d="M20 50 q10 18 6 40 q-10 -8 -12 -24 q1 -10 6 -16 Z" fill="${p.accent}" opacity="0.85"/>
        <path d="M80 50 q-10 18 -6 40 q10 -8 12 -24 q-1 -10 -6 -16 Z" fill="${p.blush}" opacity="0.85"/>`;
    case "huadaan": // delicate forehead flower
      return `
        <g fill="${p.accent}" opacity="0.9">
          <circle cx="50" cy="24" r="2.6"/>
          <circle cx="45" cy="27" r="2.2"/><circle cx="55" cy="27" r="2.2"/>
          <circle cx="47" cy="31" r="2"/><circle cx="53" cy="31" r="2"/>
        </g>`;
    default: // tongsang — simple brow dot
      return `<circle cx="50" cy="24" r="3" fill="${p.accent}"/>`;
  }
}

export function maskSVG(id, size = 150) {
  const p = PALETTES[id] || PALETTES.tongsang;
  return `<svg viewBox="0 0 100 122" width="${size}" height="${size * 1.22}" xmlns="http://www.w3.org/2000/svg" role="img">
    <defs>
      <radialGradient id="g-${id}" cx="50%" cy="38%" r="70%">
        <stop offset="0%" stop-color="${p.skin}"/>
        <stop offset="100%" stop-color="${shade(p.skin, -12)}"/>
      </radialGradient>
    </defs>
    <path d="${FACE}" fill="url(#g-${id})" stroke="${p.line}" stroke-width="2.4"/>
    ${decoration(id, p)}
    <!-- brows -->
    <path d="M28 48 q10 -10 18 -2" stroke="${p.brow}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M72 48 q-10 -10 -18 -2" stroke="${p.brow}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <!-- eyes -->
    <path d="M30 56 q8 -7 16 0 q-8 5 -16 0 Z" fill="#fff" stroke="${p.line}" stroke-width="1.6"/>
    <path d="M54 56 q8 -7 16 0 q-8 5 -16 0 Z" fill="#fff" stroke="${p.line}" stroke-width="1.6"/>
    <circle cx="38" cy="56" r="2.6" fill="${p.line}"/>
    <circle cx="62" cy="56" r="2.6" fill="${p.line}"/>
    <!-- nose -->
    <path d="M50 60 L46 76 q4 4 8 0 Z" fill="none" stroke="${p.line}" stroke-width="1.6"/>
    <!-- blush -->
    <ellipse cx="32" cy="74" rx="7" ry="5" fill="${p.blush}" opacity="0.35"/>
    <ellipse cx="68" cy="74" rx="7" ry="5" fill="${p.blush}" opacity="0.35"/>
    <!-- mouth -->
    <path d="M40 90 q10 8 20 0 q-10 -3 -20 0 Z" fill="${p.blush}" stroke="${p.line}" stroke-width="1.4"/>
    <!-- forehead motif -->
    <text x="50" y="16" text-anchor="middle" font-size="10" fill="${p.line}" font-family="Kaiti SC, KaiTi, serif">${p.motif}</text>
  </svg>`;
}

// Lighten/darken a hex colour.
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
const clamp = (v) => Math.max(0, Math.min(255, v));
