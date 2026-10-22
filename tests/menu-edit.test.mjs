// tests/menu-edit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_DISH,
  allergensToText,
  cleanLocales,
  dishFromForm,
  formFromItem,
  parsePrice,
} from "../src/lib/menu-edit.ts";
import { parseAllergens, parseDiet, parseVariants } from "../src/lib/guest-menu.ts";

test("prices", () => {
  assert.equal(parsePrice("12"), 1200);
  assert.equal(parsePrice("12,5"), 1250);
  assert.equal(parsePrice("12.50"), 1250);
  assert.equal(parsePrice("€ 9,90"), 990);
  assert.equal(parsePrice("0"), 0);
  for (const bad of ["", "abc", "12,505", "-3", "1.000,00", "200000"]) assert.equal(parsePrice(bad), null, bad);
});

test("allergen text: declared codes in A–R order, none, unknown", () => {
  assert.equal(allergensToText(true, ["g", "A", "C"]), "A, C, G");
  assert.equal(allergensToText(true, []), "–");
  assert.equal(allergensToText(false, ["A"]), null);
  assert.equal(allergensToText(true, ["X", "A"]), "A");
});

const form = (over) => ({ ...EMPTY_DISH, name: "Wiener Schnitzel", price: "19,90", ...over });

test("a simple dish", () => {
  const r = dishFromForm(form({ description: "  Mit Erdäpfelsalat  " }), []);
  assert.ok(r.ok);
  assert.equal(r.row.name, "Wiener Schnitzel");
  assert.equal(r.row.description, "Mit Erdäpfelsalat");
  assert.equal(r.row.price_cents, 1990);
  assert.deepEqual(r.row.price_variants, []);
  assert.equal(r.row.allergens, null);
  assert.equal(r.row.diet_tags, null);
});

test("errors in plain German", () => {
  assert.equal(dishFromForm(form({ name: "  " }), []).error, "Bitte einen Namen eingeben.");
  assert.match(dishFromForm(form({ price: "zwölf" }), []).error, /gültigen Preis/);
  assert.match(dishFromForm(form({ sizes: [{ label: "", price: "3" }] }), []).error, /Bezeichnung/);
  assert.match(dishFromForm(form({ sizes: [{ label: "0,5 l", price: "x" }] }), []).error, /0,5 l/);
  assert.match(dishFromForm(form({ sizes: [{ label: "Klein", price: "3" }, { label: "klein", price: "4" }] }), []).error, /gleich/);
});

test("sizes: price follows the cheapest, blank rows ignored", () => {
  const r = dishFromForm(form({ price: "", sizes: [{ label: "0,5 l", price: "4,90" }, { label: "0,3 l", price: "3,90" }, { label: "", price: "" }] }), []);
  assert.ok(r.ok);
  assert.equal(r.row.price_cents, 390);
  assert.deepEqual(r.row.price_variants, [{ label: "0,5 l", price_cents: 490 }, { label: "0,3 l", price_cents: 390 }]);
});

test("diet: vegan wins and is stored the way the old column holds it", () => {
  assert.equal(dishFromForm(form({ vegan: true, vegetarian: true }), []).row.diet_tags, '["vegan"]');
  assert.equal(dishFromForm(form({ vegetarian: true }), []).row.diet_tags, '["vegetarisch"]');
});

test("translations: only enabled languages, empty ones removed, disabled ones kept", () => {
  const r = dishFromForm(
    form({ translations: { en: { name: "Viennese schnitzel", description: "" }, it: { name: "", description: "" }, fr: { name: "x", description: "" } } }),
    ["en", "it"],
    { it: { name: "Cotoletta" }, uk: { name: "Шніцель" } },
  );
  assert.deepEqual(r.row.translations, { en: { name: "Viennese schnitzel" }, uk: { name: "Шніцель" } });
});

test("round trip: what the form saves, the guest menu reads the same way", () => {
  const r = dishFromForm(
    form({ allergensDeclared: true, allergens: ["G", "A"], vegan: true, sizes: [{ label: "Klein", price: "8" }, { label: "Groß", price: "12" }] }),
    [],
  );
  assert.deepEqual(parseAllergens(r.row.allergens), ["A", "G"]);
  assert.deepEqual([...parseDiet(r.row.diet_tags)].sort(), ["vegan", "vegetarisch"]);
  assert.deepEqual(parseVariants(r.row.price_variants).map((v) => v.priceCents), [800, 1200]);

  const back = formFromItem({ ...r.row }, ["en"]);
  assert.equal(back.allergensDeclared, true);
  assert.deepEqual(back.allergens, ["A", "G"]);
  assert.equal(back.vegan, true);
  assert.deepEqual(back.sizes, [{ label: "Klein", price: "8,00" }, { label: "Groß", price: "12,00" }]);
  assert.deepEqual(back.translations, { en: { name: "", description: "" } });
});

test("form from an old row with free-text allergens", () => {
  const f = formFromItem({ name: "x", description: null, ai_caption: null, price_cents: 450, allergens: "Gluten, Ei", diet_tags: "[]", is_active: false }, []);
  assert.deepEqual(f.allergens, ["A", "C"]);
  assert.equal(f.price, "4,50");
  assert.equal(f.available, false);
});

test("locales: only supported ones", () => {
  assert.deepEqual(cleanLocales(["uk", "fr", "en", "en", "de"]), ["en", "uk"]);
  assert.deepEqual(cleanLocales("en"), []);
});
