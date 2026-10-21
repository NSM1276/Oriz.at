// The guest menu's data layer: one normalized shape for all three looks,
// plus search and filters. No runtime imports — unit-tested.
//
// Honesty rules the UI relies on:
//  • An allergen is only "absent" when the owner declared the dish's allergens.
//    A dish with nothing entered is "unknown", never "free of".
//  • Diet labels come only from tags the owner set, never from guessing.
//  • A filter chip is offered only when it would change what the guest sees.

export const ALLERGEN_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "L", "M", "N", "O", "P", "R"] as const;
export type AllergenCode = (typeof ALLERGEN_CODES)[number];

// Words owners actually type (German first, a few English), → EU/Austrian code.
const ALLERGEN_WORDS: [RegExp, AllergenCode][] = [
  [/^(gluten|weizen|roggen|gerste|hafer|dinkel|wheat)/, "A"],
  [/^(krebs|krusten|schalentier|garnele|shrimp|crustacean|hummer|languste)/, "B"],
  [/^(ei|eier|eigelb|eiweiß|eiweiss|egg|eggs)$/, "C"],
  [/^(fisch|fish)/, "D"],
  [/^(erdnuss|erdnüss|peanut)/, "E"],
  [/^(soja|soy)/, "F"],
  [/^(milch|laktose|lactose|milk|dairy)/, "G"],
  [/^(nuss|nüsse|schalenfr|haselnuss|walnuss|mandel|nut|tree nut)/, "H"],
  [/^(sellerie|celery)/, "L"],
  [/^(senf|mustard)/, "M"],
  [/^(sesam|sesame)/, "N"],
  [/^(sulfit|schwefel|sulphite|sulfite)/, "O"],
  [/^(lupin)/, "P"],
  [/^(weichtier|muschel|mollus|tintenfisch|oktopus|schnecke)/, "R"],
];

const NONE_MARKERS = new Set(["-", "–", "—", "0", "keine", "kein", "none", "/"]);

/**
 * The dish's allergen codes, in A–R order.
 * `null` = nothing entered (unknown); `[]` = declared free of the 14.
 */
export function parseAllergens(raw: string | null | undefined): AllergenCode[] | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  if (NONE_MARKERS.has(text.toLowerCase())) return [];

  const found = new Set<AllergenCode>();
  for (const token of text.split(/[,;/+|]|\s+und\s+|\s+&\s+/i)) {
    const t = token.trim().toLowerCase().replace(/[().]/g, "");
    if (!t) continue;
    if (/^[a-r]$/i.test(t) && (ALLERGEN_CODES as readonly string[]).includes(t.toUpperCase())) {
      found.add(t.toUpperCase() as AllergenCode);
      continue;
    }
    // "A G" written with spaces only
    if (/^([a-r]\s+)+[a-r]$/i.test(t)) {
      for (const c of t.split(/\s+/)) if ((ALLERGEN_CODES as readonly string[]).includes(c.toUpperCase())) found.add(c.toUpperCase() as AllergenCode);
      continue;
    }
    const hit = ALLERGEN_WORDS.find(([re]) => re.test(t));
    if (hit) found.add(hit[1]);
  }
  // Text that names nothing we recognise is still not a declaration of "none".
  if (found.size === 0) return null;
  return ALLERGEN_CODES.filter((c) => found.has(c));
}

export type DietTag = "vegan" | "vegetarisch";

/** Diet tags as stored by the old admin: an array, a JSON array string, or a comma list. */
export function parseDiet(raw: unknown): Set<DietTag> {
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      list = raw.split(",");
    }
  }
  const tags = new Set<DietTag>();
  for (const v of list) {
    const t = String(v).trim().toLowerCase();
    if (t === "vegan") { tags.add("vegan"); tags.add("vegetarisch"); }
    if (t === "vegetarisch" || t === "vegetarian") tags.add("vegetarisch");
  }
  return tags;
}

