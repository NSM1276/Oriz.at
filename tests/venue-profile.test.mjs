// tests/venue-profile.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanAbout, cleanHours, normalizeInstagram, normalizePhone, normalizeUrl, profileChecklist } from "../src/lib/venue-profile.ts";

test("web addresses: scheme added, empty is null, nonsense is invalid", () => {
  assert.equal(normalizeUrl("trattoria.at"), "https://trattoria.at");
  assert.equal(normalizeUrl("https://www.trattoria.at/menu"), "https://www.trattoria.at/menu");
  assert.equal(normalizeUrl("  "), null);
  assert.equal(normalizeUrl("keine website"), undefined);
  assert.equal(normalizeUrl("javascript:alert(1)"), undefined);
});

test("instagram: handle, @handle or link; other sites are not instagram", () => {
  assert.equal(normalizeInstagram("@trattoria.wien"), "https://www.instagram.com/trattoria.wien");
  assert.equal(normalizeInstagram("trattoria_wien"), "https://www.instagram.com/trattoria_wien");
  assert.equal(normalizeInstagram("instagram.com/trattoria"), "https://instagram.com/trattoria");
  assert.equal(normalizeInstagram("facebook.com/trattoria"), undefined);
  assert.equal(normalizeInstagram(""), null);
});

test("phone: as typed, needs digits", () => {
  assert.equal(normalizePhone("+43 1 234 5600"), "+43 1 234 5600");
  assert.equal(normalizePhone("0660/123 45 67"), "0660/123 45 67");
  assert.equal(normalizePhone("ruf an"), undefined);
  assert.equal(normalizePhone("123"), undefined);
  assert.equal(normalizePhone(""), null);
});

test("hours: two ranges per day at most, bad times dropped, after midnight allowed", () => {
  const h = cleanHours({ mon: [["11:00", "14:30"], ["17:30", "23:00"], ["23:30", "23:45"]], tue: [["25:00", "26:00"]], fri: [["18:00", "02:00"]], xyz: [["10:00", "11:00"]] });
  assert.deepEqual(h, { mon: [["11:00", "14:30"], ["17:30", "23:00"]], fri: [["18:00", "02:00"]] });
  assert.equal(cleanHours({}), null);
  assert.equal(cleanHours("mon"), null);
});

test("about: trimmed, capped, blank is null", () => {
  assert.equal(cleanAbout("  Seit 1987  "), "Seit 1987");
  assert.equal(cleanAbout("x".repeat(500)).length, 400);
  assert.equal(cleanAbout(" "), null);
});

test("checklist: what a guest misses, in order", () => {
  const empty = { about: null, cover_url: null, gallery: [], phone: null, address: null, opening_hours: null, website_url: null, instagram_url: null, google_review_url: null };
  assert.equal(profileChecklist(empty).filter((c) => c.done).length, 0);
  const some = { ...empty, about: "x", phone: "1", instagram_url: "https://www.instagram.com/x", opening_hours: { mon: [["10:00", "11:00"]] } };
  assert.deepEqual(profileChecklist(some).filter((c) => c.done).map((c) => c.key), ["about", "phone", "hours", "website"]);
});
