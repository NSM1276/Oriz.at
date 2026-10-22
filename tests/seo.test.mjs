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
