// A whole menu from a table: a CSV file, an Excel sheet, or cells copied out of Excel.
// One row per dish. Produces the same shape as the pasted-text parser (menu-parser.ts), so the
// preview and the saving are shared. Like there: never drop a row silently — what cannot be
// used comes back in `skipped`. No runtime imports besides the two parsers — unit-tested.
import { parseAllergens } from "./guest-menu.ts";
import { parsePriceCents, type ImportItem, type ImportResult, type ImportSection } from "./menu-parser.ts";

export const TABLE_MAX_ROWS = 800;

/** The template owners download: opens in Excel (semicolons, as German Excel writes them). */
export const TABLE_TEMPLATE = [
  "Kategorie;Gericht;Beschreibung;Größe;Preis;Allergene",
  "Vorspeisen;Bruschetta;Geröstetes Brot mit Tomaten und Basilikum;;7,50;A",
  "Vorspeisen;Vitello Tonnato;;;14,00;C, D",
  "Hauptspeisen;Wiener Schnitzel;Mit Petersilkartoffeln und Preiselbeeren;;19,90;A, C, G",
  "Getränke;Hausbier;;0,3 l;3,90;A",
  "Getränke;Hausbier;;0,5 l;4,90;A",
  "",
].join("\r\n");

/** Splits delimited text into rows of cells. The delimiter is the one the first line uses most: tab, semicolon or comma. */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const count = (ch: string) => {
    let n = 0;
    let quoted = false;
    for (const c of firstLine) {
      if (c === '"') quoted = !quoted;
      else if (c === ch && !quoted) n++;
    }
    return n;
  };
  const delimiter = count("\t") > 0 ? "\t" : count(";") >= count(",") && count(";") > 0 ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endCell = () => { row.push(cell.trim()); cell = ""; };
  const endRow = () => { endCell(); if (row.some((c) => c !== "")) rows.push(row); row = []; };

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c === "\n" || c === "\r" ? " " : c;
      continue;
    }
    if (c === '"' && cell.trim() === "") quoted = true;
    else if (c === delimiter) endCell();
    else if (c === "\n") endRow();
    else if (c !== "\r") cell += c;
  }
  endRow();
  return rows;
}

type Column = "section" | "name" | "description" | "size" | "price" | "allergens" | "diet";

