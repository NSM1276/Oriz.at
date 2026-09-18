// tests/screen/paginate.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPages, selectVisibleSections } from "../../src/components/screen/paginate.ts";

const item = (id, sectionId, extra = {}) => ({
  id, section_id: sectionId, venue_id: "v", name: id, description: null,
  price_cents: 100, image_url: null, ai_caption: null, allergens: null,
  is_active: true, position: Number(id.replace(/\D/g, "")) || 0, updated_at: "", ...extra,
});
const section = (id, extra = {}) => ({ id, venue_id: "v", name: id.toUpperCase(), position: 0, items: [], ...extra });

test("buildPages splits a long section into consecutive pages", () => {
  const items = Array.from({ length: 7 }, (_, i) => item(`i${i}`, "s1"));
  const pages = buildPages([section("s1", { items })], 3);
  assert.equal(pages.length, 3);
  assert.deepEqual(pages.map((p) => p.items.length), [3, 3, 1]);
  assert.deepEqual(pages.map((p) => p.pageIndex), [0, 1, 2]);
  assert.ok(pages.every((p) => p.pageCount === 3 && p.sectionName === "S1"));
  assert.equal(pages[1].key, "s1:1");
});

test("buildPages skips empty sections and keeps section order", () => {
  const pages = buildPages(
    [section("a", { items: [item("i1", "a")] }), section("b"), section("c", { items: [item("i2", "c")] })],
    10,
  );
  assert.deepEqual(pages.map((p) => p.sectionId), ["a", "c"]);
});

test("buildPages never uses a capacity below 1", () => {
  const pages = buildPages([section("a", { items: [item("i1", "a"), item("i2", "a")] })], 0);
  assert.equal(pages.length, 2);
});

test("selectVisibleSections rebuilds items from the map, drops inactive, sorts, filters by menu", () => {
  const sections = [
    section("s1", { position: 1, menu_id: "lunch" }),
    section("s2", { position: 0, menu_id: null }),
    section("s3", { position: 2, menu_id: "dinner" }),
  ];
  const map = new Map([
    ["i2", item("i2", "s1")],
    ["i1", item("i1", "s1")],
    ["i3", item("i3", "s1", { is_active: false })],
    ["i4", item("i4", "s2")],
    ["i5", item("i5", "s3")],
  ]);
  const out = selectVisibleSections(sections, map, "lunch");
  assert.deepEqual(out.map((s) => s.id), ["s2", "s1"]);
  assert.deepEqual(out[1].items.map((i) => i.id), ["i1", "i2"]);
});

test("selectVisibleSections drops sections left without items", () => {
  const out = selectVisibleSections([section("s1")], new Map(), null);
  assert.equal(out.length, 0);
});
