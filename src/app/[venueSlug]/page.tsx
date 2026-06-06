import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/menu/MenuView";
import { DemoBanner } from "@/components/menu/DemoBanner";
import type { Item, MenuData, MenuPayload, Section, Venue } from "@/lib/supabase/types";

const DEMO_SLUGS = ["ristorante-tosca", "brasserie-lumiere", "sushi-schonbrunn"];

export const revalidate = 0;

type Row = Venue & {
  sections: (Section & { items: Item[] })[];
  menus: MenuData[];
};

export default async function GuestMenuPage({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("venues")
    .select(
      "id, slug, name, logo_url, logo_svg, about, currency, color_primary, color_bg, menu_theme, owner_id, created_at, instagram_url, google_maps_url, phone, address, tripadvisor_url, facebook_url, website_url, google_review_url, price_range, opening_hours, gallery, menus(id, name, position, active_days, time_from, time_to), sections(id, venue_id, name, position, menu_id, items(id, section_id, venue_id, name, description, price_cents, image_url, allergens, diet_tags, ai_caption, is_active, position, updated_at))",
    )
    .eq("slug", venueSlug)
    .maybeSingle<Row>();

  if (error || !data) notFound();

  const sections = (data.sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      ...s,
      items: (s.items ?? []).sort((a, b) => a.position - b.position),
    }));

  const menus: MenuData[] = ((data.menus ?? []) as MenuData[])
    .slice()
    .sort((a, b) => a.position - b.position);

  const initial: MenuPayload = {
    venue: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      logo_url: data.logo_url,
      logo_svg: (data as typeof data & { logo_svg?: string | null }).logo_svg ?? null,
      about: data.about,
      currency: data.currency,
      color_primary: data.color_primary,
      color_bg: data.color_bg,
      owner_id: data.owner_id,
      created_at: data.created_at,
      instagram_url: (data as typeof data & { instagram_url?: string | null }).instagram_url ?? null,
      google_maps_url: (data as typeof data & { google_maps_url?: string | null }).google_maps_url ?? null,
      menu_theme: ((data as typeof data & { menu_theme?: string }).menu_theme ?? 'classic') as 'classic' | 'modern' | 'visual',
      phone: (data as Partial<Venue>).phone ?? null,
      address: (data as Partial<Venue>).address ?? null,
      tripadvisor_url: (data as Partial<Venue>).tripadvisor_url ?? null,
      facebook_url: (data as Partial<Venue>).facebook_url ?? null,
      website_url: (data as Partial<Venue>).website_url ?? null,
      google_review_url: (data as Partial<Venue>).google_review_url ?? null,
      price_range: (data as Partial<Venue>).price_range ?? null,
      opening_hours: (data as Partial<Venue>).opening_hours ?? null,
      gallery: (data as Partial<Venue>).gallery ?? null,
    },
    sections,
    menus,
  };

  const isDemo = DEMO_SLUGS.includes(venueSlug);

  return (
    <>
      {isDemo && (
        <DemoBanner
          slug={venueSlug}
          name={initial.venue.name}
          accent={initial.venue.color_primary ?? "#C69B3C"}
        />
      )}
      <MenuView initial={initial} />
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
