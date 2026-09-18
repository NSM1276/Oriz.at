import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/menu/MenuView";
import { DemoBanner } from "@/components/menu/DemoBanner";
import { resolveInitialLocale } from "@/lib/menu-i18n";
import { loadMenuPayload } from "@/lib/menu-loader";

const DEMO_SLUGS = ["ristorante-tosca", "brasserie-lumiere", "sushi-schonbrunn"];

export const revalidate = 0;

export default async function GuestMenuPage({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const initial = await loadMenuPayload(venueSlug);
  if (!initial) notFound();

  const isDemo = DEMO_SLUGS.includes(venueSlug);

  const acceptLanguage = (await headers()).get("accept-language");
  const initialLocale = resolveInitialLocale(acceptLanguage, initial.venue.enabled_locales);

  return (
    <>
      {isDemo && (
        <DemoBanner
          slug={venueSlug}
          name={initial.venue.name}
          accent={initial.venue.color_primary ?? "#C69B3C"}
        />
      )}
      <MenuView initial={initial} initialLocale={initialLocale} />
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
    .select("name, about")
    .eq("slug", venueSlug)
    .maybeSingle<{ name: string; about: string | null }>();
  if (!data) return { title: "ORIZ" };
  const description = data.about ?? `Menu of ${data.name}, presented by ORIZ.`;
  return {
    title: `${data.name} — Menu`,
    description,
    openGraph: { title: `${data.name} — Menu`, description, siteName: "ORIZ", type: "website" },
    twitter: { card: "summary_large_image", title: `${data.name} — Menu`, description },
  };
}
