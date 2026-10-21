// tests/web-push.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createDecipheriv, createECDH, createPublicKey, hkdfSync, randomBytes, verify } from "node:crypto";
import { encryptPayload, generateVapidKeys, isPushSubscription, vapidJwt } from "../src/lib/web-push.ts";

// Plays the browser: owns the subscription keys and decrypts what we send.
function browser() {
  const ua = createECDH("prime256v1");
  ua.generateKeys();
  const auth = randomBytes(16);
  const sub = {
    endpoint: "https://push.example.com/send/abc",
    keys: { p256dh: ua.getPublicKey().toString("base64url"), auth: auth.toString("base64url") },
  };
  function decrypt(body) {
    const salt = body.subarray(0, 16);
    assert.equal(body.readUInt32BE(16), 4096);
    const idLen = body[20];
    const asPublic = body.subarray(21, 21 + idLen);
    const ct = body.subarray(21 + idLen);
    const shared = ua.computeSecret(asPublic);
    const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), ua.getPublicKey(), asPublic]);
    const ikm = Buffer.from(hkdfSync("sha256", shared, auth, keyInfo, 32));
    const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
    const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
    const d = createDecipheriv("aes-128-gcm", cek, nonce);
    d.setAuthTag(ct.subarray(ct.length - 16));
    const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
    assert.equal(plain[plain.length - 1], 2, "last-record delimiter");
    return plain.subarray(0, plain.length - 1).toString();
  }
  return { sub, decrypt };
}

test("payload round-trips through aes128gcm", () => {
  const { sub, decrypt } = browser();
  const payload = JSON.stringify({ title: "Tisch 8", body: "Zahlen" });
  assert.equal(decrypt(encryptPayload(sub, Buffer.from(payload))), payload);
});

test("matches the RFC 8291 Appendix A test vector byte for byte", () => {
  const as = createECDH("prime256v1");
  as.setPrivateKey(Buffer.from("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw", "base64url"));
  const sub = {
    endpoint: "https://push.example.com",
    keys: {
      p256dh: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
      auth: "BTBZMqHH6r4Tts7J_aSIgg",
    },
  };
  const body = encryptPayload(
    sub,
    Buffer.from("When I grow up, I want to be a watermelon"),
    Buffer.from("DGv6ra1nlYgDCS1FRnbzlw", "base64url"),
    as,
  );
  assert.equal(
    body.toString("base64url"),
    "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
  );
});

test("every message uses a fresh salt and key", () => {
  const { sub } = browser();
  const a = encryptPayload(sub, Buffer.from("x"));
  const b = encryptPayload(sub, Buffer.from("x"));
  assert.notDeepEqual(a.subarray(0, 86), b.subarray(0, 86));
});

test("VAPID JWT is ES256-signed by the private key", () => {
  const keys = { ...generateVapidKeys(), subject: "mailto:office@oriz.at" };
  const jwt = vapidJwt("https://push.example.com", keys, 1_800_000_000);
  const [h, c, s] = jwt.split(".");
  const claims = JSON.parse(Buffer.from(c, "base64url").toString());
  assert.deepEqual(claims, { aud: "https://push.example.com", exp: 1_800_000_000 + 43200, sub: "mailto:office@oriz.at" });
  const pub = Buffer.from(keys.publicKey, "base64url");
  const key = createPublicKey({
    key: { kty: "EC", crv: "P-256", x: pub.subarray(1, 33).toString("base64url"), y: pub.subarray(33).toString("base64url") },
    format: "jwk",
  });
  assert.ok(verify("sha256", Buffer.from(`${h}.${c}`), { key, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url")));
});

test("isPushSubscription", () => {
  const { sub } = browser();
  assert.ok(isPushSubscription(sub));
  assert.ok(!isPushSubscription({ ...sub, endpoint: "http://insecure" }));
  assert.ok(!isPushSubscription({ endpoint: sub.endpoint, keys: { p256dh: "x", auth: "y" } }));
  assert.ok(!isPushSubscription(null));
});
