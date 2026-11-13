// tests/sold-out.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AVAILABILITY_LABEL, RESET_HOUR_UTC, RESET_MINUTE_UTC, availabilityOf, soldOutUntil } from "../src/lib/sold-out.ts";

test("'heute aus' ends at the next nightly run", () => {
  assert.equal(soldOutUntil(new Date("2026-11-13T19:40:00Z")).toISOString(), "2026-11-14T03:30:00.000Z"); // dinner service
  assert.equal(soldOutUntil(new Date("2026-11-13T01:10:00Z")).toISOString(), "2026-11-13T03:30:00.000Z"); // after midnight, same night
  assert.equal(soldOutUntil(new Date("2026-11-13T03:30:00Z")).toISOString(), "2026-11-14T03:30:00.000Z"); // exactly at the run: next one
  assert.equal(soldOutUntil(new Date("2026-12-31T22:00:00Z")).toISOString(), "2027-01-01T03:30:00.000Z");
});

test("the three states an owner sees", () => {
  assert.equal(availabilityOf({ is_active: true, sold_out_until: null }), "on");
  assert.equal(availabilityOf({ is_active: true, sold_out_until: "2026-11-14T03:30:00Z" }), "on");
  assert.equal(availabilityOf({ is_active: false, sold_out_until: "2026-11-14T03:30:00Z" }), "today");
  assert.equal(availabilityOf({ is_active: false, sold_out_until: null }), "open");
  assert.equal(availabilityOf({ is_active: false }), "open");
  assert.deepEqual(AVAILABILITY_LABEL, { on: "verfügbar", today: "heute aus", open: "aus" });
});

test("the nightly run is scheduled at the time the code assumes", () => {
  const crons = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")).crons;
  const job = crons.find((c) => c.path === "/api/cron/sold-out-reset");
  assert.ok(job, "cron missing in vercel.json");
  assert.equal(job.schedule, `${RESET_MINUTE_UTC} ${RESET_HOUR_UTC} * * *`);
});
