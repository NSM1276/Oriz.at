// Same luminance rule as MenuView: WCAG relative luminance, threshold 0.4.
// No runtime imports — unit-tested with node --test.

export type ScreenPalette = {
  bg: string;
  text: string;
  dim: string;
  muted: string;
  border: string;
  accent: string;
  isDark: boolean;
};

const PARCHMENT = "#F5F0EC";
const ONYX = "#0A0A0A";
const GOLD = "#C69B3C";

function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function buildPalette(
  bg: string | null | undefined,
  accent: string | null | undefined,
): ScreenPalette {
  const base = bg ?? PARCHMENT;
  const isDark = luminance(base) < 0.4;
  return {
    bg: base,
    text: isDark ? PARCHMENT : ONYX,
    dim: isDark ? "rgba(245,240,236,0.60)" : "rgba(10,10,10,0.60)",
    muted: isDark ? "rgba(245,240,236,0.30)" : "rgba(10,10,10,0.30)",
    border: isDark ? "rgba(245,240,236,0.12)" : "rgba(10,10,10,0.12)",
    accent: accent ?? GOLD,
    isDark,
  };
}
