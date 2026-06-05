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

// DELETE { itemId }
export async function DELETE(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isSuper = user.email === SUPER_ADMIN_EMAIL;

  let body: { itemId?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { itemId } = body;
  if (typeof itemId !== "string" || !itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const admin = svc();

  type ItemRow = { id: string; venue_id: string; venues: { owner_id: string | null } };
  const { data: item } = await admin
    .from("items")
    .select("id, venue_id, venues(owner_id)")
    .eq("id", itemId)
    .maybeSingle<ItemRow>();

  if (!item) return NextResponse.json({ error: "item not found" }, { status: 404 });
  if (!isSuper && item.venues.owner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("items").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
