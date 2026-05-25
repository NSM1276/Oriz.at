"use client";

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

// Print-ready A6 QR card. Designed for:
// 1. On-screen preview with two buttons (Print, Close)
// 2. Browser "Print → Save as PDF" yielding a clean A6 card with
//    no headers/footers/UI chrome (controlled via @page + .no-print)
//
// Layout matches ORIZ Quiet Luxury: parchment bg, thin gold hairline,
// Cormorant Garamond display, single accent line at the bottom.

export function QrCard({ name, url, accent, kind, subtitle, logoSvg, logoUrl }: Props) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=2&color=0A0A0A&bgcolor=ffffff&data=${encodeURIComponent(
    url,
  )}`;

  const title = kind === "carta" ? "Speisekarte" : "Willkommen";
  const cta = "Bitte scannen · Please scan";

  return (
    <>
      {/* Print-specific stylesheet — turns the browser into an A6 printer */}
      <style>{`
        @page { size: A6 portrait; margin: 0; }
        @media print {
          html, body { background: #F5F0EC !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .qr-card { box-shadow: none !important; margin: 0 !important; width: 100% !important; height: 100% !important; }
        }
        html, body { background: #E5E0DA; margin: 0; padding: 0; }
      `}</style>

      {/* Top toolbar — hidden when printing */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "14px 20px",
          background: "rgba(10,10,10,0.85)",
          color: "#F5F0EC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--font-inter, sans-serif)",
          zIndex: 100,
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C69B3C" }}>
          ORIZ · Druckvorschau
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => window.print()}
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "8px 18px",
              background: "#C69B3C",
              color: "#0A0A0A",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Drucken / als PDF speichern
          </button>
          <button
            onClick={() => window.close()}
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "8px 14px",
              background: "transparent",
              color: "#F5F0EC",
              border: "1px solid rgba(245,240,236,0.3)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Schließen
          </button>
        </div>
      </div>

      {/* The card itself — A6 dimensions (10.5 × 14.8 cm) */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px 40px",
        }}
      >
        <div
          className="qr-card"
          style={{
            width: "105mm",
            height: "148mm",
            background: "#F5F0EC",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12mm 10mm",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            boxSizing: "border-box",
          }}
        >
          {/* Top: logo (if any) + eyebrow */}
          <div style={{ textAlign: "center", width: "100%" }}>
            {(logoSvg || logoUrl) && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "8mm" }}>
                <VenueLogo
                  svg={logoSvg}
                  url={logoUrl}
                  name={name}
                  bg="#F5F0EC"
                  accent={accent}
                  color="auto"
                  height={48}
                />
              </div>
            )}
            <p
              style={{
                fontFamily: "var(--font-inter, sans-serif)",
                fontSize: "9px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: accent,
                margin: 0,
              }}
            >
              {title}
            </p>
            <div
              style={{
                width: "30px",
                height: "1px",
                background: accent,
                opacity: 0.6,
                margin: "8px auto 0",
              }}
            />
          </div>

          {/* Middle: QR */}
          <div
            style={{
              background: "white",
              padding: "5mm",
              border: `1px solid ${accent}33`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`QR Code · ${name}`}
              style={{ display: "block", width: "55mm", height: "55mm" }}
            />
          </div>

          {/* Below QR: call to action */}
          <p
            style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: "9px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(10,10,10,0.45)",
              margin: 0,
              textAlign: "center",
            }}
          >
            {cta}
          </p>

          {/* Bottom: name + ORIZ mark */}
          <div style={{ width: "100%", textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "var(--font-garamond, serif)",
                fontWeight: 300,
                fontSize: "20pt",
                color: "#0A0A0A",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {name}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontFamily: "var(--font-garamond, serif)",
                  fontStyle: "italic",
                  fontSize: "11pt",
                  color: "rgba(10,10,10,0.50)",
                  margin: "4px 0 0",
                }}
              >
                {subtitle}
              </p>
            )}
            <div
              style={{
                width: "30px",
                height: "1px",
                background: accent,
                opacity: 0.6,
                margin: "10mm auto 4mm",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-inter, sans-serif)",
                fontSize: "8px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(10,10,10,0.30)",
                margin: 0,
              }}
            >
              ORIZ · {url.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
