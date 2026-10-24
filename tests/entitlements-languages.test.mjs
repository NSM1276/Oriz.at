// tests/entitlements-languages.test.mjs — the language package, the "20+" add-on and the lock after the trial.
import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedLocales, entitlementsFor, lockedText } from "../src/lib/entitlements.ts";
import { MENU_LOCALES, PACKAGE_LOCALES } from "../src/lib/locales.ts";
import { cleanLocales } from "../src/lib/menu-edit.ts";
import { UI_LOCALES, allergenName, ui } from "../src/lib/menu-i18n.ts";

const NOW = new Date("2026-10-24T12:00:00Z");
const sub = (plan, status, trial_ends_at = null, languages_all = false) => ({ plan, status, trial_ends_at, languages_all });

test("every plan has the fixed package of four languages besides German", () => {
  assert.deepEqual([...PACKAGE_LOCALES], ["en", "it", "fr", "es"]);
  assert.deepEqual([...allowedLocales(entitlementsFor(sub("starter", "active"), NOW))], ["en", "it", "fr", "es"]);
  assert.deepEqual([...allowedLocales(entitlementsFor(sub("pro", "active"), NOW))], ["en", "it", "fr", "es"]);
});

test("the add-on, the trial and comped open all languages — more than 20 of them", () => {
  assert.ok(MENU_LOCALES.length > 20);
  assert.equal(allowedLocales(entitlementsFor(sub("starter", "active", null, true), NOW)).length, MENU_LOCALES.length);
  assert.equal(allowedLocales(entitlementsFor(sub("pro", "trialing", "2026-11-01T00:00:00Z"), NOW)).length, MENU_LOCALES.length);
  assert.equal(allowedLocales(entitlementsFor(sub("pro", "comped"), NOW)).length, MENU_LOCALES.length);
});

test("after the trial without a plan the admin is locked, the plan falls back to Starter", () => {
  const e = entitlementsFor(sub("pro", "trialing", "2026-10-01T00:00:00Z"), NOW);
  assert.equal(e.locked, true);
  assert.equal(e.trialExpired, true);
  assert.equal(e.tier, "starter");
  assert.equal(e.allLanguages, false);
  assert.equal(entitlementsFor(sub("pro", "trialing", "2026-11-01T00:00:00Z"), NOW).locked, false);
  assert.equal(entitlementsFor(sub("starter", "active"), NOW).locked, false);
  assert.equal(entitlementsFor(sub("starter", "canceled"), NOW).locked, true);
  assert.equal(entitlementsFor(null, NOW).locked, false);
});

test("cleanLocales keeps the fixed order and can drop what the plan does not include", () => {
  assert.deepEqual(cleanLocales(["uk", "es", "en", "xx", "en"]), ["en", "es", "uk"]);
  assert.deepEqual(cleanLocales(["uk", "es", "en"], PACKAGE_LOCALES), ["en", "es"]);
});

test("every menu language has interface texts and allergen names", () => {
  for (const l of MENU_LOCALES) {
    assert.ok(UI_LOCALES.includes(l), `ui strings for ${l}`);
    const t = ui(l);
    assert.ok(t.sections && t.textSize && t.results[1].includes("{n}"), `strings of ${l}`);
    assert.notEqual(allergenName("G", l, "Milch"), "Milch", `allergen name for ${l}`);
  }
  assert.match(lockedText("languages").title, /20\+/);
});
