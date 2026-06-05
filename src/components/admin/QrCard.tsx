"use client";

import { useState } from "react";

type Props = {
  name: string;
  url: string;
  accent: string;
  kind: "carta" | "casa";
  subtitle?: string;
  // logoSvg / logoUrl kept in props for API compatibility but not rendered —
  // a small QR sticker has no room for logos and they cause dark-on-dark problems.
  logoSvg?: string | null;
  logoUrl?: string | null;
};

// Print-ready 90×90 mm QR sticker with light/dark toggle.
// Owner downloads as PDF → prints at any copy shop.
// Also works as NFC-card companion (same URL, same visual identity).

export function QrCard({ name, url, accent, kind, subtitle }: Props) {
  const [dark, setDark] = useState(false);

  const title = kind === "carta" ? "Speisekarte" : "Willkommen";

  // ── Color palette ─────────────────────────────────────────────────
  const cardBg      = dark ? "#0A0A0A"                      : "#F5F0EC";
  const textMain    = dark ? "#F5F0EC"                      : "#0A0A0A";
  const textMuted   = dark ? "rgba(245,240,236,0.30)"       : "rgba(10,10,10,0.30)";
  const qrBg        = dark ? "0A0A0A"                       : "ffffff";
  const qrColor     = dark ? "F5F0EC"                       : "0A0A0A";
  const qrBoxBg     = dark ? "#141414"                      : "#ffffff";
  const qrBoxBorder = dark ? `1px solid rgba(245,240,236,0.10)` : `1px solid rgba(10,10,10,0.08)`;
  const screenBg    = dark ? "#111111"                      : "#E5E0DA";

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&margin=0&color=${qrColor}&bgcolor=${qrBg}&data=${encodeURIComponent(url)}`;

  return (
    <>
      <style>{`
        @page { size: 90mm 90mm; margin: 0; }
        @media print {
          html, body { background: ${cardBg} !important; margin: 0; padding: 0; }
          .no-print  { display: none !important; }
          .qr-card   { box-shadow: none !important; margin: 0 !important;
                       width: 90mm !important; height: 90mm !important; }
        }
        html, body { background: ${screenBg}; margin: 0; padding: 0; transition: background 0.25s; }
      `}</style>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          padding: "12px 20px",
          background: "rgba(10,10,10,0.90)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "var(--font-inter, sans-serif)", zIndex: 100, gap: 12,
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C69B3C", flexShrink: 0 }}>
          ORIZ · Druckvorschau
        </span>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Hell / Dunkel */}
          <div style={{ display: "flex", border: "1px solid rgba(245,240,236,0.2)", overflow: "hidden" }}>
            {([{ label: "Hell", val: false }, { label: "Dunkel", val: true }] as const).map(({ label, val }) => (
              <button
                key={label}
                onClick={() => setDark(val)}
                style={{
                  fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                  padding: "7px 14px", cursor: "pointer", fontFamily: "inherit",
                  background: dark === val ? "#C69B3C" : "transparent",
                  color:      dark === val ? "#0A0A0A" : "rgba(245,240,236,0.55)",
                  border: "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              padding: "8px 18px", background: "#C69B3C", color: "#0A0A0A",
              border: "none", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Drucken / als PDF speichern
          </button>
          <button
            onClick={() => window.close()}
            style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              padding: "8px 14px", background: "transparent", color: "#F5F0EC",
              border: "1px solid rgba(245,240,236,0.3)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Schließen
          </button>
        </div>
      </div>

      {/* ── Preview area ─────────────────────────────────────────── */}
      <div
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", padding: "80px 20px 40px",
        }}
      >
        {/*
         * 90 × 90 mm square card.
         * Layout (top → bottom):
         *   4 mm  top padding
         *   ≈6 mm  label row  (title + accent rule)
         *   flex   gap
         *   64 mm  QR box  (60 mm QR + 2 mm padding each side)
         *   flex   gap
         *   ≈8 mm  name row  (name + ORIZ watermark)
         *   4 mm  bottom padding
         */}
        <div
          className="qr-card"
          style={{
            width: "90mm", height: "90mm",
            background: cardBg,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "space-between",
            padding: "4mm 4mm",
            boxShadow: "0 16px 60px rgba(0,0,0,0.30)",
            boxSizing: "border-box",
            transition: "background 0.25s",
          }}
        >
          {/* Top label */}
          <div style={{ textAlign: "center", width: "100%" }}>
            <p style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: "7.5px", letterSpacing: "0.35em",
              textTransform: "uppercase", color: accent,
              margin: "0 0 2mm",
            }}>
              {title}
            </p>
            <div style={{ width: "18mm", height: "0.4mm", background: accent, opacity: 0.55, margin: "0 auto" }} />
          </div>

          {/* QR code — dominant */}
          <div
            style={{
              background: qrBoxBg,
              border: qrBoxBorder,
              padding: "2mm",
              flexShrink: 0,
              lineHeight: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`QR · ${name}`}
              style={{ display: "block", width: "60mm", height: "60mm" }}
            />
          </div>

          {/* Bottom: name + ORIZ */}
          <div style={{ textAlign: "center", width: "100%" }}>
            <div style={{ width: "18mm", height: "0.4mm", background: accent, opacity: 0.55, margin: "0 auto 2mm" }} />
            <h1 style={{
              fontFamily: "var(--font-garamond, serif)",
              fontWeight: 300, fontSize: "13pt",
              color: textMain, margin: "0 0 1.5mm", lineHeight: 1.1,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {name}
            </h1>
            {subtitle && (
              <p style={{
                fontFamily: "var(--font-garamond, serif)",
                fontStyle: "italic", fontSize: "7.5pt",
                color: textMuted, margin: "0 0 1.5mm",
              }}>
                {subtitle}
              </p>
            )}
            <p style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: "6px", letterSpacing: "0.28em",
              textTransform: "uppercase", color: textMuted, margin: 0,
            }}>
              ORIZ · {url.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
