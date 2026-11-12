// tests/call-i18n.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { CALL_LOCALES, callText, tableText } from "../src/lib/call-i18n.ts";
import { MENU_LOCALES } from "../src/lib/locales.ts";

test("the waiter call speaks every menu language", () => {
  for (const l of ["de", ...MENU_LOCALES]) assert.ok(CALL_LOCALES.includes(l), `missing ${l}`);
});

test("every string is filled", () => {
  for (const l of CALL_LOCALES) {
    const t = callText(l);
    for (const [k, v] of Object.entries(t)) {
      const parts = Array.isArray(v) ? v : [v];
      for (const p of parts) assert.ok(typeof p === "string" && p.trim(), `${l}.${k}`);
    }
  }
});

test("unknown language falls back to English", () => {
  assert.equal(callText("xx").button, "Call waiter");
});

test("table numbers in the guest's language, names untouched", () => {
  assert.equal(tableText("4", "de"), "Tisch 4");
  assert.equal(tableText("12b", "it"), "Tavolo 12b");
  assert.equal(tableText("7", "ja"), "7番テーブル");
  assert.equal(tableText("Terrasse", "en"), "Terrasse");
});
