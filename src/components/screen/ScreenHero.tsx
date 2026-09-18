"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Item, Venue } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { ScreenPalette } from "./screen-colors";
import { PricePill } from "./PricePill";

type Props = {
  venue: Venue;
  sectionName: string;
  /** Dish to feature. null → ambient fallback (venue cover/gallery or typographic). */
  item: Item | null;
  palette: ScreenPalette;
};

const PARCHMENT = "#F5F0EC";

/** Left 40% of the board: one dish full-bleed with a slow Ken Burns zoom. */
export function ScreenHero({ venue, sectionName, item, palette }: Props) {
  const ambient = venue.cover_url ?? venue.gallery?.[0] ?? null;
  const photo = item?.image_url ?? ambient;
  const description = item ? item.ai_caption ?? item.description : null;

  return (
    <section style={{ position: "relative", overflow: "hidden", background: palette.panel }}>
      <AnimatePresence initial={false}>
        {photo && (
          <motion.div
            key={photo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0 }}
          >
            <img
              src={photo}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                animation: "screen-kenburns 14s ease-in-out infinite alternate",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.86) 100%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {item ? (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: "2.4vh" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-1.5vh" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", left: "3vw", right: "3vw", bottom: "4vh", color: PARCHMENT }}
          >
            <div
              className="font-sans"
              style={{ fontSize: "1.7vh", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600, color: palette.accent }}
            >
              Empfehlung des Hauses
            </div>
            <h1
              className="font-display"
              style={{ fontWeight: 500, fontSize: "7vh", lineHeight: 1, margin: "1.4vh 0 1.6vh" }}
            >
              {item.name}
            </h1>
            {description && (
              <p
                className="font-sans"
                style={{
                  fontSize: "2.2vh",
                  lineHeight: 1.45,
                  color: "rgba(245,240,236,0.72)",
                  margin: "0 0 2.6vh",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description}
              </p>
            )}
            <PricePill palette={palette} size="3.6vh">
              {formatPrice(item.price_cents, venue.currency)}
            </PricePill>
          </motion.div>
        ) : (
          <motion.div
            key="ambient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "0 3vw 5vh",
              color: photo ? PARCHMENT : palette.text,
            }}
          >
            {/* Logo only over an ambient photo — without one the footer logo is enough */}
            {photo && (
              <div className="screen-logo" style={{ marginBottom: "3vh" }}>
                <VenueLogo
                  svg={venue.logo_svg}
                  url={venue.logo_url}
                  name={venue.name}
                  color={PARCHMENT}
                  bg={palette.bg}
                  accent={palette.accent}
                  isDarkBg
                  height={72}
                />
              </div>
            )}
            <div
              className="font-sans"
              style={{ fontSize: "1.7vh", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600, color: palette.accent }}
            >
              Unsere Karte
            </div>
            <div className="font-display" style={{ fontWeight: 400, fontSize: "8vh", lineHeight: 1, marginTop: "1.4vh" }}>
              {sectionName}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
