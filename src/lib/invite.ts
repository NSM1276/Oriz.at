// Personal sign-up links. Accounts are opened by invitation only: we talk to the owner first,
// then send a link that works once. No runtime imports besides site.ts — unit-tested.
import { SITE_URL } from "./site.ts";

/** How long a link stays valid. */
export const INVITE_DAYS = 14;

// No 0/o, 1/l/i: a link is sometimes read out or retyped.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const TOKEN_LENGTH = 24;

export function newInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isInviteToken(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9]{20,40}$/.test(v);
}

export function inviteUrl(token: string): string {
  return `${SITE_URL}/registrieren?einladung=${token}`;
}

export function inviteExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITE_DAYS * 24 * 60 * 60 * 1000);
}

export type InviteRow = { used_at: string | null; expires_at: string };
export type InviteState = "open" | "used" | "expired" | "missing";

export function inviteState(row: InviteRow | null | undefined, now: Date = new Date()): InviteState {
  if (!row) return "missing";
  if (row.used_at) return "used";
  return new Date(row.expires_at).getTime() > now.getTime() ? "open" : "expired";
}

/** The WhatsApp message that carries the link to the owner. */
export function inviteMessage(venueName: string, url: string): string {
  return `Guten Tag! Hier ist Ihr persönlicher Zugang zu ORIZ für „${venueName}“:\n${url}\n\nDer Link gilt ${INVITE_DAYS} Tage und nur für Sie. Bei Fragen schreiben Sie mir einfach hier.`;
}
