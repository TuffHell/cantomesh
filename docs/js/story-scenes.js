// Illustrated story scenes — cartoon-opera character art composed into each
// 戲文 panel (the Ytong pattern: the story world IS the interface). Pure SVG in
// the house style: painted faces, gold-on-jade night palette, one iconic scene
// per 劇目. Text sits left; scenes fade in from the right.

const FACE = "#f6e7d2", INK = "#1c1610", GOLD = "#e0bb66", GOLDD = "#a67f2e";
const VER = "#c04a38", VERD = "#8f2c22", JADE = "#7fae9c", PALE = "#efe7d5";

const blossom = (x, y, s, c = "#f3d9dd") => `
  <g transform="translate(${x},${y}) scale(${s})">
    ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4.2" rx="2.6" ry="3.6" fill="${c}" transform="rotate(${a})"/>`).join("")}
    <circle r="1.6" fill="${GOLD}"/>
  </g>`;

const petal = (x, y, r, c = "#f3d9dd") => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.9" fill="${c}" opacity="0.85" transform="rotate(${r} ${x} ${y})"/>`;

// A story-scale figure (taller, more elegant than the game chibi).
function figure({ x, y, s = 1, robe, trim, face = FACE, crown = "", hair = "wide", lift = false, ghost = false }) {
  const sleeveL = lift
    ? `M-20 34 Q-38 22 -42 4 q6 -2 10 2 Q-30 20 -16 28 Z`
    : `M-20 34 Q-30 44 -32 62 q6 3 10 0 Q-24 48 -14 40 Z`;
  const hairPath = hair === "wide"
    ? `M-16 -14 Q-18 -34 0 -35 Q18 -34 16 -14 Q8 -24 0 -24 Q-8 -24 -16 -14 Z`
    : `M-15 -15 Q-15 -33 0 -34 Q15 -33 15 -15 Q6 -23 0 -23 Q-6 -23 -15 -15 Z`;
  return `<g transform="translate(${x},${y}) scale(${s})" ${ghost ? `opacity="0.85"` : ""}>
    <path d="M-22 30 Q-26 74 -28 108 L28 108 Q26 74 22 30 Q0 22 -22 30 Z"
      fill="${ghost ? "url(#ghostFade)" : robe}" stroke="${ghost ? "none" : INK}" stroke-width="1.6"/>
    <path d="M-9 32 Q0 28 9 32 L7 60 Q0 64 -7 60 Z" fill="${trim}" opacity="0.9"/>
    <path d="${sleeveL}" fill="${PALE}" ${ghost ? `opacity="0.7"` : ""}/>
    <path d="M20 34 Q30 44 32 62 q-6 3 -10 0 Q24 48 14 40 Z" fill="${PALE}" ${ghost ? `opacity="0.7"` : ""}/>
    <g>
      <path d="${hairPath}" fill="${INK}"/>
      <ellipse cx="0" cy="-8" rx="14.5" ry="16" fill="${face}"/>
      ${crown}
      <path d="M-7 -12 q3 -3 6 -1 M1 -13 q3 -2 6 0" stroke="${INK}" stroke-width="1.3" fill="none"/>
      <circle cx="-4.5" cy="-8" r="1.3" fill="${INK}"/><circle cx="5.5" cy="-8" r="1.3" fill="${INK}"/>
      <path d="M-6 -10 q-3 -2 -5 0 M6 -10 q3 -2 5 0" stroke="${VER}" stroke-width="1" fill="none" opacity="0.6"/>
      <path d="M-2.6 -1 q2.6 2 5.2 0" stroke="${VERD}" stroke-width="1.4" fill="none"/>
    </g>
  </g>`;
}

const phoenixCrown = `
  <path d="M-12 -20 Q0 -30 12 -20" fill="none" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="0" cy="-27" r="2.6" fill="${VER}"/>
  <circle cx="-9" cy="-23" r="1.8" fill="${GOLD}"/><circle cx="9" cy="-23" r="1.8" fill="${GOLD}"/>
  <path d="M-3 -30 q3 -4 6 0" stroke="${GOLD}" stroke-width="1.4" fill="none"/>`;

