import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClassic } from "@/components/profile/ProfileClassic";
import { ProfileVisual } from "@/components/profile/ProfileVisual";
import { ProfileModern } from "@/components/profile/ProfileModern";
import type { ProfileVenue, ThemeTokens, VenueEvent } from "@/components/profile/types";
import type { MenuData } from "@/lib/supabase/types";

export const revalidate = 0;

const PROFILE_COLUMNS =
  "id, slug, name, logo_url, logo_svg, about, color_primary, color_bg, menu_theme, instagram_url, facebook_url, google_maps_url, tripadvisor_url, website_url, google_review_url, phone, address, price_range, opening_hours, gallery, cover_url, menus(id, name, position, active_days, time_from, time_to)";

function getLuminance(hex: string): number {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function computeTokens(venue: ProfileVenue): ThemeTokens {
  const isDark = venue.color_bg ? getLuminance(venue.color_bg) < 0.4 : false;
  const bg = venue.color_bg ?? "#F5F0EC";
  const text = isDark ? "#F5F0EC" : "#0A0A0A";
  const dim = isDark ? "rgba(245,240,236,0.60)" : "rgba(10,10,10,0.60)";
  const muted = isDark ? "rgba(245,240,236,0.30)" : "rgba(10,10,10,0.30)";
  const border = isDark ? "rgba(245,240,236,0.10)" : "rgba(10,10,10,0.10)";
  const accent = venue.color_primary ?? "#C69B3C";
  const cssVars = {
    "--color-bg": bg,
    "--color-text": text,
    "--color-dim": dim,
    "--color-muted": muted,
    "--color-border": border,
    "--accent": accent,
  } as React.CSSProperties;
  return { isDark, bg, text, dim, muted, border, accent, cssVars };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("venues")
    .select(PROFILE_COLUMNS + ", sections(id, items(allergens))")
    .eq("slug", venueSlug)
    .maybeSingle();

  if (error || !data) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = data as any;

  // Collect unique allergens from all menu items
  type SectionRow = { id: string; items: { allergens: string[] | null }[] };
  const sections: SectionRow[] = (rawData.sections as SectionRow[] | null) ?? [];
  const allergenSet = new Set<string>();
  for (const section of sections) {
    for (const item of section.items) {
      if (Array.isArray(item.allergens)) {
        for (const a of item.allergens) allergenSet.add(a);
      }
    }
  }
  const allergens = Array.from(allergenSet).sort();

  // Fetch upcoming events
  const today = new Date().toISOString().slice(0, 10);
  const { data: eventsRaw } = await supabase
    .from("venue_events")
    .select("id, title, event_date, time_start, duration_hours")
    .eq("venue_id", rawData.id)
    .gte("event_date", today)
    .order("event_date", { ascending: true });
  const events: VenueEvent[] = (eventsRaw ?? []) as VenueEvent[];

  // Sort menus by position
  const menus: MenuData[] = ((rawData.menus as MenuData[] | null) ?? [])
    .slice()
    .sort((a, b) => a.position - b.position);

  const venue = { ...rawData, menus } as unknown as ProfileVenue;
  const t = computeTokens(venue);
  const theme = venue.menu_theme ?? "classic";

  if (theme === "visual") return <ProfileVisual venue={venue} t={t} allergens={allergens} events={events} />;
  if (theme === "modern") return <ProfileModern venue={venue} t={t} allergens={allergens} events={events} />;
  return <ProfileClassic venue={venue} t={t} allergens={allergens} events={events} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueSlug: string }>;
}) {
  const { venueSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("venues")
    .select("name, about")
    .eq("slug", venueSlug)
    .maybeSingle<{ name: string; about: string | null }>();
  if (!data) return { title: "ORIZ" };
  const description = data.about ?? `Informationen zu ${data.name}, präsentiert von ORIZ.`;
  return {
    title: `${data.name} — Info`,
    description,
    openGraph: { title: `${data.name} — Info`, description, siteName: "ORIZ", type: "website" },
    twitter: { card: "summary_large_image", title: `${data.name} — Info`, description },
  };
}
