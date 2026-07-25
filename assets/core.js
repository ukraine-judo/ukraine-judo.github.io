/* =========================================================================
   motosh.dev — core runtime
   Shared behaviour + the layout fork. Desktop and mobile ship as two
   independent modules; exactly one is mounted at a time, and crossing the
   breakpoint tears the old one down before booting the other.
   ========================================================================= */

export const MOBILE_QUERY = "(max-width: 899px)";

export const mediaMobile = window.matchMedia(MOBILE_QUERY);
export const mediaCoarse = window.matchMedia("(pointer: coarse)");

/* ---------------------------------------------------------------- helpers */

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const round = (value, decimals = 2) => Number(value.toFixed(decimals));

/** Collects teardown functions so a layout module can unmount cleanly. */
export class Disposer {
  constructor() {
    this.tasks = [];
  }

  add(task) {
    if (typeof task === "function") this.tasks.push(task);
    return task;
  }

  /** addEventListener that auto-unbinds on dispose. */
  on(target, type, handler, options) {
    if (!target) return () => {};
    target.addEventListener(type, handler, options);
    const off = () => target.removeEventListener(type, handler, options);
    this.tasks.push(off);
    return off;
  }

  /** requestAnimationFrame loop that auto-stops on dispose. */
  raf(step) {
    let id = 0;
    let running = true;
    const tick = (time) => {
      if (!running) return;
      step(time);
      id = window.requestAnimationFrame(tick);
    };
    id = window.requestAnimationFrame(tick);
    this.tasks.push(() => {
      running = false;
      window.cancelAnimationFrame(id);
    });
  }

  observe(observer) {
    this.tasks.push(() => observer.disconnect());
    return observer;
  }

  dispose() {
    while (this.tasks.length) {
      const task = this.tasks.pop();
      try {
        task();
      } catch {
        /* one broken teardown must not block the rest */
      }
    }
  }
}

/* Three presets, no others. Bounce and elastic are banned: an instrument
   does not play. */
export const SPRING = {
  settle: { stiffness: 0.14, damping: 0.78 },
  lag: { stiffness: 0.09, damping: 0.82 },
  snap: { stiffness: 0.22, damping: 0.72 }
};

const FIXED_STEP = 1000 / 60;

/**
 * Semi-implicit Euler spring with a FIXED 1/60 accumulator.
 * Integrating once per animation frame would make every spring on the site
 * run twice as fast on a 120Hz display as on a 60Hz one; the accumulator
 * makes the motion identical on any refresh rate.
 */
export class Spring {
  constructor(value = 0, preset = SPRING.settle) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = preset.stiffness;
    this.damping = preset.damping;
    this.accumulator = 0;
  }

  set(target) {
    this.target = target;
  }

  jump(value) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.accumulator = 0;
  }

  /** @param {number} delta milliseconds since the previous frame */
  step(delta = FIXED_STEP) {
    // Clamp so a backgrounded tab does not explode the integration on return.
    this.accumulator = Math.min(this.accumulator + delta, FIXED_STEP * 5);
    while (this.accumulator >= FIXED_STEP) {
      this.velocity = (this.velocity + (this.target - this.value) * this.stiffness) * this.damping;
      this.value += this.velocity;
      this.accumulator -= FIXED_STEP;
    }
    return this.value;
  }

  get settled() {
    return Math.abs(this.target - this.value) < 0.001 && Math.abs(this.velocity) < 0.001;
  }
}

/* ------------------------------------------------------------------ ticker
   One requestAnimationFrame for the whole page. Subscribers declare when
   they are idle, and the loop stops entirely once nobody needs it — so a
   settled page costs zero frames. */

const subscribers = new Set();
let tickerFrame = 0;
let tickerLast = 0;

const tick = (now) => {
  const delta = Math.min(48, now - tickerLast || FIXED_STEP);
  tickerLast = now;
  subscribers.forEach((fn) => {
    try {
      fn(delta, now);
    } catch (error) {
      console.warn("[ticker]", error);
      subscribers.delete(fn);
    }
  });
  tickerFrame = subscribers.size ? window.requestAnimationFrame(tick) : 0;
};

export const ticker = {
  add(fn) {
    subscribers.add(fn);
    if (!tickerFrame) {
      tickerLast = 0;
      tickerFrame = window.requestAnimationFrame(tick);
    }
    return () => ticker.remove(fn);
  },
  remove(fn) {
    subscribers.delete(fn);
    if (!subscribers.size && tickerFrame) {
      window.cancelAnimationFrame(tickerFrame);
      tickerFrame = 0;
    }
  },
  get running() {
    return Boolean(tickerFrame);
  }
};

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && tickerFrame) {
    window.cancelAnimationFrame(tickerFrame);
    tickerFrame = 0;
  } else if (document.visibilityState === "visible" && subscribers.size && !tickerFrame) {
    tickerLast = 0;
    tickerFrame = window.requestAnimationFrame(tick);
  }
});

