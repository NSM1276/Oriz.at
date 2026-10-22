// What goes on the printed menu, as plain data. No PDF code here, so it is unit-tested.
//
// Printing rules (see also doc.ts):
//  • The paper menu is the standing menu: dishes marked "ausverkauft" are printed too —
//    that switch is for today, not for the next months of a laminated sheet.
//  • An allergen is printed only when the owner entered it. No entry prints nothing,
//    never "allergen-free".
//  • Prices: one price, several sizes, or none (e.g. "Tagesgericht, fragen Sie uns").
//  • No page numbers ("Seite 3 von 8"): adding a page in the middle would change every
//    later page and force a reprint of the whole folder. A "Stand" date goes on each page instead.

import { buildSections, usedAllergens, type AllergenCode, type GuestItem, type RawItem, type RawSection } from "../guest-menu.ts";
import { ALLERGEN_LABELS } from "../allergens.ts";
import { allergenName } from "../menu-i18n.ts";
import { formatPrice } from "../format.ts";

export type PrintPrice = { label: string | null; price: string };
export type PrintItem = {
  name: string;
  text: string | null;
  /** "A, C, G" or null when the owner entered nothing. */
  allergens: string | null;
  diet: string | null;
  prices: PrintPrice[];
};
export type PrintSection = { id: string; name: string; items: PrintItem[] };

export type PrintUi = {
  stand: string;
  online: string;
  allergens: string;
};

export type PrintModel = {
  locale: string;
  venueName: string;
  about: string | null;
  sections: PrintSection[];
  legend: { code: string; name: string }[];
  standDate: string;
  menuUrl: string;
  ui: PrintUi;
};

const UI: Record<string, PrintUi & { vegan: string; vegetarian: string; dateTag: string }> = {
  de: { stand: "Stand", online: "Aktuelle Karte online, mit Fotos und Allergenen", allergens: "Allergene", vegan: "vegan", vegetarian: "vegetarisch", dateTag: "de-AT" },
  en: { stand: "As of", online: "Current menu online, with photos and allergens", allergens: "Allergens", vegan: "vegan", vegetarian: "vegetarian", dateTag: "en-GB" },
  it: { stand: "Aggiornato al", online: "Menu aggiornato online, con foto e allergeni", allergens: "Allergeni", vegan: "vegano", vegetarian: "vegetariano", dateTag: "it-IT" },
  uk: { stand: "Станом на", online: "Актуальне меню онлайн, з фото та алергенами", allergens: "Алергени", vegan: "веган", vegetarian: "вегетаріанське", dateTag: "uk-UA" },
};

/** The language to print: German unless the venue offers the requested one. */
export function printLocale(requested: string | null | undefined, enabled: string[] | null | undefined): string {
  const want = (requested ?? "").trim().toLowerCase();
  return want && want !== "de" && (enabled ?? []).includes(want) && UI[want] ? want : "de";
}

/** The locale tag used to write dates ("de-AT", "en-GB", …). */
export function dateTagFor(locale: string): string {
  return (UI[locale] ?? UI.de).dateTag;
}

export function standDate(now: Date, locale: string): string {
  const tag = (UI[locale] ?? UI.de).dateTag;
  return new Intl.DateTimeFormat(tag, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Vienna" }).format(now);
}

function priceLines(item: GuestItem, currency: string): PrintPrice[] {
  if (item.variants.length > 0) return item.variants.map((v) => ({ label: v.label, price: formatPrice(v.priceCents, currency) }));
  if (item.priceCents > 0) return [{ label: null, price: formatPrice(item.priceCents, currency) }];
  return [];
}

/** The allergen legend for just these sections (a sheet taken out of a folder lists only what is on it). */
export function legendFor(sections: PrintSection[], locale: string): { code: string; name: string }[] {
  const used = new Set<string>();
  for (const s of sections) for (const it of s.items) for (const c of (it.allergens ?? "").split(",")) if (c.trim()) used.add(c.trim());
  return (Object.keys(ALLERGEN_LABELS) as string[])
    .filter((code) => used.has(code))
    .map((code) => ({ code, name: allergenName(code, locale, ALLERGEN_LABELS[code]) }));
}

export type PrintSource = {
  venue: { name: string; slug: string; about: string | null; currency: string; enabled_locales?: string[] | null; translations?: Record<string, { about?: string }> | null };
  sections: (RawSection & { items: RawItem[] })[];
};

export function buildPrintModel(source: PrintSource, requestedLocale: string | null | undefined, now: Date): PrintModel {
  const locale = printLocale(requestedLocale, source.venue.enabled_locales);
  const ui = UI[locale];
  const currency = source.venue.currency || "EUR";

  const rawSections: RawSection[] = source.sections.map(({ items: _items, ...s }) => s);
  const rawItems: RawItem[] = source.sections.flatMap((s) => s.items);
  // Every dish, available or not: see the rules at the top.
  const sections = buildSections(rawSections, rawItems, locale, null);

  const about = locale === "de" ? source.venue.about : source.venue.translations?.[locale]?.about ?? source.venue.about;

  return {
    locale,
    venueName: source.venue.name,
    about: about?.trim() || null,
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      items: s.items.map((it) => ({
        name: it.name,
        text: it.text,
        allergens: it.allergens && it.allergens.length > 0 ? it.allergens.join(", ") : null,
        diet: it.diet.has("vegan") ? ui.vegan : it.diet.has("vegetarisch") ? ui.vegetarian : null,
        prices: priceLines(it, currency),
      })),
    })),
    legend: usedAllergens(sections).map((code: AllergenCode) => ({ code, name: allergenName(code, locale, ALLERGEN_LABELS[code]) })),
    standDate: standDate(now, locale),
    menuUrl: `https://oriz.at/${source.venue.slug}`,
    ui: { stand: ui.stand, online: ui.online, allergens: ui.allergens },
  };
}
