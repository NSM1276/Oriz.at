// tests/seo.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROBOTS_DISALLOW, isListedVenue } from "../src/lib/seo.ts";
import { SITE_URL } from "../src/lib/site.ts";

test("the canonical host is the one that answers (www), with no trailing slash", () => {
  assert.equal(SITE_URL, "https://www.oriz.at");
});

test("who is listed: real customers yes, demos and test venues no", () => {
  assert.equal(isListedVenue({ slug: "gasthaus-mayer", status: "active" }), true);
  assert.equal(isListedVenue({ slug: "gasthaus-mayer", status: "trialing" }), true);
  assert.equal(isListedVenue({ slug: "gasthaus-mayer", status: "past_due" }), true);
  assert.equal(isListedVenue({ slug: "belvedere", status: "comped" }), false); // demo, switched on by us
  assert.equal(isListedVenue({ slug: "qa-testlokal-brunnenhof", status: "trialing" }), false); // our test venue
  assert.equal(isListedVenue({ slug: "unbekannt", status: null }), false); // no subscription at all
});

// A small matcher with the rules crawlers use: prefix match, "*" = any text, "$" = end of path.
function blocked(path) {
  return ROBOTS_DISALLOW.some((rule) => {
    const re = new RegExp("^" + rule.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\$$/, "$"));
    return re.test(path);
  });
}

test("robots.txt closes the private paths", () => {
  for (const p of ["/admin", "/admin/login", "/api/service/call", "/app", "/app/belvedere/speisekarte", "/auth/callback", "/service", "/s/abc123", "/t/ABCD2345", "/i", "/screen/belvedere", "/belvedere/print"]) {
    assert.equal(blocked(p), true, `${p} should be blocked`);
  }
});

test("robots.txt leaves every public page open (a plain /i prefix would have blocked /impressum)", () => {
  for (const p of ["/", "/carta", "/casa", "/screen", "/registrieren", "/impressum", "/datenschutz", "/belvedere", "/sushi-schonbrunn", "/casa/belmondo", "/c/hotel-x", "/sitemap.xml"]) {
    assert.equal(blocked(p), false, `${p} must stay open`);
  }
});

import { restaurantJsonLd, jsonLdScript } from "../src/lib/seo.ts";

test("restaurant structured data carries only what the owner filled in", () => {
  const bare = restaurantJsonLd({ slug: "gasthaus-mayer", name: "Gasthaus Mayer" }, SITE_URL);
  assert.equal(bare["@type"], "Restaurant");
  assert.equal(bare.url, "https://www.oriz.at/gasthaus-mayer");
  assert.equal(bare.hasMenu, "https://www.oriz.at/gasthaus-mayer");
  for (const k of ["description", "telephone", "address", "priceRange", "image", "sameAs", "openingHoursSpecification"]) assert.equal(k in bare, false, k);
});

test("restaurant structured data: profile, links and opening hours", () => {
  const ld = restaurantJsonLd({
    slug: "x", name: "X", about: " Hausmannskost ", phone: "+43 1 234", address: "Hauptstraße 1, 1010 Wien", price_range: "€€",
    cover_url: "https://cdn.example/cover.jpg", logo_url: "javascript:alert(1)",
    website_url: "https://x.at", instagram_url: "kein link", facebook_url: "https://facebook.com/x",
    opening_hours: { tue: [["11:30", "14:00"], ["17:30", "22:00"]], mon: [], sun: [["25:00", "26:00"]] },
  }, SITE_URL);
  assert.equal(ld.description, "Hausmannskost");
  assert.deepEqual(ld.address, { "@type": "PostalAddress", streetAddress: "Hauptstraße 1, 1010 Wien" });
  assert.deepEqual(ld.image, ["https://cdn.example/cover.jpg"]);
  assert.deepEqual(ld.sameAs, ["https://x.at", "https://facebook.com/x"]);
  assert.deepEqual(ld.openingHoursSpecification.map((h) => `${h.dayOfWeek} ${h.opens}-${h.closes}`), ["Tuesday 11:30-14:00", "Tuesday 17:30-22:00"]);
});

test("the script payload cannot close its own tag", () => {
  const out = jsonLdScript(restaurantJsonLd({ slug: "x", name: "</script><script>alert(1)</script>" }, SITE_URL));
  assert.ok(!out.includes("</script>"));
  assert.equal(JSON.parse(out).name, "</script><script>alert(1)</script>");
});

import { HOME_DE, HOME_EN } from "../src/lib/home-copy.ts";

test("both language versions of the main page have the same shape and no empty text", () => {
  const shape = (o) => (Array.isArray(o) ? o.map(shape) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)])) : typeof o);
  const strip = (c) => ({ ...c, hero: { ...c.hero, langNote: 0 } });
  assert.deepEqual(shape(strip(HOME_DE)), shape(strip(HOME_EN)));
  for (const c of [HOME_DE, HOME_EN]) {
    const texts = [];
    const walk = (o) => (typeof o === "string" ? texts.push(o) : o && typeof o === "object" && Object.values(o).forEach(walk));
    walk(c);
    assert.ok(texts.every((t) => t.trim().length > 0), `${c.lang}: empty text`);
  }
  assert.equal(HOME_EN.faq.length, HOME_DE.faq.length);
  assert.equal(HOME_EN.switcher.href, "/");
  assert.equal(HOME_DE.switcher.href, "/en");
});

import { cleanRef, whatsappUrl } from "../src/lib/contact-info.ts";

test("source tags from QR links are short and plain, anything else is dropped", () => {
  assert.equal(cleanRef("markt"), "markt");
  assert.equal(cleanRef(" Markt-2026 "), "markt-2026");
  assert.equal(cleanRef("<script>"), null);
  assert.equal(cleanRef("a".repeat(41)), null);
  assert.equal(cleanRef(""), null);
  assert.equal(cleanRef(null), null);
});

test("whatsapp link carries the prefilled text, encoded", () => {
  assert.equal(whatsappUrl(), "https://wa.me/4367764292055");
  assert.equal(whatsappUrl("Hallo, Hilfe & Fragen"), "https://wa.me/4367764292055?text=Hallo%2C%20Hilfe%20%26%20Fragen");
});

import { waLink, isLeadStatus } from "../src/lib/contact-info.ts";

test("whatsapp link from a phone number as people say it", () => {
  assert.equal(waLink("0660 1234567"), "https://wa.me/436601234567");
  assert.equal(waLink("+43 660 1234567"), "https://wa.me/436601234567");
  assert.equal(waLink("0043 660 1234567"), "https://wa.me/436601234567");
  assert.equal(waLink("+49 171 2345678"), "https://wa.me/491712345678");
  assert.equal(waLink("12"), null);
  assert.equal(waLink(null), null);
  assert.equal(waLink("abc"), null);
});

test("lead statuses", () => {
  assert.ok(isLeadStatus("testet"));
  assert.ok(!isLeadStatus("hacked"));
});
