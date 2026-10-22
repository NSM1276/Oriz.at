import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadMenuPayload } from "@/lib/menu-loader";
import { loadScreenSettings } from "@/lib/screen-settings-loader";
import { getEntitlements } from "@/lib/entitlements-server";
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

  // Screen belongs to the Pro plan. A TV that is already on the wall shows a calm message
  // instead of an error, and the venue's own team sees the way to switch it on.
  if (!(await getEntitlements(payload.venue.id)).screen) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-8 text-center text-[#F5F0EC]">
        <p className="font-display text-5xl">{payload.venue.name}</p>
        <p className="mt-6 max-w-xl text-2xl leading-relaxed opacity-80">
          Die Karte auf dem Fernseher ist Teil des Pro-Tarifs von ORIZ.
        </p>
        <p className="mt-3 text-lg opacity-60">office@oriz.at</p>
      </main>
    );
  }

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
