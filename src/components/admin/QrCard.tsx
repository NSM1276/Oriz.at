"use client";

import { useState } from "react";
import { COLOR_PRESETS, findPreset, type ColorPreset } from "@/lib/colorPresets";

type Props = {
  name: string;
  url: string;
  accent: string;
  colorBg?: string;
  kind: "carta" | "casa";
  subtitle?: string;
  logoSvg?: string | null;
  logoUrl?: string | null;
};

// Size presets — columns × rows, physical sticker size
const SIZE_PRESETS = [
  { id: "klein",  label: "Klein",  w: 40, h: 50, cols: 5, rows: 5 },  // 25 per A4
  { id: "mittel", label: "Mittel", w: 60, h: 75, cols: 3, rows: 3 },  // 9 per A4
  { id: "gross",  label: "Groß",   w: 80, h: 100, cols: 2, rows: 2 }, // 4 per A4
  { id: "a4",     label: "A4",     w: 190, h: 270, cols: 1, rows: 1 },// 1 per A4
] as const;
type SizePreset = typeof SIZE_PRESETS[number];

function isDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function QrCard({ name, url, kind, subtitle, colorBg }: Props) {
  const defaultPreset = findPreset(colorBg) ?? COLOR_PRESETS[0];
  const [preset, setPreset]   = useState<ColorPreset>(defaultPreset);
  const [size, setSize]       = useState<SizePreset>(SIZE_PRESETS[0]);

  const dark      = isDark(preset.color_bg);
  const cardBg    = preset.color_bg;
  const accent    = preset.color_primary;
  const textMain  = dark ? "rgba(245,240,236,0.90)" : "rgba(10,10,10,0.88)";
  const textMuted = dark ? "rgba(245,240,236,0.38)" : "rgba(10,10,10,0.32)";
  const qrFg      = dark ? "F5F0EC" : "0A0A0A";
  const qrBg      = preset.color_bg.replace("#", "");
  const qrBoxBg   = cardBg;
  const qrBorder  = dark
    ? "1px solid rgba(245,240,236,0.10)"
    : "1px solid rgba(10,10,10,0.08)";
  const screenBg  = dark ? "#111111" : "#E5E0DA";

  // Screen scale: aim for ~160mm wide preview
  const SCALE = size.id === "a4" ? 1.2 : Math.min(3.5, 160 / size.w);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&margin=0&color=${qrFg}&bgcolor=${qrBg}&data=${encodeURIComponent(url)}`;
  const cardDownload = `/api/qr-card-image?slug=${encodeURIComponent(url.replace(/^https?:\/\/oriz\.at\//, ""))}&name=${encodeURIComponent(name)}&dark=${dark ? "1" : "0"}&accent=${encodeURIComponent(accent)}&kind=${kind}`;

  const count = size.cols * size.rows;
  const stickerProps = { cardBg, textMain, textMuted, qrBoxBg, qrBorder, accent, name, subtitle, url, qrSrc, w: size.w, h: size.h };

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 5mm; }
        @media print {
          html, body   { background: white !important; margin: 0; padding: 0; }
          .no-print    { display: none !important; }
          .print-sheet { display: grid !important; }
          .qr-card     {
            transform: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        html, body { background: ${screenBg}; margin: 0; padding: 0; transition: background 0.25s; }
        .print-sheet { display: none; }

        /* ── Row 1 ── */
        .tb-row1 { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        /* ── Row 2 ── */
        .tb-row2 { display: flex; align-items: center; justify-content: space-between; gap: 8px;
                   border-top: 1px solid rgba(245,240,236,0.08); padding-top: 8px; margin-top: 2px; }
        .tb-sizes { display: flex; gap: 0; }
        .tb-size-btn { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
                       padding: 5px 12px; cursor: pointer; font-family: inherit;
                       border: 1px solid rgba(245,240,236,0.18); border-right: none;
                       background: transparent; color: rgba(245,240,236,0.5);
                       min-height: 32px; white-space: nowrap; transition: all 0.15s; }
        .tb-size-btn:last-child { border-right: 1px solid rgba(245,240,236,0.18); }
        .tb-size-btn.active { background: rgba(198,155,60,0.15); color: #C69B3C;
                              border-color: rgba(198,155,60,0.4); }
        .tb-print { display: inline-flex; align-items: center; }
        .tb-save  { display: none; }
        @media (max-width: 600px) {
          .tb-row1 { flex-wrap: wrap; }
          .tb-print { display: none; }
          .tb-save  { display: inline-flex !important; }
          .tb-close { display: none; }
          .tb-size-btn { padding: 5px 8px; font-size: 9px; }
        }
      `}</style>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          padding: "10px 20px",
          background: "rgba(10,10,10,0.93)",
          backdropFilter: "blur(8px)",
          fontFamily: "var(--font-inter, sans-serif)", zIndex: 100,
        }}
      >
        {/* Row 1: brand + colors + print + close */}
        <div className="tb-row1">
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C69B3C", whiteSpace: "nowrap" }}>
              ORIZ · Druckvorschau
            </span>
            <span style={{ fontSize: 10, color: "rgba(245,240,236,0.32)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
              {size.w === 190 ? "A4" : `${size.w} × ${size.h} mm`} · {count}×
            </span>
          </div>

          {/* Right side: colors + print + close */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Color swatches */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  title={p.label}
                  onClick={() => setPreset(p)}
                  style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: p.color_bg,
                    border: preset.id === p.id
                      ? `2px solid ${p.color_primary}`
                      : "2px solid rgba(245,240,236,0.18)",
                    cursor: "pointer", flexShrink: 0,
                    outline: preset.id === p.id ? `1px solid ${p.color_primary}` : "none",
                    outlineOffset: 1, transition: "border-color 0.15s",
                  }}
                />
              ))}
            </div>

            {/* Print button */}
            <button
              onClick={() => window.print()}
              className="tb-print"
              style={{
                fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
                padding: "8px 16px", background: "#C69B3C", color: "#0A0A0A",
                border: "none", cursor: "pointer", fontFamily: "inherit",
                minHeight: 40, whiteSpace: "nowrap",
              }}
            >
              {count}× auf A4 drucken ↓
            </button>

            {/* Mobile: PNG save */}
            <a
              href={cardDownload}
              download={`qr-${preset.id}.png`}
              className="tb-save"
              style={{
                fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
                padding: "8px 16px", background: "#C69B3C", color: "#0A0A0A",
                minHeight: 40, whiteSpace: "nowrap", textDecoration: "none",
                alignItems: "center",
              }}
            >
              QR speichern ↓
            </a>

            <button
              onClick={() => window.close()}
              className="tb-close"
              style={{
                fontSize: 11, padding: "8px 12px", background: "transparent",
                color: "rgba(245,240,236,0.5)", border: "1px solid rgba(245,240,236,0.25)",
                cursor: "pointer", fontFamily: "inherit", minHeight: 40,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Row 2: size selector */}
        <div className="tb-row2">
          <div className="tb-sizes">
            {SIZE_PRESETS.map((s) => (
              <button
                key={s.id}
                className={`tb-size-btn${size.id === s.id ? " active" : ""}`}
                onClick={() => setSize(s)}
              >
                {s.label}
                <span style={{ opacity: 0.5, marginLeft: 5 }}>
                  {s.id === "a4" ? "1×" : `${s.cols * s.rows}×`}
                </span>
              </button>
            ))}
          </div>
          <span style={{ fontSize: 10, color: "rgba(245,240,236,0.28)", letterSpacing: "0.05em" }}>
            {preset.label}
          </span>
        </div>
      </div>

      {/* ── Screen preview ─────────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "110px 20px 40px",
        }}
      >
        <div
          style={{
            width:  `calc(${size.w}mm * ${SCALE})`,
            height: `calc(${size.h}mm * ${SCALE})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <QrSticker {...stickerProps} scale={SCALE} />
        </div>
      </div>

      {/* ── Print sheet ─────────────────────────────────────────────── */}
      <div
        className="print-sheet"
        style={{
          gridTemplateColumns: `repeat(${size.cols}, ${size.w}mm)`,
          gridTemplateRows:    `repeat(${size.rows}, ${size.h}mm)`,
          gap: 0,
          width: `${size.cols * size.w}mm`,
          margin: "0 auto",
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              width: `${size.w}mm`, height: `${size.h}mm`,
              boxSizing: "border-box",
              outline: "0.3mm dashed rgba(0,0,0,0.15)",
            }}
          >
            <QrSticker {...stickerProps} scale={1} />
          </div>
        ))}
      </div>
    </>
  );
}

// ── Inner sticker ──────────────────────────────────────────────────
function QrSticker({
  cardBg, textMain, textMuted, qrBoxBg, qrBorder,
  accent, name, subtitle, url, qrSrc, w, h, scale,
}: {
  cardBg: string; textMain: string; textMuted: string;
  qrBoxBg: string; qrBorder: string; accent: string;
  name: string; subtitle?: string; url: string; qrSrc: string;
  w: number; h: number; scale: number;
}) {
  // QR takes ~68% of card width, leaving room for padding
  const qrMm  = Math.round(w * 0.62);
  const padMm = Math.max(2.5, w * 0.07);
  const fScale = w / 40; // relative to base 40mm

  return (
    <div
      className="qr-card"
      style={{
        width: `${w}mm`, height: `${h}mm`,
        background: cardBg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: `${padMm}mm ${padMm}mm`,
        boxSizing: "border-box",
        boxShadow: scale > 1 ? "0 16px 60px rgba(0,0,0,0.30)" : "none",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: scale !== 1 ? "center center" : undefined,
        transition: "background 0.25s",
      }}
    >
      {/* Top */}
      <div style={{ textAlign: "center", width: "100%" }}>
        <p style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: `${6.5 * fScale}px`, letterSpacing: "0.32em",
          textTransform: "uppercase", color: accent, margin: `0 0 ${1.5 * fScale}mm`,
        }}>
          Scan mich
        </p>
        <div style={{ width: `${14 * fScale}mm`, height: "0.35mm", background: accent, opacity: 0.5, margin: "0 auto" }} />
      </div>

      {/* QR */}
      <div style={{ background: qrBoxBg, border: qrBorder, padding: `${1.5 * fScale}mm`, lineHeight: 0, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt={`QR · ${name}`} style={{ display: "block", width: `${qrMm}mm`, height: `${qrMm}mm` }} />
      </div>

      {/* Bottom */}
      <div style={{ textAlign: "center", width: "100%" }}>
        <div style={{ width: `${14 * fScale}mm`, height: "0.35mm", background: accent, opacity: 0.5, margin: `0 auto ${1.5 * fScale}mm` }} />
        <h1 style={{
          fontFamily: "var(--font-garamond, serif)", fontWeight: 300,
          fontSize: `${10 * fScale}pt`, color: textMain,
          margin: `0 0 ${1 * fScale}mm`, lineHeight: 1.1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: `${w - padMm * 2 - 2}mm`,
        }}>
          {name}
        </h1>
        {subtitle && (
          <p style={{
            fontFamily: "var(--font-garamond, serif)", fontStyle: "italic",
            fontSize: `${6.5 * fScale}pt`, color: textMuted,
            margin: `0 0 ${1 * fScale}mm`,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: `${w - padMm * 2 - 2}mm`,
          }}>
            {subtitle}
          </p>
        )}
        <p style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: `${5.5 * fScale}px`, letterSpacing: "0.28em",
          textTransform: "uppercase", color: textMuted, margin: 0,
        }}>
          · ORIZ ·
        </p>
      </div>
    </div>
  );
}
