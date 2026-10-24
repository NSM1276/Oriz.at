"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/auth";
import { cleanLocales, cleanSectionName, dishFromForm, type DishForm } from "@/lib/menu-edit";
import { allowedLocales } from "@/lib/entitlements";
import { getEntitlements } from "@/lib/entitlements-server";
import { requireOpenVenue } from "../../venue";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// Every action re-checks membership via requireOpenVenue(slug) and only touches
// rows whose venue_id is that venue — ids from the browser are never trusted alone.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function context(slug: string) {
  const { venue } = await requireOpenVenue(slug);
  const db = serviceClient();
  const { data } = await db.from("venues").select("enabled_locales").eq("id", venue.id).single<{ enabled_locales: string[] | null }>();
  return { venue, db, locales: data?.enabled_locales ?? [] };
}

function done(slug: string, id?: string): ActionResult {
  revalidatePath(`/app/${slug}/speisekarte`, "layout");
  revalidatePath(`/${slug}`);
  return { ok: true, id };
}

async function itemOfVenue(db: ReturnType<typeof serviceClient>, venueId: string, itemId: string) {
  if (!UUID.test(itemId)) return null;
  const { data } = await db
    .from("items")
    .select("id, section_id, position, translations")
    .eq("id", itemId)
    .eq("venue_id", venueId)
    .maybeSingle<{ id: string; section_id: string; position: number; translations: Record<string, { name?: string; description?: string }> | null }>();
  return data;
}

async function sectionOfVenue(db: ReturnType<typeof serviceClient>, venueId: string, sectionId: string) {
  if (!UUID.test(sectionId)) return null;
  const { data } = await db
    .from("sections")
    .select("id, position, translations")
    .eq("id", sectionId)
    .eq("venue_id", venueId)
    .maybeSingle<{ id: string; position: number; translations: Record<string, { name?: string }> | null }>();
  return data;
}

// ── Sections ──────────────────────────────────────────────────────────────

export async function createSection(slug: string, rawName: string): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const name = cleanSectionName(rawName);
  if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
  const { data: last } = await db.from("sections").select("position").eq("venue_id", venue.id).order("position", { ascending: false }).limit(1).maybeSingle<{ position: number }>();
  const { data, error } = await db
    .from("sections")
    .insert({ venue_id: venue.id, name, position: (last?.position ?? -1) + 1 })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { ok: false, error: "Bereich konnte nicht angelegt werden." };
  return done(slug, data.id);
}

export async function saveSection(
  slug: string,
  sectionId: string,
  input: { name: string; translations: Record<string, string> },
): Promise<ActionResult> {
  const { venue, db, locales } = await context(slug);
  const section = await sectionOfVenue(db, venue.id, sectionId);
  if (!section) return { ok: false, error: "Bereich nicht gefunden." };
  const name = cleanSectionName(input.name);
  if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
  const translations = { ...(section.translations ?? {}) };
  for (const l of locales) {
    const t = cleanSectionName(input.translations?.[l]);
    if (t) translations[l] = { name: t };
    else delete translations[l];
  }
  const { error } = await db.from("sections").update({ name, translations }).eq("id", section.id);
  if (error) return { ok: false, error: "Bereich konnte nicht gespeichert werden." };
  return done(slug);
}

export async function moveSection(slug: string, sectionId: string, direction: -1 | 1): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const { data: all } = await db.from("sections").select("id, position").eq("venue_id", venue.id).order("position").returns<{ id: string; position: number }[]>();
  const list = all ?? [];
  const i = list.findIndex((s) => s.id === sectionId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  // Positions may have gaps or repeats from older tools; renumber while swapping.
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((s, idx) => (s.position === idx ? null : db.from("sections").update({ position: idx }).eq("id", s.id))));
  return done(slug);
}

export async function deleteSection(slug: string, sectionId: string): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const section = await sectionOfVenue(db, venue.id, sectionId);
  if (!section) return { ok: false, error: "Bereich nicht gefunden." };
  // Dishes go with their section (foreign key cascade); the UI asked first.
  const { error } = await db.from("sections").delete().eq("id", section.id);
  if (error) return { ok: false, error: "Bereich konnte nicht gelöscht werden." };
  return done(slug);
}

