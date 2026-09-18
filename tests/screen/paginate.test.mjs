// tests/screen/paginate.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPages,
  selectVisibleSections,
  sectionIsVisual,
  VISUAL_CAPACITY,
  TEXT_CAPACITY,
} from "../../src/components/screen/paginate.ts";

const item = (id, sectionId, extra = {}) => ({
  id, section_id: sectionId, venue_id: "v", name: id, description: null,
  price_cents: 100, image_url: null, ai_caption: null, allergens: null,
  is_active: true, position: Number(id.replace(/\D/g, "")) || 0, updated_at: "", ...extra,
});
const section = (id, extra = {}) => ({ id, venue_id: "v", name: id.toUpperCase(), position: 0, items: [], ...extra });
const photo = (id, sectionId) => item(id, sectionId, { image_url: `https://x/${id}.webp` });

test("visual section: max 6 tiles per page, balanced split, then one spotlight", () => {
  const items = Array.from({ length: 7 }, (_, i) => photo(`i${i}`, "s1"));
  const pages = buildPages([section("s1", { items })]);
  assert.deepEqual(pages.map((p) => p.kind), ["board", "board", "spotlight"]);
  assert.deepEqual(pages.slice(0, 2).map((p) => p.items.length), [4, 3]);
  const six = buildPages([section("s2", { items: items.slice(0, VISUAL_CAPACITY) })]);
  assert.deepEqual(six.filter((p) => p.kind === "board").map((p) => p.items.length), [VISUAL_CAPACITY]);
  assert.ok(pages.slice(0, 2).every((p) => p.visual && p.pageCount === 2 && p.heroItems.length === 7));
  assert.equal(pages[1].key, "s1:1");
  assert.equal(pages[2].key, "s1:spotlight");
  assert.equal(pages[2].item.id, "i0");
});

test("text section: max 10 rows per page, balanced split, no spotlight, empty heroItems", () => {
  const items = Array.from({ length: 12 }, (_, i) => item(`i${i}`, "s1"));
  const pages = buildPages([section("s1", { items })]);
  assert.deepEqual(pages.map((p) => p.kind), ["board", "board"]);
  assert.deepEqual(pages.map((p) => p.items.length), [6, 6]);
  const ten = buildPages([section("s2", { items: items.slice(0, TEXT_CAPACITY) })]);
  assert.deepEqual(ten.map((p) => p.items.length), [TEXT_CAPACITY]);
  assert.ok(pages.every((p) => p.visual === false && p.heroItems.length === 0));
});

test("mixed section counts as visual when at least one item has a photo", () => {
  const items = [item("i1", "s1"), photo("i2", "s1"), item("i3", "s1")];
  assert.equal(sectionIsVisual(items), true);
  const pages = buildPages([section("s1", { items })]);
  assert.equal(pages[0].visual, true);
  assert.deepEqual(pages[0].heroItems.map((i) => i.id), ["i2"]);
});

test("spotlight can be disabled and empty sections are skipped", () => {
  const pages = buildPages(
    [section("a", { items: [photo("i1", "a")] }), section("b"), section("c", { items: [photo("i2", "c")] })],
    { spotlight: false },
  );
  assert.deepEqual(pages.map((p) => `${p.kind}:${p.sectionId}`), ["board:a", "board:c"]);
});

test("spotlight pick varies by section index", () => {
  const a = section("a", { items: [photo("i1", "a"), photo("i2", "a")] });
  const b = section("b", { items: [photo("i3", "b"), photo("i4", "b")] });
  const spots = buildPages([a, b]).filter((p) => p.kind === "spotlight");
  assert.deepEqual(spots.map((p) => p.item.id), ["i1", "i4"]);
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

test("sectionIds filters and orders sections", () => {
  const sections = [
    section("s1", { position: 0 }),
    section("s2", { position: 1 }),
    section("s3", { position: 2 }),
  ];
  const map = new Map([
    ["i1", item("i1", "s1")],
    ["i2", item("i2", "s2")],
    ["i3", item("i3", "s3")],
  ]);
  assert.deepEqual(selectVisibleSections(sections, map, null, ["s3", "s1"]).map((s) => s.id), ["s3", "s1"]);
  assert.deepEqual(selectVisibleSections(sections, map, null, null).map((s) => s.id), ["s1", "s2", "s3"]);
  assert.deepEqual(selectVisibleSections(sections, map, null, ["nope"]).map((s) => s.id), []);
});

test("heroPins: pinned photo dish is the only hero and the spotlight item", () => {
  const items = [photo("i1", "s1"), photo("i2", "s1"), photo("i3", "s1")];
  const pages = buildPages([section("s1", { items })], { heroPins: { s1: "i3" } });
  assert.deepEqual(pages[0].heroItems.map((i) => i.id), ["i3"]);
  assert.equal(pages.at(-1).kind, "spotlight");
  assert.equal(pages.at(-1).item.id, "i3");
});

test("heroPins: pin without photo or unknown id is ignored", () => {
  const items = [item("i1", "s1"), photo("i2", "s1")];
  const noPhoto = buildPages([section("s1", { items })], { heroPins: { s1: "i1" } });
  assert.deepEqual(noPhoto[0].heroItems.map((i) => i.id), ["i2"]);
  const unknown = buildPages([section("s1", { items })], { heroPins: { s1: "zzz" } });
  assert.deepEqual(unknown[0].heroItems.map((i) => i.id), ["i2"]);
});
