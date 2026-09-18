# ORIZ Screen — settings (iteration 2) — Design

Date: 2026-09-18. Builds on `2026-09-18-screen-board-design.md` (revision 2).

## Scope (agreed with the owner: "only what the first client needs")

Six knobs, editable in the admin, with a live preview:

1. Seconds per page (5 / 10 / 15 / 20).
2. Spotlight on/off.
3. Screen colors independent of the menu: the 10 presets or «Wie Speisekarte» (inherit).
4. Which sections to show and in what order.
5. Pin one dish per section as the hero (default: automatic cycling).
6. «Screen aktiv» toggle + «Vollbild testen» link.

Deliberately out: font packs, column count, hero width, custom color picker,
Realtime on settings (the TV reloads daily; the owner can reload with the remote),
video export (separate project when a client asks).

## Data

New table, one row per venue, `venue_id` is the primary key:

```sql
create table if not exists screen_settings (
  venue_id      uuid primary key references venues(id) on delete cascade,
  active        boolean     not null default true,
  rotation_sec  int         not null default 10 check (rotation_sec between 3 and 60),
  spotlight     boolean     not null default true,
  color_bg      text,                       -- null = inherit venues.color_bg
  color_primary text,                       -- null = inherit venues.color_primary
  sections      jsonb,                      -- null = all sections in position order;
                                            -- else ordered array of section ids to show
  hero_items    jsonb not null default '{}'::jsonb, -- { [sectionId]: itemId } pinned hero
  style         jsonb not null default '{}'::jsonb, -- future knobs, no migration needed
  updated_at    timestamptz not null default now()
);
alter table screen_settings enable row level security;
create policy "public read screen_settings" on screen_settings for select using (true);
create policy "owner all screen_settings" on screen_settings for all
  using (exists (select 1 from venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from venues v where v.id = venue_id and v.owner_id = auth.uid()));
```

Missing row = defaults (no row is ever required). Migration file `0013_screen_settings.sql`,
applied to prod via Supabase MCP.

`Venue` type gains nothing; new type `ScreenSettingsRow` in `src/lib/supabase/types.ts`.

## Resolution (pure, tested): `src/components/screen/screen-config.ts`

```ts
type ScreenConfig = {
  active: boolean;
  seconds: number;
  spotlight: boolean;
  colorBg: string | null;      // resolved: settings override → venue color
  colorPrimary: string | null;
  sectionIds: string[] | null; // null = all
  heroPins: Record<string, string>;
  lang: string;
};
resolveScreenConfig(row: ScreenSettingsRow | null, venue, urlParams: ScreenParams): ScreenConfig
```

Precedence: URL param (`s`, `preset`) → DB row → venue/default. URL params stay as a
testing override only; the admin never writes them.

`selectVisibleSections` gains an optional `sectionIds` argument: when given, keep only
those ids and order by the array. `buildPages` gains `heroPins`: a pinned item that
exists in the section and has a photo becomes the single `heroItems` entry (so the hero
does not cycle) and the spotlight item.

## Screen page

`/screen/[venueSlug]/page.tsx` loads the settings row (`loadScreenSettings(venueId)`,
service-less, anon read via RLS) next to the menu payload, resolves the config, passes it
to `ScreenBoard`. `active = false` → the board renders the logo-only screen (same
component as the empty state, without the «wird vorbereitet» line).

`?preview=1` is accepted and ignored by the board today; reserved so the admin iframe can
later disable fullscreen-on-click and the 24 h reload.

## API: `/api/admin/screen-settings`

- `GET ?venueId=` → `{ settings: ScreenSettingsRow | null }`.
- `PATCH { venueId, ...partial }` → upserts, returns `{ settings }`.
- Auth pattern identical to `venue-style`: demo venues skip auth; otherwise logged in and
  (super admin or owner). Validation: `rotation_sec` 3–60, `presetId` from `PRESET_IDS`
  (or `null` → inherit), `sections` array of uuid strings or null, `hero_items` object of
  uuid→uuid, `spotlight`/`active` booleans. Unknown keys rejected.

## Admin: tab «Screen» in `CartaOwnerView`

Third tab after Menü / Profil. Component `OwnerScreenTab` (`src/components/admin/OwnerScreenTab.tsx`):

- Header row: toggle «Screen aktiv», link «Vollbild testen ↗» (`/screen/[slug]`, new tab),
  and a note with the TV URL to type in.
- **Preview**: iframe of `/screen/[slug]?preview=1`, rendered at 1920×1080 and scaled with
  `transform: scale()` to the container width, 16:9 box. The iframe `key` bumps after every
  successful save so the preview reflects the change.
- **Rotation**: 4 buttons 5/10/15/20 s. **Spotlight**: toggle.
- **Farben**: button «Wie Speisekarte» + the 10 preset swatches (same look as
  `OwnerStylePicker`). Selecting stores the preset's colors into the row; «Wie Speisekarte»
  stores nulls.
- **Bereiche**: list of the venue's sections (position order) with a checkbox and ▲▼
  arrows. All checked + original order → stored as `null`.
- **Hero pro Bereich**: for each section with ≥1 photo item, a `<select>`
  «Automatisch» + photo items. Stored in `hero_items`.
- Every change PATCHes immediately (optimistic UI, revert + alert on error), matching
  the rest of the admin. Settings are fetched on tab mount via GET.
- Works unchanged in the public demo preview `/admin/preview/[slug]` because the API skips
  auth for demo venues.

## Files

- `supabase/migrations/0013_screen_settings.sql`
- `src/lib/supabase/types.ts` — `ScreenSettingsRow`
- `src/lib/screen-settings-loader.ts` — `loadScreenSettings(venueId)`
- `src/components/screen/screen-config.ts` (+ `tests/screen/screen-config.test.mjs`)
- `src/components/screen/paginate.ts` (+ tests) — `sectionIds`, `heroPins`
- `src/components/screen/ScreenBoard.tsx`, `src/app/screen/[venueSlug]/page.tsx` — consume config
- `src/app/api/admin/screen-settings/route.ts`
- `src/components/admin/OwnerScreenTab.tsx`, `src/components/admin/CartaOwnerView.tsx`

## Verification

1. Unit: config resolution precedence, section filter/order, hero pin → single hero + spotlight item.
2. `tsc` clean.
3. Browser, demo venue Tosca via `/admin/preview/ristorante-tosca` → tab Screen: set 5 s,
   pick preset Onyx, hide «Antipasti», pin a hero for «Primi», toggle spotlight off. Preview
   updates; `/screen/ristorante-tosca` in a fresh tab shows all five changes. Reset to
   defaults afterwards (nightly reset also covers it).
4. Golden Harp (real venue, no photos): tab renders, hero select absent, colors apply.