// ── Dishes ────────────────────────────────────────────────────────────────

export async function setAvailable(slug: string, itemId: string, available: boolean): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const item = await itemOfVenue(db, venue.id, itemId);
  if (!item) return { ok: false, error: "Gericht nicht gefunden." };
  const { error } = await db.from("items").update({ is_active: !!available }).eq("id", item.id);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  return done(slug);
}

export async function saveDish(
  slug: string,
  input: { itemId: string | null; sectionId: string; form: DishForm },
): Promise<ActionResult> {
  const { venue, db, locales } = await context(slug);
  const section = await sectionOfVenue(db, venue.id, input.sectionId);
  if (!section) return { ok: false, error: "Bitte einen Bereich wählen." };

  const existing = input.itemId ? await itemOfVenue(db, venue.id, input.itemId) : null;
  if (input.itemId && !existing) return { ok: false, error: "Gericht nicht gefunden." };

  const result = dishFromForm(input.form, locales, existing?.translations ?? {});
  if (!result.ok) return result;

  if (existing) {
    const moved = existing.section_id !== section.id;
    let position = existing.position;
    if (moved) {
      const { data: last } = await db.from("items").select("position").eq("section_id", section.id).order("position", { ascending: false }).limit(1).maybeSingle<{ position: number }>();
      position = (last?.position ?? -1) + 1;
    }
    const { error } = await db
      .from("items")
      .update({ ...result.row, section_id: section.id, position })
      .eq("id", existing.id);
    if (error) return { ok: false, error: "Gericht konnte nicht gespeichert werden." };
    return done(slug, existing.id);
  }

  const { data: last } = await db.from("items").select("position").eq("section_id", section.id).order("position", { ascending: false }).limit(1).maybeSingle<{ position: number }>();
  const { data, error } = await db
    .from("items")
    .insert({ ...result.row, venue_id: venue.id, section_id: section.id, position: (last?.position ?? -1) + 1 })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { ok: false, error: "Gericht konnte nicht angelegt werden." };
  return done(slug, data.id);
}

export async function moveDish(slug: string, itemId: string, direction: -1 | 1): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const item = await itemOfVenue(db, venue.id, itemId);
  if (!item) return { ok: false, error: "Gericht nicht gefunden." };
  const { data: all } = await db.from("items").select("id, position").eq("section_id", item.section_id).order("position").returns<{ id: string; position: number }[]>();
  const list = all ?? [];
  const i = list.findIndex((it) => it.id === itemId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((it, idx) => (it.position === idx ? null : db.from("items").update({ position: idx }).eq("id", it.id))));
  return done(slug);
}

export async function deleteDish(slug: string, itemId: string): Promise<ActionResult> {
  const { venue, db } = await context(slug);
  const item = await itemOfVenue(db, venue.id, itemId);
  if (!item) return { ok: false, error: "Gericht nicht gefunden." };
  const { error } = await db.from("items").delete().eq("id", item.id);
  if (error) return { ok: false, error: "Gericht konnte nicht gelöscht werden." };
  return done(slug);
}

// ── Languages ─────────────────────────────────────────────────────────────

export async function setLocales(slug: string, locales: string[]): Promise<ActionResult> {
  const { venue, db, locales: stored } = await context(slug);
  // Only languages the plan includes can change; the others keep their stored state
  // (a venue that drops "20+ Sprachen" gets them back when it books the add-on again).
  const allowed = allowedLocales(await getEntitlements(venue.id));
  const kept = cleanLocales(stored).filter((l) => !allowed.includes(l));
  const next = cleanLocales([...kept, ...cleanLocales(locales, allowed)]);
  const { error } = await db.from("venues").update({ enabled_locales: next }).eq("id", venue.id);
  if (error) return { ok: false, error: "Sprachen konnten nicht gespeichert werden." };
  return done(slug);
}
