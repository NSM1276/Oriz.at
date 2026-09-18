import type { Venue } from "@/lib/supabase/types";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { BoardPage } from "./paginate";
import type { ScreenPalette } from "./screen-colors";
import { ScreenItemCard } from "./ScreenItemCard";

export const ROWS_PER_PAGE = 5;
/** Body is 82vh minus 3vh vertical padding, divided into ROWS_PER_PAGE rows. */
const ROW_HEIGHT = `calc(79vh / ${ROWS_PER_PAGE})`;

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
  const rows = Math.min(ROWS_PER_PAGE, Math.max(1, Math.ceil(page.items.length / columns)));

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
        <div className="screen-logo">
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
        </div>
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

      {/* Grid — column-major so the board reads like a printed menu.
          Row height is fixed (body height / ROWS_PER_PAGE) and the row count
          shrinks to ceil(items / columns), so a short section spreads evenly
          across columns (3+3+2) instead of stacking in the first one (5+3+0). */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, ${ROW_HEIGHT})`,
          gridAutoFlow: "column",
          alignContent: "start",
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
