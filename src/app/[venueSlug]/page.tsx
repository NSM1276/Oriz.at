import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/menu/MenuView";
import type { Item, MenuPayload, Section, Venue } from "@/lib/supabase/types";

export const revalidate = 0;

type Row = Venue & {
  sections: (Section & { items: Item[] })[];
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
      "id, slug, name, logo_url, about, currency, color_primary, color_bg, owner_id, created_at, sections(id, venue_id, name, position, items(id, section_id, venue_id, name, description, price_cents, image_url, allergens, ai_caption, is_active, position, updated_at))",
    )
    .eq("slug", venueSlug)
    .maybeSingle<Row>();

  if (error || !data) notFound();

  const sections = (data.sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      ...s,
      items: (s.items ?? [])
        .sort((a, b) => a.position - b.position),
    }));

  const initial: MenuPayload = {
    venue: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      logo_url: data.logo_url,
      about: data.about,
      currency: data.currency,
      color_primary: data.color_primary,
      color_bg: data.color_bg,
      owner_id: data.owner_id,
      created_at: data.created_at,
    },
    sections,
  };

  return <MenuView initial={initial} />;
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
    openGraph: {
      title: `${data.name} — Menu`,
      description,
      siteName: "ORIZ",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.name} — Menu`,
      description,
    },
  };
}
