import { serviceClient } from "@/lib/auth";
import { cleanLocales } from "@/lib/menu-edit";
import { requireVenue } from "../../venue";
import { MenuEditor, type EditorItem, type EditorSection } from "./MenuEditor";

export const dynamic = "force-dynamic";

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  const db = serviceClient();

  const [{ data: v }, { data: sections }, { data: items }] = await Promise.all([
    db.from("venues").select("enabled_locales").eq("id", venue.id).single<{ enabled_locales: string[] | null }>(),
    db.from("sections").select("id, name, position, translations").eq("venue_id", venue.id).order("position").returns<EditorSection[]>(),
    db
      .from("items")
      .select("id, section_id, name, price_cents, price_variants, allergens, diet_tags, image_url, is_active, position, translations")
      .eq("venue_id", venue.id)
      .order("position")
      .returns<EditorItem[]>(),
  ]);

  return (
    <MenuEditor
      slug={venue.slug}
      currency={venue.currency}
      locales={cleanLocales(v?.enabled_locales ?? [])}
      sections={sections ?? []}
      items={items ?? []}
    />
  );
}
