/* =========================================================================
   motosh.dev — ambient field
   A 40px lattice of dots drifting under a pixel behind the closing band. It
   is the quietest thing on the page and the only one that never stops.

   Drawing is skipped while the canvas is off screen or the tab is hidden —
   the loop keeps its own clock, so the pattern is wherever it would have
   been when the band comes back into view. Browsers already throttle rAF in
   a background tab; this only avoids the paint.
   ========================================================================= */

const GAP = 40;

function draw(canvas, time) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  for (let x = GAP / 2; x < w; x += GAP) {
    for (let y = GAP / 2; y < h; y += GAP) {
      const p = Math.sin(time * 0.5 + x * 0.01 + y * 0.014);
      ctx.beginPath();
      ctx.arc(x, y + p * 0.9, Math.max(1.1 + p * 0.105, 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.07 + p * 0.03})`;
      ctx.fill();
    }
  }
}

export function mount() {
  const canvases = Array.from(document.querySelectorAll("[data-ambient]"));
  if (!canvases.length) return;

  const step = (t) => {
    if (!document.hidden) {
      const h = window.innerHeight || document.documentElement.clientHeight;
      canvases.forEach((canvas) => {
        const r = canvas.getBoundingClientRect();
        if (r.bottom < 0 || r.top > h) return;
        draw(canvas, t / 1000);
      });
    }
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}
