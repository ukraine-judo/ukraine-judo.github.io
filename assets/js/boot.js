/* =========================================================================
   motosh.dev — entry point
   Every module is pulled in with this file's own `?v=`, so a deploy can
   never pair a fresh boot with a widget served from cache.

   Order matters once: the curtain owns the first beat of the page, and the
   reveal and the live frames start behind it.
   ========================================================================= */

const V = new URL(import.meta.url).search;
const load = (name) => import(`./${name}.js${V}`);
const has = (sel) => !!document.querySelector(sel);

async function boot() {
  const motion = await load("motion");

  motion.mountParallax();

  motion.mountEntrance(async () => {
    motion.mountReveal();
    if (has("[data-frame]")) (await load("frames")).mountFrames();
  });

  if (has("[data-arrival]")) (await load("gate")).mountGate();
  if (has("[data-case-open]")) (await load("route")).mountRoute();
  if (has("[data-ambient]")) (await load("field")).mount();
  if (has("[data-rig]")) (await load("rig")).mount();
  if (has("[data-states]")) (await load("states")).mount();
  if (has("[data-wire]")) (await load("wiring")).mount();
  if (has("[data-bracket]")) (await load("bracket")).mount();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
