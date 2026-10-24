import type { Item, Section, Venue } from "@/lib/supabase/types";
import { ALLERGEN_EXTRA, UI_EXTRA } from "./menu-i18n-extra.ts";

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
  share: string;
  map: string;
  call: string;
  info: string;
  menu: string;
  close: string;
  language: string;
  search: string;
  searchPlaceholder: string;
  filter: string;
  diet: string;
  vegan: string;
  vegetarian: string;
  avoid: string;
  avoidHint: string;
  /** [one, other]; "{n}" is replaced with the count. */
  hiddenUnknown: [string, string];
  showUnknown: string;
  allergenUnknown: string;
  allergenNone: string;
  results: [string, string];
  noResults: string;
  reset: string;
  done: string;
  from: string;
  sections: string;
  textSize: string;
};

const UI: Record<string, UiStrings> = {
  de: {
    allergens: "Allergene",
    notAvailable: "Nicht verfügbar",
    currentlyNotAvailable: "Derzeit nicht verfügbar",
    share: "Teilen",
    map: "Karte",
    call: "Anrufen",
    info: "Info",
    menu: "Speisekarte",
    close: "Schließen",
    language: "Sprache",
    search: "Suchen",
    searchPlaceholder: "Gericht oder Zutat",
    filter: "Filter",
    diet: "Ernährung",
    vegan: "Vegan",
    vegetarian: "Vegetarisch",
    avoid: "Ohne",
    avoidHint: "Gerichte mit diesen Allergenen ausblenden.",
    hiddenUnknown: ["1 Gericht ohne Allergenangaben ausgeblendet.", "{n} Gerichte ohne Allergenangaben ausgeblendet."],
    showUnknown: "Trotzdem zeigen",
    allergenUnknown: "Keine Allergenangaben — bitte beim Personal nachfragen.",
    allergenNone: "Enthält laut Lokal keines der 14 Hauptallergene.",
    results: ["1 Gericht", "{n} Gerichte"],
    noResults: "Nichts gefunden.",
    reset: "Zurücksetzen",
    done: "Fertig",
    from: "ab",
    sections: "Bereiche",
    textSize: "Schriftgröße",
  },
  en: {
    allergens: "Allergens",
    notAvailable: "Not available",
    currentlyNotAvailable: "Currently not available",
    share: "Share",
    map: "Map",
    call: "Call",
    info: "Info",
    menu: "Menu",
    close: "Close",
    language: "Language",
    search: "Search",
    searchPlaceholder: "Dish or ingredient",
    filter: "Filter",
    diet: "Diet",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    avoid: "Without",
    avoidHint: "Hide dishes containing these allergens.",
    hiddenUnknown: ["1 dish without allergen information hidden.", "{n} dishes without allergen information hidden."],
    showUnknown: "Show anyway",
    allergenUnknown: "No allergen information — please ask the staff.",
    allergenNone: "Contains none of the 14 major allergens, according to the restaurant.",
    results: ["1 dish", "{n} dishes"],
    noResults: "Nothing found.",
    reset: "Reset",
    done: "Done",
    from: "from",
    sections: "Sections",
    textSize: "Text size",
  },
  it: {
    allergens: "Allergeni",
    notAvailable: "Non disponibile",
    currentlyNotAvailable: "Al momento non disponibile",
    share: "Condividi",
    map: "Mappa",
    call: "Chiama",
    info: "Info",
    menu: "Menu",
    close: "Chiudi",
    language: "Lingua",
    search: "Cerca",
    searchPlaceholder: "Piatto o ingrediente",
    filter: "Filtri",
    diet: "Dieta",
    vegan: "Vegano",
    vegetarian: "Vegetariano",
    avoid: "Senza",
    avoidHint: "Nascondi i piatti con questi allergeni.",
    hiddenUnknown: ["1 piatto senza indicazione degli allergeni nascosto.", "{n} piatti senza indicazione degli allergeni nascosti."],
    showUnknown: "Mostra comunque",
    allergenUnknown: "Nessuna indicazione sugli allergeni — chiedere al personale.",
    allergenNone: "Secondo il ristorante non contiene nessuno dei 14 allergeni principali.",
    results: ["1 piatto", "{n} piatti"],
    noResults: "Nessun risultato.",
    reset: "Azzera",
    done: "Fatto",
    from: "da",
    sections: "Sezioni",
    textSize: "Dimensione testo",
  },
  uk: {
    allergens: "Алергени",
    notAvailable: "Немає в наявності",
    currentlyNotAvailable: "Наразі недоступно",
    share: "Поділитися",
    map: "Карта",
    call: "Подзвонити",
    info: "Інфо",
    menu: "Меню",
    close: "Закрити",
    language: "Мова",
    search: "Пошук",
    searchPlaceholder: "Страва або інгредієнт",
    filter: "Фільтри",
    diet: "Харчування",
    vegan: "Веган",
    vegetarian: "Вегетаріанське",
    avoid: "Без",
    avoidHint: "Сховати страви з цими алергенами.",
    hiddenUnknown: ["Сховано страв без даних про алергени: 1.", "Сховано страв без даних про алергени: {n}."],
    showUnknown: "Показати все одно",
    allergenUnknown: "Немає даних про алергени — запитайте в персоналу.",
    allergenNone: "За даними закладу не містить жодного з 14 основних алергенів.",
    results: ["Страв: 1", "Страв: {n}"],
    noResults: "Нічого не знайдено.",
    reset: "Скинути",
    done: "Готово",
    from: "від",
    sections: "Розділи",
    textSize: "Розмір тексту",
  },
  ...UI_EXTRA,
};

/** Locales the guest menu has interface texts for. */
export const UI_LOCALES: readonly string[] = Object.keys(UI);

/** Picks the singular or plural form and fills in the count. */
export function count([one, other]: [string, string], n: number): string {
  return (n === 1 ? one : other).replace("{n}", String(n));
}

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
  ...ALLERGEN_EXTRA,
};

/** Localized allergen name for a code; `fallback` is the German label from `ALLERGEN_LABELS`. */
export function allergenName(code: string, locale: string, fallback: string): string {
  if (locale === BASE_LOCALE) return fallback;
  return ALLERGEN_NAMES[locale]?.[code.toUpperCase()] ?? fallback;
}
