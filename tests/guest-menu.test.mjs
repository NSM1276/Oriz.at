// tests/guest-menu.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyFilter,
  buildSections,
  EMPTY_FILTER,
  filterOptions,
  foldForSearch,
  parseAllergens,
  parseDiet,
  parseVariants,
  parseVariantText,
  toGuestItem,
  usedAllergens,
} from "../src/lib/guest-menu.ts";

test("allergens: letter codes, German words, mixed — as stored in the live DB", () => {
  assert.deepEqual(parseAllergens("A, C, G"), ["A", "C", "G"]);
  assert.deepEqual(parseAllergens("A, C, G, M, N"), ["A", "C", "G", "M", "N"]);
  assert.deepEqual(parseAllergens("Gluten, Ei, Milch"), ["A", "C", "G"]);
  assert.deepEqual(parseAllergens("Milch, Gluten"), ["A", "G"]);
  assert.deepEqual(parseAllergens("Fisch, Ei"), ["C", "D"]);
  assert.deepEqual(parseAllergens("Gluten, Schalentiere, Fisch"), ["A", "B", "D"]);
  assert.deepEqual(parseAllergens("Gluten, Nüsse"), ["A", "H"]);
  assert.deepEqual(parseAllergens("Krustentiere, Weichtiere, Sulfite"), ["B", "O", "R"]);
  assert.deepEqual(parseAllergens("Sesam"), ["N"]);
  assert.deepEqual(parseAllergens("Sulfite"), ["O"]);
  assert.deepEqual(parseAllergens("a g"), ["A", "G"]);
  assert.deepEqual(parseAllergens("G; L"), ["G", "L"]);
});

test("allergens: nothing entered is unknown, a dash is a declared none", () => {
  assert.equal(parseAllergens(null), null);
  assert.equal(parseAllergens("   "), null);
  assert.deepEqual(parseAllergens("–"), []);
  assert.deepEqual(parseAllergens("keine"), []);
  // Unrecognised text is not a promise of "free of"
  assert.equal(parseAllergens("siehe Aushang"), null);
  // "Eis" is not egg
  assert.equal(parseAllergens("Eis"), null);
});

test("diet: array, JSON string, comma list; vegan implies vegetarian", () => {
  assert.deepEqual([...parseDiet(["vegan"])].sort(), ["vegan", "vegetarisch"]);
  assert.deepEqual([...parseDiet('["vegetarisch"]')], ["vegetarisch"]);
  assert.deepEqual([...parseDiet("vegetarian, glutenfrei")], ["vegetarisch"]);
  assert.equal(parseDiet("[]").size, 0);
  assert.equal(parseDiet(null).size, 0);
});

test("variants: stored jsonb is validated", () => {
  assert.deepEqual(parseVariants([{ label: "0,3 l", price_cents: 390 }, { label: "0,5 l", price_cents: 490 }]), [
    { label: "0,3 l", priceCents: 390 },
    { label: "0,5 l", priceCents: 490 },
  ]);
  assert.deepEqual(parseVariants([{ label: "", price_cents: 1 }, { label: "x", price_cents: -1 }, { label: "y", price_cents: 1.5 }]), []);
  assert.deepEqual(parseVariants("nope"), []);
});

test("variants: owner shorthand", () => {
  assert.deepEqual(parseVariantText("0,3 l 3,90; 0,5 l 4,90"), [
    { label: "0,3 l", priceCents: 390 },
    { label: "0,5 l", priceCents: 490 },
  ]);
  assert.deepEqual(parseVariantText("Klein = 8,50 €\nGroß: 12"), [
    { label: "Klein", priceCents: 850 },
    { label: "Groß", priceCents: 1200 },
  ]);
  assert.equal(parseVariantText("nur Text"), null);
  assert.deepEqual(parseVariantText(""), []);
});

const raw = (over) => ({
  id: "i", section_id: "s", name: "Kässpätzle", description: null, ai_caption: null,
  price_cents: 1290, image_url: null, allergens: null, diet_tags: null, is_active: true, position: 0, ...over,
});

