import React from "react";
import { createClient } from "@supabase/supabase-js";
import { DemoItemEditor } from "@/components/demo/DemoItemEditor";
import type { Item, Section, Venue } from "@/lib/supabase/types";

export const revalidate = 0;

const DEMO_VENUE_ID = "47dfcb88-86af-4a94-b749-bbb3d920a911";

type VenueRow = Venue & {
  sections: (Section & { items: Item[] })[];
};

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export default async function DemoPage() {
  const supabase = serviceClient();

  const { data: venue } = await supabase
    .from("venues")
    .select(
      "id, slug, name, about, currency, color_bg, color_primary, owner_id, created_at, sections(id, venue_id, name, position, items(id, section_id, venue_id, name, description, price_cents, image_url, ai_caption, allergens, is_active, position, updated_at))",
    )
    .eq("id", DEMO_VENUE_ID)
    .single<VenueRow>();

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment">
        <p className="font-display italic text-onyx/40">Demo nicht verfügbar.</p>
      </div>
    );
  }

  const isDark = venue.color_bg ? getLuminance(venue.color_bg) < 0.4 : false;
  const bg     = venue.color_bg      ?? "#F5F0EC";
  const text   = isDark ? "#F5F0EC"  : "#0A0A0A";
  const dim    = isDark ? "rgba(245,240,236,0.60)" : "rgba(10,10,10,0.60)";
  const muted  = isDark ? "rgba(245,240,236,0.30)" : "rgba(10,10,10,0.30)";
  const border = isDark ? "rgba(245,240,236,0.10)" : "rgba(10,10,10,0.10)";
  const accent = venue.color_primary ?? "#C69B3C";

  const cssVars = {
    "--color-bg": bg, "--color-text": text, "--color-dim": dim,
    "--color-muted": muted, "--color-border": border, "--accent": accent,
  } as React.CSSProperties;

  const sorted = (venue.sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position);

  return (
    <div style={{ backgroundColor: bg, minHeight: "100dvh" }}>
      {/* Demo banner */}
      <div
        style={{
          backgroundColor: accent,
          padding: "10px 24px",
          textAlign: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <span
          className="font-sans text-[11px] tracking-regal uppercase"
          style={{ color: getLuminance(accent) > 0.4 ? "#0A0A0A" : "#F5F0EC" }}
        >
          Live-Demo · Änderungen werden täglich zurückgesetzt
        </span>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12" style={cssVars}>
        {/* Header */}
        <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
          <div>
            <span
              className="font-sans text-[11px] tracking-regal uppercase"
              style={{ color: accent }}
            >
              ORIZ · Admin-Demo
            </span>
            <h1 className="font-display text-3xl mt-1" style={{ color: text }}>
              {venue.name}
            </h1>
            <p
              className="font-sans text-[11px] mt-2 max-w-xs"
              style={{ color: muted }}
            >
              Preise ändern · Gerichte ein-/ausblenden · Beschreibungen bearbeiten
            </p>
          </div>
          <a
            href={`/${venue.slug}`}
            target="_blank"
            rel="noreferrer"
            className="font-sans text-[10px] tracking-regal uppercase px-4 py-2.5 transition-opacity hover:opacity-70 shrink-0"
            style={{ border: `1px solid ${border}`, color: dim }}
          >
            Gästeansicht →
          </a>
        </div>

        {sorted.map((section) => {
          const items = (section.items ?? [])
            .slice()
            .sort((a, b) => a.position - b.position);
          if (items.length === 0) return null;
          return (
            <section key={section.id} className="mt-12">
              <header className="mb-5 flex items-center gap-4 pt-2">
                <span
                  className="font-sans text-sm tracking-regal uppercase shrink-0"
                  style={{ color: accent, fontWeight: 600 }}
                >
                  {section.name}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: accent, opacity: 0.25 }}
                />
              </header>
              <ul style={{ padding: 0, margin: 0 }}>
                {items.map((item) => (
                  <DemoItemEditor key={item.id} item={item} currency={venue.currency} />
                ))}
              </ul>
            </section>
          );
        })}

        <p
          className="mt-16 font-sans text-[10px] text-center tracking-regal uppercase"
          style={{ color: muted }}
        >
          Demo-Daten · frei erfunden · kein echtes Restaurant
        </p>
      </main>
    </div>
  );
}
