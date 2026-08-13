/* =========================================================================
   motosh.dev — motion
   The intro curtain, the arrival curtain, the scroll reveal and the hero
   parallax.

   There is no `prefers-reduced-motion` branch anywhere in this project. The
   design states the choice outright — the page animates always — and the
   previous build inverted it, which left the site frozen for anyone whose
   system had the setting on.

   Entry is decided by geometry, not by IntersectionObserver: one rect read
   per node inside a rAF that only runs after a scroll or a resize. That is
   cheap at this node count and, unlike an observer, it cannot silently fail
   to fire in a document that is not compositing.
   ========================================================================= */

import { onFrame } from "./watch.js";

const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

const root = document.documentElement;
const desktop = window.matchMedia("(min-width: 900px)");

export const lockScroll = (on) => {
  document.body.dataset.locked = on ? "true" : "false";
};

/* -------------------------------------------------------------------------
   SCROLL REVEAL
   ---------------------------------------------------------------------- */
export function mountReveal() {
  const nodes = $$("[data-reveal] > *").filter((el) => !el.hasAttribute("data-no-reveal"));
  if (!nodes.length) return;

  nodes.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.setProperty("--reveal-order", String(i % 4));
  });

  let pending = nodes.slice();

  const check = () => {
    const h = window.innerHeight || root.clientHeight;
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      // Only what is still below the fold is held back. A block the visitor
      // has already scrolled past — a deep link, a flick of the wheel — has
      // arrived by definition, and testing its bottom edge as well would
      // leave it hidden for the rest of the session.
      if (r.top > h * 0.9) return true;
      el.classList.add("is-in");
      return false;
    });
    return pending.length > 0;
  };

  onFrame(check);
}

/* -------------------------------------------------------------------------
   HERO PARALLAX
   The cluster drifts against the scroll, at most 70px, desktop only.
   ---------------------------------------------------------------------- */
export function mountParallax() {
  const cluster = $("[data-cluster]");
  if (!cluster) return;

  let last = "";

  const step = () => {
    if (!desktop.matches) {
      if (last !== "") { cluster.style.transform = ""; last = ""; }
      return true;
    }
    const rect = cluster.getBoundingClientRect();
    if (rect.bottom < -120) return true;
    const top = document.scrollingElement?.scrollTop ?? window.scrollY ?? 0;
    const next = `translateY(${Math.max(-70, -top * 0.055).toFixed(1)}px)`;
    if (next !== last) {
      last = next;
      cluster.style.transform = next;
    }
    return true;
  };

  onFrame(step);
}

/* -------------------------------------------------------------------------
   ENTRANCE
   A page opens in exactly one of three ways, decided before the first paint
   by the inline script in the head:

     has-intro   the first arrival of the session. Paper covers the screen,
                 the name arrives, a rule draws itself, the sheet lifts.
     has-gate    the page was reached through a transition — the home→case
                 morph or the ink wipe between pages. The ink panel is
                 already on screen; it lifts and the lockup follows it in.
     neither     a reload, a deep link, a step back through history. Nothing
                 covers the page; the content is simply there.

   The previous build ran a curtain on every load of every document. Coming
   back to the home page replayed the whole two-second name card, and an
   ordinary link from one case to another flashed the ink panel with no
   morph in front of it — which is the "buggy" part of the transitions.
   ---------------------------------------------------------------------- */
export function mountEntrance(onDone) {
  const intro = $("[data-intro]");
  const gate = $("[data-arrival]");

  if (intro && root.classList.contains("has-intro")) return playIntro(intro, onDone);
  if (gate && root.classList.contains("has-gate")) return playGate(gate, onDone);

  root.classList.remove("has-intro", "has-gate");
  if (intro) intro.remove();
  $$("[data-hero]").forEach((el) => { el.style.cssText = ""; });
  const nav = $("[data-nav]");
  if (nav) nav.style.cssText = "";
  onDone();
}

/* -------------------------------------------------------------------------
   INTRO CURTAIN  (home, first visit of the session)
   ---------------------------------------------------------------------- */
