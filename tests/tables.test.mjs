// tests/tables.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TABLE_CODE_ALPHABET,
  compareTables,
  isTableCode,
  newTableCode,
  nextNumericLabels,
  normalizeLabel,
  tableDisplayName,
  tableUrl,
} from "../src/lib/tables.ts";

test("codes: 8 characters from the look-alike-free alphabet", () => {
  for (let i = 0; i < 200; i++) {
    const code = newTableCode();
    assert.equal(code.length, 8);
    for (const ch of code) assert.ok(TABLE_CODE_ALPHABET.includes(ch), ch);
    assert.ok(isTableCode(code));
  }
});

test("codes: bytes above the fair limit are skipped, not folded", () => {
  // 31 symbols → bytes ≥ 248 are rejected; 248 would otherwise map to '2'.
  let call = 0;
  const fake = (n) => {
    call += 1;
    return call === 1 ? new Uint8Array(n).fill(248) : new Uint8Array(n).fill(1);
  };
  assert.equal(newTableCode(fake), "33333333");
});

test("isTableCode: case-insensitive, rejects look-alikes and wrong length", () => {
  assert.ok(isTableCode("k7m2qx9a"));
  assert.ok(!isTableCode("K7M2QX9"));
  assert.ok(!isTableCode("K7M2QX0A"));
  assert.ok(!isTableCode("K7M2QXIA"));
});

test("normalizeLabel: trims, collapses spaces, limits length", () => {
  assert.equal(normalizeLabel("  Terrasse   3 "), "Terrasse 3");
  assert.equal(normalizeLabel("   "), null);
  assert.equal(normalizeLabel("x".repeat(41)), null);
});

test("nextNumericLabels: continues after the highest number, skips taken", () => {
  assert.deepEqual(nextNumericLabels([], 3), ["1", "2", "3"]);
  assert.deepEqual(nextNumericLabels(["1", "2", "Bar"], 3), ["3", "4", "5"]);
  assert.deepEqual(nextNumericLabels(["Bar", "Fenster"], 2), ["1", "2"]);
  assert.deepEqual(nextNumericLabels(["10", "2"], 1), ["11"]);
});

test("compareTables: zone groups, natural numbers, no zone last", () => {
  const rows = [
    { label: "10", zone: null, position: 0 },
    { label: "2", zone: null, position: 1 },
    { label: "1", zone: "Terrasse", position: 2 },
    { label: "Bar", zone: "Innen", position: 3 },
  ];
  assert.deepEqual(rows.sort(compareTables).map((r) => r.label), ["Bar", "1", "2", "10"]);
});

test("tableDisplayName: numbers get 'Tisch', names stay", () => {
  assert.equal(tableDisplayName("8"), "Tisch 8");
  assert.equal(tableDisplayName("12a"), "Tisch 12a");
  assert.equal(tableDisplayName("Bar"), "Bar");
  assert.equal(tableDisplayName("Terrasse 3"), "Terrasse 3");
});

test("tableUrl", () => {
  assert.equal(tableUrl("K7M2QX9A"), "https://oriz.at/t/K7M2QX9A");
});
