import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CartaOwnerView } from "@/components/admin/CartaOwnerView";
import type { Item, Section, Venue } from "@/lib/supabase/types";

// Public preview — no auth required. Demo venues only, data is synthetic.
export const revalidate = 0;

type VenueRow = Venue & {
  plan: string;
  ai_credits_used: number;
  ai_credits_reset: string;
  phone?: string | null;
  address?: string | null;
  website_url?: string | null;
  google_review_url?: string | null;
  tripadvisor_url?: string | null;
  facebook_url?: string | null;
  price_range?: string | null;
  opening_hours?: Record<string, [string, string][]> | null;
  gallery?: string[] | null;
  sections: (Section & { items: Item[] })[];
};

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Only these 3 demo venues are publicly accessible without auth.
  // Real client venues are protected via normal /admin login.
  const DEMO_SLUGS = ["ristorante-tosca", "brasserie-lumiere", "sushi-schonbrunn"];
  if (!DEMO_SLUGS.includes(slug)) notFound();
  const admin = svc();

  const { data: venue } = await admin
    .from("venues")
    .select(
      "id, slug, name, logo_url, logo_svg, about, currency, color_primary, color_bg, owner_id, created_at, plan, ai_credits_used, ai_credits_reset, phone, address, website_url, google_review_url, tripadvisor_url, facebook_url, price_range, opening_hours, gallery, menu_theme, sections(id, venue_id, name, position, items(id, section_id, venue_id, name, description, price_cents, image_url, ai_caption, allergens, is_active, position, updated_at))",
    )
    .eq("slug", slug)
    .returns<VenueRow[]>()
    .maybeSingle();

  if (!venue) notFound();

  return (
    <CartaOwnerView
      venue={{ ...venue, ai_credits_used: venue.ai_credits_used ?? 0, ai_credits_reset: venue.ai_credits_reset ?? "" }}
      superAdminLink="/admin"
    />
  );
}
