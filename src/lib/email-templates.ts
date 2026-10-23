// Texts of the emails we send around service orders. No runtime imports — unit-tested.
// German, short, plain: restaurant owners read these on the phone.

import { STATUS_LABEL, SERVICE_INFO, euroNet, type ServiceKind } from "./services.ts";

export type Email = { subject: string; text: string; html: string };

export type OrderFacts = {
  id: string;
  kind: ServiceKind;
  quantity: number;
  priceCents: number;
  venueName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  fileCount: number;
  linkUrl: string | null;
  notes: string | null;
  appUrl: string;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function html(paragraphs: string[], link?: { href: string; label: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
  const button = link
    ? `<p style="margin:22px 0"><a href="${escapeHtml(link.href)}" style="background:#1c1917;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;display:inline-block">${escapeHtml(link.label)}</a></p>`
    : "";
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.5;color:#1c1917;max-width:520px">${body}${button}<p style="margin:24px 0 0;color:#78716c;font-size:13px">ORIZ · Digitale Speisekarten aus Wien</p></div>`;
}

function what(o: OrderFacts): string {
  return o.kind === "photo_edit"
    ? `${SERVICE_INFO.photo_edit.title}: ${o.quantity} Fotos, ${euroNet(o.priceCents)}`
    : `${SERVICE_INFO.menu_setup.title}: ${euroNet(o.priceCents)}`;
}

/** To the owner, right after they sent the order. */
export function orderReceived(o: OrderFacts, paymentLink: string | null): Email {
  const lines = [
    `Guten Tag${o.contactName ? ` ${o.contactName}` : ""},`,
    `danke für Ihren Auftrag für ${o.venueName}.\n${what(o)}`,
    paymentLink
      ? "Sobald die Zahlung eingegangen ist, beginnen wir. In der Regel ist alles am nächsten Werktag fertig."
      : "Wir melden uns innerhalb eines Werktags bei Ihnen, um die Zahlung abzustimmen. Danach ist alles in der Regel am nächsten Werktag fertig.",
    "Fragen? Antworten Sie einfach auf diese E-Mail.",
  ];
  return {
    subject: `Ihr Auftrag bei ORIZ: ${SERVICE_INFO[o.kind].title}`,
    text: [...lines, paymentLink ? `Jetzt bezahlen: ${paymentLink}` : `Ihre Aufträge: ${o.appUrl}`].join("\n\n"),
    html: html(lines, paymentLink ? { href: paymentLink, label: "Jetzt bezahlen" } : { href: o.appUrl, label: "Auftrag ansehen" }),
  };
}

/** To us, for every new order. */
export function orderForAdmin(o: OrderFacts, adminUrl: string): Email {
  const lines = [
    `Neuer Auftrag: ${o.venueName}`,
    what(o),
    `Kontakt: ${[o.contactName, o.contactEmail, o.contactPhone].filter(Boolean).join(" · ") || "—"}`,
    `Dateien: ${o.fileCount}${o.linkUrl ? `\nLink: ${o.linkUrl}` : ""}`,
    o.notes ? `Wünsche:\n${o.notes}` : "Keine Wünsche angegeben.",
  ];
  return {
    subject: `Neuer Auftrag: ${o.venueName} · ${SERVICE_INFO[o.kind].title}`,
    text: [...lines, adminUrl].join("\n\n"),
    html: html(lines, { href: adminUrl, label: "Auftrag öffnen" }),
  };
}

/** To the owner when we change the status they care about. */
export function orderStatusChanged(o: OrderFacts, status: "bezahlt" | "in_arbeit" | "fertig"): Email {
  const body: Record<typeof status, string> = {
    bezahlt: "Ihre Zahlung ist eingegangen — danke! Wir beginnen jetzt mit Ihrem Auftrag.",
    in_arbeit: "Wir arbeiten gerade an Ihrem Auftrag.",
    fertig:
      o.kind === "photo_edit"
        ? "Ihre Fotos sind fertig und bereits bei Ihren Gerichten hinterlegt. Schauen Sie gern in Ihre Speisekarte."
        : "Ihre Speisekarte ist fertig. Bitte sehen Sie sie durch und bestätigen Sie die Allergene — dafür sind Sie als Betrieb verantwortlich.",
  };
  const lines = [`Guten Tag${o.contactName ? ` ${o.contactName}` : ""},`, body[status], what(o)];
  return {
    subject: `${STATUS_LABEL[status]}: ${SERVICE_INFO[o.kind].title}`,
    text: [...lines, o.appUrl].join("\n\n"),
    html: html(lines, { href: o.appUrl, label: status === "fertig" ? "Speisekarte öffnen" : "Auftrag ansehen" }),
  };
}

/** To us, for every request from the form on /carta. Reply goes to the sender (reply-to is set by the caller). */
export function contactRequestForAdmin(c: {
  plan: string;
  venueType: string;
  tables: string;
  dishes: string;
  languages: string;
  restaurant: string;
  name: string | null;
  email: string;
  phone: string | null;
  website: string | null;
}, leadsUrl: string): Email {
  const lines = [
    `Neue Anfrage über die Website: ${c.restaurant}`,
    `Kontakt: ${[c.name, c.email, c.phone].filter(Boolean).join(" · ")}`,
    [
      c.plan && `Paket: ${c.plan}`,
      c.venueType && `Art des Lokals: ${c.venueType}`,
      c.tables && `Tische: ${c.tables}`,
      c.dishes && `Gerichte: ${c.dishes}`,
      c.languages && `Sprachen: ${c.languages}`,
      c.website && `Website: ${c.website}`,
    ].filter(Boolean).join("\n"),
    "Antworten Sie direkt auf diese E-Mail, die Antwort geht an den Absender.",
  ].filter(Boolean);
  return {
    subject: `Anfrage: ${c.restaurant}${c.plan ? ` · ${c.plan}` : ""}`,
    text: [...lines, leadsUrl].join("\n\n"),
    html: html(lines, { href: leadsUrl, label: "Lead-Inbox öffnen" }),
  };
}
