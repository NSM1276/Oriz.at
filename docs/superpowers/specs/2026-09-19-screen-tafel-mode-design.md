# ORIZ Screen — «Tafel» mode + auto-fit — Design

Date: 2026-09-19. Builds on `2026-09-18-screen-board-design.md` (rev 2) and
`2026-09-18-screen-settings-design.md`.

Source of the ideas: the MotionD spec (`NEW/MotionD/docs/.../2026-09-19-menu-motion-design.md`),
a separate offline-video product. Only the layout and animation thinking is taken;
Remotion, MP4, USB, folder storage and filename photo matching are not.

## Why

The current board always rotates. For a counter (Imbiss, bakery, kebab) that is
wrong: the queue must not wait for a category to come back. MotionD §2 states this
outright and we agree. Restaurants, bars and lounges still want the rotating
showcase, so this is a second mode, not a replacement.

## Modes

`screen_settings.mode`:

- `showcase` (default) — today's board: hero panel, photo tiles, spotlight, rotation.
- `tafel` — every selected section on one screen at once. No pagination, no
  rotation, no spotlight, no hero. Only slow life (see Animation).

The admin exposes it as two buttons, «Vitrine» and «Tafel», with one line of
explanation each. Rotation seconds and Spotlight are hidden while `tafel` is active
because they do nothing there.

## Auto-fit (pure, tested): `src/components/screen/board-fit.ts`

No measuring the DOM. Sizes are derived deterministically from how much content
there is, so the block fills the available area at any resolution and the result is
unit-testable.

Content is counted in **units** (one unit = one text line slot):

| Element | Units |
|---|---|
| section heading | 1.7 |
| item without description | 1.0 |
| item with description | 1.55 |

```ts
computeBoardFit(sections, opts?) -> {
  columns: 2 | 3 | 4;
  unitVh: number;          // height of one unit, in vh
  showDescriptions: boolean;
  showThumbs: boolean;
  readable: boolean;       // false → too much content for one screen
}
```

Algorithm, in order, stopping at the first readable result:

1. descriptions on, thumbs on
2. descriptions off (MotionD: past ~18 items descriptions go)
3. thumbs off as well (past ~28 items)

Within each step, try 2, then 3, then 4 columns and take the first where
`unitVh = BODY_VH / (units / columns)` is at least `MIN_UNIT_VH`. If nothing fits,
return the 4-column, no-description, no-thumb variant with `readable: false` and
`unitVh = MIN_UNIT_VH`. The screen still renders at the minimum readable size and
the admin shows a warning telling the operator to split the menu across two
screens. Never shrink silently below legibility.

Constants: `BODY_VH = 78` (100 minus header and footer), `MIN_UNIT_VH = 4.4`
(a name at ~2.6vh reads from five metres on a 1080p panel).

## Tafel rendering: `src/components/screen/ScreenTafel.tsx`

- Header, thin: venue logo left, «Speisekarte» or the venue name right.
- Body: CSS multi-column flow (`column-count: fit.columns`), each section a block
  with `break-inside: avoid`, its heading in the accent colour, then its items.
- Item line: name left, dotted leader, price pill right. Description under the name
  when `showDescriptions`. Square thumbnail before the name when `showThumbs` and
  the item has a photo. A photo-less item simply has no thumbnail column, it is
  never a grey box.
- Footer: same strip as showcase, logo and clock. No progress bar (nothing rotates).
- All sizes derive from `unitVh`: name `unitVh * 0.58`, price `unitVh * 0.55`,
  description `unitVh * 0.38`, thumb `unitVh * 0.9`.

## Empty photo slots (fixes today's showcase mode)

MotionD §9: never render a placeholder where a photo is missing. Today a photo-less
item inside a section that has photos renders as a solid `palette.panel` tile, which
reads as a failed image.

- `buildPages` orders photo items before photo-less ones inside a visual section, so
  tiles cluster at the top («рекомендуем» first).
- `ScreenTile` renders a photo-less item as a bordered text row inside the same grid
  cell: transparent background, top hairline, name and price pill, description.
  It reads as a deliberate list entry, not as a broken tile.

## Animation: life without rotation

A static board must still breathe (MotionD §11.2).

- **Attention wave**: every price pill gets a very slow breath, scale 1 → 1.03 and a
  small brightness lift, period 24 s, staggered by index so one pill lifts at a time.
  `@keyframes screen-attention` in `globals.css`, `prefers-reduced-motion` respected.
- Ken Burns on photos stays as it is.
- The ambience layer (dust, snow, bokeh) from MotionD §11.3 is **not** in this
  iteration. When it comes, its discipline is binding: opacity never above 0.15,
  a particle crosses the screen in 30–60 s, nothing dense over the price zone.

## Data + admin

- Migration `0015_screen_mode.sql`: `alter table screen_settings add column mode text
  not null default 'showcase' check (mode in ('showcase','tafel'))`.
- `ScreenSettingsRow.mode`, `ScreenConfig.mode`, resolved by `resolveScreenConfig`.
- `/api/admin/screen-settings` accepts `mode` with the same two values.
- `OwnerScreenTab`: a «Darstellung» row with the two buttons; rotation and spotlight
  controls hidden in `tafel`; a warning line when the current content is not readable
  on one screen.

## Verification

1. Unit tests for `computeBoardFit`: few items stay 2 columns with descriptions;
   crossing the thresholds drops descriptions then thumbs; a huge menu returns
   `readable: false` and never a unit below the minimum.
2. `tsc` clean, existing screen tests still green.
3. Browser at 1920×1080: switch Tosca to Tafel in the admin, the board stops
   rotating and shows every section at once, still updating live.
4. Golden Harp (102 items, no photos) in Tafel: readable or an honest warning.
5. A section with mixed photos in showcase mode shows no grey tiles.
