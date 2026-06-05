// ── ORIZ Color Presets ──────────────────────────────────────────
// Each preset is a complete, tested color combination.
// bg + accent are chosen so text always reads well (light on dark / dark on light).
// The menu views auto-calculate text/dim/muted/border from bg luminance — so
// the owner only needs to pick ONE preset and the system handles everything.

export type ColorPreset = {
  id: string;
  label: string;
  color_bg: string;
  color_primary: string; // accent
};

export const COLOR_PRESETS: ColorPreset[] = [
  // ── Light ──────────────────────────────────────────────────────
  { id: "pergament",  label: "Pergament",  color_bg: "#F5F0EC", color_primary: "#C69B3C" },
  { id: "weiss",      label: "Weiß",       color_bg: "#FFFFFF", color_primary: "#C69B3C" },
  { id: "elfenbein",  label: "Elfenbein",  color_bg: "#FAF6F1", color_primary: "#B87333" },
  { id: "sand",       label: "Sand",       color_bg: "#F2EDE5", color_primary: "#C4673A" },
  { id: "leinen",     label: "Leinen",     color_bg: "#EDE8E0", color_primary: "#8B7355" },
  // ── Dark ───────────────────────────────────────────────────────
  { id: "onyx",       label: "Onyx",       color_bg: "#0A0A0A", color_primary: "#C69B3C" },
  { id: "nacht",      label: "Nacht",      color_bg: "#1C1208", color_primary: "#C8963E" },
  { id: "anthrazit",  label: "Anthrazit",  color_bg: "#1E2328", color_primary: "#B87333" },
  { id: "gruen",      label: "Grün",       color_bg: "#1A2B1A", color_primary: "#C8C46A" },
  { id: "marine",     label: "Marine",     color_bg: "#0F1624", color_primary: "#8BA7C4" },
];

export const PRESET_IDS = new Set(COLOR_PRESETS.map((p) => p.id));

/** Find preset by color_bg (case-insensitive). Returns null if bg is custom / not in palette. */
export function findPreset(color_bg: string | null | undefined): ColorPreset | null {
  if (!color_bg) return null;
  return (
    COLOR_PRESETS.find(
      (p) => p.color_bg.toLowerCase() === color_bg.toLowerCase(),
    ) ?? null
  );
}
