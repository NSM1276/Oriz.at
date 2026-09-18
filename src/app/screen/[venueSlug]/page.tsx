import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadMenuPayload } from "@/lib/menu-loader";
import { loadScreenSettings } from "@/lib/screen-settings-loader";
import { COLOR_PRESETS, PRESET_IDS } from "@/lib/colorPresets";
import { ScreenBoard } from "@/components/screen/ScreenBoard";
import { parseScreenParams, type SearchParams } from "@/components/screen/screen-params";
import { resolveScreenConfig } from "@/components/screen/screen-config";
import { buildPalette } from "@/components/screen/screen-colors";

export const revalidate = 0;

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function ScreenRoute({ params, searchParams }: Props) {
  const [{ venueSlug }, sp] = await Promise.all([params, searchParams]);
  const payload = await loadMenuPayload(venueSlug);
  if (!payload) notFound();

  const settings = await loadScreenSettings(payload.venue.id);

  const url = parseScreenParams(sp, {
    enabledLocales: payload.venue.enabled_locales ?? [],
    presetIds: PRESET_IDS,
  });
  const preset = url.presetId ? COLOR_PRESETS.find((p) => p.id === url.presetId) ?? null : null;

  const config = resolveScreenConfig(settings, payload.venue, {
    seconds: url.seconds,
    preset: preset ? { color_bg: preset.color_bg, color_primary: preset.color_primary } : null,
    lang: url.lang,
    preview: url.preview,
  });

  const palette = buildPalette(config.colorBg, config.colorPrimary);

  return <ScreenBoard initial={payload} config={config} palette={palette} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  const payload = await loadMenuPayload(venueSlug);
  return {
    title: payload ? `${payload.venue.name} — Screen` : "ORIZ Screen",
    robots: { index: false, follow: false },
  };
}
