import { OwnerProfileTab } from "@/components/admin/OwnerProfileTab";
import { serviceClient } from "@/lib/auth";
import type { OpeningHours } from "@/lib/supabase/types";
import { requireVenue } from "../../venue";
import { NEUTRAL, NEUTRAL_VARS } from "../neutral";

export const dynamic = "force-dynamic";

type Profile = {
  phone: string | null;
  address: string | null;
  website_url: string | null;
  google_review_url: string | null;
  tripadvisor_url: string | null;
  facebook_url: string | null;
  price_range: string | null;
  opening_hours: OpeningHours | null;
  gallery: string[] | null;
  cover_url: string | null;
};

// Contact, opening hours, links and photos — the panel from the old admin,
// shown in the owner app's neutral colours.
export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  const { data: p } = await serviceClient()
    .from("venues")
    .select("phone, address, website_url, google_review_url, tripadvisor_url, facebook_url, price_range, opening_hours, gallery, cover_url")
    .eq("id", venue.id)
    .single<Profile>();

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200" style={NEUTRAL_VARS}>
      <OwnerProfileTab
        venueId={venue.id}
        {...NEUTRAL}
        initialPhone={p?.phone ?? null}
        initialAddress={p?.address ?? null}
        initialWebsite={p?.website_url ?? null}
        initialGoogleReview={p?.google_review_url ?? null}
        initialTripadvisor={p?.tripadvisor_url ?? null}
        initialFacebook={p?.facebook_url ?? null}
        initialPriceRange={p?.price_range ?? null}
        initialOpeningHours={(p?.opening_hours as Record<string, [string, string][]> | null) ?? null}
        initialGallery={p?.gallery ?? null}
        initialCoverUrl={p?.cover_url ?? null}
      />
    </section>
  );
}
