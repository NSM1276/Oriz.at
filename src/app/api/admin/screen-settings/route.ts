import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { COLOR_PRESETS, PRESET_IDS } from "@/lib/colorPresets";
import type { ScreenSettingsRow } from "@/lib/supabase/types";

// Screen (TV board) settings — one row per venue, upserted on every change.
//
// GET   ?venueId=…                  → { settings: ScreenSettingsRow | null }
// PATCH { venueId, ...partial }     → { settings: ScreenSettingsRow }
//   partial keys: active, rotation_sec, spotlight, presetId (string | null → inherit),
//                 sections (uuid[] | null), hero_items ({ [uuid]: uuid })
//
// Auth: same pattern as venue-style — demo venues skip auth; otherwise logged in and
// (super admin or owner of the venue).

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

// Demo venues — publicly accessible without auth (nightly reset at 03:00)
const DEMO_VENUE_IDS = new Set([
  "5781d254-df4b-4713-bfed-41111bd75a2d", // Ristorante Tosca
  "f039c06c-d196-4f12-8145-fb20eeab0502", // Brasserie Lumière
  "ac0094c8-4c04-42e7-b404-a57ebbbed314", // Sushi Schönbrunn
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT = "venue_id, active, rotation_sec, spotlight, color_bg, color_primary, sections, hero_items, style, updated_at";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function authorize(venueId: string): Promise<NextResponse | null> {
  if (DEMO_VENUE_IDS.has(venueId)) return null;
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.email === SUPER_ADMIN_EMAIL) return null;
  const { data: venue } = await svc()
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .maybeSingle<{ owner_id: string | null }>();
  if (!venue) return NextResponse.json({ error: "venue not found" }, { status: 404 });
  if (venue.owner_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get("venueId") ?? "";
  if (!UUID.test(venueId)) return NextResponse.json({ error: "venueId required" }, { status: 400 });
  const denied = await authorize(venueId);
  if (denied) return denied;

  const { data, error } = await svc()
    .from("screen_settings")
    .select(SELECT)
    .eq("venue_id", venueId)
    .maybeSingle<ScreenSettingsRow>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data ?? null });
}

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const venueId = body.venueId;
  if (typeof venueId !== "string" || !UUID.test(venueId)) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }
  const denied = await authorize(venueId);
  if (denied) return denied;

  const updates: Record<string, unknown> = {};

  for (const key of Object.keys(body)) {
    const v = body[key];
    switch (key) {
      case "venueId":
        break;
      case "active":
      case "spotlight":
        if (typeof v !== "boolean") return NextResponse.json({ error: `${key} must be boolean` }, { status: 400 });
        updates[key] = v;
        break;
      case "rotation_sec":
        if (typeof v !== "number" || !Number.isInteger(v) || v < 3 || v > 60) {
          return NextResponse.json({ error: "rotation_sec must be 3..60" }, { status: 400 });
        }
        updates.rotation_sec = v;
        break;
      case "presetId":
        if (v === null) {
          updates.color_bg = null;
          updates.color_primary = null;
        } else {
          if (typeof v !== "string" || !PRESET_IDS.has(v)) {
            return NextResponse.json({ error: "unknown presetId" }, { status: 400 });
          }
          const preset = COLOR_PRESETS.find((p) => p.id === v)!;
          updates.color_bg = preset.color_bg;
          updates.color_primary = preset.color_primary;
        }
        break;
      case "sections":
        if (v !== null && !(Array.isArray(v) && v.every((s) => typeof s === "string" && UUID.test(s)))) {
          return NextResponse.json({ error: "sections must be uuid[] or null" }, { status: 400 });
        }
        updates.sections = v;
        break;
      case "hero_items": {
        if (!v || typeof v !== "object" || Array.isArray(v)) {
          return NextResponse.json({ error: "hero_items must be an object" }, { status: 400 });
        }
        const entries = Object.entries(v as Record<string, unknown>);
        if (!entries.every(([k, val]) => UUID.test(k) && typeof val === "string" && UUID.test(val))) {
          return NextResponse.json({ error: "hero_items must map uuid → uuid" }, { status: 400 });
        }
        updates.hero_items = v;
        break;
      }
      default:
        return NextResponse.json({ error: `unknown field: ${key}` }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { data, error } = await svc()
    .from("screen_settings")
    .upsert({ venue_id: venueId, ...updates, updated_at: new Date().toISOString() }, { onConflict: "venue_id" })
    .select(SELECT)
    .single<ScreenSettingsRow>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ settings: data });
}
