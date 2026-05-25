import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CasaAdminEditor } from "@/components/casa/CasaAdminEditor";

export const dynamic = "force-dynamic";

export default async function CasaAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Auth gate
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/admin/login?next=/admin/casa/${slug}`);
  }

  // Fetch property
  const { data: property } = await supabase
    .schema("casa")
    .from("properties")
    .select(
      "id, slug, name, city, about, color_bg, color_primary, logo_url, website_url, instagram_url, facebook_url, google_maps_url, phone, email",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!property) notFound();

  // Fetch blocks
  const { data: blocks } = await supabase
    .schema("casa")
    .from("content_blocks")
    .select(
      "id, property_id, block_type, title_de, title_en, body_de, body_en, position",
    )
    .eq("property_id", property.id)
    .order("position", { ascending: true });

  return (
    <CasaAdminEditor
      initialProperty={property}
      initialBlocks={blocks ?? []}
    />
  );
}
