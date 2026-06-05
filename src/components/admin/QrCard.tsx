"use client";

import { useState } from "react";

type Props = {
  name: string;
  url: string;
  accent: string;
  kind: "carta" | "casa";
  subtitle?: string;
  // logoSvg / logoUrl reserved for future styled-QR feature (qr-code-styling)
  logoSvg?: string | null;
  logoUrl?: string | null;
};

// Print-ready 40×50 mm QR sticker with Hell/Dunkel toggle.
// Physical output: 40 mm wide × 50 mm tall — glue directly to table/menu stand.
// Screen shows a 3.5× scaled preview so the tiny card is clearly visible.
// "Drucken / als PDF" prints at exact physical size via @page.

export function QrCard({ name, url, accent, kind, subtitle }: Props) {
  const [dark, setDark] = useState(false);

  const title = kind === "carta" ? "Speisekarte" : "Willkommen";

  // ── Color palette ─────────────────────────────────────────────────
  const cardBg    = dark ? "#0A0A0A"                    : "#F5F0EC";
  const textMain  = dark ? "#F5F0EC"                    : "#0A0A0A";
  const textMuted = dark ? "rgba(245,240,236,0.32)"     : "rgba(10,10,10,0.32)";
  const qrBg      = dark ? "0A0A0A"                     : "ffffff";
  const qrColor   = dark ? "F5F0EC"                     : "0A0A0A";
  const qrBoxBg   = dark ? "#141414"                    : "#ffffff";
  const qrBorder  = dark ? "1px solid rgba(245,240,236,0.10)" : "1px solid rgba(10,10,10,0.08)";
  const screenBg  = dark ? "#111111"                    : "#E5E0DA";

  // 900×900 px source → rendered at 28mm (sharp at any printer DPI)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&margin=0&color=${qrColor}&bgcolor=${qrBg}&data=${encodeURIComponent(url)}`;

  // Scale factor for on-screen preview.
  // 40mm × 3.5 ≈ 140mm ≈ 530 px — comfortably visible in the viewport.
  const SCALE = 3.5;

  return (
    <>
      <style>{`
        /* ── Print output: exact physical sticker size ── */
        @page { size: 40mm 50mm; margin: 0; }
        @media print {
          html, body  { background: ${cardBg} !important; margin: 0; padding: 0; }
          .no-print   { display: none !important; }
          .qr-card    { transform: none !important;
                        box-shadow: none !important;
                        width: 40mm !important; height: 50mm !important; }
        }
        /* ── Screen: scaled preview ── */
        html, body { background: ${screenBg}; margin: 0; padding: 0; transition: background 0.25s; }
        .qr-card   { transform: scale(${SCALE}); transform-origin: center center; }
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C69B3C" }}>
            ORIZ · Druckvorschau
          </span>
          <span style={{ fontSize: 10, color: "rgba(245,240,236,0.35)", letterSpacing: "0.05em" }}>
            Aufkleber 40 × 50 mm
          </span>
        </div>

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
      {/*
       * The card is 40mm × 50mm in real CSS mm units.
       * transform: scale(3.5) makes it fill the screen nicely.
       * The wrapper reserves the scaled space so nothing overlaps.
       */}
      <div
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", padding: "80px 20px 40px",
        }}
      >
        {/* Space-reservation shell — SCALE × physical size */}
        <div
          className="no-print"
          style={{
            width:  `calc(40mm * ${SCALE})`,
            height: `calc(50mm * ${SCALE})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <QrSticker
            cardBg={cardBg} textMain={textMain} textMuted={textMuted}
            qrBoxBg={qrBoxBg} qrBorder={qrBorder}
            accent={accent} title={title}
            name={name} subtitle={subtitle} url={url} qrSrc={qrSrc}
          />
        </div>

        {/* Print-only card (no transform wrapper needed) */}
        <div className="print-only" style={{ display: "none" }}>
          <QrSticker
            cardBg={cardBg} textMain={textMain} textMuted={textMuted}
            qrBoxBg={qrBoxBg} qrBorder={qrBorder}
            accent={accent} title={title}
            name={name} subtitle={subtitle} url={url} qrSrc={qrSrc}
          />
        </div>
      </div>

      <style>{`
        @media print { .print-only { display: block !important; } }
      `}</style>
    </>
  );
}

// ── Inner sticker card ─────────────────────────────────────────────
// Extracted so it can be reused for screen (scaled) and print (raw).
function QrSticker({
  cardBg, textMain, textMuted, qrBoxBg, qrBorder,
  accent, title, name, subtitle, url, qrSrc,
}: {
  cardBg: string; textMain: string; textMuted: string;
  qrBoxBg: string; qrBorder: string;
  accent: string; title: string;
  name: string; subtitle?: string; url: string; qrSrc: string;
}) {
  return (
    <div
      className="qr-card"
      style={{
        width: "40mm", height: "50mm",
        background: cardBg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: "3mm 3mm",
        boxSizing: "border-box",
        boxShadow: "0 16px 60px rgba(0,0,0,0.30)",
        transition: "background 0.25s",
      }}
    >
      {/* Top: label + accent rule */}
      <div style={{ textAlign: "center", width: "100%" }}>
        <p style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: "6.5px", letterSpacing: "0.3em",
          textTransform: "uppercase", color: accent,
          margin: "0 0 1.5mm",
        }}>
          {title}
        </p>
        <div style={{ width: "14mm", height: "0.35mm", background: accent, opacity: 0.5, margin: "0 auto" }} />
      </div>

      {/* QR — dominant */}
      <div style={{
        background: qrBoxBg,
        border: qrBorder,
        padding: "1.5mm",
        lineHeight: 0,
        flexShrink: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt={`QR · ${name}`}
          style={{ display: "block", width: "28mm", height: "28mm" }}
        />
      </div>

      {/* Bottom: name + ORIZ */}
      <div style={{ textAlign: "center", width: "100%" }}>
        <div style={{ width: "14mm", height: "0.35mm", background: accent, opacity: 0.5, margin: "0 auto 1.5mm" }} />
        <h1 style={{
          fontFamily: "var(--font-garamond, serif)",
          fontWeight: 300, fontSize: "10pt",
          color: textMain, margin: "0 0 1mm", lineHeight: 1.1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: "34mm",
        }}>
          {name}
        </h1>
        {subtitle && (
          <p style={{
            fontFamily: "var(--font-garamond, serif)",
            fontStyle: "italic", fontSize: "6.5pt",
            color: textMuted, margin: "0 0 1mm",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: "34mm",
          }}>
            {subtitle}
          </p>
        )}
        <p style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: "5.5px", letterSpacing: "0.22em",
          textTransform: "uppercase", color: textMuted, margin: 0,
        }}>
          ORIZ · {url.replace(/^https?:\/\//, "")}
        </p>
      </div>
    </div>
  );
}
