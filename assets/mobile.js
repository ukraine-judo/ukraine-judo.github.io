/* =========================================================================
   MOBILE layout module
   Mounted only while (max-width: 899px) matches. Hover does not exist here:
   every affordance is a drag, a snap, a press or a tilt.
   ========================================================================= */

import { $, $$, clamp, Disposer, track, lockScroll, unlockScroll } from "./core.js";
import { createField } from "./field.js";
import { createRig } from "./rig.js";
import { createWiring } from "./wiring.js";
import { createBracket } from "./bracket.js";

/* Short, optional haptic tick. Silently ignored where unsupported. */
const tap = (pattern = 8) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
};

/* -------------------------------------------------- bottom sheet + drag */

const mountSheet = (disposer) => {
  const sheet = $("[data-sheet]");
  if (!sheet) return null;

  const panel = $(".m-sheet__panel", sheet);
  const grip = $("[data-sheet-grip]", sheet);
  const toggles = $$("[data-sheet-open]");
  let lastFocused = null;

  const open = () => {
    if (sheet.dataset.open === "true") return;
    lastFocused = document.activeElement;
    sheet.dataset.open = "true";
    sheet.setAttribute("aria-hidden", "false");
    lockScroll();
    toggles.forEach((toggle) => toggle.setAttribute("aria-expanded", "true"));
    panel.style.removeProperty("--sheet-drag");
    track("sheet_open");
    tap();
  };

  const close = () => {
    if (sheet.dataset.open !== "true") return;
    sheet.dataset.open = "false";
    sheet.setAttribute("aria-hidden", "true");
    unlockScroll();
    delete sheet.dataset.dragging;
    panel.style.removeProperty("--sheet-drag");
    toggles.forEach((toggle) => toggle.setAttribute("aria-expanded", "false"));
    if (lastFocused instanceof HTMLElement) lastFocused.focus({ preventScroll: true });
  };

  toggles.forEach((toggle) => disposer.on(toggle, "click", open));
  $$("[data-sheet-close]", sheet).forEach((node) => disposer.on(node, "click", close));
  $$("[data-sheet-link]", sheet).forEach((node) => disposer.on(node, "click", close));
  $$(".m-sheet__cases a, .m-sheet__cta", sheet).forEach((node) => disposer.on(node, "click", close));
  disposer.on(document, "keydown", (event) => {
    if (event.key === "Escape") close();
  });
  disposer.on(window, "portfolio:navigate", close);

  /* Drag-to-dismiss. A fast flick beats distance, an upward pull rubber-bands
     instead of hitting a wall, and `pointercancel` is handled because iOS
     reclaims pointer streams the moment it suspects a system gesture. */
  if (grip) {
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let offset = 0;
    let dragging = false;

    disposer.on(grip, "pointerdown", (event) => {
      dragging = true;
      startY = lastY = event.clientY;
      lastT = event.timeStamp;
      velocity = 0;
      offset = 0;
      sheet.dataset.dragging = "true";
      grip.setPointerCapture(event.pointerId);
    });

    disposer.on(grip, "pointermove", (event) => {
      if (!dragging) return;
      const delta = event.clientY - startY;
      const elapsed = event.timeStamp - lastT || 16;
      velocity = (event.clientY - lastY) / elapsed;
      lastY = event.clientY;
      lastT = event.timeStamp;
      offset = delta < 0 ? -Math.sqrt(-delta) * 3 : delta;
      panel.style.setProperty("--sheet-drag", `${offset}px`);
    });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      delete sheet.dataset.dragging;
      const flicked = velocity > 0.55;
      const dragged = offset > panel.offsetHeight * 0.32;
      if (flicked || dragged) {
        close();
      } else {
        panel.style.removeProperty("--sheet-drag");
        tap(6);
      }
    };

    disposer.on(grip, "pointerup", end);
    disposer.on(grip, "pointercancel", end);
  }

  disposer.add(close);
  return { open, close };
};

/* ------------------------------------------------------ dock auto-hiding */

const mountDock = (disposer) => {
  const dock = $("[data-dock]");
  if (!dock) return;

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const goingDown = y > lastY + 6;
    const goingUp = y < lastY - 6;
    if (goingDown && y > 260) dock.dataset.hidden = "true";
    else if (goingUp || y < 120) dock.dataset.hidden = "false";
    lastY = y;
  };

  disposer.on(window, "scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
};

