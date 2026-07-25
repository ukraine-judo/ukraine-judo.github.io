/* =========================================================================
   Design-system token index
   Reads the custom properties that are ACTUALLY loaded in the page and
   builds a reverse lookup value → token name. Everything the inspector
   reports is derived from this index plus getComputedStyle, so the page
   cannot claim a token it does not really use — and if a value drifts out
   of the system, the inspector says so out loud instead of hiding it.
   ========================================================================= */

const canvas = document.createElement("canvas").getContext("2d");

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = (r, g, b) =>
  `#${[r, g, b].map((c) => clamp255(c).toString(16).padStart(2, "0")).join("")}`;

/**
 * Parses any computed colour into {hex, alpha}. Alpha is separated so a
 * `color-mix(… 56%, transparent)` still resolves to the token it is made of,
 * reported as "--color-paper 56%" rather than flagged as off-system.
 */
export const parseColor = (value) => {
  if (!value) return null;
  const input = String(value).trim();
  if (!input || input === "none" || input === "transparent") return null;

  // Modern `color(srgb r g b / a)` — canvas does not always round-trip it.
  const modern = input.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);
  if (modern) {
    return {
      hex: toHex(Number(modern[1]) * 255, Number(modern[2]) * 255, Number(modern[3]) * 255),
      alpha: modern[4] === undefined ? 1 : Number(modern[4])
    };
  }

  const rgb = input.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?\s*\)$/i);
  if (rgb) {
    const raw = rgb[4];
    const alpha = raw === undefined ? 1 : raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number(raw);
    return { hex: toHex(Number(rgb[1]), Number(rgb[2]), Number(rgb[3])), alpha };
  }

  try {
    canvas.fillStyle = "#000";
    canvas.fillStyle = input;
    const first = canvas.fillStyle;
    canvas.fillStyle = "#fff";
    canvas.fillStyle = input;
    if (first !== canvas.fillStyle) return null;
    return /^#/.test(first) ? { hex: first.toLowerCase(), alpha: 1 } : parseColor(first);
  } catch {
    return null;
  }
};

/** Canonical opaque colour key. */
const normalizeColor = (value) => parseColor(value)?.hex || null;

const normalizeLength = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(/^(-?[\d.]+)px$/);
  if (!match) return null;
  const px = Number(match[1]);
  return Number.isFinite(px) ? `${Math.round(px * 100) / 100}px` : null;
};

/* A flat value→name map is wrong: 16px is both --radius-cards and
   --text-body, and 4px is both --spacing-4 and --spacing-unit. Lookups are
   scoped by category, and within a category a preference order picks the
   name a human would actually write. */
const CATEGORY = {
  color: {
    normalize: normalizeColor,
    match: (name) => name.startsWith("--color-") || name.startsWith("--surface-"),
    rank: (name) => (name.startsWith("--color-") ? 0 : 1)
  },
  radius: {
    normalize: normalizeLength,
    match: (name) => name.startsWith("--radius-"),
    rank: (name) => (/^--radius-(cards|pills|inputs|buttons|smallcards)$/.test(name) ? 0 : 1)
  },
  space: {
    normalize: normalizeLength,
    match: (name) =>
      name.startsWith("--spacing-") ||
      name === "--card-padding" ||
      name === "--element-gap" ||
      name === "--section-gap" ||
      name === "--hairline",
    rank: (name) => (/^--spacing-\d+$/.test(name) ? 0 : name === "--spacing-unit" ? 2 : 1)
  }
};

