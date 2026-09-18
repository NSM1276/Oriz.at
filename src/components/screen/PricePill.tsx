import type { ReactNode } from "react";
import type { ScreenPalette } from "./screen-colors";

type Props = {
  palette: ScreenPalette;
  /** font-size, e.g. "2.5vh" */
  size: string;
  children: ReactNode;
};

/** The price badge every top menu board uses: accent fill, dark text, pill shape. */
export function PricePill({ palette, size, children }: Props) {
  return (
    <span
      className="font-sans"
      style={{
        display: "inline-block",
        background: palette.accent,
        color: palette.onAccent,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        padding: `calc(${size} * 0.32) calc(${size} * 0.62)`,
        borderRadius: "999px",
        letterSpacing: "0.01em",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
      }}
    >
      {children}
    </span>
  );
}
