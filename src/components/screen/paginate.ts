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
