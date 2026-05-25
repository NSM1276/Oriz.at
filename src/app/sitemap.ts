import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

// Sitemap is regenerated on each ISR cycle (default 60s in this app).
// Includes static landing pages + every published Carta venue and Casa
// property. As soon as a new client is onboarded, their guest page
// shows up here within a minute.

const SITE = "https://oriz.at";

export const revalidate = 3600; // refresh sitemap hourly is plenty

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static, high-priority pages
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE}/carta`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/casa`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  // Dynamic: Carta venues and Casa properties — pulled live from DB
  let dynamic: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const [{ data: venues }, { data: casaProps }] = await Promise.all([
      supabase.from("venues").select("slug").not("slug", "is", null),
      supabase.schema("casa").from("properties").select("slug").not("slug", "is", null),
    ]);

    if (venues) {
      dynamic = dynamic.concat(
        venues.map((v: { slug: string }) => ({
          url: `${SITE}/${v.slug}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.7,
        })),
      );
    }

    if (casaProps) {
      dynamic = dynamic.concat(
        casaProps.map((p: { slug: string }) => ({
          url: `${SITE}/casa/${p.slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      );
    }
  } catch (err) {
    // If DB is unreachable at build/revalidate time, ship static only.
    console.error("[sitemap] DB fetch failed, falling back to static:", err);
  }

  return [...staticEntries, ...dynamic];
}
