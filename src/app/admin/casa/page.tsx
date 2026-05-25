import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminCasaList } from "@/components/admin/SuperAdminCasaList";
import type { CasaPropertySummary } from "@/components/admin/CasaPropertyEditPanel";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

export default async function AdminCasaListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=/admin/casa");

  // Only super admin sees the full list. Regular Casa owners go to their property.
  if (user.email !== SUPER_ADMIN_EMAIL) {
    const { data: mine } = await supabase
      .schema("casa")
      .from("properties")
      .select("slug")
      .eq("owner_id", user.id)
      .limit(1);
    if (mine && mine.length > 0) redirect(`/admin/casa/${mine[0].slug}`);
    redirect("/admin");
  }

  const { data: props } = await supabase
    .schema("casa")
    .from("properties")
    .select(
      "id, slug, name, city, about, color_bg, color_primary, logo_url, logo_svg, website_url, instagram_url, facebook_url, google_maps_url, phone, email",
    )
    .order("name", { ascending: true });

  const list: CasaPropertySummary[] =
    (props as CasaPropertySummary[] | null) ?? [];

  return (
    <main className="min-h-screen bg-parchment text-onyx">
      <SuperAdminCasaList initial={list} />
    </main>
  );
}
