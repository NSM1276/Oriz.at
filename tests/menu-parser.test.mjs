// tests/menu-parser.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMenuText, linesToSections, parsePriceCents } from "../src/lib/menu-parser.ts";

test("prices: comma, dot, euro before or after", () => {
  assert.equal(parsePriceCents("9,50"), 950);
  assert.equal(parsePriceCents("9.50"), 950);
  assert.equal(parsePriceCents("12"), 1200);
  assert.equal(parsePriceCents("0"), 0);
  assert.equal(parsePriceCents("abc"), null);
});

test("an item line ends with its price, however it is written", () => {
  const lines = parseMenuText([
    "Wiener Schnitzel 18,90",
    "Gulaschsuppe € 6,50",
    "Apfelstrudel 5,90 €",
    "Tafelspitz .......... 24,00",
    "Espresso 2,80 EUR",
  ].join("\n"));
  assert.deepEqual(lines.map((l) => l.kind), Array(5).fill("item"));
  assert.deepEqual(lines.map((l) => l.name), [
    "Wiener Schnitzel", "Gulaschsuppe", "Apfelstrudel", "Tafelspitz", "Espresso",
  ]);
  assert.deepEqual(lines.map((l) => l.priceCents), [1890, 650, 590, 2400, 280]);
});

test("a line without a price is a heading, and blank lines are skipped", () => {
  const lines = parseMenuText("VORSPEISEN\n\nSuppe 4,90\n\nHAUPTSPEISEN\nSchnitzel 18,90");
  assert.deepEqual(lines.map((l) => l.kind), ["section", "item", "section", "item"]);
  assert.deepEqual(lines.filter((l) => l.kind === "section").map((l) => l.name), ["VORSPEISEN", "HAUPTSPEISEN"]);
});

test("a plain line right after an item is that item's description", () => {
  const lines = parseMenuText("Bacon & Eggs 7,50\n3 Eier und 1 Gebäck\nHam & Eggs 7,50");
  assert.deepEqual(lines.map((l) => l.kind), ["item", "description", "item"]);
  assert.equal(lines[1].text, "3 Eier und 1 Gebäck");
});

test("a blank line ends the item block, so the next plain line is a heading again", () => {
  const lines = parseMenuText("Suppe 4,90\n\nDESSERTS\nStrudel 5,90");
  assert.deepEqual(lines.map((l) => l.kind), ["item", "section", "item"]);
});

test("a size in the name is not mistaken for the price", () => {
  const lines = parseMenuText("Guinness 0,25l 4,10 €\nWein 0,75l");
  assert.equal(lines[0].kind, "item");
  assert.equal(lines[0].name, "Guinness 0,25l");
  assert.equal(lines[0].priceCents, 410);
  // no trailing number at all → not an item
  assert.equal(lines[1].kind, "description");
});

test("nothing is dropped: every non-empty line comes back", () => {
  const text = "VORSPEISEN\nSuppe 4,90\nmit Frittaten\n\nHAUPT\nSchnitzel 18,90";
  const lines = parseMenuText(text);
  assert.equal(lines.length, text.split("\n").filter((l) => l.trim() !== "").length);
  assert.deepEqual(lines.map((l) => l.raw), ["VORSPEISEN", "Suppe 4,90", "mit Frittaten", "HAUPT", "Schnitzel 18,90"]);
});

test("linesToSections folds lines into sections with descriptions attached", () => {
  const sections = linesToSections(parseMenuText(
    "FRÜHSTÜCK\nBacon & Eggs 7,50\n3 Eier und 1 Gebäck\nHam & Eggs 7,50\n\nSUPPEN\nRindsuppe 4,90",
  ));
  assert.deepEqual(sections.map((s) => s.name), ["FRÜHSTÜCK", "SUPPEN"]);
  assert.equal(sections[0].items.length, 2);
  assert.equal(sections[0].items[0].description, "3 Eier und 1 Gebäck");
  assert.equal(sections[0].items[1].description, null);
  assert.equal(sections[1].items[0].price_cents, 490);
});

test("items before any heading land in a fallback section", () => {
  const sections = linesToSections(parseMenuText("Schnitzel 18,90"), "Speisekarte");
  assert.deepEqual(sections.map((s) => s.name), ["Speisekarte"]);
  assert.equal(sections[0].items.length, 1);
});

test("a heading with no items under it is dropped, not saved empty", () => {
  const sections = linesToSections(parseMenuText("LEER\n\nSUPPEN\nRindsuppe 4,90"));
  assert.deepEqual(sections.map((s) => s.name), ["SUPPEN"]);
});

test("a price-only line is not an item without a name", () => {
  const lines = parseMenuText("4,90");
  assert.equal(lines[0].kind, "section");
});
