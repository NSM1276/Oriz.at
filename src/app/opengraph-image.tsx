import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ORIZ — Digitale Speisekarte";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1C1208",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(200,150,62,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.35em",
            color: "rgba(200,150,62,0.65)",
            marginBottom: 32,
            display: "flex",
          }}
        >
          ORIZ
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 300,
            color: "rgba(245,240,236,0.88)",
            textAlign: "center",
            display: "flex",
          }}
        >
          Digitale Speisekarte
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(245,240,236,0.35)",
            marginTop: 20,
            display: "flex",
          }}
        >
          Carta · Casa · Screen — aus Wien
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 13,
            letterSpacing: "0.2em",
            color: "rgba(200,150,62,0.35)",
            display: "flex",
          }}
        >
          oriz.at
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
