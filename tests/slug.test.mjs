// tests/slug.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeVenueName, slugProblem, slugify } from "../src/lib/slug.ts";

test("slugify: umlauts, accents, ampersand, punctuation", () => {
  assert.equal(slugify("Café Zur Linde"), "cafe-zur-linde");
  assert.equal(slugify("Gasthaus Größenwahn"), "gasthaus-groessenwahn");
  assert.equal(slugify("  Pizza & Pasta!! "), "pizza-und-pasta");
  assert.equal(slugify("Brasserie Lumière"), "brasserie-lumiere");
  assert.equal(slugify("天"), "");
});

test("slugify: cut to 40 without a trailing hyphen", () => {
  const s = slugify("Das allerbeste Restaurant am Rande der wunderschönen Stadt");
  assert.ok(s.length <= 40);
  assert.ok(!s.endsWith("-"));
});

test("slugProblem: accepts normal addresses", () => {
  for (const s of ["belvedere", "cafe-zur-linde", "pizza-2go", "abc"]) assert.equal(slugProblem(s), null, s);
});

test("slugProblem: rejects bad shapes and reserved names", () => {
  for (const s of ["ab", "Belvedere", "a--b", "-abc", "abc-", "ca fe", "über", "12345", "a".repeat(41)]) {
    assert.notEqual(slugProblem(s), null, s);
  }
  for (const s of ["admin", "app", "api", "casa", "registrieren", "impressum", "oriz"]) {
    assert.equal(slugProblem(s), "Diese Adresse ist reserviert.", s);
  }
});

test("normalizeVenueName", () => {
  assert.equal(normalizeVenueName("  Trattoria   Belvedere "), "Trattoria Belvedere");
  assert.equal(normalizeVenueName(" "), null);
  assert.equal(normalizeVenueName("x"), null);
  assert.equal(normalizeVenueName("x".repeat(81)), null);
});
