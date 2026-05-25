import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminView } from "@/components/admin/SuperAdminView";
import { RoleHub } from "@/components/admin/RoleHub";
import { CartaOwnerView } from "@/components/admin/CartaOwnerView";
import type { Item, Section, Venue } from "@/lib/supabase/types";

export const revalidate = 0;

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

type VenueRow = Venue & {
  plan: string;
  ai_credits_used: number;
  ai_credits_reset: string;
  sections: (Section & { items: Item[] })[];
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

  // Role hub: route the user to the right product based on what they own.
  // Super admin sees everything; everyone else gets routed by ownership.
  if (!isSuperAdmin) {
    const [{ data: carta }, { data: casa }] = await Promise.all([
      supabase.from("venues").select("slug").eq("owner_id", user.id).limit(2),
      supabase.schema("casa").from("properties").select("slug").eq("owner_id", user.id).limit(2),
    ]);
    const cartaCount = carta?.length ?? 0;
    const casaCount = casa?.length ?? 0;
    // Exactly one Casa property and no Carta → go straight to Casa admin.
    if (casaCount >= 1 && cartaCount === 0) {
      redirect(`/admin/casa/${casa![0].slug}`);
    }
    // Owns both products → show a chooser hub.
    if (casaCount >= 1 && cartaCount >= 1) {
      return <RoleHub user={user.email ?? ""} carta={carta!} casa={casa!} />;
    }
    // Only Carta or nothing → fall through to existing Carta-owner view below.
  }

  if (isSuperAdmin) {
    const { data: venues } = await supabase
      .from("venues")
      .select("id, slug, name, about, color_bg, color_primary, logo_url, logo_svg, plan, instagram_url, google_maps_url, sections(id, items(id))")
      .order("created_at", { ascending: true })
      .returns<VenueRow[]>();

    const list = (venues ?? []).map(v => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      about: v.about ?? null,
      color_bg: v.color_bg ?? null,
      color_primary: v.color_primary ?? null,
      logo_url: (v as { logo_url?: string | null }).logo_url ?? null,
      logo_svg: (v as { logo_svg?: string | null }).logo_svg ?? null,
      plan: v.plan ?? "trial",
      instagram_url: (v as { instagram_url?: string | null }).instagram_url ?? null,
      google_maps_url: (v as { google_maps_url?: string | null }).google_maps_url ?? null,
      itemCount: v.sections?.reduce((acc, s) => acc + (s.items?.length ?? 0), 0) ?? 0,
    }));

    return <SuperAdminView venues={list} />;
  }

  // Regular owner view — fetch their venue, hand off to shared component.
  const { data: venues } = await supabase
    .from("venues")
    .select(
      "id, slug, name, logo_url, logo_svg, about, currency, color_primary, color_bg, owner_id, created_at, plan, ai_credits_used, ai_credits_reset, sections(id, venue_id, name, position, items(id, section_id, venue_id, name, description, price_cents, image_url, ai_caption, allergens, is_active, position, updated_at))",
    )
    .eq("owner_id", user.id)
    .returns<VenueRow[]>();

  return <CartaOwnerView venue={venues?.[0] ?? null} />;
}
