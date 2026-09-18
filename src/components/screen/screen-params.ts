// Parses the TV board's URL tunables. No runtime imports — unit-tested with node --test.
// These are testing overrides only; the source of truth is the screen_settings row
// (see screen-config.ts for precedence).

export type SearchParams = Record<string, string | string[] | undefined>;

export type ScreenParams = {
  /** seconds per page, null = not given */
  seconds: number | null;
  /** id from COLOR_PRESETS or null = not given / unknown */
  presetId: string | null;
  /** locale for names/descriptions, "de" = base fields */
  lang: string;
  /** `?preview=1` — embedded in an iframe (admin tab, landing page).
   *  No Realtime subscription, no daily reload, no fullscreen-on-click. */
  preview: boolean;
};

export const MIN_SECONDS = 3;
export const MAX_SECONDS = 60;
export const BASE_LANG = "de";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseScreenParams(
  sp: SearchParams,
  opts: { enabledLocales: readonly string[]; presetIds: ReadonlySet<string> },
): ScreenParams {
  const rawS = Number(first(sp.s));
  const seconds =
    Number.isFinite(rawS) && rawS > 0
      ? Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(rawS)))
      : null;

  const rawPreset = first(sp.preset)?.toLowerCase() ?? "";
  const presetId = opts.presetIds.has(rawPreset) ? rawPreset : null;

  const rawLang = first(sp.lang)?.toLowerCase() ?? BASE_LANG;
  const lang = rawLang !== BASE_LANG && opts.enabledLocales.includes(rawLang) ? rawLang : BASE_LANG;

  const preview = first(sp.preview) === "1";

  return { seconds, presetId, lang, preview };
}
