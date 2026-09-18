# ORIZ Screen — Board layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the public TV page `/screen/[venueSlug]` that rotates a restaurant's menu section by section on a landscape screen, with live price updates.

**Architecture:** The Supabase query that builds `MenuPayload` moves from the guest page into `src/lib/menu-loader.ts` and is shared by both pages. `/screen/[venueSlug]/page.tsx` is an RSC that loads the payload, parses URL tunables and renders the client component `ScreenBoard`, which owns Realtime, filtering, pagination and the rotation timer. Pure logic (pagination, param parsing, palette) lives in dependency-free modules tested with `node --test`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v3 (used only for fonts/utility here, layout is inline vh/vw styles), framer-motion 12, Supabase Realtime, Node 25 built-in test runner (`node --test`, type-stripping).

Spec: `docs/superpowers/specs/2026-09-18-screen-board-design.md`

---

## Notes for the implementer

- Working tree already contains uncommitted WIP in 14 files (multilingual guest menu). **Never `git add -A`.** Add only the files named in each task's commit step.
- Path alias `@/*` → `src/*`. Node's test runner cannot resolve the alias, so every module that is unit-tested must have **no runtime imports** (type-only imports are fine, they are stripped). Tests live in `tests/screen/*.test.mjs` and import the `.ts` module with its extension.
- Run type-check with `npx tsc --noEmit`. There is no lint step required.
- Commit trailer for every commit:
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`
- Deploy is by `git push origin main` only (Vercel via GitHub). Do not push in this plan; the user decides.

## File map

| File | Responsibility |
|---|---|
| `src/lib/menu-loader.ts` | `loadMenuPayload(slug)` — the one Supabase query for venue + menus + sections + items |
| `src/app/[venueSlug]/page.tsx` | Guest menu; now calls the loader, otherwise unchanged |
| `src/components/screen/paginate.ts` | Pure: `selectVisibleSections`, `buildPages` |
| `src/components/screen/screen-params.ts` | Pure: `parseScreenParams` (clamp `s`, validate `preset`, `lang`) |
| `src/components/screen/screen-colors.ts` | Pure: `buildPalette(bg, accent)` |
| `src/components/screen/ScreenItemCard.tsx` | One dish row |
| `src/components/screen/ScreenPage.tsx` | One board page: header, grid, footer, progress bar |
| `src/components/screen/ScreenBoard.tsx` | Client: Realtime, timers, fullscreen, rotation |
| `src/app/screen/[venueSlug]/page.tsx` | RSC entry, metadata noindex |
| `src/app/globals.css` | `@keyframes screen-progress` |
| `tests/screen/paginate.test.mjs`, `tests/screen/screen-params.test.mjs`, `tests/screen/screen-colors.test.mjs` | Unit tests |

---

### Task 1: Shared menu loader

**Files:**
- Create: `src/lib/menu-loader.ts`
- Modify: `src/app/[venueSlug]/page.tsx`

- [ ] **Step 1: Create the loader**

```ts
// src/lib/menu-loader.ts
import { createClient } from "@/lib/supabase/server";
import type { Item, MenuData, MenuPayload, Section, Venue } from "@/lib/supabase/types";

type Row = Venue & {
  sections: (Section & { items: Item[] })[];
  menus: MenuData[];
};

export const MENU_SELECT =
  "id, slug, name, logo_url, logo_svg, about, currency, color_primary, color_bg, menu_theme, owner_id, created_at, instagram_url, google_maps_url, phone, address, tripadvisor_url, facebook_url, website_url, google_review_url, price_range, opening_hours, gallery, enabled_locales, translations, menus(id, name, position, active_days, time_from, time_to), sections(id, venue_id, name, position, menu_id, translations, items(id, section_id, venue_id, name, description, price_cents, image_url, allergens, diet_tags, ai_caption, is_active, position, updated_at, translations))";

/** Loads everything the guest menu and the TV screen need for one venue.
 *  Returns null when the slug does not exist (caller decides about notFound). */
