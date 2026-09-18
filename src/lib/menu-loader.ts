import { createClient } from "@/lib/supabase/server";
import type { Item, MenuData, MenuPayload, Section, Venue } from "@/lib/supabase/types";

type Row = Venue & {
  sections: (Section & { items: Item[] })[];
  menus: MenuData[];
};

export const MENU_SELECT =
  "id, slug, name, logo_url, logo_svg, about, currency, color_primary, color_bg, menu_theme, owner_id, created_at, instagram_url, google_maps_url, phone, address, tripadvisor_url, facebook_url, website_url, google_review_url, price_range, opening_hours, gallery, cover_url, enabled_locales, translations, menus(id, name, position, active_days, time_from, time_to), sections(id, venue_id, name, position, menu_id, translations, items(id, section_id, venue_id, name, description, price_cents, image_url, allergens, diet_tags, ai_caption, is_active, position, updated_at, translations))";

/** Loads everything the guest menu and the TV screen need for one venue.
 *  Returns null when the slug does not exist (caller decides about notFound). */
export async function loadMenuPayload(slug: string): Promise<MenuPayload | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(MENU_SELECT)
    .eq("slug", slug)
    .maybeSingle<Row>();

  if (error || !data) return null;

  const sections = (data.sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      ...s,
      items: (s.items ?? []).slice().sort((a, b) => a.position - b.position),
    }));

  const menus: MenuData[] = ((data.menus ?? []) as MenuData[])
    .slice()
    .sort((a, b) => a.position - b.position);

  const v = data as Partial<Venue> & Row;

  return {
    venue: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      logo_url: data.logo_url,
      logo_svg: v.logo_svg ?? null,
      about: data.about,
      currency: data.currency,
      color_primary: data.color_primary,
      color_bg: data.color_bg,
      owner_id: data.owner_id,
      created_at: data.created_at,
      instagram_url: v.instagram_url ?? null,
      google_maps_url: v.google_maps_url ?? null,
      menu_theme: (v.menu_theme ?? "classic") as "classic" | "modern" | "visual",
      phone: v.phone ?? null,
      address: v.address ?? null,
      tripadvisor_url: v.tripadvisor_url ?? null,
      facebook_url: v.facebook_url ?? null,
      website_url: v.website_url ?? null,
      google_review_url: v.google_review_url ?? null,
      price_range: v.price_range ?? null,
      opening_hours: v.opening_hours ?? null,
      gallery: v.gallery ?? null,
      cover_url: v.cover_url ?? null,
      enabled_locales: v.enabled_locales ?? [],
      translations: v.translations ?? null,
    },
    sections,
    menus,
  };
}
