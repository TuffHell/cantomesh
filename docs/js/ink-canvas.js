// Live 水墨 (ink-wash) canvas — a taste of the §2.1 motion-tracked ink trails.
// Ambient drifting ink clouds + cursor-driven brush trails, with wet-ink fade.
// Honors prefers-reduced-motion (renders a single static wash, no animation loop).

const PAPER = "244, 239, 230";   // --paper
const INK = "26, 23, 20";        // warm near-black
const VERMILION = "178, 58, 46"; // rare accent droplet

export function startInkCanvas(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, dpr;
  const particles = [];
  const clouds = [];
  let lastPointer = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(innerWidth * dpr);
    H = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.fillStyle = `rgb(${PAPER})`;
    ctx.fillRect(0, 0, W, H);
    if (reduce) drawStatic();
  }

  // Slow-breathing ambient ink clouds for atmosphere.
  function seedClouds() {
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * W, y: Math.random() * H,
        r: (120 + Math.random() * 220) * dpr,
        vx: (Math.random() - 0.5) * 0.12 * dpr,
        vy: (Math.random() - 0.5) * 0.12 * dpr,
        a: 0.012 + Math.random() * 0.02,
      });
    }
  }

  function drawCloud(c) {
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0, `rgba(${INK}, ${c.a})`);
    g.addColorStop(1, `rgba(${INK}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    c.x += c.vx; c.y += c.vy;
    if (c.x < -c.r) c.x = W + c.r; if (c.x > W + c.r) c.x = -c.r;
    if (c.y < -c.r) c.y = H + c.r; if (c.y > H + c.r) c.y = -c.r;
  }

  // An ink particle: a soft dab that blooms then fades, leaving a wet trail.
  function spawn(x, y, vx, vy, size, accent) {
    if (particles.length > 320) return;
    particles.push({
      x, y, vx, vy,
      size: size * dpr,
      life: 1,
      decay: 0.012 + Math.random() * 0.02,
      accent,
    });
  }

  function emitTrail(x, y) {
    x *= dpr; y *= dpr;
    if (lastPointer) {
      const dx = x - lastPointer.x, dy = y - lastPointer.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.min(6, Math.floor(dist / (6 * dpr)) + 1);
      const speed = Math.min(dist / 8, 6);
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const px = lastPointer.x + dx * t, py = lastPointer.y + dy * t;
        const accent = Math.random() < 0.04;
        spawn(px + (Math.random() - 0.5) * 6 * dpr,
              py + (Math.random() - 0.5) * 6 * dpr,
              dx * 0.02, dy * 0.02,
              4 + speed + Math.random() * 6, accent);
      }
    }
    lastPointer = { x, y };
  }

  function drawParticle(p) {
    const r = p.size * (0.6 + 0.8 * p.life);
    const color = p.accent ? VERMILION : INK;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, `rgba(${color}, ${0.5 * p.life})`);
    g.addColorStop(0.6, `rgba(${color}, ${0.18 * p.life})`);
    g.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.96; p.vy *= 0.96;
    p.vy += 0.02 * dpr; // ink settles downward
    p.life -= p.decay;
  }

  // Occasional self-emitted droplet so the canvas lives without a cursor.
  let tick = 0;
  function ambientDroplet() {
    if (tick % 90 === 0) {
      spawn(Math.random() * W, Math.random() * H * 0.9,
            (Math.random() - 0.5) * 0.3, 0.2,
            10 + Math.random() * 18, Math.random() < 0.08);
    }
  }

  function drawStatic() {
    seedClouds.length && null;
    clouds.length || seedClouds();
    clouds.forEach(drawCloud);
  }

  function frame() {
    tick++;
    // Wet-ink fade: translucent paper wash smears trails as they age.
    ctx.fillStyle = `rgba(${PAPER}, 0.08)`;
    ctx.fillRect(0, 0, W, H);
    clouds.forEach(drawCloud);
    ambientDroplet();
    for (let i = particles.length - 1; i >= 0; i--) {
      drawParticle(particles[i]);
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    requestAnimationFrame(frame);
  }

  addEventListener("resize", resize, { passive: true });
  resize();
  seedClouds();
  if (reduce) { drawStatic(); return; }

  addEventListener("pointermove", (e) => emitTrail(e.clientX, e.clientY), { passive: true });
  addEventListener("pointerleave", () => { lastPointer = null; });
  requestAnimationFrame(frame);
}
