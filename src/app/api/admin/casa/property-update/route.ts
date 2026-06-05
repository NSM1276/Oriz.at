import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

const ALLOWED_FIELDS = new Set([
  "name", "slug", "city", "about",
  "color_bg", "color_primary",
  "website_url", "instagram_url", "facebook_url", "google_maps_url",
  "phone", "email", "cover_url",
  "logo_url", "logo_svg",
]);

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

  let body: { propertyId?: unknown; updates?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { propertyId, updates } = body;
  if (typeof propertyId !== "string" || !propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
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

  const { data: prop } = await admin
    .schema("casa")
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .maybeSingle<{ owner_id: string | null }>();

  if (!prop) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!isSuper && prop.owner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .schema("casa")
    .from("properties")
    .update(safeUpdates)
    .eq("id", propertyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
