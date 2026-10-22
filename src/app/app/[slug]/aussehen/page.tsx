import { serviceClient } from "@/lib/auth";
import { findPreset } from "@/lib/colorPresets";
import { requireVenue } from "../../venue";
import { StyleStep } from "../start/Steps";

export const dynamic = "force-dynamic";

export default async function LookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { venue } = await requireVenue(slug);
  const { data } = await serviceClient()
    .from("venues")
    .select("menu_theme, color_bg, color_primary")
    .eq("id", venue.id)
    .single<{ menu_theme: string | null; color_bg: string | null; color_primary: string | null }>();
  const preset = findPreset(data?.color_bg);
  const custom = !preset && data?.color_bg ? { bg: data.color_bg, primary: data.color_primary ?? "#C69B3C" } : null;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Aussehen</h1>
      <p className="mb-5 text-sm text-stone-600">Darstellung und Farben der Speisekarte. Die Vorschau zeigt Ihre echte Karte.</p>
      <StyleStep
        slug={venue.slug}
        initialTheme={data?.menu_theme ?? "classic"}
        initialPreset={preset?.id ?? (custom ? "custom" : "pergament")}
        custom={custom}
        nextHref={`/app/${venue.slug}`}
        settings
      />
    </div>
  );
}
