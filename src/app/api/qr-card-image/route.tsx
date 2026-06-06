import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug    = searchParams.get("slug")   ?? "oriz";
  const name    = searchParams.get("name")   ?? "Restaurant";
  const dark    = searchParams.get("dark")   === "1";
  const accent  = searchParams.get("accent") ?? "#C69B3C";
  const kind    = searchParams.get("kind")   ?? "carta";

  const cardBg   = dark ? "#0A0A0A" : "#F5F0EC";
  const textMain = dark ? "#F5F0EC" : "#0A0A0A";
  const textMuted= dark ? "rgba(245,240,236,0.45)" : "rgba(10,10,10,0.40)";
  const qrBg     = dark ? "0A0A0A"  : "ffffff";
  const qrColor  = dark ? "F5F0EC"  : "0A0A0A";
  const qrBoxBg  = dark ? "#141414" : "#ffffff";
  const title    = kind === "casa" ? "WILLKOMMEN" : "SPEISEKARTE";

  const menuUrl  = `https://oriz.at/${slug}`;
  const qrUrl    = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&color=${qrColor}&bgcolor=${qrBg}&data=${encodeURIComponent(menuUrl)}`;

  // Card proportions: 40 × 50 mm → render at 800 × 1000 px (20 px/mm)
  const W = 800;
  const H = 1000;

  return new ImageResponse(
    (
      <div
        style={{
          width: W, height: H,
          backgroundColor: cardBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "60px 60px",
          boxSizing: "border-box",
        }}
      >
        {/* ── Top label ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <span style={{
            color: accent,
            fontSize: 26,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            fontWeight: 400,
          }}>
            {title}
          </span>
          <div style={{
            width: 200,
            height: 2,
            backgroundColor: accent,
            opacity: 0.5,
            marginTop: 16,
          }} />
        </div>

        {/* ── QR code ── */}
        <div style={{
          display: "flex",
          padding: 24,
          backgroundColor: qrBoxBg,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} width={480} height={480} alt="" />
        </div>

        {/* ── Bottom label ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div style={{
            width: 200,
            height: 2,
            backgroundColor: accent,
            opacity: 0.5,
            marginBottom: 16,
          }} />
          <span style={{
            color: textMain,
            fontSize: 44,
            fontWeight: 300,
            fontFamily: "serif",
            textAlign: "center",
            maxWidth: 680,
          }}>
            {name}
          </span>
          <span style={{
            color: textMuted,
            fontSize: 20,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            marginTop: 12,
          }}>
            ORIZ · {menuUrl.replace("https://", "")}
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "Content-Disposition": `attachment; filename="qr-sticker-${slug}-${dark ? "dunkel" : "hell"}.png"`,
      },
    },
  );
}
