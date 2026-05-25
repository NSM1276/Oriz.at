import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

// Mirror of /admin/casa/[slug] for Carta venues. Super admin uses this
// to open any venue's content editor (menu/sections/items). A regular
// owner could also reach it directly by URL — RLS ensures they only
// see venues they own.
export default async function CartaAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/admin/login?next=/admin/carta/${slug}`);
  }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

  const { data: venues } = await supabase
    .from("venues")
    .select(
      "id, slug, name, logo_url, logo_svg, about, currency, color_primary, color_bg, owner_id, created_at, plan, ai_credits_used, ai_credits_reset, sections(id, venue_id, name, position, items(id, section_id, venue_id, name, description, price_cents, image_url, ai_caption, allergens, is_active, position, updated_at))",
    )
    .eq("slug", slug)
    .returns<VenueRow[]>();

  const venue = venues?.[0];
  if (!venue) notFound();

  // Non-super-admin must own this venue
  if (!isSuperAdmin && venue.owner_id !== user.id) {
    redirect("/admin");
  }

  return (
    <CartaOwnerView
      venue={venue}
      superAdminLink={isSuperAdmin ? "/admin" : undefined}
    />
  );
}
