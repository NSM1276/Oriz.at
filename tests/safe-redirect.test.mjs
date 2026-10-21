// tests/safe-redirect.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "../src/lib/safe-redirect.ts";

test("keeps paths on this site", () => {
  assert.equal(safeNextPath("/admin"), "/admin");
  assert.equal(safeNextPath("/app/neu"), "/app/neu");
  assert.equal(safeNextPath("/admin/carta/tosca?tab=menu#top"), "/admin/carta/tosca?tab=menu#top");
});

test("falls back when nothing usable is given", () => {
  assert.equal(safeNextPath(null), "/admin");
  assert.equal(safeNextPath(undefined), "/admin");
  assert.equal(safeNextPath(""), "/admin");
  assert.equal(safeNextPath("admin"), "/admin");
  assert.equal(safeNextPath(null, "/app"), "/app");
});

test("rejects every way out to another site", () => {
  for (const evil of [
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\\/evil.com",
    "/.//evil.com",
    "/%2F/evil.com/..//evil.com",
    "javascript:alert(1)",
  ]) {
    const out = safeNextPath(evil);
    assert.ok(out.startsWith("/") && !out.startsWith("//") && !out.startsWith("/\\"), `${JSON.stringify(evil)} → ${out}`);
    assert.equal(new URL(out, "https://www.oriz.at").origin, "https://www.oriz.at", `${JSON.stringify(evil)} → ${out}`);
  }
});
