"use client";

import { useState } from "react";

interface Props {
  slug: string;
  name: string;
  accent: string;
}

/**
 * Shown only on demo venues (ristorante-tosca, brasserie-lumiere, sushi-schonbrunn).
 * Lets a prospective client switch to the admin view with one tap.
 * Dismissible so they can browse the guest menu undistracted.
 */
export function DemoBanner({ slug, name, accent }: Props) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const adminUrl = `/admin/preview/${slug}`;

  return (
    <div
      style={{
        background: "rgba(10,10,10,0.96)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${accent}33`,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minHeight: 60,
        boxSizing: "border-box",
        // iOS safe area
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Left: label */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accent,
            fontFamily: "var(--font-inter, sans-serif)",
            whiteSpace: "nowrap",
          }}
        >
          ORIZ · Demo
        </span>
        <span
          style={{
            fontSize: 12,
            color: "rgba(245,240,236,0.60)",
            fontFamily: "var(--font-inter, sans-serif)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </span>
      </div>

      {/* Right: CTA + close */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <a
          href={adminUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: accent,
            color: "#0A0A0A",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "var(--font-inter, sans-serif)",
            padding: "0 16px",
            height: 40,
            borderRadius: 2,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Als Inhaber testen →
        </a>
        <button
          onClick={() => setVisible(false)}
          aria-label="Schließen"
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid rgba(245,240,236,0.15)",
            color: "rgba(245,240,236,0.40)",
            fontSize: 14,
            cursor: "pointer",
            borderRadius: 2,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
