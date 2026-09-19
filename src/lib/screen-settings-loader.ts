import { createClient } from "@/lib/supabase/server";
import type { ScreenSettingsRow } from "@/lib/supabase/types";

/** Reads the venue's `screen_settings` row through RLS (public select). null = defaults. */
export async function loadScreenSettings(venueId: string): Promise<ScreenSettingsRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("screen_settings")
    .select("venue_id, active, mode, rotation_sec, spotlight, color_bg, color_primary, sections, hero_items, style, updated_at")
    .eq("venue_id", venueId)
    .maybeSingle<ScreenSettingsRow>();
  if (error || !data) return null;
  return data;
}
