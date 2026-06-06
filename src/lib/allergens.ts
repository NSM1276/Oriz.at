import type { ReactElement } from "react";
import { createElement } from "react";

/**
 * Austrian/EU allergen letter codes (A–R) → German labels.
 * Reference: Codex-Empfehlung / LMIV Anhang II.
 */
export const ALLERGEN_LABELS: Record<string, string> = {
  A: "Gluten",
  B: "Krebstiere",
  C: "Eier",
  D: "Fisch",
  E: "Erdnüsse",
  F: "Soja",
  G: "Milch",
  H: "Schalenfrüchte (Nüsse)",
  L: "Sellerie",
  M: "Senf",
  N: "Sesam",
  O: "Sulfite",
  P: "Lupinen",
  R: "Weichtiere",
};

export type AllergenCode = keyof typeof ALLERGEN_LABELS;

/**
 * Parse a free-text allergen string into ordered, deduped, known codes.
 * Splits on commas/whitespace, uppercases, trims; drops unknown codes;
 * preserves first-seen order.
 */
export function parseAllergenCodes(
  raw: string | null | undefined,
): { code: string; label: string }[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: { code: string; label: string }[] = [];
  for (const token of raw.split(/[\s,]+/)) {
    const code = token.trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    const label = ALLERGEN_LABELS[code];
    if (!label) continue;
    seen.add(code);
    out.push({ code, label });
  }
  return out;
}

const SVG = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

/** Refined fallback glyph — a small open ring. */
function genericIcon(): ReactElement {
  return createElement("svg", SVG, createElement("circle", { cx: 12, cy: 12, r: 7 }));
}

/**
 * Minimal, thin-stroke line icon per allergen code.
 * All use currentColor so they adopt chip text color (CSS-var driven).
 */
const ICON_PATHS: Record<string, ReactElement> = {
  // A — Gluten: wheat / grain ear
  A: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M12 21V8" }),
    createElement("path", { d: "M12 8c0-2 1.6-3.6 3.6-3.6C15.6 6.4 14 8 12 8Z" }),
    createElement("path", { d: "M12 8c0-2-1.6-3.6-3.6-3.6C8.4 6.4 10 8 12 8Z" }),
    createElement("path", { d: "M12 13c0-2 1.6-3.6 3.6-3.6C15.6 11.4 14 13 12 13Z" }),
    createElement("path", { d: "M12 13c0-2-1.6-3.6-3.6-3.6C8.4 11.4 10 13 12 13Z" }),
  ),
  // B — Krebstiere: crustacean / shrimp curl
  B: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M7 7c5 0 9 3 9 8a3 3 0 0 1-6 0c0-3 3-4 6-4" }),
    createElement("path", { d: "M7 7l-2-2M7 7L4 8" }),
  ),
  // C — Eier: egg
  C: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M12 3c-3.3 0-6 4-6 8a6 6 0 0 0 12 0c0-4-2.7-8-6-8Z" }),
  ),
  // D — Fisch: fish
  D: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M3 12c3-4 9-5 13-2 1.5 1.1 3 2 5 2-2 0-3.5.9-5 2-4 3-10 2-13-2Z" }),
    createElement("path", { d: "M16 11.5h.01" }),
  ),
  // E — Erdnüsse: peanut shell
  E: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M9 4.5c2 0 3 1.5 3 3.5s1 3.5 3 3.5 3 1.5 3 3.5-1.5 3.5-3.5 3.5S9 19 9 16s-1-3.5-3-3.5S3 11 3 9s1.5-4.5 3.5-4.5S9 4.5 9 4.5Z" }),
  ),
  // F — Soja: soybean / two beans
  F: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M14 4c4 0 6 3 6 6s-3 6-7 6-6-3-6-6" }),
    createElement("circle", { cx: 9, cy: 16, r: 4 }),
  ),
  // G — Milch: milk drop
  G: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M12 3c0 4-5 7-5 11a5 5 0 0 0 10 0c0-4-5-7-5-11Z" }),
  ),
  // H — Schalenfrüchte (Nüsse): nut / acorn
  H: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M6 9a6 6 0 0 1 12 0c0 5-3 11-6 11S6 14 6 9Z" }),
    createElement("path", { d: "M6 9h12" }),
  ),
  // L — Sellerie: celery / leaf stalk
  L: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M12 21V8" }),
    createElement("path", { d: "M12 8c-1-3-4-4-6-4 0 3 2 5 6 4Z" }),
    createElement("path", { d: "M12 10c1-3 4-4 6-4 0 3-2 5-6 4Z" }),
  ),
  // M — Senf: mustard / seed sprig
  M: createElement(
    "svg",
    SVG,
    createElement("circle", { cx: 12, cy: 16, r: 5 }),
    createElement("path", { d: "M12 11V5M12 5c2 0 3-1 3-3M12 7c-2 0-3-1-3-3" }),
  ),
  // N — Sesam: sesame seeds
  N: createElement(
    "svg",
    SVG,
    createElement("ellipse", { cx: 8, cy: 9, rx: 2, ry: 3, transform: "rotate(-25 8 9)" }),
    createElement("ellipse", { cx: 15, cy: 11, rx: 2, ry: 3, transform: "rotate(20 15 11)" }),
    createElement("ellipse", { cx: 11, cy: 16, rx: 2, ry: 3, transform: "rotate(-10 11 16)" }),
  ),
  // O — Sulfite: flask / droplet (sulphur dioxide)
  O: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M10 3v6l-5 8a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-5-8V3" }),
    createElement("path", { d: "M9 3h6" }),
  ),
  // P — Lupinen: pea pod / legume
  P: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z" }),
    createElement("path", { d: "M10 14h.01M13 11h.01" }),
  ),
  // R — Weichtiere: mollusc / shell
  R: createElement(
    "svg",
    SVG,
    createElement("path", { d: "M12 20C5 20 3 10 12 5c9 5 7 15 0 15Z" }),
    createElement("path", { d: "M12 5v15M8 8l-2-1M16 8l2-1M7 12H4M17 12h3" }),
  ),
};

/** Returns the inline SVG icon element for a code (refined fallback if unknown). */
export function allergenIcon(code: string): ReactElement {
  return ICON_PATHS[code.toUpperCase()] ?? genericIcon();
}
