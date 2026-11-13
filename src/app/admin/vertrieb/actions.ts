"use server";

import { revalidatePath } from "next/cache";
import { getUser, isPlatformAdmin, serviceClient } from "@/lib/auth";
import { isLeadStatus, waLink } from "@/lib/contact-info";
import { inviteExpiry, inviteMessage, inviteUrl, newInviteToken } from "@/lib/invite";

export type LeadResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

async function requireAdmin() {
  const user = await getUser();
  if (!user || !(await isPlatformAdmin(user.id))) throw new Error("forbidden");
  return user;
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

export type InviteResult = { ok: true; url: string; message: string; whatsapp: string | null; expires: string } | { ok: false; error: string };

/**
 * A personal sign-up link for this contact. It works once and for a limited time; making a new one
 * does not cancel an earlier one that is still open (the owner may already have it in WhatsApp).
 */
export async function createInvite(leadId: string): Promise<InviteResult> {
  const user = await requireAdmin();
  if (!UUID.test(leadId)) return { ok: false, error: "Ungültig." };
  const svc = serviceClient();
  const { data: lead } = await svc.schema("casa").from("leads").select("property_name, contact_name, phone").eq("id", leadId).maybeSingle();
  if (!lead) return { ok: false, error: "Kontakt nicht gefunden." };
  const venueName = clean(lead.property_name || lead.contact_name, 200);
  if (!venueName) return { ok: false, error: "Bitte zuerst den Namen des Lokals eintragen." };

  const token = newInviteToken();
  const expires = inviteExpiry();
  const { error } = await svc.from("signup_invites").insert({ token, venue_name: venueName, lead_id: leadId, created_by: user.id, expires_at: expires.toISOString() });
  if (error) return { ok: false, error: "Der Link konnte nicht erstellt werden." };

  const url = inviteUrl(token);
  const message = inviteMessage(venueName, url);
  const wa = waLink(lead.phone);
  revalidatePath("/admin/vertrieb");
  return { ok: true, url, message, whatsapp: wa ? `${wa}?text=${encodeURIComponent(message)}` : null, expires: expires.toISOString() };
}
