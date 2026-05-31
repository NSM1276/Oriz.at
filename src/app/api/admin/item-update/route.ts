import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

// Item update endpoint — replaces direct browser-client mutations in ItemEditor.
//
// Auth: must be logged in. Super-admin can update any item; regular owners
// must own the parent venue. Uses service-role client to bypass RLS.
//
// Body: { itemId: string, updates: Record<string, unknown> }
// Allowed fields: price_cents, allergens, ai_caption, is_active

const ALLOWED_FIELDS = new Set(["price_cents", "allergens", "ai_caption", "is_active"]);

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

  let body: { itemId?: unknown; updates?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { itemId, updates } = body;
  if (typeof itemId !== "string" || !itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return NextResponse.json({ error: "updates must be an object" }, { status: 400 });
  }

  const safeUpdates = Object.fromEntries(
    Object.entries(updates as Record<string, unknown>).filter(([k]) => ALLOWED_FIELDS.has(k)),
  );
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: "no allowed fields in updates" }, { status: 400 });
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

  const { error } = await admin.from("items").update(safeUpdates).eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
