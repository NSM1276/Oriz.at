import type { Venue } from "@/lib/supabase/types";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { BoardPage } from "./paginate";
import type { ScreenPalette } from "./screen-colors";
import { ScreenItemCard } from "./ScreenItemCard";

export const ROWS_PER_PAGE = 5;

type Props = {
  venue: Venue;
  page: BoardPage;
  columns: number;
  palette: ScreenPalette;
  seconds: number;
  clock: string;
};

/** One full TV frame: header strip, item grid, footer strip, progress bar. */
export function ScreenPage({ venue, page, columns, palette, seconds, clock }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateRows: "10vh 82vh 8vh",
        padding: "0 3vw",
        boxSizing: "border-box",
        color: palette.text,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <VenueLogo
          svg={venue.logo_svg}
          url={venue.logo_url}
          name={venue.name}
          color="auto"
          bg={palette.bg}
          accent={palette.accent}
          isDarkBg={palette.isDark}
          height={56}
        />
        <div style={{ textAlign: "right" }}>
          <div
            className="font-display"
            style={{ fontSize: "5.2vh", lineHeight: 1, fontWeight: 400, letterSpacing: "0.02em" }}
          >
            {page.sectionName}
          </div>
          {page.pageCount > 1 && (
            <div
              className="font-sans"
              style={{ marginTop: "0.6vh", fontSize: "1.8vh", letterSpacing: "0.18em", color: palette.muted }}
            >
              {page.pageIndex + 1} / {page.pageCount}
            </div>
          )}
        </div>
      </header>

      {/* Grid — column-major so the board reads like a printed menu */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS_PER_PAGE}, minmax(0, 1fr))`,
          gridAutoFlow: "column",
          columnGap: "3vw",
          padding: "1.5vh 0",
          minHeight: 0,
        }}
      >
        {page.items.map((item) => (
          <ScreenItemCard key={item.id} item={item} currency={venue.currency} palette={palette} />
        ))}
      </section>

      {/* Footer */}
      <footer
        className="font-sans"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "1.7vh",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: palette.muted,
        }}
      >
        <span>Powered by ORIZ</span>
        <span style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.1em" }}>{clock}</span>
      </footer>

      {/* Progress bar — restarts because the parent remounts this component per page key */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: "0.4vh",
          width: "0%",
          background: palette.accent,
          animation: `screen-progress ${seconds}s linear forwards`,
        }}
      />
    </div>
  );
}
