interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
  shape: "rect" | "circle";
}

const PARTICLE_COUNT = 90;
const GRAVITY = 0.12;
const DRAG = 0.992;
const LIFETIME_MS = 2800;

function themeColors(): string[] {
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#2a63c7";
  const primary = styles.getPropertyValue("--text-primary").trim() || "#16181c";
  return [accent, accent, accent, primary, "#e4e2dc", "#f2b134"];
}

/**
 * Hand-rolled canvas confetti burst — no dependency. The canvas overlays the
 * viewport, runs one rAF loop, and removes itself when done. Skipped entirely
 * for users who prefer reduced motion.
 */
export function burstConfetti(originX?: number, originY?: number): void {
  if (typeof window === "undefined") {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const colors = themeColors();
  const cx = originX ?? window.innerWidth / 2;
  const cy = originY ?? window.innerHeight / 2;

  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 6 + Math.random() * 9;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() < 0.7 ? "rect" : "circle",
    };
  });

  const startedAt = performance.now();

  const frame = (now: number): void => {
    const elapsed = now - startedAt;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const fade = Math.max(0, 1 - elapsed / LIFETIME_MS);

    for (const p of particles) {
      p.vy += GRAVITY;
      p.vx *= DRAG;
      p.vy *= DRAG;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (elapsed < LIFETIME_MS) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(frame);
}
