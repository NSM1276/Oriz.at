"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getUser, serviceClient } from "@/lib/auth";
import { adminRecipients, sendEmail } from "@/lib/email";
import { orderForAdmin, orderReceived, type OrderFacts } from "@/lib/email-templates";
import {
  NOTES_MAX,
  OPEN_ORDERS_MAX,
  checkFiles,
  fileType,
  isServiceKind,
  orderPrice,
  paymentUrl,
  uploadPath,
  type ServiceKind,
} from "@/lib/services";
import { requireVenue } from "../../venue";

const BUCKET = "service-uploads";
const LOCALES = ["en", "it", "uk"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StartInput = {
  kind: ServiceKind;
  files: { name: string; size: number; type: string }[];
  linkUrl: string;
  languages: string[];
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};
export type StartResult =
  | { ok: true; orderId: string; uploads: { path: string; token: string; type: string }[] }
  | { ok: false; error: string };
export type SimpleResult = { ok: true } | { ok: false; error: string };

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "oriz.at";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Step 1: check everything, create a draft order and hand out one signed upload slot per file. */
export async function startOrder(slug: string, input: StartInput): Promise<StartResult> {
  const { venue } = await requireVenue(slug);
  const user = await getUser();
  if (!user || !isServiceKind(input.kind)) return { ok: false, error: "Ungültiger Auftrag." };

  const files = (input.files ?? []).map((f) => ({ name: clean(f.name, 200) || "datei", size: Number(f.size) || 0, type: fileType(String(f.name), String(f.type ?? "")) }));
  let linkUrl = clean(input.linkUrl, 500);
  if (linkUrl && !/^https?:\/\//i.test(linkUrl)) linkUrl = `https://${linkUrl}`;
  if (linkUrl) {
    try { new URL(linkUrl); } catch { return { ok: false, error: "Der Link sieht nicht richtig aus." }; }
  }
  if (input.kind === "photo_edit") linkUrl = "";

  const fileCheck = checkFiles(input.kind, files, !!linkUrl);
  if (!fileCheck.ok) return fileCheck;
  const price = orderPrice(input.kind, files.length);
  if (!price.ok) return price;

  const contactPhone = clean(input.contactPhone, 40);
  const contactEmail = clean(input.contactEmail, 200) || user.email || "";
  if (!contactPhone) return { ok: false, error: "Bitte eine Telefonnummer angeben, damit wir Sie bei Fragen erreichen." };

  const db = serviceClient();
  const { count } = await db
    .from("service_orders")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venue.id)
    .in("status", ["entwurf", "neu"]);
  if ((count ?? 0) >= OPEN_ORDERS_MAX) return { ok: false, error: "Sie haben schon mehrere offene Aufträge. Bitte zuerst diese abschließen." };

  const { data: order, error } = await db
    .from("service_orders")
    .insert({
      venue_id: venue.id,
      kind: input.kind,
      quantity: price.quantity,
      price_cents: price.priceCents,
      link_url: linkUrl || null,
      languages: (input.languages ?? []).filter((l) => LOCALES.includes(l)),
      notes: clean(input.notes, NOTES_MAX) || null,
      contact_name: clean(input.contactName, 120) || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone,
      created_by: user.id,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !order) return { ok: false, error: "Auftrag konnte nicht angelegt werden." };

  const stored = files.map((f, i) => ({ path: uploadPath(venue.id, order.id, i, f.name), name: f.name, size: f.size, type: f.type }));
  const uploads: { path: string; token: string; type: string }[] = [];
  for (const f of stored) {
    const { data: slot, error: slotError } = await db.storage.from(BUCKET).createSignedUploadUrl(f.path);
    if (slotError || !slot) {
      await db.from("service_orders").delete().eq("id", order.id);
      return { ok: false, error: "Upload konnte nicht vorbereitet werden." };
    }
    uploads.push({ path: f.path, token: slot.token, type: f.type });
  }
  await db.from("service_orders").update({ files: stored }).eq("id", order.id);
  return { ok: true, orderId: order.id, uploads };
}

/** Step 2: every file is in storage — the order goes live and the emails go out. */
export async function submitOrder(slug: string, orderId: string): Promise<SimpleResult> {
  const { venue } = await requireVenue(slug);
  if (!UUID.test(orderId)) return { ok: false, error: "Auftrag nicht gefunden." };
  const db = serviceClient();
  const { data: order } = await db
    .from("service_orders")
    .select("id, kind, status, quantity, price_cents, link_url, notes, contact_name, contact_email, contact_phone, files")
    .eq("id", orderId)
    .eq("venue_id", venue.id)
    .maybeSingle<{
      id: string; kind: ServiceKind; status: string; quantity: number; price_cents: number; link_url: string | null;
      notes: string | null; contact_name: string | null; contact_email: string | null; contact_phone: string | null;
      files: { path: string }[];
    }>();
  if (!order || order.status !== "entwurf") return { ok: false, error: "Auftrag nicht gefunden." };

  // Never trust the browser's "done": look at what actually landed in storage.
  const { data: listed } = await db.storage.from(BUCKET).list(`${venue.id}/${order.id}`, { limit: 1000 });
  const present = new Set((listed ?? []).map((o) => `${venue.id}/${order.id}/${o.name}`));
  const missing = order.files.filter((f) => !present.has(f.path));
  if (missing.length) return { ok: false, error: `${missing.length} Datei(en) fehlen noch. Bitte erneut senden.` };

  await db.from("service_orders").update({ status: "neu", submitted_at: new Date().toISOString() }).eq("id", order.id);

  const base = await origin();
  const facts: OrderFacts = {
    id: order.id,
    kind: order.kind,
    quantity: order.quantity,
    priceCents: order.price_cents,
    venueName: venue.name,
    contactName: order.contact_name,
    contactEmail: order.contact_email,
    contactPhone: order.contact_phone,
    fileCount: order.files.length,
    linkUrl: order.link_url,
    notes: order.notes,
    appUrl: `${base}/app/${venue.slug}/leistungen`,
  };
  const pay = paymentUrl(stripeLink(order.kind), order.id, order.contact_email);
  await Promise.all([
    order.contact_email ? sendEmail(order.contact_email, orderReceived(facts, pay)) : null,
    adminRecipients().then((to) => sendEmail(to, orderForAdmin(facts, `${base}/admin/auftraege#${order.id}`), order.contact_email ?? undefined)),
  ]);

  revalidatePath(`/app/${slug}/leistungen`);
  return { ok: true };
}

export async function cancelOrder(slug: string, orderId: string): Promise<SimpleResult> {
  const { venue } = await requireVenue(slug);
  if (!UUID.test(orderId)) return { ok: false, error: "Auftrag nicht gefunden." };
  const db = serviceClient();
  // Only before payment; afterwards we sort it out personally.
  const { data } = await db
    .from("service_orders")
    .update({ status: "storniert" })
    .eq("id", orderId)
    .eq("venue_id", venue.id)
    .in("status", ["entwurf", "neu"])
    .select("id");
  if (!data?.length) return { ok: false, error: "Dieser Auftrag kann nicht mehr storniert werden." };
  revalidatePath(`/app/${slug}/leistungen`);
  return { ok: true };
}

function stripeLink(kind: ServiceKind): string | undefined {
  return kind === "photo_edit" ? process.env.NEXT_PUBLIC_STRIPE_LINK_PHOTO_EDIT : process.env.NEXT_PUBLIC_STRIPE_LINK_MENU_SETUP;
}
