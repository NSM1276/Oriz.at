"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/auth";
import {
  MAX_TABLES_PER_BATCH,
  MAX_TABLES_PER_VENUE,
  newTableCode,
  nextNumericLabels,
  normalizeLabel,
} from "@/lib/tables";
import { requireVenue } from "../../venue";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Every action re-checks membership through requireVenue(slug); the client
// only ever names a venue by slug and a table by id within that venue.

async function context(slug: string) {
  const { venue } = await requireVenue(slug);
  return { venue, db: serviceClient() };
}

function done(slug: string): ActionResult {
  revalidatePath(`/app/${slug}/tische`);
  revalidatePath(`/app/${slug}`);
  return { ok: true };
}

function cleanZone(raw: string | null | undefined): string | null {
  return raw ? normalizeLabel(raw) : null;
}

export async function addTables(slug: string, input: { count: number; zone?: string }): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const count = Math.floor(Number(input.count));
  if (!(count >= 1 && count <= MAX_TABLES_PER_BATCH)) {
    return { ok: false, error: `Bitte 1 bis ${MAX_TABLES_PER_BATCH} Tische auf einmal.` };
  }

  const { data: existing } = await db
    .from("venue_tables")
    .select("label, position")
    .eq("venue_id", venue.id)
    .returns<{ label: string; position: number }[]>();
  const rows = existing ?? [];
  if (rows.length + count > MAX_TABLES_PER_VENUE) {
    return { ok: false, error: `Maximal ${MAX_TABLES_PER_VENUE} Tische pro Lokal.` };
  }

  const zone = cleanZone(input.zone);
  let position = rows.reduce((max, r) => Math.max(max, r.position), 0);
  const labels = nextNumericLabels(rows.map((r) => r.label), count);
  const { error } = await db.from("venue_tables").insert(
    labels.map((label) => ({ venue_id: venue.id, label, zone, code: newTableCode(), position: ++position })),
  );
  if (error) return { ok: false, error: "Tische konnten nicht angelegt werden." };
  return done(slug);
}

export async function addNamedTable(slug: string, input: { label: string; zone?: string }): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const label = normalizeLabel(input.label);
  if (!label) return { ok: false, error: "Bitte einen Namen eingeben (max. 40 Zeichen)." };

  const { count } = await db.from("venue_tables").select("id", { count: "exact", head: true }).eq("venue_id", venue.id);
  if ((count ?? 0) >= MAX_TABLES_PER_VENUE) return { ok: false, error: `Maximal ${MAX_TABLES_PER_VENUE} Tische pro Lokal.` };

  const { error } = await db.from("venue_tables").insert({
    venue_id: venue.id,
    label,
    zone: cleanZone(input.zone),
    code: newTableCode(),
    position: (count ?? 0) + 1,
  });
  if (error?.code === "23505") return { ok: false, error: `„${label}“ gibt es schon.` };
  if (error) return { ok: false, error: "Tisch konnte nicht angelegt werden." };
  return done(slug);
}

export async function updateTable(
  slug: string,
  id: string,
  patch: { label?: string; zone?: string | null; isActive?: boolean },
): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const update: Record<string, unknown> = {};
  if (patch.label !== undefined) {
    const label = normalizeLabel(patch.label);
    if (!label) return { ok: false, error: "Bitte einen Namen eingeben (max. 40 Zeichen)." };
    update.label = label;
  }
  if (patch.zone !== undefined) update.zone = cleanZone(patch.zone);
  if (patch.isActive !== undefined) update.is_active = !!patch.isActive;
  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await db.from("venue_tables").update(update).eq("id", id).eq("venue_id", venue.id);
  if (error?.code === "23505") return { ok: false, error: `„${update.label}“ gibt es schon.` };
  if (error) return { ok: false, error: "Änderung nicht gespeichert." };
  return done(slug);
}

/** New code for a table: the printed sticker with the old code stops working. */
export async function renewTableCode(slug: string, id: string): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const { error } = await db
    .from("venue_tables")
    .update({ code: newTableCode() })
    .eq("id", id)
    .eq("venue_id", venue.id);
  if (error) return { ok: false, error: "Neuer Code konnte nicht erstellt werden." };
  return done(slug);
}

export async function deleteTable(slug: string, id: string): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const { error } = await db.from("venue_tables").delete().eq("id", id).eq("venue_id", venue.id);
  if (error) return { ok: false, error: "Tisch konnte nicht gelöscht werden." };
  return done(slug);
}
