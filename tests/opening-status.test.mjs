// tests/opening-status.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { openStatus, viennaClock } from "../src/lib/opening-status.ts";

// 24 Oct 2026 is a Saturday; Vienna is UTC+2 until 25 Oct (summer time).
const at = (iso) => new Date(iso);

test("Vienna clock, not UTC", () => {
  assert.deepEqual(viennaClock(at("2026-10-24T10:30:00Z")), { day: "sat", minutes: 12 * 60 + 30 });
  assert.deepEqual(viennaClock(at("2026-10-24T22:30:00Z")), { day: "sun", minutes: 30 });
});

const hours = { sat: [["11:00", "14:30"], ["17:30", "23:00"]], sun: [["18:00", "02:00"]], tue: [["11:00", "22:00"]] };

test("open now, until the end of the current range", () => {
  assert.deepEqual(openStatus(hours, at("2026-10-24T10:00:00Z")), { open: true, until: "14:30" });
  assert.deepEqual(openStatus(hours, at("2026-10-24T18:00:00Z")), { open: true, until: "23:00" });
});

test("lunch break: closed, opens again today", () => {
  assert.deepEqual(openStatus(hours, at("2026-10-24T13:00:00Z")), { open: false, opensAt: "17:30", today: true, day: "sat" });
});

test("after midnight a range from yesterday still counts", () => {
  // Monday 01:00 in Vienna (winter time, UTC+1) → Sunday's 18:00–02:00 is still running.
  assert.deepEqual(openStatus(hours, at("2026-10-26T00:00:00Z")), { open: true, until: "02:00" });
});

test("closed today: the next day with hours", () => {
  // Monday 12:00 → next is Tuesday 11:00.
  assert.deepEqual(openStatus(hours, at("2026-10-26T11:00:00Z")), { open: false, opensAt: "11:00", today: false, day: "tue" });
});

test("no hours entered: nothing to say", () => {
  assert.equal(openStatus(null, at("2026-10-24T10:00:00Z")), null);
  assert.equal(openStatus({}, at("2026-10-24T10:00:00Z")), null);
});