const scholarCap = `
  <path d="M-11 -20 L11 -20 L8 -27 L-8 -27 Z" fill="${INK}"/>
  <path d="M8 -24 q7 -2 10 3" stroke="${INK}" stroke-width="2" fill="none"/>`;

const SCENES = {
  // 帝女花 — princess & consort beneath falling blossoms, under a pale moon
  prologue: `<svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="212" cy="66" r="52" fill="${GOLD}" opacity="0.14"/>
    <circle cx="212" cy="66" r="52" fill="none" stroke="${GOLD}" stroke-width="1.4" opacity="0.4"/>
    <path d="M310 8 Q246 16 210 44 Q236 46 258 40" fill="none" stroke="${GOLDD}" stroke-width="3" opacity="0.8"/>
    <path d="M262 30 q-10 8 -22 10 M282 22 q-8 8 -18 12" stroke="${GOLDD}" stroke-width="2" fill="none" opacity="0.7"/>
    ${blossom(252, 34, 1.15)}${blossom(226, 48, 0.95)}${blossom(274, 46, 0.8)}${blossom(206, 38, 0.7)}
    ${figure({ x: 140, y: 108, s: 0.94, robe: VER, trim: GOLD, crown: phoenixCrown })}
    ${figure({ x: 206, y: 116, s: 0.9, robe: "#31556b", trim: PALE, crown: scholarCap, hair: "narrow" })}
    ${petal(112, 78, 24)}${petal(178, 60, -18)}${petal(244, 96, 40)}${petal(128, 150, -30)}${petal(262, 152, 12)}${petal(96, 118, 60)}
    <path d="M60 226 Q150 214 240 226" stroke="${GOLD}" stroke-width="1" opacity="0.35" fill="none"/>
  </svg>`,

  // 紫釵記 — the purple jade hairpin held to the moon-window, sparks of fate
  sang: `<svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="196" cy="104" r="86" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.35"/>
    <circle cx="196" cy="104" r="76" fill="${GOLD}" opacity="0.05"/>
    <g transform="rotate(-34 196 104)">
      <rect x="140" y="100" width="120" height="7" rx="3.5" fill="#7a5a94" stroke="${INK}" stroke-width="1.2"/>
      <path d="M140 103 l-18 -7 q-5 7 0 14 Z" fill="#9b79bd" stroke="${INK}" stroke-width="1.2"/>
      <circle cx="264" cy="103" r="9" fill="${GOLD}" stroke="${GOLDD}" stroke-width="1.6"/>
      <circle cx="264" cy="103" r="3.6" fill="#7a5a94"/>
      <path d="M270 110 q6 10 2 20 M262 112 q0 10 -6 18" stroke="${GOLD}" stroke-width="1.6" fill="none"/>
      <circle cx="272" cy="132" r="2.2" fill="${VER}"/><circle cx="255" cy="132" r="2.2" fill="${VER}"/>
    </g>
    ${figure({ x: 130, y: 132, s: 0.86, robe: "#31556b", trim: GOLD, crown: scholarCap, hair: "narrow", lift: true })}
    ${[[236, 44], [150, 58], [258, 168], [116, 84]].map(([x, y]) =>
      `<path d="M${x} ${y - 5} L${x + 1.6} ${y - 1} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1} Z" fill="${GOLD}" opacity="0.8"/>`).join("")}
  </svg>`,

  // 再世紅梅記 — the ghost beneath a sweep of red plum
  daan: `<svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="ghostFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PALE}" stop-opacity="0.95"/>
      <stop offset="0.72" stop-color="${PALE}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${PALE}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="M310 26 Q220 30 168 66 Q210 64 246 82 Q196 88 170 116" fill="none" stroke="#6d3a34" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
    ${blossom(206, 52, 1.2, "#e26a72")}${blossom(246, 78, 1.0, "#e26a72")}${blossom(174, 70, 0.85, "#e26a72")}
    ${blossom(230, 96, 0.75, "#e26a72")}${blossom(186, 108, 0.9, "#e26a72")}
    ${figure({ x: 176, y: 128, s: 0.92, robe: PALE, trim: JADE, ghost: true, lift: true })}
    <path d="M120 210 q30 -12 60 0 q30 12 60 0" stroke="${PALE}" stroke-width="2" opacity="0.28" fill="none"/>
    <path d="M140 224 q26 -10 52 0 q26 10 52 0" stroke="${PALE}" stroke-width="1.6" opacity="0.18" fill="none"/>
    ${petal(140, 92, 30, "#e26a72")}${petal(258, 128, -20, "#e26a72")}${petal(120, 150, 50, "#e26a72")}
  </svg>`,

  // 單刀會 — Guan Yu, green robe and great glaive, over the river
  zing: `<svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="120" cy="60" r="44" fill="${VER}" opacity="0.10"/>
    <g transform="translate(196,108) scale(1.04)">
      <rect x="26" y="-86" width="6" height="180" rx="3" fill="#5a3c22" stroke="${INK}" stroke-width="1.2"/>
      <path d="M29 -86 Q64 -74 60 -34 Q46 -52 29 -54 Z" fill="#b9c4c9" stroke="${INK}" stroke-width="1.6"/>
      <path d="M33 -58 q10 4 16 12" stroke="${INK}" stroke-width="1.2" fill="none" opacity="0.5"/>
      <circle cx="29" cy="-50" r="4" fill="${GOLD}"/>
      <path d="M29 -46 q-6 12 -2 20 M29 -46 q4 12 0 20" stroke="${VER}" stroke-width="2" fill="none"/>
      <path d="M-22 30 Q-26 74 -28 104 L28 104 Q26 74 22 30 Q0 22 -22 30 Z" fill="#2e6650" stroke="${INK}" stroke-width="1.6"/>
      <path d="M-9 32 Q0 28 9 32 L7 58 Q0 62 -7 58 Z" fill="${GOLD}" opacity="0.9"/>
      <path d="M-20 34 Q-32 46 -34 64 q6 3 10 0 Q-26 50 -14 40 Z" fill="#3f7a60"/>
      <path d="M20 34 Q28 40 30 50 L26 -50 q-4 -2 -6 0 Z" fill="#3f7a60"/>
      <path d="M-13 -15 Q-13 -32 0 -33 Q13 -32 13 -15 Q5 -22 0 -22 Q-5 -22 -13 -15 Z" fill="${INK}"/>
      <ellipse cx="0" cy="-8" rx="14" ry="15.5" fill="#b8483a"/>
      <path d="M-11 -18 Q0 -25 11 -18 L11 -13 Q0 -19 -11 -13 Z" fill="${GOLD}" opacity="0.9"/>
      <path d="M-8 -12 q3 -4 7 -2 M1 -14 q4 -2 7 1" stroke="${INK}" stroke-width="1.6" fill="none"/>
      <circle cx="-4.5" cy="-8" r="1.4" fill="${INK}"/><circle cx="5.5" cy="-8" r="1.4" fill="${INK}"/>
      <path d="M-7 0 Q0 4 7 0 L5 34 Q0 46 -5 34 Z" fill="${INK}"/>
      <path d="M-3 -2 q3 2 6 0" stroke="${VERD}" stroke-width="1.2" fill="none"/>
    </g>
    <path d="M60 206 q26 -12 52 0 q26 12 52 0 q26 -12 52 0" stroke="${JADE}" stroke-width="2.4" fill="none" opacity="0.5"/>
    <path d="M80 222 q24 -10 48 0 q24 10 48 0 q24 -10 48 0" stroke="${JADE}" stroke-width="1.8" fill="none" opacity="0.3"/>
  </svg>`,
};

export function storyScene(worldId) {
  return SCENES[worldId] || "";
}
