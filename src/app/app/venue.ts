import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getUser, memberVenues, serviceClient, venueRole, type VenueRole } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements-server";

export type AppVenue = { id: string; slug: string; name: string; currency: string };

/** Signed-in user or a redirect to the login that comes back to `next`. */
export async function requireUser(next: string) {
  const user = await getUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** The venue behind /app/<slug>, only for its members (and platform admins). */
export const requireVenue = cache(async (slug: string): Promise<{ venue: AppVenue; role: VenueRole; venueCount: number }> => {
  const user = await requireUser(`/app/${slug}`);
  const { data: venue } = await serviceClient()
    .from("venues")
    .select("id, slug, name, currency")
    .eq("slug", slug)
    .maybeSingle<AppVenue>();
  if (!venue) notFound();
  const role = await venueRole(user.id, venue.id);
  if (!role) notFound();
  const venueCount = (await memberVenues(user.id)).length;
  return { venue, role, venueCount };
});

/**
 * Like requireVenue, for everything that changes the venue. After the trial, without a plan,
 * the admin is locked: writes land on the account page instead (the guest menu keeps running).
 */
export async function requireOpenVenue(slug: string) {
  const ctx = await requireVenue(slug);
  const ent = await getEntitlements(ctx.venue.id);
  if (ent.locked) redirect(`/app/${slug}/konto?gesperrt=1`);
  return ctx;
}
