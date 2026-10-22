import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminView } from "@/components/admin/SuperAdminView";
import { RoleHub } from "@/components/admin/RoleHub";
import type { Item, Section, Venue } from "@/lib/supabase/types";
import { isPlatformAdmin, memberVenues } from "@/lib/auth";

export const revalidate = 0;

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

  const isSuperAdmin = await isPlatformAdmin(user.id);

  // Restaurant owners work in /app now. Casa (holiday flats) still lives here.
  if (!isSuperAdmin) {
    const [carta, { data: casa }] = await Promise.all([
      memberVenues(user.id),
      supabase.schema("casa").from("properties").select("slug").eq("owner_id", user.id).limit(2),
    ]);
    const casaCount = casa?.length ?? 0;
    if (casaCount >= 1 && carta.length === 0) redirect(`/admin/casa/${casa![0].slug}`);
    if (casaCount >= 1 && carta.length >= 1) {
      return <RoleHub user={user.email ?? ""} carta={carta.map((v) => ({ slug: v.slug }))} casa={casa!} />;
    }
    redirect("/app");
  }

  // Platform admins: the venue list and the Casa / leads tools.
  const { data: venues } = await supabase
    .from("venues")
    .select("id, slug, name, about, color_bg, color_primary, logo_url, logo_svg, plan, menu_theme, instagram_url, google_maps_url, phone, address, website_url, google_review_url, tripadvisor_url, facebook_url, price_range, opening_hours, gallery, sections(id, items(id))")
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
    menu_theme: ((v as { menu_theme?: string | null }).menu_theme ?? "classic") as "classic" | "visual" | "modern",
    instagram_url: (v as { instagram_url?: string | null }).instagram_url ?? null,
    google_maps_url: (v as { google_maps_url?: string | null }).google_maps_url ?? null,
    phone: (v as { phone?: string | null }).phone ?? null,
    address: (v as { address?: string | null }).address ?? null,
    website_url: (v as { website_url?: string | null }).website_url ?? null,
    google_review_url: (v as { google_review_url?: string | null }).google_review_url ?? null,
    tripadvisor_url: (v as { tripadvisor_url?: string | null }).tripadvisor_url ?? null,
    facebook_url: (v as { facebook_url?: string | null }).facebook_url ?? null,
    price_range: (v as { price_range?: string | null }).price_range ?? null,
    opening_hours: (v as { opening_hours?: Record<string, [string, string][]> | null }).opening_hours ?? null,
    gallery: (v as { gallery?: string[] | null }).gallery ?? null,
    itemCount: v.sections?.reduce((acc, s) => acc + (s.items?.length ?? 0), 0) ?? 0,
  }));

  return <SuperAdminView venues={list} />;
}