/* -------------------------------------------------------- scroll locking
   `overflow: hidden` on <body> does not hold on iOS Safari. The reliable
   technique is to pin the body at its current offset and restore afterwards.
   Ownership is reference-counted so the palette and the sheet can overlap. */

let lockDepth = 0;
let lockedAt = 0;

export const lockScroll = () => {
  lockDepth += 1;
  if (lockDepth > 1) return;
  lockedAt = window.scrollY;
  const body = document.body;
  body.dataset.scrollLock = "true";
  body.style.position = "fixed";
  body.style.top = `-${lockedAt}px`;
  body.style.insetInline = "0";
  body.style.width = "100%";
  document.querySelector("main")?.setAttribute("inert", "");
};

export const unlockScroll = ({ force = false } = {}) => {
  if (lockDepth === 0) return;
  lockDepth = force ? 0 : lockDepth - 1;
  if (lockDepth > 0) return;
  const body = document.body;
  delete body.dataset.scrollLock;
  body.style.removeProperty("position");
  body.style.removeProperty("top");
  body.style.removeProperty("inset-inline");
  body.style.removeProperty("width");
  document.querySelector("main")?.removeAttribute("inert");
  window.scrollTo(0, lockedAt);
};

/* --------------------------------------------------------------- analytics */

const ANALYTICS_KEY = "portfolio_analytics_v3";
const TRANSITION_KEY = "portfolio_route_transition";
const currentPath = window.location.pathname;

const readStore = (key) => {
  try {
    return JSON.parse(window.sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

const analytics = readStore(ANALYTICS_KEY) || {
  sessionId: window.crypto?.randomUUID?.() || `s-${Date.now().toString(36)}`,
  startedAt: new Date().toISOString(),
  paths: {}
};

analytics.paths[currentPath] ||= {
  visits: 0,
  clicks: {},
  sections: {},
  maxScrollDepth: 0,
  activeMs: 0
};

const pathStats = analytics.paths[currentPath];
pathStats.visits += 1;

const saveAnalytics = () => {
  try {
    window.sessionStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  } catch {
    /* private mode — the site stays fully functional */
  }
};

export const track = (name, meta) => {
  pathStats.clicks[name] = (pathStats.clicks[name] || 0) + 1;
  saveAnalytics();
  window.dispatchEvent(new CustomEvent("portfolio:event", {
    detail: { event: name, path: currentPath, meta, session: analytics.sessionId }
  }));
};

window.portfolioAnalytics = {
  read: () => readStore(ANALYTICS_KEY),
  reset: () => window.sessionStorage.removeItem(ANALYTICS_KEY)
};

saveAnalytics();

/* -------------------------------------------------------- route transition */

const createCurtain = ({ index = "", title = "" } = {}) => {
  const curtain = document.createElement("div");
  curtain.className = "route-curtain";
  curtain.setAttribute("aria-hidden", "true");

  const copy = document.createElement("div");
  copy.className = "route-curtain__copy";

  const label = document.createElement("small");
  label.textContent = index === "00" ? "Повернення" : `Кейс · ${index}`;

  const heading = document.createElement("strong");
  heading.textContent = title;

  const number = document.createElement("span");
  number.className = "route-curtain__index";
  number.textContent = index;

  copy.append(label, heading);
  curtain.append(copy, number);
  return curtain;
};

const playArrival = () => {
  const incoming = readStore(TRANSITION_KEY);
  try {
    window.sessionStorage.removeItem(TRANSITION_KEY);
  } catch {
    /* ignore */
  }

  if (!incoming) {
    document.documentElement.classList.remove("route-arriving");
    return;
  }

  const curtain = createCurtain(incoming);
  curtain.classList.add("is-arrival");
  document.documentElement.classList.add("route-intro-hold");
  document.body.append(curtain);
  document.documentElement.classList.remove("route-arriving");

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    curtain.remove();
    document.documentElement.classList.remove("route-intro-hold");
  };

  curtain.addEventListener("transitionend", (event) => {
    if (event.target === curtain && event.propertyName === "clip-path") finish();
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    curtain.classList.add("is-releasing");
    document.documentElement.classList.remove("route-intro-hold");
  }));

  window.setTimeout(finish, 1100);
};

const bindRouteLinks = () => {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-route]");
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;

    const payload = {
      index: link.dataset.routeIndex || "",
      title: link.dataset.routeTitle || link.textContent.trim()
    };

    event.preventDefault();
    window.dispatchEvent(new CustomEvent("portfolio:navigate"));

    try {
      window.sessionStorage.setItem(TRANSITION_KEY, JSON.stringify(payload));
    } catch { /* ignore */ }

    const curtain = createCurtain(payload);
    document.body.append(curtain);
    requestAnimationFrame(() => curtain.classList.add("is-active"));
    window.setTimeout(() => { window.location.href = url.href; }, 640);
  });
};