export async function loadMenuPayload(slug: string): Promise<MenuPayload | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(MENU_SELECT)
    .eq("slug", slug)
    .maybeSingle<Row>();

  if (error || !data) return null;

  const sections = (data.sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      ...s,
      items: (s.items ?? []).slice().sort((a, b) => a.position - b.position),
    }));

  const menus: MenuData[] = ((data.menus ?? []) as MenuData[])
    .slice()
    .sort((a, b) => a.position - b.position);

  const v = data as Partial<Venue> & Row;

  return {
    venue: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      logo_url: data.logo_url,
      logo_svg: v.logo_svg ?? null,
      about: data.about,
      currency: data.currency,
      color_primary: data.color_primary,
      color_bg: data.color_bg,
      owner_id: data.owner_id,
      created_at: data.created_at,
      instagram_url: v.instagram_url ?? null,
      google_maps_url: v.google_maps_url ?? null,
      menu_theme: (v.menu_theme ?? "classic") as "classic" | "modern" | "visual",
      phone: v.phone ?? null,
      address: v.address ?? null,
      tripadvisor_url: v.tripadvisor_url ?? null,
      facebook_url: v.facebook_url ?? null,
      website_url: v.website_url ?? null,
      google_review_url: v.google_review_url ?? null,
      price_range: v.price_range ?? null,
      opening_hours: v.opening_hours ?? null,
      gallery: v.gallery ?? null,
      enabled_locales: v.enabled_locales ?? [],
      translations: v.translations ?? null,
    },
    sections,
    menus,
  };
}
```

- [ ] **Step 2: Rewrite the guest page to use it**

Replace the whole file `src/app/[venueSlug]/page.tsx` with:

```tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/menu/MenuView";
import { DemoBanner } from "@/components/menu/DemoBanner";
import { resolveInitialLocale } from "@/lib/menu-i18n";
import { loadMenuPayload } from "@/lib/menu-loader";

const DEMO_SLUGS = ["ristorante-tosca", "brasserie-lumiere", "sushi-schonbrunn"];

export const revalidate = 0;