function playIntro(curtain, onDone) {
  const heroItems = $$("[data-hero]");
  const nav = $("[data-nav]");

  const clear = () => {
    heroItems.forEach((el) => { el.style.cssText = ""; });
    if (nav) nav.style.cssText = "";
  };

  const mark = $("[data-intro-mark]", curtain);
  const role = $("[data-intro-role]", curtain);
  const line = $("[data-intro-line]", curtain);
  const at = (ms, fn) => setTimeout(fn, ms);

  lockScroll(true);

  // Held back from script only: with JS off the hero was never hidden.
  heroItems.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = el.hasAttribute("data-hero-card")
      ? "translateY(34px) scale(0.96)"
      : "translateY(26px)";
  });

  if (nav) {
    nav.style.opacity = "0";
    nav.style.transform = "translateY(-16px)";
  }

  requestAnimationFrame(() => {
    [[mark, 0], [role, 90]].forEach(([el, delay]) => {
      if (!el) return;
      el.style.transition = `opacity 520ms ease ${delay}ms, transform 660ms var(--ease-out) ${delay}ms`;
      el.style.opacity = "1";
      el.style.transform = "none";
    });

    if (line) {
      line.style.transition = "transform 900ms var(--ease-line) 140ms";
      line.style.transform = "scaleX(1)";
    }
  });

  const revealHero = () => {
    if (nav) {
      nav.style.transition = "opacity 520ms ease, transform 780ms var(--ease-out)";
      nav.style.opacity = "1";
      nav.style.transform = "none";
    }

    heroItems.forEach((el) => {
      const delay = (Number(el.dataset.hero) || 0) * 78;
      el.style.transition = `opacity 640ms ease ${delay}ms, transform 920ms var(--ease-out) ${delay}ms`;
      el.style.opacity = "1";
      el.style.transform = "translateY(0) scale(1)";
    });

    // Drop the inline transitions so they cannot fight the hovers.
    at(2000, clear);
  };

  const out = () => {
    [mark, role].forEach((el) => {
      if (!el) return;
      el.style.transition = "opacity 260ms ease";
      el.style.opacity = "0";
    });

    curtain.style.transition = "transform 840ms var(--ease-gate) 140ms";
    curtain.style.transform = "translateY(-100%)";

    lockScroll(false);
    at(260, revealHero);
    at(1120, () => {
      root.classList.remove("has-intro");
      curtain.remove();
      onDone();
    });
  };

  // Hold the curtain for a beat, but never wait on a slow subresource: the
  // hero is plain text and two web fonts, and both settle long before load.
  const started = performance.now();
  let armed = false;
  const go = () => {
    if (armed) return;
    armed = true;
    at(Math.max(0, 1150 - (performance.now() - started)), out);
  };

  if (document.readyState === "complete" || document.readyState === "interactive") go();
  else document.addEventListener("DOMContentLoaded", go, { once: true });
  at(2200, go);
}

/* -------------------------------------------------------------------------
   GATE CURTAIN  (the far side of any transition)
   The document paints behind the same ink panel the previous page raised,
   then lifts it and staggers its own lockup in.

   The panel is left in the DOM rather than removed: the gate uses it again,
   the other way round, on the way out of this page.
   ---------------------------------------------------------------------- */
function playGate(curtain, onDone) {
  // The home page carries both panels. Only one of them can be the way in.
  const intro = $("[data-intro]");
  if (intro) intro.remove();

  const items = $$("[data-hero]");
  items.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
  });

  // Reprinted before the first paint by the inline script beside the panel:
  // the same lockup the previous page was showing when it handed over.
  const lockup = curtain.firstElementChild;

  let lifted = false;
  const lift = () => {
    if (lifted) return;
    lifted = true;
    curtain.classList.add("is-lifting");
    onDone();

    items.forEach((el, i) => {
      const delay = 300 + i * 80;
      el.style.transition = `opacity 620ms ease ${delay}ms, transform 860ms var(--ease-out) ${delay}ms`;
      el.style.opacity = "1";
      el.style.transform = "none";
    });

    setTimeout(() => {
      root.classList.remove("has-gate");
      curtain.classList.remove("is-lifting");
      // The panel stays — the gate raises it again on the way out — but the
      // lockup belonged to one arrival and must not be in it next time.
      if (lockup) lockup.remove();
      items.forEach((el) => { el.style.cssText = ""; });
    }, 1800);
  };

  requestAnimationFrame(() => requestAnimationFrame(lift));
  // rAF is starved in a backgrounded tab; the curtain still has to come up.
  setTimeout(lift, 400);
}
