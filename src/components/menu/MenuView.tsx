"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionBlock } from "./SectionBlock";
import { VenueLogo } from "@/components/brand/VenueLogo";
import { PoweredByOriz } from "@/components/brand/PoweredByOriz";
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [venue.id]);

  const sectionsWithItems = useMemo(() => {
    return sections.map((s) => {
      const list = Array.from(items.values())
        .filter((it) => it.section_id === s.id)
        .sort((a, b) => a.position - b.position);
      return { ...s, items: list };
    });
  }, [sections, items]);

  const accent = venue.color_primary ?? '#C69B3C';

  return (
    <main
      className="max-w-3xl mx-auto px-6 pt-20 pb-8"
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <header className="text-center">
        <VenueLogo name={venue.name} logoUrl={venue.logo_url} />
        {venue.about && (
          <p className="font-display italic text-onyx/70 text-lg md:text-xl mt-6 max-w-xl mx-auto">
            {venue.about}
          </p>
        )}
        <div className="hairline w-24 mx-auto mt-8" />
      </header>

      {sectionsWithItems.map((s) => (
        <SectionBlock
          key={s.id}
          section={s}
          items={s.items}
          currency={venue.currency}
        />
      ))}

      <PoweredByOriz />
    </main>
  );
}
