"use client";

import { useState } from "react";
import { VenueLogo } from "@/components/brand/VenueLogo";

type Props = {
  name: string;
  url: string;
  accent: string;
  kind: "carta" | "casa";
  subtitle?: string;
  logoSvg?: string | null;
  logoUrl?: string | null;
};

// Print-ready A6 QR card with light/dark toggle.
// Browser "Print → Save as PDF" yields a clean A6 card (no UI chrome).

export function QrCard({ name, url, accent, kind, subtitle, logoSvg, logoUrl }: Props) {
  const [dark, setDark] = useState(false);

  const title = kind === "carta" ? "Speisekarte" : "Willkommen";
  const cta = "Bitte scannen · Please scan";

  // Colors based on mode
  const cardBg   = dark ? "#0A0A0A" : "#F5F0EC";
  const textMain = dark ? "#F5F0EC" : "#0A0A0A";
  const textDim  = dark ? "rgba(245,240,236,0.45)" : "rgba(10,10,10,0.45)";
  const textMuted= dark ? "rgba(245,240,236,0.28)" : "rgba(10,10,10,0.28)";
  const qrBg     = dark ? "0A0A0A" : "ffffff";
  const qrColor  = dark ? "F5F0EC" : "0A0A0A";
  const qrContainerBg = dark ? "#1A1A1A" : "#ffffff";
  const qrBorder = dark ? `1px solid ${accent}44` : `1px solid ${accent}33`;
  const screenBg = dark ? "#111111" : "#E5E0DA";

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=2&color=${qrColor}&bgcolor=${qrBg}&data=${encodeURIComponent(url)}`;

  return (
    <>
      <style>{`
        @page { size: A6 portrait; margin: 0; }
        @media print {
          html, body { background: ${cardBg} !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .qr-card  { box-shadow: none !important; margin: 0 !important; width: 100% !important; height: 100% !important; }
        }
        html, body { background: ${screenBg}; margin: 0; padding: 0; transition: background 0.3s; }
      `}</style>

      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          padding: "12px 20px",
          background: "rgba(10,10,10,0.88)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "var(--font-inter, sans-serif)", zIndex: 100, gap: 12,
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C69B3C", flexShrink: 0 }}>
          ORIZ · Druckvorschau
        </span>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Light / Dark toggle */}
          <div style={{ display: "flex", border: "1px solid rgba(245,240,236,0.2)", overflow: "hidden" }}>
            {[{ label: "Hell", val: false }, { label: "Dunkel", val: true }].map(({ label, val }) => (
              <button
                key={label}
                onClick={() => setDark(val)}
                style={{
                  fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                  padding: "7px 14px", cursor: "pointer", fontFamily: "inherit",
                  background: dark === val ? "#C69B3C" : "transparent",
                  color: dark === val ? "#0A0A0A" : "rgba(245,240,236,0.55)",
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

      {/* Preview area */}
      <div
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", padding: "80px 20px 40px",
        }}
      >
        <div
          className="qr-card"
          style={{
            width: "105mm", height: "148mm",
            background: cardBg,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "space-between",
            padding: "12mm 10mm",
            boxShadow: "0 12px 50px rgba(0,0,0,0.25)",
            boxSizing: "border-box",
            transition: "background 0.3s",
          }}
        >
          {/* Top: logo + eyebrow */}
          <div style={{ textAlign: "center", width: "100%" }}>
            {(logoSvg || logoUrl) && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "8mm" }}>
                <VenueLogo
                  svg={logoSvg} url={logoUrl} name={name}
                  bg={cardBg} accent={accent}
                  color="auto" height={48}
                  isDarkBg={dark}
                />
              </div>
            )}
            <p style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: "9px", letterSpacing: "0.32em",
              textTransform: "uppercase", color: accent, margin: 0,
            }}>
              {title}
            </p>
            <div style={{ width: 30, height: 1, background: accent, opacity: 0.6, margin: "8px auto 0" }} />
          </div>

          {/* Middle: QR */}
          <div style={{ background: qrContainerBg, padding: "5mm", border: qrBorder }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt={`QR Code · ${name}`}
              style={{ display: "block", width: "55mm", height: "55mm" }} />
          </div>

          {/* CTA */}
          <p style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: "9px", letterSpacing: "0.24em",
            textTransform: "uppercase", color: textDim,
            margin: 0, textAlign: "center",
          }}>
            {cta}
          </p>

          {/* Bottom: name + ORIZ mark */}
          <div style={{ width: "100%", textAlign: "center" }}>
            <h1 style={{
              fontFamily: "var(--font-garamond, serif)",
              fontWeight: 300, fontSize: "20pt",
              color: textMain, margin: 0, lineHeight: 1.15,
            }}>
              {name}
            </h1>
            {subtitle && (
              <p style={{
                fontFamily: "var(--font-garamond, serif)",
                fontStyle: "italic", fontSize: "11pt",
                color: textDim, margin: "4px 0 0",
              }}>
                {subtitle}
              </p>
            )}
            <div style={{ width: 30, height: 1, background: accent, opacity: 0.6, margin: "10mm auto 4mm" }} />
            <p style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: "8px", letterSpacing: "0.3em",
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
