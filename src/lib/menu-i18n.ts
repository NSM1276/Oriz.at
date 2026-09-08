import type { Item, Section } from "@/lib/supabase/types";

/** Base/source language every menu is authored in — never stored in `enabled_locales`. */
export const BASE_LOCALE = "de";

/**
 * Guest's phone language → best locale to show, given what this venue offers.
 * Order: guest's own language (if enabled) → English (if enabled) → German (source, always available).
 */
export function resolveInitialLocale(
  acceptLanguageHeader: string | null | undefined,
  enabledLocales: string[] | null | undefined,
): string {
  const enabled = enabledLocales ?? [];
  if (acceptLanguageHeader) {
    const candidates = acceptLanguageHeader
      .split(",")
      .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
      .filter(Boolean);
    for (const code of candidates) {
      if (enabled.includes(code)) return code;
    }
  }
  if (enabled.includes("en")) return "en";
  return BASE_LOCALE;
}

/** Returns a copy of `item` with name/description swapped to `locale`, falling back to German if untranslated. */
export function localizeItem(item: Item, locale: string): Item {
  if (locale === BASE_LOCALE) return item;
  const t = item.translations?.[locale];
  if (!t) return item; // no translation for this item yet → silently keep German
  return {
    ...item,
    name: t.name ?? item.name,
    ai_caption: t.description ?? item.ai_caption,
  };
}

/** Returns a copy of `section` with its name swapped to `locale`, falling back to German if untranslated. */
export function localizeSection<T extends Section & { items: Item[] }>(
  section: T,
  locale: string,
): T {
  if (locale === BASE_LOCALE) return section;
  const translatedName = section.translations?.[locale]?.name ?? section.name;
  return {
    ...section,
    name: translatedName,
    items: section.items.map((it) => localizeItem(it, locale)),
  };
}
