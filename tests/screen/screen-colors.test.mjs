// tests/screen/screen-colors.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPalette } from "../../src/components/screen/screen-colors.ts";

test("dark background → light text", () => {
  const p = buildPalette("#0A0A0A", "#C69B3C");
  assert.equal(p.isDark, true);
  assert.equal(p.bg, "#0A0A0A");
  assert.equal(p.text, "#F5F0EC");
  assert.equal(p.accent, "#C69B3C");
});

test("light background → dark text", () => {
  const p = buildPalette("#F5F0EC", "#B87333");
  assert.equal(p.isDark, false);
  assert.equal(p.text, "#0A0A0A");
  assert.equal(p.accent, "#B87333");
});

test("missing colors fall back to parchment + gold", () => {
  const p = buildPalette(null, undefined);
  assert.equal(p.bg, "#F5F0EC");
  assert.equal(p.accent, "#C69B3C");
  assert.equal(p.isDark, false);
});

test("invalid hex is treated as light", () => {
  assert.equal(buildPalette("not-a-color", null).isDark, false);
});
