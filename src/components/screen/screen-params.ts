// Parses the TV board's URL tunables. No runtime imports — unit-tested with node --test.
// The admin tab (next iteration) will replace these with a DB row; keep the shape stable.

export type SearchParams = Record<string, string | string[] | undefined>;

export type ScreenParams = {
  /** seconds per page */
  seconds: number;
  /** id from COLOR_PRESETS or null = use venue colors */
  presetId: string | null;
  /** locale for names/descriptions, "de" = base fields */
  lang: string;
};

export const DEFAULT_SECONDS = 10;
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
      : DEFAULT_SECONDS;

  const rawPreset = first(sp.preset)?.toLowerCase() ?? "";
  const presetId = opts.presetIds.has(rawPreset) ? rawPreset : null;

  const rawLang = first(sp.lang)?.toLowerCase() ?? BASE_LANG;
  const lang = rawLang !== BASE_LANG && opts.enabledLocales.includes(rawLang) ? rawLang : BASE_LANG;

  return { seconds, presetId, lang };
}
