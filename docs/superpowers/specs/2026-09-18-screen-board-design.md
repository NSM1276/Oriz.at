# ORIZ Screen — Board layout (iteration 1) — Design

Date: 2026-09-18
Source of truth for the product idea: Notion page «📺 ORIZ Screen — План продукта».

## Scope of this iteration

Guest-facing TV page only. No admin tab, no `screen_settings` table, one layout (Board).
Tunables that the admin tab will later own are passed as URL query parameters, so
the next iteration only replaces the parameter source with a DB row.

Out of scope: Spotlight and Ticker layouts, font packs, admin preview, DB table.

## Route and data

- Route: `/screen/[venueSlug]`. Public, no auth. `revalidate = 0`. Metadata `robots: noindex, nofollow`.
- Unknown slug → `notFound()`.
- Data loading: extract the venue+menus+sections+items Supabase query from
  `src/app/[venueSlug]/page.tsx` into `src/lib/menu-loader.ts` exporting
  `loadMenuPayload(slug): Promise<MenuPayload | null>`. Both the guest menu page and the
  screen page call it. Behaviour of the guest page must not change.
- Filtering on the client (`ScreenBoard`):
  1. drop items with `is_active = false`;
  2. keep sections whose `menu_id` equals `getActiveMenuId(menus)` or is `null`;
     active menu re-evaluated every 60 s;
  3. drop sections with zero remaining items;
  4. sort sections and items by `position`.
- Locale: default `de` (base fields). `?lang=xx` applies `localizeSection` when `xx` is in
  `venue.enabled_locales`; otherwise ignored.

## URL parameters

| Param | Default | Range | Meaning |
|---|---|---|---|
| `s` | `10` | 3–60 (clamped) | seconds per page |
| `preset` | venue colors | id from `COLOR_PRESETS` | override `color_bg`/`color_primary` |
| `lang` | `de` | enabled locale | translation to show |

Invalid values fall back to defaults silently.

## Board layout (landscape only, no mobile adaptation)

All sizes in `vh` / `vw` so 1920×1080 and 3840×2160 render identically.

- **Header strip** (~10vh): left `VenueLogo` (svg → url → name text, color `auto`),
  right: current section name in Cormorant Garamond, large; below it a small
  «2 / 3» page indicator when the section spans several pages.
- **Body** (~82vh): CSS grid. 3 columns when viewport width ≥ 1600px, else 2.
  Rows fixed at 5. Page capacity = columns × 5 (15 or 10 items).
  A section longer than capacity is split into consecutive pages.
- **Item card**: name (Cormorant, ~3.2vh), price right-aligned in accent color
  (Inter, ~3vh, `formatPrice(price_cents, currency)`), one line of description
  (`ai_caption` ?? `description`, Inter, ~2vh, `text-overflow: ellipsis`).
  If `image_url` is set: square thumbnail (~11vh) on the left, `object-fit: cover`.
  Without image the text block takes full card width. Thin bottom border in
  the border color derived from bg luminance.
- **Footer strip** (~8vh): left `PoweredByOriz`, right current time `HH:MM`.
  Along the very bottom a 0.4vh progress bar in accent color that fills over the
  page duration and resets on page change.
- **Colors**: `color_bg` / `color_primary` from venue (or preset override). Text, dim,
  muted and border colors derived from bg luminance with the same rule the menu
  views use (light on dark, dark on light).
- **Fonts**: Cormorant Garamond (`--font-garamond`) for section title and item names,
  Inter (`--font-inter`) for prices, descriptions, clock.
- **TV hygiene**: `cursor: none`, `user-select: none`, `overflow: hidden` on the root,
  no scrollbars. Any click/tap on the page calls `document.documentElement.requestFullscreen()`
  (browsers refuse fullscreen without a user gesture). The page reloads itself
  once every 24 h so long-running TVs pick up new deploys.

## Rotation

- Pages = flatten(sections → chunks of capacity). Index cycles `0 … n-1 → 0`.
- Timer = `s` seconds; implemented with `setTimeout` re-armed on each page change
  (not `setInterval`, so Realtime-driven recomputation never double-fires).
- Transition: framer-motion `AnimatePresence`, outgoing page fades out with a small
  upward shift, incoming fades in from below, ~450 ms.
- When the page list is recomputed (Realtime change, menu switch, viewport resize),
  the current index is clamped to the new length; the timer is not reset.

## Realtime

- Same contract as the guest menu: channel `venue:{venueId}:items`,
  `postgres_changes` on `public.items` filtered `venue_id=eq.{id}`, items kept in
  `Map<string, Item>`. INSERT/UPDATE → `set`, DELETE → `delete`.
- Price or availability changes are visible on the current page without reload.
- Network loss: Supabase client reconnects on its own; the board keeps rotating the
  last known data.

## Empty state

No section with at least one active item → full-screen centered `VenueLogo` and the
line «Speisekarte wird vorbereitet» in Cormorant, venue colors. No rotation, still
subscribed to Realtime so the board comes alive when items are added.

## Files

- `src/lib/menu-loader.ts` — new, shared query (`loadMenuPayload`).
- `src/app/[venueSlug]/page.tsx` — call the loader; no other change.
- `src/app/screen/[venueSlug]/page.tsx` — RSC: loader, parse/clamp query params,
  `notFound`, `generateMetadata` with noindex, renders `<ScreenBoard>`.
- `src/components/screen/ScreenBoard.tsx` — client: Realtime, filtering, pagination,
  rotation timer, fullscreen-on-click, 24 h reload, clock.
- `src/components/screen/ScreenPage.tsx` — one page: header, grid of `ScreenItemCard`, footer.
- `src/components/screen/ScreenItemCard.tsx` — item card.
- `src/components/screen/screen-colors.ts` — derive text/dim/muted/border from bg,
  resolve preset override.
- `src/components/screen/paginate.ts` — pure function `buildPages(sections, capacity)`;
  unit-testable without React.

## Verification

1. `npx tsc --noEmit` exits 0.
2. Dev server, browser at 1920×1080: open `/screen/ristorante-tosca`, screenshot two
   consecutive pages, confirm the switch happens after `s` seconds and the progress
   bar resets.
3. Change a price in `/admin/preview/ristorante-tosca`; the new price appears on the
   board without reload.
4. `/screen/golden-harp-meidling` (no photos) renders cleanly; `?preset=onyx` and
   `?preset=pergament` both read well; `?s=3` speeds up rotation.
5. Unknown slug returns 404; a venue with no items shows the empty state.
