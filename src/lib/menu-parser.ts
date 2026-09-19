// Turns a pasted menu into structured lines. No runtime imports — unit-tested.
//
// The rules are deliberately simple and predictable rather than clever: the
// operator reviews and fixes the result in a table before anything is saved.
// The one promise the parser must keep is that it never drops a line silently.

export type ParsedLine =
  | { kind: "section"; name: string; raw: string }
  | { kind: "item"; name: string; priceCents: number; raw: string }
  | { kind: "description"; text: string; raw: string };

// name … optional dot leaders … optional €, the number, optional € / EUR
// The number must end the line, so "Guinness 0,25l" is not read as a price.
const PRICE_LINE =
  /^(.*?)[\s.·•…_-]*(?:€|EUR)?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR|eur)?\.?$/u;

export function parsePriceCents(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Parses pasted menu text into sections, items and descriptions. */
export function parseMenuText(text: string): ParsedLine[] {
  const out: ParsedLine[] = [];
  let lastWasItem = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const raw = rawLine.trim();
    if (raw === "") {
      // A blank line ends an item's block, so the next plain line reads as a
      // heading again rather than as a stray description.
      lastWasItem = false;
      continue;
    }

    const m = raw.match(PRICE_LINE);
    const name = m?.[1]?.replace(/[\s.·•…_-]+$/u, "").trim() ?? "";
    const cents = m ? parsePriceCents(m[2]) : null;

    if (m && cents !== null && name !== "") {
      out.push({ kind: "item", name, priceCents: cents, raw });
      lastWasItem = true;
      continue;
    }

    // No price on this line. Right after an item it is that item's description;
    // otherwise it introduces a new section.
    if (lastWasItem) {
      out.push({ kind: "description", text: raw, raw });
    } else {
      out.push({ kind: "section", name: raw, raw });
    }
    lastWasItem = false;
  }

  return out;
}

export type ImportSection = {
  name: string;
  items: { name: string; price_cents: number; description: string | null }[];
};

/** Folds reviewed lines into the shape the import endpoint accepts.
 *  Items before any heading land in a section named `fallbackSection`. */
export function linesToSections(lines: ParsedLine[], fallbackSection = "Speisekarte"): ImportSection[] {
  const sections: ImportSection[] = [];
  let current: ImportSection | null = null;

  for (const line of lines) {
    if (line.kind === "section") {
      current = { name: line.name, items: [] };
      sections.push(current);
      continue;
    }
    if (line.kind === "item") {
      if (!current) {
        current = { name: fallbackSection, items: [] };
        sections.push(current);
      }
      current.items.push({ name: line.name, price_cents: line.priceCents, description: null });
      continue;
    }
    // description → attaches to the item above it, if there is one
    const last = current?.items.at(-1);
    if (last) last.description = last.description ? `${last.description} ${line.text}` : line.text;
  }

  return sections.filter((s) => s.items.length > 0);
}
