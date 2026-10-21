// Random tokens we hand out and the hashes we keep instead. Server-side only.

import { createHash, randomBytes } from "node:crypto";

/** Random URL-safe secret (32 bytes). */
export function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

/** What we store instead of a secret. */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}
