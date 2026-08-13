/* =========================================================================
   motosh.dev — route morph  (home → case)

   The stand card grows into a full-screen panel that already carries the
   case lockup, the case page paints behind an identical panel, and that one
   lifts away. Three things make the seam hold:

   1. the panel is always viewport-sized and opens with `clip-path`, so the
      lockup inside never reflows a character while the box appears to grow,
      and the growth stays on the compositor;
   2. the page swaps on the morph's own `transitionend`, with a timer only as
      a backstop — a stopwatch and an animation drift apart on a backgrounded
      tab, and that drift is exactly what tears a page transition;
   3. the case page reprints the same ink panel at the same size, so the two
      documents draw the same frame either side of the navigation.
   ========================================================================= */

import { lockScroll } from "./motion.js";

const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

const MORPH = 620;   // card → full screen
const HOLD = 140;    // a beat on the settled panel before the page swaps

const desktop = window.matchMedia("(min-width: 900px)");

function readCases() {
  const island = $("[data-cases]");
  if (!island) return {};
  try {
    return JSON.parse(island.textContent);
  } catch {
    return {};
  }
}

export function mountRoute() {
  const panel = $("[data-route]");
  const links = $$("[data-case-open]");
  if (!panel || !links.length) return;

  const page = $("[data-page]");
  const bar = $("[data-route-bar]", panel);
  const cases = readCases();
  let busy = false;
  // Set once the morph has committed to leaving. `reset` is cleanup for a
  // morph that did not go anywhere; on a departure it would take back the
  // word this page just left for the next one.
  let departing = false;

  const slot = (name, value) => {
    const el = $(`[data-route-${name}]`, panel);
    if (el) el.textContent = value ?? "";
  };

  const reset = () => {
    busy = false;
    // An abandoned morph must not leave a word behind that makes some later
    // load open behind a curtain nothing raised.
    try {
      sessionStorage.removeItem("motosh:gate");
      sessionStorage.removeItem("motosh:lockup");
    } catch { /* private mode */ }
    panel.classList.remove("is-armed");
    panel.style.transition = "";
    panel.style.clipPath = "";
    if (bar) { bar.style.transition = "none"; bar.style.transform = "scaleX(0)"; }
    if (page) page.style.cssText = "";
    lockScroll(false);
  };

  const open = (key, href) => {
    const data = cases[key];
    const card = $(`[data-case-card="${key}"]`);
    if (!data || !card || busy) return false;

    busy = true;

    // Let the browser start on the next document while the panel opens.
    const hint = document.createElement("link");
    hint.rel = "prefetch";
    hint.href = href;
    document.head.append(hint);

    slot("num", data.num);
    slot("tag", data.tag);
    slot("title", data.title);
    slot("lead", data.lead);
    slot("role", data.role);
    slot("year", data.year);
    slot("status", data.status);
    slot("url", data.url);

    // The far side of the seam draws this exact markup, rather than a second
    // hand-kept copy of the same lockup in every case page — two copies drift
    // apart, one cannot. Serialised here and not inside the morph's own frame
    // callback: a tab put in the background mid-morph never runs another
    // frame, leaves on the backstop timer, and would arrive at a blank panel —
    // which is the whole fault this repairs.
    const inner = $(".route__inner", panel);
    if (inner) {
      const copy = inner.cloneNode(true);
      // The bar arrives where the morph will have left it, not back at zero.
      const copyBar = $("[data-route-bar]", copy);
      if (copyBar) copyBar.style.transform = "scaleX(1)";
      try {
        sessionStorage.setItem("motosh:lockup", copy.outerHTML);
      } catch { /* private mode */ }
    }

    const rect = card.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const inset = [
      Math.max(0, rect.top),
      Math.max(0, vw - rect.right),
      Math.max(0, vh - rect.bottom),
      Math.max(0, rect.left)
    ].map((n) => `${n.toFixed(1)}px`).join(" ");

    panel.style.transition = "none";
    panel.style.clipPath = `inset(${inset} round 20px)`;
    panel.classList.add("is-armed");
    lockScroll(true);

    // The case page has to know a panel is already covering the screen, and
    // it has to know before its first paint — so the word is left in
    // `sessionStorage` and read by the inline script in its head.
    try { sessionStorage.setItem("motosh:gate", "1"); } catch { /* private mode */ }

    let gone = false;
    const leave = () => {
      if (gone) return;
      gone = true;
      departing = true;
      location.assign(href);
    };

    panel.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "clip-path" || event.target !== panel) return;
      setTimeout(leave, HOLD);
    }, { once: true });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      panel.style.transition = `clip-path ${MORPH}ms var(--ease-gate)`;
      panel.style.clipPath = "inset(0px 0px 0px 0px round 0px)";

      if (page && desktop.matches) {
        page.style.transition = `transform ${MORPH}ms var(--ease-gate), opacity ${MORPH}ms ease`;
        page.style.transform = "scale(0.97)";
        page.style.opacity = "0.45";
      }

      if (bar) {
        bar.style.transition = `transform ${MORPH + HOLD}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        bar.style.transform = "scaleX(1)";
      }
    }));

    // Backstop: if `transitionend` never lands, go anyway.
    setTimeout(leave, MORPH + HOLD + 400);

    // And if the navigation itself never lands — an offline case page, a
    // blocked request — the panel must not become a dead black screen.
    setTimeout(() => { if (busy) reset(); }, MORPH + HOLD + 4400);
    return true;
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;
      if (open(link.dataset.caseOpen, link.href)) event.preventDefault();
    });
  });

  // Back out of a page restored from the bfcache with the panel still up.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    departing = false;
    reset();
  });

  // Only an abandoned morph gets cleaned up here. `pagehide` fires on the way
  // out too, and unconditional cleanup there deleted the word this page had
  // just written for the next one — before the next one could read it. The
  // case page then opened with no panel over it, which is the navigation
  // landing as a plain reload with the transition cut off mid-flight.
  window.addEventListener("pagehide", () => { if (!departing) reset(); });
}
