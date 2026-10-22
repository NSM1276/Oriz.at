// What a venue may use, derived from its subscription row. Pure — unit-tested.
//
// Plans (prices excl. VAT, per month; also written in the website copy, a test keeps both in step):
//   Starter 19 € — one menu, everything a single venue needs.
//   Pro     39 € — Screen (TV board), several menus, print design.
// A trial gives the Pro features for 14 days, so owners meet them before they pay.
//
// The owner cannot change any of this: the subscriptions table is written by the server only,
// and the plan column of venues is protected by a trigger.

export type PlanId = "starter" | "pro";
export type SubStatus = "trialing" | "active" | "past_due" | "canceled" | "comped";
export type Subscription = { plan: PlanId; status: SubStatus; trial_ends_at: string | null };

export const PLAN_PRICE_EUR: Record<PlanId, number> = { starter: 19, pro: 39 };
export const PLAN_NAME: Record<PlanId, string> = { starter: "Starter", pro: "Pro" };
export const TRIAL_DAYS = 14;

type Features = {
  /** The TV board (Screen). */
  screen: boolean;
  /** How many separate menus (lunch, dinner, drinks…) the venue may have. */
  maxMenus: number;
  /** Print design (own colours, logo, fixed pages). */
  printDesign: boolean;
};

const FEATURES: Record<PlanId, Features> = {
  starter: { screen: false, maxMenus: 1, printDesign: false },
  pro: { screen: true, maxMenus: 5, printDesign: true },
};

export type Entitlements = Features & {
  /** "trial" while the free period runs, otherwise the plan. */
  tier: "trial" | PlanId;
  label: string;
  trialEndsAt: Date | null;
  /** The free period is over and nothing was bought: Starter features, plus a reminder. */
  trialExpired: boolean;
};

export function entitlementsFor(sub: Subscription | null | undefined, now: Date = new Date()): Entitlements {
  // No subscription row at all: the safe default is the smaller plan.
  if (!sub) return { ...FEATURES.starter, tier: "starter", label: PLAN_NAME.starter, trialEndsAt: null, trialExpired: false };

  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;

  if (sub.status === "trialing") {
    const running = !trialEnd || now.getTime() <= trialEnd.getTime();
    if (running) return { ...FEATURES.pro, tier: "trial", label: "Testphase", trialEndsAt: trialEnd, trialExpired: false };
    return { ...FEATURES.starter, tier: "starter", label: PLAN_NAME.starter, trialEndsAt: trialEnd, trialExpired: true };
  }

  // A cancelled subscription falls back to Starter; "past_due" keeps its plan until it is cancelled.
  const plan: PlanId = sub.status === "canceled" ? "starter" : sub.plan;
  return { ...FEATURES[plan], tier: plan, label: PLAN_NAME[plan], trialEndsAt: trialEnd, trialExpired: false };
}

export const UPGRADE_MAIL = "office@oriz.at";

/** Why a feature is locked, for the screens that explain it. */
export function lockedText(feature: "screen" | "menus" | "printDesign"): { title: string; body: string } {
  switch (feature) {
    case "screen":
      return { title: "Screen ist Teil von Pro", body: "Ihre Karte läuft automatisch auf dem Fernseher im Lokal. Mit Pro schalten wir es für Sie frei." };
    case "menus":
      return { title: "Mehrere Karten gibt es mit Pro", body: "Starter enthält eine Karte. Mit Pro können Sie bis zu fünf Karten führen, etwa Mittag, Abend und Getränke." };
    case "printDesign":
      return { title: "Druck-Design ist Teil von Pro", body: "Ihre Farben, Ihr Logo, feste Seiten zum einzelnen Nachdrucken." };
  }
}

export function upgradeMailto(venueName: string): string {
  const subject = `Tarif Pro für ${venueName}`;
  return `mailto:${UPGRADE_MAIL}?subject=${encodeURIComponent(subject)}`;
}
