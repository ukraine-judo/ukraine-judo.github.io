/* =========================================================================
   Token lab — «Система, а не сторінки»
   Five controls, one live component, one honest CSS output. Every value the
   visitor can pick is a real token from design-system/variables.css: the
   block cannot produce something that is off-system, which is the point.
   ========================================================================= */

import { $, $$, track } from "./core.js";

const OPTIONS = {
  surface: {
    paper:    { label: "Paper",    token: "--surface-paper",    value: "var(--color-paper)", ink: "var(--color-jet-ink)", line: "var(--color-dove)" },
    cream:    { label: "Cream",    token: "--surface-cream",    value: "var(--color-cream)", ink: "var(--color-jet-ink)", line: "var(--color-dove)" },
    sand:     { label: "Sand",     token: "--surface-sand",     value: "var(--color-sand)",  ink: "var(--color-jet-ink)", line: "color-mix(in srgb, var(--color-jet-ink) 12%, transparent)" },
    charcoal: { label: "Charcoal", token: "--surface-charcoal", value: "var(--color-charcoal)", ink: "var(--color-paper)", line: "color-mix(in srgb, var(--color-paper) 18%, transparent)" }
  },
  density: {
    compact:     { label: "Компактно", token: "--spacing-20", value: "var(--spacing-20)" },
    comfortable: { label: "Комфортно", token: "--card-padding", value: "var(--card-padding)" },
    roomy:       { label: "Просторо",  token: "--spacing-64", value: "var(--spacing-64)" }
  },
  scale: {
    small:   { label: "24", token: "--text-heading-sm",  value: "var(--text-heading-sm)",  lead: "1.14", track: "-0.6px" },
    medium:  { label: "30", token: "--text-subheading",  value: "var(--text-subheading)",  lead: "1.08", track: "-0.75px" },
    large:   { label: "48", token: "--text-heading",     value: "var(--text-heading)",     lead: "1",    track: "-1.2px" }
  },
  shape: {
    card: { label: "Картка", token: "--radius-cards", value: "var(--radius-cards)" },
    pill: { label: "Пігулка", token: "--radius-pills", value: "var(--radius-pills)" }
  },
  accent: {
    none:     { label: "Немає",    token: "—", value: "transparent" },
    beta:     { label: "Sand pill", token: "--color-sand", value: "var(--color-sand)" },
    terminal: { label: "Термінал", token: "--color-sunbeam", value: "var(--color-sunbeam)" }
  }
};

const PRESETS = {
  quiet:    { label: "Тихо",     state: { surface: "paper",    density: "roomy",       scale: "large",  shape: "card", accent: "none" } },
  working:  { label: "Робоче",   state: { surface: "cream",    density: "comfortable", scale: "medium", shape: "card", accent: "beta" } },
  terminal: { label: "Термінал", state: { surface: "charcoal", density: "compact",     scale: "small",  shape: "pill", accent: "terminal" } }
};

const DEFAULT_STATE = { ...PRESETS.working.state };

export const createLab = (root) => {
  if (!root) return { destroy() {} };

  const preview = $("[data-lab-preview]", root);
  const codeNode = $("[data-lab-code]", root);
  const copyButton = $("[data-lab-copy]", root);
  const resetButton = $("[data-lab-reset]", root);
  const state = { ...DEFAULT_STATE };

  const apply = () => {
    const surface = OPTIONS.surface[state.surface];
    const density = OPTIONS.density[state.density];
    const scale = OPTIONS.scale[state.scale];
    const shape = OPTIONS.shape[state.shape];
    const accent = OPTIONS.accent[state.accent];

    preview.style.setProperty("--lab-surface", surface.value);
    preview.style.setProperty("--lab-ink", surface.ink);
    preview.style.setProperty("--lab-line", surface.line);
    preview.style.setProperty("--lab-pad", density.value);
    preview.style.setProperty("--lab-title", scale.value);
    preview.style.setProperty("--lab-leading", scale.lead);
    preview.style.setProperty("--lab-tracking", scale.track);
    preview.style.setProperty("--lab-radius", shape.value);
    preview.dataset.accent = state.accent;
    preview.dataset.surface = state.surface;

    codeNode.textContent = [
      `/* .case-card — ${Object.values(state).join(" · ")} */`,
      `.case-card {`,
      `  background: ${surface.value};`,
      `  color: ${surface.ink};`,
      `  padding: ${density.value};`,
      `  border-radius: ${shape.value};`,
      `  box-shadow: inset 0 0 0 1px ${surface.line};`,
      `}`,
      ``,
      `.case-card h3 {`,
      `  font-size: ${scale.value};`,
      `  line-height: ${scale.lead};`,
      `  letter-spacing: ${scale.track};`,
      `}`,
      accent.value === "transparent"
        ? `\n/* без акценту — система за замовчуванням мовчить */`
        : `\n.case-card__accent { background: ${accent.value}; }`
    ].join("\n");

    $$("[data-lab-option]", root).forEach((button) => {
      const [group, key] = button.dataset.labOption.split(":");
      button.setAttribute("aria-pressed", String(state[group] === key));
    });

    $$("[data-lab-preset]", root).forEach((button) => {
      const preset = PRESETS[button.dataset.labPreset];
      const matches = preset && Object.entries(preset.state).every(([key, value]) => state[key] === value);
      button.setAttribute("aria-pressed", String(Boolean(matches)));
    });
  };

  const onClick = (event) => {
    const option = event.target.closest("[data-lab-option]");
    if (option) {
      const [group, key] = option.dataset.labOption.split(":");
      if (!OPTIONS[group]?.[key]) return;
      state[group] = key;
      apply();
      track("lab_option", `${group}:${key}`);
      return;
    }

    const presetButton = event.target.closest("[data-lab-preset]");
    if (presetButton) {
      const preset = PRESETS[presetButton.dataset.labPreset];
      if (!preset) return;
      Object.assign(state, preset.state);
      apply();
      track("lab_preset", presetButton.dataset.labPreset);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeNode.textContent);
      copyButton.dataset.copied = "true";
      copyButton.textContent = "Скопійовано";
      window.setTimeout(() => {
        delete copyButton.dataset.copied;
        copyButton.textContent = "Копіювати CSS";
      }, 1600);
      track("lab_copy");
    } catch {
      /* clipboard unavailable — the CSS is already on screen */
    }
  };

  const onReset = () => {
    Object.assign(state, DEFAULT_STATE);
    apply();
    track("lab_reset");
  };

  root.addEventListener("click", onClick);
  copyButton?.addEventListener("click", onCopy);
  resetButton?.addEventListener("click", onReset);

  apply();

  return {
    destroy() {
      root.removeEventListener("click", onClick);
      copyButton?.removeEventListener("click", onCopy);
      resetButton?.removeEventListener("click", onReset);
    }
  };
};
