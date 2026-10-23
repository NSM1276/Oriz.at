// Invoices for the paid services. No runtime imports — unit-tested.
// The seller is a Kleinunternehmer (§ 6 Abs. 1 Z 27 UStG): no VAT is shown, the exemption is stated.
// If that changes (turnover above the limit, or an opt-in to regular taxation), this file is the place:
// the note, a VAT line, and the seller's UID requirement all live here.

import { MENU_SETUP_EXTRA_DISH_CENTS, MENU_SETUP_INCLUDED_DISHES, PHOTO_PRICE_CENTS, type ServiceKind } from "./services.ts";

/** Same data as the public Impressum. */
export const SELLER = {
  name: "Nasim Nuridinov e.U.",
  street: "Tscherttegasse 39",
  city: "1120 Wien",
  country: "Österreich",
  uid: "ATU80802758",
  email: "office@oriz.at",
  phone: "+43 677 64292055",
} as const;

export const SMALL_BUSINESS_NOTE = "Umsatzsteuerbefreit – Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG 1994.";

export type InvoiceData = {
  number: string;
  issuedOn: string; // yyyy-mm-dd
  serviceDate: string; // yyyy-mm-dd (Leistungsdatum)
  recipientName: string;
  recipientAddress: string;
  description: string;
  quantity: number;
  amountCents: number;
  paidOn: string | null; // yyyy-mm-dd
};

export const euroPlain = (cents: number) =>
  `${new Intl.NumberFormat("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} €`;

/** "2026-10-23" → "23.10.2026" */
export function dateDe(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

/** The line item the customer reads. For menu setup `quantity` is the number of dishes (1 on very old orders). */
export function invoiceDescription(kind: ServiceKind, quantity: number): string {
  if (kind === "photo_edit") return `Bearbeitung von ${quantity} Gerichtsfotos (${euroPlain(PHOTO_PRICE_CENTS)} pro Foto)`;
  if (quantity <= MENU_SETUP_INCLUDED_DISHES) return `Einrichtung Ihrer digitalen Speisekarte (bis zu ${MENU_SETUP_INCLUDED_DISHES} Gerichte)`;
  const extra = quantity - MENU_SETUP_INCLUDED_DISHES;
  return `Einrichtung Ihrer digitalen Speisekarte (${quantity} Gerichte: ${MENU_SETUP_INCLUDED_DISHES} inklusive, ${extra} × ${euroPlain(MENU_SETUP_EXTRA_DISH_CENTS)} Aufpreis)`;
}

/** Number of the invoice as the counter hands it out: year, dash, four digits. */
export const isInvoiceNumber = (s: string) => /^\d{4}-\d{4,}$/.test(s);

type Cell = Record<string, unknown>;

/** pdfmake document definition (A4). Fonts "Inter" and "Cormorant" are registered by the renderer. */
export function buildInvoiceDoc(inv: InvoiceData): Record<string, unknown> {
  const grey = "#57534e";
  const label = (text: string): Cell => ({ text, fontSize: 8, color: grey, characterSpacing: 0.6, margin: [0, 0, 0, 2] });
  const metaRow = (k: string, v: string): Cell[] => [{ text: k, color: grey }, { text: v }];

  return {
    pageSize: "A4",
    pageMargins: [56, 56, 56, 80],
    defaultStyle: { font: "Inter", fontSize: 10, lineHeight: 1.3, color: "#1c1917" },
    info: { title: `Rechnung ${inv.number}`, author: SELLER.name },
    content: [
      {
        columns: [
          { text: "ORIZ", font: "Cormorant", fontSize: 30, bold: true, width: "*" },
          {
            width: "auto",
            alignment: "right",
            text: [SELLER.name, SELLER.street, `${SELLER.city}, ${SELLER.country}`, `UID ${SELLER.uid}`, SELLER.email, SELLER.phone].join("\n"),
            fontSize: 9,
            color: grey,
          },
        ],
      },
      { text: "Rechnung", font: "Cormorant", fontSize: 24, bold: true, margin: [0, 36, 0, 14] },
      {
        columns: [
          {
            width: "*",
            stack: [label("RECHNUNG AN"), { text: [inv.recipientName, inv.recipientAddress].filter(Boolean).join("\n") }],
          },
          {
            width: 230,
            table: {
              widths: [100, "*"],
              body: [
                metaRow("Rechnungsnummer", inv.number),
                metaRow("Rechnungsdatum", dateDe(inv.issuedOn)),
                metaRow("Leistungsdatum", dateDe(inv.serviceDate)),
              ],
            },
            layout: "noBorders",
          },
        ],
      },
      {
        margin: [0, 32, 0, 0],
        table: {
          widths: ["*", 90],
          headerRows: 1,
          body: [
            [
              { text: "Leistung", bold: true, color: grey, fontSize: 9 },
              { text: "Betrag", bold: true, color: grey, fontSize: 9, alignment: "right" },
            ],
            [
              { text: inv.description },
              { text: euroPlain(inv.amountCents), alignment: "right" },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 0 || i === 1 || i === node.table.body.length ? 0.6 : 0),
          vLineWidth: () => 0,
          hLineColor: () => "#a8a29e",
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
      },
      {
        margin: [0, 14, 0, 0],
        columns: [
          { width: "*", text: "" },
          { width: 190, table: { widths: ["*", "auto"], body: [[{ text: "Gesamtbetrag", bold: true, fontSize: 12 }, { text: euroPlain(inv.amountCents), bold: true, fontSize: 12, alignment: "right" }]] }, layout: "noBorders" },
        ],
      },
      { text: SMALL_BUSINESS_NOTE, margin: [0, 28, 0, 0] },
      {
        text: inv.paidOn ? `Der Betrag wurde am ${dateDe(inv.paidOn)} beglichen. Vielen Dank!` : "Zahlbar sofort nach Erhalt der Rechnung.",
        margin: [0, 8, 0, 0],
        color: grey,
      },
    ],
    footer: {
      margin: [56, 0, 56, 30],
      fontSize: 8,
      color: grey,
      text: `${SELLER.name} · ${SELLER.street}, ${SELLER.city} · UID ${SELLER.uid} · ${SELLER.email}`,
      alignment: "center",
    },
  };
}
