// tests/service.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { hashSecret, newSecret } from "../src/lib/secrets.ts";
import { decideCall, isCallKind, normalizeDeviceName, onBoard } from "../src/lib/service.ts";

const NOW = Date.parse("2026-10-22T12:00:00Z");
const ago = (min) => new Date(NOW - min * 60_000).toISOString();

test("kinds", () => {
  for (const k of ["order", "bill", "help"]) assert.ok(isCallKind(k));
  for (const k of ["Bill", "", null, "drop table"]) assert.ok(!isCallKind(k));
});

test("secrets are random and hashed one-way", () => {
  const a = newSecret();
  const b = newSecret();
  assert.notEqual(a, b);
  assert.ok(a.length >= 43);
  assert.equal(hashSecret(a), hashSecret(a));
  assert.notEqual(hashSecret(a), a);
});

test("decideCall: first call is created", () => {
  assert.deepEqual(decideCall("bill", [], NOW), { action: "create" });
});

test("decideCall: same wish while pending is reused", () => {
  const recent = [{ kind: "bill", status: "accepted", created_at: ago(3) }];
  assert.deepEqual(decideCall("bill", recent, NOW), { action: "reuse", index: 0 });
});

test("decideCall: other kind, finished or stale calls do not block", () => {
  assert.deepEqual(decideCall("order", [{ kind: "bill", status: "open", created_at: ago(1) }], NOW), { action: "create" });
  assert.deepEqual(decideCall("bill", [{ kind: "bill", status: "done", created_at: ago(1) }], NOW), { action: "create" });
  assert.deepEqual(decideCall("bill", [{ kind: "bill", status: "open", created_at: ago(45) }], NOW), { action: "create" });
});

test("decideCall: too many calls in ten minutes", () => {
  const recent = Array.from({ length: 6 }, (_, i) => ({ kind: "help", status: "cancelled", created_at: ago(i) }));
  assert.deepEqual(decideCall("help", recent, NOW), { action: "limit" });
  const older = recent.map((c) => ({ ...c, created_at: ago(11) }));
  assert.deepEqual(decideCall("help", older, NOW), { action: "create" });
});

test("onBoard", () => {
  assert.ok(onBoard({ status: "open", created_at: ago(5), closed_at: null }, NOW));
  assert.ok(!onBoard({ status: "open", created_at: ago(31), closed_at: null }, NOW));
  assert.ok(onBoard({ status: "done", created_at: ago(20), closed_at: ago(9) }, NOW));
  assert.ok(!onBoard({ status: "cancelled", created_at: ago(20), closed_at: ago(11) }, NOW));
});

test("normalizeDeviceName", () => {
  assert.equal(normalizeDeviceName("  Bar   Tablet "), "Bar Tablet");
  assert.equal(normalizeDeviceName("  "), null);
  assert.equal(normalizeDeviceName("x".repeat(41)), null);
});
