// tests/menu-filters.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { availableFilterKeys, isAlcoholSection } from "../src/lib/menu-filters.ts";

test("no tags and no drinks section → no chips at all", () => {
  const keys = availableFilterKeys([
    { name: "Antipasti", items: [{ diet_tags: null }, { diet_tags: "[]" }] },
  ]);
  assert.equal(keys.size, 0);
});

test("only tags that some dish carries become chips", () => {
  const keys = availableFilterKeys([
    { name: "Primi", items: [{ diet_tags: '["vegan"]' }, { diet_tags: ["glutenfrei"] }] },
  ]);
  assert.deepEqual([...keys].sort(), ["glutenfrei", "vegan"]);
});

test("alcohol chip appears only with a drinks section", () => {
  assert.ok(availableFilterKeys([{ name: "Weinkarte", items: [] }]).has("alcohol"));
  assert.ok(!availableFilterKeys([{ name: "Dolci", items: [] }]).has("alcohol"));
});

test("drinks sections are recognised case-insensitively", () => {
  assert.ok(isAlcoholSection("BIER & Spritz"));
  assert.ok(!isAlcoholSection("Antipasti"));
});
