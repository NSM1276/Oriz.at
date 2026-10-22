import "server-only";
import { cache } from "react";
import { serviceClient } from "@/lib/auth";
import { entitlementsFor, type Entitlements, type Subscription } from "./entitlements";

/** The venue's subscription → what it may use. One query per request. */
export const getEntitlements = cache(async (venueId: string): Promise<Entitlements> => {
  const { data } = await serviceClient()
    .from("subscriptions")
    .select("plan, status, trial_ends_at")
    .eq("venue_id", venueId)
    .maybeSingle<Subscription>();
  return entitlementsFor(data ?? null);
});
