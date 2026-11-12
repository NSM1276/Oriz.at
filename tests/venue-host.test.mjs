// tests/venue-host.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { movedGuestPage, routeVenueHost, slugFromHost, venueHost, venueUrl } from "../src/lib/venue-host.ts";

test("the menu's own address", () => {
  assert.equal(venueUrl("belvedere"), "https://belvedere.oriz.at");
  assert.equal(venueHost("ristorante-tosca"), "ristorante-tosca.oriz.at");
});

test("host → venue", () => {
  assert.equal(slugFromHost("belvedere.oriz.at"), "belvedere");
  assert.equal(slugFromHost("Belvedere.ORIZ.at"), "belvedere");
  assert.equal(slugFromHost("ristorante-tosca.localhost:3000"), "ristorante-tosca");
  assert.equal(slugFromHost("www.oriz.at"), null); // reserved
  assert.equal(slugFromHost("oriz.at"), null);
  assert.equal(slugFromHost("localhost:3000"), null);
  assert.equal(slugFromHost("a.b.oriz.at"), null);
  assert.equal(slugFromHost("belvedere.oriz.at.evil.com"), null);
  assert.equal(slugFromHost("admin.oriz.at"), null);
  assert.equal(slugFromHost("oriz-at.vercel.app"), null);
});

test("requests on a venue subdomain", () => {
  assert.deepEqual(routeVenueHost("belvedere", "/"), { kind: "rewrite", path: "/belvedere" });
  assert.deepEqual(routeVenueHost("belvedere", "/profile"), { kind: "rewrite", path: "/belvedere/profile" });
  assert.deepEqual(routeVenueHost("belvedere", "/print"), { kind: "rewrite", path: "/belvedere/print" });
  assert.deepEqual(routeVenueHost("belvedere", "/belvedere"), { kind: "redirect", path: "/" });
  assert.deepEqual(routeVenueHost("belvedere", "/belvedere/profile"), { kind: "redirect", path: "/profile" });
  assert.deepEqual(routeVenueHost("belvedere", "/api/service/call"), { kind: "pass" });
  assert.deepEqual(routeVenueHost("belvedere", "/t/ABCD2345"), { kind: "pass" });
  assert.deepEqual(routeVenueHost("belvedere", "/robots.txt"), { kind: "pass" });
  assert.deepEqual(routeVenueHost("belvedere", "/icon.svg"), { kind: "pass" });
  assert.deepEqual(routeVenueHost("belvedere", "/app/belvedere"), { kind: "redirect", path: "/app/belvedere", main: true });
  assert.deepEqual(routeVenueHost("belvedere", "/registrieren"), { kind: "redirect", path: "/registrieren", main: true });
  assert.deepEqual(routeVenueHost("belvedere", "/sushi-schonbrunn"), { kind: "redirect", path: "/sushi-schonbrunn", main: true });
});

test("old oriz.at/<slug> links move to the subdomain", () => {
  assert.equal(movedGuestPage("/belvedere"), "https://belvedere.oriz.at");
  assert.equal(movedGuestPage("/belvedere/profile"), "https://belvedere.oriz.at/profile");
  assert.equal(movedGuestPage("/belvedere/xyz"), null);
  assert.equal(movedGuestPage("/"), null);
  for (const p of ["/app", "/admin", "/api", "/en", "/carta", "/demo", "/registrieren", "/impressum", "/datenschutz", "/t", "/i", "/robots.txt", "/sitemap.xml", "/opengraph-image", "/screen", "/casa"]) {
    assert.equal(movedGuestPage(p), null, p);
  }
  assert.equal(movedGuestPage("/app/belvedere"), null);
});
