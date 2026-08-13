/* =========================================================================
   motosh.dev — the gate

   Every internal navigation that is not the home→case morph: back to the
   index, one case to the next, the next-case card at the foot of a page.
   Ink rises over the document being left, the next document paints behind
   an identical panel, and that one lifts.

   The same element does both halves — `.arrival` — so the two documents
   draw the literal same frame either side of the navigation. Which half it
   is playing is a class, and which half the next document should play is a
   flag in `sessionStorage` read by the inline script in its head, before
   the first paint. A curtain decided after boot is a curtain that flashes.
   ========================================================================= */

import { lockScroll } from "./motion.js";

const RISE = 460;   // ink over the outgoing page
const HOLD = 260;   // backstop past `transitionend`

export function mountGate() {
  const curtain = document.querySelector("[data-arrival]");
  if (!curtain) return;

  let busy = false;

  const clear = () => {
    busy = false;
    curtain.classList.remove("is-gate", "is-closing");
    lockScroll(false);
    try { sessionStorage.removeItem("motosh:gate"); } catch { /* private mode */ }
  };

  const target = (event) => {
    if (event.defaultPrevented || event.button !== 0) return null;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    const node = event.target instanceof Element ? event.target : null;
    return node ? internal(node.closest("a[href]")) : null;
  };

  const go = (href) => {
    if (busy) return;
    busy = true;

    // The next document has to know it is being handed a raised panel. It is
    // handed a blank one: a wipe carries no lockup, and a leftover from some
    // abandoned morph would have the next page open under the wrong case.
    try {
      sessionStorage.setItem("motosh:gate", "1");
      sessionStorage.removeItem("motosh:lockup");
    } catch { /* private mode */ }

    lockScroll(true);
    curtain.classList.add("is-gate");

    let gone = false;
    const leave = () => {
      if (gone) return;
      gone = true;
      location.assign(href);
    };

    curtain.addEventListener("transitionend", (event) => {
      if (event.propertyName === "transform" && event.target === curtain) leave();
    }, { once: true });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      curtain.classList.add("is-closing");
    }));

    // A stopwatch and an animation drift apart on a backgrounded tab, so the
    // timer is only ever the backstop — never the thing that decides.
    setTimeout(leave, RISE + HOLD);

    // And if the navigation itself never lands, the panel must not be left
    // sitting over the page as a dead black screen.
    setTimeout(() => { if (busy) clear(); }, RISE + HOLD + 4200);
  };

  document.addEventListener("click", (event) => {
    const href = target(event);
    if (!href) return;
    event.preventDefault();
    go(href);
  });

  // Start the next document while the ink is still rising. Cheap: one hint
  // per destination, and the case pages are the only things being hinted.
  const hinted = new Set();
  document.addEventListener("pointerover", (event) => {
    const node = event.target instanceof Element ? event.target : null;
    const href = node ? internal(node.closest("a[href]")) : null;
    if (!href || hinted.has(href)) return;
    hinted.add(href);
    const hint = document.createElement("link");
    hint.rel = "prefetch";
    hint.href = href;
    document.head.append(hint);
  });

  // Restored from the bfcache with the panel still up.
  window.addEventListener("pageshow", (event) => { if (event.persisted) clear(); });
}

/* A link this module owns: same origin, same tab, somewhere else. The case
   cards on the home page are excluded — the morph in `route.js` owns those,
   and it plays a far better transition than a wipe. */
function internal(link) {
  if (!link || link.target || link.hasAttribute("download")) return null;
  if (link.dataset.caseOpen !== undefined) return null;
  if (link.getAttribute("href").startsWith("#")) return null;

  let url;
  try { url = new URL(link.href, location.href); } catch { return null; }
  if (url.origin !== location.origin) return null;
  if (url.href === location.href) return null;
  // An in-page anchor on this very page is not a navigation.
  if (url.pathname === location.pathname && url.search === location.search) return null;

  return url.href;
}
