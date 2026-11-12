"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/auth";
import { cleanLocales } from "@/lib/menu-edit";
import { allowedLocales } from "@/lib/entitlements";
import { getEntitlements } from "@/lib/entitlements-server";
import {
  PRICE_RANGES,
  cleanAbout,
  cleanHours,
  normalizeInstagram,
  normalizePhone,
  normalizeUrl,
} from "@/lib/venue-profile";
import { requireOpenVenue } from "../../venue";

export type LokalResult = { ok: true } | { ok: false; error: string };

// One action per part of the "Lokal" page, so a guest sees a saved change at once and a typo
// in one field never blocks the others. Only these columns are written.

function done(slug: string): LokalResult {
  revalidatePath(`/app/${slug}`, "layout");
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/profile`);
  return { ok: true };
}

export async function saveAbout(slug: string, input: { about: string; translations: Record<string, string> }): Promise<LokalResult> {
  const { venue } = await requireOpenVenue(slug);
  const db = serviceClient();
  const { data } = await db.from("venues").select("enabled_locales, translations").eq("id", venue.id).single<{ enabled_locales: string[] | null; translations: Record<string, { about?: string }> | null }>();
  const locales = cleanLocales(data?.enabled_locales ?? [], allowedLocales(await getEntitlements(venue.id)));
  // Languages not on the form keep what they had.
  const translations: Record<string, { about?: string }> = { ...(data?.translations ?? {}) };
  for (const l of locales) {
    const t = cleanAbout(input.translations?.[l]);
    if (t) translations[l] = { ...translations[l], about: t };
    else if (translations[l]) {
      const { about: _drop, ...rest } = translations[l];
      if (Object.keys(rest).length) translations[l] = rest;
      else delete translations[l];
    }
  }
  const { error } = await db.from("venues").update({ about: cleanAbout(input.about), translations }).eq("id", venue.id);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  return done(slug);
}

export async function saveContact(slug: string, input: { phone: string; address: string; mapsUrl: string; priceRange: string }): Promise<LokalResult> {
  const { venue } = await requireOpenVenue(slug);
  const phone = normalizePhone(input.phone);
  if (phone === undefined) return { ok: false, error: "Die Telefonnummer sieht nicht richtig aus, z. B. +43 1 234 5678." };
  const maps = normalizeUrl(input.mapsUrl);
  if (maps === undefined) return { ok: false, error: "Der Kartenlink sieht nicht richtig aus." };
  const address = typeof input.address === "string" ? input.address.replace(/\s+/g, " ").trim().slice(0, 200) || null : null;
  const price = (PRICE_RANGES as readonly string[]).includes(input.priceRange) ? input.priceRange : null;
  const { error } = await serviceClient()
    .from("venues")
    .update({ phone, address, google_maps_url: maps, price_range: price })
    .eq("id", venue.id);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  return done(slug);
}

export async function saveHours(slug: string, hours: unknown): Promise<LokalResult> {
  const { venue } = await requireOpenVenue(slug);
  const { error } = await serviceClient().from("venues").update({ opening_hours: cleanHours(hours) }).eq("id", venue.id);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  return done(slug);
}

export async function saveLinks(
  slug: string,
  input: { website: string; instagram: string; facebook: string; googleReview: string; tripadvisor: string },
): Promise<LokalResult> {
  const { venue } = await requireOpenVenue(slug);
  const fields = {
    website_url: normalizeUrl(input.website),
    instagram_url: normalizeInstagram(input.instagram),
    facebook_url: normalizeUrl(input.facebook),
    google_review_url: normalizeUrl(input.googleReview),
    tripadvisor_url: normalizeUrl(input.tripadvisor),
  };
  const labels: Record<keyof typeof fields, string> = {
    website_url: "Website",
    instagram_url: "Instagram",
    facebook_url: "Facebook",
    google_review_url: "Google-Bewertungen",
    tripadvisor_url: "Tripadvisor",
  };
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) return { ok: false, error: `Der Link bei „${labels[k as keyof typeof fields]}“ sieht nicht richtig aus.` };
  }
  const { error } = await serviceClient().from("venues").update(fields).eq("id", venue.id);
  if (error) return { ok: false, error: "Konnte nicht gespeichert werden." };
  return done(slug);
}
