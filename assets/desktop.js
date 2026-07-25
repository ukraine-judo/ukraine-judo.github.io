/* =========================================================================
   DESKTOP layout module
   Mounted only while (min-width: 900px) matches. Everything it creates is
   registered with the Disposer so crossing the breakpoint leaves no trace.
   ========================================================================= */

import { $, $$, clamp, Disposer, track } from "./core.js";
import { createInspector } from "./inspect.js";
import { createField } from "./field.js";
import { createLab } from "./lab.js";
import { createRig } from "./rig.js";
import { createWiring } from "./wiring.js";
import { createBracket } from "./bracket.js";

/* ---------------------------------------------------- scroll-spy for nav */

const mountNavSpy = (disposer) => {
  const links = $$(".site-nav a[href^='#']");
  if (!links.length) return;

  const byId = new Map(links.map((link) => [link.getAttribute("href").slice(1), link]));
  const sections = $$("main > section[id]").filter((section) => byId.has(section.id));
  if (!sections.length) return;

  const visible = new Set();
  const observer = disposer.observe(new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    });

    const current = sections.find((section) => visible.has(section.id));
    links.forEach((link) => link.removeAttribute("aria-current"));
    if (current) byId.get(current.id)?.setAttribute("aria-current", "true");
  }, { rootMargin: "-20% 0px -60% 0px", threshold: 0 }));

  sections.forEach((section) => observer.observe(section));
};

/* ------------------------------------------------- process rail (scrolly) */

const mountRail = (disposer) => {
  const rail = $("[data-rail]");
  if (!rail) return;

  const steps = $$("[data-rail-step]", rail);
  const layers = $$("[data-rail-layer]", rail);
  const frame = $("[data-rail-frame]", rail);
  if (!steps.length || !frame) return;

  const setActive = (index) => {
    steps.forEach((step, i) => step.toggleAttribute("data-active", i === index));
    layers.forEach((layer, i) => {
      layer.toggleAttribute("data-active", i === index);
      layer.toggleAttribute("data-passed", i < index);
    });
    frame.style.setProperty("--rail-progress", String((index + 1) / steps.length));
  };

  let current = -1;
  const observer = disposer.observe(new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = steps.indexOf(entry.target);
      if (index === current) return;
      current = index;
      setActive(index);
    });
  }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 }));

  steps.forEach((step) => observer.observe(step));
  setActive(0);
};

/* -------------------------------------------------------- story tab group */

const mountTabs = (disposer) => {
  const tablist = $("[data-tabs]");
  if (!tablist) return;

  const tabs = $$("[data-tab]", tablist);
  const panels = $$("[data-panel]");
  if (!tabs.length) return;

  const activate = (tab, focus = true) => {
    const key = tab.dataset.tab;
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === key));
    if (focus) tab.focus();
    track("tab", key);
  };

  tabs.forEach((tab, index) => {
    disposer.on(tab, "click", () => activate(tab, false));
    disposer.on(tab, "keydown", (event) => {
      const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else next = (index - 1 + tabs.length) % tabs.length;
      activate(tabs[next]);
    });
  });
};

/* ----------------------------------------------- magnetic pill affordance */

const mountMagnets = (disposer) => {
  $$("[data-magnet]").forEach((node) => {
    let raf = 0;
    const move = (event) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        node.style.setProperty("--magnet-x", `${clamp(x, -0.5, 0.5) * 10}px`);
        node.style.setProperty("--magnet-y", `${clamp(y, -0.5, 0.5) * 6}px`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      node.style.removeProperty("--magnet-x");
      node.style.removeProperty("--magnet-y");
    };
    disposer.on(node, "pointermove", move, { passive: true });
    disposer.on(node, "pointerleave", reset, { passive: true });
    disposer.add(reset);
  });
};

/* ------------------------------------------------------------------ mount */

export const mount = () => {
  const disposer = new Disposer();

  const inspector = createInspector();
  disposer.add(() => inspector.destroy());

  const fieldCanvas = $("[data-field]");
  if (fieldCanvas) {
    const field = createField(fieldCanvas, { spacing: 68, drift: 24 });
    disposer.add(() => field.destroy());
  }

  const lab = createLab($("[data-lab]"));
  disposer.add(() => lab.destroy());

  $$("[data-rig]").forEach((node) => {
    const rig = createRig(node);
    disposer.add(() => rig.destroy());
  });

  $$("[data-wiring]").forEach((node) => {
    const wiring = createWiring(node);
    disposer.add(() => wiring.destroy());
  });

  $$("[data-bracket]").forEach((node) => {
    const bracket = createBracket(node);
    disposer.add(() => bracket.destroy());
  });

  mountNavSpy(disposer);
  mountRail(disposer);
  mountTabs(disposer);
  mountMagnets(disposer);

  return {
    destroy() {
      disposer.dispose();
    }
  };
};
