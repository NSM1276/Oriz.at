import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_VENUE_ID = "47dfcb88-86af-4a94-b749-bbb3d920a911";
const ALLOWED_FIELDS = ["price_cents", "is_active", "description"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function PATCH(req: NextRequest) {
  let body: { itemId?: string; field?: string; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { itemId, field, value } = body;
  if (!itemId || !field || value === undefined) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  if (!ALLOWED_FIELDS.includes(field as AllowedField)) {
    return NextResponse.json({ error: "Field not allowed" }, { status: 400 });
  }

  const supabase = serviceClient();

  const { data: item } = await supabase
    .from("items")
    .select("id")
    .eq("id", itemId)
    .eq("venue_id", DEMO_VENUE_ID)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Not found in demo" }, { status: 404 });
  }

  const { error } = await supabase
    .from("items")
    .update({ [field]: value })
    .eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
