// tests/screen/board-fit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeBoardFit,
  countUnits,
  BODY_VH,
  MIN_UNIT_VH,
} from "../../src/components/screen/board-fit.ts";

const item = (id, extra = {}) => ({
  id, section_id: "s", venue_id: "v", name: id, description: null,
  price_cents: 100, image_url: null, ai_caption: null, allergens: null,
  is_active: true, position: 0, updated_at: "", ...extra,
});
const section = (id, n, extra = {}) => ({
  id, venue_id: "v", name: id, position: 0,
  items: Array.from({ length: n }, (_, i) => item(`${id}-${i}`, extra)),
});

test("countUnits: heading plus one unit per plain item", () => {
  assert.equal(countUnits([section("a", 4)], true), 1.7 + 4);
  assert.equal(countUnits([], true), 0);
});

test("countUnits: a description makes an item taller, unless descriptions are off", () => {
  const withDesc = [section("a", 4, { ai_caption: "x" })];
  assert.ok(Math.abs(countUnits(withDesc, true) - (1.7 + 4 * 1.55)) < 1e-9);
  assert.equal(countUnits(withDesc, false), 1.7 + 4);
});

test("a small menu keeps two columns, descriptions and thumbs", () => {
  const fit = computeBoardFit([section("a", 6, { ai_caption: "x", image_url: "u" })]);
  assert.equal(fit.columns, 2);
  assert.equal(fit.showDescriptions, true);
  assert.equal(fit.showThumbs, true);
  assert.equal(fit.readable, true);
  assert.ok(fit.unitVh >= MIN_UNIT_VH);
});

test("no photos anywhere means no thumbnail column", () => {
  const fit = computeBoardFit([section("a", 6, { ai_caption: "x" })]);
  assert.equal(fit.showThumbs, false);
});

test("a medium menu drops descriptions before it drops legibility", () => {
  const fit = computeBoardFit([section("a", 30, { ai_caption: "x", image_url: "u" })]);
  assert.equal(fit.showDescriptions, false);
  assert.equal(fit.readable, true);
  assert.ok(fit.unitVh >= MIN_UNIT_VH);
});

test("a large menu drops thumbnails too and still stays legible", () => {
  const fit = computeBoardFit([section("a", 60, { ai_caption: "x", image_url: "u" })]);
  assert.equal(fit.showDescriptions, false);
  assert.equal(fit.showThumbs, false);
  assert.equal(fit.readable, true);
  assert.ok(fit.unitVh >= MIN_UNIT_VH);
});

test("too much content reports unreadable instead of shrinking silently", () => {
  const fit = computeBoardFit([section("a", 200, { image_url: "u" })]);
  assert.equal(fit.readable, false);
  assert.equal(fit.columns, 4);
  assert.equal(fit.unitVh, MIN_UNIT_VH);
  assert.equal(fit.showDescriptions, false);
  assert.equal(fit.showThumbs, false);
});

test("columns grow only as far as needed", () => {
  const small = computeBoardFit([section("a", 8)]);
  const bigger = computeBoardFit([section("a", 40)]);
  assert.ok(small.columns <= bigger.columns);
  assert.ok(bigger.columns <= 4);
});

test("a nearly empty board does not blow the type up", () => {
  const fit = computeBoardFit([section("a", 1)]);
  assert.ok(fit.unitVh <= MIN_UNIT_VH * 2.4 + 0.001);
  assert.equal(fit.readable, true);
});

test("an empty menu still returns a usable fit", () => {
  const fit = computeBoardFit([]);
  assert.equal(fit.readable, true);
  assert.ok(fit.unitVh > 0);
  assert.ok(fit.columns >= 2);
});

test("headings cost height: many small sections need more room than one big one", () => {
  const many = countUnits([section("a", 2), section("b", 2), section("c", 2)], false);
  const one = countUnits([section("a", 6)], false);
  assert.ok(many > one);
  assert.equal(BODY_VH, 78);
});
