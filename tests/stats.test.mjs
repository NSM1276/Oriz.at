// tests/stats.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_TABLE, cleanPeriod, dayRange, formatWait, summarizeCalls, summarizeViews, topDishes, viennaDate } from "../src/lib/stats.ts";

test("Vienna day, not UTC: 23:30 UTC on 24 Oct is already 25 Oct in Vienna", () => {
  assert.equal(viennaDate(new Date("2026-10-24T23:30:00Z")), "2026-10-25");
  assert.equal(viennaDate(new Date("2026-10-24T10:00:00Z")), "2026-10-24");
});

test("day range: oldest first, ends today, crosses month ends", () => {
  assert.deepEqual(dayRange(3, new Date("2026-11-01T10:00:00Z")), ["2026-10-30", "2026-10-31", "2026-11-01"]);
  assert.equal(dayRange(30, new Date("2026-10-24T10:00:00Z")).length, 30);
});

test("period: only 7, 30, 90; anything else is 30", () => {
  assert.equal(cleanPeriod("7"), 7);
  assert.equal(cleanPeriod("90"), 90);
  assert.equal(cleanPeriod("365"), 30);
  assert.equal(cleanPeriod(undefined), 30);
});

test("views: per day with zeros, tables vs. no table, days outside the period ignored", () => {
  const days = ["2026-10-22", "2026-10-23", "2026-10-24"];
  const rows = [
    { day: "2026-10-22", kind: "view", ref: "t1", n: 5 },
    { day: "2026-10-24", kind: "view", ref: "t1", n: 2 },
    { day: "2026-10-24", kind: "view", ref: "t2", n: 9 },
    { day: "2026-10-24", kind: "view", ref: NO_TABLE, n: 4 },
    { day: "2026-10-01", kind: "view", ref: "t1", n: 100 },
    { day: "2026-10-24", kind: "dish", ref: "d1", n: 50 },
  ];
  const s = summarizeViews(rows, days);
  assert.equal(s.total, 20);
  assert.deepEqual(s.perDay.map((d) => d.n), [5, 0, 15]);
  assert.deepEqual(s.byTable, [{ ref: "t2", n: 9 }, { ref: "t1", n: 7 }]);
  assert.equal(s.noTable, 4);
  assert.deepEqual(s.busiestDay, { day: "2026-10-24", n: 15 });
  assert.equal(summarizeViews([], days).busiestDay, null);
});

test("top dishes: summed over the period, most opened first, limited", () => {
  const days = ["2026-10-23", "2026-10-24"];
  const rows = [
    { day: "2026-10-23", kind: "dish", ref: "a", n: 3 },
    { day: "2026-10-24", kind: "dish", ref: "a", n: 4 },
    { day: "2026-10-24", kind: "dish", ref: "b", n: 9 },
    { day: "2026-10-24", kind: "dish", ref: "c", n: 1 },
  ];
  assert.deepEqual(topDishes(rows, days, 2), [{ ref: "b", n: 9 }, { ref: "a", n: 7 }]);
});

test("calls: by kind, median wait, share within two minutes, unanswered", () => {
  const t = (s) => new Date(Date.UTC(2026, 9, 24, 12, 0, s)).toISOString();
  const calls = [
    { kind: "bill", status: "done", created_at: t(0), accepted_at: t(30), closed_at: t(200) },
    { kind: "bill", status: "accepted", created_at: t(0), accepted_at: t(90), closed_at: null },
    { kind: "order", status: "done", created_at: t(0), accepted_at: null, closed_at: t(300) },
    { kind: "help", status: "cancelled", created_at: t(0), accepted_at: null, closed_at: t(20) },
  ];
  const s = summarizeCalls(calls);
  assert.equal(s.total, 4);
  assert.deepEqual(s.byKind, { order: 1, bill: 2, help: 1 });
  assert.equal(s.medianSeconds, 90);
  assert.equal(s.withinTwoMinutes, 2 / 3);
  assert.equal(s.unanswered, 1);
  assert.equal(summarizeCalls([]).medianSeconds, null);
});

test("wait as text", () => {
  assert.equal(formatWait(42), "42 s");
  assert.equal(formatWait(150), "3 min");
  assert.equal(formatWait(3900), "1 h 5 min");
});
