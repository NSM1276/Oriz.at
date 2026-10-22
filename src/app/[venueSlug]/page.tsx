import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/menu/MenuView";
import { DemoBanner } from "@/components/menu/DemoBanner";
import { resolveInitialLocale } from "@/lib/menu-i18n";
import { loadMenuPayload } from "@/lib/menu-loader";
import { DEMO_SLUGS } from "@/lib/demo";
import { currentTable } from "@/lib/table-session";
import { TableBanner } from "@/components/menu/TableBanner";
import { CallButton } from "@/components/menu/CallButton";
import { serviceClient } from "@/lib/auth";
import { tableDisplayName } from "@/lib/tables";
import { isListedVenue, jsonLdScript, restaurantJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const revalidate = 0;

export default async function GuestMenuPage({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const initial = await loadMenuPayload(venueSlug);
  if (!initial) notFound();

  const isDemo = DEMO_SLUGS.has(venueSlug);
  const table = await currentTable(venueSlug);
  // The call button only for guests at a table, and only once the venue has switched it on.
  let callsEnabled = false;
  if (table) {
    const { data } = await serviceClient()
      .from("venues")
      .select("service_calls_enabled")
      .eq("id", table.venueId)
      .single<{ service_calls_enabled: boolean }>();
    callsEnabled = !!data?.service_calls_enabled;
  }

  const acceptLanguage = (await headers()).get("accept-language");
  const initialLocale = resolveInitialLocale(acceptLanguage, initial.venue.enabled_locales);

  // Structured data only for real customers, same rule as the sitemap: a demo must not read as a real place.
  const { data: sub } = await serviceClient().from("subscriptions").select("status").eq("venue_id", initial.venue.id).maybeSingle<{ status: string }>();
  const listed = isListedVenue({ slug: venueSlug, status: sub?.status ?? null });

  return (
    <>
      {listed && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(restaurantJsonLd(initial.venue, SITE_URL)) }} />
      )}
      {table && (
        <TableBanner label={table.label} bg={initial.venue.color_bg} accent={initial.venue.color_primary} />
      )}
      {isDemo && (
        <DemoBanner
          slug={venueSlug}
          name={initial.venue.name}
          accent={initial.venue.color_primary ?? "#C69B3C"}
        />
      )}
      <MenuView initial={initial} initialLocale={initialLocale} />
      {table && callsEnabled && (
        <CallButton
          slug={venueSlug}
          tableName={tableDisplayName(table.label)}
          bg={initial.venue.color_bg}
          accent={initial.venue.color_primary}
          initialLocale={initialLocale}
        />
      )}
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("venues")
    .select("id, name, about")
    .eq("slug", venueSlug)
    .maybeSingle<{ id: string; name: string; about: string | null }>();
  if (!data) return { title: "ORIZ" };
  const description = data.about ?? `Speisekarte von ${data.name}, digital von ORIZ.`;
  const title = `${data.name} — Speisekarte`;

  // Demo and test restaurants stay reachable by link but out of search results.
  const { data: sub } = await serviceClient().from("subscriptions").select("status").eq("venue_id", data.id).maybeSingle<{ status: string }>();
  const listed = isListedVenue({ slug: venueSlug, status: sub?.status ?? null });

  return {
    title,
    description,
    openGraph: { title, description, siteName: "ORIZ", type: "website" },
    twitter: { card: "summary_large_image", title, description },
    ...(listed ? {} : { robots: { index: false, follow: true } }),
  };
}
