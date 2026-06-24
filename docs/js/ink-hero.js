// Contained, crisp ink animation for the hero band only.
// Unlike a full-page smear, this fully clears each frame (no muddy buildup) and
// keeps ink at low opacity behind the title so text stays perfectly legible.
// Flowing 水袖-like ribbons drift continuously; the pointer leaves short ink trails.

const INK = "26, 23, 20";
const VERMILION = "178, 58, 46";

export function startInkHero(canvas) {
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, dpr, t = 0;
  const trail = [];
  const ribbons = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    H = canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  }

  function seed() {
    for (let i = 0; i < 3; i++) {
      ribbons.push({
        y: H * (0.3 + 0.2 * i),
        amp: H * (0.12 + Math.random() * 0.1),
        len: W * (0.5 + Math.random() * 0.4),
        speed: 0.0008 + Math.random() * 0.0009,
        phase: Math.random() * Math.PI * 2,
        width: (10 + Math.random() * 16) * dpr,
        alpha: 0.05 + Math.random() * 0.04,
        dir: i % 2 ? 1 : -1,
      });
    }
  }

  // A single brush ribbon drawn as a tapering, semi-transparent sine path.
  function drawRibbon(r) {
    const x0 = r.dir > 0 ? -W * 0.1 : W * 1.1;
    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const x = x0 + r.dir * r.len * p * 1.4;
      const y = r.y + Math.sin(r.phase + p * 6 + t * r.speed * 1000) * r.amp * (1 - Math.abs(p - 0.5));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${INK}, ${r.alpha})`;
    ctx.lineWidth = r.width;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function addTrail(x, y) {
    const rect = canvas.getBoundingClientRect();
    trail.push({ x: (x - rect.left) * dpr, y: (y - rect.top) * dpr, life: 1, r: (8 + Math.random() * 10) * dpr });
    if (trail.length > 90) trail.shift();
  }

  function drawTrail() {
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      const accent = i === trail.length - 1 && Math.random() < 0.02;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (1.6 - p.life));
      const c = accent ? VERMILION : INK;
      g.addColorStop(0, `rgba(${c}, ${0.22 * p.life})`);
      g.addColorStop(1, `rgba(${c}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1.6 - p.life), 0, Math.PI * 2);
      ctx.fill();
      p.life -= 0.02;
      if (p.life <= 0) trail.splice(i, 1);
    }
  }

  function frame() {
    t++;
    ctx.clearRect(0, 0, W, H);     // crisp: no fade smear
    ribbons.forEach((r) => { r.phase += r.speed * 16; drawRibbon(r); });
    drawTrail();
    requestAnimationFrame(frame);
  }

  addEventListener("resize", () => { resize(); }, { passive: true });
  resize();
  seed();
  if (reduce) { ribbons.forEach(drawRibbon); return; }
  canvas.parentElement.addEventListener("pointermove", (e) => addTrail(e.clientX, e.clientY), { passive: true });
  requestAnimationFrame(frame);
}
