"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements-server";
import { menuLimitProblem } from "@/lib/entitlements";
import { cleanMenuInput, reorder } from "@/lib/menus-edit";
import { requireOpenVenue } from "../../venue";

export type MenuActionResult = { ok: true } | { ok: false; error: string };

// Same rules as the other /app actions: membership is re-checked from the slug, and an id from the
// browser only counts when the row belongs to that venue. Creating a menu also checks the plan.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Db = ReturnType<typeof serviceClient>;

async function context(slug: string) {
  const { venue } = await requireOpenVenue(slug);
  return { venue, db: serviceClient() };
}

function done(slug: string): MenuActionResult {
  revalidatePath(`/app/${slug}/speisekarte`, "layout");
  revalidatePath(`/${slug}`);
  return { ok: true };
}

async function menuIds(db: Db, venueId: string): Promise<string[]> {
  const { data } = await db.from("menus").select("id").eq("venue_id", venueId).order("position").returns<{ id: string }[]>();
  return (data ?? []).map((m) => m.id);
}

async function ownsMenu(db: Db, venueId: string, menuId: string): Promise<boolean> {
  if (!UUID.test(menuId)) return false;
  const { data } = await db.from("menus").select("id").eq("id", menuId).eq("venue_id", venueId).maybeSingle();
  return !!data;
}

/** Positions 0, 1, 2 … in the given order. */
async function renumber(db: Db, ids: string[]) {
  await Promise.all(ids.map((id, position) => db.from("menus").update({ position }).eq("id", id)));
}

export async function createMenu(slug: string, input: unknown): Promise<MenuActionResult> {
  const { venue, db } = await context(slug);
  const check = cleanMenuInput(input);
  if (!check.ok) return check;

  const existing = await menuIds(db, venue.id);
  const problem = menuLimitProblem(existing.length, (await getEntitlements(venue.id)).maxMenus);
  if (problem) return { ok: false, error: problem };

  const { menu } = check;
  const { error } = await db
    .from("menus")
    .insert({ venue_id: venue.id, name: menu.name, position: existing.length, active_days: menu.days, time_from: menu.from, time_to: menu.to });
  if (error) return { ok: false, error: "Die Karte konnte nicht angelegt werden." };
  return done(slug);
}

export async function updateMenu(slug: string, menuId: string, input: unknown): Promise<MenuActionResult> {
  const { venue, db } = await context(slug);
  const check = cleanMenuInput(input);
  if (!check.ok) return check;
  if (!(await ownsMenu(db, venue.id, menuId))) return { ok: false, error: "Karte nicht gefunden." };

  const { menu } = check;
  const { error } = await db.from("menus").update({ name: menu.name, active_days: menu.days, time_from: menu.from, time_to: menu.to }).eq("id", menuId);
  if (error) return { ok: false, error: "Die Karte konnte nicht gespeichert werden." };
  return done(slug);
}

/** Deleting a menu keeps its sections: they fall back to "in allen Karten". */
export async function deleteMenu(slug: string, menuId: string): Promise<MenuActionResult> {
  const { venue, db } = await context(slug);
  if (!(await ownsMenu(db, venue.id, menuId))) return { ok: false, error: "Karte nicht gefunden." };
  const { error } = await db.from("menus").delete().eq("id", menuId);
  if (error) return { ok: false, error: "Die Karte konnte nicht gelöscht werden." };
  await renumber(db, await menuIds(db, venue.id));
  return done(slug);
}

export async function moveMenu(slug: string, menuId: string, direction: -1 | 1): Promise<MenuActionResult> {
  const { venue, db } = await context(slug);
  if (direction !== -1 && direction !== 1) return { ok: false, error: "Ungültige Eingabe." };
  if (!(await ownsMenu(db, venue.id, menuId))) return { ok: false, error: "Karte nicht gefunden." };
  await renumber(db, reorder(await menuIds(db, venue.id), menuId, direction));
  return done(slug);
}

/** Puts a section on one menu, or on all of them (menuId null). */
export async function setSectionMenu(slug: string, sectionId: string, menuId: string | null): Promise<MenuActionResult> {
  const { venue, db } = await context(slug);
  if (!UUID.test(sectionId)) return { ok: false, error: "Bereich nicht gefunden." };
  if (menuId !== null && !(await ownsMenu(db, venue.id, menuId))) return { ok: false, error: "Karte nicht gefunden." };

  const { data, error } = await db.from("sections").update({ menu_id: menuId }).eq("id", sectionId).eq("venue_id", venue.id).select("id");
  if (error || !data?.length) return { ok: false, error: "Bereich nicht gefunden." };
  return done(slug);
}
