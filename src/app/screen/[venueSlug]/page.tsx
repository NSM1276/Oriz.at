import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadMenuPayload } from "@/lib/menu-loader";
import { COLOR_PRESETS, PRESET_IDS } from "@/lib/colorPresets";
import { ScreenBoard } from "@/components/screen/ScreenBoard";
import { parseScreenParams, type SearchParams } from "@/components/screen/screen-params";
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

  const screenParams = parseScreenParams(sp, {
    enabledLocales: payload.venue.enabled_locales ?? [],
    presetIds: PRESET_IDS,
  });

  const preset = screenParams.presetId
    ? COLOR_PRESETS.find((p) => p.id === screenParams.presetId) ?? null
    : null;

  const palette = buildPalette(
    preset?.color_bg ?? payload.venue.color_bg,
    preset?.color_primary ?? payload.venue.color_primary,
  );

  return <ScreenBoard initial={payload} params={screenParams} palette={palette} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  const payload = await loadMenuPayload(venueSlug);
  return {
    title: payload ? `${payload.venue.name} — Screen` : "ORIZ Screen",
    robots: { index: false, follow: false },
  };
}
