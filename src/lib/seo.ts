// What search engines may see. Pure — unit-tested.

/**
 * Which restaurants belong in the sitemap and may be indexed.
 * Demo restaurants (fictional menus, "comped" = switched on by us) and our own test venues
 * are reachable by link but not listed: a search for "Sushi Schönbrunn" should not lead to a made-up place.
 * A pilot customer we give free access should be set to "active" (or "trialing") in /admin/tarife.
 */
export function isListedVenue(venue: { slug: string; status: string | null }): boolean {
  if (venue.status === "comped") return false;
  if (venue.slug.startsWith("qa-")) return false;
  return venue.status !== null; // no subscription row at all: not a customer yet
}

/**
 * Paths crawlers are asked to stay out of (robots.txt matches by prefix, "*" is any text, "$" the end).
 * "/i" is written "/i$": as a plain prefix it would also block /impressum.
 */
export const ROBOTS_DISALLOW = [
  "/admin",
  "/api/",
  "/app",
  "/auth/",
  "/service",
  "/s/", // staff pairing
  "/t/", // table entry
  "/i$", // iOS shortcut page
  "/screen/", // TV boards (the /screen product page stays open)
  "/*/print", // the old print page of a venue duplicates its menu
];
