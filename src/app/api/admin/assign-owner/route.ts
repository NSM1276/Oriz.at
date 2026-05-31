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

// PATCH — assign or clear venue owner
// Body: { venueId: string, ownerEmail: string | null }
// If ownerEmail is null, clears the owner.
export async function PATCH(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { venueId?: unknown; ownerEmail?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { venueId, ownerEmail } = body;
  if (typeof venueId !== "string" || !venueId) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }

  const admin = svc();

  // Clear owner
  if (ownerEmail === null || ownerEmail === "") {
    const { error } = await admin.from("venues").update({ owner_id: null }).eq("id", venueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, ownerEmail: null });
  }

  if (typeof ownerEmail !== "string") {
    return NextResponse.json({ error: "ownerEmail must be a string or null" }, { status: 400 });
  }

  // Look up the user by email
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = list?.users.find(
    (u) => u.email?.toLowerCase() === (ownerEmail as string).toLowerCase(),
  );
  if (!found) {
    return NextResponse.json(
      { error: `No user found with email "${ownerEmail}". Create the user in Supabase Auth first.` },
      { status: 404 },
    );
  }

  const { error } = await admin.from("venues").update({ owner_id: found.id }).eq("id", venueId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, ownerEmail: found.email });
}

// GET — return current owner email for a venue
// ?venueId=...
export async function GET(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const venueId = new URL(req.url).searchParams.get("venueId");
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });

  const admin = svc();
  const { data: venue } = await admin
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .maybeSingle<{ owner_id: string | null }>();

  if (!venue) return NextResponse.json({ error: "venue not found" }, { status: 404 });
  if (!venue.owner_id) return NextResponse.json({ ownerEmail: null });

  const { data: authUser } = await admin.auth.admin.getUserById(venue.owner_id);
  return NextResponse.json({ ownerEmail: authUser?.user?.email ?? null });
}
