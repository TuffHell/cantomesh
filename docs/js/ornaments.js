// Static traditional-heritage ornaments — a painterly ink 山水 (mountains-and-mist)
// scene with atmospheric depth, a pavilion, pines and cranes, plus a mountain
// footer. Ink + gold + seal-red, tuned to the paper palette. No animation.

const INK = "34,29,24";
const GOLD = "#a9802f";
const SEAL = "#b23a2e";

function pine(x, y, s) {
  return `<g transform="translate(${x},${y}) scale(${s})" fill="rgba(${INK},0.55)">
    <rect x="-1.6" y="0" width="3.2" height="24" rx="1"/>
    <path d="M0 -32 L14 -6 L-14 -6 Z"/><path d="M0 -19 L18 9 L-18 9 Z"/></g>`;
}
function crane(x, y, s) {
  return `<path transform="translate(${x},${y}) scale(${s})" d="M0 0 q7 -6 13 -1 q6 -5 13 0"
    fill="none" stroke="rgba(${INK},0.4)" stroke-width="1.6" stroke-linecap="round"/>`;
}
function pavilion(x, y, s) {
  return `<g transform="translate(${x},${y}) scale(${s})" fill="rgba(${INK},0.5)" stroke="rgba(${INK},0.5)">
    <path d="M-20 0 Q0 -13 20 0 Q14 -4 12 -3 L-12 -3 Q-14 -4 -20 0 Z"/>
    <path d="M-20 0 q-5 -7 3 -9 M20 0 q5 -7 -3 -9" fill="none" stroke-width="1.4"/>
    <rect x="-13" y="0" width="2.4" height="15"/><rect x="10.6" y="0" width="2.4" height="15"/>
    <path d="M-15 15 h30" stroke-width="1.6"/></g>`;
}

export function heroScene() {
  return `<svg class="hero-scene" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="mtnFar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(${INK},0.09)"/><stop offset="1" stop-color="rgba(${INK},0.02)"/>
      </linearGradient>
      <linearGradient id="mtnMid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(${INK},0.16)"/><stop offset="1" stop-color="rgba(${INK},0.05)"/>
      </linearGradient>
      <linearGradient id="mtnNear" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(${INK},0.24)"/><stop offset="1" stop-color="rgba(${INK},0.10)"/>
      </linearGradient>
      <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#faf6ec" stop-opacity="0"/><stop offset="0.55" stop-color="#faf6ec" stop-opacity="0.85"/><stop offset="1" stop-color="#faf6ec" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- sun -->
    <circle cx="985" cy="140" r="72" fill="${SEAL}" opacity="0.11"/>
    <circle cx="985" cy="140" r="72" fill="none" stroke="${SEAL}" stroke-width="1.6" opacity="0.26"/>
    ${crane(150, 120, 3.2)}${crane(300, 90, 2.4)}${crane(240, 150, 2)}

    <!-- distant range -->
    <path d="M0 340 C150 286 300 320 430 288 C580 250 720 312 880 282 C1010 258 1120 292 1200 278 L1200 520 L0 520 Z" fill="url(#mtnFar)"/>
    <rect x="0" y="300" width="1200" height="80" fill="url(#mist)"/>

    <!-- mid range + pavilion -->
    <path d="M0 410 C120 366 230 392 350 346 C480 300 570 372 710 350 C850 328 970 288 1090 332 C1140 350 1180 342 1200 338 L1200 520 L0 520 Z" fill="url(#mtnMid)"/>
    ${pavilion(760, 356, 1.15)}
    <rect x="0" y="392" width="1200" height="60" fill="url(#mist)" opacity="0.7"/>

    <!-- near range + pines -->
    <path d="M0 470 C170 436 320 470 470 448 C650 424 770 470 950 452 C1060 442 1150 462 1200 458 L1200 520 L0 520 Z" fill="url(#mtnNear)"/>
    ${pine(210, 452, 1.1)}${pine(250, 460, 0.8)}${pine(1010, 456, 0.95)}
  </svg>`;
}

export function mountainFooter() {
  return `<svg class="footer-mtn" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0 120 L0 74 C150 44 300 82 450 58 C620 30 760 78 920 60 C1050 46 1150 68 1200 62 L1200 120 Z" fill="rgba(${INK},0.09)"/>
    <path d="M0 120 L0 96 C180 74 340 100 520 86 C700 72 840 102 1010 90 C1110 82 1170 94 1200 90 L1200 120 Z" fill="rgba(${INK},0.16)"/>
  </svg>`;
}