export type PriceVariant = { label: string; priceCents: number };

export const VARIANT_LABEL_MAX = 30;
export const VARIANTS_MAX = 6;

/** Stored variants (jsonb), validated; anything malformed is dropped. */
export function parseVariants(raw: unknown): PriceVariant[] {
  if (!Array.isArray(raw)) return [];
  const out: PriceVariant[] = [];
  for (const v of raw) {
    const label = typeof v?.label === "string" ? v.label.trim().slice(0, VARIANT_LABEL_MAX) : "";
    const cents = v?.price_cents;
    if (!label || typeof cents !== "number" || !Number.isInteger(cents) || cents < 0) continue;
    out.push({ label, priceCents: cents });
    if (out.length === VARIANTS_MAX) break;
  }
  return out;
}

/**
 * Owner shorthand → variants: "0,3 l 3,90; 0,5 l 4,90" or one per line.
 * The price is the last number of each part. Returns null when a part has no price.
 */
export function parseVariantText(text: string): PriceVariant[] | null {
  const parts = text.split(/[;\n]+/).map((p) => p.trim()).filter(Boolean);
  const out: PriceVariant[] = [];
  for (const part of parts) {
    const m = part.match(/^(.*?)[\s:=·–-]*(?:€\s*)?(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|eur)?$/i);
    if (!m || !m[1].trim()) return null;
    out.push({ label: m[1].trim().slice(0, VARIANT_LABEL_MAX), priceCents: Math.round(Number(m[2].replace(",", ".")) * 100) });
  }
  return out.slice(0, VARIANTS_MAX);
}

// ── Normalized menu ────────────────────────────────────────────────────────

type RawTranslation = { name?: string; description?: string };
export type RawItem = {
  id: string;
  section_id: string;
  name: string;
  description: string | null;
  ai_caption: string | null;
  price_cents: number;
  price_variants?: unknown;
  image_url: string | null;
  allergens: string | null;
  diet_tags?: unknown;
  is_active: boolean;
  position: number;
  translations?: Record<string, RawTranslation> | null;
};
export type RawSection = {
  id: string;
  name: string;
  position: number;
  menu_id?: string | null;
  translations?: Record<string, { name?: string }> | null;
};

export type GuestItem = {
  id: string;
  sectionId: string;
  name: string;
  /** The line under the name. */
  text: string | null;
  /** A longer story for the detail sheet, only when it adds something. */
  story: string | null;
  priceCents: number;
  variants: PriceVariant[];
  imageUrl: string | null;
  /** null = the owner entered nothing; [] = declared free of the 14. */
  allergens: AllergenCode[] | null;
  diet: Set<DietTag>;
  available: boolean;
};
export type GuestSection = { id: string; name: string; items: GuestItem[] };

const BASE_LOCALE = "de";

export function toGuestItem(item: RawItem, locale: string): GuestItem {
  const tr = locale === BASE_LOCALE ? undefined : item.translations?.[locale];
  const baseText = item.description?.trim() || item.ai_caption?.trim() || null;
  // The caption is extra prose next to a short description; it is only shown
  // in German or when the owner translated it as the dish text.
  const caption = item.ai_caption?.trim() || null;
  const story = locale === BASE_LOCALE && caption && caption !== baseText ? caption : null;
  return {
    id: item.id,
    sectionId: item.section_id,
    name: tr?.name?.trim() || item.name,
    text: tr?.description?.trim() || baseText,
    story,
    priceCents: item.price_cents,
    variants: parseVariants(item.price_variants),
    imageUrl: item.image_url,
    allergens: parseAllergens(item.allergens),
    diet: parseDiet(item.diet_tags),
    available: item.is_active,
  };
}

