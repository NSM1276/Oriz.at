"use server";

import { revalidatePath } from "next/cache";
import { getUser, isPlatformAdmin, serviceClient } from "@/lib/auth";
import { isLeadStatus } from "@/lib/contact-info";

export type LeadResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

async function requireAdmin() {
  const user = await getUser();
  if (!user || !(await isPlatformAdmin(user.id))) throw new Error("forbidden");
}

/** A person met in person or by phone: only the business name is required. */
export async function addLead(input: { business: string; contact: string; phone: string; note: string }): Promise<LeadResult> {
  await requireAdmin();
  const business = clean(input.business, 200);
  if (!business) return { ok: false, error: "Bitte den Namen des Lokals eintragen." };
  const { error } = await serviceClient()
    .schema("casa")
    .from("leads")
    .insert({
      property_name: business,
      contact_name: clean(input.contact, 120) || null,
      phone: clean(input.phone, 60) || null,
      note: clean(input.note, 2000) || null,
      source: "persoenlich",
      status: "kontaktiert",
    });
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  revalidatePath("/admin/vertrieb");
  return { ok: true };
}

export async function updateLead(id: string, patch: { status?: string; followUpOn?: string | null; note?: string }): Promise<LeadResult> {
  await requireAdmin();
  if (!UUID.test(id)) return { ok: false, error: "Ungültig." };
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) {
    if (!isLeadStatus(patch.status)) return { ok: false, error: "Ungültiger Status." };
    row.status = patch.status;
  }
  if (patch.followUpOn !== undefined) {
    if (patch.followUpOn && !/^\d{4}-\d{2}-\d{2}$/.test(patch.followUpOn)) return { ok: false, error: "Ungültiges Datum." };
    row.follow_up_on = patch.followUpOn || null;
  }
  if (patch.note !== undefined) row.note = clean(patch.note, 2000) || null;
  const { error } = await serviceClient().schema("casa").from("leads").update(row).eq("id", id);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  revalidatePath("/admin/vertrieb");
  return { ok: true };
}