test("item text: description first, caption as fallback, caption as story only in German", () => {
  assert.equal(toGuestItem(raw({ ai_caption: "Mit Bergkäse" }), "de").text, "Mit Bergkäse");
  const both = raw({ description: "Bergkäse, Röstzwiebel", ai_caption: "Wie bei Oma im Ländle." });
  assert.equal(toGuestItem(both, "de").text, "Bergkäse, Röstzwiebel");
  assert.equal(toGuestItem(both, "de").story, "Wie bei Oma im Ländle.");
  assert.equal(toGuestItem(both, "en").story, null);
  const tr = raw({ ai_caption: "Mit Bergkäse", translations: { en: { name: "Cheese noodles", description: "With mountain cheese" } } });
  assert.equal(toGuestItem(tr, "en").name, "Cheese noodles");
  assert.equal(toGuestItem(tr, "en").text, "With mountain cheese");
  assert.equal(toGuestItem(tr, "it").name, "Kässpätzle");
});

const sections = [
  { id: "s1", name: "Vorspeisen", position: 0 },
  { id: "s2", name: "Hauptspeisen", position: 1 },
  { id: "s3", name: "Leer", position: 2 },
];
const items = [
  raw({ id: "1", section_id: "s1", name: "Frittatensuppe", allergens: "A, C, L" }),
  raw({ id: "2", section_id: "s1", name: "Gemischter Salat", allergens: "–", diet_tags: '["vegan"]' }),
  raw({ id: "3", section_id: "s2", name: "Käsespätzle", allergens: "A, C, G", diet_tags: ["vegetarisch"] }),
  raw({ id: "4", section_id: "s2", name: "Schweinsbraten", allergens: null }),
];

test("sections: ordered, localized, empty dropped", () => {
  const out = buildSections(sections, items, "de", null);
  assert.deepEqual(out.map((s) => s.id), ["s1", "s2"]);
  assert.deepEqual(out[1].items.map((i) => i.id), ["3", "4"]);
});

test("search folds umlauts and needs every word", () => {
  assert.equal(foldForSearch("Käsespätzle"), foldForSearch("Kaesespaetzle"));
  const s = buildSections(sections, items, "de", null);
  assert.deepEqual(applyFilter(s, { ...EMPTY_FILTER, query: "kase" }).sections.flatMap((x) => x.items.map((i) => i.id)), ["3"]);
  assert.deepEqual(applyFilter(s, { ...EMPTY_FILTER, query: "haupt braten" }).sections.flatMap((x) => x.items.map((i) => i.id)), ["4"]);
  assert.equal(applyFilter(s, { ...EMPTY_FILTER, query: "pizza" }).matched, 0);
});

test("avoiding an allergen hides unknown dishes and says how many", () => {
  const s = buildSections(sections, items, "de", null);
  const r = applyFilter(s, { ...EMPTY_FILTER, avoid: new Set(["A"]) });
  assert.deepEqual(r.sections.flatMap((x) => x.items.map((i) => i.id)), ["2"]);
  assert.equal(r.hiddenUnknown, 1);
  const r2 = applyFilter(s, { ...EMPTY_FILTER, avoid: new Set(["A"]), includeUnknown: true });
  assert.deepEqual(r2.sections.flatMap((x) => x.items.map((i) => i.id)), ["2", "4"]);
});

test("diet filter uses only tags the owner set", () => {
  const s = buildSections(sections, items, "de", null);
  assert.deepEqual(applyFilter(s, { ...EMPTY_FILTER, diet: new Set(["vegetarisch"]) }).sections.flatMap((x) => x.items.map((i) => i.id)), ["2", "3"]);
  assert.deepEqual(applyFilter(s, { ...EMPTY_FILTER, diet: new Set(["vegan"]) }).sections.flatMap((x) => x.items.map((i) => i.id)), ["2"]);
});

test("filter options: only chips that change something", () => {
  const opts = filterOptions(buildSections(sections, items, "de", null));
  assert.deepEqual(opts.diet, [{ tag: "vegetarisch", count: 2 }, { tag: "vegan", count: 1 }]);
  assert.deepEqual(opts.avoid, ["A", "C", "G", "L"]);
  assert.equal(opts.declared, 3);
  // One declared dish among many is not enough data to filter by.
  const sparse = filterOptions(buildSections(sections, [
    raw({ id: "a", section_id: "s1", allergens: "A" }),
    ...["b", "c", "d"].map((id) => raw({ id, section_id: "s1" })),
  ], "de", null));
  assert.deepEqual(sparse.avoid, []);
  const none = filterOptions(buildSections(sections, [raw({ id: "x", section_id: "s1" })], "de", null));
  assert.deepEqual(none.diet, []);
  assert.deepEqual(none.avoid, []);
});

test("legend lists the codes used", () => {
  assert.deepEqual(usedAllergens(buildSections(sections, items, "de", null)), ["A", "C", "G", "L"]);
});
