"use client";

import { motion } from "framer-motion";
import type { Item } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import type { ScreenPalette } from "./screen-colors";
import { PricePill } from "./PricePill";

type Props = {
  item: Item;
  currency: string;
  palette: ScreenPalette;
  /** stagger index for the fly-in */
  index: number;
};

const PARCHMENT = "#F5F0EC";

/** A dish in the tile grid. With a photo it is a full-bleed tile; without one it
 *  is a deliberate text entry — never a grey box where an image should have been
 *  (MotionD §9: a missing photo changes the layout, it does not leave a hole). */
export function ScreenTile({ item, currency, palette, index }: Props) {
  const description = item.ai_caption ?? item.description;
  const hasPhoto = !!item.image_url;
  const textColor = hasPhoto ? PARCHMENT : palette.text;
  const dimColor = hasPhoto ? "rgba(245,240,236,0.72)" : palette.dim;

  return (
    <motion.div
      initial={{ opacity: 0, y: "2.4vh" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.08 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        borderRadius: hasPhoto ? "1.6vh" : 0,
        overflow: "hidden",
        // No photo → no photo-shaped panel. A hairline and open space read as a
        // list entry; a filled rectangle reads as a broken image.
        background: hasPhoto ? palette.panel : "transparent",
        borderTop: hasPhoto ? undefined : `1px solid ${palette.accent}`,
        minWidth: 0,
      }}
    >
      {hasPhoto && (
        <>
          <img
            src={item.image_url!}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.80) 100%)",
            }}
          />
        </>
      )}

      <div
        style={{
          position: "absolute",
          left: hasPhoto ? "1.6vw" : "0.4vw",
          right: hasPhoto ? "1.6vw" : "0.4vw",
          ...(hasPhoto ? { bottom: "2vh" } : { top: "50%", transform: "translateY(-50%)" }),
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1vw",
          color: textColor,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className="font-display"
            style={{
              fontWeight: 500,
              fontSize: hasPhoto ? "3.4vh" : "3.8vh",
              lineHeight: 1.05,
              marginBottom: "0.6vh",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.name}
          </div>
          {description && (
            <div
              className="font-sans"
              style={{
                fontSize: "1.75vh",
                color: dimColor,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {description}
            </div>
          )}
        </div>
        <PricePill palette={palette} size="2.5vh">
          {formatPrice(item.price_cents, currency)}
        </PricePill>
      </div>
    </motion.div>
  );
}
