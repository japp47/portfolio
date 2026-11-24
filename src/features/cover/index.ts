import { prefersReducedMotion } from '../../lib/media';

/**
 * The writing cover's dot field: a ground plane of dots receding to a horizon, rolling slowly,
 * lifting where the pointer passes. The home hero's idea on a plain 2D canvas, so this page
 * never pays for three.js. It stops drawing while off screen or in a background tab, and draws a
 * single still frame under reduced motion.
 */

const POINTER_RADIUS = 120;

export function mountCoverField(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fg = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#ededea';
  const still = prefersReducedMotion();

  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let spacing = 0;
  let visible = true;
  let frame = 0;
  const pointer = { x: -1e4, y: -1e4, strength: 0, target: 0 };

  function resize(): void {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    // denser on a narrow screen, more rows on a tall one, so a phone gets a field, not a few lines
    spacing = Math.min(18, Math.max(10, width / 40));
    rows = Math.round(Math.min(24, Math.max(12, height / 24)));
    cols = Math.ceil(width / spacing) + 12; // extra columns so the receding rows still reach the edges
    if (still) draw(0);
  }

  function draw(t: number): void {
    ctx!.clearRect(0, 0, width, height);
    ctx!.fillStyle = fg;
    pointer.strength += (pointer.target - pointer.strength) * 0.08;

    const cx = width / 2;
    for (let r = 0; r < rows; r++) {
      const depth = (r + 1) / rows; // 0 at the horizon, 1 at the front
      const baseY = 10 + (height - 24) * depth ** 1.7; // rows bunch up towards the horizon
      const spread = spacing * (0.3 + 0.7 * depth);
      const amp = 4 + 14 * depth;

      for (let c = 0; c < cols; c++) {
        const x = cx + (c - cols / 2) * spread;
        if (x < -4 || x > width + 4) continue;

        const wave =
          Math.sin(c * 0.32 + r * 0.55 + t * 0.0009) * 0.65 +
          Math.sin(c * 0.11 - r * 0.3 + t * 0.0005) * 0.35;
        let y = baseY - wave * amp;

        // the pointer lifts what is under it
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / POINTER_RADIUS) * pointer.strength;
        y -= near * 18;

        const crest = (wave + 1) / 2;
        ctx!.globalAlpha = Math.min(1, 0.08 + 0.42 * depth + 0.25 * crest * depth + near * 0.6);
        const size = 0.6 + 1.3 * depth + near * 1.2;
        ctx!.beginPath();
        ctx!.arc(x, y, size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    ctx!.globalAlpha = 1;
  }

  function loop(t: number): void {
    draw(t);
    frame = requestAnimationFrame(loop);
  }

  function start(): void {
    if (still || frame || !visible || document.hidden) return;
    frame = requestAnimationFrame(loop);
  }

  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  if (still) return;

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  addEventListener(
    'pointermove',
    (e) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = e.clientX - box.left;
      pointer.y = e.clientY - box.top;
      pointer.target = 1;
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => (pointer.target = 0));

  start();
}
