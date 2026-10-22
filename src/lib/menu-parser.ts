// Turns a pasted menu into structured lines. No runtime imports — unit-tested.
//
// The rules are deliberately simple and predictable rather than clever: the
// operator reviews and fixes the result in a table before anything is saved.
// The one promise the parser must keep is that it never drops a line silently —
// whatever it cannot place comes back in `skipped` so the preview can show it.

export type Variant = { label: string; price_cents: number };

export type ParsedLine =
  | { kind: "section"; name: string; raw: string; block: number }
  | { kind: "item"; name: string; priceCents: number; raw: string; block: number; variants?: Variant[] }
  | { kind: "description"; text: string; raw: string; block: number };

// name … optional dot leaders … optional €, the number, optional € / EUR
// The number must end the line, so "Guinness 0,25l" is not read as a price.
const PRICE_LINE =
  /^(.*?)[\s.·•…_-]*(?:€|EUR)?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR|eur)?\.?$/u;

// A size or portion written at the end of a dish name: "0,3 l", "0,25l", "200 g", "klein".
const SIZE = String.raw`(?:\d+(?:[.,/]\d+)?\s?(?:l|cl|ml|dl|g|kg|cm|stk\.?)|klein|mittel|groß|gross|small|medium|large)`;
const NAME_WITH_SIZE = new RegExp(String.raw`^(.*?)\s+(${SIZE})$`, "iu");
// "0,3 l 3,90 / 0,5 l 4,90" — several size/price pairs on one line.
const SIZE_PRICE_PAIR = new RegExp(String.raw`(${SIZE})\s*(?:€\s*)?(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)?`, "giu");

export function parsePriceCents(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** "Hausbier 0,3 l 3,90 / 0,5 l 4,90" → name + two sizes; null when the line is not like that. */
function multiSizeLine(raw: string): { name: string; variants: Variant[] } | null {
  const pairs = [...raw.matchAll(SIZE_PRICE_PAIR)];
  if (pairs.length < 2) return null;
  const name = raw.slice(0, pairs[0].index).replace(/[\s.·•…_:–-]+$/u, "").trim();
  // Everything after the name must be pairs and separators, nothing else.
  const rest = raw.slice(pairs[0].index).replace(SIZE_PRICE_PAIR, "").replace(/[\s/|;,·•–-]+/gu, "");
  if (!name || rest !== "") return null;
  const variants: Variant[] = [];
  for (const p of pairs) {
    const cents = parsePriceCents(p[2]);
    if (cents === null) return null;
    variants.push({ label: p[1].replace(/\s+/g, " "), price_cents: cents });
  }
  return { name, variants };
}

/** Parses pasted menu text into sections, items and descriptions. */
export function parseMenuText(text: string): ParsedLine[] {
  const out: ParsedLine[] = [];
  let lastWasItem = false;
  let block = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const raw = rawLine.trim();
    if (raw === "") {
      // A blank line ends an item's block, so the next plain line reads as a
      // heading again rather than as a stray description.
      if (out.length && out[out.length - 1].block === block) block++;
      lastWasItem = false;
      continue;
    }

    const multi = multiSizeLine(raw);
    if (multi) {
      const cheapest = Math.min(...multi.variants.map((v) => v.price_cents));
      out.push({ kind: "item", name: multi.name, priceCents: cheapest, raw, block, variants: multi.variants });
      lastWasItem = true;
      continue;
    }

    const m = raw.match(PRICE_LINE);
    const name = m?.[1]?.replace(/[\s.·•…_-]+$/u, "").trim() ?? "";
    const cents = m ? parsePriceCents(m[2]) : null;

    if (m && cents !== null && name !== "") {
      out.push({ kind: "item", name, priceCents: cents, raw, block });
      lastWasItem = true;
      continue;
    }

    // No price on this line. Right after an item it is that item's description;
    // otherwise it introduces a new section.
    if (lastWasItem) {
      out.push({ kind: "description", text: raw, raw, block });
    } else {
      out.push({ kind: "section", name: raw, raw, block });
    }
    lastWasItem = false;
  }

  return out;
}

