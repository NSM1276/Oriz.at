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

// PATCH body: { sectionId, menuId: string | null }
// Updates sections.menu_id — assigns or unassigns a section from a menu.
export async function PATCH(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { sectionId?: unknown; menuId?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const { sectionId, menuId } = body;
  if (typeof sectionId !== "string" || !sectionId) {
    return NextResponse.json({ error: "sectionId required" }, { status: 400 });
  }
  if (menuId !== null && typeof menuId !== "string") {
    return NextResponse.json({ error: "menuId must be string or null" }, { status: 400 });
  }

  const isSuper = user.email === SUPER_ADMIN_EMAIL;

  // Ownership check via section → venue
  const { data: section } = await svc()
    .from("sections")
    .select("id, venue_id")
    .eq("id", sectionId)
    .maybeSingle();

  if (!section) return NextResponse.json({ error: "section not found" }, { status: 404 });

  if (!isSuper) {
    const { data: venue } = await svc()
      .from("venues")
      .select("id")
      .eq("id", section.venue_id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!venue) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await svc()
    .from("sections")
    .update({ menu_id: menuId ?? null })
    .eq("id", sectionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
