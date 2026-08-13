/* =========================================================================
   motosh.dev — the draw  (case 03)

   The whole tree is in the document: eight names, seven meetings, who beat
   whom. This file only lights the selected athlete's route through it —
   what is behind them solid, what is ahead dashed — and, on the phone,
   prints that route as a list, because a five-column bracket at 375px is a
   diagram nobody can read.
   ========================================================================= */

export function mount() {
  const bracket = document.querySelector("[data-bracket]");
  if (!bracket) return;

  const matches = Array.from(bracket.querySelectorAll("[data-match]"));
  const elbows = Array.from(bracket.querySelectorAll("[data-elbow]"));
  const picks = Array.from(bracket.querySelectorAll("[data-pick]"));
  const path = bracket.querySelector("[data-path]");
  const name = bracket.querySelector("[data-pick-name]");
  const summary = bracket.querySelector("[data-pick-summary]");
  if (!matches.length) return;

  const num = (el, key) => Number(el.dataset[key]);
  const won = (el) => (el.dataset.w === "" ? null : Number(el.dataset.w));

  const label = (index) => {
    const side = bracket.querySelector(`[data-side="${index}"]`);
    return side ? side.querySelector("span").textContent.trim() : `№${index + 1}`;
  };

  const render = (pick) => {
    picks.forEach((b) => b.setAttribute("aria-pressed", String(num(b, "pick") === pick)));

    matches.forEach((match) => {
      const a = num(match, "a");
      const b = num(match, "b");
      const winner = won(match);
      match.classList.toggle("is-on", a === pick || b === pick);

      Array.from(match.querySelectorAll("[data-side]")).forEach((side) => {
        const who = num(side, "side");
        const decided = winner !== null;
        side.classList.toggle("is-pick", who === pick);
        side.classList.toggle("is-out", decided && winner !== who);
      });
    });

    elbows.forEach((elbow) => {
      const ahead = elbow.dataset.done !== "true";
      const mine = num(elbow, "a") === pick || num(elbow, "b") === pick;
      elbow.classList.toggle("is-on", mine);
      elbow.classList.toggle("is-ahead", mine && ahead);
    });

    // The route, printed.
    const steps = matches.filter((m) => num(m, "a") === pick || num(m, "b") === pick);
    if (name) name.textContent = label(pick);

    if (summary) {
      const decided = steps.filter((m) => won(m) !== null).length;
      summary.textContent = `${decided} з ${steps.length} зустрічей проведено`;
    }

    if (!path) return;
    path.textContent = "";

    steps.forEach((match) => {
      const winner = won(match);
      const rival = num(match, "a") === pick ? num(match, "b") : num(match, "a");
      const decided = winner !== null;
      const state = !decided
        ? "Зустріч попереду"
        : winner === pick ? "Перемога — далі по сітці" : "Поразка — шлях завершено";

      const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
      };

      const row = el("div", `chron__item${decided ? " chron__item--now" : ""}`);
      const thread = el("span", "chron__thread");
      thread.append(el("i"), el("span"));

      const body = el("span", "chron__body");
      body.append(
        el("span", "caps caps--bronze", match.dataset.round),
        el("span", null, `проти ${label(rival)}`),
        el("span", "body", state)
      );

      row.append(thread, body);
      path.append(row);
    });
  };

  picks.forEach((b) => b.addEventListener("click", () => render(num(b, "pick"))));

  matches.forEach((match) => {
    Array.from(match.querySelectorAll("[data-side]")).forEach((side) => {
      side.addEventListener("click", () => render(num(side, "side")));
    });
  });

  render(0);
}
