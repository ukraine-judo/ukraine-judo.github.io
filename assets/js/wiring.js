/* =========================================================================
   motosh.dev — one record, seven places  (case 02)

   The curves are measured off the live DOM rather than authored, so they
   hold at any width and after any font swap. Pointing at a field lights the
   places that consume it; pointing at a place lights the fields it takes.

   The link map lives on the markup (`data-use` on each place), not in this
   file — the mapping is content, and content belongs in the document.
   ========================================================================= */

import { onFrame } from "./watch.js";

export function mount() {
  const wire = document.querySelector("[data-wire]");
  if (!wire) return;

  const svg = wire.querySelector("svg");
  const fields = Array.from(wire.querySelectorAll("[data-field]"));
  const places = Array.from(wire.querySelectorAll("[data-place]"));
  if (!svg || !fields.length || !places.length) return;

  const uses = places.map((place) =>
    (place.dataset.use || "").split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n))
  );

  const paths = [];
  uses.forEach((list, place) => list.forEach((field) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.append(path);
    paths.push({ node: path, field, place });
  }));

  let geometry = "";

  const measure = () => {
    const box = wire.getBoundingClientRect();
    if (!box.width) return true;

    const from = fields.map((el) => {
      const r = el.getBoundingClientRect();
      return [r.right - box.left, r.top - box.top + r.height / 2];
    });
    const to = places.map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left - box.left, r.top - box.top + r.height / 2];
    });

    const drawn = paths.map(({ field, place }) => {
      const [x1, y1] = from[field];
      const [x2, y2] = to[place];
      const dx = Math.max(60, (x2 - x1) * 0.5);
      return `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + dx).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - dx).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    });

    const key = drawn.join("|");
    if (key !== geometry) {
      geometry = key;
      paths.forEach((path, i) => path.node.setAttribute("d", drawn[i]));
    }
    return true;
  };

  const clear = () => {
    wire.classList.remove("is-picking");
    fields.forEach((el) => el.classList.remove("is-on"));
    places.forEach((el) => el.classList.remove("is-on"));
    paths.forEach((p) => p.node.classList.remove("is-on"));
  };

  const pickField = (index) => {
    clear();
    wire.classList.add("is-picking");
    fields[index].classList.add("is-on");
    uses.forEach((list, place) => {
      if (list.includes(index)) places[place].classList.add("is-on");
    });
    paths.forEach((p) => { if (p.field === index) p.node.classList.add("is-on"); });
  };

  const pickPlace = (index) => {
    clear();
    wire.classList.add("is-picking");
    places[index].classList.add("is-on");
    uses[index].forEach((field) => fields[field].classList.add("is-on"));
    paths.forEach((p) => { if (p.place === index) p.node.classList.add("is-on"); });
  };

  const bind = (nodes, pick) => nodes.forEach((el, i) => {
    el.addEventListener("pointerenter", () => pick(i));
    el.addEventListener("focus", () => pick(i));
    el.addEventListener("click", () => pick(i));
    el.addEventListener("pointerleave", clear);
    el.addEventListener("blur", clear);
  });

  bind(fields, pickField);
  bind(places, pickPlace);

  onFrame(measure);
}
