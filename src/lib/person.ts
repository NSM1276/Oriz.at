// The person behind ORIZ, as shown on /hallo (the page the QR code on the business card opens)
// and in the contact card a visitor can save. No runtime imports — unit-tested.

export const PERSON = {
  firstName: "Nasim",
  lastName: "Nuridinov",
  role: "Ihr Ansprechpartner bei ORIZ in Wien",
  phone: "+43 677 64292055",
  email: "office@oriz.at",
  /** A portrait in /public (for example "/hallo/nasim.jpg"); null shows the initials instead. */
  photo: null as string | null,
} as const;

export const personName = `${PERSON.firstName} ${PERSON.lastName}`;
export const personInitials = `${PERSON.firstName[0]}${PERSON.lastName[0]}`;
export const phoneHref = `tel:${PERSON.phone.replace(/\s+/g, "")}`;

/** vCard 3.0, the format every phone address book opens. Lines end in CRLF as the format asks. */
export function vcard(siteUrl: string): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${PERSON.lastName};${PERSON.firstName};;;`,
    `FN:${personName}`,
    "ORG:ORIZ",
    "TITLE:Digitale Speisekarten",
    `TEL;TYPE=CELL:${PERSON.phone.replace(/\s+/g, "")}`,
    `EMAIL;TYPE=WORK:${PERSON.email}`,
    `URL:${siteUrl}`,
    "END:VCARD",
    "",
  ].join("\r\n");
}
