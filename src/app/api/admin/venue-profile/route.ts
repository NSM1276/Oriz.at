import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function PATCH(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isSuper = user.email === SUPER_ADMIN_EMAIL;

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

  if (!body.venueId) return NextResponse.json({ error: "missing venueId" }, { status: 400 });

  const admin = svc();

  if (!isSuper) {
    const { data: venue } = await admin
      .from("venues")
      .select("owner_id")
      .eq("id", body.venueId)
      .maybeSingle<{ owner_id: string | null }>();
    if (!venue || venue.owner_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const { venueId, ...fields } = body;
  const { error } = await admin.from("venues").update(fields).eq("id", venueId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