/* ------------------------------------------------------------ shared boot */

const bootReveal = () => {
  const items = $$(".reveal");
  if (!items.length) return;

  // Stagger siblings inside grouped containers.
  $$("[data-stagger]").forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      if (child.classList.contains("reveal")) {
        child.style.setProperty("--reveal-order", String(index));
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

  items.forEach((item) => observer.observe(item));
};

const bootIntroOrder = () => {
  $$(".intro-item").forEach((item, index) => {
    item.style.setProperty("--intro-order", String(index));
  });
};

const bootHeader = () => {
  const header = $("[data-header]");
  if (!header) return;
  let last = -1;
  const update = () => {
    const scrolled = window.scrollY > 8;
    if (scrolled === Boolean(last)) return;
    last = scrolled ? 1 : 0;
    header.classList.toggle("is-scrolled", scrolled);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
};

const bootFacts = () => {
  const birth = new Date(2010, 5, 13);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const passed =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!passed) age -= 1;

  $$("[data-age]").forEach((node) => { node.textContent = String(age); });
  $$("[data-year]").forEach((node) => { node.textContent = String(now.getFullYear()); });
};

const bootSectionTracking = () => {
  const sections = $$("main > section[id]");
  if (!sections.length) return;
  const seen = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || seen.has(entry.target.id)) return;
      seen.add(entry.target.id);
      pathStats.sections[entry.target.id] = (pathStats.sections[entry.target.id] || 0) + 1;
      saveAnalytics();
      window.dispatchEvent(new CustomEvent("portfolio:section", { detail: { id: entry.target.id } }));
    });
  }, { rootMargin: "-15% 0px -35% 0px", threshold: 0.15 });
  sections.forEach((section) => observer.observe(section));
};

const bootScrollDepth = () => {
  let queued = false;
  const measure = () => {
    queued = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const depth = scrollable <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / scrollable) * 100));
    if (depth <= pathStats.maxScrollDepth) return;
    pathStats.maxScrollDepth = depth;
    saveAnalytics();
  };
  window.addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(measure);
  }, { passive: true });
  measure();
};

const bootActiveTime = () => {
  let since = document.visibilityState === "visible" ? Date.now() : null;
  const flush = () => {
    if (since === null) return;
    pathStats.activeMs += Date.now() - since;
    since = null;
    saveAnalytics();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") since = Date.now();
    else flush();
  });
  window.addEventListener("pagehide", flush);
};

const bootEventDelegation = () => {
  document.addEventListener("click", (event) => {
    const node = event.target.closest("[data-event]");
    if (node) track(node.dataset.event);
  });
};

/* ------------------------------------------------------- the layout fork */

let active = null;

const mountLayout = async (name) => {
  if (active?.name === name) return;

  if (active) {
    try {
      active.instance?.destroy?.();
    } catch (error) {
      console.warn("[layout] teardown failed", error);
    }
    active = null;
  }

  document.documentElement.dataset.layout = name;

  try {
    const module = name === "mobile"
      ? await import("./mobile.js")
      : await import("./desktop.js");
    const instance = module.mount?.({ track, Disposer, Spring, $, $$, clamp, lerp });
    active = { name, instance };
    window.dispatchEvent(new CustomEvent("portfolio:layout", { detail: { layout: name } }));
  } catch (error) {
    console.warn(`[layout] "${name}" failed to mount`, error);
    active = { name, instance: null };
  }
};

const syncLayout = () => mountLayout(mediaMobile.matches ? "mobile" : "desktop");

/* A media-query listener is the primary signal, but a page booted inside a
   zero-width container (embedded preview, restored tab) can settle into the
   wrong layout without ever firing `change`. A debounced resize check makes
   the fork self-correcting. */
let resizeTimer = 0;
const syncOnResize = () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(syncLayout, 180);
};

/* -------------------------------------------------------------------- go */

document.documentElement.classList.add("has-js");

playArrival();
bindRouteLinks();
bootIntroOrder();
bootReveal();
bootHeader();
bootFacts();
bootSectionTracking();
bootScrollDepth();
bootActiveTime();
bootEventDelegation();

syncLayout();
mediaMobile.addEventListener("change", syncLayout);
window.addEventListener("resize", syncOnResize, { passive: true });
window.addEventListener("orientationchange", syncOnResize, { passive: true });
