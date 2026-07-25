/* =========================================================================
   Device rig
   The embedded product is rendered at a REAL viewport width and scaled to
   fit the stage — so switching Desktop / Tablet / Phone triggers the site's
   actual breakpoints instead of showing three screenshots.
   Same-origin embeds additionally get a scripted guided tour.
   ========================================================================= */

import { $, $$, clamp, track } from "./core.js";

/* Real window sizes, width AND height. The height matters: a phone is not a
   short wide box, and a rig that keeps one fixed frame for all three would be
   lying about what the site looks like on each. */
const VIEWPORTS = {
  desktop: { width: 1600, height: 900, label: "Комп’ютер" },
  tablet: { width: 834, height: 1112, label: "Планшет" },
  phone: { width: 390, height: 844, label: "Телефон" }
};

/**
 * @param {Element} root
 * @param {{viewport?: string, defer?: boolean}} options
 *   Per-mount overrides. They are passed in rather than written onto the node,
 *   because both layouts mount over the SAME element: a layout that stamped its
 *   choice into the DOM would leave the other one booting from it.
 */
export const createRig = (root, options = {}) => {
  if (!root) return { destroy() {} };

  const stage = $("[data-rig-stage]", root);
  const canvas = $("[data-rig-canvas]", root);
  const iframe = $("iframe", root);
  const readout = $("[data-rig-readout]", root);
  const gate = $("[data-rig-gate]", root);
  // The guided-tour rail sits BESIDE the frame, not inside it, so it has to be
  // looked up from the surrounding block.
  const tourRoot = $("[data-rig-tour]", root) || $("[data-rig-tour]", root.parentElement || root);
  if (!stage || !canvas || !iframe) return { destroy() {} };

  /* Both layouts mount over the SAME element. Whatever this instance mutates
     on the shared node has to be handed back on destroy, or the next layout
     inherits a phone viewport, a stripped iframe and a stale defer button. */
  const initial = {
    viewport: root.dataset.rigViewport,
    src: iframe.getAttribute("src")
  };

  const sameOrigin = !iframe.src.startsWith("http") || iframe.src.startsWith(window.location.origin);
  let viewport = options.viewport || root.dataset.rigViewport || "desktop";
  let interactive = false;

  /* ---- scaling ---------------------------------------------------------- */

  /* How tall the stage is allowed to grow. Each layout sets its own ceiling
     through a custom property, so the desktop and the phone can disagree. */
  const stageCeiling = () => {
    const raw = getComputedStyle(root).getPropertyValue("--rig-max-h").trim();
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value : 620;
  };

  const layout = () => {
    const spec = VIEWPORTS[viewport] || VIEWPORTS.desktop;
    // Measure the rig, not the stage: the stage's own size is what we are
    // about to set, so measuring it would make the calculation feed on itself.
    const available = root.clientWidth;
    if (!available) return;

    /* Fit the whole window: never wider than the column, never taller than the
       ceiling, and never scaled above 1:1 — a phone shown bigger than life
       would defeat the point of emulating it. */
    const scale = clamp(Math.min(available / spec.width, stageCeiling() / spec.height), 0.2, 1);

    // The stage wraps the device on BOTH axes, so picking a phone turns the
    // frame into a phone-shaped card instead of stranding a narrow site in the
    // middle of a wide letterbox.
    stage.style.width = `${Math.round(spec.width * scale)}px`;
    stage.style.height = `${Math.round(spec.height * scale)}px`;
    canvas.style.width = `${spec.width}px`;
    canvas.style.height = `${spec.height}px`;
    canvas.style.transform = `scale(${scale})`;
    root.dataset.rigViewport = viewport;

    if (readout) {
      // The emulated window, then how far it is scaled down to fit the stage.
      readout.textContent = `${spec.width} × ${spec.height} · ${Math.round(scale * 100)}%`;
    }
  };

  const setViewport = (next) => {
    if (!VIEWPORTS[next] || next === viewport) return;
    viewport = next;
    $$("[data-rig-viewport]", root).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.rigViewport === viewport));
    });
    layout();
    track("rig_viewport", viewport);
  };

  /* ---- loading ---------------------------------------------------------- */

  let startedAt = Date.now();
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    const remaining = Math.max(0, 900 - (Date.now() - startedAt));
    window.setTimeout(() => root.dataset.rigLoaded = "true", remaining);
  };

  /* On a phone, silently downloading an entire second website over mobile
     data is rude. Ask first — and say what it costs. */
  let deferred = null;
  if (options.defer === true && iframe.getAttribute("src")) {
    iframe.dataset.src = iframe.getAttribute("src");
    iframe.removeAttribute("src");
    root.dataset.rigDeferred = "true";

    deferred = document.createElement("button");
    deferred.type = "button";
    deferred.className = "rig__defer";

    const deferLabel = document.createElement("span");
    deferLabel.className = "pill pill--ink";
    deferLabel.textContent = "Завантажити живий сайт";

    const deferHint = document.createElement("span");
    deferHint.className = "mono";
    deferHint.textContent = root.dataset.rigDeferHint || "Відкриється справжній сайт усередині сторінки";

    deferred.append(deferLabel, deferHint);
    deferred.addEventListener("click", () => {
      delete root.dataset.rigDeferred;
      startedAt = Date.now();
      iframe.src = iframe.dataset.src;
      iframe.addEventListener("load", settle, { once: true });
      window.setTimeout(settle, 9000);
      deferred.remove();
      track("rig_load");
    }, { once: true });
    stage.append(deferred);
  } else {
    iframe.addEventListener("load", settle, { once: true });
    window.setTimeout(settle, 9000);
  }

  /* ---- interaction gate ------------------------------------------------- */

  const openGate = () => {
    if (interactive) return;
    interactive = true;
    root.dataset.rigInteractive = "true";
    track("rig_interact");
  };

  const closeGate = () => {
    interactive = false;
    delete root.dataset.rigInteractive;
  };

  const onGateClick = () => openGate();
  const onOutsideClick = (event) => {
    if (interactive && !root.contains(event.target)) closeGate();
  };
  gate?.addEventListener("click", onGateClick);
  document.addEventListener("click", onOutsideClick);

  /* ---- guided tour (same-origin only) ----------------------------------- */

  let tour = null;
  if (sameOrigin && tourRoot) {
    const steps = $$("[data-rig-step]", tourRoot).map((node) => ({
      node,
      target: node.dataset.rigStep,
      offset: Number(node.dataset.rigOffset || 0)
    }));

    let index = -1;
    let playing = false;
    let timer = 0;

    const goTo = (nextIndex, { user = false } = {}) => {
      if (!steps.length) return;
      index = (nextIndex + steps.length) % steps.length;
      steps.forEach((step, i) => step.node.setAttribute("aria-current", String(i === index)));

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      const target = steps[index].target === "top" ? null : doc.querySelector(steps[index].target);
      const top = target ? target.getBoundingClientRect().top + win.scrollY + steps[index].offset : 0;
      win.scrollTo({ top, behavior: "smooth" });
      if (user) track("rig_tour_step", steps[index].target);
    };

    const stop = () => {
      playing = false;
      window.clearInterval(timer);
      tourRoot.dataset.playing = "false";
    };

    const play = () => {
      if (playing || !steps.length) return;
      playing = true;
      tourRoot.dataset.playing = "true";
      goTo(index + 1);
      timer = window.setInterval(() => goTo(index + 1), 3400);
      track("rig_tour_play");
    };

    const onTourClick = (event) => {
      const stepButton = event.target.closest("[data-rig-step]");
      if (stepButton) {
        stop();
        goTo(steps.findIndex((step) => step.node === stepButton), { user: true });
        return;
      }
      if (event.target.closest("[data-rig-play]")) {
        playing ? stop() : play();
      }
    };

    tourRoot.addEventListener("click", onTourClick);
    iframe.addEventListener("load", () => goTo(0), { once: true });

    tour = {
      destroy() {
        stop();
        tourRoot.removeEventListener("click", onTourClick);
      }
    };
  } else if (tourRoot) {
    // A cross-origin frame cannot be driven; say so instead of faking it.
    tourRoot.hidden = true;
  }

  /* ---- wiring ----------------------------------------------------------- */

  const onClick = (event) => {
    const button = event.target.closest("[data-rig-viewport]");
    if (button) setViewport(button.dataset.rigViewport);
  };
  root.addEventListener("click", onClick);

  // Observe the rig: the stage is JS-sized, so observing it would loop.
  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(root);

  layout();
  $$("[data-rig-viewport]", root).forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.rigViewport === viewport));
  });

  return {
    setViewport,
    destroy() {
      tour?.destroy();
      resizeObserver.disconnect();
      root.removeEventListener("click", onClick);
      gate?.removeEventListener("click", onGateClick);
      document.removeEventListener("click", onOutsideClick);

      // Hand the shared node back exactly as it was found.
      deferred?.remove();
      if (initial.src !== null && !iframe.getAttribute("src")) iframe.src = initial.src;
      if (initial.viewport) root.dataset.rigViewport = initial.viewport;
      else delete root.dataset.rigViewport;
      $$("[data-rig-viewport]", root).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.rigViewport === (initial.viewport || "desktop")));
      });
      delete root.dataset.rigDeferred;
      delete root.dataset.rigInteractive;
      stage.style.removeProperty("width");
      stage.style.removeProperty("height");
      canvas.style.removeProperty("width");
      canvas.style.removeProperty("height");
      canvas.style.removeProperty("transform");
    }
  };
};

