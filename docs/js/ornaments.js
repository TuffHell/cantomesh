// Static traditional-heritage ornaments (no animation — replaces the old ink
// canvas). A layered 山水 (mountains-and-mist) scene, 祥云 clouds, and a mountain
// footer, all in ink + gold + seal-red, tuned to the paper palette.

const INK = "34,29,24";
const GOLD = "#a9802f";
const SEAL = "#b23a2e";

// One stylized 祥云 (ruyi cloud), pale fill + faint gold outline.
function cloud(x, y, s) {
  return `<g transform="translate(${x},${y}) scale(${s})">
    <path d="M0,18 q-2,-18 20,-15 q4,-15 24,-7 q16,-14 28,4 q20,-3 15,17 q16,4 4,16 q-8,7 -20,3 q-14,7 -30,1 q-16,6 -28,-4 q-14,-5 -5,-18 Z"
      fill="#fbf7ee" fill-opacity="0.62" stroke="${GOLD}" stroke-opacity="0.38" stroke-width="1.4"/>
    <path d="M12,20 q10,-6 22,-1 M40,17 q12,-4 20,4" fill="none" stroke="${GOLD}" stroke-opacity="0.3" stroke-width="1.2"/>
  </g>`;
}

// One pine-tree silhouette for foreground detail.
function pine(x, y, s) {
  return `<g transform="translate(${x},${y}) scale(${s})" fill="rgba(${INK},0.5)">
    <rect x="-2" y="0" width="4" height="26" rx="1"/>
    <path d="M0,-34 L16,-6 L-16,-6 Z"/><path d="M0,-20 L20,10 L-20,10 Z"/>
  </g>`;
}

export function heroScene() {
  return `<svg class="hero-scene" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- sun / moon disc -->
    <circle cx="980" cy="150" r="74" fill="${SEAL}" opacity="0.12"/>
    <circle cx="980" cy="150" r="74" fill="none" stroke="${SEAL}" stroke-width="2" opacity="0.28"/>
    <!-- distant range -->
    <path d="M0,352 C150,300 300,332 430,300 C580,262 720,322 880,292 C1010,268 1120,300 1200,286 L1200,520 L0,520 Z" fill="rgba(${INK},0.055)"/>
    <!-- mist band -->
    <rect x="0" y="330" width="1200" height="60" fill="#faf6ec" opacity="0.5"/>
    <!-- mid range -->
    <path d="M0,420 C120,378 230,402 350,358 C480,312 570,382 710,360 C850,338 970,300 1090,342 C1140,360 1180,352 1200,348 L1200,520 L0,520 Z" fill="rgba(${INK},0.10)"/>
    ${cloud(120, 150, 1.5)}${cloud(560, 110, 1.1)}${cloud(360, 210, 1.2)}
    <!-- near hills -->
    <path d="M0,472 C170,440 320,472 470,452 C650,428 770,472 950,456 C1060,446 1150,464 1200,460 L1200,520 L0,520 Z" fill="rgba(${INK},0.17)"/>
    ${pine(220, 452, 1.05)}${pine(1010, 456, 0.9)}
  </svg>`;
}

export function mountainFooter() {
  return `<svg class="footer-mtn" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0,120 L0,74 C150,44 300,82 450,58 C620,30 760,78 920,60 C1050,46 1150,68 1200,62 L1200,120 Z" fill="rgba(${INK},0.10)"/>
    <path d="M0,120 L0,96 C180,74 340,100 520,86 C700,72 840,102 1010,90 C1110,82 1170,94 1200,90 L1200,120 Z" fill="rgba(${INK},0.16)"/>
  </svg>`;
}
