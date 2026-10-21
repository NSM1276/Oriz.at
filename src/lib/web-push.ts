// Web Push without a dependency: VAPID (RFC 8292) + aes128gcm payload
// encryption (RFC 8291) on node:crypto. Pure apart from the network call in
// sendPush — the encryption is unit-tested by decrypting it again.

import {
  type ECDH,
  createCipheriv,
  createECDH,
  createPrivateKey,
  hkdfSync,
  randomBytes,
  sign,
} from "node:crypto";

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type VapidKeys = { publicKey: string; privateKey: string; subject: string };

const b64u = (buf: Buffer | Uint8Array) => Buffer.from(buf).toString("base64url");
const fromB64u = (s: string) => Buffer.from(s, "base64url");

export function isPushSubscription(v: unknown): v is PushSubscriptionJSON {
  const s = v as PushSubscriptionJSON;
  return (
    !!s && typeof s.endpoint === "string" && s.endpoint.startsWith("https://") && s.endpoint.length < 1000 &&
    !!s.keys && typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string" &&
    fromB64u(s.keys.p256dh).length === 65 && fromB64u(s.keys.auth).length === 16
  );
}

/** A fresh P-256 key pair in the base64url form browsers and VAPID use. */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return { publicKey: b64u(ecdh.getPublicKey()), privateKey: b64u(ecdh.getPrivateKey()) };
}

export function vapidJwt(audience: string, keys: VapidKeys, now = Math.floor(Date.now() / 1000)): string {
  const pub = fromB64u(keys.publicKey);
  const key = createPrivateKey({
    key: { kty: "EC", crv: "P-256", d: keys.privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) },
    format: "jwk",
  });
  const header = b64u(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(Buffer.from(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: keys.subject })));
  const signature = sign("sha256", Buffer.from(`${header}.${claims}`), { key, dsaEncoding: "ieee-p1363" });
  return `${header}.${claims}.${b64u(signature)}`;
}

/** RFC 8291 aes128gcm body for one record. `salt` and `ephemeral` are injectable for tests. */
export function encryptPayload(
  sub: PushSubscriptionJSON,
  payload: Buffer,
  salt: Buffer = randomBytes(16),
  ephemeral?: ECDH,
): Buffer {
  if (!ephemeral) {
    ephemeral = createECDH("prime256v1");
    ephemeral.generateKeys();
  }
  const uaPublic = fromB64u(sub.keys.p256dh);
  const authSecret = fromB64u(sub.keys.auth);
  const asPublic = ephemeral.getPublicKey();
  const shared = ephemeral.computeSecret(uaPublic);

  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", shared, authSecret, keyInfo, 32));
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));

  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  // 0x02 marks the last (and only) record.
  const body = Buffer.concat([cipher.update(Buffer.concat([payload, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);

  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  return Buffer.concat([salt, recordSize, Buffer.from([asPublic.length]), asPublic, body]);
}

export type PushResult = { ok: true } | { ok: false; gone: boolean; status: number };

/** Sends one notification. `gone` means the subscription is dead and should be dropped. */
export async function sendPush(sub: PushSubscriptionJSON, payload: unknown, keys: VapidKeys): Promise<PushResult> {
  const audience = new URL(sub.endpoint).origin;
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "content-encoding": "aes128gcm",
      "content-type": "application/octet-stream",
      ttl: "300",
      urgency: "high",
      authorization: `vapid t=${vapidJwt(audience, keys)}, k=${keys.publicKey}`,
    },
    body: new Uint8Array(encryptPayload(sub, Buffer.from(JSON.stringify(payload)))),
    signal: AbortSignal.timeout(5000),
  });
  if (res.ok) return { ok: true };
  return { ok: false, gone: res.status === 404 || res.status === 410, status: res.status };
}
