// The look of the printed menu (Pro "Druck-Design"). Pure — unit-tested.
//
// The page is always white; the venue's colour is an accent for rules and headings, so the
// sheets print well on an office printer and do not eat toner.

export type Template = "klassisch" | "elegant" | "modern";

export const TEMPLATES: { id: Template; name: string; blurb: string }[] = [
  { id: "klassisch", name: "Klassisch", blurb: "Mittig, ruhig, feine Linie unter den Titeln." },
  { id: "elegant", name: "Elegant", blurb: "Gerichte in Antiqua, Titel zwischen zwei Linien." },
  { id: "modern", name: "Modern", blurb: "Linksbündig, klare Schrift, Farbbalken am Titel." },
];

export type PrintDesign = {
  template: Template;
  /** Hex, or null = the venue's colour from the digital menu. */
  accent: string | null;
  showQr: boolean;
  showAbout: boolean;
};

export const DEFAULT_DESIGN: PrintDesign = { template: "klassisch", accent: null, showQr: true, showAbout: true };

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Validates what comes from the browser; null when it is not a design. */
export function cleanDesign(input: unknown): PrintDesign | null {
  if (!input || typeof input !== "object") return null;
  const d = input as Record<string, unknown>;
  const template = TEMPLATES.find((t) => t.id === d.template)?.id;
  if (!template) return null;
  const accent = d.accent === null || d.accent === undefined ? null : typeof d.accent === "string" && HEX.test(d.accent) ? d.accent.toUpperCase() : undefined;
  if (accent === undefined) return null;
  if (typeof d.showQr !== "boolean" || typeof d.showAbout !== "boolean") return null;
  return { template, accent, showQr: d.showQr, showAbout: d.showAbout };
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** WCAG contrast of a colour against white paper (1 = none, 21 = black). */
export function contrastOnWhite(hex: string): number {
  const [r, g, b] = rgb(hex);
  const lum = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return 1.05 / (lum + 0.05);
}

/**
 * The accent as TEXT colour on white: pale gold would be unreadable, so it is darkened
 * in small steps until the contrast is 4.5:1. Rules and bars use the accent as chosen.
 */
export function textAccent(hex: string): string {
  if (!HEX.test(hex)) return "#0A0A0A";
  let [r, g, b] = rgb(hex);
  let guard = 0;
  while (contrastOnWhite(toHex(r, g, b)) < 4.5 && guard++ < 40) {
    r = Math.round(r * 0.93);
    g = Math.round(g * 0.93);
    b = Math.round(b * 0.93);
  }
  return toHex(r, g, b);
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** The accent that is actually used: the chosen one, else the digital menu's colour, else ink. */
export function resolveAccent(design: PrintDesign, venuePrimary: string | null | undefined): string {
  if (design.accent) return design.accent;
  if (venuePrimary && HEX.test(venuePrimary)) return venuePrimary.toUpperCase();
  return "#0A0A0A";
}

/** Swatches offered in the design form: black, the venue's own colour and the ORIZ palette accents. */
export function accentChoices(venuePrimary: string | null | undefined, presetAccents: string[]): string[] {
  const out: string[] = ["#0A0A0A"];
  const add = (h: string | null | undefined) => {
    if (h && HEX.test(h) && !out.includes(h.toUpperCase())) out.push(h.toUpperCase());
  };
  add(venuePrimary);
  presetAccents.forEach(add);
  return out;
}