export default async function GuestMenuPage({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const initial = await loadMenuPayload(venueSlug);
  if (!initial) notFound();

  const isDemo = DEMO_SLUGS.includes(venueSlug);

  const acceptLanguage = (await headers()).get("accept-language");
  const initialLocale = resolveInitialLocale(acceptLanguage, initial.venue.enabled_locales);

  return (
    <>
      {isDemo && (
        <DemoBanner
          slug={venueSlug}
          name={initial.venue.name}
          accent={initial.venue.color_primary ?? "#C69B3C"}
        />
      )}
      <MenuView initial={initial} initialLocale={initialLocale} />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("venues")
    .select("name, about")
    .eq("slug", venueSlug)
    .maybeSingle<{ name: string; about: string | null }>();
  if (!data) return { title: "ORIZ" };
  const description = data.about ?? `Menu of ${data.name}, presented by ORIZ.`;
  return {
    title: `${data.name} — Menu`,
    description,
    openGraph: { title: `${data.name} — Menu`, description, siteName: "ORIZ", type: "website" },
    twitter: { card: "summary_large_image", title: `${data.name} — Menu`, description },
  };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 4: Smoke-test the guest page still renders**

Start dev server (Browser pane `preview_start`, or `npm run dev`) and open `http://localhost:3000/ristorante-tosca`. Expected: menu renders with sections and prices exactly as before.

- [ ] **Step 5: Commit**

```bash
git add src/lib/menu-loader.ts "src/app/[venueSlug]/page.tsx"
git commit -m "refactor(menu): extract shared loadMenuPayload loader

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Pagination logic (pure, tested)

**Files:**
- Create: `src/components/screen/paginate.ts`
- Test: `tests/screen/paginate.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// tests/screen/paginate.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPages, selectVisibleSections } from "../../src/components/screen/paginate.ts";

const item = (id, sectionId, extra = {}) => ({
  id, section_id: sectionId, venue_id: "v", name: id, description: null,
  price_cents: 100, image_url: null, ai_caption: null, allergens: null,
  is_active: true, position: Number(id.replace(/\D/g, "")) || 0, updated_at: "", ...extra,
});
const section = (id, extra = {}) => ({ id, venue_id: "v", name: id.toUpperCase(), position: 0, items: [], ...extra });

test("buildPages splits a long section into consecutive pages", () => {
  const items = Array.from({ length: 7 }, (_, i) => item(`i${i}`, "s1"));
  const pages = buildPages([section("s1", { items })], 3);
  assert.equal(pages.length, 3);
  assert.deepEqual(pages.map((p) => p.items.length), [3, 3, 1]);
  assert.deepEqual(pages.map((p) => p.pageIndex), [0, 1, 2]);
  assert.ok(pages.every((p) => p.pageCount === 3 && p.sectionName === "S1"));
  assert.equal(pages[1].key, "s1:1");
});

test("buildPages skips empty sections and keeps section order", () => {
  const pages = buildPages(
    [section("a", { items: [item("i1", "a")] }), section("b"), section("c", { items: [item("i2", "c")] })],
    10,
  );
  assert.deepEqual(pages.map((p) => p.sectionId), ["a", "c"]);
});

test("buildPages never uses a capacity below 1", () => {
  const pages = buildPages([section("a", { items: [item("i1", "a"), item("i2", "a")] })], 0);
  assert.equal(pages.length, 2);
});

test("selectVisibleSections rebuilds items from the map, drops inactive, sorts, filters by menu", () => {
  const sections = [
    section("s1", { position: 1, menu_id: "lunch" }),
    section("s2", { position: 0, menu_id: null }),
    section("s3", { position: 2, menu_id: "dinner" }),
  ];
  const map = new Map([
    ["i2", item("i2", "s1")],
    ["i1", item("i1", "s1")],
    ["i3", item("i3", "s1", { is_active: false })],
    ["i4", item("i4", "s2")],
    ["i5", item("i5", "s3")],
  ]);
  const out = selectVisibleSections(sections, map, "lunch");
  assert.deepEqual(out.map((s) => s.id), ["s2", "s1"]);
  assert.deepEqual(out[1].items.map((i) => i.id), ["i1", "i2"]);
});

test("selectVisibleSections drops sections left without items", () => {
  const out = selectVisibleSections([section("s1")], new Map(), null);
  assert.equal(out.length, 0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/screen/paginate.test.mjs`
Expected: fails with `Cannot find module ... paginate.ts`.

- [ ] **Step 3: Implement**

```ts
// src/components/screen/paginate.ts
// Pure pagination logic for the TV board. No runtime imports — unit-tested with node --test.
import type { Item, Section } from "@/lib/supabase/types";

export type SectionWithItems = Section & { items: Item[] };

export type BoardPage = {
  /** Stable key for React / framer-motion: `${sectionId}:${pageIndex}` */
  key: string;
  sectionId: string;
  sectionName: string;
  pageIndex: number;
  pageCount: number;
  items: Item[];
};

/** Rebuilds each section's item list from the live item map, drops inactive items,
 *  keeps only sections belonging to the active menu (or global ones), drops empty
 *  sections, and sorts everything by position. */
export function selectVisibleSections(
  sections: SectionWithItems[],
  items: Map<string, Item>,
  activeMenuId: string | null,
): SectionWithItems[] {
  const live = Array.from(items.values());
  return sections
    .filter((s) => s.menu_id == null || s.menu_id === activeMenuId)
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      ...s,
      items: live
        .filter((it) => it.section_id === s.id && it.is_active)
        .sort((a, b) => a.position - b.position),
    }))
    .filter((s) => s.items.length > 0);
}

/** Splits every section into pages of at most `capacity` items. */
export function buildPages(sections: SectionWithItems[], capacity: number): BoardPage[] {
  const cap = Math.max(1, Math.floor(capacity));
  const pages: BoardPage[] = [];
  for (const s of sections) {
    if (s.items.length === 0) continue;
    const pageCount = Math.ceil(s.items.length / cap);
    for (let i = 0; i < pageCount; i++) {
      pages.push({
        key: `${s.id}:${i}`,
        sectionId: s.id,
        sectionName: s.name,
        pageIndex: i,
        pageCount,
        items: s.items.slice(i * cap, (i + 1) * cap),
      });
    }
  }
  return pages;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/screen/paginate.test.mjs`
Expected: `# pass 5`, `# fail 0`.

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc --noEmit` → exit 0.

```bash
git add src/components/screen/paginate.ts tests/screen/paginate.test.mjs
git commit -m "feat(screen): pure pagination for TV board

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: URL parameter parsing (pure, tested)

**Files:**
- Create: `src/components/screen/screen-params.ts`
- Test: `tests/screen/screen-params.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// tests/screen/screen-params.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScreenParams, DEFAULT_SECONDS } from "../../src/components/screen/screen-params.ts";

const opts = { enabledLocales: ["en", "it"], presetIds: new Set(["onyx", "pergament"]) };

test("defaults when nothing is given", () => {
  assert.deepEqual(parseScreenParams({}, opts), { seconds: DEFAULT_SECONDS, presetId: null, lang: "de" });
});

test("clamps seconds into 3..60 and ignores garbage", () => {
  assert.equal(parseScreenParams({ s: "1" }, opts).seconds, 3);
  assert.equal(parseScreenParams({ s: "999" }, opts).seconds, 60);
  assert.equal(parseScreenParams({ s: "15" }, opts).seconds, 15);
  assert.equal(parseScreenParams({ s: "abc" }, opts).seconds, DEFAULT_SECONDS);
  assert.equal(parseScreenParams({ s: ["7", "9"] }, opts).seconds, 7);
});

test("accepts only known preset ids", () => {
  assert.equal(parseScreenParams({ preset: "onyx" }, opts).presetId, "onyx");
  assert.equal(parseScreenParams({ preset: "ONYX" }, opts).presetId, "onyx");
  assert.equal(parseScreenParams({ preset: "neon" }, opts).presetId, null);
});

test("accepts only enabled locales, falls back to de", () => {
  assert.equal(parseScreenParams({ lang: "en" }, opts).lang, "en");
  assert.equal(parseScreenParams({ lang: "fr" }, opts).lang, "de");
  assert.equal(parseScreenParams({ lang: "de" }, opts).lang, "de");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/screen/screen-params.test.mjs`
Expected: fails with `Cannot find module ... screen-params.ts`.

- [ ] **Step 3: Implement**

```ts
// src/components/screen/screen-params.ts
// Parses the TV board's URL tunables. No runtime imports — unit-tested with node --test.
// The admin tab (next iteration) will replace these with a DB row; keep the shape stable.

export type SearchParams = Record<string, string | string[] | undefined>;

export type ScreenParams = {
  /** seconds per page */
  seconds: number;
  /** id from COLOR_PRESETS or null = use venue colors */
  presetId: string | null;
  /** locale for names/descriptions, "de" = base fields */
  lang: string;
};

export const DEFAULT_SECONDS = 10;
export const MIN_SECONDS = 3;
export const MAX_SECONDS = 60;
export const BASE_LANG = "de";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseScreenParams(
  sp: SearchParams,
  opts: { enabledLocales: readonly string[]; presetIds: ReadonlySet<string> },
): ScreenParams {
  const rawS = Number(first(sp.s));
  const seconds = Number.isFinite(rawS) && rawS > 0
    ? Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(rawS)))
    : DEFAULT_SECONDS;

  const rawPreset = first(sp.preset)?.toLowerCase() ?? "";
  const presetId = opts.presetIds.has(rawPreset) ? rawPreset : null;

  const rawLang = first(sp.lang)?.toLowerCase() ?? BASE_LANG;
  const lang = rawLang !== BASE_LANG && opts.enabledLocales.includes(rawLang) ? rawLang : BASE_LANG;

  return { seconds, presetId, lang };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/screen/screen-params.test.mjs`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc --noEmit` → exit 0.

```bash
git add src/components/screen/screen-params.ts tests/screen/screen-params.test.mjs
git commit -m "feat(screen): parse s/preset/lang URL params

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Palette derivation (pure, tested)

**Files:**
- Create: `src/components/screen/screen-colors.ts`
- Test: `tests/screen/screen-colors.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// tests/screen/screen-colors.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPalette } from "../../src/components/screen/screen-colors.ts";

test("dark background → light text", () => {
  const p = buildPalette("#0A0A0A", "#C69B3C");
  assert.equal(p.isDark, true);
  assert.equal(p.bg, "#0A0A0A");
  assert.equal(p.text, "#F5F0EC");
  assert.equal(p.accent, "#C69B3C");
});

test("light background → dark text", () => {
  const p = buildPalette("#F5F0EC", "#B87333");
  assert.equal(p.isDark, false);
  assert.equal(p.text, "#0A0A0A");
  assert.equal(p.accent, "#B87333");
});

test("missing colors fall back to parchment + gold", () => {
  const p = buildPalette(null, undefined);
  assert.equal(p.bg, "#F5F0EC");
  assert.equal(p.accent, "#C69B3C");
  assert.equal(p.isDark, false);
});

test("invalid hex is treated as light", () => {
  assert.equal(buildPalette("not-a-color", null).isDark, false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/screen/screen-colors.test.mjs`
Expected: fails with `Cannot find module ... screen-colors.ts`.

- [ ] **Step 3: Implement**

```ts
// src/components/screen/screen-colors.ts
// Same luminance rule as MenuView: WCAG relative luminance, threshold 0.4.

export type ScreenPalette = {
  bg: string;
  text: string;
  dim: string;
  muted: string;
  border: string;
  accent: string;
  isDark: boolean;
};

const PARCHMENT = "#F5F0EC";
const ONYX = "#0A0A0A";
const GOLD = "#C69B3C";

function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function buildPalette(
  bg: string | null | undefined,
  accent: string | null | undefined,
): ScreenPalette {
  const base = bg ?? PARCHMENT;
  const isDark = luminance(base) < 0.4;
  return {
    bg: base,
    text: isDark ? PARCHMENT : ONYX,
    dim: isDark ? "rgba(245,240,236,0.60)" : "rgba(10,10,10,0.60)",
    muted: isDark ? "rgba(245,240,236,0.30)" : "rgba(10,10,10,0.30)",
    border: isDark ? "rgba(245,240,236,0.12)" : "rgba(10,10,10,0.12)",
    accent: accent ?? GOLD,
    isDark,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/screen/screen-colors.test.mjs`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc --noEmit` → exit 0.

```bash
git add src/components/screen/screen-colors.ts tests/screen/screen-colors.test.mjs
git commit -m "feat(screen): palette derivation from venue colors

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Item card and page components

**Files:**
- Create: `src/components/screen/ScreenItemCard.tsx`
- Create: `src/components/screen/ScreenPage.tsx`
- Modify: `src/app/globals.css` (append)

- [ ] **Step 1: Append the progress keyframes to globals.css**

Append at the very end of `src/app/globals.css`:

```css

/* ── ORIZ Screen (TV board) ─────────────────────────────────── */
@keyframes screen-progress {
  from { width: 0%; }
  to   { width: 100%; }
}
```

- [ ] **Step 2: Create the item card**

```tsx
// src/components/screen/ScreenItemCard.tsx
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
```

- [ ] **Step 3: Create the page component**

```tsx
// src/components/screen/ScreenPage.tsx
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

      {/* Grid */}
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
```

Note: `gridAutoFlow: "column"` fills the first column top-to-bottom, then the next — the way a printed menu board reads.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/screen/ScreenItemCard.tsx src/components/screen/ScreenPage.tsx src/app/globals.css
git commit -m "feat(screen): item card and page frame for TV board

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: ScreenBoard client component

**Files:**
- Create: `src/components/screen/ScreenBoard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/screen/ScreenBoard.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Item, MenuPayload } from "@/lib/supabase/types";
import { getActiveMenuId } from "@/lib/menu-schedule";
import { localizeSection } from "@/lib/menu-i18n";
import { VenueLogo } from "@/components/brand/VenueLogo";
import { buildPages, selectVisibleSections } from "./paginate";
import type { ScreenParams } from "./screen-params";
import type { ScreenPalette } from "./screen-colors";
import { ScreenPage, ROWS_PER_PAGE } from "./ScreenPage";

const WIDE_QUERY = "(min-width: 1600px)";
const MENU_RECHECK_MS = 60_000;
const CLOCK_TICK_MS = 15_000;
const RELOAD_AFTER_MS = 24 * 60 * 60 * 1000;

type Props = {
  initial: MenuPayload;
  params: ScreenParams;
  palette: ScreenPalette;
};

function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ScreenBoard({ initial, params, palette }: Props) {
  const { venue, sections, menus = [] } = initial;

  // ── Live items (same Realtime contract as the guest menu) ──
  const [items, setItems] = useState<Map<string, Item>>(() => {
    const map = new Map<string, Item>();
    for (const s of sections) for (const it of s.items) map.set(it.id, it);
    return map;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`venue:${venue.id}:items`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `venue_id=eq.${venue.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as Item;
            if (old?.id) setItems((prev) => { const next = new Map(prev); next.delete(old.id); return next; });
          } else {
            const row = payload.new as Item;
            if (row?.id) setItems((prev) => { const next = new Map(prev); next.set(row.id, row); return next; });
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [venue.id]);

  // ── Active menu by schedule, re-evaluated every minute ──
  const [activeMenuId, setActiveMenuId] = useState<string | null>(() => getActiveMenuId(menus));
  useEffect(() => {
    const id = setInterval(() => setActiveMenuId(getActiveMenuId(menus)), MENU_RECHECK_MS);
    return () => clearInterval(id);
  }, [menus]);

  // ── Columns from viewport width ──
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const apply = () => setColumns(mq.matches ? 3 : 2);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ── Pages ──
  const pages = useMemo(() => {
    const visible = selectVisibleSections(sections, items, activeMenuId)
      .map((s) => localizeSection(s, params.lang));
    return buildPages(visible, columns * ROWS_PER_PAGE);
  }, [sections, items, activeMenuId, columns, params.lang]);

  // ── Rotation: setTimeout re-armed per page; page count read via ref so a
  //    Realtime recompute does not reset the timer ──
  const [index, setIndex] = useState(0);
  const pageCountRef = useRef(pages.length);
  pageCountRef.current = pages.length;
  const safeIndex = pages.length ? index % pages.length : 0;

  useEffect(() => {
    if (pageCountRef.current <= 1) return;
    const id = setTimeout(() => {
      setIndex((i) => (pageCountRef.current ? (i + 1) % pageCountRef.current : 0));
    }, params.seconds * 1000);
    return () => clearTimeout(id);
  }, [safeIndex, params.seconds, pages.length > 1]);

  // ── Clock ──
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── TV hygiene: body background, daily reload ──
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = palette.bg;
    const id = setTimeout(() => window.location.reload(), RELOAD_AFTER_MS);
    return () => { document.body.style.backgroundColor = prev; clearTimeout(id); };
  }, [palette.bg]);

  function requestFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  const page = pages[safeIndex];

  return (
    <div
      onClick={requestFullscreen}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: palette.bg,
        cursor: "none",
        userSelect: "none",
      }}
    >
      {page ? (
        <AnimatePresence initial={false}>
          <motion.div
            key={page.key}
            initial={{ opacity: 0, y: "2vh" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-2vh" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <ScreenPage
              venue={venue}
              page={page}
              columns={columns}
              palette={palette}
              seconds={params.seconds}
              clock={clock}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4vh",
            color: palette.text,
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
            height={120}
          />
          <div className="font-display" style={{ fontSize: "4vh", fontWeight: 300, color: palette.dim }}>
            Speisekarte wird vorbereitet
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` → exit 0. If `useEffect` dependency `pages.length > 1` triggers a lint warning, that is acceptable (no lint gate); it is intentional so the timer starts once a second page appears.

- [ ] **Step 3: Commit**

```bash
git add src/components/screen/ScreenBoard.tsx
git commit -m "feat(screen): ScreenBoard client with rotation and Realtime

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Route `/screen/[venueSlug]`

**Files:**
- Create: `src/app/screen/[venueSlug]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/screen/[venueSlug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadMenuPayload } from "@/lib/menu-loader";
import { COLOR_PRESETS, PRESET_IDS } from "@/lib/colorPresets";
import { ScreenBoard } from "@/components/screen/ScreenBoard";
import { parseScreenParams, type SearchParams } from "@/components/screen/screen-params";
import { buildPalette } from "@/components/screen/screen-colors";

export const revalidate = 0;

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function ScreenRoute({ params, searchParams }: Props) {
  const [{ venueSlug }, sp] = await Promise.all([params, searchParams]);
  const payload = await loadMenuPayload(venueSlug);
  if (!payload) notFound();

  const screenParams = parseScreenParams(sp, {
    enabledLocales: payload.venue.enabled_locales ?? [],
    presetIds: PRESET_IDS,
  });

  const preset = screenParams.presetId
    ? COLOR_PRESETS.find((p) => p.id === screenParams.presetId) ?? null
    : null;

  const palette = buildPalette(
    preset?.color_bg ?? payload.venue.color_bg,
    preset?.color_primary ?? payload.venue.color_primary,
  );

  return <ScreenBoard initial={payload} params={screenParams} palette={palette} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  const payload = await loadMenuPayload(venueSlug);
  return {
    title: payload ? `${payload.venue.name} — Screen` : "ORIZ Screen",
    robots: { index: false, follow: false },
  };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Run all unit tests**

Run: `node --test tests/screen/`
Expected: `# pass 13`, `# fail 0`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/screen/[venueSlug]/page.tsx"
git commit -m "feat(screen): public /screen/[venueSlug] TV board route

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Browser verification (spec §Verification)

**Files:** none (may produce small fixes; commit them as `fix(screen): ...`).

- [ ] **Step 1: Start the dev server and open the board**

Use the Browser pane (`preview_start` with the project's dev config, or `npm run dev`). Resize the tab to 1920×1080. Navigate to `http://localhost:3000/screen/ristorante-tosca?s=4`.
Expected: dark/light venue colors fill the whole viewport, header shows logo + first section name, grid has up to 15 dishes in 3 columns, footer shows «POWERED BY ORIZ» and the clock, gold progress bar grows along the bottom. No console errors.

- [ ] **Step 2: Confirm rotation**

Take a screenshot, wait 5 s, take another. Expected: the section name changed (or the page indicator advanced), the progress bar restarted from 0.

- [ ] **Step 3: Confirm Realtime**

In a second tab open `http://localhost:3000/admin/preview/ristorante-tosca`, edit the price of a dish that is on the currently visible board page, save. Switch back to the board tab. Expected: new price visible without reload, board did not jump to page 0.

- [ ] **Step 4: Confirm no-photo venue, presets, columns**

Open `http://localhost:3000/screen/golden-harp-meidling` → rows have no thumbnails, text fills the width.
Open `...?preset=onyx` and `...?preset=pergament` → dark and light palettes both readable.
Resize the tab to 1366×768 → 2 columns, 10 items per page.

- [ ] **Step 5: Confirm 404 and empty state**

Open `http://localhost:3000/screen/does-not-exist` → Next 404 page.
For the empty state, either use a venue with no items or temporarily pass an impossible menu (skip if no such venue exists; note it in the report).

- [ ] **Step 6: Report**

Post to the user: two board screenshots (consecutive pages), the Realtime result, and any fix commits made. Do not push.
