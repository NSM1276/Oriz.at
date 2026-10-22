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

const DAY_NAME: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const httpUrl = (u: unknown): string | null => (typeof u === "string" && /^https?:\/\/\S+$/i.test(u.trim()) ? u.trim() : null);

type JsonLdVenue = {
  slug: string;
  name: string;
  about?: string | null;
  phone?: string | null;
  address?: string | null;
  price_range?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tripadvisor_url?: string | null;
  opening_hours?: Partial<Record<string, [string, string][]>> | null;
};

/**
 * schema.org Restaurant for a guest menu page. Only what the owner filled in; nothing is invented.
 * `siteUrl` has no trailing slash. Returns plain data: the caller serialises it (and escapes "<").
 */
export function restaurantJsonLd(v: JsonLdVenue, siteUrl: string): Record<string, unknown> {
  const url = `${siteUrl}/${v.slug}`;
  const hours = DAY_ORDER.flatMap((d) =>
    (v.opening_hours?.[d] ?? [])
      .filter((r) => Array.isArray(r) && TIME_RE.test(r[0]) && TIME_RE.test(r[1]))
      .map(([opens, closes]) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_NAME[d], opens, closes })),
  );
  const sameAs = [v.website_url, v.instagram_url, v.facebook_url, v.tripadvisor_url].map(httpUrl).filter((u): u is string => !!u);
  const image = [v.cover_url, v.logo_url].map(httpUrl).filter((u): u is string => !!u);
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: v.name,
    url,
    hasMenu: url,
    ...(v.about?.trim() && { description: v.about.trim() }),
    ...(v.phone?.trim() && { telephone: v.phone.trim() }),
    ...(v.address?.trim() && { address: { "@type": "PostalAddress", streetAddress: v.address.trim() } }),
    ...(v.price_range?.trim() && { priceRange: v.price_range.trim() }),
    ...(image.length > 0 && { image }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(hours.length > 0 && { openingHoursSpecification: hours }),
  };
}

/** JSON for a <script type="application/ld+json"> tag: "<" is escaped so nothing can close the tag early. */
export const jsonLdScript = (data: unknown): string => JSON.stringify(data).replace(/</g, "\\u003c");
