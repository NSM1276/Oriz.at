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
  assert.deepEqual(orderPrice("menu_setup", 0), { ok: true, quantity: 1, priceCents: MENU_SETUP_PRICE_CENTS });
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

import { euroNet } from "../src/lib/services.ts";
import { orderForAdmin as orderForAdminNet, orderReceived as orderReceivedNet } from "../src/lib/email-templates.ts";

test("prices for businesses say they are without VAT", () => {
  assert.match(euroNet(149_00), /^€\s149,00 zzgl\. USt$/);
  const facts = {
    id: "x", kind: "menu_setup", quantity: 1, priceCents: 149_00, venueName: "V", contactName: null, contactEmail: null,
    contactPhone: null, fileCount: 0, linkUrl: null, notes: null, appUrl: "https://x",
  };
  assert.match(orderReceivedNet(facts, null).text, /zzgl\. USt/);
  assert.match(orderForAdminNet(facts, "https://x/admin").text, /zzgl\. USt/);
});
