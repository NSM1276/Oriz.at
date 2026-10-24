// What a venue may use, derived from its subscription row. Pure — unit-tested.
//
// Plans (prices per month, no VAT charged (small-business exemption); also written in the website copy, a test keeps both in step):
//   Starter 19 € — one menu, everything a single venue needs.
//   Pro     39 € — Screen (TV board), several menus, print design.
// A trial gives the Pro features (and every language) for 14 days, so owners meet them before they pay.
//
// Languages: every plan includes German plus EN, IT, FR, ES (fixed). "20+ Sprachen" is an add-on
// (subscriptions.languages_all) that opens all languages.
//
// After the trial, without a plan: the guest menu keeps working, the admin is locked until a plan
// is chosen — nothing that costs us time keeps running for free, but the hook stays.
//
// The owner cannot change any of this: the subscriptions table is written by the server only,
// and the plan column of venues is protected by a trigger.

import { MENU_LOCALES, PACKAGE_LOCALES, type MenuLocale } from "./locales.ts";

export type PlanId = "starter" | "pro";
export type SubStatus = "trialing" | "active" | "past_due" | "canceled" | "comped";
export type Subscription = { plan: PlanId; status: SubStatus; trial_ends_at: string | null; languages_all?: boolean | null };

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

export const PRO_MAX_MENUS = 5;

/** Dish photos during the free trial: enough for a real menu, not enough to fill our storage for free. */
export const TRIAL_MAX_PHOTOS = 60;
/** Days after the trial (or a cancellation) without a plan until the venue's photo files are deleted. */
export const PHOTO_GRACE_DAYS = 90;

/** How many dish photos a venue may hold; Infinity once it pays. */
export function maxPhotos(ent: Pick<Entitlements, "tier">): number {
  return ent.tier === "trial" ? TRIAL_MAX_PHOTOS : Infinity;
}

const FEATURES: Record<PlanId, Features> = {
  starter: { screen: false, maxMenus: 1, printDesign: false },
  pro: { screen: true, maxMenus: PRO_MAX_MENUS, printDesign: true },
};

export type Entitlements = Features & {
  /** "trial" while the free period runs, otherwise the plan. */
  tier: "trial" | PlanId;
  label: string;
  trialEndsAt: Date | null;
  /** The free period is over and nothing was bought. */
  trialExpired: boolean;
  /** Admin closed: the guest menu stays online, editing waits for a plan. */
  locked: boolean;
  /** All languages (the "20+ Sprachen" add-on, or the trial); otherwise the package of five. */
  allLanguages: boolean;
};

const none = (f: Features, tier: Entitlements["tier"], label: string, trialEndsAt: Date | null): Entitlements =>
  ({ ...f, tier, label, trialEndsAt, trialExpired: false, locked: false, allLanguages: false });

export function entitlementsFor(sub: Subscription | null | undefined, now: Date = new Date()): Entitlements {
  // No subscription row at all: the safe default is the smaller plan.
  if (!sub) return none(FEATURES.starter, "starter", PLAN_NAME.starter, null);

  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;

  if (sub.status === "trialing") {
    const running = !trialEnd || now.getTime() <= trialEnd.getTime();
    if (running) return { ...none(FEATURES.pro, "trial", "Testphase", trialEnd), allLanguages: true };
    return { ...none(FEATURES.starter, "starter", PLAN_NAME.starter, trialEnd), trialExpired: true, locked: true };
  }

  // A cancelled subscription falls back to Starter and closes the admin; "past_due" keeps its plan until it is cancelled.
  const plan: PlanId = sub.status === "canceled" ? "starter" : sub.plan;
  // "comped" is ours (demos, pilots): every language, like the trial.
  return { ...none(FEATURES[plan], plan, PLAN_NAME[plan], trialEnd), locked: sub.status === "canceled", allLanguages: !!sub.languages_all || sub.status === "comped" };
}

/** The languages (besides German) this venue may show its guests. */
export function allowedLocales(ent: Pick<Entitlements, "allLanguages">): readonly MenuLocale[] {
  return ent.allLanguages ? MENU_LOCALES : PACKAGE_LOCALES;
}

/**
 * Why another menu may not be created, or null when it may. Starter has one menu, which means no
 * separate menu rows at all (guests then see the whole menu); Pro has up to five rows.
 */
export function menuLimitProblem(existing: number, maxMenus: number): string | null {
  if (maxMenus <= 1) return "Mehrere Karten gibt es mit Pro.";
  if (existing >= maxMenus) return `Mehr als ${maxMenus} Karten sind nicht möglich.`;
  return null;
}

export const UPGRADE_MAIL = "office@oriz.at";

/** Why a feature is locked, for the screens that explain it. */
export function lockedText(feature: "screen" | "menus" | "printDesign" | "languages"): { title: string; body: string } {
  switch (feature) {
    case "screen":
      return { title: "Screen ist Teil von Pro", body: "Ihre Karte läuft automatisch auf dem Fernseher im Lokal. Mit Pro schalten wir es für Sie frei." };
    case "menus":
      return { title: "Mehrere Karten gibt es mit Pro", body: "Starter enthält eine Karte. Mit Pro können Sie bis zu fünf Karten führen, etwa Mittag, Abend und Getränke." };
    case "printDesign":
      return { title: "Druck-Design ist Teil von Pro", body: "Ihre Farben, Ihr Logo, feste Seiten zum einzelnen Nachdrucken." };
    case "languages":
      return { title: "20+ Sprachen als Zusatzpaket", body: "Ihr Tarif enthält Deutsch, Englisch, Italienisch, Französisch und Spanisch. Mit dem Zusatzpaket zeigen Sie Ihre Karte in über 20 Sprachen." };
  }
}

export function upgradeMailto(venueName: string, subjectText = `Tarif Pro für ${venueName}`): string {
  return `mailto:${UPGRADE_MAIL}?subject=${encodeURIComponent(subjectText)}`;
}
