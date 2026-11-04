<script lang="ts">
  // One celebratory burst of card-frame-coloured confetti. Skipped for reduced motion.
  let canvas: HTMLCanvasElement;

  const COLORS = ['#f2c84b', '#f07a3a', '#4c8ff0', '#9b5de5', '#f4f1ff', '#25c2a0', '#e8459a', '#2bd47d'];

  $effect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = (canvas.width = innerWidth * dpr);
    const h = (canvas.height = innerHeight * dpr);

    const parts = Array.from({ length: 170 }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        x: fromLeft ? 0 : w,
        y: h * 0.75,
        vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 14) * dpr,
        vy: -(14 + Math.random() * 16) * dpr,
        size: (6 + Math.random() * 8) * dpr,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: COLORS[i % COLORS.length],
      };
    });

    const start = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const age = t - start;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - 2000) / 800);
      for (const p of parts) {
        p.vy += 0.55 * dpr;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#0c0720';
        ctx.lineWidth = 1.5 * dpr;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.strokeRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.restore();
      }
      if (age < 2800) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 100;
  }
</style>
