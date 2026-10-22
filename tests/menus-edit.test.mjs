// tests/menus-edit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanMenuInput, reorder } from "../src/lib/menus-edit.ts";
import { menuLimitProblem } from "../src/lib/entitlements.ts";
import { formatSchedule } from "../src/lib/menu-schedule.ts";

test("a menu without a schedule is fine", () => {
  const r = cleanMenuInput({ name: "  Getränke  ", days: [], from: null, to: null });
  assert.deepEqual(r, { ok: true, menu: { name: "Getränke", days: [], from: null, to: null } });
  assert.deepEqual(cleanMenuInput({ name: "A", days: [], from: "", to: "" }).menu, { name: "A", days: [], from: null, to: null });
});

test("a full schedule: days come out in week order and the text reads like the guest menu's", () => {
  const r = cleanMenuInput({ name: "Mittag", days: ["fri", "mon", "tue"], from: "11:30", to: "15:00" });
  assert.equal(r.ok, true);
  assert.deepEqual(r.menu.days, ["mon", "tue", "fri"]);
  assert.equal(formatSchedule({ id: "x", name: "Mittag", position: 0, active_days: r.menu.days, time_from: r.menu.from, time_to: r.menu.to }), "Mo/Di/Fr 11:30–15:00");
});

test("half a schedule is refused: it would never match", () => {
  const msg = /Tage und Uhrzeit/;
  assert.match(cleanMenuInput({ name: "A", days: ["mon"], from: null, to: null }).error, msg);
  assert.match(cleanMenuInput({ name: "A", days: [], from: "11:00", to: "14:00" }).error, msg);
  assert.match(cleanMenuInput({ name: "A", days: ["mon"], from: "11:00", to: null }).error, msg);
});

test("times must be real, and from must come before to (no overnight spans)", () => {
  assert.match(cleanMenuInput({ name: "A", days: ["mon"], from: "25:00", to: "26:00" }).error, /Uhrzeit/);
  assert.match(cleanMenuInput({ name: "A", days: ["mon"], from: "9:00", to: "14:00" }).error, /Uhrzeit/);
  assert.match(cleanMenuInput({ name: "A", days: ["mon"], from: "22:00", to: "02:00" }).error, /vor/);
  assert.match(cleanMenuInput({ name: "A", days: ["mon"], from: "11:00", to: "11:00" }).error, /vor/);
});

test("name and days are checked", () => {
  assert.match(cleanMenuInput({ name: "   ", days: [] }).error, /Namen/);
  assert.match(cleanMenuInput({ name: "x".repeat(61), days: [] }).error, /höchstens 60/);
  assert.match(cleanMenuInput({ name: "A", days: ["monday"] }).error, /Wochentage/);
  assert.match(cleanMenuInput({ name: "A", days: "mon" }).error, /Wochentage/);
  assert.equal(cleanMenuInput(null).ok, false);
});

test("reordering moves one place and stops at the ends", () => {
  assert.deepEqual(reorder(["a", "b", "c"], "b", -1), ["b", "a", "c"]);
  assert.deepEqual(reorder(["a", "b", "c"], "b", 1), ["a", "c", "b"]);
  assert.deepEqual(reorder(["a", "b", "c"], "a", -1), ["a", "b", "c"]);
  assert.deepEqual(reorder(["a", "b", "c"], "c", 1), ["a", "b", "c"]);
  assert.deepEqual(reorder(["a", "b"], "zzz", 1), ["a", "b"]);
});

test("plan limit: Starter has no extra menus, Pro up to five", () => {
  assert.match(menuLimitProblem(0, 1), /Pro/);
  assert.equal(menuLimitProblem(0, 5), null);
  assert.equal(menuLimitProblem(4, 5), null);
  assert.match(menuLimitProblem(5, 5), /Mehr als 5/);
});
