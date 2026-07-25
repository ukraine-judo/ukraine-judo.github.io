/* =========================================================================
   Wiring diagram
   One component, two jobs on the ФСПУ case: the information-architecture map
   and the content model. Nodes declare their links in markup, the SVG is
   generated and re-measured on resize, and hovering / focusing a node lights
   its branch while the rest recedes.
   Without JS the markup is still a readable, correctly nested list.
   ========================================================================= */

import { $, $$, track } from "./core.js";

export const createWiring = (root) => {
  if (!root) return { destroy() {} };

  const surface = $("[data-wires]", root);
  const nodes = $$("[data-node]", root);
  if (!surface || !nodes.length) return { destroy() {} };

  const byId = new Map(nodes.map((node) => [node.dataset.node, node]));

  /** id -> Set(ids) in both directions, so highlighting works from either end. */
  const links = [];
  const neighbours = new Map();
  const connect = (a, b) => {
    if (!neighbours.has(a)) neighbours.set(a, new Set());
    if (!neighbours.has(b)) neighbours.set(b, new Set());
    neighbours.get(a).add(b);
    neighbours.get(b).add(a);
  };

  nodes.forEach((node) => {
    const targets = (node.dataset.links || "").split(/\s+/).filter(Boolean);
    targets.forEach((targetId) => {
      const target = byId.get(targetId);
      if (!target) return;
      links.push({ from: node, to: target, fromId: node.dataset.node, toId: targetId, path: null });
      connect(node.dataset.node, targetId);
    });
  });

  if (!links.length) return { destroy() {} };

  const NS = "http://www.w3.org/2000/svg";
  surface.replaceChildren();
  links.forEach((link) => {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("class", "wire");
    surface.append(path);
    link.path = path;
  });

  const draw = () => {
    const box = root.getBoundingClientRect();
    surface.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    surface.setAttribute("width", String(box.width));
    surface.setAttribute("height", String(box.height));

    // Horizontal wiring on wide layouts, vertical when the columns stack.
    const stacked = root.dataset.wiringStacked === "true";

    links.forEach((link) => {
      const a = link.from.getBoundingClientRect();
      const b = link.to.getBoundingClientRect();

      let x1;
      let y1;
      let x2;
      let y2;
      let control;

      if (stacked) {
        x1 = a.left + a.width / 2 - box.left;
        y1 = a.bottom - box.top;
        x2 = b.left + b.width / 2 - box.left;
        y2 = b.top - box.top;
        const mid = (y1 + y2) / 2;
        control = `C ${x1} ${mid}, ${x2} ${mid},`;
      } else {
        x1 = a.right - box.left;
        y1 = a.top + a.height / 2 - box.top;
        x2 = b.left - box.left;
        y2 = b.top + b.height / 2 - box.top;
        const mid = (x1 + x2) / 2;
        control = `C ${mid} ${y1}, ${mid} ${y2},`;
      }

      link.path.setAttribute("d", `M ${x1} ${y1} ${control} ${x2} ${y2}`);
    });
  };

  /* ---- highlighting ---------------------------------------------------- */

  let active = null;

  const highlight = (id) => {
    if (id === active) return;
    active = id;

    if (!id) {
      root.removeAttribute("data-focused");
      nodes.forEach((node) => {
        node.removeAttribute("data-lit");
        node.removeAttribute("data-dim");
      });
      links.forEach((link) => link.path.removeAttribute("data-lit"));
      return;
    }

    const near = neighbours.get(id) || new Set();
    root.dataset.focused = "true";
    nodes.forEach((node) => {
      const nodeId = node.dataset.node;
      const lit = nodeId === id || near.has(nodeId);
      node.toggleAttribute("data-lit", lit);
      node.toggleAttribute("data-dim", !lit);
    });
    links.forEach((link) => {
      link.path.toggleAttribute("data-lit", link.fromId === id || link.toId === id);
    });

    const count = near.size;
    const readout = $("[data-wiring-readout]", root);
    if (readout) {
      const label = byId.get(id)?.dataset.nodeLabel || byId.get(id)?.textContent.trim() || "";
      readout.textContent = `${label} — ${count} ${count === 1 ? "зв’язок" : count < 5 ? "зв’язки" : "зв’язків"}`;
    }
  };

  const onOver = (event) => {
    const node = event.target.closest("[data-node]");
    if (node) highlight(node.dataset.node);
  };

  const onOut = (event) => {
    if (!root.contains(event.relatedTarget)) highlight(null);
  };

  const onFocus = (event) => {
    const node = event.target.closest("[data-node]");
    if (node) {
      highlight(node.dataset.node);
      track("wiring_focus", node.dataset.node);
    }
  };

  const onClick = (event) => {
    const node = event.target.closest("[data-node]");
    if (!node) return;
    highlight(active === node.dataset.node ? null : node.dataset.node);
  };

  root.addEventListener("pointerover", onOver);
  root.addEventListener("pointerout", onOut);
  root.addEventListener("focusin", onFocus);
  root.addEventListener("click", onClick);

  /* ---- keyboard: roving between nodes ---------------------------------- */

  const onKeydown = (event) => {
    if (!["ArrowDown", "ArrowUp", "Escape"].includes(event.key)) return;
    const node = event.target.closest("[data-node]");
    if (!node) return;
    if (event.key === "Escape") {
      highlight(null);
      return;
    }
    event.preventDefault();
    const index = nodes.indexOf(node);
    const next = nodes[(index + (event.key === "ArrowDown" ? 1 : -1) + nodes.length) % nodes.length];
    next?.focus();
  };
  root.addEventListener("keydown", onKeydown);

  /* ---- measurement ------------------------------------------------------ */

  const observer = new ResizeObserver(() => {
    root.dataset.wiringStacked = String(window.matchMedia("(max-width: 899px)").matches);
    draw();
  });
  observer.observe(root);

  root.dataset.wiringStacked = String(window.matchMedia("(max-width: 899px)").matches);
  draw();

  // Wires draw themselves in once, on first paint.
  requestAnimationFrame(() => { root.dataset.wiringReady = "true"; });

  return {
    destroy() {
      observer.disconnect();
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerout", onOut);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeydown);
      surface.replaceChildren();
      delete root.dataset.wiringReady;
      delete root.dataset.focused;
    }
  };
};
