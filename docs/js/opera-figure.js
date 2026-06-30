// Interactive cartoon 粤剧 performer — a chibi opera character with flowing
// 水袖 (water sleeves) that drift toward the cursor, blink, sway (idle), and
// strike a 亮相 (frozen pose) on tap. Pure SVG + a light rAF loop; honors
// prefers-reduced-motion (renders a calm static pose, no loop).
//
//   const fig = createOperaFigure({ role: "daan" });
//   container.append(fig.el);
//   fig.pose();        // trigger a 亮相
//   fig.destroy();

const ROLES = {
  daan: { robe: "#c43a5a", robe2: "#8f2c3e", trim: "#e8b84b", face: "#fbeae6",
          blush: "#e0506e", lip: "#b3203a", hair: "#1c1614", feather: "#2f6f5f" },
  sang: { robe: "#b23a2e", robe2: "#7e2418", trim: "#e8b84b", face: "#f6e7d2",
          blush: "#c0563f", lip: "#9f2a1f", hair: "#1c1614", feather: "#b8893a" },
};

const NS = "http://www.w3.org/2000/svg";

export function createOperaFigure({ role = "daan", size = 220 } = {}) {
  const p = ROLES[role] || ROLES.daan;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 200 290");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size * 1.45);
  svg.setAttribute("class", "opera-figure");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "粤剧角色");
  svg.innerHTML = markup(p);

  // animated handles
  const head = svg.querySelector(".of-head");
  const eyes = svg.querySelectorAll(".of-eye");
  const leftSleeve = svg.querySelector(".of-sleeve-l");
  const rightSleeve = svg.querySelector(".of-sleeve-r");
  const featherL = svg.querySelector(".of-feather-l");
  const featherR = svg.querySelector(".of-feather-r");

  // sleeve anchors (hands)
  const LH = { x: 64, y: 150 }, RH = { x: 136, y: 150 };
  const LEN = 86;

  const state = { t: 0, impulse: 0, px: 100, py: 150, blink: 0, raf: 0 };

  function sleevePath(hand, dir) {
    const swing = Math.sin(state.t * 1.6 + (dir > 0 ? 0 : Math.PI)) * 10;
    // pointer pull: hand on the cursor side lifts its sleeve outward/up
    const pull = ((state.px - hand.x) / 120) * 14 * dir;
    const lift = Math.max(0, (150 - state.py) / 150) * 22;
    const imp = state.impulse * 46 * dir; // 亮相 flick: sleeves snap outward + up
    const impUp = state.impulse * 40;
    const midX = hand.x + swing * 0.5 + pull * 0.5 + imp * 0.5;
    const midY = hand.y + LEN * 0.5 - lift * 0.4 - impUp * 0.4;
    const tipX = hand.x + swing + pull + imp;
    const tipY = hand.y + LEN - lift - impUp;
    return `M ${hand.x} ${hand.y} Q ${midX} ${midY} ${tipX} ${tipY}`;
  }

  function frame() {
    state.t += 0.016;
    state.impulse *= 0.9;
    // idle breathing + pointer/impulse head tilt
    const tilt = (state.px - 100) / 100 * 5 + state.impulse * 8;
    const bob = Math.sin(state.t * 1.2) * 1.6;
    head.setAttribute("transform", `rotate(${tilt} 100 86) translate(0 ${bob})`);
    // blink
    state.blink = (state.blink + 0.016) % 3.4;
    const closed = state.blink > 3.25;
    eyes.forEach((e) => e.setAttribute("transform", closed ? "scale(1 0.1)" : "scale(1 1)"));
    // feathers sway + flick on pose
    const fsway = Math.sin(state.t * 1.4) * 4 + state.impulse * 14;
    featherL.setAttribute("transform", `rotate(${-fsway} 86 40)`);
    featherR.setAttribute("transform", `rotate(${fsway} 114 40)`);
    // sleeves
    leftSleeve.setAttribute("d", sleevePath(LH, -1));
    rightSleeve.setAttribute("d", sleevePath(RH, 1));
    state.raf = requestAnimationFrame(frame);
  }

  function onMove(e) {
    const r = svg.getBoundingClientRect();
    state.px = ((e.clientX - r.left) / r.width) * 200;
    state.py = ((e.clientY - r.top) / r.height) * 290;
  }
  function pose() { state.impulse = 1; }

  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerdown", pose);
  svg.style.cursor = "pointer";

  if (reduce) {
    leftSleeve.setAttribute("d", `M ${LH.x} ${LH.y} Q ${LH.x - 6} ${LH.y + 43} ${LH.x - 10} ${LH.y + LEN}`);
    rightSleeve.setAttribute("d", `M ${RH.x} ${RH.y} Q ${RH.x + 6} ${RH.y + 43} ${RH.x + 10} ${RH.y + LEN}`);
  } else {
    state.raf = requestAnimationFrame(frame);
  }

  return {
    el: svg,
    pose,
    destroy() { cancelAnimationFrame(state.raf); svg.removeEventListener("pointermove", onMove); svg.remove(); },
  };
}