export type ImportItem = {
  name: string;
  price_cents: number;
  description: string | null;
  /** Allergen letters as the guest menu prints them ("A, C, G"), or null when none were written. */
  allergens: string | null;
  /** Only what the text says outright: "vegan" / "vegetarisch". */
  diet: ("vegan" | "vegetarisch")[];
  variants: Variant[];
  /** A dish line without any price ("Tagesgericht — fragen Sie unser Personal"). */
  priceless: boolean;
};

export type ImportSection = { name: string; items: ImportItem[] };

export type ImportResult = {
  sections: ImportSection[];
  /** Lines that ended up nowhere (a lone heading with nothing under it); shown in the preview. */
  skipped: string[];
};

// "(A, C, G)", "[A,G]", "Allergene: A C G" — only the 14 EU letters count.
const ALLERGEN_GROUP = /\s*(?:\(\s*|\[\s*|\ballergene?:?\s*)([A-HL-PR](?:\s*[,;\s]\s*[A-HL-PR])*)\s*[)\]]?\s*$/iu;
const ALLERGEN_INLINE = /\s*\(\s*([A-HL-PR](?:\s*[,;\s]\s*[A-HL-PR])*)\s*\)/u;

function takeAllergens(text: string): { text: string; codes: string[] } {
  const m = text.match(ALLERGEN_GROUP) ?? text.match(ALLERGEN_INLINE);
  if (!m) return { text, codes: [] };
  const codes = [...new Set(m[1].toUpperCase().split(/[\s,;]+/).filter(Boolean))];
  return { text: (text.slice(0, m.index) + text.slice(m.index! + m[0].length)).replace(/\s{2,}/g, " ").trim(), codes };
}

// "vegan" written next to a dish, but not "vegane Option auf Anfrage".
function takeDiet(text: string): { text: string; diet: ("vegan" | "vegetarisch")[] } {
  if (/auf anfrage|option|möglich|on request/iu.test(text)) return { text, diet: [] };
  const vegan = /\(?\b(vegan)\b\)?/iu;
  const veggie = /\(?\b(vegetarisch|vegetarian|veggie)\b\)?/iu;
  const strip = (re: RegExp) => text.replace(re, "").replace(/\s{2,}/g, " ").replace(/^[\s,;·–-]+|[\s,;·–-]+$/gu, "").trim();
  if (vegan.test(text)) return { text: strip(vegan), diet: ["vegan"] };
  if (veggie.test(text)) return { text: strip(veggie), diet: ["vegetarisch"] };
  return { text, diet: [] };
}

const ALLERGEN_ORDER = "ABCDEFGHLMNOPR";

function enrich(item: ImportItem): ImportItem {
  let name = item.name;
  let description = item.description;
  const codes = new Set<string>();
  const diet = new Set(item.diet);

  for (const field of ["name", "description"] as const) {
    let value = field === "name" ? name : description;
    if (!value) continue;
    const a = takeAllergens(value);
    a.codes.forEach((c) => codes.add(c));
    const d = takeDiet(a.text);
    d.diet.forEach((t) => diet.add(t));
    value = d.text;
    if (field === "name") name = value || name;
    else description = value || null;
  }

  const sorted = [...codes].sort((x, y) => ALLERGEN_ORDER.indexOf(x) - ALLERGEN_ORDER.indexOf(y));
  return {
    ...item,
    name,
    description,
    allergens: sorted.length ? sorted.join(", ") : null,
    diet: diet.has("vegan") ? ["vegan"] : diet.has("vegetarisch") ? ["vegetarisch"] : [],
  };
}

