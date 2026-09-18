import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadMenuPayload } from "@/lib/menu-loader";
import { loadScreenSettings } from "@/lib/screen-settings-loader";
import { COLOR_PRESETS, PRESET_IDS } from "@/lib/colorPresets";
import { ScreenBoard } from "@/components/screen/ScreenBoard";
import { parseScreenParams, type SearchParams } from "@/components/screen/screen-params";
import type { ScreenUrlOverrides } from "@/components/screen/screen-config";

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

  const parsed = parseScreenParams(sp, {
    enabledLocales: payload.venue.enabled_locales ?? [],
    presetIds: PRESET_IDS,
  });
  const preset = parsed.presetId
    ? COLOR_PRESETS.find((p) => p.id === parsed.presetId) ?? null
    : null;

  // The board resolves the config itself so a Realtime settings change can be
  // applied live, without reloading the TV.
  const url: ScreenUrlOverrides = {
    seconds: parsed.seconds,
    preset: preset ? { color_bg: preset.color_bg, color_primary: preset.color_primary } : null,
    lang: parsed.lang,
    preview: parsed.preview,
  };

  return <ScreenBoard initial={payload} initialSettings={settings} url={url} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  const payload = await loadMenuPayload(venueSlug);
  return {
    title: payload ? `${payload.venue.name} — Screen` : "ORIZ Screen",
    robots: { index: false, follow: false },
  };
}
