// Pure pagination logic for the TV board. No runtime imports — unit-tested with node --test.
import type { Item, Section } from "@/lib/supabase/types";

export type SectionWithItems = Section & { items: Item[] };

/** Photo tiles: 2 columns × 3 rows. */
export const VISUAL_CAPACITY = 6;
/** Text rows for sections without any photo: 2 columns × 5 rows. */
export const TEXT_CAPACITY = 10;

export type BoardPage = {
  kind: "board";
  /** Stable key for React / framer-motion */
  key: string;
  sectionId: string;
  sectionName: string;
  pageIndex: number;
  pageCount: number;
  items: Item[];
  /** true → photo tiles, false → text rows */
  visual: boolean;
  /** Every item of the section that has a photo — the hero panel cycles through them. */
  heroItems: Item[];
};

export type SpotlightPage = {
  kind: "spotlight";
  key: string;
  sectionId: string;
  sectionName: string;
  item: Item;
};

export type ScreenPageData = BoardPage | SpotlightPage;

/** Rebuilds each section's item list from the live item map, drops inactive items,
 *  keeps only sections belonging to the active menu (or global ones), drops empty
 *  sections, and sorts everything by position. */
export function selectVisibleSections(
  sections: SectionWithItems[],
  items: Map<string, Item>,
  activeMenuId: string | null,
  /** Owner's pick from screen_settings: only these ids, in this order. null = all. */
  sectionIds: string[] | null = null,
): SectionWithItems[] {
  const live = Array.from(items.values());
  const order = sectionIds ? new Map(sectionIds.map((id, i) => [id, i])) : null;
  return sections
    .filter((s) => s.menu_id == null || s.menu_id === activeMenuId)
    .filter((s) => !order || order.has(s.id))
    .slice()
    .sort((a, b) => (order ? order.get(a.id)! - order.get(b.id)! : a.position - b.position))
    .map((s) => ({
      ...s,
      items: live
        .filter((it) => it.section_id === s.id && it.is_active)
        .sort((a, b) => a.position - b.position),
    }))
    .filter((s) => s.items.length > 0);
}

export function sectionIsVisual(items: Item[]): boolean {
  return items.some((it) => !!it.image_url);
}

export type BuildPagesOptions = {
  /** Insert one full-screen spotlight after every section that has photos. Default true. */
  spotlight?: boolean;
  /** { [sectionId]: itemId } — pinned hero dish; must exist in the section and have a photo,
   *  otherwise the pin is ignored and the hero cycles as usual. */
  heroPins?: Record<string, string>;
};

/** Splits every section into board pages (tiles or rows) and, for sections with
 *  photos, appends one spotlight page showing a single dish full-screen. */
export function buildPages(
  sections: SectionWithItems[],
  opts: BuildPagesOptions = {},
): ScreenPageData[] {
  const spotlight = opts.spotlight ?? true;
  const heroPins = opts.heroPins ?? {};
  const pages: ScreenPageData[] = [];

  sections.forEach((s, sectionIndex) => {
    if (s.items.length === 0) return;
    const visual = sectionIsVisual(s.items);
    const cap = visual ? VISUAL_CAPACITY : TEXT_CAPACITY;
    // Photos first: the tiles cluster at the top like a showcase and the plain
    // entries follow, instead of grey gaps scattered through the grid.
    const ordered = visual
      ? [...s.items].sort((a, b) => Number(!!b.image_url) - Number(!!a.image_url))
      : s.items;
    const photoItems = ordered.filter((it) => !!it.image_url);
    const pinned = photoItems.find((it) => it.id === heroPins[s.id]) ?? null;
    // A pinned dish is the only hero (no cycling); otherwise cycle through every photo dish.
    const heroItems = pinned ? [pinned] : photoItems;
    const pageCount = Math.ceil(s.items.length / cap);
    // Balanced split: 8 tiles → 4+4, not 6+2. A nearly empty last page looks broken on a TV.
    const perPage = Math.ceil(s.items.length / pageCount);

    for (let i = 0; i < pageCount; i++) {
      pages.push({
        kind: "board",
        key: `${s.id}:${i}`,
        sectionId: s.id,
        sectionName: s.name,
        pageIndex: i,
        pageCount,
        items: ordered.slice(i * perPage, (i + 1) * perPage),
        visual,
        heroItems,
      });
    }

    if (spotlight && heroItems.length > 0) {
      // Pinned dish, else a deterministic pick that varies from section to section.
      const item = pinned ?? heroItems[sectionIndex % heroItems.length];
      pages.push({
        kind: "spotlight",
        key: `${s.id}:spotlight`,
        sectionId: s.id,
        sectionName: s.name,
        item,
      });
    }
  });

  return pages;
}
