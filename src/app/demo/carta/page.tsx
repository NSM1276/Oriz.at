import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeDemoShell } from "@/components/menu/ThemeDemoShell";
import type { Item, MenuPayload, Section, Venue } from "@/lib/supabase/types";

export const revalidate = 0;

const DEMO_SLUG = "ristorante-tosca";

type Row = Venue & {
  sections: (Section & { items: Item[] })[];
};

export default async function ThemeDemoPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("venues")
    .select(
      "id, slug, name, logo_url, logo_svg, about, currency, color_primary, color_bg, menu_theme, owner_id, created_at, instagram_url, google_maps_url, sections(id, venue_id, name, position, items(id, section_id, venue_id, name, description, price_cents, image_url, allergens, ai_caption, is_active, position, updated_at))",
    )
    .eq("slug", DEMO_SLUG)
    .maybeSingle<Row>();

  if (error || !data) notFound();

  const sections = (data.sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      ...s,
      items: (s.items ?? []).sort((a, b) => a.position - b.position),
    }));

  const payload: MenuPayload = {
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
      menu_theme: "classic",
    },
    sections,
  };

  return <ThemeDemoShell payload={payload} />;
}

export const metadata = {
  title: "ORIZ · Theme Demo",
  description: "Wähle zwischen drei Menü-Themes: Classic, Visual, Modern.",
  robots: { index: false, follow: false },
};
