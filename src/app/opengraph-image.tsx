import { ImageResponse } from "next/og";

export const alt = "ORIZ — Quiet menus for fine restaurants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#0A0A0A",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "serif",
      }}
    >
      <div
        style={{
          color: "#C69B3C",
          fontSize: 13,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom: 40,
          opacity: 0.9,
        }}
      >
        Digital Excellence
      </div>
      <div
        style={{
          color: "#F5F0EC",
          fontSize: 140,
          letterSpacing: "0.12em",
          fontWeight: 300,
        }}
      >
        ORIZ
      </div>
      <div
        style={{
          width: 80,
          height: 1,
          background: "#C69B3C",
          margin: "36px 0",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          color: "#F5F0EC",
          fontSize: 22,
          fontStyle: "italic",
          opacity: 0.55,
          maxWidth: 560,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Quiet menus for fine restaurants
      </div>
    </div>,
    size,
  );
}
