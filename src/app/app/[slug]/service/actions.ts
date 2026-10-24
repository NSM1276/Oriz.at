"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import QRCode from "qrcode";
import { getUser, serviceClient } from "@/lib/auth";
import { hashSecret, newSecret } from "@/lib/secrets";
import { PAIRING_MINUTES, STAFF_COOKIE, STAFF_COOKIE_MAX_AGE } from "@/lib/service";
import { requireOpenVenue } from "../../venue";

export type PairingResult = { ok: true; url: string; svg: string; expiresAt: string } | { ok: false; error: string };
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setServiceEnabled(slug: string, enabled: boolean): Promise<ActionResult> {
  const { venue } = await requireOpenVenue(slug);
  const { error } = await serviceClient()
    .from("venues")
    .update({ service_calls_enabled: !!enabled })
    .eq("id", venue.id);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  revalidatePath(`/app/${slug}/service`);
  return { ok: true };
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "oriz.at";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** A one-time link + QR, valid for a few minutes, that turns a phone into a staff device. */
export async function createPairing(slug: string): Promise<PairingResult> {
  const { venue } = await requireOpenVenue(slug);
  const user = await getUser();
  const token = newSecret();
  const expiresAt = new Date(Date.now() + PAIRING_MINUTES * 60_000).toISOString();
  const { error } = await serviceClient()
    .from("staff_pairings")
    .insert({ token_hash: hashSecret(token), venue_id: venue.id, created_by: user!.id, expires_at: expiresAt });
  if (error) return { ok: false, error: "Link konnte nicht erstellt werden." };

  const url = `${await origin()}/s/${token}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return { ok: true, url, svg, expiresAt };
}

/** Pairs the browser the owner is using right now. */
export async function pairThisDevice(slug: string, name: string): Promise<ActionResult> {
  const { venue } = await requireOpenVenue(slug);
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 40) || "Verwaltung";
  const token = newSecret();
  const db = serviceClient();

  const jar = await cookies();
  const old = jar.get(STAFF_COOKIE)?.value;
  if (old) await db.from("staff_devices").update({ revoked_at: new Date().toISOString() }).eq("token_hash", hashSecret(old));

  const { error } = await db.from("staff_devices").insert({ venue_id: venue.id, name: clean, token_hash: hashSecret(token) });
  if (error) return { ok: false, error: "Gerät konnte nicht verbunden werden." };
  jar.set(STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STAFF_COOKIE_MAX_AGE,
  });
  revalidatePath(`/app/${slug}/service`);
  return { ok: true };
}

export async function revokeDevice(slug: string, deviceId: string): Promise<ActionResult> {
  const { venue } = await requireOpenVenue(slug);
  const { error } = await serviceClient()
    .from("staff_devices")
    .update({ revoked_at: new Date().toISOString(), push_subscription: null })
    .eq("id", deviceId)
    .eq("venue_id", venue.id);
  if (error) return { ok: false, error: "Konnte nicht getrennt werden." };
  revalidatePath(`/app/${slug}/service`);
  return { ok: true };
}