export const createTokenIndex = () => {
  const byName = new Map();
  const indexes = {
    color: new Map(),
    radius: new Map(),
    space: new Map()
  };
  let readable = 0;
  let blocked = 0;

  const readSheet = (sheet) => {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet (Google Fonts) — expected, not an error.
      blocked += 1;
      return;
    }
    if (!rules) return;
    readable += 1;

    for (const rule of rules) {
      if (rule.styleSheet) {
        readSheet(rule.styleSheet);
        continue;
      }
      if (rule.cssRules && !rule.style) {
        // @media / @layer / @supports wrappers
        readSheet(rule);
        continue;
      }
      if (!rule.style || !rule.selectorText) continue;
      if (!/(^|,)\s*:root\s*(,|$)/.test(rule.selectorText)) continue;

      for (const property of rule.style) {
        if (!property.startsWith("--")) continue;
        const raw = rule.style.getPropertyValue(property).trim();
        if (!raw) continue;
        byName.set(property, raw);
      }
    }
  };

  Array.from(document.styleSheets).forEach(readSheet);

  /* Resolve var() chains against the live root so aliases land on values. */
  const rootStyle = getComputedStyle(document.documentElement);
  byName.forEach((raw, name) => {
    const resolved = rootStyle.getPropertyValue(name).trim() || raw;
    byName.set(name, resolved);

    Object.entries(CATEGORY).forEach(([kind, category]) => {
      if (!category.match(name)) return;
      const key = category.normalize(resolved);
      if (!key) return;
      const held = indexes[kind].get(key);
      if (!held || category.rank(name) < category.rank(held)) {
        indexes[kind].set(key, name);
      }
    });
  });

  const lookup = (value, kind) => {
    const category = CATEGORY[kind];
    if (!category) return null;
    const key = category.normalize(value);
    if (!key) return null;
    const direct = indexes[kind].get(key);
    if (direct) return direct;
    return kind === "space" ? probeFluidSpace().get(key) || null : null;
  };

  /* The type scale is a triple, not a single value. */
  const typeScale = [
    { token: "--text-caption", size: "12px" },
    { token: "--text-body-sm", size: "14px" },
    { token: "--text-body", size: "16px" },
    { token: "--text-heading-sm", size: "24px" },
    { token: "--text-subheading", size: "30px" },
    { token: "--text-heading", size: "48px" },
    { token: "--text-heading-lg", size: "60px" },
    { token: "--text-display", size: "72px" }
  ];

  /* A clamp() custom property is not resolved by getComputedStyle at :root —
     it comes back as the literal `clamp(...)` string. The only honest way to
     know what it currently evaluates to is to apply it to something and
     measure. Probed lazily and re-probed when the viewport changes. */
  const FLUID = ["--text-display-xl", "--text-display-lg", "--text-section"];
  const FLUID_SPACE = ["--gap-sm", "--gap-md", "--gap-lg", "--gap-xl", "--section-pad"];
  let fluidMap = null;
  let fluidSpaceMap = null;
  let fluidWidth = -1;
  let fluidSpaceWidth = -1;

  /* Fluid lengths are clamps too: resolve them by measuring, then fold the
     results into the spacing lookup so `--gap-lg` reads like any token. */
  const probeFluidSpace = () => {
    if (fluidSpaceWidth === window.innerWidth && fluidSpaceMap) return fluidSpaceMap;
    const host = document.createElement("div");
    host.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;top:0;left:0";
    const probes = FLUID_SPACE.map((token) => {
      const node = document.createElement("div");
      node.style.paddingTop = `var(${token})`;
      host.append(node);
      return node;
    });
    document.body.append(host);

    fluidSpaceMap = new Map();
    probes.forEach((node, position) => {
      const size = normalizeLength(getComputedStyle(node).paddingTop);
      if (size && !fluidSpaceMap.has(size)) fluidSpaceMap.set(size, FLUID_SPACE[position]);
    });
    host.remove();
    fluidSpaceWidth = window.innerWidth;
    return fluidSpaceMap;
  };

  const probeFluid = () => {
    if (fluidWidth === window.innerWidth && fluidMap) return fluidMap;

    // One element per token: reassigning font-size on a single probe and
    // re-reading getComputedStyle returns the first resolved value, because
    // the style recalc has not been flushed between assignments.
    const host = document.createElement("div");
    host.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;top:0;left:0";
    const probes = FLUID.map((token) => {
      const node = document.createElement("span");
      node.style.fontSize = `var(${token})`;
      host.append(node);
      return node;
    });
    document.body.append(host);

    fluidMap = new Map();
    probes.forEach((node, position) => {
      const size = normalizeLength(getComputedStyle(node).fontSize);
      if (size && !fluidMap.has(size)) fluidMap.set(size, FLUID[position]);
    });

    host.remove();
    fluidWidth = window.innerWidth;
    return fluidMap;
  };

  const lookupType = (fontSize) => {
    const px = normalizeLength(fontSize);
    if (!px) return null;
    const fixed = typeScale.find((entry) => entry.size === px)?.token;
    if (fixed) return fixed;
    return probeFluid().get(px) || null;
  };

  return {
    get size() {
      return byName.size;
    },
    get available() {
      return byName.size > 0;
    },
    get diagnostics() {
      return { tokens: byName.size, readableSheets: readable, blockedSheets: blocked };
    },
    value: (name) => byName.get(name) || null,
    names: () => Array.from(byName.keys()),
    entries: () => Array.from(byName.entries()),
    colors: () =>
      Array.from(byName.entries())
        .filter(([name]) => name.startsWith("--color-") || name.startsWith("--surface-"))
        .map(([name, value]) => ({ name, value })),
    lookup,
    lookupType
  };
};