const HEADERS: Record<Column, string[]> = {
  section: ["kategorie", "bereich", "rubrik", "gruppe", "category", "section", "abschnitt"],
  name: ["gericht", "name", "titel", "produkt", "artikel", "speise", "getränk", "bezeichnung", "product name", "item", "dish", "product"],
  description: ["beschreibung", "description", "text", "zusatz"],
  size: ["größe", "groesse", "grösse", "variante", "einheit", "menge", "size", "portion"],
  price: ["preis", "price", "betrag", "eur", "€", "preis €", "preis eur", "preis (€)"],
  allergens: ["allergene", "allergen", "allergens"],
  diet: ["ernährung", "diät", "diet", "kost"],
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function readHeader(row: string[]): Partial<Record<Column, number>> | null {
  const map: Partial<Record<Column, number>> = {};
  row.forEach((cell, i) => {
    const key = norm(cell);
    for (const col of Object.keys(HEADERS) as Column[]) {
      if (map[col] === undefined && HEADERS[col].includes(key)) { map[col] = i; return; }
    }
  });
  return map.name !== undefined ? map : null;
}

/** "7,50", "€ 7.50", "7,5 EUR", "12" → cents; null when the cell is not a price. */
export function cellPriceCents(cell: string): number | null {
  const t = cell.replace(/€|eur/gi, "").replace(/\s+/g, "").replace(/[.,]-+$/, "");
  if (!/^\d{1,5}([.,]\d{1,2})?$/.test(t)) return null;
  return parsePriceCents(t);
}

/** Without a header row: the column that is mostly prices is the price; names sit before it. */
function guessColumns(rows: string[][]): Partial<Record<Column, number>> | null {
  const width = Math.max(...rows.map((r) => r.length));
  let price = -1;
  let best = 0;
  for (let c = 0; c < width; c++) {
    const hits = rows.filter((r) => cellPriceCents(r[c] ?? "") !== null).length;
    if (hits > best) { best = hits; price = c; }
  }
  if (price < 1 || best < rows.length / 2) return null;
  const map: Partial<Record<Column, number>> = { price };
  if (price === 1) map.name = 0;
  else if (price === 2) { map.section = 0; map.name = 1; }
  else { map.section = 0; map.name = 1; map.description = 2; }
  if (price + 1 < width) map.allergens = price + 1;
  return map;
}

const ALLERGEN_ORDER = "ABCDEFGHLMNOPR";

/** Rows of a table → sections with dishes. Rows of the same dish with different sizes become one dish. */
export function tableToImport(rows: string[][], fallbackSection = "Speisekarte"): ImportResult {
  const skipped: string[] = [];
  if (rows.length === 0) return { sections: [], skipped };

  const header = readHeader(rows[0]);
  const body = header ? rows.slice(1) : rows;
  const cols = header ?? guessColumns(body);
  if (!cols || cols.name === undefined) {
    return { sections: [], skipped: ["Die Spalten wurden nicht erkannt. Bitte die Vorlage verwenden: Kategorie, Gericht, Beschreibung, Größe, Preis, Allergene."] };
  }
  const at = (row: string[], col: Column) => (cols[col] === undefined ? "" : (row[cols[col]!] ?? "").trim());

  const sections: ImportSection[] = [];
  let sectionName = fallbackSection;
  let last: { section: ImportSection; item: ImportItem } | null = null;

  body.slice(0, TABLE_MAX_ROWS).forEach((row, i) => {
    const line = i + (header ? 2 : 1);
    const name = at(row, "name").slice(0, 200);
    const sectionCell = at(row, "section").slice(0, 80);
    if (sectionCell) sectionName = sectionCell;
    if (!name) {
      // A row with only a category is a heading; anything else without a name cannot be used.
      if (!sectionCell || row.filter((c) => c.trim() !== "").length > 1) skipped.push(`Zeile ${line}: kein Name`);
      return;
    }

    const priceCell = at(row, "price");
    const cents = priceCell === "" ? null : cellPriceCents(priceCell);
    if (priceCell !== "" && cents === null) { skipped.push(`Zeile ${line}: „${name}“ — Preis „${priceCell}“ nicht lesbar`); return; }
    const size = at(row, "size").slice(0, 30);

    // Same dish again with another size: one dish, several prices.
    if (size && cents !== null && last && last.section.name === sectionName && last.item.name.toLowerCase() === name.toLowerCase() && last.item.variants.length > 0) {
      if (last.item.variants.length < 6) last.item.variants.push({ label: size, price_cents: cents });
      else skipped.push(`Zeile ${line}: „${name}“ — höchstens 6 Größen`);
      last.item.price_cents = Math.min(last.item.price_cents, cents);
      return;
    }

    const codes = parseAllergens(at(row, "allergens"));
    const dietCell = norm(at(row, "diet"));
    const item: ImportItem = {
      name,
      price_cents: cents ?? 0,
      description: at(row, "description").slice(0, 600) || null,
      allergens: codes && codes.length ? [...codes].sort((x, y) => ALLERGEN_ORDER.indexOf(x) - ALLERGEN_ORDER.indexOf(y)).join(", ") : null,
      diet: /vegan/.test(dietCell) ? ["vegan"] : /veget|veggie/.test(dietCell) ? ["vegetarisch"] : [],
      variants: size && cents !== null ? [{ label: size, price_cents: cents }] : [],
      priceless: cents === null,
    };

    let section = sections.find((s) => s.name === sectionName);
    if (!section) { section = { name: sectionName, items: [] }; sections.push(section); }
    section.items.push(item);
    last = { section, item };
  });

  if (body.length > TABLE_MAX_ROWS) skipped.push(`Nur die ersten ${TABLE_MAX_ROWS} Zeilen wurden gelesen.`);
  // A single size is just a note on the dish, not a choice.
  for (const s of sections) for (const it of s.items) if (it.variants.length === 1) { it.name = `${it.name} ${it.variants[0].label}`; it.variants = []; }
  return { sections, skipped };
}

/** Text of a CSV/TSV file or of copied cells → import. */
export function parseMenuTable(text: string): ImportResult {
  return tableToImport(parseDelimited(text));
}

/** Rows back to tab-separated text: what the browser sends to the server after reading an Excel file. */
export function rowsToText(rows: string[][]): string {
  return rows.map((r) => r.map((c) => c.replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
}