/* ---------------------------------------------------- snap carousel rail */

const mountCarousel = (disposer, root, { onSnap } = {}) => {
  if (!root) return;
  const track = $("[data-carousel-track], [data-steps-track]", root);
  const progress = $("[data-carousel-progress]", root);
  const dotsHost = $("[data-steps-dots]", root);
  const slides = $$("[data-carousel-slide], [data-steps-slide]", track || root);
  if (!track || !slides.length) return;

  let dots = [];
  if (dotsHost) {
    dotsHost.replaceChildren(...slides.map(() => document.createElement("i")));
    dots = Array.from(dotsHost.children);
  }

  let index = -1;
  let ticking = false;

  const update = () => {
    ticking = false;
    const max = track.scrollWidth - track.clientWidth;
    const ratio = max <= 0 ? 0 : track.scrollLeft / max;

    if (progress) {
      progress.style.setProperty("--carousel-progress", `${ratio * 100}%`);
    }

    const next = clamp(Math.round(ratio * (slides.length - 1)), 0, slides.length - 1);
    if (next === index) return;
    index = next;
    dots.forEach((dot, i) => dot.toggleAttribute("data-active", i === index));
    onSnap?.(index);
  };

  disposer.on(track, "scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  update();
};

/* ------------------------------------------- touch + tilt for the field */

const mountFieldInput = (disposer, canvas, field) => {
  if (!canvas || !field) return;
  const host = canvas.parentElement || canvas;

  const toLocal = (touch) => {
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  disposer.on(host, "touchstart", (event) => {
    const point = toLocal(event.touches[0]);
    field.poke(point.x, point.y, 1);
  }, { passive: true });

  disposer.on(host, "touchmove", (event) => {
    const point = toLocal(event.touches[0]);
    field.poke(point.x, point.y, 1);
  }, { passive: true });

  disposer.on(host, "touchend", () => field.release(), { passive: true });

  /* Device tilt, only where it is granted without a prompt (Android). iOS
     requires an explicit gesture-triggered permission call, so we do not
     nag for it — touch already covers the interaction. */
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission !== "function") {
    disposer.on(window, "deviceorientation", (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const gamma = clamp((event.gamma || 0) / 45, -1, 1);
      const beta = clamp(((event.beta || 45) - 45) / 45, -1, 1);
      field.poke(
        rect.width * (0.5 + gamma * 0.42),
        rect.height * (0.5 + beta * 0.42),
        0.55
      );
    });
  }
};

/* ------------------------------------------------------------------ mount */

export const mount = () => {
  const disposer = new Disposer();

  mountSheet(disposer);
  mountDock(disposer);

  const fieldCanvas = $("[data-field]");
  if (fieldCanvas) {
    const field = createField(fieldCanvas, {
      spacing: 52,
      drift: 18,
      pointerRadius: 150,
      pointerPush: 40
    });
    disposer.add(() => field.destroy());
    mountFieldInput(disposer, fieldCanvas, field);
  }

  $$("[data-rig]").forEach((node) => {
    // A device switcher is meaningless on a phone: show the product 1:1, and
    // never pull a whole second website over cellular unprompted. Both choices
    // are passed per mount so the authored markup stays the source of truth
    // when the desktop layout takes the same node back.
    const rig = createRig(node, {
      viewport: "phone",
      defer: node.dataset.rigRemote === "true"
    });
    disposer.add(() => rig.destroy());
  });

  $$("[data-wiring]").forEach((node) => {
    const wiring = createWiring(node);
    disposer.add(() => wiring.destroy());
  });

  $$("[data-bracket]").forEach((node) => {
    const bracket = createBracket(node);
    disposer.add(() => bracket.destroy());
  });

  mountCarousel(disposer, $("[data-carousel]"), { onSnap: () => tap(6) });
  mountCarousel(disposer, $("[data-steps]"), { onSnap: () => tap(6) });

  /* Mobile tabs collapse into a snap row; keep the click behaviour only. */
  $$("[data-tab]").forEach((tab) => {
    disposer.on(tab, "click", () => {
      const key = tab.dataset.tab;
      $$("[data-tab]").forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
      $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === key));
      tap(6);
      track("tab", key);
    });
  });

  return {
    destroy() {
      disposer.dispose();
    }
  };
};
