// tests/invite.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { INVITE_DAYS, inviteExpiry, inviteMessage, inviteState, inviteUrl, isInviteToken, newInviteToken } from "../src/lib/invite.ts";

test("tokens are long, plain and different every time", () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const t = newInviteToken();
    assert.ok(isInviteToken(t), t);
    assert.ok(!/[0o1li]/.test(t), `look-alike character in ${t}`);
    seen.add(t);
  }
  assert.equal(seen.size, 200);
  assert.equal(isInviteToken("abc"), false);
  assert.equal(isInviteToken("ABCDEFGHJKMNPQRSTUVWXYZ2"), false);
  assert.equal(isInviteToken("abcdefghjkmnpqrstuvw' or 1=1"), false);
  assert.equal(isInviteToken(null), false);
});

test("the link opens the sign-up page", () => {
  assert.equal(inviteUrl("abcdefghjkmnpqrstuvwxyz2"), "https://www.oriz.at/registrieren?einladung=abcdefghjkmnpqrstuvwxyz2");
});

test("a link works once and for a limited time", () => {
  const now = new Date("2026-11-13T10:00:00Z");
  const expires = inviteExpiry(now).toISOString();
  assert.equal(expires, "2026-11-27T10:00:00.000Z");
  assert.equal(INVITE_DAYS, 14);
  assert.equal(inviteState(null, now), "missing");
  assert.equal(inviteState({ used_at: null, expires_at: expires }, now), "open");
  assert.equal(inviteState({ used_at: "2026-11-14T08:00:00Z", expires_at: expires }, now), "used");
  assert.equal(inviteState({ used_at: null, expires_at: expires }, new Date("2026-11-27T10:00:00Z")), "expired");
});

test("the WhatsApp message names the restaurant and carries the link", () => {
  const m = inviteMessage("Gasthaus zur Linde", "https://www.oriz.at/registrieren?einladung=x");
  assert.ok(m.includes("„Gasthaus zur Linde“"));
  assert.ok(m.includes("https://www.oriz.at/registrieren?einladung=x"));
  assert.ok(m.includes("14 Tage"));
});
