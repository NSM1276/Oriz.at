// Renders a tenant logo with theme-aware recoloring.
//
// Usage:
//   <VenueLogo svg={venue.logo_svg} url={venue.logo_url} name={venue.name}
//              color="auto" bg={venue.color_bg} accent={venue.color_primary}
//              height={48} />
//
// Color modes:
//   "auto"     — picks parchment or onyx based on bg luminance
//   "accent"   — uses venue's accent color (color_primary)
//   "contrast" — full max contrast (white on dark, black on light)
//   <string>   — any explicit CSS color value
//
// Fallback chain: SVG → PNG/JPG url → text (venue name in Garamond).

type Props = {
  svg?: string | null;
  url?: string | null;
  name: string;
  color?: "auto" | "accent" | "contrast" | string;
  bg?: string | null;
  accent?: string | null;
  height?: number;
  className?: string;
  /** Back-compat with old call sites that passed logoUrl/size/isDarkBg. */
  logoUrl?: string | null;
  size?: "lg" | "md";
  isDarkBg?: boolean;
  textColor?: string;
};

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function resolveColor(
  mode: Props["color"],
  bg: string | null | undefined,
  accent: string | null | undefined,
  isDarkBg: boolean | undefined,
): string {
  if (mode === "accent") return accent ?? "#C69B3C";
  const isDark = isDarkBg ?? (bg ? luminance(bg) < 0.45 : false);
  if (mode === "contrast") return isDark ? "#FFFFFF" : "#000000";
  if (mode === undefined || mode === "auto") {
    return isDark ? "#F5F0EC" : "#0A0A0A";
  }
  return mode;
}

export function VenueLogo({
  svg,
  url,
  name,
  color = "auto",
  bg,
  accent,
  height,
  className,
  // legacy props
  logoUrl,
  size,
  isDarkBg,
  textColor,
}: Props) {
  const effectiveUrl = url ?? logoUrl ?? null;
  const effectiveHeight =
    height ?? (size === "md" ? 40 : size === "lg" ? 120 : 48);
  const resolved = textColor ?? resolveColor(color, bg, accent, isDarkBg);

  // SVG inline with currentColor (normalized server-side at upload time).
  if (svg) {
    return (
      <div
        className={className}
        style={{
          color: resolved,
          height: effectiveHeight,
          display: "inline-flex",
          alignItems: "center",
        }}
        dangerouslySetInnerHTML={{ __html: enforceHeight(svg, effectiveHeight) }}
      />
    );
  }

  // PNG/JPG fallback
  if (effectiveUrl) {
    return (
      <img
        src={effectiveUrl}
        alt={name}
        className={className}
        style={{ height: effectiveHeight, width: "auto", display: "block" }}
      />
    );
  }

  // Text fallback in display font
  return (
    <span
      className={`font-display shimmer-heading ${className ?? ""}`}
      style={{
        fontSize: Math.round(effectiveHeight * 0.7),
        lineHeight: 1,
        fontWeight: 300,
      }}
    >
      {name}
    </span>
  );
}

function enforceHeight(svg: string, height: number): string {
  const hStyle = `height:${height}px;width:auto;display:block`;
  return svg.replace(/<svg\b([^>]*)>/i, (_m, attrs) => {
    const stripped = attrs
      .replace(/\s*style\s*=\s*"[^"]*"/gi, "")
      .replace(/\s*style\s*=\s*'[^']*'/gi, "");
    return `<svg${stripped} style="${hStyle}">`;
  });
}
