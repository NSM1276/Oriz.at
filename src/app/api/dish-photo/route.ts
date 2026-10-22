import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { getUser, serviceClient, venueRole } from "@/lib/auth";
import { originalPath, thumbPath } from "@/lib/media";
import { limitForPlan } from "@/lib/plans";
import { composeDish, maskCoverage, maskFromCutout, toThumb } from "@/lib/dish-photo/compose";
import { STYLES, cutOut, modelsMode, paintBackground, type StyleId } from "@/lib/dish-photo/models";

// "Hintergrund verschönern" for a dish photo: new surface and light around the
// owner's own dish (see lib/dish-photo). The owner's photo is kept as
// <item>.orig.webp, so every new style starts from it again and DELETE puts it back.

export const maxDuration = 60;

const BUCKET = "oriz-photos";

type Item = { id: string; venue_id: string; image_url: string | null; venues: { plan: string | null } };

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

async function loadItem(itemId: unknown) {
  const user = await getUser();
  if (!user) return { error: bad(401, "Bitte anmelden.") };
  if (typeof itemId !== "string" || !itemId) return { error: bad(400, "itemId fehlt.") };
  const db = serviceClient();
  const { data: item } = await db
    .from("items")
    .select("id, venue_id, image_url, venues!inner(plan)")
    .eq("id", itemId)
    .maybeSingle<Item>();
  if (!item) return { error: bad(404, "Gericht nicht gefunden.") };
  if (!(await venueRole(user.id, item.venue_id))) return { error: bad(403, "Kein Zugriff.") };
  if (!item.image_url) return { error: bad(400, "Das Gericht hat noch kein Foto.") };
  const path = `carta/${item.venue_id}/items/${item.id}.webp`;
  return { db, item, path };
}

async function exists(db: ReturnType<typeof serviceClient>, path: string): Promise<boolean> {
  const dir = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data } = await db.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
  return !!data?.some((f) => f.name === name);
}

async function save(db: ReturnType<typeof serviceClient>, item: Item, path: string, webp: Buffer) {
  const opts = { contentType: "image/webp", upsert: true, cacheControl: "3600" };
  const up = await db.storage.from(BUCKET).upload(path, webp, opts);
  if (up.error) throw new Error(up.error.message);
  await db.storage.from(BUCKET).upload(thumbPath(path), await toThumb(webp), opts);
  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${randomUUID().slice(0, 8)}`;
  await db.from("items").update({ image_url: url }).eq("id", item.id);
  return url;
}

export async function GET(req: NextRequest) {
  const r = await loadItem(req.nextUrl.searchParams.get("itemId"));
  if ("error" in r) return r.error;
  return NextResponse.json({
    mode: modelsMode(),
    styles: Object.entries(STYLES).map(([id, s]) => ({ id, label: s.label })),
    hasOriginal: await exists(r.db, originalPath(r.path)),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { itemId?: unknown; style?: unknown };
  const r = await loadItem(body.itemId);
  if ("error" in r) return r.error;
  const { db, item, path } = r;
  const style = body.style as StyleId;
  if (!(typeof style === "string" && style in STYLES)) return bad(400, "Unbekannter Stil.");
  const mode = modelsMode();
  if (mode === "off") return bad(503, "Diese Funktion ist noch nicht eingerichtet.");

  // Always start from the owner's photo, never from an earlier AI version.
  const origPath = originalPath(path);
  const hadOriginal = await exists(db, origPath);
  const sourcePath = hadOriginal ? origPath : path;
  const { data: file, error: dlErr } = await db.storage.from(BUCKET).download(sourcePath);
  if (dlErr || !file) return bad(500, "Foto konnte nicht geladen werden.");
  const original = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(original).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) return bad(400, "Foto konnte nicht gelesen werden.");

  // Paid calls count against the venue's monthly AI allowance; the test
  // stand-in costs nothing and counts nothing.
  let refund: null | (() => Promise<unknown>) = null;
  if (mode === "fal") {
    const limit = limitForPlan(item.venues.plan);
    const { data: credit, error } = await db
      .rpc("increment_ai_credits", { p_venue_id: item.venue_id, p_limit: limit })
      .maybeSingle<{ used: number }>();
    if (error) return bad(500, "Kreditprüfung fehlgeschlagen.");
    if (!credit) return bad(429, `Monatslimit erreicht (${limit} KI-Aktionen).`);
    refund = () =>
      Promise.resolve(db.from("venues").update({ ai_credits_used: Math.max(0, credit.used - 1) }).eq("id", item.venue_id));
  }

  try {
    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(sourcePath);
    const [cutout, background] = await Promise.all([
      cutOut(pub.publicUrl, width, height),
      paintBackground(style, width, height),
    ]);
    const mask = await maskFromCutout(cutout, width, height);
    const coverage = maskCoverage(mask);
    // Nothing found, or the "dish" is the whole frame: a new background would
    // either replace the food or change nothing.
    if (coverage < 0.04 || coverage > 0.92) {
      await refund?.();
      return bad(422, "Das Gericht wurde auf dem Foto nicht klar erkannt. Bitte ein Foto mit sichtbarem Teller wählen.");
    }

    const styled = await composeDish({ original, mask, background, width, height });
    if (!hadOriginal) {
      const keep = await db.storage
        .from(BUCKET)
        .upload(origPath, original, { contentType: file.type || "image/webp", upsert: true, cacheControl: "3600" });
      if (keep.error) throw new Error(keep.error.message);
    }
    const url = await save(db, item, path, styled);
    return NextResponse.json({ url, mode });
  } catch (err) {
    console.error("[dish-photo]", err);
    await refund?.();
    return bad(502, "Das Bild konnte gerade nicht erstellt werden. Bitte später noch einmal versuchen.");
  }
}

// Back to the owner's own photo.
export async function DELETE(req: NextRequest) {
  const r = await loadItem(req.nextUrl.searchParams.get("itemId"));
  if ("error" in r) return r.error;
  const { db, item, path } = r;
  const origPath = originalPath(path);
  const { data: file } = await db.storage.from(BUCKET).download(origPath);
  if (!file) return bad(404, "Kein Originalfoto gespeichert.");
  const original = Buffer.from(await file.arrayBuffer());
  const webp = file.type === "image/webp" ? original : await sharp(original).webp({ quality: 84 }).toBuffer();
  const url = await save(db, item, path, webp);
  await db.storage.from(BUCKET).remove([origPath]);
  return NextResponse.json({ url });
}
