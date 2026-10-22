// tests/entitlements.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { PLAN_PRICE_EUR, entitlementsFor, lockedText, upgradeMailto } from "../src/lib/entitlements.ts";
import { translations } from "../src/lib/i18n.ts";

const NOW = new Date("2026-10-22T12:00:00Z");
const sub = (plan, status, trial_ends_at = null) => ({ plan, status, trial_ends_at });

test("starter: one menu, no Screen, no print design", () => {
  const e = entitlementsFor(sub("starter", "active"), NOW);
  assert.equal(e.tier, "starter");
  assert.equal(e.screen, false);
  assert.equal(e.maxMenus, 1);
  assert.equal(e.printDesign, false);
});

test("pro: Screen, five menus, print design", () => {
  const e = entitlementsFor(sub("pro", "active"), NOW);
  assert.equal(e.tier, "pro");
  assert.equal(e.screen, true);
  assert.equal(e.maxMenus, 5);
  assert.equal(e.printDesign, true);
});

test("a running trial has the Pro features even though the row says starter", () => {
  const e = entitlementsFor(sub("starter", "trialing", "2026-11-01T00:00:00Z"), NOW);
  assert.equal(e.tier, "trial");
  assert.equal(e.label, "Testphase");
  assert.equal(e.screen, true);
  assert.equal(e.trialExpired, false);
});

test("an expired trial falls back to Starter and says so", () => {
  const e = entitlementsFor(sub("starter", "trialing", "2026-10-01T00:00:00Z"), NOW);
  assert.equal(e.tier, "starter");
  assert.equal(e.screen, false);
  assert.equal(e.trialExpired, true);
});

test("comped venues (ours) and unpaid-but-not-cancelled keep their plan", () => {
  assert.equal(entitlementsFor(sub("pro", "comped"), NOW).screen, true);
  assert.equal(entitlementsFor(sub("pro", "past_due"), NOW).screen, true);
});

test("a cancelled subscription drops to Starter, whatever the plan was", () => {
  const e = entitlementsFor(sub("pro", "canceled"), NOW);
  assert.equal(e.tier, "starter");
  assert.equal(e.screen, false);
});

test("no subscription row: the smaller plan", () => {
  assert.equal(entitlementsFor(null, NOW).screen, false);
  assert.equal(entitlementsFor(undefined, NOW).maxMenus, 1);
});

test("the prices in the code match the website copy, in German and English", () => {
  for (const lang of ["de", "en"]) {
    const plans = translations[lang].pricing.plans;
    const starter = plans.find((p) => p.plan === "starter");
    const pro = plans.find((p) => p.plan === "pro");
    assert.equal(starter.price, `€ ${PLAN_PRICE_EUR.starter}`, `${lang} starter`);
    assert.equal(pro.price, `€ ${PLAN_PRICE_EUR.pro}`, `${lang} pro`);
  }
});

test("the website does not promise what the product lacks", () => {
  const text = JSON.stringify(translations.de.pricing) + JSON.stringify(translations.en.pricing);
  assert.ok(!/bald|soon|20\+|Kreditkarte|credit card/i.test(text));
});

test("locked texts and the upgrade mail", () => {
  assert.match(lockedText("screen").title, /Pro/);
  assert.match(upgradeMailto("Café Müller"), /^mailto:office@oriz\.at\?subject=Tarif%20Pro%20f%C3%BCr%20Caf%C3%A9%20M%C3%BCller$/);
});