/** Sections of the chosen menu (null menu_id = in every menu), localized, empty ones dropped. */
export function buildSections(
  sections: RawSection[],
  items: RawItem[],
  locale: string,
  menuId: string | null,
): GuestSection[] {
  return sections
    .filter((s) => !menuId || s.menu_id == null || s.menu_id === menuId)
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      id: s.id,
      name: (locale !== BASE_LOCALE && s.translations?.[locale]?.name?.trim()) || s.name,
      items: items
        .filter((it) => it.section_id === s.id)
        .sort((a, b) => a.position - b.position)
        .map((it) => toGuestItem(it, locale)),
    }))
    .filter((s) => s.items.length > 0);
}

// ── Search ────────────────────────────────────────────────────────────────

/** Lowercase, no accents, umlauts folded both ways: "Käse", "Kaese" and "kase" match. */
export function foldForSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9а-яёіїєґ]+/g, " ")
    .trim();
}

function matches(item: GuestItem, sectionName: string, tokens: string[]): boolean {
  const hay = foldForSearch(`${item.name} ${item.text ?? ""} ${sectionName}`);
  return tokens.every((t) => hay.includes(t));
}

// ── Filters ───────────────────────────────────────────────────────────────

export type MenuFilter = { query: string; diet: Set<DietTag>; avoid: Set<AllergenCode>; includeUnknown: boolean };

export const EMPTY_FILTER: MenuFilter = { query: "", diet: new Set(), avoid: new Set(), includeUnknown: false };

export function filterActive(f: MenuFilter): boolean {
  return f.query.trim() !== "" || f.diet.size > 0 || f.avoid.size > 0;
}

export const AVOID_MIN_DECLARED_SHARE = 0.4;

export type FilterOptions = {
  diet: { tag: DietTag; count: number }[];
  /** Allergens that at least one declared dish contains — only those can be avoided meaningfully. */
  avoid: AllergenCode[];
  declared: number;
  total: number;
};

export function filterOptions(sections: GuestSection[]): FilterOptions {
  const items = sections.flatMap((s) => s.items);
  const diet = (["vegetarisch", "vegan"] as const)
    .map((tag) => ({ tag, count: items.filter((it) => it.diet.has(tag)).length }))
    // A chip that matches every dish or none would not change anything.
    .filter((d) => d.count > 0 && d.count < items.length);
  const present = new Set(items.flatMap((it) => it.allergens ?? []));
  const declared = items.filter((it) => it.allergens !== null).length;
  // When most dishes have no allergen data, "without X" would mostly hide the
  // menu and help nobody; the chips only appear once the data is there.
  const enoughData = items.length > 0 && declared / items.length >= AVOID_MIN_DECLARED_SHARE;
  return {
    diet,
    avoid: enoughData ? ALLERGEN_CODES.filter((c) => present.has(c)) : [],
    declared,
    total: items.length,
  };
}

export type FilterResult = { sections: GuestSection[]; matched: number; hiddenUnknown: number };

export function applyFilter(sections: GuestSection[], f: MenuFilter): FilterResult {
  const tokens = foldForSearch(f.query).split(" ").filter(Boolean);
  let matched = 0;
  let hiddenUnknown = 0;
  const out = sections
    .map((s) => ({
      ...s,
      items: s.items.filter((it) => {
        if (tokens.length && !matches(it, s.name, tokens)) return false;
        for (const tag of f.diet) if (!it.diet.has(tag)) return false;
        if (f.avoid.size > 0) {
          if (it.allergens === null) {
            if (!f.includeUnknown) { hiddenUnknown++; return false; }
          } else if (it.allergens.some((c) => f.avoid.has(c))) {
            return false;
          }
        }
        matched++;
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);
  return { sections: out, matched, hiddenUnknown };
}

/** Allergen codes used anywhere on the menu, for the legend Austrian menus must print. */
export function usedAllergens(sections: GuestSection[]): AllergenCode[] {
  const used = new Set(sections.flatMap((s) => s.items.flatMap((it) => it.allergens ?? [])));
  return ALLERGEN_CODES.filter((c) => used.has(c));
}
