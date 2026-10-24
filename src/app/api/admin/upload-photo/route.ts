import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { normalizeLogoSvg } from "@/lib/svg-normalize";
import { isPlatformAdmin, venueRole } from "@/lib/auth";
import { isBlobUrl, putPublic, removePrefix, removeUrls, stampedPath } from "@/lib/blob";
import { maxPhotos, TRIAL_MAX_PHOTOS } from "@/lib/entitlements";
import { getEntitlements } from "@/lib/entitlements-server";
import { originalPath, thumbPath } from "@/lib/media";

const MAX_BYTES = 1_500_000; // 1.5 MB — sanity cap after client resize
const MAX_THUMB_BYTES = 300_000;

// The client sends WebP, or JPEG from browsers that cannot encode WebP.
function imageType(blob: Blob): string {
  return blob.type === "image/jpeg" ? "image/jpeg" : "image/webp";
}

// Photo upload endpoint. Files go to Vercel Blob (see lib/blob.ts), the URL to the row.
//
// Auth: must be logged in. For non-super-admin, ownership of the target
// entity is verified against the DB. Super admin bypasses ownership check.
//
// Body: multipart/form-data with fields:
//   target = "carta-item" | "carta-venue-cover" | "carta-venue-logo" | "casa-cover" | "casa-block" | "casa-property-logo"
//   id     = uuid of the row that will hold the URL
//   file   = the WebP blob (client already resized)
//   thumb  = optional 640 px copy (photos only)
//
// Returns: { url: string } — the public URL stored on the row.

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/** Removes a photo and its small copy / kept original, if they are ours (covers get a small copy too). */
async function removePhoto(url: string | null | undefined) {
  if (!isBlobUrl(url)) return;
  await removeUrls([url, thumbPath(url), originalPath(url)]);
}

/** After the trial without a plan the venue is read-only — no new files on our storage either. */
async function venueLocked(venueId: string): Promise<boolean> {
  return (await getEntitlements(venueId)).locked;
}
const LOCKED = { error: "Die Testphase ist beendet. Zum Bearbeiten bitte einen Tarif wählen." };

