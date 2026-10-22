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

// ── Fixes from the signup → wizard run (2026-10-22) ──────────────────────

import { linesToImport } from "../src/lib/menu-parser.ts";

const importText = (t) => linesToImport(parseMenuText(t));

test("a heading with its own text and no price becomes a dish without a price", () => {
  const r = importText("HAUPTSPEISEN\nSchnitzel 18,90\n\nTagesgericht\nFragen Sie unser Personal\n\nDESSERTS\nStrudel 5,90");
  const main = r.sections.find((s) => s.name === "HAUPTSPEISEN");
  assert.deepEqual(main.items.map((i) => i.name), ["Schnitzel", "Tagesgericht"]);
  const daily = main.items[1];
  assert.equal(daily.priceless, true);
  assert.equal(daily.price_cents, 0);
  assert.equal(daily.description, "Fragen Sie unser Personal");
  assert.deepEqual(r.skipped, []);
});

test("a lone empty heading is reported, never silently dropped", () => {
  const r = importText("LEER\n\nSUPPEN\nRindsuppe 4,90");
  assert.deepEqual(r.sections.map((s) => s.name), ["SUPPEN"]);
  assert.deepEqual(r.skipped, ["LEER"]);
});

test("a subtitle under a heading keeps the dishes in that heading and is reported", () => {
  const r = importText("MITTAGSMENÜ\nMontag bis Freitag\n\nSuppe 4,90\nTagesteller 9,90");
  assert.deepEqual(r.sections.map((s) => s.name), ["MITTAGSMENÜ"]);
  assert.equal(r.sections[0].items.length, 2);
  assert.deepEqual(r.skipped, ["Montag bis Freitag"]);
});

test("allergen letters in brackets fill the allergens and leave the text", () => {
  const r = importText("SPEISEN\nWiener Schnitzel (A, C, G) 18,90\nmit Erdäpfelsalat\nKäsespätzle 12,50\nmit Röstzwiebeln (A,C,G)\nSuppe 4,90\nAllergene: A L");
  const [schnitzel, spaetzle, suppe] = r.sections[0].items;
  assert.equal(schnitzel.name, "Wiener Schnitzel");
  assert.equal(schnitzel.allergens, "A, C, G");
  assert.equal(schnitzel.description, "mit Erdäpfelsalat");
  assert.equal(spaetzle.description, "mit Röstzwiebeln");
  assert.equal(spaetzle.allergens, "A, C, G");
  assert.equal(suppe.allergens, "A, L");
  assert.equal(suppe.description, null);
});

test("ordinary brackets are not mistaken for allergens", () => {
  const r = importText("SPEISEN\nChili con Carne (scharf) 11,90\nGulasch (vom Rind) 13,50");
  assert.equal(r.sections[0].items[0].name, "Chili con Carne (scharf)");
  assert.equal(r.sections[0].items[0].allergens, null);
  assert.equal(r.sections[0].items[1].allergens, null);
});

test("vegan / vegetarisch in the text become diet tags", () => {
  const r = importText("SPEISEN\nBuddha Bowl (vegan) 12,90\nGemüselasagne 11,50\nvegetarisch, mit Bechamel\nTofu-Curry 10,90\nvegane Option auf Anfrage");
  const [bowl, lasagne, curry] = r.sections[0].items;
  assert.deepEqual(bowl.diet, ["vegan"]);
  assert.equal(bowl.name, "Buddha Bowl");
  assert.deepEqual(lasagne.diet, ["vegetarisch"]);
  assert.equal(lasagne.description, "mit Bechamel");
  assert.deepEqual(curry.diet, []);
});

test("the same drink in two sizes on two lines becomes one dish with sizes", () => {
  const r = importText("BIER\nHausbier 0,3 l 3,90\nHausbier 0,5 l 4,90\nRadler 0,5 l 4,50");
  const items = r.sections[0].items;
  assert.deepEqual(items.map((i) => i.name), ["Hausbier", "Radler 0,5 l"]);
  assert.deepEqual(items[0].variants, [{ label: "0,3 l", price_cents: 390 }, { label: "0,5 l", price_cents: 490 }]);
  assert.equal(items[0].price_cents, 390);
});

test("several sizes on one line become one dish with sizes", () => {
  const r = importText("WEIN\nGrüner Veltliner 1/8 l 3,80 / 1/4 l 7,20\nHauswein 0,125 l 3,50 | 0,25 l 6,50");
  const items = r.sections[0].items;
  assert.equal(items[0].name, "Grüner Veltliner");
  assert.deepEqual(items[0].variants, [{ label: "1/8 l", price_cents: 380 }, { label: "1/4 l", price_cents: 720 }]);
  assert.equal(items.at(-1).name, "Hauswein");
  assert.deepEqual(items.at(-1).variants, [{ label: "0,125 l", price_cents: 350 }, { label: "0,25 l", price_cents: 650 }]);
});
