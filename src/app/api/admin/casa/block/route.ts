import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";

const ALLOWED_BLOCK_FIELDS = new Set([
  "title_de", "title_en", "body_de", "body_en",
  "block_type", "image_url", "position",
]);

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function isPropertyOwner(
  admin: ReturnType<typeof svc>,
  propertyId: string,
  userId: string,
  isSuper: boolean,
): Promise<boolean> {
  if (isSuper) return true;
  const { data } = await admin
    .schema("casa")
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .maybeSingle<{ owner_id: string | null }>();
  return data?.owner_id === userId;
}

// POST — add a new content block
export async function POST(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isSuper = user.email === SUPER_ADMIN_EMAIL;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { propertyId, block_type, title_de, title_en, body_de, body_en, position } = body;
  if (typeof propertyId !== "string" || !propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const admin = svc();
  const allowed = await isPropertyOwner(admin, propertyId, user.id, isSuper);
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await admin
    .schema("casa")
    .from("content_blocks")
    .insert({
      property_id: propertyId,
      block_type: typeof block_type === "string" ? block_type : "other",
      title_de: typeof title_de === "string" ? title_de : "Neuer Block",
      title_en: typeof title_en === "string" ? title_en : "New block",
      body_de: typeof body_de === "string" ? body_de : "",
      body_en: typeof body_en === "string" ? body_en : "",
      position: typeof position === "number" ? position : 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, block: data });
}

// PATCH — update one or more block fields
export async function PATCH(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isSuper = user.email === SUPER_ADMIN_EMAIL;

  let body: { blockId?: unknown; updates?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { blockId, updates } = body;
  if (typeof blockId !== "string" || !blockId) {
    return NextResponse.json({ error: "blockId required" }, { status: 400 });
  }
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return NextResponse.json({ error: "updates must be an object" }, { status: 400 });
  }

  const safeUpdates = Object.fromEntries(
    Object.entries(updates as Record<string, unknown>).filter(([k]) => ALLOWED_BLOCK_FIELDS.has(k)),
  );
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: "no allowed fields in updates" }, { status: 400 });
  }

  const admin = svc();

  const { data: block } = await admin
    .schema("casa")
    .from("content_blocks")
    .select("id, property_id")
    .eq("id", blockId)
    .maybeSingle<{ id: string; property_id: string }>();

  if (!block) return NextResponse.json({ error: "not found" }, { status: 404 });

  const allowed = await isPropertyOwner(admin, block.property_id, user.id, isSuper);
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await admin
    .schema("casa")
    .from("content_blocks")
    .update(safeUpdates)
    .eq("id", blockId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a content block
export async function DELETE(req: NextRequest) {
  const userSb = await createServerSupabase();
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isSuper = user.email === SUPER_ADMIN_EMAIL;

  const blockId = new URL(req.url).searchParams.get("blockId");
  if (!blockId) return NextResponse.json({ error: "blockId required" }, { status: 400 });

  const admin = svc();

  const { data: block } = await admin
    .schema("casa")
    .from("content_blocks")
    .select("id, property_id")
    .eq("id", blockId)
    .maybeSingle<{ id: string; property_id: string }>();

  if (!block) return NextResponse.json({ error: "not found" }, { status: 404 });

  const allowed = await isPropertyOwner(admin, block.property_id, user.id, isSuper);
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await admin
    .schema("casa")
    .from("content_blocks")
    .delete()
    .eq("id", blockId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
