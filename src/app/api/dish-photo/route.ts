import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getUser, isPlatformAdmin, serviceClient, venueRole } from "@/lib/auth";
import { blobExists, fetchBlob, isBlobUrl, putPublic, removeUrls, stampedPath } from "@/lib/blob";
import { originalUrl, thumbPath, thumbUrl } from "@/lib/media";
import { composeDish, maskCoverage, maskFromCutout, toThumb } from "@/lib/dish-photo/compose";
import { STYLES, cutOut, modelsMode, paintBackground, type StyleId } from "@/lib/dish-photo/models";

// "Hintergrund verschönern" for a dish photo: new surface and light around the
// owner's own dish (see lib/dish-photo). The owner's photo is kept as
// ….orig.webp next to the styled one, so every new style starts from it again
// and DELETE puts it back. Files live in Vercel Blob (lib/blob.ts).

export const maxDuration = 60;

type Item = { id: string; venue_id: string; image_url: string | null };

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
    .select("id, venue_id, image_url")
    .eq("id", itemId)
    .maybeSingle<Item>();
  if (!item) return { error: bad(404, "Gericht nicht gefunden.") };
  if (!(await venueRole(user.id, item.venue_id))) return { error: bad(403, "Kein Zugriff.") };
  if (!item.image_url) return { error: bad(400, "Das Gericht hat noch kein Foto.") };
  if (!isBlobUrl(item.image_url)) return { error: bad(400, "Dieses Foto stammt noch aus dem alten Speicher — bitte einmal neu hochladen.") };
  return { db, item, url: item.image_url, mode: await modeFor(user.id) };
}

// The paid models are a tool for us, not a button for owners: owners order
// photo editing as a paid service (/app/<slug>/leistungen) and we do it here.
// Owners see no button, so free users never cost anything.
async function modeFor(userId: string): Promise<"fal" | "test" | "off"> {
  const mode = modelsMode();
  if (mode === "fal" && !(await isPlatformAdmin(userId))) return "off";
  return mode;
}

/** Stores a new version of the dish photo (new name, old one removed) and points the row at it. */
async function save(db: ReturnType<typeof serviceClient>, item: Item, currentUrl: string, webp: Buffer) {
  const path = stampedPath(`carta/${item.venue_id}/items`, item.id);
  const url = await putPublic(path, webp, "image/webp");
  await putPublic(thumbPath(path), await toThumb(webp), "image/webp");
  await db.from("items").update({ image_url: url }).eq("id", item.id);
  // The previous version and its small copy go; the kept original is handled by the caller.
  await removeUrls([currentUrl, thumbUrl(currentUrl)]);
  return url;
}

export async function GET(req: NextRequest) {
  const r = await loadItem(req.nextUrl.searchParams.get("itemId"));
  if ("error" in r) return r.error;
  return NextResponse.json({
    mode: r.mode,
    styles: Object.entries(STYLES).map(([id, s]) => ({ id, label: s.label })),
    hasOriginal: await blobExists(originalUrl(r.url)),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { itemId?: unknown; style?: unknown };
  const r = await loadItem(body.itemId);
  if ("error" in r) return r.error;
  const { db, item, url, mode } = r;
  const style = body.style as StyleId;
  if (!(typeof style === "string" && style in STYLES)) return bad(400, "Unbekannter Stil.");
  if (mode === "off") return bad(503, "Diese Funktion ist noch nicht eingerichtet.");

  // Always start from the owner's photo, never from an earlier AI version.
  const origUrl = originalUrl(url);
  const hadOriginal = await blobExists(origUrl);
  const source = await fetchBlob(hadOriginal ? origUrl : url);
  if (!source) return bad(500, "Foto konnte nicht geladen werden.");
  const original = source.bytes;
  const meta = await sharp(original).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) return bad(400, "Foto konnte nicht gelesen werden.");

  try {
    const [cutout, background] = await Promise.all([
      cutOut(hadOriginal ? origUrl : url, width, height),
      paintBackground(style, width, height),
    ]);
    const mask = await maskFromCutout(cutout, width, height);
    const coverage = maskCoverage(mask);
    // Nothing found, or the "dish" is the whole frame: a new background would
    // either replace the food or change nothing.
    if (coverage < 0.04 || coverage > 0.92) {
      return bad(422, "Das Gericht wurde auf dem Foto nicht klar erkannt. Bitte ein Foto mit sichtbarem Teller wählen.");
    }

    const styled = await composeDish({ original, mask, background, width, height });
    const next = await save(db, item, url, styled);
    // The owner's photo stays next to the styled one, under the new name.
    await putPublic(originalUrl(next), original, source.type.startsWith("image/") ? source.type : "image/webp");
    if (hadOriginal) await removeUrls([origUrl]);
    return NextResponse.json({ url: next, mode });
  } catch (err) {
    console.error("[dish-photo]", err);
    return bad(502, "Das Bild konnte gerade nicht erstellt werden. Bitte später noch einmal versuchen.");
  }
}

// Back to the owner's own photo.
export async function DELETE(req: NextRequest) {
  const r = await loadItem(req.nextUrl.searchParams.get("itemId"));
  if ("error" in r) return r.error;
  const { db, item, url } = r;
  const origUrl = originalUrl(url);
  const source = await fetchBlob(origUrl);
  if (!source) return bad(404, "Kein Originalfoto gespeichert.");
  const webp = source.type === "image/webp" ? source.bytes : await sharp(source.bytes).webp({ quality: 84 }).toBuffer();
  const next = await save(db, item, url, webp);
  await removeUrls([origUrl]);
  return NextResponse.json({ url: next });
}
