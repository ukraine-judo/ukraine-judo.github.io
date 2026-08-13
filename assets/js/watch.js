/* =========================================================================
   motosh.dev — frame driver
   One rAF shared by everything that has to answer the scroll: the reveal,
   the parallax, the live frames, the ambient field.

   A job is a function run inside that frame. Returning `false` retires it;
   anything else keeps it. Nothing here polls on its own — the frame is only
   scheduled by a real event, plus a slow heartbeat, because momentum
   scrolling coalesces events and layout keeps moving after a font swap or a
   frame finishes loading.
   ========================================================================= */

const jobs = new Set();
let queued = false;

function run() {
  queued = false;
  for (const job of jobs) {
    let keep;
    try {
      keep = job();
    } catch {
      keep = false;
    }
    if (keep === false) jobs.delete(job);
  }
}

function schedule() {
  if (queued || !jobs.size) return;

  // A hidden tab never runs rAF, and these jobs decide whether content is
  // visible at all — a page opened in a background tab would sit at opacity
  // zero until it was looked at. Nothing is being painted there anyway, so
  // the work runs straight off the heartbeat instead.
  if (document.hidden) {
    run();
    return;
  }

  queued = true;
  requestAnimationFrame(run);
}

export function onFrame(job) {
  jobs.add(job);
  schedule();
}

export { schedule as tick };

window.addEventListener("scroll", schedule, { passive: true });
window.addEventListener("resize", schedule);
window.addEventListener("load", schedule);
window.addEventListener("pageshow", schedule);
document.addEventListener("visibilitychange", schedule);
setInterval(schedule, 200);