/* ---------------------------------------------------------------- reading */

const LABEL = {
  background: "тло",
  color: "текст",
  radius: "радіус",
  padding: "внутрішні відступи",
  gap: "проміжок",
  ring: "обвідка",
  font: "розмір тексту",
  tracking: "трекінг",
  leading: "інтерліньяж"
};

/**
 * Reads an element and returns the design-system declaration behind it.
 * Every row is measured, never authored. `token: null` means the value is
 * genuinely outside the system, and the inspector must say so.
 */
export const readElementSpec = (element, index) => {
  const styles = getComputedStyle(element);
  const rows = [];

  const pushColor = (role, value) => {
    const parsed = parseColor(value);
    if (!parsed || parsed.alpha === 0) return;
    const token = index.lookup(parsed.hex, "color");
    const opaque = parsed.alpha > 0.995;
    rows.push({
      role: LABEL[role] || role,
      value: opaque ? parsed.hex : `${parsed.hex} · ${Math.round(parsed.alpha * 100)}%`,
      // A colour-mix down to transparency is still the token it is made of.
      token: token && !opaque ? `${token} ${Math.round(parsed.alpha * 100)}%` : token
    });
  };

  pushColor("background", styles.backgroundColor);
  pushColor("color", styles.color);

  const radius = styles.borderTopLeftRadius;
  if (radius && radius !== "0px") {
    // The pill radius resolves to half the box height, so match on intent.
    const numeric = Number.parseFloat(radius);
    const token = numeric > 100 ? "--radius-pills" : index.lookup(radius, "radius");
    rows.push({ role: LABEL.radius, value: numeric > 100 ? "9999px" : radius, token });
  }

  const padding = styles.paddingTop;
  if (padding && padding !== "0px") {
    rows.push({ role: LABEL.padding, value: padding, token: index.lookup(padding, "space") });
  }

  if (styles.rowGap && styles.rowGap !== "normal" && styles.rowGap !== "0px") {
    rows.push({ role: LABEL.gap, value: styles.rowGap, token: index.lookup(styles.rowGap, "space") });
  }

  const fontSize = styles.fontSize;
  // An icon glyph's font-size is an icon dimension, not a type-scale step.
  const isIconFont = /material symbols/i.test(styles.fontFamily);
  if (fontSize && !isIconFont) {
    // GeistMono carries its own documented 10–13px scale, which the token
    // file does not enumerate. Attributing those sizes to the sans scale
    // would be a false positive, so mono is reported as mono.
    const isMono = /mono/i.test(styles.fontFamily);
    const px = Number.parseFloat(fontSize);
    const monoOnScale = isMono && px >= 10 && px <= 13;
    rows.push({
      role: LABEL.font,
      value: fontSize,
      token: monoOnScale ? "--font-mono" : index.lookupType(fontSize)
    });
  }

  return {
    name: element.dataset.specName || element.tagName.toLowerCase(),
    rows,
    offSystem: rows.filter((row) => !row.token).length
  };
};
