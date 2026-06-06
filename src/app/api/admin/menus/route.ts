import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

// Demo venues — publicly accessible without auth (nightly reset at 03:00)
const DEMO_VENUE_IDS = new Set([
  "5781d254-df4b-4713-bfed-41111bd75a2d", // Ristorante Tosca
  "f039c06c-d196-4f12-8145-fb20eeab0502", // Brasserie Lumière
  "ac0094c8-4c04-42e7-b404-a57ebbbed314", // Sushi Schönbrunn
]);

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function getAuthUser() {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  return user;
}

async function checkOwnership(venueId: string, userId: string, isSuper: boolean): Promise<boolean> {
  if (isSuper) return true;
  const { data } = await svc().from("venues").select("id").eq("id", venueId).eq("owner_id", userId).maybeSingle();
  return !!data;
}

async function checkMenuOwnership(menuId: string, userId: string, isSuper: boolean): Promise<string | null> {
  if (isSuper) {
    const { data } = await svc().from("menus").select("venue_id").eq("id", menuId).maybeSingle();
    return data?.venue_id ?? null;
  }
  const { data } = await svc()
    .from("menus")
    .select("venue_id, venues!inner(owner_id)")
    .eq("id", menuId)
    .maybeSingle() as { data: { venue_id: string; venues: { owner_id: string } } | null };
  if (!data) return null;
  if ((data.venues as unknown as { owner_id: string }).owner_id !== userId) return null;
  return data.venue_id;
}

// GET ?venueId=<uuid> — list menus for venue
export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get("venueId");
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });

  const isDemo = DEMO_VENUE_IDS.has(venueId);
  if (!isDemo) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const isSuper = user.email === SUPER_ADMIN_EMAIL;
    const owns = await checkOwnership(venueId, user.id, isSuper);
    if (!owns) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await svc()
    .from("menus")
    .select("id, name, position, active_days, time_from, time_to, created_at")
    .eq("venue_id", venueId)
    .order("position");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menus: data ?? [] });
}

// POST — create menu
export async function POST(req: NextRequest) {
  let body: { venueId?: unknown; name?: unknown; active_days?: unknown; time_from?: unknown; time_to?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const { venueId, name, active_days, time_from, time_to } = body;
  if (typeof venueId !== "string" || typeof name !== "string" || !name) {
    return NextResponse.json({ error: "venueId and name required" }, { status: 400 });
  }

  const isDemo = DEMO_VENUE_IDS.has(venueId);
  if (!isDemo) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const isSuper = user.email === SUPER_ADMIN_EMAIL;
    const owns = await checkOwnership(venueId, user.id, isSuper);
    if (!owns) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // get next position
  const { count } = await svc().from("menus").select("*", { count: "exact", head: true }).eq("venue_id", venueId);

  const { data, error } = await svc()
    .from("menus")
    .insert({
      venue_id: venueId,
      name: name.trim(),
      position: count ?? 0,
      active_days: Array.isArray(active_days) ? active_days : [],
      time_from: typeof time_from === "string" && time_from ? time_from : null,
      time_to: typeof time_to === "string" && time_to ? time_to : null,
    })
    .select("id, name, position, active_days, time_from, time_to")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menu: data });
}

// PATCH — update menu
export async function PATCH(req: NextRequest) {
  let body: { menuId?: unknown; name?: unknown; active_days?: unknown; time_from?: unknown; time_to?: unknown; position?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const { menuId } = body;
  if (typeof menuId !== "string") return NextResponse.json({ error: "menuId required" }, { status: 400 });

  // Check if this menu belongs to a demo venue
  const { data: menuRow } = await svc().from("menus").select("venue_id").eq("id", menuId).maybeSingle<{ venue_id: string }>();
  const isDemo = menuRow ? DEMO_VENUE_IDS.has(menuRow.venue_id) : false;
  let venueId: string | null = menuRow?.venue_id ?? null;

  if (!isDemo) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const isSuper = user.email === SUPER_ADMIN_EMAIL;
    venueId = await checkMenuOwnership(menuId, user.id, isSuper);
    if (!venueId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (Array.isArray(body.active_days)) updates.active_days = body.active_days;
  if ("time_from" in body) updates.time_from = body.time_from ?? null;
  if ("time_to" in body) updates.time_to = body.time_to ?? null;
  if (typeof body.position === "number") updates.position = body.position;

  const { data, error } = await svc()
    .from("menus")
    .update(updates)
    .eq("id", menuId)
    .select("id, name, position, active_days, time_from, time_to")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menu: data });
}

// DELETE ?id=<uuid> — delete menu
export async function DELETE(req: NextRequest) {
  const menuId = req.nextUrl.searchParams.get("id");
  if (!menuId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: menuRow } = await svc().from("menus").select("venue_id").eq("id", menuId).maybeSingle<{ venue_id: string }>();
  const isDemo = menuRow ? DEMO_VENUE_IDS.has(menuRow.venue_id) : false;

  if (!isDemo) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const isSuper = user.email === SUPER_ADMIN_EMAIL;
    const venueId = await checkMenuOwnership(menuId, user.id, isSuper);
    if (!venueId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await svc().from("menus").delete().eq("id", menuId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
