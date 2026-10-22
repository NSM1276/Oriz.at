// tests/contact.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseContact, leadRow, makeLimiter, CONTACT_SOURCE } from "../src/lib/contact.ts";
import { contactRequestForAdmin } from "../src/lib/email-templates.ts";

const good = {
  plan: "Pro", venueType: "Restaurant", tables: "11–20", dishes: "40–80", languages: "DE + EN",
  restaurant: "Gasthaus Mayer", name: "Anna Mayer", email: "anna@mayer.at", phone: "+43 660 1234567", website: "www.mayer.at",
};

test("a complete request is accepted and trimmed", () => {
  const r = parseContact({ ...good, restaurant: "  Gasthaus Mayer  " });
  assert.equal(r.ok, true);
  assert.equal(r.data.restaurant, "Gasthaus Mayer");
  assert.equal(r.data.website, "https://www.mayer.at/");
});

test("email and restaurant are required", () => {
  assert.equal(parseContact({ ...good, email: "kein-mail" }).ok, false);
  assert.equal(parseContact({ ...good, email: "" }).ok, false);
  assert.equal(parseContact({ ...good, restaurant: "   " }).ok, false);
  assert.equal(parseContact(null).ok, false);
  assert.equal(parseContact("text").ok, false);
});

test("optional fields may be empty", () => {
  const r = parseContact({ restaurant: "X", email: "a@b.at" });
  assert.equal(r.ok, true);
  assert.equal(r.data.name, null);
  assert.equal(r.data.phone, null);
  assert.equal(r.data.website, null);
});

test("the honeypot is recognised so the route can answer 'ok' without saving", () => {
  const r = parseContact({ ...good, _gotcha: "http://spam.example" });
  assert.equal(r.ok, false);
  assert.equal(r.honeypot, true);
  assert.equal(parseContact({ ...good, _gotcha: "  " }).ok, true);
});

test("line breaks cannot be smuggled into one-line fields (mail subject)", () => {
  const r = parseContact({ ...good, restaurant: "Mayer\r\nBcc: spam@x.at" });
  assert.equal(r.ok, true);
  assert.ok(!/[\r\n]/.test(r.data.restaurant));
});

test("long input is capped", () => {
  const r = parseContact({ ...good, restaurant: "x".repeat(5000), phone: "1".repeat(500) });
  assert.equal(r.data.restaurant.length, 200);
  assert.equal(r.data.phone.length, 60);
});

test("only real http(s) addresses survive as website", () => {
  assert.equal(parseContact({ ...good, website: "javascript:alert(1)" }).data.website, null);
  assert.equal(parseContact({ ...good, website: "kein link" }).data.website, null);
  assert.equal(parseContact({ ...good, website: "localhost" }).data.website, null);
  assert.equal(parseContact({ ...good, website: "https://mayer.at/karte" }).data.website, "https://mayer.at/karte");
});

test("lead row fits the lead inbox columns", () => {
  const row = leadRow(parseContact(good).data);
  assert.equal(row.property_name, "Gasthaus Mayer");
  assert.equal(row.contact_name, "Anna Mayer");
  assert.equal(row.source, CONTACT_SOURCE);
  assert.match(row.message, /Paket: Pro/);
  assert.match(row.message, /Gerichte: 40–80/);
  assert.deepEqual(Object.keys(row).sort(), ["contact_name", "email", "languages", "message", "phone", "property_name", "property_type", "source", "units", "website"]);
});

test("limiter: the sixth request in the window is refused, and the window slides", () => {
  const allow = makeLimiter(5, 1000);
  for (let i = 0; i < 5; i++) assert.equal(allow("1.2.3.4", 100 + i), true);
  assert.equal(allow("1.2.3.4", 200), false);
  assert.equal(allow("5.6.7.8", 200), true); // another visitor is unaffected
  assert.equal(allow("1.2.3.4", 1200), true); // old hits expired
});

test("the notification mail names the restaurant, escapes the text and carries the facts", () => {
  const c = parseContact({ ...good, restaurant: "<b>Mayer</b>" }).data;
  const mail = contactRequestForAdmin(c, "https://www.oriz.at/admin/leads");
  assert.match(mail.subject, /Anfrage: <b>Mayer<\/b> · Pro/);
  assert.ok(!mail.html.includes("<b>Mayer</b>"));
  assert.match(mail.html, /&lt;b&gt;Mayer/);
  assert.match(mail.text, /anna@mayer\.at/);
  assert.match(mail.text, /Tische: 11–20/);
  assert.match(mail.text, /https:\/\/www\.oriz\.at\/admin\/leads/);
});
