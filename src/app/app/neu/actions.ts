"use server";

import { getUser, isPlatformAdmin, memberVenues, serviceClient } from "@/lib/auth";
import { normalizeVenueName, slugProblem } from "@/lib/slug";

export type SlugCheck = { ok: true } | { ok: false; error: string };
export type CreateResult = { ok: true; slug: string } | { ok: false; error: string };

// Self-service gets one venue per account; more go through us until billing
// can charge per venue.
const SELF_SERVICE_VENUE_LIMIT = 1;

async function slugTaken(slug: string): Promise<boolean> {
  const { data } = await serviceClient().from("venues").select("id").eq("slug", slug).maybeSingle();
  return !!data;
}

export async function checkSlug(slug: string): Promise<SlugCheck> {
  if (!(await getUser())) return { ok: false, error: "Bitte anmelden." };
  const problem = slugProblem(slug);
  if (problem) return { ok: false, error: problem };
  if (await slugTaken(slug)) return { ok: false, error: "Diese Adresse ist schon vergeben." };
  return { ok: true };
}

export async function createVenue(input: { name: string; slug: string }): Promise<CreateResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Bitte anmelden." };

  const name = normalizeVenueName(String(input.name ?? ""));
  if (!name) return { ok: false, error: "Bitte den Namen des Lokals eingeben (2–80 Zeichen)." };
  const slug = String(input.slug ?? "");
  const problem = slugProblem(slug);
  if (problem) return { ok: false, error: problem };

  if (!(await isPlatformAdmin(user.id)) && (await memberVenues(user.id)).length >= SELF_SERVICE_VENUE_LIMIT) {
    return { ok: false, error: "Mit diesem Konto ist schon ein Lokal verbunden." };
  }

  // A trigger adds the owner to venue_members and starts the 14-day trial.
  const { error } = await serviceClient()
    .from("venues")
    .insert({ name, slug, owner_id: user.id, plan: "trial" });
  if (error?.code === "23505") return { ok: false, error: "Diese Adresse ist schon vergeben." };
  if (error) return { ok: false, error: "Das Lokal konnte nicht angelegt werden." };
  return { ok: true, slug };
}
