// tests/secrets.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { bearerMatches } from "../src/lib/secrets.ts";

test("bearer: the right secret passes", () => {
  assert.equal(bearerMatches("Bearer s3cret", "s3cret"), true);
});

test("bearer: wrong, partial or differently-cased values fail", () => {
  assert.equal(bearerMatches("Bearer s3cre", "s3cret"), false);
  assert.equal(bearerMatches("Bearer s3cret2", "s3cret"), false);
  assert.equal(bearerMatches("bearer s3cret", "s3cret"), false);
  assert.equal(bearerMatches("s3cret", "s3cret"), false);
});

test("bearer: no header or no configured secret always fails", () => {
  assert.equal(bearerMatches(null, "s3cret"), false);
  assert.equal(bearerMatches("Bearer s3cret", undefined), false);
  assert.equal(bearerMatches("Bearer s3cret", ""), false);
  assert.equal(bearerMatches("Bearer ", ""), false);
  assert.equal(bearerMatches("Bearer undefined", undefined), false);
});