function markup(p) {
  return `
    <!-- robe -->
    <path d="M70 150 Q60 210 50 280 L150 280 Q140 210 130 150 Q100 138 70 150 Z"
          fill="${p.robe}" stroke="${p.robe2}" stroke-width="2"/>
    <path d="M100 150 L100 280" stroke="${p.robe2}" stroke-width="2" opacity="0.5"/>
    <path d="M84 156 Q100 150 116 156 L112 196 Q100 204 88 196 Z" fill="${p.trim}" opacity="0.9"/>
    <!-- water sleeves (animated) -->
    <path class="of-sleeve-l" d="" fill="none" stroke="#fdfbf6" stroke-width="17" stroke-linecap="round"/>
    <path class="of-sleeve-r" d="" fill="none" stroke="#fdfbf6" stroke-width="17" stroke-linecap="round"/>
    <!-- head group -->
    <g class="of-head">
      <!-- headdress feathers -->
      <path class="of-feather-l" d="M86 44 Q70 8 80 -4" fill="none" stroke="${p.feather}" stroke-width="3.4" stroke-linecap="round"/>
      <path class="of-feather-r" d="M114 44 Q130 8 120 -4" fill="none" stroke="${p.feather}" stroke-width="3.4" stroke-linecap="round"/>
      <!-- hair -->
      <path d="M64 78 Q60 36 100 34 Q140 36 136 78 Q120 60 100 60 Q80 60 64 78 Z" fill="${p.hair}"/>
      <circle cx="72" cy="58" r="11" fill="${p.hair}"/><circle cx="128" cy="58" r="11" fill="${p.hair}"/>
      <!-- face -->
      <ellipse cx="100" cy="86" rx="33" ry="36" fill="${p.face}"/>
      <!-- headdress band -->
      <path d="M68 56 Q100 40 132 56" fill="none" stroke="${p.trim}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="48" r="4.5" fill="${p.lip}"/>
      <circle cx="84" cy="51" r="3" fill="${p.trim}"/><circle cx="116" cy="51" r="3" fill="${p.trim}"/>
      <!-- opera blush sweep -->
      <path d="M74 84 Q86 70 100 78 Q86 88 74 84 Z" fill="${p.blush}" opacity="0.55"/>
      <path d="M126 84 Q114 70 100 78 Q114 88 126 84 Z" fill="${p.blush}" opacity="0.55"/>
      <!-- brows -->
      <path d="M78 76 Q86 70 94 74" stroke="#241a16" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M122 76 Q114 70 106 74" stroke="#241a16" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <!-- eyes -->
      <g class="of-eye" style="transform-origin:86px 86px"><ellipse cx="86" cy="86" rx="5.4" ry="6" fill="#fff"/><circle cx="86" cy="87" r="3.2" fill="#1c1410"/></g>
      <g class="of-eye" style="transform-origin:114px 86px"><ellipse cx="114" cy="86" rx="5.4" ry="6" fill="#fff"/><circle cx="114" cy="87" r="3.2" fill="#1c1410"/></g>
      <!-- 额妆 dot + lips -->
      <path d="M100 64 q3 4 0 8 q-3 -4 0 -8 Z" fill="${p.lip}"/>
      <path d="M93 102 Q100 108 107 102 Q100 99 93 102 Z" fill="${p.lip}"/>
    </g>`;
}
