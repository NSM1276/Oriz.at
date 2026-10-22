import { OwnerScreenTab } from "@/components/admin/OwnerScreenTab";
import { serviceClient } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements-server";
import type { Item, Section } from "@/lib/supabase/types";
import { requireVenue } from "../../venue";
import { NEUTRAL, NEUTRAL_VARS } from "../neutral";
import { UpgradeCard } from "../UpgradeCard";

export const dynamic = "force-dynamic";

// TV board settings — the panel from the old admin, in the neutral owner app. Part of the Pro plan.
export default async function ScreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  if (!(await getEntitlements(venue.id)).screen) return <UpgradeCard feature="screen" venueName={venue.name} />;

  const { data: sections } = await serviceClient()
    .from("sections")
    .select("id, venue_id, name, position, menu_id, items(id, section_id, venue_id, name, description, price_cents, image_url, ai_caption, allergens, is_active, position, updated_at)")
    .eq("venue_id", venue.id)
    .order("position")
    .returns<(Section & { items: Item[] })[]>();

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200" style={NEUTRAL_VARS}>
      <OwnerScreenTab venueId={venue.id} slug={venue.slug} sections={sections ?? []} {...NEUTRAL} />
    </section>
  );
}
