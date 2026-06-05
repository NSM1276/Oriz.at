import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { COLOR_PRESETS, PRESET_IDS } from "@/lib/colorPresets";

// Casa property style endpoint — owners update color preset + casa theme.
//   Super-admin → any property, any values.
//   Regular owner → must own the property, color must be from preset list.
//
// Body: { propertyId: string, presetId?: string, theme?: string }

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";
const ALLOWED_THEMES = new Set(["classic", "light", "modern"]);

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

  let body: { propertyId?: unknown; presetId?: unknown; theme?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { propertyId, presetId, theme } = body;
  if (typeof propertyId !== "string" || !propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const admin = svc();

  const { data: prop } = await admin
    .schema("casa")
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .maybeSingle<{ id: string; owner_id: string | null }>();

  if (!prop) return NextResponse.json({ error: "property not found" }, { status: 404 });
  if (!isSuper && prop.owner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};

  if (presetId !== undefined) {
    if (typeof presetId !== "string") {
      return NextResponse.json({ error: "invalid presetId" }, { status: 400 });
    }
    if (!isSuper && !PRESET_IDS.has(presetId)) {
      return NextResponse.json({ error: "color preset not allowed" }, { status: 403 });
    }
    const preset = COLOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return NextResponse.json({ error: "preset not found" }, { status: 400 });
    updates.color_bg = preset.color_bg;
    updates.color_primary = preset.color_primary;
  }

  if (theme !== undefined) {
    if (typeof theme !== "string" || !ALLOWED_THEMES.has(theme)) {
      return NextResponse.json({ error: "invalid theme" }, { status: 400 });
    }
    updates.casa_theme = theme;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { error } = await admin
    .schema("casa")
    .from("properties")
    .update(updates)
    .eq("id", propertyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
