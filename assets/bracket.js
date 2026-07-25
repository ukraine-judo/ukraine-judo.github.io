/* =========================================================================
   Tournament bracket
   The signature block of the competition-system case. Three stages walk the
   same bracket from registration to results, and picking a participant lights
   their whole path — the matches behind them and the ones still ahead.
   That is the product's entire promise in one interaction: an athlete should
   see their own route, not a table.

   The markup is authored statically, so without JS the bracket is still a
   readable list of rounds. This module adds the wires, the stages and the
   path highlighting.
   ========================================================================= */

import { $, $$, track } from "./core.js";

const STAGES = ["reg", "draw", "result"];

/** Ukrainian count forms for «зустріч». */
const meetings = (n) => {
  const tail = n % 10;
  const teen = n % 100;
  if (teen >= 11 && teen <= 14) return `${n} зустрічей`;
  if (tail === 1) return `${n} зустріч`;
  if (tail >= 2 && tail <= 4) return `${n} зустрічі`;
  return `${n} зустрічей`;
};

export const createBracket = (root) => {
  if (!root) return { destroy() {} };

  // The stage buttons and the readout live beside the grid, not inside it,
  // so listeners and lookups are scoped to the whole block.
  const scope = root.closest(".bracket-block") || root;
  const wires = $("[data-bracket-wires]", root);
  const readout = $("[data-bracket-readout]", scope);
  const slots = $$("[data-slot]", root);
  if (!slots.length) return { destroy() {} };

  const byId = new Map(slots.map((slot) => [slot.dataset.slot, slot]));

  /* ---- wires: one path per slot → the slot it feeds ---- */

  const NS = "http://www.w3.org/2000/svg";
  const links = [];
  if (wires) {
    wires.replaceChildren();
    slots.forEach((slot) => {
      const next = byId.get(slot.dataset.next || "");
      if (!next) return;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("class", "bracket__wire");
      wires.append(path);
      links.push({ from: slot, to: next, path });
    });
  }

  const draw = () => {
    if (!wires) return;
    const box = root.getBoundingClientRect();
    wires.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    wires.setAttribute("width", String(box.width));
    wires.setAttribute("height", String(box.height));

    const stacked = window.matchMedia("(max-width: 899px)").matches;

    links.forEach((link) => {
      const a = link.from.getBoundingClientRect();
      const b = link.to.getBoundingClientRect();

      if (stacked) {
        const x1 = a.left + a.width / 2 - box.left;
        const y1 = a.bottom - box.top;
        const x2 = b.left + b.width / 2 - box.left;
        const y2 = b.top - box.top;
        const mid = (y1 + y2) / 2;
        link.path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`);
        return;
      }

      const x1 = a.right - box.left;
      const y1 = a.top + a.height / 2 - box.top;
      const x2 = b.left - box.left;
      const y2 = b.top + b.height / 2 - box.top;
      const mid = (x1 + x2) / 2;
      link.path.setAttribute("d", `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`);
    });
  };

  /* ---- stages ---- */

  const setStage = (stage) => {
    if (!STAGES.includes(stage)) return;
    root.dataset.stage = stage;

    slots.forEach((slot) => {
      const round = Number(slot.dataset.round || 1);
      // Registration knows who entered but not where they stand; the draw
      // places them; only results fill the rounds above.
      const known = stage === "result" ? true : stage === "draw" ? round === 1 : false;
      slot.dataset.known = String(known);
      const name = $(".bracket__name", slot);
      if (name) name.textContent = known ? slot.dataset.name : "—";
      if (stage !== "result") slot.removeAttribute("data-lost");
      else slot.toggleAttribute("data-lost", slot.dataset.result === "lost");
    });

    $$("[data-bracket-stage]", scope).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.bracketStage === stage));
    });

    if (readout && !active) {
      readout.textContent = {
        reg: "Вісім заявок прийнято. Позиції ще не визначені.",
        draw: "Жеребкування визначило пари першого кола.",
        result: "Результати внесені — переможці піднялися сіткою."
      }[stage];
    }

    // Names change width when a stage reveals them, so redraw immediately and
    // again after layout settles.
    draw();
    requestAnimationFrame(draw);
  };

  /* ---- path highlighting ---- */

  let active = null;

  const highlight = (athlete) => {
    if (athlete === active) return;
    active = athlete;

    if (!athlete) {
      root.removeAttribute("data-focused");
      slots.forEach((slot) => {
        slot.removeAttribute("data-lit");
        slot.removeAttribute("data-dim");
        slot.removeAttribute("data-future");
      });
      links.forEach((link) => {
        link.path.removeAttribute("data-lit");
        link.path.removeAttribute("data-future");
      });
      setStage(root.dataset.stage || "draw");
      return;
    }

    const mine = slots.filter((slot) => slot.dataset.athlete === athlete);
    const ids = new Set(mine.map((slot) => slot.dataset.slot));

    root.dataset.focused = "true";
    slots.forEach((slot) => {
      const lit = slot.dataset.athlete === athlete;
      slot.toggleAttribute("data-lit", lit);
      slot.toggleAttribute("data-dim", !lit);
    });
    // The part of the route that has not happened yet is drawn as a dotted
    // line — that is exactly the question an athlete asks: what comes next.
    mine.forEach((slot) => slot.toggleAttribute("data-future", slot.dataset.known !== "true"));
    links.forEach((link) => {
      const onPath = ids.has(link.from.dataset.slot);
      link.path.toggleAttribute("data-lit", onPath);
      link.path.toggleAttribute("data-future", onPath && link.to.dataset.known !== "true");
    });

    if (readout) {
      const name = mine[0]?.dataset.name || "";
      const played = mine.filter((slot) => slot.dataset.known === "true").length;
      const ahead = mine.length - played;
      if (ahead > 0 && played > 0) {
        readout.textContent = `${name} — ${meetings(played)} позаду, ${meetings(ahead)} попереду показано пунктиром.`;
      } else if (ahead > 0) {
        readout.textContent = `${name} — місце в сітці ще не визначене, можливий шлях показано пунктиром.`;
      } else if (mine.length === 1) {
        readout.textContent = `${name} — шлях завершився в першому колі.`;
      } else {
        readout.textContent = `${name} — увесь шлях турніром: ${meetings(mine.length)}.`;
      }
    }
  };

  /* ---- input ---- */

  const onOver = (event) => {
    const slot = event.target.closest("[data-slot]");
    if (slot?.dataset.athlete) highlight(slot.dataset.athlete);
  };

  const onOut = (event) => {
    if (!scope.contains(event.relatedTarget)) highlight(null);
  };

  const onFocusIn = (event) => {
    const slot = event.target.closest("[data-slot]");
    if (slot?.dataset.athlete) highlight(slot.dataset.athlete);
  };

  const onClick = (event) => {
    const stageButton = event.target.closest("[data-bracket-stage]");
    if (stageButton) {
      highlight(null);
      setStage(stageButton.dataset.bracketStage);
      track("bracket_stage", stageButton.dataset.bracketStage);
      return;
    }
    const slot = event.target.closest("[data-slot]");
    if (slot?.dataset.athlete) {
      highlight(active === slot.dataset.athlete ? null : slot.dataset.athlete);
      track("bracket_athlete");
    }
  };

  scope.addEventListener("pointerover", onOver);
  scope.addEventListener("pointerout", onOut);
  scope.addEventListener("focusin", onFocusIn);
  scope.addEventListener("click", onClick);

  const observer = new ResizeObserver(draw);
  observer.observe(root);

  setStage(root.dataset.stage || "draw");
  // Draw once synchronously: the ResizeObserver's first callback only lands
  // on the next frame, which leaves the bracket wireless until then.
  draw();

  return {
    destroy() {
      observer.disconnect();
      scope.removeEventListener("pointerover", onOver);
      scope.removeEventListener("pointerout", onOut);
      scope.removeEventListener("focusin", onFocusIn);
      scope.removeEventListener("click", onClick);
      wires?.replaceChildren();
    }
  };
};
