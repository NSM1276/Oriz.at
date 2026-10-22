// Random tokens we hand out and the hashes we keep instead. Server-side only.

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Random URL-safe secret (32 bytes). */
export function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

/** What we store instead of a secret. */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/**
 * True when `header` is exactly "Bearer <secret>". An unset or empty secret never
 * matches, so a missing env var locks the route instead of opening it.
 * Both sides are hashed first so the comparison has a fixed length.
 */
export function bearerMatches(header: string | null | undefined, secret: string | null | undefined): boolean {
  if (!secret || !header) return false;
  const given = createHash("sha256").update(header).digest();
  const wanted = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(given, wanted);
}
