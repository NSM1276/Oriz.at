import { notFound } from "next/navigation";
import { serviceClient } from "@/lib/auth";
import { EMPTY_DISH, cleanLocales, formFromItem } from "@/lib/menu-edit";
import { requireVenue } from "../../../../venue";
import { DishEditor } from "./DishEditor";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// /app/<slug>/speisekarte/gericht/<id> edits a dish; /gericht/neu?bereich=<id> adds one.
export default async function DishPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ bereich?: string }>;
}) {
  const { slug, id } = await params;
  const { bereich } = await searchParams;
  const { venue } = await requireVenue(slug);
  const db = serviceClient();

  const [{ data: v }, { data: sections }] = await Promise.all([
    db.from("venues").select("enabled_locales").eq("id", venue.id).single<{ enabled_locales: string[] | null }>(),
    db.from("sections").select("id, name").eq("venue_id", venue.id).order("position").returns<{ id: string; name: string }[]>(),
  ]);
  const locales = cleanLocales(v?.enabled_locales ?? []);
  if (!sections?.length) notFound();

  if (id === "neu") {
    const sectionId = sections.some((s) => s.id === bereich) ? bereich! : sections[0].id;
    return (
      <DishEditor
        slug={venue.slug}
        itemId={null}
        sectionId={sectionId}
        sections={sections}
        locales={locales}
        initial={{ ...EMPTY_DISH, translations: Object.fromEntries(locales.map((l) => [l, { name: "", description: "" }])) }}
        imageUrl={null}
      />
    );
  }

  if (!UUID.test(id)) notFound();
  const { data: item } = await db
    .from("items")
    .select("id, section_id, name, description, ai_caption, price_cents, price_variants, allergens, diet_tags, image_url, is_active, translations")
    .eq("id", id)
    .eq("venue_id", venue.id)
    .maybeSingle();
  if (!item) notFound();

  return (
    <DishEditor
      slug={venue.slug}
      itemId={item.id}
      sectionId={item.section_id}
      sections={sections}
      locales={locales}
      initial={formFromItem(item, locales)}
      imageUrl={item.image_url}
    />
  );
}
