import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isTableCode } from "@/lib/tables";

// A scanned table sticker sets this cookie and redirects to the clean menu
// URL, so a shared menu link never carries the table code.
export const TABLE_COOKIE = "oriz_table";
export const TABLE_COOKIE_MAX_AGE = 3 * 60 * 60;

export type ResolvedTable = { tableId: string; venueId: string; venueSlug: string; label: string };

export async function resolveTableCode(code: string): Promise<ResolvedTable | null> {
  if (!isTableCode(code)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("resolve_table", { p_code: code.toUpperCase() });
  const row = (data as { table_id: string; venue_id: string; venue_slug: string; label: string }[] | null)?.[0];
  return row ? { tableId: row.table_id, venueId: row.venue_id, venueSlug: row.venue_slug, label: row.label } : null;
}

/** The guest's table at this venue, if they arrived through a sticker. */
export async function currentTable(venueSlug: string): Promise<ResolvedTable | null> {
  const code = (await cookies()).get(TABLE_COOKIE)?.value;
  if (!code) return null;
  const table = await resolveTableCode(code);
  return table && table.venueSlug === venueSlug ? table : null;
}