export async function POST(req: NextRequest) {
  const userSb = await createServerSupabase();
  const {
    data: { user },
  } = await userSb.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const isSuper = await isPlatformAdmin(user.id);

  const form = await req.formData();
  const target = form.get("target");
  const id = form.get("id");
  const file = form.get("file");

  if (typeof target !== "string" || typeof id !== "string" || !(file instanceof Blob)) {
    return json({ error: "bad request" }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: `file too large (max ${Math.round(MAX_BYTES / 1024)} KB after resize)` }, 413);
  }

  const admin = svc();

  // Logo targets are handled specially — SVG stored as text in DB,
  // PNG/JPG stored like a normal photo.
  if (target === "carta-venue-logo" || target === "casa-property-logo") {
    const ownerCheck =
      target === "carta-venue-logo"
        ? await admin.from("venues").select("owner_id, logo_url").eq("id", id).maybeSingle<{ owner_id: string | null; logo_url: string | null }>()
        : await admin.schema("casa").from("properties").select("owner_id, logo_url").eq("id", id).maybeSingle<{ owner_id: string | null; logo_url: string | null }>();
    if (!ownerCheck.data) return json({ error: "not found" }, 404);
    // Owners set up their restaurant themselves, logo included — as a picture.
    // SVG is inlined into the page, so SVG logos stay with platform admins.
    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test((file as File).name ?? "");
    if (!isSuper) {
      const isOwner = target === "carta-venue-logo" && (await venueRole(user.id, id)) === "owner";
      if (!isOwner) return json({ error: "forbidden" }, 403);
      if (isSvg) return json({ error: "SVG-Logos richten wir für Sie ein. Bitte das Logo als PNG oder JPG hochladen." }, 400);
      if (await venueLocked(id)) return json(LOCKED, 403);
    }

    if (isSvg) {
      const text = await file.text();
      let normalized: string;
      try {
        normalized = normalizeLogoSvg(text);
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "invalid svg" }, 400);
      }
      // Store SVG inline; clear any old PNG url too so VenueLogo prefers the SVG.
      const update = { logo_svg: normalized, logo_url: null as string | null };
      if (target === "carta-venue-logo") await admin.from("venues").update(update).eq("id", id);
      else await admin.schema("casa").from("properties").update(update).eq("id", id);
      await removeUrls([ownerCheck.data.logo_url]);
      return json({ ok: true, kind: "svg" });
    }
    // PNG/JPG: same pipeline as photos, but the URL goes to logo_url.
    const dir = target === "carta-venue-logo" ? `carta/${id}` : `casa/${id}`;
    let url: string;
    try {
      url = await putPublic(stampedPath(dir, "logo"), file, imageType(file));
    } catch (err) {
      console.error("[upload-photo] blob error:", err);
      return json({ error: "Das Logo konnte nicht gespeichert werden." }, 500);
    }
    const update = { logo_url: url, logo_svg: null as string | null };
    if (target === "carta-venue-logo") await admin.from("venues").update(update).eq("id", id);
    else await admin.schema("casa").from("properties").update(update).eq("id", id);
    await removeUrls([ownerCheck.data.logo_url]);
    return json({ url, kind: "raster" });
  }

  // Ownership check + where the file goes + what it replaces
  let dir: string;
  let base: string;
  let previous: string | null = null;
  if (target === "carta-item") {
    const { data: item } = await admin
      .from("items")
      .select("id, venue_id, image_url")
      .eq("id", id)
      .maybeSingle<{ id: string; venue_id: string; image_url: string | null }>();
    if (!item) return json({ error: "item not found" }, 404);
    // Any member of the venue (owner or manager) may change dish photos.
    if (!(await venueRole(user.id, item.venue_id))) return json({ error: "forbidden" }, 403);
    const ent = await getEntitlements(item.venue_id);
    if (ent.locked && !isSuper) return json(LOCKED, 403);
    // The free trial holds a real menu's worth of photos, not an unlimited store.
    if (!item.image_url) {
      const limit = maxPhotos(ent);
      if (Number.isFinite(limit)) {
        const { count } = await admin.from("items").select("id", { count: "exact", head: true }).eq("venue_id", item.venue_id).not("image_url", "is", null);
        if ((count ?? 0) >= limit) {
          return json({ error: `In der Testphase sind bis zu ${TRIAL_MAX_PHOTOS} Fotos möglich. Mit einem Tarif gibt es keine Grenze.` }, 403);
        }
      }
    }
    dir = `carta/${item.venue_id}/items`;
    base = id;
    previous = item.image_url;
  } else if (target === "casa-cover") {
    const { data: prop } = await admin
      .schema("casa")
      .from("properties")
      .select("id, owner_id, cover_url")
      .eq("id", id)
      .maybeSingle<{ id: string; owner_id: string | null; cover_url: string | null }>();
    if (!prop) return json({ error: "property not found" }, 404);
    if (!isSuper && prop.owner_id !== user.id) return json({ error: "forbidden" }, 403);
    dir = `casa/${id}`;
    base = "cover";
    previous = prop.cover_url;
  } else if (target === "carta-venue-cover") {
    const { data: venue } = await admin
      .from("venues")
      .select("id, cover_url")
      .eq("id", id)
      .maybeSingle<{ id: string; cover_url: string | null }>();
    if (!venue) return json({ error: "venue not found" }, 404);
    if (!(await venueRole(user.id, venue.id))) return json({ error: "forbidden" }, 403);
    if (!isSuper && (await venueLocked(venue.id))) return json(LOCKED, 403);
    dir = `carta/${id}`;
    base = "cover";
    previous = venue.cover_url;
  } else if (target === "casa-block") {
    const { data: block } = await admin
      .schema("casa")
      .from("content_blocks")
      .select("id, property_id, image_url")
      .eq("id", id)
      .maybeSingle<{ id: string; property_id: string; image_url: string | null }>();
    if (!block) return json({ error: "block not found" }, 404);
    const { data: prop } = await admin.schema("casa").from("properties").select("owner_id").eq("id", block.property_id).maybeSingle<{ owner_id: string | null }>();
    if (!isSuper && prop?.owner_id !== user.id) return json({ error: "forbidden" }, 403);
    dir = `casa/${block.property_id}/blocks`;
    base = id;
    previous = block.image_url;
  } else {
    return json({ error: "unknown target" }, 400);
  }

  // A new name per upload: the CDN keeps a file for a year, so a replaced photo must not reuse the URL.
  const path = stampedPath(dir, base);
  let url: string;
  try {
    url = await putPublic(path, file, imageType(file));
    // Small copy next to it (see thumbUrl in lib/media.ts). Optional: older
    // clients send none, and the guest menu then falls back to the full photo.
    const thumb = form.get("thumb");
    if (thumb instanceof Blob && thumb.size <= MAX_THUMB_BYTES) {
      await putPublic(thumbPath(path), thumb, imageType(thumb));
    }
  } catch (err) {
    console.error("[upload-photo] blob error:", err);
    return json({ error: "Das Foto konnte nicht gespeichert werden." }, 500);
  }

  // Persist the URL back to the row so the page sees it on next read.
  if (target === "carta-item") await admin.from("items").update({ image_url: url }).eq("id", id);
  else if (target === "carta-venue-cover") await admin.from("venues").update({ cover_url: url }).eq("id", id);
  else if (target === "casa-cover") await admin.schema("casa").from("properties").update({ cover_url: url }).eq("id", id);
  else if (target === "casa-block") await admin.schema("casa").from("content_blocks").update({ image_url: url }).eq("id", id);

  // The replaced photo goes, with its small copy and any AI original kept for it.
  await removePhoto(previous);

  return json({ url });
}

