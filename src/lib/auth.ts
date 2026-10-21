import "server-only";
import { cache } from "react";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Roles live in the database (migration 0016): platform_admins for us,
// venue_members for restaurant staff. Nothing here knows an email address.

export type VenueRole = "owner" | "manager";

export function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/** The signed-in user for this request, or null. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const isPlatformAdmin = cache(async (userId: string): Promise<boolean> => {
  const { data } = await serviceClient()
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
});

/** The user's role at a venue; platform admins count as owner everywhere. */
export const venueRole = cache(async (userId: string, venueId: string): Promise<VenueRole | null> => {
  if (await isPlatformAdmin(userId)) return "owner";
  const { data } = await serviceClient()
    .from("venue_members")
    .select("role")
    .eq("user_id", userId)
    .eq("venue_id", venueId)
    .maybeSingle<{ role: VenueRole }>();
  return data?.role ?? null;
});

export type MemberVenue = { id: string; slug: string; name: string; role: VenueRole };

/** Venues the user can manage. Platform admins get every venue. */
export const memberVenues = cache(async (userId: string): Promise<MemberVenue[]> => {
  const svc = serviceClient();
  if (await isPlatformAdmin(userId)) {
    const { data } = await svc.from("venues").select("id, slug, name").order("name");
    return (data ?? []).map((v) => ({ ...v, role: "owner" as const }));
  }
  const { data } = await svc
    .from("venue_members")
    .select("role, venues(id, slug, name)")
    .eq("user_id", userId)
    .returns<{ role: VenueRole; venues: { id: string; slug: string; name: string } }[]>();
  return (data ?? [])
    .map((m) => ({ ...m.venues, role: m.role }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
});
