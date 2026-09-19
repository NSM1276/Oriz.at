import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

// Menu import — super admin only, add-only.
//
// POST { venueId, sections: [{ name, items: [{ name, price_cents, description }] }] }
//
// Never deletes. A section whose name already exists is reused and the items are
// appended after the existing ones, so running the import twice duplicates items
// rather than wiping a live menu. Photos and translations are never touched.

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_SECTIONS = 60;
const MAX_ITEMS = 600;
const MAX_NAME = 200;
const MAX_DESCRIPTION = 2000;

type InItem = { name?: unknown; price_cents?: unknown; description?: unknown };
type InSection = { name?: unknown; items?: unknown };

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t.slice(0, max);
}

export async function POST(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { venueId?: unknown; sections?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const venueId = body.venueId;
  if (typeof venueId !== "string" || !UUID.test(venueId)) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }
  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return NextResponse.json({ error: "sections required" }, { status: 400 });
  }
  if (body.sections.length > MAX_SECTIONS) {
    return NextResponse.json({ error: `at most ${MAX_SECTIONS} sections` }, { status: 400 });
  }

  // Validate everything before writing anything.
  const parsed: { name: string; items: { name: string; price_cents: number; description: string | null }[] }[] = [];
  let itemCount = 0;

  for (const raw of body.sections as InSection[]) {
    const name = clean(raw?.name, MAX_NAME);
    if (!name) return NextResponse.json({ error: "every section needs a name" }, { status: 400 });
    if (!Array.isArray(raw.items) || raw.items.length === 0) {
      return NextResponse.json({ error: `section "${name}" has no items` }, { status: 400 });
    }

    const items = [];
    for (const it of raw.items as InItem[]) {
      const itemName = clean(it?.name, MAX_NAME);
      const cents = it?.price_cents;
      if (!itemName) return NextResponse.json({ error: `an item in "${name}" has no name` }, { status: 400 });
      if (typeof cents !== "number" || !Number.isInteger(cents) || cents < 0 || cents > 10_000_00) {
        return NextResponse.json({ error: `"${itemName}" has an invalid price` }, { status: 400 });
      }
      items.push({ name: itemName, price_cents: cents, description: clean(it?.description, MAX_DESCRIPTION) });
      itemCount++;
    }
    parsed.push({ name, items });
  }

  if (itemCount > MAX_ITEMS) {
    return NextResponse.json({ error: `at most ${MAX_ITEMS} items` }, { status: 400 });
  }

  const admin = svc();

  const { data: venue } = await admin
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .maybeSingle<{ id: string }>();
  if (!venue) return NextResponse.json({ error: "venue not found" }, { status: 404 });

  const { data: existingSections } = await admin
    .from("sections")
    .select("id, name, position")
    .eq("venue_id", venueId)
    .returns<{ id: string; name: string; position: number }[]>();

  const byName = new Map((existingSections ?? []).map((s) => [s.name.toLowerCase(), s]));
  let nextSectionPosition =
    (existingSections ?? []).reduce((max, s) => Math.max(max, s.position), -1) + 1;

  let createdSections = 0;
  let createdItems = 0;

  for (const section of parsed) {
    let sectionId = byName.get(section.name.toLowerCase())?.id ?? null;

    if (!sectionId) {
      const { data: inserted, error } = await admin
        .from("sections")
        .insert({ venue_id: venueId, name: section.name, position: nextSectionPosition++ })
        .select("id")
        .single<{ id: string }>();
      if (error || !inserted) {
        return NextResponse.json(
          { error: `could not create section "${section.name}": ${error?.message ?? "unknown"}`, createdSections, createdItems },
          { status: 500 },
        );
      }
      sectionId = inserted.id;
      byName.set(section.name.toLowerCase(), { id: sectionId, name: section.name, position: 0 });
      createdSections++;
    }

    // Append after whatever is already in this section.
    const { data: lastItem } = await admin
      .from("items")
      .select("position")
      .eq("section_id", sectionId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle<{ position: number }>();
    let position = (lastItem?.position ?? -1) + 1;

    const rows = section.items.map((it) => ({
      venue_id: venueId,
      section_id: sectionId,
      name: it.name,
      // The real dish text lives in ai_caption everywhere else in this app.
      ai_caption: it.description,
      price_cents: it.price_cents,
      is_active: true,
      position: position++,
    }));

    const { error: itemsError } = await admin.from("items").insert(rows);
    if (itemsError) {
      return NextResponse.json(
        { error: `could not add items to "${section.name}": ${itemsError.message}`, createdSections, createdItems },
        { status: 500 },
      );
    }
    createdItems += rows.length;
  }

  return NextResponse.json({ ok: true, createdSections, createdItems });
}
