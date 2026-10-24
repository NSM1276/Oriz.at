import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/auth";
import { isBlobUrl, removePrefix } from "@/lib/blob";
import { PHOTO_GRACE_DAYS } from "@/lib/entitlements";
import { bearerMatches } from "@/lib/secrets";

// Nightly (vercel.json): venues whose trial ended, or whose plan was cancelled, more than
// PHOTO_GRACE_DAYS ago and who have not bought a plan lose their photo files. The menu text
// stays — the hook for coming back — only the storage stops costing. Paying within the grace
// period brings the photos back untouched (the guest page simply stops hiding them).

export const maxDuration = 60;

type Row = { venue_id: string; status: string; trial_ends_at: string | null; updated_at: string | null; venues: { slug: string } | { slug: string }[] | null };

export async function GET(req: NextRequest) {
  if (!bearerMatches(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = serviceClient();
  const cutoff = new Date(Date.now() - PHOTO_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: trials }, { data: cancelled }] = await Promise.all([
    db.from("subscriptions").select("venue_id, status, trial_ends_at, updated_at, venues(slug)").eq("status", "trialing").lt("trial_ends_at", cutoff).returns<Row[]>(),
    db.from("subscriptions").select("venue_id, status, trial_ends_at, updated_at, venues(slug)").eq("status", "canceled").lt("updated_at", cutoff).returns<Row[]>(),
  ]);

  const done: { slug: string; files: number; items: number }[] = [];
  for (const row of [...(trials ?? []), ...(cancelled ?? [])]) {
    const venueId = row.venue_id;
    const slug = (Array.isArray(row.venues) ? row.venues[0] : row.venues)?.slug ?? venueId;
    const { data: items } = await db.from("items").select("id, image_url").eq("venue_id", venueId).not("image_url", "is", null).returns<{ id: string; image_url: string }[]>();
    const ours = (items ?? []).filter((it) => isBlobUrl(it.image_url));
    const { data: venue } = await db.from("venues").select("logo_url, cover_url").eq("id", venueId).maybeSingle<{ logo_url: string | null; cover_url: string | null }>();
    if (ours.length === 0 && !isBlobUrl(venue?.logo_url) && !isBlobUrl(venue?.cover_url)) continue;

    const files = await removePrefix(`carta/${venueId}/`);
    if (ours.length > 0) await db.from("items").update({ image_url: null }).in("id", ours.map((it) => it.id));
    const patch: Record<string, null> = {};
    if (isBlobUrl(venue?.logo_url)) patch.logo_url = null;
    if (isBlobUrl(venue?.cover_url)) patch.cover_url = null;
    if (Object.keys(patch).length > 0) await db.from("venues").update(patch).eq("id", venueId);
    done.push({ slug, files, items: ours.length });
  }

  return NextResponse.json({ ok: true, graceDays: PHOTO_GRACE_DAYS, cleaned: done });
}
