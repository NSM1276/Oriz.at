import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const SUPER_ADMIN_EMAIL = "nasim2131@gmail.com";
const BUCKET = "oriz-photos";
const MAX_BYTES = 1_500_000; // 1.5 MB — sanity cap after client resize

// Photo upload endpoint.
//
// Auth: must be logged in. For non-super-admin, ownership of the target
// entity is verified against the DB. Super admin bypasses ownership check.
//
// Body: multipart/form-data with fields:
//   target = "carta-item" | "casa-cover" | "casa-block"
//   id     = uuid of the row that will hold the URL
//   file   = the WebP blob (client already resized)
//
// Returns: { url: string } — the public URL to store on the row.

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: NextRequest) {
  const userSb = await createServerSupabase();
  const {
    data: { user },
  } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isSuper = user.email === SUPER_ADMIN_EMAIL;

  const form = await req.formData();
  const target = form.get("target");
  const id = form.get("id");
  const file = form.get("file");

  if (typeof target !== "string" || typeof id !== "string" || !(file instanceof Blob)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `file too large (max ${Math.round(MAX_BYTES / 1024)} KB after resize)` },
      { status: 413 },
    );
  }

  const admin = svc();

  // Ownership check + figure out storage path
  let storagePath: string;
  if (target === "carta-item") {
    const { data: item } = await admin
      .from("items")
      .select("id, venue_id, venues(owner_id)")
      .eq("id", id)
      .maybeSingle<{ id: string; venue_id: string; venues: { owner_id: string | null } }>();
    if (!item) return NextResponse.json({ error: "item not found" }, { status: 404 });
    if (!isSuper && item.venues.owner_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    storagePath = `carta/${item.venue_id}/items/${id}.webp`;
  } else if (target === "casa-cover") {
    const { data: prop } = await admin
      .schema("casa")
      .from("properties")
      .select("id, owner_id")
      .eq("id", id)
      .maybeSingle<{ id: string; owner_id: string | null }>();
    if (!prop) return NextResponse.json({ error: "property not found" }, { status: 404 });
    if (!isSuper && prop.owner_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    storagePath = `casa/${id}/cover.webp`;
  } else if (target === "casa-block") {
    const { data: block } = await admin
      .schema("casa")
      .from("content_blocks")
      .select("id, property_id")
      .eq("id", id)
      .maybeSingle<{ id: string; property_id: string }>();
    if (!block) return NextResponse.json({ error: "block not found" }, { status: 404 });
    const { data: prop } = await admin
      .schema("casa")
      .from("properties")
      .select("owner_id")
      .eq("id", block.property_id)
      .maybeSingle<{ owner_id: string | null }>();
    if (!isSuper && prop?.owner_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    storagePath = `casa/${block.property_id}/blocks/${id}.webp`;
  } else {
    return NextResponse.json({ error: "unknown target" }, { status: 400 });
  }

  // Upload (upsert so re-uploading the same target overwrites cleanly)
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "3600",
    });
  if (upErr) {
    console.error("[upload-photo] storage error:", upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  // Bust the CDN cache for repeat uploads by appending a version param.
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
  const url = `${pub.publicUrl}?v=${randomUUID().slice(0, 8)}`;

  // Persist the URL back to the row so the page sees it on next read.
  if (target === "carta-item") {
    await admin.from("items").update({ image_url: url }).eq("id", id);
  } else if (target === "casa-cover") {
    await admin.schema("casa").from("properties").update({ cover_url: url }).eq("id", id);
  } else if (target === "casa-block") {
    await admin.schema("casa").from("content_blocks").update({ image_url: url }).eq("id", id);
  }

  return NextResponse.json({ url });
}

// Delete endpoint — same auth model, removes the file and clears the URL.
export async function DELETE(req: NextRequest) {
  const userSb = await createServerSupabase();
  const {
    data: { user },
  } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const isSuper = user.email === SUPER_ADMIN_EMAIL;

  const url = new URL(req.url);
  const target = url.searchParams.get("target");
  const id = url.searchParams.get("id");
  if (!target || !id) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const admin = svc();
  let storagePath: string;

  if (target === "carta-item") {
    const { data: item } = await admin
      .from("items")
      .select("venue_id, venues(owner_id)")
      .eq("id", id)
      .maybeSingle<{ venue_id: string; venues: { owner_id: string | null } }>();
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (!isSuper && item.venues.owner_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    storagePath = `carta/${item.venue_id}/items/${id}.webp`;
    await admin.from("items").update({ image_url: null }).eq("id", id);
  } else if (target === "casa-cover") {
    const { data: prop } = await admin.schema("casa").from("properties").select("owner_id").eq("id", id).maybeSingle<{ owner_id: string | null }>();
    if (!isSuper && prop?.owner_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    storagePath = `casa/${id}/cover.webp`;
    await admin.schema("casa").from("properties").update({ cover_url: null }).eq("id", id);
  } else if (target === "casa-block") {
    const { data: block } = await admin.schema("casa").from("content_blocks").select("property_id").eq("id", id).maybeSingle<{ property_id: string }>();
    if (!block) return NextResponse.json({ error: "not found" }, { status: 404 });
    const { data: prop } = await admin.schema("casa").from("properties").select("owner_id").eq("id", block.property_id).maybeSingle<{ owner_id: string | null }>();
    if (!isSuper && prop?.owner_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    storagePath = `casa/${block.property_id}/blocks/${id}.webp`;
    await admin.schema("casa").from("content_blocks").update({ image_url: null }).eq("id", id);
  } else {
    return NextResponse.json({ error: "unknown target" }, { status: 400 });
  }

  await admin.storage.from(BUCKET).remove([storagePath]);
  return NextResponse.json({ ok: true });
}