/** "Hausbier 0,3 l" then "Hausbier 0,5 l" next to each other become one dish with two sizes. */
function mergeSizes(items: ImportItem[]): ImportItem[] {
  const out: ImportItem[] = [];
  for (const item of items) {
    const m = item.variants.length === 0 && !item.priceless ? item.name.match(NAME_WITH_SIZE) : null;
    const prev = out[out.length - 1];
    if (m && prev) {
      const base = m[1].trim();
      const prevBase = prev.variants.length
        ? prev.name
        : prev.name.match(NAME_WITH_SIZE)?.[1]?.trim();
      if (prevBase && prevBase.toLowerCase() === base.toLowerCase()) {
        if (prev.variants.length === 0) {
          const pm = prev.name.match(NAME_WITH_SIZE)!;
          prev.variants = [{ label: pm[2], price_cents: prev.price_cents }];
          prev.name = base;
        }
        prev.variants.push({ label: m[2], price_cents: item.price_cents });
        prev.price_cents = Math.min(prev.price_cents, item.price_cents);
        prev.description = prev.description ?? item.description;
        prev.allergens = prev.allergens ?? item.allergens;
        if (item.diet.length && !prev.diet.length) prev.diet = item.diet;
        continue;
      }
    }
    out.push({ ...item, variants: [...item.variants] });
  }
  return out;
}

/**
 * Folds reviewed lines into sections. Items before any heading land in a section
 * named `fallbackSection`. A heading with nothing under it but a line of its own
 * text ("Tagesgericht" / "Fragen Sie unser Personal") is a dish without a price;
 * a lone empty heading is reported in `skipped`.
 */
export function linesToImport(lines: ParsedLine[], fallbackSection = "Speisekarte"): ImportResult {
  type Draft = { name: string; block: number; notes: string[]; items: ImportItem[] };
  const drafts: Draft[] = [];
  let current: Draft | null = null;

  for (const line of lines) {
    if (line.kind === "section") {
      // More plain lines in the same block, before any dish: they belong to that heading.
      if (current && current.block === line.block && current.items.length === 0) {
        current.notes.push(line.name);
        continue;
      }
      current = { name: line.name, block: line.block, notes: [], items: [] };
      drafts.push(current);
      continue;
    }
    if (line.kind === "item") {
      if (!current) {
        current = { name: fallbackSection, block: -1, notes: [], items: [] };
        drafts.push(current);
      }
      current.items.push({
        name: line.name,
        price_cents: line.priceCents,
        description: null,
        allergens: null,
        diet: [],
        variants: line.variants ? [...line.variants] : [],
        priceless: false,
      });
      continue;
    }
    // description → attaches to the item above it, if there is one
    const last = current?.items.at(-1);
    if (last) last.description = last.description ? `${last.description} ${line.text}` : line.text;
  }

  const sections: ImportSection[] = [];
  const skipped: string[] = [];
  for (const d of drafts) {
    if (d.items.length > 0) {
      // A subtitle under a heading ("Montag bis Freitag") has no place to go yet.
      skipped.push(...d.notes);
      sections.push({ name: d.name, items: d.items });
      continue;
    }
    if (d.notes.length > 0) {
      // Heading + its own text, nothing priced under it: a dish without a price.
      const dish: ImportItem = {
        name: d.name,
        price_cents: 0,
        description: d.notes.join(" "),
        allergens: null,
        diet: [],
        variants: [],
        priceless: true,
      };
      const target = sections.at(-1);
      if (target) target.items.push(dish);
      else sections.push({ name: fallbackSection, items: [dish] });
      continue;
    }
    skipped.push(d.name);
  }

  return {
    sections: sections.map((s) => ({ ...s, items: mergeSizes(s.items.map(enrich)) })),
    skipped,
  };
}

/** Sections only — see linesToImport for what could not be placed. */
export function linesToSections(lines: ParsedLine[], fallbackSection = "Speisekarte"): ImportSection[] {
  return linesToImport(lines, fallbackSection).sections;
}
