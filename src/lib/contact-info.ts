// How customers reach us. No runtime imports — unit-tested.

/** WhatsApp number in international format without "+" (the same number as on the public site). */
export const WHATSAPP_NUMBER = "4367764292055";

/** wa.me link that opens a chat with the text already typed in. */
export const whatsappUrl = (text?: string) => `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** A source tag from a QR code or link (?ref=markt): short, plain, or nothing. */
export function cleanRef(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,39}$/.test(v) ? v : null;
}

/** wa.me link for a phone number a person told us ("0660 1234567", "+43 660 1234567", "0043…"); null if it is not a usable number. */
export function waLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `43${d.slice(1)}`; // Austrian national format
  return /^\d{8,15}$/.test(d) ? `https://wa.me/${d}` : null;
}

export const LEAD_STATUSES = ["neu", "kontaktiert", "testet", "kunde", "kein_interesse"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  neu: "Neu",
  kontaktiert: "Gesprochen",
  testet: "Testet",
  kunde: "Kunde",
  kein_interesse: "Kein Interesse",
};
export const isLeadStatus = (v: unknown): v is LeadStatus => (LEAD_STATUSES as readonly unknown[]).includes(v);
