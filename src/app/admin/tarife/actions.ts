"use server";

import { revalidatePath } from "next/cache";
import { getUser, isPlatformAdmin, serviceClient } from "@/lib/auth";
import type { PlanId, SubStatus } from "@/lib/entitlements";

export type TarifResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLANS: PlanId[] = ["starter", "pro"];
const STATUSES: SubStatus[] = ["trialing", "active", "comped", "past_due", "canceled"];

/**
 * Sets a venue's plan by hand — until Stripe does it. Only platform admins.
 * The legacy venues.plan column (used by the old admin screens) follows along.
 */
export async function setSubscription(venueId: string, plan: PlanId, status: SubStatus, trialEndsAt: string | null, languagesAll = false): Promise<TarifResult> {
  const user = await getUser();
  if (!user || !(await isPlatformAdmin(user.id))) throw new Error("forbidden");
  if (!UUID.test(venueId) || !PLANS.includes(plan) || !STATUSES.includes(status)) return { ok: false, error: "Ungültige Eingabe." };

  let trialEnd: string | null = null;
  if (trialEndsAt) {
    const d = new Date(trialEndsAt);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Das Datum sieht nicht richtig aus." };
    trialEnd = d.toISOString();
  }
  if (status === "trialing" && !trialEnd) return { ok: false, error: "Für die Testphase bitte ein Enddatum angeben." };

  const db = serviceClient();
  const { error } = await db
    .from("subscriptions")
    .upsert(
      { venue_id: venueId, plan, status, trial_ends_at: status === "trialing" ? trialEnd : null, languages_all: !!languagesAll, updated_at: new Date().toISOString() },
      { onConflict: "venue_id" },
    );
  // languages_all needs migration 0026; until then the column is missing and the save says so.
  if (error) return { ok: false, error: error.message.includes("languages_all") ? "Migration 0026 (languages_all) fehlt noch in der Datenbank." : "Konnte nicht gespeichert werden." };

  await db.from("venues").update({ plan: status === "trialing" ? "trial" : plan }).eq("id", venueId);
  revalidatePath("/admin/tarife");
  return { ok: true };
}
