// tests/print-model.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrintModel, printLocale, standDate } from "../src/lib/print/model.ts";
import { buildPrintDoc, estimateSectionHeight } from "../src/lib/print/doc.ts";

const item = (id, over = {}) => ({
  id, section_id: "s1", name: `Dish ${id}`, description: null, ai_caption: null, price_cents: 1000,
  price_variants: [], image_url: null, allergens: null, diet_tags: null, is_active: true, position: Number(id), translations: null, ...over,
});

const source = (items, venue = {}) => ({
  venue: { name: "Haus Test", slug: "haus-test", about: "Seit 1987", currency: "EUR", enabled_locales: ["en"], translations: { en: { about: "Since 1987" } }, ...venue },
  sections: [{ id: "s1", name: "Hauptspeisen", position: 1, menu_id: null, translations: { en: { name: "Mains" } }, items }],
});

const NOW = new Date("2026-10-22T10:00:00Z");

test("language: German unless the venue offers the requested one", () => {
  assert.equal(printLocale(null, ["en"]), "de");
  assert.equal(printLocale("en", ["en", "it"]), "en");
  assert.equal(printLocale("EN", ["en"]), "en");
  assert.equal(printLocale("it", ["en"]), "de");
  assert.equal(printLocale("xx", ["xx"]), "de"); // no strings for it
});

test("the Stand date is the Vienna date, not UTC", () => {
  assert.equal(standDate(new Date("2026-10-22T22:30:00Z"), "de"), "23.10.2026");
  assert.equal(standDate(new Date("2026-10-22T10:00:00Z"), "de"), "22.10.2026");
});

test("prices: one price, sizes, or none", () => {
  const m = buildPrintModel(
    source([
      item("1", { price_cents: 1890 }),
      item("2", { price_cents: 390, price_variants: [{ label: "0,3 l", price_cents: 390 }, { label: "0,5 l", price_cents: 490 }] }),
      item("3", { price_cents: 0 }),
    ]),
    null, NOW,
  );
  const [a, b, c] = m.sections[0].items;
  assert.equal(a.prices.length, 1);
  assert.equal(a.prices[0].label, null);
  assert.match(a.prices[0].price, /18,90/);
  assert.deepEqual(b.prices.map((p) => p.label), ["0,3 l", "0,5 l"]);
  assert.match(b.prices[1].price, /4,90/);
  assert.deepEqual(c.prices, []);
});

test("dishes marked ausverkauft stay on the printed menu", () => {
  const m = buildPrintModel(source([item("1"), item("2", { is_active: false })]), null, NOW);
  assert.equal(m.sections[0].items.length, 2);
});

test("allergens print only when entered; diet prefers vegan", () => {
  const m = buildPrintModel(
    source([
      item("1", { allergens: "A, C, G" }),
      item("2", { allergens: null }),
      item("3", { allergens: "-" }),
      item("4", { diet_tags: JSON.stringify(["vegan"]) }),
      item("5", { diet_tags: JSON.stringify(["vegetarisch"]) }),
    ]),
    null, NOW,
  );
  const items = m.sections[0].items;
  assert.equal(items[0].allergens, "A, C, G");
  assert.equal(items[1].allergens, null); // unknown is not "free of"
  assert.equal(items[2].allergens, null); // declared free: nothing to print
  assert.equal(items[3].diet, "vegan");
  assert.equal(items[4].diet, "vegetarisch");
});

test("legend lists only the codes used on this menu, in A–R order", () => {
  const m = buildPrintModel(source([item("1", { allergens: "G, A" }), item("2", { allergens: "N" })]), null, NOW);
  assert.deepEqual(m.legend.map((l) => l.code), ["A", "G", "N"]);
  assert.equal(m.legend[1].name, "Milch");
  const en = buildPrintModel(source([item("1", { allergens: "G" })]), "en", NOW);
  assert.equal(en.legend[0].name, "Milk");
});

test("translations and the venue line follow the language", () => {
  const m = buildPrintModel(source([item("1", { name: "Schnitzel", translations: { en: { name: "Schnitzel (veal)", description: "Breaded" } } })]), "en", NOW);
  assert.equal(m.locale, "en");
  assert.equal(m.sections[0].name, "Mains");
  assert.equal(m.sections[0].items[0].name, "Schnitzel (veal)");
  assert.equal(m.about, "Since 1987");
  assert.equal(m.ui.stand, "As of");
});

test("section height estimate: a short section stays together, a long one flows", () => {
  const short = buildPrintModel(source([item("1"), item("2"), item("3")]), null, NOW).sections[0];
  const long = buildPrintModel(source(Array.from({ length: 30 }, (_, i) => item(String(i + 1), { description: "x".repeat(120) }))), null, NOW).sections[0];
  assert.ok(estimateSectionHeight(short) < 600);
  assert.ok(estimateSectionHeight(long) > 600);
});

test("document: A4, no page numbers, footer carries the Stand date and the legend", () => {
  const model = buildPrintModel(source([item("1", { allergens: "A" })]), null, NOW);
  const doc = buildPrintDoc(model, "<svg/>");
  assert.equal(doc.pageSize, "A4");
  assert.equal(doc.header(1), null);
  assert.ok(doc.header(2));
  const footerText = JSON.stringify(doc.footer(1, 3));
  assert.ok(footerText.includes("22.10.2026"));
  assert.ok(footerText.includes("A Gluten"));
  assert.ok(!/Seite|Page \d|von \d/i.test(footerText), "no page numbers: they would shift when a page is added");
  // a short section is one unbreakable block
  assert.ok(doc.content.some((n) => n.unbreakable === true));
});
