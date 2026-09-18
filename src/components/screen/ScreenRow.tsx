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
  index: number;
};

/** Text row for sections without photos (2 columns × 5 rows). */
export function ScreenRow({ item, currency, palette, index }: Props) {
  const description = item.ai_caption ?? item.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: "1.6vh" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.06 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.2vw",
        borderBottom: `1px solid ${palette.border}`,
        minWidth: 0,
        color: palette.text,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          className="font-display"
          style={{
            fontWeight: 500,
            fontSize: "3.4vh",
            lineHeight: 1.1,
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
              marginTop: "0.5vh",
              fontSize: "1.9vh",
              color: palette.dim,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </div>
        )}
      </div>
      <PricePill palette={palette} size="2.4vh">
        {formatPrice(item.price_cents, currency)}
      </PricePill>
    </motion.div>
  );
}
