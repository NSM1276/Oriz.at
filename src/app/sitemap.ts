import type { MetadataRoute } from "next";
import { serviceClient } from "@/lib/auth";
import { isListedVenue } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// The sitemap lists the marketing pages and the guest pages of real restaurants.
// Demo and test restaurants are left out (see isListedVenue), and so are Casa guest cards for now:
// Casa is on hold and the only one is a demo.
//
// It reads with the server key, not with a visitor's session, so it can be built ahead of time and
// refreshed hourly instead of being rendered on every request.

export const revalidate = 3600;

type VenueRow = { slug: string; subscriptions: { status: string } | { status: string }[] | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/en`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/carta`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/registrieren`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/screen`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/casa`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/impressum`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/datenschutz`, changeFrequency: "yearly", priority: 0.1 },
  ];

  try {
    const { data } = await serviceClient().from("venues").select("slug, subscriptions(status)").not("slug", "is", null).returns<VenueRow[]>();
    const venues = (data ?? [])
      .filter((v) => isListedVenue({ slug: v.slug, status: (Array.isArray(v.subscriptions) ? v.subscriptions[0] : v.subscriptions)?.status ?? null }))
      .map((v) => ({ url: `${SITE_URL}/${v.slug}`, changeFrequency: "daily" as const, priority: 0.6 }));
    return [...pages, ...venues];
  } catch (err) {
    // Database unreachable while refreshing: ship the fixed pages rather than nothing.
    console.error("[sitemap] venue list failed, serving the fixed pages only:", err);
    return pages;
  }
}
