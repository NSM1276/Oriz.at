// What the owner's dish form sends, checked and turned into an items row.
// No runtime imports — unit-tested. The guest menu reads the same columns
// through src/lib/guest-menu.ts, so both sides agree on every format.

import { ALLERGEN_CODES, type AllergenCode, parseAllergens, parseDiet, parseVariants } from "./guest-menu.ts";

export const NAME_MAX = 200;
export const DESCRIPTION_MAX = 600;
export const STORY_MAX = 1000;
export const PRICE_MAX_CENTS = 10_000_00;
export const SIZE_LABEL_MAX = 30;
export const SIZES_MAX = 6;
export const SECTION_NAME_MAX = 80;

/** Locales the guest menu has interface texts for (German is the base). */
export const MENU_LOCALES = ["en", "it", "uk"] as const;
export type MenuLocale = (typeof MENU_LOCALES)[number];
export const LOCALE_NAMES: Record<MenuLocale, string> = { en: "Englisch", it: "Italienisch", uk: "Ukrainisch" };

export type DishForm = {
  name: string;
  description: string;
  story: string;
  price: string;
  /** Empty = one price. */
  sizes: { label: string; price: string }[];
  /** false = nothing entered yet ("keine Angabe"). */
  allergensDeclared: boolean;
  allergens: string[];
  vegetarian: boolean;
  vegan: boolean;
  available: boolean;
  translations: Record<string, { name: string; description: string }>;
};

export type DishRow = {
  name: string;
  description: string | null;
  ai_caption: string | null;
  price_cents: number;
  price_variants: { label: string; price_cents: number }[];
  allergens: string | null;
  diet_tags: string | null;
  is_active: boolean;
  translations: Record<string, { name?: string; description?: string }>;
};

/** "12", "12,5", "12.50", "€ 12,50" → cents; null when it is not a price. */
export function parsePrice(text: string): number | null {
  const t = text.replace(/€|eur/gi, "").replace(/\s+/g, "").trim();
  if (!/^\d{1,5}([.,]\d{1,2})?$/.test(t)) return null;
  const cents = Math.round(Number(t.replace(",", ".")) * 100);
  return cents <= PRICE_MAX_CENTS ? cents : null;
}

export function formatPriceInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");
const cleanText = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

/** Allergens as the guest menu prints them: "A, C, G", "–" for none, null for not entered. */
export function allergensToText(declared: boolean, codes: string[]): string | null {
  if (!declared) return null;
  const set = new Set(codes.map((c) => c.toUpperCase()));
  const valid = ALLERGEN_CODES.filter((c) => set.has(c));
  return valid.length ? valid.join(", ") : "–";
}

export type DishResult = { ok: true; row: DishRow } | { ok: false; error: string };

/**
 * Checks the form. `existingTranslations` keeps translations for languages the
 * venue switched off, so switching one back on does not lose the work.
 */
export function dishFromForm(
  form: DishForm,
  enabledLocales: string[],
  existingTranslations: DishRow["translations"] = {},
): DishResult {
  const name = clean(form.name, NAME_MAX);
  if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };

  let price_cents: number;
  let price_variants: DishRow["price_variants"] = [];
  const sizes = (form.sizes ?? []).filter((s) => clean(s.label, SIZE_LABEL_MAX) || s.price.trim());
  if (sizes.length > 0) {
    if (sizes.length > SIZES_MAX) return { ok: false, error: `Höchstens ${SIZES_MAX} Größen.` };
    for (const s of sizes) {
      const label = clean(s.label, SIZE_LABEL_MAX);
      const cents = parsePrice(s.price);
      if (!label) return { ok: false, error: "Jede Größe braucht eine Bezeichnung, z. B. „0,5 l“." };
      if (cents === null) return { ok: false, error: `Bitte einen gültigen Preis für „${label}“ eingeben.` };
      price_variants.push({ label, price_cents: cents });
    }
    if (new Set(price_variants.map((v) => v.label.toLowerCase())).size !== price_variants.length) {
      return { ok: false, error: "Zwei Größen heißen gleich." };
    }
    // The single price follows the cheapest size for lists that show one price.
    price_cents = Math.min(...price_variants.map((v) => v.price_cents));
  } else {
    const cents = parsePrice(form.price);
    if (cents === null) return { ok: false, error: "Bitte einen gültigen Preis eingeben, z. B. 12,50." };
    price_cents = cents;
    price_variants = [];
  }

  const diet = form.vegan ? ["vegan"] : form.vegetarian ? ["vegetarisch"] : [];

  const translations: DishRow["translations"] = { ...existingTranslations };
  for (const locale of enabledLocales) {
    const t = form.translations?.[locale];
    const tName = clean(t?.name, NAME_MAX);
    const tDesc = cleanText(t?.description, DESCRIPTION_MAX);
    if (tName || tDesc) translations[locale] = { ...(tName && { name: tName }), ...(tDesc && { description: tDesc }) };
    else delete translations[locale];
  }

  return {
    ok: true,
    row: {
      name,
      description: cleanText(form.description, DESCRIPTION_MAX) || null,
      ai_caption: cleanText(form.story, STORY_MAX) || null,
      price_cents,
      price_variants,
      allergens: allergensToText(form.allergensDeclared, form.allergens ?? []),
      diet_tags: diet.length ? JSON.stringify(diet) : null,
      is_active: !!form.available,
      translations,
    },
  };
}

type StoredItem = {
  name: string;
  description: string | null;
  ai_caption: string | null;
  price_cents: number;
  price_variants?: unknown;
  allergens: string | null;
  diet_tags?: unknown;
  is_active: boolean;
  translations?: Record<string, { name?: string; description?: string }> | null;
};

/** The stored row as the form shows it. */
export function formFromItem(item: StoredItem, enabledLocales: string[]): DishForm {
  const codes = parseAllergens(item.allergens);
  const diet = parseDiet(item.diet_tags);
  const translations: DishForm["translations"] = {};
  for (const l of enabledLocales) {
    translations[l] = { name: item.translations?.[l]?.name ?? "", description: item.translations?.[l]?.description ?? "" };
  }
  return {
    name: item.name,
    description: item.description ?? "",
    story: item.ai_caption ?? "",
    price: formatPriceInput(item.price_cents),
    sizes: parseVariants(item.price_variants).map((v) => ({ label: v.label, price: formatPriceInput(v.priceCents) })),
    allergensDeclared: codes !== null,
    allergens: codes ?? [],
    vegetarian: diet.has("vegetarisch"),
    vegan: diet.has("vegan"),
    available: item.is_active,
    translations,
  };
}

export const EMPTY_DISH: DishForm = {
  name: "",
  description: "",
  story: "",
  price: "",
  sizes: [],
  allergensDeclared: false,
  allergens: [],
  vegetarian: false,
  vegan: false,
  available: true,
  translations: {},
};

/** Only locales the guest menu supports, deduplicated, base excluded. */
export function cleanLocales(raw: unknown): MenuLocale[] {
  if (!Array.isArray(raw)) return [];
  return MENU_LOCALES.filter((l) => raw.includes(l));
}

export function cleanSectionName(raw: unknown): string | null {
  const name = clean(raw, SECTION_NAME_MAX);
  return name || null;
}

export type { AllergenCode };
