// tests/screen/screen-config.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveScreenConfig, DEFAULT_ROTATION_SEC } from "../../src/components/screen/screen-config.ts";

const venue = { color_bg: "#1C1208", color_primary: "#C8963E" };
const noUrl = { seconds: null, preset: null, lang: "de", preview: false };
const row = {
  venue_id: "v", active: false, mode: "tafel", rotation_sec: 15, spotlight: false,
  color_bg: "#0A0A0A", color_primary: "#C69B3C",
  sections: ["s2", "s1"], hero_items: { s1: "i9" }, style: {}, updated_at: "",
};

test("no row → venue colors, defaults, every section", () => {
  const c = resolveScreenConfig(null, venue, noUrl);
  assert.deepEqual(c, {
    active: true, mode: "showcase", seconds: DEFAULT_ROTATION_SEC, spotlight: true,
    colorBg: "#1C1208", colorPrimary: "#C8963E", sectionIds: null, heroPins: {}, lang: "de", preview: false,
  });
});

test("row overrides venue and defaults", () => {
  const c = resolveScreenConfig(row, venue, noUrl);
  assert.equal(c.active, false);
  assert.equal(c.seconds, 15);
  assert.equal(c.spotlight, false);
  assert.equal(c.colorBg, "#0A0A0A");
  assert.deepEqual(c.sectionIds, ["s2", "s1"]);
  assert.deepEqual(c.heroPins, { s1: "i9" });
  assert.equal(c.mode, "tafel");
});

test("URL overrides beat the row for seconds and colors only", () => {
  const c = resolveScreenConfig(row, venue, {
    seconds: 5, preset: { color_bg: "#FFFFFF", color_primary: "#B87333" }, lang: "en", preview: true,
  });
  assert.equal(c.seconds, 5);
  assert.equal(c.colorBg, "#FFFFFF");
  assert.equal(c.colorPrimary, "#B87333");
  assert.equal(c.lang, "en");
  assert.equal(c.preview, true);
  assert.equal(c.spotlight, false); // still from the row
  assert.deepEqual(c.sectionIds, ["s2", "s1"]);
});

test("row with null colors inherits venue colors", () => {
  const c = resolveScreenConfig({ ...row, color_bg: null, color_primary: null }, venue, noUrl);
  assert.equal(c.colorBg, "#1C1208");
  assert.equal(c.colorPrimary, "#C8963E");
});
