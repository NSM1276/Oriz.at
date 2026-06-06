"use client";

import { useState } from "react";
import { COLOR_PRESETS, type ColorPreset } from "@/lib/colorPresets";

type Props = {
  name: string;
  url: string;
  accent: string;
  kind: "carta" | "casa";
  subtitle?: string;
  logoSvg?: string | null;
  logoUrl?: string | null;
};

// Print-ready 40×50 mm QR sticker.
// Toolbar: choose any of 10 ORIZ color presets.
// Print: A4 sheet with 25 stickers (5×5), dashed cut lines.
// print-color-adjust: exact — backgrounds print correctly in all modes.

function isDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function QrCard({ name, url, kind, subtitle }: Props) {
  // Default: Pergament (first light preset)
  const [preset, setPreset] = useState<ColorPreset>(COLOR_PRESETS[0]);

  const dark = isDark(preset.color_bg);
  const cardBg    = preset.color_bg;
  const accent    = preset.color_primary;
  const textMain  = dark ? "rgba(245,240,236,0.90)" : "rgba(10,10,10,0.88)";
  const textMuted = dark ? "rgba(245,240,236,0.38)" : "rgba(10,10,10,0.32)";
  const qrFg      = dark ? "F5F0EC" : "0A0A0A";
  const qrBg      = dark
    ? preset.color_bg.replace("#", "")
    : preset.color_bg.replace("#", "");
  const qrBoxBg   = cardBg;
  const qrBorder  = dark
    ? "1px solid rgba(245,240,236,0.10)"
    : "1px solid rgba(10,10,10,0.08)";
  const screenBg  = dark ? "#111111" : "#E5E0DA";

  const SCALE = 3.5;

  // 900×900 px source → rendered at 28mm
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&margin=0&color=${qrFg}&bgcolor=${qrBg}&data=${encodeURIComponent(url)}`;

  // Styled card PNG download
  const cardDownload = `/api/qr-card-image?slug=${encodeURIComponent(url.replace(/^https?:\/\/oriz\.at\//, ""))}&name=${encodeURIComponent(name)}&dark=${dark ? "1" : "0"}&accent=${encodeURIComponent(accent)}&kind=${kind}`;

  const stickerProps = { cardBg, textMain, textMuted, qrBoxBg, qrBorder, accent, name, subtitle, url, qrSrc };

  return (
    <>
      <style>{`
        /* ── Print: A4, grid of 25 stickers (5×5) ── */
        @page { size: A4 portrait; margin: 5mm; }
        @media print {
          html, body      { background: white !important; margin: 0; padding: 0; }
          .no-print       { display: none !important; }
          .print-sheet    { display: grid !important; }
          .qr-card        {
            transform: none !important;
            box-shadow: none !important;
            width: 40mm !important;
            height: 50mm !important;
            /* CRITICAL: force background colors to print */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        /* ── Screen: scaled preview ── */
        html, body { background: ${screenBg}; margin: 0; padding: 0; transition: background 0.25s; }
        .qr-card   { transform: scale(${SCALE}); transform-origin: center center; }
        .print-sheet { display: none; }

        /* ── Toolbar ── */
        .qr-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .qr-toolbar-meta { display: flex; align-items: center; gap: 12px; }
        .qr-toolbar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .qr-btn-print { display: inline-flex; }
        .qr-btn-save  { display: none; }
        @media (max-width: 540px) {
          .qr-toolbar { padding: 10px 14px !important; }
          .qr-btn-print { display: none; }
          .qr-btn-save  { display: inline-flex; }
          .qr-btn-close { display: none; }
        }
      `}</style>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div
        className="no-print qr-toolbar"
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          padding: "12px 20px",
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(8px)",
          fontFamily: "var(--font-inter, sans-serif)", zIndex: 100,
        }}
      >
        <div className="qr-toolbar-meta">
          <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C69B3C", whiteSpace: "nowrap" }}>
            ORIZ · Druckvorschau
          </span>
          <span style={{ fontSize: 10, color: "rgba(245,240,236,0.35)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
            Aufkleber 40 × 50 mm
          </span>
        </div>

        <div className="qr-toolbar-actions">
          {/* Color preset swatches */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.id}
                title={p.label}
                onClick={() => setPreset(p)}
                style={{
                  width: 22, height: 22,
                  borderRadius: "50%",
                  background: p.color_bg,
                  border: preset.id === p.id
                    ? `2px solid ${p.color_primary}`
                    : "2px solid rgba(245,240,236,0.2)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "border-color 0.15s",
                  outline: preset.id === p.id ? `1px solid ${p.color_primary}` : "none",
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="qr-btn-print"
            style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              padding: "8px 18px", background: "#C69B3C", color: "#0A0A0A",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              minHeight: 44, whiteSpace: "nowrap",
            }}
          >
            25× auf A4 drucken ↓
          </button>

          {/* Mobile: PNG download */}
          <a
            href={cardDownload}
            download={`qr-sticker-${preset.id}.png`}
            className="qr-btn-save"
            style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              padding: "8px 18px", background: "#C69B3C", color: "#0A0A0A",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              minHeight: 44, whiteSpace: "nowrap", textDecoration: "none",
              display: "none", alignItems: "center",
            }}
          >
            QR speichern ↓
          </a>

          <button
            onClick={() => window.close()}
            className="qr-btn-close"
            style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              padding: "8px 14px", background: "transparent", color: "#F5F0EC",
              border: "1px solid rgba(245,240,236,0.3)", cursor: "pointer", fontFamily: "inherit",
              minHeight: 44,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Screen preview ─────────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px 20px 40px",
          gap: 16,
        }}
      >
        {/* Space-reservation shell — SCALE × physical size */}
        <div
          style={{
            width:  `calc(40mm * ${SCALE})`,
            height: `calc(50mm * ${SCALE})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <QrSticker {...stickerProps} />
        </div>

        {/* Preset label */}
        <div style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(245,240,236,0.45)",
        }}>
          {preset.label}
        </div>
      </div>

      {/* ── Print sheet: A4, 5 cols × 5 rows = 25 stickers ────────── */}
      <div
        className="print-sheet"
        style={{
          gridTemplateColumns: "repeat(5, 40mm)",
          gridTemplateRows:    "repeat(5, 50mm)",
          gap: 0,
          width: "200mm",
          margin: "0 auto",
        }}
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: "40mm", height: "50mm",
              boxSizing: "border-box",
              outline: "0.3mm dashed rgba(0,0,0,0.18)",
            }}
          >
            <QrSticker {...stickerProps} />
          </div>
        ))}
      </div>
    </>
  );
}

// ── Inner sticker card ─────────────────────────────────────────────
function QrSticker({
  cardBg, textMain, textMuted, qrBoxBg, qrBorder,
  accent, name, subtitle, url, qrSrc,
}: {
  cardBg: string; textMain: string; textMuted: string;
  qrBoxBg: string; qrBorder: string;
  accent: string;
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
      {/* Top: CTA + accent rule */}
      <div style={{ textAlign: "center", width: "100%" }}>
        <p style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: "6.5px", letterSpacing: "0.32em",
          textTransform: "uppercase", color: accent,
          margin: "0 0 1.5mm",
        }}>
          Scan mich
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
          fontSize: "5.5px", letterSpacing: "0.28em",
          textTransform: "uppercase", color: textMuted, margin: 0,
        }}>
          · ORIZ ·
        </p>
      </div>
    </div>
  );
}
