// tests/services.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MENU_SETUP_PRICE_CENTS,
  PHOTO_MIN,
  PHOTO_PRICE_CENTS,
  canMove,
  checkFiles,
  fileType,
  orderPrice,
  paymentUrl,
  uploadPath,
} from "../src/lib/services.ts";

test("menu setup has one fixed price", () => {
  assert.equal(orderPrice("menu_setup", 0).ok, false); // the number of dishes is needed
  assert.deepEqual(orderPrice("menu_setup", 1), { ok: true, quantity: 1, priceCents: MENU_SETUP_PRICE_CENTS });
  assert.deepEqual(orderPrice("menu_setup", 80), { ok: true, quantity: 80, priceCents: MENU_SETUP_PRICE_CENTS });
  assert.deepEqual(orderPrice("menu_setup", 81), { ok: true, quantity: 81, priceCents: MENU_SETUP_PRICE_CENTS + 1_50 });
  assert.deepEqual(orderPrice("menu_setup", 120), { ok: true, quantity: 120, priceCents: 149_00 + 40 * 1_50 }); // 209 EUR
  assert.equal(orderPrice("menu_setup", 501).ok, false);
  assert.equal(orderPrice("menu_setup", Number.NaN).ok, false);
});

test("photos are paid per photo with a minimum order", () => {
  assert.equal(orderPrice("photo_edit", PHOTO_MIN - 1).ok, false);
  assert.deepEqual(orderPrice("photo_edit", 12), { ok: true, quantity: 12, priceCents: 12 * PHOTO_PRICE_CENTS });
  assert.equal(orderPrice("photo_edit", 1000).ok, false);
});

const f = (name, type = "", size = 1000) => ({ name, type, size });

test("files: formats per service, size, count, link instead of files", () => {
  assert.deepEqual(checkFiles("menu_setup", [f("karte.pdf", "application/pdf"), f("seite2.HEIC")], false), { ok: true });
  assert.deepEqual(checkFiles("menu_setup", [], true), { ok: true });
  assert.equal(checkFiles("menu_setup", [], false).ok, false);
  assert.equal(checkFiles("photo_edit", [f("karte.pdf", "application/pdf")], false).ok, false);
  assert.equal(checkFiles("photo_edit", [], true).ok, false);
  assert.match(checkFiles("menu_setup", [f("film.mov", "video/quicktime")], false).error, /Format/);
  assert.match(checkFiles("menu_setup", [f("riesig.jpg", "image/jpeg", 30 * 1024 * 1024)], false).error, /25 MB/);
});

test("HEIC from a phone without a type is recognised by its extension", () => {
  assert.equal(fileType("IMG_0001.HEIC", ""), "image/heic");
  assert.equal(fileType("karte.docx", "application/octet-stream"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
});

test("upload paths are safe and ordered", () => {
  assert.equal(uploadPath("v", "o", 0, "Speisekarte Seite 1 (neu).pdf"), "v/o/001-Speisekarte_Seite_1_neu_.pdf");
  assert.ok(!uploadPath("v", "o", 1, "../../etc/passwd").includes(".."+"/"));
});

test("status moves", () => {
  assert.ok(canMove("neu", "bezahlt"));
  assert.ok(canMove("bezahlt", "fertig"));
  assert.ok(!canMove("neu", "fertig"));
  assert.ok(!canMove("entwurf", "bezahlt"));
});

test("payment link only for Stripe links, with our order id", () => {
  assert.equal(paymentUrl(undefined, "o1", null), null);
  assert.equal(paymentUrl("https://evil.example/pay", "o1", null), null);
  const url = new URL(paymentUrl("https://buy.stripe.com/test_abc", "o1", "a@b.at"));
  assert.equal(url.searchParams.get("client_reference_id"), "o1");
  assert.equal(url.searchParams.get("prefilled_email"), "a@b.at");
});

import { orderForAdmin, orderReceived, orderStatusChanged } from "../src/lib/email-templates.ts";

const facts = {
  id: "o1", kind: "menu_setup", quantity: 1, priceCents: 14900, venueName: "Gasthaus <Test>",
  contactName: "Anna", contactEmail: "a@b.at", contactPhone: "+43 1 234", fileCount: 3, linkUrl: null,
  notes: "Mittag <b>separat</b>", appUrl: "https://oriz.at/app/x/leistungen",
};

test("emails: payment link when there is one, otherwise we promise to call", () => {
  const withLink = orderReceived(facts, "https://buy.stripe.com/x?client_reference_id=o1");
  assert.match(withLink.text, /Jetzt bezahlen: https:\/\/buy\.stripe\.com/);
  const without = orderReceived(facts, null);
  assert.match(without.text, /melden uns innerhalb eines Werktags/);
});

test("emails: venue names and notes are escaped in HTML", () => {
  const admin = orderForAdmin(facts, "https://oriz.at/admin/auftraege#o1");
  assert.ok(admin.html.includes("Gasthaus &lt;Test&gt;"));
  assert.ok(!admin.html.includes("<b>separat</b>"));
  assert.match(admin.subject, /Neuer Auftrag: Gasthaus <Test>/);
});

test("emails: done for a menu reminds about allergens", () => {
  assert.match(orderStatusChanged(facts, "fertig").text, /Allergene/);
});

import { buildInvoiceDoc, dateDe, euroPlain, invoiceDescription, isInvoiceNumber, SMALL_BUSINESS_NOTE } from "../src/lib/invoice.ts";

test("invoice texts: description, amounts, dates, number format", () => {
  assert.equal(invoiceDescription("menu_setup", 1), "Einrichtung Ihrer digitalen Speisekarte (bis zu 80 Gerichte)");
  assert.equal(invoiceDescription("menu_setup", 80), "Einrichtung Ihrer digitalen Speisekarte (bis zu 80 Gerichte)");
  assert.match(invoiceDescription("menu_setup", 120), /120 Gerichte: 80 inklusive, 40 × 1,50 € Aufpreis/);
  assert.match(invoiceDescription("photo_edit", 12), /12 Gerichtsfotos \(5,00 € pro Foto\)/);
  assert.equal(euroPlain(14900), "149,00 €");
  assert.equal(euroPlain(20900), "209,00 €");
  assert.equal(dateDe("2026-10-23"), "23.10.2026");
  assert.ok(isInvoiceNumber("2026-0001"));
  assert.ok(!isInvoiceNumber("../etc/passwd"));
  assert.ok(!isInvoiceNumber("2026-1"));
});

test("invoice document: small-business note, no VAT line, paid or payable text", () => {
  const base = {
    number: "2026-0001", issuedOn: "2026-10-23", serviceDate: "2026-10-23", recipientName: "Gasthaus Mayer GmbH",
    recipientAddress: "Hauptstraße 1\n1010 Wien", description: invoiceDescription("menu_setup", 60), quantity: 60, amountCents: 14900, paidOn: null,
  };
  const text = (d) => JSON.stringify(d);
  const open = text(buildInvoiceDoc(base));
  assert.ok(open.includes(SMALL_BUSINESS_NOTE));
  assert.ok(open.includes("2026-0001") && open.includes("Gasthaus Mayer GmbH") && open.includes("149,00 €"));
  assert.ok(open.includes("ATU80802758"));
  assert.ok(!/USt-Betrag|MwSt|20 ?%/.test(open)); // no VAT is shown
  assert.ok(open.includes("Zahlbar sofort"));
  assert.ok(text(buildInvoiceDoc({ ...base, paidOn: "2026-10-22" })).includes("am 22.10.2026 beglichen"));
});
