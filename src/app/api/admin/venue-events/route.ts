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

// GET ?venueId=<uuid> — list events for a venue
export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get("venueId");
  if (!venueId) return NextResponse.json({ error: "missing venueId" }, { status: 400 });

  const isDemo = DEMO_VENUE_IDS.has(venueId);
  const admin = svc();

  if (!isDemo) {
    const userSb = await createServerSupabase();
    const { data: { user } } = await userSb.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const isSuper = user.email === SUPER_ADMIN_EMAIL;
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
  }

  const { data: events, error } = await admin
    .from("venue_events")
    .select("id, title, event_date, time_start, duration_hours")
    .eq("venue_id", venueId)
    .order("event_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: events ?? [] });
}

// POST — create event
export async function POST(req: NextRequest) {
  let body: {
    venueId?: unknown; title?: unknown; event_date?: unknown;
    time_start?: unknown; duration_hours?: unknown;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const { venueId, title, event_date, time_start, duration_hours } = body;

  if (
    typeof venueId !== "string" || typeof title !== "string" || !title.trim() ||
    typeof event_date !== "string" || !event_date
  ) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const isDemo = DEMO_VENUE_IDS.has(venueId);
  const admin = svc();

  if (!isDemo) {
    const userSb = await createServerSupabase();
    const { data: { user } } = await userSb.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const isSuper = user.email === SUPER_ADMIN_EMAIL;
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
  }

  const { data: event, error } = await admin
    .from("venue_events")
    .insert({
      venue_id: venueId,
      title: (title as string).trim(),
      event_date,
      time_start: typeof time_start === "string" && time_start ? time_start : null,
      duration_hours: typeof duration_hours === "number" && !isNaN(duration_hours) ? duration_hours : null,
    })
    .select("id, title, event_date, time_start, duration_hours")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event });
}

// DELETE ?id=<event_uuid> — delete event
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const admin = svc();

  // Fetch event to get venue_id (needed for demo check)
  type EventRow = { venue_id: string; venues: { owner_id: string | null } };
  const { data: ev } = await admin
    .from("venue_events")
    .select("venue_id, venues!inner(owner_id)")
    .eq("id", id)
    .maybeSingle();

  const evTyped = ev as EventRow | null;
  const isDemo = evTyped ? DEMO_VENUE_IDS.has(evTyped.venue_id) : false;

  if (!isDemo) {
    const userSb = await createServerSupabase();
    const { data: { user } } = await userSb.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const isSuper = user.email === SUPER_ADMIN_EMAIL;
    if (!isSuper) {
      if (!evTyped || evTyped.venues.owner_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
  }

  const { error } = await admin.from("venue_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
