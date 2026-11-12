import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { serviceClient } from "@/lib/auth";
import { TABLE_COOKIE, resolveTableCode } from "@/lib/table-session";

export const dynamic = "force-dynamic";

// Counts for the owner's statistics page (migration 0027): "menu opened" and "dish card opened".
// Nothing about the guest is stored or set — no cookie, no IP, only a counter per day.
// The table comes from the sticker cookie the guest already has, never from the body.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ok = () => new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(req: NextRequest) {
  let body: { venueId?: unknown; kind?: unknown; itemId?: unknown };
  try { body = await req.json(); } catch { return ok(); }
  const { venueId, kind, itemId } = body;
  if (typeof venueId !== "string" || !UUID.test(venueId)) return ok();
  if (kind !== "view" && kind !== "dish") return ok();

  const db = serviceClient();
  let ref: string | null = null;

  if (kind === "view") {
    const code = (await cookies()).get(TABLE_COOKIE)?.value;
    const table = code ? await resolveTableCode(code) : null;
    if (table && table.venueId === venueId) ref = table.tableId;
  } else {
    if (typeof itemId !== "string" || !UUID.test(itemId)) return ok();
    // Only dishes of this venue count, so nobody can pad another venue's numbers with made-up ids.
    const { data } = await db.from("items").select("id").eq("id", itemId).eq("venue_id", venueId).maybeSingle();
    if (!data) return ok();
    ref = itemId;
  }

  const { error } = await db.rpc("count_menu_event", { p_venue: venueId, p_kind: kind, p_ref: ref });
  if (error) console.error("[track]", error.message);
  return ok();
}
