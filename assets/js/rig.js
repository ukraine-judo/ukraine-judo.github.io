/* =========================================================================
   motosh.dev — device rig

   The live site in a real window. The segmented control switches that
   window's width and nothing else: the container's own width for desktop,
   834 for tablet, 390 for phone. Everything on screen follows from it.

   Three decisions shape this:

   1. the desktop width is the container's, so the desktop view is 1:1. The
      previous rig rendered a fixed 1440 into a 1185 stage and spent its life
      stating "82%" — a viewer that is never at full size is a screenshot
      with extra steps;
   2. the switch is animated, not swapped. The frame's box is transitioned
      and the embedded site reflows through the widths in front of the
      reader. That reflow is the entire reason for showing three of them;
   3. there is no full-screen mode. It existed to make the frame drivable,
      and a viewer that has to take over the page to be useful is not useful
      where it stands. The frame stays a picture; the marked link under the
      stand opens the real site.
   ========================================================================= */

import { onFrame } from "./watch.js";
import { trackLoad } from "./loading.js";

/* A desktop layout needs a desktop's worth of room. At or above this the
   render width is simply the container's and the view is 1:1; below it the
   site is still rendered wide and scaled down, because a "desktop" that has
   quietly become the mobile layout is telling the reader nothing. */
const DESKTOP_MIN = 1024;

const WIDTHS = { tablet: 834, phone: 390 };

/* Build once the stand is within a screen of the viewport. A full
   third-party site is the heaviest thing on a case page; it should not be
   fetched for a visitor who bounces off the lockup. */
const NEAR = 600;

function layout(rig) {
  const stage = rig.querySelector("[data-rig-stage]");
  const scaler = rig.querySelector("[data-rig-scaler]");
  const read = rig.querySelector("[data-rig-scale]");
  if (!stage) return;

  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  if (!sw || !sh) return;

  const device = rig.dataset.device || "desktop";
  const width = WIDTHS[device] || Math.max(DESKTOP_MIN, Math.round(sw));

  // Only ever shrink. A 390px render blown up to fill a 1200px stage is a
  // phone screenshot, not a phone.
  const scale = Math.min(1, sw / width);

  // The window is as tall as the stage. Above 100% that is the stage's own
  // height; scaled down it has to be divided back out, or the render would
  // land short of the bottom and leave the stage half empty.
  const height = Math.round(sh / scale);

  if (read) {
    // Two parts, because a narrow phone keeps only the percentage: the
    // segmented control already says which width is on the stage, so the
    // number that is new information there is how far it has been shrunk.
    const dims = read.querySelector("[data-rig-dims]");
    const pct = read.querySelector("[data-rig-pct]");
    const size = `${width} × ${height}`;
    const ratio = `${Math.round(scale * 100)}%`;
    if (dims && dims.textContent !== size) dims.textContent = size;
    if (pct && pct.textContent !== ratio) pct.textContent = ratio;
  }

  if (!scaler) return;

  // Written only on a real change. This runs every frame, and re-declaring
  // the width the frame already has is how a CSS transition gets talked out
  // of ever finishing.
  const next = `${width}|${height}|${scale.toFixed(4)}|${device}`;
  if (scaler.dataset.fit === next) return;
  scaler.dataset.fit = next;

  scaler.style.width = `${width}px`;
  scaler.style.height = `${height}px`;
  scaler.style.transform = `translateX(-50%) scale(${scale.toFixed(4)})`;
  // The device's own corner, divided back out of the scale so it lands at
  // the intended radius on screen rather than at the scaled-down one.
  scaler.style.borderRadius = `${((device === "desktop" ? 6 : 22) / scale).toFixed(1)}px`;
}

export function mount() {
  const rigs = Array.from(document.querySelectorAll("[data-rig]"));
  if (!rigs.length) return;

  rigs.forEach((rig) => {
    const stage = rig.querySelector("[data-rig-stage]");
    const buttons = Array.from(rig.querySelectorAll("[data-device]"));

    const setDevice = (device) => {
      rig.dataset.device = device;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.device === device)));
      layout(rig);
    };

    buttons.forEach((b) => b.addEventListener("click", () => setDevice(b.dataset.device)));

    const build = () => {
      if (rig.dataset.built === "true" || !stage) return;
      rig.dataset.built = "true";

      const scaler = document.createElement("div");
      scaler.className = "rig__scaler";
      scaler.setAttribute("data-rig-scaler", "");

      const frame = document.createElement("iframe");
      frame.src = rig.dataset.rig;
      frame.title = rig.dataset.rigTitle || "";
      frame.setAttribute("referrerpolicy", "no-referrer");

      scaler.append(frame);
      stage.append(scaler);
      trackLoad(stage, frame);

      // The first layout must not animate: there is nothing to travel from,
      // and a frame that slides in from the wrong width on load reads as a
      // glitch rather than as a switch.
      scaler.style.transition = "none";
      layout(rig);
      // rAF is starved in a backgrounded tab, and a rig that comes back with
      // its transition still suppressed switches widths by teleporting.
      const arm = () => { scaler.style.transition = ""; };
      requestAnimationFrame(arm);
      setTimeout(arm, 120);
    };

    // A phone-width render is legible in a 335px stage; a desktop one is a
    // thumbnail. Start where the visitor can actually read something.
    setDevice(rig.dataset.device || (window.innerWidth < 900 ? "phone" : "desktop"));

    // Autoload: warm on approach, then keep the window honest as the stage
    // changes with the window and again at 900px.
    onFrame(() => {
      if (rig.dataset.built !== "true") {
        const r = rig.getBoundingClientRect();
        const h = window.innerHeight || document.documentElement.clientHeight;
        if (r.top < h + NEAR && r.bottom > -NEAR) build();
      }
      layout(rig);
      return true;
    });
  });
}
