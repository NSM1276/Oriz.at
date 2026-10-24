"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements-server";
import { cleanDesign } from "@/lib/print/design";
import { loadDesignContext, loadPlan, savePages } from "@/lib/print/design-server";
import { assignSection, movePage } from "@/lib/print/pages";
import { requireOpenVenue } from "../../venue";

export type DruckResult = { ok: true } | { ok: false; error: string };

const NOT_PRO: DruckResult = { ok: false, error: "Druck-Design ist Teil des Pro-Tarifs." };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every action starts here: a member of the venue, and the plan includes the print design. */
async function proVenue(slug: string) {
  const { venue } = await requireOpenVenue(slug);
  return (await getEntitlements(venue.id)).printDesign ? venue : null;
}

const refresh = (slug: string) => revalidatePath(`/app/${slug}/druck`);

export async function saveDesign(slug: string, input: unknown): Promise<DruckResult> {
  const venue = await proVenue(slug);
  if (!venue) return NOT_PRO;
  const design = cleanDesign(input);
  if (!design) return { ok: false, error: "Ungültige Eingabe." };
  const { error } = await serviceClient()
    .from("print_designs")
    .upsert(
      { venue_id: venue.id, template: design.template, accent: design.accent, show_qr: design.showQr, show_about: design.showAbout, updated_at: new Date().toISOString() },
      { onConflict: "venue_id" },
    );
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  refresh(slug);
  return { ok: true };
}

/** Moves a section to another sheet; `target` is a sheet id or "new". */
export async function placeSection(slug: string, sectionId: string, target: string): Promise<DruckResult> {
  const venue = await proVenue(slug);
  if (!venue) return NOT_PRO;
  if (!UUID.test(sectionId) || typeof target !== "string") return { ok: false, error: "Ungültige Eingabe." };
  const plan = await loadPlan(venue.slug);
  if (!plan || !plan.sectionOrder.includes(sectionId)) return { ok: false, error: "Bereich nicht gefunden." };
  await savePages(venue.id, assignSection(plan.pages, sectionId, target, plan.sectionOrder));
  refresh(slug);
  return { ok: true };
}

export async function shiftSheet(slug: string, sheetId: string, direction: -1 | 1): Promise<DruckResult> {
  const venue = await proVenue(slug);
  if (!venue) return NOT_PRO;
  if (direction !== -1 && direction !== 1) return { ok: false, error: "Ungültige Eingabe." };
  const plan = await loadPlan(venue.slug);
  if (!plan) return { ok: false, error: "Karte nicht gefunden." };
  await savePages(venue.id, movePage(plan.pages, sheetId, direction));
  refresh(slug);
  return { ok: true };
}

/** Starts over with the automatic split of the sections onto sheets. */
export async function resetSheets(slug: string): Promise<DruckResult> {
  const venue = await proVenue(slug);
  if (!venue) return NOT_PRO;
  // The context stores the fresh split itself (checked against the real layout).
  const ctx = await loadDesignContext(venue.slug, null, { forceSuggest: true });
  if (!ctx) return { ok: false, error: "Karte nicht gefunden." };
  refresh(slug);
  return { ok: true };
}
