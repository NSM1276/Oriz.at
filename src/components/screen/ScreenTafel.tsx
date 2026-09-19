"use client";

import type { Item, Venue } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { BoardFit, SectionWithItems } from "./board-fit";
import type { ScreenPalette } from "./screen-colors";

// Tafel: the whole menu on one screen, nothing rotates. For counters, where the
// queue must be able to find its line at any moment. Every size comes from the
// computed fit, so the block fills the screen instead of paginating.

type Props = {
  venue: Venue;
  sections: SectionWithItems[];
  fit: BoardFit;
  palette: ScreenPalette;
  clock: string;
};

/** One item per line: thumbnail, name, leader, price. */
function TafelRow({
  item,
  currency,
  fit,
  palette,
  waveIndex,
  waveCount,
}: {
  item: Item;
  currency: string;
  fit: BoardFit;
  palette: ScreenPalette;
  waveIndex: number;
  waveCount: number;
}) {
  const description = fit.showDescriptions ? item.ai_caption ?? item.description : null;
  const nameSize = `${(fit.unitVh * 0.58).toFixed(2)}vh`;
  const priceSize = `${(fit.unitVh * 0.55).toFixed(2)}vh`;
  const descSize = `${(fit.unitVh * 0.38).toFixed(2)}vh`;
  const thumb = `${(fit.unitVh * 0.9).toFixed(2)}vh`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: `${(fit.unitVh * 0.25).toFixed(2)}vh`,
        // Exact height: the fit assumes one unit per row, so make that true
        // instead of hoping. Otherwise the last section overflows the columns.
        height: `${(fit.unitVh * (description ? 1.55 : 1)).toFixed(2)}vh`,
        boxSizing: "border-box",
        overflow: "hidden",
        breakInside: "avoid",
      }}
    >
      {/* A missing photo simply takes no space — never an empty grey slot. */}
      {fit.showThumbs && item.image_url && (
        <img
          src={item.image_url}
          alt=""
          style={{
            width: thumb,
            height: thumb,
            flex: `0 0 ${thumb}`,
            objectFit: "cover",
            borderRadius: "0.6vh",
            alignSelf: "center",
          }}
        />
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6vw" }}>
          <span
            className="font-display"
            style={{
              fontSize: nameSize,
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
            aria-hidden
            style={{
              flex: 1,
              height: "1px",
              alignSelf: "flex-end",
              marginBottom: `${(fit.unitVh * 0.16).toFixed(2)}vh`,
              borderBottom: `1px dotted ${palette.muted}`,
              minWidth: "1vw",
            }}
          />
          <span
            className="font-sans screen-wave"
            style={{
              flex: "0 0 auto",
              fontSize: priceSize,
              lineHeight: 1,
              fontWeight: 700,
              color: palette.accent,
              fontVariantNumeric: "tabular-nums",
              animationDelay: `${((waveIndex / Math.max(1, waveCount)) * 24).toFixed(2)}s`,
            }}
          >
            {formatPrice(item.price_cents, currency)}
          </span>
        </div>

        {description && (
          <div
            className="font-sans"
            style={{
              fontSize: descSize,
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

export function ScreenTafel({ venue, sections, fit, palette, clock }: Props) {
  const headingSize = `${(fit.unitVh * 0.78).toFixed(2)}vh`;
  let wave = 0;
  const waveCount = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateRows: "9vh 1fr 7vh",
        padding: "0 3vw",
        boxSizing: "border-box",
        color: palette.text,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <div className="screen-logo">
          <VenueLogo
            svg={venue.logo_svg}
            url={venue.logo_url}
            name={venue.name}
            color="auto"
            bg={palette.bg}
            accent={palette.accent}
            isDarkBg={palette.isDark}
            height={46}
          />
        </div>
        <div
          className="font-display"
          style={{ fontSize: "4.2vh", lineHeight: 1, fontWeight: 400, letterSpacing: "0.02em" }}
        >
          Speisekarte
        </div>
      </header>

      <section
        style={{
          columnCount: fit.columns,
          columnGap: "3vw",
          columnFill: "auto",
          padding: "1.5vh 0",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* No break-inside:avoid on the section wrapper: a long section must be
            allowed to continue in the next column, otherwise whole sections
            fall off the screen. Only rows and headings stay unbroken. */}
        {sections.map((s) => (
          <div key={s.id}>
            <h2
              className="font-sans"
              style={{
                fontSize: headingSize,
                lineHeight: 1.1,
                margin: 0,
                height: `${(fit.unitVh * 1.7).toFixed(2)}vh`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "flex-end",
                paddingBottom: `${(fit.unitVh * 0.22).toFixed(2)}vh`,
                color: palette.accent,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                borderBottom: `1px solid ${palette.border}`,
                breakInside: "avoid",
                breakAfter: "avoid",
              }}
            >
              {s.name}
            </h2>
            {s.items.map((it) => (
              <TafelRow
                key={it.id}
                item={it}
                currency={venue.currency}
                fit={fit}
                palette={palette}
                waveIndex={wave++}
                waveCount={waveCount}
              />
            ))}
          </div>
        ))}
      </section>

      <footer
        className="font-sans"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${palette.border}`,
          color: palette.muted,
          fontSize: "1.7vh",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        <span>Powered by ORIZ</span>
        <span style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.1em" }}>{clock}</span>
      </footer>
    </div>
  );
}
