// tests/screen/screen-params.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScreenParams, DEFAULT_SECONDS } from "../../src/components/screen/screen-params.ts";

const opts = { enabledLocales: ["en", "it"], presetIds: new Set(["onyx", "pergament"]) };

test("defaults when nothing is given", () => {
  assert.deepEqual(parseScreenParams({}, opts), { seconds: DEFAULT_SECONDS, presetId: null, lang: "de" });
});

test("clamps seconds into 3..60 and ignores garbage", () => {
  assert.equal(parseScreenParams({ s: "1" }, opts).seconds, 3);
  assert.equal(parseScreenParams({ s: "999" }, opts).seconds, 60);
  assert.equal(parseScreenParams({ s: "15" }, opts).seconds, 15);
  assert.equal(parseScreenParams({ s: "abc" }, opts).seconds, DEFAULT_SECONDS);
  assert.equal(parseScreenParams({ s: ["7", "9"] }, opts).seconds, 7);
});

test("accepts only known preset ids", () => {
  assert.equal(parseScreenParams({ preset: "onyx" }, opts).presetId, "onyx");
  assert.equal(parseScreenParams({ preset: "ONYX" }, opts).presetId, "onyx");
  assert.equal(parseScreenParams({ preset: "neon" }, opts).presetId, null);
});

test("accepts only enabled locales, falls back to de", () => {
  assert.equal(parseScreenParams({ lang: "en" }, opts).lang, "en");
  assert.equal(parseScreenParams({ lang: "fr" }, opts).lang, "de");
  assert.equal(parseScreenParams({ lang: "de" }, opts).lang, "de");
});
