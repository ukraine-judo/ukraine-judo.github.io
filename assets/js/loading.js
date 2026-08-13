/* =========================================================================
   motosh.dev — the wait, drawn
   A frame exists the moment its element is created; its document arrives
   much later. Between those two moments the mount shows a travelling line
   and holds the frame at zero opacity, so the labelled placeholder beneath
   stays readable instead of a half-painted foreign site flashing in.

   `load` fires on a cross-origin frame — the event crosses the origin
   boundary even though the content does not. The timer is a backstop for a
   host that accepts the connection and then stalls: revealing a partly drawn
   site beats holding a grey box for ever.
   ========================================================================= */

const TIMEOUT = 12000;

export function trackLoad(mount, frame) {
  const line = document.createElement("span");
  line.className = "loading";
  line.setAttribute("aria-hidden", "true");
  mount.append(line);
  mount.classList.add("is-loading");

  let settled = false;

  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    mount.classList.remove("is-loading");
    mount.classList.add("is-ready");
    line.style.opacity = "0";
    setTimeout(() => line.remove(), 300);
  };

  const timer = setTimeout(finish, TIMEOUT);
  frame.addEventListener("load", finish, { once: true });

  return finish;
}
