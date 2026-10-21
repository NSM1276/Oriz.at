"use server";

import { cookies } from "next/headers";
import { serviceClient } from "@/lib/auth";
import { hashSecret, newSecret } from "@/lib/secrets";
import { STAFF_COOKIE, STAFF_COOKIE_MAX_AGE, normalizeDeviceName } from "@/lib/service";

export type ClaimResult = { ok: true } | { ok: false; error: string };

/** Uses the one-time pairing token and makes this browser a staff device. */
export async function claimPairing(token: string, rawName: string): Promise<ClaimResult> {
  const name = normalizeDeviceName(String(rawName ?? ""));
  if (!name) return { ok: false, error: "Bitte einen Namen eingeben (max. 40 Zeichen)." };

  const db = serviceClient();
  const now = new Date().toISOString();
  // Marking it used in the same statement that checks it means two phones
  // scanning the same code cannot both get in.
  const { data: pairing } = await db
    .from("staff_pairings")
    .update({ used_at: now })
    .eq("token_hash", hashSecret(String(token ?? "")))
    .is("used_at", null)
    .gt("expires_at", now)
    .select("venue_id")
    .maybeSingle<{ venue_id: string }>();
  if (!pairing) return { ok: false, error: "Dieser Link ist abgelaufen oder wurde schon benutzt." };

  const jar = await cookies();
  const old = jar.get(STAFF_COOKIE)?.value;
  if (old) await db.from("staff_devices").update({ revoked_at: now }).eq("token_hash", hashSecret(old));

  const deviceToken = newSecret();
  const { error } = await db
    .from("staff_devices")
    .insert({ venue_id: pairing.venue_id, name, token_hash: hashSecret(deviceToken) });
  if (error) return { ok: false, error: "Gerät konnte nicht verbunden werden." };

  jar.set(STAFF_COOKIE, deviceToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STAFF_COOKIE_MAX_AGE,
  });
  return { ok: true };
}
