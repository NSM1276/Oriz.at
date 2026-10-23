import "server-only";
import { serviceClient } from "@/lib/auth";
import { getPdfmake } from "@/lib/print/render";
import { buildInvoiceDoc, invoiceDescription, type InvoiceData } from "@/lib/invoice";
import type { ServiceKind } from "@/lib/services";

type InvoiceRow = {
  id: string;
  number: string;
  order_id: string | null;
  venue_id: string | null;
  issued_on: string;
  service_date: string;
  recipient_name: string;
  recipient_address: string;
  description: string;
  quantity: number;
  amount_cents: number;
  paid_on: string | null;
};

export const INVOICE_COLUMNS =
  "id, number, order_id, venue_id, issued_on, service_date, recipient_name, recipient_address, description, quantity, amount_cents, paid_on";

const toData = (r: InvoiceRow): InvoiceData => ({
  number: r.number,
  issuedOn: r.issued_on,
  serviceDate: r.service_date,
  recipientName: r.recipient_name,
  recipientAddress: r.recipient_address,
  description: r.description,
  quantity: r.quantity,
  amountCents: r.amount_cents,
  paidOn: r.paid_on,
});

/** Vienna calendar day, yyyy-mm-dd. */
const viennaDay = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(d);

export type IssueResult = { ok: true; number: string } | { ok: false; error: string };

/** Creates the invoice for a paid order (number and invoice in one database step). One invoice per order. */
export async function issueInvoiceForOrder(orderId: string, createdBy: string, recipientName: string, recipientAddress: string): Promise<IssueResult> {
  const name = recipientName.trim().slice(0, 200);
  const address = recipientAddress.trim().slice(0, 400);
  if (!name) return { ok: false, error: "Bitte den Namen des Rechnungsempfängers angeben." };
  if (!address) return { ok: false, error: "Bitte die Adresse des Rechnungsempfängers angeben." };

  const db = serviceClient();
  const { data: order } = await db
    .from("service_orders")
    .select("id, venue_id, kind, status, quantity, price_cents, paid_at, done_at")
    .eq("id", orderId)
    .maybeSingle<{ id: string; venue_id: string; kind: ServiceKind; status: string; quantity: number; price_cents: number; paid_at: string | null; done_at: string | null }>();
  if (!order) return { ok: false, error: "Auftrag nicht gefunden." };
  if (!["bezahlt", "in_arbeit", "fertig"].includes(order.status)) return { ok: false, error: "Rechnungen gibt es erst, wenn der Auftrag bezahlt ist." };

  const today = viennaDay(new Date());
  const { data, error } = await db
    .rpc("issue_invoice", {
      p_order_id: order.id,
      p_venue_id: order.venue_id,
      p_issued_on: today,
      p_service_date: order.done_at ? viennaDay(new Date(order.done_at)) : today,
      p_recipient_name: name,
      p_recipient_address: address,
      p_description: invoiceDescription(order.kind, order.quantity),
      p_quantity: order.quantity,
      p_amount_cents: order.price_cents,
      p_paid_on: order.paid_at ? viennaDay(new Date(order.paid_at)) : null,
      p_created_by: createdBy,
    })
    .single<{ number: string }>();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Für diesen Auftrag gibt es schon eine Rechnung." };
    console.error("[invoice] issue failed", error);
    return { ok: false, error: "Rechnung konnte nicht erstellt werden." };
  }
  return { ok: true, number: data.number };
}

export async function loadInvoice(number: string): Promise<(InvoiceData & { venueId: string | null }) | null> {
  const { data } = await serviceClient().from("invoices").select(INVOICE_COLUMNS).eq("number", number).maybeSingle<InvoiceRow>();
  return data ? { ...toData(data), venueId: data.venue_id } : null;
}

export async function renderInvoicePdf(inv: InvoiceData): Promise<Buffer> {
  // buildInvoiceDoc returns a plain pdfmake definition.
  return getPdfmake().createPdf(buildInvoiceDoc(inv) as never).getBuffer();
}
