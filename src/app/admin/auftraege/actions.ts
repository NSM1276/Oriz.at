"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getUser, isPlatformAdmin, serviceClient } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { orderStatusChanged } from "@/lib/email-templates";
import { issueInvoiceForOrder } from "@/lib/invoice-server";
import { canMove, type OrderStatus, type ServiceKind } from "@/lib/services";

export type AdminResult = { ok: true; emailed?: boolean } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: OrderStatus[] = ["entwurf", "neu", "bezahlt", "in_arbeit", "fertig", "storniert"];

async function requireAdmin() {
  const user = await getUser();
  if (!user || !(await isPlatformAdmin(user.id))) throw new Error("forbidden");
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "oriz.at";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

type Row = {
  id: string; kind: ServiceKind; status: OrderStatus; quantity: number; price_cents: number;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
  link_url: string | null; notes: string | null; files: unknown[];
  venues: { name: string; slug: string };
};

/** Moves an order on; the owner gets an email for "bezahlt", "in Arbeit" and "fertig". */
export async function setOrderStatus(orderId: string, to: OrderStatus, notify: boolean): Promise<AdminResult> {
  await requireAdmin();
  if (!UUID.test(orderId) || !STATUSES.includes(to)) return { ok: false, error: "Ungültig." };
  const db = serviceClient();
  const { data: order } = await db
    .from("service_orders")
    .select("id, kind, status, quantity, price_cents, contact_name, contact_email, contact_phone, link_url, notes, files, venues(name, slug)")
    .eq("id", orderId)
    .maybeSingle<Row>();
  if (!order) return { ok: false, error: "Auftrag nicht gefunden." };
  if (!canMove(order.status, to)) return { ok: false, error: `Von „${order.status}“ nicht nach „${to}“.` };

  const now = new Date().toISOString();
  const { data: moved } = await db
    .from("service_orders")
    .update({
      status: to,
      ...(to === "bezahlt" && { paid_at: now }),
      ...(to === "fertig" && { done_at: now }),
    })
    .eq("id", order.id)
    .eq("status", order.status)
    .select("id");
  if (!moved?.length) return { ok: false, error: "Wurde gerade geändert — bitte neu laden." };

  let emailed = false;
  if (notify && order.contact_email && (to === "bezahlt" || to === "in_arbeit" || to === "fertig")) {
    const base = await origin();
    const result = await sendEmail(
      order.contact_email,
      orderStatusChanged(
        {
          id: order.id, kind: order.kind, quantity: order.quantity, priceCents: order.price_cents,
          venueName: order.venues.name, contactName: order.contact_name, contactEmail: order.contact_email,
          contactPhone: order.contact_phone, fileCount: order.files.length, linkUrl: order.link_url, notes: order.notes,
          appUrl: to === "fertig" ? `${base}/app/${order.venues.slug}/speisekarte` : `${base}/app/${order.venues.slug}/leistungen`,
        },
        to,
      ),
    );
    emailed = result.sent;
  }
  revalidatePath("/admin/auftraege");
  return { ok: true, emailed };
}

export async function saveAdminNote(orderId: string, note: string): Promise<AdminResult> {
  await requireAdmin();
  if (!UUID.test(orderId)) return { ok: false, error: "Ungültig." };
  const { error } = await serviceClient()
    .from("service_orders")
    .update({ admin_note: note.trim().slice(0, 4000) || null })
    .eq("id", orderId);
  if (error) return { ok: false, error: "Notiz konnte nicht gespeichert werden." };
  revalidatePath("/admin/auftraege");
  return { ok: true };
}

export type InvoiceResult = { ok: true; number: string } | { ok: false; error: string };

/** Invoice for a paid order. The number is final: a wrong invoice is answered with a new one, never edited. */
export async function createInvoice(orderId: string, recipientName: string, recipientAddress: string): Promise<InvoiceResult> {
  const user = await getUser();
  if (!user || !(await isPlatformAdmin(user.id))) throw new Error("forbidden");
  if (!UUID.test(orderId)) return { ok: false, error: "Ungültig." };
  const res = await issueInvoiceForOrder(orderId, user.id, recipientName, recipientAddress);
  revalidatePath("/admin/auftraege");
  return res;
}
