import type { Item } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import type { ScreenPalette } from "./screen-colors";

type Props = {
  item: Item;
  currency: string;
  palette: ScreenPalette;
};

/** One dish row on the TV board. All sizes in vh so 1080p and 4K look identical. */
export function ScreenItemCard({ item, currency, palette }: Props) {
  const description = item.ai_caption ?? item.description;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1.6vh",
        height: "100%",
        padding: "0 0.6vw",
        borderBottom: `1px solid ${palette.border}`,
        minWidth: 0,
      }}
    >
      {item.image_url && (
        <img
          src={item.image_url}
          alt=""
          style={{
            width: "11vh",
            height: "11vh",
            flex: "0 0 11vh",
            objectFit: "cover",
            borderRadius: "0.8vh",
          }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1.2vw" }}>
          <span
            className="font-display"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: "3.2vh",
              lineHeight: 1.15,
              fontWeight: 500,
              color: palette.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.name}
          </span>
          <span
            className="font-sans"
            style={{
              flex: "0 0 auto",
              fontSize: "3vh",
              lineHeight: 1,
              fontWeight: 600,
              color: palette.accent,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatPrice(item.price_cents, currency)}
          </span>
        </div>

        {description && (
          <div
            className="font-sans"
            style={{
              marginTop: "0.7vh",
              fontSize: "2.1vh",
              lineHeight: 1.3,
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
    </div>
  );
}
