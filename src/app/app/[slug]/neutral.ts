// Colours handed to the older admin panels (profile, screen) reused inside
// /app, so they sit in the neutral owner app instead of the venue's theme.
export const NEUTRAL = {
  isDark: false,
  text: "#1c1917",
  dim: "#57534e",
  muted: "#a8a29e",
  border: "#e7e5e4",
  accent: "#1c1917",
} as const;

/** The same values as CSS variables, for components that read --accent etc. */
export const NEUTRAL_VARS = {
  "--accent": NEUTRAL.accent,
  "--color-text": NEUTRAL.text,
  "--color-dim": NEUTRAL.dim,
  "--color-muted": NEUTRAL.muted,
  "--color-border": NEUTRAL.border,
  "--color-bg": "#ffffff",
} as React.CSSProperties;