// Delete endpoint — same auth model, removes the file and clears the URL.
export async function DELETE(req: NextRequest) {
  const userSb = await createServerSupabase();
  const {
    data: { user },
  } = await userSb.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  const isSuper = await isPlatformAdmin(user.id);

  const url = new URL(req.url);
  const target = url.searchParams.get("target");
  const id = url.searchParams.get("id");
  if (!target || !id) return json({ error: "bad request" }, 400);

  const admin = svc();
  let previous: string | null = null;

  if (target === "carta-item") {
    const { data: item } = await admin.from("items").select("venue_id, image_url").eq("id", id).maybeSingle<{ venue_id: string; image_url: string | null }>();
    if (!item) return json({ error: "not found" }, 404);
    if (!(await venueRole(user.id, item.venue_id))) return json({ error: "forbidden" }, 403);
    previous = item.image_url;
    await admin.from("items").update({ image_url: null }).eq("id", id);
  } else if (target === "casa-cover") {
    const { data: prop } = await admin.schema("casa").from("properties").select("owner_id, cover_url").eq("id", id).maybeSingle<{ owner_id: string | null; cover_url: string | null }>();
    if (!isSuper && prop?.owner_id !== user.id) return json({ error: "forbidden" }, 403);
    previous = prop?.cover_url ?? null;
    await admin.schema("casa").from("properties").update({ cover_url: null }).eq("id", id);
  } else if (target === "carta-venue-cover") {
    const { data: venue } = await admin.from("venues").select("id, cover_url").eq("id", id).maybeSingle<{ id: string; cover_url: string | null }>();
    if (!venue) return json({ error: "not found" }, 404);
    if (!(await venueRole(user.id, venue.id))) return json({ error: "forbidden" }, 403);
    previous = venue.cover_url;
    await admin.from("venues").update({ cover_url: null }).eq("id", id);
  } else if (target === "casa-block") {
    const { data: block } = await admin.schema("casa").from("content_blocks").select("property_id, image_url").eq("id", id).maybeSingle<{ property_id: string; image_url: string | null }>();
    if (!block) return json({ error: "not found" }, 404);
    const { data: prop } = await admin.schema("casa").from("properties").select("owner_id").eq("id", block.property_id).maybeSingle<{ owner_id: string | null }>();
    if (!isSuper && prop?.owner_id !== user.id) return json({ error: "forbidden" }, 403);
    previous = block.image_url;
    await admin.schema("casa").from("content_blocks").update({ image_url: null }).eq("id", id);
  } else if (target === "casa-property-all" || target === "carta-venue-all") {
    // Cascade cleanup — used when a whole property or venue is deleted.
    // Super-admin only (regular owners don't have a delete-everything UI).
    if (!isSuper) return json({ error: "forbidden" }, 403);
    const removed = await removePrefix(target === "casa-property-all" ? `casa/${id}/` : `carta/${id}/`);
    return json({ ok: true, removed });
  } else if (target === "carta-venue-logo" || target === "casa-property-logo") {
    const isOwner = target === "carta-venue-logo" && (await venueRole(user.id, id)) === "owner";
    if (!isSuper && !isOwner) return json({ error: "forbidden" }, 403);
    const current =
      target === "carta-venue-logo"
        ? await admin.from("venues").select("logo_url").eq("id", id).maybeSingle<{ logo_url: string | null }>()
        : await admin.schema("casa").from("properties").select("logo_url").eq("id", id).maybeSingle<{ logo_url: string | null }>();
    const update = { logo_svg: null as string | null, logo_url: null as string | null };
    if (target === "carta-venue-logo") await admin.from("venues").update(update).eq("id", id);
    else await admin.schema("casa").from("properties").update(update).eq("id", id);
    await removeUrls([current.data?.logo_url]);
    return json({ ok: true });
  } else {
    return json({ error: "unknown target" }, 400);
  }

  await removePhoto(previous);
  return json({ ok: true });
}
