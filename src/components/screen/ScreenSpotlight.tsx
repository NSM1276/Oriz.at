"use client";

import { motion } from "framer-motion";
import type { Venue } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import type { SpotlightPage } from "./paginate";
import type { ScreenPalette } from "./screen-colors";
import { PricePill } from "./PricePill";

type Props = {
  venue: Venue;
  page: SpotlightPage;
  palette: ScreenPalette;
};

const PARCHMENT = "#F5F0EC";

/** Full-screen single dish between sections — the "promo screen" moment. */
export function ScreenSpotlight({ venue, page, palette }: Props) {
  const { item } = page;
  const description = item.ai_caption ?? item.description;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>
      <img
        src={item.image_url ?? ""}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          animation: "screen-kenburns 16s ease-in-out infinite alternate",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.05) 100%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, x: "-2vw" }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute",
          left: "6vw",
          bottom: "14vh",
          maxWidth: "48vw",
          color: PARCHMENT,
        }}
      >
        <div
          className="font-sans"
          style={{ fontSize: "1.9vh", letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, color: palette.accent }}
        >
          {page.sectionName}
        </div>
        <h1
          className="font-display"
          style={{ fontWeight: 500, fontSize: "10vh", lineHeight: 0.98, margin: "1.6vh 0 2vh" }}
        >
          {item.name}
        </h1>
        {description && (
          <p
            className="font-sans"
            style={{
              fontSize: "2.5vh",
              lineHeight: 1.45,
              color: "rgba(245,240,236,0.75)",
              margin: "0 0 3.2vh",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </p>
        )}
        <PricePill palette={palette} size="4.6vh">
          {formatPrice(item.price_cents, venue.currency)}
        </PricePill>
      </motion.div>
    </div>
  );
}
