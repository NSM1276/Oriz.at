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

// POST { sectionId, venueId, name, price_cents }
export async function POST(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isSuper = user.email === SUPER_ADMIN_EMAIL;

  let body: { sectionId?: unknown; venueId?: unknown; name?: unknown; price_cents?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { sectionId, venueId, name, price_cents } = body;
  if (
    typeof sectionId !== "string" || typeof venueId !== "string" ||
    typeof name !== "string" || !name.trim() ||
    typeof price_cents !== "number"
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const admin = svc();

  if (!isSuper) {
    const { data: venue } = await admin
      .from("venues")
      .select("owner_id")
      .eq("id", venueId)
      .maybeSingle<{ owner_id: string | null }>();
    if (!venue || venue.owner_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const { data: existing } = await admin
    .from("items")
    .select("position")
    .eq("section_id", sectionId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? (existing[0] as { position: number }).position + 1 : 0;

  const { data: item, error } = await admin
    .from("items")
    .insert({
      section_id: sectionId,
      venue_id: venueId,
      name: name.trim(),
      price_cents,
      position: nextPosition,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, item });
}
