"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/auth";
import { COLOR_PRESETS } from "@/lib/colorPresets";
import { linesToImport, parseMenuText } from "@/lib/menu-parser";
import { requireOpenVenue } from "../../venue";

export type StepResult = { ok: true } | { ok: false; error: string };

const MAX_TEXT = 50_000;
const MAX_SECTIONS = 60;
const MAX_ITEMS = 600;
const MAX_NAME = 200;
const MAX_PRICE_CENTS = 10_000_00;

const MENU_THEMES = ["classic", "visual", "modern"] as const;
type MenuTheme = (typeof MENU_THEMES)[number];

/** Parses the pasted text here again — the browser preview is only a preview. */
export async function importMenuText(slug: string, text: string): Promise<StepResult & { items?: number }> {
  const { venue } = await requireOpenVenue(slug);
  if (typeof text !== "string" || !text.trim()) return { ok: false, error: "Bitte die Speisekarte einfügen." };
  if (text.length > MAX_TEXT) return { ok: false, error: "Der Text ist zu lang. Bitte in Teilen einfügen." };

  const { sections } = linesToImport(parseMenuText(text));
  const itemCount = sections.reduce((n, s) => n + s.items.length, 0);
  if (itemCount === 0) return { ok: false, error: "Keine Gerichte erkannt." };
  if (sections.length > MAX_SECTIONS || itemCount > MAX_ITEMS) {
    return { ok: false, error: `Höchstens ${MAX_SECTIONS} Bereiche und ${MAX_ITEMS} Gerichte auf einmal.` };
  }

  const db = serviceClient();
  const { data: existing } = await db
    .from("sections")
    .select("position")
    .eq("venue_id", venue.id)
    .returns<{ position: number }[]>();
  let sectionPosition = (existing ?? []).reduce((max, s) => Math.max(max, s.position), -1) + 1;

  // Add-only, like the super-admin importer: running it twice appends, never wipes.
  for (const section of sections) {
    const { data: inserted, error } = await db
      .from("sections")
      .insert({ venue_id: venue.id, name: section.name.slice(0, MAX_NAME), position: sectionPosition++ })
      .select("id")
      .single<{ id: string }>();
    if (error || !inserted) return { ok: false, error: `Bereich „${section.name}“ konnte nicht angelegt werden.` };

    const { error: itemsError } = await db.from("items").insert(
      section.items.map((it, i) => ({
        venue_id: venue.id,
        section_id: inserted.id,
        name: it.name.slice(0, MAX_NAME),
        // `description` is what every menu view prints under the dish; the detail
        // sheet falls back to it when there is no ai_caption.
        description: it.description,
        price_cents: Math.min(it.price_cents, MAX_PRICE_CENTS),
        price_variants: it.variants.map((v) => ({ label: v.label.slice(0, 30), price_cents: Math.min(v.price_cents, MAX_PRICE_CENTS) })).slice(0, 6),
        // Only what the owner's own text says; the guest menu reads these columns as-is.
        allergens: it.allergens,
        diet_tags: it.diet.length ? JSON.stringify(it.diet) : null,
        is_active: true,
        position: i,
      })),
    );
    if (itemsError) return { ok: false, error: `Gerichte in „${section.name}“ konnten nicht gespeichert werden.` };
  }

  revalidatePath(`/app/${slug}`);
  revalidatePath(`/${slug}`);
  return { ok: true, items: itemCount };
}

export async function saveStyle(slug: string, input: { theme: string; presetId: string }): Promise<StepResult> {
  const { venue } = await requireOpenVenue(slug);
  if (!MENU_THEMES.includes(input.theme as MenuTheme)) return { ok: false, error: "Unbekannte Darstellung." };
  // "custom" keeps the venue's own colours and only changes the layout.
  const preset = COLOR_PRESETS.find((p) => p.id === input.presetId);
  if (!preset && input.presetId !== "custom") return { ok: false, error: "Unbekannte Farbe." };

  const { error } = await serviceClient()
    .from("venues")
    .update(preset ? { menu_theme: input.theme, color_bg: preset.color_bg, color_primary: preset.color_primary } : { menu_theme: input.theme })
    .eq("id", venue.id);
  if (error) return { ok: false, error: "Stil konnte nicht gespeichert werden." };

  revalidatePath(`/${slug}`);
  return { ok: true };
}
