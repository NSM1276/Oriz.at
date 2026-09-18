import type { Item, Section, Venue } from "@/lib/supabase/types";

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

/** Venue tagline ("about") in the requested locale, falling back to German. */
export function localizeAbout(venue: Venue, locale: string): string | null {
  if (locale === BASE_LOCALE) return venue.about;
  return venue.translations?.[locale]?.about ?? venue.about;
}

// ── UI chrome strings (labels around the content, not the content itself) ──

type UiStrings = {
  allergens: string;
  notAvailable: string;
  currentlyNotAvailable: string;
  noDescription: string;
  share: string;
  map: string;
  call: string;
  info: string;
  menu: string;
  close: string;
  language: string;
  filters: { alcohol: string; vegan: string; vegetarian: string; glutenFree: string };
};

const UI: Record<string, UiStrings> = {
  de: {
    allergens: "Allergene",
    notAvailable: "Nicht verfügbar",
    currentlyNotAvailable: "Derzeit nicht verfügbar",
    noDescription: "Keine Beschreibung verfügbar.",
    share: "Teilen",
    map: "Karte",
    call: "Anrufen",
    info: "Info",
    menu: "Speisekarte",
    close: "Schließen",
    language: "Sprache",
    filters: { alcohol: "Alkohol", vegan: "Vegan", vegetarian: "Vegetarisch", glutenFree: "Glutenfrei" },
  },
  en: {
    allergens: "Allergens",
    notAvailable: "Not available",
    currentlyNotAvailable: "Currently not available",
    noDescription: "No description available.",
    share: "Share",
    map: "Map",
    call: "Call",
    info: "Info",
    menu: "Menu",
    close: "Close",
    language: "Language",
    filters: { alcohol: "Alcohol", vegan: "Vegan", vegetarian: "Vegetarian", glutenFree: "Gluten-free" },
  },
  it: {
    allergens: "Allergeni",
    notAvailable: "Non disponibile",
    currentlyNotAvailable: "Al momento non disponibile",
    noDescription: "Nessuna descrizione disponibile.",
    share: "Condividi",
    map: "Mappa",
    call: "Chiama",
    info: "Info",
    menu: "Menu",
    close: "Chiudi",
    language: "Lingua",
    filters: { alcohol: "Alcol", vegan: "Vegano", vegetarian: "Vegetariano", glutenFree: "Senza glutine" },
  },
  uk: {
    allergens: "Алергени",
    notAvailable: "Немає в наявності",
    currentlyNotAvailable: "Наразі недоступно",
    noDescription: "Опис відсутній.",
    share: "Поділитися",
    map: "Карта",
    call: "Подзвонити",
    info: "Інфо",
    menu: "Меню",
    close: "Закрити",
    language: "Мова",
    filters: { alcohol: "Алкоголь", vegan: "Веган", vegetarian: "Вегетаріанське", glutenFree: "Без глютену" },
  },
};

export function ui(locale: string): UiStrings {
  return UI[locale] ?? UI[BASE_LOCALE];
}

// ── Allergen names per locale (EU/Austrian letter codes A–R) ──

const ALLERGEN_NAMES: Record<string, Record<string, string>> = {
  en: {
    A: "Gluten", B: "Crustaceans", C: "Eggs", D: "Fish", E: "Peanuts", F: "Soy", G: "Milk",
    H: "Tree nuts", L: "Celery", M: "Mustard", N: "Sesame", O: "Sulphites", P: "Lupin", R: "Molluscs",
  },
  it: {
    A: "Glutine", B: "Crostacei", C: "Uova", D: "Pesce", E: "Arachidi", F: "Soia", G: "Latte",
    H: "Frutta a guscio", L: "Sedano", M: "Senape", N: "Sesamo", O: "Solfiti", P: "Lupini", R: "Molluschi",
  },
  uk: {
    A: "Глютен", B: "Ракоподібні", C: "Яйця", D: "Риба", E: "Арахіс", F: "Соя", G: "Молоко",
    H: "Горіхи", L: "Селера", M: "Гірчиця", N: "Кунжут", O: "Сульфіти", P: "Люпин", R: "Молюски",
  },
};

/** Localized allergen name for a code; `fallback` is the German label from `ALLERGEN_LABELS`. */
export function allergenName(code: string, locale: string, fallback: string): string {
  if (locale === BASE_LOCALE) return fallback;
  return ALLERGEN_NAMES[locale]?.[code.toUpperCase()] ?? fallback;
}
