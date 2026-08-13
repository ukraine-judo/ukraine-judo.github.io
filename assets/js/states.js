/* =========================================================================
   motosh.dev — three states of one site  (case 01)
   All three panels are in the document; this only decides which one is
   shown. That keeps the whole argument readable without JavaScript and in
   the page source, which is where a case study earns its indexing.
   ========================================================================= */

export function mount() {
  document.querySelectorAll("[data-states]").forEach((root) => {
    const tabs = Array.from(root.querySelectorAll("[data-state-tab]"));
    const panels = Array.from(root.querySelectorAll("[data-state-panel]"));
    if (!tabs.length || tabs.length !== panels.length) return;

    const show = (index) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      panels.forEach((panel, i) => { panel.hidden = i !== index; });
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => show(i));
      tab.addEventListener("keydown", (event) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        const next = (i + step + tabs.length) % tabs.length;
        show(next);
        tabs[next].focus();
      });
    });

    // «Зміна» is the default: the case is about the middle state, not the
    // complaint that opens it.
    show(Number(root.dataset.states) || 0);
  });
}
