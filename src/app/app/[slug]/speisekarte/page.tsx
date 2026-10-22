import { serviceClient } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements-server";
import { cleanLocales } from "@/lib/menu-edit";
import { requireVenue } from "../../venue";
import { MenuEditor, type EditorItem, type EditorSection } from "./MenuEditor";
import { MenusCard, type MenuRow } from "./MenusCard";

export const dynamic = "force-dynamic";

type MenuDb = { id: string; name: string; position: number; active_days: string[] | null; time_from: string | null; time_to: string | null };

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  const db = serviceClient();

  const [{ data: v }, { data: sections }, { data: items }, { data: menus }, ent] = await Promise.all([
    db.from("venues").select("enabled_locales").eq("id", venue.id).single<{ enabled_locales: string[] | null }>(),
    db.from("sections").select("id, name, position, translations, menu_id").eq("venue_id", venue.id).order("position").returns<EditorSection[]>(),
    db
      .from("items")
      .select("id, section_id, name, price_cents, price_variants, allergens, diet_tags, image_url, is_active, position, translations")
      .eq("venue_id", venue.id)
      .order("position")
      .returns<EditorItem[]>(),
    db.from("menus").select("id, name, position, active_days, time_from, time_to").eq("venue_id", venue.id).order("position").returns<MenuDb[]>(),
    getEntitlements(venue.id),
  ]);

  const menuRows: MenuRow[] = (menus ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    days: m.active_days ?? [],
    from: m.time_from ? m.time_from.slice(0, 5) : null,
    to: m.time_to ? m.time_to.slice(0, 5) : null,
    sections: (sections ?? []).filter((s) => s.menu_id === m.id).length,
  }));

  return (
    <MenuEditor
      slug={venue.slug}
      currency={venue.currency}
      locales={cleanLocales(v?.enabled_locales ?? [])}
      sections={sections ?? []}
      items={items ?? []}
      menus={menuRows.map((m) => ({ id: m.id, name: m.name }))}
      menusSlot={<MenusCard slug={venue.slug} venueName={venue.name} maxMenus={ent.maxMenus} menus={menuRows} />}
    />
  );
}
