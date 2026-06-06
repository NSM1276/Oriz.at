import { ImageResponse } from "next/og";

export const runtime = "edge";

// Card: 800 × 940 px  (ratio 1 : 1.175 — nearly square, +17% height)
const W = 800;
const H = 940;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug   = searchParams.get("slug")   ?? "oriz";
  const name   = searchParams.get("name")   ?? "Restaurant";
  const dark   = searchParams.get("dark")   === "1";
  const accent = searchParams.get("accent") ?? "#C69B3C";

  // ── Palette ──────────────────────────────────────────────────────────
  const cardBg    = dark ? "#0A0A0A" : "#F5F0EC";
  const textMain  = dark ? "rgba(245,240,236,0.90)" : "rgba(10,10,10,0.88)";
  const textMuted = dark ? "rgba(245,240,236,0.35)" : "rgba(10,10,10,0.32)";
  const accentDim = dark ? "rgba(198,155,60,0.55)"  : "rgba(198,155,60,0.50)";

  // QR: foreground matches text, background matches card — NO white box
  const qrFg  = dark ? "F5F0EC" : "0A0A0A";
  const qrBg  = dark ? "0A0A0A" : "F5F0EC";

  const menuUrl = `https://oriz.at/${slug}`;

  // 800 px QR at margin=2 (minimal quiet zone, scanner-safe)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=2&color=${qrFg}&bgcolor=${qrBg}&data=${encodeURIComponent(menuUrl)}`;

  // QR renders at 580 px inside an 800-wide card
  const QR = 580;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          backgroundColor: cardBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "52px 60px 48px",
          boxSizing: "border-box",
        }}
      >
        {/* ── Top: SCAN MICH ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          <span
            style={{
              color: accentDim,
              fontSize: 22,
              letterSpacing: "0.42em",
              fontFamily: "sans-serif",
              fontWeight: 300,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            SCAN MICH
          </span>
          {/* thin accent line */}
          <div style={{ width: 48, height: 1, backgroundColor: accent, opacity: 0.4 }} />
        </div>

        {/* ── QR code — no box, blends into card bg ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          width={QR}
          height={QR}
          alt=""
          style={{ display: "block" }}
        />

        {/* ── Bottom: name + ORIZ brand ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {/* thin accent line */}
          <div style={{ width: 48, height: 1, backgroundColor: accent, opacity: 0.4, marginBottom: 14 }} />
          <span
            style={{
              color: textMain,
              fontSize: 38,
              fontWeight: 300,
              fontFamily: "serif",
              textAlign: "center",
              letterSpacing: "0.02em",
              maxWidth: 680,
              lineHeight: 1.15,
            }}
          >
            {name}
          </span>
          <span
            style={{
              color: textMuted,
              fontSize: 16,
              letterSpacing: "0.28em",
              fontFamily: "sans-serif",
              fontWeight: 300,
              marginTop: 10,
              textTransform: "uppercase",
            }}
          >
            · ORIZ ·
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "Content-Disposition": `attachment; filename="qr-${slug}-${dark ? "dunkel" : "hell"}.png"`,
      },
    },
  );
}
