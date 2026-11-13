// tests/entitlements.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { PRO_MAX_MENUS, entitlementsFor, lockedText, standingOf, upgradeMailto } from "../src/lib/entitlements.ts";

const NOW = new Date("2026-10-22T12:00:00Z");
const sub = (plan, status, trial_ends_at = null) => ({ plan, status, trial_ends_at });

// One plan since 2026-11-12: old rows say "starter" or "pro", both now get everything.
test("one plan: old starter and pro rows get the same features", () => {
  for (const plan of ["starter", "pro"]) {
    const e = entitlementsFor(sub(plan, "active"), NOW);
    assert.equal(e.maxMenus, PRO_MAX_MENUS, plan);
    assert.equal(e.printDesign, true, plan);
    assert.equal(e.locked, false, plan);
    assert.equal(e.label, "ORIZ", plan);
  }
});

test("a running trial has everything", () => {
  const e = entitlementsFor(sub("starter", "trialing", "2026-11-01T00:00:00Z"), NOW);
  assert.equal(e.tier, "trial");
  assert.equal(e.label, "Testphase");
  assert.equal(e.printDesign, true);
  assert.equal(e.trialExpired, false);
});

test("an expired trial closes the admin and says so", () => {
  const e = entitlementsFor(sub("starter", "trialing", "2026-10-01T00:00:00Z"), NOW);
  assert.equal(e.trialExpired, true);
  assert.equal(e.locked, true);
});

test("comped venues (ours) and unpaid-but-not-cancelled stay open", () => {
  assert.equal(entitlementsFor(sub("pro", "comped"), NOW).locked, false);
  assert.equal(entitlementsFor(sub("pro", "past_due"), NOW).locked, false);
});

test("a cancelled subscription closes the admin", () => {
  assert.equal(entitlementsFor(sub("pro", "canceled"), NOW).locked, true);
});

test("no subscription row does not lock anyone out", () => {
  assert.equal(entitlementsFor(null, NOW).locked, false);
  assert.equal(entitlementsFor(undefined, NOW).maxMenus, PRO_MAX_MENUS);
});

test("standing for the platform admin's list", () => {
  assert.deepEqual(standingOf(sub("pro", "trialing", "2026-10-25T12:00:00Z"), NOW), { kind: "trial", daysLeft: 3, label: "Testphase · noch 3 Tage" });
  assert.equal(standingOf(sub("pro", "trialing", "2026-10-23T13:00:00Z"), NOW).label, "Testphase · noch 1 Tag");
  assert.equal(standingOf(sub("pro", "trialing", "2026-10-22T20:00:00Z"), NOW).label, "Testphase · letzter Tag");
  assert.equal(standingOf(sub("pro", "trialing", "2026-10-01T00:00:00Z"), NOW).kind, "trial_over");
  assert.equal(standingOf(sub("pro", "active"), NOW).label, "Bezahlt");
  assert.equal(standingOf(sub("pro", "comped"), NOW).kind, "free");
  assert.equal(standingOf(sub("pro", "past_due"), NOW).kind, "due");
  assert.equal(standingOf(sub("pro", "canceled"), NOW).kind, "ended");
  assert.equal(standingOf(null, NOW).kind, "none");
});

test("owner-facing texts no longer speak of Starter or Pro", () => {
  for (const f of ["screen", "menus", "printDesign"]) {
    const t = lockedText(f);
    assert.ok(!/(Starter|Pro)/.test(t.title + t.body), f);
  }
  assert.match(upgradeMailto("Café Müller"), /^mailto:office@oriz\.at\?subject=Abo%20f%C3%BCr%20Caf%C3%A9%20M%C3%BCller$/);
});
