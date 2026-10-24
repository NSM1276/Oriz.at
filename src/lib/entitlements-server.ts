import "server-only";
import { cache } from "react";
import { serviceClient } from "@/lib/auth";
import { entitlementsFor, type Entitlements, type Subscription } from "./entitlements";

/** The venue's subscription → what it may use. One query per request. */
export const getEntitlements = cache(async (venueId: string): Promise<Entitlements> => {
  // "*" rather than a column list: languages_all arrives with migration 0026 and must not break older databases.
  const { data } = await serviceClient()
    .from("subscriptions")
    .select("*")
    .eq("venue_id", venueId)
    .maybeSingle<Subscription>();
  return entitlementsFor(data ?? null);
});
