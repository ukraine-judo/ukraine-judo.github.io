/* =========================================================================
   motosh.dev — live frames
   The stands are the real sites, not screenshots. Each slot renders its site
   at a true window width and scales the whole thing down to the mount.

   Two loading modes. A slot marked `data-frame-eager` is built as soon as
   the curtain is off — those are the hero cards, and a hero that is three
   grey rectangles is the whole reason this page was rebuilt. Everything else
   waits until it is 300px from the viewport.

   The labelled placeholder stays underneath at all times: a host that
   refuses to be embedded then degrades to its own name rather than to a
   white void, and there is no way to detect that refusal from this side of
   the origin boundary.
   ========================================================================= */

import { onFrame } from "./watch.js";
import { trackLoad } from "./loading.js";

const DESKTOP = [1440, 900];
const PHONE = [390, 844];

/* The render width is a property of the slot, not of the file. A stand at
   full column width shows 1440; a hero thumbnail shows 1280, because the
   narrower viewport leaves the site's own type larger relative to the mount
   and the thumbnail stays readable. */
function sizeOf(slot) {
  const declared = (slot.dataset.frameSize || "").split("x").map(Number);
  if (declared.length === 2 && declared.every((n) => n > 0)) return declared;
  return slot.hasAttribute("data-frame-phone") ? PHONE : DESKTOP;
}

function fit(slot) {
  const frame = slot.firstElementChild;
  if (!frame) return;
  const w = slot.clientWidth;
  const h = slot.clientHeight;
  if (!w || !h) return;
  const [bw, bh] = sizeOf(slot);
  // Cover, not contain: the mount must never show a strip of its own
  // background under a site that is the wrong shape for it.
  const scale = Math.max(w / bw, h / bh);
  const next = `scale(${scale.toFixed(4)})`;
  if (slot.dataset.fit === next) return;
  slot.dataset.fit = next;
  frame.style.transform = next;
}

function build(slot) {
  if (slot.dataset.built === "true") return;
  slot.dataset.built = "true";

  const [bw, bh] = sizeOf(slot);
  const frame = document.createElement("iframe");
  frame.src = slot.dataset.frame;
  frame.title = slot.dataset.frameTitle || "";
  frame.loading = "lazy";
  frame.tabIndex = -1;
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("referrerpolicy", "no-referrer");
  frame.style.width = `${bw}px`;
  frame.style.height = `${bh}px`;
  slot.append(frame);
  trackLoad(slot, frame);
  fit(slot);
}

export function mountFrames() {
  const slots = Array.from(document.querySelectorAll("[data-frame]"));
  if (!slots.length) return;

  let waiting = [];

  slots.forEach((slot) => {
    if (slot.hasAttribute("data-frame-eager")) build(slot);
    else waiting.push(slot);
  });

  onFrame(() => {
    const h = window.innerHeight || document.documentElement.clientHeight;

    waiting = waiting.filter((slot) => {
      const r = slot.getBoundingClientRect();
      if (r.top > h + 300 || r.bottom < -300) return true;
      build(slot);
      return false;
    });

    // Built frames keep their scale in step with the mount: the stand
    // changes size on hover, and the whole grid changes at 900px.
    slots.forEach((slot) => {
      if (slot.dataset.built === "true") fit(slot);
    });

    return true;
  });
}

/* Used by the case-page rig, which owns its own stage and scaling. */
export { build as buildFrame, fit as fitFrame };
