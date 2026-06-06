import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { normalizeLogoSvg } from "@/lib/svg-normalize";

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

  // Logo targets are handled specially — SVG stored as text in DB,
  // PNG/JPG stored in Storage like a normal photo.
  if (target === "carta-venue-logo" || target === "casa-property-logo") {
    const ownerCheck =
      target === "carta-venue-logo"
        ? await admin.from("venues").select("owner_id").eq("id", id).maybeSingle<{ owner_id: string | null }>()
        : await admin.schema("casa").from("properties").select("owner_id").eq("id", id).maybeSingle<{ owner_id: string | null }>();
    if (!ownerCheck.data) return NextResponse.json({ error: "not found" }, { status: 404 });
    // Logo management is super-admin only — owners cannot upload or replace logos.
    if (!isSuper) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test((file as File).name ?? "");
    if (isSvg) {
      const text = await file.text();
      let normalized: string;
      try {
        normalized = normalizeLogoSvg(text);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "invalid svg" },
          { status: 400 },
        );
      }
      // Store SVG inline; clear any old PNG url too so VenueLogo prefers the SVG.
      const update = { logo_svg: normalized, logo_url: null as string | null };
      if (target === "carta-venue-logo") {
        await admin.from("venues").update(update).eq("id", id);
      } else {
        await admin.schema("casa").from("properties").update(update).eq("id", id);
      }
      return NextResponse.json({ ok: true, kind: "svg" });
    }
    // PNG/JPG fallback: same Storage pipeline as photos, but store URL in logo_url.
    const buf = Buffer.from(await file.arrayBuffer());
    const path = target === "carta-venue-logo" ? `carta/${id}/logo.webp` : `casa/${id}/logo.webp`;
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: "image/webp", upsert: true, cacheControl: "3600" });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${randomUUID().slice(0, 8)}`;
    const update = { logo_url: url, logo_svg: null as string | null };
    if (target === "carta-venue-logo") {
      await admin.from("venues").update(update).eq("id", id);
    } else {
      await admin.schema("casa").from("properties").update(update).eq("id", id);
    }
    return NextResponse.json({ url, kind: "raster" });
  }

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
  } else if (target === "carta-venue-cover") {
    const { data: venue } = await admin
      .from("venues")
      .select("id, owner_id")
      .eq("id", id)
      .maybeSingle<{ id: string; owner_id: string | null }>();
    if (!venue) return NextResponse.json({ error: "venue not found" }, { status: 404 });
    if (!isSuper && venue.owner_id !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    storagePath = `carta/${id}/cover.webp`;
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
  } else if (target === "carta-venue-cover") {
    await admin.from("venues").update({ cover_url: url }).eq("id", id);
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
  } else if (target === "carta-venue-cover") {
    const { data: venue } = await admin.from("venues").select("owner_id").eq("id", id).maybeSingle<{ owner_id: string | null }>();
    if (!venue) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (!isSuper && venue.owner_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    storagePath = `carta/${id}/cover.webp`;
    await admin.from("venues").update({ cover_url: null }).eq("id", id);
  } else if (target === "casa-block") {
    const { data: block } = await admin.schema("casa").from("content_blocks").select("property_id").eq("id", id).maybeSingle<{ property_id: string }>();
    if (!block) return NextResponse.json({ error: "not found" }, { status: 404 });
    const { data: prop } = await admin.schema("casa").from("properties").select("owner_id").eq("id", block.property_id).maybeSingle<{ owner_id: string | null }>();
    if (!isSuper && prop?.owner_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    storagePath = `casa/${block.property_id}/blocks/${id}.webp`;
    await admin.schema("casa").from("content_blocks").update({ image_url: null }).eq("id", id);
  } else if (target === "casa-property-all" || target === "carta-venue-all") {
    // Cascade cleanup — used when a whole property or venue is deleted.
    // Super-admin only (regular owners don't have a delete-everything UI).
    if (!isSuper) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const prefix = target === "casa-property-all" ? `casa/${id}` : `carta/${id}`;
    const { data: list } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 });
    const paths = (list ?? []).map((f) => `${prefix}/${f.name}`);
    // recurse one level (items/ and blocks/ subfolders)
    for (const sub of ["items", "blocks"]) {
      const { data: subList } = await admin.storage.from(BUCKET).list(`${prefix}/${sub}`, { limit: 1000 });
      paths.push(...(subList ?? []).map((f) => `${prefix}/${sub}/${f.name}`));
    }
    if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);
    return NextResponse.json({ ok: true, removed: paths.length });
  } else if (target === "carta-venue-logo" || target === "casa-property-logo") {
    if (!isSuper) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const logoPath = target === "carta-venue-logo" ? `carta/${id}/logo.webp` : `casa/${id}/logo.webp`;
    if (target === "carta-venue-logo") {
      await admin.from("venues").update({ logo_svg: null, logo_url: null }).eq("id", id);
    } else {
      await admin.schema("casa").from("properties").update({ logo_svg: null, logo_url: null }).eq("id", id);
    }
    await admin.storage.from(BUCKET).remove([logoPath]); // best-effort; no error if raster file never existed
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: "unknown target" }, { status: 400 });
  }

  await admin.storage.from(BUCKET).remove([storagePath]);
  return NextResponse.json({ ok: true });
}
