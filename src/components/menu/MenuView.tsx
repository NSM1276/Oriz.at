"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionBlock } from "./SectionBlock";
import { VenueLogo } from "@/components/brand/VenueLogo";
import type { Item, MenuPayload } from "@/lib/supabase/types";

export function MenuView({ initial }: { initial: MenuPayload }) {
  const { venue, sections } = initial;

  const [items, setItems] = useState<Map<string, Item>>(() => {
    const map = new Map<string, Item>();
    for (const s of sections) for (const it of s.items) map.set(it.id, it);
    return map;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`venue:${venue.id}:items`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `venue_id=eq.${venue.id}`,
        },
        (payload) => {
          setItems((prev) => {
            const next = new Map(prev);
            if (payload.eventType === "DELETE") {
              const old = payload.old as Item;
              if (old?.id) next.delete(old.id);
            } else {
              const row = payload.new as Item;
              if (row?.id) next.set(row.id, row);
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [venue.id]);

  const sectionsWithItems = useMemo(() => {
    return sections.map((s) => {
      const list = Array.from(items.values())
        .filter((it) => it.section_id === s.id)
        .sort((a, b) => a.position - b.position);
      return { ...s, items: list };
    });
  }, [sections, items]);

  useEffect(() => {
    if (venue.color_bg) {
      document.body.style.backgroundColor = venue.color_bg;
      return () => { document.body.style.backgroundColor = ''; };
    }
  }, [venue.color_bg]);

  const isDark = !!venue.color_bg;
  const bg      = venue.color_bg      ?? '#F5F0EC';
  const text    = isDark ? '#F5F0EC'  : '#0A0A0A';
  const dim     = isDark ? 'rgba(245,240,236,0.60)' : 'rgba(10,10,10,0.60)';
  const muted   = isDark ? 'rgba(245,240,236,0.30)' : 'rgba(10,10,10,0.30)';
  const border  = isDark ? 'rgba(245,240,236,0.10)' : 'rgba(10,10,10,0.10)';
  const accent  = venue.color_primary ?? '#C69B3C';

  const cssVars = {
    '--color-bg': bg, '--color-text': text, '--color-dim': dim,
    '--color-muted': muted, '--color-border': border, '--accent': accent,
  } as React.CSSProperties;

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh' }}>
      <main className="max-w-3xl mx-auto px-6 pt-20 pb-8" style={cssVars}>
        <header className="text-center">
          <VenueLogo name={venue.name} logoUrl={venue.logo_url} textColor={text} />
          {venue.about && (
            <p className="font-display italic text-lg md:text-xl mt-6 max-w-xl mx-auto" style={{ color: dim }}>
              {venue.about}
            </p>
          )}
          <div className="w-24 h-px mx-auto mt-8" style={{ backgroundColor: accent, opacity: 0.6 }} />
        </header>

        {sectionsWithItems.map((s) => (
          <SectionBlock key={s.id} section={s} items={s.items} currency={venue.currency} />
        ))}

        <footer className="mt-24 mb-10 flex justify-center">
          <span className="font-sans text-[11px] tracking-regal uppercase" style={{ color: muted }}>
            Powered by ORIZ
          </span>
        </footer>
      </main>
    </div>
  );
}
