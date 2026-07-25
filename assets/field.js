/* =========================================================================
   Ambient lattice field
   A hairline structural mesh that breathes on value noise and yields to the
   pointer. Monochrome: dove edges, ink nodes — the only chroma is the warm
   orb the design system already sanctions, and that lives in CSS.
   Cheap by construction: ~230 nodes, one canvas, paused when off-screen.
   ========================================================================= */

import { clamp, lerp, ticker } from "./core.js";

/* ---- deterministic value noise (no dependencies, no Math.random drift) -- */

const hash = (x, y) => {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
};

const smooth = (t) => t * t * (3 - 2 * t);

const noise2d = (x, y) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const n00 = hash(x0, y0);
  const n10 = hash(x0 + 1, y0);
  const n01 = hash(x0, y0 + 1);
  const n11 = hash(x0 + 1, y0 + 1);
  return lerp(lerp(n00, n10, fx), lerp(n01, n11, fx), fy);
};

/* ------------------------------------------------------------------ field */

export const createField = (canvas, {
  spacing = 66,
  drift = 26,
  pointerRadius = 190,
  pointerPush = 46,
  intensity = 1
} = {}) => {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return { destroy() {} };

  const styles = getComputedStyle(document.documentElement);
  const edgeColor = styles.getPropertyValue("--color-dove").trim() || "#d5d9e2";
  const nodeColor = styles.getPropertyValue("--color-jet-ink").trim() || "#0a0a0a";

  let nodes = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let running = false;
  let time = 0;

  const pointer = { x: -9999, y: -9999, active: false, strength: 0, target: 1 };

  const build = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;
    nodes = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        nodes.push({
          col,
          row,
          ox: (col - 0.5) * spacing,
          oy: (row - 0.5) * spacing,
          x: 0,
          y: 0,
          energy: 0
        });
      }
    }
    nodes.cols = cols;
    nodes.rows = rows;
  };

  const nodeAt = (col, row) => {
    if (col < 0 || row < 0 || col >= nodes.cols || row >= nodes.rows) return null;
    return nodes[row * nodes.cols + col];
  };

  const step = (delta) => {
    time += delta;
    const t = time * 0.00016;

    for (const node of nodes) {
      const nx = noise2d(node.col * 0.42 + t * 1.3, node.row * 0.42 - t);
      const ny = noise2d(node.col * 0.42 - t, node.row * 0.42 + t * 1.1);
      let x = node.ox + (nx - 0.5) * drift * 2 * intensity;
      let y = node.oy + (ny - 0.5) * drift * 2 * intensity;

      let energy = 0;
      if (pointer.active) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < pointerRadius) {
          const falloff = 1 - distance / pointerRadius;
          const push = falloff * falloff * pointerPush * pointer.strength;
          const angle = Math.atan2(dy, dx);
          x += Math.cos(angle) * push;
          y += Math.sin(angle) * push;
          energy = falloff * falloff * pointer.strength;
        }
      }

      node.x = x;
      node.y = y;
      node.energy = energy;
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);

    // Edges: hairline mesh, opacity falls off with stretch.
    context.lineWidth = 1;
    for (let row = 0; row < nodes.rows; row += 1) {
      for (let col = 0; col < nodes.cols; col += 1) {
        const node = nodeAt(col, row);
        if (!node) continue;
        const right = nodeAt(col + 1, row);
        const down = nodeAt(col, row + 1);

        for (const neighbour of [right, down]) {
          if (!neighbour) continue;
          const stretch = Math.hypot(neighbour.x - node.x, neighbour.y - node.y) / spacing;
          const heat = Math.max(node.energy, neighbour.energy);
          const alpha = clamp(0.5 - Math.abs(stretch - 1) * 1.6, 0.04, 0.5) * (0.55 + heat * 0.9);
          context.globalAlpha = alpha;
          context.strokeStyle = heat > 0.35 ? nodeColor : edgeColor;
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(neighbour.x, neighbour.y);
          context.stroke();
        }
      }
    }

    // Nodes: ink dots that wake up near the pointer.
    for (const node of nodes) {
      const radius = 1 + node.energy * 2.6;
      context.globalAlpha = 0.18 + node.energy * 0.72;
      context.fillStyle = nodeColor;
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
  };

  /* Exponential approach in both directions: the field wakes up quickly and
     lets go slowly, and neither end of the curve has a corner in it. A linear
     ramp reached zero with a visible snap. */
  const ATTACK_MS = 140;
  const RELEASE_MS = 520;

  const frameStep = (delta) => {
    const goal = pointer.active ? pointer.target : 0;
    const tau = goal > pointer.strength ? ATTACK_MS : RELEASE_MS;
    pointer.strength += (goal - pointer.strength) * (1 - Math.exp(-delta / tau));
    if (pointer.strength < 0.001) pointer.strength = 0;
    step(delta);
    draw();
  };

  const start = () => {
    if (running) return;
    running = true;
    ticker.add(frameStep);
  };

  const stop = () => {
    if (!running) return;
    running = false;
    ticker.remove(frameStep);
  };

  /* ---- input ----
     The canvas sits behind the hero content, so binding the listener to the
     canvas layer meant that moving onto a heading or a button fired
     `pointerleave` and killed the effect. Tracking happens on the window and
     engagement is decided by geometry, so text and buttons no longer punch
     holes in the field. */

  const EDGE = 120; // keep responding just outside the canvas, so edges do not clip

  const onPointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointer.x = x;
    pointer.y = y;
    pointer.target = 1;
    pointer.active =
      x >= -EDGE && y >= -EDGE && x <= rect.width + EDGE && y <= rect.height + EDGE;
  };

  const onPointerLeave = (event) => {
    // Only when the pointer actually leaves the window, not the canvas layer.
    if (event.relatedTarget === null) pointer.active = false;
  };

  const onBlur = () => { pointer.active = false; };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerout", onPointerLeave, { passive: true });
  window.addEventListener("blur", onBlur);

  const resizeObserver = new ResizeObserver(() => {
    build();
  });
  resizeObserver.observe(canvas);

  const visibility = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
  }, { threshold: 0 });
  visibility.observe(canvas);

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") stop();
    else start();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  build();
  start();

  return {
    /** Nudge the field from outside (used by the mobile tilt handler). */
    poke(x, y, strength = 1) {
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.target = strength;
    },
    release() {
      pointer.active = false;
    },
    destroy() {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerLeave);
      window.removeEventListener("blur", onBlur);
      context.clearRect(0, 0, width, height);
    }
  };
};
