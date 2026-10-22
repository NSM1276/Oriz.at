// tests/media.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isVideoUrl, originalPath, thumbPath, thumbUrl } from "../src/lib/media.ts";

const BASE = "https://x.supabase.co/storage/v1/object/public/oriz-photos/carta/v1/items";

test("thumbUrl: uploaded dish photo gets its small copy, version kept", () => {
  assert.equal(thumbUrl(`${BASE}/abc.webp?v=12ab`), `${BASE}/abc.sm.webp?v=12ab`);
  assert.equal(thumbUrl(`${BASE}/abc.webp`), `${BASE}/abc.sm.webp`);
});

test("thumbUrl: everything else unchanged", () => {
  for (const url of [
    `${BASE}/abc.sm.webp?v=1`,
    `${BASE}/abc.orig.webp`,
    "https://x.supabase.co/storage/v1/object/public/oriz-photos/carta/v1/cover.webp?v=1",
    "https://images.unsplash.com/photo-1.webp",
    "/demo/bruschetta.jpg",
    `${BASE}/clip.mp4`,
  ]) {
    assert.equal(thumbUrl(url), url, url);
  }
});

test("storage paths next to the photo", () => {
  assert.equal(thumbPath("carta/v1/items/abc.webp"), "carta/v1/items/abc.sm.webp");
  assert.equal(originalPath("carta/v1/items/abc.webp"), "carta/v1/items/abc.orig.webp");
});

test("isVideoUrl", () => {
  assert.equal(isVideoUrl(`${BASE}/clip.mp4?v=1`), true);
  assert.equal(isVideoUrl(`${BASE}/abc.webp`), false);
});
