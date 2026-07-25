/* =========================================================================
   Design-system inspector
   Press I (or run it from ⌘K) and the page becomes its own specification.
   Nothing here is hand-written: every row is measured from the live element
   and matched back against the custom properties actually loaded on the
   page. A value that has no token behind it is labelled «поза системою» —
   the site publishes its own violations rather than hiding them.
   ========================================================================= */

import { $$, track } from "./core.js";
import { createTokenIndex, readElementSpec } from "./ds-tokens.js";

export const createInspector = () => {
  const index = createTokenIndex();

  const root = document.createElement("div");
  root.className = "inspector";
  root.setAttribute("aria-hidden", "true");

  const grid = document.createElement("div");
  grid.className = "inspector__grid";

  const border = document.createElement("div");
  border.className = "inspector__box";

  const padding = document.createElement("div");
  padding.className = "inspector__pad";

  const card = document.createElement("div");
  card.className = "inspector__card";

  const nameNode = document.createElement("p");
  nameNode.className = "inspector__name";

  const rowsNode = document.createElement("ul");
  rowsNode.className = "inspector__rows";

  const sizeNode = document.createElement("p");
  sizeNode.className = "inspector__size";

  card.append(nameNode, rowsNode, sizeNode);

  const hud = document.createElement("p");
  hud.className = "inspector__hud";
  const hudPill = document.createElement("span");
  hudPill.className = "pill pill--ink";
  hudPill.textContent = index.available
    ? `Інспектор · ${index.size} токенів прочитано`
    : "Інспектор · токени недоступні";
  const hudHint = document.createElement("span");
  hudHint.className = "inspector__hint";
  hudHint.textContent = "Наведіть або пройдіть Tab · C копіює · Esc виходить";
  hud.append(hudPill, hudHint);

  const live = document.createElement("p");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");

  root.append(grid, border, padding, card, hud, live);

  let enabled = false;
  let current = null;
  let dirty = false;

  /* --- painting -------------------------------------------------------- */

  const paint = () => {
    dirty = false;
    if (!current) {
      border.dataset.visible = "false";
      padding.dataset.visible = "false";
      card.dataset.visible = "false";
      return;
    }

    const rect = current.getBoundingClientRect();
    const styles = getComputedStyle(current);

    border.dataset.visible = "true";
    border.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
    border.style.width = `${rect.width}px`;
    border.style.height = `${rect.height}px`;

    const padTop = Number.parseFloat(styles.paddingTop) || 0;
    const padRight = Number.parseFloat(styles.paddingRight) || 0;
    const padBottom = Number.parseFloat(styles.paddingBottom) || 0;
    const padLeft = Number.parseFloat(styles.paddingLeft) || 0;
    const hasPadding = padTop + padRight + padBottom + padLeft > 0;
    padding.dataset.visible = String(hasPadding);
    if (hasPadding) {
      padding.style.transform = `translate3d(${rect.left + padLeft}px, ${rect.top + padTop}px, 0)`;
      padding.style.width = `${Math.max(0, rect.width - padLeft - padRight)}px`;
      padding.style.height = `${Math.max(0, rect.height - padTop - padBottom)}px`;
    }

    const spec = readElementSpec(current, index);
    nameNode.textContent = spec.name;

    rowsNode.replaceChildren(...spec.rows.map((row) => {
      const item = document.createElement("li");
      item.className = "inspector__row";

      const role = document.createElement("span");
      role.className = "inspector__role";
      role.textContent = row.role;

      const value = document.createElement("span");
      value.className = "inspector__value";
      value.textContent = row.token || row.value;
      if (!row.token) value.dataset.offSystem = "true";

      const raw = document.createElement("span");
      raw.className = "inspector__raw";
      raw.textContent = row.token ? row.value : "поза системою";

      item.append(role, value, raw);
      return item;
    }));

    sizeNode.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;

    const cardWidth = 300;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - cardWidth - 12);
    const below = rect.bottom + 14;
    const top = below + 190 > window.innerHeight ? Math.max(12, rect.top - 200) : below;
    card.dataset.visible = "true";
    card.style.transform = `translate3d(${left}px, ${top}px, 0)`;

    live.textContent = `${spec.name}. ${spec.rows.map((row) => `${row.role}: ${row.token || "поза системою"}`).join(". ")}`;
  };

  const schedule = () => {
    if (dirty) return;
    dirty = true;
    requestAnimationFrame(paint);
  };

  /* --- input ------------------------------------------------------------ */

  /* Elements that only wrap a run of text carry no design decision of their
     own, so inspecting them would make the frame flicker between a word and
     its container. They resolve to the nearest ancestor that actually paints
     something: a background, a ring, a radius, padding, or a layout box. */
  const PASS_THROUGH = new Set(["SPAN", "SMALL", "B", "STRONG", "EM", "I", "BR", "TIME", "CODE"]);

  /** A surface of its own: something the design system actually decided. */
  const hasSurface = (styles) =>
    (styles.backgroundColor !== "rgba(0, 0, 0, 0)" && styles.backgroundColor !== "transparent") ||
    styles.boxShadow !== "none" ||
    Number.parseFloat(styles.borderTopLeftRadius) > 0;

  const paints = (element) => {
    const styles = getComputedStyle(element);
    if (styles.display === "inline") return false;
    if (hasSurface(styles)) return true;
    if (Number.parseFloat(styles.paddingTop) > 0 || Number.parseFloat(styles.paddingLeft) > 0) return true;
    return ["flex", "grid", "block", "inline-flex", "inline-grid"].includes(styles.display);
  };

  /* A <span> is usually just a text wrapper — but a pill is a <span> too, and
     it is a real component. Pass through only the ones with no surface. */
  const isTextWrapper = (element) =>
    PASS_THROUGH.has(element.tagName) && !hasSurface(getComputedStyle(element));

  const target = (node) => {
    if (!(node instanceof Element)) return null;
    if (node.closest(".inspector")) return current;

    // An explicitly annotated ancestor always wins — those are the curated
    // components, and the reader should land on them rather than on a child.
    const annotated = node.closest("[data-spec], [data-spec-name]");
    if (annotated) return annotated;

    let element = node;
    let hops = 0;
    while (element && element !== document.body && hops < 6) {
      if (!isTextWrapper(element) && paints(element)) return element;
      element = element.parentElement;
      hops += 1;
    }
    return element && element !== document.body ? element : node;
  };

  const onPointerMove = (event) => {
    if (!enabled) return;
    const next = target(event.target);
    // Never blank out: keep showing the last element until a new one wins.
    if (!next || next === current) return;
    current = next;
    schedule();
  };

  const onFocusIn = (event) => {
    if (!enabled) return;
    // Tabbing through the page while inspecting doubles as a focus-order audit.
    const next = target(event.target) || event.target;
    if (!next || next === current) return;
    current = next;
    schedule();
  };

  const onScroll = () => {
    if (enabled) schedule();
  };

  const copyCurrent = async () => {
    if (!current) return;
    const spec = readElementSpec(current, index);
    const text = [
      `/* ${spec.name} */`,
      ...spec.rows.map((row) => `${row.role}: ${row.token ? `var(${row.token})` : row.value};`)
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      root.dataset.copied = "true";
      window.setTimeout(() => { delete root.dataset.copied; }, 1200);
    } catch {
      /* clipboard blocked — the values are on screen anyway */
    }
  };

  const onKeydown = (event) => {
    if (document.activeElement?.matches("input, textarea, [contenteditable]")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const key = event.key.toLowerCase();
    if (key === "i") {
      event.preventDefault();
      toggle();
    } else if (enabled && key === "escape") {
      event.preventDefault();
      disable();
    } else if (enabled && key === "c") {
      event.preventDefault();
      copyCurrent();
    }
  };

  const enable = () => {
    if (enabled) return;
    enabled = true;
    document.documentElement.dataset.inspect = "true";
    root.setAttribute("aria-hidden", "false");
    triggers.forEach((trigger) => trigger.setAttribute("aria-pressed", "true"));
    track("inspector_on");
  };

  const disable = () => {
    if (!enabled) return;
    enabled = false;
    current = null;
    delete document.documentElement.dataset.inspect;
    root.setAttribute("aria-hidden", "true");
    triggers.forEach((trigger) => trigger.setAttribute("aria-pressed", "false"));
    paint();
  };

  const toggle = () => (enabled ? disable() : enable());

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("keydown", onKeydown);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  const triggers = $$("[data-inspect-toggle]");
  const onTriggerClick = () => toggle();
  triggers.forEach((trigger) => {
    trigger.setAttribute("aria-pressed", "false");
    trigger.addEventListener("click", onTriggerClick);
  });

  document.body.append(root);

  return {
    index,
    enable,
    disable,
    toggle,
    get enabled() {
      return enabled;
    },
    destroy() {
      disable();
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeydown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      triggers.forEach((trigger) => trigger.removeEventListener("click", onTriggerClick));
      root.remove();
    }
  };
};
