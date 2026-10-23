import Link from "next/link";
import { serviceClient } from "@/lib/auth";
import {
  MENU_SETUP_INCLUDED_DISHES,
  MENU_SETUP_PRICE_CENTS,
  PHOTO_MIN,
  PHOTO_PRICE_CENTS,
  SERVICE_INFO,
  STATUS_LABEL,
  euro,
  paymentUrl,
  type OrderStatus,
  type ServiceKind,
} from "@/lib/services";
import { requireVenue } from "../../venue";
import { CancelButton } from "./CancelButton";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  kind: ServiceKind;
  status: OrderStatus;
  quantity: number;
  price_cents: number;
  contact_email: string | null;
  submitted_at: string | null;
  created_at: string;
};

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200";
const dateFmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", year: "numeric" });

const STATUS_STYLE: Record<OrderStatus, string> = {
  entwurf: "bg-stone-100 text-stone-600",
  neu: "bg-amber-100 text-amber-900",
  bezahlt: "bg-sky-100 text-sky-900",
  in_arbeit: "bg-sky-100 text-sky-900",
  fertig: "bg-emerald-100 text-emerald-900",
  storniert: "bg-stone-100 text-stone-500",
};

function contactInfo() {
  const phone = process.env.NEXT_PUBLIC_SERVICE_PHONE;
  const email = process.env.NEXT_PUBLIC_SERVICE_EMAIL;
  return { phone, email };
}

// Paid services we do by hand. Owners choose here (or from the setup wizard);
// we do the work and mark it done in /admin/auftraege.
export default async function ServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  const { data } = await serviceClient()
    .from("service_orders")
    .select("id, kind, status, quantity, price_cents, contact_email, submitted_at, created_at")
    .eq("venue_id", venue.id)
    .neq("status", "entwurf")
    .order("created_at", { ascending: false })
    .returns<Order[]>();
  const orders = data ?? [];
  const contact = contactInfo();
  const invoiceNumbers = new Map<string, string>();
  if (orders.length) {
    const { data: inv } = await serviceClient().from("invoices").select("order_id, number").eq("venue_id", venue.id).in("order_id", orders.map((o) => o.id)).returns<{ order_id: string; number: string }[]>();
    for (const i of inv ?? []) invoiceNumbers.set(i.order_id, i.number);
  }

  const offers: { kind: ServiceKind; price: string }[] = [
    { kind: "menu_setup", price: `${euro(MENU_SETUP_PRICE_CENTS)} einmalig · bis ${MENU_SETUP_INCLUDED_DISHES} Gerichte` },
    { kind: "photo_edit", price: `${euro(PHOTO_PRICE_CENTS)} pro Foto · ab ${PHOTO_MIN} Fotos` },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Leistungen</h1>
        <p className="mt-1 text-sm text-stone-600">Keine Zeit? Wir erledigen das für Sie — von Hand, innerhalb von 2 Werktagen nach Zahlung.</p>
      </div>

      {offers.map((o) => (
        <section key={o.kind} className={card}>
          <p className="font-semibold">{SERVICE_INFO[o.kind].title}</p>
          <p className="mt-1 text-sm text-stone-600">{SERVICE_INFO[o.kind].short}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{o.price}</span>
            <Link href={`/app/${venue.slug}/leistungen/neu?art=${o.kind}`} className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white">
              Bestellen
            </Link>
          </div>
        </section>
      ))}

      {orders.length > 0 && (
        <section className={card}>
          <p className="font-semibold">Ihre Aufträge</p>
          <ul className="mt-3 divide-y divide-stone-100">
            {orders.map((o) => {
              const pay = o.status === "neu"
                ? paymentUrl(o.kind === "photo_edit" ? process.env.NEXT_PUBLIC_STRIPE_LINK_PHOTO_EDIT : process.env.NEXT_PUBLIC_STRIPE_LINK_MENU_SETUP, o.id, o.contact_email)
                : null;
              return (
                <li key={o.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{SERVICE_INFO[o.kind].title}</p>
                      <p className="text-sm text-stone-500">
                        {dateFmt.format(new Date(o.submitted_at ?? o.created_at))} · {o.kind === "photo_edit" ? `${o.quantity} Fotos · ` : ""}{euro(o.price_cents)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </div>
                  {o.status === "neu" && (
                    <div className="mt-3 space-y-2 rounded-xl bg-stone-50 p-3 text-sm">
                      {pay && (
                        <a href={pay} className="block rounded-xl bg-stone-900 py-2.5 text-center font-medium text-white">Jetzt bezahlen</a>
                      )}
                      <p className="text-stone-600">
                        {pay ? "Lieber zuerst sprechen oder per Überweisung zahlen? " : "Wir melden uns innerhalb eines Werktags, um die Zahlung abzustimmen. "}
                        {contact.phone && <a className="font-medium text-stone-900 underline" href={`tel:${contact.phone.replace(/\s+/g, "")}`}>{contact.phone}</a>}
                        {contact.phone && contact.email && " · "}
                        {contact.email && <a className="font-medium text-stone-900 underline" href={`mailto:${contact.email}`}>{contact.email}</a>}
                      </p>
                      <CancelButton slug={venue.slug} orderId={o.id} />
                    </div>
                  )}
                  {invoiceNumbers.get(o.id) && (
                    <a href={`/api/invoice/${invoiceNumbers.get(o.id)}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium underline">
                      Rechnung {invoiceNumbers.get(o.id)} (PDF)
                    </a>
                  )}
                  {o.status === "fertig" && o.kind === "menu_setup" && (
                    <Link href={`/app/${venue.slug}/speisekarte`} className="mt-2 inline-block text-sm font-medium underline">
                      Speisekarte ansehen und Allergene bestätigen
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
