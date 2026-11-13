// What a venue may use, derived from its subscription row. Pure — unit-tested.
//
// One plan since 2026-11-12: 19,90 € a month or 180 € a year (src/lib/offer.ts), everything included —
// several menus, print design. The database still says "starter" or "pro" (rows from before); both
// now mean the same. A trial gives everything (and every language) for 14 days.
//
// Languages: the plan includes German plus EN, IT, FR, ES (fixed). "20+ Sprachen" is an add-on on
// request (subscriptions.languages_all) that opens all languages.
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

/** Old two-plan prices; only the parked Screen landing page still reads them. */
export const PLAN_PRICE_EUR: Record<PlanId, number> = { starter: 19, pro: 39 };
export const PLAN_NAME: Record<PlanId, string> = { starter: "ORIZ", pro: "ORIZ" };
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

const ALL: Features = { screen: true, maxMenus: PRO_MAX_MENUS, printDesign: true };
const FEATURES: Record<PlanId, Features> = { starter: ALL, pro: ALL };

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

  // A cancelled subscription closes the admin; "past_due" keeps its plan until it is cancelled.
  const plan: PlanId = sub.status === "canceled" ? "starter" : sub.plan;
  // "comped" is ours (demos, pilots): every language, like the trial.
  return { ...none(FEATURES[plan], plan, PLAN_NAME[plan], trialEnd), locked: sub.status === "canceled", allLanguages: !!sub.languages_all || sub.status === "comped" };
}

/** Where a venue stands with us, in one word for the platform admin's list. */
export type Standing = {
  kind: "trial" | "trial_over" | "paid" | "free" | "due" | "ended" | "none";
  /** Whole days left in the trial (0 on its last day); null outside a trial. */
  daysLeft: number | null;
  label: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function standingOf(sub: Subscription | null | undefined, now: Date = new Date()): Standing {
  if (!sub) return { kind: "none", daysLeft: null, label: "Ohne Abo" };
  if (sub.status === "trialing") {
    const end = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : null;
    if (end !== null && now.getTime() > end) return { kind: "trial_over", daysLeft: null, label: "Testphase abgelaufen" };
    const days = end === null ? null : Math.floor((end - now.getTime()) / DAY_MS);
    return { kind: "trial", daysLeft: days, label: days === null ? "Testphase" : days === 0 ? "Testphase · letzter Tag" : `Testphase · noch ${days} ${days === 1 ? "Tag" : "Tage"}` };
  }
  if (sub.status === "active") return { kind: "paid", daysLeft: null, label: "Bezahlt" };
  if (sub.status === "comped") return { kind: "free", daysLeft: null, label: "Kostenlos (von uns)" };
  if (sub.status === "past_due") return { kind: "due", daysLeft: null, label: "Zahlung offen" };
  return { kind: "ended", daysLeft: null, label: "Beendet" };
}

/** The languages (besides German) this venue may show its guests. */
export function allowedLocales(ent: Pick<Entitlements, "allLanguages">): readonly MenuLocale[] {
  return ent.allLanguages ? MENU_LOCALES : PACKAGE_LOCALES;
}

/**
 * Why another menu may not be created, or null when it may. A limit of one means no separate
 * menu rows at all (guests then see the whole menu); the plan allows up to five rows.
 */
export function menuLimitProblem(existing: number, maxMenus: number): string | null {
  if (maxMenus <= 1) return "Mehrere Karten gibt es mit dem Abo.";
  if (existing >= maxMenus) return `Mehr als ${maxMenus} Karten sind nicht möglich.`;
  return null;
}

export const UPGRADE_MAIL = "office@oriz.at";

/** Why a feature is locked, for the screens that explain it. */
export function lockedText(feature: "screen" | "menus" | "printDesign" | "languages"): { title: string; body: string } {
  switch (feature) {
    case "screen":
      return { title: "Screen gehört zum Abo", body: "Ihre Karte läuft automatisch auf dem Fernseher im Lokal. Mit dem Abo schalten wir es für Sie frei." };
    case "menus":
      return { title: "Mehrere Karten gehören zum Abo", body: "Mit dem Abo führen Sie bis zu fünf Karten, etwa Mittag, Abend und Getränke." };
    case "printDesign":
      return { title: "Druck-Design gehört zum Abo", body: "Ihre Farben, Ihr Logo, feste Seiten zum einzelnen Nachdrucken." };
    case "languages":
      return { title: "20+ Sprachen als Zusatzpaket", body: "Ihr Tarif enthält Deutsch, Englisch, Italienisch, Französisch und Spanisch. Mit dem Zusatzpaket zeigen Sie Ihre Karte in über 20 Sprachen." };
  }
}

export function upgradeMailto(venueName: string, subjectText = `Abo für ${venueName}`): string {
  return `mailto:${UPGRADE_MAIL}?subject=${encodeURIComponent(subjectText)}`;
}
