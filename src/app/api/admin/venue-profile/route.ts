import { NextRequest, NextResponse } from "next/server";
import { getUser, serviceClient, venueRole } from "@/lib/auth";

// The only venue columns this endpoint writes. Everything else in the body is
// ignored — plan, owner, slug and logo are never the owner's to set here.
const PROFILE_FIELDS = [
  "phone", "address", "website_url", "google_review_url", "tripadvisor_url",
  "facebook_url", "price_range", "opening_hours",
] as const;

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json() as {
    venueId: string;
    phone?: string | null;
    address?: string | null;
    website_url?: string | null;
    google_review_url?: string | null;
    tripadvisor_url?: string | null;
    facebook_url?: string | null;
    price_range?: string | null;
    opening_hours?: Record<string, [string, string][]> | null;
  };

  if (typeof body.venueId !== "string" || !body.venueId) {
    return NextResponse.json({ error: "missing venueId" }, { status: 400 });
  }
  if (!(await venueRole(user.id, body.venueId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const fields = Object.fromEntries(
    PROFILE_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]),
  );
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "no fields" }, { status: 400 });
  }

  const { error } = await serviceClient().from("venues").update(fields).eq("id", body.venueId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
