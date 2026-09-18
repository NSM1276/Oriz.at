"use client";

import type { Item, Venue } from "@/lib/supabase/types";
import type { BoardPage } from "./paginate";
import type { ScreenPalette } from "./screen-colors";
import { ScreenHero } from "./ScreenHero";
import { ScreenTile } from "./ScreenTile";
import { ScreenRow } from "./ScreenRow";

type Props = {
  venue: Venue;
  page: BoardPage;
  /** Dish featured in the hero panel right now (cycles independently of the page). */
  heroItem: Item | null;
  palette: ScreenPalette;
};

/** One board frame: hero panel on the left, section title + tiles/rows on the right. */
export function ScreenPage({ venue, page, heroItem, palette }: Props) {
  // Rows follow the item count (pages are balanced by paginate.ts), with a floor so
  // a 2-item page does not become two gigantic tiles.
  const rows = Math.max(page.visual ? 2 : 3, Math.ceil(page.items.length / 2));
  const gridStyle = page.visual
    ? {
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap: "2.4vh 2vw",
      }
    : {
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gridAutoFlow: "column" as const,
        columnGap: "3vw",
      };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "40vw 1fr",
      }}
    >
      <ScreenHero venue={venue} sectionName={page.sectionName} item={heroItem} palette={palette} />

      <section
        style={{
          display: "grid",
          gridTemplateRows: "11vh 1fr",
          padding: "0 3vw 0 2.6vw",
          minWidth: 0,
          color: palette.text,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: "1.6vh",
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          <h2
            className="font-display"
            style={{ fontWeight: 400, fontSize: "6.4vh", lineHeight: 1, margin: 0 }}
          >
            {page.sectionName}
          </h2>
          {page.pageCount > 1 && (
            <div style={{ display: "flex", gap: "0.8vh", paddingBottom: "1vh" }} aria-hidden>
              {Array.from({ length: page.pageCount }, (_, i) => (
                <i
                  key={i}
                  style={{
                    width: "1.2vh",
                    height: "1.2vh",
                    borderRadius: "50%",
                    background: i === page.pageIndex ? palette.accent : palette.muted,
                    display: "block",
                  }}
                />
              ))}
            </div>
          )}
        </header>

        <div style={{ display: "grid", padding: "2.4vh 0", minHeight: 0, ...gridStyle }}>
          {page.items.map((item, i) =>
            page.visual ? (
              <ScreenTile key={item.id} item={item} currency={venue.currency} palette={palette} index={i} />
            ) : (
              <ScreenRow key={item.id} item={item} currency={venue.currency} palette={palette} index={i} />
            ),
          )}
        </div>
      </section>
    </div>
  );
}
