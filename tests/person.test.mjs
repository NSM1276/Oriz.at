// tests/person.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { phoneHref, personInitials, vcard } from "../src/lib/person.ts";
import { PRICE_MONTH, PRICE_YEAR } from "../src/lib/offer.ts";
import { movedGuestPage } from "../src/lib/venue-host.ts";

test("contact card opens in a phone address book", () => {
  const v = vcard("https://www.oriz.at");
  assert.ok(v.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.ok(v.includes("FN:Nasim Nuridinov\r\n"));
  assert.ok(v.includes("TEL;TYPE=CELL:+4367764292055\r\n"));
  assert.ok(v.endsWith("END:VCARD\r\n"));
  assert.equal(phoneHref, "tel:+4367764292055");
  assert.equal(personInitials, "NN");
});

test("prices as written on the site", () => {
  assert.equal(PRICE_MONTH, "19,90 €");
  assert.equal(PRICE_YEAR, "180 €");
});

test("/hallo is our page, not a restaurant called hallo", () => {
  assert.equal(movedGuestPage("/hallo"), null);
  assert.equal(movedGuestPage("/hallo/kontakt.vcf"), null);
});
