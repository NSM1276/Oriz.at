// Resolves what the TV board actually runs with. No runtime imports — unit-tested with node --test.
//
// Precedence per knob: URL override (testing only) → screen_settings row → venue / default.
import type { ScreenMode, ScreenSettingsRow } from "@/lib/supabase/types";

export const DEFAULT_ROTATION_SEC = 10;

export type ScreenConfig = {
  active: boolean;
  mode: ScreenMode;
  seconds: number;
  spotlight: boolean;
  colorBg: string | null;
  colorPrimary: string | null;
  /** null = every section in position order */
  sectionIds: string[] | null;
  /** { [sectionId]: itemId } */
  heroPins: Record<string, string>;
  lang: string;
  /** Embedded in an iframe: no Realtime, no daily reload, no fullscreen-on-click. */
  preview: boolean;
};

export type ScreenUrlOverrides = {
  /** null = not given in the URL */
  seconds: number | null;
  /** resolved preset colors from `?preset=`, null = not given / unknown */
  preset: { color_bg: string; color_primary: string } | null;
  lang: string;
  preview: boolean;
};

export function resolveScreenConfig(
  row: ScreenSettingsRow | null,
  venue: { color_bg: string | null; color_primary: string | null },
  url: ScreenUrlOverrides,
): ScreenConfig {
  return {
    active: row?.active ?? true,
    mode: row?.mode === "tafel" ? "tafel" : "showcase",
    seconds: url.seconds ?? row?.rotation_sec ?? DEFAULT_ROTATION_SEC,
    spotlight: row?.spotlight ?? true,
    colorBg: url.preset?.color_bg ?? row?.color_bg ?? venue.color_bg ?? null,
    colorPrimary: url.preset?.color_primary ?? row?.color_primary ?? venue.color_primary ?? null,
    sectionIds: Array.isArray(row?.sections) ? row.sections : null,
    heroPins: row?.hero_items && typeof row.hero_items === "object" ? row.hero_items : {},
    lang: url.lang,
    preview: url.preview,
  };
}
